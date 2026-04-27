-- ============================================================
-- manufacturers v4 — Schema additions
-- New columns: production_countries, collector_prestige_tier, signature_model
-- ============================================================

ALTER TABLE public.manufacturers
  ADD COLUMN IF NOT EXISTS production_countries    text[],        -- physical manufacturing countries (vs country_of_origin = brand HQ)
  ADD COLUMN IF NOT EXISTS collector_prestige_tier text,          -- 'Low' | 'Medium' | 'High' | 'Legendary'
  ADD COLUMN IF NOT EXISTS signature_model         text;          -- single most iconic product — powers Field Guide cards and marketing

COMMENT ON COLUMN public.manufacturers.production_countries    IS 'Array of countries where manufacturing physically occurs — distinct from country_of_origin brand nationality';
COMMENT ON COLUMN public.manufacturers.collector_prestige_tier IS 'Low | Medium | High | Legendary — collector market significance';
COMMENT ON COLUMN public.manufacturers.signature_model         IS 'Single most iconic model this manufacturer is known for — powers manufacturer cards and marketing content';
