import { useState, useEffect, useCallback } from 'react';
import { theme } from '../../theme';
import { getAllGuns, getAllAmmo, getDrillSessions, getTrainingGoals } from '../../storage';
import { getDrills } from '../../services/drillsService';
import { generateEventTrainingPlan, generateMatchDebrief } from '../../claudeApi';
import {
  getEventPlans, addEventPlan, updateEventPlan, deleteEventPlan,
  getResults, addResult, updateResult, deleteResult,
} from './competitionService';
import type { UserEventPlan, CompetitionResult, Discipline, MatchPriority } from './types';
import {
  ALL_DISCIPLINES, DIVISIONS_BY_DISCIPLINE, DISCIPLINE_SCORE_UNITS,
  CLASSIFIER_DISCIPLINES,
} from './types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string): number {
  const today = new Date().toISOString().split('T')[0];
  return Math.floor(
    (new Date(dateStr + 'T12:00:00').getTime() - new Date(today + 'T12:00:00').getTime()) / 86400000
  );
}

function percentile(placement: number, total: number): number {
  return Math.round((placement / total) * 100);
}

const PRIORITY_COLORS: Record<MatchPriority, string> = {
  A: '#ff6b6b',
  B: theme.accent,
  C: theme.textSecondary,
};

const PRIORITY_LABELS: Record<MatchPriority, string> = {
  A: 'A-Match — Peak performance event',
  B: 'B-Match — Tune-up / practice match',
  C: 'C-Match — Fun / no pressure',
};

const USPSA_CLASSES = [
  { label: 'GM', min: 95, color: '#ffd43b' },
  { label: 'M',  min: 85, color: '#c084fc' },
  { label: 'A',  min: 75, color: '#60a5fa' },
  { label: 'B',  min: 60, color: '#4ade80' },
  { label: 'C',  min: 40, color: '#fb923c' },
  { label: 'D',  min: 0,  color: theme.textSecondary },
];

function uspaClass(pct: number) {
  return USPSA_CLASSES.find(c => pct >= c.min) ?? USPSA_CLASSES[USPSA_CLASSES.length - 1];
}

// ─── Shared style helpers ─────────────────────────────────────────────────────

const fieldStyle: React.CSSProperties = {
  width: '100%', padding: '12px', borderRadius: '8px',
  backgroundColor: theme.bg, border: `1px solid ${theme.border}`,
  color: theme.textPrimary, fontSize: '14px', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  color: theme.textMuted, fontSize: '11px', letterSpacing: '1px',
  display: 'block', marginBottom: '6px',
};

// ─── Priority Badge ───────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: MatchPriority }) {
  return (
    <span style={{
      fontSize: '10px', fontWeight: 800, letterSpacing: '1px',
      color: priority === 'A' ? '#fff' : priority === 'B' ? '#000' : theme.textMuted,
      backgroundColor: PRIORITY_COLORS[priority],
      borderRadius: '4px', padding: '2px 6px',
    }}>
      {priority}
    </span>
  );
}

// ─── Countdown Chip ───────────────────────────────────────────────────────────

function Countdown({ date }: { date: string }) {
  const days = daysUntil(date);
  if (days < 0) return <span style={{ color: theme.textMuted, fontSize: '11px' }}>Past</span>;
  if (days === 0) return <span style={{ color: theme.red, fontSize: '11px', fontWeight: 700 }}>TODAY</span>;
  return (
    <span style={{ fontFamily: 'monospace', fontSize: '11px', color: days <= 14 ? theme.orange : theme.textSecondary }}>
      {days}d
    </span>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────────────

function EventCard({ event, onClick }: { event: UserEventPlan; onClick: () => void }) {
  const days = daysUntil(event.date);
  const isPast = days < 0;
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left',
      backgroundColor: theme.surface,
      border: `1px solid ${isPast ? theme.border : event.priority === 'A' ? 'rgba(255,107,107,0.3)' : theme.border}`,
      borderRadius: '12px', padding: '14px 16px',
      cursor: 'pointer', marginBottom: '10px',
      opacity: isPast ? 0.6 : 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
        <div style={{ flex: 1, paddingRight: '8px' }}>
          <div style={{ color: theme.textPrimary, fontSize: '15px', fontWeight: 700 }}>{event.eventName}</div>
          <div style={{ color: theme.textMuted, fontSize: '12px', marginTop: '2px' }}>
            {event.discipline} · {event.division}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <PriorityBadge priority={event.priority} />
          <Countdown date={event.date} />
        </div>
      </div>
      <div style={{ color: theme.textMuted, fontSize: '12px', fontFamily: 'monospace' }}>
        {event.date}
      </div>
    </button>
  );
}

// ─── Result Card ──────────────────────────────────────────────────────────────

function ResultCard({ result, onClick }: { result: CompetitionResult; onClick: () => void }) {
  const pctile = result.placement && result.totalCompetitors
    ? percentile(result.placement, result.totalCompetitors) : null;
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left',
      backgroundColor: theme.surface,
      border: `1px solid ${theme.border}`,
      borderRadius: '12px', padding: '14px 16px',
      cursor: 'pointer', marginBottom: '10px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ color: theme.textPrimary, fontSize: '15px', fontWeight: 700 }}>{result.eventName}</div>
          <div style={{ color: theme.textMuted, fontSize: '12px', marginTop: '2px' }}>
            {result.discipline} · {result.division} · {result.date}
          </div>
        </div>
        {pctile !== null && (
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontFamily: 'monospace', fontSize: '18px', fontWeight: 800,
              color: pctile <= 25 ? theme.green : pctile <= 50 ? theme.accent : theme.textSecondary,
            }}>
              {result.placement}/{result.totalCompetitors}
            </div>
            <div style={{ color: theme.textMuted, fontSize: '10px' }}>top {pctile}%</div>
          </div>
        )}
      </div>
      {result.score != null && (
        <div style={{ color: theme.textSecondary, fontSize: '12px', fontFamily: 'monospace', marginTop: '6px' }}>
          {result.score} {result.scoreUnit ?? ''}
        </div>
      )}
    </button>
  );
}

// ─── Division Picker ──────────────────────────────────────────────────────────

function DivisionPicker({
  discipline, value, onChange, style,
}: { discipline: Discipline; value: string; onChange: (v: string) => void; style?: React.CSSProperties }) {
  const divisions = DIVISIONS_BY_DISCIPLINE[discipline];
  if (divisions) {
    return (
      <select value={value} onChange={e => onChange(e.target.value)} style={{ ...fieldStyle, ...style }}>
        <option value="">Select division...</option>
        {divisions.map(d => <option key={d} value={d}>{d}</option>)}
      </select>
    );
  }
  return (
    <input
      value={value} onChange={e => onChange(e.target.value)}
      placeholder="e.g. Open, Production"
      style={{ ...fieldStyle, ...style }}
    />
  );
}

// ─── Event Form (Add / Edit) ──────────────────────────────────────────────────

interface EventFormProps {
  initial?: UserEventPlan;
  onSave: (plan: Omit<UserEventPlan, 'id' | 'userId' | 'createdAt'>) => void;
  onCancel: () => void;
  saving?: boolean;
}

function EventForm({ initial, onSave, onCancel, saving }: EventFormProps) {
  const [eventName, setEventName] = useState(initial?.eventName ?? '');
  const [discipline, setDiscipline] = useState<Discipline>(initial?.discipline ?? 'USPSA');
  const [division, setDivision] = useState(initial?.division ?? '');
  const [date, setDate] = useState(initial?.date ?? '');
  const [priority, setPriority] = useState<MatchPriority>(initial?.priority ?? 'B');
  const [stageCount, setStageCount] = useState('');
  const [roundCount, setRoundCount] = useState('');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const guns = getAllGuns().filter(g => g.status === 'Active');
  const [gunId, setGunId] = useState(initial?.gunId ?? '');

  // Reset division when discipline changes (if not initial load)
  function handleDisciplineChange(d: Discipline) {
    setDiscipline(d);
    if (!DIVISIONS_BY_DISCIPLINE[d]) setDivision('');
    else setDivision('');
  }

  function save() {
    if (!eventName.trim() || !date || !division.trim()) return;
    onSave({
      eventId: initial?.eventId,
      eventName: eventName.trim(),
      discipline,
      division: division.trim(),
      date,
      priority,
      gunId: gunId || undefined,
      ammoLotId: initial?.ammoLotId,
      trainingPlan: initial?.trainingPlan,
      trainingPlanReasoning: initial?.trainingPlanReasoning,
      seasonPhase: initial?.seasonPhase,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ color: theme.textPrimary, fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>
        {initial ? 'Edit Match' : 'Add Match'}
      </div>

      <label style={labelStyle}>MATCH NAME *</label>
      <input
        value={eventName} onChange={e => setEventName(e.target.value)}
        placeholder="e.g. Central Valley USPSA Club Match"
        style={{ ...fieldStyle, marginBottom: '14px' }}
      />

      <label style={labelStyle}>DISCIPLINE</label>
      <select
        value={discipline} onChange={e => handleDisciplineChange(e.target.value as Discipline)}
        style={{ ...fieldStyle, marginBottom: '14px' }}
      >
        {ALL_DISCIPLINES.map(d => <option key={d} value={d}>{d}</option>)}
      </select>

      <label style={labelStyle}>DIVISION *</label>
      <DivisionPicker
        discipline={discipline} value={division} onChange={setDivision}
        style={{ marginBottom: '14px' }}
      />

      <label style={labelStyle}>DATE *</label>
      <input
        type="date" value={date} onChange={e => setDate(e.target.value)}
        style={{ ...fieldStyle, marginBottom: '14px' }}
      />

      <label style={labelStyle}>MATCH PRIORITY</label>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
        {(['A', 'B', 'C'] as MatchPriority[]).map(p => (
          <button key={p} onClick={() => setPriority(p)} style={{
            flex: 1, padding: '10px', borderRadius: '8px',
            backgroundColor: priority === p ? PRIORITY_COLORS[p] : theme.bg,
            color: priority === p ? (p === 'B' ? '#000' : p === 'A' ? '#fff' : theme.textMuted) : theme.textSecondary,
            border: `1px solid ${priority === p ? PRIORITY_COLORS[p] : theme.border}`,
            fontSize: '13px', fontWeight: 700, cursor: 'pointer',
          }}>
            {p}
          </button>
        ))}
      </div>
      <div style={{ color: theme.textMuted, fontSize: '11px', marginBottom: '14px' }}>
        {PRIORITY_LABELS[priority]}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
        <div>
          <label style={labelStyle}>STAGES</label>
          <input type="number" value={stageCount} onChange={e => setStageCount(e.target.value)} placeholder="e.g. 6" style={fieldStyle} />
        </div>
        <div>
          <label style={labelStyle}>ROUNDS</label>
          <input type="number" value={roundCount} onChange={e => setRoundCount(e.target.value)} placeholder="e.g. 180" style={fieldStyle} />
        </div>
      </div>

      {guns.length > 0 && (
        <>
          <label style={labelStyle}>GUN (OPTIONAL)</label>
          <select value={gunId} onChange={e => setGunId(e.target.value)} style={{ ...fieldStyle, marginBottom: '14px' }}>
            <option value="">Not specified</option>
            {guns.map(g => <option key={g.id} value={g.id}>{g.make} {g.model}</option>)}
          </select>
        </>
      )}

      <label style={labelStyle}>NOTES</label>
      <textarea
        value={notes} onChange={e => setNotes(e.target.value)}
        rows={2} placeholder="Equipment setup, goals, etc."
        style={{ ...fieldStyle, resize: 'none', fontFamily: 'inherit', marginBottom: '20px' }}
      />

      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={onCancel} style={{
          flex: 1, padding: '14px', borderRadius: '10px',
          backgroundColor: 'transparent', border: `1px solid ${theme.border}`,
          color: theme.textSecondary, fontSize: '14px', cursor: 'pointer',
        }}>Cancel</button>
        <button
          onClick={save}
          disabled={!eventName.trim() || !date || !division.trim() || saving}
          style={{
            flex: 2, padding: '14px', borderRadius: '10px',
            backgroundColor: theme.accent, color: '#000',
            border: 'none', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
            opacity: (!eventName.trim() || !date || !division.trim() || saving) ? 0.4 : 1,
          }}
        >
          {saving ? 'Saving...' : 'SAVE MATCH'}
        </button>
      </div>
    </div>
  );
}

// ─── Event Detail ─────────────────────────────────────────────────────────────

interface EventDetailProps {
  event: UserEventPlan;
  results: CompetitionResult[];
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPlanSaved: (planText: string) => void;
  onLogResult: () => void;
}

function EventDetail({ event, results, onBack, onEdit, onDelete, onPlanSaved, onLogResult }: EventDetailProps) {
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [planError, setPlanError] = useState('');
  const days = daysUntil(event.date);
  const isPast = days < 0;
  const planText = typeof event.trainingPlan === 'string' ? event.trainingPlan : '';
  const eventResults = results.filter(r => r.eventId === event.eventId || r.eventName === event.eventName);

  async function handleGeneratePlan() {
    setLoadingPlan(true);
    setPlanError('');
    try {
      const [sessions, drills, goals] = await Promise.all([
        Promise.resolve(getDrillSessions()),
        getDrills(),
        Promise.resolve(getTrainingGoals()),
      ]);
      // Cast to satisfy claudeApi's expected shape — all required fields are present on UserEventPlan
      const eventForApi = {
        name: event.eventName,
        discipline: event.discipline,
        division: event.division,
        date: event.date,
        priority: event.priority,
        stageCount: undefined as number | undefined,
        roundCount: undefined as number | undefined,
      };
      const text = await generateEventTrainingPlan(eventForApi as any, sessions, drills, goals);
      onPlanSaved(text);
    } catch (e: any) {
      setPlanError(e.message ?? 'Failed to generate plan');
    }
    setLoadingPlan(false);
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ padding: '16px 20px 0' }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: theme.accent,
          fontSize: '13px', cursor: 'pointer', padding: 0, marginBottom: '12px',
        }}>← Back</button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div>
            <div style={{ color: theme.textPrimary, fontSize: '22px', fontWeight: 800 }}>{event.eventName}</div>
            <div style={{ color: theme.textMuted, fontSize: '13px', marginTop: '4px' }}>
              {event.discipline} · {event.division}
            </div>
          </div>
          <PriorityBadge priority={event.priority} />
        </div>

        <div style={{
          backgroundColor: theme.surface, borderRadius: '10px',
          padding: '12px 14px', marginBottom: '16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          border: `1px solid ${theme.border}`,
        }}>
          <div>
            <div style={{ color: theme.textMuted, fontSize: '10px', letterSpacing: '1px' }}>DATE</div>
            <div style={{ color: theme.textPrimary, fontFamily: 'monospace', fontSize: '16px', fontWeight: 700 }}>{event.date}</div>
          </div>
          {!isPast ? (
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontFamily: 'monospace', fontSize: '32px', fontWeight: 800,
                color: days <= 7 ? theme.red : days <= 21 ? theme.orange : theme.accent,
              }}>{days}d</div>
              <div style={{ color: theme.textMuted, fontSize: '10px' }}>until match</div>
            </div>
          ) : (
            <div style={{ color: theme.textMuted, fontSize: '13px' }}>Past</div>
          )}
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Training Plan */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ color: theme.textMuted, fontSize: '11px', letterSpacing: '1px' }}>TRAINING PLAN</div>
            {!isPast && (
              <button onClick={handleGeneratePlan} disabled={loadingPlan} style={{
                background: 'none', border: `1px solid ${theme.accent}`,
                borderRadius: '6px', padding: '4px 10px',
                color: theme.accent, fontSize: '11px', cursor: 'pointer',
                opacity: loadingPlan ? 0.5 : 1,
              }}>
                {loadingPlan ? 'Generating...' : planText ? 'Regenerate' : 'Generate AI Plan'}
              </button>
            )}
          </div>
          {planError && <div style={{ color: theme.red, fontSize: '12px', marginBottom: '8px' }}>{planError}</div>}
          {planText ? (
            <div style={{
              backgroundColor: theme.bg, borderRadius: '10px',
              padding: '14px', border: `1px solid ${theme.border}`,
              color: theme.textSecondary, fontSize: '13px', lineHeight: 1.7, whiteSpace: 'pre-wrap',
            }}>
              {planText}
            </div>
          ) : (
            <div style={{
              backgroundColor: theme.bg, borderRadius: '10px',
              padding: '14px', border: `1px dashed ${theme.border}`,
              color: theme.textMuted, fontSize: '13px', textAlign: 'center',
            }}>
              {isPast ? 'No training plan recorded.' : 'No training plan yet. Generate one with AI.'}
            </div>
          )}
        </div>

        {/* Event results */}
        {eventResults.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ color: theme.textMuted, fontSize: '11px', letterSpacing: '1px', marginBottom: '10px' }}>RESULTS</div>
            {eventResults.map(r => (
              <div key={r.id} style={{
                backgroundColor: theme.bg, borderRadius: '8px',
                padding: '12px', border: `1px solid ${theme.border}`, marginBottom: '8px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ color: theme.textPrimary, fontSize: '13px', fontWeight: 600 }}>
                    {r.placement && r.totalCompetitors
                      ? `${r.placement}/${r.totalCompetitors} (top ${percentile(r.placement, r.totalCompetitors)}%)`
                      : r.placement ? `${r.placement}th` : 'Placement not recorded'}
                  </div>
                  {r.score != null && (
                    <div style={{ fontFamily: 'monospace', color: theme.textSecondary, fontSize: '12px' }}>
                      {r.score} {r.scoreUnit ?? ''}
                    </div>
                  )}
                </div>
                {r.aiDebrief && (
                  <div style={{ color: theme.textMuted, fontSize: '12px', marginTop: '8px', lineHeight: 1.6 }}>
                    {r.aiDebrief.slice(0, 200)}{r.aiDebrief.length > 200 ? '...' : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {event.notes && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ color: theme.textMuted, fontSize: '11px', letterSpacing: '1px', marginBottom: '8px' }}>NOTES</div>
            <div style={{ color: theme.textSecondary, fontSize: '13px', lineHeight: 1.6 }}>{event.notes}</div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
          <button onClick={onLogResult} style={{
            width: '100%', padding: '16px',
            backgroundColor: theme.accent, color: '#000',
            border: 'none', borderRadius: '10px',
            fontSize: '15px', fontWeight: 700, cursor: 'pointer',
          }}>
            LOG RESULT
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onEdit} style={{
              flex: 1, padding: '12px', borderRadius: '8px',
              backgroundColor: 'transparent', border: `1px solid ${theme.border}`,
              color: theme.textSecondary, fontSize: '13px', cursor: 'pointer',
            }}>Edit</button>
            <button onClick={onDelete} style={{
              flex: 1, padding: '12px', borderRadius: '8px',
              backgroundColor: 'transparent', border: `1px solid ${theme.border}`,
              color: theme.red, fontSize: '13px', cursor: 'pointer',
            }}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Result Form ──────────────────────────────────────────────────────────────

interface ResultFormProps {
  event?: UserEventPlan;
  initial?: CompetitionResult;
  onSave: (r: Omit<CompetitionResult, 'id' | 'userId' | 'createdAt'>) => void;
  onCancel: () => void;
  saving?: boolean;
}

function ResultForm({ event, initial, onSave, onCancel, saving }: ResultFormProps) {
  const [eventName, setEventName] = useState(initial?.eventName ?? event?.eventName ?? '');
  const [discipline, setDiscipline] = useState<Discipline>(initial?.discipline ?? event?.discipline ?? 'USPSA');
  const [division, setDivision] = useState(initial?.division ?? event?.division ?? '');
  const [date, setDate] = useState(initial?.date ?? event?.date ?? '');
  const [placement, setPlacement] = useState(initial?.placement?.toString() ?? '');
  const [total, setTotal] = useState(initial?.totalCompetitors?.toString() ?? '');
  const [score, setScore] = useState(initial?.score?.toString() ?? '');
  const [classifierScore, setClassifierScore] = useState(initial?.classifierScore?.toString() ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [generatingDebrief, setGeneratingDebrief] = useState(false);
  const guns = getAllGuns().filter(g => g.status === 'Active');
  const ammoLots = getAllAmmo().filter(a => a.quantity > 0);
  const [gunId, setGunId] = useState(initial?.gunId ?? event?.gunId ?? '');
  const [ammoLotId, setAmmoLotId] = useState(initial?.ammoLotId ?? event?.ammoLotId ?? '');

  const scoreUnit = DISCIPLINE_SCORE_UNITS[discipline];
  const showClassifier = CLASSIFIER_DISCIPLINES.includes(discipline);
  const canSave = !!eventName.trim() && !!date && !!division.trim();

  async function handleSave(withDebrief = false) {
    if (!canSave) return;
    const result: Omit<CompetitionResult, 'id' | 'userId' | 'createdAt'> = {
      eventId: initial?.eventId ?? event?.eventId,
      eventName: eventName.trim(),
      discipline,
      division: division.trim(),
      date,
      placement: placement ? parseInt(placement) : undefined,
      totalCompetitors: total ? parseInt(total) : undefined,
      score: score ? parseFloat(score) : undefined,
      scoreUnit,
      gunId: gunId || undefined,
      ammoLotId: ammoLotId || undefined,
      classifierScore: classifierScore ? parseFloat(classifierScore) : undefined,
      notes: notes.trim() || undefined,
    };

    if (withDebrief) {
      setGeneratingDebrief(true);
      try {
        const debrief = await generateMatchDebrief(result as CompetitionResult, notes);
        (result as any).aiDebrief = debrief;
      } catch { /* save without debrief */ }
      setGeneratingDebrief(false);
    }

    onSave(result);
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ color: theme.textPrimary, fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Log Result</div>

      <label style={labelStyle}>MATCH NAME *</label>
      <input value={eventName} onChange={e => setEventName(e.target.value)} style={{ ...fieldStyle, marginBottom: '14px' }} />

      <label style={labelStyle}>DISCIPLINE</label>
      <select value={discipline} onChange={e => setDiscipline(e.target.value as Discipline)} style={{ ...fieldStyle, marginBottom: '14px' }}>
        {ALL_DISCIPLINES.map(d => <option key={d} value={d}>{d}</option>)}
      </select>

      <label style={labelStyle}>DIVISION *</label>
      <DivisionPicker discipline={discipline} value={division} onChange={setDivision} style={{ marginBottom: '14px' }} />

      <label style={labelStyle}>DATE *</label>
      <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...fieldStyle, marginBottom: '14px' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
        <div>
          <label style={labelStyle}>YOUR PLACE</label>
          <input type="number" value={placement} onChange={e => setPlacement(e.target.value)} placeholder="e.g. 7" style={fieldStyle} />
        </div>
        <div>
          <label style={labelStyle}>TOTAL COMPETITORS</label>
          <input type="number" value={total} onChange={e => setTotal(e.target.value)} placeholder="e.g. 34" style={fieldStyle} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '14px' }}>
        <div>
          <label style={labelStyle}>SCORE</label>
          <input type="number" value={score} onChange={e => setScore(e.target.value)} placeholder="e.g. 4.87" style={fieldStyle} />
        </div>
        <div>
          <label style={labelStyle}>UNIT</label>
          <div style={{
            ...fieldStyle, display: 'flex', alignItems: 'center',
            color: theme.textMuted, fontFamily: 'monospace',
          }}>
            {scoreUnit}
          </div>
        </div>
      </div>

      {guns.length > 0 && (
        <>
          <label style={labelStyle}>GUN USED</label>
          <select value={gunId} onChange={e => setGunId(e.target.value)} style={{ ...fieldStyle, marginBottom: '14px' }}>
            <option value="">Not specified</option>
            {guns.map(g => <option key={g.id} value={g.id}>{g.make} {g.model}</option>)}
          </select>
        </>
      )}

      {ammoLots.length > 0 && (
        <>
          <label style={labelStyle}>AMMO USED</label>
          <select value={ammoLotId} onChange={e => setAmmoLotId(e.target.value)} style={{ ...fieldStyle, marginBottom: '14px' }}>
            <option value="">Not specified</option>
            {ammoLots.map(a => (
              <option key={a.id} value={a.id}>
                {a.brand} {a.name} {a.grain ? `${a.grain}gr` : ''} ({a.caliber})
              </option>
            ))}
          </select>
        </>
      )}

      <label style={labelStyle}>NOTES</label>
      <textarea
        value={notes} onChange={e => setNotes(e.target.value)} rows={3}
        placeholder="How did it go? What happened? These feed into the AI debrief."
        style={{ ...fieldStyle, resize: 'none', fontFamily: 'inherit', marginBottom: '14px' }}
      />

      <button onClick={() => setShowAdvanced(v => !v)} style={{
        background: 'none', border: 'none', color: theme.accent,
        fontSize: '13px', cursor: 'pointer', padding: 0, marginBottom: '14px',
      }}>
        {showAdvanced ? '▼' : '▶'} Advanced (enables deeper AI analysis)
      </button>

      {showAdvanced && (
        <div style={{
          backgroundColor: theme.bg, borderRadius: '10px',
          padding: '14px', border: `1px solid ${theme.border}`, marginBottom: '14px',
        }}>
          {showClassifier && (
            <>
              <label style={labelStyle}>CLASSIFIER SCORE (%)</label>
              <input
                type="number" value={classifierScore} onChange={e => setClassifierScore(e.target.value)}
                placeholder="e.g. 72.4"
                style={{ ...fieldStyle, marginBottom: '10px' }}
              />
            </>
          )}
          <div style={{ color: theme.textMuted, fontSize: '12px', lineHeight: 1.6 }}>
            Stage-by-stage breakdown: add any stage notes above.
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={onCancel} style={{
          flex: 1, padding: '14px', borderRadius: '10px',
          backgroundColor: 'transparent', border: `1px solid ${theme.border}`,
          color: theme.textSecondary, fontSize: '13px', cursor: 'pointer',
        }}>Cancel</button>
        <button onClick={() => handleSave(false)} disabled={!canSave || saving} style={{
          flex: 1, padding: '14px', borderRadius: '10px',
          backgroundColor: theme.surface, border: `1px solid ${theme.border}`,
          color: theme.textSecondary, fontSize: '13px', fontWeight: 600,
          cursor: 'pointer', opacity: (!canSave || saving) ? 0.4 : 1,
        }}>Save</button>
        <button onClick={() => handleSave(true)} disabled={!canSave || generatingDebrief || saving} style={{
          flex: 2, padding: '14px', borderRadius: '10px',
          backgroundColor: theme.accent, color: '#000',
          border: 'none', fontSize: '13px', fontWeight: 700,
          cursor: 'pointer', opacity: (!canSave || generatingDebrief || saving) ? 0.5 : 1,
        }}>
          {generatingDebrief ? 'Getting debrief...' : 'Save + AI Debrief'}
        </button>
      </div>
    </div>
  );
}

// ─── Result Detail ────────────────────────────────────────────────────────────

interface ResultDetailProps {
  result: CompetitionResult;
  onBack: () => void;
  onDelete: () => void;
  onDebriefSaved: (text: string) => void;
}

function ResultDetail({ result, onBack, onDelete, onDebriefSaved }: ResultDetailProps) {
  const [generatingDebrief, setGeneratingDebrief] = useState(false);
  const [debrief, setDebrief] = useState(result.aiDebrief ?? '');
  const [debriefNotes, setDebriefNotes] = useState('');
  const pctile = result.placement && result.totalCompetitors
    ? percentile(result.placement, result.totalCompetitors) : null;

  async function handleDebrief() {
    setGeneratingDebrief(true);
    try {
      const text = await generateMatchDebrief(result, debriefNotes);
      setDebrief(text);
      onDebriefSaved(text);
    } catch { /* ignore */ }
    setGeneratingDebrief(false);
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ padding: '16px 20px 0' }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: theme.accent,
          fontSize: '13px', cursor: 'pointer', padding: 0, marginBottom: '12px',
        }}>← Back</button>
        <div style={{ color: theme.textPrimary, fontSize: '22px', fontWeight: 800, marginBottom: '4px' }}>{result.eventName}</div>
        <div style={{ color: theme.textMuted, fontSize: '13px', marginBottom: '16px' }}>
          {result.discipline} · {result.division} · {result.date}
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: pctile !== null ? '1fr 1fr' : '1fr', gap: '10px', marginBottom: '20px' }}>
          {pctile !== null && (
            <div style={{ backgroundColor: theme.surface, borderRadius: '10px', padding: '14px', border: `1px solid ${theme.border}` }}>
              <div style={{ color: theme.textMuted, fontSize: '10px', letterSpacing: '1px' }}>PLACEMENT</div>
              <div style={{
                fontFamily: 'monospace', fontSize: '24px', fontWeight: 800,
                color: pctile <= 25 ? theme.green : pctile <= 50 ? theme.accent : theme.textSecondary,
              }}>
                {result.placement}/{result.totalCompetitors}
              </div>
              <div style={{ color: theme.textMuted, fontSize: '11px' }}>top {pctile}%</div>
            </div>
          )}
          {result.score != null && (
            <div style={{ backgroundColor: theme.surface, borderRadius: '10px', padding: '14px', border: `1px solid ${theme.border}` }}>
              <div style={{ color: theme.textMuted, fontSize: '10px', letterSpacing: '1px' }}>SCORE</div>
              <div style={{ fontFamily: 'monospace', fontSize: '24px', fontWeight: 800, color: theme.textPrimary }}>
                {result.score}
              </div>
              {result.scoreUnit && <div style={{ color: theme.textMuted, fontSize: '11px' }}>{result.scoreUnit}</div>}
            </div>
          )}
        </div>

        {result.classifierScore != null && (
          <div style={{
            backgroundColor: theme.surface, borderRadius: '10px', padding: '14px',
            border: `1px solid ${theme.border}`, marginBottom: '20px',
          }}>
            <div style={{ color: theme.textMuted, fontSize: '10px', letterSpacing: '1px', marginBottom: '6px' }}>CLASSIFIER SCORE</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '28px', fontWeight: 800, color: theme.accent }}>
                {result.classifierScore}%
              </span>
              <span style={{ fontSize: '16px', fontWeight: 700, color: uspaClass(result.classifierScore).color }}>
                {uspaClass(result.classifierScore).label}
              </span>
            </div>
          </div>
        )}

        {/* AI Debrief */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ color: theme.textMuted, fontSize: '11px', letterSpacing: '1px', marginBottom: '10px' }}>AI DEBRIEF</div>
          {!debrief && !generatingDebrief && (
            <>
              <textarea
                value={debriefNotes} onChange={e => setDebriefNotes(e.target.value)}
                rows={2}
                placeholder="Add context for the AI (what went well, what didn't)..."
                style={{
                  ...fieldStyle, resize: 'none', fontFamily: 'inherit', marginBottom: '8px',
                }}
              />
              <button onClick={handleDebrief} style={{
                width: '100%', padding: '12px', borderRadius: '8px',
                backgroundColor: theme.accent, color: '#000',
                border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              }}>
                Generate AI Debrief
              </button>
            </>
          )}
          {generatingDebrief && (
            <div style={{ color: theme.textMuted, fontSize: '13px', padding: '14px', textAlign: 'center' }}>
              Generating debrief...
            </div>
          )}
          {debrief && (
            <div style={{
              backgroundColor: theme.bg, borderRadius: '10px',
              padding: '14px', border: `1px solid ${theme.border}`,
              color: theme.textSecondary, fontSize: '13px', lineHeight: 1.7, whiteSpace: 'pre-wrap',
            }}>
              {debrief}
            </div>
          )}
        </div>

        {result.notes && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ color: theme.textMuted, fontSize: '11px', letterSpacing: '1px', marginBottom: '8px' }}>YOUR NOTES</div>
            <div style={{ color: theme.textSecondary, fontSize: '13px', lineHeight: 1.6 }}>{result.notes}</div>
          </div>
        )}

        <button onClick={onDelete} style={{
          width: '100%', padding: '12px', borderRadius: '8px',
          backgroundColor: 'transparent', border: `1px solid ${theme.border}`,
          color: theme.red, fontSize: '13px', cursor: 'pointer', marginBottom: '32px',
        }}>Delete Result</button>
      </div>
    </div>
  );
}

// ─── Classifier Progress ──────────────────────────────────────────────────────

function ClassifierProgress({ results, onBack }: { results: CompetitionResult[]; onBack: () => void }) {
  const uspsa = results.filter(r => r.discipline === 'USPSA' && r.classifierScore != null)
    .sort((a, b) => b.date.localeCompare(a.date));
  const latestPct = uspsa.length > 0 ? uspsa[0].classifierScore! : null;
  const peakPct = uspsa.length > 0
    ? Math.max(...uspsa.map(r => r.classifierScore!)) : null;
  const currentClass = peakPct !== null ? uspaClass(peakPct) : null;
  const nextClass = peakPct !== null
    ? USPSA_CLASSES.find(c => c.min > peakPct) ?? null : null;

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ padding: '12px 20px', borderBottom: `1px solid ${theme.border}` }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: theme.accent,
          fontSize: '13px', cursor: 'pointer', padding: 0,
        }}>← Back</button>
      </div>

      <div style={{ padding: '16px 20px' }}>
        <div style={{ color: theme.textMuted, fontSize: '11px', letterSpacing: '1px', marginBottom: '16px' }}>CLASSIFIER PROGRESS</div>

        {currentClass && peakPct !== null ? (
          <div style={{
            backgroundColor: theme.surface, borderRadius: '12px',
            padding: '16px', border: `1px solid ${theme.border}`, marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
              <div>
                <div style={{ color: theme.textMuted, fontSize: '10px', letterSpacing: '1px' }}>CURRENT CLASS</div>
                <div style={{ fontSize: '40px', fontWeight: 800, color: currentClass.color, fontFamily: 'monospace' }}>
                  {currentClass.label}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: theme.textMuted, fontSize: '10px', letterSpacing: '1px' }}>PEAK PCT</div>
                <div style={{ fontFamily: 'monospace', fontSize: '24px', fontWeight: 700, color: theme.textPrimary }}>
                  {peakPct.toFixed(1)}%
                </div>
              </div>
            </div>

            {nextClass && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: theme.textMuted }}>To {nextClass.label}</span>
                  <span style={{ fontSize: '11px', color: theme.textMuted, fontFamily: 'monospace' }}>
                    +{(nextClass.min - peakPct).toFixed(1)}%
                  </span>
                </div>
                <div style={{ height: '6px', backgroundColor: theme.bg, borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '3px', backgroundColor: currentClass.color,
                    width: `${Math.min(100, ((peakPct - currentClass.min) / (nextClass.min - currentClass.min)) * 100)}%`,
                    transition: 'width 0.3s',
                  }} />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
              {[...USPSA_CLASSES].reverse().map(c => (
                <div key={c.label} style={{
                  flex: 1, textAlign: 'center', padding: '6px 2px', borderRadius: '6px',
                  backgroundColor: currentClass.label === c.label ? c.color : 'transparent',
                  border: `1px solid ${currentClass.label === c.label ? c.color : theme.border}`,
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: currentClass.label === c.label ? '#000' : c.color }}>
                    {c.label}
                  </div>
                  <div style={{ fontSize: '9px', color: theme.textMuted }}>{c.min}%</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{
            backgroundColor: theme.surface, borderRadius: '12px',
            padding: '20px', border: `1px dashed ${theme.border}`,
            textAlign: 'center', color: theme.textMuted, fontSize: '13px', marginBottom: '16px',
          }}>
            No USPSA classifier scores yet. Log a result with a classifier score to track progress.
          </div>
        )}

        {uspsa.length > 0 && (
          <div>
            <div style={{ color: theme.textMuted, fontSize: '11px', letterSpacing: '1px', marginBottom: '10px' }}>HISTORY</div>
            {uspsa.map(r => (
              <div key={r.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 0', borderBottom: `1px solid ${theme.border}`,
              }}>
                <div>
                  <div style={{ color: theme.textPrimary, fontSize: '13px', fontWeight: 600 }}>{r.eventName}</div>
                  <div style={{ color: theme.textMuted, fontSize: '11px' }}>{r.date} · {r.division}</div>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 700, color: uspaClass(r.classifierScore!).color }}>
                  {r.classifierScore!.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── First Match Flow ─────────────────────────────────────────────────────────

function FirstMatchFlow({ onAddMatch, onLogResult }: { onAddMatch: () => void; onLogResult: () => void }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>—</div>
        <div style={{ color: theme.textPrimary, fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>
          Start Your Competition Journey
        </div>
        <div style={{ color: theme.textMuted, fontSize: '14px', lineHeight: 1.7, maxWidth: '280px', margin: '0 auto' }}>
          Track upcoming matches, log results, and get AI-powered debrief and training plans.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
        <button onClick={onAddMatch} style={{
          width: '100%', padding: '20px', borderRadius: '12px',
          backgroundColor: theme.accent, color: '#000',
          border: 'none', textAlign: 'left', cursor: 'pointer',
        }}>
          <div style={{ fontSize: '15px', fontWeight: 800, marginBottom: '4px' }}>Plan an Upcoming Match</div>
          <div style={{ fontSize: '13px', opacity: 0.7 }}>Add a match to your calendar, set priority, get an AI training plan</div>
        </button>

        <button onClick={onLogResult} style={{
          width: '100%', padding: '20px', borderRadius: '12px',
          backgroundColor: theme.surface, color: theme.textPrimary,
          border: `1px solid ${theme.border}`, textAlign: 'left', cursor: 'pointer',
        }}>
          <div style={{ fontSize: '15px', fontWeight: 800, marginBottom: '4px' }}>Log a Past Result</div>
          <div style={{ fontSize: '13px', color: theme.textMuted }}>Already shot a match? Log the result and get an AI debrief</div>
        </button>
      </div>

      <div style={{
        backgroundColor: theme.surface, borderRadius: '12px',
        padding: '16px', border: `1px solid ${theme.border}`,
      }}>
        <div style={{ color: theme.textMuted, fontSize: '11px', letterSpacing: '1px', marginBottom: '10px' }}>HOW IT WORKS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            ['Plan', 'Add upcoming matches with A/B/C priority. Get an AI training plan built around your schedule.'],
            ['Compete', 'Log results including placement, score, and what happened on the stages.'],
            ['Debrief', 'Get an AI debrief with specific things that went well and what to work on next.'],
            ['Progress', 'Track your classifier scores and watch your class improve over time.'],
          ].map(([title, desc]) => (
            <div key={title} style={{ display: 'flex', gap: '12px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                backgroundColor: theme.accentDim, border: `1px solid ${theme.accent}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                color: theme.accent, fontSize: '11px', fontWeight: 700,
              }}>
                {title[0]}
              </div>
              <div>
                <div style={{ color: theme.textPrimary, fontSize: '13px', fontWeight: 600 }}>{title}</div>
                <div style={{ color: theme.textMuted, fontSize: '12px', lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({
  events, results, loading,
  onEventClick, onResultClick, onAddEvent, onAddResult, onClassifier,
}: {
  events: UserEventPlan[];
  results: CompetitionResult[];
  loading: boolean;
  onEventClick: (e: UserEventPlan) => void;
  onResultClick: (r: CompetitionResult) => void;
  onAddEvent: () => void;
  onAddResult: () => void;
  onClassifier: () => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const upcoming = events.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const past = events.filter(e => e.date < today).sort((a, b) => b.date.localeCompare(a.date));
  const recentResults = results.slice(0, 5);

  const placements = results.filter(r => r.placement && r.totalCompetitors);
  const avgPctile = placements.length
    ? Math.round(placements.reduce((sum, r) => sum + percentile(r.placement!, r.totalCompetitors!), 0) / placements.length)
    : null;
  const aMatches = events.filter(e => e.priority === 'A').length;

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: theme.textMuted, fontSize: '14px' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
      {/* Stats row */}
      {results.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '20px' }}>
          <div style={{ backgroundColor: theme.surface, borderRadius: '8px', padding: '10px 12px', border: `1px solid ${theme.border}`, textAlign: 'center' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '22px', fontWeight: 800, color: theme.textPrimary }}>{results.length}</div>
            <div style={{ color: theme.textMuted, fontSize: '10px' }}>matches</div>
          </div>
          <div style={{ backgroundColor: theme.surface, borderRadius: '8px', padding: '10px 12px', border: `1px solid ${theme.border}`, textAlign: 'center' }}>
            <div style={{
              fontFamily: 'monospace', fontSize: '22px', fontWeight: 800,
              color: avgPctile !== null && avgPctile <= 33 ? theme.green : theme.textPrimary,
            }}>
              {avgPctile !== null ? `${avgPctile}%` : '—'}
            </div>
            <div style={{ color: theme.textMuted, fontSize: '10px' }}>avg place</div>
          </div>
          <div style={{ backgroundColor: theme.surface, borderRadius: '8px', padding: '10px 12px', border: `1px solid ${theme.border}`, textAlign: 'center' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '22px', fontWeight: 800, color: PRIORITY_COLORS['A'] }}>{aMatches}</div>
            <div style={{ color: theme.textMuted, fontSize: '10px' }}>A-matches</div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
        <button onClick={onAddEvent} style={{
          padding: '14px', borderRadius: '10px',
          backgroundColor: theme.accent, color: '#000',
          border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
        }}>+ Add Match</button>
        <button onClick={onClassifier} style={{
          padding: '14px', borderRadius: '10px',
          backgroundColor: theme.surface, color: theme.textSecondary,
          border: `1px solid ${theme.border}`, fontSize: '13px', cursor: 'pointer',
        }}>Classifiers</button>
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 ? (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ color: theme.textMuted, fontSize: '11px', letterSpacing: '1px', marginBottom: '10px' }}>UPCOMING</div>
          {upcoming.map(e => <EventCard key={e.id} event={e} onClick={() => onEventClick(e)} />)}
        </div>
      ) : (
        <div style={{
          backgroundColor: theme.surface, borderRadius: '12px',
          padding: '20px', border: `1px dashed ${theme.border}`,
          textAlign: 'center', color: theme.textMuted, fontSize: '13px', marginBottom: '24px',
        }}>
          No upcoming matches. Add one to start planning.
        </div>
      )}

      {/* Recent results */}
      {recentResults.length > 0 ? (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ color: theme.textMuted, fontSize: '11px', letterSpacing: '1px' }}>RECENT RESULTS</div>
            <button onClick={onAddResult} style={{
              background: 'none', border: 'none', color: theme.accent, fontSize: '12px', cursor: 'pointer',
            }}>+ Log result</button>
          </div>
          {recentResults.map(r => <ResultCard key={r.id} result={r} onClick={() => onResultClick(r)} />)}
        </div>
      ) : (
        <button onClick={onAddResult} style={{
          width: '100%', padding: '14px',
          backgroundColor: 'transparent', border: `1px dashed ${theme.border}`,
          borderRadius: '10px', color: theme.textSecondary,
          fontSize: '13px', cursor: 'pointer', marginBottom: '24px',
        }}>
          + Log a match result
        </button>
      )}

      {/* Past matches */}
      {past.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <div style={{ color: theme.textMuted, fontSize: '11px', letterSpacing: '1px', marginBottom: '10px' }}>PAST MATCHES</div>
          {past.slice(0, 5).map(e => <EventCard key={e.id} event={e} onClick={() => onEventClick(e)} />)}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type CompView =
  | 'dashboard' | 'first-match'
  | 'event-detail' | 'add-event' | 'edit-event'
  | 'result-detail' | 'add-result'
  | 'classifier';

export function CompetitionTracker({ isPro }: { isPro?: boolean }) {
  const [view, setView] = useState<CompView>('dashboard');
  const [events, setEvents] = useState<UserEventPlan[]>([]);
  const [results, setResults] = useState<CompetitionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<UserEventPlan | null>(null);
  const [selectedResult, setSelectedResult] = useState<CompetitionResult | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [plans, res] = await Promise.all([getEventPlans(), getResults()]);
      setEvents(plans);
      setResults(res);
      if (plans.length === 0 && res.length === 0) setView('first-match');
    } catch (e) {
      console.error('CompetitionTracker load error:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Event mutations ──

  async function handleSaveEvent(planData: Omit<UserEventPlan, 'id' | 'userId' | 'createdAt'>) {
    setSaving(true);
    try {
      if (selectedEvent) {
        await updateEventPlan(selectedEvent.id, planData);
      } else {
        await addEventPlan(planData);
      }
      await loadAll();
      setView(selectedEvent ? 'event-detail' : 'dashboard');
      if (selectedEvent) {
        const updated = events.find(e => e.id === selectedEvent.id);
        if (updated) setSelectedEvent({ ...updated, ...planData });
      }
    } catch (e: any) {
      alert(e.message ?? 'Failed to save match');
    }
    setSaving(false);
  }

  async function handleDeleteEvent(id: string) {
    setSaving(true);
    try {
      await deleteEventPlan(id);
      await loadAll();
      setView('dashboard');
      setSelectedEvent(null);
    } catch (e: any) {
      alert(e.message ?? 'Failed to delete match');
    }
    setSaving(false);
  }

  async function handlePlanSaved(planText: string) {
    if (!selectedEvent) return;
    try {
      await updateEventPlan(selectedEvent.id, { trainingPlan: planText as any });
      setSelectedEvent(prev => prev ? { ...prev, trainingPlan: planText as any } : prev);
      setEvents(prev => prev.map(e => e.id === selectedEvent.id ? { ...e, trainingPlan: planText as any } : e));
    } catch { /* non-critical */ }
  }

  // ── Result mutations ──

  async function handleSaveResult(resultData: Omit<CompetitionResult, 'id' | 'userId' | 'createdAt'>) {
    setSaving(true);
    try {
      const saved = await addResult(resultData);
      await loadAll();
      setSelectedResult(saved);
      setView('result-detail');
    } catch (e: any) {
      alert(e.message ?? 'Failed to save result');
    }
    setSaving(false);
  }

  async function handleDeleteResult(id: string) {
    setSaving(true);
    try {
      await deleteResult(id);
      await loadAll();
      setView('dashboard');
      setSelectedResult(null);
    } catch (e: any) {
      alert(e.message ?? 'Failed to delete result');
    }
    setSaving(false);
  }

  async function handleDebriefSaved(text: string) {
    if (!selectedResult) return;
    try {
      await updateResult(selectedResult.id, { aiDebrief: text });
      setSelectedResult(prev => prev ? { ...prev, aiDebrief: text } : prev);
    } catch { /* non-critical */ }
  }

  // ── Routing ──

  if (view === 'classifier') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <ClassifierProgress results={results} onBack={() => setView('dashboard')} />
      </div>
    );
  }

  if (view === 'first-match') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <FirstMatchFlow
          onAddMatch={() => { setSelectedEvent(null); setView('add-event'); }}
          onLogResult={() => { setSelectedEvent(null); setView('add-result'); }}
        />
      </div>
    );
  }

  if (view === 'add-event' || view === 'edit-event') {
    return (
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <EventForm
          initial={view === 'edit-event' ? selectedEvent ?? undefined : undefined}
          onSave={handleSaveEvent}
          onCancel={() => setView(selectedEvent ? 'event-detail' : 'dashboard')}
          saving={saving}
        />
      </div>
    );
  }

  if (view === 'add-result') {
    return (
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <ResultForm
          event={selectedEvent ?? undefined}
          onSave={handleSaveResult}
          onCancel={() => setView(selectedEvent ? 'event-detail' : 'dashboard')}
          saving={saving}
        />
      </div>
    );
  }

  if (view === 'event-detail' && selectedEvent) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <EventDetail
          event={selectedEvent}
          results={results}
          onBack={() => setView('dashboard')}
          onEdit={() => setView('edit-event')}
          onDelete={() => handleDeleteEvent(selectedEvent.id)}
          onPlanSaved={handlePlanSaved}
          onLogResult={() => setView('add-result')}
        />
      </div>
    );
  }

  if (view === 'result-detail' && selectedResult) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <ResultDetail
          result={selectedResult}
          onBack={() => setView('dashboard')}
          onDelete={() => handleDeleteResult(selectedResult.id)}
          onDebriefSaved={handleDebriefSaved}
        />
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Dashboard
        events={events}
        results={results}
        loading={loading}
        onEventClick={e => { setSelectedEvent(e); setView('event-detail'); }}
        onResultClick={r => { setSelectedResult(r); setView('result-detail'); }}
        onAddEvent={() => { setSelectedEvent(null); setView('add-event'); }}
        onAddResult={() => { setSelectedEvent(null); setView('add-result'); }}
        onClassifier={() => setView('classifier')}
      />
    </div>
  );
}
