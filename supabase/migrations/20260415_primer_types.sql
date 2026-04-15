-- ============================================================
-- primer_types: public reference table
-- Reloading primers — brand, category, and common uses
-- RLS: public SELECT, service_role only for writes
-- ============================================================

CREATE TABLE IF NOT EXISTS public.primer_types (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text UNIQUE NOT NULL,
  category         text,      -- 'Small Pistol','Large Pistol','Small Rifle','Large Rifle','Small Magnum Pistol','Large Magnum Pistol','Small Magnum Rifle','Large Magnum Rifle','Shotshell','Rimfire'
  brand            text,
  part_number      text,
  description      text,
  common_calibers  text[],
  military_spec    boolean DEFAULT false,
  created_at       timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_primer_types_category ON public.primer_types (category);
CREATE INDEX IF NOT EXISTS idx_primer_types_brand    ON public.primer_types (brand);

-- RLS
ALTER TABLE public.primer_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "primer_types_public_read"   ON public.primer_types;
DROP POLICY IF EXISTS "primer_types_service_write" ON public.primer_types;

CREATE POLICY "primer_types_public_read"
  ON public.primer_types FOR SELECT
  USING (true);

CREATE POLICY "primer_types_service_write"
  ON public.primer_types FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- SEED DATA  (55+ primer types)
-- ============================================================

INSERT INTO public.primer_types
  (name, category, brand, part_number, description, common_calibers, military_spec)
VALUES

-- ── FEDERAL PRIMERS ───────────────────────────────────────────────────────────
('Federal 100 Small Pistol',
 'Small Pistol','Federal','100',
 'Standard small pistol primer. Reliable ignition for standard pressure small-bore handgun cartridges. One of the most consistently available primers in the US.',
 ARRAY['9mm Luger','.38 Special','.380 ACP','.32 ACP','.32 H&R Magnum'],
 false),

('Federal 100M Small Pistol Match',
 'Small Pistol','Federal','100M',
 'Match-grade small pistol primer with tighter tolerances and more consistent brisance. Popular for competition loading in 9mm and .38 Special target loads.',
 ARRAY['9mm Luger','.38 Special','.32 H&R Magnum'],
 false),

('Federal 150 Large Pistol',
 'Large Pistol','Federal','150',
 'Standard large pistol primer. Reliable ignition for .45 ACP, .44 Magnum, and other large-bore pistol cartridges.',
 ARRAY['.45 ACP','.44 Special','.45 Colt','.44-40 Win'],
 false),

('Federal 155 Large Pistol Magnum',
 'Large Magnum Pistol','Federal','155',
 'Hotter large pistol primer for magnum handgun cartridges. The additional heat ensures reliable ignition of slower-burning powders used in .44 Magnum and .454 Casull.',
 ARRAY['.44 Magnum','.41 Magnum','.454 Casull','.460 S&W','.500 S&W'],
 false),

('Federal 200 Small Pistol Magnum',
 'Small Magnum Pistol','Federal','200',
 'Hotter small pistol primer for small-bore magnum revolver cartridges. Ensures reliable ignition of slower powders in .357 Magnum.',
 ARRAY['.357 Magnum','.357 SIG','.38 Special (+P+)'],
 false),

('Federal 205 Small Rifle',
 'Small Rifle','Federal','205',
 'Standard small rifle primer. Provides reliable ignition for small-capacity rifle cartridges. Popular in .223 Rem, .222 Rem, and similar cartridges.',
 ARRAY['.223 Rem','5.56 NATO','.222 Rem','.22-250','.204 Ruger'],
 false),

('Federal 205M Small Rifle Match',
 'Small Rifle','Federal','205M',
 'Match-grade small rifle primer with tighter tolerances. One of the most popular competition primers for .223 Rem and other small rifle cartridges. Excellent for precision work.',
 ARRAY['.223 Rem','5.56 NATO','.222 Rem','6mm PPC','6mm BR'],
 false),

('Federal 210 Large Rifle',
 'Large Rifle','Federal','210',
 'Standard large rifle primer for medium to large capacity rifle cartridges. Reliable ignition across a wide range of rifle powders.',
 ARRAY['.308 Win','30-06','.243 Win','.270 Win','7mm Rem Mag'],
 false),

('Federal 210M Large Rifle Match',
 'Large Rifle','Federal','210M',
 'The most popular match large rifle primer in the world. Extremely consistent ignition energy and brisance. Dominant in NRA High Power, F-Class, and PRS competition.',
 ARRAY['.308 Win','30-06','6.5 Creedmoor','.243 Win','.300 Win Mag'],
 false),

('Federal 215 Large Rifle Magnum',
 'Large Magnum Rifle','Federal','215',
 'Hotter large rifle primer for large-capacity magnum rifle cartridges. Ensures complete ignition of slow-burning powders used in .300 Win Mag and similar.',
 ARRAY['.300 Win Mag','7mm Rem Mag','.338 Win Mag','.338 Lapua','.375 H&H'],
 false),

('Federal 215M Large Rifle Magnum Match',
 'Large Magnum Rifle','Federal','215M',
 'Match version of the 215. The standard for precision reloading in magnum rifle cartridges. Consistent across temperature extremes.',
 ARRAY['.300 Win Mag','7mm Rem Mag','.338 Lapua','.338 Win Mag','.30 Nosler'],
 false),

('Federal 209 Shotshell',
 'Shotshell','Federal','209',
 'Standard 209 shotshell primer. The most widely used shotshell primer in the US. Compatible with all major 12-gauge wads and powders.',
 ARRAY['12 Gauge','20 Gauge','28 Gauge','.410 Bore'],
 false),

('Federal 209A Shotshell',
 'Shotshell','Federal','209A',
 'Hotter 209 variant for use with certain powder/wad combinations that require more ignition energy. Popular with Alliant Red Dot and American Select.',
 ARRAY['12 Gauge','20 Gauge'],
 false),

-- ── CCI PRIMERS ───────────────────────────────────────────────────────────────
('CCI 500 Small Pistol',
 'Small Pistol','CCI','500',
 'CCI''s standard small pistol primer. One of the most widely available and reliable primers in the US. Clean-burning with consistent brisance.',
 ARRAY['9mm Luger','.38 Special','.380 ACP','.32 ACP'],
 false),

('CCI 550 Small Pistol Magnum',
 'Small Magnum Pistol','CCI','550',
 'Hotter CCI small pistol primer for .357 Magnum and other small-bore magnum revolver cartridges. More reliable with slower powders.',
 ARRAY['.357 Magnum','.357 SIG','.38 Super (+P)'],
 false),

('CCI 400 Small Rifle',
 'Small Rifle','CCI','400',
 'Standard CCI small rifle primer. Popular for .223 Rem and similar small rifle cartridges. Can be substituted in some pistol cases with large flash holes.',
 ARRAY['.223 Rem','5.56 NATO','.222 Rem','.204 Ruger','.22-250'],
 false),

('CCI 41 Small Rifle Military',
 'Small Rifle','CCI','41',
 'Military-specification small rifle primer with a harder cup to prevent slam fires in AR-platform rifles with a floating firing pin. Recommended over standard small rifle primers in semi-auto rifle applications.',
 ARRAY['5.56 NATO','.223 Rem','300 Blackout'],
 true),

('CCI 450 Small Rifle Magnum',
 'Small Magnum Rifle','CCI','450',
 'Hotter small rifle primer for small-capacity cases loaded with slower-burning powders, or for use in .223 Rem in very cold weather conditions.',
 ARRAY['.223 Rem (heavy powder charge)','.22 Hornet','6mm PPC (some loads)'],
 false),

('CCI 200 Large Rifle',
 'Large Rifle','CCI','200',
 'Standard CCI large rifle primer. Reliable ignition for a wide range of medium to large capacity rifle cartridges. Good general-purpose primer.',
 ARRAY['.308 Win','.30-06','.243 Win','.270 Win','7mm-08'],
 false),

('CCI 250 Large Rifle Magnum',
 'Large Magnum Rifle','CCI','250',
 'Hotter large rifle primer for magnum rifle cartridges. Ensures complete ignition of slow-burning magnum powders.',
 ARRAY['.300 Win Mag','7mm Rem Mag','.338 Win Mag','.375 H&H'],
 false),

('CCI 34 Large Rifle Military',
 'Large Rifle','CCI','34',
 'Military-specification large rifle primer with a harder cup to prevent slam fires in semi-automatic rifle applications. Recommended for AR-10 and similar platforms.',
 ARRAY['7.62 NATO','.308 Win','.30-06'],
 true),

('CCI 35 Large Pistol',
 'Large Pistol','CCI','35',
 'Standard CCI large pistol primer for .45 ACP, .44 Special, and other large-bore straight-wall pistol cartridges.',
 ARRAY['.45 ACP','.44 Special','.45 Colt','.44-40 Win'],
 false),

('CCI 350 Large Pistol Magnum',
 'Large Magnum Pistol','CCI','350',
 'Hotter large pistol primer for .44 Magnum and other large-bore magnum revolver cartridges.',
 ARRAY['.44 Magnum','.41 Magnum','.45 Colt (+P)','.454 Casull'],
 false),

('CCI 209 Shotshell',
 'Shotshell','CCI','209',
 'CCI''s 209 shotshell primer. Compatible with most shotgun loads. Consistent ignition across load types.',
 ARRAY['12 Gauge','20 Gauge','28 Gauge'],
 false),

('CCI 209M Shotshell Magnum',
 'Shotshell','CCI','209M',
 'Magnum 209 shotshell primer for heavy waterfowl and turkey loads with dense powder charges.',
 ARRAY['12 Gauge 3"','12 Gauge 3.5"','20 Gauge 3"'],
 false),

('CCI BR2 Large Rifle Benchrest',
 'Large Rifle','CCI','BR2',
 'Benchrest-grade large rifle primer with the most consistent cup thickness and brisance in the CCI lineup. The standard for BR competition shooters.',
 ARRAY['.308 Win (F-Class/BR)','.30-06','.243 Win','6BR','6 Dasher'],
 false),

('CCI BR4 Small Rifle Benchrest',
 'Small Rifle','CCI','BR4',
 'Benchrest-grade small rifle primer. Most consistent CCI small rifle primer. Popular in 6mm PPC and other BR cartridges.',
 ARRAY['6mm PPC','6mm BR','.223 Rem (BR)','6mm Dasher'],
 false),

-- ── WINCHESTER PRIMERS ────────────────────────────────────────────────────────
('Winchester WSP Small Pistol',
 'Small Pistol','Winchester','WSP',
 'Winchester Standard Small Pistol primer. Reliable and consistent. Good general-purpose small pistol primer.',
 ARRAY['9mm Luger','.38 Special','.380 ACP','.32 ACP'],
 false),

('Winchester WSPM Small Pistol Magnum',
 'Small Magnum Pistol','Winchester','WSPM',
 'Hotter Winchester small pistol primer for .357 Magnum and small-bore magnum cartridges.',
 ARRAY['.357 Magnum','.357 SIG','.38 Super (+P)'],
 false),

('Winchester WLP Large Pistol',
 'Large Pistol','Winchester','WLP',
 'Winchester Large Pistol primer. Standard for large-bore straight-wall pistol cartridges.',
 ARRAY['.45 ACP','.44 Special','.45 Colt','.44-40 Win'],
 false),

('Winchester WLPM Large Pistol Magnum',
 'Large Magnum Pistol','Winchester','WLPM',
 'Hotter Winchester large pistol primer for .44 Magnum and large-bore magnum revolver cartridges.',
 ARRAY['.44 Magnum','.41 Magnum','.45 Colt (+P)','.454 Casull'],
 false),

('Winchester WSR Small Rifle',
 'Small Rifle','Winchester','WSR',
 'Winchester Small Rifle primer. Reliable ignition for .223 Rem and small-capacity rifle cartridges.',
 ARRAY['.223 Rem','5.56 NATO','.222 Rem','6mm PPC','.22-250'],
 false),

('Winchester WLR Large Rifle',
 'Large Rifle','Winchester','WLR',
 'Winchester Large Rifle primer. Standard for medium to large capacity rifle cartridges.',
 ARRAY['.308 Win','.30-06','.243 Win','.270 Win','7mm-08'],
 false),

('Winchester WLRM Large Rifle Magnum',
 'Large Magnum Rifle','Winchester','WLRM',
 'Hotter Winchester large rifle primer for magnum rifle cartridges loaded with slower powders.',
 ARRAY['.300 Win Mag','7mm Rem Mag','.338 Win Mag','.375 H&H'],
 false),

('Winchester 209 Shotshell',
 'Shotshell','Winchester','W209',
 'Winchester 209 shotshell primer. One of the most widely used shotshell primers in target shooting.',
 ARRAY['12 Gauge','20 Gauge','28 Gauge','.410 Bore'],
 false),

-- ── REMINGTON PRIMERS ─────────────────────────────────────────────────────────
('Remington 1.5 Small Pistol',
 'Small Pistol','Remington','1.5',
 'Remington standard small pistol primer. Classic American primer, though now manufactured by Vista Outdoor under the RemArms brand.',
 ARRAY['9mm Luger','.38 Special','.380 ACP'],
 false),

('Remington 5.5 Small Pistol Magnum',
 'Small Magnum Pistol','Remington','5.5',
 'Remington hotter small pistol primer for .357 Magnum and similar magnum revolver cartridges.',
 ARRAY['.357 Magnum','.38 Super (+P)'],
 false),

('Remington 2.5 Large Pistol',
 'Large Pistol','Remington','2.5',
 'Remington standard large pistol primer for .45 ACP, .44 Special, and other large-bore pistol cartridges.',
 ARRAY['.45 ACP','.44 Special','.45 Colt'],
 false),

('Remington 6.5 Large Pistol Magnum',
 'Large Magnum Pistol','Remington','6.5',
 'Remington hotter large pistol primer for .44 Magnum and other large-bore magnum cartridges.',
 ARRAY['.44 Magnum','.41 Magnum','.454 Casull'],
 false),

('Remington 7.5 Small Rifle',
 'Small Rifle','Remington','7.5',
 'Remington standard small rifle primer (formerly known as 6.5 BR). Popular in .223 Rem and benchrest cartridges.',
 ARRAY['.223 Rem','5.56 NATO','.222 Rem','6mm BR','6mm PPC'],
 false),

('Remington 9.5 Large Rifle',
 'Large Rifle','Remington','9.5',
 'Remington standard large rifle primer. The 9.5 has a longer history than most and is known for consistent ignition.',
 ARRAY['.308 Win','.30-06','.243 Win','.270 Win','7mm-08'],
 false),

('Remington 9.5M Large Rifle Magnum',
 'Large Magnum Rifle','Remington','9.5M',
 'Remington hotter large rifle primer for magnum rifle cartridges requiring more energetic ignition.',
 ARRAY['.300 Win Mag','7mm Rem Mag','.338 Win Mag','.375 H&H'],
 false),

('Remington 209 Premier Shotshell',
 'Shotshell','Remington','209 Premier',
 'Remington''s standard 209 shotshell primer. Widely used in target loads.',
 ARRAY['12 Gauge','20 Gauge','28 Gauge'],
 false),

-- ── RWS / GERMAN PRIMERS ──────────────────────────────────────────────────────
('RWS 4033 Small Pistol',
 'Small Pistol','RWS','4033',
 'German-made precision small pistol primer. Extremely consistent lot-to-lot. Popular among European IPSC competitors.',
 ARRAY['9mm Luger','.38 Special','.380 ACP'],
 false),

('RWS 4031 Large Pistol',
 'Large Pistol','RWS','4031',
 'German precision large pistol primer. Consistent and clean-burning. Used by European precision handgun competitors.',
 ARRAY['.45 ACP','.44 Special','.45 Colt'],
 false),

('RWS 4350 Small Rifle',
 'Small Rifle','RWS','4350',
 'German small rifle primer known for exceptional consistency. Popular for precision .223 Rem bench rest and F-TR competition.',
 ARRAY['.223 Rem','5.56 NATO','.222 Rem','6mm BR'],
 false),

('RWS 5341 Large Rifle',
 'Large Rifle','RWS','5341',
 'RWS standard large rifle primer. German-made, known for consistency and reliability. Popular in European precision rifle competition.',
 ARRAY['.308 Win','.30-06','.243 Win','6.5 Creedmoor'],
 false),

('RWS 5333 Large Rifle Magnum',
 'Large Magnum Rifle','RWS','5333',
 'RWS magnum large rifle primer for large-capacity cases with slow-burning powders. German precision manufacturing.',
 ARRAY['.300 Win Mag','7mm Rem Mag','.338 Lapua'],
 false),

('RWS 6507 Shotshell',
 'Shotshell','RWS','6507',
 'RWS 209-equivalent shotshell primer from Germany. High quality for target shotshell loading.',
 ARRAY['12 Gauge','20 Gauge'],
 false),

-- ── LAPUA PRIMERS ─────────────────────────────────────────────────────────────
('Lapua Small Pistol',
 'Small Pistol','Lapua','4.53',
 'Finnish precision small pistol primer. Extremely consistent. Popular among top-level IPSC Open and Standard division competitors.',
 ARRAY['9mm Luger','.38 Special','9mm Major'],
 false),

('Lapua Large Pistol',
 'Large Pistol','Lapua','4.54',
 'Finnish precision large pistol primer. Exceptional consistency and ignition energy control.',
 ARRAY['.45 ACP','.44 Magnum','.44 Special'],
 false),

('Lapua Small Rifle',
 'Small Rifle','Lapua','4.47',
 'Finnish precision small rifle primer. Among the most consistent small rifle primers available. Top choice for 6mm BR and .223 Rem benchrest.',
 ARRAY['.223 Rem','6mm BR','6mm PPC','.222 Rem'],
 false),

('Lapua Large Rifle',
 'Large Rifle','Lapua','4.48',
 'Finnish precision large rifle primer. The gold standard for .308 Win F-Class and precision rifle competition. Extremely consistent lot-to-lot.',
 ARRAY['.308 Win','6.5 Creedmoor','.30-06','.243 Win','6.5x55 Swedish'],
 false),

('Lapua Large Rifle Magnum',
 'Large Magnum Rifle','Lapua','4.49',
 'Finnish precision magnum large rifle primer for large-capacity cases. Essential for .338 Lapua loading and other large magnums.',
 ARRAY['.338 Lapua','.300 Win Mag','7mm Rem Mag','.300 Norma Mag'],
 false),

-- ── FIOCCHI PRIMERS ───────────────────────────────────────────────────────────
('Fiocchi Small Pistol',
 'Small Pistol','Fiocchi','FP9',
 'Italian small pistol primer. Good quality at competitive pricing. Popular in Europe and increasingly in US commercial loads.',
 ARRAY['9mm Luger','.38 Special','.380 ACP'],
 false),

('Fiocchi Large Pistol',
 'Large Pistol','Fiocchi','FP45',
 'Fiocchi standard large pistol primer for .45 ACP and other large-bore pistol cartridges.',
 ARRAY['.45 ACP','.44 Special','.45 Colt'],
 false),

('Fiocchi Small Rifle',
 'Small Rifle','Fiocchi','FR223',
 'Fiocchi small rifle primer. European-made, consistent quality. Used in Fiocchi factory loaded ammunition.',
 ARRAY['.223 Rem','5.56 NATO','.222 Rem'],
 false),

('Fiocchi Large Rifle',
 'Large Rifle','Fiocchi','FR308',
 'Fiocchi large rifle primer for medium to large capacity rifle cartridges.',
 ARRAY['.308 Win','.30-06','.243 Win'],
 false),

-- ── SPECIALTY / GENERAL ───────────────────────────────────────────────────────
('CCI Magnum Shotshell 209',
 'Shotshell','CCI','209 Magnum',
 'High-energy 209 shotshell primer for heavy 3" and 3.5" magnum shotshell loads with steel shot or heavy bismuth/TSS payloads.',
 ARRAY['12 Gauge 3"','12 Gauge 3.5"','20 Gauge 3"'],
 false),

('CCI 300 Large Pistol',
 'Large Pistol','CCI','300',
 'CCI standard large pistol primer. Reliable ignition for .45 ACP, .44 Special, and other large-bore pistol cartridges.',
 ARRAY['.45 ACP','.44 Special','.45 Colt'],
 false),

('CCI 350 Large Pistol Magnum (distinct)',
 'Large Magnum Pistol','CCI','350',
 'CCI''s large pistol magnum primer specifically for .44 Magnum and .45 Colt +P loads with slow-burning powders.',
 ARRAY['.44 Magnum','.41 Magnum','.454 Casull','.460 S&W','.500 S&W'],
 false)

ON CONFLICT (name) DO NOTHING;
