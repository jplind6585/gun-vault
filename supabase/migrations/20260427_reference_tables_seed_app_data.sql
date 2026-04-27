-- Seed app hardcoded data into reference tables
-- Adds missing columns and seeds maintenance_procedures + match_formats
-- Created: 2026-04-27

-- ── Add missing columns ───────────────────────────────────────────────────────

ALTER TABLE public.maintenance_procedures
  ADD COLUMN IF NOT EXISTS tips TEXT[];

ALTER TABLE public.match_formats
  ADD COLUMN IF NOT EXISTS founded       TEXT,
  ADD COLUMN IF NOT EXISTS description   TEXT[],
  ADD COLUMN IF NOT EXISTS era           TEXT NOT NULL DEFAULT 'modern'
    CHECK (era IN ('historical','modern'));


-- ── Seed: maintenance_procedures ─────────────────────────────────────────────

INSERT INTO public.maintenance_procedures
  (id, name, procedure_category, applies_to, specific_platforms, difficulty, steps, tips, frequency_recommendation, round_count_interval, safety_warnings)
VALUES

('ar15-field-strip-clean',
 'AR-15 Field Strip & Cleaning',
 'cleaning',
 ARRAY['rifle'],
 ARRAY['AR-15','M4','M16'],
 2,
 '[
   {"step":1,"text":"Verify the weapon is unloaded: remove magazine, lock bolt back, visually inspect chamber."},
   {"step":2,"text":"Push out the two takedown pins (rear then front) and separate upper from lower receiver."},
   {"step":3,"text":"Remove the charging handle and bolt carrier group (BCG) from the upper receiver."},
   {"step":4,"text":"Disassemble the BCG: push out the firing pin retaining pin, remove firing pin, rotate and remove cam pin, extract the bolt."},
   {"step":5,"text":"Clean the bolt with a bronze brush and solvent; scrape the carbon ring at the bolt tail."},
   {"step":6,"text":"Clean the inside of the carrier with a chamber brush on a drill or by hand."},
   {"step":7,"text":"Run patches through the bore until they come out clean; finish with a lightly oiled patch."},
   {"step":8,"text":"Clean the chamber with a dedicated chamber brush."},
   {"step":9,"text":"Wipe down all parts, apply a thin coat of CLP or oil to bearing surfaces, and reassemble in reverse order."}
 ]'::jsonb,
 ARRAY[
   'The gas key on top of the carrier must be properly staked — if it wobbles, it needs re-staking or replacement.',
   'A Bolt Carrier Group should be inspected for cracks at the bolt tail (common failure point) periodically.',
   'Don''t over-lubricate — the AR runs well wet, but excess oil in the lower can attract carbon and grit.'
 ],
 'every 300 rounds',
 300,
 ARRAY['Always verify the firearm is unloaded before any maintenance.']
),

('handgun-field-strip-striker',
 'Handgun Cleaning (Striker-Fired)',
 'cleaning',
 ARRAY['pistol'],
 ARRAY['Glock 17','Glock 19','Sig P365','S&W M&P','Springfield Hellcat'],
 1,
 '[
   {"step":1,"text":"Verify unloaded: remove magazine, rack slide, visually and physically inspect chamber."},
   {"step":2,"text":"Perform field strip per manufacturer procedure (most Glocks: pull slide back slightly, drop takedown lever, slide forward off frame)."},
   {"step":3,"text":"Remove recoil spring assembly and barrel."},
   {"step":4,"text":"Run a bore brush through the barrel several times, follow with solvent-soaked patches, then dry patches until clean."},
   {"step":5,"text":"Clean the feed ramp and chamber with a nylon or bronze brush."},
   {"step":6,"text":"Wipe down the slide rails and frame rails; inspect for wear or unusual marks."},
   {"step":7,"text":"Apply a small drop of oil to each slide rail, the barrel hood, and the barrel link/locking block area."},
   {"step":8,"text":"Reassemble and function-check: dry fire, confirm reset, rack slide."}
 ]'::jsonb,
 ARRAY[
   'Most modern polymer pistols need minimal lubrication — three to four drops total is usually sufficient.',
   'Inspect the extractor for carbon buildup; a dirty extractor is a leading cause of FTE malfunctions.',
   'Replace recoil springs per manufacturer schedule — typically 3,000–5,000 rounds for most service pistols.'
 ],
 'after every use',
 500,
 ARRAY['Always verify the firearm is unloaded before disassembly.']
),

('bolt-action-rifle-clean',
 'Bolt-Action Rifle Cleaning',
 'cleaning',
 ARRAY['rifle'],
 ARRAY['Remington 700','Tikka T3x','Ruger Precision Rifle','Bergara B14'],
 2,
 '[
   {"step":1,"text":"Confirm unloaded; open the bolt and visually inspect the chamber."},
   {"step":2,"text":"Remove the bolt by pressing the bolt release (if equipped) and withdrawing fully."},
   {"step":3,"text":"Using a one-piece cleaning rod from the muzzle end (or breech if possible), run a bronze brush through the bore 10 times."},
   {"step":4,"text":"Follow with solvent-soaked patches, allowing 5 minutes of soak time for fouled barrels."},
   {"step":5,"text":"Run dry patches until no fouling is visible; a white patch should be nearly clean."},
   {"step":6,"text":"Apply a thin layer of rust-preventative oil to the bore for storage."},
   {"step":7,"text":"Clean the bolt face and extractor groove with a nylon pick or bronze brush."},
   {"step":8,"text":"Wipe the locking lugs and apply a very thin film of grease (not oil) to the lug contact surfaces."},
   {"step":9,"text":"Inspect and wipe the trigger group area; avoid oiling the trigger — it can cause sear creep."}
 ]'::jsonb,
 ARRAY[
   'Copper fouling (a blue-green residue on patches) requires a dedicated copper solvent — standard bore solvent won''t remove it.',
   'Always clean from the breech end if possible to avoid bending or wear at the crown, which is critical for accuracy.',
   'Check the scope mount screws for correct torque after each cleaning session.'
 ],
 'every 200 rounds or after each range session',
 200,
 ARRAY['Always confirm the firearm is unloaded before removing the bolt.']
),

('long-term-storage-prep',
 'Long-Term Storage Preparation',
 'storage',
 ARRAY['pistol','rifle','shotgun','revolver'],
 NULL,
 2,
 '[
   {"step":1,"text":"Clean all surfaces thoroughly, removing all carbon, copper, and powder fouling."},
   {"step":2,"text":"Dry the firearm completely before applying any storage product."},
   {"step":3,"text":"Apply a quality rust-preventative oil or grease to all metal surfaces, including the bore."},
   {"step":4,"text":"For bore storage: leave a lightly oiled patch in the chamber end; remove and re-clean before firing."},
   {"step":5,"text":"Remove batteries from any optics if storing for more than a few months."},
   {"step":6,"text":"Store in a hard-sided case with desiccant packs or in a gun safe with a dehumidifier rod."},
   {"step":7,"text":"Avoid storing in soft cases long-term; they can trap moisture against the metal."},
   {"step":8,"text":"Check stored firearms every 3–6 months and reapply rust prevention if needed."}
 ]'::jsonb,
 ARRAY[
   'VCI (Volatile Corrosion Inhibitor) bags and gun socks provide excellent passive protection in humid environments.',
   'Cosmoline, the traditional military storage grease, is extremely effective but must be fully removed before firing.',
   'Wood stocks can crack in very dry storage conditions; a light wipe with linseed oil keeps them conditioned.'
 ],
 'before any storage exceeding 1 month',
 NULL,
 ARRAY['Always clean and confirm firearm is unloaded before long-term storage.']
)

ON CONFLICT (id) DO NOTHING;


-- ── Seed: match_formats ───────────────────────────────────────────────────────

INSERT INTO public.match_formats
  (id, name, organization, discipline, format_type, scoring_system, era, founded, description)
VALUES

-- HISTORICAL
('palma',
 'Palma Match',
 'International / NRA',
 ARRAY['rifle'],
 'precision',
 'points_only',
 'historical',
 '1876',
 ARRAY[
   'International long-range rifle competition established in 1876 between the United States and Britain — predating the NRA''s first President''s Match and most organized American shooting sport.',
   'Shot at 800, 900, and 1000 yards using iron sights only, on issue-pattern service rifles. Modern rules permit .308 Winchester or .223 Remington in a standardized platform.',
   'The US Palma team has dominated internationally across multiple eras. The competitive pressure of the Palma Match directly influenced development of specialized .308 Winchester match loads and established the long-range iron sight tradition that influenced NRA High Power.'
 ]
),

('camp-perry',
 'National Matches at Camp Perry',
 'NRA / Civilian Marksmanship Program (CMP)',
 ARRAY['rifle'],
 'precision',
 'points_only',
 'historical',
 '1903',
 ARRAY[
   'The oldest continuous national shooting competition in the United States, held annually at Camp Perry, Ohio since 1903 — with interruptions only for the World Wars.',
   'Originally conceived to prepare citizen soldiers for military service, the Matches were funded in part by the US Army. Events include the President''s Match, the Wimbledon Cup (1000-yard iron sights), and the National Trophy Individual Match.',
   'The M1 Garand Games remain popular among collectors and students of military history. Camp Perry is ground zero for American rifle tradition — an enormous event that still draws thousands of competitors each summer.'
 ]
),

('bullseye',
 'NRA Bullseye (Precision Pistol)',
 'NRA',
 ARRAY['pistol'],
 'benchrest',
 'points_only',
 'historical',
 '~1900',
 ARRAY[
   'The oldest organized pistol sport in America. Three stages per gun: slow fire (10 shots, 10 minutes), timed fire (5 shots, 20 seconds), and rapid fire (5 shots, 10 seconds), at 25 and 50 yards. Fired one-handed.',
   'The three-gun aggregate — .22 LR, .38 Special or 9mm centerfire, and .45 ACP — totals 2700 points maximum. Master-class shooters routinely approach that number. The precision demanded is extraordinary.',
   'Bullseye produced more Olympic pistol shooters than any other American format and remains the technical foundation for precision pistol shooting. The grip, trigger control, and sight alignment fundamentals are transferable to any discipline.'
 ]
),

('olympic-shooting',
 'Olympic Shooting',
 'ISSF (International Shooting Sport Federation)',
 ARRAY['pistol','rifle','shotgun'],
 'precision',
 'points_only',
 'historical',
 '1896',
 ARRAY[
   'Shooting has been part of the modern Olympics since Athens 1896, making it one of the oldest continuously contested Olympic sports. Disciplines have changed over the decades — live pigeon shooting appeared once and was discontinued.',
   'Current events include 10m air pistol and air rifle, 25m rapid-fire pistol, 50m rifle 3-position, 10m air rifle mixed team, trap, and skeet.',
   'The equipment is specialized to a degree that makes competition hardware irrelevant outside the discipline — electronic triggers with ounce-weight pull weights, anatomically fitted grips, stocks with micro-adjustable cheekpieces. A 10m air rifle in full ISU configuration bears almost no practical relationship to a firearm.'
 ]
),

('ipsc',
 'IPSC (International Practical Shooting Confederation)',
 'IPSC',
 ARRAY['pistol','multi-gun'],
 'action',
 'hit_factor',
 'historical',
 '1976',
 ARRAY[
   'Founded at the 1976 Columbia Conference in Missouri by Jeff Cooper, Ray Chapman, Thell Reed, Mike Dalton, and others. Built around Cooper''s "Practical Shooting" philosophy: accuracy, power, and speed in balance — the Dilemma.',
   'Introduced the concept of moving through stages with multiple targets at varying distances rather than static bullseye shooting. The Power Factor system penalized underpowered ammunition by scoring minor-power hits differently than major.',
   'IPSC today is the largest practical shooting organization in the world with over 100 member nations. The rules have evolved considerably from Cooper''s original vision — the Open division race guns of today would be unrecognizable to the founders — but the fundamental stage format remains.'
 ]
),

('steel-challenge',
 'Steel Challenge',
 'SCSA / USPSA (since 2012)',
 ARRAY['pistol','rimfire'],
 'action',
 'time_plus',
 'historical',
 '1981',
 ARRAY[
   'Founded in 1981 in California by Mike Dalton and Mickey Fowler. Five steel plates arranged in a specific pattern unique to each of eight stages; the shooter must engage all plates and finish on the large stop plate.',
   'Five-string format — run the stage five times, drop the worst string, count the best four. Pure speed: no movement, no position requirements, no tactics. The format rewards trigger technique and target transitions above everything else.',
   'The SCSA became a division of USPSA in 2012. Rimfire divisions (rimfire pistol, rimfire rifle open and iron) have made Steel Challenge enormously popular as an entry-level competition — a .22 LR pistol and a club membership are the barriers to entry.'
 ]
),

('bianchi-cup',
 'Bianchi Cup',
 'NRA',
 ARRAY['pistol'],
 'action',
 'points_only',
 'historical',
 '1979',
 ARRAY[
   'Founded by holster craftsman and shooter John Bianchi in 1979 at the Columbia Missouri Shooting Range. The "World Action Pistol Championship" features four courses of fire: Practical (standing and kneeling at 10-50 yards), Barricade (from cover), Falling Plate (six 8-inch plates at 10-35 yards), and Moving Target.',
   'Shot with iron sights only, one pistol only. No optics divisions. Produces some of the tightest practical pistol shooting in the game — top competitors routinely shoot perfect or near-perfect scores across all four events.',
   'The Bianchi Cup is a technical showcase: the combination of speed and precision required, with iron sights only, separates accomplished shooters from exceptional ones. Limited to semi-automatic pistols in dominant configuration.'
 ]
),

('silhouette',
 'Metallic Silhouette',
 'NRA',
 ARRAY['rifle','pistol','rimfire'],
 'field',
 'points_only',
 'historical',
 '1950s (Mexico) / 1970s (US)',
 ARRAY[
   'Originated in Mexico in the 1950s as a hunting simulation — knock over steel animal silhouettes at distance on a timer. Chicken at 200 meters, pig at 300, turkey at 385, ram at 500.',
   'Migrated to the US and was formalized by the NRA in the 1970s. The sport spawned handgun silhouette (Thompson/Center Contender single-shot pistols at the same distances) and rimfire variants at reduced distances.',
   'The game rewards natural shooting ability over technical rules interpretation. There is no partial credit, no points for close — the animal either falls or it does not. This binary result makes the sport unforgiving and honest.'
 ]
),

('cowboy-action',
 'Cowboy Action Shooting (SASS)',
 'Single Action Shooting Society (SASS)',
 ARRAY['multi-gun'],
 'cowboy',
 'time_plus',
 'historical',
 '1987',
 ARRAY[
   'Founded informally in 1981 and formalized as SASS in 1987. Shooters use period-correct firearms designed or manufactured before 1899 (or replicas): single-action revolver, lever-action rifle, and pump or double-barrel shotgun.',
   'Costumes and shooting aliases are required. Theatrical stages set in the American West — bank robberies, saloon shootouts, range disputes. The sport introduced millions of shooters to older firearm designs and to the mechanics of single-action revolvers.',
   'The founders include actors and Hollywood-adjacent personalities who wanted a theatrical shooting game. SASS remains one of the most accessible and family-friendly shooting sports — the emphasis is on fun and costuming as much as competition.'
 ]
),

-- MODERN
('uspsa',
 'USPSA',
 'United States Practical Shooting Association',
 ARRAY['pistol','multi-gun'],
 'action',
 'hit_factor',
 'modern',
 '1984',
 ARRAY[
   'Broke from IPSC in 1984 over rule disagreements and has since become the dominant practical shooting organization in the US. Scoring is "Comstock" — points scored divided by time, rewarding both speed and accuracy simultaneously.',
   'Divisions span the equipment spectrum: Open (optics, compensators, extended magazines — the race gun division), Limited (no optics, larger mags), Production (stock or near-stock pistols), Carry Optics (RDS allowed), Revolver, and PCC (pistol-caliber carbine).',
   'Stage design rewards movement, stage reading, and target engagement order as much as raw shooting skill. The Open division has driven extraordinary technical development in semi-automatic pistol hardware — compensated 2011-pattern race guns, optical sights, and extended magazines are the norm at the top level.'
 ]
),

('idpa',
 'IDPA',
 'International Defensive Pistol Association',
 ARRAY['pistol'],
 'action',
 'time_plus',
 'modern',
 '1996',
 ARRAY[
   'Founded in 1996 by Bill Wilson, Walt Rauch, Ken Hackathorn, Larry Vickers, and others frustrated with USPSA''s drift toward equipment-intensive race guns. Intended to simulate real defensive scenarios with practical, street-legal equipment.',
   'Rules require shooting from concealment, limit magazine capacity, and mandate reloading to slide-lock in most situations (no "tactical reloads" that preserve ammunition at the expense of speed). Classifications: BUG, SSP, ESP, CCP, CDP, REV, PCC.',
   'Criticized by some as artificially restricting equipment and creating unrealistic administrative rules. Praised by others as the discipline that keeps practical shooting accessible to competitors running duty guns and carry equipment. IDPA remains the entry point for many defensive-minded shooters.'
 ]
),

('prs',
 'Precision Rifle Series (PRS)',
 'PRS',
 ARRAY['rifle'],
 'precision',
 'points_only',
 'modern',
 '2012',
 ARRAY[
   'Founded in 2012, the PRS exploded in popularity through 2015-2020 and spawned an entire industry segment. Bolt-action rifle stages shot from field positions — barricades, awkward rests, vehicles, rooftops — at steel targets from 300 to 1200+ yards.',
   '6.5 Creedmoor dominates the field because it fits short-action platforms, has excellent long-range performance (high BC, moderate recoil), and factory match ammunition is widely available. Stages are time-limited with points awarded per hit.',
   'PRS drove the modern precision rifle hardware industry: chassis systems, field-capable tripods, specialized exposed turrets with zero stops, and the entire .308 and 6.5mm match ammunition market. The PRS Pro Series is the highest competitive level; an extensive regional league system feeds into it.'
 ]
),

('nrl',
 'National Rifle League (NRL)',
 'NRL',
 ARRAY['rifle','rimfire'],
 'precision',
 'points_only',
 'modern',
 '2016',
 ARRAY[
   'A competitor to PRS with a somewhat different stage design philosophy — NRL emphasizes field positions and natural terrain use. Founded in 2016 and has grown steadily alongside PRS rather than replacing it.',
   'NRL22 is the rimfire league under the NRL umbrella — .22 LR bolt-action rifles shot from field positions at steel targets from 25 to 100+ yards. The entry cost is a fraction of centerfire precision: a quality .22 target rifle, a scope, and rimfire ammunition.',
   'NRL22X uses larger-bore rimfire calibers (.17 HMR, .22 WMR) for extended range. The league structure mirrors PRS with local club matches and a national championship. NRL22 has brought thousands of new shooters into precision rifle as a direct, affordable entry point.'
 ]
),

('three-gun',
 '3-Gun / Multi-Gun',
 'Various (MGM, 3GN, local clubs)',
 ARRAY['multi-gun'],
 'three_gun',
 'time_plus',
 'modern',
 '1990s',
 ARRAY[
   'Uses rifle, pistol, and shotgun in the same stage — sometimes simultaneously, sometimes in sequence. Shotgun load selection matters: birdshot for cardboard and clay birds, slug transitions for steel at distance. Stage design can require running hundreds of yards while managing three guns.',
   'The sport rewards equipment selection almost as much as shooting skill. Divisions range from Tactical (iron sights, stock guns) to Open (optics on everything, extended shotgun tubes, compensated rifles) and the growing Heavy Optics division.',
   'Physically demanding in a way that no other shooting sport matches — stages often require sprinting, crawling, climbing, and transitioning between three firearms under time pressure. Multi-Gun is as much an athletic event as a shooting event.'
 ]
),

('fclass',
 'F-Class',
 'F-Class International / NRA',
 ARRAY['rifle'],
 'precision',
 'points_only',
 'modern',
 '2000s',
 ARRAY[
   'Prone position, bipod or front rest allowed, rear bag — no sling. Created by Canadian shooter George "Farky" Farquharson (the "F" is for Farky) to allow older or less-mobile shooters to compete at long-range prone without the demanding sling position required in traditional NRA Prone.',
   'F-Open allows any caliber and any front rest or bipod. F-TR requires .308 Winchester or .223 Remington with a bipod only (no front rest). Shot at 300, 600, and 1000 yards on standard NRA/ICFRA targets.',
   'F-Class is ground zero for handload development. The competitive pressure drives extraordinary attention to precision: case sorting by weight, seating depth experiments in thousandths of an inch, primer lot testing. No other format produces as much handloading knowledge.'
 ]
),

('benchrest',
 'Benchrest',
 'NBRSA / IBS',
 ARRAY['rifle'],
 'benchrest',
 'aggregate',
 'modern',
 '1944',
 ARRAY[
   'The most precise form of rifle shooting. The rifle rests entirely on mechanical front and rear bags — no sling, no bipod, no physical contact beyond trigger finger and light forward hand. Group size is measured in thousandths of an inch with calipers.',
   'The smallest recorded 100-yard groups are under 0.1 inch — five shots in one hole indistinguishable to the naked eye. Barrel life is measured in hundreds of rounds; a benchrest barrel may be replaced after 300 firings. Single-shot bolt actions chambered in wildcats (6 PPC, 6 BR, .222 Rem Mag) dominate.',
   'Benchrest has produced more advances in rifle accuracy than any other discipline: consistent case forming, seating depth precision, primer selection methodology, barrel bedding, and the validation of match-grade components. Most of what competitive shooters know about accuracy comes from benchrest.'
 ]
),

('nrl22',
 'NRL22',
 'NRL',
 ARRAY['rimfire'],
 'precision',
 'points_only',
 'modern',
 '2018',
 ARRAY[
   'The rimfire precision league under the NRL umbrella, launched in 2018. Uses .22 LR bolt-action rifles shot from field positions at steel targets from 25 to 100+ yards. Match format is nearly identical to PRS and NRL centerfire competition.',
   'Entry cost is genuinely accessible: a quality .22 LR target rifle (CZ 457, Vudoo, Bergara B-14R) with a quality scope, and bulk quality rimfire ammunition. The barrier that gates precision rifle to a narrow demographic does not exist in NRL22.',
   'The community has grown to hundreds of clubs and thousands of registered competitors. Many centerfire PRS shooters use NRL22 as dry-fire-equivalent trigger time between major matches. The technique transfer is high and the cost to shoot is a fraction of .308 or 6.5 Creedmoor.'
 ]
),

('scsa-modern',
 'SCSA (Steel Challenge)',
 'Steel Challenge Shooting Association / USPSA',
 ARRAY['pistol','rimfire'],
 'action',
 'time_plus',
 'modern',
 'USPSA division since 2012',
 ARRAY[
   'Under the USPSA umbrella since 2012. See historical entry for the format origin. Rimfire pistol (iron and optics) and rimfire rifle divisions have expanded the sport massively beyond its centerfire origins.',
   'A top rimfire shooter in Steel Challenge Open division is as technically refined as any pistol shooter alive. The .22 LR''s near-zero recoil removes recoil management from the equation entirely — what remains is pure trigger technique, grip consistency, and target transition efficiency.',
   'SCSA is one of the most clock-honest sports in shooting. Five strings, drop the worst — the timer does not negotiate. Top competitors in Rimfire Pistol Open shoot strings in under two seconds across all eight stages.'
 ]
),

('nra-action-pistol',
 'NRA Action Pistol',
 'NRA',
 ARRAY['pistol'],
 'action',
 'points_only',
 'modern',
 '1985',
 ARRAY[
   'The NRA''s practical pistol format, distinct from Bullseye. Includes the Bianchi Cup format courses of fire plus the NRA Action Pistol Championships. A disciplined bridge between the pure precision of Bullseye and the speed game of USPSA.',
   'Iron sights only in traditional configuration. Single pistol for the entire competition. The moving target event separates this format from static precision disciplines — tracking a moving target and breaking shots cleanly is a skill unto itself.',
   'NRA Action Pistol has produced some of the most technically complete practical pistol shooters. The iron-sights requirement and single-gun format ensure that equipment cannot substitute for fundamental skill.'
 ]
)

ON CONFLICT (id) DO NOTHING;
