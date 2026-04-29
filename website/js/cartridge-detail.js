// Cartridge Detail Page — Lindcott Armory
// Reads URL slug, fetches cartridge from Supabase, renders full page.
// Depends on: js/supabase-loader.js

(async function () {
  'use strict';

  // ── SLUG HELPERS ────────────────────────────────────────────────────────
  function nameToSlug(name) {
    return name.toLowerCase()
      .replace(/×/g, 'x')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // ── RENDER HELPERS ──────────────────────────────────────────────────────
  function esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function fmtRange(r) {
    if (!r || r.min == null) return '—';
    if (r.min === r.max) return r.min.toLocaleString();
    return r.min.toLocaleString() + '–' + r.max.toLocaleString();
  }

  // ── READ SLUG ───────────────────────────────────────────────────────────
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const slug = pathParts[pathParts.length - 1] || '';

  if (!slug || pathParts[0] !== 'cartridge') {
    window.location.replace('/cartridge-library');
    return;
  }

  // ── FETCH & MATCH ───────────────────────────────────────────────────────
  const $loading = document.getElementById('cd-loading');
  const $content = document.getElementById('cd-content');

  try {
    const [cartridgeRows, powderRows] = await Promise.all([
      supabaseFetchAll('cartridges'),
      supabaseFetchAll('powder_brands'),
    ]);
    const cartridges = transformCartridges(cartridgeRows);
    const powders    = transformPowders(powderRows);
    const c          = cartridges.find(cart => nameToSlug(cart.name) === slug);

    if (!c) {
      $loading.innerHTML = `<p style="color:var(--muted)">Cartridge not found. <a href="/cartridge-library" style="color:var(--accent)">← Back to library</a></p>`;
      return;
    }

    // ── UPDATE META (Google reads these after JS executes) ──────────────
    document.title = `${c.name} — Ballistics, History & Specs | Lindcott Armory`;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.content = c.description
        ? c.description.slice(0, 155) + (c.description.length > 155 ? '…' : '')
        : `Complete ballistics, history, and specifications for ${c.name}. Includes bullet diameter, velocity, energy, military adoption history, and availability.`;
    }

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = `https://lindcottarmory.com/cartridge/${slug}`;

    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc  = document.querySelector('meta[property="og:description"]');
    const ogUrl   = document.querySelector('meta[property="og:url"]');
    if (ogTitle) ogTitle.content = document.title;
    if (ogDesc  && metaDesc) ogDesc.content = metaDesc.content;
    if (ogUrl)  ogUrl.content = `https://lindcottarmory.com/cartridge/${slug}`;

    // ── UPDATE BREADCRUMB ───────────────────────────────────────────────
    document.getElementById('cd-breadcrumb-name').textContent = c.name;

    // ── STRUCTURED DATA ─────────────────────────────────────────────────
    const ldJson = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': `${c.name} — Ballistics, History & Specifications`,
      'description': metaDesc ? metaDesc.content : '',
      'url': `https://lindcottarmory.com/cartridge/${slug}`,
      'publisher': { '@type': 'Organization', 'name': 'Lindcott Armory' },
      'mainEntityOfPage': { '@type': 'WebPage', '@id': `https://lindcottarmory.com/cartridge/${slug}` }
    };
    const ldScript = document.createElement('script');
    ldScript.type = 'application/ld+json';
    ldScript.textContent = JSON.stringify(ldJson);
    document.head.appendChild(ldScript);

    // ── RENDER ──────────────────────────────────────────────────────────
    const hasMil = c.militaryAdoption && c.militaryAdoption.length > 0;

    // Header
    document.getElementById('cd-title').textContent = c.name;

    if (c.alternateNames && c.alternateNames.length) {
      document.getElementById('cd-alt').textContent = c.alternateNames.join(' · ');
    }

    const $badges = document.getElementById('cd-badges');
    $badges.innerHTML = [
      c.availability ? `<span class="badge-avail avail-${c.availability.toLowerCase()}">${c.availability.toUpperCase()}</span>` : '',
      c.type ? `<span class="badge-avail avail-common" style="background:rgba(255,255,255,0.04);border-color:rgba(255,255,255,0.1);color:var(--muted)">${esc(c.type.toUpperCase())}</span>` : '',
      hasMil ? '<span class="badge-military">MILITARY USE</span>' : '',
      c.productionStatus === 'Obsolete' ? '<span class="badge-avail avail-scarce">OBSOLETE</span>' : '',
    ].join('');

    if (c.description) {
      document.getElementById('cd-description').textContent = c.description;
    }

    // Specs
    const specRows = [
      c.bulletDiameterInch  ? ['BULLET DIA',      `${c.bulletDiameterInch.toFixed(3)}" / ${c.bulletDiameterMM}mm`] : null,
      c.yearIntroduced      ? ['INTRODUCED',       c.yearIntroduced] : null,
      c.velocityRangeFPS    ? ['VELOCITY',         fmtRange(c.velocityRangeFPS) + ' fps'] : null,
      c.energyRangeFTLBS    ? ['ENERGY',           fmtRange(c.energyRangeFTLBS) + ' ft·lb'] : null,
      c.maxPressurePSI      ? ['MAX PRESSURE',     c.maxPressurePSI.toLocaleString() + ' PSI'] : null,
      c.effectiveRangeYards ? ['EFFECTIVE RANGE',  c.effectiveRangeYards.toLocaleString() + ' yd'] : null,
      c.caseLengthInch      ? ['CASE LENGTH',      c.caseLengthInch.toFixed(3) + '"'] : null,
      c.typicalTwistRate    ? ['TWIST RATE',       c.typicalTwistRate] : null,
      c.commonBulletWeights && c.commonBulletWeights.length
                            ? ['GRAIN WEIGHTS',    c.commonBulletWeights.join(', ') + ' gr'] : null,
      c.rimType             ? ['RIM TYPE',         c.rimType] : null,
      c.primerType          ? ['PRIMER',           c.primerType] : null,
      c.countryOfOrigin     ? ['ORIGIN',           c.countryOfOrigin] : null,
    ].filter(Boolean);

    document.getElementById('cd-specs').innerHTML = specRows.map(([label, val]) =>
      `<div class="spec-item"><div class="spec-label">${label}</div><div class="spec-value">${esc(String(val))}</div></div>`
    ).join('');

    // Right column sections
    let rightHtml = '';

    if (c.history) {
      rightHtml += `<div class="detail-section"><div class="detail-section-title">History</div><div class="detail-history">${esc(c.history)}</div></div>`;
    }

    if (hasMil) {
      rightHtml += `<div class="detail-section"><div class="detail-section-title">Military Adoption</div><div class="mil-timeline">
        ${c.militaryAdoption.map(m => `
          <div class="mil-item">
            <div class="mil-country">${esc(m.country)}</div>
            <div class="mil-years">${esc(m.years)}</div>
            ${m.conflicts && m.conflicts.length ? `<div class="mil-conflicts">${m.conflicts.join(' · ')}</div>` : ''}
          </div>`).join('')}
      </div>
      ${c.currentMilitaryUse && c.currentMilitaryUse.length
        ? `<div style="margin-top:8px;font-family:var(--mono);font-size:10px;color:var(--muted)">Current: ${esc(c.currentMilitaryUse.join(', '))}</div>`
        : ''}</div>`;
    }

    if (c.notableFirearms && c.notableFirearms.length) {
      rightHtml += `<div class="detail-section"><div class="detail-section-title">Notable Firearms</div><div class="firearms-list">${c.notableFirearms.map(f => `<span class="firearm-tag">${esc(f)}</span>`).join('')}</div></div>`;
    }

    if (c.primaryUse && c.primaryUse.length) {
      rightHtml += `<div class="detail-section"><div class="detail-section-title">Primary Use</div><div class="firearms-list">${c.primaryUse.map(u => `<span class="firearm-tag">${esc(u)}</span>`).join('')}</div></div>`;
    }

    if (c.trivia) {
      rightHtml += `<div class="detail-section"><div class="detail-section-title">Field Notes</div><div class="detail-trivia">${esc(c.trivia)}</div></div>`;
    }

    if (c.similarCartridges && c.similarCartridges.length) {
      rightHtml += `<div class="detail-section"><div class="detail-section-title">Similar Cartridges</div><div class="firearms-list">${
        c.similarCartridges.map(s => {
          const simSlug = nameToSlug(s);
          return `<a href="/cartridge/${simSlug}" class="firearm-tag" style="text-decoration:none">${esc(s)}</a>`;
        }).join('')
      }</div></div>`;
    }

    const cartridgeNames = new Set([c.name, ...(c.alternateNames || [])]);
    const powderSlug = n => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const compatiblePowders = powders
      .filter(p => (p.recommendedCalibers || []).some(cal => cartridgeNames.has(cal)))
      .sort((a, b) => (a.burnRateRank || 999) - (b.burnRateRank || 999))
      .slice(0, 12);
    if (compatiblePowders.length) {
      rightHtml += `<div class="detail-section"><div class="detail-section-title">Compatible Reloading Powders</div><div class="firearms-list">${
        compatiblePowders.map(p =>
          `<a href="/powder/${powderSlug(p.productName)}" class="firearm-tag" style="text-decoration:none">${esc(p.productName)}<span style="opacity:0.4;font-size:9px;margin-left:4px">${esc(p.brand)}</span></a>`
        ).join('')
      }</div></div>`;
    }

    document.getElementById('cd-right').innerHTML = rightHtml;

    // Show content
    $loading.style.display = 'none';
    $content.style.display = 'block';

  } catch (err) {
    console.error('Cartridge detail load error:', err);
    $loading.innerHTML = `<p style="color:var(--muted)">Failed to load data. <a href="/cartridge-library" style="color:var(--accent)">← Back to library</a></p>`;
  }
})();
