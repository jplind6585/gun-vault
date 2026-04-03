// More Menu — grid of all secondary tools
// Add new tools here as they get built; no nav changes needed
import React from 'react';
import { theme } from './theme';

interface ToolCard {
  id: string;
  Icon: React.FC<{ size?: number; muted?: boolean }>;
  label: string;
  sub: string;
  available: boolean;
  onPress: () => void;
}

interface MoreMenuProps {
  onNavigate: (view: string) => void;
}

// ── SVG icons (24px viewBox, monochrome, consistent stroke) ──────────────────

function IconFieldGuide({ size = 26, muted = false }: { size?: number; muted?: boolean }) {
  const c = muted ? theme.textMuted : theme.textPrimary;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="2" width="13" height="18" rx="1.5" stroke={c} strokeWidth="1.5"/>
      <path d="M7 6H14M7 9.5H14M7 13H11" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="7" y="16" width="10" height="6" rx="1" stroke={c} strokeWidth="1.2" fill="none" transform="translate(0,-1)"/>
      <path d="M17 4H19C19.5523 4 20 4.44772 20 5V19C20 19.5523 19.5523 20 19 20H7" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function IconCalibers({ size = 26, muted = false }: { size?: number; muted?: boolean }) {
  const c = muted ? theme.textMuted : theme.textPrimary;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <ellipse cx="12" cy="6" rx="4" ry="2.5" stroke={c} strokeWidth="1.5"/>
      <path d="M8 6V16C8 17.3807 9.79086 18.5 12 18.5C14.2091 18.5 16 17.3807 16 16V6" stroke={c} strokeWidth="1.5"/>
      <line x1="8" y1="10" x2="16" y2="10" stroke={c} strokeWidth="1" strokeDasharray="2 2"/>
      <line x1="8" y1="13.5" x2="16" y2="13.5" stroke={c} strokeWidth="1" strokeDasharray="2 2"/>
    </svg>
  );
}

function IconBallistics({ size = 26, muted = false }: { size?: number; muted?: boolean }) {
  const c = muted ? theme.textMuted : theme.textPrimary;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 18C6 18 7 10 10 8C13 6 14 14 17 13C19.5 12.2 20.5 8 21 6" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="21" cy="6" r="1.5" fill={c}/>
      <path d="M3 20H21" stroke={c} strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
      <path d="M3 18V20" stroke={c} strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
    </svg>
  );
}

function IconTraining({ size = 26, muted = false }: { size?: number; muted?: boolean }) {
  const c = muted ? theme.textMuted : theme.textPrimary;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="16" height="18" rx="2" stroke={c} strokeWidth="1.5"/>
      <rect x="9" y="2" width="6" height="3" rx="1" stroke={c} strokeWidth="1.2"/>
      <path d="M8 10H16M8 13.5H13M8 17H11" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="17" cy="16" r="3" stroke={c} strokeWidth="1.2"/>
      <path d="M16 16L17 15.2L18 16" stroke={c} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconReloading({ size = 26, muted = false }: { size?: number; muted?: boolean }) {
  const c = muted ? theme.textMuted : theme.textPrimary;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3C7.02944 3 3 7.02944 3 12H6" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 21C16.9706 21 21 16.9706 21 12H18" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M3 12L6 9M3 12L6 15" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 12L18 15M21 12L18 9" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="9" y="9" width="6" height="7" rx="1" stroke={c} strokeWidth="1.2"/>
      <line x1="12" y1="9" x2="12" y2="16" stroke={c} strokeWidth="1" opacity="0.5"/>
    </svg>
  );
}

function IconGear({ size = 26, muted = false }: { size?: number; muted?: boolean }) {
  const c = muted ? theme.textMuted : theme.textPrimary;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="10" width="18" height="11" rx="2" stroke={c} strokeWidth="1.5"/>
      <path d="M7 10V7C7 4.79086 9.23858 3 12 3C14.7614 3 17 4.79086 17 7V10" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M10 15H14M12 13V17" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function IconWishlist({ size = 26, muted = false }: { size?: number; muted?: boolean }) {
  const c = muted ? theme.textMuted : theme.textPrimary;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 21L5.45 14.45C3.9 12.9 3.9 10.4 5.45 8.85C7 7.3 9.5 7.3 11.05 8.85L12 9.8L12.95 8.85C14.5 7.3 17 7.3 18.55 8.85C20.1 10.4 20.1 12.9 18.55 14.45L12 21Z" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M8.5 5.5L9.5 3M14.5 5.5L15.5 3M12 5V3" stroke={c} strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
    </svg>
  );
}

function IconOptics({ size = 26, muted = false }: { size?: number; muted?: boolean }) {
  const c = muted ? theme.textMuted : theme.textPrimary;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="9" width="16" height="7" rx="3.5" stroke={c} strokeWidth="1.5"/>
      <ellipse cx="18" cy="12.5" rx="2" ry="4" stroke={c} strokeWidth="1.2"/>
      <circle cx="22" cy="12.5" r="1.5" stroke={c} strokeWidth="1"/>
      <line x1="6" y1="12.5" x2="14" y2="12.5" stroke={c} strokeWidth="1" strokeDasharray="2 2" opacity="0.5"/>
      <circle cx="10" cy="12.5" r="2" stroke={c} strokeWidth="1.2"/>
    </svg>
  );
}

function IconGunsmithing({ size = 26, muted = false }: { size?: number; muted?: boolean }) {
  const c = muted ? theme.textMuted : theme.textPrimary;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M14.5 4L20 9.5L9.5 20L4 14.5L14.5 4Z" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M4 14.5L2 22L9.5 20" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M14.5 4L18 2L22 6L20 9.5" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/>
      <line x1="8" y1="16" x2="16" y2="8" stroke={c} strokeWidth="1" opacity="0.4"/>
    </svg>
  );
}

function IconEvents({ size = 26, muted = false }: { size?: number; muted?: boolean }) {
  const c = muted ? theme.textMuted : theme.textPrimary;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="17" rx="2" stroke={c} strokeWidth="1.5"/>
      <path d="M3 10H21" stroke={c} strokeWidth="1.5"/>
      <path d="M8 3V7M16 3V7" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 14L13.5 17H16.5L14.5 19L15.5 22L12 20L8.5 22L9.5 19L7.5 17H10.5L12 14Z" stroke={c} strokeWidth="1" strokeLinejoin="round"/>
    </svg>
  );
}

export function MoreMenu({ onNavigate }: MoreMenuProps) {
  const tools: ToolCard[] = [
    {
      id: 'field-guide',
      Icon: IconFieldGuide,
      label: 'Field Guide',
      sub: 'Encyclopedia',
      available: true,
      onPress: () => onNavigate('field-guide'),
    },
    {
      id: 'ballistics',
      Icon: IconBallistics,
      label: 'Ballistics',
      sub: 'Coming soon',
      available: false,
      onPress: () => {},
    },
    {
      id: 'training',
      Icon: IconTraining,
      label: 'Training',
      sub: 'Coming soon',
      available: false,
      onPress: () => {},
    },
    {
      id: 'reloading',
      Icon: IconReloading,
      label: 'Reloading',
      sub: 'Coming soon',
      available: false,
      onPress: () => {},
    },
    {
      id: 'gear',
      Icon: IconGear,
      label: 'Gear Locker',
      sub: 'Coming soon',
      available: false,
      onPress: () => {},
    },
    {
      id: 'wishlist',
      Icon: IconWishlist,
      label: 'Wishlist',
      sub: 'Coming soon',
      available: false,
      onPress: () => {},
    },
    {
      id: 'gunsmithing',
      Icon: IconGunsmithing,
      label: 'Gunsmithing',
      sub: 'Coming soon',
      available: false,
      onPress: () => {},
    },
    {
      id: 'events',
      Icon: IconEvents,
      label: 'Find Events',
      sub: 'Coming soon',
      available: false,
      onPress: () => {},
    },
  ];

  return (
    <div style={{
      minHeight: '100%',
      backgroundColor: theme.bg,
      padding: '16px 16px 100px',
    }}>
      {/* Header */}
      <div style={{
        fontFamily: 'monospace',
        fontSize: '9px',
        letterSpacing: '1.2px',
        color: theme.textMuted,
        textTransform: 'uppercase',
        marginBottom: '16px',
      }}>
        Tools & Reference
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px',
      }}>
        {tools.map(tool => (
          <button
            key={tool.id}
            onClick={tool.available ? tool.onPress : undefined}
            style={{
              backgroundColor: theme.surface,
              border: '0.5px solid ' + (tool.available ? theme.border : 'rgba(255,255,255,0.04)'),
              borderRadius: '10px',
              padding: '18px 14px 16px',
              textAlign: 'center',
              cursor: tool.available ? 'pointer' : 'not-allowed',
              opacity: tool.available ? 1 : 0.35,
              pointerEvents: tool.available ? 'auto' : 'none',
              WebkitTapHighlightColor: 'transparent',
              outline: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              transition: 'border-color 0.15s',
            }}
          >
            <tool.Icon size={26} muted={!tool.available} />
            <div style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.5px',
              color: tool.available ? theme.textPrimary : theme.textMuted,
            }}>
              {tool.label}
            </div>
            <div style={{
              fontFamily: 'monospace',
              fontSize: '9px',
              letterSpacing: '0.3px',
              color: tool.available ? theme.textMuted : 'rgba(255,255,255,0.2)',
            }}>
              {tool.sub}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
