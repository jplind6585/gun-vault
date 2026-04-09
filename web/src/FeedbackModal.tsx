import { useState } from 'react';
import { theme } from './theme';
import { supabase } from './lib/supabase';

type Category = 'bug' | 'feature' | 'general';

const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'bug',     label: 'Bug report' },
  { key: 'feature', label: 'Feature request' },
  { key: 'general', label: 'General feedback' },
];

interface Props {
  onClose: () => void;
}

export function FeedbackModal({ onClose }: Props) {
  const [category, setCategory] = useState<Category>('general');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  async function handleSend() {
    if (!message.trim()) return;
    setSending(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error: insertError } = await supabase.from('feedback').insert({
        user_id: session?.user?.id ?? null,
        category,
        message: message.trim(),
        email: session?.user?.email ?? null,
        app_version: '1.0',
      });
      if (insertError) throw insertError;
      setSent(true);
    } catch {
      setError('Failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  }

  const btnBase: React.CSSProperties = {
    flex: 1, padding: '9px 6px',
    border: '0.5px solid ' + theme.border,
    borderRadius: '6px',
    fontFamily: 'monospace', fontSize: '10px',
    fontWeight: 600, letterSpacing: '0.4px',
    cursor: 'pointer', backgroundColor: 'transparent',
  };

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 3000,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'flex-end',
      }}
    >
      <div style={{
        width: '100%',
        backgroundColor: theme.surface,
        borderRadius: '12px 12px 0 0',
        padding: '0 0 env(safe-area-inset-bottom)',
        maxHeight: '80vh',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '0.5px solid ' + theme.border,
        }}>
          <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, letterSpacing: '1px', color: theme.textPrimary }}>
            FEEDBACK
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, fontSize: '18px', lineHeight: 1, padding: '4px' }}>
            ×
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          {sent ? (
            /* Success state */
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '32px', marginBottom: '12px' }}>✓</div>
              <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: theme.textPrimary, marginBottom: '8px' }}>
                Thanks for your feedback!
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted, marginBottom: '24px' }}>
                Your feedback goes directly to the team.
              </div>
              <button
                onClick={onClose}
                style={{
                  width: '100%', padding: '13px',
                  backgroundColor: theme.accent,
                  border: '0.5px solid ' + theme.accent,
                  borderRadius: '8px',
                  color: theme.bg,
                  fontFamily: 'monospace', fontSize: '12px',
                  fontWeight: 700, letterSpacing: '1px',
                  cursor: 'pointer',
                }}
              >
                DONE
              </button>
            </div>
          ) : (
            <>
              {/* Category */}
              <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '1px', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '8px' }}>
                Type
              </div>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
                {CATEGORIES.map(c => (
                  <button
                    key={c.key}
                    onClick={() => setCategory(c.key)}
                    style={{
                      ...btnBase,
                      backgroundColor: category === c.key ? theme.accent : 'transparent',
                      border: '0.5px solid ' + (category === c.key ? theme.accent : theme.border),
                      color: category === c.key ? theme.bg : theme.textSecondary,
                      fontWeight: category === c.key ? 700 : 600,
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Message */}
              <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '1px', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '8px' }}>
                Message
              </div>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Tell us what's on your mind..."
                rows={5}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '12px', resize: 'none',
                  backgroundColor: theme.bg,
                  border: '0.5px solid ' + theme.border,
                  borderRadius: '6px',
                  color: theme.textPrimary,
                  fontFamily: 'monospace', fontSize: '12px',
                  lineHeight: 1.6, outline: 'none',
                  marginBottom: '8px',
                }}
              />
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginBottom: '20px' }}>
                Your feedback goes directly to the team.
              </div>

              {/* Send */}
              <button
                onClick={handleSend}
                disabled={sending || !message.trim()}
                style={{
                  width: '100%', padding: '13px',
                  backgroundColor: (sending || !message.trim()) ? theme.surface : theme.accent,
                  border: '0.5px solid ' + ((sending || !message.trim()) ? theme.border : theme.accent),
                  borderRadius: '8px',
                  color: (sending || !message.trim()) ? theme.textMuted : theme.bg,
                  fontFamily: 'monospace', fontSize: '12px',
                  fontWeight: 700, letterSpacing: '1px',
                  cursor: (sending || !message.trim()) ? 'default' : 'pointer',
                }}
              >
                {sending ? 'SENDING...' : 'SEND FEEDBACK'}
              </button>

              {error && (
                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.red, marginTop: '10px', textAlign: 'center' }}>
                  {error}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
