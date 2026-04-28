-- ============================================================
-- Morini Competition Arm SA — Manufacturer + Gun Models
-- Swiss Olympic target pistol maker missing from the DB
-- ============================================================

-- ── MANUFACTURER ─────────────────────────────────────────────

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
  'Morini',
  ARRAY['Morini Competition Arm', 'Morini Competition Arm SA', 'Tiro Morini'],
  'Switzerland', 1978, true,
  ARRAY['Pistol'],
  NULL, NULL,
  'Swiss precision target pistol manufacturer founded in 1978 by engineer Carlo Morini in Bedano, Ticino, Switzerland. Morini entered the Olympic target market with a clear engineering-first philosophy — every model is designed specifically for a single ISSF discipline. The CM 22M free pistol and the CM 84E / 162EI air pistols have become gold-standard choices at Olympic and World Championship level. Unlike the other Swiss makers (Hammerli, now German-owned), Morini remains fully independent, family-run, and Swiss-manufactured. Production volumes are extremely small; each pistol is hand-fitted. The company has no military or law enforcement contracts and has never sought them — Morini builds competition pistols exclusively.',
  ARRAY['CM 22M', 'CM 32', 'CM 84E', 'CM 102E', '162EI', '162MI'],
  'https://www.morini.ch', 'Bedano, Ticino, Switzerland',
  'Switzerland', 'Active Import', 'Boutique', 'premium', 'Independent', false,
  'Manufacturer',
  ARRAY['Olympic target pistols', 'free pistols', 'air pistols', 'electronic triggers', 'center fire pistols'],
  ARRAY['Carlo Morini'],
  1600, false, NULL,
  'Morini is one of the few firearms manufacturers in the world that builds exclusively for Olympic-level competition. Every model maps directly to a specific ISSF event. The company has never made a pistol for any other purpose.',
  ARRAY['Switzerland'], 'High', 'CM 22M'
)

ON CONFLICT (name) DO NOTHING;


-- ── GUN MODELS ───────────────────────────────────────────────

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
  'Morini', 'CM 22M', '.22 LR',
  'Pistol', 'Semi-Auto', 5, 1994,
  false, 'Switzerland',
  'The Morini CM 22M is the definitive modern Olympic Free Pistol, designed for the ISSF 50-meter Precision Pistol event. An evolution of the original CM 22, the CM 22M features a fully adjustable electronic trigger (breakable under 1 gram), an anatomical grip system adjustable for virtually every hand dimension, and barrel balance weights for center-of-gravity tuning. The bore axis is among the lowest of any target pistol. Built entirely in Switzerland in very small quantities — each example is hand-fitted. At World Championship and Olympic level, the CM 22M competes directly with the Pardini GP for supremacy in Free Pistol; the two models have traded Olympic medals back and forth for three decades.',
  2900, 34.2, 11.8,
  false, false,
  ARRAY['CM 22M Electronic Trigger', 'CM 22M Mechanical Trigger', 'CM 22 (original, pre-M)'],
  'Active', 'Morini CM 22',
  ARRAY['.22 LR'],
  ARRAY['cm22m', 'morini 22', 'morini free pistol', 'cm 22 m'],
  'Modern', 'Single-Action',
  ARRAY['competition', 'collector'],
  'The CM 22M electronic trigger can be adjusted to break at under 1 gram — lighter than a paperclip. At 50 meters, the difference between a 9 and a 10 ring is 0.5 millimeters; trigger consistency at this level is not optional.',
  'Switzerland', true,
  'Swiss-manufacture throughout production history. Hand-fitted examples vary slightly in feel. Factory service from Morini is strongly preferred given the electronic trigger system. Pistols with documented competition history (national teams, Olympics) carry collector premiums.'
),

(
  'Morini', 'CM 32', '.32 S&W Long',
  'Pistol', 'Semi-Auto', 5, 1982,
  false, 'Switzerland',
  'The Morini CM 32 is a Center Fire Pistol designed for the ISSF 25-meter Center Fire Pistol event. Chambered in .32 S&W Long — a cartridge that exists almost entirely for this Olympic discipline — the CM 32 features a mechanical trigger adjustable for weight and overtravel, a fully anatomical grip, and the same Swiss hand-fitting quality as the CM 22M. The center fire event fires a precision stage and a rapid-fire stage at 25 meters, requiring a pistol optimized for both accuracy and fast follow-up shots. The CM 32 has been used at Olympic and World Championship level since the early 1980s.',
  2600, 39.0, 11.0,
  false, false,
  ARRAY['CM 32 in 9x21mm (IPSC variant)'],
  'Active', 'Morini CM 32',
  ARRAY['.32 S&W Long'],
  ARRAY['cm32', 'morini 32', 'morini centerfire', 'morini center fire'],
  'Modern', 'Single-Action',
  ARRAY['competition'],
  '.32 S&W Long was originally a revolver cartridge from the 1890s. It persists in the 21st century almost entirely because ISSF rules require a minimum energy threshold for Center Fire Pistol — and .32 S&W Long meets it with almost no felt recoil.',
  'Switzerland', false,
  'Active production with factory support. Factory grip fitting service available directly from Morini. Spare .32 S&W Long ammunition supply is the main practical concern for active competition use.'
),

(
  'Morini', 'CM 84E', '.177 (4.5mm)',
  'Pistol', 'Single-Action', 1, 1984,
  true, 'Switzerland',
  'The Morini CM 84E is a 10-meter air pistol designed for the ISSF 10m Air Pistol event and built around an electronic trigger system — one of the first production air pistols to offer electronic ignition. Powered by compressed air (CO2 optional on early variants), the CM 84E fires a single 4.5mm lead pellet per charge cycle. The electronic trigger can be adjusted to release at fractions of a gram, enabling a degree of precision impossible with mechanical triggers. A landmark product that influenced the entire 10m air pistol category. Replaced in competition by the CM 102E but widely used in training.',
  NULL, 28.5, 10.4,
  false, false,
  ARRAY['CM 84E CO2 variant'],
  'Discontinued', 'Morini CM 84',
  ARRAY['.177 (4.5mm)'],
  ARRAY['cm84e', 'morini 84', 'morini air pistol 84'],
  'Post-Cold War', 'Single-Action',
  ARRAY['competition', 'collector'],
  'The CM 84E was the pistol that proved electronic triggers had a place in Olympic air pistol competition. Before the 84E, all top-level air pistols used mechanical triggers. After it, electronic triggers became the standard at elite level.',
  'Switzerland', true,
  'Discontinued but historically significant. Electronic trigger components require factory service — Morini can still service most examples. Compressed air system seals are the primary maintenance item. Collector interest is moderate among 10m air pistol historians.'
),

(
  'Morini', 'CM 102E', '.177 (4.5mm)',
  'Pistol', 'Single-Action', 1, 1995,
  true, 'Switzerland',
  'The Morini CM 102E is the successor to the CM 84E, representing a complete redesign of the 10-meter air pistol for the modern Olympic era. Features a refined electronic trigger, improved compressed-air system with a larger reservoir, and an updated anatomical grip with enhanced adjustability. The trigger electronics were redesigned to be more reliable and easier to service in the field during competitions. Used at Olympic and World Championship level through the early 2000s before being superseded by the 162 series.',
  2400, 29.5, 10.6,
  false, false,
  ARRAY['CM 102EI (improved)'],
  'Discontinued', 'Morini CM 102',
  ARRAY['.177 (4.5mm)'],
  ARRAY['cm102e', 'morini 102', 'morini cm102'],
  'Modern', 'Single-Action',
  ARRAY['competition'],
  'The 102E introduced a compressed-air reservoir system that could sustain consistent shot-to-shot pressure across a full 60-shot Olympic string without a significant velocity drop — a critical engineering challenge in 10m air pistol competition.',
  'Switzerland', false,
  'Discontinued but parts and service still available through Morini. Less collected than the 84E. The compressed air seals are the primary aging concern.'
),

(
  'Morini', '162EI', '.177 (4.5mm)',
  'Pistol', 'Single-Action', 1, 2005,
  false, 'Switzerland',
  'The Morini 162EI is the current flagship 10-meter air pistol from Morini, designed for the ISSF 10m Air Pistol event. Features Morini''s latest electronic trigger system, a fully adjustable anatomical grip with extensive hand-fitting options, a high-capacity compressed air cylinder integrated into the grip frame, and a sight radius optimized for 10-meter competition. The 162EI competes at the highest level of Olympic air pistol shooting alongside the Steyr LP50 and Walther LP500. Swiss hand-fitted throughout. The ''I'' designation indicates the electronic (Impulse) trigger variant.',
  2800, 31.0, 10.8,
  false, false,
  ARRAY['162EI (electronic trigger)', '162MI (mechanical trigger)'],
  'Active', 'Morini 162',
  ARRAY['.177 (4.5mm)'],
  ARRAY['162ei', 'morini 162', 'morini 162 ei', 'morini air pistol'],
  'Modern', 'Single-Action',
  ARRAY['competition'],
  'The 162EI''s electronic trigger is adjusted via a digital interface that Morini supplies with the pistol — the trigger weight, travel, and post-fire delay are all programmable. This level of adjustability was science fiction in target pistol design 30 years ago.',
  'Switzerland', false,
  'Current production with full factory support. The compressed air system requires periodic seal service. Grip fitting is highly individual and most serious competitors have the grip custom-fitted by Morini or an authorized service center.'
),

(
  'Morini', '162MI', '.177 (4.5mm)',
  'Pistol', 'Single-Action', 1, 2005,
  false, 'Switzerland',
  'The Morini 162MI is the mechanical trigger variant of the 162EI, sharing the same chassis, grip system, and compressed-air architecture but substituting a conventional adjustable mechanical sear for the electronic trigger unit. Chosen by competitors who prefer the traditional trigger feel or compete in events that restrict electronic triggers. Marginally less expensive than the 162EI. Shares all service procedures with the 162EI except the trigger electronics.',
  2400, 30.5, 10.8,
  false, false,
  ARRAY['162MI (mechanical trigger)'],
  'Active', 'Morini 162',
  ARRAY['.177 (4.5mm)'],
  ARRAY['162mi', 'morini 162 mi', 'morini 162 mechanical'],
  'Modern', 'Single-Action',
  ARRAY['competition'],
  'Some top-level competitors continue to prefer mechanical triggers even at Olympic level — the feel of a crisp mechanical break is considered by some shooters to give better feedback than an electronic impulse, particularly in the precision stage of the 60-shot Olympic string.',
  'Switzerland', false,
  NULL
)

ON CONFLICT (make, model) DO NOTHING;
