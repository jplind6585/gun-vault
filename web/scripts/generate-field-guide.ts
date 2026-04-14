/**
 * Field Guide Static HTML Generator
 * Generates crawlable, SEO-optimised static pages from the app's Field Guide data.
 * Run: npx tsx scripts/generate-field-guide.ts
 * Output: public/field-guide/
 */

// Mock browser globals so storage.ts and module-level JSX don't throw in Node
(global as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {} };
(global as any).React = { createElement: () => null, Fragment: null, forwardRef: () => null };

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../public/field-guide');
fs.mkdirSync(OUT, { recursive: true });

// ── Data imports ──────────────────────────────────────────────────────────────

import {
  GLOSSARY_TERMS,
  CAMO_PATTERNS,
  PLATFORMS,
  BALLISTIC_CONCEPTS,
  MAINTENANCE_GUIDES,
} from '../src/FieldGuide';

import { OPTIC_TYPES } from '../src/FieldGuideOptics';
import { HISTORICAL_FORMATS, MODERN_FORMATS } from '../src/FieldGuideCompetition';
import { seedCartridges } from '../src/seedCartridges';

// ── Shared HTML shell ─────────────────────────────────────────────────────────

function esc(s: string | undefined | null): string {
  if (!s) return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #ffffff;
    --surface: #f4f4f8;
    --surface2: #eaeaf0;
    --border: #e0e0ea;
    --text: #1a1a2e;
    --secondary: #44446a;
    --muted: #88889a;
    --accent: #2f5fe8;
    --accent-dim: rgba(47,95,232,0.1);
    --green: #2f9e44;
    --red: #c92a2a;
    font-family: ui-monospace, 'Cascadia Code', 'Fira Mono', monospace;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #07071a;
      --surface: #0e0e2a;
      --surface2: #14143a;
      --border: rgba(255,255,255,0.07);
      --text: #e8e8f0;
      --secondary: #9090b0;
      --muted: #5a5a7a;
      --accent: #5b8cff;
      --accent-dim: rgba(91,140,255,0.1);
      --green: #51cf66;
      --red: #ff6b6b;
    }
  }
  body { background: var(--bg); color: var(--text); line-height: 1.6; }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }

  /* Nav */
  .nav {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 24px; border-bottom: 1px solid var(--border);
    position: sticky; top: 0; background: var(--bg); z-index: 100;
  }
  .nav-brand { font-size: 13px; font-weight: 800; letter-spacing: .08em; color: var(--text); }
  .nav-section { font-size: 11px; letter-spacing: .12em; color: var(--muted); }
  .nav-cta {
    font-size: 11px; font-weight: 600; letter-spacing: .1em;
    color: var(--accent); border: 1px solid var(--accent);
    padding: 5px 12px; border-radius: 4px;
  }
  .nav-cta:hover { background: var(--accent-dim); text-decoration: none; }

  /* Page header */
  .page-header { padding: 40px 24px 24px; max-width: 800px; margin: 0 auto; }
  .breadcrumb { font-size: 11px; color: var(--muted); letter-spacing: .05em; margin-bottom: 12px; }
  .breadcrumb a { color: var(--muted); }
  .page-title { font-size: clamp(22px,4vw,32px); font-weight: 800; letter-spacing: -.01em; margin-bottom: 8px; }
  .page-desc { font-size: 14px; color: var(--secondary); line-height: 1.7; }

  /* Filter bar */
  .filter-bar {
    max-width: 800px; margin: 0 auto; padding: 0 24px 20px;
    display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
  }
  .search-input {
    flex: 1; min-width: 200px; padding: 8px 12px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 6px; color: var(--text); font-family: inherit;
    font-size: 13px; outline: none;
  }
  .search-input::placeholder { color: var(--muted); }
  .search-input:focus { border-color: var(--accent); }
  .chip-group { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip {
    padding: 5px 12px; font-size: 11px; font-weight: 600; letter-spacing: .08em;
    border-radius: 20px; border: 1px solid var(--border);
    background: var(--surface); color: var(--secondary);
    cursor: pointer; transition: all .15s;
  }
  .chip:hover, .chip.active {
    background: var(--accent); border-color: var(--accent);
    color: #fff;
  }
  .sort-select {
    padding: 6px 10px; background: var(--surface); border: 1px solid var(--border);
    border-radius: 6px; color: var(--text); font-family: inherit; font-size: 12px;
    cursor: pointer; outline: none;
  }

  /* Results count */
  .count { font-size: 11px; color: var(--muted); padding: 0 24px 12px; max-width: 800px; margin: 0 auto; }

  /* Cards */
  .cards { max-width: 800px; margin: 0 auto; padding: 0 24px 80px; display: grid; gap: 12px; }
  .card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 8px; padding: 20px; transition: border-color .15s;
  }
  .card:hover { border-color: var(--accent); }
  .card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
  .card-title { font-size: 14px; font-weight: 700; letter-spacing: .03em; color: var(--text); }
  .card-subtitle { font-size: 11px; color: var(--muted); letter-spacing: .05em; margin-top: 2px; }
  .card-body { font-size: 13px; color: var(--secondary); line-height: 1.7; }
  .card-body p + p { margin-top: 8px; }
  .badge {
    font-size: 10px; font-weight: 700; letter-spacing: .08em; padding: 3px 8px;
    border-radius: 4px; background: var(--accent-dim); color: var(--accent);
    white-space: nowrap; flex-shrink: 0;
  }
  .tag {
    display: inline-block; font-size: 10px; font-weight: 600; letter-spacing: .05em;
    padding: 2px 7px; border-radius: 3px; border: 1px solid var(--border);
    color: var(--muted); margin: 2px;
  }

  /* Expandable */
  .expand-toggle { cursor: pointer; list-style: none; }
  .expand-toggle::-webkit-details-marker { display: none; }
  details > summary { cursor: pointer; }
  details[open] .expand-icon::after { content: '▲'; }
  .expand-icon::after { content: '▼'; font-size: 9px; color: var(--muted); margin-left: 8px; }

  /* Pros/cons */
  .pros-cons { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
  @media (max-width: 500px) { .pros-cons { grid-template-columns: 1fr; } }
  .pros-cons-head { font-size: 10px; font-weight: 700; letter-spacing: .1em; margin-bottom: 6px; }
  .pros-cons-head.pro { color: var(--green); }
  .pros-cons-head.con { color: var(--red); }
  .pros-cons li { font-size: 12px; color: var(--secondary); margin-left: 14px; margin-bottom: 3px; }

  /* Spec table */
  .spec-table { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; margin-top: 12px; }
  .spec-row { display: contents; }
  .spec-key { font-size: 11px; color: var(--muted); letter-spacing: .04em; }
  .spec-val { font-size: 11px; color: var(--text); font-weight: 600; }

  /* Steps list */
  .steps { margin-top: 10px; }
  .step { display: flex; gap: 12px; margin-bottom: 8px; align-items: flex-start; }
  .step-num {
    min-width: 22px; height: 22px; border-radius: 50%;
    background: var(--accent-dim); color: var(--accent);
    font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center;
  }
  .step-text { font-size: 13px; color: var(--secondary); line-height: 1.6; }

  /* No results */
  .no-results { text-align: center; padding: 60px 24px; color: var(--muted); font-size: 13px; display: none; }

  /* Footer */
  .footer {
    border-top: 1px solid var(--border); padding: 24px;
    display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px;
    font-size: 11px; color: var(--muted); letter-spacing: .05em;
  }
  .footer a { color: var(--muted); }
  .footer-links { display: flex; gap: 20px; }

  /* Section nav */
  .section-nav { max-width: 800px; margin: 0 auto; padding: 0 24px 32px; display: flex; flex-wrap: wrap; gap: 8px; }
  .section-link {
    font-size: 11px; font-weight: 600; letter-spacing: .08em; padding: 6px 14px;
    border: 1px solid var(--border); border-radius: 4px; color: var(--secondary);
  }
  .section-link:hover { border-color: var(--accent); color: var(--accent); text-decoration: none; }
`;

const FILTER_JS = `
function filterCards(searchId, cardClass, filterAttr) {
  const input = document.getElementById(searchId);
  const cards = document.querySelectorAll('.' + cardClass);
  const noResults = document.querySelector('.no-results');
  const countEl = document.querySelector('.count');
  let activeFilters = {};

  function update() {
    const q = input ? input.value.toLowerCase().trim() : '';
    let shown = 0;
    cards.forEach(card => {
      let show = true;
      if (q) {
        const text = (card.dataset.text || card.textContent || '').toLowerCase();
        if (!text.includes(q)) show = false;
      }
      Object.entries(activeFilters).forEach(([attr, val]) => {
        if (val && val !== 'all') {
          const cardVal = (card.dataset[attr] || '').toLowerCase();
          if (!cardVal.includes(val.toLowerCase())) show = false;
        }
      });
      card.style.display = show ? '' : 'none';
      if (show) shown++;
    });
    if (noResults) noResults.style.display = shown === 0 ? 'block' : 'none';
    if (countEl) countEl.textContent = shown + ' of ' + cards.length + ' entries';
  }

  if (input) input.addEventListener('input', update);

  document.querySelectorAll('.chip[data-filter]').forEach(chip => {
    chip.addEventListener('click', () => {
      const attr = chip.dataset.filterAttr;
      const val = chip.dataset.filter;
      activeFilters[attr] = (activeFilters[attr] === val) ? 'all' : val;
      document.querySelectorAll('.chip[data-filter-attr="' + attr + '"]').forEach(c => c.classList.remove('active'));
      if (activeFilters[attr] !== 'all') chip.classList.add('active');
      update();
    });
  });

  update();
}
`;

function page(opts: {
  title: string;
  section: string;
  desc: string;
  canonical: string;
  body: string;
  filterJs?: string;
}): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(opts.title)} — Lindcott Armory Field Guide</title>
  <meta name="description" content="${esc(opts.desc)}" />
  <link rel="canonical" href="https://lindcottarmory.com/field-guide/${opts.canonical}" />
  <meta property="og:title" content="${esc(opts.title)} — Lindcott Armory Field Guide" />
  <meta property="og:description" content="${esc(opts.desc)}" />
  <meta property="og:url" content="https://lindcottarmory.com/field-guide/${opts.canonical}" />
  <meta property="og:image" content="https://lindcottarmory.com/icon-1024.png" />
  <link rel="icon" type="image/png" href="/icon-192.png" />
  <style>${CSS}</style>
</head>
<body>
  <nav class="nav">
    <a class="nav-brand" href="/">LINDCOTT ARMORY</a>
    <span class="nav-section">FIELD GUIDE</span>
    <a class="nav-cta" href="/">OPEN APP →</a>
  </nav>
  ${opts.body}
  <footer class="footer">
    <span>© 2026 LINDCOTT FARMS</span>
    <div class="footer-links">
      <a href="/field-guide/">Field Guide</a>
      <a href="/privacy">Privacy</a>
      <a href="/support">Support</a>
    </div>
  </footer>
  <script>${FILTER_JS}${opts.filterJs ?? ''}</script>
</body>
</html>`;
}

function pageHeader(title: string, desc: string, crumb: string) {
  return `
  <div class="page-header">
    <div class="breadcrumb"><a href="/field-guide/">Field Guide</a> › ${esc(crumb)}</div>
    <h1 class="page-title">${esc(title)}</h1>
    <p class="page-desc">${esc(desc)}</p>
  </div>`;
}

function sectionNav(current: string) {
  const links = [
    ['Glossary', 'glossary'],
    ['Calibers', 'calibers'],
    ['Optics', 'optics'],
    ['Competition', 'competition'],
    ['Platforms', 'platforms'],
    ['Camos', 'camos'],
    ['Ballistics', 'ballistics'],
    ['Maintenance', 'maintenance'],
    ['Marksmanship', 'marksmanship'],
  ];
  return `<div class="section-nav">${links.filter(([,slug]) => slug !== current).map(([label, slug]) =>
    `<a class="section-link" href="/field-guide/${slug}">${label}</a>`
  ).join('')}</div>`;
}

// ── 1. Index ──────────────────────────────────────────────────────────────────

const SECTIONS = [
  { slug: 'glossary',      title: 'Glossary',      desc: 'Firearms acronyms and terminology from A–Z',                  count: GLOSSARY_TERMS.length },
  { slug: 'calibers',      title: 'Calibers',       desc: '198 cartridges with specs, history, and ballistics',           count: seedCartridges.length },
  { slug: 'optics',        title: 'Optics',          desc: 'Red dots, LPVOs, magnifiers, NV/thermal — compared',          count: OPTIC_TYPES.length },
  { slug: 'competition',   title: 'Competition',     desc: 'USPSA, IDPA, PRS, 3-Gun, Bullseye and more',                  count: HISTORICAL_FORMATS.length + MODERN_FORMATS.length },
  { slug: 'platforms',     title: 'Platforms',       desc: '141 iconic firearms — history, origin, and legacy',           count: PLATFORMS.length },
  { slug: 'camos',         title: 'Camos',           desc: 'Military, hunting, and tactical camouflage patterns',         count: CAMO_PATTERNS.length },
  { slug: 'ballistics',    title: 'Ballistics',      desc: 'External, terminal, and internal ballistics explained',       count: BALLISTIC_CONCEPTS.length },
  { slug: 'maintenance',   title: 'Maintenance',     desc: 'Step-by-step cleaning guides for AR-15, handguns, bolt rifles', count: MAINTENANCE_GUIDES.length },
  { slug: 'marksmanship',  title: 'Marksmanship',    desc: 'Fundamentals, positions, wind dope, dry fire, and conditions', count: 6 },
];

fs.writeFileSync(path.join(OUT, 'index.html'), page({
  title: 'Field Guide',
  section: 'Field Guide',
  desc: 'The Lindcott Armory Field Guide: firearms glossary, caliber database, optics guide, competition formats, platform history, camouflage patterns, ballistics, maintenance, and marksmanship.',
  canonical: '',
  body: `
  <div class="page-header">
    <div class="breadcrumb"><a href="/">Lindcott Armory</a> › Field Guide</div>
    <h1 class="page-title">Field Guide</h1>
    <p class="page-desc">Reference library for shooters. Calibers, optics, competition formats, firearm history, ballistics, and fundamentals — all in one place.</p>
  </div>
  <div style="max-width:800px;margin:0 auto;padding:0 24px 80px;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;">
    ${SECTIONS.map(s => `
    <a href="/field-guide/${s.slug}" style="display:block;text-decoration:none;">
      <div class="card" style="height:100%;">
        <div class="card-title">${esc(s.title)}</div>
        <div class="card-subtitle" style="margin-top:4px;">${s.count} entries</div>
        <div class="card-body" style="margin-top:8px;">${esc(s.desc)}</div>
      </div>
    </a>`).join('')}
  </div>`,
}));
console.log('✓ index');

// ── 2. Glossary ───────────────────────────────────────────────────────────────

const sortedGlossary = [...GLOSSARY_TERMS].sort((a, b) => a.acronym.localeCompare(b.acronym));
const glossaryLetters = [...new Set(sortedGlossary.map(t => t.group || t.acronym[0].toUpperCase()))].sort();

fs.writeFileSync(path.join(OUT, 'glossary.html'), page({
  title: 'Firearms Glossary',
  section: 'Glossary',
  desc: `${GLOSSARY_TERMS.length} firearms terms, acronyms, and definitions — from MOA and BCG to NFA, DOPE, JHP, and zero.`,
  canonical: 'glossary',
  body: `
  ${pageHeader('Firearms Glossary', `${GLOSSARY_TERMS.length} terms, acronyms, and definitions for shooters of every level.`, 'Glossary')}
  <div class="filter-bar">
    <input class="search-input" id="search" placeholder="Search terms…" type="search" />
    <div class="chip-group">
      ${glossaryLetters.map(l => `<button class="chip" data-filter="${l}" data-filter-attr="group">${l}</button>`).join('')}
    </div>
  </div>
  <p class="count"></p>
  <div class="cards">
    ${sortedGlossary.map(t => `
    <div class="card" data-text="${esc(t.acronym)} ${esc(t.expansion)} ${esc(t.definition)}" data-group="${esc(t.group || t.acronym[0].toUpperCase())}">
      <div class="card-head">
        <div>
          <div class="card-title">${esc(t.acronym)}</div>
          <div class="card-subtitle">${esc(t.expansion)}</div>
        </div>
      </div>
      <div class="card-body">${esc(t.definition)}</div>
    </div>`).join('')}
  </div>
  <div class="no-results">No terms match your search.</div>
  ${sectionNav('glossary')}`,
  filterJs: `filterCards('search','card',null);`,
}));
console.log('✓ glossary');

// ── 3. Calibers ───────────────────────────────────────────────────────────────

const TYPES = ['Rifle', 'Pistol', 'Revolver', 'Shotgun', 'Rimfire'];

fs.writeFileSync(path.join(OUT, 'calibers.html'), page({
  title: 'Caliber & Cartridge Database',
  section: 'Calibers',
  desc: `${seedCartridges.length} cartridges with specs, history, and ballistics — 6.5 Creedmoor, 9mm, .308 Win, .45 ACP, 5.56mm, and more.`,
  canonical: 'calibers',
  body: `
  ${pageHeader('Caliber & Cartridge Database', `${seedCartridges.length} cartridges with specs, history, notable firearms, and ballistic data.`, 'Calibers')}
  <div class="filter-bar">
    <input class="search-input" id="search" placeholder="Search calibers…" type="search" />
    <div class="chip-group">
      ${TYPES.map(t => `<button class="chip" data-filter="${t}" data-filter-attr="type">${t.toUpperCase()}</button>`).join('')}
    </div>
  </div>
  <p class="count"></p>
  <div class="cards">
    ${seedCartridges.map(c => `
    <div class="card" data-text="${esc(c.name)} ${(c.alternateNames||[]).join(' ')} ${esc(c.countryOfOrigin)} ${esc(c.description)}" data-type="${esc(c.type)}">
      <div class="card-head">
        <div>
          <div class="card-title">${esc(c.name)}${c.alternateNames?.length ? ` <span style="font-weight:400;color:var(--muted);font-size:12px;">/ ${c.alternateNames.join(', ')}</span>` : ''}</div>
          <div class="card-subtitle">${esc(c.type)} · ${c.yearIntroduced} · ${esc(c.countryOfOrigin)}</div>
        </div>
        <span class="badge">${esc(c.availability)}</span>
      </div>
      <div class="card-body">${esc(c.description)}</div>
      <div class="spec-table">
        <span class="spec-key">BULLET DIA</span><span class="spec-val">${c.bulletDiameterInch}" / ${c.bulletDiameterMM}mm</span>
        <span class="spec-key">VELOCITY</span><span class="spec-val">${c.velocityRangeFPS.min}–${c.velocityRangeFPS.max} fps</span>
        <span class="spec-key">ENERGY</span><span class="spec-val">${c.energyRangeFTLBS.min}–${c.energyRangeFTLBS.max} ft·lbs</span>
        ${c.maxPressurePSI ? `<span class="spec-key">MAX PSI</span><span class="spec-val">${c.maxPressurePSI.toLocaleString()}</span>` : ''}
      </div>
      ${c.history ? `<div class="card-body" style="margin-top:10px;">${esc(c.history)}</div>` : ''}
      ${c.notableFirearms?.length ? `<div style="margin-top:8px;">${c.notableFirearms.map(f => `<span class="tag">${esc(f)}</span>`).join('')}</div>` : ''}
    </div>`).join('')}
  </div>
  <div class="no-results">No calibers match your search.</div>
  ${sectionNav('calibers')}`,
  filterJs: `filterCards('search','card',null);`,
}));
console.log('✓ calibers');

// ── 4. Optics ─────────────────────────────────────────────────────────────────

fs.writeFileSync(path.join(OUT, 'optics.html'), page({
  title: 'Optics Guide',
  section: 'Optics',
  desc: 'Red dots, holographics, LPVOs, prism scopes, variable magnification, NV, and thermal optics — compared with pros, cons, and real examples.',
  canonical: 'optics',
  body: `
  ${pageHeader('Optics Guide', `${OPTIC_TYPES.length} optic types compared — from iron sights and red dots to LPVO, night vision, and thermal.`, 'Optics')}
  <div class="filter-bar">
    <input class="search-input" id="search" placeholder="Search optics…" type="search" />
  </div>
  <p class="count"></p>
  <div class="cards">
    ${OPTIC_TYPES.map(o => `
    <details class="card" data-text="${esc(o.name)} ${esc(o.use)} ${o.body.join(' ')} ${o.pros.join(' ')} ${o.cons.join(' ')} ${o.examples.join(' ')}">
      <summary style="cursor:pointer;list-style:none;">
        <div class="card-head">
          <div>
            <div class="card-title">${esc(o.name)} <span class="expand-icon"></span></div>
            <div class="card-subtitle">${esc(o.use)}</div>
          </div>
        </div>
      </summary>
      <div style="margin-top:12px;">
        ${o.body.map(p => `<div class="card-body" style="margin-bottom:8px;">${esc(p)}</div>`).join('')}
        <div class="pros-cons">
          <div>
            <div class="pros-cons-head pro">PROS</div>
            <ul>${o.pros.map(p => `<li>${esc(p)}</li>`).join('')}</ul>
          </div>
          <div>
            <div class="pros-cons-head con">CONS</div>
            <ul>${o.cons.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
          </div>
        </div>
        <div style="margin-top:12px;">
          <div class="pros-cons-head" style="color:var(--muted);margin-bottom:6px;">EXAMPLES</div>
          ${o.examples.map(e => `<span class="tag">${esc(e)}</span>`).join('')}
        </div>
      </div>
    </details>`).join('')}
  </div>
  <div class="no-results">No optics match your search.</div>
  ${sectionNav('optics')}`,
  filterJs: `filterCards('search','card',null);`,
}));
console.log('✓ optics');

// ── 5. Competition ────────────────────────────────────────────────────────────

const allFormats = [...HISTORICAL_FORMATS, ...MODERN_FORMATS];
const allDisciplines = [...new Set(allFormats.flatMap(f => f.disciplines))].sort();

fs.writeFileSync(path.join(OUT, 'competition.html'), page({
  title: 'Shooting Competition Formats',
  section: 'Competition',
  desc: 'USPSA, IDPA, PRS, Steel Challenge, 3-Gun, Benchrest, NRL22, Bullseye, Olympic, and more — history, rules, and format guides.',
  canonical: 'competition',
  body: `
  ${pageHeader('Shooting Competition Formats', `${allFormats.length} formats from ${HISTORICAL_FORMATS[0]?.founded ?? '1876'} to today — practical shooting, precision rifle, benchrest, and more.`, 'Competition')}
  <div class="filter-bar">
    <input class="search-input" id="search" placeholder="Search formats…" type="search" />
    <div class="chip-group">
      ${allDisciplines.map(d => `<button class="chip" data-filter="${d}" data-filter-attr="disc">${d.toUpperCase()}</button>`).join('')}
    </div>
  </div>
  <p class="count"></p>
  <div class="cards">
    <div style="font-size:11px;font-weight:700;letter-spacing:.1em;color:var(--muted);padding:4px 0 8px;border-bottom:1px solid var(--border);margin-bottom:4px;">HISTORICAL</div>
    ${HISTORICAL_FORMATS.map(f => formatCard(f)).join('')}
    <div style="font-size:11px;font-weight:700;letter-spacing:.1em;color:var(--muted);padding:16px 0 8px;border-bottom:1px solid var(--border);margin-bottom:4px;">MODERN</div>
    ${MODERN_FORMATS.map(f => formatCard(f)).join('')}
  </div>
  <div class="no-results">No formats match your search.</div>
  ${sectionNav('competition')}`,
  filterJs: `filterCards('search','card',null);`,
}));

function formatCard(f: { id: string; name: string; founded: string; org: string; disciplines: string[]; description: string[] }): string {
  return `
  <details class="card" data-text="${esc(f.name)} ${esc(f.org)} ${f.description.join(' ')}" data-disc="${esc(f.disciplines.join(','))}">
    <summary style="cursor:pointer;list-style:none;">
      <div class="card-head">
        <div>
          <div class="card-title">${esc(f.name)} <span class="expand-icon"></span></div>
          <div class="card-subtitle">${esc(f.org)} · Est. ${esc(f.founded)}</div>
        </div>
        <div>${f.disciplines.map(d => `<span class="badge" style="margin:2px;">${esc(d)}</span>`).join('')}</div>
      </div>
    </summary>
    <div style="margin-top:12px;">
      ${f.description.map(p => `<div class="card-body" style="margin-bottom:8px;">${esc(p)}</div>`).join('')}
    </div>
  </details>`;
}
console.log('✓ competition');

// ── 6. Platforms ──────────────────────────────────────────────────────────────

const platformCategories = [...new Set(PLATFORMS.map(p => p.category))].sort();

fs.writeFileSync(path.join(OUT, 'platforms.html'), page({
  title: 'Firearm Platforms & History',
  section: 'Platforms',
  desc: '141 iconic firearms from 1630 to today — flintlocks, lever actions, bolt rifles, semi-auto pistols, submachine guns, and modern sporting rifles.',
  canonical: 'platforms',
  body: `
  ${pageHeader('Firearm Platforms & History', `${PLATFORMS.length} iconic firearms from ${PLATFORMS[0]?.year ?? 1630} to today — the guns that shaped history.`, 'Platforms')}
  <div class="filter-bar">
    <input class="search-input" id="search" placeholder="Search firearms…" type="search" />
    <div class="chip-group">
      ${platformCategories.map(c => `<button class="chip" data-filter="${c}" data-filter-attr="cat">${c.toUpperCase()}</button>`).join('')}
    </div>
  </div>
  <p class="count"></p>
  <div class="cards">
    ${[...PLATFORMS].sort((a, b) => a.year - b.year).map(p => `
    <details class="card" data-text="${esc(p.name)} ${esc(p.origin)} ${esc(p.tagline)} ${esc(p.body)}" data-cat="${esc(p.category)}">
      <summary style="cursor:pointer;list-style:none;">
        <div class="card-head">
          <div>
            <div class="card-title">${esc(p.name)} <span class="expand-icon"></span></div>
            <div class="card-subtitle">${esc(p.era)} · ${esc(p.origin)}</div>
          </div>
          <span class="badge">${esc(p.category)}</span>
        </div>
        <div class="card-body" style="margin-top:6px;font-style:italic;">${esc(p.tagline)}</div>
      </summary>
      <div class="card-body" style="margin-top:12px;">${esc(p.body)}</div>
    </details>`).join('')}
  </div>
  <div class="no-results">No platforms match your search.</div>
  ${sectionNav('platforms')}`,
  filterJs: `filterCards('search','card',null);`,
}));
console.log('✓ platforms');

// ── 7. Camos ──────────────────────────────────────────────────────────────────

const camoRegions = [...new Set(CAMO_PATTERNS.map(c => c.region))].sort();

fs.writeFileSync(path.join(OUT, 'camos.html'), page({
  title: 'Camouflage Patterns',
  section: 'Camos',
  desc: 'Military, hunting, and tactical camouflage patterns — MultiCam, MARPAT, Flecktarn, RealTree, CADPAT, DPM, and more.',
  canonical: 'camos',
  body: `
  ${pageHeader('Camouflage Patterns', `${CAMO_PATTERNS.length} military, hunting, and tactical camouflage patterns from around the world.`, 'Camos')}
  <div class="filter-bar">
    <input class="search-input" id="search" placeholder="Search patterns…" type="search" />
    <div class="chip-group">
      <button class="chip" data-filter="military" data-filter-attr="type">MILITARY</button>
      <button class="chip" data-filter="hunting" data-filter-attr="type">HUNTING</button>
      <button class="chip" data-filter="law enforcement" data-filter-attr="type">LAW ENFORCEMENT</button>
    </div>
    <div class="chip-group">
      ${camoRegions.map(r => `<button class="chip" data-filter="${r}" data-filter-attr="region">${r.toUpperCase()}</button>`).join('')}
    </div>
  </div>
  <p class="count"></p>
  <div class="cards">
    ${CAMO_PATTERNS.map(c => `
    <div class="card" data-text="${esc(c.name)} ${esc(c.country)} ${esc(c.body)}" data-type="${esc(c.type)}" data-region="${esc(c.region)}">
      <div class="card-head">
        <div>
          <div class="card-title">${esc(c.name)}</div>
          <div class="card-subtitle">${esc(c.country)} · ${esc(c.era)}</div>
        </div>
        <span class="badge">${c.type === 'military' ? 'Military' : c.type === 'hunting' ? 'Hunting' : 'Law Enforcement'}</span>
      </div>
      <div style="display:flex;gap:4px;margin:8px 0;">
        ${c.colors.map(col => `<span style="width:20px;height:20px;border-radius:3px;background:${col};display:inline-block;border:1px solid var(--border);"></span>`).join('')}
      </div>
      <div class="card-body">${esc(c.body)}</div>
    </div>`).join('')}
  </div>
  <div class="no-results">No patterns match your search.</div>
  ${sectionNav('camos')}`,
  filterJs: `filterCards('search','card',null);`,
}));
console.log('✓ camos');

// ── 8. Ballistics ─────────────────────────────────────────────────────────────

const ballisticCategories = [...new Set(BALLISTIC_CONCEPTS.map(b => b.category))];

fs.writeFileSync(path.join(OUT, 'ballistics.html'), page({
  title: 'Ballistics Guide',
  section: 'Ballistics',
  desc: 'External, terminal, and internal ballistics explained — bullet drop, wind drift, spin drift, Coriolis, terminal expansion, muzzle velocity, headspace, and rifling.',
  canonical: 'ballistics',
  body: `
  ${pageHeader('Ballistics Guide', `${BALLISTIC_CONCEPTS.length} ballistic concepts covering external, terminal, and internal ballistics.`, 'Ballistics')}
  <div class="filter-bar">
    <input class="search-input" id="search" placeholder="Search concepts…" type="search" />
    <div class="chip-group">
      ${ballisticCategories.map(cat => `<button class="chip" data-filter="${cat}" data-filter-attr="cat">${cat.toUpperCase()}</button>`).join('')}
    </div>
  </div>
  <p class="count"></p>
  <div class="cards">
    ${BALLISTIC_CONCEPTS.map(b => `
    <div class="card" data-text="${esc(b.title)} ${esc(b.category)} ${esc(b.body)}" data-cat="${esc(b.category)}">
      <div class="card-head">
        <div class="card-title">${esc(b.title)}</div>
        <span class="badge">${esc(b.category)}</span>
      </div>
      <div class="card-body" style="margin-top:8px;">${esc(b.body)}</div>
    </div>`).join('')}
  </div>
  <div class="no-results">No concepts match your search.</div>
  ${sectionNav('ballistics')}`,
  filterJs: `filterCards('search','card',null);`,
}));
console.log('✓ ballistics');

// ── 9. Maintenance ────────────────────────────────────────────────────────────

fs.writeFileSync(path.join(OUT, 'maintenance.html'), page({
  title: 'Firearm Maintenance Guides',
  section: 'Maintenance',
  desc: 'Step-by-step cleaning guides for AR-15, handguns (striker-fired), bolt-action rifles, and long-term storage — with tips from professionals.',
  canonical: 'maintenance',
  body: `
  ${pageHeader('Firearm Maintenance Guides', `${MAINTENANCE_GUIDES.length} step-by-step cleaning and maintenance guides.`, 'Maintenance')}
  <div class="filter-bar">
    <input class="search-input" id="search" placeholder="Search guides…" type="search" />
  </div>
  <p class="count"></p>
  <div class="cards">
    ${MAINTENANCE_GUIDES.map(g => `
    <details class="card" data-text="${esc(g.title)} ${g.steps.join(' ')} ${g.tips.join(' ')}">
      <summary style="cursor:pointer;list-style:none;">
        <div class="card-title">${esc(g.title)} <span class="expand-icon"></span></div>
        <div class="card-subtitle" style="margin-top:4px;">${g.steps.length} steps · ${g.tips.length} tips</div>
      </summary>
      <div style="margin-top:16px;">
        <div class="pros-cons-head" style="color:var(--muted);margin-bottom:10px;">STEPS</div>
        <div class="steps">
          ${g.steps.map((s, i) => `
          <div class="step">
            <span class="step-num">${i + 1}</span>
            <span class="step-text">${esc(s)}</span>
          </div>`).join('')}
        </div>
        ${g.tips.length ? `
        <div class="pros-cons-head" style="color:var(--accent);margin:16px 0 10px;">TIPS</div>
        <ul style="padding-left:16px;">
          ${g.tips.map(t => `<li class="card-body" style="margin-bottom:6px;">${esc(t)}</li>`).join('')}
        </ul>` : ''}
      </div>
    </details>`).join('')}
  </div>
  <div class="no-results">No guides match your search.</div>
  ${sectionNav('maintenance')}`,
  filterJs: `filterCards('search','card',null);`,
}));
console.log('✓ maintenance');

// ── 10. Marksmanship ─────────────────────────────────────────────────────────
// Written as static prose HTML — content is all JSX in source, not a data array

fs.writeFileSync(path.join(OUT, 'marksmanship.html'), page({
  title: 'Marksmanship',
  section: 'Marksmanship',
  desc: 'Rifle and pistol marksmanship fundamentals — steady position, aiming, breath control, trigger control, shooting positions, wind dope, dry fire drills, and range conditions.',
  canonical: 'marksmanship',
  body: `
  ${pageHeader('Marksmanship', 'Fundamentals, positions, wind dope, trigger technique, dry fire, and conditions — based on TC 3-22.9 and proven competition doctrine.', 'Marksmanship')}
  <div class="cards">

    <div class="card">
      <div style="font-size:11px;font-weight:700;letter-spacing:.1em;color:var(--muted);margin-bottom:16px;">TC 3-22.9 — THE FOUR FUNDAMENTALS</div>
      <div class="card-title" style="margin-bottom:6px;">1 — Steady Position</div>
      <div class="card-body">The foundation. The rifle must be supported and stable before a shot can be fired accurately. A solid position removes the shooter as a variable. <strong>Natural Point of Aim (NPOA):</strong> when the shooter is fully relaxed, the rifle naturally points somewhere. That point should be on the target — force creates inconsistency. Adjust your body, not the rifle, to achieve NPOA.</div>
    </div>

    <div class="card">
      <div class="card-title" style="margin-bottom:6px;">2 — Aiming</div>
      <div class="card-body">Two components: <strong>sight alignment</strong> and <strong>sight picture</strong>. Sight alignment: the relationship between the front sight and rear sight. Sight picture: sight alignment superimposed on the target. For iron sights, focus on the front sight — accept a blurry target and rear sight. For scopes, the reticle and target appear on the same focal plane.</div>
    </div>

    <div class="card">
      <div class="card-title" style="margin-bottom:6px;">3 — Breath Control</div>
      <div class="card-body">Breathing moves the muzzle. The <strong>respiratory pause</strong> — the natural pause between exhale and inhale — is the optimal window to fire. It lasts 2–4 seconds. Holding breath past 8–10 seconds degrades visual acuity as CO2 builds. For precision fire: take a breath, let half out, pause, fire.</div>
    </div>

    <div class="card">
      <div class="card-title" style="margin-bottom:6px;">4 — Trigger Control</div>
      <div class="card-body">The most common source of shot deviation. The trigger must be pressed <strong>straight to the rear</strong> without disturbing sight alignment. <strong>Surprise break</strong> — the shot should fire as a near-surprise; anticipating the shot causes flinching. Slack, then steady increasing pressure. Do not stop — a paused trigger pull often leads to a jerk to complete it.</div>
    </div>

    <div class="card">
      <div style="font-size:11px;font-weight:700;letter-spacing:.1em;color:var(--muted);margin-bottom:12px;">POSITIONS</div>
      ${[
        ['Prone', 'The most stable position. Lowest center of gravity; body fully supported by the ground. Non-firing elbow directly under the rifle. Legs flat, heels down. NPOA is adjusted by pivoting around the non-firing elbow. The standard position for precision rifle and marksmanship qualification.'],
        ['Prone Supported', 'Prone with a bipod, sandbag, or barricade rest under the fore-end. Eliminates most shooter-induced movement from the shot. Used in benchrest, F-Class, and precision rifle when terrain allows. Check rear bag height — the cheek weld must remain consistent.'],
        ['Sitting', 'Three variations: open leg, crossed leg, crossed ankle. The most stable field position after prone. Non-firing elbow rests on the knee — not bone-on-bone, which is unstable. Used where prone is not possible (high grass, water) and a rest is unavailable.'],
        ['Kneeling', 'Less stable than sitting but faster to assume. Non-firing elbow rests on the knee. The non-firing foot (in low kneeling) can become a rear support point. Used in CQB and field shooting when terrain prevents lower positions.'],
        ['Standing (Offhand)', 'The least stable position — no support. The non-firing upper arm creates the only bone-on-bone support point. Body weight balanced, natural NPOA critical. Used in USPSA, IDPA, and situations requiring height to clear obstacles.'],
        ['Urban / Barricade', 'Support hand on the barricade edge, not the rifle — avoids torque. Roll into the wall, do not lean. The barricade is support for the body, not a gun rest. Consistent cheek weld is critical when transitioning sides.'],
      ].map(([title, body]) => `
      <div style="margin-bottom:16px;">
        <div class="card-title" style="font-size:13px;margin-bottom:4px;">${title}</div>
        <div class="card-body">${body}</div>
      </div>`).join('')}
    </div>

    <div class="card">
      <div style="font-size:11px;font-weight:700;letter-spacing:.1em;color:var(--muted);margin-bottom:12px;">WIND &amp; DOPE</div>
      ${[
        ['Reading Wind', 'Observe indicators: mirage shimmer through the scope (most accurate), vegetation movement, flag angle. Full-value wind is 90° to the bullet path; half-value is 45°. A 10 mph full-value wind pushes a .308 Win bullet ~10 inches at 500 yards. Estimate direction to the nearest 30° clock position.'],
        ['DOPE (Data on Previous Engagements)', 'Your recorded scope adjustments for a specific rifle, ammo, and distance combination. Built by shooting and recording: distance, elevation, windage adjustment, conditions. DOPE is only valid for the exact equipment and conditions it was developed in. Transfer to a scope card or mobile app.'],
        ['Density Altitude', 'Air density affects drag. Higher altitude, higher temperature, and higher humidity all reduce air density — the bullet experiences less drag and shoots flatter. At 5,000ft DA, bullets shoot noticeably higher than at sea level. Ballistic apps (Applied Ballistics, Hornady 4DOF) apply DA corrections automatically.'],
      ].map(([title, body]) => `
      <div style="margin-bottom:16px;">
        <div class="card-title" style="font-size:13px;margin-bottom:4px;">${title}</div>
        <div class="card-body">${body}</div>
      </div>`).join('')}
    </div>

    <div class="card">
      <div style="font-size:11px;font-weight:700;letter-spacing:.1em;color:var(--muted);margin-bottom:12px;">DRY FIRE</div>
      ${[
        ['Why Dry Fire Works', 'The nervous system cannot distinguish between a live round and an empty chamber during the trigger press. Every rep builds the same neural pathway. Top competitors dry fire 3–5× more than they live fire. Cost: zero. Round count: irrelevant.'],
        ['Protocol', 'Verify unloaded — remove magazine, lock bolt or slide back, physically and visually inspect chamber. Remove all ammunition from the room. Triple-check. Choose a safe dry-fire direction (exterior wall, backstop). Begin.'],
        ['Dot Drill', 'Draw a 1" dot at 7 yards. Hold center. Press trigger until the dot does not move. Repeat. When the dot moves, you have identified the flaw — anticipation, weak grip, or heel/thumb pressure. Fix and repeat.'],
        ['Trigger Reset Drill', 'After the break, maintain trigger pressure. Cycle the action (or press the reset in a DA/SA). Feel the reset click. Release only to the reset. Press again. Short-cycling the reset and pressing again is the competition trigger technique.'],
      ].map(([title, body]) => `
      <div style="margin-bottom:16px;">
        <div class="card-title" style="font-size:13px;margin-bottom:4px;">${title}</div>
        <div class="card-body">${body}</div>
      </div>`).join('')}
    </div>

    <div class="card">
      <div style="font-size:11px;font-weight:700;letter-spacing:.1em;color:var(--muted);margin-bottom:12px;">CONDITIONS</div>
      ${[
        ['Cold Bore Shot', 'The first shot from a clean, unheated barrel. Most precision rifles shoot a cold bore shot slightly differently than subsequent shots — often 0.5–2 MOA shift. Know your cold bore offset and log it in your DOPE. Never skip a cold bore log entry.'],
        ['Barrel Temperature', 'A hot barrel changes point of impact — metal expands with heat, the bore geometry shifts slightly. For precision competition, allow the barrel to cool between strings. For hunting, the shot is almost always cold bore.'],
        ['Light Conditions', 'Flat light (overcast, dawn, dusk) removes depth cues and makes range estimation unreliable. Bright sun creates mirage and heat shimmer that distorts the target image. Illuminated reticles become critical in low light. Dial down brightness to preserve night vision.'],
        ['Angle / Elevation', 'Shooting uphill or downhill reduces the horizontal distance the bullet must travel against gravity. Use the <strong>rifleman\'s rule</strong>: apply your ballistic solution for the horizontal distance (cosine of angle × slant range), not the slant range. At 45°, the effective gravity distance is ~70% of slant range.'],
      ].map(([title, body]) => `
      <div style="margin-bottom:16px;">
        <div class="card-title" style="font-size:13px;margin-bottom:4px;">${title}</div>
        <div class="card-body">${body}</div>
      </div>`).join('')}
    </div>

  </div>
  ${sectionNav('marksmanship')}`,
  filterJs: '',
}));
console.log('✓ marksmanship');

console.log('\n✅ All field guide pages generated in public/field-guide/');
