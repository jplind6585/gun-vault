-- ============================================================
-- gun_ranges: public reference table
-- Shooting ranges — public reference data
-- RLS: public SELECT, service_role only for writes
-- No seed data — will be populated by users/admins
-- ============================================================

CREATE TABLE IF NOT EXISTS public.gun_ranges (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    text NOT NULL,
  address                 text,
  city                    text,
  state                   text,
  country                 text DEFAULT 'USA',
  zip                     text,
  phone                   text,
  website                 text,
  range_types             text[],   -- ['Indoor','Outdoor','Both']
  max_distance_yards      integer,
  num_lanes               integer,
  num_bays                integer,
  public_access           boolean DEFAULT true,
  membership_required     boolean DEFAULT false,
  rental_available        boolean,
  instruction_available   boolean,
  competitive_shooting    boolean,
  affiliations            text[],   -- ['NRA','USPSA','IDPA','3-Gun','Practical Shooting','Benchrest','F-Class','PRS']
  latitude                numeric,
  longitude               numeric,
  description             text,
  verified                boolean DEFAULT false,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gun_ranges_state              ON public.gun_ranges (state);
CREATE INDEX IF NOT EXISTS idx_gun_ranges_city               ON public.gun_ranges (city);
CREATE INDEX IF NOT EXISTS idx_gun_ranges_verified           ON public.gun_ranges (verified);
CREATE INDEX IF NOT EXISTS idx_gun_ranges_public_access      ON public.gun_ranges (public_access);
CREATE INDEX IF NOT EXISTS idx_gun_ranges_affiliations       ON public.gun_ranges USING GIN (affiliations);
CREATE INDEX IF NOT EXISTS idx_gun_ranges_latlong            ON public.gun_ranges (latitude, longitude);

-- Updated_at trigger
DROP TRIGGER IF EXISTS trg_gun_ranges_updated_at ON public.gun_ranges;
CREATE TRIGGER trg_gun_ranges_updated_at
  BEFORE UPDATE ON public.gun_ranges
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.gun_ranges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gun_ranges_public_read"   ON public.gun_ranges;
DROP POLICY IF EXISTS "gun_ranges_service_write" ON public.gun_ranges;

CREATE POLICY "gun_ranges_public_read"
  ON public.gun_ranges FOR SELECT
  USING (true);

CREATE POLICY "gun_ranges_service_write"
  ON public.gun_ranges FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- No seed data — table will be populated by users and admins.
-- Future: integrate with NRA Range Finder API or similar data source.
