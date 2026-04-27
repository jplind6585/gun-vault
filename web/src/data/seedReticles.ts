// src/data/seedReticles.ts
// Lindcott Armory — Reticle Reference Seed Data
// Admin-seeded reference table. No RLS. Service role writes only.
// Run once; version guard prevents duplicate inserts.

import { supabase } from '../lib/supabase';

export interface ReticleSeed {
  id: string;
  reticle_name: string;
  manufacturer: string | null;
  reticle_family: string;
  year_introduced: number | null;
  turret_unit_match: string;
  focal_plane_dependent: boolean;
  subtension_data: object | null;
  illuminated_capable: boolean;
  nv_compatible: boolean;
  cqb_capable: boolean;
  holdover_distances_yards: number[] | null;
  best_use_cases: string[];
  description: string;
  pros: string[];
  cons: string[];
  typical_optic_types: string[];
  patent_holder: string | null;
  diagram_url: string | null;
  example_optic_models: string[];
  notes: string | null;
}

export const RETICLE_SEED_DATA: ReticleSeed[] = [

  // ─────────────────────────────────────────────
  // DUPLEX & CROSSHAIR FAMILY
  // ─────────────────────────────────────────────

  {
    id: 'duplex',
    reticle_name: 'Duplex',
    manufacturer: null,
    reticle_family: 'Duplex',
    year_introduced: 1962,
    turret_unit_match: 'N/A',
    focal_plane_dependent: false,
    subtension_data: null,
    illuminated_capable: true,
    nv_compatible: false,
    cqb_capable: true,
    holdover_distances_yards: null,
    best_use_cases: ['hunting', 'general_purpose'],
    description: 'The duplex is the most widely used hunting reticle in the world. It features thick outer posts that taper to a fine center crosshair, drawing the eye naturally to the point of aim. Leupold popularized the design in 1962 and the patent has since expired, making it a standard pattern across virtually every scope manufacturer.\n\nThe thick-to-thin transition provides fast target acquisition in low light while the fine center section allows precise shot placement on game. There are no subtension markings — the reticle exists purely as an aiming point, not a ranging or holdover tool.\n\nThe duplex is the correct choice for hunters who want a clean, distraction-free view of the target. Its simplicity is a feature, not a limitation.',
    pros: [
      'Maximally clean sight picture',
      'Fast target acquisition in low light',
      'No learning curve',
      'Works on any magnification without subtension confusion',
    ],
    cons: [
      'No ranging capability',
      'No holdover marks for longer shots',
      'Not suited for precision long-range work',
    ],
    typical_optic_types: ['scope', 'lpvo'],
    patent_holder: null,
    diagram_url: null,
    example_optic_models: [
      'Leupold VX-3HD',
      'Vortex Crossfire II',
      'Zeiss Conquest V4',
      'Nightforce SHV',
    ],
    notes: null,
  },

  {
    id: 'german-4',
    reticle_name: 'German #4 (Post)',
    manufacturer: null,
    reticle_family: 'Duplex',
    year_introduced: 1900,
    turret_unit_match: 'N/A',
    focal_plane_dependent: false,
    subtension_data: null,
    illuminated_capable: true,
    nv_compatible: false,
    cqb_capable: true,
    holdover_distances_yards: null,
    best_use_cases: ['hunting', 'general_purpose'],
    description: 'The German #4 is the European hunting standard, featuring three fine posts (left, right, bottom) meeting at an open center with no top post. The design dates to the early 20th century and remains the dominant reticle pattern in German and Austrian hunting optics.\n\nThe open center allows unobstructed target acquisition at close range while the three posts provide precise aiming from the intersecting post tips. The absence of a top wire is intentional — it keeps the animal visible above the aiming point during the shot, which European hunters consider essential for accurate bullet placement on driven game.\n\nCommonly found on Zeiss, Swarovski, and Kahles hunting scopes, and on any scope marketed to European buyers.',
    pros: [
      'Excellent low-light visibility with thick posts',
      'Open top improves target visibility on driven game',
      'Clean and intuitive for hunters',
    ],
    cons: [
      'Less precise than fine crosshair at distance',
      'No ranging or holdover capability',
      'Less common in US market — some shooters find the open top disorienting',
    ],
    typical_optic_types: ['scope'],
    patent_holder: null,
    diagram_url: null,
    example_optic_models: [
      'Swarovski Z8i',
      'Zeiss Victory V8',
      'Kahles K525i (hunting variant)',
    ],
    notes: 'Also referred to as Number 4, Post, or Three-Post depending on manufacturer.',
  },

  {
    id: 'fine-crosshair',
    reticle_name: 'Fine Crosshair',
    manufacturer: null,
    reticle_family: 'Crosshair',
    year_introduced: 1850,
    turret_unit_match: 'N/A',
    focal_plane_dependent: false,
    subtension_data: null,
    illuminated_capable: true,
    nv_compatible: false,
    cqb_capable: false,
    holdover_distances_yards: null,
    best_use_cases: ['precision_rifle', 'competition', 'long_range'],
    description: 'The fine crosshair is the oldest production reticle pattern, consisting of two uniformly thin wires running the full width and height of the field of view. Benchrest shooters and F-Class competitors favor it for the unobstructed view of the target and the precision of the thin intersection point.\n\nBecause the wires are uniform thickness from edge to center, there is no visual "draw" to the center — the shooter must consciously center the intersection on the target. This is actually preferred in benchrest shooting, where the target is stationary and the shooter has time to perfectly center the intersection on the aiming point.\n\nThe fine crosshair is poorly suited for low light, moving targets, or fast acquisition. Its home is the bench.',
    pros: [
      'Maximum precision at the aiming point',
      'Minimal target obstruction',
      'Preferred for benchrest and F-Class',
    ],
    cons: [
      'Difficult to see in low light',
      'Slow acquisition on moving targets',
      'Easy to lose the crosshair against complex backgrounds',
    ],
    typical_optic_types: ['scope'],
    patent_holder: null,
    diagram_url: null,
    example_optic_models: [
      'March F-Class',
      'Nightforce Competition',
      'Sightron SIIIss',
    ],
    notes: null,
  },

  // ─────────────────────────────────────────────
  // MIL / MRAD FAMILY
  // ─────────────────────────────────────────────

  {
    id: 'mil-dot',
    reticle_name: 'Mil-Dot',
    manufacturer: null,
    reticle_family: 'MIL',
    year_introduced: 1979,
    turret_unit_match: 'MRAD',
    focal_plane_dependent: true,
    subtension_data: {
      unit: 'MRAD',
      at_magnification: null,
      dot_diameter_mrad: 0.25,
      dot_spacing_mrad: 1.0,
      center_to_center_mrad: 1.0,
      wind_dots: false,
      christmas_tree: false,
      notes: 'Subtensions valid at any magnification on FFP. On SFP, subtensions only accurate at the magnification specified by the manufacturer — typically max power.',
    },
    illuminated_capable: true,
    nv_compatible: false,
    cqb_capable: false,
    holdover_distances_yards: null,
    best_use_cases: ['precision_rifle', 'tactical', 'long_range', 'military'],
    description: 'The Mil-Dot was developed by the US Marine Corps in the late 1970s as a ranging and holdover system for sniper rifles. It consists of a standard duplex-style crosshair with evenly spaced elliptical dots — one milliradian apart, center to center — along both axes.\n\nThe original purpose was range estimation: a target of known size subtends a predictable number of mils at a given distance, allowing the shooter to calculate range without a laser. The same dots serve as holdover and wind correction references once range is known.\n\nThe Mil-Dot established the MRAD system as the military and precision rifle standard. Modern MIL reticles have evolved significantly — the original four-dot pattern is now considered entry-level — but the Mil-Dot remains in production and is the reference point from which all subsequent MIL reticles are derived.',
    pros: [
      'Established military and LE standard',
      'Universal — any shooter trained on MIL can use any MIL scope',
      'Ranging capability with known-size targets',
      'Extensive training materials and reference data available',
    ],
    cons: [
      'Only 4 dots per quadrant — limited holdover precision vs. modern MIL grids',
      'Ranging math requires practice',
      'SFP versions require knowing which magnification to use for accurate subtensions',
    ],
    typical_optic_types: ['scope', 'lpvo'],
    patent_holder: null,
    diagram_url: null,
    example_optic_models: [
      'Leupold Mark 4',
      'US Optics SR-8',
      'Bushnell Elite Tactical',
    ],
    notes: 'The original USMC specification used elliptical dots, not round. Many current "Mil-Dot" reticles use round dots — technically a deviation from the original spec but functionally identical.',
  },

  {
    id: 'tmr',
    reticle_name: 'TMR (Tactical Milling Reticle)',
    manufacturer: 'Leupold',
    reticle_family: 'MIL',
    year_introduced: 2004,
    turret_unit_match: 'MRAD',
    focal_plane_dependent: true,
    subtension_data: {
      unit: 'MRAD',
      at_magnification: null,
      hash_spacing_mrad: 1.0,
      half_hash_spacing_mrad: 0.5,
      wind_dots: false,
      christmas_tree: false,
      notes: 'Hash marks at 1 MRAD intervals with 0.5 MRAD half-hashes. More precise holdover reference than standard Mil-Dot. Subtensions accurate on FFP at any magnification.',
    },
    illuminated_capable: true,
    nv_compatible: false,
    cqb_capable: false,
    holdover_distances_yards: null,
    best_use_cases: ['precision_rifle', 'tactical', 'long_range', 'competition'],
    description: 'Leupold developed the TMR for military and law enforcement applications, replacing the dot-based Mil-Dot with a cleaner hash mark system. The crosshair features 1 MRAD hash marks with 0.5 MRAD half-hashes on both axes, providing more precise holdover and wind correction references than the original four-dot pattern.\n\nThe hash design is visually cleaner than dots — the marks interrupt the wire without creating the visual "bead" of a mil-dot, which some shooters find distracting. The TMR became a standard for US military sniper scopes and influenced the hash-based MIL reticle designs that followed from other manufacturers.\n\nUsed in the Leupold Mark 4 and Mark 6 series scopes that saw extensive US military and SOF service.',
    pros: [
      'Cleaner than Mil-Dot — hashes less visually busy than dots',
      '0.5 MRAD half-hashes double holdover precision vs standard Mil-Dot',
      'Military pedigree with extensive real-world validation',
      'Pairs well with Leupold dial-based elevation systems',
    ],
    cons: [
      'Leupold proprietary — fewer scope options than generic MIL patterns',
      'No wind dots for rapid wind hold reference',
      'Christmas tree absent — no below-zero holdover array',
    ],
    typical_optic_types: ['scope'],
    patent_holder: 'Leupold & Stevens',
    diagram_url: null,
    example_optic_models: [
      'Leupold Mark 4 3.5-10x40',
      'Leupold Mark 6 3-18x44',
      'Leupold Mark 8 3.5-25x56',
    ],
    notes: null,
  },

  {
    id: 'mrad-grid',
    reticle_name: 'MRAD Grid',
    manufacturer: null,
    reticle_family: 'MIL',
    year_introduced: 2005,
    turret_unit_match: 'MRAD',
    focal_plane_dependent: true,
    subtension_data: {
      unit: 'MRAD',
      at_magnification: null,
      hash_spacing_mrad: 1.0,
      half_hash_spacing_mrad: 0.5,
      wind_dots: true,
      christmas_tree: true,
      notes: 'Full grid below center provides a dense array of holdover and wind references. 1 MRAD primary grid with 0.5 MRAD intermediate marks. Subtensions accurate on FFP at any magnification.',
    },
    illuminated_capable: true,
    nv_compatible: false,
    cqb_capable: false,
    holdover_distances_yards: null,
    best_use_cases: ['precision_rifle', 'long_range', 'competition'],
    description: 'The MRAD Grid represents the evolution of the Mil-Dot concept into a full measurement system. Rather than a simple crosshair with dots or hashes, a grid reticle provides a dense array of subtension marks in all four quadrants — but particularly below center, where elevation holdovers live.\n\nModern competition reticles in this family include wind dots at the 5 MRAD lateral positions, a full Christmas tree array below zero for holdovers beyond the dial range, and 0.5 MRAD intermediate marks throughout. The result is a reticle that lets a shooter hold for virtually any wind and elevation condition without touching the turrets.\n\nThis is the dominant reticle pattern in PRS and NRL competition. The complexity requires training — a shooter who hasn't internalized MRAD arithmetic will be slower with this reticle than with a simple duplex.',
    pros: [
      'Comprehensive holdover and wind reference without touching turrets',
      'Dominant in PRS/NRL competition',
      'Pairs precisely with MRAD turrets',
      'Christmas tree enables extreme long-range holds',
    ],
    cons: [
      'High complexity — requires training to use effectively',
      'Visually busy at lower magnifications',
      'Not suited for hunting or CQB',
      'SFP versions are nearly useless for precision work',
    ],
    typical_optic_types: ['scope'],
    patent_holder: null,
    diagram_url: null,
    example_optic_models: [
      'Vortex Razor HD Gen III (EBR-7D)',
      'Nightforce ATACR (Tremor3)',
      'Kahles K525i (SKMR4)',
      'Schmidt & Bender PMII (MTC / MTC+)',
    ],
    notes: 'Generic term covering several manufacturer-specific implementations. The underlying pattern is similar; hash density and Christmas tree depth vary by model.',
  },

  {
    id: 'ebr-2c',
    reticle_name: 'EBR-2C',
    manufacturer: 'Vortex',
    reticle_family: 'MIL',
    year_introduced: 2012,
    turret_unit_match: 'MRAD',
    focal_plane_dependent: true,
    subtension_data: {
      unit: 'MRAD',
      at_magnification: null,
      hash_spacing_mrad: 1.0,
      half_hash_spacing_mrad: 0.5,
      wind_dots: true,
      christmas_tree: false,
      notes: 'Wind dots at 5 MRAD and 10 MRAD lateral positions. 0.5 MRAD intermediate hashes on crosshair arms. No Christmas tree array below center.',
    },
    illuminated_capable: true,
    nv_compatible: false,
    cqb_capable: false,
    holdover_distances_yards: null,
    best_use_cases: ['precision_rifle', 'tactical', 'long_range', 'competition'],
    description: 'Vortex developed the EBR-2C as a practical MIL reticle balancing measurement precision with visual cleanliness. The crosshair features 0.5 MRAD hashes on all four arms, wind reference dots at 5 and 10 MRAD, and a clean center section that does not obscure small targets at long range.\n\nCompared to a full MRAD grid, the EBR-2C is less complex — there is no Christmas tree below center, and the wind dot system provides quick lateral reference without a full grid. This makes it faster to read in competition stages while still providing useful holdover and wind data.\n\nVortex ships the EBR-2C in the Razor HD Gen II and Gen III in both FFP and SFP configurations. The FFP version is suitable for PRS work; the SFP version is positioned as a tactical and general purpose option.',
    pros: [
      'Balance of precision and visual cleanliness',
      'Wind dots provide fast lateral reference',
      'Less overwhelming than full grid for new precision rifle shooters',
      'Widely available in a range of Vortex platforms',
    ],
    cons: [
      'No Christmas tree — limits dial-free holdover range',
      'Wind dots at 5 and 10 only — coarser than wind hash systems',
    ],
    typical_optic_types: ['scope', 'lpvo'],
    patent_holder: 'Vortex Optics',
    diagram_url: null,
    example_optic_models: [
      'Vortex Razor HD Gen II 4.5-27x56',
      'Vortex Razor HD Gen II-E 3-18x50',
    ],
    notes: null,
  },

  {
    id: 'tremor3',
    reticle_name: 'Tremor3',
    manufacturer: 'Nightforce',
    reticle_family: 'MIL',
    year_introduced: 2012,
    turret_unit_match: 'MRAD',
    focal_plane_dependent: true,
    subtension_data: {
      unit: 'MRAD',
      at_magnification: null,
      hash_spacing_mrad: 1.0,
      half_hash_spacing_mrad: 0.5,
      wind_dots: true,
      christmas_tree: true,
      ranging_horseshoe: true,
      notes: 'Features wind leads for moving targets, a ranging horseshoe at the top for vehicle/person estimation, a full Christmas tree below center, and a Spotter Compensation System (SCS) for marking spotter calls. One of the most information-dense reticles in production.',
    },
    illuminated_capable: true,
    nv_compatible: true,
    cqb_capable: false,
    holdover_distances_yards: null,
    best_use_cases: ['precision_rifle', 'long_range', 'tactical'],
    description: 'The Tremor3 is the most information-dense production reticle currently available. Developed for military and long-range tactical applications, it incorporates standard MIL grid holdover references, a Christmas tree below center, wind leads for moving targets, a ranging horseshoe for vehicle and person size estimation, and Nightforce\'s Spotter Compensation System — a feature that lets a shooter mark the spotter\'s observed trace or impact and apply a correction hold.\n\nAt maximum magnification, the Tremor3 fills the field of view with reference data. This is a purposeful design choice for precision shooting where conditions vary dramatically and the shooter needs to make multiple corrections quickly without taking their eye off the target.\n\nThe Tremor3 is not a competition reticle — its home is long-range tactical and military precision work. For PRS shooters, a cleaner MRAD grid is usually more practical. For ELR and military application, the Tremor3\'s additional features earn their complexity.',
    pros: [
      'Most comprehensive reference data of any production reticle',
      'Moving target wind leads unique to this pattern',
      'Ranging horseshoe speeds target size estimation',
      'NV-compatible illumination',
    ],
    cons: [
      'Extremely complex — significant training investment required',
      'Overkill for most civilian long-range shooting',
      'Only available in Nightforce ATACR and a few other NF models',
      'Premium price attached to scopes that carry it',
    ],
    typical_optic_types: ['scope'],
    patent_holder: 'Nightforce Optics',
    diagram_url: null,
    example_optic_models: [
      'Nightforce ATACR 5-25x56',
      'Nightforce ATACR 7-35x56',
    ],
    notes: 'Tremor3 replaced the earlier Tremor and Tremor2 patterns. The Tremor2 is still found on older NF scopes.',
  },

  {
    id: 'horus-h59',
    reticle_name: 'H59',
    manufacturer: 'Horus Vision',
    reticle_family: 'MIL',
    year_introduced: 2003,
    turret_unit_match: 'MRAD',
    focal_plane_dependent: true,
    subtension_data: {
      unit: 'MRAD',
      at_magnification: null,
      hash_spacing_mrad: 1.0,
      half_hash_spacing_mrad: 0.5,
      wind_dots: true,
      christmas_tree: true,
      full_grid: true,
      notes: 'Full grid pattern covering the entire field of view with 0.5 MRAD spacing. Designed to work with Horus\'s ATRAG ballistic software — the shooter dials nothing, holds everything from the grid.',
    },
    illuminated_capable: true,
    nv_compatible: false,
    cqb_capable: false,
    holdover_distances_yards: null,
    best_use_cases: ['precision_rifle', 'long_range', 'tactical'],
    description: 'The H59 is Horus Vision\'s defining product — a full-field MIL grid that covers the entire field of view with 0.5 MRAD hash marks in all directions. The design philosophy is the opposite of a simple duplex: rather than minimizing visual information, the H59 maximizes it, giving the shooter a comprehensive reference grid for any hold in any direction.\n\nHorus intended the H59 to work in conjunction with their ATRAG ballistic computer software. The shooter inputs environmental data, receives a firing solution expressed as a grid hold (e.g., "hold 4.5 up, 2 right"), and applies that hold directly from the grid without touching turrets. This dial-nothing approach proved influential and predates the widespread adoption of Christmas tree reticles in the competition market.\n\nThe H59 requires significant practice to use fluidly. Shooters who have not internalized the grid find the field of view overwhelmingly busy.',
    pros: [
      'Complete holdover reference in any direction',
      'Dial-nothing approach reduces time per shot in competition',
      'Pioneered the modern holdover-focused reticle philosophy',
    ],
    cons: [
      'Among the most visually complex reticles available',
      'Steep learning curve',
      'Requires external ballistic software to use as intended',
    ],
    typical_optic_types: ['scope'],
    patent_holder: 'Horus Vision',
    diagram_url: null,
    example_optic_models: [
      'US Optics SR-8 (H59)',
      'Steiner Military 5-25x56 (H59)',
      'Premier Reticles',
    ],
    notes: 'Horus licenses the H59 to multiple manufacturers. Several current production scopes from Steiner and US Optics carry it.',
  },

  {
    id: 'skmr4',
    reticle_name: 'SKMR4',
    manufacturer: 'Kahles',
    reticle_family: 'MIL',
    year_introduced: 2018,
    turret_unit_match: 'MRAD',
    focal_plane_dependent: true,
    subtension_data: {
      unit: 'MRAD',
      at_magnification: null,
      hash_spacing_mrad: 1.0,
      half_hash_spacing_mrad: 0.5,
      wind_dots: true,
      christmas_tree: true,
      notes: 'Asymmetric design — full Christmas tree on the lower left quadrant only. Wind reference marks on the horizontal arm. The asymmetric layout reduces visual clutter in the right side of the field of view while preserving full holdover data where it is most used.',
    },
    illuminated_capable: true,
    nv_compatible: false,
    cqb_capable: false,
    holdover_distances_yards: null,
    best_use_cases: ['precision_rifle', 'long_range', 'competition'],
    description: 'Kahles developed the SKMR4 as the competition reticle for the K525i — their flagship precision rifle scope — in response to direct feedback from PRS shooters. The defining feature is its asymmetric layout: the Christmas tree holdover array appears in the lower left quadrant only, rather than symmetrically below center.\n\nThe rationale is practical. Most shooters, when looking at a target, naturally favor the right side of the reticle for target identification. By placing the dense holdover grid to the lower left, Kahles keeps the right side of the field of view clean and uncluttered. The shooter still has full holdover data available; it is simply organized to minimize obstruction of the primary target area.\n\nThe SKMR4 has been well-received in European and American PRS competition and represents a thoughtful departure from the symmetrical grid patterns that dominate the market.',
    pros: [
      'Asymmetric layout reduces target-side clutter',
      'Full holdover data without the symmetrical grid pattern',
      'Excellent execution on a premium optical platform',
    ],
    cons: [
      'Takes adjustment for shooters accustomed to symmetric grids',
      'Only available on Kahles scopes',
    ],
    typical_optic_types: ['scope'],
    patent_holder: 'Kahles',
    diagram_url: null,
    example_optic_models: [
      'Kahles K525i 5-25x56',
    ],
    notes: 'Earlier SKMR and SKMR3 variants exist on older Kahles models. The SKMR4 is the current production version.',
  },

  {
    id: 'sb-msr',
    reticle_name: 'MSR (Military Subtension Reticle)',
    manufacturer: 'Schmidt & Bender',
    reticle_family: 'MIL',
    year_introduced: 2005,
    turret_unit_match: 'MRAD',
    focal_plane_dependent: true,
    subtension_data: {
      unit: 'MRAD',
      at_magnification: null,
      hash_spacing_mrad: 1.0,
      half_hash_spacing_mrad: 0.5,
      wind_dots: false,
      christmas_tree: false,
      notes: 'Schmidt & Bender\'s core military reticle. 1 MRAD primary marks with 0.5 MRAD intermediate marks on all four arms. Clean and precise without grid complexity.',
    },
    illuminated_capable: true,
    nv_compatible: true,
    cqb_capable: false,
    holdover_distances_yards: null,
    best_use_cases: ['precision_rifle', 'long_range', 'tactical'],
    description: 'Schmidt & Bender\'s MSR is the foundation of their military and sniper scope reticle lineup. It appears in the PMII series — the scope that has been the US Army\'s M2010 ESR and the British Army\'s L115A3 standard optic for over a decade.\n\nThe MSR is precise and understated: 1 MRAD primary hash marks and 0.5 MRAD intermediate marks on all four arms, with no Christmas tree and no wind dots. It pairs with S&B\'s double-turn turret system, which incorporates a revolution indicator directly into the elevation dial. The philosophy is that the turret handles elevation and the shooter uses wind holds from the crosshair arms — a different workflow than dial-nothing grid systems.\n\nThe MSR\'s NV-compatible illumination and proven military service record make it the reference reticle for serious precision rifle work, particularly in military and law enforcement contexts where the dial system is preferred.',
    pros: [
      'Military-proven on major NATO sniper systems',
      'NV-compatible illumination',
      'Clean layout pairs well with double-turn turret systems',
      'Exceptional optical quality platform',
    ],
    cons: [
      'No Christmas tree — limited dial-free holdover range',
      'S&B premium pricing',
    ],
    typical_optic_types: ['scope'],
    patent_holder: 'Schmidt & Bender',
    diagram_url: null,
    example_optic_models: [
      'Schmidt & Bender PMII 5-25x56',
      'Schmidt & Bender PMII 3-27x56',
    ],
    notes: 'S&B also produces the MTC (Mil Turret Clicker) and MTC+ variants with additional holdover marks for specific military requirements.',
  },

  // ─────────────────────────────────────────────
  // MOA FAMILY
  // ─────────────────────────────────────────────

  {
    id: 'moa-grid',
    reticle_name: 'MOA Grid',
    manufacturer: null,
    reticle_family: 'MOA',
    year_introduced: 2000,
    turret_unit_match: 'MOA',
    focal_plane_dependent: true,
    subtension_data: {
      unit: 'MOA',
      at_magnification: null,
      hash_spacing_moa: 2.0,
      half_hash_spacing_moa: 1.0,
      wind_dots: true,
      christmas_tree: true,
      notes: 'Typically 2 MOA primary marks with 1 MOA intermediate marks. Christmas tree below center for long-range holdovers. MOA grid is less common than MRAD in precision rifle competition but preferred by shooters who work in MOA.',
    },
    illuminated_capable: true,
    nv_compatible: false,
    cqb_capable: false,
    holdover_distances_yards: null,
    best_use_cases: ['precision_rifle', 'long_range', 'competition'],
    description: 'The MOA Grid is the MOA-unit equivalent of the MRAD Grid — a comprehensive holdover and wind reference system using minute of angle as the measurement unit. Structurally it follows the same philosophy as MIL grid reticles, with hash marks below center for elevation holdovers and lateral marks for wind correction.\n\nMOA grids are less prevalent in the precision rifle competition market, which has largely standardized on MRAD. However, they remain preferred by shooters who think and work in MOA — typically hunters and precision rifle shooters trained on older American equipment that used MOA turrets before the MRAD transition.\n\nThe key practical difference from an MRAD grid is arithmetic: MOA corrections are calculated in roughly 1-inch-per-100-yards increments, while MRAD corrections use the factor-of-ten metric system. Neither is more or less accurate; they simply require different mental math.',
    pros: [
      'Familiar for shooters trained on MOA turret systems',
      'Comprehensive holdover data same as MRAD grid',
      'Preferred in some hunter/long-range hunting contexts',
    ],
    cons: [
      'Less common than MRAD in precision rifle competition',
      'MOA arithmetic is less intuitive than MRAD metric system for many shooters',
    ],
    typical_optic_types: ['scope'],
    patent_holder: null,
    diagram_url: null,
    example_optic_models: [
      'Nightforce NXS (MIL-R)',
      'Leupold Mark 5HD (TMR or similar MOA)',
    ],
    notes: null,
  },

  // ─────────────────────────────────────────────
  // BDC FAMILY
  // ─────────────────────────────────────────────

  {
    id: 'bdc-generic',
    reticle_name: 'BDC (Ballistic Drop Compensator)',
    manufacturer: null,
    reticle_family: 'BDC',
    year_introduced: 1990,
    turret_unit_match: 'N/A',
    focal_plane_dependent: true,
    subtension_data: {
      unit: 'none',
      at_magnification: 'varies by model',
      holdover_marks: true,
      notes: 'Holdover marks calibrated for a specific cartridge and load at specific distances. Marks are not unit-based — they represent distance-specific hold points, not a measurable subtension. Only accurate at specified magnification on SFP scopes.',
    },
    illuminated_capable: true,
    nv_compatible: false,
    cqb_capable: true,
    holdover_distances_yards: [200, 300, 400, 500],
    best_use_cases: ['hunting', 'general_purpose'],
    description: 'BDC reticles replace unit-based holdover marks with distance-specific aiming points calibrated for a particular cartridge and load. A BDC for .308 Win with 168gr Federal GM at sea level will have marks at 200, 300, 400, and 500 yards that correspond to the actual bullet drop at those distances — no math required.\n\nThe appeal is simplicity. A hunter zeroed at 100 yards can hold the 300-yard mark on a deer at 300 yards without calculating drop. For the intended cartridge under standard conditions, this is practical and fast.\n\nThe limitation is specificity. A BDC optimized for .308 Win at 2,650 fps from sea level does not accurately represent .308 Win performance at 6,000 feet elevation, or 6.5 Creedmoor performance at any altitude. The marks become wrong as conditions deviate from the design spec. Shooters frequently misuse BDC reticles by assuming any similar cartridge will match the calibration.',
    pros: [
      'No holdover math required at designated distances',
      'Fast acquisition for hunting at known distances',
      'Low learning curve',
    ],
    cons: [
      'Only accurate for the specific cartridge and conditions it was designed for',
      'Useless or actively misleading with a different load',
      'SFP versions require specific magnification for accuracy',
      'Cannot be adapted to new cartridges without a new optic',
    ],
    typical_optic_types: ['scope', 'lpvo'],
    patent_holder: null,
    diagram_url: null,
    example_optic_models: [
      'Nikon BDC series',
      'Vortex Deadhold BDC',
      'Bushnell DOA',
    ],
    notes: 'Always verify which cartridge, velocity, and altitude assumptions a BDC was designed for before field use.',
  },

  {
    id: 'ballistic-plex',
    reticle_name: 'Ballistic Plex',
    manufacturer: 'Burris',
    reticle_family: 'BDC',
    year_introduced: 1999,
    turret_unit_match: 'N/A',
    focal_plane_dependent: true,
    subtension_data: {
      unit: 'none',
      holdover_marks: true,
      notes: 'Duplex-style reticle with additional fine hash marks below center on the vertical post. Marks calibrated for .30 caliber cartridges at 100 yard zero. Subtle design keeps the clean look of a duplex while adding distance reference.',
    },
    illuminated_capable: true,
    nv_compatible: false,
    cqb_capable: true,
    holdover_distances_yards: [200, 300, 400, 500],
    best_use_cases: ['hunting', 'general_purpose'],
    description: 'Burris introduced the Ballistic Plex as an accessible entry point into holdover reticles for hunters. The design preserves the visual simplicity of a standard duplex — heavy outer posts tapering to a fine center — while adding subtle tick marks below center for 200 through 500 yard holdovers.\n\nThe understated approach distinguishes the Ballistic Plex from more aggressive BDC designs. At a glance it reads as a clean hunting reticle; the holdover marks are there when needed but do not dominate the field of view. Calibrated primarily for .30-caliber cartridges at common hunting velocities.\n\nThe Ballistic Plex was influential in demonstrating that BDC functionality did not require a visually complex reticle and helped establish the category of "holdover-capable hunting reticle" as a standard offering.',
    pros: [
      'Minimal visual complexity for a holdover reticle',
      'Familiar duplex feel with added utility',
      'Well-suited for deer hunting at extended ranges',
    ],
    cons: [
      'Calibrated for .30-caliber — limited accuracy with other cartridges',
      'No unit markings — cannot be used for unknown-distance ranging',
    ],
    typical_optic_types: ['scope'],
    patent_holder: 'Burris Company',
    diagram_url: null,
    example_optic_models: [
      'Burris Fullfield II',
      'Burris Signature HD',
    ],
    notes: 'Burris has produced multiple Ballistic Plex variants (E1, E2) calibrated for different cartridge families.',
  },

  // ─────────────────────────────────────────────
  // DOT / ILLUMINATED FAMILY
  // ─────────────────────────────────────────────

  {
    id: 'dot-2moa',
    reticle_name: 'Single Dot (2 MOA)',
    manufacturer: null,
    reticle_family: 'Dot',
    year_introduced: 1975,
    turret_unit_match: 'N/A',
    focal_plane_dependent: false,
    subtension_data: {
      unit: 'MOA',
      dot_size_moa: 2,
      notes: '2 MOA is the standard red dot size for most duty and competition applications. Dot subtends approximately 2 inches at 100 yards. 1 MOA variants available for precision work; 4-6 MOA variants for CQB and shotgun.',
    },
    illuminated_capable: true,
    nv_compatible: true,
    cqb_capable: true,
    holdover_distances_yards: null,
    best_use_cases: ['close_quarters', 'competition', 'tactical', 'general_purpose'],
    description: 'The single illuminated dot is the simplest and most widely used red dot reticle. A single illuminated aiming point — typically 2 MOA in diameter for duty and competition use — projected onto the lens. No magnification, parallax-free (or nearly so) at typical engagement distances, and fast to acquire under stress.\n\nThe 2 MOA standard emerged from competition shooting and military testing as the balance point between precision (small enough to aim accurately at distance) and acquisition speed (large enough to find immediately under stress). Smaller dots (1 MOA) favor precision; larger dots (4–6 MOA) favor speed at close range.\n\nVirtually every major red dot manufacturer offers a 2 MOA dot as their primary option. The pattern itself is generic — what differentiates products is emitter quality, dot crispness, battery life, and durability.',
    pros: [
      'Fastest possible target acquisition',
      'Both-eyes-open shooting natural',
      'No complexity — one aiming point',
      'NV-compatible in most current models',
      'Works at any engagement distance',
    ],
    cons: [
      'No ranging or holdover capability',
      'Dot can wash out in bright sunlight on lower-quality optics',
      'Limited precision beyond 200 yards',
    ],
    typical_optic_types: ['red_dot'],
    patent_holder: null,
    diagram_url: null,
    example_optic_models: [
      'Aimpoint CompM5',
      'Trijicon MRO',
      'Leupold DeltaPoint Pro',
      'Holosun 510C',
    ],
    notes: 'Dot size is measured at standard brightness. Dot size appears to increase at high brightness settings due to emitter bloom.',
  },

  {
    id: 'horseshoe-dot',
    reticle_name: 'Horseshoe Dot',
    manufacturer: null,
    reticle_family: 'Dot',
    year_introduced: 2010,
    turret_unit_match: 'N/A',
    focal_plane_dependent: false,
    subtension_data: {
      unit: 'MOA',
      horseshoe_size_moa: 65,
      center_dot_moa: 1,
      notes: 'Large outer horseshoe (typically 65 MOA) for rapid close-range acquisition. Fine center dot (typically 1-2 MOA) for precise aiming. The horseshoe draws the eye to center even with peripheral vision at close range.',
    },
    illuminated_capable: true,
    nv_compatible: true,
    cqb_capable: true,
    holdover_distances_yards: null,
    best_use_cases: ['close_quarters', 'competition', 'tactical', 'general_purpose'],
    description: 'The horseshoe dot pairs a large open circle (typically 65 MOA) with a fine center dot, providing the best of both close-range and precision aiming in a single reticle. At close range the large horseshoe is acquired instantly with both eyes open; at distance the fine center dot provides the precision needed for accurate shot placement.\n\nThe pattern became popular in USPSA competition, where stages often mix close-range steel and paper targets requiring fast acquisition with distant targets requiring precision. Holosun popularized the horseshoe in the consumer market with their multi-reticle red dot systems, which allow the shooter to select between a dot-only, horseshoe-only, or combined horseshoe-and-dot configuration.\n\nThe horseshoe is also effective for shotgun applications where the large outer ring aligns naturally with typical shotgun pattern spreads at close range.',
    pros: [
      'Combines fast acquisition with precision capability',
      'Large horseshoe visible with peripheral vision at CQB distances',
      'Natural fit for multi-distance competition stages',
      'Effective on shotguns',
    ],
    cons: [
      'More visual information than a single dot — minor cognitive load increase',
      'Large horseshoe can obscure small targets at distance',
    ],
    typical_optic_types: ['red_dot', 'holographic'],
    patent_holder: null,
    diagram_url: null,
    example_optic_models: [
      'Holosun 510C',
      'Holosun 507C',
      'Holosun HS512C',
    ],
    notes: null,
  },

  {
    id: 'eotech-segmented',
    reticle_name: 'Segmented Circle with Dot (EOTech)',
    manufacturer: 'EOTech',
    reticle_family: 'Illuminated',
    year_introduced: 1996,
    turret_unit_match: 'N/A',
    focal_plane_dependent: false,
    subtension_data: {
      unit: 'MOA',
      circle_size_moa: 65,
      center_dot_moa: 1,
      segments: 4,
      notes: '65 MOA outer ring broken into four segments with a 1 MOA center dot. The segmented ring is unique to EOTech and results from the holographic projection method — the diffraction grating produces a naturally segmented pattern.',
    },
    illuminated_capable: true,
    nv_compatible: true,
    cqb_capable: true,
    holdover_distances_yards: null,
    best_use_cases: ['close_quarters', 'tactical', 'competition'],
    description: 'The EOTech segmented circle is the defining reticle of the holographic weapon sight category. Unlike red dot emitters that project a reflected dot, holographic sights use a laser to illuminate a diffraction grating — resulting in the distinctive segmented circle that appears to float in three-dimensional space at the target rather than on the glass.\n\nThe 65 MOA outer ring with a 1 MOA center dot provides the same fast-acquisition / precision pairing as the horseshoe dot, but the holographic projection gives it unique properties: the reticle remains accurate even if the sight glass is partially obscured by dirt, water, or damage, because the laser samples the whole grating rather than a single emitter point.\n\nEOTech HOLOSights are US Special Operations standard issue and have extensive real-world validation in combat. The EXPS3 is the current production variant with NV-compatible illumination and a co-witness footprint for backup irons.',
    pros: [
      'Holographic projection works with partially obscured glass',
      'NV-compatible',
      'Extremely fast acquisition at CQB distances',
      'US SOF standard — extensively combat-proven',
      '1 MOA center dot for precision shots',
    ],
    cons: [
      'Battery life shorter than comparable LED red dots',
      'Larger and heavier than most red dots',
      'Premium price point',
      'Thermal zero shift in extreme temperatures (addressed in newer models)',
    ],
    typical_optic_types: ['holographic'],
    patent_holder: 'EOTech (L3 Technologies)',
    diagram_url: null,
    example_optic_models: [
      'EOTech EXPS3',
      'EOTech 512',
      'EOTech XPS2',
    ],
    notes: 'EOTech settled with the US government in 2015 over undisclosed thermal zero shift issues. Current production models have addressed this. The underlying reticle design was unaffected.',
  },

  // ─────────────────────────────────────────────
  // HYBRID / TACTICAL
  // ─────────────────────────────────────────────

  {
    id: 'acss',
    reticle_name: 'ACSS (Advanced Combined Sighting System)',
    manufacturer: 'Primary Arms',
    reticle_family: 'Hybrid',
    year_introduced: 2012,
    turret_unit_match: 'N/A',
    focal_plane_dependent: false,
    subtension_data: {
      unit: 'none',
      caliber_specific: true,
      ranging_system: true,
      holdover_marks: true,
      moving_target_leads: true,
      notes: 'Caliber-specific BDC holdovers combined with a ranging system based on average shoulder width of standing human targets. Wind correction and moving target leads built into the horizontal arm. Not unit-based — marks are ballistic solutions, not subtension references.',
    },
    illuminated_capable: true,
    nv_compatible: false,
    cqb_capable: true,
    holdover_distances_yards: [200, 300, 400, 500, 600, 800],
    best_use_cases: ['tactical', 'competition', 'general_purpose'],
    description: 'Primary Arms designed the ACSS as an all-in-one combat and competition reticle that combines BDC holdovers, ranging, wind correction, and moving target leads into a single coherent system without requiring unit-based calculations.\n\nThe ranging component uses the average shoulder width of a standing adult (18-20 inches) as the reference — when a standing target\'s shoulders span a specific portion of the reticle, the shooter knows the approximate range and can apply the corresponding holdover mark directly. Wind and lead marks complete the firing solution without requiring external calculation.\n\nACSSreticles are caliber-specific (5.56 at 75gr, 7.62x39, 308, .22LR variants among others) and are typically shipped in SFP LPVOs and prism scopes. Primary Arms licenses the design to other manufacturers. The ACSS has become particularly popular in the budget precision and competition market.',
    pros: [
      'Complete firing solution without external calculation',
      'Ranging built into reticle using human target reference',
      'Moving target leads included',
      'Available across a range of price points',
      'Caliber-specific variants available for most common cartridges',
    ],
    cons: [
      'Not unit-based — cannot be used for general measurement',
      'Only accurate for the specific cartridge variant',
      'Ranging method requires knowing the target is a standing adult',
      'SFP placement means holdovers only accurate at specific magnification',
    ],
    typical_optic_types: ['lpvo', 'prism'],
    patent_holder: 'Primary Arms',
    diagram_url: null,
    example_optic_models: [
      'Primary Arms SLx 1-6x24',
      'Primary Arms PLx 6-30x56',
      'Vortex Spitfire (licensed)',
    ],
    notes: 'Multiple ACSS variants exist for different calibers. Always confirm which caliber-specific version is in a scope before purchasing.',
  },

  {
    id: 'lpvo-illuminated-crosshair',
    reticle_name: 'Illuminated Center Crosshair (LPVO)',
    manufacturer: null,
    reticle_family: 'Illuminated',
    year_introduced: 2008,
    turret_unit_match: 'Both',
    focal_plane_dependent: false,
    subtension_data: {
      unit: 'MRAD',
      hash_spacing_mrad: 1.0,
      illuminated_center_only: true,
      notes: 'Standard MIL or MOA hash marks on the crosshair arms, with a small illuminated center section (typically a 2-4 MOA illuminated dot or chevron at center). The illuminated center provides red-dot-speed acquisition at low power while the hash marks provide precision at higher magnification.',
    },
    illuminated_capable: true,
    nv_compatible: false,
    cqb_capable: true,
    holdover_distances_yards: null,
    best_use_cases: ['competition', 'tactical', 'close_quarters', 'general_purpose'],
    description: 'The illuminated center crosshair is the dominant reticle pattern in low-power variable optics (LPVOs) designed for competition and tactical use. At 1x or near-1x, the illuminated center provides red-dot-equivalent acquisition speed with both eyes open. At higher magnification, the full crosshair with MIL or MOA subtensions provides precision holdover capability.\n\nThe key design decision is SFP placement — the hash marks are typically accurate only at maximum magnification, while the illuminated center works at any power. This is the intended workflow: both-eyes-open at 1x for close work, dialed to max with the subtensions for precision shots.\n\nThis reticle type is the current standard for 3-Gun, USPSA Open and Carry Optics with rifle, and general-purpose tactical rifles. The illuminated center essentially merges a red dot and a precision reticle into one optic.',
    pros: [
      'Red-dot-speed CQB capability at 1x',
      'Full precision measurement capability at high magnification',
      'Versatile across close and long-range stages',
      'Single optic solution for multi-distance shooting',
    ],
    cons: [
      'SFP means subtensions only accurate at one magnification',
      'Illuminated center battery-dependent for CQB performance',
      'Not as clean as a dedicated red dot for pure CQB',
      'Not as precise as dedicated precision reticle for long range',
    ],
    typical_optic_types: ['lpvo'],
    patent_holder: null,
    diagram_url: null,
    example_optic_models: [
      'Vortex Razor HD Gen III 1-10x24',
      'Nightforce NX8 1-8x24',
      'Trijicon Accupower 1-8x28',
      'Leupold VX-6HD 1-6x24',
    ],
    notes: null,
  },

  {
    id: 'christmas-tree',
    reticle_name: 'Christmas Tree',
    manufacturer: null,
    reticle_family: 'MIL',
    year_introduced: 2008,
    turret_unit_match: 'MRAD',
    focal_plane_dependent: true,
    subtension_data: {
      unit: 'MRAD',
      at_magnification: null,
      hash_spacing_mrad: 1.0,
      half_hash_spacing_mrad: 0.5,
      wind_dots: true,
      christmas_tree: true,
      notes: 'Dense array of holdover marks below the horizontal crosshair with progressively wider wind marks at each elevation. The expanding width of the lower array gives the characteristic tree shape. Provides comprehensive holdover and wind data for extreme long-range shooting.',
    },
    illuminated_capable: true,
    nv_compatible: false,
    cqb_capable: false,
    holdover_distances_yards: null,
    best_use_cases: ['precision_rifle', 'long_range', 'competition'],
    description: 'The Christmas Tree is a visual descriptor for any reticle whose lower array expands in width as it extends below center — the holdover marks at each elevation increment include progressively wider wind correction marks, creating a triangular tree shape below the crosshair.\n\nThe pattern allows a shooter to know their wind hold and elevation hold simultaneously from a single reference point in the reticle. At 10 MRAD below the crosshair, the wind marks extend to 5 MRAD each side. The shooter identifies the intersection of their elevation holdover and wind correction directly from the tree rather than computing each independently.\n\nChristmas tree patterns appear in many manufacturer-specific implementations — the Nightforce Tremor3, Schmidt & Bender MSR2, Kahles SKMR4, and numerous others use variations of this approach. The term describes the visual shape of the array, not a specific proprietary design.',
    pros: [
      'Elevation and wind hold visible simultaneously',
      'Enables extreme long-range holds without touching turrets',
      'Dominant in ELR and competition contexts',
    ],
    cons: [
      'Highest complexity of any reticle family',
      'Requires significant practice to read quickly under pressure',
      'Not useful for hunting, CQB, or general purpose',
    ],
    typical_optic_types: ['scope'],
    patent_holder: null,
    diagram_url: null,
    example_optic_models: [
      'Nightforce ATACR (Tremor3)',
      'Schmidt & Bender PMII (MSR2)',
      'Vortex Razor HD Gen III (EBR-7D)',
    ],
    notes: 'Generic term. Specific implementations vary significantly in hash density, wind mark spacing, and whether the tree is symmetric or asymmetric.',
  },

];

// ─────────────────────────────────────────────────────────────
// SEED FUNCTION
// ─────────────────────────────────────────────────────────────

export async function seedReticles(): Promise<void> {
  // Version guard — check for existing rows before inserting
  const { count, error: countError } = await supabase
    .from('reticle_reference')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('seedReticles: count check failed', countError);
    return;
  }

  if (count && count > 0) {
    console.log(`seedReticles: table already has ${count} rows, skipping seed`);
    return;
  }

  const { error } = await supabase
    .from('reticle_reference')
    .insert(RETICLE_SEED_DATA);

  if (error) {
    console.error('seedReticles: insert failed', error);
    return;
  }

  console.log(`seedReticles: seeded ${RETICLE_SEED_DATA.length} reticles`);
}
