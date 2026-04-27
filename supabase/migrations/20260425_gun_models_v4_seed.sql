-- ============================================================
-- gun_models v4 — Phase 3: New model entries
-- ~38 models: Tier 1 critical gaps + Tier 2 Field Guide completeness
-- ============================================================

INSERT INTO public.gun_models (
  make, model, caliber, type, action, capacity, year_introduced,
  discontinued, country_of_origin, description, msrp_usd,
  weight_oz_unloaded, overall_length_in,
  military_use, law_enforcement_use, notable_variants,
  production_status, platform_family, caliber_options, model_aliases,
  era, trigger_type, intended_use, trivia, country_of_manufacture,
  is_collectible, collector_notes
) VALUES

-- ============================================================
-- TIER 1: CRITICAL GAPS
-- ============================================================

(
  'No Standard Manufacturer', 'M1 Garand', '.30-06 Springfield',
  'Rifle', 'Semi-Auto', 8, 1936,
  true, 'USA',
  'The M1 Garand was the first semi-automatic rifle adopted as the standard infantry weapon of any nation. Designed by John Garand at Springfield Armory, it served as the primary US infantry rifle in WWII and Korea. General George Patton called it "the greatest battle implement ever devised." The 8-round en bloc clip ejects with a distinctive metallic ping when empty. Manufactured by Springfield Armory (the government facility), Winchester Repeating Arms, International Harvester, H&R Arms, and others. Approximately 5.4 million produced. Still legal for civilian purchase through the Civilian Marksmanship Program.',
  NULL, 576.0, 43.6,
  true, false,
  ARRAY['National Match M1', 'M1C', 'M1D (sniper)'],
  'Discontinued', 'M1 Garand', NULL,
  ARRAY['m1 garand', 'm1', 'garand', 'grand', 'm-1'],
  'World War II', 'Single-Stage',
  ARRAY['military', 'collector', 'historical', 'hunting'],
  'General Patton called the M1 Garand "the greatest battle implement ever devised." It was the first standard-issue semi-automatic military rifle in the world — US infantry outpaced every other major power in volume of fire from the first day of WWII.',
  'USA', true,
  'Springfield Armory (government) production is most common. Winchester-made examples command collector premium. "International Harvester" receiver markings are particularly sought. All-matching components and correct stock cartouches are primary value factors. National Match variants are valued by target shooters.'
),

(
  'No Standard Manufacturer', 'M1903 Springfield', '.30-06 Springfield',
  'Rifle', 'Bolt', 5, 1903,
  true, 'USA',
  'The M1903 Springfield was the primary US infantry rifle of WWI and early WWII, before being superseded by the M1 Garand in frontline service. The rifle is based on the Mauser 98 action — so closely that Springfield Armory paid royalties to Mauser until WWI interrupted payments. The M1903A3 (1942) simplified production with stamped components. The M1903A4 with Weaver 330 scope was the US standard sniper rifle through the Korean War. Springfield Armory, Remington, and Smith Corona all produced variants.',
  NULL, 608.0, 43.2,
  true, false,
  ARRAY['M1903A1', 'M1903A3', 'M1903A4 (sniper)'],
  'Discontinued', 'Springfield 1903', NULL,
  ARRAY['m1903', '1903 springfield', 'springfield 1903', '03', 'aught-three'],
  'World War I', 'Single-Stage',
  ARRAY['military', 'collector', 'historical'],
  'The M1903 is based so closely on the Mauser 98 that Springfield Armory paid patent royalties to Mauser — until WWI made that awkward. The US essentially adopted a German action as the standard American infantry rifle.',
  'USA', true,
  'Pre-1918 "double-heat-treated" receiver receivers are brittle and potentially dangerous to fire. Receivers numbered below 800,000 (Springfield) or 285,507 (Rock Island) should be inspected before use. M1903A4 sniper variants are among the most collectible American military bolt-action rifles.'
),

(
  'Browning', 'Auto-5', '12 Gauge',
  'Shotgun', 'Semi-Auto', 5, 1902,
  false, 'Belgium',
  'John Browning''s first semi-automatic shotgun and arguably the most historically important shotgun ever made. The long-recoil operating system Browning patented in 1900 became the basis for virtually all long-recoil semi-automatic shotguns that followed. Manufactured by FN Herstal in Belgium (1902-1975) and later in Japan by Miroku for Browning Arms. Also licensed to Remington (Model 11), Savage (Model 720), and others. In continuous production in some form for nearly a century. The modern Browning A5 reintroduction (2012) uses an inertia system and is mechanically unrelated. Original production ran until 1998.',
  1799.0, 131.2, 49.5,
  false, false,
  ARRAY['Light 12', 'Magnum 12', '20 Gauge', 'Sweet 16 (16 ga)', 'A5 Hunter', 'A5 Wicked Wing'],
  'Active', 'Auto-5',
  ARRAY['12 Gauge', '16 Gauge', '20 Gauge'],
  ARRAY['auto-5', 'a5', 'auto 5', 'humpback', 'browning a5', 'sweet 16'],
  'Pre-WWI / Old West', 'Single-Stage',
  ARRAY['hunting', 'collector', 'historical', 'competition'],
  'The Browning Auto-5 was in continuous production from 1902 to 1998 — 96 years — making it the longest-running semi-automatic firearm in history. The distinctive "humpback" receiver is one of the most recognizable firearm profiles ever designed.',
  'Japan (Miroku)', true,
  'Original Belgian FN production (pre-1975) is most collectible, especially pre-WWII examples. German-occupation FN production (1940-44) with Nazi proof marks is a distinct sub-collector market. Grade designations (Standard, Special, Skeet, Trap) affect value. The "Sweet Sixteen" (16 gauge) is particularly prized.'
),

(
  'Browning', 'Hi-Power', '9mm',
  'Pistol', 'Semi-Auto', 13, 1935,
  false, 'Belgium',
  'Designed by John Browning (who died before its completion) and finished by FN engineer Dieudonné Saive, the Hi-Power was the first modern high-capacity pistol. Its 13-round magazine capacity was double that of contemporary service pistols. Adopted by over 55 nations and used by both Allied and Axis forces simultaneously in WWII — FN produced it for Wehrmacht use under German occupation while the same design was produced by John Inglis & Company in Canada for Allied forces. The tilting-barrel Browning linkless cam system influenced virtually every subsequent service pistol design. Browning Arms sold the commercial version in the US. Production of the original design resumed by Springfield Armory in 2023.',
  699.0, 32.0, 7.75,
  true, true,
  ARRAY['Hi-Power Standard', 'Hi-Power Practical', 'Hi-Power Tangent Sight', 'GP35', 'HP-DA'],
  'Active', 'Hi-Power',
  ARRAY['9mm', '.40 S&W'],
  ARRAY['hi-power', 'high power', 'hp35', 'gp35', 'p-35', 'browning hi power', 'bda'],
  'Interwar', 'Single-Action',
  ARRAY['military', 'duty', 'collector', 'historical'],
  'The Browning Hi-Power served on both sides of WWII simultaneously — Germany used FN''s occupied Belgian factory to produce it for Wehrmacht troops, while Canada''s Inglis & Company produced the same design for Allied forces, including British SOE operatives.',
  'Belgium', true,
  'Belgian FN production is standard. Canadian Inglis production with tangent rear sight is highly collectible. WWII-era examples are identified by proof marks and manufacturing codes. Post-WWII Belgian commercial production continued until 2018. The Springfield Armory SA-35 (2023) is a modern reproduction.'
),

(
  'Winchester', 'Model 12', '12 Gauge',
  'Shotgun', 'Pump', 6, 1912,
  true, 'USA',
  'The Winchester Model 12 was the first truly successful hammerless pump-action shotgun and the dominant American pump shotgun from its introduction until the Remington 870 eclipsed it in sales in the 1950s. Over 2 million produced between 1912 and 1963. Called "The Perfect Repeater" — the machined steel receiver and tight manufacturing tolerances gave it a smoothness of operation unmatched by any pump shotgun before or since. Used in both World Wars as the "Trench Gun" with bayonet lug and heat shield. Available in 12, 16, 20, and 28 gauge. Winchester briefly reintroduced it (1972-1980) before definitively discontinuing.',
  NULL, 150.4, 48.0,
  true, false,
  ARRAY['Model 12 Field', 'Model 12 Trap', 'Model 12 Skeet', 'Model 12 Pigeon Grade', 'Model 12 Trench Gun'],
  'Discontinued', 'Winchester Model 12', NULL,
  ARRAY['model 12', 'winchester 12', 'perfect repeater', 'm12', 'win 12'],
  'Pre-WWI / Old West', 'Single-Stage',
  ARRAY['hunting', 'collector', 'historical', 'competition'],
  'The Winchester Model 12 was called "The Perfect Repeater" — its internal hammer design and machined steel construction gave it an action smoothness that modern pump shotguns with stamped components have never replicated.',
  'USA', true,
  'Pre-WWII (pre-1941) examples are most collectible. Pigeon Grade and Diamond Grade shotguns with engraving are rare and valuable. Trench Gun variants with bayonet lug and heat shield command military collector premium. All original finish examples in excellent condition are significantly more valuable than refinished guns.'
),

(
  'Weatherby', 'Mark V', '.300 Weatherby Magnum',
  'Rifle', 'Bolt', 4, 1958,
  false, 'USA',
  'The Weatherby Mark V is the flagship bolt-action rifle of Weatherby, the company that Roy Weatherby founded to promote his high-velocity cartridge philosophy. The nine-lug action was engineered specifically to handle the extreme pressures of Weatherby Magnum cartridges. The Mark V was manufactured in Germany by J.P. Sauer & Sohn until 1995, then in Japan by Howa, then in the US after Weatherby moved its headquarters from California to Wyoming in 2019. Offered in more Weatherby proprietary Magnum cartridges than any competing bolt-action. The Accumark variant with fluted barrel and composite stock is the modern flagship configuration.',
  2699.0, 176.0, 46.5,
  false, false,
  ARRAY['Mark V Accumark', 'Mark V Deluxe', 'Mark V Lazermark', 'Mark V Terramark', 'Mark V Backcountry'],
  'Active', 'Weatherby Mark V',
  ARRAY['.240 Weatherby Mag', '.257 Weatherby Mag', '.270 Weatherby Mag', '7mm Weatherby Mag',
        '.300 Weatherby Mag', '.340 Weatherby Mag', '.378 Weatherby Mag', '.416 Weatherby Mag', '.460 Weatherby Mag'],
  ARRAY['mark v', 'weatherby mark 5', 'mk v'],
  'Cold War', 'Single-Stage',
  ARRAY['hunting_big_game', 'hunting', 'precision_rifle'],
  'The Weatherby Mark V''s nine-lug bolt design provides 54 degrees of bolt throw — less than half the 90-degree rotation of a standard Mauser-pattern action — allowing faster cycling without lifting the cheek from the stock.',
  'USA (Sheridan, WY)', false, NULL
),

(
  'Smith & Wesson', 'Model 19', '.357 Magnum',
  'Revolver', 'Revolver', 6, 1957,
  false, 'USA',
  'The Smith & Wesson Model 19 "Combat Magnum" was developed at the request of Bill Jordan, the US Border Patrol officer and gunfighter whose book "No Second Place Winner" became a classic of handgun lore. Jordan wanted a lighter .357 Magnum revolver than the N-frame Model 27 — the result was a K-frame (medium) sized revolver that dominated US law enforcement for two decades. Became the standard police service revolver in departments across America through the 1960s-1980s. The stainless steel version is the Model 66. Discontinued in 1999, reintroduced in 2019.',
  799.0, 35.5, 9.5,
  false, true,
  ARRAY['Model 19-3', 'Model 19-4', 'Model 66 (stainless)', 'Combat Magnum'],
  'Active', 'S&W K-Frame',
  ARRAY['.357 Magnum', '.38 Special'],
  ARRAY['model 19', 'sw 19', 's&w 19', 'combat magnum', 'k-frame 357'],
  'Cold War', 'Double-Action',
  ARRAY['duty', 'home_defense', 'collector', 'hunting'],
  'The S&W Model 19 "Combat Magnum" was the standard police service revolver in America for two decades. Virtually every law enforcement officer who carried a revolver in the 1970s trained on or carried a Model 19 or its stainless successor, the Model 66.',
  'USA', true,
  'Pre-1982 examples (before internal lock introduction in later years) preferred by collectors. 4" barrel is the most common law enforcement configuration. 2.5" snub-nose variants are rarer and command premium. The Model 66 (stainless) shares the same frame and is separately collected.'
),

(
  'Smith & Wesson', 'Model 27', '.357 Magnum',
  'Revolver', 'Revolver', 6, 1935,
  false, 'USA',
  'The Smith & Wesson Model 27 is the original .357 Magnum revolver — the gun that created the Magnum era in handguns. Introduced in 1935 as the ".357 Magnum" (before model numbers were used), it was the most powerful production handgun in the world at introduction. Built on S&W''s N-frame (large) with extensive hand-finishing and polishing — early examples were essentially bespoke firearms. FBI Director J. Edgar Hoover ordered one of the first examples. The revolver that defined what a premium American handgun could be.',
  999.0, 41.0, 9.625,
  false, false,
  ARRAY['5-screw pre-Model 27', '4-screw transition', 'Model 27-2', 'Model 27-3', '3.5" Registered Magnum'],
  'Active', 'S&W N-Frame',
  ARRAY['.357 Magnum', '.38 Special'],
  ARRAY['model 27', 'sw 27', 's&w 27', 'registered magnum', 'n-frame 357'],
  'Interwar', 'Double-Action',
  ARRAY['collector', 'hunting', 'home_defense'],
  'The S&W Model 27 created the Magnum era. When introduced in 1935, it was the most powerful production handgun in the world — and S&W charged accordingly, hand-fitting and polishing each example. Early "Registered Magnums" came with a certificate noting the individual revolver''s specifications.',
  'USA', true,
  '"Registered Magnums" (pre-1938, individually documented) are among the most valuable production revolvers. The transition from 5-screw to 4-screw to 3-screw frames marks distinct collector generations. Pre-Model 27 ".357 Magnum" marked (before 1957 model numbers) examples command premium.'
),

(
  'Smith & Wesson', 'Model 500', '.500 S&W Magnum',
  'Revolver', 'Revolver', 5, 2003,
  false, 'USA',
  'The Smith & Wesson Model 500 fires the .500 S&W Magnum cartridge, the most powerful production revolver cartridge in the world at the time of introduction. Purpose-built around the X-frame — a new, larger-than-N-frame platform developed specifically for this cartridge. Capable of taking any land animal on Earth, including dangerous game. The compensated barrel and aggressive recoil pad are necessary features, not options — uncushioned shooting is described as painful. A genuine engineering achievement as much as a firearm; the X-frame required new manufacturing tooling and new steel alloys.',
  1329.0, 272.0, 15.0,
  false, false,
  ARRAY['Model 500 4"', 'Model 500 6.5"', 'Model 500 8.375"', 'Model 500ES (Emergency Survival)', 'Model 460 XVR'],
  'Active', 'S&W X-Frame',
  ARRAY['.500 S&W Magnum'],
  ARRAY['model 500', 'sw 500', 's&w 500', '500 magnum', 'x-frame', '.500 sw'],
  'Modern', 'Double-Action',
  ARRAY['hunting_big_game', 'collector'],
  'The S&W Model 500 fires the most powerful production revolver cartridge in the world. A full-power .500 S&W Magnum round generates more muzzle energy than a .30-06 rifle cartridge — in a handgun.',
  'USA', false, NULL
),

(
  'Ruger', 'Blackhawk', '.357 Magnum',
  'Revolver', 'Revolver', 6, 1955,
  false, 'USA',
  'The Ruger Blackhawk is the standard single-action revolver of the modern era — Ruger''s answer to the Colt Single Action Army at a fraction of the price, with modern metallurgy capable of handling contemporary ammunition. Introduced in 1955 alongside the .357 Magnum Blackhawk, the platform expanded to .44 Magnum, .45 Colt, .30 Carbine, and others. The "New Model" Blackhawk (1973) added a transfer bar safety, making it drop-safe — an improvement the original Colt SAA never received. More Blackhawks are in active use for hunting, cowboy action shooting, and general use than any other single-action revolver platform.',
  699.0, 42.0, 10.5,
  false, false,
  ARRAY['New Model Blackhawk', 'Blackhawk Convertible', 'New Vaquero', 'Bisley Blackhawk', 'Flattop (original)'],
  'Active', 'Ruger Blackhawk',
  ARRAY['.357 Magnum', '.44 Magnum', '.45 Colt', '.30 Carbine', '9mm', '.45 ACP'],
  ARRAY['blackhawk', 'ruger blackhawk', 'new model blackhawk', 'nmb'],
  'Cold War', 'Single-Action',
  ARRAY['hunting', 'hunting_big_game', 'collector', 'competition'],
  'The Ruger Blackhawk (1973 New Model) was the first major American revolver to incorporate a transfer bar safety, making it genuinely drop-safe. The original Colt SAA — still in production today — has never received this safety upgrade.',
  'USA', false, NULL
),

(
  'Sako', '85', '.308 Winchester',
  'Rifle', 'Bolt', 5, 2006,
  false, 'Finland',
  'The Sako 85 is the flagship bolt-action rifle of Sako, Finland''s premier firearms manufacturer. The 85 replaced the beloved Model 75 and features an interchangeable trigger unit, detachable box magazine, and three-position safety. Available in five action sizes from XS (22 LR) to XXL (large Magnums), the platform covers more cartridge options than virtually any other bolt-action family. The controlled-round-feed mechanism and cold-hammer-forged barrel are standard across the line. Manufactured at Sako''s factory in Riihimäki, Finland. Used as the basis for the TRG sniper rifle series. Now owned by Beretta Holding.',
  1699.0, 144.0, 44.0,
  false, false,
  ARRAY['85 Hunter', '85 Grey Wolf', '85 Carbon Light', '85 Kodiak', '85 Varmint', '85 Black Bear'],
  'Active', 'Sako 85',
  ARRAY['.243 Win', '.260 Rem', '6.5 Creedmoor', '.308 Win', '.30-06', '7mm Rem Mag', '.300 Win Mag', '.375 H&H'],
  ARRAY['sako 85', 'sako85', 'model 85'],
  'Modern', 'Single-Stage',
  ARRAY['hunting', 'hunting_big_game', 'precision_rifle'],
  'The Sako 85 is the only production bolt-action rifle that is offered in five different action sizes (XS through XXL) with a fully interchangeable trigger unit — the same trigger unit physically swaps across all action sizes.',
  'Finland', false, NULL
),

(
  'Sako', 'TRG-22', '.308 Winchester',
  'Rifle', 'Bolt', 10, 1999,
  false, 'Finland',
  'The Sako TRG-22 is one of the world''s premier production precision sniper/target rifles, in service with military and police units across Europe and beyond. The folding chassis stock, adjustable cheekpiece, and two-stage trigger are optimized for precision long-range shooting. The TRG-42 variant is chambered in .338 Lapua Magnum. Finnish Border Guard, Estonian Defence Forces, Irish Army Ranger Wing, and numerous other European military units use TRG variants as standard sniper platforms. The cold-hammer-forged barrel and extremely consistent action are primary accuracy contributors.',
  4299.0, 256.0, 47.2,
  true, true,
  ARRAY['TRG-22 A1', 'TRG-42', 'TRG-42 A1', 'TRG-M10 (multi-caliber)'],
  'Active', 'Sako TRG',
  ARRAY['.308 Winchester', '6.5 Creedmoor'],
  ARRAY['trg-22', 'trg22', 'sako trg', 'trg 22'],
  'Modern', 'Two-Stage',
  ARRAY['precision_rifle', 'military', 'competition'],
  'The Sako TRG-22 is the standard sniper rifle of the Finnish Border Guard and several other European military and law enforcement units. Its bolt design provides a 60-degree bolt throw — compared to 90 degrees for most hunting rifles — for faster cycling without moving the shooting hand.',
  'Finland', false, NULL
),

(
  'Bergara', 'B-14 HMR', '6.5 Creedmoor',
  'Rifle', 'Bolt', 5, 2016,
  false, 'Spain',
  'The Bergara B-14 HMR (Hunting and Match Rifle) is widely regarded as the best value precision bolt-action rifle on the market, regularly recommended alongside rifles costing twice as much. The B-14 action uses a two-lug design with a mini-Mauser claw extractor and cold-hammer-forged barrel from Bergara''s barrel manufacturing operation. The HMR''s polymer chassis stock with mini-chassis system provides AR-compatible pistol grip and adjustable comb. The trigger is adjustable from 2.5 to 3.5 lbs from the factory. Consistently sub-MOA accuracy guarantee from the factory. Bergara barrels are used by many other premium rifle makers.',
  939.0, 179.2, 46.75,
  false, false,
  ARRAY['B-14 HMR Wilderness', 'B-14 Timber', 'B-14 Squared Wilderness', 'B-14R (rimfire)'],
  'Active', 'Bergara B-14',
  ARRAY['6.5 Creedmoor', '.308 Win', '.300 Win Mag', '6mm Creedmoor', '.450 Bushmaster', '.22-250 Rem'],
  ARRAY['b-14 hmr', 'b14 hmr', 'bergara hmr', 'b14'],
  'Modern', 'Two-Stage',
  ARRAY['precision_rifle', 'hunting', 'competition'],
  'Bergara makes barrels for many of the world''s most respected rifle manufacturers, including Blaser, Desert Tech, and GA Precision — then uses the same manufacturing capability in their own rifles at a fraction of the price.',
  'Spain (Eibar)', false, NULL
),

-- ============================================================
-- TIER 2: FIELD GUIDE COMPLETENESS
-- ============================================================

(
  'Browning', 'Citori', '12 Gauge',
  'Shotgun', 'Break-Action', 2, 1973,
  false, 'Japan',
  'The Browning Citori has been the dominant American over/under shotgun for competition and hunting since its introduction. Produced by Miroku in Japan under Browning''s specifications, the Citori offers European-quality over/under mechanics at a significantly lower price than comparable Belgian or Italian guns. The receiver''s back-bored barrels and Invector-Plus choke system became industry standards. Used extensively in skeet, trap, and sporting clays competition at all levels. The 725 series (2012) introduced a lower receiver profile reducing felt recoil.',
  2069.0, 192.0, 47.0,
  false, false,
  ARRAY['Citori 725', 'Citori 725 Sporting', 'Citori CXS', 'Citori Gran Lightning', 'White Lightning', 'XT Trap'],
  'Active', 'Browning Citori',
  ARRAY['12 Gauge', '20 Gauge', '28 Gauge', '.410 Bore'],
  ARRAY['citori', 'browning citori', 'browning o/u', 'browning ou'],
  'Cold War', 'Single-Stage',
  ARRAY['competition', 'hunting'],
  'The Browning Citori has been produced continuously since 1973 by Miroku of Japan — one of the longest-running over/under production runs in firearms history, making it the benchmark for what a Japanese-made premium shotgun can achieve.',
  'Japan (Miroku)', false, NULL
),

(
  'Browning', 'X-Bolt', '.30-06 Springfield',
  'Rifle', 'Bolt', 4, 2008,
  false, 'Japan',
  'The Browning X-Bolt is Browning''s flagship bolt-action hunting rifle, replacing the A-Bolt series in 2008. Produced by Miroku in Japan, the X-Bolt features a 60-degree bolt throw, detachable rotary magazine, and the Feather Trigger system factory-adjustable from 3-5 lbs. The Inflex Technology recoil pad and Dura-Touch armor coating are standard across the line. The X-Bolt Pro series adds carbon fiber composite stock and full fluting for mountain hunting use. Available in more than 40 chamberings across multiple stock configurations.',
  899.0, 160.0, 44.75,
  false, false,
  ARRAY['X-Bolt Hunter', 'X-Bolt Pro', 'X-Bolt Hell''s Canyon', 'X-Bolt Target', 'X-Bolt Max Long Range', 'X-Bolt Speed'],
  'Active', 'Browning X-Bolt',
  ARRAY['.243 Win', '6.5 Creedmoor', '.308 Win', '.30-06', '7mm Rem Mag', '.300 Win Mag', '.300 PRC', '.28 Nosler'],
  ARRAY['x-bolt', 'xbolt', 'browning x bolt'],
  'Modern', 'Single-Stage',
  ARRAY['hunting', 'hunting_big_game', 'precision_rifle'],
  'The Browning X-Bolt''s 60-degree bolt throw — half of the 90 degrees used in most hunting rifles — allows the shooter to cycle the bolt without significantly breaking cheek weld, enabling faster follow-up shots on moving game.',
  'Japan (Miroku)', false, NULL
),

(
  'Beretta', '686 Silver Pigeon', '12 Gauge',
  'Shotgun', 'Break-Action', 2, 1985,
  false, 'Italy',
  'The Beretta 686 Silver Pigeon is one of the world''s best-selling over/under shotguns and the entry point into Beretta''s premier over/under line. The boxlock action with monobloc construction has proven exceptionally durable — the 686 action design has survived decades of high-volume competition use. The Silver Pigeon I is the standard model; higher grades (Silver Pigeon III, IV, V) add engraving. Widely used for sporting clays, skeet, trap, and upland bird hunting. The most commonly seen over/under in American clay target courses after the Browning Citori.',
  1999.0, 169.6, 47.25,
  false, false,
  ARRAY['Silver Pigeon I', 'Silver Pigeon III', 'Silver Pigeon V', '686 E', 'Ultralight', '686 Onyx'],
  'Active', 'Beretta 680 Series',
  ARRAY['12 Gauge', '20 Gauge', '28 Gauge', '.410 Bore'],
  ARRAY['686', 'silver pigeon', 'beretta 686', '686 sp', 'sp1'],
  'Cold War', 'Single-Stage',
  ARRAY['competition', 'hunting'],
  'The Beretta 686 action is tested to 40,000 rounds before release — a durability standard that reflects its competition heritage. Professional sporting clays shooters regularly put 100,000+ rounds through a single 686 action before replacement.',
  'Italy', false, NULL
),

(
  'Glock', 'G29', '10mm Auto',
  'Pistol', 'Semi-Auto', 10, 1997,
  false, 'Austria',
  'The Glock G29 is the subcompact 10mm Auto Glock, offering the ballistic performance of the G20 in a more concealable package. The 10mm Auto was originally designed to duplicate the terminal performance of the .357 Magnum in a semi-automatic pistol. The G29 accepts G20 magazines for extended capacity. Popular among backcountry hikers and hunters in bear country as a lightweight defensive option. Compatible with 15-round G20 magazines.',
  637.0, 24.69, 6.77,
  false, false, ARRAY['G29 Gen4', 'G29 Gen5', 'G29SF'],
  'Active', 'Glock Subcompact', ARRAY['10mm Auto', '.40 S&W'],
  ARRAY['g29', 'glock 29', 'glock29'],
  'Modern', 'Striker-Fired',
  ARRAY['concealed_carry', 'home_defense', 'hunting'],
  'The G29 in 10mm Auto is popular with backcountry hunters and hikers as a bear defense sidearm — the 10mm cartridge generates enough energy to reliably penetrate a grizzly skull, in a pistol compact enough to carry all day on the trail.',
  'USA (Smyrna, GA)', false, NULL
),

(
  'Glock', 'G30', '.45 ACP',
  'Pistol', 'Semi-Auto', 10, 1997,
  false, 'Austria',
  'The Glock G30 is the subcompact .45 ACP Glock, competing directly with the Colt Officer''s Model 1911 for the concealed carry .45 ACP market. The G30 accepts G21 13-round magazines for extended capacity. The G30S (Short Frame) uses the G30 slide on the thinner SF frame. Popular among .45 ACP loyalists who want Glock reliability in a carry-sized package.',
  637.0, 26.81, 6.96,
  false, false, ARRAY['G30 Gen4', 'G30S', 'G30SF'],
  'Active', 'Glock Subcompact', ARRAY['.45 ACP'],
  ARRAY['g30', 'glock 30', 'glock30', 'g30s'],
  'Modern', 'Striker-Fired',
  ARRAY['concealed_carry', 'home_defense'],
  'The G30 offers .45 ACP in Glock''s subcompact footprint — making a compelling comparison to the Colt Officer''s Model 1911 that carries fewer rounds, weighs more when loaded, and costs significantly more.',
  'USA (Smyrna, GA)', false, NULL
),

(
  'Glock', 'G40 MOS', '10mm Auto',
  'Pistol', 'Semi-Auto', 15, 2015,
  false, 'Austria',
  'The Glock G40 MOS is the long-slide 10mm Auto Glock, featuring a 6.02" barrel for increased velocity and a longer sight radius. The MOS (Modular Optic System) cut allows direct optic mounting without an adapter plate. The G40 is the preferred hunting pistol for long-range handgun hunters using 10mm, capable of meaningful accuracy improvements over the G20 at extended ranges.',
  745.0, 43.20, 8.07,
  false, false, ARRAY['G40 Gen4 MOS', 'G40 Gen5 MOS'],
  'Active', 'Glock Long Slide', ARRAY['10mm Auto'],
  ARRAY['g40', 'glock 40', 'glock40', 'g40 mos'],
  'Modern', 'Striker-Fired',
  ARRAY['hunting', 'competition', 'home_defense'],
  'The G40 in 10mm is used by some handgun hunters to take deer and hogs at distances that would be marginal for other pistols. The 6" barrel extracts meaningful additional velocity from the 10mm cartridge compared to standard 4.6" G20 barrels.',
  'USA (Smyrna, GA)', false, NULL
),

(
  'Glock', 'G41 MOS', '.45 ACP',
  'Pistol', 'Semi-Auto', 13, 2014,
  false, 'Austria',
  'The Glock G41 MOS is the long-slide .45 ACP competition Glock, featuring a 5.31" barrel and MOS optic system. The longer slide provides a longer sight radius and reduced felt recoil compared to the G21. Built for USPSA Single Stack and IDPA ESP competition use. The combination of .45 ACP power with Glock reliability and the MOS optic mounting system made it popular in competitive shooting before the proliferation of red dot-equipped striker pistols.',
  745.0, 41.28, 8.9,
  false, false, ARRAY['G41 Gen4 MOS'],
  'Active', 'Glock Long Slide', ARRAY['.45 ACP'],
  ARRAY['g41', 'glock 41', 'glock41', 'g41 mos'],
  'Modern', 'Striker-Fired',
  ARRAY['competition', 'home_defense'],
  'The G41 was Glock''s first production pistol designed specifically for competition — introduced in 2014 as an entry into the USPSA Single Stack and Limited divisions where .45 ACP has scoring advantages.',
  'USA (Smyrna, GA)', false, NULL
),

(
  'Ruger', 'Ruger-57', '5.7x28mm',
  'Pistol', 'Semi-Auto', 20, 2020,
  false, 'USA',
  'The Ruger-57 is one of the few non-FN pistols chambered in 5.7x28mm, competing directly with the FN Five-seveN at a significantly lower price point. The 5.7x28mm cartridge was designed by FN to penetrate NATO CRISAT body armor — civilian ammunition is not AP-capable but retains the flat trajectory and low recoil of the original design. The Ruger-57 features a manual safety, fiber optic front sight, and Picatinny rail. The 20-round magazine capacity gives it significant capacity for a pistol in a larger-than-9mm cartridge.',
  799.0, 24.5, 8.65,
  false, false, ARRAY['Ruger-57 Pro (optics ready)'],
  'Active', 'Ruger-57', ARRAY['5.7x28mm'],
  ARRAY['ruger 57', 'ruger57', '5.7 ruger', 'r57'],
  'Modern', 'Striker-Fired',
  ARRAY['home_defense', 'competition'],
  'The Ruger-57 offers the FN Five-seveN''s 5.7x28mm cartridge at roughly 40% lower MSRP. The Five-seveN''s pistol was designed specifically for the 5.7 round; the Ruger-57 proves the cartridge can function reliably in a more conventional pistol architecture.',
  'USA', false, NULL
),

(
  'Walther', 'PPK', '.380 ACP',
  'Pistol', 'Semi-Auto', 6, 1931,
  false, 'Germany',
  'The Walther PPK (Polizeipistole Kriminalmodell — "Detective Model") is the compact version of the Walther PP, introduced in 1931 for plainclothes police use. The PPK is 18mm shorter than the PP with a smaller grip frame. Made globally famous as James Bond''s sidearm from 1962''s Dr. No onward — a choice that defined the cultural image of the spy pistol for 60 years. Used by German police, SS officers, Luftwaffe pilots, and later as a standard German service pistol before modern replacements. The PPK/S was the US import variant (combining PPK slide with PP frame to meet GCA 1968 requirements). Current production by Walther in Fort Smith, Arkansas.',
  749.0, 20.8, 6.1,
  true, true,
  ARRAY['PPK/S', 'PPK Stainless', 'PPK/S Stainless', 'PPK First Edition'],
  'Active', 'Walther PP Series',
  ARRAY['.380 ACP', '.32 ACP', '.22 LR'],
  ARRAY['ppk', 'walther ppk', 'james bond gun', 'polizeipistole', 'pp kriminal'],
  'Interwar', 'DA/SA',
  ARRAY['concealed_carry', 'collector', 'historical'],
  'The Walther PPK''s selection as James Bond''s pistol in Dr. No (1962) came from a reader letter to Ian Fleming suggesting the Beretta Bond had been carrying was implausible for a secret agent. The PPK appeared in every Bond film for the next 36 years.',
  'USA (Fort Smith, AR)', true,
  'Pre-WWII German commercial production (Zella-Mehlis, later Ulm) is most collectible, especially Nazi-era military-marked examples. French Manurhin production (post-WWII, under license) is a distinct collector category. Matching magazine is important for collector value.'
),

(
  'Auto-Ordnance', 'Thompson M1A1', '45 ACP',
  'Rifle', 'Semi-Auto', 30, 1942,
  false, 'USA',
  'The Thompson submachine gun is one of the most iconic American firearms in history. The Auto-Ordnance M1A1 is the semi-automatic reproduction of the WWII-standard M1A1 configuration, the simplified version of John T. Thompson''s original design manufactured for wartime production speed. The original Thompson M1928 used by gangsters and Prohibition-era law enforcement gave way to the M1 and M1A1 variants with simpler construction. Auto-Ordnance (owned by Kahr Arms) produces semi-automatic reproductions for the civilian market in both M1 and M1928 configurations. The "Tommy Gun" remains one of the most recognizable American firearms of the 20th century.',
  1279.0, 256.0, 31.9,
  true, true,
  ARRAY['M1928A1', 'M1', 'M1A1', 'Chicago Typewriter', 'Persuader', 'Annihilator'],
  'Active', 'Thompson', NULL,
  ARRAY['thompson', 'tommy gun', 'm1a1', 'thompson submachine gun', 'chicago typewriter', 'trench broom'],
  'World War II', 'Single-Stage',
  ARRAY['collector', 'historical'],
  'The Thompson submachine gun earned the nickname "Chicago Typewriter" from its association with 1920s organized crime — but it was the Prohibition-era gangsters who first made it famous. The US military adopted it for WWII after initially rejecting it as too heavy and expensive.',
  'USA', true,
  'Original WWII Thompson M1A1s are NFA-registered machine guns worth $30,000-$50,000+. Semi-automatic reproductions by Auto-Ordnance are the only legal civilian option without an NFA license. Drum magazines for the M1928 pattern are separately collected.'
),

(
  'Winchester', 'Model 1897', '12 Gauge',
  'Shotgun', 'Pump', 6, 1897,
  true, 'USA',
  'The Winchester Model 1897 was the first truly successful repeating pump-action shotgun and the direct ancestor of modern pump shotguns. Designed by John Browning, the external hammer and exposed trigger allowed "slam fire" — the trigger could be held and the gun would fire with each pump stroke. Used as the US military "Trench Gun" in WWI with bayonet lug and heat shield over the barrel. German forces complained that the use of the shotgun in trench warfare violated the laws of war — a protest the US military rejected. Approximately 1 million produced from 1897 to 1957.',
  NULL, 160.0, 49.5,
  true, false,
  ARRAY['Model 1897 Trench Gun', 'Model 1897 Riot Gun', 'Model 1897 Field Grade', 'Model 97'],
  'Discontinued', 'Winchester 1897', NULL,
  ARRAY['model 97', 'winchester 97', 'm97', '1897', 'trench gun'],
  'Pre-WWI / Old West', 'Single-Stage',
  ARRAY['collector', 'historical'],
  'The Winchester Model 1897''s external hammer design allowed "slam fire" — holding the trigger back while working the action would fire with each pump stroke. Germany protested its WWI use as a violation of the laws of war; the US Army disagreed.',
  'USA', true,
  'Trench Gun variants with original bayonet lug and heat shield are the most collectible. Pre-WWI production in original condition is rare and valuable. The transition from Model 1893 to 1897 is documented by serial number ranges. All-original "takedown" models are separately collected.'
),

(
  'Colt', 'King Cobra', '.357 Magnum',
  'Revolver', 'Revolver', 6, 1986,
  false, 'USA',
  'The Colt King Cobra is a .357 Magnum revolver on Colt''s larger I-frame, distinct from the smaller D-frame Cobra. The original King Cobra was produced from 1986 to 1998. Colt reintroduced the King Cobra in 2019 with a new, modernized design featuring a stainless finish, rubber grip, and 3" barrel. The reintroduced King Cobra fills the gap between the compact Cobra (.38 Special) and the larger Python (.357 Magnum), offering the Python''s caliber in a slightly smaller and more affordable package.',
  899.0, 28.8, 8.25,
  false, false,
  ARRAY['King Cobra Target', 'King Cobra Carry', 'Anaconda'],
  'Active', 'Colt I-Frame', ARRAY['.357 Magnum', '.38 Special'],
  ARRAY['king cobra', 'colt king cobra', 'kc', 'colt kc'],
  'Cold War', 'Double-Action',
  ARRAY['home_defense', 'duty', 'collector'],
  'The 2019 Colt King Cobra reintroduction marked Colt''s first new revolver model in over 20 years — part of the broader Colt revolver renaissance that also brought back the Python in 2020.',
  'USA', false, NULL
),

(
  'Chiappa', 'Rhino', '.357 Magnum',
  'Revolver', 'Revolver', 6, 2010,
  false, 'Italy',
  'The Chiappa Rhino fires from the bottom chamber of the cylinder rather than the top — a fundamental rethinking of revolver mechanics. This design places the bore axis directly above the shooter''s hand, dramatically reducing muzzle flip and felt recoil compared to conventional revolvers. Designed by Emilio Ghisoni (who also designed the Mateba Autorevolver) with input from Massad Ayoob. The triangular cylinder, unconventional profile, and hammer/trigger system are unlike any other production revolver. One of the most mechanically innovative handguns introduced in the last 30 years.',
  1199.0, 24.0, 7.7,
  false, false,
  ARRAY['Rhino 20DS', 'Rhino 40DS', 'Rhino 50DS', 'Rhino 60DS', 'Rhino 60SAR'],
  'Active', 'Chiappa Rhino', ARRAY['.357 Magnum', '.38 Special', '9mm', '.40 S&W'],
  ARRAY['rhino', 'chiappa rhino', 'rhino revolver'],
  'Modern', 'Double-Action',
  ARRAY['concealed_carry', 'home_defense', 'competition'],
  'The Chiappa Rhino fires from the bottom cylinder position rather than the top. This puts the bore axis directly above the shooter''s hand — the same geometry as firing a finger-pointed pistol — eliminating the mechanical disadvantage that makes conventional revolver muzzle flip worse than semi-autos.',
  'Italy', false, NULL
),

(
  'Springfield Armory', 'TRP', '.45 ACP',
  'Pistol', 'Semi-Auto', 8, 1999,
  false, 'USA',
  'The Springfield Armory TRP (Tactical Response Pistol) is Springfield''s premium 1911, developed in response to the Marine Corps'' request for a custom-quality 1911 for Force Recon units. The FBI HRT (Hostage Rescue Team) had been using custom 1911s built at the FBI Academy; the TRP was developed to meet similar specifications at production-gun pricing. Features a forged frame and slide, match-grade barrel, Novak LoMount sights, and G10 grips as standard. One of the most highly regarded production 1911s under $2,000.',
  1399.0, 41.6, 8.6,
  false, true,
  ARRAY['TRP Operator', 'TRP Pro', 'TRP 10mm', 'TRP Compact', 'TRP Long Slide'],
  'Active', '1911', ARRAY['.45 ACP', '10mm Auto', '.38 Super'],
  ARRAY['trp', 'springfield trp', 'tactical response pistol', 'sa trp'],
  'Modern', 'Single-Action',
  ARRAY['duty', 'competition', 'home_defense'],
  'The Springfield TRP was developed after the USMC Force Recon units began requesting a production alternative to the individually hand-built 1911s that had been their standard sidearm — making quality available at a manufacturing economy of scale for the first time.',
  'USA', false, NULL
),

(
  'Taurus', 'Model 85', '.38 Special',
  'Revolver', 'Revolver', 5, 1985,
  false, 'Brazil',
  'The Taurus Model 85 is the best-selling product in Taurus'' history and one of the best-selling revolvers globally. The J-frame-sized .38 Special snub-nose competes directly with the Smith & Wesson Model 642 at roughly half the price. Introduced to give budget-conscious buyers access to a reliable .38 Special snub-nose for concealed carry. The Ultra-Lite version with titanium frame is exceptionally light. Has been through multiple quality improvement cycles as Taurus refined its manufacturing processes.',
  399.0, 22.2, 6.5,
  false, false,
  ARRAY['Model 85 Ultra-Lite', 'Model 85 Protector Polymer', '856 (6-round)', 'Model 85 Viridian'],
  'Active', 'Taurus Small Frame', ARRAY['.38 Special', '.38 Special +P'],
  ARRAY['model 85', 'taurus 85', 'taurus 85ul', '85ul', 'm85'],
  'Cold War', 'Double-Action',
  ARRAY['concealed_carry', 'home_defense'],
  'The Taurus Model 85 has made the .38 Special snub-nose revolver — once the universal "first gun" recommendation — accessible at a price point half of the Smith & Wesson equivalent, putting it in the hands of buyers who could not otherwise afford a quality defensive revolver.',
  'Brazil', false, NULL
),

(
  'Howa', '1500', '.308 Winchester',
  'Rifle', 'Bolt', 5, 1978,
  false, 'Japan',
  'The Howa 1500 is a Japanese bolt-action action used as the OEM foundation for numerous branded rifles, including the Weatherby Vanguard, Legacy Sports Howa, and various others. The 1500 action itself is considered one of the most reliable and accurate mid-tier bolt-action designs produced. As a standalone Howa-branded rifle, it competes in the budget precision rifle space at under $700. The two-stage HACT trigger system is adjustable. Cold-hammer-forged barrel is standard. Used as the basis for numerous custom rifle builds due to its reputation for consistency.',
  649.0, 151.2, 44.5,
  false, false,
  ARRAY['Howa 1500 Mini', 'Howa 1500 Super Lite', 'Weatherby Vanguard (same action)', 'Howa Oryx (chassis)', 'Howa APC (chassis)'],
  'Active', 'Howa 1500',
  ARRAY['.243 Win', '6.5 Creedmoor', '.308 Win', '.30-06', '7mm-08', '6mm Creedmoor', '.450 Bushmaster', '6.5 PRC'],
  ARRAY['howa 1500', 'howa1500', 'howa', 'weatherby vanguard'],
  'Cold War', 'Two-Stage',
  ARRAY['hunting', 'precision_rifle', 'competition'],
  'The Howa 1500 action is the same action used in the Weatherby Vanguard — one of the most popular budget precision rifle platforms in America. Howa makes the action; Weatherby adds their name, stock, and warranty, and charges significantly more.',
  'Japan', false, NULL
),

(
  'Mauser', 'M18', '6.5 Creedmoor',
  'Rifle', 'Bolt', 5, 2018,
  false, 'Germany',
  'The Mauser M18 is the current entry-level production hunting rifle from Mauser, designed to bring the Mauser name into the budget-to-mid-tier hunting rifle market. Produced in Germany, the M18 uses a two-lug bolt with 90-degree throw and polymer stock. The M18 represents Mauser''s attempt to compete with Tikka, Bergara, and Browning in the practical hunting rifle segment at under $800. The "Mauser-style" controlled-round-feed of the classic 98 action is not present — the M18 uses a push-feed design for production simplicity.',
  799.0, 144.0, 44.0,
  false, false,
  ARRAY['M18 Savanna', 'M18 Waldjagd', 'M18 All Terrain'],
  'Active', 'Mauser M18',
  ARRAY['.243 Win', '6.5 Creedmoor', '.308 Win', '.30-06', '7mm Rem Mag', '.300 Win Mag'],
  ARRAY['m18', 'mauser m18', 'mauser 18'],
  'Modern', 'Single-Stage',
  ARRAY['hunting', 'hunting_big_game'],
  'The Mauser M18 was Mauser''s first mass-market production rifle in decades — an admission that the heritage Mauser 98 action commands a price premium that excludes the majority of hunting rifle buyers.',
  'Germany', false, NULL
),

(
  'Ithaca', 'Model 37', '12 Gauge',
  'Shotgun', 'Pump', 5, 1937,
  false, 'USA',
  'The Ithaca Model 37 is unique among major American pump shotguns for its bottom-ejection design — spent shells eject from the bottom of the receiver rather than the side. This makes the Model 37 fully ambidextrous and allows it to be fired right or left-handed without modification. The design descends from a John Browning-designed predecessor. Used by various police departments and military units; California Highway Patrol used the Model 37 as their standard patrol shotgun for decades. Still produced in limited quantities in Ithaca, New York.',
  849.0, 163.2, 48.0,
  false, true,
  ARRAY['Model 37 Defense', 'Model 37 Waterfowler', 'Model 37 Trap', 'Featherlight', 'DS Police Special'],
  'Active', 'Ithaca 37',
  ARRAY['12 Gauge', '16 Gauge', '20 Gauge', '28 Gauge'],
  ARRAY['model 37', 'ithaca 37', 'm37', 'featherlight'],
  'World War II', 'Single-Stage',
  ARRAY['hunting', 'home_defense', 'collector'],
  'The Ithaca Model 37 is the only major American pump shotgun that ejects spent shells from the bottom rather than the side — making it naturally ambidextrous. A left-handed shooter can operate a Model 37 without modification, unlike any side-ejecting pump.',
  'USA', true,
  'Original pre-war Ithaca production and WWII military variants are collectible. California Highway Patrol-marked examples are sought by law enforcement collectors. The transition between various model variants (37-DSPS, 37 Military) is documented by serial number ranges.'
),

(
  'Ruger', 'LCR', '.38 Special',
  'Revolver', 'Revolver', 5, 2009,
  false, 'USA',
  'The Ruger LCR (Lightweight Compact Revolver) was Ruger''s first all-new revolver design in decades and a significant engineering departure from traditional revolver construction. The polymer fire control housing, aluminum barrel shroud, and stainless steel cylinder combine to create a remarkably lightweight carry revolver. The friction-reducing cam in the fire control reduces trigger pull weight while maintaining hammer strike energy — achieving a lighter pull without sacrificing reliability. The LCR''s trigger is widely considered superior to competitive offerings at its price point. The LCRx adds a small exposed hammer for single-action cocking.',
  579.0, 13.5, 6.5,
  false, false,
  ARRAY['LCR .357', 'LCR 9mm', 'LCR .22 LR', 'LCR .22 Mag', 'LCR .327 Mag', 'LCRx'],
  'Active', 'Ruger LCR',
  ARRAY['.38 Special', '.357 Magnum', '9mm', '.22 LR', '.22 Mag', '.327 Federal Magnum'],
  ARRAY['lcr', 'ruger lcr', 'lightweight compact revolver'],
  'Modern', 'Double-Action',
  ARRAY['concealed_carry', 'home_defense'],
  'The Ruger LCR''s polymer fire control housing was a fundamental rethinking of revolver construction — breaking from the machined steel tradition that defined revolvers since Samuel Colt. The result is a revolver lighter than any steel alternative at the same price.',
  'USA', false, NULL
),

(
  'Staccato', 'Staccato CS', '9mm',
  'Pistol', 'Semi-Auto', 16, 2023,
  false, 'USA',
  'The Staccato CS (Carry Short) is Staccato''s most compact 2011 variant, designed for concealed carry while maintaining the 2011 double-stack capacity. Built on a shorter grip frame than the C2, the CS is Staccato''s entry into the compact carry market previously dominated by single-stack 1911 variants. The 2011 platform''s double-stack magazine gives the CS meaningfully greater capacity than comparable single-stack carry pistols at the same size.',
  1699.0, 23.0, 6.5,
  false, false, ARRAY['CS Optic Ready', 'CS DLC'],
  'Active', 'Staccato 2011', ARRAY['9mm'],
  ARRAY['staccato cs', 'cs', '2011 cs'],
  'Modern', 'Single-Action',
  ARRAY['concealed_carry', 'home_defense', 'competition'],
  'The Staccato CS brings the 2011 platform''s double-stack capacity to a sub-compact footprint — offering more rounds than most single-stack carry pistols in a comparable size, at a price that reflects its custom-shop manufacturing standards.',
  'USA', false, NULL
),

(
  'Staccato', 'Staccato XL', '9mm',
  'Pistol', 'Semi-Auto', 20, 2019,
  false, 'USA',
  'The Staccato XL is Staccato''s long-slide competition pistol built on the full-size 2011 frame with an extended 5" barrel. Designed for USPSA Open and Limited competition, the XL offers an extended sight radius and enhanced velocity compared to standard barrel lengths. The combination of the 2011 platform''s double-stack capacity with a 5" competition barrel makes the XL one of the most capable production competition pistols available.',
  2299.0, 34.0, 8.6,
  false, false, ARRAY['XL Optic Ready', 'XL DLC'],
  'Active', 'Staccato 2011', ARRAY['9mm', '.40 S&W'],
  ARRAY['staccato xl', 'xl', '2011 xl'],
  'Modern', 'Single-Action',
  ARRAY['competition', 'home_defense'],
  'The Staccato XL delivers the extended barrel of a competition pistol on the 2011 frame — one of the few production pistols that can be taken from the box to a USPSA Limited match without modification.',
  'USA', false, NULL
),

(
  'CZ', '75 SP-01 Shadow', '9mm',
  'Pistol', 'Semi-Auto', 18, 2006,
  false, 'Czech Republic',
  'The CZ 75 SP-01 Shadow is CZ''s flagship competition pistol and one of the most popular IPSC/USPSA Production division pistols in the world. The SP-01 frame is a full-size steel CZ 75 with an integral accessory rail and improved grip ergonomics. The Shadow variant adds competition-tuned internals by CZ Custom: lighter hammer, shorter reset trigger, and competition hammer spring. The Shadow 2 (2016) further improved the design with extended controls and front cocking serrations. Dominant in IPSC Production and Standard divisions worldwide.',
  1249.0, 46.08, 8.15,
  false, false,
  ARRAY['Shadow 2', 'Shadow 2 OR (Optic Ready)', 'SP-01 Phantom (polymer)', 'SP-01 Tactical'],
  'Active', 'CZ 75 Series', ARRAY['9mm', '.40 S&W'],
  ARRAY['sp-01 shadow', 'cz shadow', 'sp01 shadow', 'cz sp-01', 'cz75 sp01'],
  'Modern', 'DA/SA',
  ARRAY['competition', 'duty', 'home_defense'],
  'The CZ 75 SP-01 Shadow is the most decorated pistol in IPSC World Shoot history — Czech and Slovak shooters using Shadow variants have dominated Production and Standard division results at the IPSC World Shoot repeatedly since 2008.',
  'Czech Republic', false, NULL
)
ON CONFLICT (make, model) DO NOTHING;
