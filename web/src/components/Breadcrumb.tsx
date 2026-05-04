import { theme } from './theme';

interface BreadcrumbProps {
  items: { label: string; onClick?: () => void }[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <div style={{
      position: 'fixed',
      top: '24px',
      left: '24px',
      right: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontFamily: 'monospace',
      fontSize: '11px',
      letterSpacing: '0.8px',
      zIndex: 100,
      maxWidth: 'calc(100vw - 48px)',
      overflow: 'hidden'
    }}>
      {items.map((item, index) => (
        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {item.onClick ? (
            <button
              onClick={item.onClick}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: theme.textSecondary,
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '11px',
                letterSpacing: '0.8px',
                padding: 0,
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = theme.accent}
              onMouseLeave={(e) => e.currentTarget.style.color = theme.textSecondary}
            >
              {item.label.toUpperCase()}
            </button>
          ) : (
            <span style={{ color: theme.accent }}>
              {item.label.toUpperCase()}
            </span>
          )}
          {index < items.length - 1 && (
            <span style={{ color: theme.border }}>▸</span>
          )}
        </div>
      ))}
    </div>
  );
}
