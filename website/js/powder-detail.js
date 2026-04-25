// Powder Detail Page — Lindcott Armory
// Reads URL slug, fetches powder from Supabase, renders full page.
// Depends on: js/supabase-loader.js

(async function () {
  'use strict';

  // ── SLUG HELPERS ────────────────────────────────────────────────────────
  function powderToSlug(productName) {
    return productName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

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

  function typeBadgeClass(type) {
    switch (type) {
      case 'Ball':     return 'type-ball';
      case 'Extruded': return 'type-extruded';
      case 'Disc':     return 'type-disc';
      case 'Flake':    return 'type-flake';
      default:         return 'type-other';
    }
  }

  function useClass(use) {
    switch (use) {
      case 'Pistol':        return 'use-pistol';
      case 'Rifle':         return 'use-rifle';
      case 'Shotgun':       return 'use-shotgun';
      case 'Magnum Pistol': return 'use-magnum-pistol';
      case 'Magnum Rifle':  return 'use-magnum-rifle';
      default:              return '';
    }
  }

  function tempClass(temp) {
    switch (temp) {
      case 'Low':      return 'temp-low';
      case 'Moderate': return 'temp-moderate';
      case 'High':     return 'temp-high';
      default:         return '';
    }
  }

  // ── READ SLUG ───────────────────────────────────────────────────────────
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const slug = pathParts[pathParts.length - 1] || '';

  if (!slug || pathParts[0] !== 'powder') {
    window.location.replace('/powder-library');
    return;
  }

  const $loading = document.getElementById('pd-loading');
  const $content = document.getElementById('pd-content');

  try {
    const rows    = await supabaseFetchAll('powder_brands');
    const powders = transformPowders(rows);
    const p       = powders.find(pw => powderToSlug(pw.productName) === slug);

    if (!p) {
      $loading.innerHTML = `<p style="color:var(--muted)">Powder not found. <a href="/powder-library" style="color:var(--accent)">← Back to library</a></p>`;
      return;
    }

    // ── UPDATE META ──────────────────────────────────────────────────────
    const pageTitle = `${p.productName} (${p.brand}) — Reloading Powder | Lindcott Armory`;
    document.title = pageTitle;

    const descText = p.description
      ? p.description.slice(0, 155) + (p.description.length > 155 ? '…' : '')
      : `${p.productName} by ${p.brand}. Burn rate rank ${p.burnRateRank ?? '—'}, ${p.powderType} powder. Temperature sensitivity: ${p.temperatureSensitivity || '—'}.`;

    document.querySelector('meta[name="description"]').content = descText;

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = `https://lindcottarmory.com/powder/${slug}`;

    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc  = document.querySelector('meta[property="og:description"]');
    const ogUrl   = document.querySelector('meta[property="og:url"]');
    if (ogTitle) ogTitle.content = pageTitle;
    if (ogDesc)  ogDesc.content  = descText;
    if (ogUrl)   ogUrl.content   = `https://lindcottarmory.com/powder/${slug}`;

    // ── STRUCTURED DATA ──────────────────────────────────────────────────
    const ldJson = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': pageTitle,
      'description': descText,
      'url': `https://lindcottarmory.com/powder/${slug}`,
      'publisher': { '@type': 'Organization', 'name': 'Lindcott Armory' },
      'mainEntityOfPage': { '@type': 'WebPage', '@id': `https://lindcottarmory.com/powder/${slug}` }
    };
    const ldScript = document.createElement('script');
    ldScript.type = 'application/ld+json';
    ldScript.textContent = JSON.stringify(ldJson);
    document.head.appendChild(ldScript);

    // ── BREADCRUMB & HEADER ──────────────────────────────────────────────
    document.getElementById('pd-breadcrumb-name').textContent = p.productName;
    document.getElementById('pd-title').textContent = p.productName;

    const $subtitle = document.getElementById('pd-subtitle');
    $subtitle.innerHTML = esc(p.brand) +
      (p.parentCompany && p.parentCompany !== p.brand
        ? ` <span style="opacity:0.4">·</span> ${esc(p.parentCompany)}`
        : '');

    // Badges
    const $badges = document.getElementById('pd-badges');
    $badges.innerHTML = [
      `<span class="type-badge ${typeBadgeClass(p.powderType)}">${esc(p.powderType) || '—'}</span>`,
      ...(p.bestUse || []).map(u => `<span class="use-tag-full ${useClass(u)}">${esc(u)}</span>`),
      p.discontinued ? '<span class="badge-discontinued">DISCONTINUED</span>' : '',
    ].join('');

    if (p.description) {
      document.getElementById('pd-description').textContent = p.description;
    }

    // ── BURN RATE SCALE ──────────────────────────────────────────────────
    const rank = p.burnRateRank;
    if (rank) {
      const pct    = Math.min(100, Math.max(1, rank));
      const dotPct = Math.min(98, Math.max(2, pct));
      document.getElementById('pd-burn-section').style.display = 'block';
      document.getElementById('pd-burn-fill').style.width = pct + '%';
      document.getElementById('pd-burn-dot').style.left  = dotPct + '%';
      document.getElementById('pd-burn-rank').textContent = `RANK ${rank} / 100`;
    }

    // ── SPECS ────────────────────────────────────────────────────────────
    const specRows = [
      ['POWDER TYPE',   p.powderType || '—'],
      ['BURN RATE RANK', rank ? String(rank) : '—'],
      p.temperatureSensitivity ? ['TEMP SENSITIVITY',
        `<span class="${tempClass(p.temperatureSensitivity)}">${esc(p.temperatureSensitivity)}</span>`] : null,
      p.meteringGrade    ? ['METERING GRADE',  p.meteringGrade]    : null,
      p.muzzleFlashRating? ['MUZZLE FLASH',    p.muzzleFlashRating]: null,
      p.countryOfOrigin  ? ['COUNTRY',         p.countryOfOrigin]  : null,
    ].filter(Boolean);

    document.getElementById('pd-specs').innerHTML = specRows.map(([label, val]) =>
      `<div class="spec-item"><div class="spec-label">${label}</div><div class="spec-value">${val}</div></div>`
    ).join('');

    // ── CALIBERS ─────────────────────────────────────────────────────────
    const calibers = p.recommendedCalibers || [];
    if (calibers.length) {
      document.getElementById('pd-calibers-section').style.display = 'block';
      document.getElementById('pd-calibers').innerHTML =
        calibers.map(c =>
          `<a href="/cartridge/${nameToSlug(c)}" class="firearm-tag" style="text-decoration:none">${esc(c)}</a>`
        ).join('');
    }

    // ── SIMILAR POWDERS ───────────────────────────────────────────────────
    if (p.burnRateRank) {
      const similar = powders
        .filter(q => q.burnRateRank &&
          Math.abs(q.burnRateRank - p.burnRateRank) <= 5 &&
          q.productName !== p.productName)
        .sort((a, b) => Math.abs(a.burnRateRank - p.burnRateRank) - Math.abs(b.burnRateRank - p.burnRateRank))
        .slice(0, 6);
      if (similar.length) {
        document.getElementById('pd-similar-section').style.display = 'block';
        document.getElementById('pd-similar').innerHTML = similar.map(s =>
          `<a href="/powder/${powderToSlug(s.productName)}" class="firearm-tag" style="text-decoration:none">${esc(s.productName)}<span style="opacity:0.4;font-size:9px;margin-left:5px">${s.burnRateRank}</span></a>`
        ).join('');
      }
    }

    // ── SUPPLY CHAIN ─────────────────────────────────────────────────────
    if (p.manufacturer || p.distributor) {
      const supplyRows = [
        p.manufacturer ? ['MANUFACTURER', p.manufacturer] : null,
        p.distributor  ? ['DISTRIBUTOR',  p.distributor]  : null,
      ].filter(Boolean);
      document.getElementById('pd-supply-section').style.display = 'block';
      document.getElementById('pd-supply').innerHTML = supplyRows.map(([label, val]) =>
        `<div class="spec-item"><div class="spec-label">${label}</div><div class="spec-value">${esc(val)}</div></div>`
      ).join('');
    }

    // Show content
    $loading.style.display = 'none';
    $content.style.display = 'block';

  } catch (err) {
    console.error('Powder detail load error:', err);
    $loading.innerHTML = `<p style="color:var(--muted)">Failed to load data. <a href="/powder-library" style="color:var(--accent)">← Back to library</a></p>`;
  }
})();
