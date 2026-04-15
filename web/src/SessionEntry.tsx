// SessionEntry — 5-screen session logging flow
// Replaces SessionLogView + SessionAIParser
// Screens: select → mic → review (AI path) | select → quick (quick path) → confirm
import { useState, useRef, useEffect } from 'react';
import { theme } from './theme';
import type { Gun, AmmoLot, IssueType } from './types';
import { getAllGuns, getAllAmmo, logSession, updateAmmo, updateGun } from './storage';
import { parseSessionFromText } from './claudeApi';
import { haptic } from './haptic';

type Screen = 'select' | 'mic' | 'review' | 'quick' | 'confirm';
type FieldConf = 'confirmed' | 'flagged' | 'missing';

interface FormData {
  date: string;              // YYYY-MM-DD
  env: 'Indoor' | 'Outdoor';
  gunId: string;
  rounds: string;            // string for input binding
  ammoLotId: string;
  location: string;
  notes: string;
  issues: boolean;
  issueDescription: string;
  issueTypes: IssueType[];
}

interface ConfMap {
  gun: FieldConf;
  rounds: FieldConf;
  ammo: FieldConf;
  location: FieldConf;
  notes: FieldConf;
}

interface Props {
  preselectedGun?: Gun | null;
  onSaved: () => void;
  onCancel: () => void;
}

const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

// ── Style constants ───────────────────────────────────────────────────────────

const sectionLabel: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '9px',
  letterSpacing: '0.8px',
  color: theme.textMuted,
  textTransform: 'uppercase',
  marginBottom: '8px',
  marginTop: '0',
};

const inputBase: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  backgroundColor: theme.surface,
  border: `0.5px solid ${theme.border}`,
  borderRadius: '6px',
  color: theme.textPrimary,
  fontFamily: 'monospace',
  fontSize: '12px',
  outline: 'none',
  boxSizing: 'border-box',
};

function chipBtn(active: boolean): React.CSSProperties {
  return {
    padding: '8px 16px',
    borderRadius: '4px',
    border: `0.5px solid ${active ? theme.accent : theme.border}`,
    background: active ? theme.accent : 'transparent',
    color: active ? theme.bg : theme.textSecondary,
    fontFamily: 'monospace',
    fontSize: '11px',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    fontWeight: active ? 700 : 400,
  };
}

function saveBtn(enabled: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '14px',
    borderRadius: '6px',
    border: 'none',
    background: enabled ? theme.accent : theme.surface,
    color: enabled ? theme.bg : theme.textMuted,
    fontFamily: 'monospace',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '1.2px',
    textTransform: 'uppercase',
    cursor: enabled ? 'pointer' : 'not-allowed',
    transition: 'background 0.15s, color 0.15s',
  };
}

// ── Shared header ─────────────────────────────────────────────────────────────

function Header({ title, backLabel, onBack }: { title: string; backLabel: string; onBack: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '18px 20px 14px', position: 'relative',
      borderBottom: `0.5px solid ${theme.border}`, flexShrink: 0,
    }}>
      <button onClick={onBack} style={{
        position: 'absolute', left: 16, background: 'none', border: 'none',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
        color: theme.accent, fontFamily: 'monospace', fontSize: '11px', padding: '4px 0',
      }}>
        ‹ {backLabel}
      </button>
      <span style={{ fontFamily: 'monospace', fontSize: '11px', letterSpacing: '1.5px', color: theme.textSecondary, textTransform: 'uppercase' }}>
        {title}
      </span>
    </div>
  );
}

// ── Scrollable body wrapper ───────────────────────────────────────────────────

function Body({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px', ...style }}>
      {children}
    </div>
  );
}

// ── Footer with primary action button ────────────────────────────────────────

function Footer({ label, enabled, saving, onPress }: { label: string; enabled: boolean; saving: boolean; onPress: () => void }) {
  return (
    <div style={{ padding: '12px 20px 20px', borderTop: `0.5px solid ${theme.border}`, flexShrink: 0 }}>
      <button onClick={onPress} disabled={!enabled || saving} style={saveBtn(enabled && !saving)}>
        {saving ? 'Saving…' : label}
      </button>
    </div>
  );
}

// ── Gun/ammo picker dropdown ──────────────────────────────────────────────────

function PickerList({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: theme.surface, border: `0.5px solid ${theme.border}`, borderRadius: '6px',
      padding: '4px', marginTop: '4px', marginBottom: '4px', maxHeight: '180px', overflowY: 'auto',
    }}>
      {children}
    </div>
  );
}

function PickerRow({ label, sub, selected, onClick }: { label: string; sub?: string; selected: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{
      padding: '9px 10px', cursor: 'pointer', borderRadius: '4px',
      background: selected ? `${theme.accent}22` : 'transparent',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: selected ? theme.accent : theme.textSecondary }}>{label}</span>
      {sub && <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>{sub}</span>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function SessionEntry({ preselectedGun, onSaved, onCancel }: Props) {
  const [guns] = useState<Gun[]>(() => getAllGuns());
  const [ammoLots] = useState<AmmoLot[]>(() => getAllAmmo());

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

  const [screen, setScreen] = useState<Screen>('select');
  const [form, setForm] = useState<FormData>({
    date: today, env: 'Outdoor',
    gunId: preselectedGun?.id ?? '',
    rounds: '', ammoLotId: '', location: '', notes: '',
    issues: false, issueDescription: '', issueTypes: [],
  });
  const [conf, setConf] = useState<ConfMap>({ gun: 'missing', rounds: 'missing', ammo: 'missing', location: 'missing', notes: 'missing' });
  const [editingField, setEditingField] = useState<string | null>(null);
  const [gunSearch, setGunSearch] = useState('');
  const [ammoSearch, setAmmoSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAmmoName, setSavedAmmoName] = useState('');

  // Mic state
  const [micPhase, setMicPhase] = useState<'idle' | 'listening' | 'processing'>('idle');
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  // Auto-navigate away from confirm screen
  useEffect(() => {
    if (screen !== 'confirm') return;
    const t = setTimeout(onSaved, 2800);
    return () => clearTimeout(t);
  }, [screen]);

  // ── Derived values ──────────────────────────────────────────────────────────

  function gunName(g: Gun) {
    return g.displayName || `${g.make} ${g.model}`;
  }

  const selectedGun = guns.find(g => g.id === form.gunId) ?? null;
  const compatibleAmmo = selectedGun
    ? ammoLots.filter(a => a.caliber === selectedGun.caliber)
    : ammoLots;
  const selectedAmmo = ammoLots.find(a => a.id === form.ammoLotId) ?? null;
  const canSave = !!form.gunId && !!form.rounds && parseInt(form.rounds) > 0;

  function fmtDate(iso: string) {
    const [y, m, d] = iso.split('-');
    return `${m}/${d}/${y}`;
  }

  function ammoLabel(a: AmmoLot) {
    return `${a.brand} ${a.productLine} ${a.grainWeight}gr`;
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  function doSave() {
    const rounds = parseInt(form.rounds);
    const gun = guns.find(g => g.id === form.gunId);
    if (!gun || !rounds || rounds <= 0) { setSaving(false); return; }

    const lot = selectedAmmo;

    logSession({
      gunId: gun.id,
      date: form.date,
      roundsExpended: rounds,
      ammoLotId: lot?.id,
      location: form.location || undefined,
      indoorOutdoor: form.env,
      issues: form.issues,
      issueTypes: form.issues && form.issueTypes.length ? form.issueTypes : undefined,
      issueDescription: form.issues ? form.issueDescription || undefined : undefined,
      notes: form.notes || undefined,
    });

    if (lot && rounds > 0) {
      updateAmmo(lot.id, { quantity: Math.max(0, lot.quantity - rounds) });
      setSavedAmmoName(ammoLabel(lot));
    }

    if (form.issues && form.issueDescription) {
      const existing = gun.openIssues ? gun.openIssues + '\n' : '';
      updateGun(gun.id, { openIssues: existing + `${form.date}: ${form.issueDescription}` });
    }

    updateGun(gun.id, { roundCount: (gun.roundCount ?? 0) + rounds });

    haptic('success');
    setSaving(false);
    setScreen('confirm');
  }

  // ── Mic / AI ──────────────────────────────────────────────────────────────

  function startListening() {
    if (!SpeechRecognition) {
      // No speech API — fall through to quick log
      setScreen('quick');
      return;
    }
    const r = new SpeechRecognition();
    r.lang = 'en-US';
    r.continuous = true;
    r.interimResults = false;
    let acc = '';
    r.onresult = (e: any) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        acc += e.results[i][0].transcript + ' ';
      }
      setTranscript(acc.trim());
    };
    r.onerror = () => { setMicPhase('idle'); };
    r.onend = () => {
      const text = acc.trim();
      if (text) processTranscript(text);
      else setMicPhase('idle');
    };
    r.start();
    recognitionRef.current = r;
    setMicPhase('listening');
    haptic('light');
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setMicPhase('processing');
    haptic('light');
  }

  async function processTranscript(text: string) {
    setMicPhase('processing');
    try {
      const result = await parseSessionFromText(
        guns, ammoLots,
        [{ role: 'user', content: text }],
      );
      const ex = result.extracted;
      const str0 = ex.strings?.[0];

      // Convert MM/DD/YYYY → YYYY-MM-DD
      let parsedDate = form.date;
      if (ex.date) {
        const parts = ex.date.split('/');
        if (parts.length === 3) {
          parsedDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        }
      }

      setForm(prev => ({
        ...prev,
        gunId: str0?.gunId ?? prev.gunId,
        rounds: str0?.roundsExpended ? String(str0.roundsExpended) : prev.rounds,
        ammoLotId: str0?.ammoLotId ?? prev.ammoLotId,
        date: parsedDate,
        location: ex.location ?? prev.location,
        env: ex.indoorOutdoor ?? prev.env,
        notes: ex.notes ?? prev.notes,
        issues: ex.issues ?? false,
        issueDescription: ex.issueDescription ?? '',
        issueTypes: ex.issueTypes ?? [],
      }));

      // All AI-parsed fields are flagged (best-guess). Missing required = 'missing'.
      setConf({
        gun: str0?.gunId ? 'flagged' : 'missing',
        rounds: str0?.roundsExpended ? 'flagged' : 'missing',
        ammo: str0?.ammoLotId ? 'flagged' : 'missing',
        location: ex.location ? 'flagged' : 'missing',
        notes: ex.notes ? 'flagged' : 'missing',
      });

      setScreen('review');
    } catch {
      setMicPhase('idle');
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  // ─── Screen: Select ───────────────────────────────────────────────────────
  if (screen === 'select') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: theme.bg }}>
        <Header title="New Session" backLabel="Sessions" onBack={onCancel} />
        <Body>

          <div style={{ ...sectionLabel, marginTop: 0 }}>Select Mode</div>

          {/* AI Debrief */}
          <button onClick={() => { setMicPhase('idle'); setTranscript(''); setScreen('mic'); }} style={{
            width: '100%', background: theme.accent, border: 'none', borderRadius: '6px',
            padding: '18px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center',
            gap: 16, marginBottom: '10px', textAlign: 'left',
          }}>
            <div style={{ width: 42, height: 42, borderRadius: '4px', background: 'rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '20px' }}>
              🎙
            </div>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, letterSpacing: '1.2px', color: theme.bg, textTransform: 'uppercase' }}>AI Debrief</div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(0,0,0,0.5)', marginTop: '3px', lineHeight: 1.5 }}>
                Talk through your session. AI parses and logs everything.
              </div>
            </div>
          </button>

          {/* Quick Log */}
          <button onClick={() => setScreen('quick')} style={{
            width: '100%', background: theme.surface, border: `0.5px solid ${theme.border}`,
            borderRadius: '6px', padding: '18px 20px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left',
          }}>
            <div style={{ width: 42, height: 42, borderRadius: '4px', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '20px' }}>
              📋
            </div>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, letterSpacing: '1.2px', color: theme.textPrimary, textTransform: 'uppercase' }}>Quick Log</div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginTop: '3px', lineHeight: 1.5 }}>
                Gun, rounds, done. No frills.
              </div>
            </div>
          </button>

          {/* Date */}
          <div style={{ ...sectionLabel, marginTop: '28px' }}>Date</div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            {[{ label: 'Today', val: today }, { label: 'Yesterday', val: yesterday }].map(opt => (
              <button key={opt.val} onClick={() => setForm(f => ({ ...f, date: opt.val }))} style={chipBtn(form.date === opt.val)}>
                {opt.label}
              </button>
            ))}
          </div>
          <input
            type="date" value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            style={{ ...inputBase, marginBottom: '20px', colorScheme: 'dark' }}
          />

          {/* Environment */}
          <div style={sectionLabel}>Environment</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['Indoor', 'Outdoor'] as const).map(e => (
              <button key={e} onClick={() => setForm(f => ({ ...f, env: e }))} style={chipBtn(form.env === e)}>{e}</button>
            ))}
          </div>

        </Body>
      </div>
    );
  }

  // ─── Screen: Mic ──────────────────────────────────────────────────────────
  if (screen === 'mic') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: theme.bg }}>
        <Header title="AI Debrief" backLabel="Back" onBack={() => setScreen('select')} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>

          {micPhase === 'idle' && (
            <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '1.2px', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '40px', textAlign: 'center', lineHeight: 1.8 }}>
              Talk through your session.<br />AI will parse and log everything.
            </div>
          )}
          {micPhase === 'listening' && (
            <div style={{ fontFamily: 'monospace', fontSize: '11px', letterSpacing: '1px', color: theme.accent, textTransform: 'uppercase', marginBottom: '40px', textAlign: 'center' }}>
              Listening…
              {transcript && (
                <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginTop: '10px', fontStyle: 'italic', maxWidth: '280px', lineHeight: 1.6, textTransform: 'none', letterSpacing: 0 }}>
                  {transcript}
                </div>
              )}
            </div>
          )}
          {micPhase === 'processing' && (
            <div style={{ fontFamily: 'monospace', fontSize: '11px', letterSpacing: '1px', color: theme.textSecondary, textTransform: 'uppercase', marginBottom: '40px', textAlign: 'center' }}>
              Parsing session…
            </div>
          )}

          <button
            onClick={micPhase === 'idle' ? startListening : micPhase === 'listening' ? stopListening : undefined}
            disabled={micPhase === 'processing'}
            style={{
              width: 96, height: 96, borderRadius: '50%',
              background: micPhase === 'listening' ? theme.accent : theme.surface,
              border: `2px solid ${micPhase === 'listening' ? theme.accent : theme.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: micPhase === 'processing' ? 'default' : 'pointer',
              fontSize: '36px',
              boxShadow: micPhase === 'listening' ? `0 0 32px ${theme.accent}44` : 'none',
              transition: 'all 0.2s',
            }}
          >
            {micPhase === 'listening' ? '⏹' : '🎙'}
          </button>

          <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginTop: '14px', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            {micPhase === 'idle' ? 'Tap to start' : micPhase === 'listening' ? 'Tap to stop' : ''}
          </div>

        </div>
      </div>
    );
  }

  // ─── Screen: Review ───────────────────────────────────────────────────────
  if (screen === 'review') {
    const flagCount = Object.values(conf).filter(v => v === 'flagged').length;

    const filteredGuns = gunSearch
      ? guns.filter(g => gunName(g).toLowerCase().includes(gunSearch.toLowerCase()))
      : guns;
    const filteredAmmo = ammoSearch
      ? compatibleAmmo.filter(a => `${a.brand} ${a.productLine}`.toLowerCase().includes(ammoSearch.toLowerCase()))
      : compatibleAmmo;

    function ReviewField({
      field, label, required, value, confValue, children,
    }: {
      field: string; label: string; required?: boolean; value: string | null; confValue: FieldConf; children: React.ReactNode;
    }) {
      const isEditing = editingField === field;
      const borderColor = confValue === 'missing' && required ? theme.red
        : confValue === 'flagged' ? theme.accent
        : theme.border;
      const bgColor = confValue === 'flagged' ? `${theme.accent}0a` : theme.surface;

      return (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.8px', color: theme.textMuted, textTransform: 'uppercase' }}>
              {label}
              {confValue === 'flagged' && !isEditing && <span style={{ color: theme.accent, marginLeft: '6px' }}>◆ REVIEW</span>}
              {confValue === 'missing' && required && <span style={{ color: theme.red, marginLeft: '6px' }}>◆ REQUIRED</span>}
            </span>
            <button onClick={() => setEditingField(isEditing ? null : field)} style={{ background: 'none', border: 'none', color: isEditing ? theme.accent : theme.textMuted, fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer', padding: '2px 0' }}>
              {isEditing ? 'Done' : 'Edit'}
            </button>
          </div>
          <div style={{ background: bgColor, border: `0.5px solid ${borderColor}`, borderRadius: '6px', padding: '11px 12px', fontFamily: 'monospace', fontSize: '12px', color: value ? theme.textPrimary : theme.textMuted }}>
            {isEditing ? children : (value || 'Not detected — tap Edit')}
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: theme.bg }}>
        <Header title="Review Session" backLabel="Re-record" onBack={() => { setScreen('mic'); setMicPhase('idle'); setTranscript(''); }} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 8px' }}>

          {flagCount > 0 && (
            <div style={{ background: `${theme.accent}0e`, border: `0.5px solid ${theme.accent}44`, borderRadius: '6px', padding: '10px 12px', fontFamily: 'monospace', fontSize: '10px', color: theme.accent, marginBottom: '16px', lineHeight: 1.5 }}>
              ⚠ {flagCount} field{flagCount > 1 ? 's are' : ' is'} an AI best-guess — confirm before saving.
            </div>
          )}

          {/* Gun */}
          <ReviewField field="gun" label="Firearm" required value={selectedGun ? gunName(selectedGun) : null} confValue={conf.gun}>
            <input autoFocus style={{ ...inputBase, marginBottom: '6px', background: 'transparent', border: 'none', padding: '0', fontSize: '11px' }}
              placeholder="Search firearms…" value={gunSearch}
              onChange={e => setGunSearch(e.target.value)} />
            <PickerList>
              {filteredGuns.length === 0
                ? <div style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>No matches</div>
                : filteredGuns.map(g => (
                  <PickerRow key={g.id} label={gunName(g)} sub={g.caliber} selected={form.gunId === g.id}
                    onClick={() => { setForm(f => ({ ...f, gunId: g.id })); setConf(c => ({ ...c, gun: 'confirmed' })); setGunSearch(''); setEditingField(null); }} />
                ))}
            </PickerList>
          </ReviewField>

          {/* Rounds */}
          <ReviewField field="rounds" label="Rounds Fired" required value={form.rounds || null} confValue={conf.rounds}>
            <input autoFocus type="number" inputMode="numeric" style={{ ...inputBase, background: 'transparent', border: 'none', padding: '0' }}
              placeholder="e.g. 50" value={form.rounds}
              onChange={e => { setForm(f => ({ ...f, rounds: e.target.value })); setConf(c => ({ ...c, rounds: e.target.value ? 'confirmed' : 'missing' })); }} />
          </ReviewField>

          {/* Ammo */}
          <ReviewField field="ammo" label="Ammo (optional)" value={selectedAmmo ? ammoLabel(selectedAmmo) : null} confValue={conf.ammo}>
            <input autoFocus style={{ ...inputBase, marginBottom: '6px', background: 'transparent', border: 'none', padding: '0', fontSize: '11px' }}
              placeholder="Search inventory…" value={ammoSearch}
              onChange={e => setAmmoSearch(e.target.value)} />
            <PickerList>
              {compatibleAmmo.length === 0
                ? <div style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>No compatible ammo</div>
                : filteredAmmo.map(a => (
                  <PickerRow key={a.id} label={ammoLabel(a)} sub={`qty ${a.quantity}`} selected={form.ammoLotId === a.id}
                    onClick={() => { setForm(f => ({ ...f, ammoLotId: a.id })); setConf(c => ({ ...c, ammo: 'confirmed' })); setAmmoSearch(''); setEditingField(null); }} />
                ))}
            </PickerList>
          </ReviewField>

          {/* Location */}
          <ReviewField field="location" label="Location (optional)" value={form.location || null} confValue={conf.location}>
            <input autoFocus style={{ ...inputBase, background: 'transparent', border: 'none', padding: '0' }}
              placeholder="Range name…" value={form.location}
              onChange={e => { setForm(f => ({ ...f, location: e.target.value })); setConf(c => ({ ...c, location: e.target.value ? 'confirmed' : 'missing' })); }} />
          </ReviewField>

          {/* Notes */}
          <ReviewField field="notes" label="Notes (optional)" value={form.notes || null} confValue={conf.notes}>
            <textarea autoFocus style={{ ...inputBase, background: 'transparent', border: 'none', padding: '0', minHeight: '64px', resize: 'none' }}
              placeholder="Any notes…" value={form.notes}
              onChange={e => { setForm(f => ({ ...f, notes: e.target.value })); setConf(c => ({ ...c, notes: e.target.value ? 'confirmed' : 'missing' })); }} />
          </ReviewField>

          {/* Issues */}
          {form.issues && (
            <div style={{ background: 'rgba(255,107,107,0.07)', border: `0.5px solid ${theme.red}55`, borderRadius: '6px', padding: '12px', marginBottom: '12px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.8px', color: theme.red, textTransform: 'uppercase', marginBottom: '6px' }}>Issue Flagged</div>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textPrimary, lineHeight: 1.5 }}>
                {form.issueDescription || form.issueTypes.join(', ') || 'Issue detected in debrief'}
              </div>
            </div>
          )}

          {/* Deduction preview */}
          {selectedAmmo && form.rounds && parseInt(form.rounds) > 0 && (
            <div style={{ background: theme.surface, border: `0.5px solid ${theme.border}`, borderRadius: '6px', padding: '10px 12px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>Inventory deduction</span>
              <span style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.red, fontWeight: 700 }}>
                −{form.rounds} × {selectedAmmo.brand} {selectedAmmo.productLine}
              </span>
            </div>
          )}

        </div>
        <Footer label="Log Session" enabled={canSave} saving={saving} onPress={() => { if (!saving) { setSaving(true); doSave(); } }} />
      </div>
    );
  }

  // ─── Screen: Quick ────────────────────────────────────────────────────────
  if (screen === 'quick') {
    const filteredGuns = gunSearch
      ? guns.filter(g => gunName(g).toLowerCase().includes(gunSearch.toLowerCase()))
      : guns;
    const filteredAmmo = ammoSearch
      ? compatibleAmmo.filter(a => `${a.brand} ${a.productLine}`.toLowerCase().includes(ammoSearch.toLowerCase()))
      : compatibleAmmo;
    const showGunPicker = editingField === 'gun' || (!selectedGun && guns.length > 0);
    const showAmmoPicker = editingField === 'ammo';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: theme.bg }}>
        <Header title="Quick Log" backLabel="Back" onBack={() => setScreen('select')} />
        <Body>

          {/* Context pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>{fmtDate(form.date)} · {form.env}</span>
            <button onClick={() => setScreen('select')} style={{ background: 'none', border: 'none', color: theme.accent, fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
              Change
            </button>
          </div>

          {/* Gun */}
          <div style={sectionLabel}>Firearm *</div>
          {selectedGun && editingField !== 'gun' ? (
            <div style={{ ...inputBase, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: '16px' }}
              onClick={() => { setGunSearch(''); setEditingField('gun'); }}>
              <span>{gunName(selectedGun)}</span>
              <span style={{ fontSize: '10px', color: theme.textMuted }}>Change</span>
            </div>
          ) : (
            <input style={{ ...inputBase, marginBottom: '4px' }} placeholder="Search firearms…" value={gunSearch}
              onChange={e => { setGunSearch(e.target.value); setEditingField('gun'); }} />
          )}
          {showGunPicker && (
            <PickerList>
              {filteredGuns.length === 0
                ? <div style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>No matches</div>
                : filteredGuns.map(g => (
                  <PickerRow key={g.id} label={gunName(g)} sub={g.caliber} selected={form.gunId === g.id}
                    onClick={() => { setForm(f => ({ ...f, gunId: g.id })); setGunSearch(''); setEditingField(null); }} />
                ))}
            </PickerList>
          )}
          {!showGunPicker && <div style={{ marginBottom: '16px' }} />}

          {/* Rounds */}
          <div style={sectionLabel}>Rounds Fired *</div>
          <input type="number" inputMode="numeric" style={{ ...inputBase, marginBottom: '16px' }}
            placeholder="e.g. 50" value={form.rounds}
            onChange={e => setForm(f => ({ ...f, rounds: e.target.value }))} />

          {/* Ammo */}
          <div style={sectionLabel}>Ammo (optional)</div>
          {selectedAmmo && editingField !== 'ammo' ? (
            <div style={{ ...inputBase, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: '4px' }}
              onClick={() => { setAmmoSearch(''); setEditingField('ammo'); }}>
              <span>{ammoLabel(selectedAmmo)}</span>
              <span style={{ fontSize: '10px', color: theme.textMuted }}>Change</span>
            </div>
          ) : (
            <input style={{ ...inputBase, marginBottom: '4px' }} placeholder="Search ammo inventory…" value={ammoSearch}
              onChange={e => { setAmmoSearch(e.target.value); setEditingField('ammo'); }} />
          )}
          {showAmmoPicker && (
            <PickerList>
              {compatibleAmmo.length === 0
                ? <div style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>No compatible ammo in inventory</div>
                : filteredAmmo.map(a => (
                  <PickerRow key={a.id} label={ammoLabel(a)} sub={`qty ${a.quantity}`} selected={form.ammoLotId === a.id}
                    onClick={() => { setForm(f => ({ ...f, ammoLotId: a.id })); setAmmoSearch(''); setEditingField(null); }} />
                ))}
            </PickerList>
          )}

          {/* Deduction preview */}
          {selectedAmmo && form.rounds && parseInt(form.rounds) > 0 && (
            <div style={{ background: theme.surface, border: `0.5px solid ${theme.border}`, borderRadius: '6px', padding: '10px 12px', marginTop: '10px', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>Inventory deduction</span>
              <span style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.red, fontWeight: 700 }}>
                −{form.rounds} × {selectedAmmo.brand} {selectedAmmo.productLine}
              </span>
            </div>
          )}

        </Body>
        <Footer label="Log Session" enabled={canSave} saving={saving} onPress={() => { if (!saving) { setSaving(true); doSave(); } }} />
      </div>
    );
  }

  // ─── Screen: Confirm ──────────────────────────────────────────────────────
  if (screen === 'confirm') {
    const gun = guns.find(g => g.id === form.gunId);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: theme.bg }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: `${theme.accent}18`, border: `2px solid ${theme.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', marginBottom: '20px' }}>
            ✓
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '13px', letterSpacing: '1.5px', textTransform: 'uppercase', color: theme.textPrimary, marginBottom: '10px' }}>
            Session Logged
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, textAlign: 'center', lineHeight: 1.9 }}>
            {gun && <>{gunName(gun)} · {form.rounds} rounds<br /></>}
            {savedAmmoName && <>Inventory updated<br /></>}
            {form.issues && <span style={{ color: theme.red }}>Issue flagged for follow-up</span>}
          </div>
        </div>
        <div style={{ padding: '12px 20px 24px' }}>
          <button onClick={onSaved} style={{ width: '100%', padding: '12px', background: 'none', border: `0.5px solid ${theme.border}`, borderRadius: '6px', color: theme.textMuted, fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.8px', cursor: 'pointer' }}>
            ← Back to Sessions
          </button>
        </div>
      </div>
    );
  }

  return null;
}
