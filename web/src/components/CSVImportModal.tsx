import React, { useState, useRef } from 'react';
import { theme } from './theme';
import { addGun } from './storage';
import type { Gun } from './types';

interface CSVImportModalProps {
  onClose: () => void;
  onImported: (count: number) => void;
}

type Step = 'upload' | 'map' | 'done';

// Gun fields the user can map CSV columns to
const MAPPABLE_FIELDS: { key: keyof Gun | '_skip'; label: string; required?: boolean }[] = [
  { key: '_skip',         label: '— Skip column —' },
  { key: 'make',          label: 'Make',              required: true },
  { key: 'model',         label: 'Model',             required: true },
  { key: 'caliber',       label: 'Caliber',           required: true },
  { key: 'type',          label: 'Type (Pistol/Rifle/Shotgun/NFA)' },
  { key: 'action',        label: 'Action (Semi-Auto/Bolt/etc.)' },
  { key: 'status',        label: 'Status' },
  { key: 'serialNumber',  label: 'Serial Number' },
  { key: 'acquiredDate',  label: 'Date Acquired (YYYY-MM-DD)' },
  { key: 'acquiredPrice', label: 'Purchase Price ($)' },
  { key: 'acquiredFrom',  label: 'Purchased From' },
  { key: 'condition',     label: 'Condition' },
  { key: 'barrelLength',  label: 'Barrel Length (in)' },
  { key: 'notes',         label: 'Notes' },
];

// Smart auto-detect header → field mapping
const HEADER_MAP: Record<string, keyof Gun | '_skip'> = {
  make: 'make', manufacturer: 'make', brand: 'make',
  model: 'model', name: 'model',
  caliber: 'caliber', cartridge: 'caliber', gauge: 'caliber',
  type: 'type', category: 'type',
  action: 'action',
  status: 'status',
  serial: 'serialNumber', 'serial number': 'serialNumber', sn: 'serialNumber',
  'date acquired': 'acquiredDate', purchased: 'acquiredDate', 'purchase date': 'acquiredDate',
  price: 'acquiredPrice', 'purchase price': 'acquiredPrice', paid: 'acquiredPrice', cost: 'acquiredPrice',
  'purchased from': 'acquiredFrom', dealer: 'acquiredFrom', seller: 'acquiredFrom', source: 'acquiredFrom',
  condition: 'condition',
  barrel: 'barrelLength', 'barrel length': 'barrelLength',
  notes: 'notes', note: 'notes', comments: 'notes',
};

// Normalize action strings to Gun action enum
function parseAction(raw: string): Gun['action'] {
  const v = raw.toLowerCase().replace(/[-_\s]/g, '');
  if (v.includes('semiauto') || v.includes('sa') || v === 'semi') return 'Semi-Auto';
  if (v.includes('bolt'))   return 'Bolt';
  if (v.includes('lever'))  return 'Lever';
  if (v.includes('pump'))   return 'Pump';
  if (v.includes('rev'))    return 'Revolver';
  if (v.includes('break'))  return 'Break';
  if (v.includes('single')) return 'Single Shot';
  return 'Semi-Auto';
}

function parseType(raw: string): Gun['type'] {
  const v = raw.toLowerCase();
  if (v.includes('pistol') || v.includes('handgun')) return 'Pistol';
  if (v.includes('shotgun'))  return 'Shotgun';
  if (v.includes('suppress')) return 'Suppressor';
  if (v.includes('nfa'))      return 'NFA';
  return 'Rifle';
}

function parseStatus(raw: string): Gun['status'] {
  const v = raw.toLowerCase();
  if (v.includes('stor'))    return 'Stored';
  if (v.includes('loan'))    return 'Loaned Out';
  if (v.includes('repair'))  return 'Awaiting Repair';
  if (v.includes('sold'))    return 'Sold';
  if (v.includes('transfer')) return 'Transferred';
  return 'Active';
}

function parseCondition(raw: string): Gun['condition'] | undefined {
  const v = raw.toLowerCase();
  if (v.includes('new'))      return 'New';
  if (v.includes('excellent')) return 'Excellent';
  if (v.includes('very good')) return 'Very Good';
  if (v.includes('good'))      return 'Good';
  if (v.includes('fair'))      return 'Fair';
  if (v.includes('poor'))      return 'Poor';
  return undefined;
}

// Simple CSV parser (handles quoted fields with commas)
function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  function parseLine(line: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());
    return fields;
  }

  const headers = parseLine(lines[0]).map(h => h.toLowerCase().trim());
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

const TEMPLATE_CSV = `Make,Model,Caliber,Type,Action,Serial Number,Date Acquired,Purchase Price,Purchased From,Condition,Barrel Length,Notes
Glock,G19,9mm,Pistol,Semi-Auto,ABC123,2022-06-15,650,Local Gun Store,Excellent,4.02,Gen 5
Daniel Defense,DDM4 V7,5.56 NATO,Rifle,Semi-Auto,DD98765,2021-03-01,1850,DD Direct,New,16,`;

export function CSVImportModal({ onClose, onImported }: CSVImportModalProps) {
  const [step, setStep]           = useState<Step>('upload');
  const [csvText, setCsvText]     = useState('');
  const [parsed, setParsed]       = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [mapping, setMapping]     = useState<Record<number, keyof Gun | '_skip'>>({});
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [error, setError]         = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 10px',
    backgroundColor: theme.bg, border: `0.5px solid ${theme.border}`,
    borderRadius: '5px', color: theme.textPrimary,
    fontFamily: 'monospace', fontSize: '11px', outline: 'none',
    boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    fontFamily: 'monospace', fontSize: '9px', letterSpacing: '1px',
    color: theme.textMuted, textTransform: 'uppercase', marginBottom: '4px', display: 'block',
  };

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = e => setCsvText(e.target?.result as string || '');
    reader.readAsText(file);
  }

  function handleProceedToMap() {
    setError('');
    if (!csvText.trim()) { setError('Paste CSV data or upload a file first.'); return; }
    const result = parseCSV(csvText);
    if (result.headers.length === 0) { setError('Could not parse CSV — check the format.'); return; }
    if (result.rows.length === 0) { setError('No data rows found in CSV.'); return; }

    // Auto-detect mappings
    const autoMap: Record<number, keyof Gun | '_skip'> = {};
    result.headers.forEach((h, i) => {
      autoMap[i] = HEADER_MAP[h] || '_skip';
    });
    setMapping(autoMap);
    setParsed(result);
    setStep('map');
  }

  function handleImport() {
    if (!parsed) return;
    setImporting(true);

    let count = 0;
    for (const row of parsed.rows) {
      if (row.every(c => !c.trim())) continue; // skip empty rows

      const gunData: Record<string, string> = {};
      parsed.headers.forEach((_, i) => {
        const field = mapping[i];
        if (field && field !== '_skip' && row[i]?.trim()) {
          gunData[field] = row[i].trim();
        }
      });

      if (!gunData.make || !gunData.model || !gunData.caliber) continue; // skip if missing required

      try {
        addGun({
          make:          gunData.make,
          model:         gunData.model,
          caliber:       gunData.caliber,
          type:          gunData.type    ? parseType(gunData.type)     : 'Rifle',
          action:        gunData.action  ? parseAction(gunData.action) : 'Semi-Auto',
          status:        gunData.status  ? parseStatus(gunData.status) : 'Active',
          serialNumber:  gunData.serialNumber  || undefined,
          acquiredDate:  gunData.acquiredDate  || undefined,
          acquiredPrice: gunData.acquiredPrice ? parseFloat(gunData.acquiredPrice.replace(/[$,]/g, '')) : undefined,
          acquiredFrom:  gunData.acquiredFrom  || undefined,
          condition:     gunData.condition     ? parseCondition(gunData.condition) : undefined,
          barrelLength:  gunData.barrelLength  ? parseFloat(gunData.barrelLength)  : undefined,
          notes:         gunData.notes         || undefined,
          roundCount:    0,
        });
        count++;
      } catch (_) { /* skip bad rows */ }
    }

    setImportedCount(count);
    setImporting(false);
    setStep('done');
    onImported(count);
  }

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'lindcott-armory-import-template.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  // Preview: first 3 data rows
  const previewRows = parsed?.rows.slice(0, 3) ?? [];
  const requiredMapped = parsed ? (['make','model','caliber'] as const).every(f =>
    Object.values(mapping).includes(f)
  ) : false;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: '100%', maxWidth: '480px',
        backgroundColor: theme.surface,
        border: `0.5px solid ${theme.border}`,
        borderRadius: '12px 12px 0 0',
        padding: '20px 16px 36px',
        maxHeight: '90vh', overflowY: 'auto',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: theme.textPrimary, letterSpacing: '1px' }}>
              IMPORT GUNS
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginTop: '2px', letterSpacing: '0.5px' }}>
              {step === 'upload' ? 'STEP 1 OF 2 — UPLOAD' : step === 'map' ? 'STEP 2 OF 2 — MAP COLUMNS' : 'COMPLETE'}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: theme.textMuted, fontSize: '18px', padding: '0 4px',
          }}>×</button>
        </div>

        {/* ── STEP 1: Upload ── */}
        {step === 'upload' && (
          <>
            {/* File drop zone */}
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              style={{
                border: `1px dashed ${theme.border}`, borderRadius: '8px',
                padding: '24px', textAlign: 'center', cursor: 'pointer',
                marginBottom: '12px', backgroundColor: theme.bg,
              }}
            >
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted, lineHeight: '1.8' }}>
                Drag & drop a CSV file here<br />
                <span style={{ color: theme.accent }}>or tap to browse</span>
              </div>
              <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>

            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, textAlign: 'center', marginBottom: '10px' }}>OR PASTE CSV BELOW</div>

            <textarea
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              rows={6}
              placeholder={'Make,Model,Caliber\nGlock,G19,9mm\n...'}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: '10px', lineHeight: '1.6' }}
            />

            {error && (
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.red, marginTop: '8px' }}>{error}</div>
            )}

            <button onClick={downloadTemplate} style={{
              display: 'block', width: '100%', marginTop: '10px',
              padding: '8px', backgroundColor: 'transparent',
              border: `0.5px solid ${theme.border}`, borderRadius: '5px',
              color: theme.textMuted, fontFamily: 'monospace', fontSize: '9px',
              letterSpacing: '0.5px', cursor: 'pointer',
            }}>
              DOWNLOAD TEMPLATE CSV
            </button>

            <button
              onClick={handleProceedToMap}
              disabled={!csvText.trim()}
              style={{
                display: 'block', width: '100%', marginTop: '10px',
                padding: '13px', backgroundColor: csvText.trim() ? theme.accent : theme.border,
                border: 'none', borderRadius: '6px',
                color: csvText.trim() ? theme.bg : theme.textMuted,
                fontFamily: 'monospace', fontSize: '11px', fontWeight: 700,
                letterSpacing: '0.8px', cursor: csvText.trim() ? 'pointer' : 'default',
              }}
            >
              NEXT: MAP COLUMNS →
            </button>
          </>
        )}

        {/* ── STEP 2: Map columns ── */}
        {step === 'map' && parsed && (
          <>
            {/* Preview table */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ ...labelStyle, marginBottom: '8px' }}>Preview (first {previewRows.length} rows)</div>
              <div style={{ overflowX: 'auto', borderRadius: '6px', border: `0.5px solid ${theme.border}` }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '9px' }}>
                  <thead>
                    <tr style={{ backgroundColor: theme.bg }}>
                      {parsed.headers.map((h, i) => (
                        <th key={i} style={{ padding: '6px 8px', textAlign: 'left', color: theme.textMuted, letterSpacing: '0.5px', whiteSpace: 'nowrap', borderBottom: `0.5px solid ${theme.border}` }}>
                          {h.toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, ri) => (
                      <tr key={ri} style={{ borderBottom: `0.5px solid ${theme.border}` }}>
                        {row.map((cell, ci) => (
                          <td key={ci} style={{ padding: '5px 8px', color: theme.textSecondary, whiteSpace: 'nowrap', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {cell || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Column mapping selects */}
            <div style={{ ...labelStyle, marginBottom: '10px' }}>Map columns to fields <span style={{ color: theme.red }}>*</span> = required</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              {parsed.headers.map((header, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', alignItems: 'center' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {header}
                  </div>
                  <select
                    value={mapping[i] || '_skip'}
                    onChange={e => setMapping(m => ({ ...m, [i]: e.target.value as keyof Gun | '_skip' }))}
                    style={{ ...inputStyle, padding: '6px 8px' }}
                  >
                    {MAPPABLE_FIELDS.map(f => (
                      <option key={f.key} value={f.key}>
                        {f.required ? `${f.label} *` : f.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginBottom: '12px' }}>
              {parsed.rows.length} rows detected · {parsed.rows.filter(r => r.some(c => c.trim())).length} non-empty
            </div>

            {!requiredMapped && (
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.orange, marginBottom: '10px' }}>
                Make, Model, and Caliber must each be mapped to continue.
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px' }}>
              <button onClick={() => setStep('upload')} style={{
                padding: '12px', backgroundColor: 'transparent',
                border: `0.5px solid ${theme.border}`, borderRadius: '6px',
                color: theme.textMuted, fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer',
              }}>← BACK</button>
              <button
                onClick={handleImport}
                disabled={!requiredMapped || importing}
                style={{
                  padding: '12px',
                  backgroundColor: requiredMapped ? theme.accent : theme.border,
                  border: 'none', borderRadius: '6px',
                  color: requiredMapped ? theme.bg : theme.textMuted,
                  fontFamily: 'monospace', fontSize: '11px', fontWeight: 700,
                  letterSpacing: '0.8px', cursor: requiredMapped ? 'pointer' : 'default',
                }}
              >
                {importing ? 'IMPORTING...' : `IMPORT ${parsed.rows.filter(r => r.some(c => c.trim())).length} GUNS`}
              </button>
            </div>
          </>
        )}

        {/* ── STEP 3: Done ── */}
        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '32px', fontWeight: 700, color: theme.green, marginBottom: '10px' }}>
              {importedCount}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textPrimary, marginBottom: '6px' }}>
              GUN{importedCount !== 1 ? 'S' : ''} IMPORTED
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginBottom: '24px' }}>
              Now in your vault. Tap any gun to add accessories, log sessions, or fill in details.
            </div>
            <button onClick={onClose} style={{
              width: '100%', padding: '13px',
              backgroundColor: theme.accent, border: 'none',
              borderRadius: '6px', color: theme.bg,
              fontFamily: 'monospace', fontSize: '11px', fontWeight: 700,
              letterSpacing: '0.8px', cursor: 'pointer',
            }}>
              DONE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
