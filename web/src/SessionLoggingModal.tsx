import { useState } from 'react';
import { theme } from './theme';
import type { Gun } from './types';
import { logSession, getAmmoByCaliber, updateAmmo } from './storage';

interface SessionLoggingModalProps {
  gun: Gun;
  onClose: () => void;
  onSessionLogged: () => void;
}

export function SessionLoggingModal({ gun, onClose, onSessionLogged }: SessionLoggingModalProps) {
  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(today);
  const [location, setLocation] = useState('');
  const [indoorOutdoor, setIndoorOutdoor] = useState<'Indoor' | 'Outdoor'>('Outdoor');
  const [roundsExpended, setRoundsExpended] = useState('');
  const [selectedAmmoLotId, setSelectedAmmoLotId] = useState<string>('');
  const [issues, setIssues] = useState(false);
  const [issueDescription, setIssueDescription] = useState('');
  const [notes, setNotes] = useState('');

  const compatibleLots = getAmmoByCaliber(gun.caliber);

  function handleSave() {
    if (!roundsExpended || parseInt(roundsExpended) <= 0) {
      alert('Please enter a valid number of rounds fired');
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
          quantity: Math.max(0, lot.quantity - parseInt(roundsExpended))
        });
      }
    }

    onSessionLogged();
    onClose();
  }

  const labelStyle = {
    fontFamily: 'monospace' as const,
    fontSize: '9px',
    letterSpacing: '0.8px',
    color: theme.textMuted,
    textTransform: 'uppercase' as const,
    marginBottom: '4px'
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    backgroundColor: theme.bg,
    border: `0.5px solid ${theme.border}`,
    borderRadius: '4px',
    color: theme.textPrimary,
    fontFamily: 'monospace',
    fontSize: '13px'
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 2000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: theme.surface,
          borderRadius: '12px 12px 0 0',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
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
              LOG RANGE SESSION
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted, marginTop: '2px' }}>
              {gun.make} {gun.model} · {gun.caliber}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: theme.textMuted,
              fontSize: '22px', cursor: 'pointer', lineHeight: 1, padding: '4px',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '20px' }}>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Date */}
          <div>
            <div style={labelStyle}>Date</div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Location */}
          <div>
            <div style={labelStyle}>Location (Optional)</div>
            <input
              type="text"
              placeholder="e.g., SRGC, Indoor Range, Private Property"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Indoor/Outdoor */}
          <div>
            <div style={labelStyle}>Environment</div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setIndoorOutdoor('Outdoor')}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: indoorOutdoor === 'Outdoor' ? theme.accent : 'transparent',
                  color: indoorOutdoor === 'Outdoor' ? theme.bg : theme.textPrimary,
                  border: `0.5px solid ${indoorOutdoor === 'Outdoor' ? theme.accent : theme.border}`,
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  letterSpacing: '0.8px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                OUTDOOR
              </button>
              <button
                onClick={() => setIndoorOutdoor('Indoor')}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: indoorOutdoor === 'Indoor' ? theme.accent : 'transparent',
                  color: indoorOutdoor === 'Indoor' ? theme.bg : theme.textPrimary,
                  border: `0.5px solid ${indoorOutdoor === 'Indoor' ? theme.accent : theme.border}`,
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  letterSpacing: '0.8px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                INDOOR
              </button>
            </div>
          </div>

          {/* Rounds Fired */}
          <div>
            <div style={labelStyle}>Rounds Fired</div>
            <input
              type="number"
              placeholder="e.g., 100"
              value={roundsExpended}
              onChange={(e) => setRoundsExpended(e.target.value)}
              style={inputStyle}
              min="1"
            />
          </div>

          {/* Ammo Lot Picker */}
          <div>
            <div style={labelStyle}>Ammo Used (Optional)</div>
            {compatibleLots.length === 0 ? (
              <div style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                color: theme.textMuted
              }}>
                No {gun.caliber} lots in inventory
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {/* None / Not Tracked option */}
                <button
                  onClick={() => setSelectedAmmoLotId('')}
                  style={{
                    padding: '10px',
                    backgroundColor: 'transparent',
                    border: `0.5px solid ${selectedAmmoLotId === '' ? theme.accent : theme.border}`,
                    borderRadius: '4px',
                    color: selectedAmmoLotId === '' ? theme.accent : theme.textSecondary,
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    letterSpacing: '0.8px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  NONE / NOT TRACKED
                </button>
                {compatibleLots.map(lot => (
                  <button
                    key={lot.id}
                    onClick={() => setSelectedAmmoLotId(lot.id)}
                    style={{
                      padding: '10px',
                      backgroundColor: 'transparent',
                      border: `0.5px solid ${selectedAmmoLotId === lot.id ? theme.accent : theme.border}`,
                      borderRadius: '4px',
                      color: selectedAmmoLotId === lot.id ? theme.accent : theme.textPrimary,
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      letterSpacing: '0.5px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    {lot.brand} {lot.productLine} · {lot.grainWeight}gr · {lot.quantity.toLocaleString()} rds remaining
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Issues */}
          <div>
            <div style={labelStyle}>Any Issues?</div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setIssues(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: !issues ? theme.accent : 'transparent',
                  color: !issues ? theme.bg : theme.textPrimary,
                  border: `0.5px solid ${!issues ? theme.accent : theme.border}`,
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  letterSpacing: '0.8px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                NO ISSUES
              </button>
              <button
                onClick={() => setIssues(true)}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: issues ? theme.caliberRed : 'transparent',
                  color: issues ? theme.bg : theme.textPrimary,
                  border: `0.5px solid ${issues ? theme.caliberRed : theme.border}`,
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  letterSpacing: '0.8px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                ISSUES DETECTED
              </button>
            </div>
          </div>

          {/* Issue Description (if issues) */}
          {issues && (
            <div>
              <div style={labelStyle}>Issue Description</div>
              <textarea
                placeholder="Describe the issues encountered (FTE, FTF, accuracy problems, etc.)"
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                rows={3}
                style={{
                  ...inputStyle,
                  resize: 'vertical'
                }}
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <div style={labelStyle}>Session Notes (Optional)</div>
            <textarea
              placeholder="e.g., re-zeroed, testing new ammo, practicing drills"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              style={{
                ...inputStyle,
                resize: 'vertical'
              }}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: 'transparent',
              color: theme.textPrimary,
              border: `0.5px solid ${theme.border}`,
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '11px',
              letterSpacing: '0.8px',
              cursor: 'pointer'
            }}
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: theme.accent,
              color: theme.bg,
              border: 'none',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '11px',
              letterSpacing: '0.8px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            LOG SESSION
          </button>
        </div>
        </div>{/* end padding wrapper */}
      </div>
    </div>
  );
}
