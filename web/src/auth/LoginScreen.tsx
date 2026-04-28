import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { theme } from '../theme';
import { Capacitor } from '@capacitor/core';

const OAUTH_REDIRECT = Capacitor.isNativePlatform()
  ? 'com.lindcottarmory.app://login-callback'
  : window.location.origin;

type Step = 'menu' | 'email' | 'sent' | 'signup';

function AppleLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 814 1000" fill="currentColor">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.8-155.5-127.4C46 790.9 0 663.1 0 541.8 0 347.4 119.4 244.3 236.7 244.3c66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
    </svg>
  );
}

function GoogleLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

export function LoginScreen() {
  const [step, setStep] = useState<Step>('menu');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState<string | null>(null); // which button is loading
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleOAuth(provider: 'google' | 'apple') {
    setLoading(provider);
    setError('');
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: OAUTH_REDIRECT },
    });
    if (err) { setError(err.message); setLoading(null); }
    // on success, browser redirects — no further state needed
  }

  async function handleAnonymous() {
    setLoading('anon');
    setError('');
    const { error: err } = await supabase.auth.signInAnonymously();
    if (err) { setError(err.message); setLoading(null); }
    // AuthProvider picks up SIGNED_IN and sets user
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading('email');
    setError('');
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(null);
    if (err) { setError(err.message); } else { setStep('sent'); }
  }

  async function handlePasswordSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    if (!password) {
      // Fall through to magic link
      return handleEmail(e);
    }

    setLoading('email');
    setError('');
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(null);
    if (err) {
      setError(err.message);
    }
    // On success: AuthProvider sets user, App.tsx re-renders — no further action needed
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError('');
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    setLoading('email');
    setError('');
    const { error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(null);
    if (err) { setError(err.message); } else { setStep('sent'); }
  }

  const dividerStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0',
  };

  const dividerLine: React.CSSProperties = {
    flex: 1, height: '0.5px', backgroundColor: theme.border,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px',
    backgroundColor: theme.surface,
    border: `0.5px solid ${theme.border}`,
    borderRadius: '6px',
    color: theme.textPrimary, fontFamily: 'monospace',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  };

  const oauthBtn = (label: string, provider: 'google' | 'apple', Icon: React.FC, dark?: boolean): React.ReactElement => (
    <button
      onClick={() => handleOAuth(provider)}
      disabled={!!loading}
      style={{
        width: '100%', padding: '13px', marginBottom: '10px',
        backgroundColor: dark ? '#000' : theme.surface,
        border: `0.5px solid ${dark ? '#000' : theme.border}`,
        borderRadius: '8px',
        color: dark ? '#fff' : theme.textPrimary,
        fontFamily: 'monospace', fontSize: '12px', fontWeight: 600,
        letterSpacing: '0.5px', cursor: loading ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
        opacity: loading && loading !== provider ? 0.5 : 1,
      }}
    >
      <Icon />
      {loading === provider ? 'REDIRECTING...' : label}
    </button>
  );

  return (
    <div style={{
      minHeight: '100dvh', backgroundColor: theme.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>

        {/* Wordmark */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, letterSpacing: '3px', color: theme.accent, marginBottom: '4px' }}>
            LINDCOTT
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 700, letterSpacing: '2px', color: theme.textPrimary }}>
            ARMORY
          </div>
          <div style={{ width: '32px', height: '1px', backgroundColor: theme.accent, margin: '12px auto 0' }} />
        </div>

        {/* ── MENU ── */}
        {step === 'menu' && (
          <>
            {oauthBtn('Continue with Apple', 'apple', AppleLogo, true)}
            {oauthBtn('Continue with Google', 'google', GoogleLogo)}

            <div style={dividerStyle}>
              <div style={dividerLine} />
              <span style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, letterSpacing: '1px' }}>OR</span>
              <div style={dividerLine} />
            </div>

            <button
              onClick={() => setStep('email')}
              disabled={!!loading}
              style={{
                width: '100%', padding: '13px',
                backgroundColor: 'transparent',
                border: `0.5px solid ${theme.border}`,
                borderRadius: '8px',
                color: theme.textSecondary, fontFamily: 'monospace',
                fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px',
                cursor: loading ? 'default' : 'pointer',
                opacity: loading ? 0.5 : 1,
              }}
            >
              Sign in with Email
            </button>

            {error && (
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.red, marginTop: '12px', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <div style={{ borderTop: `0.5px solid ${theme.border}`, marginTop: '28px', paddingTop: '20px', textAlign: 'center' }}>
              <button
                onClick={handleAnonymous}
                disabled={!!loading}
                style={{
                  background: 'none', border: 'none',
                  color: theme.textMuted, fontFamily: 'monospace',
                  fontSize: '11px', cursor: loading ? 'default' : 'pointer',
                  letterSpacing: '0.3px',
                  opacity: loading && loading !== 'anon' ? 0.5 : 1,
                }}
              >
                {loading === 'anon' ? 'Setting up...' : 'Continue without an account →'}
              </button>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginTop: '5px', lineHeight: 1.5, opacity: 0.7 }}>
                Your vault syncs privately in the background.
              </div>
            </div>
          </>
        )}

        {/* ── EMAIL FORM ── */}
        {step === 'email' && (
          <form onSubmit={handlePasswordSignIn}>
            <button
              type="button"
              onClick={() => { setStep('menu'); setError(''); setPassword(''); }}
              style={{ background: 'none', border: 'none', color: theme.textMuted, fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer', marginBottom: '20px', letterSpacing: '0.5px', padding: 0 }}
            >
              ← Back
            </button>

            <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.8px', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '8px' }}>
              Email address
            </div>

            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
              autoCapitalize="off"
              autoCorrect="off"
              style={inputStyle}
            />

            <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.8px', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '8px', marginTop: '14px' }}>
              Password
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password (optional)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ ...inputStyle, paddingRight: '42px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: theme.textMuted, display: 'flex', alignItems: 'center' }}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>

            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginTop: '6px', lineHeight: 1.5 }}>
              Leave blank to sign in with a one-time email link
            </div>

            {error && (
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.red, marginTop: '8px' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!!loading || !email.trim()}
              style={{
                width: '100%', marginTop: '14px', padding: '13px',
                backgroundColor: loading || !email.trim() ? theme.surface : theme.accent,
                color: loading || !email.trim() ? theme.textMuted : theme.bg,
                border: 'none', borderRadius: '6px',
                fontFamily: 'monospace', fontSize: '11px',
                fontWeight: 700, letterSpacing: '1px',
                cursor: loading || !email.trim() ? 'default' : 'pointer',
              }}
            >
              {loading === 'email' ? 'SIGNING IN...' : password ? 'SIGN IN' : 'SEND SIGN-IN LINK'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => { setStep('signup'); setError(''); setPassword(''); setConfirmPassword(''); setPasswordError(''); }}
                style={{ background: 'none', border: 'none', color: theme.textMuted, fontFamily: 'monospace', fontSize: '11px', cursor: 'pointer', letterSpacing: '0.3px' }}
              >
                New to Lindcott Armory? Create account →
              </button>
            </div>
          </form>
        )}

        {/* ── SIGNUP FORM ── */}
        {step === 'signup' && (
          <form onSubmit={handleSignUp}>
            <button
              type="button"
              onClick={() => { setStep('email'); setError(''); setPassword(''); setConfirmPassword(''); setPasswordError(''); }}
              style={{ background: 'none', border: 'none', color: theme.textMuted, fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer', marginBottom: '20px', letterSpacing: '0.5px', padding: 0 }}
            >
              ← Back
            </button>

            <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.8px', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '8px' }}>
              Email address
            </div>

            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
              autoCapitalize="off"
              autoCorrect="off"
              style={inputStyle}
            />

            <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.8px', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '8px', marginTop: '14px' }}>
              Password
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ ...inputStyle, paddingRight: '42px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: theme.textMuted, display: 'flex', alignItems: 'center' }}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>

            <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.8px', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '8px', marginTop: '14px' }}>
              Confirm password
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={{ ...inputStyle, paddingRight: '42px' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(v => !v)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: theme.textMuted, display: 'flex', alignItems: 'center' }}
              >
                {showConfirmPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>

            {passwordError && (
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.red, marginTop: '8px' }}>
                {passwordError}
              </div>
            )}

            {error && (
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.red, marginTop: '8px' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!!loading || !email.trim() || !password}
              style={{
                width: '100%', marginTop: '14px', padding: '13px',
                backgroundColor: loading || !email.trim() || !password ? theme.surface : theme.accent,
                color: loading || !email.trim() || !password ? theme.textMuted : theme.bg,
                border: 'none', borderRadius: '6px',
                fontFamily: 'monospace', fontSize: '11px',
                fontWeight: 700, letterSpacing: '1px',
                cursor: loading || !email.trim() || !password ? 'default' : 'pointer',
              }}
            >
              {loading === 'email' ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
            </button>
          </form>
        )}

        {/* ── SENT ── */}
        {step === 'sent' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              backgroundColor: `${theme.accent}18`,
              border: `1px solid ${theme.accent}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={theme.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 6l8 5 8-5M2 6v10a1 1 0 001 1h14a1 1 0 001-1V6M2 6a1 1 0 011-1h14a1 1 0 011 1" />
              </svg>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: theme.textPrimary, letterSpacing: '1px', marginBottom: '8px' }}>
              CHECK YOUR EMAIL
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted, lineHeight: 1.7 }}>
              Sign-in link sent to<br />
              <span style={{ color: theme.textSecondary }}>{email}</span>
            </div>
            <button
              onClick={() => { setStep('menu'); setEmail(''); setPassword(''); setConfirmPassword(''); }}
              style={{ marginTop: '24px', background: 'none', border: 'none', color: theme.textMuted, fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer', letterSpacing: '0.5px' }}
            >
              Use a different method
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
