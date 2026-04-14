/**
 * Unit tests for HomePage derived statistics.
 * Tests the pure calculation logic extracted from HomePage.tsx.
 * These lock in the fixes from April 2026 (top3 was hardcoded, ammo totals broken).
 */
import { describe, it, expect } from 'vitest';
import type { Gun, Session, AmmoLot } from '../types';

// ── Helpers mirroring HomePage.tsx logic ─────────────────────────────────────

function makeGun(overrides: Partial<Gun> = {}): Gun {
  return {
    id: Math.random().toString(36).slice(2),
    make: 'Glock',
    model: 'G19',
    caliber: '9mm',
    type: 'Pistol',
    action: 'Semi-Auto',
    status: 'Active',
    roundCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: Math.random().toString(36).slice(2),
    gunId: 'gun1',
    date: '2026-01-15',
    roundsExpended: 100,
    ...overrides,
  };
}

function makeAmmo(overrides: Partial<AmmoLot> = {}): AmmoLot {
  return {
    id: Math.random().toString(36).slice(2),
    caliber: '9mm',
    brand: 'Federal',
    productLine: 'American Eagle',
    grainWeight: 115,
    bulletType: 'FMJ',
    quantity: 500,
    quantityPurchased: 500,
    purchasePricePerRound: 0.25,
    category: 'Practice',
    isHandload: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ── top3 calculation ──────────────────────────────────────────────────────────

function calcTop3(guns: Gun[]) {
  return [...guns]
    .filter(g => g.status !== 'Sold' && g.status !== 'Transferred' && (g.roundCount ?? 0) > 0)
    .sort((a, b) => (b.roundCount ?? 0) - (a.roundCount ?? 0))
    .slice(0, 3)
    .map(g => ({ gun: g, rounds: g.roundCount ?? 0 }));
}

describe('top3 calculation', () => {
  it('returns empty array when no guns', () => {
    expect(calcTop3([])).toHaveLength(0);
  });

  it('excludes guns with zero round count', () => {
    const guns = [makeGun({ roundCount: 0 }), makeGun({ roundCount: 0 })];
    expect(calcTop3(guns)).toHaveLength(0);
  });

  it('excludes Sold and Transferred guns', () => {
    const guns = [
      makeGun({ roundCount: 500, status: 'Sold' }),
      makeGun({ roundCount: 300, status: 'Transferred' }),
      makeGun({ roundCount: 100, status: 'Active' }),
    ];
    const result = calcTop3(guns);
    expect(result).toHaveLength(1);
    expect(result[0].rounds).toBe(100);
  });

  it('sorts by roundCount descending', () => {
    const guns = [
      makeGun({ model: 'A', roundCount: 200 }),
      makeGun({ model: 'B', roundCount: 500 }),
      makeGun({ model: 'C', roundCount: 100 }),
    ];
    const result = calcTop3(guns);
    expect(result[0].rounds).toBe(500);
    expect(result[1].rounds).toBe(200);
    expect(result[2].rounds).toBe(100);
  });

  it('limits to 3 even with more guns', () => {
    const guns = Array.from({ length: 6 }, (_, i) =>
      makeGun({ model: `Gun${i}`, roundCount: (i + 1) * 100 })
    );
    expect(calcTop3(guns)).toHaveLength(3);
  });

  it('includes fewer than 3 when fewer qualify', () => {
    const guns = [
      makeGun({ roundCount: 150 }),
      makeGun({ roundCount: 0 }),
    ];
    expect(calcTop3(guns)).toHaveLength(1);
  });
});

// ── ammo totalInvested calculation ───────────────────────────────────────────

function calcTotalInvested(ammo: AmmoLot[]): number {
  return ammo.reduce((sum, lot) => {
    const qty = lot.quantityPurchased ?? lot.quantity;
    const price = lot.purchasePricePerRound ?? 0;
    return sum + qty * price;
  }, 0);
}

describe('ammo totalInvested', () => {
  it('returns 0 for empty inventory', () => {
    expect(calcTotalInvested([])).toBe(0);
  });

  it('multiplies quantityPurchased × pricePerRound', () => {
    const lot = makeAmmo({ quantityPurchased: 1000, purchasePricePerRound: 0.30 });
    expect(calcTotalInvested([lot])).toBeCloseTo(300, 2);
  });

  it('falls back to quantity when quantityPurchased is undefined', () => {
    const lot = makeAmmo({ quantity: 500, quantityPurchased: undefined, purchasePricePerRound: 0.25 });
    expect(calcTotalInvested([lot])).toBeCloseTo(125, 2);
  });

  it('treats undefined pricePerRound as 0', () => {
    const lot = makeAmmo({ quantityPurchased: 500, purchasePricePerRound: undefined });
    expect(calcTotalInvested([lot])).toBe(0);
  });

  it('sums multiple lots correctly', () => {
    const lots = [
      makeAmmo({ quantityPurchased: 1000, purchasePricePerRound: 0.25 }),  // $250
      makeAmmo({ quantityPurchased: 500,  purchasePricePerRound: 0.50 }),  // $250
      makeAmmo({ quantityPurchased: 200,  purchasePricePerRound: 1.00 }),  // $200
    ];
    expect(calcTotalInvested(lots)).toBeCloseTo(700, 2);
  });
});

// ── period activity stats ─────────────────────────────────────────────────────

function calcPeriodStats(sessions: Session[], periodDays: number) {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() - periodDays);

  const periodSessions = sessions.filter(s => new Date(s.date) >= cutoff);
  const periodShots = periodSessions.reduce((s, x) => s + x.roundsExpended, 0);
  const avgRounds = periodSessions.length > 0
    ? Math.round(periodShots / periodSessions.length)
    : 0;

  return { periodSessions, periodShots, avgRounds };
}

describe('period activity stats', () => {
  it('counts no sessions when all are outside the period', () => {
    const oldSession = makeSession({ date: '2020-01-01', roundsExpended: 200 });
    const { periodSessions } = calcPeriodStats([oldSession], 30);
    expect(periodSessions).toHaveLength(0);
  });

  it('counts sessions within the period', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const s = makeSession({ date: yesterday.toISOString().slice(0, 10), roundsExpended: 150 });
    const { periodSessions, periodShots } = calcPeriodStats([s], 30);
    expect(periodSessions).toHaveLength(1);
    expect(periodShots).toBe(150);
  });

  it('avgRounds is 0 with no sessions in period', () => {
    const { avgRounds } = calcPeriodStats([], 30);
    expect(avgRounds).toBe(0);
  });

  it('avgRounds rounds to nearest integer', () => {
    const today = new Date().toISOString().slice(0, 10);
    const sessions = [
      makeSession({ date: today, roundsExpended: 100 }),
      makeSession({ date: today, roundsExpended: 101 }),
      makeSession({ date: today, roundsExpended: 102 }),
    ];
    // avg = 303/3 = 101
    const { avgRounds } = calcPeriodStats(sessions, 30);
    expect(avgRounds).toBe(101);
  });
});

// ── gun breakdown counts ──────────────────────────────────────────────────────

function calcGunBreakdown(guns: Gun[]) {
  const active = guns.filter(g => g.status !== 'Sold' && g.status !== 'Transferred');
  return {
    handguns: active.filter(g => g.type === 'Pistol').length,
    rifles:   active.filter(g => g.type === 'Rifle').length,
    shotguns: active.filter(g => g.type === 'Shotgun').length,
    other:    active.filter(g => !['Pistol', 'Rifle', 'Shotgun'].includes(g.type)).length,
  };
}

describe('gun breakdown', () => {
  it('all zeros for empty vault', () => {
    const b = calcGunBreakdown([]);
    expect(b).toEqual({ handguns: 0, rifles: 0, shotguns: 0, other: 0 });
  });

  it('excludes Sold guns from counts', () => {
    const guns = [
      makeGun({ type: 'Pistol', status: 'Active' }),
      makeGun({ type: 'Pistol', status: 'Sold' }),
    ];
    expect(calcGunBreakdown(guns).handguns).toBe(1);
  });

  it('counts each type correctly', () => {
    const guns = [
      makeGun({ type: 'Pistol' }),
      makeGun({ type: 'Pistol' }),
      makeGun({ type: 'Rifle' }),
      makeGun({ type: 'Shotgun' }),
      makeGun({ type: 'NFA' }),
    ];
    const b = calcGunBreakdown(guns);
    expect(b.handguns).toBe(2);
    expect(b.rifles).toBe(1);
    expect(b.shotguns).toBe(1);
    expect(b.other).toBe(1);
  });
});
