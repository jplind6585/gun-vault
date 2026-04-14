import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { theme } from '../theme';
import { LoginScreen } from './LoginScreen';

export function LandingPage() {
  // If there's existing vault data, this is a returning user whose session lapsed —
  // skip the marketing page and go straight to sign-in.
  const hasExistingData = !!localStorage.getItem('gunvault_guns') || !!localStorage.getItem('gunvault_sessions');
  const [showLogin, setShowLogin] = useState(hasExistingData);
  const [anonLoading, setAnonLoading] = useState(false);

  async function handleAnonymous() {
    setAnonLoading(true);
    await supabase.auth.signInAnonymously();
    setAnonLoading(false);
  }

  if (showLogin) return <LoginScreen />;

  const features = [
    { title: 'Gun Vault', desc: 'Catalog every firearm — make, model, caliber, action, photos, and notes. Round count tracked automatically.' },
    { title: 'Range Session Log', desc: 'Log every range trip with rounds fired, location, date, and notes.' },
    { title: 'Ammo Inventory', desc: 'Track every ammo lot by caliber, brand, grain weight, and quantity on hand.' },
    { title: 'Target Analysis', desc: 'Plot shots on a target photo. Calculates MOA, extreme spread, CEP, and standard deviation.' },
    { title: 'Armory Assistant', desc: 'AI assistant scoped to your vault data and general firearms questions.' },
    { title: 'Field Guide', desc: 'Reference library: calibers, optics, competition formats, marksmanship, and ballistics.' },
  ];

  return (
    <div style={{ fontFamily: 'monospace', backgroundColor: theme.bg, color: theme.textPrimary, minHeight: '100dvh' }}>

      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: `1px solid ${theme.border}` }}>
        <div>
          <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '3px', color: theme.accent }}>LINDCOTT</div>
          <div style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '2px', color: theme.textPrimary }}>ARMORY</div>
        </div>
        <button
          onClick={() => setShowLogin(true)}
          style={{
            fontSize: '10px', fontWeight: 600, letterSpacing: '1px',
            color: theme.accent, background: 'none',
            border: `1px solid ${theme.accent}`, borderRadius: '4px',
            padding: '7px 16px', cursor: 'pointer', fontFamily: 'monospace',
          }}
        >
          SIGN IN
        </button>
      </div>

      {/* Hero */}
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '56px 24px 48px' }}>
        <p style={{ fontSize: '10px', letterSpacing: '2px', color: theme.accent, margin: '0 0 16px', textTransform: 'uppercase' }}>
          Firearm Management
        </p>
        <h1 style={{ fontSize: 'clamp(26px, 6vw, 40px)', fontWeight: 800, lineHeight: 1.15, margin: '0 0 18px', color: theme.textPrimary, letterSpacing: '-0.01em' }}>
          Your guns, ammo, and<br />range sessions — all in one place.
        </h1>
        <p style={{ fontSize: '14px', lineHeight: 1.7, color: theme.textSecondary, margin: '0 0 32px' }}>
          Lindcott Armory is a free firearm management app for Android and the web.
          Catalog your collection, track every round downrange, manage ammo inventory,
          and analyze your shot groups.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button
            onClick={() => setShowLogin(true)}
            style={{
              background: theme.accent, color: '#fff',
              fontSize: '12px', fontWeight: 700, letterSpacing: '1px',
              padding: '13px 24px', borderRadius: '6px', border: 'none',
              cursor: 'pointer', fontFamily: 'monospace',
            }}
          >
            GET STARTED
          </button>
          <button
            onClick={handleAnonymous}
            disabled={anonLoading}
            style={{
              background: 'transparent', color: theme.textSecondary,
              fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px',
              padding: '13px 24px', borderRadius: '6px',
              border: `1px solid ${theme.border}`,
              cursor: anonLoading ? 'default' : 'pointer', fontFamily: 'monospace',
            }}
          >
            {anonLoading ? 'LOADING...' : 'TRY WITHOUT ACCOUNT'}
          </button>
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '0 24px 56px' }}>
        <p style={{ fontSize: '10px', letterSpacing: '2px', color: theme.accent, margin: '0 0 28px', textTransform: 'uppercase' }}>
          What's inside
        </p>
        <div style={{ display: 'grid', gap: '16px' }}>
          {features.map(f => (
            <div key={f.title} style={{ border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.5px', color: theme.textPrimary, marginBottom: '6px' }}>{f.title}</div>
              <div style={{ fontSize: '12px', lineHeight: 1.6, color: theme.textSecondary }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ borderTop: `1px solid ${theme.border}`, padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', fontWeight: 700, color: theme.textPrimary, marginBottom: '10px' }}>
          Free. No subscription. Always improving.
        </div>
        <div style={{ fontSize: '12px', color: theme.textSecondary, marginBottom: '24px' }}>
          Available for Android on Google Play. Also runs as a web app on any device.
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowLogin(true)}
            style={{
              background: theme.accent, color: '#fff',
              fontSize: '12px', fontWeight: 700, letterSpacing: '1px',
              padding: '13px 24px', borderRadius: '6px', border: 'none',
              cursor: 'pointer', fontFamily: 'monospace',
            }}
          >
            GET STARTED FREE
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${theme.border}`, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <span style={{ fontSize: '10px', color: theme.textMuted, letterSpacing: '0.5px' }}>© 2026 LINDCOTT FARMS</span>
        <div style={{ display: 'flex', gap: '20px' }}>
          <a href="/privacy" style={{ fontSize: '10px', color: theme.textMuted, textDecoration: 'none', letterSpacing: '0.5px' }}>PRIVACY</a>
          <a href="/support" style={{ fontSize: '10px', color: theme.textMuted, textDecoration: 'none', letterSpacing: '0.5px' }}>SUPPORT</a>
        </div>
      </div>

    </div>
  );
}
