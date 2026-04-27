-- Reloading Source Caliber Map — Schema + Source Seed
-- Created: 2026-04-27

-- ── reloading_sources ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reloading_sources (
  id                text PRIMARY KEY,
  name              text NOT NULL,
  source_type       text NOT NULL CHECK (source_type IN ('powder_manufacturer','bullet_manufacturer','community','standards_body','retailer')),
  url_base          text,
  url_template      text,   -- {caliber_slug} placeholder for deep links
  requires_account  boolean NOT NULL DEFAULT false,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reloading_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read reloading_sources" ON public.reloading_sources FOR SELECT USING (true);

-- ── reloading_source_caliber_map ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reloading_source_caliber_map (
  source_id         text NOT NULL REFERENCES public.reloading_sources(id),
  cartridge_name    text NOT NULL,
  caliber_slug      text,           -- slug used in source URL; NULL = no per-cartridge deep link
  url_override      text,           -- full URL override when template doesn't apply
  coverage_quality  text NOT NULL CHECK (coverage_quality IN ('full','partial','limited','community_only')),
  notes             text,
  verified_at       date NOT NULL,
  PRIMARY KEY (source_id, cartridge_name)
);

ALTER TABLE public.reloading_source_caliber_map ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read reloading_source_caliber_map" ON public.reloading_source_caliber_map FOR SELECT USING (true);

-- ── Seed: reloading_sources ──────────────────────────────────────────────────
INSERT INTO public.reloading_sources (id, name, source_type, url_base, url_template, requires_account, notes)
VALUES
  -- Powder manufacturers
  ('hodgdon',          'Hodgdon Reloading Data Center',      'powder_manufacturer', 'https://hodgdonreloading.com/rldc/',                          NULL,                                                              false, 'Migrated from hodgdon.com/load-data/ to hodgdonreloading.com; JS search form, no per-cartridge deep links as of 2026'),
  ('alliant',          'Alliant Powder',                     'powder_manufacturer', 'https://www.alliantpowder.com/reloaders/',                    NULL,                                                              false, NULL),
  ('vihtavuori',       'Vihtavuori',                         'powder_manufacturer', 'https://www.vihtavuori.com/reloading-data/rifle-reloading/',  'https://www.vihtavuori.com/reloading-data/rifle-reloading/?reload={caliber_slug}', false, 'Site blocks bots (403); URL param is numeric cartridge ID not text slug'),
  ('accurate',         'Accurate Powder',                    'powder_manufacturer', 'https://www.accuratepowder.com/data/',                        NULL,                                                              false, NULL),
  ('ramshot',          'Ramshot Powder',                     'powder_manufacturer', 'https://www.ramshot.com/data/',                               NULL,                                                              false, 'Shares parent company with Accurate'),
  ('shooters_world',   'Shooter''s World Powder',            'powder_manufacturer', 'https://www.shootersworldpowder.com/reloading-data/',         NULL,                                                              false, NULL),
  ('norma_powder',     'Norma Powder',                       'powder_manufacturer', 'https://www.norma.cc/en/reloading/',                          NULL,                                                              false, NULL),
  ('reload_swiss',     'Reload Swiss',                       'powder_manufacturer', 'https://www.reload-swiss.com/en/data/',                       NULL,                                                              false, NULL),
  ('adi',              'ADI Powder (Australia)',              'powder_manufacturer', 'https://www.adiworldclass.com/reloading-data/',               NULL,                                                              false, 'Australian powder; sold as Benchmark/Varget equivalents in US'),
  ('nobel_sport',      'Nobel Sport',                        'powder_manufacturer', 'https://www.nobelsport.com/',                                 NULL,                                                              false, NULL),

  -- Bullet manufacturers
  ('berger',           'Berger Bullets',                     'bullet_manufacturer', 'https://bergerbullets.com/reloading-data/',                   NULL,                                                              false, 'Search-based index; no per-cartridge URL slugs as of 2026'),
  ('nosler',           'Nosler',                             'bullet_manufacturer', 'https://www.nosler.com/',                                     'https://www.nosler.com/{caliber_slug}',                           false, 'Actual URL format is nosler.com/{slug}, not /reloading-data/{slug}/'),
  ('sierra',           'Sierra Bullets',                     'bullet_manufacturer', 'https://www.sierrabullets.com/load-data/',                    NULL,                                                              false, 'Load data is PDF-only; no individual cartridge web pages'),
  ('barnes',           'Barnes Bullets',                     'bullet_manufacturer', 'https://www.barnesbullets.com/reloading-data/',               NULL,                                                              false, NULL),
  ('hornady',          'Hornady',                            'bullet_manufacturer', 'https://www.hornady.com/support/load-data/',                  NULL,                                                              false, 'Actual path is /support/load-data/; site blocks bots'),
  ('speer',            'Speer Bullets',                      'bullet_manufacturer', 'https://www.speer-ammo.com/reloading/',                       NULL,                                                              false, NULL),
  ('lapua',            'Lapua',                              'bullet_manufacturer', 'https://www.lapua.com/en/reloading/',                         'https://www.lapua.com/en/reloading/{caliber_slug}.html',          false, 'URL format unconfirmed; likely has slugs for Lapua-proprietary cartridges'),
  ('swift',            'Swift Bullet',                       'bullet_manufacturer', 'https://www.swiftbullet.com/reloading-data/',                 NULL,                                                              false, NULL),
  ('woodleigh',        'Woodleigh Bullets',                  'bullet_manufacturer', 'https://www.woodleighbullets.com.au/',                        NULL,                                                              false, 'Australian dangerous game bullet manufacturer'),
  ('hammer',           'Hammer Bullets',                     'bullet_manufacturer', 'https://www.hammerbullets.com/reloading-data/',               NULL,                                                              false, NULL),
  ('cutting_edge',     'Cutting Edge Bullets',               'bullet_manufacturer', 'https://www.cuttingedgebullets.com/reloading/',               NULL,                                                              false, NULL),
  ('lehigh',           'Lehigh Defense',                     'bullet_manufacturer', 'https://www.lehighdefense.com/pages/reloading-data',          NULL,                                                              false, NULL),
  ('peregrine',        'Peregrine Bullets',                  'bullet_manufacturer', 'https://www.peregrinebullets.co.za/',                         NULL,                                                              false, 'South African dangerous game bullet manufacturer'),
  ('gscustom',         'GS Custom Bullets',                  'bullet_manufacturer', 'https://www.gscustom.co.za/',                                 NULL,                                                              false, 'South African solid copper bullet manufacturer'),
  ('north_fork',       'North Fork Bullets',                 'bullet_manufacturer', 'https://www.northforkbullets.com/',                           NULL,                                                              false, NULL),

  -- Community / reference
  ('6mmbr',            '6mmBR.com',                          'community',           'https://www.6mmbr.com/',                                      'https://www.6mmbr.com/{caliber_slug}.htm',                        false, 'Benchrest and precision rifle community reference; extensive cartridge data'),
  ('reloadersnest',    'Reloaders Nest',                     'community',           'https://www.reloadersnest.com/',                              'https://www.reloadersnest.com/{caliber_slug}/',                   false, 'Site appeared offline (ECONNREFUSED) as of Apr 2026'),
  ('handloads_com',    'Handloads.com',                      'community',           'https://www.handloads.com/',                                  'https://www.handloads.com/loaddata/default.asp?Cartridge={caliber_slug}', false, 'Returns 403 on all bot requests as of Apr 2026'),
  ('cast_boolits',     'Cast Boolits Forum',                 'community',           'https://castboolits.gunloads.com/',                           NULL,                                                              false, 'Cast bullet community forum; community_only coverage'),
  ('benchrest_central','Benchrest Central',                  'community',           'https://www.benchrest.com/',                                  NULL,                                                              false, 'Benchrest competition community; precision rifle focus'),
  ('accurate_reloading_forum', 'Accurate Reloading Forum',   'community',           'https://www.accuratereloading.com/',                          NULL,                                                              false, 'Dangerous game and large caliber community forum'),
  ('buffalo_arms',     'Buffalo Arms',                       'retailer',            'https://www.buffaloarms.com/',                                NULL,                                                              false, 'Cowboy action / obsolete cartridge retailer and load data source'),

  -- Standards bodies
  ('saami',            'SAAMI',                              'standards_body',      'https://saami.org/specifications-and-information/',           NULL,                                                              false, 'Sporting Arms and Ammunition Manufacturers Institute; pressure and dimensional standards'),
  ('sass',             'SASS',                               'standards_body',      'https://www.sassnet.com/',                                    NULL,                                                              false, 'Single Action Shooting Society; cowboy action cartridge standards'),

  -- Specialty
  ('elr_central',      'ELR Central',                        'community',           'https://elrcentral.com/',                                     NULL,                                                              false, 'Extreme Long Range shooting community'),
  ('precision_rifle_blog', 'Precision Rifle Blog',           'community',           'https://precisionrifleblog.com/',                             NULL,                                                              false, 'Bryan Litz / PRS community data and analysis')

ON CONFLICT (id) DO NOTHING;
