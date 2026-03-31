// LocalStorage-based data persistence (will switch to SQLite when we go mobile)
import type { Gun, Session, AmmoLot, Cartridge } from './types';
import { seedGuns } from './seedData';
import { seedSessions } from './seedSessions';
import { seedAmmo } from './seedAmmo';
import { seedCartridges } from './seedCartridges';
import { enrichGunWithMarketValue } from './marketValues';

const GUNS_KEY = 'gunvault_guns';
const SESSIONS_KEY = 'gunvault_sessions';
const AMMO_KEY = 'gunvault_ammo';
const CARTRIDGES_KEY = 'gunvault_cartridges';
const INITIALIZED_KEY = 'gunvault_initialized';
const VERSION_KEY = 'gunvault_version';
const CURRENT_VERSION = '1.4'; // Increment this when seed data changes

// ============================================================================
// INITIALIZATION
// ============================================================================

function initializeSeedData(): void {
  const currentVersion = localStorage.getItem(VERSION_KEY);
  const initialized = localStorage.getItem(INITIALIZED_KEY);

  // Auto-clear and reinitialize if version changed
  if (initialized && currentVersion !== CURRENT_VERSION) {
    console.log(`🔄 Version changed (${currentVersion} → ${CURRENT_VERSION}), reloading data...`);
    localStorage.clear();
  }

  if (localStorage.getItem(INITIALIZED_KEY)) return;

  console.log('🔫 Initializing Gun Vault with 65 firearms from spreadsheet...');

  const now = new Date().toISOString();
  const gunsWithIds: Gun[] = seedGuns.map(gun => {
    const gunWithId = {
      ...gun,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      roundCount: 0,
    };
    // Enrich with market values
    return enrichGunWithMarketValue(gunWithId);
  });

  localStorage.setItem(GUNS_KEY, JSON.stringify(gunsWithIds));
  console.log('💰 Calculated market values for all firearms');

  // Initialize sessions and match to guns
  console.log('📊 Loading shooting sessions from spreadsheet...');

  // Create gun name lookup (match by model name from spreadsheet)
  const gunLookup = new Map<string, string>();
  gunsWithIds.forEach(gun => {
    // Store multiple variations to increase match likelihood
    const fullName = `${gun.make} ${gun.model}`;
    gunLookup.set(gun.model.toString(), gun.id); // Just model
    gunLookup.set(fullName, gun.id); // Make + Model
    gunLookup.set(fullName.toLowerCase(), gun.id); // Lowercase version
  });

  const sessionsWithIds: Session[] = seedSessions
    .map((session: any) => {
      // Try to find matching gun
      let gunId = gunLookup.get(session.gunName);
      if (!gunId) {
        // Try lowercase
        gunId = gunLookup.get(session.gunName.toLowerCase());
      }
      if (!gunId) {
        // Try partial match on model name
        for (const [name, id] of gunLookup.entries()) {
          if (name.toLowerCase().includes(session.gunName.toLowerCase()) ||
              session.gunName.toLowerCase().includes(name.toLowerCase())) {
            gunId = id;
            break;
          }
        }
      }

      if (!gunId) {
        console.warn(`⚠️  Could not match session to gun: ${session.gunName}`);
        return null;
      }

      const { gunName, ...sessionData } = session;
      return {
        ...sessionData,
        id: generateId(),
        gunId,
        createdAt: now,
      };
    })
    .filter(Boolean) as Session[];

  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessionsWithIds));

  // Initialize ammo
  console.log('📦 Loading ammo inventory from spreadsheet...');
  const ammoWithIds: AmmoLot[] = seedAmmo.map(ammo => ({
    ...ammo,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }));

  localStorage.setItem(AMMO_KEY, JSON.stringify(ammoWithIds));

  // Initialize cartridge encyclopedia
  console.log('📚 Loading cartridge encyclopedia...');
  const cartridgesWithIds: Cartridge[] = seedCartridges.map(cart => ({
    ...cart,
    id: generateId(),
    ownGunForThis: false,
    ownAmmoForThis: false,
    onWishlist: false,
    createdAt: now,
    updatedAt: now,
  }));

  // Mark cartridges user has guns/ammo for
  const userCalibers = new Set(gunsWithIds.map(g => g.caliber));
  const userAmmoCalibers = new Set(ammoWithIds.map(a => a.caliber));
  cartridgesWithIds.forEach(cart => {
    if (userCalibers.has(cart.name) || cart.alternateNames?.some(n => userCalibers.has(n))) {
      cart.ownGunForThis = true;
    }
    if (userAmmoCalibers.has(cart.name) || cart.alternateNames?.some(n => userAmmoCalibers.has(n))) {
      cart.ownAmmoForThis = true;
    }
  });

  localStorage.setItem(CARTRIDGES_KEY, JSON.stringify(cartridgesWithIds));
  localStorage.setItem(INITIALIZED_KEY, 'true');
  localStorage.setItem(VERSION_KEY, CURRENT_VERSION);

  const totalRounds = ammoWithIds.reduce((sum, lot) => sum + lot.quantity, 0);
  console.log(`✅ Loaded ${gunsWithIds.length} guns, ${sessionsWithIds.length} sessions, ${ammoWithIds.length} ammo lots (${totalRounds.toLocaleString()} rounds), and ${cartridgesWithIds.length} cartridges into vault`);
}

// ============================================================================
// GUN OPERATIONS
// ============================================================================

export function getAllGuns(): Gun[] {
  // Initialize with seed data on first run
  initializeSeedData();

  const data = localStorage.getItem(GUNS_KEY);
  if (!data) return [];

  let guns = JSON.parse(data) as Gun[];
  const sessions = getAllSessions();
  let needsPersist = false;

  // Calculate round counts and enrich with market values
  const enrichedGuns = guns.map(gun => {
    const withRounds = {
      ...gun,
      roundCount: sessions
        .filter(s => s.gunId === gun.id)
        .reduce((sum, s) => sum + s.roundsExpended, 0)
    };

    // Enrich with market values if missing
    if (!gun.estimatedFMV || !gun.insuranceValue) {
      const enriched = enrichGunWithMarketValue(withRounds);
      needsPersist = true;
      return enriched;
    }

    return withRounds;
  });

  // Persist enriched values back to storage
  if (needsPersist) {
    localStorage.setItem(GUNS_KEY, JSON.stringify(enrichedGuns));
  }

  return enrichedGuns;
}

export function getGunById(id: string): Gun | null {
  const guns = getAllGuns();
  return guns.find(g => g.id === id) || null;
}

export function addGun(gun: Omit<Gun, 'id' | 'createdAt' | 'updatedAt'>): string {
  const guns = getAllGuns();
  const id = generateId();
  const now = new Date().toISOString();

  const newGun: Gun = {
    ...gun,
    id,
    status: gun.status || 'Active',
    createdAt: now,
    updatedAt: now,
  };

  guns.push(newGun);
  localStorage.setItem(GUNS_KEY, JSON.stringify(guns));

  return id;
}

export function updateGun(id: string, updates: Partial<Gun>): void {
  const guns = getAllGuns();
  const index = guns.findIndex(g => g.id === id);

  if (index === -1) return;

  guns[index] = {
    ...guns[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(GUNS_KEY, JSON.stringify(guns));
}

export function decommissionGun(id: string): void {
  updateGun(id, { status: 'Sold' });
}

// ============================================================================
// SESSION OPERATIONS
// ============================================================================

export function getAllSessions(): Session[] {
  const data = localStorage.getItem(SESSIONS_KEY);
  return data ? JSON.parse(data) : [];
}

export function getSessionsForGun(gunId: string): Session[] {
  return getAllSessions()
    .filter(s => s.gunId === gunId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function logSession(session: Omit<Session, 'id' | 'createdAt'>): string {
  const sessions = getAllSessions();
  const id = generateId();

  const newSession: Session = {
    ...session,
    id,
    createdAt: new Date().toISOString(),
  };

  sessions.push(newSession);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));

  return id;
}

export function updateSession(id: string, updates: Partial<Session>): void {
  const sessions = getAllSessions();
  const index = sessions.findIndex(s => s.id === id);
  if (index === -1) return;
  sessions[index] = { ...sessions[index], ...updates };
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function deleteSession(id: string): void {
  const sessions = getAllSessions().filter(s => s.id !== id);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function getRecentLocations(): string[] {
  const sessions = getAllSessions();
  const seen = new Set<string>();
  const result: string[] = [];
  // Most recent first, deduplicated
  for (const s of [...sessions].sort((a, b) => b.date.localeCompare(a.date))) {
    if (s.location && !seen.has(s.location)) {
      seen.add(s.location);
      result.push(s.location);
      if (result.length >= 5) break;
    }
  }
  return result;
}

// ============================================================================
// AMMO OPERATIONS
// ============================================================================

export function getAllAmmo(): AmmoLot[] {
  initializeSeedData();
  const data = localStorage.getItem(AMMO_KEY);
  return data ? JSON.parse(data) : [];
}

export function getAmmoById(id: string): AmmoLot | null {
  const ammo = getAllAmmo();
  return ammo.find(a => a.id === id) || null;
}

export function getAmmoByCaliber(caliber: string): AmmoLot[] {
  return getAllAmmo().filter(a => a.caliber === caliber);
}

export function addAmmo(ammo: Omit<AmmoLot, 'id' | 'createdAt' | 'updatedAt'>): string {
  const allAmmo = getAllAmmo();
  const id = generateId();
  const now = new Date().toISOString();

  const newAmmo: AmmoLot = {
    ...ammo,
    id,
    createdAt: now,
    updatedAt: now,
  };

  allAmmo.push(newAmmo);
  localStorage.setItem(AMMO_KEY, JSON.stringify(allAmmo));

  return id;
}

export function updateAmmo(id: string, updates: Partial<AmmoLot>): void {
  const allAmmo = getAllAmmo();
  const index = allAmmo.findIndex(a => a.id === id);

  if (index === -1) return;

  allAmmo[index] = {
    ...allAmmo[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(AMMO_KEY, JSON.stringify(allAmmo));
}

export function deleteAmmo(id: string): void {
  const allAmmo = getAllAmmo();
  const filtered = allAmmo.filter(a => a.id !== id);
  localStorage.setItem(AMMO_KEY, JSON.stringify(filtered));
}

export function getAmmoSummaryByCaliber(): Map<string, { totalRounds: number; lots: number }> {
  const allAmmo = getAllAmmo();
  const summary = new Map();

  allAmmo.forEach(lot => {
    const existing = summary.get(lot.caliber) || { totalRounds: 0, lots: 0 };
    summary.set(lot.caliber, {
      totalRounds: existing.totalRounds + lot.quantity,
      lots: existing.lots + 1
    });
  });

  return summary;
}

// ============================================================================
// CARTRIDGE OPERATIONS
// ============================================================================

export function getAllCartridges(): Cartridge[] {
  initializeSeedData();
  const data = localStorage.getItem(CARTRIDGES_KEY);
  return data ? JSON.parse(data) : [];
}

export function getCartridgeById(id: string): Cartridge | null {
  const cartridges = getAllCartridges();
  return cartridges.find(c => c.id === id) || null;
}

export function getCartridgeByName(name: string): Cartridge | null {
  const cartridges = getAllCartridges();
  return cartridges.find(c =>
    c.name === name || c.alternateNames?.includes(name)
  ) || null;
}

export function addCartridge(cartridge: Omit<Cartridge, 'id' | 'createdAt' | 'updatedAt'>): string {
  const cartridges = getAllCartridges();
  const id = generateId();
  const now = new Date().toISOString();

  const newCartridge: Cartridge = {
    ...cartridge,
    id,
    createdAt: now,
    updatedAt: now,
  };

  cartridges.push(newCartridge);
  localStorage.setItem(CARTRIDGES_KEY, JSON.stringify(cartridges));

  return id;
}

export function updateCartridge(id: string, updates: Partial<Cartridge>): void {
  const cartridges = getAllCartridges();
  const index = cartridges.findIndex(c => c.id === id);

  if (index === -1) return;

  cartridges[index] = {
    ...cartridges[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(CARTRIDGES_KEY, JSON.stringify(cartridges));
}

export function deleteCartridge(id: string): void {
  const cartridges = getAllCartridges();
  const filtered = cartridges.filter(c => c.id !== id);
  localStorage.setItem(CARTRIDGES_KEY, JSON.stringify(filtered));
}

// Build parent-child relationships for family tree
export function getCartridgeFamilyTree(): Map<string, string[]> {
  const cartridges = getAllCartridges();
  const tree = new Map<string, string[]>();

  cartridges.forEach(cart => {
    if (cart.parentCase) {
      const parent = cartridges.find(c => c.name === cart.parentCase);
      if (parent) {
        const children = tree.get(parent.id) || [];
        children.push(cart.id);
        tree.set(parent.id, children);
      }
    }
  });

  return tree;
}

// ============================================================================
// UTILITIES
// ============================================================================

export function resetAllData(): void {
  localStorage.clear();
  console.log('🗑️  All data cleared. Refresh to reload seed data.');
  window.location.reload();
}

// ============================================================================
// HELPERS
// ============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
