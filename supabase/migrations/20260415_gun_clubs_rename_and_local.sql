-- ============================================================
-- Rename gun_clubs → gun_advocacy_groups
-- Create new local_gun_clubs table for actual shooting ranges/clubs
-- ============================================================

-- ── 1. RENAME EXISTING TABLE ──────────────────────────────────────────────────

ALTER TABLE public.gun_clubs RENAME TO gun_advocacy_groups;

-- Rename indexes
ALTER INDEX IF EXISTS idx_gun_clubs_state        RENAME TO idx_gun_advocacy_groups_state;
ALTER INDEX IF EXISTS idx_gun_clubs_verified      RENAME TO idx_gun_advocacy_groups_verified;
ALTER INDEX IF EXISTS idx_gun_clubs_affiliations  RENAME TO idx_gun_advocacy_groups_affiliations;
ALTER INDEX IF EXISTS idx_gun_clubs_latlong       RENAME TO idx_gun_advocacy_groups_latlong;

-- Rename trigger
DROP TRIGGER IF EXISTS trg_gun_clubs_updated_at ON public.gun_advocacy_groups;
CREATE TRIGGER trg_gun_advocacy_groups_updated_at
  BEFORE UPDATE ON public.gun_advocacy_groups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Rename RLS policies
ALTER POLICY "gun_clubs_public_read"   ON public.gun_advocacy_groups RENAME TO "gun_advocacy_groups_public_read";
ALTER POLICY "gun_clubs_service_write" ON public.gun_advocacy_groups RENAME TO "gun_advocacy_groups_service_write";

-- ── 2. CREATE local_gun_clubs ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.local_gun_clubs (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  city                text,
  state               text,
  country             text DEFAULT 'USA',
  zip_code            text,
  website             text,
  phone               text,
  email               text,
  range_type          text[],    -- e.g. ['Pistol','Rifle','Shotgun','Archery']
  indoor_outdoor      text,      -- 'Indoor','Outdoor','Both'
  max_distance_yards  integer,   -- longest range available
  affiliations        text[],    -- ['NRA','USPSA','IDPA','CMP','NSSF','SASS','F-Class','PRS','Benchrest']
  membership_open     boolean DEFAULT true,
  membership_fee_usd  numeric,
  public_range        boolean DEFAULT false,   -- open to non-members
  description         text,
  founded_year        integer,
  latitude            numeric,
  longitude           numeric,
  verified            boolean DEFAULT false,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),
  UNIQUE (name, city, state)
);

COMMENT ON COLUMN public.local_gun_clubs.range_type        IS 'Shooting disciplines available: Pistol, Rifle, Shotgun, Archery, etc.';
COMMENT ON COLUMN public.local_gun_clubs.indoor_outdoor    IS 'Facility type: Indoor, Outdoor, or Both.';
COMMENT ON COLUMN public.local_gun_clubs.max_distance_yards IS 'Maximum range distance available in yards.';
COMMENT ON COLUMN public.local_gun_clubs.public_range      IS 'True if non-members can shoot for a day fee.';
COMMENT ON COLUMN public.local_gun_clubs.affiliations      IS 'National organization affiliations (NRA, USPSA, IDPA, etc.).';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_local_gun_clubs_state        ON public.local_gun_clubs (state);
CREATE INDEX IF NOT EXISTS idx_local_gun_clubs_verified     ON public.local_gun_clubs (verified);
CREATE INDEX IF NOT EXISTS idx_local_gun_clubs_affiliations ON public.local_gun_clubs USING GIN (affiliations);
CREATE INDEX IF NOT EXISTS idx_local_gun_clubs_range_type   ON public.local_gun_clubs USING GIN (range_type);
CREATE INDEX IF NOT EXISTS idx_local_gun_clubs_latlong      ON public.local_gun_clubs (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_local_gun_clubs_public_range ON public.local_gun_clubs (public_range);

-- Updated_at trigger
CREATE TRIGGER trg_local_gun_clubs_updated_at
  BEFORE UPDATE ON public.local_gun_clubs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.local_gun_clubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "local_gun_clubs_public_read"
  ON public.local_gun_clubs FOR SELECT
  USING (true);

CREATE POLICY "local_gun_clubs_service_write"
  ON public.local_gun_clubs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
