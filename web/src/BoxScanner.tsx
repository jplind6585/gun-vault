/**
 * BoxScanner — Universal box / barcode scanner.
 * Point camera at a box or barcode. Claude detects item type and extracts fields.
 * If a barcode is found, also tries UPC lookup for additional data.
 */

import { useState, useRef } from 'react';
import { theme } from './theme';
import { scanBox, type BoxScanResult, type BoxScanItemType } from './claudeApi';

interface Props {
  onResult: (result: BoxScanResult) => void;
  onCancel: () => void;
}

type ScanStep = 'idle' | 'processing' | 'result' | 'error';

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

async function tryUpcLookup(barcode: string): Promise<Record<string, string> | null> {
  try {
    const res = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`);
    if (!res.ok) return null;
    const data = await res.json();
    const item = data?.items?.[0];
    if (!item) return null;
    return {
      name: item.title ?? '',
      brand: item.brand ?? '',
    };
  } catch {
    return null;
  }
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
  const [step, setStep] = useState<ScanStep>('idle');
  const [result, setResult] = useState<BoxScanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setStep('processing');
    setErrorMsg('');

    try {
      const dataUrl = await resizeForScan(file);
      const scanResult = await scanBox(dataUrl);

      // If barcode found, try UPC lookup to enrich fields
      if (scanResult.barcode) {
        const upcData = await tryUpcLookup(scanResult.barcode);
        if (upcData) {
          // Merge UPC data — only fill fields that Claude didn't already find
          if (upcData.brand && !scanResult.fields.brand && !scanResult.fields.make) {
            scanResult.fields.brand = upcData.brand;
            scanResult.fieldConfidence.brand = 'high';
          }
          if (upcData.name && !scanResult.fields.name && !scanResult.fields.model) {
            scanResult.fields.name = upcData.name;
            scanResult.fieldConfidence.name = 'high';
          }
        }
      }

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
  };

  const outlineBtn: React.CSSProperties = {
    width: '100%', padding: '14px',
    backgroundColor: 'transparent', border: `1.5px solid ${theme.border}`,
    borderRadius: '10px', color: theme.textSecondary,
    fontFamily: 'monospace', fontSize: '13px',
    fontWeight: 700, letterSpacing: '1px', cursor: 'pointer',
  };

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
            <div style={{ backgroundColor: theme.surface, borderRadius: '12px', padding: '20px', marginBottom: '24px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '32px', marginBottom: '12px', opacity: 0.3 }}>[ ]</div>
              <div style={{ fontFamily: 'monospace', fontSize: '13px', color: theme.textPrimary, fontWeight: 700, marginBottom: '8px' }}>
                Point at the box or barcode
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted, lineHeight: 1.7 }}>
                Works on gun boxes, ammo boxes, optic boxes, and accessories.{'\n'}
                Can scan barcodes or read the whole box label.
              </div>
            </div>

            <div style={{ flex: 1 }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={openCamera} style={accentBtn}>SCAN WITH CAMERA</button>
              <button onClick={openGallery} style={outlineBtn}>UPLOAD PHOTO</button>
            </div>
          </>
        )}

        {/* ── Processing ── */}
        {step === 'processing' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '28px', opacity: 0.4 }}>. . .</div>
            <div style={{ fontFamily: 'monospace', fontSize: '13px', color: theme.textSecondary }}>Reading box...</div>
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
              {/* Type badge */}
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

              {/* Barcode found */}
              {result.barcode && (
                <div style={{ backgroundColor: theme.surface, borderRadius: '8px', padding: '10px 12px', marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>BARCODE</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textPrimary, letterSpacing: '1px' }}>{result.barcode}</div>
                </div>
              )}

              {/* Extracted fields */}
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
                          {isLowConf && (
                            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.orange, padding: '2px 5px', border: `1px solid ${theme.orange}40`, borderRadius: '4px' }}>verify</div>
                          )}
                          <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textPrimary, fontWeight: isLowConf ? 400 : 700 }}>
                            {formatFieldValue(key, value)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Serial number — show but note user must confirm */}
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
                    ADD TO {result.itemType === 'gun' ? 'GUN VAULT' : result.itemType === 'optic' ? 'OPTICS' : result.itemType === 'ammo' ? 'INVENTORY' : 'GEAR LOCKER'}
                  </button>
                )}
                <button
                  onClick={() => { setStep('idle'); setResult(null); }}
                  style={outlineBtn}
                >
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
              <button onClick={() => { setStep('idle'); setErrorMsg(''); }} style={accentBtn}>TRY AGAIN</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
