-- Lindcott Armory — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- IDs are TEXT to preserve existing localStorage IDs during migration

-- ============================================================
-- GUNS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.guns (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  display_name TEXT,
  caliber TEXT NOT NULL,
  action TEXT NOT NULL,
  type TEXT NOT NULL,
  serial_number TEXT,
  acquired_date TEXT,
  acquired_price NUMERIC,
  acquired_from TEXT,
  condition TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  barrel_length NUMERIC,
  overall_length NUMERIC,
  weight NUMERIC,
  finish TEXT,
  stock_grip TEXT,
  notes TEXT,
  image_url TEXT,
  insurance_value NUMERIC,
  estimated_fmv NUMERIC,
  fmv_updated TEXT,
  nfa_item BOOLEAN DEFAULT FALSE,
  nfa_approval_date TEXT,
  suppressor_host BOOLEAN DEFAULT FALSE,
  capacity INTEGER,
  purpose TEXT[],
  cr_flag BOOLEAN DEFAULT FALSE,
  last_cleaned_date TEXT,
  last_cleaned_round_count INTEGER,
  last_zero_date TEXT,
  last_zero_distance INTEGER,
  open_issues TEXT,
  accessories JSONB,
  sold_date TEXT,
  sold_price NUMERIC,
  receipt_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.guns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_guns" ON public.guns FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gun_id TEXT NOT NULL REFERENCES public.guns(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  rounds_expended INTEGER NOT NULL DEFAULT 0,
  location TEXT,
  indoor_outdoor TEXT,
  purpose TEXT[],
  distance_yards INTEGER,
  issues BOOLEAN DEFAULT FALSE,
  issue_types TEXT[],
  issue_description TEXT,
  notes TEXT,
  ai_narrative TEXT,
  ammo_lot_id TEXT,
  session_cost NUMERIC,
  is_carry_gun BOOLEAN,
  range_day_id TEXT,
  target_analysis_id TEXT,
  strings JSONB,
  target_photos JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_sessions" ON public.sessions FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- AMMO LOTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ammo_lots (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caliber TEXT NOT NULL,
  brand TEXT NOT NULL,
  product_line TEXT NOT NULL,
  grain_weight INTEGER NOT NULL,
  bullet_type TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  advertised_fps INTEGER,
  actual_fps INTEGER,
  muzzle_energy INTEGER,
  ballistic_coefficient NUMERIC,
  standard_deviation NUMERIC,
  quantity_purchased INTEGER,
  purchase_date TEXT,
  purchase_price_per_round NUMERIC,
  current_market_price NUMERIC,
  average_cost_per_round NUMERIC,
  category TEXT NOT NULL DEFAULT 'Practice',
  storage_location TEXT,
  lot_number TEXT,
  is_handload BOOLEAN DEFAULT FALSE,
  reload_batch_id TEXT,
  assigned_gun_ids TEXT[],
  is_favorite BOOLEAN DEFAULT FALSE,
  min_stock_alert INTEGER,
  reserved INTEGER,
  purchase_history JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ammo_lots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_ammo" ON public.ammo_lots FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- TARGET ANALYSES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.target_analyses (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  distance_yds INTEGER NOT NULL,
  bullet_dia_in NUMERIC NOT NULL,
  stats JSONB NOT NULL,
  session_id TEXT REFERENCES public.sessions(id) ON DELETE SET NULL,
  gun_id TEXT REFERENCES public.guns(id) ON DELETE SET NULL,
  ammo_lot_id TEXT REFERENCES public.ammo_lots(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.target_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_analyses" ON public.target_analyses FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- OPTICS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.optics (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  serial_number TEXT,
  optic_type TEXT NOT NULL,
  magnification_min NUMERIC,
  magnification_max NUMERIC,
  objective_mm INTEGER,
  tube_diameter_mm INTEGER,
  focal_plane TEXT,
  reticle_name TEXT,
  illuminated BOOLEAN,
  turret_unit TEXT,
  click_value_moa NUMERIC,
  click_value_mrad NUMERIC,
  adjustment_range_elevation_moa INTEGER,
  adjustment_range_windage_moa INTEGER,
  parallax_type TEXT,
  battery_type TEXT,
  weight_oz NUMERIC,
  purchase_price NUMERIC,
  purchase_date TEXT,
  purchased_from TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.optics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_optics" ON public.optics FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- MOUNTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mounts (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  optic_id TEXT NOT NULL REFERENCES public.optics(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  mount_type TEXT NOT NULL,
  height_mm NUMERIC,
  ring_diameter_mm NUMERIC,
  ring_torque_in_lbs NUMERIC,
  base_torque_in_lbs NUMERIC,
  rail_interface TEXT,
  is_qd BOOLEAN,
  return_to_zero_rated BOOLEAN,
  last_torque_confirmed TEXT,
  notes TEXT,
  purchase_price NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.mounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_mounts" ON public.mounts FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- OPTIC ASSIGNMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.optic_assignments (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  optic_id TEXT NOT NULL REFERENCES public.optics(id) ON DELETE CASCADE,
  gun_id TEXT NOT NULL REFERENCES public.guns(id) ON DELETE CASCADE,
  mount_id TEXT REFERENCES public.mounts(id) ON DELETE SET NULL,
  assigned_date TEXT NOT NULL,
  removed_date TEXT,
  removal_reason TEXT
);

ALTER TABLE public.optic_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_optic_assignments" ON public.optic_assignments FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- OPTIC ZEROS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.optic_zeros (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assignment_id TEXT NOT NULL REFERENCES public.optic_assignments(id) ON DELETE CASCADE,
  optic_id TEXT NOT NULL REFERENCES public.optics(id) ON DELETE CASCADE,
  gun_id TEXT NOT NULL REFERENCES public.guns(id) ON DELETE CASCADE,
  zero_distance_yards INTEGER NOT NULL,
  ammo_description TEXT,
  ammo_lot_id TEXT REFERENCES public.ammo_lots(id) ON DELETE SET NULL,
  date TEXT NOT NULL,
  elevation_clicks_from_mechanical INTEGER,
  windage_clicks_from_mechanical INTEGER,
  temp_f INTEGER,
  altitude_ft INTEGER,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.optic_zeros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_optic_zeros" ON public.optic_zeros FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- WISHLIST
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  caliber TEXT NOT NULL,
  type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  estimated_price NUMERIC NOT NULL DEFAULT 0,
  current_price NUMERIC,
  lowest_price NUMERIC,
  notes TEXT,
  pros TEXT[],
  cons TEXT[],
  alternative_options TEXT[],
  use_case TEXT,
  added_date TEXT NOT NULL,
  target_date TEXT,
  saved_amount NUMERIC,
  price_alert_threshold NUMERIC,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_wishlist" ON public.wishlist_items FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- GEAR LOCKER (flexible JSONB — schema evolves without migrations)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.gear_items (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.gear_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_gear" ON public.gear_items FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- RELOADING DATA (all in one row per user — simple)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reloading_data (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  load_recipes JSONB DEFAULT '[]'::jsonb,
  components JSONB DEFAULT '[]'::jsonb,
  load_development JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.reloading_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_reloading" ON public.reloading_data FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- TRAINING SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.training_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_training" ON public.training_sessions FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- USER SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  units TEXT DEFAULT 'imperial',
  theme JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_settings" ON public.user_settings FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- CARTRIDGE PREFERENCES (per-user flags on the static encyclopedia)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_cartridge_prefs (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cartridge_name TEXT NOT NULL,
  own_gun_for_this BOOLEAN DEFAULT FALSE,
  own_ammo_for_this BOOLEAN DEFAULT FALSE,
  on_wishlist BOOLEAN DEFAULT FALSE,
  user_notes TEXT,
  PRIMARY KEY (user_id, cartridge_name)
);

ALTER TABLE public.user_cartridge_prefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_cartridge_prefs" ON public.user_cartridge_prefs FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- AI USAGE TRACKING (written by Edge Function, read by user)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  model TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_own_usage" ON public.ai_usage FOR SELECT USING (auth.uid() = user_id);
-- Inserts come from Edge Function (service role) only
