// More Menu — grid of all secondary tools
// Add new tools here as they get built; no nav changes needed
import React from 'react';
import { theme } from './theme';

interface ToolCard {
  id: string;
  emoji: string;
  label: string;
  sub: string;
  available: boolean;
  onPress: () => void;
}

interface MoreMenuProps {
  onNavigate: (view: string) => void;
}

export function MoreMenu({ onNavigate }: MoreMenuProps) {
  const tools: ToolCard[] = [
    {
      id: 'field-guide',
      emoji: '📖',
      label: 'Field Guide',
      sub: 'Encyclopedia',
      available: true,
      onPress: () => onNavigate('field-guide'),
    },
    {
      id: 'caliber',
      emoji: '🔴',
      label: 'Calibers',
      sub: 'Cartridge database',
      available: true,
      onPress: () => onNavigate('caliber'),
    },
    {
      id: 'ballistics',
      emoji: '📐',
      label: 'Ballistics',
      sub: 'Drop calculator',
      available: true,
      onPress: () => onNavigate('ballistics'),
    },
    {
      id: 'training',
      emoji: '📋',
      label: 'Training',
      sub: 'Drill tracker',
      available: true,
      onPress: () => onNavigate('training'),
    },
    {
      id: 'reloading',
      emoji: '⚗️',
      label: 'Reloading',
      sub: 'Bench reference',
      available: true,
      onPress: () => onNavigate('reloading'),
    },
    {
      id: 'gear',
      emoji: '🎒',
      label: 'Gear Locker',
      sub: 'Accessories',
      available: true,
      onPress: () => onNavigate('gear'),
    },
    {
      id: 'wishlist',
      emoji: '⭐',
      label: 'Wishlist',
      sub: 'Want list',
      available: true,
      onPress: () => onNavigate('wishlist'),
    },
    {
      id: 'optics',
      emoji: '🔭',
      label: 'Optics',
      sub: 'Glass tracker',
      available: true,
      onPress: () => onNavigate('optics'),
    },
    // Future placeholders — remove 'coming soon' as they get built:
    {
      id: 'gunsmithing',
      emoji: '🔩',
      label: 'Gunsmithing',
      sub: 'Coming soon',
      available: false,
      onPress: () => {},
    },
    {
      id: 'events',
      emoji: '🏆',
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
              cursor: tool.available ? 'pointer' : 'default',
              opacity: tool.available ? 1 : 0.4,
              WebkitTapHighlightColor: 'transparent',
              outline: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              transition: 'border-color 0.15s',
            }}
          >
            <span style={{ fontSize: '28px', lineHeight: 1 }}>{tool.emoji}</span>
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
