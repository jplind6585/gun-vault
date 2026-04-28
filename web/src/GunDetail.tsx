import React, { useState, useEffect } from 'react';
import { theme } from './theme';
import type { Gun, Session, GunAccessories, TargetAnalysisRecord } from './types';
import { getSessionsForGun, getAllAmmo, updateAmmo, updateGun, getAnalysesForGun } from './storage';
import { getSettings } from './SettingsPanel';
import { SessionLoggingModal } from './SessionLoggingModal';
import { GunSilhouetteImage } from './SimpleSilhouettes';
import { typeAccent } from './GunVault';
import { getGunBlurb } from './gunDescriptions';
import { callGunPrecisionCoach } from './claudeApi';
import { AssistantContextPrompt } from './lib/AssistantContextPrompt';
import { useAuth } from './auth/AuthProvider';
import { supabase } from './lib/supabase';
import { PhotoCapture } from './photos/PhotoCapture';
import { GradeAGun } from './photos/GradeAGun';
import { getPhotoAssetsForGun, deletePhotoAsset, getLatestGradeAssessment, uploadPhoto, savePhotoAsset } from './photos/photoService';
import { inferGunTypeProfile, getShotsForSet, getSetCompletionStatus, type PhotoAsset, type GunTypeProfile, type SetType, type GradeAssessment } from './photos/photoTypes';

interface GunDetailProps {
  gun: Gun;
  onBack: () => void;
  onGunUpdated: () => void;
  onLogSession?: (gun: Gun) => void;
  onViewSessions?: (gunId: string) => void;
  isPro?: boolean;
  onUpgrade?: (reason: string) => void;
}

type DetailTab = 'overview' | 'sessions' | 'maintenance' | 'ammo' | 'timeline' | 'photos';
type Period = 'week' | 'month' | 'year';

const PURPOSE_LABELS = ['Plinking', 'Self Defense', 'EDC', 'Hunting', 'Competition', 'Home Defense', 'Duty', 'Collector'] as const;

function sdOf(vals: number[]): number {
  if (vals.length < 2) return 0;
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  return Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / (vals.length - 1));
}

export function GunDetail({ gun: initialGun, onBack, onGunUpdated, onLogSession, onViewSessions, isPro, onUpgrade }: GunDetailProps) {
  const [gun, setGun]                 = useState(initialGun);
  const [sessions, setSessions]       = useState<Session[]>([]);
  const [tab, setTab]                 = useState<DetailTab>('overview');
  const [period, setPeriod]           = useState<Period>('month');
  const [showLogSession, setShowLogSession] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  // Editable fields
  const [editNotes, setEditNotes]     = useState(gun.notes || '');
  const [editAccessories, setEditAccessories] = useState<GunAccessories>(gun.accessories || {});
  const [editOpenIssues, setEditOpenIssues] = useState(gun.openIssues || '');
  const [showZeroForm, setShowZeroForm]     = useState(false);
  const [showMarkSold, setShowMarkSold]     = useState(false);
  const [soldDateInput, setSoldDateInput]   = useState('');
  const [soldPriceInput, setSoldPriceInput] = useState('');
  const [zeroDistInput, setZeroDistInput]   = useState('');
  const [zeroDistUnit, setZeroDistUnit]     = useState<'yd' | 'm' | 'ft'>(() => {
    const units = getSettings().units;
    return units === 'metric' ? 'm' : 'yd';
  });
  const [editingIssues, setEditingIssues]   = useState(false);
  const [issuesDraft, setIssuesDraft]       = useState(gun.openIssues || '');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [aiPrecisionResult, setAiPrecisionResult] = useState<string | null>(null);
  const [aiPrecisionLoading, setAiPrecisionLoading] = useState(false);
  const [specsOpen, setSpecsOpen] = useState(false);
  const [heroCollapsed, setHeroCollapsed] = useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [, forceAmmoRefresh] = useState(0);

  // ── Photo system ──────────────────────────────────────────────────────────
  const gunTypeProfile: GunTypeProfile = inferGunTypeProfile(gun.type, gun.action);
  const { user }                        = useAuth();
  const userId                          = user?.id ?? null;
  const [photoAssets, setPhotoAssets]   = useState<PhotoAsset[]>([]);
  const [latestGrade, setLatestGrade]   = useState<GradeAssessment | null>(null);
  const [showCapture, setShowCapture]   = useState(false);
  const [showGrade, setShowGrade]       = useState(false);
  const [activeSetType, setActiveSetType] = useState<SetType>('insurance');
  const [galleryUploading, setGalleryUploading] = useState(false);
  const galleryInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      getPhotoAssetsForGun(userId, gun.id),
      getLatestGradeAssessment(userId, gun.id),
    ]).then(([assets, grade]) => {
      setPhotoAssets(assets);
      setLatestGrade(grade);
    });
  }, [userId, gun.id]);

  async function refreshPhotos() {
    if (!userId) return;
    const [assets, grade] = await Promise.all([
      getPhotoAssetsForGun(userId, gun.id),
      getLatestGradeAssessment(userId, gun.id),
    ]);
    setPhotoAssets(assets);
    setLatestGrade(grade);
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    const galleryAssets = photoAssets.filter(a => !a.setType && !a.shotType);
    if (galleryAssets.length >= 5) return;
    setGalleryUploading(true);
    try {
      // Resize to max 1600px JPEG before uploading — raw iOS HEIC can be 15MB+
      const blob = await new Promise<Blob>((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(url);
          const MAX = 1600;
          const scale = Math.min(1, MAX / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(b => b ? resolve(b) : reject(new Error('resize failed')), 'image/jpeg', 0.88);
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('load failed')); };
        img.src = url;
      });

      const uploaded = await uploadPhoto(userId, gun.id, 'gallery', blob);
      if (uploaded) {
        await savePhotoAsset({ userId, gunId: gun.id, setId: null, setType: null, shotType: null, storagePath: uploaded.path, storageUrl: uploaded.url });
        await refreshPhotos();
      }
    } catch (err) {
      console.error('[gallery] upload error:', err);
    } finally {
      setGalleryUploading(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  }

  // ── Precision metrics (computed from target analyses) ─────────────────────
  const [analyses, setAnalyses] = useState<TargetAnalysisRecord[]>([]);
  useEffect(() => {
    setAnalyses(getAnalysesForGun(gun.id).sort((a, b) => a.date.localeCompare(b.date)));
  }, [gun.id]);

  const precisionMetrics = (() => {
    if (analyses.length === 0) return null;
    const moas = analyses.map(a => a.stats.extremeSpreadMoa);
    const last3 = moas.slice(-3);
    const ninetyDaysAgo = new Date(); ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const oldMoas = analyses.filter(a => new Date(a.date + 'T12:00:00') < ninetyDaysAgo).map(a => a.stats.extremeSpreadMoa);
    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
    const last3Avg = avg(last3);
    const oldAvg = avg(oldMoas);
    const bestIn = Math.min(...analyses.map(a => a.stats.extremeSpreadIn));
    const bestMoa = Math.min(...moas);
    const consistency = sdOf(moas);
    let trend: 'improving' | 'degrading' | 'stable' | null = null;
    if (last3Avg !== null && oldAvg !== null) {
      const delta = last3Avg - oldAvg;
      trend = delta < -0.15 ? 'improving' : delta > 0.15 ? 'degrading' : 'stable';
    }
    return { count: analyses.length, last3Avg, oldAvg, bestIn, bestMoa, consistency, trend };
  })();

  async function runAiPrecisionAnalysis() {
    if (!precisionMetrics) return;
    setAiPrecisionLoading(true);
    setAiPrecisionResult(null);
    const lines = [
      `Total analyses: ${precisionMetrics.count}`,
      `All-time best group: ${precisionMetrics.bestIn.toFixed(3)}" (${precisionMetrics.bestMoa.toFixed(2)} MOA)`,
      precisionMetrics.last3Avg !== null ? `Last 3 sessions avg ES: ${precisionMetrics.last3Avg.toFixed(2)} MOA` : '',
      precisionMetrics.oldAvg !== null ? `90+ days ago avg ES: ${precisionMetrics.oldAvg.toFixed(2)} MOA` : '',
      `Group size consistency (SD): ${precisionMetrics.consistency.toFixed(2)} MOA`,
      '',
      'Individual analyses (oldest → newest):',
      ...analyses.map(a => `  ${a.date} · ${a.distanceYds}yd · ${a.stats.shotCount} shots · ES ${a.stats.extremeSpreadMoa.toFixed(2)} MOA`),
    ].filter(Boolean);
    try {
      const result = await callGunPrecisionCoach(`${gun.make} ${gun.model} (${gun.caliber})`, lines.join('\n'));
      setAiPrecisionResult(result);
    } catch {
      setAiPrecisionResult('Analysis unavailable. Check your API key in Settings.');
    }
    setAiPrecisionLoading(false);
  }

  const blurb   = getGunBlurb(gun);
  const accent  = typeAccent[gun.type] || theme.textMuted;
  const now     = new Date();

  useEffect(() => {
    setSessions(getSessionsForGun(gun.id).sort((a, b) => b.date.localeCompare(a.date)));
  }, [gun.id]);

  // ── Period filter ──────────────────────────────────────────────────────────
  function inPeriod(dateStr: string): boolean {
    const d = new Date(dateStr + 'T12:00:00');
    if (period === 'week')  { const c = new Date(now); c.setDate(now.getDate() - 7); return d >= c; }
    if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    return d.getFullYear() === now.getFullYear();
  }
  const periodSessions   = sessions.filter(s => inPeriod(s.date));
  const periodRounds     = periodSessions.reduce((s, x) => s + x.roundsExpended, 0);
  const avgRounds        = periodSessions.length > 0 ? Math.round(periodRounds / periodSessions.length) : 0;

  // ── Lifetime stats ─────────────────────────────────────────────────────────
  const lastSession    = sessions[0];
  const daysSinceLast  = lastSession
    ? Math.floor((now.getTime() - new Date(lastSession.date + 'T12:00:00').getTime()) / 86400000)
    : null;
  const hasRecentIssues = sessions.slice(0, 5).some(s => s.issues);

  // ── Maintenance ────────────────────────────────────────────────────────────
  const shotsSinceClean = gun.lastCleanedRoundCount != null
    ? (gun.roundCount || 0) - gun.lastCleanedRoundCount
    : null;

  // ── Ammo performance ──────────────────────────────────────────────────────
  const ammoLots       = getAllAmmo().filter(l => {
    const lc = l.caliber.toLowerCase();
    const gc = (gun.caliber || '').toLowerCase();
    return lc.includes(gc) || gc.includes(lc);
  });
  // Sessions that had no issues and reference an ammo lot
  const cleanSessions  = sessions.filter(s => !s.issues && s.ammoLotId);
  const ammoScores: Record<string, { name: string; sessions: number; rounds: number; issues: number }> = {};
  for (const s of sessions) {
    if (!s.ammoLotId) continue;
    const lot = ammoLots.find(l => l.id === s.ammoLotId);
    if (!lot) continue;
    const key = s.ammoLotId;
    if (!ammoScores[key]) ammoScores[key] = { name: `${lot.brand} ${lot.productLine} ${lot.grainWeight}gr`, sessions: 0, rounds: 0, issues: 0 };
    ammoScores[key].sessions++;
    ammoScores[key].rounds += s.roundsExpended;
    if (s.issues) ammoScores[key].issues++;
  }
  const topAmmo = Object.values(ammoScores)
    .sort((a, b) => (a.issues / (a.sessions || 1)) - (b.issues / (b.sessions || 1)) || b.rounds - a.rounds)
    .slice(0, 3);

  // ── Ammo preferred toggle ──────────────────────────────────────────────────
  type PreferredPurpose = 'match' | 'defensive' | 'training';
  function togglePreferred(lotId: string, purpose: PreferredPurpose) {
    const allCaliber = getAllAmmo().filter(l => {
      const lc = l.caliber.toLowerCase(); const gc = (gun.caliber || '').toLowerCase();
      return lc.includes(gc) || gc.includes(lc);
    });
    // Clear this purpose from any other lot for this gun's caliber
    for (const l of allCaliber) {
      if (l.id === lotId) continue;
      if (l.preferredFor?.includes(purpose)) {
        updateAmmo(l.id, { preferredFor: l.preferredFor.filter(p => p !== purpose) });
      }
    }
    // Toggle on the target lot
    const lot = allCaliber.find(l => l.id === lotId);
    if (!lot) return;
    const current = lot.preferredFor ?? [];
    const next = current.includes(purpose) ? current.filter(p => p !== purpose) : [...current, purpose];
    updateAmmo(lotId, { preferredFor: next });
    forceAmmoRefresh(k => k + 1);
  }

  // ── Save helpers ───────────────────────────────────────────────────────────
  function saveField(updates: Partial<Gun>) {
    const updated = { ...gun, ...updates };
    updateGun(gun.id, updated);
    setGun(updated);
    setEditingField(null);
    onGunUpdated();
  }

  function persist(updates: Partial<Gun>) {
    const updated = { ...gun, ...updates };
    updateGun(gun.id, updated);
    setGun(updated);
    onGunUpdated();
  }

  function logClean() {
    const today = new Date().toISOString().split('T')[0];
    persist({ lastCleanedDate: today, lastCleanedRoundCount: gun.roundCount || 0 });
  }

  function logZero() {
    const val = parseFloat(zeroDistInput);
    if (!val || val <= 0) return;
    const toYards = zeroDistUnit === 'm' ? val * 1.09361 : zeroDistUnit === 'ft' ? val / 3 : val;
    const distYards = Math.round(toYards);
    const today = new Date().toISOString().split('T')[0];
    persist({ lastZeroDate: today, lastZeroDistance: distYards, lastZeroDistanceUnit: zeroDistUnit });
    setShowZeroForm(false);
    setZeroDistInput('');
  }

  function formatZeroDist(yards: number, unit?: 'yd' | 'm' | 'ft'): string {
    if (!unit || unit === 'yd') return `${yards} yd`;
    if (unit === 'm') return `${Math.round(yards / 1.09361)} m`;
    return `${Math.round(yards * 3)} ft`;
  }

  function saveIssues() {
    persist({ openIssues: issuesDraft });
    setEditingIssues(false);
  }

  function handleSessionLogged() {
    setSessions(getSessionsForGun(gun.id).sort((a, b) => b.date.localeCompare(a.date)));
    onGunUpdated();
  }

  // ── Tab change — commit any open inline edits before switching ─────────────
  function handleTabChange(t: DetailTab) {
    if (showZeroForm) {
      const val = parseFloat(zeroDistInput);
      if (val && val > 0) logZero();
      else { setShowZeroForm(false); setZeroDistInput(''); }
    }
    if (editingIssues) {
      persist({ openIssues: issuesDraft });
      setEditingIssues(false);
    }
    setTab(t);
  }

  function formatDate(d: string) {
    return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // ── Shared styles ──────────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    backgroundColor: theme.surface,
    border: `0.5px solid ${theme.border}`,
    borderRadius: '8px',
    padding: '14px 16px',
    marginBottom: '10px',
  };
  const sectionLabel: React.CSSProperties = {
    fontFamily: 'monospace', fontSize: '9px',
    letterSpacing: '1.2px', color: theme.textMuted,
    textTransform: 'uppercase', marginBottom: '10px',
  };
  const labelStyle: React.CSSProperties = {
    fontFamily: 'monospace', fontSize: '9px',
    letterSpacing: '0.8px', color: theme.textMuted,
    textTransform: 'uppercase', marginBottom: '3px',
  };
  const valStyle: React.CSSProperties = {
    fontFamily: 'monospace', fontSize: '12px',
    color: theme.textPrimary, fontWeight: 600,
  };
  const periodBtn = (active: boolean): React.CSSProperties => ({
    padding: '4px 10px',
    backgroundColor: active ? theme.textPrimary : 'transparent',
    border: `0.5px solid ${active ? theme.textPrimary : theme.border}`,
    borderRadius: '3px',
    color: active ? theme.bg : theme.textMuted,
    fontFamily: 'monospace', fontSize: '9px',
    letterSpacing: '0.8px', fontWeight: active ? 700 : 400,
    cursor: 'pointer',
  });
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    backgroundColor: theme.bg,
    border: `0.5px solid ${theme.border}`,
    borderRadius: '4px',
    color: theme.textPrimary,
    fontFamily: 'monospace',
    fontSize: '12px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div
      ref={scrollRef}
      onScroll={e => setHeroCollapsed((e.currentTarget.scrollTop) > 90)}
      style={{
        height: '100vh',
        overflowY: 'auto',
        backgroundColor: theme.bg,
        maxWidth: '480px',
        margin: '0 auto',
        boxSizing: 'border-box',
        paddingBottom: '100px',
      }}
    >

      {/* ── SLIM STICKY BAR ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 30,
        backgroundColor: theme.bg,
        borderBottom: heroCollapsed ? `0.5px solid ${theme.border}` : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        transition: 'border-color 0.15s',
      }}>
        <button onClick={onBack} style={{
          padding: '6px 12px', backgroundColor: 'transparent',
          border: `0.5px solid ${theme.border}`, borderRadius: '6px',
          color: theme.textSecondary, fontFamily: 'monospace',
          fontSize: '11px', cursor: 'pointer', letterSpacing: '0.5px', flexShrink: 0,
        }}>
          ← VAULT
        </button>

        {/* Center — only visible when hero collapsed */}
        {heroCollapsed && (
          <div style={{ flex: 1, textAlign: 'center', padding: '0 10px', minWidth: 0 }}>
            <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: theme.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {gun.displayName || `${gun.make} ${gun.model}`}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: accent, letterSpacing: '0.5px' }}>
              {gun.caliber}
            </div>
          </div>
        )}

        <button onClick={() => setShowLogSession(true)} style={{
          padding: '6px 14px', backgroundColor: theme.accent,
          border: 'none', borderRadius: '6px', color: theme.bg,
          fontFamily: 'monospace', fontSize: '11px',
          letterSpacing: '0.8px', fontWeight: 700, cursor: 'pointer', flexShrink: 0,
        }}>
          + LOG
        </button>
      </div>

      {/* ── HERO ── */}
      <div style={{ padding: '12px 16px 0', textAlign: 'center' }}>

        {/* Large silhouette */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
          <GunSilhouetteImage gun={gun} color={accent} size={120} />
        </div>

        {/* Gun name */}
        <div style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 700, color: theme.textPrimary, lineHeight: 1.2, marginBottom: '8px' }}>
          {gun.displayName || `${gun.make} ${gun.model}`}
        </div>

        {/* Caliber + status row */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <span style={{
            padding: '3px 10px', backgroundColor: theme.surface,
            border: `0.5px solid ${accent}`,
            borderRadius: '4px', fontFamily: 'monospace', fontSize: '11px',
            color: accent, letterSpacing: '0.5px', fontWeight: 600,
          }}>
            {gun.caliber}
          </span>
          <span style={{
            padding: '3px 8px', backgroundColor: theme.surface,
            border: `0.5px solid ${gun.status === 'Active' ? theme.green : theme.border}`,
            borderRadius: '4px', fontFamily: 'monospace', fontSize: '10px',
            color: gun.status === 'Active' ? theme.green : theme.textMuted,
            letterSpacing: '0.5px',
          }}>
            {gun.status?.toUpperCase() || 'UNKNOWN'}
          </span>
          {gun.crFlag && (
            <span style={{ padding: '3px 8px', backgroundColor: theme.surface, border: `0.5px solid ${accent}`, borderRadius: '4px', fontFamily: 'monospace', fontSize: '9px', color: accent, letterSpacing: '0.5px' }}>C&R</span>
          )}
          {gun.nfaItem && (
            <span style={{ padding: '3px 8px', backgroundColor: theme.surface, border: `0.5px solid ${theme.red}`, borderRadius: '4px', fontFamily: 'monospace', fontSize: '9px', color: theme.red, letterSpacing: '0.5px' }}>NFA</span>
          )}
        </div>

        {/* Round count */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '32px', fontWeight: 700, color: accent, lineHeight: 1 }}>
            {(gun.roundCount || 0).toLocaleString()}
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, letterSpacing: '1px', marginTop: '4px' }}>
            TOTAL ROUNDS
          </div>
        </div>
      </div>

      {/* ── TABS (sticky below slim bar) ── */}
      <div style={{
        position: 'sticky', top: '44px', zIndex: 20,
        backgroundColor: theme.bg, paddingBottom: '2px',
      }}>
        <div style={{ display: 'flex', margin: '0 16px 12px', border: `0.5px solid ${theme.border}`, borderRadius: '6px', overflow: 'hidden' }}>
          {([
            ['overview', 'OVERVIEW'],
            ['sessions', sessions.length > 0 ? 'SESSIONS (' + sessions.length + ')' : 'SESSIONS'],
            ['maintenance', 'MAINT'],
            ['ammo', 'AMMO'],
            ['timeline', 'TIMELINE'],
            ['photos', 'PHOTOS'],
          ] as [DetailTab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => handleTabChange(t)} style={{
              flex: 1, padding: '10px 2px',
              backgroundColor: tab === t ? theme.textPrimary : 'transparent',
              border: 'none', color: tab === t ? theme.bg : theme.textMuted,
              fontFamily: 'monospace', fontSize: '9px',
              letterSpacing: '0.5px', fontWeight: tab === t ? 700 : 400,
              cursor: 'pointer', textTransform: 'uppercase',
            }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>

        {/* ══ OVERVIEW TAB ══ */}
        {tab === 'overview' && (
          <>

            {/* ── GUN META ROW ── */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '10px' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted }}>{gun.type}</span>
              <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>·</span>
              <span style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted }}>{gun.action}</span>
              {gun.capacity && <>
                <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>·</span>
                <span style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted }}>{gun.capacity}+1</span>
              </>}
            </div>

            {/* Mark as sold */}
            {gun.status !== 'Sold' && gun.status !== 'Transferred' && (
              <div style={{ marginBottom: '10px' }}>
                {!showMarkSold ? (
                  <button onClick={() => { setSoldDateInput(new Date().toISOString().split('T')[0]); setShowMarkSold(true); }} style={{
                    padding: '4px 10px', backgroundColor: 'transparent',
                    border: `0.5px solid ${theme.border}`, borderRadius: '4px',
                    color: theme.textMuted, fontFamily: 'monospace', fontSize: '9px',
                    cursor: 'pointer', letterSpacing: '0.5px',
                  }}>MARK AS SOLD</button>
                ) : (
                  <div style={{ ...card, display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input type="date" value={soldDateInput} onChange={e => setSoldDateInput(e.target.value)}
                      style={{ padding: '5px 8px', backgroundColor: theme.bg, border: `0.5px solid ${theme.border}`, borderRadius: '4px', color: theme.textPrimary, fontFamily: 'monospace', fontSize: '10px', outline: 'none' }} />
                    <input type="number" value={soldPriceInput} onChange={e => setSoldPriceInput(e.target.value)}
                      placeholder="Sale price ($)" min={0}
                      style={{ width: '120px', padding: '5px 8px', backgroundColor: theme.bg, border: `0.5px solid ${theme.border}`, borderRadius: '4px', color: theme.textPrimary, fontFamily: 'monospace', fontSize: '10px', outline: 'none' }} />
                    <button onClick={() => {
                      persist({ status: 'Sold', soldDate: soldDateInput || undefined, soldPrice: soldPriceInput ? parseFloat(soldPriceInput) : undefined });
                      setShowMarkSold(false);
                    }} style={{ padding: '5px 12px', backgroundColor: theme.red, border: 'none', borderRadius: '4px', color: '#fff', fontFamily: 'monospace', fontSize: '9px', fontWeight: 700, cursor: 'pointer' }}>CONFIRM SOLD</button>
                    <button onClick={() => setShowMarkSold(false)} style={{ padding: '5px 8px', backgroundColor: 'transparent', border: `0.5px solid ${theme.border}`, borderRadius: '4px', color: theme.textMuted, fontFamily: 'monospace', fontSize: '9px', cursor: 'pointer' }}>×</button>
                  </div>
                )}
              </div>
            )}
            {gun.status === 'Sold' && (gun.soldDate || gun.soldPrice) && (
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginBottom: '10px' }}>
                {'Sold' + (gun.soldDate ? ' ' + formatDate(gun.soldDate) : '') + (gun.soldPrice ? ' · $' + gun.soldPrice.toLocaleString() : '')}
              </div>
            )}

            {/* ── OPEN ISSUES ALERT ── */}
            {gun.openIssues && (
              <div style={{
                ...card,
                borderLeft: `3px solid ${theme.red}`,
                backgroundColor: 'rgba(255,107,107,0.07)',
                padding: '10px 14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', color: theme.red }}>⚠</span>
                  <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '1px', color: theme.red, textTransform: 'uppercase' }}>Open Issue</div>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textPrimary, lineHeight: '1.5' }}>
                  {gun.openIssues}
                </div>
              </div>
            )}

            {/* ── YOUR HISTORY ── */}
            <div style={{ ...card, borderLeft: `3px solid ${theme.border}` }}>
              <div style={sectionLabel}>YOUR HISTORY</div>
              <div style={{ display: 'flex', gap: '0', marginBottom: blurb ? '12px' : 0 }}>
                {[
                  { val: (gun.roundCount || 0).toLocaleString(), lbl: 'ROUNDS' },
                  { val: sessions.length.toString(), lbl: 'SESSIONS' },
                  { val: daysSinceLast !== null ? `${daysSinceLast}d` : '—', lbl: 'LAST SHOT' },
                ].map((item, i) => (
                  <div key={item.lbl} style={{ flex: 1, textAlign: 'center', borderLeft: i > 0 ? `1px solid ${theme.border}` : 'none', padding: '4px 0' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '22px', fontWeight: 700, color: accent, lineHeight: 1 }}>{item.val}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '8px', color: theme.textMuted, marginTop: '4px', letterSpacing: '0.8px' }}>{item.lbl}</div>
                  </div>
                ))}
              </div>
              {sessions.length > 0 && (
                <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginBottom: blurb ? '10px' : 0 }}>
                  {'First session: ' + (() => {
                    const oldest = sessions[sessions.length - 1];
                    return new Date(oldest.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  })()}
                </div>
              )}
              {blurb && (
                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textSecondary, lineHeight: '1.6', borderTop: `1px solid ${theme.border}`, paddingTop: '10px' }}>
                  {blurb}
                </div>
              )}
            </div>

            {/* ── MOUNTED OPTIC ── */}
            {gun.accessories?.optic && (
              <div style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={labelStyle}>MOUNTED OPTIC</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '13px', color: theme.textPrimary, marginTop: '2px' }}>
                    {gun.accessories.optic}
                  </div>
                  {gun.accessories.opticMagnification && (
                    <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginTop: '2px' }}>
                      {gun.accessories.opticMagnification}
                    </div>
                  )}
                </div>
                {gun.lastZeroDistance && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: theme.orange }}>
                      {formatZeroDist(gun.lastZeroDistance, gun.lastZeroDistanceUnit)}
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '8px', color: theme.textMuted, marginTop: '2px', letterSpacing: '0.5px' }}>ZERO</div>
                  </div>
                )}
              </div>
            )}

            {/* ── PERIOD STATS ── */}
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={sectionLabel}>ACTIVITY</div>
                  {onViewSessions && sessions.length > 0 && (
                    <button onClick={() => onViewSessions(gun.id)} style={{ padding: '2px 8px', background: 'transparent', border: `0.5px solid ${theme.border}`, borderRadius: 3, fontFamily: 'monospace', fontSize: '8px', color: theme.textMuted, cursor: 'pointer', letterSpacing: '0.5px' }}>
                      ALL SESSIONS →
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {(['week', 'month', 'year'] as Period[]).map(p => (
                    <button key={p} style={periodBtn(period === p)} onClick={() => setPeriod(p)}>
                      {p === 'week' ? 'WK' : p === 'month' ? 'MO' : 'YR'}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {[
                  { val: periodRounds.toLocaleString(), lbl: 'Rounds' },
                  { val: periodSessions.length.toString(), lbl: 'Sessions' },
                  { val: avgRounds > 0 ? avgRounds.toString() : '—', lbl: 'Avg / Sess' },
                ].map(item => (
                  <div key={item.lbl}>
                    <div style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 700, color: theme.textPrimary, lineHeight: 1 }}>{item.val}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginTop: '3px' }}>{item.lbl}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── SPECS (collapsible) ── */}
            <div style={card}>
              <button
                onClick={() => setSpecsOpen(o => !o)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                }}
              >
                <div style={sectionLabel}>SPECS</div>
                <span style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textMuted }}>
                  {specsOpen ? '▴' : '▾'}
                </span>
              </button>
              {specsOpen && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
                    {gun.condition && (
                      <div><div style={labelStyle}>Condition</div><div style={valStyle}>{gun.condition}</div></div>
                    )}
                    {gun.barrelLength && (
                      <div><div style={labelStyle}>Barrel</div><div style={valStyle}>{gun.barrelLength}"</div></div>
                    )}
                    {gun.overallLength && (
                      <div><div style={labelStyle}>Overall Length</div><div style={valStyle}>{gun.overallLength}"</div></div>
                    )}
                    {gun.weight && (
                      <div><div style={labelStyle}>Weight</div><div style={valStyle}>{gun.weight} oz</div></div>
                    )}
                    {gun.capacity && (
                      <div><div style={labelStyle}>Capacity</div><div style={valStyle}>{gun.capacity}+1</div></div>
                    )}
                    {gun.finish && (
                      <div><div style={labelStyle}>Finish</div><div style={valStyle}>{gun.finish}</div></div>
                    )}
                    {gun.acquiredDate && (
                      <div><div style={labelStyle}>Acquired</div><div style={valStyle}>{new Date(gun.acquiredDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div></div>
                    )}
                    {gun.acquiredPrice && (
                      <div><div style={labelStyle}>Paid</div><div style={valStyle}>{'$' + gun.acquiredPrice.toLocaleString()}</div></div>
                    )}
                    {gun.acquiredFrom && (
                      <div><div style={labelStyle}>From</div><div style={valStyle}>{gun.acquiredFrom}</div></div>
                    )}
                    {gun.estimatedFMV && (
                      <div><div style={labelStyle}>Est. Value</div><div style={{ ...valStyle, color: theme.green }}>{'$' + gun.estimatedFMV.toLocaleString()}</div></div>
                    )}
                    {gun.insuranceValue && (
                      <div><div style={labelStyle}>Insured</div><div style={valStyle}>{'$' + gun.insuranceValue.toLocaleString()}</div></div>
                    )}
                  </div>
                  {gun.purpose && gun.purpose.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <div style={labelStyle}>Purpose</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                        {gun.purpose.map(p => (
                          <span key={p} style={{
                            padding: '3px 8px', backgroundColor: theme.bg,
                            border: `0.5px solid ${accent}`,
                            borderRadius: '3px', fontFamily: 'monospace',
                            fontSize: '9px', color: accent, letterSpacing: '0.5px',
                          }}>{p}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── MAINTENANCE LOG ── */}
            <div style={card}>
              <div style={{ ...sectionLabel, marginBottom: '14px' }}>MAINTENANCE</div>

              {/* 2×2 stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', marginBottom: '14px' }}>
                <div>
                  <div style={labelStyle}>Last Cleaned</div>
                  <div style={{ ...valStyle, color: gun.lastCleanedDate ? theme.textPrimary : theme.textMuted }}>
                    {gun.lastCleanedDate ? formatDate(gun.lastCleanedDate) : 'Not logged'}
                  </div>
                </div>
                <div>
                  <div style={labelStyle}>Shots Since Clean</div>
                  {shotsSinceClean != null ? (
                    <>
                      <div style={{ ...valStyle, color: shotsSinceClean >= 500 ? theme.orange : theme.green }}>
                        {shotsSinceClean.toLocaleString()}
                        {shotsSinceClean >= 500 && (
                          <span style={{ fontSize: '8px', marginLeft: '5px', letterSpacing: '0.5px' }}>OVERDUE</span>
                        )}
                      </div>
                      {/* Progress bar */}
                      <div style={{ height: '3px', backgroundColor: theme.border, borderRadius: '2px', marginTop: '5px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min(100, (shotsSinceClean / 500) * 100)}%`,
                          backgroundColor: shotsSinceClean >= 500 ? theme.orange : shotsSinceClean >= 300 ? theme.accent : theme.green,
                          borderRadius: '2px',
                        }} />
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: '8px', color: theme.textMuted, marginTop: '2px' }}>
                        {Math.min(shotsSinceClean, 500)}/500
                      </div>
                    </>
                  ) : (
                    <div style={{ ...valStyle, color: theme.textMuted }}>—</div>
                  )}
                </div>
                <div>
                  <div style={labelStyle}>Last Zeroed</div>
                  <div style={{ ...valStyle, color: gun.lastZeroDate ? theme.textPrimary : theme.textMuted }}>
                    {gun.lastZeroDate ? formatDate(gun.lastZeroDate) : 'Not logged'}
                  </div>
                </div>
                <div>
                  <div style={labelStyle}>Zero Distance</div>
                  <div style={{ ...valStyle, color: gun.lastZeroDistance ? theme.textPrimary : theme.textMuted }}>
                    {gun.lastZeroDistance ? formatZeroDist(gun.lastZeroDistance, gun.lastZeroDistanceUnit) : '—'}
                  </div>
                </div>
              </div>

              {/* Open issues — inline pencil edit */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <div style={labelStyle}>Open Issues</div>
                  {!editingIssues && (
                    <button
                      onClick={() => { setIssuesDraft(gun.openIssues || ''); setEditingIssues(true); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, fontSize: '13px', padding: '0', lineHeight: 1 }}
                    >✎</button>
                  )}
                </div>
                {editingIssues ? (
                  <>
                    <textarea
                      value={issuesDraft}
                      onChange={e => setIssuesDraft(e.target.value)}
                      rows={3}
                      autoFocus
                      placeholder="Describe any current known issues..."
                      style={{ ...inputStyle, resize: 'vertical', marginBottom: '6px' }}
                    />
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => setEditingIssues(false)} style={{
                        flex: 1, padding: '7px', backgroundColor: 'transparent',
                        border: `0.5px solid ${theme.border}`, borderRadius: '4px',
                        color: theme.textMuted, fontFamily: 'monospace', fontSize: '9px', cursor: 'pointer',
                      }}>CANCEL</button>
                      <button onClick={saveIssues} style={{
                        flex: 2, padding: '7px', backgroundColor: theme.accent,
                        border: 'none', borderRadius: '4px', color: theme.bg,
                        fontFamily: 'monospace', fontSize: '9px', fontWeight: 700, cursor: 'pointer',
                      }}>SAVE</button>
                    </div>
                  </>
                ) : (
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', lineHeight: '1.5', color: gun.openIssues ? theme.red : theme.green }}>
                    {gun.openIssues || 'None'}
                  </div>
                )}
              </div>

              {/* Log Zero inline form */}
              {showZeroForm && (
                <div style={{
                  backgroundColor: theme.bg, borderRadius: '6px', padding: '10px 12px',
                  border: `0.5px solid ${theme.border}`, marginBottom: '10px',
                }}>
                  <div style={labelStyle}>Zero Distance</div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <input
                        type="number"
                        value={zeroDistInput}
                        onChange={e => setZeroDistInput(e.target.value)}
                        placeholder={zeroDistUnit === 'm' ? 'e.g. 91' : zeroDistUnit === 'ft' ? 'e.g. 300' : 'e.g. 100'}
                        autoFocus
                        min={1}
                        style={{ ...inputStyle, paddingRight: '36px' }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') logZero();
                          if (e.key === 'Escape') { setShowZeroForm(false); setZeroDistInput(''); }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setZeroDistUnit(u => u === 'yd' ? 'm' : u === 'm' ? 'ft' : 'yd')}
                        style={{
                          position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
                          fontFamily: 'monospace', fontSize: '10px', color: theme.accent,
                          letterSpacing: '0.3px', lineHeight: 1,
                        }}
                      >{zeroDistUnit}</button>
                    </div>
                    <button onClick={logZero} style={{
                      padding: '8px 14px', backgroundColor: theme.accent,
                      border: 'none', borderRadius: '4px', color: theme.bg,
                      fontFamily: 'monospace', fontSize: '9px', fontWeight: 700, cursor: 'pointer', flexShrink: 0,
                    }}>SAVE</button>
                    <button onClick={() => { setShowZeroForm(false); setZeroDistInput(''); }} style={{
                      padding: '8px 10px', backgroundColor: 'transparent',
                      border: `0.5px solid ${theme.border}`, borderRadius: '4px',
                      color: theme.textMuted, fontFamily: 'monospace', fontSize: '13px', cursor: 'pointer', flexShrink: 0,
                    }}>×</button>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button onClick={logClean} style={{
                  padding: '11px', backgroundColor: theme.accent,
                  border: 'none', borderRadius: '6px', color: theme.bg,
                  fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.5px',
                  fontWeight: 700, cursor: 'pointer',
                }}>
                  LOG CLEAN
                </button>
                <button
                  onClick={() => { setShowZeroForm(z => !z); if (showZeroForm) setZeroDistInput(''); }}
                  style={{
                    padding: '11px', backgroundColor: 'transparent',
                    border: `0.5px solid ${showZeroForm ? theme.accent : theme.border}`,
                    borderRadius: '6px',
                    color: showZeroForm ? theme.accent : theme.textSecondary,
                    fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.5px',
                    fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  LOG ZERO
                </button>
              </div>
            </div>

            {/* ── ACCESSORIES ── */}
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={sectionLabel}>ACCESSORIES</div>
                {editingField !== 'accessories' ? (
                  <button onClick={() => setEditingField('accessories')} style={{
                    padding: '3px 8px', backgroundColor: 'transparent',
                    border: `0.5px solid ${theme.border}`, borderRadius: '4px',
                    color: theme.textMuted, fontFamily: 'monospace', fontSize: '9px', cursor: 'pointer',
                  }}>EDIT</button>
                ) : (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => setEditingField(null)} style={{
                      padding: '3px 8px', backgroundColor: 'transparent',
                      border: `0.5px solid ${theme.border}`, borderRadius: '4px',
                      color: theme.textMuted, fontFamily: 'monospace', fontSize: '9px', cursor: 'pointer',
                    }}>CANCEL</button>
                    <button onClick={() => saveField({ accessories: editAccessories })} style={{
                      padding: '3px 8px', backgroundColor: theme.accent,
                      border: 'none', borderRadius: '4px', color: theme.bg,
                      fontFamily: 'monospace', fontSize: '9px', fontWeight: 700, cursor: 'pointer',
                    }}>SAVE</button>
                  </div>
                )}
              </div>

              {editingField === 'accessories' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {([
                    ['optic',             'Optic'],
                    ['opticMagnification','Magnification'],
                    ['muzzleDevice',      'Muzzle Device'],
                    ['suppressor',        'Suppressor'],
                    ['weaponLight',       'Weapon Light'],
                    ['laser',             'Laser / IR'],
                    ['sling',             'Sling'],
                    ['bipod',             'Bipod'],
                    ['foregrip',          'Foregrip'],
                    ['stockGrip',         'Stock / Grip'],
                    ['magazineUpgrade',   'Magazine'],
                    ['other',             'Other'],
                  ] as [keyof GunAccessories, string][]).map(([field, label]) => (
                    <div key={field}>
                      <div style={labelStyle}>{label}</div>
                      <input
                        type="text"
                        value={editAccessories[field] || ''}
                        onChange={e => setEditAccessories(prev => ({ ...prev, [field]: e.target.value }))}
                        placeholder={`e.g. ${getAccessoryPlaceholder(field)}`}
                        style={inputStyle}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  {(() => {
                    const acc = gun.accessories;
                    if (!acc || Object.values(acc).every(v => !v)) {
                      return <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted }}>No accessories logged. Tap Edit to add.</div>;
                    }
                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                        {([
                          ['optic',             'Optic'],
                          ['opticMagnification','Magnification'],
                          ['muzzleDevice',      'Muzzle Device'],
                          ['suppressor',        'Suppressor'],
                          ['weaponLight',       'Weapon Light'],
                          ['laser',             'Laser'],
                          ['sling',             'Sling'],
                          ['bipod',             'Bipod'],
                          ['foregrip',          'Foregrip'],
                          ['stockGrip',         'Stock / Grip'],
                          ['magazineUpgrade',   'Magazine'],
                          ['other',             'Other'],
                        ] as [keyof GunAccessories, string][])
                          .filter(([f]) => acc[f])
                          .map(([f, l]) => (
                            <div key={f}>
                              <div style={labelStyle}>{l}</div>
                              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textPrimary }}>{acc[f]}</div>
                            </div>
                          ))
                        }
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* ── AMMO PERFORMANCE ── */}
            {topAmmo.length > 0 && (
              <div style={card}>
                <div style={sectionLabel}>AMMO PERFORMANCE</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {topAmmo.map((a, i) => (
                    <div key={a.name} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '8px 10px', backgroundColor: theme.bg, borderRadius: '6px',
                      borderLeft: `3px solid ${i === 0 ? accent : theme.border}`,
                    }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '10px', color: i === 0 ? accent : theme.textMuted, fontWeight: 700, width: '16px', flexShrink: 0 }}>#{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginTop: '2px' }}>
                          {a.sessions} sessions · {a.rounds} rds
                          {a.issues > 0 && <span style={{ color: theme.red, marginLeft: '6px' }}>{a.issues} issue{a.issues > 1 ? 's' : ''}</span>}
                        </div>
                      </div>
                      {a.issues === 0 && (
                        <span style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.green, flexShrink: 0 }}>✓ CLEAN</span>
                      )}
                    </div>
                  ))}
                </div>
                {topAmmo.length === 0 && (
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted }}>
                    Log sessions with ammo lots to see performance data.
                  </div>
                )}
              </div>
            )}

            {/* ── PRECISION ── */}
            <div style={card}>
              <div style={sectionLabel}>PRECISION</div>
              {precisionMetrics === null ? (
                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted, lineHeight: 1.6 }}>
                  No target analyses linked to this gun yet.{'\n'}Select this gun in Target Analysis to start tracking precision over time.
                </div>
              ) : (
                <>
                  {/* Stat grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', marginBottom: 12 }}>
                    <div>
                      <div style={labelStyle}>Analyses</div>
                      <div style={valStyle}>{precisionMetrics.count}</div>
                    </div>
                    <div>
                      <div style={labelStyle}>Best Group</div>
                      <div style={{ ...valStyle, color: theme.accent }}>{precisionMetrics.bestIn.toFixed(3)}" · {precisionMetrics.bestMoa.toFixed(2)} MOA</div>
                    </div>
                    {precisionMetrics.last3Avg !== null && (
                      <div>
                        <div style={labelStyle}>Last 3 Avg ES</div>
                        <div style={valStyle}>{precisionMetrics.last3Avg.toFixed(2)} MOA</div>
                      </div>
                    )}
                    {precisionMetrics.oldAvg !== null && (
                      <div>
                        <div style={labelStyle}>90-Day Ago Avg</div>
                        <div style={valStyle}>{precisionMetrics.oldAvg.toFixed(2)} MOA</div>
                      </div>
                    )}
                    {precisionMetrics.count >= 3 && (
                      <div>
                        <div style={labelStyle}>Consistency (SD)</div>
                        <div style={valStyle}>{precisionMetrics.consistency.toFixed(2)} MOA</div>
                      </div>
                    )}
                    {precisionMetrics.trend && (
                      <div>
                        <div style={labelStyle}>Trend</div>
                        <div style={{ ...valStyle, color: precisionMetrics.trend === 'improving' ? theme.green : precisionMetrics.trend === 'degrading' ? theme.red : theme.textMuted }}>
                          {precisionMetrics.trend === 'improving' ? '↓ Improving' : precisionMetrics.trend === 'degrading' ? '↑ Degrading' : '→ Stable'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AI analysis */}
                  {aiPrecisionResult ? (
                    <div style={{ padding: '10px 12px', borderRadius: 6, background: theme.bg, border: `0.5px solid ${theme.accent}`, marginBottom: 8 }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.accent, letterSpacing: '1px', marginBottom: 6 }}>AI ANALYSIS</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textSecondary, lineHeight: 1.6 }}>{aiPrecisionResult}</div>
                    </div>
                  ) : (
                    <button
                      onClick={runAiPrecisionAnalysis}
                      disabled={aiPrecisionLoading}
                      style={{ width: '100%', padding: '9px', backgroundColor: 'transparent', border: `0.5px solid ${theme.accent}`, borderRadius: 6, color: theme.accent, fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.5px', fontWeight: 600, cursor: aiPrecisionLoading ? 'default' : 'pointer', opacity: aiPrecisionLoading ? 0.6 : 1 }}
                    >
                      {aiPrecisionLoading ? 'ANALYZING...' : 'GET AI ANALYSIS'}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* ── NOTES ── */}
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={sectionLabel}>NOTES</div>
                {editingField !== 'notes' ? (
                  <button onClick={() => setEditingField('notes')} style={{
                    padding: '3px 8px', backgroundColor: 'transparent',
                    border: `0.5px solid ${theme.border}`, borderRadius: '4px',
                    color: theme.textMuted, fontFamily: 'monospace', fontSize: '9px', cursor: 'pointer',
                  }}>EDIT</button>
                ) : (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => { setEditingField(null); setEditNotes(gun.notes || ''); }} style={{
                      padding: '3px 8px', backgroundColor: 'transparent',
                      border: `0.5px solid ${theme.border}`, borderRadius: '4px',
                      color: theme.textMuted, fontFamily: 'monospace', fontSize: '9px', cursor: 'pointer',
                    }}>CANCEL</button>
                    <button onClick={() => saveField({ notes: editNotes })} style={{
                      padding: '3px 8px', backgroundColor: theme.accent,
                      border: 'none', borderRadius: '4px', color: theme.bg,
                      fontFamily: 'monospace', fontSize: '9px', fontWeight: 700, cursor: 'pointer',
                    }}>SAVE</button>
                  </div>
                )}
              </div>
              {editingField === 'notes' ? (
                <textarea
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  rows={4}
                  placeholder="Add notes about this firearm..."
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              ) : gun.notes ? (
                <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textSecondary, lineHeight: '1.6' }}>
                  {gun.notes}
                </div>
              ) : (
                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted }}>No notes. Tap Edit to add.</div>
              )}
            </div>

          </>
        )}

        {/* ══ SESSIONS TAB ══ */}
        {tab === 'sessions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sessions.length === 0 ? (
              <>
                {/* Ghost preview card */}
                <div style={{ ...card, opacity: 0.35, pointerEvents: 'none', border: `0.5px dashed ${theme.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: theme.textMuted }}>Apr 26, 2026</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: theme.textMuted }}>100 rds</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>Home Range</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, padding: '1px 5px', border: `0.5px solid ${theme.border}`, borderRadius: '3px' }}>OUTDOOR</span>
                  </div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted, marginBottom: '12px' }}>
                    Your range history will appear here
                  </div>
                  <button onClick={() => setShowLogSession(true)} style={{
                    padding: '10px 24px', backgroundColor: theme.accent,
                    border: 'none', borderRadius: '6px', color: theme.bg,
                    fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.8px',
                  }}>LOG FIRST SESSION</button>
                </div>
              </>
            ) : (() => {
              // Report card stats
              const totalRounds = sessions.reduce((s, x) => s + x.roundsExpended, 0);
              const avgRds = sessions.length > 0 ? Math.round(totalRounds / sessions.length) : 0;
              const issueCount = sessions.filter(s => s.issues).length;
              const issueRate = sessions.length > 0 ? Math.round((issueCount / sessions.length) * 100) : 0;
              const lastSessionDate = sessions[0]?.date;
              const lastDaysAgo = lastSessionDate ? Math.floor((now.getTime() - new Date(lastSessionDate + 'T12:00:00').getTime()) / 86400000) : null;
              const lastDayColor = lastDaysAgo === null ? theme.textMuted : lastDaysAgo <= 30 ? theme.green : lastDaysAgo <= 90 ? theme.accent : theme.red;

              // Cadence
              const sorted = sessions.slice().sort((a, b) => a.date.localeCompare(b.date));
              let avgGap: number | null = null;
              let streak = 0;
              if (sorted.length >= 2) {
                const gaps: number[] = [];
                for (let i = 1; i < sorted.length; i++) {
                  const d = Math.floor((new Date(sorted[i].date + 'T12:00:00').getTime() - new Date(sorted[i-1].date + 'T12:00:00').getTime()) / 86400000);
                  gaps.push(d);
                }
                avgGap = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
                // Count current streak (sessions without 14+ day gap from most recent)
                let broken = false;
                for (let i = sorted.length - 1; i > 0; i--) {
                  const d = Math.floor((new Date(sorted[i].date + 'T12:00:00').getTime() - new Date(sorted[i-1].date + 'T12:00:00').getTime()) / 86400000);
                  if (d >= 14) { broken = true; break; }
                  streak++;
                }
                if (!broken) streak = sorted.length;
              }

              // Session quality score
              function sessionQuality(s: Session): number {
                let score = 0;
                if (s.roundsExpended >= 100) score += 3;
                if (s.distanceYards && s.distanceYards >= 100) score += 2;
                if (!s.issues) score += 2;
                if (s.notes && s.notes.trim().length > 0) score += 1;
                return score;
              }

              return (
                <>
                  {/* Report card header */}
                  <div style={{ ...card, padding: '10px 14px', marginBottom: '4px' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, lineHeight: 1.8 }}>
                      <span style={{ color: theme.textPrimary, fontWeight: 700 }}>{totalRounds.toLocaleString()}</span> total rounds &nbsp;·&nbsp;
                      <span style={{ color: theme.textPrimary, fontWeight: 700 }}>{sessions.length}</span> sessions &nbsp;·&nbsp;
                      <span style={{ color: theme.textPrimary, fontWeight: 700 }}>{avgRds}</span> avg rds/session
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginTop: '2px' }}>
                      Issue rate: <span style={{ color: issueRate > 20 ? theme.red : theme.textSecondary }}>{issueRate}%</span>
                      {lastDaysAgo !== null && (
                        <span> &nbsp;·&nbsp; Last session: <span style={{ color: lastDayColor }}>{lastDaysAgo === 0 ? 'today' : `${lastDaysAgo}d ago`}</span></span>
                      )}
                    </div>
                  </div>

                  {/* Cadence line */}
                  {avgGap !== null && (
                    <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, padding: '0 2px 8px', lineHeight: 1.6 }}>
                      {lastDaysAgo !== null && <span style={{ color: lastDayColor }}>Last shot {lastDaysAgo}d ago</span>}
                      {lastDaysAgo !== null && avgGap !== null && ' · '}
                      {avgGap !== null && <span>Avg {avgGap}d between sessions</span>}
                      {streak >= 2 && <span> · <span style={{ color: theme.accent }}>{streak}-session streak</span></span>}
                    </div>
                  )}

                  {/* Session list */}
                  {sessions.map(session => {
                    const qScore = sessionQuality(session);
                    return (
                      <div key={session.id}
                        onClick={() => setSelectedSession(session)}
                        style={{
                          backgroundColor: theme.surface,
                          border: `0.5px solid ${session.issues ? theme.red : theme.border}`,
                          borderRadius: '8px', padding: '12px 14px',
                          cursor: 'pointer', position: 'relative',
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: theme.textPrimary }}>{formatDate(session.date)}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {qScore > 0 && (
                              <span style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, opacity: 0.6 }}>{qScore}</span>
                            )}
                            <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: accent }}>{session.roundsExpended} rds</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          {session.location && <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>{session.location}</span>}
                          {session.indoorOutdoor && (
                            <span style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, padding: '1px 5px', border: `0.5px solid ${theme.border}`, borderRadius: '3px' }}>
                              {session.indoorOutdoor.toUpperCase()}
                            </span>
                          )}
                          {session.issues && (
                            <span style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.red, padding: '1px 5px', border: `0.5px solid ${theme.red}`, borderRadius: '3px' }}>ISSUE</span>
                          )}
                        </div>
                        {session.notes && <div style={{ marginTop: '6px', fontFamily: 'monospace', fontSize: '11px', color: theme.textSecondary, fontStyle: 'italic' }}>{session.notes}</div>}
                        {session.issues && session.issueDescription && <div style={{ marginTop: '4px', fontFamily: 'monospace', fontSize: '11px', color: theme.red }}>{session.issueDescription}</div>}
                      </div>
                    );
                  })}
                </>
              );
            })()}
          </div>
        )}

        {/* ══ MAINTENANCE TAB ══ */}
        {tab === 'maintenance' && (
          <>

            {/* ── CLEANING STATUS ── */}
            <div style={card}>
              <div style={sectionLabel}>CLEANING STATUS</div>

              {/* Visual arc */}
              {(() => {
                const THRESHOLD = 500;
                const shots     = shotsSinceClean ?? 0;
                const pct       = Math.min(shots / THRESHOLD, 1);
                const arcColor  = shotsSinceClean == null ? theme.textMuted
                  : shots < 300 ? theme.green
                  : shots < THRESHOLD ? theme.orange
                  : theme.red;

                // SVG arc: cx=60 cy=60 r=50, stroke-dasharray based on pct
                // Half-circle arc from 180° to 0° (left to right, bottom-up sweep)
                const R = 50;
                const CX = 60;
                const CY = 62;
                const FULL = Math.PI * R; // half circumference
                const dash = pct * FULL;

                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px' }}>
                    <svg width="120" height="68" viewBox="0 0 120 68" style={{ flexShrink: 0 }}>
                      {/* Track */}
                      <path
                        d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
                        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" strokeLinecap="round"
                      />
                      {/* Fill */}
                      {shotsSinceClean != null && (
                        <path
                          d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
                          fill="none" stroke={arcColor} strokeWidth="8" strokeLinecap="round"
                          strokeDasharray={`${dash} ${FULL}`}
                        />
                      )}
                      {/* Center text */}
                      <text x={CX} y={CY - 10} textAnchor="middle"
                        fontFamily="monospace" fontSize="18" fontWeight="700" fill={arcColor}>
                        {shotsSinceClean == null ? '–' : shots.toLocaleString()}
                      </text>
                      <text x={CX} y={CY + 6} textAnchor="middle"
                        fontFamily="monospace" fontSize="8" fill={theme.textMuted} letterSpacing="1">
                        {'/ ' + THRESHOLD}
                      </text>
                    </svg>
                    <div>
                      <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, letterSpacing: '0.5px', marginBottom: '4px' }}>
                        SHOTS SINCE CLEAN
                      </div>
                      {gun.lastCleanedDate ? (
                        <>
                          <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textSecondary }}>
                            {'Last: ' + formatDate(gun.lastCleanedDate)}
                          </div>
                          {gun.lastCleanedRoundCount != null && (
                            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>
                              {'At ' + gun.lastCleanedRoundCount.toLocaleString() + ' rds'}
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted }}>
                          Never cleaned
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              <button onClick={logClean} style={{
                width: '100%', padding: '13px', backgroundColor: accent,
                border: 'none', borderRadius: '6px', color: theme.bg,
                fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.8px',
                fontWeight: 700, cursor: 'pointer', minHeight: '44px',
              }}>
                MARK CLEANED
              </button>

              {/* Contextual assistant prompt for free users when gun needs cleaning */}
              {shotsSinceClean != null && shotsSinceClean >= 300 && (
                <div style={{ marginTop: '12px' }}>
                  <AssistantContextPrompt
                    isPro={isPro ?? false}
                    reason="assistant_cleaning"
                    label={`Ask the Armory Assistant about cleaning this ${gun.action?.toLowerCase() ?? 'firearm'} after ${shotsSinceClean.toLocaleString()} rounds`}
                    onUpgrade={onUpgrade ?? (() => {})}
                  />
                </div>
              )}
            </div>

            {/* ── ZERO DATA ── */}
            <div style={card}>
              <div style={sectionLabel}>ZERO DATA</div>
              {gun.lastZeroDate ? (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 700, color: theme.textPrimary }}>
                      {gun.lastZeroDistance ? formatZeroDist(gun.lastZeroDistance, gun.lastZeroDistanceUnit) : '–'}
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginTop: '2px' }}>ZERO DISTANCE</div>
                  </div>
                  <div style={{ borderLeft: `1px solid ${theme.border}`, paddingLeft: '12px' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '13px', color: theme.textSecondary }}>
                      {formatDate(gun.lastZeroDate)}
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginTop: '2px' }}>LAST ZEROED</div>
                  </div>
                </div>
              ) : (
                <div style={{ fontFamily: 'monospace', fontSize: '13px', color: theme.textMuted, marginBottom: '12px' }}>
                  Not zeroed
                </div>
              )}
              {showZeroForm ? (
                <div>
                  <div style={labelStyle}>Zero Distance (yards)</div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    <input
                      type="number"
                      value={zeroDistInput}
                      onChange={e => setZeroDistInput(e.target.value)}
                      placeholder="e.g. 100"
                      autoFocus
                      min={1}
                      style={{ ...inputStyle, flex: 1 }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') logZero();
                        if (e.key === 'Escape') { setShowZeroForm(false); setZeroDistInput(''); }
                      }}
                    />
                    <button onClick={logZero} style={{
                      padding: '8px 14px', backgroundColor: accent,
                      border: 'none', borderRadius: '4px', color: theme.bg,
                      fontFamily: 'monospace', fontSize: '9px', fontWeight: 700, cursor: 'pointer', flexShrink: 0, minHeight: '44px',
                    }}>SAVE</button>
                    <button onClick={() => { setShowZeroForm(false); setZeroDistInput(''); }} style={{
                      padding: '8px 10px', backgroundColor: 'transparent',
                      border: `0.5px solid ${theme.border}`, borderRadius: '4px',
                      color: theme.textMuted, fontFamily: 'monospace', fontSize: '13px', cursor: 'pointer', flexShrink: 0, minHeight: '44px',
                    }}>×</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowZeroForm(true)} style={{
                  width: '100%', padding: '11px', backgroundColor: 'transparent',
                  border: `0.5px solid ${theme.border}`, borderRadius: '6px',
                  color: theme.textSecondary, fontFamily: 'monospace', fontSize: '10px',
                  letterSpacing: '0.5px', fontWeight: 600, cursor: 'pointer', minHeight: '44px',
                }}>
                  LOG ZERO
                </button>
              )}
            </div>

            {/* ── OPEN ISSUES ── */}
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={sectionLabel}>OPEN ISSUES</div>
                {!editingIssues && (
                  <button onClick={() => { setIssuesDraft(gun.openIssues || ''); setEditingIssues(true); }} style={{
                    padding: '3px 8px', backgroundColor: 'transparent',
                    border: `0.5px solid ${theme.border}`, borderRadius: '4px',
                    color: theme.textMuted, fontFamily: 'monospace', fontSize: '9px', cursor: 'pointer',
                  }}>EDIT</button>
                )}
              </div>
              {editingIssues ? (
                <>
                  <textarea
                    value={issuesDraft}
                    onChange={e => setIssuesDraft(e.target.value)}
                    rows={4}
                    autoFocus
                    placeholder={'One issue per line...'}
                    style={{ ...inputStyle, resize: 'vertical', marginBottom: '8px' }}
                  />
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => setEditingIssues(false)} style={{
                      flex: 1, padding: '10px', backgroundColor: 'transparent',
                      border: `0.5px solid ${theme.border}`, borderRadius: '4px',
                      color: theme.textMuted, fontFamily: 'monospace', fontSize: '9px', cursor: 'pointer', minHeight: '44px',
                    }}>CANCEL</button>
                    <button onClick={saveIssues} style={{
                      flex: 2, padding: '10px', backgroundColor: accent,
                      border: 'none', borderRadius: '4px', color: theme.bg,
                      fontFamily: 'monospace', fontSize: '9px', fontWeight: 700, cursor: 'pointer', minHeight: '44px',
                    }}>SAVE</button>
                  </div>
                </>
              ) : gun.openIssues ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {gun.openIssues.split('\n').filter(l => l.trim()).map((line, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.red, flexShrink: 0, marginTop: '1px' }}>▸</span>
                      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textSecondary, lineHeight: 1.5 }}>{line.trim()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted }}>No open issues</div>
              )}
            </div>

            {/* ── TRIGGER ── */}
            <div style={card}>
              <div style={sectionLabel}>TRIGGER</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: gun.accessories?.stockGrip ? '10px' : 0 }}>
                <div style={labelStyle}>Action</div>
                <div style={valStyle}>{gun.action || '–'}</div>
              </div>
              {gun.accessories?.stockGrip && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={labelStyle}>Stock / Grip</div>
                  <div style={{ ...valStyle, textAlign: 'right', maxWidth: '60%' }}>{gun.accessories.stockGrip}</div>
                </div>
              )}
              {!gun.accessories?.stockGrip && (
                <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginTop: '4px' }}>
                  No custom trigger recorded
                </div>
              )}
            </div>

            {/* ── ACCESSORIES ── */}
            <div style={card}>
              <div style={sectionLabel}>ACCESSORIES</div>
              {(() => {
                const acc = gun.accessories;
                if (!acc || Object.values(acc).every(v => !v)) {
                  return <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted }}>No accessories recorded.</div>;
                }
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {([
                      ['optic',             'Optic'],
                      ['opticMagnification','Magnification'],
                      ['muzzleDevice',      'Muzzle Device'],
                      ['suppressor',        'Suppressor'],
                      ['weaponLight',       'Weapon Light'],
                      ['laser',             'Laser / IR'],
                      ['sling',             'Sling'],
                      ['bipod',             'Bipod'],
                      ['foregrip',          'Foregrip'],
                      ['stockGrip',         'Stock / Grip'],
                      ['magazineUpgrade',   'Magazine'],
                      ['other',             'Other'],
                    ] as [keyof GunAccessories, string][])
                      .filter(([f]) => acc[f])
                      .map(([f, l]) => (
                        <div key={f} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={labelStyle}>{l}</div>
                          <div style={{ ...valStyle, textAlign: 'right', maxWidth: '60%' }}>{acc[f]}</div>
                        </div>
                      ))
                    }
                  </div>
                );
              })()}
            </div>

          </>
        )}

        {/* ══ AMMO TAB ══ */}
        {tab === 'ammo' && (
          <>

            <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '1.2px', color: accent, marginBottom: '12px' }}>
              {'CALIBER: ' + gun.caliber}
            </div>

            {ammoLots.length === 0 ? (
              <div style={{
                ...card, textAlign: 'center', padding: '40px 20px',
              }}>
                <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textMuted }}>
                  {'No ' + gun.caliber + ' ammo in inventory'}
                </div>
              </div>
            ) : (
              <>
                {/* Summary header */}
                {(() => {
                  const totalRounds  = ammoLots.reduce((sum, l) => sum + (l.quantity || 0), 0);
                  const lowStockLots = ammoLots.filter(l => l.minStockAlert != null && (l.quantity || 0) < l.minStockAlert!);
                  const catCounts    = ammoLots.reduce<Record<string, number>>((acc, l) => {
                    if (l.category) acc[l.category] = (acc[l.category] || 0) + 1;
                    return acc;
                  }, {});
                  const allTraining  = ammoLots.every(l => l.category === 'Training');
                  return (
                    <div style={{ marginBottom: '12px' }}>
                      {/* X rounds across Y lots */}
                      <div style={{ fontFamily: 'monospace', fontSize: '13px', color: theme.textPrimary, marginBottom: '8px' }}>
                        <span style={{ fontWeight: 700 }}>{totalRounds.toLocaleString()}</span>
                        <span style={{ color: theme.textSecondary }}>{' rounds across '}</span>
                        <span style={{ fontWeight: 700 }}>{ammoLots.length}</span>
                        <span style={{ color: theme.textSecondary }}>{ammoLots.length === 1 ? ' lot' : ' lots'}</span>
                      </div>

                      {/* Low-stock warning */}
                      {lowStockLots.length > 0 && (
                        <div style={{
                          backgroundColor: 'rgba(255,107,107,0.08)',
                          border: `0.5px solid ${theme.red}`,
                          borderRadius: '4px',
                          padding: '6px 10px',
                          marginBottom: '8px',
                          fontFamily: 'monospace',
                          fontSize: '10px',
                          color: theme.red,
                          letterSpacing: '0.3px',
                        }}>
                          {'LOW STOCK: ' + lowStockLots.map(l => l.brand + (l.productLine ? ' ' + l.productLine : '')).join(', ')}
                        </div>
                      )}

                      {/* Preferred ammo banner */}
                      {(() => {
                        const purposes: PreferredPurpose[] = ['match', 'defensive', 'training'];
                        const lines = purposes.flatMap(p => {
                          const lot = ammoLots.find(l => l.preferredFor?.includes(p));
                          if (!lot) return [];
                          const name = [lot.brand, lot.productLine, lot.grainWeight ? lot.grainWeight + 'gr' : ''].filter(Boolean).join(' ');
                          return [`${p.charAt(0).toUpperCase() + p.slice(1)}: ${name}`];
                        });
                        if (lines.length === 0) return null;
                        return (
                          <div style={{ backgroundColor: 'rgba(255,212,59,0.06)', border: `0.5px solid rgba(255,212,59,0.2)`, borderRadius: '6px', padding: '8px 10px', marginBottom: '10px' }}>
                            <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '1px', color: theme.accent, marginBottom: '4px' }}>PREFERRED LOADS</div>
                            {lines.map(l => (
                              <div key={l} style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textSecondary, lineHeight: 1.8 }}>{l}</div>
                            ))}
                          </div>
                        );
                      })()}

                      {/* Category tag strip */}
                      {!allTraining && Object.keys(catCounts).length > 0 && (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {Object.entries(catCounts).map(([cat, count]) => (
                            <span key={cat} style={{
                              padding: '2px 8px',
                              backgroundColor: theme.bg,
                              border: `0.5px solid ${theme.border}`,
                              borderRadius: '3px',
                              fontFamily: 'monospace',
                              fontSize: '9px',
                              color: theme.textMuted,
                              letterSpacing: '0.5px',
                            }}>
                              {cat.toUpperCase()}{count > 1 ? ' ×' + count : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {(() => {
                  const allTraining = ammoLots.every(l => l.category === 'Training');
                  return ammoLots.map(lot => {
                  const qtyColor = (lot.quantity || 0) < 50 ? theme.red
                    : (lot.quantity || 0) < 200 ? theme.orange
                    : accent;
                  const sdColor = lot.sd == null ? theme.textMuted
                    : lot.sd <= 10 ? theme.green
                    : lot.sd <= 15 ? theme.orange
                    : theme.red;
                  return (
                    <div key={lot.id} style={card}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: theme.textPrimary }}>
                            {lot.brand}
                          </div>
                          {lot.productLine && (
                            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textSecondary, marginTop: '1px' }}>
                              {lot.productLine}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 700, color: qtyColor, lineHeight: 1 }}>
                            {(lot.quantity || 0).toLocaleString()}
                          </div>
                          <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginTop: '2px' }}>ROUNDS</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {lot.grainWeight && (
                          <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textSecondary }}>
                            {lot.grainWeight + 'gr'}
                          </span>
                        )}
                        {lot.bulletType && (
                          <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textSecondary }}>
                            {lot.bulletType}
                          </span>
                        )}
                        {lot.category && !allTraining && (
                          <span style={{
                            padding: '2px 7px', backgroundColor: theme.bg,
                            border: `0.5px solid ${theme.border}`, borderRadius: '3px',
                            fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, letterSpacing: '0.5px',
                          }}>
                            {lot.category.toUpperCase()}
                          </span>
                        )}
                      </div>
                      {/* Preferred for this gun */}
                      <div style={{ marginTop: '10px' }}>
                        <div style={{ fontFamily: 'monospace', fontSize: '8px', letterSpacing: '1px', color: theme.textMuted, marginBottom: '5px' }}>
                          PREFERRED FOR {gun.make.toUpperCase()} {gun.model.toUpperCase()}
                        </div>
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                          {(['match', 'defensive', 'training'] as PreferredPurpose[]).map(p => {
                            const active = lot.preferredFor?.includes(p) ?? false;
                            return (
                              <button key={p} onClick={() => togglePreferred(lot.id, p)} style={{
                                padding: '4px 10px', border: `0.5px solid ${active ? theme.accent : theme.border}`,
                                borderRadius: '3px', backgroundColor: active ? 'rgba(255,212,59,0.1)' : 'transparent',
                                fontFamily: 'monospace', fontSize: '8px', letterSpacing: '0.8px',
                                color: active ? theme.accent : theme.textMuted, cursor: 'pointer',
                              }}>
                                {p.toUpperCase()}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {(lot.sd != null || lot.actualFPS) && (
                        <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                          {lot.sd != null && (
                            <div>
                              <div style={labelStyle}>Std Dev</div>
                              <div style={{ ...valStyle, color: sdColor }}>{lot.sd + ' fps'}</div>
                            </div>
                          )}
                          {lot.actualFPS && (
                            <div>
                              <div style={labelStyle}>Actual FPS</div>
                              <div style={valStyle}>{lot.actualFPS.toLocaleString() + ' fps'}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                });
                })()}

                <div style={{ ...card, backgroundColor: theme.bg }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, letterSpacing: '0.8px' }}>
                      {'TOTAL ' + gun.caliber + ' IN INVENTORY'}
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 700, color: accent }}>
                      {ammoLots.reduce((sum, l) => sum + (l.quantity || 0), 0).toLocaleString() + ' rds'}
                    </div>
                  </div>
                </div>
              </>
            )}

          </>
        )}

        {/* ══ TIMELINE TAB ══ */}
        {tab === 'timeline' && (
          <div style={{ position: 'relative', paddingLeft: '24px' }}>

            {/* Vertical line */}
            <div style={{
              position: 'absolute', left: '7px', top: '8px', bottom: '8px',
              width: '2px', backgroundColor: theme.border,
            }} />

            {(() => {
              // ── Styles ──────────────────────────────────────────────────────
              const itemWrap: React.CSSProperties = { position: 'relative', marginBottom: '18px' };
              const itemTag = (color: string): React.CSSProperties => ({
                fontFamily: 'monospace', fontSize: '8px', letterSpacing: '1px',
                color, textTransform: 'uppercase', marginBottom: '3px',
              });
              const itemVal: React.CSSProperties = {
                fontFamily: 'monospace', fontSize: '11px', color: theme.textSecondary, lineHeight: 1.5,
              };
              const makeDot = (bg: string, ring?: string): React.CSSProperties => ({
                position: 'absolute', left: '-20px', top: '4px',
                width: '8px', height: '8px', borderRadius: '50%',
                backgroundColor: ring ? 'transparent' : bg,
                border: ring ? `2px solid ${ring}` : 'none',
                flexShrink: 0,
              });

              // ── Build event list ─────────────────────────────────────────────
              type TLEvent = {
                date: string;
                sortKey: string; // date + tie-breaker char for stable sort
                type: 'acquired' | 'nfa' | 'session' | 'milestone' | 'cleaning' | 'zero' | 'sold';
                data: Record<string, unknown>;
              };
              const events: TLEvent[] = [];

              if (gun.acquiredDate)
                events.push({ date: gun.acquiredDate, sortKey: gun.acquiredDate + 'a', type: 'acquired',
                  data: { from: gun.acquiredFrom, price: gun.acquiredPrice, condition: gun.condition } });

              if (gun.nfaApprovalDate)
                events.push({ date: gun.nfaApprovalDate, sortKey: gun.nfaApprovalDate + 'b', type: 'nfa', data: {} });

              // Sessions oldest→newest
              const sessionsSorted = sessions.slice().sort((a, b) => a.date.localeCompare(b.date));
              const MILESTONES = [100, 500, 1000, 2500, 5000];
              let running = 0;
              let mIdx = 0;
              for (const s of sessionsSorted) {
                const prev = running;
                running += s.roundsExpended;
                // Insert any milestones crossed during this session before the session itself
                while (mIdx < MILESTONES.length && MILESTONES[mIdx] <= running) {
                  if (MILESTONES[mIdx] > prev)
                    events.push({ date: s.date, sortKey: s.date + 'm' + mIdx, type: 'milestone',
                      data: { milestone: MILESTONES[mIdx] } });
                  mIdx++;
                }
                events.push({ date: s.date, sortKey: s.date + 's' + s.id, type: 'session',
                  data: { rounds: s.roundsExpended, location: s.location, distance: s.distanceYards,
                    issues: s.issues, purpose: s.purpose } });
              }

              if (gun.lastCleanedDate)
                events.push({ date: gun.lastCleanedDate, sortKey: gun.lastCleanedDate + 'c', type: 'cleaning',
                  data: { roundCount: gun.lastCleanedRoundCount } });

              if (gun.lastZeroDate)
                events.push({ date: gun.lastZeroDate, sortKey: gun.lastZeroDate + 'z', type: 'zero',
                  data: { distance: gun.lastZeroDistance, unit: gun.lastZeroDistanceUnit || 'yd' } });

              if (gun.soldDate)
                events.push({ date: gun.soldDate, sortKey: gun.soldDate + 'x', type: 'sold',
                  data: { price: gun.soldPrice } });

              events.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

              if (events.length === 0) {
                return (
                  <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textMuted, padding: '20px 0' }}>
                    No events to display yet.
                  </div>
                );
              }

              return events.map((ev, i) => {
                switch (ev.type) {
                  case 'acquired':
                    return (
                      <div key={i} style={itemWrap}>
                        <div style={makeDot(accent)} />
                        <div style={itemTag(accent)}>ACQUIRED</div>
                        <div style={itemVal}>{formatDate(ev.date)}</div>
                        {ev.data.from    && <div style={itemVal}>{'From: ' + ev.data.from}</div>}
                        {ev.data.price   && <div style={itemVal}>{'Paid: $' + (ev.data.price as number).toLocaleString()}</div>}
                        {ev.data.condition && <div style={itemVal}>{'Condition: ' + ev.data.condition}</div>}
                      </div>
                    );
                  case 'nfa':
                    return (
                      <div key={i} style={itemWrap}>
                        <div style={makeDot(accent)} />
                        <div style={itemTag(accent)}>NFA APPROVED</div>
                        <div style={itemVal}>{formatDate(ev.date)}</div>
                      </div>
                    );
                  case 'milestone':
                    return (
                      <div key={i} style={itemWrap}>
                        <div style={makeDot('transparent', accent)} />
                        <div style={itemTag(theme.textMuted)}>
                          {(ev.data.milestone as number).toLocaleString() + ' RD MILESTONE'}
                        </div>
                        <div style={itemVal}>{formatDate(ev.date)}</div>
                      </div>
                    );
                  case 'session':
                    return (
                      <div key={i} style={itemWrap}>
                        <div style={makeDot(theme.textMuted)} />
                        <div style={itemTag(theme.textSecondary)}>SESSION</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textPrimary }}>
                            {formatDate(ev.date)}
                          </span>
                          <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textSecondary }}>
                            {(ev.data.rounds as number) + ' rds'}
                          </span>
                          {ev.data.issues && (
                            <span style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.red }}>
                              ISSUE
                            </span>
                          )}
                        </div>
                        {(ev.data.location || ev.data.distance) && (
                          <div style={itemVal}>
                            {[ev.data.location, ev.data.distance ? ev.data.distance + 'yd' : null]
                              .filter(Boolean).join(' · ')}
                          </div>
                        )}
                      </div>
                    );
                  case 'cleaning':
                    return (
                      <div key={i} style={itemWrap}>
                        <div style={makeDot(theme.green)} />
                        <div style={itemTag(theme.green)}>CLEANED</div>
                        <div style={itemVal}>{formatDate(ev.date)}</div>
                        {ev.data.roundCount != null && (
                          <div style={itemVal}>{'At ' + (ev.data.roundCount as number).toLocaleString() + ' total rounds'}</div>
                        )}
                      </div>
                    );
                  case 'zero':
                    return (
                      <div key={i} style={itemWrap}>
                        <div style={makeDot(theme.orange)} />
                        <div style={itemTag(theme.orange)}>ZEROED</div>
                        <div style={itemVal}>{formatDate(ev.date)}</div>
                        {ev.data.distance != null && (
                          <div style={itemVal}>{ev.data.distance + ' ' + ev.data.unit}</div>
                        )}
                      </div>
                    );
                  case 'sold':
                    return (
                      <div key={i} style={itemWrap}>
                        <div style={makeDot(theme.red)} />
                        <div style={itemTag(theme.red)}>SOLD</div>
                        <div style={itemVal}>{formatDate(ev.date)}</div>
                        {ev.data.price != null && (
                          <div style={itemVal}>{'$' + (ev.data.price as number).toLocaleString()}</div>
                        )}
                      </div>
                    );
                  default:
                    return null;
                }
              });
            })()}
          </div>
        )}

        {/* ══ PHOTOS TAB ══ */}
        {tab === 'photos' && (() => {
          const saleStatus   = getSetCompletionStatus('sale_listing', gunTypeProfile, photoAssets);
          const insureStatus = getSetCompletionStatus('insurance', gunTypeProfile, photoAssets);

          const capturedKeys = new Set(photoAssets.map(a => a.shotType));

          const SetCard = ({ title, status, setType }: {
            title: string;
            status: ReturnType<typeof getSetCompletionStatus>;
            setType: SetType;
          }) => {
            const shotsForSet = getShotsForSet(setType, gunTypeProfile);
            const pct = shotsForSet.length > 0 ? (status.completed / shotsForSet.length) * 100 : 0;
            const complete = status.missingShots.length === 0;
            return (
              <div style={{ backgroundColor: theme.surface, borderRadius: '10px', padding: '14px 16px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: theme.textPrimary, letterSpacing: '0.5px' }}>
                    {title}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', color: complete ? theme.green : theme.textMuted, letterSpacing: '0.5px' }}>
                    {status.completed}/{shotsForSet.length}
                  </div>
                </div>
                {/* Progress bar */}
                <div style={{ height: '2px', backgroundColor: theme.bg, borderRadius: '1px', marginBottom: '10px' }}>
                  <div style={{ height: '2px', width: `${pct}%`, backgroundColor: complete ? theme.green : theme.accent, borderRadius: '1px', transition: 'width 0.3s' }} />
                </div>
                {/* Missing shots — compact inline */}
                {status.missingShots.length > 0 && (
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginBottom: '10px', lineHeight: 1.7 }}>
                    <span style={{ color: theme.orange, marginRight: '6px' }}>Missing:</span>
                    {status.missingShots.join(' · ')}
                  </div>
                )}
                {/* Photo thumbnails */}
                {photoAssets.filter(a => shotsForSet.some(s => s.key === a.shotType)).length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                    {photoAssets.filter(a => shotsForSet.some(s => s.key === a.shotType)).map(asset => (
                      <div key={asset.id} style={{ position: 'relative', width: '64px', height: '64px' }}>
                        {asset.storageUrl ? (
                          <img src={asset.storageUrl} alt={asset.shotType ?? 'photo'} style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '6px', border: `0.5px solid ${theme.border}` }} />
                        ) : (
                          <div style={{ width: '64px', height: '64px', borderRadius: '6px', backgroundColor: theme.bg, border: `0.5px solid ${theme.border}` }} />
                        )}
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: '0 0 6px 6px', padding: '2px 4px' }}>
                          <div style={{ fontFamily: 'monospace', fontSize: '7px', color: theme.textSecondary, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {(asset.shotType ?? '').replace(/_/g, ' ').toUpperCase()}
                          </div>
                        </div>
                        {userId && (
                          <button onClick={async () => { await deletePhotoAsset(asset.id, asset.storagePath); refreshPhotos(); }} style={{ position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: theme.red, border: 'none', color: '#fff', fontSize: '10px', lineHeight: '18px', textAlign: 'center', cursor: 'pointer', padding: 0 }}>
                            x
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => { setActiveSetType(setType); setShowCapture(true); }}
                  disabled={!userId}
                  style={{ width: '100%', padding: '10px', backgroundColor: 'transparent', border: `1px solid ${complete ? theme.border : theme.accent}`, borderRadius: '8px', color: complete ? theme.textMuted : theme.accent, fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', cursor: 'pointer' }}
                >
                  {complete ? 'RETAKE / ADD PHOTOS' : 'ADD PHOTOS'}
                </button>
              </div>
            );
          };

          const galleryAssets = photoAssets.filter(a => !a.setType && !a.shotType);

          return (
            <div style={{ paddingBottom: '24px' }}>
              {/* ── Gallery (free-form, up to 5) ── */}
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={handleGalleryUpload}
              />
              <div style={{ backgroundColor: theme.surface, borderRadius: '10px', padding: '14px 16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: theme.textPrimary, letterSpacing: '0.5px' }}>
                    Gallery
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>
                    {galleryAssets.length}/5
                  </div>
                </div>
                {galleryAssets.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                    {galleryAssets.map(asset => (
                      <div key={asset.id} style={{ position: 'relative', width: '72px', height: '72px' }}>
                        {asset.storageUrl ? (
                          <img src={asset.storageUrl} alt="gallery" style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '6px', border: `0.5px solid ${theme.border}` }} />
                        ) : (
                          <div style={{ width: '72px', height: '72px', borderRadius: '6px', backgroundColor: theme.bg, border: `0.5px solid ${theme.border}` }} />
                        )}
                        {userId && (
                          <button
                            onClick={async () => { await deletePhotoAsset(asset.id, asset.storagePath); refreshPhotos(); }}
                            style={{ position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: theme.red, border: 'none', color: '#fff', fontSize: '10px', lineHeight: '18px', textAlign: 'center', cursor: 'pointer', padding: 0 }}
                          >x</button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {galleryAssets.length === 0 && (
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted, marginBottom: '10px', lineHeight: 1.6 }}>
                    Up to 5 photos for your own reference — thumbnail, display, or anything you want.
                  </div>
                )}
                <button
                  onClick={() => { if (galleryInputRef.current) { galleryInputRef.current.removeAttribute('capture'); galleryInputRef.current.click(); } }}
                  disabled={!userId || galleryUploading || galleryAssets.length >= 5}
                  style={{ width: '100%', padding: '10px', backgroundColor: 'transparent', border: `1px solid ${galleryAssets.length >= 5 ? theme.border : theme.accent}`, borderRadius: '8px', color: galleryAssets.length >= 5 ? theme.textMuted : theme.accent, fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', cursor: galleryAssets.length >= 5 ? 'default' : 'pointer' }}
                >
                  {galleryUploading ? 'UPLOADING...' : galleryAssets.length >= 5 ? 'GALLERY FULL (5/5)' : 'ADD PHOTO'}
                </button>
              </div>

              <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '1.5px', color: theme.textMuted, marginBottom: '14px' }}>
                PHOTO DOCUMENTATION
              </div>

              <SetCard title="Sale Listing" status={saleStatus} setType="sale_listing" />
              <SetCard title="Insurance" status={insureStatus} setType="insurance" />

              {/* Grade-a-Gun */}
              <div style={{ backgroundColor: theme.surface, borderRadius: '10px', padding: '14px 16px', marginBottom: '12px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: theme.textPrimary, letterSpacing: '0.5px', marginBottom: '6px' }}>
                  Grade-a-Gun — Cosmetic Assessment
                </div>
                {latestGrade && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 700, color: theme.accent }}>
                      {latestGrade.overallGrade}
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>
                      NRA Condition · {new Date(latestGrade.assessedAt).toLocaleDateString()}
                    </div>
                  </div>
                )}
                {!latestGrade && (
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted, marginBottom: '10px', lineHeight: 1.6 }}>
                    AI-powered cosmetic condition assessment using NRA grading scale.
                  </div>
                )}
                <button
                  onClick={() => {
                    if (!isPro && onUpgrade) { onUpgrade('grade_a_gun'); return; }
                    setShowGrade(true);
                  }}
                  disabled={!userId}
                  style={{
                    width: '100%', padding: '10px',
                    backgroundColor: 'transparent', border: `1px solid ${theme.accent}`,
                    borderRadius: '8px', color: theme.accent,
                    fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', cursor: 'pointer',
                  }}
                >
                  {latestGrade ? 'RE-ASSESS CONDITION' : 'GRADE THIS GUN'}
                  {!isPro && <span style={{ marginLeft: '8px', fontSize: '9px', opacity: 0.7 }}>PRO</span>}
                </button>
              </div>

              {!userId && (
                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted, textAlign: 'center', marginTop: '8px' }}>
                  Sign in to use photo documentation
                </div>
              )}
            </div>
          );
        })()}

      </div>

      {/* Photo Capture overlay */}
      {showCapture && userId && (
        <PhotoCapture
          userId={userId}
          gunId={gun.id}
          gunName={`${gun.make} ${gun.model}`}
          gunType={gun.type}
          gunAction={gun.action}
          setType={activeSetType}
          gunTypeProfile={gunTypeProfile}
          onComplete={() => { setShowCapture(false); refreshPhotos(); }}
          onCancel={() => { setShowCapture(false); refreshPhotos(); }}
        />
      )}

      {/* Grade-a-Gun overlay */}
      {showGrade && userId && (
        <GradeAGun
          userId={userId}
          gunId={gun.id}
          gunName={`${gun.make} ${gun.model}`}
          gunTypeProfile={gunTypeProfile}
          assets={photoAssets}
          onComplete={() => { setShowGrade(false); refreshPhotos(); }}
          onCancel={() => setShowGrade(false)}
        />
      )}

      {/* Session Detail Sheet */}
      {selectedSession && (
        <>
          <div
            onClick={() => setSelectedSession(null)}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 3000 }}
          />
          <div style={{
            position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: '100%', maxWidth: '480px',
            backgroundColor: theme.surface, borderTop: `0.5px solid ${theme.border}`,
            borderRadius: '12px 12px 0 0', zIndex: 3001, padding: '16px 20px 48px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
              <div style={{ width: '32px', height: '4px', borderRadius: '2px', backgroundColor: theme.border }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: theme.textPrimary }}>
                {formatDate(selectedSession.date)}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 700, color: accent }}>
                {selectedSession.roundsExpended} rds
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedSession.location && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, letterSpacing: '0.5px' }}>LOCATION</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textPrimary }}>{selectedSession.location}</span>
                </div>
              )}
              {selectedSession.distanceYards && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, letterSpacing: '0.5px' }}>DISTANCE</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textPrimary }}>{selectedSession.distanceYards} yd</span>
                </div>
              )}
              {selectedSession.indoorOutdoor && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, letterSpacing: '0.5px' }}>ENVIRONMENT</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textPrimary }}>{selectedSession.indoorOutdoor.toUpperCase()}</span>
                </div>
              )}
              {selectedSession.purpose && selectedSession.purpose.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, letterSpacing: '0.5px' }}>PURPOSE</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textPrimary, textAlign: 'right' }}>{selectedSession.purpose.join(', ')}</span>
                </div>
              )}
              {selectedSession.notes && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px', padding: '10px 12px', backgroundColor: theme.bg, borderRadius: '6px' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, letterSpacing: '0.5px' }}>NOTES</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textSecondary, lineHeight: 1.5 }}>{selectedSession.notes}</span>
                </div>
              )}
              {selectedSession.issues && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px', padding: '10px 12px', backgroundColor: theme.bg, borderRadius: '6px', border: `0.5px solid ${theme.red}` }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.red, letterSpacing: '0.5px' }}>ISSUE REPORTED</span>
                  {selectedSession.issueDescription && (
                    <span style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.red, lineHeight: 1.5 }}>{selectedSession.issueDescription}</span>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectedSession(null)}
              style={{
                marginTop: '20px', width: '100%', padding: '12px',
                backgroundColor: 'transparent', border: `0.5px solid ${theme.border}`,
                borderRadius: '6px', color: theme.textPrimary, fontFamily: 'monospace',
                fontSize: '11px', letterSpacing: '0.8px', cursor: 'pointer',
              }}
            >
              CLOSE
            </button>
          </div>
        </>
      )}
      {showLogSession && (
        <SessionLoggingModal
          gun={gun}
          onClose={() => setShowLogSession(false)}
          onViewSessions={onViewSessions ? () => onViewSessions(gun.id) : undefined}
          onSessionLogged={handleSessionLogged}
        />
      )}
    </div>
  );
}

function getAccessoryPlaceholder(field: keyof GunAccessories): string {
  const map: Partial<Record<keyof GunAccessories, string>> = {
    optic: 'Trijicon MRO',
    opticMagnification: '1x',
    muzzleDevice: 'SureFire Warcomp',
    suppressor: 'SureFire SOCOM762',
    weaponLight: 'SureFire X300U',
    laser: 'Streamlight TLR-2',
    sling: 'Blue Force Gear VCAS',
    bipod: 'Harris 9-13"',
    foregrip: 'BCM GUNFIGHTER',
    stockGrip: 'Magpul STR',
    magazineUpgrade: 'Magpul PMAG 30',
    other: 'Custom trigger, etc.',
  };
  return map[field] || '';
}
