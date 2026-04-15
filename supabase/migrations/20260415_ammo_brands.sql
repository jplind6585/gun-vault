-- ============================================================
-- ammo_brands: public reference table
-- Ammunition manufacturers and brands
-- RLS: public SELECT, service_role only for writes
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ammo_brands (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text UNIQUE NOT NULL,
  parent_company  text,
  country_of_origin text,
  active          boolean DEFAULT true,
  specialties     text[],   -- ['Defensive','Match','Training','Hunting','Military','Law Enforcement','Rimfire','Shotshell','Reloading Components']
  description     text,
  website         text,
  founded_year    integer,
  notable_products text[],
  created_at      timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ammo_brands_name    ON public.ammo_brands (name);
CREATE INDEX IF NOT EXISTS idx_ammo_brands_active  ON public.ammo_brands (active);
CREATE INDEX IF NOT EXISTS idx_ammo_brands_country ON public.ammo_brands (country_of_origin);

-- RLS
ALTER TABLE public.ammo_brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ammo_brands_public_read"   ON public.ammo_brands;
DROP POLICY IF EXISTS "ammo_brands_service_write" ON public.ammo_brands;

CREATE POLICY "ammo_brands_public_read"
  ON public.ammo_brands FOR SELECT
  USING (true);

CREATE POLICY "ammo_brands_service_write"
  ON public.ammo_brands FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- SEED DATA  (70+ brands)
-- ============================================================

INSERT INTO public.ammo_brands
  (name, parent_company, country_of_origin, active, specialties, description, website, founded_year, notable_products)
VALUES

-- ── MAJOR US MANUFACTURERS ────────────────────────────────────────────────────
('Federal Premium',
 'Vista Outdoor', 'USA', true,
 ARRAY['Defensive','Match','Hunting','Law Enforcement','Military','Rimfire','Shotshell'],
 'Founded in 1922 in Anoka, Minnesota. One of the largest ammunition manufacturers in the world. Produces the iconic HST defensive line, Gold Medal Match, and Power-Shok hunting loads.',
 'federalpremium.com', 1922,
 ARRAY['HST','Gold Medal Match','Hydra-Shok','Power-Shok','Punch','Terminal Ascent','Fusion']),

('Winchester Ammunition',
 'Olin Corporation', 'USA', true,
 ARRAY['Defensive','Match','Hunting','Military','Training','Shotshell','Rimfire'],
 'Traces heritage to 1866. The ammunition division (Olin Corp) is separate from the firearms brand (FN Herstal). Produces the iconic PDX1 Defender, Super-X, and USA White Box.',
 'winchester.com', 1866,
 ARRAY['PDX1 Defender','Super-X','USA White Box','Silvertip','Train & Defend','Supreme Elite']),

('Hornady',
 NULL, 'USA', true,
 ARRAY['Defensive','Match','Hunting','Law Enforcement'],
 'Founded in 1949 by Joyce Hornady in Grand Island, Nebraska. Known for pioneering polymer-tipped bullet technology (SST, V-MAX) and the Critical Defense/Duty defensive lines.',
 'hornady.com', 1949,
 ARRAY['Critical Defense','Critical Duty','ELD-X','ELD Match','A-MAX','V-MAX','SST','Custom Lite','Superformance','TAP']),

('Remington Ammunition',
 'Vista Outdoor', 'USA', true,
 ARRAY['Defensive','Hunting','Training','Military','Shotshell','Rimfire'],
 'One of the oldest ammunition manufacturers in America (founded 1816). Now part of Vista Outdoor after Remington Arms bankruptcy. Produces HTP Copper, UMC training, and Premier lines.',
 'remington.com', 1816,
 ARRAY['Golden Saber','HTP','UMC','Core-Lokt','Premier Match','Nitro Steel','STS Target']),

('CCI',
 'Vista Outdoor', 'USA', true,
 ARRAY['Rimfire','Training','Hunting','Match'],
 'Cascade Cartridge Inc., founded in 1951 in Lewiston, Idaho. The leading rimfire manufacturer in the US. Also produces pistol primers used by hand loaders worldwide.',
 'cci-ammunition.com', 1951,
 ARRAY['Mini-Mag','Stinger','Velocitor','AR Tactical','Green Tag','Blazer (subsidiary)']),

('Speer',
 'Vista Outdoor', 'USA', true,
 ARRAY['Defensive','Law Enforcement','Hunting','Training'],
 'Founded in 1943 by Vernon Speer. Gold Dot bonded hollow point is the most tested and adopted defensive round in law enforcement history.',
 'speer-ammo.com', 1943,
 ARRAY['Gold Dot','Gold Dot G2','Lawman','Blazer Brass','TNT','TP9']),

('American Eagle',
 'Federal Premium / Vista Outdoor', 'USA', true,
 ARRAY['Training','Match'],
 'Federal''s training/value brand. Brass-cased, reloadable. Same quality components as Federal Premium at training prices. Popular for bulk range use.',
 'federalpremium.com', 1983,
 ARRAY['AE9AP','AE223','AE308','Syntech']),

('Blazer',
 'CCI / Vista Outdoor', 'USA', true,
 ARRAY['Training'],
 'CCI''s budget-tier brand. Aluminum-cased Blazer (not reloadable) and Blazer Brass (reloadable). Excellent price-per-round for training.',
 'cci-ammunition.com', 1978,
 ARRAY['Blazer Brass 9mm','Blazer Aluminum 9mm','Blazer .40','Blazer .45']),

('Black Hills Ammunition',
 NULL, 'USA', true,
 ARRAY['Match','Law Enforcement','Military','Hunting','Training'],
 'South Dakota manufacturer known for precision match-grade ammunition. Supplier to US military for MK262 5.56mm. Highest quality US small-run manufacturer.',
 'black-hills-ammunition.com', 1988,
 ARRAY['77gr OTM','MK262','Gold Dot','HoneyBadger','Dual Performance']),

('DoubleTap Ammunition',
 NULL, 'USA', true,
 ARRAY['Defensive','Hunting'],
 'Utah manufacturer known for high-velocity defensive loads pushing calibers to maximum performance. Popular among hunters needing extra velocity.',
 'doubletapammo.com', 2002,
 ARRAY['DT Defense','DT Hunter','Lead Free','Controlled Expansion']),

('Cor-Bon',
 NULL, 'USA', true,
 ARRAY['Defensive','Hunting'],
 'Michigan manufacturer of premium defensive ammunition. Known for high-velocity loads and the DPX all-copper expanding projectile (Barnes TSX-based).',
 'corbon.com', 1982,
 ARRAY['DPX','Self Defense JHP','Hunter','Pow''RBall']),

('Buffalo Bore',
 NULL, 'USA', true,
 ARRAY['Defensive','Hunting'],
 'Idaho manufacturer of heavy, hard-cast and JHP loads for maximum terminal performance in handguns. Popular for bear country and hunting use.',
 'buffalobore.com', 1997,
 ARRAY['Hard Cast Lead','JHP','Outdoorsman','Heavy .357','Heavy .44']),

('Liberty Defense',
 NULL, 'USA', true,
 ARRAY['Defensive'],
 'Texas manufacturer of ultra-light, high-velocity fragmenting copper ammunition. Designed to dramatically reduce felt recoil while maintaining terminal effectiveness.',
 'libertyammo.com', 2012,
 ARRAY['Civil Defense','Animal Instinct','Silverado']),

('Lehigh Defense',
 NULL, 'USA', true,
 ARRAY['Defensive','Hunting'],
 'Pennsylvania manufacturer of precision machined copper projectiles and loaded ammunition. Maximum Expansion and Controlled Fracturing projectile designs.',
 'lehighdefense.com', 2003,
 ARRAY['Xtreme Defense','Maximum Expansion','Controlled Fracturing']),

('G2 Research',
 NULL, 'USA', true,
 ARRAY['Defensive'],
 'Georgia manufacturer known for the RIP (Radically Invasive Projectile) and the Civic Duty. Solid copper machined projectiles designed for maximum fragmentation.',
 'g2rammo.com', 2013,
 ARRAY['RIP','Civic Duty','HV (High Velocity)']),

('Underwood Ammo',
 NULL, 'USA', true,
 ARRAY['Defensive','Hunting'],
 'Illinois manufacturer of maximum-performance defensive and hunting ammunition. Pushes caliber performance to near maximum SAAMI pressure limits.',
 'underwoodammo.com', 2013,
 ARRAY['Extreme Defender','Xtreme Penetrator','JHP','Hard Cast']),

('Fort Scott Munitions',
 NULL, 'USA', true,
 ARRAY['Defensive','Military','Law Enforcement'],
 'Kansas manufacturer of the Tumble Upon Impact (TUI) solid copper bullet that tumbles in tissue for maximum wounding.',
 'fortscottmunitions.com', 2012,
 ARRAY['TUI 9mm','TUI 5.56','TUI .308']),

('Atomic Ammunition',
 NULL, 'USA', true,
 ARRAY['Match','Defensive','Subsonic'],
 'Kansas manufacturer specializing in subsonic and match-grade loads. Known for clean-burning, consistent ammunition.',
 'atomic-ammo.com', 2007,
 ARRAY['Subsonic 9mm','Match 6.5 Creedmoor','Fragmented JHP']),

('HSM',
 NULL, 'USA', true,
 ARRAY['Hunting','Match','Training'],
 'Montana manufacturer of hunting and competition ammunition. Trophy Gold line is a premium hunting load.',
 'hsmammo.com', 1968,
 ARRAY['Trophy Gold','Cowboy','Bear Load','Competition']),

('Fusion Ammunition',
 'Federal Premium / Vista Outdoor', 'USA', true,
 ARRAY['Hunting'],
 'Federal''s dedicated hunting brand. Fusion process bonds the jacket to the core for near 100% weight retention. Designed for deer hunting.',
 'federalpremium.com', 2005,
 ARRAY['Fusion Deer','Fusion MSR','Fusion Rifle']),

-- ── EUROPEAN MANUFACTURERS ────────────────────────────────────────────────────
('Fiocchi',
 NULL, 'Italy', true,
 ARRAY['Training','Hunting','Match','Shotshell'],
 'Founded in 1876 in Lecco, Italy. Major manufacturer of shotshells, pistol, and rifle ammunition. Has a US manufacturing facility in Ozark, Missouri.',
 'fiocchi.com', 1876,
 ARRAY['Extrema','Defense','Training Dynamics','Shooting Dynamics','Golden Pheasant']),

('Sellier & Bellot',
 'CBC Group', 'Czech Republic', true,
 ARRAY['Training','Hunting','Military','Law Enforcement'],
 'Founded in 1825 — one of the oldest ammunition manufacturers in the world. Czech manufacturer. Makes brass-cased training ammo and the XRG defense line.',
 'sellier-bellot.cz', 1825,
 ARRAY['XRG Defense','FMJ','SP','SPCE','Subsonic']),

('Lapua',
 'Nammo', 'Finland', true,
 ARRAY['Match','Military','Hunting'],
 'Finnish manufacturer renowned for producing the highest quality brass cases and loaded precision rifle ammunition. Lapua brass is the gold standard for hand loaders.',
 'lapua.com', 1923,
 ARRAY['Scenar','Scenar-L','Lock Base','Naturalis','Mega','Polar Biathlon','Brass Cases']),

('RWS',
 'Dynamit Nobel', 'Germany', true,
 ARRAY['Hunting','Match'],
 'German manufacturer with history dating to 1865. Known for premium hunting ammunition and Rottweil shotshell brand. HIT, DECO, and Biathlon loads.',
 'rws-munition.de', 1865,
 ARRAY['HIT','DECO','Target','Speed Tip Pro','Fox','Rottweil (shotshells)']),

('Norma',
 'RUAG Ammotec', 'Sweden', true,
 ARRAY['Hunting','Match'],
 'Swedish premium hunting ammunition and components manufacturer. Oryx bonded and Ecostrike lead-free projectiles are flagship products.',
 'norma-ammunition.com', 1902,
 ARRAY['Oryx','Ecostrike','Diamond Line','MHP','Monolithic','Golden Target','Brass Cases']),

('Nammo',
 NULL, 'Norway', true,
 ARRAY['Military','Match'],
 'Norwegian-Finnish defense company. Major NATO ammunition supplier. Owner of Lapua brand. Produces military-spec rifle, pistol, and cannon ammunition.',
 'nammo.com', 1998,
 ARRAY['5.56 SS109','7.62 NATO','NM149S','Lapua Scenar']),

('Eley',
 'Olympic Ammunition', 'UK', true,
 ARRAY['Match','Rimfire'],
 'Birmingham, UK manufacturer, the premier rimfire match ammunition brand. Eley Tenex is the dominant choice at Olympic small-bore competition for decades.',
 'eley.co.uk', 1828,
 ARRAY['Tenex','Edge','Match','Practice','Sport','Biathlon']),

('SK Ammunition',
 'Lapua / Nammo', 'Germany', true,
 ARRAY['Match','Rimfire','Training'],
 'German rimfire specialist. SK Standard Plus and Rifle Match are among the most consistent budget-to-mid-tier match .22 LR loads available.',
 'sk-ammunition.com', 1948,
 ARRAY['Standard Plus','Rifle Match','Pistol Match','Long Range Match','High Velocity']),

('PPU / Prvi Partizan',
 NULL, 'Serbia', true,
 ARRAY['Training','Hunting','Military','Match'],
 'Serbian government arsenal producing a very wide range of brass-cased ammunition including many obscure and military calibers not available from other sources.',
 'prvipartizan.com', 1928,
 ARRAY['SP','SPBT','FMJ BT','Match HP','Heavy Ball','Brass (components)']),

('Magtech',
 'CBC Group', 'Brazil', true,
 ARRAY['Training','Hunting','Defensive','Law Enforcement'],
 'Brazilian manufacturer and the CBC Group''s primary brand in the US. Consistent quality training ammunition. Guardian Gold is their defensive line.',
 'magtechammunition.com', 1990,
 ARRAY['Guardian Gold','Bonded','First Defense','Sport Shooting','CBC Brass']),

('Aguila',
 'Industrias Tecnos', 'Mexico', true,
 ARRAY['Training','Hunting','Rimfire','Shotshell','Defensive'],
 'Mexican manufacturer with production dating to 1961. Known for the SuperMaximum rimfire, Minishell shotgun shell, and value-priced centerfire training ammo.',
 'aguilaammo.com', 1961,
 ARRAY['Minishell','SuperMaximum','Interceptor','IQ Rifle','Colibri','Sniper SubSonic']),

-- ── RUSSIAN / EASTERN EUROPEAN ────────────────────────────────────────────────
('Wolf Ammunition',
 'Sporting Supplies International', 'Russia', true,
 ARRAY['Training'],
 'US importer of Russian-made steel-cased ammunition, primarily manufactured by Tula. Budget training ammo. Polymer-coated steel case. Not reloadable.',
 'wolfammo.com', 1991,
 ARRAY['Military Classic','Performance','Gold','WPA Polyformance']),

('Tula Cartridge Works',
 NULL, 'Russia', true,
 ARRAY['Training','Military'],
 'Russian state cartridge manufacturer, one of the largest in the world. Produces steel-cased, bi-metal jacketed ammo for military and civilian markets.',
 'tulacartwrks.com', 1880,
 ARRAY['TulAmmo 9mm','TulAmmo 7.62x39','TulAmmo 5.56','TulAmmo .223']),

('Brown Bear / Silver Bear',
 'Barnaul Cartridge Plant', 'Russia', true,
 ARRAY['Training'],
 'Barnaul-made steel-cased training ammunition imported under multiple brand names. Lacquer or polymer-coated steel case. Budget training option.',
 'barnaul-cartridge.ru', 1941,
 ARRAY['Brown Bear 9mm','Silver Bear .45 ACP','Brown Bear 7.62x39']),

('Barnaul',
 NULL, 'Russia', true,
 ARRAY['Training','Military'],
 'Siberian cartridge manufacturer. Makes steel-cased training ammo sold under Barnaul, Brown Bear, Silver Bear, and other brand names in the US.',
 'barnaul-cartridge.ru', 1941,
 ARRAY['Barnaul 9mm','Barnaul .308','Barnaul 7.62x54R']),

-- ── ISRAELI ───────────────────────────────────────────────────────────────────
('IMI Systems',
 'Elbit Systems', 'Israel', true,
 ARRAY['Military','Law Enforcement','Training','Defensive'],
 'Israeli Military Industries, now a subsidiary of Elbit Systems. Produces military-spec small arms ammunition and components. M856 tracer and M855A1-equivalent loads.',
 'imi-systems.com', 1933,
 ARRAY['Samson 9mm FMJ','Samson .308','Razor Core 5.56','M855 clone']),

-- ── RELOADING COMPONENT SPECIALISTS ──────────────────────────────────────────
('Nosler',
 NULL, 'USA', true,
 ARRAY['Hunting','Match','Reloading Components'],
 'Oregon manufacturer founded by John Nosler in 1948. Invented the Partition bullet. Produces premium loaded ammunition and component bullets.',
 'nosler.com', 1948,
 ARRAY['Partition','AccuBond','AccuBond LR','E-Tip','Ballistic Tip','Custom Competition','Trophy Grade']),

('Sierra Bullets',
 'Clarus Corporation', 'USA', true,
 ARRAY['Match','Hunting','Reloading Components'],
 'California bullet manufacturer founded in 1947. The MatchKing BTHP is the most used precision competition bullet. Used by military snipers.',
 'sierrabullets.com', 1947,
 ARRAY['MatchKing','TGK (Tipped GameKing)','GameKing','Pro-Hunter','BlitzKing','Infinity Software']),

('Berger Bullets',
 'Capstone Precision Group', 'USA', true,
 ARRAY['Match','Hunting','Reloading Components'],
 'Arizona company founded by Walt Berger. Known for VLD (Very Low Drag) bullets favored in long-range competition. Hybrid OTM projectiles.',
 'bergerbullets.com', 1955,
 ARRAY['VLD Hunting','VLD Target','Hybrid Target','Hybrid OTM','Juggernaut']),

('Barnes Bullets',
 'Vista Outdoor', 'USA', true,
 ARRAY['Hunting','Military','Law Enforcement','Reloading Components'],
 'Utah manufacturer, inventor of the all-copper expanding bullet. TSX (Triple Shock X) and TTSX are the benchmark for premium lead-free hunting bullets.',
 'barnesbullets.com', 1932,
 ARRAY['TSX','TTSX','LRX','TAC-X','RangeAR','VOR-TX (loaded ammo)']),

('Hornady Manufacturing (components)',
 NULL, 'USA', true,
 ARRAY['Reloading Components','Match','Hunting'],
 'Hornady produces individual bullets and brass for hand loaders. The ELD-M (Extremely Low Drag-Match) is dominant in PRS and long-range competition.',
 'hornady.com', 1949,
 ARRAY['ELD-M','ELD-X','A-MAX','V-MAX','XTP','FTX','HAP (Hornady Action Pistol)','Brass Cases']),

('Lapua (components)',
 'Nammo', 'Finland', true,
 ARRAY['Match','Reloading Components'],
 'Lapua brass cases are considered the gold standard for precision reloading. Scenar bullets are used in Olympic competition and by military snipers.',
 'lapua.com', 1923,
 ARRAY['Scenar L','Lock Base B408','Scenar GBWC','Brass .308','Brass 6.5 Creedmoor','Brass .338 Lapua']),

-- ── SPECIALTY / BOUTIQUE ──────────────────────────────────────────────────────
('SinterFire',
 NULL, 'USA', true,
 ARRAY['Training','Law Enforcement'],
 'Pennsylvania manufacturer of lead-free frangible ammunition for indoor ranges and reduced-ricochet training environments.',
 'sinterfire.com', 1998,
 ARRAY['Greenline','Special Duty','Green Elite','BrassMax']),

('Inceptor Ammunition',
 NULL, 'USA', true,
 ARRAY['Defensive','Training'],
 'Georgia manufacturer of injection-molded copper-polymer projectile ammunition. The ARX defensive round creates hydraulic disruption rather than expansion.',
 'inceptorammo.com', 2016,
 ARRAY['ARX','Sport Utility','Match Grade']),

('True Velocity',
 NULL, 'USA', true,
 ARRAY['Military','Match','Law Enforcement'],
 'Texas manufacturer using composite polymer cases instead of brass. Significant weight savings. Competing for US Army NGSW contract.',
 'truevelocity.com', 2015,
 ARRAY['6.8x51 NGSW','TV-CF Composite Case','PolyCase']),

('Polycase Ammunition',
 NULL, 'USA', true,
 ARRAY['Training','Defensive'],
 'South Carolina manufacturer of injection-molded copper-polymer bullets. ARX design provides wound ballistics without traditional expansion.',
 'polycaseammo.com', 2013,
 ARRAY['ARX Inceptor','Sport Utility','RNP']),

('BVAC',
 NULL, 'USA', true,
 ARRAY['Training'],
 'Big Valley Ammunition and Components — Idaho manufacturer of remanufactured brass-cased training ammunition. Clean, consistent, affordable.',
 'bvac.com', 1987,
 ARRAY['Remanufactured 9mm','Remanufactured .45 ACP','Remanufactured .223']),

('CBC Group',
 NULL, 'Brazil', true,
 ARRAY['Training','Hunting','Military','Shotshell'],
 'Brazil-based holding company owning Magtech, Sellier & Bellot, and other brands. One of the world''s largest ammunition manufacturing groups.',
 'cbcbrasil.com.br', 1926,
 ARRAY['Magtech','Sellier & Bellot','CBC Military']),

('Sig Sauer Ammunition',
 'Sig Sauer', 'USA', true,
 ARRAY['Defensive','Match','Military'],
 'Relatively new ammunition brand from Sig Sauer. Produces the V-Crown defensive line and Elite Performance rifle ammunition.',
 'sigsauer.com', 2014,
 ARRAY['V-Crown JHP','FMJ','Elite Performance','Elite Hunter TipStrIke']),

('Wilson Combat Ammunition',
 'Wilson Combat', 'USA', true,
 ARRAY['Defensive','Match'],
 'Premium ammunition brand from Wilson Combat. Produced in small batches with tight quality control. The +P loads are popular for defensive carry.',
 'wilsoncombat.com', 2010,
 ARRAY['Wilson +P 9mm','Wilson .45 +P','Wilson Match']),

('Glaser Safety Slug',
 'PolyMag / CCI', 'USA', true,
 ARRAY['Defensive'],
 'Prefragmented bullet filled with lead shot and polymer tip. Designed to fragment upon impact for maximum energy transfer and reduced over-penetration.',
 'glasersafetyslug.com', 1974,
 ARRAY['Silver Tip','Blue Tip','Pow''R Ball']),

('Liberty Defense Group',
 NULL, 'USA', true,
 ARRAY['Defensive'],
 'Liberty Ammunition''s law enforcement and military division. Ultra-light high-velocity fragmenting copper projectiles. Reduced recoil with maximum fragmentation.',
 'libertyammo.com', 2012,
 ARRAY['Civil Defense','Animal Instinct']),

('Olin Winchester (military)',
 'Olin Corporation', 'USA', true,
 ARRAY['Military','Law Enforcement'],
 'Olin Corporation''s Winchester ammunition for military contracts. Produces M855, M80, M118LR, and other US military-specification cartridges.',
 'olin.com', 1892,
 ARRAY['M855','M80','M118LR','Mk 318 Mod 0 (SOST)','M1030 HPBT']),

('Velocity Inc / IMI Samson',
 'IMI Systems', 'Israel', true,
 ARRAY['Training','Law Enforcement'],
 'US distributor of IMI/Samson brass-cased training ammunition. Quality Israeli mil-spec brass ammo at competitive prices.',
 'imi-systems.com', 2005,
 ARRAY['Samson 9mm','Samson 5.56','Samson .308']),

('Patriot Valley Arms',
 NULL, 'USA', true,
 ARRAY['Match','Training'],
 'Small-batch precision ammunition maker. Known for consistent match-grade loads.',
 'patriotvalleyarms.com', 2015,
 ARRAY['6.5 Creedmoor Match','6mm Creedmoor Match']),

('Ammo Inc',
 NULL, 'USA', true,
 ARRAY['Training','Defensive','Hunting'],
 'Arizona-based manufacturer of a broad range of brass-cased ammunition under the STREAK (tracer-like) and OPS (defensive) brands.',
 'ammoinc.com', 2016,
 ARRAY['STREAK Visual','OPS','Signature','Tip Strike']),

('Armscor',
 'Armscor USA', 'Philippines', true,
 ARRAY['Training','Hunting'],
 'Philippines-based manufacturer and importer. Produces quality brass-cased ammunition at value price points for the US market.',
 'armscor.com', 1905,
 ARRAY['Armscor 9mm FMJ','Armscor .45 ACP','Armscor .22 LR','Armscor .223']),

('Sellier & Bellot (shotshell)',
 'CBC Group', 'Czech Republic', true,
 ARRAY['Shotshell','Training'],
 'Separate product line from the same manufacturer — Czech target and game shotshells.',
 'sellier-bellot.cz', 1825,
 ARRAY['Slug','Buck','Birdshot','Trap','Skeet'])

ON CONFLICT (name) DO NOTHING;
