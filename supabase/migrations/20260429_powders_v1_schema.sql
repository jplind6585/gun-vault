-- ============================================================
-- powders v1 — full schema per powder-database-schema.md
-- New table: powders (TEXT PK, ~50 cols)
-- Replaces the simpler powder_brands approach for Phase 2+
-- Also rebuilds powder_substitutions to reference powders.id
-- Run in Supabase SQL Editor
-- ============================================================

-- ── 1. Updated_at trigger function (reuse if already exists) ──────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ── 2. Drop old powder_substitutions (references powder_brands UUID — empty table) ─

DROP TABLE IF EXISTS public.powder_substitutions CASCADE;

-- ── 3. Create powders table ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.powders (
  id TEXT PRIMARY KEY,   -- slug: "hodgdon-varget", "imr-4350", "vihtavuori-n140"

  -- IDENTIFICATION
  name                          TEXT NOT NULL,
  manufacturer                  TEXT NOT NULL,
  brand_family                  TEXT,          -- "Hodgdon Family" covers IMR + Winchester powder
  alternate_names               TEXT[],        -- ADI AR2208 = Hodgdon Varget
  country_of_origin             TEXT,
  year_introduced               INTEGER,
  year_discontinued             INTEGER,
  production_status             TEXT NOT NULL DEFAULT 'Active',
    -- Active / Discontinued / Limited / Military Only / Unknown

  -- PHYSICAL CHARACTERISTICS
  grain_shape                   TEXT,          -- Ball / Flake / Stick / Disc / Tubular
  grain_size_description        TEXT,          -- fine / medium / coarse
  color                         TEXT,
  density_g_per_cc              NUMERIC,
  bulk_density_g_per_cc         NUMERIC,
  meters_well                   BOOLEAN,

  -- BURN RATE
  burn_rate_rank                INTEGER,       -- 1 = fastest on standard chart
  burn_rate_category            TEXT,          -- Pistol Fast/Medium/Slow, Rifle Fast/Medium/Slow, Magnum Rifle, Benchrest
  burn_rate_normalized          NUMERIC,       -- 0–100 scale for cross-manufacturer comparison
  burn_rate_notes               TEXT,

  -- PERFORMANCE CHARACTERISTICS
  temperature_sensitivity       TEXT,          -- Low / Medium / High
  temperature_sensitivity_notes TEXT,
  extreme_series                BOOLEAN DEFAULT FALSE,   -- Hodgdon Extreme series / IMR Enduron
  moisture_sensitivity          TEXT,
  lot_to_lot_consistency        TEXT,          -- Low / Medium / High
  pressure_curve_character      TEXT,          -- Progressive / Degressive / Neutral
  flash_suppressed              BOOLEAN DEFAULT FALSE,
  muzzle_flash_notes            TEXT,
  fouling_level                 TEXT,          -- Low / Medium / High
  copper_fouling_contribution   TEXT,          -- Low / Medium / High

  -- APPLICATION
  primary_application           TEXT,
  suitable_for_pistol           BOOLEAN DEFAULT FALSE,
  suitable_for_rifle            BOOLEAN DEFAULT FALSE,
  suitable_for_shotgun          BOOLEAN DEFAULT FALSE,
  suitable_for_precision        BOOLEAN DEFAULT FALSE,
  suitable_for_bulk_plinking    BOOLEAN DEFAULT FALSE,
  typical_calibers              TEXT[],        -- display/search
  typical_caliber_ids           TEXT[],        -- cartridges.id refs (populate in Phase 2+)
  not_recommended_for           TEXT[],
  suppressor_friendly           TEXT,

  -- SAFETY (CRITICAL)
  double_charge_visible         BOOLEAN NOT NULL,
    -- TRUE  = overflow visible in case (safety feature — stick & disc powders)
    -- FALSE = can double-charge without visual detection (DANGER — ball/flake in pistol)
  double_charge_notes           TEXT,
  static_electricity_risk       BOOLEAN DEFAULT FALSE,
  compressed_load_risk          TEXT,          -- Low / Medium / High
  case_fill_ratio_typical       NUMERIC,

  -- AVAILABILITY & COMMERCIAL
  availability_us               TEXT,          -- Abundant / Common / Moderate / Limited / Discontinued
  shortage_prone                BOOLEAN DEFAULT FALSE,
  military_surplus_available    BOOLEAN DEFAULT FALSE,
  hazmat_shipping_required      BOOLEAN DEFAULT TRUE,
  typical_container_sizes       TEXT[],

  -- SUBSTITUTION INTELLIGENCE
  substitution_notes            TEXT,
  manufacturer_equivalent       TEXT,

  -- REGULATORY & SAFETY
  classification                TEXT DEFAULT 'Smokeless',  -- Smokeless / Black Powder Substitute
  un_number                     TEXT,
  storage_requirements          TEXT,
  max_storage_quantity_lbs_residential NUMERIC,
  shelf_life_years              INTEGER,
  degradation_indicators        TEXT,

  -- CONTENT
  description                   TEXT,
  field_guide_content           TEXT,
  image_url                     TEXT,
  manufacturer_data_sheet_url   TEXT,

  -- METADATA
  last_verified                 DATE,
  data_source                   TEXT,          -- manufacturer / community / both
  notes                         TEXT,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- No RLS — public reference table (same pattern as cartridges)

-- Indexes
CREATE INDEX IF NOT EXISTS powders_manufacturer_idx          ON public.powders (manufacturer);
CREATE INDEX IF NOT EXISTS powders_burn_rate_rank_idx        ON public.powders (burn_rate_rank);
CREATE INDEX IF NOT EXISTS powders_production_status_idx     ON public.powders (production_status);
CREATE INDEX IF NOT EXISTS powders_primary_application_idx   ON public.powders (primary_application);
CREATE INDEX IF NOT EXISTS powders_grain_shape_idx           ON public.powders (grain_shape);

-- GIN indexes for array fields
CREATE INDEX IF NOT EXISTS powders_alternate_names_idx       ON public.powders USING GIN (alternate_names);
CREATE INDEX IF NOT EXISTS powders_typical_calibers_idx      ON public.powders USING GIN (typical_calibers);
CREATE INDEX IF NOT EXISTS powders_typical_caliber_ids_idx   ON public.powders USING GIN (typical_caliber_ids);

-- Trigram index for name search (autocomplete)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS powders_name_trgm_idx ON public.powders USING GIN (name gin_trgm_ops);

-- updated_at trigger
DROP TRIGGER IF EXISTS set_powders_updated_at ON public.powders;
CREATE TRIGGER set_powders_updated_at
  BEFORE UPDATE ON public.powders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 4. powder_substitutions — rebuilt to reference powders.id ─────────────────

CREATE TABLE IF NOT EXISTS public.powder_substitutions (
  id                     SERIAL PRIMARY KEY,
  powder_id              TEXT NOT NULL REFERENCES public.powders(id) ON DELETE CASCADE,
  substitute_id          TEXT NOT NULL REFERENCES public.powders(id) ON DELETE CASCADE,
  direction              TEXT NOT NULL DEFAULT 'bidirectional',
    -- bidirectional / powder_to_substitute_only / substitute_to_powder_only
  charge_adjustment_notes TEXT,
    -- e.g., "Reduce charge 3-5% vs published Varget data; work up from minimum"
  confidence             TEXT NOT NULL DEFAULT 'Community',
    -- Manufacturer / Published / Community
  notes                  TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (powder_id, substitute_id),
  CHECK (powder_id <> substitute_id)
);

CREATE INDEX IF NOT EXISTS powder_substitutions_powder_idx     ON public.powder_substitutions (powder_id);
CREATE INDEX IF NOT EXISTS powder_substitutions_substitute_idx ON public.powder_substitutions (substitute_id);

-- No RLS — public reference table
