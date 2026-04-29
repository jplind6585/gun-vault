# Lindcott Armory — Project Notes for Claude

## Open Action Items

- [ ] **Screen recording for homepage AI demo section** — User will provide a short, silent, autoplaying screen recording of someone logging a session and/or the AI responding. Drop in `/assets/videos/` and replace the static AI chat mockup with the video. Should loop, autoplay, muted, no controls.

- [ ] **Cartridge Comparison Tool** — Side-by-side compare (e.g. "9mm vs .45 ACP vs .40 S&W"). Blocked on ballistic data (BC + MV per grain weight). Once `grain_ballistics` and `representative_gun` columns are populated (see ballistic drop item below), build as a Field Guide page at `/compare?c=9mm-luger,45-acp`. Use URL params so links are shareable. High-volume SEO target ("9mm vs .45 acp").

- [ ] **⚡ HIGH PRIORITY — Hunting Guide** — Build Field Guide page at `/hunting-guide`. Top 20 most hunted animals worldwide, displayed as silhouettes smallest→largest, each linking to recommended cartridges from `hunting_game_size` column on `cartridges` table. Drop SVGs in `/assets/images/animals/`. **User is sourcing SVG pack — needs ONE cohesive hunting/wildlife style.**
  **Animals in order (smallest → largest/most dangerous):**
  1. Mourning Dove  2. Bobwhite Quail  3. Grouse  4. Ring-necked Pheasant  5. Rabbit/Hare
  6. Wild Turkey  7. Mallard Duck  8. Canada Goose  9. Coyote  10. Pronghorn
  11. Mule Deer  12. White-tailed Deer  13. Wild Boar/Feral Pig  14. Impala  15. Springbok
  16. Black Bear  17. Red Deer/Red Stag  18. Elk/Wapiti  19. Moose  20. Cape Buffalo
  Sources: The Noun Project, Flaticon hunting packs, SVGRepo.

- [ ] **Ballistic drop table on individual cartridge pages** — Add to `/cartridge/[slug]` pages. Requires two Supabase schema additions:
  1. `representative_gun` (text) — e.g., "Remington 700 24\" barrel", "Glock 17 4.49\" barrel"
  2. `grain_ballistics` (jsonb) — array of `{ grain, bc_g1, mv_fps }` objects per cartridge
  Display: grain weight dropdown, computed drop table (rifle: 100/200/300/400/500 yd; pistol/revolver: 25/50/75/100 yd). Compute client-side from BC + MV. Label assumptions clearly. Start with top 50 cartridges, fill incrementally.

## Deploy

Production site: `lindcottarmory.com`
Netlify site ID: `26f14e12-27a0-463b-9fbd-c9edd684623a`
Deploy command: `netlify deploy --prod --site 26f14e12-27a0-463b-9fbd-c9edd684623a`

## Intentional Duplication

- **Buying checklist** — The checklist data exists in two places by design:
  - `gun-app/web/src/FieldGuideBuyingChecklist.tsx` — app version (React, richer UX)
  - `gun-app/website/buying-checklist.html` — website version (vanilla JS, standalone)
  - They are treated as separate products. Do NOT attempt to consolidate or sync them. If content changes are needed, update both manually.

## Architecture Notes

- All data is fetched live from Supabase on every page load — no static data files for cartridges/powders
- Individual cartridge pages: `/cartridge/[slug]` → served by `cartridge.html` via Netlify rewrite
- Individual powder pages: `/powder/[slug]` → served by `powder-detail.html` via Netlify rewrite
- Sitemap is dynamic (Netlify Function at `netlify/functions/sitemap.js`) — auto-updates when Supabase rows change
- Slug for cartridges: `nameToSlug(name)` — lowercase, non-alphanumeric → `-`
- Slug for powders: `powderToSlug(productName)` — product name only (all 230 are unique)
