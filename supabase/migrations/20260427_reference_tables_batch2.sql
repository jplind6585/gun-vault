-- Reference Tables Batch 2: match_formats, maintenance_procedures, reticle_reference,
--   target_standards, known_shooting_locations, ranges_and_gun_stores
-- Created: 2026-04-27

-- ── match_formats ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.match_formats (
  id                        TEXT PRIMARY KEY,  -- e.g. "ipsc-production", "prs-rifle"

  -- Identity
  name                      TEXT NOT NULL,
  organization              TEXT NOT NULL,     -- IPSC, USPSA, IDPA, PRS, NRL, NRA, NSSF, SASS, etc.
  division_or_class         TEXT,              -- Production, Open, Limited, Stock, etc.

  -- Discipline
  -- Values: pistol / rifle / shotgun / shotgun+rifle / rimfire / multi-gun / precision_rifle
  discipline                TEXT[] NOT NULL,
  format_type               TEXT NOT NULL,     -- 'action' / 'precision' / 'benchrest' / 'field' / 'cowboy' / 'three_gun'

  -- Equipment Rules
  optic_allowed             BOOLEAN NOT NULL DEFAULT TRUE,
  optic_magnification_limit TEXT,              -- e.g. "1x only", "≤4x", "unlimited"
  suppressor_allowed        BOOLEAN NOT NULL DEFAULT FALSE,
  mag_capacity_limit        INTEGER,
  holster_required          BOOLEAN NOT NULL DEFAULT FALSE,
  equipment_notes           TEXT,

  -- Scoring
  -- Values: time_plus / time_minus / hit_factor / points_only / x_count / score_to_par / aggregate
  scoring_system            TEXT NOT NULL,
  power_factor_required     BOOLEAN NOT NULL DEFAULT FALSE,
  power_factor_min_major    INTEGER,           -- e.g. 165000 (grain × fps)
  power_factor_min_minor    INTEGER,
  target_types              TEXT[],            -- IPSC cardboard / steel / poppers / etc.

  -- Course of Fire
  round_count_typical       INTEGER,
  stages_typical            INTEGER,
  time_limit_typical_sec    NUMERIC,
  movement_required         BOOLEAN NOT NULL DEFAULT FALSE,
  positions_required        TEXT[],            -- prone, kneeling, barricade, etc.

  -- Match Info
  match_duration_days       INTEGER,
  squad_size_typical        INTEGER,
  classifier_system         BOOLEAN NOT NULL DEFAULT FALSE,
  classification_levels     TEXT[],            -- GM, M, A, B, C, D / SS, EX, MM, etc.

  -- Reference
  rulebook_url              TEXT,
  official_website_url      TEXT,

  -- Metadata
  notes                     TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_formats_organization ON public.match_formats (organization);
CREATE INDEX IF NOT EXISTS idx_match_formats_discipline   ON public.match_formats USING GIN (discipline);
CREATE INDEX IF NOT EXISTS idx_match_formats_format_type  ON public.match_formats (format_type);

ALTER TABLE public.match_formats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read match_formats" ON public.match_formats FOR SELECT USING (true);


-- ── maintenance_procedures ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.maintenance_procedures (
  id                        TEXT PRIMARY KEY,  -- e.g. "field-strip-glock", "bcg-cleaning-ar15"

  -- Identity
  name                      TEXT NOT NULL,
  procedure_category        TEXT NOT NULL,     -- 'cleaning' / 'lubrication' / 'inspection' / 'replacement' / 'zeroing' / 'storage'

  -- Applicability
  -- Values: pistol / rifle / shotgun / revolver / rimfire / suppressor / optic / magazine
  applies_to                TEXT[] NOT NULL,
  specific_platforms        TEXT[],            -- e.g. ["Glock 17", "AR-15"] — NULL means universal
  specific_parts            TEXT[],            -- e.g. ["BCG", "barrel", "gas tube"]

  -- Procedure
  difficulty                INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  tools_required            TEXT[],            -- punch set, torque wrench, bore snake, etc.
  solvents_lubricants       TEXT[],            -- Hoppe's No.9, CLP, Sentry TUF-GLIDE, etc.
  estimated_minutes         INTEGER,
  steps                     JSONB NOT NULL,
  -- [{"step": 1, "title": "Clear the firearm", "detail": "...", "warning": "..."}]

  -- Frequency
  frequency_recommendation  TEXT,             -- 'after every use' / 'every 500 rounds' / 'annually'
  round_count_interval      INTEGER,          -- trigger-based frequency in rounds

  -- Safety
  safety_warnings           TEXT[],
  requires_gunsmith         BOOLEAN NOT NULL DEFAULT FALSE,

  -- Reference
  video_reference_url       TEXT,
  source_url                TEXT,

  -- Metadata
  notes                     TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_category     ON public.maintenance_procedures (procedure_category);
CREATE INDEX IF NOT EXISTS idx_maintenance_applies_to   ON public.maintenance_procedures USING GIN (applies_to);
CREATE INDEX IF NOT EXISTS idx_maintenance_parts        ON public.maintenance_procedures USING GIN (specific_parts);

ALTER TABLE public.maintenance_procedures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read maintenance_procedures" ON public.maintenance_procedures FOR SELECT USING (true);


-- ── reticle_reference ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reticle_reference (
  id                        TEXT PRIMARY KEY,  -- e.g. "leupold-tmr", "vortex-ebr-7c-mrad"

  -- Identity
  manufacturer              TEXT NOT NULL,
  reticle_name              TEXT NOT NULL,
  model_or_series           TEXT,              -- MOA-T, EBR-7C, TMR, H59, BDC 600, etc.

  -- Type
  -- Values: MOA / MRAD / BDC / duplex / illuminated / Christmas_tree / ranging / custom
  reticle_type              TEXT NOT NULL,
  subtension_unit           TEXT NOT NULL CHECK (subtension_unit IN ('MOA','MRAD','inches','custom')),

  -- Focal Plane
  -- Values: FFP / SFP
  focal_plane               TEXT NOT NULL CHECK (focal_plane IN ('FFP','SFP')),
  sfp_true_magnification    NUMERIC,           -- For SFP: the magnification at which subtensions are true

  -- Subtension Data (JSONB for flexibility)
  subtension_data           JSONB,
  -- {
  --   "main_crosshair_spacing": {"value": 1, "unit": "MRAD"},
  --   "hash_marks": [{"position": 0.5, "unit": "MRAD"}, ...],
  --   "wind_dots": [{"position": 0.2, "unit": "MRAD"}, ...]
  -- }

  -- BDC specifics (if applicable)
  bdc_caliber_optimized     TEXT,
  bdc_zero_yards            INTEGER,
  bdc_holds                 JSONB,             -- [{"label": "300", "yards": 300, "moa": 3.5}]

  -- Compatible Scopes
  compatible_scope_lines    TEXT[],           -- Scope series/model lines this reticle appears in

  -- Reference
  reticle_image_url         TEXT,
  manual_url                TEXT,
  source_url                TEXT,

  -- Metadata
  notes                     TEXT,
  discontinued              BOOLEAN NOT NULL DEFAULT FALSE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reticle_manufacturer  ON public.reticle_reference (manufacturer);
CREATE INDEX IF NOT EXISTS idx_reticle_type          ON public.reticle_reference (reticle_type);
CREATE INDEX IF NOT EXISTS idx_reticle_subtension    ON public.reticle_reference (subtension_unit);

ALTER TABLE public.reticle_reference ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read reticle_reference" ON public.reticle_reference FOR SELECT USING (true);


-- ── target_standards ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.target_standards (
  id                        TEXT PRIMARY KEY,  -- e.g. "ipsc-cardboard-a", "nra-b8-center", "qb-silhouette"

  -- Identity
  name                      TEXT NOT NULL,
  organization              TEXT,              -- IPSC, IDPA, NRA, FBI, military, generic
  target_series             TEXT,             -- B-8, QB, IDPA Silhouette, E-type, etc.

  -- Physical dimensions
  overall_width_inches      NUMERIC,
  overall_height_inches     NUMERIC,

  -- Scoring Zones (JSONB array)
  scoring_zones             JSONB,
  -- [
  --   {"zone": "A", "points": 5, "description": "center hit zone", "width_in": 6, "height_in": 11},
  --   {"zone": "C", "points": 3, "description": "peripheral zone"},
  --   {"zone": "D", "points": 1, "description": "edge zone"}
  -- ]

  -- Typical Use
  -- Values: action / precision / qualification / training / competition / law_enforcement / military
  typical_use               TEXT[] NOT NULL,
  -- Values: pistol / rifle / shotgun / rimfire
  discipline                TEXT[] NOT NULL,

  -- Standard Distances (yards)
  standard_distances_yards  NUMERIC[],

  -- Construction
  material                  TEXT,             -- cardboard / paper / steel / IPSC hardback / etc.
  color                     TEXT,

  -- Reference
  target_image_url          TEXT,
  source_url                TEXT,

  -- Metadata
  notes                     TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_target_organization  ON public.target_standards (organization);
CREATE INDEX IF NOT EXISTS idx_target_discipline    ON public.target_standards USING GIN (discipline);
CREATE INDEX IF NOT EXISTS idx_target_typical_use   ON public.target_standards USING GIN (typical_use);

ALTER TABLE public.target_standards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read target_standards" ON public.target_standards FOR SELECT USING (true);


-- ── known_shooting_locations ──────────────────────────────────────────────────
-- Outdoor public land, WMAs, national forests, BLM — places where you can shoot
CREATE TABLE IF NOT EXISTS public.known_shooting_locations (
  id                        TEXT PRIMARY KEY,  -- e.g. "blm-nevada-caliente", "nf-george-washington-va"

  -- Identity
  name                      TEXT NOT NULL,
  location_type             TEXT NOT NULL,     -- 'BLM' / 'national_forest' / 'WMA' / 'state_land' / 'military_reservation' / 'private_lease'
  managing_agency           TEXT,              -- BLM, USFS, State DNR, etc.

  -- Location
  state                     TEXT NOT NULL,
  county                    TEXT,
  nearest_city              TEXT,
  lat                       NUMERIC,
  lng                       NUMERIC,
  directions_notes          TEXT,

  -- Shooting Rules
  shooting_allowed          BOOLEAN NOT NULL DEFAULT TRUE,
  shooting_restrictions     TEXT[],            -- 'no_targets_on_trees' / 'no_steel' / 'no_tracer' / 'no_full_auto'
  target_types_allowed      TEXT[],            -- 'paper' / 'steel' / 'clay' / 'reactive'
  max_caliber               TEXT,
  max_range_yards           INTEGER,
  requires_permit           BOOLEAN NOT NULL DEFAULT FALSE,
  permit_details            TEXT,
  fee_per_day               NUMERIC,

  -- Access
  vehicle_access            TEXT,              -- 'paved' / '2WD_dirt' / '4WD_required' / 'foot_only'
  dispersed_camping_allowed BOOLEAN,
  restroom_on_site          BOOLEAN NOT NULL DEFAULT FALSE,

  -- Season / Hours
  seasonal_closure          BOOLEAN NOT NULL DEFAULT FALSE,
  closure_months            TEXT[],            -- e.g. ["Dec", "Jan", "Feb"]
  fire_closure_risk         TEXT,              -- 'low' / 'moderate' / 'high' / 'seasonal'

  -- Typical Use
  -- Values: pistol / rifle / shotgun / rimfire / long_range / 3-gun
  disciplines               TEXT[],
  max_verified_distance_yards INTEGER,
  known_for                 TEXT,             -- free-text: "long-range rifle, 1000+ yards available"

  -- Status
  verified_at               DATE,
  verified_by               TEXT,             -- 'community' / 'staff' / 'agency'
  status                    TEXT NOT NULL DEFAULT 'unverified' CHECK (status IN ('verified','unverified','closed','seasonal')),

  -- Reference
  agency_url                TEXT,
  source_url                TEXT,

  -- Metadata
  notes                     TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shooting_locations_state  ON public.known_shooting_locations (state);
CREATE INDEX IF NOT EXISTS idx_shooting_locations_type   ON public.known_shooting_locations (location_type);
CREATE INDEX IF NOT EXISTS idx_shooting_locations_latng  ON public.known_shooting_locations (lat, lng);

ALTER TABLE public.known_shooting_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read known_shooting_locations" ON public.known_shooting_locations FOR SELECT USING (true);


-- ── ranges_and_gun_stores ─────────────────────────────────────────────────────
-- Established businesses: shooting ranges, FFL dealers, gun stores
CREATE TABLE IF NOT EXISTS public.ranges_and_gun_stores (
  id                        TEXT PRIMARY KEY,  -- e.g. "sig-sauer-academy-nh", "capitol-city-arms-il"

  -- Identity
  name                      TEXT NOT NULL,
  business_type             TEXT[] NOT NULL,   -- 'range' / 'gun_store' / 'ffl_dealer' / 'gunsmith' / 'training_facility'
  chain_or_franchise        TEXT,              -- Bass Pro, Cabela's, Sportsman's Warehouse, etc.

  -- Location
  address_line1             TEXT,
  city                      TEXT NOT NULL,
  state                     TEXT NOT NULL,
  zip                       TEXT,
  lat                       NUMERIC,
  lng                       NUMERIC,

  -- Contact
  phone                     TEXT,
  website_url               TEXT,
  email                     TEXT,

  -- Range Details (if applicable)
  has_indoor_range          BOOLEAN NOT NULL DEFAULT FALSE,
  has_outdoor_range         BOOLEAN NOT NULL DEFAULT FALSE,
  indoor_lanes              INTEGER,
  indoor_max_distance_yards INTEGER,
  outdoor_max_distance_yards INTEGER,
  -- Values: pistol / rifle / shotgun / rimfire / long_range / 3-gun / archery
  range_disciplines         TEXT[],
  full_auto_rental          BOOLEAN NOT NULL DEFAULT FALSE,
  range_membership_available BOOLEAN NOT NULL DEFAULT FALSE,
  range_fee_per_visit       NUMERIC,
  eye_ear_rental            BOOLEAN NOT NULL DEFAULT FALSE,
  gun_rental                BOOLEAN NOT NULL DEFAULT FALSE,

  -- Store / FFL Details
  ffl_licensed              BOOLEAN NOT NULL DEFAULT FALSE,
  nfa_dealer                BOOLEAN NOT NULL DEFAULT FALSE,
  gunsmith_on_site          BOOLEAN NOT NULL DEFAULT FALSE,
  consignment_accepted      BOOLEAN NOT NULL DEFAULT FALSE,

  -- Training
  training_courses_offered  BOOLEAN NOT NULL DEFAULT FALSE,
  training_notes            TEXT,

  -- Hours (JSONB for flexibility)
  hours                     JSONB,
  -- {"mon": "9am-8pm", "tue": "9am-8pm", ..., "sun": "10am-6pm", "holiday": "closed"}

  -- Status
  verified_at               DATE,
  status                    TEXT NOT NULL DEFAULT 'unverified' CHECK (status IN ('verified','unverified','closed','temporarily_closed')),

  -- Metadata
  notes                     TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ranges_stores_state         ON public.ranges_and_gun_stores (state);
CREATE INDEX IF NOT EXISTS idx_ranges_stores_city          ON public.ranges_and_gun_stores (city);
CREATE INDEX IF NOT EXISTS idx_ranges_stores_business_type ON public.ranges_and_gun_stores USING GIN (business_type);
CREATE INDEX IF NOT EXISTS idx_ranges_stores_latng         ON public.ranges_and_gun_stores (lat, lng);

ALTER TABLE public.ranges_and_gun_stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read ranges_and_gun_stores" ON public.ranges_and_gun_stores FOR SELECT USING (true);
