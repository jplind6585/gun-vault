import { useState, useEffect } from 'react';
import { theme } from './theme';
import { getAllGuns, getAllSessions, getAllAmmo, updateGun } from './storage';
import { getSettings } from './SettingsPanel';
import type { Gun, Session, AmmoLot } from './types';

interface HomePageProps {
  onNavigateToVault: () => void;
  onNavigateToArsenal: () => void;
  onNavigateToTargetAnalysis: () => void;
  onNavigateToGun: (gun: Gun) => void;
  onLogSession: (gun?: Gun) => void;
  onAddGun: () => void;
  onSearchOpen: () => void;
  onSettingsOpen?: () => void;
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
  onSettingsOpen,
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

  // ── Smart ARMORY alerts ───────────────────────────────────────────────────
  const cfg = getSettings();
  const activeGuns = guns.filter(g => g.status !== 'Sold' && g.status !== 'Transferred');

  interface ArmoryAlert { gunId?: string; label: string; action?: string; }
  const armoryAlerts: ArmoryAlert[] = [];

  // 1. Cleaning due — only guns that have been shot
  for (const g of activeGuns) {
    if (!g.roundCount || g.roundCount === 0) continue;
    const shotsSinceClean = g.lastCleanedRoundCount != null
      ? (g.roundCount - g.lastCleanedRoundCount)
      : g.roundCount;
    if (shotsSinceClean >= cfg.cleanThresholdRounds) {
      const name = g.displayName || `${g.make} ${g.model}`;
      armoryAlerts.push({
        gunId: g.id,
        label: `${name} — ${shotsSinceClean.toLocaleString()} rds since clean`,
        action: 'LOG CLEAN',
      });
    }
  }

  // 2. Ammo low — only calibers with a gun shot in last 90 days
  const ninetyDaysAgo = new Date(now); ninetyDaysAgo.setDate(now.getDate() - 90);
  const recentlyUsedCalibers = new Set(
    sessions
      .filter(s => new Date(s.date) >= ninetyDaysAgo)
      .map(s => guns.find(g => g.id === s.gunId)?.caliber)
      .filter(Boolean) as string[]
  );
  const roundsByCaliber: Record<string, number> = {};
  ammo.forEach(lot => { roundsByCaliber[lot.caliber] = (roundsByCaliber[lot.caliber] || 0) + lot.quantity; });
  for (const cal of recentlyUsedCalibers) {
    const qty = roundsByCaliber[cal] || 0;
    if (qty < cfg.ammoLowThreshold) {
      armoryAlerts.push({ label: `${cal} — only ${qty} rds remaining` });
    }
  }

  // 3. Idle gun — 3+ sessions on record, none in N days
  for (const g of activeGuns) {
    const gunSessions = sessions.filter(s => s.gunId === g.id);
    if (gunSessions.length < 3) continue;
    const lastGunSession = gunSessions.sort((a, b) => b.date.localeCompare(a.date))[0];
    const idleDays = Math.floor((now.getTime() - new Date(lastGunSession.date).getTime()) / 86400000);
    if (idleDays >= cfg.idleGunDays) {
      const name = g.displayName || `${g.make} ${g.model}`;
      armoryAlerts.push({ label: `${name} hasn't been shot in ${idleDays}d` });
    }
  }

  const topArmoryAlerts = armoryAlerts.slice(0, 3);

  // ── Smart RANGE recommendations ───────────────────────────────────────────
  interface RangeRec { label: string; }
  const rangeRecs: RangeRec[] = [];

  // 1. Frequency dropping — need 6+ sessions to establish baseline
  if (sortedSessions.length >= 6) {
    function gapDays(a: Session, b: Session) {
      return (new Date(a.date).getTime() - new Date(b.date).getTime()) / 86400000;
    }
    const avgGapRecent = (
      gapDays(sortedSessions[0], sortedSessions[1]) +
      gapDays(sortedSessions[1], sortedSessions[2])
    ) / 2;
    const avgGapPrior = (
      gapDays(sortedSessions[3], sortedSessions[4]) +
      gapDays(sortedSessions[4], sortedSessions[5])
    ) / 2;
    if (avgGapPrior > 0 && avgGapRecent > avgGapPrior * 1.5) {
      rangeRecs.push({ label: `Sessions are spacing out — avg gap up from ${Math.round(avgGapPrior)}d to ${Math.round(avgGapRecent)}d` });
    }
  }

  // 2. Neglected gun — 2+ guns with history, one hasn't been shot in 45d
  const gunsWithHistory = activeGuns.filter(g => sessions.filter(s => s.gunId === g.id).length >= 3);
  if (gunsWithHistory.length >= 2) {
    const neglected = gunsWithHistory
      .map(g => {
        const last = sessions.filter(s => s.gunId === g.id).sort((a, b) => b.date.localeCompare(a.date))[0];
        const days = Math.floor((now.getTime() - new Date(last.date).getTime()) / 86400000);
        return { g, days };
      })
      .filter(x => x.days >= 45)
      .sort((a, b) => b.days - a.days)[0];
    if (neglected) {
      const name = neglected.g.displayName || `${neglected.g.make} ${neglected.g.model}`;
      rangeRecs.push({ label: `${name} hasn't been shot in ${neglected.days}d` });
    }
  }

  // 3. Recurring issue — same issue type 2+ times in last 60 days on same gun
  const sixtyDaysAgo = new Date(now); sixtyDaysAgo.setDate(now.getDate() - 60);
  const recentIssues = sessions.filter(s => new Date(s.date) >= sixtyDaysAgo && s.issues && s.issueTypes?.length);
  const issueCount: Record<string, Record<string, number>> = {};
  for (const s of recentIssues) {
    for (const t of (s.issueTypes || [])) {
      if (!issueCount[s.gunId]) issueCount[s.gunId] = {};
      issueCount[s.gunId][t] = (issueCount[s.gunId][t] || 0) + 1;
    }
  }
  for (const [gunId, counts] of Object.entries(issueCount)) {
    for (const [type, count] of Object.entries(counts)) {
      if (count >= 2) {
        const g = guns.find(x => x.id === gunId);
        if (g) {
          const name = g.displayName || `${g.make} ${g.model}`;
          rangeRecs.push({ label: `${type} logged ${count}× recently on ${name}` });
        }
      }
    }
  }

  const topRangeRecs = rangeRecs.slice(0, 2);

  function handleLogClean(gunId: string) {
    const today = new Date().toISOString().split('T')[0];
    const g = guns.find(x => x.id === gunId);
    updateGun(gunId, { lastCleanedDate: today, lastCleanedRoundCount: g?.roundCount || 0 });
    setGuns(getAllGuns());
  }

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
        <button
          onClick={onDevTools || onSettingsOpen}
          style={{
            width: '40px', height: '40px', flexShrink: 0,
            backgroundColor: theme.surface,
            border: `0.5px solid ${theme.border}`,
            borderRadius: '6px', color: theme.textMuted,
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
        </button>
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
            { val: sessions.reduce((s,x) => s + x.roundsExpended, 0).toLocaleString(), lbl: 'Rds Fired' },
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

                {/* Name + caliber — one line, ellipsis */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'monospace', fontSize: '13px', fontWeight: 700,
                    color: i === 0 ? theme.accent : theme.textPrimary,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {gun!.displayName || (gun!.make + ' ' + gun!.model)}
                  </div>
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
                      backgroundColor: theme.accent,
                      border: 'none',
                      borderRadius: '3px',
                      color: theme.bg,
                      fontFamily: 'monospace',
                      fontSize: '9px',
                      letterSpacing: '0.5px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      minHeight: '28px',
                    }}
                  >
                    + SESSION
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ARMORY STATUS ── */}
      <div style={{ ...card, marginBottom: '10px' }}>
        <div style={sectionLabel}>ARMORY STATUS</div>
        {topArmoryAlerts.length === 0 ? (
          <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted }}>All clear. Armory is in order.</div>
        ) : topArmoryAlerts.map((alert, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '7px 10px', marginBottom: i < topArmoryAlerts.length - 1 ? '6px' : 0,
            backgroundColor: theme.bg,
            borderLeft: `2px solid ${theme.accent}`,
            borderRadius: '0 4px 4px 0',
          }}>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textSecondary, flex: 1 }}>
              {alert.label}
            </div>
            {alert.action && alert.gunId && (
              <button
                onClick={() => handleLogClean(alert.gunId!)}
                style={{
                  marginLeft: '10px', padding: '4px 8px', flexShrink: 0,
                  backgroundColor: 'transparent', border: `0.5px solid ${theme.accent}`,
                  borderRadius: '3px', color: theme.accent,
                  fontFamily: 'monospace', fontSize: '8px', letterSpacing: '0.5px',
                  fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {alert.action}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* ── RANGE INSIGHTS ── */}
      <div style={{ ...card, marginBottom: '10px' }}>
        <div style={sectionLabel}>RANGE INSIGHTS</div>
        {topRangeRecs.length === 0 ? (
          <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted }}>
            {sessions.length < 6 ? 'Log more sessions to see patterns.' : 'Looking good — no issues detected.'}
          </div>
        ) : topRangeRecs.map((rec, i) => (
          <div key={i} style={{
            padding: '7px 10px', marginBottom: i < topRangeRecs.length - 1 ? '6px' : 0,
            backgroundColor: theme.bg,
            borderLeft: `2px solid ${theme.green}`,
            borderRadius: '0 4px 4px 0',
            fontFamily: 'monospace', fontSize: '11px',
            color: theme.textSecondary,
          }}>
            {rec.label}
          </div>
        ))}
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
          {devTapCount > 0 ? (devTapCount + '/7') : 'LINDCOTT ARMORY v1.0'}
        </span>
      </div>

    </div>
  );
}
