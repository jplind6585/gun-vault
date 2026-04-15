-- ============================================================
-- powder_brands: public reference table
-- Reloading powders — brand, product, burn rate, and characteristics
-- RLS: public SELECT, service_role only for writes
-- ============================================================

CREATE TABLE IF NOT EXISTS public.powder_brands (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand                   text NOT NULL,
  product_name            text NOT NULL,
  burn_rate_rank          integer,   -- 1 = fastest (fastest burning), higher = slower
  powder_type             text,      -- 'Ball', 'Extruded/Stick', 'Flake'
  best_use                text[],    -- ['Rifle','Pistol','Shotgun','Magnum Rifle']
  recommended_calibers    text[],
  temperature_sensitivity text,      -- 'Low','Moderate','High'
  discontinued            boolean DEFAULT false,
  country_of_origin       text,
  description             text,
  created_at              timestamptz DEFAULT now(),
  UNIQUE (brand, product_name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_powder_brands_brand           ON public.powder_brands (brand);
CREATE INDEX IF NOT EXISTS idx_powder_brands_burn_rate_rank  ON public.powder_brands (burn_rate_rank);
CREATE INDEX IF NOT EXISTS idx_powder_brands_powder_type     ON public.powder_brands (powder_type);

-- RLS
ALTER TABLE public.powder_brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "powder_brands_public_read"   ON public.powder_brands;
DROP POLICY IF EXISTS "powder_brands_service_write" ON public.powder_brands;

CREATE POLICY "powder_brands_public_read"
  ON public.powder_brands FOR SELECT
  USING (true);

CREATE POLICY "powder_brands_service_write"
  ON public.powder_brands FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- SEED DATA  (90+ powders)
-- Burn rate ranks are approximate relative positions;
-- exact values vary by source. Lower = faster burning.
-- ============================================================

INSERT INTO public.powder_brands
  (brand, product_name, burn_rate_rank, powder_type, best_use, recommended_calibers, temperature_sensitivity, discontinued, country_of_origin, description)
VALUES

-- ── ALLIANT (fastest to slowest) ──────────────────────────────────────────────
('Alliant','Red Dot',
 5,'Flake',ARRAY['Shotgun','Pistol'],
 ARRAY['12 Gauge','20 Gauge','.38 Special','.45 ACP'],
 'Low',false,'USA',
 'Classic flake powder, one of the longest-produced powders in history. Primarily a shotshell powder but works well in light pistol loads. Very clean-burning.'),

('Alliant','American Select',
 8,'Flake',ARRAY['Shotgun','Pistol'],
 ARRAY['12 Gauge','28 Gauge','.45 ACP'],
 'Low',false,'USA',
 'Clean-burning flake powder designed for sporting clays target loads. Also excellent for light .45 ACP target loads.'),

('Alliant','Green Dot',
 12,'Flake',ARRAY['Shotgun'],
 ARRAY['12 Gauge','20 Gauge'],
 'Low',false,'USA',
 'Versatile shotgun powder for light to medium loads. Between Red Dot and Unique in burn rate. Popular for trap and skeet.'),

('Alliant','Unique',
 20,'Flake',ARRAY['Pistol','Shotgun','Rifle'],
 ARRAY['9mm','.38 Special','.357 Magnum','.45 ACP','12 Gauge','.223 Rem'],
 'Moderate',false,'USA',
 'The most versatile powder ever produced. Works in a wide range of calibers from pistol to light rifle. Has been in production since 1898. Dirty but effective.'),

('Alliant','Herco',
 22,'Flake',ARRAY['Pistol','Shotgun'],
 ARRAY['.357 Magnum','.44 Magnum','.45 ACP','.45 Colt','12 Gauge'],
 'Moderate',false,'USA',
 'Medium burn rate flake powder. Good for medium to heavy pistol loads and heavy shotshell loads. Works well in magnum pistol calibers.'),

('Alliant','Blue Dot',
 30,'Flake',ARRAY['Pistol','Shotgun'],
 ARRAY['.357 Magnum','.41 Magnum','.44 Magnum','.45 Colt','12 Gauge 3" Magnum'],
 'Moderate',false,'USA',
 'Slow-burning handgun and magnum shotshell powder. Excellent for high-performance magnum pistol loads and 3" magnum shotshells.'),

('Alliant','Power Pistol',
 35,'Ball',ARRAY['Pistol'],
 ARRAY['9mm','.40 S&W','.357 SIG','.45 ACP','.357 Magnum'],
 'Moderate',false,'USA',
 'High-energy ball powder for semi-automatic pistol calibers. Achieves high velocity with heavy bullets. Popular for 10mm and +P loads.'),

('Alliant','Sport Pistol',
 28,'Ball',ARRAY['Pistol'],
 ARRAY['9mm','.40 S&W','.45 ACP'],
 'Low',false,'USA',
 'Temperature-stable ball powder designed for USPSA and IPSC competition. Clean-burning, consistent, and low flash.'),

('Alliant','BE-86',
 32,'Ball',ARRAY['Pistol'],
 ARRAY['9mm','.40 S&W','.45 ACP','.38 Super'],
 'Low',false,'USA',
 'Benchmark pistol ball powder. Excellent metering, clean-burning, and temperature stable. Named for ballistic efficiency at 86 grains of water.'),

('Alliant','AR-Comp',
 55,'Ball',ARRAY['Rifle'],
 ARRAY['5.56 NATO','.223 Rem','300 Blackout (supersonic)'],
 'Low',false,'USA',
 'Temperature-stable ball powder optimized for AR-platform rifles. Designed for consistent performance from -65°F to 165°F. Ideal for military and competition use.'),

('Alliant','2400',
 40,'Flake',ARRAY['Pistol','Rifle'],
 ARRAY['.44 Magnum','.357 Magnum','.41 Magnum','.22 Hornet','7.62x39'],
 'Moderate',false,'USA',
 'Classic slow-burning pistol powder, excellent for magnum handgun cartridges and small rifle cases. Has been produced since the 1930s.'),

('Alliant','Reloader 7',
 48,'Extruded/Stick',ARRAY['Rifle'],
 ARRAY['.223 Rem','.22 Hornet','.222 Rem','.308 Win (light)','7.62x39'],
 'Moderate',false,'USA',
 'Fast rifle powder for small to medium capacity rifle cases. Popular for .223 Rem with lighter bullets and cast bullet rifle loads.'),

('Alliant','Reloader 10x',
 52,'Extruded/Stick',ARRAY['Rifle','Pistol'],
 ARRAY['.223 Rem','.308 Win (light)','10mm Auto','38 Super'],
 'Moderate',false,'USA',
 'Between RL7 and RL15 in burn rate. Excellent for high-velocity .223 Rem loads and heavy 10mm Auto loadings.'),

('Alliant','Reloader 15',
 58,'Extruded/Stick',ARRAY['Rifle'],
 ARRAY['.308 Win','.30-06','.243 Win','7mm-08','6.5 Creedmoor'],
 'Moderate',false,'USA',
 'Extremely versatile medium rifle powder. Excellent performance in .308 Win and similar capacity cases. Consistent metering and accuracy.'),

('Alliant','Reloader 16',
 60,'Extruded/Stick',ARRAY['Rifle'],
 ARRAY['6.5 Creedmoor','.308 Win','.300 WSM','270 WSM'],
 'Low',false,'USA',
 'Temperature-stable medium rifle powder. Low ES (extreme spread) and SD (standard deviation) for precision work. Excellent in 6.5 Creedmoor.'),

('Alliant','Reloader 17',
 63,'Extruded/Stick',ARRAY['Rifle'],
 ARRAY['6.5 Creedmoor','.270 Win','.30-06','7mm Rem Mag','.300 WSM'],
 'Moderate',false,'USA',
 'Medium-slow stick powder popular for medium-capacity rifle cartridges. Excellent velocity with heavy bullets in 6.5 Creedmoor.'),

('Alliant','Reloader 19',
 68,'Extruded/Stick',ARRAY['Rifle'],
 ARRAY['.30-06','.270 Win','7mm Rem Mag','.300 Win Mag'],
 'Moderate',false,'USA',
 'Slow-medium powder for standard and magnum rifle cartridges. Produces excellent velocities in .30-06 and 7mm Rem Mag.'),

('Alliant','Reloader 22',
 73,'Extruded/Stick',ARRAY['Magnum Rifle'],
 ARRAY['7mm Rem Mag','.300 Win Mag','.300 Wby','.338 Win Mag'],
 'Moderate',false,'USA',
 'Slow-burning magnum rifle powder. The benchmark for .300 Win Mag and 7mm Rem Mag accuracy loads.'),

('Alliant','Reloader 23',
 74,'Extruded/Stick',ARRAY['Magnum Rifle'],
 ARRAY['.300 Win Mag','7mm Rem Mag','.300 WSM','.26 Nosler'],
 'Low',false,'USA',
 'Temperature-stable version of RL22. Excellent low-ES results in cold weather. Popular for precision hunters and long-range shooters.'),

('Alliant','Reloader 25',
 78,'Extruded/Stick',ARRAY['Magnum Rifle'],
 ARRAY['.338 Lapua','.300 RUM','.338-378 Wby','.416 Rigby'],
 'Moderate',false,'USA',
 'Very slow magnum powder for the largest rifle cartridges. Fills large cases efficiently and produces consistent velocities.'),

('Alliant','Reloader 26',
 79,'Extruded/Stick',ARRAY['Magnum Rifle'],
 ARRAY['.300 Win Mag','.338 Lapua','7mm Rem Mag','.300 Norma Mag'],
 'Low',false,'USA',
 'Temperature-stable slow magnum powder. Used in precision competition rifles for consistent performance across temperature swings.'),

('Alliant','Reloader 33',
 85,'Extruded/Stick',ARRAY['Magnum Rifle'],
 ARRAY['.338 Lapua','.300 RUM','.338-378 Wby','.50 BMG (light)'],
 'Moderate',false,'USA',
 'Ultra-slow burning powder for the largest belted magnum cases. Produces maximum velocity from the biggest cartridges.'),

-- ── HODGDON ───────────────────────────────────────────────────────────────────
('Hodgdon','Titegroup',
 10,'Ball',ARRAY['Pistol'],
 ARRAY['9mm','.38 Special','.40 S&W','.45 ACP','.357 Magnum'],
 'Low',false,'USA',
 'Very fast ball powder. Low charge weights mean more rounds per pound. Clean-burning and consistent. Popular for high-volume target shooting.'),

('Hodgdon','CFE Pistol',
 15,'Ball',ARRAY['Pistol'],
 ARRAY['9mm','.40 S&W','.45 ACP','.38 Super','10mm'],
 'Low',false,'USA',
 'Copper Fouling Eraser technology. Clean-burning ball powder that reduces copper fouling. Temperature insensitive. Consistent across a wide temperature range.'),

('Hodgdon','H110',
 38,'Ball',ARRAY['Pistol','Rifle'],
 ARRAY['.44 Magnum','.357 Magnum','.454 Casull','.460 S&W','.300 Blackout (supersonic)'],
 'Moderate',false,'USA',
 'Slow-burning ball powder for magnum pistol and revolvers. Very similar to Winchester 296. Produces top velocities in .44 Magnum. Also popular for .300 Blackout supersonic loads.'),

('Hodgdon','H335',
 53,'Ball',ARRAY['Rifle'],
 ARRAY['.223 Rem','5.56 NATO','.222 Rem','.204 Ruger'],
 'Moderate',false,'USA',
 'Ball powder originally developed for military M193 .223 loads. Meters excellently through powder measures. Produces consistent, accurate .223 loads.'),

('Hodgdon','BL-C(2)',
 54,'Ball',ARRAY['Rifle'],
 ARRAY['.223 Rem','.308 Win','.30-06','.243 Win'],
 'Moderate',false,'USA',
 'Classic ball powder with a long history of producing excellent .308 Win accuracy. Also excellent in .223 Rem. Named for Ball Canister Lot 2.'),

('Hodgdon','CFE 223',
 56,'Ball',ARRAY['Rifle'],
 ARRAY['.223 Rem','5.56 NATO','.308 Win','.243 Win'],
 'Low',false,'USA',
 'CFE (Copper Fouling Eraser) ball powder. Dramatically reduces copper fouling in the bore. Temperature insensitive. Excellent velocity and accuracy in .223.'),

('Hodgdon','H4895',
 57,'Extruded/Stick',ARRAY['Rifle'],
 ARRAY['.308 Win','.30-06','.243 Win','7.62x51 NATO','.30-40 Krag'],
 'Moderate',false,'USA',
 'A classic medium-burn stick powder derived from surplus military powder. Excellent for reduced loads (a minimum charge for safe operation with almost any bullet). .308 Win benchmark.'),

('Hodgdon','H380',
 59,'Ball',ARRAY['Rifle'],
 ARRAY['.22-250','.243 Win','.308 Win','.338 Win Mag'],
 'Moderate',false,'USA',
 'Named for the 38.0 grain charge under a 52-grain bullet in .22-250 that produced a benchrest record. Ball powder for medium to large rifle cases.'),

('Hodgdon','Varget',
 61,'Extruded/Stick',ARRAY['Rifle'],
 ARRAY['.308 Win','6.5 Creedmoor','.223 Rem','6mm Creedmoor','.30-06','.243 Win'],
 'Low',false,'USA',
 'The most popular precision rifle powder in the world. Temperature insensitive extruded powder. Exceptional accuracy in .308 Win and 6.5 Creedmoor. Dominant in NRA High Power and F-Class competition.'),

('Hodgdon','H414',
 64,'Ball',ARRAY['Rifle'],
 ARRAY['.308 Win','.30-06','.270 Win','.243 Win','6.5 Creedmoor'],
 'Moderate',false,'USA',
 'Medium-slow ball powder. Close in burn rate to W760 (Winchester 760). Works well in a wide range of medium rifle cartridges.'),

('Hodgdon','H4350',
 66,'Extruded/Stick',ARRAY['Rifle'],
 ARRAY['6.5 Creedmoor','.308 Win','.30-06','7mm-08','.270 Win','.243 Win'],
 'Low',false,'USA',
 'Extremely popular precision rifle powder. Temperature insensitive. Excellent in 6.5 Creedmoor, .308 Win, and .270 Win. Second only to Varget in popularity among precision rifle competitors.'),

('Hodgdon','H4831',
 69,'Extruded/Stick',ARRAY['Rifle','Magnum Rifle'],
 ARRAY['.270 Win','.30-06','.280 Rem','7mm Rem Mag','.300 Win Mag'],
 'Moderate',false,'USA',
 'Classic slow-burning powder from surplus military powder. Excellent in medium to large capacity rifle cartridges. Originally came from surplus World War II powder.'),

('Hodgdon','H4831SC',
 69,'Extruded/Stick',ARRAY['Rifle','Magnum Rifle'],
 ARRAY['.270 Win','.30-06','7mm Rem Mag','.300 Win Mag','.338 Win Mag'],
 'Moderate',false,'USA',
 'Short Cut (SC) version of H4831. Shorter kernels for better metering through powder measures while maintaining H4831 performance characteristics.'),

('Hodgdon','H1000',
 76,'Extruded/Stick',ARRAY['Magnum Rifle'],
 ARRAY['7mm Rem Mag','.300 Win Mag','.30-378 Wby','.338 Lapua'],
 'Moderate',false,'USA',
 'Very slow extruded powder for large magnum rifle cases. Excellent in 7mm Rem Mag with heavy bullets and .300 Win Mag.'),

('Hodgdon','Lil''Gun',
 39,'Ball',ARRAY['Rifle','Pistol'],
 ARRAY['.410 Bore (shotshell)','.22 Hornet','6.5 Grendel','7.62x39','300 Blackout'],
 'Moderate',false,'USA',
 'Ball powder designed for the .410 bore shotshell. Also excellent in small-capacity rifle cases. Fills the gap between pistol and rifle powder burn rates.'),

-- ── IMR (now distributed by Hodgdon) ──────────────────────────────────────────
('IMR','IMR 4227',
 43,'Extruded/Stick',ARRAY['Pistol','Rifle'],
 ARRAY['.44 Magnum','.454 Casull','.22 Hornet','7.62x39'],
 'Moderate',false,'USA',
 'Slow pistol/fast rifle IMR powder. Excellent in magnum pistol cartridges and small-capacity rifle cases like .22 Hornet.'),

('IMR','IMR 4064',
 62,'Extruded/Stick',ARRAY['Rifle'],
 ARRAY['.308 Win','.30-06','.243 Win','.30-40 Krag','7.62x54R'],
 'Moderate',false,'USA',
 'A classic medium burn rate stick powder that has been a staple of precision rifle loading for decades. Excellent in .308 Win and .30-06. Good metering.'),

('IMR','IMR 4166',
 63,'Extruded/Stick',ARRAY['Rifle'],
 ARRAY['.308 Win','6.5 Creedmoor','.30-06','.243 Win'],
 'Low',false,'USA',
 'Enduron series (temperature insensitive). Copper fouling reducer. Close to Varget in burn rate and application. Consistent across temperature extremes.'),

('IMR','IMR 4350',
 67,'Extruded/Stick',ARRAY['Rifle'],
 ARRAY['.270 Win','.30-06','.308 Win','7mm-08','.243 Win'],
 'Moderate',false,'USA',
 'Classic slow-medium stick powder. One of the original IMR family. Works well in medium to medium-large rifle cases. Excellent in .270 Win.'),

('IMR','IMR 4451',
 68,'Extruded/Stick',ARRAY['Rifle'],
 ARRAY['6.5 Creedmoor','.308 Win','.30-06','.270 Win'],
 'Low',false,'USA',
 'Enduron temperature-insensitive version in the H4350 burn range. Copper fouling reducer. Excellent precision rifle powder.'),

('IMR','IMR 4831',
 70,'Extruded/Stick',ARRAY['Rifle','Magnum Rifle'],
 ARRAY['.270 Win','.30-06','7mm Rem Mag','.300 Win Mag'],
 'Moderate',false,'USA',
 'Classic slow-burning IMR powder. Excellent in large-capacity rifle cases. A traditional choice for .270 Win and 7mm Rem Mag.'),

('IMR','IMR 7977',
 80,'Extruded/Stick',ARRAY['Magnum Rifle'],
 ARRAY['7mm Rem Mag','.300 Win Mag','.338 Lapua','.28 Nosler'],
 'Low',false,'USA',
 'Enduron series very slow magnum powder. Temperature insensitive. Excellent for large belted magnums. Produces low ES and SD in precision applications.'),

('IMR','IMR 3031',
 56,'Extruded/Stick',ARRAY['Rifle'],
 ARRAY['.308 Win','.30-06','.222 Rem','.223 Rem'],
 'Moderate',false,'USA',
 'Fast-medium stick powder. Classic choice for many intermediate rifle cartridges. Good in .308 Win with lighter bullets.'),

('IMR','IMR SR4756',
 27,'Flake',ARRAY['Pistol','Shotgun'],
 ARRAY['.357 Magnum','.44 Magnum','12 Gauge','.45 ACP'],
 'Moderate',false,'USA',
 'Medium burn rate pistol and shotgun powder. Works well in medium to heavy pistol loads and light shotshell applications.'),

('IMR','IMR SR7625',
 22,'Flake',ARRAY['Pistol','Shotgun'],
 ARRAY['.38 Special','.45 ACP','12 Gauge','20 Gauge'],
 'Moderate',false,'USA',
 'Medium-fast pistol and shotgun flake powder. Excellent in target pistol loads and light to medium shotshell applications.'),

('IMR','IMR 4895',
 57,'Extruded/Stick',ARRAY['Rifle'],
 ARRAY['.308 Win','.30-06','.243 Win','.30-40 Krag'],
 'Moderate',false,'USA',
 'Classic military surplus-derived powder. Originally from surplus WWII powder. Excellent in .308 Win and .30-06. Great for reduced loads.'),

-- ── WINCHESTER (St. Marks) ─────────────────────────────────────────────────────
('Winchester','231',
 17,'Ball',ARRAY['Pistol'],
 ARRAY['9mm','.38 Special','.40 S&W','.45 ACP','.380 ACP'],
 'Moderate',false,'USA',
 'Classic ball powder identical to Hodgdon HP-38. The most widely used pistol powder in the US. Consistent, clean-burning, and excellent metering.'),

('Winchester','296',
 37,'Ball',ARRAY['Pistol'],
 ARRAY['.44 Magnum','.357 Magnum','.454 Casull','.410 Bore'],
 'Moderate',false,'USA',
 'Identical to Hodgdon H110. Slow-burning ball powder for maximum magnum pistol velocities and .410 shotshell. Not suitable for reduced loads.'),

('Winchester','748',
 55,'Ball',ARRAY['Rifle'],
 ARRAY['.223 Rem','5.56 NATO','.308 Win'],
 'Moderate',false,'USA',
 'Ball powder popular for .223 Rem. Consistent metering. Good velocity in medium rifle cases. Originally developed for .308 Win military use.'),

('Winchester','760',
 64,'Ball',ARRAY['Rifle'],
 ARRAY['.308 Win','.30-06','.270 Win','.243 Win','6.5 Creedmoor'],
 'Moderate',false,'USA',
 'Medium-slow ball powder. Close to H414 in burn rate. Works well in a wide range of medium rifle cartridges.'),

('Winchester','WST',
 14,'Flake',ARRAY['Pistol','Shotgun'],
 ARRAY['9mm','.38 Special','.45 ACP','12 Gauge (target)'],
 'Low',false,'USA',
 'Winchester Super Target. Clean-burning flake powder for target pistol and shotgun loads. Very consistent.'),

('Winchester','WAP',
 23,'Ball',ARRAY['Pistol'],
 ARRAY['9mm','.40 S&W','.357 SIG'],
 'Low',false,'USA',
 'Winchester Action Pistol. Ball powder optimized for 9mm and .40 S&W competition loads. Consistent and clean.'),

('Winchester','AutoComp',
 25,'Ball',ARRAY['Pistol'],
 ARRAY['9mm','.40 S&W','.38 Super','.45 ACP'],
 'Low',false,'USA',
 'Ball powder optimized for compensated semi-automatic pistols. Consistent charge weights and clean-burning formulation.'),

('Winchester','StaBALL 6.5',
 65,'Ball',ARRAY['Rifle'],
 ARRAY['6.5 Creedmoor','.308 Win','.260 Rem'],
 'Low',false,'USA',
 'Temperature-stable ball powder specifically optimized for the 6.5 Creedmoor cartridge. Copper fouling reducer included in formulation.'),

('Winchester','StaBALL HD',
 72,'Ball',ARRAY['Rifle','Magnum Rifle'],
 ARRAY['.300 Win Mag','.308 Win','.30-06','7mm Rem Mag'],
 'Low',false,'USA',
 'High-density temperature-stable ball powder for larger rifle and magnum cases. Extended barrel life compared to some extruded alternatives.'),

('Winchester','StaBALL Match',
 61,'Ball',ARRAY['Rifle'],
 ARRAY['.308 Win','6.5 Creedmoor','.223 Rem'],
 'Low',false,'USA',
 'Match-grade temperature-stable ball powder. Consistent lot-to-lot performance for competition loading.'),

('Winchester','780',
 75,'Ball',ARRAY['Magnum Rifle'],
 ARRAY['.300 Win Mag','.338 Win Mag','.30-378 Wby'],
 'Moderate',false,'USA',
 'Very slow ball powder for large magnum rifle cases. Produces top velocities in the largest standard magnum cartridges.'),

-- ── VIHTAVUORI ────────────────────────────────────────────────────────────────
('Vihtavuori','N110',
 36,'Extruded/Stick',ARRAY['Pistol','Rifle'],
 ARRAY['.44 Magnum','.357 Magnum','.22 Hornet','.30 Carbine'],
 'Low',false,'Finland',
 'Finnish precision powder. Slow pistol/fast rifle application. Excellent in magnum pistol cases and small rifle cases. Very low temperature sensitivity.'),

('Vihtavuori','N120',
 44,'Extruded/Stick',ARRAY['Rifle'],
 ARRAY['.222 Rem','.223 Rem','.22 Hornet','6mm PPC'],
 'Low',false,'Finland',
 'Fast rifle powder for small to medium capacity rifle cases. Excellent accuracy in .223 Rem and benchrest cartridges like 6mm PPC.'),

('Vihtavuori','N130',
 50,'Extruded/Stick',ARRAY['Rifle'],
 ARRAY['.223 Rem','.222 Rem','.300 Blackout (supersonic)'],
 'Low',false,'Finland',
 'Medium-fast rifle powder. Between N120 and N133 in burn rate. Good for .223 Rem with medium-weight bullets.'),

('Vihtavuori','N133',
 53,'Extruded/Stick',ARRAY['Rifle'],
 ARRAY['5.56 NATO','.223 Rem','6mm PPC','.300 Blackout'],
 'Low',false,'Finland',
 'Benchmark Vihtavuori powder for .223 Rem and benchrest cartridges. Extremely consistent lot-to-lot. Low temperature sensitivity.'),

('Vihtavuori','N135',
 57,'Extruded/Stick',ARRAY['Rifle'],
 ARRAY['.308 Win','.223 Rem','.243 Win','.30-40 Krag'],
 'Low',false,'Finland',
 'Medium rifle powder. Very consistent and accurate. Popular in .308 Win with lighter bullet weights.'),

('Vihtavuori','N140',
 61,'Extruded/Stick',ARRAY['Rifle'],
 ARRAY['.308 Win','6.5 Creedmoor','.30-06','.243 Win','7mm-08'],
 'Low',false,'Finland',
 'The most popular Vihtavuori powder globally. Excellent in .308 Win and 6.5 Creedmoor. Very low temperature sensitivity and consistent performance.'),

('Vihtavuori','N150',
 66,'Extruded/Stick',ARRAY['Rifle'],
 ARRAY['.30-06','.270 Win','7mm-08','.308 Win (heavy)'],
 'Low',false,'Finland',
 'Medium-slow rifle powder. Excellent for .30-06 with standard bullet weights and .270 Win. Very consistent.'),

('Vihtavuori','N160',
 70,'Extruded/Stick',ARRAY['Rifle','Magnum Rifle'],
 ARRAY['.270 Win','.30-06','7mm Rem Mag','.300 Win Mag','.338 Win Mag'],
 'Low',false,'Finland',
 'Slow rifle powder for medium to large capacity cases. Excellent in 7mm Rem Mag and .300 Win Mag.'),

('Vihtavuori','N165',
 73,'Extruded/Stick',ARRAY['Magnum Rifle'],
 ARRAY['7mm Rem Mag','.300 Win Mag','.338 Win Mag','.375 H&H'],
 'Low',false,'Finland',
 'Very slow Vihtavuori powder for large magnum cases. Consistent and accurate in the largest standard magnums.'),

('Vihtavuori','N170',
 78,'Extruded/Stick',ARRAY['Magnum Rifle'],
 ARRAY['.338 Lapua','.300 Norma Mag','.375 H&H','.416 Rigby'],
 'Low',false,'Finland',
 'Ultra-slow Vihtavuori powder for the largest rifle cartridges. Essential for .338 Lapua and similar case capacities.'),

('Vihtavuori','N310',
 4,'Flake',ARRAY['Pistol','Shotgun'],
 ARRAY['.32 ACP','.380 ACP','9mm (light)','28 Gauge'],
 'Low',false,'Finland',
 'Very fast Vihtavuori handgun powder. Good for light loads in small pistol calibers. Also suitable for light shotshell applications.'),

('Vihtavuori','N320',
 8,'Flake',ARRAY['Pistol'],
 ARRAY['9mm','.38 Special','.40 S&W','.45 ACP'],
 'Low',false,'Finland',
 'Popular competition handgun powder. Clean-burning, consistent, and excellent metering. Used by IPSC and USPSA competitors worldwide.'),

('Vihtavuori','N330',
 12,'Flake',ARRAY['Pistol'],
 ARRAY['9mm','.357 Magnum','.40 S&W','.38 Super'],
 'Low',false,'Finland',
 'Medium-fast handgun powder. Good versatility across 9mm to .357 Magnum. Consistent and accurate.'),

('Vihtavuori','N340',
 17,'Flake',ARRAY['Pistol'],
 ARRAY['9mm','.40 S&W','.357 Magnum','.45 ACP'],
 'Low',false,'Finland',
 'Medium handgun powder. Excellent for 9mm major power factor loads and .40 S&W IPSC competition.'),

('Vihtavuori','N350',
 22,'Flake',ARRAY['Pistol'],
 ARRAY['.357 Magnum','.44 Magnum','.45 ACP (heavy)','10mm'],
 'Low',false,'Finland',
 'Slow handgun powder. Excellent for heavy bullet loads in .357 Magnum and .44 Magnum. Low temperature sensitivity for hunting use.'),

('Vihtavuori','N360',
 28,'Flake',ARRAY['Pistol'],
 ARRAY['.357 Magnum','.44 Magnum','.45 Colt','.454 Casull'],
 'Low',false,'Finland',
 'Very slow handgun powder for maximum magnum pistol performance. Top velocity loads in .357 Magnum and .44 Magnum.'),

('Vihtavuori','3N37',
 33,'Flake',ARRAY['Pistol'],
 ARRAY['9mm (+P/major)','.38 Super','.357 SIG','.40 S&W (major)'],
 'Low',false,'Finland',
 'Competition handgun powder for major power factor loads. Popular in Open division IPSC/USPSA where maximum velocity matters.'),

('Vihtavuori','3N38',
 40,'Flake',ARRAY['Pistol'],
 ARRAY['9mm Major','.38 Super Major','.357 SIG'],
 'Low',false,'Finland',
 'Developed for Open division competition. Produces top velocities for major power factor in 9mm and .38 Super while remaining clean and consistent.'),

('Vihtavuori','20N29',
 71,'Extruded/Stick',ARRAY['Rifle'],
 ARRAY['.308 Win (F-Class)','6.5 Creedmoor','.284 Win'],
 'Low',false,'Finland',
 'Purpose-built for F-Class long-range competition. Extremely consistent lot-to-lot. Designed specifically for the .308 Win F-Class application.'),

('Vihtavuori','24N41',
 82,'Extruded/Stick',ARRAY['Magnum Rifle'],
 ARRAY['.338 Lapua','.408 CheyTac','.375 CheyTac'],
 'Low',false,'Finland',
 'Extremely slow powder for the largest precision rifle cartridges used in ELR (extreme long range) competition. Consistent and accurate.'),

-- ── ACCURATE POWDERS (Western Powders) ────────────────────────────────────────
('Accurate','No. 2',
 3,'Ball',ARRAY['Pistol'],
 ARRAY['.32 ACP','.380 ACP','9mm (light)','.38 Special (light)'],
 'Moderate',false,'USA',
 'Very fast ball powder for light pistol loads. Good metering characteristics. Similar burn rate to Hodgdon Clays.'),

('Accurate','No. 5',
 18,'Ball',ARRAY['Pistol'],
 ARRAY['9mm','.38 Special','.40 S&W','.45 ACP'],
 'Moderate',false,'USA',
 'Medium-fast ball powder. Versatile for a wide range of pistol calibers. Clean-burning and consistent.'),

('Accurate','No. 7',
 30,'Ball',ARRAY['Pistol'],
 ARRAY['9mm (+P)','.38 Super','.357 Magnum','.40 S&W','.45 ACP (heavy)'],
 'Moderate',false,'USA',
 'Slow pistol ball powder. Good for high-velocity pistol loads and medium-power magnum loads.'),

('Accurate','No. 9',
 38,'Ball',ARRAY['Pistol'],
 ARRAY['.357 Magnum','.41 Magnum','.44 Magnum','.454 Casull','10mm'],
 'Moderate',false,'USA',
 'Very slow pistol/fast rifle ball powder. Maximum magnum pistol performance. Consistent velocity in large-capacity pistol cases.'),

('Accurate','2015',
 54,'Extruded/Stick',ARRAY['Rifle'],
 ARRAY['.223 Rem','5.56 NATO','.22 Hornet','.300 Blackout'],
 'Moderate',false,'USA',
 'Single-base stick powder similar in burn rate to BL-C(2). Good for .223 Rem and small to medium capacity rifle cases.'),

('Accurate','2230',
 55,'Ball',ARRAY['Rifle'],
 ARRAY['.223 Rem','5.56 NATO','.308 Win (light)'],
 'Moderate',false,'USA',
 'Bulk-density ball powder similar to H335. Good for .223 Rem. Consistent metering.'),

('Accurate','2460',
 56,'Ball',ARRAY['Rifle'],
 ARRAY['.223 Rem','.308 Win','.30-06'],
 'Moderate',false,'USA',
 'Ball powder between 2230 and 2520 in burn rate. Good versatility for medium rifle cartridges.'),

('Accurate','2520',
 58,'Ball',ARRAY['Rifle'],
 ARRAY['.308 Win','.30-06','.243 Win','.223 Rem (heavy)'],
 'Moderate',false,'USA',
 'Medium ball powder. Similar to Varget in application. Excellent in .308 Win. Good metering characteristics.'),

('Accurate','4064',
 62,'Extruded/Stick',ARRAY['Rifle'],
 ARRAY['.308 Win','.30-06','.243 Win','7.62 NATO'],
 'Moderate',false,'USA',
 'Medium-slow stick powder. Named for IMR 4064 similar application. Good in .308 Win and .30-06.'),

('Accurate','4350',
 67,'Extruded/Stick',ARRAY['Rifle','Magnum Rifle'],
 ARRAY['.270 Win','.30-06','7mm Rem Mag','.338 Win Mag'],
 'Moderate',false,'USA',
 'Slow-burning stick powder. Similar to H4350/IMR4350 application range. Excellent in medium to large capacity rifle cases.'),

('Accurate','5744',
 47,'Extruded/Stick',ARRAY['Rifle'],
 ARRAY['.45-70 Govt','.50-90 Sharps','.308 Win (reduced)','.30-06 (reduced)'],
 'Moderate',false,'USA',
 'Fast-medium single-base powder. Unique for reduced loads in large cases — fills large rifle cases like .45-70 at lower pressures without dangerous space issues.'),

('Accurate','MagPro',
 77,'Ball',ARRAY['Magnum Rifle'],
 ARRAY['.300 Win Mag','7mm Rem Mag','.338 Win Mag','.300 RUM'],
 'Moderate',false,'USA',
 'Very slow magnum ball powder. Produces top velocities in standard and Remington Ultra Magnum cases.'),

('Accurate','LT-32',
 52,'Extruded/Stick',ARRAY['Rifle'],
 ARRAY['.223 Rem','6mm Creedmoor','6.5 Creedmoor (light)'],
 'Low',false,'USA',
 'Temperature-stable extruded powder for small to medium rifle cases. Similar to Varget in some applications.'),

('Accurate','LT-30',
 50,'Extruded/Stick',ARRAY['Rifle'],
 ARRAY['.223 Rem','.300 Blackout','.22 Nosler'],
 'Low',false,'USA',
 'Temperature-stable powder between N133 and N135 in burn rate. Excellent for .223 Rem with heavy bullets.'),

('Accurate','XMR 4064',
 62,'Extruded/Stick',ARRAY['Rifle'],
 ARRAY['.308 Win','.30-06','.243 Win'],
 'Low',false,'USA',
 'Extreme temperature-stable version of 4064. Low ES/SD across temperature extremes. Precision competition use.'),

-- ── RAMSHOT (Western Powders) ──────────────────────────────────────────────────
('Ramshot','Zip',
 6,'Ball',ARRAY['Pistol'],
 ARRAY['9mm','.40 S&W','.45 ACP','.380 ACP'],
 'Low',false,'Belgium',
 'Very fast Belgian-made ball powder. Clean and consistent. Similar to Winchester 231 in application.'),

('Ramshot','Competition',
 13,'Ball',ARRAY['Pistol'],
 ARRAY['9mm','.40 S&W','.45 ACP','.38 Special'],
 'Low',false,'Belgium',
 'Medium-fast competition handgun ball powder. Consistent and clean. Good for USPSA and IDPA competition loads.'),

('Ramshot','True Blue',
 19,'Ball',ARRAY['Pistol'],
 ARRAY['9mm','.357 Magnum','.40 S&W','.38 Super'],
 'Low',false,'Belgium',
 'Medium handgun powder. Popular for 9mm and .40 S&W competition loads. Very consistent metering.'),

('Ramshot','Silhouette',
 26,'Ball',ARRAY['Pistol'],
 ARRAY['9mm','.40 S&W','.357 Magnum','.38 Super','.45 ACP'],
 'Low',false,'Belgium',
 'Named for Metallic Silhouette competition. Slower-burning handgun ball powder. Good for major power factor 9mm loads.'),

('Ramshot','Hunter',
 65,'Ball',ARRAY['Rifle'],
 ARRAY['.308 Win','.270 Win','.30-06','7mm-08'],
 'Low',false,'Belgium',
 'Medium-slow ball powder. Similar burn rate to H414/W760. Good for medium capacity rifle cartridges.'),

('Ramshot','Big Game',
 71,'Ball',ARRAY['Rifle','Magnum Rifle'],
 ARRAY['.300 Win Mag','.30-06 (heavy)','.338 Win Mag','7mm Rem Mag'],
 'Low',false,'Belgium',
 'Slow ball powder for large standard and magnum rifle cases. Consistent metering and excellent velocity.'),

('Ramshot','LRT',
 80,'Ball',ARRAY['Magnum Rifle'],
 ARRAY['.338 Lapua','.300 Win Mag','.375 H&H','.416 Rigby'],
 'Low',false,'Belgium',
 'Long Range Target powder. Very slow-burning for large magnum cases. Designed for ELR competition.'),

('Ramshot','Magnum',
 82,'Ball',ARRAY['Magnum Rifle'],
 ARRAY['.338 Lapua','.300 RUM','.340 Wby','.30-378 Wby'],
 'Low',false,'Belgium',
 'Ultra-slow magnum ball powder. Top velocities from the largest magnum rifle cartridges.')

ON CONFLICT (brand, product_name) DO NOTHING;
