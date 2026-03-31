// Dev / owner toolbar — persistent floating bar for testing and app management
import { useState, useEffect } from 'react';
import { theme } from './theme';
import { resetAllData } from './storage';

export function DevToolbar({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

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
    // Remove initialized flag so seed data reloads on next render
    localStorage.removeItem('gunvault_initialized');
    localStorage.removeItem('gunvault_version');
    window.location.reload();
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      zIndex: 9998,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '4px',
      padding: '6px',
      pointerEvents: 'none',
    }}>
      {/* Update badge — always visible when update is available */}
      {updateAvailable && (
        <button
          onClick={handleUpdate}
          style={{
            pointerEvents: 'all',
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
      )}

      {/* Expanded panel */}
      {open && (
        <div style={{
          pointerEvents: 'all',
          backgroundColor: theme.surface,
          border: `0.5px solid ${theme.border}`,
          borderRadius: '6px',
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          minWidth: '160px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        }}>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, letterSpacing: '0.8px', marginBottom: '2px' }}>
            DEV TOOLS
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
            label="CHECK FOR UPDATE"
            color={updateAvailable ? '#51cf66' : theme.textMuted}
            borderColor={updateAvailable ? '#51cf66' : theme.border}
            onClick={updateAvailable ? handleUpdate : () => {
              navigator.serviceWorker?.getRegistration().then(reg => reg?.update());
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
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
