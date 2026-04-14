// WelcomeScreen — shown when a signed-in user has an empty vault
// First impression: on-brand, clear value props, direct CTA.

import { theme } from './theme';

interface Props {
  onAddGun: () => void;
  onRestoreBackup: () => void;
  onBrowse?: () => void;
}

function IconVault() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="17" rx="2" stroke={theme.accent} strokeWidth="1.5"/>
      <circle cx="12" cy="12.5" r="3" stroke={theme.accent} strokeWidth="1.5"/>
      <path d="M12 9.5V8M12 17v-1M7 12.5H6M18 12.5h-1M8.5 8.5l-.7-.7M16.2 16.2l-.7-.7M8.5 16.5l-.7.7M16.2 8.8l-.7.7" stroke={theme.accent} strokeWidth="1.2" strokeLinecap="round"/>
      <rect x="3" y="4" width="18" height="3" rx="1" fill={theme.accent} opacity="0.15"/>
    </svg>
  );
}

function IconSession() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="16" height="18" rx="2" stroke={theme.accent} strokeWidth="1.5"/>
      <rect x="9" y="2" width="6" height="3" rx="1" stroke={theme.accent} strokeWidth="1.2"/>
      <path d="M8 10H16M8 13.5H13M8 17H11" stroke={theme.accent} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function IconAI() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" stroke={theme.accent} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M19 16L19.75 19L22 19.75L19.75 20.5L19 23L18.25 20.5L16 19.75L18.25 19L19 16Z" stroke={theme.accent} strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  );
}

const VALUE_PROPS = [
  {
    Icon: IconVault,
    headline: 'Your vault',
    body: 'Every firearm tracked — acquisition, condition, round count, maintenance.',
  },
  {
    Icon: IconSession,
    headline: 'Every session',
    body: 'Log range time, ammo, performance, and issues. Spot patterns over time.',
  },
  {
    Icon: IconAI,
    headline: 'AI that knows you',
    body: 'Personalized insights, coaching, and answers — drawn from your actual data.',
  },
];

export function WelcomeScreen({ onAddGun, onRestoreBackup, onBrowse }: Props) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100%',
      padding: '32px 24px 48px',
      backgroundColor: theme.bg,
    }}>

      {/* Dismiss */}
      {onBrowse && (
        <div style={{ width: '100%', maxWidth: '360px', display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
          <button
            onClick={onBrowse}
            style={{
              background: 'none', border: 'none', padding: '4px 0',
              color: theme.textMuted, fontFamily: 'monospace',
              fontSize: '10px', letterSpacing: '0.5px', cursor: 'pointer',
            }}
          >
            BROWSE APP ›
          </button>
        </div>
      )}

      {/* Logo */}
      <img
        src="/logo.png"
        alt="Lindcott Armory"
        style={{ width: 72, height: 72, objectFit: 'contain', marginBottom: '16px', borderRadius: '12px' }}
      />

      {/* Wordmark */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{
          fontFamily: 'monospace', fontSize: '10px', fontWeight: 700,
          letterSpacing: '4px', color: theme.accent, marginBottom: '4px',
        }}>
          LINDCOTT
        </div>
        <div style={{
          fontFamily: 'monospace', fontSize: '22px', fontWeight: 700,
          letterSpacing: '3px', color: theme.textPrimary,
        }}>
          ARMORY
        </div>
        <div style={{
          width: '32px', height: '1px',
          backgroundColor: theme.accent,
          margin: '12px auto 0',
        }} />
        <div style={{
          fontFamily: 'monospace', fontSize: '11px',
          color: theme.textMuted, marginTop: '12px', letterSpacing: '0.3px',
        }}>
          Your complete firearms record
        </div>
      </div>

      {/* Value props */}
      <div style={{
        width: '100%', maxWidth: '360px',
        display: 'flex', flexDirection: 'column', gap: '20px',
        marginBottom: '40px',
      }}>
        {VALUE_PROPS.map(({ Icon, headline, body }) => (
          <div key={headline} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{
              width: 44, height: 44, flexShrink: 0,
              borderRadius: '10px',
              backgroundColor: `${theme.accent}12`,
              border: `1px solid ${theme.accent}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon />
            </div>
            <div style={{ paddingTop: '2px' }}>
              <div style={{
                fontFamily: 'monospace', fontSize: '13px', fontWeight: 700,
                color: theme.textPrimary, marginBottom: '3px',
              }}>
                {headline}
              </div>
              <div style={{
                fontFamily: 'monospace', fontSize: '11px',
                color: theme.textSecondary, lineHeight: 1.6,
              }}>
                {body}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          onClick={onAddGun}
          style={{
            width: '100%', padding: '15px',
            backgroundColor: theme.accent,
            border: 'none', borderRadius: '8px',
            color: '#07071a', fontFamily: 'monospace',
            fontSize: '12px', fontWeight: 700,
            letterSpacing: '1px', cursor: 'pointer',
          }}
        >
          ADD YOUR FIRST FIREARM
        </button>
        <button
          onClick={onRestoreBackup}
          style={{
            width: '100%', padding: '13px',
            backgroundColor: 'transparent',
            border: `0.5px solid ${theme.border}`,
            borderRadius: '8px',
            color: theme.textSecondary, fontFamily: 'monospace',
            fontSize: '11px', fontWeight: 600,
            letterSpacing: '0.5px', cursor: 'pointer',
          }}
        >
          RESTORE FROM BACKUP
        </button>
      </div>

    </div>
  );
}
