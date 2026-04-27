-- ============================================================
-- gun_models v2: schema extensions
-- Combines inline brief (3 columns) + first-pass expansion (2 columns) +
-- 3 proposed columns for search/filtering/future app utility.
-- Run: npx supabase db query --linked -f supabase/migrations/20260415_gun_models_v2.sql
-- ============================================================

-- ── 1. NEW COLUMNS ─────────────────────────────────────────────────────────────

ALTER TABLE public.gun_models
  -- From inline brief
  ADD COLUMN IF NOT EXISTS platform_family          text,
  ADD COLUMN IF NOT EXISTS caliber_options          text[],
  ADD COLUMN IF NOT EXISTS units_produced_estimate  text,
  -- From first-pass expansion (search/autocomplete critical)
  ADD COLUMN IF NOT EXISTS model_aliases            text[],
  ADD COLUMN IF NOT EXISTS production_status        text,
  -- Proposed: action mechanism detail (beyond coarse Bolt/Semi-Auto/Lever/Revolver/Pump)
  ADD COLUMN IF NOT EXISTS action_detail            text,
  -- Proposed: historical era for field guide and milsurp categorization
  ADD COLUMN IF NOT EXISTS era                      text,
  -- Proposed: cross-platform magazine compatibility for app utility
  ADD COLUMN IF NOT EXISTS magazine_compatibility   text[];

COMMENT ON COLUMN public.gun_models.platform_family IS
  'Parts/action family grouping for accessory cross-reference and platform-based filtering. e.g. AR-15, AK-47, 1911, Glock 19, Rem 700 pattern, CZ 75.';

COMMENT ON COLUMN public.gun_models.caliber_options IS
  'All calibers this model is factory-available in. Array of strings. e.g. {9mm Luger,.40 S&W,.45 ACP}.';

COMMENT ON COLUMN public.gun_models.units_produced_estimate IS
  'Estimated total production as TEXT to allow ranges and qualifiers. e.g. "~37,000,000", "500,000–750,000", "Active production", "Unknown".';

COMMENT ON COLUMN public.gun_models.model_aliases IS
  'Alternate names, abbreviations, shorthand, punctuation variants, and common user inputs for typeahead/fuzzy search. e.g. {G19,"Glock 19","glock19","19 Gen5"}.';

COMMENT ON COLUMN public.gun_models.production_status IS
  'Controlled values: Active | Discontinued | Historic | Military Only | Limited Run | Mixed. Supplements the discontinued boolean with richer context.';

COMMENT ON COLUMN public.gun_models.action_detail IS
  'Mechanism sub-type beyond the coarse action column. e.g. Striker-fired, DA/SA, SAO, DAO, Direct Impingement, Short-stroke piston, Inertia-driven, Blowback, Recoil-operated. Enables meaningful filtering and AI assistant context.';

COMMENT ON COLUMN public.gun_models.era IS
  'Historical era of introduction/primary use. e.g. Pre-WWI, WWI, Interwar, WWII, Cold War, Post-Cold War, Modern, Current. Enables field guide categorization and milsurp context.';

COMMENT ON COLUMN public.gun_models.magazine_compatibility IS
  'Cross-platform magazine compatibility notes. e.g. {"Glock 17/19 Gen3+","STANAG/AR-15 PMAG","AK-pattern 7.62x39"}. High-value for app features and AI assistant.';

-- ── 2. INDEXES ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_gun_models_platform_family ON public.gun_models (platform_family);
CREATE INDEX IF NOT EXISTS idx_gun_models_production_status ON public.gun_models (production_status);
CREATE INDEX IF NOT EXISTS idx_gun_models_era ON public.gun_models (era);
CREATE INDEX IF NOT EXISTS idx_gun_models_model_aliases ON public.gun_models USING GIN (model_aliases);
CREATE INDEX IF NOT EXISTS idx_gun_models_caliber_options ON public.gun_models USING GIN (caliber_options);
CREATE INDEX IF NOT EXISTS idx_gun_models_magazine_compat ON public.gun_models USING GIN (magazine_compatibility);
