/**
 * fix_v2.mjs — Data accuracy and deduplication pass
 *
 * Changes made:
 * 1. Remove 5 old-schema duplicate/invalid entries:
 *    7.62x39mm, 8mm Mauser, 5.7x28mm, 6.5x55 Swedish, .223 Wylde
 * 2. Update alternateNames of surviving entries to absorb removed names
 * 3. Fix 7.92x33mm Kurz history (Hitler opposed, not insistent)
 * 4. Fix .510 DTC EUROP inventor (Dan Geissele → DTICA)
 * 5. Fix 8mm Lebel inventor (add Paul Vieille credit)
 * 6. Fix 5.45x39mm Soviet alternateNames (remove ".220 Russian")
 * 7. Fix .17 Ackley Hornet: remove .17 Ackley Bee, fix "1960s" → "early 1950s"
 * 8. Fix .280 Remington history (naming sequence was reversed)
 * 9. Fix .50 BMG history (tighten 1918 design vs 1921 adoption)
 * 10. Fix .338 Lapua history (add 1989)
 * 11. Fix .243 Winchester max velocity (4000 → 3850 fps)
 * 12. Fix .44 Magnum max energy (1500 → 1200 ft-lbs)
 * 13. Fix 10mm Auto parentCase (remove ".30 Remington")
 * 14. Fix .450 Bushmaster parentCase (remove ".284 Winchester")
 */
import { readFileSync, writeFileSync } from 'fs';
const FILE = new URL('./src/seedCartridges.ts', import.meta.url).pathname;
let src = readFileSync(FILE, 'utf8');

// ── Helper: remove an old-schema entry (4-space indent inside { }) ─────────
// These entries look like:  {\n    name: "X",\n...\n  },
function removeOldEntry(name) {
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Old-schema: "  {\n    name: "X"," — 4 spaces before field names
  const pat = new RegExp(
    `\\n  \\{\\n    name: "${esc}",[\\s\\S]*?\\n  \\},`,
    'g'
  );
  const before = src.length;
  src = src.replace(pat, '');
  const removed = src.length < before;
  console.log(`Remove old entry "${name}":`, removed ? 'OK' : 'NOT FOUND');
}

// ── Step 1: Remove old-schema duplicate entries ────────────────────────────
removeOldEntry('7.62x39mm');
removeOldEntry('8mm Mauser');
removeOldEntry('5.7x28mm');
removeOldEntry('6.5x55 Swedish');
removeOldEntry('.223 Wylde');

// ── Step 2: Update alternateNames of surviving entries ────────────────────

// 7.62x39mm Soviet — add ".30 Russian Short" and "7.62x39mm"
src = src.replace(
  `name: "7.62x39mm Soviet",\n  alternateNames: ["7.62 Soviet", "7.62x39", "M43"],`,
  `name: "7.62x39mm Soviet",\n  alternateNames: ["7.62 Soviet", "7.62x39", "M43", ".30 Russian Short", "7.62x39mm"],`
);

// 7.92x57mm Mauser — add "8mm JS" (was in the removed entry)
src = src.replace(
  `alternateNames: ["8mm Mauser", "8x57mm", "7.92x57mm IS", "8mm German"],`,
  `alternateNames: ["8mm Mauser", "8x57mm", "7.92x57mm IS", "8mm German", "8mm JS"],`
);

// 6.5x55mm Swedish — add "6.5x55 SE" and "6.5x55 Swedish" (old entry primary name)
src = src.replace(
  `name: "6.5x55mm Swedish",\n  alternateNames: ["6.5 Swede", "6.5x55", "6.5 Swedish Mauser"],`,
  `name: "6.5x55mm Swedish",\n  alternateNames: ["6.5 Swede", "6.5x55", "6.5 Swedish Mauser", "6.5x55 Swedish", "6.5x55 SE"],`
);

// 5.7x28mm FN — add "5.7x28mm" and "5.7mm" (old entry names)
src = src.replace(
  `name: "5.7x28mm FN",\n  alternateNames: ["5.7x28", "Five-seveN"],`,
  `name: "5.7x28mm FN",\n  alternateNames: ["5.7x28", "5.7x28mm", "5.7mm", "Five-seveN"],`
);

// ── Step 3: Fix 7.92x33mm Kurz history (Hitler was OPPOSED) ───────────────
src = src.replace(
  `history: "Developed at Hitler's personal insistence despite German High Command opposition. The Sturmgewehr 44 (StG44) firing this round appeared in 1943 and proved devastatingly effective. Soviet engineers captured StG44s and this cartridge heavily influenced Mikhail Kalashnikov's AK-47 and 7.62x39mm development."`,
  `history: "Developed by German Army ordnance despite Hitler's explicit opposition to intermediate cartridges. The project was concealed from Hitler by labeling the weapon 'MP44' (Maschinenpistole) to avoid his scrutiny. After Eastern Front officers reported its effectiveness, Hitler reversed course and renamed it Sturmgewehr 44. Soviet engineers captured StG44s and the concept heavily influenced Mikhail Kalashnikov's AK-47 and 7.62x39mm development."`
);

// ── Step 4: Fix .510 DTC EUROP inventor ───────────────────────────────────
src = src.replace(
  `name: ".510 DTC EUROP",`,
  `name: ".510 DTC EUROP",`
); // no-op to verify; do the actual fix below
src = src.replace(
  `  inventor: "Dan Geissele",\n  yearIntroduced: 2003,\n  parentCase: ".50 BMG",`,
  `  inventor: "DTICA (Thierry Balcon / Patrick Labrout)",\n  yearIntroduced: 2003,\n  parentCase: ".50 BMG",`
);

// ── Step 5: Fix 8mm Lebel inventor (add Paul Vieille credit) ───────────────
// Old: "Colonel Nicolas Lebel"   New: "Colonel Nicolas Lebel / Paul Vieille"
// This is in the OLD schema entry (4-space indent) at line ~1714
src = src.replace(
  `    inventor: "Colonel Nicolas Lebel",\n    yearIntroduced: 1886,`,
  `    inventor: "Colonel Nicolas Lebel / Paul Vieille",\n    yearIntroduced: 1886,`
);

// ── Step 6: Fix 5.45x39mm Soviet — remove ".220 Russian" from alternateNames
src = src.replace(
  `alternateNames: ["5.45 Soviet", "5.45x39", ".220 Russian"],`,
  `alternateNames: ["5.45 Soviet", "5.45x39"],`
);

// ── Step 7: Fix .17 Ackley Hornet ─────────────────────────────────────────
// Remove ".17 Ackley Bee" from alternateNames
src = src.replace(
  `alternateNames: [".17 AH", ".17 Ackley Bee"],`,
  `alternateNames: [".17 AH"],`
);
// Fix history: "1960s" → "early 1950s"
src = src.replace(
  `history: "Created by P.O. Ackley in 1960s by necking down .22 K-Hornet to .17 caliber. One of the earliest successful .17 caliber wildcats. Extremely difficult to form brass and load. Demonstrated viability of .17 caliber centerfire cartridges. Largely forgotten after Hornady introduced commercial .17 Hornet in 2012. Historical significance as precursor to modern .17 caliber cartridges."`,
  `history: "Created by P.O. Ackley in the early 1950s by necking down .22 K-Hornet to .17 caliber. One of the earliest successful .17 caliber wildcats. Extremely difficult to form brass and load. Demonstrated viability of .17 caliber centerfire cartridges. Largely forgotten after Hornady introduced commercial .17 Hornet in 2012. Historical significance as a precursor to modern .17 caliber cartridges."`
);
// Fix trivia: "1960s" → "early 1950s"
src = src.replace(
  `trivia: "P.O. Ackley experimented with this in the 1960s when .17 caliber bullets were nearly impossible to find. It took another 50 years for the commercial .17 Hornet to vindicate his vision. Case forming was so difficult that few shooters ever tried it."`,
  `trivia: "P.O. Ackley experimented with this in the early 1950s when .17 caliber bullets were nearly impossible to find. It took another 60 years for the commercial .17 Hornet to vindicate his vision. Case forming was so difficult that few shooters ever tried it."`
);

// ── Step 8: Fix .280 Remington history (naming sequence was reversed) ──────
src = src.replace(
  `history: "Introduced by Remington in 1957 as 7mm Express, renamed .280 Remington in 1979. Created by necking .30-06 case down to 7mm. Poor marketing and competition from .270 Winchester limited adoption. Jack O'Connor, famous outdoor writer, famously dismissed it in favor of .270, hurting its reputation. Actually superior ballistics but never overcame marketing problems."`,
  `history: "Introduced by Remington in 1957 as the .280 Remington, created by necking the .30-06 case down to 7mm. In 1979, Remington renamed it the 7mm Express Remington in an attempt to boost flagging sales. Persistent confusion with the 7mm Remington Magnum damaged sales further, and Remington reverted to .280 Remington in the early 1980s. The cartridge itself never changed — only its name. Poor marketing and Jack O'Connor's public preference for .270 Winchester kept it in the shadow of lesser cartridges."`
);

// ── Step 9: Fix .50 BMG history (1918 design, 1921 adoption) ─────────────
src = src.replace(
  `history: "Developed by John Browning in 1918 for M2 Browning machine gun. Designed to penetrate aircraft armor. Over 100 years later, still standard heavy MG round. Used in Barrett sniper rifles."`,
  `history: "Designed by John Browning in 1918 to defeat armored vehicles and aircraft. Officially adopted by the US military in 1921 as the primary heavy machine gun round. Over 100 years later, it remains the standard heavy MG cartridge worldwide. Also used in the Barrett M82/M107 sniper rifle for extreme long-range precision and anti-materiel roles."`
);

// ── Step 10: Fix .338 Lapua Magnum history (add 1989) ─────────────────────
src = src.replace(
  `history: "Developed in 1980s for military snipers needing capability beyond .300 Win Mag. Lapua partnered with Research Armament Industries. Became standard for many military long-range programs."`,
  `history: "Developed during the 1980s for military snipers needing capability beyond .300 Win Mag. Lapua partnered with Research Armament Industries, with formal CIP registration and commercial introduction in 1989. Became the standard cartridge for many military long-range sniper programs worldwide."`
);

// ── Step 11: Fix .243 Winchester max velocity ──────────────────────────────
src = src.replace(
  `velocityRangeFPS: { min: 2900, max: 4000 },\n    energyRangeFTLBS: { min: 1400, max: 2000 },\n    effectiveRangeYards: 600,\n    maxRangeYards: 4000,\n    primaryUse: ["Varmint", "Hunting"],`,
  `velocityRangeFPS: { min: 2900, max: 3850 },\n    energyRangeFTLBS: { min: 1400, max: 2000 },\n    effectiveRangeYards: 600,\n    maxRangeYards: 4000,\n    primaryUse: ["Varmint", "Hunting"],`
);

// ── Step 12: Fix .44 Magnum max energy ────────────────────────────────────
src = src.replace(
  `energyRangeFTLBS: { min: 750, max: 1500 },`,
  `energyRangeFTLBS: { min: 750, max: 1200 },`
);

// ── Step 13: Fix 10mm Auto parentCase ─────────────────────────────────────
src = src.replace(
  `  parentCase: ".30 Remington",\n    bulletDiameterInch: 0.4,`,
  `  bulletDiameterInch: 0.4,`
);

// ── Step 14: Fix .450 Bushmaster parentCase ────────────────────────────────
src = src.replace(
  `  parentCase: ".284 Winchester",\n  bulletDiameterInch: 0.452,`,
  `  bulletDiameterInch: 0.452,`
);

// ── Cleanup: remove extra blank lines from removed entries ─────────────────
src = src.replace(/\n{4,}/g, '\n\n\n');

writeFileSync(FILE, src, 'utf8');
console.log('\nfix_v2.mjs complete.');
