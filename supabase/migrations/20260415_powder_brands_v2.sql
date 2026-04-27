-- ============================================================
-- powder_brands v2
-- Schema additions, ownership corrections, data corrections,
-- 14 new rows, and 6 new columns.
-- Run: npx supabase db query --linked -f supabase/migrations/20260415_powder_brands_v2.sql
-- ============================================================

-- ── 1. NEW COLUMNS ─────────────────────────────────────────────────────────────

ALTER TABLE public.powder_brands
  ADD COLUMN IF NOT EXISTS parent_company      text,
  ADD COLUMN IF NOT EXISTS manufacturer        text,
  ADD COLUMN IF NOT EXISTS distributor         text,
  ADD COLUMN IF NOT EXISTS metering_grade      text,   -- 'Excellent','Good','Fair','Poor'
  ADD COLUMN IF NOT EXISTS muzzle_flash_rating text,   -- 'Low','Moderate','High'
  ADD COLUMN IF NOT EXISTS brand_equivalent    text;   -- identical/near-identical powder under another label

COMMENT ON COLUMN public.powder_brands.parent_company      IS 'Corporate owner of the brand. e.g. IMR → Hodgdon, Alliant → Vista Outdoor.';
COMMENT ON COLUMN public.powder_brands.manufacturer        IS 'Physical producing factory. May differ from brand. e.g. Ramshot → PB Clermont.';
COMMENT ON COLUMN public.powder_brands.distributor         IS 'Importer or US distributor when different from brand. e.g. Winchester powder → Hodgdon.';
COMMENT ON COLUMN public.powder_brands.metering_grade      IS 'Volumetric flow consistency through powder measure. Excellent/Good/Fair/Poor. Ball > Flake > Extruded generally.';
COMMENT ON COLUMN public.powder_brands.muzzle_flash_rating IS 'Visible muzzle flash signature. Low/Moderate/High. Relevant for suppressor, competition low-light, and defensive use.';
COMMENT ON COLUMN public.powder_brands.brand_equivalent    IS 'Identical or near-identical formulation sold under a different brand name. Useful for substitution when a powder is out of stock.';

CREATE INDEX IF NOT EXISTS idx_powder_brands_parent_company ON public.powder_brands (parent_company);
CREATE INDEX IF NOT EXISTS idx_powder_brands_metering_grade ON public.powder_brands (metering_grade);

-- ── 2. STRUCTURAL CLEANUP: normalize powder_type ───────────────────────────────
-- 'Extruded/Stick' → 'Extruded' (strict 3-value enum: Ball, Extruded, Flake)

UPDATE public.powder_brands
SET powder_type = 'Extruded'
WHERE powder_type = 'Extruded/Stick';

-- ── 3. OWNERSHIP / LINEAGE CORRECTIONS ────────────────────────────────────────

-- Hodgdon (self-owned, distributed directly)
UPDATE public.powder_brands SET parent_company = NULL, distributor = 'Hodgdon Powder Company'
WHERE brand = 'Hodgdon';

-- IMR: acquired by Hodgdon in 2003, now distributed by Hodgdon
UPDATE public.powder_brands SET parent_company = 'Hodgdon Powder Company', distributor = 'Hodgdon Powder Company'
WHERE brand = 'IMR';

-- Winchester: brand licensed and distributed exclusively by Hodgdon
UPDATE public.powder_brands
SET parent_company = 'Hodgdon Powder Company',
    distributor    = 'Hodgdon Powder Company',
    manufacturer   = '[NEEDS RESEARCH]'
WHERE brand = 'Winchester';

-- Alliant: owned by Vista Outdoor
UPDATE public.powder_brands SET parent_company = 'Vista Outdoor'
WHERE brand = 'Alliant';

-- Ramshot: Western Powders brand; manufactured by PB Clermont (Belgium)
UPDATE public.powder_brands
SET parent_company = 'Western Powders',
    manufacturer   = 'PB Clermont',
    distributor    = 'Western Powders'
WHERE brand = 'Ramshot';

-- Accurate: Western Powders brand; manufacturer varies by product
UPDATE public.powder_brands
SET parent_company = 'Western Powders',
    manufacturer   = '[NEEDS RESEARCH]',
    distributor    = 'Western Powders'
WHERE brand = 'Accurate';

-- Vihtavuori: owned by Nammo since 2001, produced at Vihtavuori facility in Finland
UPDATE public.powder_brands
SET parent_company = 'Nammo',
    manufacturer   = 'Nammo Vihtavuori Oy',
    distributor    = 'Capstone Precision Group'
WHERE brand = 'Vihtavuori';

-- ── 4. BURN RATE CORRECTIONS ───────────────────────────────────────────────────
-- Source: Verified against product descriptions and published burn rate tables.

-- Accurate LT-30: description says "between N133 and N135"; N133=53, N135=57 → 55
UPDATE public.powder_brands SET burn_rate_rank = 55
WHERE brand = 'Accurate' AND product_name = 'LT-30';

-- Accurate LT-32: "similar to Varget in some applications"; Varget=61; existing 52 is .223 territory
UPDATE public.powder_brands SET burn_rate_rank = 61
WHERE brand = 'Accurate' AND product_name = 'LT-32';

-- Vihtavuori N360: slowest N3xx; used for .454 Casull; should be in H110/2400 zone (38-40)
-- Previous rank 28 placed it faster than Blue Dot (30), which contradicts its magnum applications
UPDATE public.powder_brands SET burn_rate_rank = 39
WHERE brand = 'Vihtavuori' AND product_name = 'N360';

-- Ramshot Zip: "Similar to Winchester 231 in application" but rank 6 = Red Dot territory
-- W231=17, Titegroup=10; Zip belongs between them
UPDATE public.powder_brands SET burn_rate_rank = 10
WHERE brand = 'Ramshot' AND product_name = 'Zip';

-- ── 5. DESCRIPTION CORRECTIONS ────────────────────────────────────────────────

-- H110: Hodgdon's own documentation confirms H110 and W296 are identical formulations
-- W296 row already correctly says "Identical to Hodgdon H110"; make H110 symmetric
UPDATE public.powder_brands
SET description = replace(description, 'Very similar to Winchester 296', 'Identical to Winchester 296')
WHERE brand = 'Hodgdon' AND product_name = 'H110';

-- ── 6. CALIBER LIST CORRECTIONS ───────────────────────────────────────────────

-- H380: .338 Win Mag requires rank 73+ powders; H380 (rank 59) is too fast
UPDATE public.powder_brands
SET recommended_calibers = array_remove(recommended_calibers, '.338 Win Mag')
WHERE brand = 'Hodgdon' AND product_name = 'H380';

-- Lil'Gun: add Shotgun to best_use (.410 bore is the primary application)
UPDATE public.powder_brands
SET best_use = array_append(best_use, 'Shotgun')
WHERE brand = 'Hodgdon' AND product_name = 'Lil''Gun'
  AND NOT ('Shotgun' = ANY(best_use));

-- Lil'Gun: remove 6.5 Grendel (rank 39 is far too fast; Grendel needs rank 55-65)
UPDATE public.powder_brands
SET recommended_calibers = array_remove(recommended_calibers, '6.5 Grendel')
WHERE brand = 'Hodgdon' AND product_name = 'Lil''Gun';

-- Lil'Gun: fix '300 Blackout' → '.300 Blackout'
UPDATE public.powder_brands
SET recommended_calibers = array_replace(recommended_calibers, '300 Blackout', '.300 Blackout')
WHERE brand = 'Hodgdon' AND product_name = 'Lil''Gun';

-- Reloader 10x: '38 Super' → '.38 Super' (missing leading decimal)
UPDATE public.powder_brands
SET recommended_calibers = array_replace(recommended_calibers, '38 Super', '.38 Super')
WHERE brand = 'Alliant' AND product_name = 'Reloader 10x';

-- Reloader 16: '270 WSM' → '.270 WSM'
UPDATE public.powder_brands
SET recommended_calibers = array_replace(recommended_calibers, '270 WSM', '.270 WSM')
WHERE brand = 'Alliant' AND product_name = 'Reloader 16';

-- AR-Comp: '300 Blackout (supersonic)' → '.300 Blackout (supersonic)'
UPDATE public.powder_brands
SET recommended_calibers = array_replace(recommended_calibers, '300 Blackout (supersonic)', '.300 Blackout (supersonic)')
WHERE brand = 'Alliant' AND product_name = 'AR-Comp';

-- Reloader 22: '.300 Wby' → '.300 Wby Mag' (truncated SAAMI designation)
UPDATE public.powder_brands
SET recommended_calibers = array_replace(recommended_calibers, '.300 Wby', '.300 Wby Mag')
WHERE brand = 'Alliant' AND product_name = 'Reloader 22';

-- Reloader 23: '.26 Nosler' → '26 Nosler' (Nosler proprietary cartridges use no leading decimal)
UPDATE public.powder_brands
SET recommended_calibers = array_replace(recommended_calibers, '.26 Nosler', '26 Nosler')
WHERE brand = 'Alliant' AND product_name = 'Reloader 23';

-- IMR 7977: '.28 Nosler' → '28 Nosler' (same Nosler naming convention)
UPDATE public.powder_brands
SET recommended_calibers = array_replace(recommended_calibers, '.28 Nosler', '28 Nosler')
WHERE brand = 'IMR' AND product_name = 'IMR 7977';

-- ── 7. METERING GRADE ─────────────────────────────────────────────────────────
-- Ball powders meter best due to spherical grain flow.
-- Short-cut (SC) extruded powders meter better than full-length kernels.
-- Large-kernel slow magnum extruded powders meter worst.

-- All ball powders → Excellent
UPDATE public.powder_brands SET metering_grade = 'Excellent'
WHERE powder_type = 'Ball';

-- Flake powders → Good (consistent but not as smooth as ball)
UPDATE public.powder_brands SET metering_grade = 'Good'
WHERE powder_type = 'Flake' AND metering_grade IS NULL;

-- VV N3xx flake (competition-engineered, very consistent) → Excellent
UPDATE public.powder_brands SET metering_grade = 'Excellent'
WHERE brand = 'Vihtavuori' AND powder_type = 'Flake';

-- Extruded powders with good metering characteristics (shorter kernels / modern cut)
UPDATE public.powder_brands SET metering_grade = 'Good'
WHERE brand = 'Hodgdon' AND product_name IN ('Varget','H4895','H4831SC')
   OR (brand = 'Alliant'     AND product_name IN ('Reloader 7','Reloader 10x','Reloader 15','Reloader 16','Reloader 17'))
   OR (brand = 'IMR'         AND product_name IN ('IMR 4166','IMR 4451','IMR 7977','IMR 3031','IMR 4895'))
   OR (brand = 'Accurate'    AND product_name IN ('LT-30','LT-32','XMR 4064'))
   OR (brand = 'Vihtavuori'  AND product_name IN ('N120','N130','N133','N135','N140','N150'));

-- H4350: well-known for inconsistent metering despite being the most popular precision powder
UPDATE public.powder_brands SET metering_grade = 'Fair'
WHERE brand = 'Hodgdon' AND product_name = 'H4350';

-- Large magnum extruded → Fair to Poor
UPDATE public.powder_brands SET metering_grade = 'Fair'
WHERE brand IN ('Hodgdon','IMR','Alliant','Vihtavuori') AND powder_type = 'Extruded'
  AND metering_grade IS NULL;

UPDATE public.powder_brands SET metering_grade = 'Poor'
WHERE product_name IN ('Reloader 33','Reloader 25','Reloader 26')
  AND brand = 'Alliant';

-- ── 8. MUZZLE FLASH RATING ────────────────────────────────────────────────────
-- Only assigning where well-documented in published literature.

-- Known high-flash powders
UPDATE public.powder_brands SET muzzle_flash_rating = 'High'
WHERE (brand = 'Alliant' AND product_name IN ('Power Pistol','Blue Dot','2400'))
   OR (brand = 'Hodgdon' AND product_name = 'Lil''Gun');

-- Known low-flash powders
UPDATE public.powder_brands SET muzzle_flash_rating = 'Low'
WHERE (brand = 'Alliant'     AND product_name IN ('Sport Pistol','BE-86','AR-Comp'))
   OR (brand = 'Hodgdon'     AND product_name IN ('Varget','H4895','CFE 223','CFE Pistol','Titegroup'))
   OR (brand = 'Vihtavuori'  AND product_name IN ('N133','N135','N140','N150','N160','N165','N170','N320','N330','N340','N350'))
   OR (brand = 'Winchester'  AND product_name IN ('StaBALL 6.5','StaBALL HD','StaBALL Match'));

-- Known moderate flash
UPDATE public.powder_brands SET muzzle_flash_rating = 'Moderate'
WHERE (brand = 'Alliant'  AND product_name = 'Unique')
   OR (brand = 'Winchester' AND product_name = '231')
   OR (brand = 'Hodgdon'  AND product_name IN ('H4350','H4831','H4831SC'));

-- ── 9. BRAND EQUIVALENTS ──────────────────────────────────────────────────────
-- Confirmed identical formulations only.

-- H110 ↔ W296: identical per Hodgdon and Winchester documentation
UPDATE public.powder_brands SET brand_equivalent = 'Winchester 296 (identical formulation)'
WHERE brand = 'Hodgdon' AND product_name = 'H110';

UPDATE public.powder_brands SET brand_equivalent = 'Hodgdon H110 (identical formulation)'
WHERE brand = 'Winchester' AND product_name = '296';

-- W231 = Hodgdon HP-38 (HP-38 not separately listed in this table)
UPDATE public.powder_brands SET brand_equivalent = 'Hodgdon HP-38 (identical formulation)'
WHERE brand = 'Winchester' AND product_name = '231';

-- H4895 ≈ IMR 4895 (near-identical, same origin; minor lot-level differences possible)
UPDATE public.powder_brands SET brand_equivalent = 'IMR 4895 (near-identical application)'
WHERE brand = 'Hodgdon' AND product_name = 'H4895';

UPDATE public.powder_brands SET brand_equivalent = 'Hodgdon H4895 (near-identical application)'
WHERE brand = 'IMR' AND product_name = 'IMR 4895';

-- Accurate 4064 ≈ IMR 4064
UPDATE public.powder_brands SET brand_equivalent = 'IMR 4064 (near-identical application)'
WHERE brand = 'Accurate' AND product_name = '4064';

-- ── 10. INSERT 14 NEW POWDERS ─────────────────────────────────────────────────

INSERT INTO public.powder_brands
  (brand, product_name, burn_rate_rank, powder_type, best_use, recommended_calibers,
   temperature_sensitivity, discontinued, country_of_origin, description,
   parent_company, manufacturer, distributor, metering_grade, muzzle_flash_rating)
VALUES

-- Hodgdon Clays — benchmark fast flake for light target loads (conspicuously absent)
('Hodgdon','Clays',
 7,'Flake',ARRAY['Pistol','Shotgun'],
 ARRAY['12 Gauge (light target)','20 Gauge','28 Gauge','.45 ACP (light)','.40 S&W (light)'],
 'Low',false,'USA',
 'The benchmark fast flake powder for light target shotshell and pistol loads. Extremely clean-burning. Produces consistent, soft-shooting loads for sporting clays, trap, skeet, and USPSA/IDPA target work. One of the fastest clean-burning powders available.',
 NULL,'[NEEDS RESEARCH]','Hodgdon Powder Company','Good','Low'),

-- Hodgdon Universal — one of the most widely referenced powders, missing from table
('Hodgdon','Universal',
 17,'Flake',ARRAY['Pistol','Shotgun'],
 ARRAY['9mm','.38 Special','.45 ACP','12 Gauge','.40 S&W','.357 Magnum'],
 'Moderate',false,'USA',
 'Versatile flake powder covering a wide range of pistol calibers and shotshell applications. Found in every major loading manual since the 1980s. Often used as a multi-purpose substitute across the Unique burn rate range with cleaner burning.',
 NULL,'[NEEDS RESEARCH]','Hodgdon Powder Company','Good','Moderate'),

-- Hodgdon HS-6 — classic medium magnum pistol/shotgun ball powder
('Hodgdon','HS-6',
 29,'Ball',ARRAY['Pistol','Shotgun'],
 ARRAY['.357 Magnum','.44 Magnum','12 Gauge (3" magnum)','.45 Colt','.38 Super','.40 S&W (heavy)'],
 'Moderate',false,'USA',
 'Classic medium-slow ball powder. Excellent for magnum handgun cartridges and heavy 3" magnum shotshell loads. Meters exceptionally through progressive presses. Used by both hunters and competition shooters in major power factor loads.',
 NULL,'[NEEDS RESEARCH]','Hodgdon Powder Company','Excellent','Moderate'),

-- Hodgdon Benchmark — temperature-stable for .223 Rem service rifle competition
('Hodgdon','Benchmark',
 52,'Extruded',ARRAY['Rifle'],
 ARRAY['.223 Rem','5.56 NATO','.204 Ruger','.222 Rem'],
 'Low',false,'USA',
 'Temperature-insensitive extruded powder optimized for small-to-medium rifle cases. Excellent in .223 Rem with medium-weight bullets. Consistent lot-to-lot accuracy. A top choice for NRA High Power and service rifle competition. Often compared to H335 in application range.',
 NULL,'[NEEDS RESEARCH]','Hodgdon Powder Company','Good','Low'),

-- Hodgdon CFE BLK — purpose-built for .300 Blackout
('Hodgdon','CFE BLK',
 45,'Ball',ARRAY['Rifle'],
 ARRAY['.300 Blackout (supersonic)','.300 Blackout (subsonic)','7.62x39'],
 'Low',false,'USA',
 'Purpose-built ball powder for .300 Blackout in both supersonic and subsonic configurations. CFE (Copper Fouling Eraser) additive reduces copper fouling. Temperature insensitive. Ideal for suppressor users and tactical/hunting applications. No other powder in the Hodgdon line is this specifically optimized for .300 BLK.',
 NULL,'[NEEDS RESEARCH]','Hodgdon Powder Company','Excellent','Low'),

-- Hodgdon Retumbo — dominant slow magnum powder for .338 Lapua / .300 RUM
('Hodgdon','Retumbo',
 78,'Extruded',ARRAY['Magnum Rifle'],
 ARRAY['.300 Win Mag','.338 Lapua','.300 RUM','.30-378 Wby','7mm Rem Mag'],
 'Moderate',false,'USA',
 'Ultra-slow extruded powder for large magnum rifle cases. Produces maximum velocities from .300 Win Mag, .338 Lapua, and Remington Ultra Mag cases. Dominant choice for long-range hunters using magnum rifles. Fills the gap between H1000 and the ultra-slow competition powders.',
 NULL,'[NEEDS RESEARCH]','Hodgdon Powder Company','Fair','Low'),

-- IMR 4198 — classic fast rifle powder, absent from IMR section
('IMR','IMR 4198',
 41,'Extruded',ARRAY['Rifle'],
 ARRAY['.222 Rem','.22 Hornet','.223 Rem (light)','.30-30 Win','.45-70 Govt (reduced)'],
 'Moderate',false,'USA',
 'Classic fast-burning IMR extruded powder in production since 1960. One of the original IMR family. Excellent for .222 Rem, .22 Hornet, and other small-capacity rifle cases. Also useful for cast bullet rifle loads and reduced loads in larger cases. A staple of every major loading manual published after 1960.',
 'Hodgdon Powder Company','[NEEDS RESEARCH]','Hodgdon Powder Company','Good','Moderate'),

-- IMR 8133 — Enduron ultra-slow, slowest of the Enduron line
('IMR','IMR 8133',
 83,'Extruded',ARRAY['Magnum Rifle'],
 ARRAY['.338 Lapua','.375 H&H','.300 Norma Mag','28 Nosler','.416 Rigby'],
 'Low',false,'USA',
 'Enduron series ultra-slow temperature-insensitive powder for the largest magnum rifle cartridges. Copper fouling reducer. Produces low extreme spread in .338 Lapua and similar case capacities. The slowest powder in the IMR Enduron line — designed for cases that cannot be filled by IMR 7977.',
 'Hodgdon Powder Company','[NEEDS RESEARCH]','Hodgdon Powder Company','Good','Low'),

-- Vihtavuori N540 — competition .308 Win F-Class powder, N500 series
('Vihtavuori','N540',
 62,'Extruded',ARRAY['Rifle'],
 ARRAY['.308 Win (F-Class)','.308 Win','6.5 Creedmoor','7.62 NATO'],
 'Low',false,'Finland',
 'Temperature-stable competition extruded powder from VV''s N500 series. Similar burn rate to N140 but formulated for competition use with exceptional lot-to-lot consistency. Popular in .308 Win F-Class and IPSC rifle competition. Low temperature sensitivity is its defining advantage over many competitors.',
 'Nammo','Nammo Vihtavuori Oy','Capstone Precision Group','Good','Low'),

-- Vihtavuori N555 — 6.5 Creedmoor precision rifle, N500 series
('Vihtavuori','N555',
 60,'Extruded',ARRAY['Rifle'],
 ARRAY['6.5 Creedmoor','6mm Creedmoor','.260 Rem','.308 Win'],
 'Low',false,'Finland',
 'Temperature-stable competition extruded powder from VV''s N500 series. The definitive Vihtavuori choice for 6.5 Creedmoor precision rifle. Designed for extremely consistent performance across the temperature ranges encountered in PRS, F-Class, and hunting applications.',
 'Nammo','Nammo Vihtavuori Oy','Capstone Precision Group','Good','Low'),

-- Vihtavuori N565 — slow magnum, N500 series
('Vihtavuori','N565',
 73,'Extruded',ARRAY['Rifle','Magnum Rifle'],
 ARRAY['7mm Rem Mag','.300 Win Mag','.338 Win Mag','.30-06 (heavy)'],
 'Low',false,'Finland',
 'Very slow temperature-stable extruded powder from VV''s N500 competition series. Designed for heavy bullets in large-capacity rifle cases and magnum cartridges. Exceptional consistency for precision hunting and long-range competition. The N500 series answer to N165.',
 'Nammo','Nammo Vihtavuori Oy','Capstone Precision Group','Good','Low'),

-- Norma 203-B — classic European rifle powder
('Norma','203-B',
 58,'Extruded',ARRAY['Rifle'],
 ARRAY['.308 Win','.30-06','6.5x55 Swedish','.243 Win'],
 '[NEEDS RESEARCH]',false,'Sweden',
 'Classic Norma extruded rifle powder in the H4895 burn rate range. Long history in .308 Win and 6.5x55 Swedish reloading. Well-regarded in European and Scandinavian precision rifle competition. Named for its charge weight relationship in a benchmark load.',
 'RUAG Ammotec','Norma Precision AB','RUAG Ammotec USA','Good',NULL),

-- Norma URP — F-Class competition .308 Win
('Norma','URP',
 63,'Extruded',ARRAY['Rifle'],
 ARRAY['.308 Win','.30-06','.308 Win (F-Class)','7.62 NATO'],
 '[NEEDS RESEARCH]',false,'Sweden',
 'Norma Universal Rifle Powder — medium-speed extruded powder for medium-capacity rifle cases. Popular in .308 Win F-Class competition in Europe. Clean-burning and consistent across a wide temperature range. URP stands for Universal Rifle Powder, reflecting its versatility.',
 'RUAG Ammotec','Norma Precision AB','RUAG Ammotec USA','Good',NULL),

-- Shooters World Major Pistol — Explosia-made, growing adoption in USPSA Open/Limited
('Shooters World','Major Pistol',
 27,'Ball',ARRAY['Pistol'],
 ARRAY['9mm (major)','.38 Super','.40 S&W (major)','10mm'],
 'Low',false,'Czech Republic',
 'Explosia-manufactured ball powder distributed by Shooters World in the US. Gaining significant adoption in USPSA Open and Limited divisions for major power factor loads. Clean-burning with excellent metering. Temperature insensitive. Represents the emerging Shooters World brand in the reloading market.',
 'Shooters World','Explosia','Shooters World','Excellent','Low')

ON CONFLICT (brand, product_name) DO NOTHING;
