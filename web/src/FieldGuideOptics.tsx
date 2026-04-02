import { useState } from 'react';
import { theme } from './theme';

interface OpticType {
  id: string;
  name: string;
  body: string[];
  pros: string[];
  cons: string[];
  examples: string[];
  tags: string[];
}

const OPTIC_TYPES: OpticType[] = [
  {
    id: 'iron-sights',
    name: 'Iron Sights',
    body: [
      'The baseline of all shooting: a front post and a rear notch or aperture. No batteries, no magnification, no parallax, no failure modes beyond physical damage.',
      'Required proficiency before moving to optics — if you cannot shoot irons, you cannot diagnose problems when your optic fails. Ghost ring apertures are standard on AR-pattern rifles; blade/notch configurations dominate pistols.',
      'Regulated at the factory for a specific distance and ammo type. Most service rifle irons are adjustable for elevation and windage via a tool or fingernail.',
    ],
    pros: ['No batteries', 'Rugged and lightweight', 'Always work', 'Co-witness baseline for optics'],
    cons: ['No magnification', 'Slow on distant targets', 'Eye strain in low light', 'Rear/front/target — three focal planes your eye cannot hold simultaneously'],
    examples: ['A2 rear sight (AR-15)', 'Troy BUIS', 'Magpul MBUS', 'Glock factory sights', 'XS Big Dot'],
    tags: ['PISTOL', 'RIFLE', 'SHOTGUN'],
  },
  {
    id: 'red-dot',
    name: 'Red Dot Sight (RDS)',
    body: [
      'A non-magnifying optic that uses an LED to project a dot onto a partially-reflective lens. The dot appears to be at the same focal plane as the target — the optic is effectively parallax-free within its rated distance (typically 50-100 yards for pistol dots, 200+ for rifle-mounted).',
      '1 MOA dots for precision applications, 2-4 MOA for speed. Smaller dots are harder to find quickly; larger dots obscure more of the target at distance.',
      'Battery life is the key operational metric. Aimpoint Micro T-2: 5 years on one CR2032 at medium setting. Holosun 507C: 50,000 hours. Trijicon RMR Type 2: auto-adjust mode extends battery to years.',
      'Co-witnessing with irons: absolute co-witness (dot aligns with irons at full height), lower-1/3 co-witness (dot sits above irons, irons visible in lower third of window). Lower-1/3 is preferred on AR uppers for a more natural shooting position.',
    ],
    pros: ['True one-focal-plane aiming', 'Fast target acquisition', 'Works with both eyes open', 'Excellent battery life (quality units)', 'Parallax-free within rated range'],
    cons: ['No magnification', 'Battery dependent (most)', 'Astigmatic shooters may see a starburst instead of a dot', 'Smaller window than holographic'],
    examples: ['Trijicon RMR Type 2', 'Aimpoint Micro T-2', 'Holosun 507C / 509T', 'Leupold DeltaPoint Pro', 'Sig Sauer ROMEO5'],
    tags: ['PISTOL', 'RIFLE', 'CQB', 'CARRY'],
  },
  {
    id: 'holographic',
    name: 'Holographic Sight',
    body: [
      'A laser projects a reticle pattern onto holographic film embedded in the lens. The mechanism is fundamentally different from an RDS — the reticle is not reflected; it is reconstructed by the laser.',
      'The critical advantage: the hologram works at extreme angles. If any part of the lens is in your field of view, the reticle is on target. This matters in extreme stress positions where your cheek weld is inconsistent.',
      'The reticle survives a shattered lens — because the hologram IS the lens. A cracked EoTech will still work.',
      'EoTech is the category standard. The 512 and 552 use AA batteries; the 553/XPS use CR123. Battery life is the major trade-off vs. RDS — EoTechs burn through batteries measurably faster than comparable Aimpoints.',
    ],
    pros: ['Largest effective window of any non-magnified optic', 'Functions at extreme cant and off-axis', 'Reticle survives shattered glass', 'Fast acquisition', 'Compatible with magnifiers'],
    cons: ['Poor battery life vs. RDS', 'Heavier', 'Thermal drift issues (EoTech had documented POI shift in temperature extremes — 2015 settlement)', 'More expensive than equivalent RDS'],
    examples: ['EoTech 512', 'EoTech XPS2', 'EoTech EXPS3 (NV compatible)', 'Vortex AMG UH-1'],
    tags: ['RIFLE', 'CQB', 'MILITARY', 'LE'],
  },
  {
    id: 'prism',
    name: 'Prism Scope',
    body: [
      'Uses a prism to focus the image rather than the erector lens system used in traditional scopes. Fixed magnification — typically 1x, 3x, or 5x.',
      'The critical advantage for a significant portion of shooters: the reticle is etched into glass, not projected by an LED. Astigmatic shooters who see a starburst with RDS see a clean, crisp reticle through a prism scope. Illumination is supplemental, not primary.',
      'More compact than a variable scope at the same magnification. The ACOG (Trijicon Advanced Combat Optical Gunsight) is the military benchmark — fixed 4x with a tritium/fiber-optic illuminated reticle. No battery required under any conditions.',
      'Limited by fixed magnification — you pick your role and commit.',
    ],
    pros: ['Works for astigmatic shooters', 'No battery required (ACOG)', 'Compact at magnification', 'Rugged — fewer moving parts than variable', 'Etched reticle always visible'],
    cons: ['Fixed magnification (no flexibility)', 'Eye box can be unforgiving', 'More expensive per magnification than variable scopes', 'Limited field of view vs. RDS at 1x'],
    examples: ['Trijicon ACOG (TA31, TA33)', 'Vortex Spitfire 3x', 'Primary Arms 5x Compact Prism', 'Steiner P4Xi (fixed 4x)'],
    tags: ['RIFLE', 'MILITARY', 'MEDIUM-RANGE'],
  },
  {
    id: 'lpvo',
    name: 'LPVO — Low Power Variable Optic',
    body: [
      'Variable magnification starting at true 1x and ranging up to 4x, 6x, 8x, or 10x. The Swiss Army knife of rifle optics — true 1x for CQB with both eyes open, dial up for distance shots.',
      'FFP vs. SFP matters significantly in an LPVO. A FFP reticle scales with magnification — at 1x the reticle is very small and the subtensions are correct at any power. A SFP reticle stays the same apparent size, but the MIL or MOA holds are only correct at the designated power (usually max).',
      'Quality LPVOs are expensive precisely because manufacturing a true 1x with zero distortion is difficult. Budget LPVOs often have optical distortion at 1x, making them effectively false-1x optics. The eye box tightens dramatically at higher magnification.',
      'Schmidt & Bender, Nightforce NX8, and Vortex Razor are benchmarks. Expect to pay $800-$3000 for quality glass. Heavy compared to RDS — a quality LPVO with mount runs 18-24 oz.',
    ],
    pros: ['True versatility across CQB to 600+ yards', 'One optic solution', 'FFP allows ranging at any power', 'Growing selection at multiple price points'],
    cons: ['Heavy', 'Tight eye box at high magnification', 'Quality glass is expensive', 'FFP reticle is tiny at 1x', 'Not as fast as RDS at CQB'],
    examples: ['Vortex Razor HD Gen III 1-10x', 'Nightforce NX8 1-8x', 'Schmidt & Bender PM II 1-8x', 'Leupold Mark 6 1-6x', 'Sig Tango6T 1-6x'],
    tags: ['RIFLE', 'VERSATILE', 'COMPETITION', 'TACTICAL'],
  },
  {
    id: 'variable-scope',
    name: 'Variable Magnification Scope',
    body: [
      'The classic configuration: 3-9x, 4-16x, 5-25x, and beyond. The objective lens diameter (the number after "x") determines light-gathering. An erector assembly adjusts point of impact via internal lenses.',
      'Glass quality varies enormously and drives the price delta between a $150 Bushnell and a $3,000 Nightforce. The variables: lens coatings (FMC is the standard), glass type (ED/HD glass reduces chromatic aberration), and manufacturing tolerances in the erector assembly.',
      'Repeatability of adjustments is critical for precision use — a scope that does not return to zero after dialing is useless for tactical shooting. Benchmark test: shoot a box (up 10 MIL, right 10 MIL, down 10 MIL, left 10 MIL, back to zero) and verify POI returns.',
      'The 3-9x40 configuration dominated hunting for 50 years and remains the most common scope sold. The 4-16x and 5-25x configurations have grown as precision rifle competition expanded.',
    ],
    pros: ['Maximum range versatility', 'Large selection at all price points', 'High-magnification precision capability', 'Proven long-range accuracy platform'],
    cons: ['Heavy at high magnification', 'More optical surfaces = more potential distortion', 'Eye box at max power can be unforgiving', 'Requires solid, quality rings and mount'],
    examples: ['Nightforce ATACR 5-25x56', 'Vortex Viper PST II 5-25x50', 'Leupold Mark 5HD 5-25x56', 'Bushnell Elite Tactical XRS3 4.5-30x', 'Schmidt & Bender PMII 5-25x56'],
    tags: ['RIFLE', 'HUNTING', 'PRECISION', 'PRS'],
  },
  {
    id: 'fixed-power',
    name: 'Fixed Power Scope',
    body: [
      'No magnification ring, no variable assembly. A single magnification — typically 6x, 10x, 12x, or more exotic fixed powers like 36x and 45x for benchrest.',
      'Simplicity is the design advantage: fewer glass elements, fewer moving parts, often better light transmission than an equivalent variable at the same power due to fewer optical surfaces. A 10x fixed can outperform a 3-12x variable at 10x if the glass quality is comparable.',
      'The classic precision fixed powers are 10x (Leupold Mark 4 M1, Unertl 10x) and the sniper tradition of using fixed optics for battlefield predictability. Fixed power scopes are still preferred by some military shooters who want guaranteed performance.',
      'Benchrest competition uses very high fixed powers (36x-45x) where the goal is group size, not versatility.',
    ],
    pros: ['Simpler — fewer failure points', 'Better light transmission per optical surface', 'Lighter than comparable variable', 'Less expensive at equivalent glass quality'],
    cons: ['No versatility — what you bought is what you get', 'Wrong magnification for a scenario is a liability', 'Limited selection vs. variable market'],
    examples: ['Leupold Mark 4 M1 10x40', 'Unertl 10x USMC Sniper Scope', 'March 10x52 Fixed', 'Nightforce 12x42 Fixed', 'Leupold 36x competition fixed'],
    tags: ['RIFLE', 'PRECISION', 'BENCHREST', 'MILITARY'],
  },
  {
    id: 'night-vision',
    name: 'Night Vision (NV/NODS)',
    body: [
      'Image intensifier tubes amplify ambient light (starlight, moonlight, IR illumination) through a photocathode and microchannel plate, producing a viewable image. The technology works by amplifying photons — it requires some ambient light source.',
      'Generations: Gen 1 (consumer-grade, significant image distortion, limited tube life, significant halo around bright spots), Gen 2 (transitional, better MCP), Gen 3 (US military standard, gallium arsenide photocathode with microchannel plate — dramatically better resolution and tube life). Film-less Gen 3 removes the ion barrier film for improved sensitivity at a tube life trade-off.',
      'White Phosphor vs. Green Phosphor: Green is the traditional output color and what most operators trained on. White (gray-scale) provides more natural contrast discrimination — many users prefer it. Neither has a clear tactical superiority.',
      'Auto-gating: a circuit that rapidly cycles the tube voltage when hit with sudden bright light (flashlight, muzzle flash) to prevent tube damage and white-out. Essential for tactical use.',
      'Laser aiming devices (MAWL, PEQ-15, DBAL) emit an IR laser beam invisible to the naked eye. Only visible through NV. IR illuminators flood an area with IR light to extend capability in near-total darkness.',
    ],
    pros: ['Operates in darkness', 'Passively detects using ambient light', 'Long track record of military validation', 'Can be used helmet-mounted (hands-free)'],
    cons: ['Expensive (quality Gen 3: $3,000-$10,000+)', 'Requires some ambient light or IR illuminator', 'Cannot see through glass or foliage', 'Export-controlled (ITARregulations)'],
    examples: ['PVS-14 (monocular)', 'GPNVG-18 (quad-tube panoramic)', 'RNVG (ruggedized NVG)', 'MAWL-C1+ (laser device)', 'PEQ-15 (laser device)'],
    tags: ['RIFLE', 'TACTICAL', 'MILITARY', 'NIGHT'],
  },
  {
    id: 'thermal',
    name: 'Thermal',
    body: [
      'Detects heat signature rather than reflected light. A microbolometer sensor measures infrared radiation emitted by objects. Works in total darkness, through smoke, and through light fog — conditions that defeat NV.',
      'Resolution is measured in pixels: 320x240 (entry-level), 640x480 (mid-tier), 1280x1024 (high-end). Refresh rate matters for moving targets — 60Hz handles fast movement well; 9Hz or 30Hz may show lag.',
      'Critical limitation: thermal cannot see through glass. Car windshields, building windows, and optical glass appear opaque or nearly opaque to thermal. A target behind a window is invisible.',
      'Not subject to ITAR restrictions like Gen 3 NV — more accessible for civilian purchase. Used increasingly in hunting (where legal — varies by state), property security, and search and rescue.',
      'Clip-on thermal (COTI, FLIR Breach) mounts in front of existing optics. Weapon-mounted thermal scopes (Pulsar, FLIR) are standalone. Thermal cannot be used for precise aiming as well as NV — no laser ranging, no fine reticle — but it finds what NV misses.',
    ],
    pros: ['Works in total darkness', 'Cuts through smoke and fog', 'No IR illuminator needed', 'Not ITAR-controlled', 'Detects hidden humans regardless of camouflage'],
    cons: ['Cannot see through glass', 'Resolution lower than NV at equivalent price', 'Image is heat-map, not photographic detail', 'Slower refresh at entry price points', 'Battery intensive'],
    examples: ['Pulsar Thermion 2 XP50', 'FLIR RS64 2.25-9x35mm', 'ATN Thor 4 640', 'Sig Sauer Echo3 Thermal', 'FLIR Breach PTQ136'],
    tags: ['RIFLE', 'HUNTING', 'SECURITY', 'NIGHT'],
  },
  {
    id: 'magnifiers',
    name: 'Magnifiers',
    body: [
      'A magnifying optic mounted behind an RDS, typically 3x (Aimpoint 3x-C, Vortex VMX-3T, EoTech G33). Some are 5x or 6x for additional reach.',
      'Flip-to-side mount: a lever-actuated mount swings the magnifier 90 degrees clear of the sight line. In the folded position, pure RDS performance. Swing into position for 3x precision.',
      'Works with most red dot sights but eye box becomes critical — some RDS and magnifier combinations produce poor image quality or field of view. Aimpoint and EoTech with their respective magnifiers are validated combinations.',
      'The concept originated in military use: a patrol rifle with an M68 red dot and an Aimpoint magnifier gives capability at 300 yards without the weight and bulk of an LPVO.',
    ],
    pros: ['Converts CQB optic to 3x in one motion', 'Lighter than LPVO', 'Simple system — failure of magnifier still leaves functional RDS', 'Fast transition between 1x and 3x'],
    cons: ['3x is limited vs. an LPVO at 4-6x', 'Eye box is tight with magnifier', 'Adds bulk and weight', 'Cost of RDS + magnifier + mount approaches LPVO territory'],
    examples: ['Aimpoint 3x-C with TwistMount', 'Vortex VMX-3T', 'EoTech G33 Magnifier', 'Surefire Slip-On Magnifier 3x'],
    tags: ['RIFLE', 'TACTICAL', 'MILITARY', 'VERSATILE'],
  },
];

interface KeyNumber {
  label: string;
  value: string;
  note: string;
}

interface SectionData {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface AccordionCardProps {
  optic: OpticType;
}

function AccordionCard({ optic }: AccordionCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        background: theme.surface,
        border: '1px solid ' + (open ? theme.accent : theme.border),
        borderRadius: '6px',
        marginBottom: '8px',
        overflow: 'hidden',
        transition: 'border-color 0.2s ease',
      }}
    >
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
          fontFamily: 'monospace',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <span
            style={{
              color: theme.accent,
              fontWeight: 700,
              fontSize: '14px',
              letterSpacing: '0.5px',
            }}
          >
            {optic.name}
          </span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {optic.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: '9px',
                  fontFamily: 'monospace',
                  letterSpacing: '0.8px',
                  color: theme.textMuted,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid ' + theme.border,
                  borderRadius: '3px',
                  padding: '1px 5px',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <span
          style={{
            color: theme.textMuted,
            fontSize: '16px',
            marginLeft: '12px',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            display: 'inline-block',
          }}
        >
          ▼
        </span>
      </button>

      {open && (
        <div style={{ padding: '0 16px 16px 16px' }}>
          <div
            style={{
              borderTop: '1px solid ' + theme.border,
              paddingTop: '14px',
              marginBottom: '14px',
            }}
          />

          {optic.body.map((para, i) => (
            <p
              key={i}
              style={{
                color: theme.textSecondary,
                fontSize: '13px',
                fontFamily: 'monospace',
                lineHeight: '1.7',
                margin: '0 0 10px 0',
              }}
            >
              {para}
            </p>
          ))}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '14px' }}>
            <div>
              <div
                style={{
                  fontSize: '10px',
                  letterSpacing: '1px',
                  color: theme.green,
                  fontFamily: 'monospace',
                  marginBottom: '8px',
                  fontWeight: 600,
                }}
              >
                PROS
              </div>
              {optic.pros.map((p, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: theme.textSecondary,
                    marginBottom: '5px',
                    paddingLeft: '14px',
                    position: 'relative',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      color: theme.green,
                    }}
                  >
                    +
                  </span>
                  {p}
                </div>
              ))}
            </div>
            <div>
              <div
                style={{
                  fontSize: '10px',
                  letterSpacing: '1px',
                  color: theme.red,
                  fontFamily: 'monospace',
                  marginBottom: '8px',
                  fontWeight: 600,
                }}
              >
                CONS
              </div>
              {optic.cons.map((c, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: theme.textSecondary,
                    marginBottom: '5px',
                    paddingLeft: '14px',
                    position: 'relative',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      color: theme.red,
                    }}
                  >
                    −
                  </span>
                  {c}
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '14px' }}>
            <div
              style={{
                fontSize: '10px',
                letterSpacing: '1px',
                color: theme.accent,
                fontFamily: 'monospace',
                marginBottom: '8px',
                fontWeight: 600,
              }}
            >
              NOTABLE EXAMPLES
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {optic.examples.map((ex, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: theme.textPrimary,
                    background: 'rgba(255,212,59,0.07)',
                    border: '1px solid rgba(255,212,59,0.2)',
                    borderRadius: '4px',
                    padding: '3px 8px',
                  }}
                >
                  {ex}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KeyNumbersSection() {
  return (
    <div>
      <p
        style={{
          color: theme.textSecondary,
          fontSize: '13px',
          fontFamily: 'monospace',
          lineHeight: '1.7',
          margin: '0 0 16px 0',
        }}
      >
        A scope marked <span style={{ color: theme.accent, fontWeight: 700 }}>3-9x40</span> encodes three numbers. Here is what each means.
      </p>

      <div
        style={{
          background: theme.bg,
          border: '1px solid ' + theme.border,
          borderRadius: '6px',
          padding: '16px',
          marginBottom: '16px',
          fontFamily: 'monospace',
          display: 'flex',
          gap: '0',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ color: theme.accent, fontSize: '28px', fontWeight: 700 }}>3</span>
        <span style={{ color: theme.textMuted, fontSize: '20px', margin: '0 2px' }}>-</span>
        <span style={{ color: theme.green, fontSize: '28px', fontWeight: 700 }}>9</span>
        <span style={{ color: theme.textMuted, fontSize: '20px', margin: '0 2px' }}>x</span>
        <span style={{ color: theme.orange, fontSize: '28px', fontWeight: 700 }}>40</span>
      </div>

      {[
        {
          color: theme.accent,
          label: '3 — Minimum Magnification',
          body: 'The lowest power setting. At 1x, targets appear at natural size. At 3x, they appear 3 times closer. A scope with a 1x minimum is a true LPVO.',
        },
        {
          color: theme.green,
          label: '9 — Maximum Magnification',
          body: 'The highest power setting. The greater the max power, the smaller the field of view and the tighter the required eye box.',
        },
        {
          color: theme.orange,
          label: '40 — Objective Lens Diameter (mm)',
          body: 'The diameter of the forward-facing lens. Larger objective = more light gathered. A 50mm objective gathers 56% more light than a 40mm at equivalent magnification.',
        },
      ].map((item, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '12px',
            alignItems: 'flex-start',
          }}
        >
          <div
            style={{
              width: '4px',
              minWidth: '4px',
              borderRadius: '2px',
              background: item.color,
              alignSelf: 'stretch',
              minHeight: '40px',
            }}
          />
          <div>
            <div
              style={{
                color: item.color,
                fontFamily: 'monospace',
                fontSize: '13px',
                fontWeight: 700,
                marginBottom: '4px',
              }}
            >
              {item.label}
            </div>
            <div
              style={{
                color: theme.textSecondary,
                fontFamily: 'monospace',
                fontSize: '12px',
                lineHeight: '1.6',
              }}
            >
              {item.body}
            </div>
          </div>
        </div>
      ))}

      <div
        style={{
          background: theme.bg,
          border: '1px solid ' + theme.border,
          borderRadius: '6px',
          padding: '14px',
          marginTop: '8px',
        }}
      >
        <div
          style={{
            color: theme.accent,
            fontFamily: 'monospace',
            fontSize: '11px',
            letterSpacing: '1px',
            fontWeight: 700,
            marginBottom: '10px',
          }}
        >
          EXIT PUPIL FORMULA
        </div>
        <div
          style={{
            color: theme.textSecondary,
            fontFamily: 'monospace',
            fontSize: '12px',
            lineHeight: '1.7',
          }}
        >
          Exit pupil (mm) = Objective diameter ÷ Magnification
        </div>
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            { label: '9x40 (max power):', value: '40 ÷ 9 = 4.4mm', note: 'Good for daylight — human eye ~3mm in bright sun' },
            { label: '3x40 (min power):', value: '40 ÷ 3 = 13.3mm', note: 'Wider than your pupil; no benefit beyond ~7mm in total darkness' },
            { label: '4x50 (hunting scope):', value: '50 ÷ 4 = 12.5mm', note: 'Aperture-limited by the eye — but feels brighter at dusk' },
          ].map((row, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '130px 100px 1fr',
                gap: '8px',
                fontSize: '11px',
                fontFamily: 'monospace',
                lineHeight: '1.5',
              }}
            >
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
    { name: 'Coated', desc: 'One anti-reflection layer on at least one surface. Minimum acceptable.' },
    { name: 'Fully Coated', desc: 'At least one layer on all air-to-glass surfaces. Better.' },
    { name: 'Multi-Coated', desc: 'Multiple layers on at least one surface. Good.' },
    { name: 'Fully Multi-Coated (FMC)', desc: 'Multiple layers on all air-to-glass surfaces. The standard to require.' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '18px' }}>
        <div
          style={{
            color: theme.accent,
            fontFamily: 'monospace',
            fontSize: '11px',
            letterSpacing: '1px',
            fontWeight: 700,
            marginBottom: '10px',
          }}
        >
          LENS COATINGS — HIERARCHY
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {coatings.map((c, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                padding: '10px 12px',
                background: i === coatings.length - 1 ? 'rgba(255,212,59,0.06)' : 'rgba(255,255,255,0.02)',
                borderRadius: '4px',
                border: '1px solid ' + (i === coatings.length - 1 ? 'rgba(255,212,59,0.2)' : theme.border),
              }}
            >
              <span
                style={{
                  color: i === coatings.length - 1 ? theme.accent : theme.textMuted,
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  fontWeight: i === coatings.length - 1 ? 700 : 400,
                  minWidth: '160px',
                }}
              >
                {c.name}
              </span>
              <span
                style={{
                  color: theme.textSecondary,
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  lineHeight: '1.5',
                }}
              >
                {c.desc}
              </span>
            </div>
          ))}
        </div>
      </div>

      {[
        {
          title: 'ED / Extra-Low Dispersion Glass',
          body: 'Reduces chromatic aberration — the color fringing visible at high magnification where red and blue wavelengths focus at slightly different points. Particularly noticeable on high-contrast targets (dark bird against bright sky, barrel against white paper). ED glass is a meaningful improvement at 10x+; minimal benefit below 6x.',
        },
        {
          title: 'What "Brightness" Actually Means',
          body: 'Brightness claims in marketing are largely meaningless. Transmission percentage is the real metric — a quality scope transmits 90-95% of incoming light. The path to more light is: (1) better coatings, (2) ED glass, (3) larger objective lens. In that order. A 50mm objective on a low-quality scope will not outperform a 40mm on a high-quality scope.',
        },
        {
          title: 'The 1/3 Rule',
          body: 'For precision applications, spend as much on your optic as you spent on your rifle. A $3,000 precision rifle with a $300 scope is limited by the scope. A $1,200 rifle with a $1,500 scope will outshoot the inverse combination. The glass is the limit, not the action.',
        },
      ].map((item, i) => (
        <div
          key={i}
          style={{
            marginBottom: '14px',
            padding: '12px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid ' + theme.border,
            borderRadius: '4px',
          }}
        >
          <div
            style={{
              color: theme.textPrimary,
              fontFamily: 'monospace',
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '6px',
            }}
          >
            {item.title}
          </div>
          <div
            style={{
              color: theme.textSecondary,
              fontFamily: 'monospace',
              fontSize: '12px',
              lineHeight: '1.7',
            }}
          >
            {item.body}
          </div>
        </div>
      ))}
    </div>
  );
}

function TurretsSection() {
  const adjustments = [
    {
      system: 'MOA',
      standard: '1/4 MOA per click',
      math: '4 clicks = 1 MOA ≈ 1" at 100 yds',
      note: 'Traditional US standard. Intuitive if you think in inches.',
    },
    {
      system: 'MIL / MRAD',
      standard: '0.1 MIL per click',
      math: '10 clicks = 1 MIL = 3.438" at 100 yds',
      note: 'Metric/military standard. Pairs with ranging and ballistic calculations.',
    },
    {
      system: '1/8 MOA',
      standard: '1/8 MOA per click',
      math: '8 clicks = 1 MOA ≈ 1" at 100 yds',
      note: 'Benchrest and ultra-precision applications.',
    },
  ];

  const concepts = [
    {
      term: 'FFP (First Focal Plane)',
      def: 'Reticle is in the front focal plane and scales with magnification. MIL/MOA subtensions are correct at any magnification setting. Preferred for precision rifle and PRS.',
    },
    {
      term: 'SFP (Second Focal Plane)',
      def: 'Reticle stays constant size regardless of magnification. Subtensions only correct at one designated power (typically max). Standard for hunting scopes.',
    },
    {
      term: 'Capped Turrets',
      def: 'Protective caps over the adjustment knobs prevent accidental movement. Correct for hunting and field use where precision dialing is not required.',
    },
    {
      term: 'Exposed Turrets',
      def: 'Knobs are unprotected and easily accessible. Correct for tactical and precision use where you need to dial range corrections quickly.',
    },
    {
      term: 'Zero Stop',
      def: 'A mechanical stop prevents the elevation turret from rotating below your zero point. You can dial up to your max range and return to zero by feel without counting clicks. Essential for field precision shooting.',
    },
    {
      term: 'Match System Rule',
      def: 'MIL reticle + MIL turrets. MOA reticle + MOA turrets. Mismatching forces conversion math mid-shot. This is a preventable error.',
    },
  ];

  return (
    <div>
      <div
        style={{
          color: theme.accent,
          fontFamily: 'monospace',
          fontSize: '11px',
          letterSpacing: '1px',
          fontWeight: 700,
          marginBottom: '10px',
        }}
      >
        CLICK VALUES
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginBottom: '20px',
        }}
      >
        {adjustments.map((a, i) => (
          <div
            key={i}
            style={{
              background: theme.bg,
              border: '1px solid ' + theme.border,
              borderRadius: '5px',
              padding: '12px',
              display: 'grid',
              gridTemplateColumns: '80px 1fr',
              gap: '12px',
              alignItems: 'start',
            }}
          >
            <div
              style={{
                color: theme.accent,
                fontFamily: 'monospace',
                fontSize: '13px',
                fontWeight: 700,
              }}
            >
              {a.system}
            </div>
            <div>
              <div
                style={{
                  color: theme.textPrimary,
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '3px',
                }}
              >
                {a.standard}
              </div>
              <div
                style={{
                  color: theme.green,
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  marginBottom: '3px',
                }}
              >
                {a.math}
              </div>
              <div
                style={{
                  color: theme.textMuted,
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  lineHeight: '1.5',
                }}
              >
                {a.note}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          color: theme.accent,
          fontFamily: 'monospace',
          fontSize: '11px',
          letterSpacing: '1px',
          fontWeight: 700,
          marginBottom: '10px',
        }}
      >
        CONCEPTS
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {concepts.map((c, i) => (
          <div
            key={i}
            style={{
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid ' + theme.border,
              borderRadius: '4px',
            }}
          >
            <div
              style={{
                color: theme.textPrimary,
                fontFamily: 'monospace',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '4px',
              }}
            >
              {c.term}
            </div>
            <div
              style={{
                color: theme.textSecondary,
                fontFamily: 'monospace',
                fontSize: '12px',
                lineHeight: '1.6',
              }}
            >
              {c.def}
            </div>
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
        {
          title: 'What Is Parallax?',
          body: 'Apparent movement of the reticle relative to the target when you shift your eye off the optical axis. If you move your head left-right while looking through a scope and the crosshair appears to move against the target, that is parallax error.',
        },
        {
          title: 'Fixed Parallax',
          body: 'Set at the factory for a specific distance — often 100 yards for rifle scopes, 25-50 yards for pistol red dots. At distances other than the fixed parallax distance, there will be some parallax error. In practical field use this is rarely significant at expected engagement ranges with consistent cheek weld.',
        },
        {
          title: 'Adjustable Objective (AO) / Side Focus',
          body: 'A dial (either on the objective bell — AO — or on the left side of the turret housing — side focus) that adjusts the optical focus to match your target distance. When the target is in crisp focus and parallax is zeroed, the reticle will not move against the target as you move your eye. Essential for precision shooting at variable distances.',
        },
        {
          title: 'Red Dots Are Parallax-Free (Mostly)',
          body: 'In a red dot sight, the dot and the target are on the same focal plane. Your eye position within the optic window does not shift the dot\'s point of impact — within reason. At extreme angles or with significant lens distortion, a small amount of parallax error exists. At combat-relevant distances (under 200 yards), it is insignificant.',
        },
        {
          title: 'Why It Matters at Distance',
          body: 'At 400 yards with parallax set to 100 yards, parallax error can move your point of aim by several inches depending on head position. At 1000 yards, the effect is proportionally larger. The precision shooter\'s discipline of re-checking parallax adjustment before every long-range shot is not pedantry — it is process.',
        },
      ].map((item, i) => (
        <div
          key={i}
          style={{
            marginBottom: '12px',
            padding: '12px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid ' + theme.border,
            borderRadius: '4px',
          }}
        >
          <div
            style={{
              color: theme.textPrimary,
              fontFamily: 'monospace',
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '6px',
            }}
          >
            {item.title}
          </div>
          <div
            style={{
              color: theme.textSecondary,
              fontFamily: 'monospace',
              fontSize: '12px',
              lineHeight: '1.7',
            }}
          >
            {item.body}
          </div>
        </div>
      ))}
    </div>
  );
}

function HistorySection() {
  const events = [
    { year: '1880s', text: 'First practical telescopic rifle sights appear, primarily for target shooting. Early designs lack the erector system; you had to cant the whole scope body to adjust. Fragile by modern standards.' },
    { year: 'WWI', text: 'Germany fields scoped rifles far earlier and in greater numbers than Allied forces. German snipers with optics dominate early trench warfare. The Allies scramble to catch up. Captured German scopes — Zeiss and Goerz — become prizes.' },
    { year: 'WWII', text: 'German Zeiss and Hensoldt optics set the global standard. Allied snipers used captured Zf.41 and Zf.4 scopes when possible. Post-war, German engineers seed American and Japanese optics industries.' },
    { year: '1950s–60s', text: 'Leupold rises from Portland, Oregon to dominate the American hunting market. Redfield and Weaver are the competitors. The waterproof, nitrogen-purged scope becomes standard. Variable power hunting scopes proliferate.' },
    { year: '1966', text: 'The US fields the AN/PVS-2 "Starlight Scope" in Vietnam — the first widespread military night vision device. Image intensifier technology, Gen 0/1. Heavy, fragile, and dim by modern standards, but revolutionary.' },
    { year: '1990s', text: 'EoTech holographic sights and Aimpoint red dots change infantry doctrine. The concept of the "battle sight zero" with iron sights begins its slow decline. By the Gulf War, US infantry are beginning to carry RDS or ACOG in quantity.' },
    { year: '2003–2010', text: 'The ACOG becomes standard issue for US infantry in Iraq and Afghanistan. Trijicon\'s 4x fixed prism scope with tritium illumination proves itself under severe conditions. The era of scoped combat rifles begins in earnest.' },
    { year: '2010s', text: 'The LPVO becomes the standard for competition (3-Gun, USPSA Carry Optics) and then tactical shooters. NV Gen 3 tubes begin their long, slow descent in price. By 2018, a quality PVS-14 is accessible to serious civilian buyers.' },
    { year: '2020s', text: 'Thermal clip-on systems become affordable. Digital NV improves but still trails analog Gen 3 in low-light sensitivity. The 1-10x LPVO segment explodes with offerings from a dozen manufacturers. Red dot pistol optics become standard factory options from major manufacturers.' },
  ];

  return (
    <div style={{ position: 'relative', paddingLeft: '20px' }}>
      <div
        style={{
          position: 'absolute',
          left: '6px',
          top: 0,
          bottom: 0,
          width: '1px',
          background: theme.border,
        }}
      />
      {events.map((e, i) => (
        <div key={i} style={{ marginBottom: '18px', position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              left: '-17px',
              top: '4px',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: theme.accent,
              border: '2px solid ' + theme.bg,
            }}
          />
          <div
            style={{
              color: theme.accent,
              fontFamily: 'monospace',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.5px',
              marginBottom: '4px',
            }}
          >
            {e.year}
          </div>
          <div
            style={{
              color: theme.textSecondary,
              fontFamily: 'monospace',
              fontSize: '12px',
              lineHeight: '1.7',
            }}
          >
            {e.text}
          </div>
        </div>
      ))}
    </div>
  );
}

function ChooseByUseSection() {
  const useCases = [
    {
      use: 'Home Defense / CQB',
      range: 'Under 25 yards',
      recommendation: 'Red dot or holographic',
      reason: 'Magnification is a liability at close range — it narrows field of view, tightens eye box, and slows acquisition. A 1x RDS with a 65 MOA ring (EoTech) or 4 MOA dot is faster in every measurable way at room distances.',
      color: theme.red,
    },
    {
      use: 'All-Purpose AR',
      range: '0–300 yards',
      recommendation: 'LPVO 1-6x or 1-8x',
      reason: 'The right tool for most civilian use cases. True 1x for home defense scenarios, dial up for any practical distance a .223/5.56 will reach effectively.',
      color: theme.orange,
    },
    {
      use: 'Hunting — Woods',
      range: 'Under 200 yards',
      recommendation: '2-7x or 3-9x, SFP, capped turrets',
      reason: 'Shots are close, timber is dark. A 40mm objective, quality glass, SFP is fine because you are not dialing — you are holding. Capped turrets protect against brushing adjustments in the field.',
      color: theme.green,
    },
    {
      use: 'Hunting — Open Country',
      range: '100–500+ yards',
      recommendation: '4-16x, FFP, 50-56mm objective, side focus',
      reason: 'Longer shots demand magnification and light-gathering. FFP with a ranging reticle allows quick distance estimation. Side focus is essential for accurate shooting at variable distances. The additional weight is justified.',
      color: theme.green,
    },
    {
      use: 'Precision / PRS',
      range: '300–1200+ yards',
      recommendation: '5-25x or 7-35x, FFP, MIL/MIL, exposed turrets with zero stop',
      reason: 'Competition-grade precision requires accurate, repeatable adjustments. FFP with MIL reticle and MIL turrets is the functional standard. Zero stop eliminates a catastrophic dialing error. 50mm+ objective for edge-of-day shooting.',
      color: theme.blue,
    },
    {
      use: 'Competition — USPSA / IDPA',
      range: '0–25 yards (pistol)',
      recommendation: 'Red dot on pistol (RMR, 507C); 1x or LPVO on carbine',
      reason: 'Carry Optics division has transformed USPSA pistol competition. A 3.25 MOA RMR is the benchmark. On a carbine, a 1x RDS or short LPVO keeps target transitions fast while enabling hits at distance.',
      color: theme.accent,
    },
    {
      use: 'Benchrest',
      range: '100–1000 yards',
      recommendation: 'Fixed 36-45x or very high variable',
      reason: 'The rifle rests mechanically — a front rest and rear bag. Field shooting skills are irrelevant. Maximum magnification for group measurement. Scopes often not mounted in traditional rings but in specialized mounts.',
      color: theme.textMuted,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {useCases.map((uc, i) => (
        <div
          key={i}
          style={{
            background: theme.bg,
            border: '1px solid ' + theme.border,
            borderLeft: '3px solid ' + uc.color,
            borderRadius: '5px',
            padding: '12px 14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
            <span
              style={{
                color: uc.color,
                fontFamily: 'monospace',
                fontSize: '13px',
                fontWeight: 700,
              }}
            >
              {uc.use}
            </span>
            <span
              style={{
                color: theme.textMuted,
                fontFamily: 'monospace',
                fontSize: '10px',
                letterSpacing: '0.5px',
              }}
            >
              {uc.range}
            </span>
          </div>
          <div
            style={{
              color: theme.accent,
              fontFamily: 'monospace',
              fontSize: '12px',
              fontWeight: 600,
              marginBottom: '6px',
            }}
          >
            {'→ ' + uc.recommendation}
          </div>
          <div
            style={{
              color: theme.textSecondary,
              fontFamily: 'monospace',
              fontSize: '12px',
              lineHeight: '1.6',
            }}
          >
            {uc.reason}
          </div>
        </div>
      ))}
    </div>
  );
}

type SectionId = 'optics' | 'numbers' | 'glass' | 'turrets' | 'parallax' | 'history' | 'chooser';

interface NavItem {
  id: SectionId;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'optics', label: 'OPTIC TYPES' },
  { id: 'numbers', label: 'KEY NUMBERS' },
  { id: 'glass', label: 'GLASS' },
  { id: 'turrets', label: 'TURRETS' },
  { id: 'parallax', label: 'PARALLAX' },
  { id: 'history', label: 'HISTORY' },
  { id: 'chooser', label: 'BY USE CASE' },
];

export interface FieldGuideOpticsProps {
  onBack: () => void;
}

export function FieldGuideOptics({ onBack }: FieldGuideOpticsProps) {
  const [activeSection, setActiveSection] = useState<SectionId>('optics');

  return (
    <div
      style={{
        minHeight: '100vh',
        background: theme.bg,
        fontFamily: 'monospace',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: theme.surface,
          borderBottom: '1px solid ' + theme.border,
          padding: '0 16px',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            height: '52px',
          }}
        >
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: theme.textMuted,
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: '20px',
              padding: '4px',
              lineHeight: 1,
            }}
          >
            ←
          </button>
          <div>
            <div
              style={{
                color: theme.accent,
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '1.5px',
              }}
            >
              FIELD GUIDE
            </div>
            <div
              style={{
                color: theme.textMuted,
                fontSize: '10px',
                letterSpacing: '1px',
              }}
            >
              OPTICS
            </div>
          </div>
        </div>

        {/* Nav scroll */}
        <div
          style={{
            display: 'flex',
            gap: '4px',
            overflowX: 'auto',
            paddingBottom: '10px',
            scrollbarWidth: 'none',
          }}
        >
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              style={{
                background: activeSection === item.id ? theme.accent : 'transparent',
                border: '1px solid ' + (activeSection === item.id ? theme.accent : theme.border),
                borderRadius: '4px',
                color: activeSection === item.id ? theme.bg : theme.textMuted,
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.8px',
                padding: '5px 10px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '16px', maxWidth: '800px', width: '100%', margin: '0 auto' }}>
        {activeSection === 'optics' && (
          <div>
            <div
              style={{
                color: theme.textMuted,
                fontFamily: 'monospace',
                fontSize: '11px',
                letterSpacing: '0.5px',
                marginBottom: '16px',
              }}
            >
              {'Tap any type to expand. ' + OPTIC_TYPES.length + ' types covered.'}
            </div>
            {OPTIC_TYPES.map((optic) => (
              <AccordionCard key={optic.id} optic={optic} />
            ))}
          </div>
        )}

        {activeSection === 'numbers' && (
          <div>
            <div
              style={{
                color: theme.textPrimary,
                fontFamily: 'monospace',
                fontSize: '15px',
                fontWeight: 700,
                letterSpacing: '1px',
                marginBottom: '16px',
              }}
            >
              READING SCOPE DESIGNATIONS
            </div>
            <KeyNumbersSection />
          </div>
        )}

        {activeSection === 'glass' && (
          <div>
            <div
              style={{
                color: theme.textPrimary,
                fontFamily: 'monospace',
                fontSize: '15px',
                fontWeight: 700,
                letterSpacing: '1px',
                marginBottom: '16px',
              }}
            >
              GLASS QUALITY
            </div>
            <GlassQualitySection />
          </div>
        )}

        {activeSection === 'turrets' && (
          <div>
            <div
              style={{
                color: theme.textPrimary,
                fontFamily: 'monospace',
                fontSize: '15px',
                fontWeight: 700,
                letterSpacing: '1px',
                marginBottom: '16px',
              }}
            >
              TURRETS {'&'} ADJUSTMENTS
            </div>
            <TurretsSection />
          </div>
        )}

        {activeSection === 'parallax' && (
          <div>
            <div
              style={{
                color: theme.textPrimary,
                fontFamily: 'monospace',
                fontSize: '15px',
                fontWeight: 700,
                letterSpacing: '1px',
                marginBottom: '16px',
              }}
            >
              PARALLAX
            </div>
            <ParallaxSection />
          </div>
        )}

        {activeSection === 'history' && (
          <div>
            <div
              style={{
                color: theme.textPrimary,
                fontFamily: 'monospace',
                fontSize: '15px',
                fontWeight: 700,
                letterSpacing: '1px',
                marginBottom: '16px',
              }}
            >
              HISTORY OF OPTICS
            </div>
            <HistorySection />
          </div>
        )}

        {activeSection === 'chooser' && (
          <div>
            <div
              style={{
                color: theme.textPrimary,
                fontFamily: 'monospace',
                fontSize: '15px',
                fontWeight: 700,
                letterSpacing: '1px',
                marginBottom: '16px',
              }}
            >
              HOW TO CHOOSE
            </div>
            <ChooseByUseSection />
          </div>
        )}
      </div>
    </div>
  );
}
