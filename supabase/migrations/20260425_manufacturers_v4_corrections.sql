-- ============================================================
-- manufacturers v4 — Corrections + backfill
-- Fixes 12 confirmed inaccuracies, backfills new + sparse columns
-- ============================================================

-- ============================================================
-- SECTION 1: FACTUAL CORRECTIONS (12 confirmed issues)
-- ============================================================

-- 1. SIG Sauer notable_models: remove SCAR (FN product, zero SIG involvement)
UPDATE public.manufacturers
SET notable_models = ARRAY['P226', 'P320', 'P365', 'M17', 'M18', 'MPX', 'MCX', 'P210']
WHERE name ILIKE 'sig sauer';

-- 2. Colt parent_company: CZ Group SE acquired Colt in 2021
UPDATE public.manufacturers
SET parent_company = 'CZ Group SE',
    ownership_type = 'Subsidiary'
WHERE name = 'Colt';

-- 3. BCM stub: delete bare duplicate of "Bravo Company (BCM)"
DELETE FROM public.manufacturers
WHERE id = 'f44323ad-177e-4d86-bc8b-5cf95421845f';  -- "BCM" stub row

-- 4. Springfield Armory: clear factually wrong military fields
--    Commercial SA Inc. (est. 1974) made no M16/M4s — those are Colt/FN contracts.
--    Garand designed at the *government* Springfield Armory — no corporate link.
UPDATE public.manufacturers
SET military_notes      = 'Springfield Armory Inc. (commercial, est. 1974) holds no US military production contracts. The company name references the historic government Springfield Armory (federal armory, 1777–1968) but has no corporate relationship to it. The M1A is a semi-automatic civilian derivative of the M14, not a military contract product.',
    notable_designers   = NULL,
    has_military_contract = false
WHERE name = 'Springfield Armory';

-- 5. Holland & Holland: Royal Warrant ≠ military contract. .303 H&H claim unsupportable.
UPDATE public.manufacturers
SET has_military_contract = false,
    military_notes        = NULL
WHERE name = 'Holland & Holland';

-- 6. Kahr Arms: price_tier_entry_usd $2,499 → ~$339 (CW9 / CT380 entry price)
UPDATE public.manufacturers
SET price_tier_entry_usd = 339
WHERE name = 'Kahr Arms';

-- 7. Walther notable_designers: remove Georg Luger (designed P08 for DWM, not Walther)
UPDATE public.manufacturers
SET notable_designers = ARRAY['Carl Walther', 'Fritz Walther']
WHERE name = 'Walther';

-- 8. Savage Arms notable_designers: replace Browning with Arthur Savage
--    Browning's Savage connection is minimal; Arthur Savage designed the Model 99
UPDATE public.manufacturers
SET notable_designers = ARRAY['Arthur Savage', 'John Moses Browning (tangential)']
WHERE name = 'Savage Arms';

-- 9. Sharps Rifle Company: rename to Shiloh Sharps — description identifies Shiloh Rifle
--    Manufacturing (Big Timber, MT, est. 1983), not the Wyoming "Sharps Rifle Company"
UPDATE public.manufacturers
SET name            = 'Shiloh Sharps (Shiloh Rifle Manufacturing)',
    alternate_names = ARRAY['Shiloh Sharps', 'Shiloh Rifle Manufacturing', 'Shiloh Rifle', 'Shiloh'],
    description     = 'Shiloh Rifle Manufacturing Company (Big Timber, Montana, est. 1983) produces the most respected modern reproductions of the original Sharps falling-block rifles. The 19th-century Sharps was the dominant single-shot rifle of the Civil War era and the weapon of the buffalo hunters who shaped the American West. Shiloh''s Model 1874 reproductions are built with case-hardened receivers and high-quality American walnut stocks to period specifications. Distinct from the separate "Sharps Rifle Company" of Glenrock, Wyoming. The original Sharps Rifle Manufacturing Company (1848–1881) was the historic entity whose designs both modern companies reproduce.'
WHERE id = 'b2a727ef-56be-4dff-b16b-928013b2416f';

-- 10. Pioneer Arms: fix founded_year — 1922 belongs to Fabryka Broni Radom, not Pioneer
UPDATE public.manufacturers
SET founded_year  = 1996,
    description   = 'Pioneer Arms Corporation is a Polish-American commercial entity that imports and assembles AK-pattern rifles for the US market using Polish military-surplus and newly manufactured components. The company name and some marketing reference the Radom factory complex, but Pioneer Arms itself is a post-Cold War commercial importer founded in the 1990s. Distinct from Fabryka Broni Radom (est. 1922), which is the actual state arms manufacturer.'
WHERE id = '1869a8ab-b484-4457-8588-f0927ed4fed1';

-- 11. Harrington & Richardson: ownership_type contradicts parent_company field
UPDATE public.manufacturers
SET ownership_type = 'Subsidiary'
WHERE name = 'Harrington & Richardson';

-- 12. L.C. Smith: fix acquisition year 1945 → 1946
UPDATE public.manufacturers
SET parent_company = 'Marlin Firearms (acquired 1946; later Remington Outdoor/Freedom Group)'
WHERE name = 'L.C. Smith';


-- ============================================================
-- SECTION 2: BACKFILL entity_type (currently 60% populated)
-- ============================================================

UPDATE public.manufacturers SET entity_type = 'Manufacturer'
WHERE entity_type IS NULL AND name ILIKE ANY(ARRAY[
  '%colt%', '%heckler%', '%sig sauer%', '%benelli%', '%armalite%',
  '%accuracy international%', '%blaser%', '%sauer%', '%anschutz%',
  '%kel-tec%', '%palmetto%', '%lwrc%', '%shadow systems%', '%b&t%',
  '%magnum research%', '%les baer%', '%wilson combat%', '%nighthawk%',
  '%staccato%', '%ed brown%', '%cooper firearms%', '%proof research%',
  '%christensen%', '%seekins%', '%aero precision%', '%daniel defense%',
  '%larue%', '%jp enterprises%', '%vudoo%', '%cadex%', '%masterpiece arms%',
  '%zermatt%', '%bighorn%', '%volquartsen%', '%standard manufacturing%',
  '%nosler%'
]);

UPDATE public.manufacturers SET entity_type = 'Brand'
WHERE entity_type IS NULL AND name ILIKE ANY(ARRAY[
  '%tikka%', '%stoeger%', '%weatherby%', '%rossi%', '%heritage%',
  '%taylor%', '%cimarron%'
]);

UPDATE public.manufacturers SET entity_type = 'Importer'
WHERE entity_type IS NULL AND name ILIKE ANY(ARRAY[
  '%century arms%', '%pioneer arms%', '%chiappa%'
]);

UPDATE public.manufacturers SET entity_type = 'Defunct Maker'
WHERE entity_type IS NULL AND active = false;


-- ============================================================
-- SECTION 3: BACKFILL known_for (currently 46% populated)
-- ============================================================

UPDATE public.manufacturers SET known_for = ARRAY['service pistols', '1911 pistols', 'revolvers', 'AR-15 platform', 'Single Action Army']
WHERE name = 'Colt' AND known_for IS NULL;

UPDATE public.manufacturers SET known_for = ARRAY['MP5 submachine gun', 'roller-delayed rifles', 'service pistols', 'VP9', 'G36']
WHERE name ILIKE '%heckler%' AND known_for IS NULL;

UPDATE public.manufacturers SET known_for = ARRAY['P226', 'P320 MHS winner', 'suppressors', 'optics', 'M17/M18 US military']
WHERE name ILIKE 'sig sauer' AND known_for IS NULL;

UPDATE public.manufacturers SET known_for = ARRAY['inertia-driven shotguns', 'M4 combat shotgun', 'waterfowl shotguns', 'Super Sport']
WHERE name ILIKE '%benelli%' AND known_for IS NULL;

UPDATE public.manufacturers SET known_for = ARRAY['AR-15 original design', 'AR-10', 'Eugene Stoner platform']
WHERE name ILIKE '%armalite%' AND known_for IS NULL;

UPDATE public.manufacturers SET known_for = ARRAY['AXMC bolt-action', 'military sniper rifles', 'AW series', 'precision chassis systems']
WHERE name ILIKE '%accuracy int%' AND known_for IS NULL;

UPDATE public.manufacturers SET known_for = ARRAY['innovative polymer designs', 'KSG bullpup shotgun', 'Sub-2000 PCC', 'PMR-30', 'P50']
WHERE name ILIKE '%kel-tec%' AND known_for IS NULL;

UPDATE public.manufacturers SET known_for = ARRAY['budget AR-15 rifles', 'high-volume US AR production', 'Dagger pistol']
WHERE name ILIKE '%palmetto%' AND known_for IS NULL;

UPDATE public.manufacturers SET known_for = ARRAY['piston-driven AR-15', 'IC-DI', 'M6 series', 'US law enforcement contracts']
WHERE name ILIKE '%lwrc%' AND known_for IS NULL;

UPDATE public.manufacturers SET known_for = ARRAY['Glock-compatible pistols', 'MR920', 'enhanced striker pistols']
WHERE name ILIKE '%shadow systems%' AND known_for IS NULL;

UPDATE public.manufacturers SET known_for = ARRAY['APC series', 'USW-A1 pistol', 'suppressor systems', 'Swiss military contracts']
WHERE name ILIKE '%b&t%' AND known_for IS NULL;

UPDATE public.manufacturers SET known_for = ARRAY['Desert Eagle', 'BFR revolver', 'semi-automatic pistols']
WHERE name ILIKE '%magnum research%' AND known_for IS NULL;

UPDATE public.manufacturers SET known_for = ARRAY['custom 1911s', 'CQB', 'Combat Grade pistols']
WHERE name ILIKE '%wilson combat%' AND known_for IS NULL;

UPDATE public.manufacturers SET known_for = ARRAY['bespoke 1911s', 'GRP', 'Talon series']
WHERE name ILIKE '%nighthawk%' AND known_for IS NULL;

UPDATE public.manufacturers SET known_for = ARRAY['2011 double-stack pistols', 'Staccato C2', 'competition carry pistols']
WHERE name ILIKE '%staccato%' AND known_for IS NULL;

UPDATE public.manufacturers SET known_for = ARRAY['premium 1911s', 'Kobra Carry', 'Special Forces model']
WHERE name ILIKE '%ed brown%' AND known_for IS NULL;

UPDATE public.manufacturers SET known_for = ARRAY['semi-custom bolt-action rifles', 'exotic calibers', 'sub-MOA guarantees']
WHERE name ILIKE '%cooper firearms%' AND known_for IS NULL;

UPDATE public.manufacturers SET known_for = ARRAY['carbon fiber barrels', 'Elevation MTR', 'ultralight precision rifles']
WHERE name ILIKE '%proof research%' AND known_for IS NULL;

UPDATE public.manufacturers SET known_for = ARRAY['carbon fiber composite rifles', 'Mesa rifle', 'Ridgeline']
WHERE name ILIKE '%christensen%' AND known_for IS NULL;

UPDATE public.manufacturers SET known_for = ARRAY['precision billet components', 'BA10 bolt-action', 'AR-15 components']
WHERE name ILIKE '%seekins%' AND known_for IS NULL;

UPDATE public.manufacturers SET known_for = ARRAY['rimfire semi-auto rifles', 'Summit', 'Ultralite', 'NRL22 competition']
WHERE name ILIKE '%volquartsen%' AND known_for IS NULL;

UPDATE public.manufacturers SET known_for = ARRAY['premium bolt-action barrels', 'Nosler partitions', 'hunting ammunition', 'Model 21 rifle']
WHERE name ILIKE '%nosler%' AND known_for IS NULL;

UPDATE public.manufacturers SET known_for = ARRAY['PRS bolt-action rifles', 'BA Lite', 'precision chassis systems']
WHERE name ILIKE '%masterpiece%' AND known_for IS NULL;

UPDATE public.manufacturers SET known_for = ARRAY['precision rifle actions', 'TL3', 'Origin action', 'ELR custom builds']
WHERE name ILIKE '%zermatt%' OR name ILIKE '%bighorn armory%' AND known_for IS NULL;


-- ============================================================
-- SECTION 4: BACKFILL notable_designers (currently 13% populated)
-- ============================================================

UPDATE public.manufacturers SET notable_designers = ARRAY['John Moses Browning', 'Eugene Stoner', 'Samuel Colt']
WHERE name = 'Colt' AND notable_designers IS NULL;

UPDATE public.manufacturers SET notable_designers = ARRAY['Helmut Weldle', 'Theodor Koch']
WHERE name ILIKE '%heckler%' AND notable_designers IS NULL;

UPDATE public.manufacturers SET notable_designers = ARRAY['Gaston Glock']
WHERE name = 'Glock' AND notable_designers IS NULL;

UPDATE public.manufacturers SET notable_designers = ARRAY['John Moses Browning', 'Dieudonné Saive']
WHERE name ILIKE '%fn herstal%' AND notable_designers IS NULL;

UPDATE public.manufacturers SET notable_designers = ARRAY['Mikhail Kalashnikov']
WHERE name ILIKE '%kalashnikov%' AND notable_designers IS NULL;

UPDATE public.manufacturers SET notable_designers = ARRAY['Eugene Stoner', 'Jim Sullivan', 'Bob Fremont']
WHERE name ILIKE '%armalite%' AND notable_designers IS NULL;

UPDATE public.manufacturers SET notable_designers = ARRAY['Emilio Ghisoni']
WHERE name ILIKE '%chiappa%' AND notable_designers IS NULL;

UPDATE public.manufacturers SET notable_designers = ARRAY['Georg Luger', 'Hugo Borchardt']
WHERE name ILIKE '%dwm%' OR name ILIKE '%deutsche waffen%';

UPDATE public.manufacturers SET notable_designers = ARRAY['Oliver Winchester', 'Benjamin Henry', 'John Moses Browning']
WHERE name ILIKE '%winchester%' AND notable_designers IS NULL;

UPDATE public.manufacturers SET notable_designers = ARRAY['William B. Ruger', 'Alexander McCormick Sturm']
WHERE name ILIKE '%ruger%' AND notable_designers IS NULL;

UPDATE public.manufacturers SET notable_designers = ARRAY['Daniel Wesson', 'Horace Smith']
WHERE name ILIKE '%smith & wesson%' AND notable_designers IS NULL;

UPDATE public.manufacturers SET notable_designers = ARRAY['Tullio Marengoni']
WHERE name ILIKE '%beretta%' AND notable_designers IS NULL;


-- ============================================================
-- SECTION 5: BACKFILL price_tier_entry_usd (currently 40% populated)
-- ============================================================

UPDATE public.manufacturers SET price_tier_entry_usd = 999
WHERE name = 'Colt' AND price_tier_entry_usd IS NULL;

UPDATE public.manufacturers SET price_tier_entry_usd = 699
WHERE name ILIKE '%heckler%' AND price_tier_entry_usd IS NULL;

UPDATE public.manufacturers SET price_tier_entry_usd = 1099
WHERE name ILIKE '%benelli%' AND price_tier_entry_usd IS NULL;

UPDATE public.manufacturers SET price_tier_entry_usd = 5500
WHERE name ILIKE '%accuracy int%' AND price_tier_entry_usd IS NULL;

UPDATE public.manufacturers SET price_tier_entry_usd = 2799
WHERE name ILIKE '%wilson combat%' AND price_tier_entry_usd IS NULL;

UPDATE public.manufacturers SET price_tier_entry_usd = 3299
WHERE name ILIKE '%nighthawk%' AND price_tier_entry_usd IS NULL;

UPDATE public.manufacturers SET price_tier_entry_usd = 1699
WHERE name ILIKE '%staccato%' AND price_tier_entry_usd IS NULL;

UPDATE public.manufacturers SET price_tier_entry_usd = 3499
WHERE name ILIKE '%les baer%' AND price_tier_entry_usd IS NULL;

UPDATE public.manufacturers SET price_tier_entry_usd = 3299
WHERE name ILIKE '%ed brown%' AND price_tier_entry_usd IS NULL;

UPDATE public.manufacturers SET price_tier_entry_usd = 2199
WHERE name ILIKE '%cooper firearms%' AND price_tier_entry_usd IS NULL;

UPDATE public.manufacturers SET price_tier_entry_usd = 2999
WHERE name ILIKE '%proof research%' AND price_tier_entry_usd IS NULL;

UPDATE public.manufacturers SET price_tier_entry_usd = 1999
WHERE name ILIKE '%christensen%' AND price_tier_entry_usd IS NULL;

UPDATE public.manufacturers SET price_tier_entry_usd = 1899
WHERE name ILIKE '%seekins%' AND price_tier_entry_usd IS NULL;

UPDATE public.manufacturers SET price_tier_entry_usd = 499
WHERE name ILIKE '%kel-tec%' AND price_tier_entry_usd IS NULL;

UPDATE public.manufacturers SET price_tier_entry_usd = 599
WHERE name ILIKE '%palmetto%' AND price_tier_entry_usd IS NULL;

UPDATE public.manufacturers SET price_tier_entry_usd = 1199
WHERE name ILIKE '%lwrc%' AND price_tier_entry_usd IS NULL;

UPDATE public.manufacturers SET price_tier_entry_usd = 799
WHERE name ILIKE '%shadow systems%' AND price_tier_entry_usd IS NULL;

UPDATE public.manufacturers SET price_tier_entry_usd = 1899
WHERE name ILIKE '%b&t%' AND price_tier_entry_usd IS NULL;

UPDATE public.manufacturers SET price_tier_entry_usd = 1649
WHERE name ILIKE '%magnum research%' AND price_tier_entry_usd IS NULL;

UPDATE public.manufacturers SET price_tier_entry_usd = 1599
WHERE name ILIKE '%volquartsen%' AND price_tier_entry_usd IS NULL;

UPDATE public.manufacturers SET price_tier_entry_usd = 899
WHERE name ILIKE '%nosler%' AND price_tier_entry_usd IS NULL;


-- ============================================================
-- SECTION 6: BACKFILL trivia (currently 26% populated)
-- ============================================================

UPDATE public.manufacturers SET trivia = 'Colt has produced more iconic American firearms than any other manufacturer — the Single Action Army, the 1911, and the original AR-15 are all Colt designs, and all three remain in active production today in various forms.'
WHERE name = 'Colt' AND trivia IS NULL;

UPDATE public.manufacturers SET trivia = 'Heckler & Koch''s founding in 1949 was enabled by two factors: the Allied occupation''s prohibition on German military firearms, which H&K circumvented by making machine tools and gauges; and former Mauser engineers who brought their precision machining expertise to the new company.'
WHERE name ILIKE '%heckler%' AND trivia IS NULL;

UPDATE public.manufacturers SET trivia = 'FN Herstal has manufactured firearms for both sides of more conflicts than any other maker. Belgian-produced FN rifles armed Allied forces in WWII; FN''s occupation-era production armed Axis forces; FN makes the M249 and M240 that arm US forces today.'
WHERE name ILIKE '%fn herstal%' AND trivia IS NULL;

UPDATE public.manufacturers SET trivia = 'SIG Sauer won the US Army Modular Handgun System competition in 2017, replacing the Beretta M9 with the P320-based M17/M18. The competitive evaluation included Glock, Beretta, FN, and S&W — SIG''s win was widely considered an upset.'
WHERE name ILIKE 'sig sauer' AND trivia IS NULL;

UPDATE public.manufacturers SET trivia = 'Benelli''s inertia-driven operating system (patented 1967) uses the recoil of the fired cartridge directly — no gas system, no pistons. The simplicity gives it fewer parts than any competing semi-automatic shotgun, and it functions reliably in conditions that foul gas-operated systems.'
WHERE name ILIKE '%benelli%' AND trivia IS NULL;

UPDATE public.manufacturers SET trivia = 'Accuracy International was co-founded by British Olympic gold medalist Malcolm Cooper, who wanted to apply precision manufacturing from Olympic target rifles to military sniper platforms. The AXMC''s predecessor, the L96A1, was adopted by the British Army in 1985 and has been in service ever since.'
WHERE name ILIKE '%accuracy int%' AND trivia IS NULL;

UPDATE public.manufacturers SET trivia = 'KelTec holds more firearms design patents per revenue dollar than almost any US manufacturer. The KSG bullpup pump shotgun (2011) holds two shells in side-by-side magazine tubes — the shooter can switch between tubes mid-sequence, enabling different load types in the same gun.'
WHERE name ILIKE '%kel-tec%' AND trivia IS NULL;

UPDATE public.manufacturers SET trivia = 'Palmetto State Armory grew from a single retail store in 2008 to producing more AR-15 lowers annually than Colt and Daniel Defense combined — demonstrating how dramatically the AR-15 market shifted toward high-volume budget production in the 2010s.'
WHERE name ILIKE '%palmetto%' AND trivia IS NULL;

UPDATE public.manufacturers SET trivia = 'Wilson Combat was founded in 1977 by Bill Wilson, who wanted to build 1911s refined beyond factory specification. Wilson''s CQB was the pistol that established the "premium production 1911" category in the 1990s — proving buyers would pay $2,000+ for a factory-built 1911 if the quality was there.'
WHERE name ILIKE '%wilson combat%' AND trivia IS NULL;

UPDATE public.manufacturers SET trivia = 'Ed Brown Products is part of the "1911 triumvirate" alongside Wilson Combat and Nighthawk Custom — the three US makers that define what a premium production 1911 is. Ed Brown''s Kobra Carry remains a benchmark for how much accuracy and reliability can be built into a 1911 frame.'
WHERE name ILIKE '%ed brown%' AND trivia IS NULL;

UPDATE public.manufacturers SET trivia = 'Volquartsen Firearms dominates the NRL22 and rimfire precision rifle competition categories the way Accuracy International dominates military sniper procurement — their Summit and Ultralite rifles are the benchmark against which all other .22 LR competition rifles are measured.'
WHERE name ILIKE '%volquartsen%' AND trivia IS NULL;

UPDATE public.manufacturers SET trivia = 'Shadow Systems was founded by former Google and Apple engineers applying Silicon Valley product development methodology to firearms — iterating rapidly on Glock-compatible designs with features and tolerances the OEM didn''t offer. The MR920 became a genuine duty pistol alternative within 3 years of the company''s founding.'
WHERE name ILIKE '%shadow systems%' AND trivia IS NULL;

UPDATE public.manufacturers SET trivia = 'B&T AG holds Swiss military and police contracts for the MP9 submachine gun and supplies SG 551/553 variants to multiple NATO and allied special operations units. Switzerland''s strict export laws make B&T''s civilian US import lineup a deliberately limited subset of their full product catalog.'
WHERE name ILIKE '%b&t%' AND trivia IS NULL;


-- ============================================================
-- SECTION 7: BACKFILL production_countries
-- ============================================================

UPDATE public.manufacturers SET production_countries = ARRAY['Austria', 'USA']
WHERE name = 'Glock';

UPDATE public.manufacturers SET production_countries = ARRAY['Belgium', 'USA']
WHERE name ILIKE '%fn herstal%';

UPDATE public.manufacturers SET production_countries = ARRAY['Germany', 'USA']
WHERE name ILIKE '%heckler%';

UPDATE public.manufacturers SET production_countries = ARRAY['Germany', 'USA']
WHERE name ILIKE 'sig sauer';

UPDATE public.manufacturers SET production_countries = ARRAY['Italy', 'USA']
WHERE name ILIKE '%beretta%' AND name NOT ILIKE '%benelli%' AND name NOT ILIKE '%sako%';

UPDATE public.manufacturers SET production_countries = ARRAY['Japan']
WHERE name ILIKE '%miroku%';

UPDATE public.manufacturers SET production_countries = ARRAY['Japan']
WHERE name IN ('Browning', 'Winchester Repeating Arms');

UPDATE public.manufacturers SET production_countries = ARRAY['Finland']
WHERE name ILIKE '%sako%' OR name ILIKE '%tikka%';

UPDATE public.manufacturers SET production_countries = ARRAY['Germany']
WHERE name ILIKE ANY(ARRAY['%walther%', '%blaser%', '%merkel%', '%heym%', '%mauser%', '%heckler%']);

UPDATE public.manufacturers SET production_countries = ARRAY['Germany', 'USA']
WHERE name ILIKE '%walther%';

UPDATE public.manufacturers SET production_countries = ARRAY['USA']
WHERE production_countries IS NULL AND country_of_origin = 'USA';

UPDATE public.manufacturers SET production_countries = ARRAY['Czech Republic']
WHERE name ILIKE ANY(ARRAY['%česká%', '%cz%']) AND production_countries IS NULL;

UPDATE public.manufacturers SET production_countries = ARRAY['Israel']
WHERE country_of_origin = 'Israel' AND production_countries IS NULL;

UPDATE public.manufacturers SET production_countries = ARRAY['Brazil']
WHERE country_of_origin = 'Brazil' AND production_countries IS NULL;

UPDATE public.manufacturers SET production_countries = ARRAY['Turkey']
WHERE country_of_origin = 'Turkey' AND production_countries IS NULL;

UPDATE public.manufacturers SET production_countries = ARRAY['Russia']
WHERE country_of_origin = 'Russia' AND production_countries IS NULL;

UPDATE public.manufacturers SET production_countries = ARRAY['Belgium']
WHERE country_of_origin = 'Belgium' AND production_countries IS NULL;

UPDATE public.manufacturers SET production_countries = ARRAY['Switzerland']
WHERE country_of_origin = 'Switzerland' AND production_countries IS NULL;

UPDATE public.manufacturers SET production_countries = ARRAY['Italy']
WHERE country_of_origin = 'Italy' AND production_countries IS NULL AND name NOT ILIKE '%beretta%';

UPDATE public.manufacturers SET production_countries = ARRAY['Spain']
WHERE country_of_origin = 'Spain' AND production_countries IS NULL;

UPDATE public.manufacturers SET production_countries = ARRAY['Poland']
WHERE country_of_origin = 'Poland' AND production_countries IS NULL;

UPDATE public.manufacturers SET production_countries = ARRAY['Romania']
WHERE country_of_origin = 'Romania' AND production_countries IS NULL;

UPDATE public.manufacturers SET production_countries = ARRAY['France']
WHERE country_of_origin = 'France' AND production_countries IS NULL;

UPDATE public.manufacturers SET production_countries = ARRAY['Argentina']
WHERE country_of_origin = 'Argentina' AND production_countries IS NULL;

-- Weatherby: German (Sauer) pre-1995, Japanese (Howa) 1995-2019, US post-2019
UPDATE public.manufacturers SET production_countries = ARRAY['USA', 'Japan']
WHERE name ILIKE '%weatherby%';


-- ============================================================
-- SECTION 8: BACKFILL collector_prestige_tier
-- ============================================================

UPDATE public.manufacturers SET collector_prestige_tier = 'Legendary'
WHERE name ILIKE ANY(ARRAY[
  '%colt%', '%winchester%', '%purdey%', '%holland & holland%',
  '%parker brothers%', '%l.c. smith%', '%dwm%', '%deutsche waffen%',
  '%singer%', '%rock-ola%'
]);

UPDATE public.manufacturers SET collector_prestige_tier = 'High'
WHERE collector_prestige_tier IS NULL AND name ILIKE ANY(ARRAY[
  '%smith & wesson%', '%browning%', '%fn herstal%', '%mauser%',
  '%walther%', '%luger%', '%remington%', '%union switch%',
  '%harrington%', '%savage arms%', '%ithaca%', '%sharps%',
  '%shiloh%', '%korth%', '%merkel%', '%heym%', '%chapuis%',
  '%manurhin%', '%anschutz%'
]);

UPDATE public.manufacturers SET collector_prestige_tier = 'Medium'
WHERE collector_prestige_tier IS NULL AND name ILIKE ANY(ARRAY[
  '%ruger%', '%mossberg%', '%beretta%', '%sig sauer%',
  '%heckler%', '%springfield%', '%glock%', '%cz%',
  '%taurus%', '%steyr%', '%fn america%', '%tikka%',
  '%sako%', '%blaser%', '%krieghoff%', '%perazzi%',
  '%magnum research%', '%accuracy int%'
]);

UPDATE public.manufacturers SET collector_prestige_tier = 'Low'
WHERE collector_prestige_tier IS NULL;


-- ============================================================
-- SECTION 9: BACKFILL signature_model (new field)
-- ============================================================

UPDATE public.manufacturers SET signature_model = 'Single Action Army' WHERE name = 'Colt';
UPDATE public.manufacturers SET signature_model = 'Model 1894' WHERE name ILIKE '%winchester%' AND name NOT ILIKE '%ammunition%';
UPDATE public.manufacturers SET signature_model = 'G17' WHERE name = 'Glock';
UPDATE public.manufacturers SET signature_model = 'Model 29 (.44 Magnum)' WHERE name ILIKE '%smith & wesson%';
UPDATE public.manufacturers SET signature_model = '10/22' WHERE name ILIKE '%ruger%';
UPDATE public.manufacturers SET signature_model = 'Model 700' WHERE name ILIKE '%remington%' AND name NOT ILIKE '%vista%' AND name NOT ILIKE '%ammo%';
UPDATE public.manufacturers SET signature_model = '500 / 590' WHERE name ILIKE '%mossberg%';
UPDATE public.manufacturers SET signature_model = 'Auto-5' WHERE name ILIKE '%browning%' AND name NOT ILIKE '%john m%';
UPDATE public.manufacturers SET signature_model = 'Browning Hi-Power' WHERE name ILIKE '%fn herstal%';
UPDATE public.manufacturers SET signature_model = 'FN SCAR' WHERE name ILIKE '%fn america%';
UPDATE public.manufacturers SET signature_model = 'P226' WHERE name ILIKE 'sig sauer';
UPDATE public.manufacturers SET signature_model = 'M9 / 92FS' WHERE name ILIKE '%beretta%' AND name NOT ILIKE '%holding%' AND name NOT ILIKE '%sako%';
UPDATE public.manufacturers SET signature_model = 'MP5' WHERE name ILIKE '%heckler%';
UPDATE public.manufacturers SET signature_model = 'PPK' WHERE name ILIKE '%walther%';
UPDATE public.manufacturers SET signature_model = 'CZ 75' WHERE name ILIKE '%česká%' OR name = 'CZ';
UPDATE public.manufacturers SET signature_model = 'M1A' WHERE name ILIKE '%springfield armory%';
UPDATE public.manufacturers SET signature_model = 'Model 99 / Model 110' WHERE name ILIKE '%savage%';
UPDATE public.manufacturers SET signature_model = 'Model 1894' WHERE name ILIKE '%marlin%';
UPDATE public.manufacturers SET signature_model = 'Custom II' WHERE name ILIKE '%kimber%';
UPDATE public.manufacturers SET signature_model = 'CQB' WHERE name ILIKE '%wilson combat%';
UPDATE public.manufacturers SET signature_model = 'GRP' WHERE name ILIKE '%nighthawk%';
UPDATE public.manufacturers SET signature_model = 'Premier II' WHERE name ILIKE '%les baer%';
UPDATE public.manufacturers SET signature_model = 'M82A1' WHERE name ILIKE '%barrett%';
UPDATE public.manufacturers SET signature_model = 'DDM4 V7' WHERE name ILIKE '%daniel defense%';
UPDATE public.manufacturers SET signature_model = 'M4E1' WHERE name ILIKE '%aero precision%';
UPDATE public.manufacturers SET signature_model = 'AK-47 / AK-74M' WHERE name ILIKE '%kalashnikov%';
UPDATE public.manufacturers SET signature_model = 'T3x' WHERE name ILIKE '%tikka%';
UPDATE public.manufacturers SET signature_model = '85' WHERE name ILIKE '%sako%';
UPDATE public.manufacturers SET signature_model = 'AXMC' WHERE name ILIKE '%accuracy int%';
UPDATE public.manufacturers SET signature_model = '.375 H&H bolt rifle' WHERE name ILIKE '%holland & holland%';
UPDATE public.manufacturers SET signature_model = 'Best Quality Sidelock O/U' WHERE name ILIKE '%purdey%';
UPDATE public.manufacturers SET signature_model = '.416 Rigby bolt rifle' WHERE name ILIKE '%rigby%';
UPDATE public.manufacturers SET signature_model = 'Model 98' WHERE name ILIKE '%mauser%';
UPDATE public.manufacturers SET signature_model = 'AUG' WHERE name ILIKE '%steyr%';
UPDATE public.manufacturers SET signature_model = 'Luger P08' WHERE name ILIKE '%dwm%' OR name ILIKE '%deutsche waffen%';
UPDATE public.manufacturers SET signature_model = 'M1911A1 (Singer contract)' WHERE name ILIKE '%singer%';
UPDATE public.manufacturers SET signature_model = 'M1 Carbine' WHERE name ILIKE '%rock-ola%';
UPDATE public.manufacturers SET signature_model = 'M1911A1 (US&S contract)' WHERE name ILIKE '%union switch%';
UPDATE public.manufacturers SET signature_model = 'Mosin-Nagant 91/30' WHERE name ILIKE '%tula%';
UPDATE public.manufacturers SET signature_model = 'Vepr-12' WHERE name ILIKE '%molot%';
UPDATE public.manufacturers SET signature_model = 'WASR-10' WHERE name ILIKE '%cugir%' OR name ILIKE '%romarm%';
UPDATE public.manufacturers SET signature_model = 'G2C' WHERE name ILIKE '%taurus%' AND name NOT ILIKE '%armas%';
UPDATE public.manufacturers SET signature_model = 'Rough Rider' WHERE name ILIKE '%heritage%';
UPDATE public.manufacturers SET signature_model = '870' WHERE name ILIKE '%remington%' AND signature_model IS NULL;
UPDATE public.manufacturers SET signature_model = 'RECCE-16' WHERE name ILIKE '%bravo company%';
UPDATE public.manufacturers SET signature_model = 'KSG' WHERE name ILIKE '%kel-tec%';
UPDATE public.manufacturers SET signature_model = 'B-14 HMR' WHERE name ILIKE '%bergara%';
UPDATE public.manufacturers SET signature_model = 'Howa 1500' WHERE name ILIKE '%howa%';
UPDATE public.manufacturers SET signature_model = 'Staccato C2' WHERE name ILIKE '%staccato%';
UPDATE public.manufacturers SET signature_model = 'Kobra Carry' WHERE name ILIKE '%ed brown%';
UPDATE public.manufacturers SET signature_model = 'Summit' WHERE name ILIKE '%volquartsen%';
UPDATE public.manufacturers SET signature_model = 'MR73' WHERE name ILIKE '%manurhin%';
UPDATE public.manufacturers SET signature_model = 'Model 74 / Model 1874' WHERE name ILIKE '%shiloh%' OR name ILIKE '%sharps%';
UPDATE public.manufacturers SET signature_model = 'TRG-22' WHERE name ILIKE '%sako%' AND signature_model IS NULL;
UPDATE public.manufacturers SET signature_model = 'Stribog SP9A1' WHERE name ILIKE '%grand power%';
UPDATE public.manufacturers SET signature_model = 'Desert Eagle Mark XIX' WHERE name ILIKE '%magnum research%';
UPDATE public.manufacturers SET signature_model = 'CDX-30 Tremor' WHERE name ILIKE '%cadex%';
UPDATE public.manufacturers SET signature_model = 'BA Lite' WHERE name ILIKE '%masterpiece%';
UPDATE public.manufacturers SET signature_model = 'TL3 SA' WHERE name ILIKE '%zermatt%';
UPDATE public.manufacturers SET signature_model = 'Scorpio Thor' WHERE name ILIKE '%victrix%';
UPDATE public.manufacturers SET signature_model = 'SAS II' WHERE name ILIKE '%bul armory%';
UPDATE public.manufacturers SET signature_model = 'APC9' WHERE name ILIKE '%b&t%';
UPDATE public.manufacturers SET signature_model = 'IC-DI' WHERE name ILIKE '%lwrc%';
UPDATE public.manufacturers SET signature_model = 'MR920' WHERE name ILIKE '%shadow systems%';
UPDATE public.manufacturers SET signature_model = 'Dagger' WHERE name ILIKE '%palmetto%';
