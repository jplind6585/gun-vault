-- ============================================================
-- optic_models v2: new columns + data enrichment
-- Adds: mounting_footprint, emitter_type, market_tier, model_aliases
-- Enriches existing rows; inserts ~115 net-new optics from 3 batches
-- Run: npx supabase db query --linked -f supabase/migrations/20260415_optic_models_v2.sql
-- ============================================================

-- ── 1. NEW COLUMNS ─────────────────────────────────────────────────────────────

ALTER TABLE public.optic_models
  ADD COLUMN IF NOT EXISTS mounting_footprint  text,
  ADD COLUMN IF NOT EXISTS emitter_type        text,
  ADD COLUMN IF NOT EXISTS market_tier         text,
  ADD COLUMN IF NOT EXISTS model_aliases       text[];

COMMENT ON COLUMN public.optic_models.mounting_footprint IS
  'Mounting interface for pistol optics (RMR, RMSc, DeltaPoint_Pro, ACRO, Docter/Noblex) or Picatinny for rifle optics.';
COMMENT ON COLUMN public.optic_models.emitter_type IS
  'LED housing style for red dots: open (exposed LED), closed (enclosed/sealed). NULL for scopes, prisms, thermal, etc.';
COMMENT ON COLUMN public.optic_models.market_tier IS
  'Controlled values: entry, budget, mid_range, premium, elite. Based on durability, glass quality, real-world use, and reputation — not price alone.';
COMMENT ON COLUMN public.optic_models.model_aliases IS
  'Alternate names, shorthand, and common search terms for typeahead matching. e.g. {RMR, "RMR T2", "Trijicon RMR"}.';

-- ── 2. INDEXES ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_optic_models_market_tier        ON public.optic_models (market_tier);
CREATE INDEX IF NOT EXISTS idx_optic_models_mounting_footprint ON public.optic_models (mounting_footprint);
CREATE INDEX IF NOT EXISTS idx_optic_models_emitter_type       ON public.optic_models (emitter_type);
CREATE INDEX IF NOT EXISTS idx_optic_models_model_aliases      ON public.optic_models USING GIN (model_aliases);

-- ── 3. ENRICH EXISTING ROWS: mounting_footprint ────────────────────────────────

-- All scope-style optics → Picatinny
UPDATE public.optic_models
SET mounting_footprint = 'Picatinny'
WHERE optic_type IN ('LPVO','Scope','Holographic','Prism','Magnifier','Rangefinder','Thermal','Night Vision')
  AND mounting_footprint IS NULL;

-- Rifle red dots → Picatinny
UPDATE public.optic_models
SET mounting_footprint = 'Picatinny'
WHERE optic_type = 'Red Dot'
  AND weight_oz > 2.5
  AND mounting_footprint IS NULL;

-- Known RMR footprint
UPDATE public.optic_models SET mounting_footprint = 'RMR'
WHERE (brand='Trijicon'      AND model IN ('RMR Type 2','RMR CC','SRO'))
   OR (brand='Holosun'       AND model IN ('507C','507C X2','407C'))
   OR (brand='SIG Sauer'     AND model  = 'Romeo1 PRO');

-- ACRO footprint (Aimpoint ACRO P-2)
UPDATE public.optic_models SET mounting_footprint = 'ACRO'
WHERE brand='Aimpoint' AND model='ACRO P-2';

-- DeltaPoint Pro footprint
UPDATE public.optic_models SET mounting_footprint = 'DeltaPoint_Pro'
WHERE brand='Leupold' AND model='Deltapoint Pro';

-- RMSc footprint
UPDATE public.optic_models SET mounting_footprint = 'RMSc'
WHERE (brand='Holosun'   AND model IN ('507K','SCS-MOS'))
   OR (brand='SIG Sauer' AND model IN ('Romeo Zero','Romeo Zero Elite'));

-- Docter/Noblex footprint (Burris FastFire 3)
UPDATE public.optic_models SET mounting_footprint = 'Docter/Noblex'
WHERE brand='Burris' AND model='FastFire 3';

-- Remaining small-format pistol red dots → RMR default
UPDATE public.optic_models
SET mounting_footprint = 'RMR'
WHERE optic_type = 'Red Dot'
  AND mounting_footprint IS NULL;

-- ── 4. ENRICH EXISTING ROWS: emitter_type ─────────────────────────────────────

-- Open emitter pistol optics
UPDATE public.optic_models SET emitter_type = 'open'
WHERE (brand='Trijicon'      AND model IN ('RMR Type 2','RMR CC','SRO'))
   OR (brand='Holosun'       AND model IN ('507C','507C X2','407C','507K','HE510C-GR Elite','510C','SCRS','HS403B'))
   OR (brand='Leupold'       AND model  = 'Deltapoint Pro')
   OR (brand='SIG Sauer'     AND model IN ('Romeo Zero','Romeo Zero Elite','Romeo1 PRO','Romeo5','Romeo7'))
   OR (brand='Burris'        AND model  = 'FastFire 3')
   OR (brand='Primary Arms'  AND model  = 'SLx MD-25')
   OR (brand='Crimson Trace' AND model  = 'RAW 1x')
   OR (brand='Vortex'        AND model IN ('Crossfire Red Dot','SPARC AR'))
   OR (brand='Trijicon'      AND model IN ('MRO','MRO HD'))
   OR (brand='Aimpoint'      AND model IN ('PRO','CompM5','CompM5s','T2','Micro T-2','CompM4s','Duty RDS'))
   OR (brand='Bushnell'      AND model IN ('First Strike 2.0','RXS-100'))
   OR (brand='UTG/Leapers'   AND model  = 'Micro Red Dot');

-- Closed emitter
UPDATE public.optic_models SET emitter_type = 'closed'
WHERE (brand='Aimpoint' AND model = 'ACRO P-2')
   OR (brand='Holosun'  AND model IN ('AEMS','SCS-MOS'));

-- ── 5. ENRICH EXISTING ROWS: market_tier via MSRP ─────────────────────────────

UPDATE public.optic_models
SET market_tier = CASE
  WHEN msrp_usd < 100  THEN 'entry'
  WHEN msrp_usd < 300  THEN 'budget'
  WHEN msrp_usd < 800  THEN 'mid_range'
  WHEN msrp_usd < 2500 THEN 'premium'
  ELSE 'elite'
END
WHERE market_tier IS NULL AND msrp_usd IS NOT NULL;

-- Manual overrides for brand/reputation corrections
-- Aimpoint T2/Micro T-2: $799 but elite-tier reputation
UPDATE public.optic_models SET market_tier = 'premium'
WHERE brand='Aimpoint' AND model IN ('T2','Micro T-2','CompM5','CompM5s');

-- Swarovski, Zeiss, Schmidt & Bender, Kahles, Nightforce high-end → elite
UPDATE public.optic_models SET market_tier = 'elite'
WHERE brand IN ('Swarovski','Kahles','March')
  AND msrp_usd >= 2000;

UPDATE public.optic_models SET market_tier = 'elite'
WHERE brand IN ('Schmidt & Bender','Nightforce')
  AND msrp_usd >= 2500;

-- ── 6. INSERT NET-NEW OPTICS ───────────────────────────────────────────────────
-- Columns: brand, model, optic_type, mounting_footprint, emitter_type, market_tier,
--          illuminated, discontinued, focal_plane, country_of_origin
-- Numeric specs (magnification, weight, msrp, etc.) left NULL where not provided.
-- ON CONFLICT DO NOTHING for exact brand+model duplicates.

INSERT INTO public.optic_models
  (brand, model, optic_type, mounting_footprint, emitter_type, market_tier,
   illuminated, discontinued, focal_plane, country_of_origin)
VALUES

-- ── BATCH 1: PISTOL RED DOTS ──────────────────────────────────────────────────
('Holosun','407K X2','Red Dot','RMSc','open','budget',true,false,'N/A','China'),
('Holosun','507K X2','Red Dot','RMSc','open','mid_range',true,false,'N/A','China'),
('Holosun','EPS MRS Green','Red Dot','RMR','closed','premium',true,false,'N/A','China'),
('Holosun','EPS Carry Green','Red Dot','RMSc','closed','premium',true,false,'N/A','China'),
('Holosun','SCS PDP','Red Dot','RMSc','closed','mid_range',true,false,'N/A','China'),
('Holosun','SCS VP9','Red Dot','RMSc','closed','mid_range',true,false,'N/A','China'),
('Holosun','509T X2','Red Dot','ACRO','closed','premium',true,false,'N/A','China'),
('SIG Sauer','Romeo-X Compact','Red Dot','RMSc','open','mid_range',true,false,'N/A','USA'),
('SIG Sauer','RomeoZero Pro','Red Dot','DeltaPoint_Pro','open','mid_range',true,false,'N/A','USA'),
('SIG Sauer','Romeo-M17','Red Dot','DeltaPoint_Pro','closed','premium',true,false,'N/A','USA'),
('Swampfox','Justice II','Red Dot','RMR','open','budget',true,false,'N/A','USA'),
('Swampfox','Liberty II','Red Dot','RMR','open','budget',true,false,'N/A','USA'),
('Swampfox','Kraken','Red Dot','ACRO','closed','mid_range',true,false,'N/A','USA'),
('Shield Sights','RMSx','Red Dot','RMSc','open','mid_range',true,false,'N/A','UK'),
('Shield Sights','SMS2','Red Dot','RMSc','open','budget',true,false,'N/A','UK'),
('Bushnell','RXM-300','Red Dot','DeltaPoint_Pro','open','mid_range',true,false,'N/A','USA'),
('Bushnell','RXC-200','Red Dot','RMSc','open','budget',true,false,'N/A','USA'),
('Viridian','RFX35','Red Dot','RMR','open','budget',true,false,'N/A','USA'),
('Viridian','RFX45','Red Dot','RMR','open','budget',true,false,'N/A','USA'),

-- ── BATCH 1: RIFLE RED DOTS ───────────────────────────────────────────────────
('Aimpoint','Micro T-1','Red Dot','Picatinny','closed','premium',true,true,'N/A','Sweden'),
('Holosun','HS510C','Red Dot','Picatinny','open','mid_range',true,false,'N/A','China'),
('Holosun','HE510C','Red Dot','Picatinny','open','mid_range',true,false,'N/A','China'),
('Holosun','HS512C','Red Dot','Picatinny','closed','mid_range',true,false,'N/A','China'),
('Holosun','HS515CM','Red Dot','Picatinny','closed','mid_range',true,false,'N/A','China'),
('Holosun','AEMS Core','Red Dot','Picatinny','closed','mid_range',true,false,'N/A','China'),
('SIG Sauer','Romeo MSR','Red Dot','Picatinny','open','budget',true,false,'N/A','USA'),
('Vortex','Crossfire Red Dot Gen II','Red Dot','Picatinny','open','budget',true,false,'N/A','USA'),
('Primary Arms','MD-25','Red Dot','Picatinny','open','budget',true,false,'N/A','USA'),

-- ── BATCH 1: HOLOGRAPHIC ─────────────────────────────────────────────────────
('EOTech','518','Holographic','Picatinny',NULL,'premium',true,true,'N/A','USA'),
('EOTech','558','Holographic','Picatinny',NULL,'premium',true,true,'N/A','USA'),

-- ── BATCH 1: LPVO ────────────────────────────────────────────────────────────
('Nightforce','NX8 1-8x','LPVO','Picatinny',NULL,'elite',true,false,NULL,'USA'),
('Nightforce','ATACR 1-8x','LPVO','Picatinny',NULL,'elite',true,false,NULL,'USA'),
('Vortex','Razor Gen III 1-10x','LPVO','Picatinny',NULL,'premium',true,false,NULL,'USA'),
('Vortex','Viper PST Gen II 1-6x','LPVO','Picatinny',NULL,'mid_range',true,false,NULL,'USA'),
('Primary Arms','GLx 1-6x','LPVO','Picatinny',NULL,'mid_range',true,false,NULL,'USA'),
('Primary Arms','PLx Compact 1-8x','LPVO','Picatinny',NULL,'premium',true,false,NULL,'USA'),
('Leupold','VX-6HD 1-6x','LPVO','Picatinny',NULL,'premium',true,false,NULL,'USA'),
('Burris','RT-6','LPVO','Picatinny',NULL,'budget',true,false,NULL,'USA'),

-- ── BATCH 1: PRECISION SCOPE ─────────────────────────────────────────────────
('Nightforce','ATACR 7-35x','Scope','Picatinny',NULL,'elite',false,false,NULL,'USA'),
('Nightforce','NXS 5.5-22x','Scope','Picatinny',NULL,'premium',false,false,NULL,'USA'),
('Schmidt & Bender','PM II 5-25x','Scope','Picatinny',NULL,'elite',false,false,NULL,'Germany'),
('Zero Compromise','ZC420','Scope','Picatinny',NULL,'elite',false,false,NULL,'Austria'),
('Tangent Theta','TT525P','Scope','Picatinny',NULL,'elite',false,false,NULL,'Canada'),
('Vortex','Razor Gen II 4.5-27x','Scope','Picatinny',NULL,'premium',false,false,NULL,'USA'),
('Leupold','Mark 5HD','Scope','Picatinny',NULL,'premium',false,false,NULL,'USA'),
('Burris','XTR III','Scope','Picatinny',NULL,'premium',false,false,NULL,'USA'),
('Athlon','Cronus BTR','Scope','Picatinny',NULL,'mid_range',false,false,NULL,'USA'),

-- ── BATCH 1: PRISM ───────────────────────────────────────────────────────────
('Primary Arms','SLx MicroPrism 3x','Prism','Picatinny',NULL,'mid_range',true,false,'FFP','USA'),
('Primary Arms','SLx MicroPrism 5x','Prism','Picatinny',NULL,'mid_range',true,false,'FFP','USA'),
('Vortex','Spitfire HD Gen II 3x','Prism','Picatinny',NULL,'mid_range',true,false,'FFP','USA'),
('SIG Sauer','Bravo3','Prism','Picatinny',NULL,'mid_range',true,false,'FFP','USA'),

-- ── BATCH 1: THERMAL ─────────────────────────────────────────────────────────
('Pulsar','Thermion 2 XP50','Thermal','Picatinny',NULL,'premium',false,false,'N/A','Belarus'),
('AGM','Rattler TS25','Thermal','Picatinny',NULL,'mid_range',false,false,'N/A','China'),

-- ── BATCH 2: PISTOL RED DOTS ──────────────────────────────────────────────────
('Trijicon','RMR Type 1','Red Dot','RMR','open','premium',true,true,'N/A','USA'),
('Trijicon','SRO 5 MOA','Red Dot','RMR','open','premium',true,false,'N/A','USA'),
('Trijicon','SRO 2.5 MOA','Red Dot','RMR','open','premium',true,false,'N/A','USA'),
('Holosun','507C X2 Green','Red Dot','RMR','open','mid_range',true,false,'N/A','China'),
('Holosun','407C X2 Green','Red Dot','RMR','open','budget',true,false,'N/A','China'),
('Holosun','508T X2 Green','Red Dot','RMR','open','premium',true,false,'N/A','China'),
('Holosun','509T Green','Red Dot','ACRO','closed','premium',true,false,'N/A','China'),
('SIG Sauer','Romeo1','Red Dot','DeltaPoint_Pro','open','mid_range',true,false,'N/A','USA'),
('SIG Sauer','RomeoZero Green','Red Dot','RMSc','open','budget',true,false,'N/A','USA'),
('Swampfox','Sentinel Manual','Red Dot','RMSc','open','budget',true,false,'N/A','USA'),
('Swampfox','Sentinel Auto Green','Red Dot','RMSc','open','budget',true,false,'N/A','USA'),
('Crimson Trace','CTS-1550 Green','Red Dot','RMSc','open','budget',true,false,'N/A','USA'),
('Crimson Trace','CTS-1250 Green','Red Dot','RMSc','open','budget',true,false,'N/A','USA'),

-- ── BATCH 2: RIFLE RED DOTS ───────────────────────────────────────────────────
('Aimpoint','CompM3 2MOA','Red Dot','Picatinny','closed','premium',true,true,'N/A','Sweden'),
('Aimpoint','Micro H-1 2MOA','Red Dot','Picatinny','closed','premium',true,false,'N/A','Sweden'),
('Holosun','HS503CU','Red Dot','Picatinny','open','mid_range',true,false,'N/A','China'),
('Holosun','HE515GT','Red Dot','Picatinny','closed','mid_range',true,false,'N/A','China'),
('SIG Sauer','Romeo5 XDR','Red Dot','Picatinny','open','mid_range',true,false,'N/A','USA'),
('SIG Sauer','Romeo4H','Red Dot','Picatinny','closed','mid_range',true,false,'N/A','USA'),
('Vortex','Sparc AR II','Red Dot','Picatinny','open','budget',true,false,'N/A','USA'),
('Vortex','Strikefire II Green','Red Dot','Picatinny','open','budget',true,false,'N/A','USA'),
('Primary Arms','Advanced Micro Dot Gen 2','Red Dot','Picatinny','open','budget',true,false,'N/A','USA'),

-- ── BATCH 2: HOLOGRAPHIC ─────────────────────────────────────────────────────
('EOTech','EXPS2-0','Holographic','Picatinny',NULL,'premium',true,false,'N/A','USA'),
('EOTech','XPS2-0','Holographic','Picatinny',NULL,'premium',true,false,'N/A','USA'),
('Vortex','AMG UH-1 Gen I','Holographic','Picatinny',NULL,'premium',true,true,'N/A','USA'),

-- ── BATCH 2: LPVO ────────────────────────────────────────────────────────────
('Primary Arms','SLx 1-6x Gen III','LPVO','Picatinny',NULL,'mid_range',true,false,NULL,'USA'),
('Primary Arms','SLx 1-8x Gen III','LPVO','Picatinny',NULL,'mid_range',true,false,NULL,'USA'),
('Vortex','Strike Eagle 1-6x Gen I','LPVO','Picatinny',NULL,'budget',true,true,NULL,'USA'),
('Vortex','Strike Eagle 1-8x Gen I','LPVO','Picatinny',NULL,'budget',true,true,NULL,'USA'),
('Leupold','VX-R Patrol 1.25-4x','LPVO','Picatinny',NULL,'mid_range',true,false,NULL,'USA'),
('Trijicon','AccuPower 1-4x','LPVO','Picatinny',NULL,'premium',true,false,NULL,'USA'),
('Athlon','Argos BTR 1-8x','LPVO','Picatinny',NULL,'budget',true,false,NULL,'USA'),

-- ── BATCH 2: PRECISION SCOPE ─────────────────────────────────────────────────
('Nightforce','NXS 2.5-10x','Scope','Picatinny',NULL,'premium',false,false,NULL,'USA'),
('Vortex','Viper PST Gen I 6-24x','Scope','Picatinny',NULL,'mid_range',false,true,NULL,'USA'),
('Leupold','Mark 4 LR/T','Scope','Picatinny',NULL,'premium',false,true,NULL,'USA'),
('Bushnell','Elite Tactical DMR II','Scope','Picatinny',NULL,'mid_range',false,false,NULL,'USA'),
('Athlon','Ares BTR Gen I','Scope','Picatinny',NULL,'mid_range',false,false,NULL,'USA'),
('Arken','SH4 4-16x','Scope','Picatinny',NULL,'budget',false,false,NULL,'USA'),

-- ── BATCH 2: PRISM ───────────────────────────────────────────────────────────
('Primary Arms','SLx 3x Prism','Prism','Picatinny',NULL,'mid_range',true,false,'FFP','USA'),
('Vortex','Spitfire AR 3x Gen I','Prism','Picatinny',NULL,'mid_range',true,true,'FFP','USA'),
('Burris','AR-332','Prism','Picatinny',NULL,'mid_range',true,false,'FFP','USA'),
('SIG Sauer','Bravo4 Prism','Prism','Picatinny',NULL,'mid_range',true,false,'FFP','USA'),

-- ── BATCH 2: THERMAL ─────────────────────────────────────────────────────────
('Pulsar','Thermion XQ38','Thermal','Picatinny',NULL,'premium',false,false,'N/A','Belarus'),
('AGM','Adder TS35-384','Thermal','Picatinny',NULL,'mid_range',false,false,'N/A','China'),

-- ── BATCH 3: PISTOL RED DOTS ──────────────────────────────────────────────────
('Trijicon','RMRcc','Red Dot','RMSc','open','premium',true,false,'N/A','USA'),
('Trijicon','RMR Dual Illuminated','Red Dot','RMR','open','premium',true,false,'N/A','USA'),
('Holosun','507K Green','Red Dot','RMSc','open','mid_range',true,false,'N/A','China'),
('Holosun','407K Green','Red Dot','RMSc','open','budget',true,false,'N/A','China'),
('Holosun','507C ACSS Vulcan Green','Red Dot','RMR','open','mid_range',true,false,'N/A','China'),
('SIG Sauer','RomeoZero Elite Green Circle Dot','Red Dot','RMSc','open','budget',true,false,'N/A','USA'),
('SIG Sauer','Romeo2 3 MOA','Red Dot','DeltaPoint_Pro','closed','premium',true,false,'N/A','USA'),
('Swampfox','Liberty Green Dot','Red Dot','RMR','open','budget',true,false,'N/A','USA'),
('Swampfox','Justice Green Dot','Red Dot','RMR','open','budget',true,false,'N/A','USA'),
('Shield Sights','RMSw Glass Edition','Red Dot','RMSc','open','mid_range',true,false,'N/A','UK'),
('Burris','FastFire 3 8MOA','Red Dot','Docter/Noblex','open','budget',true,false,'N/A','USA'),

-- ── BATCH 3: RIFLE RED DOTS ───────────────────────────────────────────────────
('Aimpoint','CompM2 4MOA','Red Dot','Picatinny','closed','premium',true,true,'N/A','Sweden'),
('Aimpoint','PRO Patrol Rifle Optic','Red Dot','Picatinny','open','mid_range',true,false,'N/A','Sweden'),
('Holosun','HS503R','Red Dot','Picatinny','open','mid_range',true,false,'N/A','China'),
('Holosun','HS515GM','Red Dot','Picatinny','closed','mid_range',true,false,'N/A','China'),
('SIG Sauer','Romeo5 Gen II','Red Dot','Picatinny','open','mid_range',true,false,'N/A','USA'),
('SIG Sauer','Romeo7S','Red Dot','Picatinny','closed','mid_range',true,false,'N/A','USA'),
('Vortex','Sparc Solar Red Dot','Red Dot','Picatinny','open','mid_range',true,false,'N/A','USA'),
('Primary Arms','MD-RB-AD','Red Dot','Picatinny','open','budget',true,false,'N/A','USA'),

-- ── BATCH 3: HOLOGRAPHIC ─────────────────────────────────────────────────────
('EOTech','512.A65','Holographic','Picatinny',NULL,'premium',true,true,'N/A','USA'),
('EOTech','552.A65','Holographic','Picatinny',NULL,'premium',true,true,'N/A','USA'),

-- ── BATCH 3: LPVO ────────────────────────────────────────────────────────────
('Primary Arms','SLx 1-6x ACSS Gen II','LPVO','Picatinny',NULL,'mid_range',true,false,NULL,'USA'),
('Primary Arms','SLx 1-8x ACSS Gen II','LPVO','Picatinny',NULL,'mid_range',true,false,NULL,'USA'),
('Vortex','Crossfire II 1-4x','LPVO','Picatinny',NULL,'budget',true,false,NULL,'USA'),
('Leupold','VX-Freedom 1.5-4x Pig Plex','LPVO','Picatinny',NULL,'budget',true,false,NULL,'USA'),
('Trijicon','AccuPoint 1-4x TR24','LPVO','Picatinny',NULL,'premium',true,false,NULL,'USA'),
('Burris','MTAC 1-4x','LPVO','Picatinny',NULL,'budget',true,false,NULL,'USA'),
('Athlon','Talos BTR 1-4x','LPVO','Picatinny',NULL,'budget',true,false,NULL,'USA'),

-- ── BATCH 3: PRECISION SCOPE ─────────────────────────────────────────────────
('Nightforce','SHV 4-14x','Scope','Picatinny',NULL,'premium',false,false,NULL,'USA'),
('Vortex','Diamondback Tactical 4-16x','Scope','Picatinny',NULL,'budget',false,false,NULL,'USA'),
('Vortex','Crossfire II 6-24x','Scope','Picatinny',NULL,'budget',false,false,NULL,'USA'),
('Leupold','VX-3i 3.5-10x','Scope','Picatinny',NULL,'premium',false,false,NULL,'USA'),
('Bushnell','Banner Dusk & Dawn','Scope','Picatinny',NULL,'entry',false,false,NULL,'USA'),
('Athlon','Talos 4-16x','Scope','Picatinny',NULL,'budget',false,false,NULL,'USA'),
('Arken','EP4 6-24x','Scope','Picatinny',NULL,'budget',false,false,NULL,'USA'),

-- ── BATCH 3: PRISM ───────────────────────────────────────────────────────────
('Primary Arms','SLx 2.5x Prism','Prism','Picatinny',NULL,'mid_range',true,false,'FFP','USA'),
('Vortex','Spitfire 1x Prism','Prism','Picatinny',NULL,'mid_range',true,false,'N/A','USA'),
('Burris','AR-1X Prism','Prism','Picatinny',NULL,'mid_range',true,false,'N/A','USA'),
('SIG Sauer','Bravo5 Prism','Prism','Picatinny',NULL,'mid_range',true,false,'FFP','USA'),

-- ── BATCH 3: THERMAL ─────────────────────────────────────────────────────────
('Pulsar','Thermion 2 XQ50','Thermal','Picatinny',NULL,'premium',false,false,'N/A','Belarus'),
('AGM','Rattler TS35-640','Thermal','Picatinny',NULL,'mid_range',false,false,'N/A','China')

ON CONFLICT (brand, model) DO NOTHING;
