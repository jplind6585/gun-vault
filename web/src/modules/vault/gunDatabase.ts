// Known gun makes, models, and their specs for autocomplete + auto-fill
import type { Gun } from './types';

export const KNOWN_MAKES = [
  'Barrett', 'BCM (Bravo Company)', 'Benelli', 'Beretta', 'Browning',
  'Canik', 'CZ', 'Colt', 'Daniel Defense', 'Desert Eagle / Magnum Research',
  'FN (FN Herstal)', 'Glock', 'H&K (Heckler & Koch)', 'Henry',
  'IWI', 'Kahr', 'Kel-Tec', 'Kimber', 'LaRue Tactical', 'LWRC',
  'Marlin', 'Mossberg', 'Nighthawk Custom', 'Palmetto State Armory',
  'Remington', 'Rock River Arms', 'Ruger', 'Savage Arms', 'Sig Sauer',
  'Smith & Wesson', 'Springfield Armory', 'Staccato', 'Taurus',
  'Tikka', 'Walther', 'Wilson Combat', 'Winchester',
];

type GunSpec = {
  caliber: string;
  type: Gun['type'];
  action: Gun['action'];
  capacity?: number;
};

// make (lowercase) -> model (lowercase) -> spec
export const GUN_SPECS: Record<string, Record<string, GunSpec>> = {
  glock: {
    'g17': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 17 },
    'g17 gen5': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 17 },
    'g19': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 15 },
    'g19 gen5': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 15 },
    'g19x': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 19 },
    'g20': { caliber: '10mm', type: 'Pistol', action: 'Semi-Auto', capacity: 15 },
    'g21': { caliber: '.45 ACP', type: 'Pistol', action: 'Semi-Auto', capacity: 13 },
    'g22': { caliber: '.40 S&W', type: 'Pistol', action: 'Semi-Auto', capacity: 15 },
    'g23': { caliber: '.40 S&W', type: 'Pistol', action: 'Semi-Auto', capacity: 13 },
    'g26': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 10 },
    'g27': { caliber: '.40 S&W', type: 'Pistol', action: 'Semi-Auto', capacity: 9 },
    'g34': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 17 },
    'g43': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 6 },
    'g43x': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 10 },
    'g45': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 17 },
    'g48': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 10 },
  },
  'sig sauer': {
    'p226': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 15 },
    'p229': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 15 },
    'p320': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 17 },
    'p320 compact': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 15 },
    'p320 xcarry': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 17 },
    'p365': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 10 },
    'p365xl': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 12 },
    'p365x': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 12 },
    'p938': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 6 },
    'p238': { caliber: '.380 ACP', type: 'Pistol', action: 'Semi-Auto', capacity: 6 },
    'p210': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 8 },
    'mcx': { caliber: '5.56 NATO', type: 'Rifle', action: 'Semi-Auto' },
    'mpx': { caliber: '9mm', type: 'Rifle', action: 'Semi-Auto' },
  },
  'smith & wesson': {
    'm&p 9': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 17 },
    'm&p 9 2.0': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 17 },
    'm&p 40': { caliber: '.40 S&W', type: 'Pistol', action: 'Semi-Auto', capacity: 15 },
    'm&p shield 9': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 8 },
    'm&p shield plus': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 13 },
    '686': { caliber: '.357 Magnum', type: 'Pistol', action: 'Revolver', capacity: 6 },
    '629': { caliber: '.44 Magnum', type: 'Pistol', action: 'Revolver', capacity: 6 },
    '442': { caliber: '.38 Special', type: 'Pistol', action: 'Revolver', capacity: 5 },
    '642': { caliber: '.38 Special +P', type: 'Pistol', action: 'Revolver', capacity: 5 },
  },
  'springfield armory': {
    '1911 loaded': { caliber: '.45 ACP', type: 'Pistol', action: 'Semi-Auto', capacity: 8 },
    '1911 mil-spec': { caliber: '.45 ACP', type: 'Pistol', action: 'Semi-Auto', capacity: 7 },
    'hellcat': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 11 },
    'hellcat pro': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 15 },
    'xd-9': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 16 },
    'xdm 9': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 19 },
    'echelon': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 17 },
  },
  ruger: {
    'lcp ii': { caliber: '.380 ACP', type: 'Pistol', action: 'Semi-Auto', capacity: 6 },
    'lc9s': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 7 },
    'max-9': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 10 },
    'security-9': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 15 },
    'american pistol': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 17 },
    'gp100': { caliber: '.357 Magnum', type: 'Pistol', action: 'Revolver', capacity: 6 },
    'sp101': { caliber: '.357 Magnum', type: 'Pistol', action: 'Revolver', capacity: 5 },
    'precision rifle': { caliber: '6.5 Creedmoor', type: 'Rifle', action: 'Bolt' },
    'american rifle': { caliber: '.308 Win', type: 'Rifle', action: 'Bolt' },
    '10/22': { caliber: '.22 LR', type: 'Rifle', action: 'Semi-Auto', capacity: 10 },
    'mini-14': { caliber: '5.56 NATO', type: 'Rifle', action: 'Semi-Auto', capacity: 20 },
    'pc carbine': { caliber: '9mm', type: 'Rifle', action: 'Semi-Auto', capacity: 17 },
  },
  colt: {
    '1911': { caliber: '.45 ACP', type: 'Pistol', action: 'Semi-Auto', capacity: 7 },
    'python': { caliber: '.357 Magnum', type: 'Pistol', action: 'Revolver', capacity: 6 },
    'anaconda': { caliber: '.44 Magnum', type: 'Pistol', action: 'Revolver', capacity: 6 },
    'm4 carbine': { caliber: '5.56 NATO', type: 'Rifle', action: 'Semi-Auto' },
    'le6920': { caliber: '5.56 NATO', type: 'Rifle', action: 'Semi-Auto' },
  },
  beretta: {
    '92fs': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 15 },
    'm9': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 15 },
    'apx': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 17 },
    'apx a1 carry': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 8 },
    'px4 storm': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 17 },
    'a300 outlander': { caliber: '12 Gauge', type: 'Shotgun', action: 'Semi-Auto' },
  },
  'h&k': {
    'vp9': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 15 },
    'vp40': { caliber: '.40 S&W', type: 'Pistol', action: 'Semi-Auto', capacity: 13 },
    'p30': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 15 },
    'usp': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 15 },
    'usp compact': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 13 },
    'p2000': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 13 },
    'hk45': { caliber: '.45 ACP', type: 'Pistol', action: 'Semi-Auto', capacity: 10 },
    'mk23': { caliber: '.45 ACP', type: 'Pistol', action: 'Semi-Auto', capacity: 12 },
    '416': { caliber: '5.56 NATO', type: 'Rifle', action: 'Semi-Auto' },
  },
  fn: {
    'fn 509': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 17 },
    'fn 509 compact': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 12 },
    'fn 509 midsize': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 15 },
    'five-seven': { caliber: '5.7x28mm', type: 'Pistol', action: 'Semi-Auto', capacity: 20 },
    'fns 9': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 17 },
    'scar 16s': { caliber: '5.56 NATO', type: 'Rifle', action: 'Semi-Auto' },
    'scar 17s': { caliber: '.308 Win', type: 'Rifle', action: 'Semi-Auto' },
  },
  'daniel defense': {
    'ddm4 v7': { caliber: '5.56 NATO', type: 'Rifle', action: 'Semi-Auto' },
    'ddm4 v11': { caliber: '5.56 NATO', type: 'Rifle', action: 'Semi-Auto' },
    'delta 5': { caliber: '6.5 Creedmoor', type: 'Rifle', action: 'Bolt' },
    'ddm4 pdw': { caliber: '300 Blackout', type: 'Rifle', action: 'Semi-Auto' },
  },
  mossberg: {
    '500': { caliber: '12 Gauge', type: 'Shotgun', action: 'Pump' },
    '590': { caliber: '12 Gauge', type: 'Shotgun', action: 'Pump' },
    '590a1': { caliber: '12 Gauge', type: 'Shotgun', action: 'Pump' },
    '930': { caliber: '12 Gauge', type: 'Shotgun', action: 'Semi-Auto' },
    '590m': { caliber: '12 Gauge', type: 'Shotgun', action: 'Pump' },
  },
  remington: {
    '870': { caliber: '12 Gauge', type: 'Shotgun', action: 'Pump' },
    '870 express': { caliber: '12 Gauge', type: 'Shotgun', action: 'Pump' },
    '700': { caliber: '.308 Win', type: 'Rifle', action: 'Bolt' },
    '700 adl': { caliber: '.308 Win', type: 'Rifle', action: 'Bolt' },
    '700 bdl': { caliber: '.308 Win', type: 'Rifle', action: 'Bolt' },
  },
  benelli: {
    'm4': { caliber: '12 Gauge', type: 'Shotgun', action: 'Semi-Auto' },
    'm2': { caliber: '12 Gauge', type: 'Shotgun', action: 'Semi-Auto' },
    'supernova': { caliber: '12 Gauge', type: 'Shotgun', action: 'Pump' },
    'nova': { caliber: '12 Gauge', type: 'Shotgun', action: 'Pump' },
  },
  henry: {
    'big boy': { caliber: '.357 Magnum', type: 'Rifle', action: 'Lever' },
    'big boy steel': { caliber: '.357 Magnum', type: 'Rifle', action: 'Lever' },
    'golden boy': { caliber: '.22 LR', type: 'Rifle', action: 'Lever' },
    'long ranger': { caliber: '.308 Win', type: 'Rifle', action: 'Lever' },
    'x model': { caliber: '.357 Magnum', type: 'Rifle', action: 'Lever' },
  },
  taurus: {
    'g2c': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 12 },
    'g3': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 15 },
    'g3c': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 12 },
    'tx22': { caliber: '.22 LR', type: 'Pistol', action: 'Semi-Auto', capacity: 16 },
    '856': { caliber: '.38 Special', type: 'Pistol', action: 'Revolver', capacity: 6 },
    '692': { caliber: '.357 Magnum', type: 'Pistol', action: 'Revolver', capacity: 7 },
    'judge': { caliber: '.410/.45 Colt', type: 'Pistol', action: 'Revolver', capacity: 5 },
  },
  walther: {
    'pdp': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 18 },
    'pdp compact': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 15 },
    'ppq m2': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 15 },
    'pps m2': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 7 },
    'creed': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 16 },
  },
  kimber: {
    'custom ii': { caliber: '.45 ACP', type: 'Pistol', action: 'Semi-Auto', capacity: 7 },
    'pro carry ii': { caliber: '.45 ACP', type: 'Pistol', action: 'Semi-Auto', capacity: 7 },
    'ultra carry ii': { caliber: '.45 ACP', type: 'Pistol', action: 'Semi-Auto', capacity: 7 },
    'micro 9': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 7 },
  },
  canik: {
    'tp9sf': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 18 },
    'tp9sfx': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 20 },
    'tp9sa': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 18 },
    'mete sft': { caliber: '9mm', type: 'Pistol', action: 'Semi-Auto', capacity: 18 },
  },
};

// Sense check: common mistakes → suggested correction
export const SENSE_CHECKS: Array<{ make: string; model: string; suggestion: string }> = [
  { make: 'glock', model: 'g19c', suggestion: 'Did you mean Glock G19X? The G19C (compensated) was discontinued. The G19X is the current crossover model.' },
  { make: 'glock', model: '19', suggestion: 'Looks like you mean the Glock G19 — add the "G" prefix for accuracy.' },
  { make: 'glock', model: '17', suggestion: 'Looks like you mean the Glock G17.' },
  { make: 'sig sauer', model: 'p320 m17', suggestion: 'The SIG P320 M17 is the military variant — just confirming you mean the civilian M17?' },
  { make: 'smith & wesson', model: 'm&p 2.0', suggestion: 'Did you mean M&P 9 2.0, M&P 40 2.0, or M&P 45 2.0? The caliber helps differentiate.' },
  { make: 'remington', model: '700 sps', suggestion: 'The Remington 700 SPS is a great bolt-gun. What caliber?' },
];

/** Look up specs for a known make + model. Returns null if not found. */
export function lookupGunSpec(make: string, model: string): GunSpec | null {
  const makeKey = make.toLowerCase().trim();
  const modelKey = model.toLowerCase().trim();
  const makeSpecs = GUN_SPECS[makeKey];
  if (!makeSpecs) return null;
  // Exact match first
  if (makeSpecs[modelKey]) return makeSpecs[modelKey];
  // Partial match: model starts with or contains the key
  for (const [key, spec] of Object.entries(makeSpecs)) {
    if (modelKey.startsWith(key) || key.startsWith(modelKey)) return spec;
  }
  return null;
}

/** Get sense check message for a given make + model. Returns null if none. */
export function getSenseCheck(make: string, model: string): string | null {
  const makeKey = make.toLowerCase().trim();
  const modelKey = model.toLowerCase().trim();
  const match = SENSE_CHECKS.find(c =>
    c.make === makeKey && (modelKey.includes(c.model) || c.model.includes(modelKey))
  );
  return match?.suggestion ?? null;
}

/** Filter makes list by partial input */
export function suggestMakes(input: string): string[] {
  if (!input || input.length < 1) return [];
  const lower = input.toLowerCase();
  return KNOWN_MAKES.filter(m => m.toLowerCase().startsWith(lower) || m.toLowerCase().includes(lower)).slice(0, 6);
}

/** Get model suggestions for a given make prefix */
export function suggestModels(make: string, modelInput: string): string[] {
  if (!make || !modelInput || modelInput.length < 1) return [];
  const makeKey = make.toLowerCase().trim();
  const makeSpecs = GUN_SPECS[makeKey];
  if (!makeSpecs) return [];
  const lower = modelInput.toLowerCase();
  return Object.keys(makeSpecs)
    .filter(m => m.startsWith(lower) || m.includes(lower))
    .map(m => m.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '))
    .slice(0, 6);
}
