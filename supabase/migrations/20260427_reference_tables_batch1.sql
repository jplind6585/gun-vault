-- Reference Tables Batch 1: bullet_specs, factory_loads_reference, shooting_drills
-- Created: 2026-04-27

-- ── bullet_specs ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bullet_specs (
  id                    TEXT PRIMARY KEY,  -- e.g. "hornady-eld-match-6-5-140"

  -- Identity
  manufacturer          TEXT NOT NULL,
  product_line          TEXT NOT NULL,     -- ELD-Match, MatchKing, Hybrid, Partition, etc.
  bullet_name           TEXT NOT NULL,     -- Full display name

  -- Physical specs
  diameter_inch         NUMERIC NOT NULL,
  diameter_mm           NUMERIC NOT NULL,
  weight_grains         INTEGER NOT NULL,
  length_inches         NUMERIC,
  sectional_density     NUMERIC,

  -- Ballistic coefficients
  bc_g1                 NUMERIC,           -- G1 drag model BC
  bc_g7                 NUMERIC,           -- G7 drag model BC (preferred for boat-tail rifle bullets)
  bc_source             TEXT,             -- 'manufacturer' / 'measured' / 'estimated'
  bc_notes              TEXT,

  -- Construction
  -- Values: FMJ / OTM / Hollow Point / Soft Point / Ballistic Tip / Bonded /
  --         Monolithic / Cup & Core / Partition / Controlled Expansion / Wadcutter / SWC
  construction          TEXT NOT NULL,

  -- Values: match / hunting / self_defense / plinking / varmint / dangerous_game
  intended_use          TEXT[] NOT NULL DEFAULT '{}',

  -- Compatibility
  caliber_names         TEXT[],            -- Human-readable calibers this bullet is used in
  cartridge_ids         TEXT[],            -- FK references to cartridges table slugs

  -- Status
  discontinued          BOOLEAN NOT NULL DEFAULT FALSE,
  msrp_per_100          NUMERIC,

  -- Metadata
  notes                 TEXT,
  source_url            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bullet_specs_diameter     ON public.bullet_specs (diameter_inch);
CREATE INDEX IF NOT EXISTS idx_bullet_specs_weight       ON public.bullet_specs (weight_grains);
CREATE INDEX IF NOT EXISTS idx_bullet_specs_manufacturer ON public.bullet_specs (manufacturer);

ALTER TABLE public.bullet_specs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read bullet_specs" ON public.bullet_specs FOR SELECT USING (true);


-- ── factory_loads_reference ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.factory_loads_reference (
  id                        TEXT PRIMARY KEY,  -- e.g. "federal-gm308m-175-smk"

  -- Identity
  manufacturer              TEXT NOT NULL,
  product_line              TEXT NOT NULL,
  sku                       TEXT,

  -- Cartridge
  cartridge_name            TEXT NOT NULL,
  cartridge_id              TEXT,              -- FK to cartridges table

  -- Bullet
  grain_weight              INTEGER NOT NULL,
  bullet_type               TEXT NOT NULL,     -- OTM / FMJ / HP / SP / BT / etc.
  bullet_description        TEXT,
  bullet_spec_id            TEXT REFERENCES public.bullet_specs(id),

  -- Published ballistics
  advertised_fps            INTEGER NOT NULL,
  muzzle_energy_ftlbs       INTEGER,
  bc_g1                     NUMERIC,
  bc_g7                     NUMERIC,
  bc_source                 TEXT,             -- 'manufacturer' / 'measured' / 'inferred'

  -- Test conditions
  test_barrel_length_inches NUMERIC,
  test_barrel_twist         TEXT,

  -- Pressure
  saami_pressure_psi        INTEGER,

  -- Availability & pricing
  msrp_per_round            NUMERIC,
  box_count                 INTEGER,
  discontinued              BOOLEAN NOT NULL DEFAULT FALSE,

  -- Values: match / hunting / self_defense / plinking / duty / barrier_blind
  intended_use              TEXT[] NOT NULL DEFAULT '{}',

  -- Metadata
  notes                     TEXT,
  source_url                TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_factory_loads_cartridge    ON public.factory_loads_reference (cartridge_name);
CREATE INDEX IF NOT EXISTS idx_factory_loads_manufacturer ON public.factory_loads_reference (manufacturer);
CREATE INDEX IF NOT EXISTS idx_factory_loads_grain        ON public.factory_loads_reference (grain_weight);

ALTER TABLE public.factory_loads_reference ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read factory_loads_reference" ON public.factory_loads_reference FOR SELECT USING (true);


-- ── shooting_drills ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shooting_drills (
  id                         TEXT PRIMARY KEY,

  -- Identity
  name                       TEXT NOT NULL,
  origin                     TEXT,
  drill_series               TEXT,

  -- Discipline & Equipment
  -- Values: pistol / rifle / shotgun / revolver / rimfire
  discipline                 TEXT[] NOT NULL,
  holster_required           BOOLEAN NOT NULL DEFAULT FALSE,
  props_required             TEXT[],
  movement_required          BOOLEAN NOT NULL DEFAULT FALSE,
  movement_description       TEXT,

  -- Course of Fire
  round_count                INTEGER NOT NULL,
  target_type                TEXT NOT NULL,
  target_count               INTEGER NOT NULL DEFAULT 1,
  -- Values: Holster / Low Ready / High Ready / Bench / Freestyle
  start_position             TEXT NOT NULL,
  distance_yards             NUMERIC NOT NULL,
  description                TEXT NOT NULL,

  -- Range Requirements
  range_depth_yards          NUMERIC,
  range_width_feet           NUMERIC,

  -- Time
  par_time_seconds           NUMERIC,
  time_estimate_minutes      NUMERIC,
  setup_time_minutes         NUMERIC,

  -- Performance
  -- Values: Time Only / Points Only / Time + Points / Hit Factor / Pass-Fail
  scoring_method             TEXT NOT NULL,
  performance_tiers          JSONB,
  -- { "world_class": 1.8, "excellent": 2.2, "good": 2.8, "passing": 3.5 }
  classification_benchmark   TEXT,

  -- Skill
  -- Values: draw / reload / transitions / accuracy / speed / trigger_control /
  --         support_hand / strong_hand / movement / target_discrimination /
  --         low_light / malfunction_clearance / stress_inoculation
  skill_focus                TEXT[] NOT NULL,
  difficulty                 INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  stress_inoculation         BOOLEAN NOT NULL DEFAULT FALSE,

  -- Variants
  dry_fire_capable           BOOLEAN NOT NULL DEFAULT FALSE,
  hand_variants              JSONB,
  -- { "sho": true, "who": true, "sho_par_multiplier": 1.4, "who_par_multiplier": 1.6 }
  scaled_variations          JSONB,
  -- { "beginner": { "distance_yards": 3, "par_time": 5.0, "notes": "..." }, "advanced": {...} }

  -- Competition Relevance
  competition_relevance      TEXT[],

  -- Training Plan
  recommended_frequency      TEXT,
  recommended_frequency_notes TEXT,
  prerequisite_drill_ids     TEXT[],
  night_vision_capable       BOOLEAN NOT NULL DEFAULT FALSE,

  -- Reference
  video_reference_url        TEXT,
  source_url                 TEXT,

  -- Metadata
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shooting_drills_discipline   ON public.shooting_drills USING GIN (discipline);
CREATE INDEX IF NOT EXISTS idx_shooting_drills_skill_focus  ON public.shooting_drills USING GIN (skill_focus);
CREATE INDEX IF NOT EXISTS idx_shooting_drills_competition  ON public.shooting_drills USING GIN (competition_relevance);

-- No RLS — public reference table, read by all authenticated users
