# Lindcott Armory — Project Notes for Claude

## Open Action Items

- [ ] **Screen recording for homepage AI demo section** — User will provide a short, silent, autoplaying screen recording of someone logging a session and/or the AI responding. Drop in `/assets/videos/` and replace the static AI chat mockup with the video. Should loop, autoplay, muted, no controls.

- [ ] **Ballistic drop table on individual cartridge pages** — Add to `/cartridge/[slug]` pages. Requires two Supabase schema additions:
  1. `representative_gun` (text) — e.g., "Remington 700 24\" barrel", "Glock 17 4.49\" barrel"
  2. `grain_ballistics` (jsonb) — array of `{ grain, bc_g1, mv_fps }` objects per cartridge
  Display: grain weight dropdown, computed drop table (rifle: 100/200/300/400/500 yd; pistol/revolver: 25/50/75/100 yd). Compute client-side from BC + MV. Label assumptions clearly. Start with top 50 cartridges, fill incrementally.

## Deploy

Production site: `lindcottarmory.com`
Netlify site ID: `26f14e12-27a0-463b-9fbd-c9edd684623a`
Deploy command: `netlify deploy --prod --site 26f14e12-27a0-463b-9fbd-c9edd684623a`

## Architecture Notes

- All data is fetched live from Supabase on every page load — no static data files for cartridges/powders
- Individual cartridge pages: `/cartridge/[slug]` → served by `cartridge.html` via Netlify rewrite
- Individual powder pages: `/powder/[slug]` → served by `powder-detail.html` via Netlify rewrite
- Sitemap is dynamic (Netlify Function at `netlify/functions/sitemap.js`) — auto-updates when Supabase rows change
- Slug for cartridges: `nameToSlug(name)` — lowercase, non-alphanumeric → `-`
- Slug for powders: `powderToSlug(productName)` — product name only (all 230 are unique)
