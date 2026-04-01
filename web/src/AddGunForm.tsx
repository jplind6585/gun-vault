import React, { useState, useRef, useEffect } from 'react';
import { theme } from './theme';
import type { Gun } from './types';
import { lookupGunSpec, getSenseCheck, suggestMakes, suggestModels } from './gunDatabase';

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
  const [make, setMake]       = useState('');
  const [model, setModel]     = useState('');
  const [caliber, setCaliber] = useState('');
  const [type, setType]       = useState<Gun['type'] | null>(null);
  const [action, setAction]   = useState<Gun['action'] | null>(null);

  // Autocomplete state
  const [makeSuggestions, setMakeSuggestions] = useState<string[]>([]);
  const [modelSuggestions, setModelSuggestions] = useState<string[]>([]);
  const [showMakeSugg, setShowMakeSugg] = useState(false);
  const [showModelSugg, setShowModelSugg] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);
  const [senseCheckMsg, setSenseCheckMsg] = useState('');
  const [senseCheckDismissed, setSenseCheckDismissed] = useState(false);

  // Condition & status
  const [condition, setCondition]   = useState<NonNullable<Gun['condition']> | null>(null);
  const [status, setStatus]         = useState<Gun['status']>('Active');

  // Acquisition
  const [acquiredDate, setAcquiredDate]   = useState('');
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

    // Sense check
    if (!senseCheckDismissed) {
      const msg = getSenseCheck(make, model);
      if (msg) {
        setSenseCheckMsg(msg);
        return; // pause for user to review
      }
    }

    onSave({
      make: make.trim(),
      model: model.trim(),
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          <div style={styles.body}>

            {/* ── IDENTIFICATION ── */}
            <SectionHeader title="Identification" note="* required" />

            {/* Make with autocomplete */}
            <div style={{ marginBottom: '14px', position: 'relative' }}>
              <label style={styles.fieldLabel}>Make *</label>
              <input
                style={styles.input}
                placeholder="e.g. Glock, Sig Sauer, S&W..."
                value={make}
                onChange={e => { setMake(e.target.value); setSenseCheckDismissed(false); }}
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
                onChange={e => { setModel(e.target.value); setSenseCheckDismissed(false); }}
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

            {/* Sense check alert */}
            {senseCheckMsg && !senseCheckDismissed && (
              <div style={{
                backgroundColor: 'rgba(255,169,77,0.12)',
                border: `0.5px solid ${theme.orange}`,
                borderRadius: '6px',
                padding: '10px 12px',
                marginBottom: '14px',
              }}>
                <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.orange, letterSpacing: '0.8px', marginBottom: '5px' }}>HEADS UP</div>
                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textPrimary, lineHeight: '1.5', marginBottom: '8px' }}>{senseCheckMsg}</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button type="button" onClick={() => { setSenseCheckDismissed(true); setSenseCheckMsg(''); setModel(''); }} style={{ ...styles.smallBtn, color: theme.accent, borderColor: theme.accent }}>
                    UPDATE MODEL
                  </button>
                  <button type="button" onClick={() => { setSenseCheckDismissed(true); setSenseCheckMsg(''); }} style={styles.smallBtn}>
                    LOOKS CORRECT
                  </button>
                </div>
              </div>
            )}

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
              {/* Contextual caliber suggestions based on selected type */}
              {!caliber && (() => {
                const suggestions: string[] =
                  type === 'Pistol' ? ['9mm', '.45 ACP', '.40 S&W', '10mm', '.380 ACP'] :
                  type === 'Rifle' ? ['5.56mm', '.308 Win', '6.5 Creedmoor', '.223 Rem', '.300 Win Mag'] :
                  type === 'Shotgun' ? ['12 Gauge', '20 Gauge', '.410 Bore'] :
                  ['9mm', '5.56mm', '.308 Win', '12 Gauge', '.22 LR'];
                return (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '6px' }}>
                    {suggestions.map(s => (
                      <button key={s} type="button" onClick={() => { setCaliber(s); setAutoFilled(false); }} style={{
                        padding: '5px 10px', borderRadius: '3px', border: `0.5px solid ${theme.border}`,
                        backgroundColor: theme.surface, color: theme.textSecondary,
                        fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer',
                      }}>
                        {s}
                      </button>
                    ))}
                  </div>
                );
              })()}
            </Field>

            <Field label="Type *">
              <ChipGroup options={TYPES} selected={type} onSelect={v => setType(v as Gun['type'])} autoHighlight={autoFilled} />
            </Field>

            <Field label="Action *">
              <ChipGroup options={ACTIONS} selected={action} onSelect={v => setAction(v as Gun['action'])} autoHighlight={autoFilled} />
            </Field>

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
                  type="date"
                  value={acquiredDate}
                  onChange={e => setAcquiredDate(e.target.value)}
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
              <Field label='Barrel Length (")'>
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

            {/* ── NFA ── */}
            <SectionHeader title="NFA" />

            <ToggleRow
              label="NFA Item"
              sublabel="Suppressor, SBR, SBS, Machine Gun, AOW"
              value={nfaItem}
              onToggle={setNfaItem}
            />
            <ToggleRow
              label="Suppressor Host"
              sublabel="Threaded barrel / suppressor-ready"
              value={suppressorHost}
              onToggle={setSuppressorHost}
            />

            <div style={{ marginTop: '16px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, lineHeight: '1.6' }}>
                Everything can be updated after adding — accessories, maintenance logs, market value, and more are all editable from the gun's detail page.
              </div>
            </div>

          </div>

          {/* Footer */}
          <div style={styles.footer}>
            <button type="button" style={styles.cancelBtn} onClick={onCancel}>
              CANCEL
            </button>
            <button
              type="submit"
              style={{ ...styles.saveBtn, ...(!isValid ? styles.saveBtnDisabled : {}) }}
              disabled={!isValid}
            >
              ADD TO VAULT
            </button>
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
