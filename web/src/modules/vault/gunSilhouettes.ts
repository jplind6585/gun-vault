// Gun silhouette SVG paths for different firearm types
import type { Gun } from './types';

// Cleaner, more recognizable gun silhouettes (viewBox: 0 0 200 100)
export const GUN_SILHOUETTES: Record<string, string> = {
  // AR-15 / M4 Style - Modern tactical rifle with pistol grip
  'ar': 'M10,42 L20,42 L20,38 L30,38 L30,35 L40,35 L40,38 L60,38 L65,33 L75,33 L80,38 L100,38 L105,33 L125,33 L135,38 L155,38 L160,33 L175,33 L178,36 L190,36 L190,46 L178,46 L175,49 L160,49 L155,44 L135,44 L125,49 L105,49 L100,44 L80,44 L75,49 L65,49 L60,44 L40,44 L40,47 L30,47 L30,44 L20,44 L20,40 L10,40 Z M35,40 L45,40 L45,42 L35,42 Z',

  // AK-47 / AK Platform
  'ak': 'M12,46 L20,46 L20,43 L28,43 L28,40 L35,40 L38,43 L45,43 L48,40 L55,40 L58,43 L65,43 L68,40 L75,40 L78,43 L85,43 L85,50 L78,50 L75,53 L68,53 L65,50 L58,50 L55,53 L48,53 L45,50 L38,50 L35,53 L28,53 L28,50 L20,50 L20,47 L12,47 Z M48,46 L52,46 L52,47 L48,47 Z',

  // Pump Action Shotgun
  'pump_shotgun': 'M10,44 L18,44 L18,42 L25,42 L25,40 L35,40 L35,43 L45,43 L45,40 L55,40 L58,43 L75,43 L78,40 L85,40 L88,43 L88,50 L85,50 L82,53 L75,53 L72,50 L58,50 L55,53 L45,53 L45,50 L35,50 L35,53 L25,53 L25,51 L18,51 L18,49 L10,49 Z',

  // Semi-Auto Shotgun
  'auto_shotgun': 'M10,45 L20,45 L20,43 L30,43 L30,40 L40,40 L43,43 L50,43 L53,40 L65,40 L68,43 L80,43 L83,40 L88,40 L88,48 L83,48 L80,51 L68,51 L65,48 L53,48 L50,51 L43,51 L40,48 L30,48 L30,51 L20,51 L20,49 L10,49 Z',

  // Revolver
  'revolver': 'M15,43 L25,43 L25,40 L32,40 L35,43 L40,43 L40,38 L45,38 L48,41 L60,41 L60,52 L48,52 L45,49 L40,49 L40,45 L35,45 L32,48 L25,48 L25,45 L15,45 Z M45,43 C45,41 47,41 47,43 C47,45 45,45 45,43 Z',

  // 1911 Style Pistol
  '1911': 'M15,42 L25,42 L25,40 L35,40 L35,38 L42,38 L45,41 L58,41 L58,52 L45,52 L42,49 L35,49 L35,47 L25,47 L25,45 L15,45 Z M42,43 L46,43 L46,46 L42,46 Z',

  // Modern Semi-Auto Pistol (Glock style)
  'pistol': 'M15,43 L28,43 L28,40 L38,40 L38,38 L45,38 L48,41 L62,41 L62,52 L48,52 L45,49 L38,49 L38,47 L28,47 L28,44 L15,44 Z M45,43 L48,43 L48,46 L45,46 Z',

  // Bolt Action Rifle
  'bolt': 'M12,44 L22,44 L22,42 L32,42 L32,40 L42,40 L45,43 L58,43 L58,40 L68,40 L71,43 L82,43 L85,40 L88,40 L88,48 L85,48 L82,51 L71,51 L68,48 L58,48 L58,51 L45,51 L42,48 L32,48 L32,46 L22,46 L22,44 L12,44 Z M62,44 L66,44 L66,47 L62,47 Z',

  // Lever Action Rifle
  'lever': 'M10,43 L20,43 L20,41 L30,41 L30,39 L40,39 L43,42 L55,42 L55,39 L65,39 L68,42 L80,42 L83,39 L88,39 L88,47 L83,47 L80,50 L68,50 L65,47 L55,47 L55,50 L43,50 L40,47 L30,47 L30,45 L20,45 L20,43 L10,43 Z M48,44 L52,44 L52,45 L48,45 Z',

  // Milsurp Rifle (Mosin/M1 Garand style)
  'milsurp': 'M8,44 L18,44 L18,42 L28,42 L28,40 L38,40 L41,43 L52,43 L52,40 L62,40 L65,43 L78,43 L81,40 L88,40 L88,48 L81,48 L78,51 L65,51 L62,48 L52,48 L52,51 L41,51 L38,48 L28,48 L28,46 L18,46 L18,44 L8,44 Z',

  // PCC (Pistol Caliber Carbine)
  'pcc': 'M12,44 L22,44 L22,42 L30,42 L30,39 L38,39 L41,42 L48,42 L48,39 L58,39 L61,42 L72,42 L75,39 L82,39 L85,42 L85,50 L82,50 L79,53 L72,53 L69,50 L61,50 L58,53 L48,53 L48,50 L41,50 L38,53 L30,53 L30,50 L22,50 L22,48 L12,48 Z M48,45 L52,45 L52,46 L48,46 Z',

  // SMG / Submachine Gun
  'smg': 'M15,43 L25,43 L25,41 L32,41 L32,38 L40,38 L43,41 L50,41 L50,38 L60,38 L63,41 L75,41 L78,38 L82,38 L85,41 L85,52 L82,52 L79,55 L75,55 L72,52 L63,52 L60,55 L50,55 L50,52 L43,52 L40,55 L32,55 L32,52 L25,52 L25,50 L15,50 Z',

  // Bullpup Rifle
  'bullpup': 'M15,43 L28,43 L28,40 L40,40 L43,43 L55,43 L58,40 L70,40 L73,43 L85,43 L85,50 L73,50 L70,53 L58,53 L55,50 L43,50 L40,53 L28,53 L28,50 L15,50 Z M62,45 L66,45 L66,48 L62,48 Z',

  // Break Action Shotgun
  'break_shotgun': 'M12,44 L22,44 L22,42 L35,42 L35,40 L50,40 L53,43 L70,43 L73,40 L85,40 L88,43 L88,50 L85,50 L82,53 L70,53 L67,50 L53,50 L50,53 L35,53 L35,51 L22,51 L22,49 L12,49 Z M55,44 L58,44 L58,49 L55,49 Z',

  // Sniper Rifle / Long Range
  'sniper': 'M8,44 L18,44 L18,42 L28,42 L28,40 L38,40 L41,43 L52,43 L52,40 L65,40 L68,43 L80,43 L83,40 L90,40 L92,43 L92,50 L90,50 L87,53 L80,53 L77,50 L68,50 L65,53 L52,53 L52,50 L41,50 L38,53 L28,53 L28,51 L18,51 L18,49 L8,49 Z M70,44 L74,44 L74,49 L70,49 Z',

  // PDW / Compact Rifle
  'pdw': 'M18,43 L28,43 L28,41 L38,41 L38,38 L45,38 L48,41 L58,41 L61,38 L72,38 L75,41 L82,41 L85,38 L88,38 L88,55 L85,55 L82,52 L75,52 L72,55 L61,55 L58,52 L48,52 L45,55 L38,55 L38,52 L28,52 L28,50 L18,50 Z',

  // Competition Pistol (Race gun)
  'competition': 'M15,42 L30,42 L30,40 L42,40 L42,37 L50,37 L53,40 L68,40 L68,53 L53,53 L50,50 L42,50 L42,47 L30,47 L30,45 L15,45 Z M50,42 L54,42 L54,48 L50,48 Z',

  // Tactical Shotgun
  'tactical_shotgun': 'M10,44 L20,44 L20,42 L30,42 L30,39 L42,39 L45,42 L52,42 L52,39 L65,39 L68,42 L82,42 L85,39 L88,39 L88,54 L85,54 L82,51 L68,51 L65,54 L52,54 L52,51 L45,51 L42,54 L30,54 L30,51 L20,51 L20,49 L10,49 Z',

  // Suppressor / Silencer (for NFA items)
  'suppressor': 'M20,42 L35,42 L35,40 L88,40 L88,53 L35,53 L35,51 L20,51 Z M40,44 L45,44 L45,49 L40,49 Z M50,44 L55,44 L55,49 L50,49 Z M60,44 L65,44 L65,49 L60,49 Z M70,44 L75,44 L75,49 L70,49 Z M80,44 L85,44 L85,49 L80,49 Z',

  // Generic Rifle (fallback)
  'rifle': 'M10,44 L20,44 L20,42 L30,42 L30,40 L40,40 L43,43 L55,43 L55,40 L68,40 L71,43 L85,43 L88,40 L88,48 L85,48 L82,51 L71,51 L68,48 L55,48 L55,51 L43,51 L40,48 L30,48 L30,46 L20,46 L20,44 L10,44 Z',

  // Generic Shotgun (fallback)
  'shotgun': 'M10,44 L20,44 L20,42 L32,42 L32,40 L45,40 L48,43 L62,43 L65,40 L82,40 L85,43 L88,43 L88,50 L85,50 L82,53 L65,53 L62,50 L48,50 L45,53 L32,53 L32,51 L20,51 L20,49 L10,49 Z',
};

// Map gun types and models to appropriate silhouettes
export function getGunSilhouette(gun: Gun): string {
  const model = gun.model.toLowerCase();
  const make = gun.make.toLowerCase();
  const type = gun.type.toLowerCase();

  // Specific model matching
  if (model.includes('ar-15') || model.includes('ar15') || model.includes('m4') || model.includes('m16')) {
    return GUN_SILHOUETTES.ar;
  }
  if (model.includes('ar-10') || model.includes('ar10')) {
    return GUN_SILHOUETTES.ar;
  }
  if (model.includes('ak-47') || model.includes('ak47') || model.includes('ak-74')) {
    return GUN_SILHOUETTES.ak;
  }
  if (model.includes('1911')) {
    return GUN_SILHOUETTES['1911'];
  }
  if (model.includes('glock') || model.includes('p365') || model.includes('m&p') || model.includes('p320')) {
    return GUN_SILHOUETTES.pistol;
  }
  if (model.includes('revolver') || model.includes('python') || model.includes('686') || model.includes('586')) {
    return GUN_SILHOUETTES.revolver;
  }
  if (model.includes('mosin') || model.includes('garand') || model.includes('enfield') || model.includes('mauser') || model.includes('smle')) {
    return GUN_SILHOUETTES.milsurp;
  }
  if (model.includes('700') || model.includes('bergara') || model.includes('tikka') || model.includes('howa')) {
    return GUN_SILHOUETTES.bolt;
  }
  if (model.includes('lever') || model.includes('henry') || model.includes('winchester') && model.includes('94')) {
    return GUN_SILHOUETTES.lever;
  }
  if (model.includes('benelli') || model.includes('m2') || model.includes('m4') && type.includes('shotgun')) {
    return GUN_SILHOUETTES.auto_shotgun;
  }
  if (model.includes('mossberg') || model.includes('remington 870') || model.includes('500')) {
    return GUN_SILHOUETTES.pump_shotgun;
  }
  if (model.includes('tavor') || model.includes('aug') || model.includes('p90')) {
    return GUN_SILHOUETTES.bullpup;
  }
  if (model.includes('pcc') || model.includes('sub-2000') || model.includes('cx4')) {
    return GUN_SILHOUETTES.pcc;
  }
  if (model.includes('mpx') || model.includes('mp5') || model.includes('uzi')) {
    return GUN_SILHOUETTES.smg;
  }

  // NFA items
  if (gun.nfaItem || type.includes('suppressor')) {
    return GUN_SILHOUETTES.suppressor;
  }

  // Type-based fallbacks
  if (type.includes('pistol')) {
    return GUN_SILHOUETTES.pistol;
  }
  if (type.includes('rifle')) {
    return GUN_SILHOUETTES.rifle;
  }
  if (type.includes('shotgun')) {
    return GUN_SILHOUETTES.shotgun;
  }

  // Ultimate fallback
  return GUN_SILHOUETTES.rifle;
}
