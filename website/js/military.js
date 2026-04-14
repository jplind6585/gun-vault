// Military Firearms Timeline — Lindcott Armory Field Guide
// Depends on: data/military-timeline-data.js (SERVICE_WEAPONS global)
// Views: Country Swimlanes · Year Snapshot · Browse All

(function () {
  'use strict';

  const DATA = [...SERVICE_WEAPONS].sort((a, b) => a.yearStart - b.yearStart);

  const ROLE_COLORS = {
    'Service Rifle':   '#74c0fc',
    'Service Pistol':  '#51cf66',
    'Machine Gun':     '#f783ac',
    'LMG / SAW':       '#ffa94d',
    'Submachine Gun':  '#ff8787',
    'Sniper Rifle':    '#cc5de8',
    'Anti-Materiel':   '#e8d44d',
  };

  const YEAR_MIN = 1860;
  const YEAR_MAX = 2024;
  const YEAR_SPAN = YEAR_MAX - YEAR_MIN; // 164
  const ONGOING_FADE_START = 0.75; // gradient starts fading at 75% of bar width

  // Featured countries for swimlanes & snapshot
  const FEATURED_COUNTRIES = [
    { label: 'United States',          match: ['United States'] },
    { label: 'United Kingdom',         match: ['United Kingdom', 'Britain', 'UK'] },
    { label: 'Germany',                match: ['Germany', 'West Germany', 'Nazi Germany', 'German Empire'] },
    { label: 'Soviet Union / Russia',  match: ['Soviet Union', 'Russia', 'USSR'] },
    { label: 'France',                 match: ['France'] },
    { label: 'Japan',                  match: ['Japan'] },
    { label: 'China',                  match: ['China'] },
  ];

  // ── STATE ─────────────────────────────────────────────────────────────
  let state = {
    view: 'swimlanes',
    snapYear: 1914,
    browseSearch: '',
    browseRole: 'all',
    selected: null,
  };

  // ── ELEMENTS ──────────────────────────────────────────────────────────
  const $detail   = document.getElementById('detail-panel');
  const $detailIn = document.getElementById('detail-inner');
  const $backdrop = document.getElementById('detail-backdrop');

  // ── VIEW SWITCHING ────────────────────────────────────────────────────
  function switchView(view) {
    state.view = view;
    document.querySelectorAll('.view-tab').forEach(t =>
      t.classList.toggle('active', t.dataset.view === view)
    );
    document.querySelectorAll('.view-panel').forEach(p => p.style.display = 'none');
    document.getElementById('view-' + view).style.display = '';

    if (view === 'swimlanes') renderSwimlanes();
    else if (view === 'snapshot') renderSnapshot(state.snapYear);
    else if (view === 'browse') renderBrowse();
  }

  document.querySelectorAll('.view-tab').forEach(tab => {
    tab.addEventListener('click', () => switchView(tab.dataset.view));
  });

  document.getElementById('sl-browse-cta').addEventListener('click', () => switchView('browse'));
  document.getElementById('snap-browse-cta').addEventListener('click', () => switchView('browse'));

  // ══════════════════════════════════════════════
  // VIEW 1: COUNTRY SWIMLANES
  // ══════════════════════════════════════════════

  function countryWeapons(country) {
    return DATA.filter(w =>
      (w.countries || []).some(c =>
        country.match.some(m => c.toLowerCase().includes(m.toLowerCase()))
      )
    );
  }

  function renderRuler() {
    let html = '';
    for (let y = YEAR_MIN; y <= YEAR_MAX; y += 10) {
      const left = ((y - YEAR_MIN) / YEAR_SPAN * 100).toFixed(2);
      html += `<span class="sl-tick" style="left:${left}%">${y}</span>`;
    }
    document.getElementById('sl-ruler-ticks').innerHTML = html;
  }

  function renderSwimlanes() {
    const $body = document.getElementById('sl-body');

    // Group by role, each group sorted chronologically, then output in ROLE_ORDER
    const ROLE_ORDER = ['Service Rifle','Service Pistol','Machine Gun','LMG / SAW','Submachine Gun','Sniper Rifle','Anti-Materiel'];
    const groups = {};
    DATA.forEach(w => {
      if (!groups[w.role]) groups[w.role] = [];
      groups[w.role].push(w);
    });
    ROLE_ORDER.forEach(r => { if (groups[r]) groups[r].sort((a, b) => a.yearStart - b.yearStart); });

    // Flatten into ordered weapon list
    const sorted = ROLE_ORDER.flatMap(r => groups[r] || []);

    let html = '';
    let currentRole = null;

    sorted.forEach(w => {
      const color = ROLE_COLORS[w.role] || '#888';
      const isOngoing = !w.yearEnd;
      const endY = w.yearEnd || YEAR_MAX;
      const isSelected = state.selected && state.selected.id === w.id;

      // Role divider when group changes
      if (w.role !== currentRole) {
        currentRole = w.role;
        html += `<div class="sl-role-header">
          <div class="sl-role-spacer"></div>
          <div class="sl-role-divider">
            <span class="sl-role-label" style="color:${color}">${esc(w.role.toUpperCase())}</span>
            <span class="sl-role-line" style="border-color:${color}33"></span>
          </div>
        </div>`;
      }

      const left = Math.max(0, ((w.yearStart - YEAR_MIN) / YEAR_SPAN * 100)).toFixed(3);
      // Ongoing weapons: cap at ~95% of chart width, fade via gradient
      const rawWidth = ((endY - w.yearStart) / YEAR_SPAN * 100);
      const maxWidth = 95 - parseFloat(left);
      const width = isOngoing
        ? Math.min(rawWidth, maxWidth).toFixed(3)
        : Math.max(rawWidth, 0.5).toFixed(3);

      // Ongoing bars get a gradient fade to transparent
      const bg = isOngoing
        ? `linear-gradient(to right, ${color} 0%, ${color} ${Math.round(ONGOING_FADE_START * 100)}%, transparent 100%)`
        : color;

      html += `<div class="sl-row${isSelected ? ' sl-row-active' : ''}" data-id="${esc(w.id)}">
        <div class="sl-row-label">
          <span class="sl-row-name">${esc(w.name)}</span>
          <span class="sl-row-years">${w.yearStart}–${w.yearEnd || 'present'}</span>
        </div>
        <div class="sl-row-bars">
          <div class="sl-bar${isOngoing ? ' sl-bar-ongoing' : ''}${isSelected ? ' sl-bar-selected' : ''}"
            data-id="${esc(w.id)}"
            style="left:${left}%;width:${width}%;background:${bg}"
            title="${esc(w.name)} · ${w.yearStart}–${w.yearEnd || 'present'}">
          </div>
        </div>
      </div>`;
    });

    $body.innerHTML = html;
  }

  document.getElementById('sl-body').addEventListener('click', e => {
    const bar = e.target.closest('.sl-row[data-id]');
    if (!bar) return;
    const item = DATA.find(d => d.id === bar.dataset.id);
    if (item) openDetail(item);
  });

  // ══════════════════════════════════════════════
  // VIEW 2: YEAR SNAPSHOT
  // ══════════════════════════════════════════════

  const $slider      = document.getElementById('snap-slider');
  const $yearDisplay = document.getElementById('snap-year-display');
  const $snapGrid    = document.getElementById('snap-grid');

  const ROLE_ORDER = ['Service Rifle','Service Pistol','Machine Gun','LMG / SAW','Submachine Gun','Sniper Rifle','Anti-Materiel'];

  function renderSnapshot(year) {
    $yearDisplay.textContent = year;

    // Update active jump button
    document.querySelectorAll('.snap-jump').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.year) === year);
    });

    let html = '';
    FEATURED_COUNTRIES.forEach(country => {
      const active = countryWeapons(country).filter(w => {
        const end = w.yearEnd || YEAR_MAX;
        return w.yearStart <= year && end >= year;
      });

      active.sort((a, b) => {
        const ai = ROLE_ORDER.indexOf(a.role);
        const bi = ROLE_ORDER.indexOf(b.role);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      });

      html += `<div class="snap-card">
        <div class="snap-card-country">${esc(country.label)}</div>`;

      if (active.length === 0) {
        html += `<div class="snap-empty">No data for ${year}</div>`;
      } else {
        active.forEach(w => {
          const color = ROLE_COLORS[w.role] || '#888';
          html += `<div class="snap-weapon" data-id="${esc(w.id)}">
            <div class="snap-weapon-dot" style="background:${color}"></div>
            <div>
              <div class="snap-weapon-name">${esc(w.name)}</div>
              <div class="snap-weapon-role" style="color:${color}">${esc(w.role)}</div>
            </div>
          </div>`;
        });
      }

      html += '</div>';
    });

    $snapGrid.innerHTML = html;
  }

  $slider.addEventListener('input', () => {
    state.snapYear = parseInt($slider.value);
    renderSnapshot(state.snapYear);
  });

  document.querySelectorAll('.snap-jump').forEach(btn => {
    btn.addEventListener('click', () => {
      const year = parseInt(btn.dataset.year);
      state.snapYear = year;
      $slider.value = year;
      renderSnapshot(year);
    });
  });

  $snapGrid.addEventListener('click', e => {
    const card = e.target.closest('.snap-weapon[data-id]');
    if (!card) return;
    const item = DATA.find(d => d.id === card.dataset.id);
    if (item) openDetail(item);
  });

  // ══════════════════════════════════════════════
  // VIEW 3: BROWSE ALL
  // ══════════════════════════════════════════════

  function getBrowseFiltered() {
    return DATA.filter(d => {
      if (state.browseRole !== 'all' && d.role !== state.browseRole) return false;
      if (state.browseSearch) {
        const q = state.browseSearch.toLowerCase();
        if (!d.name.toLowerCase().includes(q) &&
            !(d.countries || []).join(' ').toLowerCase().includes(q) &&
            !(d.caliber || '').toLowerCase().includes(q) &&
            !(d.role || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }

  function renderBrowse() {
    const list = getBrowseFiltered();
    document.getElementById('browse-count').textContent =
      list.length + ' weapon' + (list.length === 1 ? '' : 's');

    const $wrap  = document.getElementById('browse-wrap');
    const $empty = document.getElementById('browse-empty');
    $empty.style.display = list.length === 0 ? 'block' : 'none';
    if (list.length === 0) { $wrap.innerHTML = ''; return; }

    const groups = {};
    list.forEach(d => {
      if (!groups[d.role]) groups[d.role] = [];
      groups[d.role].push(d);
    });

    const roles = state.browseRole !== 'all'
      ? [state.browseRole]
      : ROLE_ORDER.filter(r => groups[r]);

    let html = '';
    roles.forEach(role => {
      if (!groups[role]) return;
      const color = ROLE_COLORS[role] || '#888';

      if (state.browseRole === 'all') {
        html += `<div class="tl-era">
          <span class="tl-era-label" style="color:${color}">${esc(role.toUpperCase())}</span>
          <span class="tl-era-line"></span>
        </div>`;
      }

      groups[role].forEach(d => {
        const isActive = state.selected && state.selected.id === d.id;
        const serviceStr = d.yearEnd ? `${d.yearStart}–${d.yearEnd}` : `${d.yearStart}–Present`;
        const countries = (d.countries || []).slice(0, 3).join(', ') +
          (d.countries && d.countries.length > 3 ? ' +' + (d.countries.length - 3) : '');

        html += `<div class="tl-entry${isActive ? ' active' : ''}" data-id="${esc(d.id)}">
          <div class="tl-year-col"><span class="tl-year">${d.yearStart}</span></div>
          <div class="tl-dot-col">
            <div class="tl-dot" style="background:${color};border-color:var(--bg)"></div>
          </div>
          <div class="tl-card">
            <div class="tl-cat-badge" style="background:${color}22;color:${color};border:0.5px solid ${color}44">${esc(d.role)}</div>
            <div class="tl-name">${esc(d.name)}</div>
            <div class="tl-meta">${esc(serviceStr)} · ${esc(d.caliber || '')}${countries ? ' · ' + esc(countries) : ''}</div>
          </div>
        </div>`;
      });
    });

    $wrap.innerHTML = html;
  }

  // Browse events
  document.getElementById('browse-search').addEventListener('input', function () {
    state.browseSearch = this.value;
    document.getElementById('browse-clear').style.display = this.value ? 'block' : 'none';
    renderBrowse();
  });
  document.getElementById('browse-clear').addEventListener('click', () => {
    const $s = document.getElementById('browse-search');
    $s.value = '';
    state.browseSearch = '';
    document.getElementById('browse-clear').style.display = 'none';
    renderBrowse();
    $s.focus();
  });

  document.querySelectorAll('.chip[data-role]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip[data-role]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.browseRole = chip.dataset.role;
      renderBrowse();
    });
  });

  document.getElementById('browse-wrap').addEventListener('click', e => {
    const row = e.target.closest('.tl-entry[data-id]');
    if (!row) return;
    const item = DATA.find(d => d.id === row.dataset.id);
    if (item) openDetail(item);
  });

  // ══════════════════════════════════════════════
  // DETAIL DRAWER (shared)
  // ══════════════════════════════════════════════

  function openDetail(d) {
    state.selected = d;
    if (state.view === 'swimlanes') renderSwimlanes();
    else if (state.view === 'browse') renderBrowse();

    const color = ROLE_COLORS[d.role] || '#888';
    const serviceStr = d.yearEnd ? `${d.yearStart}–${d.yearEnd}` : `${d.yearStart}–Present`;
    const yearsIn = (d.yearEnd || YEAR_MAX) - d.yearStart;

    $detailIn.innerHTML = `
      <div class="detail-name">${esc(d.name)}</div>
      <div class="detail-meta-row">
        <span class="detail-badge" style="background:${color}22;color:${color};border:0.5px solid ${color}44">${esc(d.role)}</span>
        <span class="detail-badge-outline">${esc(serviceStr)}</span>
        ${d.yearEnd ? '' : '<span class="detail-badge-outline" style="color:#2ecc71;border-color:rgba(46,204,113,0.3)">STILL IN SERVICE</span>'}
      </div>
      <div class="detail-spec-row">
        <div class="spec-item">
          <div class="spec-label">IN SERVICE</div>
          <div class="spec-value accent">${esc(serviceStr)}</div>
        </div>
        <div class="spec-item">
          <div class="spec-label">YEARS OF SERVICE</div>
          <div class="spec-value">${yearsIn}${d.yearEnd ? '' : '+'} yrs</div>
        </div>
        <div class="spec-item">
          <div class="spec-label">CALIBER</div>
          <div class="spec-value">${esc(d.caliber || '—')}</div>
        </div>
        <div class="spec-item">
          <div class="spec-label">COUNTRIES</div>
          <div class="spec-value" style="font-size:10px;line-height:1.5">${esc((d.countries || []).join(', '))}</div>
        </div>
      </div>
      <div class="spec-label" style="margin-bottom:10px">SERVICE HISTORY</div>
      <div class="detail-body">${esc(d.story)}</div>
    `;

    $detail.classList.add('open');
    $backdrop.classList.add('open');
    $detail.scrollTop = 0;
  }

  function closeDetail() {
    state.selected = null;
    $detail.classList.remove('open');
    $backdrop.classList.remove('open');
    if (state.view === 'swimlanes') renderSwimlanes();
    else if (state.view === 'browse') renderBrowse();
  }

  document.getElementById('detail-close-btn').addEventListener('click', closeDetail);
  $backdrop.addEventListener('click', closeDetail);

  // ══════════════════════════════════════════════
  // FORMS
  // ══════════════════════════════════════════════

  document.getElementById('suggest-btn').addEventListener('click', () => openModal('suggest-modal'));
  document.getElementById('report-btn').addEventListener('click', () => {
    populateReportSelect();
    openModal('report-modal');
  });

  document.querySelectorAll('.form-modal-close, .form-cancel').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.modal));
  });
  document.getElementById('suggest-modal').addEventListener('click', e => {
    if (e.target.id === 'suggest-modal') closeModal('suggest-modal');
  });
  document.getElementById('report-modal').addEventListener('click', e => {
    if (e.target.id === 'report-modal') closeModal('report-modal');
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if ($detail.classList.contains('open')) { closeDetail(); return; }
    ['suggest-modal', 'report-modal'].forEach(id => {
      if (document.getElementById(id).style.display === 'flex') closeModal(id);
    });
  });

  handleFormSubmit('suggest-form', 'suggest-success', 'suggest-modal');
  handleFormSubmit('report-form', 'report-success', 'report-modal');

  window.addEventListener('scroll', () => {
    document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 20);
  });

  function populateReportSelect() {
    const sel = document.getElementById('report-weapon');
    if (sel.options.length > 1) return;
    [...DATA].sort((a, b) => a.name.localeCompare(b.name)).forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.id;
      opt.textContent = d.name + ' (' + d.yearStart + ')';
      sel.appendChild(opt);
    });
  }

  function openModal(id) {
    document.getElementById(id).style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
  function closeModal(id) {
    document.getElementById(id).style.display = 'none';
    document.body.style.overflow = '';
  }
  function handleFormSubmit(formId, successId, modalId) {
    document.getElementById(formId).addEventListener('submit', function (e) {
      e.preventDefault();
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(this)).toString(),
      }).catch(() => {});
      this.style.display = 'none';
      document.getElementById(successId).style.display = 'block';
      setTimeout(() => {
        this.reset();
        this.style.display = 'block';
        document.getElementById(successId).style.display = 'none';
        closeModal(modalId);
      }, 2800);
    });
  }

  function esc(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── INIT ──────────────────────────────────────────────────────────────
  renderRuler();
  renderSwimlanes();

})();
