import { useState, useEffect } from 'react';
import { theme } from './theme';
import type { Gun, Session } from './types';
import { updateGun, getSessionsForGun } from './storage';
import { SessionLoggingModal } from './SessionLoggingModal';
import { getGunImageUrl } from './gunImages';

interface GunDetailModalProps {
  gun: Gun;
  onClose: () => void;
}

// Parse accessories from notes
function parseAccessories(notes?: string): { optic?: string; attachments?: string[] } {
  if (!notes) return {};

  const opticMatch = notes.match(/Optic:\s*([^.]+)/i);
  const modelMatch = notes.match(/Model:\s*([^.]+)/i);
  const attachMatch = notes.match(/Attachments?:\s*([^.]+)/i);

  const optic = opticMatch ? opticMatch[1].trim() + (modelMatch ? ` - ${modelMatch[1].trim()}` : '') : undefined;
  const attachments = attachMatch ? attachMatch[1].split(',').map(a => a.trim()) : undefined;

  return { optic, attachments };
}

export function GunDetailModal({ gun, onClose }: GunDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedGun, setEditedGun] = useState(gun);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const { optic, attachments } = parseAccessories(gun.notes);

  useEffect(() => {
    setSessions(getSessionsForGun(gun.id));
  }, [gun.id]);

  // Calculate maintenance metrics
  const lastShotDate = sessions.length > 0 ? sessions[0].date : null;
  const lastZeroSession = sessions.find(s => s.notes?.toLowerCase().includes('zero'));
  const lastZeroDate = lastZeroSession?.date || null;
  const issuesInLast3 = sessions.slice(0, 3).some(s => s.issues);

  // Generate system notes
  function generateSystemNotes(): string[] {
    const notes: string[] = [];

    if (sessions.length === 0) {
      return ['No sessions logged yet. Log a range session to start tracking maintenance and performance.'];
    }

    // Check for recent issues
    if (issuesInLast3) {
      const issueSession = sessions.find(s => s.issues);
      notes.push(`⚠️ Issue reported in recent session${issueSession?.issueDescription ? ': ' + issueSession.issueDescription : ''}`);
    }

    // Check zero status
    if (lastZeroDate) {
      const daysSinceZero = Math.floor((new Date().getTime() - new Date(lastZeroDate).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceZero > 90) {
        notes.push(`🎯 Last zeroed ${daysSinceZero} days ago - consider verifying zero`);
      } else {
        notes.push(`✓ Zeroed ${new Date(lastZeroDate).toLocaleDateString()}`);
      }
    } else {
      notes.push('🎯 No zero data logged - consider zeroing and logging session');
    }

    // Round count milestone
    if (gun.roundCount && gun.roundCount >= 1000) {
      notes.push(`🔥 ${gun.roundCount.toLocaleString()} rounds through this firearm`);
    }

    // Recent activity
    if (lastShotDate) {
      const daysSinceShot = Math.floor((new Date().getTime() - new Date(lastShotDate).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceShot > 180) {
        notes.push(`💤 Last shot ${daysSinceShot} days ago - might be time for range day`);
      }
    }

    return notes.length > 0 ? notes : ['All systems normal'];
  }

  const systemNotes = generateSystemNotes();

  function handleSave() {
    updateGun(gun.id, editedGun);
    setIsEditing(false);
    onClose();
    window.location.reload(); // Refresh to show changes
  }

  function handleSessionLogged() {
    window.location.reload(); // Refresh to show updated round count
  }

  const labelStyle = {
    fontFamily: 'monospace' as const,
    fontSize: '9px',
    letterSpacing: '0.8px',
    color: theme.textMuted,
    textTransform: 'uppercase' as const,
    marginBottom: '4px'
  };

  const valueStyle = {
    fontSize: '13px',
    color: theme.textPrimary,
    fontFamily: 'monospace' as const
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '24px',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: theme.surface,
          borderRadius: '8px',
          maxWidth: '1000px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0,0,0,0.8)',
            border: `0.5px solid ${theme.border}`,
            color: theme.textPrimary,
            fontSize: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
          }}
        >
          ×
        </button>

        {/* Two column layout */}
        <div style={{ display: 'flex', flexDirection: 'row', minHeight: '500px' }}>
          {/* Left: Image */}
          <div style={{
            flex: '0 0 400px',
            backgroundColor: theme.surfaceAlt,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px 0 0 8px',
            padding: '24px'
          }}>
            <img
              src={getGunImageUrl(gun)}
              alt={`${gun.make} ${gun.model}`}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
              onError={(e) => {
                // Fallback to letter
                const target = e.currentTarget;
                target.style.display = 'none';
                if (target.parentElement) {
                  const fallback = document.createElement('div');
                  fallback.style.cssText = `font-family:monospace;font-size:80px;color:${theme.textMuted};opacity:0.3;`;
                  fallback.textContent = gun.type.charAt(0);
                  target.parentElement.appendChild(fallback);
                }
              }}
            />
          </div>

          {/* Right: Details */}
          <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
            {/* Title */}
            <h2 style={{
              fontFamily: 'monospace',
              fontSize: '24px',
              fontWeight: 700,
              letterSpacing: '1px',
              margin: '0 0 4px 0'
            }}>
              {gun.make} {gun.model}
            </h2>
            <p style={{
              fontSize: '18px',
              color: theme.caliberRed,
              margin: '0 0 8px 0',
              fontWeight: 600
            }}>
              {gun.caliber}
            </p>
            <p style={{
              fontSize: '12px',
              color: theme.textSecondary,
              margin: '0 0 24px 0',
              fontFamily: 'monospace'
            }}>
              {gun.type} • {gun.action}
              {gun.serialNumber && ` • SN: ${gun.serialNumber}`}
            </p>

            {/* Round count - BIG */}
            <div style={{
              padding: '20px',
              backgroundColor: theme.bg,
              borderRadius: '6px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <div style={{ ...labelStyle, textAlign: 'center' }}>Total Round Count</div>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '48px',
                fontWeight: 700,
                color: theme.accent,
                lineHeight: 1
              }}>
                {(gun.roundCount || 0).toLocaleString()}
              </div>
            </div>

            {/* Compact info grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px 20px',
              marginBottom: '20px'
            }}>
              {gun.condition && (
                <div>
                  <div style={labelStyle}>Condition</div>
                  <div style={valueStyle}>{gun.condition}</div>
                </div>
              )}
              {gun.barrelLength && (
                <div>
                  <div style={labelStyle}>Barrel Length</div>
                  <div style={valueStyle}>{gun.barrelLength}"</div>
                </div>
              )}
              {gun.acquiredDate && (
                <div>
                  <div style={labelStyle}>Acquired</div>
                  <div style={valueStyle}>
                    {new Date(gun.acquiredDate).toLocaleDateString()}
                  </div>
                </div>
              )}
              {gun.acquiredPrice && (
                <div>
                  <div style={labelStyle}>Purchase Price</div>
                  <div style={valueStyle}>${gun.acquiredPrice.toLocaleString()}</div>
                </div>
              )}
              {gun.insuranceValue && (
                <div>
                  <div style={labelStyle}>Insurance Value</div>
                  <div style={valueStyle}>${gun.insuranceValue.toLocaleString()}</div>
                </div>
              )}
              {gun.estimatedFMV && (
                <div>
                  <div style={labelStyle}>Est. FMV</div>
                  <div style={valueStyle}>${gun.estimatedFMV.toLocaleString()}</div>
                </div>
              )}
            </div>

            {/* Accessories */}
            {(optic || attachments) && (
              <div style={{
                padding: '16px',
                backgroundColor: theme.bg,
                borderRadius: '6px',
                marginBottom: '20px'
              }}>
                <div style={{ ...labelStyle, marginBottom: '8px' }}>Accessories</div>
                {optic && (
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ ...valueStyle, fontSize: '11px', color: theme.textSecondary }}>
                      Optic:
                    </span>
                    <span style={{ ...valueStyle, fontSize: '11px', marginLeft: '8px' }}>
                      {optic}
                    </span>
                  </div>
                )}
                {attachments && attachments.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    {attachments.map((att, i) => (
                      <span key={i} style={{
                        padding: '4px 8px',
                        backgroundColor: theme.surface,
                        border: `0.5px solid ${theme.border}`,
                        borderRadius: '3px',
                        fontSize: '10px',
                        color: theme.textSecondary
                      }}>
                        {att}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Maintenance status */}
            <div style={{
              padding: '16px',
              backgroundColor: theme.bg,
              borderRadius: '6px',
              marginBottom: '20px'
            }}>
              <div style={{ ...labelStyle, marginBottom: '12px' }}>Maintenance Status</div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px'
              }}>
                <div>
                  <div style={{ fontSize: '10px', color: theme.textMuted }}>Last Cleaned</div>
                  <div style={{ ...valueStyle, fontSize: '11px', color: theme.textMuted }}>
                    No data
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: theme.textMuted }}>Last Shot</div>
                  <div style={{ ...valueStyle, fontSize: '11px', color: lastShotDate ? theme.textPrimary : theme.textMuted }}>
                    {lastShotDate ? new Date(lastShotDate).toLocaleDateString() : 'No sessions'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: theme.textMuted }}>Zero Date</div>
                  <div style={{ ...valueStyle, fontSize: '11px', color: lastZeroDate ? theme.textPrimary : theme.textMuted }}>
                    {lastZeroDate ? new Date(lastZeroDate).toLocaleDateString() : 'No data'}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Sessions */}
            {sessions.length > 0 && (
              <div style={{
                padding: '16px',
                backgroundColor: theme.bg,
                borderRadius: '6px',
                marginBottom: '20px'
              }}>
                <div style={{ ...labelStyle, marginBottom: '12px' }}>Recent Sessions</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {sessions.slice(0, 3).map(session => (
                    <div key={session.id} style={{
                      padding: '8px',
                      backgroundColor: theme.surface,
                      border: `0.5px solid ${session.issues ? theme.caliberRed : theme.border}`,
                      borderRadius: '4px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', color: theme.textPrimary, fontWeight: 600 }}>
                          {new Date(session.date).toLocaleDateString()}
                        </span>
                        <span style={{ fontSize: '11px', color: theme.accent }}>
                          {session.roundsExpended} rounds
                        </span>
                      </div>
                      {session.location && (
                        <div style={{ fontSize: '10px', color: theme.textMuted, marginBottom: '2px' }}>
                          {session.location} • {session.indoorOutdoor}
                        </div>
                      )}
                      {session.notes && (
                        <div style={{ fontSize: '10px', color: theme.textSecondary, marginTop: '4px' }}>
                          {session.notes}
                        </div>
                      )}
                      {session.issues && session.issueDescription && (
                        <div style={{ fontSize: '10px', color: theme.caliberRed, marginTop: '4px' }}>
                          ⚠️ {session.issueDescription}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* System notes (auto-generated) */}
            <div style={{
              padding: '12px',
              backgroundColor: theme.accentDim,
              border: `0.5px solid ${theme.accent}`,
              borderRadius: '6px',
              marginBottom: '12px'
            }}>
              <div style={{ ...labelStyle, color: theme.accent, marginBottom: '6px' }}>
                System Notes
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {systemNotes.map((note, i) => (
                  <div key={i} style={{ fontSize: '11px', color: theme.textSecondary, lineHeight: '1.4' }}>
                    {note}
                  </div>
                ))}
              </div>
            </div>

            {/* User notes */}
            {isEditing ? (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ ...labelStyle, marginBottom: '6px' }}>User Notes</div>
                <textarea
                  value={editedGun.notes || ''}
                  onChange={(e) => setEditedGun({ ...editedGun, notes: e.target.value })}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: theme.bg,
                    border: `0.5px solid ${theme.border}`,
                    borderRadius: '4px',
                    color: theme.textPrimary,
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    resize: 'vertical'
                  }}
                />
              </div>
            ) : gun.notes ? (
              <div style={{
                padding: '12px',
                backgroundColor: theme.bg,
                borderRadius: '6px',
                marginBottom: '20px'
              }}>
                <div style={{ ...labelStyle, marginBottom: '6px' }}>User Notes</div>
                <div style={{
                  fontSize: '12px',
                  color: theme.textSecondary,
                  lineHeight: '1.6'
                }}>
                  {gun.notes}
                </div>
              </div>
            ) : null}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
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
                    SAVE CHANGES
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowSessionModal(true)}
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
                  <button
                    onClick={() => setIsEditing(true)}
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
                    EDIT DETAILS
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Session Logging Modal */}
      {showSessionModal && (
        <SessionLoggingModal
          gun={gun}
          onClose={() => setShowSessionModal(false)}
          onSessionLogged={handleSessionLogged}
        />
      )}
    </div>
  );
}
