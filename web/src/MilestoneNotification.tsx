// MilestoneNotification — home screen card shown when a new milestone is earned
// Shows the most recently earned unseen milestone, one at a time.
// Dismissed via × — never reappears for that milestone.

import { useState, useEffect } from 'react';
import { theme } from './theme';
import { useShooterProfile } from './useShooterProfile';
import {
  getUnseenMilestones,
  markMilestoneSeen,
  MILESTONE_CATEGORY,
  MILESTONE_DEFINITIONS,
} from './milestones';
import type { MilestoneCategory } from './milestones';
import type { ShooterMilestone } from './shooterProfile';

const CATEGORY_COLOR: Record<MilestoneCategory, string> = {
  commitment: theme.accent,
  range:      theme.blue,
  collection: theme.green,
  craft:      theme.orange,
};

const CATEGORY_LABEL: Record<MilestoneCategory, string> = {
  commitment: 'Commitment',
  range:      'Range',
  collection: 'Collection',
  craft:      'Craft',
};

function getDescription(id: string): string {
  return MILESTONE_DEFINITIONS.find(d => d.id === id)?.description ?? '';
}

export function MilestoneNotification() {
  const { profile } = useShooterProfile();
  const [current, setCurrent] = useState<ShooterMilestone | null>(null);

  useEffect(() => {
    if (!profile?.milestones?.length) return;
    // Sort by awardedAt desc — show most recently earned first
    const unseen = getUnseenMilestones(
      [...profile.milestones].sort((a, b) => b.awardedAt.localeCompare(a.awardedAt))
    );
    setCurrent(unseen[0] ?? null);
  }, [profile]);

  function dismiss() {
    if (!current) return;
    markMilestoneSeen(current.id);
    // Move to next unseen if any
    if (!profile?.milestones) return;
    const unseen = getUnseenMilestones(
      [...profile.milestones].sort((a, b) => b.awardedAt.localeCompare(a.awardedAt))
    ).filter(m => m.id !== current.id);
    setCurrent(unseen[0] ?? null);
  }

  if (!current) return null;

  const cat = MILESTONE_CATEGORY[current.id] ?? 'commitment';
  const accentColor = CATEGORY_COLOR[cat];
  const description = getDescription(current.id);

  return (
    <div style={{
      marginBottom: '10px',
      backgroundColor: theme.surface,
      border: `0.5px solid ${theme.border}`,
      borderLeft: `3px solid ${accentColor}`,
      borderRadius: '6px',
      padding: '12px 14px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
    }}>
      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'monospace', fontSize: '8px', fontWeight: 700,
          letterSpacing: '1.5px', color: accentColor,
          textTransform: 'uppercase', marginBottom: '5px',
        }}>
          {CATEGORY_LABEL[cat]} milestone
        </div>
        <div style={{
          fontFamily: 'monospace', fontSize: '9px', fontWeight: 700,
          letterSpacing: '1.2px', color: theme.textPrimary,
          textTransform: 'uppercase', marginBottom: '4px',
        }}>
          {current.label}
        </div>
        {description && (
          <div style={{
            fontFamily: 'monospace', fontSize: '10px',
            color: theme.textMuted, lineHeight: 1.5,
          }}>
            {description}
          </div>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={dismiss}
        style={{
          background: 'none', border: 'none',
          color: theme.textMuted, cursor: 'pointer',
          fontFamily: 'monospace', fontSize: '16px',
          lineHeight: 1, padding: '0 2px', flexShrink: 0,
        }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
