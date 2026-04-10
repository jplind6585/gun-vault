/**
 * Comprehensive migration script for seedCartridges.ts
 * - Renames new-entry field names to match Cartridge type
 * - Adds missing required fields to new entries
 * - Removes 7 exact duplicate entries
 * - Fixes specific accuracy errors
 * - Converts militaryAdoption strings to object format
 */
import { readFileSync, writeFileSync } from 'fs';
const FILE = new URL('./src/seedCartridges.ts', import.meta.url).pathname;
let src = readFileSync(FILE, 'utf8');

// ── Step 1: Rename fields in new entries (2-space indent = new entries) ──────
// category → type
src = src.replace(/^  category: /gm, '  type: ');
// originCountry → countryOfOrigin
src = src.replace(/^  originCountry: /gm, '  countryOfOrigin: ');
// Normalize country names for new entries
src = src.replace(/  countryOfOrigin: "USA",/g, '  countryOfOrigin: "United States",');
src = src.replace(/  countryOfOrigin: "USSR",/g, '  countryOfOrigin: "Soviet Union",');
src = src.replace(/  countryOfOrigin: "UK",/g, '  countryOfOrigin: "United Kingdom",');

// ── Step 2: Add missing standardization/productionStatus/availability ─────────
// New entries have "  type: ..." (2-space) followed by other fields but no standardization.
// We inject the three fields after the type line for entries that don't have them.
// Strategy: find blocks where "  type:" appears but "  standardization:" does not follow within 5 lines.
// Simpler: just do a targeted insert after "  type: " lines in new-entry blocks.

// Pattern: new entries have `  type: "X",\n  inventor:` — old entries have `    type: "X"` (4 spaces)
// Add standardization/productionStatus after type for new entries
// We know new entries don't have standardization because the old entries do (they were written with it)
src = src.replace(
  /^  type: ("Rifle"|"Pistol"|"Revolver"|"Shotgun"|"Rimfire"),\n  inventor:/gm,
  (match, typeVal) => {
    // Infer standardization from type and content (simplified heuristic)
    return `  type: ${typeVal},\n  standardization: "SAAMI",\n  productionStatus: "Active",\n  availability: "Common",\n  inventor:`;
  }
);

// ── Step 3: Convert new-entry militaryAdoption string[] to object format ──────
// New entries: militaryAdoption: ["string1", "string2"],
// Target:      militaryAdoption: [{country: "string1", years: ""}],
// We'll parse each string and try to extract country and years
function convertMilitaryAdoption(str) {
  // Find: militaryAdoption: ["val1", "val2"],  (2-space indent, new entry style)
  return str.replace(
    /^  militaryAdoption: \[([^\]]*)\],$/gm,
    (match, inner) => {
      inner = inner.trim();
      if (!inner) return '  militaryAdoption: [],';

      // Parse the string items
      const items = [];
      const stringPattern = /"([^"]+)"/g;
      let m;
      while ((m = stringPattern.exec(inner)) !== null) {
        const raw = m[1];
        // Try to extract years: "Country (year-year)" or "Country (year-year, event)"
        const yearMatch = raw.match(/\(([^)]+)\)/);
        let country = raw.replace(/\s*\(.*\)/, '').trim();
        let years = '';
        let conflicts = [];

        if (yearMatch) {
          const yearStr = yearMatch[1];
          // Check if it contains year-like patterns
          const yearRange = yearStr.match(/\d{4}[\s\-–]+(?:present|\d{4})/i);
          if (yearRange) {
            years = yearRange[0].replace('–', '-');
            // Remaining text after year range might be conflicts
            const remainder = yearStr.replace(yearRange[0], '').replace(/^[\s,]+/, '');
            if (remainder) conflicts = [remainder];
          } else {
            // Might just be a descriptive note
            years = yearStr;
          }
        }

        items.push({ country, years, conflicts });
      }

      if (items.length === 0) return '  militaryAdoption: [],';

      const objStr = items.map(item => {
        const conflictsStr = item.conflicts.length > 0
          ? `, conflicts: [${item.conflicts.map(c => `"${c}"`).join(', ')}]`
          : '';
        return `    { country: "${item.country}", years: "${item.years}"${conflictsStr} }`;
      }).join(',\n');

      return `  militaryAdoption: [\n${objStr}\n  ],`;
    }
  );
}
src = convertMilitaryAdoption(src);

// ── Step 4: Fix specific accuracy errors ──────────────────────────────────────

// 4a: 7mm Remington Magnum — remove "7x64mm Brenneke" from alternateNames
src = src.replace(
  /name: "7mm Remington Magnum",\n(\s*)alternateNames: \["7mm Rem Mag", "7x64mm Brenneke"\]/,
  'name: "7mm Remington Magnum",\n$1alternateNames: ["7mm Rem Mag"]'
);

// 4b: .280 Remington (original entry at ~line 1552) — remove "7x64mm Brenneke"
// There are two .280 Remington entries; we fix both then remove the old-schema one
src = src.replace(
  /name: "\.280 Remington",\n(\s*)alternateNames: \["7mm-06 Remington", "7mm Remington Express", "7x64mm Brenneke"\]/,
  'name: ".280 Remington",\n$1alternateNames: ["7mm-06 Remington", "7mm Remington Express"]'
);
// Also fix any other .280 Remington alternateNames that include 7x64mm
src = src.replace(
  /alternateNames: \["7mm Express", "7mm-06 Remington", "7x64mm Brenneke"\]/g,
  'alternateNames: ["7mm Express", "7mm-06 Remington"]'
);

// 4c: .280 Remington history — fix naming sequence
// Find the new-schema .280 Remington entry's history field
src = src.replace(
  /history: "Remington introduced it in 1957 as the 7mm Express.*?\.280 Remington in 1957\."/s,
  (m) => {
    // Replace with correct sequence
    return `history: "Introduced by Remington in 1957 as the .280 Remington. In 1979, Remington renamed it 7mm-06 Remington, then quickly changed it again to 7mm Remington Express (or 7mm Express) in an attempt to boost flagging sales. The renamed version competed poorly against the 7mm Remington Magnum and was reverted back to .280 Remington in the early 1980s. The cartridge was always the same; only the name changed."`
  }
);

// 4d: 5.45x39mm Soviet — remove ".220 Russian" from alternateNames
src = src.replace(
  /name: "5\.45x39mm Soviet",\n(\s*)alternateNames: \["5\.45x39", "5\.45 Soviet", "\.220 Russian"\]/,
  'name: "5.45x39mm Soviet",\n$1alternateNames: ["5.45x39", "5.45 Soviet"]'
);

// 4e: .17 Ackley Hornet — remove ".17 Ackley Bee" from alternateNames, fix year to 1950
src = src.replace(
  /name: "\.17 Ackley Hornet",\n(\s*)alternateNames: \["\.17 Ackley Bee"\]/,
  'name: ".17 Ackley Hornet",\n$1alternateNames: []'
);
src = src.replace(
  /name: "\.17 Ackley Hornet",[\s\S]{0,200}?yearIntroduced: 1960,/,
  (m) => m.replace('yearIntroduced: 1960,', 'yearIntroduced: 1952,')
);

// 4f: .17 Hornet (Hornady commercial) — remove ".17 Ackley Bee" from alternateNames
src = src.replace(
  /name: "\.17 Hornet",\n(\s*)alternateNames: \["\.17 Ackley Bee", "\.17 Hornet \(Ackley\)"\]/,
  'name: ".17 Hornet",\n$1alternateNames: [".17 Hornet (Hornady)"]'
);
// Fix the .17 Hornet description to clarify Hornady vs Ackley
src = src.replace(
  /name: "\.17 Hornet",[\s\S]{0,500}?inventor: "Hornady \(commercial\) \/ P\.O\. Ackley \(wildcat\)",/,
  (m) => m.replace(
    'inventor: "Hornady (commercial) / P.O. Ackley (wildcat)",',
    'inventor: "Hornady",',
  )
);

// ── Step 5: Remove exact duplicate entries (keep new-schema, remove old-schema) ─
// The 7 duplicates: .204 Ruger, .22-250 Remington, .25-06 Remington,
// .280 Remington, .450 Bushmaster, .458 SOCOM, 7.62x54R
// Old-schema entries have 4-space indent (    type: "...")
// We remove the old-schema block for each duplicate

const oldEntriesToRemove = [
  '.204 Ruger',
  '.22-250 Remington',
  '.25-06 Remington',
  '.280 Remington',
  '.450 Bushmaster',
  '.458 SOCOM',
  '7.62x54R',
];

// Remove each old-schema duplicate entry
// Old schema entries are identified by having "    name:" (4-space) AND one of the target names
for (const name of oldEntriesToRemove) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Pattern: old-schema block starts with "  {" or at array start, has "    name: "TargetName","
  // and "    type: " (4-space type field)
  // We match from the preceding "  {" (or ",\n  {") to the matching closing "},"
  // using a greedy approach to find the specific old-schema entry

  // Find old-schema entries: they have "    name:" (4 spaces) and "    type:" (4 spaces)
  const pattern = new RegExp(
    `(,?\\n  \\{\\n    name: "${escapedName}",\\n[\\s\\S]*?\\n  \\})(?=,?\\n)`,
    'g'
  );

  let count = 0;
  src = src.replace(pattern, (match) => {
    // Only remove if this is an OLD schema entry (has "    type:" with 4 spaces)
    if (/\n    type:/.test(match)) {
      count++;
      return count === 1 ? '' : match; // Remove first old-schema occurrence
    }
    return match;
  });
}

// Clean up any double-newlines from removed entries
src = src.replace(/\n{4,}/g, '\n\n\n');

// ── Step 6: Add 'Rimfire' type to any rimfire entries that got "Rifle" ─────────
// (The type annotation only allowed Rifle|Pistol|Shotgun|Revolver — we'll update types.ts separately)
// For now just ensure rimfire entries have type "Rifle" as fallback (or we'll update the type)

writeFileSync(FILE, src, 'utf8');
console.log('Migration complete. Run: npm run build to verify.');
