import React, { useState } from 'react';
import { theme } from './theme';

type Category = 'FUNDAMENTALS' | 'POSITIONS' | 'WIND_DOPE' | 'TRIGGER' | 'DRY_FIRE' | 'CONDITIONS';

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'FUNDAMENTALS', label: 'FUNDAMENTALS' },
  { id: 'POSITIONS', label: 'POSITIONS' },
  { id: 'WIND_DOPE', label: 'WIND & DOPE' },
  { id: 'TRIGGER', label: 'TRIGGER' },
  { id: 'DRY_FIRE', label: 'DRY FIRE' },
  { id: 'CONDITIONS', label: 'CONDITIONS' },
];

interface CardProps {
  title: string;
  number?: number;
  children: React.ReactNode;
}

function DocCard({ title, number, children }: CardProps) {
  return (
    <div style={{
      background: theme.surface,
      border: '1px solid ' + theme.border,
      borderRadius: '6px',
      padding: '16px',
      marginBottom: '12px',
      fontFamily: 'monospace',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '10px',
      }}>
        {number !== undefined && (
          <span style={{
            background: theme.accent,
            color: '#07071a',
            fontFamily: 'monospace',
            fontSize: '13px',
            fontWeight: 700,
            borderRadius: '3px',
            padding: '2px 7px',
            flexShrink: 0,
          }}>
            {number}
          </span>
        )}
        <span style={{
          color: theme.accent,
          fontFamily: 'monospace',
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '1px',
          textTransform: 'uppercase' as const,
        }}>
          {title}
        </span>
      </div>
      <div style={{
        color: theme.textSecondary,
        fontFamily: 'monospace',
        fontSize: '13px',
        lineHeight: 1.7,
      }}>
        {children}
      </div>
    </div>
  );
}

function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ color: theme.accent, fontWeight: 700 }}>{children}</span>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      color: theme.textMuted,
      fontFamily: 'monospace',
      fontSize: '10px',
      fontWeight: 600,
      letterSpacing: '2px',
      textTransform: 'uppercase' as const,
      padding: '16px 0 6px 0',
      borderBottom: '1px solid ' + theme.border,
      marginBottom: '12px',
    }}>
      {children}
    </div>
  );
}

function FundamentalsContent() {
  return (
    <div>
      <SectionHeading>TC 3-22.9 — The Four Fundamentals</SectionHeading>

      <DocCard title="Steady Position" number={1}>
        <p style={{ margin: '0 0 8px 0' }}>
          The foundation. The rifle must be supported and stable before a shot can be fired accurately.
          A solid position removes the shooter as a variable.
        </p>
        <p style={{ margin: '0 0 8px 0' }}>
          <Highlight>Natural Point of Aim (NPOA):</Highlight> when the shooter is fully relaxed, the rifle
          naturally points somewhere. That point should be on the target — force creates inconsistency.
        </p>
        <p style={{ margin: 0 }}>
          Adjust your body, not the rifle, to achieve NPOA.
        </p>
      </DocCard>

      <DocCard title="Aiming" number={2}>
        <p style={{ margin: '0 0 8px 0' }}>
          Two components: <Highlight>sight alignment</Highlight> and <Highlight>sight picture</Highlight>.
        </p>
        <p style={{ margin: '0 0 8px 0' }}>
          Sight alignment: the relationship between the front sight and rear sight (or the reticle center).
          Sight picture: sight alignment superimposed on the target.
        </p>
        <p style={{ margin: '0 0 8px 0' }}>
          For iron sights, the eye can only focus at one distance —{' '}
          <Highlight>focus on the front sight</Highlight>, accept a blurry target and rear sight.
        </p>
        <p style={{ margin: 0 }}>
          For scopes, the reticle and target appear on the same focal plane.
        </p>
      </DocCard>

      <DocCard title="Breath Control" number={3}>
        <p style={{ margin: '0 0 8px 0' }}>
          Breathing moves the muzzle. The <Highlight>respiratory pause</Highlight> — the natural pause
          between exhale and inhale — is the optimal window to fire. It lasts 2–4 seconds.
        </p>
        <p style={{ margin: '0 0 8px 0' }}>
          Holding breath past <Highlight>8–10 seconds</Highlight> degrades visual acuity as CO2 builds.
        </p>
        <p style={{ margin: 0 }}>
          For precision fire: take a breath, let half out, pause, fire.
        </p>
      </DocCard>

      <DocCard title="Trigger Control" number={4}>
        <p style={{ margin: '0 0 8px 0' }}>
          The most common source of shot deviation. The trigger must be pressed{' '}
          <Highlight>straight to the rear</Highlight> without disturbing sight alignment.
        </p>
        <p style={{ margin: '0 0 8px 0' }}>
          <Highlight>Surprise break</Highlight> — the shot should fire as a near-surprise; anticipating
          the shot causes flinching. Slack, then steady increasing pressure.
        </p>
        <p style={{ margin: 0 }}>
          Do not stop — a paused trigger pull often leads to a jerk to complete it.
        </p>
      </DocCard>

      <SectionHeading>Follow-Through</SectionHeading>

      <DocCard title="Follow-Through">
        <p style={{ margin: '0 0 8px 0' }}>
          Not officially one of the four fundamentals but equally important. Maintaining position,
          sight picture, and trigger contact <Highlight>after the shot breaks</Highlight>.
        </p>
        <p style={{ margin: '0 0 8px 0' }}>
          The bullet is still in the barrel during recoil — the muzzle must not move until the bullet exits.
        </p>
        <p style={{ margin: 0 }}>
          <Highlight>Calling your shot:</Highlight> the sight picture at the moment of firing tells you
          where the bullet went. Develop this habit; it eliminates alibis.
        </p>
      </DocCard>

      <SectionHeading>Natural Point of Aim — Expanded</SectionHeading>

      <DocCard title="NPOA Drill">
        <p style={{ margin: '0 0 8px 0' }}>
          Close your eyes. Settle into your position. Open your eyes. Where is the muzzle pointing?
          That is your NPOA. If it is not on target, <Highlight>move your body — not your rifle</Highlight>.
        </p>
        <p style={{ margin: '0 0 8px 0' }}>
          For prone: pivot around your non-firing elbow.{' '}
          For standing: rotate your feet.
        </p>
        <p style={{ margin: 0 }}>
          Re-check NPOA after every position change.{' '}
          <Highlight>A position held by muscle tension is not a position — it is a fight you will lose.</Highlight>
        </p>
      </DocCard>
    </div>
  );
}

function PositionsContent() {
  return (
    <div>
      <SectionHeading>Field Positions</SectionHeading>

      <DocCard title="Prone">
        <p style={{ margin: '0 0 8px 0' }}>
          The most stable field position. Body flat, non-firing elbow directly under the rifle,
          firing elbow out at a natural angle.
        </p>
        <p style={{ margin: '0 0 8px 0' }}>
          <Highlight>Sling tension</Highlight> (hasty or loop) reduces muscle input.
          Low profile — reduces exposure.
        </p>
        <p style={{ margin: '0 0 8px 0' }}>
          Limitations: cannot see over tall grass or obstacles; slow to enter and exit.
        </p>
        <p style={{ margin: 0 }}>
          The <Highlight>loop sling</Highlight> (through the arm, not just over the shoulder) adds
          mechanical stability and is worth learning.
        </p>
      </DocCard>

      <DocCard title="Prone Supported (Bipod/Bag)">
        <p style={{ margin: '0 0 8px 0' }}>
          Prone with a bipod under the forend and a rear bag under the stock.{' '}
          <Highlight>The precision rifle standard.</Highlight>
        </p>
        <p style={{ margin: '0 0 8px 0' }}>
          <Highlight>Load the bipod into the ground</Highlight> — push forward slightly so the
          bipod legs are loaded. Rear bag under the heel of the stock, grip pressure applied downward.
          The rifle floats between these two points.
        </p>
        <p style={{ margin: 0 }}>
          <Highlight>Vertical reticle alignment is critical</Highlight> — canting the rifle shifts POI.
        </p>
      </DocCard>

      <DocCard title="Sitting">
        <p style={{ margin: '0 0 8px 0' }}>
          Cross-legged, open-leg, or rice-paddy squat. Elbows rest on the inside of the knees —{' '}
          <Highlight>not on the kneecaps</Highlight> (bone on bone is unstable).
        </p>
        <p style={{ margin: 0 }}>
          High, stable position useful when prone is not possible due to vegetation or terrain.
          Rice-paddy squat is faster to get into and out of.
        </p>
      </DocCard>

      <DocCard title="Kneeling">
        <p style={{ margin: '0 0 8px 0' }}>
          Firing-side knee down, non-firing elbow on non-firing knee.
          Faster than sitting but less stable.
        </p>
        <p style={{ margin: '0 0 8px 0' }}>
          <Highlight>The kneecap is the enemy</Highlight> — rest the elbow on the meaty part of the
          upper arm against the thigh, not on the kneecap.
        </p>
        <p style={{ margin: 0 }}>
          A kneeling pad makes this much more practical.
        </p>
      </DocCard>

      <DocCard title="Standing (Offhand)">
        <p style={{ margin: '0 0 8px 0' }}>
          The least stable position and the most demanded in competition.{' '}
          <Highlight>No bone support — pure muscle.</Highlight>
        </p>
        <p style={{ margin: '0 0 8px 0' }}>
          Feet shoulder-width apart, body angled roughly 45–90 degrees to the target.
          Rifle weight supported by the non-firing arm.
        </p>
        <p style={{ margin: 0 }}>
          Minimize movement; use the natural respiratory pause. The hardest position to shoot well;
          the most developed by competition shooters.
        </p>
      </DocCard>

      <DocCard title="Urban / Barricade">
        <p style={{ margin: '0 0 8px 0' }}>
          Shooting around, over, or through obstacles. Strong-side vs. support-side barricade
          (requires switching shoulders or awkward shooting).
        </p>
        <p style={{ margin: '0 0 8px 0' }}>
          <Highlight>The barricade is a rest, not a brace</Highlight> — touching the rifle directly
          to a hard surface causes inconsistent deviation;{' '}
          <Highlight>use your hand as an interface</Highlight>.
        </p>
        <p style={{ margin: 0 }}>
          PRS and 3-gun stages frequently demand barricade shooting from both sides.
        </p>
      </DocCard>
    </div>
  );
}

function WindDopeContent() {
  return (
    <div>
      <SectionHeading>Reading Wind</SectionHeading>

      <DocCard title="Wind Speed Indicators">
        <div style={{ margin: 0 }}>
          {[
            { speed: 'CALM', desc: 'Smoke rises vertically; grass undisturbed' },
            { speed: '3–5 MPH', desc: 'Leaves rustle; smoke drifts' },
            { speed: '8–12 MPH', desc: 'Small branches moving; dust raised' },
            { speed: '15–20 MPH', desc: 'Small trees sway; loose paper moves' },
            { speed: '25+ MPH', desc: 'Large branches in motion; walking impeded' },
          ].map((row, i) => (
            <div key={i} style={{
              display: 'flex',
              gap: '12px',
              padding: '6px 0',
              borderBottom: i < 4 ? '1px solid ' + theme.border : 'none',
            }}>
              <span style={{
                color: theme.accent,
                fontFamily: 'monospace',
                fontSize: '12px',
                fontWeight: 700,
                minWidth: '80px',
                flexShrink: 0,
              }}>
                {row.speed}
              </span>
              <span style={{ color: theme.textSecondary, fontFamily: 'monospace', fontSize: '13px' }}>
                {row.desc}
              </span>
            </div>
          ))}
        </div>
      </DocCard>

      <DocCard title="Mirage Reading">
        <p style={{ margin: '0 0 8px 0' }}>
          Mirage — heat shimmer visible in optics — indicates wind and direction.
        </p>
        <p style={{ margin: '0 0 8px 0' }}>
          <Highlight>"Boiling" mirage (straight up)</Highlight> = calm, or direct headwind/tailwind.
        </p>
        <p style={{ margin: '0 0 8px 0' }}>
          <Highlight>Mirage leaning toward target</Highlight> = wind from shooter's left.
        </p>
        <p style={{ margin: '0 0 8px 0' }}>
          <Highlight>Leaning toward shooter</Highlight> = wind from right.
        </p>
        <p style={{ margin: 0 }}>
          Experienced precision shooters read mirage through the scope as a primary wind indicator.
        </p>
      </DocCard>

      <DocCard title="Wind Holds">
        <p style={{ margin: '0 0 8px 0' }}>
          <Highlight>Full value wind</Highlight> (90 degrees to bore axis) has maximum effect.
        </p>
        <p style={{ margin: '0 0 8px 0' }}>
          <Highlight>Half value</Highlight> (45 degrees) has roughly half the effect.
        </p>
        <p style={{ margin: '0 0 8px 0' }}>
          <Highlight>No value</Highlight> (headwind/tailwind) has minimal horizontal effect but
          affects velocity slightly.
        </p>
        <p style={{ margin: 0 }}>
          The wind call: <Highlight>speed × sine of angle</Highlight> to derive effective wind.
        </p>
      </DocCard>

      <SectionHeading>DOPE</SectionHeading>

      <DocCard title="Data On Previous Engagements">
        <p style={{ margin: '0 0 8px 0' }}>
          A personal ballistic record. For each gun + load + optic combination:
        </p>
        <ul style={{ margin: '0 0 8px 0', paddingLeft: '18px' }}>
          <li style={{ marginBottom: '4px' }}>Distance</li>
          <li style={{ marginBottom: '4px' }}>Elevation adjustment (in <Highlight>MIL</Highlight> or <Highlight>MOA</Highlight>)</li>
          <li style={{ marginBottom: '4px' }}>Wind hold (typically expressed per <Highlight>10 mph full value</Highlight>)</li>
        </ul>
        <p style={{ margin: '0 0 8px 0' }}>
          DOPE must be verified — manufacturer data and ballistic calculators are starting points only.
          Your rifle, your ammo, your altitude, your barrel temperature — all affect actual data.
        </p>
        <p style={{ margin: 0 }}>
          A <Highlight>range card</Highlight> captures DOPE for field reference. Every serious precision
          shooter builds and maintains their own.
        </p>
      </DocCard>

      <DocCard title="Density Altitude">
        <p style={{ margin: '0 0 8px 0' }}>
          Air density affects drag. <Highlight>Higher altitude = thinner air = less drag = bullet shoots higher</Highlight> than at sea level.
        </p>
        <p style={{ margin: '0 0 8px 0' }}>
          Temperature and humidity also affect density altitude. Ballistic calculators accept altitude
          and temperature inputs for this reason.
        </p>
        <p style={{ margin: 0 }}>
          The difference between sea level and 5,000 feet elevation can be{' '}
          <Highlight>2–3 MOA at 1000 yards</Highlight>.
        </p>
      </DocCard>
    </div>
  );
}

function TriggerContent() {
  return (
    <div>
      <SectionHeading>Trigger Technique</SectionHeading>

      <DocCard title="The Trigger Press">
        <p style={{ margin: '0 0 8px 0' }}>
          The trigger should move <Highlight>straight to the rear, parallel to the bore axis</Highlight>.
          Any lateral pressure causes the muzzle to deflect.
        </p>
        <p style={{ margin: '0 0 8px 0' }}>
          The firing hand should grip firmly enough to prevent lateral movement but not so tightly
          that it causes tremor.
        </p>
        <p style={{ margin: 0 }}>
          A <Highlight>crush grip</Highlight> — increasing pressure gradually — produces a more
          consistent break than staging the trigger.
        </p>
      </DocCard>

      <DocCard title="Slack and Overtravel">
        <p style={{ margin: '0 0 8px 0' }}>
          Modern defensive triggers often have <Highlight>slack</Highlight> — take-up before
          resistance is felt — and <Highlight>overtravel</Highlight> after the break.
        </p>
        <p style={{ margin: '0 0 8px 0' }}>
          DA/SA pistols require managing a long DA first pull; SAO 1911s have essentially no slack.
        </p>
        <p style={{ margin: 0 }}>
          <Highlight>Dry fire</Highlight> is the most efficient way to learn trigger feel without
          the distraction of recoil and noise.
        </p>
      </DocCard>

      <DocCard title="Flinch and Anticipation">
        <p style={{ margin: '0 0 8px 0' }}>
          The human startle reflex to an anticipated loud noise is nearly impossible to suppress
          consciously — but it can be managed.
        </p>
        <p style={{ margin: '0 0 8px 0' }}>
          Dry fire reveals flinch cleanly.
        </p>
        <p style={{ margin: '0 0 8px 0' }}>
          <Highlight>Ball-and-dummy drills</Highlight> (randomly loaded dummy rounds in a magazine)
          expose flinch; the gun does not go off but the muzzle dips and the body responds.
        </p>
        <p style={{ margin: 0 }}>
          Catching yourself flinching on a dummy round is valuable information.
        </p>
      </DocCard>

      <DocCard title="Reset">
        <p style={{ margin: '0 0 8px 0' }}>
          After the shot breaks, release the trigger only far enough to{' '}
          <Highlight>reset</Highlight> (the click indicates reset on most modern triggers).
        </p>
        <p style={{ margin: '0 0 8px 0' }}>
          Riding the reset reduces trigger finger travel time between shots for follow-up fire.
        </p>
        <p style={{ margin: 0 }}>
          Competition shooters refine reset management to a fine art; for defensive shooters,
          it is a secondary priority to trigger control fundamentals.
        </p>
      </DocCard>
    </div>
  );
}

function DryFireContent() {
  return (
    <div>
      <SectionHeading>Dry Fire</SectionHeading>

      <DocCard title="Why Dry Fire">
        <p style={{ margin: '0 0 8px 0' }}>
          Every fundamental of marksmanship can be trained in dry fire{' '}
          <Highlight>except recoil management</Highlight>. Trigger control, NPOA, position building,
          sight alignment, follow-through — all accessible with an unloaded firearm.
        </p>
        <p style={{ margin: '0 0 4px 0' }}>The military uses dry fire because it is:</p>
        <ul style={{ margin: '0 0 8px 0', paddingLeft: '18px' }}>
          <li style={{ marginBottom: '4px' }}>Free</li>
          <li style={{ marginBottom: '4px' }}>Available anywhere</li>
          <li style={{ marginBottom: '4px' }}>Isolates technique from noise/recoil distraction</li>
          <li style={{ marginBottom: '4px' }}>Repeatable at high volume without fatigue or expense</li>
        </ul>
      </DocCard>

      <DocCard title="Protocol">
        <p style={{ margin: '0 0 8px 0' }}>
          <Highlight>Triple-check the firearm is unloaded.</Highlight>{' '}
          Remove all ammunition from the room.
          Point in a safe direction.
        </p>
        <p style={{ margin: '0 0 8px 0' }}>
          Many shooters use a "dry fire target" — a dot on the wall — to maintain intent.
        </p>
        <p style={{ margin: 0 }}>
          Keep sessions <Highlight>short (10–15 minutes)</Highlight> — mental focus degrades
          faster than physical in dry fire. Track what you are working on.
        </p>
      </DocCard>

      <DocCard title="Snap Caps">
        <p style={{ margin: '0 0 8px 0' }}>
          Not required for most modern centerfire firearms — manufacturers state dry fire is safe
          on empty chamber.
        </p>
        <p style={{ margin: 0 }}>
          <Highlight>Required for rimfire (.22 LR)</Highlight> — the firing pin can damage the
          chamber edge striking without a case. Worth using for peace of mind on any gun.
        </p>
      </DocCard>

      <SectionHeading>Drills</SectionHeading>

      <DocCard title="Dot Drill">
        <p style={{ margin: 0 }}>
          Four dots (or quarters) on a piece of paper. Work each dot, then{' '}
          <Highlight>transition between them</Highlight>. Develops sight acquisition and trigger
          control simultaneously.
        </p>
      </DocCard>

      <DocCard title="Trigger Press Drill">
        <p style={{ margin: 0 }}>
          Focus purely on front sight. Press trigger without disturbing alignment.{' '}
          <Highlight>Hold for 2 seconds after.</Highlight> Check. The front sight should not have
          moved at the moment of the break.
        </p>
      </DocCard>

      <DocCard title="NPOA Check">
        <p style={{ margin: 0 }}>
          Close eyes, relax fully, open eyes. Confirm front sight is still on target.
          If not, <Highlight>adjust body — not the rifle</Highlight> — and repeat.
        </p>
      </DocCard>

      <DocCard title="Dry Fire Draw">
        <p style={{ margin: 0 }}>
          From concealment, to presentation, to sight alignment —{' '}
          <Highlight>no trigger press until alignment is confirmed</Highlight>.
          Builds a consistent draw stroke and front sight focus habit.
        </p>
      </DocCard>
    </div>
  );
}

function ConditionsContent() {
  return (
    <div>
      <SectionHeading>Cold Bore and Barrel Temperature</SectionHeading>

      <DocCard title="Cold Bore Shot">
        <p style={{ margin: '0 0 8px 0' }}>
          The first shot from a clean, cold barrel often impacts differently than subsequent shots —
          the barrel's temperature and residual oil/solvent affect the bullet's path.
        </p>
        <p style={{ margin: '0 0 8px 0' }}>
          Precision rifle competitors and hunters track their{' '}
          <Highlight>cold bore POI deviation</Highlight> from their established zero.
        </p>
        <p style={{ margin: 0 }}>
          Some rifles are consistent; others shift <Highlight>0.5–1 MOA cold bore</Highlight>.
          Know your rifle.
        </p>
      </DocCard>

      <DocCard title="Barrel Temperature">
        <p style={{ margin: '0 0 8px 0' }}>
          As a barrel heats through a string of fire, throat erosion from heat and pressure
          accelerates, and steel expansion shifts point of impact slightly.
        </p>
        <p style={{ margin: '0 0 8px 0' }}>
          <Highlight>A barrel too hot to touch with bare hands is too hot to fire for best accuracy.</Highlight>
        </p>
        <p style={{ margin: 0 }}>
          PRS competition rarely allows time for cooling — the shooter must know how their
          rifle behaves hot.
        </p>
      </DocCard>

      <SectionHeading>Light and Angles</SectionHeading>

      <DocCard title="Light Conditions">
        <p style={{ margin: '0 0 8px 0' }}>
          Bright sun casts shadows on iron sights — a front sight post{' '}
          <Highlight>fully lit vs. half-shadowed</Highlight> changes your sight picture.
        </p>
        <p style={{ margin: '0 0 8px 0' }}>
          Use a consistent sight picture under consistent light conditions.
        </p>
        <p style={{ margin: 0 }}>
          Optics largely eliminate this variable but introduce their own: glare on the objective
          lens, washed-out reticle in extreme brightness.
        </p>
      </DocCard>

      <DocCard title="Shooting Uphill / Downhill">
        <p style={{ margin: '0 0 8px 0' }}>
          Gravity acts on the component of the trajectory that is horizontal, not on the total
          path length.
        </p>
        <p style={{ margin: '0 0 8px 0' }}>
          <Highlight>Both uphill and downhill shots hit high</Highlight> relative to a level-ground
          zero at the same distance.
        </p>
        <p style={{ margin: '0 0 8px 0' }}>
          The <Highlight>Rifleman's Rule:</Highlight>
        </p>
        <div style={{
          background: theme.bg,
          border: '1px solid ' + theme.accent,
          borderRadius: '4px',
          padding: '10px 12px',
          fontFamily: 'monospace',
          fontSize: '12px',
          color: theme.accent,
          letterSpacing: '0.5px',
        }}>
          {'effective range = cos(angle) x slant range'}
        </div>
        <p style={{ margin: '8px 0 0 0' }}>
          Use this effective range for elevation adjustment, not the raw slant range.
        </p>
      </DocCard>
    </div>
  );
}

export function FieldGuideMarksmanship({ onBack }: { onBack: () => void }) {
  const [activeCategory, setActiveCategory] = useState<Category>('FUNDAMENTALS');

  function renderContent() {
    switch (activeCategory) {
      case 'FUNDAMENTALS': return <FundamentalsContent />;
      case 'POSITIONS': return <PositionsContent />;
      case 'WIND_DOPE': return <WindDopeContent />;
      case 'TRIGGER': return <TriggerContent />;
      case 'DRY_FIRE': return <DryFireContent />;
      case 'CONDITIONS': return <ConditionsContent />;
      default: return null;
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: theme.bg,
      fontFamily: 'monospace',
      overflow: 'hidden',
    }}>
      {/* Sticky header */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: theme.bg,
        borderBottom: '1px solid ' + theme.border,
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          gap: '12px',
        }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: '1px solid ' + theme.border,
              borderRadius: '4px',
              color: theme.textSecondary,
              fontFamily: 'monospace',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '1px',
              padding: '6px 12px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            BACK
          </button>
          <div style={{ flex: 1 }}>
            <div style={{
              color: theme.accent,
              fontFamily: 'monospace',
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '2px',
              lineHeight: 1.2,
            }}>
              MARKSMANSHIP DOCTRINE
            </div>
            <div style={{
              color: theme.textMuted,
              fontFamily: 'monospace',
              fontSize: '10px',
              letterSpacing: '1px',
              marginTop: '2px',
            }}>
              TC 3-22.9 / FM 23-10 / MCRP 3-01A
            </div>
          </div>
        </div>

        {/* Category tabs */}
        <div style={{
          display: 'flex',
          overflowX: 'auto',
          padding: '0 16px 12px 16px',
          gap: '6px',
          scrollbarWidth: 'none',
        }}>
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  background: isActive ? theme.accent : 'transparent',
                  border: '1px solid ' + (isActive ? theme.accent : theme.border),
                  borderRadius: '4px',
                  color: isActive ? '#07071a' : theme.textSecondary,
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  fontWeight: isActive ? 700 : 500,
                  letterSpacing: '1px',
                  padding: '5px 12px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap' as const,
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 16px 32px 16px',
      }}>
        {renderContent()}
      </div>
    </div>
  );
}
