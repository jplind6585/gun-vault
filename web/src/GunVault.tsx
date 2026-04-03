import { useState, useEffect, useMemo } from 'react';
import { theme } from './theme';
import { getAllGuns, getAllSessions } from './storage';
import type { Gun, GunStatus, GunPurpose } from './types';
import { GunSilhouetteImage } from './SimpleSilhouettes';
import { SessionLoggingModal } from './SessionLoggingModal';
import { CSVImportModal } from './CSVImportModal';

type TypeFilter = 'All' | 'Pistol' | 'Rifle' | 'Shotgun' | 'NFA' | 'Suppressor';
type SortOption = 'make' | 'roundCount' | 'acquiredPriceDesc' | 'acquiredPriceAsc' | 'capacity' | 'lastShot';

interface GunVaultProps {
  onGunSelect: (gun: Gun) => void;
  onAddGun: () => void;
  onImportRequest?: () => void;
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

export function GunVault({ onGunSelect, onAddGun, onImportRequest }: GunVaultProps) {
  const [guns, setGuns]         = useState<Gun[]>([]);
  const [lastShotMap, setLastShotMap] = useState<Record<string, string>>({});
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

  useEffect(() => {
    const allGuns = getAllGuns();
    setGuns(allGuns);

    // Build last-shot map from sessions
    const sessions = getAllSessions();
    const map: Record<string, string> = {};
    for (const s of sessions) {
      if (!map[s.gunId] || s.date > map[s.gunId]) map[s.gunId] = s.date;
    }
    setLastShotMap(map);
  }, []);

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

  // ── Step 3: search + purpose filter ──────────────────────────────────────
  const filtered = useMemo(() => {
    let list = statusFiltered;
    if (purposeFilter) list = list.filter(g => g.purpose?.includes(purposeFilter));
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(g =>
        g.make.toLowerCase().includes(s) ||
        g.model.toLowerCase().includes(s) ||
        g.caliber.toLowerCase().includes(s)
      );
    }
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case 'roundCount':    return (b.roundCount || 0) - (a.roundCount || 0);
        case 'acquiredPriceDesc': return (b.acquiredPrice || 0) - (a.acquiredPrice || 0);
        case 'acquiredPriceAsc':  return (a.acquiredPrice || 0) - (b.acquiredPrice || 0);
        case 'capacity':      return (b.capacity || 0) - (a.capacity || 0);
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
            const totalFMV = filtered.reduce((sum, g) => sum + (g.estimatedFMV || 0), 0);
            return totalFMV > 0 ? (
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginTop: '3px' }}>
                Est. Market Value ${totalFMV.toLocaleString()}
              </div>
            ) : null;
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

      {/* ── SEARCH + SORT ROW ── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
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
          }}
        />
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortOption)}
          style={{
            padding: '10px 8px',
            backgroundColor: theme.surface,
            border: `0.5px solid ${theme.border}`,
            borderRadius: '6px',
            color: theme.textMuted,
            fontFamily: 'monospace',
            fontSize: '10px',
            cursor: 'pointer',
            outline: 'none',
            flexShrink: 0,
          }}
        >
          <option value="make">A–Z</option>
          <option value="roundCount">Most Fired</option>
          <option value="acquiredPriceDesc">Price ↓</option>
          <option value="acquiredPriceAsc">Price ↑</option>
          <option value="capacity">Capacity ↓</option>
          <option value="lastShot">Last Shot</option>
        </select>
      </div>

      {/* ── TYPE CHIPS + FILTERS ROW ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        {/* Chips — scrollable, don't overflow into FILTERS */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', flex: 1, minWidth: 0, scrollbarWidth: 'none', paddingRight: '8px' }}>
          {(['Pistol', 'Rifle', 'Shotgun', 'NFA', 'Suppressor'] as TypeFilter[])
            .filter(t => typeCounts[t] > 0)
            .map(t => {
              const label = t === 'Pistol' ? 'Handgun' : t;
              const active = typeFilter === t;
              return (
                <button key={t}
                  onClick={() => { setTypeFilter(active ? 'All' : t); setCaliberFilter(''); setActionFilter(''); }}
                  style={{
                    padding: '6px 11px',
                    backgroundColor: active ? theme.accent : 'transparent',
                    border: `0.5px solid ${active ? theme.accent : theme.border}`,
                    borderRadius: '20px',
                    color: active ? theme.bg : theme.textMuted,
                    fontFamily: 'monospace', fontSize: '10px',
                    letterSpacing: '0.5px',
                    fontWeight: active ? 700 : 400,
                    cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                  }}
                >
                  {label} – {typeCounts[t]}
                </button>
              );
            })}
        </div>
        {/* FILTERS — pinned right, visually distinct */}
        <button
          onClick={() => setShowFilters(f => !f)}
          style={{
            flexShrink: 0,
            padding: '6px 10px',
            backgroundColor: activeFilterCount > 0 ? theme.accent : theme.surface,
            border: `0.5px solid ${activeFilterCount > 0 ? theme.accent : theme.border}`,
            borderRadius: '6px',
            color: activeFilterCount > 0 ? theme.bg : theme.textSecondary,
            fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.5px',
            cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600,
          }}
        >
          ≡ {activeFilterCount > 0 ? activeFilterCount : ''}
        </button>
      </div>

      {/* ── EXPANDED FILTERS ── */}
      {showFilters && (
        <div style={{
          backgroundColor: theme.surface,
          border: `0.5px solid ${theme.border}`,
          borderRadius: '8px',
          padding: '14px',
          marginBottom: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>

          {/* Row 1: Caliber + Action */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <div style={filterLabel}>Caliber</div>
              <select value={caliberFilter} onChange={e => { setCaliberFilter(e.target.value); setActionFilter(''); }} style={selectStyle}>
                <option value="">All Calibers</option>
                {availableCalibers.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div style={filterLabel}>Action</div>
              <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} style={selectStyle}>
                <option value="">All Actions</option>
                {availableActions.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2: Status + Purpose */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <div style={filterLabel}>Status</div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as GunStatus | '')} style={selectStyle}>
                <option value="">All Statuses</option>
                {availableStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <div style={filterLabel}>Purpose</div>
              <select
                value={purposeFilter}
                onChange={e => setPurposeFilter(e.target.value as GunPurpose | '')}
                style={{ ...selectStyle, color: availablePurposes.length === 0 ? theme.textMuted : theme.textSecondary }}
                disabled={availablePurposes.length === 0}
              >
                <option value="">All Purposes</option>
                {availablePurposes.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Clear filters */}
          {activeFilterCount > 0 && (
            <button onClick={clearAllFilters} style={{
              padding: '9px',
              backgroundColor: 'rgba(255,212,59,0.06)',
              border: `0.5px solid ${theme.accent}`,
              borderRadius: '5px',
              color: theme.accent,
              fontFamily: 'monospace', fontSize: '10px',
              letterSpacing: '0.8px', cursor: 'pointer', fontWeight: 600,
            }}>
              CLEAR {activeFilterCount} FILTER{activeFilterCount !== 1 ? 'S' : ''}
            </button>
          )}
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

      {/* ── GUN LIST ── */}
      {filtered.length === 0 ? (
        <div style={{
          padding: '48px 24px', textAlign: 'center',
          backgroundColor: theme.surface, borderRadius: '8px',
          border: `0.5px solid ${theme.border}`,
        }}>
          {guns.length === 0 ? (
            <>
              <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.3 }}>🔒</div>
              <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: theme.textSecondary, marginBottom: '6px' }}>
                VAULT IS EMPTY
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted, marginBottom: '20px', lineHeight: 1.6 }}>
                Add your first firearm to start tracking rounds, maintenance, and market value.
              </div>
              <button onClick={onAddGun} style={{
                padding: '11px 24px', backgroundColor: theme.accent,
                border: 'none', borderRadius: '6px', color: theme.bg,
                fontFamily: 'monospace', fontSize: '11px', fontWeight: 700,
                cursor: 'pointer', letterSpacing: '0.8px',
              }}>
                ADD YOUR FIRST GUN
              </button>
            </>
          ) : (
            <>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textMuted, marginBottom: '12px' }}>
                NO RESULTS
              </div>
            </>
          )}
          {guns.length > 0 && activeFilterCount > 0 && (
            <button onClick={clearAllFilters} style={{
              padding: '8px 16px', backgroundColor: 'transparent',
              border: `0.5px solid ${theme.border}`, borderRadius: '6px',
              color: theme.textMuted, fontFamily: 'monospace', fontSize: '11px', cursor: 'pointer',
            }}>
              CLEAR FILTERS
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {filtered.map(gun => (
            <GunListRow
              key={gun.id}
              gun={gun}
              lastShot={lastShotMap[gun.id]}
              onClick={() => onGunSelect(gun)}
              onQuickLog={(e) => { e.stopPropagation(); setQuickLogGun(gun); }}
            />
          ))}
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
            for (const s of sessions) {
              if (!map[s.gunId] || s.date > map[s.gunId]) map[s.gunId] = s.date;
            }
            setGuns(allGuns);
            setLastShotMap(map);
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

function GunListRow({ gun, lastShot, onClick, onQuickLog }: {
  gun: Gun;
  lastShot?: string;
  onClick: () => void;
  onQuickLog: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const accent = typeAccent[gun.type] || theme.textMuted;

  const daysSince = lastShot
    ? Math.floor((new Date().getTime() - new Date(lastShot + 'T12:00:00').getTime()) / 86400000)
    : null;

  const [pressed, setPressed] = useState(false);

  // Flag guns that might need attention
  const needsAttention =
    (gun.roundCount || 0) - (gun.lastCleanedRoundCount || 0) >= 500;

  return (
    <div
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onTouchCancel={() => setPressed(false)}
      style={{
        width: '100%',
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 14px',
        backgroundColor: pressed ? theme.bg : theme.surface,
        border: `0.5px solid ${pressed ? theme.accent : theme.border}`,
        borderRadius: '8px',
        borderLeft: `3px solid ${accent}`,
        cursor: 'pointer', textAlign: 'left', boxSizing: 'border-box',
        transition: 'background-color 0.1s, border-color 0.1s',
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
      </div>

      {/* Round count + quick-log */}
      <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 700, color: theme.textPrimary, lineHeight: 1 }}>
            {(gun.roundCount || 0).toLocaleString()}
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginTop: '2px', letterSpacing: '0.5px' }}>
            ROUNDS
          </div>
        </div>
        {daysSince === 0 ? (
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.green, textAlign: 'right', flexShrink: 0 }}>today</div>
        ) : daysSince === 1 ? (
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, textAlign: 'right', flexShrink: 0 }}>yesterday</div>
        ) : daysSince !== null && daysSince <= 30 ? (
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, textAlign: 'right', flexShrink: 0 }}>{daysSince}d ago</div>
        ) : daysSince !== null && daysSince > 30 ? (
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.red, textAlign: 'right', flexShrink: 0 }}>{daysSince}d ago</div>
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
          <span style={{ fontSize: '7px', letterSpacing: '0.5px' }}>LOG</span>
        </button>
      </div>
      {/* Nav chevron */}
      <div style={{ color: theme.textMuted, fontSize: '16px', flexShrink: 0, alignSelf: 'center', opacity: 0.45, paddingLeft: '2px' }}>›</div>
    </div>
  );
}
