// Utility script to update all guns with market values
// Run this in browser console: import('./scripts/updateMarketValues').then(m => m.updateAllMarketValues())

import { getAllGuns, updateGun } from '../storage';
import { enrichGunWithMarketValue } from '../marketValues';

export function updateAllMarketValues() {
  console.log('🔄 Updating market values for all firearms...');

  const guns = getAllGuns();
  let updated = 0;

  guns.forEach(gun => {
    const hadValues = gun.estimatedFMV && gun.insuranceValue;
    const enriched = enrichGunWithMarketValue(gun);

    if (!hadValues && enriched.estimatedFMV && enriched.insuranceValue) {
      updateGun(gun.id, {
        estimatedFMV: enriched.estimatedFMV,
        insuranceValue: enriched.insuranceValue,
        fmvUpdated: enriched.fmvUpdated
      });
      updated++;
    }
  });

  console.log(`✅ Updated ${updated} firearms with market values`);
  console.log(`📊 Collection FMV: $${guns.reduce((sum, g) => sum + (g.estimatedFMV || 0), 0).toLocaleString()}`);
  console.log(`📋 Insurance Value: $${guns.reduce((sum, g) => sum + (g.insuranceValue || 0), 0).toLocaleString()}`);

  return { updated, total: guns.length };
}

// Auto-run on import if in browser
if (typeof window !== 'undefined') {
  console.log('💡 Run updateAllMarketValues() to update all guns with market values');
}
