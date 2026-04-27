-- ============================================================
-- gun_models v4 — Phase 2: Corrections + backfill
-- Fixes 20 factual errors, backfills new columns on existing rows
-- ============================================================

-- ============================================================
-- SECTION 1: FACTUAL CORRECTIONS
-- ============================================================

-- 1. Weight units bug: rifle/shotgun weights were stored in lbs, convert to oz.
--    Threshold < 50: no production rifle or shotgun weighs under 50 oz (3.1 lbs).
UPDATE public.gun_models
SET weight_oz_unloaded = ROUND(weight_oz_unloaded * 16, 1)
WHERE type IN ('Rifle', 'Shotgun')
  AND weight_oz_unloaded IS NOT NULL
  AND weight_oz_unloaded < 50;

-- 2. Revolvers misclassified as type='Pistol' — fix all at once via action field
UPDATE public.gun_models
SET type = 'Revolver'
WHERE action = 'Revolver' AND type = 'Pistol';

-- 3. Staccato ghost duplicates — delete short-name stub rows that are either
--    duplicated by full-name entries or bare stubs with no usable data.
--    Kept: Staccato C2, Staccato P, Staccato XC (full-name rows with weight/year data)
DELETE FROM public.gun_models
WHERE id IN (
  'faa1ffb3-78e6-4f2a-8738-461156443d4d',  -- "C" stub
  '4e3014c4-0731-43a1-9c46-ba785f5860c3',  -- "C2" stub (dup of "Staccato C2")
  '2658a7db-83a8-4be7-8243-8b3582f714e9',  -- "CS" stub
  'a05f20ba-e9d7-49a8-91e6-dbc2750a920f',  -- "P" stub (dup of "Staccato P")
  '55b85e49-8388-48dc-ba6f-cefaeec6b9d0',  -- "XC" stub (dup of "Staccato XC")
  'eb76e9c1-480a-4eb7-b2af-625f349ba00a'   -- "XL" stub
);

-- 4. AK-47 year_introduced: 1948 → 1947 (officially adopted Jan 5, 1947; "47" is in the name)
UPDATE public.gun_models
SET year_introduced = 1947
WHERE id = '7667b605-0249-473a-879c-64f4186402f6';

-- 5. AKM alias collision — strip ak-47/ak47 aliases from AKM entry
UPDATE public.gun_models
SET model_aliases = ARRAY['akm', 'stamped ak', 'akm variant', 'ak stamped receiver']
WHERE id = '062b0c2d-906c-4885-93e0-6223d8403d1a';

-- 6. Desert Eagle 1983 — clarify as Mark I entry; remove shared "desert eagle" alias
UPDATE public.gun_models
SET model             = 'Desert Eagle Mark I',
    model_aliases     = ARRAY['desert eagle mark i', 'desert eagle mk1', 'de mark i'],
    description       = 'Original Desert Eagle platform introduced in 1983, initially chambered in .357 Magnum. Designed by Magnum Research and originally manufactured by IMI (Israel Military Industries). The gas-operated rotating bolt mechanism was groundbreaking for a pistol of this caliber. The Mark XIX (1995) superseded this configuration and is the definitive Desert Eagle platform in current production.'
WHERE id = '1c3f4bef-bbc0-4ef1-ae01-d714fb053aba';

-- 7. Glock Gen6 speculative entries — flag clearly (no commercial release as of 2025)
UPDATE public.gun_models
SET production_status = 'Speculative/Unreleased',
    description       = 'Speculative placeholder entry. No Glock Gen6 has been commercially released as of 2025. Glock''s most recent generational update was Gen5 in 2017. This entry should not be cited as a confirmed product.'
WHERE id IN (
  '26155011-b86d-4b0f-95a3-77e9b22d321b',  -- G17 Gen6
  'ae9db257-136e-4f86-9adb-d353fb200fb5'   -- G19 Gen6
);

-- 8. Remington 11-87 — discontinued (RemArms did not resume 11-87 production post-bankruptcy)
UPDATE public.gun_models
SET discontinued      = true,
    production_status = 'Discontinued'
WHERE id = '282a5a01-94ee-45ec-974d-65abb5b3ddf5';

-- 9. P226 caliber_options blank while description confirms .40 S&W and .357 SIG variants
UPDATE public.gun_models
SET caliber_options = ARRAY['9mm', '.40 S&W', '.357 SIG']
WHERE id = '014a0cce-0882-412b-868f-a1dc35e47eed';

-- 10. M18 — capacity 17 is minimum; standard issue includes both 17-rd and 21-rd magazines
UPDATE public.gun_models
SET description = 'Compact variant of the SIG M17 adopted by the US military in 2017 under the Modular Handgun System program. Chambered in 9mm with a 3.9" barrel. Issued with both a 17-round flush-fit magazine and a 21-round extended magazine as standard government issue. The M18 replaced the Beretta M9A1 in compact/carry roles across the services. Features a manual safety per military specification — absent on most civilian P320 variants.'
WHERE id = '7c2dfd43-3c8d-4870-81e1-dbf92d1189be';

-- 11. G19 — soften unverifiable "best-selling handgun" claim
UPDATE public.gun_models
SET description = REPLACE(description,
  'best-selling handgun in the United States',
  'consistently among the top-selling handguns in the United States')
WHERE make = 'Glock' AND model = 'G19';

-- 12. production_status cleanup — replace "Active or Mixed" for known-discontinued models
--     Known discontinued post-Remington 2020 bankruptcy (RemArms restart excludes these)
UPDATE public.gun_models
SET production_status = 'Discontinued',
    discontinued      = true
WHERE make = 'Remington'
  AND model IN ('Model 1100 Classic Field', 'Spartan', '11-87');

-- Military/historical surplus platform entries — no current commercial producer
UPDATE public.gun_models
SET production_status = 'Discontinued',
    discontinued      = true
WHERE make = 'No Standard Manufacturer'
  AND model IN ('AK-47', 'AKM', 'SKS', 'Mosin-Nagant', 'M1 Carbine', 'Lee-Enfield', 'Kar98k');

-- 13. era — populate for historical models
UPDATE public.gun_models SET era = 'Pre-WWI / Old West'
WHERE year_introduced IS NOT NULL AND year_introduced < 1914 AND era IS NULL;

UPDATE public.gun_models SET era = 'World War I'
WHERE year_introduced BETWEEN 1914 AND 1918 AND era IS NULL;

UPDATE public.gun_models SET era = 'Interwar'
WHERE year_introduced BETWEEN 1919 AND 1938 AND era IS NULL;

UPDATE public.gun_models SET era = 'World War II'
WHERE year_introduced BETWEEN 1939 AND 1945 AND era IS NULL;

UPDATE public.gun_models SET era = 'Cold War'
WHERE year_introduced BETWEEN 1946 AND 1989 AND era IS NULL;

UPDATE public.gun_models SET era = 'Modern'
WHERE year_introduced >= 1990 AND era IS NULL;

-- Override for models with ambiguous dates (platform older than year_introduced suggests)
UPDATE public.gun_models SET era = 'World War II'
WHERE model IN ('M1 Carbine', 'M1 Garand', 'M1911A1') AND era IS NOT NULL AND era != 'World War II';

UPDATE public.gun_models SET era = 'Pre-WWI / Old West'
WHERE model IN ('Single Action Army', 'Winchester Model 1873', 'Model 1894') AND era != 'Pre-WWI / Old West';

-- 14. caliber_options — populate for notable multi-caliber platforms
UPDATE public.gun_models
SET caliber_options = ARRAY['5.56 NATO', '7.62x51mm NATO', '6.5 Creedmoor', '.338 Norma Magnum', '.300 Norma Magnum']
WHERE make ILIKE '%barrett%' AND model ILIKE '%MRAD%';

UPDATE public.gun_models
SET caliber_options = ARRAY['5.56 NATO', '7.62x51mm NATO']
WHERE make ILIKE '%fn%' AND model ILIKE '%scar%';

UPDATE public.gun_models
SET caliber_options = ARRAY['.357 Magnum', '.44 Magnum', '.50 AE']
WHERE model = 'Desert Eagle Mark XIX';

UPDATE public.gun_models
SET caliber_options = ARRAY['5.56 NATO', '.224 Valkyrie', '6.5 Creedmoor', '.308 Win', '.350 Legend', '.450 Bushmaster']
WHERE make = 'Ruger' AND model = 'SFAR';

-- 15. SP5K type ATF logic — add note to HK pistol-configuration entries
UPDATE public.gun_models
SET description = description || ' Type classification follows ATF designation: the SP5 (16" barrel) is legally a Rifle; the SP5K (sub-16" barrel, factory configured without stock) is legally a Pistol. Both use the roller-delayed blowback mechanism of the MP5 family.'
WHERE make ILIKE '%heckler%' AND model IN ('SP5K', 'SP5K-PDW');

-- 16. Barrett M107A1 year — the A1 lightened variant entered service ~2011, not 2005
UPDATE public.gun_models
SET year_introduced = 2011,
    description     = COALESCE(description, '') || ' Note: The M107 designation was adopted by the US Army in 2002 (replacing M82A1 in service). The M107A1 is a lightened titanium/aluminum variant that entered service approximately 2011-2012. The 2005 date referenced in some sources corresponds to neither the M107 adoption nor the M107A1 upgrade.'
WHERE make ILIKE '%barrett%' AND model = 'M107A1';

-- 17. Weight backfill — common rifles/shotguns missing weight data (converting from lbs)
UPDATE public.gun_models SET weight_oz_unloaded = 108.8 WHERE make = 'Ruger' AND model = 'American Rimfire';       -- 6.8 lbs
UPDATE public.gun_models SET weight_oz_unloaded = 102.4 WHERE make = 'Ruger' AND model = 'SFAR';                   -- 6.4 lbs
UPDATE public.gun_models SET weight_oz_unloaded = 115.2 WHERE make = 'Savage Arms' AND model = 'Axis II';          -- 7.2 lbs
UPDATE public.gun_models SET weight_oz_unloaded = 96.0  WHERE make = 'Savage Arms' AND model = 'B22';              -- 6.0 lbs
UPDATE public.gun_models SET weight_oz_unloaded = 112.0 WHERE make = 'Mossberg' AND model = '500';                 -- 7.0 lbs (field model)
UPDATE public.gun_models SET weight_oz_unloaded = 118.4 WHERE make = 'Mossberg' AND model = '590';                 -- 7.4 lbs
UPDATE public.gun_models SET weight_oz_unloaded = 118.4 WHERE make = 'Mossberg' AND model = '590A1';               -- 7.4 lbs
UPDATE public.gun_models SET weight_oz_unloaded = 110.4 WHERE make = 'Remington' AND model = '870' AND weight_oz_unloaded IS NULL;  -- 6.9 lbs

-- 18. Mossberg 590 Shockwave — add ATF classification note to description
UPDATE public.gun_models
SET description = COALESCE(description, '') || ' ATF classified the Shockwave as a "firearm" (not a shotgun or short-barreled shotgun) because it ships without a stock and has a 14" barrel. This is the only entry in this database with type=Firearm — it will be excluded from shotgun-filtered queries by design.'
WHERE make ILIKE '%mossberg%' AND model ILIKE '%shockwave%';

-- 19. FN High Power — add multi-manufacturer production note
UPDATE public.gun_models
SET description = COALESCE(description, '') || ' Note: While FN Herstal is the originating manufacturer, the Hi-Power was licensed to and produced by John Inglis & Company (Canada, WWII), Fabrica Militar de Armas Portátiles (FM, Argentina), and sold commercially by Browning Arms in the US market. Military production occurred in Belgium, Canada, and Argentina across different eras.'
WHERE make ILIKE '%fn%' AND model ILIKE '%high power%';

-- 20. IWI Micro Tavor (MTAR) X95 — fix caliber from 9mm to 5.56 NATO
UPDATE public.gun_models
SET caliber     = '5.56 NATO',
    description = COALESCE(description, '') || ' Primary platform is 5.56 NATO. A 9mm conversion kit exists as an accessory, but 5.56 is the standard military and commercial configuration. The MTAR X95 is the compact variant of the X95 family (shorter barrel, folding stock), used by Israeli special operations.'
WHERE id = 'f10b7083-3130-4720-a5a8-370eb4906c3c';


-- ============================================================
-- SECTION 2: BACKFILL trigger_type
-- ============================================================

-- Striker-fired pistols
UPDATE public.gun_models SET trigger_type = 'Striker-Fired'
WHERE type = 'Pistol' AND make = 'Glock';

UPDATE public.gun_models SET trigger_type = 'Striker-Fired'
WHERE type = 'Pistol' AND make = 'Sig Sauer'
  AND model ILIKE ANY(ARRAY['%P320%', '%P365%', '%M17%', '%M18%', '%P322%', '%P326%']);

UPDATE public.gun_models SET trigger_type = 'Striker-Fired'
WHERE type = 'Pistol' AND make = 'Smith & Wesson'
  AND (model ILIKE '%M&P%' OR model ILIKE '%Shield%' OR model ILIKE '%Equalizer%' OR model ILIKE '%CSX%');

UPDATE public.gun_models SET trigger_type = 'Striker-Fired'
WHERE type = 'Pistol' AND make = 'Springfield Armory'
  AND (model ILIKE '%XD%' OR model ILIKE '%Hellcat%' OR model ILIKE '%Echelon%');

UPDATE public.gun_models SET trigger_type = 'Striker-Fired'
WHERE type = 'Pistol' AND make = 'Walther'
  AND model ILIKE ANY(ARRAY['%PDP%', '%PPQ%', '%CCP%', '%PPS M2%']);

UPDATE public.gun_models SET trigger_type = 'Striker-Fired'
WHERE type = 'Pistol' AND make = 'Heckler & Koch'
  AND model ILIKE ANY(ARRAY['%VP9%', '%VP40%', '%VP SK%']);

UPDATE public.gun_models SET trigger_type = 'Striker-Fired'
WHERE type = 'Pistol' AND make = 'Canik'
  AND model ILIKE '%TP9%';

UPDATE public.gun_models SET trigger_type = 'Striker-Fired'
WHERE type = 'Pistol' AND make IN ('FN Herstal', 'FN America')
  AND model ILIKE '%509%';

UPDATE public.gun_models SET trigger_type = 'Striker-Fired'
WHERE type = 'Pistol' AND make = 'Taurus'
  AND model ILIKE ANY(ARRAY['%G2C%', '%G3%', '%TX22%', '%GX4%']);

UPDATE public.gun_models SET trigger_type = 'Striker-Fired'
WHERE type = 'Pistol' AND make = 'Ruger'
  AND model ILIKE ANY(ARRAY['%MAX-9%', '%Security-9%', '%Security-380%', '%LC9s%', '%EC9s%', '%LCP II%', '%LCP Max%']);

UPDATE public.gun_models SET trigger_type = 'Striker-Fired'
WHERE type = 'Pistol' AND make = 'Kimber'
  AND model ILIKE ANY(ARRAY['%R7%', '%EVO%']);

-- DA/SA pistols
UPDATE public.gun_models SET trigger_type = 'DA/SA'
WHERE type = 'Pistol' AND make = 'Beretta'
  AND (model ILIKE '%92%' OR model ILIKE '%96%' OR model ILIKE '%M9%'
       OR model ILIKE '%PX4%' OR model ILIKE '%Cx4%');

UPDATE public.gun_models SET trigger_type = 'DA/SA'
WHERE type = 'Pistol' AND make = 'Sig Sauer'
  AND model ILIKE ANY(ARRAY['%P226%', '%P229%', '%P228%', '%P220%', '%P232%', '%P239%', '%P210%']);

UPDATE public.gun_models SET trigger_type = 'DA/SA'
WHERE type = 'Pistol' AND make = 'CZ'
  AND model ILIKE ANY(ARRAY['%75%', '%P-07%', '%P-09%', '%97%', '%Shadow%']);

UPDATE public.gun_models SET trigger_type = 'DA/SA'
WHERE type = 'Pistol' AND make = 'Heckler & Koch'
  AND model ILIKE ANY(ARRAY['%USP%', '%P2000%', '%HK45%', '%P30%', '%P7%']);

UPDATE public.gun_models SET trigger_type = 'DA/SA'
WHERE type = 'Pistol' AND make = 'Walther'
  AND model ILIKE ANY(ARRAY['%P99%', '%PPK%', '%PPS%']);

UPDATE public.gun_models SET trigger_type = 'DA/SA'
WHERE type = 'Pistol' AND make = 'Ruger'
  AND model ILIKE '%P-Series%';

UPDATE public.gun_models SET trigger_type = 'DA/SA'
WHERE type = 'Pistol' AND make = 'Smith & Wesson'
  AND model ILIKE ANY(ARRAY['%5906%', '%3913%', '%659%', '%Model 39%', '%Model 59%']);

-- Single-Action pistols (1911 pattern + Browning Hi-Power)
UPDATE public.gun_models SET trigger_type = 'Single-Action'
WHERE type = 'Pistol'
  AND (model ILIKE '%1911%' OR model ILIKE '%Government%' OR model ILIKE '%Commander%'
       OR model ILIKE '%Officer%' OR model ILIKE '%Gold Cup%'
       OR model ILIKE '%Defender%' OR model ILIKE '%Combat Elite%')
  AND make IN ('Colt', 'Springfield Armory', 'Kimber', 'Wilson Combat',
               'Nighthawk Custom', 'Les Baer', 'Dan Wesson', 'Rock Island Armory',
               'Remington', 'Sig Sauer');

UPDATE public.gun_models SET trigger_type = 'Single-Action'
WHERE type = 'Pistol' AND make = 'Staccato';

UPDATE public.gun_models SET trigger_type = 'Single-Action'
WHERE type = 'Pistol' AND model ILIKE '%Hi-Power%' OR model ILIKE '%High Power%';

-- Revolvers — Double-Action (most modern revolvers are DA/SA capable, type='Double-Action')
UPDATE public.gun_models SET trigger_type = 'Double-Action'
WHERE type = 'Revolver'
  AND model NOT IN ('Single Action Army', 'Super Blackhawk', 'Wrangler',
                    'New Vaquero', 'Blackhawk', 'Bearcat', 'New Model Single Six');

-- Single-Action revolvers
UPDATE public.gun_models SET trigger_type = 'Single-Action'
WHERE type = 'Revolver'
  AND model IN ('Single Action Army', 'Super Blackhawk', 'Wrangler',
                'New Vaquero', 'Blackhawk', 'Bearcat', 'New Model Single Six');

-- Bolt-action rifles — Single-Stage (default for hunting/general purpose)
UPDATE public.gun_models SET trigger_type = 'Single-Stage'
WHERE type = 'Rifle' AND action = 'Bolt' AND trigger_type IS NULL;

-- Precision bolt-action — Two-Stage where model is known match-grade
UPDATE public.gun_models SET trigger_type = 'Two-Stage'
WHERE type = 'Rifle' AND action = 'Bolt'
  AND (model ILIKE '%TRG%' OR model ILIKE '%AI AX%' OR model ILIKE '%AXMC%'
       OR model ILIKE '%AI AT%' OR model ILIKE '%Elite Precision%' OR model ILIKE '%Masterpiece%');


-- ============================================================
-- SECTION 3: BACKFILL intended_use
-- ============================================================

-- Concealed carry primary
UPDATE public.gun_models SET intended_use = ARRAY['concealed_carry', 'home_defense']
WHERE type = 'Pistol'
  AND model ILIKE ANY(ARRAY['%G19%', '%G26%', '%G43%', '%G48%', '%G42%',
    '%P365%', '%Shield%', '%Hellcat%', '%MAX-9%', '%Security-9%',
    '%G2C%', '%G3C%', '%LCP%', '%EC9s%', '%LC9s%', '%CSX%',
    '%P365 XL%', '%Equalizer%', '%GX4%', '%Micro%']);

UPDATE public.gun_models SET intended_use = ARRAY['concealed_carry', 'home_defense']
WHERE type = 'Revolver'
  AND model IN ('LCR', 'LCRx', '442', '642', 'SP101', '856', 'Model 85',
                'Cobra', 'Detective Special');

-- Home defense / duty
UPDATE public.gun_models SET intended_use = ARRAY['home_defense', 'duty']
WHERE type = 'Pistol' AND intended_use IS NULL
  AND model ILIKE ANY(ARRAY['%G17%', '%G22%', '%G21%', '%M17%', '%M18%',
    '%P226%', '%P320%', '%M&P9%', '%M&P40%', '%92FS%', '%M9%', '%VP9%', '%USP%']);

-- Competition handguns
UPDATE public.gun_models SET intended_use = ARRAY['competition', 'home_defense']
WHERE type = 'Pistol' AND intended_use IS NULL
  AND (model ILIKE '%Shadow 2%' OR model ILIKE '%SP-01%' OR model ILIKE '%Gold Cup%'
       OR model ILIKE '%Staccato%' OR model ILIKE '%XC%' OR model ILIKE '%TRP%'
       OR model ILIKE '%Tanfoglio%' OR make IN ('Wilson Combat', 'Nighthawk Custom', 'Les Baer'));

-- Big-bore handgun hunting
UPDATE public.gun_models SET intended_use = ARRAY['hunting_big_game', 'home_defense']
WHERE type = 'Revolver' AND intended_use IS NULL
  AND model ILIKE ANY(ARRAY['%Super Blackhawk%', '%Super Redhawk%', '%Raging Hunter%',
    '%629%', '%Model 29%', '%460 XVR%', '%500%', '%Redhawk%', '%44 Mag%']);

-- Collector / historical
UPDATE public.gun_models SET intended_use = ARRAY['collector', 'historical']
WHERE model IN ('Single Action Army', 'Python', 'Anaconda', 'Luger P08', 'Walther P38',
                'M1 Carbine', 'Mosin-Nagant', 'Lee-Enfield', 'Kar98k', 'AK-47')
  AND intended_use IS NULL;

-- Precision / long-range
UPDATE public.gun_models SET intended_use = ARRAY['precision_rifle', 'competition', 'hunting']
WHERE type = 'Rifle' AND action = 'Bolt' AND intended_use IS NULL
  AND (model ILIKE '%precision%' OR model ILIKE '%TRG%' OR model ILIKE '%MRAD%'
       OR model ILIKE '%AI AX%' OR model ILIKE '%AXMC%' OR model ILIKE '%HMR%'
       OR make ILIKE '%accuracy int%' OR make ILIKE '%desert tech%' OR make ILIKE '%proof%');

-- Hunting bolt-action
UPDATE public.gun_models SET intended_use = ARRAY['hunting', 'precision_rifle']
WHERE type = 'Rifle' AND action = 'Bolt' AND intended_use IS NULL;

-- AR / home defense semi-auto rifle
UPDATE public.gun_models SET intended_use = ARRAY['home_defense', 'competition', 'hunting']
WHERE type = 'Rifle' AND action = 'Semi-Auto' AND intended_use IS NULL;

-- Shotguns
UPDATE public.gun_models SET intended_use = ARRAY['hunting', 'home_defense', 'competition']
WHERE type = 'Shotgun' AND intended_use IS NULL;


-- ============================================================
-- SECTION 4: BACKFILL trivia
-- ============================================================

UPDATE public.gun_models SET trivia = 'The G17 was the first commercially successful polymer-frame pistol. When introduced in 1982, press reports falsely claimed it could evade airport metal detectors — it contains 33 metal components and trips every detector.'
WHERE make = 'Glock' AND model = 'G17';

UPDATE public.gun_models SET trivia = 'The G19 is the most commonly issued sidearm among US special operations forces — SEALs, Rangers, and Delta Force all carry it, making a compact civilian/police pistol the de facto special ops sidearm.'
WHERE make = 'Glock' AND model = 'G19';

UPDATE public.gun_models SET trivia = 'The Colt Python was hand-fitted by Colt gunsmiths to tighter tolerances than their standard revolvers — a practice so costly it led to discontinuation in 1999. Reintroduced in 2020 using CNC machining.'
WHERE make = 'Colt' AND model = 'Python';

UPDATE public.gun_models SET trivia = 'The 1911 served as the official US military sidearm for 74 years (1911–1985) — longer than any other standard-issue US military pistol. WWII contractors included Singer Sewing Machine Company; Singer-made examples are extremely rare.'
WHERE make = 'Colt' AND model IN ('1911', 'M1911', 'M1911A1', 'Government Model', 'Series 70', 'Series 80');

UPDATE public.gun_models SET trivia = 'The AK-47 and its variants have been produced in greater numbers than any other assault rifle — over 100 million estimated — and are operated by the armed forces of more than 50 nations.'
WHERE model = 'AK-47';

UPDATE public.gun_models SET trivia = 'The P226 was selected by US Navy SEALs in 1989 after a competitive evaluation and remained their standard sidearm for 26 years until transitioning to the Glock 19 in 2015.'
WHERE make = 'Sig Sauer' AND model = 'P226';

UPDATE public.gun_models SET trivia = 'The Beretta M9 ended the 74-year reign of the Colt 1911 as the US military''s standard sidearm when adopted in 1985 — after Beretta beat Colt, S&W, SIG, H&K, and Walther in a competitive evaluation.'
WHERE make = 'Beretta' AND model IN ('M9', 'M9A1', '92F', '92FS');

UPDATE public.gun_models SET trivia = 'The Remington 870 is the best-selling pump-action shotgun in history, with over 11 million produced. It has been used by military, law enforcement, and hunters on every continent.'
WHERE make = 'Remington' AND model = '870';

UPDATE public.gun_models SET trivia = 'The Winchester Model 70 is called "The Rifleman''s Rifle" — a title cemented by Jack O''Connor''s decades of writing in Outdoor Life. The 1964 switch from controlled-round-feed to push-feed remains the most controversial product change in American sporting rifle history.'
WHERE make = 'Winchester' AND model = 'Model 70';

UPDATE public.gun_models SET trivia = 'The Colt Single Action Army is the most recognized revolver silhouette in history — the standard US cavalry sidearm from 1873, made famous by every Western film ever produced, still in continuous production 150+ years later.'
WHERE make = 'Colt' AND model = 'Single Action Army';

UPDATE public.gun_models SET trivia = 'The Mosin-Nagant is estimated to have had over 37 million rifles manufactured between 1891 and the 1960s — one of the highest production volumes of any bolt-action in history, and still in active military use in some regions.'
WHERE model IN ('Mosin-Nagant', 'Mosin Nagant');

UPDATE public.gun_models SET trivia = 'The Barrett M82 was first used in combat during Operation Desert Storm (1991) to disable aircraft, radar equipment, and light vehicles at ranges previously requiring crew-served weapons — a mission role it created.'
WHERE make ILIKE '%barrett%' AND model IN ('M82', 'M82A1');

UPDATE public.gun_models SET trivia = 'The Desert Eagle''s gas-operated rotating bolt mechanism — borrowed from rifle design — was necessary to handle Magnum cartridge pressures. It remains the only pistol to fire the .50 AE cartridge in a semi-automatic platform.'
WHERE model = 'Desert Eagle Mark XIX';

UPDATE public.gun_models SET trivia = 'The Ruger 10/22 has been in continuous production since 1964, making it the best-selling rimfire rifle in the US. Its aftermarket parts ecosystem rivals the AR-15 in depth — virtually every component can be replaced with an upgrade.'
WHERE make = 'Ruger' AND model = '10/22';

UPDATE public.gun_models SET trivia = 'The Walther PPK was carried by British intelligence officers and made globally famous as James Bond''s sidearm from 1962''s Dr. No. It was chosen by Ian Fleming based on a reader letter suggesting it was more plausible than Bond''s original Beretta.'
WHERE make = 'Walther' AND model IN ('PPK', 'PPK/S');

UPDATE public.gun_models SET trivia = 'The SIG M17 and M18 were the first US military standard sidearms adopted through a competitive procurement since the Beretta M9 in 1985 — SIG beat Glock, Beretta, FN, and S&W in the 2017 Modular Handgun System evaluation.'
WHERE make = 'Sig Sauer' AND model IN ('M17', 'M18');

UPDATE public.gun_models SET trivia = 'The AR-15 platform has an estimated 20+ million units in civilian hands in the United States — the most commonly owned rifle type in the country — despite being designed as a military weapon in the 1950s.'
WHERE model ILIKE '%AR-15%' OR (make = 'Colt' AND model ILIKE '%AR-15%');

UPDATE public.gun_models SET trivia = 'The Smith & Wesson Model 29 in .44 Magnum was made famous as Dirty Harry''s revolver in 1971. It was so popular after the film that S&W had multi-year waiting lists — a Hollywood-driven demand spike unmatched in revolver history.'
WHERE make = 'Smith & Wesson' AND model = 'Model 29';

UPDATE public.gun_models SET trivia = 'The Browning Hi-Power was the standard sidearm of both Allied and Axis forces simultaneously during WWII — the Germans captured FN''s Belgian factory and continued production for Wehrmacht use while Canada produced the same pistol for Allied forces.'
WHERE model ILIKE '%Hi-Power%' OR model ILIKE '%High Power%';

UPDATE public.gun_models SET trivia = 'The Lee-Enfield held the world record for aimed fire rate when it entered service in 1895. Skilled soldiers could reliably fire 15 rounds per minute — a technique called the "mad minute" that was mistaken for machine gun fire by German forces in WWI.'
WHERE model IN ('Lee-Enfield', 'SMLE', 'No. 4 Mk I');


-- ============================================================
-- SECTION 5: BACKFILL country_of_manufacture
-- ============================================================

-- Glock: significant percentage of US-sold units assembled in Smyrna, GA
UPDATE public.gun_models
SET country_of_manufacture = 'USA (Smyrna, GA)'
WHERE make = 'Glock' AND country_of_origin = 'Austria';

-- Walther PDP/PPQ: manufactured in Fort Smith, Arkansas
UPDATE public.gun_models
SET country_of_manufacture = 'USA (Fort Smith, AR)'
WHERE make = 'Walther'
  AND model ILIKE ANY(ARRAY['%PDP%', '%PPQ%', '%PPQ M2%']);

-- Browning and Winchester centerfire long guns made by Miroku in Japan
UPDATE public.gun_models
SET country_of_manufacture = 'Japan (Miroku)'
WHERE make IN ('Browning', 'Winchester')
  AND type IN ('Rifle', 'Shotgun')
  AND country_of_origin = 'USA';

-- Beretta US military contract production in Accokeek, Maryland
UPDATE public.gun_models
SET country_of_manufacture = 'USA (Accokeek, MD)'
WHERE make = 'Beretta'
  AND model IN ('M9', 'M9A1', 'M9A3');

-- Magnum Research Desert Eagle: current production at MRI facility in Pillager, MN
UPDATE public.gun_models
SET country_of_manufacture = 'USA (Pillager, MN)'
WHERE make = 'Magnum Research'
  AND model IN ('Desert Eagle', 'Desert Eagle Mark XIX', 'Desert Eagle Mark I');


-- ============================================================
-- SECTION 6: BACKFILL is_collectible + collector_notes
-- ============================================================

-- Flag historically significant and collector-market models
UPDATE public.gun_models SET is_collectible = true
WHERE model ILIKE ANY(ARRAY[
  '%Python%', '%Anaconda%', '%Single Action Army%', '%Colt Detective%',
  '%Model 29%', '%Model 27%', '%Model 10%', '%Model 19%',
  '%Luger%', '%P08%', '%Walther P38%',
  '%M1 Garand%', '%M1 Carbine%', '%M1903%',
  '%Mosin%', '%Lee-Enfield%', '%Kar98k%', '%K98k%',
  '%Auto-5%', '%Browning A5%',
  '%Hi-Power%', '%High Power%', '%GP35%',
  '%Winchester Model 70%', '%Model 94%', '%Model 1873%', '%Model 1897%', '%Model 12%',
  '%AK-47%'
]);

UPDATE public.gun_models SET is_collectible = true
WHERE make = 'Colt' AND model ILIKE ANY(ARRAY['%1911%', '%M1911%', '%Government%', '%Gold Cup%']);

-- collector_notes for notable cases
UPDATE public.gun_models
SET collector_notes = 'Pre-1964 rifles (controlled-round-feed action) command significant premium over post-1964 push-feed examples. The 1992+ reintroduction restored controlled-round-feed. All three generations (pre-64, 64-92, post-92) are actively collected.'
WHERE make = 'Winchester' AND model = 'Model 70';

UPDATE public.gun_models
SET collector_notes = 'Original production Pythons (1955-1999) are priced by condition and originality. The 2020 reintroduction uses CNC machining and does not carry the same collector premium. Original box, papers, and tools materially affect value. Royal Blue finish commands highest premium.'
WHERE make = 'Colt' AND model = 'Python';

UPDATE public.gun_models
SET collector_notes = 'WWII M1911A1 was manufactured by multiple contractors: Colt, Remington Rand (most common), Ithaca, Union Switch & Signal, and Singer Sewing Machine. Singer-made examples (fewer than 500 produced) are among the most valuable American military pistols — six-figure sums at auction.'
WHERE model IN ('M1911A1', 'M1911') AND military_use = true;

UPDATE public.gun_models
SET collector_notes = 'Both Allied and Axis forces used the Hi-Power simultaneously in WWII. German-production examples (marked "WaA613" with Nazi proof marks) and Canadian Inglis examples with tangent rear sight are most sought by collectors. FN-marked vs Inglis-marked examples serve different collector markets.'
WHERE model ILIKE '%Hi-Power%' OR model ILIKE '%High Power%';

UPDATE public.gun_models
SET collector_notes = 'The Luger P08 is among the most collected military pistols in history. Date of manufacture, proof marks, arsenal marks, matching numbers, and specific model variants (Navy Luger, Artillery Luger, DWM vs Mauser production) all dramatically affect value. All-matching numbers examples command 3-5x premium over mismatched.'
WHERE model ILIKE '%Luger%' OR model ILIKE '%P08%';
