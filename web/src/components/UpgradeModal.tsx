import { useState } from 'react';
import { theme } from './theme';
import { supabase, SUPABASE_URL } from './lib/supabase';
import { isNativePlatform, purchasePro, purchasePremium, restorePurchases } from './lib/billing';

type Tier = 'pro' | 'premium';
type Billing = 'monthly' | 'annual';

interface Props {
  onClose: () => void;
  onFeedback?: () => void;
  onUpgradeSuccess?: (tier: Tier) => void;
  reason?: string;
}

function getReasonCopy(reason?: string): { headline: string | null; context: string | null } {
  if (!reason) return { headline: null, context: null };
  const month = new Date().toLocaleString('default', { month: 'long' });
  switch (reason) {
    case 'assistant':
      return { headline: 'Unlock the Armory Assistant', context: null };
    case 'assistant_session_issues':
      return { headline: 'Get answers about what happened', context: 'The Armory Assistant can diagnose the issues from your session — FTFs, accuracy problems, wear patterns — and tell you exactly what to look at.' };
    case 'assistant_cleaning':
      return { headline: 'Ask about this cleaning', context: 'The Armory Assistant knows your gun\'s action type, round count, and usage history. Ask it what to focus on and what products to use.' };
    case 'assistant_target':
      return { headline: 'Get personalized coaching on this group', context: 'The Armory Assistant can analyze your shot pattern in the context of your past sessions with this gun and this ammo.' };
    case 'assistant_caliber':
      return { headline: 'Ask how this round fits your vault', context: 'The Armory Assistant knows every gun and caliber in your vault. Ask it how this cartridge compares to what you\'re already running.' };
    case 'assistant_ammo_low':
      return { headline: 'Get a burn-rate and restock recommendation', context: 'The Armory Assistant can calculate your ammo burn rate, project when you\'ll run out, and recommend what to buy based on your session history.' };
    case 'ammo_scan':
      return { headline: 'Unlock Ammo Box Scanning', context: 'Photograph a box and the app fills in caliber, brand, grain weight, and count automatically.' };
    case 'target_analysis_limit':
      return { headline: `You've used your 5 free Target Analyses for ${month}`, context: 'Pro gives you unlimited analyses. Premium adds AI drill coaching.' };
    case 'narrative_limit':
      return { headline: `You've used your 5 free Debriefs for ${month}`, context: 'Pro gives you unlimited AI session debriefs.' };
    default:
      return { headline: null, context: null };
  }
}

const PRO_FEATURES = [
  'Unlimited AI session debriefs',
  'Unlimited target analyses and coaching',
  'AI Armory Assistant (25 turns/day)',
  'Ammo box OCR scanning',
  'Cloud backup and sync',
  'Full Field Guide access',
];

const PREMIUM_ADDS = [
  'Everything in Pro',
  'AI Range Coach — video drill analysis',
  'Slow-motion malfunction documentation',
  'AI Armory Assistant (50 turns/day)',
  'Advanced performance analytics',
  'Session trend analysis',
];

const PRICING = {
  pro:     { monthly: 5,  annual: 40,  lifetime: 79.99 },
  premium: { monthly: 10, annual: 80 },
};

export function UpgradeModal({ onClose, onFeedback, onUpgradeSuccess, reason }: Props) {
  const { headline, context } = getReasonCopy(reason);
  const native = isNativePlatform();

  const [step, setStep] = useState<'upgrade' | 'reveal' | 'success'>('upgrade');
  const [tier, setTier] = useState<Tier>('pro');
  const [billing, setBilling] = useState<Billing>('monthly');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [successTier, setSuccessTier] = useState<Tier>('pro');

  // ── Native: trigger billing sheet ────────────────────────────────────────────

  async function handleNativePurchase() {
    setBusy(true);
    setError('');
    try {
      const result = tier === 'premium' ? await purchasePremium() : await purchasePro();
      if (result.success) {
        await activateInSupabase(tier);
        setSuccessTier(tier);
        onUpgradeSuccess?.(tier);
        setStep('success');
      } else if (result.error === 'cancelled') {
        // User dismissed — do nothing
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
      const result = await restorePurchases();
      if (result.isPremium || result.isPro) {
        const restoredTier: Tier = result.isPremium ? 'premium' : 'pro';
        await activateInSupabase(restoredTier);
        setSuccessTier(restoredTier);
        onUpgradeSuccess?.(restoredTier);
        setStep('success');
      } else {
        setError('No active subscription found to restore.');
      }
    } finally {
      setRestoring(false);
    }
  }

  // ── Web: free claim flow ──────────────────────────────────────────────────────

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
      setSuccessTier('pro');
      onUpgradeSuccess?.('pro');
      setStep('success');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  // ── Shared: write tier to Supabase after native purchase ──────────────────────

  async function activateInSupabase(activatedTier: Tier) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await fetch(`${SUPABASE_URL}/functions/v1/claim-pro`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ source: 'google_play', tier: activatedTier }),
      });
    } catch {
      // Non-fatal — RC webhook will also sync this
    }
  }

  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  // ── Shared styles ─────────────────────────────────────────────────────────────

  const panelStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: theme.surface,
    borderRadius: '16px 16px 0 0',
    padding: '24px 20px 40px',
    maxHeight: '92vh',
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

  // ── Pricing helpers ───────────────────────────────────────────────────────────

  function getPriceDisplay() {
    if (tier === 'pro') {
      if (billing === 'annual') return { main: '$40', sub: '/year', note: 'save 2 months' };
      return { main: '$5', sub: '/month', note: '' };
    }
    if (billing === 'annual') return { main: '$80', sub: '/year', note: 'save 4 months' };
    return { main: '$10', sub: '/month', note: '' };
  }

  function getCTALabel() {
    if (busy) return 'LOADING...';
    if (!native) return 'UNLOCK PRO — FREE MONTH';
    const { main } = getPriceDisplay();
    return `START ${tier.toUpperCase()} — ${main}/${billing === 'annual' ? 'YR' : 'MO'}`;
  }

  const price = getPriceDisplay();
  const features = tier === 'premium' ? PREMIUM_ADDS : PRO_FEATURES;

  // ── Render ─────────────────────────────────────────────────────────────────────

  return (
    <div onClick={handleBackdrop} style={{
      position: 'fixed', inset: 0, zIndex: 3000,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'flex-end',
    }}>

      {/* ── Step 1: Tier selector + features + CTA ── */}
      {step === 'upgrade' && (
        <div style={panelStyle}>
          {/* Close */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' }}>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, fontSize: '20px', lineHeight: 1, padding: '4px' }}>x</button>
          </div>

          {/* Context headline */}
          {headline && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '15px', fontWeight: 700, color: theme.textPrimary, lineHeight: 1.4, marginBottom: context ? '8px' : 0 }}>
                {headline}
              </div>
              {context && (
                <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textSecondary, lineHeight: 1.6 }}>
                  {context}
                </div>
              )}
            </div>
          )}

          {/* Tier toggle */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {(['pro', 'premium'] as Tier[]).map(t => (
              <button
                key={t}
                onClick={() => setTier(t)}
                style={{
                  flex: 1, padding: '10px',
                  backgroundColor: tier === t ? theme.accent : 'transparent',
                  border: `1.5px solid ${tier === t ? theme.accent : theme.border}`,
                  borderRadius: '8px',
                  color: tier === t ? theme.bg : theme.textSecondary,
                  fontFamily: 'monospace', fontSize: '12px',
                  fontWeight: 700, letterSpacing: '1px', cursor: 'pointer',
                }}
              >
                {t === 'pro' ? 'PRO' : 'PREMIUM'}
              </button>
            ))}
          </div>

          {/* Billing toggle (native only — web claim is always monthly) */}
          {native && (
            <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', backgroundColor: theme.bg, borderRadius: '8px', padding: '4px' }}>
              {(['monthly', 'annual'] as Billing[]).map(b => (
                <button
                  key={b}
                  onClick={() => setBilling(b)}
                  style={{
                    flex: 1, padding: '8px',
                    backgroundColor: billing === b ? theme.surface : 'transparent',
                    border: billing === b ? `0.5px solid ${theme.border}` : 'none',
                    borderRadius: '6px',
                    color: billing === b ? theme.textPrimary : theme.textMuted,
                    fontFamily: 'monospace', fontSize: '11px',
                    fontWeight: 700, letterSpacing: '0.8px', cursor: 'pointer',
                  }}
                >
                  {b.toUpperCase()}
                  {b === 'annual' && tier === 'pro' && (
                    <span style={{ color: theme.accent, marginLeft: '4px' }}>-33%</span>
                  )}
                  {b === 'annual' && tier === 'premium' && (
                    <span style={{ color: theme.accent, marginLeft: '4px' }}>-33%</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Price display */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', letterSpacing: '1.5px', color: theme.textSecondary, marginBottom: '6px' }}>
              LINDCOTT ARMORY {tier.toUpperCase()}
            </div>
            {native ? (
              <div>
                <span style={{ fontFamily: 'monospace', fontSize: '28px', fontWeight: 700, color: theme.accent }}>{price.main}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '13px', color: theme.textSecondary }}>{price.sub}</span>
                {price.note && (
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.accent, letterSpacing: '1px', marginTop: '2px' }}>{price.note}</div>
                )}
              </div>
            ) : (
              <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textSecondary }}>
                First 30 days free — no card required
              </div>
            )}
          </div>

          {/* Lifetime Pro banner (Pro + native only) */}
          {native && tier === 'pro' && (
            <div style={{
              backgroundColor: 'rgba(255, 212, 59, 0.08)',
              border: `1px solid rgba(255, 212, 59, 0.3)`,
              borderRadius: '8px', padding: '12px 14px',
              marginBottom: '20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', color: theme.accent }}>LIFETIME OFFER</span>
                <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, letterSpacing: '0.5px' }}>FIRST 500 ONLY</span>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '13px', color: theme.textPrimary, marginBottom: '2px' }}>
                $79.99 one-time — Pro forever
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textSecondary }}>
                No subscription, no renewals. Does not include Premium video features.
              </div>
            </div>
          )}

          {/* Features */}
          <div style={{ marginBottom: '28px' }}>
            {features.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                <span style={{ color: theme.accent, fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>+</span>
                <span style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textSecondary, lineHeight: 1.5 }}>{f}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          {native ? (
            <>
              <button onClick={handleNativePurchase} disabled={busy} style={busy ? dimBtn : accentBtn}>
                {getCTALabel()}
              </button>
              {error && <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.red, marginTop: '12px', textAlign: 'center' }}>{error}</div>}
              <div style={{ textAlign: 'center', marginTop: '14px' }}>
                <button onClick={handleRestore} disabled={restoring} style={ghostBtn}>
                  {restoring ? 'Restoring...' : 'Restore previous purchase'}
                </button>
              </div>
            </>
          ) : (
            <button onClick={startReveal} disabled={busy} style={busy ? dimBtn : accentBtn}>
              {busy ? 'LOADING...' : 'UNLOCK PRO — FREE MONTH'}
            </button>
          )}
        </div>
      )}

      {/* ── Step 2: Web-only early access reveal ── */}
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
                <span style={{ color: theme.accent, fontSize: '14px', flexShrink: 0 }}>+</span>
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
              {error && <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.red, marginTop: '12px', textAlign: 'center' }}>{error}</div>}
            </>
          )}
        </div>
      )}

      {/* ── Step 3: Success ── */}
      {step === 'success' && (
        <div style={panelStyle}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', backgroundColor: theme.accent }}>
              <span style={{ fontSize: '24px', color: theme.bg, fontFamily: 'monospace', fontWeight: 700 }}>+</span>
            </div>
          </div>

          <div style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 700, letterSpacing: '2px', color: theme.textPrimary, textAlign: 'center', marginBottom: '8px' }}>
            {successTier.toUpperCase()} ACTIVATED
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textSecondary, textAlign: 'center', marginBottom: '24px' }}>
            {native ? `Welcome to ${successTier === 'premium' ? 'Premium' : 'Pro'}.` : '30 days of Pro access, starting now.'}
          </div>

          <div style={{ borderTop: '0.5px solid ' + theme.border, marginBottom: '24px' }} />

          <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: theme.textPrimary, textAlign: 'center', marginBottom: '8px' }}>
            Enjoying Lindcott Armory?
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textSecondary, textAlign: 'center', lineHeight: 1.6, marginBottom: '20px' }}>
            A review helps others find us.
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
