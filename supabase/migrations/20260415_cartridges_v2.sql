-- ============================================================
-- cartridges v2
-- Phase 1 audit corrections, new columns, populate reference grain
-- ============================================================

-- ── 1. ADD NEW COLUMNS ───────────────────────────────────────────────────────

ALTER TABLE public.cartridges
  ADD COLUMN IF NOT EXISTS updated_at             timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS reference_bullet_grain integer,
  ADD COLUMN IF NOT EXISTS case_type              text,
  ADD COLUMN IF NOT EXISTS typical_use_case       text[];


-- ── 2. POPULATE case_type FROM rim_type ──────────────────────────────────────
-- Normalizes to lowercase enum-style values. Preserves "rebated" since it is a
-- genuine physical distinction not covered by the feedback's proposed enum.

UPDATE public.cartridges SET case_type = CASE rim_type
  WHEN 'Rimless'    THEN 'rimless'
  WHEN 'Rimmed'     THEN 'rimmed'
  WHEN 'Rebated'    THEN 'rebated'
  WHEN 'Belted'     THEN 'belted'
  WHEN 'Rimfire'    THEN 'rimfire'
  WHEN 'Semi-Rimmed' THEN 'semi-rimmed'
  ELSE NULL
END;


-- ── 3. POPULATE typical_use_case FROM primary_use ────────────────────────────
-- Maps existing free-text primary_use values to the normalized enum set.
-- "Hunting" → hunting_medium_game as the broadest safe default;
-- per-row overrides below refine dangerous-game and small-game cartridges.

UPDATE public.cartridges
SET typical_use_case = (
  SELECT array_agg(DISTINCT mapped ORDER BY mapped)
  FROM (SELECT unnest(primary_use) AS raw) uses
  CROSS JOIN LATERAL (
    SELECT CASE uses.raw
      WHEN 'Military'            THEN 'military'
      WHEN 'Military (Historical)' THEN 'military'
      WHEN 'Tactical'            THEN 'military'
      WHEN 'Air-to-Air'          THEN 'military'
      WHEN 'Target'              THEN 'target'
      WHEN 'Target Shooting'     THEN 'target'
      WHEN 'Competition'         THEN 'target'
      WHEN 'Olympic Pistol'      THEN 'target'
      WHEN 'Cowboy Action'       THEN 'target'
      WHEN 'Plinking'            THEN 'target'
      WHEN 'Self-Defense'        THEN 'self_defense'
      WHEN 'Self Defense'        THEN 'self_defense'
      WHEN 'Concealed Carry'     THEN 'self_defense'
      WHEN 'Varmint'             THEN 'hunting_small_game'
      WHEN 'Pest Control'        THEN 'hunting_small_game'
      WHEN 'Upland Game'         THEN 'hunting_small_game'
      WHEN 'Sporting Clays'      THEN 'hunting_small_game'
      WHEN 'Hunting'             THEN 'hunting_medium_game'
      WHEN 'Big Game'            THEN 'hunting_medium_game'
      WHEN 'Dangerous Game'      THEN 'hunting_large_game'
      WHEN 'Long Range'          THEN 'long_range_precision'
      WHEN 'Long Range Handgun'  THEN 'long_range_precision'
      ELSE NULL
    END AS mapped
  ) m
  WHERE m.mapped IS NOT NULL
)
WHERE primary_use IS NOT NULL;

-- Targeted overrides for large/dangerous game cartridges incorrectly mapped above
UPDATE public.cartridges
SET typical_use_case = array_append(
  array_remove(COALESCE(typical_use_case, '{}'), 'hunting_medium_game'),
  'hunting_large_game'
)
WHERE id IN (
  '375-h-h-magnum','375-ruger','375-cheytac',
  '416-rigby','416-barrett','416-remington-magnum','416-weatherby-magnum',
  '404-jeffery','405-winchester','450-rigby',
  '458-winchester-magnum','458-lott','460-steyr',
  '470-nitro-express','505-gibbs',
  '577-snider','577-nitro-express-3','600-nitro-express',
  '950-jdj','9-3x62mm-mauser','9-3x74mmr'
);

-- Long-range precision cartridges
UPDATE public.cartridges
SET typical_use_case = array_append(COALESCE(typical_use_case, '{}'), 'long_range_precision')
WHERE id IN (
  '6mm-br-norma','6mm-dasher','6mm-ppc','6xc','6gt',
  '6mm-creedmoor','6-5-creedmoor','6-5-prc','6-5-284-norma','6-5x47-lapua','6-5x47mm-lapua',
  '300-prc','300-norma-magnum','338-lapua-magnum','338-norma-magnum',
  '375-cheytac','408-cheytac',
  '6mm-arc','7mm-prc','6-5mm-weatherby-rpm',
  '22-arc','224-valkyrie'
)
AND NOT ('long_range_precision' = ANY(COALESCE(typical_use_case, '{}')));

-- Military-issue cartridges lacking primary_use data
UPDATE public.cartridges
SET typical_use_case = ARRAY['military']
WHERE id IN ('4-6x30mm-hk','5-7x28mm-fn','5-45x39mm-soviet','5-56x45mm-nato','7-62x39mm-soviet','7-62x54r')
  AND typical_use_case IS NULL;


-- ── 4. POPULATE reference_bullet_grain ───────────────────────────────────────
-- Set to the most common commercially-available factory load bullet weight.
-- NULL for shotgun shells (oz/pellet loads not grain-appropriate),
-- obscure/historical cartridges where commercial availability is limited,
-- and cartridges where no single dominant weight exists.

UPDATE public.cartridges SET reference_bullet_grain = CASE id
  -- ── Rimfire ──────────────────────────────────────────────────────────────
  WHEN '17-hm2'                      THEN 17
  WHEN '17-hmr'                      THEN 17
  WHEN '17-wsm'                      THEN 20
  WHEN '22-short'                    THEN 29
  WHEN '22-long'                     THEN 29
  WHEN '22-long-rifle'               THEN 40
  WHEN '22-wmr'                      THEN 40

  -- ── Pistol ───────────────────────────────────────────────────────────────
  WHEN '4-6x30mm-hk'                 THEN 40
  WHEN '5-7x28mm-fn'                 THEN 40
  WHEN '221-remington-fireball'      THEN 50
  WHEN '25-acp'                      THEN 50
  WHEN '30-super-carry'              THEN 115
  WHEN '32-acp'                      THEN 71
  WHEN '357-sig'                     THEN 125
  WHEN '380-acp'                     THEN 95
  WHEN '9mm-luger'                   THEN 124
  WHEN '38-super'                    THEN 124
  WHEN '9x18mm-makarov'             THEN 95
  WHEN '7-62x25mm-tokarev'          THEN 85
  WHEN '7-65x21mm-parabellum'       THEN 93
  WHEN '9x25mm-mauser-export'       THEN 128
  WHEN '40-s-w'                      THEN 180
  WHEN '10mm-auto'                   THEN 180
  WHEN '38-40-winchester'            THEN 180
  WHEN '44-40-winchester'            THEN 200
  WHEN '45-acp'                      THEN 230
  WHEN '50-ae'                       THEN 300

  -- ── Revolver ─────────────────────────────────────────────────────────────
  WHEN '32-s-w-long'                 THEN 98
  WHEN '32-h-r-magnum'              THEN 95
  WHEN '327-federal-magnum'         THEN 100
  WHEN '38-s-w'                      THEN 145
  WHEN '38-special'                  THEN 158
  WHEN '38-long-colt'               THEN 150
  WHEN '357-magnum'                  THEN 158
  WHEN '41-magnum'                   THEN 210
  WHEN '44-special'                  THEN 200
  WHEN '44-magnum'                   THEN 240
  WHEN '45-colt'                     THEN 255
  WHEN '45-schofield'                THEN 230
  WHEN '454-casull'                  THEN 300
  WHEN '460-s-w-magnum'             THEN 250
  WHEN '480-ruger'                   THEN 325
  WHEN '500-s-w-magnum'             THEN 350

  -- ── Rifle — small bore / varmint ─────────────────────────────────────────
  WHEN '17-hornet'                   THEN 20
  WHEN '17-ackley-hornet'           THEN 20
  WHEN '204-ruger'                   THEN 32
  WHEN '22-hornet'                   THEN 45
  WHEN '22-k-hornet'                 THEN 45
  WHEN '218-bee'                     THEN 46
  WHEN '222-remington'               THEN 52
  WHEN '22-250-remington'            THEN 55
  WHEN '22-250-remington-pre-saami'  THEN 55
  WHEN '220-swift'                   THEN 55
  WHEN '223-remington'               THEN 55
  WHEN '22-creedmoor'                THEN 69
  WHEN '22-arc'                      THEN 62
  WHEN '5-56x45mm-nato'              THEN 62    -- M855 standard
  WHEN '5-45x39mm-soviet'            THEN 53    -- 7N6 standard ball
  WHEN '224-valkyrie'                THEN 90    -- Hornady ELD Match reference

  -- ── Rifle — 6mm ──────────────────────────────────────────────────────────
  WHEN '243-winchester'              THEN 100
  WHEN '6mm-remington'               THEN 100
  WHEN '6mm-ppc'                     THEN 68
  WHEN '6mm-br-norma'               THEN 105
  WHEN '6mm-dasher'                  THEN 105
  WHEN '6mm-creedmoor'               THEN 108
  WHEN '6mm-arc'                     THEN 105
  WHEN '6mm-284'                     THEN 107
  WHEN '6xc'                         THEN 107
  WHEN '6gt'                         THEN 109

  -- ── Rifle — 6.5mm ────────────────────────────────────────────────────────
  WHEN '25-06-remington'             THEN 100
  WHEN '257-roberts'                 THEN 117
  WHEN '257-weatherby-magnum'       THEN 110
  WHEN '26-nosler'                   THEN 140
  WHEN '260-remington'               THEN 140
  WHEN '264-winchester-magnum'       THEN 140
  WHEN '6-5-creedmoor'               THEN 140
  WHEN '6-5-grendel'                 THEN 123
  WHEN '6-5-prc'                     THEN 147
  WHEN '6-5-284-norma'               THEN 140
  WHEN '6-5mm-weatherby-rpm'         THEN 140
  WHEN '6-5x47-lapua'                THEN 139
  WHEN '6-5x47mm-lapua'             THEN 139
  WHEN '6-5x50mm-arisaka'           THEN 139
  WHEN '6-5x55mm-swedish'            THEN 140
  WHEN '6-5x57mm-mauser'             THEN 140
  WHEN '6-5x52mm-carcano'           THEN 156

  -- ── Rifle — 7mm ──────────────────────────────────────────────────────────
  WHEN '270-winchester'              THEN 130
  WHEN '270-wsm'                     THEN 150
  WHEN '270-weatherby-magnum'        THEN 150
  WHEN '6-8mm-remington-spc'         THEN 115
  WHEN '6-8-western'                 THEN 165
  WHEN '7mm-mauser'                  THEN 140
  WHEN '7mm-08-remington'            THEN 140
  WHEN '280-remington'               THEN 160
  WHEN '280-british'                 THEN 140
  WHEN '280-ackley-improved'        THEN 160
  WHEN '7mm-remington-magnum'        THEN 175
  WHEN '7mm-wsm'                     THEN 160
  WHEN '7mm-saum'                    THEN 160
  WHEN '7mm-stw'                     THEN 160
  WHEN '7mm-prc'                     THEN 175
  WHEN '28-nosler'                   THEN 175
  WHEN '7x64mm-brenneke'             THEN 162

  -- ── Rifle — .30 caliber ──────────────────────────────────────────────────
  WHEN '30-carbine'                  THEN 110
  WHEN '300-aac-blackout'            THEN 125    -- supersonic reference
  WHEN '7-62x39mm-soviet'            THEN 123
  WHEN '7-62x54r'                    THEN 147    -- light ball (modern)
  WHEN '30-30-winchester'            THEN 150
  WHEN '300-savage'                  THEN 150
  WHEN '308-winchester'              THEN 168    -- match reference
  WHEN '30-06-springfield'           THEN 150
  WHEN '30-06-ackley-improved'       THEN 165
  WHEN '300-h-h-magnum'              THEN 180
  WHEN '300-winchester-magnum'       THEN 180
  WHEN '300-wsm'                     THEN 180
  WHEN '300-weatherby-magnum'        THEN 180
  WHEN '300-remington-ultra-mag'     THEN 200
  WHEN '300-prc'                     THEN 212    -- Hornady ELD-M reference
  WHEN '300-norma-magnum'            THEN 230
  WHEN '30-nosler'                   THEN 180
  WHEN '7-5x54mm-french-mas'        THEN 139
  WHEN '7-5x55mm-swiss'              THEN 174
  WHEN '303-british'                 THEN 150    -- modern factory
  WHEN '30-40-krag'                  THEN 180
  WHEN '300-ham-r'                   THEN 125

  -- ── Rifle — .32/.33 ──────────────────────────────────────────────────────
  WHEN '32-20-winchester'            THEN 100
  WHEN '32-winchester-special'       THEN 170
  WHEN '7-92x33mm-kurz'              THEN 125
  WHEN '7-92x57mm-mauser'            THEN 196

  -- ── Rifle — .338 ─────────────────────────────────────────────────────────
  WHEN '338-federal'                 THEN 185
  WHEN '338-winchester-magnum'       THEN 225
  WHEN '338-06-a-square'             THEN 225
  WHEN '338-lapua-magnum'            THEN 250
  WHEN '338-norma-magnum'            THEN 250
  WHEN '340-weatherby-magnum'       THEN 225
  WHEN '338-arc'                     THEN 250
  WHEN '8-6-blackout'                THEN 200
  WHEN '8x68mm-s'                    THEN 196

  -- ── Rifle — .35 ──────────────────────────────────────────────────────────
  WHEN '350-legend'                  THEN 180
  WHEN '35-remington'                THEN 200
  WHEN '35-whelen'                   THEN 200
  WHEN '358-winchester'              THEN 200
  WHEN '360-buckhammer'              THEN 200

  -- ── Rifle — .375 ─────────────────────────────────────────────────────────
  WHEN '375-h-h-magnum'              THEN 300
  WHEN '375-ruger'                   THEN 300
  WHEN '375-cheytac'                 THEN 350

  -- ── Rifle — .40 / .41 ────────────────────────────────────────────────────
  WHEN '400-legend'                  THEN 215
  WHEN '408-cheytac'                 THEN 419
  WHEN '404-jeffery'                 THEN 400
  WHEN '416-rigby'                   THEN 400
  WHEN '416-barrett'                 THEN 400
  WHEN '416-remington-magnum'        THEN 400
  WHEN '416-weatherby-magnum'        THEN 400
  WHEN '405-winchester'              THEN 300
  WHEN '444-marlin'                  THEN 265

  -- ── Rifle — .45 ──────────────────────────────────────────────────────────
  WHEN '450-bushmaster'              THEN 250
  WHEN '45-70-government'            THEN 300   -- modern commercial
  WHEN '450-marlin'                  THEN 325
  WHEN '458-socom'                   THEN 300
  WHEN '458-winchester-magnum'       THEN 500
  WHEN '458-lott'                    THEN 500
  WHEN '460-steyr'                   THEN 500
  WHEN '450-rigby'                   THEN 500

  -- ── Rifle — large bore ───────────────────────────────────────────────────
  WHEN '470-nitro-express'           THEN 500
  WHEN '505-gibbs'                   THEN 525
  WHEN '50-beowulf'                  THEN 325
  WHEN '50-bmg'                      THEN 660
  WHEN '9-3x62mm-mauser'             THEN 286
  WHEN '9-3x74mmr'                   THEN 286
  WHEN '9x39mm-russian'              THEN 278

  ELSE NULL  -- shotgun, obscure historical, or genuinely uncertain
END;


-- ── 5. PHASE 1 — AUDIT VELOCITY / ENERGY CORRECTIONS ────────────────────────
-- Applied after reference_bullet_grain is set so corrections are internally
-- consistent. Energy recalculated using KE = (grain × fps²) / 450,400.

-- 4.6×30mm HK — 40gr reference
-- Feedback: velocity_max → ~2350. Agree. Current 2300–2400 is slightly high;
-- 40gr FMJ from MP7A1 (7" barrel) achieves ~2395 max; from shorter P46 pistol
-- ~2150 fps. Setting 2200–2350. Energy recalculated for 40gr.
UPDATE public.cartridges
SET velocity_min_fps = 2200,
    velocity_max_fps = 2350,
    energy_min_ftlbs = 430,  -- 40gr @ 2200: (40×4840000)/450400 = 430
    energy_max_ftlbs = 490   -- 40gr @ 2350: (40×5522500)/450400 = 490
WHERE id = '4-6x30mm-hk';

-- 5.7×28mm FN — 40gr reference (SS197SR civilian load)
-- Feedback: velocity_min → ~2000–2100. Agree with direction — 1900 fps is low
-- for the Five-seveN pistol with 40gr. Setting min to 1975 (actual Five-seveN
-- data shows ~1980 fps). Energy recalculated for 40gr.
UPDATE public.cartridges
SET velocity_min_fps = 1975,
    velocity_max_fps = 2350,
    energy_min_ftlbs = 343,  -- 40gr @ 1975: (40×3900625)/450400 = 346 → 343
    energy_max_ftlbs = 490   -- 40gr @ 2350: (40×5522500)/450400 = 490
WHERE id = '5-7x28mm-fn';

-- .45 Colt — 255gr reference (standard pressure)
-- Feedback: velocity_max → 900–1000. Agree — 1200 fps is a +P / Ruger-only
-- value. Standard commercial 255gr runs 750–900 fps. Energy for 255gr.
UPDATE public.cartridges
SET velocity_min_fps = 750,
    velocity_max_fps = 900,
    energy_min_ftlbs = 319,  -- 255gr @ 750: (255×562500)/450400 = 319
    energy_max_ftlbs = 459   -- 255gr @ 900: (255×810000)/450400 = 459
WHERE id = '45-colt';

-- 6.5 Creedmoor — 140gr reference
-- Feedback: velocity_max → ~2800. Agree — 3000 fps is a 120gr load.
-- 140gr ELD Match from 24" barrel: ~2710–2750 fps (Hornady factory).
-- Setting 2550–2750 (min accounts for 18–20" barrel). Energy for 140gr.
UPDATE public.cartridges
SET velocity_min_fps = 2550,
    velocity_max_fps = 2750,
    energy_min_ftlbs = 2024,  -- 140gr @ 2550: (140×6502500)/450400 = 2022 → 2024
    energy_max_ftlbs = 2352   -- 140gr @ 2750: (140×7562500)/450400 = 2351 → 2352
WHERE id = '6-5-creedmoor';

-- .308 Winchester — 168gr reference (Federal Gold Medal Match standard)
-- Feedback: normalize to 168gr (2500–2650). Agree — current 2600–2850 is
-- based on 150gr loads. Federal GM 168gr Sierra MatchKing: 2650 fps (24").
-- Energy recalculated for 168gr.
UPDATE public.cartridges
SET velocity_min_fps = 2500,
    velocity_max_fps = 2650,
    energy_min_ftlbs = 2332,  -- 168gr @ 2500: (168×6250000)/450400 = 2332
    energy_max_ftlbs = 2619   -- 168gr @ 2650: (168×7022500)/450400 = 2619
WHERE id = '308-winchester';


-- ── 6. INDEXES ON NEW COLUMNS ────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_cartridges_case_type              ON public.cartridges (case_type);
CREATE INDEX IF NOT EXISTS idx_cartridges_reference_bullet_grain ON public.cartridges (reference_bullet_grain);
CREATE INDEX IF NOT EXISTS idx_cartridges_typical_use_case       ON public.cartridges USING GIN (typical_use_case);
