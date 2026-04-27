-- Caliber Map Seed: Group 1 (Common Rifle) — .223 Rem, 5.56 NATO, 6.5 Creedmoor, .308 Win,
--   .300 Win Mag, .30-06 Springfield, .243 Win, 6mm Creedmoor, 6.5 PRC, .300 Blackout
-- Generated: 2026-04-27
-- Verification notes:
--   nosler:       Slugs confirmed via search-indexed URLs (nosler.com/{slug})
--   hodgdon:      Migrated to hodgdonreloading.com; JS search form only, no per-cartridge deep links
--   vihtavuori:   Bot-blocked (403); coverage confirmed via update articles, slugs unverifiable
--   hornady:      Actual path is /support/load-data/ (template /reloading/data# is incorrect)
--   sierra:       PDF-only data; no individual cartridge web pages
--   berger:       Search-based index; no per-cartridge URL slugs confirmed
--   lapua:        URL format /en/reloading/{slug}.html not confirmed; excluded this run
--   reloadersnest: ECONNREFUSED — site appears offline; excluded
--   handloads_com: 403 on every attempt; excluded

INSERT INTO public.reloading_source_caliber_map
  (source_id, cartridge_name, caliber_slug, url_override, coverage_quality, notes, verified_at)
VALUES

  -- ── NOSLER (slugs verified via search-indexed URLs) ─────────────────────────
  ('nosler', '.223 Rem',           '223-remington',         'https://www.nosler.com/223-remington',          'full',    'URL format nosler.com/{slug}; multiple powders & bullet weights', '2026-04-27'),
  ('nosler', '5.56 NATO',          '556-45-nato',           'https://www.nosler.com/556-45-nato',            'partial', 'Page marked Archived by Nosler; data present but may not be updated', '2026-04-27'),
  ('nosler', '6.5 Creedmoor',      '65-creedmoor',          'https://www.nosler.com/65-creedmoor',           'full',    'URL format nosler.com/{slug}; active and regularly updated', '2026-04-27'),
  ('nosler', '.308 Win',           '308-winchester',        'https://www.nosler.com/308-winchester',         'full',    'URL format nosler.com/{slug}; comprehensive coverage', '2026-04-27'),
  ('nosler', '.300 Win Mag',       '300-winchester-magnum', 'https://www.nosler.com/300-winchester-magnum',  'full',    'URL format nosler.com/{slug}; comprehensive coverage', '2026-04-27'),
  ('nosler', '.30-06 Springfield', '30-06-springfield',     'https://www.nosler.com/30-06-springfield',      'full',    'URL format nosler.com/{slug}; comprehensive coverage', '2026-04-27'),
  ('nosler', '.243 Win',           '243-winchester',        'https://www.nosler.com/243-winchester',         'full',    'URL format nosler.com/{slug}; comprehensive coverage', '2026-04-27'),
  ('nosler', '6mm Creedmoor',      '6mm-creedmoor',         'https://www.nosler.com/6mm-creedmoor',          'full',    'URL format nosler.com/{slug}; active page', '2026-04-27'),
  ('nosler', '6.5 PRC',            '6-5-prc',               'https://www.nosler.com/6-5-prc',                'full',    'URL format nosler.com/{slug}; active page', '2026-04-27'),
  ('nosler', '.300 Blackout',      '300-aac-blackout',      'https://www.nosler.com/300-aac-blackout',       'full',    'URL format nosler.com/{slug}; includes supersonic and subsonic loads', '2026-04-27'),

  -- ── HODGDON (migrated to hodgdonreloading.com; no per-cartridge deep links) ─
  ('hodgdon', '.223 Rem',           NULL, 'https://hodgdonreloading.com/rldc/', 'full', 'RDC moved to hodgdonreloading.com; JS search form only; original hodgdon.com/load-data/ deprecated', '2026-04-27'),
  ('hodgdon', '5.56 NATO',          NULL, 'https://hodgdonreloading.com/rldc/', 'full', 'RDC moved; search form covers 5.56 NATO explicitly', '2026-04-27'),
  ('hodgdon', '6.5 Creedmoor',      NULL, 'https://hodgdonreloading.com/rldc/', 'full', 'RDC moved; comprehensive multi-powder coverage', '2026-04-27'),
  ('hodgdon', '.308 Win',           NULL, 'https://hodgdonreloading.com/rldc/', 'full', 'RDC moved; comprehensive multi-powder coverage', '2026-04-27'),
  ('hodgdon', '.300 Win Mag',       NULL, 'https://hodgdonreloading.com/rldc/', 'full', 'RDC moved; comprehensive multi-powder coverage', '2026-04-27'),
  ('hodgdon', '.30-06 Springfield', NULL, 'https://hodgdonreloading.com/rldc/', 'full', 'RDC moved; comprehensive multi-powder coverage', '2026-04-27'),
  ('hodgdon', '.243 Win',           NULL, 'https://hodgdonreloading.com/rldc/', 'full', 'RDC moved; comprehensive multi-powder coverage', '2026-04-27'),
  ('hodgdon', '6mm Creedmoor',      NULL, 'https://hodgdonreloading.com/rldc/', 'full', 'RDC moved; comprehensive multi-powder coverage', '2026-04-27'),
  ('hodgdon', '6.5 PRC',            NULL, 'https://hodgdonreloading.com/rldc/', 'full', 'RDC moved; 6.5 PRC confirmed in search form', '2026-04-27'),
  ('hodgdon', '.300 Blackout',      NULL, 'https://hodgdonreloading.com/rldc/', 'full', 'RDC moved; .300 BLK including subsonic loads covered', '2026-04-27'),

  -- ── VIHTAVUORI (bot-blocked; coverage confirmed via update articles) ─────────
  ('vihtavuori', '.223 Rem',           NULL, 'https://www.vihtavuori.com/reloading-data/rifle-reloading/', 'full',    'Coverage confirmed via VV update articles; ?reload= param unverified (site blocks bots)', '2026-04-27'),
  ('vihtavuori', '5.56 NATO',          NULL, 'https://www.vihtavuori.com/reloading-data/rifle-reloading/', 'partial', 'VV may list under .223 Rem rather than 5.56 NATO; verify on-site', '2026-04-27'),
  ('vihtavuori', '6.5 Creedmoor',      NULL, 'https://www.vihtavuori.com/reloading-data/rifle-reloading/', 'full',    'Frequently updated; confirmed Apr 2022 and multiple later updates', '2026-04-27'),
  ('vihtavuori', '.308 Win',           NULL, 'https://www.vihtavuori.com/reloading-data/rifle-reloading/', 'full',    'Confirmed Apr 2022 and Jun 2023 updates; comprehensive N-series powder coverage', '2026-04-27'),
  ('vihtavuori', '.300 Win Mag',       NULL, 'https://www.vihtavuori.com/reloading-data/rifle-reloading/', 'full',    'Confirmed in Apr 2022 update', '2026-04-27'),
  ('vihtavuori', '.30-06 Springfield', NULL, 'https://www.vihtavuori.com/reloading-data/rifle-reloading/', 'full',    'Confirmed in Apr 2022 and Jun 2022 updates', '2026-04-27'),
  ('vihtavuori', '.243 Win',           NULL, 'https://www.vihtavuori.com/reloading-data/rifle-reloading/', 'full',    'Confirmed in Jun 2022 update', '2026-04-27'),
  ('vihtavuori', '6mm Creedmoor',      NULL, 'https://www.vihtavuori.com/reloading-data/rifle-reloading/', 'full',    'Confirmed in Jun 2022 update', '2026-04-27'),
  ('vihtavuori', '6.5 PRC',            NULL, 'https://www.vihtavuori.com/reloading-data/rifle-reloading/', 'full',    'Confirmed in Apr 2022 update; actively updated', '2026-04-27'),
  ('vihtavuori', '.300 Blackout',      NULL, 'https://www.vihtavuori.com/reloading-data/rifle-reloading/', 'partial', 'VV has limited N-series options for .300 BLK; verify current coverage on-site', '2026-04-27'),

  -- ── HORNADY (actual path is /support/load-data/) ────────────────────────────
  ('hornady', '.223 Rem',           NULL, 'https://www.hornady.com/support/load-data/', 'full', 'Actual path is /support/load-data/; template URL /reloading/data# is incorrect', '2026-04-27'),
  ('hornady', '5.56 NATO',          NULL, 'https://www.hornady.com/support/load-data/', 'full', 'Hornady publishes extensive AR/5.56 NATO load data', '2026-04-27'),
  ('hornady', '6.5 Creedmoor',      NULL, 'https://www.hornady.com/support/load-data/', 'full', 'Hornady co-developed 6.5 CM; comprehensive load data', '2026-04-27'),
  ('hornady', '.308 Win',           NULL, 'https://www.hornady.com/support/load-data/', 'full', 'Comprehensive multi-bullet, multi-powder coverage', '2026-04-27'),
  ('hornady', '.300 Win Mag',       NULL, 'https://www.hornady.com/support/load-data/', 'full', 'Comprehensive coverage', '2026-04-27'),
  ('hornady', '.30-06 Springfield', NULL, 'https://www.hornady.com/support/load-data/', 'full', 'Comprehensive coverage', '2026-04-27'),
  ('hornady', '.243 Win',           NULL, 'https://www.hornady.com/support/load-data/', 'full', 'Comprehensive coverage', '2026-04-27'),
  ('hornady', '6mm Creedmoor',      NULL, 'https://www.hornady.com/support/load-data/', 'full', 'Comprehensive coverage', '2026-04-27'),
  ('hornady', '6.5 PRC',            NULL, 'https://www.hornady.com/support/load-data/', 'full', 'Hornady developed 6.5 PRC; authoritative load data', '2026-04-27'),
  ('hornady', '.300 Blackout',      NULL, 'https://www.hornady.com/support/load-data/', 'full', 'Hornady publishes supersonic and subsonic .300 BLK loads', '2026-04-27'),

  -- ── SIERRA (PDF-only; no individual cartridge web pages) ────────────────────
  ('sierra', '.223 Rem',           NULL, 'https://www.sierrabullets.com/load-data/', 'full',    'PDFs only; bolt-gun and AR-15 variants; template URL /resources/reloading-data/ invalid', '2026-04-27'),
  ('sierra', '5.56 NATO',          NULL, 'https://www.sierrabullets.com/load-data/', 'partial', 'Sierra .223 Rem (AR-15) PDF covers 5.56-pressure loads; no separate 5.56 page confirmed', '2026-04-27'),
  ('sierra', '6.5 Creedmoor',      NULL, 'https://www.sierrabullets.com/load-data/', 'full',    'Sierra specializes in 6.5mm; comprehensive PDF data', '2026-04-27'),
  ('sierra', '.308 Win',           NULL, 'https://www.sierrabullets.com/load-data/', 'full',    'Comprehensive multi-bullet PDF coverage', '2026-04-27'),
  ('sierra', '.300 Win Mag',       NULL, 'https://www.sierrabullets.com/load-data/', 'full',    'Comprehensive magnum rifle PDF coverage', '2026-04-27'),
  ('sierra', '.30-06 Springfield', NULL, 'https://www.sierrabullets.com/load-data/', 'full',    'Comprehensive .30 caliber PDF coverage', '2026-04-27'),
  ('sierra', '.243 Win',           NULL, 'https://www.sierrabullets.com/load-data/', 'full',    'Comprehensive 6mm PDF coverage', '2026-04-27'),
  ('sierra', '6mm Creedmoor',      NULL, 'https://www.sierrabullets.com/load-data/', 'full',    'Comprehensive 6mm PDF coverage', '2026-04-27'),
  ('sierra', '6.5 PRC',            NULL, 'https://www.sierrabullets.com/load-data/', 'partial', 'Newer cartridge; Sierra PDF coverage may be limited', '2026-04-27'),
  ('sierra', '.300 Blackout',      NULL, 'https://www.sierrabullets.com/load-data/', 'full',    'Sierra publishes supersonic and subsonic .300 BLK PDF data', '2026-04-27'),

  -- ── BERGER (search-based index; no per-cartridge URL slugs) ─────────────────
  ('berger', '.223 Rem',           NULL, 'https://bergerbullets.com/reloading-data/', 'full',    'Confirmed via loaddata.com index; no individual URL slug verified', '2026-04-27'),
  ('berger', '6.5 Creedmoor',      NULL, 'https://bergerbullets.com/reloading-data/', 'full',    'Primary 6.5 CM precision source; confirmed via xxl-reloading.com index', '2026-04-27'),
  ('berger', '.308 Win',           NULL, 'https://bergerbullets.com/reloading-data/', 'full',    'Multiple bullet weights (168, 175, 215gr etc.) confirmed via loaddata.com index', '2026-04-27'),
  ('berger', '.300 Win Mag',       NULL, 'https://bergerbullets.com/reloading-data/', 'full',    'Magnum long-range cartridge; confirmed via cartridge-list page', '2026-04-27'),
  ('berger', '.30-06 Springfield', NULL, 'https://bergerbullets.com/reloading-data/', 'full',    'Classic hunting/target caliber in Berger manual cartridge list', '2026-04-27'),
  ('berger', '.243 Win',           NULL, 'https://bergerbullets.com/reloading-data/', 'full',    '6mm caliber covered in Berger manual cartridge list', '2026-04-27'),
  ('berger', '6mm Creedmoor',      NULL, 'https://bergerbullets.com/reloading-data/', 'full',    'Confirmed via xxl-reloading.com index', '2026-04-27'),
  ('berger', '6.5 PRC',            NULL, 'https://bergerbullets.com/reloading-data/', 'full',    'Confirmed via xxl-reloading.com index', '2026-04-27')

ON CONFLICT (source_id, cartridge_name) DO NOTHING;
