import { useState } from 'react';
import { theme } from './theme';
import { supabase, SUPABASE_URL } from './lib/supabase';

interface Props {
  onClose: () => void;
  onFeedback?: () => void;
}

export function UpgradeModal({ onClose, onFeedback }: Props) {
  const [step, setStep] = useState<'upgrade' | 'reveal' | 'success'>('upgrade');
  const [revealing, setRevealing] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState('');
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);

  async function startReveal() {
    setRevealing(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setRevealing(false);
    setStep('reveal');
  }

  async function claimPro() {
    setClaiming(true);
    setClaimError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not signed in');

      const res = await fetch(`${SUPABASE_URL}/functions/v1/claim-pro`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'already_claimed') {
          setAlreadyClaimed(true);
        } else {
          setClaimError(data.message ?? 'Something went wrong. Please try again.');
        }
        return;
      }

      setStep('success');
    } catch {
      setClaimError('Something went wrong. Please try again.');
    } finally {
      setClaiming(false);
    }
  }

  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  const PRO_FEATURES = [
    'Unlimited AI coaching and analysis',
    'AI-powered session narratives',
    'Target photo analysis & coaching',
    'Ammo scan & OCR',
    'AI Armory Assistant',
  ];

  const panelStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: theme.surface,
    borderRadius: '16px 16px 0 0',
    padding: '24px 20px 40px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxSizing: 'border-box',
  };

  const accentBtnStyle: React.CSSProperties = {
    width: '100%',
    padding: '15px',
    backgroundColor: theme.accent,
    border: 'none',
    borderRadius: '10px',
    color: theme.bg,
    fontFamily: 'monospace',
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '1.5px',
    cursor: 'pointer',
  };

  const disabledBtnStyle: React.CSSProperties = {
    ...accentBtnStyle,
    backgroundColor: theme.surface,
    border: '0.5px solid ' + theme.border,
    color: theme.textMuted,
    cursor: 'default',
  };

  const outlineBtnStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px',
    backgroundColor: 'transparent',
    border: '1.5px solid ' + theme.accent,
    borderRadius: '10px',
    color: theme.accent,
    fontFamily: 'monospace',
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '1.5px',
    cursor: 'pointer',
  };

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 3000,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'flex-end',
      }}
    >
      {step === 'upgrade' && (
        <div style={panelStyle}>
          {/* Close button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' }}>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, fontSize: '20px', lineHeight: 1, padding: '4px' }}
            >
              ✕
            </button>
          </div>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              fontFamily: 'monospace',
              fontSize: '18px',
              fontWeight: 700,
              letterSpacing: '2px',
              color: theme.textPrimary,
            }}>
              LINDCOTT ARMORY PRO
            </div>
          </div>

          {/* Features list */}
          <div style={{ marginBottom: '32px' }}>
            {PRO_FEATURES.map((feature, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '14px',
              }}>
                <span style={{ color: theme.accent, fontSize: '16px', flexShrink: 0 }}>✓</span>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  color: theme.textSecondary,
                  lineHeight: 1.4,
                }}>
                  {feature}
                </span>
              </div>
            ))}
          </div>

          {/* Unlock button */}
          <button
            onClick={startReveal}
            disabled={revealing}
            style={revealing ? disabledBtnStyle : accentBtnStyle}
          >
            {revealing ? 'LOADING...' : 'UNLOCK PRO'}
          </button>
        </div>
      )}

      {step === 'reveal' && (
        <div style={panelStyle}>
          {/* Early access chip */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{
              display: 'inline-block',
              backgroundColor: theme.accent,
              color: theme.bg,
              fontFamily: 'monospace',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '1.5px',
              padding: '4px 12px',
              borderRadius: '20px',
            }}>
              EARLY ACCESS
            </span>
          </div>

          {/* Heading */}
          <div style={{
            fontFamily: 'monospace',
            fontSize: '22px',
            fontWeight: 700,
            color: theme.textPrimary,
            textAlign: 'center',
            marginBottom: '16px',
            lineHeight: 1.3,
          }}>
            You're one of our first.
          </div>

          {/* Body copy */}
          <div style={{
            fontFamily: 'monospace',
            fontSize: '13px',
            color: theme.textSecondary,
            lineHeight: 1.7,
            textAlign: 'center',
            marginBottom: '24px',
          }}>
            Lindcott Armory is new, and you're part of the founding group. We're giving you 30 days of Pro — no card, no catch, nothing to cancel. Just our thanks for being early.
          </div>

          {/* Bullet points */}
          <div style={{ marginBottom: '32px' }}>
            {[
              'Full Pro access, activated instantly',
              'No payment required',
              'Nothing to cancel',
            ].map((point, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px',
              }}>
                <span style={{ color: theme.accent, fontSize: '16px', flexShrink: 0 }}>✓</span>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  color: theme.textSecondary,
                }}>
                  {point}
                </span>
              </div>
            ))}
          </div>

          {alreadyClaimed ? (
            <div>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '12px',
                color: theme.textSecondary,
                lineHeight: 1.6,
                textAlign: 'center',
                marginBottom: '20px',
                padding: '14px',
                backgroundColor: theme.bg,
                borderRadius: '8px',
                border: '0.5px solid ' + theme.border,
              }}>
                Your free month has been claimed. Reach out to support@lindcottarmory.com to extend.
              </div>
              <button onClick={onClose} style={accentBtnStyle}>
                DONE
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={claimPro}
                disabled={claiming}
                style={claiming ? disabledBtnStyle : accentBtnStyle}
              >
                {claiming ? 'ACTIVATING...' : 'CLAIM MY FREE MONTH'}
              </button>

              {claimError && (
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: theme.red,
                  marginTop: '12px',
                  textAlign: 'center',
                }}>
                  {claimError}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {step === 'success' && (
        <div style={panelStyle}>
          {/* Checkmark icon */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: theme.accent,
            }}>
              <span style={{ fontSize: '28px', color: theme.bg }}>✓</span>
            </div>
          </div>

          {/* PRO ACTIVATED heading */}
          <div style={{
            fontFamily: 'monospace',
            fontSize: '18px',
            fontWeight: 700,
            letterSpacing: '2px',
            color: theme.textPrimary,
            textAlign: 'center',
            marginBottom: '8px',
          }}>
            PRO ACTIVATED
          </div>

          <div style={{
            fontFamily: 'monospace',
            fontSize: '12px',
            color: theme.textSecondary,
            textAlign: 'center',
            marginBottom: '24px',
          }}>
            30 days of Pro access, starting now.
          </div>

          {/* Divider */}
          <div style={{ borderTop: '0.5px solid ' + theme.border, marginBottom: '24px' }} />

          {/* Review section */}
          <div style={{
            fontFamily: 'monospace',
            fontSize: '14px',
            fontWeight: 700,
            color: theme.textPrimary,
            textAlign: 'center',
            marginBottom: '8px',
          }}>
            Enjoying Lindcott Armory?
          </div>
          <div style={{
            fontFamily: 'monospace',
            fontSize: '12px',
            color: theme.textSecondary,
            textAlign: 'center',
            lineHeight: 1.6,
            marginBottom: '20px',
          }}>
            A review helps others find us — and it means a lot.
          </div>

          <button
            onClick={() => window.open('https://apps.apple.com/app/id6745056716', '_blank')}
            style={outlineBtnStyle}
          >
            LEAVE A REVIEW
          </button>

          {/* Feedback link */}
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button
              onClick={() => { onFeedback?.(); onClose(); }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '12px',
                color: theme.textMuted,
                textDecoration: 'underline',
                padding: '4px',
              }}
            >
              Have feedback?
            </button>
          </div>

          {/* Done button */}
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '12px',
                color: theme.textMuted,
                padding: '4px',
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
