# Lindcott Survival — Product Roadmap

**Working title:** Lindcott Survival
**Brand:** Sibling app under the Lindcott Farms umbrella
**Status:** Pre-development — concept roadmap
**Origin:** Branched from Lindcott Armory Field Guide brainstorm (April 2026). Survivalist/preparedness content was deliberately kept out of the Armory to maintain its shooting-focused identity.

---

## Mission

A field-notebook-style reference and planning app for preparedness-minded individuals. Not a gun app. Covers the full spectrum of self-reliance: water, shelter, food, medical, communications, navigation, and security — in a calm, factual, non-alarmist tone.

---

## Target Audience

- Preparedness-minded households (not extreme survivalists)
- Hunters and outdoorsmen who spend extended time in the field
- Lindcott Armory users who want a companion app
- People in areas prone to natural disasters (hurricanes, earthquakes, wildfires, winter storms)

---

## Design Direction

- **Aesthetic:** Field notebook / topo map — earthy greens, khaki, weathered tan. Not tactical armory.
- **Tone:** Calm, factual, practical. "Here's what to do" — not doom-scrolling fuel.
- **Content density:** High — inspired by actual field manuals, but readable by a civilian
- **Offline-first:** All content bundled. Works with zero connectivity.
- **Checklists:** Interactive (checkable), exportable/printable
- **Cross-link:** Points to Lindcott Armory for firearms-specific content

---

## Tech Stack

- React PWA, Vite, TypeScript (same as Lindcott Armory)
- localStorage persistence
- Dark / Outdoor theme variants (same pattern)
- Eventually: shared profile data across both Lindcott apps (linked accounts)

---

## Phase 1 — Core Reference

The foundational content. Every other feature builds on these.

### Bug Out Bag Builder
- Interactive checklist organized by priority tier: Water → Shelter → Fire → Food → Medical → Navigation → Comms → Security → Tools
- Weight calculator (input item weights, see total load)
- 72-hour / 96-hour / 7-day configuration modes
- Per-person scaling (solo, couple, family with kids)
- Export as PDF checklist

### Bug-In Guide
- Home hardening basics (entry points, visibility, lighting)
- Utility shutoffs (gas, water, electric) — with diagrams
- Water storage: how much, what containers, rotation schedule
- Scenario planning: 72-hour outage vs. 30-day vs. extended
- Food storage overview (links to Phase 3 detail)
- Communications when grid is down

### Water Procurement & Purification
- Source identification: municipal, well, surface, rainwater, urban sources
- Purification methods with pros/cons:
  - Boiling (time, altitude adjustment)
  - Chemical treatment (iodine, sodium hypochlorite, tablets)
  - Filtration (ceramic, activated carbon, hollow-fiber)
  - UV treatment (SteriPen, solar SODIS method)
- Storage: container types, rotation, contamination prevention
- Needs calculation: 1 gallon/person/day baseline, more for heat/exertion/medical

### Fire Starting
- Methods ranked by reliability: lighter → matches → ferro rod → bow drill
- Friction fire fundamentals: bow drill, hand drill — species selection, technique
- Spark-based: ferro rod, flint and steel
- Chemical: fatwood, commercial fire starters
- Tinder identification by region (birch bark, dried grass, cattail fluff, char cloth)
- Fire types and uses: signal fire, cooking fire, warming fire, Dakota hole (low signature)
- Wind and weather management

### First Aid & Trauma (TCCC Basics)
- The Hartford Consensus / TECC framework: THREAT → Hemorrhage Control → Rapid Extrication → Assessment → Transport
- Tourniquet application (CAT, SOFTT-W) — step-by-step
- Wound packing with hemostatic gauze
- Chest seal application (sucking chest wound)
- Hypothermia recognition and treatment
- Burns: classification, cooling, covering
- Fractures: assessment, improvised splinting, traction splint basics
- Shock: recognition, positioning, management
- CPR reference (hands-only and full)

### Shelter Building
- Improvised vs. tarp vs. bivy vs. tent — when each is appropriate
- Lean-to: construction, orientation to wind
- Debris hut: insulation principles, construction time estimate
- Tarp configurations: A-frame, holochuk, plow point
- Cold weather: vapor barrier, insulation from ground, ventilation paradox
- Desert/heat: shade first, ground vs. elevated sleeping

---

## Phase 2 — Communications

### Radio Communications Guide
- FRS (Family Radio Service): no license, 22 channels, 2W max, short range
- GMRS (General Mobile Radio Service): license required, up to 50W, repeater access, longer range
- Ham radio: overview of Technician license path, HF/VHF/UHF capabilities
- CB radio: truckers' standby, no license, limited but useful
- Phonetic alphabet (NATO): Alpha through Zulu — reference table
- PACE planning: Primary / Alternate / Contingency / Emergency — framework for comms redundancy
- Channel/frequency planning for a group or family

### Signal & Navigation
- Topographic map reading: contour lines, scale, declination
- Compass use: magnetic vs. true north, declination adjustment, taking a bearing, triangulation
- Pace count: measuring distance on foot, how to calibrate yours
- Celestial navigation: Polaris for north, sun position approximation
- Improvised signals: signal mirror, ground-to-air signals, whistle patterns (3 = distress)
- Urban navigation without GPS: landmarks, street grids, sun position

### Comms Protocols
- SALUTE report: Size, Activity, Location, Unit, Time, Equipment
- SITREP format: Situation / Actions Taken / Future Actions / Requests
- Brevity: say what you need, confirm receipt, get off the air

---

## Phase 3 — Food & Sustenance

### Food Storage Calculator
- Caloric needs by person/day (sedentary vs. active vs. manual labor)
- Shelf life by food type: freeze-dried (25yr), canned (2-5yr), grains (10-30yr), MREs (5-7yr)
- Rotation planning: FIFO (first in, first out) system
- Nutritional balance: calories, protein, fat — not just calories
- Storage conditions: temperature, humidity, light, pests

### Foraging Basics
- **Disclaimer:** Regional variation is significant. This is general awareness, not a field guide.
- The Universal Edibility Test (US Army survival manual method)
- Plant families to avoid (Apiaceae/carrot family caution, Solanaceae)
- Common safe edibles by region: cattail, dandelion, purslane, wood sorrel, clover
- "When in doubt, don't" — caloric cost of foraging vs. risk of poisoning

### Field Cooking
- Fire-based: direct flame, coals, Dutch oven, foil packets
- Rocket stove design (fuel-efficient, low smoke)
- No-cook scenarios: soaking grains, ready-to-eat options
- Fuel types: wood, propane, butane, alcohol, solid fuel tabs
- Altitude adjustment for boiling/baking
- Water use in cooking: minimize and repurpose

### Nutrition in Extended Scenarios
- Macronutrient minimums under stress
- Vitamin deficiency timeline (scurvy, etc.) — extended scenarios only
- Foraging as supplement, not primary source

---

## Phase 4 — Field Skills

### Knots Library
Each knot: illustrated description, when to use it, how to tie it (step-by-step text), and common mistakes.

- **Bowline:** The king of knots. Makes a fixed loop that won't slip under load. Rescue, rigging, anchoring.
- **Clove Hitch:** Quick attachment to a post or rail. Not load-bearing alone — add a half hitch.
- **Prussik:** Friction hitch that grips a rope under load but slides when unloaded. Climbing, rope rescue.
- **Trucker's Hitch:** Mechanical advantage for lashing loads. 3:1 purchase with simple components.
- **Figure-8:** Stopper knot or climber's tie-in. Extremely strong, easy to inspect visually.
- **Sheet Bend:** Joining two ropes of different diameters. The only reliable way to do it.
- **Taut-Line Hitch:** Adjustable loop for tent guylines. Slides to adjust, locks under load.
- **Square Lashing:** Binding two poles at 90 degrees. Shelter construction, improvised stretchers.

### Land Navigation
- Topographic map orientation with compass
- Grid coordinates (MGRS basics)
- Terrain association: reading the land, not just the map
- Pace count calibration
- Dead reckoning over distance
- Handrail features: streams, ridgelines, roads as navigation aids
- Lost procedure: STOP (Stop, Think, Observe, Plan)

### Weather Reading
- Cloud types and forecasting value: cirrus (fair weather changing), cumulonimbus (storm incoming), stratus (overcast/rain)
- Pressure changes: falling = deteriorating weather, rising = improving
- Wind shifts and what they mean by region
- Temperature-dewpoint spread and fog prediction
- Red sky rules (old and mostly accurate)
- Mirage reading for wind (see also: Marksmanship Doctrine in Lindcott Armory)

### Camouflage of the World
- Military patterns: ERDL, Woodland BDU, MARPAT, MultiCam/OCP, Flecktarn, DPM, MTP, and others
- Hunting patterns: RealTree, Mossy Oak, and regional variants
- Filter by region (USA, Europe, Russia, Asia, Oceania) and type (military, hunting, law enforcement)
- Color swatch swatches + historical context for each pattern
- Cross-link: note that many of these appear on firearms and gear in Lindcott Armory
- *Note: Full camo dataset already developed in Lindcott Armory Field Guide (April 2026) — data can be ported directly*

### Wildlife Awareness
- Bear awareness: black vs. brown/grizzly response differences
- Big cat awareness (mountain lion/cougar)
- Venomous snakes by region (US focus): identification, bite response
- Insects: tick removal, bee/wasp/hornet response
- Making noise vs. moving quietly — context-dependent

---

## Phase 5 — Extended Medical

### Long-Term Wound Care
- Infection recognition: REEDA (Redness, Edema, Ecchymosis, Discharge, Approximation)
- Wound irrigation: technique, solutions
- Improvised dressings and when to change them
- Antibiotic considerations (general — not prescriptive)

### Improvised Medical Equipment
- Improvised tourniquet (last resort, not preferred)
- Improvised stretcher / litter
- Improvised splint materials
- Improvised crutch / mobility aid

### Dental Emergencies
- Lost filling: temporary filling materials (zinc oxide eugenol cement, dental wax, sugarless gum in extremis)
- Toothache management: clove oil, OTC options
- Loose tooth vs. avulsed tooth handling
- Abscess recognition (serious — fever, swelling, airway risk)

### Mental Health in Extended Crisis
- Stress inoculation: why training matters before the event
- Group dynamics under pressure: leadership, roles, conflict
- Children in crisis: age-appropriate communication
- Decision fatigue: why and how to mitigate it
- Normalcy bias: the tendency to underestimate the severity of a situation

---

## Phase 6 — Legal & Compliance (Light Touch)

> **Disclaimer approach:** Every screen in this section carries a clear disclaimer that this is general information only and users must consult legal counsel for their specific jurisdiction. This section exists to raise awareness, not provide legal advice.

### Firearms Transport (General)
- Cross-references to Lindcott Armory for detailed firearms content
- General federal framework only: unloaded, locked, inaccessible
- Amtrak / airline transport summary
- State-specific variation warning (link out, don't try to maintain state law tables)

### Self-Defense Law Concepts (General)
- Castle Doctrine concept (general)
- Stand Your Ground vs. Duty to Retreat (general framework, not state-by-state)
- Use of force continuum overview
- **Heavy disclaimer on every screen:** consult an attorney in your jurisdiction

---

## Future Ideas (Backlog)

- Offline maps integration (topo tiles cached locally)
- Group / family mode (shared checklists)
- Supply inventory tracker (rotate food, water, medical)
- Scenario-based walkthroughs ("72-hour hurricane" step-by-step)
- Community-sourced local resource maps
- Integration with Lindcott Armory: shared profile, cross-app navigation
- Printable field cards (wallet-sized reference)
- Apple Watch complication for quick reference

---

## Cross-App Integration Points (with Lindcott Armory)

| Survival Topic | Armory Connection |
|---|---|
| Security / Firearms | Link to Armory for gun management, ammo tracking |
| Marksmanship | Link to Armory Field Guide → Marksmanship Doctrine |
| Calibers & Ballistics | Link to Armory Field Guide → Cartridges, Ballistics |
| Weather reading | Survival covers atmosphere; Armory covers mirage/wind for shooting |
| TCCC | Survival goes deep; Armory Field Guide has a basic card |

---

*Roadmap created: April 2026*
*Status: Pre-development concept — no code written*
