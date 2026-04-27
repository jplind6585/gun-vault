-- ============================================================
-- manufacturers v3 — Phase 1: Schema additions
-- New columns: entity_type, known_for, notable_designers,
--              price_tier_entry_usd, has_military_contract,
--              military_notes, trivia
-- ============================================================

ALTER TABLE public.manufacturers
  ADD COLUMN IF NOT EXISTS entity_type           text,          -- 'Manufacturer' | 'Brand' | 'Importer' | 'OEM' | 'Military Arsenal' | 'Defunct Maker'
  ADD COLUMN IF NOT EXISTS known_for             text[],        -- e.g. ARRAY['1911s','lever actions']
  ADD COLUMN IF NOT EXISTS notable_designers     text[],        -- e.g. ARRAY['John Moses Browning']
  ADD COLUMN IF NOT EXISTS price_tier_entry_usd  integer,       -- approx floor MSRP for cheapest complete firearm
  ADD COLUMN IF NOT EXISTS has_military_contract boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS military_notes        text,          -- e.g. 'US Army M17/M18 (2017–present)'
  ADD COLUMN IF NOT EXISTS trivia                text;          -- single curated "signature fact" for Field Guide cards

COMMENT ON COLUMN public.manufacturers.entity_type          IS 'Manufacturer | Brand | Importer | OEM | Military Arsenal | Defunct Maker';
COMMENT ON COLUMN public.manufacturers.known_for            IS 'Short product-category tags used for browse/filter';
COMMENT ON COLUMN public.manufacturers.notable_designers    IS 'Key designers associated with this manufacturer';
COMMENT ON COLUMN public.manufacturers.price_tier_entry_usd IS 'Approximate floor MSRP (USD) for cheapest complete firearm from this maker';
COMMENT ON COLUMN public.manufacturers.has_military_contract IS 'True if manufacturer holds or has held a significant military/LE contract';
COMMENT ON COLUMN public.manufacturers.military_notes       IS 'Details on military/LE adoption — platform, country, year range';
COMMENT ON COLUMN public.manufacturers.trivia               IS 'Single curated memorable fact for Field Guide card display';
