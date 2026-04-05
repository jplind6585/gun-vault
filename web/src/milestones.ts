// Milestones — definitions and detection logic
// Milestones are awarded automatically from vault data.
// They are stored in ShooterProfile.milestones.

import type { Gun, Session, AmmoLot } from './types';
import type { ShooterMilestone } from './shooterProfile';

// ── Definition types ──────────────────────────────────────────────────────────

interface MilestoneDefinition {
  id: string;
  label: string;
  description: string;
  detect: (
    guns: Gun[],
    sessions: Session[],
    ammoLots: AmmoLot[],
  ) => { earned: boolean; gunId?: string };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function totalRounds(sessions: Session[]): number {
  return sessions.reduce((s, x) => s + x.roundsExpended, 0);
}

function activeGuns(guns: Gun[]): Gun[] {
  return guns.filter(g => g.status !== 'Sold' && g.status !== 'Transferred');
}

function uniqueCalibers(guns: Gun[]): Set<string> {
  return new Set(activeGuns(guns).map(g => g.caliber));
}

// Returns true if user had 3+ sessions in the same calendar month, for 3 consecutive months
function hasStreakMonths(sessions: Session[]): boolean {
  const byMonth = new Map<string, number>();
  sessions.forEach(s => {
    const mo = s.date.slice(0, 7);
    byMonth.set(mo, (byMonth.get(mo) ?? 0) + 1);
  });
  const months = [...byMonth.entries()]
    .filter(([, count]) => count >= 3)
    .map(([mo]) => mo)
    .sort();
  if (months.length < 3) return false;
  for (let i = 0; i <= months.length - 3; i++) {
    const [y0, m0] = months[i].split('-').map(Number);
    const [y1, m1] = months[i + 1].split('-').map(Number);
    const [y2, m2] = months[i + 2].split('-').map(Number);
    const abs0 = y0 * 12 + m0;
    const abs1 = y1 * 12 + m1;
    const abs2 = y2 * 12 + m2;
    if (abs1 === abs0 + 1 && abs2 === abs1 + 1) return true;
  }
  return false;
}

// ── Milestone definitions ─────────────────────────────────────────────────────

export const MILESTONE_DEFINITIONS: MilestoneDefinition[] = [
  {
    id: 'first_session',
    label: 'First Session',
    description: 'Logged your first range session.',
    detect: (_, sessions) => ({ earned: sessions.length >= 1 }),
  },
  {
    id: 'session_10',
    label: '10 Sessions',
    description: 'Logged 10 range sessions.',
    detect: (_, sessions) => ({ earned: sessions.length >= 10 }),
  },
  {
    id: 'session_50',
    label: '50 Sessions',
    description: 'Logged 50 range sessions.',
    detect: (_, sessions) => ({ earned: sessions.length >= 50 }),
  },
  {
    id: 'century_session',
    label: 'Century Session',
    description: 'Fired 100+ rounds in a single session.',
    detect: (_, sessions) => ({
      earned: sessions.some(s => s.roundsExpended >= 100),
    }),
  },
  {
    id: 'thousand_rounds',
    label: '1,000 Rounds',
    description: 'Fired 1,000 rounds total across all sessions.',
    detect: (_, sessions) => ({ earned: totalRounds(sessions) >= 1000 }),
  },
  {
    id: 'ten_thousand_rounds',
    label: '10,000 Rounds',
    description: 'Fired 10,000 rounds total.',
    detect: (_, sessions) => ({ earned: totalRounds(sessions) >= 10000 }),
  },
  {
    id: 'first_long_range',
    label: 'Long Range',
    description: 'First session at 300+ yards.',
    detect: (_, sessions) => ({
      earned: sessions.some(s => s.distanceYards != null && s.distanceYards >= 300),
    }),
  },
  {
    id: 'extreme_range',
    label: 'Extreme Range',
    description: 'First session at 1,000+ yards.',
    detect: (_, sessions) => ({
      earned: sessions.some(s => s.distanceYards != null && s.distanceYards >= 1000),
    }),
  },
  {
    id: 'first_competition',
    label: 'Competitor',
    description: 'Logged your first competition session.',
    detect: (_, sessions) => ({
      earned: sessions.some(s => s.purpose?.includes('Competition')),
    }),
  },
  {
    id: 'drill_master',
    label: 'Drill Master',
    description: '10+ dedicated drill sessions logged.',
    detect: (_, sessions) => ({
      earned: sessions.filter(s => s.purpose?.includes('Drills')).length >= 10,
    }),
  },
  {
    id: 'zeroed_in',
    label: 'Zeroed In',
    description: 'Logged your first zeroing session.',
    detect: (_, sessions) => ({
      earned: sessions.some(s => s.purpose?.includes('Zeroing')),
    }),
  },
  {
    id: 'carry_eval',
    label: 'Carry Eval',
    description: 'Logged your first carry evaluation session.',
    detect: (_, sessions) => ({
      earned: sessions.some(s => s.purpose?.includes('Carry Eval') || s.isCarryGun),
    }),
  },
  {
    id: 'consistent_shooter',
    label: 'Consistent',
    description: '3+ sessions per month for 3 consecutive months.',
    detect: (_, sessions) => ({ earned: hasStreakMonths(sessions) }),
  },
  {
    id: 'multi_caliber',
    label: 'Multi-Caliber',
    description: '5+ calibers represented in the vault.',
    detect: (guns) => ({ earned: uniqueCalibers(guns).size >= 5 }),
  },
  {
    id: 'collector_5',
    label: 'Collector',
    description: '5+ firearms in the vault.',
    detect: (guns) => ({ earned: activeGuns(guns).length >= 5 }),
  },
  {
    id: 'collector_10',
    label: 'Arsenal',
    description: '10+ firearms in the vault.',
    detect: (guns) => ({ earned: activeGuns(guns).length >= 10 }),
  },
  {
    id: 'reloader',
    label: 'Reloader',
    description: 'Added your first handload ammo lot.',
    detect: (_, __, ammoLots) => ({
      earned: ammoLots.some(a => a.isHandload),
    }),
  },
  {
    id: 'nfa_owner',
    label: 'NFA Owner',
    description: 'First NFA item in the vault.',
    detect: (guns) => ({
      earned: guns.some(g => g.nfaItem || g.type === 'Suppressor'),
    }),
  },
  {
    id: 'milsurp',
    label: 'Milsurp',
    description: 'First Curio & Relic firearm logged.',
    detect: (guns) => ({
      earned: guns.some(g => g.crFlag),
    }),
  },
  {
    id: 'optics_mounted',
    label: 'Optics Ready',
    description: 'First optic mounted on a firearm.',
    detect: (guns) => ({
      earned: guns.some(g => g.accessories?.optic),
    }),
  },
  {
    id: 'target_analyst',
    label: 'Target Analyst',
    description: 'First target photo analyzed with AI.',
    detect: (_, sessions) => ({
      earned: sessions.some(s => s.targetPhotos?.some(p => p.analysis)),
    }),
  },
  {
    id: 'issue_free_10',
    label: 'Clean Run',
    description: '10 consecutive sessions with no issues reported.',
    detect: (_, sessions) => {
      const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
      const last10 = sorted.slice(0, 10);
      return { earned: last10.length >= 10 && last10.every(s => !s.issues) };
    },
  },
];

// ── Detection ─────────────────────────────────────────────────────────────────

/**
 * Returns all milestone IDs currently earned from vault data.
 */
export function detectEarnedMilestoneIds(
  guns: Gun[],
  sessions: Session[],
  ammoLots: AmmoLot[],
): Set<string> {
  const earned = new Set<string>();
  for (const def of MILESTONE_DEFINITIONS) {
    const result = def.detect(guns, sessions, ammoLots);
    if (result.earned) earned.add(def.id);
  }
  return earned;
}

/**
 * Compares current earned milestones against existing profile milestones.
 * Returns only the newly earned ones (not already in the profile).
 */
export function detectNewMilestones(
  guns: Gun[],
  sessions: Session[],
  ammoLots: AmmoLot[],
  existingMilestones: ShooterMilestone[],
): ShooterMilestone[] {
  const existingIds = new Set(existingMilestones.map(m => m.id));
  const now = new Date().toISOString();

  const newMilestones: ShooterMilestone[] = [];

  for (const def of MILESTONE_DEFINITIONS) {
    if (existingIds.has(def.id)) continue;
    const result = def.detect(guns, sessions, ammoLots);
    if (result.earned) {
      newMilestones.push({
        id: def.id,
        label: def.label,
        description: def.description,
        awardedAt: now,
        gunId: result.gunId,
      });
    }
  }

  return newMilestones;
}
