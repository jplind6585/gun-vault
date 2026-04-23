-- ============================================================
-- powders Phase 2 schema additions
-- Adds: successor_id, description_md, flash_suppressed
-- GIN indexes on arrays, powder_substitutions join table
-- Run in Supabase SQL Editor
-- ============================================================

-- Required extension for trigram search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. New columns on powder_brands
ALTER TABLE public.powder_brands
  ADD COLUMN IF NOT EXISTS successor_id      uuid REFERENCES public.powder_brands(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS description_md   text,
  ADD COLUMN IF NOT EXISTS flash_suppressed boolean DEFAULT false;

COMMENT ON COLUMN public.powder_brands.successor_id     IS 'For discontinued powders: UUID of the recommended replacement in this table.';
COMMENT ON COLUMN public.powder_brands.description_md   IS 'Rich markdown description for content marketing and Field Guide rendering.';
COMMENT ON COLUMN public.powder_brands.flash_suppressed IS 'True if the powder contains a flash suppressant additive.';

-- 2. GIN indexes on existing array columns (not yet indexed)
CREATE INDEX IF NOT EXISTS idx_powder_brands_best_use
  ON public.powder_brands USING GIN (best_use);
CREATE INDEX IF NOT EXISTS idx_powder_brands_recommended_calibers
  ON public.powder_brands USING GIN (recommended_calibers);

-- 3. Full-text search index on product_name
CREATE INDEX IF NOT EXISTS idx_powder_brands_product_name_trgm
  ON public.powder_brands USING GIN (product_name gin_trgm_ops);

-- 4. powder_substitutions join table
CREATE TABLE IF NOT EXISTS public.powder_substitutions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  powder_id       uuid NOT NULL REFERENCES public.powder_brands(id) ON DELETE CASCADE,
  substitute_id   uuid NOT NULL REFERENCES public.powder_brands(id) ON DELETE CASCADE,
  equivalence_note text,
  created_at      timestamptz DEFAULT now(),
  UNIQUE (powder_id, substitute_id),
  CHECK (powder_id <> substitute_id)
);

CREATE INDEX IF NOT EXISTS idx_powder_subs_powder     ON public.powder_substitutions (powder_id);
CREATE INDEX IF NOT EXISTS idx_powder_subs_substitute ON public.powder_substitutions (substitute_id);

ALTER TABLE public.powder_substitutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "powder_substitutions_public_read"
  ON public.powder_substitutions FOR SELECT
  USING (true);

CREATE POLICY "powder_substitutions_service_write"
  ON public.powder_substitutions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
