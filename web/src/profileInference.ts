// Profile Inference — pure function, no AI, no side effects
// Derives a ShooterProfile from vault data alone.
// AI enrichment happens separately (buildFullContext injects this for every call).

import type { Gun, Session, AmmoLot } from './types';
import type {
  ShooterProfile,
  SkillAssessment,
  ShooterPersona,
  GunAccuracyProfile,
  GunAccuracySession,
  SkillDomain,
  SkillLevel,
  PersonaType,
} from './shooterProfile';

// ── Helpers ───────────────────────────────────────────────────────────────────

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function daysSince(isoDate: string): number {
  const d = new Date(isoDate + 'T12:00:00');
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

// ── Accuracy Profile ──────────────────────────────────────────────────────────

function buildAccuracyProfiles(
  guns: Gun[],
  sessions: Session[],
): GunAccuracyProfile[] {
  const byGun = new Map<string, GunAccuracySession[]>();

  sessions.forEach(s => {
    if (!s.distanceYards || s.distanceYards <= 0) return;

    // Pull group size from target analysis photos if present
    s.targetPhotos?.forEach(photo => {
      const analysis = photo.analysis;
      if (!analysis?.accuracy) return;

      // Parse MOA from accuracy string e.g. "~1.5 MOA" or "sub-MOA"
      const moaMatch = analysis.accuracy.match(/([\d.]+)\s*MOA/i);
      const subMoa = /sub-?moa/i.test(analysis.accuracy);
      const groupMOA = moaMatch ? parseFloat(moaMatch[1]) : subMoa ? 0.9 : null;
      if (!groupMOA || groupMOA <= 0) return;

      const entry: GunAccuracySession = {
        sessionId: s.id,
        date: s.date,
        distanceYards: s.distanceYards!,
        groupSizeMOA: groupMOA,
        shotCount: s.roundsExpended,
        ammoLotId: s.ammoLotId,
      };

      const arr = byGun.get(s.gunId) ?? [];
      arr.push(entry);
      byGun.set(s.gunId, arr);
    });
  });

  return guns.map(gun => {
    const sessions = byGun.get(gun.id) ?? [];
    const moas = sessions.map(s => s.groupSizeMOA);

    let confidence: GunAccuracyProfile['confidence'] = 'insufficient';
    if (sessions.length >= 8) confidence = 'high';
    else if (sessions.length >= 5) confidence = 'medium';
    else if (sessions.length >= 3) confidence = 'low';

    return {
      gunId: gun.id,
      sessions,
      meanMOA: moas.length > 0 ? mean(moas) : undefined,
      medianMOA: moas.length > 0 ? median(moas) : undefined,
      bestMOA: moas.length > 0 ? Math.min(...moas) : undefined,
      sessionCount: sessions.length,
      confidence,
      lastCalculated: new Date().toISOString(),
    };
  });
}

// ── Skill Inference ───────────────────────────────────────────────────────────

function inferSkills(
  guns: Gun[],
  sessions: Session[],
  ammoLots: AmmoLot[],
): SkillAssessment[] {
  const scores: Partial<Record<SkillDomain, number>> = {};

  const totalRounds = sessions.reduce((s, sess) => s + sess.roundsExpended, 0);
  const totalSessions = sessions.length;
  const hasPrecisionPurpose = sessions.some(s => s.purpose?.includes('Zeroing') || s.purpose?.includes('Qualification'));
  const hasCompetition = sessions.some(s => s.purpose?.includes('Competition'));
  const hasDrills = sessions.some(s => s.purpose?.includes('Drills'));
  const hasDistances = sessions.some(s => s.distanceYards && s.distanceYards >= 100);
  const hasLongRange = sessions.some(s => s.distanceYards && s.distanceYards >= 300);
  const hasReloads = ammoLots.some(a => a.isHandload);
  const hasMatchAmmo = ammoLots.some(a => a.category === 'Match');
  const hasSuppressor = guns.some(g => g.type === 'Suppressor' || g.nfaItem);
  const hasNFA = guns.some(g => g.nfaItem);
  const hasMilsurp = guns.some(g => g.crFlag);
  const hasOptics = guns.some(g => g.accessories?.optic);
  const hasHighEndOptics = guns.some(g => g.accessories?.optic && (
    /nightforce|schmidt|tract|vortex razor|leupold|zeiss|swarovski/i.test(g.accessories.optic)
  ));

  const hasPistols = guns.some(g => g.type === 'Pistol');
  const hasRifles = guns.some(g => g.type === 'Rifle');
  const hasShotguns = guns.some(g => g.type === 'Shotgun');
  const gunCount = guns.length;

  // fundamentals — baseline from session count
  scores['fundamentals'] = Math.min(totalSessions * 3 + totalRounds * 0.005, 70);
  if (hasDrills) scores['fundamentals'] = (scores['fundamentals'] ?? 0) + 15;

  // dry_fire — hard to infer without explicit tracking; small signal from drill sessions
  if (hasDrills && totalSessions > 10) scores['dry_fire'] = 20;

  // pistol_craft
  if (hasPistols) {
    const pistolSessions = sessions.filter(s =>
      guns.find(g => g.id === s.gunId)?.type === 'Pistol'
    );
    scores['pistol_craft'] = Math.min(pistolSessions.length * 5 + (hasDrills ? 10 : 0), 70);
  }

  // precision_rifle
  if (hasRifles && hasLongRange) {
    scores['precision_rifle'] = Math.min(
      (hasLongRange ? 20 : 0) + (hasMatchAmmo ? 15 : 0) + (hasHighEndOptics ? 15 : 0) + (hasPrecisionPurpose ? 15 : 0),
      70,
    );
  }

  // competition
  if (hasCompetition) scores['competition'] = Math.min(sessions.filter(s => s.purpose?.includes('Competition')).length * 8, 70);

  // reloading
  if (hasReloads) scores['reloading'] = Math.min(ammoLots.filter(a => a.isHandload).length * 8, 70);

  // ballistics
  if (hasDistances && (hasMatchAmmo || hasHighEndOptics)) scores['ballistics'] = 30;
  if (hasLongRange) scores['ballistics'] = ((scores['ballistics'] ?? 0)) + 20;

  // optics
  if (hasOptics) scores['optics'] = 20;
  if (hasHighEndOptics) scores['optics'] = ((scores['optics'] ?? 0)) + 20;

  // suppressor_nfa
  if (hasSuppressor || hasNFA) scores['suppressor_nfa'] = 35;

  // collecting
  const acquisitionRate = gunCount / Math.max(totalSessions / 12, 1); // guns per avg monthly interval
  if (gunCount >= 5 && acquisitionRate > 0.5) scores['collecting'] = Math.min(gunCount * 4, 60);

  // historical_firearms
  if (hasMilsurp) scores['historical_firearms'] = 35;

  // maintenance
  const cleanedRecently = guns.filter(g => g.lastCleanedDate && daysSince(g.lastCleanedDate) < 60);
  if (cleanedRecently.length > 0) scores['maintenance'] = Math.min(cleanedRecently.length * 10, 50);

  // safety_opsec — baseline for any active shooter
  if (totalSessions > 0) scores['safety_opsec'] = 20;

  // hunting domains
  const huntingGuns = guns.filter(g => g.purpose?.includes('Hunting'));
  if (huntingGuns.some(g => g.type === 'Rifle') && hasLongRange) scores['hunting_precision'] = 30;
  if (huntingGuns.some(g => g.type === 'Shotgun') || hasShotguns) scores['hunting_field'] = 25;

  // home_defense_tactical
  const hdGuns = guns.filter(g => g.purpose?.some(p => p === 'Home Defense' || p === 'Self Defense' || p === 'EDC'));
  if (hdGuns.length > 0) scores['home_defense_tactical'] = 20;

  // performance_mindset
  if (hasCompetition && totalSessions > 20) scores['performance_mindset'] = 25;

  // Convert scores to SkillAssessment[]
  const results: SkillAssessment[] = [];

  for (const [domain, score] of Object.entries(scores) as [SkillDomain, number][]) {
    if (score === undefined || score <= 0) continue;

    let level: SkillLevel = 'none';
    let confidence = 0.4; // vault inference is inherently lower confidence

    if (score >= 60) { level = 'expert'; confidence = 0.35; }
    else if (score >= 40) { level = 'advanced'; confidence = 0.4; }
    else if (score >= 20) { level = 'intermediate'; confidence = 0.5; }
    else if (score > 0) { level = 'beginner'; confidence = 0.55; }

    results.push({
      domain,
      level,
      confidence,
      evidenceSources: ['vault'],
      lastUpdated: new Date().toISOString(),
    });
  }

  return results;
}

// ── Persona Inference ─────────────────────────────────────────────────────────

function inferPersonas(
  guns: Gun[],
  sessions: Session[],
  ammoLots: AmmoLot[],
): ShooterPersona[] {
  const scores: Partial<Record<PersonaType, number>> = {};

  const gunCount = guns.length;
  const totalSessions = sessions.length;
  const totalRounds = sessions.reduce((s, sess) => s + sess.roundsExpended, 0);
  const hasReloads = ammoLots.some(a => a.isHandload);
  const hasCompetition = sessions.some(s => s.purpose?.includes('Competition'));
  const hasLongRange = sessions.some(s => s.distanceYards && s.distanceYards >= 300);
  const hasSuppressor = guns.some(g => g.type === 'Suppressor' || g.nfaItem);
  const hasMilsurp = guns.some(g => g.crFlag);
  const hasMatchAmmo = ammoLots.some(a => a.category === 'Match');
  const hasHuntingGuns = guns.some(g => g.purpose?.includes('Hunting'));
  const hasEDC = guns.some(g => g.purpose?.some(p => p === 'EDC' || p === 'Self Defense'));
  const hasCollector = guns.some(g => g.purpose?.includes('Collector'));

  const roundsPerGun = gunCount > 0 ? totalRounds / gunCount : 0;
  const sessionsPerGun = gunCount > 0 ? totalSessions / gunCount : 0;

  // precision_shooter
  if (hasLongRange && (hasMatchAmmo || hasReloads)) scores['precision_shooter'] = 60;
  else if (hasLongRange) scores['precision_shooter'] = 30;

  // defensive_carrier
  if (hasEDC) scores['defensive_carrier'] = 50;

  // competitive_shooter
  if (hasCompetition) scores['competitive_shooter'] = sessions.filter(s => s.purpose?.includes('Competition')).length > 5 ? 70 : 40;

  // hunter
  if (hasHuntingGuns) scores['hunter'] = 50;

  // collector
  if (hasCollector || (gunCount >= 6 && sessionsPerGun < 5)) scores['collector'] = 50;
  if (gunCount >= 10) scores['collector'] = ((scores['collector'] ?? 0)) + 20;

  // reloader
  if (hasReloads) scores['reloader'] = ammoLots.filter(a => a.isHandload).length > 3 ? 65 : 40;

  // new_shooter
  if (totalSessions <= 5 && gunCount <= 2) scores['new_shooter'] = 70;

  // recreational_plinker
  if (totalSessions > 5 && !hasCompetition && !hasLongRange && !hasEDC && !hasHuntingGuns) {
    scores['recreational_plinker'] = 40;
  }

  // minimalist
  if (gunCount <= 2 && roundsPerGun > 1000) scores['minimalist'] = 60;

  // nostalgia_shooter
  if (hasMilsurp) scores['nostalgia_shooter'] = 45;

  // nfa_enthusiast
  if (hasSuppressor) scores['nfa_enthusiast'] = 55;

  // armorer — no strong vault signal; low base only
  // educator — no vault signal
  // content_creator — high gun turnover would signal this but we don't track sold guns well yet

  // Normalize to probabilities
  const max = Math.max(...Object.values(scores).filter(Boolean) as number[], 1);
  return (Object.entries(scores) as [PersonaType, number][])
    .filter(([, s]) => s > 0)
    .map(([type, s]) => ({ type, probability: Math.min(s / max, 1) }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 3);
}

// ── Check-in Trigger Evaluation ───────────────────────────────────────────────

export type CheckInTrigger =
  | 'session_count_milestone'   // 3rd, 10th, 25th session
  | 'vault_growth'              // 3+ guns added in 60 days
  | 'first_reload'              // first handload lot added
  | 'long_gap'                  // 30+ days since last session
  | 'none';

export function evaluateCheckInTrigger(
  profile: ShooterProfile,
  guns: Gun[],
  sessions: Session[],
  ammoLots: AmmoLot[],
): CheckInTrigger {
  const sortedSessions = [...sessions].sort((a, b) => b.date.localeCompare(a.date));

  // session count milestones
  const milestoneSessionCounts = [3, 10, 25, 50, 100];
  if (milestoneSessionCounts.includes(sessions.length) && sessions.length !== profile.totalSessions) {
    return 'session_count_milestone';
  }

  // vault growth: 3+ guns acquired in last 60 days
  const recent = guns.filter(g => g.acquiredDate && daysSince(g.acquiredDate) <= 60);
  if (recent.length >= 3) return 'vault_growth';

  // first reload
  const hasReloads = ammoLots.some(a => a.isHandload);
  const hadReloads = profile.skills.some(s => s.domain === 'reloading' && s.evidenceSources.includes('vault'));
  if (hasReloads && !hadReloads) return 'first_reload';

  // long gap
  if (sortedSessions.length > 0 && daysSince(sortedSessions[0].date) >= 30) return 'long_gap';

  return 'none';
}

// ── Main Inference Function ───────────────────────────────────────────────────

export function inferProfileFromVault(
  guns: Gun[],
  sessions: Session[],
  ammoLots: AmmoLot[],
  existing?: ShooterProfile | null,
): ShooterProfile {
  const skills = inferSkills(guns, sessions, ammoLots);
  const primaryPersonas = inferPersonas(guns, sessions, ammoLots);
  const accuracyProfiles = buildAccuracyProfiles(guns, sessions);

  const sortedSessions = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  const lastDate = sortedSessions[0]?.date;
  const daysSinceLastSession = lastDate ? daysSince(lastDate) : 9999;
  const totalRounds = sessions.reduce((s, sess) => s + sess.roundsExpended, 0);

  // If existing profile has check-in or onboarding data, merge it in
  // (preserve skills from non-vault sources, don't overwrite with lower-confidence vault inference)
  const mergedSkills = mergeSkills(skills, existing?.skills ?? []);

  return {
    skills: mergedSkills,
    primaryPersonas,
    goals: existing?.goals ?? [],
    accuracyProfiles,
    milestones: existing?.milestones ?? [],
    totalSessions: sessions.length,
    totalRounds,
    daysSinceLastSession,
    onboardingCompleted: existing?.onboardingCompleted ?? false,
    onboardingConversationId: existing?.onboardingConversationId,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function mergeSkills(
  vaultSkills: SkillAssessment[],
  existingSkills: SkillAssessment[],
): SkillAssessment[] {
  const merged = new Map<SkillDomain, SkillAssessment>();

  // Start with vault-inferred skills
  vaultSkills.forEach(s => merged.set(s.domain, s));

  // For each existing skill from check-ins/onboarding: keep if higher confidence
  existingSkills.forEach(existing => {
    const vault = merged.get(existing.domain);
    if (!vault || existing.confidence > vault.confidence) {
      merged.set(existing.domain, {
        ...existing,
        // Merge evidence sources
        evidenceSources: [...new Set([...(vault?.evidenceSources ?? []), ...existing.evidenceSources])],
      });
    }
  });

  return Array.from(merged.values());
}
