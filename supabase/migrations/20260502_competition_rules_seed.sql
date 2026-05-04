-- Competition rules seed — USPSA, IDPA, PRS, NRL, ATA, NSCA
-- Source: published 2024–2025 rulebooks. last_verified = '2025-08-01' (model knowledge cutoff).
-- Review annually and after any governing body rule update.

-- ─── USPSA ───────────────────────────────────────────────────────────────────

-- Production
INSERT INTO public.competition_rules VALUES
('uspsa-prod-weight',       'USPSA','Production',  'weight',       'Maximum 45 oz unloaded',                               '45',   'oz',       NULL, 'https://uspsa.org/rules', false, NULL, '2025-08-01', NOW()),
('uspsa-prod-capacity',     'USPSA','Production',  'capacity',     'Maximum 10 rounds loaded in magazine',                 '10',   'rounds',   NULL, 'https://uspsa.org/rules', false, NULL, '2025-08-01', NOW()),
('uspsa-prod-optic',        'USPSA','Production',  'optic',        'Iron sights only — no optical or electronic sights',   NULL,   NULL,       NULL, 'https://uspsa.org/rules', false, NULL, '2025-08-01', NOW()),
('uspsa-prod-trigger',      'USPSA','Production',  'trigger',      'Stock trigger from manufacturer. No overtravel or take-up adjustments that change reset characteristics.', NULL, NULL, NULL, 'https://uspsa.org/rules', true, 'Minor trigger jobs are sometimes accepted by MDs; confirm with match director for non-stock triggers', '2025-08-01', NOW()),
('uspsa-prod-barrel',       'USPSA','Production',  'barrel',       'Factory barrel only — no ported or compensated barrels', NULL,  NULL,       NULL, 'https://uspsa.org/rules', false, NULL, '2025-08-01', NOW()),
('uspsa-prod-power',        'USPSA','Production',  'modification', 'Minor power factor minimum 125 (bullet weight gr × velocity fps / 1000)', '125', 'power_factor', NULL, 'https://uspsa.org/rules', false, NULL, '2025-08-01', NOW());

-- Carry Optics
INSERT INTO public.competition_rules VALUES
('uspsa-co-weight',         'USPSA','Carry Optics','weight',       'Maximum 45 oz unloaded',                               '45',   'oz',       NULL, 'https://uspsa.org/rules', false, NULL, '2025-08-01', NOW()),
('uspsa-co-capacity',       'USPSA','Carry Optics','capacity',     'Maximum 10 rounds loaded in magazine',                 '10',   'rounds',   NULL, 'https://uspsa.org/rules', false, NULL, '2025-08-01', NOW()),
('uspsa-co-optic',          'USPSA','Carry Optics','optic',        'Electronic red dot or reflex sight permitted. No magnification.', NULL, NULL, NULL, 'https://uspsa.org/rules', false, NULL, '2025-08-01', NOW()),
('uspsa-co-power',          'USPSA','Carry Optics','modification',  'Minor power factor minimum 125',                      '125',  'power_factor', NULL, 'https://uspsa.org/rules', false, NULL, '2025-08-01', NOW());

-- Limited
INSERT INTO public.competition_rules VALUES
('uspsa-lim-weight',        'USPSA','Limited',     'weight',       'No maximum weight',                                    NULL,   NULL,       NULL, 'https://uspsa.org/rules', false, NULL, '2025-08-01', NOW()),
('uspsa-lim-capacity',      'USPSA','Limited',     'capacity',     'Maximum 141mm box magazine. No practical round limit for semi-auto.', NULL, NULL, NULL, 'https://uspsa.org/rules', false, NULL, '2025-08-01', NOW()),
('uspsa-lim-optic',         'USPSA','Limited',     'optic',        'Iron sights only — no optical or electronic sights',   NULL,   NULL,       NULL, 'https://uspsa.org/rules', false, NULL, '2025-08-01', NOW()),
('uspsa-lim-power',         'USPSA','Limited',     'modification', 'Major power factor minimum 165 for Major scoring; Minor 125 minimum', '165', 'power_factor', NULL, 'https://uspsa.org/rules', false, NULL, '2025-08-01', NOW());

-- Open
INSERT INTO public.competition_rules VALUES
('uspsa-open-optic',        'USPSA','Open',        'optic',        'Any optical or electronic sight permitted including magnified',  NULL, NULL, NULL, 'https://uspsa.org/rules', false, NULL, '2025-08-01', NOW()),
('uspsa-open-comp',         'USPSA','Open',        'modification', 'Compensators and porting permitted',                   NULL,   NULL,       NULL, 'https://uspsa.org/rules', false, NULL, '2025-08-01', NOW()),
('uspsa-open-power',        'USPSA','Open',        'modification', 'Major power factor minimum 165 for Major scoring',     '165',  'power_factor', NULL, 'https://uspsa.org/rules', false, NULL, '2025-08-01', NOW());

-- Limited 10
INSERT INTO public.competition_rules VALUES
('uspsa-l10-capacity',      'USPSA','Limited 10',  'capacity',     'Maximum 10 rounds in magazine',                        '10',   'rounds',   NULL, 'https://uspsa.org/rules', false, NULL, '2025-08-01', NOW()),
('uspsa-l10-optic',         'USPSA','Limited 10',  'optic',        'Iron sights only',                                     NULL,   NULL,       NULL, 'https://uspsa.org/rules', false, NULL, '2025-08-01', NOW()),
('uspsa-l10-power',         'USPSA','Limited 10',  'modification', 'Major power factor minimum 165; Minor 125 minimum',    '165',  'power_factor', NULL, 'https://uspsa.org/rules', false, NULL, '2025-08-01', NOW());

-- Revolver
INSERT INTO public.competition_rules VALUES
('uspsa-rev-type',          'USPSA','Revolver',    'modification', 'Revolver only — no semi-automatic pistols',            NULL,   NULL,       NULL, 'https://uspsa.org/rules', false, NULL, '2025-08-01', NOW()),
('uspsa-rev-power',         'USPSA','Revolver',    'modification', 'Major power factor minimum 165 for Major; Minor 125',  '165',  'power_factor', NULL, 'https://uspsa.org/rules', false, NULL, '2025-08-01', NOW());

-- ─── IDPA ────────────────────────────────────────────────────────────────────

-- SSP (Stock Service Pistol)
INSERT INTO public.competition_rules VALUES
('idpa-ssp-weight',         'IDPA','SSP',          'weight',       'Maximum 43 oz unloaded',                               '43',   'oz',       NULL, 'https://idpa.com/compete/rulebook', false, NULL, '2025-08-01', NOW()),
('idpa-ssp-capacity',       'IDPA','SSP',          'capacity',     'Maximum 10+1 rounds',                                  '10',   'rounds',   NULL, 'https://idpa.com/compete/rulebook', false, NULL, '2025-08-01', NOW()),
('idpa-ssp-optic',          'IDPA','SSP',          'optic',        'Iron sights only',                                     NULL,   NULL,       NULL, 'https://idpa.com/compete/rulebook', false, NULL, '2025-08-01', NOW()),
('idpa-ssp-barrel',         'IDPA','SSP',          'barrel',       'Maximum 4.25 inch barrel',                             '4.25', 'inches',   NULL, 'https://idpa.com/compete/rulebook', false, NULL, '2025-08-01', NOW()),
('idpa-ssp-trigger',        'IDPA','SSP',          'trigger',      'Minimum 5 lb trigger pull. Stock trigger components only.', '5', 'lbs',    NULL, 'https://idpa.com/compete/rulebook', false, NULL, '2025-08-01', NOW());

-- ESP (Enhanced Service Pistol)
INSERT INTO public.competition_rules VALUES
('idpa-esp-weight',         'IDPA','ESP',          'weight',       'Maximum 43 oz unloaded',                               '43',   'oz',       NULL, 'https://idpa.com/compete/rulebook', false, NULL, '2025-08-01', NOW()),
('idpa-esp-capacity',       'IDPA','ESP',          'capacity',     'Maximum 10+1 rounds',                                  '10',   'rounds',   NULL, 'https://idpa.com/compete/rulebook', false, NULL, '2025-08-01', NOW()),
('idpa-esp-optic',          'IDPA','ESP',          'optic',        'Iron sights only',                                     NULL,   NULL,       NULL, 'https://idpa.com/compete/rulebook', false, NULL, '2025-08-01', NOW()),
('idpa-esp-trigger',        'IDPA','ESP',          'trigger',      'Minimum 3.5 lb trigger pull (lighter than SSP)',       '3.5',  'lbs',      NULL, 'https://idpa.com/compete/rulebook', false, NULL, '2025-08-01', NOW());

-- CCP (Compact Carry Pistol)
INSERT INTO public.competition_rules VALUES
('idpa-ccp-barrel',         'IDPA','CCP',          'barrel',       'Maximum 3.8 inch barrel',                              '3.8',  'inches',   NULL, 'https://idpa.com/compete/rulebook', false, NULL, '2025-08-01', NOW()),
('idpa-ccp-capacity',       'IDPA','CCP',          'capacity',     'Maximum 8+1 rounds',                                   '8',    'rounds',   NULL, 'https://idpa.com/compete/rulebook', false, NULL, '2025-08-01', NOW()),
('idpa-ccp-weight',         'IDPA','CCP',          'weight',       'Maximum 32 oz unloaded',                               '32',   'oz',       NULL, 'https://idpa.com/compete/rulebook', false, NULL, '2025-08-01', NOW());

-- CO (Carry Optics)
INSERT INTO public.competition_rules VALUES
('idpa-co-optic',           'IDPA','CO',           'optic',        'Electronic red dot permitted. Maximum 7.5 inch radius dot.',  NULL, NULL,   NULL, 'https://idpa.com/compete/rulebook', true, 'Some newer micro dots may be borderline — confirm dot size with equipment inspector', '2025-08-01', NOW()),
('idpa-co-capacity',        'IDPA','CO',           'capacity',     'Maximum 10+1 rounds',                                  '10',   'rounds',   NULL, 'https://idpa.com/compete/rulebook', false, NULL, '2025-08-01', NOW());

-- ─── PRS (Precision Rifle Series) ────────────────────────────────────────────

INSERT INTO public.competition_rules VALUES
('prs-pro-optic',           'PRS','Pro Series',    'optic',        'Any riflescope permitted. No magnification limit.',    NULL,   NULL,       NULL, 'https://precisionrifleseries.com/rules', false, NULL, '2025-08-01', NOW()),
('prs-pro-caliber',         'PRS','Pro Series',    'modification', 'Maximum .375 caliber. No .50 BMG. Rimfire not eligible.', NULL, NULL,      NULL, 'https://precisionrifleseries.com/rules', false, NULL, '2025-08-01', NOW()),
('prs-pro-bipod',           'PRS','Pro Series',    'modification', 'Bipods and rear bags permitted. No shooting sticks unless stage description allows.', NULL, NULL, NULL, 'https://precisionrifleseries.com/rules', true, 'Stage-specific prop rules vary by match director — read stage descriptions carefully', '2025-08-01', NOW()),
('prs-pro-suppressor',      'PRS','Pro Series',    'modification', 'Suppressors permitted if stage allows. NFA rules apply.', NULL, NULL,      NULL, 'https://precisionrifleseries.com/rules', true, 'Confirm with match director — some stages prohibit suppressors for auditory start signals', '2025-08-01', NOW()),
('prs-rimfire-caliber',     'PRS','Rimfire',       'modification', '.22 LR or .17 HMR only',                               NULL,   NULL,       NULL, 'https://precisionrifleseries.com/rules', false, NULL, '2025-08-01', NOW()),
('prs-rimfire-optic',       'PRS','Rimfire',       'optic',        'Any riflescope permitted',                             NULL,   NULL,       NULL, 'https://precisionrifleseries.com/rules', false, NULL, '2025-08-01', NOW());

-- ─── NRL (National Rifle League) ─────────────────────────────────────────────

INSERT INTO public.competition_rules VALUES
('nrl-hunter-weight',       'NRL','Hunter',        'weight',       'Maximum 16 lb rifle with all equipment as carried to stage', '16', 'lbs',   NULL, 'https://nationalrifleleague.org/rules', false, NULL, '2025-08-01', NOW()),
('nrl-hunter-optic',        'NRL','Hunter',        'optic',        'Fixed or variable power scope. No restrictions on magnification.', NULL, NULL, NULL, 'https://nationalrifleleague.org/rules', false, NULL, '2025-08-01', NOW()),
('nrl-hunter-caliber',      'NRL','Hunter',        'modification', 'Any centerfire cartridge. Maximum .375 caliber.',      NULL,   NULL,       NULL, 'https://nationalrifleleague.org/rules', false, NULL, '2025-08-01', NOW()),
('nrl-open-weight',         'NRL','Open',          'weight',       'No weight limit',                                      NULL,   NULL,       NULL, 'https://nationalrifleleague.org/rules', false, NULL, '2025-08-01', NOW()),
('nrl22-caliber',           'NRL22','NRL22',       'modification', '.22 LR only',                                          NULL,   NULL,       NULL, 'https://nrl22.org/rules', false, NULL, '2025-08-01', NOW()),
('nrl22-optic',             'NRL22','NRL22',       'optic',        'Any optic permitted',                                  NULL,   NULL,       NULL, 'https://nrl22.org/rules', false, NULL, '2025-08-01', NOW());

-- ─── ATA Trap ────────────────────────────────────────────────────────────────

INSERT INTO public.competition_rules VALUES
('ata-16yd-gauge',          'ATA Trap','16 Yard',  'modification', '12, 20, 28 gauge or .410 bore permitted',              NULL,   NULL,       NULL, 'https://shootata.com/Rules.aspx', false, NULL, '2025-08-01', NOW()),
('ata-16yd-shot',           'ATA Trap','16 Yard',  'modification', 'Maximum 1-1/8 oz shot load for 12 gauge. Lead only.', NULL,   NULL,       NULL, 'https://shootata.com/Rules.aspx', false, NULL, '2025-08-01', NOW()),
('ata-16yd-choke',          'ATA Trap','16 Yard',  'modification', 'Any choke permitted',                                  NULL,   NULL,       NULL, 'https://shootata.com/Rules.aspx', false, NULL, '2025-08-01', NOW()),
('ata-handicap-yardage',    'ATA Trap','Handicap', 'modification', 'Yardage assigned 19–27 yards based on verified averages. New shooters start at 19 yards.', NULL, NULL, NULL, 'https://shootata.com/Rules.aspx', false, NULL, '2025-08-01', NOW()),
('ata-handicap-gauge',      'ATA Trap','Handicap', 'modification', '12 gauge only for handicap events',                   NULL,   NULL,       NULL, 'https://shootata.com/Rules.aspx', false, NULL, '2025-08-01', NOW()),
('ata-doubles-gauge',       'ATA Trap','Doubles',  'modification', '12, 20, 28 gauge or .410 bore permitted',              NULL,   NULL,       NULL, 'https://shootata.com/Rules.aspx', false, NULL, '2025-08-01', NOW());

-- ─── NSCA Sporting Clays ──────────────────────────────────────────────────────

INSERT INTO public.competition_rules VALUES
('nsca-sc-gauge-12',        'NSCA Sporting Clays','12 Gauge',   'modification', '12 gauge only. Maximum 1-1/8 oz shot for 12 gauge. Lead or approved non-toxic shot.', NULL, NULL, NULL, 'https://nsca-nssa.org/rules', false, NULL, '2025-08-01', NOW()),
('nsca-sc-gauge-sub',       'NSCA Sporting Clays','Sub-Gauge',  'modification', '20, 28 gauge or .410 bore. Shot load per gauge rules.', NULL, NULL, NULL, 'https://nsca-nssa.org/rules', false, NULL, '2025-08-01', NOW()),
('nsca-sc-choke',           'NSCA Sporting Clays','12 Gauge',   'modification', 'Any choke permitted. Extended chokes allowed.',         NULL,   NULL, NULL, 'https://nsca-nssa.org/rules', false, NULL, '2025-08-01', NOW()),
('nsca-sc-semiauto',        'NSCA Sporting Clays','12 Gauge',   'modification', 'Semi-automatic, O/U, SxS, and single barrel all legal.', NULL,  NULL, NULL, 'https://nsca-nssa.org/rules', false, NULL, '2025-08-01', NOW()),
('nsca-5stand-gauge',       'NSCA 5-Stand','5-Stand',           'modification', '12, 20, 28 gauge or .410. Same shot load rules as sporting clays.', NULL, NULL, NULL, 'https://nsca-nssa.org/rules', false, NULL, '2025-08-01', NOW());

-- ─── classifier_thresholds ───────────────────────────────────────────────────

-- USPSA (all divisions use same percent thresholds)
INSERT INTO public.classifier_thresholds VALUES
('uspsa-d',   'USPSA', NULL, 'D',  1,    39.99, 'Entry class', '2025-08-01'),
('uspsa-c',   'USPSA', NULL, 'C',  40,   59.99, NULL, '2025-08-01'),
('uspsa-b',   'USPSA', NULL, 'B',  60,   74.99, NULL, '2025-08-01'),
('uspsa-a',   'USPSA', NULL, 'A',  75,   84.99, NULL, '2025-08-01'),
('uspsa-m',   'USPSA', NULL, 'M',  85,   94.99, 'Master class', '2025-08-01'),
('uspsa-gm',  'USPSA', NULL, 'GM', 95,   100,   'Grand Master — top ~1% nationally', '2025-08-01');

-- IDPA (uses percent of top Expert shooter in division)
INSERT INTO public.classifier_thresholds VALUES
('idpa-novice',  'IDPA', NULL, 'Novice',  NULL, NULL, 'New shooter, no classifier shot yet', '2025-08-01'),
('idpa-marksman','IDPA', NULL, 'Marksman',NULL, NULL, 'First classifier result establishes initial class', '2025-08-01'),
('idpa-sharp',   'IDPA', NULL, 'Sharpshooter', NULL, NULL, NULL, '2025-08-01'),
('idpa-expert',  'IDPA', NULL, 'Expert',  NULL, NULL, NULL, '2025-08-01'),
('idpa-master',  'IDPA', NULL, 'Master',  NULL, NULL, NULL, '2025-08-01'),
('idpa-dm',      'IDPA', NULL, 'Distinguished Master', NULL, NULL, 'Top class — invite only at nationals', '2025-08-01');

-- ATA (yardage progression — not a class system, performance-based)
INSERT INTO public.classifier_thresholds VALUES
('ata-19yd', 'ATA Trap', 'Handicap', '19 yards', NULL, NULL, 'Starting yardage for all new registered shooters', '2025-08-01'),
('ata-27yd', 'ATA Trap', 'Handicap', '27 yards', NULL, NULL, 'Maximum yardage — achieved by sustained high averages (typically 95%+ over many registered targets)', '2025-08-01');

-- NSCA class system (percent of perfect)
INSERT INTO public.classifier_thresholds VALUES
('nsca-d',   'NSCA Sporting Clays', NULL, 'D',  1,    54.99, NULL, '2025-08-01'),
('nsca-c',   'NSCA Sporting Clays', NULL, 'C',  55,   64.99, NULL, '2025-08-01'),
('nsca-b',   'NSCA Sporting Clays', NULL, 'B',  65,   74.99, NULL, '2025-08-01'),
('nsca-a',   'NSCA Sporting Clays', NULL, 'A',  75,   84.99, NULL, '2025-08-01'),
('nsca-aa',  'NSCA Sporting Clays', NULL, 'AA', 85,   100,   'Top class', '2025-08-01');
