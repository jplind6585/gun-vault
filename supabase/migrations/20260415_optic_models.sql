-- ============================================================
-- optic_models: public reference table
-- Known optics brands, models, and specifications
-- RLS: public SELECT, service_role only for writes
-- ============================================================

CREATE TABLE IF NOT EXISTS public.optic_models (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand               text NOT NULL,
  model               text NOT NULL,
  optic_type          text,         -- 'Red Dot','Holographic','LPVO','Scope','Prism','Night Vision','Thermal','Magnifier','Rangefinder','Iron Sights'
  magnification_min   numeric,
  magnification_max   numeric,
  objective_mm        integer,
  focal_plane         text,         -- 'FFP','SFP','N/A'
  illuminated         boolean DEFAULT false,
  reticle_name        text,
  turret_unit         text,         -- 'MOA','MRAD'
  click_value_moa     numeric,
  click_value_mrad    numeric,
  battery_type        text,
  weight_oz           numeric,
  msrp_usd            numeric,
  discontinued        boolean DEFAULT false,
  country_of_origin   text,
  description         text,
  mount_height        text,         -- 'Low','Medium','High','Absolute Co-Witness','Lower 1/3 Co-Witness'
  tube_diameter_mm    integer,      -- 30, 34, 35, or null for tube-less
  military_use        boolean DEFAULT false,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),
  UNIQUE (brand, model)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_optic_models_brand       ON public.optic_models (brand);
CREATE INDEX IF NOT EXISTS idx_optic_models_optic_type  ON public.optic_models (optic_type);
CREATE INDEX IF NOT EXISTS idx_optic_models_discontinued ON public.optic_models (discontinued);

-- Updated_at trigger
DROP TRIGGER IF EXISTS trg_optic_models_updated_at ON public.optic_models;
CREATE TRIGGER trg_optic_models_updated_at
  BEFORE UPDATE ON public.optic_models
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.optic_models ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "optic_models_public_read"   ON public.optic_models;
DROP POLICY IF EXISTS "optic_models_service_write" ON public.optic_models;

CREATE POLICY "optic_models_public_read"
  ON public.optic_models FOR SELECT
  USING (true);

CREATE POLICY "optic_models_service_write"
  ON public.optic_models FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- SEED DATA  (120+ optics)
-- ============================================================

INSERT INTO public.optic_models
  (brand, model, optic_type, magnification_min, magnification_max, objective_mm, focal_plane, illuminated, reticle_name, turret_unit, click_value_moa, click_value_mrad, battery_type, weight_oz, msrp_usd, discontinued, country_of_origin, description, mount_height, tube_diameter_mm, military_use)
VALUES

-- ── TRIJICON ──────────────────────────────────────────────────────────────────
('Trijicon','ACOG 4x32','Prism',4,4,32,'FFP',true,'BDC','MOA',NULL,NULL,NULL,9.9,1199,false,'USA','Iconic combat optic with tritium/fiber optic illumination. No battery required. US military issue TA31F. One of the most combat-proven optics in history.',NULL,NULL,true),
('Trijicon','ACOG 3.5x35','Prism',3.5,3.5,35,'FFP',true,'BDC','MOA',NULL,NULL,NULL,10.3,1199,false,'USA','Slightly wider field of view than the 4x32. BDC reticle calibrated for 5.56 NATO. Tritium illumination.',NULL,NULL,true),
('Trijicon','ACOG 6x48','Prism',6,6,48,'FFP',true,'BDC','MOA',NULL,NULL,NULL,17.0,1699,false,'USA','Longer range ACOG for designated marksman use. Tritium and fiber optic illumination.',NULL,NULL,true),
('Trijicon','MRO','Red Dot',NULL,NULL,NULL,'N/A',true,'2 MOA Dot','MOA',NULL,NULL,'CR2032',4.1,479,false,'USA','Miniature Rifle Optic. Large front objective for wide field of view at 1x. 5-year battery life. Popular duty red dot.',NULL,NULL,false),
('Trijicon','MRO HD','Red Dot',NULL,NULL,NULL,'N/A',true,'2 MOA Dot','MOA',NULL,NULL,'CR2032',5.0,629,false,'USA','High-Definition MRO with improved glass clarity and additional brightness settings.',NULL,NULL,false),
('Trijicon','RMR Type 2','Red Dot',NULL,NULL,NULL,'N/A',true,'3.25 MOA Dot','MOA',NULL,NULL,'CR2032',1.2,699,false,'USA','Ruggedized Miniature Reflex. Industry standard pistol optic. Shake-awake technology. Virtually unbreakable housing.','Absolute Co-Witness',NULL,true),
('Trijicon','RMR CC','Red Dot',NULL,NULL,NULL,'N/A',true,'3.25 MOA Dot','MOA',NULL,NULL,'CR2032',1.0,699,false,'USA','Concealed Carry RMR with recessed objective lens for snag-free carry. Same housing durability as Type 2.','Absolute Co-Witness',NULL,false),
('Trijicon','SRO','Red Dot',NULL,NULL,NULL,'N/A',true,'2.5 MOA Dot','MOA',NULL,NULL,'CR2032',1.3,849,false,'USA','Specialized Reflex Optic. Panoramic top-loading battery. Wide field of view optimized for competition shooting.','Lower 1/3 Co-Witness',NULL,false),
('Trijicon','VCOG 1-6x24','LPVO',1,6,24,'FFP',true,'MRAD Segmented Circle','MRAD',NULL,0.1,NULL,19.0,2999,false,'USA','Variable Combat Optical Gunsight. MRAD reticle with segmented circle at 1x. Tritium/fiber illumination.',NULL,30,true),
('Trijicon','Credo HX 1-6x24','LPVO',1,6,24,'SFP',false,'MOA Duplex','MOA',0.25,NULL,NULL,16.8,999,false,'USA','Hunting LPVO with tritium dot on duplex crosshair. No battery illumination - fiber only.',NULL,30,false),
('Trijicon','AccuPower 1-4x24','LPVO',1,4,24,'SFP',true,'Red Dot Duplex','MOA',0.25,NULL,'CR2032',13.4,799,false,'USA','LED-illuminated 1-4x hunting/tactical LPVO. MOA click adjustments.',NULL,30,false),
('Trijicon','AccuPower 4-16x50','Scope',4,16,50,'FFP',false,'MOA Crosshair','MOA',0.25,NULL,NULL,24.0,1199,false,'USA','Long-range variable scope with first focal plane MOA reticle.',NULL,30,false),
('Trijicon','Huron 3-12x40','Scope',3,12,40,'SFP',false,'BDC Hunter','MOA',0.25,NULL,NULL,16.2,699,false,'USA','Hunting scope with Duplex or BDC reticle. Bright glass for low-light hunting.',NULL,1,false),

-- ── AIMPOINT ──────────────────────────────────────────────────────────────────
('Aimpoint','PRO','Red Dot',NULL,NULL,NULL,'N/A',true,'2 MOA Dot','MOA',NULL,NULL,'DL1/3N',7.8,459,false,'Sweden','Patrol Rifle Optic. Always-on capability (30,000 hours at setting 7). Night vision compatible. Law enforcement standard.','Lower 1/3 Co-Witness',NULL,true),
('Aimpoint','CompM5','Red Dot',NULL,NULL,NULL,'N/A',true,'2 MOA Dot','MOA',NULL,NULL,'AA',5.4,945,false,'Sweden','Current US Army M68 CCO. 80,000 hour battery life. Submersible to 80m. Night vision compatible.','Lower 1/3 Co-Witness',NULL,true),
('Aimpoint','CompM5s','Red Dot',NULL,NULL,NULL,'N/A',true,'2 MOA Dot','MOA',NULL,NULL,'AA',5.1,875,false,'Sweden','Side-loading battery M5 variant. Flush sides for easier handling. NV compatible.','Lower 1/3 Co-Witness',NULL,true),
('Aimpoint','T2','Red Dot',NULL,NULL,NULL,'N/A',true,'2 MOA Dot','MOA',NULL,NULL,'CR2032',3.0,799,false,'Sweden','The gold standard compact red dot. Used by SOCOM and top-tier operators worldwide. 50,000 hours at NV setting 8.','Lower 1/3 Co-Witness',NULL,true),
('Aimpoint','Micro T-2','Red Dot',NULL,NULL,NULL,'N/A',true,'2 MOA Dot','MOA',NULL,NULL,'CR2032',3.0,799,false,'Sweden','Same specifications as T2 — micro housing. Interchangeable with T-1 mounts.',NULL,NULL,true),
('Aimpoint','ACRO P-2','Red Dot',NULL,NULL,NULL,'N/A',true,'3.5 MOA Dot','MOA',NULL,NULL,'CR2032',2.0,599,false,'Sweden','Enclosed reflex for pistols. Fully sealed glass for extreme durability. Compatible with DeltaPoint Pro footprint.','Absolute Co-Witness',NULL,true),
('Aimpoint','CompM4s','Red Dot',NULL,NULL,NULL,'N/A',true,'2 MOA Dot','MOA',NULL,NULL,'AA',11.0,854,false,'Sweden','Predecessor to CompM5. Large housing. Used by US Army. 80,000 hours battery life.',NULL,NULL,true),
('Aimpoint','Duty RDS','Red Dot',NULL,NULL,NULL,'N/A',true,'2 MOA Dot','MOA',NULL,NULL,'CR2032',4.7,479,false,'Sweden','Value-tier Aimpoint. 30,000 hour battery. All-aluminum housing. Law enforcement value option.',NULL,NULL,false),

-- ── EOTECH ────────────────────────────────────────────────────────────────────
('EOTech','XPS2','Holographic',NULL,NULL,NULL,'N/A',true,'68 MOA Ring / 1 MOA Dot','MOA',NULL,NULL,'CR123',9.0,549,false,'USA','Compact holographic with single CR123 battery (side-loaded). 600 hours battery life. 1 MOA aiming dot inside 68 MOA ring.','Absolute Co-Witness',NULL,false),
('EOTech','XPS3','Holographic',NULL,NULL,NULL,'N/A',true,'68 MOA Ring / 1 MOA Dot','MOA',NULL,NULL,'CR123',9.0,699,false,'USA','Night-vision-compatible XPS. Lower brightness settings for NVG use. Same footprint as XPS2.','Absolute Co-Witness',NULL,true),
('EOTech','EXPS3','Holographic',NULL,NULL,NULL,'N/A',true,'68 MOA Ring / 1 MOA Dot','MOA',NULL,NULL,'AA',11.2,749,false,'USA','Extended reticle variants with QD lever mount. AA battery. Standard US special operations holographic.','Absolute Co-Witness',NULL,true),
('EOTech','EXPS2','Holographic',NULL,NULL,NULL,'N/A',true,'68 MOA Ring / 1 MOA Dot','MOA',NULL,NULL,'CR123',11.2,649,false,'USA','QD lever mount EXPS on CR123. 600-hour battery. Popular LEO option.',NULL,NULL,true),
('EOTech','VUDU 1-6x24 FFP','LPVO',1,6,24,'FFP',true,'SR1 MRAD','MRAD',NULL,0.1,'CR2032',17.0,1299,false,'USA','First focal plane LPVO from EOTech. Zero-stop turrets. MRAD ranging reticle.',NULL,34,false),
('EOTech','VUDU 5-25x50 FFP','Scope',5,25,50,'FFP',false,'MR1 MRAD','MRAD',NULL,0.1,NULL,31.9,1999,false,'USA','Precision long-range scope. 34mm tube. Zero-stop elevation turret.',NULL,34,false),
('EOTech','VUDU 2.5-10x44 FFP','Scope',2.5,10,44,'FFP',true,'H59 MOA','MOA',0.1,NULL,'CR2032',24.0,899,false,'USA','Mid-range hunting/tactical scope with illuminated H59 reticle.',NULL,30,false),

-- ── VORTEX ────────────────────────────────────────────────────────────────────
('Vortex','Spitfire 3x Prism','Prism',3,3,25,'FFP',true,'EBR-556B','MOA',NULL,NULL,'CR2032',9.9,349,false,'USA','Compact 3x prism with etched reticle. No battery required for daytime use. Popular budget-tier prism.',NULL,NULL,false),
('Vortex','Spitfire HD Gen II 5x','Prism',5,5,25,'FFP',true,'EBR-556B','MOA',NULL,NULL,'CR2032',14.1,399,false,'USA','5x fixed magnification prism. Etched BDC reticle. Compact package.',NULL,NULL,false),
('Vortex','Strike Eagle 1-6x24','LPVO',1,6,24,'SFP',true,'EBR-8','MOA',0.5,NULL,'CR2032',16.8,299,false,'USA','Value-tier LPVO. AR-BDC reticle. Budget entry point into the LPVO category.',NULL,30,false),
('Vortex','Strike Eagle 1-8x24','LPVO',1,8,24,'SFP',true,'EBR-8','MOA',0.5,NULL,'CR2032',17.5,399,false,'USA','8x magnification at budget price. Illuminated reticle. Competitive for the price.',NULL,30,false),
('Vortex','Razor HD Gen II-E 1-6x24','LPVO',1,6,24,'FFP',true,'JM-1 BDC','MOA',0.5,NULL,'CR2032',21.5,1399,false,'USA','Extended throw LPVO. JM-1 BDC by Jerry Miculek. FFP BDC reticle. Premium optic for 3-Gun.',NULL,30,false),
('Vortex','Razor HD Gen III 1-10x24','LPVO',1,10,24,'FFP',true,'EBR-9','MRAD',NULL,0.1,'CR2032',24.2,2299,false,'USA','Top-tier 1-10x LPVO. EBR-9 MRAD reticle. 34mm tube. Competition and precision use.',NULL,34,true),
('Vortex','Viper PST Gen II 1-6x24','LPVO',1,6,24,'FFP',true,'EBR-2C','MRAD',NULL,0.1,'CR2032',22.6,699,false,'USA','Mid-tier LPVO with FFP MRAD reticle. Solid zero-stop turrets. Popular for AR competition.',NULL,30,false),
('Vortex','Viper PST Gen II 5-25x50','Scope',5,25,50,'FFP',false,'EBR-7C','MRAD',NULL,0.1,NULL,35.6,999,false,'USA','Long-range precision scope. EBR-7C MRAD reticle. Zero-stop turrets.',NULL,30,false),
('Vortex','Crossfire Red Dot','Red Dot',NULL,NULL,NULL,'N/A',true,'2 MOA Dot','MOA',NULL,NULL,'CR2032',1.6,139,false,'USA','Entry-level red dot. Multi-height mounting system included. Budget option.',NULL,NULL,false),
('Vortex','AMG UH-1 Gen II','Holographic',NULL,NULL,NULL,'N/A',true,'EBR-CQB','MOA',NULL,NULL,'CR123',9.0,399,false,'USA','Holographic with proprietary reticle. Lower price than EOTech with similar performance.',NULL,NULL,false),
('Vortex','SPARC AR','Red Dot',NULL,NULL,NULL,'N/A',true,'2 MOA Dot','MOA',NULL,NULL,'AA',5.3,199,false,'USA','Auto on/off. AA battery for long life. Multi-height mounting system. Mid-tier red dot.',NULL,NULL,false),
('Vortex','Diamondback Tactical 6-24x50','Scope',6,24,50,'FFP',false,'EBR-2C','MOA',0.1,NULL,NULL,28.9,349,false,'USA','Budget FFP precision scope. EBR-2C MOA reticle. Great value for varmint and target shooting.',NULL,30,false),
('Vortex','Razor HD Gen II 4.5-27x56','Scope',4.5,27,56,'FFP',false,'EBR-2C','MRAD',NULL,0.1,NULL,46.0,2499,false,'USA','Flagship long-range precision scope. 34mm tube, 56mm objective. Competition and precision rifle use.',NULL,34,false),
('Vortex','Golden Eagle HD 15-60x52','Scope',15,60,52,'SFP',false,'ECR-1','MOA',0.25,NULL,NULL,36.8,1399,false,'USA','High-power spotting scope style optic for F-Class and benchrest competition.',NULL,35,false),

-- ── LEUPOLD ───────────────────────────────────────────────────────────────────
('Leupold','Mark 4HD 1-4.5x24','LPVO',1,4.5,24,'FFP',true,'CMR-W','MOA',0.5,NULL,'CR2032',16.9,999,false,'USA','Entry-level Mark series LPVO. CMR-W reticle. Compact and proven.',NULL,30,false),
('Leupold','Mark 5HD 3.6-18x44','Scope',3.6,18,44,'FFP',false,'TMR','MOA',0.1,NULL,NULL,26.9,1999,false,'USA','Medium-range precision scope. 35mm tube for extended adjustment range.',NULL,35,true),
('Leupold','Mark 5HD 5-25x56','Scope',5,25,56,'FFP',false,'TMR','MOA',0.1,NULL,NULL,33.6,2499,false,'USA','Long-range Mark 5. 56mm objective for maximum light gathering. 35mm tube.',NULL,35,true),
('Leupold','VX-6HD 1-6x24','LPVO',1,6,24,'SFP',true,'FireDot Duplex','MOA',0.25,NULL,'CR2032',19.5,1349,false,'USA','Premium hunting/tactical LPVO. CDS-ZL2 elevation dial. FireDot illuminated reticle.',NULL,30,false),
('Leupold','Mark 6 1-6x20','LPVO',1,6,20,'FFP',true,'CMR-W','MOA',0.1,NULL,'CR2032',23.6,2199,false,'USA','Ultra-premium mil-grade 1-6x. Used by USMC and USSOCOM. Compact 20mm objective.',NULL,34,true),
('Leupold','Deltapoint Pro','Red Dot',NULL,NULL,NULL,'N/A',true,'2.5 MOA Dot','MOA',NULL,NULL,'CR2032',1.95,429,false,'USA','Pistol and rifle red dot. Top-loading battery without removing optic. Motion sensor wake-up.','Lower 1/3 Co-Witness',NULL,false),
('Leupold','Freedom RDS','Red Dot',NULL,NULL,NULL,'N/A',true,'1 MOA Dot','MOA',NULL,NULL,'CR2032',5.7,249,false,'USA','Budget-tier red dot from Leupold. Simple, durable, 30,000 hour battery life.',NULL,NULL,false),
('Leupold','VX-3HD 3.5-10x40','Scope',3.5,10,40,'SFP',false,'Duplex','MOA',0.25,NULL,NULL,15.8,899,false,'USA','Hunting scope with exceptional clarity. Twilight Max HD glass coatings.',NULL,1,false),

-- ── NIGHTFORCE ────────────────────────────────────────────────────────────────
('Nightforce','ATACR 1-8x24','LPVO',1,8,24,'FFP',true,'FC-MOA','MOA',0.1,NULL,'CR2032',30.0,3299,false,'USA','Military-grade 1-8x LPVO. Extremely rugged. Used by top-tier military units worldwide.',NULL,34,true),
('Nightforce','ATACR 4-16x42','Scope',4,16,42,'FFP',false,'FC-MRAD','MRAD',NULL,0.1,NULL,30.5,2699,false,'USA','Mid-range precision scope. 34mm tube. Known for mechanical reliability and optical clarity.',NULL,34,true),
('Nightforce','ATACR 5-25x56','Scope',5,25,56,'FFP',false,'MOAR','MOA',0.1,NULL,NULL,44.0,3599,false,'USA','Long-range ATACR. 56mm objective. Zero-stop. Used by military snipers and PRS top competitors.',NULL,34,true),
('Nightforce','NX8 1-8x24','LPVO',1,8,24,'FFP',true,'FC-MOA','MOA',0.1,NULL,'CR2032',19.2,1799,false,'USA','Compact, lightweight ATACR-quality LPVO. 30mm tube. More affordable entry to Nightforce quality.',NULL,30,false),
('Nightforce','SHV 3-10x42','Scope',3,10,42,'SFP',false,'Duplex','MOA',0.25,NULL,NULL,20.0,999,false,'USA','Straight hunting variable. No frills but Nightforce quality glass at lower price.',NULL,30,false),
('Nightforce','BEAST 5-25x56','Scope',5,25,56,'FFP',false,'PTR','MRAD',NULL,0.1,NULL,69.8,5499,false,'USA','Benchrest and extreme long range. B.E.A.S.T. (Best Example of Advanced Superior Technology). Top-tier glass.',NULL,35,false),
('Nightforce','SHV 4-14x56','Scope',4,14,56,'SFP',false,'Illuminated MOAR','MOA',0.25,NULL,'CR2032',26.4,1299,false,'USA','Large objective SHV for hunting. Illuminated reticle option.',NULL,30,false),
('Nightforce','ATACR 7-35x56','Scope',7,35,56,'FFP',false,'MOAR','MOA',0.1,NULL,NULL,63.5,4799,false,'USA','Extreme-range precision scope. Competition ELR and military long-range sniper use.',NULL,34,true),

-- ── PRIMARY ARMS ──────────────────────────────────────────────────────────────
('Primary Arms','GLx 2x Prism','Prism',2,2,28,'FFP',true,'ACSS Cyclops','MOA',NULL,NULL,'CR2032',10.2,259,false,'USA','2x prism with ACSS Cyclops reticle featuring BDC and wind holds. Compact and lightweight.',NULL,NULL,false),
('Primary Arms','GLx 4x Prism','Prism',4,4,32,'FFP',true,'ACSS','MOA',NULL,NULL,'CR2032',15.5,329,false,'USA','4x fixed prism. ACSS reticle with integrated ranging and wind holds.',NULL,NULL,false),
('Primary Arms','SLx 3x MicroPrism','Prism',3,3,28,'FFP',true,'ACSS Cyclops','MOA',NULL,NULL,'CR2032',9.0,199,false,'USA','Ultra-compact 3x prism. Popular lightweight option for SBRs and pistol-length builds.',NULL,NULL,false),
('Primary Arms','GLx 6x Prism','Prism',6,6,32,'FFP',true,'ACSS','MOA',NULL,NULL,'CR2032',17.6,399,false,'USA','Highest magnification fixed prism from Primary Arms. ACSS reticle for extended range.',NULL,NULL,false),
('Primary Arms','SLx 1-6x24 FFP','LPVO',1,6,24,'FFP',true,'ACSS Raptor','MOA',0.5,NULL,'CR2032',18.2,449,false,'USA','Entry-level LPVO with FFP ACSS Raptor reticle. Budget alternative to more expensive LPVOs.',NULL,30,false),
('Primary Arms','GLx 2-10x44 FFP','Scope',2,10,44,'FFP',true,'ACSS Athena','MRAD',NULL,0.1,'CR2032',20.5,499,false,'USA','Mid-range precision scope with MRAD ACSS reticle. Excellent value in the class.',NULL,30,false),
('Primary Arms','SLx MD-25','Red Dot',NULL,NULL,NULL,'N/A',true,'AutoLive','MOA',NULL,NULL,'CR2032',2.8,179,false,'USA','Micro red dot with motion-sensing auto-on. Pistol and rifle compatible.',NULL,NULL,false),

-- ── SIG SAUER OPTICS ──────────────────────────────────────────────────────────
('SIG Sauer','Romeo5','Red Dot',NULL,NULL,NULL,'N/A',true,'2 MOA Dot','MOA',NULL,NULL,'CR2032',5.1,149,false,'USA','MOTAC (Motion Activated Illumination) auto-on/off. Popular budget-tier red dot. Includes riser and co-witness mounts.',NULL,NULL,false),
('SIG Sauer','Romeo7','Red Dot',NULL,NULL,NULL,'N/A',true,'2 MOA Dot','MOA',NULL,NULL,'AA',7.2,249,false,'USA','Full-size red dot with MOTAC. Longer battery life with AA battery.',NULL,NULL,false),
('SIG Sauer','Romeo Zero','Red Dot',NULL,NULL,NULL,'N/A',true,'3 MOA Dot','MOA',NULL,NULL,'CR1632',0.8,199,false,'USA','Micro pistol reflex sight. Extremely lightweight. Popular for P365 series.','Absolute Co-Witness',NULL,false),
('SIG Sauer','Romeo Zero Elite','Red Dot',NULL,NULL,NULL,'N/A',true,'3 MOA Dot','MOA',NULL,NULL,'CR1632',0.9,259,false,'USA','Enhanced Romeo Zero with solar backup and improved glass.',NULL,NULL,false),
('SIG Sauer','Tango6T 1-6x24','LPVO',1,6,24,'FFP',true,'DEV-L MRAD','MRAD',NULL,0.1,'CR2032',23.5,1499,false,'USA','Military-tested LPVO. Thin illuminated reticle. Zero-stop turrets. 34mm tube.',NULL,34,true),
('SIG Sauer','Tango4 4-16x44','Scope',4,16,44,'FFP',false,'DEV-L MRAD','MRAD',NULL,0.1,NULL,26.5,999,false,'USA','Mid-range precision scope. First focal plane MRAD reticle.',NULL,30,false),
('SIG Sauer','Whiskey5 3-15x56','Scope',3,15,56,'SFP',false,'Quadplex','MOA',0.25,NULL,NULL,31.4,799,false,'USA','Hunting-focused variable scope with large objective for low-light.',NULL,30,false),
('SIG Sauer','KILO2400ABS','Rangefinder',NULL,NULL,NULL,'N/A',false,NULL,NULL,NULL,NULL,NULL,26.0,2599,false,'USA','Applied Ballistics rangefinder. Onboard AB solver with environmental sensors. Elite long-range tool.',NULL,NULL,false),
('SIG Sauer','TANGO MSR 1-6x24','LPVO',1,6,24,'FFP',true,'MRAD MSR','MRAD',NULL,0.1,'CR2032',19.5,849,false,'USA','Mid-tier 1-6x LPVO for MSR/AR rifles. Solid value with zero-stop.',NULL,30,false),
('SIG Sauer','Romeo1 PRO','Red Dot',NULL,NULL,NULL,'N/A',true,'3 MOA Dot','MOA',NULL,NULL,'CR1632',1.1,299,false,'USA','Pistol optic with open emitter. Lower and Absolute co-witness compatible.',NULL,NULL,false),

-- ── HOLOSUN ───────────────────────────────────────────────────────────────────
('Holosun','510C','Red Dot',NULL,NULL,NULL,'N/A',true,'65 MOA Ring / 2 MOA Dot','MOA',NULL,NULL,'AA',3.8,299,false,'China','Open reflex with solar backup (ACSS-compatible reticle optional). Large window. Multi-reticle system.',NULL,NULL,false),
('Holosun','507C','Red Dot',NULL,NULL,NULL,'N/A',true,'2 MOA Dot / 32 MOA Ring','MOA',NULL,NULL,'CR2032',1.6,249,false,'China','Multi-reticle pistol red dot. Solar backup. Motion-sensing auto-on. Competitive with Trijicon RMR footprint.','Absolute Co-Witness',NULL,false),
('Holosun','507C X2','Red Dot',NULL,NULL,NULL,'N/A',true,'2 MOA Dot / 32 MOA Ring','MOA',NULL,NULL,'CR2032',1.6,279,false,'China','X2 Gen: improved lock mode, expanded MRS, same proven housing.',NULL,NULL,false),
('Holosun','507K','Red Dot',NULL,NULL,NULL,'N/A',true,'2 MOA Dot / 32 MOA Ring','MOA',NULL,NULL,'CR2032',1.1,249,false,'China','Compact K-series for sub-compact pistols. Shields Arms and Shield footprint.','Absolute Co-Witness',NULL,false),
('Holosun','407C','Red Dot',NULL,NULL,NULL,'N/A',true,'2 MOA Dot','MOA',NULL,NULL,'CR2032',1.4,199,false,'China','Dot-only variant of the 507C. Solar panel. Motion activation. Lower cost option.',NULL,NULL,false),
('Holosun','AEMS','Red Dot',NULL,NULL,NULL,'N/A',true,'2 MOA Dot / 65 MOA Ring','MOA',NULL,NULL,'CR2032',3.5,399,false,'China','Advanced Enclosed Micro Sight. Fully enclosed design for maximum protection. Multi-reticle.',NULL,NULL,false),
('Holosun','SCS-MOS','Red Dot',NULL,NULL,NULL,'N/A',true,'2 MOA Dot / 32 MOA Ring','MOA',NULL,NULL,'CR2032',0.7,329,false,'China','Suppressor-height solar-charging pistol optic for Glock MOS slides.',NULL,NULL,false),
('Holosun','HE510C-GR Elite','Red Dot',NULL,NULL,NULL,'N/A',true,'65 MOA Ring / 2 MOA Dot','MOA',NULL,NULL,'AA',3.8,399,false,'China','Green dot elite version. Titanium housing. Solar backup. Night vision compatible.',NULL,NULL,false),
('Holosun','HS403B','Red Dot',NULL,NULL,NULL,'N/A',true,'2 MOA Dot','MOA',NULL,NULL,'CR2032',3.0,149,false,'China','Budget-tier tube red dot. 50,000 hour battery. Basic but reliable.',NULL,NULL,false),
('Holosun','SCRS','Red Dot',NULL,NULL,NULL,'N/A',true,'2 MOA Dot','MOA',NULL,NULL,'CR2032',3.2,319,false,'China','Solar-charging rifle sight. Shake-awake, NV compatible. Full-size housing for rifles.',NULL,NULL,false),

-- ── BURRIS ────────────────────────────────────────────────────────────────────
('Burris','FastFire 3','Red Dot',NULL,NULL,NULL,'N/A',true,'3 MOA Dot','MOA',NULL,NULL,'CR2032',1.5,209,false,'USA','Popular pistol/shotgun red dot. Auto-on with ambient light sensor. Bottom-loading battery without scope removal.',NULL,NULL,false),
('Burris','RT-6 1-6x24','LPVO',1,6,24,'SFP',true,'Ballistic AR','MOA',0.5,NULL,'CR2032',19.0,399,false,'USA','Budget-tier LPVO. Illuminated Ballistic AR reticle. Includes mount. Good entry-level LPVO.',NULL,30,false),
('Burris','XTR III 3.3-18x50','Scope',3.3,18,50,'FFP',false,'SCR Mil','MRAD',NULL,0.1,NULL,31.0,1299,false,'USA','High-tier precision scope. 34mm tube. Zero-stop. Competition and long-range use.',NULL,34,false),
('Burris','Veracity 4-20x50','Scope',4,20,50,'SFP',false,'Ballistic Plex','MOA',0.25,NULL,NULL,28.0,799,false,'USA','Long-range hunting scope. Ballistic Plex reticle for field holds.',NULL,30,false),
('Burris','XTR II 2-10x42','Scope',2,10,42,'FFP',true,'SCR Mil','MRAD',NULL,0.1,'CR2032',25.6,999,false,'USA','Illuminated FFP scope. 30mm tube. Good mid-tier option.',NULL,30,false),
('Burris','Eliminator III 4-16x50','Scope',4,16,50,'SFP',true,'X96','MOA',0.25,NULL,'CR2',29.0,1299,false,'USA','Laser rangefinding scope with ballistic computer. Auto-calculates holdover.',NULL,30,false),

-- ── BUSHNELL ──────────────────────────────────────────────────────────────────
('Bushnell','Elite Tactical DMR3 3.5-21x50','Scope',3.5,21,50,'FFP',false,'G4P','MOA',0.1,NULL,NULL,36.8,1599,false,'USA','Elite tactical precision scope. Zero stop, exposed tactile turrets.',NULL,30,false),
('Bushnell','First Strike 2.0','Red Dot',NULL,NULL,NULL,'N/A',true,'3 MOA Dot','MOA',NULL,NULL,'CR2032',3.0,179,false,'USA','Entry-level red dot with motion-sensing auto-on. Included lower and Absolute co-witness mounts.',NULL,NULL,false),
('Bushnell','AR Optics 1-4x24','LPVO',1,4,24,'SFP',true,'Drop Zone-223','MOA',0.5,NULL,'CR2032',14.5,229,false,'USA','Budget LPVO for .223/5.56 rifles. Drop Zone BDC reticle.',NULL,30,false),
('Bushnell','LMSS2 10x42','Rangefinder',NULL,NULL,NULL,'N/A',false,NULL,NULL,NULL,NULL,NULL,25.6,599,false,'USA','Laser rangefinder with ARC (Angle Range Compensation). 1,500-yard ranging.',NULL,NULL,false),
('Bushnell','RXS-100','Red Dot',NULL,NULL,NULL,'N/A',true,'4 MOA Dot','MOA',NULL,NULL,'CR2032',2.2,99,false,'USA','Ultra-budget red dot. 3,000 hour battery. Entry-level option.',NULL,NULL,false),
('Bushnell','Forge 4.5-27x50','Scope',4.5,27,50,'FFP',false,'Deploy MOA','MOA',0.1,NULL,NULL,31.0,849,false,'USA','Mid-tier long-range scope. 34mm tube. Zero-stop. Competitive with more expensive options.',NULL,34,false),
('Bushnell','Prime 4-12x40','Scope',4,12,40,'SFP',false,'Multi-X','MOA',0.25,NULL,NULL,15.1,249,false,'USA','Value-tier hunting scope. Simple Multi-X reticle. Budget hunting option.',NULL,1,false),

-- ── ZEISS ─────────────────────────────────────────────────────────────────────
('Zeiss','LRP S5 3.6-18x50','Scope',3.6,18,50,'FFP',false,'ZFmoa-2','MRAD',NULL,0.1,NULL,31.7,3299,false,'Germany','Long Range Precision scope. Excellent glass quality. 34mm tube. Popular in PRS competition.',NULL,34,false),
('Zeiss','Conquest V4 3-12x56','Scope',3,12,56,'SFP',false,'ZMOA-1','MOA',0.25,NULL,NULL,28.9,1399,false,'Germany','Hunting scope with large 56mm objective for low-light. Superb German glass.',NULL,30,false),
('Zeiss','Victory V8 1.1-8x30','LPVO',1.1,8,30,'FFP',true,'RZ 800','MOA',0.25,NULL,'CR2032',23.3,3999,false,'Germany','Premium German LPVO. Compact 30mm objective. Exceptional glass for a 1x LPVO.',NULL,30,false),
('Zeiss','Conquest V6 2-12x50','Scope',2,12,50,'SFP',true,'60 illuminated','MOA',0.25,NULL,'CR2032',23.8,2099,false,'Germany','Premium hunting scope with illuminated dot. Excellent German optics.',NULL,30,false),
('Zeiss','Conquest V4 4-16x44','Scope',4,16,44,'SFP',false,'ZMOA-1','MOA',0.25,NULL,NULL,20.7,1199,false,'Germany','Standard hunting variable. Great glass at competitive German optic pricing.',NULL,30,false),

-- ── SCHMIDT & BENDER ──────────────────────────────────────────────────────────
('Schmidt & Bender','PM II 3-12x50','Scope',3,12,50,'FFP',false,'P4 Fine','MRAD',NULL,0.1,NULL,30.7,3799,false,'Germany','The gold standard military sniper scope. Used by US Army, USMC, and over 40 militaries. Exceptional reliability.',NULL,34,true),
('Schmidt & Bender','PM II 5-25x56','Scope',5,25,56,'FFP',false,'P4 Fine','MRAD',NULL,0.1,NULL,44.0,4499,false,'Germany','Long-range PM II. 56mm objective. USMC M2010 ESR scope. World-class precision.',NULL,34,true),
('Schmidt & Bender','PM II 3-20x50','Scope',3,20,50,'FFP',false,'MSR','MRAD',NULL,0.1,NULL,33.0,4199,false,'Germany','Extended zoom PM II. 3-20x range covers nearly all applications.',NULL,34,true),
('Schmidt & Bender','Short Dot 1-4x24','LPVO',1,4,24,'FFP',true,'Dot','MRAD',NULL,0.1,'CR2032',23.0,2799,false,'Germany','Compact LPVO. Superb glass. Used by German KSK and other special operations.',NULL,30,true),
('Schmidt & Bender','Klassik 2.5-10x56','Scope',2.5,10,56,'SFP',true,'L3','MOA',0.25,NULL,'CR2032',25.5,1999,false,'Germany','Hunting scope with large objective for low-light. Illuminated L3 reticle.',NULL,30,false),

-- ── SWAROVSKI ─────────────────────────────────────────────────────────────────
('Swarovski','Z8i 1-8x24','LPVO',1,8,24,'FFP',true,'4A-I','MOA',0.25,NULL,'CR2032',22.4,3699,false,'Austria','Austrian glass excellence in a 1-8x LPVO. Exceptional clarity and low-light performance.',NULL,30,false),
('Swarovski','Z6i 1-6x24','LPVO',1,6,24,'SFP',true,'4A-I','MOA',0.25,NULL,'CR2032',20.5,2799,false,'Austria','Premium 1-6x hunting LPVO. Outstanding glass quality for the class.',NULL,30,false),
('Swarovski','Z5 3.5-18x44','Scope',3.5,18,44,'SFP',false,'4W','MOA',0.25,NULL,NULL,20.1,1999,false,'Austria','Hunting scope with classic Swarovski optical performance.',NULL,30,false),
('Swarovski','Z8i 2-16x50','Scope',2,16,50,'FFP',true,'BRX-I','MOA',0.25,NULL,'CR2032',27.5,3899,false,'Austria','Premium hunting/precision scope. Austrian glass with illuminated FFP reticle.',NULL,30,false),

-- ── US OPTICS ─────────────────────────────────────────────────────────────────
('US Optics','ST-10 3.2-17x44','Scope',3.2,17,44,'FFP',false,'GAP','MRAD',NULL,0.1,NULL,31.0,1499,false,'USA','American-made precision scope. Hand-assembled. ERGO-LOK turrets.',NULL,34,false),
('US Optics','B-25 2.5-25x52','Scope',2.5,25,52,'FFP',false,'GAP-MIL','MRAD',NULL,0.1,NULL,49.0,3499,false,'USA','High-end US-made precision scope. Daylight-bright turrets. Competition grade.',NULL,35,false),

-- ── KAHLES ────────────────────────────────────────────────────────────────────
('Kahles','K318i 3.5-18x50','Scope',3.5,18,50,'FFP',false,'MSR/Ki','MRAD',NULL,0.1,NULL,31.0,2899,false,'Austria','Austrian precision scope. Exceptional build quality. Zero click per revolution indicator.',NULL,34,false),
('Kahles','K525i 5-25x56','Scope',5,25,56,'FFP',false,'SKMR3','MRAD',NULL,0.1,NULL,35.6,3599,false,'Austria','Long-range Kahles. Used by Steyr and Austrian military programs.',NULL,34,true),
('Kahles','K16i 1-6x24','LPVO',1,6,24,'FFP',true,'GR3i','MRAD',NULL,0.1,'CR2032',18.2,1999,false,'Austria','Compact Austrian LPVO. Outstanding glass for the class.',NULL,30,false),

-- ── MEOPTA ────────────────────────────────────────────────────────────────────
('Meopta','MeoStar R2 2-12x50','Scope',2,12,50,'SFP',true,'Z-plus Illuminated','MOA',0.25,NULL,'CR2032',20.6,1199,false,'Czech Republic','Czech glass manufacturer with European heritage. Good value in the mid-tier category.',NULL,30,false),
('Meopta','Optika6 3-18x56','Scope',3,18,56,'FFP',false,'RD illuminated','MRAD',NULL,0.1,NULL,25.2,799,false,'Czech Republic','Budget entry from Meopta. Good glass at competitive price.',NULL,30,false),

-- ── STEINER ───────────────────────────────────────────────────────────────────
('Steiner','T5Xi 1-5x24','LPVO',1,5,24,'FFP',true,'SCR Mil','MRAD',NULL,0.1,'CR2032',17.7,1699,false,'Germany','Military-grade 1-5x LPVO. Used by USSOCOM and special operations. Extremely rugged.',NULL,30,true),
('Steiner','Military 1-5x24','LPVO',1,5,24,'FFP',true,'SCR Mil','MRAD',NULL,0.1,'CR2032',23.0,2799,false,'Germany','Tier 1 LPVO. Used by NATO special operations forces. Available in limited quantities.',NULL,30,true),
('Steiner','Mk7 1-6x24','LPVO',1,6,24,'FFP',true,'Drakon','MRAD',NULL,0.1,'CR2032',17.0,1699,false,'Germany','USSOCOM 1-6x LPVO. DRAKON reticle with ranging capability. Military issue.',NULL,30,true),

-- ── MARCH OPTICS ──────────────────────────────────────────────────────────────
('March','Compact 1-10x24','LPVO',1,10,24,'FFP',true,'FML-TR1','MRAD',NULL,0.1,'CR2032',21.0,2699,false,'Japan','High-end Japanese precision optic manufacturer. Outstanding glass quality. 30mm tube.',NULL,30,false),
('March','F 4.5-28x52','Scope',4.5,28,52,'FFP',false,'FML-1','MRAD',NULL,0.1,NULL,40.0,3499,false,'Japan','Extreme long range March scope. High magnification for ELR and precision shooting.',NULL,34,false),

-- ── RITON ─────────────────────────────────────────────────────────────────────
('Riton','5 Conquer 3-15x50','Scope',3,15,50,'FFP',false,'RH5','MRAD',NULL,0.1,NULL,30.1,1199,false,'USA','Mid-tier precision scope. Zero-stop turrets. 34mm tube. Competitive value.',NULL,34,false),
('Riton','1 Contour 3-9x40','Scope',3,9,40,'SFP',false,'BDC','MOA',0.25,NULL,NULL,15.1,249,false,'USA','Budget hunting scope. Entry level for new hunters.',NULL,1,false),

-- ── BUDGET / ENTRY TIER ───────────────────────────────────────────────────────
('UTG/Leapers','4-16x44 AO','Scope',4,16,44,'SFP',true,'EZ-TAP','MOA',0.25,NULL,'CR2032',28.4,149,false,'China','Budget precision scope. Illuminated reticle. Adjustable objective. Value tier.',NULL,30,false),
('UTG/Leapers','Micro Red Dot','Red Dot',NULL,NULL,NULL,'N/A',true,'4 MOA Dot','MOA',NULL,NULL,'CR2032',2.1,79,false,'China','Entry-level micro red dot. Basic but functional for budget builds.',NULL,NULL,false),
('Crimson Trace','RAW 1x','Red Dot',NULL,NULL,NULL,'N/A',true,'3 MOA Dot','MOA',NULL,NULL,'CR2032',2.4,129,false,'USA','Rugged Aiming Weapon sight. Solar backup. Entry-level from CT.',NULL,NULL,false),
('Crimson Trace','CTS-1550 2x Prism','Prism',2,2,35,'FFP',true,'BDC','MOA',NULL,NULL,'CR2032',7.9,299,false,'USA','Compact 2x prism from Crimson Trace.',NULL,NULL,false),

-- ── MAGNIFIERS ────────────────────────────────────────────────────────────────
('Vortex','Micro 3x Magnifier','Magnifier',3,3,NULL,'N/A',false,NULL,NULL,NULL,NULL,NULL,5.6,199,false,'USA','3x magnifier for use behind red dot or holographic sights. Includes flip-to-side mount.',NULL,NULL,false),
('EOTech','G33 3x Magnifier','Magnifier',3,3,NULL,'N/A',false,NULL,NULL,NULL,NULL,NULL,11.2,479,false,'USA','Standard EOTech magnifier. Flip-to-side mount. Compatible with most red dots.',NULL,NULL,true),
('Aimpoint','3XMag-1','Magnifier',3,3,NULL,'N/A',false,NULL,NULL,NULL,NULL,NULL,7.0,329,false,'Sweden','Aimpoint 3x magnifier with flip-to-side mount.',NULL,NULL,true),
('Holosun','HM3X','Magnifier',3,3,NULL,'N/A',false,NULL,NULL,NULL,NULL,NULL,6.0,169,false,'China','Budget 3x magnifier. Compatible with most red dot footprints.',NULL,NULL,false),
('Vortex','VMX-3T 3x Magnifier','Magnifier',3,3,NULL,'N/A',false,NULL,NULL,NULL,NULL,NULL,9.5,279,false,'USA','Standard flip-to-side 3x magnifier. Popular pairing with Strike Eagle or SPARC AR.',NULL,NULL,false)

ON CONFLICT (brand, model) DO NOTHING;
