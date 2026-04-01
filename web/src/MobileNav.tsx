// Bottom tab bar — primary navigation on mobile
import { theme } from './theme';

type NavView = 'home' | 'vault' | 'arsenal' | 'sessions';

interface MobileNavProps {
  currentView: string;
  onNavigateToHome: () => void;
  onNavigateToVault: () => void;
  onNavigateToArsenal: () => void;
  onNavigateToSessions: () => void;
  // kept for backwards compat, unused
  onNavigateToCaliber?: () => void;
  onNavigateToTargetAnalysis?: () => void;
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z"
        stroke="currentColor" strokeWidth="1.5"
        strokeLinejoin="round"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.15 : 0}
      />
      <path d="M3 12L12 3L21 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 21V15H15V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 21H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function VaultIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2"
        stroke="currentColor" strokeWidth="1.5"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.12 : 0}
      />
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="1" fill="currentColor"/>
      <path d="M3 7H5M3 12H5M3 17H5M19 7H21M19 12H21M19 17H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 8.5V5M15.5 12H19" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
    </svg>
  );
}

function AmmoIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 2H15V10L12 14L9 10V2Z"
        stroke="currentColor" strokeWidth="1.5"
        strokeLinejoin="round"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.2 : 0}
      />
      <rect x="9" y="14" width="6" height="8" rx="1"
        stroke="currentColor" strokeWidth="1.5"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.2 : 0}
      />
      <path d="M9 10H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function SessionIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="16" height="18" rx="2"
        stroke="currentColor" strokeWidth="1.5"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.1 : 0}
      />
      <path d="M9 2.5C9 2.5 9 4 9 4H15C15 4 15 2.5 15 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="9" y="2" width="6" height="3" rx="1" stroke="currentColor" strokeWidth="1"/>
      <path d="M8 10H16M8 14H16M8 18H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

const TABS: { id: NavView; label: string; Icon: React.FC<{ active: boolean }> }[] = [
  { id: 'home',     label: 'Home',     Icon: HomeIcon },
  { id: 'vault',    label: 'Vault',    Icon: VaultIcon },
  { id: 'arsenal',  label: 'Ammo',     Icon: AmmoIcon },
  { id: 'sessions', label: 'Sessions', Icon: SessionIcon },
];

import React from 'react';

export function MobileNav({
  currentView,
  onNavigateToHome,
  onNavigateToVault,
  onNavigateToArsenal,
  onNavigateToSessions,
}: MobileNavProps) {
  const handlers: Record<NavView, () => void> = {
    home:     onNavigateToHome,
    vault:    onNavigateToVault,
    arsenal:  onNavigateToArsenal,
    sessions: onNavigateToSessions,
  };

  // treat gun-detail as vault for active state
  const activeId = currentView === 'gun-detail' ? 'vault' : currentView;

  return (
    <div style={{
      backgroundColor: theme.surface,
      borderTop: `0.5px solid ${theme.border}`,
      display: 'flex',
      justifyContent: 'space-around',
      padding: `8px 0 calc(8px + env(safe-area-inset-bottom))`,
      flexShrink: 0,
      boxShadow: '0 -4px 20px rgba(0,0,0,0.4)',
    }}>
      {TABS.map(({ id, label, Icon }) => {
        const isActive = activeId === id;
        return (
          <button
            key={id}
            onClick={handlers[id]}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '6px 4px',
              backgroundColor: 'transparent',
              border: 'none',
              color: isActive ? theme.accent : theme.textMuted,
              cursor: 'pointer',
              transition: 'color 0.15s',
              position: 'relative',
            }}
          >
            {/* Active indicator dot */}
            {isActive && (
              <div style={{
                position: 'absolute',
                top: '0',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '20px',
                height: '2px',
                backgroundColor: theme.accent,
                borderRadius: '0 0 2px 2px',
              }} />
            )}
            <Icon active={isActive} />
            <span style={{
              fontSize: '9px',
              fontFamily: 'monospace',
              fontWeight: isActive ? 700 : 400,
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
            }}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
