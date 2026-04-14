-- ============================================================
-- cartridges: public reference data table
-- Shared between lindcottarmory.com website and app.lindcottarmory.com
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cartridges (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  name                  text NOT NULL,
  alternate_names       text[],

  -- Classification
  type                  text NOT NULL,
  standardization       text,
  production_status     text,
  availability          text,

  -- History
  year_introduced       integer,
  inventor              text,
  manufacturer          text,
  country_of_origin     text NOT NULL DEFAULT '',
  parent_case           text,
  derived_from          text,

  -- Physical specs
  bullet_diameter_inch  numeric,
  bullet_diameter_mm    numeric,
  neck_diameter_inch    numeric,
  neck_diameter_mm      numeric,
  base_diameter_inch    numeric,
  base_diameter_mm      numeric,
  rim_diameter_inch     numeric,
  rim_diameter_mm       numeric,
  case_length_inch      numeric,
  case_length_mm        numeric,
  overall_length_inch   numeric,
  overall_length_mm     numeric,
  case_capacity_grains  numeric,
  max_pressure_psi      integer,
  max_pressure_cup      integer,
  rim_type              text,
  primer_type           text,
  typical_twist_rate    text,

  -- Ballistics
  common_bullet_weights integer[],
  velocity_range_fps    jsonb,        -- {"min": N, "max": N}
  energy_range_ftlbs    jsonb,        -- {"min": N, "max": N}
  effective_range_yards integer,
  max_range_yards       integer,

  -- Use cases
  primary_use           text[],
  hunting_game_size     text[],

  -- Military / LE
  military_adoption     jsonb,        -- [{country, years, conflicts[]}]
  current_military_use  text[],
  law_enforcement_use   boolean,

  -- Related cartridges
  similar_cartridges    text[],
  modern_equivalent     text,
  superseded_by         text,

  -- Encyclopedia content
  description           text,
  history               text,
  notable_firearms      text[],
  trivia                text,

  -- Metadata
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- Unique name so upserts are idempotent
ALTER TABLE public.cartridges ADD CONSTRAINT cartridges_name_key UNIQUE (name);

-- Indexes for website filter/search
CREATE INDEX IF NOT EXISTS cartridges_type_idx ON public.cartridges (type);
CREATE INDEX IF NOT EXISTS cartridges_name_idx ON public.cartridges (name);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER cartridges_updated_at
  BEFORE UPDATE ON public.cartridges
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Row Level Security — public read, no client writes
-- ============================================================
ALTER TABLE public.cartridges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read cartridges"
  ON public.cartridges
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- No INSERT/UPDATE/DELETE policies = only service_role key can write (seed script only)
