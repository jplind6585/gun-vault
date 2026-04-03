import { useState } from 'react';
import { theme } from '../theme';

const CODE = 'applesaucet';
const STORAGE_KEY = 'lindcott_unlocked';

export function isUnlocked(): boolean {
  return localStorage.getItem(STORAGE_KEY) === '1';
}

export function PasscodeGate({ onUnlock }: { onUnlock: () => void }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (input.trim() === CODE) {
      localStorage.setItem(STORAGE_KEY, '1');
      onUnlock();
    } else {
      setError(true);
      setInput('');
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '320px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, letterSpacing: '3px', color: theme.accent, marginBottom: '4px' }}>
            LINDCOTT
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 700, letterSpacing: '2px', color: theme.textPrimary }}>
            ARMORY
          </div>
          <div style={{ width: '32px', height: '1px', backgroundColor: theme.accent, margin: '12px auto 0' }} />
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.8px', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '8px' }}>
            Access code
          </div>
          <input
            type="password"
            value={input}
            onChange={e => { setInput(e.target.value); setError(false); }}
            autoFocus
            autoCapitalize="off"
            autoCorrect="off"
            style={{
              width: '100%',
              padding: '12px 14px',
              backgroundColor: theme.surface,
              border: `0.5px solid ${error ? theme.red : theme.border}`,
              borderRadius: '6px',
              color: theme.textPrimary,
              fontFamily: 'monospace',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {error && (
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.red, marginTop: '8px' }}>
              Incorrect code.
            </div>
          )}
          <button
            type="submit"
            disabled={!input.trim()}
            style={{
              width: '100%',
              marginTop: '16px',
              padding: '13px',
              backgroundColor: !input.trim() ? theme.surface : theme.accent,
              color: !input.trim() ? theme.textMuted : theme.bg,
              border: 'none',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '1px',
              cursor: !input.trim() ? 'default' : 'pointer',
            }}
          >
            ENTER
          </button>
        </form>
      </div>
    </div>
  );
}
