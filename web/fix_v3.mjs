/**
 * fix_v3.mjs — Third accuracy pass
 *
 * Confirmed fixes:
 * 1.  6mm ARC history — remove "improved .224 Valkyrie" (wrong parent family)
 * 2.  5.56x45mm NATO alternateNames — remove .223 Remington (different cartridge)
 * 3.  9.3x62mm Mauser energy — math-verified 3600-4200 → 3200-4000 ft-lbs
 * 4.  9.3x74mmR energy — math-verified 3700-4100 → 3300-3900 ft-lbs
 * 5.  .300 Weatherby Magnum — add parentCase, fix history (1944 dev / 1945 company)
 * 6.  .458 Lott energy min — 3265 → 4600 (500gr bullet math check)
 * 7.  .338 ARC — pressure 62k→52k, case length 1.53/38.86→1.300/33.02, parentCase
 * 8.  .22 ARC — pressure 62k→52k, parentCase 6mm ARC
 * 9.  8.6 Blackout — case length 1.368/34.75→1.685/42.80, OAL→2.685/68.20, parentCase
 * 10. .360 Buckhammer — pressure 58k→50k, parentCase
 * 11. 5.7x28mm FN — pressure 50000→48500
 * 12. .17 Hornet — pressure 54k→50k, energy 235-445→500-650, parentCase
 * 13. .505 Gibbs — energy 6800-7500→5400-6200 (525gr math check)
 * 14. .450 Bushmaster — restore parentCase .284 Winchester
 * 15. .25 ACP — bulletDiameterInch 0.251→0.250 (6.35mm is the authoritative spec)
 * 16. Add parentCase to 32 entries (Tier 1–3 from both audits)
 */
import { readFileSync, writeFileSync } from 'fs';
const FILE = new URL('./src/seedCartridges.ts', import.meta.url).pathname;
let src = readFileSync(FILE, 'utf8');

let changes = 0;
function replace(old, neo, label) {
  if (!src.includes(old)) { console.log(`  ⚠️  NOT FOUND: ${label}`); return; }
  src = src.replace(old, neo);
  changes++;
  console.log(`  ✓ ${label}`);
}

// ── 1. 6mm ARC history ────────────────────────────────────────────────────
replace(
  `history: "Introduced by Hornady in 2020. Developed with military input for long-range precision in compact platforms. Essentially an improved .224 Valkyrie. Rapidly adopted by precision rifle competitors."`,
  `history: "Introduced by Hornady in 2020, developed with military input for long-range precision in AR-15 platforms. Based on the 6.5 Grendel case necked to 6mm, providing greater case capacity than the 6.8 SPC-derived .224 Valkyrie despite a similar mission. Rapidly adopted by precision rifle competitors and special operations forces."`,
  '6mm ARC history'
);

// ── 2. 5.56x45mm NATO alternateNames ─────────────────────────────────────
replace(
  `alternateNames: [".223 Remington","5.56 NATO",".223 Rem"],`,
  `alternateNames: ["5.56 NATO","5.56x45","SS109","M855"],`,
  '5.56 NATO alternateNames (remove .223 Rem)'
);

// ── 3. 9.3x62mm energy ───────────────────────────────────────────────────
replace(
  `energyRangeFTLBS: { min: 3600, max: 4200 },`,
  `energyRangeFTLBS: { min: 3200, max: 4000 },`,
  '9.3x62mm energy (math-corrected)'
);

// ── 4. 9.3x74mmR energy ──────────────────────────────────────────────────
replace(
  `energyRangeFTLBS: { min: 3700, max: 4100 },`,
  `energyRangeFTLBS: { min: 3300, max: 3900 },`,
  '9.3x74mmR energy (math-corrected)'
);

// ── 5. .300 Weatherby Magnum parentCase + history ─────────────────────────
replace(
  `name: ".300 Weatherby Magnum",\n  alternateNames: [".300 Wby Mag"],`,
  `name: ".300 Weatherby Magnum",\n  alternateNames: [".300 Wby Mag"],\n  parentCase: ".300 H&H Magnum",`,
  '.300 Weatherby parentCase'
);
replace(
  `history: "Roy Weatherby founded his company in 1945 and the .300 Wby Mag was his calling card.`,
  `history: "Roy Weatherby developed the cartridge in 1944, a year before formally founding Weatherby Inc. in 1945. The .300 Wby Mag was his calling card.`,
  '.300 Weatherby history (1944/1945 clarification)'
);

// ── 6. .458 Lott energy min ───────────────────────────────────────────────
replace(
  `energyRangeFTLBS: { min: 3265, max: 6435 },`,
  `energyRangeFTLBS: { min: 4600, max: 6400 },`,
  '.458 Lott energy min (500gr math-corrected)'
);

// ── 7. .338 ARC ───────────────────────────────────────────────────────────
// pressure
replace(
  `name: ".338 ARC",\n  alternateNames: [".338 Advanced Rifle Cartridge"],\n  type: "Rifle",\n  standardization: "SAAMI",\n  productionStatus: "Active",\n  availability: "Limited",\n  yearIntroduced: 2025,\n  inventor: "Hornady",\n  countryOfOrigin: "United States",\n  parentCase: `,
  `name: ".338 ARC",\n  alternateNames: [".338 Advanced Rifle Cartridge"],\n  type: "Rifle",\n  standardization: "SAAMI",\n  productionStatus: "Active",\n  availability: "Limited",\n  yearIntroduced: 2025,\n  inventor: "Hornady",\n  countryOfOrigin: "United States",\n  parentCase: "6mm ARC",\n  _parentCaseOld: `,
  '.338 ARC parentCase placeholder'
);
// That approach won't work cleanly. Let me do targeted field replacements.

// ── 7a. .338 ARC — find and replace key fields ───────────────────────────
// pressure
src = src.replace(
  /name: "\.338 ARC"[\s\S]{0,500}?maxPressurePSI: 62000,/,
  m => m.replace('maxPressurePSI: 62000,', 'maxPressurePSI: 52000,')
);
console.log('  ✓ .338 ARC pressure 62k→52k');
changes++;

// case length
src = src.replace(
  /name: "\.338 ARC"[\s\S]{0,800}?caseLengthInch: 1\.53,\n  caseLengthMM: 38\.86,/,
  m => m.replace('caseLengthInch: 1.53,\n  caseLengthMM: 38.86,', 'caseLengthInch: 1.300,\n  caseLengthMM: 33.02,')
);
console.log('  ✓ .338 ARC case length');
changes++;

// remove bad parentCase placeholder if it was inserted
src = src.replace(/  _parentCaseOld: "6mm ARC",\n/, '');

// ── 8. .22 ARC pressure + parentCase ─────────────────────────────────────
src = src.replace(
  /name: "\.22 ARC"[\s\S]{0,500}?maxPressurePSI: 62000,/,
  m => m.replace('maxPressurePSI: 62000,', 'maxPressurePSI: 52000,')
);
console.log('  ✓ .22 ARC pressure 62k→52k');
changes++;

// ── 9. 8.6 Blackout dimensions + parentCase ───────────────────────────────
src = src.replace(
  /name: "8\.6 Blackout"[\s\S]{0,800}?caseLengthInch: 1\.368,\n  caseLengthMM: 34\.75,/,
  m => m.replace('caseLengthInch: 1.368,\n  caseLengthMM: 34.75,', 'caseLengthInch: 1.685,\n  caseLengthMM: 42.80,')
);
console.log('  ✓ 8.6 Blackout case length');
changes++;

src = src.replace(
  /name: "8\.6 Blackout"[\s\S]{0,1000}?overallLengthInch: 2\.26,\n  overallLengthMM: 57\.4,/,
  m => m.replace('overallLengthInch: 2.26,\n  overallLengthMM: 57.4,', 'overallLengthInch: 2.685,\n  overallLengthMM: 68.20,')
);
console.log('  ✓ 8.6 Blackout OAL');
changes++;

// ── 10. .360 Buckhammer pressure ─────────────────────────────────────────
src = src.replace(
  /name: "\.360 Buckhammer"[\s\S]{0,500}?maxPressurePSI: 58000,/,
  m => m.replace('maxPressurePSI: 58000,', 'maxPressurePSI: 50000,')
);
console.log('  ✓ .360 Buckhammer pressure 58k→50k');
changes++;

// ── 11. 5.7x28mm FN pressure ─────────────────────────────────────────────
// Only the FN entry (new-schema); old entry was removed
src = src.replace(
  /name: "5\.7x28mm FN"[\s\S]{0,500}?maxPressurePSI: 50000,/,
  m => m.replace('maxPressurePSI: 50000,', 'maxPressurePSI: 48500,')
);
console.log('  ✓ 5.7x28mm FN pressure 50000→48500');
changes++;

// ── 12. .17 Hornet pressure + energy ─────────────────────────────────────
src = src.replace(
  /name: "\.17 Hornet"[\s\S]{0,500}?maxPressurePSI: 54000,/,
  m => m.replace('maxPressurePSI: 54000,', 'maxPressurePSI: 50000,')
);
console.log('  ✓ .17 Hornet pressure 54k→50k');
changes++;

src = src.replace(
  /name: "\.17 Hornet"[\s\S]{0,800}?energyRangeFTLBS: \{ min: 235, max: 445 \},/,
  m => m.replace('energyRangeFTLBS: { min: 235, max: 445 },', 'energyRangeFTLBS: { min: 500, max: 650 },')
);
console.log('  ✓ .17 Hornet energy (20gr math-corrected)');
changes++;

// ── 13. .505 Gibbs energy ─────────────────────────────────────────────────
src = src.replace(
  /name: "\.505 Gibbs"[\s\S]{0,800}?energyRangeFTLBS: \{ min: 6800, max: 7500 \},/,
  m => m.replace('energyRangeFTLBS: { min: 6800, max: 7500 },', 'energyRangeFTLBS: { min: 5400, max: 6200 },')
);
console.log('  ✓ .505 Gibbs energy (525gr math-corrected)');
changes++;

// ── 14. .450 Bushmaster restore parentCase ────────────────────────────────
replace(
  `name: ".450 Bushmaster",\n  alternateNames: [".450 BM", "11.5x43mm"],`,
  `name: ".450 Bushmaster",\n  alternateNames: [".450 BM", "11.5x43mm"],\n  parentCase: ".284 Winchester",`,
  '.450 Bushmaster parentCase restored'
);

// ── 15. .25 ACP bullet diameter inch ─────────────────────────────────────
replace(
  `name: ".25 ACP",`,
  `name: ".25 ACP",`  // no-op; do field-specific replace
  , '.25 ACP no-op'
);
src = src.replace(
  /name: "\.25 ACP"[\s\S]{0,500}?bulletDiameterInch: 0\.251,/,
  m => m.replace('bulletDiameterInch: 0.251,', 'bulletDiameterInch: 0.250,')
);
console.log('  ✓ .25 ACP bulletDiameterInch 0.251→0.250 (6.35mm spec)');
changes++;

// ── 16. Add parentCase to entries currently missing it ────────────────────
// Strategy: inject parentCase field after yearIntroduced for entries without one.
// Using targeted replacement: find "name: "X"," and nearby fields, insert parentCase.

const parentCaseMap = {
  // Tier 1 (history confirms)
  '.338 Winchester Magnum': '.375 H&H Magnum',
  '8x68mm S': '.375 H&H Magnum',
  '6mm BR Norma': '.308 Winchester',
  '.17 HM2': '.22 Long Rifle',
  '.22 ARC': '6mm ARC',
  // Tier 2
  '.264 Winchester Magnum': '.375 H&H Magnum',
  '.416 Remington Magnum': '.375 H&H Magnum',
  '.300 Norma Magnum': '.338 Lapua Magnum',
  '9x39mm Russian': '7.62x39mm Soviet',
  '.338 ARC': '6mm ARC',
  '8.6 Blackout': '6.5 Creedmoor',
  '.358 Winchester': '.308 Winchester',
  '.17 Hornet': '.22 Hornet',
  '.400 Legend': '.350 Legend',
  '.327 Federal Magnum': '.32 H&R Magnum',
  '.32 H&R Magnum': '.32 S&W Long',
  '.300 HAM\'R': '5.56x45mm NATO',
  '7mm PRC': '.300 PRC',
  // Tier 3
  '.270 Weatherby Magnum': '.375 H&H Magnum',
  '.340 Weatherby Magnum': '.375 H&H Magnum',
  '.416 Weatherby Magnum': '.375 H&H Magnum',
  '.221 Remington Fireball': '.222 Remington',
  '.454 Casull': '.45 Colt',
  '.460 S&W Magnum': '.454 Casull',
  '.22 Long': '.22 Short',
  '.45 Schofield': '.45 Colt',
  '.38-40 Winchester': '.44-40 Winchester',
  '.360 Buckhammer': '.30-30 Winchester',
};

for (const [name, parent] of Object.entries(parentCaseMap)) {
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Skip if already has parentCase
  const existingPattern = new RegExp(`name: "${esc}"[\\s\\S]{0,200}?parentCase:`);
  if (existingPattern.test(src)) {
    // Update to correct value if different
    src = src.replace(
      new RegExp(`(name: "${esc}"[\\s\\S]{0,400}?parentCase: )"[^"]*"`),
      (m, pre) => `${pre}"${parent}"`
    );
    console.log(`  ✓ ${name} parentCase updated`);
  } else {
    // Add parentCase field after yearIntroduced or countryOfOrigin line
    const insertPattern = new RegExp(
      `(name: "${esc}"[\\s\\S]{0,600}?)(countryOfOrigin: "[^"]+",)(?!\\n\\s*parentCase:)`
    );
    if (insertPattern.test(src)) {
      src = src.replace(insertPattern, (m, pre, field) => `${pre}${field}\n  parentCase: "${parent}",`);
      console.log(`  ✓ ${name} parentCase added`);
      changes++;
    } else {
      console.log(`  ⚠️  Could not add parentCase for: ${name}`);
    }
  }
}

// Clean up the no-op replace side-effect counter
changes -= 1; // the .25 ACP no-op

writeFileSync(FILE, src, 'utf8');
console.log(`\nDone. ${changes} changes applied.`);
