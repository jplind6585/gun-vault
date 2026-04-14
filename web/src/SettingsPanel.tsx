import { useState, useRef, useEffect } from 'react';
import { theme, isOutdoorMode, toggleOutdoorMode } from './theme';
import { exportVaultBackup, importVaultBackup, resetAllData, getAllGuns } from './storage';
import { deleteAccountData } from './lib/sync';
import { useAuth } from './auth/AuthProvider';
import { supabase } from './lib/supabase';

const SETTINGS_KEY = 'lindcott_settings';
const DISMISSED_SUGGESTIONS_KEY = 'lindcott_dismissed_suggestions';

export interface AppSettings {
  // Appearance
  units: 'imperial' | 'metric';
  currency: 'USD' | 'GBP' | 'EUR' | 'CAD' | 'AUD';
  // Alerts
  cleaningAlerts: boolean;
  cleanThresholdRounds: number;
  idleGunAlerts: boolean;
  idleGunDays: number;
  ammoAlerts: boolean;
  ammoLowThreshold: number;
  sessionStreakNudges: boolean;
  // Ammo tracking
  ammoLowMode: 'fixed' | 'smart';
  ammoDaysOfSupply: number;
  trackAmmoCost: boolean;
  // Home screen
  showCollectionValue: boolean;
  showShooterProfile: boolean;
  showRangeInsights: boolean;
  // AI
  aiResponseStyle: 'brief' | 'detailed';
  proactiveInsights: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  units: 'imperial',
  currency: 'USD',
  cleaningAlerts: true,
  cleanThresholdRounds: 500,
  idleGunAlerts: true,
  idleGunDays: 60,
  ammoAlerts: true,
  ammoLowThreshold: 200,
  sessionStreakNudges: false,
  ammoLowMode: 'fixed',
  ammoDaysOfSupply: 30,
  trackAmmoCost: false,
  showCollectionValue: true,
  showShooterProfile: true,
  showRangeInsights: true,
  aiResponseStyle: 'brief',
  proactiveInsights: false,
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

function getDismissedSuggestions(): string[] {
  try { return JSON.parse(localStorage.getItem(DISMISSED_SUGGESTIONS_KEY) || '[]'); } catch { return []; }
}
function dismissSuggestion(id: string) {
  const current = getDismissedSuggestions();
  if (!current.includes(id)) localStorage.setItem(DISMISSED_SUGGESTIONS_KEY, JSON.stringify([...current, id]));
}

interface Suggestion { id: string; text: string; action?: { label: string; fn: () => void }; }

function getActiveSuggestion(settings: AppSettings): Suggestion | null {
  const dismissed = getDismissedSuggestions();

  // Suggest smart ammo mode once user has real usage history
  const sessionCount = (() => { try { return (JSON.parse(localStorage.getItem('gunvault_sessions') || '[]') as unknown[]).length; } catch { return 0; } })();
  if (settings.ammoLowMode === 'fixed' && sessionCount >= 15 && !dismissed.includes('smart-ammo')) {
    return {
      id: 'smart-ammo',
      text: 'You have enough range history to use smart ammo alerts — set a days-of-supply target instead of a fixed count.',
      action: { label: 'Switch to Smart', fn: () => {} }, // caller handles
    };
  }

  return null;
}

interface SettingsPanelProps {
  onClose: () => void;
  onImport: () => void;
  onExport: () => void;
  onNavigateToLegal: () => void;
  onFeedbackOpen: () => void;
}

// ── Accordion section wrapper ─────────────────────────────────────────────────
function Section({
  id, label, open, onToggle, children,
}: {
  id: string; label: string; open: boolean; onToggle: (id: string) => void; children: React.ReactNode;
}) {
  const sectionLabel: React.CSSProperties = {
    fontFamily: 'monospace', fontSize: '9px', letterSpacing: '1.2px',
    color: theme.textMuted, textTransform: 'uppercase' as const,
  };
  return (
    <div style={{ borderBottom: '0.5px solid ' + theme.border }}>
      <button
        onClick={() => onToggle(id)}
        style={{
          width: '100%', padding: '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={sectionLabel}>{label}</span>
        <span style={{ color: theme.textMuted, fontSize: '14px', lineHeight: 1, transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'rotate(0)' }}>
          ▾
        </span>
      </button>
      {open && (
        <div style={{ padding: '0 20px 16px' }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ── Toggle row ────────────────────────────────────────────────────────────────
function ToggleRow({ label, sub, value, onChange }: { label: string; sub?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
      <div>
        <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textSecondary }}>{label}</div>
        {sub && <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginTop: '2px' }}>{sub}</div>}
      </div>
      <div
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        style={{
          width: '40px', height: '22px', borderRadius: '11px',
          backgroundColor: value ? theme.accent : theme.border,
          position: 'relative', cursor: 'pointer', flexShrink: 0,
          transition: 'background-color 0.15s', userSelect: 'none',
        }}
      >
        <div style={{
          position: 'absolute', top: '3px',
          left: value ? '21px' : '3px',
          width: '16px', height: '16px', borderRadius: '50%',
          backgroundColor: value ? theme.bg : theme.textMuted,
          transition: 'left 0.15s',
        }} />
      </div>
    </div>
  );
}

// ── Number input row ──────────────────────────────────────────────────────────
function NumberRow({ label, sub, value, onChange, min = 1 }: { label: string; sub?: string; value: number; onChange: (v: number) => void; min?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
      <div>
        <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textSecondary }}>{label}</div>
        {sub && <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginTop: '2px' }}>{sub}</div>}
      </div>
      <input
        type="number"
        value={value}
        min={min}
        onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= min) onChange(v); }}
        style={{
          width: '72px', padding: '6px 8px', textAlign: 'right',
          backgroundColor: theme.bg, border: `0.5px solid ${theme.border}`,
          borderRadius: '4px', color: theme.textPrimary,
          fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, outline: 'none',
        }}
      />
    </div>
  );
}

// ── Segmented control ─────────────────────────────────────────────────────────
function SegmentedControl<T extends string>({ options, value, onChange }: { options: { key: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      {options.map(o => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          style={{
            flex: 1, padding: '9px 6px',
            backgroundColor: value === o.key ? theme.accent : 'transparent',
            border: '0.5px solid ' + (value === o.key ? theme.accent : theme.border),
            borderRadius: '6px',
            color: value === o.key ? theme.bg : theme.textSecondary,
            fontFamily: 'monospace', fontSize: '10px', fontWeight: 700,
            letterSpacing: '0.5px', cursor: 'pointer', textTransform: 'uppercase' as const,
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function SettingsPanel({ onClose, onImport, onExport, onNavigateToLegal, onFeedbackOpen }: SettingsPanelProps) {
  const { user, isAnonymous, signOut } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(getSettings);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [upgradeEmail, setUpgradeEmail] = useState('');
  const [upgradeSent, setUpgradeSent] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const [deleteCountdown, setDeleteCountdown] = useState(5);
  const [deleteWorking, setDeleteWorking] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [dismissedSuggestion, setDismissedSuggestion] = useState(false);
  const [claudeKey, setClaudeKey] = useState(() => localStorage.getItem('gunvault_claude_key') || '');
  const [showExportSheet, setShowExportSheet] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeSuggestion = dismissedSuggestion ? null : getActiveSuggestion(settings);

  function update(patch: Partial<AppSettings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
  }

  function toggleSection(id: string) {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
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
    try { await deleteAccountData(); } catch {}
    await signOut().catch(() => {});
    resetAllData();
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

  function saveClaudeKey(key: string) {
    setClaudeKey(key);
    if (key.trim()) localStorage.setItem('gunvault_claude_key', key.trim());
    else localStorage.removeItem('gunvault_claude_key');
  }

  function exportGunsCSV() {
    const guns = getAllGuns();
    const headers = ['Make', 'Model', 'Caliber', 'Serial Number', 'Acquired Date', 'Acquired Price', 'Condition', 'Status', 'Round Count', 'Notes'];
    const escapeCSV = (val: string | number | undefined | null) => {
      if (val == null) return '';
      const s = String(val);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    };
    const rows = guns.map(g => [
      escapeCSV(g.make),
      escapeCSV(g.model),
      escapeCSV(g.caliber),
      escapeCSV(g.serialNumber),
      escapeCSV(g.acquiredDate),
      escapeCSV(g.acquiredPrice),
      escapeCSV(g.condition),
      escapeCSV(g.status),
      escapeCSV(g.roundCount),
      escapeCSV(g.notes),
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lindcott-armory-guns-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportSheet(false);
  }

  const btnBase: React.CSSProperties = {
    flex: 1, padding: '10px',
    border: '0.5px solid ' + theme.border,
    borderRadius: '6px', color: theme.textSecondary,
    fontFamily: 'monospace', fontSize: '11px',
    letterSpacing: '0.5px', cursor: 'pointer',
    backgroundColor: 'transparent', fontWeight: 600,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', boxSizing: 'border-box' as const,
    backgroundColor: theme.bg, border: `0.5px solid ${theme.border}`,
    borderRadius: '6px', color: theme.textPrimary,
    fontFamily: 'monospace', fontSize: '12px', outline: 'none',
  };

  const hint: React.CSSProperties = {
    fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted,
    marginTop: '6px', lineHeight: 1.5,
  };

  return (
    <div onClick={handleBackdrop} style={{
      position: 'fixed', inset: 0, zIndex: 3000,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'flex-end',
    }}>
      <div style={{
        width: '100%', backgroundColor: theme.surface,
        borderRadius: '12px 12px 0 0',
        padding: '0 0 env(safe-area-inset-bottom)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '0.5px solid ' + theme.border,
          position: 'sticky', top: 0, backgroundColor: theme.surface, zIndex: 1,
        }}>
          <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, letterSpacing: '1px', color: theme.textPrimary }}>
            SETTINGS
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, fontFamily: 'monospace', fontSize: '18px', lineHeight: 1, padding: '4px' }}>
            ×
          </button>
        </div>

        {/* ── ACCOUNT (always visible) ── */}
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid ' + theme.border }}>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '1.2px', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '12px' }}>
            ACCOUNT
          </div>

          {/* Anonymous upgrade */}
          {isAnonymous && !upgradeSent && (
            <div style={{
              backgroundColor: `${theme.accent}0d`, border: `0.5px solid ${theme.accent}40`,
              borderRadius: '8px', padding: '14px', marginBottom: '14px',
            }}>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: theme.accent, letterSpacing: '0.5px', marginBottom: '6px' }}>
                BACK UP YOUR DATA
              </div>
              <div style={hint}>
                Your vault syncs privately. Add an email to access it from any device — no password needed.
              </div>
              <form onSubmit={handleUpgrade} style={{ marginTop: '10px' }}>
                <input type="email" placeholder="your@email.com" value={upgradeEmail}
                  onChange={e => setUpgradeEmail(e.target.value)}
                  autoCapitalize="off" autoCorrect="off"
                  style={{ ...inputStyle, marginBottom: '8px' }}
                />
                {upgradeError && <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.red, marginBottom: '8px' }}>{upgradeError}</div>}
                <button type="submit" disabled={upgradeLoading || !upgradeEmail.trim()} style={{
                  ...btnBase, width: '100%', flex: undefined,
                  backgroundColor: upgradeLoading || !upgradeEmail.trim() ? 'transparent' : theme.accent,
                  color: upgradeLoading || !upgradeEmail.trim() ? theme.textMuted : theme.bg,
                  borderColor: upgradeLoading || !upgradeEmail.trim() ? theme.border : theme.accent,
                }}>
                  {upgradeLoading ? 'SENDING...' : 'SECURE THIS ACCOUNT'}
                </button>
              </form>
            </div>
          )}

          {isAnonymous && upgradeSent && (
            <div style={{ ...hint, marginBottom: '12px' }}>
              Check <span style={{ color: theme.textSecondary }}>{upgradeEmail}</span> for a link to secure your account.
            </div>
          )}

          {!isAnonymous && user && (
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textSecondary, marginBottom: '4px' }}>
              {user.email || `via ${user.app_metadata?.provider ?? 'SSO'}`}
            </div>
          )}

          {isAnonymous && (
            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginBottom: '10px' }}>
              Anonymous account — your data syncs privately
            </div>
          )}

          <div style={{ ...hint, marginBottom: '12px' }}>
            Your data is stored locally and synced privately. You own it.
          </div>

          {user && (
            <button onClick={() => signOut()} style={{ ...btnBase, width: '100%', flex: undefined, marginBottom: '8px' }}>
              SIGN OUT
            </button>
          )}
        </div>

        {/* ── APPEARANCE (always visible) ── */}
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid ' + theme.border }}>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '1.2px', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '12px' }}>
            APPEARANCE
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginBottom: '6px' }}>Theme</div>
            <SegmentedControl
              options={[{ key: 'dark', label: 'Dark' }, { key: 'light', label: 'Light' }] as { key: 'dark' | 'light'; label: string }[]}
              value={isOutdoorMode() ? 'light' : 'dark'}
              onChange={(v) => { if ((v === 'light') !== isOutdoorMode()) toggleOutdoorMode(); }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginBottom: '6px' }}>Units</div>
            <SegmentedControl
              options={[{ key: 'imperial', label: 'Imperial' }, { key: 'metric', label: 'Metric' }]}
              value={settings.units}
              onChange={(v) => update({ units: v })}
            />
          </div>

          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginBottom: '6px' }}>Currency</div>
            <SegmentedControl
              options={(['USD','GBP','EUR','CAD','AUD'] as const).map(c => ({ key: c, label: c }))}
              value={settings.currency}
              onChange={(v) => update({ currency: v })}
            />
          </div>
        </div>

        {/* ── ALERTS & REMINDERS ── */}
        <Section id="alerts" label="Alerts & Reminders" open={openSections.has('alerts')} onToggle={toggleSection}>
          <ToggleRow label="Cleaning alerts" sub="Remind when rounds fired since last clean exceeds threshold" value={settings.cleaningAlerts} onChange={v => update({ cleaningAlerts: v })} />
          {settings.cleaningAlerts && (
            <NumberRow label="Cleaning interval" sub="rounds since last clean" value={settings.cleanThresholdRounds} onChange={v => update({ cleanThresholdRounds: v })} />
          )}

          <ToggleRow label="Idle gun alerts" sub="Flag firearms with no sessions in a while" value={settings.idleGunAlerts} onChange={v => update({ idleGunAlerts: v })} />
          {settings.idleGunAlerts && (
            <NumberRow label="Idle threshold" sub="days without a session" value={settings.idleGunDays} onChange={v => update({ idleGunDays: v })} />
          )}

          <ToggleRow label="Low ammo alerts" sub="Warn when stock drops below threshold" value={settings.ammoAlerts} onChange={v => update({ ammoAlerts: v })} />

          <ToggleRow label="Session streak nudges" sub="Light reminder when you haven't been to the range" value={settings.sessionStreakNudges} onChange={v => update({ sessionStreakNudges: v })} />
        </Section>

        {/* ── AMMO TRACKING ── */}
        <Section id="ammo" label="Ammo Tracking" open={openSections.has('ammo')} onToggle={toggleSection}>
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginBottom: '6px' }}>Low stock mode</div>
            <SegmentedControl
              options={[{ key: 'fixed', label: 'Fixed count' }, { key: 'smart', label: 'Days of supply' }]}
              value={settings.ammoLowMode}
              onChange={v => update({ ammoLowMode: v })}
            />
            <div style={hint}>
              {settings.ammoLowMode === 'fixed'
                ? 'Alert when rounds on hand falls below a fixed number per caliber.'
                : 'Alert when stock would run out in fewer than your target number of days, based on your usage history.'}
            </div>
          </div>

          {settings.ammoLowMode === 'fixed' ? (
            <NumberRow label="Alert threshold" sub="rounds per caliber" value={settings.ammoLowThreshold} onChange={v => update({ ammoLowThreshold: v })} />
          ) : (
            <NumberRow label="Days of supply target" sub="alert when below this many days of usage remaining" value={settings.ammoDaysOfSupply} onChange={v => update({ ammoDaysOfSupply: v })} />
          )}

          <ToggleRow label="Track ammo cost" sub="Show purchase cost fields and cost-per-round stats" value={settings.trackAmmoCost} onChange={v => update({ trackAmmoCost: v })} />
        </Section>

        {/* ── HOME SCREEN ── */}
        <Section id="home" label="Home Screen" open={openSections.has('home')} onToggle={toggleSection}>
          <ToggleRow label="Show collection value" sub="Estimated market value in the vault header" value={settings.showCollectionValue} onChange={v => update({ showCollectionValue: v })} />
          <ToggleRow label="Show shooter profile" sub="Persona, skills, and milestones card" value={settings.showShooterProfile} onChange={v => update({ showShooterProfile: v })} />
          <ToggleRow label="Show range insights" sub="Recent activity stats and trends" value={settings.showRangeInsights} onChange={v => update({ showRangeInsights: v })} />
        </Section>

        {/* ── AI ASSISTANT ── */}
        <Section id="ai" label="AI Assistant" open={openSections.has('ai')} onToggle={toggleSection}>
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginBottom: '6px' }}>Response style</div>
            <SegmentedControl
              options={[{ key: 'brief', label: 'Brief' }, { key: 'detailed', label: 'Detailed' }]}
              value={settings.aiResponseStyle}
              onChange={v => update({ aiResponseStyle: v })}
            />
            <div style={hint}>Brief responses are faster and more conversational. Detailed includes deeper analysis and reasoning.</div>
          </div>

          <ToggleRow label="Proactive home insights" sub="AI-generated observations on your home screen (uses API quota)" value={settings.proactiveInsights} onChange={v => update({ proactiveInsights: v })} />

          <div style={{ marginTop: '8px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginBottom: '6px' }}>Claude API key</div>
            <input
              type="password"
              placeholder="sk-ant-..."
              value={claudeKey}
              onChange={e => saveClaudeKey(e.target.value)}
              autoCapitalize="off"
              autoCorrect="off"
              style={inputStyle}
            />
            <div style={hint}>Your key is stored only on this device and never transmitted to our servers.</div>
          </div>
        </Section>

        {/* ── DATA & BACKUP ── */}
        <Section id="data" label="Data & Backup" open={openSections.has('data')} onToggle={toggleSection}>
          <div style={{ position: 'relative', marginBottom: '10px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowExportSheet(v => !v)}
                style={btnBase}
              >
                EXPORT BACKUP
              </button>
              <button onClick={() => fileInputRef.current?.click()} style={btnBase}>RESTORE BACKUP</button>
            </div>
            {showExportSheet && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 10,
                backgroundColor: theme.surface, border: '0.5px solid ' + theme.border,
                borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px 6px', borderBottom: '0.5px solid ' + theme.border }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '1px', color: theme.textMuted }}>EXPORT FORMAT</span>
                  <button onClick={() => setShowExportSheet(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, fontFamily: 'monospace', fontSize: '16px', lineHeight: 1, padding: '2px' }}>×</button>
                </div>
                <button
                  onClick={() => { exportVaultBackup(); setShowExportSheet(false); }}
                  style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2px', padding: '12px', background: 'none', border: 'none', borderBottom: '0.5px solid ' + theme.border, cursor: 'pointer', textAlign: 'left' }}
                >
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: theme.textPrimary }}>JSON</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>Full backup, restoreable</span>
                </button>
                <button
                  onClick={exportGunsCSV}
                  style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2px', padding: '12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: theme.textPrimary }}>CSV</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>Spreadsheet-friendly (guns only)</span>
                </button>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleRestoreFile} style={{ display: 'none' }} />
          {restoreMsg && (
            <div style={{ fontFamily: 'monospace', fontSize: '10px', marginBottom: '8px', color: restoreMsg.ok ? theme.green : theme.red }}>
              {restoreMsg.text}
            </div>
          )}
          <div style={hint}>Full backup includes guns, sessions, ammo, optics, analyses, and gear.</div>

          <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '0.5px solid ' + theme.border }}>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.8px', color: theme.textMuted, marginBottom: '8px' }}>IMPORT & EXPORT</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={onImport} style={btnBase}>IMPORT CSV</button>
              <button onClick={onExport} style={btnBase}>INSURANCE EXPORT</button>
            </div>
            <div style={hint}>CSV import adds firearms from a spreadsheet. Insurance export is a formatted report for your insurer.</div>
          </div>
        </Section>

        {/* ── TEST TOOLS (dev account only) ── */}
        {user?.email === 'james@lindcottarmory.com' && (
          <Section id="testtools" label="⚙ Test Tools" open={openSections.has('testtools')} onToggle={toggleSection}>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.8px', color: theme.textMuted, marginBottom: '10px' }}>
              ONLY VISIBLE TO james@lindcottarmory.com
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => {
                  if (!confirm('Wipe ALL data (guns, sessions, ammo)?')) return;
                  ['gunvault_guns', 'gunvault_sessions', 'gunvault_ammo', 'gunvault_initialized', 'gunvault_is_demo'].forEach(k => localStorage.removeItem(k));
                  window.location.reload();
                }}
                style={{ ...btnBase, color: theme.red, borderColor: 'rgba(255,107,107,0.3)' }}
              >
                WIPE ALL DATA (GUNS + SESSIONS + AMMO)
              </button>
              <button
                onClick={() => {
                  if (!confirm('Wipe all sessions?')) return;
                  localStorage.removeItem('gunvault_sessions');
                  window.location.reload();
                }}
                style={{ ...btnBase }}
              >
                WIPE SESSIONS ONLY
              </button>
              <button
                onClick={() => {
                  if (!confirm('Wipe all ammo?')) return;
                  localStorage.removeItem('gunvault_ammo');
                  window.location.reload();
                }}
                style={{ ...btnBase }}
              >
                WIPE AMMO ONLY
              </button>
              <button
                onClick={() => {
                  if (!confirm('Wipe all guns (and their sessions)?')) return;
                  localStorage.removeItem('gunvault_guns');
                  localStorage.removeItem('gunvault_sessions');
                  window.location.reload();
                }}
                style={{ ...btnBase }}
              >
                WIPE GUNS ONLY
              </button>
            </div>
          </Section>
        )}

        {/* ── DELETE ACCOUNT ── */}
        <Section id="danger" label="Delete Account" open={openSections.has('danger')} onToggle={toggleSection}>
          {deleteStep === 0 && (
            <button
              onClick={() => setDeleteStep(1)}
              style={{ ...btnBase, width: '100%', flex: undefined, color: theme.red, borderColor: 'rgba(255,107,107,0.3)' }}
            >
              DELETE ACCOUNT & ALL DATA
            </button>
          )}

          {deleteStep === 1 && (
            <div style={{ backgroundColor: 'rgba(255,107,107,0.06)', border: '0.5px solid rgba(255,107,107,0.35)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.red, fontWeight: 700, marginBottom: '10px' }}>THIS CANNOT BE UNDONE</div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textSecondary, marginBottom: '16px', lineHeight: 1.7 }}>
                Deleting your account will permanently erase all firearms, sessions, ammo records, optics, and analyses — from this device and from cloud storage.
                {'\n\n'}We recommend downloading a backup first.
              </div>
              <button onClick={exportVaultBackup} style={{ ...btnBase, width: '100%', flex: undefined, marginBottom: '10px' }}>
                DOWNLOAD DATA BACKUP (JSON)
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={cancelDelete} style={{ ...btnBase, flex: 1 }}>CANCEL</button>
                <button onClick={startCountdown} style={{ ...btnBase, flex: 1, color: theme.red, borderColor: 'rgba(255,107,107,0.4)' }}>CONTINUE →</button>
              </div>
            </div>
          )}

          {deleteStep === 2 && (
            <div style={{ backgroundColor: 'rgba(255,107,107,0.08)', border: '0.5px solid rgba(255,107,107,0.5)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.red, fontWeight: 700, marginBottom: '8px' }}>FINAL CONFIRMATION</div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginBottom: '14px', lineHeight: 1.6 }}>
                Your account and all data will be permanently deleted. This action is irreversible.
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={cancelDelete} style={{ ...btnBase, flex: 1 }} disabled={deleteWorking}>CANCEL</button>
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
        </Section>

        {/* ── ADAPTIVE SUGGESTION ── */}
        {activeSuggestion && (
          <div style={{ padding: '14px 20px', borderBottom: '0.5px solid ' + theme.border }}>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '1.2px', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '8px' }}>
              SUGGESTION
            </div>
            <div style={{
              backgroundColor: `${theme.blue}0d`, border: `0.5px solid ${theme.blue}30`,
              borderRadius: '8px', padding: '12px',
            }}>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textSecondary, lineHeight: 1.6, marginBottom: '10px' }}>
                {activeSuggestion.text}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {activeSuggestion.action && (
                  <button
                    onClick={() => {
                      if (activeSuggestion.id === 'smart-ammo') update({ ammoLowMode: 'smart' });
                      dismissSuggestion(activeSuggestion.id);
                      setDismissedSuggestion(true);
                      if (!openSections.has('ammo')) toggleSection('ammo');
                    }}
                    style={{ ...btnBase, flex: 1, color: theme.blue, borderColor: `${theme.blue}40` }}
                  >
                    {activeSuggestion.action.label}
                  </button>
                )}
                <button
                  onClick={() => { dismissSuggestion(activeSuggestion.id); setDismissedSuggestion(true); }}
                  style={{ ...btnBase, flex: 1 }}
                >
                  DISMISS
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Legal buttons ── */}
        <div style={{ padding: '16px 20px', display: 'flex', gap: '8px' }}>
          <button
            onClick={() => { onClose(); onNavigateToLegal(); }}
            style={{ ...btnBase, flex: 1 }}
          >
            TERMS OF SERVICE
          </button>
          <button
            onClick={() => { onClose(); onNavigateToLegal(); }}
            style={{ ...btnBase, flex: 1 }}
          >
            PRIVACY POLICY
          </button>
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onFeedbackOpen}
            style={{
              padding: '10px 24px',
              backgroundColor: 'transparent',
              border: '0.5px solid ' + theme.border,
              borderRadius: '6px',
              color: theme.textSecondary,
              fontFamily: 'monospace', fontSize: '11px',
              fontWeight: 600, letterSpacing: '0.5px',
              cursor: 'pointer',
            }}
          >
            SEND FEEDBACK
          </button>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>LINDCOTT ARMORY v1.0</div>
        </div>

      </div>
    </div>
  );
}
