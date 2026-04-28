-- ============================================================
-- Hammerli + Pardini — Manufacturers + Gun Models
-- Two Olympic-grade target pistol makers missing from the DB
-- ============================================================

-- ── MANUFACTURERS ────────────────────────────────────────────

INSERT INTO public.manufacturers (
  name, alternate_names, country_of_origin, founded_year, active,
  categories, parent_company, subsidiaries, description,
  notable_models, website, headquarters,
  production_country, us_import_status, volume_tier,
  market_segment, ownership_type, low_confidence,
  entity_type, known_for, notable_designers,
  price_tier_entry_usd, has_military_contract, military_notes, trivia,
  production_countries, collector_prestige_tier, signature_model
) VALUES

(
  'Hammerli',
  ARRAY['Hämmerli', 'Hammerli AG', 'Carl Walther Hammerli'],
  'Switzerland', 1863, true,
  ARRAY['Pistol'],
  'Carl Walther GmbH', NULL,
  'Swiss precision target pistol maker founded in Lenzburg in 1863 — originally as a rifle factory, later pivoting to handguns. Hämmerli dominated Olympic target shooting for much of the 20th century; Swiss shooting teams and individual gold medalists used Hämmerli pistols at nearly every Summer Games from the 1950s through the 1990s. The 208 series Standard Pistol became the benchmark of the discipline. Acquired by the Walther-parent PW Group (Umarex) in the 2000s; production moved from Switzerland to Germany. The X-Esse is the current entry-level target model sold under the Hammerli brand by Walther.',
  ARRAY['208', '215', '232', '280', 'SP20', 'X-Esse', 'FP10', '480'],
  'https://www.hammerli.com', 'Lenzburg, Switzerland (historic); Arnsberg, Germany (current)',
  'Germany', 'Active Import', 'Boutique', 'premium', 'Subsidiary', false,
  'Manufacturer',
  ARRAY['Olympic target pistols', '.22 LR match pistols', 'free pistols', 'rapid fire pistols'],
  NULL,
  699, false, NULL,
  'Hämmerli pistols won Olympic gold medals at nearly every Summer Games from the 1950s through the 1990s. At the 1972 Munich Olympics, the top three finishers in the Free Pistol event all shot Hämmerli 150s.',
  ARRAY['Switzerland', 'Germany'], 'High', '208'
),

(
  'Pardini',
  ARRAY['Pardini Armi', 'Pardini Arms'],
  'Italy', 1979, true,
  ARRAY['Pistol'],
  NULL, NULL,
  'Italian target pistol manufacturer founded by former competitive shooter Giampiero Pardini in Lido di Camaiore, Lucca. Pardini entered the Olympic-grade pistol market in the early 1980s and rapidly displaced established Swiss and German makers in major championships. The GP free pistol and SP standard pistol are considered the gold standard in their respective ISSF disciplines — the GP in particular holds an extraordinary winning record at Olympic and World Championship level. Unlike most competitors, Pardini remains fully independent and family-run. Their electronic trigger systems set the benchmark for adjustability and consistency. All pistols are hand-fitted in Italy.',
  ARRAY['GP', 'SP', 'HP', 'GT45', 'GT9', 'PC', 'K10'],
  'https://www.pardini.it', 'Lido di Camaiore, Lucca, Italy',
  'Italy', 'Active Import', 'Boutique', 'premium', 'Independent', false,
  'Manufacturer',
  ARRAY['Olympic target pistols', 'free pistols', 'standard pistols', 'center fire pistols', 'electronic triggers'],
  ARRAY['Giampiero Pardini'],
  1800, false, NULL,
  'Pardini GP free pistols have won the Olympic gold medal in the 50m Free Pistol event at every Summer Olympics from 1988 through 2016 — an unbroken 8-Games winning streak across multiple different shooters and nationalities.',
  ARRAY['Italy'], 'High', 'GP'
)

ON CONFLICT (name) DO NOTHING;


-- ── GUN MODELS — HAMMERLI ────────────────────────────────────

INSERT INTO public.gun_models (
  make, model, caliber, type, action, capacity, year_introduced,
  discontinued, country_of_origin, description, msrp_usd,
  weight_oz_unloaded, overall_length_in,
  military_use, law_enforcement_use, notable_variants,
  production_status, platform_family, caliber_options, model_aliases,
  era, trigger_type, intended_use, trivia, country_of_manufacture,
  is_collectible, collector_notes
) VALUES

(
  'Hammerli', '208', '.22 LR',
  'Pistol', 'Semi-Auto', 8, 1966,
  true, 'Switzerland',
  'The Hammerli 208 is the definitive 20th-century Olympic target pistol. Chambered in .22 LR and built for the ISSF 25m Standard Pistol and 50m Precision Pistol events, the 208 features a fully adjustable match trigger, anatomical grip, and target-weight barrel. Swiss-made to tolerances that were extraordinary for the era. Dominated world-class competition from the late 1960s through the 1990s. The 208S variant added a muzzle weight system. Replaced by the SP20 in production but remains the most collected Hammerli model.',
  NULL, 33.5, 10.2,
  false, false,
  ARRAY['208S (muzzle weight)', '208C (Canadian version)', '215 (variant)'],
  'Discontinued', 'Hammerli 200 Series',
  ARRAY['.22 LR'],
  ARRAY['hammerli 208', '208s', 'hämmerli 208'],
  'Cold War', 'Single-Action',
  ARRAY['competition', 'collector'],
  'The 208 was the pistol of choice for the US Olympic Shooting Team through much of the 1970s and 1980s. Its trigger mechanism was so widely copied that it set the mechanical template for an entire generation of target pistol design.',
  'Switzerland', true,
  'Swiss-manufacture examples (pre-2000) command strong collector premiums over German-era production. The 208S with original muzzle weight and correct tool kit is most desirable. Matching serial numbers between frame and slide matter significantly. Original factory case and accessories add 20-30% to value.'
),

(
  'Hammerli', '215', '.22 LR',
  'Pistol', 'Semi-Auto', 8, 1976,
  true, 'Switzerland',
  'The Hammerli 215 is a refined variant of the 208 designed for both the ISSF Standard Pistol and general target competition. Shares the same basic mechanism as the 208 but introduced an improved anatomical grip system with palm shelf. Lighter and slightly less expensive than the 208 while offering near-identical accuracy potential. Made exclusively in Switzerland.',
  NULL, 30.0, 9.8,
  false, false,
  ARRAY['215 Sport'],
  'Discontinued', 'Hammerli 200 Series',
  ARRAY['.22 LR'],
  ARRAY['hammerli 215'],
  'Cold War', 'Single-Action',
  ARRAY['competition', 'collector'],
  'The 215 was often chosen by Standard Pistol specialists who found the 208 slightly heavy for the precision stage of the three-position event.',
  'Switzerland', true,
  'Less common than the 208 and often undervalued. Swiss manufacture. Spare parts compatibility with 208 is high, making it easier to maintain than other discontinued Hammerli models.'
),

(
  'Hammerli', '232', '.22 LR Short',
  'Pistol', 'Semi-Auto', 6, 1984,
  true, 'Switzerland',
  'The Hammerli 232 is a dedicated ISSF Rapid Fire Pistol — one of the most technically demanding Olympic shooting events. Chambered in .22 Short (the fastest-cycling .22 rimfire cartridge), it fires 5-shot strings at targets that expose for 8, 6, and 4 seconds at 25 meters. The 232 features an ultra-low bore axis, compensated muzzle brake, and adjustable balance weights to minimize muzzle rise between shots. The trigger mechanism is optimized for the light, fast lock time the event demands.',
  NULL, 29.0, 11.3,
  false, false,
  ARRAY['232 Competition'],
  'Discontinued', 'Hammerli 200 Series',
  ARRAY['.22 Short', '.22 LR Short'],
  ARRAY['hammerli 232', '232 rapid fire'],
  'Cold War', 'Single-Action',
  ARRAY['competition', 'collector'],
  'Rapid Fire Pistol is the only Olympic shooting event where the targets move — five silhouette targets face the shooter for 8, 6, and 4 seconds in alternating series, all at 25 meters. The 232 was engineered specifically around this rhythm.',
  'Switzerland', true,
  'ISSF rules require .22 Short for Rapid Fire; .22 LR-chambered pistols cannot be used competitively. 232 examples are niche collectibles sought specifically by Rapid Fire competitors and Swiss target pistol collectors.'
),

(
  'Hammerli', '280', '.22 LR',
  'Pistol', 'Semi-Auto', 5, 1985,
  true, 'Switzerland',
  'The Hammerli 280 is a Free Pistol designed for the ISSF 50-meter Precision Pistol event — the most technically precise discipline in Olympic shooting. Unlike the 208/215 which use a mechanical sear, the 280 was available with an optional electronic trigger system that breaks at under 1 gram of pressure with a tiny electrical discharge. The anatomical grip is hand-fitted and the balance system is fully adjustable. Chambered in .22 LR or .32 S&W Long depending on the event. The last great Swiss-made Hammerli before Walther acquisition.',
  NULL, 35.3, 11.4,
  false, false,
  ARRAY['280 Electronic Trigger', '280 Mechanical Trigger', '280 in .32 S&W Long'],
  'Discontinued', 'Hammerli 280',
  ARRAY['.22 LR', '.32 S&W Long'],
  ARRAY['hammerli 280', 'hämmerli 280'],
  'Post-Cold War', 'Single-Action',
  ARRAY['competition', 'collector'],
  'The electronic trigger option on the 280 breaks at under 1 gram — lighter than the weight of a paperclip. At 50 meters, the difference between a mechanical and electronic trigger is often the difference between gold and silver.',
  'Switzerland', true,
  'Electronic trigger variants are more valuable and harder to service — parts supply has become critical. Mechanical trigger versions are more practical for active competition. Both caliber variants (.22 LR and .32 S&W Long) are collected. Complete tools and original case are important to value.'
),

(
  'Hammerli', 'SP20', '.22 LR',
  'Pistol', 'Semi-Auto', 5, 1998,
  true, 'Switzerland',
  'The Hammerli SP20 is the successor to the 208/215 series, introduced in 1998 and representing Hammerli''s last major independent development before the Walther acquisition. Features a modular aluminum frame with a fully adjustable anatomical grip, adjustable trigger, and removable barrel weight system. Available in .22 LR and .32 S&W Long for Standard Pistol. The trigger mechanism was entirely redesigned from the 208 and offers more adjustment range. Well-regarded in competition but never achieved the iconic status of the 208.',
  2800, 34.9, 11.0,
  false, false,
  ARRAY['SP20 in .32 S&W Long', 'SP20 with Red Dot'],
  'Discontinued', 'Hammerli SP',
  ARRAY['.22 LR', '.32 S&W Long'],
  ARRAY['sp 20', 'hammerli sp 20'],
  'Post-Cold War', 'Single-Action',
  ARRAY['competition'],
  'The SP20 was the first Hammerli with a fully modular grip system — the entire grip unit could be swapped between calibers, allowing a shooter to use one pistol for both Standard Pistol (.22 LR) and Center Fire Pistol (.32 S&W Long) events.',
  'Switzerland', false,
  'Swiss-manufacture SP20s are preferable to later German-production examples for collectors. The grip modular system means parts interchangeability is good. Less collectible than 208 but widely used in active competition.'
),

(
  'Hammerli', 'X-Esse', '.22 LR',
  'Pistol', 'Semi-Auto', 10, 2003,
  false, 'Germany',
  'The Hammerli X-Esse is the entry-level target pistol in the current Walther-managed Hammerli lineup. Designed for the sport shooting and entry-level target competition market, it offers a fully adjustable trigger, adjustable rear sight, and an anatomical grip at a price point well below Olympic-grade Hammerli pistols. The steel barrel and aluminum frame are manufactured in Germany. Popular with beginning competitive shooters and as a general-purpose .22 target pistol. Currently available in two variants: the X-Esse Sport and X-Esse SF (Short Frame).',
  799, 24.7, 10.2,
  false, false,
  ARRAY['X-Esse Sport', 'X-Esse SF', 'X-Esse Long'],
  'Active', 'Hammerli X-Esse',
  ARRAY['.22 LR'],
  ARRAY['x esse', 'x-esse sport', 'xesse'],
  'Modern', 'Single-Action',
  ARRAY['competition', 'target'],
  'The X-Esse is the most affordable way into the Hammerli line — marketed at shooters transitioning from recreational to competitive target shooting who want a proper adjustable-trigger match pistol without Olympic-grade pricing.',
  'Germany', false,
  NULL
),

(
  'Hammerli', 'FP10', '.22 LR',
  'Pistol', 'Semi-Auto', 5, 2005,
  true, 'Germany',
  'The Hammerli FP10 is a Free Pistol for the ISSF 50m Precision Pistol event, developed after the Walther acquisition and manufactured in Germany. It carries the electronic trigger technology inherited from the 280 in a more modern chassis. The anatomical grip system is adjustable and interchangeable. Designed to compete against Pardini GP and Morini CM22 in the Olympic Free Pistol market. Production was limited and the model has since been discontinued.',
  NULL, 36.0, 11.8,
  false, false,
  ARRAY['FP10 Electronic', 'FP10 Mechanical'],
  'Discontinued', 'Hammerli FP',
  ARRAY['.22 LR'],
  ARRAY['fp 10', 'hammerli fp10'],
  'Modern', 'Single-Action',
  ARRAY['competition', 'collector'],
  'The FP10 was Hammerli''s attempt to reclaim Olympic Free Pistol relevance after the 280 was discontinued — but Pardini''s GP had become so dominant that the FP10 never achieved significant market share at elite level.',
  'Germany', false,
  'German-manufacture FP10 examples are generally less valued by collectors than Swiss-manufacture Hammerli pistols. Parts supply is becoming an issue for the electronic trigger system.'
);


-- ── GUN MODELS — PARDINI ─────────────────────────────────────

INSERT INTO public.gun_models (
  make, model, caliber, type, action, capacity, year_introduced,
  discontinued, country_of_origin, description, msrp_usd,
  weight_oz_unloaded, overall_length_in,
  military_use, law_enforcement_use, notable_variants,
  production_status, platform_family, caliber_options, model_aliases,
  era, trigger_type, intended_use, trivia, country_of_manufacture,
  is_collectible, collector_notes
) VALUES

(
  'Pardini', 'GP', '.22 LR',
  'Pistol', 'Semi-Auto', 5, 1984,
  false, 'Italy',
  'The Pardini GP is the dominant Olympic Free Pistol of the modern era. Designed for the ISSF 50-meter Precision Pistol event, it features an adjustable electronic trigger that can be set below 1 gram, a fully anatomical adjustable grip, adjustable balance weights on the barrel, and an extremely low bore axis. Giampiero Pardini, himself a former Olympic-level shooter, designed the GP around the specific demands of the 60-shot precision event at 50 meters. Since its introduction in 1984, the GP has won the Olympic gold medal in Free Pistol at every Summer Games through 2016 — a record that stands alone in Olympic shooting history.',
  2900, 35.3, 12.2,
  false, false,
  ARRAY['GP-E (electronic trigger)', 'GP-M (mechanical trigger)', 'GP with optical sight rail'],
  'Active', 'Pardini GP',
  ARRAY['.22 LR'],
  ARRAY['pardini gp', 'gp free pistol', 'pardini free pistol'],
  'Modern', 'Single-Action',
  ARRAY['competition', 'collector'],
  'Pardini GP free pistols won the Olympic gold medal in Free Pistol at every Summer Games from 1988 through 2016 — eight consecutive Olympics across different shooters, different nationalities, and different generations of the pistol.',
  'Italy', true,
  'Olympic-provenance examples (used by medalists) command significant premiums at auction. Earlier production models are collected alongside current versions. The electronic trigger module is a service item and availability of factory service is important to value. Italian hand-fitting means each example is slightly individual.'
),

(
  'Pardini', 'SP', '.22 LR',
  'Pistol', 'Semi-Auto', 5, 1984,
  false, 'Italy',
  'The Pardini SP is the definitive Olympic Standard Pistol, designed for the ISSF 25m Precision Pistol event (known as Standard Pistol). The event fires three phases at three time limits — 150 seconds, 20 seconds, and 10 seconds — requiring a pistol that is equally precise in slow and rapid fire. The SP''s mechanical trigger is adjustable for weight, travel, and overtravel; the anatomical grip offers extensive adjustment for hand size and shooting position. Has won multiple World Championship and Olympic medals since introduction.',
  2600, 38.8, 10.8,
  false, false,
  ARRAY['SP New (updated model)', 'SP in .32 S&W Long'],
  'Active', 'Pardini SP',
  ARRAY['.22 LR', '.32 S&W Long'],
  ARRAY['pardini sp', 'pardini standard pistol'],
  'Modern', 'Single-Action',
  ARRAY['competition'],
  'The ISSF Standard Pistol event is one of the most technically demanding in Olympic shooting — requiring a pistol that performs identically in a 150-second precision stage and a 10-second rapid-fire stage. The SP was designed specifically around this dual requirement.',
  'Italy', false,
  'Active production with factory support. Earlier models are fully service-compatible with current production. Grip panels are personal-fit and typically taken by the shooter — check for factory or aftermarket replacements.'
),

(
  'Pardini', 'SP New', '.22 LR',
  'Pistol', 'Semi-Auto', 5, 2001,
  false, 'Italy',
  'The Pardini SP New is the updated generation of the SP Standard Pistol, featuring a redesigned grip system with improved palm shelf adjustability, updated trigger mechanism geometry, and refined internal tolerances. Dimensionally similar to the original SP but with measurable improvements to trigger feel and consistency. The current production Standard Pistol from Pardini.',
  2750, 39.0, 10.8,
  false, false,
  ARRAY['SP New in .32 S&W Long'],
  'Active', 'Pardini SP',
  ARRAY['.22 LR', '.32 S&W Long'],
  ARRAY['sp new', 'pardini sp new', 'new sp'],
  'Modern', 'Single-Action',
  ARRAY['competition'],
  'The SP New trigger mechanism improved on the original SP by reducing internal friction at the break point — a change that took years of refinement but resulted in a trigger that experienced shooters describe as more consistent under the pressure of timed competition.',
  'Italy', false,
  NULL
),

(
  'Pardini', 'HP', '.32 S&W Long',
  'Pistol', 'Semi-Auto', 5, 1987,
  false, 'Italy',
  'The Pardini HP is an ISSF Center Fire Pistol, designed for the 25m Center Fire Pistol event. The event fires a precision stage and a rapid-fire stage; the Center Fire discipline requires a cartridge generating at least 150J of muzzle energy, which .32 S&W Long meets. The HP uses the same anatomical grip system and adjustable trigger as the SP but is built to handle the heavier caliber. Has represented Italy at multiple Olympic Games.',
  2800, 40.2, 11.0,
  false, false,
  ARRAY['HP in 9mm (non-standard)', 'HP 9x21mm (IPSC variant)'],
  'Active', 'Pardini HP',
  ARRAY['.32 S&W Long'],
  ARRAY['pardini hp', 'hp center fire', 'pardini centerfire'],
  'Modern', 'Single-Action',
  ARRAY['competition'],
  '.32 S&W Long is a cartridge designed almost entirely to exist within ISSF Center Fire Pistol rules — it generates exactly enough energy to meet the minimum threshold while producing nearly no felt recoil. Nearly every pistol chambered in .32 S&W Long exists solely for this Olympic event.',
  'Italy', false,
  'Factory service availability is the primary purchasing consideration. Spare .32 S&W Long barrels and magazines are the main consumables.'
),

(
  'Pardini', 'GT45', '.45 ACP',
  'Pistol', 'Semi-Auto', 10, 1993,
  false, 'Italy',
  'The Pardini GT45 is a sport and practical shooting pistol chambered in .45 ACP, designed for IPSC/USPSA Production and Standard divisions and general sport use. Built on a steel frame with Pardini''s characteristic attention to fit and finish, the GT45 brings Olympic-grade manufacturing quality to a duty-caliber semi-auto. Features an adjustable trigger, fixed sights replaceable with competition sights, and a grip angle optimized for point shooting.',
  1850, 38.0, 8.7,
  false, false,
  ARRAY['GT45 with compensator', 'GT45 Open (IPSC Open division)'],
  'Active', 'Pardini GT',
  ARRAY['.45 ACP'],
  ARRAY['pardini gt45', 'gt 45', 'pardini 45'],
  'Modern', 'Single-Action',
  ARRAY['competition', 'sport'],
  'Pardini built the GT45 as a direct answer to IPSC competitors who wanted Olympic-grade manufacturing in a practical shooting caliber. The hand-fitting process used on the GT45 is the same as on the GP and SP target pistols — an unusual commitment in the practical shooting market.',
  'Italy', false,
  NULL
),

(
  'Pardini', 'GT9', '9mm Luger',
  'Pistol', 'Semi-Auto', 16, 1995,
  false, 'Italy',
  'The Pardini GT9 is a sport semi-automatic pistol chambered in 9mm Luger, positioned for IPSC/USPSA Standard and Production competition as well as general sport use. Shares the GT series platform with the GT45 and GT32, featuring a steel frame, adjustable trigger, and Pardini''s characteristic Italian hand-fitting. A practical shooting pistol built to target pistol manufacturing standards.',
  1750, 35.5, 8.5,
  false, false,
  ARRAY['GT9 with optic cut'],
  'Active', 'Pardini GT',
  ARRAY['9mm Luger'],
  ARRAY['pardini gt9', 'gt 9', 'pardini 9mm'],
  'Modern', 'Single-Action',
  ARRAY['competition', 'sport'],
  'The GT9 is one of the few Italian-made IPSC competition pistols. Italy has a strong practical shooting community and Pardini serves it with Olympic-grade build quality at a premium price.',
  'Italy', false,
  NULL
),

(
  'Pardini', 'GT32', '.32 ACP',
  'Pistol', 'Semi-Auto', 8, 1995,
  false, 'Italy',
  'The Pardini GT32 is a compact sport pistol chambered in .32 ACP, designed for European target shooting disciplines that restrict caliber to .32 ACP and for casual target competition. The smallest of the GT series, it shares the same frame proportions and manufacturing quality as the GT9 and GT45 but in a softer-shooting, more affordable-to-feed package.',
  1650, 29.0, 7.8,
  false, false,
  NULL,
  'Active', 'Pardini GT',
  ARRAY['.32 ACP'],
  ARRAY['pardini gt32', 'gt 32', 'pardini 32'],
  'Modern', 'Single-Action',
  ARRAY['competition', 'sport'],
  'The GT32 fills a specifically European niche — several national-level target shooting disciplines in Italy and Germany specify .32 ACP as the maximum permissible caliber, making the GT32 competitive in those events.',
  'Italy', false,
  NULL
),

(
  'Pardini', 'PC', '.22 Short',
  'Pistol', 'Semi-Auto', 5, 1986,
  false, 'Italy',
  'The Pardini PC is an ISSF Rapid Fire Pistol designed for the 25m Rapid Fire Pistol event — the only Olympic shooting discipline using .22 Short cartridges. The event fires 5-shot series at five turning targets with 8, 6, and 4 second exposures. The PC features an ultra-low bore axis to minimize muzzle flip between shots, an adjustable compensator, and a trigger optimized for the fast, light lock time the event demands. Balance weights on the barrel are adjustable for personal preference.',
  2700, 30.0, 11.5,
  false, false,
  ARRAY['PC Rapid Fire Competition'],
  'Active', 'Pardini PC',
  ARRAY['.22 Short'],
  ARRAY['pardini pc', 'pardini rapid fire', 'pc rapid fire'],
  'Modern', 'Single-Action',
  ARRAY['competition'],
  'ISSF Rapid Fire Pistol uses .22 Short exclusively — the fastest-cycling .22 rimfire loading, optimized specifically for this event. No other mainstream civilian use exists for .22 Short semi-auto pistols at this level. The Pardini PC exists solely to win Olympic medals.',
  'Italy', false,
  'Factory service from Pardini Italy is essential for competition-level maintenance. The compensator and balance weight system require period tuning. A relatively rare pistol outside serious ISSF competition circles.'
);
