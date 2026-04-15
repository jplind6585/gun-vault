-- ============================================================
-- bullet_types: public reference table
-- Projectile types, construction, and use cases
-- RLS: public SELECT, service_role only for writes
-- ============================================================

CREATE TABLE IF NOT EXISTS public.bullet_types (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    text UNIQUE NOT NULL,
  abbreviation            text,
  description             text,
  construction            text,
  best_use                text[],   -- ['Self-Defense','Target/Training','Hunting','Competition','Military']
  penetration_fbi_inches  numeric,  -- typical FBI penetration test 10% gelatin result
  expansion_diameter_in   numeric,  -- expanded diameter (hollow points only)
  created_at              timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bullet_types_name         ON public.bullet_types (name);
CREATE INDEX IF NOT EXISTS idx_bullet_types_abbreviation ON public.bullet_types (abbreviation);

-- RLS
ALTER TABLE public.bullet_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bullet_types_public_read"   ON public.bullet_types;
DROP POLICY IF EXISTS "bullet_types_service_write" ON public.bullet_types;

CREATE POLICY "bullet_types_public_read"
  ON public.bullet_types FOR SELECT
  USING (true);

CREATE POLICY "bullet_types_service_write"
  ON public.bullet_types FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- SEED DATA  (40 bullet types)
-- ============================================================

INSERT INTO public.bullet_types
  (name, abbreviation, description, construction, best_use, penetration_fbi_inches, expansion_diameter_in)
VALUES

-- ── COMMON HANDGUN / DEFENSIVE ────────────────────────────────────────────────
('Full Metal Jacket',
 'FMJ',
 'Standard training and military projectile. A lead core fully enclosed in a harder copper or guilding metal jacket. Does not expand. Required by Geneva Convention for military use.',
 'Lead core enclosed in a gilding metal (copper-zinc alloy) or copper jacket. Jacket covers the base and sides, exposing a flat or round lead tip.',
 ARRAY['Target/Training','Military'],
 18.0, NULL),

('Jacketed Hollow Point',
 'JHP',
 'Defensive and hunting projectile with a hollow cavity in the nose that causes the bullet to expand upon impact. Increases diameter and transfers energy efficiently while reducing over-penetration.',
 'Lead core with a copper jacket that has a hollow cavity at the nose. Upon impact with soft tissue, hydraulic pressure forces the jacket petals to peel back, dramatically increasing diameter.',
 ARRAY['Self-Defense','Hunting'],
 13.5, 0.65),

('Bonded Jacketed Hollow Point',
 'BJHP',
 'Hollow point where the lead core is chemically or mechanically bonded to the jacket. Prevents core-jacket separation at high velocity or through intermediate barriers.',
 'Lead core is bonded to the copper jacket via electrochemical process or mechanical bonding, ensuring jacket and core expand together as a single unit. Retains near 100% weight.',
 ARRAY['Self-Defense','Law Enforcement','Hunting'],
 14.0, 0.70),

('Extreme Terminal Performance (Hornady XTP)',
 'XTP',
 'Hornady''s jacketed hollow point bullet used in their Custom and American Gunner lines. Designed for controlled, uniform expansion. Popular for handgun hunting.',
 'Cannelured copper jacket with a serrated hollow point nose. Controlled expansion at various velocities. Weight retention typically 95%+.',
 ARRAY['Self-Defense','Hunting'],
 14.5, 0.58),

('Federal HST',
 'HST',
 'Federal''s premier law enforcement and defensive hollow point. Skived jacket ensures consistent expansion across all test media including heavy clothing.',
 'Copper jacket with pre-skived (cut) petals and a large hollow cavity. Expands reliably through 4 layers of denim. Near 100% weight retention. Standard FBI defensive test passer.',
 ARRAY['Self-Defense','Law Enforcement'],
 14.0, 0.72),

('Gold Dot (Speer)',
 'GD',
 'Speer''s flagship bonded defensive hollow point. Pioneered electrochemical bonding process. The most adopted defensive round in US law enforcement history.',
 'Electrochemically bonded jacket and core. Uniform jacket thickness prevents "peeling" and core separation. Consistent expansion through barriers. Gold Dot G2 features a recessed dish-top for 9mm sub-compacts.',
 ARRAY['Self-Defense','Law Enforcement'],
 13.5, 0.68),

('Critical Defense / FTX',
 'FTX',
 'Hornady''s civilian defensive hollow point. Flex Tip eXpanding technology uses a soft polymer tip to prevent clogging and ensure reliable expansion from short barrels.',
 'Polymer-tipped hollow point. The red Flex Tip fills the hollow cavity to prevent clothing and debris clogging. On impact, tip is pushed in, initiating expansion.',
 ARRAY['Self-Defense'],
 13.0, 0.62),

('Critical Duty / FlexLock',
 'FlexLock',
 'Hornady''s law enforcement grade barrier-blind hollow point. Heavier than Critical Defense for superior barrier penetration while passing FBI protocol.',
 'Interlock band mechanically locks the core to the jacket preventing separation through barriers. Polymer Flex Tip. Passes all FBI protocol barriers including auto glass and plywood.',
 ARRAY['Self-Defense','Law Enforcement'],
 15.0, 0.63),

('Radically Invasive Projectile',
 'RIP',
 'G2 Research copper projectile machined with trocar-shaped petals designed to separate and create multiple wound channels while a base slug continues for penetration.',
 'Single piece machined copper. Upon impact, eight pre-cut trocar petals separate and penetrate radially while the base plug continues forward. Creates multiple simultaneous wound cavities.',
 ARRAY['Self-Defense'],
 9.0, NULL),

-- ── OPEN TIP MATCH / COMPETITION ──────────────────────────────────────────────
('Boat Tail Hollow Point',
 'BTHP',
 'Match-grade precision rifle bullet with a boat tail base and open tip. The open tip is a manufacturing artifact from drawing the jacket, not designed to expand (unlike defensive JHPs).',
 'Gilding metal jacket drawn from the nose, leaving a small opening at the tip. Boat tail base reduces drag. Lead core. Open tip improves concentricity for accuracy.',
 ARRAY['Target/Training','Competition','Military'],
 NULL, NULL),

('Open Tip Match',
 'OTM',
 'Catch-all term for precision match bullets where the jacket is drawn from the nose end, leaving a small open tip. Accurate due to uniform jacket thickness. Common in military sniper use.',
 'Jacket drawn from the nose to ensure uniform wall thickness and concentricity. Boat tail base. Not intended to expand — the open tip is an artifact of manufacture.',
 ARRAY['Competition','Military','Target/Training'],
 NULL, NULL),

('Sierra MatchKing',
 'SMK',
 'Sierra Bullets'' flagship match projectile. BTHP design with extremely tight quality control. Used in world record long-range accuracy achievements and military sniper programs.',
 'Exceptionally uniform jacket thickness and bullet diameter. Boat tail base. Open tip from the nose-first draw process. Available in a wide range of calibers and weights.',
 ARRAY['Competition','Military','Target/Training'],
 NULL, NULL),

('Berger VLD',
 'VLD',
 'Very Low Drag projectile from Berger Bullets. Extremely secant ogive (sharp nose) for minimum drag and maximum BC. Widely used in PRS and F-Class competition.',
 'Thin J4 jacket drawn to near-zero tip. Secant ogive with extremely low form factor. High BC (Ballistic Coefficient) for flat trajectory at long range. VLD Hunting variant expands on game.',
 ARRAY['Competition','Hunting'],
 NULL, NULL),

('Berger Hybrid OTM',
 'Hybrid',
 'Combines tangent and secant ogive sections for reduced sensitivity to seating depth variation while retaining high BC. Dominant in PRS competition.',
 'Hybrid ogive design: tangent nose section at base of bullet transitions to secant ogive toward tip. Reduces seating depth sensitivity vs. pure VLD. Same thin J4 jacket.',
 ARRAY['Competition','Target/Training'],
 NULL, NULL),

-- ── HUNTING BULLETS ───────────────────────────────────────────────────────────
('Soft Point',
 'SP',
 'Hunting bullet with lead core exposed at the tip. Lower cost than jacketed hollow points. Reliable expansion at hunting velocities. Classic deer and general hunting bullet.',
 'Lead core with a copper jacket that leaves the tip of the lead core exposed. Exposed soft lead tip initiates expansion upon impact with tissue.',
 ARRAY['Hunting'],
 NULL, NULL),

('Jacketed Soft Point',
 'JSP',
 'Similar to SP — a partially jacketed bullet with exposed lead at the nose. Common in revolver and pistol hunting loads as well as rifle hunting.',
 'Lead core fully jacketed on the sides and base, with a partial jacket that stops short of the nose, leaving a soft lead point exposed.',
 ARRAY['Hunting','Self-Defense'],
 NULL, NULL),

('Super Shock Tip (Hornady SST)',
 'SST',
 'Hornady polymer-tipped hunting bullet. Polymer tip initiates reliable expansion at a wide range of velocities. High BC for flat trajectory. Excellent deer hunting bullet.',
 'Lead core with copper jacket. Polymer tip (same polymer as the V-MAX) fills the hollow point to initiate reliable expansion and streamline the ogive for high BC.',
 ARRAY['Hunting'],
 NULL, NULL),

('AccuBond (Nosler)',
 'AB',
 'Nosler''s bonded polymer-tipped hunting bullet. Bonded core for near 100% weight retention. Polymer tip for high BC and consistent expansion.',
 'Bonded lead-alloy core with copper jacket. White polymer tip. Bonding process ensures jacket-core integrity through barriers and bone. Controlled mushrooming to 2x original diameter.',
 ARRAY['Hunting'],
 NULL, NULL),

('Partition (Nosler)',
 'Part.',
 'Nosler''s iconic dual-core hunting bullet invented in 1946. A partition in the jacket separates two lead cores. Front core expands; rear core retains for deep penetration.',
 'Two lead cores separated by a copper partition (wall). Front core is exposed and expands on impact. Rear core is fully enclosed and drives deep penetration after front expansion.',
 ARRAY['Hunting'],
 NULL, NULL),

('E-Tip (Nosler)',
 'E-Tip',
 'Nosler''s lead-free all-copper hunting bullet. Polymer tip, relief grooves, and polymer tip for consistent expansion. Required in California and other lead-restricted areas.',
 'Monolithic gilding metal (lead-free) bullet with a polymer tip. Dual-diameter relief grooves reduce fouling and barrel friction. Expands reliably across a wide velocity range.',
 ARRAY['Hunting'],
 NULL, NULL),

('Triple Shock X (Barnes TSX)',
 'TSX',
 'Barnes all-copper solid with four relief grooves. Designed to expand reliably at both high and low velocities. Lead-free. Near 100% weight retention.',
 'Solid copper (C23000 gilding metal) projectile with relief grooves to reduce pressure and fouling. Hollow point opens into four uniform petals on impact. Lead-free for restricted areas.',
 ARRAY['Hunting','Military','Law Enforcement'],
 NULL, NULL),

('Tipped Triple Shock X (Barnes TTSX)',
 'TTSX',
 'Barnes TSX with a polymer tip for improved BC and more reliable expansion at lower impact velocities. The most common Barnes hunting bullet.',
 'Same solid copper construction as TSX. Addition of polymer tip to streamline the ogive, improve BC, and ensure expansion initiation at low velocity impacts (250+ fps minimum).',
 ARRAY['Hunting'],
 NULL, NULL),

('Terminal Ascent (Federal)',
 'TA',
 'Federal''s flagship long-range hunting bullet. Slipstream polymer tip, bonded lead core, AccuChannel groove. Designed to expand reliably from point-blank to extreme range.',
 'Bonded lead core with a nickel-plated jacket. Slipstream polymer tip. AccuChannel groove for reduced fouling. High BC design for long-range hunting applications.',
 ARRAY['Hunting'],
 NULL, NULL),

('ELD-X (Hornady)',
 'ELD-X',
 'Hornady''s Extremely Low Drag eXpanding bullet. Heat Shield polymer tip resists aerodynamic heating that melts standard polymer tips at long range. Excellent BC.',
 'Interlock mechanically locks jacket to core. Heat Shield tip is a new polymer formulation that maintains shape at supersonic velocities unlike standard ABS polymer tips. High BC for long-range hunting.',
 ARRAY['Hunting','Competition'],
 NULL, NULL),

-- ── PISTOL / REVOLVER SPECIALTY ───────────────────────────────────────────────
('Lead Round Nose',
 'LRN',
 'Traditional all-lead pistol bullet without a copper jacket. Used for cowboy action and low-velocity range shooting. Not recommended for polygonal-rifled barrels (Glock warning).',
 'Uncoated or wax-lubricated lead alloy bullet. Soft, low-pressure applications. Round nose profile for reliable feeding in semi-autos.',
 ARRAY['Target/Training'],
 NULL, NULL),

('Lead Flat Nose',
 'LFN',
 'Flat-nosed lead bullet for lever-action tubular magazines. Flat nose prevents recoil-initiated primer strikes in tubes. Also used for cowboy action.',
 'Lead alloy with a flat or truncated cone nose profile. Designed for tubular magazines where pointed bullets could cause chain-fire if a recoil initiates primer contact.',
 ARRAY['Target/Training','Hunting'],
 NULL, NULL),

('Lead Hollow Point',
 'LHP',
 'All-lead hollow point projectile. Expands at low velocity without a jacket. Used in .22 LR and low-velocity revolver loads.',
 'Lead alloy bullet with a hollow cavity in the nose. Expands at lower velocities than jacketed bullets, making it suitable for rimfire and low-pressure revolver cartridges.',
 ARRAY['Hunting','Self-Defense'],
 NULL, NULL),

('Wadcutter',
 'WC',
 'Flat-faced lead bullet designed to punch clean holes in paper targets for easy scoring. Used in competitive target shooting at low velocity.',
 'Cylindrical lead bullet with a completely flat nose. The sharp corner cuts a clean round hole in paper. Low velocity, used in .38 Special and other target calibers.',
 ARRAY['Competition','Target/Training'],
 NULL, NULL),

('Semi-Wadcutter',
 'SWC',
 'Compromise between round-nose (for feeding) and wadcutter (for target cutting). Truncated cone profile punches cleaner holes than RN without wadcutter feeding issues.',
 'Lead bullet with a forward truncated-cone shoulder and flat nose. Can be used in semi-automatic pistols unlike pure wadcutters. Cleaner target holes than round-nose bullets.',
 ARRAY['Target/Training','Competition'],
 NULL, NULL),

('Frangible',
 'Frang.',
 'Bullet designed to disintegrate on contact with hard surfaces. Used for reduced-ricochet training, hostage rescue, and aircraft/ship protection where over-penetration is unacceptable.',
 'Compressed metal powder (usually copper-tin or copper-bismuth) bonded under pressure. Shatters on steel backstops or hard surfaces but behaves normally against soft tissue. Lead-free.',
 ARRAY['Target/Training','Law Enforcement','Military'],
 NULL, NULL),

('Tracer',
 'Tracer',
 'Military-spec projectile with a pyrotechnic compound in the base that burns during flight, leaving a visible trace. Used for fire adjustment and communication in military use. Civilian use restricted.',
 'Standard FMJ or armor-piercing body with a hollow base filled with a pyrotechnic compound (strontium salt mixture). Burns at 1600°F+ for several hundred meters. NFA regulated in some forms.',
 ARRAY['Military'],
 NULL, NULL),

('Armor Piercing',
 'AP',
 'Hardened steel or tungsten core projectile designed to penetrate body armor and light vehicle armor. Heavily regulated and largely prohibited for civilian handgun use (GCA 1968).',
 'Steel, tungsten carbide, or tungsten alloy penetrator core, sometimes with copper or aluminum jacket. The hard core concentrates force on a small area to defeat armor.',
 ARRAY['Military'],
 NULL, NULL),

('Rebated Boat Tail',
 'RBT',
 'Variant of the boat tail design where the boat tail diameter is reduced below the projectile body. Used in some long-range precision designs.',
 'Lead core with a copper jacket featuring a boat tail base where the tail diameter is smaller than the body. Reduces drag while maintaining bullet stability.',
 ARRAY['Competition','Target/Training'],
 NULL, NULL),

-- ── RIFLE / MILITARY SPECIFIC ─────────────────────────────────────────────────
('Green Tip / M855',
 'M855',
 'US military 5.56mm standard ball projectile (SS109 design). Steel penetrator tip over lead core with mild steel penetrator. Penetrates body armor at close range. Controversial ATF classification history.',
 '62-grain FMJ with a mild steel penetrator tip over a lead core. Gilding metal jacket. Designed to penetrate Soviet steel helmets and body armor. Longer than M193, requires 1:9 or faster twist.',
 ARRAY['Military','Target/Training'],
 NULL, NULL),

('M855A1 Enhanced Performance Round',
 'M855A1',
 'US Army replacement for M855. Solid copper rear slug with a steel penetrator. Lead-free. Improved barrier penetration, reduced muzzle flash, and environmentally friendly.',
 'Reverse-drawn copper alloy rear slug with a hardened steel penetrator and a small lead plug. No lead in the projectile body. Consistent performance against soft targets and barriers.',
 ARRAY['Military'],
 NULL, NULL),

('M193',
 'M193',
 'Original US military 5.56mm ball projectile. 55-grain FMJ lead core. Superseded by M855 in the 1980s but still widely used for training and civilian applications.',
 '55-grain FMJ lead core with a gilding metal jacket. Optimized for 1:12 twist rate. Slightly shorter and lighter than M855. Lead core construction.',
 ARRAY['Military','Target/Training'],
 NULL, NULL),

('Subsonic',
 'Sub',
 'Projectile or load loaded to remain below the speed of sound (~1,125 fps). Eliminates the ballistic crack (sonic boom) for quieter operation when used with a suppressor.',
 'Can be any bullet construction (FMJ, HP, solid) loaded to remain subsonic. Typically heavier-for-caliber projectiles. Most effective when paired with a suppressor.',
 ARRAY['Self-Defense','Hunting','Military'],
 NULL, NULL),

('Monolithic Solid',
 'Solid',
 'Projectile machined or formed from a single piece of metal (typically copper, bronze, or copper alloy). No core-jacket separation possible. Used for deep penetration on dangerous game.',
 'Single material construction — usually C10100 copper, gilding metal, or copper-nickel alloy. Lathe-turned or swaged. Heat-treated in some designs. Relief grooves to reduce fouling.',
 ARRAY['Hunting'],
 NULL, NULL),

('Saboted Light Armor Penetrator',
 'SLAP',
 'Tungsten sub-caliber penetrator in a plastic sabot. Fired from standard rifle, the sabot falls away revealing a smaller, denser penetrator. Dramatically higher velocity and penetration.',
 'Sub-caliber tungsten carbide penetrator enclosed in a plastic sabot that provides a bore-diameter fit. Sabot discards at the muzzle. Penetrator achieves much higher velocity due to lower mass.',
 ARRAY['Military'],
 NULL, NULL),

('Lead-Free Solid Copper',
 'LFC',
 'Non-expanding solid copper bullet used for deep penetration, especially on thick-skinned dangerous game. Does not deform significantly on impact.',
 'Solid copper (unalloyed) or copper-nickel projectile. Maintains its shape through thick hide and bone. Popular for Cape buffalo, elephant, and other thick-skinned African game.',
 ARRAY['Hunting'],
 NULL, NULL),

('Polymer-Tipped Spitzer',
 'Poly-Tip',
 'Hunting rifle bullet with a plastic tip that improves BC, initiates expansion, and protects the hollow cavity from deformation in magazines.',
 'Hollow point jacketed bullet with a plastic tip inserted into the hollow cavity. The tip streamlines the nose for improved BC. Upon impact, the tip is driven into the hollow point to initiate expansion.',
 ARRAY['Hunting'],
 NULL, NULL)

ON CONFLICT (name) DO NOTHING;
