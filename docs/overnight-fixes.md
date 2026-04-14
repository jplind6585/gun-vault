# Overnight UX Fixes — Lindcott Armory
Started: 2026-04-02 night

Each fix: single most impactful remaining issue, tackled in order.
No pushes made — review in the morning and push what you want.

---

## Fix #20 — GunVault: `typeAccent` color map → theme tokens
**File:** `web/src/GunVault.tsx`
**Problem:** `typeAccent` (the color dot used on every gun card to indicate firearm type) used 5 hardcoded hex values: `#ffd43b`, `#74c0fc`, `#51cf66`, `#a0a0b0`, `#ff6b6b`. These are exact copies of the theme token values — but since they're hardcoded strings, they don't update when the outdoor theme is applied. Every gun card shows the wrong color in outdoor mode.
**Fix:** Replaced all 5 with their corresponding token: `theme.accent`, `theme.blue`, `theme.green`, `theme.textSecondary`, `theme.red`. The object is initialized at module scope so values are snapshotted at load — same behavior, but now theme-correct.

---

## Fix #19 — SettingsPanel: `#ff6b6b` → `theme.red`
**File:** `web/src/SettingsPanel.tsx`
**Problem:** Four instances of hardcoded `#ff6b6b` — backup restore error text, DELETE ALL DATA button text color, delete confirmation header, and delete confirm button background. In outdoor mode, `theme.red` is `#c0392b` (darker, higher contrast on light background). Hardcoded `#ff6b6b` is washed out on the outdoor theme's light surface.
**Fix:** All four occurrences replaced with `theme.red`. The rgba() border values (`rgba(255,107,107,0.3)`) are left as-is since they already encode opacity correctly.

---

## Fix #18 — SessionRecaps: 🎯 empty state + 🗑 delete icon → text/SVG
**File:** `web/src/SessionRecaps.tsx`
**Problem 1:** Empty state (no sessions logged yet) showed a `🎯` emoji at 36px — inconsistent with every other screen's empty state which uses SVG or text. **Problem 2:** Swipe-to-delete background showed `🗑` emoji on solid red — the delete action is critical enough to have clear text labeling, and emoji is inconsistent.
**Fix:** Empty state: replaced 🎯 with an inline SVG crosshair (3 concentric circles + 4 tick marks, 36px, matches the app's SVG icon language). Delete background: replaced 🗑 with "DELETE" in 11px bold monospace — clearer label, no emoji dependency.

---

## Fix #17 — SessionRecaps: Replace all hardcoded hex colors with theme tokens
**File:** `web/src/SessionRecaps.tsx`
**Problem:** 7 hardcoded hex values scattered through the file — `#ff6b6b`, `#e03131`, `#ff9999`, `#51cf66`, `#ff922b` — used for purpose colors, gap stat, maintenance alerts, delete background, issue indicators, and chart bars. These bypass the theme system and break the outdoor theme.
**Fix:** Mapped all to theme tokens: `#ff6b6b`/`#e03131`/`#ff9999` → `theme.red`; `#51cf66` → `theme.green`; `#ff922b` → `theme.orange`. Also converted maintenance alert prefix from ⚠ emoji to "MAINT" label, and equipment warning prefix from ⚠ to "WARN" — consistent with the PREFIX: body pattern.

---

## Fix #16 — Wishlist: Gap Analysis banner solid blue → left-border card
**File:** `web/src/Wishlist.tsx`
**Problem:** Gap Analysis notification banner used `backgroundColor: theme.blue` (solid, full-opacity blue fill) with hardcoded `color: '#fff'` text and `📊` emoji header — the third instance of the solid-color-with-white-text banner pattern that was fixed in ReloadingBench and GearLocker earlier tonight.
**Fix:** Converted to left-border alert card: `rgba(116,192,252,0.08)` tinted background, `3px solid theme.blue` left border, "GAP ANALYSIS" prefix label in `theme.blue`, body text in `theme.textSecondary`. VIEW ANALYSIS button changed from white-fill to transparent with blue border. No emoji.

---

## Fix #15 — Wishlist: Stats grid 4-col → 2×2
**File:** `web/src/Wishlist.tsx`
**Problem:** Stats overview used `isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)'` — but inside a 480px-max app there is no "desktop" state. The 4-col layout would produce ~110px-wide stat cards if ever triggered, and maintaining the isMobile conditional adds dead code.
**Fix:** Removed isMobile import dependency from stats grid. Unified to `repeat(2, 1fr)` at all sizes. All 4 stats (ITEMS, TOTAL COST, SAVED, HIGH PRIORITY) always visible in a clean 2×2 grid with 24px number font.

---

## Fix #14 — SessionLoggingModal: Bottom-sheet layout, sticky header, scroll
**File:** `web/src/SessionLoggingModal.tsx`
**Problem:** Modal was centered on screen with `padding: '24px'` outer + `padding: '32px'` inner — effectively 56px of horizontal padding on each side on mobile, leaving only ~278px for content. No `overflowY: 'auto'` so content could be cut off on short screens. `<h2>` at 20px font.
**Fix:** Converted to bottom-sheet pattern (slides up from bottom like SettingsPanel). Sticky header with title + close button. Content area is scrollable. Rounded top corners only. Matches the SettingsPanel interaction model users already know.

---

## Fix #13 — GearLocker: Stats grid + maintenance alert banner
**File:** `web/src/GearLocker.tsx`
**Problem 1:** Stats grid hid 2 of 4 stats on mobile (`!isMobile` guard). All 4 stats are relevant on mobile. **Problem 2:** Maintenance alert used solid orange background with white text and ⚠️ emoji — same problem as ReloadingBench safety warning.
**Fix:** Stats grid unified to 2×2 (all 4 always visible). Maintenance alert redesigned: orange-tinted left-border card with "MAINT" prefix label — matches the app's alert pattern.

---

## Fix #12 — Standardize screen headers: TrainingLog, GearLocker, Wishlist
**Files:** `web/src/TrainingLog.tsx`, `web/src/GearLocker.tsx`, `web/src/Wishlist.tsx`
**Problem:** These three screens used `<h1>` at 20-24px font for their main headings — inconsistent with the app's pattern (all other screens use small 13px monospace headers). The large `<h1>` consumed vertical space and felt out of place.
**Fix:** Replaced all three with the standard 13px fontWeight 700 div + 10px muted subtitle, matching the pattern now used in BallisticCalculator and ReloadingBench.

---

## Fix #11 — ReloadingBench: Fix header + safety warning styling
**File:** `web/src/ReloadingBench.tsx`
**Problem 1:** Header used `<h1>` at 20-24px, consuming vertical space on a dense data screen. **Problem 2:** Safety warning used solid `theme.red` background with white text and `⚠️` emoji — solid red banners feel alarmist/cheap; emoji is inconsistent.
**Fix:** Header simplified to match other screens (13px monospace, no `<h1>`). Safety warning redesigned: subtle red-tinted background, left-border accent, red "SAFETY" label prefix — same pattern as the FieldGuide use case cards. No emoji.

---

## Fix #10 — Arsenal: Category filter chips too small (8px font)
**File:** `web/src/Arsenal.tsx`
**Problem:** Category filter chips (All / Match / Practice / Self Defense / Hunting) used `fontSize: '8px'`, `padding: '4px 8px'`, `borderRadius: '3px'` — below WCAG minimums and visually inconsistent with GunVault chips.
**Fix:** Standardized to match GunVault chip style: `fontSize: '10px'`, `padding: '6px 11px'`, `borderRadius: '20px'` (pill shape), active state uses solid accent fill. Also removed forced toUpperCase to preserve proper capitalization ("Self Defense").

---

## Fix #9 — GearLocker: Replace emoji icons with styled abbreviation badges
**File:** `web/src/GearLocker.tsx`
**Problem:** Category icons (🔭🔫📦🔇🧹🔧⚠️) broke visual consistency. Star rating (⭐⭐⭐) is OS-dependent and can render poorly on Android.
**Fix:** Category icons replaced with 3-letter gold abbreviation badges (OPT, HLS, MAG, SUP, CLN, ACC, NFA) in monospace — matches the app's data-driven aesthetic. Star rating replaced with filled/empty circles (●●●●○) in theme.accent.

---

## Fix #8 — OpticsList: Standardize type colors, replace emoji empty state
**File:** `web/src/OpticsList.tsx`
**Problem 1:** `OPTIC_TYPE_COLORS` used raw hex codes (`#f03e3e`, `#e67700`, `#9775fa`, `#a9e34b`, `#63e6be`) that don't come from the theme — arbitrary palette that clashes with the app's color system. **Problem 2:** Empty state used 🔭 emoji — inconsistent with SVG icon language.
**Fix:** Mapped type colors to theme variables (red, orange, accent, blue, green) where possible. Remaining two unique types keep their original hues. Empty state now uses the same SVG optic icon from MoreMenu.

---

## Fix #7 — BallisticCalculator: Fix broken layout on mobile
**File:** `web/src/BallisticCalculator.tsx`
**Problem:** Screen used a two-column grid layout with `padding: '24px'` and `maxWidth: '1400px'` — clearly designed for desktop. Inside the app's 480px container, each column was ~155px wide — too narrow for form labels and number inputs. Header used a full `<h1>` with `24px` font that dominated the screen.
**Fix:** Changed to single-column layout, reduced padding to 16px, added bottom nav padding, simplified header to match the app's standard minimal header style.

---

## Fix #6 — TrainingLog: Stats grid 3→2 columns, prevent cramped cards
**File:** `web/src/TrainingLog.tsx`
**Problem:** Stats overview used 3 columns on mobile (390px) → ~111px per card. With 16px padding, content area was ~79px — numbers were cramped and label text barely fit. 4th stat (Avg Score) was hidden on mobile entirely.
**Fix:** Unified to 2×2 grid on all sizes. All 4 stats now visible. Numbers breathe at 28px with proper label spacing. Cleaner visual rhythm.

---

## Fix #5 — GunDetailModal: Replace emoji system notes with styled labels
**File:** `web/src/GunDetailModal.tsx`
**Problem:** System notes used emojis (⚠️🎯🔥💤✓) — inconsistent with the app's SVG icon language, renders inconsistently across Android/iOS, and can't be themed.
**Fix:** Replaced emojis with structured `PREFIX: body` format. Rendered with a colored monospace prefix (ISSUE/IDLE in orange; ZERO/ROUNDS in gold). Clean, consistent, no emoji dependency.

---

## Fix #4 — GunVault: "Clear All Filters" button is invisible
**File:** `web/src/GunVault.tsx`
**Problem:** The "CLEAR ALL FILTERS" button was styled as muted text on transparent background — nearly invisible. When filters are active, this is the action users most need to find.
**Fix:** Styled the button with gold border + gold text + subtle gold fill. Label now shows count: "CLEAR 2 FILTERS" so the user knows exactly what they're clearing. Still only visible when at least one filter is active.

---

## Fix #3 — MobileNav: Increase touch targets to 48px minimum
**File:** `web/src/MobileNav.tsx`
**Problem:** Tab buttons had `padding: '6px 4px'` → total height ~42px. WCAG 2.1 requires 44×44px minimum for touch targets. On a phone with thick fingers or while moving, this causes accidental misses.
**Fix:** Changed to `padding: '8px 4px'`, added `minHeight: '48px'`. Buttons now comfortably exceed the 44px minimum.

---

## Fix #2 — HomePage: Replace hardcoded colors with theme tokens
**File:** `web/src/HomePage.tsx`
**Problem:** `InsightsCarousel` used `#ffd43b`, `#07071a`, `#51cf66`, `#666` hardcoded. These break outdoor/light theme — the insight card would show a near-black background even on a light theme.
**Fix:** Replaced with `theme.accent`, `theme.bg`, `theme.green`, `theme.textMuted`. Now adapts correctly across both themes.

---

## Fix #1 — MoreMenu: Replace emojis with SVG icons
**File:** `web/src/MoreMenu.tsx`
**Problem:** Every nav icon in the app is a clean monochrome SVG. The More menu used emoji (📖🔴📐📋⚗️🎒⭐🔭🔩🏆) — completely inconsistent visual language, looks amateurish on dark theme, doesn't scale, can't be tinted to theme colors.
**Fix:** Drew 10 custom SVG icons (Field Guide, Calibers, Ballistics, Training, Reloading, Gear Locker, Wishlist, Optics, Gunsmithing, Events). All use `theme.textPrimary`/`theme.textMuted`, 26px size, consistent 1.5px stroke weight. Also fixed: disabled "Coming Soon" items now have `pointerEvents: 'none'` so they can't be accidentally tapped.

---

