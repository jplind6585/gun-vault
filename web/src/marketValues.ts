// Market value estimation for firearms
import type { Gun } from './types';

interface MarketValueData {
  estimatedFMV: number;
  insuranceValue: number;
}

// Brand value multipliers (premium brands command higher prices)
const BRAND_MULTIPLIERS: Record<string, number> = {
  // Premium/High-End Brands
  'HK': 2.5,
  'Heckler & Koch': 2.5,
  'Sig Sauer': 2.0,
  'SIG': 2.0,
  'Barrett': 3.0,
  'Daniel Defense': 2.2,
  'Nighthawk': 3.5,
  'Wilson Combat': 3.0,
  'Les Baer': 2.8,
  'Ed Brown': 2.8,
  'Staccato': 2.5,
  'Colt': 1.8,
  'Springfield Armory': 1.5,
  'FN': 1.9,
  'Beretta': 1.6,
  'Benelli': 2.0,

  // Mid-Tier Brands
  'Glock': 1.3,
  'Smith & Wesson': 1.3,
  'S&W': 1.3,
  'Ruger': 1.2,
  'CZ': 1.4,
  'Walther': 1.5,
  'Mossberg': 1.1,
  'Remington': 1.3,
  'Winchester': 1.3,
  'Browning': 1.6,
  'Savage': 1.2,
  'Tikka': 1.7,
  'Bergara': 1.8,
  'Christensen Arms': 2.3,

  // Historical/Collectible
  'Enfield': 1.4,
  'Mosin Nagant': 0.9,
  'Mauser': 1.5,
  'Arisaka': 1.3,

  // Budget/Entry-Level
  'Hi-Point': 0.5,
  'Taurus': 0.8,
  'SCCY': 0.7,
  'Kel-Tec': 0.9,
  'PSA': 0.9,
  'Anderson': 0.8,
  'Palmetto': 0.9,
  'Bear Creek': 0.7,
  'BCA': 0.7,

  // Default for unknown brands
  'default': 1.0
};

// Base values by gun type
const BASE_VALUES: Record<Gun['type'], number> = {
  'Pistol': 500,
  'Rifle': 800,
  'Shotgun': 600,
  'Suppressor': 700,
  'NFA': 1200
};

// Caliber modifiers (some calibers are more expensive)
const CALIBER_MULTIPLIERS: Record<string, number> = {
  // Premium rifle calibers
  '.300 Win Mag': 1.3,
  '.300 Winchester Magnum': 1.3,
  '6.5 Creedmoor': 1.2,
  '.338 Lapua': 1.8,
  '.50 BMG': 2.5,
  '6.5 PRC': 1.3,
  '.300 PRC': 1.4,

  // Standard rifle calibers
  '.308 Winchester': 1.1,
  '7.62x51': 1.1,
  '.223 Remington': 1.0,
  '5.56 NATO': 1.0,
  '5.56mm': 1.0,
  '.30-06': 1.1,
  '6.5 Grendel': 1.15,

  // Pistol calibers
  '9mm': 1.0,
  '.45 ACP': 1.1,
  '.40 S&W': 1.0,
  '10mm': 1.15,
  '.357 Magnum': 1.1,
  '.44 Magnum': 1.2,
  '.380 ACP': 0.9,

  // Shotgun
  '12 Gauge': 1.0,
  '20 Gauge': 0.95,
  '410 Bore': 0.9,

  // Default
  'default': 1.0
};

// Condition multipliers
const CONDITION_MULTIPLIERS: Record<NonNullable<Gun['condition']>, number> = {
  'New': 1.3,
  'Excellent': 1.2,
  'Very Good': 1.1,
  'Good': 1.0,
  'Fair': 0.8,
  'Poor': 0.6
};

// Action type multipliers
const ACTION_MULTIPLIERS: Record<Gun['action'], number> = {
  'Semi-Auto': 1.2,
  'Bolt': 1.0,
  'Lever': 1.1,
  'Pump': 0.9,
  'Revolver': 1.0,
  'Break': 0.95,
  'Single Shot': 0.8
};

/**
 * Estimate market value for a firearm based on its characteristics
 */
export function estimateMarketValue(gun: Partial<Gun>): MarketValueData {
  // If user has already set values, use those
  if (gun.estimatedFMV && gun.insuranceValue) {
    return {
      estimatedFMV: gun.estimatedFMV,
      insuranceValue: gun.insuranceValue
    };
  }

  // If user set acquired price, use that as baseline
  if (gun.acquiredPrice && gun.acquiredPrice > 0) {
    const ageDegradation = calculateAgeDegradation(gun.acquiredDate);
    const conditionMultiplier = gun.condition ? CONDITION_MULTIPLIERS[gun.condition] : 1.0;

    const estimatedFMV = Math.round(gun.acquiredPrice * conditionMultiplier * ageDegradation);
    const insuranceValue = Math.round(estimatedFMV * 1.15); // Insurance typically 15% above FMV

    return { estimatedFMV, insuranceValue };
  }

  // Calculate from scratch based on characteristics
  const baseValue = gun.type ? BASE_VALUES[gun.type] : BASE_VALUES['Pistol'];

  // Get brand multiplier
  const brandMultiplier = gun.make
    ? BRAND_MULTIPLIERS[gun.make] || BRAND_MULTIPLIERS['default']
    : BRAND_MULTIPLIERS['default'];

  // Get caliber multiplier
  const caliberMultiplier = gun.caliber
    ? CALIBER_MULTIPLIERS[gun.caliber] || CALIBER_MULTIPLIERS['default']
    : CALIBER_MULTIPLIERS['default'];

  // Get condition multiplier
  const conditionMultiplier = gun.condition
    ? CONDITION_MULTIPLIERS[gun.condition]
    : CONDITION_MULTIPLIERS['Good'];

  // Get action multiplier
  const actionMultiplier = gun.action
    ? ACTION_MULTIPLIERS[gun.action]
    : 1.0;

  // NFA items command premium
  const nfaMultiplier = gun.nfaItem ? 1.8 : 1.0;

  // Calculate FMV
  const estimatedFMV = Math.round(
    baseValue *
    brandMultiplier *
    caliberMultiplier *
    conditionMultiplier *
    actionMultiplier *
    nfaMultiplier
  );

  // Insurance value is typically 15-20% higher than FMV
  const insuranceValue = Math.round(estimatedFMV * 1.15);

  return { estimatedFMV, insuranceValue };
}

/**
 * Calculate depreciation based on age
 */
function calculateAgeDegradation(acquiredDate?: string): number {
  if (!acquiredDate) return 1.0;

  try {
    const acquired = new Date(acquiredDate);
    const now = new Date();
    const ageInYears = (now.getTime() - acquired.getTime()) / (1000 * 60 * 60 * 24 * 365);

    // Guns typically appreciate or hold value if well-maintained
    // Minimal degradation for modern firearms in good condition
    if (ageInYears < 5) return 1.0;
    if (ageInYears < 10) return 0.98;
    if (ageInYears < 20) return 0.95;

    // Older guns may be collectible
    return 0.95;
  } catch {
    return 1.0;
  }
}

/**
 * Update gun with market values if not already set
 */
export function enrichGunWithMarketValue(gun: Gun): Gun {
  if (gun.estimatedFMV && gun.insuranceValue) {
    return gun;
  }

  const values = estimateMarketValue(gun);
  return {
    ...gun,
    estimatedFMV: values.estimatedFMV,
    insuranceValue: values.insuranceValue,
    fmvUpdated: new Date().toISOString()
  };
}

/**
 * Batch update all guns with market values
 */
export function enrichAllGunsWithMarketValues(guns: Gun[]): Gun[] {
  return guns.map(enrichGunWithMarketValue);
}
