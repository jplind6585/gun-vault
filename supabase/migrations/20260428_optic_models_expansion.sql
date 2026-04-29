-- ============================================================
-- optic_models expansion
-- 5 new columns + accuracy fixes + 75 new rows (50 audit + 15 additional + 10 rangefinders)
-- Run once in Supabase SQL Editor
-- 2026-04-28
-- ============================================================


-- ══════════════════════════════════════════════════════════════
-- SECTION 1: NEW COLUMNS
-- ══════════════════════════════════════════════════════════════

ALTER TABLE optic_models
  ADD COLUMN IF NOT EXISTS nv_compatible       BOOLEAN,
  ADD COLUMN IF NOT EXISTS zero_stop           BOOLEAN,
  ADD COLUMN IF NOT EXISTS eye_relief_in       NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS fov_at_min_ft       NUMERIC(6,1),
  ADD COLUMN IF NOT EXISTS submersion_depth_m  INTEGER;

COMMENT ON COLUMN optic_models.nv_compatible      IS 'Has dedicated NV-brightness settings for use with image-intensified NV devices (PVS-14 etc). Distinct from just having low brightness settings.';
COMMENT ON COLUMN optic_models.zero_stop          IS 'Elevation turret has a mechanical zero-stop (revolution limiter) preventing below-zero travel.';
COMMENT ON COLUMN optic_models.eye_relief_in      IS 'Eye relief in inches at rated magnification.';
COMMENT ON COLUMN optic_models.fov_at_min_ft      IS 'Field of view in feet at 100 yards at minimum magnification (or operating magnification for fixed-power/red dots). NULL for optics with effectively unlimited FOV.';
COMMENT ON COLUMN optic_models.submersion_depth_m IS 'Waterproofing submersion rating in meters. NULL = not rated. 0 = splash-resistant only.';


-- ══════════════════════════════════════════════════════════════
-- SECTION 2: ACCURACY FIXES
-- ══════════════════════════════════════════════════════════════

-- 1. Nightforce BEAST 5-25x56 — weight was 69.8 oz (physically impossible), correct is 39.9 oz
UPDATE optic_models SET weight_oz = 39.9, updated_at = NOW()
WHERE brand = 'Nightforce' AND model ILIKE '%BEAST%';

-- 2. Vortex Golden Eagle HD 15-60x52 — tube diameter was 35mm, correct is 34mm
UPDATE optic_models SET tube_diameter_mm = 34, updated_at = NOW()
WHERE brand = 'Vortex' AND model ILIKE '%Golden Eagle%';

-- 3. Zeiss LRP S5 3.6-18x50 — MRAD turrets paired with MOA reticle name (ZFmoa-2).
--    MRAD-turret SKU uses ZFmrad-2 reticle. Correcting reticle to match turret_unit.
UPDATE optic_models SET reticle_name = 'ZFmrad-2', updated_at = NOW()
WHERE brand = 'Zeiss' AND model ILIKE '%LRP S5%3.6-18%';

-- 4. tube_diameter_mm = 1 — stored in inches instead of mm on four 1-inch tube scopes.
--    Correct value is 25 (industry shorthand; exact is 25.4).
UPDATE optic_models SET tube_diameter_mm = 25, updated_at = NOW()
WHERE tube_diameter_mm = 1;

-- 5. SIG Romeo-M17 — mounting_footprint was 'DeltaPoint_Pro', correct is SIG-proprietary M17 cut
UPDATE optic_models SET mounting_footprint = 'SIG_M17', updated_at = NOW()
WHERE brand = 'SIG Sauer' AND model ILIKE '%Romeo-M17%';

-- 6. Aimpoint CompM3 — emitter_type was 'closed', correct is 'open' (tube-style open emitter)
UPDATE optic_models SET emitter_type = 'open', updated_at = NOW()
WHERE brand = 'Aimpoint' AND model ILIKE '%CompM3%';

-- 7. EOTech 518/558/512/552 stubs — marked 'premium', should be 'mid_range' to match XPS/EXPS line
UPDATE optic_models SET market_tier = 'mid_range', updated_at = NOW()
WHERE brand = 'EOTech' AND model IN ('518', '558', '512', '552');

-- 8. Populate the previously empty Tangent Theta TT525P stub
UPDATE optic_models SET
  optic_type          = 'Scope',
  magnification_min   = 5,
  magnification_max   = 25,
  objective_mm        = 56,
  focal_plane         = 'FFP',
  illuminated         = false,
  reticle_name        = 'TT MIL',
  turret_unit         = 'MRAD',
  click_value_mrad    = 0.1,
  weight_oz           = 52.0,
  msrp_usd            = 5800,
  discontinued        = false,
  country_of_origin   = 'Canada',
  description         = 'Hand-assembled Canadian precision scope. Used by Canadian Armed Forces snipers. Exceptional optical and mechanical precision. One of the most respected precision scopes made in North America.',
  tube_diameter_mm    = 34,
  military_use        = true,
  mounting_footprint  = 'Picatinny',
  market_tier         = 'elite',
  model_aliases       = 'TT525P',
  updated_at          = NOW()
WHERE brand = 'Tangent Theta' AND model ILIKE '%TT525P%';


-- ══════════════════════════════════════════════════════════════
-- SECTION 3: REMOVE DUPLICATE ROWS
-- ══════════════════════════════════════════════════════════════

-- Aimpoint Micro T-2 IS the T-2 (Aimpoint's official name is "Micro T-2").
-- Update T-2 aliases, then delete the redundant stub.
UPDATE optic_models SET
  model_aliases = CASE
    WHEN model_aliases IS NULL OR model_aliases = '' THEN 'Micro T-2'
    ELSE model_aliases || '; Micro T-2'
  END,
  updated_at = NOW()
WHERE brand = 'Aimpoint' AND model IN ('T-2', 'T2');

DELETE FROM optic_models
WHERE brand = 'Aimpoint' AND model = 'Micro T-2';

-- Aimpoint PRO Patrol Rifle Optic — exact duplicate of PRO entry.
UPDATE optic_models SET
  model_aliases = CASE
    WHEN model_aliases IS NULL OR model_aliases = '' THEN 'Patrol Rifle Optic'
    ELSE model_aliases || '; Patrol Rifle Optic'
  END,
  updated_at = NOW()
WHERE brand = 'Aimpoint' AND model = 'PRO';

DELETE FROM optic_models
WHERE brand = 'Aimpoint' AND model = 'PRO Patrol Rifle Optic';

-- Burris RT-6 — stub duplicate of RT-6 1-6x24. Delete the stub only (weight NULL = stub).
UPDATE optic_models SET
  model_aliases = CASE
    WHEN model_aliases IS NULL OR model_aliases = '' THEN 'RT-6'
    ELSE model_aliases || '; RT-6'
  END,
  updated_at = NOW()
WHERE brand = 'Burris' AND model = 'RT-6 1-6x24';

DELETE FROM optic_models
WHERE brand = 'Burris' AND model = 'RT-6' AND weight_oz IS NULL;

-- Leupold VX-6HD 1-6x — stub duplicate of VX-6HD 1-6x24.
UPDATE optic_models SET
  model_aliases = CASE
    WHEN model_aliases IS NULL OR model_aliases = '' THEN 'VX-6HD 1-6x'
    ELSE model_aliases || '; VX-6HD 1-6x'
  END,
  updated_at = NOW()
WHERE brand = 'Leupold' AND model = 'VX-6HD 1-6x24';

DELETE FROM optic_models
WHERE brand = 'Leupold' AND model = 'VX-6HD 1-6x' AND weight_oz IS NULL;


-- ══════════════════════════════════════════════════════════════
-- SECTION 4: 49 NEW ROWS FROM AUDIT (TT525P handled via UPDATE above)
-- ══════════════════════════════════════════════════════════════

INSERT INTO optic_models (
  id, brand, model, optic_type,
  magnification_min, magnification_max, objective_mm,
  focal_plane, illuminated, reticle_name,
  turret_unit, click_value_moa, click_value_mrad,
  battery_type, weight_oz, msrp_usd, discontinued,
  country_of_origin, description,
  tube_diameter_mm, military_use,
  mounting_footprint, emitter_type, market_tier, model_aliases,
  created_at, updated_at
) VALUES

-- Cylee
('09015385-2ec5-4255-8ce9-31bd5f3ed888','Cylee','Wolf X Pro','Red Dot',
  NULL,NULL,NULL,NULL,true,'2 MOA Dot','MOA',NULL,NULL,
  'CR2032',1.3,60,false,'China',
  'Open emitter pistol/rifle red dot on RMR footprint. Solar backup panel. Shake-awake auto-on. 10 brightness settings. Popular budget alternative to Holosun 407/507 series.',
  NULL,false,'RMR','open','budget',NULL,NOW(),NOW()),

('5c6918fd-5065-4440-97a8-e19e1c7859c8','Cylee','Wolf X Pro Green','Red Dot',
  NULL,NULL,NULL,NULL,true,'2 MOA Dot','MOA',NULL,NULL,
  'CR2032',1.3,70,false,'China',
  'Green emitter variant of the Wolf X Pro. RMR footprint. Solar backup panel. Shake-awake auto-on.',
  NULL,false,'RMR','open','budget',NULL,NOW(),NOW()),

('6c3c04f7-b1e4-4e2f-9e06-d1d39b44afaf','Cylee','Eagle 1-6x24','LPVO',
  1,6,24,'SFP',true,'ACSS-style BDC','MOA',0.5,NULL,
  'CR2032',16.0,199,false,'China',
  'Budget entry-level LPVO. Illuminated SFP reticle. 30mm tube. Competitive at the sub-$200 price point.',
  30,false,'Picatinny',NULL,'budget',NULL,NOW(),NOW()),

-- Elcan
('1d3e942b-90d0-4b67-9fef-3dae89ca662c','Elcan','SpecterDR 1-4x32','LPVO',
  1,4,32,'FFP',true,'CQD','MOA',0.5,NULL,
  'CR123',21.2,2800,false,'Canada',
  'Dual-role optic switching between 1x CQB and 4x via lever. Used by US Army Rangers, Canadian Army, and numerous NATO forces. Instant magnification switch. Exceptionally rugged.',
  34,true,'Picatinny',NULL,'elite','SpecterDR 1x/4x',NOW(),NOW()),

('123a0531-b459-4ed7-ae29-b75d33bd05a0','Elcan','SpecterOS 4x32','Prism',
  4,4,32,'FFP',true,'Mil-Dot',NULL,NULL,NULL,
  'CR123',13.8,1400,false,'Canada',
  'Fixed 4x combat optic. Fiber optic and tritium battery-free illumination. Used by Canadian, US, and NATO special operations. Extremely durable. No traditional adjustment turrets.',
  NULL,true,'Picatinny',NULL,'premium',NULL,NOW(),NOW()),

-- Leica
('68e951f1-24b3-4b64-a278-bb4b267f67e4','Leica','Magnus i 1-6.3x24','LPVO',
  1,6.3,24,'FFP',true,'L-4a BDC','MRAD',NULL,0.1,
  'CR2032',18.0,3200,false,'Austria',
  'Premium Austrian LPVO with exceptional low-light performance. 30mm tube. Zero-stop turrets. Superb glass clarity across the full zoom range.',
  30,false,'Picatinny',NULL,'elite',NULL,NOW(),NOW()),

('579eb66d-bf9f-4d2b-a962-8f04c3892ede','Leica','Fortis 6 2-12x50','Scope',
  2,12,50,'SFP',true,'4A-I','MOA',0.25,NULL,
  'CR2032',20.6,2800,false,'Austria',
  'Versatile European hunting scope. Large 50mm objective for exceptional low-light transmission. Illuminated dot reticle. Leica optics heritage.',
  30,false,'Picatinny',NULL,'elite',NULL,NOW(),NOW()),

-- Hensoldt
('c3bcf458-0817-4e22-aa01-2b53054811b1','Hensoldt','ZF 3.5-26x56','Scope',
  3.5,26,56,'FFP',false,'MSR 3','MRAD',NULL,0.1,
  NULL,38.4,6500,false,'Germany',
  'Military sniper scope. Used by Bundeswehr, KSK, and numerous European military snipers. 34mm tube. Exceptional optical quality and mechanical precision.',
  34,true,'Picatinny',NULL,'elite',NULL,NOW(),NOW()),

('8af406aa-41c5-44d4-8055-7dfd5345c704','Hensoldt','ZF 6-24x56','Scope',
  6,24,56,'FFP',false,'MSR 2','MRAD',NULL,0.1,
  NULL,39.0,5800,false,'Germany',
  'Designated marksman variant. Military standard for German forces. Same elite optical standards as ZF 3.5-26x56. 34mm tube.',
  34,true,'Picatinny',NULL,'elite',NULL,NOW(),NOW()),

-- Tract Optics
('8ae053c1-996c-4a88-ad55-b3224df33476','Tract Optics','Toric 3-17x50','Scope',
  3,17,50,'FFP',false,'MIL','MRAD',NULL,0.1,
  NULL,28.2,1199,false,'USA',
  'Direct-to-consumer precision scope from Wyoming. FFP MRAD reticle. Zero-stop turrets. 34mm tube. Strong PRS presence at the value tier.',
  34,false,'Picatinny',NULL,'premium',NULL,NOW(),NOW()),

('019d6767-bf3d-4ca6-9136-5f26eb1f583b','Tract Optics','Tekoa 3-12x40','Scope',
  3,12,40,'SFP',false,'MOA','MOA',0.25,NULL,
  NULL,16.5,549,false,'USA',
  'Mid-range hunting and target scope. SFP MOA turrets. 30mm tube. Premium glass for the price from a direct-to-consumer brand.',
  30,false,'Picatinny',NULL,'mid_range',NULL,NOW(),NOW()),

('cdb37581-171c-4865-a0a8-c23d47a65a64','Tract Optics','Toric UHD 4.5-30x56','Scope',
  4.5,30,56,'FFP',false,'MIL','MRAD',NULL,0.1,
  NULL,36.8,1699,false,'USA',
  'Long-range precision scope from Tract. Ultra-High Definition glass. 34mm tube. Zero-stop. Competitive with more expensive European options.',
  34,false,'Picatinny',NULL,'premium',NULL,NOW(),NOW()),

-- Element Optics
('cbe71aee-a84c-4b81-82c8-2d76e7dbd45a','Element Optics','Helix 6-24x50','Scope',
  6,24,50,'FFP',false,'APRS-1D','MOA',0.1,NULL,
  NULL,26.0,599,false,'UK',
  'FFP precision scope. Outstanding value-to-glass ratio. 30mm tube. Popular with budget PRS shooters in UK and US long-range markets.',
  30,false,'Picatinny',NULL,'mid_range',NULL,NOW(),NOW()),

('36b12d25-425b-4477-8e43-f87b0c56e0cf','Element Optics','Nexus 5-20x50 FFP','Scope',
  5,20,50,'FFP',false,'APRS-5D','MRAD',NULL,0.1,
  NULL,36.0,1599,false,'UK',
  'Premium Element scope. 34mm tube. Exceptional glass clarity. Zero-stop. Widely praised in PRS and F-Class as punching well above its price.',
  34,false,'Picatinny',NULL,'premium',NULL,NOW(),NOW()),

-- Minox
('f6f49677-cd18-4976-b014-799d61a5fa0a','Minox','ZP5 5-25x56','Scope',
  5,25,56,'FFP',false,'MR','MRAD',NULL,0.1,
  NULL,30.9,2399,false,'Germany',
  'German precision scope. 34mm tube. Outstanding glass from Minox heritage. Zero-stop. Prominent in European precision rifle competitions.',
  34,false,'Picatinny',NULL,'premium',NULL,NOW(),NOW()),

('243c3d82-853a-40b9-a46a-d0746032bb81','Minox','ZX5i 2-10x40','Scope',
  2,10,40,'SFP',true,'Illuminated BDC','MOA',0.25,NULL,
  'CR2032',18.9,999,false,'Germany',
  'Mid-range German hunting scope. Illuminated dot on BDC reticle. 30mm tube. Minox optical quality at a competitive price.',
  30,false,'Picatinny',NULL,'mid_range',NULL,NOW(),NOW()),

-- Browe
('14d27d8a-ba31-4fd6-a225-746be6c8920b','Browe','BCO 4x32 ATWS','Prism',
  4,4,32,'FFP',true,'Mil-Dot','MOA',NULL,NULL,
  'CR2032',12.0,1499,false,'USA',
  'Battery-Coupled Optic. Military issue prism sight. Tritium and fiber optic illumination with CR2032 backup. Used by USSOCOM. Rugged beyond virtually any combat optic.',
  NULL,true,'Picatinny',NULL,'premium',NULL,NOW(),NOW()),

-- C-More
('f2f4ceb7-0d06-43cc-aafd-65cdfbae51e2','C-More','STS2 (2 MOA)','Red Dot',
  NULL,NULL,NULL,NULL,true,'2 MOA Dot','MOA',NULL,NULL,
  'CR2032',1.0,299,false,'USA',
  'Competition slide-ride red dot. Dominant in USPSA Open and Limited divisions for decades. Side battery replacement without removing optic. Legendary competition reliability.',
  NULL,false,'C-More_STS','open','mid_range','STS2; C-More STS',NOW(),NOW()),

('77fce4e4-e2f7-4c74-939a-5484921e0b9b','C-More','RTS2 (8 MOA)','Red Dot',
  NULL,NULL,NULL,NULL,true,'8 MOA Dot','MOA',NULL,NULL,
  'CR2032',1.8,299,false,'USA',
  'Competition tactical red dot. Large 8 MOA dot for fast target acquisition in 3-gun and action shooting. Picatinny mount included.',
  NULL,false,'Picatinny','open','mid_range',NULL,NOW(),NOW()),

-- Noblex
('41d503a0-1561-42ed-9df9-8acaca2b2e8b','Noblex','Sight II Plus','Red Dot',
  NULL,NULL,NULL,NULL,true,'3.5 MOA Dot','MOA',NULL,NULL,
  'CR2032',1.0,349,false,'Germany',
  'The original pistol red dot. Noblex (formerly Docter Optics) created the footprint standard most pistol optics now reference. Top-loading battery. German precision build quality.',
  NULL,false,'Docter/Noblex','open','mid_range','Docter Sight II Plus; Doctor Sight II Plus',NOW(),NOW()),

-- Aimpoint additions
('f820c4e2-93fd-43a6-9f51-96a171bf6893','Aimpoint','ACRO C-2','Red Dot',
  NULL,NULL,NULL,NULL,true,'3.5 MOA Dot','MOA',NULL,NULL,
  'CR2032',2.0,479,false,'Sweden',
  'Enclosed reflex for pistols. Fully sealed housing — zero ingress points. Compatible with ACRO footprint slides (Glock, SIG, Walther, CZ). 10,000 hour battery life at setting 6.',
  NULL,false,'ACRO','closed','mid_range',NULL,NOW(),NOW()),

('6af00e66-d45a-45d5-ac9d-0b21d10072f3','Aimpoint','Micro H-2','Red Dot',
  NULL,NULL,NULL,NULL,true,'2 MOA Dot','MOA',NULL,NULL,
  'CR2032',3.0,799,false,'Sweden',
  'H-series (Hunter) variant of the Micro. 50,000 hours at NV setting 8. 12 brightness settings. Night vision compatible. Interchangeable with H-1 mounts.',
  NULL,false,'Picatinny','open','premium',NULL,NOW(),NOW()),

('aac36782-3449-4752-98a0-dc0a4f05e3e5','Aimpoint','CompM4','Red Dot',
  NULL,NULL,NULL,NULL,true,'2 MOA Dot','MOA',NULL,NULL,
  'AA',11.8,854,true,'Sweden',
  'Predecessor to CompM4s. US Army M68 CCO. 80,000 hour battery life. Replaced in service by CompM5 but remains in widespread active use.',
  NULL,true,'Picatinny','open','premium',NULL,NOW(),NOW()),

-- Vortex additions
('bb358df4-3f0a-41b7-a13b-f8d0126336d6','Vortex','Venom Red Dot','Red Dot',
  NULL,NULL,NULL,NULL,true,'3 MOA Dot','MOA',NULL,NULL,
  'CR2032',1.1,279,false,'USA',
  'Pistol and rifle red dot. Top-loading battery without removing optic. Auto power-off. Available in 3 MOA and 6 MOA. Docter/Noblex footprint.',
  NULL,false,'Docter/Noblex','open','mid_range',NULL,NOW(),NOW()),

('51312671-0dff-4219-85d4-ebe9efb05cc1','Vortex','Ranger 1800','Rangefinder',
  NULL,NULL,NULL,NULL,false,NULL,NULL,NULL,NULL,
  'CR2032',6.2,279,false,'USA',
  'Compact 6x laser rangefinder to 1,800 yards. HCD and LOS modes. Popular entry-level hunting and shooting rangefinder.',
  NULL,false,NULL,NULL,'mid_range',NULL,NOW(),NOW()),

('ca630941-96d7-4d99-87b6-287fab03a0a9','Vortex','Fury HD 5000 AB','Rangefinder',
  NULL,NULL,42,NULL,false,NULL,NULL,NULL,NULL,
  'CR2032',29.0,3499,false,'USA',
  '10x42 binocular with integrated Applied Ballistics rangefinder. 5,000-yard ranging capability. Onboard AB ballistic solver with environmental compensation. Elite tool for ELR and long-range hunting.',
  NULL,false,NULL,NULL,'elite',NULL,NOW(),NOW()),

-- Trijicon additions
('3c8838ec-b1ea-4cc9-b79a-d0d731096911','Trijicon','VCOG 1-8x28','LPVO',
  1,8,28,'FFP',true,'MRAD Segmented','MRAD',NULL,0.1,
  'CR2032',21.0,3499,false,'USA',
  'Updated VCOG with 8x range. Compact 28mm objective. Tritium/fiber backup illumination requires no battery at any light level. 34mm tube. Used by special operations.',
  34,true,'Picatinny',NULL,'elite',NULL,NOW(),NOW()),

('d583c853-9b54-4287-bd06-bd9fb040f647','Trijicon','Ascent 3-15x50','Scope',
  3,15,50,'SFP',true,'MOA Crosshair','MOA',0.25,NULL,
  'CR2032',23.4,1599,false,'USA',
  'Hunting and field precision scope. Illuminated center dot on duplex crosshair. 30mm tube. Covers hunting to medium-range precision. Trijicon glass quality.',
  30,false,'Picatinny',NULL,'premium',NULL,NOW(),NOW()),

('653cc61d-1326-4ed8-b01d-e893c571666c','Trijicon','AccuPoint 3-18x50','Scope',
  3,18,50,'FFP',true,'MOA Crosshair','MOA',0.25,NULL,
  NULL,28.0,2199,false,'USA',
  'Battery-free fiber optic and tritium illuminated reticle powered by ambient light. 34mm tube. Battery independence ideal for field use in extreme conditions.',
  34,false,'Picatinny',NULL,'premium',NULL,NOW(),NOW()),

('81c9c4ab-f5a1-43fe-9644-8d28d9220448','Trijicon','ACOG 2x20','Prism',
  2,2,20,'FFP',true,'CQB BDC','MOA',NULL,NULL,
  NULL,7.2,799,false,'USA',
  'Compact low-magnification ACOG for CQB. Tritium/fiber illumination — no battery. Used on M4/M16 for urban environments. Very compact package.',
  NULL,true,'Picatinny',NULL,'mid_range',NULL,NOW(),NOW()),

-- ATN
('2259f938-f1df-4ee4-8a08-b0a28254c100','ATN','Thor 4 384 4-40x','Thermal',
  NULL,NULL,NULL,NULL,false,NULL,NULL,NULL,NULL,
  NULL,NULL,2699,false,'USA',
  '384x288 thermal sensor with 4-40x digital zoom. Recoil Activated Video. Onboard ballistic calculator. Ultra-low power consumption. Popular hunting thermal.',
  NULL,false,'Picatinny',NULL,'mid_range',NULL,NOW(),NOW()),

('8d2e870d-89c6-4657-86e0-74e657622ebd','ATN','X-Sight 4K Pro 3-14x','Night Vision',
  NULL,NULL,NULL,NULL,false,NULL,NULL,NULL,NULL,
  'AA',NULL,1299,false,'USA',
  'Day/night digital scope with 4K sensor. Recoil Activated Video, ballistic calculator, WiFi streaming to ATN app. Budget alternative for digital night use.',
  NULL,false,'Picatinny',NULL,'mid_range',NULL,NOW(),NOW()),

-- Pulsar
('d865527e-6918-4943-a5a1-ae0d963147b4','Pulsar','Trail 2 LRF XP50','Thermal',
  NULL,NULL,NULL,NULL,false,NULL,NULL,NULL,NULL,
  NULL,NULL,4499,false,'Belarus',
  'Standalone/weapon-mount thermal with integrated laser rangefinder. 640x480 sensor. WiFi streaming. Among the best sensor performance in the class.',
  NULL,false,'Picatinny',NULL,'premium',NULL,NOW(),NOW()),

-- InfiRay
('6ff287a7-bd54-4624-aaf0-91c063c5ef91','InfiRay','Tube TH50 V2','Thermal',
  NULL,NULL,NULL,NULL,false,NULL,NULL,NULL,NULL,
  NULL,NULL,2299,false,'China',
  '640x512 thermal imaging rifle scope in tube form factor. Onboard video recording. Strong value in the under-$2500 thermal market.',
  NULL,false,'Picatinny',NULL,'mid_range','InfiRay Tube; IRAY TH50',NOW(),NOW()),

-- Maven
('cca70a7a-44b1-4201-bd87-1e74457e7a5a','Maven','RS.1 2-10x40','Scope',
  2,10,40,'SFP',false,'German 4','MOA',0.25,NULL,
  NULL,16.1,699,false,'USA',
  'Direct-to-consumer custom scope. Customer chooses reticle, illumination, and color from factory. Premium glass at below-average pricing due to direct sales model.',
  30,false,'Picatinny',NULL,'mid_range',NULL,NOW(),NOW()),

('7870c22b-4f75-4619-a6a5-6ff6cf31d0aa','Maven','CRS.1 1-6x24','LPVO',
  1,6,24,'FFP',true,'MOA BDC','MOA',0.5,NULL,
  'CR2032',18.2,1199,false,'USA',
  'Direct-to-consumer LPVO. FFP illuminated reticle. 30mm tube. Maven custom ordering allows shooters to spec the optic to their preferences.',
  30,false,'Picatinny',NULL,'premium',NULL,NOW(),NOW()),

-- Revic
('28b67501-7830-49ee-b6e1-a276acc45592','Revic','PMR 428 G3i','Rangefinder',
  NULL,NULL,NULL,NULL,false,NULL,NULL,NULL,NULL,
  NULL,NULL,3499,false,'USA',
  'Applied Ballistics-integrated laser rangefinder. Built-in environmental sensors (temperature, pressure, inclination). Onboard AB ballistic calculator. Ranges to 4,000+ yards. Used by top PRS and ELR competitors.',
  NULL,false,NULL,NULL,'elite','PMR 428',NOW(),NOW()),

-- Leupold additions
('65a60811-80fc-4e5f-b62a-5ad6d3b87dd0','Leupold','Mark 4 CQ/T 1-3x14','LPVO',
  1,3,14,'SFP',true,'Mil Dot','MOA',0.5,NULL,
  'CR2032',15.0,1199,true,'USA',
  'Close Quarters/Tactical LPVO. Used by USMC and various special operations. Ultra-compact 14mm objective. Tritium/fiber illumination backup. Discontinued but widely encountered.',
  30,true,'Picatinny',NULL,'premium','Mark 4 CQT',NOW(),NOW()),

('bc2a7270-d9e3-4132-a70a-3bfba5779a2a','Leupold','DeltaPoint Micro','Red Dot',
  NULL,NULL,NULL,NULL,true,'3 MOA Dot','MOA',NULL,NULL,
  'CR2032',0.9,449,false,'USA',
  'Ultra-compact pistol reflex optic in suppressor height. Direct-mount for Glock MOS, S&W M&P, and other platforms. Motion-sensing auto-on.',
  NULL,false,'DeltaPoint_Pro','open','mid_range','DP Micro',NOW(),NOW()),

-- Steiner
('e2e0f106-9297-4942-b559-0e263651e364','Steiner','P4Xi 1-4x24','LPVO',
  1,4,24,'SFP',true,'P3TR BDC','MOA',0.5,NULL,
  'CR2032',14.1,799,false,'Germany',
  'Entry-level Steiner LPVO. Illuminated BDC reticle. 30mm tube. German build quality at a competitive price. Military heritage in a more accessible package.',
  30,false,'Picatinny',NULL,'mid_range',NULL,NOW(),NOW()),

-- Zero Compromise
('6926a6b1-574b-45be-9163-e2c85f6953fd','Zero Compromise','ZC527 5-27x56','Scope',
  5,27,56,'FFP',false,'ZC-MIL','MRAD',NULL,0.1,
  NULL,42.0,5200,false,'Austria',
  'Ultra-premium Austrian precision scope. Exceptional glass. 34mm tube. Zero-stop elevation. Rapidly gaining a top-tier reputation in PRS and competition shooting.',
  34,false,'Picatinny',NULL,'elite','ZCO ZC527',NOW(),NOW()),

-- Arken Optics
('8e8d4155-6f83-4541-9bbb-7940971c1e83','Arken Optics','EP5 5-25x56','Scope',
  5,25,56,'FFP',false,'ATSR/H','MRAD',NULL,0.1,
  NULL,36.0,449,false,'USA',
  'Extreme value precision scope. FFP MRAD reticle. 34mm tube. Zero-stop turrets. Dominates the sub-$500 long-range category.',
  34,false,'Picatinny',NULL,'budget',NULL,NOW(),NOW()),

-- Swampfox
('29a6800f-873d-4f29-8d56-141f52af8801','Swampfox','Arrowhead 1-10x24','LPVO',
  1,10,24,'FFP',true,'MRAD BDC','MRAD',NULL,0.1,
  'CR2032',24.0,699,false,'USA',
  'Budget 1-10x LPVO. FFP MRAD reticle. 34mm tube. Zero-stop. Strong value in the growing 1-10x category.',
  34,false,'Picatinny',NULL,'mid_range',NULL,NOW(),NOW()),

-- Burris XTR Pro
('37777b0d-be88-42dd-8009-54238002ab7c','Burris','XTR Pro 5.5-30x56','Scope',
  5.5,30,56,'FFP',false,'SCR Mil','MRAD',NULL,0.1,
  NULL,36.0,2099,false,'USA',
  'Burris flagship competition long-range scope. 34mm tube. Zero-stop, exposed capped turrets. Popular in PRS and ELR competition.',
  34,false,'Picatinny',NULL,'premium',NULL,NOW(),NOW()),

-- Delta Optical
('4234cdee-f060-4f65-8c29-c2d7e8db2603','Delta Optical','Stryker HD 4.5-30x56','Scope',
  4.5,30,56,'FFP',false,'DLR-1','MRAD',NULL,0.1,
  NULL,36.3,899,false,'Poland',
  'Polish-made precision scope building a strong reputation in European and US long-range markets. Zero-stop. 34mm tube. Exceptional value for the glass quality.',
  34,false,'Picatinny',NULL,'mid_range',NULL,NOW(),NOW()),

-- IOR Valdada
('bb64558f-a158-443c-92ef-7bcd6648dbee','IOR Valdada','2.5-10x42 FFP','Scope',
  2.5,10,42,'FFP',false,'Mil-Dot','MRAD',NULL,0.1,
  NULL,24.0,1199,false,'Romania',
  'Romanian military-grade optic used by various Eastern European militaries and law enforcement. FFP mil-dot. Extremely rugged construction. Underappreciated in the US market.',
  30,true,'Picatinny',NULL,'premium',NULL,NOW(),NOW()),

-- SIG Sauer additions
('fc621428-5c34-421d-a488-c395e062b97a','SIG Sauer','Tango6T 3-18x44','Scope',
  3,18,44,'FFP',false,'DEV-L MRAD','MRAD',NULL,0.1,
  NULL,30.0,1999,false,'USA',
  'Precision long-range scope in the military-tested Tango6T line. Zero-stop. 34mm tube. Carries the durability pedigree of the 1-6x variant.',
  34,false,'Picatinny',NULL,'premium','T6T 3-18x',NOW(),NOW()),

-- Nightforce ATACR 4-16x50
('998d0ce8-16a0-4519-a6fb-5e0ceab1ba8d','Nightforce','ATACR 4-16x50','Scope',
  4,16,50,'FFP',false,'FC-MRAD','MRAD',NULL,0.1,
  NULL,32.0,2799,false,'USA',
  'Larger-objective ATACR variant. 50mm objective for improved light gathering vs the 4-16x42. 34mm tube. Zero-stop. Same rugged ATACR construction. Military use.',
  34,true,'Picatinny',NULL,'elite',NULL,NOW(),NOW()),

-- EOTech G45 magnifier
('7580761e-1596-4d08-982b-2ecb46738d44','EOTech','G45 5x Magnifier','Magnifier',
  5,5,NULL,NULL,false,NULL,NULL,NULL,NULL,
  NULL,8.0,499,false,'USA',
  '5x flip-to-side magnifier. STS mount included. Compatible with any red dot or holographic on Picatinny. Brighter and clearer than most 3x magnifiers at the cost of some FOV.',
  NULL,false,'Picatinny',NULL,'mid_range',NULL,NOW(),NOW());


-- ══════════════════════════════════════════════════════════════
-- SECTION 5: 15 ADDITIONAL OPTICS
-- ══════════════════════════════════════════════════════════════

INSERT INTO optic_models (
  id, brand, model, optic_type,
  magnification_min, magnification_max, objective_mm,
  focal_plane, illuminated, reticle_name,
  turret_unit, click_value_moa, click_value_mrad,
  battery_type, weight_oz, msrp_usd, discontinued,
  country_of_origin, description,
  tube_diameter_mm, military_use,
  mounting_footprint, emitter_type, market_tier, model_aliases,
  created_at, updated_at
) VALUES

(gen_random_uuid(),'Kahles','K318i 1-8x24','LPVO',
  1,8,24,'FFP',true,'MSR 3i','MRAD',NULL,0.1,
  'CR2032',17.6,3499,false,'Austria',
  'Austrian military-competition LPVO. Used by Austrian Armed Forces and top IPSC/precision competitors. 30mm tube. Exceptional FFP clarity at all magnifications. Direct competitor to S&B Short Dot and Nightforce ATACR 1-8x.',
  30,true,'Picatinny',NULL,'elite',NULL,NOW(),NOW()),

(gen_random_uuid(),'Kahles','K525i 5-25x56','Scope',
  5,25,56,'FFP',false,'MSR 3','MRAD',NULL,0.1,
  NULL,33.0,4199,false,'Austria',
  'Austrian precision scope. Used at top PRS and F-Class competition. 34mm tube. Zero-stop. Exceptional optical heritage. Direct competitor to Schmidt & Bender PM II.',
  34,false,'Picatinny',NULL,'elite',NULL,NOW(),NOW()),

(gen_random_uuid(),'Trijicon','SRO 2.5 MOA','Red Dot',
  NULL,NULL,NULL,NULL,true,'2.5 MOA Dot','MOA',NULL,NULL,
  'CR2032',1.2,569,false,'USA',
  'Specialized reflex optic for competition pistols. Widest window in the category at launch (1.41 inch). Top-loading battery. Designed specifically for USPSA/IDPA open and carry optics divisions.',
  NULL,false,'RMR','open','mid_range','SRO',NOW(),NOW()),

(gen_random_uuid(),'Holosun','EPS Carry','Red Dot',
  NULL,NULL,NULL,NULL,true,'2 MOA Dot','MOA',NULL,NULL,
  'CR2032',0.7,389,false,'China',
  'Enclosed emitter micro pistol optic for carry use. Solar charging panel. Shake-awake. Available in 2 MOA dot or 32 MOA circle-dot. Extremely compact. Competes with Shield RMSc for carry guns.',
  NULL,false,'Shield_RMSc','closed','mid_range','EPS Carry 2; EPS Carry 32',NOW(),NOW()),

(gen_random_uuid(),'Steiner','T5Xi 1-5x24','LPVO',
  1,5,24,'SFP',true,'SCR','MOA',0.5,NULL,
  'CR2032',19.5,2199,false,'Germany',
  'Military-specification LPVO. Used by DoD procurement programs and special operations. 30mm tube. Exceptional ruggedness and optical quality. FFP variant also available.',
  30,true,'Picatinny',NULL,'premium',NULL,NOW(),NOW()),

(gen_random_uuid(),'Nightforce','SHV 4-14x56','Scope',
  4,14,56,'SFP',true,'IHR','MOA',0.25,NULL,
  'CR2032',21.2,999,false,'USA',
  'Nightforce mid-tier line — accessible price with core Nightforce build quality. 30mm tube. Illuminated reticle. Popular hunting and field precision entry into the brand.',
  30,false,'Picatinny',NULL,'premium',NULL,NOW(),NOW()),

(gen_random_uuid(),'Nightforce','NXS 3.5-15x50','Scope',
  3.5,15,50,'SFP',false,'Mil-R','MRAD',NULL,0.1,
  NULL,20.0,1699,false,'USA',
  'One of the most widely deployed NXS variants in US military and law enforcement. 30mm tube. SFP MRAD reticle. Field precision and hunting workhorse.',
  30,true,'Picatinny',NULL,'premium',NULL,NOW(),NOW()),

(gen_random_uuid(),'March Optics','Genesis 5-50x56','Scope',
  5,50,56,'FFP',false,'FML-3','MRAD',NULL,0.05,
  NULL,40.9,5800,false,'Japan',
  'Japanese ultra-precision long-range scope. Used in benchrest, ELR, and F-Class competition. 0.05 MRAD per click. Extraordinary optical resolution and mechanical precision. 35mm tube.',
  35,false,'Picatinny',NULL,'elite',NULL,NOW(),NOW()),

(gen_random_uuid(),'Swarovski','Z8i+ 1-8x24','LPVO',
  1,8,24,'FFP',true,'4A-300','MRAD',NULL,0.1,
  'CR2032',17.8,3199,false,'Austria',
  'Austrian premium LPVO. Exceptional low-light performance and optical clarity. 30mm tube. Integrated throw lever. True 1x with wide FOV. Used by high-end European hunters and competition shooters.',
  30,false,'Picatinny',NULL,'elite','Z8i Plus',NOW(),NOW()),

(gen_random_uuid(),'Schmidt & Bender','Short Dot 1.1-8x24 PM II','LPVO',
  1.1,8,24,'SFP',true,'Mil-Dot','MRAD',NULL,0.1,
  'CR2032',26.2,3499,false,'Germany',
  'Military-specification LPVO used by NATO special operations. SFP MRAD reticle. 30mm tube. Flash Dot illumination. Extremely rugged German construction. Continuous zoom from near-1x to 8x.',
  30,true,'Picatinny',NULL,'elite','PM II Short Dot; 1.1-8x24',NOW(),NOW()),

(gen_random_uuid(),'US Optics','SN-4 1-4x24','LPVO',
  1,4,24,'SFP',true,'IOR','MOA',0.5,NULL,
  'CR2032',18.0,1499,false,'USA',
  'American-made premium LPVO. 30mm tube. Exceptional turret feel and repeatability. Entirely manufactured in the USA. Popular with precision rifle builders who want domestic glass.',
  30,false,'Picatinny',NULL,'premium',NULL,NOW(),NOW()),

(gen_random_uuid(),'Leupold','Freedom RDS 1x34','Red Dot',
  NULL,NULL,34,NULL,true,'1 MOA Dot','MOA',NULL,NULL,
  'CR2032',5.9,349,false,'USA',
  'Entry-level red dot from Leupold. 1 MOA precision dot. Auto brightness adjustment. 34mm housing. Common first red dot for AR builds and home defense carbines. Leupold build quality at an accessible price.',
  NULL,false,'Picatinny','open','mid_range','Freedom RDS',NOW(),NOW()),

(gen_random_uuid(),'Burris','FastFire 4','Red Dot',
  NULL,NULL,NULL,NULL,true,'3 MOA Dot','MOA',NULL,NULL,
  'CR2032',1.0,299,false,'USA',
  'Competition pistol red dot. Docter/Noblex footprint. Wide field of view for fast target acquisition. Automatic brightness adjustment. Compatible with most suppressor-height mount systems.',
  NULL,false,'Docter/Noblex','open','mid_range','FastFire IV',NOW(),NOW()),

(gen_random_uuid(),'SIG Sauer','Romeo-X Compact','Red Dot',
  NULL,NULL,NULL,NULL,true,'3 MOA Dot','MOA',NULL,NULL,
  'CR2032',0.8,449,false,'USA',
  'Enclosed emitter compact pistol optic. Solar backup charging. Shake-awake. Compatible with ACRO footprint slides. Direct competitor to Aimpoint ACRO C-2.',
  NULL,false,'ACRO','closed','mid_range','Romeo X; RomeoX',NOW(),NOW()),

(gen_random_uuid(),'Holosun','AEMS','Red Dot',
  NULL,NULL,NULL,NULL,true,'2 MOA Dot','MOA',NULL,NULL,
  'CR2032',4.6,479,false,'China',
  'Large-window enclosed emitter AR/carbine optic. Titan alloy body. Solar and battery powered. Multi-reticle (dot, circle, circle-dot). Dual mounting system. Army NGSW-FC competition contender.',
  NULL,false,'Picatinny','closed','mid_range','AEMS Core; Advanced Enclosed',NOW(),NOW());


-- ══════════════════════════════════════════════════════════════
-- SECTION 6: 10 MOST COMMON RANGEFINDERS
-- ══════════════════════════════════════════════════════════════

INSERT INTO optic_models (
  id, brand, model, optic_type,
  magnification_min, magnification_max, objective_mm,
  focal_plane, illuminated,
  battery_type, weight_oz, msrp_usd, discontinued,
  country_of_origin, description,
  military_use, market_tier, model_aliases,
  created_at, updated_at
) VALUES

(gen_random_uuid(),'Bushnell','Prime 1500','Rangefinder',
  NULL,NULL,NULL,NULL,false,
  'CR2032',6.5,199,false,'USA',
  'Compact 6x monocular rangefinder to 1,500 yards. ARC angle compensation for uphill/downhill shots. Bow and rifle modes. The ubiquitous entry-level hunting rangefinder.',
  false,'budget','Bushnell Prime 1500',NOW(),NOW()),

(gen_random_uuid(),'Bushnell','Elite 1 Mile CONX','Rangefinder',
  NULL,NULL,NULL,NULL,false,
  'CR2032',6.0,399,false,'USA',
  '7x26mm rangefinder to 1 mile on reflective targets. Bluetooth connectivity to Kestrel and ballistic apps. ARC angle compensation. Popular mid-tier workhorse for hunters and practical shooters.',
  false,'mid_range','Elite 1 Mile',NOW(),NOW()),

(gen_random_uuid(),'Leupold','RX-1600i TBR/W','Rangefinder',
  NULL,NULL,NULL,NULL,false,
  'CR2032',7.8,329,false,'USA',
  '6x monocular to 1,600 yards. True Ballistic Range/Wind compensation adjusts for angle and wind. DNA (Digitally eNhanced Accuracy) engine for reliable low-contrast ranging. Very popular hunting rangefinder.',
  false,'mid_range','RX-1600i',NOW(),NOW()),

(gen_random_uuid(),'Leupold','RX-2800 TBR/W','Rangefinder',
  NULL,NULL,NULL,NULL,false,
  'CR2032',8.0,499,false,'USA',
  '7x monocular to 2,800 yards on reflective targets. True Ballistic Range/Wind. Twist of Focus eyepiece. DNA engine. Leupold build quality for serious long-range hunters.',
  false,'mid_range','RX-2800',NOW(),NOW()),

(gen_random_uuid(),'SIG Sauer','Kilo 2400 ABS','Rangefinder',
  NULL,NULL,NULL,NULL,false,
  'CR2032',9.0,549,false,'USA',
  '7x25mm rangefinder to 3,400 yards. Applied Ballistics Ultralight onboard solver. Bluetooth to SIG BDX app. Built-in environmental sensors. Game-changer for ballistic rangefinders at launch.',
  false,'premium','Kilo2400; Kilo 2400',NOW(),NOW()),

(gen_random_uuid(),'SIG Sauer','Kilo 6K ABS','Rangefinder',
  NULL,NULL,NULL,NULL,false,
  'CR2032',11.0,1099,false,'USA',
  'Flagship SIG rangefinder. 10x42mm to 6,000 yards. Applied Ballistics Elite onboard solver. Bluetooth. Built-in environmental sensors. Class-leading ranging for ELR and extreme mountain hunting.',
  false,'elite','Kilo6K; Kilo 6000',NOW(),NOW()),

(gen_random_uuid(),'Vortex','Razor HD 4000','Rangefinder',
  NULL,NULL,NULL,NULL,false,
  'CR2032',7.7,599,false,'USA',
  '7x25mm rangefinder to 4,000 yards. HCD angle compensation. HD glass for sharp ranging view. Built for long-range hunters and precision shooters needing extended capability beyond the Ranger series.',
  false,'premium','Razor HD 4000',NOW(),NOW()),

(gen_random_uuid(),'Leica','Rangemaster CRF 3500.COM','Rangefinder',
  NULL,NULL,NULL,NULL,false,
  'CR2032',6.8,799,false,'Germany',
  '7x monocular to 3,500 yards. Bluetooth ESP Ballistic app integration. Leica optics quality — exceptional viewing clarity vs competing rangefinders. Inclinometer for angle compensation. Premium European build.',
  false,'premium','CRF 3500; Rangemaster 3500',NOW(),NOW()),

(gen_random_uuid(),'Zeiss','Victory RF 10x42','Rangefinder',
  NULL,NULL,42,NULL,false,
  'CR2032',28.8,2499,false,'Germany',
  '10x42 binocular with integrated rangefinder to 1,300 yards. Zeiss T* lens coating. Premium European glass in a bino-rangefinder format. Preferred by serious European hunters and guides.',
  false,'elite','Victory RF',NOW(),NOW()),

(gen_random_uuid(),'Nikon','Black 4K Laser','Rangefinder',
  NULL,NULL,NULL,NULL,false,
  'CR2032',5.9,399,true,'Japan',
  '8x28mm rangefinder to 1,800 yards. ID (Incline/Decline) technology for angle-compensated ranging. Compact profile. Discontinued after Nikon exited sports optics. Commonly encountered on the used market.',
  false,'mid_range','Black 4K',NOW(),NOW());
