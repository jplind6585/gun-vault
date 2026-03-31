import XLSX from 'xlsx';
import fs from 'fs';

const workbook = XLSX.readFile('/Users/banner-james/Downloads/ammo_inventory_v2.xlsx');
const sheet = workbook.Sheets['Full Inventory'];
const data = XLSX.utils.sheet_to_json(sheet);

console.log(`Found ${data.length} ammo lots in inventory`);

// Comprehensive muzzle velocity lookup table (fps)
// Based on manufacturer data and industry standards
const velocityLookup = {
  '.22 LR': {
    '30': 1750, // hyper velocity
    '32': 1640,
    '36': 1280,
    '38': 1280,
    '40': 1200, // standard/high velocity
    '42': 1255,
    '45': 1085  // subsonic
  },
  '9mm Luger': {
    '90': 1475,
    '100': 1180,
    '115': 1180,
    '124': 1150,
    '135': 1050,
    '147': 990,
    '150': 950
  },
  '.40 S&W': {
    '135': 1140,
    '155': 1200,
    '165': 1150,
    '180': 1050
  },
  '.45 ACP': {
    '185': 1050,
    '200': 975,
    '230': 850
  },
  '.380 ACP': {
    '90': 1000,
    '95': 960
  },
  '5.56x45mm': {
    '55': 3240,
    '62': 3100,
    '69': 2850,
    '75': 2750,
    '77': 2750
  },
  '.223 Remington': {
    '40': 3800,
    '55': 3240,
    '62': 3100,
    '69': 2850,
    '75': 2750,
    '77': 2720
  },
  '.308 Winchester': {
    '125': 3100,
    '147': 2800,
    '150': 2820,
    '155': 2775,
    '168': 2650,
    '175': 2600,
    '178': 2600
  },
  '7.62x51mm': {
    '147': 2800,
    '150': 2820,
    '168': 2650,
    '175': 2600
  },
  '6.5 Creedmoor': {
    '120': 3000,
    '130': 2960,
    '140': 2710,
    '143': 2700,
    '147': 2695
  },
  '6.5 Grendel': {
    '90': 2750,
    '120': 2600,
    '123': 2580,
    '130': 2450
  },
  '.300 Blackout': {
    '110': 2375,
    '125': 2215,
    '150': 1900,
    '208': 1020  // subsonic
  },
  '7.62x39mm': {
    '122': 2350,
    '123': 2350,
    '124': 2350
  },
  '.30-06 Springfield': {
    '150': 2910,
    '165': 2800,
    '168': 2710,
    '180': 2700
  },
  '.300 Winchester Magnum': {
    '150': 3290,
    '165': 3100,
    '180': 2960,
    '190': 2900,
    '200': 2825
  },
  '.338 Lapua Magnum': {
    '250': 2900,
    '285': 2745,
    '300': 2650
  },
  '7.62x54R': {
    '147': 2800,
    '150': 2800,
    '174': 2600,
    '180': 2575
  },
  '.303 British': {
    '150': 2685,
    '174': 2440,
    '180': 2460
  },
  '.30-30 Winchester': {
    '150': 2390,
    '160': 2400,
    '170': 2200
  },
  '.357 Magnum': {
    '110': 1650,
    '125': 1500,
    '158': 1250,
    '180': 1180
  },
  '.44 Magnum': {
    '180': 1610,
    '240': 1350,
    '300': 1200
  },
  '12 Gauge': {
    '437': 1300,  // 1 oz slug
    '492': 1200,  // 1 1/8 oz slug
    '546': 1150   // 1 1/4 oz slug
  },
  '20 Gauge': {
    '250': 1800,  // 3/4 oz slug
    '273': 1700   // 7/8 oz slug
  },
  '.308 Win': {
    '125': 3100,
    '147': 2800,
    '150': 2820,
    '155': 2775,
    '168': 2650,
    '175': 2600,
    '178': 2600
  },
  '.300 AAC Blackout': {
    '110': 2375,
    '125': 2215,
    '150': 1900,
    '208': 1020
  },
  '.30-30 Win': {
    '150': 2390,
    '160': 2400,
    '170': 2200
  },
  '.30-40 Krag': {
    '180': 2430,
    '220': 2000
  },
  '.32 Auto': {
    '60': 1000,
    '71': 905
  },
  '.32 S&W': {
    '85': 680,
    '98': 705
  },
  '.357 SIG': {
    '115': 1510,
    '124': 1450,
    '125': 1450,
    '147': 1225
  },
  '.375 H&H Mag': {
    '235': 2800,
    '250': 2690,
    '270': 2690,
    '300': 2530
  },
  '.38 Special': {
    '110': 1000,
    '125': 945,
    '130': 950,
    '148': 710,
    '158': 800
  },
  '.380 Auto': {
    '85': 990,
    '90': 1000,
    '95': 960,
    '100': 950
  },
  '.410 Bore': {
    '109': 1775  // 1/4 oz slug
  },
  '.45 ACP / .45 Auto': {
    '185': 1050,
    '200': 975,
    '230': 850
  },
  '.45 Colt': {
    '200': 1000,
    '225': 960,
    '250': 900
  },
  '.45-70 Gov\'t': {
    '300': 1810,
    '325': 1700,
    '405': 1330
  },
  '.50 BMG': {
    '647': 3000,
    '660': 2910,
    '750': 2820
  },
  '10mm Auto': {
    '135': 1400,
    '155': 1265,
    '165': 1250,
    '180': 1180,
    '200': 1050
  },
  '5.7x28mm': {
    '27': 2350,
    '40': 1800
  },
  '6.5x55 SE': {
    '120': 2953,
    '129': 2854,
    '140': 2735,
    '156': 2559
  },
  '7.5x55 Swiss': {
    '165': 2650,
    '174': 2560
  },
  '8mm Mauser': {
    '150': 2880,
    '170': 2360,
    '196': 2500
  },
  '9mm Luger +P': {
    '115': 1250,
    '124': 1200,
    '147': 1050
  }
};

// Calculate muzzle energy: Energy (ft-lbs) = (Velocity² × Grain) / 450240
function calculateMuzzleEnergy(grainWeight, velocityFPS) {
  return Math.round((velocityFPS * velocityFPS * grainWeight) / 450240);
}

// Get velocity for caliber/grain combination
function getVelocity(caliber, grain) {
  const caliberData = velocityLookup[caliber];
  if (!caliberData) {
    console.warn(`⚠️  No velocity data for caliber: ${caliber}`);
    return null;
  }

  const grainStr = String(grain);
  if (caliberData[grainStr]) {
    return caliberData[grainStr];
  }

  // Find closest grain weight
  const grains = Object.keys(caliberData).map(Number);
  const closest = grains.reduce((prev, curr) =>
    Math.abs(curr - grain) < Math.abs(prev - grain) ? curr : prev
  );

  console.log(`   Using ${closest}gr velocity for ${grain}gr ${caliber}`);
  return caliberData[String(closest)];
}

// Determine category based on brand/line
function determineCategory(brand, line) {
  const lineLower = (line || '').toLowerCase();
  const brandLower = brand.toLowerCase();

  // Match grade indicators
  if (lineLower.includes('match') || lineLower.includes('gold medal') ||
      lineLower.includes('black') || lineLower.includes('eld') ||
      lineLower.includes('scenar') || lineLower.includes('berger') ||
      lineLower.includes('sierra matchking') || lineLower.includes('prime')) {
    return 'Match';
  }

  // Self defense indicators
  if (lineLower.includes('hst') || lineLower.includes('hydra') ||
      lineLower.includes('critical defense') || lineLower.includes('critical duty') ||
      lineLower.includes('gold dot') || lineLower.includes('bonded') ||
      lineLower.includes('ranger') || lineLower.includes('golden saber')) {
    return 'Self Defense';
  }

  // Hunting indicators
  if (lineLower.includes('hunting') || lineLower.includes('game') ||
      lineLower.includes('deer') || lineLower.includes('vital-shok') ||
      lineLower.includes('trophy') || lineLower.includes('partition') ||
      lineLower.includes('accubond')) {
    return 'Hunting';
  }

  // Default to practice
  return 'Practice';
}

// Get grain weight with defaults for missing data
function getGrainWeight(lot) {
  const grain = parseInt(lot.Grain);
  if (!isNaN(grain) && grain > 0) return grain;

  // Apply defaults for common cases with missing grain data
  if (lot.Caliber === '12 Gauge') return 437; // 1 oz slug equivalent
  if (lot.Caliber === '.410 Bore') return 109; // 1/4 oz
  if (lot.Caliber === '.22 LR') return 40; // standard velocity
  if (lot.Caliber === '8mm Mauser') return 196; // military load

  return null; // No default available
}

// Convert ammo data
const converted = data
  .filter(lot => {
    // Filter out lots with missing essential data or summary rows
    if (!lot.Caliber || !lot.Brand || !lot.Rounds) return false;
    if (lot.Caliber === 'undefined' || !lot.Rounds || lot.Rounds > 50000) return false; // Skip summary rows
    const grain = getGrainWeight(lot);
    if (grain === null) return false;
    return true;
  })
  .map(lot => {
    const grain = getGrainWeight(lot);
    const velocity = getVelocity(lot.Caliber, grain);
    const energy = velocity ? calculateMuzzleEnergy(grain, velocity) : undefined;
    const category = determineCategory(lot.Brand, lot.Line);

    const result = {
      caliber: lot.Caliber,
      brand: lot.Brand,
      productLine: lot.Line || '',
      grainWeight: grain,
      bulletType: lot['Bullet Type'] || '',
      quantity: parseInt(lot.Rounds),
      category: category,
      isHandload: false,
      quantityPurchased: parseInt(lot.Rounds), // Initial quantity = purchased quantity
    };

    // Only add velocity/energy if we have data
    if (velocity) {
      result.advertisedFPS = velocity;
      result.muzzleEnergy = energy;
    }

    return result;
  })
  .filter(lot => lot.advertisedFPS); // Only include lots with velocity data

const output = `// Generated from ammo inventory spreadsheet (${converted.length} lots)
import type { AmmoLot } from './types';

export const seedAmmo: Omit<AmmoLot, 'id' | 'createdAt' | 'updatedAt'>[] = ${JSON.stringify(converted, null, 2)};
`;

fs.writeFileSync('src/seedAmmo.ts', output);
console.log(`✅ Generated ${converted.length} ammo lots to src/seedAmmo.ts`);

// Generate summary stats
const byCategory = converted.reduce((acc, lot) => {
  acc[lot.category] = (acc[lot.category] || 0) + 1;
  return acc;
}, {});

console.log('\n📊 Category Breakdown:');
Object.entries(byCategory).forEach(([cat, count]) => {
  console.log(`   ${cat}: ${count} lots`);
});

const totalRounds = converted.reduce((sum, lot) => sum + lot.quantity, 0);
console.log(`\n📦 Total Rounds: ${totalRounds.toLocaleString()}`);
