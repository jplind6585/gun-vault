-- Lindcott Armory — Reference Data Schema
-- Run this in the Supabase SQL Editor AFTER the main schema.sql
-- These are read-only reference tables seeded by seed-reference-data.js
-- Users can SELECT; only the service role can INSERT/UPDATE/DELETE

-- ============================================================
-- GUN HISTORY
-- Encyclopedia of historically significant firearms
-- ============================================================
CREATE TABLE IF NOT EXISTS public.gun_history (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  origin          TEXT,
  year            INTEGER,
  era             TEXT,
  category        TEXT,
  category_color  TEXT,
  tagline         TEXT,
  body            TEXT
);

ALTER TABLE public.gun_history ENABLE ROW LEVEL SECURITY;

-- Allow any anonymous or authenticated user to read
CREATE POLICY "public_read_gun_history"
  ON public.gun_history
  FOR SELECT
  USING (true);

-- No public INSERT / UPDATE / DELETE — service role only via seed script

-- ============================================================
-- CARTRIDGES
-- Cartridge encyclopedia (198 cartridges, shared by app and website)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cartridges (
  id                        TEXT PRIMARY KEY,
  name                      TEXT NOT NULL,
  alternate_names           TEXT[],
  type                      TEXT,           -- Rifle, Pistol, Shotgun, Rimfire
  standardization           TEXT,
  production_status         TEXT,
  availability              TEXT,
  year_introduced           INTEGER,
  inventor                  TEXT,
  manufacturer              TEXT,
  country_of_origin         TEXT,
  parent_case               TEXT,
  derived_from              TEXT,
  bullet_diameter_inch      NUMERIC,
  bullet_diameter_mm        NUMERIC,
  base_diameter_inch        NUMERIC,
  base_diameter_mm          NUMERIC,
  rim_diameter_inch         NUMERIC,
  rim_diameter_mm           NUMERIC,
  case_length_inch          NUMERIC,
  case_length_mm            NUMERIC,
  overall_length_inch       NUMERIC,
  overall_length_mm         NUMERIC,
  case_capacity_grains      NUMERIC,
  max_pressure_psi          INTEGER,
  rim_type                  TEXT,
  primer_type               TEXT,
  typical_twist_rate        TEXT,
  common_bullet_weights     NUMERIC[],
  velocity_min_fps          INTEGER,
  velocity_max_fps          INTEGER,
  energy_min_ftlbs          INTEGER,
  energy_max_ftlbs          INTEGER,
  effective_range_yards     INTEGER,
  max_range_yards           INTEGER,
  primary_use               TEXT[],
  hunting_game_size         TEXT[],
  military_adoption         TEXT[],
  current_military_use      TEXT[],
  law_enforcement_use       BOOLEAN,
  similar_cartridges        TEXT[],
  description               TEXT,
  history                   TEXT,
  notable_firearms          TEXT[],
  trivia                    TEXT
);

ALTER TABLE public.cartridges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_cartridges"
  ON public.cartridges
  FOR SELECT
  USING (true);

-- No public INSERT / UPDATE / DELETE — service role only via seed script
-- ============================================================
-- SERVICE WEAPONS
-- Military firearms by nation and era (used in the timeline feature)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.service_weapons (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  countries   TEXT[],
  role        TEXT,
  year_start  INTEGER,
  year_end    INTEGER,          -- NULL means currently in service
  caliber     TEXT,
  story       TEXT
);

ALTER TABLE public.service_weapons ENABLE ROW LEVEL SECURITY;

-- Allow any anonymous or authenticated user to read
CREATE POLICY "public_read_service_weapons"
  ON public.service_weapons
  FOR SELECT
  USING (true);

-- No public INSERT / UPDATE / DELETE — service role only via seed script
