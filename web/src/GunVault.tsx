import React, { useState, useEffect, useMemo } from 'react';
import { theme } from './theme';
import { getAllGuns, getAllSessions, getPinnedGunIds, togglePinnedGun, updateGun } from './storage';
import { getGunValuation } from './lib/valuationService';
import type { Gun, GunStatus, GunPurpose } from './types';
import { GunSilhouetteImage } from './SimpleSilhouettes';
import { SessionLoggingModal } from './SessionLoggingModal';
import { CSVImportModal } from './CSVImportModal';

type TypeFilter = 'All' | 'Pistol' | 'Rifle' | 'Shotgun' | 'NFA' | 'Suppressor';
type SortOption = 'make' | 'acquiredPriceDesc' | 'acquiredPriceAsc' | 'lastShot';

interface GunVaultProps {
  onGunSelect: (gun: Gun) => void;
  onAddGun: () => void;
  onImportRequest?: () => void;
  refreshKey?: number;
  isPro?: boolean;
  onUpgrade?: (reason: string) => void;
}

export const typeAccent: Record<string, string> = {
  Pistol:     theme.accent,
  Rifle:      theme.blue,
  Shotgun:    theme.green,
  Suppressor: theme.textSecondary,
  NFA:        theme.red,
};

const ALL_STATUSES: GunStatus[] = ['Active', 'Stored', 'Loaned Out', 'Awaiting Repair', 'Sold', 'Transferred'];
const ALL_PURPOSES: GunPurpose[] = ['Plinking', 'Self Defense', 'EDC', 'Hunting', 'Competition', 'Home Defense', 'Duty', 'Collector'];

export function GunVault({ onGunSelect, onAddGun, onImportRequest, refreshKey, isPro, onUpgrade }: GunVaultProps) {
  const [guns, setGuns]               = useState<Gun[]>([]);
  const [lastShotMap, setLastShotMap]         = useState<Record<string, string>>({});
  const [sessionCountMap, setSessionCountMap] = useState<Record<string, number>>({});
  const [pinnedGunIds, setPinnedGunIds]       = useState<string[]>(() => getPinnedGunIds());
  const pinnedLongPressTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [contextMenuGun, setContextMenuGun]   = useState<Gun | null>(null);
  const [search, setSearch]     = useState('');
  const [typeFilter, setTypeFilter]   = useState<TypeFilter>('All');
  const [caliberFilter, setCaliberFilter] = useState<string>('');
  const [actionFilter, setActionFilter]   = useState<string>('');
  const [statusFilter, setStatusFilter]   = useState<GunStatus | ''>('');
  const [purposeFilter, setPurposeFilter] = useState<GunPurpose | ''>('');
  const [sortBy, setSortBy]       = useState<SortOption>('make');
  const [showFilters, setShowFilters] = useState(false);
  const [quickLogGun, setQuickLogGun] = useState<Gun | null>(null);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [showIssuesSheet, setShowIssuesSheet] = useState(false);
  const [valuingAll, setValuingAll] = useState(false);
  const [valuingProgress, setValuingProgress] = useState<{ done: number; total: number } | null>(null);

  useEffect(() => {
    const allGuns = getAllGuns();
    setGuns(allGuns);

    // Build last-shot and session count maps
    const sessions = getAllSessions();
    const map: Record<string, string> = {};
    const countMap: Record<string, number> = {};
    for (const s of sessions) {
      if (!map[s.gunId] || s.date > map[s.gunId]) map[s.gunId] = s.date;
      countMap[s.gunId] = (countMap[s.gunId] || 0) + 1;
    }
    setLastShotMap(map);
    setSessionCountMap(countMap);
  }, [refreshKey]);

  async function refreshAllFMV() {
    const activeGuns = guns.filter(g => g.status !== 'Sold' && g.status !== 'Transferred');
    if (!activeGuns.length) return;
    setValuingAll(true);
    setValuingProgress({ done: 0, total: activeGuns.length });
    let done = 0;
    for (const g of activeGuns) {
      try {
        const result = await getGunValuation({
          make: g.make, model: g.model,
          caliber: g.caliber, condition: g.condition ?? 'Very Good',
        });
        updateGun(g.id, { estimatedFMV: result.median, fmvUpdated: result.timestamp });
        done++;
        setValuingProgress({ done, total: activeGuns.length });
        await new Promise(r => setTimeout(r, 500));
      } catch {
        done++;
        setValuingProgress({ done, total: activeGuns.length });
      }
    }
    setGuns(getAllGuns());
    setValuingAll(false);
    setValuingProgress(null);
  }

  // ── Step 1: type-filtered set (used to derive cascading options) ───────────
  const typeFiltered = useMemo(() =>
    guns.filter(g => typeFilter === 'All' || g.type === typeFilter),
  [guns, typeFilter]);

  // ── Step 2: cascading option lists ────────────────────────────────────────
  const availableCalibers = useMemo(() =>
    [...new Set(typeFiltered.map(g => g.caliber))].sort(),
  [typeFiltered]);

  const caliberFiltered = useMemo(() =>
    caliberFilter ? typeFiltered.filter(g => g.caliber === caliberFilter) : typeFiltered,
  [typeFiltered, caliberFilter]);

  const availableActions = useMemo(() =>
    [...new Set(caliberFiltered.map(g => g.action))].sort(),
  [caliberFiltered]);

  const actionFiltered = useMemo(() =>
    actionFilter ? caliberFiltered.filter(g => g.action === actionFilter) : caliberFiltered,
  [caliberFiltered, actionFilter]);

  const availableStatuses = useMemo(() =>
    [...new Set(actionFiltered.map(g => g.status))].sort() as GunStatus[],
  [actionFiltered]);

  const statusFiltered = useMemo(() =>
    statusFilter ? actionFiltered.filter(g => g.status === statusFilter) : actionFiltered,
  [actionFiltered, statusFilter]);

  const availablePurposes = useMemo(() =>
    [...new Set(statusFiltered.flatMap(g => g.purpose || []))].sort() as GunPurpose[],
  [statusFiltered]);

  // ── Search normalization ──────────────────────────────────────────────────
  function normalizeSearch(s: string): string {
    return s
      .toLowerCase()
      .replace(/[-_\s/]+/g, '')  // remove hyphens, underscores, spaces, slashes
      .replace(/\./g, '');        // remove dots
  }

  const ALIASES: Record<string, string[]> = {
    'ar15': ['m16', 'm4', 'ar15'],
    '9mm': ['9x19', 'parabellum', '9mm'],
    '223': ['556', '556nato', '223remington'],
  };

  function getAliasGroup(normQuery: string): string[] | null {
    for (const [key, group] of Object.entries(ALIASES)) {
      if (normQuery === key || group.includes(normQuery)) {
        return group;
      }
    }
    return null;
  }

  // ── Step 3: search + purpose filter ──────────────────────────────────────
  const filtered = useMemo(() => {
    let list = statusFiltered;
    if (purposeFilter) list = list.filter(g => g.purpose?.includes(purposeFilter));
    if (search) {
      const normQuery = normalizeSearch(search);
      const aliasGroup = getAliasGroup(normQuery);
      list = list.filter(g => {
        const fields = [g.make, g.model, g.caliber, g.displayName || ''].map(normalizeSearch);
        const directMatch = fields.some(f => f.includes(normQuery));
        if (directMatch) return true;
        if (aliasGroup) {
          return fields.some(f => aliasGroup.some(alias => f.includes(alias)));
        }
        return false;
      });
    }
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case 'acquiredPriceDesc': return (b.acquiredPrice || 0) - (a.acquiredPrice || 0);
        case 'acquiredPriceAsc':  return (a.acquiredPrice || 0) - (b.acquiredPrice || 0);
        case 'lastShot': {
          const dA = lastShotMap[a.id] || '';
          const dB = lastShotMap[b.id] || '';
          return dB.localeCompare(dA);
        }
        default: return a.make.localeCompare(b.make) || a.model.localeCompare(b.model);
      }
    });
  }, [statusFiltered, purposeFilter, search, sortBy, lastShotMap]);

  // ── Type chip counts ───────────────────────────────────────────────────────
  const typeCounts: Record<TypeFilter, number> = {
    All:       guns.length,
    Pistol:    guns.filter(g => g.type === 'Pistol').length,
    Rifle:     guns.filter(g => g.type === 'Rifle').length,
    Shotgun:   guns.filter(g => g.type === 'Shotgun').length,
    NFA:       guns.filter(g => g.type === 'NFA').length,
    Suppressor: guns.filter(g => g.type === 'Suppressor').length,
  };

  // ── Needs Attention (clean overdue + open issues only) ──────────────────────
  const attentionGuns = useMemo(() => {
    return guns
      .filter(g => g.status !== 'Sold' && g.status !== 'Transferred')
      .map(g => {
        const shotsSince = g.lastCleanedRoundCount != null
          ? (g.roundCount || 0) - g.lastCleanedRoundCount
          : null;
        const reasons: string[] = [];
        if (shotsSince != null && shotsSince >= 500) reasons.push(`${shotsSince} shots since clean`);
        if (g.openIssues) reasons.push(g.openIssues.length > 40 ? g.openIssues.slice(0, 40) + '…' : g.openIssues);
        return { gun: g, reasons };
      })
      .filter(item => item.reasons.length > 0);
  }, [guns]);

  const activeFilterCount = [caliberFilter, actionFilter, statusFilter, purposeFilter].filter(Boolean).length;

  function clearAllFilters() {
    setCaliberFilter('');
    setActionFilter('');
    setStatusFilter('');
    setPurposeFilter('');
    setTypeFilter('All');
    setSearch('');
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 10px',
    backgroundColor: theme.bg,
    border: `0.5px solid ${theme.border}`,
    borderRadius: '6px',
    color: theme.textSecondary,
    fontFamily: 'monospace',
    fontSize: '11px',
    cursor: 'pointer',
    outline: 'none',
  };

  const filterLabel: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '9px',
    letterSpacing: '1px',
    color: theme.textMuted,
    textTransform: 'uppercase',
    marginBottom: '4px',
  };

  return (
    <div style={{
      backgroundColor: theme.bg,
      padding: '16px',
      paddingBottom: '24px',
      overflowX: 'hidden',
      boxSizing: 'border-box',
    }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: '42px', fontWeight: 700, color: theme.textPrimary, lineHeight: 1 }}>
            {typeFilter === 'All' ? guns.length : filtered.length}
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, letterSpacing: '1px', marginTop: '2px' }}>
            {typeFilter === 'All'
              ? 'FIREARMS'
              : `${filtered.length} of ${guns.length} FIREARMS`}
          </div>
          {guns.length > 0 && (() => {
            const totalFMV = guns
              .filter(g => g.status !== 'Sold' && g.status !== 'Transferred')
              .reduce((sum, g) => sum + (g.estimatedFMV || 0), 0);
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', flexWrap: 'wrap' }}>
                {totalFMV > 0 && (
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>
                    Est. Market Value ${totalFMV.toLocaleString()}
                  </div>
                )}
                <button
                  onClick={() => { if (!isPro) { onUpgrade?.('fmv_refresh_all'); return; } refreshAllFMV(); }}
                  disabled={valuingAll}
                  style={{
                    fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.5px',
                    padding: '2px 7px', borderRadius: '3px', border: `0.5px solid ${theme.accent}`,
                    color: theme.accent, background: 'none', cursor: valuingAll ? 'default' : 'pointer',
                    opacity: valuingAll ? 0.7 : 1,
                  }}
                >
                  {valuingAll && valuingProgress
                    ? `${valuingProgress.done}/${valuingProgress.total}`
                    : 'REFRESH VALUES'}
                  {!isPro && <span style={{ marginLeft: '6px', fontSize: '8px', opacity: 0.7 }}>PRO</span>}
                </button>
              </div>
            );
          })()}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, letterSpacing: '0.5px' }}>
            {filtered.length !== guns.length ? `${filtered.length} shown` : ''}
          </div>
        </div>
      </div>

      {/* ── MAINTENANCE ALERT BAR (V2) ── */}
      {attentionGuns.length > 0 && (
        <button
          onClick={() => {
            setTypeFilter('All');
            setCaliberFilter('');
            setActionFilter('');
            setStatusFilter('');
            setPurposeFilter('');
            setSearch('');
            // Filter to only guns needing attention via a search term approach isn't ideal,
            // so we surface the needs-attention section instead by toggling it
          }}
          style={{
            width: '100%',
            marginBottom: '10px',
            padding: '8px 12px',
            backgroundColor: 'transparent',
            border: `0.5px solid ${theme.accent}`,
            borderRadius: '6px',
            textAlign: 'left',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.accent, letterSpacing: '0.5px' }}>
            {attentionGuns.length} gun{attentionGuns.length !== 1 ? 's' : ''} due for cleaning
          </span>
        </button>
      )}

      {/* ── SEARCH ROW ── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search make, model, caliber..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1,
            padding: '10px 12px',
            backgroundColor: theme.surface,
            border: `0.5px solid ${theme.border}`,
            borderRadius: '6px',
            color: theme.textPrimary,
            fontFamily: 'monospace',
            fontSize: '12px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* ── TYPE METADATA STRIP + SORT & FILTER ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
          {(['Pistol', 'Rifle', 'Shotgun', 'NFA', 'Suppressor'] as TypeFilter[])
            .filter(t => typeCounts[t] > 0)
            .map((t, i, arr) => {
              const label = t === 'Pistol' ? 'Handgun' : t;
              const isActive = typeFilter === t;
              return (
                <span key={t} style={{
                  fontFamily: 'monospace',
                  fontSize: '10px',
                  color: isActive ? theme.accent : theme.textMuted,
                  fontWeight: isActive ? 700 : 400,
                  letterSpacing: '0.3px',
                  whiteSpace: 'nowrap',
                }}>
                  {label} {typeCounts[t]}{i < arr.length - 1 ? ' ·' : ''}
                </span>
              );
            })}
        </div>
        <button
          onClick={() => setShowFilters(true)}
          style={{
            padding: '6px 10px',
            backgroundColor: (activeFilterCount > 0 || typeFilter !== 'All') ? 'rgba(255,212,59,0.08)' : theme.surface,
            border: `0.5px solid ${(activeFilterCount > 0 || typeFilter !== 'All') ? theme.accent : theme.border}`,
            borderRadius: '5px',
            color: (activeFilterCount > 0 || typeFilter !== 'All') ? theme.accent : theme.textMuted,
            fontFamily: 'monospace',
            fontSize: '9px',
            letterSpacing: '0.5px',
            fontWeight: 600,
            cursor: 'pointer',
            flexShrink: 0,
            marginLeft: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          {(activeFilterCount > 0 || typeFilter !== 'All')
            ? `SORT & FILTER (${activeFilterCount + (typeFilter !== 'All' ? 1 : 0)})`
            : 'SORT & FILTER'}
        </button>
      </div>

      {/* ── CLEANING STATUS LEGEND ── */}
      {guns.some(g => g.lastCleanedRoundCount != null) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#ffd43b', flexShrink: 0 }} />
            <span style={{ fontFamily: 'monospace', fontSize: '8px', color: theme.textMuted, letterSpacing: '0.3px' }}>Near threshold</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#ff4444', flexShrink: 0 }} />
            <span style={{ fontFamily: 'monospace', fontSize: '8px', color: theme.textMuted, letterSpacing: '0.3px' }}>Cleaning overdue</span>
          </div>
        </div>
      )}

      {/* ── SORT & FILTER BOTTOM SHEET ── */}
      {showFilters && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setShowFilters(false); }}
        >
          <div style={{ width: '100%', maxWidth: '480px', backgroundColor: theme.surface, borderRadius: '12px 12px 0 0', padding: '20px 16px 40px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: theme.textPrimary, letterSpacing: '1px' }}>SORT & FILTER</div>
              <button onClick={() => setShowFilters(false)} style={{ background: 'none', border: 'none', color: theme.textMuted, fontSize: '20px', cursor: 'pointer', padding: '0 4px' }}>×</button>
            </div>

            {/* Sort */}
            <div style={{ marginBottom: '18px' }}>
              <div style={filterLabel}>Sort By</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {([['make', 'A–Z'], ['lastShot', 'Last Shot'], ['acquiredPriceDesc', 'Price ↓'], ['acquiredPriceAsc', 'Price ↑']] as [SortOption, string][]).map(([val, lbl]) => (
                  <button key={val} onClick={() => setSortBy(val)} style={{
                    padding: '5px 10px',
                    backgroundColor: sortBy === val ? theme.accent : 'transparent',
                    border: `0.5px solid ${sortBy === val ? theme.accent : theme.border}`,
                    borderRadius: '4px',
                    color: sortBy === val ? theme.bg : theme.textMuted,
                    fontFamily: 'monospace', fontSize: '10px',
                    cursor: 'pointer', fontWeight: sortBy === val ? 700 : 400,
                  }}>{lbl}</button>
                ))}
              </div>
            </div>

            {/* Type */}
            <div style={{ marginBottom: '18px' }}>
              <div style={filterLabel}>Type</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {(['All', 'Pistol', 'Rifle', 'Shotgun', 'NFA', 'Suppressor'] as TypeFilter[]).filter(t => t === 'All' || typeCounts[t] > 0).map(t => {
                  const lbl = t === 'Pistol' ? 'Handgun' : t === 'All' ? 'All Types' : t;
                  return (
                    <button key={t} onClick={() => { setTypeFilter(t); setCaliberFilter(''); setActionFilter(''); }} style={{
                      padding: '5px 10px',
                      backgroundColor: typeFilter === t ? theme.accent : 'transparent',
                      border: `0.5px solid ${typeFilter === t ? theme.accent : theme.border}`,
                      borderRadius: '4px',
                      color: typeFilter === t ? theme.bg : theme.textMuted,
                      fontFamily: 'monospace', fontSize: '10px',
                      cursor: 'pointer', fontWeight: typeFilter === t ? 700 : 400,
                    }}>{lbl}{t !== 'All' ? ` ${typeCounts[t]}` : ''}</button>
                  );
                })}
              </div>
            </div>

            {/* Caliber + Action */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
              <div>
                <div style={filterLabel}>Caliber</div>
                <select value={caliberFilter} onChange={e => { setCaliberFilter(e.target.value); setActionFilter(''); }} style={selectStyle}>
                  <option value="">All</option>
                  {availableCalibers.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <div style={filterLabel}>Action</div>
                <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} style={selectStyle}>
                  <option value="">All</option>
                  {availableActions.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>

            {/* Status + Purpose */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              <div>
                <div style={filterLabel}>Status</div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as GunStatus | '')} style={selectStyle}>
                  <option value="">All</option>
                  {availableStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <div style={filterLabel}>Purpose</div>
                <select value={purposeFilter} onChange={e => setPurposeFilter(e.target.value as GunPurpose | '')} style={{ ...selectStyle, color: availablePurposes.length === 0 ? theme.textMuted : theme.textSecondary }} disabled={availablePurposes.length === 0}>
                  <option value="">All</option>
                  {availablePurposes.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {(activeFilterCount > 0 || typeFilter !== 'All') && (
                <button onClick={clearAllFilters} style={{
                  flex: 1, padding: '10px',
                  backgroundColor: 'transparent',
                  border: `0.5px solid ${theme.border}`,
                  borderRadius: '5px',
                  color: theme.textMuted,
                  fontFamily: 'monospace', fontSize: '10px',
                  letterSpacing: '0.8px', cursor: 'pointer',
                }}>CLEAR ALL</button>
              )}
              <button onClick={() => setShowFilters(false)} style={{
                flex: 1, padding: '10px',
                backgroundColor: theme.accent, border: 'none',
                borderRadius: '5px', color: theme.bg,
                fontFamily: 'monospace', fontSize: '10px',
                fontWeight: 700, letterSpacing: '0.8px', cursor: 'pointer',
              }}>DONE</button>
            </div>
          </div>
        </div>
      )}

      {/* ── NEEDS ATTENTION ── */}
      {attentionGuns.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '1.2px', color: theme.orange, textTransform: 'uppercase' }}>
              NEEDS ATTENTION ({attentionGuns.length})
            </div>
            {attentionGuns.length > 3 && (
              <button onClick={() => setShowIssuesSheet(true)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'monospace', fontSize: '9px',
                color: theme.orange, textDecoration: 'underline', padding: 0,
              }}>
                +{attentionGuns.length - 3} more
              </button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {attentionGuns.slice(0, 3).map(({ gun, reasons }) => (
              <button key={gun.id} onClick={() => onGunSelect(gun)} style={{
                padding: '8px', backgroundColor: theme.surface,
                border: `0.5px solid ${theme.orange}`, borderRadius: '6px',
                cursor: 'pointer', textAlign: 'left', width: '100%',
              }}>
                <div style={{
                  fontFamily: 'monospace', fontSize: '10px', fontWeight: 700,
                  color: theme.textPrimary, marginBottom: '4px',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {gun.make} {gun.model}
                </div>
                {reasons.slice(0, 2).map(r => (
                  <div key={r} style={{
                    fontFamily: 'monospace', fontSize: '8px', color: theme.orange,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{r}</div>
                ))}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── PINNED STRIP ── */}
      {pinnedGunIds.length > 0 && (() => {
        const pinnedGuns = pinnedGunIds.map(id => guns.find(g => g.id === id)).filter(Boolean) as Gun[];
        if (pinnedGuns.length === 0) return null;
        return (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '1.2px', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '6px' }}>PINNED</div>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '2px' }}>
              {pinnedGuns.map(gun => {
                const accent = typeAccent[gun.type] || theme.textMuted;
                return (
                  <button
                    key={gun.id}
                    onClick={() => onGunSelect(gun)}
                    onPointerDown={() => {
                      pinnedLongPressTimer.current = setTimeout(() => {
                        togglePinnedGun(gun.id);
                        setPinnedGunIds(getPinnedGunIds());
                        pinnedLongPressTimer.current = null;
                      }, 600);
                    }}
                    onPointerUp={() => { if (pinnedLongPressTimer.current) { clearTimeout(pinnedLongPressTimer.current); pinnedLongPressTimer.current = null; } }}
                    onPointerLeave={() => { if (pinnedLongPressTimer.current) { clearTimeout(pinnedLongPressTimer.current); pinnedLongPressTimer.current = null; } }}
                    style={{
                      flexShrink: 0, width: '110px',
                      backgroundColor: theme.surface,
                      border: `0.5px solid ${theme.border}`,
                      borderRadius: '8px', padding: '10px 8px',
                      cursor: 'pointer', textAlign: 'center',
                    }}
                  >
                    <GunSilhouetteImage gun={gun} color={accent} size={40} />
                    <div style={{ fontFamily: 'monospace', fontSize: '10px', fontWeight: 700, color: theme.textPrimary, marginTop: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {gun.model}
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.caliberRed, marginTop: '2px' }}>{gun.caliber}</div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ── GUN LIST ── */}
      {filtered.length === 0 ? (
        <div style={{ padding: '48px 24px', textAlign: 'center', backgroundColor: theme.surface, borderRadius: '8px', border: `0.5px solid ${theme.border}` }}>
          {guns.length === 0 ? (
            <>
              <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: theme.textSecondary, marginBottom: '6px', opacity: 0.4 }}>
                YOUR COLLECTION STARTS HERE
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted, marginBottom: '20px', lineHeight: 1.6 }}>
                Add your first firearm to start tracking round counts, maintenance, and session history.
              </div>
              <button onClick={onAddGun} style={{
                padding: '11px 24px', backgroundColor: theme.accent,
                border: 'none', borderRadius: '6px', color: theme.bg,
                fontFamily: 'monospace', fontSize: '11px', fontWeight: 700,
                cursor: 'pointer', letterSpacing: '0.8px', width: '100%',
              }}>
                + ADD YOUR FIRST FIREARM
              </button>
            </>
          ) : (
            <>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textMuted, marginBottom: '12px' }}>NO RESULTS</div>
              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters} style={{ padding: '8px 16px', backgroundColor: 'transparent', border: `0.5px solid ${theme.border}`, borderRadius: '6px', color: theme.textMuted, fontFamily: 'monospace', fontSize: '11px', cursor: 'pointer' }}>
                  CLEAR FILTERS
                </button>
              )}
            </>
          )}
        </div>
      ) : (() => {
        // Group into sections
        const SECTIONS: { key: string; label: string; types: string[] }[] = [
          { key: 'handguns',  label: 'HANDGUNS',  types: ['Pistol'] },
          { key: 'rifles',    label: 'RIFLES',     types: ['Rifle'] },
          { key: 'shotguns',  label: 'SHOTGUNS',   types: ['Shotgun'] },
          { key: 'other',     label: 'OTHER',      types: ['NFA', 'Suppressor'] },
        ];

        // If filtering by a specific type, skip sectioning
        const useSection = typeFilter === 'All' && filtered.length > 0;

        if (!useSection) {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {filtered.map(gun => (
                <GunListRow
                  key={gun.id}
                  gun={gun}
                  lastShot={lastShotMap[gun.id]}
                  sessionCount={sessionCountMap[gun.id] || 0}
                  onClick={() => onGunSelect(gun)}
                  onQuickLog={(e) => { e.stopPropagation(); setQuickLogGun(gun); }}
                  onLongPress={() => {
                    togglePinnedGun(gun.id);
                    setPinnedGunIds(getPinnedGunIds());
                  }}
                  isPinned={pinnedGunIds.includes(gun.id)}
                />
              ))}
            </div>
          );
        }

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {SECTIONS.map(section => {
              const sectionGuns = filtered.filter(g => section.types.includes(g.type));
              if (sectionGuns.length === 0) return null;
              const isCollapsed = collapsedSections[section.key] === true;
              return (
                <div key={section.key} style={{ marginBottom: '12px' }}>
                  {/* Section header */}
                  <button
                    onClick={() => setCollapsedSections(prev => ({ ...prev, [section.key]: !isCollapsed }))}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '6px 0', background: 'none', border: 'none',
                      borderBottom: `0.5px solid ${theme.border}`, cursor: 'pointer', marginBottom: '6px',
                    }}
                  >
                    <span style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '1.2px', color: theme.textMuted, textTransform: 'uppercase' }}>
                      {section.label}
                      <span style={{ color: theme.accent, marginLeft: '8px' }}>{sectionGuns.length}</span>
                    </span>
                    <span style={{ color: theme.textMuted, fontSize: '12px', transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)', transition: 'transform 0.15s' }}>›</span>
                  </button>
                  {!isCollapsed && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {sectionGuns.map(gun => (
                        <GunListRow
                          key={gun.id}
                          gun={gun}
                          lastShot={lastShotMap[gun.id]}
                          sessionCount={sessionCountMap[gun.id] || 0}
                          onClick={() => onGunSelect(gun)}
                          onQuickLog={(e) => { e.stopPropagation(); setQuickLogGun(gun); }}
                          onLongPress={() => {
                            togglePinnedGun(gun.id);
                            setPinnedGunIds(getPinnedGunIds());
                          }}
                          isPinned={pinnedGunIds.includes(gun.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* ── CONTEXT MENU (pin feedback) ── */}
      {contextMenuGun && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setContextMenuGun(null)}>
          <div style={{ backgroundColor: theme.surface, borderRadius: '10px', padding: '16px', minWidth: '200px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: theme.textPrimary, marginBottom: '12px' }}>
              {contextMenuGun.make} {contextMenuGun.model}
            </div>
            <button onClick={() => { togglePinnedGun(contextMenuGun.id); setPinnedGunIds(getPinnedGunIds()); setContextMenuGun(null); }} style={{ display: 'block', width: '100%', padding: '10px', background: 'none', border: `0.5px solid ${theme.border}`, borderRadius: '6px', color: theme.textPrimary, fontFamily: 'monospace', fontSize: '11px', cursor: 'pointer', marginBottom: '6px' }}>
              {pinnedGunIds.includes(contextMenuGun.id) ? 'Unpin' : pinnedGunIds.length >= 3 ? 'Pin (replace oldest)' : 'Pin to top'}
            </button>
            <button onClick={() => setContextMenuGun(null)} style={{ display: 'block', width: '100%', padding: '10px', background: 'none', border: 'none', color: theme.textMuted, fontFamily: 'monospace', fontSize: '11px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {quickLogGun && (
        <SessionLoggingModal
          gun={quickLogGun}
          onClose={() => setQuickLogGun(null)}
          onSessionLogged={() => {
            setQuickLogGun(null);
            const allGuns = getAllGuns();
            const sessions = getAllSessions();
            const map: Record<string, string> = {};
            const countMap: Record<string, number> = {};
            for (const s of sessions) {
              if (!map[s.gunId] || s.date > map[s.gunId]) map[s.gunId] = s.date;
              countMap[s.gunId] = (countMap[s.gunId] || 0) + 1;
            }
            setGuns(allGuns);
            setLastShotMap(map);
            setSessionCountMap(countMap);
          }}
        />
      )}
      {showIssuesSheet && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          backgroundColor: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }} onClick={e => { if (e.target === e.currentTarget) setShowIssuesSheet(false); }}>
          <div style={{
            width: '100%', maxWidth: '480px',
            backgroundColor: theme.surface,
            borderRadius: '12px 12px 0 0',
            padding: '20px 16px 40px',
            maxHeight: '75vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: theme.textPrimary, letterSpacing: '1px' }}>
                ALL ATTENTION ITEMS ({attentionGuns.length})
              </div>
              <button onClick={() => setShowIssuesSheet(false)} style={{ background: 'none', border: 'none', color: theme.textMuted, fontSize: '20px', cursor: 'pointer', padding: '0 4px' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {attentionGuns.map(({ gun, reasons }) => (
                <button key={gun.id} onClick={() => { setShowIssuesSheet(false); onGunSelect(gun); }} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', backgroundColor: theme.bg,
                  border: `0.5px solid ${theme.border}`, borderRadius: '8px',
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: theme.textPrimary, marginBottom: '3px' }}>
                      {gun.make} {gun.model}
                    </div>
                    {reasons.map(r => (
                      <div key={r} style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.orange, marginTop: '1px' }}>{r}</div>
                    ))}
                  </div>
                  <span style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted, marginLeft: '8px', flexShrink: 0 }}>→</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {showCSVImport && (
        <CSVImportModal
          onClose={() => setShowCSVImport(false)}
          onImported={(count) => {
            setShowCSVImport(false);
            if (count > 0) {
              const allGuns = getAllGuns();
              setGuns(allGuns);
            }
          }}
        />
      )}
    </div>
  );
}

// ── Insurance export ──────────────────────────────────────────────────────────

export function exportInsuranceClaim(guns: Gun[]): void {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const activeGuns = guns.filter(g => g.status !== 'Sold' && g.status !== 'Transferred');
  const totalFMV = activeGuns.reduce((s, g) => s + (g.estimatedFMV || g.acquiredPrice || 0), 0);
  const totalInsured = activeGuns.reduce((s, g) => s + (g.insuranceValue || g.estimatedFMV || g.acquiredPrice || 0), 0);

  const lines: string[] = [
    '================================================================',
    'FIREARMS INSURANCE CLAIM INVENTORY',
    '================================================================',
    `Date of Report: ${dateStr}`,
    `Total Firearms Listed: ${activeGuns.length}`,
    `Estimated Total FMV: $${totalFMV.toLocaleString()}`,
    `Total Insured Value: $${totalInsured.toLocaleString()}`,
    '',
    'POLICYHOLDER INFORMATION',
    '------------------------',
    'Name: _______________________________',
    'Policy Number: _______________________',
    'Address: ____________________________',
    'Phone: ______________________________',
    'Date of Loss: _______________________',
    '',
    '================================================================',
    'FIREARM INVENTORY',
    '================================================================',
    '',
  ];

  activeGuns.forEach((g, i) => {
    lines.push(`Item ${i + 1} of ${activeGuns.length}`);
    lines.push('-----------------------------------');
    lines.push(`Description:     ${g.make} ${g.model}`);
    lines.push(`Type:            ${g.type} — ${g.action}`);
    lines.push(`Caliber:         ${g.caliber}`);
    if (g.serialNumber) lines.push(`Serial Number:   ${g.serialNumber}`);
    if (g.acquiredDate) lines.push(`Date Acquired:   ${new Date(g.acquiredDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
    if (g.acquiredFrom) lines.push(`Purchased From:  ${g.acquiredFrom}`);
    if (g.acquiredPrice) lines.push(`Purchase Price:  $${g.acquiredPrice.toLocaleString()}`);
    if (g.estimatedFMV) lines.push(`Estimated FMV:   $${g.estimatedFMV.toLocaleString()}`);
    if (g.insuranceValue) lines.push(`Insured Value:   $${g.insuranceValue.toLocaleString()}`);
    if (g.condition) lines.push(`Condition:       ${g.condition}`);
    if (g.barrelLength) lines.push(`Barrel Length:   ${g.barrelLength}"`);
    if (g.nfaItem) lines.push(`NFA Item:        Yes`);
    if (g.nfaApprovalDate) lines.push(`NFA Approval:    ${g.nfaApprovalDate}`);
    if (g.accessories) {
      const acc = g.accessories;
      const accList: string[] = [];
      if (acc.optic) accList.push(`Optic: ${acc.optic}${acc.opticMagnification ? ` (${acc.opticMagnification})` : ''}`);
      if (acc.suppressor) accList.push(`Suppressor: ${acc.suppressor}`);
      if (acc.weaponLight) accList.push(`Light: ${acc.weaponLight}`);
      if (acc.sling) accList.push(`Sling: ${acc.sling}`);
      if (acc.bipod) accList.push(`Bipod: ${acc.bipod}`);
      if (acc.muzzleDevice) accList.push(`Muzzle: ${acc.muzzleDevice}`);
      if (acc.other) accList.push(`Other: ${acc.other}`);
      if (accList.length > 0) lines.push(`Accessories:     ${accList.join(' | ')}`);
    }
    if (g.notes) lines.push(`Notes:           ${g.notes}`);
    lines.push('');
  });

  lines.push('================================================================');
  lines.push('SIGNATURE & CERTIFICATION');
  lines.push('================================================================');
  lines.push('');
  lines.push('I certify that the above information is accurate and complete.');
  lines.push('');
  lines.push('Signature: ___________________________  Date: ___________');
  lines.push('');
  lines.push('Generated by Lindcott Armory');

  const content = lines.join('\n');
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `insurance-claim-${now.toISOString().split('T')[0]}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Row component ─────────────────────────────────────────────────────────────

function cleaningBorderColor(gun: Gun, typeAccentColor: string): string {
  if (gun.lastCleanedRoundCount == null) return typeAccentColor;
  const shots = (gun.roundCount || 0) - gun.lastCleanedRoundCount;
  if (shots >= 500) return '#ff4444';
  if (shots >= 400) return '#ffd43b';
  return typeAccentColor;
}

// Circular arc showing round count progress toward cleaning threshold
function CleaningArc({ gun }: { gun: Gun }) {
  const rounds = gun.roundCount || 0;
  const threshold = 500; // hardcoded threshold
  const hasData = gun.lastCleanedRoundCount != null;

  if (!hasData) {
    // Plain number, no arc
    return (
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 700, color: theme.textPrimary, lineHeight: 1 }}>
          {rounds.toLocaleString()}
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginTop: '2px', letterSpacing: '0.5px' }}>
          ROUNDS
        </div>
      </div>
    );
  }

  const shotsSince = rounds - gun.lastCleanedRoundCount!;
  const pct = Math.min(shotsSince / threshold, 1);
  const arcColor = pct >= 1 ? '#ff4444' : pct >= 0.8 ? '#ffd43b' : '#51cf66';

  const R = 18;
  const cx = 22;
  const cy = 22;
  const circumference = 2 * Math.PI * R;
  const dash = pct * circumference;

  return (
    <svg width="44" height="44" style={{ flexShrink: 0 }}>
      {/* Track */}
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
      {/* Progress */}
      <circle
        cx={cx} cy={cy} r={R}
        fill="none"
        stroke={arcColor}
        strokeWidth="3"
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeDashoffset={circumference / 4}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.3s' }}
      />
      {/* Round count */}
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fill={theme.textPrimary} fontFamily="monospace" fontSize="8" fontWeight="700">
        {rounds >= 1000 ? `${(rounds / 1000).toFixed(1)}k` : rounds}
      </text>
    </svg>
  );
}

function GunListRow({ gun, lastShot, sessionCount, onClick, onQuickLog, onLongPress, isPinned }: {
  gun: Gun;
  lastShot?: string;
  sessionCount: number;
  onClick: () => void;
  onQuickLog: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onLongPress: () => void;
  isPinned: boolean;
}) {
  const accent = typeAccent[gun.type] || theme.textMuted;
  const borderColor = cleaningBorderColor(gun, accent);
  const neverShot = sessionCount === 0;

  const daysSince = lastShot
    ? Math.floor((new Date().getTime() - new Date(lastShot + 'T12:00:00').getTime()) / 86400000)
    : null;

  // Recency fade: ≤30d = 100%, 31-90d = 85%, 90+ = 75%
  const opacity = daysSince === null ? 1 : daysSince <= 30 ? 1 : daysSince <= 90 ? 0.85 : 0.75;

  const [pressed, setPressed] = useState(false);
  const longPressTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  function startLongPress() {
    longPressTimer.current = setTimeout(() => {
      onLongPress();
      longPressTimer.current = null;
    }, 600);
  }

  function cancelLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  // Flag guns that might need attention
  const needsAttention =
    (gun.roundCount || 0) - (gun.lastCleanedRoundCount || 0) >= 500;

  return (
    <div
      onClick={onClick}
      onMouseDown={() => { setPressed(true); startLongPress(); }}
      onMouseUp={() => { setPressed(false); cancelLongPress(); }}
      onMouseLeave={() => { setPressed(false); cancelLongPress(); }}
      onTouchStart={() => { setPressed(true); startLongPress(); }}
      onTouchEnd={() => { setPressed(false); cancelLongPress(); }}
      onTouchCancel={() => { setPressed(false); cancelLongPress(); }}
      style={{
        width: '100%',
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 14px',
        backgroundColor: pressed ? theme.bg : theme.surface,
        border: neverShot
          ? `0.5px dashed rgba(255,255,255,0.15)`
          : `0.5px solid ${pressed ? theme.accent : theme.border}`,
        borderRadius: '8px',
        borderLeft: `3px solid ${borderColor}`,
        cursor: 'pointer', textAlign: 'left', boxSizing: 'border-box',
        transition: 'background-color 0.1s, border-color 0.1s',
        opacity,
      }}
    >
      {/* Silhouette */}
      <div style={{
        width: '52px', height: '34px',
        backgroundColor: theme.bg, borderRadius: '4px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <GunSilhouetteImage gun={gun} color="rgba(255,255,255,0.15)" size={44} />
      </div>

      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{
            fontFamily: 'monospace', fontSize: '13px', fontWeight: 700,
            color: theme.textPrimary,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {gun.make} {gun.model}
          </div>
          {gun.openIssues && (
            <span title={gun.openIssues} style={{
              flexShrink: 0, fontSize: '13px', lineHeight: 1,
              color: theme.red, cursor: 'pointer',
            }}>⚠</span>
          )}
          {!gun.openIssues && needsAttention && (
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: theme.accent, flexShrink: 0 }} />
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '3px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.caliberRed }}>{gun.caliber}</span>
          <span style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textMuted }}>{gun.action}</span>
          {gun.capacity && (
            <span style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textMuted }}>
              {gun.capacity}{gun.action !== 'Revolver' ? '+1' : ''}
            </span>
          )}
          {gun.status && gun.status !== 'Active' && (
            <span style={{
              fontFamily: 'monospace', fontSize: '12px', color: theme.orange,
              padding: '1px 5px', border: `0.5px solid ${theme.orange}`, borderRadius: '3px',
            }}>
              {gun.status.toUpperCase()}
            </span>
          )}
        </div>
        {neverShot && (
          <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginTop: '3px', letterSpacing: '0.3px' }}>
            No sessions logged yet
          </div>
        )}
        {isPinned && (
          <div style={{ fontFamily: 'monospace', fontSize: '8px', color: theme.accent, marginTop: '2px', letterSpacing: '0.5px' }}>PINNED</div>
        )}
      </div>

      {/* Round count arc + quick-log */}
      <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
        <CleaningArc gun={gun} />
        {daysSince === 0 ? (
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.green, textAlign: 'right' }}>today</div>
        ) : daysSince === 1 ? (
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, textAlign: 'right' }}>yesterday</div>
        ) : daysSince !== null && daysSince <= 30 ? (
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, textAlign: 'right' }}>{daysSince}d ago</div>
        ) : daysSince !== null && daysSince > 30 ? (
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.red, textAlign: 'right' }}>{daysSince}d ago</div>
        ) : null}
        <button
          onClick={onQuickLog}
          style={{
            padding: '0', backgroundColor: theme.accent,
            border: 'none', borderRadius: '4px', color: theme.bg,
            fontFamily: 'monospace', fontWeight: 700,
            cursor: 'pointer', lineHeight: 1,
            minWidth: '44px', minHeight: '44px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '1px',
          }}
        >
          <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span>
          <span style={{ fontSize: '7px', letterSpacing: '0.5px' }}>SESSION</span>
        </button>
      </div>
      {/* Nav chevron */}
      <div style={{ color: theme.textMuted, fontSize: '16px', flexShrink: 0, alignSelf: 'center', opacity: 0.45, paddingLeft: '2px' }}>›</div>
    </div>
  );
}
