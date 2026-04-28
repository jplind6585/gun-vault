/**
 * PhotoCapture — Coached photo capture flow for gun photo sets.
 *
 * Flow: brief → confirm (instant) → background save+AI → next brief → done screen.
 * AI results appear on the done screen as they resolve. No per-shot waiting.
 */

import { useState, useRef, useCallback } from 'react';
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

type CaptureStep = 'brief' | 'confirm' | 'crop' | 'done';

interface ShotRecord {
  shotKey: string;
  blob: Blob;
  previewUrl: string;
  aiResult: AiReviewResult | null;
  aiDone: boolean;
  saveError: string | null;
}

// ── Image resize helpers ───────────────────────────────────────────────────────

async function resizeBlob(blob: Blob, maxPx: number, quality: number): Promise<Blob> {
  const img = new Image();
  const url = URL.createObjectURL(blob);
  img.src = url;
  await new Promise<void>(resolve => { img.onload = () => resolve(); });
  URL.revokeObjectURL(url);
  const scale = Math.min(1, maxPx / img.width, maxPx / img.height);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise(resolve => canvas.toBlob(b => resolve(b!), 'image/jpeg', quality));
}

const resizeForUpload = (blob: Blob) => resizeBlob(blob, 2048, 0.88);
const resizeForReview = (blob: Blob) => resizeBlob(blob, 1024, 0.82);

// ── Crop tool ─────────────────────────────────────────────────────────────────

interface CropRect { x: number; y: number; w: number; h: number; }

interface CropToolProps {
  previewUrl: string;
  onApply: (cropped: Blob) => void;
  onCancel: () => void;
}

function CropTool({ previewUrl, onApply, onCancel }: CropToolProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<CropRect>({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
  const dragRef = useRef<{ mode: 'move' | 'nw' | 'ne' | 'sw' | 'se'; startX: number; startY: number; startCrop: CropRect } | null>(null);

  function toPercent(e: React.PointerEvent): { px: number; py: number } {
    const rect = containerRef.current!.getBoundingClientRect();
    return {
      px: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      py: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    };
  }

  function onPointerDown(e: React.PointerEvent, mode: 'move' | 'nw' | 'ne' | 'sw' | 'se') {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const { px, py } = toPercent(e);
    dragRef.current = { mode, startX: px, startY: py, startCrop: { ...crop } };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const { mode, startX, startY, startCrop } = dragRef.current;
    const { px, py } = toPercent(e);
    const dx = px - startX;
    const dy = py - startY;
    setCrop(prev => {
      const MIN = 0.1;
      let { x, y, w, h } = startCrop;
      if (mode === 'move') {
        x = Math.max(0, Math.min(1 - w, x + dx));
        y = Math.max(0, Math.min(1 - h, y + dy));
      } else {
        if (mode === 'nw') { x = Math.min(startCrop.x + startCrop.w - MIN, x + dx); y = Math.min(startCrop.y + startCrop.h - MIN, y + dy); w = startCrop.w - dx; h = startCrop.h - dy; }
        if (mode === 'ne') { y = Math.min(startCrop.y + startCrop.h - MIN, y + dy); w = startCrop.w + dx; h = startCrop.h - dy; }
        if (mode === 'sw') { x = Math.min(startCrop.x + startCrop.w - MIN, x + dx); w = startCrop.w - dx; h = startCrop.h + dy; }
        if (mode === 'se') { w = startCrop.w + dx; h = startCrop.h + dy; }
        x = Math.max(0, x); y = Math.max(0, y);
        w = Math.max(MIN, Math.min(1 - x, w));
        h = Math.max(MIN, Math.min(1 - y, h));
      }
      return { x, y, w, h };
    });
  }

  function onPointerUp() { dragRef.current = null; }

  async function applyCrop() {
    const img = imgRef.current!;
    const canvas = document.createElement('canvas');
    const sw = img.naturalWidth * crop.w;
    const sh = img.naturalHeight * crop.h;
    canvas.width = Math.round(sw);
    canvas.height = Math.round(sh);
    canvas.getContext('2d')!.drawImage(
      img,
      Math.round(img.naturalWidth * crop.x),
      Math.round(img.naturalHeight * crop.y),
      Math.round(sw), Math.round(sh),
      0, 0, canvas.width, canvas.height
    );
    canvas.toBlob(b => { if (b) onApply(b); }, 'image/jpeg', 0.92);
  }

  const handleSz: React.CSSProperties = {
    position: 'absolute', width: '28px', height: '28px',
    borderRadius: '50%', backgroundColor: theme.accent,
    border: `2px solid ${theme.bg}`,
    transform: 'translate(-50%, -50%)',
    touchAction: 'none',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2100, backgroundColor: '#000', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textMuted, letterSpacing: '1px' }}>CROP PHOTO</span>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: theme.textMuted, fontSize: '20px', cursor: 'pointer' }}>×</button>
      </div>

      <div
        ref={containerRef}
        style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <img ref={imgRef} src={previewUrl} alt="crop" style={{ maxWidth: '100%', maxHeight: '100%', display: 'block', userSelect: 'none', pointerEvents: 'none' }} />

        {/* Dark overlay outside crop */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} />
          <div style={{
            position: 'absolute',
            left: `${crop.x * 100}%`, top: `${crop.y * 100}%`,
            width: `${crop.w * 100}%`, height: `${crop.h * 100}%`,
            backgroundColor: 'transparent',
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
            border: `1.5px solid rgba(255,255,255,0.6)`,
          }} />
          {/* Rule of thirds */}
          {[1/3, 2/3].map(f => (
            <div key={`h${f}`} style={{ position: 'absolute', left: `${crop.x * 100}%`, top: `${(crop.y + crop.h * f) * 100}%`, width: `${crop.w * 100}%`, height: '1px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
          ))}
          {[1/3, 2/3].map(f => (
            <div key={`v${f}`} style={{ position: 'absolute', top: `${crop.y * 100}%`, left: `${(crop.x + crop.w * f) * 100}%`, width: '1px', height: `${crop.h * 100}%`, backgroundColor: 'rgba(255,255,255,0.2)' }} />
          ))}
        </div>

        {/* Draggable crop area */}
        <div
          onPointerDown={e => onPointerDown(e, 'move')}
          style={{
            position: 'absolute',
            left: `${crop.x * 100}%`, top: `${crop.y * 100}%`,
            width: `${crop.w * 100}%`, height: `${crop.h * 100}%`,
            cursor: 'move', touchAction: 'none',
          }}
        >
          {/* Corner handles */}
          {(['nw', 'ne', 'sw', 'se'] as const).map(corner => (
            <div
              key={corner}
              onPointerDown={e => { e.stopPropagation(); onPointerDown(e, corner); }}
              style={{
                ...handleSz,
                cursor: corner === 'nw' || corner === 'se' ? 'nwse-resize' : 'nesw-resize',
                left: corner.includes('w') ? 0 : '100%',
                top: corner.includes('n') ? 0 : '100%',
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ padding: '16px', display: 'flex', gap: '10px' }}>
        <button onClick={onCancel} style={{ flex: 1, padding: '14px', backgroundColor: 'transparent', border: `1.5px solid ${theme.border}`, borderRadius: '10px', color: theme.textSecondary, fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
          CANCEL
        </button>
        <button onClick={applyCrop} style={{ flex: 2, padding: '14px', backgroundColor: theme.accent, border: 'none', borderRadius: '10px', color: theme.bg, fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
          APPLY CROP
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PhotoCapture({
  userId, gunId, gunName, setType, gunTypeProfile, onComplete, onCancel,
}: Props) {
  const shots = getShotsForSet(setType, gunTypeProfile);
  const requiredShots = shots.filter(s => s.required);
  const optionalShots = shots.filter(s => !s.required);

  const [shotIndex, setShotIndex] = useState(0);
  const [step, setStep] = useState<CaptureStep>('brief');
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [pendingUrl, setPendingUrl] = useState<string>('');
  const [showCrop, setShowCrop] = useState(false);
  const [records, setRecords] = useState<ShotRecord[]>([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Cache the photo set promise so concurrent uploads share one creation call
  const photoSetPromise = useRef<Promise<import('./photoTypes').PhotoSet | null> | null>(null);

  const currentShot: ShotSpec = shots[shotIndex];
  const isLast = shotIndex === shots.length - 1;
  const setLabel = setType === 'sale_listing' ? 'Sale Listing' : 'Insurance';

  // ── Camera helpers ────────────────────────────────────────────────────────

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

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    const url = URL.createObjectURL(file);
    setPendingBlob(file);
    setPendingUrl(url);
    setStep('confirm');
  }

  // ── Crop ─────────────────────────────────────────────────────────────────

  function handleCropApply(cropped: Blob) {
    if (pendingUrl) URL.revokeObjectURL(pendingUrl);
    const newUrl = URL.createObjectURL(cropped);
    setPendingBlob(cropped);
    setPendingUrl(newUrl);
    setShowCrop(false);
  }

  // ── Background save + AI ─────────────────────────────────────────────────

  const runBackgroundWork = useCallback(async (
    blob: Blob,
    shot: ShotSpec,
    shotIdx: number,
    recordIndex: number,
  ) => {
    // Background save — with 30s timeout so it never hangs forever
    let saveError: string | null = null;
    try {
      // Shared photo set promise — only one creation happens even with concurrent uploads
      if (!photoSetPromise.current) {
        photoSetPromise.current = getOrCreatePhotoSet(userId, gunId, setType, gunTypeProfile);
      }
      const saveTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Save timed out')), 30_000)
      );
      const photoSet = await Promise.race([photoSetPromise.current, saveTimeout]);
      if (!photoSet) throw new Error('Could not create photo set');
      const uploadBlob = await resizeForUpload(blob);
      const uploaded = await Promise.race([
        uploadPhoto(userId, gunId, shot.key, uploadBlob),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Upload timed out')), 30_000)),
      ]);
      if (!uploaded) throw new Error('Upload failed');
      await savePhotoAsset({
        userId, gunId,
        setId: photoSet.id,
        setType,
        shotType: shot.key,
        storagePath: uploaded.path,
        storageUrl: uploaded.url,
        isAcquisitionPhoto: shotIdx === 0 && setType === 'insurance',
      });
    } catch (err) {
      saveError = err instanceof Error ? err.message : 'Save failed';
    }

    setRecords(prev => prev.map((r, i) => i === recordIndex ? { ...r, saveError } : r));

    // Background AI review
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setRecords(prev => prev.map((r, i) => i === recordIndex ? { ...r, aiDone: true } : r));
        return;
      }

      const small = await resizeForReview(blob);
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(small);
      });

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

      const fallback: AiReviewResult = { approved: true, warnings: [] };
      const timeout = new Promise<AiReviewResult>(resolve => setTimeout(() => resolve(fallback), 20_000));

      const aiReview = fetch(`${SUPABASE_URL}/functions/v1/claude`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: 'photo_review',
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
              { type: 'text', text: `Review this ${shot.label} photo for ${setLabel} documentation.` },
            ],
          }],
          systemPrompt,
          maxTokens: 200,
        }),
      }).then(async res => {
        if (!res.ok) return fallback;
        const data = await res.json();
        const text = data.text ?? '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]) as AiReviewResult;
        return fallback;
      }).catch(() => fallback);

      const aiResult = await Promise.race([aiReview, timeout]);
      setRecords(prev => prev.map((r, i) => i === recordIndex ? { ...r, aiResult, aiDone: true } : r));
    } catch {
      setRecords(prev => prev.map((r, i) => i === recordIndex ? { ...r, aiDone: true } : r));
    }
  }, [userId, gunId, setType, gunTypeProfile, setLabel]);

  // ── Confirm step: accept photo ────────────────────────────────────────────

  function usePhoto() {
    if (!pendingBlob || !pendingUrl) return;
    const shot = currentShot;
    const shotIdx = shotIndex;
    const recordIndex = records.length;

    const newRecord: ShotRecord = {
      shotKey: shot.key,
      blob: pendingBlob,
      previewUrl: pendingUrl,
      aiResult: null,
      aiDone: false,
      saveError: null,
    };

    setRecords(prev => [...prev, newRecord]);
    runBackgroundWork(pendingBlob, shot, shotIdx, recordIndex);

    setPendingBlob(null);
    setPendingUrl('');

    if (isLast) {
      setStep('done');
    } else {
      setShotIndex(i => i + 1);
      setStep('brief');
    }
  }

  function retakeConfirm() {
    if (pendingUrl) URL.revokeObjectURL(pendingUrl);
    setPendingBlob(null);
    setPendingUrl('');
    setStep('brief');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function skipShot() {
    if (isLast) { setStep('done'); } else { setShotIndex(i => i + 1); setStep('brief'); }
  }

  // ── Done: retake a specific shot ─────────────────────────────────────────

  function retakeShot(targetIndex: number) {
    setShotIndex(targetIndex);
    setStep('brief');
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
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileSelected}
      />

      {/* Crop overlay */}
      {showCrop && pendingUrl && (
        <CropTool
          previewUrl={pendingUrl}
          onApply={handleCropApply}
          onCancel={() => setShowCrop(false)}
        />
      )}

      {/* Header */}
      <div style={{ padding: '16px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
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
            <div style={{ height: '2px', backgroundColor: theme.accent, borderRadius: '1px', width: `${(shotIndex / shots.length) * 100}%`, transition: 'width 0.3s' }} />
          </div>
        </div>
      )}

      {/* ── Brief ── */}
      {step === 'brief' && (
        <div style={{ padding: '24px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 700, color: theme.textPrimary, marginBottom: '16px' }}>
            {currentShot.label}
          </div>

          <div style={{ backgroundColor: theme.surface, borderRadius: '10px', padding: '16px', marginBottom: '24px', borderLeft: `3px solid ${theme.accent}` }}>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '1.5px', color: theme.accent, marginBottom: '8px' }}>HOW TO SHOOT THIS</div>
            <div style={{ fontFamily: 'monospace', fontSize: '13px', color: theme.textSecondary, lineHeight: 1.7 }}>
              {currentShot.coachingText}
            </div>
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={openCamera} style={accentBtn}>TAKE PHOTO</button>
            <button onClick={openGallery} style={outlineBtn}>UPLOAD PHOTO</button>
            {!currentShot.required && (
              <button onClick={skipShot} style={outlineBtn}>SKIP — NOT APPLICABLE</button>
            )}
            <button onClick={onCancel} style={{ ...outlineBtn, border: 'none', color: theme.textMuted }}>
              Save progress and exit
            </button>
          </div>
        </div>
      )}

      {/* ── Confirm ── */}
      {step === 'confirm' && pendingUrl && (
        <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: theme.textPrimary, marginBottom: '12px' }}>
            {currentShot.label}
          </div>

          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <img
              src={pendingUrl}
              alt="preview"
              style={{ width: '100%', maxHeight: '55vh', objectFit: 'contain', borderRadius: '8px', display: 'block' }}
            />
            <button
              onClick={() => setShowCrop(true)}
              style={{
                position: 'absolute', bottom: '10px', right: '10px',
                padding: '7px 12px', backgroundColor: 'rgba(0,0,0,0.7)',
                border: `1px solid ${theme.border}`, borderRadius: '6px',
                color: theme.textSecondary, fontFamily: 'monospace', fontSize: '11px',
                fontWeight: 700, cursor: 'pointer', letterSpacing: '0.5px',
              }}
            >
              CROP
            </button>
          </div>

          {error && (
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.orange, marginBottom: '10px', lineHeight: 1.5 }}>
              {error}
            </div>
          )}

          <div style={{ flex: 1 }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={usePhoto} style={accentBtn}>
              USE THIS PHOTO
            </button>
            <button onClick={retakeConfirm} style={outlineBtn}>RETAKE</button>
          </div>
        </div>
      )}

      {/* ── Done ── */}
      {step === 'done' && (
        <div style={{ padding: '20px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: theme.textPrimary, marginBottom: '4px' }}>
            {setLabel} Set — Review
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted, marginBottom: '20px' }}>
            AI review running in background. Results appear below.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {records.map((rec, i) => {
              const shot = shots.find(s => s.key === rec.shotKey);
              return (
                <div key={i} style={{ backgroundColor: theme.surface, borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', gap: '12px', padding: '10px' }}>
                    <img
                      src={rec.previewUrl}
                      alt={rec.shotKey}
                      style={{ width: '72px', height: '54px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: theme.textPrimary, marginBottom: '4px' }}>
                        {shot?.label ?? rec.shotKey}
                      </div>

                      {rec.saveError && (
                        <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.red, marginBottom: '4px' }}>
                          Save failed — {rec.saveError}
                        </div>
                      )}

                      {!rec.aiDone ? (
                        <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>Reviewing...</div>
                      ) : rec.aiResult ? (
                        rec.aiResult.warnings.length === 0 ? (
                          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.green }}>+ Looks good</div>
                        ) : (
                          <div>
                            {rec.aiResult.warnings.map((w, wi) => (
                              <div key={wi} style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.orange, lineHeight: 1.5 }}>— {w}</div>
                            ))}
                          </div>
                        )
                      ) : null}
                    </div>
                    <button
                      onClick={() => retakeShot(shots.findIndex(s => s.key === rec.shotKey))}
                      style={{
                        padding: '6px 10px', backgroundColor: 'transparent',
                        border: `1px solid ${theme.border}`, borderRadius: '6px',
                        color: theme.textMuted, fontFamily: 'monospace', fontSize: '10px',
                        fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start', flexShrink: 0,
                      }}
                    >
                      RETAKE
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Shots that were skipped (optional, not in records) */}
            {shots.filter(s => !s.required && !records.find(r => r.shotKey === s.key)).map((shot, i) => (
              <div key={`skip-${i}`} style={{ backgroundColor: theme.surface, borderRadius: '10px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.5 }}>
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textPrimary }}>{shot.label}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>Skipped — optional</div>
                </div>
                <button
                  onClick={() => { setShotIndex(shots.indexOf(shot)); setStep('brief'); }}
                  style={{ padding: '6px 10px', backgroundColor: 'transparent', border: `1px solid ${theme.border}`, borderRadius: '6px', color: theme.textMuted, fontFamily: 'monospace', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
                >
                  ADD
                </button>
              </div>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          <button onClick={onComplete} style={accentBtn}>DONE</button>
        </div>
      )}
    </div>
  );
}
