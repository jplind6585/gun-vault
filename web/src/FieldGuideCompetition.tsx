import { useState } from 'react';
import { theme } from './theme';

type Discipline = 'Pistol' | 'Rifle' | 'Shotgun' | 'Multi-Gun' | 'Rimfire' | 'Multi-Discipline' | 'Multi';

interface CompFormat {
  id: string;
  name: string;
  founded: string;
  org: string;
  disciplines: Discipline[];
  description: string[];
}

const HISTORICAL_FORMATS: CompFormat[] = [
  {
    id: 'palma',
    name: 'Palma Match',
    founded: '1876',
    org: 'International / NRA',
    disciplines: ['Rifle'],
    description: [
      'International long-range rifle competition established in 1876 between the United States and Britain — predating the NRA\'s first President\'s Match and most organized American shooting sport.',
      'Shot at 800, 900, and 1000 yards using iron sights only, on issue-pattern service rifles. Modern rules permit .308 Winchester or .223 Remington in a standardized platform.',
      'The US Palma team has dominated internationally across multiple eras. The competitive pressure of the Palma Match directly influenced development of specialized .308 Winchester match loads and established the long-range iron sight tradition that influenced NRA High Power.',
    ],
  },
  {
    id: 'camp-perry',
    name: 'National Matches at Camp Perry',
    founded: '1903',
    org: 'NRA / Civilian Marksmanship Program (CMP)',
    disciplines: ['Rifle'],
    description: [
      'The oldest continuous national shooting competition in the United States, held annually at Camp Perry, Ohio since 1903 — with interruptions only for the World Wars.',
      'Originally conceived to prepare citizen soldiers for military service, the Matches were funded in part by the US Army. Events include the President\'s Match, the Wimbledon Cup (1000-yard iron sights), and the National Trophy Individual Match.',
      'The M1 Garand Games remain popular among collectors and students of military history. Camp Perry is ground zero for American rifle tradition — an enormous event that still draws thousands of competitors each summer.',
    ],
  },
  {
    id: 'bullseye',
    name: 'NRA Bullseye (Precision Pistol)',
    founded: '~1900',
    org: 'NRA',
    disciplines: ['Pistol'],
    description: [
      'The oldest organized pistol sport in America. Three stages per gun: slow fire (10 shots, 10 minutes), timed fire (5 shots, 20 seconds), and rapid fire (5 shots, 10 seconds), at 25 and 50 yards. Fired one-handed.',
      'The three-gun aggregate — .22 LR, .38 Special or 9mm centerfire, and .45 ACP — totals 2700 points maximum. Master-class shooters routinely approach that number. The precision demanded is extraordinary.',
      'Bullseye produced more Olympic pistol shooters than any other American format and remains the technical foundation for precision pistol shooting. The grip, trigger control, and sight alignment fundamentals are transferable to any discipline.',
    ],
  },
  {
    id: 'olympic',
    name: 'Olympic Shooting',
    founded: '1896',
    org: 'ISSF (International Shooting Sport Federation)',
    disciplines: ['Multi-Discipline'],
    description: [
      'Shooting has been part of the modern Olympics since Athens 1896, making it one of the oldest continuously contested Olympic sports. Disciplines have changed over the decades — live pigeon shooting appeared once and was discontinued.',
      'Current events include 10m air pistol and air rifle, 25m rapid-fire pistol, 50m rifle 3-position, 10m air rifle mixed team, trap, and skeet.',
      'The equipment is specialized to a degree that makes competition hardware irrelevant outside the discipline — electronic triggers with ounce-weight pull weights, anatomically fitted grips, stocks with micro-adjustable cheekpieces. A 10m air rifle in full ISU configuration bears almost no practical relationship to a firearm.',
    ],
  },
  {
    id: 'ipsc',
    name: 'IPSC (International Practical Shooting Confederation)',
    founded: '1976',
    org: 'IPSC',
    disciplines: ['Pistol', 'Multi'],
    description: [
      'Founded at the 1976 Columbia Conference in Missouri by Jeff Cooper, Ray Chapman, Thell Reed, Mike Dalton, and others. Built around Cooper\'s "Practical Shooting" philosophy: accuracy, power, and speed in balance — the Dilemma.',
      'Introduced the concept of moving through stages with multiple targets at varying distances rather than static bullseye shooting. The Power Factor system penalized underpowered ammunition by scoring minor-power hits differently than major.',
      'IPSC today is the largest practical shooting organization in the world with over 100 member nations. The rules have evolved considerably from Cooper\'s original vision — the Open division race guns of today would be unrecognizable to the founders — but the fundamental stage format remains.',
    ],
  },
  {
    id: 'steel-challenge',
    name: 'Steel Challenge',
    founded: '1981',
    org: 'SCSA / USPSA (since 2012)',
    disciplines: ['Pistol', 'Rimfire'],
    description: [
      'Founded in 1981 in California by Mike Dalton and Mickey Fowler. Five steel plates arranged in a specific pattern unique to each of eight stages; the shooter must engage all plates and finish on the large stop plate.',
      'Five-string format — run the stage five times, drop the worst string, count the best four. Pure speed: no movement, no position requirements, no tactics. The format rewards trigger technique and target transitions above everything else.',
      'The SCSA became a division of USPSA in 2012. Rimfire divisions (rimfire pistol, rimfire rifle open and iron) have made Steel Challenge enormously popular as an entry-level competition — a .22 LR pistol and a club membership are the barriers to entry.',
    ],
  },
  {
    id: 'bianchi-cup',
    name: 'Bianchi Cup',
    founded: '1979',
    org: 'NRA',
    disciplines: ['Pistol'],
    description: [
      'Founded by holster craftsman and shooter John Bianchi in 1979 at the Columbia Missouri Shooting Range. The "World Action Pistol Championship" features four courses of fire: Practical (standing and kneeling at 10-50 yards), Barricade (from cover), Falling Plate (six 8-inch plates at 10-35 yards), and Moving Target.',
      'Shot with iron sights only, one pistol only. No optics divisions. Produces some of the tightest practical pistol shooting in the game — top competitors routinely shoot perfect or near-perfect scores across all four events.',
      'The Bianchi Cup is a technical showcase: the combination of speed and precision required, with iron sights only, separates accomplished shooters from exceptional ones. Limited to semi-automatic pistols in dominant configuration.',
    ],
  },
  {
    id: 'silhouette',
    name: 'Metallic Silhouette',
    founded: '1950s (Mexico) / 1970s (US)',
    org: 'NRA',
    disciplines: ['Rifle', 'Pistol', 'Rimfire'],
    description: [
      'Originated in Mexico in the 1950s as a hunting simulation — knock over steel animal silhouettes at distance on a timer. Chicken at 200 meters, pig at 300, turkey at 385, ram at 500.',
      'Migrated to the US and was formalized by the NRA in the 1970s. The sport spawned handgun silhouette (Thompson/Center Contender single-shot pistols at the same distances) and rimfire variants at reduced distances.',
      'The game rewards natural shooting ability over technical rules interpretation. There is no partial credit, no points for close — the animal either falls or it does not. This binary result makes the sport unforgiving and honest.',
    ],
  },
  {
    id: 'cowboy-action',
    name: 'Cowboy Action Shooting (SASS)',
    founded: '1987',
    org: 'Single Action Shooting Society (SASS)',
    disciplines: ['Multi-Gun'],
    description: [
      'Founded informally in 1981 and formalized as SASS in 1987. Shooters use period-correct firearms designed or manufactured before 1899 (or replicas): single-action revolver, lever-action rifle, and pump or double-barrel shotgun.',
      'Costumes and shooting aliases are required. Theatrical stages set in the American West — bank robberies, saloon shootouts, range disputes. The sport introduced millions of shooters to older firearm designs and to the mechanics of single-action revolvers.',
      'The founders include actors and Hollywood-adjacent personalities who wanted a theatrical shooting game. SASS remains one of the most accessible and family-friendly shooting sports — the emphasis is on fun and costuming as much as competition.',
    ],
  },
];

const MODERN_FORMATS: CompFormat[] = [
  {
    id: 'uspsa',
    name: 'USPSA',
    founded: '1984',
    org: 'United States Practical Shooting Association',
    disciplines: ['Pistol', 'Multi'],
    description: [
      'Broke from IPSC in 1984 over rule disagreements and has since become the dominant practical shooting organization in the US. Scoring is "Comstock" — points scored divided by time, rewarding both speed and accuracy simultaneously.',
      'Divisions span the equipment spectrum: Open (optics, compensators, extended magazines — the race gun division), Limited (no optics, larger mags), Production (stock or near-stock pistols), Carry Optics (RDS allowed), Revolver, and PCC (pistol-caliber carbine).',
      'Stage design rewards movement, stage reading, and target engagement order as much as raw shooting skill. The Open division has driven extraordinary technical development in semi-automatic pistol hardware — compensated 2011-pattern race guns, optical sights, and extended magazines are the norm at the top level.',
    ],
  },
  {
    id: 'idpa',
    name: 'IDPA',
    founded: '1996',
    org: 'International Defensive Pistol Association',
    disciplines: ['Pistol'],
    description: [
      'Founded in 1996 by Bill Wilson, Walt Rauch, Ken Hackathorn, Larry Vickers, and others frustrated with USPSA\'s drift toward equipment-intensive race guns. Intended to simulate real defensive scenarios with practical, street-legal equipment.',
      'Rules require shooting from concealment, limit magazine capacity, and mandate reloading to slide-lock in most situations (no "tactical reloads" that preserve ammunition at the expense of speed). Classifications: BUG, SSP, ESP, CCP, CDP, REV, PCC.',
      'Criticized by some as artificially restricting equipment and creating unrealistic administrative rules. Praised by others as the discipline that keeps practical shooting accessible to competitors running duty guns and carry equipment. IDPA remains the entry point for many defensive-minded shooters.',
    ],
  },
  {
    id: 'prs',
    name: 'Precision Rifle Series (PRS)',
    founded: '2012',
    org: 'PRS',
    disciplines: ['Rifle'],
    description: [
      'Founded in 2012, the PRS exploded in popularity through 2015-2020 and spawned an entire industry segment. Bolt-action rifle stages shot from field positions — barricades, awkward rests, vehicles, rooftops — at steel targets from 300 to 1200+ yards.',
      '6.5 Creedmoor dominates the field because it fits short-action platforms, has excellent long-range performance (high BC, moderate recoil), and factory match ammunition is widely available. Stages are time-limited with points awarded per hit.',
      'PRS drove the modern precision rifle hardware industry: chassis systems, field-capable tripods, specialized exposed turrets with zero stops, and the entire .308 and 6.5mm match ammunition market. The PRS Pro Series is the highest competitive level; an extensive regional league system feeds into it.',
    ],
  },
  {
    id: 'nrl',
    name: 'National Rifle League (NRL)',
    founded: '2016',
    org: 'NRL',
    disciplines: ['Rifle', 'Rimfire'],
    description: [
      'A competitor to PRS with a somewhat different stage design philosophy — NRL emphasizes field positions and natural terrain use. Founded in 2016 and has grown steadily alongside PRS rather than replacing it.',
      'NRL22 is the rimfire league under the NRL umbrella — .22 LR bolt-action rifles shot from field positions at steel targets from 25 to 100+ yards. The entry cost is a fraction of centerfire precision: a quality .22 target rifle, a scope, and rimfire ammunition.',
      'NRL22X uses larger-bore rimfire calibers (.17 HMR, .22 WMR) for extended range. The league structure mirrors PRS with local club matches and a national championship. NRL22 has brought thousands of new shooters into precision rifle as a direct, affordable entry point.',
    ],
  },
  {
    id: 'three-gun',
    name: '3-Gun / Multi-Gun',
    founded: '1990s',
    org: 'Various (MGM, 3GN, local clubs)',
    disciplines: ['Multi-Gun'],
    description: [
      'Uses rifle, pistol, and shotgun in the same stage — sometimes simultaneously, sometimes in sequence. Shotgun load selection matters: birdshot for cardboard and clay birds, slug transitions for steel at distance. Stage design can require running hundreds of yards while managing three guns.',
      'The sport rewards equipment selection almost as much as shooting skill. Divisions range from Tactical (iron sights, stock guns) to Open (optics on everything, extended shotgun tubes, compensated rifles) and the growing Heavy Optics division.',
      'Physically demanding in a way that no other shooting sport matches — stages often require sprinting, crawling, climbing, and transitioning between three firearms under time pressure. Multi-Gun is as much an athletic event as a shooting event.',
    ],
  },
  {
    id: 'fclass',
    name: 'F-Class',
    founded: '2000s',
    org: 'F-Class International / NRA',
    disciplines: ['Rifle'],
    description: [
      'Prone position, bipod or front rest allowed, rear bag — no sling. Created by Canadian shooter George "Farky" Farquharson (the "F" is for Farky) to allow older or less-mobile shooters to compete at long-range prone without the demanding sling position required in traditional NRA Prone.',
      'F-Open allows any caliber and any front rest or bipod. F-TR requires .308 Winchester or .223 Remington with a bipod only (no front rest). Shot at 300, 600, and 1000 yards on standard NRA/ICFRA targets.',
      'F-Class is ground zero for handload development. The competitive pressure drives extraordinary attention to precision: case sorting by weight, seating depth experiments in thousandths of an inch, primer lot testing. No other format produces as much handloading knowledge.',
    ],
  },
  {
    id: 'benchrest',
    name: 'Benchrest',
    founded: '1944',
    org: 'NBRSA / IBS',
    disciplines: ['Rifle'],
    description: [
      'The most precise form of rifle shooting. The rifle rests entirely on mechanical front and rear bags — no sling, no bipod, no physical contact beyond trigger finger and light forward hand. Group size is measured in thousandths of an inch with calipers.',
      'The smallest recorded 100-yard groups are under 0.1 inch — five shots in one hole indistinguishable to the naked eye. Barrel life is measured in hundreds of rounds; a benchrest barrel may be replaced after 300 firings. Single-shot bolt actions chambered in wildcats (6 PPC, 6 BR, .222 Rem Mag) dominate.',
      'Benchrest has produced more advances in rifle accuracy than any other discipline: consistent case forming, seating depth precision, primer selection methodology, barrel bedding, and the validation of match-grade components. Most of what competitive shooters know about accuracy comes from benchrest.',
    ],
  },
  {
    id: 'nrl22',
    name: 'NRL22',
    founded: '2018',
    org: 'NRL',
    disciplines: ['Rimfire'],
    description: [
      'The rimfire precision league under the NRL umbrella, launched in 2018. Uses .22 LR bolt-action rifles shot from field positions at steel targets from 25 to 100+ yards. Match format is nearly identical to PRS and NRL centerfire competition.',
      'Entry cost is genuinely accessible: a quality .22 LR target rifle (CZ 457, Vudoo, Bergara B-14R) with a quality scope, and bulk quality rimfire ammunition. The barrier that gates precision rifle to a narrow demographic does not exist in NRL22.',
      'The community has grown to hundreds of clubs and thousands of registered competitors. Many centerfire PRS shooters use NRL22 as dry-fire-equivalent trigger time between major matches. The technique transfer is high and the cost to shoot is a fraction of .308 or 6.5 Creedmoor.',
    ],
  },
  {
    id: 'scsa-modern',
    name: 'SCSA (Steel Challenge)',
    founded: 'USPSA division since 2012',
    org: 'Steel Challenge Shooting Association / USPSA',
    disciplines: ['Pistol', 'Rimfire'],
    description: [
      'Under the USPSA umbrella since 2012. See historical entry for the format origin. Rimfire pistol (iron and optics) and rimfire rifle divisions have expanded the sport massively beyond its centerfire origins.',
      'A top rimfire shooter in Steel Challenge Open division is as technically refined as any pistol shooter alive. The .22 LR\'s near-zero recoil removes recoil management from the equation entirely — what remains is pure trigger technique, grip consistency, and target transition efficiency.',
      'SCSA is one of the most clock-honest sports in shooting. Five strings, drop the worst — the timer does not negotiate. Top competitors in Rimfire Pistol Open shoot strings in under two seconds across all eight stages.',
    ],
  },
  {
    id: 'nra-action-pistol',
    name: 'NRA Action Pistol',
    founded: '1985',
    org: 'NRA',
    disciplines: ['Pistol'],
    description: [
      'The NRA\'s practical pistol format, distinct from Bullseye. Includes the Bianchi Cup format courses of fire plus the NRA Action Pistol Championships. A disciplined bridge between the pure precision of Bullseye and the speed game of USPSA.',
      'Iron sights only in traditional configuration. Single pistol for the entire competition. The moving target event separates this format from static precision disciplines — tracking a moving target and breaking shots cleanly is a skill unto itself.',
      'NRA Action Pistol has produced some of the most technically complete practical pistol shooters. The iron-sights requirement and single-gun format ensure that equipment cannot substitute for fundamental skill.',
    ],
  },
];

interface FormatCardProps {
  format: CompFormat;
}

const DISCIPLINE_COLORS: Record<string, string> = {
  Pistol: theme.blue,
  Rifle: theme.green,
  Shotgun: theme.orange,
  'Multi-Gun': theme.red,
  Rimfire: theme.accent,
  'Multi-Discipline': '#b197fc',
  Multi: theme.textSecondary,
};

function FormatCard({ format }: FormatCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        background: theme.surface,
        border: '1px solid ' + (expanded ? 'rgba(255,212,59,0.3)' : theme.border),
        borderRadius: '6px',
        marginBottom: '10px',
        overflow: 'hidden',
        transition: 'border-color 0.2s ease',
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          padding: '14px 16px',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'monospace',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            <div
              style={{
                color: theme.accent,
                fontSize: '14px',
                fontWeight: 700,
                letterSpacing: '0.3px',
                marginBottom: '5px',
              }}
            >
              {format.name}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span
                style={{
                  color: theme.textMuted,
                  fontSize: '10px',
                  letterSpacing: '0.5px',
                }}
              >
                {'Est. ' + format.founded}
              </span>
              <span style={{ color: theme.border, fontSize: '10px' }}>|</span>
              <span
                style={{
                  color: theme.textSecondary,
                  fontSize: '10px',
                  letterSpacing: '0.3px',
                }}
              >
                {format.org}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '7px' }}>
              {format.disciplines.map((d) => (
                <span
                  key={d}
                  style={{
                    fontSize: '9px',
                    fontFamily: 'monospace',
                    letterSpacing: '0.8px',
                    color: DISCIPLINE_COLORS[d] || theme.textMuted,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid ' + (DISCIPLINE_COLORS[d] ? DISCIPLINE_COLORS[d] + '44' : theme.border),
                    borderRadius: '3px',
                    padding: '2px 6px',
                    fontWeight: 600,
                  }}
                >
                  {d.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
          <span
            style={{
              color: theme.textMuted,
              fontSize: '14px',
              marginTop: '2px',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              display: 'inline-block',
              minWidth: '14px',
            }}
          >
            ▼
          </span>
        </div>
      </button>

      {expanded && (
        <div style={{ padding: '0 16px 16px 16px' }}>
          <div
            style={{
              borderTop: '1px solid ' + theme.border,
              paddingTop: '12px',
            }}
          />
          {format.description.map((para, i) => (
            <p
              key={i}
              style={{
                color: theme.textSecondary,
                fontSize: '13px',
                fontFamily: 'monospace',
                lineHeight: '1.75',
                margin: '0 0 10px 0',
              }}
            >
              {para}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

type TabId = 'historical' | 'modern';

export interface FieldGuideCompetitionProps {
  onBack: () => void;
}

export function FieldGuideCompetition({ onBack }: FieldGuideCompetitionProps) {
  const [tab, setTab] = useState<TabId>('historical');

  const formats = tab === 'historical' ? HISTORICAL_FORMATS : MODERN_FORMATS;

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
              COMPETITION FORMATS
            </div>
          </div>
        </div>

        {/* Tab toggle */}
        <div
          style={{
            display: 'flex',
            gap: '0',
            marginBottom: '12px',
            background: theme.bg,
            borderRadius: '6px',
            padding: '3px',
            border: '1px solid ' + theme.border,
            width: 'fit-content',
          }}
        >
          {(['historical', 'modern'] as TabId[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: tab === t ? theme.accent : 'transparent',
                border: 'none',
                borderRadius: '4px',
                color: tab === t ? theme.bg : theme.textMuted,
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '1px',
                padding: '6px 18px',
                transition: 'all 0.15s ease',
                textTransform: 'uppercase',
              }}
            >
              {t === 'historical' ? 'HISTORICAL' : 'MODERN'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '16px', maxWidth: '800px', width: '100%', margin: '0 auto' }}>

        {/* Section label */}
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <div
            style={{
              color: tab === 'historical' ? theme.orange : theme.green,
              fontFamily: 'monospace',
              fontSize: '11px',
              letterSpacing: '1.5px',
              fontWeight: 700,
            }}
          >
            {tab === 'historical' ? 'HISTORICAL FORMATS' : 'MODERN FORMATS'}
          </div>
          <div
            style={{
              color: theme.textMuted,
              fontFamily: 'monospace',
              fontSize: '10px',
            }}
          >
            {formats.length + ' formats — tap to expand'}
          </div>
        </div>

        {/* Discipline legend */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '16px',
            padding: '10px 12px',
            background: theme.surface,
            border: '1px solid ' + theme.border,
            borderRadius: '5px',
          }}
        >
          {Object.entries(DISCIPLINE_COLORS).map(([disc, color]) => (
            <div
              key={disc}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: color,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  color: theme.textMuted,
                  fontFamily: 'monospace',
                  fontSize: '9px',
                  letterSpacing: '0.5px',
                }}
              >
                {disc.toUpperCase()}
              </span>
            </div>
          ))}
        </div>

        {/* Format cards */}
        {formats.map((format) => (
          <FormatCard key={format.id} format={format} />
        ))}

        {/* Footer note */}
        <div
          style={{
            marginTop: '24px',
            padding: '12px',
            background: 'rgba(255,212,59,0.04)',
            border: '1px solid rgba(255,212,59,0.12)',
            borderRadius: '5px',
          }}
        >
          <div
            style={{
              color: theme.textMuted,
              fontFamily: 'monospace',
              fontSize: '11px',
              lineHeight: '1.7',
            }}
          >
            {tab === 'historical'
              ? 'Many historical formats remain active today. "Historical" refers to founding era, not current status. Camp Perry, Bullseye, IPSC, and Steel Challenge all hold active competitions.'
              : 'Modern formats are in active competition. Rules, divisions, and scoring evolve frequently — verify current rules with the governing organization before competing.'}
          </div>
        </div>
      </div>
    </div>
  );
}
