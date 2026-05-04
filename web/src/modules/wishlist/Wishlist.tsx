import { useState, useEffect } from 'react';
import { theme } from './theme';
import { useResponsive } from './useResponsive';
import { getAllGuns } from './storage';
import type { Gun } from './types';
import { getWishlistValuation } from './lib/valuationService';
import { callWishlistAnalysis, callWishlistRecommendations } from './claudeApi';
import type { WishlistRecommendation } from './claudeApi';

// ── Types ──────────────────────────────────────────────────────────────────────

interface PricePoint { price: number; date: string; }

interface ResearchNote { id: string; text: string; date: string; }

interface WishlistCandidate {
  id: string;
  make: string;
  model: string;
  notes?: string;
  currentPrice?: number;
  lowestPrice?: number;
  priceHistory?: PricePoint[];
}

interface WishlistItem {
  id: string;
  /** 'specified' = know exactly what I want; 'exploring' = still deciding */
  specLevel: 'specified' | 'exploring';
  make: string;
  model: string;
  caliber: string;
  type: 'Pistol' | 'Rifle' | 'Shotgun' | 'Suppressor' | 'NFA';
  priority: 'high' | 'medium' | 'low';
  // exploring fields
  goal?: string;
  budgetMin?: number;
  budgetMax?: number;
  candidates?: WishlistCandidate[];
  // price tracking (specified)
  estimatedPrice: number;
  currentPrice?: number;
  lowestPrice?: number;
  priceHistory?: PricePoint[];
  priceAlertThreshold?: number;
  // research
  notes?: string;
  researchNotes?: ResearchNote[];
  pros?: string[];
  cons?: string[];
  alternativeOptions?: string[];
  useCase?: string;
  addedDate: string;
  targetDate?: string;
  savedAmount?: number;
  link?: string;
  // management
  isPinned?: boolean;
  deferUntil?: string; // ISO date string
}

interface AiVerdict {
  verdict: 'buy' | 'wait' | 'skip';
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  topBenefit?: string;
  topConcern?: string;
}

const STORAGE_KEY = 'gunvault_wishlist';

function saveToStorage(items: WishlistItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

const priorityColors = { high: theme.red, medium: theme.orange, low: theme.blue };

// ── Main Component ─────────────────────────────────────────────────────────────

export function Wishlist({
  isPro,
  onUpgrade,
  onBuyIt,
  onAlertCountChange,
}: {
  isPro?: boolean;
  onUpgrade?: (reason: string) => void;
  onBuyIt?: (prefill: { make?: string; model?: string; caliber?: string; type?: string }) => void;
  onAlertCountChange?: (count: number) => void;
}) {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [ownedGuns, setOwnedGuns] = useState<Gun[]>([]);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<WishlistItem | null>(null);
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterSpec, setFilterSpec] = useState('all');
  const [sortBy, setSortBy] = useState<'priority' | 'price' | 'date'>('priority');
  const [showDeferred, setShowDeferred] = useState(false);
  const [valuingId, setValuingId] = useState<string | null>(null);
  const [valuingCandidateId, setValuingCandidateId] = useState<string | null>(null);
  const [valuingAll, setValuingAll] = useState(false);
  const [valuingProgress, setValuingProgress] = useState<{ done: number; total: number } | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [showGapAnalysis, setShowGapAnalysis] = useState(false);
  const { isMobile } = useResponsive();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const raw = JSON.parse(saved) as Record<string, unknown>[];
        setWishlistItems(raw.map(item => ({ ...item, specLevel: (item.specLevel as string) ?? 'specified' } as WishlistItem)));
      }
      setOwnedGuns(getAllGuns());
    } catch (e) {
      console.error('Failed to load wishlist:', e);
    }
  }, []);

  function applyItems(items: WishlistItem[]) {
    setWishlistItems(items);
    saveToStorage(items);
  }

  function handleSaveItem(data: Omit<WishlistItem, 'id' | 'addedDate'>, editId?: string) {
    if (editId) {
      const updated = wishlistItems.map(w => w.id === editId ? { ...w, ...data } : w);
      applyItems(updated);
      setSelectedItem(updated.find(w => w.id === editId) ?? null);
    } else {
      const newItem: WishlistItem = { ...data, id: Date.now().toString(), addedDate: new Date().toISOString() };
      applyItems([newItem, ...wishlistItems]);
    }
    setShowItemForm(false);
    setEditingItem(null);
  }

  function deleteItem(id: string) {
    applyItems(wishlistItems.filter(w => w.id !== id));
    setSelectedItem(null);
  }

  function togglePin(id: string) {
    const item = wishlistItems.find(w => w.id === id);
    const newPinned = !item?.isPinned;
    applyItems(wishlistItems.map(w => ({
      ...w,
      isPinned: w.id === id ? newPinned : (newPinned ? false : w.isPinned),
    })));
    // Keep selectedItem in sync
    setSelectedItem(prev => prev ? { ...prev, isPinned: prev.id === id ? newPinned : (newPinned ? false : prev.isPinned) } : null);
  }

  function setSnooze(id: string, date: string) {
    const updated = wishlistItems.map(w => w.id === id ? { ...w, deferUntil: date, isPinned: false } : w);
    applyItems(updated);
    setSelectedItem(updated.find(w => w.id === id) ?? null);
  }

  function clearSnooze(id: string) {
    const updated = wishlistItems.map(w => w.id === id ? { ...w, deferUntil: undefined } : w);
    applyItems(updated);
    setSelectedItem(updated.find(w => w.id === id) ?? null);
  }

  function addResearchNote(id: string, text: string) {
    const note: ResearchNote = { id: Date.now().toString(), text, date: new Date().toISOString() };
    const updated = wishlistItems.map(w => w.id === id
      ? { ...w, researchNotes: [note, ...(w.researchNotes ?? [])] }
      : w);
    applyItems(updated);
    setSelectedItem(updated.find(w => w.id === id) ?? null);
  }

  async function refreshItemPrice(e: React.MouseEvent, item: WishlistItem, candidateId?: string) {
    e.stopPropagation();
    if (!isPro) { onUpgrade?.('wishlist_price'); return; }
    const make = candidateId ? (item.candidates?.find(c => c.id === candidateId)?.make ?? '') : item.make;
    const model = candidateId ? (item.candidates?.find(c => c.id === candidateId)?.model ?? '') : item.model;
    if (candidateId) setValuingCandidateId(candidateId);
    else setValuingId(item.id);
    try {
      const result = await getWishlistValuation({ make, model, caliber: item.caliber });
      const pt: PricePoint = { price: result.median, date: new Date().toISOString() };
      const updated = wishlistItems.map(w => {
        if (w.id !== item.id) return w;
        if (candidateId) {
          return {
            ...w,
            candidates: w.candidates?.map(c => c.id === candidateId
              ? { ...c, currentPrice: result.median,
                  lowestPrice: c.lowestPrice ? Math.min(c.lowestPrice, result.low) : result.low,
                  priceHistory: [...(c.priceHistory ?? []), pt] }
              : c),
          };
        }
        return {
          ...w,
          currentPrice: result.median,
          lowestPrice: w.lowestPrice ? Math.min(w.lowestPrice, result.low) : result.low,
          priceHistory: [...(w.priceHistory ?? []), pt],
        };
      });
      applyItems(updated);
      if (selectedItem?.id === item.id) setSelectedItem(updated.find(w => w.id === item.id) ?? null);
    } catch { /* silent */ }
    finally { setValuingId(null); setValuingCandidateId(null); }
  }

  async function refreshAllPrices() {
    if (!isPro) { onUpgrade?.('wishlist_price_all'); return; }
    const targets = wishlistItems.filter(w => w.specLevel === 'specified');
    if (!targets.length) return;
    setValuingAll(true);
    setValuingProgress({ done: 0, total: targets.length });
    let items = [...wishlistItems];
    for (let i = 0; i < targets.length; i++) {
      const item = targets[i];
      try {
        const result = await getWishlistValuation({ make: item.make, model: item.model, caliber: item.caliber });
        const pt: PricePoint = { price: result.median, date: new Date().toISOString() };
        items = items.map(w => w.id === item.id
          ? { ...w, currentPrice: result.median,
              lowestPrice: w.lowestPrice ? Math.min(w.lowestPrice, result.low) : result.low,
              priceHistory: [...(w.priceHistory ?? []), pt] }
          : w);
      } catch { /* skip failed */ }
      setValuingProgress({ done: i + 1, total: targets.length });
      if (i < targets.length - 1) await new Promise(r => setTimeout(r, 500));
    }
    applyItems(items);
    setValuingAll(false);
    setValuingProgress(null);
  }

  function promoteCandidate(itemId: string, candidateId: string) {
    const item = wishlistItems.find(w => w.id === itemId);
    const candidate = item?.candidates?.find(c => c.id === candidateId);
    if (!item || !candidate) return;
    const updated = wishlistItems.map(w => w.id === itemId
      ? { ...w, specLevel: 'specified' as const, make: candidate.make, model: candidate.model,
          estimatedPrice: candidate.currentPrice ?? w.budgetMax ?? w.budgetMin ?? w.estimatedPrice,
          currentPrice: candidate.currentPrice, lowestPrice: candidate.lowestPrice,
          priceHistory: candidate.priceHistory }
      : w);
    applyItems(updated);
    setSelectedItem(updated.find(w => w.id === itemId) ?? null);
  }

  function addCandidateToItem(itemId: string, candidate: Omit<WishlistCandidate, 'id'>) {
    const updated = wishlistItems.map(w => w.id === itemId
      ? { ...w, candidates: [...(w.candidates ?? []), { ...candidate, id: Date.now().toString() }] }
      : w);
    applyItems(updated);
    setSelectedItem(updated.find(w => w.id === itemId) ?? null);
  }

  function removeCandidateFromItem(itemId: string, candidateId: string) {
    const updated = wishlistItems.map(w => w.id === itemId
      ? { ...w, candidates: w.candidates?.filter(c => c.id !== candidateId) }
      : w);
    applyItems(updated);
    setSelectedItem(updated.find(w => w.id === itemId) ?? null);
  }

  function toggleCompare(id: string) {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const now = new Date();

  const ownedSet = new Set(ownedGuns.map(g => `${g.make.toLowerCase()}|${g.model.toLowerCase()}`));
  const alreadyOwnedIds = new Set(
    wishlistItems
      .filter(w => w.specLevel === 'specified' && ownedSet.has(`${w.make.toLowerCase()}|${w.model.toLowerCase()}`))
      .map(w => w.id)
  );

  // Role overlap: same type + caliber but not exact make/model match
  const roleOverlapMap = new Map<string, Gun>();
  wishlistItems.forEach(w => {
    if (alreadyOwnedIds.has(w.id) || !w.caliber) return;
    const match = ownedGuns.find(g =>
      g.type?.toLowerCase() === w.type.toLowerCase() &&
      g.caliber?.toLowerCase() === w.caliber.toLowerCase()
    );
    if (match) roleOverlapMap.set(w.id, match);
  });

  const priceAlertIds = new Set(
    wishlistItems
      .filter(w => w.priceAlertThreshold != null && w.currentPrice != null && w.currentPrice <= w.priceAlertThreshold)
      .map(w => w.id)
  );

  // Deferred: deferUntil set and date is in the future
  const deferredIds = new Set(
    wishlistItems.filter(w => w.deferUntil && new Date(w.deferUntil) > now).map(w => w.id)
  );
  // Resurface: deferUntil set but date has passed — show "TIME TO REVISIT"
  const resurfaceIds = new Set(
    wishlistItems.filter(w => w.deferUntil && new Date(w.deferUntil) <= now).map(w => w.id)
  );

  const ownedCalibers = new Set(ownedGuns.map(g => g.caliber));
  const newCalibers = [...new Set(wishlistItems.map(w => w.caliber).filter(Boolean))].filter(c => !ownedCalibers.has(c));

  // Notify parent of alert count changes
  useEffect(() => {
    onAlertCountChange?.(priceAlertIds.size);
  }, [priceAlertIds.size]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeItems = wishlistItems.filter(w => !deferredIds.has(w.id));
  const filteredItems = activeItems
    .filter(item => {
      if (filterSpec !== 'all' && item.specLevel !== filterSpec) return false;
      if (filterPriority !== 'all' && item.priority !== filterPriority) return false;
      if (filterType !== 'all' && item.type !== filterType) return false;
      return true;
    })
    .sort((a, b) => {
      // Pinned always first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      if (sortBy === 'priority') {
        const o = { high: 0, medium: 1, low: 2 };
        return o[a.priority] - o[b.priority];
      }
      if (sortBy === 'price') {
        const ap = a.specLevel === 'specified' ? a.estimatedPrice : (a.budgetMin ?? 0);
        const bp = b.specLevel === 'specified' ? b.estimatedPrice : (b.budgetMin ?? 0);
        return ap - bp;
      }
      return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
    });

  const deferredItems = showDeferred ? wishlistItems.filter(w => deferredIds.has(w.id)) : [];

  const totalValue = wishlistItems.filter(w => w.specLevel === 'specified').reduce((s, w) => s + w.estimatedPrice, 0);
  const totalSaved = wishlistItems.reduce((s, w) => s + (w.savedAmount ?? 0), 0);
  const highPriorityCount = activeItems.filter(w => w.priority === 'high').length;
  const deferredCount = deferredIds.size;

  // ── Styles ─────────────────────────────────────────────────────────────────

  const cardStyle = {
    backgroundColor: theme.surface,
    border: `0.5px solid ${theme.border}`,
    borderRadius: '6px',
    padding: isMobile ? '14px' : '18px',
  };

  const selectStyle = {
    padding: '8px 10px',
    backgroundColor: theme.surface,
    border: `0.5px solid ${theme.border}`,
    borderRadius: '4px',
    color: theme.textPrimary,
    fontFamily: 'monospace',
    fontSize: '10px',
    cursor: 'pointer',
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  function renderCard(item: WishlistItem, isDeferred = false) {
    const isOwned = alreadyOwnedIds.has(item.id);
    const isPriceAlert = priceAlertIds.has(item.id);
    const isSelected = compareIds.includes(item.id);
    const hasRoleOverlap = roleOverlapMap.has(item.id);
    const isResurface = resurfaceIds.has(item.id);
    const savingsPct = item.savedAmount && item.estimatedPrice ? (item.savedAmount / item.estimatedPrice) * 100 : 0;

    return (
      <div
        key={item.id}
        onClick={() => compareMode ? toggleCompare(item.id) : setSelectedItem(item)}
        style={{
          padding: '14px',
          backgroundColor: isSelected ? 'rgba(255,212,59,0.07)' : theme.surface,
          borderRadius: '6px',
          border: `0.5px solid ${isSelected ? theme.accent : (item.isPinned ? theme.accent : theme.border)}`,
          borderLeft: `4px solid ${isDeferred ? theme.textMuted : priorityColors[item.priority]}`,
          cursor: 'pointer',
          position: 'relative',
          opacity: isDeferred ? 0.55 : 1,
        }}
      >
        {/* Badges row */}
        <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
          {item.isPinned && (
            <span style={{ padding: '2px 6px', borderRadius: '3px', backgroundColor: 'rgba(255,212,59,0.15)', border: `0.5px solid ${theme.accent}`, fontFamily: 'monospace', fontSize: '8px', color: theme.accent, letterSpacing: '0.4px' }}>BUYING NEXT</span>
          )}
          {item.specLevel === 'exploring' && (
            <span style={{ padding: '2px 6px', borderRadius: '3px', backgroundColor: 'rgba(116,192,252,0.12)', border: `0.5px solid ${theme.blue}`, fontFamily: 'monospace', fontSize: '8px', color: theme.blue, letterSpacing: '0.4px' }}>EXPLORING</span>
          )}
          {isOwned && (
            <span style={{ padding: '2px 6px', borderRadius: '3px', backgroundColor: 'rgba(81,207,102,0.12)', border: `0.5px solid ${theme.green}`, fontFamily: 'monospace', fontSize: '8px', color: theme.green, letterSpacing: '0.4px' }}>YOU OWN THIS</span>
          )}
          {!isOwned && hasRoleOverlap && (
            <span style={{ padding: '2px 6px', borderRadius: '3px', backgroundColor: 'rgba(255,159,67,0.12)', border: `0.5px solid ${theme.orange}`, fontFamily: 'monospace', fontSize: '8px', color: theme.orange, letterSpacing: '0.4px' }}>ROLE OVERLAP</span>
          )}
          {isResurface && (
            <span style={{ padding: '2px 6px', borderRadius: '3px', backgroundColor: 'rgba(116,192,252,0.12)', border: `0.5px solid ${theme.blue}`, fontFamily: 'monospace', fontSize: '8px', color: theme.blue, letterSpacing: '0.4px' }}>REVISIT</span>
          )}
          {isDeferred && item.deferUntil && (
            <span style={{ padding: '2px 6px', borderRadius: '3px', backgroundColor: 'rgba(255,255,255,0.05)', border: `0.5px solid ${theme.border}`, fontFamily: 'monospace', fontSize: '8px', color: theme.textMuted, letterSpacing: '0.4px' }}>
              SNOOZED {new Date(item.deferUntil).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {compareMode && (
            <div style={{ width: '16px', height: '16px', borderRadius: '3px', border: `1.5px solid ${isSelected ? theme.accent : theme.textMuted}`, backgroundColor: isSelected ? theme.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isSelected && <span style={{ fontSize: '10px', color: theme.bg, fontWeight: 700 }}>✓</span>}
            </div>
          )}
        </div>

        {/* Title */}
        <div style={{ marginBottom: '8px', paddingRight: '90px' }}>
          {item.specLevel === 'specified' ? (
            <>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '2px' }}>{item.make} {item.model}</div>
              <div style={{ fontSize: '11px', color: theme.caliberRed, fontFamily: 'monospace' }}>{item.caliber}</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '12px', fontWeight: 600, color: theme.textPrimary, marginBottom: '2px', lineHeight: 1.3 }}>
                {item.goal || `${item.type} — researching`}
              </div>
              {item.caliber && <div style={{ fontSize: '10px', color: theme.caliberRed, fontFamily: 'monospace' }}>{item.caliber}</div>}
            </>
          )}
        </div>

        <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginBottom: '8px' }}>
          {item.type} · {new Date(item.addedDate).toLocaleDateString()}
          {item.researchNotes && item.researchNotes.length > 0 && (
            <span style={{ marginLeft: '8px', color: theme.blue }}>· {item.researchNotes.length} note{item.researchNotes.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {/* Price / budget */}
        {item.specLevel === 'specified' ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div>
              <div style={{ fontSize: '9px', color: theme.textMuted, fontFamily: 'monospace' }}>EST.</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: theme.green, fontFamily: 'monospace' }}>${item.estimatedPrice.toLocaleString()}</div>
            </div>
            <button
              onClick={e => refreshItemPrice(e, item)}
              disabled={valuingId === item.id}
              style={{ fontFamily: 'monospace', fontSize: '9px', padding: '3px 8px', borderRadius: '3px', border: `0.5px solid ${theme.accent}`, color: theme.accent, background: 'none', cursor: valuingId === item.id ? 'default' : 'pointer', opacity: valuingId === item.id ? 0.5 : 1 }}
            >
              {valuingId === item.id ? '...' : 'GET PRICE'}
              {!isPro && valuingId !== item.id && <span style={{ marginLeft: '5px', fontSize: '8px', opacity: 0.7 }}>PRO</span>}
            </button>
            {item.currentPrice != null && (
              <div style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                <div style={{ fontSize: '9px', color: theme.textMuted }}>CURRENT</div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>${item.currentPrice.toLocaleString()}</div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ marginBottom: '8px' }}>
            {(item.budgetMin != null || item.budgetMax != null) && (
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textSecondary, marginBottom: '6px' }}>
                Budget: {item.budgetMin ? `$${item.budgetMin.toLocaleString()}` : '?'} – {item.budgetMax ? `$${item.budgetMax.toLocaleString()}` : '?'}
              </div>
            )}
            {item.candidates && item.candidates.length > 0 && (
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {item.candidates.map(c => (
                  <span key={c.id} style={{ padding: '2px 7px', borderRadius: '10px', fontSize: '9px', fontFamily: 'monospace', backgroundColor: 'rgba(255,255,255,0.05)', color: theme.textSecondary, border: `0.5px solid ${theme.border}` }}>
                    {c.make} {c.model}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Price alert */}
        {isPriceAlert && (
          <div style={{ padding: '4px 8px', borderRadius: '3px', backgroundColor: 'rgba(81,207,102,0.1)', border: `0.5px solid ${theme.green}`, fontFamily: 'monospace', fontSize: '9px', color: theme.green, marginBottom: '8px' }}>
            Price at or below your alert target
          </div>
        )}

        {/* Savings bar */}
        {item.savedAmount && item.savedAmount > 0 && item.estimatedPrice > 0 && (
          <div>
            <div style={{ width: '100%', height: '5px', backgroundColor: theme.bg, borderRadius: '3px', overflow: 'hidden', marginBottom: '3px' }}>
              <div style={{ width: `${Math.min(savingsPct, 100)}%`, height: '100%', backgroundColor: theme.green }} />
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textSecondary }}>
              Saved ${item.savedAmount.toLocaleString()} ({savingsPct.toFixed(0)}%)
            </div>
          </div>
        )}

        {item.useCase && (
          <div style={{ marginTop: '8px', padding: '4px 8px', backgroundColor: theme.bg, borderRadius: '3px', fontSize: '10px', color: theme.textSecondary }}>{item.useCase}</div>
        )}
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.bg,
      color: theme.textPrimary,
      padding: isMobile ? '16px' : '24px',
      paddingBottom: isMobile ? '80px' : '24px',
    }}>
      {/* Header */}
      <div style={{ borderBottom: `0.5px solid ${theme.border}`, paddingBottom: '12px', marginBottom: '16px' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, letterSpacing: '1.5px', marginBottom: '2px' }}>
          WISHLIST
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>
          Collection planning · budget tracking · gap analysis
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
        {[
          { label: 'ACTIVE', value: activeItems.length, color: theme.accent },
          { label: 'TOTAL COST', value: totalValue ? `$${totalValue.toLocaleString()}` : '—', color: theme.textPrimary },
          { label: 'SAVED', value: `$${totalSaved.toLocaleString()}`, color: theme.green },
          { label: 'HIGH PRIORITY', value: highPriorityCount, color: theme.red },
        ].map(s => (
          <div key={s.label} style={cardStyle}>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.8px', color: theme.textMuted, marginBottom: '6px' }}>{s.label}</div>
            <div style={{ fontFamily: 'monospace', fontSize: '24px', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Budget progress */}
      {totalValue > 0 && totalSaved > 0 && (
        <div style={{ ...cardStyle, marginBottom: '16px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.8px', color: theme.textMuted, marginBottom: '10px' }}>BUDGET PROGRESS</div>
          <div style={{ width: '100%', height: '28px', backgroundColor: theme.bg, borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
            <div style={{ width: `${Math.min((totalSaved / totalValue) * 100, 100)}%`, height: '100%', backgroundColor: theme.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#fff' }}>{((totalSaved / totalValue) * 100).toFixed(0)}%</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: theme.textSecondary, fontFamily: 'monospace' }}>
            <span>Saved: ${totalSaved.toLocaleString()}</span>
            <span>Remaining: ${(totalValue - totalSaved).toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Caliber gap banner */}
      {newCalibers.length > 0 && (
        <div style={{ backgroundColor: 'rgba(116,192,252,0.08)', border: `0.5px solid ${theme.blue}`, borderLeft: `3px solid ${theme.blue}`, borderRadius: '6px', marginBottom: '16px', padding: '12px 14px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: 700, letterSpacing: '0.8px', color: theme.blue, marginBottom: '4px' }}>GAP ANALYSIS</div>
          <div style={{ fontFamily: 'monospace', fontSize: '11px', color: theme.textSecondary }}>
            {newCalibers.length} new caliber{newCalibers.length !== 1 ? 's' : ''}: {newCalibers.join(', ')}
          </div>
          <button onClick={() => setShowGapAnalysis(true)} style={{ marginTop: '8px', padding: '4px 10px', backgroundColor: 'transparent', color: theme.blue, border: `0.5px solid ${theme.blue}`, borderRadius: '4px', fontFamily: 'monospace', fontSize: '9px', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.5px' }}>
            VIEW ANALYSIS
          </button>
        </div>
      )}

      {/* Action row */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px', alignItems: 'center' }}>
        <button
          onClick={() => { setEditingItem(null); setShowItemForm(true); }}
          style={{ padding: '12px 20px', backgroundColor: theme.accent, color: theme.bg, border: 'none', borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px', letterSpacing: '1px', fontWeight: 700, cursor: 'pointer' }}
        >
          + ADD ITEM
        </button>

        {wishlistItems.some(w => w.specLevel === 'specified') && (
          <button
            onClick={refreshAllPrices}
            disabled={valuingAll}
            style={{ padding: '12px 16px', backgroundColor: 'transparent', color: valuingAll ? theme.textMuted : theme.accent, border: `0.5px solid ${valuingAll ? theme.textMuted : theme.accent}`, borderRadius: '6px', fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.5px', cursor: valuingAll ? 'default' : 'pointer' }}
          >
            {valuingAll && valuingProgress ? `${valuingProgress.done}/${valuingProgress.total}` : 'REFRESH ALL PRICES'}
            {!isPro && !valuingAll && <span style={{ marginLeft: '6px', fontSize: '8px', opacity: 0.7 }}>PRO</span>}
          </button>
        )}

        {wishlistItems.length >= 2 && (
          <button
            onClick={() => { setCompareMode(m => !m); setCompareIds([]); }}
            style={{ padding: '12px 16px', backgroundColor: compareMode ? theme.accent : 'transparent', color: compareMode ? theme.bg : theme.textSecondary, border: `0.5px solid ${compareMode ? theme.accent : theme.border}`, borderRadius: '6px', fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.5px', cursor: 'pointer' }}
          >
            COMPARE
          </button>
        )}
      </div>

      {compareMode && (
        <div style={{ marginBottom: '12px' }}>
          {compareIds.length === 2 ? (
            <button
              onClick={() => setShowCompare(true)}
              style={{ width: '100%', padding: '11px', backgroundColor: theme.accent, color: theme.bg, border: 'none', borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', cursor: 'pointer' }}
            >
              COMPARE SELECTED (2)
            </button>
          ) : (
            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>
              Select {2 - compareIds.length} item{compareIds.length === 0 ? 's' : ''} to compare
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <select value={filterSpec} onChange={e => setFilterSpec(e.target.value)} style={selectStyle}>
          <option value="all">All Items</option>
          <option value="specified">Specified</option>
          <option value="exploring">Exploring</option>
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={selectStyle}>
          <option value="all">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={selectStyle}>
          <option value="all">All Types</option>
          <option value="Pistol">Pistol</option>
          <option value="Rifle">Rifle</option>
          <option value="Shotgun">Shotgun</option>
          <option value="Suppressor">Suppressor</option>
          <option value="NFA">NFA</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as 'priority' | 'price' | 'date')} style={selectStyle}>
          <option value="priority">Sort: Priority</option>
          <option value="price">Sort: Price</option>
          <option value="date">Sort: Date Added</option>
        </select>
      </div>

      {/* Active items */}
      {filteredItems.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '40px', color: theme.textMuted, fontSize: '12px' }}>
          {wishlistItems.length === 0 ? 'No items yet. Click "+ ADD ITEM" to start planning.' : 'No items match the current filters.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
          {filteredItems.map(item => renderCard(item))}
        </div>
      )}

      {/* Snoozed items toggle + list */}
      {deferredCount > 0 && (
        <div style={{ marginTop: '24px' }}>
          <button
            onClick={() => setShowDeferred(s => !s)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: theme.textMuted, fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer', padding: 0, letterSpacing: '0.5px' }}
          >
            <span style={{ fontSize: '8px' }}>{showDeferred ? '▼' : '▶'}</span>
            SNOOZED ({deferredCount})
          </button>
          {showDeferred && (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px', marginTop: '10px' }}>
              {deferredItems.map(item => renderCard(item, true))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showItemForm && (
        <WishlistItemForm
          initial={editingItem ?? undefined}
          onSave={(data) => handleSaveItem(data, editingItem?.id)}
          onCancel={() => { setShowItemForm(false); setEditingItem(null); }}
        />
      )}

      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          isPro={isPro}
          onUpgrade={onUpgrade}
          onClose={() => setSelectedItem(null)}
          onDelete={() => deleteItem(selectedItem.id)}
          onEdit={() => { setEditingItem(selectedItem); setShowItemForm(true); setSelectedItem(null); }}
          onBuyIt={onBuyIt ? (prefill) => { deleteItem(selectedItem.id); onBuyIt(prefill); } : undefined}
          onRefreshPrice={(e, candidateId) => refreshItemPrice(e, selectedItem, candidateId)}
          valuingCandidateId={valuingCandidateId}
          onPromoteCandidate={(cid) => promoteCandidate(selectedItem.id, cid)}
          onAddCandidate={(c) => addCandidateToItem(selectedItem.id, c)}
          onRemoveCandidate={(cid) => removeCandidateFromItem(selectedItem.id, cid)}
          onPinToggle={() => togglePin(selectedItem.id)}
          onSnooze={(date) => setSnooze(selectedItem.id, date)}
          onClearSnooze={() => clearSnooze(selectedItem.id)}
          onAddNote={(text) => addResearchNote(selectedItem.id, text)}
          roleOverlapGun={roleOverlapMap.get(selectedItem.id)}
          onAddCandidateFromRec={(c) => addCandidateToItem(selectedItem.id, c)}
        />
      )}

      {showCompare && compareIds.length === 2 && (() => {
        const i1 = wishlistItems.find(w => w.id === compareIds[0]);
        const i2 = wishlistItems.find(w => w.id === compareIds[1]);
        if (!i1 || !i2) return null;
        return (
          <ComparisonModal
            item1={i1}
            item2={i2}
            onClose={() => { setShowCompare(false); setCompareMode(false); setCompareIds([]); }}
          />
        );
      })()}

      {showGapAnalysis && (
        <GapAnalysisModal ownedGuns={ownedGuns} wishlistItems={wishlistItems} onClose={() => setShowGapAnalysis(false)} />
      )}
    </div>
  );
}

// ── WishlistItemForm ───────────────────────────────────────────────────────────

function WishlistItemForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: WishlistItem;
  onSave: (data: Omit<WishlistItem, 'id' | 'addedDate'>) => void;
  onCancel: () => void;
}) {
  const isEdit = !!initial;
  const defaultMode = initial?.specLevel ?? 'specified';
  const [mode, setMode] = useState<'specified' | 'exploring'>(defaultMode);
  const { isMobile } = useResponsive();

  const [make, setMake] = useState(initial?.make ?? '');
  const [model, setModel] = useState(initial?.model ?? '');
  const [caliber, setCaliber] = useState(initial?.caliber ?? '');
  const [estimatedPrice, setEstimatedPrice] = useState(initial?.estimatedPrice?.toString() ?? '');
  const [goal, setGoal] = useState(initial?.goal ?? '');
  const [budgetMin, setBudgetMin] = useState(initial?.budgetMin?.toString() ?? '');
  const [budgetMax, setBudgetMax] = useState(initial?.budgetMax?.toString() ?? '');
  const [type, setType] = useState<WishlistItem['type']>(initial?.type ?? 'Pistol');
  const [priority, setPriority] = useState<WishlistItem['priority']>(initial?.priority ?? 'medium');
  const [useCase, setUseCase] = useState(initial?.useCase ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [link, setLink] = useState(initial?.link ?? '');
  const [savedAmount, setSavedAmount] = useState(initial?.savedAmount?.toString() ?? '');
  const [priceAlertThreshold, setPriceAlertThreshold] = useState(initial?.priceAlertThreshold?.toString() ?? '');
  const [targetDate, setTargetDate] = useState(initial?.targetDate ?? '');
  const [pros, setPros] = useState<string[]>(initial?.pros ?? []);
  const [cons, setCons] = useState<string[]>(initial?.cons ?? []);
  const [alts, setAlts] = useState<string[]>(initial?.alternativeOptions ?? []);
  const [proInput, setProInput] = useState('');
  const [conInput, setConInput] = useState('');
  const [altInput, setAltInput] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const shared = {
      type, priority,
      useCase: useCase.trim() || undefined, notes: notes.trim() || undefined,
      link: link.trim() || undefined,
      savedAmount: parseFloat(savedAmount) || undefined,
      targetDate: targetDate || undefined,
      pros: pros.length ? pros : undefined, cons: cons.length ? cons : undefined,
      alternativeOptions: alts.length ? alts : undefined,
      // Preserve management fields on edit
      isPinned: initial?.isPinned,
      deferUntil: initial?.deferUntil,
      researchNotes: initial?.researchNotes,
    };
    if (mode === 'specified') {
      if (!make.trim() || !model.trim() || !caliber.trim()) return;
      onSave({
        specLevel: 'specified', make: make.trim(), model: model.trim(), caliber: caliber.trim(),
        estimatedPrice: parseFloat(estimatedPrice) || 0,
        priceAlertThreshold: parseFloat(priceAlertThreshold) || undefined,
        currentPrice: initial?.currentPrice, lowestPrice: initial?.lowestPrice,
        priceHistory: initial?.priceHistory, candidates: initial?.candidates,
        ...shared,
      });
    } else {
      if (!goal.trim()) return;
      onSave({
        specLevel: 'exploring', make: '', model: '', caliber: caliber.trim(),
        goal: goal.trim(),
        budgetMin: parseFloat(budgetMin) || undefined,
        budgetMax: parseFloat(budgetMax) || undefined,
        estimatedPrice: 0,
        candidates: initial?.candidates ?? [],
        ...shared,
      });
    }
  }

  const inputStyle = { width: '100%', padding: '10px', backgroundColor: theme.bg, border: `0.5px solid ${theme.border}`, borderRadius: '4px', color: theme.textPrimary, fontFamily: 'monospace', fontSize: '13px', boxSizing: 'border-box' as const };
  const labelStyle = { display: 'block' as const, fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.8px', color: theme.textSecondary, marginBottom: '5px', textTransform: 'uppercase' as const };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: isMobile ? '16px' : '24px', overflowY: 'auto' }} onClick={onCancel}>
      <div style={{ backgroundColor: theme.surface, borderRadius: '8px', padding: isMobile ? '20px' : '28px', maxWidth: '680px', width: '100%', maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>

        <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, letterSpacing: '1px', marginBottom: '20px' }}>
          {isEdit ? 'EDIT ITEM' : 'ADD TO WISHLIST'}
        </div>

        {(!isEdit || initial?.specLevel === 'exploring') && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {(['specified', 'exploring'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                style={{
                  flex: 1, padding: '10px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px', cursor: 'pointer',
                  backgroundColor: mode === m ? theme.accent : 'transparent',
                  color: mode === m ? theme.bg : theme.textSecondary,
                  border: `0.5px solid ${mode === m ? theme.accent : theme.border}`,
                }}
              >
                {m === 'specified' ? 'KNOW WHAT I WANT' : 'STILL EXPLORING'}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
            {mode === 'specified' ? (
              <>
                <div><label style={labelStyle}>Make *</label><input value={make} onChange={e => setMake(e.target.value)} style={inputStyle} placeholder="Glock, Barrett, Staccato…" required /></div>
                <div><label style={labelStyle}>Model *</label><input value={model} onChange={e => setModel(e.target.value)} style={inputStyle} placeholder="19, MRAD, P…" required /></div>
                <div><label style={labelStyle}>Caliber *</label><input value={caliber} onChange={e => setCaliber(e.target.value)} style={inputStyle} placeholder=".338 Lapua, 9mm…" required /></div>
                <div><label style={labelStyle}>Estimated Price *</label><input type="number" value={estimatedPrice} onChange={e => setEstimatedPrice(e.target.value)} style={inputStyle} required /></div>
              </>
            ) : (
              <>
                <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                  <label style={labelStyle}>Goal / What I'm Looking For *</label>
                  <input value={goal} onChange={e => setGoal(e.target.value)} style={inputStyle} placeholder="Competition pistol to reach Master · 338 LM precision rifle · Home defense shotgun" required />
                </div>
                <div><label style={labelStyle}>Caliber (if known)</label><input value={caliber} onChange={e => setCaliber(e.target.value)} style={inputStyle} placeholder=".338 Lapua, 9mm…" /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div><label style={labelStyle}>Budget Min</label><input type="number" value={budgetMin} onChange={e => setBudgetMin(e.target.value)} style={inputStyle} placeholder="$" /></div>
                  <div><label style={labelStyle}>Budget Max</label><input type="number" value={budgetMax} onChange={e => setBudgetMax(e.target.value)} style={inputStyle} placeholder="$" /></div>
                </div>
              </>
            )}

            <div>
              <label style={labelStyle}>Type *</label>
              <select value={type} onChange={e => setType(e.target.value as WishlistItem['type'])} style={inputStyle}>
                {(['Pistol', 'Rifle', 'Shotgun', 'Suppressor', 'NFA'] as const).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value as WishlistItem['priority'])} style={inputStyle}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div><label style={labelStyle}>Use Case</label><input value={useCase} onChange={e => setUseCase(e.target.value)} style={inputStyle} placeholder="Competition, EDC, Hunting…" /></div>
            <div><label style={labelStyle}>Amount Saved</label><input type="number" value={savedAmount} onChange={e => setSavedAmount(e.target.value)} style={inputStyle} /></div>
            {mode === 'specified' && (
              <>
                <div>
                  <label style={labelStyle}>Price Alert Threshold</label>
                  <input type="number" value={priceAlertThreshold} onChange={e => setPriceAlertThreshold(e.target.value)} style={inputStyle} placeholder="Badge fires when price drops below…" />
                </div>
                <div><label style={labelStyle}>Target Buy Date</label><input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} style={inputStyle} /></div>
              </>
            )}
          </div>

          <div style={{ marginTop: '14px' }}>
            <label style={labelStyle}>Link / Reference</label>
            <input type="url" value={link} onChange={e => setLink(e.target.value)} style={inputStyle} placeholder="https://…" />
          </div>

          {/* Pros */}
          <div style={{ marginTop: '14px' }}>
            <label style={labelStyle}>Pros</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
              <input value={proInput} onChange={e => setProInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (proInput.trim()) { setPros([...pros, proInput.trim()]); setProInput(''); } } }} style={{ ...inputStyle, flex: 1 }} placeholder="Enter a pro, press Enter" />
              <button type="button" onClick={() => { if (proInput.trim()) { setPros([...pros, proInput.trim()]); setProInput(''); } }} style={{ padding: '10px 14px', backgroundColor: theme.green, color: '#fff', border: 'none', borderRadius: '4px', fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer', fontWeight: 700 }}>ADD</button>
            </div>
            {pros.map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', backgroundColor: theme.bg, borderRadius: '3px', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: theme.green }}>✓ {p}</span>
                <button type="button" onClick={() => setPros(pros.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: theme.red, cursor: 'pointer', fontSize: '14px' }}>×</button>
              </div>
            ))}
          </div>

          {/* Cons */}
          <div style={{ marginTop: '14px' }}>
            <label style={labelStyle}>Cons</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
              <input value={conInput} onChange={e => setConInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (conInput.trim()) { setCons([...cons, conInput.trim()]); setConInput(''); } } }} style={{ ...inputStyle, flex: 1 }} placeholder="Enter a con, press Enter" />
              <button type="button" onClick={() => { if (conInput.trim()) { setCons([...cons, conInput.trim()]); setConInput(''); } }} style={{ padding: '10px 14px', backgroundColor: theme.red, color: '#fff', border: 'none', borderRadius: '4px', fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer', fontWeight: 700 }}>ADD</button>
            </div>
            {cons.map((c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', backgroundColor: theme.bg, borderRadius: '3px', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: theme.red }}>✗ {c}</span>
                <button type="button" onClick={() => setCons(cons.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: theme.red, cursor: 'pointer', fontSize: '14px' }}>×</button>
              </div>
            ))}
          </div>

          {/* Alternatives */}
          <div style={{ marginTop: '14px' }}>
            <label style={labelStyle}>Alternatives Considered</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
              <input value={altInput} onChange={e => setAltInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (altInput.trim()) { setAlts([...alts, altInput.trim()]); setAltInput(''); } } }} style={{ ...inputStyle, flex: 1 }} placeholder="e.g., Glock 17, CZ P-10C" />
              <button type="button" onClick={() => { if (altInput.trim()) { setAlts([...alts, altInput.trim()]); setAltInput(''); } }} style={{ padding: '10px 14px', backgroundColor: theme.accent, color: theme.bg, border: 'none', borderRadius: '4px', fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer', fontWeight: 700 }}>ADD</button>
            </div>
            {alts.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {alts.map((a, i) => (
                  <span key={i} style={{ padding: '3px 8px', backgroundColor: theme.bg, borderRadius: '10px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {a}
                    <button type="button" onClick={() => setAlts(alts.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: theme.red, cursor: 'pointer', fontSize: '12px', padding: 0 }}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div style={{ marginTop: '14px' }}>
            <label style={labelStyle}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Additional notes…" />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button type="button" onClick={onCancel} style={{ padding: '10px 16px', backgroundColor: 'transparent', color: theme.textPrimary, border: `0.5px solid ${theme.border}`, borderRadius: '4px', fontFamily: 'monospace', fontSize: '11px', cursor: 'pointer' }}>CANCEL</button>
            <button type="submit" style={{ padding: '10px 20px', backgroundColor: theme.accent, color: theme.bg, border: 'none', borderRadius: '4px', fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
              {isEdit ? 'SAVE CHANGES' : 'ADD TO WISHLIST'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── ItemDetailModal ────────────────────────────────────────────────────────────

function ItemDetailModal({
  item,
  isPro,
  onUpgrade,
  onClose,
  onDelete,
  onEdit,
  onBuyIt,
  onRefreshPrice,
  valuingCandidateId,
  onPromoteCandidate,
  onAddCandidate,
  onRemoveCandidate,
  onPinToggle,
  onSnooze,
  onClearSnooze,
  onAddNote,
  roleOverlapGun,
  onAddCandidateFromRec,
}: {
  item: WishlistItem;
  isPro?: boolean;
  onUpgrade?: (reason: string) => void;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onBuyIt?: (prefill: { make?: string; model?: string; caliber?: string; type?: string }) => void;
  onRefreshPrice: (e: React.MouseEvent, candidateId?: string) => void;
  valuingCandidateId: string | null;
  onPromoteCandidate: (candidateId: string) => void;
  onAddCandidate: (candidate: Omit<WishlistCandidate, 'id'>) => void;
  onRemoveCandidate: (candidateId: string) => void;
  onPinToggle: () => void;
  onSnooze: (date: string) => void;
  onClearSnooze: () => void;
  onAddNote: (text: string) => void;
  roleOverlapGun?: Gun;
  onAddCandidateFromRec: (candidate: Omit<WishlistCandidate, 'id'>) => void;
}) {
  const { isMobile } = useResponsive();
  const [aiResult, setAiResult] = useState<AiVerdict | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [candidateMake, setCandidateMake] = useState('');
  const [candidateModel, setCandidateModel] = useState('');
  const [candidateNotes, setCandidateNotes] = useState('');
  const [showBuyPicker, setShowBuyPicker] = useState(false);
  // Snooze
  const [showSnoozeInput, setShowSnoozeInput] = useState(false);
  const [snoozeDate, setSnoozeDate] = useState('');
  // Research notes
  const [noteInput, setNoteInput] = useState('');
  // Role overlap panel
  const [overlapDismissed, setOverlapDismissed] = useState(false);
  const [showRecPanel, setShowRecPanel] = useState(false);
  const [overlapRefinement, setOverlapRefinement] = useState('');
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [recommendations, setRecommendations] = useState<WishlistRecommendation[]>([]);
  const [addedRecIds, setAddedRecIds] = useState<Set<number>>(new Set());

  // Pre-fill refinement when panel opens
  useEffect(() => {
    if (showRecPanel && roleOverlapGun && !overlapRefinement) {
      const context = item.specLevel === 'specified'
        ? `${item.make} ${item.model}`
        : (item.goal || `${item.type}`);
      setOverlapRefinement(`Something different from the ${roleOverlapGun.make} ${roleOverlapGun.model} — `);
    }
  }, [showRecPanel]); // eslint-disable-line react-hooks/exhaustive-deps

  async function runAiAnalysis() {
    if (!isPro) { onUpgrade?.('wishlist_ai'); return; }
    setAnalyzing(true);
    setAiError(null);
    try {
      const context = item.specLevel === 'specified'
        ? `Gun: ${item.make} ${item.model} (${item.caliber}, ${item.type})
Use case: ${item.useCase || 'Not specified'}
Budget: $${item.estimatedPrice.toLocaleString()}
Pros: ${item.pros?.join(', ') || 'None listed'}
Cons: ${item.cons?.join(', ') || 'None listed'}
Alternatives considered: ${item.alternativeOptions?.join(', ') || 'None'}
Notes: ${item.notes || 'None'}`
        : `Goal: ${item.goal || `${item.type} — researching`}
Type: ${item.type}${item.caliber ? `\nCaliber: ${item.caliber}` : ''}
Budget: ${item.budgetMin ? `$${item.budgetMin.toLocaleString()}` : '?'} – ${item.budgetMax ? `$${item.budgetMax.toLocaleString()}` : '?'}
Candidates: ${item.candidates?.map(c => `${c.make} ${c.model}`).join(', ') || 'None yet'}
Use case: ${item.useCase || 'Not specified'}
Pros: ${item.pros?.join(', ') || 'None listed'}
Cons: ${item.cons?.join(', ') || 'None listed'}
Notes: ${item.notes || 'None'}`;

      const raw = await callWishlistAnalysis(context);
      const parsed: AiVerdict = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? raw);
      setAiResult(parsed);
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  }

  async function runRecommendations() {
    if (!isPro) { onUpgrade?.('wishlist_ai'); return; }
    if (!roleOverlapGun || !overlapRefinement.trim()) return;
    setLoadingRecs(true);
    try {
      const wishlistContext = item.specLevel === 'specified'
        ? `${item.make} ${item.model} (${item.type}, ${item.caliber})`
        : `${item.goal || item.type}${item.caliber ? ` (${item.caliber})` : ''}${item.budgetMax ? `, budget up to $${item.budgetMax.toLocaleString()}` : ''}`;
      const recs = await callWishlistRecommendations(
        { make: roleOverlapGun.make, model: roleOverlapGun.model, type: roleOverlapGun.type ?? item.type, caliber: roleOverlapGun.caliber ?? '' },
        wishlistContext,
        overlapRefinement.trim(),
      );
      setRecommendations(recs);
    } catch {
      setRecommendations([]);
    } finally {
      setLoadingRecs(false);
    }
  }

  function handleBuyIt() {
    if (!onBuyIt) return;
    if (item.specLevel === 'exploring' && item.candidates && item.candidates.length > 0) {
      setShowBuyPicker(true);
    } else {
      onBuyIt({ make: item.make || undefined, model: item.model || undefined, caliber: item.caliber || undefined, type: item.type });
    }
  }

  function confirmBuy(candidateId?: string) {
    if (!onBuyIt) return;
    if (candidateId) {
      const c = item.candidates?.find(x => x.id === candidateId);
      if (c) onBuyIt({ make: c.make, model: c.model, caliber: item.caliber || undefined, type: item.type });
    } else {
      onBuyIt({ make: item.make || undefined, model: item.model || undefined, caliber: item.caliber || undefined, type: item.type });
    }
  }

  function handleSnoozeSubmit() {
    if (!snoozeDate) return;
    onSnooze(new Date(snoozeDate).toISOString());
    setShowSnoozeInput(false);
    setSnoozeDate('');
    onClose();
  }

  const verdictColor = { buy: theme.green, wait: theme.orange, skip: theme.red };
  const inputStyle = { width: '100%', padding: '8px 10px', backgroundColor: theme.bg, border: `0.5px solid ${theme.border}`, borderRadius: '4px', color: theme.textPrimary, fontFamily: 'monospace', fontSize: '12px', boxSizing: 'border-box' as const };
  const isDeferred = !!item.deferUntil;
  const deferDate = item.deferUntil ? new Date(item.deferUntil) : null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: isMobile ? '16px' : '24px' }} onClick={onClose}>
      <div style={{ backgroundColor: theme.surface, borderRadius: '8px', padding: isMobile ? '20px' : '28px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '4px' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                {item.specLevel === 'specified' ? `${item.make} ${item.model}` : (item.goal || `${item.type} — exploring`)}
              </div>
              {item.specLevel === 'specified'
                ? <div style={{ fontSize: '13px', color: theme.caliberRed, marginTop: '2px' }}>{item.caliber} · {item.type}</div>
                : <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '2px', fontFamily: 'monospace' }}>{item.type}{item.caliber ? ` · ${item.caliber}` : ''}</div>}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              {/* Pin toggle */}
              <button
                onClick={onPinToggle}
                title={item.isPinned ? 'Unpin' : 'Pin as Buying Next'}
                style={{ padding: '6px 10px', backgroundColor: item.isPinned ? 'rgba(255,212,59,0.15)' : 'transparent', color: item.isPinned ? theme.accent : theme.textMuted, border: `0.5px solid ${item.isPinned ? theme.accent : theme.border}`, borderRadius: '4px', fontFamily: 'monospace', fontSize: '9px', cursor: 'pointer', letterSpacing: '0.5px' }}
              >
                {item.isPinned ? 'PINNED' : 'PIN'}
              </button>
              <button onClick={onEdit} style={{ padding: '6px 12px', backgroundColor: 'transparent', color: theme.accent, border: `0.5px solid ${theme.accent}`, borderRadius: '4px', fontFamily: 'monospace', fontSize: '9px', cursor: 'pointer', letterSpacing: '0.5px' }}>EDIT</button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ padding: '2px 8px', borderRadius: '3px', fontSize: '9px', fontFamily: 'monospace', fontWeight: 700, color: priorityColors[item.priority], backgroundColor: 'rgba(255,255,255,0.05)', border: `0.5px solid ${priorityColors[item.priority]}` }}>
              {item.priority.toUpperCase()}
            </span>
            {item.specLevel === 'exploring' && (
              <span style={{ padding: '2px 8px', borderRadius: '3px', fontSize: '9px', fontFamily: 'monospace', color: theme.blue, backgroundColor: 'rgba(116,192,252,0.1)', border: `0.5px solid ${theme.blue}` }}>EXPLORING</span>
            )}
            {isDeferred && deferDate && (
              <span style={{ padding: '2px 8px', borderRadius: '3px', fontSize: '9px', fontFamily: 'monospace', color: theme.textMuted, backgroundColor: 'rgba(255,255,255,0.04)', border: `0.5px solid ${theme.border}` }}>
                SNOOZED · {deferDate.toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Role overlap banner */}
        {roleOverlapGun && !overlapDismissed && (
          <div style={{ padding: '12px 14px', backgroundColor: 'rgba(255,159,67,0.08)', border: `0.5px solid ${theme.orange}`, borderLeft: `3px solid ${theme.orange}`, borderRadius: '6px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: 700, color: theme.orange, letterSpacing: '0.8px', marginBottom: '4px' }}>ROLE OVERLAP</div>
                <div style={{ fontSize: '12px', color: theme.textSecondary }}>
                  You own a <strong style={{ color: theme.textPrimary }}>{roleOverlapGun.make} {roleOverlapGun.model}</strong> ({roleOverlapGun.type} · {roleOverlapGun.caliber}) that covers the same role.
                </div>
              </div>
              <button onClick={() => setOverlapDismissed(true)} style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', fontSize: '16px', flexShrink: 0, padding: 0 }}>×</button>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button
                onClick={() => setShowRecPanel(s => !s)}
                style={{ padding: '6px 12px', backgroundColor: showRecPanel ? theme.orange : 'transparent', color: showRecPanel ? theme.bg : theme.orange, border: `0.5px solid ${theme.orange}`, borderRadius: '4px', fontFamily: 'monospace', fontSize: '9px', cursor: 'pointer', fontWeight: 700, letterSpacing: '0.5px' }}
              >
                HELP ME FIND SOMETHING DIFFERENT
              </button>
            </div>

            {/* Recommendations panel */}
            {showRecPanel && (
              <div style={{ marginTop: '12px', borderTop: `0.5px solid ${theme.border}`, paddingTop: '12px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, letterSpacing: '0.8px', marginBottom: '6px' }}>DESCRIBE WHAT YOU WANT INSTEAD</div>
                <textarea
                  value={overlapRefinement}
                  onChange={e => setOverlapRefinement(e.target.value)}
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical', marginBottom: '8px', fontSize: '12px' }}
                  placeholder={`e.g., "Something smaller and lighter than the ${roleOverlapGun.make} ${roleOverlapGun.model}, under $600"`}
                />
                <button
                  onClick={runRecommendations}
                  disabled={loadingRecs || !overlapRefinement.trim()}
                  style={{ padding: '8px 16px', backgroundColor: isPro ? theme.orange : 'transparent', color: isPro ? theme.bg : theme.textMuted, border: `0.5px solid ${isPro ? theme.orange : theme.border}`, borderRadius: '4px', fontFamily: 'monospace', fontSize: '10px', fontWeight: 700, cursor: loadingRecs || !overlapRefinement.trim() ? 'default' : 'pointer', opacity: loadingRecs || !overlapRefinement.trim() ? 0.6 : 1, letterSpacing: '0.5px' }}
                >
                  {loadingRecs ? 'ANALYZING...' : 'ASK ASSISTANT'}
                  {!isPro && <span style={{ marginLeft: '6px', fontSize: '8px', opacity: 0.7 }}>PRO</span>}
                </button>

                {recommendations.length > 0 && (
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, letterSpacing: '0.8px' }}>RECOMMENDATIONS</div>
                    {recommendations.map((rec, i) => (
                      <div key={i} style={{ padding: '10px 12px', backgroundColor: theme.surface, borderRadius: '4px', border: `0.5px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '2px' }}>{rec.make} {rec.model}</div>
                          <div style={{ fontSize: '10px', color: theme.textSecondary, lineHeight: 1.4 }}>{rec.reason}</div>
                          {rec.estimatedPrice && (
                            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.green, marginTop: '3px' }}>~${rec.estimatedPrice.toLocaleString()}</div>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            if (!addedRecIds.has(i)) {
                              onAddCandidateFromRec({ make: rec.make, model: rec.model, notes: rec.reason, currentPrice: rec.estimatedPrice });
                              setAddedRecIds(prev => new Set(prev).add(i));
                            }
                          }}
                          disabled={addedRecIds.has(i)}
                          style={{ padding: '5px 10px', backgroundColor: addedRecIds.has(i) ? 'transparent' : theme.accent, color: addedRecIds.has(i) ? theme.textMuted : theme.bg, border: `0.5px solid ${addedRecIds.has(i) ? theme.border : theme.accent}`, borderRadius: '4px', fontFamily: 'monospace', fontSize: '9px', fontWeight: 700, cursor: addedRecIds.has(i) ? 'default' : 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                        >
                          {addedRecIds.has(i) ? 'ADDED' : '+ CANDIDATE'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Price / Budget section */}
        <div style={{ padding: '14px', backgroundColor: theme.bg, borderRadius: '6px', marginBottom: '16px' }}>
          {item.specLevel === 'specified' ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '9px', color: theme.textMuted, fontFamily: 'monospace', marginBottom: '3px' }}>ESTIMATED</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: theme.green, fontFamily: 'monospace' }}>${item.estimatedPrice.toLocaleString()}</div>
                </div>
                {item.currentPrice != null && (
                  <div>
                    <div style={{ fontSize: '9px', color: theme.textMuted, fontFamily: 'monospace', marginBottom: '3px' }}>CURRENT</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'monospace' }}>${item.currentPrice.toLocaleString()}</div>
                  </div>
                )}
                {item.lowestPrice != null && item.priceHistory && item.priceHistory.length > 1 && (
                  <div>
                    <div style={{ fontSize: '9px', color: theme.textMuted, fontFamily: 'monospace', marginBottom: '3px' }}>LOWEST SEEN</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: theme.green, fontFamily: 'monospace' }}>${item.lowestPrice.toLocaleString()}</div>
                  </div>
                )}
              </div>

              {/* Price alert status */}
              {item.priceAlertThreshold != null && (
                <div style={{ marginBottom: '10px' }}>
                  {item.currentPrice != null && item.currentPrice <= item.priceAlertThreshold ? (
                    <div style={{ padding: '6px 10px', borderRadius: '4px', backgroundColor: 'rgba(81,207,102,0.12)', border: `0.5px solid ${theme.green}`, fontFamily: 'monospace', fontSize: '10px', color: theme.green }}>
                      Price (${item.currentPrice.toLocaleString()}) is at or below your alert target (${item.priceAlertThreshold.toLocaleString()})
                    </div>
                  ) : (
                    <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted }}>
                      Alert threshold: ${item.priceAlertThreshold.toLocaleString()}
                      {item.currentPrice != null ? ` · $${(item.currentPrice - item.priceAlertThreshold).toLocaleString()} above target` : ''}
                    </div>
                  )}
                </div>
              )}

              {/* Price history */}
              {item.priceHistory && item.priceHistory.length > 0 && (
                <div>
                  <div style={{ fontSize: '9px', color: theme.textMuted, fontFamily: 'monospace', marginBottom: '6px' }}>PRICE HISTORY</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {[...item.priceHistory].reverse().slice(0, 8).map((pt, i, arr) => {
                      const prev = arr[i + 1];
                      const delta = prev ? pt.price - prev.price : null;
                      return (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'monospace', fontSize: '10px' }}>
                          <span style={{ color: theme.textMuted }}>{new Date(pt.date).toLocaleDateString()}</span>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {delta != null && (
                              <span style={{ fontSize: '9px', color: delta < 0 ? theme.green : delta > 0 ? theme.red : theme.textMuted }}>
                                {delta > 0 ? '+' : ''}{delta !== 0 ? `$${Math.abs(delta).toLocaleString()}` : '—'}
                              </span>
                            )}
                            <span style={{ color: theme.textPrimary }}>${pt.price.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {(item.budgetMin != null || item.budgetMax != null) && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '9px', color: theme.textMuted, fontFamily: 'monospace', marginBottom: '3px' }}>BUDGET RANGE</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'monospace' }}>
                    {item.budgetMin ? `$${item.budgetMin.toLocaleString()}` : '?'} – {item.budgetMax ? `$${item.budgetMax.toLocaleString()}` : '?'}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Candidates (exploring items) */}
        {item.specLevel === 'exploring' && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '10px', color: theme.textMuted, fontFamily: 'monospace', letterSpacing: '0.8px', marginBottom: '8px' }}>CANDIDATES</div>
            {item.candidates && item.candidates.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                {item.candidates.map(c => (
                  <div key={c.id} style={{ padding: '10px 12px', backgroundColor: theme.bg, borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: 600 }}>{c.make} {c.model}</div>
                      {c.currentPrice != null && (
                        <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.green }}>${c.currentPrice.toLocaleString()}</div>
                      )}
                      {c.notes && <div style={{ fontSize: '10px', color: theme.textMuted, marginTop: '2px' }}>{c.notes}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button
                        onClick={e => onRefreshPrice(e, c.id)}
                        disabled={valuingCandidateId === c.id}
                        style={{ padding: '4px 8px', fontFamily: 'monospace', fontSize: '9px', border: `0.5px solid ${theme.accent}`, color: theme.accent, background: 'none', borderRadius: '3px', cursor: valuingCandidateId === c.id ? 'default' : 'pointer', opacity: valuingCandidateId === c.id ? 0.5 : 1 }}
                      >
                        {valuingCandidateId === c.id ? '...' : 'PRICE'}
                        {!isPro && valuingCandidateId !== c.id && <span style={{ marginLeft: '4px', fontSize: '7px', opacity: 0.7 }}>PRO</span>}
                      </button>
                      <button
                        onClick={() => onPromoteCandidate(c.id)}
                        style={{ padding: '4px 8px', fontFamily: 'monospace', fontSize: '9px', border: `0.5px solid ${theme.green}`, color: theme.green, background: 'none', borderRadius: '3px', cursor: 'pointer' }}
                      >
                        SET PRIMARY
                      </button>
                      <button onClick={() => onRemoveCandidate(c.id)} style={{ padding: '4px 6px', background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', fontSize: '14px' }}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '11px', color: theme.textMuted, fontFamily: 'monospace', marginBottom: '8px' }}>No candidates yet</div>
            )}

            {showAddCandidate ? (
              <div style={{ padding: '12px', backgroundColor: theme.bg, borderRadius: '4px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <input value={candidateMake} onChange={e => setCandidateMake(e.target.value)} style={inputStyle} placeholder="Make" />
                  <input value={candidateModel} onChange={e => setCandidateModel(e.target.value)} style={inputStyle} placeholder="Model" />
                </div>
                <input value={candidateNotes} onChange={e => setCandidateNotes(e.target.value)} style={{ ...inputStyle, marginBottom: '8px' }} placeholder="Notes (optional)" />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => {
                    if (candidateMake.trim() && candidateModel.trim()) {
                      onAddCandidate({ make: candidateMake.trim(), model: candidateModel.trim(), notes: candidateNotes.trim() || undefined });
                      setCandidateMake(''); setCandidateModel(''); setCandidateNotes('');
                      setShowAddCandidate(false);
                    }
                  }} style={{ padding: '7px 14px', backgroundColor: theme.accent, color: theme.bg, border: 'none', borderRadius: '4px', fontFamily: 'monospace', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>ADD</button>
                  <button onClick={() => setShowAddCandidate(false)} style={{ padding: '7px 14px', backgroundColor: 'transparent', color: theme.textSecondary, border: `0.5px solid ${theme.border}`, borderRadius: '4px', fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer' }}>CANCEL</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddCandidate(true)} style={{ padding: '7px 12px', backgroundColor: 'transparent', color: theme.textSecondary, border: `0.5px solid ${theme.border}`, borderRadius: '4px', fontFamily: 'monospace', fontSize: '9px', cursor: 'pointer', letterSpacing: '0.5px' }}>
                + ADD CANDIDATE
              </button>
            )}
          </div>
        )}

        {/* Pros */}
        {item.pros && item.pros.length > 0 && (
          <div style={{ padding: '10px 12px', backgroundColor: theme.bg, borderRadius: '4px', marginBottom: '10px', borderLeft: `3px solid ${theme.green}` }}>
            <div style={{ fontSize: '9px', color: theme.textMuted, fontFamily: 'monospace', marginBottom: '6px' }}>PROS</div>
            {item.pros.map((p, i) => <div key={i} style={{ fontSize: '11px', marginBottom: '3px', color: theme.green }}>✓ {p}</div>)}
          </div>
        )}

        {/* Cons */}
        {item.cons && item.cons.length > 0 && (
          <div style={{ padding: '10px 12px', backgroundColor: theme.bg, borderRadius: '4px', marginBottom: '10px', borderLeft: `3px solid ${theme.red}` }}>
            <div style={{ fontSize: '9px', color: theme.textMuted, fontFamily: 'monospace', marginBottom: '6px' }}>CONS</div>
            {item.cons.map((c, i) => <div key={i} style={{ fontSize: '11px', marginBottom: '3px', color: theme.red }}>✗ {c}</div>)}
          </div>
        )}

        {/* Alternatives */}
        {item.alternativeOptions && item.alternativeOptions.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '9px', color: theme.textMuted, fontFamily: 'monospace', marginBottom: '6px' }}>ALTERNATIVES CONSIDERED</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {item.alternativeOptions.map((a, i) => <span key={i} style={{ padding: '3px 9px', backgroundColor: theme.bg, borderRadius: '10px', fontSize: '10px', border: `0.5px solid ${theme.border}`, color: theme.textSecondary }}>{a}</span>)}
            </div>
          </div>
        )}

        {item.useCase && <div style={{ fontSize: '12px', color: theme.textSecondary, marginBottom: '8px' }}>Use case: {item.useCase}</div>}
        {item.notes && <div style={{ padding: '10px', backgroundColor: theme.bg, borderRadius: '4px', fontSize: '12px', color: theme.textSecondary, marginBottom: '12px' }}>{item.notes}</div>}
        {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontSize: '11px', color: theme.accent, textDecoration: 'none', marginBottom: '16px' }}>View Link →</a>}

        {/* Research notes */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '10px', color: theme.textMuted, fontFamily: 'monospace', letterSpacing: '0.8px', marginBottom: '8px' }}>RESEARCH LOG</div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <input
              value={noteInput}
              onChange={e => setNoteInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && noteInput.trim()) { onAddNote(noteInput.trim()); setNoteInput(''); } }}
              style={{ ...inputStyle, flex: 1 }}
              placeholder="Log a research note, price seen, or finding…"
            />
            <button
              onClick={() => { if (noteInput.trim()) { onAddNote(noteInput.trim()); setNoteInput(''); } }}
              disabled={!noteInput.trim()}
              style={{ padding: '8px 14px', backgroundColor: noteInput.trim() ? theme.accent : 'transparent', color: noteInput.trim() ? theme.bg : theme.textMuted, border: `0.5px solid ${noteInput.trim() ? theme.accent : theme.border}`, borderRadius: '4px', fontFamily: 'monospace', fontSize: '10px', fontWeight: 700, cursor: noteInput.trim() ? 'pointer' : 'default' }}
            >
              LOG
            </button>
          </div>
          {item.researchNotes && item.researchNotes.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {item.researchNotes.slice(0, 10).map(note => (
                <div key={note.id} style={{ padding: '8px 10px', backgroundColor: theme.bg, borderRadius: '4px', borderLeft: `2px solid ${theme.border}` }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginBottom: '3px' }}>
                    {new Date(note.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div style={{ fontSize: '12px', color: theme.textSecondary, lineHeight: 1.4 }}>{note.text}</div>
                </div>
              ))}
            </div>
          )}
          {(!item.researchNotes || item.researchNotes.length === 0) && (
            <div style={{ fontSize: '10px', color: theme.textMuted, fontFamily: 'monospace' }}>No notes yet</div>
          )}
        </div>

        {/* AI Analysis */}
        <div style={{ marginBottom: '20px' }}>
          {!aiResult && !analyzing && (
            <button
              onClick={runAiAnalysis}
              style={{ width: '100%', padding: '11px', backgroundColor: 'transparent', color: isPro ? theme.accent : theme.textMuted, border: `0.5px solid ${isPro ? theme.accent : theme.border}`, borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.8px', cursor: 'pointer' }}
            >
              ASK ASSISTANT: BUY / WAIT / SKIP
              {!isPro && <span style={{ marginLeft: '8px', fontSize: '9px', opacity: 0.7 }}>PRO</span>}
            </button>
          )}
          {analyzing && (
            <div style={{ padding: '14px', backgroundColor: theme.bg, borderRadius: '6px', textAlign: 'center', fontFamily: 'monospace', fontSize: '11px', color: theme.textMuted }}>Analyzing…</div>
          )}
          {aiError && (
            <div style={{ padding: '10px', backgroundColor: 'rgba(255,107,107,0.1)', borderRadius: '4px', fontFamily: 'monospace', fontSize: '10px', color: theme.red }}>{aiError}</div>
          )}
          {aiResult && (
            <div style={{ padding: '16px', backgroundColor: theme.bg, borderRadius: '6px', border: `0.5px solid ${verdictColor[aiResult.verdict]}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '22px', fontWeight: 700, color: verdictColor[aiResult.verdict], letterSpacing: '2px' }}>
                  {aiResult.verdict.toUpperCase()}
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, letterSpacing: '0.5px' }}>
                  {aiResult.confidence.toUpperCase()} CONFIDENCE
                </div>
              </div>
              <div style={{ fontSize: '12px', color: theme.textSecondary, lineHeight: 1.5, marginBottom: '10px' }}>{aiResult.reasoning}</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {aiResult.topBenefit && (
                  <div style={{ flex: 1, padding: '8px', backgroundColor: 'rgba(81,207,102,0.08)', borderRadius: '4px', border: `0.5px solid ${theme.green}` }}>
                    <div style={{ fontSize: '8px', color: theme.green, fontFamily: 'monospace', marginBottom: '3px' }}>TOP BENEFIT</div>
                    <div style={{ fontSize: '11px', color: theme.textSecondary }}>{aiResult.topBenefit}</div>
                  </div>
                )}
                {aiResult.topConcern && (
                  <div style={{ flex: 1, padding: '8px', backgroundColor: 'rgba(255,107,107,0.08)', borderRadius: '4px', border: `0.5px solid ${theme.red}` }}>
                    <div style={{ fontSize: '8px', color: theme.red, fontFamily: 'monospace', marginBottom: '3px' }}>TOP CONCERN</div>
                    <div style={{ fontSize: '11px', color: theme.textSecondary }}>{aiResult.topConcern}</div>
                  </div>
                )}
              </div>
              <button onClick={() => setAiResult(null)} style={{ marginTop: '10px', padding: '4px 10px', background: 'none', border: `0.5px solid ${theme.border}`, borderRadius: '3px', color: theme.textMuted, fontFamily: 'monospace', fontSize: '9px', cursor: 'pointer' }}>REFRESH ANALYSIS</button>
            </div>
          )}
        </div>

        {/* Buy picker */}
        {showBuyPicker && item.candidates && item.candidates.length > 0 && (
          <div style={{ padding: '14px', backgroundColor: theme.bg, borderRadius: '6px', marginBottom: '16px', border: `0.5px solid ${theme.accent}` }}>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, marginBottom: '10px' }}>WHICH DID YOU BUY?</div>
            {item.candidates.map(c => (
              <button key={c.id} onClick={() => { setShowBuyPicker(false); confirmBuy(c.id); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px', marginBottom: '6px', backgroundColor: theme.surface, border: `0.5px solid ${theme.border}`, borderRadius: '4px', color: theme.textPrimary, fontFamily: 'monospace', fontSize: '12px', cursor: 'pointer' }}>
                {c.make} {c.model}
              </button>
            ))}
            <button onClick={() => setShowBuyPicker(false)} style={{ padding: '6px 12px', background: 'none', border: `0.5px solid ${theme.border}`, borderRadius: '4px', color: theme.textMuted, fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer', marginTop: '4px' }}>CANCEL</button>
          </div>
        )}

        {/* Snooze input */}
        {showSnoozeInput && (
          <div style={{ padding: '12px 14px', backgroundColor: theme.bg, borderRadius: '6px', marginBottom: '16px', border: `0.5px solid ${theme.border}` }}>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, letterSpacing: '0.8px', marginBottom: '8px' }}>SNOOZE UNTIL</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="date" value={snoozeDate} onChange={e => setSnoozeDate(e.target.value)} style={{ ...inputStyle, flex: 1 }} min={new Date().toISOString().split('T')[0]} />
              <button onClick={handleSnoozeSubmit} disabled={!snoozeDate} style={{ padding: '8px 14px', backgroundColor: snoozeDate ? theme.accent : 'transparent', color: snoozeDate ? theme.bg : theme.textMuted, border: `0.5px solid ${snoozeDate ? theme.accent : theme.border}`, borderRadius: '4px', fontFamily: 'monospace', fontSize: '10px', fontWeight: 700, cursor: snoozeDate ? 'pointer' : 'default' }}>SET</button>
              <button onClick={() => setShowSnoozeInput(false)} style={{ padding: '8px 12px', background: 'none', border: `0.5px solid ${theme.border}`, borderRadius: '4px', color: theme.textMuted, fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer' }}>×</button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {onBuyIt && (
            <button onClick={handleBuyIt} style={{ flex: 1, padding: '12px', backgroundColor: theme.green, color: '#fff', border: 'none', borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, letterSpacing: '0.8px', cursor: 'pointer' }}>
              I BOUGHT IT
            </button>
          )}
          {!isDeferred ? (
            <button
              onClick={() => setShowSnoozeInput(s => !s)}
              style={{ padding: '12px 14px', backgroundColor: 'transparent', color: theme.textMuted, border: `0.5px solid ${theme.border}`, borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px', cursor: 'pointer' }}
            >
              SNOOZE
            </button>
          ) : (
            <button
              onClick={() => { onClearSnooze(); onClose(); }}
              style={{ padding: '12px 14px', backgroundColor: 'transparent', color: theme.blue, border: `0.5px solid ${theme.blue}`, borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px', cursor: 'pointer' }}
            >
              UNSNOOZE
            </button>
          )}
          <button onClick={onDelete} style={{ padding: '12px 14px', backgroundColor: 'transparent', color: theme.red, border: `0.5px solid ${theme.red}`, borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px', cursor: 'pointer' }}>DELETE</button>
          <button onClick={onClose} style={{ padding: '12px 16px', backgroundColor: theme.accent, color: theme.bg, border: 'none', borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>CLOSE</button>
        </div>

      </div>
    </div>
  );
}

// ── ComparisonModal ────────────────────────────────────────────────────────────

function ComparisonModal({ item1, item2, onClose }: { item1: WishlistItem; item2: WishlistItem; onClose: () => void }) {
  const { isMobile } = useResponsive();

  function ColHeader({ item }: { item: WishlistItem }) {
    return (
      <div style={{ padding: '12px', backgroundColor: theme.bg, borderRadius: '6px', marginBottom: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '3px', fontFamily: 'monospace' }}>
          {item.specLevel === 'specified' ? `${item.make} ${item.model}` : (item.goal || item.type)}
        </div>
        <div style={{ fontSize: '10px', color: theme.caliberRed, fontFamily: 'monospace' }}>
          {item.specLevel === 'specified' ? item.caliber : (item.caliber || 'Caliber TBD')} · {item.type}
        </div>
        <div style={{ marginTop: '6px' }}>
          <span style={{ padding: '2px 7px', borderRadius: '3px', fontSize: '9px', fontFamily: 'monospace', color: priorityColors[item.priority], border: `0.5px solid ${priorityColors[item.priority]}`, backgroundColor: 'rgba(255,255,255,0.04)' }}>
            {item.priority.toUpperCase()}
          </span>
        </div>
      </div>
    );
  }

  function Row({ label, v1, v2 }: { label: string; v1: React.ReactNode; v2: React.ReactNode }) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
        <div style={{ gridColumn: '1 / -1', fontSize: '9px', color: theme.textMuted, fontFamily: 'monospace', letterSpacing: '0.8px', marginBottom: '2px' }}>{label}</div>
        <div style={{ padding: '8px', backgroundColor: theme.bg, borderRadius: '4px', fontSize: '12px' }}>{v1 || <span style={{ color: theme.textMuted }}>—</span>}</div>
        <div style={{ padding: '8px', backgroundColor: theme.bg, borderRadius: '4px', fontSize: '12px' }}>{v2 || <span style={{ color: theme.textMuted }}>—</span>}</div>
      </div>
    );
  }

  const price1 = item1.specLevel === 'specified'
    ? `$${item1.estimatedPrice.toLocaleString()}${item1.currentPrice ? ` · market $${item1.currentPrice.toLocaleString()}` : ''}`
    : (item1.budgetMin || item1.budgetMax) ? `$${(item1.budgetMin ?? 0).toLocaleString()} – $${(item1.budgetMax ?? 0).toLocaleString()}` : null;
  const price2 = item2.specLevel === 'specified'
    ? `$${item2.estimatedPrice.toLocaleString()}${item2.currentPrice ? ` · market $${item2.currentPrice.toLocaleString()}` : ''}`
    : (item2.budgetMin || item2.budgetMax) ? `$${(item2.budgetMin ?? 0).toLocaleString()} – $${(item2.budgetMax ?? 0).toLocaleString()}` : null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1010, padding: isMobile ? '12px' : '24px' }} onClick={onClose}>
      <div style={{ backgroundColor: theme.surface, borderRadius: '8px', padding: isMobile ? '16px' : '24px', maxWidth: '700px', width: '100%', maxHeight: '92vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', color: theme.textMuted, marginBottom: '16px' }}>COMPARE</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
          <ColHeader item={item1} />
          <ColHeader item={item2} />
        </div>
        <Row label="PRICE / BUDGET" v1={price1} v2={price2} />
        <Row label="USE CASE" v1={item1.useCase} v2={item2.useCase} />
        {(item1.candidates?.length || item2.candidates?.length) && (
          <Row
            label="CANDIDATES"
            v1={item1.candidates?.length ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>{item1.candidates.map(c => <span key={c.id} style={{ padding: '2px 6px', borderRadius: '3px', fontSize: '10px', backgroundColor: 'rgba(255,255,255,0.05)', border: `0.5px solid ${theme.border}` }}>{c.make} {c.model}</span>)}</div> : null}
            v2={item2.candidates?.length ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>{item2.candidates.map(c => <span key={c.id} style={{ padding: '2px 6px', borderRadius: '3px', fontSize: '10px', backgroundColor: 'rgba(255,255,255,0.05)', border: `0.5px solid ${theme.border}` }}>{c.make} {c.model}</span>)}</div> : null}
          />
        )}
        <Row
          label="PROS"
          v1={item1.pros?.length ? <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '11px', color: theme.green }}>{item1.pros.map((p, i) => <li key={i}>{p}</li>)}</ul> : null}
          v2={item2.pros?.length ? <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '11px', color: theme.green }}>{item2.pros.map((p, i) => <li key={i}>{p}</li>)}</ul> : null}
        />
        <Row
          label="CONS"
          v1={item1.cons?.length ? <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '11px', color: theme.red }}>{item1.cons.map((c, i) => <li key={i}>{c}</li>)}</ul> : null}
          v2={item2.cons?.length ? <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '11px', color: theme.red }}>{item2.cons.map((c, i) => <li key={i}>{c}</li>)}</ul> : null}
        />
        {(item1.alternativeOptions?.length || item2.alternativeOptions?.length) && (
          <Row label="ALTERNATIVES CONSIDERED" v1={item1.alternativeOptions?.join(', ')} v2={item2.alternativeOptions?.join(', ')} />
        )}
        <Row label="ADDED" v1={new Date(item1.addedDate).toLocaleDateString()} v2={new Date(item2.addedDate).toLocaleDateString()} />
        <button onClick={onClose} style={{ width: '100%', marginTop: '8px', padding: '12px', backgroundColor: theme.accent, color: theme.bg, border: 'none', borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>CLOSE</button>
      </div>
    </div>
  );
}

// ── GapAnalysisModal ───────────────────────────────────────────────────────────

function GapAnalysisModal({ ownedGuns, wishlistItems, onClose }: { ownedGuns: Gun[]; wishlistItems: WishlistItem[]; onClose: () => void }) {
  const { isMobile } = useResponsive();
  const ownedCalibers = new Set(ownedGuns.map(g => g.caliber));
  const ownedTypes = new Set(ownedGuns.map(g => g.type));
  const wishlistCalibers = [...new Set(wishlistItems.map(w => w.caliber).filter(Boolean))];
  const wishlistTypes = [...new Set(wishlistItems.map(w => w.type))];
  const newCalibers = wishlistCalibers.filter(c => !ownedCalibers.has(c));
  const newTypes = wishlistTypes.filter(t => !ownedTypes.has(t as Gun['type']));

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: isMobile ? '16px' : '24px' }} onClick={onClose}>
      <div style={{ backgroundColor: theme.surface, borderRadius: '8px', padding: isMobile ? '20px' : '24px', maxWidth: '500px', width: '100%', maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, letterSpacing: '1px', marginBottom: '20px' }}>COLLECTION GAP ANALYSIS</div>
        <div style={{ padding: '14px', backgroundColor: theme.bg, borderRadius: '6px', marginBottom: '12px' }}>
          <div style={{ fontSize: '10px', color: theme.textMuted, fontFamily: 'monospace', marginBottom: '10px' }}>NEW CALIBERS ({newCalibers.length})</div>
          {newCalibers.length > 0
            ? newCalibers.map((c, i) => <div key={i} style={{ fontSize: '13px', marginBottom: '5px', color: theme.caliberRed, fontFamily: 'monospace' }}>· {c}</div>)
            : <div style={{ fontSize: '11px', color: theme.textMuted }}>All wishlist calibers are already in your vault</div>}
        </div>
        {newTypes.length > 0 && (
          <div style={{ padding: '14px', backgroundColor: theme.bg, borderRadius: '6px', marginBottom: '12px' }}>
            <div style={{ fontSize: '10px', color: theme.textMuted, fontFamily: 'monospace', marginBottom: '10px' }}>NEW TYPES ({newTypes.length})</div>
            {newTypes.map((t, i) => <div key={i} style={{ fontSize: '13px', marginBottom: '5px', fontFamily: 'monospace' }}>· {t}</div>)}
          </div>
        )}
        <button onClick={onClose} style={{ width: '100%', padding: '12px', backgroundColor: theme.accent, color: theme.bg, border: 'none', borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>CLOSE</button>
      </div>
    </div>
  );
}
