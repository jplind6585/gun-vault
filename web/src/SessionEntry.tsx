// SessionEntry — rebuilt per session-flow-v2 brief
// Screens: form → confirm | form → mic → review → confirm
//
// Changes from previous version:
// - Starts directly on a form (no mode picker screen)
// - AI Debrief is a small bordered header button (not the primary CTA)
// - "More Details" collapsible for Environment, Purpose, Location, Notes
// - Round count history chips (top 3 from this gun's past sessions)
// - Auto-select ammo when exactly 1 compatible lot is in inventory
// - Post-log maintenance insight on confirm screen
// - No emoji — SVG icons throughout

import { useState, useEffect, useRef } from 'react';
import { theme } from './theme';
import type { Gun, AmmoLot, IssueType, SessionPurpose } from './types';
import { getAllGuns, getAllAmmo, getAllSessions, logSession, updateAmmo, updateGun } from './storage';
import { parseSessionFromText, getFeatureUsageCounts } from './claudeApi';
import { haptic } from './haptic';

type Screen = 'form' | 'mic' | 'review' | 'confirm';
type FieldConf = 'confirmed' | 'flagged' | 'missing';

// Caliber equivalency groups — strings in the same group are treated as compatible
const CALIBER_GROUPS: string[][] = [
  ['5.56 nato', '5.56x45mm', '5.56x45mm nato', '.223 rem', '.223 remington', '.223/5.56', '5.56'],
  ['.308 win', '.308 winchester', '7.62 nato', '7.62x51mm', '7.62x51mm nato', '7.62x51'],
  ['9mm', '9x19mm', '9x19', '9mm luger', '9mm parabellum', '9x19 parabellum'],
  ['.45 acp', '.45 auto'],
  ['.40 s&w', '.40 sw', '40 s&w'],
  ['.38 special', '.38 spl', '.38 spec'],
  ['.357 magnum', '.357 mag'],
  ['.44 magnum', '.44 mag'],
  ['.22 lr', '.22 long rifle', '.22lr'],
  ['6.5 creedmoor', '6.5cm', '6.5 cm'],
  ['300 blackout', '.300 blackout', '.300 blk', '300 blk', '7.62x35mm'],
];

function caliberMatches(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const norm = (s: string) => s.toLowerCase().trim();
  const na = norm(a), nb = norm(b);
  if (na === nb) return true;
  for (const group of CALIBER_GROUPS) {
    if (group.includes(na) && group.includes(nb)) return true;
  }
  return false;
}

const PURPOSE_OPTIONS: SessionPurpose[] = ['Warmup', 'Drills', 'Zeroing', 'Qualification', 'Competition', 'Fun', 'Carry Eval'];

interface FormData {
  date: string;
  env: 'Indoor' | 'Outdoor';
  gunId: string;
  rounds: string;
  ammoLotId: string;
  location: string;
  notes: string;
  purpose: SessionPurpose[];
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
  isPro?: boolean;
  onUpgrade?: (reason: string) => void;
}

const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

// ── Style constants ───────────────────────────────────────────────────────────

const mono = 'monospace';

const fieldLabel: React.CSSProperties = {
  fontFamily: mono,
  fontSize: '9px',
  letterSpacing: '1.2px',
  color: theme.textMuted,
  textTransform: 'uppercase',
  marginBottom: '7px',
  marginTop: '20px',
  display: 'block',
};

const inputBase: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  backgroundColor: theme.surface,
  border: `1px solid ${theme.border}`,
  borderRadius: '4px',
  color: theme.textPrimary,
  fontFamily: mono,
  fontSize: '12px',
  outline: 'none',
  boxSizing: 'border-box',
};

function chipBtn(active: boolean): React.CSSProperties {
  return {
    padding: '8px 14px',
    borderRadius: '4px',
    border: `1px solid ${active ? theme.accent : theme.border}`,
    background: active ? theme.accent : 'transparent',
    color: active ? theme.bg : theme.textSecondary,
    fontFamily: mono,
    fontSize: '11px',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    fontWeight: active ? 700 : 400,
  };
}

function primaryBtn(enabled: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '14px',
    borderRadius: '4px',
    border: 'none',
    background: enabled ? theme.accent : theme.surface,
    color: enabled ? theme.bg : theme.textMuted,
    fontFamily: mono,
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    cursor: enabled ? 'pointer' : 'default',
    transition: 'background 0.15s, color 0.15s',
  };
}

// ── Inline SVG icons ──────────────────────────────────────────────────────────

function MicIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  );
}

function StopIcon({ size = 32, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  );
}

function CheckIcon({ size = 28, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ChevronDownIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ChevronUpIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

function AlertIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

// ── Picker subcomponents ──────────────────────────────────────────────────────

function PickerList({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: theme.surface,
      border: `0.5px solid ${theme.border}`,
      borderRadius: '4px',
      padding: '4px',
      marginTop: '4px',
      marginBottom: '4px',
      maxHeight: '180px',
      overflowY: 'auto',
    }}>
      {children}
    </div>
  );
}

function PickerRow({ label, sub, selected, onClick }: { label: string; sub?: string; selected: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{
      padding: '9px 10px',
      cursor: 'pointer',
      borderRadius: '4px',
      background: selected ? `${theme.accent}22` : 'transparent',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <span style={{ fontFamily: mono, fontSize: '11px', color: selected ? theme.accent : theme.textSecondary }}>{label}</span>
      {sub && <span style={{ fontFamily: mono, fontSize: '10px', color: theme.textMuted }}>{sub}</span>}
    </div>
  );
}

// ── Footer action button ──────────────────────────────────────────────────────

function Footer({ label, enabled, saving, onPress }: { label: string; enabled: boolean; saving: boolean; onPress: () => void }) {
  return (
    <div style={{ padding: '12px 20px 20px', borderTop: `0.5px solid ${theme.border}`, flexShrink: 0 }}>
      <button onClick={onPress} disabled={!enabled || saving} style={primaryBtn(enabled && !saving)}>
        {saving ? 'Saving…' : label}
      </button>
    </div>
  );
}

// ── Review field (AI debrief review screen) ───────────────────────────────────

function ReviewField({
  label, value, confValue, required, editContent,
}: {
  label: string;
  value: string | null;
  confValue: FieldConf;
  required?: boolean;
  editContent: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);

  const borderColor =
    confValue === 'missing' && required ? theme.red
    : confValue === 'flagged' ? theme.accent
    : theme.border;

  const bgColor = confValue === 'flagged' ? `${theme.accent}0a` : theme.surface;

  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ fontFamily: mono, fontSize: '9px', letterSpacing: '1px', color: theme.textMuted, textTransform: 'uppercase' }}>
          {label}
          {confValue === 'flagged' && !editing && (
            <span style={{ color: theme.accent, marginLeft: '6px' }}>◆ REVIEW</span>
          )}
          {confValue === 'missing' && required && (
            <span style={{ color: theme.red, marginLeft: '6px' }}>◆ REQUIRED</span>
          )}
        </span>
        <button onClick={() => setEditing(e => !e)} style={{ background: 'none', border: 'none', color: editing ? theme.accent : theme.textMuted, fontFamily: mono, fontSize: '10px', cursor: 'pointer', padding: '2px 0' }}>
          {editing ? 'Done' : 'Edit'}
        </button>
      </div>
      <div
        onClick={() => { if (!editing) setEditing(true); }}
        style={{ background: bgColor, border: `0.5px solid ${borderColor}`, borderRadius: '4px', padding: '11px 12px', fontFamily: mono, fontSize: '12px', color: value ? theme.textPrimary : theme.textMuted, cursor: editing ? 'default' : 'text' }}
      >
        {editing ? editContent : (value || 'Not detected — tap to edit')}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function SessionEntry({ preselectedGun, onSaved, onCancel, isPro, onUpgrade }: Props) {
  const [guns] = useState<Gun[]>(() => getAllGuns());
  const [ammoLots] = useState<AmmoLot[]>(() => getAllAmmo());

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

  const [screen, setScreen] = useState<Screen>('form');
  const [expanded, setExpanded] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [gunSearch, setGunSearch] = useState('');
  const [ammoSearch, setAmmoSearch] = useState('');
  const [autoSelectedAmmo, setAutoSelectedAmmo] = useState<AmmoLot | null>(null);
  const [historyChips, setHistoryChips] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedAmmoName, setSavedAmmoName] = useState('');
  const [maintenanceInsight, setMaintenanceInsight] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>({
    date: today,
    env: 'Outdoor',
    gunId: preselectedGun?.id ?? '',
    rounds: '',
    ammoLotId: '',
    location: '',
    notes: '',
    purpose: [],
    issues: false,
    issueDescription: '',
    issueTypes: [],
  });

  const [conf, setConf] = useState<ConfMap>({
    gun: 'missing', rounds: 'missing', ammo: 'missing', location: 'missing', notes: 'missing',
  });

  // Mic state
  const [micPhase, setMicPhase] = useState<'idle' | 'listening' | 'processing'>('idle');
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  // Auto-navigate away from confirm after 3s
  useEffect(() => {
    if (screen !== 'confirm') return;
    const t = setTimeout(onSaved, 3000);
    return () => clearTimeout(t);
  }, [screen]);

  // When gun changes: compute history chips + auto-select ammo
  useEffect(() => {
    if (!form.gunId) {
      setHistoryChips([]);
      setAutoSelectedAmmo(null);
      return;
    }

    // Round count history chips
    const sessions = getAllSessions().filter(s => s.gunId === form.gunId);
    const freq: Record<number, number> = {};
    sessions.forEach(s => { freq[s.roundsExpended] = (freq[s.roundsExpended] || 0) + 1; });
    const chips = Object.entries(freq)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 3)
      .map(([r]) => Number(r))
      .sort((a, b) => a - b);
    setHistoryChips(chips);

    // Auto-select ammo if exactly 1 compatible lot
    const gun = guns.find(g => g.id === form.gunId);
    if (gun) {
      const compatible = ammoLots.filter(a => caliberMatches(a.caliber, gun.caliber));
      if (compatible.length === 1 && !form.ammoLotId) {
        setForm(f => ({ ...f, ammoLotId: compatible[0].id }));
        setAutoSelectedAmmo(compatible[0]);
      } else {
        setAutoSelectedAmmo(null);
      }
    }
  }, [form.gunId]);

  // ── Derived ────────────────────────────────────────────────────────────────

  function gunName(g: Gun) { return g.displayName || `${g.make} ${g.model}`; }
  function ammoLabel(a: AmmoLot) { return `${a.brand} ${a.productLine} ${a.grainWeight}gr`; }
  function fmtDate(iso: string) { const [y, m, d] = iso.split('-'); return `${m}/${d}/${y}`; }

  const selectedGun = guns.find(g => g.id === form.gunId) ?? null;
  const compatibleAmmo = selectedGun
    ? ammoLots.filter(a => caliberMatches(a.caliber, selectedGun.caliber))
    : ammoLots;
  const selectedAmmo = ammoLots.find(a => a.id === form.ammoLotId) ?? null;
  const canSave = !!form.gunId && !!form.rounds && parseInt(form.rounds) > 0;

  const filteredGuns = gunSearch
    ? guns.filter(g => gunName(g).toLowerCase().includes(gunSearch.toLowerCase()))
    : guns;
  const filteredAmmo = ammoSearch
    ? compatibleAmmo.filter(a => ammoLabel(a).toLowerCase().includes(ammoSearch.toLowerCase()))
    : compatibleAmmo;

  const showGunPicker = editingField === 'gun' || (!selectedGun && guns.length > 0);
  const showAmmoPicker = editingField === 'ammo';

  function togglePurpose(p: SessionPurpose) {
    setForm(f => ({
      ...f,
      purpose: f.purpose.includes(p) ? f.purpose.filter(x => x !== p) : [...f.purpose, p],
    }));
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  function doSave() {
    const rounds = parseInt(form.rounds);
    const gun = guns.find(g => g.id === form.gunId);
    if (!gun || !rounds || rounds <= 0) { setSaving(false); return; }

    logSession({
      gunId: gun.id,
      date: form.date,
      roundsExpended: rounds,
      ammoLotId: selectedAmmo?.id,
      location: form.location || undefined,
      indoorOutdoor: form.env,
      purpose: form.purpose.length ? form.purpose : undefined,
      issues: form.issues,
      issueTypes: form.issues && form.issueTypes.length ? form.issueTypes : undefined,
      issueDescription: form.issues ? form.issueDescription || undefined : undefined,
      notes: form.notes || undefined,
    });

    if (selectedAmmo && rounds > 0) {
      updateAmmo(selectedAmmo.id, { quantity: Math.max(0, selectedAmmo.quantity - rounds) });
      setSavedAmmoName(ammoLabel(selectedAmmo));
    }

    if (form.issues && form.issueDescription) {
      const existing = gun.openIssues ? gun.openIssues + '\n' : '';
      updateGun(gun.id, { openIssues: existing + `${form.date}: ${form.issueDescription}` });
    }

    // Maintenance insight: check rounds since last cleaning
    const updatedCount = (gun.roundCount ?? 0) + rounds;
    if (gun.lastCleanedRoundCount !== undefined) {
      const sinceCleaning = updatedCount - gun.lastCleanedRoundCount;
      if (sinceCleaning >= 500) {
        setMaintenanceInsight(`${sinceCleaning.toLocaleString()} rounds since last cleaning — service recommended.`);
      } else if (sinceCleaning >= 450) {
        setMaintenanceInsight(`${500 - sinceCleaning} rounds until 500-round cleaning interval.`);
      }
    }

    haptic('success');
    setSaving(false);
    setScreen('confirm');
  }

  // ── Mic / AI ──────────────────────────────────────────────────────────────

  const stoppedIntentionallyRef = useRef(false);

  function startListening() {
    if (!SpeechRecognition) {
      setScreen('form');
      return;
    }
    stoppedIntentionallyRef.current = false;
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
      if (!stoppedIntentionallyRef.current) {
        // Browser stopped due to a breath pause — restart transparently
        try { r.start(); } catch { /* recognition already restarting */ }
        return;
      }
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
    stoppedIntentionallyRef.current = true;
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

  // ── SCREEN: Form ─────────────────────────────────────────────────────────

  if (screen === 'form') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: theme.bg }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '18px 20px 14px', position: 'relative',
          borderBottom: `0.5px solid ${theme.border}`, flexShrink: 0,
        }}>
          <button onClick={onCancel} style={{
            position: 'absolute', left: 16, background: 'none', border: 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
            color: theme.accent, fontFamily: mono, fontSize: '11px', padding: '4px 0',
          }}>
            ‹ Sessions
          </button>
          <span style={{ fontFamily: mono, fontSize: '11px', letterSpacing: '2px', color: theme.textSecondary, textTransform: 'uppercase' }}>
            New Session
          </span>
          {/* Secondary: Debrief button — subtle, top-right */}
          <button
            onClick={() => { setMicPhase('idle'); setTranscript(''); setScreen('mic'); }}
            style={{
              position: 'absolute', right: 16,
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none',
              border: `1px solid ${theme.border}`,
              borderRadius: '4px',
              padding: '6px 10px',
              cursor: 'pointer',
              color: theme.textSecondary,
              fontFamily: mono,
              fontSize: '10px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}
          >
            <MicIcon size={12} color={theme.accent} />
            Debrief
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>

          {/* ── FIREARM ── */}
          <span style={{ ...fieldLabel, marginTop: '20px' }}>Firearm</span>
          {selectedGun && editingField !== 'gun' ? (
            <div
              onClick={() => { setGunSearch(''); setEditingField('gun'); }}
              style={{ ...inputBase, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            >
              <span>{gunName(selectedGun)}</span>
              <span style={{ fontSize: '10px', color: theme.textMuted }}>Change</span>
            </div>
          ) : (
            <input
              style={inputBase}
              placeholder="Search or select firearm..."
              value={gunSearch}
              onChange={e => { setGunSearch(e.target.value); setEditingField('gun'); }}
            />
          )}
          {showGunPicker && (
            <PickerList>
              {filteredGuns.length === 0
                ? <div style={{ padding: '8px 10px', fontFamily: mono, fontSize: '10px', color: theme.textMuted }}>No matches</div>
                : filteredGuns.map(g => (
                  <PickerRow key={g.id} label={gunName(g)} sub={g.caliber} selected={form.gunId === g.id}
                    onClick={() => { setForm(f => ({ ...f, gunId: g.id })); setGunSearch(''); setEditingField(null); }} />
                ))}
            </PickerList>
          )}

          {/* ── ROUNDS FIRED ── */}
          <span style={fieldLabel}>Rounds Fired</span>
          <input
            type="number"
            inputMode="numeric"
            style={inputBase}
            placeholder="e.g. 50"
            value={form.rounds}
            onChange={e => setForm(f => ({ ...f, rounds: e.target.value }))}
          />
          {/* History chips — top round counts from this gun's past sessions */}
          {historyChips.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              {historyChips.map(n => (
                <button
                  key={n}
                  onClick={() => setForm(f => ({ ...f, rounds: String(n) }))}
                  style={{
                    ...chipBtn(form.rounds === String(n)),
                    padding: '6px 12px',
                    fontSize: '10px',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          )}

          {/* ── AMMO ── */}
          <span style={fieldLabel}>Ammo (optional)</span>
          {autoSelectedAmmo && !editingField && (
            <div style={{
              fontFamily: mono, fontSize: '9px', letterSpacing: '0.5px',
              color: theme.accent, marginBottom: '6px', opacity: 0.8,
            }}>
              Auto-selected: {autoSelectedAmmo.brand} {autoSelectedAmmo.productLine} · {autoSelectedAmmo.quantity} remaining
            </div>
          )}
          {selectedAmmo && editingField !== 'ammo' ? (
            <div
              onClick={() => { setAmmoSearch(''); setEditingField('ammo'); }}
              style={{ ...inputBase, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            >
              <span>{ammoLabel(selectedAmmo)}</span>
              <span style={{ fontSize: '10px', color: theme.textMuted }}>Change</span>
            </div>
          ) : (
            <input
              style={inputBase}
              placeholder="Search ammo inventory..."
              value={ammoSearch}
              onFocus={() => setEditingField('ammo')}
              onChange={e => { setAmmoSearch(e.target.value); setEditingField('ammo'); }}
            />
          )}
          {showAmmoPicker && (
            <PickerList>
              {compatibleAmmo.length === 0
                ? <div style={{ padding: '8px 10px', fontFamily: mono, fontSize: '10px', color: theme.textMuted }}>No compatible ammo in inventory</div>
                : filteredAmmo.map(a => (
                  <PickerRow key={a.id} label={ammoLabel(a)} sub={`${a.caliber ?? ''}  ·  ${a.quantity} remaining`} selected={form.ammoLotId === a.id}
                    onClick={() => { setForm(f => ({ ...f, ammoLotId: a.id })); setAutoSelectedAmmo(null); setAmmoSearch(''); setEditingField(null); }} />
                ))}
            </PickerList>
          )}

          {/* ── DATE ── */}
          <span style={fieldLabel}>Date</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={chipBtn(form.date === today)} onClick={() => setForm(f => ({ ...f, date: today }))}>Today</button>
            <button style={chipBtn(form.date === yesterday)} onClick={() => setForm(f => ({ ...f, date: yesterday }))}>Yesterday</button>
          </div>

          {/* ── INVENTORY DEDUCTION PREVIEW ── */}
          {selectedAmmo && form.rounds && parseInt(form.rounds) > 0 && (
            <div style={{
              background: theme.surface,
              border: `0.5px solid ${theme.border}`,
              borderRadius: '4px',
              padding: '10px 12px',
              marginTop: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontFamily: mono, fontSize: '10px', color: theme.textMuted }}>Inventory deduction</span>
              <span style={{ fontFamily: mono, fontSize: '11px', color: theme.red, fontWeight: 700 }}>
                −{form.rounds} × {selectedAmmo.brand} {selectedAmmo.productLine}
              </span>
            </div>
          )}

          {/* ── MORE DETAILS ── */}
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              width: '100%',
              marginTop: '20px',
              background: 'none',
              border: 'none',
              borderTop: `1px solid ${theme.border}`,
              borderBottom: expanded ? 'none' : `1px solid ${theme.border}`,
              padding: '12px 0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: theme.textMuted,
              fontFamily: mono,
              fontSize: '10px',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
            }}
          >
            More Details
            {expanded ? <ChevronUpIcon color={theme.textMuted} /> : <ChevronDownIcon color={theme.textMuted} />}
          </button>

          {expanded && (
            <div style={{ paddingBottom: '8px' }}>

              {/* Location */}
              <span style={fieldLabel}>Location</span>
              <input
                style={inputBase}
                placeholder="Range name or location..."
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              />

              {/* Environment */}
              <span style={fieldLabel}>Environment</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={chipBtn(form.env === 'Indoor')} onClick={() => setForm(f => ({ ...f, env: 'Indoor' }))}>Indoor</button>
                <button style={chipBtn(form.env === 'Outdoor')} onClick={() => setForm(f => ({ ...f, env: 'Outdoor' }))}>Outdoor</button>
              </div>

              {/* Purpose */}
              <span style={fieldLabel}>Purpose</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {PURPOSE_OPTIONS.map(p => (
                  <button key={p} style={{ ...chipBtn(form.purpose.includes(p)), fontSize: '10px', padding: '7px 12px' }} onClick={() => togglePurpose(p)}>
                    {p}
                  </button>
                ))}
              </div>

              {/* Notes */}
              <span style={fieldLabel}>Notes</span>
              <textarea
                style={{ ...inputBase, minHeight: '72px', resize: 'vertical', lineHeight: 1.6 }}
                placeholder="Anything worth logging..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
          )}

        </div>

        <Footer label="Log Session" enabled={canSave} saving={saving} onPress={() => { if (!saving) { setSaving(true); doSave(); } }} />
      </div>
    );
  }

  // ── SCREEN: Mic ──────────────────────────────────────────────────────────

  if (screen === 'mic') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: theme.bg }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '18px 20px 14px', position: 'relative',
          borderBottom: `0.5px solid ${theme.border}`, flexShrink: 0,
        }}>
          <button onClick={() => { stoppedIntentionallyRef.current = true; recognitionRef.current?.stop(); setScreen('form'); setMicPhase('idle'); setTranscript(''); }} style={{
            position: 'absolute', left: 16, background: 'none', border: 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
            color: theme.accent, fontFamily: mono, fontSize: '11px', padding: '4px 0',
          }}>
            ‹ Cancel
          </button>
          <span style={{ fontFamily: mono, fontSize: '11px', letterSpacing: '2px', color: theme.textSecondary, textTransform: 'uppercase' }}>
            AI Debrief
          </span>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
          <div style={{
            fontFamily: mono,
            fontSize: micPhase === 'listening' ? '11px' : '10px',
            letterSpacing: '1.2px',
            color: micPhase === 'listening' ? theme.accent : micPhase === 'processing' ? theme.textSecondary : theme.textMuted,
            textTransform: 'uppercase',
            marginBottom: '48px',
            textAlign: 'center',
            lineHeight: 1.8,
            minHeight: '44px',
          }}>
            {micPhase === 'idle' && 'Talk through your session.\nAI will parse and log everything.'}
            {micPhase === 'listening' && (
              <>
                Listening…
                {transcript && (
                  <div style={{ fontFamily: mono, fontSize: '10px', color: theme.textMuted, marginTop: '10px', fontStyle: 'italic', maxWidth: '280px', lineHeight: 1.6, textTransform: 'none', letterSpacing: 0 }}>
                    {transcript}
                  </div>
                )}
              </>
            )}
            {micPhase === 'processing' && 'Parsing session…'}
          </div>

          <button
            onClick={micPhase === 'idle' ? startListening : micPhase === 'listening' ? stopListening : undefined}
            disabled={micPhase === 'processing'}
            style={{
              width: 96, height: 96, borderRadius: '50%',
              background: micPhase === 'listening' ? theme.accent : theme.surface,
              border: `2px solid ${micPhase === 'listening' ? theme.accent : theme.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: micPhase === 'processing' ? 'default' : 'pointer',
              boxShadow: micPhase === 'listening' ? `0 0 32px ${theme.accent}44` : 'none',
              transition: 'all 0.2s',
            }}
          >
            {micPhase === 'listening'
              ? <StopIcon size={32} color={theme.bg} />
              : <MicIcon size={34} color={micPhase === 'processing' ? theme.textMuted : theme.accent} />
            }
          </button>

          <div style={{ fontFamily: mono, fontSize: '9px', color: theme.textMuted, marginTop: '14px', letterSpacing: '1px', textTransform: 'uppercase' }}>
            {micPhase === 'idle' && 'Tap to start'}
            {micPhase === 'listening' && 'Tap to stop'}
          </div>

          {/* Free-tier usage indicator — shown when ≤2 debriefs remain this month */}
          {micPhase === 'idle' && !isPro && (() => {
            const used = getFeatureUsageCounts().narrative;
            if (used < 3) return null;
            const remaining = Math.max(0, 5 - used);
            return (
              <div style={{ marginTop: '20px', padding: '10px 14px', borderRadius: '8px', backgroundColor: theme.surface, border: `0.5px solid ${remaining === 0 ? theme.orange : theme.border}`, textAlign: 'center' }}>
                <span style={{ fontFamily: mono, fontSize: '11px', color: remaining === 0 ? theme.orange : theme.textSecondary }}>
                  {remaining === 0 ? '0 of 5 free AI debriefs left this month — ' : `${remaining} of 5 free AI debriefs left this month — `}
                </span>
                <button onClick={() => onUpgrade?.('narrative_limit')} style={{ background: 'none', border: 'none', padding: 0, fontFamily: mono, fontSize: '11px', color: theme.accent, cursor: 'pointer', textDecoration: 'underline' }}>
                  Upgrade for unlimited
                </button>
              </div>
            );
          })()}
        </div>
      </div>
    );
  }

  // ── SCREEN: Review ────────────────────────────────────────────────────────

  if (screen === 'review') {
    const flagCount = Object.values(conf).filter(v => v === 'flagged').length;
    const missingRequired = (conf.gun === 'missing' || conf.rounds === 'missing');

    const reviewFilteredGuns = gunSearch
      ? guns.filter(g => gunName(g).toLowerCase().includes(gunSearch.toLowerCase()))
      : guns;
    const reviewFilteredAmmo = ammoSearch
      ? compatibleAmmo.filter(a => ammoLabel(a).toLowerCase().includes(ammoSearch.toLowerCase()))
      : compatibleAmmo;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: theme.bg }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '18px 20px 14px', position: 'relative',
          borderBottom: `0.5px solid ${theme.border}`, flexShrink: 0,
        }}>
          <button onClick={() => { setScreen('mic'); setMicPhase('idle'); setTranscript(''); }} style={{
            position: 'absolute', left: 16, background: 'none', border: 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
            color: theme.accent, fontFamily: mono, fontSize: '11px', padding: '4px 0',
          }}>
            ‹ Re-record
          </button>
          <span style={{ fontFamily: mono, fontSize: '11px', letterSpacing: '2px', color: theme.textSecondary, textTransform: 'uppercase' }}>
            Review Session
          </span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 8px' }}>

          {flagCount > 0 && (
            <div style={{
              background: `${theme.accent}0e`, border: `0.5px solid ${theme.accent}44`,
              borderRadius: '4px', padding: '10px 12px',
              fontFamily: mono, fontSize: '10px', color: theme.accent,
              marginBottom: '16px', lineHeight: 1.5,
              display: 'flex', gap: '10px', alignItems: 'flex-start',
            }}>
              <AlertIcon size={14} color={theme.accent} />
              {flagCount} field{flagCount > 1 ? 's' : ''} flagged. AI made its best guess — confirm before logging.
            </div>
          )}

          <ReviewField
            label="Firearm" value={selectedGun ? gunName(selectedGun) : null}
            confValue={conf.gun} required
            editContent={
              <>
                <input autoFocus style={{ ...inputBase, background: 'transparent', border: 'none', padding: '0', fontSize: '11px', marginBottom: '6px' }}
                  placeholder="Search firearms…" value={gunSearch} onChange={e => setGunSearch(e.target.value)} />
                <PickerList>
                  {reviewFilteredGuns.map(g => (
                    <PickerRow key={g.id} label={gunName(g)} sub={g.caliber} selected={form.gunId === g.id}
                      onClick={() => { setForm(f => ({ ...f, gunId: g.id })); setConf(c => ({ ...c, gun: 'confirmed' })); setGunSearch(''); }} />
                  ))}
                </PickerList>
              </>
            }
          />

          <ReviewField
            label="Rounds Fired" value={form.rounds || null}
            confValue={conf.rounds} required
            editContent={
              <input autoFocus type="number" inputMode="numeric" style={{ ...inputBase, background: 'transparent', border: 'none', padding: '0' }}
                placeholder="e.g. 50" value={form.rounds}
                onChange={e => { setForm(f => ({ ...f, rounds: e.target.value })); setConf(c => ({ ...c, rounds: e.target.value ? 'confirmed' : 'missing' })); }} />
            }
          />

          <ReviewField
            label="Ammo (optional)" value={selectedAmmo ? ammoLabel(selectedAmmo) : null}
            confValue={conf.ammo}
            editContent={
              <>
                <input autoFocus style={{ ...inputBase, background: 'transparent', border: 'none', padding: '0', fontSize: '11px', marginBottom: '6px' }}
                  placeholder="Search inventory…" value={ammoSearch} onChange={e => setAmmoSearch(e.target.value)} />
                <PickerList>
                  {reviewFilteredAmmo.map(a => (
                    <PickerRow key={a.id} label={ammoLabel(a)} sub={`${a.caliber ?? ''}  ·  ${a.quantity} remaining`} selected={form.ammoLotId === a.id}
                      onClick={() => { setForm(f => ({ ...f, ammoLotId: a.id })); setConf(c => ({ ...c, ammo: 'confirmed' })); setAmmoSearch(''); }} />
                  ))}
                </PickerList>
              </>
            }
          />

          <ReviewField
            label="Location (optional)" value={form.location || null}
            confValue={conf.location}
            editContent={
              <input autoFocus style={{ ...inputBase, background: 'transparent', border: 'none', padding: '0' }}
                placeholder="Range name…" value={form.location}
                onChange={e => { setForm(f => ({ ...f, location: e.target.value })); setConf(c => ({ ...c, location: e.target.value ? 'confirmed' : 'missing' })); }} />
            }
          />

          <ReviewField
            label="Notes (optional)" value={form.notes || null}
            confValue={conf.notes}
            editContent={
              <textarea autoFocus style={{ ...inputBase, background: 'transparent', border: 'none', padding: '0', minHeight: '64px', resize: 'none' }}
                placeholder="Any notes…" value={form.notes}
                onChange={e => { setForm(f => ({ ...f, notes: e.target.value })); setConf(c => ({ ...c, notes: e.target.value ? 'confirmed' : 'missing' })); }} />
            }
          />

          {form.issues && (
            <div style={{ background: 'rgba(255,107,107,0.07)', border: `0.5px solid ${theme.red}55`, borderRadius: '4px', padding: '12px', marginBottom: '12px' }}>
              <div style={{ fontFamily: mono, fontSize: '9px', letterSpacing: '1px', color: theme.red, textTransform: 'uppercase', marginBottom: '6px' }}>Issue Flagged</div>
              <div style={{ fontFamily: mono, fontSize: '11px', color: theme.textPrimary, lineHeight: 1.5 }}>
                {form.issueDescription || form.issueTypes.join(', ') || 'Issue detected in debrief'}
              </div>
            </div>
          )}

          {selectedAmmo && form.rounds && parseInt(form.rounds) > 0 && (
            <div style={{ background: theme.surface, border: `0.5px solid ${theme.border}`, borderRadius: '4px', padding: '10px 12px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: mono, fontSize: '10px', color: theme.textMuted }}>Inventory deduction</span>
              <span style={{ fontFamily: mono, fontSize: '11px', color: theme.red, fontWeight: 700 }}>
                −{form.rounds} × {selectedAmmo.brand} {selectedAmmo.productLine}
              </span>
            </div>
          )}

        </div>

        <Footer
          label="Log Session"
          enabled={canSave}
          saving={saving}
          onPress={() => { if (!saving) { setSaving(true); doSave(); } }}
        />
      </div>
    );
  }

  // ── SCREEN: Confirm ───────────────────────────────────────────────────────

  if (screen === 'confirm') {
    const gun = guns.find(g => g.id === form.gunId);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: theme.bg }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>

          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: `${theme.accent}18`,
            border: `2px solid ${theme.accent}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '20px',
          }}>
            <CheckIcon size={28} color={theme.accent} />
          </div>

          <div style={{ fontFamily: mono, fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase', color: theme.textPrimary, marginBottom: '10px' }}>
            Session Logged
          </div>

          <div style={{ fontFamily: mono, fontSize: '11px', color: theme.textMuted, textAlign: 'center', lineHeight: 2 }}>
            {gun && <>{gunName(gun)} · {form.rounds} rounds<br /></>}
            {savedAmmoName && <>Inventory updated<br /></>}
            {form.issues && <span style={{ color: theme.red }}>Issue flagged for follow-up<br /></span>}
          </div>

          {/* Maintenance insight */}
          {maintenanceInsight && (
            <div style={{
              marginTop: '20px',
              background: `${theme.orange ?? '#ff9f43'}12`,
              border: `0.5px solid ${theme.orange ?? '#ff9f43'}55`,
              borderRadius: '4px',
              padding: '10px 14px',
              fontFamily: mono,
              fontSize: '10px',
              color: theme.orange ?? '#ff9f43',
              letterSpacing: '0.5px',
              lineHeight: 1.6,
              maxWidth: '280px',
              textAlign: 'center',
            }}>
              {maintenanceInsight}
            </div>
          )}

        </div>

        <div style={{ padding: '12px 20px 24px' }}>
          <button onClick={onSaved} style={{
            width: '100%', padding: '12px', background: 'none',
            border: `0.5px solid ${theme.border}`, borderRadius: '4px',
            color: theme.textMuted, fontFamily: mono, fontSize: '10px',
            letterSpacing: '1px', cursor: 'pointer', textTransform: 'uppercase',
          }}>
            ← Back to Sessions
          </button>
        </div>
      </div>
    );
  }

  return null;
}
