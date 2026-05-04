import { useState } from 'react';
import { theme } from '../../theme';
import type { Gun, IssueType, MalfunctionEntry } from '../../types';
import { logSession, getAmmoByCaliber, updateAmmo } from '../../storage';

interface SessionLoggingModalProps {
  gun: Gun;
  onClose: () => void;
  onSessionLogged: () => void;
  onViewSessions?: () => void;
}

interface LoggedCombo {
  gunName: string;
  caliber: string;
  rounds: number;
  ammoLabel: string | null;
  location: string | null;
  issues: boolean;
  isDryFire: boolean;
}

const ISSUE_TYPES: IssueType[] = [
  'FTF', 'FTE', 'Double Feed', 'Stovepipe', 'Trigger Reset', 'Accuracy', 'Sighting', 'Other',
];

export function SessionLoggingModal({ gun, onClose, onSessionLogged, onViewSessions }: SessionLoggingModalProps) {
  const today = new Date().toISOString().split('T')[0];

  // Shared across combos
  const [date, setDate]                       = useState(today);
  const [location, setLocation]               = useState('');
  const [indoorOutdoor, setIndoorOutdoor]     = useState<'Indoor' | 'Outdoor'>('Outdoor');
  const [isDryFire, setIsDryFire]             = useState(false);

  // Per-combo form fields
  const [roundsExpended, setRoundsExpended]   = useState('');
  const [shotCount, setShotCount]             = useState('');
  const [selectedAmmoLotId, setSelectedAmmoLotId] = useState<string>('');
  const [malfunctions, setMalfunctions]       = useState<MalfunctionEntry[]>([]);
  const [notes, setNotes]                     = useState('');

  // Malfunction builder state
  const [addingMalfunction, setAddingMalfunction] = useState(false);
  const [mfType, setMfType]                   = useState<IssueType>('FTF');
  const [mfRound, setMfRound]                 = useState('');
  const [mfNotes, setMfNotes]                 = useState('');

  // Flow state
  const [step, setStep]                       = useState<'form' | 'confirm'>('form');
  const [loggedCombos, setLoggedCombos]       = useState<LoggedCombo[]>([]);

  const compatibleLots = getAmmoByCaliber(gun.caliber);

  function addMalfunction() {
    const entry: MalfunctionEntry = {
      type: mfType,
      roundNumber: mfRound ? parseInt(mfRound) : undefined,
      notes: mfNotes || undefined,
    };
    setMalfunctions(prev => [...prev, entry]);
    setMfRound('');
    setMfNotes('');
    setAddingMalfunction(false);
  }

  function removeMalfunction(idx: number) {
    setMalfunctions(prev => prev.filter((_, i) => i !== idx));
  }

  function handleLogCombo() {
    const rds = isDryFire ? 0 : parseInt(roundsExpended);
    const shots = isDryFire ? parseInt(shotCount) : undefined;

    if (!isDryFire && (!roundsExpended || rds <= 0)) {
      alert('Enter the number of rounds fired.');
      return;
    }
    if (isDryFire && (!shotCount || parseInt(shotCount) <= 0)) {
      alert('Enter the number of shots performed.');
      return;
    }

    logSession({
      gunId: gun.id,
      date,
      roundsExpended: rds,
      shotCount: shots,
      isDryFire,
      location: location || undefined,
      indoorOutdoor,
      issues: malfunctions.length > 0,
      issueTypes: malfunctions.length > 0 ? [...new Set(malfunctions.map(m => m.type))] : undefined,
      malfunctions: malfunctions.length > 0 ? malfunctions : undefined,
      notes: notes || undefined,
      ammoLotId: !isDryFire && selectedAmmoLotId ? selectedAmmoLotId : undefined,
    });

    // Decrement ammo only for live fire
    if (!isDryFire && selectedAmmoLotId && rds > 0) {
      const lot = compatibleLots.find(l => l.id === selectedAmmoLotId);
      if (lot) {
        updateAmmo(selectedAmmoLotId, {
          quantity: Math.max(0, lot.quantity - rds),
        });
      }
    }

    const selectedLot = compatibleLots.find(l => l.id === selectedAmmoLotId);
    const ammoLabel = selectedLot && !isDryFire
      ? `${selectedLot.brand}${selectedLot.productLine ? ' ' + selectedLot.productLine : ''} ${selectedLot.grainWeight}gr`
      : null;

    setLoggedCombos(prev => [...prev, {
      gunName: gun.displayName || `${gun.make} ${gun.model}`,
      caliber: gun.caliber,
      rounds: isDryFire ? (shots ?? 0) : rds,
      ammoLabel,
      location: location || null,
      issues: malfunctions.length > 0,
      isDryFire,
    }]);

    onSessionLogged();
    setStep('confirm');
  }

  function handleAddAnother() {
    setRoundsExpended('');
    setShotCount('');
    setSelectedAmmoLotId('');
    setMalfunctions([]);
    setNotes('');
    setIsDryFire(false);
    setStep('form');
  }

  function handleDone() {
    if (onViewSessions) {
      onViewSessions();
    }
    onClose();
  }

  const labelStyle = {
    fontFamily: 'monospace' as const,
    fontSize: '9px',
    letterSpacing: '0.8px',
    color: theme.textMuted,
    textTransform: 'uppercase' as const,
    marginBottom: '4px',
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    backgroundColor: theme.bg,
    border: `0.5px solid ${theme.border}`,
    borderRadius: '4px',
    color: theme.textPrimary,
    fontFamily: 'monospace',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  const toggleBtn = (active: boolean, danger = false): React.CSSProperties => ({
    flex: 1,
    padding: '12px',
    backgroundColor: active ? (danger ? theme.red : theme.accent) : 'transparent',
    color: active ? theme.bg : theme.textPrimary,
    border: `0.5px solid ${active ? (danger ? theme.red : theme.accent) : theme.border}`,
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '11px',
    letterSpacing: '0.8px',
    cursor: 'pointer',
    fontWeight: 600,
  });

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        zIndex: 2000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: theme.surface,
          borderRadius: '12px 12px 0 0',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div style={{
          position: 'sticky', top: 0, backgroundColor: theme.surface,
          borderBottom: `0.5px solid ${theme.border}`,
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          zIndex: 1,
        }}>
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, letterSpacing: '1px', color: theme.textPrimary }}>
              {step === 'form' ? (isDryFire ? 'DRY FIRE SESSION' : 'SESSION DEBRIEF') : 'SESSION LOGGED'}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted, marginTop: '2px' }}>
              {gun.make} {gun.model} · {gun.caliber}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: theme.textMuted, fontSize: '22px', cursor: 'pointer', lineHeight: 1, padding: '4px' }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '20px' }}>

          {/* ── FORM STEP ── */}
          {step === 'form' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Session Type — Live Fire vs Dry Fire */}
                <div>
                  <div style={labelStyle}>Session type</div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => setIsDryFire(false)} style={toggleBtn(!isDryFire)}>LIVE FIRE</button>
                    <button onClick={() => setIsDryFire(true)} style={toggleBtn(isDryFire)}>DRY FIRE</button>
                  </div>
                  {isDryFire && (
                    <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginTop: '6px' }}>
                      No ammo deducted. Round count not incremented. Shots logged separately.
                    </div>
                  )}
                </div>

                {/* Date */}
                <div>
                  <div style={labelStyle}>Date</div>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
                </div>

                {/* Location */}
                <div>
                  <div style={labelStyle}>Where? (optional)</div>
                  <input
                    type="text"
                    placeholder={isDryFire ? 'e.g., Home, Garage, Office' : 'e.g., SRGC, Indoor Range, Private Property'}
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                {/* Indoor/Outdoor — only for live fire */}
                {!isDryFire && (
                  <div>
                    <div style={labelStyle}>Environment</div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={() => setIndoorOutdoor('Outdoor')} style={toggleBtn(indoorOutdoor === 'Outdoor')}>OUTDOOR</button>
                      <button onClick={() => setIndoorOutdoor('Indoor')} style={toggleBtn(indoorOutdoor === 'Indoor')}>INDOOR</button>
                    </div>
                  </div>
                )}

                {/* Round count / Shot count */}
                {isDryFire ? (
                  <div>
                    <div style={labelStyle}>How many shots/reps?</div>
                    <input
                      type="number"
                      placeholder="e.g., 200"
                      value={shotCount}
                      onChange={e => setShotCount(e.target.value)}
                      style={inputStyle}
                      min="1"
                    />
                  </div>
                ) : (
                  <div>
                    <div style={labelStyle}>How many rounds did you fire?</div>
                    <input
                      type="number"
                      placeholder="e.g., 100"
                      value={roundsExpended}
                      onChange={e => setRoundsExpended(e.target.value)}
                      style={inputStyle}
                      min="1"
                    />
                  </div>
                )}

                {/* Ammo — live fire only */}
                {!isDryFire && (
                  <div>
                    <div style={labelStyle}>What ammo did you use? (optional)</div>
                    {compatibleLots.length === 0 ? (
                      <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted }}>
                        No {gun.caliber} lots in inventory — add ammo in Arsenal to track usage.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                        <button
                          onClick={() => setSelectedAmmoLotId('')}
                          style={{
                            padding: '10px', backgroundColor: 'transparent',
                            border: `0.5px solid ${selectedAmmoLotId === '' ? theme.accent : theme.border}`,
                            borderRadius: '4px',
                            color: selectedAmmoLotId === '' ? theme.accent : theme.textSecondary,
                            fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.8px',
                            cursor: 'pointer', textAlign: 'left',
                          }}
                        >
                          NOT TRACKING AMMO
                        </button>
                        {compatibleLots.map(lot => (
                          <button
                            key={lot.id}
                            onClick={() => setSelectedAmmoLotId(lot.id)}
                            style={{
                              padding: '10px', backgroundColor: 'transparent',
                              border: `0.5px solid ${selectedAmmoLotId === lot.id ? theme.accent : theme.border}`,
                              borderRadius: '4px',
                              color: selectedAmmoLotId === lot.id ? theme.accent : theme.textPrimary,
                              fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.5px',
                              cursor: 'pointer', textAlign: 'left',
                            }}
                          >
                            {lot.brand}{lot.productLine ? ' ' + lot.productLine : ''} · {lot.grainWeight}gr · {lot.quantity.toLocaleString()} rds left
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Malfunction Log */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={labelStyle}>Malfunction log</div>
                    {!addingMalfunction && (
                      <button
                        onClick={() => setAddingMalfunction(true)}
                        style={{
                          padding: '3px 10px',
                          backgroundColor: 'transparent',
                          border: `0.5px solid ${theme.border}`,
                          borderRadius: '3px',
                          color: theme.textSecondary,
                          fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.5px',
                          cursor: 'pointer',
                        }}
                      >
                        + ADD
                      </button>
                    )}
                  </div>

                  {/* Existing malfunctions */}
                  {malfunctions.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                      {malfunctions.map((m, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '8px 10px',
                          backgroundColor: theme.bg,
                          borderLeft: `2px solid ${theme.red}`,
                          borderRadius: '0 4px 4px 0',
                        }}>
                          <div>
                            <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: theme.red }}>{m.type}</span>
                            {m.roundNumber && (
                              <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginLeft: '8px' }}>rd #{m.roundNumber}</span>
                            )}
                            {m.notes && (
                              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textSecondary, marginTop: '2px' }}>{m.notes}</div>
                            )}
                          </div>
                          <button
                            onClick={() => removeMalfunction(i)}
                            style={{ background: 'none', border: 'none', color: theme.textMuted, fontSize: '16px', cursor: 'pointer', padding: '2px 6px' }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {malfunctions.length === 0 && !addingMalfunction && (
                    <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted }}>
                      No malfunctions — tap + Add to log one
                    </div>
                  )}

                  {/* Add malfunction form */}
                  {addingMalfunction && (
                    <div style={{
                      backgroundColor: theme.bg,
                      border: `0.5px solid ${theme.border}`,
                      borderRadius: '6px',
                      padding: '12px',
                      display: 'flex', flexDirection: 'column', gap: '10px',
                    }}>
                      <div>
                        <div style={labelStyle}>Type</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {ISSUE_TYPES.map(t => (
                            <button
                              key={t}
                              onClick={() => setMfType(t)}
                              style={{
                                padding: '5px 10px',
                                backgroundColor: mfType === t ? theme.red : 'transparent',
                                border: `0.5px solid ${mfType === t ? theme.red : theme.border}`,
                                borderRadius: '3px',
                                color: mfType === t ? theme.bg : theme.textSecondary,
                                fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.5px',
                                cursor: 'pointer', fontWeight: mfType === t ? 700 : 400,
                              }}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div style={labelStyle}>Round # (optional)</div>
                        <input
                          type="number"
                          placeholder="e.g., 47"
                          value={mfRound}
                          onChange={e => setMfRound(e.target.value)}
                          style={{ ...inputStyle, width: '120px' }}
                          min="1"
                        />
                      </div>
                      <div>
                        <div style={labelStyle}>Notes (optional)</div>
                        <input
                          type="text"
                          placeholder="e.g., stovepipe, brass rim torn"
                          value={mfNotes}
                          onChange={e => setMfNotes(e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => { setAddingMalfunction(false); setMfRound(''); setMfNotes(''); }}
                          style={{ flex: 1, padding: '8px', backgroundColor: 'transparent', border: `0.5px solid ${theme.border}`, borderRadius: '4px', color: theme.textMuted, fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer' }}
                        >
                          CANCEL
                        </button>
                        <button
                          onClick={addMalfunction}
                          style={{ flex: 2, padding: '8px', backgroundColor: theme.red, border: 'none', borderRadius: '4px', color: theme.bg, fontFamily: 'monospace', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          LOG {mfType}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <div style={labelStyle}>Notes (optional)</div>
                  <textarea
                    placeholder={isDryFire
                      ? 'e.g., draw practice, trigger reset drills, 100 reps on reload'
                      : 'e.g., re-zeroed at 100yd, first time with suppressor'}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  onClick={onClose}
                  style={{
                    flex: 1, padding: '12px', backgroundColor: 'transparent',
                    color: theme.textSecondary, border: `0.5px solid ${theme.border}`,
                    borderRadius: '4px', fontFamily: 'monospace', fontSize: '11px',
                    letterSpacing: '0.8px', cursor: 'pointer',
                  }}
                >
                  CANCEL
                </button>
                <button
                  onClick={handleLogCombo}
                  style={{
                    flex: 2, padding: '12px', backgroundColor: theme.accent,
                    color: theme.bg, border: 'none', borderRadius: '4px',
                    fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.8px',
                    cursor: 'pointer', fontWeight: 700,
                  }}
                >
                  {isDryFire ? 'LOG DRY FIRE' : 'LOG THIS COMBO'}
                </button>
              </div>
            </>
          )}

          {/* ── CONFIRMATION STEP ── */}
          {step === 'confirm' && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '1px', color: theme.textMuted, marginBottom: '10px' }}>
                  SESSION SUMMARY
                </div>
                {loggedCombos.map((combo, i) => (
                  <div
                    key={i}
                    style={{
                      backgroundColor: theme.bg,
                      border: `0.5px solid ${theme.border}`,
                      borderLeft: `3px solid ${combo.issues ? theme.red : combo.isDryFire ? theme.textMuted : theme.green}`,
                      borderRadius: '6px',
                      padding: '12px 14px',
                      marginBottom: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: theme.textPrimary }}>
                          {combo.gunName}
                          {combo.isDryFire && (
                            <span style={{ marginLeft: '8px', fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, fontWeight: 400 }}>DRY FIRE</span>
                          )}
                        </div>
                        <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginTop: '2px' }}>
                          {combo.caliber}{combo.ammoLabel ? ' · ' + combo.ammoLabel : ''}
                        </div>
                        {combo.location && (
                          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>
                            {combo.location}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                        <div style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 700, color: theme.accent, lineHeight: 1 }}>
                          {combo.rounds.toLocaleString()}
                        </div>
                        <div style={{ fontFamily: 'monospace', fontSize: '8px', color: theme.textMuted, marginTop: '2px' }}>
                          {combo.isDryFire ? 'SHOTS' : 'RDS'}
                        </div>
                        {combo.issues && (
                          <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.red, marginTop: '4px' }}>MALFUNCTION</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '10px 14px',
                  fontFamily: 'monospace', fontSize: '11px',
                  color: theme.textSecondary,
                  borderTop: `0.5px solid ${theme.border}`,
                  marginTop: '4px',
                }}>
                  <span>{loggedCombos.length} {loggedCombos.length === 1 ? 'entry' : 'entries'}</span>
                  <span style={{ color: theme.accent, fontWeight: 700 }}>
                    {loggedCombos.filter(c => !c.isDryFire).reduce((s, c) => s + c.rounds, 0).toLocaleString()} rds fired
                  </span>
                </div>
              </div>

              <div style={{
                fontFamily: 'monospace', fontSize: '12px', color: theme.textSecondary,
                textAlign: 'center', marginBottom: '20px', lineHeight: 1.6,
              }}>
                Did you shoot anything else during this session?
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={handleAddAnother}
                  style={{
                    width: '100%', padding: '13px', backgroundColor: 'transparent',
                    border: `0.5px solid ${theme.accent}`, borderRadius: '6px',
                    color: theme.accent, fontFamily: 'monospace', fontSize: '11px',
                    letterSpacing: '0.8px', fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  + LOG ANOTHER GUN / AMMO COMBO
                </button>
                <button
                  onClick={handleDone}
                  style={{
                    width: '100%', padding: '13px', backgroundColor: theme.accent,
                    border: 'none', borderRadius: '6px',
                    color: theme.bg, fontFamily: 'monospace', fontSize: '11px',
                    letterSpacing: '0.8px', fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  DONE — VIEW MY SESSIONS
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
