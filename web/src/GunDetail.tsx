import React, { useState, useEffect } from 'react';
import { theme } from './theme';
import type { Gun, Session, GunAccessories, TargetAnalysisRecord } from './types';
import { getSessionsForGun, getAllAmmo, updateGun, getAnalysesForGun } from './storage';
import { SessionLoggingModal } from './SessionLoggingModal';
import { GunSilhouetteImage } from './SimpleSilhouettes';
import { typeAccent } from './GunVault';
import { getGunBlurb } from './gunDescriptions';
import { callGunPrecisionCoach } from './claudeApi';

interface GunDetailProps {
  gun: Gun;
  onBack: () => void;
  onGunUpdated: () => void;
  onLogSession?: (gun: Gun) => void;
  onViewSessions?: (gunId: string) => void;
}

type DetailTab = 'overview' | 'sessions' | 'maintenance' | 'ammo' | 'timeline';
type Period = 'week' | 'month' | 'year';

const PURPOSE_LABELS = ['Plinking', 'Self Defense', 'EDC', 'Hunting', 'Competition', 'Home Defense', 'Duty', 'Collector'] as const;

function sdOf(vals: number[]): number {
  if (vals.length < 2) return 0;
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  return Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / (vals.length - 1));
}

export function GunDetail({ gun: initialGun, onBack, onGunUpdated, onLogSession, onViewSessions }: GunDetailProps) {
  const [gun, setGun]                 = useState(initialGun);
  const [sessions, setSessions]       = useState<Session[]>([]);
  const [tab, setTab]                 = useState<DetailTab>('overview');
  const [period, setPeriod]           = useState<Period>('month');
  const [showLogSession, setShowLogSession] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  // Editable fields
  const [editNotes, setEditNotes]     = useState(gun.notes || '');
  const [editAccessories, setEditAccessories] = useState<GunAccessories>(gun.accessories || {});
  const [editOpenIssues, setEditOpenIssues] = useState(gun.openIssues || '');
  const [showZeroForm, setShowZeroForm]     = useState(false);
  const [showMarkSold, setShowMarkSold]     = useState(false);
  const [soldDateInput, setSoldDateInput]   = useState('');
  const [soldPriceInput, setSoldPriceInput] = useState('');
  const [zeroDistInput, setZeroDistInput]   = useState('');
  const [editingIssues, setEditingIssues]   = useState(false);
  const [issuesDraft, setIssuesDraft]       = useState(gun.openIssues || '');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [aiPrecisionResult, setAiPrecisionResult] = useState<string | null>(null);
  const [aiPrecisionLoading, setAiPrecisionLoading] = useState(false);

  // ── Precision metrics (computed from target analyses) ─────────────────────
  const [analyses, setAnalyses] = useState<TargetAnalysisRecord[]>([]);
  useEffect(() => {
    setAnalyses(getAnalysesForGun(gun.id).sort((a, b) => a.date.localeCompare(b.date)));
  }, [gun.id]);

  const precisionMetrics = (() => {
    if (analyses.length === 0) return null;
    const moas = analyses.map(a => a.stats.extremeSpreadMoa);
    const last3 = moas.slice(-3);
    const ninetyDaysAgo = new Date(); ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const oldMoas = analyses.filter(a => new Date(a.date + 'T12:00:00') < ninetyDaysAgo).map(a => a.stats.extremeSpreadMoa);
    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
    const last3Avg = avg(last3);
    const oldAvg = avg(oldMoas);
    const bestIn = Math.min(...analyses.map(a => a.stats.extremeSpreadIn));
    const bestMoa = Math.min(...moas);
    const consistency = sdOf(moas);
    let trend: 'improving' | 'degrading' | 'stable' | null = null;
    if (last3Avg !== null && oldAvg !== null) {
      const delta = last3Avg - oldAvg;
      trend = delta < -0.15 ? 'improving' : delta > 0.15 ? 'degrading' : 'stable';
    }
    return { count: analyses.length, last3Avg, oldAvg, bestIn, bestMoa, consistency, trend };
  })();

  async function runAiPrecisionAnalysis() {
    if (!precisionMetrics) return;
    setAiPrecisionLoading(true);
    setAiPrecisionResult(null);
    const lines = [
      `Total analyses: ${precisionMetrics.count}`,
      `All-time best group: ${precisionMetrics.bestIn.toFixed(3)}" (${precisionMetrics.bestMoa.toFixed(2)} MOA)`,
      precisionMetrics.last3Avg !== null ? `Last 3 sessions avg ES: ${precisionMetrics.last3Avg.toFixed(2)} MOA` : '',
      precisionMetrics.oldAvg !== null ? `90+ days ago avg ES: ${precisionMetrics.oldAvg.toFixed(2)} MOA` : '',
      `Group size consistency (SD): ${precisionMetrics.consistency.toFixed(2)} MOA`,
      '',
      'Individual analyses (oldest → newest):',
      ...analyses.map(a => `  ${a.date} · ${a.distanceYds}yd · ${a.stats.shotCount} shots · ES ${a.stats.extremeSpreadMoa.toFixed(2)} MOA`),
    ].filter(Boolean);
    try {
      const result = await callGunPrecisionCoach(`${gun.make} ${gun.model} (${gun.caliber})`, lines.join('\n'));
      setAiPrecisionResult(result);
    } catch {
      setAiPrecisionResult('Analysis unavailable. Check your API key in Settings.');
    }
    setAiPrecisionLoading(false);
  }

  const blurb   = getGunBlurb(gun);
  const accent  = typeAccent[gun.type] || theme.textMuted;
  const now     = new Date();

  useEffect(() => {
    setSessions(getSessionsForGun(gun.id).sort((a, b) => b.date.localeCompare(a.date)));
  }, [gun.id]);

  // ── Period filter ──────────────────────────────────────────────────────────
  function inPeriod(dateStr: string): boolean {
    const d = new Date(dateStr + 'T12:00:00');
    if (period === 'week')  { const c = new Date(now); c.setDate(now.getDate() - 7); return d >= c; }
    if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    return d.getFullYear() === now.getFullYear();
  }
  const periodSessions   = sessions.filter(s => inPeriod(s.date));
  const periodRounds     = periodSessions.reduce((s, x) => s + x.roundsExpended, 0);
  const avgRounds        = periodSessions.length > 0 ? Math.round(periodRounds / periodSessions.length) : 0;

  // ── Lifetime stats ─────────────────────────────────────────────────────────
  const lastSession    = sessions[0];
  const daysSinceLast  = lastSession
    ? Math.floor((now.getTime() - new Date(lastSession.date + 'T12:00:00').getTime()) / 86400000)
    : null;
  const hasRecentIssues = sessions.slice(0, 5).some(s => s.issues);

  // ── Maintenance ────────────────────────────────────────────────────────────
  const shotsSinceClean = gun.lastCleanedRoundCount != null
    ? (gun.roundCount || 0) - gun.lastCleanedRoundCount
    : null;

  // ── Ammo performance ──────────────────────────────────────────────────────
  const ammoLots       = getAllAmmo().filter(l => l.caliber === gun.caliber);
  // Sessions that had no issues and reference an ammo lot
  const cleanSessions  = sessions.filter(s => !s.issues && s.ammoLotId);
  const ammoScores: Record<string, { name: string; sessions: number; rounds: number; issues: number }> = {};
  for (const s of sessions) {
    if (!s.ammoLotId) continue;
    const lot = ammoLots.find(l => l.id === s.ammoLotId);
    if (!lot) continue;
    const key = s.ammoLotId;
    if (!ammoScores[key]) ammoScores[key] = { name: `${lot.brand} ${lot.productLine} ${lot.grainWeight}gr`, sessions: 0, rounds: 0, issues: 0 };
    ammoScores[key].sessions++;
    ammoScores[key].rounds += s.roundsExpended;
    if (s.issues) ammoScores[key].issues++;
  }
  const topAmmo = Object.values(ammoScores)
    .sort((a, b) => (a.issues / (a.sessions || 1)) - (b.issues / (b.sessions || 1)) || b.rounds - a.rounds)
    .slice(0, 3);

  // ── Save helpers ───────────────────────────────────────────────────────────
  function saveField(updates: Partial<Gun>) {
    const updated = { ...gun, ...updates };
    updateGun(gun.id, updated);
    setGun(updated);
    setEditingField(null);
    onGunUpdated();
  }

  function persist(updates: Partial<Gun>) {
    const updated = { ...gun, ...updates };
    updateGun(gun.id, updated);
    setGun(updated);
    onGunUpdated();
  }

  function logClean() {
    const today = new Date().toISOString().split('T')[0];
    persist({ lastCleanedDate: today, lastCleanedRoundCount: gun.roundCount || 0 });
  }

  function logZero() {
    const dist = parseInt(zeroDistInput, 10);
    if (!dist || dist <= 0) return;
    const today = new Date().toISOString().split('T')[0];
    persist({ lastZeroDate: today, lastZeroDistance: dist });
    setShowZeroForm(false);
    setZeroDistInput('');
  }

  function saveIssues() {
    persist({ openIssues: issuesDraft });
    setEditingIssues(false);
  }

  function handleSessionLogged() {
    setSessions(getSessionsForGun(gun.id).sort((a, b) => b.date.localeCompare(a.date)));
    onGunUpdated();
  }

  function formatDate(d: string) {
    return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // ── Shared styles ──────────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    backgroundColor: theme.surface,
    border: `0.5px solid ${theme.border}`,
    borderRadius: '8px',
    padding: '14px 16px',
    marginBottom: '10px',
  };
  const sectionLabel: React.CSSProperties = {
    fontFamily: 'monospace', fontSize: '9px',
    letterSpacing: '1.2px', color: theme.textMuted,
    textTransform: 'uppercase', marginBottom: '10px',
  };
  const labelStyle: React.CSSProperties = {
    fontFamily: 'monospace', fontSize: '9px',
    letterSpacing: '0.8px', color: theme.textMuted,
    textTransform: 'uppercase', marginBottom: '3px',
  };
  const valStyle: React.CSSProperties = {
    fontFamily: 'monospace', fontSize: '12px',
    color: theme.textPrimary, fontWeight: 600,
  };
  const periodBtn = (active: boolean): React.CSSProperties => ({
    padding: '4px 10px',
    backgroundColor: active ? theme.textPrimary : 'transparent',
    border: `0.5px solid ${active ? theme.textPrimary : theme.border}`,
    borderRadius: '3px',
    color: active ? theme.bg : theme.textMuted,
    fontFamily: 'monospace', fontSize: '9px',
    letterSpacing: '0.8px', fontWeight: active ? 700 : 400,
    cursor: 'pointer',
  });
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    backgroundColor: theme.bg,
    border: `0.5px solid ${theme.border}`,
    borderRadius: '4px',
    color: theme.textPrimary,
    fontFamily: 'monospace',
    fontSize: '12px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.bg,
      maxWidth: '480px',
      margin: '0 auto',
      boxSizing: 'border-box',
      paddingBottom: '100px',
    }}>

      {/* ── TOP BAR ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 12px' }}>
        <button onClick={onBack} style={{
          padding: '8px 14px', backgroundColor: 'transparent',
          border: `0.5px solid ${theme.border}`, borderRadius: '6px',
          color: theme.textSecondary, fontFamily: 'monospace',
          fontSize: '11px', cursor: 'pointer', letterSpacing: '0.5px',
        }}>
          ← VAULT
        </button>
        <button onClick={() => setShowLogSession(true)} style={{
          padding: '8px 16px', backgroundColor: theme.accent,
          border: 'none', borderRadius: '6px', color: theme.bg,
          fontFamily: 'monospace', fontSize: '11px',
          letterSpacing: '0.8px', fontWeight: 700, cursor: 'pointer',
        }}>
          + LOG SESSION
        </button>
      </div>

      {/* ── TABS (at very top) ── */}
      <div style={{ display: 'flex', margin: '0 16px 12px', border: `0.5px solid ${theme.border}`, borderRadius: '6px', overflow: 'hidden' }}>
        {([
          ['overview', 'OVERVIEW'],
          ['sessions', sessions.length > 0 ? 'SESSIONS (' + sessions.length + ')' : 'SESSIONS'],
          ['maintenance', 'MAINT'],
          ['ammo', 'AMMO'],
          ['timeline', 'TIMELINE'],
        ] as [DetailTab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '10px 2px',
            backgroundColor: tab === t ? theme.textPrimary : 'transparent',
            border: 'none', color: tab === t ? theme.bg : theme.textMuted,
            fontFamily: 'monospace', fontSize: '9px',
            letterSpacing: '0.5px', fontWeight: tab === t ? 700 : 400,
            cursor: 'pointer', textTransform: 'uppercase',
          }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 16px' }}>

        {/* ══ OVERVIEW TAB ══ */}
        {tab === 'overview' && (
          <>

            {/* ── GUN BANNER ── */}
            <div style={{
              ...card,
              padding: '12px 14px',
              borderLeft: `4px solid ${accent}`,
            }}>
              {/* Top row: icon + name + badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{
                  width: '56px', height: '38px', flexShrink: 0,
                  backgroundColor: theme.bg, borderRadius: '5px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <GunSilhouetteImage gun={gun} color={accent} size={52} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '15px', fontWeight: 700, color: theme.textPrimary, lineHeight: 1.2 }}>
                      {gun.make} {gun.model}
                    </span>
                    <span style={{
                      padding: '1px 6px', backgroundColor: theme.bg,
                      border: `0.5px solid ${gun.status === 'Active' ? theme.green : theme.border}`,
                      borderRadius: '3px', fontFamily: 'monospace', fontSize: '9px',
                      color: gun.status === 'Active' ? theme.green : theme.textMuted,
                      letterSpacing: '0.5px', flexShrink: 0,
                    }}>
                      {gun.status?.toUpperCase()}
                    </span>
                    {gun.crFlag && (
                      <span style={{ padding: '1px 5px', backgroundColor: theme.bg, border: `0.5px solid ${theme.accent}`, borderRadius: '3px', fontFamily: 'monospace', fontSize: '8px', color: theme.accent, letterSpacing: '0.5px', flexShrink: 0 }}>C&R</span>
                    )}
                    {(gun.nfaItem || gun.suppressorHost) && (
                      <span style={{ padding: '1px 5px', border: `0.5px solid ${theme.red}`, borderRadius: '3px', fontFamily: 'monospace', fontSize: '9px', color: theme.red, flexShrink: 0 }}>NFA</span>
                    )}
                  </div>
                </div>
              </div>
              {/* Bottom row: all metadata on one line */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.caliberRed, fontWeight: 600 }}>{gun.caliber}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>·</span>
                <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>{gun.type}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>·</span>
                <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>{gun.action}</span>
                {gun.capacity && <>
                  <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>·</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>{gun.capacity}+1 cap</span>
                </>}
                {gun.serialNumber && <>
                  <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>·</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>SN {gun.serialNumber}</span>
                </>}
              </div>
              {/* Mark as sold / sold info */}
              {gun.status !== 'Sold' && gun.status !== 'Transferred' && (
                <div style={{ marginTop: '10px' }}>
                  {!showMarkSold ? (
                    <button onClick={() => { setSoldDateInput(new Date().toISOString().split('T')[0]); setShowMarkSold(true); }} style={{
                      padding: '4px 10px', backgroundColor: 'transparent',
                      border: `0.5px solid ${theme.border}`, borderRadius: '4px',
                      color: theme.textMuted, fontFamily: 'monospace', fontSize: '9px',
                      cursor: 'pointer', letterSpacing: '0.5px',
                    }}>MARK AS SOLD</button>
                  ) : (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input type="date" value={soldDateInput} onChange={e => setSoldDateInput(e.target.value)}
                        style={{ padding: '5px 8px', backgroundColor: theme.bg, border: `0.5px solid ${theme.border}`, borderRadius: '4px', color: theme.textPrimary, fontFamily: 'monospace', fontSize: '10px', outline: 'none' }} />
                      <input type="number" value={soldPriceInput} onChange={e => setSoldPriceInput(e.target.value)}
                        placeholder="Sale price ($)" min={0}
                        style={{ width: '120px', padding: '5px 8px', backgroundColor: theme.bg, border: `0.5px solid ${theme.border}`, borderRadius: '4px', color: theme.textPrimary, fontFamily: 'monospace', fontSize: '10px', outline: 'none' }} />
                      <button onClick={() => {
                        persist({ status: 'Sold', soldDate: soldDateInput || undefined, soldPrice: soldPriceInput ? parseFloat(soldPriceInput) : undefined });
                        setShowMarkSold(false);
                      }} style={{ padding: '5px 12px', backgroundColor: theme.red, border: 'none', borderRadius: '4px', color: '#fff', fontFamily: 'monospace', fontSize: '9px', fontWeight: 700, cursor: 'pointer' }}>CONFIRM SOLD</button>
                      <button onClick={() => setShowMarkSold(false)} style={{ padding: '5px 8px', backgroundColor: 'transparent', border: `0.5px solid ${theme.border}`, borderRadius: '4px', color: theme.textMuted, fontFamily: 'monospace', fontSize: '9px', cursor: 'pointer' }}>×</button>
                    </div>
                  )}
                </div>
              )}
              {gun.status === 'Sold' && (gun.soldDate || gun.soldPrice) && (
                <div style={{ marginTop: '8px', fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>
                  Sold{gun.soldDate ? ` ${formatDate(gun.soldDate)}` : ''}{gun.soldPrice ? ` · $${gun.soldPrice.toLocaleString()}` : ''}
                </div>
              )}
            </div>

            {/* ── OPEN ISSUES ALERT ── */}
            {gun.openIssues && (
              <div style={{
                ...card,
                borderLeft: `3px solid ${theme.red}`,
                backgroundColor: 'rgba(255,107,107,0.07)',
                padding: '10px 14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', color: theme.red }}>⚠</span>
                  <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '1px', color: theme.red, textTransform: 'uppercase' }}>Open Issue</div>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textPrimary, lineHeight: '1.5' }}>
                  {gun.openIssues}
                </div>
              </div>
            )}

            {/* ── AI BLURB ── */}
            {blurb && (
              <div style={{
                ...card,
                borderLeft: `3px solid ${theme.accent}`,
                backgroundColor: theme.bg,
              }}>
                <div style={{ ...sectionLabel, color: theme.accent }}>GUN HISTORY</div>
                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textSecondary, lineHeight: '1.6' }}>
                  {blurb}
                </div>
              </div>
            )}

            {/* ── LIFETIME STATS ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '10px' }}>
              {[
                { val: (gun.roundCount || 0).toLocaleString(), lbl: 'Total Rounds', color: accent },
                { val: sessions.length.toString(), lbl: 'Sessions', color: theme.textPrimary },
                { val: daysSinceLast !== null ? `${daysSinceLast}d` : '—', lbl: 'Since Last', color: hasRecentIssues ? theme.red : theme.textPrimary },
              ].map(item => (
                <div key={item.lbl} style={{ ...card, marginBottom: 0, textAlign: 'center', padding: '12px 8px' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 700, color: item.color, lineHeight: 1 }}>{item.val}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginTop: '3px', letterSpacing: '0.5px' }}>{item.lbl.toUpperCase()}</div>
                </div>
              ))}
            </div>

            {/* ── PERIOD STATS ── */}
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={sectionLabel}>ACTIVITY</div>
                  {onViewSessions && sessions.length > 0 && (
                    <button onClick={() => onViewSessions(gun.id)} style={{ padding: '2px 8px', background: 'transparent', border: `0.5px solid ${theme.border}`, borderRadius: 3, fontFamily: 'monospace', fontSize: '8px', color: theme.textMuted, cursor: 'pointer', letterSpacing: '0.5px' }}>
                      ALL SESSIONS →
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {(['week', 'month', 'year'] as Period[]).map(p => (
                    <button key={p} style={periodBtn(period === p)} onClick={() => setPeriod(p)}>
                      {p === 'week' ? 'WK' : p === 'month' ? 'MO' : 'YR'}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {[
                  { val: periodRounds.toLocaleString(), lbl: 'Rounds' },
                  { val: periodSessions.length.toString(), lbl: 'Sessions' },
                  { val: avgRounds > 0 ? avgRounds.toString() : '—', lbl: 'Avg / Sess' },
                ].map(item => (
                  <div key={item.lbl}>
                    <div style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 700, color: theme.textPrimary, lineHeight: 1 }}>{item.val}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginTop: '3px' }}>{item.lbl}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── DETAILS ── */}
            {(gun.condition || gun.barrelLength || gun.acquiredDate || gun.acquiredPrice || gun.acquiredFrom || gun.purpose?.length || gun.estimatedFMV || gun.insuranceValue || gun.soldDate || gun.soldPrice) && (
              <div style={card}>
                <div style={sectionLabel}>DETAILS</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
                  {gun.condition && (
                    <div><div style={labelStyle}>Condition</div><div style={valStyle}>{gun.condition}</div></div>
                  )}
                  {gun.barrelLength && (
                    <div><div style={labelStyle}>Barrel</div><div style={valStyle}>{gun.barrelLength}"</div></div>
                  )}
                  {gun.acquiredDate && (
                    <div><div style={labelStyle}>Acquired</div><div style={valStyle}>{new Date(gun.acquiredDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div></div>
                  )}
                  {gun.acquiredPrice && (
                    <div><div style={labelStyle}>Paid</div><div style={valStyle}>${gun.acquiredPrice.toLocaleString()}</div></div>
                  )}
                  {gun.acquiredFrom && (
                    <div><div style={labelStyle}>From</div><div style={valStyle}>{gun.acquiredFrom}</div></div>
                  )}
                  {gun.estimatedFMV && (
                    <div><div style={labelStyle}>Est. Market Value</div><div style={{ ...valStyle, color: theme.green }}>${gun.estimatedFMV.toLocaleString()}</div></div>
                  )}
                  {gun.insuranceValue && (
                    <div><div style={labelStyle}>Insured Value</div><div style={{ ...valStyle, color: theme.blue }}>${gun.insuranceValue.toLocaleString()}</div></div>
                  )}
                  {gun.soldDate && (
                    <div><div style={labelStyle}>Date Sold</div><div style={{ ...valStyle, color: theme.textMuted }}>{formatDate(gun.soldDate)}</div></div>
                  )}
                  {gun.soldPrice && (
                    <div><div style={labelStyle}>Sold For</div><div style={{ ...valStyle, color: theme.textMuted }}>${gun.soldPrice.toLocaleString()}</div></div>
                  )}
                </div>
                {gun.purpose && gun.purpose.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={labelStyle}>Purpose</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                      {gun.purpose.map(p => (
                        <span key={p} style={{
                          padding: '3px 8px', backgroundColor: theme.bg,
                          border: `0.5px solid ${accent}`,
                          borderRadius: '3px', fontFamily: 'monospace',
                          fontSize: '9px', color: accent, letterSpacing: '0.5px',
                        }}>{p}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── MAINTENANCE LOG ── */}
            <div style={card}>
              <div style={{ ...sectionLabel, marginBottom: '14px' }}>MAINTENANCE</div>

              {/* 2×2 stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', marginBottom: '14px' }}>
                <div>
                  <div style={labelStyle}>Last Cleaned</div>
                  <div style={{ ...valStyle, color: gun.lastCleanedDate ? theme.textPrimary : theme.textMuted }}>
                    {gun.lastCleanedDate ? formatDate(gun.lastCleanedDate) : 'Not logged'}
                  </div>
                </div>
                <div>
                  <div style={labelStyle}>Shots Since Clean</div>
                  {shotsSinceClean != null ? (
                    <>
                      <div style={{ ...valStyle, color: shotsSinceClean >= 500 ? theme.orange : theme.green }}>
                        {shotsSinceClean.toLocaleString()}
                        {shotsSinceClean >= 500 && (
                          <span style={{ fontSize: '8px', marginLeft: '5px', letterSpacing: '0.5px' }}>OVERDUE</span>
                        )}
                      </div>
                      {/* Progress bar */}
                      <div style={{ height: '3px', backgroundColor: theme.border, borderRadius: '2px', marginTop: '5px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min(100, (shotsSinceClean / 500) * 100)}%`,
                          backgroundColor: shotsSinceClean >= 500 ? theme.orange : shotsSinceClean >= 300 ? theme.accent : theme.green,
                          borderRadius: '2px',
                        }} />
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: '8px', color: theme.textMuted, marginTop: '2px' }}>
                        {Math.min(shotsSinceClean, 500)}/500
                      </div>
                    </>
                  ) : (
                    <div style={{ ...valStyle, color: theme.textMuted }}>—</div>
                  )}
                </div>
                <div>
                  <div style={labelStyle}>Last Zeroed</div>
                  <div style={{ ...valStyle, color: gun.lastZeroDate ? theme.textPrimary : theme.textMuted }}>
                    {gun.lastZeroDate ? formatDate(gun.lastZeroDate) : 'Not logged'}
                  </div>
                </div>
                <div>
                  <div style={labelStyle}>Zero Distance</div>
                  <div style={{ ...valStyle, color: gun.lastZeroDistance ? theme.textPrimary : theme.textMuted }}>
                    {gun.lastZeroDistance ? `${gun.lastZeroDistance} yds` : '—'}
                  </div>
                </div>
              </div>

              {/* Open issues — inline pencil edit */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <div style={labelStyle}>Open Issues</div>
                  {!editingIssues && (
                    <button
                      onClick={() => { setIssuesDraft(gun.openIssues || ''); setEditingIssues(true); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, fontSize: '13px', padding: '0', lineHeight: 1 }}
                    >✎</button>
                  )}
                </div>
                {editingIssues ? (
                  <>
                    <textarea
                      value={issuesDraft}
                      onChange={e => setIssuesDraft(e.target.value)}
                      rows={3}
                      autoFocus
                      placeholder="Describe any current known issues..."
                      style={{ ...inputStyle, resize: 'vertical', marginBottom: '6px' }}
                    />
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => setEditingIssues(false)} style={{
                        flex: 1, padding: '7px', backgroundColor: 'transparent',
                        border: `0.5px solid ${theme.border}`, borderRadius: '4px',
                        color: theme.textMuted, fontFamily: 'monospace', fontSize: '9px', cursor: 'pointer',
                      }}>CANCEL</button>
                      <button onClick={saveIssues} style={{
                        flex: 2, padding: '7px', backgroundColor: theme.accent,
                        border: 'none', borderRadius: '4px', color: theme.bg,
                        fontFamily: 'monospace', fontSize: '9px', fontWeight: 700, cursor: 'pointer',
                      }}>SAVE</button>
                    </div>
                  </>
                ) : (
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', lineHeight: '1.5', color: gun.openIssues ? theme.red : theme.green }}>
                    {gun.openIssues || 'None'}
                  </div>
                )}
              </div>

              {/* Log Zero inline form */}
              {showZeroForm && (
                <div style={{
                  backgroundColor: theme.bg, borderRadius: '6px', padding: '10px 12px',
                  border: `0.5px solid ${theme.border}`, marginBottom: '10px',
                }}>
                  <div style={labelStyle}>Zero Distance (yards)</div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    <input
                      type="number"
                      value={zeroDistInput}
                      onChange={e => setZeroDistInput(e.target.value)}
                      placeholder="e.g. 100"
                      autoFocus
                      min={1}
                      style={{ ...inputStyle, flex: 1 }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') logZero();
                        if (e.key === 'Escape') { setShowZeroForm(false); setZeroDistInput(''); }
                      }}
                    />
                    <button onClick={logZero} style={{
                      padding: '8px 14px', backgroundColor: theme.accent,
                      border: 'none', borderRadius: '4px', color: theme.bg,
                      fontFamily: 'monospace', fontSize: '9px', fontWeight: 700, cursor: 'pointer', flexShrink: 0,
                    }}>SAVE</button>
                    <button onClick={() => { setShowZeroForm(false); setZeroDistInput(''); }} style={{
                      padding: '8px 10px', backgroundColor: 'transparent',
                      border: `0.5px solid ${theme.border}`, borderRadius: '4px',
                      color: theme.textMuted, fontFamily: 'monospace', fontSize: '13px', cursor: 'pointer', flexShrink: 0,
                    }}>×</button>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button onClick={logClean} style={{
                  padding: '11px', backgroundColor: theme.accent,
                  border: 'none', borderRadius: '6px', color: theme.bg,
                  fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.5px',
                  fontWeight: 700, cursor: 'pointer',
                }}>
                  LOG CLEAN
                </button>
                <button
                  onClick={() => { setShowZeroForm(z => !z); if (showZeroForm) setZeroDistInput(''); }}
                  style={{
                    padding: '11px', backgroundColor: 'transparent',
                    border: `0.5px solid ${showZeroForm ? theme.accent : theme.border}`,
                    borderRadius: '6px',
                    color: showZeroForm ? theme.accent : theme.textSecondary,
                    fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.5px',
                    fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  LOG ZERO
                </button>
              </div>
            </div>

            {/* ── ACCESSORIES ── */}
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={sectionLabel}>ACCESSORIES</div>
                {editingField !== 'accessories' ? (
                  <button onClick={() => setEditingField('accessories')} style={{
                    padding: '3px 8px', backgroundColor: 'transparent',
                    border: `0.5px solid ${theme.border}`, borderRadius: '4px',
                    color: theme.textMuted, fontFamily: 'monospace', fontSize: '9px', cursor: 'pointer',
                  }}>EDIT</button>
                ) : (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => setEditingField(null)} style={{
                      padding: '3px 8px', backgroundColor: 'transparent',
                      border: `0.5px solid ${theme.border}`, borderRadius: '4px',
                      color: theme.textMuted, fontFamily: 'monospace', fontSize: '9px', cursor: 'pointer',
                    }}>CANCEL</button>
                    <button onClick={() => saveField({ accessories: editAccessories })} style={{
                      padding: '3px 8px', backgroundColor: theme.accent,
                      border: 'none', borderRadius: '4px', color: theme.bg,
                      fontFamily: 'monospace', fontSize: '9px', fontWeight: 700, cursor: 'pointer',
                    }}>SAVE</button>
                  </div>
                )}
              </div>

              {editingField === 'accessories' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {([
                    ['optic',             'Optic'],
                    ['opticMagnification','Magnification'],
                    ['muzzleDevice',      'Muzzle Device'],
                    ['suppressor',        'Suppressor'],
                    ['weaponLight',       'Weapon Light'],
                    ['laser',             'Laser / IR'],
                    ['sling',             'Sling'],
                    ['bipod',             'Bipod'],
                    ['foregrip',          'Foregrip'],
                    ['stockGrip',         'Stock / Grip'],
                    ['magazineUpgrade',   'Magazine'],
                    ['other',             'Other'],
                  ] as [keyof GunAccessories, string][]).map(([field, label]) => (
                    <div key={field}>
                      <div style={labelStyle}>{label}</div>
                      <input
                        type="text"
                        value={editAccessories[field] || ''}
                        onChange={e => setEditAccessories(prev => ({ ...prev, [field]: e.target.value }))}
                        placeholder={`e.g. ${getAccessoryPlaceholder(field)}`}
                        style={inputStyle}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  {(() => {
                    const acc = gun.accessories;
                    if (!acc || Object.values(acc).every(v => !v)) {
                      return <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted }}>No accessories logged. Tap Edit to add.</div>;
                    }
                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                        {([
                          ['optic',             'Optic'],
                          ['opticMagnification','Magnification'],
                          ['muzzleDevice',      'Muzzle Device'],
                          ['suppressor',        'Suppressor'],
                          ['weaponLight',       'Weapon Light'],
                          ['laser',             'Laser'],
                          ['sling',             'Sling'],
                          ['bipod',             'Bipod'],
                          ['foregrip',          'Foregrip'],
                          ['stockGrip',         'Stock / Grip'],
                          ['magazineUpgrade',   'Magazine'],
                          ['other',             'Other'],
                        ] as [keyof GunAccessories, string][])
                          .filter(([f]) => acc[f])
                          .map(([f, l]) => (
                            <div key={f}>
                              <div style={labelStyle}>{l}</div>
                              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textPrimary }}>{acc[f]}</div>
                            </div>
                          ))
                        }
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* ── AMMO PERFORMANCE ── */}
            {topAmmo.length > 0 && (
              <div style={card}>
                <div style={sectionLabel}>AMMO PERFORMANCE</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {topAmmo.map((a, i) => (
                    <div key={a.name} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '8px 10px', backgroundColor: theme.bg, borderRadius: '6px',
                      borderLeft: `3px solid ${i === 0 ? accent : theme.border}`,
                    }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '10px', color: i === 0 ? accent : theme.textMuted, fontWeight: 700, width: '16px', flexShrink: 0 }}>#{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginTop: '2px' }}>
                          {a.sessions} sessions · {a.rounds} rds
                          {a.issues > 0 && <span style={{ color: theme.red, marginLeft: '6px' }}>{a.issues} issue{a.issues > 1 ? 's' : ''}</span>}
                        </div>
                      </div>
                      {a.issues === 0 && (
                        <span style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.green, flexShrink: 0 }}>✓ CLEAN</span>
                      )}
                    </div>
                  ))}
                </div>
                {topAmmo.length === 0 && (
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted }}>
                    Log sessions with ammo lots to see performance data.
                  </div>
                )}
              </div>
            )}

            {/* ── PRECISION ── */}
            <div style={card}>
              <div style={sectionLabel}>PRECISION</div>
              {precisionMetrics === null ? (
                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted, lineHeight: 1.6 }}>
                  No target analyses linked to this gun yet.{'\n'}Select this gun in Target Analysis to start tracking precision over time.
                </div>
              ) : (
                <>
                  {/* Stat grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', marginBottom: 12 }}>
                    <div>
                      <div style={labelStyle}>Analyses</div>
                      <div style={valStyle}>{precisionMetrics.count}</div>
                    </div>
                    <div>
                      <div style={labelStyle}>Best Group</div>
                      <div style={{ ...valStyle, color: theme.accent }}>{precisionMetrics.bestIn.toFixed(3)}" · {precisionMetrics.bestMoa.toFixed(2)} MOA</div>
                    </div>
                    {precisionMetrics.last3Avg !== null && (
                      <div>
                        <div style={labelStyle}>Last 3 Avg ES</div>
                        <div style={valStyle}>{precisionMetrics.last3Avg.toFixed(2)} MOA</div>
                      </div>
                    )}
                    {precisionMetrics.oldAvg !== null && (
                      <div>
                        <div style={labelStyle}>90-Day Ago Avg</div>
                        <div style={valStyle}>{precisionMetrics.oldAvg.toFixed(2)} MOA</div>
                      </div>
                    )}
                    {precisionMetrics.count >= 3 && (
                      <div>
                        <div style={labelStyle}>Consistency (SD)</div>
                        <div style={valStyle}>{precisionMetrics.consistency.toFixed(2)} MOA</div>
                      </div>
                    )}
                    {precisionMetrics.trend && (
                      <div>
                        <div style={labelStyle}>Trend</div>
                        <div style={{ ...valStyle, color: precisionMetrics.trend === 'improving' ? theme.green : precisionMetrics.trend === 'degrading' ? theme.red : theme.textMuted }}>
                          {precisionMetrics.trend === 'improving' ? '↓ Improving' : precisionMetrics.trend === 'degrading' ? '↑ Degrading' : '→ Stable'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AI analysis */}
                  {aiPrecisionResult ? (
                    <div style={{ padding: '10px 12px', borderRadius: 6, background: theme.bg, border: `0.5px solid ${theme.accent}`, marginBottom: 8 }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.accent, letterSpacing: '1px', marginBottom: 6 }}>AI ANALYSIS</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textSecondary, lineHeight: 1.6 }}>{aiPrecisionResult}</div>
                    </div>
                  ) : (
                    <button
                      onClick={runAiPrecisionAnalysis}
                      disabled={aiPrecisionLoading}
                      style={{ width: '100%', padding: '9px', backgroundColor: 'transparent', border: `0.5px solid ${theme.accent}`, borderRadius: 6, color: theme.accent, fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.5px', fontWeight: 600, cursor: aiPrecisionLoading ? 'default' : 'pointer', opacity: aiPrecisionLoading ? 0.6 : 1 }}
                    >
                      {aiPrecisionLoading ? 'ANALYZING...' : 'GET AI ANALYSIS'}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* ── NOTES ── */}
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={sectionLabel}>NOTES</div>
                {editingField !== 'notes' ? (
                  <button onClick={() => setEditingField('notes')} style={{
                    padding: '3px 8px', backgroundColor: 'transparent',
                    border: `0.5px solid ${theme.border}`, borderRadius: '4px',
                    color: theme.textMuted, fontFamily: 'monospace', fontSize: '9px', cursor: 'pointer',
                  }}>EDIT</button>
                ) : (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => { setEditingField(null); setEditNotes(gun.notes || ''); }} style={{
                      padding: '3px 8px', backgroundColor: 'transparent',
                      border: `0.5px solid ${theme.border}`, borderRadius: '4px',
                      color: theme.textMuted, fontFamily: 'monospace', fontSize: '9px', cursor: 'pointer',
                    }}>CANCEL</button>
                    <button onClick={() => saveField({ notes: editNotes })} style={{
                      padding: '3px 8px', backgroundColor: theme.accent,
                      border: 'none', borderRadius: '4px', color: theme.bg,
                      fontFamily: 'monospace', fontSize: '9px', fontWeight: 700, cursor: 'pointer',
                    }}>SAVE</button>
                  </div>
                )}
              </div>
              {editingField === 'notes' ? (
                <textarea
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  rows={4}
                  placeholder="Add notes about this firearm..."
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              ) : gun.notes ? (
                <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textSecondary, lineHeight: '1.6' }}>
                  {gun.notes}
                </div>
              ) : (
                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted }}>No notes. Tap Edit to add.</div>
              )}
            </div>

          </>
        )}

        {/* ══ SESSIONS TAB ══ */}
        {tab === 'sessions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sessions.length === 0 ? (
              <div style={{
                padding: '48px 24px', textAlign: 'center',
                backgroundColor: theme.surface, borderRadius: '8px',
                border: `0.5px solid ${theme.border}`,
              }}>
                <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textMuted, marginBottom: '12px' }}>NO SESSIONS LOGGED</div>
                <button onClick={() => setShowLogSession(true)} style={{
                  padding: '10px 20px', backgroundColor: theme.accent,
                  border: 'none', borderRadius: '6px', color: theme.bg,
                  fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                }}>LOG FIRST SESSION</button>
              </div>
            ) : (
              sessions.map(session => (
                <div key={session.id}
                  onClick={() => setSelectedSession(session)}
                  style={{
                    backgroundColor: theme.surface,
                    border: `0.5px solid ${session.issues ? theme.red : theme.border}`,
                    borderRadius: '8px', padding: '12px 14px',
                    cursor: 'pointer',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: theme.textPrimary }}>{formatDate(session.date)}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: accent }}>{session.roundsExpended} rds</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {session.location && <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>{session.location}</span>}
                    {session.indoorOutdoor && (
                      <span style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, padding: '1px 5px', border: `0.5px solid ${theme.border}`, borderRadius: '3px' }}>
                        {session.indoorOutdoor.toUpperCase()}
                      </span>
                    )}
                    {session.issues && (
                      <span style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.red, padding: '1px 5px', border: `0.5px solid ${theme.red}`, borderRadius: '3px' }}>ISSUE</span>
                    )}
                  </div>
                  {session.notes && <div style={{ marginTop: '6px', fontFamily: 'monospace', fontSize: '11px', color: theme.textSecondary, fontStyle: 'italic' }}>{session.notes}</div>}
                  {session.issues && session.issueDescription && <div style={{ marginTop: '4px', fontFamily: 'monospace', fontSize: '11px', color: theme.red }}>{session.issueDescription}</div>}
                </div>
              ))
            )}
          </div>
        )}

        {/* ══ MAINTENANCE TAB ══ */}
        {tab === 'maintenance' && (
          <>

            {/* ── CLEANING STATUS ── */}
            <div style={card}>
              <div style={sectionLabel}>CLEANING STATUS</div>
              <div style={{ marginBottom: '12px' }}>
                <div style={labelStyle}>Shots Since Last Clean</div>
                <div style={{
                  fontFamily: 'monospace', fontSize: '24px', fontWeight: 700,
                  color: shotsSinceClean == null ? theme.textMuted
                    : shotsSinceClean < 300 ? theme.green
                    : shotsSinceClean <= 500 ? theme.orange
                    : theme.red,
                }}>
                  {shotsSinceClean == null ? 'Never recorded' : shotsSinceClean.toLocaleString()}
                </div>
              </div>
              {gun.lastCleanedDate && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={labelStyle}>Last Cleaned</div>
                  <div style={valStyle}>{formatDate(gun.lastCleanedDate)}</div>
                </div>
              )}
              {gun.lastCleanedRoundCount != null && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={labelStyle}>Last Cleaned At</div>
                  <div style={valStyle}>{gun.lastCleanedRoundCount.toLocaleString() + ' rounds'}</div>
                </div>
              )}
              <button onClick={logClean} style={{
                width: '100%', padding: '13px', backgroundColor: accent,
                border: 'none', borderRadius: '6px', color: theme.bg,
                fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.8px',
                fontWeight: 700, cursor: 'pointer', minHeight: '44px',
              }}>
                MARK CLEANED
              </button>
            </div>

            {/* ── ZERO DATA ── */}
            <div style={card}>
              <div style={sectionLabel}>ZERO DATA</div>
              <div style={{ marginBottom: '10px' }}>
                <div style={labelStyle}>Last Zero Date</div>
                <div style={{ ...valStyle, color: gun.lastZeroDate ? theme.textPrimary : theme.textMuted }}>
                  {gun.lastZeroDate ? formatDate(gun.lastZeroDate) : 'Never zeroed'}
                </div>
              </div>
              {gun.lastZeroDistance && (
                <div style={{ marginBottom: '10px' }}>
                  <div style={labelStyle}>Zero Distance</div>
                  <div style={valStyle}>{gun.lastZeroDistance + ' yds'}</div>
                </div>
              )}
              {showZeroForm ? (
                <div style={{ marginTop: '8px' }}>
                  <div style={labelStyle}>Zero Distance (yards)</div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    <input
                      type="number"
                      value={zeroDistInput}
                      onChange={e => setZeroDistInput(e.target.value)}
                      placeholder="e.g. 100"
                      autoFocus
                      min={1}
                      style={{ ...inputStyle, flex: 1 }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') logZero();
                        if (e.key === 'Escape') { setShowZeroForm(false); setZeroDistInput(''); }
                      }}
                    />
                    <button onClick={logZero} style={{
                      padding: '8px 14px', backgroundColor: accent,
                      border: 'none', borderRadius: '4px', color: theme.bg,
                      fontFamily: 'monospace', fontSize: '9px', fontWeight: 700, cursor: 'pointer', flexShrink: 0, minHeight: '44px',
                    }}>SAVE</button>
                    <button onClick={() => { setShowZeroForm(false); setZeroDistInput(''); }} style={{
                      padding: '8px 10px', backgroundColor: 'transparent',
                      border: `0.5px solid ${theme.border}`, borderRadius: '4px',
                      color: theme.textMuted, fontFamily: 'monospace', fontSize: '13px', cursor: 'pointer', flexShrink: 0, minHeight: '44px',
                    }}>×</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowZeroForm(true)} style={{
                  width: '100%', padding: '11px', backgroundColor: 'transparent',
                  border: `0.5px solid ${theme.border}`, borderRadius: '6px',
                  color: theme.textSecondary, fontFamily: 'monospace', fontSize: '10px',
                  letterSpacing: '0.5px', fontWeight: 600, cursor: 'pointer', minHeight: '44px',
                }}>
                  LOG ZERO
                </button>
              )}
            </div>

            {/* ── OPEN ISSUES ── */}
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={sectionLabel}>OPEN ISSUES</div>
                {!editingIssues && (
                  <button onClick={() => { setIssuesDraft(gun.openIssues || ''); setEditingIssues(true); }} style={{
                    padding: '3px 8px', backgroundColor: 'transparent',
                    border: `0.5px solid ${theme.border}`, borderRadius: '4px',
                    color: theme.textMuted, fontFamily: 'monospace', fontSize: '9px', cursor: 'pointer',
                  }}>EDIT</button>
                )}
              </div>
              {editingIssues ? (
                <>
                  <textarea
                    value={issuesDraft}
                    onChange={e => setIssuesDraft(e.target.value)}
                    rows={4}
                    autoFocus
                    placeholder="Describe any current known issues..."
                    style={{ ...inputStyle, resize: 'vertical', marginBottom: '8px' }}
                  />
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => setEditingIssues(false)} style={{
                      flex: 1, padding: '10px', backgroundColor: 'transparent',
                      border: `0.5px solid ${theme.border}`, borderRadius: '4px',
                      color: theme.textMuted, fontFamily: 'monospace', fontSize: '9px', cursor: 'pointer', minHeight: '44px',
                    }}>CANCEL</button>
                    <button onClick={saveIssues} style={{
                      flex: 2, padding: '10px', backgroundColor: accent,
                      border: 'none', borderRadius: '4px', color: theme.bg,
                      fontFamily: 'monospace', fontSize: '9px', fontWeight: 700, cursor: 'pointer', minHeight: '44px',
                    }}>SAVE</button>
                  </div>
                </>
              ) : (
                <div style={{ fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.6', color: gun.openIssues ? theme.red : theme.textMuted }}>
                  {gun.openIssues || 'None'}
                </div>
              )}
            </div>

            {/* ── ACCESSORIES ── */}
            <div style={card}>
              <div style={sectionLabel}>ACCESSORIES</div>
              {(() => {
                const acc = gun.accessories;
                if (!acc || Object.values(acc).every(v => !v)) {
                  return <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted }}>No accessories recorded.</div>;
                }
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {([
                      ['optic',             'Optic'],
                      ['opticMagnification','Magnification'],
                      ['muzzleDevice',      'Muzzle Device'],
                      ['suppressor',        'Suppressor'],
                      ['weaponLight',       'Weapon Light'],
                      ['laser',             'Laser / IR'],
                      ['sling',             'Sling'],
                      ['bipod',             'Bipod'],
                      ['foregrip',          'Foregrip'],
                      ['stockGrip',         'Stock / Grip'],
                      ['magazineUpgrade',   'Magazine'],
                      ['other',             'Other'],
                    ] as [keyof GunAccessories, string][])
                      .filter(([f]) => acc[f])
                      .map(([f, l]) => (
                        <div key={f} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={labelStyle}>{l}</div>
                          <div style={{ ...valStyle, textAlign: 'right', maxWidth: '60%' }}>{acc[f]}</div>
                        </div>
                      ))
                    }
                  </div>
                );
              })()}
            </div>

          </>
        )}

        {/* ══ AMMO TAB ══ */}
        {tab === 'ammo' && (
          <>

            <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '1.2px', color: accent, marginBottom: '12px' }}>
              {'CALIBER: ' + gun.caliber}
            </div>

            {ammoLots.length === 0 ? (
              <div style={{
                ...card, textAlign: 'center', padding: '40px 20px',
              }}>
                <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textMuted }}>
                  {'No ' + gun.caliber + ' ammo in inventory'}
                </div>
              </div>
            ) : (
              <>
                {ammoLots.map(lot => {
                  const qtyColor = (lot.quantity || 0) < 50 ? theme.red
                    : (lot.quantity || 0) < 200 ? theme.orange
                    : accent;
                  const sdColor = lot.sd == null ? theme.textMuted
                    : lot.sd <= 10 ? theme.green
                    : lot.sd <= 15 ? theme.orange
                    : theme.red;
                  return (
                    <div key={lot.id} style={card}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: theme.textPrimary }}>
                            {lot.brand}
                          </div>
                          {lot.productLine && (
                            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textSecondary, marginTop: '1px' }}>
                              {lot.productLine}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 700, color: qtyColor, lineHeight: 1 }}>
                            {(lot.quantity || 0).toLocaleString()}
                          </div>
                          <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginTop: '2px' }}>ROUNDS</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {lot.grainWeight && (
                          <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textSecondary }}>
                            {lot.grainWeight + 'gr'}
                          </span>
                        )}
                        {lot.bulletType && (
                          <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textSecondary }}>
                            {lot.bulletType}
                          </span>
                        )}
                        {lot.category && (
                          <span style={{
                            padding: '2px 7px', backgroundColor: theme.bg,
                            border: `0.5px solid ${theme.border}`, borderRadius: '3px',
                            fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, letterSpacing: '0.5px',
                          }}>
                            {lot.category.toUpperCase()}
                          </span>
                        )}
                      </div>
                      {(lot.sd != null || lot.actualFPS) && (
                        <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                          {lot.sd != null && (
                            <div>
                              <div style={labelStyle}>Std Dev</div>
                              <div style={{ ...valStyle, color: sdColor }}>{lot.sd + ' fps'}</div>
                            </div>
                          )}
                          {lot.actualFPS && (
                            <div>
                              <div style={labelStyle}>Actual FPS</div>
                              <div style={valStyle}>{lot.actualFPS.toLocaleString() + ' fps'}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                <div style={{ ...card, backgroundColor: theme.bg }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, letterSpacing: '0.8px' }}>
                      {'TOTAL ' + gun.caliber + ' IN INVENTORY'}
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 700, color: accent }}>
                      {ammoLots.reduce((sum, l) => sum + (l.quantity || 0), 0).toLocaleString() + ' rds'}
                    </div>
                  </div>
                </div>
              </>
            )}

          </>
        )}

        {/* ══ TIMELINE TAB ══ */}
        {tab === 'timeline' && (
          <div style={{ position: 'relative', paddingLeft: '24px' }}>

            {/* Vertical line */}
            <div style={{
              position: 'absolute', left: '7px', top: '8px', bottom: '8px',
              width: '2px', backgroundColor: theme.border,
            }} />

            {(() => {
              const dot: React.CSSProperties = {
                position: 'absolute', left: '-20px', top: '4px',
                width: '8px', height: '8px', borderRadius: '50%',
                backgroundColor: accent, flexShrink: 0,
              };
              const itemWrap: React.CSSProperties = {
                position: 'relative', marginBottom: '20px',
              };
              const itemLabel: React.CSSProperties = {
                fontFamily: 'monospace', fontSize: '9px', letterSpacing: '1px',
                color: accent, textTransform: 'uppercase', marginBottom: '4px',
              };
              const itemVal: React.CSSProperties = {
                fontFamily: 'monospace', fontSize: '11px', color: theme.textSecondary, lineHeight: 1.6,
              };

              const MILESTONES = [100, 500, 1000, 2500, 5000];
              const milestoneEvents: { milestone: number; date: string }[] = [];
              if (sessions.length > 0) {
                const sorted = sessions.slice().reverse();
                let running = 0;
                let mIdx = 0;
                for (const s of sorted) {
                  const prev = running;
                  running += s.roundsExpended;
                  while (mIdx < MILESTONES.length && MILESTONES[mIdx] <= running) {
                    if (MILESTONES[mIdx] > prev) {
                      milestoneEvents.push({ milestone: MILESTONES[mIdx], date: s.date });
                    }
                    mIdx++;
                  }
                }
              }

              const oldestSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;
              const newestSession = sessions.length > 0 ? sessions[0] : null;

              return (
                <>
                  {gun.acquiredDate && (
                    <div style={itemWrap}>
                      <div style={dot} />
                      <div style={itemLabel}>ACQUIRED</div>
                      <div style={itemVal}>{formatDate(gun.acquiredDate)}</div>
                      {gun.acquiredFrom && <div style={itemVal}>{'From: ' + gun.acquiredFrom}</div>}
                      {gun.acquiredPrice && (
                        <div style={itemVal}>{'Price: $' + gun.acquiredPrice.toLocaleString()}</div>
                      )}
                      {gun.condition && <div style={itemVal}>{'Condition: ' + gun.condition}</div>}
                    </div>
                  )}

                  {oldestSession && (
                    <div style={itemWrap}>
                      <div style={dot} />
                      <div style={itemLabel}>FIRST SESSION</div>
                      <div style={itemVal}>{formatDate(oldestSession.date)}</div>
                      <div style={itemVal}>{oldestSession.roundsExpended + ' rounds'}</div>
                    </div>
                  )}

                  {milestoneEvents.map(me => (
                    <div key={me.milestone} style={itemWrap}>
                      <div style={{ ...dot, backgroundColor: theme.border, border: '2px solid ' + accent }} />
                      <div style={itemLabel}>{me.milestone.toLocaleString() + ' ROUNDS'}</div>
                      <div style={itemVal}>{formatDate(me.date)}</div>
                    </div>
                  ))}

                  {newestSession && newestSession !== oldestSession && (
                    <div style={itemWrap}>
                      <div style={dot} />
                      <div style={itemLabel}>LAST SESSION</div>
                      <div style={itemVal}>{formatDate(newestSession.date)}</div>
                      {newestSession.location && <div style={itemVal}>{newestSession.location}</div>}
                    </div>
                  )}

                  <div style={itemWrap}>
                    <div style={{ ...dot, backgroundColor: accent }} />
                    <div style={itemLabel}>CURRENT STATUS</div>
                    <div style={{ marginBottom: '4px' }}>
                      <span style={{
                        padding: '2px 8px', backgroundColor: theme.bg,
                        border: `0.5px solid ${gun.status === 'Active' ? theme.green : theme.border}`,
                        borderRadius: '3px', fontFamily: 'monospace', fontSize: '9px',
                        color: gun.status === 'Active' ? theme.green : theme.textMuted,
                        letterSpacing: '0.5px',
                      }}>
                        {gun.status ? gun.status.toUpperCase() : 'UNKNOWN'}
                      </span>
                    </div>
                    <div style={itemVal}>{(gun.roundCount || 0).toLocaleString() + ' total rounds'}</div>
                    {gun.soldDate && (
                      <div style={{ ...itemVal, color: theme.red }}>
                        {'SOLD on ' + formatDate(gun.soldDate) + (gun.soldPrice ? ' for $' + gun.soldPrice.toLocaleString() : '')}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        )}

      </div>

      {/* Session Detail Sheet */}
      {selectedSession && (
        <>
          <div
            onClick={() => setSelectedSession(null)}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 3000 }}
          />
          <div style={{
            position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: '100%', maxWidth: '480px',
            backgroundColor: theme.surface, borderTop: `0.5px solid ${theme.border}`,
            borderRadius: '12px 12px 0 0', zIndex: 3001, padding: '16px 20px 48px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
              <div style={{ width: '32px', height: '4px', borderRadius: '2px', backgroundColor: theme.border }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: theme.textPrimary }}>
                {formatDate(selectedSession.date)}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 700, color: accent }}>
                {selectedSession.roundsExpended} rds
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedSession.location && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, letterSpacing: '0.5px' }}>LOCATION</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textPrimary }}>{selectedSession.location}</span>
                </div>
              )}
              {selectedSession.distanceYards && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, letterSpacing: '0.5px' }}>DISTANCE</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textPrimary }}>{selectedSession.distanceYards} yd</span>
                </div>
              )}
              {selectedSession.indoorOutdoor && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, letterSpacing: '0.5px' }}>ENVIRONMENT</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textPrimary }}>{selectedSession.indoorOutdoor.toUpperCase()}</span>
                </div>
              )}
              {selectedSession.purpose && selectedSession.purpose.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, letterSpacing: '0.5px' }}>PURPOSE</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textPrimary, textAlign: 'right' }}>{selectedSession.purpose.join(', ')}</span>
                </div>
              )}
              {selectedSession.notes && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px', padding: '10px 12px', backgroundColor: theme.bg, borderRadius: '6px' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, letterSpacing: '0.5px' }}>NOTES</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textSecondary, lineHeight: 1.5 }}>{selectedSession.notes}</span>
                </div>
              )}
              {selectedSession.issues && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px', padding: '10px 12px', backgroundColor: theme.bg, borderRadius: '6px', border: `0.5px solid ${theme.red}` }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.red, letterSpacing: '0.5px' }}>ISSUE REPORTED</span>
                  {selectedSession.issueDescription && (
                    <span style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.red, lineHeight: 1.5 }}>{selectedSession.issueDescription}</span>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectedSession(null)}
              style={{
                marginTop: '20px', width: '100%', padding: '12px',
                backgroundColor: 'transparent', border: `0.5px solid ${theme.border}`,
                borderRadius: '6px', color: theme.textPrimary, fontFamily: 'monospace',
                fontSize: '11px', letterSpacing: '0.8px', cursor: 'pointer',
              }}
            >
              CLOSE
            </button>
          </div>
        </>
      )}
      {showLogSession && (
        <SessionLoggingModal
          gun={gun}
          onClose={() => setShowLogSession(false)}
          onSessionLogged={handleSessionLogged}
        />
      )}
    </div>
  );
}

function getAccessoryPlaceholder(field: keyof GunAccessories): string {
  const map: Partial<Record<keyof GunAccessories, string>> = {
    optic: 'Trijicon MRO',
    opticMagnification: '1x',
    muzzleDevice: 'SureFire Warcomp',
    suppressor: 'SureFire SOCOM762',
    weaponLight: 'SureFire X300U',
    laser: 'Streamlight TLR-2',
    sling: 'Blue Force Gear VCAS',
    bipod: 'Harris 9-13"',
    foregrip: 'BCM GUNFIGHTER',
    stockGrip: 'Magpul STR',
    magazineUpgrade: 'Magpul PMAG 30',
    other: 'Custom trigger, etc.',
  };
  return map[field] || '';
}
