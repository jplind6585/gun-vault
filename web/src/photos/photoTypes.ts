// Photo System — Type Definitions

export type SetType = 'sale_listing' | 'insurance';

export type GunTypeProfile =
  | 'semi_auto_pistol'
  | 'revolver'
  | 'ar_pattern_rifle'
  | 'bolt_action_rifle'
  | 'lever_action_rifle'
  | 'semi_auto_rifle'
  | 'pump_shotgun'
  | 'semi_auto_shotgun';

export type NRAGrade = 'Perfect' | 'Excellent' | 'Very Good' | 'Good' | 'Fair' | 'Poor';

// ── Shot type definitions ─────────────────────────────────────────────────────

export interface ShotSpec {
  key: string;
  label: string;
  required: boolean;
  coachingText: string;       // static brief shown before capture
  applicableSets: SetType[];
  applicableProfiles?: GunTypeProfile[];  // undefined = all profiles
}

export const SHOT_SPECS: ShotSpec[] = [
  {
    key: 'left_profile',
    label: 'Left Profile',
    required: true,
    coachingText: 'Full gun, left side facing camera. Clean background — solid wall or flat surface. Fill 80% of frame. Gun horizontal, level.',
    applicableSets: ['sale_listing', 'insurance'],
  },
  {
    key: 'right_profile',
    label: 'Right Profile',
    required: true,
    coachingText: 'Full gun, right side facing camera. Same clean background as left profile. Consistent lighting.',
    applicableSets: ['sale_listing', 'insurance'],
  },
  {
    key: 'serial_number',
    label: 'Serial Number',
    required: true,
    coachingText: 'Frame the serial number stamp tightly. Avoid glare — angle the light source or use diffused lighting. Every character must be legible.',
    applicableSets: ['sale_listing', 'insurance'],
  },
  {
    key: 'action_open',
    label: 'Action Open — Empty Chamber',
    required: true,
    coachingText: 'Action open, chamber clearly empty and visible. This is required for documentation purposes. Shoot from the right side, action facing camera.',
    applicableSets: ['sale_listing', 'insurance'],
  },
  {
    key: 'muzzle_end',
    label: 'Muzzle End',
    required: true,
    coachingText: 'Camera at muzzle level, looking directly at the crown. Verify chamber is clear before this shot. Crown condition visible.',
    applicableSets: ['sale_listing'],
  },
  {
    key: 'breech_chamber',
    label: 'Breech / Chamber Area',
    required: true,
    coachingText: 'Close-up of the breech face and chamber area. Show headspace, feed ramp, and any wear. Good lighting — use a flashlight if needed.',
    applicableSets: ['sale_listing'],
  },
  {
    key: 'sights_optic',
    label: 'Sights / Optic',
    required: false,
    coachingText: 'Photograph the optic or iron sights from directly above, slightly rear-angled. Show condition of lens, mounts, and any markings.',
    applicableSets: ['sale_listing'],
  },
  {
    key: 'barrel_crown',
    label: 'Barrel Crown',
    required: true,
    coachingText: 'Close-up of the muzzle crown — condition and any damage is the focus. Macro mode or tap-to-focus on the crown edge.',
    applicableSets: ['sale_listing'],
  },
  {
    key: 'magazine_follower',
    label: 'Magazine / Follower',
    required: false,
    coachingText: 'Magazine removed, follower visible at top. Show both the magazine body and follower condition. Include all included magazines.',
    applicableSets: ['sale_listing'],
    applicableProfiles: ['semi_auto_pistol', 'ar_pattern_rifle', 'semi_auto_rifle', 'semi_auto_shotgun'],
  },
  {
    key: 'wear_areas',
    label: 'Wear Areas',
    required: true,
    coachingText: 'Photograph any visible wear, holster wear, finish loss, or marks. If none, photograph a representative area of the finish to show condition.',
    applicableSets: ['sale_listing'],
  },
  {
    key: 'box_accessories',
    label: 'Box / Accessories',
    required: false,
    coachingText: 'Original box, paperwork, and any included accessories laid out together. Show all items included in the sale.',
    applicableSets: ['sale_listing', 'insurance'],
  },
  {
    key: 'proof_marks',
    label: 'Proof Marks / Import Marks',
    required: false,
    coachingText: 'Close-up of any proof marks, import stamps, or country-of-origin markings. These affect collector value.',
    applicableSets: ['sale_listing'],
  },
  {
    key: 'unique_features',
    label: 'Unique Identifying Features',
    required: false,
    coachingText: 'Any custom work, unique markings, or identifying features that distinguish this gun. Good for insurance documentation.',
    applicableSets: ['insurance'],
  },
];

// ── Photo Set ─────────────────────────────────────────────────────────────────

export interface PhotoSet {
  id: string;
  userId: string;
  gunId: string;
  setType: SetType;
  gunTypeProfile: GunTypeProfile;
  watermark: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Photo Asset ───────────────────────────────────────────────────────────────

export interface PhotoAsset {
  id: string;
  userId: string;
  gunId: string;
  setId: string | null;
  setType: SetType | null;
  shotType: string | null;
  storagePath: string;
  storageUrl: string | null;
  isFiltered: boolean;
  filterName: string | null;
  isAcquisitionPhoto: boolean;
  aiReviewPassed: boolean | null;
  aiReviewResult: AiReviewResult | null;
  capturedAt: string;
  createdAt: string;
}

export interface AiReviewResult {
  approved: boolean;
  warnings: string[];
}

// ── Grade Assessment ──────────────────────────────────────────────────────────

export interface AreaGrade {
  grade: NRAGrade;
  note: string;
}

export interface GradeAssessment {
  id: string;
  userId: string;
  gunId: string;
  overallGrade: NRAGrade;
  areaGrades: Record<string, AreaGrade>;
  estimatedFmvLow: number | null;   // cents
  estimatedFmvHigh: number | null;
  photoAssetIds: string[];
  assessedAt: string;
  createdAt: string;
}

// ── Set completion ────────────────────────────────────────────────────────────

export interface SetCompletionStatus {
  setType: SetType;
  totalRequired: number;
  completed: number;
  missingShots: string[];   // shot labels
}

// ── Filters ───────────────────────────────────────────────────────────────────

export interface PhotoFilter {
  key: string;
  label: string;
  description: string;
  cssFilter: string;   // CSS filter string for preview
}

export const PHOTO_FILTERS: PhotoFilter[] = [
  { key: 'cowboy',     label: 'Cowboy',     description: 'Warm sepia, faded edges',           cssFilter: 'sepia(0.7) contrast(0.9) brightness(1.05)' },
  { key: 'blued',      label: 'Blued',      description: 'Cool blue-gray, high contrast',      cssFilter: 'saturate(0.3) hue-rotate(200deg) contrast(1.2)' },
  { key: 'parkerized', label: 'Parkerized', description: 'Flat gray-green, matte mil-surp',    cssFilter: 'saturate(0.4) hue-rotate(80deg) contrast(0.95) brightness(0.9)' },
  { key: 'stainless',  label: 'Stainless',  description: 'High key, silver pull',              cssFilter: 'saturate(0.2) brightness(1.15) contrast(1.1)' },
  { key: 'desert',     label: 'Desert',     description: 'Sand/tan warm shift — arid hunting', cssFilter: 'sepia(0.4) saturate(1.2) hue-rotate(10deg) brightness(1.1)' },
  { key: 'treeline',   label: 'Treeline',   description: 'Green-shifted, desaturated — woodland', cssFilter: 'saturate(0.6) hue-rotate(60deg) brightness(0.95)' },
  { key: 'cold_war',   label: 'Cold War',   description: 'Faded, low contrast, near-monochrome', cssFilter: 'saturate(0.15) contrast(0.8) brightness(1.05)' },
  { key: 'case_hardened', label: 'Case Hardened', description: 'Blue-purple iridescence',     cssFilter: 'hue-rotate(240deg) saturate(1.4) contrast(1.1)' },
  { key: 'nickel',     label: 'Nickel',     description: 'Bright, slightly warm silver',       cssFilter: 'saturate(0.25) brightness(1.2) contrast(1.05) sepia(0.1)' },
  { key: 'night_ops',  label: 'Night Ops',  description: 'High contrast, crushed blacks, cool', cssFilter: 'saturate(0.5) contrast(1.5) brightness(0.9) hue-rotate(200deg)' },
];

// ── Gun type profile helpers ──────────────────────────────────────────────────

export function inferGunTypeProfile(type?: string, action?: string): GunTypeProfile {
  const t = (type ?? '').toLowerCase();
  const a = (action ?? '').toLowerCase();

  if (t.includes('pistol') || t.includes('handgun')) {
    if (a.includes('revolver') || t.includes('revolver')) return 'revolver';
    return 'semi_auto_pistol';
  }
  if (t.includes('revolver')) return 'revolver';
  if (t.includes('rifle') || t.includes('carbine')) {
    if (a.includes('bolt')) return 'bolt_action_rifle';
    if (a.includes('lever')) return 'lever_action_rifle';
    if (t.includes('ar') || t.includes('msr') || t.includes('m4') || t.includes('m16')) return 'ar_pattern_rifle';
    return 'semi_auto_rifle';
  }
  if (t.includes('shotgun')) {
    if (a.includes('pump')) return 'pump_shotgun';
    return 'semi_auto_shotgun';
  }
  return 'semi_auto_pistol';
}

export const GUN_TYPE_PROFILE_LABELS: Record<GunTypeProfile, string> = {
  semi_auto_pistol:   'Semi-auto Pistol',
  revolver:           'Revolver',
  ar_pattern_rifle:   'AR-pattern Rifle',
  bolt_action_rifle:  'Bolt-action Rifle',
  lever_action_rifle: 'Lever-action Rifle',
  semi_auto_rifle:    'Semi-auto Rifle',
  pump_shotgun:       'Pump Shotgun',
  semi_auto_shotgun:  'Semi-auto / O/U Shotgun',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getShotsForSet(setType: SetType, profile: GunTypeProfile): ShotSpec[] {
  return SHOT_SPECS.filter(s => {
    if (!s.applicableSets.includes(setType)) return false;
    if (s.applicableProfiles && !s.applicableProfiles.includes(profile)) return false;
    return true;
  });
}

export function getSetCompletionStatus(
  setType: SetType,
  profile: GunTypeProfile,
  assets: PhotoAsset[],
): SetCompletionStatus {
  const shots = getShotsForSet(setType, profile);
  const required = shots.filter(s => s.required);
  const capturedKeys = new Set(assets.filter(a => a.setType === setType).map(a => a.shotType));
  const missing = required.filter(s => !capturedKeys.has(s.key));
  return {
    setType,
    totalRequired: required.length,
    completed: required.length - missing.length,
    missingShots: missing.map(s => s.label),
  };
}
