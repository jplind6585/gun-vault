import { useState } from 'react';
import { theme } from './theme';

// ─── OPTIC TYPE DATA ──────────────────────────────────────────────────────────

interface OpticType {
  id: string;
  name: string;
  use: string;       // one-line use case summary (shown collapsed)
  body: string[];
  pros: string[];
  cons: string[];
  examples: string[];
}

const OPTIC_TYPES: OpticType[] = [
  {
    id: 'iron-sights',
    name: 'Iron Sights',
    use: 'Baseline. No batteries, no glass, no failure modes.',
    body: [
      'The baseline of all shooting: a front post and a rear notch or aperture. No batteries, no magnification, no parallax, no failure modes beyond physical damage.',
      'Required proficiency before moving to optics — if you cannot shoot irons, you cannot diagnose problems when your optic fails. Ghost ring apertures are standard on AR-pattern rifles; blade/notch configurations dominate pistols.',
      'Regulated at the factory for a specific distance and ammo type. Most service rifle irons are adjustable for elevation and windage via a tool or coin. AR A2 rear sights offer a dual aperture: small for 300m+, large for CQB.',
    ],
    pros: ['No batteries', 'Rugged and lightweight', 'Always work', 'Co-witness baseline when running an optic'],
    cons: ['No magnification', 'Slow on distant targets', 'Eye strain in low light', 'Rear/front/target — three focal planes your eye cannot hold simultaneously'],
    examples: ['A2 rear sight (AR-15)', 'Troy BUIS', 'Magpul MBUS', 'Glock factory sights', 'XS Big Dot'],
  },
  {
    id: 'red-dot',
    name: 'Red Dot Sight (RDS)',
    use: 'Fastest 1x option. Pistols, carbines, CQB.',
    body: [
      'A non-magnifying optic that uses an LED to project a dot onto a partially-reflective lens. The dot appears to be on the same focal plane as the target — the optic is effectively parallax-free within its rated range (typically 50–100 yards for pistol dots, 200+ for rifle-mounted).',
      '1 MOA dots for precision applications, 2–4 MOA for speed. Smaller dots are harder to acquire quickly; larger dots obscure more of the target at distance.',
      'Battery life is the key operational metric. Aimpoint Micro T-2: 5 years on one CR2032 at medium setting. Holosun 507C: 50,000 hours. Trijicon RMR Type 2: auto-adjust mode extends battery to years.',
      'Co-witnessing with irons: absolute co-witness (dot aligns with irons at full height); lower-1/3 co-witness (dot sits above irons, irons visible in lower third of window). Lower-1/3 is preferred on AR uppers for a more natural shooting position.',
    ],
    pros: ['True one-focal-plane aiming', 'Fast target acquisition', 'Works with both eyes open', 'Excellent battery life on quality units', 'Parallax-free within rated range'],
    cons: ['No magnification', 'Battery-dependent on most', 'Astigmatic shooters may see starburst instead of dot', 'Smaller window than holographic'],
    examples: ['Trijicon RMR Type 2', 'Aimpoint Micro T-2', 'Holosun 507C / 509T', 'Leupold DeltaPoint Pro', 'Sig Romeo5'],
  },
  {
    id: 'holographic',
    name: 'Holographic Sight',
    use: 'Largest window at 1x. Extreme-angle use. CQB.',
    body: [
      'A laser reconstructs a reticle pattern from holographic film embedded in the lens. The mechanism is fundamentally different from an RDS — the reticle is not reflected off the glass, it is reconstructed within it.',
      'Critical advantage: the hologram functions at extreme angles. If any portion of the lens is in your field of view, the reticle is on target. This matters in extreme stress positions where cheek weld is inconsistent.',
      'The reticle survives a shattered lens — because the hologram IS the lens. A cracked EoTech with glass still in the frame will still work.',
      'EoTech is the category standard. Battery life is the primary trade-off versus RDS — EoTechs burn through batteries measurably faster than comparable Aimpoints. EoTech\'s documented thermal drift issues (2015 settlement) required a firmware revision and are largely addressed in current production.',
    ],
    pros: ['Largest effective window of any 1x optic', 'Functions at extreme cant and off-axis', 'Reticle survives shattered glass', 'Compatible with magnifiers'],
    cons: ['Poor battery life vs. RDS', 'Heavier', 'More expensive than equivalent RDS', 'Documented thermal drift in older EoTech units'],
    examples: ['EoTech 512', 'EoTech XPS2', 'EoTech EXPS3 (NV compatible)', 'Vortex AMG UH-1'],
  },
  {
    id: 'prism',
    name: 'Prism Scope',
    use: 'Fixed magnification. Best for astigmatic shooters.',
    body: [
      'Uses a prism to focus the image rather than the erector lens system used in traditional scopes. Fixed magnification — typically 1x, 3x, or 5x.',
      'Critical advantage for a significant portion of shooters: the reticle is etched into glass, not projected by an LED. Shooters with astigmatism who see a starburst with a red dot see a clean, crisp reticle through a prism scope. Illumination is supplemental, not primary.',
      'More compact than a variable scope at the same magnification. The ACOG (Trijicon Advanced Combat Optical Gunsight) is the military benchmark — fixed 4x with a tritium/fiber-optic illuminated reticle. No battery required under any conditions.',
      'Limited by fixed magnification. You pick your role and commit.',
    ],
    pros: ['Works for astigmatic shooters', 'No battery required (ACOG)', 'Compact at magnification', 'Rugged — fewer moving parts than variable', 'Etched reticle always visible'],
    cons: ['Fixed magnification — no flexibility', 'Eye box can be unforgiving', 'Limited field of view vs. RDS at 1x', 'Higher cost per magnification than variable scopes'],
    examples: ['Trijicon ACOG (TA31, TA33)', 'Vortex Spitfire 3x', 'Primary Arms 5x Compact Prism', 'Steiner P4Xi (fixed 4x)'],
  },
  {
    id: 'lpvo',
    name: 'LPVO — Low Power Variable Optic',
    use: 'One-optic solution: 1x CQB to 600+ yards.',
    body: [
      'Variable magnification starting at true 1x, ranging to 4x, 6x, 8x, or 10x. The Swiss Army knife of rifle optics — true 1x for CQB with both eyes open, dial up for distance shots.',
      'FFP vs. SFP matters significantly in an LPVO. An FFP reticle scales with magnification — subtensions are correct at any power. An SFP reticle stays the same apparent size, but MIL/MOA holds are only correct at one designated power (usually max).',
      'Quality LPVOs are expensive because manufacturing true 1x with zero optical distortion is genuinely difficult. Budget LPVOs often have distortion at 1x, making them effectively false-1x optics. The eye box narrows significantly at higher magnification.',
      'Schmidt & Bender, Nightforce NX8, and Vortex Razor are benchmarks. Expect $800–$3,000 for quality glass. A quality LPVO with mount runs 18–24 oz.',
    ],
    pros: ['True versatility from CQB to 600+ yards', 'One-optic solution', 'FFP allows ranging at any magnification', 'Growing selection at multiple price points'],
    cons: ['Heavy', 'Tight eye box at high magnification', 'Quality glass is expensive', 'FFP reticle is tiny at 1x', 'Not as fast as RDS at CQB'],
    examples: ['Vortex Razor HD Gen III 1-10x', 'Nightforce NX8 1-8x', 'Schmidt & Bender PM II 1-8x', 'Leupold Mark 6 1-6x', 'Sig Tango6T 1-6x'],
  },
  {
    id: 'variable-scope',
    name: 'Variable Magnification Scope',
    use: 'Maximum range versatility. Hunting to precision.',
    body: [
      'The classic configuration: 3-9x, 4-16x, 5-25x, and beyond. The objective lens diameter (the number after "x") determines light-gathering. An erector assembly adjusts point of impact via internal lenses.',
      'Glass quality varies enormously and drives the price delta between a $150 Bushnell and a $3,000 Nightforce. The variables: lens coatings (FMC is the baseline requirement), glass type (ED/HD glass reduces chromatic aberration), and manufacturing tolerances in the erector assembly.',
      'Repeatability of adjustments is critical for precision use — a scope that does not return to zero after dialing is useless for field or competition shooting. Benchmark test: shoot a box (up 10 MIL, right 10 MIL, down 10 MIL, left 10 MIL, back to zero) and verify POI returns.',
      'The 3-9x40 configuration dominated hunting for 50 years and remains the most common scope sold. The 4-16x and 5-25x configurations have grown as precision rifle competition expanded.',
    ],
    pros: ['Maximum range versatility', 'Large selection at all price points', 'High-magnification precision capability', 'Proven long-range accuracy platform'],
    cons: ['Heavy at high magnification', 'More optical surfaces = more potential distortion', 'Tight eye box at max power', 'Requires solid, properly torqued rings and mount'],
    examples: ['Nightforce ATACR 5-25x56', 'Vortex Viper PST II 5-25x50', 'Leupold Mark 5HD 5-25x56', 'Schmidt & Bender PMII 5-25x56'],
  },
  {
    id: 'fixed-power',
    name: 'Fixed Power Scope',
    use: 'Maximum simplicity. Benchrest. Military sniper tradition.',
    body: [
      'No magnification ring, no variable assembly. A single magnification — typically 6x, 10x, 12x, or exotic fixed powers like 36x and 45x for benchrest.',
      'Simplicity is the design advantage: fewer glass elements, fewer moving parts, often better light transmission than an equivalent variable at the same power due to fewer optical surfaces. A 10x fixed can outperform a 3-12x variable at 10x if glass quality is comparable.',
      'The classic precision fixed powers are 10x (Leupold Mark 4 M1, Unertl 10x) and the sniper tradition of using fixed optics for battlefield predictability. Fixed power scopes are still preferred by some military shooters who want guaranteed performance with no selector to set incorrectly.',
      'Benchrest competition uses very high fixed powers (36x–45x) where the goal is group size, not versatility. The rifle rests mechanically; field shooting skills are largely irrelevant.',
    ],
    pros: ['Simpler — fewer failure points', 'Better light transmission per optical surface', 'Lighter than comparable variable', 'No selector to leave at wrong power'],
    cons: ['No versatility — committed to one magnification', 'Wrong power for a scenario is a liability', 'Limited selection vs. the variable market'],
    examples: ['Leupold Mark 4 M1 10x40', 'Unertl 10x USMC Sniper Scope', 'March 10x52 Fixed', 'Nightforce 12x42 Fixed', 'Leupold 36x competition'],
  },
  {
    id: 'night-vision',
    name: 'Night Vision (NV/NODS)',
    use: 'Ambient light amplification. Near-darkness operation.',
    body: [
      'Image intensifier tubes amplify ambient light (starlight, moonlight, IR illumination) through a photocathode and microchannel plate. Requires some ambient or supplemental IR light to function — unlike thermal, it does not detect heat.',
      'Generations: Gen 1 (significant distortion, limited tube life, civilian grade); Gen 2 (transitional, better MCP); Gen 3 (US military standard — gallium arsenide photocathode, dramatically better resolution and tube life). Film-less Gen 3 removes the ion barrier film for improved sensitivity at a tube life trade-off.',
      'White Phosphor vs. Green Phosphor: Green is the traditional output and what most operators trained on. White provides more natural grayscale contrast discrimination. Neither has a clear tactical superiority — it is a preference.',
      'Auto-gating cycles the tube voltage when hit with sudden bright light (flashlight, muzzle flash) to prevent damage and whiteout. Essential for any tactical use. Laser aiming devices (MAWL, PEQ-15, DBAL) emit IR lasers — invisible to the naked eye, visible through NV.',
    ],
    pros: ['Operates in near-darkness', 'Passive — detects using ambient light', 'Long military track record', 'Can be helmet-mounted for hands-free use'],
    cons: ['Gen 3 quality: $3,000–$10,000+', 'Requires ambient or IR illuminator', 'Cannot see through glass or dense foliage', 'Export-controlled (ITAR regulations)'],
    examples: ['PVS-14 (monocular)', 'GPNVG-18 (quad-tube panoramic)', 'RNVG (ruggedized)', 'MAWL-C1+ (laser device)', 'PEQ-15 (laser device)'],
  },
  {
    id: 'thermal',
    name: 'Thermal',
    use: 'Heat detection. Total darkness. Smoke and fog.',
    body: [
      'Detects heat signature rather than reflected light. A microbolometer sensor measures infrared radiation emitted by objects. Works in total darkness, through smoke, and through light fog — conditions that defeat night vision.',
      'Resolution is measured in pixels: 320x240 (entry-level), 640x480 (mid-tier), 1280x1024 (high-end). Refresh rate matters for moving targets — 60Hz handles fast movement cleanly; 9Hz or 30Hz may show lag.',
      'Critical limitation: thermal cannot see through glass. Car windshields, building windows, and optical glass appear opaque to thermal. A person behind a glass door is largely invisible.',
      'Not subject to ITAR restrictions like Gen 3 NV — more accessible for civilian purchase. Used increasingly in hunting (where legal — varies by state), property security, and search and rescue.',
    ],
    pros: ['Works in total darkness without IR illuminator', 'Cuts through smoke and fog', 'Not ITAR-controlled', 'Detects humans regardless of camouflage or concealment'],
    cons: ['Cannot see through glass', 'Resolution lower than NV at equivalent price', 'Image is heat-map, not photographic detail', 'Battery-intensive'],
    examples: ['Pulsar Thermion 2 XP50', 'FLIR RS64 2.25-9x35mm', 'ATN Thor 4 640', 'Sig Echo3 Thermal', 'FLIR Breach PTQ136'],
  },
  {
    id: 'magnifiers',
    name: 'Magnifier',
    use: '3x reach behind an RDS. Lighter than LPVO.',
    body: [
      'A magnifying optic mounted behind an RDS — typically 3x (Aimpoint 3x-C, Vortex VMX-3T, EoTech G33). Some are 5x or 6x for additional reach.',
      'Flip-to-side mount: a lever-actuated mount swings the magnifier 90 degrees clear of the sight line. Folded = pure RDS performance. Swung into position = 3x magnified.',
      'Works with most red dots but eye box becomes critical — some RDS and magnifier combinations produce poor image quality or vignetting. Aimpoint and EoTech with their respective magnifiers are validated pairings.',
      'The concept originated in military use: an M68 red dot with an Aimpoint magnifier gives 300-yard capability without the weight and bulk of an LPVO. At $200–$400 for a quality magnifier added to an existing RDS, it is cost-effective reach extension.',
    ],
    pros: ['Converts CQB optic to 3x in one motion', 'Lighter than LPVO', 'Failure of magnifier still leaves a functional RDS', 'Fast 1x-to-3x transition'],
    cons: ['3x ceiling vs. 4–10x on an LPVO', 'Eye box is tight with magnifier in place', 'Combined cost of RDS + magnifier + mount approaches LPVO territory'],
    examples: ['Aimpoint 3x-C with TwistMount', 'Vortex VMX-3T', 'EoTech G33 Magnifier', 'Unity Tactical FAST Magnifier Mount'],
  },
];

// ─── SVG OPTIC ILLUSTRATIONS ─────────────────────────────────────────────────
// Side-profile technical line drawings of each optic category.
// Consistent: viewBox 280×90, gold accent structure, muted details.

const C = {
  gold: theme.accent,
  goldDim: 'rgba(255,212,59,0.35)',
  goldFill: 'rgba(255,212,59,0.06)',
  line: 'rgba(255,255,255,0.18)',
  lineFill: 'rgba(255,255,255,0.04)',
  bg: theme.bg,
  label: 'rgba(255,255,255,0.3)',
};

const illustrations: Record<string, JSX.Element> = {

  'iron-sights': (
    <svg viewBox="0 0 280 90" fill="none" style={{ width: '100%' }}>
      {/* Target rings in background */}
      <circle cx="230" cy="45" r="28" stroke={C.line} strokeWidth="1"/>
      <circle cx="230" cy="45" r="18" stroke={C.line} strokeWidth="0.8"/>
      <circle cx="230" cy="45" r="9" stroke={C.line} strokeWidth="0.8"/>
      <circle cx="230" cy="45" r="3" fill={C.line}/>
      {/* Sight picture frame */}
      <rect x="60" y="20" width="100" height="50" rx="3" stroke={C.goldDim} strokeWidth="1" fill={C.lineFill}/>
      {/* Rear sight — U notch */}
      <rect x="75" y="28" width="70" height="34" rx="2" stroke={C.goldDim} strokeWidth="1" fill={C.bg}/>
      <rect x="97" y="28" width="26" height="22" fill={C.bg}/>
      <line x1="97" y1="28" x2="97" y2="50" stroke={C.gold} strokeWidth="1.5"/>
      <line x1="123" y1="28" x2="123" y2="50" stroke={C.gold} strokeWidth="1.5"/>
      <line x1="75" y1="62" x2="145" y2="62" stroke={C.goldDim} strokeWidth="1"/>
      {/* Front sight post */}
      <rect x="104" y="34" width="12" height="22" rx="1" stroke={C.gold} strokeWidth="1.5" fill={C.goldFill}/>
      {/* Alignment dotted line */}
      <line x1="110" y1="56" x2="230" y2="45" stroke={C.gold} strokeWidth="0.5" strokeDasharray="4 3" opacity="0.4"/>
      {/* Labels */}
      <text x="110" y="84" fill={C.label} fontSize="9" textAnchor="middle" fontFamily="monospace">REAR NOTCH</text>
      <text x="185" y="84" fill={C.label} fontSize="9" textAnchor="middle" fontFamily="monospace">FRONT POST</text>
      <text x="234" y="84" fill={C.label} fontSize="9" textAnchor="middle" fontFamily="monospace">TARGET</text>
    </svg>
  ),

  'red-dot': (
    <svg viewBox="0 0 280 90" fill="none" style={{ width: '100%' }}>
      {/* Rifle-mount tube body */}
      <rect x="30" y="32" width="150" height="26" rx="13" stroke={C.gold} strokeWidth="1.5" fill={C.goldFill}/>
      {/* Lens window on front */}
      <ellipse cx="180" cy="45" rx="9" ry="13" stroke={C.gold} strokeWidth="1.5" fill="rgba(116,192,252,0.06)"/>
      {/* Eyepiece on rear */}
      <ellipse cx="30" cy="45" rx="8" ry="11" stroke={C.goldDim} strokeWidth="1" fill={C.lineFill}/>
      {/* Battery cap bump */}
      <rect x="95" y="28" width="18" height="8" rx="2" stroke={C.goldDim} strokeWidth="1" fill={C.lineFill}/>
      {/* The dot */}
      <circle cx="148" cy="45" r="3.5" fill={C.gold} opacity="0.9"/>
      {/* Mount base */}
      <rect x="50" y="58" width="110" height="8" rx="2" stroke={C.goldDim} strokeWidth="1" fill={C.lineFill}/>
      <rect x="65" y="66" width="16" height="5" rx="1" stroke={C.goldDim} strokeWidth="1" fill={C.lineFill}/>
      <rect x="129" y="66" width="16" height="5" rx="1" stroke={C.goldDim} strokeWidth="1" fill={C.lineFill}/>
      {/* Labels */}
      <text x="104" y="84" fill={C.label} fontSize="9" textAnchor="middle" fontFamily="monospace">LED DOT · PARALLAX-FREE · 1x</text>
    </svg>
  ),

  'holographic': (
    <svg viewBox="0 0 280 90" fill="none" style={{ width: '100%' }}>
      {/* Main housing — EoTech silhouette (wide, flat, rectangular) */}
      <rect x="40" y="18" width="170" height="52" rx="4" stroke={C.gold} strokeWidth="1.5" fill={C.goldFill}/>
      {/* Hood over front lens */}
      <rect x="168" y="14" width="20" height="60" rx="2" stroke={C.goldDim} strokeWidth="1" fill={C.lineFill}/>
      {/* Large window cutout */}
      <rect x="58" y="26" width="112" height="36" rx="3" stroke={C.gold} strokeWidth="1" fill="rgba(116,192,252,0.05)"/>
      {/* Holographic reticle: 65 MOA ring + center dot */}
      <circle cx="114" cy="44" r="13" stroke={C.gold} strokeWidth="1" opacity="0.7"/>
      <circle cx="114" cy="44" r="1.5" fill={C.gold}/>
      {/* Crosshair through center */}
      <line x1="114" y1="35" x2="114" y2="53" stroke={C.gold} strokeWidth="0.5" opacity="0.5"/>
      <line x1="105" y1="44" x2="123" y2="44" stroke={C.gold} strokeWidth="0.5" opacity="0.5"/>
      {/* Power button */}
      <circle cx="48" cy="26" r="4" stroke={C.goldDim} strokeWidth="1"/>
      {/* Labels */}
      <text x="114" y="82" fill={C.label} fontSize="9" textAnchor="middle" fontFamily="monospace">LARGE WINDOW · HOLOGRAPHIC RETICLE · 1x</text>
    </svg>
  ),

  'prism': (
    <svg viewBox="0 0 280 90" fill="none" style={{ width: '100%' }}>
      {/* Compact block body */}
      <rect x="70" y="24" width="120" height="42" rx="3" stroke={C.gold} strokeWidth="1.5" fill={C.goldFill}/>
      {/* Objective (front, right side) */}
      <ellipse cx="190" cy="45" rx="9" ry="14" stroke={C.gold} strokeWidth="1.5" fill="rgba(116,192,252,0.06)"/>
      {/* Eyepiece (rear, left side) */}
      <ellipse cx="70" cy="45" rx="7" ry="11" stroke={C.goldDim} strokeWidth="1" fill={C.lineFill}/>
      {/* Top rail / illumination unit */}
      <rect x="80" y="16" width="80" height="10" rx="2" stroke={C.goldDim} strokeWidth="1" fill={C.lineFill}/>
      {/* Etched reticle visible in eyepiece */}
      <line x1="66" y1="45" x2="74" y2="45" stroke={C.gold} strokeWidth="0.8" opacity="0.6"/>
      <line x1="70" y1="41" x2="70" y2="49" stroke={C.gold} strokeWidth="0.8" opacity="0.6"/>
      {/* Mount */}
      <rect x="80" y="66" width="100" height="8" rx="2" stroke={C.goldDim} strokeWidth="1" fill={C.lineFill}/>
      {/* Labels */}
      <text x="130" y="84" fill={C.label} fontSize="9" textAnchor="middle" fontFamily="monospace">PRISM · ETCHED RETICLE · FIXED MAG</text>
    </svg>
  ),

  'lpvo': (
    <svg viewBox="0 0 280 90" fill="none" style={{ width: '100%' }}>
      {/* Main tube */}
      <rect x="20" y="35" width="220" height="20" rx="10" stroke={C.gold} strokeWidth="1.5" fill={C.goldFill}/>
      {/* Eyepiece bell (left, slightly larger) */}
      <ellipse cx="20" cy="45" rx="9" ry="14" stroke={C.gold} strokeWidth="1.5" fill={C.lineFill}/>
      {/* Objective bell (right, medium) */}
      <ellipse cx="240" cy="45" rx="11" ry="16" stroke={C.gold} strokeWidth="1.5" fill="rgba(116,192,252,0.06)"/>
      {/* Variable power ring - center of tube */}
      <rect x="110" y="32" width="36" height="26" rx="13" stroke={C.goldDim} strokeWidth="2" fill="rgba(255,255,255,0.06)"/>
      {/* Turret housing on top */}
      <rect x="88" y="22" width="22" height="14" rx="2" stroke={C.goldDim} strokeWidth="1" fill={C.lineFill}/>
      <rect x="162" y="22" width="22" height="14" rx="2" stroke={C.goldDim} strokeWidth="1" fill={C.lineFill}/>
      {/* Magnification labels */}
      <text x="113" y="48" fill={C.gold} fontSize="8" fontFamily="monospace" fontWeight="700">1x</text>
      <text x="128" y="48" fill={C.label} fontSize="7" fontFamily="monospace">—</text>
      <text x="136" y="48" fill={C.gold} fontSize="8" fontFamily="monospace" fontWeight="700">8x</text>
      {/* Mount */}
      <rect x="60" y="55" width="50" height="8" rx="2" stroke={C.goldDim} strokeWidth="1" fill={C.lineFill}/>
      <rect x="148" y="55" width="50" height="8" rx="2" stroke={C.goldDim} strokeWidth="1" fill={C.lineFill}/>
      {/* Labels */}
      <text x="130" y="78" fill={C.label} fontSize="9" textAnchor="middle" fontFamily="monospace">LPVO · TRUE 1x · VARIABLE TO 8x+</text>
    </svg>
  ),

  'variable-scope': (
    <svg viewBox="0 0 280 90" fill="none" style={{ width: '100%' }}>
      {/* Main tube — long */}
      <rect x="15" y="37" width="230" height="16" rx="8" stroke={C.gold} strokeWidth="1.5" fill={C.goldFill}/>
      {/* Eyepiece bell */}
      <ellipse cx="15" cy="45" rx="9" ry="12" stroke={C.gold} strokeWidth="1.5" fill={C.lineFill}/>
      {/* Large objective bell */}
      <ellipse cx="245" cy="45" rx="14" ry="20" stroke={C.gold} strokeWidth="1.5" fill="rgba(116,192,252,0.06)"/>
      {/* Variable power ring */}
      <rect x="55" y="33" width="30" height="24" rx="12" stroke={C.goldDim} strokeWidth="1.8" fill="rgba(255,255,255,0.05)"/>
      {/* Turrets */}
      <rect x="110" y="24" width="20" height="14" rx="2" stroke={C.goldDim} strokeWidth="1" fill={C.lineFill}/>
      <circle cx="120" cy="24" r="3" stroke={C.goldDim} strokeWidth="1" fill="none"/>
      <rect x="185" y="31" width="16" height="10" rx="2" stroke={C.goldDim} strokeWidth="1" fill={C.lineFill}/>
      {/* Objective shade suggestion */}
      <line x1="231" y1="25" x2="245" y2="25" stroke={C.goldDim} strokeWidth="1"/>
      <line x1="231" y1="65" x2="245" y2="65" stroke={C.goldDim} strokeWidth="1"/>
      {/* Labels */}
      <text x="130" y="78" fill={C.label} fontSize="9" textAnchor="middle" fontFamily="monospace">VARIABLE SCOPE · LARGE OBJECTIVE · HIGH MAG</text>
    </svg>
  ),

  'fixed-power': (
    <svg viewBox="0 0 280 90" fill="none" style={{ width: '100%' }}>
      {/* Main tube — uniform diameter */}
      <rect x="20" y="37" width="210" height="16" rx="8" stroke={C.gold} strokeWidth="1.5" fill={C.goldFill}/>
      {/* Eyepiece */}
      <ellipse cx="20" cy="45" rx="10" ry="13" stroke={C.gold} strokeWidth="1.5" fill={C.lineFill}/>
      {/* Objective */}
      <ellipse cx="230" cy="45" rx="13" ry="18" stroke={C.gold} strokeWidth="1.5" fill="rgba(116,192,252,0.06)"/>
      {/* No variable ring — note the absence compared to variable scope */}
      {/* Turrets */}
      <rect x="100" y="24" width="20" height="14" rx="2" stroke={C.goldDim} strokeWidth="1" fill={C.lineFill}/>
      <circle cx="110" cy="24" r="3" stroke={C.goldDim} strokeWidth="1" fill="none"/>
      <rect x="165" y="32" width="14" height="10" rx="2" stroke={C.goldDim} strokeWidth="1" fill={C.lineFill}/>
      {/* Fixed power label on tube */}
      <text x="130" y="48" fill={C.gold} fontSize="9" fontFamily="monospace" fontWeight="700" textAnchor="middle">10×</text>
      {/* Labels */}
      <text x="130" y="78" fill={C.label} fontSize="9" textAnchor="middle" fontFamily="monospace">FIXED POWER · NO VARIABLE RING · SIMPLER</text>
    </svg>
  ),

  'night-vision': (
    <svg viewBox="0 0 280 90" fill="none" style={{ width: '100%' }}>
      {/* PVS-14 monocular body */}
      <rect x="90" y="20" width="70" height="50" rx="5" stroke={C.gold} strokeWidth="1.5" fill={C.goldFill}/>
      {/* Objective lens (front) */}
      <ellipse cx="90" cy="45" rx="9" ry="14" stroke={C.gold} strokeWidth="1.5" fill="rgba(116,192,252,0.06)"/>
      {/* Eyepiece (rear) */}
      <ellipse cx="160" cy="45" rx="7" ry="10" stroke={C.goldDim} strokeWidth="1.5" fill={C.lineFill}/>
      {/* Gain control knob */}
      <circle cx="125" cy="26" r="7" stroke={C.goldDim} strokeWidth="1" fill={C.lineFill}/>
      <line x1="122" y1="23" x2="128" y2="29" stroke={C.goldDim} strokeWidth="1"/>
      {/* IR illuminator (side) */}
      <rect x="96" y="65" width="28" height="10" rx="2" stroke={C.goldDim} strokeWidth="1" fill={C.lineFill}/>
      {/* IR wavelength indicator */}
      <text x="110" y="73" fill={C.gold} fontSize="7" textAnchor="middle" fontFamily="monospace">IR</text>
      {/* Gen3 label */}
      <text x="135" y="58" fill={C.label} fontSize="8" fontFamily="monospace">GEN3</text>
      {/* Green phosphor glow suggestion */}
      <circle cx="90" cy="45" r="6" fill="rgba(81,207,102,0.12)" stroke="none"/>
      {/* Labels */}
      <text x="124" y="84" fill={C.label} fontSize="9" textAnchor="middle" fontFamily="monospace">IMAGE INTENSIFIER · AMBIENT LIGHT AMPLIFICATION</text>
    </svg>
  ),

  'thermal': (
    <svg viewBox="0 0 280 90" fill="none" style={{ width: '100%' }}>
      {/* Rectangular thermal sensor body */}
      <rect x="65" y="18" width="130" height="54" rx="4" stroke={C.gold} strokeWidth="1.5" fill={C.goldFill}/>
      {/* Circular objective lens */}
      <circle cx="65" cy="45" r="18" stroke={C.gold} strokeWidth="1.5" fill="rgba(116,192,252,0.06)"/>
      <circle cx="65" cy="45" r="11" stroke={C.goldDim} strokeWidth="0.8" fill="none"/>
      {/* Heat signature display suggestion inside body */}
      <rect x="80" y="28" width="100" height="34" rx="2" stroke={C.goldDim} strokeWidth="0.8" fill="rgba(255,255,255,0.03)"/>
      {/* Heat blob in display */}
      <ellipse cx="130" cy="45" rx="18" ry="10" fill="rgba(255,100,50,0.12)" stroke="rgba(255,100,50,0.3)" strokeWidth="0.8"/>
      <ellipse cx="130" cy="45" rx="8" ry="5" fill="rgba(255,150,50,0.15)" stroke="rgba(255,150,50,0.3)" strokeWidth="0.6"/>
      {/* Battery indicator on top */}
      <rect x="100" y="10" width="40" height="9" rx="2" stroke={C.goldDim} strokeWidth="1" fill={C.lineFill}/>
      <rect x="140" y="13" width="4" height="3" rx="1" fill={C.goldDim}/>
      {/* Labels */}
      <text x="140" y="84" fill={C.label} fontSize="9" textAnchor="middle" fontFamily="monospace">MICROBOLOMETER · HEAT DETECTION · NO AMBIENT LIGHT NEEDED</text>
    </svg>
  ),

  'magnifiers': (
    <svg viewBox="0 0 280 90" fill="none" style={{ width: '100%' }}>
      {/* RDS (left) */}
      <rect x="20" y="32" width="90" height="26" rx="13" stroke={C.goldDim} strokeWidth="1.2" fill={C.lineFill}/>
      <ellipse cx="110" cy="45" rx="8" ry="12" stroke={C.goldDim} strokeWidth="1.2" fill="rgba(116,192,252,0.05)"/>
      <ellipse cx="20" cy="45" rx="7" ry="10" stroke={C.goldDim} strokeWidth="1" fill={C.lineFill}/>
      <circle cx="85" cy="45" r="3" fill={C.goldDim} opacity="0.7"/>
      <text x="55" y="26" fill={C.label} fontSize="8" textAnchor="middle" fontFamily="monospace">RDS (1x)</text>
      {/* Flip arm */}
      <line x1="120" y1="45" x2="138" y2="45" stroke={C.gold} strokeWidth="1.5"/>
      <circle cx="138" cy="45" r="3" fill={C.gold}/>
      {/* Magnifier tube (right, in-line position) */}
      <rect x="141" y="35" width="80" height="20" rx="10" stroke={C.gold} strokeWidth="1.5" fill={C.goldFill}/>
      <ellipse cx="141" cy="45" rx="7" ry="10" stroke={C.gold} strokeWidth="1.5" fill={C.lineFill}/>
      <ellipse cx="221" cy="45" rx="8" ry="12" stroke={C.gold} strokeWidth="1.5" fill="rgba(116,192,252,0.06)"/>
      <text x="181" y="26" fill={C.gold} fontSize="8" textAnchor="middle" fontFamily="monospace">MAGNIFIER (3x)</text>
      {/* Flip arc showing swing-out */}
      <path d="M138 42 Q148 20 158 35" stroke={C.goldDim} strokeWidth="0.8" strokeDasharray="3 2"/>
      {/* Labels */}
      <text x="130" y="78" fill={C.label} fontSize="9" textAnchor="middle" fontFamily="monospace">FLIP-TO-SIDE · CONVERTS 1x RDS TO 3x</text>
    </svg>
  ),
};

// ─── ACCORDION CARD ───────────────────────────────────────────────────────────

interface AccordionCardProps {
  optic: OpticType;
}

function AccordionCard({ optic }: AccordionCardProps) {
  const [open, setOpen] = useState(false);
  const illustration = illustrations[optic.id];

  return (
    <div style={{
      background: theme.surface,
      border: '0.5px solid ' + (open ? theme.accent : theme.border),
      borderRadius: '6px',
      marginBottom: '6px',
      overflow: 'hidden',
      transition: 'border-color 0.15s',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          padding: '14px 16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          fontFamily: 'monospace',
          textAlign: 'left',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: theme.accent, fontWeight: 700, fontSize: '13px', letterSpacing: '0.3px', marginBottom: '2px' }}>
            {optic.name}
          </div>
          <div style={{ color: theme.textMuted, fontSize: '11px', letterSpacing: '0.2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {optic.use}
          </div>
        </div>
        <span style={{
          color: theme.textMuted,
          fontSize: '10px',
          transform: open ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.15s',
          flexShrink: 0,
        }}>▼</span>
      </button>

      {open && (
        <div>
          {/* SVG Illustration */}
          {illustration && (
            <div style={{
              borderTop: '0.5px solid ' + theme.border,
              padding: '12px 16px 4px',
              background: 'rgba(0,0,0,0.2)',
            }}>
              {illustration}
            </div>
          )}

          <div style={{ padding: '12px 16px 16px' }}>
            {/* Body text */}
            {optic.body.map((para, i) => (
              <p key={i} style={{
                color: theme.textSecondary,
                fontSize: '12px',
                fontFamily: 'monospace',
                lineHeight: '1.7',
                margin: '0 0 10px 0',
              }}>
                {para}
              </p>
            ))}

            {/* Pros / Cons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '14px 0' }}>
              <div>
                <div style={{ fontSize: '10px', letterSpacing: '1px', color: theme.green, fontFamily: 'monospace', marginBottom: '8px', fontWeight: 600 }}>PROS</div>
                {optic.pros.map((p, i) => (
                  <div key={i} style={{ fontSize: '11px', fontFamily: 'monospace', color: theme.textSecondary, marginBottom: '5px', paddingLeft: '12px', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, color: theme.green }}>+</span>
                    {p}
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: '10px', letterSpacing: '1px', color: theme.red, fontFamily: 'monospace', marginBottom: '8px', fontWeight: 600 }}>CONS</div>
                {optic.cons.map((c, i) => (
                  <div key={i} style={{ fontSize: '11px', fontFamily: 'monospace', color: theme.textSecondary, marginBottom: '5px', paddingLeft: '12px', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, color: theme.red }}>−</span>
                    {c}
                  </div>
                ))}
              </div>
            </div>

            {/* Examples */}
            <div>
              <div style={{ fontSize: '10px', letterSpacing: '1px', color: theme.accent, fontFamily: 'monospace', marginBottom: '8px', fontWeight: 600 }}>NOTABLE EXAMPLES</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {optic.examples.map((ex, i) => (
                  <span key={i} style={{
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    color: theme.textPrimary,
                    background: 'rgba(255,212,59,0.06)',
                    border: '0.5px solid rgba(255,212,59,0.2)',
                    borderRadius: '3px',
                    padding: '2px 7px',
                  }}>
                    {ex}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SUB-SECTIONS ─────────────────────────────────────────────────────────────

function KeyNumbersSection() {
  return (
    <div>
      <p style={{ color: theme.textSecondary, fontSize: '13px', fontFamily: 'monospace', lineHeight: '1.7', margin: '0 0 16px 0' }}>
        A scope marked <span style={{ color: theme.accent, fontWeight: 700 }}>3-9x40</span> encodes three numbers. Here is what each means.
      </p>

      <div style={{ background: theme.bg, border: '0.5px solid ' + theme.border, borderRadius: '6px', padding: '16px', marginBottom: '16px', fontFamily: 'monospace', display: 'flex', gap: '0', alignItems: 'center' }}>
        <span style={{ color: theme.accent, fontSize: '28px', fontWeight: 700 }}>3</span>
        <span style={{ color: theme.textMuted, fontSize: '20px', margin: '0 2px' }}>–</span>
        <span style={{ color: theme.green, fontSize: '28px', fontWeight: 700 }}>9</span>
        <span style={{ color: theme.textMuted, fontSize: '20px', margin: '0 2px' }}>×</span>
        <span style={{ color: theme.orange, fontSize: '28px', fontWeight: 700 }}>40</span>
      </div>

      {[
        { color: theme.accent, label: '3 — Minimum Magnification', body: 'The lowest power setting. At 1x, targets appear at natural size. At 3x, they appear 3 times closer. A scope with a 1x minimum is a true LPVO.' },
        { color: theme.green, label: '9 — Maximum Magnification', body: 'The highest power setting. The greater the max power, the smaller the field of view and the tighter the eye box required.' },
        { color: theme.orange, label: '40 — Objective Lens Diameter (mm)', body: 'The diameter of the forward-facing lens. Larger objective = more light gathered. A 50mm objective gathers ~56% more light than a 40mm at equivalent magnification.' },
      ].map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'flex-start' }}>
          <div style={{ width: '3px', minWidth: '3px', borderRadius: '2px', background: item.color, alignSelf: 'stretch', minHeight: '40px' }}/>
          <div>
            <div style={{ color: item.color, fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>{item.label}</div>
            <div style={{ color: theme.textSecondary, fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.6' }}>{item.body}</div>
          </div>
        </div>
      ))}

      <div style={{ background: theme.bg, border: '0.5px solid ' + theme.border, borderRadius: '6px', padding: '14px', marginTop: '8px' }}>
        <div style={{ color: theme.accent, fontFamily: 'monospace', fontSize: '11px', letterSpacing: '1px', fontWeight: 700, marginBottom: '10px' }}>EXIT PUPIL FORMULA</div>
        <div style={{ color: theme.textSecondary, fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.7' }}>
          Exit pupil (mm) = Objective diameter ÷ Magnification
        </div>
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            { label: '9×40 (max power):', value: '40 ÷ 9 = 4.4mm', note: 'Good for daylight — human eye ~3mm in bright sun' },
            { label: '3×40 (min power):', value: '40 ÷ 3 = 13.3mm', note: 'Wider than your pupil; no benefit beyond ~7mm in darkness' },
            { label: '4×50 (hunting):', value: '50 ÷ 4 = 12.5mm', note: 'Aperture-limited by the eye, but feels brighter at dusk' },
          ].map((row, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '130px 100px 1fr', gap: '8px', fontSize: '11px', fontFamily: 'monospace', lineHeight: '1.5' }}>
              <span style={{ color: theme.textMuted }}>{row.label}</span>
              <span style={{ color: theme.accent, fontWeight: 700 }}>{row.value}</span>
              <span style={{ color: theme.textSecondary }}>{row.note}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GlassQualitySection() {
  const coatings = [
    { name: 'Coated', desc: 'One anti-reflection layer on at least one surface.' },
    { name: 'Fully Coated', desc: 'At least one layer on all air-to-glass surfaces.' },
    { name: 'Multi-Coated', desc: 'Multiple layers on at least one surface.' },
    { name: 'Fully Multi-Coated (FMC)', desc: 'Multiple layers on all air-to-glass surfaces. Require this on any optic you buy.' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '18px' }}>
        <div style={{ color: theme.accent, fontFamily: 'monospace', fontSize: '11px', letterSpacing: '1px', fontWeight: 700, marginBottom: '10px' }}>LENS COATINGS — HIERARCHY</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {coatings.map((c, i) => (
            <div key={i} style={{
              display: 'flex', gap: '12px', alignItems: 'flex-start',
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '4px',
              border: '0.5px solid ' + theme.border,
            }}>
              <span style={{ color: theme.textMuted, fontFamily: 'monospace', fontSize: '11px', fontWeight: 400, minWidth: '160px' }}>{c.name}</span>
              <span style={{ color: theme.textSecondary, fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.5' }}>{c.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {[
        { title: 'ED / Extra-Low Dispersion Glass', body: 'Reduces chromatic aberration — the color fringing visible at high magnification where red and blue wavelengths focus at slightly different points. Particularly noticeable on high-contrast targets at 10x+. ED glass is a meaningful improvement above 8x; minimal benefit below 6x.' },
        { title: 'What "Brightness" Actually Means', body: 'Brightness claims in marketing are largely meaningless. Transmission percentage is the real metric — a quality scope transmits 90–95% of incoming light. The path to more light: (1) better coatings, (2) ED glass, (3) larger objective lens — in that order. A 50mm objective on a low-quality scope will not outperform a 40mm on a high-quality scope.' },
        { title: 'The 1/3 Rule', body: 'For precision applications, spend as much on your optic as you spent on your rifle. A $3,000 rifle with a $300 scope is limited by the scope. A $1,200 rifle with a $1,500 scope will outshoot the inverse combination. The glass is the limit, not the action.' },
      ].map((item, i) => (
        <div key={i} style={{ marginBottom: '12px', padding: '12px', background: 'rgba(255,255,255,0.02)', border: '0.5px solid ' + theme.border, borderRadius: '4px' }}>
          <div style={{ color: theme.textPrimary, fontFamily: 'monospace', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>{item.title}</div>
          <div style={{ color: theme.textSecondary, fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.7' }}>{item.body}</div>
        </div>
      ))}
    </div>
  );
}

function TurretsSection() {
  // Click values: vary by manufacturer and application — do NOT state any single value as "the standard"
  const adjustments = [
    {
      system: 'MOA',
      common: 'Most common: ¼ MOA per click',
      also: 'Also available: ⅛ MOA (precision/benchrest), ½ MOA (some entry-level hunting)',
      math: '4 clicks of ¼ MOA = 1 MOA ≈ 1.047" at 100 yds',
      note: 'Traditional US standard. Intuitive if you think in inches. Click value varies by model — always verify your specific scope.',
    },
    {
      system: 'MIL / MRAD',
      common: 'Most common: 0.1 MIL per click',
      also: 'Also available: 0.05 MIL on some premium precision scopes',
      math: '10 clicks of 0.1 MIL = 1 MIL = 3.438" at 100 yds',
      note: 'Metric/military standard. Pairs directly with ranging and ballistic calculations. Military-preferred.',
    },
  ];

  const concepts = [
    { term: 'FFP (First Focal Plane)', def: 'Reticle is in the front focal plane and scales with magnification. MIL/MOA subtensions are correct at any power setting. Preferred for precision rifle and PRS competition.' },
    { term: 'SFP (Second Focal Plane)', def: 'Reticle stays constant size regardless of magnification. Subtensions are only correct at one designated power (typically max). Standard for hunting scopes.' },
    { term: 'Capped Turrets', def: 'Protective caps over the adjustment knobs prevent accidental movement. Correct for hunting and field use where precision dialing is not required.' },
    { term: 'Exposed Turrets', def: 'Knobs accessible without caps. Required for tactical and precision use where you need to dial range corrections quickly in the field.' },
    { term: 'Zero Stop', def: 'A mechanical stop prevents the elevation turret from rotating below your zero point. Dial up to range, return to zero by feel without counting clicks. Essential for field precision shooting.' },
    { term: 'MIL-MIL / MOA-MOA Rule', def: 'MIL reticle + MIL turrets. MOA reticle + MOA turrets. Mismatching reticle and turret units forces conversion math during a shot. This is a preventable and costly error.' },
  ];

  return (
    <div>
      <div style={{ color: theme.accent, fontFamily: 'monospace', fontSize: '11px', letterSpacing: '1px', fontWeight: 700, marginBottom: '10px' }}>CLICK VALUES</div>
      <div style={{ background: 'rgba(255,212,59,0.05)', border: '0.5px solid rgba(255,212,59,0.2)', borderRadius: '5px', padding: '10px 12px', marginBottom: '12px' }}>
        <div style={{ color: theme.accent, fontFamily: 'monospace', fontSize: '11px', lineHeight: '1.6' }}>
          Click values vary by manufacturer and model. Always confirm your specific scope's click value before dialing corrections. Do not assume.
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
        {adjustments.map((a, i) => (
          <div key={i} style={{ background: theme.bg, border: '0.5px solid ' + theme.border, borderRadius: '5px', padding: '12px' }}>
            <div style={{ color: theme.accent, fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>{a.system}</div>
            <div style={{ color: theme.textPrimary, fontFamily: 'monospace', fontSize: '12px', fontWeight: 600, marginBottom: '2px' }}>{a.common}</div>
            <div style={{ color: theme.textMuted, fontFamily: 'monospace', fontSize: '11px', marginBottom: '4px' }}>{a.also}</div>
            <div style={{ color: theme.green, fontFamily: 'monospace', fontSize: '11px', marginBottom: '4px' }}>{a.math}</div>
            <div style={{ color: theme.textMuted, fontFamily: 'monospace', fontSize: '11px', lineHeight: '1.5' }}>{a.note}</div>
          </div>
        ))}
      </div>

      <div style={{ color: theme.accent, fontFamily: 'monospace', fontSize: '11px', letterSpacing: '1px', fontWeight: 700, marginBottom: '10px' }}>CONCEPTS</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {concepts.map((c, i) => (
          <div key={i} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '0.5px solid ' + theme.border, borderRadius: '4px' }}>
            <div style={{ color: theme.textPrimary, fontFamily: 'monospace', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>{c.term}</div>
            <div style={{ color: theme.textSecondary, fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.6' }}>{c.def}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ParallaxSection() {
  return (
    <div>
      {[
        { title: 'What Is Parallax?', body: 'Apparent movement of the reticle relative to the target when you shift your eye off the optical axis. If you move your head left-right while looking through a scope and the crosshair appears to move against the target, that is parallax error.' },
        { title: 'Fixed Parallax', body: 'Set at the factory for a specific distance — often 100 yards for rifle scopes, 25–50 yards for pistol red dots. At other distances, some parallax error exists. In practical field use this is rarely significant at expected engagement ranges with consistent cheek weld.' },
        { title: 'Adjustable Objective (AO) / Side Focus', body: 'A dial — either on the objective bell (AO) or on the left side of the turret housing (side focus) — adjusts optical focus to match target distance. When the target is in crisp focus and parallax is zeroed, the reticle will not shift as you move your eye. Essential for precision shooting at variable distances.' },
        { title: 'Red Dots Are Parallax-Free (Within Limits)', body: 'In an RDS, the dot and target share the same focal plane. Your eye position within the optic window does not shift the dot\'s point of impact — within reason. At extreme cant angles, a small amount of parallax exists. At combat-relevant distances (under 200 yards), it is insignificant.' },
        { title: 'Why It Matters at Distance', body: 'At 400 yards with parallax set to 100 yards, parallax error can move your point of aim by several inches depending on head position. At 1,000 yards, the effect scales proportionally. Re-checking parallax before every long-range shot is not pedantry — it is process.' },
      ].map((item, i) => (
        <div key={i} style={{ marginBottom: '10px', padding: '12px', background: 'rgba(255,255,255,0.02)', border: '0.5px solid ' + theme.border, borderRadius: '4px' }}>
          <div style={{ color: theme.textPrimary, fontFamily: 'monospace', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>{item.title}</div>
          <div style={{ color: theme.textSecondary, fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.7' }}>{item.body}</div>
        </div>
      ))}
    </div>
  );
}

function HistorySection() {
  const events = [
    { year: '1880s', text: 'First practical telescopic rifle sights appear, primarily for target shooting. Early designs lack the erector system; adjusting zero required canting the whole scope body. Fragile by modern standards.' },
    { year: 'WWI', text: 'Germany fields scoped rifles far earlier and in greater numbers than Allied forces. German snipers with optics dominate early trench warfare. Captured German scopes — Zeiss and Goerz — become prizes.' },
    { year: 'WWII', text: 'German Zeiss and Hensoldt optics set the global standard. Post-war, German engineers seed American and Japanese optics industries. This influence is still visible in the dominance of German glass in precision applications.' },
    { year: '1950s–60s', text: 'Leupold rises from Portland, Oregon to dominate the American hunting market. Redfield and Weaver are the competitors. The waterproof, nitrogen-purged scope becomes standard. Variable power hunting scopes proliferate.' },
    { year: '1966', text: 'The US fields the AN/PVS-2 "Starlight Scope" in Vietnam — the first widespread military night vision device. Heavy, fragile, and dim by modern standards, but revolutionary.' },
    { year: '1990s', text: 'EoTech holographic sights and Aimpoint red dots change infantry doctrine. The concept of the battle sight zero with iron sights begins its long decline. US infantry begin carrying RDS and ACOG in quantity.' },
    { year: '2003–2010', text: 'The ACOG becomes standard issue for US infantry in Iraq and Afghanistan. Trijicon\'s 4x fixed prism scope with tritium illumination proves itself under severe field conditions.' },
    { year: '2010s', text: 'The LPVO becomes the standard for competition (3-Gun, USPSA) and tactical shooters. Gen 3 NV begins its long descent in price. By 2018, a quality PVS-14 is accessible to serious civilian buyers.' },
    { year: '2020s', text: 'Thermal clip-on systems reach accessible price points. The 1-10x LPVO segment explodes with offerings from dozens of manufacturers. Red dot pistol optics become standard factory options from major handgun makers.' },
  ];

  return (
    <div style={{ position: 'relative', paddingLeft: '20px' }}>
      <div style={{ position: 'absolute', left: '6px', top: 0, bottom: 0, width: '1px', background: theme.border }}/>
      {events.map((e, i) => (
        <div key={i} style={{ marginBottom: '18px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: '-17px', top: '4px', width: '7px', height: '7px', borderRadius: '50%', background: theme.accent, border: '2px solid ' + theme.bg }}/>
          <div style={{ color: theme.accent, fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '4px' }}>{e.year}</div>
          <div style={{ color: theme.textSecondary, fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.7' }}>{e.text}</div>
        </div>
      ))}
    </div>
  );
}

function ChooseByUseSection() {
  const useCases = [
    { use: 'Home Defense / CQB', range: 'Under 25 yards', recommendation: 'Red dot or holographic', reason: 'Magnification is a liability at close range — narrows field of view, tightens eye box, slows acquisition. A 1x RDS with a 4 MOA dot or EoTech 65 MOA ring is faster in every measurable way at room distances.' },
    { use: 'All-Purpose AR', range: '0–300 yards', recommendation: 'LPVO 1-6x or 1-8x', reason: 'The right tool for most civilian use cases. True 1x for home defense scenarios, dial up for any practical distance a .223/5.56 will reach effectively.' },
    { use: 'Hunting — Timber', range: 'Under 200 yards', recommendation: '2-7x or 3-9x, SFP, capped turrets', reason: 'Shots are close, timber is dark. A 40mm objective, quality glass, SFP is sufficient — you are holding, not dialing. Capped turrets prevent accidental adjustment in the field.' },
    { use: 'Hunting — Open Country', range: '100–500+ yards', recommendation: '4-16x, FFP, 50mm+ objective, side focus', reason: 'Longer shots demand magnification and light-gathering. FFP with a ranging reticle allows quick distance estimation. Side focus is essential for accurate parallax correction at variable distances.' },
    { use: 'Precision / PRS', range: '300–1,200+ yards', recommendation: '5-25x or 7-35x, FFP, MIL/MIL, exposed turrets with zero stop', reason: 'Competition-grade precision requires accurate, repeatable adjustments. FFP with MIL reticle and MIL turrets is the functional standard. Zero stop eliminates a catastrophic dialing error. 50mm+ objective for edge-of-day shooting.' },
    { use: 'USPSA / IDPA Pistol', range: '0–25 yards', recommendation: 'Red dot: RMR, 507C, DeltaPoint Pro', reason: 'Carry Optics division transformed USPSA competition. A 3.25 MOA RMR is the benchmark dot. Battery life and durability under slide reciprocation are the selection criteria — not just dot size.' },
    { use: 'Benchrest', range: '100–1,000 yards', recommendation: 'Fixed 36-45x or very high variable', reason: 'The rifle rests mechanically. Field shooting skills are irrelevant. Maximum magnification for group measurement. Very high fixed powers (36x, 45x) that would be impractical in the field are standard here.' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {useCases.map((uc, i) => (
        <div key={i} style={{ background: theme.bg, border: '0.5px solid ' + theme.border, borderRadius: '5px', padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px', gap: '8px' }}>
            <span style={{ color: theme.textPrimary, fontFamily: 'monospace', fontSize: '12px', fontWeight: 700 }}>{uc.use}</span>
            <span style={{ color: theme.textMuted, fontFamily: 'monospace', fontSize: '10px', whiteSpace: 'nowrap', flexShrink: 0 }}>{uc.range}</span>
          </div>
          <div style={{ color: theme.accent, fontFamily: 'monospace', fontSize: '11px', fontWeight: 600, marginBottom: '5px' }}>{'→ ' + uc.recommendation}</div>
          <div style={{ color: theme.textSecondary, fontFamily: 'monospace', fontSize: '11px', lineHeight: '1.6' }}>{uc.reason}</div>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

type SectionId = 'optics' | 'numbers' | 'glass' | 'turrets' | 'parallax' | 'history' | 'chooser';

const NAV_ITEMS: { id: SectionId; label: string }[] = [
  { id: 'optics',   label: 'OPTIC TYPES' },
  { id: 'numbers',  label: 'KEY NUMBERS' },
  { id: 'glass',    label: 'GLASS' },
  { id: 'turrets',  label: 'TURRETS' },
  { id: 'parallax', label: 'PARALLAX' },
  { id: 'history',  label: 'HISTORY' },
  { id: 'chooser',  label: 'BY USE' },
];

const SECTION_TITLES: Record<SectionId, string> = {
  optics:   'Optic Types',
  numbers:  'Reading Scope Designations',
  glass:    'Glass Quality',
  turrets:  'Turrets & Adjustments',
  parallax: 'Parallax',
  history:  'History of Optics',
  chooser:  'Choose by Use Case',
};

export interface FieldGuideOpticsProps {
  onBack: () => void;
}

export function FieldGuideOptics({ onBack }: FieldGuideOpticsProps) {
  const [activeSection, setActiveSection] = useState<SectionId>('optics');

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, fontFamily: 'monospace', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: theme.surface, borderBottom: '0.5px solid ' + theme.border, position: 'sticky', top: 0, zIndex: 10 }}>

        {/* Back + title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 16px', height: '48px' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', fontFamily: 'monospace', fontSize: '18px', padding: '4px 6px 4px 0', lineHeight: 1 }}>←</button>
          <div>
            <div style={{ color: theme.accent, fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px' }}>FIELD GUIDE</div>
            <div style={{ color: theme.textMuted, fontSize: '9px', letterSpacing: '1px' }}>OPTICS</div>
          </div>
        </div>

        {/* Tab strip — underline style, horizontally scrollable */}
        <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', borderTop: '0.5px solid ' + theme.border }}>
          {NAV_ITEMS.map((item) => {
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: active ? '2px solid ' + theme.accent : '2px solid transparent',
                  color: active ? theme.accent : theme.textMuted,
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  fontSize: '10px',
                  fontWeight: active ? 700 : 400,
                  letterSpacing: '0.8px',
                  padding: '10px 14px',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.15s, border-color 0.15s',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '16px 16px 32px' }}>

        {/* Section heading */}
        <div style={{ color: theme.textPrimary, fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '16px' }}>
          {SECTION_TITLES[activeSection].toUpperCase()}
        </div>

        {activeSection === 'optics' && (
          <div>
            <div style={{ color: theme.textMuted, fontFamily: 'monospace', fontSize: '11px', marginBottom: '12px' }}>
              {OPTIC_TYPES.length + ' types covered. Tap to expand.'}
            </div>
            {OPTIC_TYPES.map((optic) => (
              <AccordionCard key={optic.id} optic={optic} />
            ))}
          </div>
        )}

        {activeSection === 'numbers'  && <KeyNumbersSection />}
        {activeSection === 'glass'    && <GlassQualitySection />}
        {activeSection === 'turrets'  && <TurretsSection />}
        {activeSection === 'parallax' && <ParallaxSection />}
        {activeSection === 'history'  && <HistorySection />}
        {activeSection === 'chooser'  && <ChooseByUseSection />}
      </div>
    </div>
  );
}
