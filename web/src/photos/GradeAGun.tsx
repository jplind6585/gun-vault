/**
 * GradeAGun — AI-powered cosmetic condition assessment.
 *
 * Takes a set of uploaded photos, sends to Claude for NRA-scale rating
 * of each visible area. COSMETIC ONLY.
 */

import { useState } from 'react';
import { theme } from '../theme';
import { supabase } from '../lib/supabase';
import { SUPABASE_URL } from '../lib/supabase';
import { saveGradeAssessment } from './photoService';
import type { PhotoAsset, GradeAssessment, NRAGrade, GunTypeProfile } from './photoTypes';
import { GUN_TYPE_PROFILE_LABELS } from './photoTypes';

interface Props {
  userId: string;
  gunId: string;
  gunName: string;
  gunTypeProfile: GunTypeProfile;
  assets: PhotoAsset[];         // must have storage URLs
  onComplete: (assessment: GradeAssessment) => void;
  onCancel: () => void;
}

const NRA_GRADES: NRAGrade[] = ['Perfect', 'Excellent', 'Very Good', 'Good', 'Fair', 'Poor'];

const GRADE_COLORS: Record<NRAGrade, string> = {
  Perfect:    '#51cf66',
  Excellent:  '#94d82d',
  'Very Good':'#ffd43b',
  Good:       '#ff9f43',
  Fair:       '#ff6b6b',
  Poor:       '#e03131',
};

// Areas assessed per gun type profile (semi-auto pistol as baseline)
const ASSESSMENT_AREAS: Record<string, string[]> = {
  semi_auto_pistol:   ['Frame', 'Slide', 'Barrel Crown', 'Grip Panels', 'Controls', 'Sights', 'Overall'],
  revolver:           ['Frame', 'Cylinder', 'Barrel Crown', 'Grip Panels', 'Action', 'Sights', 'Overall'],
  ar_pattern_rifle:   ['Upper Receiver', 'Lower Receiver', 'Barrel Crown', 'Stock / Buffer Tube', 'Handguard', 'Controls', 'Overall'],
  bolt_action_rifle:  ['Receiver', 'Barrel', 'Barrel Crown', 'Stock', 'Bolt', 'Sights / Optic Mount', 'Overall'],
  lever_action_rifle: ['Receiver', 'Barrel', 'Barrel Crown', 'Stock / Forearm', 'Action', 'Sights', 'Overall'],
  semi_auto_rifle:    ['Receiver', 'Barrel', 'Barrel Crown', 'Stock', 'Controls', 'Sights', 'Overall'],
  pump_shotgun:       ['Receiver', 'Barrel', 'Barrel Crown', 'Stock / Forearm', 'Action Bar', 'Sights', 'Overall'],
  semi_auto_shotgun:  ['Receiver', 'Barrel', 'Barrel Crown', 'Stock', 'Controls', 'Sights', 'Overall'],
};

const DISCLAIMER = 'This is a cosmetic condition assessment based on photos only. It does not evaluate function, safety, or mechanical condition. Do not rely on this assessment for safety decisions. Consult a licensed gunsmith for any functional concerns.';

export function GradeAGun({ userId, gunId, gunName, gunTypeProfile, assets, onComplete, onCancel }: Props) {
  const [step, setStep] = useState<'disclaimer' | 'select' | 'running' | 'results'>('disclaimer');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(assets.map(a => a.id)));
  const [assessment, setAssessment] = useState<GradeAssessment | null>(null);
  const [error, setError] = useState('');

  const areas = ASSESSMENT_AREAS[gunTypeProfile] ?? ASSESSMENT_AREAS.semi_auto_pistol;

  // ── Run assessment ────────────────────────────────────────────────────────

  async function runAssessment() {
    setStep('running');
    setError('');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError('Not signed in.'); setStep('select'); return; }

    const selected = assets.filter(a => selectedIds.has(a.id) && a.storageUrl);
    if (selected.length === 0) { setError('No photos available.'); setStep('select'); return; }

    // Build image content blocks (max 5 photos to keep tokens reasonable)
    const photoAssets = selected.slice(0, 5);
    const imageBlocks: unknown[] = [];

    for (const asset of photoAssets) {
      // Fetch as blob for base64
      try {
        const res = await fetch(asset.storageUrl!);
        const blob = await res.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        imageBlocks.push({
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: base64 },
        });
        imageBlocks.push({
          type: 'text',
          text: `Above image: ${asset.shotType?.replace(/_/g, ' ') ?? 'gun photo'}`,
        });
      } catch { /* skip failed image */ }
    }

    const systemPrompt = `You are an expert firearms appraiser assessing cosmetic condition from photos.
Gun: ${gunName} (${GUN_TYPE_PROFILE_LABELS[gunTypeProfile]})
Areas to assess: ${areas.join(', ')}

Use the NRA grading scale: Perfect, Excellent, Very Good, Good, Fair, Poor.
COSMETIC assessment only — do not comment on function, safety, or mechanical condition.
For each area, provide a grade and a one-sentence explanation (max 15 words).

Return ONLY valid JSON in this exact format:
{
  "overall": "Very Good",
  "areas": {
    "Frame": { "grade": "Excellent", "note": "Minimal holster wear on left side, finish 97%." },
    ...
  }
}`;

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/claude`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feature: 'grade_a_gun',
          messages: [{
            role: 'user',
            content: [
              ...imageBlocks,
              { type: 'text', text: `Assess the cosmetic condition of this ${gunName} using the NRA grading scale. Return JSON only.` },
            ],
          }],
          systemPrompt,
          maxTokens: 600,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Assessment failed. Try again.');
      }

      const data = await res.json();
      const text = data.text ?? '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Could not parse assessment result.');

      const parsed = JSON.parse(jsonMatch[0]);
      const overallGrade = parsed.overall as NRAGrade;
      const areaGrades: Record<string, { grade: string; note: string }> = {};
      for (const [area, val] of Object.entries(parsed.areas ?? {})) {
        const v = val as { grade: string; note: string };
        areaGrades[area] = { grade: v.grade, note: v.note };
      }

      const saved = await saveGradeAssessment({
        userId, gunId,
        overallGrade,
        areaGrades,
        photoAssetIds: photoAssets.map(a => a.id),
      });

      if (!saved) throw new Error('Could not save assessment.');
      setAssessment(saved);
      setStep('results');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assessment failed.');
      setStep('select');
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
  };

  const outlineBtn: React.CSSProperties = {
    width: '100%', padding: '14px',
    backgroundColor: 'transparent', border: `1.5px solid ${theme.border}`,
    borderRadius: '10px', color: theme.textSecondary,
    fontFamily: 'monospace', fontSize: '12px',
    fontWeight: 700, letterSpacing: '1px', cursor: 'pointer',
  };

  const sectionLabel: React.CSSProperties = {
    fontFamily: 'monospace', fontSize: '10px', letterSpacing: '1.5px',
    color: theme.textMuted, marginBottom: '12px',
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={container}>
      {/* Header */}
      <div style={{ padding: '16px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '1.5px', color: theme.textMuted, marginBottom: '2px' }}>GRADE-A-GUN</div>
          <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: theme.textPrimary }}>{gunName}</div>
        </div>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: theme.textMuted, fontSize: '20px', cursor: 'pointer', padding: '4px' }}>×</button>
      </div>

      {/* ── Disclaimer ── */}
      {step === 'disclaimer' && (
        <div style={{ padding: '24px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ backgroundColor: 'rgba(255, 159, 67, 0.08)', border: `1px solid rgba(255, 159, 67, 0.3)`, borderRadius: '10px', padding: '16px', marginBottom: '24px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '1.5px', color: theme.orange, marginBottom: '10px' }}>IMPORTANT</div>
            <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textSecondary, lineHeight: 1.7 }}>{DISCLAIMER}</div>
          </div>

          <div style={{ fontFamily: 'monospace', fontSize: '13px', color: theme.textSecondary, lineHeight: 1.7, marginBottom: '24px' }}>
            Grade-a-Gun rates the cosmetic condition of each visible area using the NRA grading scale — Perfect through Poor — based on the photos you've taken.
          </div>

          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={() => setStep('select')} style={accentBtn}>I UNDERSTAND — CONTINUE</button>
            <button onClick={onCancel} style={outlineBtn}>CANCEL</button>
          </div>
        </div>
      )}

      {/* ── Select photos ── */}
      {step === 'select' && (
        <div style={{ padding: '24px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={sectionLabel}>SELECT PHOTOS TO ASSESS ({selectedIds.size} selected)</div>

          {assets.length === 0 ? (
            <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textMuted, marginBottom: '24px' }}>
              No photos found. Take photos in the Insurance or Sale Listing set first.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '24px' }}>
              {assets.filter(a => a.storageUrl).map(asset => {
                const selected = selectedIds.has(asset.id);
                return (
                  <div
                    key={asset.id}
                    onClick={() => setSelectedIds(prev => {
                      const next = new Set(prev);
                      if (next.has(asset.id)) next.delete(asset.id); else next.add(asset.id);
                      return next;
                    })}
                    style={{ position: 'relative', aspectRatio: '1', borderRadius: '6px', overflow: 'hidden', cursor: 'pointer', border: `2px solid ${selected ? theme.accent : 'transparent'}` }}
                  >
                    <img src={asset.storageUrl!} alt={asset.shotType ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {selected && (
                      <div style={{ position: 'absolute', top: '4px', right: '4px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: theme.bg, fontSize: '10px', fontWeight: 700 }}>+</span>
                      </div>
                    )}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', padding: '3px 5px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '8px', color: theme.textSecondary, letterSpacing: '0.3px' }}>
                        {asset.shotType?.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {error && <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.red, marginBottom: '12px' }}>{error}</div>}

          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={runAssessment} disabled={selectedIds.size === 0} style={{ ...accentBtn, opacity: selectedIds.size === 0 ? 0.5 : 1 }}>
              RUN ASSESSMENT
            </button>
            <button onClick={onCancel} style={outlineBtn}>CANCEL</button>
          </div>
        </div>
      )}

      {/* ── Running ── */}
      {step === 'running' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', gap: '16px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textMuted, letterSpacing: '1px', textAlign: 'center' }}>
            Assessing condition...
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted, textAlign: 'center', lineHeight: 1.6 }}>
            Reviewing {selectedIds.size} photo{selectedIds.size !== 1 ? 's' : ''} across {areas.length} areas.
          </div>
        </div>
      )}

      {/* ── Results ── */}
      {step === 'results' && assessment && (
        <div style={{ padding: '20px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Overall grade */}
          <div style={{ textAlign: 'center', marginBottom: '24px', padding: '20px', backgroundColor: theme.surface, borderRadius: '12px' }}>
            <div style={sectionLabel}>OVERALL CONDITION</div>
            <div style={{ fontFamily: 'monospace', fontSize: '28px', fontWeight: 700, color: GRADE_COLORS[assessment.overallGrade as NRAGrade] ?? theme.accent }}>
              {assessment.overallGrade}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted, marginTop: '6px' }}>{gunName}</div>
          </div>

          {/* Area grades */}
          <div style={sectionLabel}>AREA BREAKDOWN</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
            {Object.entries(assessment.areaGrades).map(([area, val]) => {
              const grade = val.grade as NRAGrade;
              const color = GRADE_COLORS[grade] ?? theme.textSecondary;
              return (
                <div key={area} style={{ backgroundColor: theme.surface, borderRadius: '8px', padding: '12px 14px', borderLeft: `3px solid ${color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: theme.textPrimary }}>{area}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color }}>{grade}</span>
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textSecondary, lineHeight: 1.5 }}>{val.note}</div>
                </div>
              );
            })}
          </div>

          {/* FMV stub */}
          <div style={{ backgroundColor: theme.surface, borderRadius: '8px', padding: '12px 14px', marginBottom: '24px', border: `0.5px solid ${theme.border}` }}>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '1px', color: theme.textMuted, marginBottom: '4px' }}>ESTIMATED FMV</div>
            <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textMuted }}>GunBroker comps — coming soon</div>
          </div>

          {/* Disclaimer reminder */}
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, lineHeight: 1.5, marginBottom: '20px' }}>
            {DISCLAIMER}
          </div>

          <button onClick={() => onComplete(assessment)} style={accentBtn}>DONE</button>
        </div>
      )}
    </div>
  );
}
