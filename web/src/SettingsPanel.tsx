import { useState, useRef, useEffect } from 'react';
import { theme } from './theme';
import { exportVaultBackup, importVaultBackup, resetAllData } from './storage';

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
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteCountdown, setDeleteCountdown] = useState(5);
  const [restoreMsg, setRestoreMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function update(patch: Partial<AppSettings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
  }

  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  function startDeleteConfirm() {
    setDeleteConfirm(true);
    setDeleteCountdown(5);
    countdownRef.current = setInterval(() => {
      setDeleteCountdown(n => {
        if (n <= 1) {
          clearInterval(countdownRef.current!);
          return 0;
        }
        return n - 1;
      });
    }, 1000);
  }

  function cancelDelete() {
    setDeleteConfirm(false);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }

  useEffect(() => () => { if (countdownRef.current) clearInterval(countdownRef.current); }, []);

  async function handleRestoreFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreMsg(null);
    const result = await importVaultBackup(file);
    setRestoreMsg({ ok: result.success, text: result.message });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const btnBase: React.CSSProperties = {
    flex: 1,
    padding: '10px',
    border: '0.5px solid ' + theme.border,
    borderRadius: '6px',
    color: theme.textSecondary,
    fontFamily: 'monospace',
    fontSize: '11px',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    fontWeight: 600,
  };

  const sectionLabel: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '9px',
    letterSpacing: '1.2px',
    color: theme.textMuted,
    marginBottom: '10px',
    textTransform: 'uppercase' as const,
  };

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
          maxHeight: '88vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '0.5px solid ' + theme.border,
          position: 'sticky', top: 0,
          backgroundColor: theme.surface,
          zIndex: 1,
        }}>
          <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, letterSpacing: '1px', color: theme.textPrimary }}>
            SETTINGS
          </span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: theme.textMuted, fontFamily: 'monospace', fontSize: '18px', lineHeight: 1,
            padding: '4px',
          }}>
            ×
          </button>
        </div>

        {/* Units */}
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid ' + theme.border }}>
          <div style={sectionLabel}>UNITS</div>
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

        {/* Import Guns — CSV */}
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid ' + theme.border }}>
          <div style={sectionLabel}>IMPORT GUNS</div>
          <button onClick={onImport} style={btnBase}>
            IMPORT FROM CSV
          </button>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginTop: '8px' }}>
            Add firearms from a spreadsheet. Existing data is preserved.
          </div>
        </div>

        {/* Backup & Restore */}
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid ' + theme.border }}>
          <div style={sectionLabel}>BACKUP & RESTORE</div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <button
              onClick={exportVaultBackup}
              style={btnBase}
            >
              EXPORT BACKUP
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={btnBase}
            >
              RESTORE BACKUP
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleRestoreFile}
            style={{ display: 'none' }}
          />
          {restoreMsg && (
            <div style={{
              fontFamily: 'monospace', fontSize: '10px', marginTop: '6px',
              color: restoreMsg.ok ? theme.green : theme.red,
            }}>
              {restoreMsg.text}
            </div>
          )}
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginTop: '6px', lineHeight: 1.5 }}>
            Backup includes all guns, sessions, ammo, analyses, gear, and reloading data. Your data never leaves this device.
          </div>

          {/* Insurance export */}
          <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '0.5px solid ' + theme.border }}>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.8px', color: theme.textMuted, marginBottom: '8px' }}>
              INSURANCE EXPORT
            </div>
            <button onClick={onExport} style={btnBase}>
              EXPORT INSURANCE CLAIM
            </button>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginTop: '6px' }}>
              PDF-ready spreadsheet with values and serial numbers for your insurer.
            </div>
          </div>
        </div>

        {/* Privacy / Delete Account */}
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid ' + theme.border }}>
          <div style={sectionLabel}>PRIVACY</div>

          {!deleteConfirm ? (
            <>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginBottom: '12px', lineHeight: 1.6 }}>
                Lindcott Armory stores all data locally on your device. Nothing is sent to any server. You own your data — export or delete it at any time.
              </div>
              <button
                onClick={startDeleteConfirm}
                style={{
                  ...btnBase,
                  width: '100%',
                  flex: undefined,
                  color: theme.red,
                  borderColor: 'rgba(255,107,107,0.3)',
                }}
              >
                DELETE ALL DATA
              </button>
            </>
          ) : (
            <div style={{
              backgroundColor: 'rgba(255,107,107,0.08)',
              border: '0.5px solid rgba(255,107,107,0.4)',
              borderRadius: '8px',
              padding: '16px',
            }}>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.red, fontWeight: 700, marginBottom: '8px' }}>
                DELETE ALL VAULT DATA?
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginBottom: '14px', lineHeight: 1.6 }}>
                This will permanently delete all guns, sessions, ammo, and analyses. This cannot be undone. Export a backup first if you want to keep your data.
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={cancelDelete}
                  style={{ ...btnBase, flex: 1 }}
                >
                  CANCEL
                </button>
                <button
                  onClick={() => deleteCountdown === 0 && resetAllData()}
                  disabled={deleteCountdown > 0}
                  style={{
                    ...btnBase,
                    flex: 1,
                    backgroundColor: deleteCountdown === 0 ? theme.red : 'transparent',
                    color: deleteCountdown === 0 ? '#fff' : 'rgba(255,107,107,0.5)',
                    borderColor: 'rgba(255,107,107,0.4)',
                    cursor: deleteCountdown === 0 ? 'pointer' : 'default',
                  }}
                >
                  {deleteCountdown > 0 ? `DELETE (${deleteCountdown})` : 'CONFIRM DELETE'}
                </button>
              </div>
            </div>
          )}
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
