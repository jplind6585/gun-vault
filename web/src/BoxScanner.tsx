/**
 * BoxScanner — Two-path scanner: live barcode decode OR Claude Vision label scan.
 * Primary path: real barcode decoder (html5-qrcode ZXing) → Claude UPC lookup.
 * Fallback path: photo of box label → Claude Vision extracts fields.
 */

import { useState, useRef } from 'react';
import { theme } from './theme';
import { scanBox, lookupUPC, type BoxScanResult, type BoxScanItemType } from './claudeApi';
import { LiveBarcodeScanner } from './LiveBarcodeScanner';

interface Props {
  onResult: (result: BoxScanResult) => void;
  onCancel: () => void;
}

type Step = 'idle' | 'barcode-scan' | 'barcode-lookup' | 'label-processing' | 'result' | 'error';

const TYPE_LABELS: Record<BoxScanItemType, string> = {
  gun: 'Firearm',
  optic: 'Optic / Scope',
  ammo: 'Ammunition',
  accessory: 'Accessory',
  unknown: 'Unknown Item',
};

const TYPE_COLORS: Record<BoxScanItemType, string> = {
  gun: theme.accent,
  optic: '#63e6be',
  ammo: theme.orange,
  accessory: theme.textSecondary,
  unknown: theme.textMuted,
};

const FIELD_LABELS: Record<string, string> = {
  make: 'Make', model: 'Model', caliber: 'Caliber', action: 'Action', type: 'Type',
  brand: 'Brand', opticType: 'Type', magnificationMin: 'Mag Min', magnificationMax: 'Mag Max',
  objectiveMM: 'Objective', reticle: 'Reticle',
  grainWeight: 'Grain', bulletType: 'Bullet Type', quantity: 'Count', productLine: 'Product Line',
  name: 'Name', manufacturer: 'Manufacturer', category: 'Category',
  serialNumber: 'Serial',
};

function formatFieldValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return '';
  if (key === 'magnificationMin' || key === 'magnificationMax') return `${value}x`;
  if (key === 'objectiveMM') return `${value}mm`;
  if (key === 'grainWeight') return `${value}gr`;
  return String(value);
}

async function resizeForScan(blob: Blob): Promise<string> {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 1024;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = url;
  });
}

export function BoxScanner({ onResult, onCancel }: Props) {
  const [step, setStep] = useState<Step>('idle');
  const [result, setResult] = useState<BoxScanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [scannedBarcode, setScannedBarcode] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Barcode path ─────────────────────────────────────────────────────────

  async function handleBarcodeDetected(barcode: string) {
    setScannedBarcode(barcode);
    setStep('barcode-lookup');
    try {
      const r = await lookupUPC(barcode);
      if (r.itemType === 'unknown' || Object.keys(r.fields).length === 0) {
        // Lookup came back empty — tell user and offer label scan
        setErrorMsg(`Barcode ${barcode} not recognized. Try scanning the box label instead.`);
        setStep('error');
      } else {
        setResult(r);
        setStep('result');
      }
    } catch {
      setErrorMsg('Lookup failed. Try scanning the box label instead.');
      setStep('error');
    }
  }

  // ── Label photo path ──────────────────────────────────────────────────────

  function openCamera() {
    const input = fileInputRef.current;
    if (!input) return;
    input.setAttribute('capture', 'environment');
    input.value = '';
    input.click();
  }

  function openGallery() {
    const input = fileInputRef.current;
    if (!input) return;
    input.removeAttribute('capture');
    input.value = '';
    input.click();
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStep('label-processing');
    setErrorMsg('');

    try {
      const dataUrl = await resizeForScan(file);
      const scanResult = await scanBox(dataUrl);
      setResult(scanResult);
      setStep('result');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Scan failed';
      if (msg === 'BUDGET_EXCEEDED') {
        setErrorMsg('AI usage limit reached for this month.');
      } else {
        setErrorMsg('Could not read the box. Try better lighting or a closer shot.');
      }
      setStep('error');
    }
  }

  // ── Styles ────────────────────────────────────────────────────────────────

  const container: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 2000,
    backgroundColor: theme.bg,
    display: 'flex', flexDirection: 'column',
    overflowY: 'auto',
  };

  const accentBtn: React.CSSProperties = {
    width: '100%', padding: '15px',
    backgroundColor: theme.accent, border: 'none', borderRadius: '10px',
    color: theme.bg, fontFamily: 'monospace', fontSize: '13px',
    fontWeight: 700, letterSpacing: '1.5px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  };

  const outlineBtn: React.CSSProperties = {
    width: '100%', padding: '14px',
    backgroundColor: 'transparent', border: `1.5px solid ${theme.border}`,
    borderRadius: '10px', color: theme.textSecondary,
    fontFamily: 'monospace', fontSize: '13px',
    fontWeight: 700, letterSpacing: '1px', cursor: 'pointer',
  };

  // ── Live barcode scanner overlay ──────────────────────────────────────────
  if (step === 'barcode-scan') {
    return (
      <LiveBarcodeScanner
        onDetected={handleBarcodeDetected}
        onCancel={() => setStep('idle')}
      />
    );
  }

  return (
    <div style={container}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFile}
      />

      {/* Header */}
      <div style={{ padding: '16px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '1.5px', color: theme.textMuted }}>
            SCAN TO ADD
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: theme.textPrimary }}>
            Box Scanner
          </div>
        </div>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: theme.textMuted, fontSize: '22px', cursor: 'pointer', padding: '4px' }}>×</button>
      </div>

      <div style={{ padding: '24px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* ── Idle ── */}
        {step === 'idle' && (
          <>
            {/* Option cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>

              {/* Barcode — primary */}
              <div style={{ backgroundColor: theme.surface, border: `0.5px solid ${theme.accent}30`, borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.accent, letterSpacing: '1px', marginBottom: '4px' }}>
                  RECOMMENDED
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: theme.textPrimary, marginBottom: '4px' }}>
                  Scan Barcode
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, lineHeight: 1.6, marginBottom: '12px' }}>
                  Point at the UPC or EAN barcode on the box. Instantly decodes and looks up the product.
                </div>
                <button onClick={() => setStep('barcode-scan')} style={accentBtn}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>
                    <line x1="7" y1="12" x2="7" y2="12.01"/><line x1="12" y1="12" x2="12" y2="12.01"/><line x1="17" y1="12" x2="17" y2="12.01"/>
                  </svg>
                  SCAN BARCODE
                </button>
              </div>

              {/* Label photo — secondary */}
              <div style={{ backgroundColor: theme.surface, border: `0.5px solid ${theme.border}`, borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: theme.textPrimary, marginBottom: '4px' }}>
                  Scan Box Label
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, lineHeight: 1.6, marginBottom: '12px' }}>
                  Take a photo of the box. AI reads the label text and extracts fields.
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={openCamera} style={{ ...outlineBtn, fontSize: '11px', padding: '11px' }}>
                    CAMERA
                  </button>
                  <button onClick={openGallery} style={{ ...outlineBtn, fontSize: '11px', padding: '11px' }}>
                    GALLERY
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Barcode lookup in progress ── */}
        {step === 'barcode-lookup' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '28px', opacity: 0.4 }}>. . .</div>
            <div style={{ fontFamily: 'monospace', fontSize: '13px', color: theme.textSecondary }}>Looking up barcode...</div>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted, letterSpacing: '1px' }}>{scannedBarcode}</div>
          </div>
        )}

        {/* ── Label processing ── */}
        {step === 'label-processing' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '28px', opacity: 0.4 }}>. . .</div>
            <div style={{ fontFamily: 'monospace', fontSize: '13px', color: theme.textSecondary }}>Reading label...</div>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted }}>This takes a few seconds</div>
          </div>
        )}

        {/* ── Result ── */}
        {step === 'result' && result && (() => {
          const typeColor = TYPE_COLORS[result.itemType];
          const fieldEntries = Object.entries(result.fields).filter(([k]) => k !== 'serialNumber');
          const serialEntry = result.fields.serialNumber;

          return (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{
                  padding: '4px 10px', borderRadius: '20px',
                  backgroundColor: `${typeColor}20`, border: `1px solid ${typeColor}`,
                  fontFamily: 'monospace', fontSize: '11px', fontWeight: 700,
                  color: typeColor, letterSpacing: '0.5px',
                }}>
                  {TYPE_LABELS[result.itemType].toUpperCase()}
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '10px', color: result.confidence === 'high' ? theme.green : result.confidence === 'medium' ? theme.orange : theme.textMuted }}>
                  {result.confidence === 'high' ? 'High confidence' : result.confidence === 'medium' ? 'Review fields below' : 'Low confidence — verify all fields'}
                </div>
              </div>

              {result.barcode && (
                <div style={{ backgroundColor: theme.surface, borderRadius: '8px', padding: '10px 12px', marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>BARCODE</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textPrimary, letterSpacing: '1px' }}>{result.barcode}</div>
                </div>
              )}

              {fieldEntries.length > 0 && (
                <div style={{ backgroundColor: theme.surface, borderRadius: '10px', overflow: 'hidden', marginBottom: '12px' }}>
                  {fieldEntries.map(([key, value], i) => {
                    const isLowConf = result.fieldConfidence[key] === 'low';
                    return (
                      <div key={key} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 14px',
                        borderTop: i > 0 ? `1px solid ${theme.border}` : 'none',
                      }}>
                        <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>{FIELD_LABELS[key] ?? key}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isLowConf && <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.orange, padding: '2px 5px', border: `1px solid ${theme.orange}40`, borderRadius: '4px' }}>verify</div>}
                          <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textPrimary, fontWeight: isLowConf ? 400 : 700 }}>
                            {formatFieldValue(key, value)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {serialEntry && (
                <div style={{ backgroundColor: `${theme.orange}10`, border: `1px solid ${theme.orange}40`, borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.orange, letterSpacing: '0.5px', marginBottom: '4px' }}>SERIAL — VERIFY BEFORE SAVING</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '13px', color: theme.textPrimary, letterSpacing: '1px' }}>{serialEntry}</div>
                </div>
              )}

              {fieldEntries.length === 0 && !serialEntry && (
                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted, marginBottom: '12px', lineHeight: 1.7 }}>
                  No fields could be extracted. Try a clearer photo with better lighting.
                </div>
              )}

              <div style={{ flex: 1 }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {result.itemType !== 'unknown' && fieldEntries.length > 0 && (
                  <button onClick={() => onResult(result)} style={accentBtn}>
                    USE THESE FIELDS
                  </button>
                )}
                <button onClick={() => { setStep('idle'); setResult(null); setScannedBarcode(''); }} style={outlineBtn}>
                  SCAN AGAIN
                </button>
              </div>
            </>
          );
        })()}

        {/* ── Error ── */}
        {step === 'error' && (
          <>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.orange, textAlign: 'center', lineHeight: 1.7 }}>
                {errorMsg}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => { setStep('idle'); setErrorMsg(''); setScannedBarcode(''); }} style={accentBtn}>TRY AGAIN</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
