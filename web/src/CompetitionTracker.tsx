import { useState, useEffect } from 'react';
import { theme } from './theme';
import {
  getCompetitionEvents, saveCompetitionEvent, deleteCompetitionEvent,
  getCompetitionResults, saveCompetitionResult, deleteCompetitionResult,
  getClassifierEntries, saveClassifierEntry, deleteClassifierEntry,
  getDrillSessions, getTrainingGoals, getAllGuns,
} from './storage';
import { getDrills } from './services/drillsService';
import { generateEventTrainingPlan, generateMatchDebrief } from './claudeApi';
import type {
  CompetitionEvent, CompetitionResult, ClassifierEntry,
  CompetitionDiscipline, MatchPriority,
} from './types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function daysUntil(dateStr: string): number {
  const today = new Date().toISOString().split('T')[0];
  return Math.floor((new Date(dateStr + 'T12:00:00').getTime() - new Date(today + 'T12:00:00').getTime()) / 86400000);
}

function percentile(placement: number, total: number): number {
  return Math.round((placement / total) * 100);
}

const DISCIPLINES: CompetitionDiscipline[] = [
  'USPSA', 'IDPA', 'IPSC', '3-Gun', 'PRS', 'NRL',
  'Steel Challenge', 'ICORE', 'ATA Trap', 'NSCA Sporting Clays',
  'NSSA Skeet', 'Bullseye', 'Long Range', 'Other',
];

const PRIORITY_COLORS: Record<MatchPriority, string> = {
  A: '#ff6b6b',
  B: theme.accent,
  C: theme.textSecondary,
};

const PRIORITY_LABELS: Record<MatchPriority, string> = {
  A: 'A-Match — Peak',
  B: 'B-Match — Tune-up',
  C: 'C-Match — Fun',
};

// USPSA classification system
const USPSA_CLASSES = [
  { label: 'GM', min: 95, color: '#ffd43b' },
  { label: 'M',  min: 85, color: '#c084fc' },
  { label: 'A',  min: 75, color: '#60a5fa' },
  { label: 'B',  min: 60, color: '#4ade80' },
  { label: 'C',  min: 40, color: '#fb923c' },
  { label: 'D',  min: 0,  color: theme.textSecondary },
];

function uspsa_class(pct: number) {
  return USPSA_CLASSES.find(c => pct >= c.min) ?? USPSA_CLASSES[USPSA_CLASSES.length - 1];
}

// ─── Priority badge ────────────────────────────────────────────────────────────

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

// ─── Countdown chip ───────────────────────────────────────────────────────────

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

interface EventCardProps {
  event: CompetitionEvent;
  onClick: () => void;
}

function EventCard({ event, onClick }: EventCardProps) {
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
          <div style={{ color: theme.textPrimary, fontSize: '15px', fontWeight: 700 }}>{event.name}</div>
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
        {event.date}{event.location ? ` · ${event.location}` : ''}
        {event.stageCount ? ` · ${event.stageCount} stages` : ''}
      </div>
    </button>
  );
}

// ─── Result Card ──────────────────────────────────────────────────────────────

function ResultCard({ result, onClick }: { result: CompetitionResult; onClick: () => void }) {
  const pctile = result.placement && result.totalCompetitors
    ? percentile(result.placement, result.totalCompetitors)
    : null;
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

// ─── Add / Edit Event Form ────────────────────────────────────────────────────

interface EventFormProps {
  initial?: CompetitionEvent;
  onSave: (e: CompetitionEvent) => void;
  onCancel: () => void;
}

function EventForm({ initial, onSave, onCancel }: EventFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [discipline, setDiscipline] = useState<CompetitionDiscipline>(initial?.discipline ?? 'USPSA');
  const [division, setDivision] = useState(initial?.division ?? '');
  const [date, setDate] = useState(initial?.date ?? '');
  const [location, setLocation] = useState(initial?.location ?? '');
  const [priority, setPriority] = useState<MatchPriority>(initial?.priority ?? 'B');
  const [stageCount, setStageCount] = useState(initial?.stageCount?.toString() ?? '');
  const [roundCount, setRoundCount] = useState(initial?.roundCount?.toString() ?? '');
  const [officialUrl, setOfficialUrl] = useState(initial?.officialUrl ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const guns = getAllGuns().filter(g => g.status === 'Active');
  const [gunId, setGunId] = useState(initial?.gunId ?? '');

  function save() {
    if (!name.trim() || !date || !division.trim()) return;
    onSave({
      id: initial?.id ?? genId(),
      name: name.trim(),
      discipline,
      division: division.trim(),
      date,
      location: location.trim(),
      priority,
      gunId: gunId || undefined,
      stageCount: stageCount ? parseInt(stageCount) : undefined,
      roundCount: roundCount ? parseInt(roundCount) : undefined,
      officialUrl: officialUrl.trim() || undefined,
      notes: notes.trim() || undefined,
      trainingPlan: initial?.trainingPlan,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    });
  }

  const field: React.CSSProperties = {
    width: '100%', padding: '12px', borderRadius: '8px',
    backgroundColor: theme.bg, border: `1px solid ${theme.border}`,
    color: theme.textPrimary, fontSize: '14px', boxSizing: 'border-box',
  };
  const label: React.CSSProperties = {
    color: theme.textMuted, fontSize: '11px', letterSpacing: '1px',
    display: 'block', marginBottom: '6px',
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ color: theme.textPrimary, fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>
        {initial ? 'Edit Match' : 'Add Match'}
      </div>

      <label style={label}>MATCH NAME *</label>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Central Valley USPSA Club Match" style={{ ...field, marginBottom: '14px' }} />

      <label style={label}>DISCIPLINE</label>
      <select value={discipline} onChange={e => setDiscipline(e.target.value as CompetitionDiscipline)} style={{ ...field, marginBottom: '14px' }}>
        {DISCIPLINES.map(d => <option key={d} value={d}>{d}</option>)}
      </select>

      <label style={label}>DIVISION *</label>
      <input value={division} onChange={e => setDivision(e.target.value)} placeholder="e.g. Production, Carry Optics, Open" style={{ ...field, marginBottom: '14px' }} />

      <label style={label}>DATE *</label>
      <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...field, marginBottom: '14px' }} />

      <label style={label}>LOCATION</label>
      <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Fresno Rod & Gun Club" style={{ ...field, marginBottom: '14px' }} />

      <label style={label}>MATCH PRIORITY</label>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
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
          <label style={label}>STAGES</label>
          <input type="number" value={stageCount} onChange={e => setStageCount(e.target.value)} placeholder="e.g. 6" style={field} />
        </div>
        <div>
          <label style={label}>ROUNDS</label>
          <input type="number" value={roundCount} onChange={e => setRoundCount(e.target.value)} placeholder="e.g. 180" style={field} />
        </div>
      </div>

      {guns.length > 0 && (
        <>
          <label style={label}>GUN (OPTIONAL)</label>
          <select value={gunId} onChange={e => setGunId(e.target.value)} style={{ ...field, marginBottom: '14px' }}>
            <option value="">Not specified</option>
            {guns.map(g => <option key={g.id} value={g.id}>{g.make} {g.model}</option>)}
          </select>
        </>
      )}

      <label style={label}>NOTES</label>
      <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Equipment setup, goals, etc." style={{ ...field, resize: 'none', fontFamily: 'inherit', marginBottom: '20px' }} />

      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={onCancel} style={{
          flex: 1, padding: '14px', borderRadius: '10px',
          backgroundColor: 'transparent', border: `1px solid ${theme.border}`,
          color: theme.textSecondary, fontSize: '14px', cursor: 'pointer',
        }}>Cancel</button>
        <button onClick={save} disabled={!name.trim() || !date || !division.trim()} style={{
          flex: 2, padding: '14px', borderRadius: '10px',
          backgroundColor: theme.accent, color: '#000',
          border: 'none', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
          opacity: (!name.trim() || !date || !division.trim()) ? 0.4 : 1,
        }}>SAVE MATCH</button>
      </div>
    </div>
  );
}

// ─── Event Detail ─────────────────────────────────────────────────────────────

interface EventDetailProps {
  event: CompetitionEvent;
  results: CompetitionResult[];
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdate: (e: CompetitionEvent) => void;
  onLogResult: () => void;
}

function EventDetail({ event, results, onBack, onEdit, onDelete, onUpdate, onLogResult }: EventDetailProps) {
  const [plan, setPlan] = useState(event.trainingPlan ?? '');
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [planError, setPlanError] = useState('');
  const days = daysUntil(event.date);
  const isPast = days < 0;
  const eventResults = results.filter(r => r.eventId === event.id);

  async function handleGeneratePlan() {
    setLoadingPlan(true);
    setPlanError('');
    try {
      const [sessions, drills, goals] = await Promise.all([
        Promise.resolve(getDrillSessions()),
        getDrills(),
        Promise.resolve(getTrainingGoals()),
      ]);
      const text = await generateEventTrainingPlan(event, sessions, drills, goals);
      setPlan(text);
      onUpdate({ ...event, trainingPlan: text });
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
            <div style={{ color: theme.textPrimary, fontSize: '22px', fontWeight: 800 }}>{event.name}</div>
            <div style={{ color: theme.textMuted, fontSize: '13px', marginTop: '4px' }}>
              {event.discipline} · {event.division}
            </div>
          </div>
          <PriorityBadge priority={event.priority} />
        </div>

        {/* Date / countdown */}
        <div style={{
          backgroundColor: theme.surface, borderRadius: '10px',
          padding: '12px 14px', marginBottom: '16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          border: `1px solid ${theme.border}`,
        }}>
          <div>
            <div style={{ color: theme.textMuted, fontSize: '10px', letterSpacing: '1px' }}>DATE</div>
            <div style={{ color: theme.textPrimary, fontFamily: 'monospace', fontSize: '16px', fontWeight: 700 }}>{event.date}</div>
            {event.location && <div style={{ color: theme.textMuted, fontSize: '12px' }}>{event.location}</div>}
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

        {/* Stats row */}
        {(event.stageCount || event.roundCount) && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            {event.stageCount && (
              <div style={{ flex: 1, backgroundColor: theme.surface, borderRadius: '8px', padding: '10px 12px', border: `1px solid ${theme.border}` }}>
                <div style={{ color: theme.textMuted, fontSize: '10px', letterSpacing: '1px' }}>STAGES</div>
                <div style={{ color: theme.textPrimary, fontFamily: 'monospace', fontSize: '20px', fontWeight: 700 }}>{event.stageCount}</div>
              </div>
            )}
            {event.roundCount && (
              <div style={{ flex: 1, backgroundColor: theme.surface, borderRadius: '8px', padding: '10px 12px', border: `1px solid ${theme.border}` }}>
                <div style={{ color: theme.textMuted, fontSize: '10px', letterSpacing: '1px' }}>ROUNDS</div>
                <div style={{ color: theme.textPrimary, fontFamily: 'monospace', fontSize: '20px', fontWeight: 700 }}>{event.roundCount}</div>
              </div>
            )}
          </div>
        )}
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
                {loadingPlan ? 'Generating...' : plan ? 'Regenerate' : 'Generate AI Plan'}
              </button>
            )}
          </div>
          {planError && <div style={{ color: theme.red, fontSize: '12px', marginBottom: '8px' }}>{planError}</div>}
          {plan ? (
            <div style={{
              backgroundColor: theme.bg, borderRadius: '10px',
              padding: '14px', border: `1px solid ${theme.border}`,
              color: theme.textSecondary, fontSize: '13px', lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
            }}>
              {plan}
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

        {/* Notes */}
        {event.notes && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ color: theme.textMuted, fontSize: '11px', letterSpacing: '1px', marginBottom: '8px' }}>NOTES</div>
            <div style={{ color: theme.textSecondary, fontSize: '13px', lineHeight: 1.6 }}>{event.notes}</div>
          </div>
        )}

        {/* Results for this event */}
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
                    {r.placement && r.totalCompetitors ? `${r.placement}/${r.totalCompetitors} (top ${percentile(r.placement, r.totalCompetitors)}%)` : r.placement ? `${r.placement}th` : 'Placement not recorded'}
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

        {/* Actions */}
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

// ─── Result Entry Form ────────────────────────────────────────────────────────

interface ResultFormProps {
  event?: CompetitionEvent;
  initial?: CompetitionResult;
  onSave: (r: CompetitionResult) => void;
  onCancel: () => void;
}

function ResultForm({ event, initial, onSave, onCancel }: ResultFormProps) {
  const [eventName, setEventName] = useState(initial?.eventName ?? event?.name ?? '');
  const [discipline, setDiscipline] = useState<CompetitionDiscipline>(initial?.discipline ?? event?.discipline ?? 'USPSA');
  const [division, setDivision] = useState(initial?.division ?? event?.division ?? '');
  const [date, setDate] = useState(initial?.date ?? event?.date ?? '');
  const [placement, setPlacement] = useState(initial?.placement?.toString() ?? '');
  const [total, setTotal] = useState(initial?.totalCompetitors?.toString() ?? '');
  const [score, setScore] = useState(initial?.score?.toString() ?? '');
  const [scoreUnit, setScoreUnit] = useState(initial?.scoreUnit ?? '');
  const [classifierScore, setClassifierScore] = useState(initial?.classifierScore?.toString() ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [generatingDebrief, setGeneratingDebrief] = useState(false);
  const guns = getAllGuns().filter(g => g.status === 'Active');
  const [gunId, setGunId] = useState(initial?.gunId ?? event?.gunId ?? '');

  const SCORE_UNITS: Record<CompetitionDiscipline, string> = {
    'USPSA': 'hit_factor', 'IDPA': 'time', 'IPSC': 'hit_factor', '3-Gun': 'hit_factor',
    'PRS': 'points', 'NRL': 'points', 'Steel Challenge': 'time', 'ICORE': 'hit_factor',
    'ATA Trap': 'count', 'NSCA Sporting Clays': 'count', 'NSSA Skeet': 'count',
    'Bullseye': 'X-count', 'Long Range': 'points', 'Other': 'score',
  };

  async function handleSave(withDebrief = false) {
    if (!eventName.trim() || !date || !division.trim()) return;

    const result: CompetitionResult = {
      id: initial?.id ?? genId(),
      eventId: initial?.eventId ?? event?.id,
      eventName: eventName.trim(),
      discipline,
      division: division.trim(),
      date,
      placement: placement ? parseInt(placement) : undefined,
      totalCompetitors: total ? parseInt(total) : undefined,
      score: score ? parseFloat(score) : undefined,
      scoreUnit: scoreUnit || SCORE_UNITS[discipline],
      gunId: gunId || undefined,
      classifierScore: classifierScore ? parseFloat(classifierScore) : undefined,
      notes: notes.trim() || undefined,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    };

    if (withDebrief) {
      setGeneratingDebrief(true);
      try {
        const debrief = await generateMatchDebrief(result, notes);
        result.aiDebrief = debrief;
      } catch { /* save without debrief */ }
      setGeneratingDebrief(false);
    }

    onSave(result);
  }

  const field: React.CSSProperties = {
    width: '100%', padding: '12px', borderRadius: '8px',
    backgroundColor: theme.bg, border: `1px solid ${theme.border}`,
    color: theme.textPrimary, fontSize: '14px', boxSizing: 'border-box',
  };
  const label: React.CSSProperties = {
    color: theme.textMuted, fontSize: '11px', letterSpacing: '1px',
    display: 'block', marginBottom: '6px',
  };

  const canSave = eventName.trim() && date && division.trim();

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ color: theme.textPrimary, fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Log Result</div>

      <label style={label}>MATCH NAME</label>
      <input value={eventName} onChange={e => setEventName(e.target.value)} style={{ ...field, marginBottom: '14px' }} />

      <label style={label}>DISCIPLINE</label>
      <select value={discipline} onChange={e => setDiscipline(e.target.value as CompetitionDiscipline)} style={{ ...field, marginBottom: '14px' }}>
        {DISCIPLINES.map(d => <option key={d} value={d}>{d}</option>)}
      </select>

      <label style={label}>DIVISION</label>
      <input value={division} onChange={e => setDivision(e.target.value)} style={{ ...field, marginBottom: '14px' }} />

      <label style={label}>DATE</label>
      <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...field, marginBottom: '14px' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
        <div>
          <label style={label}>YOUR PLACE</label>
          <input type="number" value={placement} onChange={e => setPlacement(e.target.value)} placeholder="e.g. 7" style={field} />
        </div>
        <div>
          <label style={label}>TOTAL COMPETITORS</label>
          <input type="number" value={total} onChange={e => setTotal(e.target.value)} placeholder="e.g. 34" style={field} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '14px' }}>
        <div>
          <label style={label}>SCORE</label>
          <input type="number" value={score} onChange={e => setScore(e.target.value)} placeholder="e.g. 4.87" style={field} />
        </div>
        <div>
          <label style={label}>UNIT</label>
          <input value={scoreUnit || SCORE_UNITS[discipline]} onChange={e => setScoreUnit(e.target.value)} style={field} />
        </div>
      </div>

      {guns.length > 0 && (
        <>
          <label style={label}>GUN USED</label>
          <select value={gunId} onChange={e => setGunId(e.target.value)} style={{ ...field, marginBottom: '14px' }}>
            <option value="">Not specified</option>
            {guns.map(g => <option key={g.id} value={g.id}>{g.make} {g.model}</option>)}
          </select>
        </>
      )}

      <label style={label}>NOTES</label>
      <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="How did it go? What happened? These feed into the AI debrief." style={{ ...field, resize: 'none', fontFamily: 'inherit', marginBottom: '14px' }} />

      {/* Advanced section */}
      <button onClick={() => setShowAdvanced(v => !v)} style={{
        background: 'none', border: 'none', color: theme.accent,
        fontSize: '13px', cursor: 'pointer', padding: 0, marginBottom: '14px',
        textAlign: 'left',
      }}>
        {showAdvanced ? '▼' : '▶'} Advanced details (enables deeper AI analysis)
      </button>

      {showAdvanced && (
        <div style={{
          backgroundColor: theme.bg, borderRadius: '10px',
          padding: '14px', border: `1px solid ${theme.border}`, marginBottom: '14px',
        }}>
          {discipline === 'USPSA' || discipline === 'IDPA' || discipline === 'IPSC' ? (
            <>
              <label style={label}>CLASSIFIER SCORE (%)</label>
              <input type="number" value={classifierScore} onChange={e => setClassifierScore(e.target.value)}
                placeholder="e.g. 72.4" style={{ ...field, marginBottom: '10px' }} />
            </>
          ) : null}
          <div style={{ color: theme.textMuted, fontSize: '12px', lineHeight: 1.6 }}>
            Stage-by-stage breakdown coming in a future update. For now, add any stage notes above.
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={onCancel} style={{
          flex: 1, padding: '14px', borderRadius: '10px',
          backgroundColor: 'transparent', border: `1px solid ${theme.border}`,
          color: theme.textSecondary, fontSize: '13px', cursor: 'pointer',
        }}>Cancel</button>
        <button onClick={() => handleSave(false)} disabled={!canSave} style={{
          flex: 1, padding: '14px', borderRadius: '10px',
          backgroundColor: theme.surface, border: `1px solid ${theme.border}`,
          color: theme.textSecondary, fontSize: '13px', fontWeight: 600,
          cursor: 'pointer', opacity: !canSave ? 0.4 : 1,
        }}>Save</button>
        <button onClick={() => handleSave(true)} disabled={!canSave || generatingDebrief} style={{
          flex: 2, padding: '14px', borderRadius: '10px',
          backgroundColor: theme.accent, color: '#000',
          border: 'none', fontSize: '13px', fontWeight: 700,
          cursor: 'pointer', opacity: (!canSave || generatingDebrief) ? 0.5 : 1,
        }}>
          {generatingDebrief ? 'Getting debrief...' : 'Save + AI Debrief'}
        </button>
      </div>
    </div>
  );
}

// ─── Result Detail ────────────────────────────────────────────────────────────

function ResultDetail({ result, onBack, onDelete }: { result: CompetitionResult; onBack: () => void; onDelete: () => void }) {
  const [generatingDebrief, setGeneratingDebrief] = useState(false);
  const [debrief, setDebrief] = useState(result.aiDebrief ?? '');
  const [notes, setNotes] = useState('');

  async function handleDebrief() {
    setGeneratingDebrief(true);
    try {
      const text = await generateMatchDebrief(result, notes);
      setDebrief(text);
      saveCompetitionResult({ ...result, aiDebrief: text });
    } catch { /* ignore */ }
    setGeneratingDebrief(false);
  }

  const pctile = result.placement && result.totalCompetitors
    ? percentile(result.placement, result.totalCompetitors)
    : null;

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
        {/* Result stats */}
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
          <div style={{ backgroundColor: theme.surface, borderRadius: '10px', padding: '14px', border: `1px solid ${theme.border}`, marginBottom: '20px' }}>
            <div style={{ color: theme.textMuted, fontSize: '10px', letterSpacing: '1px', marginBottom: '6px' }}>CLASSIFIER SCORE</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '28px', fontWeight: 800, color: theme.accent }}>{result.classifierScore}%</span>
              <span style={{ fontSize: '16px', fontWeight: 700, color: uspsa_class(result.classifierScore).color }}>
                {uspsa_class(result.classifierScore).label}
              </span>
            </div>
          </div>
        )}

        {/* AI Debrief */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ color: theme.textMuted, fontSize: '11px', letterSpacing: '1px' }}>AI DEBRIEF</div>
            {!debrief && (
              <button onClick={() => {}} style={{
                background: 'none', border: `1px solid ${theme.accent}`,
                borderRadius: '6px', padding: '4px 10px',
                color: theme.accent, fontSize: '11px', cursor: 'pointer',
              }} onClick={() => handleDebrief()}>
                Generate
              </button>
            )}
          </div>
          {!debrief && !generatingDebrief && (
            <>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="Add context for the AI (what went well, what didn't)..."
                style={{
                  width: '100%', padding: '12px', borderRadius: '8px',
                  backgroundColor: theme.bg, border: `1px solid ${theme.border}`,
                  color: theme.textPrimary, fontSize: '13px',
                  resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                  marginBottom: '8px',
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
              color: theme.textSecondary, fontSize: '13px', lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
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

function ClassifierProgress() {
  const [entries, setEntries] = useState<ClassifierEntry[]>(getClassifierEntries());
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [date, setDate] = useState('');
  const [hitFactor, setHitFactor] = useState('');
  const [pct, setPct] = useState('');
  const [division, setDivision] = useState('');
  const guns = getAllGuns().filter(g => g.status === 'Active');
  const [gunId, setGunId] = useState('');

  // USPSA classifier percentages
  const uspsa = entries.filter(e => e.discipline === 'USPSA');
  const latestPct = uspsa.length > 0
    ? uspsa.reduce((max, e) => Math.max(max, e.percentage ?? 0), 0)
    : null;
  const currentClass = latestPct !== null ? uspsa_class(latestPct) : null;
  const nextClass = latestPct !== null
    ? USPSA_CLASSES.find(c => c.min > (latestPct ?? 0)) ?? null
    : null;
  const pctToNext = nextClass && latestPct !== null ? nextClass.min - latestPct : null;

  function save() {
    if (!name.trim() || !date) return;
    const entry: ClassifierEntry = {
      id: genId(),
      discipline: 'USPSA',
      classifierName: name.trim(),
      classifierCode: code.trim() || undefined,
      date,
      hitFactor: hitFactor ? parseFloat(hitFactor) : undefined,
      percentage: pct ? parseFloat(pct) : undefined,
      division: division.trim() || undefined,
      gunId: gunId || undefined,
      createdAt: new Date().toISOString(),
    };
    saveClassifierEntry(entry);
    setEntries(getClassifierEntries());
    setShowAdd(false);
    setName(''); setCode(''); setDate(''); setHitFactor(''); setPct(''); setDivision(''); setGunId('');
  }

  const field: React.CSSProperties = {
    width: '100%', padding: '10px', borderRadius: '8px',
    backgroundColor: theme.bg, border: `1px solid ${theme.border}`,
    color: theme.textPrimary, fontSize: '14px', boxSizing: 'border-box',
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
      <div style={{ color: theme.textMuted, fontSize: '11px', letterSpacing: '1px', marginBottom: '16px' }}>CLASSIFIER PROGRESS</div>

      {/* USPSA class arc */}
      {currentClass && latestPct !== null ? (
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
                {latestPct.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Progress bar to next class */}
          {nextClass && pctToNext !== null && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: theme.textMuted }}>To {nextClass.label}</span>
                <span style={{ fontSize: '11px', color: theme.textMuted, fontFamily: 'monospace' }}>+{pctToNext.toFixed(1)}%</span>
              </div>
              <div style={{ height: '6px', backgroundColor: theme.bg, borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '3px',
                  backgroundColor: currentClass.color,
                  width: `${Math.min(100, ((latestPct - currentClass.min) / (nextClass.min - currentClass.min)) * 100)}%`,
                  transition: 'width 0.3s',
                }} />
              </div>
            </div>
          )}

          {/* Class ladder */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
            {[...USPSA_CLASSES].reverse().map(c => (
              <div key={c.label} style={{
                flex: 1, textAlign: 'center', padding: '6px 2px',
                borderRadius: '6px',
                backgroundColor: currentClass.label === c.label ? c.color : 'transparent',
                border: `1px solid ${currentClass.label === c.label ? c.color : theme.border}`,
              }}>
                <div style={{
                  fontSize: '12px', fontWeight: 700,
                  color: currentClass.label === c.label ? '#000' : c.color,
                }}>
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
          No classifier scores yet. Add your first classifier run.
        </div>
      )}

      {/* History */}
      {uspsa.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ color: theme.textMuted, fontSize: '11px', letterSpacing: '1px', marginBottom: '10px' }}>HISTORY</div>
          {uspsa.map(e => (
            <div key={e.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0', borderBottom: `1px solid ${theme.border}`,
            }}>
              <div>
                <div style={{ color: theme.textPrimary, fontSize: '13px', fontWeight: 600 }}>{e.classifierName}</div>
                <div style={{ color: theme.textMuted, fontSize: '11px' }}>
                  {e.date}{e.classifierCode ? ` · ${e.classifierCode}` : ''}
                  {e.division ? ` · ${e.division}` : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {e.percentage != null && (
                  <div style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 700, color: uspsa_class(e.percentage).color }}>
                    {e.percentage.toFixed(1)}%
                  </div>
                )}
                {e.hitFactor != null && (
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted }}>{e.hitFactor} HF</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {showAdd ? (
        <div style={{
          backgroundColor: theme.surface, borderRadius: '12px',
          padding: '16px', border: `1px solid ${theme.border}`, marginBottom: '16px',
        }}>
          <div style={{ color: theme.textPrimary, fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>Log Classifier</div>
          <label style={{ color: theme.textMuted, fontSize: '11px', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>CLASSIFIER NAME</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. El Presidente" style={{ ...field, marginBottom: '10px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
            <div>
              <label style={{ color: theme.textMuted, fontSize: '11px', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>CODE</label>
              <input value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. CM-99-11" style={field} />
            </div>
            <div>
              <label style={{ color: theme.textMuted, fontSize: '11px', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>DATE</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={field} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
            <div>
              <label style={{ color: theme.textMuted, fontSize: '11px', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>HIT FACTOR</label>
              <input type="number" value={hitFactor} onChange={e => setHitFactor(e.target.value)} placeholder="e.g. 7.42" style={field} />
            </div>
            <div>
              <label style={{ color: theme.textMuted, fontSize: '11px', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>PCT %</label>
              <input type="number" value={pct} onChange={e => setPct(e.target.value)} placeholder="e.g. 72.4" style={field} />
            </div>
          </div>
          <label style={{ color: theme.textMuted, fontSize: '11px', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>DIVISION</label>
          <input value={division} onChange={e => setDivision(e.target.value)} placeholder="e.g. Production" style={{ ...field, marginBottom: '10px' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', backgroundColor: 'transparent', border: `1px solid ${theme.border}`, color: theme.textSecondary, fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
            <button onClick={save} disabled={!name.trim() || !date} style={{ flex: 2, padding: '12px', borderRadius: '8px', backgroundColor: theme.accent, color: '#000', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: (!name.trim() || !date) ? 0.4 : 1 }}>Save</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)} style={{
          width: '100%', padding: '14px',
          backgroundColor: 'transparent', border: `1px dashed ${theme.border}`,
          borderRadius: '10px', color: theme.textSecondary,
          fontSize: '13px', cursor: 'pointer', marginBottom: '16px',
        }}>
          + Log Classifier Run
        </button>
      )}
    </div>
  );
}

// ─── Dashboard (Calendar view) ────────────────────────────────────────────────

function Dashboard({ events, results, onEventClick, onAddEvent, onAddResult, onClassifier }: {
  events: CompetitionEvent[];
  results: CompetitionResult[];
  onEventClick: (e: CompetitionEvent) => void;
  onAddEvent: () => void;
  onAddResult: () => void;
  onClassifier: () => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const upcoming = events.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const past = events.filter(e => e.date < today).sort((a, b) => b.date.localeCompare(a.date));
  const recentResults = results.slice(0, 5);

  // Stats
  const totalEvents = results.length;
  const placements = results.filter(r => r.placement && r.totalCompetitors);
  const avgPctile = placements.length
    ? Math.round(placements.reduce((sum, r) => sum + percentile(r.placement!, r.totalCompetitors!), 0) / placements.length)
    : null;
  const aMatches = events.filter(e => e.priority === 'A').length;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
      {/* Stats row */}
      {totalEvents > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '20px' }}>
          <div style={{ backgroundColor: theme.surface, borderRadius: '8px', padding: '10px 12px', border: `1px solid ${theme.border}`, textAlign: 'center' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '22px', fontWeight: 800, color: theme.textPrimary }}>{totalEvents}</div>
            <div style={{ color: theme.textMuted, fontSize: '10px' }}>matches</div>
          </div>
          <div style={{ backgroundColor: theme.surface, borderRadius: '8px', padding: '10px 12px', border: `1px solid ${theme.border}`, textAlign: 'center' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '22px', fontWeight: 800, color: avgPctile !== null && avgPctile <= 33 ? theme.green : theme.textPrimary }}>
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

      {/* Upcoming matches */}
      {upcoming.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ color: theme.textMuted, fontSize: '11px', letterSpacing: '1px', marginBottom: '10px' }}>UPCOMING</div>
          {upcoming.map(e => <EventCard key={e.id} event={e} onClick={() => onEventClick(e)} />)}
        </div>
      )}

      {upcoming.length === 0 && (
        <div style={{
          backgroundColor: theme.surface, borderRadius: '12px',
          padding: '20px', border: `1px dashed ${theme.border}`,
          textAlign: 'center', color: theme.textMuted, fontSize: '13px',
          marginBottom: '24px',
        }}>
          No upcoming matches. Add one to start planning.
        </div>
      )}

      {/* Recent results */}
      {recentResults.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ color: theme.textMuted, fontSize: '11px', letterSpacing: '1px' }}>RECENT RESULTS</div>
            <button onClick={onAddResult} style={{
              background: 'none', border: 'none', color: theme.accent,
              fontSize: '12px', cursor: 'pointer',
            }}>+ Log result</button>
          </div>
          {recentResults.map(r => (
            <ResultCard key={r.id} result={r} onClick={() => {}} />
          ))}
        </div>
      )}

      {recentResults.length === 0 && (
        <button onClick={onAddResult} style={{
          width: '100%', padding: '14px',
          backgroundColor: 'transparent', border: `1px dashed ${theme.border}`,
          borderRadius: '10px', color: theme.textSecondary,
          fontSize: '13px', cursor: 'pointer',
        }}>
          + Log a match result
        </button>
      )}

      {/* Past events */}
      {past.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <div style={{ color: theme.textMuted, fontSize: '11px', letterSpacing: '1px', marginBottom: '10px' }}>PAST MATCHES</div>
          {past.slice(0, 5).map(e => <EventCard key={e.id} event={e} onClick={() => onEventClick(e)} />)}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type CompView = 'dashboard' | 'event-detail' | 'add-event' | 'edit-event' | 'result-detail' | 'add-result' | 'classifier';

export function CompetitionTracker({ isPro }: { isPro?: boolean }) {
  const [view, setView] = useState<CompView>('dashboard');
  const [events, setEvents] = useState<CompetitionEvent[]>(getCompetitionEvents());
  const [results, setResults] = useState<CompetitionResult[]>(getCompetitionResults());
  const [selectedEvent, setSelectedEvent] = useState<CompetitionEvent | null>(null);
  const [selectedResult, setSelectedResult] = useState<CompetitionResult | null>(null);

  function refreshAll() {
    setEvents(getCompetitionEvents());
    setResults(getCompetitionResults());
  }

  function handleSaveEvent(e: CompetitionEvent) {
    saveCompetitionEvent(e);
    refreshAll();
    const saved = getCompetitionEvents().find(ev => ev.id === e.id);
    if (saved) setSelectedEvent(saved);
    setView('event-detail');
  }

  function handleDeleteEvent(id: string) {
    deleteCompetitionEvent(id);
    refreshAll();
    setView('dashboard');
  }

  function handleSaveResult(r: CompetitionResult) {
    saveCompetitionResult(r);
    refreshAll();
    const saved = getCompetitionResults().find(res => res.id === r.id);
    if (saved) setSelectedResult(saved);
    setView('result-detail');
  }

  function handleDeleteResult(id: string) {
    deleteCompetitionResult(id);
    refreshAll();
    setView('dashboard');
  }

  if (view === 'classifier') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${theme.border}` }}>
          <button onClick={() => setView('dashboard')} style={{
            background: 'none', border: 'none', color: theme.accent,
            fontSize: '13px', cursor: 'pointer', padding: 0,
          }}>← Back</button>
        </div>
        <ClassifierProgress />
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
          onUpdate={e => { saveCompetitionEvent(e); setSelectedEvent(e); refreshAll(); }}
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
        />
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Dashboard
        events={events}
        results={results}
        onEventClick={e => { setSelectedEvent(e); setView('event-detail'); }}
        onAddEvent={() => { setSelectedEvent(null); setView('add-event'); }}
        onAddResult={() => { setView('add-result'); }}
        onClassifier={() => setView('classifier')}
      />
    </div>
  );
}
