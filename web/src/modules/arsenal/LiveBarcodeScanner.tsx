/**
 * LiveBarcodeScanner — real-time barcode decoder using html5-qrcode (ZXing).
 * Renders a live camera viewfinder. Calls onDetected with the raw barcode string
 * the instant a UPC/EAN is recognized. Calls onCancel if user backs out.
 */
import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { theme } from './theme';

interface Props {
  onDetected: (barcode: string) => void;
  onCancel: () => void;
}

const SCANNER_ID = 'lindcott-barcode-reader';

export function LiveBarcodeScanner({ onDetected, onCancel }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const detectedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    let scanner: Html5Qrcode | null = null;

    async function start() {
      try {
        scanner = new Html5Qrcode(SCANNER_ID, { verbose: false });
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: { width: 280, height: 120 },
            aspectRatio: 1.5,
            formatsToSupport: [
              // UPC / EAN — what gun and ammo boxes use
              0,  // QR_CODE (included so html5-qrcode doesn't error; filtered out)
              1,  // AZTEC
              2,  // CODABAR
              3,  // CODE_39
              4,  // CODE_93
              5,  // CODE_128
              8,  // EAN_8
              9,  // EAN_13
              11, // UPC_A
              12, // UPC_E
              13, // UPC_EAN_EXTENSION
            ],
          },
          (decoded) => {
            if (detectedRef.current) return;
            detectedRef.current = true;
            onDetected(decoded);
          },
          () => { /* ignore per-frame errors */ },
        );

        setStarting(false);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.toLowerCase().includes('permission')) {
          setError('Camera permission denied. Please allow camera access and try again.');
        } else {
          setError('Could not start camera. Try using the photo option instead.');
        }
        setStarting(false);
      }
    }

    start();

    return () => {
      if (scanner) {
        scanner.stop().catch(() => {}).finally(() => scanner?.clear());
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2100,
      backgroundColor: '#000',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px',
        backgroundColor: 'rgba(0,0,0,0.8)',
        zIndex: 10,
      }}>
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.5)' }}>
            BARCODE SCANNER
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: '#fff' }}>
            Aim at the barcode
          </div>
        </div>
        <button
          onClick={onCancel}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '22px', cursor: 'pointer', padding: '4px' }}
        >
          ×
        </button>
      </div>

      {/* Camera viewfinder area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

        {/* html5-qrcode mounts the video element here */}
        <div
          id={SCANNER_ID}
          style={{ width: '100%', height: '100%' }}
        />

        {/* Scan region overlay — visual guide */}
        {!error && !starting && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            {/* Darkened surround */}
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)' }} />

            {/* Scan window cutout simulation */}
            <div style={{
              position: 'relative', zIndex: 1,
              width: '280px', height: '120px',
              border: `2px solid ${theme.accent}`,
              borderRadius: '6px',
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
            }}>
              {/* Corner marks */}
              {[
                { top: -2, left: -2, borderTop: `3px solid ${theme.accent}`, borderLeft: `3px solid ${theme.accent}` },
                { top: -2, right: -2, borderTop: `3px solid ${theme.accent}`, borderRight: `3px solid ${theme.accent}` },
                { bottom: -2, left: -2, borderBottom: `3px solid ${theme.accent}`, borderLeft: `3px solid ${theme.accent}` },
                { bottom: -2, right: -2, borderBottom: `3px solid ${theme.accent}`, borderRight: `3px solid ${theme.accent}` },
              ].map((s, i) => (
                <div key={i} style={{ position: 'absolute', width: '18px', height: '18px', ...s }} />
              ))}
            </div>

            <div style={{
              position: 'relative', zIndex: 1,
              marginTop: '16px',
              fontFamily: 'monospace', fontSize: '11px',
              color: 'rgba(255,255,255,0.7)', letterSpacing: '0.5px',
            }}>
              UPC · EAN · Code 128
            </div>
          </div>
        )}

        {starting && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#000',
          }}>
            <div style={{ fontFamily: 'monospace', fontSize: '12px', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px' }}>
              STARTING CAMERA...
            </div>
          </div>
        )}

        {error && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '32px', gap: '16px', backgroundColor: '#000',
          }}>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.orange, textAlign: 'center', lineHeight: 1.7 }}>
              {error}
            </div>
            <button
              onClick={onCancel}
              style={{
                padding: '12px 24px', backgroundColor: theme.surface,
                border: `0.5px solid ${theme.border}`, borderRadius: '8px',
                color: theme.textSecondary, fontFamily: 'monospace',
                fontSize: '12px', fontWeight: 700, cursor: 'pointer',
              }}
            >
              GO BACK
            </button>
          </div>
        )}
      </div>

      {/* Footer hint */}
      {!error && !starting && (
        <div style={{
          padding: '16px',
          backgroundColor: 'rgba(0,0,0,0.8)',
          textAlign: 'center',
        }}>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px' }}>
            Hold steady — scanning automatically
          </div>
        </div>
      )}
    </div>
  );
}
