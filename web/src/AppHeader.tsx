// Consistent top header bar — shown on every view
import { theme } from './theme';

interface AppHeaderProps {
  title: string;
  onBack?: () => void;       // shows ‹ back chevron when provided
  backLabel?: string;        // e.g. "Vault" — shown next to chevron
  onSearch?: () => void;     // search icon, right side
}

export function AppHeader({ title, onBack, backLabel, onSearch }: AppHeaderProps) {
  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 500,
      backgroundColor: theme.bg,
      borderBottom: `0.5px solid ${theme.border}`,
      display: 'flex',
      alignItems: 'center',
      height: '52px',
      padding: '0 16px',
      maxWidth: '480px',
      margin: '0 auto',
      width: '100%',
    }}>

      {/* Left — back button or spacer */}
      <div style={{ width: '72px', display: 'flex', alignItems: 'center' }}>
        {onBack ? (
          <button
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              color: theme.accent,
              cursor: 'pointer',
              padding: '4px 0',
              fontFamily: 'monospace',
              fontSize: '11px',
              letterSpacing: '0.3px',
            }}
          >
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
              <path d="M7 1L1 7L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {backLabel && (
              <span style={{ color: theme.accent }}>{backLabel}</span>
            )}
          </button>
        ) : null}
      </div>

      {/* Center — title */}
      <div style={{
        flex: 1,
        textAlign: 'center',
        fontFamily: 'monospace',
        fontSize: '13px',
        fontWeight: 700,
        letterSpacing: '2px',
        color: theme.textPrimary,
        textTransform: 'uppercase',
      }}>
        {title}
      </div>

      {/* Right — search or spacer */}
      <div style={{ width: '72px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        {onSearch && (
          <button
            onClick={onSearch}
            style={{
              background: 'none',
              border: 'none',
              color: theme.textSecondary,
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
