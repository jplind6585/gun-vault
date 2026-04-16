/**
 * Seeds the Supabase `cartridges` table from the local seedCartridges.ts data.
 * Uses the service role key to bypass RLS.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=<key> npx tsx scripts/seed-cartridges.ts
 *
 * Safe to re-run — upserts on name.
 */

import { seedCartridges } from '../web/src/seedCartridges';

const SUPABASE_URL = 'https://joturvmcygdmpnhfsslu.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY env var');
  process.exit(1);
}

import { randomUUID } from 'crypto';

// camelCase → snake_case mapper
function toRow(c: typeof seedCartridges[0]) {
  return {
    id:                    randomUUID(),
    name:                  c.name,
    alternate_names:       c.alternateNames ?? [],
    type:                  c.type,
    standardization:       c.standardization ?? null,
    production_status:     c.productionStatus ?? null,
    availability:          c.availability ?? null,
    year_introduced:       c.yearIntroduced ?? null,
    inventor:              c.inventor ?? null,
    manufacturer:          c.manufacturer ?? null,
    country_of_origin:     c.countryOfOrigin ?? '',
    parent_case:           c.parentCase ?? null,
    derived_from:          c.derivedFrom ?? null,
    bullet_diameter_inch:  c.bulletDiameterInch ?? null,
    bullet_diameter_mm:    c.bulletDiameterMM ?? null,
    base_diameter_inch:    c.baseDiameterInch ?? null,
    base_diameter_mm:      c.baseDiameterMM ?? null,
    rim_diameter_inch:     c.rimDiameterInch ?? null,
    rim_diameter_mm:       c.rimDiameterMM ?? null,
    case_length_inch:      c.caseLengthInch ?? null,
    case_length_mm:        c.caseLengthMM ?? null,
    overall_length_inch:   c.overallLengthInch ?? null,
    overall_length_mm:     c.overallLengthMM ?? null,
    case_capacity_grains:  c.caseCapacityGrains ?? null,
    max_pressure_psi:      c.maxPressurePSI ?? null,
    rim_type:              c.rimType ?? null,
    primer_type:           c.primerType ?? null,
    typical_twist_rate:    c.typicalTwistRate ?? null,
    common_bullet_weights: c.commonBulletWeights ?? [],
    velocity_min_fps:      c.velocityRangeFPS?.min ?? null,
    velocity_max_fps:      c.velocityRangeFPS?.max ?? null,
    energy_min_ftlbs:      c.energyRangeFTLBS?.min ?? null,
    energy_max_ftlbs:      c.energyRangeFTLBS?.max ?? null,
    effective_range_yards: c.effectiveRangeYards ?? null,
    max_range_yards:       c.maxRangeYards ?? null,
    primary_use:           c.primaryUse ?? [],
    hunting_game_size:     c.huntingGameSize ?? [],
    military_adoption:     c.militaryAdoption ?? [],
    current_military_use:  c.currentMilitaryUse ?? [],
    law_enforcement_use:   c.lawEnforcementUse ?? null,
    similar_cartridges:    c.similarCartridges ?? [],
    description:           c.description ?? null,
    history:               c.history ?? null,
    notable_firearms:      c.notableFirearms ?? [],
    trivia:                c.trivia ?? null,
  };
}

async function seed() {
  const rows = seedCartridges.map(toRow);
  console.log(`Seeding ${rows.length} cartridges...`);

  // Batch in chunks of 50 to stay within request size limits
  const CHUNK = 50;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/cartridges?on_conflict=name`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Prefer': 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify(chunk),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error(`Chunk ${i}–${i + CHUNK} failed:`, err);
      process.exit(1);
    }

    inserted += chunk.length;
    console.log(`  ${inserted}/${rows.length} done`);
  }

  console.log(`✓ Seeded ${inserted} cartridges into Supabase`);
}

seed().catch(err => { console.error(err); process.exit(1); });
