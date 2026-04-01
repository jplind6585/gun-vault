import { useState, useEffect } from 'react';
import { theme } from './theme';
import { getAllGuns, addGun } from './storage';
import type { Gun } from './types';
import { GunVault } from './GunVault';
import { GunDetail } from './GunDetail';
import { HomePage } from './HomePage';
import { Arsenal } from './Arsenal';
import { CaliberDatabase } from './CaliberDatabase';
import { BallisticCalculator } from './BallisticCalculator';
import { TargetAnalysis } from './TargetAnalysis';
import { TrainingLog } from './TrainingLog';
import { ReloadingBench } from './ReloadingBench';
import { GearLocker } from './GearLocker';
import { Wishlist } from './Wishlist';
import { MobileNav } from './MobileNav';
import { AppHeader } from './AppHeader';
import { SmartSearch } from './SmartSearch';
import { Toast, useToast } from './Toast';
import { useUndo } from './useUndo';
import { StyleDemo } from './StyleDemo';
import { AddGunForm } from './AddGunForm';
import { SessionRecaps } from './SessionRecaps';
import { SessionLogView } from './SessionLogView';
import { DevToolbar } from './DevToolbar';
import './App.css';

type AppView = 'home' | 'vault' | 'gun-detail' | 'arsenal' | 'sessions' | 'session-log' | 'caliber' | 'ballistics' | 'target-analysis' | 'training' | 'reloading' | 'gear' | 'wishlist' | 'style-demo';

function App() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [allGuns, setAllGuns] = useState<Gun[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSmartSearch, setShowSmartSearch] = useState(false);
  const [showFab, setShowFab] = useState(false);
  const { toasts, dismissToast, success, error } = useToast();
  const { addUndoAction, performUndo, showUndoToast, currentAction } = useUndo();
  const [selectedGun, setSelectedGun] = useState<Gun | null>(null);
  // Gun pre-selected when launching session log
  const [sessionLogGun, setSessionLogGun] = useState<Gun | null>(null);
  const [devOpen, setDevOpen] = useState(false);

  useEffect(() => { loadGuns(); }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSmartSearch(true);
        return;
      }
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Escape') {
        setShowSmartSearch(prev => { if (prev) return false; setCurrentView('home'); return prev; });
        return;
      }
      if (!e.altKey) return;
      e.preventDefault();
      switch (e.key.toLowerCase()) {
        case 'h': setCurrentView('home'); break;
        case 'v': setCurrentView('vault'); break;
        case 'a': setCurrentView('arsenal'); break;
        case 's': setCurrentView('sessions'); break;
      }
    }
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  function loadGuns() {
    setAllGuns(getAllGuns());
  }

  function handleSaveGun(gunData: Partial<Gun>) {
    const newGun = {
      make: gunData.make || '',
      model: gunData.model || '',
      caliber: gunData.caliber || '',
      action: gunData.action || ('Semi-Auto' as const),
      type: gunData.type || ('Rifle' as const),
      status: gunData.status || ('Active' as const),
      condition: gunData.condition,
      serialNumber: gunData.serialNumber,
      acquiredDate: gunData.acquiredDate,
      acquiredPrice: gunData.acquiredPrice,
      acquiredFrom: gunData.acquiredFrom,
      barrelLength: gunData.barrelLength,
      notes: gunData.notes,
      nfaItem: gunData.nfaItem,
      suppressorHost: gunData.suppressorHost,
    };

    addGun(newGun);
    loadGuns();
    setShowAddForm(false);
    success(`${newGun.make} ${newGun.model} added`);

    addUndoAction(`Add ${newGun.make} ${newGun.model}`, () => {
      loadGuns();
      error(`Undo: Removed ${newGun.make} ${newGun.model}`);
    });
  }

  function openSessionLog(gun?: Gun) {
    setSessionLogGun(gun || null);
    setCurrentView('session-log');
  }

  // ── VIEWS ────────────────────────────────────────────────────────────────────

  function renderHeader() {
    if (currentView === 'home')         return <AppHeader title="Lindcott Armory" />;
    if (currentView === 'vault')        return <AppHeader title="Gun Vault" onSearch={() => setShowSmartSearch(true)} />;
    if (currentView === 'gun-detail' && selectedGun) return <AppHeader title={`${selectedGun.make} ${selectedGun.model}`} onBack={() => { setSelectedGun(null); setCurrentView('vault'); }} backLabel="Vault" />;
    if (currentView === 'sessions')     return <AppHeader title="Sessions" />;
    if (currentView === 'session-log')  return <AppHeader title={sessionLogGun ? 'Log Session' : 'New Session'} onBack={() => setCurrentView('sessions')} backLabel="Sessions" />;
    if (currentView === 'arsenal')      return <AppHeader title="Arsenal" />;
    if (currentView === 'caliber')      return <AppHeader title="Calibers" onBack={() => setCurrentView('home')} backLabel="Home" />;
    if (currentView === 'ballistics')   return <AppHeader title="Ballistics" onBack={() => setCurrentView('home')} backLabel="Home" />;
    if (currentView === 'target-analysis') return <AppHeader title="Target Analysis" />;
    if (currentView === 'training')     return <AppHeader title="Training Log" onBack={() => setCurrentView('home')} backLabel="Home" />;
    if (currentView === 'reloading')    return <AppHeader title="Reloading" onBack={() => setCurrentView('home')} backLabel="Home" />;
    if (currentView === 'gear')         return <AppHeader title="Gear Locker" onBack={() => setCurrentView('home')} backLabel="Home" />;
    if (currentView === 'wishlist')     return <AppHeader title="Wishlist" onBack={() => setCurrentView('home')} backLabel="Home" />;
    return null;
  }

  function renderView() {
    if (currentView === 'home') return (
      <HomePage
        onNavigateToVault={() => setCurrentView('vault')}
        onNavigateToArsenal={() => setCurrentView('arsenal')}
        onNavigateToTargetAnalysis={() => setCurrentView('target-analysis')}
        onNavigateToGun={(gun) => { setSelectedGun(gun); setCurrentView('gun-detail'); }}
        onLogSession={() => openSessionLog()}
        onAddGun={() => setShowAddForm(true)}
        onSearchOpen={() => setShowSmartSearch(true)}
        onDevTools={() => setDevOpen(o => !o)}
      />
    );
    if (currentView === 'vault') return (
      <GunVault
        onGunSelect={(gun) => { setSelectedGun(gun); setCurrentView('gun-detail'); }}
        onAddGun={() => setShowAddForm(true)}
      />
    );
    if (currentView === 'gun-detail' && selectedGun) return (
      <GunDetail
        gun={selectedGun}
        onBack={() => { setSelectedGun(null); setCurrentView('vault'); }}
        onGunUpdated={loadGuns}
        onLogSession={(gun) => openSessionLog(gun)}
      />
    );
    if (currentView === 'sessions')    return <SessionRecaps onLogSession={(gun) => openSessionLog(gun)} />;
    if (currentView === 'session-log') return <SessionLogView preselectedGun={sessionLogGun} onSaved={() => { setSessionLogGun(null); setCurrentView('sessions'); }} onCancel={() => { setSessionLogGun(null); setCurrentView('sessions'); }} />;
    if (currentView === 'arsenal')     return <Arsenal />;
    if (currentView === 'caliber')     return <CaliberDatabase />;
    if (currentView === 'ballistics')  return <BallisticCalculator />;
    if (currentView === 'target-analysis') return <TargetAnalysis />;
    if (currentView === 'training')    return <TrainingLog />;
    if (currentView === 'reloading')   return <ReloadingBench />;
    if (currentView === 'gear')        return <GearLocker />;
    if (currentView === 'wishlist')    return <Wishlist />;
    if (currentView === 'style-demo')  return <StyleDemo />;
    return null;
  }

  const activeNavView = (['home','vault','arsenal','sessions','target-analysis'] as const).find(v =>
    currentView === v || (currentView === 'gun-detail' && v === 'vault') || (currentView === 'session-log' && v === 'sessions')
  ) ?? 'home';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100dvh',
      maxWidth: '480px', margin: '0 auto',
      backgroundColor: theme.bg,
      overflow: 'hidden',
    }}>
      <DevToolbar open={devOpen} onToggle={() => setDevOpen(o => !o)} />
      {renderHeader()}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {renderView()}
        {showAddForm && <AddGunForm onSave={handleSaveGun} onCancel={() => setShowAddForm(false)} />}
      </div>
      <MobileNav
        currentView={activeNavView}
        onNavigateToHome={() => setCurrentView('home')}
        onNavigateToVault={() => { setSelectedGun(null); setCurrentView('vault'); }}
        onNavigateToArsenal={() => setCurrentView('arsenal')}
        onNavigateToSessions={() => setCurrentView('sessions')}
        onNavigateToTargetAnalysis={() => setCurrentView('target-analysis')}
      />
      {showSmartSearch && (
        <SmartSearch
          onClose={() => setShowSmartSearch(false)}
          onNavigate={(view, data) => { setCurrentView(view as AppView); if (data) setSelectedGun(data); }}
        />
      )}
      <Toast toasts={toasts} onDismiss={dismissToast} />
      {showUndoToast && currentAction && <UndoToast action={currentAction.description} onUndo={performUndo} />}

      {/* ── GLOBAL FAB ── shown on main views only */}
      {(['home','vault','arsenal','sessions'] as AppView[]).includes(currentView) && (
        <>
          {showFab && (
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 998 }}
              onClick={() => setShowFab(false)}
            />
          )}
          {showFab && (
            <div style={{
              position: 'fixed',
              bottom: 'calc(136px + env(safe-area-inset-bottom))',
              right: '20px',
              zIndex: 999,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              alignItems: 'flex-end',
            }}>
              {[
                { label: 'Log Session', action: () => { setShowFab(false); openSessionLog(); } },
                { label: 'Add Gun',     action: () => { setShowFab(false); setShowAddForm(true); } },
                { label: 'Add Ammo',    action: () => { setShowFab(false); setCurrentView('arsenal'); } },
              ].map(item => (
                <button key={item.label} onClick={item.action} style={{
                  padding: '10px 16px',
                  backgroundColor: theme.surface,
                  border: `0.5px solid ${theme.border}`,
                  borderRadius: '20px',
                  color: theme.textPrimary,
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                  whiteSpace: 'nowrap',
                }}>
                  {item.label}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowFab(f => !f)}
            style={{
              position: 'fixed',
              bottom: 'calc(72px + env(safe-area-inset-bottom))',
              right: '20px',
              zIndex: 1000,
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: theme.accent,
              border: 'none',
              color: theme.bg,
              fontSize: '26px',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(255,212,59,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: showFab ? 'rotate(45deg)' : 'rotate(0)',
              transition: 'transform 0.2s',
            }}
          >
            +
          </button>
        </>
      )}
    </div>
  );
}

function UndoToast({ action, onUndo }: { action: string; onUndo: () => void }) {
  return (
    <div style={{
      position: 'fixed', bottom: '80px', left: '24px', zIndex: 9999,
      backgroundColor: theme.surface, border: `1px solid ${theme.accent}`,
      borderRadius: '6px', padding: '12px 16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      display: 'flex', alignItems: 'center', gap: '12px',
    }}>
      <span style={{ fontSize: '13px', color: theme.textPrimary }}>{action}</span>
      <button onClick={onUndo} style={{
        padding: '6px 12px', backgroundColor: theme.accent,
        color: theme.bg, border: 'none', borderRadius: '4px',
        fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'monospace',
      }}>
        UNDO
      </button>
    </div>
  );
}

export default App;
