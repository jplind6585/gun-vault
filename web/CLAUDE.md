# Lindcott Armory — Developer Handoff

## ⚠️ Critical rules

- **Do NOT modify `index.html`'s static marketing HTML** (inside `<div id="root">`) without explicit approval from James. This is the marketing page visible to crawlers and unauthenticated visitors.
- **Do NOT change what unauthenticated users see** (i.e. `LoginScreen`, or anything rendered when `!user` in App.tsx) without explicit approval. This caused a major incident on 2026-04-14.
- **Do NOT deploy changes to Netlify** that affect the public-facing site without confirming with James first.
- If in doubt: stop and ask. Rolling back is painful.

---

## What this is
A personal firearms management app packaged as an Android app via Capacitor. Brand: **Lindcott Armory**, sub-brand of Lindcott Farms.

- **Live web app**: deployed on Netlify (auto-deploy from `main`) — moving to `app.lindcottarmory.com`
- **Marketing site**: separate static site in `../website/` → `lindcottarmory.com`
- **Android**: Play Store, package `com.lindcottarmory.app`
- **iOS**: not yet deployed (Apple Dev account exists, Fastlane TBD)

---

## Tech stack
| Layer | Tech |
|---|---|
| UI | React 19 + TypeScript + Vite |
| Styling | Inline styles — no CSS framework, no Tailwind |
| State | `useState` / `useEffect` — no Redux/Zustand |
| Persistence | `localStorage` (offline-first) + Supabase cloud sync |
| Auth | Supabase Auth (email/password) |
| Native | Capacitor (Android only currently) |
| AI | Claude API via Supabase Edge Function (`armory-assistant`) |
| Tests | Vitest + React Testing Library + jsdom |

---

## Repo structure

```
gun-app/
├── web/                      # This app (you are here)
├── website/                  # Static marketing site (lindcottarmory.com) — separate, no shared code
├── scripts/                  # One-off scripts (e.g. seed-cartridges.ts)
└── supabase/migrations/      # SQL migrations — run manually in Supabase SQL Editor
```

## App structure (`web/`)

```
web/
├── src/
│   ├── App.tsx               # Root — routing between views, global state
│   ├── types.ts              # All shared TypeScript interfaces (Gun, Session, AmmoLot…)
│   ├── storage.ts            # ALL localStorage read/write (single source of truth)
│   ├── theme.ts              # Color palette (dark theme), referenced everywhere
│   ├── main.tsx              # Vite entry point
│   │
│   ├── HomePage.tsx          # Dashboard — stats, top guns, armory alerts
│   ├── GunVault.tsx          # Gun list view
│   ├── GunDetail.tsx         # Single gun detail (tabs: info, sessions, optics, photos)
│   ├── AddGunForm.tsx        # Add/edit gun form
│   ├── Arsenal.tsx           # Ammo inventory — lots, totals, usage
│   ├── SessionLoggingModal.tsx  # Log a range session
│   ├── SessionLogView.tsx    # Full-page session logging (multi-gun, multi-distance)
│   ├── SessionRecaps.tsx     # Session history list
│   ├── ArmoryAssistant.tsx   # Claude AI chat assistant
│   ├── TargetAnalysis.tsx    # Shot group stats (MOA, CEP, ES, SD)
│   ├── CaliberDatabase.tsx   # In-app caliber reference browser
│   ├── FieldGuide.tsx        # In-app field guide (encyclopedia)
│   ├── MoreMenu.tsx          # More tab — grid of secondary tools
│   ├── FeedbackModal.tsx     # Support / feedback form (submits to Supabase feedback table)
│   ├── SettingsPanel.tsx     # Settings + Test Tools (dev-only, gated to james@lindcottarmory.com)
│   ├── AppHeader.tsx         # Shared top header with back nav
│   ├── MobileNav.tsx         # Bottom tab bar
│   ├── LegalDocs.tsx         # Terms + Privacy in-app viewer
│   ├── UpgradeModal.tsx      # Pro upgrade flow
│   │
│   ├── auth/                 # Auth components
│   │   ├── LoginScreen.tsx   # Shown to unauthenticated users — DO NOT CHANGE without approval
│   │   ├── AuthProvider.tsx
│   │   └── PasscodeGate.tsx
│   │
│   ├── lib/                  # Shared utilities
│   │   ├── supabase.ts       # Supabase client
│   │   ├── sync.ts           # Cloud sync logic
│   │   └── billing.ts        # Pro billing logic
│   │
│   ├── gunDatabase.ts        # Make/model autocomplete + spec lookup
│   ├── claudeApi.ts          # Claude API wrapper + system prompt
│   ├── seedData.ts           # Demo guns (shown on first launch)
│   ├── seedSessions.ts       # Demo sessions
│   ├── seedAmmo.ts           # Demo ammo lots
│   ├── seedCartridges.ts     # Cartridge reference data (also seeded to Supabase)
│   │
│   └── __tests__/            # Vitest test files
│
├── android/                  # Capacitor Android project
│   └── app/build.gradle      # versionCode lives here — bump before each Play Store release
├── public/                   # Static assets
├── index.html                # App shell — also contains static marketing HTML for crawlers
└── CLAUDE.md                 # This file
```

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
| `gunvault_settings` | `Settings` | User preferences (clean threshold, ammo low threshold…) |
| `gunvault_profile` | `ShooterProfile` | Shooter profile (level, goals, badge progress) |

**Important**: `storage.ts` is the only file that should read/write these keys. All other files import from `storage.ts`.

The `Gun` type's `roundCount` field is the all-time total rounds through that firearm. It's updated automatically when sessions are logged/deleted.

---

## Common patterns

### Navigation
`App.tsx` manages `currentView` state (a string union). Views are rendered with conditional JSX — no React Router. Navigation happens by calling `setCurrentView(...)` passed down as props.

### Refreshing after mutation
After adding/deleting a gun or session, sibling components need to re-read from localStorage. Pattern: pass a `refreshKey` number prop, increment it in the parent on mutation, and have the child `useEffect` depend on it.

```tsx
// Parent (App.tsx)
const [gunRefreshKey, setGunRefreshKey] = useState(0);
// after mutation:
setGunRefreshKey(k => k + 1);

// Child (GunVault.tsx)
useEffect(() => {
  setGuns(getAllGuns());
}, [refreshKey]);
```

### Undo
`useUndo` hook in `useUndo.ts` manages a 5-second undo window. The `UndoToast` component renders above the bottom nav. After undo is committed (or 5s passes), the mutation is finalized.

### Safe area insets (mobile notch/home bar)
Use `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` in CSS. The bottom nav uses `env(safe-area-inset-bottom)` for its padding.

---

## Running locally

```bash
cd web
npm install
npm run dev        # starts Vite dev server on localhost:5173
```

### Tests
```bash
npm run test:run   # run all tests once
npm run test       # watch mode
```

Test files live in `src/__tests__/`. Current coverage:
- `storage.test.ts` — Gun/Session/Ammo CRUD
- `calculations.test.ts` — Ballistic math (MOA, CEP, ES, SD)
- `homeStats.test.ts` — Dashboard calculations (top3, ammo totals, period stats)
- `AddGunForm.test.tsx` — Form validation and submit behavior

### Android build
```bash
npm run build
npx cap sync android
# Then open android/ in Android Studio to build APK/AAB
```

Bump `versionCode` in `android/app/build.gradle` before every Play Store upload. **Current: 17**

---

## Supabase

Project is connected to Supabase (URL and anon key in `.env`). Used for:
- **Auth**: `supabase.auth.signInWithPassword()` etc.
- **Cloud sync**: guns/sessions/ammo mirrored to Supabase tables (sync runs in background)
- **Edge Functions**: `armory-assistant` — proxies Claude API calls so the API key stays server-side
- **Feedback/Support**: `feedback` table stores in-app support form submissions
- **Reference data**: `cartridges` table — public read via anon key, shared with marketing site

`.env` is gitignored. Ask James for the values.

---

## Deployment

### Web (Netlify)
Push to `main` → Netlify auto-deploys the app. Target domain: `app.lindcottarmory.com` (DNS CNAME pending).

### Android (Play Store)
Fastlane is set up in `android/fastlane/`. Signing config in `android/keystore.properties` (gitignored). Ask James for the keystore file and properties.

Manual deploy steps:
1. `npm run build && npx cap sync android`
2. Bump `versionCode` in `android/app/build.gradle`
3. Build AAB in Android Studio → upload to Play Console

---

## Key constraints / gotchas

- **No CSS framework** — all styling is inline React styles referencing `theme.ts`
- **No global state manager** — lift state to App.tsx or pass callbacks as props
- **Demo mode**: if `gunvault_is_demo` is set, the app shows seed data. Clearing this key exits demo mode
- **Dev-only Test Tools**: Settings panel has a "Test Tools" section visible only to `james@lindcottarmory.com` — buttons to wipe localStorage data
- **AI scope**: The Armory Assistant system prompt restricts responses to vault data + firearms topics. Don't remove those guardrails
- **versionCode must increase monotonically** — Play Store rejects any build with a versionCode ≤ the last uploaded one. Current: 16
- **`website/` is completely separate** — no shared code, assets, or build process with `web/`. Only shared layer is Supabase tables.

---

## Who to ask

- **James** (owner): product decisions, credentials, keystore, Apple Dev account
