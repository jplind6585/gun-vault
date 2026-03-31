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

  const nav = (current: string) => (
    <MobileNav
      currentView={current}
      onNavigateToHome={() => setCurrentView('home')}
      onNavigateToVault={() => { setSelectedGun(null); setCurrentView('vault'); }}
      onNavigateToArsenal={() => setCurrentView('arsenal')}
      onNavigateToSessions={() => setCurrentView('sessions')}
    />
  );

  function renderView() {

  if (currentView === 'home') {
    return (
      <>
        <AppHeader title="Gun Vault" />
        <HomePage
          onNavigateToVault={() => setCurrentView('vault')}
          onNavigateToArsenal={() => setCurrentView('arsenal')}
          onNavigateToCaliber={() => setCurrentView('caliber')}
          onNavigateToBallistics={() => setCurrentView('ballistics')}
          onNavigateToTargetAnalysis={() => setCurrentView('target-analysis')}
          onNavigateToTraining={() => setCurrentView('training')}
          onNavigateToReloading={() => setCurrentView('reloading')}
          onNavigateToGear={() => setCurrentView('gear')}
          onNavigateToWishlist={() => setCurrentView('wishlist')}
          onNavigateToGun={(gun) => { setSelectedGun(gun); setCurrentView('gun-detail'); }}
          onLogSession={() => openSessionLog()}
          onAddGun={() => setShowAddForm(true)}
          onSearchOpen={() => setShowSmartSearch(true)}
          onDevTools={() => setDevOpen(o => !o)}
          onNavigateToStyleDemo={() => setCurrentView('style-demo')}
        />
        {showAddForm && <AddGunForm onSave={handleSaveGun} onCancel={() => setShowAddForm(false)} />}
        {nav('home')}
        {showSmartSearch && (
          <SmartSearch
            onClose={() => setShowSmartSearch(false)}
            onNavigate={(view, data) => { setCurrentView(view as AppView); if (data) setSelectedGun(data); }}
          />
        )}
        <Toast toasts={toasts} onDismiss={dismissToast} />
        {showUndoToast && currentAction && <UndoToast action={currentAction.description} onUndo={performUndo} />}
      </>
    );
  }

  if (currentView === 'vault') {
    return (
      <>
        <AppHeader title="Gun Vault" onSearch={() => setShowSmartSearch(true)} />
        <GunVault
          onGunSelect={(gun) => { setSelectedGun(gun); setCurrentView('gun-detail'); }}
          onAddGun={() => setShowAddForm(true)}
        />
        {showAddForm && <AddGunForm onSave={handleSaveGun} onCancel={() => setShowAddForm(false)} />}
        {nav('vault')}
        <Toast toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  if (currentView === 'gun-detail' && selectedGun) {
    return (
      <>
        <AppHeader
          title={`${selectedGun.make} ${selectedGun.model}`}
          onBack={() => { setSelectedGun(null); setCurrentView('vault'); }}
          backLabel="Vault"
        />
        <GunDetail
          gun={selectedGun}
          onBack={() => { setSelectedGun(null); setCurrentView('vault'); }}
          onGunUpdated={loadGuns}
          onLogSession={(gun) => openSessionLog(gun)}
        />
        {nav('vault')}
      </>
    );
  }

  if (currentView === 'sessions') {
    return (
      <>
        <AppHeader title="Sessions" />
        <SessionRecaps onLogSession={(gun) => openSessionLog(gun)} />
        {nav('sessions')}
      </>
    );
  }

  if (currentView === 'session-log') {
    return (
      <>
        <AppHeader
          title={sessionLogGun ? 'Log Session' : 'New Session'}
          onBack={() => setCurrentView('sessions')}
          backLabel="Sessions"
        />
        <SessionLogView
          preselectedGun={sessionLogGun}
          onSaved={() => { setSessionLogGun(null); setCurrentView('sessions'); }}
          onCancel={() => { setSessionLogGun(null); setCurrentView('sessions'); }}
        />
        {nav('sessions')}
      </>
    );
  }

  if (currentView === 'arsenal') {
    return (
      <>
        <AppHeader title="Arsenal" />
        <Arsenal />
        {nav('arsenal')}
      </>
    );
  }

  if (currentView === 'caliber') {
    return (
      <>
        <AppHeader title="Calibers" onBack={() => setCurrentView('home')} backLabel="Home" />
        <CaliberDatabase />
        {nav('home')}
      </>
    );
  }

  if (currentView === 'ballistics') {
    return (
      <>
        <AppHeader title="Ballistics" onBack={() => setCurrentView('home')} backLabel="Home" />
        <BallisticCalculator />
        {nav('home')}
      </>
    );
  }

  if (currentView === 'target-analysis') {
    return (
      <>
        <AppHeader title="Target Analysis" onBack={() => setCurrentView('home')} backLabel="Home" />
        <TargetAnalysis />
        {nav('home')}
      </>
    );
  }

  if (currentView === 'training') {
    return (
      <>
        <AppHeader title="Training Log" onBack={() => setCurrentView('home')} backLabel="Home" />
        <TrainingLog />
        {nav('home')}
      </>
    );
  }

  if (currentView === 'reloading') {
    return (
      <>
        <AppHeader title="Reloading" onBack={() => setCurrentView('home')} backLabel="Home" />
        <ReloadingBench />
        {nav('home')}
      </>
    );
  }

  if (currentView === 'gear') {
    return (
      <>
        <AppHeader title="Gear Locker" onBack={() => setCurrentView('home')} backLabel="Home" />
        <GearLocker />
        {nav('home')}
      </>
    );
  }

  if (currentView === 'wishlist') {
    return (
      <>
        <AppHeader title="Wishlist" onBack={() => setCurrentView('home')} backLabel="Home" />
        <Wishlist />
        {nav('home')}
      </>
    );
  }

  if (currentView === 'style-demo') {
    return <StyleDemo />;
  }

  return null;
  } // end renderView

  return (
    <>
      <DevToolbar open={devOpen} onToggle={() => setDevOpen(o => !o)} />
      {renderView()}
    </>
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
