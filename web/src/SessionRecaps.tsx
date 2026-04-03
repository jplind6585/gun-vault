import React, { useState, useEffect, useRef } from 'react';
import { theme } from './theme';
import { haptic } from './haptic';
import { getAllSessions, getAllGuns, getAllAmmo, deleteSession, updateSession } from './storage';
import {
  getMaintenanceAlerts, getAmmoCorrelation, getTrainingGapDays,
  hasClaudeApiKey, getClaudeApiKey, setClaudeApiKey,
} from './claudeApi';
import { ActivityHeatmap } from './ActivityHeatmap';
import type { Session, Gun, AmmoLot, SessionPurpose, IssueType } from './types';

interface SessionRecapsProps {
  onLogSession: (gun?: Gun) => void;
}

const PURPOSE_COLORS: Record<string, string> = {
  Drills: theme.blue,
  Competition: '#ff6b6b',
  Zeroing: '#51cf66',
  Qualification: '#cc5de8',
  'Carry Eval': '#ff922b',
  Warmup: theme.textMuted,
  Fun: theme.accent,
};

export function SessionRecaps({ onLogSession }: SessionRecapsProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [guns, setGuns] = useState<Gun[]>([]);
  const [ammoLots, setAmmoLots] = useState<AmmoLot[]>([]);
  const [filterGunId, setFilterGunId] = useState('all');
  const [filterPurpose, setFilterPurpose] = useState<SessionPurpose | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'insights'>('list');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(getClaudeApiKey());
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [heatmapExpanded, setHeatmapExpanded] = useState(false);
  const [gunSearch, setGunSearch] = useState('');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterIssues, setFilterIssues] = useState<'all' | 'issues' | 'clean'>('all');

  function reload() {
    setSessions(getAllSessions().sort((a, b) => b.date.localeCompare(a.date)));
    setGuns(getAllGuns());
    setAmmoLots(getAllAmmo());
  }

  useEffect(() => { reload(); }, []);

  const gunMap = new Map(guns.map(g => [g.id, g]));
  const ammoMap = new Map(ammoLots.map(a => [a.id, a]));

  const filtered = sessions.filter(s => {
    if (filterGunId !== 'all' && s.gunId !== filterGunId) return false;
    if (filterPurpose !== 'all' && !s.purpose?.includes(filterPurpose as SessionPurpose)) return false;
    if (gunSearch.trim()) {
      const gun = guns.find(g => g.id === s.gunId);
      const q = gunSearch.toLowerCase();
      if (!gun || !(`${gun.make} ${gun.model}`.toLowerCase().includes(q))) return false;
    }
    if (filterLocation !== 'all' && s.location !== filterLocation) return false;
    if (filterIssues === 'issues' && !s.issues) return false;
    if (filterIssues === 'clean' && s.issues) return false;
    return true;
  });
  const displayed = filtered.filter(s => s.id !== pendingDeleteId);

  // Stats
  const now = new Date();
  const thisMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  const roundsThisMonth = sessions
    .filter(s => s.date.startsWith(thisMonth))
    .reduce((sum, s) => sum + s.roundsExpended, 0);

  const mostActiveGunId = (() => {
    const counts: Record<string, number> = {};
    sessions.forEach(s => { counts[s.gunId] = (counts[s.gunId] || 0) + 1; });
    return Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0];
  })();

  const gapDays = getTrainingGapDays(sessions);
  const maintenanceAlerts = getMaintenanceAlerts(guns, sessions);
  const ammoCorrelation = getAmmoCorrelation(sessions, ammoLots, guns);
  const totalCost = sessions.reduce((sum, s) => sum + (s.sessionCost || 0), 0);

  // Group filtered by date
  const grouped = filtered.reduce((acc, s) => {
    if (!acc[s.date]) acc[s.date] = [];
    acc[s.date].push(s);
    return acc;
  }, {} as Record<string, Session[]>);
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  // All purposes and locations used
  const allPurposes = [...new Set(sessions.flatMap(s => s.purpose || []))];
  const allLocations = [...new Set(sessions.map(s => s.location).filter(Boolean))] as string[];
  const activeFilters = (filterGunId !== 'all' ? 1 : 0) + (filterIssues !== 'all' ? 1 : 0) + (filterLocation !== 'all' ? 1 : 0) + (gunSearch.trim() ? 1 : 0);

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  function handleDelete(id: string) {
    // Clear any in-flight pending delete first
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      if (pendingDeleteId) {
        deleteSession(pendingDeleteId);
        reload();
      }
    }
    setExpandedId(null);
    setPendingDeleteId(id);
    undoTimerRef.current = setTimeout(() => {
      deleteSession(id);
      setPendingDeleteId(null);
      undoTimerRef.current = null;
      reload();
    }, 3500);
  }

  function handleUndo() {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = null;
    haptic(10);
    setPendingDeleteId(null);
  }

  // ── Styles ──────────────────────────────────────────────────────────────────

  const statCard = (label: string, value: string | number, sub?: string, color = theme.accent) => (
    <div style={{
      backgroundColor: theme.surface,
      border: `0.5px solid ${theme.border}`,
      borderRadius: '6px',
      padding: '12px',
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, letterSpacing: '0.5px', marginBottom: '4px', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 700, color, lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginTop: '2px' }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ backgroundColor: theme.bg, padding: '16px', paddingBottom: '24px', overflowX: 'hidden' }}>

      {/* Training gap nudge */}
      {gapDays >= 14 && gapDays !== Infinity && (
        <div style={{
          backgroundColor: 'rgba(255,212,59,0.08)',
          border: `0.5px solid ${theme.accent}`,
          borderRadius: '6px',
          padding: '10px 14px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.accent }}>
            {gapDays} days since your last range trip
          </div>
          <button
            onClick={() => onLogSession()}
            style={{ background: 'none', border: 'none', color: theme.accent, fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer', fontWeight: 700 }}
          >
            LOG →
          </button>
        </div>
      )}

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        {statCard('Sessions', sessions.length, 'all time')}
        {statCard('This Month', roundsThisMonth.toLocaleString(), 'rounds', theme.green)}
        {statCard('Last Session', gapDays === Infinity ? '—' : gapDays + 'd', 'ago', gapDays > 14 ? '#ff6b6b' : theme.textSecondary)}
      </div>

      {/* LIST / INSIGHTS tab switcher */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '16px', border: `0.5px solid ${theme.border}`, borderRadius: '6px', overflow: 'hidden' }}>
        {(['list', 'insights'] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            style={{
              flex: 1, padding: '8px',
              backgroundColor: activeTab === t ? theme.accent : 'transparent',
              border: 'none',
              color: activeTab === t ? theme.bg : theme.textSecondary,
              fontFamily: 'monospace', fontSize: '10px', fontWeight: 700,
              letterSpacing: '0.8px', cursor: 'pointer', textTransform: 'uppercase',
            }}
          >
            {t === 'list' ? 'SESSION LOG' : 'ANALYTICS'}
          </button>
        ))}
      </div>

      {mostActiveGunId && gunMap.get(mostActiveGunId) && activeTab === 'list' && (
        <div style={{
          backgroundColor: theme.surface,
          border: `0.5px solid ${theme.border}`,
          borderRadius: '6px',
          padding: '10px 14px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '2px' }}>Primary Platform</div>
            <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textPrimary, fontWeight: 700 }}>
              {gunMap.get(mostActiveGunId)!.make} {gunMap.get(mostActiveGunId)!.model}
            </div>
          </div>
          {totalCost > 0 && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '2px' }}>Total Spent</div>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textSecondary }}>${totalCost.toFixed(0)}</div>
            </div>
          )}
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === 'insights' && (
        <AnalyticsPanel sessions={sessions} guns={guns} ammoLots={ammoLots} totalCost={totalCost} />
      )}

      {/* Activity heatmap — list tab only */}
      {activeTab === 'list' && sessions.length > 0 && (
        <div style={{
          backgroundColor: theme.surface,
          border: `0.5px solid ${theme.border}`,
          borderRadius: '6px',
          padding: '12px 14px',
          marginBottom: '16px',
          overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Range Activity
            </div>
            <button
              onClick={() => setHeatmapExpanded(e => !e)}
              style={{
                background: 'none', border: `0.5px solid ${theme.border}`, borderRadius: '3px',
                color: theme.textMuted, fontFamily: 'monospace', fontSize: '8px',
                cursor: 'pointer', padding: '2px 7px', letterSpacing: '0.5px',
              }}
            >
              {heatmapExpanded ? '12 WK' : '52 WK'}
            </button>
          </div>
          <div style={{ overflowX: heatmapExpanded ? 'auto' : 'hidden' }}>
            <ActivityHeatmap sessions={sessions} weekCount={heatmapExpanded ? 52 : 12} />
          </div>
        </div>
      )}

      {/* Maintenance alerts — list tab only */}
      {activeTab === 'list' && maintenanceAlerts.length > 0 && (
        <div style={{
          backgroundColor: 'rgba(255,107,107,0.07)',
          border: `0.5px solid rgba(255,107,107,0.4)`,
          borderRadius: '6px',
          padding: '12px 14px',
          marginBottom: '16px',
        }}>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#ff6b6b', letterSpacing: '0.5px', marginBottom: '8px', textTransform: 'uppercase' }}>
            Maintenance Due
          </div>
          {maintenanceAlerts.slice(0, 3).map(alert => (
            <div key={alert.gun.id} style={{ fontFamily: 'monospace', fontSize: '11px', color: '#ff9999', marginBottom: '4px' }}>
              ⚠ {alert.gun.make} {alert.gun.model} — {alert.message}
            </div>
          ))}
        </div>
      )}

      {/* LIST TAB — header + search + sessions + ammo insights */}
      {activeTab === 'list' && <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted }}>
          {displayed.length} sessions · {displayed.reduce((s, x) => s + x.roundsExpended, 0).toLocaleString()} rds
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* AI button — invite when off, subtle dot when on */}
          {hasClaudeApiKey() ? (
            <div
              onClick={() => setShowApiKeyModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
            >
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: theme.accent, flexShrink: 0 }} />
              <span style={{ fontFamily: 'monospace', fontSize: '8px', color: theme.accent, letterSpacing: '0.5px' }}>AI</span>
            </div>
          ) : (
            <button
              onClick={() => setShowApiKeyModal(true)}
              style={{
                padding: '6px 10px',
                backgroundColor: theme.surface,
                border: `0.5px solid ${theme.border}`,
                borderRadius: '4px',
                color: theme.textMuted,
                fontFamily: 'monospace',
                fontSize: '9px',
                cursor: 'pointer',
                letterSpacing: '0.5px',
              }}
            >
              ✦ AI INSIGHTS
            </button>
          )}
        </div>
      </div>

      {/* Gun search + filter row */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search guns..."
          value={gunSearch}
          onChange={e => setGunSearch(e.target.value)}
          style={{
            flex: 1, padding: '8px 12px',
            backgroundColor: theme.surface,
            border: `0.5px solid ${theme.border}`,
            borderRadius: '6px',
            color: theme.textPrimary,
            fontFamily: 'monospace',
            fontSize: '12px',
            outline: 'none',
          }}
        />
        <button
          onClick={() => setShowFilterSheet(true)}
          style={{
            padding: '8px 12px',
            backgroundColor: activeFilters > 0 ? theme.accent : theme.surface,
            border: `0.5px solid ${activeFilters > 0 ? theme.accent : theme.border}`,
            borderRadius: '6px',
            color: activeFilters > 0 ? theme.bg : theme.textSecondary,
            fontFamily: 'monospace',
            fontSize: '10px',
            cursor: 'pointer',
            letterSpacing: '0.5px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          ≡ {activeFilters > 0 ? activeFilters : 'FILTER'}
        </button>
      </div>

      {allPurposes.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', overflowX: 'auto' }}>
          <FilterChip label="All" active={filterPurpose === 'all'} onClick={() => setFilterPurpose('all')} />
          {allPurposes.map(p => (
            <FilterChip key={p} label={p} active={filterPurpose === p} onClick={() => setFilterPurpose(p)} color={PURPOSE_COLORS[p]} />
          ))}
        </div>
      )}

      {/* Session list */}
      {sortedDates.length === 0 ? (
        <div style={{
          padding: '48px 24px', textAlign: 'center',
          backgroundColor: theme.surface, borderRadius: '8px',
          border: `0.5px solid ${theme.border}`,
        }}>
          <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.3 }}>🎯</div>
          <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: theme.textSecondary, marginBottom: '6px' }}>
            {sessions.length === 0 ? 'NO SESSIONS YET' : 'NO RESULTS'}
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted, marginBottom: '20px', lineHeight: 1.6 }}>
            {sessions.length === 0
              ? 'Log your first range trip to start tracking rounds fired, training gaps, and ammo consumption.'
              : 'Try adjusting your filters.'}
          </div>
          {sessions.length === 0 && (
            <button
              onClick={() => onLogSession()}
              style={{
                padding: '11px 24px', backgroundColor: theme.accent,
                border: 'none', borderRadius: '6px', color: theme.bg,
                fontFamily: 'monospace', fontSize: '11px', fontWeight: 700,
                cursor: 'pointer', letterSpacing: '0.8px',
              }}
            >
              LOG YOUR FIRST SESSION
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {sortedDates.map(dateKey => {
            const daySessions = grouped[dateKey];
            const dayRounds = daySessions.reduce((sum, s) => sum + s.roundsExpended, 0);
            const dayLocations = [...new Set(daySessions.map(s => s.location).filter(Boolean))];
            const hasIssues = daySessions.some(s => s.issues);

            return (
              <div key={dateKey}>
                {/* Date header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: '6px', paddingBottom: '6px',
                  borderBottom: `0.5px solid ${theme.border}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: theme.textSecondary, letterSpacing: '0.5px' }}>
                      {formatDate(dateKey)}
                    </span>
                    {dayLocations.length === 1 && (
                      <span style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, padding: '2px 6px', border: `0.5px solid ${theme.border}`, borderRadius: '3px' }}>
                        {dayLocations[0]}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {hasIssues && (
                      <span
                        onClick={() => {
                          const firstIssueSession = daySessions.find(s => s.issues);
                          if (firstIssueSession) setExpandedId(firstIssueSession.id);
                        }}
                        style={{ fontFamily: 'monospace', fontSize: '9px', color: '#ff6b6b', cursor: 'pointer', padding: '1px 4px', border: '0.5px solid rgba(255,107,107,0.4)', borderRadius: '3px' }}
                      >
                        ISSUES
                      </span>
                    )}
                    <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>
                      {dayRounds} rds
                    </span>
                  </div>
                </div>

                {/* Session cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {daySessions.map(session => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      gun={gunMap.get(session.gunId)}
                      ammoLot={session.ammoLotId ? ammoMap.get(session.ammoLotId) : undefined}
                      expanded={expandedId === session.id}
                      onToggle={() => setExpandedId(expandedId === session.id ? null : session.id)}
                      onEdit={() => setEditingId(session.id)}
                      onDelete={() => handleDelete(session.id)}
                      onLogSimilar={() => onLogSession(gunMap.get(session.gunId))}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ammo correlation insights */}
      {ammoCorrelation.filter(c => c.recommendation).length > 0 && (
        <div style={{
          marginTop: '24px',
          backgroundColor: theme.surface,
          border: `0.5px solid ${theme.border}`,
          borderRadius: '6px',
          padding: '14px',
        }}>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.blue, letterSpacing: '0.5px', marginBottom: '10px', textTransform: 'uppercase' }}>
            Ammo Performance Insights
          </div>
          {ammoCorrelation.filter(c => c.recommendation).slice(0, 5).map((c, i) => (
            <div key={i} style={{ marginBottom: '8px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textSecondary, marginBottom: '2px' }}>
                {c.gunName} · {c.ammoName}
              </div>
              <div style={{
                fontFamily: 'monospace', fontSize: '10px',
                color: c.issueRate > 0.3 ? '#ff9999' : '#69db7c',
                lineHeight: 1.4,
              }}>
                {c.recommendation}
              </div>
            </div>
          ))}
        </div>
      )}
      </>}

      {/* Undo delete toast */}
      {pendingDeleteId && (
        <div style={{
          position: 'fixed',
          bottom: 'calc(72px + env(safe-area-inset-bottom) + 10px)',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: theme.surface,
          border: `0.5px solid ${theme.border}`,
          borderRadius: '6px',
          padding: '11px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 1500,
          maxWidth: '360px',
          width: 'calc(100% - 32px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}>
          <span style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textSecondary, flex: 1 }}>
            Session deleted
          </span>
          <button
            onClick={handleUndo}
            style={{
              padding: '5px 14px',
              backgroundColor: theme.accent,
              color: theme.bg,
              border: 'none',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            UNDO
          </button>
        </div>
      )}

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '24px' }}
          onClick={() => setShowApiKeyModal(false)}
        >
          <div
            style={{ backgroundColor: theme.surface, borderRadius: '8px', padding: '24px', width: '100%', maxWidth: '420px' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: theme.textPrimary, marginBottom: '6px' }}>
              Claude AI Settings
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted, marginBottom: '16px', lineHeight: 1.5 }}>
              Enter your Anthropic API key to enable AI session narratives, target analysis, and smart insights.
              Key is stored locally on your device only.
            </div>
            <input
              type="password"
              placeholder="sk-ant-api03-..."
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              style={{
                width: '100%', padding: '10px', backgroundColor: theme.bg,
                border: `0.5px solid ${theme.border}`, borderRadius: '4px',
                color: theme.textPrimary, fontFamily: 'monospace', fontSize: '12px',
                boxSizing: 'border-box', outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                onClick={() => setShowApiKeyModal(false)}
                style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', border: `0.5px solid ${theme.border}`, borderRadius: '4px', color: theme.textSecondary, fontFamily: 'monospace', fontSize: '11px', cursor: 'pointer' }}
              >
                CANCEL
              </button>
              {hasClaudeApiKey() && (
                <button
                  onClick={() => { setClaudeApiKey(''); setApiKeyInput(''); setShowApiKeyModal(false); reload(); }}
                  style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', border: `0.5px solid #ff6b6b`, borderRadius: '4px', color: '#ff6b6b', fontFamily: 'monospace', fontSize: '11px', cursor: 'pointer' }}
                >
                  REMOVE
                </button>
              )}
              <button
                onClick={() => { setClaudeApiKey(apiKeyInput); setShowApiKeyModal(false); }}
                style={{ flex: 1, padding: '10px', backgroundColor: theme.accent, border: 'none', borderRadius: '4px', color: theme.bg, fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
              >
                SAVE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Detail Modal */}
      {editingId && (() => {
        const s = sessions.find(x => x.id === editingId);
        if (!s) return null;
        return (
          <SessionDetailModal
            session={s}
            gun={gunMap.get(s.gunId)}
            ammoLot={s.ammoLotId ? ammoMap.get(s.ammoLotId) : undefined}
            allGuns={guns}
            allAmmo={ammoLots}
            onClose={() => setEditingId(null)}
            onSaved={reload}
          />
        );
      })()}

      {/* Filter bottom sheet */}
      {showFilterSheet && (
        <>
          <div onClick={() => setShowFilterSheet(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 2500 }} />
          <div style={{
            position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: '100%', maxWidth: '480px', backgroundColor: theme.bg,
            borderTop: `0.5px solid ${theme.border}`, borderRadius: '12px 12px 0 0',
            zIndex: 2501, padding: '12px 20px calc(env(safe-area-inset-bottom) + 28px)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
              <div style={{ width: '32px', height: '4px', borderRadius: '2px', backgroundColor: theme.border }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, letterSpacing: '1px', fontWeight: 700 }}>FILTER</span>
              <button onClick={() => { setFilterGunId('all'); setFilterLocation('all'); setFilterIssues('all'); setGunSearch(''); }} style={{ background: 'none', border: 'none', color: theme.accent, fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer' }}>CLEAR ALL</button>
            </div>

            {/* Location */}
            {allLocations.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, letterSpacing: '0.8px', marginBottom: '8px' }}>LOCATION</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(['all', ...allLocations] as string[]).map(loc => (
                    <button key={loc} onClick={() => setFilterLocation(loc)} style={{
                      padding: '6px 12px', borderRadius: '3px',
                      backgroundColor: filterLocation === loc ? theme.accent : 'transparent',
                      color: filterLocation === loc ? theme.bg : theme.textSecondary,
                      border: `0.5px solid ${filterLocation === loc ? theme.accent : theme.border}`,
                      fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer', fontWeight: 600,
                    }}>
                      {loc === 'all' ? 'ALL' : loc}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Issues */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, letterSpacing: '0.8px', marginBottom: '8px' }}>ISSUES</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {([['all', 'All'], ['issues', 'Issues Only'], ['clean', 'No Issues']] as const).map(([val, label]) => (
                  <button key={val} onClick={() => setFilterIssues(val)} style={{
                    flex: 1, padding: '8px 6px', borderRadius: '3px',
                    backgroundColor: filterIssues === val ? theme.accent : 'transparent',
                    color: filterIssues === val ? theme.bg : theme.textSecondary,
                    border: `0.5px solid ${filterIssues === val ? theme.accent : theme.border}`,
                    fontFamily: 'monospace', fontSize: '9px', cursor: 'pointer', fontWeight: 600,
                  }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => setShowFilterSheet(false)} style={{
              width: '100%', padding: '11px', backgroundColor: theme.accent,
              border: 'none', borderRadius: '6px', color: theme.bg,
              fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
            }}>
              APPLY
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Filter chip ──────────────────────────────────────────────────────────────

function FilterChip({ label, active, onClick, color }: { label: string; active: boolean; onClick: () => void; color?: string }) {
  const c = color || theme.accent;
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 10px',
        backgroundColor: active ? c : 'transparent',
        color: active ? theme.bg : theme.textMuted,
        border: `0.5px solid ${active ? c : theme.border}`,
        borderRadius: '4px',
        fontFamily: 'monospace',
        fontSize: '10px',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        fontWeight: active ? 700 : 400,
      }}
    >
      {label}
    </button>
  );
}

// ── Session card with expand / edit / delete ─────────────────────────────────

interface SessionCardProps {
  session: Session;
  gun?: Gun;
  ammoLot?: AmmoLot;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onLogSimilar: () => void;
}

function SessionCard({
  session, gun, ammoLot, expanded, onToggle,
  onEdit, onDelete, onLogSimilar,
}: SessionCardProps) {
  const hasPhotos = (session.targetPhotos?.length || 0) > 0;
  const [photoIndex, setPhotoIndex] = useState(0);
  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const swipingActiveRef = useRef(false);

  function handleTouchStart(e: React.TouchEvent) {
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    swipingActiveRef.current = false;
  }

  function handleTouchMove(e: React.TouchEvent) {
    const dx = e.touches[0].clientX - startXRef.current;
    const dy = e.touches[0].clientY - startYRef.current;
    if (!swipingActiveRef.current) {
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
        swipingActiveRef.current = true;
        setSwiping(true);
      } else {
        return;
      }
    }
    const clamped = Math.max(-120, Math.min(0, dx));
    setSwipeX(clamped);
  }

  function handleTouchEnd() {
    if (swipeX < -80) {
      haptic(20);
      onDelete();
    } else {
      setSwipeX(0);
    }
    setSwiping(false);
    swipingActiveRef.current = false;
  }

  return (
    <div
      style={{
        position: 'relative',
        backgroundColor: theme.surface,
        border: `0.5px solid ${session.issues ? '#ff6b6b' : theme.border}`,
        borderRadius: '6px',
        overflow: 'hidden',
      }}
    >
      {/* Delete background layer */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0,
        width: '120px',
        backgroundColor: '#e03131',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: '0 6px 6px 0',
      }}>
        <span style={{ fontSize: '20px', userSelect: 'none' }}>🗑</span>
      </div>

      {/* Main row — tap to expand */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={!swiping && swipeX === 0 ? onToggle : undefined}
        style={{
          position: 'relative',
          transform: `translateX(${swipeX}px)`,
          transition: swiping ? 'none' : 'transform 0.15s',
          backgroundColor: theme.surface,
          cursor: 'pointer',
        }}
      >
      <div
        style={{ padding: '12px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: theme.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {gun ? `${gun.make} ${gun.model}` : 'Unknown Gun'}
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginBottom: '4px', marginTop: '1px' }}>
            {new Date(session.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          {/* Narrative or metadata row */}
          {session.aiNarrative ? (
            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, fontStyle: 'italic', marginBottom: '4px', lineHeight: 1.4 }}>
              {session.aiNarrative}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '2px' }}>
              {gun && <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#e03131' }}>{gun.caliber}</span>}
              {session.location && <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>{session.location}</span>}
              {session.distanceYards && <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>{session.distanceYards}yd</span>}
            </div>
          )}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            {session.purpose?.map(p => (
              <span key={p} style={{ fontFamily: 'monospace', fontSize: '8px', color: PURPOSE_COLORS[p] || theme.textMuted, padding: '1px 5px', border: `0.5px solid ${PURPOSE_COLORS[p] || theme.border}`, borderRadius: '3px' }}>
                {p.toUpperCase()}
              </span>
            ))}
            {session.indoorOutdoor && (
              <span style={{ fontFamily: 'monospace', fontSize: '8px', color: theme.textMuted, padding: '1px 5px', border: `0.5px solid ${theme.border}`, borderRadius: '3px' }}>
                {session.indoorOutdoor.toUpperCase()}
              </span>
            )}
            {session.issues && (
              <span style={{ fontFamily: 'monospace', fontSize: '8px', color: '#ff6b6b', padding: '1px 5px', border: `0.5px solid #ff6b6b`, borderRadius: '3px' }}>
                ISSUE
              </span>
            )}
            {hasPhotos && (
              <span style={{ fontFamily: 'monospace', fontSize: '8px', color: theme.blue, padding: '1px 5px', border: `0.5px solid ${theme.blue}`, borderRadius: '3px' }}>
                {session.targetPhotos!.length} TARGET{session.targetPhotos!.length > 1 ? 'S' : ''}
              </span>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 700, color: theme.textPrimary, lineHeight: 1 }}>
            {session.roundsExpended}
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '8px', color: theme.textMuted, marginTop: '2px' }}>ROUNDS</div>
          {session.sessionCost && (
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginTop: '2px' }}>
              ${session.sessionCost.toFixed(0)}
            </div>
          )}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: `0.5px solid ${theme.border}`, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* Ammo */}
          {ammoLot && (
            <Row label="Ammo" value={`${ammoLot.brand} ${ammoLot.productLine} ${ammoLot.grainWeight}gr ${ammoLot.bulletType}`} />
          )}

          {/* Distance */}
          {session.distanceYards && <Row label="Distance" value={`${session.distanceYards} yards`} />}

          {/* Issues */}
          {session.issueTypes?.length ? (
            <Row label="Issue Types" value={session.issueTypes.join(', ')} color="#ff9999" />
          ) : null}
          {session.issueDescription && <Row label="Issue Detail" value={session.issueDescription} color="#ff9999" />}

          {/* Notes */}
          {session.notes && <Row label="Notes" value={session.notes} />}

          {/* Target photos */}
          {hasPhotos && (
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '8px' }}>
                Targets
              </div>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
                {session.targetPhotos!.map((photo, idx) => (
                  <div key={photo.id} style={{ flexShrink: 0 }}>
                    <img
                      src={photo.dataUrl}
                      alt={`Target ${idx + 1}`}
                      onClick={() => setPhotoIndex(idx)}
                      style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', border: `1px solid ${theme.border}` }}
                    />
                    {photo.analysis && (
                      <div style={{ fontFamily: 'monospace', fontSize: '8px', color: theme.blue, marginTop: '2px', width: '80px', textAlign: 'center' }}>
                        {photo.analysis.accuracy || 'Analyzed'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {/* Show full analysis for selected photo */}
              {session.targetPhotos![photoIndex]?.analysis && (
                <div style={{ marginTop: '10px', backgroundColor: theme.bg, borderRadius: '6px', padding: '10px' }}>
                  <ExpandedAnalysis analysis={session.targetPhotos![photoIndex].analysis!} />
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
            <button
              onClick={onLogSimilar}
              style={{ flex: 1, padding: '8px', backgroundColor: 'transparent', border: `0.5px solid ${theme.border}`, borderRadius: '4px', color: theme.textMuted, fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer' }}
            >
              LOG SIMILAR
            </button>
            <button
              onClick={onEdit}
              style={{ flex: 1, padding: '8px', backgroundColor: 'transparent', border: `0.5px solid ${theme.border}`, borderRadius: '4px', color: theme.accent, fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer', fontWeight: 700 }}
            >
              EDIT
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', gap: '10px' }}>
      <span style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', minWidth: '72px', paddingTop: '1px' }}>
        {label}
      </span>
      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: color || theme.textSecondary, lineHeight: 1.4 }}>
        {value}
      </span>
    </div>
  );
}

function ExpandedAnalysis({ analysis }: { analysis: import('./types').TargetPhotoAnalysis }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.blue, textTransform: 'uppercase', marginBottom: '2px' }}>AI Target Analysis</div>
      {analysis.accuracy && <Row label="Accuracy" value={`${analysis.accuracy} · ${analysis.groupSize || ''}`} color={theme.accent} />}
      {analysis.pattern && <Row label="Pattern" value={analysis.pattern} />}
      {analysis.equipmentWarnings?.length ? (
        <div>
          {analysis.equipmentWarnings.map((w, i) => (
            <div key={i} style={{ fontFamily: 'monospace', fontSize: '10px', color: '#ff6b6b' }}>⚠ {w}</div>
          ))}
        </div>
      ) : null}
      {analysis.recommendations?.length ? (
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginBottom: '3px' }}>RECOMMENDATIONS</div>
          {analysis.recommendations.map((r, i) => (
            <div key={i} style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textSecondary }}>→ {r}</div>
          ))}
        </div>
      ) : null}
      {analysis.drills?.length ? (
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginBottom: '3px' }}>DRILLS</div>
          {analysis.drills.map((d, i) => (
            <div key={i} style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.accent }}>▸ {d}</div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ── Session Detail Modal ──────────────────────────────────────────────────────

interface SessionDetailModalProps {
  session: Session;
  gun?: Gun;
  ammoLot?: AmmoLot;
  allGuns: Gun[];
  allAmmo: AmmoLot[];
  onClose: () => void;
  onSaved: () => void;
}

const ALL_ISSUE_TYPES: IssueType[] = ['FTF', 'FTE', 'Double Feed', 'Stovepipe', 'Trigger Reset', 'Accuracy', 'Sighting', 'Other'];
const ALL_PURPOSES: SessionPurpose[] = ['Warmup', 'Drills', 'Zeroing', 'Qualification', 'Competition', 'Fun', 'Carry Eval'];

function SessionDetailModal({ session, gun, ammoLot, onClose, onSaved }: SessionDetailModalProps) {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [notes, setNotes] = useState(session.notes || '');
  const [location, setLocation] = useState(session.location || '');
  const [distanceYards, setDistanceYards] = useState<number | ''>(session.distanceYards ?? '');
  const [hasIssues, setHasIssues] = useState(session.issues || false);
  const [issueTypes, setIssueTypes] = useState<IssueType[]>(session.issueTypes || []);
  const [purposes, setPurposes] = useState<SessionPurpose[]>(session.purpose || []);
  const [roundsExpended, setRoundsExpended] = useState<number | ''>(session.roundsExpended);

  function toggleIssueType(t: IssueType) {
    setIssueTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  function togglePurpose(p: SessionPurpose) {
    setPurposes(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }

  function handleSave() {
    updateSession(session.id, {
      notes,
      location,
      distanceYards: distanceYards === '' ? undefined : Number(distanceYards),
      issues: hasIssues,
      issueTypes: hasIssues ? issueTypes : [],
      purpose: purposes,
      roundsExpended: roundsExpended === '' ? session.roundsExpended : Number(roundsExpended),
    });
    onSaved();
    onClose();
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted,
    textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px',
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px',
    backgroundColor: theme.bg,
    border: '0.5px solid ' + theme.border,
    borderRadius: '4px',
    color: theme.textPrimary,
    fontFamily: 'monospace',
    fontSize: '12px',
    boxSizing: 'border-box',
    outline: 'none',
  };
  const chipStyle = (active: boolean, activeColor?: string): React.CSSProperties => ({
    padding: '4px 10px',
    borderRadius: '3px',
    border: '0.5px solid ' + (active ? (activeColor || theme.accent) : theme.border),
    backgroundColor: active ? (activeColor || theme.accent) : 'transparent',
    color: active ? theme.bg : theme.textMuted,
    fontFamily: 'monospace',
    fontSize: '9px',
    cursor: 'pointer',
    fontWeight: active ? 700 : 400,
  });

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 3000 }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '480px',
          backgroundColor: theme.surface,
          borderRadius: '12px 12px 0 0',
          maxHeight: '90vh',
          overflowY: 'auto',
          zIndex: 3001,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px 10px',
          borderBottom: '0.5px solid ' + theme.border,
          position: 'sticky', top: 0, backgroundColor: theme.surface, zIndex: 1,
        }}>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: theme.textMuted, fontFamily: 'monospace', fontSize: '18px', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}
          >
            ×
          </button>
          <span style={{ fontFamily: 'monospace', fontSize: '10px', fontWeight: 700, color: theme.textSecondary, letterSpacing: '1px' }}>
            SESSION DETAIL
          </span>
          {mode === 'view' ? (
            <button
              onClick={() => setMode('edit')}
              style={{ background: 'none', border: '0.5px solid ' + theme.accent, borderRadius: '3px', color: theme.accent, fontFamily: 'monospace', fontSize: '9px', cursor: 'pointer', padding: '4px 10px', fontWeight: 700 }}
            >
              EDIT
            </button>
          ) : (
            <button
              onClick={handleSave}
              style={{ background: theme.accent, border: 'none', borderRadius: '3px', color: theme.bg, fontFamily: 'monospace', fontSize: '9px', cursor: 'pointer', padding: '4px 10px', fontWeight: 700 }}
            >
              SAVE
            </button>
          )}
        </div>

        <div style={{ padding: '16px' }}>
          {mode === 'view' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Gun + caliber */}
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 700, color: theme.accent, lineHeight: 1.2 }}>
                  {gun ? gun.make + ' ' + gun.model : 'Unknown Gun'}
                </div>
                {gun && (
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted, marginTop: '2px' }}>
                    {gun.caliber}
                  </div>
                )}
              </div>

              {/* Date */}
              <div>
                <div style={labelStyle}>Date</div>
                <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textSecondary }}>
                  {new Date(session.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>

              {/* Rounds */}
              <div>
                <div style={labelStyle}>Rounds Expended</div>
                <div style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 700, color: theme.textPrimary }}>
                  {session.roundsExpended}
                </div>
              </div>

              {/* Location + indoor/outdoor */}
              {(session.location || session.indoorOutdoor) && (
                <div>
                  <div style={labelStyle}>Location</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textSecondary }}>
                    {session.location || ''}
                    {session.location && session.indoorOutdoor ? ' · ' : ''}
                    {session.indoorOutdoor ? session.indoorOutdoor.charAt(0).toUpperCase() + session.indoorOutdoor.slice(1) : ''}
                  </div>
                </div>
              )}

              {/* Distance */}
              {session.distanceYards && (
                <div>
                  <div style={labelStyle}>Distance</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textSecondary }}>
                    {session.distanceYards} yards
                  </div>
                </div>
              )}

              {/* Purposes */}
              {session.purpose && session.purpose.length > 0 && (
                <div>
                  <div style={labelStyle}>Purposes</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {session.purpose.map(p => (
                      <span key={p} style={{ fontFamily: 'monospace', fontSize: '9px', color: PURPOSE_COLORS[p] || theme.textMuted, padding: '3px 8px', border: '0.5px solid ' + (PURPOSE_COLORS[p] || theme.border), borderRadius: '3px' }}>
                        {p.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Ammo */}
              {ammoLot && (
                <div>
                  <div style={labelStyle}>Ammo</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textSecondary }}>
                    {ammoLot.brand}
                    {ammoLot.productLine ? ' ' + ammoLot.productLine : ''}
                    {' · '}
                    {ammoLot.grainWeight}gr {ammoLot.bulletType}
                  </div>
                </div>
              )}

              {/* Issues */}
              {session.issues && (
                <div>
                  <div style={labelStyle}>Issues</div>
                  {session.issueTypes && session.issueTypes.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '6px' }}>
                      {session.issueTypes.map(t => (
                        <span key={t} style={{ fontFamily: 'monospace', fontSize: '9px', color: '#ff6b6b', padding: '3px 8px', border: '0.5px solid #ff6b6b', borderRadius: '3px' }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  {session.issueDescription && (
                    <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#ff9999', lineHeight: 1.4 }}>
                      {session.issueDescription}
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {session.notes && (
                <div>
                  <div style={labelStyle}>Notes</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textSecondary, lineHeight: 1.5 }}>
                    {session.notes}
                  </div>
                </div>
              )}

              {/* AI Narrative */}
              {session.aiNarrative && (
                <div>
                  <div style={labelStyle}>AI Narrative</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted, fontStyle: 'italic', lineHeight: 1.5 }}>
                    {session.aiNarrative}
                  </div>
                </div>
              )}

              {/* Target photos */}
              {session.targetPhotos && session.targetPhotos.length > 0 && (
                <div>
                  <div style={labelStyle}>Target Photos</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {session.targetPhotos.map((photo, idx) => (
                      <img
                        key={photo.id}
                        src={photo.dataUrl}
                        alt={'Target ' + (idx + 1)}
                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '0.5px solid ' + theme.border }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Session cost */}
              {session.sessionCost && (
                <div>
                  <div style={labelStyle}>Session Cost</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textSecondary }}>
                    {'$' + session.sessionCost.toFixed(2)}
                  </div>
                </div>
              )}

              {/* Strings */}
              {session.strings && session.strings.length > 1 && (
                <div>
                  <div style={labelStyle}>Strings</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {session.strings.map((str, idx) => (
                      <div key={idx} style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textSecondary, padding: '6px 10px', border: '0.5px solid ' + theme.border, borderRadius: '4px' }}>
                        {'#' + (idx + 1)}
                        {str.rounds ? ' · ' + str.rounds + ' rds' : ''}
                        {str.distanceYards ? ' · ' + str.distanceYards + 'yd' : ''}
                        {str.notes ? ' · ' + str.notes : ''}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Notes */}
              <div>
                <div style={labelStyle}>Notes</div>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              {/* Location */}
              <div>
                <div style={labelStyle}>Location</div>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Distance */}
              <div>
                <div style={labelStyle}>Distance (yards)</div>
                <input
                  type="number"
                  value={distanceYards}
                  onChange={e => setDistanceYards(e.target.value === '' ? '' : Number(e.target.value))}
                  style={inputStyle}
                />
              </div>

              {/* Issues toggle */}
              <div>
                <div style={labelStyle}>Issues</div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <button onClick={() => setHasIssues(false)} style={chipStyle(!hasIssues)}>NO ISSUES</button>
                  <button onClick={() => setHasIssues(true)} style={chipStyle(hasIssues, '#ff6b6b')}>HAS ISSUES</button>
                </div>
                {hasIssues && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {ALL_ISSUE_TYPES.map(t => (
                      <button key={t} onClick={() => toggleIssueType(t)} style={chipStyle(issueTypes.includes(t), '#ff6b6b')}>
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Purposes */}
              <div>
                <div style={labelStyle}>Purposes</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {ALL_PURPOSES.map(p => (
                    <button key={p} onClick={() => togglePurpose(p)} style={chipStyle(purposes.includes(p), PURPOSE_COLORS[p])}>
                      {p.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rounds expended */}
              <div>
                <div style={labelStyle}>Rounds Expended</div>
                <input
                  type="number"
                  value={roundsExpended}
                  onChange={e => setRoundsExpended(e.target.value === '' ? '' : Number(e.target.value))}
                  style={inputStyle}
                />
              </div>

              {/* Cancel */}
              <button
                onClick={() => setMode('view')}
                style={{ width: '100%', padding: '10px', backgroundColor: 'transparent', border: '0.5px solid ' + theme.border, borderRadius: '4px', color: theme.textSecondary, fontFamily: 'monospace', fontSize: '11px', cursor: 'pointer' }}
              >
                CANCEL
              </button>
            </div>
          )}
        </div>
        {/* bottom safe area padding */}
        <div style={{ height: 'calc(env(safe-area-inset-bottom) + 16px)' }} />
      </div>
    </div>
  );
}

// ─── Analytics Panel ──────────────────────────────────────────────────────────

function AnalyticsPanel({
  sessions,
  guns,
  ammoLots,
  totalCost,
}: {
  sessions: import('./types').Session[];
  guns: import('./types').Gun[];
  ammoLots: import('./types').AmmoLot[];
  totalCost: number;
}) {
  if (sessions.length === 0) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', color: theme.textMuted, fontFamily: 'monospace', fontSize: '11px' }}>
        No sessions yet. Start logging to see analytics.
      </div>
    );
  }

  const gunMap = new Map(guns.map(g => [g.id, g]));
  const ammoMap = new Map(ammoLots.map(a => [a.id, a]));

  // ── Monthly rounds (last 13 months) ─────────────────────────────────────
  const now = new Date();
  const months: { key: string; label: string; rounds: number; sessions: number; cost: number }[] = [];
  for (let i = 12; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    months.push({ key, label, rounds: 0, sessions: 0, cost: 0 });
  }
  for (const s of sessions) {
    const mk = s.date.slice(0, 7);
    const m = months.find(x => x.key === mk);
    if (m) { m.rounds += s.roundsExpended; m.sessions++; m.cost += s.sessionCost || 0; }
  }
  const maxRounds = Math.max(...months.map(m => m.rounds), 1);

  // ── Per-gun breakdown ────────────────────────────────────────────────────
  const gunStats: { id: string; name: string; rounds: number; sessions: number; issues: number }[] = [];
  for (const s of sessions) {
    let entry = gunStats.find(x => x.id === s.gunId);
    if (!entry) {
      const g = gunMap.get(s.gunId);
      entry = { id: s.gunId, name: g ? g.make + ' ' + g.model : 'Unknown', rounds: 0, sessions: 0, issues: 0 };
      gunStats.push(entry);
    }
    entry.rounds += s.roundsExpended;
    entry.sessions++;
    if (s.issues) entry.issues++;
  }
  gunStats.sort((a, b) => b.rounds - a.rounds);
  const maxGunRounds = Math.max(...gunStats.map(g => g.rounds), 1);

  // ── Purpose breakdown ────────────────────────────────────────────────────
  const purposeCounts: Record<string, number> = {};
  for (const s of sessions) {
    for (const p of s.purpose || []) {
      purposeCounts[p] = (purposeCounts[p] || 0) + 1;
    }
  }
  const purposes = Object.entries(purposeCounts).sort((a, b) => b[1] - a[1]);
  const maxPurpose = Math.max(...purposes.map(p => p[1]), 1);

  // ── Location breakdown ───────────────────────────────────────────────────
  const locCounts: Record<string, number> = {};
  for (const s of sessions) {
    if (s.location) locCounts[s.location] = (locCounts[s.location] || 0) + 1;
  }
  const locations = Object.entries(locCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxLoc = Math.max(...locations.map(l => l[1]), 1);

  // ── Caliber/ammo breakdown ───────────────────────────────────────────────
  const caliberRounds: Record<string, number> = {};
  for (const s of sessions) {
    const lot = s.ammoLotId ? ammoMap.get(s.ammoLotId) : undefined;
    const cal = lot?.caliber || (gunMap.get(s.gunId)?.caliber) || 'Unknown';
    caliberRounds[cal] = (caliberRounds[cal] || 0) + s.roundsExpended;
  }
  const calibers = Object.entries(caliberRounds).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const totalRoundsAll = sessions.reduce((s, x) => s + x.roundsExpended, 0);

  // ── Indoor / Outdoor ─────────────────────────────────────────────────────
  const indoor = sessions.filter(s => s.indoorOutdoor === 'Indoor').length;
  const outdoor = sessions.filter(s => s.indoorOutdoor === 'Outdoor').length;
  const ioTotal = indoor + outdoor;

  // ── Issue rate ────────────────────────────────────────────────────────────
  const issueCount = sessions.filter(s => s.issues).length;
  const issueRate = sessions.length > 0 ? Math.round((issueCount / sessions.length) * 100) : 0;

  const sectionLabel: React.CSSProperties = {
    fontFamily: 'monospace', fontSize: '9px', letterSpacing: '1.2px',
    color: theme.textMuted, textTransform: 'uppercase', marginBottom: '12px',
  };
  const card: React.CSSProperties = {
    backgroundColor: theme.surface, border: `0.5px solid ${theme.border}`,
    borderRadius: '8px', padding: '14px', marginBottom: '14px',
  };

  return (
    <div style={{ paddingBottom: '32px' }}>

      {/* ── Monthly Rounds Chart ─────────────────────────────────── */}
      <div style={card}>
        <div style={sectionLabel}>ROUNDS FIRED — MONTHLY</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '64px' }}>
          {months.map(m => (
            <div key={m.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
              <div
                title={`${m.label}: ${m.rounds} rds`}
                style={{
                  width: '100%', borderRadius: '2px 2px 0 0',
                  height: m.rounds === 0 ? '2px' : `${Math.max(4, Math.round((m.rounds / maxRounds) * 56))}px`,
                  backgroundColor: m.key === months[months.length - 1].key ? theme.accent : theme.border,
                  transition: 'height 0.3s',
                }}
              />
              <div style={{ fontFamily: 'monospace', fontSize: '7px', color: theme.textMuted, lineHeight: 1 }}>
                {m.label.slice(0, 1)}
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginTop: '8px' }}>
          {totalRoundsAll.toLocaleString()} total rounds · {sessions.length} sessions
          {totalCost > 0 && ` · $${totalCost.toFixed(0)} spent`}
        </div>
      </div>

      {/* ── Rounds by Gun ──────────────────────────────────────────── */}
      <div style={card}>
        <div style={sectionLabel}>ROUNDS BY PLATFORM</div>
        {gunStats.slice(0, 8).map(g => (
          <div key={g.id} style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textPrimary, fontWeight: 600 }}>
                {g.name}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textSecondary }}>
                {g.rounds.toLocaleString()} rds
                {g.issues > 0 && <span style={{ color: '#ff9999', marginLeft: '6px' }}>⚠ {g.issues}</span>}
              </div>
            </div>
            <div style={{ height: '4px', backgroundColor: theme.bg, borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.round((g.rounds / maxGunRounds) * 100)}%`,
                backgroundColor: g.issues / g.sessions > 0.2 ? '#ff6b6b' : theme.accent,
                borderRadius: '2px',
                transition: 'width 0.3s',
              }} />
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '8px', color: theme.textMuted, marginTop: '2px' }}>
              {g.sessions} sessions · {g.issues > 0 ? `${Math.round((g.issues / g.sessions) * 100)}% issue rate` : 'clean record'}
            </div>
          </div>
        ))}
      </div>

      {/* ── Caliber Breakdown ──────────────────────────────────────── */}
      {calibers.length > 0 && (
        <div style={card}>
          <div style={sectionLabel}>ROUNDS BY CALIBER</div>
          {calibers.map(([cal, rds]) => {
            const pct = Math.round((rds / totalRoundsAll) * 100);
            return (
              <div key={cal} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textSecondary, width: '90px', flexShrink: 0 }}>
                  {cal}
                </div>
                <div style={{ flex: 1, height: '4px', backgroundColor: theme.bg, borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, backgroundColor: theme.blue, borderRadius: '2px' }} />
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, width: '40px', textAlign: 'right', flexShrink: 0 }}>
                  {pct}%
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Purpose + Location row ─────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
        {/* Purpose */}
        {purposes.length > 0 && (
          <div style={{ ...card, flex: 1, marginBottom: 0 }}>
            <div style={sectionLabel}>PURPOSE</div>
            {purposes.slice(0, 5).map(([p, count]) => (
              <div key={p} style={{ marginBottom: '7px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textSecondary }}>{p}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted }}>{count}</span>
                </div>
                <div style={{ height: '3px', backgroundColor: theme.bg, borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.round((count / maxPurpose) * 100)}%`, backgroundColor: PURPOSE_COLORS[p] || theme.textMuted, borderRadius: '2px' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Location */}
        {locations.length > 0 && (
          <div style={{ ...card, flex: 1, marginBottom: 0 }}>
            <div style={sectionLabel}>TOP RANGES</div>
            {locations.map(([loc, count]) => (
              <div key={loc} style={{ marginBottom: '7px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80px' }}>{loc}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, flexShrink: 0 }}>{count}</span>
                </div>
                <div style={{ height: '3px', backgroundColor: theme.bg, borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.round((count / maxLoc) * 100)}%`, backgroundColor: theme.green, borderRadius: '2px' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Summary row ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {ioTotal > 0 && (
          <div style={{ ...card, flex: 1, marginBottom: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginBottom: '6px' }}>INDOOR / OUTDOOR</div>
            <div style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 700, color: theme.textPrimary }}>
              {Math.round((outdoor / ioTotal) * 100)}%
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted }}>outdoor</div>
          </div>
        )}
        <div style={{ ...card, flex: 1, marginBottom: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginBottom: '6px' }}>ISSUE RATE</div>
          <div style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 700, color: issueRate > 20 ? '#ff6b6b' : theme.green }}>
            {issueRate}%
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted }}>of sessions</div>
        </div>
        {totalCost > 0 && (
          <div style={{ ...card, flex: 1, marginBottom: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginBottom: '6px' }}>CPR AVG</div>
            <div style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 700, color: theme.textSecondary }}>
              ${totalRoundsAll > 0 ? (totalCost / totalRoundsAll).toFixed(2) : '—'}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted }}>per round</div>
          </div>
        )}
      </div>
    </div>
  );
}
