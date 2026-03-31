// Full-page session logging — replaces the old modal
import { useState, useRef } from 'react';
import { theme } from './theme';
import type { Gun, SessionPurpose, IssueType, TargetPhoto } from './types';
import {
  logSession, updateSession, getAllGuns,
  getAmmoByCaliber, updateAmmo, getRecentLocations,
} from './storage';
import { generateSessionNarrative, hasClaudeApiKey, analyzeTargetPhoto } from './claudeApi';

interface SessionLogViewProps {
  preselectedGun?: Gun | null;
  onSaved: () => void;
  onCancel: () => void;
}

const PURPOSES: SessionPurpose[] = ['Warmup', 'Drills', 'Zeroing', 'Qualification', 'Competition', 'Fun', 'Carry Eval'];
const ISSUE_TYPES: IssueType[] = ['FTF', 'FTE', 'Double Feed', 'Stovepipe', 'Trigger Reset', 'Accuracy', 'Sighting', 'Other'];
const DISTANCES = [7, 15, 25, 50, 100, 200, 300];

export function SessionLogView({ preselectedGun, onSaved, onCancel }: SessionLogViewProps) {
  const today = new Date().toISOString().split('T')[0];
  const allGuns = getAllGuns().filter(g => g.status === 'Active' || g.status === 'Stored');
  const recentLocations = getRecentLocations();

  const [step, setStep] = useState<'gun' | 'form'>(preselectedGun ? 'form' : 'gun');
  const [selectedGun, setSelectedGun] = useState<Gun | null>(preselectedGun || null);
  const [gunSearch, setGunSearch] = useState('');

  // Form state
  const [date, setDate] = useState(today);
  const [location, setLocation] = useState('');
  const [indoorOutdoor, setIndoorOutdoor] = useState<'Indoor' | 'Outdoor'>('Outdoor');
  const [purposes, setPurposes] = useState<SessionPurpose[]>([]);
  const [distanceYards, setDistanceYards] = useState<number | ''>('');
  const [roundsExpended, setRoundsExpended] = useState('');
  const [selectedAmmoLotId, setSelectedAmmoLotId] = useState('');
  const [hasIssues, setHasIssues] = useState(false);
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);
  const [issueDescription, setIssueDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [targetPhotos, setTargetPhotos] = useState<TargetPhoto[]>([]);
  const [saving, setSaving] = useState(false);
  const [analyzingPhoto, setAnalyzingPhoto] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const compatibleLots = selectedGun ? getAmmoByCaliber(selectedGun.caliber) : [];
  const selectedLot = compatibleLots.find(l => l.id === selectedAmmoLotId) || null;
  const sessionCost = selectedLot?.purchasePricePerRound && roundsExpended
    ? parseFloat(roundsExpended) * selectedLot.purchasePricePerRound
    : undefined;

  const filteredGuns = allGuns.filter(g => {
    const q = gunSearch.toLowerCase();
    return !q || `${g.make} ${g.model} ${g.caliber}`.toLowerCase().includes(q);
  });

  function togglePurpose(p: SessionPurpose) {
    setPurposes(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }

  function toggleIssueType(t: IssueType) {
    setIssueTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  async function handlePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      const photo: TargetPhoto = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        dataUrl,
        distanceYards: distanceYards || undefined,
        capturedAt: new Date().toISOString(),
      };
      setTargetPhotos(prev => [...prev, photo]);

      // Auto-analyze if API key available
      if (hasClaudeApiKey() && selectedGun) {
        setAnalyzingPhoto(photo.id);
        try {
          const analysis = await analyzeTargetPhoto(dataUrl, {
            gun: selectedGun,
            distanceYards: distanceYards || undefined,
            roundsExpended: roundsExpended ? parseInt(roundsExpended) : undefined,
            ammoLot: selectedLot,
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
    // Reset so same file can be re-selected
    e.target.value = '';
  }

  function removePhoto(id: string) {
    setTargetPhotos(prev => prev.filter(p => p.id !== id));
  }

  async function handleSave() {
    if (!selectedGun) return;
    const rounds = parseInt(roundsExpended);
    if (!rounds || rounds <= 0) return;

    setSaving(true);
    try {
      const sessionId = logSession({
        gunId: selectedGun.id,
        date,
        roundsExpended: rounds,
        location: location || undefined,
        indoorOutdoor,
        purpose: purposes.length ? purposes : undefined,
        distanceYards: distanceYards || undefined,
        issues: hasIssues,
        issueTypes: hasIssues && issueTypes.length ? issueTypes : undefined,
        issueDescription: hasIssues && issueDescription ? issueDescription : undefined,
        notes: notes || undefined,
        ammoLotId: selectedAmmoLotId || undefined,
        sessionCost,
        isCarryGun: selectedGun.purpose?.includes('EDC') || selectedGun.purpose?.includes('Self Defense'),
        targetPhotos: targetPhotos.length ? targetPhotos : undefined,
      });

      // Decrement ammo
      if (selectedAmmoLotId && rounds > 0) {
        const lot = compatibleLots.find(l => l.id === selectedAmmoLotId);
        if (lot) {
          updateAmmo(selectedAmmoLotId, { quantity: Math.max(0, lot.quantity - rounds) });
        }
      }

      // Generate AI narrative in background
      if (hasClaudeApiKey()) {
        generateSessionNarrative(
          { id: sessionId, gunId: selectedGun.id, date, roundsExpended: rounds,
            location: location || undefined, indoorOutdoor, purpose: purposes.length ? purposes : undefined,
            distanceYards: distanceYards || undefined, issues: hasIssues,
            issueTypes: hasIssues && issueTypes.length ? issueTypes : undefined,
            notes: notes || undefined, ammoLotId: selectedAmmoLotId || undefined },
          selectedGun,
          selectedLot
        ).then(narrative => {
          if (narrative) updateSession(sessionId, { aiNarrative: narrative });
        }).catch(() => {});
      }

      onSaved();
    } finally {
      setSaving(false);
    }
  }

  // ── Styles ──────────────────────────────────────────────────────────────────

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

  function Chip({ label, active, onClick, color }: { label: string; active: boolean; onClick: () => void; color?: string }) {
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

  // ── Gun picker step ──────────────────────────────────────────────────────────

  if (step === 'gun') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: theme.bg, padding: '16px', paddingBottom: '80px', maxWidth: '480px', margin: '0 auto' }}>
        <div style={{ marginBottom: '16px' }}>
          <span style={labelStyle}>Select Firearm</span>
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
              onClick={() => { setSelectedGun(gun); setStep('form'); }}
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
    );
  }

  // ── Form step ────────────────────────────────────────────────────────────────

  if (!selectedGun) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, padding: '16px', paddingBottom: '80px', maxWidth: '480px', margin: '0 auto' }}>

      {/* Selected gun banner */}
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
            onClick={() => setStep('gun')}
            style={{ background: 'none', border: 'none', color: theme.accent, fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer' }}
          >
            CHANGE
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

        {/* Date */}
        <div>
          <span style={labelStyle}>Date</span>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
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
            {(['Outdoor', 'Indoor'] as const).map(env => (
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

        {/* Distance */}
        <div>
          <span style={labelStyle}>Distance</span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {DISTANCES.map(d => (
              <Chip key={d} label={`${d}yd`} active={distanceYards === d} onClick={() => setDistanceYards(distanceYards === d ? '' : d)} />
            ))}
          </div>
          <input
            type="number"
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
            placeholder="e.g., 100"
            value={roundsExpended}
            onChange={e => setRoundsExpended(e.target.value)}
            style={{ ...inputStyle, borderColor: !roundsExpended ? theme.border : theme.accent }}
            min="1"
          />
        </div>

        {/* Ammo Lot */}
        <div>
          <span style={labelStyle}>Ammo Used</span>
          {compatibleLots.length === 0 ? (
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted }}>
              No {selectedGun.caliber} lots in inventory
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                onClick={() => setSelectedAmmoLotId('')}
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'transparent',
                  border: `0.5px solid ${!selectedAmmoLotId ? theme.accent : theme.border}`,
                  borderRadius: '6px',
                  color: !selectedAmmoLotId ? theme.accent : theme.textMuted,
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
                  onClick={() => setSelectedAmmoLotId(lot.id)}
                  style={{
                    padding: '10px 12px',
                    backgroundColor: selectedAmmoLotId === lot.id ? 'rgba(255,212,59,0.08)' : 'transparent',
                    border: `0.5px solid ${selectedAmmoLotId === lot.id ? theme.accent : theme.border}`,
                    borderRadius: '6px',
                    color: selectedAmmoLotId === lot.id ? theme.accent : theme.textPrimary,
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
          {sessionCost !== undefined && (
            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginTop: '6px' }}>
              Estimated cost: <span style={{ color: theme.textSecondary }}>${sessionCost.toFixed(2)}</span>
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

        {/* Notes */}
        <div>
          <span style={labelStyle}>Session Notes</span>
          <textarea
            placeholder="e.g., re-zeroed at 100yd, testing new ammo, worked on draw speed"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
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

        {/* Save */}
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
            disabled={!roundsExpended || parseInt(roundsExpended) <= 0 || saving}
            style={{
              flex: 2, padding: '13px',
              backgroundColor: !roundsExpended || saving ? theme.surface : theme.accent,
              border: 'none',
              borderRadius: '6px',
              color: !roundsExpended || saving ? theme.textMuted : theme.bg,
              fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.8px',
              fontWeight: 700, cursor: 'pointer',
            }}
          >
            {saving ? 'SAVING...' : 'LOG SESSION'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Target analysis card ─────────────────────────────────────────────────────

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
