# Lindcott Armory — V1 Launch Plan
*Last updated: April 2026*

---

## Overview

Lindcott Armory is a privacy-first firearm management app targeting responsible gun owners who want a clean, intelligent way to track their collection, ammo, and optics. V1 ships to iOS App Store and Google Play as a native-wrapped PWA (via Capacitor), with a freemium monetization model.

**Target launch window:** Q3 2026
**Beta testing start:** Q2 2026

---

## Part 1 — What's Built (Current State)

The following is complete and working:

- **Gun Vault** — full CRUD, filters, sort, type chips, photo placeholder
- **Arsenal** — ammo tracking, low-stock alerts, shopping list modal
- **Optics List** — add/edit optics with known-model spec prefill and retailer autocomplete
- **Field Guide** — historical timeline with gun type filter, 40+ platform entries
- **Home Page** — smart alerts (ammo low, maintenance due, range neglect)
- **More Menu** — grid of upcoming tools (marked coming soon)
- **Auth** — Supabase sign-in/sign-up
- **Sync** — localStorage-first, Supabase background sync
- **PWA** — service worker, offline-capable for core features

---

## Part 2 — Must-Complete Before Submission

These are hard blockers. The app cannot be submitted to either store without them.

### 2A. Legal & Compliance

| Item | Why Required | Notes |
|------|-------------|-------|
| Terms of Service | App Store requirement | Must include: lawful use only, no liability for legal proceedings involving stored data, account termination rights |
| Privacy Policy | App Store + GDPR/CCPA | Must disclose: what data is stored, where (Supabase/cloud), how serial numbers are handled, right to deletion |
| Delete Account flow | Apple hard requirement since 2022 | Must permanently delete all user data from Supabase, not just deactivate |
| Support URL + contact email | App Store listing requirement | Can be a simple page or dedicated email |
| Age rating | Both stores require self-rating | Declare 17+ on both platforms |

**Serial number data is sensitive.** Before launch, confirm Supabase Row Level Security (RLS) policies are airtight — each user can only read/write their own rows. A breach of a gun inventory database is a serious legal and PR event.

**Talk to a lawyer** before publishing the ToS. The liability exposure on a firearms data app is real.

### 2B. AI Guardrails

Your Claude integration (via Supabase Edge Function) needs a system prompt that explicitly refuses:
- Questions about illegal weapon modifications (bump stocks, auto conversions, SBR without NFA, etc.)
- Requests for information that varies by jurisdiction in ways that could get users in legal trouble
- Anything involving circumventing background checks or legal transfer processes

**Suggested system prompt addition:**
```
You are a firearms management assistant for lawful gun owners. You help with
maintenance, storage, historical information, and collection management. You
must refuse any requests related to illegal modifications, circumventing legal
safeguards, or any activity that would violate federal, state, or local law.
When in doubt, recommend the user consult a licensed gunsmith or attorney.
```

Also add rate limiting: 25 AI queries/day for Pro+AI users, 0 for free users. Enforce at the Edge Function level.

### 2C. Account Management

Build a Settings / Account screen with:
- Change email
- Change password
- **Delete Account** (required) — soft confirmation → hard confirm → wipe all Supabase rows → sign out
- Sign out
- App version number (reviewers look for this)

### 2D. Onboarding Flow

First-time users need guidance or the app feels empty and confusing. Recommended flow:

1. **Welcome screen** — Lindcott Armory logo, 2-line value prop, "Get Started" CTA
2. **Sign up / Sign in** (existing auth, just polish the UI)
3. **Permission asks** — notifications (explain why: maintenance alerts, ammo reminders)
4. **Empty vault state** — not a blank screen. Show a ghost gun card with "Add your first firearm" CTA and a short line about what the vault tracks
5. **First gun walkthrough** — optional tooltip overlay on the add-gun form (can skip)
6. **Done** — land on Home Page with one contextual tip card that dismisses

The onboarding does not need to be elaborate. The empty state alone removes most confusion.

---

## Part 3 — Strong Recommendations for V1

These aren't blockers but will significantly affect review scores and retention.

### 3A. Remove / Restructure More Menu

Seven grayed-out "Coming soon" tiles look like abandonware. Replace with:
- Show only **Field Guide** as the one live tool in the grid
- Add a single card below: *"More tools in development — Ballistics, Reloading, Training, and more. Follow updates."* with a link to a mailing list or your site
- Remove: Ballistics, Training, Reloading, Gear Locker, Wishlist, Gunsmithing, Find Events from the UI entirely

### 3B. Fix the Cleaning Log Gap

You show a cleaning-due alert when round count exceeds threshold, but there's no way to log a cleaning. Users will tap the alert and have nowhere to go. Add a simple "Log Cleaning" button on the gun detail page that records the current round count as `lastCleanedRoundCount` and dismisses the alert.

### 3C. Global Search

With a vault of 20+ guns, users need a way to find a specific firearm without scrolling. A single search bar at the top of the Gun Vault that filters by make, model, or caliber is enough for v1.

### 3D. Optics → Gun Link (Verify)

Confirm that optics can be associated with a specific gun and that the gun detail page shows which optic is mounted. If this is one-directional only (optics list without gun association), this is a notable gap.

### 3E. Real Icons + App Icon

- **App icon:** needs to be provided at 1024×1024px (Apple) and 512×512px (Google). Must not contain realistic firearm imagery per Apple guidelines — consider a stylized vault door, a scope reticle, or an abstract mark.
- **Nav icons, card icons:** SVG is fine for in-app use; the current monochrome style is clean and consistent — keep it.
- **Field Guide photos:** Historical images need to be public domain or licensed. Good sources: Wikimedia Commons, Library of Congress (photos.loc.gov), U.S. National Archives. Do not pull from Google Images.

### 3F. Crash Reporting

Add Sentry (free tier) before beta. You will not know about crashes otherwise.

```bash
npm install @sentry/react
```

Initialize in `main.tsx` before the React render. One hour of setup, invaluable during beta.

---

## Part 4 — App Store Compliance (Firearms-Specific)

### What's Allowed

Both Apple and Google allow lawful firearm management apps. Key framing:
- Lead with "legal firearm management," "responsible ownership," "secure record keeping"
- Highlight the privacy/offline angle — gun owners are privacy-conscious and this is a genuine differentiator
- Do not use "weapon" in keywords; use "firearm," "gun safe," "gun vault," "collection tracker"

### What Could Get You Rejected

| Risk | Mitigation |
|------|-----------|
| AI answers illegal modification questions | System prompt guardrails (see 2B) |
| App appears to facilitate illegal sales | No buy/sell/trade features in v1 |
| Serial number lookup against stolen databases | Don't build this; it creates legal exposure |
| No delete account option | Build it (see 2C) |
| Misleading screenshots | Show real UI, don't stage fake data |

### Apple-Specific Notes

Apple has historically been inconsistent with firearms apps. To reduce rejection risk:
- Submit with a detailed reviewer note explaining the app is for lawful inventory management
- Provide a demo account with pre-loaded data so reviewers can evaluate without signing up
- If rejected, the appeal process works — document your case clearly

### Google-Specific Notes

Google is more permissive but can pull apps post-launch. Same principles apply. TWA (Trusted Web Activity) is an alternative path to Google Play without Capacitor if you want to ship Android first.

---

## Part 5 — Technical: Packaging as a Native App

### Recommended Path: Capacitor

Capacitor wraps your existing Vite/React build in a native iOS and Android shell. You keep your codebase; Capacitor adds native APIs where needed.

**Setup sequence:**

```bash
# 1. Install Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android

# 2. Initialize (run from /web)
npx cap init "Lindcott Armory" "com.lindcottfarms.armory"

# 3. Add platforms
npx cap add ios
npx cap add android

# 4. Build and sync
npm run build
npx cap sync

# 5. Open in native IDE
npx cap open ios      # Opens Xcode
npx cap open android  # Opens Android Studio
```

**capacitor.config.ts** (key settings):
```ts
const config: CapacitorConfig = {
  appId: 'com.lindcottfarms.armory',
  appName: 'Lindcott Armory',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};
```

### Native Plugins Needed

| Feature | Plugin | Priority |
|---------|--------|----------|
| Push notifications | `@capacitor/push-notifications` + Firebase | High — your alert system needs this |
| Camera (gun photos) | `@capacitor/camera` | Medium |
| Biometric auth | `@capacitor/biometrics` | Medium — gun owners will want this |
| Haptics | `@capacitor/haptics` | Low — nice polish |
| Status bar styling | `@capacitor/status-bar` | High — UI polish |

### Accounts & Costs

| Item | Cost | Notes |
|------|------|-------|
| Apple Developer Program | $99/year | Required for TestFlight + App Store |
| Google Play Developer | $25 one-time | Required for Play Store |
| Xcode | Free | Mac required |
| Android Studio | Free | Mac or PC |

---

## Part 6 — Monetization

### Tier Structure

| Tier | Monthly | Annual | What's Included |
|------|---------|--------|----------------|
| **Free** | $0 | $0 | Up to 10 guns, manual tracking, local storage only, no AI |
| **Vault Pro** | $2.99 | $24.99 | Unlimited guns, cloud sync, photos, full history, range log |
| **Vault Pro + AI** | $4.99 | $39.99 | Everything in Pro + AI assistant, AI maintenance insights |

### Early Adopter Offer

**Lifetime Vault Pro: $49.99** — available to first 500 users only.

This covers your infrastructure costs for years, creates strong word of mouth, and rewards the people who take a chance on v1. Promote it heavily at launch and pull it cleanly at 500.

### Cost Model

Estimate at scale (1,000 active Pro+AI users):
- Claude API (Sonnet): ~$0.05–0.15/user/month at 25 queries/day average
- Supabase: ~$25/month for thousands of users
- Infrastructure: ~$50/month total with Netlify Pro
- Apple/Google cut: 30% of subscription revenue (15% after year 1 via Apple Small Business Program)

At $4.99/month with 30% cut, you net ~$3.49/user/month. Infrastructure costs are covered at ~20 paying Pro+AI users.

### Implementation Notes

- Use **RevenueCat** to manage subscriptions across iOS and Android. It handles Apple/Google billing, webhook sync, and gives you a single source of truth for entitlements. Free up to $2,500 MRR.
- Gate features at the app level by checking RevenueCat entitlements on app open and syncing to your Supabase user record
- AI rate limiting: enforce in your Edge Function by checking queries-today against a `ai_usage` table, not just on the client
- Do not use a credit/coin system — it creates anxiety and friction

### What to Gate

```
Free:        10 gun limit, no cloud sync, no AI, no photos
Pro:         Unlimited guns, sync, photos, range history, cleaning log
Pro + AI:    Everything + AI assistant tab, AI-generated maintenance schedules
```

---

## Part 7 — Beta Testing

**Run beta for 4–6 weeks before public submission.**

### iOS Beta (TestFlight)
1. Build archive in Xcode → upload to App Store Connect
2. Invite testers via email through TestFlight (no App Store review required for internal testing)
3. External beta (up to 10,000 users) requires a brief TestFlight review (~1-2 days)

### Android Beta (Google Play)
1. Upload APK/AAB to Google Play Console → Internal Testing track
2. Share link with testers directly
3. Promote to Closed Testing or Open Testing when ready

### Who to Recruit as Beta Testers
- Gun club members
- Hunting forums / Reddit (r/guns, r/firearms, r/EDC)
- Local FFL dealers who might recommend the app
- Friends/family with collections of any size

### What to Test Specifically
- Onboarding: can a new user add their first gun without confusion?
- AI: does it refuse illegal modification questions appropriately?
- Sync: does data survive app reinstall?
- Offline: does the core vault work without signal?
- Delete account: does it actually wipe everything?

---

## Part 8 — Launch Sequence

```
Week 1-2:   ToS, Privacy Policy, Delete Account, AI guardrails
Week 3-4:   Onboarding flow, cleaning log, empty states
Week 5-6:   Capacitor setup, push notifications, RevenueCat integration
Week 7:     App icons, screenshots, store listings drafted
Week 8-9:   Internal beta — team + close contacts
Week 10-12: External beta — TestFlight + Play Internal Testing
Week 13:    Submit to App Store + Google Play
Week 14-16: Review period (Apple: 1-7 days; Google: 3-7 days)
```

### App Store Listing Copy (Draft)

**Title:** Lindcott Armory — Gun Vault

**Subtitle:** Firearm collection manager

**Description:**
> Lindcott Armory is a private, secure firearm management app built for responsible gun owners. Track your collection, ammo inventory, optics, and maintenance — all stored on your device first, with optional encrypted cloud sync.
>
> Your data stays yours. No selling, no ads, no nonsense.
>
> **Features:**
> — Gun Vault: full collection with filters, photos, and history
> — Arsenal: ammo tracking with low-stock alerts
> — Optics Locker: track scopes, red dots, and accessories
> — Maintenance alerts: cleaning reminders based on rounds fired
> — Field Guide: historical timeline of firearms development
> — AI Assistant (Pro): ask questions about maintenance, specs, and history
>
> Built for collectors, hunters, competitors, and everyday carriers who take their gear seriously.

**Keywords:** gun vault, firearm tracker, gun safe, ammo tracker, gun collection, firearm inventory, gun log, shooting log

---

## Part 9 — What's Been Deferred (Post-V1)

Track these in `armory-roadmap.md`. Do not build for v1.

- Ballistics calculator
- Reloading data tracker
- Training / drill log
- Competition score tracking
- Gunsmithing service log
- Find Events / range locator
- Gear Locker (non-firearm equipment)
- Wishlist
- Social / sharing features
- Import from competing apps (v1.1 — high value)
- Family vault / shared access

---

## Part 10 — Open Questions to Resolve

1. **Business entity** — is Lindcott Armory shipping under Lindcott Farms LLC or a separate entity? The app store developer account needs to match your legal entity.
2. **Support infrastructure** — do you want a dedicated support email, a help site, or a simple in-app FAQ for v1?
3. **Pricing finalization** — are the proposed tiers ($2.99/$4.99) right, or do you want to adjust before building RevenueCat?
4. **Push notification content** — what do you want the actual notification copy to say for each alert type (ammo low, cleaning due, range neglect)?
5. **Field Guide photos** — do you want to source public domain historical photos, commission illustrations, or leave it text/SVG for v1?

---

*Plan prepared April 2026. Update as decisions are made.*
