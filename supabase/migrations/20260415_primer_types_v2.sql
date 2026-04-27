-- ============================================================
-- primer_types v2
-- Corrections, category normalization, new columns, new rows
-- ============================================================

-- ── 1. DUPLICATE REMOVAL ─────────────────────────────────────────────────────

-- Merge .460 S&W and .500 S&W into the original CCI 350 before deleting duplicate
UPDATE public.primer_types
SET common_calibers = array_append(common_calibers, '.460 S&W')
WHERE id = '49ad7990-552a-458a-b6b8-6ebde3719ab8'
  AND NOT ('.460 S&W' = ANY(common_calibers));

UPDATE public.primer_types
SET common_calibers = array_append(common_calibers, '.500 S&W')
WHERE id = '49ad7990-552a-458a-b6b8-6ebde3719ab8'
  AND NOT ('.500 S&W' = ANY(common_calibers));

-- Delete the "(distinct)" duplicate row
DELETE FROM public.primer_types WHERE id = 'e0efd03e-7253-4279-b6d8-0c032f276bb1';


-- ── 2. DESCRIPTION CORRECTIONS ───────────────────────────────────────────────

-- Federal 150: .44 Magnum → .44 Special in description
UPDATE public.primer_types
SET description = 'Standard large pistol primer. Reliable ignition for .45 ACP, .44 Special, and other large-bore pistol cartridges.'
WHERE id = 'fc879e50-312f-4f9f-a823-535fe511a9aa';

-- Remington 7.5: remove erroneous "(formerly known as 6.5 BR)" from description
UPDATE public.primer_types
SET description = replace(description, ' (formerly known as 6.5 BR)', '')
WHERE brand = 'Remington' AND part_number = '7.5';


-- ── 3. CALIBER CORRECTIONS ───────────────────────────────────────────────────

-- Remove .357 SIG from Small Pistol Magnum primers
-- (.357 SIG uses standard SPP per all major reloading manuals)
UPDATE public.primer_types
SET common_calibers = array_remove(common_calibers, '.357 SIG')
WHERE '.357 SIG' = ANY(common_calibers)
  AND category IN ('Small Magnum Pistol', 'Small Pistol Magnum');

-- Fix "30-06" (missing period) → ".30-06 Springfield" in Federal 210 and 210M
UPDATE public.primer_types
SET common_calibers = array_replace(common_calibers, '30-06', '.30-06 Springfield')
WHERE brand = 'Federal' AND part_number IN ('210', '210M')
  AND '30-06' = ANY(common_calibers);


-- ── 4. CATEGORY NORMALIZATION ────────────────────────────────────────────────
-- Standardize to noun-first ordering: "Large Magnum Rifle" → "Large Rifle Magnum"
-- This runs before any match/military-specific updates so all affected rows are
-- in a clean state when we apply targeted fixes below.

UPDATE public.primer_types SET category = 'Large Rifle Magnum'       WHERE category = 'Large Magnum Rifle';
UPDATE public.primer_types SET category = 'Small Rifle Magnum'       WHERE category = 'Small Magnum Rifle';
UPDATE public.primer_types SET category = 'Large Pistol Magnum'      WHERE category = 'Large Magnum Pistol';
UPDATE public.primer_types SET category = 'Small Pistol Magnum'      WHERE category = 'Small Magnum Pistol';

-- CCI 41 / 34: update category to include Military designation
-- (name field already says "Military"; category was just "Small/Large Rifle")
UPDATE public.primer_types SET category = 'Small Rifle Military' WHERE brand = 'CCI' AND part_number = '41';
UPDATE public.primer_types SET category = 'Large Rifle Military' WHERE brand = 'CCI' AND part_number = '34';

-- Benchrest primers → Match category
UPDATE public.primer_types
  SET category = 'Small Rifle Match',
      name = 'CCI BR4 Small Rifle Benchrest'   -- preserve Benchrest in name
  WHERE brand = 'CCI' AND part_number = 'BR4';

UPDATE public.primer_types
  SET category = 'Large Rifle Match',
      name = 'CCI BR2 Large Rifle Benchrest'
  WHERE brand = 'CCI' AND part_number = 'BR2';

-- Federal match primers
UPDATE public.primer_types SET category = 'Small Pistol Match'          WHERE brand = 'Federal' AND part_number = '100M';
UPDATE public.primer_types SET category = 'Small Rifle Match'           WHERE brand = 'Federal' AND part_number = '205M';
UPDATE public.primer_types SET category = 'Large Rifle Match'           WHERE brand = 'Federal' AND part_number = '210M';
UPDATE public.primer_types SET category = 'Large Rifle Magnum Match'    WHERE brand = 'Federal' AND part_number = '215M';

-- Remington 7.5 — benchrest/match grade (doc3 calls it "Small Rifle Benchrest")
UPDATE public.primer_types
  SET category = 'Small Rifle Match',
      name = 'Remington 7.5 Small Rifle Benchrest'
  WHERE brand = 'Remington' AND part_number = '7.5';


-- ── 5. ADD NEW COLUMNS ───────────────────────────────────────────────────────

ALTER TABLE public.primer_types
  ADD COLUMN IF NOT EXISTS primer_size       text,           -- Small | Large
  ADD COLUMN IF NOT EXISTS primer_application text,          -- Pistol | Rifle (NULL for Shotshell/Muzzleloader)
  ADD COLUMN IF NOT EXISTS performance_tier  text,           -- Standard | Match | Military
  ADD COLUMN IF NOT EXISTS cup_hardness      text,           -- standard | match | military
  ADD COLUMN IF NOT EXISTS primer_diameter_in numeric(5,3),  -- SAAMI cup diameter in inches
  ADD COLUMN IF NOT EXISTS is_match_grade    boolean NOT NULL DEFAULT false;


-- ── 6. POPULATE NEW COLUMNS ──────────────────────────────────────────────────

-- primer_size: derive from category
UPDATE public.primer_types SET primer_size = CASE
  WHEN category LIKE 'Small%' THEN 'Small'
  WHEN category LIKE 'Large%' THEN 'Large'
  ELSE NULL
END;

-- primer_application: derive from category (Shotshell / Muzzleloader → NULL)
UPDATE public.primer_types SET primer_application = CASE
  WHEN category LIKE '%Pistol%' THEN 'Pistol'
  WHEN category LIKE '%Rifle%'  THEN 'Rifle'
  ELSE NULL
END;

-- performance_tier
UPDATE public.primer_types SET performance_tier = CASE
  WHEN category LIKE '%Military%' OR military_spec = true THEN 'Military'
  WHEN category LIKE '%Match%' OR category LIKE '%Benchrest%' THEN 'Match'
  ELSE 'Standard'
END;

-- cup_hardness: military > Lapua/match > standard
UPDATE public.primer_types SET cup_hardness = CASE
  WHEN performance_tier = 'Military' OR military_spec = true THEN 'military'
  WHEN performance_tier = 'Match' OR brand = 'Lapua' THEN 'match'
  ELSE 'standard'
END;

-- primer_diameter_in (SAAMI spec: Small = 0.175", Large = 0.210", 209 = 0.243")
UPDATE public.primer_types SET primer_diameter_in = CASE
  WHEN primer_size = 'Small' THEN 0.175
  WHEN primer_size = 'Large' THEN 0.210
  WHEN category IN ('Shotshell', 'Muzzleloader') THEN 0.243
  ELSE NULL
END;

-- is_match_grade: explicit match-grade primer flag
UPDATE public.primer_types SET is_match_grade = true
WHERE performance_tier = 'Match'
   OR brand = 'Lapua';


-- ── 7. NEW ROWS ──────────────────────────────────────────────────────────────

-- Federal 205MAR — Small Rifle Military / AR match
INSERT INTO public.primer_types
  (brand, part_number, name, category, description, common_calibers,
   military_spec, is_match_grade, primer_size, primer_application,
   performance_tier, cup_hardness, primer_diameter_in)
SELECT
  'Federal', '205MAR',
  'Federal 205MAR Small Rifle Match AR',
  'Small Rifle Military',
  'Match-grade small rifle primer engineered for semi-automatic AR-platform rifles. Hard military-spec cup prevents slam fires with floating firing pins. Tighter brisance tolerances than the standard 205M. Specified by name in several AR competition load recipes.',
  ARRAY['5.56 NATO', '.223 Rem', '.300 Blackout', '6.5 Grendel'],
  true, true, 'Small', 'Rifle', 'Military', 'military', 0.175
WHERE NOT EXISTS (SELECT 1 FROM public.primer_types WHERE brand='Federal' AND part_number='205MAR');

-- Cheddite CX2000 Shotshell 209
INSERT INTO public.primer_types
  (brand, part_number, name, category, description, common_calibers,
   military_spec, is_match_grade, performance_tier, cup_hardness, primer_diameter_in)
SELECT
  'Cheddite', 'CX2000',
  'Cheddite CX2000 Shotshell',
  'Shotshell',
  'French 209-equivalent shotshell primer. Appears by name in Alliant, Hodgdon, and Vihtavuori published shotshell recipes. Common in European-sourced hulls. Standard choice for reloaders using Cheddite or Fiocchi hulls.',
  ARRAY['12 Gauge', '20 Gauge', '28 Gauge'],
  false, false, 'Standard', 'standard', 0.243
WHERE NOT EXISTS (SELECT 1 FROM public.primer_types WHERE brand='Cheddite' AND part_number='CX2000');

-- Wolf Small Pistol (Russian Murom factory, sold under Wolf branding)
INSERT INTO public.primer_types
  (brand, part_number, name, category, description, common_calibers,
   military_spec, is_match_grade, primer_size, primer_application,
   performance_tier, cup_hardness, primer_diameter_in)
SELECT
  'Wolf', 'WPP',
  'Wolf Small Pistol',
  'Small Pistol',
  'Russian-made (Murom factory) small pistol primers sold under Wolf branding. Among the most widely purchased budget small pistol primers in the US market. Standard choice for high-volume 9mm competition and practice loading.',
  ARRAY['9mm Luger', '.38 Special', '.380 ACP', '.32 ACP'],
  false, false, 'Small', 'Pistol', 'Standard', 'standard', 0.175
WHERE NOT EXISTS (SELECT 1 FROM public.primer_types WHERE brand='Wolf' AND part_number='WPP');

-- CCI 209 Muzzleloader inline primer
-- (distinct product from CCI 209M Shotshell Magnum — lower brisance, muzzleloader-specific compound)
INSERT INTO public.primer_types
  (brand, part_number, name, category, description, common_calibers,
   military_spec, is_match_grade, performance_tier, cup_hardness, primer_diameter_in)
SELECT
  'CCI', '209ML',
  'CCI 209 In-Line Muzzleloader',
  'Muzzleloader',
  'CCI 209-format primer engineered specifically for inline muzzleloaders. Uses a distinct compound with lower brisance than the 209M shotshell magnum to prevent blowback and excess fouling in inline ignition systems. The standard for 209-style inline muzzleloaders.',
  ARRAY['.50 cal inline muzzleloader', '.45 cal inline muzzleloader'],
  false, false, 'Standard', 'standard', 0.243
WHERE NOT EXISTS (SELECT 1 FROM public.primer_types WHERE brand='CCI' AND part_number='209ML');

-- Federal 209 In-Line Muzzleloader
INSERT INTO public.primer_types
  (brand, part_number, name, category, description, common_calibers,
   military_spec, is_match_grade, performance_tier, cup_hardness, primer_diameter_in)
SELECT
  'Federal', '209 In-Line',
  'Federal 209 In-Line Muzzleloader',
  'Muzzleloader',
  'Federal 209-format primer designed for inline muzzleloaders. Lower brisance than the standard 209A shotshell primer. Distinct product optimized for the ignition requirements of modern inline ignition systems.',
  ARRAY['.50 cal inline muzzleloader', '.45 cal inline muzzleloader'],
  false, false, 'Standard', 'standard', 0.243
WHERE NOT EXISTS (SELECT 1 FROM public.primer_types WHERE brand='Federal' AND part_number='209 In-Line');

-- Sellier & Bellot — four primers (Czech-manufactured, meaningful US availability)
INSERT INTO public.primer_types
  (brand, part_number, name, category, description, common_calibers,
   military_spec, is_match_grade, primer_size, primer_application,
   performance_tier, cup_hardness, primer_diameter_in)
SELECT brand, part_number, name, category, description, common_calibers,
       false, false, primer_size, primer_application, 'Standard', 'standard', diam
FROM (VALUES
  ('Sellier & Bellot', 'SP', 'Sellier & Bellot Small Pistol', 'Small Pistol',
   'Czech-manufactured small pistol primer. Meaningful US commercial availability; compatible with standard small pistol primer pocket brass.',
   ARRAY['9mm Luger', '.38 Special', '.380 ACP'], 'Small', 'Pistol', 0.175),
  ('Sellier & Bellot', 'LP', 'Sellier & Bellot Large Pistol', 'Large Pistol',
   'Czech-manufactured large pistol primer. Compatible with standard large pistol primer pocket brass.',
   ARRAY['.45 ACP', '.44 Special', '.45 Colt'], 'Large', 'Pistol', 0.210),
  ('Sellier & Bellot', 'SR', 'Sellier & Bellot Small Rifle', 'Small Rifle',
   'Czech-manufactured small rifle primer. Standard cup; suitable for bolt-action rifle applications.',
   ARRAY['.223 Rem', '5.56 NATO', '.222 Rem'], 'Small', 'Rifle', 0.175),
  ('Sellier & Bellot', 'LR', 'Sellier & Bellot Large Rifle', 'Large Rifle',
   'Czech-manufactured large rifle primer. Standard cup; suitable for bolt-action rifle applications.',
   ARRAY['.308 Winchester', '.30-06 Springfield', '.243 Winchester'], 'Large', 'Rifle', 0.210)
) AS t(brand, part_number, name, category, description, common_calibers, primer_size, primer_application, diam)
WHERE NOT EXISTS (
  SELECT 1 FROM public.primer_types p WHERE p.brand = t.brand AND p.part_number = t.part_number
);

-- Ginex — four primers (Bosnian-made, NATO production standards, popular during US shortage)
INSERT INTO public.primer_types
  (brand, part_number, name, category, description, common_calibers,
   military_spec, is_match_grade, primer_size, primer_application,
   performance_tier, cup_hardness, primer_diameter_in)
SELECT brand, part_number, name, category, description, common_calibers,
       false, false, primer_size, primer_application, 'Standard', 'standard', diam
FROM (VALUES
  ('Ginex', 'SP', 'Ginex Small Pistol', 'Small Pistol',
   'Bosnian-manufactured small pistol primer (Pretis factory). NATO-quality production standards. Gained US market presence during primer shortages.',
   ARRAY['9mm Luger', '.38 Special', '.380 ACP'], 'Small', 'Pistol', 0.175),
  ('Ginex', 'LP', 'Ginex Large Pistol', 'Large Pistol',
   'Bosnian-manufactured large pistol primer. NATO-quality production standards.',
   ARRAY['.45 ACP', '.44 Special', '.45 Colt'], 'Large', 'Pistol', 0.210),
  ('Ginex', 'SR', 'Ginex Small Rifle', 'Small Rifle',
   'Bosnian-manufactured small rifle primer. NATO-quality production standards.',
   ARRAY['.223 Rem', '5.56 NATO', '.308 Win'], 'Small', 'Rifle', 0.175),
  ('Ginex', 'LR', 'Ginex Large Rifle', 'Large Rifle',
   'Bosnian-manufactured large rifle primer. NATO-quality production standards.',
   ARRAY['.308 Winchester', '.30-06 Springfield', '7.62 NATO'], 'Large', 'Rifle', 0.210)
) AS t(brand, part_number, name, category, description, common_calibers, primer_size, primer_application, diam)
WHERE NOT EXISTS (
  SELECT 1 FROM public.primer_types p WHERE p.brand = t.brand AND p.part_number = t.part_number
);


-- ── 8. INDEXES ON NEW COLUMNS ────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_primer_types_primer_size        ON public.primer_types (primer_size);
CREATE INDEX IF NOT EXISTS idx_primer_types_primer_application ON public.primer_types (primer_application);
CREATE INDEX IF NOT EXISTS idx_primer_types_performance_tier   ON public.primer_types (performance_tier);
CREATE INDEX IF NOT EXISTS idx_primer_types_cup_hardness       ON public.primer_types (cup_hardness);
CREATE INDEX IF NOT EXISTS idx_primer_types_is_match_grade     ON public.primer_types (is_match_grade);
