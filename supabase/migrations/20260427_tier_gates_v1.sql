-- Phase 1: Tier Gates — Premium columns on user_profiles
-- Run in Supabase SQL Editor

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ;

-- Index for fast tier lookups in edge function
CREATE INDEX IF NOT EXISTS idx_user_profiles_premium
  ON user_profiles (user_id, is_premium, premium_expires_at);
