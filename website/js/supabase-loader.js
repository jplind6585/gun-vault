/**
 * Lindcott Armory — Supabase Data Loader
 * Shared config and fetch utilities for static website pages.
 * Fetches reference data from Supabase and transforms to the camelCase
 * format expected by existing page scripts.
 */

const SUPABASE_URL = 'https://joturvmcygdmpnhfsslu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ESC5Ir0q9yoOoEhC03Tjdg_QrVnW8DG';

async function supabaseFetchAll(table) {
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
  };
  // Fetch in pages of 1000 until we have everything
  const rows = [];
  let offset = 0;
  const limit = 1000;
  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?select=*&limit=${limit}&offset=${offset}`,
      { headers }
    );
    if (!res.ok) throw new Error(`Supabase fetch failed: ${res.status} ${res.statusText}`);
    const batch = await res.json();
    rows.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
  }
  return rows;
}

function transformServiceWeapons(rows) {
  return rows.map(w => ({
    id:         w.id,
    name:       w.name,
    countries:  w.countries || [],
    role:       w.role,
    caliber:    w.caliber,
    story:      w.story,
    yearStart:  w.year_start,
    yearEnd:    w.year_end,
  }));
}

function transformGunHistory(rows) {
  return rows.map(g => ({
    id:            g.id,
    name:          g.name,
    origin:        g.origin,
    year:          g.year,
    era:           g.era,
    category:      g.category,
    categoryColor: g.category_color,
    tagline:       g.tagline,
    body:          g.body,
  }));
}

function transformCartridges(rows) {
  return rows.map(c => ({
    name:                c.name,
    alternateNames:      c.alternate_names || [],
    type:                c.type,
    standardization:     c.standardization,
    productionStatus:    c.production_status,
    availability:        c.availability,
    yearIntroduced:      c.year_introduced,
    inventor:            c.inventor,
    manufacturer:        c.manufacturer,
    countryOfOrigin:     c.country_of_origin,
    parentCase:          c.parent_case,
    derivedFrom:         c.derived_from,
    bulletDiameterInch:  c.bullet_diameter_inch,
    bulletDiameterMM:    c.bullet_diameter_mm,
    baseDiameterInch:    c.base_diameter_inch,
    baseDiameterMM:      c.base_diameter_mm,
    rimDiameterInch:     c.rim_diameter_inch,
    rimDiameterMM:       c.rim_diameter_mm,
    caseLengthInch:      c.case_length_inch,
    caseLengthMM:        c.case_length_mm,
    overallLengthInch:   c.overall_length_inch,
    overallLengthMM:     c.overall_length_mm,
    caseCapacityGrains:  c.case_capacity_grains,
    maxPressurePSI:      c.max_pressure_psi,
    rimType:             c.rim_type,
    primerType:          c.primer_type,
    typicalTwistRate:    c.typical_twist_rate,
    commonBulletWeights: c.common_bullet_weights || [],
    velocityRangeFPS:    { min: c.velocity_min_fps, max: c.velocity_max_fps },
    energyRangeFTLBS:    { min: c.energy_min_ftlbs, max: c.energy_max_ftlbs },
    effectiveRangeYards: c.effective_range_yards,
    maxRangeYards:       c.max_range_yards,
    primaryUse:          c.primary_use || [],
    huntingGameSize:     c.hunting_game_size || [],
    militaryAdoption:    c.military_adoption || [],
    currentMilitaryUse:  c.current_military_use || [],
    lawEnforcementUse:   c.law_enforcement_use,
    similarCartridges:   c.similar_cartridges || [],
    description:         c.description,
    history:             c.history,
    notableFirearms:     c.notable_firearms || [],
    trivia:              c.trivia,
  }));
}
