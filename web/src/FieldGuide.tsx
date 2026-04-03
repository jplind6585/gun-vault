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
  year: number;   // introduction year — used for chronological timeline sort
  era: string;
  category: string;
  categoryColor: string;
  tagline: string;
  body: string;
}

const PLATFORMS: Platform[] = [
  {
    id: 'flintlock-musket',
    name: 'Flintlock Musket',
    origin: 'Europe',
    year: 1630,
    era: '1630–1840s',
    category: 'Musket',
    categoryColor: '#868e96',
    tagline: "Dominant infantry arm for 200 years; won America's independence.",
    body: "The flintlock ignition system — a flint striking a steel frizzen to produce a spark — replaced the matchlock and dominated infantry warfare from the 1630s through the Napoleonic Wars. Smoothbore, with effective range under 100 yards, armies compensated with massed volley fire. The Brown Bess (British) and Charleville (French) variants armed opposing sides in nearly every major 18th-century conflict including the American Revolution.",
  },
  {
    id: 'percussion-cap',
    name: 'Percussion Cap Rifle',
    origin: 'Europe / USA',
    year: 1820,
    era: '1820–1870s',
    category: 'Musket',
    categoryColor: '#868e96',
    tagline: 'Chemical ignition replaced flint; first major reliability leap in infantry arms.',
    body: "The percussion cap — a small copper cup containing fulminate of mercury — replaced the flintlock's unreliable flint-and-pan system. Misfires dropped dramatically. Combined with the Minié ball (1848), percussion rifles became accurate to 400+ yards, fundamentally changing Civil War tactics: smoothbore-era tactics met rifled-bore lethality, producing catastrophic frontal assault casualties at Fredericksburg, Cold Harbor, and elsewhere.",
  },
  {
    id: 'springfield-1861',
    name: 'Springfield Model 1861',
    origin: 'USA',
    year: 1861,
    era: '1861–1865',
    category: 'Musket',
    categoryColor: '#868e96',
    tagline: 'The primary Union infantry rifle of the Civil War — over 1 million produced.',
    body: "The Springfield M1861 was the most widely used rifle musket of the American Civil War. Chambered in .58 caliber with a Minié ball, it was accurate to 500 yards in trained hands. Its production in government and private arsenals exceeded 1 million units. The rifle's range and accuracy made Napoleonic massed infantry assaults suicidal — a lesson that took commanders years of bloody battles to learn.",
  },
  {
    id: 'colt-saa',
    name: 'Colt Single Action Army',
    origin: 'USA',
    year: 1873,
    era: '1873–present',
    category: 'Revolver',
    categoryColor: '#94d82d',
    tagline: 'The gun that won the West — standard US Army sidearm for 20 years.',
    body: 'Chambered in .45 Colt, the SAA was adopted by the US Army in 1873 and became the defining firearm of the American West. Its robust single-action mechanism and flat trajectory made it effective to 75 yards. Used by both sides in the Lincoln County War, carried by lawmen and outlaws alike. The Peacemaker, as it was called, remains in production today — one of the longest-running firearm designs in history.',
  },
  {
    id: 'winchester-1873',
    name: 'Winchester Model 1873',
    origin: 'USA',
    year: 1873,
    era: '1873–present',
    category: 'Lever Action',
    categoryColor: '#adb5bd',
    tagline: '"The gun that won the West" — same caliber as the Colt SAA for convenience.',
    body: 'Produced in pistol calibers (.44-40, .38-40, .32-20) to allow cowboys to carry a single cartridge type for both rifle and revolver, the Model 1873 was the most popular lever-action repeater of its era. Over 720,000 produced before 1919. The interchangeability with Colt revolvers was a deliberate commercial and practical decision. Still produced by Winchester and Uberti today as a tribute to its cultural significance.',
  },
  {
    id: 'maxim-gun',
    name: 'Maxim Gun / Vickers',
    origin: 'UK',
    year: 1884,
    era: '1884–1960s',
    category: 'Machine Gun',
    categoryColor: '#f783ac',
    tagline: 'First fully automatic firearm — redefined warfare and colonialism.',
    body: 'Hiram Maxim\'s recoil-operated machine gun fired 500 rounds per minute and changed the nature of warfare irreversibly. Water-cooled and belt-fed, it could hold off hundreds of infantry with a crew of two. At the Battle of Omdurman (1898), a handful of Maxim guns killed 10,000 Sudanese in under 5 hours. The Vickers variant served both World Wars and remained in British service until 1968. "Whatever happens, we have got / The Maxim gun, and they have not." — Hilaire Belloc',
  },
  {
    id: 'lee-enfield',
    name: 'Lee-Enfield SMLE',
    origin: 'UK',
    year: 1895,
    era: '1895–1957 (primary)',
    category: 'Bolt Rifle',
    categoryColor: '#74c0fc',
    tagline: 'Fastest bolt action ever issued — trained British soldiers fired 15 rounds per minute.',
    body: 'The Short Magazine Lee-Enfield combined a 10-round magazine (double that of the Mauser) with a smooth cock-on-close bolt that allowed the legendary "mad minute" — 15 aimed rounds per minute demonstrated by trained British regulars. Over 17 million produced across its service life. The SMLE\'s rear-locking bolt is mechanically weaker than Mauser\'s front-locking design, but the speed advantage in combat was decisive. Still found in service in parts of South Asia today.',
  },
  {
    id: 'mauser-98',
    name: 'Mauser Gewehr 98 / K98k',
    origin: 'Germany',
    year: 1898,
    era: '1898–1945 (primary)',
    category: 'Bolt Rifle',
    categoryColor: '#74c0fc',
    tagline: 'The standard against which all bolt actions are measured — still copied today.',
    body: "Paul Mauser's 1898 action set the template for virtually every sporting and military bolt action that followed. The dual-opposed-locking lug system, controlled-round feeding, and Mauser claw extractor are still considered the gold standard. The K98k (kurz, shortened) variant served as Germany's standard WWII rifle. Captured examples were prized by Allied soldiers. The action is directly licensed or copied in the Winchester Model 70, Remington 700, and dozens of other designs.",
  },
  {
    id: 'mosin-nagant',
    name: 'Mosin-Nagant M91/30',
    origin: 'Russia / USSR',
    year: 1891,
    era: '1891–1960s',
    category: 'Bolt Rifle',
    categoryColor: '#74c0fc',
    tagline: '37 million produced — the most manufactured military rifle in history.',
    body: 'Designed jointly by Sergei Mosin and Leon Nagant, the 7.62x54mmR Mosin-Nagant was the standard Soviet infantry rifle through both World Wars and the Winter War. Over 37 million produced — one of the most manufactured rifles in history. The M91/30 PU sniper variant was used with devastating effect at Stalingrad and throughout the Eastern Front.',
  },
  {
    id: 'lewis-gun',
    name: 'Lewis Gun',
    origin: 'USA/UK',
    year: 1914,
    era: '1914–1950s',
    category: 'Machine Gun',
    categoryColor: '#f783ac',
    tagline: "WWI's squad automatic weapon — air-cooled and portable where the Maxim was not.",
    body: "The Lewis Gun's pan magazine and air-cooled barrel made it the first truly portable automatic weapon at squad level. A single soldier could carry and operate it. Used extensively by British and Commonwealth forces in WWI, mounted on aircraft as one of the first air-to-air weapons, and carried into WWII and beyond. Its clock-spring pan magazine was an engineering compromise — slow to reload but it made the gun man-portable without a tripod crew.",
  },
  {
    id: 'thompson',
    name: 'Thompson Submachine Gun',
    origin: 'USA',
    year: 1919,
    era: '1919–1971',
    category: 'Submachine Gun',
    categoryColor: '#ffa94d',
    tagline: 'The "Tommy Gun" — gangsters and GIs carried the same weapon.',
    body: 'John T. Thompson designed the "trench broom" to end WWI trench warfare — it arrived too late. Instead it became the weapon of choice for Prohibition-era gangsters, then US Marines in Nicaragua, then GIs storming Normandy. The .45 ACP cartridge hits hard at close range; the drum magazine is iconic. At 10+ lbs loaded, it was heavy, but the 1928 and M1 variants simplified it for mass wartime production. Over 1.7 million made during WWII.',
  },
  {
    id: 'bar',
    name: 'Browning Automatic Rifle (BAR)',
    origin: 'USA',
    year: 1918,
    era: '1918–1970s',
    category: 'Machine Gun',
    categoryColor: '#f783ac',
    tagline: "Every WWII US squad's base of fire — John Browning's portable automatic.",
    body: 'The BAR M1918 gave US infantry squads automatic fire capability in a rifle-weight package. At 15.5 lbs, it was lighter than a machine gun but heavier than a rifle — a deliberate tradeoff. The 20-round .30-06 magazine limited sustained fire, but in the squad assault it provided the critical suppressive base. The BAR gunner was typically the first casualty enemy fire sought out. Clyde Barrow reportedly stole BARs from National Guard armories and preferred them over everything else he used.',
  },
  {
    id: 'm2-browning',
    name: 'M2 Browning .50 BMG',
    origin: 'USA',
    year: 1933,
    era: '1933–present',
    category: 'Machine Gun',
    categoryColor: '#f783ac',
    tagline: 'Designed in 1918, still the standard heavy machine gun of NATO — 90+ years in service.',
    body: 'John Browning designed the M2 in response to General Pershing\'s request for a heavy machine gun after WWI. The .50 BMG (12.7×99mm) cartridge was developed alongside it. Originally designed to counter aircraft and light armor, the M2 has been mounted on aircraft, ships, tanks, helicopters, and ground vehicles. Its effective range against point targets exceeds 1,800 meters. The M2 has seen continuous production and service since 1933 — no replacement is in sight. Called "Ma Deuce" by generations of American soldiers.',
  },
  {
    id: 'm1-garand',
    name: 'M1 Garand',
    origin: 'USA',
    year: 1936,
    era: '1936–1957 (primary)',
    category: 'Semi-Auto Rifle',
    categoryColor: '#ff8787',
    tagline: 'First semi-automatic rifle adopted as a standard infantry weapon — General Patton called it the greatest battle implement ever devised.',
    body: 'John Garand\'s en-bloc clip-fed .30-06 semi-automatic rifle gave US infantry a firepower advantage over bolt-action-equipped enemies throughout WWII. Eight rounds, semi-automatic, clip ejects automatically when empty with a distinctive "ping." The ping became legend — supposedly alerting enemies — but in actual combat the noise of battle rendered it irrelevant. Over 5.4 million produced. The M1 also sparked the caliber debate: if a semi-auto rifle required so much ammunition, was .30-06 the right cartridge, or was something smaller and lighter better?',
  },
  {
    id: 'wwii-caliber-debate',
    name: 'The WWII Caliber Debate',
    origin: 'USA / UK / Germany',
    year: 1940,
    era: '1940–1955',
    category: 'Historical Context',
    categoryColor: '#e8d44d',
    tagline: 'Full-power vs. intermediate cartridge — the argument that shaped every service rifle after 1945.',
    body: 'By 1940, infantry combat data showed most engagements occurred under 300 meters — well within the capability of a lighter cartridge than .30-06 or 7.92 Mauser. Germany\'s answer was the 7.92×33mm Kurz and the StG-44. The British experimented with .280 (7×43mm). The US Army, conservatively committed to long-range marksmanship doctrine, insisted on full-power cartridges. After WWII, NATO standardized on 7.62×51mm — a shortened but barely lighter .30-06 equivalent — over British objections. The Soviets chose the 7.62×39mm intermediate for the AK-47. The US eventually adopted 5.56×45mm in 1963. The intermediate cartridge won, but it took 20 years of institutional resistance.',
  },
  {
    id: 'stg44',
    name: 'StG 44 (Sturmgewehr)',
    origin: 'Germany',
    year: 1944,
    era: '1944–1945',
    category: 'Assault Rifle',
    categoryColor: '#ff6b6b',
    tagline: 'The first assault rifle — its concept outlived the regime that built it.',
    body: 'The Sturmgewehr 44 combined a 30-round detachable magazine, selective fire (semi and full auto), and an intermediate 7.92×33mm Kurz cartridge into the first weapon we would recognize as an assault rifle. Hitler reportedly named it himself (overruling the "MP43" designation to hide its development from him). Late-war Wehrmacht units equipped with it outperformed those with bolt actions. Its concept — intermediate cartridge, high-capacity magazine, selective fire — directly influenced Kalashnikov\'s AK-47 design.',
  },
  {
    id: 'ak47',
    name: 'AK-47 / AKM / AK-74 Family',
    origin: 'USSR / Russia',
    year: 1947,
    era: '1947–present',
    category: 'Assault Rifle',
    categoryColor: '#ff6b6b',
    tagline: '75–100 million produced — the most manufactured firearm in human history.',
    body: "Mikhail Kalashnikov's gas-operated rifle emerged from WWII combat experience. The long-stroke piston system and loose tolerances give it legendary reliability in adverse conditions. An estimated 75–100 million AK-pattern rifles have been produced — the most manufactured firearm in history.",
  },
  {
    id: '1911',
    name: 'M1911 / 1911 Family',
    origin: 'USA',
    year: 1911,
    era: '1911–present',
    category: 'Pistol',
    categoryColor: '#51cf66',
    tagline: '74 years of continuous US military service — the longest-serving standard sidearm.',
    body: "John Browning's .45 ACP semi-automatic pistol served as the US military's standard sidearm from 1911 to 1985 — 74 years of continuous service. The single-action locked-breech design became the template for modern semi-automatic pistols. Still in production by dozens of manufacturers and competitive in practical and bullseye shooting today.",
  },
  {
    id: 'fn-fal',
    name: 'FN FAL',
    origin: 'Belgium',
    year: 1953,
    era: '1953–present',
    category: 'Assault Rifle',
    categoryColor: '#ff6b6b',
    tagline: '"The right arm of the free world" — adopted by over 90 countries during the Cold War.',
    body: "FN Herstal's Fusil Automatique Léger in 7.62×51mm NATO was adopted by more Western nations during the Cold War than any other rifle. Its tilting-bolt gas-operated action is reliable across climates. The UK's L1A1 SLR version (semi-auto only) served through the Falklands War. Argentina and the UK both used FALs against each other in 1982 — the only time the same weapon has faced itself in a major conflict. Israel, Australia, Canada, and dozens of African and South American militaries issued it.",
  },
  {
    id: 'ar15',
    name: 'AR-15 / M16 / M4 Family',
    origin: 'USA',
    year: 1959,
    era: '1959–present',
    category: 'Assault Rifle',
    categoryColor: '#ff6b6b',
    tagline: 'The most-produced rifle in American history — in service every year since 1959.',
    body: 'Designed by Eugene Stoner for ArmaLite, the AR-15 is the most-produced rifle platform in American history. The direct-impingement gas system and modular lower/upper split have spawned an entire ecosystem of parts, calibers, and configurations. The M16 and M4 variants have served in every US conflict since Vietnam.',
  },
  {
    id: 'remington700',
    name: 'Remington Model 700',
    origin: 'USA',
    year: 1962,
    era: '1962–present',
    category: 'Bolt Rifle',
    categoryColor: '#74c0fc',
    tagline: 'Foundation of the US military sniper program — M24 and M40 are both 700 variants.',
    body: "The most successful bolt-action rifle in American history. The Model 700's push-feed action and aftermarket ecosystem made it the foundation for US military and law enforcement sniper programs (M24, M40). Chambered in over 40 calibers over its production run.",
  },
  {
    id: 'mp5',
    name: 'HK MP5',
    origin: 'Germany',
    year: 1966,
    era: '1966–present',
    category: 'Submachine Gun',
    categoryColor: '#ffa94d',
    tagline: 'Defined hostage rescue for 50 years — still preferred over SBRs in many police roles.',
    body: "Heckler & Koch's roller-delayed blowback SMG became the definitive hostage rescue weapon after its use by GSG-9 at Mogadishu in 1977. Over 30 variants produced. Renowned for accuracy relative to other SMGs. Still preferred in many law enforcement roles despite being replaced by SBRs in military use.",
  },
  {
    id: 'sig-p226',
    name: 'SIG Sauer P226 / P-Series',
    origin: 'Switzerland/Germany',
    year: 1980,
    era: '1980–present',
    category: 'Pistol',
    categoryColor: '#51cf66',
    tagline: 'Lost the Army trials on price, not performance — the SEALs adopted it anyway.',
    body: 'The P226 narrowly lost the 1984 US Army trials to the Beretta 92 on cost — not performance. The Navy SEALs, unwilling to accept that verdict, adopted it anyway where it served for decades. The DA/SA trigger and all-metal construction give it a reputation for smoothness and durability that spawned the P229, P228, and modern P320.',
  },
  {
    id: 'barrett-m82',
    name: 'Barrett M82 / M107',
    origin: 'USA',
    year: 1982,
    era: '1982–present',
    category: 'Anti-Materiel',
    categoryColor: '#cc5de8',
    tagline: 'Semi-automatic .50 BMG — engages targets at ranges that redefined "sniper."',
    body: "Ronnie Barrett's semi-automatic .50 BMG rifle entered military service in Desert Storm, used to defeat light armor and explosive ordnance at extreme ranges. The recoil-operated action and muzzle brake make the massive cartridge manageable. Maximum effective range against point targets exceeds 1,800 meters.",
  },
  {
    id: 'glock17',
    name: 'Glock 17 / Glock Family',
    origin: 'Austria',
    year: 1982,
    era: '1982–present',
    category: 'Pistol',
    categoryColor: '#51cf66',
    tagline: 'Carried by 65% of US law enforcement — the polymer pistol template every competitor copies.',
    body: "Gaston Glock's polymer-frame, striker-fired pistol revolutionized the handgun industry when the Austrian Army adopted it in 1982. The safe-action trigger, high-capacity magazines, and simple field-strip set the template for virtually every modern polymer pistol. Carried by over 65% of US law enforcement agencies.",
  },
  {
    id: 'beretta-m9',
    name: 'Beretta M9 / 92FS',
    origin: 'Italy',
    year: 1985,
    era: '1985–2017 (US military)',
    category: 'Pistol',
    categoryColor: '#51cf66',
    tagline: 'Beat the SIG P226 on price — served 32 years before the P320 replaced it.',
    body: "In 1985, the US military conducted trials to replace the M1911. The Beretta 92FS beat the SIG P226 by meeting all requirements at lower cost. The 9mm switch from .45 ACP was controversial — some argued for stopping power, others for magazine capacity and NATO standardization. The Beretta served through Desert Storm, Iraq, and Afghanistan. A notable issue: the locking block could fracture on high-pressure ammunition, causing the slide to detach. Modified versions addressed this. Replaced by the SIG P320 (M17/M18) in 2017.",
  },
  {
    id: 'fn-scar',
    name: 'FN SCAR (Mk 16 / Mk 17)',
    origin: 'Belgium',
    year: 2004,
    era: '2004–present',
    category: 'Assault Rifle',
    categoryColor: '#ff6b6b',
    tagline: "SOF's precision rifle — the SCAR-H is the preferred DMR for many special operations units.",
    body: "FN Herstal's Special Operations Forces Combat Assault Rifle won the SOCOM SCAR competition in 2004. Available in 5.56mm (Mk 16) and 7.62mm (Mk 17) variants. The SCAR-H has become the preferred precision/designated marksman platform for many SOF units worldwide.",
  },
  {
    id: 'hk416',
    name: 'HK416',
    origin: 'Germany',
    year: 2004,
    era: '2004–present',
    category: 'Assault Rifle',
    categoryColor: '#ff6b6b',
    tagline: 'The AR-15 redesigned with a piston system — used by Delta Force, SEAL Team 6, and French Army.',
    body: "Designed at the request of Delta Force to address M4 reliability issues in sandy environments, the HK416 replaces the AR-15's direct-impingement gas system with a short-stroke piston — keeping propellant gases out of the receiver. The action runs cooler and cleaner. It was the weapon used in the bin Laden raid. Norway adopted it as the HK416N; France replaced the FAMAS with it as the primary French military rifle. The 10.4\" variant in .300 Blackout is widely used by special operations forces.",
  },
  {
    id: 'sig-m17',
    name: 'SIG M17 / M18 (P320)',
    origin: 'USA/Germany',
    year: 2017,
    era: '2017–present',
    category: 'Pistol',
    categoryColor: '#51cf66',
    tagline: 'Won the MHS competition — then faced allegations of dropping when dropped.',
    body: "The SIG Sauer P320 won the US Army's Modular Handgun System competition in 2017, replacing the Beretta M9 after 32 years. The M17 (full-size) and M18 (compact) share a serialized fire control unit that can be swapped between frame sizes — a genuinely novel approach. Shortly after adoption, reports emerged of the P320 firing when dropped at specific angles without the trigger being pulled. SIG contested the characterizations but issued a voluntary upgrade. The military versions include a manual safety and modified trigger geometry. It remains the current US military sidearm.",
  },
  {
    id: 'sig-mcx-spear',
    name: 'SIG MCX SPEAR / XM7',
    origin: 'USA',
    year: 2022,
    era: '2022–present',
    category: 'Assault Rifle',
    categoryColor: '#ff6b6b',
    tagline: 'Next Generation Squad Weapon — designed to defeat modern body armor that 5.56 cannot.',
    body: "The US Army's Next Generation Squad Weapon program concluded that 5.56×45mm is insufficient against current and projected enemy body armor at combat distances. The XM7 (rifle) and XM250 (automatic rifle) fire 6.8×51mm Common Cartridge — a hybrid case with a steel head capable of 80,000 PSI chamber pressure. The SIG MCX SPEAR action was redesigned to handle these pressures. Critics note the ammunition is heavy (reducing soldier load capacity), the weapon is heavier than the M4, and the logistics tail is enormous. Proponents argue it defeats any currently fielded body armor at 600 meters. Full-rate production is underway as of 2024.",
  },
  // Legacy entries kept for historical completeness
  {
    id: 'm14',
    name: 'M14 Rifle',
    origin: 'USA',
    year: 1957,
    era: '1957–1970 (primary)',
    category: 'Semi-Auto Rifle',
    categoryColor: '#ff8787',
    tagline: "NATO's answer to the AK-47 — too heavy, too long, almost immediately replaced.",
    body: "The M14 was the US Army's post-WWII modernization: a select-fire, detachable-magazine 7.62×51mm NATO rifle intended to replace the M1 Garand, BAR, M1 Carbine, and M3 submachine gun in one design. It failed at all of them. In full-auto the recoil was uncontrollable; the wooden stock warped in jungle humidity; the length was awkward in close quarters. Adopted in 1957, it was being phased out before 1970. Modernized as the M21 and M14 EBR, it serves in a sniper/designated marksman role where its 7.62 range matters more than its weight.",
  },
]
  .slice()
  .sort((a, b) => a.year - b.year); // chronological order

// ─── SERVICE WEAPONS DATA ─────────────────────────────────────────────────────

type ServiceRole = 'Service Rifle' | 'Service Pistol' | 'LMG / SAW' | 'Machine Gun' | 'Submachine Gun' | 'Sniper Rifle' | 'Anti-Materiel';

interface ServiceWeapon {
  id: string;
  name: string;
  countries: string[];
  role: ServiceRole;
  yearStart: number;
  yearEnd: number | null; // null = still in service
  caliber: string;
  story: string;
}

const SERVICE_WEAPONS: ServiceWeapon[] = [
  // Service Rifles
  {
    id: 'sw-springfield1903', name: 'Springfield M1903', countries: ['USA'], role: 'Service Rifle', yearStart: 1903, yearEnd: 1957, caliber: '.30-06',
    story: "The M1903 was adopted after the Spanish-American War exposed how badly the Army's Krag-Jørgensen was outclassed by Spanish Mausers at San Juan Hill — the US essentially reverse-engineered the Mauser action, paid Germany a $200,000 patent fee, and produced arguably the finest bolt-action of WWI. It served in both World Wars, with early production featuring a \"rod bayonet\" so ridiculed by President Roosevelt that he personally ordered a return to blade bayonets. After WWII it lingered as a sniper platform until the 1950s, outlasting its official replacement by nearly a decade.",
  },
  {
    id: 'sw-leeen', name: 'Lee-Enfield SMLE', countries: ['UK', 'Canada', 'Australia', 'India'], role: 'Service Rifle', yearStart: 1895, yearEnd: 1957, caliber: '.303 British',
    story: "The Short Magazine Lee-Enfield was the product of James Paris Lee's rear-locking bolt — faster to cycle than Mauser's front-locking design, allowing trained soldiers to deliver the famous 'mad minute' of 15 accurate rounds. At Mons in 1914, German forces reportedly believed they were facing machine guns due to the volume of fire from British riflemen. Its 10-round magazine gave a significant capacity advantage in both World Wars, and the No.4 Mk I variant of WWII is widely considered the finest bolt-action service rifle ever fielded. Variations served in Commonwealth militaries into the 1990s.",
  },
  {
    id: 'sw-mauser98', name: 'Gewehr 98 / K98k', countries: ['Germany'], role: 'Service Rifle', yearStart: 1898, yearEnd: 1945, caliber: '7.92×57mm',
    story: "Peter Paul Mauser's 1898 action set the template for virtually every bolt-action sporting and military rifle for the next century. The front-locking lug design provided a stronger, safer lockup than the Lee system, and the controlled-round-feed extractor became the gold standard for reliability. The shortened Karabiner 98 kurz version armed the Wehrmacht through WWII, and captured K98k rifles were prized by Allied soldiers for their accuracy. The action was so mechanically sound that Mauser 98 derivatives are still produced today as premium hunting rifles.",
  },
  {
    id: 'sw-mosin', name: 'Mosin-Nagant M91/30', countries: ['USSR', 'Russia', 'Finland'], role: 'Service Rifle', yearStart: 1891, yearEnd: 1960, caliber: '7.62×54mmR',
    story: "Adopted by Imperial Russia in 1891, the Mosin-Nagant was a compromise between designs by Russian Colonel Mosin and Belgian Léon Nagant — each received 20,000 rubles while the other's contributions were incorporated without credit. Over 37 million were produced across its service life, making it one of the most manufactured bolt-actions in history. Soviet sniper Simo Häyhä — the 'White Death' — used an iron-sighted M28 variant to record over 500 kills in Finland's Winter War. The action's quirky interruptor and a cartridge with an archaic rimmed case made magazine feeding awkward, but Soviet industry compensated by producing the rifle in staggering quantities.",
  },
  {
    id: 'sw-garand', name: 'M1 Garand', countries: ['USA'], role: 'Service Rifle', yearStart: 1936, yearEnd: 1957, caliber: '.30-06',
    story: "John Garand spent 18 years perfecting his design before the Army adopted it in 1936, giving American infantry the world's first standard-issue semi-automatic rifle. General Patton called it 'the greatest battle implement ever devised.' The en-bloc clip ejects with a distinctive metallic ping when empty — legend says this warned enemies the shooter was reloading, but combat veterans universally dismissed this as barracks mythology. Replaced by the M14 in 1957, though the M14 proved so problematic in Vietnam that many argued the Garand's replacement was premature.",
  },
  {
    id: 'sw-stg44', name: 'StG 44', countries: ['Germany'], role: 'Service Rifle', yearStart: 1944, yearEnd: 1945, caliber: '7.92×33mm',
    story: "The Sturmgewehr 44 is arguably the most influential firearm of the 20th century — it demonstrated that an intermediate cartridge in a select-fire rifle could outperform both submachine guns and full-power rifles across most combat ranges. Hitler initially banned development of the 'assault rifle' concept, forcing engineers to disguise the MP43/MP44 as a submachine gun upgrade before he saw battlefield results and approved it. Mikhail Kalashnikov, who was wounded at the Battle of Bryansk, studied captured StG 44s while recovering, and later acknowledged they influenced his thinking. Only about 425,000 were produced before the war ended — too few and too late.",
  },
  {
    id: 'sw-ak47', name: 'AK-47 / AKM', countries: ['USSR', 'Russia', 'China', 'N. Korea', 'Vietnam'], role: 'Service Rifle', yearStart: 1949, yearEnd: null, caliber: '7.62×39mm',
    story: "Mikhail Kalashnikov designed the AK-47 in 1947 drawing on the StG 44's intermediate cartridge concept but incorporating the rotating bolt of the M1 Garand and the trigger group layout of the Remington Model 8. The AKM — a stamped-receiver redesign adopted in 1959 — is what most people actually mean by 'AK-47.' Its loose tolerances allow it to function reliably even when fouled with mud and sand, at the cost of accuracy; the design intentionally prioritizes function over precision. With an estimated 100 million produced, it is the most widely distributed weapon in human history and has appeared in nearly every armed conflict since 1950.",
  },
  {
    id: 'sw-fal', name: 'FN FAL', countries: ['UK', 'Australia', 'Canada', 'Israel', 'Argentina', 'Belgium'], role: 'Service Rifle', yearStart: 1953, yearEnd: 1990, caliber: '7.62×51mm',
    story: "The FN FAL was the standard rifle of the Western alliance during the Cold War, adopted by over 90 nations — earning it the nickname 'The Right Arm of the Free World.' FN originally designed it around an intermediate cartridge similar to the 7.92×33mm, but US pressure forced adoption of the full-power 7.62×51mm NATO round, making automatic fire essentially uncontrollable. The Falklands War created the unique spectacle of Argentine and British forces shooting at each other with the same rifle. Israel replaced it with the Galil in 1973 after Sinai desert conditions exposed maintenance challenges with the gas system.",
  },
  {
    id: 'sw-m14', name: 'M14', countries: ['USA'], role: 'Service Rifle', yearStart: 1957, yearEnd: 1970, caliber: '7.62×51mm',
    story: "The M14 replaced the Garand in 1957 after a development process so riddled with bureaucratic infighting that multiple congressional investigations were launched. It was designed as a rifle, squad automatic weapon, and sniper rifle simultaneously — and excelled at none of them. In Vietnam's jungle combat, it was heavy, long, and its full-power cartridge made it uncontrollable on automatic. By 1970 it had been largely replaced by the M16, though ironically it was brought back in the 2000s for Iraq and Afghanistan as a designated marksman rifle — exactly the role its automatic function was never suited for.",
  },
  {
    id: 'sw-g3', name: 'HK G3', countries: ['Germany', 'Iran', 'Pakistan', 'Turkey', 'Norway'], role: 'Service Rifle', yearStart: 1959, yearEnd: 1997, caliber: '7.62×51mm',
    story: "The G3 was developed from the Spanish CETME rifle, itself derived from the wartime German Sturmgewehr 45 using roller-delayed blowback — a system that avoids a gas piston entirely. Heckler & Koch licensed the design and refined it for the Bundeswehr in 1959. Its fluted chamber stamps distinctive extraction marks on brass, making fired cases identifiable — a detail intelligence agencies found useful. It was rugged and mechanically simple, but the powerful 7.62mm cartridge and delayed blowback produced brutal recoil in automatic fire. Germany replaced it with the G36 in 1997.",
  },
  {
    id: 'sw-m16', name: 'M16 / M4', countries: ['USA', 'Canada', 'Israel', 'Saudi Arabia', 'Australia'], role: 'Service Rifle', yearStart: 1964, yearEnd: null, caliber: '5.56×45mm',
    story: "Eugene Stoner's AR-15 — adopted as the M16 in 1964 — promised lightweight rifles with high-velocity ammunition, but its early Vietnam introduction was catastrophic. The Army had switched to a ball powder that fouled the action faster and eliminated the chrome bore lining to save money; the result was rifles jamming in combat with the etched instruction 'Self-Cleaning' on the barrel. A congressional investigation followed and improvements were mandated. The carbine M4 variant proved itself in Iraq and Afghanistan, and despite being 60 years old the platform continues to evolve — the US Army's adoption of the XM7 in 2023 being the first serious attempt at replacement.",
  },
  {
    id: 'sw-ak74', name: 'AK-74 / AK-12', countries: ['USSR', 'Russia'], role: 'Service Rifle', yearStart: 1974, yearEnd: null, caliber: '5.45×39mm',
    story: "The AK-74 was the Soviet answer to the M16's 5.56mm intermediate cartridge — a redesigned AKM chambered in 5.45×39mm with a distinctive muzzle brake that dramatically reduced recoil. Soviet troops in Afghanistan found the high-velocity 5.45mm 'Poison Bullet' tumbled aggressively on impact, causing severe wounds at moderate ranges. The AK-12, adopted in 2018, is a heavily modernized derivative with a full Picatinny rail system, improved ergonomics, and a foldable stock — though critics noted early versions had quality control issues and were rushed into service. It remains the standard Russian service rifle today.",
  },
  {
    id: 'sw-famas', name: 'FAMAS', countries: ['France'], role: 'Service Rifle', yearStart: 1979, yearEnd: 2017, caliber: '5.56×45mm',
    story: "The FAMAS — French acronym for 'fusil d'assaut de la manufacture d'armes de Saint-Étienne' — was one of the first bullpup rifles to enter mass service. Its lever-delayed blowback action was mechanically elegant but sensitive to ammunition; the rifle could only reliably feed French-made cartridges with a specific primer depth, which became a logistical nightmare when operating with NATO partners. France never achieved a domestic supply agreement after FAMAS production ended, and rather than upgrade the design the French Army selected the HK416 as its replacement in 2017 — a remarkably expensive solution to what was fundamentally an ammunition compatibility problem.",
  },
  {
    id: 'sw-l85', name: 'L85 / SA80', countries: ['UK'], role: 'Service Rifle', yearStart: 1987, yearEnd: null, caliber: '5.56×45mm',
    story: "The SA80 program was a bureaucratic and engineering disaster — the bullpup design was rushed into service in 1987 with known reliability problems, and British soldiers quickly nicknamed it the 'Piece of S***' or 'SA Eighty Stoppages.' The trigger, gas system, and magazine release all generated complaints. After Operation Desert Storm exposed the rifle's unreliability in sandy conditions, the MoD contracted Heckler & Koch to fix it; the resulting L85A2 variant (2002) was essentially rebuilt from the ground up and proved reliable. The latest L85A3 (2016) added Picatinny rails and improved ergonomics, transforming it into a genuinely capable service rifle.",
  },
  {
    id: 'sw-hk416', name: 'HK416', countries: ['Norway', 'France', 'Germany (SOF)'], role: 'Service Rifle', yearStart: 2004, yearEnd: null, caliber: '5.56×45mm',
    story: "The HK416 was originally developed under a classified US Army contract as an improved upper receiver for M4 rifles, replacing the direct impingement gas system with a short-stroke piston that runs cleaner and cooler. Delta Force adopted it first, and the rifle gained global fame when it was used to kill Osama bin Laden in 2011. Norway adopted it as the standard service rifle, and France selected it as a full FAMAS replacement in 2017 after a competitive evaluation. Despite being significantly more expensive than comparable rifles, its reliability under harsh conditions has made it the premium choice for tier-one units worldwide.",
  },
  {
    id: 'sw-xm7', name: 'XM7 (MCX SPEAR)', countries: ['USA'], role: 'Service Rifle', yearStart: 2023, yearEnd: null, caliber: '6.8×51mm',
    story: "The XM7 represents the Army's response to advances in body armor — the new 6.8×51mm hybrid case cartridge operates at pressures 20% higher than conventional brass would allow, thanks to a steel head, and reportedly penetrates current Russian and Chinese ceramic plates at combat ranges. The program was accelerated after the Army concluded that 5.56mm would be insufficient against near-peer adversaries wearing modern armor. Critics have raised concerns about the rifle's 9-pound weight — heavier than the M16 it's meant to replace — and whether the benefits justify equipping every infantryman versus just specialized units. Procurement is ongoing as of 2024.",
  },
  // Service Pistols
  {
    id: 'sw-colt1911', name: 'M1911 / 1911A1', countries: ['USA'], role: 'Service Pistol', yearStart: 1911, yearEnd: 1985, caliber: '.45 ACP',
    story: "John Browning designed the M1911 in direct response to the Moro Rebellion in the Philippines, where .38 caliber revolvers repeatedly failed to stop drug-fueled Moro warriors charging at close range. The Army wanted a .45-caliber pistol that could stop a charging man reliably, and Browning delivered one of the most mechanically elegant pistol designs in history. After 74 years of service through two World Wars, Korea, and Vietnam — a record unmatched by any other standard service pistol — it was replaced by the Beretta M9 in a decision that sparked a controversy still alive in gun communities today. Millions of shooters consider it the finest production pistol ever made.",
  },
  {
    id: 'sw-hp', name: 'Browning Hi-Power', countries: ['UK', 'Canada', 'Belgium', 'Australia', 'Israel'], role: 'Service Pistol', yearStart: 1935, yearEnd: 2013, caliber: '9mm',
    story: "John Browning began designing the Hi-Power in the early 1920s in response to a French military requirement for a 15-round magazine pistol. He died in 1926 before completing it, and FN designer Dieudonné Saive finished the work — producing what became the world's first high-capacity service pistol. In the uniquely paradoxical way of WWII, the Hi-Power was simultaneously the standard sidearm of the British SAS and the German Fallschirmjäger (paratroopers), with both sides using pistols produced at the same Belgian factory under competing occupation arrangements. FN finally discontinued production in 2017, though the platform saw 78 years of continuous military service.",
  },
  {
    id: 'sw-beretta92', name: 'Beretta M9 / 92FS', countries: ['USA', 'Italy', 'France', 'Brazil'], role: 'Service Pistol', yearStart: 1985, yearEnd: 2017, caliber: '9mm',
    story: "The Beretta 92 won the US Army's XM9 pistol trials in 1985 over fierce competition — and immediately generated political controversy, with Congress questioning why the Army was replacing an American pistol (the 1911) with an Italian one. Early slide fractures in the late 1980s caused several injuries, traced to excessive hot-loaded military ammunition rather than a design flaw, though the episode damaged the M9's reputation. The pistol served 32 years through the Gulf War, Iraq, and Afghanistan before being replaced by the SIG M17. Its open-slide design and double-action/single-action trigger made it widely copied, and the 92FS remains a best-selling commercial pistol.",
  },
  {
    id: 'sw-glk17', name: 'Glock 17/19', countries: ['Austria', 'Germany', 'UK', 'Australia', 'Norway', 'Netherlands'], role: 'Service Pistol', yearStart: 1982, yearEnd: null, caliber: '9mm',
    story: "Gaston Glock had never designed a firearm when he submitted a polymer-framed pistol to the Austrian Army's 1980 trials — he was a curtain rod manufacturer with expertise in polymer injection molding. The resulting Glock 17 passed trials that required 10,000 rounds without malfunction, and its radical polymer frame cut weight by 30% versus steel competitors. American tabloids falsely claimed the 'plastic pistol' was invisible to metal detectors — a total fabrication that nonetheless drove enormous public interest. The Glock's consistent trigger pull, minimal controls, and legendary reliability made it the dominant law enforcement and military sidearm of the late 20th century, adopted by police in 65 countries.",
  },
  {
    id: 'sw-p226', name: 'SIG P226', countries: ['USA (Navy SEAL)', 'UK', 'Germany', 'Japan'], role: 'Service Pistol', yearStart: 1984, yearEnd: 2015, caliber: '9mm',
    story: "The P226 narrowly lost the US Army's XM9 contract to Beretta in 1984 — not on performance, but because SIG's per-unit price was slightly higher. The Navy SEALs, unconvinced by Army procurement decisions, evaluated the pistol independently and adopted it as their standard sidearm, where it served for three decades. The P226's double-action/single-action trigger, machined aluminum frame, and meticulous Swiss-German manufacturing gave it a reputation as the most accurate and reliable 9mm service pistol of its era. It was replaced in SEAL service by the Glock 19 in 2015 after a competitive evaluation prioritized weight savings over the SIG's premium build quality.",
  },
  {
    id: 'sw-m17', name: 'SIG M17 / M18 (P320)', countries: ['USA'], role: 'Service Pistol', yearStart: 2017, yearEnd: null, caliber: '9mm',
    story: "The SIG P320 won the Army's Modular Handgun System competition in 2017 in an evaluation that was controversial from the start — critics questioned whether it offered enough improvement over the M9 to justify the $580 million contract. Shortly after announcement, reports emerged of P320 pistols discharging when dropped without the trigger being pulled, a safety issue SIG addressed with a voluntary upgrade. The Army's M17 variant includes a manual safety absent on most commercial P320s. The modular serialized chassis — allowing the same fire control unit to be installed in different sized frames — represents a genuinely new approach to service pistol architecture.",
  },
  // Machine Guns
  {
    id: 'sw-maxim', name: 'Maxim / Vickers', countries: ['UK', 'Russia', 'Germany'], role: 'Machine Gun', yearStart: 1884, yearEnd: 1968, caliber: '.303 / 7.92mm',
    story: "Hiram Maxim invented the first fully automatic machine gun in 1884 after an American told him the best way to make money was to invent something that would help Europeans kill each other faster. The water-cooled Vickers variant fired 450–500 rpm continuously for hours. At the Somme in 1916, ten Vickers guns fired 1 million rounds over 12 hours without a mechanical failure. Replaced by air-cooled GPMGs after WWII when sustained fire doctrine gave way to mobile warfare.",
  },
  {
    id: 'sw-mg42', name: 'MG42 / MG3', countries: ['Germany'], role: 'Machine Gun', yearStart: 1942, yearEnd: null, caliber: '7.92mm / 7.62×51mm',
    story: "The MG42 was designed to be manufactured cheaply and quickly using metal stampings — a radical departure from machined steel weapons — and it fired at a then-unprecedented 1,200 rounds per minute, producing a distinctive tearing sound that Allied troops called 'Hitler's Buzzsaw.' Its barrel could be changed in under six seconds, allowing sustained fire that no Allied machine gun could match. American training films specifically instructed soldiers not to mistake the rapid cyclic rate for multiple guns. The post-war MG3, rechambered for 7.62×51mm NATO, remains in service with the Bundeswehr today — over 80 years after the original design.",
  },
  {
    id: 'sw-m2', name: 'M2 Browning .50 BMG', countries: ['USA', 'UK', 'NATO'], role: 'Machine Gun', yearStart: 1933, yearEnd: null, caliber: '.50 BMG',
    story: "John Browning designed the M2 in 1918 in direct response to a request from General Pershing for a weapon capable of defeating aircraft and light armor. The .50 BMG cartridge was literally scaled up from the .30-06 using a pantograph. The 'Ma Deuce' has been in continuous US service since 1933 — longer than any other weapon in the American arsenal — serving in WWII, Korea, Vietnam, the Gulf War, Iraq, and Afghanistan with only minor modifications. A single M2 operator, Carlos Hathcock, used one with an improvised scope to achieve a 2,500-yard sniper kill in Vietnam that stood as the record for decades.",
  },
  {
    id: 'sw-m60', name: 'M60 GPMG', countries: ['USA', 'Australia'], role: 'Machine Gun', yearStart: 1957, yearEnd: 1995, caliber: '7.62×51mm',
    story: "The M60 was developed from captured German MG42 and FG42 designs after WWII, combining the MG42's feed system with the FG42's gas operation — but the American engineers, working from incomplete documents, made several errors that produced a weapon that was heavier and less reliable than its German inspirations. Vietnam-era soldiers nicknamed it 'The Pig' for its weight and feeding problems. Barrel changes required an asbestos glove and often resulted in burns. The Army repeatedly attempted to replace it; the M240 finally succeeded in the 1990s, though the M60E4 variant persists in Navy service.",
  },
  {
    id: 'sw-m240', name: 'M240 / FN MAG', countries: ['USA', 'UK', 'Belgium', 'Canada', 'Israel'], role: 'Machine Gun', yearStart: 1977, yearEnd: null, caliber: '7.62×51mm',
    story: "The FN MAG (Mitrailleuse d'Appui Général) was designed by Ernest Vervier at FN in the early 1950s, drawing heavily on the Browning Automatic Rifle's tilting-bolt mechanism. The US Army evaluated it in the late 1970s as a coaxial tank machine gun (the M240 designation) and its superior reliability over the M60 was immediately apparent, triggering a decade-long process to replace the M60 in the infantry role as well. By the mid-1990s the M240B had largely taken over, and it proved its reliability extensively in Iraq and Afghanistan. The UK fields an identical weapon as the L7A2, and both nations consider it their most reliable GPMG ever fielded.",
  },
  // SAW / LMG
  {
    id: 'sw-bar', name: 'BAR M1918', countries: ['USA'], role: 'LMG / SAW', yearStart: 1918, yearEnd: 1957, caliber: '.30-06',
    story: "John Browning designed the BAR in 1917 to fulfill General Pershing's concept of 'walking fire' — infantry advancing while firing from the hip to keep German heads down. It arrived at the front just weeks before the Armistice. By WWII the walking fire concept had been abandoned, but the BAR found a new role as the American squad's only automatic weapon, one per squad in the Pacific and European theaters. Its 20-round magazine was inadequate for sustained fire, and the bipod was often discarded as useless weight. Famous bank robbers Bonnie and Clyde carried stolen military BARs in the early 1930s, which contributed to the National Firearms Act of 1934.",
  },
  {
    id: 'sw-lewis', name: 'Lewis Gun', countries: ['UK', 'USA', 'Canada'], role: 'LMG / SAW', yearStart: 1914, yearEnd: 1946, caliber: '.303 British',
    story: "Colonel Isaac Lewis invented the gun but was rebuffed by the US Army — reportedly due to a personal feud with the Army's chief of ordnance — so he went to Belgium and sold it to the British. The drum magazine could hold 47 or 97 rounds, and its distinctive aluminum cooling shroud created airflow over the barrel using muzzle blast. It became the standard light machine gun of WWI British forces, appearing on aircraft before dedicated aviation versions were developed. The spade-grip aircraft Lewis gun, with the cooling shroud removed (unnecessary at altitude), was fitted on everything from Sopwith Camels to early bombers.",
  },
  {
    id: 'sw-bren', name: 'Bren Gun', countries: ['UK', 'Canada', 'Australia', 'India'], role: 'LMG / SAW', yearStart: 1938, yearEnd: 1992, caliber: '.303 / 7.62×51mm',
    story: "The Bren was developed from the Czech ZB vz. 26 — 'Bren' being a portmanteau of Brno (the Czech city of manufacture) and Enfield (the British arsenal that adapted it). Its curved 30-round magazine curved to accommodate the rimmed .303 cartridge; when the UK adopted 7.62×51mm NATO in the 1950s, the Bren was rechambered and redesignated the L4A4 with a straight magazine. British soldiers consistently rated it the most accurate and reliable LMG of WWII, and Argentine forces using L4A4s in the Falklands in 1982 demonstrated that the 44-year-old design was still operationally viable.",
  },
  {
    id: 'sw-rpk', name: 'RPK / RPK-74', countries: ['USSR', 'Russia'], role: 'LMG / SAW', yearStart: 1961, yearEnd: null, caliber: '7.62×39mm / 5.45×39mm',
    story: "The RPK (Ruchnoy Pulemyot Kalashnikova) was designed alongside the AKM as a squad automatic weapon sharing 80% parts commonality — a Soviet logistics priority learned from WWII supply chaos. Mikhail Kalashnikov simply took his AKM, extended the barrel, added a bipod, and fitted a 75-round drum or 40-round magazine. Parts interchangeability simplified training and field repairs dramatically. The RPK-74 followed the same formula for the 5.45mm cartridge in 1974. Its major limitation is that it uses the same closed-bolt mechanism as the AKM — not designed for sustained fire — but Soviet doctrine emphasized volume of fire over barrel longevity.",
  },
  {
    id: 'sw-m249', name: 'M249 SAW (FN Minimi)', countries: ['USA', 'Belgium', 'Australia', 'Canada'], role: 'LMG / SAW', yearStart: 1984, yearEnd: null, caliber: '5.56×45mm',
    story: "The FN Minimi was designed by Ernest Vervier in the 1970s to address the gap between submachine guns and full machine guns — a light, magazine-fed weapon that could also accept belt ammunition. The US adopted it as the M249 SAW in 1984 after the M16-armed squad lacked organic automatic fire capability. In the Gulf War, M249s overheated rapidly in sustained fire due to the thin barrel profile, and in Iraq the weapon's open-bolt mechanism ingested more sand than closed-bolt rifles. A succession of product improvement programs addressed these issues. The Army has been attempting to replace the M249 with the XM250 NGSW-AR program, which uses the same 6.8mm ammunition as the XM7 rifle.",
  },
  // Submachine Guns
  {
    id: 'sw-thompson', name: 'Thompson SMG', countries: ['USA', 'UK'], role: 'Submachine Gun', yearStart: 1919, yearEnd: 1971, caliber: '.45 ACP',
    story: "General John T. Thompson designed his 'Annihilator' during WWI to clear German trenches, but the war ended before production could begin, leaving Thompson with a warehouse of expensive firearms and a marketing problem. He tried selling to police and the Post Office; gangsters were better customers. The Thompson became synonymous with Prohibition-era organized crime — Al Capone used one in the St. Valentine's Day Massacre — giving it both notoriety and celebrity that sold enormous quantities. The WWII M1A1 variant, simplified for mass production, stripped away the Cutts compensator and drum magazine of the gangster era and served with distinction in every theater.",
  },
  {
    id: 'sw-mp40', name: 'MP40', countries: ['Germany'], role: 'Submachine Gun', yearStart: 1940, yearEnd: 1945, caliber: '9mm',
    story: "Designed by Heinrich Vollmer, the MP40 was a simplified, mass-production evolution of the MP38. Its folding stock made it ideal for paratroopers and vehicle crews. American soldiers often called any German SMG a 'Schmeisser' — despite Hugo Schmeisser having nothing to do with its design. Its 9mm open-bolt blowback action was reliable but limited to ~400 rpm, actually lower than the Thompson. Replaced by assault rifles post-WWII as the intermediate cartridge made dedicated SMGs obsolete.",
  },
  {
    id: 'sw-sten', name: 'Sten Gun', countries: ['UK', 'Canada'], role: 'Submachine Gun', yearStart: 1941, yearEnd: 1960, caliber: '9mm',
    story: "The Sten (named for its designers Shepherd and Turpin, and Enfield) was created in 1940 after Dunkirk left the British Army desperately short of infantry weapons and unable to acquire enough Thompsons from America. The Mark II cost just £2 10s to produce and could be manufactured in small workshops — simple enough that resistance fighters in occupied Europe made them from plumbing parts. The horizontal side-mounted magazine, copied from the German MP28, fed poorly and caused most stoppages; experienced soldiers carried the weapon at a 45-degree cant to improve feed. Its simplicity was both its greatest virtue and its greatest flaw: the open-bolt design made accidental discharge a known hazard.",
  },
  {
    id: 'sw-mp5', name: 'HK MP5', countries: ['Germany', 'UK', 'USA (LEO)', 'Many'], role: 'Submachine Gun', yearStart: 1966, yearEnd: null, caliber: '9mm',
    story: "The MP5 applied the roller-delayed blowback system of the G3 rifle to a 9mm submachine gun — an unusual choice that allowed it to fire from a closed bolt, giving it accuracy competitive with pistols. This precision made it the preferred weapon of hostage rescue and counter-terrorism units worldwide after the GSG 9 used it in the famous 1977 Mogadishu airliner rescue. The Iranian Embassy siege in London (1980), conducted by the SAS in live television, made the MP5 a global icon. By the 2000s the rise of body armor and the need for rifle-caliber penetration began shifting SWAT teams to short-barreled rifles, but the MP5 remains standard in dozens of military and police organizations.",
  },
  // Sniper Rifles
  {
    id: 'sw-m24', name: 'M24 SWS (Rem 700)', countries: ['USA'], role: 'Sniper Rifle', yearStart: 1988, yearEnd: null, caliber: '7.62×51mm',
    story: "The M24 Sniper Weapon System was adopted in 1988 based on the Remington 700 long action — a somewhat puzzling choice since the 7.62×51mm cartridge only requires a short action, but the Army chose the long action to allow future rechambering to .300 Win Mag. This foresight paid off in Afghanistan, where the 7.62mm's range proved inadequate against Taliban fighters engaging from 800+ meters, prompting a conversion program to .300 Win Mag designated the M24A3. The rifle has produced confirmed kills at ranges exceeding 1,000 meters in the hands of Army snipers, and the basic Remington 700 action it derives from has been the gold standard of precision bolt-actions for over 60 years.",
  },
  {
    id: 'sw-m107', name: 'Barrett M107 (.50 BMG)', countries: ['USA', 'UK', 'Many'], role: 'Anti-Materiel', yearStart: 1990, yearEnd: null, caliber: '.50 BMG',
    story: "Ronnie Barrett built the first prototype of his .50 BMG rifle in 1982 using hand tools and a rented welder, despite having no formal firearms design training. The military initially showed no interest; Barrett sold to civilians first and built a reputation before Gulf War procurement officers discovered the rifle in gun shops. In Desert Storm, M82 variants were used to detonate ordnance from safe distances and disable parked aircraft — an 'anti-materiel' role that circumvented Geneva Convention restrictions on using anti-personnel sniper fire against individuals. Carlos Hathcock's Vietnam-era .50 BMG kill record stood for 35 years before being broken with a Barrett in Afghanistan at over 2,500 meters.",
  },
  {
    id: 'sw-awm', name: 'Accuracy International AWM', countries: ['UK', 'Germany', 'Netherlands'], role: 'Sniper Rifle', yearStart: 1996, yearEnd: null, caliber: '.338 Lapua / .300 Win Mag',
    story: "Accuracy International was founded in 1978 by Olympic shooting champion Malcolm Cooper specifically to build rifles good enough to win at the highest competitive levels — the L96, the AWM's predecessor, was designed around competitive target shooting requirements rather than military ones, which accidentally produced exceptional accuracy. The AWM (Arctic Warfare Magnum) was developed in the mid-1990s for the .338 Lapua cartridge, which fills the gap between 7.62mm and .50 BMG. Corporal Craig Harrison used an AWM to achieve the world's longest confirmed sniper kill at 2,475 meters in Afghanistan in 2009, a record that stood until 2017.",
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
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
  const [platformTab, setPlatformTab] = useState<'timeline' | 'deployed'>('timeline');
  const [platformCategory, setPlatformCategory] = useState<string>('All');
  const [deployedCountry, setDeployedCountry] = useState<string>('All');
  const [deployedRole, setDeployedRole] = useState<string>('All');
  const [selectedWeapon, setSelectedWeapon] = useState<ServiceWeapon | null>(null);

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
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 21 L10 10 Q10 3 12 3 Q14 3 14 10 L14 21 Z"/>
        <line x1="10" y1="11.5" x2="14" y2="11.5"/>
        <line x1="10" y1="17" x2="14" y2="17"/>
      </svg>
    );
    const IcnPlatforms = () => (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="13" y1="10" x2="22" y2="10"/>
        <line x1="20" y1="10" x2="20" y2="8.5"/>
        <rect x="7" y="9" width="6" height="4.5" rx="0.5"/>
        <path d="M7 10 L3 9.5 L2 12 L3 13 L7 13.5"/>
        <path d="M10 13.5 L9.5 17.5 L12 17.5 L12 13.5"/>
      </svg>
    );
    const IcnBallistics = () => (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
        <path d="M2 20 Q5 5 12 4 Q19 5 22 20"/>
        <line x1="12" y1="4" x2="12" y2="12" strokeDasharray="2 2"/>
        <line x1="1" y1="21.5" x2="23" y2="21.5"/>
        <circle cx="22" cy="20" r="1.5" fill="white" stroke="none"/>
      </svg>
    );
    const IcnGlossary = () => (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="3" width="16" height="18" rx="2"/>
        <line x1="8" y1="8" x2="16" y2="8"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
        <line x1="8" y1="16" x2="13" y2="16"/>
      </svg>
    );
    const IcnOptics = () => (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="8"/>
        <line x1="12" y1="4" x2="12" y2="8.5"/>
        <line x1="12" y1="15.5" x2="12" y2="20"/>
        <line x1="4" y1="12" x2="8.5" y2="12"/>
        <line x1="15.5" y1="12" x2="20" y2="12"/>
        <circle cx="12" cy="12" r="1.5" fill="white" stroke="none"/>
      </svg>
    );

    const homeCards = [
      { icon: <IcnCartridges/>, title: 'Cartridges',      subtitle: 'Specs, history & ballistics', action: () => setSection('cartridges') },
      { icon: <IcnPlatforms/>,  title: 'Gun History',     subtitle: 'Famous firearm families',     action: () => setSection('platforms') },
      { icon: <IcnBallistics/>, title: 'Ballistics',      subtitle: 'External & terminal concepts', action: () => setSection('ballistics') },
      { icon: <IcnGlossary/>,   title: 'Glossary',        subtitle: 'Acronyms & terms decoded',     action: () => setSection('glossary') },
      { icon: <IcnOptics/>,     title: 'Optics Overview', subtitle: 'Scopes, red dots & beyond',    action: () => setSection('optics') },
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
    // ── Derived data ──
    const uniqueCategories = ['All', ...Array.from(new Set(PLATFORMS.map((p) => p.category)))];
    const filteredPlatforms = platformCategory === 'All'
      ? PLATFORMS
      : PLATFORMS.filter((p) => p.category === platformCategory);

    const allCountries = Array.from(new Set(SERVICE_WEAPONS.flatMap((w) => w.countries))).sort();
    const ALL_ROLES: ServiceRole[] = ['Service Rifle', 'Service Pistol', 'LMG / SAW', 'Machine Gun', 'Submachine Gun', 'Sniper Rifle', 'Anti-Materiel'];
    const allRoles = ALL_ROLES;

    const filteredServiceWeapons = SERVICE_WEAPONS.filter((w) => {
      const matchCountry = deployedCountry === '' || deployedCountry === 'All' || w.countries.some((c) => c.toLowerCase().includes(deployedCountry.toLowerCase()));
      const matchRole = deployedRole === '' || deployedRole === 'All' || w.role.toLowerCase().includes(deployedRole.toLowerCase());
      return matchCountry && matchRole;
    }).sort((a, b) => a.yearStart - b.yearStart);

    const CHART_YEAR_START = 1860;
    const CHART_YEAR_END = 2025;
    const PX_PER_YEAR = 5;
    const TOTAL_WIDTH = (CHART_YEAR_END - CHART_YEAR_START) * PX_PER_YEAR; // 825px
    const NAME_COL_WIDTH = 130;
    const ROW_HEIGHT = 28;
    const decades = [];
    for (let y = CHART_YEAR_START; y <= CHART_YEAR_END; y += 10) decades.push(y);

    const roleColor: Record<ServiceRole, string> = {
      'Service Rifle': '#ff6b6b',
      'Service Pistol': '#51cf66',
      'Machine Gun': '#f783ac',
      'LMG / SAW': '#ffa94d',
      'Submachine Gun': '#ffd43b',
      'Sniper Rifle': '#74c0fc',
      'Anti-Materiel': '#cc5de8',
    };

    // ── Shared tab button style ──
    const tabBtn = (active: boolean): React.CSSProperties => ({
      flex: 1,
      padding: '7px 0',
      border: 'none',
      borderBottom: active ? '2px solid ' + theme.accent : '2px solid transparent',
      backgroundColor: 'transparent',
      color: active ? theme.accent : theme.textMuted,
      fontFamily: 'monospace',
      fontSize: '11px',
      fontWeight: active ? 700 : 400,
      letterSpacing: '1.5px',
      cursor: 'pointer',
    });

    const chipBtn = (active: boolean, color?: string): React.CSSProperties => ({
      flexShrink: 0,
      padding: '4px 10px',
      borderRadius: '20px',
      border: '0.5px solid ' + (active ? (color || theme.accent) : theme.border),
      backgroundColor: active ? (color ? color + '22' : 'rgba(255,212,59,0.12)') : theme.surface,
      color: active ? (color || theme.accent) : theme.textSecondary,
      fontFamily: 'monospace',
      fontSize: '10px',
      fontWeight: active ? 700 : 400,
      letterSpacing: '0.4px',
      cursor: 'pointer',
    });

    return (
      <div style={containerStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <button style={backBtnStyle} onClick={() => setSection('home')}>← Back</button>
          <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '1px' }}>Gun History</span>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '0.5px solid ' + theme.border }}>
          <button style={tabBtn(platformTab === 'timeline')} onClick={() => setPlatformTab('timeline')}>
            TIMELINE
          </button>
          <button style={tabBtn(platformTab === 'deployed')} onClick={() => setPlatformTab('deployed')}>
            DEPLOYED
          </button>
        </div>

        {/* ── TIMELINE TAB ── */}
        {platformTab === 'timeline' && (
          <div>
            {/* Category filter chips */}
            <div style={{ display: 'flex', gap: '6px', padding: '10px 16px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              {uniqueCategories.map((cat) => (
                <button
                  key={cat}
                  style={chipBtn(platformCategory === cat)}
                  onClick={() => setPlatformCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Timeline list */}
            <div style={{ position: 'relative', padding: '12px 16px 60px 44px' }}>
              {/* Vertical line */}
              <div style={{
                position: 'absolute',
                left: '28px',
                top: '12px',
                bottom: '60px',
                width: '1px',
                background: `linear-gradient(to bottom, transparent, ${theme.border} 40px, ${theme.border} calc(100% - 30px), transparent)`,
              }}/>

              {filteredPlatforms.map((p, i) => {
                const isExpanded = expandedPlatform === p.id;
                return (
                  <div key={p.id} style={{ position: 'relative', marginBottom: i < filteredPlatforms.length - 1 ? '20px' : 0 }}>
                    {/* Timeline dot */}
                    <div style={{
                      position: 'absolute',
                      left: '-22px',
                      top: '13px',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: p.categoryColor,
                      border: '2px solid ' + theme.bg,
                      boxShadow: '0 0 0 1px ' + p.categoryColor + '60',
                      zIndex: 1,
                    }}/>

                    {/* Year label */}
                    <div style={{
                      position: 'absolute',
                      left: '-42px',
                      top: '10px',
                      fontSize: '8px',
                      fontFamily: 'monospace',
                      color: theme.textMuted,
                      letterSpacing: '0.3px',
                      whiteSpace: 'nowrap',
                      textAlign: 'right',
                      width: '16px',
                    }}>
                      {p.year}
                    </div>

                    {/* Card — click to expand/collapse */}
                    <div
                      onClick={() => setExpandedPlatform(isExpanded ? null : p.id)}
                      style={{
                        backgroundColor: theme.surface,
                        border: '0.5px solid ' + (isExpanded ? p.categoryColor + '80' : theme.border),
                        borderLeft: '2px solid ' + p.categoryColor,
                        borderRadius: '6px',
                        padding: '10px 12px',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: theme.textPrimary, letterSpacing: '0.3px', lineHeight: 1.3 }}>
                          {p.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <span style={{ fontSize: '9px', fontFamily: 'monospace', color: p.categoryColor, fontWeight: 700, letterSpacing: '0.5px' }}>
                            {p.category.toUpperCase()}
                          </span>
                          <span style={{ fontSize: '10px', color: theme.textMuted }}>
                            {isExpanded ? '▲' : '▼'}
                          </span>
                        </div>
                      </div>
                      <div style={{ fontSize: '10px', color: theme.textMuted, fontFamily: 'monospace', marginTop: '2px', marginBottom: isExpanded ? '8px' : '4px' }}>
                        {p.origin} · {p.era}
                      </div>
                      {!isExpanded && (
                        <div style={{ fontSize: '11px', color: theme.textSecondary, fontFamily: 'monospace', lineHeight: 1.5, fontStyle: 'italic' }}>
                          {p.tagline}
                        </div>
                      )}
                      {isExpanded && (
                        <div style={{ fontSize: '12px', color: theme.textSecondary, lineHeight: 1.65, fontFamily: 'monospace' }}>
                          {p.body}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── DEPLOYED TAB ── */}
        {platformTab === 'deployed' && (
          <div>
            {/* Searchable dropdowns */}
            <div style={{ display: 'flex', gap: '8px', padding: '10px 16px 12px', marginBottom: '0' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'monospace', fontSize: '8px', color: theme.textMuted, letterSpacing: '0.8px', marginBottom: '4px' }}>COUNTRY</div>
                <input
                  type="text"
                  list="country-list"
                  value={deployedCountry}
                  onChange={e => setDeployedCountry(e.target.value)}
                  placeholder="All countries..."
                  style={{ width: '100%', padding: '7px 10px', backgroundColor: theme.surface, border: `0.5px solid ${theme.border}`, borderRadius: '6px', color: theme.textPrimary, fontFamily: 'monospace', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }}
                />
                <datalist id="country-list">
                  <option value="All" />
                  {allCountries.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'monospace', fontSize: '8px', color: theme.textMuted, letterSpacing: '0.8px', marginBottom: '4px' }}>GUN TYPE</div>
                <input
                  type="text"
                  list="role-list"
                  value={deployedRole}
                  onChange={e => setDeployedRole(e.target.value)}
                  placeholder="All types..."
                  style={{ width: '100%', padding: '7px 10px', backgroundColor: theme.surface, border: `0.5px solid ${theme.border}`, borderRadius: '6px', color: theme.textPrimary, fontFamily: 'monospace', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }}
                />
                <datalist id="role-list">
                  <option value="All" />
                  {ALL_ROLES.map(r => <option key={r} value={r} />)}
                </datalist>
              </div>
            </div>

            {/* Gantt chart — single unified scroll container */}
            <div style={{ paddingBottom: '40px' }}>
              <div style={{ overflowX: 'auto' }}>
                {/* Year ruler row — sticky vertically so dates stay visible when scrolling down */}
                <div style={{ display: 'flex', minWidth: TOTAL_WIDTH + NAME_COL_WIDTH, borderBottom: '0.5px solid ' + theme.border, position: 'sticky', top: 0, zIndex: 10, backgroundColor: theme.bg }}>
                  <div style={{ width: NAME_COL_WIDTH, flexShrink: 0, position: 'sticky', left: 0, backgroundColor: theme.bg, zIndex: 11 }} />
                  <div style={{ position: 'relative', width: TOTAL_WIDTH, height: '24px', flexShrink: 0 }}>
                    {decades.map((yr) => (
                      <div
                        key={yr}
                        style={{
                          position: 'absolute',
                          left: (yr - CHART_YEAR_START) * PX_PER_YEAR,
                          top: 0,
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                        }}
                      >
                        <div style={{ width: '1px', height: '6px', backgroundColor: theme.border }} />
                        <span style={{ fontSize: '8px', fontFamily: 'monospace', color: theme.textMuted, letterSpacing: '0.2px', paddingLeft: '2px', whiteSpace: 'nowrap' }}>
                          {yr}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weapon rows */}
                {filteredServiceWeapons.map((w) => {
                  const barLeft = (w.yearStart - CHART_YEAR_START) * PX_PER_YEAR;
                  const barEnd = (w.yearEnd ?? CHART_YEAR_END) - CHART_YEAR_START;
                  const barWidth = Math.max(barEnd * PX_PER_YEAR - barLeft, 4);
                  const color = roleColor[w.role];
                  return (
                    <div
                      key={w.id}
                      onClick={() => setSelectedWeapon(w)}
                      style={{ display: 'flex', alignItems: 'center', minWidth: TOTAL_WIDTH + NAME_COL_WIDTH, borderBottom: '0.5px solid ' + theme.border + '44', minHeight: ROW_HEIGHT + 'px', cursor: 'pointer' }}
                    >
                      {/* Sticky name column */}
                      <div style={{
                        width: NAME_COL_WIDTH,
                        flexShrink: 0,
                        position: 'sticky',
                        left: 0,
                        backgroundColor: theme.bg,
                        zIndex: 1,
                        padding: '0 8px',
                        display: 'flex',
                        alignItems: 'center',
                        borderRight: '0.5px solid ' + theme.border,
                        height: ROW_HEIGHT + 'px',
                      }}>
                        <span style={{ fontSize: '9px', fontFamily: 'monospace', color: theme.textSecondary, lineHeight: 1.3, letterSpacing: '0.2px' }}>
                          {w.name}
                        </span>
                      </div>
                      {/* Bar area */}
                      <div style={{ position: 'relative', width: TOTAL_WIDTH, height: ROW_HEIGHT + 'px', flexShrink: 0 }}>
                        {/* Decade grid lines */}
                        {decades.map((yr) => (
                          <div
                            key={yr}
                            style={{
                              position: 'absolute',
                              left: (yr - CHART_YEAR_START) * PX_PER_YEAR,
                              top: 0,
                              width: '1px',
                              height: '100%',
                              backgroundColor: theme.border + '44',
                            }}
                          />
                        ))}
                        {/* Bar */}
                        <div
                          title={`${w.name} (${w.yearStart}–${w.yearEnd ?? 'present'}) · ${w.caliber}`}
                          style={{
                            position: 'absolute',
                            left: barLeft,
                            top: '7px',
                            width: barWidth,
                            height: '14px',
                            backgroundColor: color,
                            borderRadius: '2px',
                            opacity: 0.85,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}

                {filteredServiceWeapons.length === 0 && (
                  <div style={{ padding: '32px 16px', textAlign: 'center', color: theme.textMuted, fontSize: '12px', fontFamily: 'monospace' }}>
                    No weapons match the selected filters.
                  </div>
                )}
              </div>

              {/* Role color legend */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 14px', padding: '14px 16px', borderTop: '0.5px solid ' + theme.border, marginTop: '8px' }}>
                {allRoles.map((r) => (
                  <div key={r} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '10px', height: '6px', borderRadius: '1px', backgroundColor: roleColor[r], flexShrink: 0 }} />
                    <span style={{ fontSize: '9px', fontFamily: 'monospace', color: theme.textMuted, letterSpacing: '0.3px' }}>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── WEAPON DETAIL BOTTOM SHEET ── */}
        {selectedWeapon && (
          <div
            onClick={() => setSelectedWeapon(null)}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxWidth: '480px', margin: '0 auto', backgroundColor: theme.surface, borderRadius: '12px 12px 0 0', padding: '20px 16px 32px', border: `0.5px solid ${theme.border}` }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: theme.textPrimary, fontFamily: 'monospace' }}>{selectedWeapon.name}</div>
                <button onClick={() => setSelectedWeapon(null)} style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '0 0 0 12px' }}>×</button>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, letterSpacing: '0.5px', marginBottom: '4px' }}>
                {selectedWeapon.role.toUpperCase()} · {selectedWeapon.caliber}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: theme.textMuted, marginBottom: '12px' }}>
                {selectedWeapon.countries.join(', ')} · {selectedWeapon.yearStart}–{selectedWeapon.yearEnd ?? 'present'}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.textSecondary, lineHeight: 1.7 }}>
                {selectedWeapon.story}
              </div>
            </div>
          </div>
        )}
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
