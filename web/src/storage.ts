// LocalStorage-based data persistence (will switch to SQLite when we go mobile)
import type { Gun, Session, AmmoLot, Cartridge, TargetAnalysisRecord, Optic, Mount, OpticAssignment, OpticZero } from './types';
// Seed imports are now dynamic — loaded only on first launch, never after.

const GUNS_KEY = 'gunvault_guns';
const SESSIONS_KEY = 'gunvault_sessions';
const AMMO_KEY = 'gunvault_ammo';
const CARTRIDGES_KEY = 'gunvault_cartridges';
const ANALYSES_KEY = 'gunvault_target_analyses';
const INITIALIZED_KEY = 'gunvault_initialized';
const VERSION_KEY = 'gunvault_version';
const CURRENT_VERSION = '1.9'; // Increment this when seed data changes

// ============================================================================
// INITIALIZATION
// ============================================================================

let _initPromise: Promise<void> | null = null;

/** Call once before rendering. Subsequent calls return the cached promise. */
export function ensureInitialized(): Promise<void> {
  if (_initPromise) return _initPromise;
  _initPromise = initializeSeedData();
  return _initPromise;
}

async function initializeSeedData(): Promise<void> {
  const currentVersion = localStorage.getItem(VERSION_KEY);
  const initialized = localStorage.getItem(INITIALIZED_KEY);

  // Auto-clear and reinitialize if version changed
  if (initialized && currentVersion !== CURRENT_VERSION) {
    console.log('🔄 Version changed (' + currentVersion + ' → ' + CURRENT_VERSION + '), reloading data...');
    localStorage.clear();
  }

  if (localStorage.getItem(INITIALIZED_KEY)) return;

  console.log('🔫 Initializing Lindcott Armory with 65 firearms from spreadsheet...');

  // Dynamic imports — only executed on first launch, never bundled into main chunk
  const [
    { seedGuns },
    { seedSessions },
    { seedAmmo },
    { seedCartridges },
    { enrichGunWithMarketValue },
  ] = await Promise.all([
    import('./seedData'),
    import('./seedSessions'),
    import('./seedAmmo'),
    import('./seedCartridges'),
    import('./marketValues'),
  ]);

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
    const fullName = gun.make + ' ' + gun.model;
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
        console.warn('⚠️  Could not match session to gun: ' + session.gunName);
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
  console.log('✅ Loaded ' + gunsWithIds.length + ' guns, ' + sessionsWithIds.length + ' sessions, ' + ammoWithIds.length + ' ammo lots (' + totalRounds.toLocaleString() + ' rounds), and ' + cartridgesWithIds.length + ' cartridges into vault');
}

// ============================================================================
// GUN OPERATIONS
// ============================================================================

export function getAllGuns(): Gun[] {
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
// TARGET ANALYSIS OPERATIONS
// ============================================================================

export function getTargetAnalyses(): TargetAnalysisRecord[] {
  const data = localStorage.getItem(ANALYSES_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveTargetAnalysis(record: Omit<TargetAnalysisRecord, 'id' | 'createdAt'>): string {
  const analyses = getTargetAnalyses();
  const id = generateId();
  const newRecord: TargetAnalysisRecord = { ...record, id, createdAt: new Date().toISOString() };
  analyses.unshift(newRecord);
  localStorage.setItem(ANALYSES_KEY, JSON.stringify(analyses));
  return id;
}

export function deleteTargetAnalysis(id: string): void {
  localStorage.setItem(ANALYSES_KEY, JSON.stringify(getTargetAnalyses().filter(a => a.id !== id)));
}

export function getAnalysesForGun(gunId: string): TargetAnalysisRecord[] {
  return getTargetAnalyses().filter(a => a.gunId === gunId);
}

export function getAnalysesForSession(sessionId: string): TargetAnalysisRecord[] {
  return getTargetAnalyses().filter(a => a.sessionId === sessionId);
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
// BACKUP / RESTORE
// ============================================================================

const BACKUP_KEYS = [
  'gunvault_guns',
  'gunvault_sessions',
  'gunvault_ammo',
  'gunvault_cartridges',
  'gunvault_target_analyses',
  'gunvault_load_recipes',
  'gunvault_reloading_components',
  'gunvault_load_development',
  'gunvault_gear_locker',
  'gunvault_wishlist',
  'gunvault_optics',
  'gunvault_mounts',
  'gunvault_optic_assignments',
  'gunvault_optic_zeros',
  'lindcott_settings',
] as const;

export interface VaultBackup {
  version: string;
  exportedAt: string;
  appName: 'Lindcott Armory';
  data: Partial<Record<string, string>>;
}

export function exportVaultBackup(): void {
  const data: Record<string, string> = {};
  for (const key of BACKUP_KEYS) {
    const val = localStorage.getItem(key);
    if (val) data[key] = val;
  }

  const backup: VaultBackup = {
    version: localStorage.getItem('gunvault_version') || CURRENT_VERSION,
    exportedAt: new Date().toISOString(),
    appName: 'Lindcott Armory',
    data,
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `lindcott-armory-backup-${dateStr}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================================
// OPTICS OPERATIONS
// ============================================================================

const OPTICS_KEY        = 'gunvault_optics';
const MOUNTS_KEY        = 'gunvault_mounts';
const ASSIGNMENTS_KEY   = 'gunvault_optic_assignments';
const ZEROS_KEY         = 'gunvault_optic_zeros';

export function getAllOptics(): Optic[] {
  const d = localStorage.getItem(OPTICS_KEY);
  return d ? JSON.parse(d) : [];
}
export function getOpticById(id: string): Optic | null {
  return getAllOptics().find(o => o.id === id) || null;
}
export function addOptic(o: Omit<Optic, 'id' | 'createdAt' | 'updatedAt'>): string {
  const optics = getAllOptics();
  const id = generateId();
  const now = new Date().toISOString();
  optics.push({ ...o, id, createdAt: now, updatedAt: now });
  localStorage.setItem(OPTICS_KEY, JSON.stringify(optics));
  return id;
}
export function updateOptic(id: string, updates: Partial<Optic>): void {
  const optics = getAllOptics();
  const i = optics.findIndex(o => o.id === id);
  if (i === -1) return;
  optics[i] = { ...optics[i], ...updates, updatedAt: new Date().toISOString() };
  localStorage.setItem(OPTICS_KEY, JSON.stringify(optics));
}
export function deleteOptic(id: string): void {
  localStorage.setItem(OPTICS_KEY, JSON.stringify(getAllOptics().filter(o => o.id !== id)));
}

export function getMountsForOptic(opticId: string): Mount[] {
  const d = localStorage.getItem(MOUNTS_KEY);
  const all: Mount[] = d ? JSON.parse(d) : [];
  return all.filter(m => m.opticId === opticId);
}
export function getMountById(id: string): Mount | null {
  const d = localStorage.getItem(MOUNTS_KEY);
  const all: Mount[] = d ? JSON.parse(d) : [];
  return all.find(m => m.id === id) || null;
}
export function addMount(m: Omit<Mount, 'id' | 'createdAt' | 'updatedAt'>): string {
  const d = localStorage.getItem(MOUNTS_KEY);
  const all: Mount[] = d ? JSON.parse(d) : [];
  const id = generateId();
  const now = new Date().toISOString();
  all.push({ ...m, id, createdAt: now, updatedAt: now });
  localStorage.setItem(MOUNTS_KEY, JSON.stringify(all));
  return id;
}
export function updateMount(id: string, updates: Partial<Mount>): void {
  const d = localStorage.getItem(MOUNTS_KEY);
  const all: Mount[] = d ? JSON.parse(d) : [];
  const i = all.findIndex(m => m.id === id);
  if (i === -1) return;
  all[i] = { ...all[i], ...updates, updatedAt: new Date().toISOString() };
  localStorage.setItem(MOUNTS_KEY, JSON.stringify(all));
}
export function deleteMount(id: string): void {
  const d = localStorage.getItem(MOUNTS_KEY);
  const all: Mount[] = d ? JSON.parse(d) : [];
  localStorage.setItem(MOUNTS_KEY, JSON.stringify(all.filter(m => m.id !== id)));
}

export function getAllAssignments(): OpticAssignment[] {
  const d = localStorage.getItem(ASSIGNMENTS_KEY);
  return d ? JSON.parse(d) : [];
}
export function getAssignmentsForOptic(opticId: string): OpticAssignment[] {
  return getAllAssignments().filter(a => a.opticId === opticId);
}
export function getActiveAssignmentForOptic(opticId: string): OpticAssignment | null {
  return getAllAssignments().find(a => a.opticId === opticId && !a.removedDate) || null;
}
export function getActiveAssignmentForGun(gunId: string): OpticAssignment | null {
  return getAllAssignments().find(a => a.gunId === gunId && !a.removedDate) || null;
}
export function addAssignment(a: Omit<OpticAssignment, 'id'>): string {
  const all = getAllAssignments();
  const id = generateId();
  all.push({ ...a, id });
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(all));
  return id;
}
export function updateAssignment(id: string, updates: Partial<OpticAssignment>): void {
  const all = getAllAssignments();
  const i = all.findIndex(a => a.id === id);
  if (i === -1) return;
  all[i] = { ...all[i], ...updates };
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(all));
}

/** Remove an optic from a gun. Marks prior zeros unverified by flagging isActive=false. */
export function removeOpticFromGun(assignmentId: string, reason?: string): void {
  updateAssignment(assignmentId, { removedDate: new Date().toISOString().slice(0, 10), removalReason: reason });
  // Mark all zeros for this assignment as inactive
  const zeros = getAllZeros().map(z =>
    z.assignmentId === assignmentId ? { ...z, isActive: false } : z
  );
  localStorage.setItem(ZEROS_KEY, JSON.stringify(zeros));
}

/** Mount an optic on a gun. Removes from prior gun if needed. */
export function mountOpticOnGun(opticId: string, gunId: string, mountId?: string, reason?: string): string {
  // Close any existing active assignment for this optic
  const existing = getActiveAssignmentForOptic(opticId);
  if (existing) removeOpticFromGun(existing.id, reason || 'Reassigned');
  // Close any existing optic on this gun
  const gunExisting = getActiveAssignmentForGun(gunId);
  if (gunExisting) removeOpticFromGun(gunExisting.id, 'Replaced');
  return addAssignment({
    opticId,
    gunId,
    mountId,
    assignedDate: new Date().toISOString().slice(0, 10),
  });
}

export function getAllZeros(): OpticZero[] {
  const d = localStorage.getItem(ZEROS_KEY);
  return d ? JSON.parse(d) : [];
}
export function getZerosForAssignment(assignmentId: string): OpticZero[] {
  return getAllZeros().filter(z => z.assignmentId === assignmentId).sort((a, b) => b.date.localeCompare(a.date));
}
export function getActiveZeroForAssignment(assignmentId: string): OpticZero | null {
  return getAllZeros().find(z => z.assignmentId === assignmentId && z.isActive) || null;
}
export function addZero(z: Omit<OpticZero, 'id' | 'createdAt'>): string {
  const all = getAllZeros();
  const id = generateId();
  const now = new Date().toISOString();
  // Deactivate previous active zero for this assignment
  const updated = all.map(x =>
    x.assignmentId === z.assignmentId && x.isActive ? { ...x, isActive: false } : x
  );
  updated.push({ ...z, id, createdAt: now });
  localStorage.setItem(ZEROS_KEY, JSON.stringify(updated));
  return id;
}
export function updateZero(id: string, updates: Partial<OpticZero>): void {
  const all = getAllZeros();
  const i = all.findIndex(z => z.id === id);
  if (i === -1) return;
  all[i] = { ...all[i], ...updates };
  localStorage.setItem(ZEROS_KEY, JSON.stringify(all));
}
export function deleteZero(id: string): void {
  localStorage.setItem(ZEROS_KEY, JSON.stringify(getAllZeros().filter(z => z.id !== id)));
}

export function importVaultBackup(file: File): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = e.target?.result as string;
        const backup = JSON.parse(raw) as VaultBackup;

        if (backup.appName !== 'Lindcott Armory' || !backup.data) {
          resolve({ success: false, message: 'Invalid backup file.' });
          return;
        }

        // Restore each key
        for (const [key, val] of Object.entries(backup.data)) {
          if (val) localStorage.setItem(key, val);
        }
        // Force re-init check on next load
        localStorage.setItem('gunvault_version', backup.version);
        resolve({ success: true, message: 'Vault restored. Reloading...' });
        setTimeout(() => window.location.reload(), 800);
      } catch {
        resolve({ success: false, message: 'Could not parse backup file.' });
      }
    };
    reader.onerror = () => resolve({ success: false, message: 'Failed to read file.' });
    reader.readAsText(file);
  });
}

// ============================================================================
// HELPERS
// ============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
