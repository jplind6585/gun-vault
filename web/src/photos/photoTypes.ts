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
    label: 'Full Gun — Left Side',
    required: true,
    coachingText: 'Lay the gun on a plain surface or hold it against a clean wall. Capture the entire gun from end to end, left side facing the camera. Fill most of the frame.',
    applicableSets: ['sale_listing', 'insurance'],
  },
  {
    key: 'right_profile',
    label: 'Full Gun — Right Side',
    required: true,
    coachingText: 'Same as the left side shot, but flip the gun over. Entire gun visible, right side facing the camera. Matching background and lighting.',
    applicableSets: ['sale_listing', 'insurance'],
  },
  {
    key: 'serial_number',
    label: 'Serial Number',
    required: true,
    coachingText: 'Get close and fill the frame with the serial number. Every digit and letter must be sharp and readable. Avoid reflections — try moving the light source to the side if glare is an issue.',
    applicableSets: ['sale_listing', 'insurance'],
  },
  {
    key: 'action_open',
    label: 'Open Action — Empty Chamber',
    required: true,
    coachingText: 'Open the action so the chamber is visible and clearly empty. For pistols: slide locked back. For rifles: bolt back or action open. Required to show the gun is unloaded.',
    applicableSets: ['sale_listing', 'insurance'],
  },
  {
    key: 'muzzle_end',
    label: 'End of the Barrel (Front)',
    required: true,
    coachingText: 'Point the camera at the very front of the barrel — the opening at the end. Make sure the gun is empty first. Get close enough to see the condition of the barrel opening.',
    applicableSets: ['sale_listing'],
  },
  {
    key: 'breech_chamber',
    label: 'Where the Bullet Loads (Chamber Area)',
    required: true,
    coachingText: 'The chamber is where the cartridge sits when you fire. With the action open, photograph this area from the right side. Use a flashlight if the area is dark.',
    applicableSets: ['sale_listing'],
  },
  {
    key: 'sights_optic',
    label: 'Sights or Scope',
    required: false,
    coachingText: 'Photograph any scope, red dot, or iron sights from above at a slight angle. Show the condition of the glass and any mounts or rings.',
    applicableSets: ['sale_listing'],
  },
  {
    key: 'barrel_crown',
    label: 'Barrel Crown (Close-up)',
    required: true,
    coachingText: 'The crown is the very end of the barrel, right at the muzzle opening. Get as close as your camera can focus and photograph just that edge. This shows any dings or damage that affect accuracy.',
    applicableSets: ['sale_listing'],
  },
  {
    key: 'magazine_follower',
    label: 'Magazine',
    required: false,
    coachingText: 'Remove the magazine and photograph it separately. Tilt it so you can see the top (the follower — the piece that pushes rounds up). Show all included magazines.',
    applicableSets: ['sale_listing'],
    applicableProfiles: ['semi_auto_pistol', 'ar_pattern_rifle', 'semi_auto_rifle', 'semi_auto_shotgun'],
  },
  {
    key: 'wear_areas',
    label: 'Wear and Finish',
    required: true,
    coachingText: 'Photograph any scratches, worn finish, or marks anywhere on the gun. If it looks nearly new, take a close-up of the finish to show its condition. Buyers and insurers want to see exactly what they\'re getting.',
    applicableSets: ['sale_listing'],
  },
  {
    key: 'box_accessories',
    label: 'Original Box and Papers',
    required: false,
    coachingText: 'Lay out the original box, owner\'s manual, warranty card, lock, and any accessories that come with the gun. Photograph everything together.',
    applicableSets: ['sale_listing', 'insurance'],
  },
  {
    key: 'proof_marks',
    label: 'Proof Marks (if any)',
    required: false,
    coachingText: 'Some guns have small stamps that show where they were tested and approved (proof marks) or where they were imported from. If your gun has these, photograph them close-up. They can affect collector value.',
    applicableSets: ['sale_listing'],
  },
  {
    key: 'unique_features',
    label: 'Anything Unique or Custom',
    required: false,
    coachingText: 'Custom grips, engraving, aftermarket parts, unique markings — anything that makes this gun different. Good for insurance so they know exactly which gun is yours.',
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
  const capturedKeys = new Set(assets.map(a => a.shotType));
  const missing = required.filter(s => !capturedKeys.has(s.key));
  return {
    setType,
    totalRequired: required.length,
    completed: required.length - missing.length,
    missingShots: missing.map(s => s.label),
  };
}
