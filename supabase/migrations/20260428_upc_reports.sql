-- upc_reports: one row per user per UPC = tamper-proof signal
-- UNIQUE (upc, user_id) prevents repeat voting from the same account.
-- Verified rows in upc_products are protected by trigger — no client can overwrite them.

CREATE TABLE public.upc_reports (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  upc         TEXT        NOT NULL REFERENCES public.upc_products(upc) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (upc, user_id)
);

ALTER TABLE public.upc_reports ENABLE ROW LEVEL SECURITY;

-- Users can insert their own report only
CREATE POLICY "users can report" ON public.upc_reports
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- No reads — report data is admin-only (query via service role in SQL Editor)

-- ── Protect verified rows in upc_products ────────────────────────────────────
-- Silently ignores any UPDATE when verified = true.
-- Allows Claude cache upserts to overwrite unverified rows freely.

CREATE OR REPLACE FUNCTION public.protect_verified_upc()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.verified = true THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER no_overwrite_verified_upc
  BEFORE UPDATE ON public.upc_products
  FOR EACH ROW EXECUTE FUNCTION public.protect_verified_upc();

-- ── Review queue view (admin convenience) ────────────────────────────────────
CREATE VIEW public.upc_report_queue AS
SELECT
  p.upc,
  p.item_type,
  p.fields,
  p.confidence,
  p.verified,
  p.source,
  COUNT(r.user_id) AS report_count,
  MAX(r.reported_at) AS last_reported_at
FROM public.upc_products p
JOIN public.upc_reports r ON r.upc = p.upc
WHERE p.verified = false
GROUP BY p.upc, p.item_type, p.fields, p.confidence, p.verified, p.source
ORDER BY report_count DESC;
