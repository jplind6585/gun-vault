/**
 * Unit tests for ballistic math used in Target Analysis.
 * These formulas are duplicated here to lock in correct behavior.
 */
import { describe, it, expect } from 'vitest';

// ── Formulas (mirrors TargetAnalysis.tsx) ────────────────────────────────────

function toMoa(inches: number, yards: number): number {
  return (inches / yards) * 95.5;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function sampleSd(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function extremeSpread(shots: { x: number; y: number }[]): number {
  let max = 0;
  for (let i = 0; i < shots.length; i++) {
    for (let j = i + 1; j < shots.length; j++) {
      const d = Math.hypot(shots[i].x - shots[j].x, shots[i].y - shots[j].y);
      if (d > max) max = d;
    }
  }
  return max;
}

function cep(shots: { x: number; y: number }[]): number {
  if (shots.length === 0) return 0;
  const mx = shots.reduce((s, p) => s + p.x, 0) / shots.length;
  const my = shots.reduce((s, p) => s + p.y, 0) / shots.length;
  const radials = shots.map(p => Math.hypot(p.x - mx, p.y - my));
  return median(radials);
}

// ── MOA conversion tests ─────────────────────────────────────────────────────

describe('toMoa', () => {
  it('1 inch at 100 yards = 0.955 MOA', () => {
    expect(toMoa(1, 100)).toBeCloseTo(0.955, 2);
  });

  it('1 inch at 200 yards = 0.4775 MOA', () => {
    expect(toMoa(1, 200)).toBeCloseTo(0.4775, 3);
  });

  it('scales linearly with distance', () => {
    expect(toMoa(2, 100)).toBeCloseTo(toMoa(1, 100) * 2, 5);
  });

  it('zero spread = 0 MOA', () => {
    expect(toMoa(0, 100)).toBe(0);
  });
});

// ── median tests ─────────────────────────────────────────────────────────────

describe('median', () => {
  it('odd count', () => {
    expect(median([3, 1, 2])).toBe(2);
  });

  it('even count averages middle two', () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it('single value', () => {
    expect(median([7])).toBe(7);
  });
});

// ── sample standard deviation tests ─────────────────────────────────────────

describe('sampleSd', () => {
  it('identical values = 0', () => {
    expect(sampleSd([5, 5, 5])).toBe(0);
  });

  it('known dataset', () => {
    // [2, 4, 4, 4, 5, 5, 7, 9]: population SD = 2, sample SD ≈ 2.138
    expect(sampleSd([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.138, 2);
  });

  it('two values', () => {
    expect(sampleSd([0, 10])).toBeCloseTo(7.071, 2);
  });

  it('single value returns 0', () => {
    expect(sampleSd([5])).toBe(0);
  });
});

// ── extreme spread tests ─────────────────────────────────────────────────────

describe('extremeSpread', () => {
  it('two shots in a line', () => {
    expect(extremeSpread([{ x: 0, y: 0 }, { x: 3, y: 4 }])).toBeCloseTo(5, 5);
  });

  it('picks max pairwise distance from 3 shots', () => {
    const shots = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 10, y: 0 }];
    expect(extremeSpread(shots)).toBe(10);
  });

  it('single shot = 0', () => {
    expect(extremeSpread([{ x: 5, y: 5 }])).toBe(0);
  });

  it('zero spread cluster', () => {
    const shots = [{ x: 2, y: 2 }, { x: 2, y: 2 }, { x: 2, y: 2 }];
    expect(extremeSpread(shots)).toBe(0);
  });
});

// ── CEP tests ────────────────────────────────────────────────────────────────

describe('cep', () => {
  it('single shot = 0 (on its own centroid)', () => {
    expect(cep([{ x: 3, y: 4 }])).toBe(0);
  });

  it('two equidistant shots: CEP = distance to centroid', () => {
    // Centroid at (1, 0), each shot 1 unit away
    const result = cep([{ x: 0, y: 0 }, { x: 2, y: 0 }]);
    expect(result).toBeCloseTo(1, 5);
  });

  it('4 shots in square: CEP = distance from center to corner', () => {
    // Corners of a 2×2 square centered at origin
    const shots = [
      { x: 1, y: 1 }, { x: -1, y: 1 },
      { x: -1, y: -1 }, { x: 1, y: -1 },
    ];
    // Each radial = sqrt(2) ≈ 1.414, median of 4 identical values = 1.414
    expect(cep(shots)).toBeCloseTo(Math.sqrt(2), 4);
  });

  it('empty = 0', () => {
    expect(cep([])).toBe(0);
  });
});
