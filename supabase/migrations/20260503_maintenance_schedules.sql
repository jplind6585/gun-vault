-- =============================================================================
-- Maintenance Schedules Reference Table
-- Created: 2026-05-03
-- =============================================================================
-- manufacturer_aliases: additional make spellings the app should match
-- model_pattern: NULL = applies to all models for that manufacturer
-- model_series: human-readable label for grouped display
-- gun_type: pistol | rifle | shotgun | revolver | NULL (platform-wide)
-- interval_type: before_first_use | after_each_use | round_count | annual | environmental | storage
-- interval_rounds: rounds between service (round_count type)
-- interval_days: days between service (annual type)
-- priority: critical | high | normal | low
-- =============================================================================

CREATE TABLE IF NOT EXISTS maintenance_schedules (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer         TEXT        NOT NULL,
  manufacturer_aliases TEXT[]      NOT NULL DEFAULT '{}',
  model_pattern        TEXT,
  model_series         TEXT,
  gun_type             TEXT,
  task_name            TEXT        NOT NULL,
  interval_type        TEXT        NOT NULL CHECK (interval_type IN (
                         'before_first_use','after_each_use','round_count','annual','environmental','storage'
                       )),
  interval_rounds      INTEGER,
  interval_days        INTEGER,
  priority             TEXT        NOT NULL DEFAULT 'normal' CHECK (priority IN ('critical','high','normal','low')),
  description          TEXT        NOT NULL,
  parts_required       TEXT[]      NOT NULL DEFAULT '{}',
  tools_required       TEXT[]      NOT NULL DEFAULT '{}',
  estimated_minutes    INTEGER,
  pro_tip              TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Public read — reference data, no auth required
ALTER TABLE maintenance_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_maintenance_schedules"
  ON maintenance_schedules FOR SELECT USING (true);

-- Index for fast make-matching queries
CREATE INDEX IF NOT EXISTS idx_maint_manufacturer ON maintenance_schedules(manufacturer);

-- =============================================================================
-- User Maintenance Logs — tracks per-gun task completions
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_maintenance_logs (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gun_id                    TEXT        NOT NULL,
  schedule_id               UUID        REFERENCES maintenance_schedules(id) ON DELETE SET NULL,
  task_name                 TEXT        NOT NULL,
  completed_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  round_count_at_completion INTEGER,
  notes                     TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_maintenance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_maintenance_logs"
  ON user_maintenance_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_maint_logs_gun ON user_maintenance_logs(gun_id);
CREATE INDEX IF NOT EXISTS idx_maint_logs_user ON user_maintenance_logs(user_id);

-- =============================================================================
-- SEED DATA
-- =============================================================================

INSERT INTO maintenance_schedules
  (manufacturer, manufacturer_aliases, model_series, gun_type, task_name,
   interval_type, interval_rounds, interval_days, priority, description,
   parts_required, tools_required, estimated_minutes, pro_tip)
VALUES

-- ─────────────────────────────────────────────────────────────────────────────
-- GLOCK (all models)
-- ─────────────────────────────────────────────────────────────────────────────
('Glock', '{}', 'All Models', 'pistol',
 'Initial Cleaning & Lubrication',
 'before_first_use', NULL, NULL, 'high',
 'Remove factory Tenifer preservative from bore and slide channels. Apply Glock-approved lubricant to the four critical lube points: barrel hood (where barrel meets slide), trigger bar/connector interface, and left/right frame rail notches. Function-test all safeties before first live-fire session.',
 '{}', ARRAY['Cleaning rod','Bore brush','Patches','Glock lube or Slip 2000'], 20,
 'Glock ships with minimal factory grease — a thorough clean and re-lube before first range trip dramatically reduces break-in malfunctions.'),

('Glock', '{}', 'All Models', 'pistol',
 'Field Strip, Clean & Lube',
 'after_each_use', NULL, NULL, 'high',
 'Field strip to barrel, recoil spring assembly, and slide. Scrub bore with bronze bore brush, run dry patches, then a lightly-oiled patch. Wipe carbon from slide interior and barrel hood. Brush frame rails. Apply a small drop of lubricant to the four lube points. Reassemble and function-check trigger.',
 '{}', ARRAY['Cleaning rod','Bore brush','Patches','Bronze brush','Solvent','Lubricant'], 15,
 'Only four lube points needed. Over-lubing a Glock causes malfunctions — less is more.'),

('Glock', '{}', 'All Models', 'pistol',
 'Extractor & Spring-Loaded Bearing Inspection',
 'round_count', 3000, NULL, 'normal',
 'Inspect extractor for chips, deformation, or carbon buildup in the extractor tunnel. Check the spring-loaded bearing device (SLBD) for free movement. Clean the extractor tunnel with a dental pick or Glock tool. A worn extractor is the leading cause of FTE malfunctions.',
 '{}', ARRAY['Glock armorer tool or dental pick','Solvent'], 10,
 'Remove the extractor using a punch and inspect the loaded chamber indicator notch for rounded edges — a sign it''s nearing end-of-life.'),

('Glock', '{}', 'All Models', 'pistol',
 'Recoil Spring Assembly Replacement',
 'round_count', 5000, NULL, 'high',
 'Replace the captured dual recoil spring assembly. The RSA is a consumable component — Glock recommends replacement at 5,000 rounds. A worn RSA causes inconsistent cycling, increased felt recoil, and can lead to failures to return to battery. Use OEM Glock RSA for your specific model and generation.',
 ARRAY['Glock OEM Recoil Spring Assembly (model-specific)'], '{}', 5,
 'Gen 4+ RSAs are not interchangeable with Gen 3. Note the Gen/model on the part before ordering.'),

('Glock', '{}', 'All Models', 'pistol',
 'Extractor Spring & SLBD Replacement',
 'round_count', 10000, NULL, 'normal',
 'Replace the extractor spring and spring-loaded bearing device as a set. At high round counts these springs fatigue, causing extraction reliability issues. Glock armorer replacement kits include both components.',
 ARRAY['Glock extractor spring','Glock SLBD'], ARRAY['Glock armorer tool','1/8" punch'], 15,
 'Order a complete Glock armorer spring kit — it includes extractor spring, SLBD, and trigger spring for ~$10 and covers 10k-mile service.'),

('Glock', '{}', 'All Models', 'pistol',
 'Full Trigger Group Inspection',
 'round_count', 15000, NULL, 'normal',
 'Detail strip the slide and frame. Inspect connector angle and engagement surfaces for wear. Check trigger bar for deformation at the cruciform. Verify trigger spring integrity. Clean striker channel and inspect striker for tip cracks. Measure trigger pull with gauge — should be within Glock spec (5.5 lb for standard connector).',
 '{}', ARRAY['Glock armorer tool','Trigger pull gauge','Dental pick'], 30,
 'A $0.25 connector is one of the most common wear items. If trigger pull has crept up 0.5+ lb, a new connector often restores it.'),

('Glock', '{}', 'All Models', 'pistol',
 'Post-Water Exposure Inspection',
 'environmental', NULL, NULL, 'high',
 'After exposure to rain, submersion, or heavy mud: disassemble fully, dry all surfaces, inspect for corrosion on spring components (Tenifer frame/slide resist rust but springs do not). Re-lube all bearing surfaces. Function-check trigger and magazine release before returning to service.',
 '{}', ARRAY['Compressed air','Cleaning rod','Lubricant'], 20,
 'Glock''s Tenifer surface treatment makes the polymer frame and slide extremely corrosion-resistant — but springs are not. Always inspect springs after submersion.'),

-- ─────────────────────────────────────────────────────────────────────────────
-- SMITH & WESSON — M&P Series (pistols)
-- ─────────────────────────────────────────────────────────────────────────────
('Smith & Wesson', ARRAY['S&W','Smith and Wesson'], 'M&P Series', 'pistol',
 'Initial Cleaning & Lubrication',
 'before_first_use', NULL, NULL, 'high',
 'Wipe preservative from bore and apply light oil to slide rails, barrel hood, and trigger bar/sear housing. The M&P ships with minimal factory lubrication — apply a thin film to the four contact points: left/right slide rails, barrel hood, and barrel feed ramp area. Function-test all safeties.',
 '{}', ARRAY['Cleaning rod','Bore brush','Patches','M&P or CLP lubricant'], 20, NULL),

('Smith & Wesson', ARRAY['S&W','Smith and Wesson'], 'M&P Series', 'pistol',
 'Field Strip, Clean & Lube',
 'after_each_use', NULL, NULL, 'high',
 'Field strip to four components. Clean barrel bore and exterior. Wipe slide interior of carbon fouling. Clean frame rails. Apply thin lube to slide rails and barrel hood. Reassemble and rack slide 3–5 times to distribute lubricant evenly.',
 '{}', ARRAY['Cleaning rod','Bore brush','Patches','Solvent','Lubricant'], 15,
 'The M&P''s sear housing block accumulates carbon — use a dental pick to clean around it every 1,000 rounds.'),

('Smith & Wesson', ARRAY['S&W','Smith and Wesson'], 'M&P Series', 'pistol',
 'Recoil Spring Replacement',
 'round_count', 5000, NULL, 'normal',
 'Replace the recoil spring assembly. The M&P''s captured spring assembly is a consumable; S&W recommends 5,000-round intervals. Compact/Shield variants may benefit from earlier replacement (3,000 rounds) due to shorter spring travel.',
 ARRAY['S&W M&P OEM Recoil Spring Assembly'], '{}', 5, NULL),

('Smith & Wesson', ARRAY['S&W','Smith and Wesson'], 'M&P Series', 'pistol',
 'Trigger Return & Sear Spring Inspection',
 'round_count', 10000, NULL, 'normal',
 'Inspect the trigger return spring and sear spring for fatigue. Signs of wear include a mushy trigger reset or light primer strikes. Replacement requires partial disassembly of the sear housing — best done by an M&P-certified armorer if unfamiliar.',
 ARRAY['S&W M&P spring kit'], ARRAY['Punch set','Armorer''s block'], 25, NULL),

('Smith & Wesson', ARRAY['S&W','Smith and Wesson'], 'M&P Series', 'pistol',
 'Annual Detail Strip & Striker Channel Clean',
 'annual', NULL, 365, 'normal',
 'Full detail strip including sear housing removal. Clean the striker channel of any carbon buildup — fouled striker channels cause light primer strikes. Inspect the sear housing for cracks. Inspect frame rails for peening. Re-lube all contact surfaces and reassemble.',
 '{}', ARRAY['Punch set','Armorer''s block','Dental pick','Solvent'], 45,
 'The M&P''s striker channel is notorious for carbon accumulation. Annual cleaning prevents hard-to-diagnose light strikes.'),

-- ─────────────────────────────────────────────────────────────────────────────
-- SMITH & WESSON — Revolvers (J/K/L/N/X Frame)
-- ─────────────────────────────────────────────────────────────────────────────
('Smith & Wesson', ARRAY['S&W','Smith and Wesson'], 'Revolver Series', 'revolver',
 'Clean Cylinder, Barrel & Forcing Cone',
 'after_each_use', NULL, NULL, 'high',
 'Swab the bore with a bronze bore brush and patches. Use a cylinder brush or .38-cal bore brush to clean each of the six cylinder chambers. Clean the forcing cone (critical — carbon buildup here causes leading and accuracy degradation). Wipe the extractor rod and crane. Apply light oil to the crane pivot.',
 '{}', ARRAY['Bore brush','Cylinder brush','Patches','Solvent','Lubricant'], 20,
 'The forcing cone accumulates the most lead and carbon on revolvers — neglecting it is the #1 cause of accuracy loss.'),

('Smith & Wesson', ARRAY['S&W','Smith and Wesson'], 'Revolver Series', 'revolver',
 'Cylinder Gap & Timing Check',
 'round_count', 2000, NULL, 'high',
 'Measure the barrel-cylinder gap with feeler gauges — should be 0.003"–0.006" on most S&W revolvers. Check cylinder timing: slowly cock the hammer and verify each chamber aligns perfectly with the forcing cone before hammer falls. A timing issue causes leading, damage, and dangerous gas cutting.',
 '{}', ARRAY['Feeler gauge set'], 15,
 'A gap under 0.002" risks cylinder touching the barrel and binding. Over 0.010" means excessive gas escape and velocity loss.'),

('Smith & Wesson', ARRAY['S&W','Smith and Wesson'], 'Revolver Series', 'revolver',
 'Mainspring & Trigger Return Spring Inspection',
 'round_count', 5000, NULL, 'normal',
 'Inspect mainspring (hammer spring) and trigger return spring for fatigue or deformation. A worn mainspring causes light primer strikes — particularly relevant if running stiff +P defensive loads. Replacement is straightforward but requires side-plate removal.',
 ARRAY['S&W revolver spring kit (frame-specific)'], ARRAY['Brass-tipped punch','Side-plate mallet'], 30, NULL),

('Smith & Wesson', ARRAY['S&W','Smith and Wesson'], 'Revolver Series', 'revolver',
 'Annual Deep Clean & Lockwork Inspection',
 'annual', NULL, 365, 'normal',
 'Remove the side-plate and inspect the lockwork for wear on the hand, cylinder stop, and trigger/hammer sears. Clean all lockwork components of carbon and lead residue. Lightly oil all pivot pins and springs. Inspect the extractor rod for straightness — bent extractor rods cause cylinder binding under recoil.',
 '{}', ARRAY['Brass-tipped punch','Dental pick','Side-plate mallet','Solvent','Light oil'], 45, NULL),

-- ─────────────────────────────────────────────────────────────────────────────
-- SIG SAUER — P-Series (P226, P229, P320, P365)
-- ─────────────────────────────────────────────────────────────────────────────
('Sig Sauer', ARRAY['SIG Sauer','SIG','Sigarms'], 'P-Series', 'pistol',
 'Initial Cleaning & Lubrication',
 'before_first_use', NULL, NULL, 'high',
 'SIG pistols ship with preservative grease — clean the bore thoroughly and wipe all slide/frame rail surfaces. Apply SIG''s recommended lubricant (or equivalent CLP) to slide rails, barrel hood, and barrel cam lug. The P320 FCU should have its chassis lightly lubricated at the trigger bar interface.',
 '{}', ARRAY['Cleaning rod','Bore brush','Patches','SIG lub or CLP'], 20, NULL),

('Sig Sauer', ARRAY['SIG Sauer','SIG','Sigarms'], 'P-Series', 'pistol',
 'Field Strip, Clean & Lube',
 'after_each_use', NULL, NULL, 'high',
 'Field strip to four components. Clean bore and chamber. Wipe carbon from slide interior. Clean frame rail channels with a brush. Lightly lube the four contact points: slide rails (both sides), barrel hood, and barrel cam lug. Reassemble and function-check.',
 '{}', ARRAY['Cleaning rod','Bore brush','Patches','Solvent','CLP or SIG lube'], 15, NULL),

('Sig Sauer', ARRAY['SIG Sauer','SIG','Sigarms'], 'P320 FCU', 'pistol',
 'P320 Striker Safety & FCU Inspection',
 'round_count', 3000, NULL, 'high',
 'Specific to P320: inspect the voluntary upgrade (if not yet completed) for the striker safety and disconnector geometry. Verify the striker safety fully engages when the trigger is in the forward position. If your P320 has not received the voluntary upgrade, contact SIG for service. Clean the FCU striker channel quarterly.',
 '{}', ARRAY['Dental pick','Solvent'], 10,
 'SIG issued a voluntary upgrade for P320 pistols in 2017. If your serial number predates the upgrade, verify completion at sigsauer.com.'),

('Sig Sauer', ARRAY['SIG Sauer','SIG','Sigarms'], 'P-Series', 'pistol',
 'Recoil Spring Assembly Replacement',
 'round_count', 5000, NULL, 'normal',
 'Replace the recoil spring assembly. P226/P229 use a captive double spring; P320/P365 use a captured flat spring assembly. Use only SIG OEM springs for your specific variant — spring weights differ between calibers and frame sizes.',
 ARRAY['SIG OEM Recoil Spring Assembly (model/caliber-specific)'], '{}', 5, NULL),

('Sig Sauer', ARRAY['SIG Sauer','SIG','Sigarms'], 'P-Series DA/SA', 'pistol',
 'Decocker & Safety Function Check',
 'annual', NULL, 365, 'normal',
 'For DA/SA models (P226, P229): function-test the decocker — cock the hammer and use the decocker lever, verify the hammer drops safely without firing. Inspect decocker spring for fatigue. Clean the decocker shaft with a dental pick. Verify the safety lever (if equipped) blocks the hammer fully.',
 '{}', ARRAY['Dental pick','Armorer''s tool'], 20, NULL),

('Sig Sauer', ARRAY['SIG Sauer','SIG','Sigarms'], 'P-Series', 'pistol',
 'Annual FCU / Trigger Group Detail Clean',
 'annual', NULL, 365, 'normal',
 'Remove the FCU or trigger group (P320: pull FCU from grip module). Inspect and clean all sear engagement surfaces. Clear carbon from the striker channel. Inspect trigger bar and disconnector for wear marks. Lightly oil all pivot points. The P320 FCU is particularly easy to detail-clean without tools.',
 '{}', ARRAY['Dental pick','Punch set (for metal-frame SIGs)','Solvent','Light oil'], 40, NULL),

-- ─────────────────────────────────────────────────────────────────────────────
-- RUGER — 10/22
-- ─────────────────────────────────────────────────────────────────────────────
('Ruger', '{}', '10/22', 'rifle',
 'Remove Packing Preservative & Initial Cleaning',
 'before_first_use', NULL, NULL, 'high',
 'Ruger ships the 10/22 with a light preservative in the bore and action. Run several dry patches through the bore followed by a lightly-oiled patch. Wipe down the receiver interior and bolt face. The 10/22 is semi-rimfire-tolerant but a clean bore ensures tight groups from the first session.',
 '{}', ARRAY['Cleaning rod','Bore brush (.22 cal)','Patches','Solvent'], 20, NULL),

('Ruger', '{}', '10/22', 'rifle',
 'Barrel & Action Clean',
 'after_each_use', NULL, NULL, 'normal',
 'Run a bore brush followed by patches until clean. .22 LR produces heavy lead fouling — use a lead-removal solvent at least every 500 rounds. Wipe bolt face clean. Apply a light film of oil to the bolt and receiver rail. The 10/22 is reliable through significant fouling but bore accuracy degrades without cleaning.',
 '{}', ARRAY['Cleaning rod','.22 bore brush','Patches','Lead-removal solvent','Light oil'], 15,
 'Kroil or similar penetrating oil removes stubborn .22 LR lead deposits better than standard CLP.'),

('Ruger', '{}', '10/22', 'rifle',
 'Recoil Buffer & Recoil Spring Inspection',
 'round_count', 2000, NULL, 'normal',
 'Inspect the recoil buffer (a small rubber/polymer bumper at the rear of the receiver) for compression or cracking. A deteriorated buffer allows the bolt to impact the receiver, causing peening. Replace the recoil spring if the action feels sluggish or bolt doesn''t return to battery consistently. Aftermarket buffers (Volquartsen) recommended for high-round-count guns.',
 ARRAY['Ruger 10/22 recoil buffer','Recoil spring (optional)'], ARRAY['Flathead screwdriver'], 10,
 'A $3 recoil buffer replacement is the highest-value maintenance item on the 10/22.'),

('Ruger', '{}', '10/22', 'rifle',
 'Trigger Group Deep Clean & Inspection',
 'annual', NULL, 365, 'normal',
 'Remove the trigger group from the receiver (cross-pin removal). Clean the sear, disconnector, and hammer engagement surfaces of accumulated rimfire lead residue. Rimfire fouling packs into trigger groups and causes creep and unpredictable reset over time. Inspect trigger/hammer pins for wear.',
 '{}', ARRAY['1/8" punch','Small hammer','Dental pick','Solvent','Light oil'], 30, NULL),

('Ruger', '{}', '10/22', 'rifle',
 'Rotary Magazine Disassembly & Clean',
 'round_count', 1000, NULL, 'low',
 'Disassemble the rotary magazine into its five components (two halves, rotor, follower, spring). Remove rimfire fouling from the feed lips and rotor channels — .22 LR wax buildup here causes feed failures. Inspect feed lips for deformation.',
 '{}', ARRAY['Dental pick','Solvent'], 10, NULL),

-- ─────────────────────────────────────────────────────────────────────────────
-- AR-15 PLATFORM
-- ─────────────────────────────────────────────────────────────────────────────
('AR-15 Platform', ARRAY['Aero Precision','Daniel Defense','BCM','Bravo Company','CMMG','LMT','Lewis Machine','LaRue','Windham','Stag Arms','PSA','Palmetto State Armory','LWRC','Noveske','Rainier Arms'], 'AR-15 / M4', 'rifle',
 'Initial BCG Lubrication',
 'before_first_use', NULL, NULL, 'high',
 'AR-15s often ship dry or with a light preservative coat. Before first firing, lubricate the BCG (bolt carrier group) heavily — the AR-15 is a wet system that needs generous oil on the carrier, bolt cam pin, and gas key. Apply 3–4 drops to the carrier body, 1 drop to the cam pin, 1 drop to the charging handle key. Apply light lube to buffer and buffer spring.',
 '{}', ARRAY['Solvent','Mil-spec lubricant or grease'], 15,
 'The AR-15 runs best wet. "If in doubt, add more oil" is better than running dry — carbon buildup on a dry BCG is far harder to clean than a wet one.'),

('AR-15 Platform', ARRAY['Aero Precision','Daniel Defense','BCM','Bravo Company','CMMG','LMT','Lewis Machine','LaRue','Windham','Stag Arms','PSA','Palmetto State Armory','LWRC','Noveske','Rainier Arms'], 'AR-15 / M4', 'rifle',
 'BCG Clean & Lube',
 'after_each_use', NULL, NULL, 'high',
 'Remove BCG and charging handle. Scrape carbon from the bolt carrier tail and inside of the carrier key using a carbon scraper. Run bore brush + patches through barrel. Clean bolt face and gas rings area with a brush. Re-lube the carrier body and cam pin generously. Wipe carbon from the upper receiver interior and buffer tube if accessible.',
 '{}', ARRAY['AR-15 carbon scraper','Bore brush (.223/5.56)','Patches','Solvent','Mil-spec lube'], 20, NULL),

('AR-15 Platform', ARRAY['Aero Precision','Daniel Defense','BCM','Bravo Company','CMMG','LMT','Lewis Machine','LaRue','Windham','Stag Arms','PSA','Palmetto State Armory','LWRC','Noveske','Rainier Arms'], 'AR-15 / M4', 'rifle',
 'Gas Ring Replacement',
 'round_count', 1500, NULL, 'high',
 'Inspect the three bolt gas rings for carbon buildup and springback. Stack-test: push the bolt tail into the carrier fully, stand the assembly on the bolt face — it should support its own weight without the bolt dropping. If the bolt drops, the rings are worn and require replacement. Worn gas rings cause failure-to-eject and short-stroking.',
 ARRAY['Bolt gas ring set (3 rings)'], ARRAY['AR-15 armorer''s block','Punch'], 15,
 'Three rings, each with the gap staggered 120° apart when installed. Never align all three gaps — this causes instant gas loss.'),

('AR-15 Platform', ARRAY['Aero Precision','Daniel Defense','BCM','Bravo Company','CMMG','LMT','Lewis Machine','LaRue','Windham','Stag Arms','PSA','Palmetto State Armory','LWRC','Noveske','Rainier Arms'], 'AR-15 / M4', 'rifle',
 'Buffer Spring Replacement',
 'round_count', 3000, NULL, 'normal',
 'Replace the buffer spring when the action feels noticeably heavier, when you hear increased "twanging" during cycling, or at scheduled interval. A fatigued buffer spring reduces bolt velocity, causing failures to feed and inconsistent brass ejection. H2 and H3 buffers combined with carbine springs are popular for suppressed use.',
 ARRAY['AR-15 buffer spring (carbine or rifle length)'], '{}', 5, NULL),

('AR-15 Platform', ARRAY['Aero Precision','Daniel Defense','BCM','Bravo Company','CMMG','LMT','Lewis Machine','LaRue','Windham','Stag Arms','PSA','Palmetto State Armory','LWRC','Noveske','Rainier Arms'], 'AR-15 / M4', 'rifle',
 'Extractor Spring & O-Ring Replacement',
 'round_count', 5000, NULL, 'normal',
 'Replace the extractor spring and black O-ring insert. The O-ring dramatically increases extractor tension and is the single most impactful reliability upgrade on an AR-15. Standard mil-spec spring plus the black O-ring (or a D-Fender insert) should be replaced together. A worn extractor spring is the #1 cause of intermittent FTE in high-round-count ARs.',
 ARRAY['BCM or D&H extractor spring','Extractor O-ring or D-Fender insert'], ARRAY['Bolt disassembly tool or small punch'], 10,
 'The black D-Fender insert makes the spring change tool-free. Keep 5 extras in your range bag.'),

('AR-15 Platform', ARRAY['Aero Precision','Daniel Defense','BCM','Bravo Company','CMMG','LMT','Lewis Machine','LaRue','Windham','Stag Arms','PSA','Palmetto State Armory','LWRC','Noveske','Rainier Arms'], 'AR-15 / M4', 'rifle',
 'Barrel Throat Erosion Inspection',
 'round_count', 7500, NULL, 'normal',
 'Inspect the barrel throat (first 1–2 inches of rifling past the chamber) with a bore light for erosion, wash-out of rifling, or visible surface cracking. High round counts with 5.56 NATO or .223 Wylde erode the throat over time, degrading accuracy. Measure throat using a bore micrometer or headspace gauges if accuracy has noticeably dropped.',
 '{}', ARRAY['Bore light','Headspace gauges (Go/No-Go/Field)'], 15, NULL),

('AR-15 Platform', ARRAY['Aero Precision','Daniel Defense','BCM','Bravo Company','CMMG','LMT','Lewis Machine','LaRue','Windham','Stag Arms','PSA','Palmetto State Armory','LWRC','Noveske','Rainier Arms'], 'AR-15 / M4', 'rifle',
 'Post-Water / Mud Exposure Decontamination',
 'environmental', NULL, NULL, 'critical',
 'After water or mud exposure: clear the weapon, remove the BCG and inspect the gas tube for mud/debris (obstruct and it will cause overpressure or failure to cycle). Clean the gas port in the barrel. Flush the gas tube if accessible. Scrub BCG thoroughly. Verify the bore is unobstructed before next use. A mud-clogged gas port can cause a dangerous out-of-battery detonation.',
 '{}', ARRAY['Gas tube brush','Compressed air','Bore brush','Solvent'], 30,
 'If in doubt about bore obstruction after a fall in mud — remove the BCG and visually verify the bore is clear before firing.'),

-- ─────────────────────────────────────────────────────────────────────────────
-- REMINGTON — 700 Series
-- ─────────────────────────────────────────────────────────────────────────────
('Remington', ARRAY['Remington Arms'], '700 Series', 'rifle',
 'Remove Shipping Preservative',
 'before_first_use', NULL, NULL, 'high',
 'Remington 700s ship with a protective bore lacquer or heavy grease in the bore and action. Run multiple dry patches through the bore to remove preservative, then a dry-wipe patch. Clean the chamber with a chamber brush. Inspect the action for any remaining grease in the extractor channel or bolt raceway. Apply light oil before first use.',
 '{}', ARRAY['Cleaning rod','Bore brush (.30 or appropriate caliber)','Patches','Chamber brush','Solvent'], 25,
 'Factory bore preservative ruins accuracy on the first group — always clean before zeroing.'),

('Remington', ARRAY['Remington Arms'], '700 Series', 'rifle',
 'Bore & Chamber Cleaning',
 'after_each_use', NULL, NULL, 'high',
 'Run a bronze bore brush through the bore 8–10 passes, followed by dry patches until clean, then a lightly-oiled patch. Clean the chamber and bolt face with a chamber brush and patches. Wipe the bolt body and locking lug recesses. Apply a very light film of grease (not oil) to the bolt body and locking lugs — heavy oil on a bolt-action attracting grit causes cycling issues.',
 '{}', ARRAY['Cleaning rod','Bore brush (caliber-specific)','Patches','Chamber brush','Light bolt grease'], 15, NULL),

('Remington', ARRAY['Remington Arms'], '700 Series', 'rifle',
 'Firing Pin & Spring Inspection',
 'round_count', 3000, NULL, 'normal',
 'Remove the bolt from the receiver and disassemble the firing pin assembly. Inspect the firing pin tip for flattening, pitting, or mushrooming (indicates hard primer strikes or high round count). Check the firing pin spring for coil separation or kinking. Clean the firing pin channel of carbon. Firing pin issues cause light strikes or high primers.',
 '{}', ARRAY['Remington 700 bolt disassembly tool or coin-slot tool','Solvent'], 20, NULL),

('Remington', ARRAY['Remington Arms'], '700 Series', 'rifle',
 'Trigger Group Inspection & Clean',
 'annual', NULL, 365, 'normal',
 'Inspect the trigger adjustment screws for migration (environmental vibration can shift them). Re-verify trigger pull weight with a scale. Clean the trigger group sear surfaces of any carbon or debris. If equipped with a X-Mark Pro or aftermarket trigger, follow the manufacturer''s cleaning schedule. Check the safety for full engagement.',
 '{}', ARRAY['Trigger pull gauge','Solvent','Dental pick'], 20,
 'Never dry-fire the 700 repeatedly without a snapcap — it peens the firing pin channel over time.'),

('Remington', ARRAY['Remington Arms'], '700 Series', 'rifle',
 'Scope Mount Torque Check',
 'annual', NULL, 365, 'normal',
 'Re-torque all scope base screws (65 in-lbs for 8-40 screws), ring screws (15–18 in-lbs for standard rings), and action screws (45–65 in-lbs depending on stock type). Loose mount screws are the leading cause of unexplained zero shifts. Apply medium-strength thread locker after torquing.',
 '{}', ARRAY['Wheeler FAT wrench or Torque driver','Thread locker (Loctite 243 blue)'], 15,
 'Re-check scope torque after every 200+ round session. Recoil vibration loosens screws faster than you''d expect.'),

-- ─────────────────────────────────────────────────────────────────────────────
-- 1911 PLATFORM
-- ─────────────────────────────────────────────────────────────────────────────
('1911 Platform', ARRAY['Colt','Springfield Armory','Rock Island Armory','Kimber','Wilson Combat','Nighthawk Custom','Les Baer','Dan Wesson','Ruger SR1911','Taurus 1911','Tisas','Auto Ordnance'], '1911 Platform', 'pistol',
 'Initial Function Check & Lubrication',
 'before_first_use', NULL, NULL, 'high',
 'Function-test all three safeties: thumb safety, grip safety, and disconnector. Verify the grip safety must be fully depressed for the trigger to break. Clean the barrel bushing and lubricate the barrel/bushing interface (a dry bushing is the #1 cause of 1911 accuracy degradation). Apply Sentry Solutions TUF-GLIDE or equivalent to barrel hood, slide rails, and barrel link.',
 '{}', ARRAY['Cleaning rod','Patches','Bore brush','1911 lube (grease preferred for bushing)'], 25,
 'The 1911 requires grease (not oil) at high-wear surfaces: barrel hood, barrel bushing, slide rails. Oil washes out too quickly under recoil.'),

('1911 Platform', ARRAY['Colt','Springfield Armory','Rock Island Armory','Kimber','Wilson Combat','Nighthawk Custom','Les Baer','Dan Wesson','Ruger SR1911','Taurus 1911','Tisas','Auto Ordnance'], '1911 Platform', 'pistol',
 'Field Strip, Clean & Lube',
 'after_each_use', NULL, NULL, 'high',
 'Field strip: remove slide from frame, remove barrel from bushing, remove recoil spring. Clean barrel bore and external surfaces. Wipe carbon from slide interior rails and barrel hood contact area. Clean feedramp on both barrel and frame. Apply grease to: barrel bushing threads, barrel hood, slide rails, barrel link. Light oil to grip safety pivot and thumb safety detent.',
 '{}', ARRAY['Cleaning rod','Bore brush','Patches','Solvent','Grease (SLX or Sentry Solutions)','Light oil'], 20,
 'The 1911''s feedramp geometry is critical for reliability — keep both the barrel and frame feedramp surfaces polished and clean of carbon.'),

('1911 Platform', ARRAY['Colt','Springfield Armory','Rock Island Armory','Kimber','Wilson Combat','Nighthawk Custom','Les Baer','Dan Wesson','Ruger SR1911','Taurus 1911','Tisas','Auto Ordnance'], '1911 Platform', 'pistol',
 'Recoil Spring Replacement',
 'round_count', 1000, NULL, 'high',
 'Replace the recoil spring. The GI-spec 1911 spring has a shorter service life than modern polymer pistols — 1,000-round replacement is the traditional standard (some manufacturers push to 2,000 rounds). Flat wire recoil springs (Wolff, Wilson) extend interval to 3,000+ rounds. A fatigued recoil spring causes battering of the frame stop and accelerates wear on the frame rail ears.',
 ARRAY['Recoil spring (GI: 16 lb; commander: 20 lb; officer: 24 lb)'], '{}', 5,
 'Flat-wound recoil springs last 3× longer than GI round-wire springs — worth the $15 upgrade.'),

('1911 Platform', ARRAY['Colt','Springfield Armory','Rock Island Armory','Kimber','Wilson Combat','Nighthawk Custom','Les Baer','Dan Wesson','Ruger SR1911','Taurus 1911','Tisas','Auto Ordnance'], '1911 Platform', 'pistol',
 'Barrel Bushing Fit Inspection',
 'round_count', 5000, NULL, 'normal',
 'Check barrel bushing fit — the barrel should be snug in the bushing with no radial play when assembled. Excessive play (visible wobble) means the bushing is worn and should be replaced. An oversized bushing that requires a bushing wrench to remove is acceptable; one that falls off by hand is too loose. Bushing fit is the primary accuracy limiter on a production 1911.',
 ARRAY['Match barrel bushing (if worn)'], ARRAY['Bushing wrench'], 10, NULL),

('1911 Platform', ARRAY['Colt','Springfield Armory','Rock Island Armory','Kimber','Wilson Combat','Nighthawk Custom','Les Baer','Dan Wesson','Ruger SR1911','Taurus 1911','Tisas','Auto Ordnance'], '1911 Platform', 'pistol',
 'Sear & Disconnector Engagement Inspection',
 'round_count', 5000, NULL, 'high',
 'Inspect sear and disconnector engagement surfaces for wear. The sear engagement dimension is safety-critical — worn sears can cause unintended discharges (hammer follow). Drop-safety check: thumb-cock the hammer, push firmly upward on the grip safety with the thumb safety off and pull the trigger — verify hammer does not fire if not intended. If trigger pull has dropped below 2.5 lb, have an armorer inspect.',
 '{}', ARRAY['Trigger pull gauge'], 10,
 'If you notice the hammer occasionally following the slide home, stop shooting immediately and have a gunsmith inspect the sear engagement.'),

('1911 Platform', ARRAY['Colt','Springfield Armory','Rock Island Armory','Kimber','Wilson Combat','Nighthawk Custom','Les Baer','Dan Wesson','Ruger SR1911','Taurus 1911','Tisas','Auto Ordnance'], '1911 Platform', 'pistol',
 'Annual Deep Inspection: Frame Rails & Grip Screws',
 'annual', NULL, 365, 'normal',
 'Inspect frame rail ears for peening (bending inward from slide impact). Check the frame-to-slide fit — mild peening is normal but severe deformation needs gunsmith attention. Tighten grip screws with proper hex key — loose grip screws cause accuracy and reliability issues. Inspect mainspring housing pin for migration. Check hammer strut straightness.',
 '{}', ARRAY['Hex key set','Dental pick'], 30, NULL),

-- ─────────────────────────────────────────────────────────────────────────────
-- AK PLATFORM
-- ─────────────────────────────────────────────────────────────────────────────
('AK Platform', ARRAY['Arsenal','WASR','Zastava','Century Arms','Palmetto State Armory','PSA','IWI Galil','Molot','ROMARM','Cugir','IO Inc'], 'AK / AKM', 'rifle',
 'Cosmoline Removal (Military Surplus Guns)',
 'before_first_use', NULL, NULL, 'critical',
 'Military-surplus and newly-imported AK platforms frequently ship packed in cosmoline (a thick petroleum-based preservative). Remove all cosmoline before firing — it becomes combustible when hot and clogs gas systems. Strip the stock and handguard and soak wood in mineral spirits. Clean bore, piston, piston tube, and all metal surfaces with solvent. Bake wood stocks in a low oven (150°F) to draw out remaining cosmoline.',
 '{}', ARRAY['Mineral spirits','Solvent','Bore brush (7.62×39 or 5.45×39)','Heat gun or oven (for wooden stocks)'], 120,
 'The gas piston tube is the most overlooked cosmoline trap — pack it with toilet paper, fire 5 rounds, pull the paper — if it''s orange, there''s still cosmoline in the system.'),

('AK Platform', ARRAY['Arsenal','WASR','Zastava','Century Arms','Palmetto State Armory','PSA','IWI Galil','Molot','ROMARM','Cugir','IO Inc'], 'AK / AKM', 'rifle',
 'Bore, Piston & Receiver Wipe-Down',
 'after_each_use', NULL, NULL, 'normal',
 'The AK''s chrome-lined bore is tolerant of extended fouling, but regular cleaning extends accuracy. Run bore brush + patches. Remove dust cover and clean the piston and piston tube of carbon (primary fouling accumulation point on the AK). Wipe the BCG. The AK needs minimal lubrication — light oil on the BCG, piston, and barrel/trunnion contact points.',
 '{}', ARRAY['Cleaning rod','Bore brush','Patches','Solvent','Light oil'], 15,
 'Unlike the AR-15, the AK runs better with light (not heavy) lubrication. Excess oil becomes a carbon trap in the sealed receiver.'),

('AK Platform', ARRAY['Arsenal','WASR','Zastava','Century Arms','Palmetto State Armory','PSA','IWI Galil','Molot','ROMARM','Cugir','IO Inc'], 'AK / AKM', 'rifle',
 'Gas Port & Piston Tube Carbon Removal',
 'round_count', 3000, NULL, 'normal',
 'Remove the gas tube and piston assembly. Scrub the inside of the gas tube with a gas tube brush to remove hardened carbon. Clean the gas port in the barrel with a picks and brush — heavy carbon can restrict gas flow, causing short-stroking. The AK''s fixed piston system accumulates more carbon in this area than DI systems.',
 '{}', ARRAY['Gas tube brush','Dental pick','Solvent'], 20,
 'A plugged gas port on an AK manifests as repeated failures to fully cycle the action. Compared to the AR, the gas port is easier to access but accumulates more.'),

('AK Platform', ARRAY['Arsenal','WASR','Zastava','Century Arms','Palmetto State Armory','PSA','IWI Galil','Molot','ROMARM','Cugir','IO Inc'], 'AK / AKM', 'rifle',
 'Hammer & Trigger Pin Retention Check',
 'round_count', 5000, NULL, 'high',
 'Check hammer and trigger cross-pins for migration. AK pins are held by friction and can work out under sustained recoil. Inspect pins for outward movement. Aftermarket AK-74-style pin retaining plates are a permanent fix and highly recommended for any AK fired beyond 1,000 rounds per year. A migrated pin causes catastrophic trigger group failure in-battery.',
 ARRAY['AK pin retaining plate (if not installed)'], '{}', 10,
 'The pin walk problem is MUCH more common on American-built AKs than on mil-spec Eastern European rifles. If you own an imported AK, inspect your pins after the first 500 rounds.'),

('AK Platform', ARRAY['Arsenal','WASR','Zastava','Century Arms','Palmetto State Armory','PSA','IWI Galil','Molot','ROMARM','Cugir','IO Inc'], 'AK / AKM', 'rifle',
 'Annual Inspection: Trunnion, Rails & Front Sight Base',
 'annual', NULL, 365, 'normal',
 'Inspect the front and rear trunnions for cracks (particularly at the receiver welds on stamped receivers). Check the front sight base alignment — a canted FSB is common on budget AKs and will prevent zeroing. Verify all rivets are tight. Inspect gas block stake marks if present. Clean and inspect chrome-lined bore for pitting.',
 '{}', ARRAY['Dental pick','Bore light'], 30, NULL),

-- ─────────────────────────────────────────────────────────────────────────────
-- MOSSBERG — 500, 590, 590A1
-- ─────────────────────────────────────────────────────────────────────────────
('Mossberg', ARRAY['O.F. Mossberg'], '500 / 590 Series', 'shotgun',
 'Bore & Chamber Clean',
 'after_each_use', NULL, NULL, 'high',
 'Run a shotgun bore brush (12 ga, 20 ga, or .410 as appropriate) followed by dry patches until clean. For steel shot, inspect bore for deformation — steel shot on an unmodified choke causes bore damage. Clean the chamber with a chamber brush. Wipe the bolt face. The Mossberg 500 is extremely fouling-tolerant but carbon builds up on the lifter and needs periodic cleaning.',
 '{}', ARRAY['Bore brush (gauge-specific)','Chamber brush','Patches','Solvent'], 15, NULL),

('Mossberg', ARRAY['O.F. Mossberg'], '500 / 590 Series', 'shotgun',
 'Magazine Tube & Spring Clean',
 'round_count', 500, NULL, 'normal',
 'Remove the magazine cap and spring follower. Wipe down the magazine tube interior to remove powder residue, grease, and grit. Inspect the magazine spring for kinking or coil separation. A fouled magazine tube causes binding of shells and feeding reliability issues. Lightly lube the magazine tube with a thin film of oil — not enough to attract grit.',
 '{}', ARRAY['Cleaning rod','Patches','Light oil'], 10, NULL),

('Mossberg', ARRAY['O.F. Mossberg'], '500 / 590 Series', 'shotgun',
 'Choke Tube Inspection & Replacement',
 'round_count', 1000, NULL, 'normal',
 'Remove the choke tube with a choke tube wrench and inspect threads and constriction for carbon buildup and deformation. Clean threads with a bronze brush and solvent. Apply choke tube lube (anti-seize) before reinstalling. A stuck choke tube is a common problem on infrequently-cleaned shotguns. Never fire without a choke tube installed in screw-choke barrels.',
 '{}', ARRAY['Choke tube wrench','Bronze brush','Choke tube anti-seize'], 10,
 'Never use a steel wire brush on choke tube threads — use bronze only to avoid damaging the aluminum threads.'),

('Mossberg', ARRAY['O.F. Mossberg'], '500 / 590 Series', 'shotgun',
 'Magazine Spring Replacement',
 'round_count', 3000, NULL, 'normal',
 'Replace the magazine tube spring. Fatigued springs cause failures to feed and inconsistent shell stripping from the magazine. OEM replacement springs are inexpensive and available from Wolff or Mossberg directly.',
 ARRAY['Mossberg magazine spring (gauge/tube-length specific)'], '{}', 5, NULL),

('Mossberg', ARRAY['O.F. Mossberg'], '500 / 590 Series', 'shotgun',
 'Annual Action Inspection',
 'annual', NULL, 365, 'normal',
 'Disassemble the action to inspect the elevator/shell lifter for deformation (a common issue with high brass loads). Inspect action bars for cracks or bends. Check the extractor and extractor spring. Clean the trigger group of carbon and debris. Verify the safety functions smoothly.',
 '{}', ARRAY['Punch set','Armorer''s block','Solvent','Light oil'], 45, NULL),

-- ─────────────────────────────────────────────────────────────────────────────
-- REMINGTON — 870
-- ─────────────────────────────────────────────────────────────────────────────
('Remington', ARRAY['Remington Arms'], '870 Series', 'shotgun',
 'Bore & Chamber Clean',
 'after_each_use', NULL, NULL, 'high',
 'Run a gauge-appropriate bore brush followed by dry patches until clean. Clean the chamber and bolt face. Wipe the action bars. The 870 is extremely reliable but the magazine tube and carrier dog accumulate carbon quickly. Wipe down the carrier dog and shell lifter with a CLP-soaked cloth.',
 '{}', ARRAY['Bore brush (gauge-specific)','Chamber brush','Patches','Solvent','CLP'], 15, NULL),

('Remington', ARRAY['Remington Arms'], '870 Series', 'shotgun',
 'Magazine Tube Spring Replacement',
 'round_count', 3000, NULL, 'normal',
 'Replace the magazine tube spring. Remington 870 magazine springs are known to fatigue, causing feeding hesitation. Wolff springs (standard +10% or +25% power) are a popular upgrade over OEM.',
 ARRAY['Remington 870 magazine spring (Wolff recommended)'], '{}', 5, NULL),

('Remington', ARRAY['Remington Arms'], '870 Series', 'shotgun',
 'Action Bar Lock & Disconnector Inspection',
 'round_count', 2000, NULL, 'normal',
 'The Remington 870 has an action bar lock that can wear in high round-count guns, allowing the action to partially unlock before the shell is fully chambered. Inspect the action bar lock engagement. Also inspect the shell carrier for deformation. If the action feels "sloppy" or shells don''t fully chamber, inspect these components.',
 '{}', ARRAY['Punch set'], 20, NULL),

('Remington', ARRAY['Remington Arms'], '870 Series', 'shotgun',
 'Annual Action Strip & Inspection',
 'annual', NULL, 365, 'normal',
 'Detail strip the trigger group (cross-pin removal). Clean the trigger, disconnector, and sear group. Inspect the extractor and ejector for deformation. Check the carrier dog pivot for wear. Remington 870s rarely need parts at normal round counts but benefit enormously from a thorough annual detail clean.',
 '{}', ARRAY['Punch set','Armorer''s block','Dental pick','Solvent'], 45, NULL),

-- ─────────────────────────────────────────────────────────────────────────────
-- CZ / CZ-USA — 75 Series (SP-01, Shadow, Compact, P-01)
-- ─────────────────────────────────────────────────────────────────────────────
('CZ-USA', ARRAY['CZ','Ceska Zbrojovka'], 'CZ 75 Series', 'pistol',
 'Remove Factory Grease & Initial Lube',
 'before_first_use', NULL, NULL, 'high',
 'CZ 75s ship with a thick cosmoline-like factory grease in the slide channels and on the frame rails. Remove this grease with solvent and apply a lighter film of quality lubricant. The CZ''s internal rail (frame rides inside slide) means the rail surfaces need particular attention. CZ recommends minimal lube but the all-steel construction benefits from a quality gun oil or grease on the rails.',
 '{}', ARRAY['Solvent','Bore brush','Patches','CLP or gun oil'], 20,
 'CZ''s internal rail design (frame inside slide) means lube accumulates and distributes differently than external-rail designs — clean the rail channels thoroughly.'),

('CZ-USA', ARRAY['CZ','Ceska Zbrojovka'], 'CZ 75 Series', 'pistol',
 'Field Strip, Clean & Lube',
 'after_each_use', NULL, NULL, 'high',
 'Field strip to five components (slide, barrel, recoil spring, recoil spring guide, frame). Clean bore and slide interior. Wipe internal slide rails and frame rails thoroughly — the internal rail design traps carbon efficiently. Apply thin oil or grease to the four rail contact surfaces. Light oil on the barrel hood and locking block interface.',
 '{}', ARRAY['Cleaning rod','Bore brush','Patches','Solvent','Gun oil or grease'], 15, NULL),

('CZ-USA', ARRAY['CZ','Ceska Zbrojovka'], 'CZ 75 Series', 'pistol',
 'Recoil Spring Replacement',
 'round_count', 5000, NULL, 'normal',
 'Replace the recoil spring. The CZ 75 series'' heavier all-steel construction is more forgiving of spring fatigue than polymer pistols, but spring replacement at 5,000 rounds maintains optimal cycling. Aftermarket competition springs are available from CZ Custom for tuned loads.',
 ARRAY['CZ 75 recoil spring (frame-size specific)'], '{}', 5, NULL),

('CZ-USA', ARRAY['CZ','Ceska Zbrojovka'], 'CZ 75 Series', 'pistol',
 'Locking Block Inspection',
 'round_count', 5000, NULL, 'high',
 'Inspect the locking block (the cross-piece in the frame that locks the barrel) for deformation, cracks, or unusual wear patterns. A failing locking block is safety-critical and rare, but occurs in high-round-count guns. Signs include excessive vertical play in the slide-to-frame fit when assembled.',
 '{}', ARRAY['Bore light'], 10,
 'CZ locking block failures are uncommon but well-documented at 20k+ round counts in competition guns. Inspect proactively at 5k intervals.'),

('CZ-USA', ARRAY['CZ','Ceska Zbrojovka'], 'CZ 75 Series', 'pistol',
 'Annual Full Spring Kit Replacement',
 'annual', NULL, 365, 'normal',
 'Replace the full spring kit (recoil spring, firing pin spring, trigger return spring, hammer spring) as a set. CZ Custom sells complete spring kits. For competition guns (Shadow 2, SP-01 Shadow), follow the more aggressive competition spring replacement schedule recommended by CZ Custom.',
 ARRAY['CZ 75 full spring kit'], ARRAY['Punch set','Armorer''s block'], 30, NULL),

-- ─────────────────────────────────────────────────────────────────────────────
-- SPRINGFIELD ARMORY — XD / XDm / XD-S
-- ─────────────────────────────────────────────────────────────────────────────
('Springfield Armory', ARRAY['Springfield'], 'XD / XDm Series', 'pistol',
 'Initial Clean & Lube (Ships Dry)',
 'before_first_use', NULL, NULL, 'critical',
 'The XD series ships from the factory with minimal lubrication — insufficient for reliable function. Before first use, apply light oil to the four contact surfaces: slide rails (left and right), barrel hood, and barrel cam. The XD''s grip safety must be fully depressed to fire — verify it functions correctly before live fire.',
 '{}', ARRAY['Cleaning rod','Bore brush','Patches','CLP or gun oil'], 20,
 'The "XD ships dry" issue is well-documented and causes malfunctions on the first range trip if not addressed. Lube before you shoot.'),

('Springfield Armory', ARRAY['Springfield'], 'XD / XDm Series', 'pistol',
 'Field Strip, Clean & Lube',
 'after_each_use', NULL, NULL, 'high',
 'Field strip to four components. Clean barrel, slide interior, and frame rails. The XD striker channel accumulates carbon similarly to the M&P — clean with a dental pick periodically. Apply thin oil to slide rails and barrel hood. The grip safety pivot benefits from occasional light oil.',
 '{}', ARRAY['Cleaning rod','Bore brush','Patches','Solvent','CLP'], 15, NULL),

('Springfield Armory', ARRAY['Springfield'], 'XD / XDm Series', 'pistol',
 'Recoil Spring Replacement',
 'round_count', 5000, NULL, 'normal',
 'Replace the captive recoil spring assembly. The XD series uses a captured dual spring that fatigues at similar rates to other polymer-frame pistols.',
 ARRAY['Springfield XD recoil spring assembly (model-specific)'], '{}', 5, NULL),

('Springfield Armory', ARRAY['Springfield'], 'XD / XDm Series', 'pistol',
 'Annual Striker Channel & Grip Safety Inspection',
 'annual', NULL, 365, 'normal',
 'Detail strip the slide and clean the striker channel of carbon. Inspect the grip safety spring and lever for fatigue. The XD grip safety is mechanically simple but a fouled pivot causes stiff or non-functional grip safety. Inspect the trigger bar for wear at the sear interface.',
 '{}', ARRAY['Punch set','Dental pick','Solvent'], 35, NULL),

-- ─────────────────────────────────────────────────────────────────────────────
-- BERETTA — 92 Series (92FS, M9, A1)
-- ─────────────────────────────────────────────────────────────────────────────
('Beretta', '{}', '92 Series', 'pistol',
 'Initial Cleaning & Lubrication',
 'before_first_use', NULL, NULL, 'high',
 'Beretta 92s ship with a protective grease. Clean bore, chamber, and slide interior thoroughly. Apply Beretta-approved lubricant to slide rails, barrel hood, locking block, and decocker shaft. The open-top slide design means the barrel and slide interior are exposed to more debris — a clean starting point matters more here than on enclosed-slide pistols.',
 '{}', ARRAY['Cleaning rod','Bore brush','Patches','Solvent','Beretta lube or CLP'], 20, NULL),

('Beretta', '{}', '92 Series', 'pistol',
 'Field Strip, Clean & Lube',
 'after_each_use', NULL, NULL, 'high',
 'Field strip to four components. Clean barrel, slide interior, and frame rails. Pay particular attention to the locking block seat in the frame — carbon accumulates here and can cause the locking block to bind. Apply thin lube to slide rails, barrel hood, and locking block pivot area. The decocker/safety lever needs light oil at its shaft.',
 '{}', ARRAY['Cleaning rod','Bore brush','Patches','Solvent','CLP'], 15,
 'The open-top slide design means the barrel is partially exposed to dust in the holster. Wipe the barrel exterior before chambering in dusty environments.'),

('Beretta', '{}', '92 Series', 'pistol',
 'Recoil Spring Replacement',
 'round_count', 5000, NULL, 'normal',
 'Replace the single-coil recoil spring. The 92FS uses a simple non-captured spring — easy to replace. At high round counts the spring flattens, causing the slide to close too hard and battering the locking block and frame.',
 ARRAY['Beretta 92 recoil spring (18.5 lb standard or Wolff equivalent)'], '{}', 3, NULL),

('Beretta', '{}', '92 Series', 'pistol',
 'Locking Block Inspection',
 'round_count', 5000, NULL, 'critical',
 'Inspect the locking block for cracks — particularly around the lug that engages the slide. Locking block failures on the 92 series are well-documented and safety-critical: a cracked locking block can allow the barrel to exit the slide during firing. Replace immediately if any cracks are visible. OEM or Beretta-recommended aftermarket locking blocks are required; non-OEM blocks have caused failures.',
 ARRAY['Beretta OEM locking block'], ARRAY['Punch set'], 15,
 'The locking block is the single most important inspection item on the 92 series. Inspect at EVERY cleaning after 5,000 rounds, not just at the milestone.'),

('Beretta', '{}', '92 Series', 'pistol',
 'Decocker / Safety Lever Inspection',
 'round_count', 5000, NULL, 'normal',
 'Inspect the decocker/safety lever pivot for wear. The lever should snap cleanly into both safe and fire positions. A worn or bent lever can cause unintended decocking or prevent the pistol from firing. Clean the lever shaft and spring with a dental pick and solvent. The 92A1 with rail-mounted accessories sees higher leverage on the frame — inspect the rail-frame interface as well.',
 '{}', ARRAY['Dental pick','Solvent'], 10, NULL),

('Beretta', '{}', '92 Series', 'pistol',
 'Annual Open-Slide Inspection',
 'annual', NULL, 365, 'normal',
 'Inspect the open-top slide for fatigue cracks at the ejection port corners — the Beretta open-top design is unique and the slide does see stress at these corners over high round counts. A bore light inspection of the slide interior is sufficient. Also verify the extractor spring tension (extractor should hold a round firmly against the bolt face).',
 '{}', ARRAY['Bore light'], 15, NULL),

-- ─────────────────────────────────────────────────────────────────────────────
-- WALTHER — PPK / P99 / PPQ / PDP
-- ─────────────────────────────────────────────────────────────────────────────
('Walther', '{}', 'PPK / P99 / PPQ / PDP', 'pistol',
 'Initial Clean & Lube',
 'before_first_use', NULL, NULL, 'high',
 'Clean bore and apply light lubricant to slide rails and barrel hood. Walther pistols are well-engineered and tolerant but ship with a minimal factory lube. The PPQ/PDP striker channel should be checked for factory cosmoline — clean if present.',
 '{}', ARRAY['Cleaning rod','Bore brush','Patches','CLP'], 15, NULL),

('Walther', '{}', 'PPK / P99 / PPQ / PDP', 'pistol',
 'Field Strip, Clean & Lube',
 'after_each_use', NULL, NULL, 'high',
 'Standard field strip and clean. The PPQ/PDP strikers can accumulate carbon in the channel — clean with dental pick every 2,000 rounds. PPK requires a bit more care during field strip due to the older heel-mag-release design; ensure the magazine is fully removed before disassembly.',
 '{}', ARRAY['Cleaning rod','Bore brush','Patches','Solvent','CLP'], 15, NULL),

('Walther', '{}', 'PPK / P99 / PPQ / PDP', 'pistol',
 'Recoil Spring Replacement',
 'round_count', 5000, NULL, 'normal',
 'Replace the recoil spring assembly at standard intervals. The PPK uses a traditional flat recoil spring; PPQ/PDP use a captive spring assembly.',
 ARRAY['Walther OEM recoil spring (model-specific)'], '{}', 5, NULL),

('Walther', '{}', 'PPK / P99 / PPQ / PDP', 'pistol',
 'Annual Striker / Firing Pin Inspection',
 'annual', NULL, 365, 'normal',
 'Clean the striker channel and inspect the striker tip for deformation. Verify the striker safety function on PPQ/PDP (press the trigger block — hammer or striker should not move). Inspect the decocker on DA/SA Walther models for full function.',
 '{}', ARRAY['Dental pick','Solvent'], 20, NULL),

-- ─────────────────────────────────────────────────────────────────────────────
-- HK — VP9 / P30 / USP
-- ─────────────────────────────────────────────────────────────────────────────
('Heckler & Koch', ARRAY['HK','H&K','Heckler and Koch'], 'VP9 / P30 / USP', 'pistol',
 'Initial Clean & Lube',
 'before_first_use', NULL, NULL, 'high',
 'HK pistols ship with HK-brand oil on contact surfaces. Wipe old oil and apply fresh CLP or HK recommended lubricant to slide rails, barrel hood, and cam lug. The VP9''s paddle mag release area should be cleaned of factory grease to ensure smooth magazine insertion.',
 '{}', ARRAY['Cleaning rod','Bore brush','Patches','CLP or HK oil'], 15, NULL),

('Heckler & Koch', ARRAY['HK','H&K','Heckler and Koch'], 'VP9 / P30 / USP', 'pistol',
 'Field Strip, Clean & Lube',
 'after_each_use', NULL, NULL, 'high',
 'Standard field strip. The VP9 and P30 feature polygonal rifling (no lands/grooves) — do NOT use jacketed hollow points without confirming HK approval. Lead bullets are strictly forbidden in polygonal barrels (dangerous pressure buildup). Clean bore with a nylon brush only — no bronze brush on polygonal barrels.',
 '{}', ARRAY['Cleaning rod','Nylon bore brush (NOT bronze)','Patches','Solvent','CLP'], 15,
 'Polygonal rifling requires a nylon brush — bronze scratches the smooth-bore surface and invalidates HK''s recommendation. Only jacketed bullets; no lead.'),

('Heckler & Koch', ARRAY['HK','H&K','Heckler and Koch'], 'VP9 / P30 / USP', 'pistol',
 'Recoil Spring Replacement',
 'round_count', 5000, NULL, 'normal',
 'Replace the captive recoil spring assembly. HK pistols are overbuilt and the spring interval can extend to 7,500 rounds for the USP, but 5,000 is the conservative standard.',
 ARRAY['HK OEM recoil spring assembly (model-specific)'], '{}', 5, NULL),

('Heckler & Koch', ARRAY['HK','H&K','Heckler and Koch'], 'VP9 / P30 / USP', 'pistol',
 'Annual Striker Channel & Paddle Release Inspection',
 'annual', NULL, 365, 'normal',
 'Clean the VP9/P30 striker channel of carbon. Inspect the paddle magazine release mechanism for smooth spring-return on both sides. Inspect the VP9 trigger bar for unusual wear at the sear interface. HK pistols are extremely durable — annual inspection is typically sufficient.',
 '{}', ARRAY['Dental pick','Solvent'], 20, NULL),

-- ─────────────────────────────────────────────────────────────────────────────
-- GENERIC FALLBACKS — applies when no manufacturer match found
-- ─────────────────────────────────────────────────────────────────────────────
('Generic', '{}', NULL, 'pistol',
 'Field Strip, Clean & Lube',
 'after_each_use', NULL, NULL, 'high',
 'Field strip your pistol to its major components. Run a bore brush through the barrel followed by dry patches. Wipe the slide interior and frame rails clean of carbon and powder residue. Apply a light film of lubricant to all metal-on-metal contact surfaces. Reassemble and function-check.',
 '{}', ARRAY['Cleaning rod','Bore brush (caliber-appropriate)','Patches','Solvent','Lubricant'], 15,
 'When in doubt: clean bore, wipe metal contact surfaces, apply thin lube, function check.'),

('Generic', '{}', NULL, 'pistol',
 'Recoil Spring Replacement',
 'round_count', 5000, NULL, 'normal',
 'Replace the recoil spring at manufacturer-recommended intervals, typically 3,000–5,000 rounds for polymer-frame pistols and 1,000–2,000 rounds for 1911-pattern pistols. Consult your owner''s manual for the specific interval and part number.',
 ARRAY['OEM recoil spring (model-specific)'], '{}', 5, NULL),

('Generic', '{}', NULL, 'rifle',
 'Bore & Action Clean',
 'after_each_use', NULL, NULL, 'high',
 'Run an appropriate bore brush through the barrel followed by dry patches until clean, then a lightly-oiled patch. Clean the bolt face, extractor, and action of carbon and debris. Apply light lubricant to the bolt body and any metal-on-metal contact surfaces specified in your owner''s manual.',
 '{}', ARRAY['Cleaning rod','Bore brush (caliber-specific)','Patches','Solvent','Light oil'], 15, NULL),

('Generic', '{}', NULL, 'rifle',
 'Annual Trigger & Safety Inspection',
 'annual', NULL, 365, 'normal',
 'Verify all manual safeties function correctly. Measure trigger pull weight — any unexpected change warrants armorer inspection. Clean the trigger group of debris and fouling. Consult your owner''s manual for the recommended service interval for your specific rifle platform.',
 '{}', ARRAY['Trigger pull gauge','Solvent'], 20, NULL),

('Generic', '{}', NULL, 'shotgun',
 'Bore & Chamber Clean',
 'after_each_use', NULL, NULL, 'high',
 'Run a gauge-appropriate bore brush through the barrel followed by dry patches. Clean the chamber with a chamber brush. Remove and clean the choke tube (if applicable) — apply anti-seize before reinstalling. Wipe the bolt face and action bars.',
 '{}', ARRAY['Bore brush (gauge-specific)','Chamber brush','Patches','Solvent','Choke tube anti-seize'], 15, NULL),

('Generic', '{}', NULL, 'shotgun',
 'Magazine Spring Inspection',
 'round_count', 1000, NULL, 'normal',
 'Remove the magazine plug and spring follower. Inspect the magazine spring for kinking or coil fatigue. A weak magazine spring is the primary cause of feeding failures in pump and semi-auto shotguns. Replace at any sign of weakness or at manufacturer-recommended intervals.',
 ARRAY['Replacement magazine spring (gauge/tube-length specific)'], '{}', 5, NULL),

('Generic', '{}', NULL, 'revolver',
 'Cylinder & Forcing Cone Clean',
 'after_each_use', NULL, NULL, 'high',
 'Clean all cylinder chambers with a chamber brush followed by patches. Scrub the bore with a bronze brush. Clean the forcing cone (critical — lead and carbon accumulate here and degrade accuracy). Wipe the extractor rod and crane. Apply a light oil to the crane pivot.',
 '{}', ARRAY['Bore brush (caliber-specific)','Chamber brush','Patches','Solvent','Light oil'], 20, NULL),

('Generic', '{}', NULL, 'revolver',
 'Cylinder Timing & Gap Check',
 'round_count', 2000, NULL, 'high',
 'Slowly cock the hammer and verify each cylinder chamber aligns perfectly with the barrel before the hammer falls. Check the barrel-cylinder gap with a feeler gauge — typically 0.003"–0.006" for most revolvers. Poor timing requires armorer service. Excessive gap indicates wear.',
 '{}', ARRAY['Feeler gauge set'], 10, NULL);
