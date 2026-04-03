import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { theme } from '../theme';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');

    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    backgroundColor: theme.surface,
    border: `0.5px solid ${theme.border}`,
    borderRadius: '6px',
    color: theme.textPrimary,
    fontFamily: 'monospace',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>

        {/* Wordmark */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            fontFamily: 'monospace',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '3px',
            color: theme.accent,
            marginBottom: '4px',
          }}>
            LINDCOTT
          </div>
          <div style={{
            fontFamily: 'monospace',
            fontSize: '20px',
            fontWeight: 700,
            letterSpacing: '2px',
            color: theme.textPrimary,
          }}>
            ARMORY
          </div>
          <div style={{
            width: '32px',
            height: '1px',
            backgroundColor: theme.accent,
            margin: '12px auto 0',
          }} />
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit}>
            <div style={{
              fontFamily: 'monospace',
              fontSize: '9px',
              letterSpacing: '0.8px',
              color: theme.textMuted,
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}>
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

            {error && (
              <div style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                color: theme.red,
                marginTop: '8px',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              style={{
                width: '100%',
                marginTop: '16px',
                padding: '13px',
                backgroundColor: loading || !email.trim() ? theme.surface : theme.accent,
                color: loading || !email.trim() ? theme.textMuted : theme.bg,
                border: 'none',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '1px',
                cursor: loading || !email.trim() ? 'default' : 'pointer',
                transition: 'background-color 0.15s',
              }}
            >
              {loading ? 'SENDING...' : 'SEND SIGN-IN LINK'}
            </button>

            <div style={{
              fontFamily: 'monospace',
              fontSize: '10px',
              color: theme.textMuted,
              textAlign: 'center',
              marginTop: '20px',
              lineHeight: 1.6,
            }}>
              No password required. We'll email you a secure sign-in link.
            </div>
          </form>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,212,59,0.1)',
              border: `1px solid ${theme.accent}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={theme.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 6l8 5 8-5M2 6v10a1 1 0 001 1h14a1 1 0 001-1V6M2 6a1 1 0 011-1h14a1 1 0 011 1" />
              </svg>
            </div>
            <div style={{
              fontFamily: 'monospace',
              fontSize: '13px',
              fontWeight: 700,
              color: theme.textPrimary,
              letterSpacing: '1px',
              marginBottom: '8px',
            }}>
              CHECK YOUR EMAIL
            </div>
            <div style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              color: theme.textMuted,
              lineHeight: 1.7,
            }}>
              Sign-in link sent to<br />
              <span style={{ color: theme.textSecondary }}>{email}</span>
            </div>
            <button
              onClick={() => setSent(false)}
              style={{
                marginTop: '24px',
                background: 'none',
                border: 'none',
                color: theme.textMuted,
                fontFamily: 'monospace',
                fontSize: '10px',
                cursor: 'pointer',
                letterSpacing: '0.5px',
              }}
            >
              Use a different email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
