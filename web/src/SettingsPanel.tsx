import { useState, useEffect } from 'react';
import { theme } from './theme';

const SETTINGS_KEY = 'lindcott_settings';

export interface AppSettings {
  units: 'imperial' | 'metric';
}

const DEFAULT_SETTINGS: AppSettings = {
  units: 'imperial',
};

export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_SETTINGS;
}

export function saveSettings(s: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

interface SettingsPanelProps {
  onClose: () => void;
  onImport: () => void;
  onExport: () => void;
}

export function SettingsPanel({ onClose, onImport, onExport }: SettingsPanelProps) {
  const [settings, setSettings] = useState<AppSettings>(getSettings);

  function update(patch: Partial<AppSettings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
  }

  // Close on backdrop tap
  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 3000,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'flex-end',
      }}
    >
      <div
        style={{
          width: '100%',
          backgroundColor: theme.surface,
          borderRadius: '12px 12px 0 0',
          padding: '0 0 env(safe-area-inset-bottom)',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '0.5px solid ' + theme.border,
        }}>
          <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, letterSpacing: '1px', color: theme.textPrimary }}>
            SETTINGS
          </span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: theme.textMuted, fontFamily: 'monospace', fontSize: '18px', lineHeight: 1,
            padding: '4px',
          }}>
            x
          </button>
        </div>

        {/* Units */}
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid ' + theme.border }}>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '1.2px', color: theme.textMuted, marginBottom: '10px' }}>
            UNITS
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['imperial', 'metric'] as const).map(u => (
              <button
                key={u}
                onClick={() => update({ units: u })}
                style={{
                  flex: 1, padding: '10px',
                  backgroundColor: settings.units === u ? theme.accent : 'transparent',
                  border: '0.5px solid ' + (settings.units === u ? theme.accent : theme.border),
                  borderRadius: '6px',
                  color: settings.units === u ? theme.bg : theme.textSecondary,
                  fontFamily: 'monospace', fontSize: '11px', fontWeight: 700,
                  letterSpacing: '0.5px', cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                {u}
              </button>
            ))}
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginTop: '8px' }}>
            Affects target analysis distances and measurement displays
          </div>
        </div>

        {/* Data */}
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid ' + theme.border }}>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '1.2px', color: theme.textMuted, marginBottom: '10px' }}>
            DATA
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onImport} style={{
              flex: 1, padding: '10px',
              backgroundColor: 'transparent',
              border: '0.5px solid ' + theme.border,
              borderRadius: '6px',
              color: theme.textSecondary,
              fontFamily: 'monospace', fontSize: '11px',
              letterSpacing: '0.5px', cursor: 'pointer',
            }}>
              IMPORT
            </button>
            <button onClick={onExport} style={{
              flex: 1, padding: '10px',
              backgroundColor: 'transparent',
              border: '0.5px solid ' + theme.border,
              borderRadius: '6px',
              color: theme.textSecondary,
              fontFamily: 'monospace', fontSize: '11px',
              letterSpacing: '0.5px', cursor: 'pointer',
            }}>
              EXPORT
            </button>
          </div>
        </div>

        {/* Version */}
        <div style={{ padding: '16px 20px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, textAlign: 'center' }}>
            LINDCOTT ARMORY v1.0
          </div>
        </div>
      </div>
    </div>
  );
}
