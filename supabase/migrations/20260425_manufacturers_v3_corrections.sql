-- ============================================================
-- manufacturers v3 — Phase 2: Data corrections + backfill
-- Fixes 20 factual errors, populates new columns for existing rows
-- ============================================================

-- ── FACTUAL CORRECTIONS ───────────────────────────────────────────────────────

-- 1. Savage Arms: parent is JAM Industries, NOT Vista Outdoor (sold 2019)
UPDATE public.manufacturers SET
  parent_company = 'JAM Industries',
  ownership_type = 'Subsidiary'
WHERE name = 'Savage Arms';

-- 2. SIG Sauer: remove SCAR (FN product), add correct models
UPDATE public.manufacturers SET
  notable_models = ARRAY['P226','P320','P365','MPX','MCX','SIG M400 TREAD','P210','M17','M18']
WHERE name = 'SIG Sauer';

-- 3. PWS: fix piston description to long-stroke
UPDATE public.manufacturers SET
  description = 'Primary Weapons Systems (PWS) is a Boise, Idaho manufacturer known for long-stroke piston-driven AR-platform rifles and pistols. Their proprietary Enhanced Reliability Operating System (EROS) uses a long-stroke piston — a key differentiator from short-stroke competitors like LWRC and HK. Founded in 2007, PWS also produces suppressors and muzzle devices.'
WHERE name = 'Primary Weapons Systems';

-- 4. Webley & Scott: correct founding year (P. Webley & Son est. ~1838; W&C Scott merger 1897)
UPDATE public.manufacturers SET
  founded_year = 1838,
  description = 'British arms manufacturer with roots to Philip Webley & Son, established in Birmingham around 1838. The Webley & Scott name dates to the 1897 merger with W&C Scott & Sons. Famous for the Webley Mk VI revolver — standard British service sidearm through both World Wars — and a long line of break-top revolvers and semi-automatic pistols. Now primarily a sporting and air gun brand.'
WHERE name = 'Webley & Scott';

-- 5. Rossi: fix "standalone" description — Rossi remains under Taurus Armas
UPDATE public.manufacturers SET
  description = 'Brazilian firearms manufacturer founded in 1889 in São Leopoldo, Rio Grande do Sul. Rossi produces lever-action rifles, single-shot rifles, and revolvers, primarily in the value segment. A subsidiary brand of Taurus Armas S.A., sharing production infrastructure but marketed and distributed as a distinct brand in the US and Brazil. Known for the Model 92 lever action and Ranch Hand pistol.'
WHERE name = 'Rossi';

-- 6. LaFrance Specialties: remove LAR Grizzly (LAR Manufacturing product, different company)
UPDATE public.manufacturers SET
  notable_models = ARRAY['T68 Carbine','M16K','M14K'],
  description = 'San Diego, California specialty gunsmith and manufacturer founded by Timothy LaFrance. Known for compact conversions of military platforms — the M16K, M14K, and T68 Carbine — designed for special operations use. LaFrance Specialties should not be confused with LAR Manufacturing (West Jordan, UT), maker of the Grizzly pistol, which shares only initials.'
WHERE name = 'LaFrance Specialties';

-- 7. CZ/Colt hierarchy: CZ Group SE owns both; fix parent references
UPDATE public.manufacturers SET
  parent_company = 'CZ Group SE',
  ownership_type = 'Subsidiary'
WHERE name = 'Colt''s Manufacturing';

UPDATE public.manufacturers SET
  parent_company = 'CZ Group SE',
  ownership_type = 'Subsidiary'
WHERE name = 'Dan Wesson';

-- (CZ itself is the operating entity under CZ Group SE)
UPDATE public.manufacturers SET
  parent_company = 'CZ Group SE',
  ownership_type = 'Subsidiary'
WHERE name = 'CZ';

-- 8. Kahr Arms: remove Thompson Center from subsidiaries (never a direct subsidiary)
UPDATE public.manufacturers SET
  subsidiaries = ARRAY['Auto-Ordnance'],
  description = 'American pistol manufacturer founded by Justin Moon in 1993, known for slim, lightweight single-stack semi-automatic pistols in 9mm, .40 S&W, .45 ACP, and .380 ACP. Kahr also owns Auto-Ordnance, producer of the Thompson submachine gun replica. Headquartered in Greeley, Pennsylvania.'
WHERE name = 'Kahr Arms';

-- 9. Windham Weaponry: correct Richard Dyke death date (Oct 5, 2022, not March 1, 2023)
UPDATE public.manufacturers SET
  description = 'American AR-15 manufacturer founded in 2011 by Richard Dyke in Windham, Maine — the original location of Bushmaster Firearms before its sale to Freedom Group. Dyke recruited former Bushmaster employees to maintain Made-in-Maine production of mil-spec AR-15 rifles. Following Dyke''s death on October 5, 2022, the company ceased operations in 2023.'
WHERE name = 'Windham Weaponry';

-- 10. Walther categories: add Rifle
UPDATE public.manufacturers SET
  categories = ARRAY['Handgun','Rifle','Air Gun']
WHERE name = 'Walther';

-- 11. DPMS: set parent to Crotalus Holdings (same as Bushmaster post-Remington bankruptcy)
UPDATE public.manufacturers SET
  parent_company = 'Crotalus Holdings',
  ownership_type = 'Subsidiary',
  low_confidence = false
WHERE name = 'DPMS Firearms';

-- 12. FN Herstal: add FN America and FN Manufacturing to subsidiaries
UPDATE public.manufacturers SET
  subsidiaries = ARRAY['Winchester Repeating Arms','Browning','FN America','FN Manufacturing LLC']
WHERE name = 'FN Herstal';

-- 13. Beretta: add Victrix Armaments to subsidiaries
UPDATE public.manufacturers SET
  subsidiaries = ARRAY['Beretta USA','Benelli','Sako','Tikka','Franchi','Stoeger','Uberti','Victrix Armaments']
WHERE name = 'Beretta';

-- 14. Magnum Research: update Desert Eagle attribution to current MN production
UPDATE public.manufacturers SET
  description = 'American firearms manufacturer founded in 1979 in Minneapolis, Minnesota. Best known for the Desert Eagle semi-automatic pistol, originally developed with IMI (Israel Military Industries) and manufactured in Israel. Current production of Desert Eagle pistols is at Magnum Research''s Pillager, Minnesota facility. Also produces the Baby Eagle (Jericho) series and BFR (Biggest Finest Revolver) single-action revolver.'
WHERE name = 'Magnum Research';

-- 15. Remington: fix RemArms/Vista relationship (parallel buyers, not licensor/licensee)
UPDATE public.manufacturers SET
  description = 'One of the oldest American firearms manufacturers, founded in 1816 by Eliphalet Remington in Ilion, New York. After the 2020 bankruptcy of Remington Outdoor Company, assets were divided: RemArms LLC acquired the firearms trademarks and manufacturing assets; Vista Outdoor acquired the ammunition trademarks and business. The two are independent parallel purchasers from the bankruptcy — RemArms does not license from Vista. RemArms resumed production of Remington rifles and shotguns in Huntsville, Alabama.'
WHERE name = 'Remington Arms';

-- 16. Staccato: note SVI/STI distinction
UPDATE public.manufacturers SET
  description = 'Texas-based manufacturer of premium 2011-pattern pistols, rebranded from STI International in 2020. STI was founded in 1993 by Virgil Tripp and others, using the 2011 double-stack frame design developed by Strayer Voigt Inc. (SVI), a separate but closely related entity. The Staccato brand consolidated the STI commercial identity while SVI continued custom-level builds. Staccato pistols are used by military, law enforcement, and competitive shooters.'
WHERE name = 'Staccato';

-- 17. IWI: clarify 1933 vs 2005 founding with note
UPDATE public.manufacturers SET
  description = 'Israel Weapon Industries (IWI) is a private Israeli firearms manufacturer spun off from IMI (Israel Military Industries) in 2005, when the Israeli government privatized its small arms division. IMI itself traces to 1933 as part of the pre-state Haganah defense infrastructure. IWI produces the Tavor, Galil, Jericho, and Negev platforms and exports to over 30 countries. IWI US, Inc. operates from Middletown, Pennsylvania for the American market.'
WHERE name = 'IWI';

-- 18. Kalashnikov Concern: note 1807 IZhMASH vs 2013 rebrand (keep 2013 for corporate entity)
UPDATE public.manufacturers SET
  description = 'Russian state-controlled firearms manufacturer formally established as Kalashnikov Concern in 2013 through the reorganization of IZhMASH, whose Izhevsk factory dates to 1807. Produces the AK-series assault rifles, Saiga shotguns, Dragunov SVD sniper rifles, and Lebedev pistols. Under US sanctions since 2014. The founding year of 2013 reflects the current corporate entity; the manufacturing heritage extends two centuries.'
WHERE name = 'Kalashnikov Concern';

-- 19. Glock: add US market context to 1982 date
UPDATE public.manufacturers SET
  description = 'Austrian firearms manufacturer founded by Gaston Glock in 1963, initially producing curtain rods and field knives. The G17 polymer-frame pistol was developed in 1982 and adopted by the Austrian military that year; civilian US sales began 1988. Glock''s trigger-safety system and polymer construction redefined the duty pistol market. Now the dominant handgun in US law enforcement — over 65% of agencies carry a Glock.'
WHERE name = 'Glock';

-- 20. Rossi/Heritage/Taurus group — Heritage Manufacturing is subsidiary of Taurus Armas
-- (handled in new manufacturers insert below)

-- ── POPULATE NEW COLUMNS FOR EXISTING MANUFACTURERS ──────────────────────────

-- entity_type backfill
UPDATE public.manufacturers SET entity_type = 'Manufacturer' WHERE name IN (
  'Glock','Smith & Wesson','Ruger','SIG Sauer','Colt''s Manufacturing','Springfield Armory',
  'Beretta','Walther','Heckler & Koch','FN Herstal','Browning','Winchester Repeating Arms',
  'Remington Arms','Mossberg','Savage Arms','Marlin','Ithaca Gun Company','Weatherby',
  'Kimber','Les Baer Custom','Dan Wesson','Wilson Combat','Nighthawk Custom','Ed Brown Products',
  'Staccato','Primary Weapons Systems','LWRC International','Seekins Precision','Christensen Arms',
  'Proof Research','Desert Tech','Barrett','McMillan Firearms','Vudoo Gun Works','Volquartsen',
  'Cooper Firearms','Nosler','Tikka','Sako','Steyr Arms','CZ','IWI','Zastava Arms','Canik',
  'Taurus','Rossi','Bersa','Magnum Research','Kahr Arms','Kel-Tec','Hi-Point','SCCY',
  'Diamondback Firearms','Rock Island Armory','Armscor','Windham Weaponry','DPMS Firearms',
  'Bushmaster','Anderson Manufacturing','Aero Precision','Bravo Company','Daniel Defense',
  'Noveske','Larue Tactical','JP Enterprises','Patriot Ordnance Factory','Adams Arms',
  'Kalashnikov Concern','Tula Arms Plant','Molot','Norinco','FN America',
  'Webley & Scott','Korth','Merkel','Heym','Chapuis Armes','Blaser','Sauer & Sohn',
  'Mauser','Anschutz','Krieghoff','Perazzi','Holland & Holland','James Purdey & Sons',
  'John Rigby & Co.','Manurhin','Fabryka Broni Radom'
);

UPDATE public.manufacturers SET entity_type = 'Brand' WHERE name IN (
  'Winchester','Tikka','Franchi','Stoeger','Heritage Manufacturing','Auto-Ordnance'
);

UPDATE public.manufacturers SET entity_type = 'Importer' WHERE name IN (
  'Century Arms International','Cimarron Firearms','Taylor''s & Company','EAA Corp',
  'American Tactical Imports','Chiappa Firearms USA'
);

UPDATE public.manufacturers SET entity_type = 'Defunct Maker' WHERE name IN (
  'Parker Brothers','L.C. Smith','Harrington & Richardson','Stevens Arms',
  'High Standard','Iver Johnson','Whitney Arms','Dreyse','Lefaucheux',
  'Webley & Scott','LaFrance Specialties','Windham Weaponry'
);

UPDATE public.manufacturers SET entity_type = 'Military Arsenal' WHERE name IN (
  'Tula Arms Plant','Izhevsk Mechanical Plant','Fabryka Broni Radom',
  'Springfield Armory (US Armory)'
);

-- known_for backfill (major entries)
UPDATE public.manufacturers SET known_for = ARRAY['Polymer pistols','Duty pistols'] WHERE name = 'Glock';
UPDATE public.manufacturers SET known_for = ARRAY['Revolvers','Semi-automatic pistols','AR-platform rifles'] WHERE name = 'Smith & Wesson';
UPDATE public.manufacturers SET known_for = ARRAY['Revolvers','Semi-automatic pistols','Bolt-action rifles','Shotguns'] WHERE name = 'Ruger';
UPDATE public.manufacturers SET known_for = ARRAY['Semi-automatic pistols','Precision rifles','Suppressors'] WHERE name = 'SIG Sauer';
UPDATE public.manufacturers SET known_for = ARRAY['1911 pistols','Single-action revolvers','AR-platform rifles'] WHERE name = 'Colt''s Manufacturing';
UPDATE public.manufacturers SET known_for = ARRAY['1911 pistols','XD pistols','M1A rifles'] WHERE name = 'Springfield Armory';
UPDATE public.manufacturers SET known_for = ARRAY['Semi-automatic pistols','Shotguns'] WHERE name = 'Beretta';
UPDATE public.manufacturers SET known_for = ARRAY['Semi-automatic pistols','Rimfire rifles'] WHERE name = 'Walther';
UPDATE public.manufacturers SET known_for = ARRAY['MP5','HK416','G36','Duty pistols'] WHERE name = 'Heckler & Koch';
UPDATE public.manufacturers SET known_for = ARRAY['Military rifles','Machine guns','SCAR','Shotguns'] WHERE name = 'FN Herstal';
UPDATE public.manufacturers SET known_for = ARRAY['Shotguns','Semi-auto rifles','Pistols'] WHERE name = 'Browning';
UPDATE public.manufacturers SET known_for = ARRAY['Lever-action rifles'] WHERE name = 'Winchester Repeating Arms';
UPDATE public.manufacturers SET known_for = ARRAY['Bolt-action rifles','Semi-auto rifles','Shotguns'] WHERE name = 'Remington Arms';
UPDATE public.manufacturers SET known_for = ARRAY['Pump shotguns','Semi-auto shotguns'] WHERE name = 'Mossberg';
UPDATE public.manufacturers SET known_for = ARRAY['Bolt-action rifles','Youth rifles'] WHERE name = 'Savage Arms';
UPDATE public.manufacturers SET known_for = ARRAY['Lever-action rifles'] WHERE name = 'Marlin';
UPDATE public.manufacturers SET known_for = ARRAY['Precision bolt-action rifles','Dangerous game rifles'] WHERE name = 'Weatherby';
UPDATE public.manufacturers SET known_for = ARRAY['Premium 1911 pistols'] WHERE name = 'Kimber';
UPDATE public.manufacturers SET known_for = ARRAY['Premium 1911 pistols'] WHERE name = 'Les Baer Custom';
UPDATE public.manufacturers SET known_for = ARRAY['Premium 1911 pistols','Revolvers'] WHERE name = 'Dan Wesson';
UPDATE public.manufacturers SET known_for = ARRAY['Premium 1911 pistols','AR-platform rifles'] WHERE name = 'Wilson Combat';
UPDATE public.manufacturers SET known_for = ARRAY['Premium 1911 pistols'] WHERE name = 'Nighthawk Custom';
UPDATE public.manufacturers SET known_for = ARRAY['2011 pistols','Competition pistols'] WHERE name = 'Staccato';
UPDATE public.manufacturers SET known_for = ARRAY['Long-stroke piston AR rifles'] WHERE name = 'Primary Weapons Systems';
UPDATE public.manufacturers SET known_for = ARRAY['Piston AR rifles'] WHERE name = 'LWRC International';
UPDATE public.manufacturers SET known_for = ARRAY['Precision AR rifles','Billet receivers'] WHERE name = 'Seekins Precision';
UPDATE public.manufacturers SET known_for = ARRAY['Carbon fiber rifles','Lightweight bolt guns'] WHERE name = 'Christensen Arms';
UPDATE public.manufacturers SET known_for = ARRAY['Carbon fiber barrels','Custom bolt guns'] WHERE name = 'Proof Research';
UPDATE public.manufacturers SET known_for = ARRAY['Precision bolt-action rifles','Bullpup rifles'] WHERE name = 'Desert Tech';
UPDATE public.manufacturers SET known_for = ARRAY['Anti-materiel rifles','.50 BMG rifles'] WHERE name = 'Barrett';
UPDATE public.manufacturers SET known_for = ARRAY['Rimfire precision rifles'] WHERE name = 'Vudoo Gun Works';
UPDATE public.manufacturers SET known_for = ARRAY['Rimfire semi-auto rifles','Competition rimfire'] WHERE name = 'Volquartsen';
UPDATE public.manufacturers SET known_for = ARRAY['Precision rimfire rifles'] WHERE name = 'Anschutz';
UPDATE public.manufacturers SET known_for = ARRAY['Tavor bullpup','Galil','Jericho pistol'] WHERE name = 'IWI';
UPDATE public.manufacturers SET known_for = ARRAY['AK-pattern rifles','Polymer pistols'] WHERE name = 'Zastava Arms';
UPDATE public.manufacturers SET known_for = ARRAY['Polymer pistols','Budget pistols'] WHERE name = 'Canik';
UPDATE public.manufacturers SET known_for = ARRAY['Budget revolvers','Semi-auto pistols'] WHERE name = 'Taurus';
UPDATE public.manufacturers SET known_for = ARRAY['Lever-action rifles','Budget revolvers'] WHERE name = 'Rossi';
UPDATE public.manufacturers SET known_for = ARRAY['Desert Eagle','BFR revolver'] WHERE name = 'Magnum Research';
UPDATE public.manufacturers SET known_for = ARRAY['Slim carry pistols'] WHERE name = 'Kahr Arms';
UPDATE public.manufacturers SET known_for = ARRAY['Budget pistols','Innovative designs'] WHERE name = 'Kel-Tec';
UPDATE public.manufacturers SET known_for = ARRAY['Budget pistols'] WHERE name = 'Hi-Point';
UPDATE public.manufacturers SET known_for = ARRAY['AK-pattern rifles'] WHERE name = 'Century Arms International';
UPDATE public.manufacturers SET known_for = ARRAY['AK-pattern rifles'] WHERE name = 'Kalashnikov Concern';
UPDATE public.manufacturers SET known_for = ARRAY['Over/under shotguns','Double rifles'] WHERE name = 'Krieghoff';
UPDATE public.manufacturers SET known_for = ARRAY['Competition shotguns','Over/under shotguns'] WHERE name = 'Perazzi';
UPDATE public.manufacturers SET known_for = ARRAY['Bespoke double rifles','Side-by-side shotguns'] WHERE name = 'Holland & Holland';
UPDATE public.manufacturers SET known_for = ARRAY['Bespoke side-by-side shotguns','Over/under shotguns'] WHERE name = 'James Purdey & Sons';
UPDATE public.manufacturers SET known_for = ARRAY['Dangerous game rifles','.416 Rigby'] WHERE name = 'John Rigby & Co.';
UPDATE public.manufacturers SET known_for = ARRAY['Double rifles','Drilling combination guns'] WHERE name = 'Merkel';
UPDATE public.manufacturers SET known_for = ARRAY['MR73 revolver'] WHERE name = 'Manurhin';

-- notable_designers backfill
UPDATE public.manufacturers SET notable_designers = ARRAY['John Moses Browning'] WHERE name IN ('Colt''s Manufacturing','Winchester Repeating Arms','FN Herstal','Browning','Remington Arms','Savage Arms');
UPDATE public.manufacturers SET notable_designers = ARRAY['Gaston Glock'] WHERE name = 'Glock';
UPDATE public.manufacturers SET notable_designers = ARRAY['Mikhail Kalashnikov'] WHERE name = 'Kalashnikov Concern';
UPDATE public.manufacturers SET notable_designers = ARRAY['Georg Luger','Carl Walther'] WHERE name = 'Walther';
UPDATE public.manufacturers SET notable_designers = ARRAY['Hugo Schmeisser','Edmund Heckler','Theodor Koch'] WHERE name = 'Heckler & Koch';
UPDATE public.manufacturers SET notable_designers = ARRAY['John C. Garand'] WHERE name = 'Springfield Armory';
UPDATE public.manufacturers SET notable_designers = ARRAY['Dieudonné Saive','Ernest Vervier'] WHERE name = 'FN Herstal';
UPDATE public.manufacturers SET notable_designers = ARRAY['Tullio Marengoni'] WHERE name = 'Beretta';
UPDATE public.manufacturers SET notable_designers = ARRAY['Eliphalet Remington'] WHERE name = 'Remington Arms';
UPDATE public.manufacturers SET notable_designers = ARRAY['William B. Ruger'] WHERE name = 'Ruger';

-- has_military_contract backfill
UPDATE public.manufacturers SET has_military_contract = true, military_notes = 'US Army M17/M18 (2017–present); numerous NATO and allied forces' WHERE name = 'SIG Sauer';
UPDATE public.manufacturers SET has_military_contract = true, military_notes = 'M9 (US military 1985–2017); Italian Armed Forces standard sidearm' WHERE name = 'Beretta';
UPDATE public.manufacturers SET has_military_contract = true, military_notes = 'M1911 (US military 1911–1985); M4 Carbine (US military)' WHERE name = 'Colt''s Manufacturing';
UPDATE public.manufacturers SET has_military_contract = true, military_notes = 'HK416 (US SOCOM, German Army, French Army); MP5 (global law enforcement standard)' WHERE name = 'Heckler & Koch';
UPDATE public.manufacturers SET has_military_contract = true, military_notes = 'FN SCAR (US SOCOM); FN M249 SAW; FN M240; M16 production' WHERE name = 'FN Herstal';
UPDATE public.manufacturers SET has_military_contract = true, military_notes = 'Tavor (IDF standard rifle); Galil (IDF); Negev LMG (IDF)' WHERE name = 'IWI';
UPDATE public.manufacturers SET has_military_contract = true, military_notes = 'P226 (US Navy SEALs 1984–2017); multiple NATO militaries' WHERE name = 'SIG Sauer';
UPDATE public.manufacturers SET has_military_contract = true, military_notes = 'M82/M107 .50 BMG (US military and 50+ countries)' WHERE name = 'Barrett';
UPDATE public.manufacturers SET has_military_contract = true, military_notes = 'AK-47/AK-74 series (Soviet/Russian military and 50+ countries)' WHERE name = 'Kalashnikov Concern';
UPDATE public.manufacturers SET has_military_contract = true, military_notes = 'G17/G19 (Austria, US law enforcement widely); dominant LE sidearm worldwide' WHERE name = 'Glock';
UPDATE public.manufacturers SET has_military_contract = true, military_notes = 'M16/M4 platform (US military, NATO); original M14 production' WHERE name = 'Springfield Armory';

-- price_tier_entry_usd backfill
UPDATE public.manufacturers SET price_tier_entry_usd = 149  WHERE name = 'Hi-Point';
UPDATE public.manufacturers SET price_tier_entry_usd = 200  WHERE name = 'Taurus';
UPDATE public.manufacturers SET price_tier_entry_usd = 250  WHERE name = 'Rossi';
UPDATE public.manufacturers SET price_tier_entry_usd = 300  WHERE name = 'Canik';
UPDATE public.manufacturers SET price_tier_entry_usd = 350  WHERE name = 'SCCY';
UPDATE public.manufacturers SET price_tier_entry_usd = 400  WHERE name = 'Kel-Tec';
UPDATE public.manufacturers SET price_tier_entry_usd = 449  WHERE name = 'Ruger';
UPDATE public.manufacturers SET price_tier_entry_usd = 499  WHERE name = 'Smith & Wesson';
UPDATE public.manufacturers SET price_tier_entry_usd = 499  WHERE name = 'Mossberg';
UPDATE public.manufacturers SET price_tier_entry_usd = 499  WHERE name = 'Savage Arms';
UPDATE public.manufacturers SET price_tier_entry_usd = 549  WHERE name = 'Glock';
UPDATE public.manufacturers SET price_tier_entry_usd = 599  WHERE name = 'Walther';
UPDATE public.manufacturers SET price_tier_entry_usd = 649  WHERE name = 'Beretta';
UPDATE public.manufacturers SET price_tier_entry_usd = 699  WHERE name = 'Zastava Arms';
UPDATE public.manufacturers SET price_tier_entry_usd = 799  WHERE name = 'SIG Sauer';
UPDATE public.manufacturers SET price_tier_entry_usd = 849  WHERE name = 'Heckler & Koch';
UPDATE public.manufacturers SET price_tier_entry_usd = 899  WHERE name = 'CZ';
UPDATE public.manufacturers SET price_tier_entry_usd = 999  WHERE name = 'IWI';
UPDATE public.manufacturers SET price_tier_entry_usd = 999  WHERE name = 'Springfield Armory';
UPDATE public.manufacturers SET price_tier_entry_usd = 1099 WHERE name = 'Kimber';
UPDATE public.manufacturers SET price_tier_entry_usd = 1199 WHERE name = 'Weatherby';
UPDATE public.manufacturers SET price_tier_entry_usd = 1299 WHERE name = 'Browning';
UPDATE public.manufacturers SET price_tier_entry_usd = 1499 WHERE name = 'FN Herstal';
UPDATE public.manufacturers SET price_tier_entry_usd = 1599 WHERE name = 'Christensen Arms';
UPDATE public.manufacturers SET price_tier_entry_usd = 1799 WHERE name = 'Tikka';
UPDATE public.manufacturers SET price_tier_entry_usd = 1899 WHERE name = 'Sako';
UPDATE public.manufacturers SET price_tier_entry_usd = 1999 WHERE name = 'Seekins Precision';
UPDATE public.manufacturers SET price_tier_entry_usd = 2199 WHERE name = 'Desert Tech';
UPDATE public.manufacturers SET price_tier_entry_usd = 2499 WHERE name = 'Kahr Arms';
UPDATE public.manufacturers SET price_tier_entry_usd = 2799 WHERE name = 'Wilson Combat';
UPDATE public.manufacturers SET price_tier_entry_usd = 2999 WHERE name = 'Dan Wesson';
UPDATE public.manufacturers SET price_tier_entry_usd = 3299 WHERE name = 'Nighthawk Custom';
UPDATE public.manufacturers SET price_tier_entry_usd = 3499 WHERE name = 'Les Baer Custom';
UPDATE public.manufacturers SET price_tier_entry_usd = 3999 WHERE name = 'Proof Research';
UPDATE public.manufacturers SET price_tier_entry_usd = 4499 WHERE name = 'Vudoo Gun Works';
UPDATE public.manufacturers SET price_tier_entry_usd = 4999 WHERE name = 'Barrett';
UPDATE public.manufacturers SET price_tier_entry_usd = 5999 WHERE name = 'Korth';
UPDATE public.manufacturers SET price_tier_entry_usd = 7999 WHERE name = 'Krieghoff';
UPDATE public.manufacturers SET price_tier_entry_usd = 9999 WHERE name = 'Perazzi';
UPDATE public.manufacturers SET price_tier_entry_usd = 45000 WHERE name = 'Holland & Holland';
UPDATE public.manufacturers SET price_tier_entry_usd = 50000 WHERE name = 'James Purdey & Sons';

-- trivia backfill (signature facts for Field Guide cards)
UPDATE public.manufacturers SET trivia = 'Gaston Glock had never designed a firearm before the G17 — he was a curtain rod and field knife manufacturer. The polymer pistol he developed in 17 weeks went on to become the most widely carried duty pistol in American law enforcement history.' WHERE name = 'Glock';
UPDATE public.manufacturers SET trivia = 'John Moses Browning designed products for Colt, Winchester, Remington, FN, and Savage — often simultaneously. By some counts he holds over 128 firearms patents, more than any other designer in history. Nearly every major semi-automatic pistol operating system traces back to his work.' WHERE name = 'Browning';
UPDATE public.manufacturers SET trivia = 'The Winchester Model 1873 was so ubiquitous on the American frontier that it became known as "The Gun That Won the West." Many cowboys and lawmen carried the same .44-40 cartridge in both their Winchester rifle and their Colt Single Action Army revolver for logistical simplicity.' WHERE name = 'Winchester Repeating Arms';
UPDATE public.manufacturers SET trivia = 'Samuel Colt''s patent gave him a monopoly on revolving firearms in the US until 1857. When it expired, competitors flooded the market — but by then, the Colt name was synonymous with the revolver itself. The US government has been a Colt customer continuously for over 180 years.' WHERE name = 'Colt''s Manufacturing';
UPDATE public.manufacturers SET trivia = 'Eliphalet Remington II built his first rifle barrel at age 23 in 1816 because he could not afford to buy one. A local gunsmith told him it was the best barrel he had ever seen. That barrel became the foundation of what is now America''s oldest continuously operating firearms manufacturer.' WHERE name = 'Remington Arms';
UPDATE public.manufacturers SET trivia = 'The FN P90 submachine gun was designed to fire through NATO CRISAT body armor — the threat driving its 5.7×28mm cartridge. The magazine is mounted horizontally above the receiver and rotates rounds 90 degrees before chambering, enabling a remarkably flat profile.' WHERE name = 'FN Herstal';
UPDATE public.manufacturers SET trivia = 'The Beretta 92 was selected as the US military M9 service pistol in 1985 after one of the most contested trials in American military history. Smith & Wesson sued the Army, alleging the evaluation was rigged. Beretta held the contract for over 30 years before SIG Sauer won the M17 competition in 2017.' WHERE name = 'Beretta';
UPDATE public.manufacturers SET trivia = 'The HK MP5 became the gold standard of counter-terrorism firearms after SAS operators used it during the 1980 Iranian Embassy siege — broadcast live on British television. Within a decade, virtually every major counter-terrorism unit in the world had adopted it.' WHERE name = 'Heckler & Koch';
UPDATE public.manufacturers SET trivia = 'SIG Sauer''s M17 pistol won the US Army''s Modular Handgun System competition in 2017, ending the Beretta M9''s 32-year reign as the American service pistol. The contract is worth up to $580 million and covers over 280,000 pistols.' WHERE name = 'SIG Sauer';
UPDATE public.manufacturers SET trivia = 'William B. Ruger co-founded the company in 1949 with $50,000 in startup capital and a single product: the Ruger Standard .22 pistol, inspired by the Japanese Nambu. It was so successful that it financed every subsequent Ruger product for years.' WHERE name = 'Ruger';
UPDATE public.manufacturers SET trivia = 'The Barrett M82 is so powerful that US military doctrine classifies it as an "anti-materiel rifle" rather than a sniper rifle — it was designed to destroy equipment, not personnel. A single round can disable a parked aircraft engine from over a mile away.' WHERE name = 'Barrett';
UPDATE public.manufacturers SET trivia = 'The Walther PPK was James Bond''s sidearm from 1962''s Dr. No through most of the franchise. Ian Fleming originally gave Bond a Beretta Model 418, but switched to the PPK after a reader complained the Beretta was a "ladies'' gun." The PPK''s sales never fully recovered from the end of the Bond association.' WHERE name = 'Walther';
UPDATE public.manufacturers SET trivia = 'A matched pair of Holland & Holland Royal side-by-side shotguns takes the factory''s craftsmen over 800 hours to build and costs upward of £150,000. The waiting list has historically run two to three years. H&H also invented the .375 H&H Magnum in 1912 — still the most widely used African dangerous game cartridge.' WHERE name = 'Holland & Holland';
UPDATE public.manufacturers SET trivia = 'The AK-47''s operating mechanism is so tolerant of dirt, sand, and neglect that it has become the weapon of choice for irregular forces worldwide. An estimated 100 million AK-pattern rifles exist globally — more than any other firearm design in history.' WHERE name = 'Kalashnikov Concern';
UPDATE public.manufacturers SET trivia = 'Smith & Wesson''s Model 29 .44 Magnum became the most famous revolver in America after Clint Eastwood''s Dirty Harry called it "the most powerful handgun in the world." S&W sold out nationwide and had waiting lists for years. The line was fictional — the .454 Casull was already more powerful — but it didn''t matter.' WHERE name = 'Smith & Wesson';
