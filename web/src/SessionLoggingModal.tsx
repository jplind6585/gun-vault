import { useState } from 'react';
import { theme } from './theme';
import type { Gun } from './types';
import { logSession, getAmmoByCaliber, updateAmmo } from './storage';

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
}

export function SessionLoggingModal({ gun, onClose, onSessionLogged, onViewSessions }: SessionLoggingModalProps) {
  const today = new Date().toISOString().split('T')[0];

  // Shared across combos
  const [date, setDate]                     = useState(today);
  const [location, setLocation]             = useState('');
  const [indoorOutdoor, setIndoorOutdoor]   = useState<'Indoor' | 'Outdoor'>('Outdoor');

  // Per-combo form fields
  const [roundsExpended, setRoundsExpended] = useState('');
  const [selectedAmmoLotId, setSelectedAmmoLotId] = useState<string>('');
  const [issues, setIssues]                 = useState(false);
  const [issueDescription, setIssueDescription] = useState('');
  const [notes, setNotes]                   = useState('');

  // Flow state
  const [step, setStep]                     = useState<'form' | 'confirm'>('form');
  const [loggedCombos, setLoggedCombos]     = useState<LoggedCombo[]>([]);

  const compatibleLots = getAmmoByCaliber(gun.caliber);

  function handleLogCombo() {
    if (!roundsExpended || parseInt(roundsExpended) <= 0) {
      alert('Enter the number of rounds fired.');
      return;
    }

    logSession({
      gunId: gun.id,
      date,
      roundsExpended: parseInt(roundsExpended),
      location: location || undefined,
      indoorOutdoor,
      issues,
      issueDescription: issues ? issueDescription : undefined,
      notes: notes || undefined,
      ammoLotId: selectedAmmoLotId || undefined,
    });

    if (selectedAmmoLotId && parseInt(roundsExpended) > 0) {
      const lot = compatibleLots.find(l => l.id === selectedAmmoLotId);
      if (lot) {
        updateAmmo(selectedAmmoLotId, {
          quantity: Math.max(0, lot.quantity - parseInt(roundsExpended)),
        });
      }
    }

    const selectedLot = compatibleLots.find(l => l.id === selectedAmmoLotId);
    const ammoLabel = selectedLot
      ? `${selectedLot.brand}${selectedLot.productLine ? ' ' + selectedLot.productLine : ''} ${selectedLot.grainWeight}gr`
      : null;

    setLoggedCombos(prev => [...prev, {
      gunName: gun.displayName || `${gun.make} ${gun.model}`,
      caliber: gun.caliber,
      rounds: parseInt(roundsExpended),
      ammoLabel,
      location: location || null,
      issues,
    }]);

    onSessionLogged();
    setStep('confirm');
  }

  function handleAddAnother() {
    // Reset per-combo fields, keep shared fields (date, location, env)
    setRoundsExpended('');
    setSelectedAmmoLotId('');
    setIssues(false);
    setIssueDescription('');
    setNotes('');
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
              {step === 'form' ? 'SESSION DEBRIEF' : 'SESSION LOGGED'}
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
              {/* Instructions */}
              <div style={{
                backgroundColor: theme.bg,
                border: `0.5px solid ${theme.border}`,
                borderRadius: '6px',
                padding: '12px 14px',
                marginBottom: '20px',
              }}>
                <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '1px', color: theme.accent, marginBottom: '6px' }}>
                  HOW THIS WORKS
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textSecondary, lineHeight: 1.6 }}>
                  Log one gun and ammo combination at a time. Tell us which gun, what ammo, how many rounds, where you shot, and whether you had any issues.
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginTop: '6px' }}>
                  Shot multiple guns or switched ammo? You can add more entries after this one.
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Date */}
                <div>
                  <div style={labelStyle}>Date</div>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
                </div>

                {/* Location */}
                <div>
                  <div style={labelStyle}>Where did you shoot? (optional)</div>
                  <input
                    type="text"
                    placeholder="e.g., SRGC, Indoor Range, Private Property"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                {/* Indoor/Outdoor */}
                <div>
                  <div style={labelStyle}>Environment</div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => setIndoorOutdoor('Outdoor')} style={toggleBtn(indoorOutdoor === 'Outdoor')}>OUTDOOR</button>
                    <button onClick={() => setIndoorOutdoor('Indoor')} style={toggleBtn(indoorOutdoor === 'Indoor')}>INDOOR</button>
                  </div>
                </div>

                {/* Rounds */}
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

                {/* Ammo */}
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

                {/* Issues */}
                <div>
                  <div style={labelStyle}>Any malfunctions or issues?</div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => setIssues(false)} style={toggleBtn(!issues)}>NO ISSUES</button>
                    <button onClick={() => setIssues(true)} style={toggleBtn(issues, true)}>ISSUES</button>
                  </div>
                </div>

                {issues && (
                  <div>
                    <div style={labelStyle}>Describe the issue</div>
                    <textarea
                      placeholder="e.g., 2× failure to eject, rounds 40-41 — FTE, stovepipe"
                      value={issueDescription}
                      onChange={e => setIssueDescription(e.target.value)}
                      rows={3}
                      style={{ ...inputStyle, resize: 'vertical' }}
                    />
                  </div>
                )}

                {/* Notes */}
                <div>
                  <div style={labelStyle}>Anything else worth noting? (optional)</div>
                  <textarea
                    placeholder="e.g., re-zeroed at 100yd, first time with suppressor, working on trigger reset"
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
                  LOG THIS COMBO
                </button>
              </div>
            </>
          )}

          {/* ── CONFIRMATION STEP ── */}
          {step === 'confirm' && (
            <>
              {/* Summary of all logged combos */}
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
                      borderLeft: `3px solid ${combo.issues ? theme.red : theme.green}`,
                      borderRadius: '6px',
                      padding: '12px 14px',
                      marginBottom: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: theme.textPrimary }}>
                          {combo.gunName}
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
                        <div style={{ fontFamily: 'monospace', fontSize: '8px', color: theme.textMuted, marginTop: '2px' }}>RDS</div>
                        {combo.issues && (
                          <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.red, marginTop: '4px' }}>ISSUE</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Totals */}
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
                    {loggedCombos.reduce((s, c) => s + c.rounds, 0).toLocaleString()} rds total
                  </span>
                </div>
              </div>

              {/* Prompt */}
              <div style={{
                fontFamily: 'monospace', fontSize: '12px', color: theme.textSecondary,
                textAlign: 'center', marginBottom: '20px', lineHeight: 1.6,
              }}>
                Did you shoot anything else during this session?
              </div>

              {/* Actions */}
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
