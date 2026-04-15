-- ============================================================
-- gun_models: public reference table
-- Known firearm makes, models, and specifications
-- RLS: public SELECT, service_role only for writes
-- ============================================================

CREATE TABLE IF NOT EXISTS public.gun_models (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  make                  text NOT NULL,
  model                 text NOT NULL,
  caliber               text,
  type                  text,       -- 'Pistol', 'Rifle', 'Shotgun'
  action                text,       -- 'Semi-Auto', 'Bolt', 'Lever', 'Pump', 'Revolver', 'Break', 'Single Shot'
  capacity              integer,
  year_introduced       integer,
  discontinued          boolean DEFAULT false,
  country_of_origin     text,
  description           text,
  msrp_usd              numeric,
  barrel_length_options text[],
  weight_oz_unloaded    numeric,
  overall_length_in     numeric,
  military_use          boolean DEFAULT false,
  law_enforcement_use   boolean DEFAULT false,
  notable_variants      text[],
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now(),
  UNIQUE (make, model)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gun_models_make         ON public.gun_models (make);
CREATE INDEX IF NOT EXISTS idx_gun_models_model        ON public.gun_models (model);
CREATE INDEX IF NOT EXISTS idx_gun_models_caliber      ON public.gun_models (caliber);
CREATE INDEX IF NOT EXISTS idx_gun_models_type         ON public.gun_models (type);
CREATE INDEX IF NOT EXISTS idx_gun_models_action       ON public.gun_models (action);
CREATE INDEX IF NOT EXISTS idx_gun_models_discontinued ON public.gun_models (discontinued);

-- Updated_at trigger (reuse function from manufacturers migration)
DROP TRIGGER IF EXISTS trg_gun_models_updated_at ON public.gun_models;
CREATE TRIGGER trg_gun_models_updated_at
  BEFORE UPDATE ON public.gun_models
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.gun_models ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gun_models_public_read"   ON public.gun_models;
DROP POLICY IF EXISTS "gun_models_service_write" ON public.gun_models;

CREATE POLICY "gun_models_public_read"
  ON public.gun_models FOR SELECT
  USING (true);

CREATE POLICY "gun_models_service_write"
  ON public.gun_models FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- SEED DATA  (200+ models)
-- ============================================================

INSERT INTO public.gun_models
  (make, model, caliber, type, action, capacity, year_introduced, discontinued, country_of_origin, description, msrp_usd, barrel_length_options, weight_oz_unloaded, overall_length_in, military_use, law_enforcement_use, notable_variants)
VALUES

-- ── GLOCK ─────────────────────────────────────────────────────────────────────
('Glock','G17','9mm','Pistol','Semi-Auto',17,1982,false,'Austria','The original Glock. Full-size 9mm, standard capacity 17+1. The most widely issued police pistol in the world.',699,ARRAY['4.49"'],24.87,7.95,true,true,ARRAY['G17 Gen3','G17 Gen4','G17 Gen5','G17 MOS','G17L']),
('Glock','G17 Gen5','9mm','Pistol','Semi-Auto',17,2017,false,'Austria','Fifth-generation G17 with flared mag well, ambidextrous slide stop, and nPVD barrel.',749,ARRAY['4.49"'],24.87,7.95,true,true,ARRAY['G17 Gen5 MOS','G17 Gen5 FS']),
('Glock','G19','9mm','Pistol','Semi-Auto',15,1988,false,'Austria','Compact 9mm. The best-selling handgun in the United States. Shorter grip and slide than the G17 while maintaining a full-size barrel for all practical purposes.',699,ARRAY['4.02"'],23.65,7.36,true,true,ARRAY['G19 Gen3','G19 Gen4','G19 Gen5','G19 MOS','G19X','G19 Gen5 MOS']),
('Glock','G19 Gen5','9mm','Pistol','Semi-Auto',15,2017,false,'Austria','5th-gen compact 9mm with Gen5 improvements: no finger grooves, flared magwell, ambidextrous slide stop, marksman barrel.',749,ARRAY['4.02"'],23.65,7.36,true,true,ARRAY['G19 Gen5 MOS','G19 Gen5 FS','G19 Gen5 MOS FS']),
('Glock','G19X','9mm','Pistol','Semi-Auto',19,2018,false,'Austria','Crossover model: compact G19 slide on full-size G17 frame. Coyote tan PVD-coated. Result of the MHS competition.',749,ARRAY['4.02"'],24.83,7.36,true,true,NULL),
('Glock','G20','10mm','Pistol','Semi-Auto',15,1991,false,'Austria','Full-size 10mm. Popular for hiking/bear country carry. One of the most powerful semi-auto pistols in production.',637,ARRAY['4.61"'],30.69,8.07,false,false,ARRAY['G20 Gen4','G20 SF','G40 MOS (long slide)']),
('Glock','G21','.45 ACP','Pistol','Semi-Auto',13,1990,false,'Austria','Full-size .45 ACP Glock. Large grip suited for larger hands. Military/police adoption in several countries.',637,ARRAY['4.61"'],29.28,8.07,false,true,ARRAY['G21 Gen4','G21 SF']),
('Glock','G22','.40 S&W','Pistol','Semi-Auto',15,1990,false,'Austria','Full-size .40 S&W. Was the most common FBI and law-enforcement pistol caliber during the 2000s.',637,ARRAY['4.49"'],25.59,7.95,false,true,ARRAY['G22 Gen4','G22 Gen5']),
('Glock','G23','.40 S&W','Pistol','Semi-Auto',13,1990,false,'Austria','Compact .40 S&W. Law enforcement favorite for plainclothes carry.',637,ARRAY['4.02"'],21.16,7.36,false,true,ARRAY['G23 Gen4','G23 Gen5']),
('Glock','G26','9mm','Pistol','Semi-Auto',10,1994,false,'Austria','Baby Glock 9mm. Sub-compact for concealed carry. Compatible with G17/G19 magazines.',599,ARRAY['3.43"'],21.71,6.50,false,true,ARRAY['G26 Gen4','G26 Gen5']),
('Glock','G27','.40 S&W','Pistol','Semi-Auto',9,1994,false,'Austria','Baby Glock .40. Sub-compact .40 S&W. Compatible with G22/G23 magazines.',599,ARRAY['3.43"'],21.71,6.50,false,true,ARRAY['G27 Gen4']),
('Glock','G34','9mm','Pistol','Semi-Auto',17,1998,false,'Austria','Practical/Tactical competition model. Extended barrel and slide for better sight radius. Popular in USPSA and IPSC.',729,ARRAY['5.31"'],25.95,8.82,false,false,ARRAY['G34 Gen4','G34 Gen5','G34 Gen5 MOS']),
('Glock','G43','9mm','Pistol','Semi-Auto',6,2015,false,'Austria','Single-stack 9mm micro-compact. Thin profile for deep concealment. 6+1 capacity standard.',499,ARRAY['3.41"'],17.95,6.26,false,true,ARRAY['G43 NRA Edition']),
('Glock','G43X','9mm','Pistol','Semi-Auto',10,2019,false,'Austria','G43 slide on G48 frame. 10+1 capacity with flush-fit magazine. Popular Shield Arms S15 mag compatible.',499,ARRAY['3.41"'],18.70,6.50,false,true,ARRAY['G43X MOS','G43X Rail']),
('Glock','G45','9mm','Pistol','Semi-Auto',17,2018,false,'Austria','G19 compact slide on G17 full-size frame. Front slide serrations. Optimized for duty carry.',699,ARRAY['4.02"'],24.83,7.44,false,true,ARRAY['G45 MOS']),
('Glock','G48','9mm','Pistol','Semi-Auto',10,2019,false,'Austria','Slimline 9mm with 4" barrel. Slightly larger than G43, smaller than G19. 10+1 standard.',499,ARRAY['4.17"'],18.70,6.85,false,true,ARRAY['G48 MOS','G48 Compact']),
('Glock','G44','.22 LR','Pistol','Semi-Auto',10,2020,false,'Austria','First Glock in .22 LR. Same dimensions as G19. Hybrid polymer/steel slide. Training/target option.',430,ARRAY['4.02"'],12.63,7.28,false,false,NULL),

-- ── SIG SAUER ─────────────────────────────────────────────────────────────────
('Sig Sauer','P226','9mm','Pistol','Semi-Auto',15,1984,false,'Germany','Full-size DA/SA pistol. US Navy SEAL sidearm for decades. Also available in .40 S&W and .357 SIG.',1099,ARRAY['4.4"'],34.4,7.7,true,true,ARRAY['P226 Legion','P226 MK25','P226 TACOPS','P226 Elite']),
('Sig Sauer','P229','9mm','Pistol','Semi-Auto',15,1991,false,'Germany','Compact DA/SA. Chosen by US Secret Service and DHS. Shorter grip than P226 with same slide.',1099,ARRAY['3.9"'],32.4,7.1,true,true,ARRAY['P229 Legion','P229 Elite','P229 TACOPS']),
('Sig Sauer','P320','9mm','Pistol','Semi-Auto',17,2014,false,'USA','Modular striker-fired pistol with removable fire control unit. Won the US Army MHS contract as M17/M18.',679,ARRAY['3.6"','4.7"'],24.9,7.2,true,true,ARRAY['P320 M17','P320 M18','P320 XFULL','P320 XCarry','P320 Compact']),
('Sig Sauer','P320 Compact','9mm','Pistol','Semi-Auto',15,2014,false,'USA','Compact variant of the P320 modular striker-fired system.',679,ARRAY['3.9"'],25.8,7.2,true,true,ARRAY['P320 Compact Legion']),
('Sig Sauer','P320 XCarry','9mm','Pistol','Semi-Auto',17,2018,false,'USA','P320 with full-size grip module and 3.9" compact slide. Ideal carry/competition configuration.',679,ARRAY['3.9"'],25.8,7.5,false,true,ARRAY['P320 XCarry Legion']),
('Sig Sauer','P365','9mm','Pistol','Semi-Auto',10,2018,false,'USA','Micro-compact that holds 10+1 in a package nearly as small as a single-stack. Changed the CCW market.',599,ARRAY['3.1"'],17.8,5.8,false,true,ARRAY['P365 SAS','P365 XL','P365X','P365 NRA','P365-380']),
('Sig Sauer','P365XL','9mm','Pistol','Semi-Auto',12,2019,false,'USA','Extended P365 with longer slide and grip. 12+1 standard, Romeo Zero optic cut standard.',649,ARRAY['3.7"'],20.7,6.6,false,true,ARRAY['P365XL Romeo Zero','P365XL Spectre']),
('Sig Sauer','P365X','9mm','Pistol','Semi-Auto',12,2021,false,'USA','XL slide on standard P365 frame. Optic cut standard. Slim profile with extended capacity.',649,ARRAY['3.1"'],18.8,6.6,false,true,NULL),
('Sig Sauer','P938','9mm','Pistol','Semi-Auto',6,2012,false,'USA','Single-action micro-compact 9mm based on 1911 design. External hammer, manual safety.',799,ARRAY['3.0"'],16.0,5.9,false,false,ARRAY['P938 SAS','P938 Equinox','P938 Nightmare']),
('Sig Sauer','P238','.380 ACP','Pistol','Semi-Auto',6,2009,false,'USA','1911-based micro-compact in .380 ACP. Single-action with manual safety. Premium materials.',799,ARRAY['2.7"'],15.2,5.5,false,false,ARRAY['P238 SAS','P238 Equinox','P238 Rainbow']),
('Sig Sauer','P210','9mm','Pistol','Semi-Auto',8,1949,false,'Switzerland','Swiss-engineered pistol considered one of the most accurate semi-autos ever built. Single-action, rail version available.',1399,ARRAY['5.0"'],37.2,8.5,true,true,ARRAY['P210 Legend','P210 Target','P210 Carry']),
('Sig Sauer','MCX','5.56 NATO','Rifle','Semi-Auto',30,2015,false,'USA','Modular rifle in AR-style with folding stock and short-stroke piston. Civilian MCX Virtus available.',1699,ARRAY['9"','11.5"','16"'],7.7,35.0,true,true,ARRAY['MCX Virtus','MCX Rattler','MCX SPEAR-LT']),
('Sig Sauer','MPX','9mm','Rifle','Semi-Auto',30,2013,false,'USA','9mm AR-style carbine/pistol. Folding stock, short-stroke piston.',1599,ARRAY['8"','16"'],6.5,29.0,true,true,ARRAY['MPX Copperhead','MPX Pistol','MPX SBR']),

-- ── SMITH & WESSON ─────────────────────────────────────────────────────────────
('Smith & Wesson','M&P 9','9mm','Pistol','Semi-Auto',17,2005,false,'USA','Polymer striker-fired full-size 9mm. Law enforcement staple. Excellent ergonomics with interchangeable backstraps.',569,ARRAY['4.25"','5.0"'],24.0,7.63,false,true,ARRAY['M&P 9 M2.0','M&P 9 PC','M&P 9 Pro']),
('Smith & Wesson','M&P 9 2.0','9mm','Pistol','Semi-Auto',17,2016,false,'USA','Upgraded M&P with improved trigger, grip texture, and accuracy enhancements.',569,ARRAY['4.25"','5.0"'],24.7,7.63,false,true,ARRAY['M&P9 M2.0 Compact','M&P9 M2.0 Metal','M&P9 M2.0 OR']),
('Smith & Wesson','M&P 40','.40 S&W','Pistol','Semi-Auto',15,2005,false,'USA','Full-size .40 S&W polymer striker-fired. Same frame as M&P 9 with caliber-appropriate components.',569,ARRAY['4.25"'],24.0,7.63,false,true,NULL),
('Smith & Wesson','M&P Shield 9','9mm','Pistol','Semi-Auto',8,2012,false,'USA','Single-stack slim 9mm. One of the best-selling CCW pistols ever produced.',479,ARRAY['3.1"'],19.0,6.1,false,true,ARRAY['M&P Shield Plus','M&P Shield EZ','M&P Shield M2.0']),
('Smith & Wesson','M&P Shield Plus','9mm','Pistol','Semi-Auto',13,2021,false,'USA','Upgraded Shield with staggered 13+1 magazine, improved trigger, and optics-ready option.',519,ARRAY['3.1"'],20.0,6.1,false,true,ARRAY['Shield Plus OR','Shield Plus Performance Center']),
('Smith & Wesson','686','.357 Magnum','Pistol','Revolver',6,1980,false,'USA','Stainless steel L-frame .357 Magnum revolver. One of the finest production revolvers available. Competition and hunting use.',849,ARRAY['2.5"','4"','6"','7"'],35.0,9.6,false,true,ARRAY['686 Plus (7-shot)','686 PC','686 Competitor']),
('Smith & Wesson','629','.44 Magnum','Pistol','Revolver',6,1979,false,'USA','Stainless steel N-frame .44 Magnum. The modern version of the famous Model 29 used by Dirty Harry.',999,ARRAY['4"','5"','6.5"'],44.0,11.6,false,false,ARRAY['629 Classic','629 PC','629 Deluxe']),
('Smith & Wesson','442','.38 Special','Pistol','Revolver',5,1993,false,'USA','Alloy-frame J-frame 5-shot .38 Special. Double-action only with concealed hammer. Classic airweight carry revolver.',469,ARRAY['1.875"'],14.4,6.3,false,true,ARRAY['Model 442 Matte']),
('Smith & Wesson','642','.38 Special +P','Pistol','Revolver',5,1996,false,'USA','Airweight aluminum frame J-frame revolver. Concealed hammer, +P rated. One of the most popular CCW revolvers.',469,ARRAY['1.875"'],15.0,6.3,false,true,ARRAY['642 CT','642 Airweight']),
('Smith & Wesson','Model 29','.44 Magnum','Pistol','Revolver',6,1956,false,'USA','The original "most powerful handgun in the world" (at introduction). Blued N-frame .44 Magnum. Immortalized by Dirty Harry.',1049,ARRAY['4"','6.5"','8.375"'],43.5,11.6,false,false,ARRAY['Model 29 Classics']),
('Smith & Wesson','Model 10','.38 Special','Pistol','Revolver',6,1899,false,'USA','The Military & Police revolver. One of the most produced revolvers in history, with over 6 million made.',579,ARRAY['4"'],30.5,9.25,false,true,NULL),

-- ── SPRINGFIELD ARMORY ────────────────────────────────────────────────────────
('Springfield Armory','1911 Loaded','.45 ACP','Pistol','Semi-Auto',8,1990,false,'USA','1911 with loaded upgrades: fiber-optic sights, match barrel, beavertail grip safety.',999,ARRAY['5.0"'],38.5,8.59,false,true,NULL),
('Springfield Armory','1911 Mil-Spec','.45 ACP','Pistol','Semi-Auto',7,1985,false,'USA','Classic government-profile 1911. GI-style sights and minimal features. Entry-level 1911.',729,ARRAY['5.0"'],39.0,8.59,false,false,NULL),
('Springfield Armory','Hellcat','9mm','Pistol','Semi-Auto',11,2019,false,'USA','Micro-compact 9mm with highest capacity in its size class at launch (11+1). OSP optics-ready variant.',569,ARRAY['3.0"'],18.3,6.0,false,true,ARRAY['Hellcat OSP','Hellcat RDP','Hellcat Pro']),
('Springfield Armory','Hellcat Pro','9mm','Pistol','Semi-Auto',15,2022,false,'USA','Larger Hellcat with 15+1 capacity, longer grip, 3.7" barrel. Optics-ready standard.',599,ARRAY['3.7"'],21.0,6.6,false,true,ARRAY['Hellcat Pro OSP']),
('Springfield Armory','XD-9','9mm','Pistol','Semi-Auto',16,2002,false,'Croatia','Croatian HS2000-derived striker-fired pistol. Grip safety is unique feature. Full-size 4" barrel.',519,ARRAY['4.0"','5.0"'],28.0,7.3,false,true,ARRAY['XD Mod.2','XD-E','XD-S']),
('Springfield Armory','XDm 9','9mm','Pistol','Semi-Auto',19,2007,false,'Croatia','Enhanced XD with match-grade barrel and trigger, 19+1 capacity, interchangeable backstraps.',599,ARRAY['3.8"','4.5"','5.25"'],29.0,7.6,false,true,ARRAY['XDm Elite','XDm OSP','XDm Competition']),
('Springfield Armory','Echelon','9mm','Pistol','Semi-Auto',17,2023,false,'USA','New striker-fired with Central Operating Group modular fire control, optics-ready, aggressive texture.',599,ARRAY['4.5"'],25.2,7.9,false,true,NULL),
('Springfield Armory','Saint Victor 5.56','5.56 NATO','Rifle','Semi-Auto',30,2019,false,'USA','Mid-tier AR-15 with improved features: BCM Gunfighter stock, Bravo Company furniture, 16" CMV barrel.',999,ARRAY['16"'],6.3,35.0,false,false,ARRAY['Saint AR-15','Saint Edge','Saint Victor .308']),

-- ── RUGER ─────────────────────────────────────────────────────────────────────
('Ruger','LCP II','.380 ACP','Pistol','Semi-Auto',6,2016,false,'USA','Micro-compact .380. Improved trigger and ergonomics over original LCP. One of the thinnest and lightest carry options.',349,ARRAY['2.75"'],10.6,5.17,false,true,ARRAY['LCP II Lite Rack','LCP Max']),
('Ruger','LCP Max','.380 ACP','Pistol','Semi-Auto',10,2021,false,'USA','Widened LCP platform with 10+1 flush-fit or 12+1 extended magazine.',379,ARRAY['2.8"'],10.4,5.17,false,false,NULL),
('Ruger','LC9s','9mm','Pistol','Semi-Auto',7,2014,false,'USA','Single-stack 9mm with striker-fired action and manual safety option.',479,ARRAY['3.12"'],17.2,6.0,false,true,NULL),
('Ruger','Max-9','9mm','Pistol','Semi-Auto',10,2021,false,'USA','10+1 micro-compact 9mm with integrated compensator option and optics-ready slide.',499,ARRAY['3.2"'],18.4,6.02,false,true,ARRAY['Max-9 Pro']),
('Ruger','Security-9','9mm','Pistol','Semi-Auto',15,2017,false,'USA','Full-size value-priced 9mm with Ruger''s secure action (pre-cocked striker).',379,ARRAY['4.0"'],23.8,7.24,false,false,ARRAY['Security-9 Pro','Security-9 Compact']),
('Ruger','American Pistol','9mm','Pistol','Semi-Auto',17,2016,false,'USA','Ambidextrous polymer striker-fired pistol. Interchangeable grip inserts.',569,ARRAY['4.2"','4.5"'],30.0,7.5,false,false,ARRAY['American Pistol Compact']),
('Ruger','GP100','.357 Magnum','Pistol','Revolver',6,1985,false,'USA','Rugged DA/SA revolver with triple-locking cylinder. Excellent durability for +P+ and magnum loads.',799,ARRAY['3"','4.2"','6"'],40.0,9.49,false,true,ARRAY['GP100 Match Champion','GP100 7-Shot','GP100 .44 Special']),
('Ruger','SP101','.357 Magnum','Pistol','Revolver',5,1989,false,'USA','Small-frame 5-shot .357 Magnum. One of the few small revolvers rated for full-power .357 loads.',719,ARRAY['2.25"','3.06"','4.2"'],25.0,7.2,false,true,ARRAY['SP101 Match Champion']),
('Ruger','Super Redhawk','.44 Magnum','Pistol','Revolver',6,1987,false,'USA','Extra-strong stainless DA/SA revolver for hunting. Integral scope mounting system.',1099,ARRAY['7.5"','9.5"'],53.0,13.0,false,false,ARRAY['Super Redhawk Alaskan']),
('Ruger','10/22','.22 LR','Rifle','Semi-Auto',10,1964,false,'USA','The most popular .22 semi-auto rifle in history. Hundreds of aftermarket accessories. 10-round rotary magazine.',299,ARRAY['18.5"','16.12"'],5.0,37.0,false,false,ARRAY['10/22 Takedown','10/22 Competition','10/22 Tactical','Charger Pistol']),
('Ruger','Mini-14','5.56 NATO','Rifle','Semi-Auto',20,1973,false,'USA','Ranch rifle in M14 styling. Preferred over AR-15 in some jurisdictions due to appearance. Reliable and accurate.',1079,ARRAY['18.5"','16.12"'],6.7,37.25,false,true,ARRAY['Mini-14 Ranch','Mini-14 Tactical']),
('Ruger','PC Carbine','9mm','Rifle','Semi-Auto',17,2017,false,'USA','Pistol-caliber carbine taking Glock or Ruger Security-9 magazines. Takedown design. 16" barrel.',679,ARRAY['16"'],6.8,34.37,false,false,ARRAY['PC Charger (pistol)']),
('Ruger','Precision Rifle','6.5 Creedmoor','Rifle','Bolt',10,2016,false,'USA','Folding-stock precision bolt-action. AICS-compatible magazines. Multi-use for hunting and PRS competition.',1599,ARRAY['24"','26"'],9.7,38.0,false,false,ARRAY['RPR 6mm Creedmoor','RPR .308','RPR .338 Lapua']),
('Ruger','American Rifle','.308 Win','Rifle','Bolt',4,2012,false,'USA','Value-priced bolt-action with the Ruger Marksman adjustable trigger. Matte finish and synthetic stock.',579,ARRAY['22"','24"'],6.3,42.0,false,false,ARRAY['American Ranch','American Predator','American Go Wild']),
('Ruger','SR1911','.45 ACP','Pistol','Semi-Auto',8,2011,false,'USA','Full-size 1911 with stainless or blued finish. Novak-style sights and Series 70-style fire control.',799,ARRAY['5.0"','4.25"'],39.2,8.59,false,false,ARRAY['SR1911 CMD','SR1911 10mm']),

-- ── COLT ──────────────────────────────────────────────────────────────────────
('Colt','1911 Government','.45 ACP','Pistol','Semi-Auto',7,1911,false,'USA','The original production Colt 1911. Government model with 5" barrel. Issued to US military 1911-1986.',999,ARRAY['5.0"'],38.0,8.59,true,true,ARRAY['Series 70','Series 80','1991']),
('Colt','Series 70','.45 ACP','Pistol','Semi-Auto',7,1970,false,'USA','1911 without the Series 80 firing pin safety. Preferred by purists for a lighter, crisper trigger pull.',999,ARRAY['5.0"'],38.0,8.59,false,false,NULL),
('Colt','Gold Cup','.45 ACP','Pistol','Semi-Auto',8,1957,false,'USA','Match-grade 1911 with adjustable target sights, accurized barrel, and flat mainspring housing. Competition staple.',1299,ARRAY['5.0"'],38.5,8.59,false,false,ARRAY['Gold Cup Trophy','Gold Cup National Match']),
('Colt','Python','.357 Magnum','Pistol','Revolver',6,1955,false,'USA','Legendary DA/SA revolver revived in 2020. Original versions are highly collectible. Known for buttery smooth action.',1499,ARRAY['3"','4.25"','6"'],43.5,9.6,false,false,ARRAY['Python 2020','Python Combat','Original Python']),
('Colt','Cobra','.38 Special','Pistol','Revolver',6,2017,false,'USA','Revived Cobra name. 6-shot .38 Special +P rated. Double-action only or DA/SA depending on variant.',699,ARRAY['2"'],25.0,7.2,false,false,ARRAY['King Cobra']),
('Colt','M4 Carbine','5.56 NATO','Rifle','Semi-Auto',30,1994,false,'USA','Civilian-legal semi-auto version of the M4 military carbine. 16" barrel to comply with NFA.',1199,ARRAY['16"'],6.5,35.0,true,true,ARRAY['M4A1','M4 LE6960']),
('Colt','LE6920','5.56 NATO','Rifle','Semi-Auto',30,2010,false,'USA','Direct-impingement AR-15 law enforcement carbine. M4-profile 16" barrel, mil-spec components throughout.',1099,ARRAY['16"'],6.5,32.0,false,true,ARRAY['LE6920 OEM','LE6920MP']),
('Colt','Single Action Army','.45 Colt','Pistol','Revolver',6,1873,false,'USA','The "Peacemaker." Iconic single-action revolver of the American West. Still in production in several calibers.',1799,ARRAY['4.75"','5.5"','7.5"'],36.0,10.75,true,false,ARRAY['SAA 2nd Gen','SAA 3rd Gen']),
('Colt','Anaconda','.44 Magnum','Pistol','Revolver',6,1990,false,'USA','Stainless steel large-frame DA/SA .44 Magnum. Revived in 2021 with Python-style improvements.',1499,ARRAY['4"','6"','8"'],47.0,11.0,false,false,ARRAY['Anaconda 2021']),

-- ── BERETTA ───────────────────────────────────────────────────────────────────
('Beretta','92FS','9mm','Pistol','Semi-Auto',15,1976,false,'Italy','Full-size DA/SA 9mm. US military M9 pistol (civilian designation). Open-slide design for reliability. Iconic Hollywood and military pistol.',699,ARRAY['4.9"'],33.4,8.5,true,true,ARRAY['92X','92X Performance','92X Centurion','Vertec']),
('Beretta','92X','9mm','Pistol','Semi-Auto',17,2019,false,'Italy','Modernized 92FS with Vertec-style grip, aggressive texturing, accessory rail, and improved sights.',799,ARRAY['4.7"'],33.5,8.1,false,true,ARRAY['92X Full','92X Compact','92X Performance Defensive']),
('Beretta','M9','9mm','Pistol','Semi-Auto',15,1985,false,'Italy','Military designation for the Beretta 92FS. US Armed Forces standard sidearm 1985-2017. Replaced by SIG P320 M17.',699,ARRAY['4.9"'],33.4,8.5,true,true,ARRAY['M9A1','M9A3']),
('Beretta','APX','9mm','Pistol','Semi-Auto',17,2017,false,'Italy','Striker-fired modular chassis pistol. Serialized fire control unit. Available in full, compact, and carry sizes.',599,ARRAY['4.25"','3.7"'],27.7,7.5,false,true,ARRAY['APX Compact','APX A1 Carry','APX A1 Full Size']),
('Beretta','PX4 Storm','9mm','Pistol','Semi-Auto',17,2004,false,'Italy','Rotating barrel design reduces felt recoil. Available in 9mm, .40 S&W, .45 ACP. DA/SA or DA-only.',649,ARRAY['4.0"'],27.7,7.5,false,true,ARRAY['PX4 Storm Compact','PX4 Storm Sub-Compact']),
('Beretta','1301 Tactical','12 Gauge','Shotgun','Semi-Auto',5,2013,false,'Italy','Purpose-built tactical semi-auto shotgun. BLINK operating system cycles faster than inertia-only designs. Law enforcement favorite.',1699,ARRAY['18.5"'],6.6,39.75,false,true,ARRAY['1301 Comp','1301 Tactical Gen 2']),
('Beretta','A400 Xtreme Plus','12 Gauge','Shotgun','Semi-Auto',3,2013,false,'Italy','Hunting/competition semi-auto with the KICK-OFF hydraulic stock recoil system. Can run any 12-gauge load.',1899,ARRAY['26"','28"','30"'],7.7,48.0,false,false,NULL),

-- ── H&K ───────────────────────────────────────────────────────────────────────
('H&K','VP9','9mm','Pistol','Semi-Auto',15,2014,false,'Germany','Striker-fired full-size 9mm with exceptional ergonomics. Paddle magazine release standard; button mag release optional. Exceptional trigger.',749,ARRAY['4.09"'],25.56,7.34,false,true,ARRAY['VP9SK','VP9 OR','VP9B','VP9-B Match']),
('H&K','P30','9mm','Pistol','Semi-Auto',15,2006,false,'Germany','DA/SA or LEM trigger system. Interchangeable backstraps and side panels. Law enforcement standard in Europe.',849,ARRAY['3.85"'],26.1,6.95,false,true,ARRAY['P30SK','P30L','P30 V1/V2/V3']),
('H&K','USP','9mm','Pistol','Semi-Auto',15,1993,false,'Germany','Universal Self-loading Pistol. Polymer frame DA/SA with enhanced recoil mitigation system. Available in 9, .40, .45.',849,ARRAY['4.25"','4.41"'],28.2,7.64,true,true,ARRAY['USP Compact','USP Tactical','USP45','USP45 Compact']),
('H&K','P2000','9mm','Pistol','Semi-Auto',13,2001,false,'Germany','Compact DA/SA or LEM. Used by many European police agencies. Compact for duty or plainclothes.',869,ARRAY['3.66"'],24.7,6.75,false,true,ARRAY['P2000SK']),
('H&K','HK45','.45 ACP','Pistol','Semi-Auto',10,2006,false,'Germany','Full-size .45 ACP polymer-frame. O-ring barrel for accuracy. Developed for SOCOM trials.',1059,ARRAY['4.46"'],29.12,7.52,true,true,ARRAY['HK45 Compact','HK45 Tactical']),
('H&K','Mark 23','.45 ACP','Pistol','Semi-Auto',12,1996,false,'Germany','SOCOM offensive handgun. Match-grade accuracy at large size. Suppressor and laser-aiming module compatible.',2299,ARRAY['5.87"'],42.3,9.65,true,false,NULL),
('H&K','SP5','9mm','Rifle','Semi-Auto',30,2019,false,'Germany','Semi-auto civilian MP5 in pistol configuration. Roller-delayed blowback action identical to military MP5.',2799,ARRAY['8.86"'],5.6,13.9,true,true,ARRAY['SP5K','SP5 SD']),
('H&K','HK416','5.56 NATO','Rifle','Semi-Auto',30,2009,false,'Germany','Piston-operated AR-pattern rifle. Used by Norwegian military, French GIGN, and JSOC. Killed Osama bin Laden.',3499,ARRAY['14.5"','16.5"','20"'],7.9,33.7,true,true,ARRAY['HK416 A5','MR556A1 (civilian)']),

-- ── FN HERSTAL ────────────────────────────────────────────────────────────────
('FN Herstal','FN 509','9mm','Pistol','Semi-Auto',17,2017,false,'USA','Striker-fired result of the MHS competition. Fully optics-ready with FN Low Profile Optic plate system.',649,ARRAY['4.0"'],25.5,7.4,true,true,ARRAY['FN 509 Compact','FN 509 Midsize','FN 509 Tactical','FN 509 LS Edge']),
('FN Herstal','FN 509 Compact','9mm','Pistol','Semi-Auto',12,2018,false,'USA','Compact variant with shorter grip and 3.7" barrel. Optics-ready.',649,ARRAY['3.7"'],24.0,6.8,false,true,NULL),
('FN Herstal','Five-seveN','5.7x28mm','Pistol','Semi-Auto',20,1998,false,'Belgium','Unique delayed-blowback pistol in proprietary 5.7x28mm cartridge. Lightweight polymer construction. Originally military/LEO only.',1399,ARRAY['4.8"'],20.8,8.2,true,true,ARRAY['Five-seveN MRD','Five-seveN Tactical']),
('FN Herstal','FNS-9','9mm','Pistol','Semi-Auto',17,2012,false,'USA','Striker-fired 9mm with ambidextrous controls. Predecessor to the FN 509.',649,ARRAY['4.0"'],25.2,7.3,false,true,NULL),
('FN Herstal','SCAR 16S','5.56 NATO','Rifle','Semi-Auto',30,2009,false,'Belgium','Civilian version of the US SOCOM SCAR-L. Short-stroke piston, folding stock, 16.25" chrome-lined barrel.',3999,ARRAY['16.25"'],7.25,38.5,true,true,ARRAY['SCAR 16S FDE']),
('FN Herstal','SCAR 17S','.308 Win','Rifle','Semi-Auto',20,2009,false,'Belgium','Civilian SCAR-H in .308 Win. Battle rifle quality with folding stock and enhanced recoil system.',4499,ARRAY['16.25"'],8.0,38.0,true,true,ARRAY['SCAR 17S FDE']),
('FN Herstal','FAL (civilian)','.308 Win','Rifle','Semi-Auto',20,1955,false,'Belgium','Semi-auto civilian version of the "right arm of the free world" battle rifle. DSA Inc produces modern variants.',1800,ARRAY['21"'],9.5,43.0,true,true,ARRAY['DSA SA58','FN FAL Type C']),
('FN Herstal','FNX-45','.45 ACP','Pistol','Semi-Auto',15,2009,false,'USA','Full-size DA/SA .45 ACP. 15-round double-stack magazine. Suppressor-ready threaded barrel version available.',899,ARRAY['4.5"'],33.2,7.9,false,true,ARRAY['FNX-45 Tactical']),

-- ── DANIEL DEFENSE ────────────────────────────────────────────────────────────
('Daniel Defense','DDM4 V7','5.56 NATO','Rifle','Semi-Auto',30,2014,false,'USA','Mid-length gas system AR-15 with 16" government profile barrel. MFR 15.0 free-float handguard. Premium quality.',1999,ARRAY['16"'],6.22,35.5,false,true,ARRAY['DDM4 V7 S','DDM4 V7 Pro']),
('Daniel Defense','DDM4 V7 S','5.56 NATO','Rifle','Semi-Auto',30,2015,false,'USA','SBR-length 11.5" barrel DDM4 V7 variant in pistol configuration (no stock).',1999,ARRAY['11.5"'],5.94,26.3,true,true,NULL),
('Daniel Defense','DDM4 V11','5.56 NATO','Rifle','Semi-Auto',30,2016,false,'USA','Mid-length 18" stainless steel barrel for enhanced accuracy. Competition-oriented.',2199,ARRAY['18"'],6.44,38.25,false,false,NULL),
('Daniel Defense','DDM4 PDW','300 Blackout','Rifle','Semi-Auto',30,2019,false,'USA','Compact PDW-style with integrated folding brace, 7" barrel. Suppressor-optimized.',2199,ARRAY['7"'],5.1,20.75,false,false,NULL),
('Daniel Defense','Delta 5','6.5 Creedmoor','Rifle','Bolt',10,2019,false,'USA','Precision bolt-action with AICS-compatible magazine and adjustable stock. DD''s entry into PRS market.',2799,ARRAY['24"','20"'],11.5,44.0,false,false,ARRAY['Delta 5 Pro']),
('Daniel Defense','DD5 V3','.308 Win','Rifle','Semi-Auto',20,2017,false,'USA','AR-10 platform battle rifle. Mid-length gas, 16" CMV barrel. Same quality standards as the DDM4 series.',2999,ARRAY['16"'],8.6,38.5,false,true,ARRAY['DD5 V4','DD5 V5']),

-- ── BARRETT ───────────────────────────────────────────────────────────────────
('Barrett','M82A1','.50 BMG','Rifle','Semi-Auto',10,1989,false,'USA','The original semi-auto .50 BMG rifle. Used by military snipers for anti-materiel and long-range interdiction. Civilian legal in most states.',9000,ARRAY['29"'],32.7,57.0,true,false,ARRAY['M82A1 CQB','M82A2']),
('Barrett','M107A1','.50 BMG','Rifle','Semi-Auto',10,2005,false,'USA','Lightened M82 with titanium and aluminum components. Suppressor-capable. US military standard-issue.',14000,ARRAY['20"','29"'],27.0,57.0,true,false,NULL),
('Barrett','MRAD','.338 Lapua','Rifle','Bolt',10,2011,false,'USA','Multi-caliber precision bolt-action. Folding stock. Converts between .338 Lapua, .300 Win Mag, and others with barrel change.',6000,ARRAY['24.5"','26"'],14.9,47.0,true,false,ARRAY['MRAD .308','MRAD 6.5 Creedmoor']),
('Barrett','M95','.50 BMG','Rifle','Bolt',5,1995,false,'USA','Bullpup bolt-action .50 BMG. More compact than M82 at cost of rate of fire. Single-shot.',5000,ARRAY['29"'],23.5,45.0,true,false,NULL),

-- ── TIKKA ─────────────────────────────────────────────────────────────────────
('Tikka','T3x Lite','6.5 Creedmoor','Rifle','Bolt',3,2016,false,'Finland','Lightweight synthetic-stock bolt-action. Exceptional accuracy for the price. Wide caliber selection.',699,ARRAY['22.4"','24.3"'],6.1,42.5,false,false,ARRAY['T3x Lite Stainless','T3x Lite RoughTech']),
('Tikka','T3x CTR','6.5 Creedmoor','Rifle','Bolt',10,2016,false,'Finland','Compact Tactical Rifle variant with threaded barrel, 10-round AICS magazine, and adjustable stock.',1199,ARRAY['20"','24"'],7.5,42.5,false,false,NULL),
('Tikka','T3x TAC A1','6.5 Creedmoor','Rifle','Bolt',10,2017,false,'Finland','Full tactical bolt-action with folding stock, adjustable comb, chassis system. PRS-competitive.',1999,ARRAY['24"'],11.0,44.0,false,false,ARRAY['T3x TAC A1 .308']),
('Tikka','T1x MTR','.22 LR','Rifle','Bolt',10,2018,false,'Finland','Rimfire trainer with same action feel as T3x. Perfect for training without centerfire costs.',699,ARRAY['20"'],6.2,38.0,false,false,ARRAY['T1x MTR .17 HMR']),

-- ── MOSSBERG ──────────────────────────────────────────────────────────────────
('Mossberg','500','12 Gauge','Shotgun','Pump',5,1960,false,'USA','America''s most popular shotgun. Ambidextrous safety on tang. Used by military, law enforcement, and hunters.',400,ARRAY['18.5"','20"','26"','28"'],7.5,38.5,false,true,ARRAY['500 Persuader','500 ATI Tactical','500 Combo']),
('Mossberg','590','12 Gauge','Shotgun','Pump',8,1987,false,'USA','Heavy-duty version of the 500 with metal trigger guard and safety. The 590A1 is mil-spec.',499,ARRAY['18.5"','20"'],7.25,41.0,true,true,ARRAY['590A1','590 Shockwave','590M']),
('Mossberg','590A1','12 Gauge','Shotgun','Pump',9,1997,false,'USA','Mil-spec 590 with heavy-walled barrel, metal trigger guard, and parkerized finish. Passes MIL-SPEC 3443E.',599,ARRAY['18.5"','20"'],7.5,41.0,true,true,ARRAY['590A1 Retrograde','590A1 SPX']),
('Mossberg','Maverick 88','12 Gauge','Shotgun','Pump',5,1989,false,'USA','Budget-friendly pump shotgun sharing most 500 parts. Economy option for home defense and hunting.',219,ARRAY['18.5"','20"','26"','28"'],7.5,38.5,false,false,ARRAY['Maverick 88 Security']),
('Mossberg','930','12 Gauge','Shotgun','Semi-Auto',7,2005,false,'USA','Gas-operated semi-auto. Popular for 3-Gun competition with 7-round magazine tube.',679,ARRAY['18.5"','24"','26"','28"'],7.75,47.0,false,false,ARRAY['930 SPX','930 Tactical','930 JM Pro']),
('Mossberg','MC1sc','9mm','Pistol','Semi-Auto',6,2019,false,'USA','Mossberg''s first modern centerfire pistol. Sub-compact 9mm for CCW.',409,ARRAY['3.4"'],19.0,6.25,false,false,ARRAY['MC2c','MC2sc']),
('Mossberg','Patriot','.308 Win','Rifle','Bolt',5,2015,false,'USA','Value-priced bolt-action with spiral-fluted bolt and Marinecote weather-resistant finish.',499,ARRAY['22"','24"'],6.5,42.0,false,false,ARRAY['Patriot Predator','Patriot Revere']),

-- ── REMINGTON ─────────────────────────────────────────────────────────────────
('Remington','870','12 Gauge','Shotgun','Pump',4,1950,false,'USA','The best-selling shotgun in American history. Over 11 million produced. Reliable and versatile pump-action.',449,ARRAY['18"','20"','26"','28"'],7.5,49.0,false,true,ARRAY['870 Express','870 Wingmaster','870 Police Magnum','870 Tactical']),
('Remington','870 Express','12 Gauge','Shotgun','Pump',4,1987,false,'USA','Economy version of the 870 with matte finish and hardwood stock.',429,ARRAY['20"','26"','28"'],7.5,49.0,false,false,NULL),
('Remington','1100','12 Gauge','Shotgun','Semi-Auto',4,1963,false,'USA','America''s best-selling autoloading shotgun. Gas-operated with soft-shooting characteristics.',949,ARRAY['26"','28"','30"'],7.6,48.0,false,false,ARRAY['1100 Competition','1100 Sporting','1100 Synthetic']),
('Remington','700 ADL','.308 Win','Rifle','Bolt',4,1962,false,'USA','Entry-level version of the legendary 700 action. Blind magazine (no hinged floorplate), economy stock.',499,ARRAY['24"'],7.3,43.6,false,false,ARRAY['700 ADL Synthetic']),
('Remington','700 BDL','.308 Win','Rifle','Bolt',4,1962,false,'USA','Standard Model 700 with hinged floorplate, higher-grade stock. The foundation for hundreds of custom builds.',799,ARRAY['22"','24"','26"'],7.4,43.6,true,true,ARRAY['700 BDL SS','700 CDL']),
('Remington','700 SPS','.308 Win','Rifle','Bolt',4,2005,false,'USA','Special Purpose Synthetic — weather-resistant matte finish with synthetic stock. Popular as a build base.',649,ARRAY['20"','24"'],7.5,43.6,false,false,ARRAY['700 SPS Tactical','700 SPS Varmint']),
('Remington','783','.308 Win','Rifle','Bolt',4,2013,false,'USA','Economy bolt-action with floating bolt head and user-adjustable trigger. Competes with Savage Axis.',399,ARRAY['22"'],7.0,42.0,false,false,NULL),
('Remington','RP9','9mm','Pistol','Semi-Auto',18,2017,true,'USA','Striker-fired 9mm. Discontinued after Remington bankruptcy. Notable for 18+1 capacity.',329,ARRAY['4.5"'],26.4,7.76,false,false,NULL),

-- ── BENELLI ───────────────────────────────────────────────────────────────────
('Benelli','M4 Tactical','12 Gauge','Shotgun','Semi-Auto',7,1998,false,'Italy','ARGO (Auto Regulating Gas Operated) system. US Marine Corps M1014. Proven combat reliability in austere conditions.',1899,ARRAY['18.5"'],7.8,40.0,true,true,ARRAY['M4 H2O','M4 Pistol Grip']),
('Benelli','M2 Tactical','12 Gauge','Shotgun','Semi-Auto',7,1993,false,'Italy','Inertia-driven semi-auto. Lighter than M4. Popular for 3-Gun and home defense.',1299,ARRAY['18.5"'],6.7,39.75,false,true,ARRAY['M2 Field','M2 Comfortech']),
('Benelli','SuperNova','12 Gauge','Shotgun','Pump',4,2006,false,'Italy','Pump with innovative polymer receiver/stock design. Handles all 12-gauge loads including 3.5" magnums.',549,ARRAY['18.5"','24"','26"','28"'],8.0,47.5,false,false,ARRAY['SuperNova Tactical']),
('Benelli','Nova','12 Gauge','Shotgun','Pump',4,1999,false,'Italy','Monolithic polymer frame pump shotgun. Predecessor to SuperNova. Rugged and reliable.',499,ARRAY['18.5"','24"','26"','28"'],7.2,45.0,false,false,ARRAY['Nova Tactical']),
('Benelli','Super Black Eagle 3','12 Gauge','Shotgun','Semi-Auto',3,2017,false,'Italy','SBE3 — waterfowl hunting flagship. Handles 3.5" magnum shells. Extremely popular among duck/goose hunters.',1799,ARRAY['26"','28"'],7.1,49.6,false,false,ARRAY['SBE3 Left Hand','SBE3 Turkey']),
('Benelli','Ethos','12 Gauge','Shotgun','Semi-Auto',4,2014,false,'Italy','Premium inertia-driven upland hunting shotgun with AA-grade walnut stock.',1799,ARRAY['26"','28"'],6.5,47.5,false,false,ARRAY['Ethos Cordoba','Ethos Sport']),

-- ── SAVAGE ARMS ───────────────────────────────────────────────────────────────
('Savage Arms','110','.308 Win','Rifle','Bolt',4,1958,false,'USA','Foundation of Savage''s bolt-action line. AccuTrigger adjustable trigger. Floating bolt head for accuracy.',699,ARRAY['22"','24"'],6.5,43.25,false,false,ARRAY['110 FP','110 Tactical','110 Elite Precision','110 Storm']),
('Savage Arms','110 Elite Precision','.308 Win','Rifle','Bolt',10,2019,false,'USA','PRS-ready precision bolt-action with AICS magazine, adjustable stock, and threaded barrel.',1599,ARRAY['26"'],10.8,47.5,false,false,ARRAY['110 Apex Hunter','110 Precision']),
('Savage Arms','Axis','.308 Win','Rifle','Bolt',4,2011,false,'USA','Budget-friendly bolt-action. AccuTrigger not standard (AccuFit stock on newer models). Value pick.',379,ARRAY['22"'],6.5,42.0,false,false,ARRAY['Axis II','Axis XP (with scope)']),
('Savage Arms','Mark II','.22 LR','Rifle','Bolt',10,1996,false,'USA','Quality rimfire bolt-action with adjustable AccuTrigger. 10-round detachable magazine.',349,ARRAY['21"'],5.0,39.5,false,false,ARRAY['Mark II FV','Mark II BV','Mark II TR']),
('Savage Arms','A22','.22 LR','Rifle','Semi-Auto',10,2016,false,'USA','Semi-automatic .22 with delayed-blowback system. 10-round detachable rotary magazine.',329,ARRAY['22"'],5.4,41.0,false,false,ARRAY['A22 Magnum','A22 Pro Varmint']),
('Savage Arms','64','.22 LR','Rifle','Semi-Auto',10,1996,false,'USA','Economy semi-auto .22. 10-round detachable box magazine. Simple and reliable.',219,ARRAY['20.25"'],5.0,39.5,false,false,NULL),

-- ── HENRY REPEATING ARMS ──────────────────────────────────────────────────────
('Henry Repeating Arms','Big Boy','.357 Magnum','Rifle','Lever',10,2004,false,'USA','Brass-receiver lever-action in pistol calibers (.357 Mag, .44 Mag, .45 Colt). Polished brass and walnut.',899,ARRAY['20"'],8.68,38.5,false,false,ARRAY['Big Boy Steel','Big Boy X Model','Big Boy All-Weather']),
('Henry Repeating Arms','Big Boy Steel','.357 Magnum','Rifle','Lever',10,2016,false,'USA','Blued steel receiver version of the Big Boy. More subdued look for hunting.',929,ARRAY['20"'],7.0,38.5,false,false,NULL),
('Henry Repeating Arms','Golden Boy','.22 LR','Rifle','Lever',16,1999,false,'USA','Brass-receiver .22 lever-action. Traditional American styling. Octagon barrel.',499,ARRAY['20"'],6.75,38.5,false,false,ARRAY['Golden Boy Silver','Golden Boy Wildlife']),
('Henry Repeating Arms','H001','.22 LR','Rifle','Lever',15,1997,false,'USA','Classic .22 lever-action with walnut stock and blued finish. Entry-level American lever gun.',399,ARRAY['18.25"'],5.5,34.0,false,false,NULL),
('Henry Repeating Arms','Big Boy 45-70','.45-70 Govt','Rifle','Lever',4,2017,false,'USA','Steel lever-action in the classic .45-70 Government cartridge. Excellent for hogs and large game.',929,ARRAY['20"'],7.0,38.5,false,false,ARRAY['Side Gate .45-70']),
('Henry Repeating Arms','Long Ranger','.308 Win','Rifle','Lever',4,2016,false,'USA','Centerfire lever-action with detachable box magazine and rifle-style bolt. Drilled and tapped for scope.',1019,ARRAY['20"'],6.75,42.5,false,false,ARRAY['Long Ranger .243','Long Ranger .223']),
('Henry Repeating Arms','X Model','.45-70 Govt','Rifle','Lever',4,2019,false,'USA','Modern tactical version with AR-style furniture, threaded barrel, and scout scope rail.',1069,ARRAY['19.8"'],7.4,36.25,false,false,ARRAY['X Model .357','X Model .44 Mag']),

-- ── TAURUS ────────────────────────────────────────────────────────────────────
('Taurus','G2c','9mm','Pistol','Semi-Auto',12,2017,false,'Brazil','Budget-friendly compact 9mm with manual safety. 12+1 capacity. One of the best-selling value handguns.',299,ARRAY['3.2"'],22.0,6.24,false,false,ARRAY['G2s','G3c']),
('Taurus','G3c','9mm','Pistol','Semi-Auto',12,2020,false,'Brazil','Upgraded G2c with improved trigger, restrike capability, and front slide serrations.',349,ARRAY['3.2"'],22.0,6.24,false,false,ARRAY['G3c+ (13-round)']),
('Taurus','G3','9mm','Pistol','Semi-Auto',15,2019,false,'Brazil','Full-size version of the G-series. 15+1 capacity with striker-fired action.',349,ARRAY['4.0"'],24.0,7.28,false,false,ARRAY['G3 TORO (optics ready)']),
('Taurus','Judge','.410/.45 Colt','Pistol','Revolver',5,2006,false,'Brazil','Unique revolver firing .410 shotgun shells or .45 Colt. Home defense novelty. 3" or 6.5" barrel.',549,ARRAY['3"','6.5"'],29.0,9.5,false,false,ARRAY['Public Defender','Circuit Judge (rifle)']),
('Taurus','856','.38 Special','Pistol','Revolver',6,2018,false,'Brazil','6-shot .38 Special +P revolver at competitive price. Alloy or steel frame options.',379,ARRAY['2"','3"','4"'],17.0,6.5,false,false,ARRAY['856 Ultra-Lite']),
('Taurus','TX22','.22 LR','Pistol','Semi-Auto',16,2019,false,'Brazil','16+1 .22 LR semi-auto at budget price. SA trigger, optics-ready variant available.',399,ARRAY['4.1"'],17.3,7.06,false,false,ARRAY['TX22 Competition']),
('Taurus','692','.357 Magnum','Pistol','Revolver',7,2019,false,'Brazil','7-shot .357 Magnum DA/SA with interchangeable cylinder for 9mm. Unique dual-caliber design.',649,ARRAY['3"','6.5"'],33.0,8.0,false,false,NULL),
('Taurus','Raging Hunter','.44 Magnum','Pistol','Revolver',6,2018,false,'Brazil','Large-frame hunting revolver with ported barrel and Picatinny rail for optic.',999,ARRAY['5.12"','6.75"','8.37"'],55.0,12.0,false,false,ARRAY['Raging Hunter .460']),

-- ── CZ ────────────────────────────────────────────────────────────────────────
('CZ','CZ 75B','9mm','Pistol','Semi-Auto',16,1975,false,'Czech Republic','Classic DA/SA pistol. Short-reset trigger. Steel frame. One of the most copied pistol designs in history.',699,ARRAY['4.6"'],35.3,8.1,false,true,ARRAY['CZ 75 SP-01','CZ 75 Compact','CZ 75 PCR']),
('CZ','CZ P-10C','9mm','Pistol','Semi-Auto',15,2016,false,'Czech Republic','Striker-fired compact. Excellent trigger with short reset. Growing competition to Glock G19.',549,ARRAY['4.02"'],26.0,7.28,false,true,ARRAY['P-10 F','P-10 S','P-10 F OR','P-10 C OR']),
('CZ','CZ P-10F','9mm','Pistol','Semi-Auto',19,2017,false,'Czech Republic','Full-size P-10 variant. 19+1 capacity. Optics-ready variant standard.',599,ARRAY['4.5"'],28.2,7.96,false,true,NULL),
('CZ','Shadow 2','9mm','Pistol','Semi-Auto',17,2016,false,'Czech Republic','Competition DA/SA pistol with all-steel frame, extended controls, and outstanding trigger. IPSC Production champion.',1299,ARRAY['4.89"'],46.0,8.53,false,false,ARRAY['Shadow 2 Compact','Shadow 2 OR','Shadow 2 Optics Ready']),
('CZ','Scorpion EVO 3','9mm','Rifle','Semi-Auto',20,2015,false,'Czech Republic','Pistol-caliber carbine based on the Czech military Scorpion SMG. Folding stock, low felt recoil.',999,ARRAY['7.72"','16.2"'],5.0,26.5,true,true,ARRAY['Scorpion S1 Pistol','Scorpion Micro S1']),
('CZ','527','.223 Rem','Rifle','Bolt',5,1992,false,'Czech Republic','Mini-Mauser action bolt-rifle in .223 Rem and other small calibers. Integral scope base. Field-proven accuracy.',749,ARRAY['21.9"'],6.2,42.0,false,false,ARRAY['527 Carbine','527 American','527 Varmint']),

-- ── WALTHER ───────────────────────────────────────────────────────────────────
('Walther','PDP','9mm','Pistol','Semi-Auto',18,2021,false,'Germany','Performance Duty Pistol. 1,000-hour corrosion resistance. Optics-ready standard with Performance Trigger.',699,ARRAY['4.0"','4.5"','5.0"'],25.4,7.4,false,true,ARRAY['PDP Compact','PDP Full Size','PDP F-Series']),
('Walther','PPQ M2','9mm','Pistol','Semi-Auto',15,2013,false,'Germany','Paddle or button mag release. Quick Defense Trigger. Outstanding ergonomics and accuracy.',699,ARRAY['4.0"','5.0"'],23.0,7.1,false,false,ARRAY['PPQ M2 5"','PPQ SC']),
('Walther','PPK/S','.380 ACP','Pistol','Semi-Auto',7,1930,false,'Germany','Iconic DA/SA pocket pistol. Carried by James Bond. Double-action first shot, SA subsequent.',849,ARRAY['3.35"'],20.8,6.1,false,false,ARRAY['PPK','.32 ACP variant']),
('Walther','PPS M2','9mm','Pistol','Semi-Auto',7,2013,false,'Germany','Single-stack slim CCW 9mm. 7+1 or 6+1 magazines. German engineering for concealed carry.',629,ARRAY['3.18"'],19.4,6.3,false,false,NULL),
('Walther','Creed','9mm','Pistol','Semi-Auto',16,2016,false,'Germany','Value-tier Walther with internal extractor and ambidextrous controls. Budget-friendly entry.',399,ARRAY['4.0"'],27.2,7.2,false,false,NULL),

-- ── KIMBER ────────────────────────────────────────────────────────────────────
('Kimber','Custom II','.45 ACP','Pistol','Semi-Auto',7,1996,false,'USA','Standard 5" 1911 with Kimber''s improved fitment. Match-grade barrel and bushing.',829,ARRAY['5.0"'],38.0,8.7,false,false,ARRAY['Custom II Two-Tone','Stainless II']),
('Kimber','Pro Carry II','.45 ACP','Pistol','Semi-Auto',7,1996,false,'USA','Commander-size 4" barrel on full-size frame. Popular carry option with aluminum frame.',949,ARRAY['4.0"'],28.0,7.7,false,false,ARRAY['Pro Carry HD II']),
('Kimber','Ultra Carry II','.45 ACP','Pistol','Semi-Auto',7,1999,false,'USA','3" barrel 1911 on aluminum frame. Compact carry without sacrificing .45 ACP power.',1049,ARRAY['3.0"'],25.0,6.8,false,false,NULL),
('Kimber','Micro 9','9mm','Pistol','Semi-Auto',7,2015,false,'USA','1911-style micro-compact 9mm. Single-action, external hammer, manual safety. Carry version with Crimson Trace lasers available.',699,ARRAY['3.15"'],15.6,6.1,false,false,ARRAY['Micro 9 CDP','Micro 9 Stainless']),
('Kimber','Raptor II','.45 ACP','Pistol','Semi-Auto',8,2004,false,'USA','5" 1911 with distinctive scale-pattern serrations and Zebra wood grips. Aesthetically striking.',1249,ARRAY['5.0"'],38.0,8.7,false,false,ARRAY['Pro Raptor II','Ultra Raptor II']),

-- ── CANIK ─────────────────────────────────────────────────────────────────────
('Canik','TP9SF','9mm','Pistol','Semi-Auto',18,2014,false,'Turkey','Single-frame striker-fired 9mm. 18+1 capacity. Excellent trigger quality at mid-tier price.',399,ARRAY['4.46"'],28.2,7.7,false,false,ARRAY['TP9SFx','TP9SA','TP9SF Elite']),
('Canik','TP9SFx','9mm','Pistol','Semi-Auto',20,2018,false,'Turkey','Competition-oriented TP9 with longer slide, fiber optic sights, and competition-grade trigger.',499,ARRAY['5.2"'],29.1,8.3,false,false,NULL),
('Canik','METE SFT','9mm','Pistol','Semi-Auto',18,2021,false,'Turkey','Upgraded series with improved ergonomics, optics-ready, and Picatinny rail.',499,ARRAY['4.46"'],24.3,7.5,false,false,ARRAY['METE MC9','METE SC']),

-- ── IWI ───────────────────────────────────────────────────────────────────────
('IWI','Tavor X95','5.56 NATO','Rifle','Semi-Auto',30,2016,false,'Israel','Bullpup design. Full 16.5" barrel in compact overall length. Used by IDF. Ambidextrous bolt release and ejection port.',1999,ARRAY['16.5"','18.6"'],7.9,26.1,true,false,ARRAY['X95 9mm','X95 .300 BLK']),
('IWI','Tavor 7','.308 Win','Rifle','Semi-Auto',20,2018,false,'Israel','Bullpup .308/7.62 NATO. 16.5" barrel in an overall length of 26". Ambidextrous in all controls.',2199,ARRAY['16.5"'],10.6,26.1,true,false,NULL),
('IWI','Galil ACE','.308 Win','Rifle','Semi-Auto',20,2013,false,'Israel','Modernized Galil in .308 Win. Folding side-folding stock. Cold-hammer-forged barrel.',1999,ARRAY['16"','20"'],8.7,35.5,true,false,ARRAY['Galil ACE 5.56','Galil ACE 7.62x39']),
('IWI','Masada','9mm','Pistol','Semi-Auto',17,2019,false,'Israel','Striker-fired polymer pistol. Optics-ready standard. IDF current service pistol.',499,ARRAY['4.1"'],25.4,7.2,true,true,ARRAY['Masada Slim']),
('IWI','Zion-15','5.56 NATO','Rifle','Semi-Auto',30,2021,false,'USA','IWI US-made AR-15. Mid-length gas, 16" CMV barrel. Competitive quality at mid-tier pricing.',849,ARRAY['16"'],6.7,32.5,false,false,NULL),

-- ── LEVER ACTIONS (Various) ────────────────────────────────────────────────────
('Winchester Repeating Arms','Model 1873','.357 Magnum','Rifle','Lever',10,1873,false,'Japan','The "Gun That Won The West." Original design 1873, currently manufactured by Miroku in Japan. Pistol-caliber lever-action.',1399,ARRAY['20"','24"'],7.5,39.5,false,false,ARRAY['1873 Short Rifle','1873 Carbine','1873 Deluxe']),
('Winchester Repeating Arms','Model 1894','.30-30 Win','Rifle','Lever',8,1894,false,'Japan','The most popular deer hunting cartridge/rifle combination in North America for over 100 years.',1299,ARRAY['20"','24"'],6.5,41.75,false,false,ARRAY['1894 Short Rifle','1894 Trails End','1894 Ranger']),
('Winchester Repeating Arms','Model 70','.308 Win','Rifle','Bolt',5,1936,false,'USA','The "Rifleman''s Rifle." Pre-64 versions are highly collectible. Post-2008 versions regain original quality with controlled round feed.',1099,ARRAY['22"','24"','26"'],7.25,42.0,true,true,ARRAY['Model 70 Super Grade','Model 70 Featherweight','Model 70 Extreme Weather']),
('Marlin','Model 336','.30-30 Win','Rifle','Lever',6,1948,false,'USA','Classic American lever-action in .30-30. Now manufactured by Ruger. Rebored solid-top receiver.',829,ARRAY['20"'],7.0,38.25,false,false,ARRAY['336 Dark','336 Trapper','336W']),
('Marlin','Model 1895','.45-70 Govt','Rifle','Lever',4,1895,false,'USA','Lever-action in the powerful .45-70 Govt. Popular for bear country carry and large dangerous game.',899,ARRAY['18.5"','22"'],7.5,40.5,false,false,ARRAY['1895 SBL','1895 Trapper','1895 Dark']),
('Marlin','Model 1894','.357 Magnum','Rifle','Lever',9,1969,false,'USA','Pistol-caliber lever-action sharing ammo with .357 revolvers. Compact carbine length.',949,ARRAY['18.5"'],6.0,36.25,false,false,ARRAY['1894 Classic','1894 CST','1894 Dark Series']),

-- ── PRECISION / COMPETITION RIFLES ─────────────────────────────────────────────
('Accuracy International','AXMC','.338 Lapua','Rifle','Bolt',10,2011,false,'UK','The standard for military and police sniper rifles globally. Multi-caliber chassis, folding stock.',9000,ARRAY['27"'],14.3,50.0,true,true,ARRAY['AXMC .308','AXMC .300 Win Mag']),
('Accuracy International','AX308','.308 Win','Rifle','Bolt',10,2007,false,'UK','Single-caliber AXMC in .308 Win. Used by dozens of military and police units.',6500,ARRAY['24"'],13.9,47.0,true,true,NULL),
('Desert Tech','SRS A2','6.5 Creedmoor','Rifle','Bolt',5,2017,false,'USA','Top-tier bullpup bolt-action precision rifle. Highly compact for the barrel length. PRS competition use.',4599,ARRAY['24"','26"'],9.9,34.0,false,false,ARRAY['SRS A2 Covert','SRS A2 Sport']),
('Desert Tech','MDRX','5.56 NATO','Rifle','Semi-Auto',30,2015,false,'USA','Bullpup semi-auto with forward ejection system. Fully ambidextrous without modification.',1999,ARRAY['16"'],8.2,27.0,false,false,ARRAY['MDRX 7.62','MDRX .300 BLK']),
('Christensen Arms','MPR','6.5 Creedmoor','Rifle','Bolt',5,2018,false,'USA','Modern Precision Rifle with carbon fiber barrel and stock. Sub-MOA guarantee.',1799,ARRAY['20"','24"','26"'],6.5,47.0,false,false,ARRAY['MPR .308','MPR 6mm Creedmoor']),
('Christensen Arms','Mesa','6.5 Creedmoor','Rifle','Bolt',4,2016,false,'USA','Hunting bolt-action with carbon fiber wrapped barrel. Lightweight for field use.',1299,ARRAY['22"','24"'],6.0,44.5,false,false,ARRAY['Mesa Long Range','Mesa FFT']),

-- ── AR PLATFORM (BCM, LWRC, PSA) ─────────────────────────────────────────────
('BCM','RECCE-16','5.56 NATO','Rifle','Semi-Auto',30,2010,false,'USA','16" mid-length BCM AR-15. Enhanced bolt carrier group, BCM Gunfighter furniture. Reliable duty rifle.',1399,ARRAY['16"'],6.5,32.5,false,true,ARRAY['RECCE-16 MCMR','RECCE-14 KMR']),
('BCM','RECCE-14','5.56 NATO','Rifle','Semi-Auto',30,2011,false,'USA','14.5" mid-length with permanently attached muzzle device. Carbine-length with mid-length gas benefits.',1399,ARRAY['14.5"'],6.7,31.5,false,true,NULL),
('LWRC International','IC-A5','5.56 NATO','Rifle','Semi-Auto',30,2015,false,'USA','Individual Carbine — piston-driven AR-15. Enhanced nickel-boron BCG, ambidextrous lower, spiral-fluted barrel.',2299,ARRAY['14.7"','16.1"'],7.3,35.5,false,true,ARRAY['IC-A5 SPR','IC-DI']),
('CMMG','Banshee 9mm','9mm','Rifle','Semi-Auto',33,2018,false,'USA','RADIAL Delayed Blowback 9mm pistol caliber carbine. Compatible with Glock magazines. 8" barrel.',1299,ARRAY['5"','8"','16"'],5.8,22.3,false,false,ARRAY['Banshee .45 ACP','Banshee .300 BLK','Banshee 10mm']),
('Palmetto State Armory','PA-15','5.56 NATO','Rifle','Semi-Auto',30,2009,false,'USA','Budget-friendly AR-15. Mil-spec parts. Great value option for first AR purchase.',699,ARRAY['16"','18"','20"'],6.0,32.0,false,false,ARRAY['PA-15 M4','PA-15 Freedom','PA-10 (.308)']),
('Aero Precision','M4E1','5.56 NATO','Rifle','Semi-Auto',30,2013,false,'USA','Enhanced AR-15 lower with integrated trigger guard and improved aesthetics. ATLAS handguard.',949,ARRAY['16"','18"','20"'],6.5,34.0,false,false,ARRAY['M4E1 Enhanced','M4E1 16" Complete']),

-- ── STEYR ─────────────────────────────────────────────────────────────────────
('Steyr Arms','AUG A3 M1','5.56 NATO','Rifle','Semi-Auto',30,1978,false,'Austria','Bullpup semi-auto. Austrian military StG77. 16" barrel in 28.15" overall length. Picatinny rail version.',1999,ARRAY['16"','20"'],7.9,28.15,true,true,ARRAY['AUG A3 SA USA','AUG A1','AUG Para 9mm']),
('Steyr Arms','Scout','.308 Win','Rifle','Bolt',5,1998,false,'Austria','Jeff Cooper''s Scout rifle concept made real. Bi-pod integral to stock, forward scope mount, package concept.',1299,ARRAY['19"'],6.6,38.6,false,false,ARRAY['Scout .223','Scout .376 Steyr']),
('Steyr Arms','Pro Hunter','.308 Win','Rifle','Bolt',4,2005,false,'Austria','Cold-hammer-forged barrel with Mannlicher SBS98 action. Hunting rifle with interchangeable stock.',949,ARRAY['23.6"'],7.5,44.5,false,false,NULL),

-- ── WILSON COMBAT & NIGHTHAWK ─────────────────────────────────────────────────
('Wilson Combat','EDC X9','9mm','Pistol','Semi-Auto',15,2017,false,'USA','High-capacity 2011-format 9mm. Double-stack 1911 for everyday carry. World-class trigger at world-class price.',2995,ARRAY['4.0"'],29.0,7.7,false,false,ARRAY['EDC X9L','EDC X9S']),
('Wilson Combat','Protector','.45 ACP','Pistol','Semi-Auto',7,2000,false,'USA','Compact carry 1911. 4" barrel, lightweight aluminum frame. Flush-cut crown barrel.',2695,ARRAY['4.0"'],27.3,7.7,false,false,NULL),
('Wilson Combat','CQB','.45 ACP','Pistol','Semi-Auto',8,1995,false,'USA','Close Quarters Battle 1911. Standard 5" full-size with Wilson''s signature hand-fitting.',2795,ARRAY['5.0"'],38.0,8.65,false,false,ARRAY['CQB Elite','CQB Compact']),
('Nighthawk Custom','Agent 2','9mm','Pistol','Semi-Auto',17,2019,false,'USA','2011-format doublestack 9mm built by a single gunsmith. Best-in-class trigger and fit.',3999,ARRAY['5.0"'],37.0,8.7,false,false,NULL),
('Nighthawk Custom','GRP','.45 ACP','Pistol','Semi-Auto',8,2004,false,'USA','Government Recon Pistol. Full-size 1911. Hand-fitted by one gunsmith start to finish.',3299,ARRAY['5.0"'],38.5,8.7,false,false,ARRAY['GRP Recon']),

-- ── MISC / SPECIALTY ──────────────────────────────────────────────────────────
('Staccato','Staccato P','9mm','Pistol','Semi-Auto',20,2020,false,'USA','2011 format 9mm. Full-size with 4.4" barrel. Used by LAPD SWAT, FBI HRT, and Delta Force.',2999,ARRAY['4.4"','5.4"'],28.5,7.8,true,true,ARRAY['Staccato P DUO','Staccato P Optic']),
('Staccato','Staccato C2','9mm','Pistol','Semi-Auto',15,2021,false,'USA','Compact 2011. 3.9" barrel on abbreviated grip. For carry use by serious shooters.',2699,ARRAY['3.9"'],24.5,7.3,false,true,NULL),
('Staccato','Staccato XC','9mm','Pistol','Semi-Auto',17,2018,false,'USA','Competition 2011 with 5" compensated barrel and optics cut. Open division ready.',3999,ARRAY['5.0"'],40.0,9.1,false,false,NULL),
('Magnum Research','Desert Eagle','.50 AE','Pistol','Semi-Auto',7,1983,false,'Israel','Gas-operated rotating-barrel semi-auto. One of the most recognizable handguns worldwide. Also in .44 Mag and .357 Mag.',1899,ARRAY['6.0"','10.0"'],72.0,10.75,false,false,ARRAY['Desert Eagle .44 Mag','Desert Eagle .357 Mag','DE Mark XIX']),
('Ruger','Super Blackhawk','.44 Magnum','Pistol','Revolver',6,1959,false,'USA','Single-action .44 Magnum revolver. Heavy-duty unfluted cylinder. Hunting and outdoor use.',819,ARRAY['4.62"','5.5"','7.5"','10.5"'],48.0,13.0,false,false,ARRAY['Super Blackhawk Hunter']),
('Smith & Wesson','460 XVR','.460 S&W','Pistol','Revolver',5,2005,false,'USA','X-frame .460 S&W Magnum — one of the most powerful production revolvers. 5-shot cylinder.',1549,ARRAY['8.375"','10.5"'],72.5,15.0,false,false,NULL),
('Rock River Arms','LAR-15','5.56 NATO','Rifle','Semi-Auto',30,1996,false,'USA','Direct-impingement AR-15 with National Match features. Mid-western quality.',999,ARRAY['16"','18"','20"'],7.0,35.0,false,false,ARRAY['LAR-15 Entry Tactical','LAR-15M']),
('Zastava Arms','ZPAP M70','7.62x39mm','Rifle','Semi-Auto',30,2019,false,'Serbia','Serbian AK in the original M70 pattern. Milled/stamped receiver options. Chrome-lined bore. High quality import.',999,ARRAY['16.3"'],7.9,34.5,false,false,ARRAY['ZPAP M92 (pistol)','ZPAP M91 (7.62x54R)']),
('Arsenal Inc','SLR-107FR','7.62x39mm','Rifle','Semi-Auto',30,2012,false,'Bulgaria','Milled receiver Bulgarian AK-47 clone. One of the most faithful AKM reproductions available in the US.',1099,ARRAY['16.25"'],8.2,36.5,false,false,ARRAY['SLR-106 (5.56)','SAM7SF (milled)']),
('IWI','Micro Tavor (MTAR) X95','9mm','Rifle','Semi-Auto',30,2016,false,'Israel','X95 converted to 9mm with dedicated barrel/magazine. Same compact bullpup package.',2099,ARRAY['16.5"'],7.9,26.1,false,false,NULL)

ON CONFLICT (make, model) DO NOTHING;
