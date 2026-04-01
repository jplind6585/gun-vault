import { useState, useEffect } from 'react';
import { theme } from './theme';
import { getAllGuns, getAllSessions, getAllAmmo } from './storage';
import type { Gun, Session, AmmoLot } from './types';

interface HomePageProps {
  onNavigateToVault: () => void;
  onNavigateToArsenal: () => void;
  onNavigateToTargetAnalysis: () => void;
  onNavigateToGun: (gun: Gun) => void;
  onLogSession: (gun?: Gun) => void;
  onAddGun: () => void;
  onSearchOpen: () => void;
  onDevTools?: () => void;
  onVersionTap?: () => void;
  devTapCount?: number;
}

type TimePeriod = 'week' | 'month' | 'year';

// Categorise an ammo lot by matching its caliber to guns in vault
function ammoType(lot: AmmoLot, guns: Gun[]): 'Handgun' | 'Rifle' | 'Shotgun' | 'Other' {
  const match = guns.find(g => g.caliber === lot.caliber);
  if (!match) {
    // Fallback: keyword hints
    const c = lot.caliber.toLowerCase();
    if (c.includes('gauge') || c.includes('shot')) return 'Shotgun';
    if (['9mm','45','40 s&w','.380','.357','.38','10mm'].some(x => c.includes(x))) return 'Handgun';
    return 'Rifle';
  }
  if (match.type === 'Pistol' || match.type === 'NFA') return 'Handgun';
  if (match.type === 'Shotgun') return 'Shotgun';
  if (match.type === 'Rifle') return 'Rifle';
  return 'Other';
}

export function HomePage({
  onNavigateToVault,
  onNavigateToArsenal,
  onLogSession,
  onAddGun,
  onSearchOpen,
  onDevTools,
  onVersionTap,
  devTapCount = 0,
}: HomePageProps) {
  const [guns, setGuns]       = useState<Gun[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [ammo, setAmmo]       = useState<AmmoLot[]>([]);
  const [period, setPeriod]   = useState<TimePeriod>('month');

  useEffect(() => {
    setGuns(getAllGuns());
    setSessions(getAllSessions());
    setAmmo(getAllAmmo());
  }, []);

  // ── Period filter ─────────────────────────────────────────────────────────
  const now = new Date();

  function inPeriod(dateStr: string): boolean {
    const d = new Date(dateStr);
    if (period === 'week')  { const c = new Date(now); c.setDate(now.getDate() - 7);   return d >= c; }
    if (period === 'month') { const c = new Date(now); c.setDate(now.getDate() - 30);  return d >= c; }
    return d.getFullYear() === now.getFullYear();
  }

  const periodSessions = sessions.filter(s => inPeriod(s.date));

  // ── Gun breakdown ─────────────────────────────────────────────────────────
  const allActiveGuns = guns.filter(g => g.status !== 'Sold' && g.status !== 'Transferred');
  const gunHandguns  = allActiveGuns.filter(g => g.type === 'Pistol').length;
  const gunRifles    = allActiveGuns.filter(g => g.type === 'Rifle').length;
  const gunShotguns  = allActiveGuns.filter(g => g.type === 'Shotgun').length;
  const gunOther     = allActiveGuns.filter(g => !['Pistol','Rifle','Shotgun'].includes(g.type)).length;

  // ── Ammo breakdown ────────────────────────────────────────────────────────
  const totalAmmoRounds  = ammo.reduce((s, l) => s + l.quantity, 0);
  const ammoHandgun  = ammo.filter(l => ammoType(l, guns) === 'Handgun').reduce((s, l) => s + l.quantity, 0);
  const ammoRifle    = ammo.filter(l => ammoType(l, guns) === 'Rifle').reduce((s, l) => s + l.quantity, 0);
  const ammoShotgun  = ammo.filter(l => ammoType(l, guns) === 'Shotgun').reduce((s, l) => s + l.quantity, 0);

  // ── Period activity stats ─────────────────────────────────────────────────
  const periodShots = periodSessions.reduce((s, x) => s + x.roundsExpended, 0);
  const avgRounds   = periodSessions.length > 0 ? Math.round(periodShots / periodSessions.length) : 0;

  const sortedSessions = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  const lastSession    = sortedSessions[0];
  const daysSinceLast  = lastSession
    ? Math.floor((now.getTime() - new Date(lastSession.date).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const monthsActive      = new Set(sessions.map(s => s.date.slice(0, 7))).size || 1;
  const sessionsPerMonth  = (sessions.length / monthsActive).toFixed(1);

  // ── Top 3 guns (period-filtered) ─────────────────────────────────────────
  const roundsByGun = periodSessions.reduce((acc, s) => {
    acc[s.gunId] = (acc[s.gunId] || 0) + s.roundsExpended;
    return acc;
  }, {} as Record<string, number>);
  const top3 = Object.entries(roundsByGun)
    .sort(([,a],[,b]) => b - a).slice(0, 3)
    .map(([id, rounds]) => ({ gun: guns.find(g => g.id === id), rounds }))
    .filter(x => x.gun);

  // ── Top caliber ───────────────────────────────────────────────────────────
  const roundsByCal = sessions.reduce((acc, s) => {
    const g = guns.find(x => x.id === s.gunId);
    if (g) acc[g.caliber] = (acc[g.caliber] || 0) + s.roundsExpended;
    return acc;
  }, {} as Record<string, number>);
  const topCal = Object.entries(roundsByCal).sort(([,a],[,b]) => b - a)[0];

  // ── Recommendations + insights ────────────────────────────────────────────
  const recs: string[] = [];
  const dirtyGuns = guns.filter(g =>
    sessions.filter(s => s.gunId === g.id).reduce((sum, s) => sum + s.roundsExpended, 0) >= 500
  );
  if (dirtyGuns.length > 0)
    recs.push(`${dirtyGuns.length} gun${dirtyGuns.length > 1 ? 's' : ''} due for cleaning`);
  if (daysSinceLast !== null && daysSinceLast > 30)
    recs.push(`${daysSinceLast} days since last session`);
  if (totalAmmoRounds < 500 && guns.length > 0)
    recs.push('Ammo stock below 500 rounds');

  const insights: string[] = [];
  const recent10 = sortedSessions.slice(0, 10);
  const avgRecent = recent10.length > 0
    ? Math.round(recent10.reduce((s,x) => s + x.roundsExpended, 0) / recent10.length) : 0;
  if (avgRecent > 0) insights.push(`Avg ${avgRecent} rds · last ${recent10.length} sessions`);
  if (topCal) insights.push(`Top caliber: ${topCal[0]} — ${topCal[1].toLocaleString()} rds`);
  if (top3[0]?.gun) insights.push(`Most fired: ${top3[0].gun!.make} ${top3[0].gun!.model}`);

  // ── Shared styles ─────────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    backgroundColor: theme.surface,
    border: `0.5px solid ${theme.border}`,
    borderRadius: '8px',
    padding: '14px 16px',
  };

  const sectionLabel: React.CSSProperties = {
    fontFamily: 'monospace', fontSize: '9px',
    letterSpacing: '1.2px', color: theme.textMuted,
    textTransform: 'uppercase', marginBottom: '8px',
  };

  const bigVal = (color = theme.textPrimary): React.CSSProperties => ({
    fontFamily: 'monospace', fontSize: '28px',
    fontWeight: 700, color, lineHeight: 1,
  });

  const subVal: React.CSSProperties = {
    fontFamily: 'monospace', fontSize: '16px',
    fontWeight: 700, color: theme.textPrimary,
  };

  const subLabel: React.CSSProperties = {
    fontFamily: 'monospace', fontSize: '10px',
    color: theme.textMuted, marginTop: '2px',
  };

  const periodBtn = (active: boolean): React.CSSProperties => ({
    padding: '5px 14px',
    backgroundColor: active ? theme.accent : 'transparent',
    border: `0.5px solid ${active ? theme.accent : theme.border}`,
    borderRadius: '3px',
    color: active ? theme.bg : theme.textMuted,
    fontFamily: 'monospace', fontSize: '10px',
    letterSpacing: '0.8px', fontWeight: 700,
    cursor: 'pointer',
  });

  return (
    <div style={{
      backgroundColor: theme.bg,
      padding: '16px',
      paddingBottom: '24px',
      overflowX: 'hidden',
      boxSizing: 'border-box',
    }}>

      {/* ── SEARCH ROW ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <button onClick={onSearchOpen} style={{
          flex: 1, padding: '10px 14px',
          backgroundColor: theme.surface,
          border: `0.5px solid ${theme.border}`,
          borderRadius: '6px', color: theme.textMuted,
          fontFamily: 'monospace', fontSize: '12px',
          textAlign: 'left', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Search guns, ammo, sessions...
        </button>
        {onDevTools && (
          <button onClick={onDevTools} style={{
            width: '40px', height: '40px', flexShrink: 0,
            backgroundColor: theme.surface,
            border: `0.5px solid ${theme.border}`,
            borderRadius: '6px', color: theme.textMuted,
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: '16px',
          }}>
            ⚙
          </button>
        )}
      </div>

      {/* ── GUNS + AMMO CARD ── */}
      <div style={{ display: 'flex', marginBottom: '10px', borderRadius: '8px', overflow: 'hidden', border: `0.5px solid ${theme.border}` }}>

        {/* GUNS — 2/3 width, clickable */}
        <button onClick={onNavigateToVault} style={{
          flex: 2, padding: '14px 16px',
          backgroundColor: theme.surface,
          border: 'none', borderRight: `0.5px solid ${theme.border}`,
          textAlign: 'left', cursor: 'pointer',
        }}>
          <div style={sectionLabel}>Guns Owned</div>
          <div style={bigVal(theme.accent)}>{allActiveGuns.length}</div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px', marginTop: '12px',
          }}>
            {[
              { val: gunHandguns, lbl: 'Handguns' },
              { val: gunRifles,   lbl: 'Rifles'   },
              { val: gunShotguns, lbl: 'Shotguns' },
            ].map(item => (
              <div key={item.lbl}>
                <div style={subVal}>{item.val}</div>
                <div style={subLabel}>{item.lbl}</div>
              </div>
            ))}
          </div>
        </button>

        {/* AMMO — 1/3 width, clickable */}
        <button onClick={onNavigateToArsenal} style={{
          flex: 1, padding: '14px 16px',
          backgroundColor: theme.surface,
          border: 'none', textAlign: 'left', cursor: 'pointer',
        }}>
          <div style={sectionLabel}>Rounds</div>
          <div style={bigVal(theme.textPrimary)}>
            {totalAmmoRounds > 999
              ? `${(totalAmmoRounds / 1000).toFixed(1)}k`
              : totalAmmoRounds}
          </div>
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { val: ammoHandgun, lbl: 'Handgun' },
              { val: ammoRifle,   lbl: 'Rifle'   },
              { val: ammoShotgun, lbl: 'Shotgun' },
            ].map(item => (
              <div key={item.lbl} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={subLabel}>{item.lbl}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 600, color: theme.textSecondary }}>
                  {item.val > 999 ? `${(item.val/1000).toFixed(1)}k` : item.val}
                </span>
              </div>
            ))}
          </div>
        </button>

      </div>

      {/* ── PERIOD TOGGLE ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: '8px',
      }}>
        <span style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, letterSpacing: '1px' }}>
          ACTIVITY & STATS
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['week','month','year'] as TimePeriod[]).map(p => (
            <button key={p} style={periodBtn(period === p)} onClick={() => setPeriod(p)}>
              {p === 'week' ? 'WK' : p === 'month' ? 'MO' : 'YR'}
            </button>
          ))}
        </div>
      </div>

      {/* ── ACTIVITY STATS (2×3 grid, no scroll) ── */}
      <div style={{ ...card, marginBottom: '10px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '14px 8px',
        }}>
          {[
            { val: periodSessions.length.toString(),              lbl: 'Sessions'       },
            { val: periodShots.toLocaleString(),                  lbl: 'Rounds Fired'   },
            { val: avgRounds > 0 ? avgRounds.toString() : '—',   lbl: 'Avg/Session'    },
            { val: daysSinceLast !== null ? `${daysSinceLast}d` : '—', lbl: 'Last Session' },
            { val: sessions.reduce((s,x) => s + x.roundsExpended, 0).toLocaleString(), lbl: 'Total Rounds' },
            { val: sessionsPerMonth,                              lbl: 'Sessions/Mo'    },
          ].map(item => (
            <div key={item.lbl}>
              <div style={{
                fontFamily: 'monospace', fontSize: '20px',
                fontWeight: 700, color: theme.textPrimary, lineHeight: 1,
              }}>
                {item.val}
              </div>
              <div style={subLabel}>{item.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FAVORITE GUNS ── */}
      {top3.length > 0 && (
        <div style={{ ...card, marginBottom: '10px' }}>
          <div style={sectionLabel}>Favorite Guns</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {top3.map(({ gun, rounds }, i) => (
              <div key={gun!.id} style={{
                display: 'flex', alignItems: 'flex-start',
                justifyContent: 'space-between', gap: '8px',
              }}>
                {/* Rank */}
                <span style={{
                  fontFamily: 'monospace', fontSize: '10px',
                  color: i === 0 ? theme.accent : theme.textMuted,
                  fontWeight: 700, width: '20px', flexShrink: 0, paddingTop: '1px',
                }}>
                  #{i + 1}
                </span>

                {/* Name + caliber — wraps on narrow screens */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{
                    fontFamily: 'monospace', fontSize: '13px', fontWeight: 700,
                    color: i === 0 ? theme.accent : theme.textPrimary,
                  }}>
                    {gun!.make} {gun!.model}
                  </span>
                  {' '}
                  <span style={{
                    fontFamily: 'monospace', fontSize: '10px',
                    color: theme.caliberRed,
                  }}>
                    {gun!.caliber}
                  </span>
                </div>

                {/* Rounds + LOG button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <span style={{
                    fontFamily: 'monospace', fontSize: '12px',
                    fontWeight: 600, color: theme.textSecondary,
                    textAlign: 'right',
                  }}>
                    {rounds.toLocaleString()} rds
                  </span>
                  <button
                    onClick={() => onLogSession(gun!)}
                    style={{
                      padding: '4px 10px',
                      backgroundColor: 'transparent',
                      border: `0.5px solid ${theme.border}`,
                      borderRadius: '3px',
                      color: theme.textMuted,
                      fontFamily: 'monospace',
                      fontSize: '9px',
                      letterSpacing: '0.5px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      minHeight: '28px',
                    }}
                  >
                    LOG
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── RECOMMENDATIONS + INSIGHTS ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px' }}>

        <div style={card}>
          <div style={sectionLabel}>Recommendations</div>
          {recs.length === 0
            ? <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted }}>All clear.</div>
            : recs.slice(0, 3).map((r, i) => (
              <div key={i} style={{
                padding: '7px 10px', marginBottom: i < recs.length - 1 ? '6px' : 0,
                backgroundColor: theme.bg,
                borderLeft: `2px solid ${theme.accent}`,
                borderRadius: '0 4px 4px 0',
                fontFamily: 'monospace', fontSize: '11px',
                color: theme.textSecondary,
              }}>{r}</div>
            ))
          }
        </div>

        <div style={card}>
          <div style={sectionLabel}>Training Insights</div>
          {insights.length === 0
            ? <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted }}>Log sessions to see insights.</div>
            : insights.map((ins, i) => (
              <div key={i} style={{
                padding: '7px 10px', marginBottom: i < insights.length - 1 ? '6px' : 0,
                backgroundColor: theme.bg,
                borderLeft: `2px solid ${theme.green}`,
                borderRadius: '0 4px 4px 0',
                fontFamily: 'monospace', fontSize: '11px',
                color: theme.textSecondary,
              }}>{ins}</div>
            ))
          }
        </div>

      {/* Version tap target — 7 taps unlocks dev tools */}
      <div style={{ paddingBottom: '8px', textAlign: 'center' }}>
        <span
          onClick={onVersionTap}
          style={{
            fontFamily: 'monospace', fontSize: '9px',
            color: devTapCount > 0 ? theme.accent : theme.textMuted,
            opacity: devTapCount > 0 ? 1 : 0.4,
            cursor: 'default', userSelect: 'none',
            letterSpacing: '0.5px',
          }}
        >
          {devTapCount > 0 ? `${devTapCount}/7` : 'LINDCOTT ARMORY v1.0'}
        </span>
      </div>

    </div>
  );
}
