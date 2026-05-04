// SessionAIParser — log a session by describing it in natural language (or voice)
import { useState, useRef, useEffect } from 'react';
import { theme } from './theme';
import type { Gun, AmmoLot, IssueType, SessionPurpose } from './types';
import type { ParsedSessionData, ParsedSessionString } from './claudeApi';
import { parseSessionFromText } from './claudeApi';
import { getAllGuns, getAllAmmo, logSession, updateAmmo, updateGun } from './storage';
import { haptic } from './haptic';

interface Props {
  onSaved: () => void;
  onCancel: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

// ── Styles ────────────────────────────────────────────────────────────────────

const s = {
  wrap: {
    display: 'flex', flexDirection: 'column' as const,
    height: '100%', backgroundColor: theme.bg,
  },
  messages: {
    flex: 1, overflowY: 'auto' as const,
    padding: '12px 16px', display: 'flex',
    flexDirection: 'column' as const, gap: '10px',
  },
  bubble: (role: 'user' | 'assistant'): React.CSSProperties => ({
    maxWidth: '85%',
    alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
    backgroundColor: role === 'user' ? theme.accent : theme.surface,
    color: role === 'user' ? theme.bg : theme.textPrimary,
    borderRadius: role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
    padding: '10px 12px',
    fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.6,
  }),
  preview: {
    margin: '0 16px 12px',
    border: `0.5px solid ${theme.accent}40`,
    borderRadius: '8px',
    padding: '12px',
    backgroundColor: `${theme.accent}08`,
  },
  previewLabel: {
    fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.8px',
    color: theme.accent, marginBottom: '8px',
  },
  previewRow: {
    display: 'flex', justifyContent: 'space-between',
    fontFamily: 'monospace', fontSize: '11px',
    color: theme.textSecondary, marginBottom: '3px',
  },
  previewVal: {
    color: theme.textPrimary, fontWeight: 700,
  },
  inputRow: {
    display: 'flex', gap: '8px', alignItems: 'flex-end',
    padding: '10px 16px 16px',
    borderTop: `0.5px solid ${theme.border}`,
    backgroundColor: theme.bg,
  },
  input: {
    flex: 1, backgroundColor: theme.surface,
    border: `0.5px solid ${theme.border}`, borderRadius: '8px',
    color: theme.textPrimary, fontFamily: 'monospace', fontSize: '12px',
    padding: '10px 12px', resize: 'none' as const,
    minHeight: '40px', maxHeight: '100px', outline: 'none',
  },
  iconBtn: (active?: boolean): React.CSSProperties => ({
    width: 40, height: 40, flexShrink: 0,
    borderRadius: '8px', border: 'none', cursor: 'pointer',
    backgroundColor: active ? theme.accent : theme.surface,
    color: active ? theme.bg : theme.textMuted,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '16px',
  }),
  sendBtn: (enabled: boolean): React.CSSProperties => ({
    width: 40, height: 40, flexShrink: 0,
    borderRadius: '8px', border: 'none', cursor: enabled ? 'pointer' : 'default',
    backgroundColor: enabled ? theme.accent : `${theme.accent}30`,
    color: enabled ? theme.bg : `${theme.accent}60`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '16px',
  }),
  logBtn: {
    margin: '0 16px 8px',
    padding: '14px',
    backgroundColor: theme.accent,
    border: 'none', borderRadius: '8px',
    color: theme.bg, fontFamily: 'monospace',
    fontSize: '12px', fontWeight: 700,
    letterSpacing: '1px', cursor: 'pointer', width: 'calc(100% - 32px)',
  },
};

// ── Preview card ──────────────────────────────────────────────────────────────

function SessionPreview({ data, guns, ammoLots }: {
  data: ParsedSessionData;
  guns: Gun[];
  ammoLots: AmmoLot[];
}) {
  if (!data.strings?.length && !data.date && !data.location) return null;

  const gunName = (id: string) => {
    const g = guns.find(g => g.id === id);
    return g ? (g.displayName || `${g.make} ${g.model}`) : id;
  };
  const ammoName = (id?: string) => {
    if (!id) return null;
    const a = ammoLots.find(a => a.id === id);
    return a ? `${a.brand} ${a.productLine} ${a.grainWeight}gr` : null;
  };

  return (
    <div style={s.preview}>
      <div style={s.previewLabel}>SESSION PREVIEW</div>

      {data.strings?.map((str, i) => (
        <div key={i} style={{ marginBottom: i < (data.strings!.length - 1) ? '8px' : 0 }}>
          {data.strings!.length > 1 && (
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginBottom: '3px' }}>
              GUN {i + 1}
            </div>
          )}
          <div style={s.previewRow}>
            <span>Firearm</span>
            <span style={s.previewVal}>{gunName(str.gunId)}</span>
          </div>
          <div style={s.previewRow}>
            <span>Rounds</span>
            <span style={s.previewVal}>{str.roundsExpended}</span>
          </div>
          {ammoName(str.ammoLotId) && (
            <div style={s.previewRow}>
              <span>Ammo</span>
              <span style={s.previewVal}>{ammoName(str.ammoLotId)}</span>
            </div>
          )}
          {str.distanceYards && (
            <div style={s.previewRow}>
              <span>Distance</span>
              <span style={s.previewVal}>{str.distanceYards}yd</span>
            </div>
          )}
        </div>
      ))}

      {data.date && (
        <div style={s.previewRow}>
          <span>Date</span>
          <span style={s.previewVal}>{data.date}</span>
        </div>
      )}
      {data.location && (
        <div style={s.previewRow}>
          <span>Location</span>
          <span style={s.previewVal}>{data.location}</span>
        </div>
      )}
      {data.indoorOutdoor && (
        <div style={s.previewRow}>
          <span>Environment</span>
          <span style={s.previewVal}>{data.indoorOutdoor}</span>
        </div>
      )}
      {data.purpose?.length ? (
        <div style={s.previewRow}>
          <span>Purpose</span>
          <span style={s.previewVal}>{data.purpose.join(', ')}</span>
        </div>
      ) : null}
      {data.issues && (
        <div style={s.previewRow}>
          <span>Issues</span>
          <span style={{ ...s.previewVal, color: '#e05c5c' }}>
            {data.issueTypes?.join(', ') || 'Yes'}
          </span>
        </div>
      )}
      {data.issueDescription && (
        <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginTop: '4px' }}>
          {data.issueDescription}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function SessionAIParser({ onSaved, onCancel }: Props) {
  const [guns] = useState<Gun[]>(() => getAllGuns());
  const [ammoLots] = useState<AmmoLot[]>(() => getAllAmmo());
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Tell me about your session — what you shot, how many rounds, any issues. You can speak or type.",
    },
  ]);
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState<ParsedSessionData>({});
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, done]);

  function startListening() {
    if (!SpeechRecognition) {
      alert('Voice input not supported on this device.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(prev => (prev ? prev + ' ' + transcript : transcript));
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
    setListening(true);
    recognitionRef.current = recognition;
    haptic('light');
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    haptic('light');

    const userMsg: Message = { role: 'user', content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setLoading(true);

    try {
      // Build conversation history for Claude (skip the greeting)
      const history = nextMessages.filter((_, i) => i > 0);
      const result = await parseSessionFromText(guns, ammoLots, history);

      // Merge extracted fields (new data wins)
      setExtracted(prev => ({
        ...prev,
        ...result.extracted,
        strings: result.extracted.strings ?? prev.strings,
        purpose: result.extracted.purpose ?? prev.purpose,
        issueTypes: result.extracted.issueTypes ?? prev.issueTypes,
      }));

      if (result.done) setDone(true);

      setMessages(m => [...m, { role: 'assistant', content: result.message }]);
    } catch (err: any) {
      setMessages(m => [...m, {
        role: 'assistant',
        content: err.message === 'BUDGET_EXCEEDED'
          ? 'AI usage limit reached. Try again next month.'
          : 'Something went wrong. Please try again.',
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  async function confirmLog() {
    if (!extracted.strings?.length) return;
    setSaving(true);
    haptic('medium');

    try {
      const primaryString = extracted.strings[0];
      const totalRounds = extracted.strings.reduce((sum, str) => sum + str.roundsExpended, 0);

      const today = new Date().toISOString().slice(0, 10);
      const dateStr = extracted.date
        ? (() => {
            const [m, d, y] = extracted.date.split('/');
            return `${y}-${m}-${d}`;
          })()
        : today;

      // Build session strings for multi-gun
      const sessionStrings = extracted.strings.map(str => ({
        id: `${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
        gunId: str.gunId,
        roundsExpended: str.roundsExpended,
        ammoLotId: str.ammoLotId,
        distanceYards: str.distanceYards,
      }));

      logSession({
        gunId: primaryString.gunId,
        date: dateStr,
        roundsExpended: totalRounds,
        ammoLotId: primaryString.ammoLotId,
        location: extracted.location,
        indoorOutdoor: extracted.indoorOutdoor,
        purpose: extracted.purpose,
        distanceYards: primaryString.distanceYards,
        issues: extracted.issues ?? false,
        issueTypes: extracted.issueTypes,
        issueDescription: extracted.issueDescription,
        notes: extracted.notes,
        strings: sessionStrings,
      });

      // Deduct ammo for each string
      for (const str of extracted.strings) {
        if (str.ammoLotId && str.roundsExpended > 0) {
          const lot = ammoLots.find(a => a.id === str.ammoLotId);
          if (lot) {
            updateAmmo(str.ammoLotId, {
              quantity: Math.max(0, lot.quantity - str.roundsExpended),
            });
          }
        }
      }

      // Update open issues on each gun if issues were logged
      if (extracted.issues && extracted.issueDescription) {
        const gunIds = [...new Set(extracted.strings.map(s => s.gunId))];
        for (const gunId of gunIds) {
          const gun = guns.find(g => g.id === gunId);
          if (gun) {
            const existing = gun.openIssues ? gun.openIssues + '\n' : '';
            updateGun(gunId, {
              openIssues: existing + `${dateStr}: ${extracted.issueDescription}`,
            });
          }
        }
      }

      // Update round counts on each gun
      for (const str of extracted.strings) {
        const gun = guns.find(g => g.id === str.gunId);
        if (gun) {
          updateGun(str.gunId, {
            roundCount: (gun.roundCount ?? 0) + str.roundsExpended,
          });
        }
      }

      haptic('success');
      onSaved();
    } catch {
      setSaving(false);
    }
  }

  const canSend = input.trim().length > 0 && !loading;
  const canLog = done && !!extracted.strings?.length;

  return (
    <div style={s.wrap}>
      {/* Messages */}
      <div style={s.messages}>
        {messages.map((m, i) => (
          <div key={i} style={s.bubble(m.role)}>{m.content}</div>
        ))}
        {loading && (
          <div style={{ ...s.bubble('assistant'), color: theme.textMuted }}>
            ...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Session preview */}
      <SessionPreview data={extracted} guns={guns} ammoLots={ammoLots} />

      {/* Log button */}
      {canLog && (
        <button style={s.logBtn} onClick={confirmLog} disabled={saving}>
          {saving ? 'LOGGING...' : 'LOG SESSION'}
        </button>
      )}

      {/* Input row */}
      <div style={s.inputRow}>
        <button
          style={s.iconBtn(listening)}
          onClick={listening ? stopListening : startListening}
          title="Voice input"
        >
          🎤
        </button>
        <textarea
          ref={textareaRef}
          style={s.input}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={listening ? 'Listening...' : 'Describe your session...'}
          rows={1}
        />
        <button style={s.sendBtn(canSend)} onClick={send} disabled={!canSend}>
          ↑
        </button>
      </div>
    </div>
  );
}
