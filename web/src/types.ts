// Core data types
export type SessionPurpose = 'Warmup' | 'Drills' | 'Zeroing' | 'Qualification' | 'Competition' | 'Fun' | 'Carry Eval';
export type IssueType = 'FTF' | 'FTE' | 'Double Feed' | 'Stovepipe' | 'Trigger Reset' | 'Accuracy' | 'Sighting' | 'Other';

export interface TargetPhotoAnalysis {
  groupSize?: string;
  accuracy?: string;
  pattern?: string;
  issues?: string[];
  recommendations?: string[];
  drills?: string[];
  ammoNotes?: string;
  equipmentWarnings?: string[];
  rawResponse: string;
  analyzedAt: string;
}

export interface TargetPhoto {
  id: string;
  dataUrl: string;
  distanceYards?: number;
  analysis?: TargetPhotoAnalysis;
  capturedAt: string;
}
export type GunPurpose = 'Plinking' | 'Self Defense' | 'EDC' | 'Hunting' | 'Competition' | 'Home Defense' | 'Duty' | 'Collector';
export type GunStatus  = 'Active' | 'Stored' | 'Loaned Out' | 'Awaiting Repair' | 'Sold' | 'Transferred';

export interface GunAccessories {
  optic?: string;           // e.g. "Trijicon MRO"
  opticMagnification?: string; // e.g. "1x" / "3-9x"
  sling?: string;           // e.g. "Blue Force Gear VCAS"
  bipod?: string;           // e.g. "Harris 9-13\""
  muzzleDevice?: string;    // e.g. "SureFire Warcomp"
  suppressor?: string;      // e.g. "SureFire SOCOM762-RC2"
  weaponLight?: string;     // e.g. "SureFire X300U"
  laser?: string;           // e.g. "Streamlight TLR-2"
  foregrip?: string;        // e.g. "BCM GUNFIGHTER"
  magazineUpgrade?: string; // e.g. "Magpul PMAG 30"
  stockGrip?: string;       // e.g. "Magpul STR"
  other?: string;           // Anything else
}

export interface Gun {
  id: string;
  make: string;
  model: string;
  displayName?: string;
  caliber: string;
  action: 'Semi-Auto' | 'Semi' | 'Bolt' | 'Lever' | 'Pump' | 'Revolver' | 'Break' | 'Single Shot';
  type: 'Pistol' | 'Rifle' | 'Shotgun' | 'Suppressor' | 'NFA';
  serialNumber?: string;
  acquiredDate?: string;
  acquiredPrice?: number;
  acquiredFrom?: string;
  condition?: 'New' | 'Excellent' | 'Very Good' | 'Good' | 'Fair' | 'Poor';
  status: GunStatus;
  roundCount?: number;
  barrelLength?: number;
  overallLength?: number;
  weight?: number;
  finish?: string;
  stockGrip?: string;
  notes?: string;
  imageUrl?: string;
  insuranceValue?: number;
  estimatedFMV?: number;
  fmvUpdated?: string;
  nfaItem?: boolean;
  nfaApprovalDate?: string;
  suppressorHost?: boolean;
  // New fields
  capacity?: number;                // Magazine/cylinder capacity
  purpose?: GunPurpose[];           // How you use this gun
  crFlag?: boolean;                 // Curio & Relic eligible
  // Maintenance tracking
  lastCleanedDate?: string;         // ISO date
  lastCleanedRoundCount?: number;   // Lifetime round count at last cleaning
  lastZeroDate?: string;            // ISO date
  lastZeroDistance?: number;        // Yards
  openIssues?: string;              // Current known issues
  // Accessories
  accessories?: GunAccessories;
  soldDate?: string;
  soldPrice?: number;
  receiptImageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

// One "string" within a multi-gun session (a single gun/distance/ammo combo)
export interface SessionString {
  id: string;
  gunId: string;
  distanceYards?: number;
  roundsExpended: number;
  ammoLotId?: string;
  notes?: string;
}

export interface Session {
  id: string;
  gunId: string;           // primary gun (first string's gun for backwards compat)
  date: string;
  roundsExpended: number;  // total rounds (sum of strings when present)
  location?: string;
  indoorOutdoor?: 'Indoor' | 'Outdoor';
  purpose?: SessionPurpose[];
  distanceYards?: number;  // primary distance (first string's distance for backwards compat)
  issues?: boolean;
  issueTypes?: IssueType[];
  issueDescription?: string;
  notes?: string;
  aiNarrative?: string;
  ammoLotId?: string;
  sessionCost?: number;
  isCarryGun?: boolean;
  rangeDayId?: string;
  targetPhotos?: TargetPhoto[];
  strings?: SessionString[];  // multi-gun/multi-distance support
  targetAnalysisId?: string;  // linked target analysis record
  createdAt?: string;
}

// Saved result from the Target Analysis workflow
export interface TargetAnalysisStats {
  shotCount: number;
  windageIn: number;
  elevationIn: number;
  windageMoa: number;
  elevationMoa: number;
  cepIn: number;
  cepMoa: number;
  radialSdIn: number;
  radialSdMoa: number;
  verticalSdIn: number;
  verticalSdMoa: number;
  horizontalSdIn: number;
  horizontalSdMoa: number;
  extremeSpreadIn: number;
  extremeSpreadMoa: number;
  meanRadiusIn: number;
  meanRadiusMoa: number;
}

export interface TargetAnalysisRecord {
  id: string;
  createdAt: string;
  distanceYds: number;
  bulletDiaIn: number;
  stats: TargetAnalysisStats;
  sessionId?: string;   // linked session
  gunId?: string;       // linked gun
  ammoLotId?: string;   // linked ammo lot
  notes?: string;
}

export interface AmmoLot {
  id: string;
  caliber: string;
  brand: string;
  productLine: string;
  grainWeight: number;
  bulletType: string;
  quantity: number;

  // Ballistics
  advertisedFPS?: number;
  actualFPS?: number; // From chrono sessions
  muzzleEnergy?: number; // Calculated from grain + velocity
  ballisticCoefficient?: number;
  standardDeviation?: number; // From chrono data

  // Purchase tracking
  quantityPurchased?: number;
  purchaseDate?: string;
  purchasePricePerRound?: number;
  currentMarketPrice?: number; // Current market price per round (manual, for replacement cost)
  averageCostPerRound?: number; // Calculated from all purchases

  // Organization
  category: 'Match' | 'Practice' | 'Self Defense' | 'Hunting' | 'Test';
  storageLocation?: string;
  lotNumber?: string;

  // Flags
  isHandload: boolean;
  reloadBatchId?: string;
  assignedGunIds?: string[]; // Guns this ammo is assigned to
  isFavorite?: boolean;
  minStockAlert?: number;
  reserved?: number;

  // Purchase history (for price trend tracking)
  purchaseHistory?: Array<{
    date: string;
    quantity: number;
    pricePerRound: number;
  }>;

  // Metadata
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Cartridge {
  id: string;
  name: string; // e.g., ".308 Winchester"
  alternateNames?: string[]; // e.g., ["7.62x51mm NATO"] for .308

  // Classification
  type: 'Rifle' | 'Pistol' | 'Shotgun' | 'Revolver' | 'Rimfire';
  standardization: 'SAAMI' | 'CIP' | 'NATO' | 'Soviet / Russian GRAU' | 'Wildcat' | 'Proprietary' | 'Obsolete / Non-standard';
  productionStatus: 'Active' | 'Limited' | 'Obsolete' | 'Military Surplus';
  availability: 'Abundant' | 'Common' | 'Moderate' | 'Limited' | 'Scarce' | 'Collector Only';

  // History
  yearIntroduced: number;
  inventor?: string;
  manufacturer?: string;
  countryOfOrigin: string;
  parentCase?: string; // ID of parent cartridge
  derivedFrom?: string; // Historical description

  // Technical Specifications (metric and imperial stored, display based on user preference)
  bulletDiameterInch: number;
  bulletDiameterMM: number;
  neckDiameterInch?: number;
  neckDiameterMM?: number;
  baseDiameterInch: number;
  baseDiameterMM: number;
  rimDiameterInch: number;
  rimDiameterMM: number;
  caseLengthInch: number;
  caseLengthMM: number;
  overallLengthInch: number;
  overallLengthMM: number;
  caseCapacityGrains?: number;
  maxPressurePSI?: number;
  maxPressureCUP?: number;
  rimType?: 'Rimless' | 'Rimmed' | 'Semi-Rimmed' | 'Belted' | 'Rebated' | 'Rimfire';
  primerType?: string;
  typicalTwistRate?: string;

  // Ballistic Performance (typical ranges)
  commonBulletWeights: number[]; // grains
  velocityRangeFPS: { min: number; max: number };
  energyRangeFTLBS: { min: number; max: number };
  effectiveRangeYards?: number;
  maxRangeYards?: number;

  // Use Cases
  primaryUse: ('Target' | 'Hunting' | 'Self Defense' | 'Military' | 'Competition' | 'Varmint' | 'Plinking')[];
  huntingGameSize?: ('Small Game' | 'Varmint' | 'Medium Game' | 'Large Game' | 'Dangerous Game')[];

  // Military & LE Adoption
  militaryAdoption?: {
    country: string;
    years: string; // e.g., "1952-1980"
    conflicts?: string[];
  }[];
  currentMilitaryUse?: string[]; // Countries still using
  lawEnforcementUse?: boolean;

  // Similar Cartridges
  similarCartridges?: string[]; // IDs of similar cartridges
  modernEquivalent?: string; // ID if this is obsolete
  supersededBy?: string; // What replaced it

  // Personal tracking
  ownGunForThis: boolean; // Do I have a gun chambered for this
  ownAmmoForThis: boolean; // Do I have ammo for this
  onWishlist: boolean;

  // Encyclopedia content
  description?: string;
  history?: string;
  notableFirearms?: string[]; // Famous guns chambered in this
  trivia?: string;
  imageUrl?: string; // Photo of the cartridge
  diagramUrl?: string; // Technical diagram

  // Metadata
  createdAt?: string;
  updatedAt?: string;
  userNotes?: string;
}

// ============================================================================
// OPTICS
// ============================================================================

export type OpticType = 'Red Dot' | 'Holographic' | 'LPVO' | 'Scope' | 'Prism' | 'Night Vision' | 'Thermal' | 'Magnifier' | 'Rangefinder';
export type FocalPlane = 'FFP' | 'SFP' | 'N/A';
export type TurretUnit = 'MOA' | 'MRAD';
export type ParallaxType = 'Fixed' | 'Side Focus' | 'AO (Objective)' | 'None';
export type OpticStatus = 'Active' | 'Stored' | 'Loaned Out' | 'Sold';

export interface Optic {
  id: string;
  brand: string;
  model: string;
  serialNumber?: string;
  opticType: OpticType;
  magnificationMin?: number;    // e.g. 1 for 1-6x
  magnificationMax?: number;    // e.g. 6 for 1-6x
  objectiveMM?: number;         // objective lens diameter in mm
  tubeDiameterMM?: 30 | 34 | 35 | 25.4; // 1", 30mm, 34mm, 35mm
  focalPlane?: FocalPlane;
  reticleName?: string;
  illuminated?: boolean;
  turretUnit?: TurretUnit;
  clickValueMOA?: number;       // MOA per click (e.g. 0.25)
  clickValueMRAD?: number;      // MRAD per click (e.g. 0.1)
  adjustmentRangeElevationMOA?: number;
  adjustmentRangeWindageMOA?: number;
  parallaxType?: ParallaxType;
  batteryType?: string;         // e.g. "CR2032"
  weightOz?: number;
  purchasePrice?: number;
  purchaseDate?: string;
  purchasedFrom?: string;
  status: OpticStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type MountType = 'Rings' | 'Cantilever' | 'QD Mount' | 'Co-Witness' | 'Offset' | 'Integrated' | 'Other';
export type RailInterface = 'Picatinny / MIL-STD-1913' | 'MLOK' | 'KeyMod' | 'Weaver' | 'Dovetail' | 'Proprietary';

export interface Mount {
  id: string;
  opticId: string;    // owning optic
  brand: string;
  model: string;
  mountType: MountType;
  heightMM?: number;              // center height from rail in mm
  ringDiameterMM?: number;        // 30, 34, 35, 25.4, etc.
  ringTorqueInLbs?: number;
  baseTorqueInLbs?: number;
  railInterface?: RailInterface;
  isQD?: boolean;
  returnToZeroRated?: boolean;
  lastTorqueConfirmed?: string;   // ISO date
  notes?: string;
  purchasePrice?: number;
  createdAt: string;
  updatedAt: string;
}

export interface OpticAssignment {
  id: string;
  opticId: string;
  gunId: string;
  mountId?: string;
  assignedDate: string;         // ISO date
  removedDate?: string;         // ISO date — null means currently mounted
  removalReason?: string;
}

export interface OpticZero {
  id: string;
  assignmentId: string;
  opticId: string;
  gunId: string;
  zeroDistanceYards: number;
  ammoDescription?: string;     // e.g. "Federal 77gr OTM"
  ammoLotId?: string;
  date: string;                 // ISO date
  elevationClicksFromMechanical?: number;  // + = up, - = down
  windageClicksFromMechanical?: number;    // + = right, - = left
  tempF?: number;
  altitudeFt?: number;
  notes?: string;
  isActive: boolean;            // only one active per assignment
  createdAt: string;
}
