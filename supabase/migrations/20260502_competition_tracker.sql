-- Competition Tracker — core tables
-- 2026-05-02

-- ─── competition_events (registry) ───────────────────────────────────────────
CREATE TABLE public.competition_events (
  id                    TEXT PRIMARY KEY,
  name                  TEXT NOT NULL,
  discipline            TEXT NOT NULL,
  divisions             TEXT[],
  date                  TEXT NOT NULL,
  location              TEXT,
  state                 TEXT,
  country               TEXT DEFAULT 'US',
  organizer_name        TEXT,
  organizer_email       TEXT,
  official_url          TEXT,
  practiccore_id        TEXT,
  entry_fee             NUMERIC,
  stage_count           INTEGER,
  round_count           INTEGER,
  registration_deadline TEXT,
  source                TEXT NOT NULL,   -- 'practicscor' | 'ata' | 'nsca' | 'usa_shooting' | 'user_entered' | 'organizer_submitted' | 'seeded'
  verified_at           TIMESTAMPTZ,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Public read — no RLS (reference table like manufacturers)
GRANT SELECT ON public.competition_events TO anon, authenticated;

-- ─── user_event_plans (user's competition calendar) ──────────────────────────
CREATE TABLE public.user_event_plans (
  id                      TEXT PRIMARY KEY,
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id                TEXT REFERENCES public.competition_events(id) ON DELETE SET NULL,
  event_name              TEXT NOT NULL,       -- denormalized for manual entries
  discipline              TEXT NOT NULL,
  division                TEXT NOT NULL,
  date                    TEXT NOT NULL,
  priority                TEXT NOT NULL DEFAULT 'B',  -- 'A' | 'B' | 'C'
  gun_id                  TEXT,                -- soft ref — no FK (gun may be deleted)
  ammo_lot_id             TEXT,                -- soft ref
  training_plan           JSONB,               -- AI-generated drill schedule
  training_plan_reasoning TEXT,                -- AI transparency field
  season_phase            TEXT,                -- 'build' | 'peak' | 'competition' | 'recovery'
  notes                   TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_event_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_event_plans"
  ON public.user_event_plans FOR ALL
  USING (auth.uid() = user_id);

-- ─── competition_results ─────────────────────────────────────────────────────
CREATE TABLE public.competition_results (
  id                 TEXT PRIMARY KEY,
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id           TEXT REFERENCES public.competition_events(id) ON DELETE SET NULL,
  event_name         TEXT NOT NULL,
  discipline         TEXT NOT NULL,
  division           TEXT NOT NULL,
  date               TEXT NOT NULL,
  placement          INTEGER,
  total_competitors  INTEGER,
  score              NUMERIC,
  score_unit         TEXT,               -- 'hit_factor' | 'points' | 'time' | 'count' | 'x_count'
  gun_id             TEXT,               -- soft ref
  ammo_lot_id        TEXT,               -- soft ref — for ammo correlation feature
  classifier_score   NUMERIC,            -- 0–100 percent (USPSA/IDPA/NSCA)
  stage_data         JSONB,              -- advanced entry: per-stage breakdown
  notes              TEXT,
  ai_debrief         TEXT,               -- AI-generated debrief text
  reasoning          TEXT,               -- AI transparency field
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.competition_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_results"
  ON public.competition_results FOR ALL
  USING (auth.uid() = user_id);

-- ─── competition_rules (equipment rules per discipline/division) ──────────────
CREATE TABLE public.competition_rules (
  id                TEXT PRIMARY KEY,
  discipline        TEXT NOT NULL,
  division          TEXT NOT NULL,
  rule_category     TEXT NOT NULL,  -- 'weight' | 'trigger' | 'optic' | 'capacity' | 'barrel' | 'modification' | 'classifier'
  rule_description  TEXT NOT NULL,
  rule_value        TEXT,           -- machine-readable limit (e.g. '35' for 35oz, '10' for 10 rounds)
  rule_unit         TEXT,           -- 'oz' | 'rounds' | 'inches' | 'power_factor' | 'percent'
  effective_date    TEXT,
  source_url        TEXT,
  gray_area         BOOLEAN DEFAULT FALSE,
  gray_area_note    TEXT,
  last_verified     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT SELECT ON public.competition_rules TO anon, authenticated;

-- ─── classifier_thresholds (classification ladder data) ──────────────────────
CREATE TABLE public.classifier_thresholds (
  id            TEXT PRIMARY KEY,
  discipline    TEXT NOT NULL,
  division      TEXT,           -- null = applies to all divisions
  class_name    TEXT NOT NULL,  -- 'D' | 'C' | 'B' | 'A' | 'M' | 'GM' | 'AA' | etc.
  min_percent   NUMERIC,        -- lower bound for this class (e.g. 40 for C class)
  max_percent   NUMERIC,        -- upper bound (e.g. 59.99 for C class)
  notes         TEXT,
  last_verified TEXT
);

GRANT SELECT ON public.classifier_thresholds TO anon, authenticated;
