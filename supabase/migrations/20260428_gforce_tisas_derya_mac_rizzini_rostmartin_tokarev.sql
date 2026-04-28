-- ============================================================
-- GForce Arms, Tisas, Derya, MAC, Rizzini, Rost Martin,
-- Tokarev USA — Manufacturers + Gun Models
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
  'GForce Arms',
  ARRAY['GForce', 'GFA'],
  'United States', 2018, true,
  ARRAY['Shotgun'],
  NULL, NULL,
  'GForce Arms is a US-based importer and distributor of Turkish-manufactured shotguns, founded in 2018 and headquartered in Goodlettsville, Tennessee. The company sources shotguns from established Turkish factories and sells them under the GForce brand at budget-friendly price points. Their lineup includes semi-automatic and pump-action 12-gauge models targeting the home defense, tactical, and entry-level sporting markets. Popular among buyers seeking inexpensive Benelli M4-style aesthetics at a fraction of the cost.',
  ARRAY['GF1', 'GF2', 'GF3', 'GFP3', 'BR99'],
  'https://www.gforcearms.com', 'Goodlettsville, Tennessee, USA',
  'Turkey', 'Active Import', 'Mid', 'mass', 'Independent', false,
  'Manufacturer',
  ARRAY['budget semi-auto shotguns', 'pump-action shotguns', 'tactical shotguns'],
  NULL,
  199, false, NULL,
  'GForce Arms entered the market at a time when Turkish shotgun imports were booming. Their GF3 semi-auto became one of the most affordable Benelli M4-style shotguns available in the US market.',
  ARRAY['Turkey', 'United States'], 'Low', 'GF3'
),

(
  'Tisas',
  ARRAY['Trabzon Gun Industry', 'Trabzon Silah Sanayii', 'Tisas Arms'],
  'Turkey', 1993, true,
  ARRAY['Pistol'],
  NULL, NULL,
  'Tisas (Trabzon Silah Sanayii A.Ş.) is a Turkish firearm manufacturer founded in 1993 in Trabzon, Turkey. The company produces 1911-pattern pistols and modern polymer-framed pistols for both the domestic Turkish market and US export. In the US, Tisas is best known for high-value 1911-platform handguns (Regent series) and the Zigana series of polymer-framed 9mm pistols. Tisas has become a significant presence in the budget-to-mid-tier US handgun market, offering feature-rich pistols at aggressive price points. They also supply pistols to several military and police contracts in the Middle East and Africa.',
  ARRAY['Regent BR9', 'Regent 45', 'Zigana F', 'Zigana T', 'PX-9', '1911 A1'],
  'https://www.tisas.com.tr', 'Trabzon, Turkey',
  'Turkey', 'Active Import', 'Mid', 'mass', 'Independent', false,
  'Manufacturer',
  ARRAY['1911-platform pistols', 'polymer-framed pistols', '9mm handguns'],
  NULL,
  399, true, 'Supplies pistols to several Middle Eastern and African military/police contracts.',
  'Tisas produces one of the widest ranges of 1911 variants of any Turkish manufacturer, from GI-spec to full custom-grade, all at significantly lower prices than US-made equivalents.',
  ARRAY['Turkey'], 'Low', 'Regent BR9'
),

(
  'Derya',
  ARRAY['Derya Arms', 'Derya Av Tufekleri'],
  'Turkey', 1997, true,
  ARRAY['Shotgun'],
  NULL, NULL,
  'Derya Arms (Derya Av Tüfekleri San. Tic. A.Ş.) is a Turkish shotgun manufacturer founded in 1997 and based in Konya, Turkey. Derya produces semi-automatic and pump-action shotguns for export markets worldwide, with a particular focus on the US, European, and Australian markets. Their MK-12 and Venus semi-automatic shotguns are their best-known export models — inertia-operated platforms at budget price points. Derya shotguns are imported into the US under various brand names by multiple distributors.',
  ARRAY['MK-12', 'Venus', 'Anakon', 'SM-4'],
  NULL, 'Konya, Turkey',
  'Turkey', 'Active Import', 'Mid', 'mass', 'Independent', false,
  'Manufacturer',
  ARRAY['semi-auto shotguns', 'inertia-operated shotguns', 'budget shotguns'],
  NULL,
  299, false, NULL,
  'Derya is one of several Turkish shotgun makers that entered the US market in the 2010s. Their MK-12 became notable for offering inertia-operated reliability at a price point well below established Italian makers.',
  ARRAY['Turkey'], 'Low', 'MK-12'
),

(
  'Military Armament Corporation',
  ARRAY['MAC', 'Ingram MAC', 'M.A.C.'],
  'United States', 1969, false,
  ARRAY['Pistol'],
  NULL, NULL,
  'Military Armament Corporation (MAC) was an American firearms manufacturer founded in 1969 by Mitch WerBell III and Gordon Ingram in Powder Springs, Georgia. The company is best known for the MAC-10 and MAC-11 submachine guns designed by Gordon Ingram — compact, open-bolt, blowback-operated firearms chambered in .45 ACP, 9mm, and .380 ACP respectively. The MAC-10 gained notoriety in law enforcement circles and popular culture through the 1970s and 1980s. The original MAC company dissolved by the mid-1970s; production and trademarks passed through several successor companies including RPB Industries, SWD Inc., and Cobray. Masterpiece Arms (MPA) currently produces MAC-pattern semi-automatic pistols and carbines.',
  ARRAY['MAC-10', 'MAC-11'],
  NULL, 'Powder Springs, Georgia, USA (historical)',
  'United States', 'Historical', 'Micro', 'military', 'Independent', false,
  'Manufacturer',
  ARRAY['MAC-10 submachine gun', 'MAC-11 submachine gun', 'compact SMGs', 'WerBell suppressor systems'],
  ARRAY['Gordon Ingram', 'Mitch WerBell III'],
  NULL, true, 'The MAC-10 was offered to the US military and several foreign governments. While it saw limited official adoption, it was used by some special operations units and has appeared in numerous conflicts through the black market.',
  'Gordon Ingram designed the MAC-10 to be manufactured as cheaply and simply as possible — it has fewer than 30 parts and was specifically engineered to be produced in countries with limited industrial infrastructure.',
  ARRAY['United States'], 'High', 'MAC-10'
),

(
  'Rizzini',
  ARRAY['Battista Rizzini', 'Rizzini S.r.l.', 'B. Rizzini'],
  'Italy', 1966, true,
  ARRAY['Shotgun'],
  NULL, NULL,
  'Rizzini (Battista Rizzini S.r.l.) is an Italian shotgun manufacturer founded in 1966 in Marcheno, in the Val Trompia gunmaking valley of Brescia, Italy — the historic heart of Italian firearms manufacturing. Rizzini produces over-and-under and side-by-side shotguns in the mid-to-high-end market, known for exceptional wood-to-metal fit, deep-relief engraving options, and traditional Italian craftsmanship. The company is separate from the related but distinct F.lli Rizzini (Fratelli Rizzini). Rizzini shotguns are imported into the US by Rizzini USA and compete with Beretta, Browning, and Fausti in the upland and sporting clays segments.',
  ARRAY['Artemis', 'Round Body', 'Fierce 1', 'Vertigo', 'Pernice', 'Riserva', 'BR552'],
  'https://www.rizzini.it', 'Marcheno, Brescia, Italy',
  'Italy', 'Active Import', 'Boutique', 'premium', 'Independent', false,
  'Manufacturer',
  ARRAY['over-and-under shotguns', 'side-by-side shotguns', 'upland shotguns', 'sporting clays'],
  ARRAY['Battista Rizzini'],
  2200, false, NULL,
  'Marcheno, where Rizzini is based, is home to dozens of gunmakers in a valley where firearms have been produced since the 15th century. The local gunsmith tradition is a UNESCO-recognized cultural heritage.',
  ARRAY['Italy'], 'Medium', 'Artemis'
),

(
  'Rost Martin',
  ARRAY['Rost & Martin', 'Rost Martin GmbH'],
  'Germany', 2020, true,
  ARRAY['Pistol'],
  NULL, NULL,
  'Rost Martin is a German firearm manufacturer founded in 2020 in Rottenburg am Neckar, Baden-Württemberg, Germany. The company was founded by former Heckler & Koch engineers with the goal of producing a striker-fired service pistol to German engineering standards at a competitive price point. Their sole current model, the RM1SF, is a full-size 9mm striker-fired pistol built to exceptional tolerances and featuring a modular design. The RM1SF has attracted significant attention in the European and US markets for its build quality relative to its price. Rost Martin represents one of the first truly new German handgun manufacturers to emerge in decades.',
  ARRAY['RM1SF'],
  'https://www.rost-martin.de', 'Rottenburg am Neckar, Baden-Württemberg, Germany',
  'Germany', 'Active Import', 'Micro', 'premium', 'Independent', false,
  'Manufacturer',
  ARRAY['striker-fired pistols', 'service pistols', 'German-engineered handguns'],
  NULL,
  699, false, NULL,
  'Rost Martin was founded by engineers who previously worked at Heckler & Koch — the same engineering tradition behind the VP9 and USP is represented in the RM1SF''s design philosophy.',
  ARRAY['Germany'], 'Low', 'RM1SF'
),

(
  'Tokarev USA',
  ARRAY['Tokarev', 'Tokarev Arms USA'],
  'United States', 2015, true,
  ARRAY['Shotgun', 'Pistol'],
  NULL, NULL,
  'Tokarev USA is a US-based importer and distributor of Turkish-manufactured firearms sold under the Tokarev brand. Despite the name''s association with the historic Soviet Tokarev TT pistol, Tokarev USA''s primary product line consists of Turkish-made semi-automatic shotguns — most notably the TX3-12 series. The company imports inertia-operated and gas-operated 12-gauge shotguns built for the home defense and tactical markets, often featuring pistol-grip stocks and extended magazine tubes. Tokarev USA also imports Tokarev TT-pattern semi-automatic pistols in 9mm and 7.62x25mm.',
  ARRAY['TX3-12', 'TX3-12SB', 'TT Pistol'],
  'https://www.tokarevusa.com', 'United States',
  'Turkey', 'Active Import', 'Micro', 'mass', 'Independent', false,
  'Manufacturer',
  ARRAY['semi-auto shotguns', 'TT-pattern pistols', 'tactical shotguns'],
  NULL,
  399, false, NULL,
  'The Tokarev name evokes the iconic Soviet TT-33 pistol designed by Fyodor Tokarev in 1930 — one of the most widely produced military pistols of the 20th century. Tokarev USA uses the historical brand name for a contemporary line of Turkish-made firearms.',
  ARRAY['Turkey', 'United States'], 'Low', 'TX3-12'
)

ON CONFLICT (name) DO NOTHING;


-- ── GUN MODELS — GFORCE ARMS ─────────────────────────────────

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
  'GForce Arms', 'GF1', '12 Gauge',
  'Shotgun', 'Semi-Auto', 5, 2018,
  false, 'Turkey',
  'The GForce Arms GF1 is a gas-operated semi-automatic 12-gauge shotgun with a traditional wood stock, designed for sport shooting and hunting. Entry-level pricing with a conventional aesthetic.',
  299, 97.6, 47.5,
  false, false, NULL,
  'Active', 'GForce GF',
  ARRAY['12 Gauge'],
  ARRAY['gforce gf1', 'gf 1'],
  'Modern', 'Single-Action',
  ARRAY['hunting', 'sport'],
  NULL, 'Turkey', false, NULL
),

(
  'GForce Arms', 'GF3', '12 Gauge',
  'Shotgun', 'Semi-Auto', 5, 2019,
  false, 'Turkey',
  'The GForce Arms GF3 is a semi-automatic 12-gauge shotgun styled after the Benelli M4 with a pistol-grip collapsible stock, ghost ring sights, and Picatinny rail. One of the most affordable Benelli M4-inspired shotguns on the US market. Gas-operated with a chrome-lined barrel. Popular for home defense and 3-gun competition at a budget price point.',
  399, 98.5, 39.5,
  false, false,
  ARRAY['GF3T (threaded barrel)', 'GF3 with fixed stock'],
  'Active', 'GForce GF',
  ARRAY['12 Gauge'],
  ARRAY['gforce gf3', 'gf 3', 'gforce tactical'],
  'Modern', 'Single-Action',
  ARRAY['home defense', 'competition', 'tactical'],
  'The GF3 became popular in the 3-gun competition community as a budget alternative to the Benelli M4 — offering similar aesthetics and reasonable reliability at roughly one-quarter of the price.',
  'Turkey', false, NULL
),

(
  'GForce Arms', 'BR99', '12 Gauge',
  'Shotgun', 'Semi-Auto', 5, 2021,
  false, 'Turkey',
  'The GForce Arms BR99 is an inertia-operated semi-automatic 12-gauge shotgun with a traditional walnut or synthetic stock, positioned as a more refined sporting shotgun than the GF series. The inertia system offers improved reliability across a range of load pressures. Designed for upland hunting and sporting clays.',
  449, 96.0, 48.0,
  false, false,
  ARRAY['BR99 Walnut', 'BR99 Synthetic', 'BR99 Compact'],
  'Active', 'GForce BR',
  ARRAY['12 Gauge'],
  ARRAY['br 99', 'gforce br99'],
  'Modern', 'Single-Action',
  ARRAY['hunting', 'sport'],
  NULL, 'Turkey', false, NULL
),

(
  'GForce Arms', 'GFP3', '12 Gauge',
  'Shotgun', 'Pump-Action', 5, 2019,
  false, 'Turkey',
  'The GForce Arms GFP3 is a pump-action 12-gauge shotgun with a tactical configuration — pistol grip, extended magazine tube, and Picatinny rail. Budget-priced home defense pump shotgun with an aggressive tactical aesthetic.',
  249, 88.0, 38.5,
  false, false, NULL,
  'Active', 'GForce GFP',
  ARRAY['12 Gauge'],
  ARRAY['gfp 3', 'gforce pump'],
  'Modern', 'Single-Action',
  ARRAY['home defense', 'tactical'],
  NULL, 'Turkey', false, NULL
);


-- ── GUN MODELS — TISAS ───────────────────────────────────────

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
  'Tisas', 'Regent BR9', '9mm Luger',
  'Pistol', 'Single-Action', 9, 2018,
  false, 'Turkey',
  'The Tisas Regent BR9 is a 9mm 1911-pattern semi-automatic pistol featuring a steel frame and slide, standard 1911 single-action trigger, and a Browning tilting-barrel lockup. It brings the classic 1911 platform to a 9mm double-stack configuration with a higher-capacity magazine than traditional .45 ACP 1911s. The Regent BR9 is one of the most affordable steel-frame 9mm 1911s on the US market and has become popular as an entry point into the 1911 platform.',
  399, 37.0, 8.5,
  false, false,
  ARRAY['Regent BR9 Combat', 'Regent BR9 with rail'],
  'Active', 'Tisas Regent',
  ARRAY['9mm Luger'],
  ARRAY['regent br9', 'tisas 1911 9mm', 'br9'],
  'Modern', 'Single-Action',
  ARRAY['sport', 'carry', 'competition'],
  'The Regent BR9 is frequently cited in online forums as offering 85-90% of a mid-tier American 1911 at roughly half the price — making it a gateway gun for shooters who want 1911 ergonomics without the premium cost.',
  'Turkey', false, NULL
),

(
  'Tisas', 'Regent 45', '.45 ACP',
  'Pistol', 'Single-Action', 8, 2015,
  false, 'Turkey',
  'The Tisas Regent 45 is a GI-spec .45 ACP 1911 built to traditional dimensions and specifications — fixed GI sights, standard trigger, and a classic parkerized or blued finish. Designed for shooters who want a traditional 1911 at a budget price. Tisas manufactures several Regent 45 variants ranging from GI-spec to enhanced models with adjustable sights and improved triggers.',
  399, 38.4, 8.5,
  false, false,
  ARRAY['Regent 45 GI', 'Regent 45 Enhanced', 'Regent 45 Commander'],
  'Active', 'Tisas Regent',
  ARRAY['.45 ACP'],
  ARRAY['regent 45', 'tisas 45', 'tisas 1911 45'],
  'Modern', 'Single-Action',
  ARRAY['sport', 'carry', 'collector'],
  NULL, 'Turkey', false, NULL
),

(
  'Tisas', 'Zigana F', '9mm Luger',
  'Pistol', 'DA/SA', 15, 2010,
  false, 'Turkey',
  'The Tisas Zigana F is a full-size service pistol in 9mm with a double-action/single-action trigger and a steel frame. The Zigana series is Tisas''s flagship modern service pistol line, designed for both military/police and civilian markets. The Zigana F has been adopted by several Turkish military and police agencies. In the US market it represents a DA/SA alternative to striker-fired pistols at a competitive price.',
  449, 35.0, 7.8,
  false, false,
  ARRAY['Zigana F Combat', 'Zigana F+'],
  'Active', 'Tisas Zigana',
  ARRAY['9mm Luger'],
  ARRAY['zigana f', 'tisas zigana', 'zigana full size'],
  'Modern', 'DA/SA',
  ARRAY['carry', 'service', 'sport'],
  'The Zigana platform has been one of Turkey''s most widely issued military sidearms — the domestic version predates the US export model by over a decade.',
  'Turkey', false, NULL
),

(
  'Tisas', 'PX-9', '9mm Luger',
  'Pistol', 'Striker-Fired', 17, 2020,
  false, 'Turkey',
  'The Tisas PX-9 is a striker-fired full-size 9mm pistol designed for the modern service pistol market. Features a polymer frame, tool-less takedown, front and rear serrations, an optics-ready slide, and a Picatinny rail. The PX-9 competes directly with the Glock 17, SIG P320, and similar striker-fired service pistols at a significantly lower price point. Available in standard, Combat, and Gen 2 variants.',
  399, 28.5, 7.9,
  false, false,
  ARRAY['PX-9 Combat', 'PX-9 Gen 2', 'PX-9 Compact'],
  'Active', 'Tisas PX',
  ARRAY['9mm Luger'],
  ARRAY['px9', 'px 9', 'tisas px9'],
  'Modern', 'Striker-Fired',
  ARRAY['carry', 'service', 'sport'],
  'The PX-9 was designed specifically to compete in international military and police tenders alongside Glock, Beretta, and SIG — at a price point typically 30-40% lower.',
  'Turkey', false, NULL
);


-- ── GUN MODELS — DERYA ───────────────────────────────────────

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
  'Derya', 'MK-12', '12 Gauge',
  'Shotgun', 'Semi-Auto', 5, 2010,
  false, 'Turkey',
  'The Derya MK-12 is an inertia-operated semi-automatic 12-gauge shotgun featuring an AR-15-style pistol grip and collapsible stock, Picatinny top rail, and M-LOK handguard. One of the most distinctive Turkish tactical shotguns on the US market due to its AR-aesthetic. Reliable with a wide range of 2-3/4" and 3" loads. Popular for home defense and 3-gun competition.',
  599, 102.0, 39.0,
  false, false,
  ARRAY['MK-12 Fixed Stock', 'MK-12 with optic'],
  'Active', 'Derya MK',
  ARRAY['12 Gauge'],
  ARRAY['derya mk12', 'mk 12', 'derya tactical'],
  'Modern', 'Single-Action',
  ARRAY['home defense', 'competition', 'tactical'],
  'The MK-12''s AR-15 aesthetic was deliberately designed to appeal to US buyers already familiar with the AR platform — using the same pistol grip, stock adjustment, and manual of arms concepts where possible.',
  'Turkey', false, NULL
),

(
  'Derya', 'Venus', '12 Gauge',
  'Shotgun', 'Semi-Auto', 5, 2008,
  false, 'Turkey',
  'The Derya Venus is a more traditional-format inertia-operated semi-automatic 12-gauge shotgun with a conventional wood or synthetic stock. Designed for hunting and general sport use. The Venus represents Derya''s more conventional shotgun offering alongside the tactical MK series.',
  399, 96.0, 47.0,
  false, false,
  ARRAY['Venus Walnut', 'Venus Synthetic'],
  'Active', 'Derya Venus',
  ARRAY['12 Gauge'],
  ARRAY['derya venus', 'venus 12'],
  'Modern', 'Single-Action',
  ARRAY['hunting', 'sport'],
  NULL, 'Turkey', false, NULL
),

(
  'Derya', 'Anakon', '12 Gauge',
  'Shotgun', 'Semi-Auto', 5, 2005,
  true, 'Turkey',
  'The Derya Anakon is an earlier inertia-operated semi-automatic 12-gauge shotgun, one of Derya''s original export models. A conventional-format sporting shotgun with synthetic stock. Largely replaced in the lineup by the Venus and MK series.',
  349, 94.0, 46.5,
  false, false, NULL,
  'Discontinued', 'Derya Anakon',
  ARRAY['12 Gauge'],
  ARRAY['anakon 12'],
  'Modern', 'Single-Action',
  ARRAY['hunting', 'sport'],
  NULL, 'Turkey', false, NULL
);


-- ── GUN MODELS — MILITARY ARMAMENT CORPORATION ───────────────

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
  'Military Armament Corporation', 'MAC-10', '.45 ACP',
  'Pistol', 'Semi-Auto', 30, 1970,
  true, 'United States',
  'The MAC-10 is a compact open-bolt submachine gun designed by Gordon Ingram in 1964 and produced by Military Armament Corporation from 1970. Chambered in .45 ACP (with 9mm variants), the MAC-10 fires from an open bolt at a cyclic rate of approximately 1,090 rounds per minute — among the fastest of any submachine gun. The original MAC production ended in the mid-1970s. Post-1986, civilian ownership of pre-1986 registered MAC-10s as NFA items commands significant premiums. Semi-auto civilian versions were made by several successor companies. Masterpiece Arms (MPA) currently produces MAC-pattern semi-autos.',
  NULL, 68.0, 10.6,
  true, true,
  ARRAY['MAC-10 in 9mm', 'M10A1 (semi-auto successor)', 'Cobray M11 (successor)', 'MPA 930 (modern semi-auto)'],
  'Discontinued', 'MAC Ingram',
  ARRAY['.45 ACP', '9mm Luger'],
  ARRAY['mac10', 'm10', 'ingram mac-10', 'ingram m10'],
  'Cold War', 'Single-Action',
  ARRAY['military', 'collector'],
  'Gordon Ingram reportedly designed the MAC-10 after studying the Israeli Uzi — both share the concept of the magazine feeding through the pistol grip and the bolt wrapping around the barrel to keep the overall length minimal.',
  'United States', true,
  'Pre-1986 registered MAC-10 transferable machine guns typically sell for $3,000-$7,000 depending on condition, paperwork, and variant. Original MAC (not SWD/Cobray) examples with matching components are most desirable. The original Mitch WerBell-era suppressor threading is a sought detail.'
),

(
  'Military Armament Corporation', 'MAC-11', '.380 ACP',
  'Pistol', 'Semi-Auto', 16, 1972,
  true, 'United States',
  'The MAC-11 is a smaller, lighter version of the MAC-10, chambered in .380 ACP. Designed by Gordon Ingram as a more compact alternative for situations where the MAC-10''s size was a limitation. Even higher cyclic rate than the MAC-10 at approximately 1,200 rounds per minute. Like the MAC-10, original MAC production ended in the mid-1970s. The MAC-11 design continued through SWD Inc. as the M11/Nine (9mm) and Cobray M11. Semi-auto civilian pistol versions were widely produced.',
  NULL, 50.0, 8.1,
  true, true,
  ARRAY['MAC-11 in 9mm', 'SWD M11/Nine (successor)', 'Cobray M11 (successor)'],
  'Discontinued', 'MAC Ingram',
  ARRAY['.380 ACP', '9mm Luger'],
  ARRAY['mac11', 'm11', 'ingram mac-11', 'ingram m11'],
  'Cold War', 'Single-Action',
  ARRAY['military', 'collector'],
  'The MAC-11''s .380 ACP chambering was chosen specifically because the cartridge allowed the bolt to be lighter and faster-cycling than the 9mm or .45 ACP versions — at the cost of terminal performance.',
  'United States', true,
  'Pre-1986 registered MAC-11 machine guns are less common than MAC-10s and command similar or slightly lower prices. SWD and Cobray marked successors are much more common and less valuable as collectibles. Original MAC-11 markings are the key indicator.'
);


-- ── GUN MODELS — RIZZINI ─────────────────────────────────────

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
  'Rizzini', 'Artemis', '12 Gauge',
  'Shotgun', 'Break-Action', 2, 1990,
  false, 'Italy',
  'The Rizzini Artemis is an over-and-under shotgun positioned in the mid-to-upper tier of the Rizzini lineup, featuring a coin-finish boxlock action with floral scroll engraving, select walnut stock, and Rizzini''s characteristic attention to wood-to-metal fit. Available in 12, 20, 28 gauge, and .410 bore. Popular for upland hunting and sporting clays. The Artemis EL is the enhanced version with higher-grade wood and deeper engraving.',
  2200, 97.6, 43.0,
  false, false,
  ARRAY['Artemis EL', 'Artemis Light', 'Artemis in 20ga', 'Artemis in 28ga', 'Artemis in .410'],
  'Active', 'Rizzini Artemis',
  ARRAY['12 Gauge', '20 Gauge', '28 Gauge', '.410 Bore'],
  ARRAY['rizzini artemis', 'artemis el', 'b rizzini artemis'],
  'Modern', 'Single-Action',
  ARRAY['hunting', 'sport', 'collector'],
  'The Artemis is one of the most popular entry points into Italian O/U shotgunning — offering genuine Brescia craftsmanship at a price below the Beretta A400 Xcel and well below Perazzi.',
  'Italy', false, NULL
),

(
  'Rizzini', 'Vertigo', '12 Gauge',
  'Shotgun', 'Break-Action', 2, 2000,
  false, 'Italy',
  'The Rizzini Vertigo is a dedicated sporting clays and trap over-and-under, featuring a deeper action body for improved barrel weight distribution, adjustable comb, wide ventilated rib, and extended choke tubes. Designed specifically for the competitive clay target market. Available in 12 and 20 gauge with a range of barrel lengths from 28" to 32".',
  2800, 102.4, 47.0,
  false, false,
  ARRAY['Vertigo Competition', 'Vertigo Trap', 'Vertigo Sporting'],
  'Active', 'Rizzini Vertigo',
  ARRAY['12 Gauge', '20 Gauge'],
  ARRAY['rizzini vertigo', 'vertigo sporting', 'vertigo trap'],
  'Modern', 'Single-Action',
  ARRAY['competition', 'sport'],
  'The Vertigo''s deep action was specifically engineered to lower the bore axis relative to the shooter''s hand — reducing perceived muzzle rise on second-barrel shots, which matters significantly in sporting clays where follow-up shot speed is critical.',
  'Italy', false, NULL
),

(
  'Rizzini', 'Round Body', '12 Gauge',
  'Shotgun', 'Break-Action', 2, 1985,
  false, 'Italy',
  'The Rizzini Round Body is a side-by-side or over-and-under shotgun featuring a rounded action body — a traditional Brescian design element associated with pre-war Italian and English best guns. The rounded action requires more hand-fitting than a conventional square-back action and is offered only in the upper tiers of the Rizzini lineup. Represents Rizzini''s most traditional and craftsmanship-intensive offering.',
  4500, 96.0, 42.0,
  false, false,
  ARRAY['Round Body Game Gun', 'Round Body EL'],
  'Active', 'Rizzini Round Body',
  ARRAY['12 Gauge', '20 Gauge', '28 Gauge'],
  ARRAY['round body', 'rizzini round body', 'rizzini rb'],
  'Modern', 'Single-Action',
  ARRAY['hunting', 'collector', 'sport'],
  'The round-body action style traces directly to the British best gun tradition of the 19th century — a rounded action is structurally stronger but far more labor-intensive to produce, which is why it disappeared from mass production entirely.',
  'Italy', true,
  'Higher-grade wood and engraving examples (EL, EL Gold) are the most collectible. The rounded action is a hallmark of quality appreciated by experienced shotgunners. Italian manufacture with documented Rizzini provenance is important to value.'
),

(
  'Rizzini', 'Fierce 1', '12 Gauge',
  'Shotgun', 'Break-Action', 2, 2010,
  false, 'Italy',
  'The Rizzini Fierce 1 is an entry-level over-and-under from Rizzini, positioned to compete with Browning Citori and Beretta 686 in the mid-tier O/U market. Features a chrome-lined barrel, ventilated rib, and select walnut stock. The most accessible price point in the Rizzini lineup while retaining Italian manufacture.',
  1800, 96.8, 44.0,
  false, false,
  ARRAY['Fierce 1 Sporting', 'Fierce 1 Field'],
  'Active', 'Rizzini Fierce',
  ARRAY['12 Gauge', '20 Gauge'],
  ARRAY['fierce 1', 'rizzini fierce', 'fierce1'],
  'Modern', 'Single-Action',
  ARRAY['hunting', 'sport'],
  NULL, 'Italy', false, NULL
);


-- ── GUN MODELS — ROST MARTIN ─────────────────────────────────

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
  'Rost Martin', 'RM1SF', '9mm Luger',
  'Pistol', 'Striker-Fired', 17, 2022,
  false, 'Germany',
  'The Rost Martin RM1SF is a full-size striker-fired 9mm service pistol and the sole current model from the newly founded German manufacturer. Designed by former Heckler & Koch engineers, the RM1SF features a modular serialized chassis system (similar to the SIG P320 concept), an optics-ready slide with a direct-mount footprint, a flat-faced trigger, and exceptional fit and finish. The pistol is built to tolerances associated with German precision manufacturing — slide-to-frame fit and barrel lockup are notably tight for a production pistol. Available with a standard or threaded barrel and in black or FDE. The RM1SF generated significant industry interest on its debut for delivering HK-caliber manufacturing quality at a price competitive with SIG and Glock.',
  699, 24.8, 7.9,
  false, false,
  ARRAY['RM1SF with threaded barrel', 'RM1SF FDE', 'RM1SF Compact (announced)'],
  'Active', 'Rost Martin RM1',
  ARRAY['9mm Luger'],
  ARRAY['rm1sf', 'rm1 sf', 'rost martin rm1', 'rm 1sf'],
  'Modern', 'Striker-Fired',
  ARRAY['carry', 'service', 'sport'],
  'Rost Martin was founded specifically because its founders believed that a gap existed in the market for a German-engineered, German-made striker-fired pistol — a category that HK had deliberately avoided after discontinuing the P2000 SK line.',
  'Germany', false,
  'As the sole current model from a very new company, the RM1SF has mild early-production collector interest. First-year examples with low serial numbers are sometimes sought. The company''s HK-engineering pedigree is the primary point of collector curiosity.'
);


-- ── GUN MODELS — TOKAREV USA ─────────────────────────────────

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
  'Tokarev USA', 'TX3-12', '12 Gauge',
  'Shotgun', 'Semi-Auto', 5, 2016,
  false, 'Turkey',
  'The Tokarev USA TX3-12 is an inertia-operated semi-automatic 12-gauge shotgun imported from Turkey. Features a pistol-grip collapsible stock, ghost ring sights, and a tactical profile. One of the more affordable entries in the Turkish tactical shotgun market. Reliable with standard 2-3/4" and 3" loads. Popular for home defense and as an entry into 3-gun competition.',
  499, 97.0, 40.0,
  false, false,
  ARRAY['TX3-12SB (short barrel)', 'TX3-12 Fixed Stock'],
  'Active', 'Tokarev TX3',
  ARRAY['12 Gauge'],
  ARRAY['tx3 12', 'tokarev tx3', 'tx3-12'],
  'Modern', 'Single-Action',
  ARRAY['home defense', 'tactical', 'competition'],
  'Despite the Tokarev name''s association with the iconic Soviet TT pistol, Tokarev USA''s primary business is Turkish-made shotguns — the historical name is a branding choice rather than a manufacturing lineage.',
  'Turkey', false, NULL
),

(
  'Tokarev USA', 'TT Pistol', '9mm Luger',
  'Pistol', 'Single-Action', 8, 2016,
  false, 'Turkey',
  'The Tokarev USA TT Pistol is a semi-automatic pistol inspired by the Soviet Tokarev TT-33 design, chambered in 9mm Luger for the US market. The original TT-33 was chambered in 7.62x25mm Tokarev; this import version adapts the external design to a more commercially available cartridge. Features the classic Tokarev lines including the exposed hammer and magazine-fed single-action operation. Imported from Turkey.',
  349, 28.0, 7.7,
  false, false,
  ARRAY['TT Pistol in 7.62x25mm (import)'],
  'Active', 'Tokarev TT',
  ARRAY['9mm Luger', '7.62x25mm Tokarev'],
  ARRAY['tt pistol', 'tokarev tt', 'tokarev 9mm'],
  'Modern', 'Single-Action',
  ARRAY['sport', 'carry', 'collector'],
  'The original Soviet TT-33, designed by Fyodor Tokarev in 1930, was one of the most widely produced military pistols of the 20th century — manufactured in the USSR, China, Yugoslavia, Poland, Hungary, and several other countries. The 7.62x25mm cartridge it fired is extremely high-velocity for a pistol round.',
  'Turkey', false, NULL
)

ON CONFLICT (make, model) DO NOTHING;
