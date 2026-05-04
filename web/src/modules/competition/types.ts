export type Discipline =
  | 'USPSA' | 'IDPA' | 'IPSC' | '3-Gun'
  | 'PRS' | 'NRL' | 'NRL22' | 'F-Class' | 'Benchrest' | 'Bullseye' | 'Long Range'
  | 'ATA Trap' | 'ATA Doubles' | 'NSCA Sporting Clays' | 'NSCA 5-Stand' | 'NSSA Skeet'
  | 'Steel Challenge' | 'ICORE'
  | 'Black Powder Cartridge' | 'Black Powder Silhouette'
  | 'Other';

export type MatchPriority = 'A' | 'B' | 'C';
export type SeasonPhase = 'build' | 'peak' | 'competition' | 'recovery';
export type ScoreUnit = 'hit_factor' | 'points' | 'time' | 'count' | 'x_count' | 'percentage' | 'score';
export type AIConfidence = 'high' | 'medium' | 'low' | 'insufficient_data';

export interface CompetitionEvent {
  id: string;
  name: string;
  discipline: Discipline;
  divisions: string[];
  date: string;
  location?: string;
  state?: string;
  country: string;
  organizerName?: string;
  organizerEmail?: string;
  officialUrl?: string;
  practiscoreId?: string;
  entryFee?: number;
  stageCount?: number;
  roundCount?: number;
  registrationDeadline?: string;
  source: 'practicscor' | 'ata' | 'nsca' | 'usa_shooting' | 'user_entered' | 'organizer_submitted' | 'seeded';
  verifiedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserEventPlan {
  id: string;
  userId: string;
  eventId?: string;
  eventName: string;
  discipline: Discipline;
  division: string;
  date: string;
  priority: MatchPriority;
  gunId?: string;
  ammoLotId?: string;
  trainingPlan?: TrainingPlan;
  trainingPlanReasoning?: string;
  seasonPhase?: SeasonPhase;
  notes?: string;
  createdAt: string;
}

export interface TrainingPlan {
  generatedAt: string;
  daysToMatch: number;
  totalSessions: number;
  weeklyMinutes: number;
  dryFirePercent: number;
  focusAreas: string[];
  weeks: TrainingWeek[];
  confidenceLevel: AIConfidence;
  adaptiveNote?: string;
}

export interface TrainingWeek {
  weekNumber: number;
  phase: SeasonPhase;
  sessions: TrainingSession[];
}

export interface TrainingSession {
  dayOffset: number;
  dryFire: boolean;
  durationMinutes: number;
  drillIds: string[];
  notes: string;
}

export interface StageResult {
  stage: number;          // keep 'stage' for claudeApi compat
  stageName?: string;
  points?: number;
  time?: number;
  hitFactor?: number;
  pointsDown?: number;
  procedurals?: number;
  misses?: number;
  noShoots?: number;
  notes?: string;
}

export interface CompetitionResult {
  id: string;
  userId: string;
  eventId?: string;
  eventName: string;
  discipline: Discipline;
  division: string;
  date: string;
  placement?: number;
  totalCompetitors?: number;
  score?: number;
  scoreUnit?: ScoreUnit;
  gunId?: string;
  ammoLotId?: string;
  classifierScore?: number;    // 0–100 percent (USPSA/IDPA/NSCA)
  stageData?: StageResult[];
  notes?: string;
  aiDebrief?: string;          // AI-generated debrief text
  reasoning?: string;
  createdAt: string;
}

export interface CompetitionDebrief {
  generatedAt: string;
  questions: DebriefQuestion[];
  summary?: string;
  nextCycleDirectives: string[];
}

export interface DebriefQuestion {
  question: string;
  answer?: string;
  answeredAt?: string;
}

export interface CompetitionRule {
  id: string;
  discipline: string;
  division: string;
  ruleCategory: string;
  ruleDescription: string;
  ruleValue?: string;
  ruleUnit?: string;
  grayArea: boolean;
  grayAreaNote?: string;
  lastVerified?: string;
}

export interface ClassifierThreshold {
  id: string;
  discipline: string;
  division?: string;
  className: string;
  minPercent?: number;
  maxPercent?: number;
  notes?: string;
}

export interface LegalityCheck {
  legal: boolean;
  flags: LegalityFlag[];
  checkedAt: string;
}

export interface LegalityFlag {
  ruleId: string;
  severity: 'violation' | 'warning' | 'gray_area';
  message: string;
  ruleDescription: string;
}

export interface AmmoCorrelation {
  ammoLotId: string;
  brand: string;
  caliber: string;
  grain?: number;
  resultCount: number;
  avgScore: number;
  avgPlacementPercent: number;
  scoreUnit: ScoreUnit;
}

// Disciplines that use classifier percentage systems
export const CLASSIFIER_DISCIPLINES: Discipline[] = ['USPSA', 'IDPA', 'NSCA Sporting Clays', 'NSCA 5-Stand'];

// Disciplines with stage-by-stage scoring
export const STAGE_SCORED_DISCIPLINES: Discipline[] = ['USPSA', 'IDPA', 'IPSC', '3-Gun', 'Steel Challenge'];

export const DISCIPLINE_SCORE_UNITS: Record<Discipline, ScoreUnit> = {
  'USPSA':                  'hit_factor',
  'IDPA':                   'time',
  'IPSC':                   'hit_factor',
  '3-Gun':                  'points',
  'PRS':                    'points',
  'NRL':                    'points',
  'NRL22':                  'points',
  'F-Class':                'score',
  'Benchrest':              'score',
  'Bullseye':               'score',
  'Long Range':             'score',
  'ATA Trap':               'count',
  'ATA Doubles':            'count',
  'NSCA Sporting Clays':    'count',
  'NSCA 5-Stand':           'count',
  'NSSA Skeet':             'count',
  'Steel Challenge':        'time',
  'ICORE':                  'time',
  'Black Powder Cartridge': 'score',
  'Black Powder Silhouette':'score',
  'Other':                  'points',
};

export const ALL_DISCIPLINES: Discipline[] = [
  'USPSA', 'IDPA', 'IPSC', '3-Gun',
  'PRS', 'NRL', 'NRL22', 'F-Class', 'Benchrest', 'Bullseye', 'Long Range',
  'ATA Trap', 'ATA Doubles', 'NSCA Sporting Clays', 'NSCA 5-Stand', 'NSSA Skeet',
  'Steel Challenge', 'ICORE',
  'Black Powder Cartridge', 'Black Powder Silhouette',
  'Other',
];

export const DIVISIONS_BY_DISCIPLINE: Partial<Record<Discipline, string[]>> = {
  'USPSA':               ['Production', 'Carry Optics', 'Limited', 'Open', 'Limited 10', 'Revolver', 'PCC'],
  'IDPA':                ['SSP', 'ESP', 'CCP', 'CO', 'BUG', 'NV', 'Revolver'],
  'IPSC':                ['Standard', 'Open', 'Production', 'Classic', 'Production Optics'],
  '3-Gun':               ['Tactical', 'Tactical Optics', 'Open', 'Heavy Metal'],
  'PRS':                 ['Pro Series', 'Rimfire', 'Gas Gun'],
  'NRL':                 ['Hunter', 'Open'],
  'NRL22':               ['NRL22'],
  'ATA Trap':            ['16 Yard', 'Handicap', 'Doubles'],
  'NSCA Sporting Clays': ['12 Gauge', 'Sub-Gauge', 'Super Sporting'],
  'NSCA 5-Stand':        ['5-Stand'],
  'Steel Challenge':     ['Production', 'Carry Optics', 'Open', 'Rimfire Pistol', 'Rimfire Rifle'],
};
