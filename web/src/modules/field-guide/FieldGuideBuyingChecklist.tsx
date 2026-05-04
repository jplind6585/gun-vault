import { useState, useEffect } from 'react';
import { theme } from './theme';

type Source = 'lgs' | 'online' | 'gunbroker' | 'private' | 'cr' | 'nfa';
type Condition = 'new' | 'used';

interface ChecklistItem {
  id: string;
  text: string;
  critical?: boolean;
}

interface ChecklistSection {
  heading: string;
  items: ChecklistItem[];
}

// ─── CHECKLIST DATA ────────────────────────────────────────────────────────────

const UNIVERSAL: ChecklistSection = {
  heading: 'Before Any Purchase',
  items: [
    { id: 'u1', text: 'Confirm you are legally eligible — no prohibited person status under 18 USC 922(g)' },
    { id: 'u2', text: 'Total budget finalized: purchase price + transfer fees + first ammo purchase + accessories' },
    { id: 'u3', text: 'Primary use case defined: EDC, home defense, range, hunting, competition, or collection' },
    { id: 'u4', text: 'Compared at least 2-3 alternative models for the same role' },
  ],
};

const CHECKLISTS: Record<string, ChecklistSection[]> = {
  // ── NEW × LGS ──────────────────────────────────────────────────────────────
  'new-lgs': [
    {
      heading: 'In the Store',
      items: [
        { id: 'nl1', text: 'Verified street price vs. MSRP — dealer price often differs from box price' },
        { id: 'nl2', text: 'Handled the firearm: ergonomics, grip angle, controls reach all checked' },
        { id: 'nl3', text: 'Dry-fired with permission — trigger resets cleanly, no gritty travel' },
        { id: 'nl4', text: 'Inspected for visible defects: finish consistency, fitment, control feel' },
        { id: 'nl5', text: 'Confirmed factory warranty is valid through this dealer purchase' },
        { id: 'nl6', text: 'Asked about return or exchange policy — know your options before signing' },
      ],
    },
    {
      heading: 'Transfer',
      items: [
        { id: 'nl7', text: '4473 completed accurately and without rushing — errors can void the transfer' },
        { id: 'nl8', text: 'NICS check completed (or state equivalent) — know if your state has a waiting period' },
      ],
    },
    {
      heading: 'Before You Leave',
      items: [
        { id: 'nl9', text: 'Asked what ammo they stock for this caliber — know where to resupply locally' },
        { id: 'nl10', text: 'Considered a case or range bag before leaving the store' },
        { id: 'nl11', text: 'Owner manual and all included accessories accounted for' },
      ],
    },
  ],

  // ── NEW × ONLINE ───────────────────────────────────────────────────────────
  'new-online': [
    {
      heading: 'Before Ordering',
      items: [
        { id: 'no1', text: 'Confirmed total landed price: item + shipping + hazmat fee if applicable' },
        { id: 'no2', text: 'Identified a local FFL for transfer — called ahead, confirmed they accept transfers and their fee' },
        { id: 'no3', text: 'Confirmed the firearm ships to your state — some models are state-restricted (CA, MA, NY, etc.)' },
        { id: 'no4', text: 'Checked dealer reviews (BBB, Google, forums) — legitimate dealers have a track record' },
      ],
    },
    {
      heading: 'After Ordering',
      items: [
        { id: 'no5', text: 'Order confirmation and tracking number saved' },
        { id: 'no6', text: 'FFL contact info sent to online dealer — many require this before shipping' },
        { id: 'no7', text: 'Tracking confirmed active before heading to FFL' },
      ],
    },
    {
      heading: 'At the FFL',
      items: [
        { id: 'no8', text: '4473 completed accurately at the local FFL dealer' },
        { id: 'no9', text: 'Firearm inspected thoroughly before completing transfer — no recourse after you sign', critical: true },
        { id: 'no10', text: 'Original box and all included accessories confirmed present' },
        { id: 'no11', text: 'Warranty registered if manufacturer requires it (some require registration within 30 days)' },
      ],
    },
  ],

  // ── USED × LGS ────────────────────────────────────────────────────────────
  'used-lgs': [
    {
      heading: 'History & Provenance',
      items: [
        { id: 'ul1', text: 'Asked for all history known to the dealer: traded in, consignment, estate, or pawn' },
        { id: 'ul2', text: 'Confirmed make, model, and caliber match the markings on the firearm — not just the tag' },
      ],
    },
    {
      heading: 'Physical Inspection',
      items: [
        { id: 'ul3', text: 'Bore inspected with a bore light — check for pitting, erosion, or dark fouling spots' },
        { id: 'ul4', text: 'Crown inspected — chips or damage affect accuracy and cannot be shot straight' },
        { id: 'ul5', text: 'Feed ramp, chamber mouth, extractor claw, and ejector all present and intact' },
        { id: 'ul6', text: 'Action cycled slowly — smooth operation, no grinding or binding' },
        { id: 'ul7', text: 'Dry-fired with permission — trigger resets cleanly, no creep or unexpected behavior' },
        { id: 'ul8', text: 'Frame and slide or receiver checked for cracks, bubbling finish, or amateur repairs', critical: true },
        { id: 'ul9', text: 'Serial number present, visible, and not obviously altered — obliterated serials are a federal crime to possess', critical: true },
        { id: 'ul10', text: 'Magazine function tested if included: feeds smoothly, drops free on release' },
      ],
    },
    {
      heading: 'Transaction',
      items: [
        { id: 'ul11', text: 'Price negotiated — used guns are almost always negotiable at a dealer' },
        { id: 'ul12', text: 'Return/exchange policy confirmed — consignment guns may be final sale' },
        { id: 'ul13', text: '4473 completed and NICS check cleared' },
      ],
    },
  ],

  // ── USED × ONLINE / GUNBROKER ──────────────────────────────────────────────
  'used-online': [
    {
      heading: 'Vetting the Seller',
      items: [
        { id: 'uo1', text: 'Seller feedback score checked — aim for 97%+ with 50 or more completed transactions' },
        { id: 'uo2', text: 'All listing text read carefully — note any "as-is", "no returns", or "pictures show condition" language' },
        { id: 'uo3', text: 'Additional photos requested if listing photos are insufficient or angles are missing' },
      ],
    },
    {
      heading: 'Logistics',
      items: [
        { id: 'uo4', text: 'Confirmed shipping method — FedEx or UPS only for firearms, no USPS for handguns' },
        { id: 'uo5', text: 'Local FFL identified and confirmed they accept used transfers' },
        { id: 'uo6', text: 'Total cost calculated: winning bid + buyer premium + shipping + FFL transfer fee' },
        { id: 'uo7', text: 'Payment method confirmed — many private sellers do not accept credit cards; money order or Zelle is common' },
      ],
    },
    {
      heading: 'Transaction',
      items: [
        { id: 'uo8', text: 'Payment sent within the platform\'s required window (GunBroker: 24-48 hours after winning)' },
        { id: 'uo9', text: 'Tracking number obtained and verified active before going to FFL' },
        { id: 'uo10', text: 'Firearm inspected thoroughly at the FFL before completing transfer — no recourse after 4473 is signed', critical: true },
        { id: 'uo11', text: 'Serial number confirmed matches listing and shipping label documentation' },
      ],
    },
  ],

  // ── NEW × GUNBROKER ────────────────────────────────────────────────────────
  'new-gunbroker': [
    {
      heading: 'Before Bidding or Buying',
      items: [
        { id: 'ng1', text: 'Seller is a licensed FFL dealer — verified "FFL Dealer" badge on their GunBroker profile' },
        { id: 'ng2', text: 'Confirmed the firearm is actually new-in-box, not "like new" or "unfired"' },
        { id: 'ng3', text: 'Total landed cost calculated: price + buyer premium + shipping + FFL fee' },
        { id: 'ng4', text: 'Local FFL identified and confirmed they accept GunBroker transfers' },
        { id: 'ng5', text: 'Confirmed the item ships to your state — some models blocked in CA/MA/NY/MD/NJ' },
      ],
    },
    {
      heading: 'Auction / Purchase',
      items: [
        { id: 'ng6', text: 'Auction end time noted — sniped bids in final seconds are standard GunBroker practice' },
        { id: 'ng7', text: 'Maximum bid set and held — do not chase an item above your budget ceiling' },
        { id: 'ng8', text: 'Payment sent within 24-48 hours per GunBroker policy after winning' },
        { id: 'ng9', text: 'FFL contact info sent to seller — required before shipping in most cases' },
      ],
    },
    {
      heading: 'At the FFL',
      items: [
        { id: 'ng10', text: '4473 completed and NICS check cleared at local FFL' },
        { id: 'ng11', text: 'Firearm inspected before completing transfer — verify it matches the listing exactly', critical: true },
        { id: 'ng12', text: 'All included accessories confirmed present (magazines, manual, lock, etc.)' },
      ],
    },
  ],

  // ── USED × GUNBROKER ──────────────────────────────────────────────────────
  'used-gunbroker': [
    {
      heading: 'Vetting',
      items: [
        { id: 'ug1', text: 'Seller feedback score: 97%+ with 50+ completed transactions minimum', critical: true },
        { id: 'ug2', text: 'All listing text read — note "as-is", "no returns", and exact condition language' },
        { id: 'ug3', text: 'Additional photos requested for any angles not covered in the listing' },
        { id: 'ug4', text: 'Serial number visible in photos or explicitly confirmed by seller' },
      ],
    },
    {
      heading: 'Logistics & Pricing',
      items: [
        { id: 'ug5', text: 'Total cost calculated: winning bid + buyer premium + shipping + FFL fee' },
        { id: 'ug6', text: 'Checked recent sold listings for this exact model to confirm price is fair' },
        { id: 'ug7', text: 'Local FFL identified, called ahead, confirmed they accept GunBroker transfers' },
        { id: 'ug8', text: 'Payment method confirmed — money order, check, or Zelle; credit cards are often not accepted' },
        { id: 'ug9', text: 'If item might be C&R eligible: confirmed your 03 FFL status allows direct transfer' },
      ],
    },
    {
      heading: 'Closing the Deal',
      items: [
        { id: 'ug10', text: 'Payment sent within 24-48 hours after winning per GunBroker policy' },
        { id: 'ug11', text: 'Tracking confirmed active before going to FFL' },
        { id: 'ug12', text: 'Firearm inspected thoroughly at FFL before completing transfer — no recourse after signing', critical: true },
        { id: 'ug13', text: 'Serial number matches listing and all shipping paperwork exactly' },
      ],
    },
  ],

  // ── USED × PRIVATE PARTY ──────────────────────────────────────────────────
  'used-private': [
    {
      heading: 'Safety & Legal',
      items: [
        { id: 'pp1', text: 'Met in a public location — police station parking lots are ideal and widely available', critical: true },
        { id: 'pp2', text: 'Brought a trusted second person' },
        { id: 'pp3', text: 'Confirmed seller identity — verified their photo ID in person' },
        { id: 'pp4', text: 'Checked your state\'s private transfer laws — some states require a background check through an FFL', critical: true },
        { id: 'pp5', text: 'In universal background check (UBC) states: FFL located, both parties present at transfer' },
        { id: 'pp6', text: 'Serial number run through available stolen property databases if accessible in your state' },
      ],
    },
    {
      heading: 'Physical Inspection',
      items: [
        { id: 'pp7', text: 'Bore inspected — pitting, erosion, or obstructions check' },
        { id: 'pp8', text: 'Action cycled and dry-fired — smooth operation, clean reset' },
        { id: 'pp9', text: 'Frame/receiver and slide checked for cracks, repairs, or alterations' },
        { id: 'pp10', text: 'Serial number present and not obviously altered', critical: true },
        { id: 'pp11', text: 'Make, model, and caliber confirmed from the actual rollmarks on the firearm' },
      ],
    },
    {
      heading: 'Transaction',
      items: [
        { id: 'pp12', text: 'Price agreed and confirmed — have exact cash, or use a payment method both parties accept' },
        { id: 'pp13', text: 'Bill of sale written and signed by both parties: date, names, serial number, make, model, price' },
        { id: 'pp14', text: 'Your copy of the bill of sale retained indefinitely — it documents your legal chain of custody', critical: true },
        { id: 'pp15', text: 'Walked away if anything felt off — no deal is worth a stolen gun or a sketchy situation', critical: true },
      ],
    },
  ],

  // ── C&R (Curio & Relic) ───────────────────────────────────────────────────
  cr: [
    {
      heading: 'Eligibility & Compliance',
      items: [
        { id: 'cr1', text: 'Confirmed this specific firearm is C&R eligible: manufactured 50+ years ago or on the ATF C&R list', critical: true },
        { id: 'cr2', text: 'Your ATF 03 FFL (Collector of C&R Firearms) is current and not expired', critical: true },
        { id: 'cr3', text: 'Seller confirmed they accept 03 FFL transfers — not all platforms or dealers allow direct C&R shipment' },
        { id: 'cr4', text: 'Shipping address on order matches the address of record on your 03 FFL exactly' },
        { id: 'cr5', text: 'Acquisition logged in your Bound Book within 24 hours of receipt — federal requirement', critical: true },
      ],
    },
    {
      heading: 'Collector Evaluation',
      items: [
        { id: 'cr6', text: 'Matching numbers verified: receiver, bolt, barrel, and stock should all share the same serial block' },
        { id: 'cr7', text: 'Original finish assessed — re-blued or re-finished guns carry significantly lower collector value' },
        { id: 'cr8', text: 'Import marks checked (if imported) — all post-1968 imports must be marked; unmarkered imports are a red flag' },
        { id: 'cr9', text: 'Provenance documentation gathered: import papers, unit markings, capture papers if applicable' },
        { id: 'cr10', text: 'Market pricing researched via recent sold listings on GunBroker, Rock Island Auction, or James D. Julia' },
      ],
    },
    {
      heading: 'Storage & Preservation',
      items: [
        { id: 'cr11', text: 'Avoid harsh solvents on original finish — light oil only; original patina is the value' },
        { id: 'cr12', text: 'Stored in a controlled environment: humidity 40-50%, temperature stable, away from direct light' },
        { id: 'cr13', text: 'Photographed in detail for records and insurance documentation' },
      ],
    },
  ],

  // ── NFA ITEM ──────────────────────────────────────────────────────────────
  nfa: [
    {
      heading: 'Legal Eligibility',
      items: [
        { id: 'nf1', text: 'Confirmed NFA items are legal in your state — suppressors banned in 8 states; MGs effectively banned for new civilian transfers', critical: true },
        { id: 'nf2', text: 'Confirmed the specific item type is legal in your state (some states ban SBRs or SBSs separately from suppressors)' },
        { id: 'nf3', text: 'You are not a prohibited person under any applicable federal or state law' },
      ],
    },
    {
      heading: 'Ownership Structure',
      items: [
        { id: 'nf4', text: 'Ownership structure chosen: individual, NFA gun trust (most flexible), or corporation' },
        { id: 'nf5', text: 'If using a gun trust: trust drafted by an attorney familiar with NFA law; all Responsible Persons (RPs) identified' },
        { id: 'nf6', text: 'Located a Class III dealer (Type 07 or 08 FFL with SOT) with the item in inventory or who can order it' },
      ],
    },
    {
      heading: 'Form 4 Process',
      items: [
        { id: 'nf7', text: 'Full purchase price paid to dealer — item cannot leave until Form 4 is approved', critical: true },
        { id: 'nf8', text: 'ATF Form 4 submitted: $200 tax stamp for suppressor/SBR/SBS/MG, $5 for AOW' },
        { id: 'nf9', text: 'Passport photos and fingerprint cards submitted for individual or trust RP registrations' },
        { id: 'nf10', text: 'CLEO notification completed where required (varies by jurisdiction and trust structure)' },
        { id: 'nf11', text: 'Item description and serial number on the Form 4 verified exactly against the physical item', critical: true },
        { id: 'nf12', text: 'eFile submitted if available — significantly faster than paper filing' },
        { id: 'nf13', text: 'Current wait time researched and tracked — Form 4 approvals currently range 6-18+ months' },
      ],
    },
    {
      heading: 'Approval & Transfer',
      items: [
        { id: 'nf14', text: 'Tax stamp received: item number on stamp matches item description exactly before accepting transfer', critical: true },
        { id: 'nf15', text: 'If SBR or SBS: firearm engraved with trust name (or your name) + city + state — required by ATF regulation', critical: true },
        { id: 'nf16', text: 'Interstate transport rules understood: cannot transport NFA items across state lines without prior ATF approval (Form 5320.20)', critical: true },
        { id: 'nf17', text: 'Original approved Form 4 (approved stamp) retained and kept with the firearm at all times when in transport' },
      ],
    },
  ],
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const SOURCE_LABELS: { key: Source; label: string }[] = [
  { key: 'lgs', label: 'LGS' },
  { key: 'online', label: 'Online' },
  { key: 'gunbroker', label: 'GunBroker' },
  { key: 'private', label: 'Private' },
  { key: 'cr', label: 'C&R' },
  { key: 'nfa', label: 'NFA Item' },
];

const SOURCE_NEEDS_CONDITION: Source[] = ['lgs', 'online', 'gunbroker', 'private'];

function scenarioKey(source: Source, condition: Condition): string {
  if (source === 'cr') return 'cr';
  if (source === 'nfa') return 'nfa';
  // private is always "used"
  if (source === 'private') return 'used-private';
  return `${condition}-${source}`;
}

function storageKey(source: Source, condition: Condition): string {
  return `fieldguide_buying_checklist_${scenarioKey(source, condition)}`;
}

function loadChecked(source: Source, condition: Condition): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey(source, condition));
    if (raw) return new Set(JSON.parse(raw));
  } catch { /* ignore */ }
  return new Set();
}

function saveChecked(source: Source, condition: Condition, checked: Set<string>) {
  try {
    localStorage.setItem(storageKey(source, condition), JSON.stringify([...checked]));
  } catch { /* ignore */ }
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

interface Props {
  onBack: () => void;
}

export function FieldGuideBuyingChecklist({ onBack }: Props) {
  const [source, setSource] = useState<Source>('lgs');
  const [condition, setCondition] = useState<Condition>('new');
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const needsCondition = SOURCE_NEEDS_CONDITION.includes(source) && source !== 'private';
  const effectiveCondition: Condition = source === 'private' ? 'used' : condition;
  const key = scenarioKey(source, effectiveCondition);
  const sections = CHECKLISTS[key] ?? [];
  const allSections: ChecklistSection[] = [UNIVERSAL, ...sections];

  const totalItems = allSections.reduce((sum, s) => sum + s.items.length, 0);
  const checkedCount = allSections.reduce(
    (sum, s) => sum + s.items.filter(i => checked.has(i.id)).length,
    0
  );

  useEffect(() => {
    setChecked(loadChecked(source, effectiveCondition));
  }, [source, effectiveCondition]);

  function toggleItem(id: string) {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveChecked(source, effectiveCondition, next);
      return next;
    });
  }

  function resetChecklist() {
    const empty = new Set<string>();
    saveChecked(source, effectiveCondition, empty);
    setChecked(empty);
  }

  function handleSourceChange(s: Source) {
    setSource(s);
    // C&R and NFA don't use condition; reset to new for others
    if (!SOURCE_NEEDS_CONDITION.includes(s)) setCondition('new');
  }

  const progressPct = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  return (
    <div style={{ backgroundColor: theme.bg, minHeight: '100vh', fontFamily: 'monospace' }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: theme.accent,
            fontSize: '13px',
            cursor: 'pointer',
            padding: 0,
            fontFamily: 'monospace',
          }}
        >
          ← Back
        </button>
      </div>
      <div style={{ padding: '8px 16px 16px' }}>
        <div style={{ fontSize: '11px', color: theme.textMuted, letterSpacing: '2px', marginBottom: '4px' }}>
          FIELD GUIDE
        </div>
        <div style={{ fontSize: '20px', fontWeight: 700, color: theme.textPrimary }}>
          Buying a Gun Checklist
        </div>
        <div style={{ fontSize: '12px', color: theme.textSecondary, marginTop: '4px' }}>
          Scenario-specific checklist for every purchase path
        </div>
      </div>

      {/* Source selector */}
      <div style={{ padding: '0 16px 12px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: '8px', minWidth: 'max-content' }}>
          {SOURCE_LABELS.map(({ key: k, label }) => (
            <button
              key={k}
              onClick={() => handleSourceChange(k)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: source === k ? 'none' : `0.5px solid ${theme.border}`,
                backgroundColor: source === k ? theme.accent : theme.surface,
                color: source === k ? theme.bg : theme.textSecondary,
                fontSize: '12px',
                fontWeight: source === k ? 700 : 400,
                cursor: 'pointer',
                fontFamily: 'monospace',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Condition toggle (only for sources that need it) */}
      {needsCondition && (
        <div style={{ padding: '0 16px 16px', display: 'flex', gap: '8px' }}>
          {(['new', 'used'] as Condition[]).map(c => (
            <button
              key={c}
              onClick={() => setCondition(c)}
              style={{
                padding: '5px 16px',
                borderRadius: '6px',
                border: condition === c ? `1px solid ${theme.accent}` : `0.5px solid ${theme.border}`,
                backgroundColor: condition === c ? 'rgba(255, 212, 59, 0.1)' : 'transparent',
                color: condition === c ? theme.accent : theme.textSecondary,
                fontSize: '12px',
                fontWeight: condition === c ? 700 : 400,
                cursor: 'pointer',
                fontFamily: 'monospace',
                letterSpacing: '1px',
              }}
            >
              {c.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* Progress bar */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', color: theme.textMuted, letterSpacing: '1px' }}>
            PROGRESS
          </span>
          <span style={{ fontSize: '11px', color: checkedCount === totalItems ? theme.green : theme.textSecondary, fontWeight: 700 }}>
            {checkedCount}/{totalItems}
          </span>
        </div>
        <div style={{ height: '3px', backgroundColor: theme.surface, borderRadius: '2px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${progressPct}%`,
              backgroundColor: checkedCount === totalItems ? theme.green : theme.accent,
              borderRadius: '2px',
              transition: 'width 0.2s ease',
            }}
          />
        </div>
      </div>

      {/* Checklist sections */}
      <div style={{ padding: '0 16px', paddingBottom: '100px' }}>
        {allSections.map((section, si) => (
          <div key={si} style={{ marginBottom: '24px' }}>
            <div
              style={{
                fontSize: '10px',
                color: theme.textMuted,
                letterSpacing: '2px',
                marginBottom: '10px',
                paddingBottom: '6px',
                borderBottom: `0.5px solid ${theme.border}`,
              }}
            >
              {section.heading.toUpperCase()}
            </div>
            {section.items.map(item => {
              const done = checked.has(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    padding: '8px 0',
                    cursor: 'pointer',
                    textAlign: 'left',
                    borderBottom: `0.5px solid ${theme.border}`,
                  }}
                >
                  {/* Checkbox */}
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '4px',
                      border: done
                        ? 'none'
                        : `1.5px solid ${item.critical ? theme.orange : theme.border}`,
                      backgroundColor: done ? theme.green : 'transparent',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '1px',
                    }}
                  >
                    {done && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke={theme.bg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  {/* Text */}
                  <span
                    style={{
                      fontSize: '13px',
                      color: done ? theme.textMuted : (item.critical ? theme.textPrimary : theme.textSecondary),
                      lineHeight: 1.5,
                      textDecoration: done ? 'line-through' : 'none',
                      fontFamily: 'monospace',
                    }}
                  >
                    {item.critical && !done && (
                      <span style={{ color: theme.orange, marginRight: '6px', fontSize: '10px', letterSpacing: '1px' }}>
                        CRITICAL
                      </span>
                    )}
                    {item.text}
                  </span>
                </button>
              );
            })}
          </div>
        ))}

        {/* Reset button */}
        {checkedCount > 0 && (
          <button
            onClick={resetChecklist}
            style={{
              display: 'block',
              width: '100%',
              padding: '12px',
              backgroundColor: 'transparent',
              border: `0.5px solid ${theme.border}`,
              borderRadius: '8px',
              color: theme.textMuted,
              fontSize: '12px',
              cursor: 'pointer',
              fontFamily: 'monospace',
              letterSpacing: '1px',
              marginTop: '8px',
            }}
          >
            RESET CHECKLIST
          </button>
        )}
      </div>
    </div>
  );
}
