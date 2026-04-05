// Shooter Profile — types, skill web, persona definitions
// Phase 1: data model only. No UI, no onboarding flow yet.

// ── Skill Domains ─────────────────────────────────────────────────────────────

export type SkillDomain =
  // Fundamentals
  | 'fundamentals'           // grip, stance, sight alignment, trigger control, breathing
  | 'dry_fire'               // dry fire practice, snap caps, SIRT, laser training
  // Shooting disciplines
  | 'precision_rifle'        // long-range, DOPE, wind reading, cold bore
  | 'pistol_craft'           // defensive, carry, concealment, presentation
  | 'shotgun_field'          // upland, wingshooting, clay, pattern, choke selection
  | 'competition'            // USPSA, IDPA, IPSC, 3-Gun, PRS, stage planning
  | 'home_defense_tactical'  // CQB, low-light, retention, room clearing concepts, threat ID
  // Environmental / hunting
  | 'hunting_precision'      // long-range ethical shots, field positions, ranging, animal behavior
  | 'hunting_field'          // driven shoots, upland, wingshooting, field conditions
  // Technical
  | 'reloading'              // case prep, powder measurement, OAL, load development
  | 'ballistics'             // external/terminal ballistics, BC, calculator use, drop charts
  | 'optics'                 // mounting, zeroing, turret use, reticle reading, DOPE
  // Gunsmithing sub-domains
  | 'gunsmithing_action'     // trigger work, timing, fitting, extractor/ejector, feeding
  | 'gunsmithing_metal'      // barrel work, threading, crown, blueing, Cerakote, refinishing
  | 'gunsmithing_stock'      // bedding, pillar bedding, stock fitting, chassis, inlet work
  // NFA / Suppressor
  | 'suppressor_nfa'         // legal process, Form 4, host matching, subsonic selection, suppressor-specific zero
  // Collection / History
  | 'collecting'             // acquisition strategy, cool guns, rarity, investment, platform completion
  | 'historical_firearms'    // milsurp, antiques, black powder, corrosive primers, obsolete calibers
  // Safety & Teaching
  | 'safety_opsec'           // safe storage, handling, transport, legal compliance
  | 'instruction'            // RSO, NRA instructor, private coaching, teaching fundamentals
  // Mind / performance
  | 'performance_mindset'    // mental discipline, performance under pressure, calling shots
  // Maintenance
  | 'maintenance'            // cleaning, lubrication, inspection, preventive care
  // Survival / preparedness
  | 'preparedness'           // field craft, emergency use, resource management

// ── Skill Level ───────────────────────────────────────────────────────────────

export type SkillLevel = 'none' | 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface SkillAssessment {
  domain: SkillDomain;
  level: SkillLevel;
  confidence: number;       // 0–1: how certain we are about this level (not user's sub-rank)
  evidenceSources: Array<'vault' | 'session_behavior' | 'onboarding' | 'check_in' | 'ai_inference'>;
  lastUpdated: string;      // ISO date
  notes?: string;           // e.g. "inferred from PRS-type guns + precision ammo lots"
}

// ── Persona Types ─────────────────────────────────────────────────────────────

export type PersonaType =
  | 'precision_shooter'      // long-range, data-driven, DOPE cards, tight groups
  | 'defensive_carrier'      // EDC, concealed carry, defensive mindset, reliability focus
  | 'competitive_shooter'    // match-focused, stage planning, equipment optimization
  | 'hunter'                 // game-focused, seasonal, ethical shots, appropriate caliber
  | 'collector'              // acquisition-driven, cool guns, historical/investment/rarity
  | 'reloader'               // handloading-focused, load development, component sourcing
  | 'new_shooter'            // early stages, fundamentals focus, short vault history
  | 'recreational_plinker'   // casual fun, low stakes, variety of guns
  | 'homesteader'            // rural, practical, self-reliance, working guns
  | 'armorer'                // builds, modifies, maintains more than shoots
  | 'educator_instructor'    // teaches others, RSO, coach, multi-caliber fundamentals
  | 'minimalist'             // one or two guns, deep understanding, high round count per gun
  | 'nostalgia_shooter'      // milsurp, historical platforms, surplus ammo
  | 'content_creator'        // reviews, media, YouTube, diverse platforms, high turnover
  | 'nfa_enthusiast'         // suppressor / Class III focus, NFA process, wait times

export interface ShooterPersona {
  type: PersonaType;
  probability: number;      // 0–1: confidence this persona applies
}

// ── Goals ─────────────────────────────────────────────────────────────────────

export type GoalStatus = 'active' | 'paused' | 'completed' | 'abandoned';

export interface ShooterGoal {
  id: string;
  text: string;             // e.g. "Shoot my first USPSA match"
  domain?: SkillDomain;
  status: GoalStatus;
  createdAt: string;
  completedAt?: string;
  sourceConversationId?: string;  // which onboarding/check-in created this
}

// ── Accuracy Profile ──────────────────────────────────────────────────────────

export interface GunAccuracySession {
  sessionId: string;
  date: string;
  distanceYards: number;
  groupSizeMOA: number;     // derived: (groupSizeInches / distanceYards) * 100
  shotCount: number;        // shots in the group
  ammoLotId?: string;
}

export interface GunAccuracyProfile {
  gunId: string;
  sessions: GunAccuracySession[];
  meanMOA?: number;
  medianMOA?: number;       // headline stat — more robust than mean
  bestMOA?: number;
  sessionCount: number;     // qualifying sessions only (has distance + group)
  confidence: 'insufficient' | 'low' | 'medium' | 'high';  // <3=insufficient, 3-4=low, 5-7=med, 8+=high
  lastCalculated: string;
}

// ── Milestones ────────────────────────────────────────────────────────────────

export interface ShooterMilestone {
  id: string;
  label: string;            // e.g. "First 100-round session"
  description?: string;
  domain?: SkillDomain;
  awardedAt: string;        // ISO date
  gunId?: string;           // Gun associated with milestone, if any
}

// ── Shooter Profile ───────────────────────────────────────────────────────────

export interface ShooterProfile {
  // Skills
  skills: SkillAssessment[];
  primaryPersonas: ShooterPersona[];   // top 3 max, sorted by probability desc

  // Goals
  goals: ShooterGoal[];

  // Accuracy tracking (per gun)
  accuracyProfiles: GunAccuracyProfile[];

  // Milestones
  milestones: ShooterMilestone[];

  // Engagement signals (used for check-in logic)
  totalSessions: number;
  totalRounds: number;
  daysSinceLastSession: number;
  onboardingCompleted: boolean;
  onboardingConversationId?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// ── Skill Web ─────────────────────────────────────────────────────────────────
// Edges define relationships. AI uses this to make coherent inferences.
// e.g. high precision_rifle implies some ballistics knowledge.

export interface SkillNode {
  domain: SkillDomain;
  supports: SkillDomain[];    // being good at this helps you learn these
  requires: SkillDomain[];    // being good at this implies competence here
  adjacent: SkillDomain[];    // commonly co-occurring interests
  overlap: SkillDomain[];     // partially the same skill set
}

export const SKILL_WEB: SkillNode[] = [
  {
    domain: 'fundamentals',
    supports: ['pistol_craft', 'precision_rifle', 'competition', 'home_defense_tactical', 'hunting_precision', 'hunting_field'],
    requires: [],
    adjacent: ['dry_fire', 'safety_opsec'],
    overlap: ['dry_fire'],
  },
  {
    domain: 'dry_fire',
    supports: ['pistol_craft', 'competition', 'fundamentals'],
    requires: [],
    adjacent: ['fundamentals', 'performance_mindset'],
    overlap: ['fundamentals'],
  },
  {
    domain: 'precision_rifle',
    supports: ['hunting_precision', 'competition'],
    requires: ['ballistics', 'optics', 'fundamentals'],
    adjacent: ['reloading', 'optics', 'ballistics'],
    overlap: ['hunting_precision'],
  },
  {
    domain: 'pistol_craft',
    supports: ['competition', 'home_defense_tactical'],
    requires: ['fundamentals'],
    adjacent: ['dry_fire', 'home_defense_tactical', 'performance_mindset'],
    overlap: ['home_defense_tactical'],
  },
  {
    domain: 'shotgun_field',
    supports: ['hunting_field', 'competition'],
    requires: ['fundamentals'],
    adjacent: ['hunting_field'],
    overlap: ['hunting_field'],
  },
  {
    domain: 'competition',
    supports: ['performance_mindset'],
    requires: ['fundamentals'],
    adjacent: ['dry_fire', 'precision_rifle', 'pistol_craft', 'shotgun_field'],
    overlap: [],
  },
  {
    domain: 'home_defense_tactical',
    supports: [],
    requires: ['fundamentals', 'safety_opsec'],
    adjacent: ['pistol_craft', 'defensive_carrier_mindset' as SkillDomain],
    overlap: ['pistol_craft'],
  },
  {
    domain: 'hunting_precision',
    supports: [],
    requires: ['precision_rifle', 'ballistics'],
    adjacent: ['optics', 'reloading', 'hunting_field'],
    overlap: ['precision_rifle'],
  },
  {
    domain: 'hunting_field',
    supports: [],
    requires: ['fundamentals'],
    adjacent: ['shotgun_field', 'hunting_precision'],
    overlap: ['shotgun_field'],
  },
  {
    domain: 'reloading',
    supports: ['ballistics', 'precision_rifle', 'hunting_precision'],
    requires: [],
    adjacent: ['ballistics', 'gunsmithing_action', 'precision_rifle'],
    overlap: ['ballistics'],
  },
  {
    domain: 'ballistics',
    supports: ['precision_rifle', 'hunting_precision', 'optics'],
    requires: [],
    adjacent: ['reloading', 'optics', 'precision_rifle'],
    overlap: ['reloading'],
  },
  {
    domain: 'optics',
    supports: ['precision_rifle', 'hunting_precision', 'competition'],
    requires: [],
    adjacent: ['ballistics', 'gunsmithing_action'],
    overlap: [],
  },
  {
    domain: 'gunsmithing_action',
    supports: ['gunsmithing_metal', 'gunsmithing_stock'],
    requires: ['maintenance'],
    adjacent: ['gunsmithing_metal', 'gunsmithing_stock', 'reloading'],
    overlap: ['maintenance'],
  },
  {
    domain: 'gunsmithing_metal',
    supports: [],
    requires: [],
    adjacent: ['gunsmithing_action', 'gunsmithing_stock', 'collecting'],
    overlap: [],
  },
  {
    domain: 'gunsmithing_stock',
    supports: ['precision_rifle'],
    requires: [],
    adjacent: ['gunsmithing_action', 'gunsmithing_metal'],
    overlap: [],
  },
  {
    domain: 'suppressor_nfa',
    supports: [],
    requires: ['safety_opsec'],
    adjacent: ['collecting', 'home_defense_tactical'],
    overlap: [],
  },
  {
    domain: 'collecting',
    supports: [],
    requires: [],
    adjacent: ['historical_firearms', 'suppressor_nfa', 'gunsmithing_metal'],
    overlap: ['historical_firearms'],
  },
  {
    domain: 'historical_firearms',
    supports: [],
    requires: ['maintenance'],
    adjacent: ['collecting'],
    overlap: ['collecting'],
  },
  {
    domain: 'safety_opsec',
    supports: ['fundamentals', 'home_defense_tactical', 'instruction'],
    requires: [],
    adjacent: ['fundamentals', 'instruction'],
    overlap: [],
  },
  {
    domain: 'instruction',
    supports: ['safety_opsec'],
    requires: ['fundamentals', 'safety_opsec'],
    adjacent: ['performance_mindset', 'safety_opsec'],
    overlap: [],
  },
  {
    domain: 'performance_mindset',
    supports: ['competition', 'precision_rifle'],
    requires: [],
    adjacent: ['dry_fire', 'competition', 'instruction'],
    overlap: [],
  },
  {
    domain: 'maintenance',
    supports: ['gunsmithing_action', 'historical_firearms'],
    requires: [],
    adjacent: ['safety_opsec', 'gunsmithing_action'],
    overlap: ['gunsmithing_action'],
  },
  {
    domain: 'preparedness',
    supports: [],
    requires: ['safety_opsec'],
    adjacent: ['home_defense_tactical', 'historical_firearms'],
    overlap: [],
  },
];
