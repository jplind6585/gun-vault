-- Photo System V1 — Phase 2
-- Tables: photo_sets, photo_assets, grade_assessments
-- Storage RLS policies for gun-photos bucket

-- ── photo_sets ────────────────────────────────────────────────────────────────
-- One row per set (sale_listing, insurance) per gun per user
CREATE TABLE IF NOT EXISTS photo_sets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gun_id           TEXT NOT NULL,
  set_type         TEXT NOT NULL CHECK (set_type IN ('sale_listing', 'insurance')),
  gun_type_profile TEXT NOT NULL DEFAULT 'semi_auto_pistol',
  watermark        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, gun_id, set_type)
);

ALTER TABLE photo_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own photo sets"
  ON photo_sets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_photo_sets_user_gun ON photo_sets (user_id, gun_id);

-- ── photo_assets ──────────────────────────────────────────────────────────────
-- One row per photo. Linked to a set (optional — standalone photos allowed).
CREATE TABLE IF NOT EXISTS photo_assets (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gun_id              TEXT NOT NULL,
  set_id              UUID REFERENCES photo_sets(id) ON DELETE SET NULL,
  set_type            TEXT,                          -- denormalized for easy filtering
  shot_type           TEXT,                          -- e.g. 'left_profile', 'serial_number', 'muzzle_end'
  storage_path        TEXT NOT NULL,                 -- path in gun-photos bucket
  storage_url         TEXT,                          -- signed/public URL (cached)
  is_filtered         BOOLEAN NOT NULL DEFAULT FALSE,
  filter_name         TEXT,
  is_acquisition_photo BOOLEAN NOT NULL DEFAULT FALSE,
  ai_review_passed    BOOLEAN,
  ai_review_result    JSONB,                         -- { approved, warnings: string[] }
  captured_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE photo_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own photo assets"
  ON photo_assets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_photo_assets_user_gun ON photo_assets (user_id, gun_id);
CREATE INDEX IF NOT EXISTS idx_photo_assets_set ON photo_assets (set_id);

-- ── grade_assessments ─────────────────────────────────────────────────────────
-- One row per Grade-a-Gun assessment run
CREATE TABLE IF NOT EXISTS grade_assessments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gun_id          TEXT NOT NULL,
  overall_grade   TEXT NOT NULL,                     -- Perfect/Excellent/Very Good/Good/Fair/Poor
  area_grades     JSONB NOT NULL DEFAULT '{}',        -- { frame: { grade, note }, slide: { grade, note }, ... }
  estimated_fmv_low  INTEGER,                        -- cents — null until GunBroker (Phase 2b)
  estimated_fmv_high INTEGER,
  photo_asset_ids UUID[],                            -- which photos were used
  assessed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE grade_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own grade assessments"
  ON grade_assessments FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_grade_assessments_user_gun ON grade_assessments (user_id, gun_id);

-- ── Storage RLS — gun-photos bucket ──────────────────────────────────────────
-- Users can only read/write their own files.
-- Path convention: {user_id}/{gun_id}/{filename}

CREATE POLICY "Users upload own gun photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'gun-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users read own gun photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'gun-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users delete own gun photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'gun-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users update own gun photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'gun-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
