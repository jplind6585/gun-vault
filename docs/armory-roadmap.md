# Lindcott Armory — Feature Roadmap

**App:** Lindcott Armory (PWA — React 19 + TypeScript + Vite)
**Status:** Active development
**Roadmap created:** April 2026

---

## In Progress / Recently Shipped

- [x] Vault — gun inventory with SVG silhouettes
- [x] Ammo tracker (lots, grain, velocity)
- [x] Session log + analytics tab
- [x] Ballistics calculator
- [x] Caliber database (198 cartridges, fully validated with primerType, rimType, twistRate, caseCapacity)
- [x] Field Guide — Cartridges, Platforms, Ballistics, Glossary, Optics sections
- [x] Optics tracker (mounts, zeros, swap history, torque confirmation)
- [x] Gear Locker
- [x] Wishlist
- [x] Training Log (drill tracker)
- [x] Reloading Bench
- [x] Backup & Restore (full JSON vault export/import)
- [x] Insurance export (CSV)
- [x] Smart Search
- [x] AI: Session narrative generation
- [x] AI: Target photo analysis (group size, accuracy, pattern, drills)
- [x] AI: Ammo box scanning (OCR label extraction)
- [x] AI: Target coach chat (interactive shot group coaching)
- [x] AI: Maintenance alerts (rule-based round-count thresholds)
- [x] AI: Ammo performance correlation (rule-based issue rate tracking)
- [x] AI: Armory Assistant — conversational AI with full vault context + guardrails
- [x] Field Guide website: Cartridge Library, History of Firearms, Military Firearms Timeline, Stolen/Lost/Destroyed incident response guide

---

## Field Guide — Deferred Sections

These sections exist in code but are hidden from the Field Guide home until built out properly.

### Ballistics Overview *(re-enable when ready)*
- Currently hidden from Field Guide nav (April 2026 UX cleanup)
- Content exists in FieldGuide.tsx — just guarded with `{false &&` block
- To re-enable: remove the false guard in FieldGuide.tsx
- *Status: Hidden — flesh out content before re-exposing*

### Optics Overview *(re-enable when ready)*
- Currently hidden from Field Guide nav (April 2026 UX cleanup)
- Same pattern as Ballistics — content exists, guarded with `{false &&`
- *Status: Hidden — flesh out content before re-exposing*

### Maintenance
- Cleaning guides by action type (AR-15, bolt rifle, semi-auto pistol, revolver, shotgun)
- Lubrication maps (where to oil, where not to)
- Round-count maintenance schedules (recoil spring, gas rings, barrel service)
- Field strip guides with step-by-step text
- Common tools and what they do
- Corrosion prevention and storage tips
- *Status: Hidden — build after Marksmanship and Competition*

### Competition
- Formats: USPSA, IDPA, IPSC, 3-Gun, PRS, Benchrest, F-Class, Bullseye
- Stage briefing concepts (make ready, shooter ready, standby, start signal)
- Scoring systems (points down, time-plus, raw time)
- Equipment division overviews (Production, Carry Optics, Limited, Open, PCC)
- Major vs. Minor scoring (power factor)
- Historical competition context
- *Status: Hidden — build as its own deep module when prioritized*

### Marksmanship
- FM 3-22.9 / TC 3-22.9 doctrine adapted for civilian shooters
- Fundamentals: stance, grip, sight alignment, sight picture, trigger control, breathing, follow-through
- Positions: prone, sitting, kneeling, standing, supported
- Natural point of aim
- Reading conditions (mirage, wind flags, vegetation movement)
- Calling shots
- Cold bore vs. fouled bore performance
- Mental discipline and performance under pressure
- *Status: Hidden — build as its own deep module when prioritized*

---

## AI — Roadmap Items

These build on the existing Claude integration (Supabase Edge Function, per-user monthly token budget, usage logging).

### Streaming responses
- Replace single-response model with SSE streaming for the Armory Assistant
- Dramatically improves perceived response time for longer answers
- Requires edge function update to stream chunks + client-side reader
- *Status: Deferred — v1 non-streaming is acceptable; prioritize after onboarding*

### Proactive AI insights (Home screen)
- On app open, generate 1–2 personalized insight cards based on vault state
- Examples: "Your Glock 19 is 180 rounds from its cleaning threshold", "You haven't shot the .308 in 47 days", "Your 9mm stock is getting low — 3 sessions worth left"
- Rule-based triggers with optional AI narrative layer
- *Status: Deferred — build after onboarding*

### Session trend analysis
- AI reads last N sessions for a specific gun and surfaces patterns
- "Your groups with the Remington 700 have tightened 22% over the last 8 sessions"
- Triggered from Session Recaps or Gun Detail
- *Status: Deferred*

### AI load development advisor (Reloading Bench)
- Within a reloading recipe, ask AI questions about the load
- Context: bullet, powder, primer, OAL, case, expected pressure/velocity
- AI can suggest starting loads, flag potential pressure signs, explain trade-offs
- Hard guardrail: AI recommends consulting published load data, never substitutes for it
- *Status: Deferred — build after Reloading Bench is fully featured*

### AI field guide Q&A
- Natural language search within the Field Guide
- "Which 6.5mm cartridges work in a short action?" → AI answers from cartridge database
- *Status: Deferred — build after Field Guide content is complete*

### AI gun advisor / purchase helper
- User describes what they're looking for; AI recommends from common platforms
- Cross-references vault to avoid duplicates in same caliber/role
- *Status: Deferred — community / monetization tier feature*

---

## App Modules — Deferred

### NFA / Suppressor Tracking
- Log NFA items (suppressors, SBRs, SBSs, AOWs, machine guns) as a distinct gun type
- Fields: Form 1 vs. Form 4, approval date, tax stamp image, trust vs. individual, expiry tracking
- Suppressor host assignment (which guns it mounts on)
- Legal notes per state (some states require additional registration)
- *Why deferred: NFA tracking is a compliance-sensitive feature that needs careful legal review before shipping. Fields currently exist in the Gun type but are hidden from the Add Gun form as of April 2026.*
- *Status: Fields preserved in types.ts and AddGunForm.tsx (commented out). Re-enable + build UI when ready.*

### Range & Location Management
- Dedicated range/location database (user-built, not sourced)
- Log all gun ranges, clubs, public and private land
- Fields per location: name, address, type (indoor/outdoor), specialties (1000yd+, trap/skeet, USPSA bays, etc.), membership required, hours, notes
- Smart auto-complete: when logging a session, match typed location to saved ranges
- Discover view: find ranges near you (GPS, filtered by specialty)
- *Why deferred: Requires either a user-contributed database or integration with a range-finder API. Large scope — own product area.*
- *Status: Session log currently stores free-text location strings. Those strings feed the fuzzy-search autocomplete. Range records can be built on top of that foundation.*

### Analytics Deep Dive
- Currently analytics (SessionRecaps) shows basic breakdowns: rounds by gun, top locations, issues, indoor/outdoor split
- Long-term: much richer analytics layer
  - Accuracy trend over time per gun (link to Target Analysis records)
  - Cost per round / cost per session over time
  - Caliber usage breakdown (rounds fired, cost, session count)
  - Session cadence: gap between sessions, sessions per month trend
  - Performance vs. conditions (wind, temp, indoor/outdoor correlation)
  - Ammo performance: group size by lot (link Target Analysis → ammo lot)
  - Heatmap: time-of-day / day-of-week patterns
- *Status: Deferred. Session and target analysis data is being collected correctly — analytics layer can be built on top at any time.*

### AI Gun Value Estimation
- On gun detail, "AI Estimate" button next to the FMV field
- AI looks at make, model, caliber, condition, accessories, and current market context to suggest a fair market value
- User can accept the AI suggestion or type their own override
- Requires routing through the Supabase Edge Function (uses James's API key, not user's)
- *Status: Deferred until AI Pro gating system is built (see AI Monetization below)*

### Monetization / Pro Tier
- Free tier: small monthly AI budget (~$0.50/month worth of Claude tokens — roughly 50–100 short calls)
- Pro tier: higher or unlimited AI access, TBD pricing
- AI usage tracked in Supabase `ai_usage` table (user_id, month, tokens_used, calls_used)
- When free budget exhausted: graceful modal — "You've used your free AI for this month. Upgrade to Pro."
- Pro flag: boolean on user Supabase record, manually flipped until Stripe/RevenueCat is integrated
- All AI features use the same system: target analysis, ammo scan, session narrative, gun value, assistant, field guide Q&A — same gate, same budget
- Payment infrastructure (Stripe, RevenueCat, or similar) TBD
- *Status: Deferred — no payment system set up yet. Build usage tracking first, then payment integration, then enforce the gate.*

### Gunsmithing / Work Orders
- Log gunsmithing work done (in-house or sent out)
- Work order tracking: date sent, gunsmith, work description, cost, return date
- Attach to specific guns in the vault
- Notes on modifications (trigger jobs, barrel work, refinishing)
- *Status: Deferred — show in More menu as "Coming Soon" for now*

### Find Events
- Range locator (user-submitted or sourced from public API)
- Match calendar integration
- Club directory
- *Status: Deferred — requires backend/API work; PWA-only approach may be limited*

---

## Onboarding & Pre-launch (hold until core features complete)

- Sign-in / account creation
- Tutorial / walkthrough for first-time users
- Achievement badges
- Data reset from within the app (Settings → Danger Zone)
- *Note: Deferred to avoid complicating app store submission process*

---

## Website — UI / Polish Backlog

- **Font system revisit** — current site uses Inter + Space Mono. Design feedback recommends Bebas Neue (condensed all-caps display) + IBM Plex Mono. Deferred — revisit with design friend when graphics arrive. Will change the visual personality significantly; do a side-by-side before committing.
- Landing page feedback applied (April 2026): hierarchy, spacing, section dividers, copy rewrites, field guide tile alignment

---

## UI / Polish Backlog

- More navigation icon: replace grid with something more intentional
- Vault list: sort & filter (by type, caliber, status, last session)
- Session log: ammo lot linkage (connect session to specific lot)
- Gun Detail: maintenance log tab (track cleans, inspections)
- Target Analysis: session attachment (link a target photo to a specific session)
- Dark/light theme toggle
- Haptic feedback on key actions (mobile)
- Target Analysis: draggable overlay stats panel (user can reposition the stats box over the target image)
- Feedback modal: currently opens mail client (mailto: to support@lindcottarmory.com) — works on mobile but unreliable on desktop where no mail client is configured. Long-term: replace with in-app form that posts to Supabase feedback table

---

## Technical Debt

- `enrichGunWithMarketValue` fully removed from getAllGuns (done April 2026)
- CSVImportModal dual-import warning (static + dynamic) — low priority
- Consider SQLite (WASM) if data gets large enough to stress localStorage
- Service worker cache strategy (currently default Vite PWA plugin behavior)

### Cartridge / Field Guide Data Migration to Supabase
- **Problem:** App reads cartridge data from localStorage (seeded from `seedCartridges.ts`). Marketing website reads from a static snapshot (`data/calibers-data.js`). No live sync — updating `seedCartridges.ts` requires a manual re-extraction script + redeploy of the website, and a version bump to trigger re-seed for existing app users.
- **Solution:** Move cartridge content (and eventually GUN_HISTORY + SERVICE_WEAPONS) into Supabase tables. Both app and website query Supabase directly. One edit updates everywhere.
- **Schema needed:**
  - `cartridges` table — mirrors current seedCartridges fields (name, type, year, ballistics, military adoption, etc.) ✅ exists + populated (198 rows)
  - `gun_history` table — mirrors PLATFORMS fields (name, origin, year, era, category, tagline, body)
  - `service_weapons` table — mirrors SERVICE_WEAPONS fields (name, countries, role, yearStart, yearEnd, caliber, story)
  - `user_cartridge_prefs` already exists for per-user ownership flags ✅
- **App side:** Replace `getAllCartridges()` localStorage reads with Supabase queries; cache locally for offline ✅ DONE (April 2026) — `fetchCartridgesFromSupabase()` in `sync.ts`, `refreshCartridgesFromSupabase()` called on every launch via `ensureInitialized()`. Edit the Supabase `cartridges` table → updates flow to all users on next launch, no redeploy needed.
- **Website side:** Fetch from Supabase REST API at build time (SSG) or at runtime (dynamic); remove static data JS files
- *Status: App side complete. Website side + GUN_HISTORY/SERVICE_WEAPONS still deferred.*

### Post-Launch Artifact Cleanup
*Do this only after the app has been live with real users for a while — the seed files are still the offline fallback and removing them too early risks breaking first-launch for users with no network.*
- **`web/src/seedCartridges.ts`** — 1,600-line local seed file. Now only used as an offline fallback on first launch if Supabase is unreachable. Once the app has real users and we're confident Supabase uptime is solid, this can be removed and the `initializeSeedData()` function in `storage.ts` updated to skip the cartridge seeding step entirely. The `refreshCartridgesFromSupabase()` call that runs on every launch will handle it.
- **`50-new-cartridges.ts`** (project root, not in `web/src/`) — scratch file used to draft additions to `seedCartridges.ts`. Not imported anywhere, never bundled. Safe to delete at any time.
- **`web/src/seedCartridges.ts.backup`** — stale backup of the seed file. Delete once we're off the seed file entirely.
- **`web/src/marketValues.ts`** — check if still used after `enrichGunWithMarketValue` was removed from `getAllGuns()`.
- General: run a dead-export pass with `ts-prune` or similar to find any other unused exports/files that accumulated during development.

---

*Last updated: April 2026 — added NFA/Suppressor, Range Management, Analytics Deep Dive, AI Gun Value, Monetization/Pro Tier, Field Guide Ballistics/Optics re-enable notes, draggable overlay, feedback backend*
