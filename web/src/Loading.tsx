import { theme } from './theme';

interface LoadingProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
}

export function Loading({ size = 'medium', text }: LoadingProps) {
  const sizes = {
    small: 16,
    medium: 32,
    large: 48
  };

  const spinnerSize = sizes[size];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      padding: '24px'
    }}>
      <div
        style={{
          width: `${spinnerSize}px`,
          height: `${spinnerSize}px`,
          border: `3px solid ${theme.border}`,
          borderTop: `3px solid ${theme.accent}`,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}
      />
      {text && (
        <div style={{
          fontSize: '12px',
          color: theme.textSecondary,
          fontFamily: 'monospace'
        }}>
          {text}
        </div>
      )}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export function LoadingSkeleton({ height = 40, width = '100%' }: { height?: number; width?: string | number }) {
  return (
    <div
      style={{
        height: `${height}px`,
        width: typeof width === 'number' ? `${width}px` : width,
        backgroundColor: theme.surfaceAlt,
        borderRadius: '4px',
        animation: 'pulse 1.5s ease-in-out infinite'
      }}
    >
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
