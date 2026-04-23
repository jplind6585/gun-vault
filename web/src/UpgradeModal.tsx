import { useState } from 'react';
import { theme } from './theme';
import { supabase, SUPABASE_URL } from './lib/supabase';
import { isNativePlatform, purchasePro, restorePurchases } from './lib/billing';

interface Props {
  onClose: () => void;
  onFeedback?: () => void;
  onUpgradeSuccess?: () => void;
  reason?: string;
}

function getReasonHeadline(reason?: string): string | null {
  if (!reason) return null;
  const month = new Date().toLocaleString('default', { month: 'long' });
  switch (reason) {
    case 'assistant': return 'Unlock the Armory Assistant';
    case 'ammo_scan': return 'Unlock Ammo Box Scanning';
    case 'target_analysis_limit': return `You've used your 5 free Target Analyses for ${month}.`;
    case 'narrative_limit': return `You've used your 5 free Debriefs for ${month}.`;
    default: return null;
  }
}

const PRO_FEATURES = [
  'Unlimited AI coaching and analysis',
  'AI-powered session narratives',
  'Target photo analysis & coaching',
  'Ammo scan & OCR',
  'AI Armory Assistant',
];

export function UpgradeModal({ onClose, onFeedback, onUpgradeSuccess, reason }: Props) {
  const reasonHeadline = getReasonHeadline(reason);
  const native = isNativePlatform();

  // Native: 'upgrade' → (billing sheet) → 'success'
  // Web:    'upgrade' → 'reveal' → 'success'
  const [step, setStep] = useState<'upgrade' | 'reveal' | 'success'>('upgrade');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // ── Native: trigger Google Play billing sheet ─────────────────────────────

  async function handleNativePurchase() {
    setBusy(true);
    setError('');
    try {
      const result = await purchasePro();
      if (result.success) {
        // Mark Pro in Supabase so the backend knows too
        await activateProInSupabase();
        onUpgradeSuccess?.();
        setStep('success');
      } else if (result.error === 'cancelled') {
        // User dismissed the sheet — do nothing
      } else {
        setError(result.message ?? 'Purchase failed. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleRestore() {
    setRestoring(true);
    setError('');
    try {
      const isPro = await restorePurchases();
      if (isPro) {
        await activateProInSupabase();
        onUpgradeSuccess?.();
        setStep('success');
      } else {
        setError('No active subscription found to restore.');
      }
    } finally {
      setRestoring(false);
    }
  }

  // ── Web: free claim flow ──────────────────────────────────────────────────

  async function startReveal() {
    setBusy(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setBusy(false);
    setStep('reveal');
  }

  async function claimFreePro() {
    setBusy(true);
    setError('');
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
        if (data.error === 'already_claimed') { setAlreadyClaimed(true); return; }
        setError(data.message ?? 'Something went wrong. Please try again.');
        return;
      }
      onUpgradeSuccess?.();
      setStep('success');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  // ── Shared: activate Pro in Supabase after native purchase ───────────────

  async function activateProInSupabase() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      // Mark Pro via the same edge function (it's idempotent)
      // For native purchases, we pass a flag so it skips the early-access check
      await fetch(`${SUPABASE_URL}/functions/v1/claim-pro`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ source: 'google_play' }),
      });
    } catch {
      // Non-fatal — RevenueCat webhook will also sync this
    }
  }

  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  // ── Shared styles ─────────────────────────────────────────────────────────

  const panelStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: theme.surface,
    borderRadius: '16px 16px 0 0',
    padding: '24px 20px 40px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxSizing: 'border-box',
  };

  const accentBtn: React.CSSProperties = {
    width: '100%', padding: '15px',
    backgroundColor: theme.accent, border: 'none',
    borderRadius: '10px', color: theme.bg,
    fontFamily: 'monospace', fontSize: '13px',
    fontWeight: 700, letterSpacing: '1.5px', cursor: 'pointer',
  };

  const dimBtn: React.CSSProperties = {
    ...accentBtn,
    backgroundColor: theme.surface,
    border: '0.5px solid ' + theme.border,
    color: theme.textMuted, cursor: 'default',
  };

  const outlineBtn: React.CSSProperties = {
    width: '100%', padding: '14px',
    backgroundColor: 'transparent',
    border: '1.5px solid ' + theme.accent,
    borderRadius: '10px', color: theme.accent,
    fontFamily: 'monospace', fontSize: '13px',
    fontWeight: 700, letterSpacing: '1.5px', cursor: 'pointer',
  };

  const ghostBtn: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer',
    fontFamily: 'monospace', fontSize: '12px',
    color: theme.textMuted, textDecoration: 'underline', padding: '4px',
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div onClick={handleBackdrop} style={{
      position: 'fixed', inset: 0, zIndex: 3000,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'flex-end',
    }}>

      {/* ── Step 1: Features + CTA ── */}
      {step === 'upgrade' && (
        <div style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' }}>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, fontSize: '20px', lineHeight: 1, padding: '4px' }}>✕</button>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            {reasonHeadline && (
              <div style={{ fontFamily: 'monospace', fontSize: '13px', color: theme.textSecondary, marginBottom: '10px', lineHeight: 1.4 }}>
                {reasonHeadline}
              </div>
            )}
            <div style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 700, letterSpacing: '2px', color: theme.textPrimary }}>
              LINDCOTT ARMORY PRO
            </div>
            {native && (
              <div style={{ marginTop: '8px' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 700, color: theme.accent }}>$5</span>
                <span style={{ fontFamily: 'monospace', fontSize: '13px', color: theme.textSecondary }}> / month</span>
                <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, textDecoration: 'line-through', marginLeft: '8px' }}>$10</span>
                <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.accent, letterSpacing: '1px', marginTop: '4px' }}>50% EARLY ACCESS DISCOUNT</div>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '32px' }}>
            {PRO_FEATURES.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <span style={{ color: theme.accent, fontSize: '16px', flexShrink: 0 }}>✓</span>
                <span style={{ fontFamily: 'monospace', fontSize: '13px', color: theme.textSecondary, lineHeight: 1.4 }}>{f}</span>
              </div>
            ))}
          </div>

          {native ? (
            <>
              <button onClick={handleNativePurchase} disabled={busy} style={busy ? dimBtn : accentBtn}>
                {busy ? 'LOADING...' : 'START PRO — $5/MO'}
              </button>
              {error && <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#ff6b6b', marginTop: '12px', textAlign: 'center' }}>{error}</div>}
              <div style={{ textAlign: 'center', marginTop: '14px' }}>
                <button onClick={handleRestore} disabled={restoring} style={ghostBtn}>
                  {restoring ? 'Restoring...' : 'Restore previous purchase'}
                </button>
              </div>
            </>
          ) : (
            <button onClick={startReveal} disabled={busy} style={busy ? dimBtn : accentBtn}>
              {busy ? 'LOADING...' : 'UNLOCK PRO'}
            </button>
          )}
        </div>
      )}

      {/* ── Step 2: Web-only free month reveal ── */}
      {step === 'reveal' && (
        <div style={panelStyle}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{
              display: 'inline-block', backgroundColor: theme.accent, color: theme.bg,
              fontFamily: 'monospace', fontSize: '10px', fontWeight: 700,
              letterSpacing: '1.5px', padding: '4px 12px', borderRadius: '20px',
            }}>EARLY ACCESS</span>
          </div>

          <div style={{ fontFamily: 'monospace', fontSize: '22px', fontWeight: 700, color: theme.textPrimary, textAlign: 'center', marginBottom: '16px', lineHeight: 1.3 }}>
            You're one of our first.
          </div>

          <div style={{ fontFamily: 'monospace', fontSize: '13px', color: theme.textSecondary, lineHeight: 1.7, textAlign: 'center', marginBottom: '24px' }}>
            Lindcott Armory is new, and you're part of the founding group. We're giving you 30 days of Pro — no card, no catch, nothing to cancel.
          </div>

          <div style={{ marginBottom: '32px' }}>
            {['Full Pro access, activated instantly', 'No payment required', 'Nothing to cancel'].map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{ color: theme.accent, fontSize: '16px', flexShrink: 0 }}>✓</span>
                <span style={{ fontFamily: 'monospace', fontSize: '13px', color: theme.textSecondary }}>{p}</span>
              </div>
            ))}
          </div>

          {alreadyClaimed ? (
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textSecondary, lineHeight: 1.6, textAlign: 'center', marginBottom: '20px', padding: '14px', backgroundColor: theme.bg, borderRadius: '8px', border: '0.5px solid ' + theme.border }}>
                Your free month has been claimed. Reach out to support@lindcottarmory.com to extend.
              </div>
              <button onClick={onClose} style={accentBtn}>DONE</button>
            </div>
          ) : (
            <>
              <button onClick={claimFreePro} disabled={busy} style={busy ? dimBtn : accentBtn}>
                {busy ? 'ACTIVATING...' : 'CLAIM MY FREE MONTH'}
              </button>
              {error && <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#ff6b6b', marginTop: '12px', textAlign: 'center' }}>{error}</div>}
            </>
          )}
        </div>
      )}

      {/* ── Step 3: Success ── */}
      {step === 'success' && (
        <div style={panelStyle}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', backgroundColor: theme.accent }}>
              <span style={{ fontSize: '28px', color: theme.bg }}>✓</span>
            </div>
          </div>

          <div style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 700, letterSpacing: '2px', color: theme.textPrimary, textAlign: 'center', marginBottom: '8px' }}>
            PRO ACTIVATED
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textSecondary, textAlign: 'center', marginBottom: '24px' }}>
            {native ? 'Welcome to Pro.' : '30 days of Pro access, starting now.'}
          </div>

          <div style={{ borderTop: '0.5px solid ' + theme.border, marginBottom: '24px' }} />

          <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: theme.textPrimary, textAlign: 'center', marginBottom: '8px' }}>
            Enjoying Lindcott Armory?
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textSecondary, textAlign: 'center', lineHeight: 1.6, marginBottom: '20px' }}>
            A review helps others find us — and it means a lot.
          </div>

          <button
            onClick={() => window.open('https://play.google.com/store/apps/details?id=com.lindcottarmory.app', '_blank')}
            style={outlineBtn}
          >
            LEAVE A REVIEW
          </button>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button onClick={() => { onFeedback?.(); onClose(); }} style={ghostBtn}>Have feedback?</button>
          </div>
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <button onClick={onClose} style={{ ...ghostBtn, textDecoration: 'none' }}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
