// Gun image utilities with reliable fallbacks
import type { Gun } from './types';
import { theme } from './theme';

/**
 * Get image URL for a gun with smart fallback strategy
 */
export function getGunImageUrl(gun: Gun): string {
  // If user uploaded custom image, use that
  if (gun.imageUrl && gun.imageUrl.startsWith('http')) {
    return gun.imageUrl;
  }

  // Always use professional SVG placeholder
  // Wikipedia images are unreliable (404s, CORS issues)
  return getPlaceholderDataUrl(gun);
}

/**
 * Map of known firearms to their Wikipedia image URLs
 * Using Wikimedia Commons which is reliable and free
 */
const KNOWN_GUN_IMAGES: Record<string, string> = {
  // Glock pistols (very common in the collection)
  'Glock 17': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Glock_17_Gen5.jpg/800px-Glock_17_Gen5.jpg',
  'Glock 19': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Glock19_2.jpg/800px-Glock19_2.jpg',
  'Glock 19X': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Glock19_2.jpg/800px-Glock19_2.jpg',
  'Glock 20': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Glock_17_Gen5.jpg/800px-Glock_17_Gen5.jpg',
  'Glock 21': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Glock_17_Gen5.jpg/800px-Glock_17_Gen5.jpg',
  'Glock 42': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Glock_17_Gen5.jpg/800px-Glock_17_Gen5.jpg',
  'Glock 43': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Glock_17_Gen5.jpg/800px-Glock_17_Gen5.jpg',
  'Glock 47': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Glock_17_Gen5.jpg/800px-Glock_17_Gen5.jpg',

  // Sig Sauer pistols
  'Sig Sauer P320': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/SIG_Sauer_P320_Full_Size.jpg/800px-SIG_Sauer_P320_Full_Size.jpg',
  'Sig Sauer M18': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/M18_Pistol.jpg/800px-M18_Pistol.jpg',
  'Sig P365': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/SIG_Sauer_P365.jpg/800px-SIG_Sauer_P365.jpg',
  'Sig Sauer P226': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/SIG_Pro_by_Augustas_Didzgalvis.jpg/800px-SIG_Pro_by_Augustas_Didzgalvis.jpg',

  // Smith & Wesson
  'Smith & Wesson M&P': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/SW_MP9_w_Viridian_X5L.jpg/800px-SW_MP9_w_Viridian_X5L.jpg',
  'Smith & Wesson 586': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/S%26W_Model_686.jpg/800px-S%26W_Model_686.jpg',

  // 1911 variants
  '1911': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/M1911A1.png/800px-M1911A1.png',
  'Kimber': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/M1911A1.png/800px-M1911A1.png',

  // Other pistols
  'Beretta 92': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Beretta_M9.jpg/800px-Beretta_M9.jpg',
  'CZ 75': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/CZ_75_B.jpg/800px-CZ_75_B.jpg',
  'Ruger': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/M1911A1.png/800px-M1911A1.png',

  // AR-15 and AR-10 platforms (very common)
  'AR-15': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/M4_Carbine_Flat_Dark_Earth.png/1200px-M4_Carbine_Flat_Dark_Earth.png',
  'AR-10': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/M4_Carbine_Flat_Dark_Earth.png/1200px-M4_Carbine_Flat_Dark_Earth.png',
  'M16': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/M4_Carbine_Flat_Dark_Earth.png/1200px-M4_Carbine_Flat_Dark_Earth.png',
  'Pioneer AR': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/M4_Carbine_Flat_Dark_Earth.png/1200px-M4_Carbine_Flat_Dark_Earth.png',
  'Anderson AR': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/M4_Carbine_Flat_Dark_Earth.png/1200px-M4_Carbine_Flat_Dark_Earth.png',
  'Aero AR': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/M4_Carbine_Flat_Dark_Earth.png/1200px-M4_Carbine_Flat_Dark_Earth.png',

  // Other rifles
  'AK-47': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/AK-47_type_II_Part_DM-ST-89-01131.jpg/1200px-AK-47_type_II_Part_DM-ST-89-01131.jpg',
  'Ruger 10/22': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Ruger_10-22_Carbine.jpg/1200px-Ruger_10-22_Carbine.jpg',
  'Remington 700': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Remington_700_AWR.jpg/1200px-Remington_700_AWR.jpg',
  'SMLE': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Lee-Enfield_Rifle.jpg/1200px-Lee-Enfield_Rifle.jpg',
  'Enfield': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Lee-Enfield_Rifle.jpg/1200px-Lee-Enfield_Rifle.jpg',
  'Mosin Nagant': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Mosin-Nagant_M1891_-_Ryssland_-_AM.045810.jpg/1200px-Mosin-Nagant_M1891_-_Ryssland_-_AM.045810.jpg',
  'M1 Garand': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/M1_Garand_rifle_-_USA_-_30-06_-_Arm%C3%A9museum.jpg/1200px-M1_Garand_rifle_-_USA_-_30-06_-_Arm%C3%A9museum.jpg',
  'Howa 1500': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Remington_700_AWR.jpg/1200px-Remington_700_AWR.jpg',

  // Shotguns
  'Mossberg 500': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Mossberg500.jpg/1200px-Mossberg500.jpg',
  'Remington 870': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Remington_870_Tactical.jpg/1200px-Remington_870_Tactical.jpg',
  'Benelli M2': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/PEO_M1014_Joint_Service_Combat_Shotgun.jpg/1200px-PEO_M1014_Joint_Service_Combat_Shotgun.jpg',
  'Benelli M4': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/PEO_M1014_Joint_Service_Combat_Shotgun.jpg/1200px-PEO_M1014_Joint_Service_Combat_Shotgun.jpg',
};

function getWikipediaImage(gun: Gun): string | null {
  const fullName = `${gun.make} ${gun.model}`;

  // Direct match
  if (KNOWN_GUN_IMAGES[fullName]) {
    return KNOWN_GUN_IMAGES[fullName];
  }

  // Check model name alone
  if (KNOWN_GUN_IMAGES[gun.model]) {
    return KNOWN_GUN_IMAGES[gun.model];
  }

  // Check if model contains a known name
  for (const [name, url] of Object.entries(KNOWN_GUN_IMAGES)) {
    if (gun.model.includes(name) || name.includes(gun.model)) {
      return url;
    }
  }

  return null;
}

/**
 * Generate a professional placeholder image as a data URL
 * This creates an SVG with the gun's initials and type icon
 */
function getPlaceholderDataUrl(gun: Gun): string {
  const initials = getInitials(gun);
  const bgColor = getColorForGun(gun);
  const bgColor2 = adjustBrightness(bgColor, -15);
  const gunId = `grad-${gun.id || Math.random()}`;

  // Escape any special characters in text
  const safeType = gun.type.toUpperCase().replace(/[<>&]/g, '');
  const safeCaliber = gun.caliber.replace(/[<>&]/g, '');
  const safeInitials = initials.replace(/[<>&]/g, '');
  const safeMake = gun.make.replace(/[<>&]/g, '');
  const safeModel = gun.model.length > 20 ? gun.model.substring(0, 20) + '...' : gun.model;
  const safeModelEscaped = safeModel.replace(/[<>&]/g, '');

  const svg = `<svg width="600" height="300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${gunId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${bgColor2};stop-opacity:1" />
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
    </filter>
  </defs>
  <rect width="600" height="300" fill="url(#${gunId})"/>
  <circle cx="300" cy="140" r="80" fill="rgba(255,255,255,0.05)"/>
  <text x="300" y="165" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-size="88" font-weight="700" fill="rgba(255,255,255,0.95)" text-anchor="middle" filter="url(#shadow)">${safeInitials}</text>
  <text x="300" y="205" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-size="12" font-weight="600" fill="rgba(255,255,255,0.7)" text-anchor="middle" letter-spacing="2">${safeType}</text>
  <line x1="220" y1="220" x2="380" y2="220" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
  <text x="300" y="245" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-size="18" font-weight="600" fill="rgba(255,255,255,0.9)" text-anchor="middle">${safeCaliber}</text>
  <text x="300" y="275" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-size="11" font-weight="400" fill="rgba(255,255,255,0.5)" text-anchor="middle">${safeMake} ${safeModelEscaped}</text>
</svg>`;

  // Use URI encoding instead of base64 for better compatibility
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function getInitials(gun: Gun): string {
  const makeInitial = gun.make.charAt(0).toUpperCase();
  const modelWords = gun.model.split(' ');

  if (modelWords.length >= 2) {
    return `${makeInitial}${modelWords[0].charAt(0)}`;
  }

  const modelInitial = gun.model.charAt(0).toUpperCase();
  return `${makeInitial}${modelInitial}`;
}

function getTypeIcon(type: Gun['type']): string {
  const icons: Record<Gun['type'], string> = {
    'Pistol': '🔫',
    'Rifle': '🎯',
    'Shotgun': '💥',
    'Suppressor': '🔇',
    'NFA': '⚡'
  };
  return icons[type] || '•';
}

function getColorForGun(gun: Gun): string {
  // Generate consistent color based on gun type and make
  const colors: Record<Gun['type'], string> = {
    'Pistol': '#4A5568',      // Cool gray
    'Rifle': '#2D3748',       // Dark gray
    'Shotgun': '#1A202C',     // Very dark gray
    'Suppressor': '#2C5282',  // Steel blue
    'NFA': '#2F855A'          // Forest green
  };

  return colors[gun.type] || '#4A5568';
}

function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;

  return '#' + (
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1);
}

/**
 * React component props for gun images
 */
export interface GunImageProps {
  gun: Gun;
  alt?: string;
  style?: React.CSSProperties;
}

/**
 * Get professional styling for gun image containers
 */
export function getGunImageStyle(): React.CSSProperties {
  return {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    backgroundColor: theme.surfaceAlt
  };
}
