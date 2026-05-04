// Dev / owner toolbar — persistent floating bar for testing and app management
import { useState, useEffect } from 'react';
import { theme, isOutdoorMode, toggleOutdoorMode } from './theme';
import { resetAllData } from './storage';
import { getClaudeApiKey, setClaudeApiKey } from './claudeApi';

export function DevToolbar({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeySaved, setApiKeySaved] = useState(false);

  const savedKey = getClaudeApiKey();

  function handleSaveApiKey() {
    if (apiKeyInput.trim()) {
      setClaudeApiKey(apiKeyInput.trim());
      setApiKeyInput('');
      setApiKeySaved(true);
      setTimeout(() => setApiKeySaved(false), 2000);
    }
  }

  useEffect(() => {
    const handler = () => setUpdateAvailable(true);
    window.addEventListener('sw-update-available', handler);
    return () => window.removeEventListener('sw-update-available', handler);
  }, []);

  function handleUpdate() {
    navigator.serviceWorker?.getRegistration().then(reg => {
      reg?.waiting?.postMessage('skipWaiting');
    });
  }

  function handleClearData() {
    if (confirmClear) {
      resetAllData(); // clears localStorage and reloads
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  }

  function handleReloadSeed() {
    localStorage.removeItem('gunvault_initialized');
    localStorage.removeItem('gunvault_version');
    window.location.reload();
  }

  return (
    <>
      {/* Update badge — always visible when update is available */}
      {updateAvailable && !open && (
        <div style={{ position: 'fixed', top: 6, right: 6, zIndex: 9999, pointerEvents: 'all' }}>
          <button
            onClick={handleUpdate}
            style={{
              padding: '6px 12px',
              backgroundColor: '#51cf66',
              border: 'none',
              borderRadius: '4px',
              color: '#000',
              fontFamily: 'monospace',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.5px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
              animation: 'pulse 2s infinite',
            }}
          >
            ↑ UPDATE AVAILABLE
          </button>
        </div>
      )}

      {/* Backdrop + panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={onToggle}
            style={{
              position: 'fixed', inset: 0, zIndex: 9997,
              backgroundColor: 'rgba(0,0,0,0.5)',
            }}
          />
          {/* Panel */}
          <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            zIndex: 9998,
            backgroundColor: theme.surface,
            border: `0.5px solid ${theme.border}`,
            borderBottomLeftRadius: '8px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            minWidth: '200px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
          }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, letterSpacing: '0.8px', fontWeight: 700 }}>
                DEV TOOLS
              </div>
              <button
                onClick={onToggle}
                style={{
                  background: 'none', border: 'none', color: theme.textMuted,
                  cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: '0 0 0 8px',
                }}
              >
                ×
              </button>
            </div>

            <ToolButton
              label={confirmClear ? 'TAP AGAIN TO CONFIRM' : 'CLEAR ALL DATA'}
              color={confirmClear ? '#ff6b6b' : theme.textMuted}
              borderColor={confirmClear ? '#ff6b6b' : theme.border}
              onClick={handleClearData}
            />

            <ToolButton
              label="RELOAD SEED DATA"
              color={theme.textMuted}
              borderColor={theme.border}
              onClick={handleReloadSeed}
            />

            <ToolButton
              label={isOutdoorMode() ? 'SWITCH TO NIGHT MODE' : 'SWITCH TO DAY MODE'}
              color={theme.textMuted}
              borderColor={theme.border}
              onClick={toggleOutdoorMode}
            />

            {/* Claude API Key */}
            <div style={{ borderTop: `0.5px solid ${theme.border}`, paddingTop: '8px', marginTop: '2px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '8px', color: theme.textMuted, letterSpacing: '0.5px', marginBottom: '6px' }}>
                CLAUDE API KEY {savedKey ? <span style={{ color: theme.green }}>● SET</span> : <span style={{ color: theme.red }}>● NOT SET</span>}
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <input
                  type="password"
                  placeholder="sk-ant-api03-..."
                  value={apiKeyInput}
                  onChange={e => setApiKeyInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveApiKey(); }}
                  style={{
                    flex: 1,
                    padding: '5px 8px',
                    backgroundColor: theme.bg,
                    border: `0.5px solid ${theme.border}`,
                    borderRadius: '4px',
                    color: theme.textPrimary,
                    fontFamily: 'monospace',
                    fontSize: '9px',
                    minWidth: 0,
                  }}
                />
                <button
                  onClick={handleSaveApiKey}
                  style={{
                    padding: '5px 8px',
                    backgroundColor: apiKeySaved ? theme.green : theme.accent,
                    border: 'none',
                    borderRadius: '4px',
                    color: theme.bg,
                    fontFamily: 'monospace',
                    fontSize: '9px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  {apiKeySaved ? '✓' : 'SAVE'}
                </button>
              </div>
              {savedKey && (
                <div style={{ fontSize: '8px', color: theme.textMuted, fontFamily: 'monospace', marginTop: '4px' }}>
                  {savedKey.slice(0, 12)}...{savedKey.slice(-4)}
                </div>
              )}
            </div>

            <ToolButton
              label="CHECK FOR UPDATE"
              color={updateAvailable ? '#51cf66' : theme.textMuted}
              borderColor={updateAvailable ? '#51cf66' : theme.border}
              onClick={updateAvailable ? handleUpdate : () => {
                navigator.serviceWorker?.getRegistration().then(reg => reg?.update());
              }}
            />
          </div>
        </>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </>
  );
}

function ToolButton({ label, color, borderColor, onClick }: {
  label: string;
  color: string;
  borderColor: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '7px 10px',
        backgroundColor: 'transparent',
        border: `0.5px solid ${borderColor}`,
        borderRadius: '4px',
        color,
        fontFamily: 'monospace',
        fontSize: '9px',
        letterSpacing: '0.5px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'border-color 0.15s, color 0.15s',
      }}
    >
      {label}
    </button>
  );
}
