import { useState, useEffect } from 'react';
import { theme } from './theme';
import { getObProgress, dismissObChecklist, markObAction } from './onboardingProgress';

interface Props {
  isPro: boolean;
  onNavigate: (view: string) => void;
  onAddGun: () => void;
  onAddAmmo: () => void;
}

export function OnboardingChecklist({ isPro, onNavigate, onAddGun, onAddAmmo }: Props) {
  const [progress, setProgress] = useState(getObProgress);
  const [allDone, setAllDone] = useState(false);
  const [hiding, setHiding] = useState(false);

  // Re-read progress whenever an ob-progress event fires
  useEffect(() => {
    function onUpdate() {
      const p = getObProgress();
      setProgress(p);
      if (p.gunAdded && p.sessionLogged && p.ammoAdded && p.aiUsed) {
        // Brief celebration then hide
        setAllDone(true);
        setTimeout(() => setHiding(true), 1800);
      }
    }
    window.addEventListener('ob-progress', onUpdate);
    return () => window.removeEventListener('ob-progress', onUpdate);
  }, []);

  if (hiding || progress.dismissed) return null;

  const items = [
    {
      key: 'gun' as const,
      done: progress.gunAdded,
      label: 'Add your first gun',
      sub: 'Open the vault and register a firearm',
      action: () => onAddGun(),
    },
    {
      key: 'session' as const,
      done: progress.sessionLogged,
      label: 'Log a range session',
      sub: 'Record rounds fired, drill results, or notes',
      action: () => onNavigate('session-log'),
    },
    {
      key: 'ammo' as const,
      done: progress.ammoAdded,
      label: 'Track your ammo',
      sub: 'Add a lot to your inventory',
      action: () => onAddAmmo(),
    },
    {
      key: 'ai' as const,
      done: progress.aiUsed,
      label: 'Ask the AI Assistant',
      sub: isPro ? 'Get personalized recommendations' : 'Pro feature — upgrade to unlock',
      pro: !isPro,
      action: () => {
        if (!isPro) {
          window.dispatchEvent(new CustomEvent('show_upgrade_modal', { detail: { reason: 'AI Assistant' } }));
        } else {
          onNavigate('assistant');
        }
      },
    },
  ];

  const doneCount = items.filter(i => i.done).length;
  const progressPct = Math.round((doneCount / items.length) * 100);

  if (allDone) {
    return (
      <div style={{
        backgroundColor: theme.surface,
        border: `0.5px solid ${theme.green}30`,
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '12px',
        textAlign: 'center',
      }}>
        <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.green, fontWeight: 700, letterSpacing: '0.5px' }}>
          You're all set.
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginTop: '4px' }}>
          Explore the rest of the armory from the menu.
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: theme.surface,
      border: `0.5px solid ${theme.border}`,
      borderRadius: '8px',
      padding: '14px 16px',
      marginBottom: '12px',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '1.2px', color: theme.textMuted, textTransform: 'uppercase' }}>
          Get Started
        </div>
        <button
          onClick={() => { dismissObChecklist(); setHiding(true); }}
          style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', color: theme.textMuted, fontFamily: 'monospace', fontSize: '14px', lineHeight: 1 }}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>

      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '12px' }}>
        {items.map(item => (
          <button
            key={item.key}
            onClick={item.done ? undefined : item.action}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px 4px',
              background: 'none', border: 'none',
              textAlign: 'left', cursor: item.done ? 'default' : 'pointer',
              borderRadius: '4px',
              width: '100%',
            }}
          >
            {/* Checkbox */}
            <div style={{
              width: '18px', height: '18px', flexShrink: 0,
              borderRadius: '4px',
              border: `1.5px solid ${item.done ? theme.green : theme.border}`,
              backgroundColor: item.done ? theme.green : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {item.done && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l3 3 5-6" stroke={theme.bg} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'monospace', fontSize: '12px',
                color: item.done ? theme.textMuted : theme.textPrimary,
                textDecoration: item.done ? 'line-through' : 'none',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                {item.label}
                {item.pro && !item.done && (
                  <span style={{
                    fontSize: '8px', letterSpacing: '0.8px', fontWeight: 700,
                    color: theme.accent, border: `0.5px solid ${theme.accent}`,
                    borderRadius: '3px', padding: '1px 4px',
                  }}>
                    PRO
                  </span>
                )}
              </div>
              {!item.done && (
                <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginTop: '1px' }}>
                  {item.sub}
                </div>
              )}
            </div>

            {/* Arrow for incomplete */}
            {!item.done && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={theme.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M9 18l6-6-6-6"/>
              </svg>
            )}
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted }}>
            {doneCount} of {items.length} complete
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted }}>
            {progressPct}%
          </div>
        </div>
        <div style={{ height: '3px', backgroundColor: theme.border, borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${progressPct}%`,
            backgroundColor: theme.accent,
            borderRadius: '2px',
            transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

    </div>
  );
}
