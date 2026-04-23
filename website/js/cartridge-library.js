// Caliber Database — Lindcott Armory Field Guide
// Depends on: data/calibers-data.js (CARTRIDGES global)

(function () {
  'use strict';

  // ── STATE ────────────────────────────────────────────────────────────
  let state = {
    search: '',
    filterType: 'all',
    filterStatus: 'all',
    sortField: 'name',
    sortDir: 'asc',
    selected: null,
    compareMode: false,
    compareIds: new Set(),
  };

  // ── ELEMENTS ─────────────────────────────────────────────────────────
  const $search        = document.getElementById('search');
  const $searchClear   = document.getElementById('search-clear');
  const $tbody         = document.getElementById('caliber-tbody');
  const $count         = document.getElementById('result-count');
  const $empty         = document.getElementById('table-empty');
  const $detailInner    = document.getElementById('detail-inner');
  const $detailPanel    = document.getElementById('detail-panel');
  const $detailBackdrop = document.getElementById('detail-backdrop');
  const $compareBtn    = document.getElementById('compare-btn');
  const $compareBanner = document.getElementById('compare-banner');
  const $compareCount  = document.getElementById('compare-count');
  const $compareGo     = document.getElementById('compare-go');
  const $compareCancel = document.getElementById('compare-cancel');
  const $compareModal  = document.getElementById('compare-modal');
  const $compareTable  = document.getElementById('compare-table');
  const $compareClose  = document.getElementById('compare-close');

  // ── FILTER & SORT ────────────────────────────────────────────────────
  function getFiltered() {
    let list = CARTRIDGES.filter(c => {
      if (state.search) {
        const q = state.search.toLowerCase();
        const match =
          c.name.toLowerCase().includes(q) ||
          (c.alternateNames || []).some(n => n.toLowerCase().includes(q)) ||
          (c.countryOfOrigin || '').toLowerCase().includes(q) ||
          (c.description || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      if (state.filterType !== 'all' && c.type !== state.filterType) return false;
      if (state.filterStatus !== 'all' && c.productionStatus !== state.filterStatus) return false;
      return true;
    });

    list.sort((a, b) => {
      let av, bv;
      switch (state.sortField) {
        case 'name':      av = a.name.toLowerCase(); bv = b.name.toLowerCase(); break;
        case 'year':      av = a.yearIntroduced || 0; bv = b.yearIntroduced || 0; break;
        case 'type':      av = a.type.toLowerCase(); bv = b.type.toLowerCase(); break;
        case 'bulletDia': av = a.bulletDiameterInch || 0; bv = b.bulletDiameterInch || 0; break;
        case 'velocity':  av = (a.velocityRangeFPS ? (a.velocityRangeFPS.min + a.velocityRangeFPS.max) / 2 : 0);
                          bv = (b.velocityRangeFPS ? (b.velocityRangeFPS.min + b.velocityRangeFPS.max) / 2 : 0); break;
        case 'energy':    av = (a.energyRangeFTLBS ? (a.energyRangeFTLBS.min + a.energyRangeFTLBS.max) / 2 : 0);
                          bv = (b.energyRangeFTLBS ? (b.energyRangeFTLBS.min + b.energyRangeFTLBS.max) / 2 : 0); break;
        default: av = a.name.toLowerCase(); bv = b.name.toLowerCase();
      }
      if (av < bv) return state.sortDir === 'asc' ? -1 : 1;
      if (av > bv) return state.sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }

  // ── RENDER TABLE ─────────────────────────────────────────────────────
  function renderTable() {
    const list = getFiltered();
    $count.textContent = list.length + ' cartridge' + (list.length !== 1 ? 's' : '');
    $empty.style.display = list.length === 0 ? 'block' : 'none';

    const html = list.map(c => {
      const isActive    = state.selected && state.selected.name === c.name;
      const isSelected  = state.compareIds.has(c.name);
      const hasMilitary = c.militaryAdoption && c.militaryAdoption.length > 0;
      const availClass  = 'avail-' + (c.availability || 'common').toLowerCase();
      const altNames    = (c.alternateNames || []).slice(0, 2).join(' · ');
      const grains      = fmtGrains(c.commonBulletWeights);

      const checkboxHtml = state.compareMode
        ? `<span class="compare-checkbox${isSelected ? ' checked' : ''}"></span>`
        : '';

      return `<tr data-name="${esc(c.name)}" class="${isActive ? 'active' : ''}${isSelected ? ' compare-selected' : ''}">
        <td class="col-name td-name">
          ${checkboxHtml}${esc(c.name)}
          ${altNames ? `<span class="td-alt">${esc(altNames)}</span>` : ''}
        </td>
        <td class="col-type td-type">${esc(c.type.toUpperCase())}</td>
        <td class="col-year td-number">${c.yearIntroduced || '—'}</td>
        <td class="col-dia td-number">${c.bulletDiameterInch ? c.bulletDiameterInch.toFixed(3) + '"' : '—'}</td>
        <td class="col-grains td-grains">${grains}</td>
        <td class="col-vel td-vel">${c.velocityRangeFPS ? fmtRange(c.velocityRangeFPS) + ' fps' : '—'}</td>
        <td class="col-energy td-energy">${c.energyRangeFTLBS ? fmtRange(c.energyRangeFTLBS) + ' ft·lb' : '—'}</td>
        <td class="col-military">${hasMilitary ? '<span class="badge-military">YES</span>' : ''}</td>
        <td class="col-avail"><span class="badge-avail ${availClass}">${(c.availability || '').toUpperCase()}</span></td>
      </tr>`;
    }).join('');

    $tbody.innerHTML = html;
    updateSortHeaders();
  }

  function fmtRange(r) {
    if (!r) return '—';
    if (r.min === r.max) return r.min.toLocaleString();
    return r.min.toLocaleString() + '–' + r.max.toLocaleString();
  }

  function fmtGrains(weights) {
    if (!weights || !weights.length) return '—';
    const display = weights.slice(0, 4);
    const suffix  = weights.length > 4 ? '…' : ' gr';
    return display.join(', ') + suffix;
  }

  function esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── SORT HEADERS ─────────────────────────────────────────────────────
  function updateSortHeaders() {
    document.querySelectorAll('.caliber-table th.sortable').forEach(th => {
      const field = th.dataset.sort;
      th.classList.remove('sort-asc', 'sort-desc');
      if (field === state.sortField) {
        th.classList.add(state.sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
        const arrow = th.querySelector('.sort-arrow');
        if (arrow) arrow.textContent = '';
      } else {
        const arrow = th.querySelector('.sort-arrow');
        if (arrow) arrow.textContent = '↕';
      }
    });
  }

  // ── DETAIL OVERLAY ────────────────────────────────────────────────────
  function openDetail(c) {
    state.selected = c;
    renderTable(); // update active row highlight

    const hasMil = c.militaryAdoption && c.militaryAdoption.length > 0;

    let leftHtml = `
      <div class="detail-name">${esc(c.name)}</div>
      ${c.alternateNames && c.alternateNames.length ? `<div class="detail-alt">${c.alternateNames.join(' · ')}</div>` : ''}
      <div class="detail-meta-row">
        <span class="badge-avail avail-${(c.availability||'common').toLowerCase()}">${(c.availability||'').toUpperCase()}</span>
        <span class="badge-avail avail-common" style="background:rgba(255,255,255,0.04);border-color:rgba(255,255,255,0.1);color:var(--muted)">${esc(c.type.toUpperCase())}</span>
        ${hasMil ? '<span class="badge-military">MILITARY USE</span>' : ''}
        ${c.productionStatus === 'Obsolete' ? '<span class="badge-avail avail-scarce">OBSOLETE</span>' : ''}
      </div>
      ${c.description ? `<div class="detail-description">${esc(c.description)}</div>` : ''}
      <div class="detail-section">
        <div class="detail-section-title">Ballistics &amp; Specs</div>
        <div class="spec-grid">
          ${c.bulletDiameterInch ? `<div class="spec-item"><div class="spec-label">BULLET DIA</div><div class="spec-value accent">${c.bulletDiameterInch.toFixed(3)}" / ${c.bulletDiameterMM}mm</div></div>` : ''}
          ${c.yearIntroduced ? `<div class="spec-item"><div class="spec-label">INTRODUCED</div><div class="spec-value">${c.yearIntroduced}</div></div>` : ''}
          ${c.velocityRangeFPS ? `<div class="spec-item"><div class="spec-label">VELOCITY</div><div class="spec-value">${fmtRange(c.velocityRangeFPS)} fps</div></div>` : ''}
          ${c.energyRangeFTLBS ? `<div class="spec-item"><div class="spec-label">ENERGY</div><div class="spec-value">${fmtRange(c.energyRangeFTLBS)} ft·lb</div></div>` : ''}
          ${c.maxPressurePSI ? `<div class="spec-item"><div class="spec-label">MAX PRESSURE</div><div class="spec-value">${c.maxPressurePSI.toLocaleString()} PSI</div></div>` : ''}
          ${c.effectiveRangeYards ? `<div class="spec-item"><div class="spec-label">EFFECTIVE RANGE</div><div class="spec-value">${c.effectiveRangeYards.toLocaleString()} yd</div></div>` : ''}
          ${c.caseLengthInch ? `<div class="spec-item"><div class="spec-label">CASE LENGTH</div><div class="spec-value">${c.caseLengthInch.toFixed(3)}"</div></div>` : ''}
          ${c.typicalTwistRate ? `<div class="spec-item"><div class="spec-label">TWIST RATE</div><div class="spec-value">${esc(c.typicalTwistRate)}</div></div>` : ''}
          ${c.commonBulletWeights && c.commonBulletWeights.length ? `<div class="spec-item"><div class="spec-label">GRAIN WEIGHTS</div><div class="spec-value">${c.commonBulletWeights.join(', ')} gr</div></div>` : ''}
          ${c.rimType ? `<div class="spec-item"><div class="spec-label">RIM TYPE</div><div class="spec-value">${esc(c.rimType)}</div></div>` : ''}
          ${c.primerType ? `<div class="spec-item"><div class="spec-label">PRIMER</div><div class="spec-value">${esc(c.primerType)}</div></div>` : ''}
          ${c.countryOfOrigin ? `<div class="spec-item"><div class="spec-label">ORIGIN</div><div class="spec-value">${esc(c.countryOfOrigin)}</div></div>` : ''}
        </div>
      </div>
    `;

    let rightHtml = '';

    if (c.history) {
      rightHtml += `
        <div class="detail-section">
          <div class="detail-section-title">History</div>
          <div class="detail-history">${esc(c.history)}</div>
        </div>
      `;
    }

    if (hasMil) {
      rightHtml += `
        <div class="detail-section">
          <div class="detail-section-title">Military Adoption</div>
          <div class="mil-timeline">
            ${c.militaryAdoption.map(m => `
              <div class="mil-item">
                <div class="mil-country">${esc(m.country)}</div>
                <div class="mil-years">${esc(m.years)}</div>
                ${m.conflicts && m.conflicts.length ? `<div class="mil-conflicts">${m.conflicts.join(' · ')}</div>` : ''}
              </div>
            `).join('')}
          </div>
          ${c.currentMilitaryUse && c.currentMilitaryUse.length ? `
            <div style="margin-top:8px;font-family:var(--mono);font-size:10px;color:var(--muted);">
              Current: ${c.currentMilitaryUse.join(', ')}
            </div>
          ` : ''}
        </div>
      `;
    }

    if (c.notableFirearms && c.notableFirearms.length) {
      rightHtml += `
        <div class="detail-section">
          <div class="detail-section-title">Notable Firearms</div>
          <div class="firearms-list">
            ${c.notableFirearms.map(f => `<span class="firearm-tag">${esc(f)}</span>`).join('')}
          </div>
        </div>
      `;
    }

    if (c.primaryUse && c.primaryUse.length) {
      rightHtml += `
        <div class="detail-section">
          <div class="detail-section-title">Primary Use</div>
          <div class="firearms-list">
            ${c.primaryUse.map(u => `<span class="firearm-tag">${esc(u)}</span>`).join('')}
          </div>
        </div>
      `;
    }

    if (c.trivia) {
      rightHtml += `
        <div class="detail-section">
          <div class="detail-section-title">Field Notes</div>
          <div class="detail-trivia">${esc(c.trivia)}</div>
        </div>
      `;
    }

    $detailInner.innerHTML = leftHtml + rightHtml;

    $detailPanel.classList.add('open');
    $detailBackdrop.classList.add('open');
    $detailPanel.scrollTop = 0;
  }

  function closeDetail() {
    state.selected = null;
    $detailPanel.classList.remove('open');
    $detailBackdrop.classList.remove('open');
    renderTable();
  }

  // ── COMPARISON TABLE ─────────────────────────────────────────────────
  function renderComparison() {
    const cartridges = Array.from(state.compareIds)
      .map(name => CARTRIDGES.find(c => c.name === name))
      .filter(Boolean);

    if (cartridges.length < 2) return;

    const rows = [
      ['Type',           c => c.type],
      ['Year',           c => c.yearIntroduced || '—'],
      ['Country',        c => c.countryOfOrigin || '—'],
      ['Bullet Diameter',c => c.bulletDiameterInch ? c.bulletDiameterInch.toFixed(3) + '" / ' + c.bulletDiameterMM + 'mm' : '—'],
      ['Case Length',    c => c.caseLengthInch ? c.caseLengthInch.toFixed(3) + '"' : '—'],
      ['Grain Weights',  c => (c.commonBulletWeights || []).join(', ') + (c.commonBulletWeights && c.commonBulletWeights.length ? ' gr' : '') || '—'],
      ['Velocity',       c => c.velocityRangeFPS ? fmtRange(c.velocityRangeFPS) + ' fps' : '—'],
      ['Energy',         c => c.energyRangeFTLBS ? fmtRange(c.energyRangeFTLBS) + ' ft·lb' : '—'],
      ['Max Pressure',   c => c.maxPressurePSI ? c.maxPressurePSI.toLocaleString() + ' PSI' : '—'],
      ['Effective Range',c => c.effectiveRangeYards ? c.effectiveRangeYards.toLocaleString() + ' yd' : '—'],
      ['Twist Rate',     c => c.typicalTwistRate || '—'],
      ['Rim Type',       c => c.rimType || '—'],
      ['Primer',         c => c.primerType || '—'],
      ['Availability',   c => c.availability || '—'],
      ['Military Use',   c => (c.militaryAdoption && c.militaryAdoption.length) ? c.militaryAdoption.map(m => m.country + ' (' + m.years + ')').join(', ') : 'None'],
      ['Primary Use',    c => (c.primaryUse || []).join(', ') || '—'],
    ];

    const headerRow = '<tr><th></th>' + cartridges.map(c =>
      `<th>${esc(c.name)}<br><span style="font-size:9px;font-weight:400;color:var(--muted)">${(c.alternateNames||[]).slice(0,1).join('')}</span></th>`
    ).join('') + '</tr>';

    const bodyRows = rows.map(([label, fn]) =>
      '<tr><td>' + label + '</td>' + cartridges.map(c => '<td>' + esc(String(fn(c))) + '</td>').join('') + '</tr>'
    ).join('');

    $compareTable.innerHTML = '<thead>' + headerRow + '</thead><tbody>' + bodyRows + '</tbody>';
    $compareModal.style.display = 'flex';
  }

  // ── FORM MODALS ───────────────────────────────────────────────────────
  function openModal(id) {
    document.getElementById(id).style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeModal(id) {
    document.getElementById(id).style.display = 'none';
    document.body.style.overflow = '';
  }

  function populateCartridgeSelect() {
    const sel = document.getElementById('report-cartridge');
    if (sel.options.length > 1) return; // already populated
    const sorted = [...CARTRIDGES].sort((a, b) => a.name.localeCompare(b.name));
    sorted.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.name;
      opt.textContent = c.name;
      sel.appendChild(opt);
    });
  }

  function handleFormSubmit(formId, successId, modalId) {
    const form = document.getElementById(formId);
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const data = new URLSearchParams(new FormData(form));
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: data.toString() })
        .catch(() => {}); // graceful fail if not on Netlify
      form.style.display = 'none';
      document.getElementById(successId).style.display = 'block';
      // Reset form for next use after short delay
      setTimeout(() => {
        form.reset();
        form.style.display = 'block';
        document.getElementById(successId).style.display = 'none';
        closeModal(modalId);
      }, 2800);
    });
  }

  // ── EVENTS ───────────────────────────────────────────────────────────
  // Search
  $search.addEventListener('input', () => {
    state.search = $search.value;
    $searchClear.style.display = state.search ? 'block' : 'none';
    renderTable();
  });

  $searchClear.addEventListener('click', () => {
    $search.value = '';
    state.search = '';
    $searchClear.style.display = 'none';
    renderTable();
    $search.focus();
  });

  // Type / status chips
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const filter = chip.dataset.filter;
      const value  = chip.dataset.value;
      document.querySelectorAll(`.chip[data-filter="${filter}"]`).forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      if (filter === 'type')   state.filterType   = value;
      if (filter === 'status') state.filterStatus = value;
      renderTable();
    });
  });

  // Sort headers
  document.querySelectorAll('.caliber-table th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const field = th.dataset.sort;
      if (state.sortField === field) {
        state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortField = field;
        state.sortDir = 'asc';
      }
      renderTable();
    });
  });

  // Row clicks
  $tbody.addEventListener('click', e => {
    const row = e.target.closest('tr[data-name]');
    if (!row) return;
    const name = row.dataset.name;
    const cartridge = CARTRIDGES.find(c => c.name === name);
    if (!cartridge) return;

    if (state.compareMode) {
      if (state.compareIds.has(name)) {
        state.compareIds.delete(name);
      } else if (state.compareIds.size < 4) {
        state.compareIds.add(name);
      }
      $compareCount.textContent = state.compareIds.size + ' selected';
      $compareGo.disabled = state.compareIds.size < 2;
      renderTable();
      return;
    }

    openDetail(cartridge);
  });

  // Detail back button + backdrop click
  document.getElementById('detail-close-btn').addEventListener('click', closeDetail);
  $detailBackdrop.addEventListener('click', closeDetail);

  // Escape key closes detail
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if ($detailPanel.classList.contains('open')) closeDetail();
      if ($compareModal.style.display === 'flex') $compareModal.style.display = 'none';
      const suggestModal = document.getElementById('suggest-modal');
      const reportModal  = document.getElementById('report-modal');
      if (suggestModal.style.display === 'flex') closeModal('suggest-modal');
      if (reportModal.style.display  === 'flex') closeModal('report-modal');
      document.getElementById('help-popover').classList.remove('open');
    }
  });

  // Compare mode
  $compareBtn.addEventListener('click', () => {
    state.compareMode = !state.compareMode;
    state.compareIds.clear();
    $compareBtn.classList.toggle('active', state.compareMode);
    $compareBanner.style.display = state.compareMode ? 'block' : 'none';
    $compareCount.textContent = '0 selected';
    $compareGo.disabled = true;
    renderTable();
  });

  $compareCancel.addEventListener('click', () => {
    state.compareMode = false;
    state.compareIds.clear();
    $compareBtn.classList.remove('active');
    $compareBanner.style.display = 'none';
    renderTable();
  });

  $compareGo.addEventListener('click', renderComparison);
  $compareClose.addEventListener('click', () => { $compareModal.style.display = 'none'; });
  $compareModal.addEventListener('click', e => {
    if (e.target === $compareModal) $compareModal.style.display = 'none';
  });

  // Suggest / Report buttons
  document.getElementById('suggest-btn').addEventListener('click', () => openModal('suggest-modal'));
  document.getElementById('report-btn').addEventListener('click', () => {
    populateCartridgeSelect();
    openModal('report-modal');
  });

  // Modal close buttons
  document.querySelectorAll('.form-modal-close, .form-cancel').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.modal));
  });

  // Close modal on backdrop click
  document.getElementById('suggest-modal').addEventListener('click', e => {
    if (e.target.id === 'suggest-modal') closeModal('suggest-modal');
  });
  document.getElementById('report-modal').addEventListener('click', e => {
    if (e.target.id === 'report-modal') closeModal('report-modal');
  });

  // Form submissions
  handleFormSubmit('suggest-form', 'suggest-success', 'suggest-modal');
  handleFormSubmit('report-form', 'report-success', 'report-modal');

  // Email form
  document.getElementById('calibers-email-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const btn = e.currentTarget.querySelector('.btn-primary');
    btn.textContent = "You're on the list!";
    btn.style.background = '#2ecc71';
    btn.disabled = true;
  });

  // Nav scroll
  window.addEventListener('scroll', () => {
    document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 20);
  });

  // ── HELP POPOVERS ────────────────────────────────────────────────────
  const helpContent = {
    military: {
      title: 'Military Adoption',
      body: 'YES means this cartridge has documented military service by at least one national armed force.\n\nMilitary adoption generally indicates the cartridge met rigorous reliability, accuracy, and logistics standards. It does not mean the cartridge is obsolete or only for military use — many military cartridges (5.56×45mm, 9mm, .308 Win) are the most common civilian and competition rounds in use today.\n\nClick a row to see the full adoption timeline — which countries adopted it, for how long, and in which conflicts.'
    },
    availability: {
      title: 'Availability',
      body: 'How easy the cartridge is to find at retail today.\n\nABUNDANT — Available everywhere, year-round. Common calibers like 9mm, .223, .308.\n\nCOMMON — Widely stocked at most retailers, minor regional or seasonal variation.\n\nLIMITED — Found at specialty retailers or online; may have supply gaps. Includes newer or niche calibers.\n\nSCARCE — Difficult to source; may require special orders. Often obsolete or highly specialized cartridges.\n\nAvailability reflects peacetime retail conditions and can shift significantly during market disruptions.'
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

  // ── STICKY THEAD OFFSET ───────────────────────────────────────────────
  function setTheadTop() {
    const fb = document.getElementById('filter-bar');
    if (!fb) return;
    document.documentElement.style.setProperty('--thead-top', (60 + fb.offsetHeight) + 'px');
  }
  requestAnimationFrame(() => requestAnimationFrame(setTheadTop));
  window.addEventListener('resize', () => requestAnimationFrame(setTheadTop));

  // ── INIT ─────────────────────────────────────────────────────────────
  const totalCount = CARTRIDGES.length;
  document.getElementById('cartridge-count-sub').textContent = totalCount;
  document.getElementById('cartridge-count-intro').textContent = totalCount;
  renderTable();

})();
