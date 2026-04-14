import React, { useState, useRef, useEffect } from 'react';
import { theme } from './theme';
import type { Gun } from './types';
import { lookupGunSpec, suggestMakes, suggestModels } from './gunDatabase';
import { getSettings } from './SettingsPanel';

const LRU_KEY = 'lru_calibers';
const DEFAULT_LRU = ['9mm', '5.56 NATO', '.308 Win', '.22 LR'];

function getLruCalibers(): string[] {
  try {
    const raw = localStorage.getItem(LRU_KEY);
    if (!raw) return DEFAULT_LRU;
    const parsed: string[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_LRU;
    // Pad with defaults if fewer than 4
    const merged = [...parsed];
    for (const d of DEFAULT_LRU) {
      if (merged.length >= 4) break;
      if (!merged.includes(d)) merged.push(d);
    }
    return merged;
  } catch {
    return DEFAULT_LRU;
  }
}

function saveLruCaliber(caliber: string): void {
  try {
    const current = getLruCalibers();
    const deduped = [caliber, ...current.filter(c => c !== caliber)].slice(0, 10);
    localStorage.setItem(LRU_KEY, JSON.stringify(deduped));
  } catch {
    // ignore localStorage errors
  }
}

interface AddGunFormProps {
  onSave: (gunData: Partial<Gun>) => void;
  onCancel: () => void;
}

const TYPES: Gun['type'][] = ['Pistol', 'Rifle', 'Shotgun', 'Suppressor', 'NFA'];
const ACTIONS: Gun['action'][] = ['Semi-Auto', 'Bolt', 'Lever', 'Pump', 'Revolver', 'Break', 'Single Shot'];


const CONDITIONS: NonNullable<Gun['condition']>[] = ['New', 'Excellent', 'Very Good', 'Good', 'Fair', 'Poor'];
const STATUSES: Gun['status'][] = ['Active', 'Stored', 'Loaned Out', 'Awaiting Repair', 'Sold'];

export function AddGunForm({ onSave, onCancel }: AddGunFormProps) {
  // Required
  const [displayName, setDisplayName] = useState('');
  const [make, setMake]       = useState('');
  const [model, setModel]     = useState('');
  const [caliber, setCaliber] = useState('');
  const [type, setType]       = useState<Gun['type'] | null>(null);
  const [action, setAction]   = useState<Gun['action'] | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [lruCalibers, setLruCalibers] = useState<string[]>(() => getLruCalibers());

  // Autocomplete state
  const [makeSuggestions, setMakeSuggestions] = useState<string[]>([]);
  const [modelSuggestions, setModelSuggestions] = useState<string[]>([]);
  const [showMakeSugg, setShowMakeSugg] = useState(false);
  const [showModelSugg, setShowModelSugg] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);

  // Condition & status
  const [condition, setCondition]   = useState<NonNullable<Gun['condition']> | null>(null);
  const [status, setStatus]         = useState<Gun['status']>('Active');

  // Acquisition
  const [acquiredDate, setAcquiredDate]   = useState('');

  function normalizeDate(raw: string): string {
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 7) {
      // MDDYYYY → MM/DD/YYYY
      return `0${digits[0]}/${digits[1]}${digits[2]}/${digits.slice(3)}`;
    }
    if (digits.length === 8) {
      // MMDDYYYY → MM/DD/YYYY
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    }
    return raw;
  }
  const [acquiredPrice, setAcquiredPrice] = useState('');
  const [acquiredFrom, setAcquiredFrom]   = useState('');

  // Details
  const [serialNumber, setSerialNumber] = useState('');
  const [barrelLength, setBarrelLength] = useState('');
  const [notes, setNotes]               = useState('');

  // NFA
  const [nfaItem, setNfaItem]             = useState(false);
  const [suppressorHost, setSuppressorHost] = useState(false);

  // Receipt
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const receiptRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const isValid = make.trim() && model.trim() && caliber.trim() && type && action;

  // Auto-suggest makes as user types
  useEffect(() => {
    const sugg = suggestMakes(make);
    setMakeSuggestions(sugg);
    setShowMakeSugg(sugg.length > 0 && make.length > 0);
  }, [make]);

  // Auto-suggest models as user types
  useEffect(() => {
    const sugg = suggestModels(make, model);
    setModelSuggestions(sugg);
    setShowModelSugg(sugg.length > 0 && model.length > 0);
  }, [make, model]);

  // Auto-fill caliber/type/action when make+model match a known gun
  useEffect(() => {
    if (!make || !model) { setAutoFilled(false); return; }
    const spec = lookupGunSpec(make, model);
    if (spec) {
      setCaliber(spec.caliber);
      setType(spec.type);
      setAction(spec.action);
      setAutoFilled(true);
    } else {
      setAutoFilled(false);
    }
  }, [make, model]);

  function handleMakeSelect(m: string) {
    setMake(m);
    setShowMakeSugg(false);
    setModel('');
    setCaliber(''); setType(null); setAction(null);
  }

  function handleModelSelect(m: string) {
    setModel(m);
    setShowModelSugg(false);
  }

  function handleReceiptFile(file: File) {
    const reader = new FileReader();
    reader.onload = e => setReceiptPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    // Update LRU calibers
    if (caliber.trim()) {
      saveLruCaliber(caliber.trim());
      setLruCalibers(getLruCalibers());
    }

    onSave({
      make: make.trim(),
      model: model.trim(),
      displayName: displayName.trim() || undefined,
      caliber: caliber.trim(),
      type: type!,
      action: action!,
      condition: condition ?? undefined,
      status,
      serialNumber: serialNumber.trim() || undefined,
      acquiredDate: acquiredDate.trim() || undefined,
      acquiredPrice: acquiredPrice ? parseFloat(acquiredPrice) : undefined,
      acquiredFrom: acquiredFrom.trim() || undefined,
      barrelLength: barrelLength ? parseFloat(barrelLength) : undefined,
      notes: notes.trim() || undefined,
      nfaItem,
      suppressorHost,
      receiptImageUrl: receiptPreview || undefined,
    });
  }

  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <span style={styles.headerTitle}>ADD FIREARM</span>
          <button style={styles.closeBtn} onClick={onCancel} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={styles.body}>

            {/* ── BASIC FIELDS (always shown) ── */}
            <SectionHeader title="Basic Info" note="* required" />

            {/* Display Name */}
            <Field label="Display Name (optional)">
              <input
                style={styles.input}
                placeholder="e.g. P365 Macro - Daily Carry"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                autoCapitalize="words"
                autoComplete="off"
              />
            </Field>

            {/* Make with autocomplete */}
            <div style={{ marginBottom: '14px', position: 'relative' }}>
              <label style={styles.fieldLabel}>Make *</label>
              <input
                style={styles.input}
                placeholder="e.g. Glock, Sig Sauer, S&W..."
                value={make}
                onChange={e => setMake(e.target.value)}
                onBlur={() => setTimeout(() => setShowMakeSugg(false), 150)}
                autoCapitalize="words"
                autoComplete="off"
              />
              {showMakeSugg && (
                <div style={styles.dropdown}>
                  {makeSuggestions.map(s => (
                    <button key={s} type="button" onMouseDown={() => handleMakeSelect(s)} style={styles.dropdownItem}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Model with autocomplete */}
            <div style={{ marginBottom: '14px', position: 'relative' }}>
              <label style={styles.fieldLabel}>Model *</label>
              <input
                style={styles.input}
                placeholder="e.g. G19 Gen5, P320 Compact..."
                value={model}
                onChange={e => setModel(e.target.value)}
                onBlur={() => setTimeout(() => setShowModelSugg(false), 150)}
                autoCapitalize="words"
                autoComplete="off"
              />
              {showModelSugg && (
                <div style={styles.dropdown}>
                  {modelSuggestions.map(s => (
                    <button key={s} type="button" onMouseDown={() => handleModelSelect(s)} style={styles.dropdownItem}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Field label="Caliber *">
              <div style={{ position: 'relative' }}>
                <input
                  style={{ ...styles.input, borderColor: autoFilled ? theme.accent : undefined }}
                  placeholder="e.g. 9mm, .308 Win, 12 Gauge"
                  value={caliber}
                  onChange={e => { setCaliber(e.target.value); setAutoFilled(false); }}
                />
                {autoFilled && (
                  <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontFamily: 'monospace', fontSize: '8px', color: theme.accent, letterSpacing: '0.5px' }}>AUTO</span>
                )}
              </div>
              {/* LRU caliber quick-pick buttons — 4 equal-width */}
              {!caliber && (
                <div style={{ display: 'flex', gap: '5px', marginTop: '6px' }}>
                  {lruCalibers.slice(0, 4).map(s => (
                    <button key={s} type="button" onClick={() => { setCaliber(s); setAutoFilled(false); }} style={{
                      flex: 1, padding: '7px 4px', borderRadius: '3px', border: '0.5px solid ' + theme.border,
                      backgroundColor: theme.surface, color: theme.textSecondary,
                      fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer',
                      textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </Field>

            <Field label="Type *">
              <ChipGroup options={TYPES} selected={type} onSelect={v => setType(v as Gun['type'])} autoHighlight={autoFilled} />
            </Field>

            <Field label="Action *">
              <ChipGroup options={ACTIONS} selected={action} onSelect={v => setAction(v as Gun['action'])} autoHighlight={autoFilled} />
            </Field>

            {/* ── ADVANCED TOGGLE ── */}
            {!showAdvanced && (
              <button
                type="button"
                onClick={() => setShowAdvanced(true)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'monospace', fontSize: '10px',
                  color: 'rgba(255,212,59,0.7)', letterSpacing: '0.5px',
                  padding: '8px 0', marginBottom: '8px', textAlign: 'left',
                }}
              >
                + SHOW ADVANCED
              </button>
            )}

            {/* ── ADVANCED SECTION (collapsed by default) ── */}
            {showAdvanced && (
              <>

            {/* ── CONDITION & STATUS ── */}
            <SectionHeader title="Condition & Status" />

            <Field label="Condition">
              <ChipGroup options={CONDITIONS} selected={condition} onSelect={v => setCondition(v as NonNullable<Gun['condition']>)} />
            </Field>

            <Field label="Status">
              <ChipGroup options={STATUSES} selected={status} onSelect={v => setStatus(v as Gun['status'])} />
            </Field>

            {/* ── ACQUISITION ── */}
            <SectionHeader title="Acquisition" />

            <div style={styles.row}>
              <Field label="Date Acquired">
                <input
                  style={styles.input}
                  type="text"
                  placeholder="MM/DD/YYYY"
                  value={acquiredDate}
                  onChange={e => setAcquiredDate(e.target.value)}
                  onBlur={e => setAcquiredDate(normalizeDate(e.target.value))}
                  inputMode="numeric"
                />
              </Field>
              <Field label="Purchase Price ($)">
                <input
                  style={{ ...styles.input, fontFamily: 'monospace' }}
                  placeholder="0.00"
                  type="number"
                  min="0"
                  step="0.01"
                  value={acquiredPrice}
                  onChange={e => setAcquiredPrice(e.target.value)}
                />
              </Field>
            </div>

            <Field label="Acquired From">
              <input
                style={styles.input}
                placeholder="e.g. Local Gun Store, Private Sale, Online"
                value={acquiredFrom}
                onChange={e => setAcquiredFrom(e.target.value)}
              />
            </Field>

            {/* Receipt upload */}
            <div style={{ marginBottom: '14px' }}>
              <label style={styles.fieldLabel}>Receipt / Photo <span style={{ color: theme.textMuted, fontWeight: 400 }}>(optional)</span></label>
              {receiptPreview ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={receiptPreview} alt="Receipt" style={{ maxWidth: '100%', maxHeight: '120px', borderRadius: '6px', border: `0.5px solid ${theme.border}` }} />
                  <button type="button" onClick={() => setReceiptPreview(null)} style={{
                    position: 'absolute', top: '4px', right: '4px',
                    background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
                    color: '#fff', width: '20px', height: '20px', cursor: 'pointer',
                    fontSize: '11px', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>×</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => receiptRef.current?.click()} style={{
                    flex: 1, padding: '10px',
                    backgroundColor: theme.surface, border: `1px dashed ${theme.border}`,
                    borderRadius: '6px', color: theme.textMuted,
                    fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer',
                    textAlign: 'center',
                  }}>
                    📷 Take Photo
                  </button>
                  <button type="button" onClick={() => galleryRef.current?.click()} style={{
                    flex: 1, padding: '10px',
                    backgroundColor: theme.surface, border: `1px dashed ${theme.border}`,
                    borderRadius: '6px', color: theme.textMuted,
                    fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer',
                    textAlign: 'center',
                  }}>
                    🖼 Choose from Library
                  </button>
                </div>
              )}
              <input
                ref={receiptRef} type="file" accept="image/*" capture="environment"
                style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleReceiptFile(f); }}
              />
              <input
                ref={galleryRef} type="file" accept="image/*"
                style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleReceiptFile(f); }}
              />
            </div>

            {/* ── DETAILS ── */}
            <SectionHeader title="Details" />

            <div style={styles.row}>
              <Field label='Serial Number (optional)'>
                <input
                  style={{ ...styles.input, fontFamily: 'monospace' }}
                  placeholder="Stored locally, never synced"
                  value={serialNumber}
                  onChange={e => setSerialNumber(e.target.value)}
                  autoComplete="off"
                />
              </Field>
              <Field label={getSettings().units === 'metric' ? 'Barrel Length (cm)' : 'Barrel Length (in)'}>
                <input
                  style={{ ...styles.input, fontFamily: 'monospace' }}
                  placeholder='e.g. 4.49'
                  type="number"
                  min="0"
                  step="0.01"
                  value={barrelLength}
                  onChange={e => setBarrelLength(e.target.value)}
                />
              </Field>
            </div>

            <Field label="Notes">
              <textarea
                style={{ ...styles.input, ...styles.textarea }}
                placeholder="Modifications, history, anything you want to remember..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
              />
            </Field>

            {/* NFA/Suppressor — deferred, see roadmap */}
            {/* <SectionHeader title="NFA" /> */}
            {/* <ToggleRow
              label="NFA Item"
              sublabel="Suppressor, SBR, SBS, Machine Gun, AOW"
              value={nfaItem}
              onToggle={setNfaItem}
            /> */}
            {/* <ToggleRow
              label="Suppressor Host"
              sublabel="Threaded barrel / suppressor-ready"
              value={suppressorHost}
              onToggle={setSuppressorHost}
            /> */}

            </>
            )} {/* end showAdvanced */}

            {/* Action buttons — inside scroll so keyboard doesn't bury them */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', width: '100%', marginTop: 24, paddingBottom: 32 }}>
              <button type="button" style={styles.cancelBtn} onClick={onCancel}>
                CANCEL
              </button>
              <button
                type="submit"
                style={{
                  ...styles.saveBtn,
                  backgroundColor: isValid ? theme.accent : 'rgba(255,212,59,0.2)',
                  color: isValid ? theme.bg : 'rgba(255,255,255,0.4)',
                  cursor: isValid ? 'pointer' : 'not-allowed',
                  border: 'none',
                }}
                disabled={!isValid}
              >
                ADD TO VAULT
              </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ title, note }: { title: string; note?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: `1px solid ${theme.border}`,
      paddingBottom: '6px', marginTop: '24px', marginBottom: '14px',
    }}>
      <span style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '1.2px', color: theme.textMuted, textTransform: 'uppercase' }}>{title}</span>
      {note && <span style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted }}>{note}</span>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '14px', flex: 1 }}>
      <label style={{ display: 'block', fontSize: '12px', color: theme.textSecondary, marginBottom: '6px' }}>{label}</label>
      {children}
    </div>
  );
}

function ChipGroup({ options, selected, onSelect, autoHighlight }: {
  options: string[];
  selected: string | null;
  onSelect: (v: string) => void;
  autoHighlight?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      {options.map(opt => {
        const isSelected = selected === opt;
        return (
          <button key={opt} type="button" onClick={() => onSelect(opt)} style={{
            padding: '10px 14px', borderRadius: '4px',
            border: `1px solid ${isSelected ? theme.accent : theme.border}`,
            backgroundColor: isSelected ? theme.accentDim : theme.surface,
            color: isSelected ? theme.accent : theme.textSecondary,
            fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.4px',
            cursor: 'pointer', transition: 'all 0.15s', minHeight: '32px',
            boxShadow: isSelected && autoHighlight ? `0 0 0 1px ${theme.accent}` : 'none',
          }}>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function ToggleRow({ label, sublabel, value, onToggle }: {
  label: string; sublabel: string; value: boolean; onToggle: (v: boolean) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${theme.border}` }}>
      <div>
        <div style={{ fontSize: '14px', color: theme.textPrimary, marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '11px', color: theme.textMuted }}>{sublabel}</div>
      </div>
      <button type="button" onClick={() => onToggle(!value)} style={{
        width: '50px', height: '30px', borderRadius: '15px', border: 'none',
        backgroundColor: value ? theme.accent : theme.surfaceAlt,
        cursor: 'pointer', position: 'relative', flexShrink: 0,
        transition: 'background-color 0.2s',
      }} aria-checked={value} role="switch">
        <div style={{
          position: 'absolute', top: '4px', left: value ? '24px' : '4px',
          width: '22px', height: '22px', borderRadius: '50%',
          backgroundColor: value ? theme.bg : theme.textMuted,
          transition: 'left 0.2s',
        }} />
      </button>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '16px',
  },
  modal: {
    backgroundColor: theme.bg, border: `1px solid ${theme.border}`,
    borderRadius: '8px', width: '100%', maxWidth: '620px',
    maxHeight: '90vh', display: 'flex', flexDirection: 'column',
    boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px', borderBottom: `1px solid ${theme.border}`, flexShrink: 0,
  },
  headerTitle: {
    fontFamily: 'monospace', fontSize: '13px', letterSpacing: '1.5px',
    color: theme.textPrimary, fontWeight: 700,
  },
  closeBtn: {
    background: 'none', border: 'none', color: theme.textMuted,
    fontSize: '16px', cursor: 'pointer', padding: '4px 8px', lineHeight: 1,
  },
  body: { overflowY: 'auto', padding: '4px 20px 20px', flex: 1 },
  row: { display: 'flex', gap: '12px' },
  fieldLabel: {
    display: 'block', fontSize: '12px', color: theme.textSecondary, marginBottom: '6px',
  } as React.CSSProperties,
  input: {
    width: '100%', backgroundColor: theme.surface,
    border: `1px solid ${theme.border}`, borderRadius: '4px',
    padding: '9px 12px', color: theme.textPrimary, fontSize: '14px',
    outline: 'none', boxSizing: 'border-box',
  },
  textarea: { resize: 'vertical', minHeight: '72px', fontFamily: 'inherit' },
  footer: {
    display: 'flex', gap: '10px', padding: '14px 20px',
    borderTop: `1px solid ${theme.border}`, justifyContent: 'flex-end', flexShrink: 0,
  },
  cancelBtn: {
    padding: '9px 18px', backgroundColor: 'transparent',
    border: `1px solid ${theme.border}`, borderRadius: '4px',
    color: theme.textSecondary, fontFamily: 'monospace', fontSize: '11px',
    letterSpacing: '0.8px', cursor: 'pointer', minHeight: '38px',
  },
  saveBtn: {
    padding: '9px 20px', backgroundColor: theme.accent,
    border: `1px solid ${theme.accent}`, borderRadius: '4px',
    color: theme.bg, fontFamily: 'monospace', fontSize: '11px',
    letterSpacing: '0.8px', fontWeight: 700, cursor: 'pointer', minHeight: '38px',
  },
  saveBtnDisabled: { opacity: 0.4, cursor: 'not-allowed' },
  dropdown: {
    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
    backgroundColor: theme.surface, border: `1px solid ${theme.border}`,
    borderRadius: '4px', overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
  },
  dropdownItem: {
    display: 'block', width: '100%', padding: '9px 12px',
    backgroundColor: 'transparent', border: 'none', borderBottom: `0.5px solid ${theme.border}`,
    color: theme.textPrimary, fontFamily: 'monospace', fontSize: '12px',
    textAlign: 'left', cursor: 'pointer',
  },
  smallBtn: {
    padding: '5px 10px', backgroundColor: 'transparent',
    border: `0.5px solid ${theme.border}`, borderRadius: '4px',
    color: theme.textMuted, fontFamily: 'monospace', fontSize: '9px',
    letterSpacing: '0.5px', cursor: 'pointer',
  },
};
