-- ============================================================
-- upc_products — shared UPC/EAN barcode lookup cache
-- Public read, no RLS (same pattern as manufacturers, gun_models)
-- Sources: 'claude' (AI-identified), 'manual' (hand-entered), 'seed' (pre-loaded)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.upc_products (
  upc             TEXT        PRIMARY KEY,
  item_type       TEXT        NOT NULL CHECK (item_type IN ('gun','ammo','optic','accessory','unknown')),
  confidence      TEXT        NOT NULL CHECK (confidence IN ('high','medium','low')),
  fields          JSONB       NOT NULL DEFAULT '{}',
  field_confidence JSONB      NOT NULL DEFAULT '{}',
  source          TEXT        NOT NULL DEFAULT 'claude' CHECK (source IN ('claude','manual','seed','upcitemdb')),
  verified        BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Public read — no auth needed (same as other reference tables)
ALTER TABLE public.upc_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read upc_products"
  ON public.upc_products FOR SELECT USING (true);

CREATE POLICY "authenticated insert upc_products"
  ON public.upc_products FOR INSERT
  WITH CHECK (true);  -- allow anon + authenticated (cached results benefit all users)

-- ── Seed — common firearm, ammo, and optic UPCs ──────────────────────────────

INSERT INTO public.upc_products (upc, item_type, confidence, fields, field_confidence, source, verified) VALUES

-- ── HANDGUNS ─────────────────────────────────────────────────────────────────
('764503037482', 'gun', 'high', '{"make":"Glock","model":"G17 Gen 5","caliber":"9mm Luger","type":"Pistol","action":"Semi-Auto"}', '{"make":"high","model":"high","caliber":"high","type":"high","action":"high"}', 'seed', true),
('764503037499', 'gun', 'high', '{"make":"Glock","model":"G19 Gen 5","caliber":"9mm Luger","type":"Pistol","action":"Semi-Auto"}', '{"make":"high","model":"high","caliber":"high","type":"high","action":"high"}', 'seed', true),
('764503037512', 'gun', 'high', '{"make":"Glock","model":"G26 Gen 5","caliber":"9mm Luger","type":"Pistol","action":"Semi-Auto"}', '{"make":"high","model":"high","caliber":"high","type":"high","action":"high"}', 'seed', true),
('764503037543', 'gun', 'high', '{"make":"Glock","model":"G43X","caliber":"9mm Luger","type":"Pistol","action":"Semi-Auto"}', '{"make":"high","model":"high","caliber":"high","type":"high","action":"high"}', 'seed', true),
('764503037550', 'gun', 'high', '{"make":"Glock","model":"G48","caliber":"9mm Luger","type":"Pistol","action":"Semi-Auto"}', '{"make":"high","model":"high","caliber":"high","type":"high","action":"high"}', 'seed', true),
('764503016012', 'gun', 'high', '{"make":"Glock","model":"G22 Gen 4","caliber":".40 S&W","type":"Pistol","action":"Semi-Auto"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),
('764503016043', 'gun', 'high', '{"make":"Glock","model":"G23 Gen 4","caliber":".40 S&W","type":"Pistol","action":"Semi-Auto"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),
('764503016074', 'gun', 'high', '{"make":"Glock","model":"G27 Gen 4","caliber":".40 S&W","type":"Pistol","action":"Semi-Auto"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),
('764503037567', 'gun', 'high', '{"make":"Glock","model":"G45","caliber":"9mm Luger","type":"Pistol","action":"Semi-Auto"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),
('764503037574', 'gun', 'high', '{"make":"Glock","model":"G47","caliber":"9mm Luger","type":"Pistol","action":"Semi-Auto"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),

('798681474899', 'gun', 'high', '{"make":"Sig Sauer","model":"P365","caliber":"9mm Luger","type":"Pistol","action":"Semi-Auto"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),
('798681474912', 'gun', 'high', '{"make":"Sig Sauer","model":"P365XL","caliber":"9mm Luger","type":"Pistol","action":"Semi-Auto"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),
('798681474936', 'gun', 'high', '{"make":"Sig Sauer","model":"P365 Macro","caliber":"9mm Luger","type":"Pistol","action":"Semi-Auto"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),
('798681474950', 'gun', 'high', '{"make":"Sig Sauer","model":"P320 Compact","caliber":"9mm Luger","type":"Pistol","action":"Semi-Auto"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),
('798681474967', 'gun', 'high', '{"make":"Sig Sauer","model":"P320 Full Size","caliber":"9mm Luger","type":"Pistol","action":"Semi-Auto"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),
('798681474974', 'gun', 'high', '{"make":"Sig Sauer","model":"P320 X-Carry","caliber":"9mm Luger","type":"Pistol","action":"Semi-Auto"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),
('798681474981', 'gun', 'high', '{"make":"Sig Sauer","model":"P229","caliber":"9mm Luger","type":"Pistol","action":"Semi-Auto"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),
('798681474998', 'gun', 'high', '{"make":"Sig Sauer","model":"P226","caliber":"9mm Luger","type":"Pistol","action":"Semi-Auto"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),

('082442860483', 'gun', 'high', '{"make":"Smith & Wesson","model":"M&P 2.0 Compact","caliber":"9mm Luger","type":"Pistol","action":"Semi-Auto"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),
('082442860490', 'gun', 'high', '{"make":"Smith & Wesson","model":"M&P 2.0 Full Size","caliber":"9mm Luger","type":"Pistol","action":"Semi-Auto"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),
('082442860506', 'gun', 'high', '{"make":"Smith & Wesson","model":"M&P Shield Plus","caliber":"9mm Luger","type":"Pistol","action":"Semi-Auto"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),
('082442860513', 'gun', 'high', '{"make":"Smith & Wesson","model":"M&P Shield EZ","caliber":"9mm Luger","type":"Pistol","action":"Semi-Auto"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),
('082442860520', 'gun', 'high', '{"make":"Smith & Wesson","model":"Model 686","caliber":".357 Magnum","type":"Revolver","action":"Revolver"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),

('806703910362', 'gun', 'high', '{"make":"Springfield Armory","model":"Hellcat","caliber":"9mm Luger","type":"Pistol","action":"Semi-Auto"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),
('806703910379', 'gun', 'high', '{"make":"Springfield Armory","model":"XD-M Elite Compact","caliber":"9mm Luger","type":"Pistol","action":"Semi-Auto"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),
('806703910386', 'gun', 'high', '{"make":"Springfield Armory","model":"1911 Mil-Spec","caliber":".45 ACP","type":"Pistol","action":"Semi-Auto"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),

('787450702011', 'gun', 'high', '{"make":"Ruger","model":"LCP II","caliber":".380 ACP","type":"Pistol","action":"Semi-Auto"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),
('787450702028', 'gun', 'high', '{"make":"Ruger","model":"EC9s","caliber":"9mm Luger","type":"Pistol","action":"Semi-Auto"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),
('787450702035', 'gun', 'high', '{"make":"Ruger","model":"MAX-9","caliber":"9mm Luger","type":"Pistol","action":"Semi-Auto"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),
('787450702042', 'gun', 'high', '{"make":"Ruger","model":"GP100","caliber":".357 Magnum","type":"Revolver","action":"Revolver"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),
('787450702059', 'gun', 'high', '{"make":"Ruger","model":"Wrangler","caliber":".22 LR","type":"Revolver","action":"Revolver"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),

('723551500083', 'gun', 'high', '{"make":"CZ","model":"P-10 C","caliber":"9mm Luger","type":"Pistol","action":"Semi-Auto"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),
('723551500090', 'gun', 'high', '{"make":"CZ","model":"P-10 F","caliber":"9mm Luger","type":"Pistol","action":"Semi-Auto"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),
('723551500106', 'gun', 'high', '{"make":"CZ","model":"75 SP-01","caliber":"9mm Luger","type":"Pistol","action":"Semi-Auto"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),

-- ── RIFLES ───────────────────────────────────────────────────────────────────
('082442907002', 'gun', 'high', '{"make":"Smith & Wesson","model":"M&P 15 Sport II","caliber":"5.56x45mm NATO","type":"Rifle","action":"Semi-Auto"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),
('787450605015', 'gun', 'high', '{"make":"Ruger","model":"AR-556","caliber":"5.56x45mm NATO","type":"Rifle","action":"Semi-Auto"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),
('787450605022', 'gun', 'high', '{"make":"Ruger","model":"10/22 Carbine","caliber":".22 LR","type":"Rifle","action":"Semi-Auto"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),
('787450605039', 'gun', 'high', '{"make":"Ruger","model":"American Rifle","caliber":".308 Winchester","type":"Rifle","action":"Bolt"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),
('787450605046', 'gun', 'high', '{"make":"Ruger","model":"Precision Rifle","caliber":"6.5 Creedmoor","type":"Rifle","action":"Bolt"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),
('736676073726', 'gun', 'high', '{"make":"Mossberg","model":"Patriot","caliber":".308 Winchester","type":"Rifle","action":"Bolt"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),
('048702160097', 'gun', 'high', '{"make":"Savage Arms","model":"Axis II","caliber":".308 Winchester","type":"Rifle","action":"Bolt"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),
('048702160103', 'gun', 'high', '{"make":"Savage Arms","model":"110 Hunter","caliber":"6.5 Creedmoor","type":"Rifle","action":"Bolt"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),

-- ── SHOTGUNS ─────────────────────────────────────────────────────────────────
('736676073740', 'gun', 'high', '{"make":"Mossberg","model":"500 Field","caliber":"12 Gauge","type":"Shotgun","action":"Pump"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),
('736676073757', 'gun', 'high', '{"make":"Mossberg","model":"590A1","caliber":"12 Gauge","type":"Shotgun","action":"Pump"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),
('048702147327', 'gun', 'high', '{"make":"Remington","model":"870 Express","caliber":"12 Gauge","type":"Shotgun","action":"Pump"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),
('082442860537', 'gun', 'high', '{"make":"Smith & Wesson","model":"M&P 12","caliber":"12 Gauge","type":"Shotgun","action":"Pump"}', '{"make":"high","model":"high","caliber":"high"}', 'seed', true),

-- ── AMMO — Federal ───────────────────────────────────────────────────────────
('029465093396', 'ammo', 'high', '{"brand":"Federal","productLine":"HST","caliber":"9mm Luger","grainWeight":124,"bulletType":"JHP","quantity":50}', '{"brand":"high","caliber":"high","grainWeight":"high","bulletType":"high","quantity":"high"}', 'seed', true),
('029465093402', 'ammo', 'high', '{"brand":"Federal","productLine":"HST","caliber":"9mm Luger","grainWeight":147,"bulletType":"JHP","quantity":50}', '{"brand":"high","caliber":"high","grainWeight":"high","bulletType":"high","quantity":"high"}', 'seed', true),
('029465093419', 'ammo', 'high', '{"brand":"Federal","productLine":"HST","caliber":".45 ACP","grainWeight":230,"bulletType":"JHP","quantity":50}', '{"brand":"high","caliber":"high","grainWeight":"high","bulletType":"high","quantity":"high"}', 'seed', true),
('029465093426', 'ammo', 'high', '{"brand":"Federal","productLine":"HST","caliber":".40 S&W","grainWeight":180,"bulletType":"JHP","quantity":50}', '{"brand":"high","caliber":"high","grainWeight":"high","bulletType":"high","quantity":"high"}', 'seed', true),
('029465064709', 'ammo', 'high', '{"brand":"Federal","productLine":"American Eagle","caliber":"9mm Luger","grainWeight":115,"bulletType":"FMJ","quantity":50}', '{"brand":"high","caliber":"high","grainWeight":"high","bulletType":"high","quantity":"high"}', 'seed', true),
('029465064716', 'ammo', 'high', '{"brand":"Federal","productLine":"American Eagle","caliber":"9mm Luger","grainWeight":124,"bulletType":"FMJ","quantity":50}', '{"brand":"high","caliber":"high","grainWeight":"high","bulletType":"high","quantity":"high"}', 'seed', true),
('029465064723', 'ammo', 'high', '{"brand":"Federal","productLine":"American Eagle","caliber":".45 ACP","grainWeight":230,"bulletType":"FMJ","quantity":50}', '{"brand":"high","caliber":"high","grainWeight":"high","bulletType":"high","quantity":"high"}', 'seed', true),
('029465064730', 'ammo', 'high', '{"brand":"Federal","productLine":"American Eagle","caliber":".223 Remington","grainWeight":55,"bulletType":"FMJ","quantity":20}', '{"brand":"high","caliber":"high","grainWeight":"high","bulletType":"high","quantity":"high"}', 'seed', true),
('029465064747', 'ammo', 'high', '{"brand":"Federal","productLine":"American Eagle","caliber":".308 Winchester","grainWeight":150,"bulletType":"FMJ","quantity":20}', '{"brand":"high","caliber":"high","grainWeight":"high","bulletType":"high","quantity":"high"}', 'seed', true),

-- ── AMMO — Winchester ────────────────────────────────────────────────────────
('020892221246', 'ammo', 'high', '{"brand":"Winchester","productLine":"USA White Box","caliber":"9mm Luger","grainWeight":115,"bulletType":"FMJ","quantity":50}', '{"brand":"high","caliber":"high","grainWeight":"high","bulletType":"high","quantity":"high"}', 'seed', true),
('020892221253', 'ammo', 'high', '{"brand":"Winchester","productLine":"USA White Box","caliber":"9mm Luger","grainWeight":115,"bulletType":"FMJ","quantity":100}', '{"brand":"high","caliber":"high","grainWeight":"high","bulletType":"high","quantity":"high"}', 'seed', true),
('020892221260', 'ammo', 'high', '{"brand":"Winchester","productLine":"USA White Box","caliber":".45 ACP","grainWeight":230,"bulletType":"FMJ","quantity":50}', '{"brand":"high","caliber":"high","grainWeight":"high","bulletType":"high","quantity":"high"}', 'seed', true),
('020892221277', 'ammo', 'high', '{"brand":"Winchester","productLine":"USA White Box","caliber":".223 Remington","grainWeight":55,"bulletType":"FMJ","quantity":20}', '{"brand":"high","caliber":"high","grainWeight":"high","bulletType":"high","quantity":"high"}', 'seed', true),
('020892221284', 'ammo', 'high', '{"brand":"Winchester","productLine":"Defender","caliber":"9mm Luger","grainWeight":124,"bulletType":"JHP","quantity":20}', '{"brand":"high","caliber":"high","grainWeight":"high","bulletType":"high","quantity":"high"}', 'seed', true),
('020892221291', 'ammo', 'high', '{"brand":"Winchester","productLine":"Defender","caliber":".45 ACP","grainWeight":230,"bulletType":"JHP","quantity":20}', '{"brand":"high","caliber":"high","grainWeight":"high","bulletType":"high","quantity":"high"}', 'seed', true),

-- ── AMMO — Hornady ──────────────────────────────────────────────────────────
('090255090451', 'ammo', 'high', '{"brand":"Hornady","productLine":"Critical Defense","caliber":"9mm Luger","grainWeight":115,"bulletType":"FTX","quantity":25}', '{"brand":"high","caliber":"high","grainWeight":"high","bulletType":"high","quantity":"high"}', 'seed', true),
('090255090468', 'ammo', 'high', '{"brand":"Hornady","productLine":"Critical Defense","caliber":".45 ACP","grainWeight":185,"bulletType":"FTX","quantity":20}', '{"brand":"high","caliber":"high","grainWeight":"high","bulletType":"high","quantity":"high"}', 'seed', true),
('090255090475', 'ammo', 'high', '{"brand":"Hornady","productLine":"Critical Duty","caliber":"9mm Luger","grainWeight":135,"bulletType":"FlexLock","quantity":25}', '{"brand":"high","caliber":"high","grainWeight":"high","bulletType":"high","quantity":"high"}', 'seed', true),
('090255090482', 'ammo', 'high', '{"brand":"Hornady","productLine":"American Gunner","caliber":"9mm Luger","grainWeight":115,"bulletType":"XTP","quantity":25}', '{"brand":"high","caliber":"high","grainWeight":"high","bulletType":"high","quantity":"high"}', 'seed', true),
('090255090499', 'ammo', 'high', '{"brand":"Hornady","productLine":"ELD-X","caliber":"6.5 Creedmoor","grainWeight":143,"bulletType":"ELD-X","quantity":20}', '{"brand":"high","caliber":"high","grainWeight":"high","bulletType":"high","quantity":"high"}', 'seed', true),
('090255090505', 'ammo', 'high', '{"brand":"Hornady","productLine":"ELD Match","caliber":".308 Winchester","grainWeight":168,"bulletType":"ELD Match","quantity":20}', '{"brand":"high","caliber":"high","grainWeight":"high","bulletType":"high","quantity":"high"}', 'seed', true),

-- ── AMMO — Speer ────────────────────────────────────────────────────────────
('076683023858', 'ammo', 'high', '{"brand":"Speer","productLine":"Gold Dot","caliber":"9mm Luger","grainWeight":124,"bulletType":"GDHP","quantity":50}', '{"brand":"high","caliber":"high","grainWeight":"high","bulletType":"high","quantity":"high"}', 'seed', true),
('076683023865', 'ammo', 'high', '{"brand":"Speer","productLine":"Gold Dot","caliber":".40 S&W","grainWeight":165,"bulletType":"GDHP","quantity":50}', '{"brand":"high","caliber":"high","grainWeight":"high","bulletType":"high","quantity":"high"}', 'seed', true),
('076683023872', 'ammo', 'high', '{"brand":"Speer","productLine":"Gold Dot","caliber":".45 ACP","grainWeight":230,"bulletType":"GDHP","quantity":50}', '{"brand":"high","caliber":"high","grainWeight":"high","bulletType":"high","quantity":"high"}', 'seed', true),
('076683014733', 'ammo', 'high', '{"brand":"Speer","productLine":"Lawman","caliber":"9mm Luger","grainWeight":115,"bulletType":"TMJ","quantity":50}', '{"brand":"high","caliber":"high","grainWeight":"high","bulletType":"high","quantity":"high"}', 'seed', true),

-- ── AMMO — Remington ────────────────────────────────────────────────────────
('047700494005', 'ammo', 'high', '{"brand":"Remington","productLine":"UMC","caliber":"9mm Luger","grainWeight":115,"bulletType":"MC","quantity":50}', '{"brand":"high","caliber":"high","grainWeight":"high","bulletType":"high","quantity":"high"}', 'seed', true),
('047700494012', 'ammo', 'high', '{"brand":"Remington","productLine":"UMC","caliber":".45 ACP","grainWeight":230,"bulletType":"MC","quantity":50}', '{"brand":"high","caliber":"high","grainWeight":"high","bulletType":"high","quantity":"high"}', 'seed', true),
('047700494029', 'ammo', 'high', '{"brand":"Remington","productLine":"Golden Saber","caliber":"9mm Luger","grainWeight":124,"bulletType":"BJHP","quantity":25}', '{"brand":"high","caliber":"high","grainWeight":"high","bulletType":"high","quantity":"high"}', 'seed', true),

-- ── AMMO — CCI / Blazer ─────────────────────────────────────────────────────
('076683035004', 'ammo', 'high', '{"brand":"CCI","productLine":"Blazer Brass","caliber":"9mm Luger","grainWeight":115,"bulletType":"FMJ","quantity":50}', '{"brand":"high","caliber":"high","grainWeight":"high","bulletType":"high","quantity":"high"}', 'seed', true),
('076683035011', 'ammo', 'high', '{"brand":"CCI","productLine":"Blazer Brass","caliber":".45 ACP","grainWeight":230,"bulletType":"FMJ","quantity":50}', '{"brand":"high","caliber":"high","grainWeight":"high","bulletType":"high","quantity":"high"}', 'seed', true),
('076683009043', 'ammo', 'high', '{"brand":"CCI","productLine":"Mini-Mag","caliber":".22 LR","grainWeight":36,"bulletType":"CPHP","quantity":100}', '{"brand":"high","caliber":"high","grainWeight":"high","bulletType":"high","quantity":"high"}', 'seed', true),
('076683009050', 'ammo', 'high', '{"brand":"CCI","productLine":"Stinger","caliber":".22 LR","grainWeight":32,"bulletType":"CPHP","quantity":50}', '{"brand":"high","caliber":"high","grainWeight":"high","bulletType":"high","quantity":"high"}', 'seed', true)

ON CONFLICT (upc) DO NOTHING;

-- Index for fast lookup (PK index already covers this, but explicit for clarity)
-- CREATE INDEX IF NOT EXISTS upc_products_upc_idx ON public.upc_products (upc);
-- (Skipped — PRIMARY KEY already creates the index)
