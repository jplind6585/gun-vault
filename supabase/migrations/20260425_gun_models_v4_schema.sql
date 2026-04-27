-- ============================================================
-- gun_models v4 — Phase 1: Schema additions
-- New columns: trigger_type, intended_use, trivia,
--              country_of_manufacture, collector_notes, is_collectible
-- ============================================================

ALTER TABLE public.gun_models
  ADD COLUMN IF NOT EXISTS trigger_type           text,          -- 'Striker-Fired' | 'DA/SA' | 'Single-Action' | 'DAO' | 'Double-Action' | 'Single-Stage' | 'Two-Stage'
  ADD COLUMN IF NOT EXISTS intended_use           text[],        -- e.g. ARRAY['concealed_carry','home_defense','hunting']
  ADD COLUMN IF NOT EXISTS trivia                 text,          -- single curated memorable fact for Field Guide card
  ADD COLUMN IF NOT EXISTS country_of_manufacture text,          -- where physically made (vs country_of_origin = brand nationality)
  ADD COLUMN IF NOT EXISTS collector_notes        text,          -- production variants, date codes, value-affecting info
  ADD COLUMN IF NOT EXISTS is_collectible         boolean DEFAULT false;

COMMENT ON COLUMN public.gun_models.trigger_type           IS 'Striker-Fired | DA/SA | Single-Action | DAO | Double-Action | Single-Stage | Two-Stage';
COMMENT ON COLUMN public.gun_models.intended_use           IS 'Array of use-case tags: concealed_carry, home_defense, hunting, competition, duty, military, collector, historical';
COMMENT ON COLUMN public.gun_models.trivia                 IS 'Single curated memorable fact for Field Guide card display';
COMMENT ON COLUMN public.gun_models.country_of_manufacture IS 'Physical manufacturing location (distinct from country_of_origin brand nationality)';
COMMENT ON COLUMN public.gun_models.collector_notes        IS 'Notable production variants, serial number date codes, value-affecting manufacturing info';
COMMENT ON COLUMN public.gun_models.is_collectible         IS 'True if model has significant collector market or notable historical significance';
