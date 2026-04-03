import { useState, useEffect, useMemo, useRef } from 'react';
import { theme } from './theme';
import { getAllAmmo, getAmmoSummaryByCaliber, updateAmmo, addAmmo, getAllGuns, getAllSessions, getAllCartridges } from './storage';
import type { AmmoLot } from './types';
import { BulletTypeDisplay, AmmoAcronym } from './AmmoAcronym';
import { analyzeAmmoBox, hasClaudeApiKey } from './claudeApi';

type ViewMode = 'calibers' | 'lots';
type CategoryFilter = 'all' | 'Match' | 'Practice' | 'Self Defense' | 'Hunting';

// Typical market price estimates per round (USD) — used as fallback when no price is recorded
function estimatePricePerRound(caliber: string): number {
  const c = caliber.toLowerCase();
  if (c.includes('.22') || c.includes('22 lr')) return 0.09;
  if (c.includes('9mm') || c.includes('9x19') || c.includes('luger')) return 0.32;
  if (c.includes('.380') || c.includes('380 acp')) return 0.45;
  if (c.includes('.45 acp') || c.includes('45 acp')) return 0.55;
  if (c.includes('.40 s&w') || c.includes('40 s&w')) return 0.48;
  if (c.includes('10mm')) return 0.72;
  if (c.includes('.357 mag') || c.includes('357 mag')) return 0.70;
  if (c.includes('5.56') || c.includes('.223')) return 0.65;
  if (c.includes('.308') || c.includes('7.62x51')) return 1.20;
  if (c.includes('6.5 creedmoor') || c.includes('6.5cm')) return 1.50;
  if (c.includes('.300 win mag')) return 2.00;
  if (c.includes('.30-06') || c.includes('30-06')) return 1.40;
  if (c.includes('.30-30') || c.includes('30-30')) return 1.20;
  if (c.includes('.300 blk') || c.includes('300 blk') || c.includes('300 blackout')) return 0.90;
  if (c.includes('.338 lapua')) return 3.50;
  if (c.includes('7.62x39')) return 0.45;
  if (c.includes('12 gauge') || c.includes('12ga')) return 0.80;
  if (c.includes('20 gauge') || c.includes('20ga')) return 0.90;
  if (c.includes('.50 bmg') || c.includes('50 bmg')) return 4.50;
  if (c.includes('.45 colt') || c.includes('45 colt')) return 0.90;
  return 0.50; // generic fallback
}

// ============================================================================
// CALIBER CONSOLIDATION
// ============================================================================

const CALIBER_GROUPS: Array<{ members: string[]; label: string }> = [
  { members: ['9mm', '9mm Luger', '9mm +P', '9mm+P', '9mm +P+', '9mm+P+', '9mm Luger +P', '9mm Luger +P+', '9×19mm', '9x19mm', '9x19', '9mm NATO', '9mm Parabellum'], label: '9mm' },
  { members: ['5.56x45mm', '5.56x45mm NATO', '.223 Remington', '.223 Rem', '5.56', '5.56 NATO'], label: '5.56x45 / .223 Rem' },
  { members: ['.308 Winchester', '.308 Win', '7.62x51mm', '7.62x51mm NATO', '7.62x51', '.308'], label: '.308 / 7.62x51' },
  { members: ['.30-06 Springfield', '.30-06', '.30-06 Sprg', '.30-06 Spfld', '30-06'], label: '.30-06 Springfield' },
  { members: ['.45 ACP', '.45ACP', '45 ACP', '45 Auto', '.45 Auto'], label: '.45 ACP' },
  { members: ['.40 S&W', '.40 SW', '40 S&W', '.40 Smith & Wesson'], label: '.40 S&W' },
  { members: ['.380 ACP', '.380 Auto', '380 ACP', '9mm Short', '9x17mm'], label: '.380 ACP' },
  { members: ['10mm Auto', '10mm', '10mm Automatic'], label: '10mm Auto' },
  { members: ['.22 LR', '.22 Long Rifle', '22 LR', '22 Long Rifle', '.22'], label: '.22 LR' },
  { members: ['6.5 Creedmoor', '6.5CM', '6.5 CM'], label: '6.5 Creedmoor' },
];

function normalizeCaliberLabel(caliber: string): string {
  const calLower = caliber.toLowerCase();
  for (const group of CALIBER_GROUPS) {
    if (group.members.some(m => m.toLowerCase() === calLower)) return group.label;
  }
  return caliber;
}

function sameCaliberGroup(a: string, b: string): boolean {
  const normA = normalizeCaliberLabel(a).toLowerCase();
  const normB = normalizeCaliberLabel(b).toLowerCase();
  return normA === normB;
}

// ============================================================================
// SMART THRESHOLD
// ============================================================================

function getSmartThreshold(lot: AmmoLot): number {
  if (lot.category === 'Test') return 0;
  if (lot.minStockAlert === 0) return 0;
  if (lot.minStockAlert != null && lot.minStockAlert > 0) return lot.minStockAlert;

  const purchased = lot.quantityPurchased ?? lot.quantity;
  if (purchased < 100) return 0;

  const highVolumeCalibers = ['9mm Luger', '9mm', '.22 LR', '22 LR', '5.56x45mm', '5.56x45mm NATO', '.223 Remington', '.223 Rem', '5.56'];

  switch (lot.category) {
    case 'Self Defense': return 100;
    case 'Hunting': return 50;
    case 'Match': return 200;
    case 'Practice':
      return highVolumeCalibers.includes(lot.caliber) ? 500 : 200;
    default: return 200;
  }
}

// ============================================================================
// AMMOSEEK URL
// ============================================================================

function getAmmoSeekUrl(lot: AmmoLot): string {
  let caliberPath = lot.caliber
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/\./g, '')
    .replace(/\+p/gi, '%2Bp');

  const caliberMap: Record<string, string> = {
    '9mm-luger': '9mm-luger',
    '9mm-%2bp': '9mm-luger',
    '223-remington': '223-rem',
    '223-rem': '223-rem',
    '556x45mm-nato': '556x45-nato',
    '556x45mm': '556x45-nato',
    '308-winchester': '308-win',
    '308-win': '308-win',
    '762x51mm': '308-win',
    '45-acp': '45-acp',
    '40-sw': '40-sw',
    '380-acp': '380-acp',
    '22-lr': '22lr',
    '22-long-rifle': '22lr',
    '12-gauge': '12-gauge',
    '20-gauge': '20-gauge'
  };

  caliberPath = caliberMap[caliberPath] || caliberPath;
  const keywords = encodeURIComponent(`${lot.brand} ${lot.productLine}`);
  return `https://ammoseek.com/ammo/${caliberPath}?ikw=${keywords}`;
}

// ============================================================================
// CATEGORY COLOR
// ============================================================================

function getCategoryColor(category: string): string {
  switch (category) {
    case 'Match': return theme.accent;
    case 'Practice': return theme.blue;
    case 'Self Defense': return theme.red;
    case 'Hunting': return theme.green;
    case 'Test': return '#9775fa';
    default: return theme.textSecondary;
  }
}

// ============================================================================
// SHOPPING LIST EXPORT (HTML print window)
// ============================================================================

function exportShoppingList(allAmmo: AmmoLot[], gunCalibers: Set<string>) {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Only include low-stock lots that have a gun (hasGun)
  const lowLots = allAmmo.filter(lot => {
    const t = getSmartThreshold(lot);
    if (!(t > 0 && lot.quantity < t)) return false;
    const hasGun = gunCalibers.has(lot.caliber.toLowerCase()) || gunCalibers.has(normalizeCaliberLabel(lot.caliber).toLowerCase());
    return hasGun;
  });

  if (lowLots.length === 0) {
    return;
  }

  // Separate critical vs low
  const criticalLots = lowLots.filter(lot => {
    const t = getSmartThreshold(lot);
    return (lot.quantity / t) * 100 < 25;
  });
  const lowOnlyLots = lowLots.filter(lot => {
    const t = getSmartThreshold(lot);
    const pct = (lot.quantity / t) * 100;
    return pct >= 25 && pct < 100;
  });

  // Total restock cost
  let totalRestockCost = 0;
  let hasCostData = false;
  lowLots.forEach(lot => {
    if (lot.purchasePricePerRound) {
      const need = Math.max(0, getSmartThreshold(lot) - lot.quantity);
      totalRestockCost += need * lot.purchasePricePerRound;
      hasCostData = true;
    }
  });

  function buildItem(lot: AmmoLot): string {
    const t = getSmartThreshold(lot);
    const pct = (lot.quantity / t) * 100;
    const cls = pct < 25 ? 'critical' : 'low';
    const need = Math.max(0, t - lot.quantity);
    const costStr = lot.purchasePricePerRound
      ? `<div class="item-cost">Est. restock: $${(need * lot.purchasePricePerRound).toFixed(2)} @ ${(lot.purchasePricePerRound * 100).toFixed(0)}¢/rd</div>`
      : '';
    return `
      <div class="item ${cls}">
        <div>
          <div class="item-name">${normalizeCaliberLabel(lot.caliber)}</div>
          <div class="item-detail">${lot.brand}${lot.productLine ? ' ' + lot.productLine : ''} · ${lot.grainWeight}gr ${lot.bulletType || ''}</div>
          ${costStr}
        </div>
        <div class="item-counts">
          <div class="item-qty">${lot.quantity}</div>
          <div class="item-target">/ ${t} target</div>
          <div class="item-target">need ${need}</div>
        </div>
      </div>`;
  }

  const criticalSection = criticalLots.length > 0 ? `
    <div class="section">
      <div class="section-header">CRITICAL — Below 25% of Target</div>
      ${criticalLots.map(buildItem).join('')}
    </div>` : '';

  const lowSection = lowOnlyLots.length > 0 ? `
    <div class="section">
      <div class="section-header">LOW STOCK — Below Target</div>
      ${lowOnlyLots.map(buildItem).join('')}
    </div>` : '';

  const costFooter = hasCostData ? `
    <div style="margin-top: 24px; padding: 16px; background: #f9f9f9; border-radius: 6px; border: 1px solid #ddd;">
      <div style="font-size: 11px; color: #666; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px;">ESTIMATED TOTAL RESTOCK COST</div>
      <div style="font-size: 28px; font-weight: 700; font-family: monospace;">$${totalRestockCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
    </div>` : '';

  const html = `<html><head><title>Ammo Shopping List</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; background: #fff; color: #111; padding: 32px; }
  h1 { font-size: 24px; font-weight: 700; letter-spacing: 2px; border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 8px; }
  .meta { font-size: 11px; color: #666; margin-bottom: 32px; }
  .section { margin-bottom: 24px; }
  .section-header { font-size: 10px; letter-spacing: 1px; color: #666; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
  .item { display: flex; justify-content: space-between; align-items: flex-start; padding: 12px; margin-bottom: 8px; border-radius: 4px; border-left: 4px solid #ccc; }
  .item.critical { border-left-color: #e03131; background: #fff5f5; }
  .item.low { border-left-color: #f59f00; background: #fffbeb; }
  .item-name { font-size: 14px; font-weight: 700; }
  .item-detail { font-size: 11px; color: #555; margin-top: 2px; }
  .item-counts { text-align: right; }
  .item-qty { font-size: 20px; font-weight: 700; font-family: monospace; }
  .item-target { font-size: 10px; color: #888; }
  .item-cost { font-size: 11px; color: #555; margin-top: 2px; }
  .footer { margin-top: 40px; font-size: 10px; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 16px; }
  @media print { body { padding: 16px; } }
</style></head><body>
<h1>AMMO SHOPPING LIST</h1>
<div class="meta">Generated ${today} · ${lowLots.length} item${lowLots.length !== 1 ? 's' : ''} need restocking</div>
${criticalSection}
${lowSection}
${costFooter}
<div class="footer">Generated by Lindcott Armory · ${today}</div>
</body></html>`;

  const w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 500);
  }
}

// ============================================================================
// MAIN ARSENAL COMPONENT
// ============================================================================

export function Arsenal({ openAddAmmoOnMount, onAddAmmoMountHandled }: { openAddAmmoOnMount?: boolean; onAddAmmoMountHandled?: () => void } = {}) {
  const [viewMode, setViewMode] = useState<ViewMode>('calibers');
  const [allAmmo, setAllAmmo] = useState<AmmoLot[]>([]);
  const [selectedCaliber, setSelectedCaliber] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedLot, setSelectedLot] = useState<AmmoLot | null>(null);
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  // Task 2: bottom sheet state (replaces quickUseId / quickUseAmount)
  const [useSheetLot, setUseSheetLot] = useState<AmmoLot | null>(null);
  const [useSheetAmount, setUseSheetAmount] = useState('');
  const [caliberSearch, setCaliberSearch] = useState('');
  const [sortField, setSortField] = useState<'rounds' | 'velocity' | 'energy' | 'price' | 'alpha'>('rounds');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [showSortSheet, setShowSortSheet] = useState(false);

  const [ignoredAlerts, setIgnoredAlerts] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('gunvault_ignored_alerts') || '[]')); }
    catch { return new Set(); }
  });
  const [snoozedAlerts, setSnoozedAlerts] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem('gunvault_snoozed_alerts') || '{}'); }
    catch { return {}; }
  });
  const [showInvestedTooltip, setShowInvestedTooltip] = useState(false);

  useEffect(() => {
    loadAmmo();
  }, []);

  useEffect(() => {
    if (openAddAmmoOnMount) {
      setShowAddForm(true);
      onAddAmmoMountHandled?.();
    }
  }, [openAddAmmoOnMount]);

  function loadAmmo() {
    const ammo = getAllAmmo();
    setAllAmmo(ammo);
  }

  // Compute set of calibers that have a matching gun
  const gunCalibers = useMemo(() => {
    const guns = getAllGuns();
    const s = new Set<string>();
    guns.forEach(g => {
      s.add(g.caliber.toLowerCase());
      s.add(normalizeCaliberLabel(g.caliber).toLowerCase());
    });
    return s;
  }, [allAmmo]); // re-compute when ammo reloads

  // All cartridges from database (for search section)
  const allCartridges = useMemo(() => getAllCartridges(), [allAmmo]);

  // Build consolidated caliber summary — groups variants and stores actual lot objects for sorting
  const consolidatedSummary = new Map<string, { totalRounds: number; lotCount: number; lots: AmmoLot[] }>();
  for (const lot of allAmmo) {
    const label = normalizeCaliberLabel(lot.caliber);
    const existing = consolidatedSummary.get(label) || { totalRounds: 0, lotCount: 0, lots: [] };
    consolidatedSummary.set(label, {
      totalRounds: existing.totalRounds + lot.quantity,
      lotCount: existing.lotCount + 1,
      lots: [...existing.lots, lot],
    });
  }

  // Build sorted calibers list
  const sortedCalibersBase = Array.from(consolidatedSummary.entries());

  // Apply sort — uses actual lot objects for velocity/energy/price
  const sortedCalibersAll = [...sortedCalibersBase].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortField === 'alpha') return dir * a[0].localeCompare(b[0]);
    if (sortField === 'velocity') {
      const va = Math.max(0, ...a[1].lots.map(l => l.advertisedFPS ?? 0));
      const vb = Math.max(0, ...b[1].lots.map(l => l.advertisedFPS ?? 0));
      return dir * (va - vb);
    }
    if (sortField === 'energy') {
      const ea = Math.max(0, ...a[1].lots.map(l => l.muzzleEnergy ?? 0));
      const eb = Math.max(0, ...b[1].lots.map(l => l.muzzleEnergy ?? 0));
      return dir * (ea - eb);
    }
    if (sortField === 'price') {
      const pa = Math.max(0, ...a[1].lots.map(l => l.currentMarketPrice ?? l.purchasePricePerRound ?? 0));
      const pb = Math.max(0, ...b[1].lots.map(l => l.currentMarketPrice ?? l.purchasePricePerRound ?? 0));
      return dir * (pa - pb);
    }
    // rounds (default)
    return dir * (a[1].totalRounds - b[1].totalRounds);
  });

  // Apply search filter + category filter (Task 3)
  const sortedCalibers = (() => {
    let filtered = caliberSearch.length > 0
      ? sortedCalibersAll.filter(([cal]) =>
          normalizeCaliberLabel(cal).toLowerCase().includes(caliberSearch.toLowerCase())
        )
      : sortedCalibersAll;

    // Task 3: apply category filter in caliber view
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(([caliberLabel]) => {
        const lotsForCal = allAmmo.filter(l => normalizeCaliberLabel(l.caliber) === caliberLabel);
        return lotsForCal.some(l => l.category === categoryFilter);
      });
    }

    return filtered;
  })();

  // Filter lots for selected caliber (using group matching)
  const filteredLots = selectedCaliber
    ? allAmmo.filter(lot => normalizeCaliberLabel(lot.caliber) === selectedCaliber)
    : allAmmo;

  const allFilteredLots = categoryFilter === 'all'
    ? filteredLots
    : filteredLots.filter(lot => lot.category === categoryFilter);

  // Task 4: split into favorites and regular for lots view
  const favoriteLots = allFilteredLots.filter(l => l.isFavorite);
  const regularLots = allFilteredLots.filter(l => !l.isFavorite);
  const displayedLots = allFilteredLots;

  // Stats
  const totalRounds = allAmmo.reduce((sum, lot) => sum + lot.quantity, 0);
  const totalLots = allAmmo.length;

  // Low stock: only count lots that have a gun, excluding ignored/snoozed
  const nowMs2 = Date.now();
  const lowStockLots = allAmmo.filter(lot => {
    const threshold = getSmartThreshold(lot);
    if (!(threshold > 0 && lot.quantity < threshold)) return false;
    const hasGun = gunCalibers.has(lot.caliber.toLowerCase()) || gunCalibers.has(normalizeCaliberLabel(lot.caliber).toLowerCase());
    if (!hasGun) return false;
    if (ignoredAlerts.has(lot.id)) return false;
    if (snoozedAlerts[lot.id] && snoozedAlerts[lot.id] > nowMs2) return false;
    return true;
  });

  // Replacement cost: uses manually set market price, then purchase price, then caliber estimate
  const replacementCost = allAmmo.reduce((sum, lot) => {
    const price = lot.currentMarketPrice ?? lot.purchasePricePerRound ?? estimatePricePerRound(lot.caliber);
    return sum + (lot.quantity * price);
  }, 0);

  // Task 9: Total invested (based on quantityPurchased * purchasePricePerRound)
  const totalInvested = allAmmo.reduce((sum, l) =>
    sum + ((l.quantityPurchased || l.quantity) * (l.purchasePricePerRound || 0)), 0);

  // Price freshness: find stale lots (price data > 30 days old)
  const lotsWithPrice = allAmmo.filter(lot => lot.purchasePricePerRound != null && lot.purchasePricePerRound > 0);
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const staleLot = lotsWithPrice.length > 0
    ? lotsWithPrice.reduce((oldest, lot) => {
        const dateStr = lot.updatedAt || lot.purchaseDate;
        const dateMs = dateStr ? new Date(dateStr).getTime() : 0;
        const oldestDateStr = oldest.updatedAt || oldest.purchaseDate;
        const oldestMs = oldestDateStr ? new Date(oldestDateStr).getTime() : 0;
        return dateMs < oldestMs ? lot : oldest;
      })
    : null;
  const staleLotDateMs = staleLot
    ? (() => { const d = staleLot.updatedAt || staleLot.purchaseDate; return d ? new Date(d).getTime() : 0; })()
    : 0;
  const pricesStale = staleLot != null && lotsWithPrice.length > 0 && (now - staleLotDateMs) > thirtyDaysMs;

  function handleToggleFavorite(lot: AmmoLot) {
    updateAmmo(lot.id, { isFavorite: !lot.isFavorite });
    loadAmmo();
  }

  function ignoreAlert(lotId: string) {
    const newSet = new Set([...ignoredAlerts, lotId]);
    setIgnoredAlerts(newSet);
    localStorage.setItem('gunvault_ignored_alerts', JSON.stringify([...newSet]));
    loadAmmo();
  }

  function snoozeAlert(lotId: string) {
    const until = Date.now() + 30 * 24 * 60 * 60 * 1000;
    const newSnooze = { ...snoozedAlerts, [lotId]: until };
    setSnoozedAlerts(newSnooze);
    localStorage.setItem('gunvault_snoozed_alerts', JSON.stringify(newSnooze));
    loadAmmo();
  }

  function unignoreAlert(lotId: string) {
    const newSet = new Set([...ignoredAlerts]);
    newSet.delete(lotId);
    setIgnoredAlerts(newSet);
    localStorage.setItem('gunvault_ignored_alerts', JSON.stringify([...newSet]));
    loadAmmo();
  }

  // Task 8: inventory mix distribution
  const inventoryMix = (() => {
    if (allAmmo.length === 0) return null;
    const totals: Record<string, number> = {};
    let grand = 0;
    for (const lot of allAmmo) {
      totals[lot.category] = (totals[lot.category] || 0) + lot.quantity;
      grand += lot.quantity;
    }
    if (grand === 0) return null;
    return Object.entries(totals)
      .filter(([, qty]) => qty > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, qty]) => ({ cat, pct: Math.round((qty / grand) * 100) }));
  })();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.bg,
      padding: '16px',
      maxWidth: '480px',
      margin: '0 auto'
    }}>
      {/* Stats Bar */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '16px',
        padding: '10px 14px',
        backgroundColor: theme.surface,
        borderRadius: '6px',
        border: `0.5px solid ${theme.border}`,
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <span style={{ fontSize: '9px', color: theme.textMuted, fontFamily: 'monospace', letterSpacing: '0.5px' }}>TOTAL ROUNDS</span>
          <span style={{ fontSize: '18px', fontWeight: 700, color: theme.accent, fontFamily: 'monospace' }}>
            {totalRounds.toLocaleString()}
          </span>
        </div>
        <div style={{ height: '28px', width: '0.5px', backgroundColor: theme.border }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <span style={{ fontSize: '9px', color: theme.textMuted, fontFamily: 'monospace', letterSpacing: '0.5px' }}>LOTS</span>
          <span style={{ fontSize: '18px', fontWeight: 700, color: theme.textPrimary, fontFamily: 'monospace' }}>
            {totalLots}
          </span>
        </div>
        <div style={{ height: '28px', width: '0.5px', backgroundColor: theme.border }} />
        <div
          onClick={() => lowStockLots.length > 0 && setShowLowStockModal(true)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1px',
            cursor: lowStockLots.length > 0 ? 'pointer' : 'default'
          }}
        >
          <span style={{ fontSize: '9px', color: theme.textMuted, fontFamily: 'monospace', letterSpacing: '0.5px' }}>LOW STOCK</span>
          <span style={{ fontSize: '18px', fontWeight: 700, color: lowStockLots.length > 0 ? theme.red : theme.green, fontFamily: 'monospace' }}>
            {lowStockLots.length}
          </span>
        </div>
        <div style={{ height: '28px', width: '0.5px', backgroundColor: theme.border }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <span style={{ fontSize: '9px', color: theme.textMuted, fontFamily: 'monospace', letterSpacing: '0.5px' }}>REPLACEMENT COST</span>
          <span style={{ fontSize: '18px', fontWeight: 700, color: theme.textPrimary, fontFamily: 'monospace' }}>
            {'$' + replacementCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
          {allAmmo.some(l => !l.currentMarketPrice && !l.purchasePricePerRound) && (
            <span style={{ fontSize: '8px', color: theme.textMuted, fontFamily: 'monospace' }}>
              est. — add prices for accuracy
            </span>
          )}
          {pricesStale && staleLot && (
            <span style={{ fontSize: '8px', color: theme.textMuted, fontFamily: 'monospace' }}>
              prices may be stale{' '}
              <span
                onClick={() => setSelectedLot(staleLot)}
                style={{ color: theme.accent, cursor: 'pointer', textDecoration: 'underline' }}
              >
                UPDATE
              </span>
            </span>
          )}
        </div>
        {/* Task 9: Total Invested stat */}
        <div style={{ height: '28px', width: '0.5px', backgroundColor: theme.border }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <span style={{ fontSize: '9px', color: theme.textMuted, fontFamily: 'monospace', letterSpacing: '0.5px', position: 'relative' }}>
            TOTAL INVESTED{' '}
            <span
              onClick={() => setShowInvestedTooltip(v => !v)}
              style={{ cursor: 'pointer', fontSize: '9px' }}
            >
              ⓘ
            </span>
            {showInvestedTooltip && (
              <span onClick={() => setShowInvestedTooltip(false)} style={{
                position: 'absolute', bottom: '16px', left: 0,
                backgroundColor: theme.surface, border: `0.5px solid ${theme.border}`,
                borderRadius: '4px', padding: '5px 8px', fontSize: '9px',
                color: theme.textSecondary, whiteSpace: 'nowrap', zIndex: 10,
                fontFamily: 'monospace', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              }}>
                Based on purchase quantities &amp; prices recorded
              </span>
            )}
          </span>
          <span style={{ fontSize: '18px', fontWeight: 700, color: theme.textMuted, fontFamily: 'monospace' }}>
            {totalInvested > 0
              ? `$${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
              : '—'}
          </span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', flexShrink: 0 }}>
          <button
            onClick={() => exportShoppingList(allAmmo, gunCalibers)}
            style={{
              padding: '7px 10px',
              background: 'transparent',
              color: theme.textSecondary,
              border: `0.5px solid ${theme.border}`,
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '9px',
              letterSpacing: '0.5px',
              cursor: 'pointer',
              fontWeight: 600,
              whiteSpace: 'nowrap'
            }}
          >
            EXPORT LIST
          </button>
        </div>
      </div>

      {/* Task 8: Inventory mix distribution line */}
      {inventoryMix && inventoryMix.length > 0 && (
        <div style={{ fontSize: '9px', color: theme.textMuted, fontFamily: 'monospace', padding: '8px 0', overflowX: 'auto', whiteSpace: 'nowrap', scrollbarWidth: 'none' }}>
          INVENTORY MIX{' '}
          {inventoryMix.map(({ cat, pct }, i) => (
            <span key={cat}>
              {i > 0 && <span style={{ color: theme.textMuted }}> · </span>}
              <span style={{ color: getCategoryColor(cat) }}>{cat}</span>
              {' '}{pct}%
            </span>
          ))}
        </div>
      )}

      {/* View Toggle — chips like GunVault */}
      <div style={{
        display: 'flex',
        gap: '6px',
        marginBottom: '16px',
        overflowX: 'auto',
        flexWrap: 'nowrap'
      }}>
        {(['calibers', 'lots'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => {
              setViewMode(mode);
              if (mode === 'calibers') setSelectedCaliber(null);
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: viewMode === mode ? 'none' : `0.5px solid ${theme.border}`,
              backgroundColor: viewMode === mode ? theme.accent : 'transparent',
              color: viewMode === mode ? theme.bg : theme.textSecondary,
              fontFamily: 'monospace',
              fontSize: '9px',
              letterSpacing: '0.8px',
              cursor: 'pointer',
              fontWeight: 600,
              whiteSpace: 'nowrap'
            }}
          >
            {mode === 'calibers' ? 'BY CALIBER' : 'ALL LOTS'}
          </button>
        ))}
      </div>

      {/* Category filter — shown in BOTH views (Task 3 adds it to calibers view) */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '16px',
        flexWrap: 'wrap'
      }}>
        {(['all', 'Match', 'Practice', 'Self Defense', 'Hunting'] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            style={{
              padding: '6px 11px',
              backgroundColor: categoryFilter === cat ? theme.accent : 'transparent',
              color: categoryFilter === cat ? theme.bg : theme.textMuted,
              border: `0.5px solid ${categoryFilter === cat ? theme.accent : theme.border}`,
              borderRadius: '20px',
              fontFamily: 'monospace',
              fontSize: '10px',
              letterSpacing: '0.5px',
              cursor: 'pointer',
              fontWeight: categoryFilter === cat ? 700 : 400,
              whiteSpace: 'nowrap',
            }}
          >
            {cat === 'all' ? 'ALL' : cat}
          </button>
        ))}
      </div>

      {/* Caliber search + sort bar (calibers view only) */}
      {viewMode === 'calibers' && !selectedCaliber && (
        <>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search calibers..."
              value={caliberSearch}
              onChange={(e) => setCaliberSearch(e.target.value)}
              style={{
                flex: 1,
                backgroundColor: theme.surface,
                border: `0.5px solid ${theme.border}`,
                padding: '10px 14px',
                borderRadius: '6px',
                color: theme.textPrimary,
                fontFamily: 'monospace',
                fontSize: '12px',
                outline: 'none'
              }}
            />
            <button
              onClick={() => setShowSortSheet(true)}
              style={{
                backgroundColor: theme.surface,
                border: `0.5px solid ${theme.border}`,
                color: theme.textSecondary,
                fontFamily: 'monospace',
                fontSize: '10px',
                padding: '8px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginLeft: 'auto',
                flexShrink: 0,
                letterSpacing: '0.5px',
              }}
            >
              {sortDir === 'desc' ? '↓' : '↑'} {sortField === 'alpha' ? 'A–Z' : sortField === 'rounds' ? 'ROUNDS' : sortField === 'velocity' ? 'FPS' : sortField === 'energy' ? 'FT-LBS' : 'PRICE'}
            </button>
          </div>
          {/* Task 6: Stock level legend */}
          <div style={{ fontSize: '9px', color: theme.textMuted, fontFamily: 'monospace', marginBottom: '8px' }}>
            <span style={{ color: theme.green }}>●</span> stocked{'  '}
            <span style={{ color: theme.accent }}>●</span> getting low{'  '}
            <span style={{ color: theme.red }}>●</span> restock needed
          </div>
        </>
      )}

      {/* CALIBER ROLLUP VIEW */}
      {viewMode === 'calibers' && !selectedCaliber && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '8px'
          }}>
            {sortedCalibers.length === 0 && caliberSearch.length > 0 ? (
              /* Task 5: empty state for caliber search */
              <div style={{ padding: '32px', textAlign: 'center', color: theme.textMuted, fontSize: '13px', fontFamily: 'monospace' }}>
                No calibers match &quot;{caliberSearch}&quot;
              </div>
            ) : (
              sortedCalibers.map(([caliberLabel, stats]) => {
                const lotsForCaliber = allAmmo.filter(l => normalizeCaliberLabel(l.caliber) === caliberLabel);
                const hasGun = lotsForCaliber.some(l =>
                  gunCalibers.has(l.caliber.toLowerCase()) || gunCalibers.has(normalizeCaliberLabel(l.caliber).toLowerCase())
                );
                const caliberThreshold = lotsForCaliber.length > 0
                  ? Math.max(...lotsForCaliber.map(l => getSmartThreshold(l)))
                  : 0;
                const isLowStock = hasGun && caliberThreshold > 0 && stats.totalRounds < caliberThreshold;
                const fillPct = caliberThreshold > 0
                  ? Math.min(100, (stats.totalRounds / caliberThreshold) * 100)
                  : 0;
                const barColor = hasGun
                  ? (fillPct >= 100 ? theme.green : fillPct >= 50 ? theme.orange : theme.red)
                  : theme.textMuted;

                // Consumption data for this caliber (Task 7: 365 days)
                const allGuns = getAllGuns();
                const allSessions = getAllSessions();
                const matchingGunIds = allGuns
                  .filter(g => lotsForCaliber.some(l => sameCaliberGroup(g.caliber, l.caliber)))
                  .map(g => g.id);
                const nowMs = Date.now();
                const yearAgo = nowMs - 365 * 24 * 60 * 60 * 1000;
                const recentSessions = allSessions.filter(s =>
                  matchingGunIds.includes(s.gunId) &&
                  new Date(s.date).getTime() >= yearAgo
                );
                const totalRoundsLastYear = recentSessions.reduce((sum, s) => sum + s.roundsExpended, 0);
                const rdsPerWeek = totalRoundsLastYear > 0 ? (totalRoundsLastYear / 365) * 7 : 0;
                const runwayWeeks = rdsPerWeek > 0 ? stats.totalRounds / rdsPerWeek : 0;

                // Task 8: consumed rounds on caliber card
                const consumed = lotsForCaliber.reduce((s, l) =>
                  s + ((l.quantityPurchased || l.quantity) - l.quantity), 0);

                // Task 12: interchangeability note
                let interchangeNote: string | null = null;
                if (caliberLabel === '5.56x45 / .223 Rem') {
                  interchangeNote = '.223 Rem may not be safe in all 5.56 chambers — check your firearm';
                } else if (caliberLabel === '.308 / 7.62x51') {
                  interchangeNote = '7.62x51 mil-spec may differ slightly from .308 Win commercial';
                }

                return (
                  <div
                    key={caliberLabel}
                    onClick={() => {
                      setSelectedCaliber(caliberLabel);
                      setViewMode('lots');
                    }}
                    style={{
                      backgroundColor: theme.surface,
                      borderRadius: '4px',
                      padding: '12px',
                      border: `0.5px solid ${isLowStock ? theme.red : theme.border}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = theme.accent;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = isLowStock ? theme.red : theme.border;
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: theme.caliberRed, fontFamily: 'monospace' }}>
                        {caliberLabel}
                      </div>
                      {lotsForCaliber.filter(l => l.isFavorite).length > 0 && (
                        <span style={{ fontSize: '12px' }}>⭐</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                      <div style={{
                        fontSize: '22px',
                        fontWeight: 700,
                        color: isLowStock ? theme.red : theme.accent,
                        fontFamily: 'monospace',
                      }}>
                        {stats.totalRounds.toLocaleString()}
                      </div>
                      {caliberThreshold > 0 && (
                        <div style={{
                          fontSize: '8px',
                          fontWeight: 700,
                          fontFamily: 'monospace',
                          letterSpacing: '0.5px',
                          padding: '2px 5px',
                          borderRadius: '2px',
                          backgroundColor: fillPct >= 100 ? theme.green : fillPct >= 25 ? theme.orange : theme.red,
                          color: theme.bg,
                          flexShrink: 0,
                        }}>
                          {fillPct >= 100 ? 'STOCKED' : fillPct >= 25 ? 'LOW' : 'CRITICAL'}
                        </div>
                      )}
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '9px',
                      color: theme.textSecondary,
                      marginBottom: '6px'
                    }}>
                      <span>{stats.lotCount} lots</span>
                      <span>{Array.from(new Set(lotsForCaliber.map(l => l.brand))).length} brands</span>
                    </div>

                    {/* Progress bar (replaces LOW STOCK badge) */}
                    {caliberThreshold > 0 && (
                      <div style={{ marginBottom: '4px' }}>
                        <div style={{ fontSize: '9px', color: theme.textMuted, marginBottom: '3px', fontFamily: 'monospace' }}>
                          {stats.totalRounds.toLocaleString()} / {caliberThreshold} target
                        </div>
                        <div style={{ height: '4px', borderRadius: '2px', backgroundColor: theme.bg, overflow: 'hidden' }}>
                          <div style={{
                            width: `${fillPct}%`,
                            height: '100%',
                            backgroundColor: barColor,
                            borderRadius: '2px',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>
                    )}

                    {/* Task 8: consumed rounds */}
                    {consumed > 0 && (
                      <div style={{ fontSize: '9px', color: theme.textMuted, fontFamily: 'monospace', marginTop: '2px' }}>
                        {consumed.toLocaleString()} rds used since tracking
                      </div>
                    )}

                    {/* Consumption rate */}
                    {rdsPerWeek > 0 && (
                      <div style={{ fontSize: '9px', color: theme.textMuted, fontFamily: 'monospace', marginTop: '4px' }}>
                        ~{rdsPerWeek.toFixed(0)} rds/wk · ~{
                          runwayWeeks >= 520
                            ? '10+ yrs remaining'
                            : runwayWeeks >= 104
                              ? `${(runwayWeeks / 52).toFixed(1)} yrs remaining`
                              : runwayWeeks >= 4
                                ? `${Math.round(runwayWeeks)} wks remaining`
                                : `${Math.round(runwayWeeks * 7)} days remaining`
                        }
                      </div>
                    )}

                    {/* Task 12: interchangeability note */}
                    {interchangeNote && (
                      <div style={{ marginTop: '6px', fontSize: '8px', color: theme.textMuted, fontFamily: 'monospace' }}>
                        ⓘ {interchangeNote}
                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>

          {/* Database search section */}
          {caliberSearch.length >= 2 && (() => {
            const ownedLabels = new Set(sortedCalibersAll.map(([cal]) => normalizeCaliberLabel(cal).toLowerCase()));
            const dbResults = allCartridges
              .filter(cart =>
                cart.name.toLowerCase().includes(caliberSearch.toLowerCase()) &&
                !ownedLabels.has(cart.name.toLowerCase()) &&
                !ownedLabels.has(normalizeCaliberLabel(cart.name).toLowerCase())
              )
              .slice(0, 10);

            if (dbResults.length === 0) return null;

            return (
              <div style={{ marginTop: '16px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '10px'
                }}>
                  <div style={{ flex: 1, height: '1px', backgroundColor: theme.border }} />
                  <span style={{ fontSize: '8px', color: theme.textMuted, fontFamily: 'monospace', letterSpacing: '1px', whiteSpace: 'nowrap' }}>
                    ALL CALIBERS IN DATABASE
                  </span>
                  <div style={{ flex: 1, height: '1px', backgroundColor: theme.border }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {dbResults.map(cart => (
                    <div
                      key={cart.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 10px',
                        backgroundColor: theme.surface,
                        borderRadius: '4px',
                        border: `0.5px solid ${theme.border}`
                      }}
                    >
                      <span style={{ fontSize: '12px', color: theme.textSecondary, fontFamily: 'monospace' }}>
                        {cart.name}
                      </span>
                      <span style={{
                        fontSize: '8px',
                        color: theme.textMuted,
                        fontFamily: 'monospace',
                        padding: '2px 5px',
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        borderRadius: '2px'
                      }}>
                        NOT IN INVENTORY
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </>
      )}

      {/* LOT DETAIL VIEW */}
      {viewMode === 'lots' && (
        <>
          {selectedCaliber && (
            <div style={{ textAlign: 'right', marginBottom: '8px' }}>
              <span
                onClick={() => { setSelectedCaliber(null); setViewMode('calibers'); }}
                style={{
                  fontSize: '9px',
                  color: theme.textMuted,
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  letterSpacing: '0.5px',
                }}
              >
                ← all calibers
              </span>
            </div>
          )}

          {/* Task 5: empty state for lots view */}
          {displayedLots.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: theme.textMuted, fontSize: '13px', fontFamily: 'monospace' }}>
              <div>No {categoryFilter === 'all' ? '' : categoryFilter} ammo in inventory</div>
              <div style={{ marginTop: '8px', fontSize: '11px' }}>Tap + ADD to log some</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              {/* Task 4: Favorites first */}
              {favoriteLots.length > 0 && (
                <>
                  <div style={{ fontSize: '9px', color: theme.accent, fontFamily: 'monospace', letterSpacing: '0.5px', padding: '2px 0' }}>
                    ★ FAVORITES
                  </div>
                  {favoriteLots.map(lot => <LotCard key={lot.id} lot={lot} onSelect={setSelectedLot} onToggleFavorite={handleToggleFavorite} onUse={(l) => { setUseSheetLot(l); setUseSheetAmount(''); }} />)}
                  {regularLots.length > 0 && (
                    <div style={{ height: '0.5px', backgroundColor: theme.border, margin: '4px 0' }} />
                  )}
                </>
              )}
              {regularLots.map(lot => <LotCard key={lot.id} lot={lot} onSelect={setSelectedLot} onToggleFavorite={handleToggleFavorite} onUse={(l) => { setUseSheetLot(l); setUseSheetAmount(''); }} />)}
            </div>
          )}
        </>
      )}

      {/* Add Ammo Modal */}
      {showAddForm && (
        <AddAmmoModal
          onClose={() => { setShowAddForm(false); setShowAdvanced(false); }}
          onSave={() => { loadAmmo(); setShowAddForm(false); setShowAdvanced(false); }}
          showAdvanced={showAdvanced}
          setShowAdvanced={setShowAdvanced}
        />
      )}

      {/* Low Stock Modal */}
      {showLowStockModal && (
        <LowStockModal
          lowStockLots={lowStockLots}
          getSmartThreshold={getSmartThreshold}
          onClose={() => setShowLowStockModal(false)}
          onLotSelect={(lot) => { setShowLowStockModal(false); setSelectedLot(lot); }}
          onIgnore={ignoreAlert}
          onSnooze={snoozeAlert}
        />
      )}

      {/* Lot Detail Modal */}
      {selectedLot && (
        <LotDetailModal
          lot={selectedLot}
          onClose={() => setSelectedLot(null)}
          onUpdate={() => { loadAmmo(); setSelectedLot(null); }}
        />
      )}

      {/* Task 2: USE bottom sheet */}
      {useSheetLot && (
        <>
          <div
            onClick={() => setUseSheetLot(null)}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 2500 }}
          />
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: '480px',
            backgroundColor: theme.surface,
            borderTop: `0.5px solid ${theme.border}`,
            borderRadius: '12px 12px 0 0',
            zIndex: 2501,
            padding: '16px 20px 32px',
          }}>
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <div style={{ width: '32px', height: '4px', borderRadius: '2px', backgroundColor: theme.border }} />
            </div>
            {/* Title */}
            <div style={{ fontSize: '12px', fontWeight: 700, color: theme.accent, fontFamily: 'monospace', letterSpacing: '1px', marginBottom: '6px' }}>
              LOG ROUNDS USED
            </div>
            {/* Lot info */}
            <div style={{ fontSize: '11px', color: theme.textMuted, fontFamily: 'monospace', marginBottom: '4px' }}>
              {useSheetLot.brand} {useSheetLot.productLine} • {useSheetLot.caliber}
            </div>
            <div style={{ fontSize: '11px', color: theme.textSecondary, fontFamily: 'monospace', marginBottom: '16px' }}>
              {useSheetLot.quantity.toLocaleString()} rds remaining
            </div>
            {/* REMOVE section */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, letterSpacing: '0.8px', marginBottom: '6px' }}>REMOVE</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[1, 5, 10, 20, 50].map(n => {
                  const val = String(-n);
                  return (
                    <button
                      key={n}
                      onClick={() => setUseSheetAmount(val)}
                      style={{
                        padding: '8px 14px',
                        backgroundColor: useSheetAmount === val ? theme.red : 'transparent',
                        color: useSheetAmount === val ? '#fff' : theme.textSecondary,
                        border: `0.5px solid ${useSheetAmount === val ? theme.red : theme.border}`,
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        minHeight: '40px',
                      }}
                    >
                      -{n}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: '0.5px', backgroundColor: theme.border, marginBottom: '12px' }} />

            {/* ADD section */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, letterSpacing: '0.8px', marginBottom: '6px' }}>ADD</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[20, 25, 50, 500, 1000].map(n => {
                  const val = String(n);
                  return (
                    <button
                      key={n}
                      onClick={() => setUseSheetAmount(val)}
                      style={{
                        padding: '8px 14px',
                        backgroundColor: useSheetAmount === val ? theme.green : 'transparent',
                        color: useSheetAmount === val ? '#fff' : theme.textSecondary,
                        border: `0.5px solid ${useSheetAmount === val ? theme.green : theme.border}`,
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        minHeight: '40px',
                      }}
                    >
                      +{n}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: '0.5px', backgroundColor: theme.border, marginBottom: '12px' }} />

            {/* Manual entry */}
            <input
              type="number"
              placeholder="custom amount (negative to remove)"
              value={useSheetAmount}
              onChange={(e) => setUseSheetAmount(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: theme.bg,
                border: `0.5px solid ${theme.border}`,
                borderRadius: '6px',
                color: theme.textPrimary,
                fontFamily: 'monospace',
                fontSize: '16px',
                textAlign: 'center',
                marginBottom: '16px',
                boxSizing: 'border-box'
              }}
            />
            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setUseSheetLot(null)}
                style={{
                  flex: 1, padding: '11px', backgroundColor: 'transparent', color: theme.textPrimary,
                  border: `0.5px solid ${theme.border}`, borderRadius: '4px', fontFamily: 'monospace',
                  fontSize: '11px', letterSpacing: '0.8px', cursor: 'pointer'
                }}
              >
                CANCEL
              </button>
              <button
                onClick={() => {
                  const delta = parseInt(useSheetAmount || '0', 10);
                  updateAmmo(useSheetLot!.id, { quantity: Math.max(0, useSheetLot!.quantity + delta) });
                  loadAmmo();
                  setUseSheetLot(null);
                  setUseSheetAmount('');
                }}
                style={{
                  flex: 1, padding: '11px', backgroundColor: theme.accent, color: theme.bg,
                  border: 'none', borderRadius: '4px', fontFamily: 'monospace',
                  fontSize: '11px', letterSpacing: '0.8px', cursor: 'pointer', fontWeight: 600
                }}
              >
                CONFIRM
              </button>
            </div>
          </div>
        </>
      )}

      {/* Sort Bottom Sheet */}
      {showSortSheet && (
        <>
          <div onClick={() => setShowSortSheet(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 2500 }} />
          <div style={{
            position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: '100%', maxWidth: '480px', backgroundColor: theme.bg,
            borderTop: `0.5px solid ${theme.border}`, borderRadius: '12px 12px 0 0',
            zIndex: 2501, padding: '12px 20px calc(env(safe-area-inset-bottom) + 24px)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              <div style={{ width: '32px', height: '4px', borderRadius: '2px', backgroundColor: theme.border }} />
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textMuted, letterSpacing: '1px', marginBottom: '12px', fontWeight: 700 }}>SORT BY</div>
            {([
              { field: 'rounds', label: 'Rounds' },
              { field: 'velocity', label: 'Velocity (fps)' },
              { field: 'energy', label: 'Muzzle Energy' },
              { field: 'price', label: 'Price Per Round' },
              { field: 'alpha', label: 'A–Z' },
            ] as const).map(({ field, label }) => {
              const active = sortField === field;
              return (
                <button key={field} onClick={() => setSortField(field)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '11px 4px',
                  backgroundColor: 'transparent', border: 'none',
                  borderBottom: `0.5px solid ${theme.border}`, cursor: 'pointer',
                  textAlign: 'left',
                }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '13px', color: active ? theme.accent : theme.textSecondary, fontWeight: active ? 700 : 400 }}>
                    {label}
                  </span>
                  {active && (
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: theme.accent, flexShrink: 0 }} />
                  )}
                </button>
              );
            })}
            {/* ASC / DESC toggle */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
              {(['desc', 'asc'] as const).map(d => (
                <button key={d} onClick={() => setSortDir(d)} style={{
                  flex: 1, padding: '10px',
                  backgroundColor: sortDir === d ? theme.accent : 'transparent',
                  color: sortDir === d ? theme.bg : theme.textSecondary,
                  border: `0.5px solid ${sortDir === d ? theme.accent : theme.border}`,
                  borderRadius: '4px', fontFamily: 'monospace', fontSize: '10px',
                  fontWeight: 700, cursor: 'pointer', letterSpacing: '0.5px',
                }}>
                  {d === 'desc' ? '↓ HIGH → LOW' : '↑ LOW → HIGH'}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// LOT CARD (extracted component for cleanliness)
// ============================================================================

interface LotCardProps {
  lot: AmmoLot;
  onSelect: (lot: AmmoLot) => void;
  onToggleFavorite: (lot: AmmoLot) => void;
  onUse: (lot: AmmoLot) => void;
}

function LotCard({ lot, onSelect, onToggleFavorite, onUse }: LotCardProps) {
  const threshold = getSmartThreshold(lot);
  const isLowStock = threshold > 0 && lot.quantity < threshold;

  return (
    <div
      onClick={() => onSelect(lot)}
      style={{
        backgroundColor: theme.surface,
        borderRadius: '4px',
        padding: '10px',
        border: `0.5px solid ${lot.isFavorite ? theme.accent : (isLowStock ? theme.red : theme.border)}`,
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = theme.accent;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = lot.isFavorite ? theme.accent : (isLowStock ? theme.red : theme.border);
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: theme.caliberRed, fontFamily: 'monospace' }}>
          {normalizeCaliberLabel(lot.caliber)}
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <div style={{
            padding: '2px 6px',
            backgroundColor: getCategoryColor(lot.category),
            borderRadius: '2px',
            fontSize: '7px',
            fontWeight: 600,
            color: theme.bg,
            letterSpacing: '0.3px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            {lot.category === 'Match' ? 'MATCH' : lot.category === 'Self Defense' ? 'SD' : lot.category === 'Practice' ? 'PRAC' : lot.category === 'Hunting' ? 'HUNT' : lot.category.toUpperCase()}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(lot); }}
            style={{ background: 'none', border: 'none', fontSize: '12px', cursor: 'pointer', padding: '0', lineHeight: 1 }}
          >
            {lot.isFavorite ? '⭐' : '☆'}
          </button>
        </div>
      </div>

      {/* Brand / Line */}
      <div style={{ fontSize: '10px', color: theme.textPrimary, fontWeight: 600, marginBottom: '2px' }}>
        {lot.brand} {lot.productLine && `• ${lot.productLine}`}
      </div>

      {/* Quantity row — inline with USE button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <div style={{
          fontSize: '24px',
          fontWeight: 700,
          color: isLowStock ? theme.red : theme.accent,
          fontFamily: 'monospace',
          lineHeight: 1
        }}>
          {lot.quantity.toLocaleString()}
          <span style={{ fontSize: '10px', color: theme.textMuted, marginLeft: '4px' }}>rds</span>
          {lot.purchasePricePerRound && (
            <span style={{ fontSize: '10px', color: theme.textMuted, marginLeft: '8px' }}>
              · {(lot.purchasePricePerRound * 100).toFixed(0)}¢/rd
            </span>
          )}
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUse(lot);
            }}
            style={{
              padding: '6px 12px',
              backgroundColor: 'transparent',
              color: theme.textSecondary,
              border: `0.5px solid ${theme.border}`,
              borderRadius: '3px',
              fontFamily: 'monospace',
              fontSize: '10px',
              letterSpacing: '0.5px',
              cursor: 'pointer',
              fontWeight: 600,
              minHeight: '32px',
            }}
          >
            USE
          </button>
        </div>
      </div>

      {/* Single-line ballistics */}
      <div style={{ fontSize: '11px', color: theme.textSecondary, marginBottom: '4px' }}>
        {lot.grainWeight}<AmmoAcronym term="GR" /> <BulletTypeDisplay value={lot.bulletType || ''} />{lot.advertisedFPS ? ` · ${lot.advertisedFPS} fps` : ''}
        {lot.standardDeviation != null && (
          <span style={{
            color: lot.standardDeviation <= 10 ? theme.green : lot.standardDeviation <= 15 ? theme.orange : theme.red,
            fontWeight: 700,
          }}>
            {' · SD ' + lot.standardDeviation + ' fps'}
          </span>
        )}
        {lot.purchasePricePerRound ? ` · ${(lot.purchasePricePerRound * 100).toFixed(0)}¢/rd` : ''}
      </div>
    </div>
  );
}

// ============================================================================
// TYPEAHEAD DATA
// ============================================================================

const AMMO_BRANDS = [
  'Federal', 'Hornady', 'Winchester', 'Remington', 'PMC', 'Blazer', 'Blazer Brass',
  'CCI', 'Speer', 'Sig Sauer', 'Fiocchi', 'Magtech', 'Sellier & Bellot', 'Aguila',
  'American Eagle', 'Norma', 'Nosler', 'Barnes', 'Lapua', 'IMI', 'Wolf', 'Tula',
  'Herter\'s', 'Browning', 'Underwood', 'Buffalo Bore', 'Cor-Bon', 'Liberty',
];

const AMMO_CALIBERS = [
  '9mm Luger', '9mm +P', '.45 ACP', '.40 S&W', '10mm Auto', '.380 ACP',
  '.357 Magnum', '.38 Special', '.44 Magnum', '.357 SIG',
  '5.56x45mm NATO', '.223 Remington', '.308 Winchester', '6.5 Creedmoor',
  '.30-06 Springfield', '.300 Win Mag', '.300 Blackout', '7.62x39mm',
  '7.62x51mm NATO', '6.8 SPC', '.338 Lapua', '.50 BMG',
  '.22 LR', '.22 WMR', '.17 HMR',
  '12 Gauge', '20 Gauge', '.410 Bore',
  '.45 Colt', '.44 Special', '.38 Super', '.41 Magnum',
  '.30-30 Winchester', '.243 Winchester', '.270 Winchester', '7mm Rem Mag',
];

const AMMO_BULLET_TYPES = [
  'FMJ', 'JHP', 'HP', 'SP', 'JSP', 'TMJ', 'LRN', 'LSWC', 'FP', 'TC',
  'FMJBT', 'BTHP', 'OTM', 'HPBT', 'SJHP', 'HST', 'XTP', 'SXT',
  'FTX', 'FlexTip', 'Partition', 'AccuBond', 'ELD-X', 'ELD-M',
  'Frangible', 'Tracer', 'API', 'Buckshot', 'Slug',
];

// Typeahead input component
function TypeaheadInput({
  value, onChange, suggestions, placeholder, inputStyle,
}: {
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  placeholder?: string;
  inputStyle: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = value.length >= 1
    ? suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase())).slice(0, 6)
    : [];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        style={inputStyle}
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          backgroundColor: theme.surface, border: '0.5px solid ' + theme.border,
          borderRadius: '4px', marginTop: '2px', overflow: 'hidden',
        }}>
          {filtered.map(s => (
            <button
              key={s}
              onMouseDown={e => { e.preventDefault(); onChange(s); setOpen(false); }}
              style={{
                display: 'block', width: '100%', padding: '8px 10px', textAlign: 'left',
                backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
                fontFamily: 'monospace', fontSize: '12px', color: theme.textPrimary,
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ADD AMMO MODAL
// ============================================================================

interface AddAmmoModalProps {
  onClose: () => void;
  onSave: () => void;
  showAdvanced: boolean;
  setShowAdvanced: (show: boolean) => void;
}

function AddAmmoModal({ onClose, onSave, showAdvanced, setShowAdvanced }: AddAmmoModalProps) {
  const [caliber, setCaliber] = useState('');
  const [brand, setBrand] = useState('');
  const [productLine, setProductLine] = useState('');
  const [grainWeight, setGrainWeight] = useState('');
  const [quantity, setQuantity] = useState('');
  const [formError, setFormError] = useState('');
  const [category, setCategory] = useState<AmmoLot['category']>('Practice');
  const [bulletType, setBulletType] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [costPerRound, setCostPerRound] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [storageLocation, setStorageLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const scanInputRef = useRef<HTMLInputElement>(null);

  function handleSubmit() {
    if (!caliber || !brand || !grainWeight || !quantity) {
      setFormError('Please fill in all required fields: caliber, brand, grain weight, and quantity.');
      return;
    }
    setFormError('');

    const grain = parseInt(grainWeight);
    const qty = parseInt(quantity);

    const newLot: Omit<AmmoLot, 'id' | 'createdAt' | 'updatedAt'> = {
      caliber,
      brand,
      productLine,
      grainWeight: grain,
      bulletType,
      quantity: qty,
      category,
      isHandload: false,
      quantityPurchased: qty,
      purchasePricePerRound: costPerRound ? parseFloat(costPerRound) : undefined,
      averageCostPerRound: costPerRound ? parseFloat(costPerRound) : undefined,
      lotNumber,
      storageLocation,
      notes,
      purchaseDate: purchaseDate || undefined
    };

    addAmmo(newLot);
    onSave();
  }

  async function handleScanFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    setScanError('');
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const result = await analyzeAmmoBox(dataUrl);
      if (result.caliber) setCaliber(result.caliber);
      if (result.brand) setBrand(result.brand);
      if (result.productLine) setProductLine(result.productLine);
      if (result.grainWeight) setGrainWeight(String(result.grainWeight));
      if (result.bulletType) setBulletType(result.bulletType);
      if (result.quantity) setQuantity(String(result.quantity));
    } catch {
      setScanError('Could not read the box. Try a clearer photo.');
    } finally {
      setScanning(false);
      if (scanInputRef.current) scanInputRef.current.value = '';
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '10px',
    backgroundColor: theme.bg,
    border: `0.5px solid ${theme.border}`,
    borderRadius: '4px',
    color: theme.textPrimary,
    fontFamily: 'monospace',
    fontSize: '13px',
    boxSizing: 'border-box' as const
  };

  const labelStyle = {
    fontFamily: 'monospace' as const,
    fontSize: '10px',
    letterSpacing: '0.8px',
    color: theme.textMuted,
    textTransform: 'uppercase' as const,
    marginBottom: '6px',
    display: 'block' as const
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '24px',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: theme.surface,
          borderRadius: '8px',
          maxWidth: '480px',
          width: '100%',
          padding: '24px',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 700, margin: 0, color: theme.accent }}>
            ADD AMMO TO INVENTORY
          </h2>
          {hasClaudeApiKey() && (
            <button
              onClick={() => scanInputRef.current?.click()}
              disabled={scanning}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 12px', backgroundColor: scanning ? theme.surface : 'rgba(255,212,59,0.12)',
                border: '0.5px solid ' + theme.accent, borderRadius: '6px',
                color: theme.accent, fontFamily: 'monospace', fontSize: '10px',
                letterSpacing: '0.6px', cursor: scanning ? 'wait' : 'pointer',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              {scanning ? 'SCANNING...' : 'SCAN BOX'}
            </button>
          )}
          <input
            ref={scanInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={handleScanFile}
          />
        </div>

        {scanError && (
          <div style={{ color: theme.red, fontFamily: 'monospace', fontSize: '10px', marginBottom: '12px', padding: '6px 8px', backgroundColor: 'rgba(255,107,107,0.08)', borderRadius: '4px', border: '0.5px solid ' + theme.red }}>
            {scanError}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
          <div><label style={labelStyle}>Caliber *</label><TypeaheadInput value={caliber} onChange={setCaliber} suggestions={AMMO_CALIBERS} placeholder="9mm Luger" inputStyle={inputStyle} /></div>
          <div><label style={labelStyle}>Brand *</label><TypeaheadInput value={brand} onChange={setBrand} suggestions={AMMO_BRANDS} placeholder="Federal" inputStyle={inputStyle} /></div>
          <div><label style={labelStyle}>Grain Weight *</label><input type="number" inputMode="numeric" placeholder="124" value={grainWeight} onChange={(e) => setGrainWeight(e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>Quantity (rounds) *</label><input type="number" inputMode="numeric" placeholder="500" value={quantity} onChange={(e) => setQuantity(e.target.value)} style={inputStyle} /></div>
          <div>
            <label style={labelStyle}>Category *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {(['Practice', 'Match', 'Self Defense', 'Hunting'] as const).map(cat => (
                <button key={cat} onClick={() => setCategory(cat)} style={{
                  padding: '8px',
                  backgroundColor: category === cat ? theme.accent : 'transparent',
                  color: category === cat ? theme.bg : theme.textPrimary,
                  border: `0.5px solid ${category === cat ? theme.accent : theme.border}`,
                  borderRadius: '4px', fontFamily: 'monospace', fontSize: '9px', cursor: 'pointer'
                }}>
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            width: '100%', padding: '8px', backgroundColor: 'transparent', color: theme.accent,
            border: `0.5px solid ${theme.border}`, borderRadius: '4px', fontFamily: 'monospace',
            fontSize: '10px', letterSpacing: '0.8px', cursor: 'pointer', marginBottom: showAdvanced ? '16px' : '0'
          }}
        >
          {showAdvanced ? '▼ HIDE ADVANCED' : '▶ SHOW ADVANCED'}
        </button>

        {showAdvanced && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
            <div><label style={labelStyle}>Product Line</label><input type="text" placeholder="HST" value={productLine} onChange={(e) => setProductLine(e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Bullet Type</label><TypeaheadInput value={bulletType} onChange={setBulletType} suggestions={AMMO_BULLET_TYPES} placeholder="JHP" inputStyle={inputStyle} /></div>
            <div><label style={labelStyle}>Purchase Date</label><input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Cost Per Round ($)</label><input type="number" step="0.01" placeholder="0.35" value={costPerRound} onChange={(e) => setCostPerRound(e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Lot Number</label><input type="text" placeholder="ABC123" value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Storage Location</label><input type="text" placeholder="Ammo can #1" value={storageLocation} onChange={(e) => setStorageLocation(e.target.value)} style={inputStyle} /></div>
            <div>
              <label style={labelStyle}>Notes</label>
              <textarea placeholder="Additional notes..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                style={{ ...inputStyle, resize: 'vertical' as const }} />
            </div>
          </div>
        )}

        <div style={{ marginTop: '20px' }}>
          {formError && (
            <div style={{ color: theme.red, fontFamily: 'monospace', fontSize: '10px', marginBottom: '8px', padding: '6px 8px', backgroundColor: 'rgba(255,107,107,0.08)', borderRadius: '4px', border: `0.5px solid ${theme.red}` }}>
              {formError}
            </div>
          )}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onClose} style={{
              flex: 1, padding: '11px', backgroundColor: 'transparent', color: theme.textPrimary,
              border: `0.5px solid ${theme.border}`, borderRadius: '4px', fontFamily: 'monospace',
              fontSize: '11px', letterSpacing: '0.8px', cursor: 'pointer'
            }}>CANCEL</button>
            <button onClick={handleSubmit} style={{
              flex: 1, padding: '11px', backgroundColor: theme.accent, color: theme.bg, border: 'none',
              borderRadius: '4px', fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.8px',
              cursor: 'pointer', fontWeight: 600
            }}>ADD TO INVENTORY</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// LOW STOCK MODAL
// ============================================================================

function LowStockModal({
  lowStockLots,
  getSmartThreshold,
  onClose,
  onLotSelect,
  onIgnore,
  onSnooze,
}: {
  lowStockLots: AmmoLot[];
  getSmartThreshold: (lot: AmmoLot) => number;
  onClose: () => void;
  onLotSelect: (lot: AmmoLot) => void;
  onIgnore: (lotId: string) => void;
  onSnooze: (lotId: string) => void;
}) {
  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 2000, padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: theme.surface, borderRadius: '8px', maxWidth: '480px',
          width: '100%', padding: '20px', maxHeight: '80vh', overflow: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 12px 0', color: theme.red, fontFamily: 'monospace', fontSize: '18px', letterSpacing: '1px' }}>
          LOW STOCK ({lowStockLots.length})
        </h2>
        <p style={{ color: theme.textSecondary, fontSize: '11px', marginBottom: '16px', fontFamily: 'monospace' }}>
          Below recommended stock levels
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {lowStockLots.map(lot => {
            const threshold = getSmartThreshold(lot);
            const pct = (lot.quantity / threshold) * 100;

            return (
              <div key={lot.id} style={{
                padding: '14px', backgroundColor: theme.surfaceAlt, borderRadius: '6px',
                border: `1.5px solid ${pct < 25 ? theme.red : theme.orange}`,
                cursor: 'pointer',
              }}
                onClick={() => onLotSelect(lot)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ color: theme.textPrimary, fontFamily: 'monospace', fontSize: '13px', fontWeight: 600 }}>
                      {lot.brand} {lot.productLine}
                    </div>
                    <div style={{ color: theme.textMuted, fontSize: '10px', fontFamily: 'monospace' }}>
                      {normalizeCaliberLabel(lot.caliber)} · {lot.grainWeight}gr {lot.bulletType}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: pct < 25 ? theme.red : theme.orange, fontFamily: 'monospace' }}>
                      {lot.quantity}
                    </div>
                    <div style={{ fontSize: '9px', color: theme.textMuted, fontFamily: 'monospace' }}>/ {threshold} target</div>
                  </div>
                </div>

                <div style={{ width: '100%', height: '4px', backgroundColor: theme.bg, borderRadius: '2px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{
                    width: `${Math.min(pct, 100)}%`, height: '100%',
                    backgroundColor: pct < 25 ? theme.red : theme.orange,
                    transition: 'width 0.3s ease'
                  }} />
                </div>

                <div style={{ fontSize: '9px', color: theme.textSecondary, fontFamily: 'monospace', marginBottom: '10px' }}>
                  <strong style={{ color: pct < 25 ? theme.red : theme.orange }}>{pct < 25 ? 'CRITICAL' : 'LOW'}</strong>
                  {' · '}{lot.category}
                  {lot.storageLocation ? ` · ${lot.storageLocation}` : ''}
                </div>

                {/* Action buttons row */}
                <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                  <a
                    href={getAmmoSeekUrl(lot)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      backgroundColor: theme.accent,
                      color: theme.bg,
                      border: 'none',
                      borderRadius: '3px',
                      fontFamily: 'monospace',
                      fontSize: '9px',
                      letterSpacing: '0.5px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      textDecoration: 'none',
                      textAlign: 'center',
                      display: 'block',
                    }}
                  >
                    FIND AMMO ↗
                  </a>
                  <button
                    onClick={(e) => { e.stopPropagation(); onSnooze(lot.id); }}
                    style={{
                      padding: '6px 8px',
                      backgroundColor: 'transparent',
                      color: theme.textMuted,
                      border: `0.5px solid ${theme.border}`,
                      borderRadius: '3px',
                      fontFamily: 'monospace',
                      fontSize: '9px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    SNOOZE 30D
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onIgnore(lot.id); }}
                    style={{
                      padding: '6px 8px',
                      backgroundColor: 'transparent',
                      color: theme.textMuted,
                      border: `0.5px solid ${theme.border}`,
                      borderRadius: '3px',
                      fontFamily: 'monospace',
                      fontSize: '9px',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    IGNORE
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: '16px', padding: '11px 24px', backgroundColor: theme.accent, color: theme.bg,
            border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'monospace',
            fontSize: '11px', letterSpacing: '0.8px', fontWeight: 600, width: '100%'
          }}
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// LOT DETAIL MODAL
// ============================================================================

interface LotDetailModalProps {
  lot: AmmoLot;
  onClose: () => void;
  onUpdate: () => void;
}

function LotDetailModal({ lot, onClose, onUpdate }: LotDetailModalProps) {
  const [currentLot, setCurrentLot] = useState<AmmoLot>(lot);
  const [editingTarget, setEditingTarget] = useState(false);
  const [newTarget, setNewTarget] = useState('');
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [editingPrice, setEditingPrice] = useState(false);
  const [editingMarketPrice, setEditingMarketPrice] = useState(false);
  const [newMarketPrice, setNewMarketPrice] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [editingChrono, setEditingChrono] = useState(false);
  const [chronoFpsInput, setChronoFpsInput] = useState('');
  const [chronoSdInput, setChronoSdInput] = useState('');

  // Task 11: purchase history state
  const [showAddPurchase, setShowAddPurchase] = useState(false);
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchaseError, setPurchaseError] = useState('');
  const [purchaseQty, setPurchaseQty] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');

  // Load latest lot state
  useEffect(() => {
    setCurrentLot(lot);
  }, [lot]);

  const allGuns = getAllGuns();
  const allSessions = getAllSessions();

  const threshold = getSmartThreshold(currentLot);
  const fillPct = threshold > 0 ? Math.min(100, (currentLot.quantity / threshold) * 100) : 0;
  const barColor = fillPct >= 100 ? theme.green : fillPct >= 50 ? theme.orange : theme.red;

  // Matching guns (by caliber group)
  const matchingGuns = allGuns.filter(g => sameCaliberGroup(g.caliber, currentLot.caliber));

  // Sessions for matching guns
  const matchingGunIds = matchingGuns.map(g => g.id);
  const gunSessions = allSessions.filter(s => matchingGunIds.includes(s.gunId));
  const confirmedSessions = allSessions.filter(s => s.ammoLotId === currentLot.id);

  // Task 7: 365 days instead of 90
  const nowMs = Date.now();
  const yearAgo = nowMs - 365 * 24 * 60 * 60 * 1000;
  const recentSessions = gunSessions.filter(s => new Date(s.date).getTime() >= yearAgo);
  const totalRoundsLastYear = recentSessions.reduce((sum, s) => sum + s.roundsExpended, 0);
  const rdsPerDay = totalRoundsLastYear > 0 ? totalRoundsLastYear / 365 : 0;
  const rdsPerWeek = rdsPerDay * 7;
  const runwayDays = rdsPerDay > 0 ? currentLot.quantity / rdsPerDay : 0;
  const runwayWeeks = runwayDays / 7;

  function reloadLot() {
    const ammo = getAllAmmo();
    const updated = ammo.find(a => a.id === currentLot.id);
    if (updated) setCurrentLot(updated);
  }

  function handleAdjust(delta: number) {
    updateAmmo(currentLot.id, { quantity: Math.max(0, currentLot.quantity + delta) });
    reloadLot();
  }

  const [customAdj, setCustomAdj] = useState('');
  const [customAdjSign, setCustomAdjSign] = useState<1 | -1>(1);
  function handleCustomApply() {
    const n = parseInt(customAdj, 10);
    if (!isNaN(n) && n > 0) {
      updateAmmo(currentLot.id, { quantity: Math.max(0, currentLot.quantity + customAdjSign * n) });
      reloadLot();
      setCustomAdj('');
    }
  }

  function handleToggleAssignedGun(gunId: string) {
    const current = currentLot.assignedGunIds || [];
    const updated = current.includes(gunId)
      ? current.filter(id => id !== gunId)
      : [...current, gunId];
    updateAmmo(currentLot.id, { assignedGunIds: updated });
    reloadLot();
  }

  function handleSaveTarget() {
    const n = parseInt(newTarget, 10);
    if (!isNaN(n) && n >= 0) {
      updateAmmo(currentLot.id, { minStockAlert: n });
      reloadLot();
      setEditingTarget(false);
    }
  }

  function handleSavePrice() {
    const p = parseFloat(newPrice);
    if (!isNaN(p) && p >= 0) {
      updateAmmo(currentLot.id, { purchasePricePerRound: p });
      reloadLot();
      setEditingPrice(false);
      setNewPrice('');
    }
  }

  function handleSaveMarketPrice() {
    const p = parseFloat(newMarketPrice);
    if (!isNaN(p) && p >= 0) {
      updateAmmo(currentLot.id, { currentMarketPrice: p });
      reloadLot();
      setEditingMarketPrice(false);
      setNewMarketPrice('');
    }
  }

  function handleSaveChrono() {
    const fps = parseFloat(chronoFpsInput);
    const sd = parseFloat(chronoSdInput);
    if (!isNaN(fps) && fps > 0 && !isNaN(sd) && sd >= 0) {
      updateAmmo(currentLot.id, { actualFPS: fps, standardDeviation: sd });
      reloadLot();
      setEditingChrono(false);
      setChronoFpsInput('');
      setChronoSdInput('');
    }
  }

  // Task 11: save purchase history entry
  function handleSavePurchase() {
    const qty = parseInt(purchaseQty, 10);
    const price = parseFloat(purchasePrice);
    if (isNaN(qty) || qty <= 0 || isNaN(price) || price < 0) {
      setPurchaseError('Enter a valid quantity (> 0) and price (≥ 0).');
      return;
    }
    setPurchaseError('');
    const newEntry = { date: purchaseDate || new Date().toISOString().slice(0, 10), quantity: qty, pricePerRound: price };
    const existingHistory = currentLot.purchaseHistory || [];
    const newHistory = [...existingHistory, newEntry];
    const totalQtyPurchased = (currentLot.quantityPurchased || 0) + qty;
    const totalCost = newHistory.reduce((s, e) => s + e.quantity * e.pricePerRound, 0);
    const totalQty = newHistory.reduce((s, e) => s + e.quantity, 0);
    const newAvg = totalQty > 0 ? totalCost / totalQty : price;
    updateAmmo(currentLot.id, {
      purchaseHistory: newHistory,
      quantity: currentLot.quantity + qty,
      quantityPurchased: totalQtyPurchased,
      averageCostPerRound: newAvg,
    });
    reloadLot();
    setShowAddPurchase(false);
    setPurchaseDate('');
    setPurchaseQty('');
    setPurchasePrice('');
  }

  const inputStyle = {
    padding: '6px 10px',
    backgroundColor: theme.bg,
    border: `0.5px solid ${theme.border}`,
    borderRadius: '4px',
    color: theme.textPrimary,
    fontFamily: 'monospace',
    fontSize: '12px'
  };

  const sectionLabel = {
    fontSize: '9px',
    color: theme.textMuted,
    fontFamily: 'monospace',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    marginBottom: '8px',
    display: 'block' as const
  };

  // Task 13: smart reorder suggestion
  const restockSuggestion = (() => {
    if (rdsPerWeek <= 0 || threshold <= 0) return null;
    if (currentLot.quantity >= threshold) return null;
    const needed = Math.ceil((threshold - currentLot.quantity) / 50) * 50;
    return needed;
  })();

  // Task 12: check for +P in caliber
  const hasPlus = currentLot.caliber.includes('+P');

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'flex-start',
        justifyContent: 'center', zIndex: 2000, padding: '16px', overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: theme.surface, borderRadius: '8px', maxWidth: '480px',
          width: '100%', padding: '20px', marginTop: '16px', marginBottom: '16px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: theme.textSecondary,
              fontSize: '20px', cursor: 'pointer', lineHeight: 1, padding: '0'
            }}
          >
            ✕
          </button>
        </div>

        {/* Header */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '20px', fontWeight: 700, color: theme.accent, fontFamily: 'monospace', marginBottom: '2px' }}>
            {currentLot.brand} {currentLot.productLine}
          </div>
          <div style={{ fontSize: '12px', color: theme.textSecondary, fontFamily: 'monospace', marginBottom: '10px' }}>
            {normalizeCaliberLabel(currentLot.caliber)}{hasPlus && <>{' '}<AmmoAcronym term="+P" /></>} · {currentLot.grainWeight}gr <BulletTypeDisplay value={currentLot.bulletType || ''} />
          </div>
          <div style={{ fontSize: '36px', fontWeight: 700, color: theme.accent, fontFamily: 'monospace', lineHeight: 1 }}>
            {currentLot.quantity.toLocaleString()}
            <span style={{ fontSize: '14px', color: theme.textMuted, marginLeft: '6px' }}>rds</span>
            {currentLot.purchasePricePerRound && (
              <span style={{ fontSize: '12px', color: theme.textMuted, marginLeft: '10px' }}>
                · {(currentLot.purchasePricePerRound * 100).toFixed(0)}¢/rd
              </span>
            )}
          </div>

          {/* Progress bar */}
          {threshold > 0 && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '9px', color: theme.textMuted, fontFamily: 'monospace', marginBottom: '3px' }}>
                {currentLot.quantity.toLocaleString()} / {threshold} target
              </div>
              <div style={{ height: '4px', borderRadius: '2px', backgroundColor: theme.bg, overflow: 'hidden' }}>
                <div style={{ width: `${fillPct}%`, height: '100%', backgroundColor: barColor, borderRadius: '2px' }} />
              </div>
            </div>
          )}
        </div>

        {/* Quick Adjust */}
        <div style={{
          padding: '12px', backgroundColor: theme.surfaceAlt, borderRadius: '6px',
          border: `0.5px solid ${theme.border}`, marginBottom: '14px'
        }}>
          <span style={sectionLabel}>QUICK ADJUST</span>

          {/* ADD */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '8px', color: theme.green, fontFamily: 'monospace', letterSpacing: '0.6px', marginBottom: '5px', fontWeight: 700 }}>ADD</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[20, 25, 50, 500, 1000].map(n => (
                <button
                  key={`add-${n}`}
                  onClick={() => handleAdjust(n)}
                  style={{
                    padding: '8px 10px', backgroundColor: 'rgba(81,207,102,0.08)', color: theme.green,
                    border: `0.5px solid ${theme.green}`, borderRadius: '4px',
                    fontFamily: 'monospace', fontSize: '11px', cursor: 'pointer', fontWeight: 600, minWidth: '44px'
                  }}
                >
                  +{n}
                </button>
              ))}
            </div>
          </div>

          {/* Separator */}
          <div style={{ height: '0.5px', backgroundColor: theme.border, marginBottom: '10px' }} />

          {/* REMOVE */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '8px', color: theme.red, fontFamily: 'monospace', letterSpacing: '0.6px', marginBottom: '5px', fontWeight: 700 }}>REMOVE</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[1, 5, 10, 20, 50].map(n => (
                <button
                  key={`rem-${n}`}
                  onClick={() => handleAdjust(-n)}
                  style={{
                    padding: '8px 10px', backgroundColor: 'rgba(255,107,107,0.08)', color: theme.red,
                    border: `0.5px solid ${theme.red}`, borderRadius: '4px',
                    fontFamily: 'monospace', fontSize: '11px', cursor: 'pointer', fontWeight: 600, minWidth: '44px'
                  }}
                >
                  -{n}
                </button>
              ))}
            </div>
          </div>

          {/* Custom */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              onClick={() => setCustomAdjSign(s => s === 1 ? -1 : 1)}
              style={{
                padding: '8px 10px', backgroundColor: customAdjSign === 1 ? 'rgba(81,207,102,0.08)' : 'rgba(255,107,107,0.08)',
                color: customAdjSign === 1 ? theme.green : theme.red,
                border: `0.5px solid ${customAdjSign === 1 ? theme.green : theme.red}`, borderRadius: '4px',
                fontFamily: 'monospace', fontSize: '13px', cursor: 'pointer', fontWeight: 700, minWidth: '36px'
              }}
            >
              {customAdjSign === 1 ? '+' : '−'}
            </button>
            <input
              type="number"
              placeholder="custom"
              value={customAdj}
              onChange={(e) => setCustomAdj(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              onClick={handleCustomApply}
              style={{
                padding: '8px 12px', backgroundColor: theme.accent, color: theme.bg, border: 'none',
                borderRadius: '4px', fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer', fontWeight: 600
              }}
            >
              APPLY
            </button>
          </div>
        </div>

        {/* Ballistics row — Task 10: acronym tooltips */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px',
          padding: '10px', backgroundColor: theme.bg, borderRadius: '4px', marginBottom: '14px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '8px', color: theme.textMuted, fontFamily: 'monospace', letterSpacing: '0.5px', marginBottom: '2px' }}>
              <AmmoAcronym term="GR" />
            </div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: theme.textPrimary, fontFamily: 'monospace' }}>{currentLot.grainWeight}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '8px', color: theme.textMuted, fontFamily: 'monospace', letterSpacing: '0.5px', marginBottom: '2px' }}>TYPE</div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: theme.textPrimary, fontFamily: 'monospace' }}>
              <BulletTypeDisplay value={currentLot.bulletType || '—'} />
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '8px', color: theme.textMuted, fontFamily: 'monospace', letterSpacing: '0.5px', marginBottom: '2px' }}>
              ADV <AmmoAcronym term="FPS" />
            </div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: theme.textPrimary, fontFamily: 'monospace' }}>{currentLot.advertisedFPS || '—'}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '8px', color: theme.textMuted, fontFamily: 'monospace', letterSpacing: '0.5px', marginBottom: '2px' }}>
              <AmmoAcronym term="FT-LBS" />
            </div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: theme.textPrimary, fontFamily: 'monospace' }}>{currentLot.muzzleEnergy || '—'}</div>
          </div>
        </div>

        {/* Assigned Guns */}
        <div style={{
          padding: '12px', backgroundColor: theme.surfaceAlt, borderRadius: '6px',
          border: `0.5px solid ${theme.border}`, marginBottom: '14px'
        }}>
          <span style={sectionLabel}>GUNS USING THIS AMMO</span>
          {matchingGuns.length === 0 ? (
            <div style={{ fontSize: '11px', color: theme.textMuted, fontFamily: 'monospace' }}>
              No guns chambered for this caliber
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {matchingGuns.map(gun => {
                const isAssigned = (currentLot.assignedGunIds || []).includes(gun.id);
                return (
                  <div
                    key={gun.id}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '6px 8px', backgroundColor: theme.bg, borderRadius: '4px'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '11px', color: theme.textPrimary, fontFamily: 'monospace' }}>
                        {gun.make} {gun.model}
                      </span>
                      <span style={{
                        marginLeft: '8px', fontSize: '8px', padding: '1px 4px',
                        borderRadius: '2px', backgroundColor: gun.status === 'Active' ? theme.green : theme.textMuted,
                        color: theme.bg, fontFamily: 'monospace', fontWeight: 600
                      }}>
                        {gun.status.toUpperCase()}
                      </span>
                    </div>
                    <button
                      onClick={() => handleToggleAssignedGun(gun.id)}
                      style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', padding: '0' }}
                    >
                      {isAssigned ? '⭐' : '☆'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Session Performance */}
        <div style={{
          padding: '12px', backgroundColor: theme.surfaceAlt, borderRadius: '6px',
          border: `0.5px solid ${theme.border}`, marginBottom: '14px'
        }}>
          <span style={sectionLabel}>SESSION PERFORMANCE</span>
          <div style={{ fontSize: '11px', color: theme.textSecondary, fontFamily: 'monospace', marginBottom: '6px' }}>
            {gunSessions.length} sessions across guns in this caliber
          </div>
          {gunSessions.length > 0 && (
            <div style={{ fontSize: '11px', color: theme.textSecondary, fontFamily: 'monospace', marginBottom: '6px' }}>
              {gunSessions.filter(s => s.issues).length} with issues · {gunSessions.filter(s => !s.issues).length} clean
            </div>
          )}
          {confirmedSessions.length > 0 && (
            <div style={{ marginTop: '8px', padding: '8px', backgroundColor: theme.bg, borderRadius: '4px' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: theme.accent, fontFamily: 'monospace', marginBottom: '4px' }}>
                CONFIRMED LOT SESSIONS: {confirmedSessions.length}
              </div>
              <div style={{ fontSize: '10px', color: theme.textSecondary, fontFamily: 'monospace' }}>
                Issues: {confirmedSessions.filter(s => s.issues).length}
              </div>
              {confirmedSessions.filter(s => s.issues).length === 0 && (
                <div style={{
                  marginTop: '6px', padding: '4px 8px', backgroundColor: 'rgba(81,207,102,0.15)',
                  borderRadius: '3px', fontSize: '9px', color: theme.green, fontFamily: 'monospace', fontWeight: 600
                }}>
                  ZERO ISSUES LOGGED
                </div>
              )}
            </div>
          )}
        </div>

        {/* Consumption & Runway — Task 7: 365 days label */}
        <div style={{
          padding: '12px', backgroundColor: theme.surfaceAlt, borderRadius: '6px',
          border: `0.5px solid ${theme.border}`, marginBottom: '14px'
        }}>
          <span style={sectionLabel}>CONSUMPTION &amp; RUNWAY</span>
          {rdsPerWeek > 0 ? (
            <>
              <div style={{ fontSize: '11px', color: theme.textSecondary, fontFamily: 'monospace', marginBottom: '4px' }}>
                ~{rdsPerWeek.toFixed(0)} rds/week avg (last 12 months)
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: theme.textPrimary, fontFamily: 'monospace' }}>
                {runwayWeeks > 12
                  ? `~${(runwayWeeks / 4.33).toFixed(1)} months remaining at current pace`
                  : `~${runwayWeeks.toFixed(0)} weeks remaining at current pace`}
              </div>
              {/* Task 13: smart reorder suggestion */}
              {restockSuggestion != null && restockSuggestion > 0 && (
                <div style={{
                  marginTop: '10px',
                  backgroundColor: 'rgba(255,212,59,0.1)',
                  border: `0.5px solid ${theme.accent}`,
                  borderRadius: '4px',
                  padding: '8px',
                }}>
                  <div style={{ fontSize: '10px', color: theme.accent, fontFamily: 'monospace', fontWeight: 600 }}>
                    SUGGESTED RESTOCK: {restockSuggestion.toLocaleString()} rounds
                  </div>
                  <div style={{ fontSize: '9px', color: theme.accent, fontFamily: 'monospace', opacity: 0.8, marginTop: '2px' }}>
                    (brings you back to target at current pace)
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: '11px', color: theme.textMuted, fontFamily: 'monospace' }}>
              No recent sessions — can&apos;t estimate runway
            </div>
          )}
        </div>

        {/* Stock Target + Price */}
        <div style={{
          padding: '12px', backgroundColor: theme.surfaceAlt, borderRadius: '6px',
          border: `0.5px solid ${theme.border}`, marginBottom: '14px'
        }}>
          <span style={sectionLabel}>STOCK TARGET &amp; PRICE</span>

          {/* Stock target row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            {!editingTarget ? (
              <>
                <span style={{ fontSize: '13px', color: theme.textPrimary, fontFamily: 'monospace' }}>
                  Stock target: {threshold > 0 ? `${threshold} rounds` : 'none'}
                </span>
                <button
                  onClick={() => { setEditingTarget(true); setNewTarget(threshold > 0 ? threshold.toString() : ''); }}
                  style={{
                    background: 'none', border: 'none', color: theme.accent,
                    fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer', textDecoration: 'underline'
                  }}
                >
                  EDIT
                </button>
              </>
            ) : (
              <>
                <input
                  type="number"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  placeholder="0 to disable"
                  style={{ ...inputStyle, width: '100px' }}
                />
                <button
                  onClick={handleSaveTarget}
                  style={{
                    padding: '5px 12px', backgroundColor: theme.accent, color: theme.bg, border: 'none',
                    borderRadius: '4px', fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer', fontWeight: 600
                  }}
                >
                  SAVE
                </button>
                <button
                  onClick={() => setEditingTarget(false)}
                  style={{
                    background: 'none', border: 'none', color: theme.textSecondary,
                    fontFamily: 'monospace', fontSize: '12px', cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </>
            )}
          </div>

          {/* Price/rd row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {!editingPrice ? (
              <>
                <span style={{ fontSize: '13px', color: theme.textPrimary, fontFamily: 'monospace' }}>
                  Price/rd: {currentLot.purchasePricePerRound != null
                    ? `$${currentLot.purchasePricePerRound.toFixed(3)} (${(currentLot.purchasePricePerRound * 100).toFixed(0)}¢)`
                    : 'not set'}
                </span>
                <button
                  onClick={() => {
                    setEditingPrice(true);
                    setNewPrice(currentLot.purchasePricePerRound != null ? currentLot.purchasePricePerRound.toString() : '');
                  }}
                  style={{
                    background: 'none', border: 'none', color: theme.accent,
                    fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer', textDecoration: 'underline'
                  }}
                >
                  EDIT
                </button>
              </>
            ) : (
              <>
                <input
                  type="number"
                  step="0.001"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="0.350"
                  style={{ ...inputStyle, width: '100px' }}
                />
                <button
                  onClick={handleSavePrice}
                  style={{
                    padding: '5px 12px', backgroundColor: theme.accent, color: theme.bg, border: 'none',
                    borderRadius: '4px', fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer', fontWeight: 600
                  }}
                >
                  SAVE
                </button>
                <button
                  onClick={() => setEditingPrice(false)}
                  style={{
                    background: 'none', border: 'none', color: theme.textSecondary,
                    fontFamily: 'monospace', fontSize: '12px', cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </>
            )}
          </div>
        </div>

        {/* Market price row — for replacement cost calculation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          {!editingMarketPrice ? (
            <>
              <span style={{ fontSize: '13px', color: theme.textPrimary, fontFamily: 'monospace' }}>
                Market price/rd: {currentLot.currentMarketPrice != null
                  ? `$${currentLot.currentMarketPrice.toFixed(3)} (${(currentLot.currentMarketPrice * 100).toFixed(0)}¢)`
                  : 'not set'}
              </span>
              <button
                onClick={() => {
                  setEditingMarketPrice(true);
                  setNewMarketPrice(currentLot.currentMarketPrice != null ? currentLot.currentMarketPrice.toString() : '');
                }}
                style={{ background: 'none', border: 'none', color: theme.accent, fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer', textDecoration: 'underline' }}
              >
                EDIT
              </button>
            </>
          ) : (
            <>
              <input
                type="number" step="0.001" value={newMarketPrice}
                onChange={e => setNewMarketPrice(e.target.value)}
                placeholder="0.350"
                style={{ ...inputStyle, width: '100px' }}
              />
              <button onClick={handleSaveMarketPrice} style={{ padding: '5px 12px', backgroundColor: theme.accent, color: theme.bg, border: 'none', borderRadius: '4px', fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer', fontWeight: 600 }}>SAVE</button>
              <button onClick={() => setEditingMarketPrice(false)} style={{ background: 'none', border: 'none', color: theme.textSecondary, fontFamily: 'monospace', fontSize: '12px', cursor: 'pointer' }}>✕</button>
            </>
          )}
        </div>

        {/* Chrono Data section */}
        <div style={{
          padding: '12px', backgroundColor: theme.surfaceAlt, borderRadius: '6px',
          border: '0.5px solid ' + theme.border, marginBottom: '14px'
        }}>
          <span style={sectionLabel}>CHRONO DATA</span>

          {/* Actual FPS row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: theme.textPrimary, fontFamily: 'monospace', minWidth: '90px' }}>
              Actual FPS:
            </span>
            {!editingChrono ? (
              <>
                <span style={{ fontSize: '13px', color: theme.textPrimary, fontFamily: 'monospace' }}>
                  {currentLot.actualFPS != null ? currentLot.actualFPS + ' fps' : '\u2014'}
                </span>
                <button
                  onClick={() => {
                    setEditingChrono(true);
                    setChronoFpsInput(currentLot.actualFPS != null ? currentLot.actualFPS.toString() : '');
                    setChronoSdInput(currentLot.standardDeviation != null ? currentLot.standardDeviation.toString() : '');
                  }}
                  style={{
                    background: 'none', border: 'none', color: theme.accent,
                    fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer', textDecoration: 'underline'
                  }}
                >
                  EDIT
                </button>
              </>
            ) : (
              <input
                type="number"
                value={chronoFpsInput}
                onChange={(e) => setChronoFpsInput(e.target.value)}
                placeholder="fps"
                style={{ ...inputStyle, width: '90px' }}
              />
            )}
          </div>

          {/* Standard Deviation row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: theme.textPrimary, fontFamily: 'monospace', minWidth: '90px' }}>
              Std Dev:
            </span>
            {!editingChrono ? (
              <span style={{
                fontSize: '13px', fontFamily: 'monospace', fontWeight: 600,
                color: currentLot.standardDeviation == null
                  ? theme.textPrimary
                  : currentLot.standardDeviation <= 10
                    ? theme.green
                    : currentLot.standardDeviation <= 15
                      ? theme.orange
                      : theme.red
              }}>
                {currentLot.standardDeviation != null ? currentLot.standardDeviation + ' fps SD' : '\u2014'}
              </span>
            ) : (
              <>
                <input
                  type="number"
                  value={chronoSdInput}
                  onChange={(e) => setChronoSdInput(e.target.value)}
                  placeholder="fps SD"
                  style={{ ...inputStyle, width: '90px' }}
                />
                <button
                  onClick={handleSaveChrono}
                  style={{
                    padding: '5px 12px', backgroundColor: theme.accent, color: theme.bg, border: 'none',
                    borderRadius: '4px', fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer', fontWeight: 600
                  }}
                >
                  SAVE
                </button>
                <button
                  onClick={() => setEditingChrono(false)}
                  style={{
                    background: 'none', border: 'none', color: theme.textSecondary,
                    fontFamily: 'monospace', fontSize: '12px', cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </>
            )}
          </div>
        </div>

        {/* Task 11: Purchase History section */}
        <div style={{
          padding: '12px', backgroundColor: theme.surfaceAlt, borderRadius: '6px',
          border: `0.5px solid ${theme.border}`, marginBottom: '14px'
        }}>
          <span style={sectionLabel}>PURCHASE HISTORY</span>

          {/* Price trend */}
          {currentLot.purchaseHistory && currentLot.purchaseHistory.length > 1 && (
            <div style={{ fontSize: '11px', color: theme.textSecondary, fontFamily: 'monospace', marginBottom: '8px' }}>
              {currentLot.purchaseHistory.map(e => `${(e.pricePerRound * 100).toFixed(0)}¢`).join(' → ')}
            </div>
          )}

          {/* History entries */}
          {currentLot.purchaseHistory && currentLot.purchaseHistory.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
              {currentLot.purchaseHistory.map((entry, i) => (
                <div key={i} style={{ fontSize: '10px', color: theme.textSecondary, fontFamily: 'monospace' }}>
                  {entry.date} · +{entry.quantity.toLocaleString()} rds · {(entry.pricePerRound * 100).toFixed(0)}¢/rd
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '10px', color: theme.textMuted, fontFamily: 'monospace', marginBottom: '8px' }}>
              No purchase history recorded
            </div>
          )}

          {/* Add purchase */}
          {!showAddPurchase ? (
            <button
              onClick={() => setShowAddPurchase(true)}
              style={{
                padding: '5px 10px', backgroundColor: 'transparent', color: theme.accent,
                border: `0.5px solid ${theme.accent}`, borderRadius: '3px',
                fontFamily: 'monospace', fontSize: '9px', cursor: 'pointer', fontWeight: 600
              }}
            >
              + ADD PURCHASE
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)}
                placeholder="Date" style={{ ...inputStyle, width: '100%' }} />
              <input type="number" value={purchaseQty} onChange={(e) => setPurchaseQty(e.target.value)}
                placeholder="Quantity (rounds)" style={{ ...inputStyle, width: '100%' }} />
              <input type="number" step="0.001" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="Price per round ($0.350)" style={{ ...inputStyle, width: '100%' }} />
              {purchaseError && (
                <div style={{ color: theme.red, fontFamily: 'monospace', fontSize: '9px', padding: '4px 6px', backgroundColor: 'rgba(255,107,107,0.08)', borderRadius: '3px', border: `0.5px solid ${theme.red}` }}>
                  {purchaseError}
                </div>
              )}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={handleSavePurchase} style={{
                  flex: 1, padding: '7px', backgroundColor: theme.accent, color: theme.bg, border: 'none',
                  borderRadius: '4px', fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer', fontWeight: 600
                }}>SAVE</button>
                <button onClick={() => setShowAddPurchase(false)} style={{
                  flex: 1, padding: '7px', backgroundColor: 'transparent', color: theme.textSecondary,
                  border: `0.5px solid ${theme.border}`, borderRadius: '4px',
                  fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer'
                }}>CANCEL</button>
              </div>
            </div>
          )}
        </div>

        {/* AmmoSeek button */}
        <button
          onClick={() => window.open(getAmmoSeekUrl(currentLot), '_blank')}
          style={{
            width: '100%', padding: '11px', backgroundColor: 'transparent', color: theme.accent,
            border: `0.5px solid ${theme.accent}`, borderRadius: '4px', fontFamily: 'monospace',
            fontSize: '10px', letterSpacing: '0.5px', cursor: 'pointer', fontWeight: 600, marginBottom: '10px'
          }}
        >
          CHECK CURRENT PRICES ON AMMOSEEK →
        </button>

        {/* Full Details (collapsible) */}
        <button
          onClick={() => setShowFullDetails(!showFullDetails)}
          style={{
            width: '100%', padding: '8px', backgroundColor: 'transparent', color: theme.textSecondary,
            border: `0.5px solid ${theme.border}`, borderRadius: '4px', fontFamily: 'monospace',
            fontSize: '9px', letterSpacing: '0.8px', cursor: 'pointer', marginBottom: '8px'
          }}
        >
          {showFullDetails ? '▼ HIDE DETAILS' : '▶ FULL DETAILS'}
        </button>

        {showFullDetails && (
          <div style={{
            padding: '12px', backgroundColor: theme.bg, borderRadius: '4px',
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px'
          }}>
            {[
              { label: 'LOT NUMBER', value: currentLot.lotNumber || '—' },
              { label: 'LOCATION', value: currentLot.storageLocation || '—' },
              { label: 'PURCHASE DATE', value: currentLot.purchaseDate || '—' },
              { label: 'QTY PURCHASED', value: currentLot.quantityPurchased?.toLocaleString() || '—' },
              { label: 'HANDLOAD', value: currentLot.isHandload ? 'Yes' : 'No' },
              { label: 'NOTES', value: currentLot.notes || '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: '8px', color: theme.textMuted, fontFamily: 'monospace', letterSpacing: '0.5px', marginBottom: '1px' }}>{label}</div>
                <div style={{ fontSize: '11px', color: theme.textSecondary, fontFamily: 'monospace' }}>{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Done button */}
        <button
          onClick={() => { onUpdate(); }}
          style={{
            width: '100%', marginTop: '12px', padding: '11px', backgroundColor: theme.accent, color: theme.bg,
            border: 'none', borderRadius: '4px', fontFamily: 'monospace', fontSize: '11px',
            letterSpacing: '0.8px', cursor: 'pointer', fontWeight: 600
          }}
        >
          DONE
        </button>
      </div>
    </div>
  );
}
