// GoalQuestion — shown once after account creation, before WelcomeScreen
// Multi-select, weighted lightly in profile inference.

import { useState } from 'react';
import { theme } from './theme';

const GOAL_QUESTION_KEY = 'lindcott_initial_goals';

export type InitialGoal =
  | 'improve_skills'
  | 'track_collection'
  | 'stay_ready'
  | 'hunt'
  | 'compete'
  | 'not_sure';

export interface InitialGoalAnswer {
  goals: InitialGoal[];
  answeredAt: string;
}

export function getInitialGoalAnswer(): InitialGoalAnswer | null {
  try {
    const raw = localStorage.getItem(GOAL_QUESTION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveInitialGoalAnswer(goals: InitialGoal[]) {
  localStorage.setItem(GOAL_QUESTION_KEY, JSON.stringify({ goals, answeredAt: new Date().toISOString() }));
}

export function hasAnsweredGoalQuestion(): boolean {
  return !!localStorage.getItem(GOAL_QUESTION_KEY);
}

const OPTIONS: { key: InitialGoal; label: string; sub: string }[] = [
  { key: 'improve_skills',    label: 'Improve my skills',     sub: 'Fundamentals, accuracy, drills, training' },
  { key: 'track_collection',  label: 'Track my collection',   sub: 'Records, values, history, condition' },
  { key: 'stay_ready',        label: 'Stay ready',            sub: 'Home defense, carry, preparedness' },
  { key: 'hunt',              label: 'Hunt',                  sub: 'Seasons, loads, field performance' },
  { key: 'compete',           label: 'Compete',               sub: 'USPSA, PRS, 3-gun, matches' },
  { key: 'not_sure',          label: 'Not sure yet',          sub: 'Just exploring' },
];

interface Props {
  onComplete: () => void;
}

export function GoalQuestion({ onComplete }: Props) {
  // Multi-select state — not_sure is exclusive
  const [selected, setSelected] = useState<Set<InitialGoal>>(new Set());

  function toggle(key: InitialGoal) {
    setSelected(prev => {
      const next = new Set(prev);
      if (key === 'not_sure') {
        // not_sure is exclusive
        if (next.has('not_sure')) { next.delete('not_sure'); } else { next.clear(); next.add('not_sure'); }
        return next;
      }
      // Selecting a real goal clears not_sure
      next.delete('not_sure');
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function handleContinue() {
    const goals = selected.size === 0 ? (['not_sure'] as InitialGoal[]) : Array.from(selected);
    saveInitialGoalAnswer(goals);
    onComplete();
  }

  const hasSelection = selected.size > 0;

  return (
    <div style={{
      minHeight: '100dvh', backgroundColor: theme.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px 48px',
    }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>

        {/* Wordmark */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', fontWeight: 700, letterSpacing: '4px', color: theme.accent, marginBottom: '4px' }}>
            LINDCOTT
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 700, letterSpacing: '3px', color: theme.textPrimary }}>
            ARMORY
          </div>
          <div style={{ width: '32px', height: '1px', backgroundColor: theme.accent, margin: '10px auto 0' }} />
        </div>

        {/* Question */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '15px', fontWeight: 700, color: theme.textPrimary, letterSpacing: '0.5px', marginBottom: '6px' }}>
            What brings you here?
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted, lineHeight: 1.6 }}>
            Pick everything that fits — we'll personalize the app around your goals over time.
          </div>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
          {OPTIONS.map(({ key, label, sub }) => {
            const active = selected.has(key);
            return (
              <button
                key={key}
                onClick={() => toggle(key)}
                style={{
                  width: '100%', padding: '14px 16px',
                  backgroundColor: active ? `${theme.accent}12` : 'transparent',
                  border: `0.5px solid ${active ? theme.accent : theme.border}`,
                  borderRadius: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'border-color 0.1s, background-color 0.1s',
                }}
              >
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: active ? 700 : 400, color: active ? theme.textPrimary : theme.textSecondary, letterSpacing: '0.3px' }}>
                    {label}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginTop: '2px' }}>
                    {sub}
                  </div>
                </div>
                <div style={{
                  width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0, marginLeft: '12px',
                  border: `1.5px solid ${active ? theme.accent : theme.border}`,
                  backgroundColor: active ? theme.accent : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.1s',
                }}>
                  {active && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l3 3 5-6" stroke={theme.bg} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* CTA */}
        <button
          onClick={handleContinue}
          style={{
            width: '100%', padding: '15px',
            backgroundColor: hasSelection ? theme.accent : theme.surface,
            border: `0.5px solid ${hasSelection ? theme.accent : theme.border}`,
            borderRadius: '8px',
            color: hasSelection ? theme.bg : theme.textMuted,
            fontFamily: 'monospace', fontSize: '12px', fontWeight: 700,
            letterSpacing: '1px', cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {hasSelection ? 'CONTINUE' : 'SKIP FOR NOW'}
        </button>

      </div>
    </div>
  );
}

