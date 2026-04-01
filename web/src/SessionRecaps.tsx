import { useState, useEffect, useRef } from 'react';
import { theme } from './theme';
import { haptic } from './haptic';
import { getAllSessions, getAllGuns, getAllAmmo, deleteSession, updateSession } from './storage';
import {
  getMaintenanceAlerts, getAmmoCorrelation, getTrainingGapDays,
  hasClaudeApiKey, getClaudeApiKey, setClaudeApiKey,
} from './claudeApi';
import { ActivityHeatmap } from './ActivityHeatmap';
import type { Session, Gun, AmmoLot, SessionPurpose } from './types';

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
    return true;
  });

  // Stats
  const now = new Date();
  const thisMonth = now.toISOString().slice(0, 7);
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

  // All purposes used
  const allPurposes = [...new Set(sessions.flatMap(s => s.purpose || []))];

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  function handleDelete(id: string) {
    deleteSession(id);
    setExpandedId(null);
    reload();
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
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {statCard('Sessions', sessions.length, 'all time')}
        {statCard('This Month', roundsThisMonth.toLocaleString(), 'rounds', theme.green)}
        {statCard('Gap', gapDays === Infinity ? '—' : `${gapDays}d`, 'since last trip', gapDays > 14 ? '#ff6b6b' : theme.textSecondary)}
      </div>

      {mostActiveGunId && gunMap.get(mostActiveGunId) && (
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

      {/* Activity heatmap */}
      {sessions.length > 0 && (
        <div style={{
          backgroundColor: theme.surface,
          border: `0.5px solid ${theme.border}`,
          borderRadius: '6px',
          padding: '12px 14px',
          marginBottom: '16px',
          overflowX: 'auto',
        }}>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, letterSpacing: '0.5px', marginBottom: '10px', textTransform: 'uppercase' }}>
            Range Activity — Past Year
          </div>
          <ActivityHeatmap sessions={sessions} />
        </div>
      )}

      {/* Maintenance alerts */}
      {maintenanceAlerts.length > 0 && (
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

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted }}>
          {filtered.length} sessions · {filtered.reduce((s, x) => s + x.roundsExpended, 0).toLocaleString()} rds
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setShowApiKeyModal(true)}
            style={{
              padding: '6px 10px',
              backgroundColor: hasClaudeApiKey() ? 'rgba(116,192,252,0.1)' : theme.surface,
              border: `0.5px solid ${hasClaudeApiKey() ? theme.blue : theme.border}`,
              borderRadius: '4px',
              color: hasClaudeApiKey() ? theme.blue : theme.textMuted,
              fontFamily: 'monospace',
              fontSize: '9px',
              cursor: 'pointer',
              letterSpacing: '0.5px',
            }}
          >
            {hasClaudeApiKey() ? 'AI ON' : 'AI OFF'}
          </button>
          <button
            onClick={() => onLogSession()}
            style={{
              padding: '8px 14px',
              backgroundColor: theme.accent,
              border: 'none',
              borderRadius: '6px',
              color: theme.bg,
              fontFamily: 'monospace',
              fontSize: '11px',
              letterSpacing: '0.8px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            + LOG
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', overflowX: 'auto' }}>
        <FilterChip label="All Guns" active={filterGunId === 'all'} onClick={() => setFilterGunId('all')} />
        {guns
          .filter(g => sessions.some(s => s.gunId === g.id))
          .map(g => (
            <FilterChip key={g.id} label={`${g.make} ${g.model}`} active={filterGunId === g.id} onClick={() => setFilterGunId(g.id)} />
          ))
        }
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
          <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textMuted, marginBottom: '16px' }}>
            NO SESSIONS LOGGED
          </div>
          <button
            onClick={() => onLogSession()}
            style={{
              padding: '10px 20px', backgroundColor: theme.accent,
              border: 'none', borderRadius: '6px', color: theme.bg,
              fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
            }}
          >
            LOG YOUR FIRST SESSION
          </button>
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
                    {hasIssues && <span style={{ fontFamily: 'monospace', fontSize: '9px', color: '#ff6b6b' }}>ISSUES</span>}
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
  onDelete, onLogSimilar,
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
          <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: theme.textPrimary, marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {gun ? `${gun.make} ${gun.model}` : 'Unknown Gun'}
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
