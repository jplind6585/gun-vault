// Shooter Profile Card — home page summary of the shooter's profile
// Shows personas, top skills, active goals, accuracy highlights.
// Self-contained: loads its own profile via useShooterProfile.

import { useMemo } from 'react';
import { theme } from './theme';
import { useShooterProfile } from './useShooterProfile';
import { getAllGuns } from './storage';
import type { SkillDomain, SkillLevel, PersonaType, ShooterGoal } from './shooterProfile';

interface Props {
  onSetupProfile?: () => void;   // triggers onboarding overlay
  onEditGoals?: () => void;       // same — re-opens onboarding
}

// ── Display labels ─────────────────────────────────────────────────────────────

const PERSONA_LABELS: Record<PersonaType, string> = {
  precision_shooter:    'Precision',
  defensive_carrier:    'Defensive Carry',
  competitive_shooter:  'Competition',
  hunter:               'Hunter',
  collector:            'Collector',
  reloader:             'Reloader',
  new_shooter:          'New Shooter',
  recreational_plinker: 'Recreational',
  homesteader:          'Homesteader',
  armorer:              'Armorer',
  educator_instructor:  'Instructor',
  minimalist:           'Minimalist',
  nostalgia_shooter:    'Nostalgia',
  content_creator:      'Content Creator',
  nfa_enthusiast:       'NFA',
};

const DOMAIN_LABELS: Partial<Record<SkillDomain, string>> = {
  fundamentals:           'Fundamentals',
  dry_fire:               'Dry Fire',
  precision_rifle:        'Precision Rifle',
  pistol_craft:           'Pistol Craft',
  shotgun_field:          'Shotgun',
  competition:            'Competition',
  home_defense_tactical:  'Home Defense',
  hunting_precision:      'Precision Hunting',
  hunting_field:          'Field Hunting',
  reloading:              'Reloading',
  ballistics:             'Ballistics',
  optics:                 'Optics',
  gunsmithing_action:     'Gunsmithing — Action',
  gunsmithing_metal:      'Gunsmithing — Metal',
  gunsmithing_stock:      'Gunsmithing — Stock',
  suppressor_nfa:         'Suppressors / NFA',
  collecting:             'Collecting',
  historical_firearms:    'Historical Firearms',
  safety_opsec:           'Safety & Storage',
  instruction:            'Instruction',
  performance_mindset:    'Mindset',
  maintenance:            'Maintenance',
  preparedness:           'Preparedness',
};

const LEVEL_ORDER: Record<string, number> = { expert: 4, advanced: 3, intermediate: 2, beginner: 1, none: 0 };

// ── Sub-components ─────────────────────────────────────────────────────────────

function SkillDots({ level }: { level: SkillLevel }) {
  const filled = LEVEL_ORDER[level] ?? 0;
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      {[1, 2, 3, 4].map(n => (
        <div key={n} style={{
          width: 6, height: 6, borderRadius: '50%',
          backgroundColor: n <= filled ? theme.accent : theme.border,
        }} />
      ))}
    </div>
  );
}

function PersonaChip({ label }: { label: string }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 8px',
      backgroundColor: `${theme.accent}18`,
      border: `0.5px solid ${theme.accent}44`,
      borderRadius: '3px',
      fontFamily: 'monospace', fontSize: '10px',
      fontWeight: 700, color: theme.accent,
      letterSpacing: '0.3px',
    }}>
      {label}
    </span>
  );
}

function GoalRow({ goal }: { goal: ShooterGoal }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 8,
      paddingLeft: 2,
    }}>
      <div style={{
        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
        backgroundColor: theme.accent, marginTop: 5,
      }} />
      <span style={{
        fontFamily: 'monospace', fontSize: '11px',
        color: theme.textSecondary, lineHeight: 1.5,
      }}>
        {goal.text}
      </span>
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────

function IconSparkle() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" stroke={theme.accent} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M19 16L19.75 19L22 19.75L19.75 20.5L19 23L18.25 20.5L16 19.75L18.25 19L19 16Z" stroke={theme.accent} strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ShooterProfileCard({ onSetupProfile, onEditGoals }: Props) {
  const { profile } = useShooterProfile();
  const guns = useMemo(() => getAllGuns(), []);
  const gunNameById = useMemo(() =>
    new Map(guns.map(g => [g.id, g.displayName || `${g.make} ${g.model}`])),
  [guns]);

  const card: React.CSSProperties = {
    backgroundColor: theme.surface,
    border: `0.5px solid ${theme.border}`,
    borderRadius: '8px',
    padding: '14px 16px',
    marginBottom: '10px',
  };

  const sectionLabel: React.CSSProperties = {
    fontFamily: 'monospace', fontSize: '9px',
    letterSpacing: '1.2px', color: theme.textMuted,
    textTransform: 'uppercase', marginBottom: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  };

  // ── Not enough data yet ────────────────────────────────────────────────────

  if (!profile || profile.totalSessions < 3) return null;

  // ── Onboarding not yet complete ────────────────────────────────────────────

  if (!profile.onboardingCompleted) {
    return (
      <div style={card}>
        <div style={sectionLabel}>
          <span>SHOOTER PROFILE</span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted, lineHeight: 1.5 }}>
            You've logged 3 sessions — time to set up your profile. Takes 2 minutes.
          </div>
          {onSetupProfile && (
            <button
              onClick={onSetupProfile}
              style={{
                flexShrink: 0, padding: '8px 12px',
                backgroundColor: theme.accent,
                border: 'none', borderRadius: '4px',
                color: '#07071a', fontFamily: 'monospace',
                fontSize: '10px', fontWeight: 700,
                letterSpacing: '0.5px', cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              SET UP
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Full profile card ──────────────────────────────────────────────────────

  const topPersonas = profile.primaryPersonas.slice(0, 3);

  const topSkills = profile.skills
    .filter(s => s.level !== 'none' && s.level !== 'beginner')
    .sort((a, b) => (LEVEL_ORDER[b.level] ?? 0) - (LEVEL_ORDER[a.level] ?? 0))
    .slice(0, 5);

  const activeGoals = profile.goals.filter(g => g.status === 'active').slice(0, 4);

  const accuracyHighlights = profile.accuracyProfiles
    .filter(p => (p.confidence === 'high' || p.confidence === 'medium') && p.medianMOA !== undefined)
    .sort((a, b) => {
      const confOrder: Record<string, number> = { high: 2, medium: 1 };
      return (confOrder[b.confidence] ?? 0) - (confOrder[a.confidence] ?? 0);
    })
    .slice(0, 2);

  const hasContent = topPersonas.length > 0 || topSkills.length > 0 || activeGoals.length > 0;
  if (!hasContent) return null;

  return (
    <div style={card}>
      {/* Header row */}
      <div style={sectionLabel}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconSparkle />
          SHOOTER PROFILE
        </span>
        {onEditGoals && (
          <button
            onClick={onEditGoals}
            style={{
              background: 'none', border: 'none',
              color: theme.textMuted, fontSize: '10px',
              fontFamily: 'monospace', cursor: 'pointer',
              padding: '0 2px', letterSpacing: '0.3px',
            }}
          >
            Edit goals
          </button>
        )}
      </div>

      {/* Personas */}
      {topPersonas.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          {topPersonas.map(p => (
            <PersonaChip key={p.type} label={PERSONA_LABELS[p.type] ?? p.type} />
          ))}
        </div>
      )}

      {/* Skills */}
      {topSkills.length > 0 && (
        <div style={{ marginBottom: activeGoals.length > 0 || accuracyHighlights.length > 0 ? 14 : 0 }}>
          <div style={{
            fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted,
            letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8,
          }}>
            Top Skills
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {topSkills.map(skill => (
              <div key={skill.domain} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{
                  fontFamily: 'monospace', fontSize: '11px', color: theme.textSecondary,
                }}>
                  {DOMAIN_LABELS[skill.domain] ?? skill.domain.replace(/_/g, ' ')}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontFamily: 'monospace', fontSize: '9px',
                    color: theme.textMuted, textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                  }}>
                    {skill.level}
                  </span>
                  <SkillDots level={skill.level} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goals */}
      {activeGoals.length > 0 && (
        <div style={{ marginBottom: accuracyHighlights.length > 0 ? 14 : 0 }}>
          <div style={{
            fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted,
            letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8,
          }}>
            Active Goals
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {activeGoals.map(g => <GoalRow key={g.id} goal={g} />)}
          </div>
        </div>
      )}

      {/* Accuracy */}
      {accuracyHighlights.length > 0 && (
        <div>
          <div style={{
            fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted,
            letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8,
          }}>
            Accuracy
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {accuracyHighlights.map(ap => {
              return (
                <div key={ap.gunId} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textSecondary }}>
                    {gunNameById.get(ap.gunId) ?? ap.gunId}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: theme.textPrimary }}>
                      {ap.medianMOA?.toFixed(1)} MOA
                    </span>
                    <span style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted }}>
                      ({ap.sessionCount} sessions)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
