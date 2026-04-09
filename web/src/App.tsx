import { useState, useEffect, lazy, Suspense } from 'react';
import { theme } from './theme';
import { getAllGuns, addGun, ensureInitialized } from './storage';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import { LoginScreen } from './auth/LoginScreen';
import { WelcomeScreen } from './WelcomeScreen';
import type { Gun } from './types';
import { GunVault } from './GunVault';
import { GunDetail } from './GunDetail';
import { HomePage } from './HomePage';
import { MobileNav } from './MobileNav';
import { AppHeader } from './AppHeader';
import { Toast, useToast } from './Toast';
import { useUndo } from './useUndo';
import { AddGunForm } from './AddGunForm';
import { SessionRecaps } from './SessionRecaps';
import { SessionLogView } from './SessionLogView';
import { DevToolbar } from './DevToolbar';
import { exportInsuranceClaim } from './GunVault';

// Secondary views — lazy loaded, not in the initial bundle
const Arsenal = lazy(() => import('./Arsenal').then(m => ({ default: m.Arsenal })));
const CaliberDatabase = lazy(() => import('./CaliberDatabase').then(m => ({ default: m.CaliberDatabase })));
const BallisticCalculator = lazy(() => import('./BallisticCalculator').then(m => ({ default: m.BallisticCalculator })));
const TargetAnalysis = lazy(() => import('./TargetAnalysis').then(m => ({ default: m.TargetAnalysis })));
const TrainingLog = lazy(() => import('./TrainingLog').then(m => ({ default: m.TrainingLog })));
const ReloadingBench = lazy(() => import('./ReloadingBench').then(m => ({ default: m.ReloadingBench })));
const GearLocker = lazy(() => import('./GearLocker').then(m => ({ default: m.GearLocker })));
const Wishlist = lazy(() => import('./Wishlist').then(m => ({ default: m.Wishlist })));
const SmartSearch = lazy(() => import('./SmartSearch').then(m => ({ default: m.SmartSearch })));
const StyleDemo = lazy(() => import('./StyleDemo').then(m => ({ default: m.StyleDemo })));
const SettingsPanel = lazy(() => import('./SettingsPanel').then(m => ({ default: m.SettingsPanel })));
const CSVImportModal = lazy(() => import('./CSVImportModal').then(m => ({ default: m.CSVImportModal })));
const MoreMenu = lazy(() => import('./MoreMenu').then(m => ({ default: m.MoreMenu })));
const ArmoryAssistant = lazy(() => import('./ArmoryAssistant').then(m => ({ default: m.ArmoryAssistant })));
const FieldGuide = lazy(() => import('./FieldGuide').then(m => ({ default: m.FieldGuide })));
const OpticsList = lazy(() => import('./OpticsList').then(m => ({ default: m.OpticsList })));
const OpticDetail = lazy(() => import('./OpticDetail').then(m => ({ default: m.OpticDetail })));
const LegalDocs = lazy(() => import('./LegalDocs').then(m => ({ default: m.LegalDocs })));
const OnboardingConversation = lazy(() => import('./OnboardingConversation').then(m => ({ default: m.OnboardingConversation })));
const FeedbackModal = lazy(() => import('./FeedbackModal').then(m => ({ default: m.FeedbackModal })));

import { useShooterProfile } from './useShooterProfile';
import { shouldShowOnboarding } from './profileStorage';
import { GoalQuestion, hasAnsweredGoalQuestion } from './GoalQuestion';
import './App.css';

type AppView = 'home' | 'vault' | 'gun-detail' | 'arsenal' | 'sessions' | 'session-log' | 'caliber' | 'ballistics' | 'target-analysis' | 'training' | 'reloading' | 'gear' | 'wishlist' | 'optics' | 'optic-detail' | 'style-demo' | 'more' | 'field-guide' | 'legal' | 'assistant';

function App() {
  return (
    <AuthProvider>
      <AppCore />
    </AuthProvider>
  );
}

function AppCore() {
  const { user, loading: authLoading } = useAuth();
  const [ready, setReady] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [allGuns, setAllGuns] = useState<Gun[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSmartSearch, setShowSmartSearch] = useState(false);
  const [showFab, setShowFab] = useState(false);
  const { toasts, dismissToast, success, error } = useToast();
  const { addUndoAction, performUndo, showUndoToast, currentAction } = useUndo();
  const [selectedGun, setSelectedGun] = useState<Gun | null>(null);
  const [selectedOpticId, setSelectedOpticId] = useState<string | null>(null);
  // Gun pre-selected when launching session log
  const [sessionLogGun, setSessionLogGun] = useState<Gun | null>(null);
  const [devOpen, setDevOpen] = useState(false);
  const [devUnlocked, setDevUnlocked] = useState(false);
  const [devTapCount, setDevTapCount] = useState(0);
  const [vaultSection, setVaultSection] = useState<'guns' | 'ammo' | 'optics'>('guns');
  const [showSettings, setShowSettings] = useState(false);
  const [openAddAmmo, setOpenAddAmmo] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [sessionFilterGunId, setSessionFilterGunId] = useState<string | null>(null);
  const [goalAnswered, setGoalAnswered] = useState(hasAnsweredGoalQuestion);
  const { profile, refresh: refreshProfile } = useShooterProfile();

  // Initialize seed data before first render
  useEffect(() => {
    ensureInitialized().then(() => {
      setReady(true);
      loadGuns();
    });
  }, []);

  // Show onboarding when profile is loaded and conditions are met
  useEffect(() => {
    if (ready && profile) {
      setShowOnboarding(shouldShowOnboarding(profile.totalSessions, profile.onboardingCompleted));
    }
  }, [ready, profile]);

  // Keyboard shortcuts — must be before any early return to satisfy rules of hooks
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

  if (authLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100dvh', backgroundColor: theme.bg,
      }}>
        <div style={{ color: theme.textSecondary, fontFamily: 'monospace', fontSize: '12px', letterSpacing: '1px' }}>
          LOADING...
        </div>
      </div>
    );
  }

  if (!user && false) {
    return <LoginScreen />;
  }

  if (!goalAnswered && false) {
    return <GoalQuestion onComplete={() => setGoalAnswered(true)} />;
  }

  if (!ready) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100dvh', backgroundColor: theme.bg, gap: '16px',
      }}>
        <div style={{ fontSize: '32px' }}>🔫</div>
        <div style={{ color: theme.textSecondary, fontFamily: 'monospace', fontSize: '12px', letterSpacing: '1px' }}>
          LOADING VAULT...
        </div>
      </div>
    );
  }

  function handleVersionTap() {
    const next = devTapCount + 1;
    setDevTapCount(next);
    if (next >= 7) {
      setDevUnlocked(true);
      setDevTapCount(0);
    }
  }

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
    if (currentView === 'vault' || currentView === 'arsenal') return <AppHeader title="Vault" onSearch={() => setShowSmartSearch(true)} />;
    if (currentView === 'gun-detail' && selectedGun) return <AppHeader title={`${selectedGun.make} ${selectedGun.model}`} onBack={() => { setSelectedGun(null); setCurrentView('vault'); }} backLabel="Vault" />;
    if (currentView === 'sessions')     return <AppHeader title="Sessions" />;
    if (currentView === 'session-log')  return <AppHeader title={sessionLogGun ? 'Log Session' : 'New Session'} onBack={() => setCurrentView('sessions')} backLabel="Sessions" />;
    if (currentView === 'caliber')      return <AppHeader title="Calibers" onBack={() => setCurrentView('more')} backLabel="More" />;
    if (currentView === 'ballistics')   return <AppHeader title="Ballistics" onBack={() => setCurrentView('more')} backLabel="More" />;
    if (currentView === 'target-analysis') return <AppHeader title="Target Analysis" />;
    if (currentView === 'training')     return <AppHeader title="Training Log" onBack={() => setCurrentView('more')} backLabel="More" />;
    if (currentView === 'reloading')    return <AppHeader title="Reloading" onBack={() => setCurrentView('more')} backLabel="More" />;
    if (currentView === 'gear')         return <AppHeader title="Gear Locker" onBack={() => setCurrentView('more')} backLabel="More" />;
    if (currentView === 'wishlist')     return <AppHeader title="Wishlist" onBack={() => setCurrentView('more')} backLabel="More" />;
    if (currentView === 'optic-detail') return <AppHeader title="Optic" onBack={() => { setSelectedOpticId(null); setCurrentView('vault'); setVaultSection('optics'); }} backLabel="Vault" />;
    if (currentView === 'more')         return <AppHeader title="Lindcott Armory" />;
    if (currentView === 'field-guide')  return <AppHeader title="Field Guide" />;
    if (currentView === 'assistant')    return <AppHeader title="AI Assistant" onBack={() => setCurrentView('more')} backLabel="More" />;
    if (currentView === 'legal')        return <AppHeader title="Legal" onBack={() => setCurrentView('more')} backLabel="More" />;
    return null;
  }

  function renderView() {
    if (currentView === 'home' && allGuns.length === 0) return (
      <WelcomeScreen
        onAddGun={() => setShowAddForm(true)}
        onRestoreBackup={() => setShowCSVImport(true)}
      />
    );
    if (currentView === 'home') return (
      <HomePage
        onNavigateToVault={() => setCurrentView('vault')}
        onNavigateToArsenal={() => { setCurrentView('vault'); setVaultSection('ammo'); }}
        onNavigateToTargetAnalysis={() => setCurrentView('target-analysis')}
        onNavigateToGun={(gun) => { setSelectedGun(gun); setCurrentView('gun-detail'); }}
        onLogSession={(gun) => openSessionLog(gun)}
        onAddGun={() => setShowAddForm(true)}
        onSearchOpen={() => setShowSmartSearch(true)}
        onSettingsOpen={() => setShowSettings(true)}
        onDevTools={devUnlocked ? () => setDevOpen(o => !o) : undefined}
        onVersionTap={handleVersionTap}
        devTapCount={devTapCount}
        onSetupProfile={() => setShowOnboarding(true)}
        onEditGoals={() => setShowOnboarding(true)}
      />
    );
    if (currentView === 'vault' || currentView === 'arsenal') {
      // If we got here via the old 'arsenal' view, show ammo section
      const section = currentView === 'arsenal' ? 'ammo' : vaultSection;
      return (
        <div>
          {/* GUNS / AMMO / OPTICS toggle — sticky at top of content */}
          <div style={{
            display: 'flex',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: theme.bg,
            borderBottom: `0.5px solid ${theme.border}`,
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}>
            {(['guns', 'ammo', 'optics'] as const).map(s => (
              <button
                key={s}
                onClick={() => { setVaultSection(s); if (currentView === 'arsenal') setCurrentView('vault'); }}
                style={{
                  flex: 1,
                  padding: '9px',
                  backgroundColor: section === s ? theme.accent : 'transparent',
                  border: `0.5px solid ${section === s ? theme.accent : theme.border}`,
                  borderRadius: '6px',
                  color: section === s ? theme.bg : theme.textSecondary,
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  letterSpacing: '0.8px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {s === 'guns' ? 'GUNS' : s === 'ammo' ? 'AMMO' : 'OPTICS'}
              </button>
            ))}
          </div>
          {section === 'guns'
            ? <GunVault
                onGunSelect={(gun) => { setSelectedGun(gun); setCurrentView('gun-detail'); }}
                onAddGun={() => setShowAddForm(true)}
                onImportRequest={() => setShowCSVImport(true)}
              />
            : section === 'ammo'
            ? <Arsenal openAddAmmoOnMount={openAddAmmo} onAddAmmoMountHandled={() => setOpenAddAmmo(false)} />
            : <OpticsList onSelectOptic={(o) => { setSelectedOpticId(o.id); setCurrentView('optic-detail'); }} />
          }
        </div>
      );
    }
    if (currentView === 'gun-detail' && selectedGun) return (
      <GunDetail
        gun={selectedGun}
        onBack={() => { setSelectedGun(null); setCurrentView('vault'); }}
        onGunUpdated={loadGuns}
        onLogSession={(gun) => openSessionLog(gun)}
        onViewSessions={(gunId) => { setSessionFilterGunId(gunId); setCurrentView('sessions'); }}
      />
    );
    if (currentView === 'sessions') return <SessionRecaps onLogSession={(gun) => openSessionLog(gun)} initialFilterGunId={sessionFilterGunId ?? undefined} />;
    if (currentView === 'session-log') return <SessionLogView preselectedGun={sessionLogGun} onSaved={() => { setSessionLogGun(null); setCurrentView('sessions'); }} onCancel={() => { setSessionLogGun(null); setCurrentView('sessions'); }} />;
    if (currentView === 'caliber')     return <CaliberDatabase />;
    if (currentView === 'ballistics')  return <BallisticCalculator />;
    if (currentView === 'target-analysis') return <TargetAnalysis />;
    if (currentView === 'training')    return <TrainingLog />;
    if (currentView === 'reloading')   return <ReloadingBench />;
    if (currentView === 'gear')        return <GearLocker />;
    if (currentView === 'wishlist')    return <Wishlist />;
    if (currentView === 'optic-detail' && selectedOpticId) return <OpticDetail opticId={selectedOpticId} onBack={() => { setSelectedOpticId(null); setCurrentView('vault'); setVaultSection('optics'); }} onDeleted={() => { setSelectedOpticId(null); setCurrentView('vault'); setVaultSection('optics'); }} />;
    if (currentView === 'style-demo')  return <StyleDemo />;
    if (currentView === 'more')        return <MoreMenu onNavigate={(v) => setCurrentView(v as AppView)} onFeedbackOpen={() => setShowFeedback(true)} />;
    if (currentView === 'assistant')   return <ArmoryAssistant />;
    if (currentView === 'field-guide') return <FieldGuide />;
    if (currentView === 'legal') return <LegalDocs />;
    return null;
  }

  const activeNavView = currentView;

  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', backgroundColor: theme.bg }}>
        <div style={{ color: theme.textSecondary, fontFamily: 'monospace', fontSize: '12px', letterSpacing: '1px' }}>LOADING...</div>
      </div>
    }>
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
        onNavigateToVault={() => { setSelectedGun(null); setCurrentView('vault'); setVaultSection('guns'); }}
        onNavigateToSessions={() => { setSessionFilterGunId(null); setCurrentView('sessions'); }}
        onNavigateToTargetAnalysis={() => setCurrentView('target-analysis')}
        onNavigateToMore={() => setCurrentView('more')}
      />
      {showSmartSearch && (
        <SmartSearch
          onClose={() => setShowSmartSearch(false)}
          onNavigate={(view, data) => { setCurrentView(view as AppView); if (data) setSelectedGun(data); }}
        />
      )}
      {showCSVImport && (
        <CSVImportModal
          onClose={() => setShowCSVImport(false)}
          onImported={(count) => { setShowCSVImport(false); loadGuns(); success(count + ' guns imported'); }}
        />
      )}
      {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          onImport={() => { setShowSettings(false); setShowCSVImport(true); }}
          onExport={() => { setShowSettings(false); exportInsuranceClaim(allGuns); }}
          onNavigateToLegal={() => { setShowSettings(false); setCurrentView('legal'); }}
          onFeedbackOpen={() => { setShowSettings(false); setShowFeedback(true); }}
        />
      )}
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
      <Toast toasts={toasts} onDismiss={dismissToast} />
      {showUndoToast && currentAction && <UndoToast action={currentAction.description} onUndo={performUndo} />}

      {/* Onboarding modal — shown once after 3rd session */}
      {showOnboarding && (
        <OnboardingConversation
          onComplete={() => { setShowOnboarding(false); refreshProfile(); }}
          onDismiss={() => setShowOnboarding(false)}
        />
      )}

      {/* ── GLOBAL FAB ── shown on main views only, hidden when modals are open */}
      {(['home','vault','sessions'] as AppView[]).includes(currentView) && !showAddForm && !showSettings && (
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
                { label: 'Add Ammo',    action: () => { setShowFab(false); setVaultSection('ammo'); setCurrentView('vault'); setOpenAddAmmo(true); } },
              ].map(item => (
                <button key={item.label} onClick={item.action} style={{
                  padding: '10px 16px',
                  backgroundColor: theme.surface,
                  border: `1px solid #ffd43b`,
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
              border: `2.5px solid ${theme.bg}`,
              color: theme.bg,
              fontSize: '26px',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: showFab ? 'rotate(45deg)' : 'rotate(0)',
              transition: 'transform 0.2s',
              outline: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            +
          </button>
        </>
      )}
    </div>
    </Suspense>
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
