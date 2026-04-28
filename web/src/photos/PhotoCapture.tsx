/**
 * PhotoCapture — Coached photo capture flow for gun photo sets.
 *
 * Handles: coaching brief → camera → AI review → approve/retake → next shot.
 * Used from GunDetail Photos tab for both sale_listing and insurance sets.
 */

import { useState, useRef } from 'react';
import { theme } from '../theme';
import { supabase } from '../lib/supabase';
import { SUPABASE_URL } from '../lib/supabase';
import {
  getShotsForSet, GUN_TYPE_PROFILE_LABELS,
  type SetType, type GunTypeProfile, type ShotSpec, type AiReviewResult,
} from './photoTypes';
import { uploadPhoto, savePhotoAsset, getOrCreatePhotoSet } from './photoService';

interface Props {
  userId: string;
  gunId: string;
  gunName: string;
  gunType?: string;
  gunAction?: string;
  setType: SetType;
  gunTypeProfile: GunTypeProfile;
  onComplete: () => void;
  onCancel: () => void;
}

type CaptureStep = 'brief' | 'capture' | 'reviewing' | 'result' | 'done';

interface CaptureResult {
  blob: Blob;
  previewUrl: string;
  aiResult: AiReviewResult | null;
}

export function PhotoCapture({
  userId, gunId, gunName, setType, gunTypeProfile, onComplete, onCancel,
}: Props) {
  const shots = getShotsForSet(setType, gunTypeProfile);
  const requiredShots = shots.filter(s => s.required);
  const optionalShots = shots.filter(s => !s.required);
  const [shotIndex, setShotIndex] = useState(0);
  const [step, setStep] = useState<CaptureStep>('brief');
  const [result, setResult] = useState<CaptureResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentShot: ShotSpec = shots[shotIndex];
  const isLast = shotIndex === shots.length - 1;
  const setLabel = setType === 'sale_listing' ? 'Sale Listing' : 'Insurance';

  // ── Camera / file input ───────────────────────────────────────────────────

  function openCamera() {
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    // Resolution check — warn if too small
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
    await new Promise(resolve => { img.onload = resolve; });

    if (img.width < 800 || img.height < 600) {
      setError('Image resolution may be too low. You can still continue, but retaking in better lighting is recommended.');
    }

    const previewUrl = objectUrl;
    const blob = file;

    setResult({ blob, previewUrl, aiResult: null });
    setStep('reviewing');

    // AI review (non-blocking — shows result after)
    runAiReview(blob, currentShot).then(aiResult => {
      setResult(prev => prev ? { ...prev, aiResult } : null);
      setStep('result');
    }).catch(() => {
      // AI review failed — let user proceed anyway
      setResult(prev => prev ? { ...prev, aiResult: { approved: true, warnings: [] } } : null);
      setStep('result');
    });
  }

  async function runAiReview(blob: Blob, shot: ShotSpec): Promise<AiReviewResult> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { approved: true, warnings: [] };

    // Convert blob to base64 (loop-based — spread crashes on large phone photos)
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        resolve(dataUrl.split(',')[1]);
      };
      reader.readAsDataURL(blob);
    });
    const mediaType = 'image/jpeg';

    const isSerialShot = shot.key === 'serial_number';
    const systemPrompt = isSerialShot
      ? `You are reviewing a gun photo for documentation quality. This is a serial number photo.
Assess ONLY: legibility of each character, glare on the metal, framing, and lighting.
Do NOT attempt to read, transcribe, or mention the serial number itself.
Return JSON: { "approved": boolean, "warnings": string[] }
Keep warnings short and actionable. If approved with no issues, return { "approved": true, "warnings": [] }.`
      : `You are reviewing a gun photo for documentation quality.
Shot type: ${shot.label}. Use case: ${setLabel}.
Assess: framing (fills 80% of frame), lighting (no harsh shadows or blown highlights), background (clean for sale/insurance), focus, and whether the intended subject is clearly visible.
Return JSON: { "approved": boolean, "warnings": string[] }
Keep warnings short and actionable (under 12 words each). If approved with no issues, return { "approved": true, "warnings": [] }.`;

    const res = await fetch(`${SUPABASE_URL}/functions/v1/claude`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        feature: 'photo_review',
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
            { type: 'text', text: `Review this ${shot.label} photo for ${setLabel} documentation.` },
          ],
        }],
        systemPrompt,
        maxTokens: 200,
      }),
    });

    if (!res.ok) return { approved: true, warnings: [] };
    const data = await res.json();
    try {
      const text = data.text ?? '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch { /* fall through */ }
    return { approved: true, warnings: [] };
  }

  // ── Save + advance ────────────────────────────────────────────────────────

  async function saveAndAdvance() {
    if (!result) return;
    setSaving(true);
    setError('');

    try {
      const photoSet = await getOrCreatePhotoSet(userId, gunId, setType, gunTypeProfile);
      if (!photoSet) throw new Error('Could not create photo set');

      const uploaded = await uploadPhoto(userId, gunId, currentShot.key, result.blob);
      if (!uploaded) throw new Error('Upload failed');

      await savePhotoAsset({
        userId,
        gunId,
        setId: photoSet.id,
        setType,
        shotType: currentShot.key,
        storagePath: uploaded.path,
        storageUrl: uploaded.url,
        isAcquisitionPhoto: shotIndex === 0 && setType === 'insurance',
        aiReviewResult: result.aiResult ?? undefined,
      });

      if (isLast) {
        setStep('done');
      } else {
        setShotIndex(i => i + 1);
        setResult(null);
        setStep('brief');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function retake() {
    setResult(null);
    setStep('brief');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // ── Styles ────────────────────────────────────────────────────────────────

  const container: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 2000,
    backgroundColor: theme.bg,
    display: 'flex', flexDirection: 'column',
    overflowY: 'auto',
  };

  const header: React.CSSProperties = {
    padding: '16px 16px 0',
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    flexShrink: 0,
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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={container}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileSelected}
      />

      {/* Header */}
      <div style={header}>
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '1.5px', color: theme.textMuted, marginBottom: '2px' }}>
            {setLabel.toUpperCase()} SET — {GUN_TYPE_PROFILE_LABELS[gunTypeProfile].toUpperCase()}
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: theme.textPrimary }}>
            {gunName}
          </div>
        </div>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: theme.textMuted, fontSize: '20px', cursor: 'pointer', padding: '4px' }}>×</button>
      </div>

      {/* Progress bar */}
      {step !== 'done' && (
        <div style={{ padding: '12px 16px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>
              {currentShot.required
                ? `${requiredShots.indexOf(currentShot) + 1} of ${requiredShots.length} required`
                : `Optional ${optionalShots.indexOf(currentShot) + 1} of ${optionalShots.length}`}
            </span>
            <span style={{ fontFamily: 'monospace', fontSize: '10px', color: currentShot.required ? theme.accent : theme.textMuted }}>
              {currentShot.required ? 'REQUIRED' : 'OPTIONAL'}
            </span>
          </div>
          <div style={{ height: '2px', backgroundColor: theme.surface, borderRadius: '1px' }}>
            <div style={{ height: '2px', backgroundColor: theme.accent, borderRadius: '1px', width: `${((shotIndex) / shots.length) * 100}%`, transition: 'width 0.3s' }} />
          </div>
        </div>
      )}

      {/* ── Step: Brief ── */}
      {step === 'brief' && (
        <div style={{ padding: '24px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 700, color: theme.textPrimary, marginBottom: '16px' }}>
            {currentShot.label}
          </div>

          {/* Static coaching brief */}
          <div style={{ backgroundColor: theme.surface, borderRadius: '10px', padding: '16px', marginBottom: '24px', borderLeft: `3px solid ${theme.accent}` }}>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '1.5px', color: theme.accent, marginBottom: '8px' }}>HOW TO SHOOT THIS</div>
            <div style={{ fontFamily: 'monospace', fontSize: '13px', color: theme.textSecondary, lineHeight: 1.7 }}>
              {currentShot.coachingText}
            </div>
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={openCamera} style={accentBtn}>
              TAKE PHOTO
            </button>
            {!currentShot.required && (
              <button onClick={() => {
                if (isLast) { setStep('done'); } else { setShotIndex(i => i + 1); setStep('brief'); }
              }} style={outlineBtn}>
                SKIP — NOT APPLICABLE
              </button>
            )}
            <button onClick={onCancel} style={{ ...outlineBtn, border: 'none', color: theme.textMuted }}>
              Save progress and exit
            </button>
          </div>
        </div>
      )}

      {/* ── Step: Reviewing (AI running) ── */}
      {step === 'reviewing' && result && (
        <div style={{ padding: '24px 16px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src={result.previewUrl} alt="captured" style={{ width: '100%', maxHeight: '50vh', objectFit: 'contain', borderRadius: '8px', marginBottom: '20px' }} />
          <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textMuted, letterSpacing: '1px' }}>
            Reviewing photo...
          </div>
        </div>
      )}

      {/* ── Step: Result (AI review done) ── */}
      {step === 'result' && result && (
        <div style={{ padding: '24px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <img src={result.previewUrl} alt="captured" style={{ width: '100%', maxHeight: '40vh', objectFit: 'contain', borderRadius: '8px', marginBottom: '16px' }} />

          {result.aiResult && (
            <div style={{ marginBottom: '20px' }}>
              {result.aiResult.warnings.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', backgroundColor: 'rgba(81, 207, 102, 0.08)', borderRadius: '8px', border: `1px solid rgba(81, 207, 102, 0.2)` }}>
                  <span style={{ color: theme.green, fontSize: '14px' }}>+</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.green }}>Looks good</span>
                </div>
              ) : (
                <div style={{ padding: '12px', backgroundColor: 'rgba(255, 159, 67, 0.08)', borderRadius: '8px', border: `1px solid rgba(255, 159, 67, 0.2)` }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '1px', color: theme.orange, marginBottom: '8px' }}>REVIEW NOTES</div>
                  {result.aiResult.warnings.map((w, i) => (
                    <div key={i} style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textSecondary, marginBottom: '4px', lineHeight: 1.5 }}>
                      — {w}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.red, marginBottom: '12px' }}>{error}</div>
          )}

          <div style={{ flex: 1 }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={saveAndAdvance} disabled={saving} style={{ ...accentBtn, opacity: saving ? 0.6 : 1 }}>
              {saving ? 'SAVING...' : (isLast ? 'SAVE — FINISH SET' : 'USE THIS PHOTO')}
            </button>
            <button onClick={retake} style={outlineBtn}>RETAKE</button>
          </div>
        </div>
      )}

      {/* ── Step: Done ── */}
      {step === 'done' && (
        <div style={{ padding: '40px 16px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '24px', fontWeight: 700, color: theme.bg }}>+</span>
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 700, color: theme.textPrimary, marginBottom: '8px' }}>
            {setLabel} Set Complete
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textSecondary, marginBottom: '32px' }}>
            {shots.length} photos captured for {gunName}.
          </div>
          <button onClick={onComplete} style={{ ...accentBtn, maxWidth: '240px' }}>DONE</button>
        </div>
      )}
    </div>
  );
}
