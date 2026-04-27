-- ============================================================
-- manufacturers v2.1: schema extensions + data corrections + new records
-- Spec: Lindcott Armory Manufacturer Database Update v2.1 (April 2026)
-- Run: npx supabase db query --linked -f supabase/migrations/20260415_manufacturers_v2.sql
-- ============================================================

-- ── 1. ENUM TYPES ─────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE public.mfr_us_import_status AS ENUM (
    'Domestic',
    'Active Import',
    'Import Banned',
    'Sanctioned',
    'Discontinued',
    'Historical'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.mfr_volume_tier AS ENUM (
    'Micro',
    'Boutique',
    'Mid',
    'High',
    'Mass'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.mfr_market_segment AS ENUM (
    'mass',
    'premium',
    'ultra-premium',
    'competition',
    'military',
    'collector'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.mfr_ownership_type AS ENUM (
    'Independent',
    'Public',
    'Subsidiary',
    'State-owned'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 2. ALTER TABLE: add new columns ───────────────────────────────────────────

ALTER TABLE public.manufacturers
  ADD COLUMN IF NOT EXISTS production_country  text,
  ADD COLUMN IF NOT EXISTS us_import_status    public.mfr_us_import_status,
  ADD COLUMN IF NOT EXISTS volume_tier         public.mfr_volume_tier,
  ADD COLUMN IF NOT EXISTS market_segment      public.mfr_market_segment,
  ADD COLUMN IF NOT EXISTS ownership_type      public.mfr_ownership_type,
  ADD COLUMN IF NOT EXISTS low_confidence      boolean DEFAULT false;

-- ── 3. CRITICAL DATA CORRECTIONS ──────────────────────────────────────────────

-- Walther: parent is PW Group (Umarex); US entity is Walther Arms Inc. (not PW Arms importer)
UPDATE public.manufacturers SET
  parent_company   = 'PW Group (Umarex)',
  ownership_type   = 'Subsidiary',
  description      = 'German pistol manufacturer with roots to 1886. Owner of the PP, PPK, P99, PDP, and PPQ series. The American market is served by Walther Arms, Inc. (Fort Smith, AR), a wholly-owned US subsidiary established ~2012. Prior to that, Smith & Wesson served as the US importer from 1999–2012. Internationally, Walther is owned by PW Group (the Umarex parent), but the Walther brand and firearms division operate as a distinct entity.'
WHERE name = 'Walther';

-- Kahr Arms: TC was never a subsidiary — sold to S&W in 2007
UPDATE public.manufacturers SET
  subsidiaries = ARRAY['Auto-Ordnance']
WHERE name = 'Kahr Arms';

-- Bushmaster: acquired by Crotalus Holdings post-Remington bankruptcy
UPDATE public.manufacturers SET
  parent_company = 'Crotalus Holdings',
  ownership_type = 'Subsidiary',
  headquarters   = 'Carson City, NV',
  active         = true
WHERE name = 'Bushmaster';

-- Remington: now RemArms LLC under Roundhill Group (RemArms licenses name from Vista)
UPDATE public.manufacturers SET
  parent_company     = 'Roundhill Group (RemArms LLC)',
  ownership_type     = 'Subsidiary',
  production_country = 'USA',
  headquarters       = 'LaGrange, GA',
  description        = 'America''s oldest gun maker, founded by Eliphalet Remington in 1816. After filing for bankruptcy in 2020, the brand and firearms IP were acquired by Roundhill Group as RemArms LLC. The Remington Ammunition brand was separately acquired by Vista Outdoor; RemArms licenses the Remington name from Vista. The historic Ilion, NY factory closed March 2024; production moved to LaGrange, GA. Famous for the 870 shotgun (over 11 million made) and the Model 700 rifle.'
WHERE name = 'Remington';

-- Smith & Wesson: SWBI is a public company; AOB was spun off as a sibling, not a parent
UPDATE public.manufacturers SET
  parent_company = NULL,
  ownership_type = 'Public',
  description    = 'One of the oldest American firearms manufacturers, founded by Horace Smith and Daniel B. Wesson in 1852. In 2020, American Outdoor Brands (accessories division) was spun off as a separate public company (AOUT); S&W Brands then renamed itself Smith & Wesson Brands (SWBI). Known for revolvers and the M&P series of polymer pistols.'
WHERE name = 'Smith & Wesson';

-- Mauser: Gebrüder Mauser & Cie. established 1874; factory lineage to Oberndorf (1811)
UPDATE public.manufacturers SET
  founded_year = 1874,
  description  = 'Historic German manufacturer. Gebrüder Mauser & Cie. was established in 1874 by Wilhelm and Paul Mauser; the factory lineage traces to the Königlich Württembergische Gewehrfabrik at Oberndorf (1811). The Mauser 98 bolt-action is the most influential rifle action in history. Now produces the M18 and M98 hunting rifles under the Lüke & Ortmeier Group umbrella.'
WHERE name = 'Mauser';

-- Kalashnikov Concern: rebranded from IZhMASH in 2013; state-owned
UPDATE public.manufacturers SET
  founded_year   = 2013,
  ownership_type = 'State-owned',
  description    = 'Russian state-owned small arms manufacturer. The IZhMASH factory in Izhevsk dates to 1807 and has been the primary producer of Kalashnikov-pattern rifles since 1947. The modern Kalashnikov Concern brand was established in 2013 as a corporate rebranding of IZhMASH. Imports to the US were banned in 2014 following sanctions related to the annexation of Crimea.'
WHERE name = 'Kalashnikov Concern';

-- DPMS: ownership post-Remington bankruptcy is unconfirmed — flag as low confidence / dormant
UPDATE public.manufacturers SET
  parent_company = NULL,
  ownership_type = NULL,
  low_confidence = true,
  description    = 'Minnesota manufacturer of AR-platform rifles. Was a major AR producer under Freedom Group / Remington Outdoor. Sold during the 2020 Remington Outdoor bankruptcy; current ownership unconfirmed. Status: dormant as of spec date (April 2026). Low confidence on ownership data.'
WHERE name = 'DPMS';

-- Rossi: wholly owned by Taurus Armas S.A.
UPDATE public.manufacturers SET
  parent_company = 'Taurus Armas S.A.',
  ownership_type = 'Subsidiary'
WHERE name = 'Rossi';

-- Charles Daly: original company 1875; modern entity is a subsequent revival
UPDATE public.manufacturers SET
  founded_year = 1875,
  description  = 'American firearms brand with origins in the Charles Daly Company of New York (1875). The original company closed; the brand was revived and has changed hands multiple times. The current entity offers imported shotguns, rifles, and pistols. Note: the 1875 date reflects the founding of the original brand entity; the modern company is a subsequent revival.'
WHERE name = 'Charles Daly';

-- Gemtech: acquired by American Outdoor Brands (AOUT, the spun-off accessories company)
UPDATE public.manufacturers SET
  parent_company = 'American Outdoor Brands (AOUT)',
  ownership_type = 'Subsidiary'
WHERE name = 'Gemtech';

-- Sig Sauer: brand originated Germany/Switzerland; US entity (SIGARMS/SIG Sauer Inc.) is now dominant
UPDATE public.manufacturers SET
  country_of_origin = 'USA',
  founded_year      = 1976,
  description       = 'Originally a collaboration between Swiss SIG (est. 1853) and German J.P. Sauer & Sohn (est. 1751), the SIG–Sauer brand partnership began in 1976. The US subsidiary SIGARMS Inc. was established in 1985 (Exeter, NH) and has become the dominant commercial entity — producing the P320, P365, MCX, and other platforms stateside. Brand origin: Germany/Switzerland. Primary production and corporate headquarters: Newington, NH, USA.'
WHERE name = 'Sig Sauer';

-- Windham Weaponry: ceased operations September 2023 (founder Richard Dyke died March 1, 2023)
UPDATE public.manufacturers SET
  active      = false,
  description = 'Maine manufacturer of American-made AR-15 rifles, founded by Richard Dyke after he sold Bushmaster Firearms. Known for Maine-made craftsmanship and a loyal following. Ceased operations in September 2023 following the death of founder Richard Dyke (March 1, 2023).'
WHERE name = 'Windham Weaponry';

-- ── 4. INSERT TIER 1 — CRITICAL ADDITIONS ─────────────────────────────────────

INSERT INTO public.manufacturers
  (name, alternate_names, country_of_origin, founded_year, active, categories,
   parent_company, subsidiaries, description, notable_models, website, headquarters,
   production_country, us_import_status, volume_tier, market_segment, ownership_type)
VALUES

('Hi-Point Firearms',
 ARRAY['Beemiller Inc.', 'Strassell''s Machine'],
 'USA', 1992, true,
 ARRAY['Handgun', 'Rifle'],
 NULL, NULL,
 'Ohio-based manufacturer of budget semi-automatic pistols and pistol-caliber carbines. All firearms are 100% American-made. Offers a lifetime transferable warranty on every firearm. Top-10 US manufacturer by unit volume with an estimated 2M+ total guns produced. Known as the accessible entry point for first-time buyers. The C-9 is the highest-volume 9mm pistol sold below $200 in the US market.',
 ARRAY['C-9', 'JCP40', 'JHP45', 'JXP10', '995 Carbine', '4095 Carbine', '4595 Carbine'],
 'hi-pointfirearms.com', 'Mansfield, OH',
 'USA', 'Domestic', 'Mass', 'mass', 'Independent'),

('SCCY Industries',
 ARRAY['SCCY'],
 'USA', 2003, true,
 ARRAY['Handgun'],
 NULL, NULL,
 'Florida manufacturer of compact double-action-only pistols at budget price points. The CPX series has exceeded 1 million units sold, making SCCY one of the highest-volume US handgun manufacturers. Known for DAO trigger, lifetime warranty, and sub-$300 MSRP. Popular as a first carry gun and for the value-conscious buyer.',
 ARRAY['CPX-1', 'CPX-2', 'CPX-3', 'DVG-1'],
 'sccy.com', 'Daytona Beach, FL',
 'USA', 'Domestic', 'High', 'mass', 'Independent'),

('HS Produkt',
 ARRAY['HS-Product', 'H&S Produkt d.o.o.'],
 'Croatia', 1991, true,
 ARRAY['Handgun'],
 NULL, NULL,
 'Croatian manufacturer and primary OEM supplier behind Springfield Armory''s XD pistol line. The HS2000 (marketed in the US as the XD since 2002) is one of the most successful polymer striker-fired pistol designs of the modern era. Also supplies Croatian and other national military forces. One of the largest handgun producers in the world by unit volume. Note: HS Produkt manufactures; Springfield Armory handles all US marketing and sales.',
 ARRAY['HS2000', 'VHS-2', 'XD (as sold by Springfield Armory in the US)'],
 'hs-produkt.hr', 'Karlovac, Croatia',
 'Croatia', 'Active Import', 'Mass', 'mass', 'Independent'),

('Anderson Manufacturing',
 ARRAY['AM-15', 'Anderson Arms'],
 'USA', 2006, true,
 ARRAY['Rifle', 'Accessories'],
 NULL, NULL,
 'Kentucky manufacturer and one of the largest producers of AR-15 lower receivers in the United States. Core supplier to the AR parts/build market as well as a complete rifle manufacturer. Known for value-priced complete rifles and the proprietary RF85 dry-lubricant-treated lower. High-volume producer that supplied millions of AR components to the civilian market.',
 ARRAY['AM-15', 'AM-10', 'RF85'],
 'andersonmanufacturing.com', 'Hebron, KY',
 'USA', 'Domestic', 'High', 'mass', 'Independent'),

('Thompson/Center Arms',
 ARRAY['T/C', 'T/C Arms', 'Thompson Center'],
 'USA', 1965, true,
 ARRAY['Rifle', 'Handgun'],
 NULL, NULL,
 'New Hampshire-based manufacturer known for the Contender single-shot pistol/rifle system and the Encore break-action platform. Originally founded 1965; acquired by S&W in 2007, phased out in 2021, and reacquired in 2024 by original pre-S&W owner Gregg Ritz. Production restarted in Indiana. A significant American hunting and handgun hunting brand.',
 ARRAY['Contender', 'Encore', 'Compass', 'Dimension', 'Icon', 'Venture'],
 'tcarms.com', 'Rochester, NH',
 'USA', 'Domestic', 'Boutique', 'collector', 'Independent'),

-- ── 5. INSERT TIER 2 — HIGH VALUE ADDITIONS ───────────────────────────────────

('Franchi',
 ARRAY['Luigi Franchi S.p.A.'],
 'Italy', 1868, true,
 ARRAY['Shotgun'],
 'Beretta Holding', NULL,
 'Italian semi-automatic and over/under shotgun manufacturer, owned by Beretta Holding alongside Benelli, Stoeger, and Uberti. The Affinity inertia-driven semi-auto is a well-regarded waterfowl and upland gun. Offers a mid-tier alternative between Stoeger (budget) and Benelli (premium) within the Beretta family.',
 ARRAY['Affinity 3', 'Affinity 5', 'Instinct L', 'Instinct SL', 'Momentum'],
 'franchiusa.com', 'Brescia, Italy',
 'Italy', 'Active Import', 'High', 'premium', 'Subsidiary'),

('Tanfoglio',
 ARRAY['F.A.S. Tanfoglio', 'Fratelli Tanfoglio'],
 'Italy', 1945, true,
 ARRAY['Handgun'],
 NULL, NULL,
 'Italian pistol manufacturer and the primary OEM behind the EAA Witness line sold in the US. The Tanfoglio design is a CZ 75-derived platform dominant in IPSC/USPSA competition, particularly in the Limited and Open divisions. Widely regarded as producing some of the best out-of-the-box competition pistols available. Also manufactures for other European brands.',
 ARRAY['Stock II', 'Stock III', 'Limited Custom', 'Witness', 'Gold Custom'],
 'tanfoglio.it', 'Gardone Val Trompia, Italy',
 'Italy', 'Active Import', 'Mid', 'competition', 'Independent'),

('Noveske Rifleworks',
 ARRAY['Noveske'],
 'USA', 2001, true,
 ARRAY['Rifle', 'Accessories'],
 'Cadre Holdings', NULL,
 'Oregon manufacturer of premium AR-platform rifles, known for match-grade barrels, mil-spec-plus fit and finish, and a devoted following among serious shooters. Founded by John Noveske; now owned by Cadre Holdings following Noveske''s death in 2013. Influential in shaping expectations for premium AR quality. The N4 series is a benchmark for lightweight, accurate AR builds.',
 ARRAY['Rogue', 'Infidel', 'Space Invader', 'Afghan', 'Diplomat'],
 'noveske.com', 'Grants Pass, OR',
 'USA', 'Domestic', 'Boutique', 'premium', 'Subsidiary'),

('Primary Weapons Systems',
 ARRAY['PWS'],
 'USA', 2000, true,
 ARRAY['Rifle', 'Accessories'],
 NULL, NULL,
 'Idaho-based manufacturer of short-stroke piston-driven AR-platform rifles. Known for the proprietary Enhanced Reliability Operating System (EROS) long-stroke piston. Produces rifles in 5.56, 7.62x39, and .300 Blackout. Respected in the LE and military-adjacent market for reliability in adverse conditions. Note: founding date confirmed as 2000; company traces parts-making roots to early 1990s.',
 ARRAY['MK1 Mod 2', 'MK216', 'MK112', 'MK107', 'Diablo', 'UXR'],
 'primaryweapons.com', 'Boise, ID',
 'USA', 'Domestic', 'Mid', 'premium', 'Independent'),

('Perazzi',
 ARRAY['Armi Perazzi'],
 'Italy', 1957, true,
 ARRAY['Shotgun'],
 NULL, NULL,
 'The premier competition over/under shotgun manufacturer in the world. Perazzi shotguns have been used by Olympic champions across trap, skeet, and sporting clays since the 1960s. Entirely hand-fitted, bespoke production in Brescia. Entry price point around $10,000; custom configurations run $30,000+. Mandatory reference for any competitive clay sports coverage.',
 ARRAY['MX8', 'MX2000', 'MX12', 'MX20', 'TMX', 'High Tech'],
 'perazzi.com', 'Brescia, Italy',
 'Italy', 'Active Import', 'Boutique', 'ultra-premium', 'Independent'),

('Krieghoff',
 ARRAY['Krieghoff International'],
 'Germany', 1886, true,
 ARRAY['Shotgun', 'Rifle'],
 NULL, NULL,
 'German manufacturer of premium over/under shotguns and combination guns. The K-80 is a dominant choice at the top level of international sporting clays and trap competition. Also produces the Semprio straight-pull bolt-action rifle and classic Drilling combination guns. Krieghoff International (Ottsville, PA) handles US distribution and service.',
 ARRAY['K-80', 'K-20', 'Semprio', 'Classic', 'Drilling'],
 'krieghoff.com', 'Ulm, Germany',
 'Germany', 'Active Import', 'Boutique', 'ultra-premium', 'Independent'),

('B&T AG',
 ARRAY['Brügger & Thomet', 'Bruegger and Thomet'],
 'Switzerland', 1991, true,
 ARRAY['Handgun', 'Rifle', 'Suppressors', 'Accessories'],
 NULL, NULL,
 'Swiss manufacturer of sub-machine guns, pistol-caliber carbines, and accessories. A significant supplier to NATO law enforcement and military units in Europe and internationally. The APC9 and SPC9 pistol-caliber platforms have increasing civilian availability in the US. Also manufactures suppressors and a range of tactical accessories. Known for exceptional Swiss manufacturing tolerances.',
 ARRAY['APC9', 'APC556', 'SPC9', 'GHM9', 'USW-A1', 'TP9'],
 'bt-ag.ch', 'Thun, Switzerland',
 'Switzerland', 'Active Import', 'Mid', 'military', 'Independent'),

('Norinco',
 ARRAY['China North Industries Corporation', '北方工业'],
 'China', 1980, true,
 ARRAY['Rifle', 'Handgun', 'Shotgun'],
 'China North Industries Group Corporation (CNGC)', NULL,
 'Chinese state-owned arms manufacturer and one of the largest firearms producers in the world by unit volume. Norinco rifles (SKS, AK-pattern) and pistols were widely imported to the US through the late 1980s and early 1990s and are common in the American milsurp market. Import to the US was banned by executive order in 1993. Still highly relevant for historical, milsurp, and field guide context.',
 ARRAY['Type 56', 'Type 81', 'NHM-91', 'SKS', '1911A1', 'HP9-1', 'HL12'],
 'norinco.com', 'Beijing, China',
 'China', 'Import Banned', 'Mass', 'military', 'State-owned'),

('American Tactical',
 ARRAY['ATI', 'American Tactical Imports'],
 'USA', 1986, true,
 ARRAY['Handgun', 'Rifle', 'Shotgun', 'Accessories'],
 NULL, NULL,
 'South Carolina-based importer of Turkish, German, and Filipino-made firearms sold under the ATI brand. Primarily known for 1911-pattern pistols (Turkish-made), shotguns, and the GSG rimfire rifle series (German-made by German Sport Guns). High-volume importer occupying the budget-to-value segment across multiple categories.',
 ARRAY['FX45', 'Cavalry 1911', 'GSG-16', 'Omni Hybrid', 'AA-9', 'Cavalry SX'],
 'americantactical.us', 'Summerville, SC',
 'Turkey / Germany / Philippines', 'Active Import', 'High', 'mass', 'Independent'),

('Pietta',
 ARRAY['F.LLI Pietta', 'Fratelli Pietta'],
 'Italy', 1960, true,
 ARRAY['Handgun', 'Rifle'],
 NULL, NULL,
 'Italian manufacturer of historical reproduction firearms and black powder revolvers. Second only to Uberti in reproduction volume; the two companies dominate the Western and historical reenactment markets. Pietta produces Colt SAA, Remington, and percussion revolver reproductions, as well as lever-action rifles. Widely sold in the US through Taylor''s & Co., Cimarron, and other distributors.',
 ARRAY['1873 SA Army', '1851 Navy', '1858 Remington', 'LeMat', 'Colt Walker', '1873 Rifle'],
 'pietta.it', 'Gardone Val Trompia, Italy',
 'Italy', 'Active Import', 'High', 'collector', 'Independent'),

-- ── 6. INSERT TIER 3 — COMPLETENESS ADDITIONS ─────────────────────────────────

('JP Enterprises',
 ARRAY['JPR', 'JP Rifles'],
 'USA', 1996, true,
 ARRAY['Rifle', 'Accessories'],
 NULL, NULL,
 'Minnesota manufacturer of precision AR-pattern and chassis rifles for competition shooting. The LRP-07 and JP-15 are benchmarks in 3-Gun and precision rifle competition. Known for the JPSCS silent captured recoil spring system and match-grade triggers. Primary market is serious competition shooters.',
 ARRAY['JP-15', 'LRP-07', 'GMR-15', 'JPGS-20'],
 'jprifles.com', 'Hugo, MN',
 'USA', 'Domestic', 'Boutique', 'competition', 'Independent'),

('Seekins Precision',
 ARRAY['Seekins'],
 'USA', 2009, true,
 ARRAY['Rifle', 'Accessories'],
 NULL, NULL,
 'Idaho manufacturer of precision AR-platform rifles and bolt-action hunting/precision rifles. Known for in-house CNC machining and tight tolerances. The Havak line of bolt-action rifles has received strong reviews for accuracy and value in the precision hunting market. Also produces a wide range of AR components.',
 ARRAY['SP10', 'SP15', 'Havak Pro Hunter', 'Havak Element', 'RTAK'],
 'seekinsprecision.com', 'Lewiston, ID',
 'USA', 'Domestic', 'Boutique', 'premium', 'Independent'),

('Girsan',
 ARRAY['MC Girsan'],
 'Turkey', 1994, true,
 ARRAY['Handgun'],
 NULL, NULL,
 'Turkish pistol manufacturer producing a range of CZ 75 and Beretta 92-pattern pistols, as well as 1911-pattern handguns. Widely imported to the US through EAA Corporation. Known for offering quality Turkish construction at value-tier pricing. The MC28SA is a popular Beretta 92-pattern option at under $400.',
 ARRAY['MC28SA', 'MC9', 'MC1911', 'Regard MC', 'MC14T'],
 'girsanarms.com', 'Giresun, Turkey',
 'Turkey', 'Active Import', 'Mid', 'mass', 'Independent'),

-- ── 7. OPTIONAL ADDITIONS ─────────────────────────────────────────────────────

('Cabot Guns',
 NULL,
 'USA', 2011, true,
 ARRAY['Handgun'],
 NULL, NULL,
 'Pennsylvania manufacturer of ultra-premium bespoke 1911 pistols. Starting price around $4,000; Cabot is considered among the finest 1911 makers in the world. Known for extreme precision machining tolerances and custom engraving.',
 ARRAY['National Standard', 'American Joe', 'S103', 'Cabot Black Diamond'],
 'cabotguns.com', 'Cabot, PA',
 'USA', 'Domestic', 'Micro', 'ultra-premium', 'Independent'),

('Vudoo Gun Works',
 NULL,
 'USA', 2017, true,
 ARRAY['Rifle'],
 NULL, NULL,
 'Utah manufacturer of precision rimfire bolt-action rifles. The V-22 is a dominant platform in NRL22 and rimfire precision rifle competition. Known for CNC-machined actions with centerfire-grade tolerances applied to .22 LR. Widely considered the benchmark for competition rimfire rifles.',
 ARRAY['V-22', 'Sinister'],
 'vudoogunworks.com', 'St. George, UT',
 'USA', 'Domestic', 'Boutique', 'competition', 'Independent')

ON CONFLICT (name) DO NOTHING;
