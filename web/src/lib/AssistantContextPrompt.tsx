/**
 * AssistantContextPrompt — contextual upgrade nudge for free users.
 *
 * Shown in various places throughout the app when a free user is in a context
 * where the Armory Assistant would be directly useful. On tap, opens the
 * upgrade modal with context-specific copy.
 *
 * Renders nothing for Pro or Premium users.
 */

import { theme } from '../theme';

interface Props {
  isPro: boolean;
  reason: string;
  label: string;
  onUpgrade: (reason: string) => void;
}

export function AssistantContextPrompt({ isPro, reason, label, onUpgrade }: Props) {
  if (isPro) return null;

  return (
    <button
      onClick={() => onUpgrade(reason)}
      style={{
        width: '100%',
        backgroundColor: 'transparent',
        border: `0.5px solid rgba(255, 212, 59, 0.25)`,
        borderRadius: '8px',
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <span style={{ color: theme.accent, fontSize: '13px', flexShrink: 0 }}>AI</span>
      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textSecondary, lineHeight: 1.4, flex: 1 }}>
        {label}
      </span>
      <span style={{ color: theme.accent, fontSize: '14px', flexShrink: 0 }}>›</span>
    </button>
  );
}
