-- ── Lindcott Armory: Monetization Schema Migration ────────────────────────────
-- Run this in: Supabase Dashboard → SQL Editor
-- Safe to run multiple times (uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)

-- ── 1. ai_usage table ─────────────────────────────────────────────────────────
-- Tracks per-user AI token consumption. Already queried by the claude edge function.
CREATE TABLE IF NOT EXISTS public.ai_usage (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feature      TEXT        NOT NULL DEFAULT 'unknown',
  input_tokens INTEGER     NOT NULL DEFAULT 0,
  output_tokens INTEGER    NOT NULL DEFAULT 0,
  model        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- Users can read their own usage (for future usage display)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_usage' AND policyname = 'Users can read own usage'
  ) THEN
    CREATE POLICY "Users can read own usage" ON public.ai_usage
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── 2. feedback table ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.feedback (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  category    TEXT        NOT NULL DEFAULT 'general',
  message     TEXT        NOT NULL,
  email       TEXT,
  app_version TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'feedback' AND policyname = 'Users can insert feedback'
  ) THEN
    CREATE POLICY "Users can insert feedback" ON public.feedback
      FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
  END IF;
END $$;

-- ── 3. user_profiles table ───────────────────────────────────────────────────
-- Stores per-user Pro status and early access tracking.
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id                       UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                  UUID        REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  is_pro                   BOOLEAN     DEFAULT false,
  pro_expires_at           TIMESTAMPTZ,
  early_access_claimed_at  TIMESTAMPTZ,
  created_at               TIMESTAMPTZ DEFAULT now()
);

-- Add columns if table already existed without them
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT false;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS pro_expires_at TIMESTAMPTZ;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS early_access_claimed_at TIMESTAMPTZ;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can read own profile'
  ) THEN
    CREATE POLICY "Users can read own profile" ON public.user_profiles
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can upsert own profile'
  ) THEN
    CREATE POLICY "Users can upsert own profile" ON public.user_profiles
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
