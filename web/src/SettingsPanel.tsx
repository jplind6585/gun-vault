import { useState, useRef, useEffect } from 'react';
import { theme, isOutdoorMode, toggleOutdoorMode } from './theme';
import { exportVaultBackup, importVaultBackup, resetAllData } from './storage';
import { deleteAccountData } from './lib/sync';
import { useAuth } from './auth/AuthProvider';
import { supabase } from './lib/supabase';

const SETTINGS_KEY = 'lindcott_settings';

export interface AppSettings {
  units: 'imperial' | 'metric';
  cleanThresholdRounds: number;   // rounds since last clean before alert fires
  ammoLowThreshold: number;       // total rounds per caliber below which alert fires
  idleGunDays: number;            // days without a session before a gun is flagged idle
}

const DEFAULT_SETTINGS: AppSettings = {
  units: 'imperial',
  cleanThresholdRounds: 500,
  ammoLowThreshold: 200,
  idleGunDays: 60,
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
  onNavigateToLegal: () => void;
}

export function SettingsPanel({ onClose, onImport, onExport, onNavigateToLegal }: SettingsPanelProps) {
  const { user, isAnonymous, signOut } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(getSettings);
  const [upgradeEmail, setUpgradeEmail] = useState('');
  const [upgradeSent, setUpgradeSent] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');
  // deleteStep: 0=normal | 1=warning+download | 2=countdown confirm
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const [deleteCountdown, setDeleteCountdown] = useState(5);
  const [deleteWorking, setDeleteWorking] = useState(false);
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

  function startCountdown() {
    setDeleteStep(2);
    setDeleteCountdown(5);
    countdownRef.current = setInterval(() => {
      setDeleteCountdown(n => {
        if (n <= 1) { clearInterval(countdownRef.current!); return 0; }
        return n - 1;
      });
    }, 1000);
  }

  function cancelDelete() {
    setDeleteStep(0);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }

  async function confirmDelete() {
    if (deleteCountdown > 0 || deleteWorking) return;
    setDeleteWorking(true);
    try {
      await deleteAccountData();
    } catch { /* offline — continue anyway */ }
    await signOut().catch(() => {});
    resetAllData(); // clears localStorage + reloads
  }

  useEffect(() => () => { if (countdownRef.current) clearInterval(countdownRef.current); }, []);

  async function handleUpgrade(e: React.FormEvent) {
    e.preventDefault();
    if (!upgradeEmail.trim()) return;
    setUpgradeLoading(true);
    setUpgradeError('');
    const { error } = await supabase.auth.updateUser({ email: upgradeEmail.trim() });
    setUpgradeLoading(false);
    if (error) { setUpgradeError(error.message); } else { setUpgradeSent(true); }
  }

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

        {/* Appearance */}
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid ' + theme.border }}>
          <div style={sectionLabel}>APPEARANCE</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {([
              { key: false, label: 'DARK' },
              { key: true, label: 'LIGHT' },
            ] as const).map(({ key, label }) => (
              <button
                key={label}
                onClick={() => { if (isOutdoorMode() !== key) toggleOutdoorMode(); }}
                style={{
                  flex: 1, padding: '10px',
                  backgroundColor: isOutdoorMode() === key ? theme.accent : 'transparent',
                  border: '0.5px solid ' + (isOutdoorMode() === key ? theme.accent : theme.border),
                  borderRadius: '6px',
                  color: isOutdoorMode() === key ? theme.bg : theme.textSecondary,
                  fontFamily: 'monospace', fontSize: '11px', fontWeight: 700,
                  letterSpacing: '0.5px', cursor: 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Alert Thresholds */}
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid ' + theme.border }}>
          <div style={sectionLabel}>ALERT THRESHOLDS</div>
          {([
            { key: 'cleanThresholdRounds' as const, label: 'Cleaning interval', unit: 'rounds' },
            { key: 'ammoLowThreshold'     as const, label: 'Ammo low alert',    unit: 'rounds per caliber' },
            { key: 'idleGunDays'          as const, label: 'Idle gun alert',     unit: 'days without session' },
          ]).map(({ key, label, unit }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textSecondary }}>{label}</div>
                <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted }}>{unit}</div>
              </div>
              <input
                type="number"
                value={settings[key]}
                onChange={e => {
                  const v = parseInt(e.target.value);
                  if (!isNaN(v) && v > 0) update({ [key]: v });
                }}
                style={{
                  width: '72px', padding: '6px 8px', textAlign: 'right',
                  backgroundColor: theme.bg, border: `0.5px solid ${theme.border}`,
                  borderRadius: '4px', color: theme.textPrimary,
                  fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, outline: 'none',
                }}
              />
            </div>
          ))}
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
          <div style={sectionLabel}>ACCOUNT & PRIVACY</div>

          {deleteStep === 0 && (
            <>
              {/* Anonymous user — upgrade prompt */}
              {isAnonymous && !upgradeSent && (
                <div style={{
                  backgroundColor: `${theme.accent}0d`,
                  border: `0.5px solid ${theme.accent}40`,
                  borderRadius: '8px',
                  padding: '14px',
                  marginBottom: '14px',
                }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: theme.accent, letterSpacing: '0.5px', marginBottom: '6px' }}>
                    BACK UP YOUR DATA
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, lineHeight: 1.6, marginBottom: '12px' }}>
                    Your vault syncs privately. Add an email to access it from any device — no password needed.
                  </div>
                  <form onSubmit={handleUpgrade}>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={upgradeEmail}
                      onChange={e => setUpgradeEmail(e.target.value)}
                      autoCapitalize="off"
                      autoCorrect="off"
                      style={{
                        width: '100%', padding: '10px 12px', boxSizing: 'border-box',
                        backgroundColor: theme.bg, border: `0.5px solid ${theme.border}`,
                        borderRadius: '6px', color: theme.textPrimary,
                        fontFamily: 'monospace', fontSize: '12px', outline: 'none',
                        marginBottom: '8px',
                      }}
                    />
                    {upgradeError && (
                      <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.red, marginBottom: '8px' }}>
                        {upgradeError}
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={upgradeLoading || !upgradeEmail.trim()}
                      style={{
                        ...btnBase, width: '100%', flex: undefined,
                        backgroundColor: upgradeLoading || !upgradeEmail.trim() ? 'transparent' : theme.accent,
                        color: upgradeLoading || !upgradeEmail.trim() ? theme.textMuted : theme.bg,
                        borderColor: upgradeLoading || !upgradeEmail.trim() ? theme.border : theme.accent,
                      }}
                    >
                      {upgradeLoading ? 'SENDING...' : 'SECURE THIS ACCOUNT'}
                    </button>
                  </form>
                </div>
              )}

              {isAnonymous && upgradeSent && (
                <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginBottom: '12px', lineHeight: 1.6 }}>
                  Check <span style={{ color: theme.textSecondary }}>{upgradeEmail}</span> for a link to secure your account.
                </div>
              )}

              {/* Named account */}
              {!isAnonymous && user && (
                <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginBottom: '12px' }}>
                  {user.email
                    ? `Signed in as ${user.email}`
                    : `Signed in via ${user.app_metadata?.provider ?? 'SSO'}`}
                </div>
              )}

              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginBottom: '12px', lineHeight: 1.6 }}>
                Your data is stored locally on your device. Cloud sync is encrypted. You own your data.
              </div>

              {user && (
                <button
                  onClick={() => signOut()}
                  style={{ ...btnBase, width: '100%', flex: undefined, marginBottom: '8px' }}
                >
                  SIGN OUT
                </button>
              )}
              <button
                onClick={() => setDeleteStep(1)}
                style={{ ...btnBase, width: '100%', flex: undefined, color: theme.red, borderColor: 'rgba(255,107,107,0.3)' }}
              >
                DELETE ACCOUNT & ALL DATA
              </button>
            </>
          )}

          {deleteStep === 1 && (
            <div style={{
              backgroundColor: 'rgba(255,107,107,0.06)',
              border: '0.5px solid rgba(255,107,107,0.35)',
              borderRadius: '8px',
              padding: '16px',
            }}>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.red, fontWeight: 700, marginBottom: '10px' }}>
                THIS CANNOT BE UNDONE
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textSecondary, marginBottom: '16px', lineHeight: 1.7 }}>
                Deleting your account will permanently erase all firearms, sessions, ammo records, optics, and analyses — from this device and from cloud storage.
                {'\n\n'}We recommend downloading a backup before continuing.
              </div>
              <button
                onClick={exportVaultBackup}
                style={{ ...btnBase, width: '100%', flex: undefined, marginBottom: '10px' }}
              >
                DOWNLOAD DATA BACKUP (JSON)
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={cancelDelete} style={{ ...btnBase, flex: 1 }}>
                  CANCEL
                </button>
                <button
                  onClick={startCountdown}
                  style={{ ...btnBase, flex: 1, color: theme.red, borderColor: 'rgba(255,107,107,0.4)' }}
                >
                  CONTINUE →
                </button>
              </div>
            </div>
          )}

          {deleteStep === 2 && (
            <div style={{
              backgroundColor: 'rgba(255,107,107,0.08)',
              border: '0.5px solid rgba(255,107,107,0.5)',
              borderRadius: '8px',
              padding: '16px',
            }}>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.red, fontWeight: 700, marginBottom: '8px' }}>
                FINAL CONFIRMATION
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginBottom: '14px', lineHeight: 1.6 }}>
                Your account and all data will be permanently deleted. This action is irreversible.
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={cancelDelete} style={{ ...btnBase, flex: 1 }} disabled={deleteWorking}>
                  CANCEL
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteCountdown > 0 || deleteWorking}
                  style={{
                    ...btnBase, flex: 1,
                    backgroundColor: deleteCountdown === 0 && !deleteWorking ? theme.red : 'transparent',
                    color: deleteCountdown === 0 && !deleteWorking ? '#fff' : 'rgba(255,107,107,0.5)',
                    borderColor: 'rgba(255,107,107,0.4)',
                    cursor: deleteCountdown === 0 && !deleteWorking ? 'pointer' : 'default',
                  }}
                >
                  {deleteWorking ? 'DELETING...' : deleteCountdown > 0 ? `DELETE (${deleteCountdown})` : 'DELETE ACCOUNT'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Version + Legal */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>
            LINDCOTT ARMORY v1.0
          </div>
          <button
            onClick={() => { onClose(); onNavigateToLegal(); }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.5px',
              color: theme.textMuted, textDecoration: 'underline',
              padding: '2px 4px',
            }}
          >
            Terms of Service · Privacy Policy
          </button>
        </div>
      </div>
    </div>
  );
}
