// Powder Library — Lindcott Armory Field Guide
// Depends on: js/supabase-loader.js (supabaseFetchAll, transformPowders)

(function () {
  'use strict';

  // ── STATE ─────────────────────────────────────────────────────────────
  let allPowders = [];
  let allCalibers = [];
  let state = {
    search:        '',
    caliberChips:  [],
    filterType:   'all',
    filterUse:    'all',
    filterBrand:  'all',
    filterTemp:   'all',
    filterStatus: 'all',
    sortField:    'burn',
    sortDir:      'asc',
  };

  // ── ELEMENTS ──────────────────────────────────────────────────────────
  const $search        = document.getElementById('search');
  const $searchClear   = document.getElementById('search-clear');
  const $tbody         = document.getElementById('powder-tbody');
  const $count         = document.getElementById('result-count');
  const $empty         = document.getElementById('table-empty');
  const $loading       = document.getElementById('loading-state');
  const $tableWrap     = document.getElementById('table-wrap');
  const $detailInner   = document.getElementById('detail-inner');
  const $detailPanel   = document.getElementById('detail-panel');
  const $detailBackdrop = document.getElementById('detail-backdrop');
  const $brandSelect   = document.getElementById('brand-filter');
  const $chipsBar      = document.getElementById('caliber-chips-bar');
  const $suggestions   = document.getElementById('caliber-suggestions');

  // ── SLUG & COLOR HELPERS ──────────────────────────────────────────────
  function powderToSlug(productName) {
    return productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function burnColor(pct) {
    const h = pct <= 50
      ? Math.round(216 - (pct / 50) * 166)   // 216 (blue) → 50 (amber)
      : Math.round(50  - ((pct - 50) / 50) * 45); // 50 (amber) → 5 (red)
    return `hsl(${h},72%,55%)`;
  }

  // ── HELPERS ───────────────────────────────────────────────────────────
  function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
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

  function tempClass(temp) {
    switch (temp) {
      case 'Low':      return 'temp-low';
      case 'Moderate': return 'temp-moderate';
      case 'High':     return 'temp-high';
      default:         return '';
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

  function useAbbr(use) {
    switch (use) {
      case 'Pistol':        return 'P';
      case 'Rifle':         return 'R';
      case 'Shotgun':       return 'S';
      case 'Magnum Pistol': return 'MP';
      case 'Magnum Rifle':  return 'MR';
      default:              return use.charAt(0);
    }
  }

  // ── CALIBER FUZZY MATCH ───────────────────────────────────────────────
  function normCal(s) {
    return s.toLowerCase().replace(/[\s.\-×xX,]/g, '').replace(/^0+(?=\d)/, '');
  }

  function calMatchesPowder(cal, p) {
    const nc = normCal(cal);
    return (p.recommendedCalibers || []).some(c => normCal(c).includes(nc) || nc.includes(normCal(c)));
  }

  // ── FILTER & SORT ─────────────────────────────────────────────────────
  function getFiltered() {
    let list = allPowders.filter(p => {
      if (state.search) {
        const q = state.search.toLowerCase();
        const match =
          p.productName.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.recommendedCalibers || []).some(c => normCal(c).includes(normCal(state.search)) || c.toLowerCase().includes(q));
        if (!match) return false;
      }
      if (state.caliberChips.length > 0) {
        if (!state.caliberChips.some(cal => calMatchesPowder(cal, p))) return false;
      }
      if (state.filterType   !== 'all' && p.powderType !== state.filterType) return false;
      if (state.filterUse    !== 'all' && !(p.bestUse || []).includes(state.filterUse)) return false;
      if (state.filterBrand  !== 'all' && p.brand !== state.filterBrand) return false;
      if (state.filterTemp   !== 'all' && p.temperatureSensitivity !== state.filterTemp) return false;
      if (state.filterStatus === 'active' && p.discontinued) return false;
      if (state.filterStatus === 'discontinued' && !p.discontinued) return false;
      return true;
    });

    list.sort((a, b) => {
      let av, bv;
      switch (state.sortField) {
        case 'name':  av = a.productName.toLowerCase(); bv = b.productName.toLowerCase(); break;
        case 'brand': av = a.brand.toLowerCase();       bv = b.brand.toLowerCase();       break;
        case 'type':  av = a.powderType.toLowerCase();  bv = b.powderType.toLowerCase();  break;
        case 'burn':  av = a.burnRateRank ?? 999;       bv = b.burnRateRank ?? 999;       break;
        case 'use':   av = (a.bestUse || [])[0] || ''; bv = (b.bestUse || [])[0] || ''; break;
        case 'temp':  { const o = {Low:0,Moderate:1,High:2}; av = o[a.temperatureSensitivity] ?? 9; bv = o[b.temperatureSensitivity] ?? 9; break; }
        default:      av = a.burnRateRank ?? 999;       bv = b.burnRateRank ?? 999;
      }
      if (av < bv) return state.sortDir === 'asc' ? -1 : 1;
      if (av > bv) return state.sortDir === 'asc' ?  1 : -1;
      return 0;
    });

    return list;
  }

  // ── RENDER ────────────────────────────────────────────────────────────
  function renderBurnCell(rank) {
    if (!rank && rank !== 0) return '<span style="color:var(--dim)">—</span>';
    const pct = Math.min(100, Math.max(1, rank));
    const color = burnColor(pct);
    return `<div class="burn-cell">
      <span class="burn-rank" style="color:${color}">${pct}</span>
      <div class="burn-bar-wrap"><div class="burn-bar-fill" style="width:${pct}%;background:${color}"></div></div>
    </div>`;
  }

  function renderUseTags(uses) {
    if (!uses || !uses.length) return '<span style="color:var(--dim)">—</span>';
    return uses.map(u =>
      `<span class="use-tag ${useClass(u)}" title="${esc(u)}">${useAbbr(u)}</span>`
    ).join('');
  }

  function renderRow(p) {
    const discBadge = p.discontinued
      ? `<span class="badge-discontinued">DISC</span>` : '';
    return `<tr>
      <td class="col-product">
        <span class="td-name">${esc(p.productName)}</span>${discBadge}
      </td>
      <td class="col-pbrand td-pbrand">${esc(p.brand)}</td>
      <td class="col-ptype"><span class="type-badge ${typeBadgeClass(p.powderType)}">${esc(p.powderType) || '—'}</span></td>
      <td class="col-burn">${renderBurnCell(p.burnRateRank)}</td>
      <td class="col-use">${renderUseTags(p.bestUse)}</td>
      <td class="col-temp"><span class="temp-badge ${tempClass(p.temperatureSensitivity)}">${esc(p.temperatureSensitivity) || '—'}</span></td>
    </tr>`;
  }

  const BURN_BANDS = [
    { max: 25,   label: 'FAST',       sub: 'Pistol & Shotgun',         color: 'hsl(173,72%,50%)' },
    { max: 50,   label: 'MEDIUM',     sub: 'Pistol to Mid Rifle',      color: 'hsl(90,65%,48%)'  },
    { max: 75,   label: 'SLOW',       sub: 'Full-Length Rifle',        color: 'hsl(38,80%,52%)'  },
    { max: 100,  label: 'VERY SLOW',  sub: 'Magnum & Large Rifle',     color: 'hsl(16,80%,52%)'  },
    { max: 9999, label: 'UNRATED',    sub: 'No burn rate position',    color: 'rgba(255,255,255,0.25)' },
  ];

  function updateCaliberHint() {
    const $hint = document.getElementById('caliber-hint');
    if (!$hint) return;
    $hint.style.display = (!state.search && !state.caliberChips.length) ? '' : 'none';
  }

  function renderTable() {
    const list = getFiltered();
    $count.textContent = list.length + (list.length === 1 ? ' powder' : ' powders');
    updateCaliberHint();

    if (!list.length) {
      $tbody.innerHTML = '';
      $empty.style.display = 'block';
      return;
    }
    $empty.style.display = 'none';

    const showBands = state.sortField === 'burn' && state.sortDir === 'asc';
    let currentBand = -1;
    let html = '';

    list.forEach(p => {
      if (showBands) {
        const rank = p.burnRateRank || 9999;
        const bandIdx = BURN_BANDS.findIndex(b => rank <= b.max);
        if (bandIdx !== currentBand && bandIdx !== -1) {
          currentBand = bandIdx;
          const b = BURN_BANDS[bandIdx];
          html += `<tr class="band-header">
            <td colspan="6">
              <span class="band-dot" style="background:${b.color}"></span>
              <span class="band-label">${b.label}</span>
              <span class="band-sub">${b.sub}</span>
            </td>
          </tr>`;
        }
      }
      html += renderRow(p);
    });

    $tbody.innerHTML = html;

    const dataRows = $tbody.querySelectorAll('tr:not(.band-header)');
    dataRows.forEach((row, i) => {
      row.addEventListener('click', () => openDetail(list[i]));
    });
  }

  function openDetail(p) {
    // Highlight row
    $tbody.querySelectorAll('tr').forEach(r => r.classList.remove('active'));
    const list = getFiltered();
    const idx = list.indexOf(p);
    if (idx >= 0) $tbody.querySelectorAll('tr:not(.band-header)')[idx]?.classList.add('active');

    const rank = p.burnRateRank;
    const pct  = rank ? Math.min(100, Math.max(1, rank)) : 0;
    const dotPct = Math.min(98, Math.max(2, pct)); // keep dot visible at edges

    const calibers = (p.recommendedCalibers || [])
      .map(c => `<span class="firearm-tag">${esc(c)}</span>`).join('');

    const useTags = (p.bestUse || [])
      .map(u => `<span class="use-tag-full ${useClass(u)}">${esc(u)}</span>`).join(' ');

    // Similar powders
    let similarHtml = '';
    if (rank) {
      const similar = allPowders
        .filter(q => q.burnRateRank &&
          Math.abs(q.burnRateRank - rank) <= 5 &&
          q.productName !== p.productName)
        .sort((a, b) => Math.abs(a.burnRateRank - rank) - Math.abs(b.burnRateRank - rank))
        .slice(0, 6);
      if (similar.length) {
        similarHtml = `
          <div class="detail-section">
            <div class="detail-section-title">SIMILAR BURN RATE (±5 RANKS)</div>
            <div class="firearms-list">
              ${similar.map(s =>
                `<button class="firearm-tag similar-btn" data-name="${esc(s.productName)}">${esc(s.productName)}<span style="opacity:0.4;font-size:9px;margin-left:5px">${s.burnRateRank}</span></button>`
              ).join('')}
            </div>
          </div>
        `;
      }
    }

    // Full-page link
    const $pageLink = document.getElementById('detail-page-link');
    if ($pageLink) $pageLink.href = '/powder/' + powderToSlug(p.productName);

    $detailInner.innerHTML = `
      <div class="detail-name">${esc(p.productName)}</div>
      <div class="detail-alt">${esc(p.brand)}${p.parentCompany && p.parentCompany !== p.brand ? ' &nbsp;·&nbsp; ' + esc(p.parentCompany) : ''}</div>
      <div class="detail-meta-row">
        <span class="type-badge ${typeBadgeClass(p.powderType)}">${esc(p.powderType) || '—'}</span>
        ${useTags}
        ${p.discontinued ? '<span class="badge-discontinued">DISCONTINUED</span>' : ''}
      </div>
      ${p.description ? `<div class="detail-description">${esc(p.description)}</div>` : ''}

      ${rank ? `<div class="detail-section">
        <div class="detail-section-title">BURN RATE POSITION</div>
        <div class="burn-scale">
          <div class="burn-scale-track">
            <div class="burn-scale-fill" style="width:${pct}%"></div>
            <div class="burn-scale-dot" style="left:${dotPct}%"></div>
          </div>
          <div class="burn-scale-labels">
            <span>FASTEST (1)</span>
            <span class="burn-scale-rank">RANK ${rank} / 100</span>
            <span>SLOWEST (100)</span>
          </div>
        </div>
      </div>` : ''}

      <div class="detail-section">
        <div class="detail-section-title">SPECIFICATIONS</div>
        <div class="spec-grid">
          <div class="spec-item"><div class="spec-label">POWDER TYPE</div><div class="spec-value">${esc(p.powderType) || '—'}</div></div>
          <div class="spec-item"><div class="spec-label">BURN RATE RANK</div><div class="spec-value accent">${rank || '—'}</div></div>
          <div class="spec-item"><div class="spec-label">TEMP SENSITIVITY</div><div class="spec-value">${esc(p.temperatureSensitivity) || '—'}</div></div>
          ${p.meteringGrade ? `<div class="spec-item"><div class="spec-label">METERING GRADE</div><div class="spec-value">${esc(p.meteringGrade)}</div></div>` : ''}
          ${p.muzzleFlashRating ? `<div class="spec-item"><div class="spec-label">MUZZLE FLASH</div><div class="spec-value">${esc(p.muzzleFlashRating)}</div></div>` : ''}
          ${p.countryOfOrigin ? `<div class="spec-item"><div class="spec-label">COUNTRY</div><div class="spec-value">${esc(p.countryOfOrigin)}</div></div>` : ''}
          ${p.propellantBase ? `<div class="spec-item"><div class="spec-label">PROPELLANT BASE</div><div class="spec-value">${esc(p.propellantBase)}</div></div>` : ''}
        </div>
      </div>

      ${calibers ? `<div class="detail-section">
        <div class="detail-section-title">RECOMMENDED CALIBERS</div>
        <div class="firearms-list">${calibers}</div>
      </div>` : ''}

      ${p.manufacturer || p.distributor ? `<div class="detail-section">
        <div class="detail-section-title">SUPPLY CHAIN</div>
        <div class="spec-grid">
          ${p.manufacturer ? `<div class="spec-item"><div class="spec-label">MANUFACTURER</div><div class="spec-value">${esc(p.manufacturer)}</div></div>` : ''}
          ${p.distributor  ? `<div class="spec-item"><div class="spec-label">DISTRIBUTOR</div><div class="spec-value">${esc(p.distributor)}</div></div>` : ''}
        </div>
      </div>` : ''}

      ${similarHtml}
    `;

    $detailInner.querySelectorAll('.similar-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pw = allPowders.find(q => q.productName === btn.dataset.name);
        if (pw) openDetail(pw);
      });
    });

    $detailPanel.classList.add('open');
    $detailBackdrop.classList.add('open');
  }

  function closeDetail() {
    $detailPanel.classList.remove('open');
    $detailBackdrop.classList.remove('open');
    $tbody.querySelectorAll('tr.active').forEach(r => r.classList.remove('active'));
  }

  // ── BRAND FILTER ──────────────────────────────────────────────────────
  function populateBrandFilter(powders) {
    const brands = [...new Set(powders.map(p => p.brand).filter(Boolean))].sort();
    $brandSelect.innerHTML =
      '<option value="all">ALL BRANDS</option>' +
      brands.map(b => `<option value="${esc(b)}">${esc(b)}</option>`).join('');
  }

  // ── SORT HEADERS ──────────────────────────────────────────────────────
  function updateSortHeaders() {
    document.querySelectorAll('th.sortable').forEach(th => {
      th.classList.remove('sort-asc', 'sort-desc');
      if (th.dataset.sort === state.sortField) {
        th.classList.add(state.sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
      }
    });
  }

  // ── FORM MODALS ───────────────────────────────────────────────────────
  function openModal(id)  { document.getElementById(id).style.display = 'flex'; }
  function closeModal(id) { document.getElementById(id).style.display = 'none'; }

  function handleFormSubmit(formId, successId, modalId) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const data = new FormData(form);
      fetch('/', { method: 'POST', body: data })
        .catch(() => {})
        .finally(() => {
          form.style.display = 'none';
          document.getElementById(successId).style.display = 'block';
          setTimeout(() => closeModal(modalId), 2800);
        });
    });
  }

  // ── CALIBER CHIPS & SUGGESTIONS ───────────────────────────────────────
  function renderChips() {
    $chipsBar.innerHTML = state.caliberChips.map(c =>
      `<span class="cal-chip">${esc(c)}<button class="cal-chip-remove" data-cal="${esc(c)}" aria-label="Remove">×</button></span>`
    ).join('');
    $chipsBar.querySelectorAll('.cal-chip-remove').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        state.caliberChips = state.caliberChips.filter(c => c !== btn.dataset.cal);
        renderChips();
        updateClearBtn();
        renderTable();
      });
    });
    updateCaliberHint();
  }

  function updateClearBtn() {
    $searchClear.style.display = (state.search || state.caliberChips.length) ? 'block' : 'none';
  }

  function getSuggestions(q) {
    if (!q || q.length < 2) return [];
    const nq = normCal(q);
    return allCalibers
      .filter(c => !state.caliberChips.includes(c) && normCal(c).includes(nq))
      .slice(0, 8);
  }

  function renderSuggestions() {
    const q = $search.value.trim();
    const list = getSuggestions(q);
    if (!list.length) { $suggestions.classList.remove('open'); return; }
    $suggestions.innerHTML = list.map(c => `<div class="cal-suggestion" data-cal="${esc(c)}">${esc(c)}</div>`).join('');
    $suggestions.querySelectorAll('.cal-suggestion').forEach(el => {
      el.addEventListener('mousedown', e => {
        e.preventDefault(); // prevent input blur
        addCaliberChip(el.dataset.cal);
      });
    });
    $suggestions.classList.add('open');
  }

  function addCaliberChip(cal) {
    if (!state.caliberChips.includes(cal)) {
      state.caliberChips.push(cal);
      renderChips();
      renderTable();
    }
    $search.value = '';
    state.search  = '';
    $suggestions.classList.remove('open');
    updateClearBtn();
  }

  $search.addEventListener('blur', () => {
    setTimeout(() => $suggestions.classList.remove('open'), 150);
  });

  // ── EVENTS ────────────────────────────────────────────────────────────
  $search.addEventListener('input', () => {
    state.search = $search.value.trim();
    updateClearBtn();
    updateCaliberHint();
    renderSuggestions();
    renderTable();
  });

  $searchClear.addEventListener('click', () => {
    $search.value = '';
    state.search  = '';
    state.caliberChips = [];
    renderChips();
    $suggestions.classList.remove('open');
    updateClearBtn();
    renderTable();
  });

  document.querySelectorAll('.chip[data-filter="type"]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip[data-filter="type"]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.filterType = chip.dataset.value;
      renderTable();
    });
  });

  document.querySelectorAll('.chip[data-filter="use"]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip[data-filter="use"]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.filterUse = chip.dataset.value;
      renderTable();
    });
  });

  $brandSelect.addEventListener('change', () => {
    state.filterBrand = $brandSelect.value;
    renderTable();
  });

  document.querySelectorAll('.chip[data-filter="temp"]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip[data-filter="temp"]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.filterTemp = chip.dataset.value;
      renderTable();
    });
  });

  document.querySelectorAll('.chip[data-filter="status"]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip[data-filter="status"]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.filterStatus = chip.dataset.value;
      renderTable();
    });
  });

  document.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      if (state.sortField === th.dataset.sort) {
        state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortField = th.dataset.sort;
        state.sortDir = 'asc';
      }
      updateSortHeaders();
      renderTable();
    });
  });

  $detailBackdrop.addEventListener('click', closeDetail);
  document.getElementById('detail-back').addEventListener('click', closeDetail);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeDetail();
      document.getElementById('help-popover').classList.remove('open');
    }
    if (e.key === '/' && !e.target.closest('input, textarea, select')) {
      e.preventDefault();
      $search.focus();
      $search.select();
    }
  });

  // ── HELP POPOVERS ──────────────────────────────────────────────────────
  const helpContent = {
    burn: {
      title: 'Burn Rate',
      body: 'Ranks powders fastest (1) to slowest (100+) relative to each other.\n\nFaster powders suit pistol and short-barreled loads. Slower powders build pressure over a longer distance, better for rifle loads.\n\nFamiliar landmarks: Hodgdon Titegroup ≈ 5 (fast pistol) · Alliant Power Pistol ≈ 35 · Hodgdon Varget ≈ 65 (medium rifle) · Hodgdon H4350 ≈ 78 · Hodgdon H4831SC ≈ 88 (slow magnum rifle).\n\nUse burn rate to find substitutes within a category. Never substitute based on burn rate alone — always consult a current reloading manual for safe charge weights.'
    },
    temp: {
      title: 'Temperature Sensitivity',
      body: 'How much velocity changes as temperature changes.\n\nLow: Minimal shift between cold and hot conditions. Best for hunting, long-range precision, or any situation where temperatures vary.\n\nModerate: Some variation at extremes — acceptable for most range use.\n\nHigh: Noticeable velocity change between cold and hot. Loads developed in summer may produce different results in winter.'
    }
  };

  const $helpPopover = document.getElementById('help-popover');

  document.querySelectorAll('.col-help').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const key = btn.dataset.help;
      const content = helpContent[key];
      if (!content) return;

      if ($helpPopover.classList.contains('open') && $helpPopover.dataset.active === key) {
        $helpPopover.classList.remove('open');
        return;
      }

      $helpPopover.querySelector('.help-popover-title').textContent = content.title;
      $helpPopover.querySelector('.help-popover-body').textContent  = content.body;
      $helpPopover.dataset.active = key;
      $helpPopover.classList.add('open');

      const rect = btn.getBoundingClientRect();
      const popW = 300;
      let left = rect.left;
      if (left + popW > window.innerWidth - 16) left = window.innerWidth - popW - 16;
      $helpPopover.style.left = left + 'px';
      $helpPopover.style.top  = (rect.bottom + 8) + 'px';
    });
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.col-help') && !e.target.closest('#help-popover')) {
      $helpPopover.classList.remove('open');
    }
  });

  document.getElementById('suggest-btn').addEventListener('click', () => openModal('suggest-modal'));
  document.getElementById('report-btn').addEventListener('click',  () => openModal('report-modal'));

  document.querySelectorAll('.form-modal-close, .form-cancel').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.modal));
  });
  document.getElementById('suggest-modal').addEventListener('click', e => {
    if (e.target.id === 'suggest-modal') closeModal('suggest-modal');
  });
  document.getElementById('report-modal').addEventListener('click', e => {
    if (e.target.id === 'report-modal') closeModal('report-modal');
  });

  handleFormSubmit('suggest-form', 'suggest-success', 'suggest-modal');
  handleFormSubmit('report-form',  'report-success',  'report-modal');

  document.getElementById('powder-email-form').addEventListener('submit', e => {
    e.preventDefault();
    const btn = e.currentTarget.querySelector('.btn-primary');
    btn.textContent = "You're on the list!";
    btn.style.background = '#2ecc71';
    btn.disabled = true;
  });

  window.addEventListener('scroll', () => {
    document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 20);
  });

  // ── STICKY THEAD OFFSET ───────────────────────────────────────────────
  function setTheadTop() {
    const fb = document.getElementById('filter-bar');
    if (!fb) return;
    document.documentElement.style.setProperty('--thead-top', (60 + fb.offsetHeight) + 'px');
  }
  requestAnimationFrame(() => requestAnimationFrame(setTheadTop));
  window.addEventListener('resize', () => requestAnimationFrame(setTheadTop));

  // ── INIT ──────────────────────────────────────────────────────────────
  async function init() {
    try {
      const rows = await supabaseFetchAll('powder_brands');
      allPowders = transformPowders(rows);

      document.getElementById('powder-count-sub').textContent   = allPowders.length;
      document.getElementById('powder-count-intro').textContent = allPowders.length;

      const calSet = new Set();
      allPowders.forEach(p => (p.recommendedCalibers || []).forEach(c => calSet.add(c)));
      allCalibers = Array.from(calSet).sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));

      populateBrandFilter(allPowders);
      updateSortHeaders();
      renderTable();
      updateCaliberHint();

      $loading.style.display   = 'none';
      $tableWrap.style.display = 'block';
      requestAnimationFrame(() => requestAnimationFrame(setTheadTop));
    } catch (err) {
      console.error('Failed to load powder data:', err);
      $loading.textContent = 'Failed to load data. Please refresh the page.';
    }
  }

  init();

})();
