import { useState, useEffect, lazy, Suspense } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { theme } from './theme';
import { getAllGuns, addGun, ensureInitialized } from './storage';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import { LoginScreen } from './auth/LoginScreen';
import { LandingPage } from './auth/LandingPage';
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
import { SessionEntry } from './SessionEntry';
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
const UpgradeModal = lazy(() => import('./UpgradeModal').then(m => ({ default: m.UpgradeModal })));

import { useShooterProfile } from './useShooterProfile';
import { initBilling, getProStatus } from './lib/billing';
// SplashScreen imported dynamically to avoid Android bundle export error
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
  // Navigation history stack for Android hardware back button
  const [viewHistory, setViewHistory] = useState<AppView[]>([]);

  // Tab-level views reset the stack; detail views push onto it.
  const TAB_VIEWS: AppView[] = ['home', 'vault', 'sessions', 'more', 'arsenal'];

  function navigateTo(view: AppView) {
    if ((view === 'assistant' || view === 'target-analysis') && !isPro) {
      setShowUpgrade(true);
      return;
    }
    setViewHistory(prev => TAB_VIEWS.includes(view) ? [] : [...prev, currentView]);
    setCurrentView(view);
  }

  function navigateBack() {
    if (showSmartSearch) { setShowSmartSearch(false); return; }
    // Clean up view-specific state when leaving detail screens
    if (currentView === 'gun-detail') setSelectedGun(null);
    if (currentView === 'optic-detail') { setSelectedOpticId(null); setVaultSection('optics'); }
    if (currentView === 'session-log') setSessionLogGun(null);
    if (viewHistory.length > 0) {
      const prev = viewHistory[viewHistory.length - 1];
      setViewHistory(h => h.slice(0, -1));
      setCurrentView(prev);
    } else if (currentView !== 'home') {
      setCurrentView('home');
    } else if (Capacitor.isNativePlatform()) {
      CapApp.minimizeApp();
    }
  }
  const [allGuns, setAllGuns] = useState<Gun[]>([]);
  const [skipWelcome, setSkipWelcome] = useState(false);
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
  const [gunRefreshKey, setGunRefreshKey] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isPro, setIsPro] = useState(false);

  const FREE_GUN_LIMIT = 10;
  const [sessionFilterGunId, setSessionFilterGunId] = useState<string | null>(null);
  const [goalAnswered, setGoalAnswered] = useState(hasAnsweredGoalQuestion);
  const { profile, refresh: refreshProfile } = useShooterProfile();

  // Initialize seed data before first render
  useEffect(() => {
    // Safety net: never hang on the loading screen for more than 2 seconds
    const hideSplash = () => import('@capacitor/splash-screen').then(({ SplashScreen }) => SplashScreen.hide().catch(() => {}));
    const fallback = setTimeout(() => { setReady(true); loadGuns(); hideSplash(); }, 2000);
    ensureInitialized().then(() => {
      clearTimeout(fallback);
      setReady(true);
      loadGuns();
      hideSplash();
    }).catch(() => {
      clearTimeout(fallback);
      setReady(true);
      loadGuns();
      hideSplash();
    });
  }, []);

  // Re-load guns after Supabase pull completes on sign-in; also init billing
  useEffect(() => {
    if (!user) return;
    // pullFromSupabase() in AuthProvider runs async after sign-in.
    // Give it a moment to finish, then refresh the gun list from localStorage.
    const t = setTimeout(loadGuns, 2000);
    // Initialize RevenueCat with the authenticated user ID (no-op on web)
    initBilling(user.id);
    // Load Pro status from Supabase / RevenueCat
    getProStatus(user.id).then(setIsPro);
    return () => clearTimeout(t);
  }, [user]);

  // Show onboarding when profile is loaded and conditions are met
  useEffect(() => {
    if (ready && profile) {
      setShowOnboarding(shouldShowOnboarding(profile.totalSessions, profile.onboardingCompleted));
    }
  }, [ready, profile]);

  // Listen for global budget-exceeded event to show upgrade modal
  useEffect(() => {
    const handler = () => setShowUpgrade(true);
    window.addEventListener('ai_budget_exceeded', handler);
    return () => window.removeEventListener('ai_budget_exceeded', handler);
  }, []);

  // Android hardware back button
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listener = CapApp.addListener('backButton', () => navigateBack());
    return () => { listener.then(l => l.remove()); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, viewHistory, showSmartSearch]);

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

  if (!user) {
    return <LoginScreen />;
  }

  if (!goalAnswered) {
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

  function handleRequestAddGun() {
    if (!isPro && allGuns.filter(g => g.status !== 'Decommissioned').length >= FREE_GUN_LIMIT) {
      setShowUpgrade(true);
      return;
    }
    setShowAddForm(true);
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
    setGunRefreshKey(k => k + 1);
    setShowAddForm(false);

    addUndoAction(`${newGun.make} ${newGun.model} added`, () => {
      loadGuns();
      setGunRefreshKey(k => k + 1);
    });
  }

  function openSessionLog(gun?: Gun) {
    setSessionLogGun(gun || null);
    navigateTo('session-log');
  }

  // ── VIEWS ────────────────────────────────────────────────────────────────────

  function renderHeader() {
    if (currentView === 'home')         return <AppHeader title="Lindcott Armory" />;
    if (currentView === 'vault' || currentView === 'arsenal') return <AppHeader title="Vault" onSearch={() => setShowSmartSearch(true)} />;
    if (currentView === 'gun-detail' && selectedGun) return <AppHeader title={`${selectedGun.make} ${selectedGun.model}`} onBack={navigateBack} backLabel="Vault" />;
    if (currentView === 'sessions')     return <AppHeader title="Sessions" />;
    if (currentView === 'session-log')  return null; // SessionEntry renders its own header
    if (currentView === 'caliber')      return <AppHeader title="Calibers" onBack={navigateBack} backLabel="More" />;
    if (currentView === 'ballistics')   return <AppHeader title="Ballistics" onBack={navigateBack} backLabel="More" />;
    if (currentView === 'target-analysis') return <AppHeader title="Target Analysis" onBack={navigateBack} backLabel="More" />;
    if (currentView === 'training')     return <AppHeader title="Training Log" onBack={navigateBack} backLabel="More" />;
    if (currentView === 'reloading')    return <AppHeader title="Reloading" onBack={navigateBack} backLabel="More" />;
    if (currentView === 'gear')         return <AppHeader title="Gear Locker" onBack={navigateBack} backLabel="More" />;
    if (currentView === 'wishlist')     return <AppHeader title="Wishlist" onBack={navigateBack} backLabel="More" />;
    if (currentView === 'optic-detail') return <AppHeader title="Optic" onBack={navigateBack} backLabel="Vault" />;
    if (currentView === 'more')         return <AppHeader title="Lindcott Armory" />;
    if (currentView === 'field-guide')  return <AppHeader title="Field Guide" onBack={navigateBack} backLabel="More" />;
    if (currentView === 'assistant')    return <AppHeader title="AI Assistant" onBack={navigateBack} backLabel="More" />;
    if (currentView === 'legal')        return <AppHeader title="Legal" onBack={navigateBack} backLabel="More" />;
    return null;
  }

  function renderView() {
    if (currentView === 'home' && allGuns.length === 0 && !skipWelcome) return (
      <WelcomeScreen
        onAddGun={handleRequestAddGun}
        onRestoreBackup={() => setShowCSVImport(true)}
        onBrowse={() => setSkipWelcome(true)}
      />
    );
    if (currentView === 'home') return (
      <HomePage
        onNavigateToVault={() => setCurrentView('vault')}
        onNavigateToArsenal={() => { setCurrentView('vault'); setVaultSection('ammo'); }}
        onNavigateToTargetAnalysis={() => navigateTo('target-analysis')}
        onNavigateToGun={(gun) => { setSelectedGun(gun); navigateTo('gun-detail'); }}
        onLogSession={(gun) => openSessionLog(gun)}
        onAddGun={handleRequestAddGun}
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
                onClick={() => { setVaultSection(s); if (currentView === 'arsenal') navigateTo('vault'); }}
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
                onGunSelect={(gun) => { setSelectedGun(gun); navigateTo('gun-detail'); }}
                onAddGun={handleRequestAddGun}
                onImportRequest={() => setShowCSVImport(true)}
                refreshKey={gunRefreshKey}
              />
            : section === 'ammo'
            ? <Arsenal openAddAmmoOnMount={openAddAmmo} onAddAmmoMountHandled={() => setOpenAddAmmo(false)} />
            : <OpticsList onSelectOptic={(o) => { setSelectedOpticId(o.id); navigateTo('optic-detail'); }} />
          }
        </div>
      );
    }
    if (currentView === 'gun-detail' && selectedGun) return (
      <GunDetail
        gun={selectedGun}
        onBack={navigateBack}
        onGunUpdated={loadGuns}
        onLogSession={(gun) => openSessionLog(gun)}
        onViewSessions={(gunId) => { setSessionFilterGunId(gunId); navigateTo('sessions'); }}
      />
    );
    if (currentView === 'sessions') return <SessionRecaps onLogSession={(gun) => openSessionLog(gun)} initialFilterGunId={sessionFilterGunId ?? undefined} />;
    if (currentView === 'session-log') return <SessionEntry preselectedGun={sessionLogGun} onSaved={() => { setSessionLogGun(null); navigateTo('sessions'); }} onCancel={() => { setSessionLogGun(null); navigateBack(); }} />;
    if (currentView === 'caliber')     return <CaliberDatabase />;
    if (currentView === 'ballistics')  return <BallisticCalculator />;
    if (currentView === 'target-analysis') return <TargetAnalysis />;
    if (currentView === 'training')    return <TrainingLog />;
    if (currentView === 'reloading')   return <ReloadingBench />;
    if (currentView === 'gear')        return <GearLocker />;
    if (currentView === 'wishlist')    return <Wishlist />;
    if (currentView === 'optic-detail' && selectedOpticId) return <OpticDetail opticId={selectedOpticId} onBack={navigateBack} onDeleted={() => { setSelectedOpticId(null); navigateTo('vault'); setVaultSection('optics'); }} />;
    if (currentView === 'style-demo')  return <StyleDemo />;
    if (currentView === 'more')        return <MoreMenu onNavigate={(v) => navigateTo(v as AppView)} onFeedbackOpen={() => setShowFeedback(true)} />;
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
        onNavigateToHome={() => navigateTo('home')}
        onNavigateToVault={() => { setSelectedGun(null); navigateTo('vault'); setVaultSection('guns'); }}
        onNavigateToSessions={() => { setSessionFilterGunId(null); navigateTo('sessions'); }}
        onNavigateToTargetAnalysis={() => navigateTo('target-analysis')}
        onNavigateToMore={() => navigateTo('more')}
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
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} onFeedback={() => { setShowUpgrade(false); setShowFeedback(true); }} onUpgradeSuccess={() => setIsPro(true)} />}
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
      position: 'fixed',
      bottom: 'calc(72px + env(safe-area-inset-bottom) + 8px)',
      left: '16px',
      right: '16px',
      maxWidth: '480px',
      margin: '0 auto',
      zIndex: 9999,
      backgroundColor: '#0e0e2a',
      border: `0.5px solid ${theme.border}`,
      borderRadius: '8px',
      padding: '12px 16px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textPrimary }}>{action}</span>
      <button onClick={onUndo} style={{
        background: 'none', border: 'none', padding: '4px 8px',
        color: theme.accent, fontSize: '13px', fontWeight: 600,
        letterSpacing: '0.05em', cursor: 'pointer', fontFamily: 'monospace',
        flexShrink: 0,
      }}>
        UNDO
      </button>
    </div>
  );
}

export default App;
