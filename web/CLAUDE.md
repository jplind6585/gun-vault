# Lindcott Armory — Developer Handoff

## ⚠️ Critical rules

- **This repo is the app only.** The marketing site (`lindcottarmory.com`) lives in a separate folder (`lindcott-website/`) on James's Desktop. Do NOT reference, modify, or create any marketing-site files here.
- **Do NOT change what unauthenticated users see** (`LoginScreen`, or anything rendered when `!user` in App.tsx) without explicit approval. This caused a major incident on 2026-04-14.
- **Do NOT modify `index.html`** without explicit approval. The app shell must not contain any marketing copy.
- **Do NOT deploy to Production track** without explicit confirmation from James. Default Android pushes go to Internal Testing only.
- **Do NOT remove or weaken AI guardrails** in `claudeApi.ts` or the `armory-assistant` edge function.
- **Do NOT expose Test Tools** to any account other than `james@lindcottarmory.com`.
- **Do NOT hard-delete a gun that has sessions.** See Data Integrity Rules below.
- If in doubt: stop and ask. Rolling back is painful.

---

## What this is

A personal firearms management app for responsible gun owners. Brand: **Lindcott Armory**, sub-brand of Lindcott Farms.

- **Live app**: `app.lindcottarmory.com` (Netlify, auto-deploys from `develop`)
- **Marketing site**: `lindcottarmory.com` — separate folder, separate project, not in scope here
- **Android**: Play Store, package `com.lindcottarmory.app`
- **iOS**: Apple Dev account exists, Fastlane + GitHub Actions CI planned but not built yet

---

## Tech stack

| Layer | Tech |
|---|---|
| UI | React 19 + TypeScript + Vite |
| Styling | **Inline styles + `theme.ts`** — no CSS framework, no Tailwind |
| State | `useState` / `useEffect` — no Redux/Zustand |
| Persistence | `localStorage` (offline-first) + Supabase cloud sync |
| Auth | Supabase Auth (email/password) |
| Native | Capacitor (Android only currently) |
| AI | Claude API (`claude-sonnet-4-6`) via Supabase Edge Function (`armory-assistant`) |
| Tests | Vitest + React Testing Library + jsdom |

**Styling standard:** All styling uses inline React style objects referencing `theme.ts` color tokens. No utility classes, no CSS modules, no Tailwind. Keep this consistent — do not introduce a second styling system.

---

## Design system

All color tokens live in `theme.ts`. Reference them by name — never hardcode hex values inline.

| Token | Value | Usage |
|---|---|---|
| `theme.bg` | `#07071a` | Page background |
| `theme.surface` | `#0e0e2a` | Cards, modals, sheets |
| `theme.accent` | `#ffd43b` | Primary CTA, active states |
| `theme.textPrimary` | `#ffffff` | Headings, primary copy |
| `theme.textSecondary` | `#a0a0a0` | Labels, supporting copy |
| `theme.textMuted` | `#555577` | Placeholders, disabled |
| `theme.border` | `rgba(255,255,255,0.08)` | Dividers, input borders |
| `theme.red` | `#ff6b6b` | Errors, danger |
| `theme.green` | `#51cf66` | Success, positive states |
| `theme.orange` | `#ff9f43` | Warnings |

- Dark theme throughout — no light mode
- Single accent color only — do not introduce additional accent colors
- No emojis in any UI copy
- Monospace font for all data fields (round counts, measurements, prices, dates)

---

## Repo structure

```
gun-app/
├── web/                      # This app (you are here)
│   ├── src/                  # React source
│   ├── android/              # Capacitor Android project
│   ├── public/               # Static assets
│   └── index.html            # App shell only — no marketing content
├── scripts/                  # Infrastructure scripts (e.g. Sheets sync)
│   └── sheets-sync/          # supabase-to-sheets.js — Google Apps Script source
└── supabase/
    └── migrations/           # SQL migrations — run manually in Supabase SQL Editor
```

The `website/` (marketing site) is **not in this repo**. It lives at `~/Desktop/lindcott-website/` and has its own Claude.md.

---

## App structure (`web/src/`)

```
src/
├── App.tsx                   # Root — routing, global state
├── types.ts                  # All shared TypeScript interfaces (Gun, Session, AmmoLot…)
├── storage.ts                # ALL localStorage read/write — single source of truth
├── theme.ts                  # Color palette and design tokens
├── main.tsx                  # Vite entry point
│
├── HomePage.tsx              # Dashboard — stats, top guns, armory alerts
├── GunVault.tsx              # Gun list view
├── GunDetail.tsx             # Single gun detail (tabs: overview, sessions, maintenance, ammo, timeline)
├── AddGunForm.tsx            # Add/edit gun form
├── Arsenal.tsx               # Ammo inventory — lots, totals, usage
├── OpticsList.tsx            # Optics inventory list
├── OpticDetail.tsx           # Single optic detail
├── SessionLoggingModal.tsx   # Quick log session modal
├── SessionLogView.tsx        # Full-page session logging (multi-gun, multi-distance)
├── SessionEntry.tsx          # Individual session entry component
├── SessionRecaps.tsx         # Session history list
├── ArmoryAssistant.tsx       # Claude AI chat assistant
├── TargetAnalysis.tsx        # Shot group stats (MOA, CEP, ES, SD)
├── CaliberDatabase.tsx       # In-app caliber reference browser
├── FieldGuide.tsx            # In-app field guide (encyclopedia)
├── MoreMenu.tsx              # More tab — grid of secondary tools
├── FeedbackModal.tsx         # Support / feedback form
├── SettingsPanel.tsx         # Settings + Test Tools (dev-only, james@lindcottarmory.com only)
├── AppHeader.tsx             # Shared top header with back nav
├── MobileNav.tsx             # Bottom tab bar
├── LegalDocs.tsx             # Terms + Privacy in-app viewer
├── UpgradeModal.tsx          # Pro upgrade flow
├── ReloadingBench.tsx        # Reloading module
├── TrainingLog.tsx           # Training log module
├── GearLocker.tsx            # Gear locker module
├── Wishlist.tsx              # Wishlist module
│
├── auth/
│   ├── LoginScreen.tsx       # Unauthenticated view — DO NOT CHANGE without approval
│   ├── AuthProvider.tsx
│   └── PasscodeGate.tsx
│
├── lib/
│   ├── supabase.ts           # Supabase client
│   ├── sync.ts               # Cloud sync logic
│   ├── billing.ts            # Pro billing / tier logic
│   ├── referenceData.ts      # Supabase reference table queries (manufacturers, gun_models, etc.)
│   └── RetailerInput.tsx     # Shared retailer autocomplete component
│
├── gunDatabase.ts            # Local make/model autocomplete + spec lookup
├── claudeApi.ts              # Claude API wrapper + system prompt + guardrails
├── seedData.ts / seedSessions.ts / seedAmmo.ts / seedCartridges.ts
└── __tests__/                # Vitest test files
```

---

## Module status

| Module | Status |
|---|---|
| Gun Vault | Complete |
| Arsenal (Ammo) | Complete |
| Optics Locker | Complete |
| Session Log | Complete |
| Target Analysis | Complete |
| Caliber Database | Complete (198 cartridges) |
| Field Guide | Complete — Cartridges, Platforms, Ballistics, Glossary, Optics sections live |
| Reloading Bench | Complete |
| Training Log | Built but hidden — needs full redesign (HIGH PRIORITY) |
| Gear Locker | Built but hidden — needs redesign (lower priority) |
| Wishlist | Complete |
| Armory Assistant (AI) | Complete |
| Backup & Restore | Complete |
| Insurance Export (CSV) | Complete |
| Smart Search | Complete |
| Field Guide — Maintenance section | Hidden — deferred |
| Field Guide — Competition section | Hidden — deferred |
| Field Guide — Marksmanship section | Hidden — deferred |
| Gunsmithing / Work Orders | Coming Soon stub only |
| Find Events | Coming Soon stub only |
| Onboarding flow | Not built — pre-launch blocker |
| Freemium gating (RevenueCat) | Not built — pre-launch blocker |

Do not build into hidden or Coming Soon modules without an explicit task from James.

---

## Data model

All user data lives in `localStorage`. Keys:

| Key | Type | Description |
|---|---|---|
| `gunvault_guns` | `Gun[]` | All firearms |
| `gunvault_sessions` | `Session[]` | Range sessions |
| `gunvault_ammo` | `AmmoLot[]` | Ammo inventory lots |
| `gunvault_initialized` | `boolean` | Whether seed data has been loaded |
| `gunvault_is_demo` | `boolean` | Demo mode flag |
| `gunvault_settings` | `Settings` | User preferences |
| `gunvault_profile` | `ShooterProfile` | Shooter profile, badge progress |

**The `storage.ts` contract:** `storage.ts` is the only file that reads or writes `localStorage`. No component may call `localStorage.getItem/setItem` directly.

**The sync contract:** `localStorage` is always written first. Supabase sync happens in the background. UI never awaits a Supabase read — offline use is a core requirement.

---

## Data integrity rules

**Gun deletion:**
- A gun with logged sessions **must never be hard-deleted.** Set `status` to `'Decommissioned'` instead.
- A gun with no session history may be hard-deleted. Check before offering the option.

**Round counts:**
- `Gun.roundCount` is computed solely from logged sessions. It must never be manually editable.

**Cross-table references:**
- Sessions, optic assignments, optic zeros, and target analyses all reference `gunId`. Any deletion logic must account for all four.
- `ammoLotId` references exist in sessions and optic zeros. Same rule.

**Serial numbers:**
- `Gun.serialNumber` is sensitive PII. Never log it, pass it to AI, or include it in analytics.

**No "registry" language:**
- Never use the word "registry" in any UI copy, tooltip, label, or notification.

---

## AI guardrails

The `armory-assistant` edge function proxies Claude API calls. The system prompt in `claudeApi.ts` must always refuse:

- Illegal weapon modifications (bump stocks, auto conversions, unregistered SBRs/SBSs, etc.)
- Circumventing background checks or legal transfer processes
- Jurisdiction-variable legal advice
- Any topic outside lawful firearm ownership, maintenance, collection, and historical/educational content

**Do not remove or soften these guardrails.** If editing `claudeApi.ts`, preserve the guardrail block verbatim.

**Model:** Always use `claude-sonnet-4-6`. Do not upgrade without confirming cost implications with James.

**Rate limiting:** Enforced at the edge function level via the `ai_usage` Supabase table. Do not move to the client.

---

## Monetization tiers

RevenueCat integration is not fully built yet — a pre-launch task. Respect tier rules now so no gated feature is accidentally exposed.

| Tier | What's included |
|---|---|
| **Free** | Up to 10 active guns, manual tracking, local storage only, no AI |
| **Pro** | Unlimited guns, cloud sync, AI Assistant, Target Analysis, AI session narratives |

**Pricing:** $10/mo full price. $5/mo for early access users (50% discount, shown in UpgradeModal).

**Gate enforcement (as of April 16, 2026):**
- Gun limit: `handleRequestAddGun()` in App.tsx blocks add when `allGuns.filter(active).length >= 10` and `!isPro`
- AI Assistant: `navigateTo('assistant')` blocked when `!isPro`
- Target Analysis: `navigateTo('target-analysis')` blocked when `!isPro`
- `isPro` state loaded via `getProStatus(userId)` in `billing.ts` after auth

**RevenueCat (Android):**
- SDK key: `test_EiWsEeRjBKxeByKZkXoybIhKLyS` (Test Store — skipped in production init)
- Products set up: Monthly, Yearly, Lifetime (all linked to 1 entitlement)
- Production key needed: connect Google Play Console app in RevenueCat → Apps & Providers → get real Android SDK key → add as `VITE_REVENUECAT_GOOGLE_API_KEY` in Netlify env vars
- `billing.ts` skips init for `test_` prefixed keys; pro status falls back to Supabase check

**Web claim flow:** `claim-pro` edge function deployed in Supabase. Free 30-day early access claim. `onUpgradeSuccess` callback in `UpgradeModal` sets `isPro(true)` in App.tsx without reload.

Gate checks go through `billing.ts`. Do not add AI features accessible to Free users.

---

## Testing environments

| Account | Purpose | Rules |
|---|---|---|
| `jamesplindberg@gmail.com` | James's real vault — personal guns, real data | Full Pro+AI always on. **Never wipe. Never use for testing.** |
| `james@lindcottarmory.com` | Dev/test account | Test Tools accessible. Can be wiped, seeded, or set to any tier. |

**Test Tools** (in `SettingsPanel.tsx`) are gated to `james@lindcottarmory.com` only. The gate must never be removed or widened.

---

## Deployment

### Default "push" — always run the full 5-step flow

When James says "push", "push it", or "deploy" — do all of this:

```bash
# 0. Run e2e tests — must pass before building
cd web && npm run test:e2e

# 1. Bump versionCode in android/app/build.gradle (current: 20)
# 2. Build web assets
npm run build

# 3. Sync to Android
npx cap sync android

# 4. Build AAB + upload to Internal Testing
cd android && fastlane internal

# 5. Push to git (Netlify auto-deploys web from develop)
cd .. && git push origin main
```

**E2e test gate (step 0):**
- If tests fail, diagnose and fix before proceeding. Re-run until all 4 pass.
- If a fix requires code changes, make them, re-run, confirm green, then continue the push.
- If a test fails because a UI flow was intentionally reworked (not a regression), flag it to James rather than silently patching the test to pass — the test may need to be updated to match the new intended behavior.
- Tests run against the dev server (`npm run dev`), so they catch logic/UI regressions but not build-time TypeScript errors.

**Exception:** If James says "quick push" or "web only" → `git push origin main` only. Skip the Android build AND skip the e2e tests.

### Fastlane lanes (`android/fastlane/Fastfile`)

| Lane | Track | When to use |
|---|---|---|
| `fastlane internal` | Internal Testing | **Default** — every dev build, instant, up to 100 testers |
| `fastlane beta` | Closed Testing (Alpha) | Milestone builds for wider feedback |
| `fastlane deploy` | Production (all users) | Deliberate releases only — confirm with James first |

Run `fastlane` directly. Do NOT use `bundle exec fastlane`.
Key file: `android/fastlane/play-store-key.json` (gitignored).

### Web (Netlify)
Fires automatically on `git push origin main`. No extra step needed. Live in ~60 seconds at `app.lindcottarmory.com`.

Netlify is configured to watch `main` — confirmed 2026-04-26. The `develop` branch exists but Netlify does not deploy from it.

### versionCode
Must increment before every Play Store upload. **Current: 20** (v20 is live in Google Closed Testing and is the iOS v1 baseline). Play Store rejects any build ≤ last uploaded value.

### Branch strategy
```
ios-v1-baseline  ← git tag, frozen — build iOS v1 from this
main             ← frozen at v20, only updated when cutting a store release
develop          ← active development branch, Netlify deploys from here
feature/*        ← short-lived branches per phase, PR into develop
```

**Store release rule:** Never run `fastlane internal`, `fastlane beta`, or `fastlane deploy` unless the Feature Roadmap (below) explicitly says a phase is store-ready AND James confirms. Play Store and App Store builds happen from tagged commits only.

### Next store build checklist (v21)
Before the next `fastlane internal` run:
1. Phase 1 + Phase 2 features merged and tested on `develop`
2. Get production RevenueCat Android SDK key (connect Google Play Console → RevenueCat → Apps & Providers)
3. Add key as `VITE_REVENUECAT_GOOGLE_API_KEY` in Netlify env vars and `.env.local`
4. Bump versionCode to 21
5. Run e2e tests, build, sync, fastlane internal

---

## Feature Roadmap — Phased Build Plan

Five spec documents define the next major build cycle. Full specs in `~/Downloads/`:
- `free-pro-spec.md` — freemium gate architecture
- `armory-assistant-spec.md` — 12 AI assistant features in 3 phases
- `reloading-bench-spec.md` — reloading module V1 (data foundation) + V2 (intelligence)
- `powder-database-schema.md` — `powders` reference table + `powder_substitutions` join table
- `environmental-data-spec.md` — weather/altitude capture on sessions

### Dependency order
```
Free/Pro Gate Architecture (Phase 1)
  └─ required for all Pro feature gating

Powder Database (Phase 2)
  └─ required for: ReloadingBench autocomplete, Armory Assistant substitution

Reloading Data Migration: reloading_data → load_recipes
  └─ must run before any Reloading Bench V1 module is built
  └─ write + test as SELECT preview in SQL Editor before running as INSERT

Environmental Data Schema: ADD COLUMN to sessions (Phase 4)
  └─ required for: Armory Assistant Feature 6, Reloading Bench Module 3

Reloading Bench V1 (Phase 3)
  └─ required before V2 (real user data must exist first)
```

### Phase table

| Phase | Work | Status | Store build? |
|---|---|---|---|
| **0 — Baseline** | Tag `ios-v1-baseline`, create `develop` branch, flip Netlify to `develop` | ✅ Done | iOS v1 from tag |
| **DB — Reference Data** | manufacturers v3+v4 (153 rows), gun_models v4 (351 rows) | ✅ Done 2026-04-25 | — |
| **1 — Gates + AA P1** | Free/Pro gating, remove 10-gun limit, AssistantPreviewScreen, AA Features 3/5/8/11 | Not started | No |
| **2 — Powder DB** | `powders` + `powder_substitutions` tables, ~350 Phase 1 rows seeded, ReloadingBench autocomplete | Not started | No |
| **3 — Reloading V1** | Migration (`reloading_data` → `load_recipes`) + Modules 1/2/6/8/9 | Not started | **v21 — `fastlane beta`** |
| **4 — Environmental** | `sessions` schema additions, weather Edge Function, session logging UI | Not started | No |
| **5 — Intelligence** | AA Phase 2 (Features 1/2/4/12), Reloading Bench V2 (Modules 3/4/5/7) | Not started | **v22 — `fastlane beta`** |
| **6 — AA Phase 3** | AA Features 6/7/9 (zero drift, reloading correlation, carry audit) | Not started | **v23 — Production?** |

### Phase rules
- **Do not start Phase 5 until real V1 reloading data exists** (the intelligence layer needs real user data to be meaningful)
- **Do not build Module 7** (Reloading Performance Intelligence) until `load_recipes → ammo_lot → target_analyses` linkage is verified as reliably populated
- **Do not build Armory Assistant Feature 7** until same linkage chain is confirmed
- **Do not build Module 5** (Beginner Onboarding) until session purpose data and caliber cost signals are audited — if signals are sparse, use a manual entry point instead
- **Environmental data spec must be finalized before building Reloading Bench Module 3 or AA Feature 6** — retrofitting environmental fields later is expensive

### Reloading data migration safety
The existing `reloading_data` table has real user data. Before any schema changes:
1. Write migration SQL as a `SELECT` preview — confirm row counts are correct
2. Run as `INSERT INTO load_recipes SELECT ... FROM reloading_data`
3. Verify all rows migrated with no data loss
4. Keep `reloading_data` table intact until `load_recipes` is confirmed stable
5. Never delete or modify existing `reloading_data` records in place

---

## Reference Data Status (as of 2026-04-25)

All migrations live in `supabase/migrations/`. Run manually via `supabase db query --linked -f <file>`.

### `manufacturers` table — v4 complete
- **153 rows** total
- **Schema** (v3 additions): `entity_type`, `known_for`, `notable_designers`, `price_tier_entry_usd`, `has_military_contract`, `military_notes`, `trivia`
- **Schema** (v4 additions): `production_countries` (text[]), `collector_prestige_tier` (Low/Medium/High/Legendary), `signature_model`
- **Coverage**: 153/153 have `collector_prestige_tier`, 138/153 have `production_countries`, 62/153 have `signature_model`
- **Notable additions**: Bergara, Howa, Miroku, Grand Power, Molot, ROMARM/Cugir, DWM, Rock-Ola, Singer, Union Switch & Signal, Cadex Defence, MasterPiece Arms, Zermatt Arms, Victrix Armaments, Bul Armory

### `gun_models` table — v4 complete
- **351 rows** total
- **Schema** (v4 additions): `trigger_type`, `intended_use` (text[]), `trivia`, `country_of_manufacture`, `collector_notes`, `is_collectible`
- **Key fixes applied**: Rifle/shotgun weights corrected from lbs→oz (multiply ×16); revolver type bug fixed; Staccato stubs deleted; Glock Gen6 flagged as Speculative/Unreleased; AK-47 year corrected to 1947
- **Notable additions**: M1 Garand, M1903 Springfield, Browning Auto-5, Browning Hi-Power, Winchester Model 12, Weatherby Mark V, S&W Model 19/27/500, Ruger Blackhawk, Sako 85/TRG-22, Bergara B-14 HMR, Thompson M1A1, Walther PPK, CZ 75 SP-01 Shadow, and more

---

## Supabase

Used for: Auth, cloud sync (guns/sessions/ammo), edge functions, feedback, and reference data.

**Reference tables** (public read, no RLS):
`manufacturers`, `gun_models`, `optic_models`, `cartridges`, `ammo_brands`, `bullet_types`, `powder_brands`, `primer_types`, `gun_ranges`, `gun_clubs`, `retailers`, `retailer_categories`

**User data tables** (RLS enforced — users read/write only their own rows):
`guns`, `sessions`, `ammo_lots`, `target_analyses`, `optics`, `mounts`, `optic_assignments`, `optic_zeros`, `wishlist_items`, `gear_items`, `reloading_data`, `training_sessions`, `user_settings`, `ai_usage`

**RLS on `guns` is security-critical** (stores serial numbers). Never weaken or remove those policies.

SQL migrations live in `supabase/migrations/` and are run manually in the Supabase SQL Editor.

`.env` is gitignored. Ask James for values.

### Google Sheets sync
Script source: `scripts/sheets-sync/supabase-to-sheets.js`
Hosted at: script.google.com — project "Weekly Table Sync w/ Supabase"
To sync immediately: open Apps Script → select `runNow` → Run
Runs automatically every Monday 6 AM. Does not auto-trigger when SQL is run.

---

## Common patterns

### Navigation
`App.tsx` manages `currentView` (string union). No React Router — conditional JSX with `setCurrentView(...)` passed as props.

### Refreshing after mutation
```tsx
// Parent (App.tsx)
const [gunRefreshKey, setGunRefreshKey] = useState(0);
setGunRefreshKey(k => k + 1); // after mutation

// Child
useEffect(() => { setGuns(getAllGuns()); }, [refreshKey]);
```

### Undo
`useUndo` hook manages a 5-second undo window. `UndoToast` renders above the bottom nav.

### Safe area insets
Use `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` for notch/home bar spacing.

### Ballistics math
Do not reimplement ballistics calculations. Use the existing validated implementation in full — no approximations.

---

## Roadmap maintenance

After any session where a feature is completed, deferred, descoped, or newly discussed — update `~/Desktop/armory-roadmap.md` before ending. Mark completed items `[x]`, add deferred items with a status note. This is James's primary reference for what has and hasn't been built.

---

## Running locally

```bash
cd web
npm install
npm run dev        # Vite dev server on localhost:5173
```

### Tests
```bash
npm run test:run   # run all tests once
npm run test       # watch mode
```

Current test coverage: `storage.test.ts`, `calculations.test.ts`, `homeStats.test.ts`, `AddGunForm.test.tsx`

---

## Pre-ship checklist

Before every push:

1. `versionCode` in `android/app/build.gradle` has been incremented
2. `LoginScreen.tsx` has not been modified (requires explicit approval)
3. `index.html` has not been modified (requires explicit approval)
4. `npm run test:run` passes if `storage.ts` or any calculation logic was touched
5. No component reads `localStorage` directly — all reads/writes go through `storage.ts`
6. AI guardrail block in `claudeApi.ts` is intact if that file was touched
7. RLS policies have not been weakened if any Supabase schema was modified

---

## Key constraints summary

- Inline styles + `theme.ts` for all components — no CSS framework
- No global state manager — lift to App.tsx or pass callbacks as props
- Demo mode controlled by `gunvault_is_demo` flag
- Test Tools visible only to `james@lindcottarmory.com`
- AI scope restricted to lawful firearms topics — guardrails must not be removed
- `versionCode` increments monotonically — Play Store rejects duplicates or lower values
- `website/` is a separate project — not in scope, not in this repo

---

## Who to ask

**James** (owner): product decisions, credentials, keystore, Apple Dev account, `.env` values
