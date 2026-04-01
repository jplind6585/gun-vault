/**
 * Unit tests for the storage layer.
 * All seed imports are mocked to empty arrays so each test starts clean.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock seed data and enrichment before importing storage
vi.mock('../seedData',       () => ({ seedGuns:       [] }));
vi.mock('../seedSessions',   () => ({ seedSessions:   [] }));
vi.mock('../seedAmmo',       () => ({ seedAmmo:       [] }));
vi.mock('../seedCartridges', () => ({ seedCartridges: [] }));
vi.mock('../marketValues',   () => ({ enrichGunWithMarketValue: (g: unknown) => g }));

import {
  getAllGuns, addGun, updateGun, getGunById,
  getAllSessions, logSession, deleteSession, getSessionsForGun, getRecentLocations,
  getAllAmmo, addAmmo, updateAmmo, deleteAmmo,
} from '../storage';
import type { Gun } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function minGun(overrides: Partial<Omit<Gun, 'id' | 'createdAt' | 'updatedAt'>> = {}): Omit<Gun, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    make: 'Glock',
    model: 'G19',
    caliber: '9mm',
    action: 'Semi-Auto',
    type: 'Pistol',
    status: 'Active',
    ...overrides,
  };
}

// ── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear();
});

// ── Gun CRUD ─────────────────────────────────────────────────────────────────

describe('Gun CRUD', () => {
  it('starts empty after clear', () => {
    expect(getAllGuns()).toHaveLength(0);
  });

  it('addGun returns an id and persists the gun', () => {
    const id = addGun(minGun());
    expect(typeof id).toBe('string');
    const guns = getAllGuns();
    expect(guns).toHaveLength(1);
    expect(guns[0].make).toBe('Glock');
    expect(guns[0].id).toBe(id);
  });

  it('getGunById returns correct gun', () => {
    const id = addGun(minGun({ model: 'G17' }));
    const gun = getGunById(id);
    expect(gun?.model).toBe('G17');
  });

  it('getGunById returns null for unknown id', () => {
    expect(getGunById('nonexistent-id')).toBeNull();
  });

  it('updateGun changes persisted fields', () => {
    const id = addGun(minGun());
    updateGun(id, { status: 'Stored', notes: 'In safe' });
    const gun = getGunById(id);
    expect(gun?.status).toBe('Stored');
    expect(gun?.notes).toBe('In safe');
  });

  it('updateGun on unknown id does nothing (no throw)', () => {
    expect(() => updateGun('bad-id', { status: 'Stored' })).not.toThrow();
  });

  it('multiple guns coexist', () => {
    addGun(minGun({ model: 'G19' }));
    addGun(minGun({ model: 'G17', caliber: '9mm' }));
    addGun(minGun({ make: 'Sig Sauer', model: 'P320', caliber: '9mm', type: 'Pistol' }));
    expect(getAllGuns()).toHaveLength(3);
  });
});

// ── Session CRUD ─────────────────────────────────────────────────────────────

describe('Session CRUD', () => {
  it('starts empty', () => {
    expect(getAllSessions()).toHaveLength(0);
  });

  it('logSession persists a session', () => {
    const gunId = addGun(minGun());
    const id = logSession({ gunId, date: '2025-01-15', roundsExpended: 100 });
    const sessions = getAllSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toBe(id);
    expect(sessions[0].roundsExpended).toBe(100);
  });

  it('deleteSession removes it', () => {
    const gunId = addGun(minGun());
    const id = logSession({ gunId, date: '2025-01-15', roundsExpended: 50 });
    deleteSession(id);
    expect(getAllSessions()).toHaveLength(0);
  });

  it('getSessionsForGun filters correctly', () => {
    const g1 = addGun(minGun({ model: 'G19' }));
    const g2 = addGun(minGun({ model: 'G17' }));
    logSession({ gunId: g1, date: '2025-01-01', roundsExpended: 50 });
    logSession({ gunId: g1, date: '2025-01-02', roundsExpended: 100 });
    logSession({ gunId: g2, date: '2025-01-03', roundsExpended: 75 });
    const g1Sessions = getSessionsForGun(g1);
    expect(g1Sessions).toHaveLength(2);
    expect(g1Sessions.every(s => s.gunId === g1)).toBe(true);
  });

  it('getSessionsForGun returns newest first', () => {
    const gunId = addGun(minGun());
    logSession({ gunId, date: '2025-01-01', roundsExpended: 10 });
    logSession({ gunId, date: '2025-03-01', roundsExpended: 20 });
    const sessions = getSessionsForGun(gunId);
    expect(sessions[0].date).toBe('2025-03-01');
  });

  it('getRecentLocations deduplicates and limits to 5', () => {
    const gunId = addGun(minGun());
    const locations = ['Range A', 'Range B', 'Range A', 'Range C', 'Range D', 'Range E', 'Range F'];
    locations.forEach((location, i) => {
      logSession({ gunId, date: `2025-01-${String(i + 1).padStart(2, '0')}`, roundsExpended: 10, location });
    });
    const recent = getRecentLocations();
    expect(recent.length).toBeLessThanOrEqual(5);
    const unique = new Set(recent);
    expect(unique.size).toBe(recent.length); // no duplicates
  });
});

// ── Ammo CRUD ────────────────────────────────────────────────────────────────

describe('Ammo CRUD', () => {
  const minAmmo = () => ({
    caliber: '9mm',
    brand: 'Federal',
    productLine: 'American Eagle',
    grainWeight: 115,
    bulletType: 'FMJ',
    quantity: 500,
    category: 'Practice' as const,
    isHandload: false,
  });

  it('addAmmo persists and getAllAmmo returns it', () => {
    addAmmo(minAmmo());
    const lots = getAllAmmo();
    expect(lots).toHaveLength(1);
    expect(lots[0].brand).toBe('Federal');
    expect(lots[0].quantity).toBe(500);
  });

  it('updateAmmo changes quantity', () => {
    const id = addAmmo(minAmmo());
    updateAmmo(id, { quantity: 250 });
    const lot = getAllAmmo().find(a => a.id === id);
    expect(lot?.quantity).toBe(250);
  });

  it('deleteAmmo removes it', () => {
    const id = addAmmo(minAmmo());
    deleteAmmo(id);
    expect(getAllAmmo()).toHaveLength(0);
  });

  it('multiple calibers coexist', () => {
    addAmmo(minAmmo());
    addAmmo({ ...minAmmo(), caliber: '.308 Win', grainWeight: 168 });
    addAmmo({ ...minAmmo(), caliber: '5.56mm', grainWeight: 55 });
    expect(getAllAmmo()).toHaveLength(3);
  });
});
