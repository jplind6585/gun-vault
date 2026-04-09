import { Component, type ReactNode } from 'react';
import { theme } from './theme';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100dvh', padding: '32px 24px', background: theme.bg, textAlign: 'center', gap: 16,
      }}>
        <div style={{ fontSize: 36 }}>⚠️</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: theme.textPrimary }}>Something went wrong</div>
        <div style={{ fontSize: 13, color: theme.textMuted, maxWidth: 300, lineHeight: 1.5 }}>
          An unexpected error occurred. Your data is safe — try reloading the app.
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: 8, padding: '12px 28px', borderRadius: 12,
            background: theme.accent, color: '#000', border: 'none',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Reload App
        </button>
        {this.state.error && (
          <div style={{ fontSize: 10, color: theme.textMuted, fontFamily: 'monospace', maxWidth: 320, wordBreak: 'break-all', opacity: 0.6 }}>
            {this.state.error.message}
          </div>
        )}
      </div>
    );
  }
}
