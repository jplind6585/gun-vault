import { useState, useEffect, useRef, useCallback } from 'react';
import { theme } from './theme';
import { getDrills } from './services/drillsService';
import {
  getDrillSessions,
  saveDrillSession,
  deleteDrillSession,
  getDrillSessionsForDrill,
  getTrainingGoals,
  saveTrainingGoals,
  getAllGuns,
  getAllAmmo,
} from './storage';
import { callTrainingInsights, clearTrainingInsightsCache } from './claudeApi';
import type {
  ShootingDrill,
  DrillSession,
  TrainingGoals,
  DrillDiscipline,
  DrillSkillFocus,
} from './types';

// ─── Audio ────────────────────────────────────────────────────────────────────

function playTone(freq: number, duration: number, volume = 0.25) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
    setTimeout(() => ctx.close(), (duration + 0.1) * 1000);
  } catch {
    // AudioContext blocked (silent fallback)
  }
}

function scheduleStartSequence(onGo: () => void) {
  // 3 low beeps then 1 high GO beep
  setTimeout(() => playTone(440, 0.1), 0);
  setTimeout(() => playTone(440, 0.1), 1000);
  setTimeout(() => playTone(440, 0.1), 2000);
  setTimeout(() => {
    playTone(880, 0.35, 0.4);
    onGo();
  }, 3000);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(2)}s`;
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(2);
  return `${m}:${s.padStart(5, '0')}`;
}

function tierForResult(drill: ShootingDrill, session: DrillSession): string | null {
  const tiers = drill.performance_tiers;
  if (!tiers) return null;
  const t = session.totalTimeSeconds;
  if (t == null) return null;
  // Lower time = better for timed drills
  if (tiers.world_class != null && t <= tiers.world_class) return 'world_class';
  if (tiers.excellent != null && t <= tiers.excellent) return 'excellent';
  if (tiers.good != null && t <= tiers.good) return 'good';
  if (tiers.passing != null && t <= tiers.passing) return 'passing';
  return null;
}

const TIER_LABELS: Record<string, string> = {
  world_class: 'WORLD CLASS',
  excellent: 'EXCELLENT',
  good: 'GOOD',
  passing: 'PASSING',
};

const TIER_COLORS: Record<string, string> = {
  world_class: '#ffd43b',
  excellent: '#51cf66',
  good: '#74c0fc',
  passing: theme.textSecondary,
};

const DISCIPLINE_LABELS: Record<DrillDiscipline, string> = {
  pistol: 'Pistol',
  rifle: 'Rifle',
  shotgun: 'Shotgun',
  revolver: 'Revolver',
  rimfire: 'Rimfire',
};

const SKILL_LABELS: Record<DrillSkillFocus, string> = {
  draw: 'Draw',
  reload: 'Reload',
  transitions: 'Transitions',
  accuracy: 'Accuracy',
  speed: 'Speed',
  trigger_control: 'Trigger',
  support_hand: 'Support Hand',
  strong_hand: 'Strong Hand',
  movement: 'Movement',
  target_discrimination: 'Target ID',
  low_light: 'Low Light',
  malfunction_clearance: 'Malfunctions',
  stress_inoculation: 'Stress',
};

// ─── Recommendation engine ────────────────────────────────────────────────────

function getRecommendedDrill(
  drills: ShootingDrill[],
  sessions: DrillSession[],
  goals: TrainingGoals | null,
): ShootingDrill | null {
  if (!drills.length) return null;

  let pool = [...drills];

  // Filter by primary discipline
  if (goals?.primaryDiscipline) {
    const filtered = pool.filter(d => d.discipline.includes(goals.primaryDiscipline!));
    if (filtered.length) pool = filtered;
  }

  // Skill balance: find skills NOT trained in the last 7 days
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentSkills = new Set<DrillSkillFocus>();
  sessions
    .filter(s => s.timestamp > cutoff)
    .forEach(s => {
      const drill = drills.find(d => d.id === s.drillId);
      drill?.skill_focus.forEach(sf => recentSkills.add(sf));
    });

  const untrained = pool.filter(d => d.skill_focus.some(sf => !recentSkills.has(sf)));
  if (untrained.length) pool = untrained;

  // Among pool: prefer drills with prior sessions (familiar) over new ones
  // Within familiar: prefer ones where user hasn't hit "good" tier yet
  const drillsWithSessions = new Set(sessions.map(s => s.drillId));
  const familiar = pool.filter(d => drillsWithSessions.has(d.id));
  const unfamiliar = pool.filter(d => !drillsWithSessions.has(d.id));

  // Pick the familiar drill where the personal best is furthest from next tier
  if (familiar.length) {
    // Sort by difficulty asc so we don't surface advanced drills by default
    return familiar.sort((a, b) => a.difficulty - b.difficulty)[0];
  }

  // No familiar drills in this pool — suggest an easy unfamiliar one
  return unfamiliar.sort((a, b) => a.difficulty - b.difficulty)[0] ?? null;
}

// Ammo-aware substitution note
function getAmmoNote(drill: ShootingDrill): string | null {
  if (!drill.dry_fire_capable) return null;
  try {
    const guns = getAllGuns();
    const ammo = getAllAmmo();
    const totalRounds = ammo.reduce((sum, lot) => sum + lot.quantity, 0);
    const sessionsWorth = drill.round_count > 0 ? totalRounds / drill.round_count : 99;
    if (sessionsWorth < 10) {
      // Also check dry-fire capable variants
      return `Ammo running low (~${Math.floor(sessionsWorth)} sessions left). Dry fire mode available.`;
    }
  } catch { /* ignore */ }
  return null;
}

// ─── Sparkline SVG ───────────────────────────────────────────────────────────

function Sparkline({ sessions, drill }: { sessions: DrillSession[]; drill: ShootingDrill }) {
  const timed = sessions.filter(s => s.totalTimeSeconds != null).slice(0, 20).reverse();
  if (timed.length < 2) return null;

  const values = timed.map(s => s.totalTimeSeconds!);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 120, H = 36;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    // Invert: lower time = higher on chart
    const y = H - ((v - min) / range) * (H - 4) - 2;
    return `${x},${y}`;
  });

  // Benchmark tier lines
  const tiers = drill.performance_tiers;
  const tierLines = tiers
    ? Object.entries(tiers)
        .filter(([, v]) => v != null && v >= min && v <= max)
        .map(([key, v]) => {
          const y = H - ((v! - min) / range) * (H - 4) - 2;
          return { key, y, color: TIER_COLORS[key] ?? theme.textMuted };
        })
    : [];

  return (
    <svg width={W} height={H} style={{ overflow: 'visible' }}>
      {tierLines.map(({ key, y, color }) => (
        <line key={key} x1={0} y1={y} x2={W} y2={y}
          stroke={color} strokeWidth={0.5} strokeDasharray="3,2" opacity={0.6} />
      ))}
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={theme.accent}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Last point dot */}
      {values.length > 0 && (() => {
        const last = values[values.length - 1];
        const x = W;
        const y = H - ((last - min) / range) * (H - 4) - 2;
        return <circle cx={x} cy={y} r={2.5} fill={theme.accent} />;
      })()}
    </svg>
  );
}

// ─── Difficulty dots ─────────────────────────────────────────────────────────

function DifficultyDots({ level }: { level: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <div style={{ display: 'flex', gap: '3px' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} style={{
          width: '6px', height: '6px', borderRadius: '50%',
          backgroundColor: i <= level ? theme.accent : theme.border,
        }} />
      ))}
    </div>
  );
}

// ─── Mental check-in ─────────────────────────────────────────────────────────

interface MentalCheckInProps {
  onComplete: (sleep: number, stress: number, focus: number) => void;
  onSkip: () => void;
}

function MentalCheckIn({ onComplete, onSkip }: MentalCheckInProps) {
  const [sleep, setSleep] = useState(0);
  const [stress, setStress] = useState(0);
  const [focus, setFocus] = useState(0);
  const step = sleep === 0 ? 'sleep' : stress === 0 ? 'stress' : 'focus';

  const labels = {
    sleep: { q: 'How did you sleep?', low: 'Poor', high: 'Great' },
    stress: { q: 'Stress level today?', low: 'Low', high: 'High' },
    focus: { q: 'Mental focus right now?', low: 'Scattered', high: 'Sharp' },
  };
  const { q, low, high } = labels[step];

  function tap(val: number) {
    if (step === 'sleep') { setSleep(val); return; }
    if (step === 'stress') { setStress(val); return; }
    setFocus(val);
    onComplete(sleep, stress, val);
  }

  return (
    <div style={{ padding: '24px 20px' }}>
      <div style={{ color: theme.textMuted, fontSize: '11px', letterSpacing: '1px', marginBottom: '16px' }}>
        PRE-SESSION CHECK-IN — {step === 'sleep' ? '1/3' : step === 'stress' ? '2/3' : '3/3'}
      </div>
      <div style={{ color: theme.textPrimary, fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>
        {q}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        {[1, 2, 3, 4, 5].map(v => (
          <button key={v} onClick={() => tap(v)} style={{
            width: '52px', height: '52px', borderRadius: '8px',
            border: `1px solid ${theme.border}`,
            backgroundColor: theme.surface,
            color: theme.textPrimary,
            fontSize: '20px', fontWeight: 700,
            cursor: 'pointer',
          }}>
            {v}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <span style={{ fontSize: '11px', color: theme.textMuted }}>{low}</span>
        <span style={{ fontSize: '11px', color: theme.textMuted }}>{high}</span>
      </div>
      <button onClick={onSkip} style={{
        background: 'none', border: 'none', color: theme.textMuted,
        fontSize: '12px', cursor: 'pointer', textDecoration: 'underline',
      }}>
        Skip check-in
      </button>
    </div>
  );
}

// ─── Session modal ────────────────────────────────────────────────────────────

type SessionStep = 'checkin' | 'setup' | 'timer' | 'log';

interface SessionModalProps {
  drill: ShootingDrill;
  onSave: (session: DrillSession) => void;
  onCancel: () => void;
  goals: TrainingGoals | null;
}

function SessionModal({ drill, onSave, onCancel, goals }: SessionModalProps) {
  const [step, setStep] = useState<SessionStep>('checkin');
  const [mental, setMental] = useState<{ sleep: number; stress: number; focus: number } | null>(null);
  const [isDryFire, setIsDryFire] = useState(false);
  const [selectedGunId, setSelectedGunId] = useState<string>(goals?.primaryGunId ?? '');
  const [timerState, setTimerState] = useState<'idle' | 'countdown' | 'running' | 'done'>('idle');
  const [countdownN, setCountdownN] = useState(3);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [timeEntry, setTimeEntry] = useState('');
  const [accuracyEntry, setAccuracyEntry] = useState('');
  const [pointsEntry, setPointsEntry] = useState('');
  const [notes, setNotes] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);
  const guns = getAllGuns().filter(g => g.status === 'Active');

  // Check if mental check-in already done today
  useEffect(() => {
    const today = new Date().toDateString();
    const saved = localStorage.getItem('gunvault_mental_state_date');
    if (saved === today) {
      const vals = JSON.parse(localStorage.getItem('gunvault_mental_state_vals') ?? 'null');
      if (vals) { setMental(vals); setStep('setup'); }
    }
  }, []);

  function handleMentalComplete(sleep: number, stress: number, focus: number) {
    const vals = { sleep, stress, focus };
    setMental(vals);
    const today = new Date().toDateString();
    localStorage.setItem('gunvault_mental_state_date', today);
    localStorage.setItem('gunvault_mental_state_vals', JSON.stringify(vals));
    setStep('setup');
  }

  function startTimer() {
    setTimerState('countdown');
    setCountdownN(3);
    let n = 3;
    const tick = setInterval(() => {
      n--;
      setCountdownN(n);
      if (n <= 0) clearInterval(tick);
    }, 1000);

    scheduleStartSequence(() => {
      setTimerState('running');
      startRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startRef.current);
      }, 50);
    });
  }

  function stopTimer() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const elapsed = (Date.now() - startRef.current) / 1000;
    setTimerState('done');
    setTimeEntry(elapsed.toFixed(2));
    setElapsedMs(elapsed * 1000);
    setStep('log');
  }

  function handleSave() {
    const gun = guns.find(g => g.id === selectedGunId);
    const session: DrillSession = {
      id: generateId(),
      drillId: drill.id,
      drillName: drill.name,
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
      gunId: gun?.id,
      gunName: gun ? `${gun.make} ${gun.model}` : undefined,
      isDryFire,
      scoringMethod: drill.scoring_method,
      totalTimeSeconds: timeEntry ? parseFloat(timeEntry) : undefined,
      accuracy: accuracyEntry ? parseFloat(accuracyEntry) : undefined,
      points: pointsEntry ? parseInt(pointsEntry) : undefined,
      sleepRating: mental?.sleep as DrillSession['sleepRating'],
      stressRating: mental?.stress as DrillSession['stressRating'],
      focusRating: mental?.focus as DrillSession['focusRating'],
      notes: notes.trim() || undefined,
    };
    onSave(session);
  }

  const showTime = drill.scoring_method === 'Time Only' || drill.scoring_method === 'Time + Points' || drill.scoring_method === 'Hit Factor';
  const showAccuracy = drill.scoring_method === 'Points Only' || drill.scoring_method === 'Pass-Fail';
  const showPoints = drill.scoring_method === 'Points Only' || drill.scoring_method === 'Time + Points' || drill.scoring_method === 'Hit Factor';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      backgroundColor: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'flex-end',
    }} onClick={e => e.target === e.currentTarget && onCancel()}>
      <div style={{
        width: '100%', backgroundColor: theme.surface,
        borderRadius: '16px 16px 0 0',
        maxHeight: '92vh', overflowY: 'auto',
        paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 20px 0',
        }}>
          <div>
            <div style={{ color: theme.textMuted, fontSize: '10px', letterSpacing: '1px' }}>SESSION</div>
            <div style={{ color: theme.textPrimary, fontSize: '17px', fontWeight: 700 }}>{drill.name}</div>
          </div>
          <button onClick={onCancel} style={{
            background: 'none', border: 'none', color: theme.textMuted,
            fontSize: '22px', cursor: 'pointer', padding: '4px',
          }}>×</button>
        </div>

        {/* Step: Mental check-in */}
        {step === 'checkin' && (
          <MentalCheckIn
            onComplete={handleMentalComplete}
            onSkip={() => setStep('setup')}
          />
        )}

        {/* Step: Setup */}
        {step === 'setup' && (
          <div style={{ padding: '20px' }}>
            {/* Dry fire toggle */}
            {drill.dry_fire_capable && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 16px', backgroundColor: theme.bg,
                borderRadius: '10px', marginBottom: '12px',
                border: `1px solid ${isDryFire ? theme.accent : theme.border}`,
              }}>
                <div>
                  <div style={{ color: theme.textPrimary, fontSize: '14px', fontWeight: 600 }}>Dry Fire Mode</div>
                  <div style={{ color: theme.textMuted, fontSize: '12px' }}>No ammo consumed</div>
                </div>
                <button onClick={() => setIsDryFire(v => !v)} style={{
                  width: '44px', height: '24px', borderRadius: '12px',
                  backgroundColor: isDryFire ? theme.accent : theme.border,
                  border: 'none', cursor: 'pointer', position: 'relative',
                  transition: 'background-color 0.2s',
                }}>
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '50%',
                    backgroundColor: '#fff',
                    position: 'absolute', top: '3px',
                    left: isDryFire ? '23px' : '3px',
                    transition: 'left 0.2s',
                  }} />
                </button>
              </div>
            )}

            {/* Gun picker */}
            {guns.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: theme.textMuted, fontSize: '11px', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                  GUN (OPTIONAL)
                </label>
                <select
                  value={selectedGunId}
                  onChange={e => setSelectedGunId(e.target.value)}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '8px',
                    backgroundColor: theme.bg, border: `1px solid ${theme.border}`,
                    color: theme.textPrimary, fontSize: '14px',
                  }}
                >
                  <option value="">No gun selected</option>
                  {guns.map(g => (
                    <option key={g.id} value={g.id}>{g.make} {g.model}</option>
                  ))}
                </select>
              </div>
            )}

            <button onClick={() => setStep('timer')} style={{
              width: '100%', padding: '16px',
              backgroundColor: theme.accent, color: '#000',
              border: 'none', borderRadius: '10px',
              fontSize: '15px', fontWeight: 700, letterSpacing: '0.5px',
              cursor: 'pointer',
            }}>
              CONTINUE
            </button>
          </div>
        )}

        {/* Step: Timer */}
        {step === 'timer' && (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ color: theme.textMuted, fontSize: '12px', marginBottom: '24px' }}>
              {drill.par_time_seconds != null && `Par: ${drill.par_time_seconds}s`}
            </div>

            {timerState === 'idle' && (
              <>
                <div style={{ color: theme.textSecondary, fontSize: '14px', marginBottom: '24px' }}>
                  Press START — a 3-count beep sequence will fire.
                </div>
                <button onClick={startTimer} style={{
                  padding: '18px 48px', backgroundColor: theme.accent,
                  color: '#000', border: 'none', borderRadius: '12px',
                  fontSize: '18px', fontWeight: 800, cursor: 'pointer',
                  letterSpacing: '1px',
                }}>
                  START
                </button>
              </>
            )}

            {timerState === 'countdown' && (
              <div style={{
                fontSize: '96px', fontWeight: 800, fontFamily: 'monospace',
                color: countdownN <= 1 ? theme.accent : theme.textPrimary,
              }}>
                {countdownN > 0 ? countdownN : 'GO'}
              </div>
            )}

            {timerState === 'running' && (
              <>
                <div style={{
                  fontSize: '72px', fontWeight: 800, fontFamily: 'monospace',
                  color: theme.accent, marginBottom: '32px',
                }}>
                  {formatTime(elapsedMs / 1000)}
                </div>
                <button onClick={stopTimer} style={{
                  padding: '18px 48px', backgroundColor: theme.red,
                  color: '#fff', border: 'none', borderRadius: '12px',
                  fontSize: '18px', fontWeight: 800, cursor: 'pointer',
                }}>
                  STOP
                </button>
              </>
            )}

            {timerState === 'done' && (
              <div style={{ color: theme.green, fontSize: '20px', fontWeight: 700 }}>
                {formatTime(elapsedMs / 1000)}
              </div>
            )}

            {/* Skip to log without timer */}
            {timerState === 'idle' && (
              <div style={{ marginTop: '24px' }}>
                <button onClick={() => setStep('log')} style={{
                  background: 'none', border: 'none', color: theme.textMuted,
                  fontSize: '12px', cursor: 'pointer', textDecoration: 'underline',
                }}>
                  Skip timer — enter results manually
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step: Log results */}
        {step === 'log' && (
          <div style={{ padding: '20px' }}>
            {showTime && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: theme.textMuted, fontSize: '11px', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                  TIME (SECONDS)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={timeEntry}
                  onChange={e => setTimeEntry(e.target.value)}
                  placeholder="e.g. 2.45"
                  style={{
                    width: '100%', padding: '12px', borderRadius: '8px',
                    backgroundColor: theme.bg, border: `1px solid ${theme.border}`,
                    color: theme.textPrimary, fontSize: '20px', fontFamily: 'monospace',
                    boxSizing: 'border-box',
                  }}
                />
                {drill.par_time_seconds != null && (
                  <div style={{ color: theme.textMuted, fontSize: '11px', marginTop: '4px' }}>
                    Par: {drill.par_time_seconds}s
                  </div>
                )}
              </div>
            )}

            {showPoints && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: theme.textMuted, fontSize: '11px', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                  SCORE / POINTS
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={pointsEntry}
                  onChange={e => setPointsEntry(e.target.value)}
                  placeholder="e.g. 150"
                  style={{
                    width: '100%', padding: '12px', borderRadius: '8px',
                    backgroundColor: theme.bg, border: `1px solid ${theme.border}`,
                    color: theme.textPrimary, fontSize: '18px', fontFamily: 'monospace',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

            {showAccuracy && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: theme.textMuted, fontSize: '11px', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                  ACCURACY (%)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={accuracyEntry}
                  onChange={e => setAccuracyEntry(e.target.value)}
                  placeholder="e.g. 90"
                  style={{
                    width: '100%', padding: '12px', borderRadius: '8px',
                    backgroundColor: theme.bg, border: `1px solid ${theme.border}`,
                    color: theme.textPrimary, fontSize: '18px', fontFamily: 'monospace',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: theme.textMuted, fontSize: '11px', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                NOTES (OPTIONAL)
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Shot 3 pulled left. Reset was slow on reload."
                rows={3}
                style={{
                  width: '100%', padding: '12px', borderRadius: '8px',
                  backgroundColor: theme.bg, border: `1px solid ${theme.border}`,
                  color: theme.textPrimary, fontSize: '14px',
                  resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                }}
              />
            </div>

            <button
              onClick={handleSave}
              disabled={showTime && !timeEntry && !pointsEntry && !accuracyEntry}
              style={{
                width: '100%', padding: '16px',
                backgroundColor: theme.accent, color: '#000',
                border: 'none', borderRadius: '10px',
                fontSize: '15px', fontWeight: 700,
                cursor: 'pointer', opacity: (showTime && !timeEntry && !pointsEntry && !accuracyEntry) ? 0.4 : 1,
              }}
            >
              SAVE SESSION
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Drill card ───────────────────────────────────────────────────────────────

interface DrillCardProps {
  drill: ShootingDrill;
  sessions: DrillSession[];
  isRecommended?: boolean;
  onClick: () => void;
}

function DrillCard({ drill, sessions, isRecommended, onClick }: DrillCardProps) {
  const myBest = sessions
    .filter(s => s.totalTimeSeconds != null)
    .sort((a, b) => a.totalTimeSeconds! - b.totalTimeSeconds!)[0];
  const bestTier = myBest ? tierForResult(drill, myBest) : null;

  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left',
      backgroundColor: theme.surface,
      border: `1px solid ${isRecommended ? theme.accent : theme.border}`,
      borderRadius: '12px', padding: '14px 16px',
      cursor: 'pointer', marginBottom: '10px',
      position: 'relative',
    }}>
      {isRecommended && (
        <div style={{
          position: 'absolute', top: '-1px', right: '14px',
          backgroundColor: theme.accent, color: '#000',
          fontSize: '9px', fontWeight: 700, letterSpacing: '1px',
          padding: '2px 8px', borderRadius: '0 0 6px 6px',
        }}>
          RECOMMENDED
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ color: theme.textPrimary, fontSize: '15px', fontWeight: 600, paddingRight: '8px', flex: 1 }}>
          {drill.name}
        </div>
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          {drill.dry_fire_capable && (
            <span style={{
              fontSize: '9px', letterSpacing: '0.8px', fontWeight: 700,
              color: theme.green, border: `1px solid ${theme.green}`,
              borderRadius: '4px', padding: '2px 5px',
            }}>DRY OK</span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <DifficultyDots level={drill.difficulty} />
        <span style={{ color: theme.textMuted, fontSize: '12px', fontFamily: 'monospace' }}>
          {drill.round_count} rds · {drill.distance_yards} yds
        </span>
        {drill.par_time_seconds != null && (
          <span style={{ color: theme.textMuted, fontSize: '12px', fontFamily: 'monospace' }}>
            par {drill.par_time_seconds}s
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: myBest ? '10px' : '0' }}>
        {drill.skill_focus.slice(0, 3).map(sf => (
          <span key={sf} style={{
            fontSize: '10px', color: theme.textSecondary,
            backgroundColor: theme.bg,
            borderRadius: '4px', padding: '2px 6px',
          }}>
            {SKILL_LABELS[sf]}
          </span>
        ))}
      </div>

      {myBest && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: theme.textMuted, fontSize: '12px' }}>
            Best: <span style={{ fontFamily: 'monospace', color: bestTier ? TIER_COLORS[bestTier] : theme.textSecondary }}>
              {myBest.totalTimeSeconds != null ? formatTime(myBest.totalTimeSeconds) : '—'}
            </span>
            {bestTier && ` · ${TIER_LABELS[bestTier]}`}
          </span>
          <span style={{ color: theme.textMuted, fontSize: '11px' }}>
            {sessions.length} session{sessions.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </button>
  );
}

// ─── Drill detail ─────────────────────────────────────────────────────────────

interface DrillDetailProps {
  drill: ShootingDrill;
  sessions: DrillSession[];
  onStart: () => void;
  onBack: () => void;
  onDeleteSession: (id: string) => void;
}

function DrillDetail({ drill, sessions, onStart, onBack, onDeleteSession }: DrillDetailProps) {
  const [showHistory, setShowHistory] = useState(false);
  const ammoNote = getAmmoNote(drill);
  const myBest = sessions
    .filter(s => s.totalTimeSeconds != null)
    .sort((a, b) => a.totalTimeSeconds! - b.totalTimeSeconds!)[0];
  const bestTier = myBest ? tierForResult(drill, myBest) : null;

  const tiers = drill.performance_tiers;
  const tierEntries = tiers
    ? Object.entries(tiers)
        .filter(([, v]) => v != null)
        .sort(([, a], [, b]) => (a ?? 0) - (b ?? 0))
    : [];

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {/* Back + header */}
      <div style={{ padding: '16px 20px 0' }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: theme.accent,
          fontSize: '13px', cursor: 'pointer', padding: 0, marginBottom: '12px',
          display: 'flex', alignItems: 'center', gap: '4px',
        }}>
          ← Back
        </button>
        <div style={{ color: theme.textPrimary, fontSize: '22px', fontWeight: 800, marginBottom: '4px' }}>
          {drill.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <DifficultyDots level={drill.difficulty} />
          <span style={{ color: theme.textMuted, fontSize: '13px', fontFamily: 'monospace' }}>
            {drill.round_count} rounds · {drill.distance_yards} yds
          </span>
          {drill.dry_fire_capable && (
            <span style={{
              fontSize: '10px', letterSpacing: '0.8px', fontWeight: 700,
              color: theme.green, border: `1px solid ${theme.green}`,
              borderRadius: '4px', padding: '2px 6px',
            }}>DRY FIRE OK</span>
          )}
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Ammo note */}
        {ammoNote && (
          <div style={{
            backgroundColor: 'rgba(255,159,67,0.1)', border: `1px solid ${theme.orange}`,
            borderRadius: '10px', padding: '12px 14px', marginBottom: '16px',
            color: theme.orange, fontSize: '13px',
          }}>
            {ammoNote}
          </div>
        )}

        {/* Description */}
        <p style={{ color: theme.textSecondary, fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
          {drill.description}
        </p>

        {/* Skills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
          {drill.skill_focus.map(sf => (
            <span key={sf} style={{
              fontSize: '11px', color: theme.textSecondary,
              backgroundColor: theme.bg, border: `1px solid ${theme.border}`,
              borderRadius: '6px', padding: '4px 8px', letterSpacing: '0.5px',
            }}>
              {SKILL_LABELS[sf]}
            </span>
          ))}
        </div>

        {/* Performance tiers */}
        {tierEntries.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ color: theme.textMuted, fontSize: '11px', letterSpacing: '1px', marginBottom: '10px' }}>
              BENCHMARKS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {tierEntries.map(([key, val]) => (
                <div key={key} style={{
                  backgroundColor: theme.bg, borderRadius: '8px',
                  border: `1px solid ${bestTier === key ? TIER_COLORS[key] : theme.border}`,
                  padding: '10px 12px',
                }}>
                  <div style={{ color: TIER_COLORS[key] ?? theme.textMuted, fontSize: '10px', letterSpacing: '1px', fontWeight: 700 }}>
                    {TIER_LABELS[key] ?? key.toUpperCase()}
                  </div>
                  <div style={{ color: theme.textPrimary, fontFamily: 'monospace', fontSize: '18px', fontWeight: 700 }}>
                    ≤{val}s
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My performance */}
        {sessions.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ color: theme.textMuted, fontSize: '11px', letterSpacing: '1px' }}>MY PROGRESS</div>
              <button onClick={() => setShowHistory(v => !v)} style={{
                background: 'none', border: 'none', color: theme.accent,
                fontSize: '12px', cursor: 'pointer',
              }}>
                {showHistory ? 'Hide' : `All ${sessions.length} sessions`}
              </button>
            </div>
            <div style={{
              backgroundColor: theme.bg, borderRadius: '10px',
              padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ color: theme.textMuted, fontSize: '11px', marginBottom: '4px' }}>BEST</div>
                <div style={{
                  fontFamily: 'monospace', fontSize: '22px', fontWeight: 700,
                  color: bestTier ? TIER_COLORS[bestTier] : theme.textPrimary,
                }}>
                  {myBest?.totalTimeSeconds != null ? formatTime(myBest.totalTimeSeconds) : '—'}
                </div>
                {bestTier && (
                  <div style={{ color: TIER_COLORS[bestTier], fontSize: '11px', fontWeight: 700 }}>
                    {TIER_LABELS[bestTier]}
                  </div>
                )}
              </div>
              <Sparkline sessions={sessions} drill={drill} />
            </div>

            {showHistory && (
              <div style={{ marginTop: '10px' }}>
                {sessions.slice(0, 20).map(s => (
                  <div key={s.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 0', borderBottom: `1px solid ${theme.border}`,
                  }}>
                    <div>
                      <div style={{ color: theme.textSecondary, fontSize: '13px' }}>
                        {s.totalTimeSeconds != null ? (
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: theme.textPrimary }}>
                            {formatTime(s.totalTimeSeconds)}
                          </span>
                        ) : s.points != null ? (
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: theme.textPrimary }}>
                            {s.points} pts
                          </span>
                        ) : '—'}
                        {s.isDryFire && (
                          <span style={{ color: theme.green, fontSize: '10px', marginLeft: '6px' }}>DRY</span>
                        )}
                      </div>
                      <div style={{ color: theme.textMuted, fontSize: '11px', marginTop: '2px' }}>
                        {s.date}{s.gunName ? ` · ${s.gunName}` : ''}
                        {s.notes && ` · "${s.notes.slice(0, 40)}${s.notes.length > 40 ? '…' : ''}"`}
                      </div>
                      {/* Mental state dots */}
                      {(s.sleepRating || s.stressRating || s.focusRating) && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                          {s.sleepRating && (
                            <span style={{ fontSize: '10px', color: theme.textMuted }}>
                              Sleep {s.sleepRating}/5
                            </span>
                          )}
                          {s.stressRating && (
                            <span style={{ fontSize: '10px', color: theme.textMuted }}>
                              Stress {s.stressRating}/5
                            </span>
                          )}
                          {s.focusRating && (
                            <span style={{ fontSize: '10px', color: theme.textMuted }}>
                              Focus {s.focusRating}/5
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <button onClick={() => onDeleteSession(s.id)} style={{
                      background: 'none', border: 'none', color: theme.textMuted,
                      fontSize: '18px', cursor: 'pointer', padding: '4px',
                    }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Start button */}
        <button onClick={onStart} style={{
          width: '100%', padding: '18px',
          backgroundColor: theme.accent, color: '#000',
          border: 'none', borderRadius: '12px',
          fontSize: '16px', fontWeight: 800, letterSpacing: '0.5px',
          cursor: 'pointer', marginBottom: '32px',
        }}>
          START SESSION
        </button>
      </div>
    </div>
  );
}

// ─── Goals panel ──────────────────────────────────────────────────────────────

interface GoalsPanelProps {
  goals: TrainingGoals;
  onChange: (goals: TrainingGoals) => void;
  onClose: () => void;
}

function GoalsPanel({ goals, onChange, onClose }: GoalsPanelProps) {
  const [local, setLocal] = useState<TrainingGoals>(goals);
  const guns = getAllGuns().filter(g => g.status === 'Active');
  const disciplines: DrillDiscipline[] = ['pistol', 'rifle', 'shotgun', 'revolver', 'rimfire'];
  const times: (15 | 30 | 60)[] = [15, 30, 60];

  function save() { onChange(local); onClose(); }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      backgroundColor: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'flex-end',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        width: '100%', backgroundColor: theme.surface,
        borderRadius: '16px 16px 0 0',
        padding: '20px 20px calc(32px + env(safe-area-inset-bottom))',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ color: theme.textPrimary, fontSize: '18px', fontWeight: 700 }}>Training Goals</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: theme.textMuted, fontSize: '22px', cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ color: theme.textMuted, fontSize: '11px', letterSpacing: '1px', marginBottom: '10px' }}>PRIMARY DISCIPLINE</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
          {disciplines.map(d => (
            <button key={d} onClick={() => setLocal(g => ({ ...g, primaryDiscipline: d }))} style={{
              padding: '8px 16px', borderRadius: '20px',
              backgroundColor: local.primaryDiscipline === d ? theme.accent : theme.bg,
              color: local.primaryDiscipline === d ? '#000' : theme.textSecondary,
              border: `1px solid ${local.primaryDiscipline === d ? theme.accent : theme.border}`,
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            }}>
              {DISCIPLINE_LABELS[d]}
            </button>
          ))}
        </div>

        <div style={{ color: theme.textMuted, fontSize: '11px', letterSpacing: '1px', marginBottom: '10px' }}>SESSION TIME</div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {times.map(t => (
            <button key={t} onClick={() => setLocal(g => ({ ...g, sessionMinutesAvailable: t }))} style={{
              flex: 1, padding: '10px', borderRadius: '8px',
              backgroundColor: local.sessionMinutesAvailable === t ? theme.accent : theme.bg,
              color: local.sessionMinutesAvailable === t ? '#000' : theme.textSecondary,
              border: `1px solid ${local.sessionMinutesAvailable === t ? theme.accent : theme.border}`,
              fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            }}>
              {t}m
            </button>
          ))}
        </div>

        {guns.length > 0 && (
          <>
            <div style={{ color: theme.textMuted, fontSize: '11px', letterSpacing: '1px', marginBottom: '10px' }}>PRIMARY GUN</div>
            <select
              value={local.primaryGunId ?? ''}
              onChange={e => setLocal(g => ({ ...g, primaryGunId: e.target.value || undefined }))}
              style={{
                width: '100%', padding: '12px', borderRadius: '8px',
                backgroundColor: theme.bg, border: `1px solid ${theme.border}`,
                color: theme.textPrimary, fontSize: '14px', marginBottom: '24px',
              }}
            >
              <option value="">Any gun</option>
              {guns.map(g => <option key={g.id} value={g.id}>{g.make} {g.model}</option>)}
            </select>
          </>
        )}

        <button onClick={save} style={{
          width: '100%', padding: '16px',
          backgroundColor: theme.accent, color: '#000',
          border: 'none', borderRadius: '10px',
          fontSize: '15px', fontWeight: 700, cursor: 'pointer',
        }}>
          SAVE GOALS
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type TrainingView = 'home' | 'browse' | 'detail' | 'analytics';
type DrillFilter = 'all' | 'pistol' | 'rifle' | 'shotgun' | 'dry-fire';

export function TrainingLog({ isPro, onUpgrade }: { isPro?: boolean; onUpgrade?: (reason?: string) => void } = {}) {
  const [view, setView] = useState<TrainingView>('home');
  const [drills, setDrills] = useState<ShootingDrill[]>([]);
  const [sessions, setSessions] = useState<DrillSession[]>([]);
  const [goals, setGoals] = useState<TrainingGoals>({});
  const [loading, setLoading] = useState(true);
  const [selectedDrill, setSelectedDrill] = useState<ShootingDrill | null>(null);
  const [showSession, setShowSession] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [filter, setFilter] = useState<DrillFilter>('all');
  const [saveToast, setSaveToast] = useState(false);

  useEffect(() => {
    setSessions(getDrillSessions());
    const g = getTrainingGoals();
    if (g) setGoals(g);
  }, []);

  useEffect(() => {
    getDrills().then(data => { setDrills(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const sessionsForDrill = useCallback((drillId: string) =>
    sessions.filter(s => s.drillId === drillId), [sessions]);

  function handleSaveSession(session: DrillSession) {
    saveDrillSession(session);
    setSessions(getDrillSessions());
    setShowSession(false);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
    clearTrainingInsightsCache();
  }

  function handleDeleteSession(id: string) {
    deleteDrillSession(id);
    setSessions(getDrillSessions());
  }

  function handleSaveGoals(g: TrainingGoals) {
    saveTrainingGoals(g);
    setGoals(g);
  }

  const filteredDrills = drills.filter(d => {
    if (filter === 'all') return true;
    if (filter === 'dry-fire') return d.dry_fire_capable;
    return d.discipline.includes(filter as DrillDiscipline);
  });

  const recommended = getRecommendedDrill(drills, sessions, goals);
  const recentSessions = sessions.slice(0, 8);

  // ── Home view ───────────────────────────────────────────────────────────────
  if (view === 'home') {
    return (
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {/* Goals bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '20px',
        }}>
          <div>
            {goals.primaryDiscipline ? (
              <span style={{
                fontSize: '12px', color: theme.accent,
                border: `1px solid ${theme.accent}`,
                borderRadius: '20px', padding: '4px 10px', fontWeight: 600,
              }}>
                {DISCIPLINE_LABELS[goals.primaryDiscipline]}
                {goals.sessionMinutesAvailable && ` · ${goals.sessionMinutesAvailable}m`}
              </span>
            ) : (
              <span style={{ fontSize: '13px', color: theme.textMuted }}>No goals set</span>
            )}
          </div>
          <button onClick={() => setShowGoals(true)} style={{
            background: 'none', border: `1px solid ${theme.border}`,
            borderRadius: '6px', padding: '6px 12px',
            color: theme.textSecondary, fontSize: '12px', cursor: 'pointer',
          }}>
            {goals.primaryDiscipline ? 'EDIT GOALS' : 'SET GOALS'}
          </button>
        </div>

        {/* Recommended drill */}
        {!loading && recommended && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ color: theme.textMuted, fontSize: '11px', letterSpacing: '1px', marginBottom: '10px' }}>
              RECOMMENDED TODAY
            </div>
            <DrillCard
              drill={recommended}
              sessions={sessionsForDrill(recommended.id)}
              isRecommended
              onClick={() => { setSelectedDrill(recommended); setView('detail'); }}
            />
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: theme.textMuted }}>
            Loading drills...
          </div>
        )}

        {/* Recent activity */}
        {recentSessions.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ color: theme.textMuted, fontSize: '11px', letterSpacing: '1px', marginBottom: '10px' }}>
              RECENT ACTIVITY
            </div>
            {recentSessions.map(s => {
              const drill = drills.find(d => d.id === s.drillId);
              return (
                <div key={s.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 0', borderBottom: `1px solid ${theme.border}`,
                  cursor: drill ? 'pointer' : 'default',
                }}
                  onClick={() => drill && (setSelectedDrill(drill), setView('detail'))}
                >
                  <div>
                    <div style={{ color: theme.textSecondary, fontSize: '13px', fontWeight: 600 }}>
                      {s.drillName}
                      {s.isDryFire && <span style={{ color: theme.green, fontSize: '10px', marginLeft: '6px' }}>DRY</span>}
                    </div>
                    <div style={{ color: theme.textMuted, fontSize: '11px' }}>
                      {s.date}{s.gunName ? ` · ${s.gunName}` : ''}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'monospace', color: theme.textPrimary, fontSize: '14px', fontWeight: 700 }}>
                    {s.totalTimeSeconds != null ? formatTime(s.totalTimeSeconds)
                      : s.points != null ? `${s.points} pts`
                      : s.accuracy != null ? `${s.accuracy}%`
                      : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button onClick={() => { setFilter('all'); setView('browse'); }} style={{
            padding: '16px', backgroundColor: theme.surface,
            border: `1px solid ${theme.border}`, borderRadius: '10px',
            color: theme.textPrimary, fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', textAlign: 'center',
          }}>
            BROWSE ALL<br />
            <span style={{ color: theme.textMuted, fontSize: '11px', fontWeight: 400 }}>
              {drills.length} drills
            </span>
          </button>
          <button onClick={() => { setFilter('dry-fire'); setView('browse'); }} style={{
            padding: '16px', backgroundColor: theme.surface,
            border: `1px solid ${theme.green}`, borderRadius: '10px',
            color: theme.green, fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', textAlign: 'center',
          }}>
            DRY FIRE ONLY<br />
            <span style={{ color: theme.textMuted, fontSize: '11px', fontWeight: 400 }}>
              {drills.filter(d => d.dry_fire_capable).length} drills
            </span>
          </button>
          {sessions.length >= 3 && (
            <button onClick={() => setView('analytics')} style={{
              padding: '16px', backgroundColor: theme.surface,
              border: `1px solid rgba(116, 192, 252, 0.4)`, borderRadius: '10px',
              color: '#74c0fc', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', textAlign: 'center', gridColumn: '1 / -1',
            }}>
              ANALYTICS<br />
              <span style={{ color: theme.textMuted, fontSize: '11px', fontWeight: 400 }}>
                Plateau detection, skill coverage, AI feedback
              </span>
            </button>
          )}
        </div>

        {/* Save toast */}
        {saveToast && (
          <div style={{
            position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
            backgroundColor: theme.green, color: '#fff',
            padding: '10px 20px', borderRadius: '20px',
            fontSize: '13px', fontWeight: 600, zIndex: 400,
          }}>
            Session saved
          </div>
        )}

        {showGoals && (
          <GoalsPanel goals={goals} onChange={handleSaveGoals} onClose={() => setShowGoals(false)} />
        )}
      </div>
    );
  }

  // ── Browse view ─────────────────────────────────────────────────────────────
  if (view === 'browse') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Filter pills */}
        <div style={{
          padding: '12px 20px',
          borderBottom: `1px solid ${theme.border}`,
          display: 'flex', gap: '8px', overflowX: 'auto',
        }}>
          {(['all', 'pistol', 'rifle', 'shotgun', 'dry-fire'] as DrillFilter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 14px', borderRadius: '20px', whiteSpace: 'nowrap',
              backgroundColor: filter === f ? theme.accent : theme.surface,
              color: filter === f ? '#000' : theme.textSecondary,
              border: `1px solid ${filter === f ? theme.accent : theme.border}`,
              fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            }}>
              {f === 'dry-fire' ? 'Dry Fire' : f === 'all' ? 'All' : DISCIPLINE_LABELS[f as DrillDiscipline]}
            </button>
          ))}
        </div>

        {/* Drill list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: theme.textMuted }}>
              Loading drills...
            </div>
          ) : filteredDrills.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: theme.textMuted }}>
              No drills found
            </div>
          ) : (
            filteredDrills.map(d => (
              <DrillCard
                key={d.id}
                drill={d}
                sessions={sessionsForDrill(d.id)}
                isRecommended={recommended?.id === d.id}
                onClick={() => { setSelectedDrill(d); setView('detail'); }}
              />
            ))
          )}
        </div>

        {showGoals && (
          <GoalsPanel goals={goals} onChange={handleSaveGoals} onClose={() => setShowGoals(false)} />
        )}
      </div>
    );
  }

  // ── Detail view ─────────────────────────────────────────────────────────────
  if (view === 'detail' && selectedDrill) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <DrillDetail
          drill={selectedDrill}
          sessions={sessionsForDrill(selectedDrill.id)}
          onStart={() => setShowSession(true)}
          onBack={() => setView(view === 'detail' ? 'browse' : 'home')}
          onDeleteSession={id => { handleDeleteSession(id); }}
        />

        {showSession && (
          <SessionModal
            drill={selectedDrill}
            goals={goals}
            onSave={session => {
              handleSaveSession(session);
              setSaveToast(true);
              setTimeout(() => setSaveToast(false), 2500);
            }}
            onCancel={() => setShowSession(false)}
          />
        )}

        {saveToast && (
          <div style={{
            position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
            backgroundColor: theme.green, color: '#fff',
            padding: '10px 20px', borderRadius: '20px',
            fontSize: '13px', fontWeight: 600, zIndex: 400,
          }}>
            Session saved
          </div>
        )}
      </div>
    );
  }

  // ── Analytics view ──────────────────────────────────────────────────────────
  if (view === 'analytics') {
    return (
      <AnalyticsView
        sessions={sessions}
        drills={drills}
        goals={goals}
        isPro={isPro}
        onUpgrade={onUpgrade}
        onBack={() => setView('home')}
        onDrillSelect={(drill) => { setSelectedDrill(drill); setView('detail'); }}
      />
    );
  }

  return null;
}

// ─── Analytics view ────────────────────────────────────────────────────────────

interface AnalyticsViewProps {
  sessions: DrillSession[];
  drills: ShootingDrill[];
  goals: TrainingGoals | null;
  isPro?: boolean;
  onUpgrade?: (reason?: string) => void;
  onBack: () => void;
  onDrillSelect: (drill: ShootingDrill) => void;
}

function AnalyticsView({ sessions, drills, goals, isPro, onUpgrade, onBack, onDrillSelect }: AnalyticsViewProps) {
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const recent30 = sessions.filter(s => s.timestamp >= thirtyDaysAgo);

  // ── Plateau detection ─────────────────────────────────────────────────────
  interface PlateauResult { drill: ShootingDrill; last5avg: number; prev5avg: number; pctChange: number; }
  const plateaus: PlateauResult[] = [];
  const drillMap = new Map(drills.map(d => [d.id, d]));

  drills.forEach(drill => {
    const ds = sessions
      .filter(s => s.drillId === drill.id && s.totalTimeSeconds != null)
      .sort((a, b) => b.timestamp - a.timestamp);
    if (ds.length < 6) return;
    const last5 = ds.slice(0, 5).map(s => s.totalTimeSeconds!);
    const prev5 = ds.slice(5, 10).map(s => s.totalTimeSeconds!);
    if (!prev5.length) return;
    const last5avg = last5.reduce((a, b) => a + b, 0) / last5.length;
    const prev5avg = prev5.reduce((a, b) => a + b, 0) / prev5.length;
    // For timed drills: lower = better. Improvement = (prev - last) / prev
    const pctChange = (prev5avg - last5avg) / prev5avg;
    if (pctChange < 0.05) {
      plateaus.push({ drill, last5avg, prev5avg, pctChange });
    }
  });

  // ── Skill coverage (last 30 days) ─────────────────────────────────────────
  const skillCounts = new Map<DrillSkillFocus, number>();
  recent30.forEach(s => {
    const drill = drillMap.get(s.drillId);
    drill?.skill_focus.forEach(sf => {
      skillCounts.set(sf, (skillCounts.get(sf) ?? 0) + 1);
    });
  });
  const allSkills = Object.keys(SKILL_LABELS) as DrillSkillFocus[];
  const maxSkillCount = Math.max(1, ...skillCounts.values());

  // ── Mental correlation ────────────────────────────────────────────────────
  const highSleep = sessions.filter(s => s.sleepRating != null && s.sleepRating >= 4 && s.totalTimeSeconds != null);
  const lowSleep  = sessions.filter(s => s.sleepRating != null && s.sleepRating <= 2 && s.totalTimeSeconds != null);
  const highSleepAvg = highSleep.length
    ? highSleep.reduce((sum, s) => sum + s.totalTimeSeconds!, 0) / highSleep.length
    : null;
  const lowSleepAvg = lowSleep.length
    ? lowSleep.reduce((sum, s) => sum + s.totalTimeSeconds!, 0) / lowSleep.length
    : null;

  // ── Gun breakdown ─────────────────────────────────────────────────────────
  const gunCounts = new Map<string, { name: string; count: number }>();
  sessions.forEach(s => {
    const key = s.gunId ?? '__none__';
    const name = s.gunName ?? 'No gun logged';
    const prev = gunCounts.get(key) ?? { name, count: 0 };
    gunCounts.set(key, { name, count: prev.count + 1 });
  });
  const gunBreakdown = [...gunCounts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  async function handleGetAI() {
    if (!isPro) { onUpgrade?.('AI training insights require Pro'); return; }
    setAiLoading(true);
    setAiError(null);
    try {
      const text = await callTrainingInsights(sessions, drills, goals);
      setAiInsights(text);
    } catch {
      setAiError('Could not load AI insights. Try again later.');
    } finally {
      setAiLoading(false);
    }
  }

  const sectionLabel: React.CSSProperties = {
    color: theme.textMuted, fontSize: '11px', letterSpacing: '1px',
    marginBottom: '10px', marginTop: '24px',
  };
  const card: React.CSSProperties = {
    backgroundColor: theme.surface, borderRadius: '10px',
    border: `1px solid ${theme.border}`, padding: '14px 16px', marginBottom: '10px',
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 100px' }}>
      {/* Back */}
      <button onClick={onBack} style={{
        background: 'none', border: 'none', color: theme.textSecondary,
        fontSize: '13px', cursor: 'pointer', padding: '0 0 16px 0',
        display: 'flex', alignItems: 'center', gap: '6px',
      }}>
        ← Back
      </button>

      <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '1.2px', color: theme.textMuted, marginBottom: '4px' }}>
        TRAINING ANALYTICS
      </div>
      <div style={{ color: theme.textPrimary, fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>
        {sessions.length} sessions logged
      </div>

      {/* ── AI Insights ── */}
      <div style={sectionLabel}>AI COACHING INSIGHTS</div>
      {aiInsights ? (
        <div style={{ ...card, borderColor: 'rgba(116,192,252,0.3)' }}>
          <div style={{ color: theme.textSecondary, fontSize: '14px', lineHeight: 1.6 }}>
            {aiInsights}
          </div>
          <button onClick={() => { setAiInsights(null); clearTrainingInsightsCache(); }} style={{
            marginTop: '12px', background: 'none', border: `1px solid ${theme.border}`,
            borderRadius: '6px', padding: '6px 12px',
            color: theme.textMuted, fontSize: '11px', cursor: 'pointer',
          }}>
            REFRESH
          </button>
        </div>
      ) : (
        <div style={card}>
          <div style={{ color: theme.textMuted, fontSize: '13px', marginBottom: '12px' }}>
            Get personalized coaching based on your drill history, patterns, and mental state data.
          </div>
          {aiError && <div style={{ color: theme.red, fontSize: '12px', marginBottom: '10px' }}>{aiError}</div>}
          <button
            onClick={handleGetAI}
            disabled={aiLoading}
            style={{
              width: '100%', padding: '12px',
              backgroundColor: isPro ? '#74c0fc' : theme.surface,
              border: isPro ? 'none' : `1px solid ${theme.border}`,
              borderRadius: '8px', color: isPro ? '#000' : theme.textSecondary,
              fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              opacity: aiLoading ? 0.5 : 1,
            }}
          >
            {aiLoading ? 'Analyzing...' : isPro ? 'GET AI FEEDBACK' : 'GET AI FEEDBACK  \u00b7  PRO'}
          </button>
        </div>
      )}

      {/* ── Plateau detection ── */}
      <div style={sectionLabel}>PLATEAU DETECTION</div>
      {plateaus.length === 0 ? (
        <div style={{ ...card, color: theme.textMuted, fontSize: '13px' }}>
          {sessions.length < 6
            ? 'Log at least 6 sessions on a drill to detect plateaus.'
            : 'No plateaus detected. Keep pushing.'}
        </div>
      ) : (
        plateaus.map(({ drill, last5avg, prev5avg, pctChange }) => (
          <button
            key={drill.id}
            onClick={() => onDrillSelect(drill)}
            style={{ ...card, width: '100%', textAlign: 'left', cursor: 'pointer', borderColor: theme.orange + '66' }}
          >
            <div style={{ color: theme.orange, fontSize: '11px', letterSpacing: '0.8px', fontWeight: 700, marginBottom: '4px' }}>
              PLATEAU DETECTED
            </div>
            <div style={{ color: theme.textPrimary, fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
              {drill.name}
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div>
                <div style={{ color: theme.textMuted, fontSize: '10px' }}>LAST 5 AVG</div>
                <div style={{ fontFamily: 'monospace', color: theme.textSecondary, fontSize: '14px' }}>
                  {formatTime(last5avg)}
                </div>
              </div>
              <div>
                <div style={{ color: theme.textMuted, fontSize: '10px' }}>PRIOR 5 AVG</div>
                <div style={{ fontFamily: 'monospace', color: theme.textSecondary, fontSize: '14px' }}>
                  {formatTime(prev5avg)}
                </div>
              </div>
              <div>
                <div style={{ color: theme.textMuted, fontSize: '10px' }}>CHANGE</div>
                <div style={{ fontFamily: 'monospace', color: pctChange < 0 ? theme.red : theme.textSecondary, fontSize: '14px' }}>
                  {pctChange >= 0 ? '+' : ''}{(pctChange * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </button>
        ))
      )}

      {/* ── Skill coverage ── */}
      <div style={sectionLabel}>SKILL COVERAGE — LAST 30 DAYS</div>
      <div style={card}>
        {allSkills.map(sf => {
          const count = skillCounts.get(sf) ?? 0;
          const pct = count / maxSkillCount;
          return (
            <div key={sf} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{ color: count > 0 ? theme.textSecondary : theme.textMuted, fontSize: '12px' }}>
                  {SKILL_LABELS[sf]}
                </span>
                <span style={{ fontFamily: 'monospace', color: theme.textMuted, fontSize: '11px' }}>
                  {count}
                </span>
              </div>
              <div style={{ height: '4px', backgroundColor: theme.bg, borderRadius: '2px' }}>
                <div style={{
                  height: '100%', borderRadius: '2px',
                  width: `${pct * 100}%`,
                  backgroundColor: count === 0 ? 'transparent' : count === maxSkillCount ? theme.accent : '#74c0fc',
                }} />
              </div>
            </div>
          );
        })}
        {recent30.length === 0 && (
          <div style={{ color: theme.textMuted, fontSize: '13px' }}>No sessions in the last 30 days.</div>
        )}
      </div>

      {/* ── Mental correlation ── */}
      {(highSleep.length > 0 || lowSleep.length > 0) && (
        <>
          <div style={sectionLabel}>SLEEP vs. PERFORMANCE</div>
          <div style={card}>
            <div style={{ color: theme.textMuted, fontSize: '12px', marginBottom: '12px' }}>
              Average time on timed drills by sleep rating
            </div>
            <div style={{ display: 'flex', gap: '24px' }}>
              {highSleepAvg != null && (
                <div>
                  <div style={{ color: theme.green, fontSize: '11px', letterSpacing: '0.5px', marginBottom: '4px' }}>
                    SLEEP 4–5 ({highSleep.length} sessions)
                  </div>
                  <div style={{ fontFamily: 'monospace', color: theme.textPrimary, fontSize: '16px', fontWeight: 700 }}>
                    {formatTime(highSleepAvg)}
                  </div>
                </div>
              )}
              {lowSleepAvg != null && (
                <div>
                  <div style={{ color: theme.red, fontSize: '11px', letterSpacing: '0.5px', marginBottom: '4px' }}>
                    SLEEP 1–2 ({lowSleep.length} sessions)
                  </div>
                  <div style={{ fontFamily: 'monospace', color: theme.textPrimary, fontSize: '16px', fontWeight: 700 }}>
                    {formatTime(lowSleepAvg)}
                  </div>
                </div>
              )}
            </div>
            {highSleepAvg != null && lowSleepAvg != null && (
              <div style={{ marginTop: '10px', color: theme.textMuted, fontSize: '12px' }}>
                {highSleepAvg < lowSleepAvg
                  ? `You run ${formatTime(lowSleepAvg - highSleepAvg)} faster on good sleep.`
                  : 'Sleep rating has not clearly correlated with time yet — keep logging.'}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Gun breakdown ── */}
      {gunBreakdown.length > 0 && (
        <>
          <div style={sectionLabel}>SESSIONS BY GUN</div>
          <div style={card}>
            {gunBreakdown.map(([gunId, { name, count }]) => {
              const pct = count / sessions.length;
              return (
                <div key={gunId} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: theme.textSecondary, fontSize: '13px' }}>{name}</span>
                    <span style={{ fontFamily: 'monospace', color: theme.textMuted, fontSize: '12px' }}>
                      {count} ({Math.round(pct * 100)}%)
                    </span>
                  </div>
                  <div style={{ height: '4px', backgroundColor: theme.bg, borderRadius: '2px' }}>
                    <div style={{
                      height: '100%', borderRadius: '2px',
                      width: `${pct * 100}%`,
                      backgroundColor: theme.accent,
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
