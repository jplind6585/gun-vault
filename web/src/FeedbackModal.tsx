import { useState } from 'react';
import { theme } from './theme';

const SUPPORT_EMAIL = 'support@lindcottarmory.com';

type Category = 'bug' | 'feature' | 'general';

const CATEGORIES: { key: Category; label: string; subject: string }[] = [
  { key: 'bug',     label: 'Bug report',       subject: 'Bug Report' },
  { key: 'feature', label: 'Feature request',  subject: 'Feature Request' },
  { key: 'general', label: 'General feedback', subject: 'Feedback' },
];

interface Props {
  onClose: () => void;
}

export function FeedbackModal({ onClose }: Props) {
  const [category, setCategory] = useState<Category>('general');
  const [message, setMessage] = useState('');

  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  function handleSend() {
    const cat = CATEGORIES.find(c => c.key === category)!;
    const subject = encodeURIComponent(`Lindcott Armory — ${cat.subject}`);
    const body = encodeURIComponent(message.trim());
    window.open(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`, '_blank');
    onClose();
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
            Opens in your email app. Sent to {SUPPORT_EMAIL}
          </div>

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            style={{
              width: '100%', padding: '13px',
              backgroundColor: message.trim() ? theme.accent : theme.surface,
              border: '0.5px solid ' + (message.trim() ? theme.accent : theme.border),
              borderRadius: '8px',
              color: message.trim() ? theme.bg : theme.textMuted,
              fontFamily: 'monospace', fontSize: '12px',
              fontWeight: 700, letterSpacing: '1px',
              cursor: message.trim() ? 'pointer' : 'default',
            }}
          >
            SEND FEEDBACK
          </button>
        </div>
      </div>
    </div>
  );
}
