import { useState } from 'react';
import { LoginScreen } from './LoginScreen';

export function LandingPage() {
  const [showApp, setShowApp] = useState(false);

  if (showApp) return <LoginScreen />;

  const features = [
    { title: 'Gun Vault', desc: 'Catalog every firearm in your collection — make, model, caliber, action, status, photos, and notes. Tracks all-time round count automatically as you log sessions.' },
    { title: 'Range Session Log', desc: 'Log every range trip with rounds fired, location, date, and notes. See your activity over the past week, month, or year at a glance.' },
    { title: 'Ammo Inventory', desc: 'Track every ammo lot by caliber, brand, grain weight, bullet type, quantity on hand, and purchase price. Know exactly what you have and what it cost.' },
    { title: 'Target Analysis', desc: 'Upload a target photo and plot your shots. The app calculates MOA, extreme spread, CEP, and standard deviation — the same metrics competitive shooters use.' },
    { title: 'Armory Assistant', desc: 'An AI assistant scoped to your vault data and general firearms questions. Ask about your gear, get load recommendations, or look up cartridge specs.' },
    { title: 'Field Guide', desc: 'Reference library covering calibers, optics, competition formats (USPSA, IDPA, PRS), marksmanship fundamentals, and ballistics. Built in, no internet required.' },
  ];

  return (
    <div style={{ fontFamily: 'ui-monospace, monospace', background: '#07071a', color: '#e8e8f0', minHeight: '100vh', margin: 0, padding: 0 }}>

      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <span style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '0.08em', color: '#e8e8f0' }}>LINDCOTT ARMORY</span>
        <a
          href="https://play.google.com/store/apps/details?id=com.lindcottarmory.app"
          style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: '#5b8cff', textDecoration: 'none', border: '1px solid #5b8cff', padding: '6px 14px', borderRadius: '4px' }}
        >
          GET THE APP
        </a>
      </div>

      {/* Hero */}
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '64px 28px 48px' }}>
        <p style={{ fontSize: '11px', letterSpacing: '0.15em', color: '#5b8cff', margin: '0 0 16px', textTransform: 'uppercase' }}>Firearm Management</p>
        <h1 style={{ fontSize: 'clamp(28px,6vw,42px)', fontWeight: 800, lineHeight: 1.15, margin: '0 0 20px', color: '#e8e8f0', letterSpacing: '-0.01em' }}>
          Your guns, ammo, and<br />range sessions — all in one place.
        </h1>
        <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#9090b0', margin: '0 0 36px' }}>
          Lindcott Armory is a free firearm management app for Android and the web.
          Catalog your collection, track every round downrange, manage your ammo inventory,
          and analyze your shot groups — all from your phone.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <a
            href="https://play.google.com/store/apps/details?id=com.lindcottarmory.app"
            style={{ display: 'inline-block', background: '#5b8cff', color: '#fff', fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', padding: '13px 24px', borderRadius: '6px', textDecoration: 'none' }}
          >
            DOWNLOAD FOR ANDROID
          </a>
          <a
            href="#features"
            style={{ display: 'inline-block', background: 'transparent', color: '#9090b0', fontSize: '13px', fontWeight: 600, letterSpacing: '0.08em', padding: '13px 24px', borderRadius: '6px', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            SEE FEATURES ↓
          </a>
        </div>
      </div>

      {/* Features */}
      <div id="features" style={{ maxWidth: '560px', margin: '0 auto', padding: '0 28px 64px' }}>
        <h2 style={{ fontSize: '11px', letterSpacing: '0.15em', color: '#5b8cff', margin: '0 0 32px', textTransform: 'uppercase' }}>What's inside</h2>
        <div style={{ display: 'grid', gap: '24px' }}>
          {features.map(f => (
            <div key={f.title} style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.05em', color: '#e8e8f0', margin: '0 0 8px' }}>{f.title}</h3>
              <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#9090b0', margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '48px 28px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#e8e8f0', margin: '0 0 12px' }}>Free. No subscription. Always improving.</h2>
        <p style={{ fontSize: '13px', color: '#9090b0', margin: '0 0 28px', lineHeight: 1.6 }}>Available for Android on Google Play. Also runs as a web app on any device.</p>
        <a
          href="https://play.google.com/store/apps/details?id=com.lindcottarmory.app"
          style={{ display: 'inline-block', background: '#5b8cff', color: '#fff', fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', padding: '14px 28px', borderRadius: '6px', textDecoration: 'none' }}
        >
          DOWNLOAD ON GOOGLE PLAY
        </a>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <span style={{ fontSize: '11px', color: '#5a5a7a', letterSpacing: '0.05em' }}>© 2026 LINDCOTT FARMS</span>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <a href="/privacy" style={{ fontSize: '11px', color: '#5a5a7a', textDecoration: 'none', letterSpacing: '0.05em' }}>PRIVACY</a>
          <a href="/support" style={{ fontSize: '11px', color: '#5a5a7a', textDecoration: 'none', letterSpacing: '0.05em' }}>SUPPORT</a>
          <button onClick={() => setShowApp(true)} style={{ fontSize: '11px', color: '#5a5a7a', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.05em', fontFamily: 'inherit' }}>
            WEB APP →
          </button>
        </div>
      </div>

    </div>
  );
}
