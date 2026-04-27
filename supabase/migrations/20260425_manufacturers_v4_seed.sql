-- ============================================================
-- manufacturers v4 — New entries
-- 15 new manufacturers: OEM makers, precision builders,
-- WWII contractors, international gaps
-- ============================================================

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

-- ============================================================
-- OEM / Supply Chain
-- ============================================================

(
  'Bergara',
  ARRAY['Bergara Barrels', 'Bergara Rifles', 'Bergara USA'],
  'Spain', 1969, true,
  ARRAY['Rifle'],
  'Igartua Group', NULL,
  'Spanish barrel manufacturer and complete rifle producer based in the Basque Country town of Bergara — a region with a centuries-long tradition of arms manufacturing. Bergara makes precision barrels for custom rifle builders worldwide; their barrels are on more PRS-winning custom builds than any other non-US manufacturer. The B-14 series bolt-action rifles are consistently recommended as the best-value precision bolt gun on the market, regularly outperforming rifles costing twice as much. The B-14 HMR (Hunting and Match Rifle) with its chassis-stock system is a benchmark product. Owned by the Igartua family group, which also owns Gárate Anitua.',
  ARRAY['B-14 HMR', 'B-14 Timber', 'B-14 Wilderness', 'B-14 Squared', 'B-14R'],
  'https://www.bergara.online', 'Bergara, Spain',
  'Spain', 'Active Import', 'Mid', 'premium', 'Independent', false,
  'Manufacturer',
  ARRAY['precision rifle barrels', 'B-14 bolt-action rifles', 'PRS rifles', 'custom barrel manufacturing'],
  NULL,
  939, false, NULL,
  'Bergara makes precision barrels for custom rifle builders worldwide — their barrels are on more PRS-winning custom rifles than any other manufacturer outside the US — and then sells complete B-14 rifles using the same manufacturing capability at a price that undercuts most competitors.',
  ARRAY['Spain'], 'Low', 'B-14 HMR'
),

(
  'Howa Machinery',
  ARRAY['Howa', 'Legacy Sports International', 'Howa 1500'],
  'Japan', 1967, true,
  ARRAY['Rifle'],
  NULL, NULL,
  'Japanese manufacturer of the Howa 1500 bolt-action barreled action, which is the OEM foundation for several well-known American rifle brands. The Weatherby Vanguard and Mossberg Patriot both use the Howa 1500 action — one of the most widely deployed bolt-action platforms in mid-tier US hunting rifles, largely invisible to consumers because it is almost always sold under another brand name. Legacy Sports International is the US importer and also sells Howa-branded rifles directly. The two-stage HACT trigger and cold-hammer-forged barrel are standard across the line. The Mini Action variant chambers short cartridges in a more compact package. Howa''s manufacturing precision rivals Japanese makers like Miroku and delivers consistent accuracy that embarrasses its price point.',
  ARRAY['Howa 1500', 'Mini Action', 'Howa Oryx', 'Howa APC', 'Weatherby Vanguard (OEM)'],
  'https://legacysports.com', 'Nagoya, Japan',
  'Japan', 'Active Import', 'High', 'mass', 'Independent', false,
  'OEM',
  ARRAY['Howa 1500 action', 'Weatherby Vanguard OEM', 'Mossberg Patriot OEM', 'affordable precision'],
  NULL,
  649, false, NULL,
  'The Howa 1500 action powers the Weatherby Vanguard — one of the most popular budget precision rifle platforms in America. Howa makes the action; Weatherby adds their name and warranty, and charges significantly more for the same mechanical foundation.',
  ARRAY['Japan'], 'Low', 'Howa 1500'
),

(
  'Miroku Corporation',
  ARRAY['Miroku', 'B.C. Miroku', 'Miroku Firearms Mfg.'],
  'Japan', 1893, true,
  ARRAY['Rifle', 'Shotgun'],
  NULL, NULL,
  'Japanese firearms manufacturer based in Nangoku City, Kochi Prefecture, that produces the entire commercial Browning firearm catalog and Winchester sporting arms for the American market. The relationship began in the 1960s when Browning outsourced Japanese manufacturing; today essentially every Browning and Winchester sporting long gun sold commercially — including the Winchester Model 70, Model 94, SXP, Model 101, and the complete Browning line of rifles and shotguns — is manufactured by Miroku. The craftsmanship quality is considered equal to or better than pre-outsourcing US production for most models. Miroku has produced over-unders for the Belgian, American, and Japanese markets for six decades. The Citori over/under, considered among the best-value O/Us in the world, is a Miroku product sold under the Browning name.',
  ARRAY['Browning Citori (for Browning)', 'Winchester Model 70 (for Winchester)', 'Winchester Model 94 (for Winchester)', 'Browning X-Bolt (for Browning)', 'Browning A5 (for Browning)'],
  'https://www.miroku.co.jp', 'Nangoku City, Kochi Prefecture, Japan',
  'Japan', 'Active Import', 'High', 'premium', 'Independent', false,
  'OEM',
  ARRAY['Browning commercial production', 'Winchester sporting arms production', 'Japanese craftsmanship', 'OEM long guns'],
  NULL,
  NULL, false, NULL,
  'Miroku in Kochi, Japan manufactures the entire commercial Browning catalog and Winchester sporting arms — including the Winchester Model 70, Model 94, and all Browning shotguns and rifles. When an American buys a Browning or Winchester sporting long gun, it was almost certainly made in Japan.',
  ARRAY['Japan'], 'Low', NULL
),

-- ============================================================
-- Current Market Gaps
-- ============================================================

(
  'Grand Power',
  ARRAY['Grand Power s.r.o.', 'GP'],
  'Slovakia', 2000, true,
  ARRAY['Pistol', 'Rifle'],
  NULL, NULL,
  'Slovak firearms manufacturer known for mechanically innovative designs. The K100 MK12 pistol uses a rotating barrel lockup — the barrel rotates approximately 15 degrees to lock and unlock rather than tilting, reducing felt recoil and improving bore axis geometry. Imported to the US primarily through Springfield Armory (for the Stribog PCC) and other distributors. The Stribog SP9A1 pistol-caliber carbine has gained significant traction in the US civilian market for its quality, reliability, and distinctive operating system. Grand Power''s engineering philosophy emphasizes mechanical differentiation rather than refinements on conventional patterns.',
  ARRAY['K100 MK12', 'Stribog SP9A1', 'Stribog SP9A3', 'Q100'],
  'https://www.grandpower.eu', 'Banská Bystrica, Slovakia',
  'Slovakia', 'Active Import', 'Boutique', 'mass', 'Independent', false,
  'Manufacturer',
  ARRAY['rotating barrel pistols', 'Stribog PCC', 'K100 series', 'innovative operating systems'],
  NULL,
  699, false, NULL,
  'Grand Power''s K100 uses a rotating barrel lockup mechanically distinct from almost every other production pistol — the barrel rotates 15 degrees to lock rather than tilting. The Stribog SP9A1 PCC became one of the few European pistol-caliber carbines with genuine US market traction.',
  ARRAY['Slovakia'], 'Low', 'Stribog SP9A1'
),

-- ============================================================
-- Russian / Eastern European Gaps
-- ============================================================

(
  'Molot (Vyatskie Polyany Machine Building Plant)',
  ARRAY['Molot', 'Molot Oruzhie', 'VPMZ Molot', 'Vepr'],
  'Russia', 1940, true,
  ARRAY['Rifle', 'Shotgun'],
  NULL, NULL,
  'Russian state-linked arms manufacturer based in Vyatskie Polyany, Kirov Oblast. Produced the Vepr series of AK-pattern sporting rifles and the Vepr-12 semi-automatic shotgun. Before US import sanctions (2014 and 2022), Vepr rifles were widely considered the highest-quality Russian AK available to American buyers — built on heavier RPK-pattern milled receivers with tighter tolerances than standard Kalashnikov Concern production. The Vepr-12 semi-automatic shotgun became a staple of American 3-Gun competition before sanctions effectively ended import. US sanctions imposed in 2014 and expanded in 2022 prohibit importation of Molot firearms.',
  ARRAY['Vepr FM AK', 'Vepr-12 shotgun', 'Vepr .308', 'RPK-pattern sporting rifles'],
  NULL, 'Vyatskie Polyany, Kirov Oblast, Russia',
  'Russia', 'Sanctioned', 'Mid', 'mass', 'State-owned', false,
  'Manufacturer',
  ARRAY['Vepr AK-pattern rifles', 'Vepr-12 shotgun', 'RPK receivers', 'milled AK production'],
  NULL,
  NULL, false, NULL,
  'Before 2014 US sanctions, Vepr rifles were considered the highest-quality Russian AK available to American buyers. The Vepr-12 became a 3-Gun competition staple before import prohibition. A Molot-made Vepr-12 in excellent condition now commands 3-4x its original US import price.',
  ARRAY['Russia'], 'Medium', 'Vepr-12'
),

(
  'SC Fabrica de Arme Cugir (ROMARM)',
  ARRAY['ROMARM', 'Cugir', 'Fabrica de Arme Cugir', 'Romanian Arms Factory'],
  'Romania', 1799, true,
  ARRAY['Rifle', 'Pistol', 'Machine Gun'],
  'ROMARM (Romanian state)', NULL,
  'Romanian state arms manufacturer whose Cugir facility has been producing arms since 1799 — predating the United States Constitution by a decade. In the modern era, the Cugir factory produces the WASR-10 AK-pattern rifles that Century Arms imports to the US, historically among the most common and affordable AK-pattern rifles in the American market. Also produces the PA md. 86 (Romanian AKM variant), PA md. 90 (folding stock), and various military small arms for the Romanian armed forces. The ROMARM holding company oversees several Romanian defense manufacturers. Century Arms is Cugir''s primary US distribution channel.',
  ARRAY['WASR-10', 'PA md. 86', 'PA md. 90', 'PM md. 63/65 (Pistol Mitraliera)'],
  NULL, 'Cugir, Alba County, Romania',
  'Romania', 'Active Import', 'High', 'mass', 'State-owned', false,
  'Military Arsenal',
  ARRAY['WASR-10 AK rifles', 'Romanian military arms', 'AK-pattern production', 'Century Arms supply'],
  NULL,
  NULL, true, 'Romanian Armed Forces standard small arms supplier; WASR-10 primary US commercial export via Century Arms',
  'The Cugir arms factory has operated continuously since 1799 — longer than the United States has existed. The WASR-10, imported by Century Arms, was for decades the most widely available budget AK-pattern rifle in America.',
  ARRAY['Romania'], 'Low', 'WASR-10'
),

-- ============================================================
-- WWII Contractors / Historic Dead Brands
-- ============================================================

(
  'DWM (Deutsche Waffen- und Munitionsfabriken)',
  ARRAY['DWM', 'Deutsche Waffen', 'Ludwig Loewe', 'Berlin-Karlsruher Industrie-Werke'],
  'Germany', 1896, false,
  ARRAY['Pistol', 'Rifle', 'Ammunition'],
  NULL, NULL,
  'German arms and ammunition conglomerate that produced the Luger P08 — one of the most recognizable and collected military pistols in history. DWM was formed in 1896 from the merger of Ludwig Loewe & Company''s arms division with Deutsche Metallpatronenfabrik. Hugo Borchardt designed the Borchardt C-93 (1893) at Loewe before the merger — it was the direct mechanical predecessor to the Luger. Georg Luger refined the C-93 into the P08 at DWM, which became the standard German military sidearm from 1908 through WWII (produced by DWM and later Mauser and Spandau Arsenal). DWM also produced military rifle ammunition on a massive scale. The company was renamed BKIW (Berlin-Karlsruher Industrie-Werke) in 1922 and eventually absorbed into other entities. DWM-marked Lugers (particularly the pre-WWI "DWM" toggle-marked examples) are among the most sought German military collectibles.',
  ARRAY['Luger P08', 'Borchardt C-93', 'Luger Artillery (LP08)', 'Luger Navy (1904)'],
  NULL, 'Berlin and Karlsruhe, Germany',
  'Germany', 'Historical', 'High', 'military', 'Independent', false,
  'Defunct Maker',
  ARRAY['Luger P08', 'military pistols', 'WWI/WWII ammunition', 'Borchardt C-93'],
  ARRAY['Georg Luger', 'Hugo Borchardt'],
  NULL, true, 'German Imperial and Wehrmacht standard pistol supplier (1908-1945); Luger P08 primary German sidearm of both World Wars',
  'DWM produced the Luger P08 — one of the most recognizable military pistols ever made. The P08''s toggle-lock operating system, borrowed from the Borchardt C-93, was so mechanically complex that it was eventually replaced by the simpler Walther P38, but the Luger remains the most collected German military pistol in history.',
  ARRAY['Germany'], 'Legendary', 'Luger P08'
),

(
  'Rock-Ola Manufacturing Corporation',
  ARRAY['Rock-Ola', 'Rock Ola'],
  'USA', 1927, false,
  ARRAY['Rifle'],
  NULL, NULL,
  'Chicago jukebox manufacturer that became a WWII M1 Carbine contractor as part of the US industrial mobilization. Rock-Ola was established by David Cullen Rockola (the name is his actual surname) and was the dominant American jukebox manufacturer before the war. The government''s WWII small arms procurement strategy deliberately sought non-traditional manufacturers — companies with precision machining capabilities but no firearms expertise — to expand production capacity beyond established gunmakers. Rock-Ola produced approximately 228,500 M1 Carbines between 1942 and 1944. "Rock-Ola" receiver markings are among the most sought by M1 Carbine collectors, precisely because the story of a jukebox company making rifles is one of American industrial history''s best-known wartime anecdotes.',
  ARRAY['M1 Carbine (WWII contract)'],
  NULL, 'Chicago, Illinois, USA',
  'USA', 'Historical', 'Boutique', 'military', 'Independent', false,
  'Defunct Maker',
  ARRAY['M1 Carbine (WWII)', 'wartime industrial conversion', 'jukebox manufacturer turned arms maker'],
  NULL,
  NULL, true, 'US government M1 Carbine production contract 1942-1944 (approx. 228,500 carbines)',
  'Rock-Ola was a jukebox company before WWII mobilization turned them into an M1 Carbine contractor. "Rock-Ola" stamped M1 Carbines are among the most avidly collected WWII firearms — the juxtaposition of the jukebox brand on a battle rifle is one of American wartime industry''s best stories.',
  ARRAY['USA'], 'High', 'M1 Carbine (Rock-Ola contract)'
),

(
  'Singer Manufacturing Company',
  ARRAY['Singer', 'Singer Arms'],
  'USA', 1851, false,
  ARRAY['Pistol'],
  NULL, NULL,
  'The Singer Sewing Machine Company — founded in 1851 by Isaac Merritt Singer — produced fewer than 500 M1911A1 pistols in 1941-1942 as a WWII US government test of whether sewing machine precision manufacturing could be adapted to firearms production. Singer received an Educational Order contract to determine if non-firearms manufacturers could be rapidly converted to arms production; the program was deemed successful but Singer was redirected to precision military instruments and fire control equipment, where their manufacturing expertise proved more valuable. Approximately 500 M1911A1 pistols bearing the "Singer Mfg. Co." receiver marking were produced — making them the rarest and most valuable American military handguns from WWII. Singer-marked 1911s regularly achieve $50,000–$150,000 at auction.',
  ARRAY['M1911A1 (Educational Order contract, ~500 produced)'],
  NULL, 'New York, New York, USA',
  'USA', 'Historical', 'Boutique', 'military', 'Independent', false,
  'Defunct Maker',
  ARRAY['Singer M1911A1 (rarest WWII pistol)', 'Educational Order contractor', 'sewing machine company'],
  NULL,
  NULL, true, 'US government M1911A1 Educational Order contract 1941-1942 (~500 pistols — rarest WWII 1911 contractor)',
  'Singer produced fewer than 500 M1911A1 pistols as a WWII government test of non-firearms manufacturing capability. Singer-marked 1911s regularly sell for $50,000–$150,000 at auction — an extraordinary premium driven entirely by scarcity and the story: a sewing machine company''s name on a military sidearm.',
  ARRAY['USA'], 'Legendary', 'M1911A1 (Singer contract)'
),

(
  'Union Switch & Signal',
  ARRAY['US&S', 'Union Switch and Signal'],
  'USA', 1881, false,
  ARRAY['Pistol'],
  'Westinghouse Electric (parent during WWII era)', NULL,
  'Union Switch & Signal, a Swissvale, Pennsylvania manufacturer of railroad signaling equipment and electrical components, produced M1911A1 pistols during WWII as part of the US government''s industrial mobilization program. US&S produced approximately 55,000 M1911A1 pistols between 1943 and 1944. Like Rock-Ola and Singer, US&S was selected because their precision machining capabilities (used for electrical switching equipment and railroad signal components) could be adapted to firearms manufacturing. US&S-marked 1911s are collected primarily for their unusual manufacturer provenance — a company whose normal products were train signals. The pistols themselves are mechanically standard M1911A1 production; the appeal is entirely the "US&S" rollmark.',
  ARRAY['M1911A1 (WWII contract, approx. 55,000 produced)'],
  NULL, 'Swissvale, Pennsylvania, USA',
  'USA', 'Historical', 'Boutique', 'military', 'Independent', false,
  'Defunct Maker',
  ARRAY['M1911A1 (WWII)', 'railroad signaling equipment', 'wartime industrial conversion'],
  NULL,
  NULL, true, 'US government M1911A1 contract 1943-1944 (approx. 55,000 pistols)',
  'Union Switch & Signal normally made railroad signaling equipment. During WWII, their precision machining shops were converted to produce M1911A1 pistols. US&S-marked 1911s are collected for the same reason as Rock-Ola carbines: the curiosity of a signaling company''s name on a military sidearm.',
  ARRAY['USA'], 'High', 'M1911A1 (US&S contract)'
),

-- ============================================================
-- Precision / Competition Builders
-- ============================================================

(
  'Cadex Defence',
  ARRAY['Cadex', 'Cadex Defense'],
  'Canada', 2006, true,
  ARRAY['Rifle', 'Accessories'],
  NULL, NULL,
  'Canadian precision rifle manufacturer and chassis system maker based in Saint-Jean-sur-Richelieu, Quebec. Cadex supplies precision rifle chassis systems to military and law enforcement sniper programs internationally and produces the CDX series of complete bolt-action rifles on actions machined in-house to tolerances typically found only in custom shop production. The CDX-30 Tremor and CDX-50 Tremor (.50 BMG) represent the pinnacle of their production line. Cadex chassis systems are used by Canadian and allied military sniper programs. The company''s dual focus — military supply and civilian precision shooting — gives them direct operational feedback that informs product development.',
  ARRAY['CDX-30 Tremor', 'CDX-50 Tremor', 'CDX-33 (.338 LM)', 'Strike chassis'],
  'https://cadexdefence.com', 'Saint-Jean-sur-Richelieu, Quebec, Canada',
  'Canada', 'Active Import', 'Boutique', 'ultra-premium', 'Independent', false,
  'Manufacturer',
  ARRAY['precision rifle chassis', 'CDX bolt-action rifles', 'PRS competition', 'military sniper systems'],
  NULL,
  4999, true, 'Canadian Armed Forces and allied nation law enforcement sniper program supply contracts',
  'Cadex Defence supplies chassis systems to multiple military and law enforcement sniper programs. Their CDX series bolt-action rifles are built on actions machined in-house to tolerances that rival custom shop production — then sold as complete rifles at production efficiency.',
  ARRAY['Canada'], 'Low', 'CDX-30 Tremor'
),

(
  'MasterPiece Arms',
  ARRAY['MPA', 'MasterPiece Arms MPA'],
  'USA', 2009, true,
  ARRAY['Rifle'],
  NULL, NULL,
  'Georgia-based precision rifle manufacturer known for the BA (Bolt-Action) series chassis rifles, which have become the dominant platform in Precision Rifle Series (PRS) competition. MPA rifles are built around a folding chassis design with AR-compatible pistol grip and adjustable comb, married to match-grade barrels and competition-tuned triggers. The BA Lite designation indicates a weight-optimized variant. MPA rifles have won the PRS National Championship multiple times and appear consistently in the top 20 PRS standings. The company also produces the MPA BA PCR (Precision Chassis Rifle) for hunters and competitive shooters at a lower price point than the BA competition series.',
  ARRAY['BA Lite', 'BA Competition', 'BA PCR', 'BA Hybrid', 'MPA 30T'],
  'https://masterpiececarms.com', 'Comer, Georgia, USA',
  'USA', 'Domestic', 'Boutique', 'premium', 'Independent', false,
  'Manufacturer',
  ARRAY['BA chassis rifles', 'PRS competition dominance', 'precision bolt guns', 'folding chassis system'],
  NULL,
  2999, false, NULL,
  'MPA rifles appear in the PRS National Championship top 20 standings more consistently than any other single chassis rifle system. The BA series has been the platform of choice for PRS National Champions multiple years running — a remarkable record for a company less than 20 years old.',
  ARRAY['USA'], 'Low', 'BA Lite'
),

(
  'Zermatt Arms',
  ARRAY['Zermatt', 'Bighorn Origin', 'TL3 action'],
  'USA', 2014, true,
  ARRAY['Rifle', 'Components'],
  NULL, NULL,
  'Utah-based manufacturer of precision rifle actions, most notably the TL3 and Origin bolt-action platforms. Zermatt Arms actions are the foundation of more high-end custom precision rifle builds than any other American action maker, used by custom builders in PRS, ELR (extreme long range), and F-Class competition. The TL3 Short Action is considered one of the most reliable and consistent production precision actions in any price range. Zermatt actions are distinct from Bighorn Armory, which makes the Model 89 lever-action in .500 S&W Magnum — entirely unrelated company despite the naming confusion that exists in the market.',
  ARRAY['TL3 Short Action', 'TL3 Long Action', 'Origin Short Action', 'Origin Long Action'],
  'https://zermattarms.com', 'Lindon, Utah, USA',
  'USA', 'Domestic', 'Boutique', 'ultra-premium', 'Independent', false,
  'Manufacturer',
  ARRAY['TL3 precision actions', 'Origin actions', 'custom rifle actions', 'ELR / PRS builds'],
  NULL,
  NULL, false, NULL,
  'Zermatt Arms TL3 and Origin actions are the foundation of more winning PRS and ELR custom builds than any other American action maker. Professional precision rifle builders specify Zermatt actions the way custom pistol builders specify Nighthawk frames — because the tolerance consistency makes everything downstream easier.',
  ARRAY['USA'], 'Low', 'TL3 SA'
),

(
  'Victrix Armaments',
  ARRAY['Victrix', 'Victrix Arms'],
  'Italy', 2014, true,
  ARRAY['Rifle'],
  'Beretta Holding', NULL,
  'Italian precision rifle manufacturer acquired by Beretta Holding in 2014. Victrix produces some of the most technically sophisticated precision bolt-action and semi-automatic competition rifles in the world, used in ISSF Olympic-level precision rifle competition and by select military and law enforcement units. The Scorpio Thor bolt-action and Gladio semi-automatic series are their flagship products. Victrix rifles are machined from billet aluminum and steel to aerospace tolerances, with adjustable chassis systems designed for the ergonomic demands of Olympic and international precision shooting. Given that Accuracy International, Sako TRG, and Anschutz are all present in precision rifle coverage, Victrix completes the picture of what state-of-the-art precision manufacturing delivers in a European competition context.',
  ARRAY['Scorpio Thor', 'Scorpio TGT', 'Gladio semi-auto', 'Pugio compact'],
  'https://victrixarmaments.com', 'Brescia, Italy',
  'Italy', 'Active Import', 'Boutique', 'ultra-premium', 'Subsidiary', false,
  'Manufacturer',
  ARRAY['Olympic precision rifles', 'Scorpio series', 'ISSF competition rifles', 'billet machined chassis'],
  NULL,
  8500, true, 'ISSF international precision rifle competition; selected Italian police and military sniper programs',
  'Victrix rifles are used in Olympic-level ISSF precision rifle competition. Their Scorpio Thor is machined from billet aluminum and steel to aerospace tolerances — precision engineering that places Victrix alongside Accuracy International and Sako TRG at the absolute top tier of purpose-built competition and sniper platforms.',
  ARRAY['Italy'], 'Low', 'Scorpio Thor'
),

(
  'Bul Armory',
  ARRAY['Bul Transmark', 'BUL Armory', 'Bul Cherokee'],
  'Israel', 1990, true,
  ARRAY['Pistol'],
  NULL, NULL,
  'Israeli manufacturer of 2011-pattern double-stack pistols and polymer-frame handguns. Bul Armory produces the SAS series (2011-pattern), the Axe series, and the Cherokee polymer pistol. The M5 was adopted by the Israeli Border Police. Bul''s 2011-pattern pistols compete directly with Staccato in the US double-stack 1911 market at a lower price point, offering comparable capacity and reliability with Israeli manufacturing heritage. The SAS II is their flagship 2011 competition pistol. Imported to the US through Bul USA and various distributors. The combination of military heritage (Israeli Defense establishment standards) and competitive pricing has built Bul a growing US following particularly in the USPSA and 2011 pistol community.',
  ARRAY['SAS II', 'Axe', 'Cherokee', 'M5', 'SAS II Ultra'],
  'https://bularmory.com', 'Tel Aviv, Israel',
  'Israel', 'Active Import', 'Mid', 'premium', 'Independent', false,
  'Manufacturer',
  ARRAY['2011 double-stack pistols', 'SAS series', 'Israeli military pistols', 'competition carry'],
  NULL,
  1499, true, 'Israeli Border Police (M5 adoption)',
  'Bul Armory''s M5 pistol was adopted by the Israeli Border Police. Their SAS II 2011-pattern pistols compete with Staccato at a lower price point — offering the double-stack 1911 capacity and competition-grade trigger in a package that extends the market beyond the premium tier Staccato occupies.',
  ARRAY['Israel'], 'Low', 'SAS II'
)
ON CONFLICT (name) DO NOTHING;
