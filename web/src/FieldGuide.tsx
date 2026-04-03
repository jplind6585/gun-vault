import { useState, useMemo } from 'react';
import { theme } from './theme';
import { FieldGuideOptics } from './FieldGuideOptics';
import { FieldGuideCompetition } from './FieldGuideCompetition';
import { FieldGuideMarksmanship } from './FieldGuideMarksmanship';
import { CaliberDatabase } from './CaliberDatabase';

type GuideSection = 'home' | 'glossary' | 'camos' | 'platforms' | 'ballistics' | 'maintenance' | 'optics' | 'competition' | 'marksmanship' | 'cartridges';

// ─── GLOSSARY DATA ────────────────────────────────────────────────────────────

interface GlossaryTerm {
  acronym: string;
  expansion: string;
  definition: string;
  group: string;
}

const GLOSSARY_TERMS: GlossaryTerm[] = [
  // A
  { acronym: 'ACU', expansion: 'Army Combat Uniform', definition: 'The US Army uniform platform that replaced BDUs in 2004, initially paired with the UCP pattern.', group: 'A' },
  { acronym: 'AIWB', expansion: 'Appendix Inside the Waistband', definition: 'IWB holster worn at the 12 o\'clock (front) position. Allows fast draw but requires discipline and quality holster.', group: 'A' },
  { acronym: 'AOW', expansion: 'Any Other Weapon', definition: 'NFA catch-all category for concealable firearms that don\'t fit other regulated categories. Includes pen guns, cane guns, and some pistol-gripped shotguns.', group: 'A' },
  { acronym: 'AP', expansion: 'Armor Piercing', definition: 'Hardened core (typically tungsten or steel) for penetrating armor. Heavily regulated under the Gun Control Act; most rifle AP and all handgun AP is banned for civilian sale.', group: 'A' },
  { acronym: 'API', expansion: 'Armor Piercing Incendiary', definition: 'AP round with an incendiary compound behind the penetrator. Ignites on impact. Largely prohibited for civilian use.', group: 'A' },
  { acronym: 'APCR', expansion: 'Armor Piercing Composite Rigid', definition: 'WWII-era anti-armor round featuring a tungsten carbide core inside a lighter carrier body. Higher velocity than conventional AP but less effective at oblique angles.', group: 'A' },

  // B
  { acronym: 'BC', expansion: 'Ballistic Coefficient', definition: 'A number describing how efficiently a bullet resists air drag. Higher BC = less drop and wind drift at distance. G1 and G7 are the two common drag models.', group: 'B' },
  { acronym: 'BCG', expansion: 'Bolt Carrier Group', definition: 'The reciprocating assembly in an AR-pattern rifle: bolt, carrier, firing pin, cam pin, and retaining pin. The heart of the gas-operated action.', group: 'B' },
  { acronym: 'BDC', expansion: 'Bullet Drop Compensator', definition: 'Reticle subtensions or a turret cam designed to compensate for bullet drop at set distances. Only accurate for the specific ammo the scope was calibrated with.', group: 'B' },

  // C
  { acronym: 'CCW', expansion: 'Concealed Carry Weapon', definition: 'A firearm carried in a concealed manner on the person. Also refers to the permit itself in states that require one.', group: 'C' },
  { acronym: 'CEP', expansion: 'Circular Error Probable', definition: 'Radius of a circle within which 50% of shots will land. A standard military accuracy metric; smaller CEP = more accurate system.', group: 'C' },
  { acronym: 'CIP', expansion: 'Commission Internationale Permanente', definition: 'The European standards body for cartridge dimensions and pressures, equivalent to SAAMI. Most European and many Asian firearms are CIP-proofed.', group: 'C' },

  // D
  { acronym: 'DA', expansion: 'Double Action', definition: 'Trigger mechanism where pulling the trigger both cocks and releases the hammer or striker. Longer, heavier pull than SA but can fire from a decocked state.', group: 'D' },
  { acronym: 'DA/SA', expansion: 'Double Action / Single Action', definition: 'Hybrid system: first shot fires DA (long heavy pull from decocked), subsequent shots fire SA (short light pull with hammer cocked). Common in Beretta, SIG, and CZ designs.', group: 'D' },
  { acronym: 'DAO', expansion: 'Double Action Only', definition: 'Always fires in double action; no external hammer to cock manually. Consistent trigger pull for every shot. Common in DAO revolvers and some compact semi-autos.', group: 'D' },
  { acronym: 'DOPE', expansion: 'Data On Previous Engagements', definition: 'A shooter\'s recorded scope adjustments (elevation and windage) for a specific rifle, ammunition, and distance combination. The foundation of precision long-range shooting.', group: 'D' },
  { acronym: 'Double Feed', expansion: 'Double Feed Malfunction', definition: 'Two rounds attempting to enter the chamber simultaneously. Typically caused by a failure to extract. Requires an emergency reload procedure: lock bolt back, strip magazine, rack three times, reload.', group: 'D' },

  // E
  { acronym: 'EDC', expansion: 'Every Day Carry', definition: 'A firearm (or gear loadout) that a person carries daily for personal protection. EDC philosophy emphasizes balancing concealability with capability.', group: 'E' },
  { acronym: 'ES', expansion: 'Extreme Spread', definition: 'The difference between the fastest and slowest velocity in a string of shots, measured by chronograph. Also used to describe the largest distance between any two shots in a group.', group: 'E' },

  // F
  { acronym: 'FFL', expansion: 'Federal Firearms License', definition: 'Required to commercially manufacture, import, or deal in firearms in the United States. Multiple license types exist; Type 01 is the common dealer FFL.', group: 'F' },
  { acronym: 'FFP', expansion: 'First Focal Plane', definition: 'Scope reticle mounted in the front focal plane; scales with magnification. MOA/MIL holds and measurements are correct at any power setting. Preferred for variable-power precision scopes.', group: 'F' },
  { acronym: 'FMJ', expansion: 'Full Metal Jacket', definition: 'Bullet with a soft lead core fully enclosed in a harder metal jacket (usually gilding metal or copper-washed steel). Does not expand. Standard practice and range ammunition; required by Hague Convention for military use.', group: 'F' },
  { acronym: 'FTF', expansion: 'Failure to Feed', definition: 'A malfunction where a round fails to chamber from the magazine. Causes include damaged magazine lips, weak recoil spring, or improper ammunition seating.', group: 'F' },
  { acronym: 'FTE', expansion: 'Failure to Eject', definition: 'A fired case that fails to leave the action after extraction. Often caused by a weak or dirty extractor, or low-pressure ammunition in a gas-operated system.', group: 'F' },
  { acronym: 'FTFire', expansion: 'Failure to Fire', definition: 'The primer was struck by the firing pin but the round did not fire. Causes: light primer strike, hard primer, wet or degraded powder, or a squib condition. Wait 30 seconds before opening the action.', group: 'F' },

  // G
  { acronym: 'G1/G7', expansion: 'Ballistic Drag Function Models', definition: 'Reference projectile shapes used to calculate BC. G1 (flat-base blunt nose) is traditional but less accurate for long-range. G7 (boat-tail spitzer) is more accurate for modern boat-tail rifle bullets beyond 400 yards.', group: 'G' },

  // H
  { acronym: 'HPBT', expansion: 'Hollow Point Boat Tail', definition: 'A boat-tail bullet with a small open tip formed by the jacketing process. Functionally identical to OTM; the open tip improves manufacturing uniformity, not expansion. The standard precision match bullet form.', group: 'H' },

  // I
  { acronym: 'IWB', expansion: 'Inside the Waistband', definition: 'A holster style worn inside the waistband, between the body and pants. Provides better concealment than OWB but requires slightly larger clothing.', group: 'I' },

  // J
  { acronym: 'JHP', expansion: 'Jacketed Hollow Point', definition: 'A jacketed bullet with a hollow cavity in the tip that causes controlled expansion on impact. Transfers more energy to the target and reduces over-penetration. The standard defensive ammunition choice.', group: 'J' },
  { acronym: 'JSP', expansion: 'Jacketed Soft Point', definition: 'A partial-jacket bullet with an exposed lead tip that promotes controlled expansion. Better feeding in semi-automatic actions than a plain soft point. Common in hunting and some defensive loads.', group: 'J' },

  // L
  { acronym: 'LRBHO', expansion: 'Last Round Bolt Hold Open', definition: 'A feature that automatically locks the bolt back when the magazine is empty. Signals the shooter to reload and speeds the reload process. Standard on most modern semi-automatic pistols and rifles.', group: 'L' },

  // M
  { acronym: 'MEP', expansion: 'Mean Point of Impact', definition: 'The statistical center point of a shot group — the average X/Y coordinate of all impacts. Distinct from the tightest cluster; used when evaluating zero and ammo consistency.', group: 'M' },
  { acronym: 'MIL / MRAD', expansion: 'Milliradian', definition: 'An angular unit of measure. 1 MIL = 3.6 inches at 100 yards (10cm at 100m). Common in military and precision rifle optics. A MIL-based system allows direct range estimation and holdover calculation without unit conversion.', group: 'M' },
  { acronym: 'MOA', expansion: 'Minute of Angle', definition: 'An angular unit equal to 1/60th of a degree, or approximately 1.047 inches at 100 yards. Used to measure group size and to specify scope adjustment. Most scopes click in 1/4 MOA or 1/8 MOA increments.', group: 'M' },
  { acronym: 'MTP', expansion: 'Multi-Terrain Pattern', definition: 'British armed forces camouflage pattern developed by Crye Precision, replacing DPM. A modified MultiCam tuned for British requirements. Adopted in 2010 after Afghanistan combat experience.', group: 'M' },

  // N
  { acronym: 'NATO', expansion: 'North Atlantic Treaty Organization', definition: 'NATO-spec ammunition meets STANAG standardization agreements for pressure, dimensions, and interchangeability. NATO 5.56mm runs at higher pressure than SAAMI .223 Rem; use caution in .223-only chambers.', group: 'N' },
  { acronym: 'NFA', expansion: 'National Firearms Act (1934)', definition: 'Federal law regulating machine guns, suppressors, short-barreled rifles, short-barreled shotguns, AOWs, and destructive devices. Requires registration, $200 tax stamp (for most items), and ATF approval.', group: 'N' },

  // O
  { acronym: 'OC', expansion: 'Open Carry', definition: 'Carrying a firearm in a visible, unconcealed manner. Legality varies widely by state and jurisdiction. Some states are permissive; others require a permit even for open carry.', group: 'O' },
  { acronym: 'OTM', expansion: 'Open Tip Match', definition: 'A boat-tail bullet with a small opening at the tip formed by drawing the jacket from the base. The open tip is an artifact of manufacturing, not designed for expansion. Preferred for its manufacturing consistency in precision shooting.', group: 'O' },
  { acronym: 'OWB', expansion: 'Outside the Waistband', definition: 'A holster worn on the outside of the belt. Easier to draw from and more comfortable than IWB, but requires a cover garment for concealment.', group: 'O' },

  // P
  { acronym: 'POA', expansion: 'Point of Aim', definition: 'Where the sights or reticle are directed. The difference between POA and POI is the offset the shooter must account for at any given range.', group: 'P' },
  { acronym: 'POI', expansion: 'Point of Impact', definition: 'Where the bullet actually strikes. A properly zeroed rifle has POA = POI at the zero distance; the two diverge at other distances due to bullet drop and wind drift.', group: 'P' },
  { acronym: '+P', expansion: 'Overpressure Ammunition', definition: 'Ammunition loaded to higher pressure than the standard SAAMI specification. Marked +P. Produces higher velocity but accelerates wear. Only use in firearms rated for +P.', group: 'P' },
  { acronym: '+P+', expansion: 'Over-Overpressure Ammunition', definition: 'Loaded even higher than +P. No SAAMI standard exists for this designation; it is manufacturer-defined. Treat as non-standard and verify firearm compatibility before use.', group: 'P' },

  // S
  { acronym: 'SA', expansion: 'Single Action', definition: 'Trigger mechanism that only releases the hammer or striker; the action must be pre-cocked externally. Short, light trigger pull. Standard on 1911s, revolvers in SA mode, and many competition pistols.', group: 'S' },
  { acronym: 'SAAMI', expansion: 'Sporting Arms and Ammunition Manufacturers\' Institute', definition: 'The US standards body that sets specifications for cartridge dimensions, pressures, and performance. If a cartridge is SAAMI-spec, any SAAMI-spec firearm in that caliber should safely chamber it.', group: 'S' },
  { acronym: 'SAO', expansion: 'Single Action Only', definition: 'Firearm that can only fire in single action — the striker or hammer must be cocked before firing. Requires manual cocking or a cycling action to prepare. Common on 1911-pattern pistols.', group: 'S' },
  { acronym: 'SBR', expansion: 'Short Barreled Rifle', definition: 'A rifle with a barrel under 16" or overall length under 26". An NFA item in the United States; requires a $200 tax stamp and ATF approval. Penalties for unregistered SBRs are severe.', group: 'S' },
  { acronym: 'SBS', expansion: 'Short Barreled Shotgun', definition: 'A shotgun with a barrel under 18" or overall length under 26". NFA item, same registration process as SBRs.', group: 'S' },
  { acronym: 'SD', expansion: 'Sectional Density', definition: 'Bullet weight (in pounds) divided by the square of its diameter (in inches). Higher SD = better penetration for a given bullet construction. A key metric for hunting and barrier penetration.', group: 'S' },
  { acronym: 'SD (velocity)', expansion: 'Standard Deviation of Velocity', definition: 'A statistical measure of velocity consistency across a string of shots. Lower is better. Under 10 fps is excellent; over 20 fps suggests a handloading or quality issue affecting precision at distance.', group: 'S' },
  { acronym: 'SFP', expansion: 'Second Focal Plane', definition: 'Scope reticle mounted behind the erector assembly; stays the same apparent size regardless of magnification. MOA/MIL values on the reticle are only correct at one specific power (usually max). Common in budget and medium-tier scopes.', group: 'S' },
  { acronym: 'SOT', expansion: 'Special Occupational Taxpayer', definition: 'A Federal Firearms Licensee who has paid the Special Occupational Tax to deal in, manufacture, or import NFA items as a business. SOTs can transfer NFA items on a dealer sample basis without the standard $200 tax.', group: 'S' },
  { acronym: 'SP', expansion: 'Soft Point', definition: 'A bullet with an exposed lead tip and partial metal jacket. The exposed lead promotes controlled expansion on impact. A traditional hunting bullet design, effective across a wide range of game.', group: 'S' },
  { acronym: 'Stovepipe', expansion: 'Stovepipe Malfunction (FTE Variant)', definition: 'A failure to eject where the empty case stands upright in the ejection port, resembling a stovepipe. Cleared with a tap-rack or a swipe of the firing hand. Often caused by a limp wrist grip or dirty extractor.', group: 'S' },

  // T
  { acronym: 'TMJ', expansion: 'Total Metal Jacket', definition: 'A bullet fully encased in metal jacket including the base, unlike standard FMJ. Eliminates base exposure that vaporizes lead under high heat. Preferred for indoor ranges to reduce airborne lead contamination.', group: 'T' },

  // ── General terms — for shooters who are new to firearms ─────────────────

  { acronym: 'Action', expansion: 'Operating Mechanism', definition: 'The mechanical system that loads, fires, and ejects cartridges. Common types: Semi-Automatic (auto-loads next round after each shot), Bolt-Action (manually cycle a bolt handle between shots), Lever-Action (work a lever under the receiver), Revolver (rotating cylinder), Pump (slide a fore-end), Single-Shot (one round at a time).', group: 'A' },

  { acronym: 'Barrel Length', expansion: 'Barrel Length', definition: 'Distance from the chamber to the muzzle, measured in inches. Longer barrels produce higher velocity and are easier to aim accurately at distance. Shorter barrels are more compact. Legally significant: rifles must have a barrel of 16"+ and shotguns 18"+ to avoid NFA regulation.', group: 'B' },
  { acronym: 'Bolt-Action', expansion: 'Bolt-Action Firearm', definition: 'A firearm type where the shooter manually lifts and pulls back a bolt handle to eject the fired case, then pushes it forward to chamber a new round. Simple, reliable, and extremely accurate. The standard choice for hunting rifles and precision long-range shooting.', group: 'B' },

  { acronym: 'Caliber', expansion: 'Cartridge / Bore Diameter', definition: 'The size designation of a firearm and the ammunition it fires — usually the bullet\'s diameter in inches or millimeters (e.g., 9mm, .45 ACP, .308 Win). A firearm can only safely fire the specific caliber it is chambered for.', group: 'C' },
  { acronym: 'Capacity', expansion: 'Magazine or Cylinder Capacity', definition: 'The maximum number of rounds a magazine (semi-automatic) or cylinder (revolver) can hold before requiring a reload. May be legally restricted to 10 rounds or fewer in some states.', group: 'C' },
  { acronym: 'Chamber', expansion: 'Cartridge Chamber', definition: 'The cavity at the rear of the barrel where a cartridge sits when ready to fire. "Chambered" means a round is loaded and ready. "Clearing the chamber" means verifying it is empty — a core safety step.', group: 'C' },

  { acronym: 'Elevation', expansion: 'Vertical Scope / Sight Adjustment', definition: 'The up/down adjustment on a scope or iron sight. Dialing elevation up raises the bullet\'s point of impact. Used to compensate for bullet drop at longer distances.', group: 'E' },

  { acronym: 'Grain (gr)', expansion: 'Grain — Unit of Bullet Weight', definition: 'The standard unit for measuring bullet and powder weight. 1 grain = 1/7000th of a pound. Common pistol bullets are 115–230 gr; rifle bullets 55–175 gr. Heavier bullets are slower but carry more energy at distance; lighter bullets are faster and shoot flatter.', group: 'G' },

  { acronym: 'Magazine', expansion: 'Detachable Magazine', definition: 'A spring-loaded container that holds and feeds cartridges into a semi-automatic firearm. Not a "clip" — magazines are self-contained feeding devices. Revolvers use a rotating cylinder instead. Magazines are typically made of metal or polymer.', group: 'M' },
  { acronym: 'Muzzle', expansion: 'Muzzle — Front of the Barrel', definition: 'The open front end of the barrel where the bullet exits. Rule #2 of firearm safety: never point the muzzle at anything you are not willing to destroy. Muzzle devices (suppressors, flash hiders, muzzle brakes) thread onto the muzzle.', group: 'M' },
  { acronym: 'Muzzle Velocity', expansion: 'Bullet Speed at the Muzzle (fps)', definition: 'The speed of a bullet as it exits the barrel, measured in feet per second (fps). Higher velocity = flatter trajectory and more energy delivered to the target. Affected by barrel length, powder charge, bullet weight, and temperature.', group: 'M' },

  { acronym: 'Par Time', expansion: 'Par Time — Training Benchmark', definition: 'The target completion time for a shooting drill, measured with a shot timer. Finishing under par = pass; over par = more practice needed. A structured way to track improvement over time without just "shooting for fun."', group: 'P' },
  { acronym: 'Plinking', expansion: 'Casual Informal Shooting', definition: 'Informal, recreational shooting at cans, bottles, or paper targets — just for fun, no training structure or scoring. Great way for new shooters to build comfort and confidence with a firearm.', group: 'P' },

  { acronym: 'Reticle', expansion: 'Scope Crosshair / Aiming Pattern', definition: 'The aiming pattern visible inside a scope or reflex sight. Can be a simple crosshair (+), dot, mil-dot grid, or complex BDC pattern. Illuminated reticles glow for low-light use. The reticle is what you align on the target before pressing the trigger.', group: 'R' },
  { acronym: 'Round Count', expansion: 'Total Rounds Fired', definition: 'The cumulative number of rounds (bullets) fired through a specific firearm. Tracked to monitor wear, plan maintenance intervals, and determine when components like recoil springs should be replaced. Similar to mileage on a car.', group: 'R' },

  { acronym: 'Semi-Automatic', expansion: 'Semi-Automatic Action', definition: 'A firearm that automatically ejects the spent case and chambers the next round after each shot — but requires a separate trigger pull for each bullet fired. Not "fully automatic" (which fires continuously while the trigger is held). The most common action in modern pistols, many rifles, and some shotguns.', group: 'S' },
  { acronym: 'Suppressor', expansion: 'Sound Suppressor / Silencer', definition: 'A device threaded onto the muzzle that reduces the sound of a gunshot by trapping and cooling expanding gases. Often called a "silencer" — but real suppressors reduce, not eliminate, the sound. Regulated as NFA items in the US: $200 tax stamp, ATF approval, months-long wait.', group: 'S' },

  { acronym: 'Turret', expansion: 'Scope Adjustment Turret', definition: 'The knobs on the top and side of a scope used to adjust point of impact. The elevation turret adjusts up/down; the windage turret adjusts left/right. Each click moves impact by a specific MOA or MIL increment. "Capping the turrets" protects them from accidental adjustment.', group: 'T' },

  { acronym: 'Windage', expansion: 'Horizontal Scope / Sight Adjustment', definition: 'The left/right adjustment on a scope or iron sight, used to correct for wind drift or zero error. Turning windage right moves the point of impact right. Paired with elevation (up/down), windage completes the two-axis adjustment system of all modern optics.', group: 'W' },

  { acronym: 'Zero / Zeroing', expansion: 'Sight Alignment at a Specific Distance', definition: 'The process of adjusting a scope or iron sights so the point of aim (where the crosshair points) matches the point of impact (where the bullet lands) at a specific distance. A "100-yard zero" means the gun is sighted in to hit exactly where you aim at 100 yards. Bullets drop beyond that distance due to gravity.', group: 'Z' },
];

// ─── CAMOS DATA ───────────────────────────────────────────────────────────────

interface CamoPattern {
  id: string;
  name: string;
  country: string;
  era: string;
  type: 'military' | 'hunting' | 'law enforcement';
  colors: string[];
  body: string;
  region: string;
}

const CAMO_PATTERNS: CamoPattern[] = [
  {
    id: 'erdl',
    name: 'ERDL (Leaf Pattern)',
    country: 'USA',
    era: '1948–1980s',
    type: 'military',
    colors: ['#4a6741', '#8b7355', '#2d3a1e', '#c4a96e'],
    body: 'The original modern camouflage, developed by the US Army Engineer Research and Development Laboratories in 1948. A four-color pattern of interlocking organic shapes — green, brown, black, and khaki. Used in Vietnam but issued inconsistently; soldiers often obtained it through unofficial channels. Inspired virtually every subsequent Western military pattern.',
    region: 'USA',
  },
  {
    id: 'woodland-bdu',
    name: 'Woodland BDU',
    country: 'USA',
    era: '1981–2015',
    type: 'military',
    colors: ['#4a6741', '#8b7355', '#2d3a1e', '#c4a96e'],
    body: 'A commercially enlarged version of ERDL, designed to be more producible at scale. Became the face of American military power for over three decades and was widely adopted or cloned by allies and adversaries alike. Replaced in Army service by ACU in 2004, but remained in use across other branches until the early 2010s.',
    region: 'USA',
  },
  {
    id: 'ucp',
    name: 'ACU / UCP (Universal Camouflage Pattern)',
    country: 'USA',
    era: '2004–2015',
    type: 'military',
    colors: ['#8e9a8a', '#636b5e', '#a5afa2', '#555c51'],
    body: 'The Army\'s digitized pixelated pattern, selected over MultiCam in testing. Proved nearly invisible in one environment: the urban concrete environments it was named for — except in actual combat, where it was mocked by soldiers as "universal failure." Studies confirmed it was among the worst performers in nearly all tested environments. Replaced by OCP (Scorpion/MultiCam) from 2015 onward.',
    region: 'USA',
  },
  {
    id: 'marpat',
    name: 'MARPAT (Digital Woodland/Desert)',
    country: 'USA (USMC)',
    era: '2001–present',
    type: 'military',
    colors: ['#4d5e3a', '#7a6642', '#2a3020', '#a89468'],
    body: 'The Marine Corps\' proprietary digital pattern, developed with Canadian CADPAT technology. The USMC holds the trademark; no other US branch may use it. The digital "micro-pattern" of pixels is more effective at blurring object edges than traditional organic shapes. Issued in woodland and desert variants.',
    region: 'USA',
  },
  {
    id: 'multicam',
    name: 'MultiCam / OCP',
    country: 'USA',
    era: '2010–present',
    type: 'military',
    colors: ['#8b7d52', '#5a6442', '#c4ab78', '#3d4a2a', '#a09060'],
    body: 'Designed by Crye Precision, MultiCam was rejected in the early 2000s Army trials in favor of UCP, then adopted for Afghanistan ops in 2010 when UCP\'s failure became undeniable. The "Scorpion W2" variant was adopted Army-wide as OCP in 2015. A transitional gradient from light tan to dark green makes it highly adaptable across terrain types.',
    region: 'USA',
  },
  {
    id: 'kryptek',
    name: 'Kryptek Highlander',
    country: 'USA',
    era: '2012–present',
    type: 'military',
    colors: ['#8a8060', '#4a5038', '#c0b070', '#2a3020', '#a09858'],
    body: 'A commercial pattern from Kryptek Outdoor Group featuring a scale/feather base structure overlaid with blotch shapes. The layered design theory aims to work at multiple distances — the scale structure at close range, the macro blotches at longer range. Widely adopted by military-adjacent gear companies and various law enforcement units.',
    region: 'USA',
  },
  {
    id: 'realtree',
    name: 'RealTree AP',
    country: 'USA',
    era: '1986–present',
    type: 'hunting',
    colors: ['#3a4820', '#6a5830', '#8a7840', '#c0a868', '#2a3018'],
    body: 'The dominant hunting camouflage in North America, RealTree uses photographic prints of actual branches, leaves, and bark. Founded by Bill Jordan in 1986, RealTree pioneered the photorealistic camouflage concept. Effective at concealment in hardwood timber; less effective in grassy or open terrain. A multi-hundred-million-dollar commercial success.',
    region: 'USA',
  },
  {
    id: 'mossy-oak',
    name: 'Mossy Oak Break-Up',
    country: 'USA',
    era: '1986–present',
    type: 'hunting',
    colors: ['#2a3018', '#4a4028', '#7a6838', '#a08048', '#c0a870'],
    body: 'RealTree\'s primary competitor, Mossy Oak uses an artistic rather than strictly photographic approach — stylized bark, branches, and foliage layered for depth. The "Break-Up" variant launched in 1990 became one of the best-selling hunting patterns in history. Updated every few years with new variants (Country, Obsession, etc.) tuned for specific species or terrain types.',
    region: 'USA',
  },
  {
    id: 'flecktarn',
    name: 'Flecktarn',
    country: 'Germany',
    era: '1990–present',
    type: 'military',
    colors: ['#4a5e2a', '#7a6a3a', '#2a3a18', '#c4b480', '#8a9a60'],
    body: 'Germany\'s iconic "spot camouflage" featuring irregular blotches of five colors. Testing showed disruptive coloration outperformed most competitors. Widely regarded as one of the most effective military patterns ever designed; inspired many similar blotch patterns worldwide. Name means "spot camouflage" in German.',
    region: 'Europe',
  },
  {
    id: 'flecktarn-desert',
    name: 'Flecktarn Desert',
    country: 'Germany',
    era: '1990s–present',
    type: 'military',
    colors: ['#c4a060', '#8a7040', '#d4b870', '#6a5830', '#a09050'],
    body: 'A desert-palette version of Flecktarn using tan, brown, and khaki blotches instead of greens. Used by the Bundeswehr in arid environments including Afghanistan. Demonstrates how a proven pattern structure can be recolored for different operational environments rather than developing entirely new patterns.',
    region: 'Europe',
  },
  {
    id: 'pencott',
    name: 'PenCott GreenZone',
    country: 'Germany/UK',
    era: '2010–present',
    type: 'military',
    colors: ['#4a6030', '#8a7840', '#2a3a18', '#a09858', '#c4b070'],
    body: 'Developed by Guy Cramer (who contributed to MARPAT) with W.L. Gore, PenCott uses four variants for different environments (GreenZone, Badlands, Snowdrift, SandStorm). The pattern combines micro and macro elements; the "stems" between blotch clusters break up shape recognition at intermediate ranges. Adopted by several European special operations units.',
    region: 'Europe',
  },
  {
    id: 'dpm',
    name: 'DPM (Disruptive Pattern Material)',
    country: 'UK',
    era: '1966–2010',
    type: 'military',
    colors: ['#4a6030', '#8a7240', '#2a3a18', '#b8a070'],
    body: 'Britain\'s four-color brushstroke pattern, developed from WWII Denison smock designs. Used across all British services for over 40 years and licensed to dozens of Commonwealth and allied nations. Considered highly effective but replaced by MTP to reduce logistics complexity when operating with NATO allies on MultiCam-adjacent terrain.',
    region: 'Europe',
  },
  {
    id: 'mtp',
    name: 'MTP (Multi-Terrain Pattern)',
    country: 'UK',
    era: '2010–present',
    type: 'military',
    colors: ['#8a7850', '#5a6038', '#c0a870', '#3a4828', '#a09058'],
    body: 'Developed by Crye Precision in collaboration with the British MoD, MTP is a modified version of MultiCam tuned to British service requirements. Adopted after combat experience in Afghanistan showed DPM\'s limitations in arid mountainous terrain. Compatible with OCP-pattern kit for joint operations.',
    region: 'Europe',
  },
  {
    id: 'swiss-taz90',
    name: 'Swiss TAZ 90',
    country: 'Switzerland',
    era: '1990–present',
    type: 'military',
    colors: ['#6a7858', '#3a4830', '#a0a888', '#2a3020', '#c8cac0'],
    body: 'Switzerland\'s pixel-based "Tarnmuster 90" predates CADPAT and is one of the earliest digital camouflages, though it uses larger, more angular pixels. Optimized for Alpine terrain — the pale greens, grays, and blacks work in rocky mountain environments. Switzerland\'s neutrality means the pattern has seen little combat; it remains an effective and underappreciated design.',
    region: 'Europe',
  },
  {
    id: 'swedish-m90',
    name: 'Swedish M90',
    country: 'Sweden',
    era: '1990–present',
    type: 'military',
    colors: ['#3a4a20', '#6a6040', '#2a3818', '#c0b870', '#8a8050'],
    body: 'Sweden\'s four-color splinter pattern, a direct descendant of WWII German splinter designs refined for Scandinavian boreal forest. Hard-edged, angular shapes at multiple scales create strong visual disruption in birch and pine forest. Considered highly effective for its intended environment and has influenced Nordic allied patterns.',
    region: 'Europe',
  },
  {
    id: 'italian-vegetato',
    name: 'Italian Vegetato',
    country: 'Italy',
    era: '2000–present',
    type: 'military',
    colors: ['#5a6a30', '#8a7848', '#2a3a18', '#b0a870'],
    body: 'Italy\'s "vegetated" pattern uses a leaf-print design that draws clearly from Woodland BDU but with Italian-specific color tuning for Mediterranean scrubland. Considered one of the better-looking military patterns and has been noted for effectiveness in woodland/brush environments. Used by all Italian armed forces.',
    region: 'Europe',
  },
  {
    id: 'belgian-jigsaw',
    name: 'Belgian Jigsaw',
    country: 'Belgium',
    era: '1952–1990s',
    type: 'military',
    colors: ['#4a5a28', '#7a6838', '#2a3418', '#b0a060'],
    body: 'Belgium\'s distinctive woodland camouflage, notable for its interlocking puzzle-piece shapes — hence the informal name. Designed around European deciduous forest. Used by Belgian paratroopers and the predecessor pattern to later DPM-influenced designs. A collector\'s favorite for its unique aesthetic.',
    region: 'Europe',
  },
  {
    id: 'danish-m84',
    name: 'Danish M84',
    country: 'Denmark',
    era: '1984–present',
    type: 'military',
    colors: ['#6a5838', '#3a4820', '#8a7848', '#2a3018', '#b0a868'],
    body: 'Denmark\'s cold-climate pattern uses a four-color design optimized for Northern European terrain including Scandinavia and Greenland. The pattern features a distinctive brown-heavy base with green and black disruption. Used in Danish deployments to Afghanistan where it performed reasonably in mountain terrain despite not being designed for it.',
    region: 'Europe',
  },
  {
    id: 'russian-flora',
    name: 'Russian Flora (Leshy)',
    country: 'Russia',
    era: '1999–2010s',
    type: 'military',
    colors: ['#4a5e28', '#7a7040', '#2a3a18', '#c0b070'],
    body: 'Russia\'s "oak leaf" pattern, developed after Afghanistan experience showed Soviet-era OD green was inadequate. The vertical "amoeba" shapes resemble foliage in motion and break up the human silhouette effectively. Replaced in frontline service by the digital pixel patterns but still widely used in Russian internal forces and remains common in post-Soviet states.',
    region: 'Russia',
  },
  {
    id: 'russian-emr',
    name: 'Russian EMR (Pixel)',
    country: 'Russia',
    era: '2008–present',
    type: 'military',
    colors: ['#555c40', '#6a7050', '#3a4228', '#a0a878'],
    body: 'Russia\'s digital pixel pattern, adopted after observing the effectiveness of CADPAT/MARPAT. Two variants: Flora-colored (temperate) and Arid (desert tan). Issued alongside Flora during transition; now the primary Russian military pattern. Like most pixel patterns, effectiveness depends heavily on scale — larger pixels work at longer ranges, smaller ones at close distances.',
    region: 'Russia',
  },
  {
    id: 'cadpat',
    name: 'CADPAT (Temperate Woodland)',
    country: 'Canada',
    era: '1997–present',
    type: 'military',
    colors: ['#4a5e30', '#7a6a3e', '#2a3820', '#a09060'],
    body: 'The world\'s first issued pixelated digital camouflage, preceding MARPAT by several years. Developed after Canadian research concluded that small clusters of pixels are harder for the human eye to resolve into a recognizable shape at combat distances. Proved the digital concept that most modern patterns now follow.',
    region: 'USA',
  },
  {
    id: 'auscam',
    name: 'AUSCAM (DPCU)',
    country: 'Australia',
    era: '1990–present',
    type: 'military',
    colors: ['#8a7248', '#4a5a2a', '#c4a060', '#2a3818'],
    body: 'Australia\'s distinctive "jelly bean" pattern, also called DPCU (Disruptive Pattern Camouflage Uniform). Named for its rounded, irregular blobs of color. Optimized for Australian terrain — arid scrubland, red earth, dry grass. The earthy palette makes it visually distinctive among allied patterns.',
    region: 'Oceania',
  },
  {
    id: 'tiger-stripe',
    name: 'Tiger Stripe',
    country: 'Vietnam/Regional',
    era: '1960s–present',
    type: 'military',
    colors: ['#2a3a18', '#4a6028', '#7a6a40', '#1a2810'],
    body: 'Originally sewn by South Vietnamese tailors for LLDB (Special Forces) units in the early 1960s, tiger stripe became the coveted "operator" pattern of the Vietnam era — sought after by US SOF units who procured it locally. Its bold, directional stripes create a disruptive "slashing" visual effect. Still in production; adopted by numerous Southeast Asian militaries.',
    region: 'Oceania',
  },
  {
    id: 'rhodesian',
    name: 'Rhodesian Brushstroke',
    country: 'Zimbabwe (Rhodesia)',
    era: '1965–1980',
    type: 'military',
    colors: ['#b8a870', '#4a6030', '#8a7848', '#2a3818'],
    body: 'Developed for the Rhodesian Security Forces during the Bush War against terrain of mopane woodland and dry savanna. A simplified two-color vertical brushstroke over a sandy base. Despite being produced with almost no R&D budget, it performed exceptionally well and influenced the South African SADF patterns that followed.',
    region: 'Oceania',
  },
];

// ─── PLATFORMS DATA ───────────────────────────────────────────────────────────

interface Platform {
  id: string;
  name: string;
  origin: string;
  era: string;
  category: string;
  body: string;
}

const PLATFORMS: Platform[] = [
  {
    id: 'ar15',
    name: 'AR-15 / M16 / M4 Family',
    origin: 'USA',
    era: '1959–present',
    category: 'Rifle',
    body: 'Designed by Eugene Stoner for ArmaLite, the AR-15 is now the most-produced rifle platform in American history. The direct-impingement gas system and modular lower/upper split have spawned an entire ecosystem of parts, calibers, and configurations. The military M16 and M4 variants have served in every US conflict since Vietnam. Today\'s civilian AR-15 market encompasses hundreds of manufacturers and thousands of configurations.',
  },
  {
    id: 'ak47',
    name: 'AK-47 / AKM / AK-74 Family',
    origin: 'USSR / Russia',
    era: '1947–present',
    category: 'Rifle',
    body: 'Mikhail Kalashnikov\'s gas-operated rifle emerged from WWII combat experience and a Soviet requirement for a 7.62x39mm infantry weapon. The long-stroke piston system and loose tolerances give it legendary reliability in adverse conditions. An estimated 75–100 million AK-pattern rifles have been produced — the most manufactured firearm in history. The 5.45x39mm AK-74 variant replaced the AKM in Soviet service in 1974.',
  },
  {
    id: 'glock17',
    name: 'Glock 17 / Glock Family',
    origin: 'Austria',
    era: '1982–present',
    category: 'Pistol',
    body: 'Gaston Glock\'s polymer-frame, striker-fired pistol revolutionized the handgun industry when it was adopted by the Austrian Army in 1982. The safe-action trigger system, high-capacity magazines, and simplified field-strip procedure set the template for virtually every modern polymer pistol. Glock pistols are carried by over 65% of US law enforcement agencies and military units in dozens of countries.',
  },
  {
    id: '1911',
    name: 'M1911 / 1911 Family',
    origin: 'USA',
    era: '1911–present',
    category: 'Pistol',
    body: 'John Browning\'s .45 ACP semi-automatic pistol served as the US military\'s standard sidearm from 1911 to 1985 — 74 years of continuous service. The single-action locked-breech design became the template for modern semi-automatic pistols. Still in production by dozens of manufacturers, the 1911 commands one of the most devoted followings in firearms history and remains competitive in practical and bullseye shooting.',
  },
  {
    id: 'remington700',
    name: 'Remington Model 700',
    origin: 'USA',
    era: '1962–present',
    category: 'Bolt-Action Rifle',
    body: 'The most successful bolt-action rifle in American history, the Model 700\'s push-feed action, three-position safety, and aftermarket ecosystem made it the foundation for US military and law enforcement sniper programs (M24, M40). Its controlled round push-feed can also be had in the aftermarket. Chambered in over 40 calibers over its production run, from .17 Remington to .338 Lapua.',
  },
  {
    id: 'mosin-nagant',
    name: 'Mosin-Nagant M91/30',
    origin: 'Russia / USSR',
    era: '1891–1960s',
    category: 'Bolt-Action Rifle',
    body: 'Designed jointly by Sergei Mosin and Leon Nagant, the 7.62x54mmR Mosin-Nagant was the standard Soviet infantry rifle through both World Wars and the Winter War. Produced in enormous numbers — over 37 million made — it remains one of the most common surplus rifles in the world. The M91/30 PU sniper variant was used with devastating effect at Stalingrad and throughout the Eastern Front.',
  },
  {
    id: 'mp5',
    name: 'HK MP5',
    origin: 'Germany',
    era: '1966–present',
    category: 'Submachine Gun',
    body: 'Heckler & Koch\'s roller-delayed blowback submachine gun became the definitive hostage rescue and counter-terrorism weapon after its use by GSG-9 at Mogadishu in 1977. Available in over 30 variants, the MP5 is renowned for its accuracy at close range relative to other SMGs. Still in production and active service; widely replaced by SBRs in military use but remains preferred in many law enforcement roles.',
  },
  {
    id: 'barrett-m82',
    name: 'Barrett M82 / M107',
    origin: 'USA',
    era: '1982–present',
    category: 'Anti-Materiel Rifle',
    body: 'Ronnie Barrett\'s semi-automatic .50 BMG rifle entered US military service in Desert Storm, where it was used to defeat light armor, aircraft, and explosive ordnance at extreme ranges. The recoil-operated action and muzzle brake make the massive cartridge manageable. Maximum effective range against point targets exceeds 1,800 meters; the M107A1 variant adds a suppressor-ready brake and titanium components.',
  },
  {
    id: 'fn-scar',
    name: 'FN SCAR (Mk 16 / Mk 17)',
    origin: 'Belgium',
    era: '2004–present',
    category: 'Rifle',
    body: 'FN Herstal\'s Special Operations Forces Combat Assault Rifle won the SOCOM SCAR competition in 2004. Available in 5.56mm (Mk 16 / SCAR-L) and 7.62mm (Mk 17 / SCAR-H) variants, the folding stock and free-float rail system were ahead of their time. The SCAR-H in 7.62 NATO has become the preferred precision/designated marksman platform for many SOF units.',
  },
  {
    id: 'sig-p226',
    name: 'SIG Sauer P226 / P-Series',
    origin: 'Switzerland/Germany',
    era: '1980–present',
    category: 'Pistol',
    body: 'The P226 narrowly lost the 1984 US Army pistol trials to the Beretta 92 on cost — not performance. The US Navy SEALs, unwilling to accept the verdict, adopted the P226 anyway, where it served for decades. The DA/SA trigger system and all-metal construction give it a reputation for smoothness and durability. The P-series spawned the P229, P228, and the modern P320 modular platform.',
  },
];

// ─── BALLISTICS DATA ──────────────────────────────────────────────────────────

interface BallisticConcept {
  title: string;
  category: string;
  body: string;
}

const BALLISTIC_CONCEPTS: BallisticConcept[] = [
  {
    title: 'Trajectory & Bullet Drop',
    category: 'External Ballistics',
    body: 'A bullet begins dropping from the moment it leaves the muzzle due to gravity. For a rifle zeroed at 100 yards, the bullet\'s path crosses the line of sight twice — once on the way up (typically ~25 yards) and once at the zero distance. Beyond the zero, the bullet drops below the line of sight at an accelerating rate. At long range, even a small error in range estimation translates to significant vertical error.',
  },
  {
    title: 'Wind Drift',
    category: 'External Ballistics',
    body: 'Wind exerts a lateral force on a bullet throughout its flight. A 10 mph full-value (90°) crosswind can push a .308 Win bullet 10 inches at 500 yards. The effect is not linear — it compounds as range increases. A high BC reduces wind drift significantly; this is why wind reading is the primary skill separating good long-range shooters from excellent ones.',
  },
  {
    title: 'Supersonic vs. Transonic vs. Subsonic',
    category: 'External Ballistics',
    body: 'Bullets fired at supersonic speeds (above ~1,125 fps) are stable and predictable. In the transonic zone (~1,125–900 fps), the shockwave behavior changes and bullets can become unstable or exhibit erratic yaw. Most precision rifle shots are planned to reach the target while still supersonic, or well into the subsonic regime (intentionally subsonic loads). The transonic transition is the primary range limitation for precision shooting.',
  },
  {
    title: 'Spin Drift (Gyroscopic Drift)',
    category: 'External Ballistics',
    body: 'A spinning bullet experiences a gyroscopic precession that causes it to drift in the direction of the rifling twist — right-hand twist drifts right, left-hand twist drifts left. At 1,000 yards with a typical 1:10 twist rifle, spin drift can exceed 10 inches. Precision long-range shooters account for this in their DOPE and firing solutions.',
  },
  {
    title: 'Coriolis Effect',
    category: 'External Ballistics',
    body: 'The Earth\'s rotation creates a small but measurable force on long-range projectiles. In the Northern Hemisphere, bullets drift right; in the Southern Hemisphere, left. The effect is significant only beyond ~800–1,000 yards, and its magnitude depends on the shooter\'s latitude and the direction of fire. Extreme long-range records (beyond 2,000 yards) require Coriolis compensation.',
  },
  {
    title: 'Expansion & Terminal Performance',
    category: 'Terminal Ballistics',
    body: 'When a hollow-point bullet enters tissue, hydraulic pressure forces the cavity to peel back, creating a mushroom shape that increases diameter and creates a larger wound channel. Expansion depends on velocity and construction; most JHP rounds are designed to expand reliably above 800–900 fps. Below this threshold, expansion is unreliable, which limits the effective range of defensive handgun loads.',
  },
  {
    title: 'Penetration Depth',
    category: 'Terminal Ballistics',
    body: 'The FBI established a 12–18 inch penetration standard in ordnance gelatin (calibrated at 10% concentration) for law enforcement defensive ammunition. This range is intended to ensure consistent vital organ reach while limiting over-penetration hazard. Bullets that expand too quickly fail to penetrate adequately; those that don\'t expand penetrate deeply but transfer less energy to the target.',
  },
  {
    title: 'Temporary Cavity',
    category: 'Terminal Ballistics',
    body: 'High-velocity rifle bullets create a large temporary cavity — a stretching and tearing of tissue caused by the pressure wave as the bullet decelerates. This cavity is far larger than the permanent wound channel and is responsible for significant tissue damage beyond the direct bullet path. Pistol bullets, moving too slowly, create only modest temporary cavities; their wounding effect comes primarily from the permanent channel.',
  },
  {
    title: 'Muzzle Velocity & Energy',
    category: 'Internal Ballistics',
    body: 'Muzzle velocity is determined by powder burn rate, charge weight, bullet weight, and barrel length. Kinetic energy = 0.5 × mass × velocity². Because velocity is squared, small increases in velocity yield proportionally larger energy gains. Barrel length matters: adding 2 inches to a 16" rifle barrel typically adds 25–50 fps; the gains diminish as the powder is already burned out. Very short barrels waste powder as unburned gas exits the muzzle.',
  },
  {
    title: 'Headspace',
    category: 'Internal Ballistics',
    body: 'Headspace is the distance from the bolt face to the datum point in the chamber where the cartridge case seats. Correct headspace allows the case to seal the chamber and control firing pressures. Excessive headspace allows the case to stretch, leading to head separation — a dangerous failure. Insufficient headspace prevents the action from closing. Headspace is checked with GO/NO-GO gauges during barrel fitting or inspection.',
  },
  {
    title: 'Rifling & Twist Rate',
    category: 'Internal Ballistics',
    body: 'Rifling imparts spin to the bullet for gyroscopic stability. Twist rate is expressed as 1:X, meaning one full rotation per X inches of barrel. Faster twist (lower X number) stabilizes longer, heavier bullets; slower twist is suited to shorter, lighter bullets. Mismatch causes instability — underspun bullets tumble; overspun light bullets can strip or fragment. The Greenhill Formula approximates optimal twist for a given bullet length.',
  },
];

// ─── MAINTENANCE DATA ──────────────────────────────────────────────────────────

interface MaintenanceGuide {
  title: string;
  steps: string[];
  tips: string[];
}

const MAINTENANCE_GUIDES: MaintenanceGuide[] = [
  {
    title: 'AR-15 Field Strip & Cleaning',
    steps: [
      'Verify the weapon is unloaded: remove magazine, lock bolt back, visually inspect chamber.',
      'Push out the two takedown pins (rear then front) and separate upper from lower receiver.',
      'Remove the charging handle and bolt carrier group (BCG) from the upper receiver.',
      'Disassemble the BCG: push out the firing pin retaining pin, remove firing pin, rotate and remove cam pin, extract the bolt.',
      'Clean the bolt with a bronze brush and solvent; scrape the carbon ring at the bolt tail.',
      'Clean the inside of the carrier with a chamber brush on a drill or by hand.',
      'Run patches through the bore until they come out clean; finish with a lightly oiled patch.',
      'Clean the chamber with a dedicated chamber brush.',
      'Wipe down all parts, apply a thin coat of CLP or oil to bearing surfaces, and reassemble in reverse order.',
    ],
    tips: [
      'The gas key on top of the carrier must be properly staked — if it wobbles, it needs re-staking or replacement.',
      'A Bolt Carrier Group should be inspected for cracks at the bolt tail (common failure point) periodically.',
      'Don\'t over-lubricate — the AR runs well wet, but excess oil in the lower can attract carbon and grit.',
    ],
  },
  {
    title: 'Handgun Cleaning (Striker-Fired)',
    steps: [
      'Verify unloaded: remove magazine, rack slide, visually and physically inspect chamber.',
      'Perform field strip per manufacturer procedure (most Glocks: pull slide back slightly, drop takedown lever, slide forward off frame).',
      'Remove recoil spring assembly and barrel.',
      'Run a bore brush through the barrel several times, follow with solvent-soaked patches, then dry patches until clean.',
      'Clean the feed ramp and chamber with a nylon or bronze brush.',
      'Wipe down the slide rails and frame rails; inspect for wear or unusual marks.',
      'Apply a small drop of oil to each slide rail, the barrel hood, and the barrel link/locking block area.',
      'Reassemble and function-check: dry fire, confirm reset, rack slide.',
    ],
    tips: [
      'Most modern polymer pistols need minimal lubrication — three to four drops total is usually sufficient.',
      'Inspect the extractor for carbon buildup; a dirty extractor is a leading cause of FTE malfunctions.',
      'Replace recoil springs per manufacturer schedule — typically 3,000–5,000 rounds for most service pistols.',
    ],
  },
  {
    title: 'Bolt-Action Rifle Cleaning',
    steps: [
      'Confirm unloaded; open the bolt and visually inspect the chamber.',
      'Remove the bolt by pressing the bolt release (if equipped) and withdrawing fully.',
      'Using a one-piece cleaning rod from the muzzle end (or breach if possible), run a bronze brush through the bore 10 times.',
      'Follow with solvent-soaked patches, allowing 5 minutes of soak time for fouled barrels.',
      'Run dry patches until no fouling is visible; a white patch should be nearly clean.',
      'Apply a thin layer of rust-preventative oil to the bore for storage.',
      'Clean the bolt face and extractor groove with a nylon pick or bronze brush.',
      'Wipe the locking lugs and apply a very thin film of grease (not oil) to the lug contact surfaces.',
      'Inspect and wipe the trigger group area; avoid oiling the trigger — it can cause sear creep.',
    ],
    tips: [
      'Copper fouling (a blue-green residue on patches) requires a dedicated copper solvent — standard bore solvent won\'t remove it.',
      'Always clean from the breech end if possible to avoid bending or wear at the crown, which is critical for accuracy.',
      'Check the scope mount screws for correct torque after each cleaning session.',
    ],
  },
  {
    title: 'Long-Term Storage Preparation',
    steps: [
      'Clean all surfaces thoroughly, removing all carbon, copper, and powder fouling.',
      'Dry the firearm completely before applying any storage product.',
      'Apply a quality rust-preventative oil or grease to all metal surfaces, including the bore.',
      'For bore storage: leave a lightly oiled patch in the chamber end; remove and re-clean before firing.',
      'Remove batteries from any optics if storing for more than a few months.',
      'Store in a hard-sided case with desiccant packs or in a gun safe with a dehumidifier rod.',
      'Avoid storing in soft cases long-term; they can trap moisture against the metal.',
      'Check stored firearms every 3–6 months and reapply rust prevention if needed.',
    ],
    tips: [
      'VCI (Volatile Corrosion Inhibitor) bags and gun socks provide excellent passive protection in humid environments.',
      'Cosmoline, the traditional military storage grease, is extremely effective but must be fully removed before firing.',
      'Wood stocks can crack in very dry storage conditions; a light wipe with linseed oil keeps them conditioned.',
    ],
  },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export function FieldGuide() {
  const [section, setSection] = useState<GuideSection>('home');
  const [glossarySearch, setGlossarySearch] = useState('');
  const [camoSearch, setCamoSearch] = useState('');
  const [camoRegion, setCamoRegion] = useState<string>('All');

  // ── Glossary filtering & grouping ──────────────────────────────────────────

  const filteredGlossary = useMemo(() => {
    const q = glossarySearch.toLowerCase();
    if (!q) return GLOSSARY_TERMS;
    return GLOSSARY_TERMS.filter(
      (t) =>
        t.acronym.toLowerCase().includes(q) ||
        t.expansion.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q)
    );
  }, [glossarySearch]);

  const glossaryGroups = useMemo(() => {
    const groups: Record<string, GlossaryTerm[]> = {};
    for (const term of filteredGlossary) {
      const letter = term.acronym[0].toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(term);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredGlossary]);

  // ── Camo filtering ──────────────────────────────────────────────────────────

  const filteredCamos = useMemo(() => {
    const q = camoSearch.toLowerCase();
    return CAMO_PATTERNS.filter((c) => {
      const matchesRegion =
        camoRegion === 'All' ||
        (camoRegion === 'Hunting' && c.type === 'hunting') ||
        c.region === camoRegion;
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        c.era.toLowerCase().includes(q);
      return matchesRegion && matchesSearch;
    });
  }, [camoSearch, camoRegion]);

  // ── Shared styles ───────────────────────────────────────────────────────────

  const containerStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    backgroundColor: theme.bg,
    color: theme.textPrimary,
    minHeight: '100vh',
    padding: '0',
  };

  const headerStyle: React.CSSProperties = {
    position: 'sticky',
    top: 0,
    zIndex: 10,
    backgroundColor: theme.bg,
    borderBottom: '0.5px solid ' + theme.border,
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  const backBtnStyle: React.CSSProperties = {
    background: 'none',
    border: '0.5px solid ' + theme.border,
    borderRadius: '6px',
    color: theme.textSecondary,
    fontFamily: 'monospace',
    fontSize: '12px',
    padding: '5px 10px',
    cursor: 'pointer',
    letterSpacing: '0.5px',
  };

  const searchInputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: theme.surface,
    border: '0.5px solid ' + theme.border,
    borderRadius: '8px',
    color: theme.textPrimary,
    fontFamily: 'monospace',
    fontSize: '13px',
    padding: '10px 14px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  // ── HOME ────────────────────────────────────────────────────────────────────

  if (section === 'home') {
    const IcnCartridges = () => (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 21 L10 10 Q10 3 12 3 Q14 3 14 10 L14 21 Z"/>
        <line x1="10" y1="11.5" x2="14" y2="11.5"/>
        <line x1="10" y1="17" x2="14" y2="17"/>
      </svg>
    );
    const IcnPlatforms = () => (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="13" y1="10" x2="22" y2="10"/>
        <line x1="20" y1="10" x2="20" y2="8.5"/>
        <rect x="7" y="9" width="6" height="4.5" rx="0.5"/>
        <path d="M7 10 L3 9.5 L2 12 L3 13 L7 13.5"/>
        <path d="M10 13.5 L9.5 17.5 L12 17.5 L12 13.5"/>
      </svg>
    );
    const IcnBallistics = () => (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth="1.5" strokeLinecap="round">
        <path d="M2 20 Q5 5 12 4 Q19 5 22 20"/>
        <line x1="12" y1="4" x2="12" y2="12" strokeDasharray="2 2"/>
        <line x1="1" y1="21.5" x2="23" y2="21.5"/>
        <circle cx="22" cy="20" r="1.5" fill={theme.accent}/>
      </svg>
    );
    const IcnGlossary = () => (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="3" width="16" height="18" rx="2"/>
        <line x1="8" y1="8" x2="16" y2="8"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
        <line x1="8" y1="16" x2="13" y2="16"/>
      </svg>
    );
    const IcnOptics = () => (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth="1.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="8"/>
        <line x1="12" y1="4" x2="12" y2="8.5"/>
        <line x1="12" y1="15.5" x2="12" y2="20"/>
        <line x1="4" y1="12" x2="8.5" y2="12"/>
        <line x1="15.5" y1="12" x2="20" y2="12"/>
        <circle cx="12" cy="12" r="1.5" fill={theme.accent} stroke="none"/>
      </svg>
    );

    const homeCards = [
      { icon: <IcnCartridges/>, title: 'Cartridges', subtitle: 'Specs, history & ballistics', action: () => setSection('cartridges') },
      { icon: <IcnPlatforms/>,  title: 'Platforms',  subtitle: 'Famous firearm families',     action: () => setSection('platforms') },
      { icon: <IcnBallistics/>, title: 'Ballistics', subtitle: 'External & terminal concepts', action: () => setSection('ballistics') },
      { icon: <IcnGlossary/>,   title: 'Glossary',   subtitle: 'Acronyms & terms decoded',     action: () => setSection('glossary') },
      { icon: <IcnOptics/>,     title: 'Optics',     subtitle: 'Scopes, red dots & beyond',    action: () => setSection('optics') },
    ];

    return (
      <div style={containerStyle}>
        <div style={{ padding: '20px 16px 8px' }}>
          <div style={{ fontSize: '11px', color: theme.textMuted, letterSpacing: '2px', marginBottom: '4px' }}>
            LINDCOTT ARMORY
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: theme.textPrimary, letterSpacing: '1px' }}>
            Field Guide
          </div>
          <div style={{ fontSize: '12px', color: theme.textSecondary, marginTop: '4px' }}>
            Firearms reference encyclopedia
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            padding: '16px',
          }}
        >
          {homeCards.map((card) => (
            <button
              key={card.title}
              onClick={card.action}
              style={{
                backgroundColor: theme.surface,
                border: '0.5px solid ' + theme.border,
                borderRadius: '10px',
                padding: '16px 12px',
                textAlign: 'center',
                cursor: 'pointer',
                fontFamily: 'monospace',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <div style={{ lineHeight: 0 }}>{card.icon}</div>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: theme.textPrimary,
                  letterSpacing: '0.5px',
                }}
              >
                {card.title}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  color: theme.textSecondary,
                  lineHeight: 1.4,
                  letterSpacing: '0.3px',
                }}
              >
                {card.subtitle}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── CARTRIDGES ──────────────────────────────────────────────────────────────

  if (section === 'cartridges') {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <button style={backBtnStyle} onClick={() => setSection('home')}>
            ← Back
          </button>
          <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '1px' }}>
            Cartridges
          </span>
        </div>
        <CaliberDatabase />
      </div>
    );
  }

  // ── GLOSSARY ────────────────────────────────────────────────────────────────

  if (section === 'glossary') {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <button style={backBtnStyle} onClick={() => setSection('home')}>
            ← Back
          </button>
          <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '1px' }}>
            Glossary
          </span>
        </div>

        <div style={{ padding: '12px 16px' }}>
          <input
            type="search"
            placeholder="Search terms..."
            value={glossarySearch}
            onChange={(e) => setGlossarySearch(e.target.value)}
            style={searchInputStyle}
          />
        </div>

        <div style={{ paddingBottom: '32px' }}>
          {glossaryGroups.length === 0 && (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: theme.textMuted, fontSize: '13px' }}>
              No results for "{glossarySearch}"
            </div>
          )}
          {glossaryGroups.map(([letter, terms]) => (
            <div key={letter}>
              <div
                style={{
                  position: 'sticky',
                  top: '53px',
                  backgroundColor: theme.bg,
                  padding: '6px 16px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: theme.accent,
                  letterSpacing: '2px',
                  borderBottom: '0.5px solid ' + theme.border,
                  zIndex: 5,
                }}
              >
                {letter}
              </div>
              <div style={{ padding: '6px 16px' }}>
                {terms.map((term) => (
                  <div
                    key={term.acronym + term.definition.slice(0, 20)}
                    style={{
                      backgroundColor: theme.surface,
                      border: '0.5px solid ' + theme.border,
                      borderRadius: '8px',
                      padding: '10px 12px',
                      marginBottom: '8px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: theme.accent,
                        letterSpacing: '0.8px',
                        marginBottom: '2px',
                      }}
                    >
                      {term.acronym}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: theme.textMuted,
                        letterSpacing: '0.3px',
                        marginBottom: '5px',
                      }}
                    >
                      {term.expansion}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: theme.textSecondary,
                        lineHeight: 1.55,
                        letterSpacing: '0.2px',
                      }}
                    >
                      {term.definition}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── CAMOS ───────────────────────────────────────────────────────────────────

  if (section === 'camos') {
    const regionFilters = ['All', 'USA', 'Europe', 'Russia', 'Oceania', 'Hunting'];

    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <button style={backBtnStyle} onClick={() => setSection('home')}>
            ← Back
          </button>
          <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '1px' }}>
            Camos of the World
          </span>
        </div>

        <div style={{ padding: '12px 16px 8px' }}>
          <input
            type="search"
            placeholder="Search patterns..."
            value={camoSearch}
            onChange={(e) => setCamoSearch(e.target.value)}
            style={searchInputStyle}
          />
        </div>

        <div
          style={{
            display: 'flex',
            gap: '6px',
            padding: '6px 16px 12px',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {regionFilters.map((r) => (
            <button
              key={r}
              onClick={() => setCamoRegion(r)}
              style={{
                flexShrink: 0,
                padding: '5px 12px',
                borderRadius: '20px',
                border: '0.5px solid ' + (camoRegion === r ? theme.accent : theme.border),
                backgroundColor: camoRegion === r ? 'rgba(255,212,59,0.12)' : theme.surface,
                color: camoRegion === r ? theme.accent : theme.textSecondary,
                fontFamily: 'monospace',
                fontSize: '11px',
                fontWeight: camoRegion === r ? 700 : 400,
                letterSpacing: '0.5px',
                cursor: 'pointer',
              }}
            >
              {r}
            </button>
          ))}
        </div>

        <div style={{ padding: '0 16px 32px' }}>
          {filteredCamos.length === 0 && (
            <div style={{ padding: '32px 0', textAlign: 'center', color: theme.textMuted, fontSize: '13px' }}>
              No patterns match your search.
            </div>
          )}
          {filteredCamos.map((camo) => (
            <div
              key={camo.id}
              style={{
                backgroundColor: theme.surface,
                border: '0.5px solid ' + theme.border,
                borderRadius: '10px',
                marginBottom: '12px',
                overflow: 'hidden',
              }}
            >
              {/* Color swatch row */}
              <div style={{ display: 'flex', height: '24px' }}>
                {camo.colors.map((hex, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      backgroundColor: hex,
                    }}
                  />
                ))}
              </div>

              {/* Card body */}
              <div style={{ padding: '10px 12px' }}>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: theme.textPrimary,
                    letterSpacing: '0.5px',
                    marginBottom: '2px',
                  }}
                >
                  {camo.name}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: theme.accent,
                    letterSpacing: '0.5px',
                    marginBottom: '6px',
                  }}
                >
                  {camo.country} · {camo.era} ·{' '}
                  <span style={{ color: theme.textMuted }}>{camo.type}</span>
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: theme.textSecondary,
                    lineHeight: 1.55,
                    letterSpacing: '0.2px',
                  }}
                >
                  {camo.body}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── PLATFORMS ───────────────────────────────────────────────────────────────

  if (section === 'platforms') {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <button style={backBtnStyle} onClick={() => setSection('home')}>
            ← Back
          </button>
          <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '1px' }}>
            Platforms
          </span>
        </div>

        <div style={{ padding: '12px 16px 32px' }}>
          {PLATFORMS.map((p) => (
            <div
              key={p.id}
              style={{
                backgroundColor: theme.surface,
                border: '0.5px solid ' + theme.border,
                borderRadius: '10px',
                padding: '12px',
                marginBottom: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: theme.textPrimary,
                    letterSpacing: '0.5px',
                    flex: 1,
                    paddingRight: '8px',
                  }}
                >
                  {p.name}
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    color: theme.accent,
                    letterSpacing: '0.8px',
                    fontWeight: 600,
                    flexShrink: 0,
                    paddingTop: '2px',
                  }}
                >
                  {p.category}
                </div>
              </div>
              <div style={{ fontSize: '11px', color: theme.textMuted, letterSpacing: '0.3px', marginBottom: '8px' }}>
                {p.origin} · {p.era}
              </div>
              <div style={{ fontSize: '12px', color: theme.textSecondary, lineHeight: 1.6, letterSpacing: '0.2px' }}>
                {p.body}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── BALLISTICS ──────────────────────────────────────────────────────────────

  if (section === 'ballistics') {
    const ballisticsCategories = Array.from(new Set(BALLISTIC_CONCEPTS.map((b) => b.category)));

    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <button style={backBtnStyle} onClick={() => setSection('home')}>
            ← Back
          </button>
          <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '1px' }}>
            Ballistics
          </span>
        </div>

        <div style={{ padding: '12px 16px 32px' }}>
          {ballisticsCategories.map((cat) => (
            <div key={cat} style={{ marginBottom: '20px' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: theme.accent,
                  letterSpacing: '2px',
                  marginBottom: '10px',
                  paddingBottom: '6px',
                  borderBottom: '0.5px solid ' + theme.border,
                }}
              >
                {cat.toUpperCase()}
              </div>
              {BALLISTIC_CONCEPTS.filter((b) => b.category === cat).map((concept) => (
                <div
                  key={concept.title}
                  style={{
                    backgroundColor: theme.surface,
                    border: '0.5px solid ' + theme.border,
                    borderRadius: '10px',
                    padding: '12px',
                    marginBottom: '10px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: theme.textPrimary,
                      letterSpacing: '0.5px',
                      marginBottom: '8px',
                    }}
                  >
                    {concept.title}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: theme.textSecondary,
                      lineHeight: 1.6,
                      letterSpacing: '0.2px',
                    }}
                  >
                    {concept.body}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── MAINTENANCE ─────────────────────────────────────────────────────────────

  if (section === 'maintenance') {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <button style={backBtnStyle} onClick={() => setSection('home')}>
            ← Back
          </button>
          <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '1px' }}>
            Maintenance
          </span>
        </div>

        <div style={{ padding: '12px 16px 32px' }}>
          {MAINTENANCE_GUIDES.map((guide) => (
            <div
              key={guide.title}
              style={{
                backgroundColor: theme.surface,
                border: '0.5px solid ' + theme.border,
                borderRadius: '10px',
                padding: '14px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: theme.textPrimary,
                  letterSpacing: '0.5px',
                  marginBottom: '12px',
                }}
              >
                {guide.title}
              </div>

              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: theme.accent,
                  letterSpacing: '2px',
                  marginBottom: '8px',
                }}
              >
                STEPS
              </div>

              {guide.steps.map((step, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: '10px',
                    marginBottom: '7px',
                    alignItems: 'flex-start',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: theme.accent,
                      minWidth: '18px',
                      letterSpacing: '0.3px',
                      paddingTop: '1px',
                    }}
                  >
                    {i + 1}.
                  </span>
                  <span style={{ fontSize: '12px', color: theme.textSecondary, lineHeight: 1.55, letterSpacing: '0.2px' }}>
                    {step}
                  </span>
                </div>
              ))}

              <div
                style={{
                  marginTop: '12px',
                  paddingTop: '10px',
                  borderTop: '0.5px solid ' + theme.border,
                }}
              >
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: theme.orange,
                    letterSpacing: '2px',
                    marginBottom: '8px',
                  }}
                >
                  TIPS
                </div>
                {guide.tips.map((tip, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: '8px',
                      marginBottom: '6px',
                      alignItems: 'flex-start',
                    }}
                  >
                    <span style={{ color: theme.orange, fontSize: '11px', paddingTop: '1px' }}>›</span>
                    <span style={{ fontSize: '12px', color: theme.textSecondary, lineHeight: 1.55, letterSpacing: '0.2px' }}>
                      {tip}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section === 'optics') {
    return <FieldGuideOptics onBack={() => setSection('home')} />;
  }

  if (section === 'competition') {
    return <FieldGuideCompetition onBack={() => setSection('home')} />;
  }

  if (section === 'marksmanship') {
    return <FieldGuideMarksmanship onBack={() => setSection('home')} />;
  }

  return null;
}
