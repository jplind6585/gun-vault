# GUN APP — CLAUDE CODE PROJECT HANDOFF
**Version:** 1.0 | **Date:** March 2026  
**Owner:** James | **Stack:** React Native + Expo + SQLite + Supabase  
**Mission:** Build a best-in-class mobile app for competitive shooters, collectors, and gunsmiths. Generate substantial personal income. Earn recognition as the most respected product in the community.

---

## TABLE OF CONTENTS

1. [Product Overview & Business Goals](#1-product-overview--business-goals)
2. [Tech Stack & Architecture](#2-tech-stack--architecture)
3. [Design System](#3-design-system)
4. [Module Inventory & Status](#4-module-inventory--status)
5. [Module Specs — Gun Vault](#5-module-specs--gun-vault)
6. [Module Specs — Arsenal (Ammo Inventory)](#6-module-specs--arsenal-ammo-inventory)
7. [Module Specs — Reloading Bench](#7-module-specs--reloading-bench)
8. [Module Specs — Training Log](#8-module-specs--training-log)
9. [Module Specs — Caliber Database](#9-module-specs--caliber-database)
10. [Module Specs — Target Analysis](#10-module-specs--target-analysis)
11. [Module Specs — Gunsmithing Workbench](#11-module-specs--gunsmithing-workbench)
12. [Module Specs — Wishlist](#12-module-specs--wishlist)
13. [Module Specs — Competition Tracker (Planned)](#13-module-specs--competition-tracker-planned)
14. [Module Specs — Hunting Log (Planned)](#14-module-specs--hunting-log-planned)
15. [Monetization & Freemium Gates](#15-monetization--freemium-gates)
16. [Real Collection Data (Seed / Demo)](#16-real-collection-data-seed--demo)
17. [Data Model — Core Entities](#17-data-model--core-entities)
18. [AI Features & API Integration](#18-ai-features--api-integration)
19. [Third-Party Integrations Roadmap](#19-third-party-integrations-roadmap)
20. [Hard Product Rules (Non-Negotiable)](#20-hard-product-rules-non-negotiable)
21. [Navigation Architecture](#21-navigation-architecture)
22. [Known Gaps & Outstanding Decisions](#22-known-gaps--outstanding-decisions)

---

## 1. PRODUCT OVERVIEW & BUSINESS GOALS

### Who This Is For
- **Competitive shooters:** PRS, NRL, USPSA, IPSC, trap, skeet, sporting clays
- **Serious collectors:** Insurance documentation, FMV tracking, acquisition/decommission lifecycle
- **Gunsmiths & aspiring gunsmiths:** Work orders, maintenance logs, skill development tracking

### Core Product Philosophy
**Data accumulation drives intelligence.** Every session, every shot string, every environmental reading feeds an analytics engine that surfaces actionable recommendations. The app gets smarter the more you use it. Recommendations should feel like a knowledgeable friend who has watched every one of your sessions — not a notification system.

### Business Goals
- Primary revenue: freemium subscription (Stripe)
- Secondary: reputation as the best-built app in the space
- Target: significant personal income, not a side project
- Benchmark competitors: GUNTRACK (direct), Ballistic-X (target analysis), ELEY X-Shot (clay sports), PractiScore 2 (match management)

---

## 2. TECH STACK & ARCHITECTURE

### Core Stack
```
React Native + Expo          — iOS & Android
SQLite (expo-sqlite)         — Local-first, on-device storage
Supabase                     — Optional cloud sync (authenticated users only)
Stripe                       — Subscription billing
Anthropic API (claude-sonnet) — AI Advisor, Target Analysis vision
```

### Architecture Principles
- **Local-first / offline-first.** App is fully functional with no internet connection. Supabase sync is optional and additive.
- **Atomic transactions** for all data operations that touch multiple entities (inventory decrements, batch creation, session consumption, brass tracking).
- **Individual brass tracking** confirmed — each piece of brass has a lifecycle record.
- **Recipe snapshots stored in ammo batches** — if a load recipe changes, historical batches retain the recipe used at time of creation. Safety tracing.
- **Round count can only increase via logged sessions.** No manual edits. Integrity enforced at DB level.
- **Guns are never deleted, only decommissioned.** Status field: Active, Stored, Transferred, Decommissioned.

### File Structure (Target)
```
/app
  /(tabs)
    index.tsx              — Gun Vault (home)
    arsenal.tsx            — Ammo Inventory
    reloading.tsx          — Reloading Bench
    training.tsx           — Training Log
    more.tsx               — Hub for other modules
  /gun-detail/[id].tsx     — Full gun detail screen
  /reloading/[id].tsx      — Batch detail
  /session/[id].tsx        — Session detail
/components
  /gun-vault/
  /arsenal/
  /reloading/
  /training/
  /shared/
/db
  schema.ts                — SQLite schema definitions
  migrations/
  queries/
/lib
  ballistics.ts            — Ballistics calculation engine
  ai.ts                    — Anthropic API wrapper
  supabase.ts
  stripe.ts
/constants
  theme.ts                 — Design tokens
  calibers.ts              — Caliber database (125+ entries)
```

---

## 3. DESIGN SYSTEM

### Color Palette
```typescript
const theme = {
  bg: '#07071a',           // Primary background
  surface: '#0e0e2a',      // Card / surface background
  surfaceAlt: '#13132e',   // Alternate surface
  border: 'rgba(255,255,255,0.08)',
  
  accent: '#ffd43b',       // Primary accent — amber/yellow
  accentDim: 'rgba(255,212,59,0.12)',
  
  red: '#ff6b6b',          // Alerts, warnings, danger
  green: '#51cf66',        // Success, positive delta
  blue: '#74c0fc',         // Info, links
  
  textPrimary: '#ffffff',
  textSecondary: '#a0a0b0',
  textMuted: '#666680',
  
  // Caliber name / emphasis
  caliberRed: '#ff6b6b',
}
```

### Typography
- **Monospace** for all numerical data (round counts, velocities, energies, prices, distances)
- System font for UI labels and navigation
- No decorative fonts

### UI Rules
- No emoji icons in UI (icons only via react-native-vector-icons or expo/vector-icons)
- No decorative elements — every pixel serves a function
- Status communicated through **text labels**, not colored fills
- Single accent color: amber (`#ffd43b`). Red (`#ff6b6b`) reserved for alerts only (except gunsmithing module)
- **No horizontal-scroll tables on mobile.** Use card views, bottom sheet details, or collapsible rows.

### Component Patterns
- **Bottom tab navigation** — primary nav
- **Bottom sheet modals** (react-native-bottom-sheet) — secondary detail and actions
- **"Full Detail →" push** — bottom sheet has preview; tapping pushes full-screen edit/detail view
- **Large touch targets** — minimum 44×44pt
- **Swipe actions** on list rows (archive, delete, quick-edit)

---

## 4. MODULE INVENTORY & STATUS

| Module | Status | Gate |
|--------|--------|------|
| Gun Vault | Prototyped in HTML | Free |
| Arsenal (Ammo Inventory) | Prototyped in HTML | Free |
| Caliber Database | Prototyped in HTML | Free |
| Wishlist | Prototyped in HTML | Free |
| Training Log | Prototyped in HTML | Free |
| Target Analysis | Prototyped in HTML | Free |
| Optics Manager | Designed, not prototyped | Free |
| Maintenance Tracker | Designed, not prototyped | Free |
| Organizations | Designed, not prototyped | Free |
| Reloading Bench | Prototyped in HTML | **Pro** |
| Competition Tracker | Partially designed | **Pro** |
| Gunsmithing Workbench | Prototyped in HTML | **Pro** |
| Hunting Log | Not yet designed | **Pro** |
| Cloud Backup | Architecture planned | **Pro** |
| Advanced Analytics | Architecture planned | **Pro** |

**Pro subscription gates:** Reloading Bench, Competition Tracker, Gunsmithing Workbench, Hunting Log + cloud backup + advanced analytics.

---

## 5. MODULE SPECS — GUN VAULT

### Purpose
Master record of the user's entire collection. Every other module flows through Gun Vault — ammo is assigned to guns, sessions are logged against guns, maintenance is tracked per gun, valuations are attached to guns.

### Views
- **Card View** — photo thumbnail, make/model, caliber, round count badge
- **Table View** — compact sortable rows, all key fields visible

### Gun Detail (Bottom Sheet → Full Screen)
Bottom sheet on tap: photo, quick stats (round count, last cleaned, estimated FMV), action buttons (Log Session, Add Maintenance, View Optics).

"Full Detail →" pushes full-screen with tabs:
- **Overview** — all fields editable
- **Round Count** — history graph, session breakdown
- **Maintenance** — log entries, next service due
- **Optics** — attached optics with zero data
- **Ammo** — ammo assigned to this gun, lot tracking
- **Timeline** — acquisition → modifications → milestones

### Gun Data Model
```typescript
interface Gun {
  id: string
  make: string
  model: string
  caliber: string
  action: 'Semi-Auto' | 'Bolt' | 'Lever' | 'Pump' | 'Revolver' | 'Break' | 'Single Shot'
  type: 'Pistol' | 'Rifle' | 'Shotgun' | 'Suppressor' | 'NFA'
  serialNumber: string
  acquiredDate: string
  acquiredPrice: number
  acquiredFrom: string
  condition: 'New' | 'Excellent' | 'Very Good' | 'Good' | 'Fair' | 'Poor'
  status: 'Active' | 'Stored' | 'Transferred' | 'Decommissioned'
  roundCount: number           // computed from sessions only
  estimatedFMV: number         // auto-updated from GunBroker sold listings
  lastFMVUpdate: string
  barrelLength: number
  overallLength: number
  weight: number
  finish: string
  stockGrip: string
  notes: string
  imageUrl: string             // Pollinations.ai generated or user photo
  insuranceValue: number
  nfaItem: boolean
  nfaApprovalDate?: string
  suppressorHost?: boolean
}
```

### Features
- **Range Bag Builder** — select which guns to bring to a session; auto-pulls assigned ammo
- **Insurance Export** — PDF with photos, serial numbers, FMV, acquisition cost
- **Collection Timeline** — chronological view of all acquisitions
- **FMV Auto-Refresh** — monthly cadence from GunBroker sold listings (Claude Code task)
- **AI Image Generation** — Pollinations.ai for guns without user photos

### Serial Number Anomalies (Flag for Review)
These guns in the collection data have serial numbers that should be verified:
- Glock 21
- STC Glock 43
- Walther PPK/S
- Canik TTI
- Mosin-Nagant

---

## 6. MODULE SPECS — ARSENAL (AMMO INVENTORY)

### Purpose
Complete ammo inventory management. Tracks factory ammo and handloads. Feeds directly into Training Log (session depletion), Reloading Bench (lot linkage), and Range Bag Builder.

### Views
- **Caliber rollup cards** — total rounds per caliber, brand breakdown, cost basis
- **Lot detail** — per-lot inventory with ballistic data

### Data Per Lot Entry
```typescript
interface AmmoLot {
  id: string
  caliber: string
  brand: string
  productLine: string
  grainWeight: number
  bulletType: string          // FMJ, JHP, BTHP, etc.
  quantity: number            // current stock
  quantityPurchased: number
  purchaseDate: string
  purchasePricePerRound: number
  storageLocation: string
  lotNumber: string           // manufacturer lot, for consistency tracking
  
  // Ballistics per lot
  advertisedFPS: number
  actualFPS: number           // from chrono sessions
  ballisticCoefficient: number
  standardDeviation: number   // from chrono data; color-coded
  
  // Flags
  isHandload: boolean
  reloadBatchId?: string      // links to Reloading Bench batch
  minStockAlert: number       // push notification threshold
  reserved: number            // reserved for specific match/session
}
```

### SD Color Coding (Industry Standard Thresholds)
- **Green:** SD ≤ 10 fps (excellent)
- **Yellow:** SD 11–15 fps (acceptable)
- **Red:** SD > 15 fps (investigate)

### Features
- Community-style ratings (user ratings per product line)
- Min stock alerts with push notifications
- Favorable price restocking suggestions (AmmoSeek integration)
- Lot tracking config toggle (off by default — don't overwhelm new users)
- **Range session auto-depletion** — confirm rounds at session end, decrement inventory
- **Range bag ammo recommendations** — integrates with Training Log session type

---

## 7. MODULE SPECS — RELOADING BENCH

**[PRO GATE]**

### Purpose
Complete handloading management. AMMO_BATCH is the keystone entity linking reloading, inventory, and range session systems.

### Keystone Entity: AMMO_BATCH
```typescript
interface AmmoBatch {
  id: string
  batchNumber: string         // user-visible, auto-incremented
  caliber: string
  dateCreated: string
  
  // Recipe snapshot — immutable after batch is finalized
  recipe: {
    bulletBrand: string
    bulletWeight: number
    bulletType: string
    powderBrand: string
    powderModel: string
    powderCharge: number      // grains
    primerBrand: string
    primerModel: string
    caseBrand: string
    caseFireCount: number     // how many times brass has been fired
    cartridgeOverallLength: number
    trimLength: number
    notes: string
    disclaimer: string        // mandatory, auto-populated
  }
  
  // Production
  roundsProduced: number
  roundsRemaining: number     // decremented by sessions
  componentCostPerRound: number
  brassCostAmortized: number  // brass cost ÷ expected case life
  totalCostPerRound: number
  
  // Performance accumulation (feeds from all sessions using this batch)
  avgFPS: number
  sdFPS: number
  sessionCount: number
  roundsDownrange: number
  
  // Inventory link
  inventoryLotId: string      // creates corresponding ArsenalLot on batch finalize
  
  // Status
  status: 'Draft' | 'Active' | 'Reserved' | 'Depleted' | 'Retired'
  matchReservation?: string   // match name/date if reserved
}
```

### Cross-Session Velocity Accumulation
Each time a session uses a batch and chrono data is captured, the batch's `avgFPS` and `sdFPS` are recalculated across all contributing sessions. Over time, this converges to a very accurate characterization of that load.

### Features
- **Brass amortization** in cost-per-round calculation
- **Conditions logging cascading** — environmental conditions logged at session creation cascade to all batches used in that session
- **Component price history** — track powder, bullet, primer prices over time
- **Match-day ammo reservation** — lock rounds to a specific match
- **Mandatory disclaimer** on all load recipe display: *"Always consult published reloading data. Never exceed maximum loads. The developer is not responsible for use of data in this app."*
- **Individual brass tracking** — each case has a fire count

### UI Pattern
- Bottom tab navigation within module
- Bottom sheet modals for recipe entry (large number inputs, drum scrollers for grain weights)
- No horizontal scroll — card-based layout for batch list

---

## 8. MODULE SPECS — TRAINING LOG

### Purpose
Session logging for all disciplines. Adaptive goal tracking. Drill library. Pre-session planning and post-session analysis.

### Session Types
- **Quick Shoot** — minimal logging: date, gun, ammo, rounds, notes. 30 seconds to log.
- **Training Session** — full logging: drills, stage breakdowns, par times, hit factors, conditions, gear

### Seven Tabs
1. **Goals** — active goals with adaptive timeline projections
2. **Log Session** — mode selector (Quick Shoot vs Training Session)
3. **Match Results** — structured match entry, PractiScore import
4. **Drill Library** — 13 built-in drills (expandable)
5. **Range Bag Planner** — integrates with Gun Vault Range Bag Builder
6. **Analytics** — trends over time, discipline breakdown
7. **History** — searchable session log

### Built-In Drill Library (13 Drills)
| Drill | Discipline | Metric |
|-------|-----------|--------|
| Bill Drill | USPSA | Split times, draw |
| El Presidente | USPSA | Time, accuracy |
| Failure Drill (Mozambique) | Defensive/USPSA | Time, accuracy |
| Dot Torture | Pistol fundamentals | Score /50 |
| 5x5 Drill | Pistol fundamentals | Time |
| FAST Drill | Defensive | Time, accuracy |
| Rifle Positional 5-Shot | PRS | Group size, time |
| Andersen Kneeling | PRS | Group size |
| PRS 3-Gun Stage Sim | PRS | Time, hits |
| Trap Singles | Trap | Score /25 |
| Sporting Clays Course Sim | Sporting Clays | Score, station breakdown |
| NRL22 Stage | NRL22 | Score |
| Cold Bore Shot | Precision Rifle | MOA from zero |

### Adaptive Timeline Projections
Based on historical session frequency and performance delta, project when user will reach a goal. Update weekly.

### Data Model
```typescript
interface TrainingSession {
  id: string
  date: string
  type: 'Quick' | 'Full'
  discipline: 'USPSA' | 'IPSC' | 'PRS' | 'NRL' | 'Trap' | 'Skeet' | 'Sporting Clays' | 'General'
  gunId: string
  ammoLotId: string
  roundsExpended: number
  duration: number             // minutes
  location: string
  
  // Conditions
  tempF: number
  humidity: number
  windSpeedMph: number
  windDirectionDeg: number
  altitudeFt: number
  lightCondition: 'Bright' | 'Overcast' | 'Low Light' | 'Night'
  
  // Performance
  drills: DrillResult[]
  notes: string
  rating: number               // 1-5 user self-assessment
  
  // Chrono data (optional)
  chronoReadings: number[]
  avgFPS: number
  sdFPS: number
}
```

---

## 9. MODULE SPECS — CALIBER DATABASE

### Purpose
Reference database for 125+ calibers. Ballistic calculations, filtering, comparison modal.

### Current State
- 125+ calibers with grain/velocity options per caliber
- Sortable/filterable by type, action, primary use
- Grain selector per row updates ballistics calculations live
- Comparison modal for up to 10 calibers
- Configurable zero distance, three downrange distances

### ⚠️ Known Gap: Ballistics Calculations
Current implementation uses **simplified approximations** — adequate for relative comparison only. Not suitable for production precision shooting use. Before shipping:

1. Integrate Applied Ballistics library (requires licensing from Applied Ballistics, LLC)
2. OR implement G1/G7 drag model with proper atmospheric correction (density altitude, temperature, humidity)
3. Minimum viable improvement: Replace exponential retention formula with actual ballistic coefficient math

**Current formula (approximation only):**
```javascript
// THIS IS NOT PRODUCTION-READY
const retentionFactor = Math.exp(-distance / 1000);
const velocityAtDistance = velocity * (0.6 + 0.4 * retentionFactor);
```

**Target formula (proper BC-based):**
```javascript
// Implement proper G7 drag model with:
// - Ballistic coefficient (G1 or G7)
// - Density altitude correction
// - Wind correction
// - Coriolis effect (optional, for ELR)
```

### Caliber Data Structure
```typescript
interface Caliber {
  name: string
  year: number
  type: 'Rifle' | 'Pistol' | 'Shotgun'
  action: 'Bolt' | 'Semi' | 'Lever' | 'Revolver' | 'Pump' | 'Double'
  primaryUse: 'Competition' | 'Hunting' | 'Defense' | 'Milsurp' | 'Safari' | 'Target'
  loads: {
    grain: number
    muzzleVelocityFPS: number
    bc_g1?: number
    bc_g7?: number
  }[]
  pricePerRound: number        // bulk FMJ/practice, updated from AmmoSeek
  priceUpdated: string
}
```

---

## 10. MODULE SPECS — TARGET ANALYSIS

### Purpose
Upload target images, detect bullet holes via Claude Vision, calculate group statistics, overlay scoring for supported disciplines.

### Five-Step Workflow
1. **Upload** — camera or photo library
2. **Scale** — user taps two known reference points (e.g., scoring rings) to establish MOA scale
3. **Detect** — Claude Vision API identifies bullet hole centers
4. **Tag** — user can reassign or delete detected holes; add shot call annotation (wind, shooter error, mechanical)
5. **Results** — group statistics + scoring overlay

### Group Statistics Output
- Extreme Spread (ES) in inches and MOA
- Mean Radius (MR) in inches and MOA
- Standard Deviation of radial distance
- Shot-to-shot delta (for diagnosing fliers)
- Center of group offset from point of aim

### Scoring Overlays
- **USPSA A/B/C/D/Miss zones** — alpha, charlie, delta percentage
- **B8 Repair Center** — point value per hole
- **NRL Hunter** — scoring per stage

### Claude Vision API Call (Target Detection)
```javascript
// POST to /v1/messages
{
  model: "claude-sonnet-4-20250514",
  messages: [{
    role: "user",
    content: [
      { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageData } },
      { type: "text", text: "Identify all bullet holes in this target image. Return JSON array of {x, y} pixel coordinates for the center of each hole. Return ONLY valid JSON, no other text." }
    ]
  }]
}
```

### Linking to Sessions
Target analysis results should be linkable to a Training Session record. Group data populates session analytics automatically when linked.

---

## 11. MODULE SPECS — GUNSMITHING WORKBENCH

**[PRO GATE]**

### Purpose
Tracks gunsmithing work — both professional work orders and personal maintenance. AI Advisor surfaces pattern-based diagnostics. Skill Academy provides structured learning curriculum.

### Three Tabs

#### Tab 1: Workshop (Work Order Tracking)
```typescript
interface WorkOrder {
  id: string
  gunId: string
  type: 'Maintenance' | 'Repair' | 'Modification' | 'Build' | 'Inspection'
  status: 'Pending' | 'In Progress' | 'Waiting Parts' | 'Complete' | 'Billed'
  description: string
  laborHours: number
  parts: WorkOrderPart[]
  totalCost: number
  completedDate?: string
  notes: string
  photos: string[]
}
```

#### Tab 2: Session Tracker
- Round count per gun (pulled from Training Log integration)
- Maintenance alerts based on round count thresholds (user-configurable per gun)
- **AI Advisor:** Feed session history + accuracy trends to Claude API to distinguish shooter error from mechanical wear
  - Example output: *"Your 6.5 Creedmoor has shown consistent fliers in shot positions 3 and 7 across the last 6 sessions. This pattern is more consistent with a mechanical issue (trigger reset or firing pin) than shooter error, which would produce random distribution."*

#### Tab 3: Skill Academy
Five curriculum tracks with structured lessons and milestone assessments:

| Track | Focus |
|-------|-------|
| Foundation | Safety, tools, basic disassembly/assembly, headspace |
| Precision Rifles | Action bedding, barrel fitting, trigger jobs, scope mounting |
| Semi-Auto Pistols | 1911/2011 platform, Glock gen work, trigger jobs, reliability |
| Shotguns | O/U fitting, choke selection, stock modification |
| Advanced / Specialty | NFA work, suppressor maintenance, custom builds |

Progress tracked per lesson. Milestone assessments unlock next track.

### AI Advisor Integration
```javascript
// AI Advisor prompt structure
const systemPrompt = `You are an expert gunsmith AI advisor. 
You have access to this gun's complete session history, maintenance log, and accuracy data. 
Your job is to identify patterns that suggest mechanical issues vs. shooter error.
Be specific. Reference actual data points. Sound like a knowledgeable gunsmith, not a chatbot.
Never recommend unsafe practices. Always advise professional inspection for safety-critical components.`
```

---

## 12. MODULE SPECS — WISHLIST

### Purpose
Track guns the user wants to acquire. Priority ranking, price alerts, market search simulation, acquire flow into Gun Vault.

### Features
- Priority ranking (drag to reorder)
- Condition grading targets (New, Used, etc.)
- Target price and alert threshold
- Caliber database integration (auto-pull ballistic context)
- Seller reputation filtering
- Simulated market search across GunBroker / PSA / Guns.com
- **Acquire flow** — converts wishlist item to Gun Vault entry with pre-populated fields

### Data Model
```typescript
interface WishlistItem {
  id: string
  make: string
  model: string
  caliber: string
  priority: number             // 1 = highest
  conditionTarget: string
  targetPrice: number
  alertThreshold: number       // notify if seen below this price
  notes: string
  addedDate: string
  links: string[]              // bookmarked listings
}
```

---

## 13. MODULE SPECS — COMPETITION TRACKER (PLANNED)

**[PRO GATE]**

### Purpose
Match registration, stage planning, result entry, classifier tracking, ranking progression.

### Key Features (Design Pending)
- PractiScore import (primary integration — high priority)
- Classifier performance tracking (USPSA/IPSC)
- Match calendar with pre-match ammo reservation from Arsenal
- Stage-by-stage result entry with hit factor calculation
- Division and class tracking
- Match travel/cost tracking

### PractiScore Integration
PractiScore 2 is a high-priority integration. User can import match results directly. Investigate PractiScore API availability.

---

## 14. MODULE SPECS — HUNTING LOG (PLANNED)

**[PRO GATE]**

### Purpose
Hunt logging, harvest tracking, license/tag management, property mapping.

### Key Features (Design Pending)
- Hunt log: date, species, location, conditions, firearm, ammo lot used
- Harvest entry: photos, weight, distance of shot, one-shot/follow-up
- License and tag management with expiration alerts
- onX Hunt integration for property boundaries
- Shot distance and terminal performance correlation with ammo lots

---

## 15. MONETIZATION & FREEMIUM GATES

### Free Tier (Forever Free)
- Gun Vault (full)
- Shooting Log / Training Log (full)
- Maintenance Tracker
- Ammo Inventory / Arsenal
- Caliber Database
- Wishlist
- Optics Manager
- Organizations

### Pro Tier ($X/month or $Y/year via Stripe)
- Reloading Bench
- Competition Tracker
- Gunsmithing Workbench
- Hunting Log
- Cloud Backup (Supabase sync)
- Advanced Analytics

### Hard Rules on Monetization
- **No affiliate links. Ever.** Firm brand decision — no exceptions.
- No ads. The trust of the community is the product.
- "No registry language" enforced in all UI copy — avoid words like "register your firearm." Guns are "added to your vault."

---

## 16. REAL COLLECTION DATA (SEED / DEMO)

James's actual collection of 67 firearms. Use as seed data and demo data for development. All data sourced from Gun_Library.xlsx.

### Firearms by Category

#### Pistols
| Make | Model | Caliber | Action | Serial |
|------|-------|---------|--------|--------|
| Staccato | P 2011 | 9mm | Semi-Auto | [verify] |
| Glock | 17 Gen 5 | 9mm | Semi-Auto | — |
| Glock | 19 Gen 5 | 9mm | Semi-Auto | — |
| Glock | 21 Gen 4 | .45 ACP | Semi-Auto | [flag - verify serial] |
| Glock | 43X | 9mm | Semi-Auto | — |
| STC (Glock 43 platform) | — | 9mm | Semi-Auto | [flag - verify serial] |
| Walther | PPK/S | .380 ACP | Semi-Auto | [flag - verify serial] |
| Canik | TTI Combat | 9mm | Semi-Auto | [flag - verify serial] |
| Springfield Armory | 1911 | .45 ACP | Semi-Auto | — |
| Smith & Wesson | M&P 2.0 | 9mm | Semi-Auto | — |
| Smith & Wesson | 686 | .357 Mag | Revolver | — |
| Ruger | GP100 | .357 Mag | Revolver | — |
| Colt | Python | .357 Mag | Revolver | — |

#### Rifles
| Make | Model | Caliber | Action | Notes |
|------|-------|---------|--------|-------|
| Custom | PRS Build | 6.5 Creedmoor | Bolt | Primary competition rifle |
| Remington | 700 SPS | .308 Win | Bolt | — |
| Remington | 700 SPS | .30-06 | Bolt | — |
| Tikka | T3x | 6.5 Creedmoor | Bolt | — |
| Ruger | Precision Rifle | 6.5 Creedmoor | Bolt | — |
| Custom | AR-15 | 5.56 NATO | Semi-Auto | Primary tactical rifle |
| Daniel Defense | DDM4 | 5.56 NATO | Semi-Auto | — |
| BCM | RECCE-16 | 5.56 NATO | Semi-Auto | — |
| CMMG | Banshee | .300 Blackout | Semi-Auto | — |
| Zastava | ZPAP M70 | 7.62x39mm | Semi-Auto | — |
| CZ | Scorpion EVO | 9mm | Semi-Auto | — |
| Ruger | 10/22 | .22 LR | Semi-Auto | — |
| Marlin | 336 | .30-30 Win | Lever | — |
| Henry | Big Boy | .357 Mag | Lever | — |
| Mosin-Nagant | M91/30 | 7.62x54R | Bolt | [flag - verify serial] |
| Lee-Enfield | No.4 Mk.1 | .303 British | Bolt | — |
| Winchester | Model 70 | .300 Win Mag | Bolt | — |
| Savage | 110 | .338 Lapua | Bolt | — |

#### Shotguns
| Make | Model | Gauge | Action | Notes |
|------|-------|-------|--------|-------|
| Beretta | A400 Xcel | 12ga | Semi-Auto | Primary competition shotgun |
| Benelli | M2 | 12ga | Semi-Auto | — |
| Mossberg | 500 | 12ga | Pump | — |
| Remington | 870 | 12ga | Pump | — |
| Caesar Guerini | Tempio | 12ga | O/U | — |

*Full 67-gun manifest is in Gun_Library.xlsx — import all data on first run.*

### Calibers in Collection (for Arsenal seed data)
- 9mm — primary pistol
- .45 ACP
- .357 Magnum
- .380 ACP
- 5.56mm NATO / .223 Rem
- .308 Win / 7.62x51mm NATO
- 6.5 Creedmoor — primary precision rifle
- .300 Win Mag
- .338 Lapua
- .300 Blackout
- 7.62x39mm
- 7.62x54R
- .303 British
- .30-30 Win
- .30-06
- .22 LR
- 12 gauge

---

## 17. DATA MODEL — CORE ENTITIES

### Entity Relationship Overview
```
Gun (1) ——< Session (many)
Gun (1) ——< MaintenanceEntry (many)
Gun (1) ——< OpticAttachment (many)
Session (1) ——< DrillResult (many)
Session (1) ——< ChronoReading (many)
Session (many) >—— AmmoLot (1)       [depletes inventory]
AmmoLot (1) ——< AmmoBatch (1)        [handloads only]
AmmoBatch uses Component (many)
WorkOrder (1) belongs to Gun (1)
WorkOrder (1) ——< WorkOrderPart (many)
```

### SQLite Schema (Core Tables — Abbreviated)

```sql
CREATE TABLE guns (
  id TEXT PRIMARY KEY,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  caliber TEXT NOT NULL,
  action TEXT NOT NULL,
  type TEXT NOT NULL,
  serial_number TEXT,
  acquired_date TEXT,
  acquired_price REAL,
  acquired_from TEXT,
  condition TEXT,
  status TEXT DEFAULT 'Active',
  barrel_length REAL,
  weight REAL,
  finish TEXT,
  notes TEXT,
  image_url TEXT,
  insurance_value REAL,
  estimated_fmv REAL,
  fmv_updated TEXT,
  nfa_item INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  gun_id TEXT NOT NULL REFERENCES guns(id),
  ammo_lot_id TEXT REFERENCES ammo_lots(id),
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  discipline TEXT,
  rounds_expended INTEGER NOT NULL,
  duration_minutes INTEGER,
  location TEXT,
  temp_f REAL,
  humidity REAL,
  wind_speed REAL,
  wind_direction INTEGER,
  altitude_ft REAL,
  notes TEXT,
  rating INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ammo_lots (
  id TEXT PRIMARY KEY,
  caliber TEXT NOT NULL,
  brand TEXT NOT NULL,
  product_line TEXT,
  grain_weight REAL NOT NULL,
  bullet_type TEXT,
  quantity INTEGER NOT NULL,
  quantity_purchased INTEGER,
  purchase_date TEXT,
  price_per_round REAL,
  storage_location TEXT,
  lot_number TEXT,
  advertised_fps INTEGER,
  actual_fps REAL,
  bc REAL,
  sd_fps REAL,
  is_handload INTEGER DEFAULT 0,
  reload_batch_id TEXT REFERENCES ammo_batches(id),
  min_stock_alert INTEGER DEFAULT 0,
  reserved INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ammo_batches (
  id TEXT PRIMARY KEY,
  batch_number TEXT NOT NULL,
  caliber TEXT NOT NULL,
  date_created TEXT NOT NULL,
  recipe_json TEXT NOT NULL,   -- immutable snapshot
  rounds_produced INTEGER,
  rounds_remaining INTEGER,
  cost_per_round REAL,
  avg_fps REAL,
  sd_fps REAL,
  session_count INTEGER DEFAULT 0,
  rounds_downrange INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Active',
  match_reservation TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE maintenance_entries (
  id TEXT PRIMARY KEY,
  gun_id TEXT NOT NULL REFERENCES guns(id),
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  rounds_at_service INTEGER,
  cost REAL,
  performed_by TEXT,
  next_service_rounds INTEGER,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Round count is a computed view, not a stored field
CREATE VIEW gun_round_counts AS
  SELECT gun_id, SUM(rounds_expended) as total_rounds
  FROM sessions
  GROUP BY gun_id;
```

---

## 18. AI FEATURES & API INTEGRATION

### Anthropic API Usage

#### Target Analysis (Computer Vision)
- Model: `claude-sonnet-4-20250514`
- Input: Base64 encoded target image
- Output: JSON array of bullet hole pixel coordinates
- Post-process: Calculate group statistics from coordinates + scale factor

#### AI Advisor (Gunsmithing / Diagnostics)
- Model: `claude-sonnet-4-20250514`
- System prompt: Expert gunsmith persona with session history context
- Input: Session history JSON + maintenance log + accuracy trends
- Output: Natural language diagnostic with specific data references
- Tone: Knowledgeable friend, not a notification

#### Reloading Recommendations (Future)
- Feed: batch performance data, component combinations, session conditions
- Output: Powder charge recommendations, seating depth suggestions, component pairings

### API Call Pattern
```typescript
// lib/ai.ts
export async function callAdvisor(systemPrompt: string, userContext: object): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: JSON.stringify(userContext) }]
    })
  })
  const data = await response.json()
  return data.content[0].text
}
```

---

## 19. THIRD-PARTY INTEGRATIONS ROADMAP

| Integration | Priority | Status | Notes |
|-------------|----------|--------|-------|
| PractiScore 2 | HIGH | Research needed | Match result import; check API availability |
| GunBroker | HIGH | Research needed | FMV from sold listings, market search in Wishlist |
| AmmoSeek | HIGH | Research needed | Live ammo pricing for Arsenal restocking alerts |
| Pollinations.ai | MEDIUM | Researched | Free image generation for gun photos |
| Applied Ballistics | MEDIUM | Requires license | Proper ballistics engine — contact AB for licensing |
| Mantis X | MEDIUM | GitHub API (unofficial) | Dry fire and live fire metrics |
| Kestrel BLE | MEDIUM | BLE integration | Environmental data auto-import into sessions |
| LabRadar | MEDIUM | BLE/WiFi | Chrono data auto-import |
| MagnetoSpeed | LOW | USB/BT | Chrono data import |
| onX Hunt | LOW | Research needed | Property data for Hunting Log |

---

## 20. HARD PRODUCT RULES (NON-NEGOTIABLE)

These were decided intentionally and should not be reversed without deliberate discussion.

1. **No affiliate links. Ever.** Not now, not in v2. Brand decision.
2. **No registry language.** Guns are "added to your vault," not "registered." Copy review required before any new UI string.
3. **Guns are never deleted.** Status transitions: Active → Stored → Transferred → Decommissioned. Hard delete is not exposed in UI.
4. **Round count can only increase via logged sessions.** No manual round count edits. Enforced at the data layer.
5. **Recipe snapshots are immutable** after a batch is finalized. Editing the recipe creates a new batch, not a retroactive edit.
6. **Mandatory disclaimer on all load recipes:** *"Always consult published reloading data. Never exceed maximum loads. The developer is not responsible for use of data in this app."*
7. **Biometric lock on by default.** User must explicitly disable.
8. **No affiliate-style "sponsored" ammo recommendations.** Price data from AmmoSeek is factual, not paid placement.
9. **SD color thresholds are fixed to industry standard** (≤10 green, 11-15 yellow, >15 red). Not user-configurable.
10. **Serial numbers are stored locally only.** Never transmitted to Supabase unless user explicitly enables cloud sync AND acknowledges data handling.

---

## 21. NAVIGATION ARCHITECTURE

### Root Navigation
```
Bottom Tab Bar:
  [Vault]  [Arsenal]  [Reloading]  [Training]  [More]

More Hub:
  → Caliber Database
  → Target Analysis
  → Gunsmithing Workbench
  → Competition Tracker
  → Hunting Log
  → Wishlist
  → Optics Manager
  → Organizations
  → Settings
```

### Screen Stack Examples
```
Vault Tab:
  GunListScreen
    → GunDetailBottomSheet (slide-up)
        → GunFullDetailScreen (push, with tabs)
            → EditGunScreen (push)
            → MaintenanceLogScreen (push)
            → OpticsScreen (push)

Arsenal Tab:
  CaliberRollupScreen
    → LotListScreen (push)
        → LotDetailBottomSheet (slide-up)
            → LotFullDetailScreen (push)

Training Tab:
  SessionListScreen
    → LogSessionScreen (modal)
    → SessionDetailScreen (push)
        → TargetAnalysisScreen (push, if targets attached)
```

### Modal vs Push Rules
- **Bottom sheet:** Quick preview, action confirmation, short-form entry
- **Push (stack nav):** Full editing, deep detail, multi-step flows
- **Modal (full-screen):** Session logging, target upload, settings

---

## 22. KNOWN GAPS & OUTSTANDING DECISIONS

### Technical Gaps
- [ ] **Ballistics engine** — replace approximation with proper G1/G7 drag model before production (see Section 9)
- [ ] **Applied Ballistics licensing** — contact AB for SDK/data licensing terms
- [ ] **PractiScore API** — verify API availability and auth method
- [ ] **GunBroker API** — research sold listing endpoint for FMV pulls
- [ ] **AmmoSeek API** — research pricing endpoint

### Design Decisions Pending
- [ ] Competition Tracker full design (module spec not complete)
- [ ] Hunting Log full design (module spec not complete)
- [ ] First-launch onboarding wizard (3-question max, fast-track for experienced users)
- [ ] GUNTRACK competitor full teardown — document feature gaps to exploit

### Data Questions
- [ ] Verify serial numbers flagged in Section 5 (Glock 21, STC Glock 43, Walther PPK/S, Canik TTI, Mosin-Nagant)
- [ ] Import full Gun_Library.xlsx (13 sheets) as authoritative seed data
- [ ] Confirm full 67-gun manifest from spreadsheet

### Product Decisions Pending
- [ ] Exact Pro subscription price point (monthly and annual)
- [ ] App name (placeholder: "VAULT" or "GUNVAULT" — TBD)
- [ ] App Store category strategy
- [ ] Beta testing cohort (competitive shooting community contacts)

---

*End of handoff document. Drop this into Claude Code as your first context file. Start with schema.ts and the Gun Vault module.*
