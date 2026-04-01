// Full-page session logging — multi-gun, multi-distance "strings" support
import { useState, useRef } from 'react';
import { theme } from './theme';
import type { Gun, SessionPurpose, IssueType, TargetPhoto, SessionString } from './types';
import {
  logSession, updateSession, getAllGuns,
  getAmmoByCaliber, updateAmmo, getRecentLocations,
} from './storage';
import { generateSessionNarrative, hasClaudeApiKey, analyzeTargetPhoto } from './claudeApi';
import { haptic } from './haptic';

interface SessionLogViewProps {
  preselectedGun?: Gun | null;
  onSaved: () => void;
  onCancel: () => void;
}

const PURPOSES: SessionPurpose[] = ['Warmup', 'Drills', 'Zeroing', 'Qualification', 'Competition', 'Fun', 'Carry Eval'];
const ISSUE_TYPES: IssueType[] = ['FTF', 'FTE', 'Double Feed', 'Stovepipe', 'Trigger Reset', 'Accuracy', 'Sighting', 'Other'];
const DISTANCES = [7, 15, 25, 50, 100, 200, 300];

function generateStringId() {
  return `${Date.now()}${Math.random().toString(36).substr(2, 6)}`;
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '9px',
  letterSpacing: '0.8px',
  color: theme.textMuted,
  textTransform: 'uppercase',
  marginBottom: '6px',
  display: 'block',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  backgroundColor: theme.surface,
  border: `0.5px solid ${theme.border}`,
  borderRadius: '6px',
  color: theme.textPrimary,
  fontFamily: 'monospace',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
};

function Chip({
  label, active, onClick, color,
}: {
  label: string; active: boolean; onClick: () => void; color?: string;
}) {
  const c = color || theme.accent;
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 10px',
        backgroundColor: active ? c : 'transparent',
        color: active ? theme.bg : theme.textSecondary,
        border: `0.5px solid ${active ? c : theme.border}`,
        borderRadius: '4px',
        fontFamily: 'monospace',
        fontSize: '10px',
        letterSpacing: '0.5px',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        fontWeight: active ? 700 : 400,
      }}
    >
      {label}
    </button>
  );
}

// ── Target analysis card ──────────────────────────────────────────────────────

function TargetAnalysisCard({ analysis }: { analysis: import('./types').TargetPhotoAnalysis }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.blue, fontWeight: 700, marginBottom: '4px' }}>
        AI ANALYSIS
      </div>
      {analysis.accuracy && (
        <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textPrimary, marginBottom: '2px' }}>
          {analysis.accuracy} · {analysis.groupSize}
        </div>
      )}
      {analysis.pattern && (
        <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textSecondary, marginBottom: '4px', lineHeight: 1.4 }}>
          {analysis.pattern}
        </div>
      )}
      {(analysis.issues?.length || analysis.recommendations?.length || analysis.equipmentWarnings?.length) && (
        <button
          onClick={() => setExpanded(e => !e)}
          style={{ background: 'none', border: 'none', color: theme.accent, fontFamily: 'monospace', fontSize: '9px', cursor: 'pointer', padding: 0 }}
        >
          {expanded ? '▲ LESS' : '▼ MORE'}
        </button>
      )}
      {expanded && (
        <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {analysis.equipmentWarnings?.length ? (
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#ff6b6b', marginBottom: '3px' }}>EQUIPMENT WARNINGS</div>
              {analysis.equipmentWarnings.map((w, i) => (
                <div key={i} style={{ fontFamily: 'monospace', fontSize: '10px', color: '#ff6b6b', lineHeight: 1.4 }}>⚠ {w}</div>
              ))}
            </div>
          ) : null}
          {analysis.issues?.length ? (
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginBottom: '3px' }}>ISSUES</div>
              {analysis.issues.map((issue, i) => (
                <div key={i} style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textSecondary, lineHeight: 1.4 }}>• {issue}</div>
              ))}
            </div>
          ) : null}
          {analysis.recommendations?.length ? (
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginBottom: '3px' }}>RECOMMENDATIONS</div>
              {analysis.recommendations.map((r, i) => (
                <div key={i} style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textSecondary, lineHeight: 1.4 }}>→ {r}</div>
              ))}
            </div>
          ) : null}
          {analysis.drills?.length ? (
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginBottom: '3px' }}>SUGGESTED DRILLS</div>
              {analysis.drills.map((d, i) => (
                <div key={i} style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.accent, lineHeight: 1.4 }}>▸ {d}</div>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ── String picker overlay ─────────────────────────────────────────────────────

interface StringPickerProps {
  allGuns: Gun[];
  preselectedGun?: Gun | null;
  onAdd: (s: SessionString) => void;
  onCancel: () => void;
}

function StringPicker({ allGuns, preselectedGun, onAdd, onCancel }: StringPickerProps) {
  const [gunSearch, setGunSearch] = useState('');
  const [selectedGun, setSelectedGun] = useState<Gun | null>(preselectedGun || null);
  const [distanceYards, setDistanceYards] = useState<number | ''>('');
  const [rounds, setRounds] = useState('');
  const [ammoLotId, setAmmoLotId] = useState('');
  const [stringNotes, setStringNotes] = useState('');
  const [pickerStep, setPickerStep] = useState<'gun' | 'details'>(preselectedGun ? 'details' : 'gun');

  const compatibleLots = selectedGun ? getAmmoByCaliber(selectedGun.caliber) : [];

  const filteredGuns = allGuns.filter(g => {
    const q = gunSearch.toLowerCase();
    return !q || `${g.make} ${g.model} ${g.caliber}`.toLowerCase().includes(q);
  });

  function handleAdd() {
    if (!selectedGun || !rounds || parseInt(rounds) <= 0) return;
    haptic('medium');
    onAdd({
      id: generateStringId(),
      gunId: selectedGun.id,
      distanceYards: distanceYards || undefined,
      roundsExpended: parseInt(rounds),
      ammoLotId: ammoLotId || undefined,
      notes: stringNotes || undefined,
    });
  }

  const canAdd = selectedGun && rounds && parseInt(rounds) > 0;

  // Gun picker sub-step
  if (pickerStep === 'gun') {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 100,
        backgroundColor: theme.bg,
        display: 'flex', flexDirection: 'column',
        maxWidth: '480px', margin: '0 auto',
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 16px',
          borderBottom: `0.5px solid ${theme.border}`,
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <button
            onClick={onCancel}
            style={{ background: 'none', border: 'none', color: theme.textMuted, fontFamily: 'monospace', fontSize: '11px', cursor: 'pointer', padding: 0 }}
          >
            ← CANCEL
          </button>
          <span style={{ fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.8px', color: theme.textSecondary, flex: 1, textAlign: 'center' }}>
            SELECT FIREARM
          </span>
          <span style={{ width: '60px' }} />
        </div>

        <div style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
          <div style={{ marginBottom: '12px' }}>
            <input
              autoFocus
              type="text"
              placeholder="Search make, model, caliber..."
              value={gunSearch}
              onChange={e => setGunSearch(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filteredGuns.map(gun => (
              <button
                key={gun.id}
                onClick={() => { setSelectedGun(gun); setAmmoLotId(''); setPickerStep('details'); }}
                style={{
                  padding: '12px 14px',
                  backgroundColor: theme.surface,
                  border: `0.5px solid ${theme.border}`,
                  borderRadius: '6px',
                  color: theme.textPrimary,
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700 }}>
                    {gun.make} {gun.model}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.caliberRed, marginTop: '2px' }}>
                    {gun.caliber} · {gun.action}
                  </div>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, textAlign: 'right' }}>
                  <div>{(gun.roundCount || 0).toLocaleString()}</div>
                  <div style={{ fontSize: '8px' }}>ROUNDS</div>
                </div>
              </button>
            ))}
            {filteredGuns.length === 0 && (
              <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textMuted, padding: '24px', textAlign: 'center' }}>
                No firearms match "{gunSearch}"
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Details sub-step
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      backgroundColor: theme.bg,
      display: 'flex', flexDirection: 'column',
      maxWidth: '480px', margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: `0.5px solid ${theme.border}`,
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <button
          onClick={() => preselectedGun ? onCancel() : setPickerStep('gun')}
          style={{ background: 'none', border: 'none', color: theme.textMuted, fontFamily: 'monospace', fontSize: '11px', cursor: 'pointer', padding: 0 }}
        >
          ← {preselectedGun ? 'CANCEL' : 'BACK'}
        </button>
        <span style={{ fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.8px', color: theme.textSecondary, flex: 1, textAlign: 'center' }}>
          STRING DETAILS
        </span>
        <span style={{ width: '60px' }} />
      </div>

      <div style={{ padding: '16px', flex: 1, overflowY: 'auto', paddingBottom: '100px' }}>
        {/* Selected gun banner */}
        {selectedGun && (
          <div style={{
            backgroundColor: theme.surface,
            border: `0.5px solid ${theme.border}`,
            borderRadius: '6px',
            padding: '10px 14px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: theme.textPrimary }}>
                {selectedGun.make} {selectedGun.model}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.caliberRed }}>
                {selectedGun.caliber}
              </div>
            </div>
            {!preselectedGun && (
              <button
                onClick={() => setPickerStep('gun')}
                style={{ background: 'none', border: 'none', color: theme.accent, fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer' }}
              >
                CHANGE
              </button>
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Distance */}
          <div>
            <span style={labelStyle}>Distance</span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {DISTANCES.map(d => (
                <Chip
                  key={d}
                  label={`${d}yd`}
                  active={distanceYards === d}
                  onClick={() => setDistanceYards(distanceYards === d ? '' : d)}
                />
              ))}
            </div>
            <input
              type="number"
              inputMode="numeric"
              placeholder="Or enter custom yards"
              value={distanceYards}
              onChange={e => setDistanceYards(e.target.value ? parseInt(e.target.value) : '')}
              style={inputStyle}
              min="1"
            />
          </div>

          {/* Rounds */}
          <div>
            <span style={labelStyle}>Rounds Fired *</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="e.g., 50"
              value={rounds}
              onChange={e => setRounds(e.target.value)}
              style={{
                ...inputStyle,
                fontSize: '22px',
                fontWeight: 700,
                textAlign: 'center',
                borderColor: rounds && parseInt(rounds) > 0 ? theme.accent : theme.border,
              }}
              min="1"
            />
          </div>

          {/* Ammo Lot */}
          <div>
            <span style={labelStyle}>Ammo Used</span>
            {!selectedGun || compatibleLots.length === 0 ? (
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted }}>
                {selectedGun ? `No ${selectedGun.caliber} lots in inventory` : 'Select a firearm first'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button
                  onClick={() => setAmmoLotId('')}
                  style={{
                    padding: '10px 12px',
                    backgroundColor: 'transparent',
                    border: `0.5px solid ${!ammoLotId ? theme.accent : theme.border}`,
                    borderRadius: '6px',
                    color: !ammoLotId ? theme.accent : theme.textMuted,
                    fontFamily: 'monospace',
                    fontSize: '10px',
                    letterSpacing: '0.5px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  NONE / NOT TRACKED
                </button>
                {compatibleLots.map(lot => (
                  <button
                    key={lot.id}
                    onClick={() => setAmmoLotId(lot.id)}
                    style={{
                      padding: '10px 12px',
                      backgroundColor: ammoLotId === lot.id ? 'rgba(255,212,59,0.08)' : 'transparent',
                      border: `0.5px solid ${ammoLotId === lot.id ? theme.accent : theme.border}`,
                      borderRadius: '6px',
                      color: ammoLotId === lot.id ? theme.accent : theme.textPrimary,
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>{lot.brand} {lot.productLine} · {lot.grainWeight}gr</span>
                    <span style={{ color: theme.textMuted, fontSize: '10px' }}>{lot.quantity.toLocaleString()} rd</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* String Notes */}
          <div>
            <span style={labelStyle}>String Notes (optional)</span>
            <textarea
              placeholder="e.g., 1-handed drill, rapid fire"
              value={stringNotes}
              onChange={e => setStringNotes(e.target.value)}
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

        </div>
      </div>

      {/* Add button — fixed at bottom */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        maxWidth: '480px', margin: '0 auto',
        padding: '12px 16px',
        backgroundColor: theme.bg,
        borderTop: `0.5px solid ${theme.border}`,
      }}>
        <button
          onClick={handleAdd}
          disabled={!canAdd}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: canAdd ? theme.accent : theme.surface,
            border: 'none',
            borderRadius: '6px',
            color: canAdd ? theme.bg : theme.textMuted,
            fontFamily: 'monospace',
            fontSize: '12px',
            letterSpacing: '0.8px',
            fontWeight: 700,
            cursor: canAdd ? 'pointer' : 'not-allowed',
          }}
        >
          ADD TO SESSION
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function SessionLogView({ preselectedGun, onSaved, onCancel }: SessionLogViewProps) {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const allGuns = getAllGuns().filter(g => g.status === 'Active' || g.status === 'Stored');
  const recentLocations = getRecentLocations();

  // Session header state
  const [date, setDate] = useState(today);
  const [location, setLocation] = useState('');
  const [indoorOutdoor, setIndoorOutdoor] = useState<'Indoor' | 'Outdoor'>('Outdoor');
  const [purposes, setPurposes] = useState<SessionPurpose[]>([]);
  const [notes, setNotes] = useState('');

  // Strings state
  const [strings, setStrings] = useState<SessionString[]>(() => {
    if (preselectedGun) {
      return [{
        id: generateStringId(),
        gunId: preselectedGun.id,
        roundsExpended: 0,
      }];
    }
    return [];
  });
  const [showStringPicker, setShowStringPicker] = useState(false);
  // If we have a preselected gun with an empty placeholder string, open picker immediately
  const [openPickerForPreselected] = useState(() => !!preselectedGun);

  // Show string picker immediately if preselected gun
  const [pickerOpenedOnce, setPickerOpenedOnce] = useState(false);

  // Issues state
  const [hasIssues, setHasIssues] = useState(false);
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);
  const [issueDescription, setIssueDescription] = useState('');

  // Target photos state
  const [targetPhotos, setTargetPhotos] = useState<TargetPhoto[]>([]);
  const [analyzingPhoto, setAnalyzingPhoto] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // If preselected gun, open the string picker right away (once)
  if (openPickerForPreselected && !pickerOpenedOnce && !showStringPicker) {
    setShowStringPicker(true);
    setPickerOpenedOnce(true);
    // Clear the placeholder string we pre-added
    setStrings([]);
  }

  function togglePurpose(p: SessionPurpose) {
    setPurposes(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }

  function toggleIssueType(t: IssueType) {
    setIssueTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  function handleAddString(s: SessionString) {
    setStrings(prev => [...prev, s]);
    setShowStringPicker(false);
  }

  function removeString(id: string) {
    setStrings(prev => prev.filter(s => s.id !== id));
  }

  async function handlePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      const primaryString = strings[0];
      const primaryGun = primaryString ? allGuns.find(g => g.id === primaryString.gunId) || null : null;
      const photo: TargetPhoto = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        dataUrl,
        distanceYards: primaryString?.distanceYards || undefined,
        capturedAt: new Date().toISOString(),
      };
      setTargetPhotos(prev => [...prev, photo]);

      if (hasClaudeApiKey() && primaryGun) {
        setAnalyzingPhoto(photo.id);
        try {
          const primaryLots = primaryString?.ammoLotId
            ? getAmmoByCaliber(primaryGun.caliber).find(l => l.id === primaryString.ammoLotId) || null
            : null;
          const analysis = await analyzeTargetPhoto(dataUrl, {
            gun: primaryGun,
            distanceYards: primaryString?.distanceYards || undefined,
            roundsExpended: primaryString?.roundsExpended || undefined,
            ammoLot: primaryLots,
          });
          setTargetPhotos(prev =>
            prev.map(p => p.id === photo.id ? { ...p, analysis } : p)
          );
        } catch (err) {
          console.error('Target analysis failed:', err);
        } finally {
          setAnalyzingPhoto(null);
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function removePhoto(id: string) {
    setTargetPhotos(prev => prev.filter(p => p.id !== id));
  }

  async function handleSave() {
    if (strings.length === 0) return;
    const validStrings = strings.filter(s => s.roundsExpended > 0);
    if (validStrings.length === 0) return;

    haptic('medium');
    setSaving(true);

    try {
      const primaryString = validStrings[0];
      const primaryGun = allGuns.find(g => g.id === primaryString.gunId);
      const totalRounds = validStrings.reduce((sum, s) => sum + s.roundsExpended, 0);

      // Calculate total session cost from all strings
      let totalCost: number | undefined;
      for (const s of validStrings) {
        if (s.ammoLotId) {
          const gun = allGuns.find(g => g.id === s.gunId);
          if (gun) {
            const lot = getAmmoByCaliber(gun.caliber).find(l => l.id === s.ammoLotId);
            if (lot?.purchasePricePerRound) {
              totalCost = (totalCost || 0) + lot.purchasePricePerRound * s.roundsExpended;
            }
          }
        }
      }

      const sessionId = logSession({
        gunId: primaryString.gunId,
        date,
        roundsExpended: totalRounds,
        location: location || undefined,
        indoorOutdoor,
        purpose: purposes.length ? purposes : undefined,
        distanceYards: primaryString.distanceYards,
        issues: hasIssues,
        issueTypes: hasIssues && issueTypes.length ? issueTypes : undefined,
        issueDescription: hasIssues && issueDescription ? issueDescription : undefined,
        notes: notes || undefined,
        ammoLotId: primaryString.ammoLotId || undefined,
        sessionCost: totalCost,
        isCarryGun: primaryGun
          ? (primaryGun.purpose?.includes('EDC') || primaryGun.purpose?.includes('Self Defense'))
          : false,
        targetPhotos: targetPhotos.length ? targetPhotos : undefined,
        strings: validStrings,
      });

      // Decrement ammo for each string
      for (const s of validStrings) {
        if (s.ammoLotId && s.roundsExpended > 0) {
          const gun = allGuns.find(g => g.id === s.gunId);
          if (gun) {
            const lot = getAmmoByCaliber(gun.caliber).find(l => l.id === s.ammoLotId);
            if (lot) {
              updateAmmo(s.ammoLotId, { quantity: Math.max(0, lot.quantity - s.roundsExpended) });
            }
          }
        }
      }

      // Generate AI narrative in background
      if (hasClaudeApiKey() && primaryGun) {
        const primaryLot = primaryString.ammoLotId
          ? getAmmoByCaliber(primaryGun.caliber).find(l => l.id === primaryString.ammoLotId) || null
          : null;
        generateSessionNarrative(
          {
            id: sessionId,
            gunId: primaryString.gunId,
            date,
            roundsExpended: totalRounds,
            location: location || undefined,
            indoorOutdoor,
            purpose: purposes.length ? purposes : undefined,
            distanceYards: primaryString.distanceYards,
            issues: hasIssues,
            issueTypes: hasIssues && issueTypes.length ? issueTypes : undefined,
            notes: notes || undefined,
            ammoLotId: primaryString.ammoLotId || undefined,
          },
          primaryGun,
          primaryLot
        ).then(narrative => {
          if (narrative) updateSession(sessionId, { aiNarrative: narrative });
        }).catch(() => {});
      }

      onSaved();
    } finally {
      setSaving(false);
    }
  }

  const canSave = strings.filter(s => s.roundsExpended > 0).length > 0;

  // ── String picker overlay ────────────────────────────────────────────────────

  if (showStringPicker) {
    return (
      <StringPicker
        allGuns={allGuns}
        preselectedGun={preselectedGun}
        onAdd={handleAddString}
        onCancel={() => {
          setShowStringPicker(false);
          // If no strings yet and user cancels the very first picker, go back entirely
          if (strings.length === 0) onCancel();
        }}
      />
    );
  }

  // ── Session header form ──────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, padding: '16px', paddingBottom: '100px', maxWidth: '480px', margin: '0 auto' }}>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

        {/* Date */}
        <div>
          <span style={labelStyle}>Date</span>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <Chip label="Today" active={date === today} onClick={() => setDate(today)} />
            <Chip label="Yesterday" active={date === yesterday} onClick={() => setDate(yesterday)} />
          </div>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Location */}
        <div>
          <span style={labelStyle}>Location</span>
          {recentLocations.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {recentLocations.map(loc => (
                <button
                  key={loc}
                  onClick={() => setLocation(loc)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: location === loc ? theme.accent : theme.surface,
                    color: location === loc ? theme.bg : theme.textMuted,
                    border: `0.5px solid ${location === loc ? theme.accent : theme.border}`,
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '10px',
                    cursor: 'pointer',
                  }}
                >
                  {loc}
                </button>
              ))}
            </div>
          )}
          <input
            type="text"
            inputMode="text"
            placeholder="e.g., SRGC, Backyard, Indoor Range"
            value={location}
            onChange={e => setLocation(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Indoor / Outdoor */}
        <div>
          <span style={labelStyle}>Environment</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['Indoor', 'Outdoor'] as const).map(env => (
              <Chip key={env} label={env} active={indoorOutdoor === env} onClick={() => setIndoorOutdoor(env)} />
            ))}
          </div>
        </div>

        {/* Purpose */}
        <div>
          <span style={labelStyle}>Purpose (pick all that apply)</span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {PURPOSES.map(p => (
              <Chip key={p} label={p} active={purposes.includes(p)} onClick={() => togglePurpose(p)} />
            ))}
          </div>
        </div>

        {/* Session Notes */}
        <div>
          <span style={labelStyle}>Session Notes (optional)</span>
          <textarea
            placeholder="e.g., re-zeroed at 100yd, testing new ammo, worked on draw speed"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        {/* ── Strings section ── */}
        <div>
          <span style={labelStyle}>Strings</span>

          {/* Existing string cards */}
          {strings.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
              {strings.map((s, idx) => {
                const gun = allGuns.find(g => g.id === s.gunId);
                const ammoLot = s.ammoLotId && gun
                  ? getAmmoByCaliber(gun.caliber).find(l => l.id === s.ammoLotId)
                  : null;
                return (
                  <div
                    key={s.id}
                    style={{
                      backgroundColor: theme.surface,
                      border: `0.5px solid ${theme.border}`,
                      borderRadius: '6px',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    {/* String number badge */}
                    <div style={{
                      width: '22px', height: '22px',
                      borderRadius: '50%',
                      backgroundColor: theme.accent,
                      color: theme.bg,
                      fontFamily: 'monospace',
                      fontSize: '10px',
                      fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {idx + 1}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: theme.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {gun ? `${gun.make} ${gun.model}` : 'Unknown'}
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textSecondary, marginTop: '2px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {gun && <span style={{ color: theme.caliberRed }}>{gun.caliber}</span>}
                        {s.distanceYards && <span>{s.distanceYards}yd</span>}
                        <span style={{ color: theme.accent }}>{s.roundsExpended} rds</span>
                        {ammoLot && <span style={{ color: theme.textMuted }}>{ammoLot.brand} {ammoLot.grainWeight}gr</span>}
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeString(s.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: theme.textMuted,
                        cursor: 'pointer',
                        fontSize: '18px',
                        lineHeight: 1,
                        padding: '0 2px',
                        flexShrink: 0,
                      }}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add string button */}
          <button
            onClick={() => { haptic('light'); setShowStringPicker(true); }}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: 'transparent',
              border: `1px dashed ${strings.length === 0 ? theme.accent : theme.border}`,
              borderRadius: '6px',
              color: strings.length === 0 ? theme.accent : theme.textMuted,
              fontFamily: 'monospace',
              fontSize: '11px',
              letterSpacing: '0.5px',
              fontWeight: strings.length === 0 ? 700 : 400,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span>
            {strings.length === 0 ? 'ADD YOUR FIRST STRING' : 'ADD ANOTHER STRING'}
          </button>

          {/* Running totals */}
          {strings.length > 0 && (
            <div style={{
              marginTop: '10px',
              padding: '8px 12px',
              backgroundColor: 'rgba(255,212,59,0.06)',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '10px',
              color: theme.textSecondary,
              display: 'flex',
              gap: '16px',
            }}>
              <span>{strings.length} string{strings.length !== 1 ? 's' : ''}</span>
              <span style={{ color: theme.accent }}>
                {strings.reduce((sum, s) => sum + s.roundsExpended, 0)} total rounds
              </span>
              <span>
                {new Set(strings.map(s => s.gunId)).size} firearm{new Set(strings.map(s => s.gunId)).size !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Issues */}
        <div>
          <span style={labelStyle}>Issues?</span>
          <div style={{ display: 'flex', gap: '8px', marginBottom: hasIssues ? '12px' : 0 }}>
            <Chip label="No Issues" active={!hasIssues} onClick={() => { setHasIssues(false); setIssueTypes([]); }} />
            <Chip label="Issues Detected" active={hasIssues} onClick={() => setHasIssues(true)} color="#ff6b6b" />
          </div>

          {hasIssues && (
            <>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {ISSUE_TYPES.map(t => (
                  <Chip key={t} label={t} active={issueTypes.includes(t)} onClick={() => toggleIssueType(t)} color="#ff6b6b" />
                ))}
              </div>
              <textarea
                placeholder="Describe the issues in detail..."
                value={issueDescription}
                onChange={e => setIssueDescription(e.target.value)}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </>
          )}
        </div>

        {/* Target Photos */}
        <div>
          <span style={labelStyle}>
            Target Photos
            {hasClaudeApiKey() && (
              <span style={{ marginLeft: '6px', color: theme.blue, fontSize: '8px' }}>AI ANALYSIS ENABLED</span>
            )}
          </span>

          {targetPhotos.map(photo => (
            <div
              key={photo.id}
              style={{
                backgroundColor: theme.surface,
                border: `0.5px solid ${theme.border}`,
                borderRadius: '6px',
                padding: '10px',
                marginBottom: '10px',
              }}
            >
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <img
                  src={photo.dataUrl}
                  alt="Target"
                  style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {analyzingPhoto === photo.id ? (
                    <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.blue }}>
                      Analyzing...
                    </div>
                  ) : photo.analysis ? (
                    <TargetAnalysisCard analysis={photo.analysis} />
                  ) : (
                    <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>
                      {hasClaudeApiKey() ? 'Analysis pending save...' : 'Add Claude API key in Settings for AI analysis'}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removePhoto(photo.id)}
                  style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', fontSize: '16px', flexShrink: 0 }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoCapture}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: 'transparent',
              border: `1px dashed ${theme.border}`,
              borderRadius: '6px',
              color: theme.textMuted,
              fontFamily: 'monospace',
              fontSize: '11px',
              letterSpacing: '0.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            CAPTURE TARGET PHOTO
          </button>
        </div>

        {/* Save / Cancel */}
        <div style={{ display: 'flex', gap: '10px', paddingTop: '8px' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '13px',
              backgroundColor: 'transparent',
              border: `0.5px solid ${theme.border}`,
              borderRadius: '6px',
              color: theme.textSecondary,
              fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.8px',
              cursor: 'pointer',
            }}
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            style={{
              flex: 2, padding: '13px',
              backgroundColor: canSave && !saving ? theme.accent : theme.surface,
              border: 'none',
              borderRadius: '6px',
              color: canSave && !saving ? theme.bg : theme.textMuted,
              fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.8px',
              fontWeight: 700, cursor: canSave && !saving ? 'pointer' : 'not-allowed',
            }}
          >
            {saving ? 'SAVING...' : `SAVE SESSION${strings.length > 0 ? ` (${strings.reduce((s, x) => s + x.roundsExpended, 0)} RDS)` : ''}`}
          </button>
        </div>

      </div>
    </div>
  );
}
