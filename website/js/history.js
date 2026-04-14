// History of Firearms — Lindcott Armory Field Guide
// Depends on: data/gun-history-data.js (GUN_HISTORY global)

(function () {
  'use strict';

  // Sort chronologically (data may not be pre-sorted)
  const DATA = [...GUN_HISTORY].sort((a, b) => a.year - b.year);

  const ERAS = [
    { label: 'Age of Flintlock',              end: 1815 },
    { label: 'Percussion & Repeating Arms',   end: 1869 },
    { label: 'Smokeless Powder Era',          end: 1913 },
    { label: 'The World Wars',                end: 1945 },
    { label: 'Cold War',                      end: 1991 },
    { label: 'Modern Era',                    end: 9999 },
  ];

  function getEra(year) {
    return ERAS.find(e => year <= e.end) || ERAS[ERAS.length - 1];
  }

  // ── STATE ────────────────────────────────────────────────────────────
  let state = { search: '', filterCat: 'all', selected: null };

  // ── ELEMENTS ─────────────────────────────────────────────────────────
  const $wrap     = document.getElementById('timeline-wrap');
  const $empty    = document.getElementById('table-empty');
  const $count    = document.getElementById('result-count');
  const $search   = document.getElementById('search');
  const $clear    = document.getElementById('search-clear');
  const $detail   = document.getElementById('detail-panel');
  const $detailIn = document.getElementById('detail-inner');
  const $backdrop = document.getElementById('detail-backdrop');
  const $catChips = document.getElementById('cat-chips');

  // ── BUILD CATEGORY CHIPS ─────────────────────────────────────────────
  const cats = [...new Set(DATA.map(d => d.category))].sort();
  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.dataset.cat = cat;
    btn.textContent = cat.toUpperCase();
    $catChips.appendChild(btn);
  });

  // ── FILTER ───────────────────────────────────────────────────────────
  function getFiltered() {
    return DATA.filter(d => {
      if (state.filterCat !== 'all' && d.category !== state.filterCat) return false;
      if (state.search) {
        const q = state.search.toLowerCase();
        if (!d.name.toLowerCase().includes(q) &&
            !(d.origin || '').toLowerCase().includes(q) &&
            !(d.tagline || '').toLowerCase().includes(q) &&
            !(d.body || '').toLowerCase().includes(q) &&
            !(d.category || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }

  // ── RENDER TIMELINE ──────────────────────────────────────────────────
  function renderTimeline() {
    const list = getFiltered();
    $count.textContent = list.length + ' entr' + (list.length === 1 ? 'y' : 'ies');
    $empty.style.display = list.length === 0 ? 'block' : 'none';
    if (list.length === 0) { $wrap.innerHTML = ''; return; }

    // Group by era
    const groups = {};
    list.forEach(d => {
      const era = getEra(d.year).label;
      if (!groups[era]) groups[era] = [];
      groups[era].push(d);
    });

    let html = '';
    ERAS.forEach(era => {
      if (!groups[era.label]) return;
      html += `<div class="tl-era">
        <span class="tl-era-label">${esc(era.label)}</span>
        <span class="tl-era-line"></span>
      </div>`;
      groups[era.label].forEach(d => {
        const isActive = state.selected && state.selected.id === d.id;
        const color = d.categoryColor || '#888';
        html += `<div class="tl-entry${isActive ? ' active' : ''}" data-id="${esc(d.id)}">
          <div class="tl-year-col"><span class="tl-year">${d.year}</span></div>
          <div class="tl-dot-col">
            <div class="tl-dot" style="background:${color};border-color:var(--bg)"></div>
          </div>
          <div class="tl-card">
            <div class="tl-cat-badge" style="background:${color}22;color:${color};border:0.5px solid ${color}44">${esc(d.category)}</div>
            <div class="tl-name">${esc(d.name)}</div>
            ${d.origin ? `<div class="tl-meta">${esc(d.origin)} · ${d.era || d.year}</div>` : ''}
            <div class="tl-tagline">${esc(d.tagline)}</div>
          </div>
        </div>`;
      });
    });

    $wrap.innerHTML = html;
  }

  // ── DETAIL DRAWER ────────────────────────────────────────────────────
  function openDetail(d) {
    state.selected = d;
    renderTimeline();

    const color = d.categoryColor || '#888';

    $detailIn.innerHTML = `
      <div class="detail-name">${esc(d.name)}</div>
      <div class="detail-meta-row">
        <span class="detail-badge" style="background:${color}22;color:${color};border:0.5px solid ${color}44">${esc(d.category)}</span>
        ${d.origin ? `<span class="detail-badge-outline">${esc(d.origin)}</span>` : ''}
        <span class="detail-badge-outline">${d.year}${d.era && d.era !== String(d.year) ? ' · ' + esc(d.era) : ''}</span>
      </div>
      <div class="detail-spec-row">
        <div class="spec-item"><div class="spec-label">YEAR</div><div class="spec-value accent">${d.year}</div></div>
        <div class="spec-item"><div class="spec-label">ORIGIN</div><div class="spec-value">${esc(d.origin || '—')}</div></div>
        <div class="spec-item"><div class="spec-label">CATEGORY</div><div class="spec-value">${esc(d.category)}</div></div>
        <div class="spec-item"><div class="spec-label">ERA</div><div class="spec-value">${esc(d.era || '—')}</div></div>
      </div>
      <div style="margin-bottom:12px">
        <div class="spec-label" style="margin-bottom:6px">TAGLINE</div>
        <div style="font-size:14px;color:var(--text);font-style:italic;border-left:2px solid ${color};padding-left:12px;line-height:1.6">${esc(d.tagline)}</div>
      </div>
      <div class="spec-label" style="margin-bottom:10px;margin-top:24px">HISTORY</div>
      <div class="detail-body">${esc(d.body)}</div>
    `;

    $detail.classList.add('open');
    $backdrop.classList.add('open');
    $detail.scrollTop = 0;
  }

  function closeDetail() {
    state.selected = null;
    $detail.classList.remove('open');
    $backdrop.classList.remove('open');
    renderTimeline();
  }

  // ── EVENTS ───────────────────────────────────────────────────────────
  $search.addEventListener('input', () => {
    state.search = $search.value;
    $clear.style.display = state.search ? 'block' : 'none';
    renderTimeline();
  });
  $clear.addEventListener('click', () => {
    $search.value = ''; state.search = '';
    $clear.style.display = 'none';
    renderTimeline(); $search.focus();
  });

  document.querySelectorAll('#cat-chips .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#cat-chips .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.filterCat = chip.dataset.cat;
      renderTimeline();
    });
  });

  $wrap.addEventListener('click', e => {
    const row = e.target.closest('.tl-entry[data-id]');
    if (!row) return;
    const item = DATA.find(d => d.id === row.dataset.id);
    if (item) openDetail(item);
  });

  document.getElementById('detail-close-btn').addEventListener('click', closeDetail);
  $backdrop.addEventListener('click', closeDetail);

  // Forms
  document.getElementById('suggest-btn').addEventListener('click', () => openModal('suggest-modal'));
  document.getElementById('report-btn').addEventListener('click', () => {
    populateReportSelect();
    openModal('report-modal');
  });

  document.querySelectorAll('.form-modal-close, .form-cancel').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.modal));
  });
  document.getElementById('suggest-modal').addEventListener('click', e => { if (e.target.id === 'suggest-modal') closeModal('suggest-modal'); });
  document.getElementById('report-modal').addEventListener('click', e => { if (e.target.id === 'report-modal') closeModal('report-modal'); });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if ($detail.classList.contains('open')) closeDetail();
    ['suggest-modal','report-modal'].forEach(id => {
      if (document.getElementById(id).style.display === 'flex') closeModal(id);
    });
  });

  handleFormSubmit('suggest-form', 'suggest-success', 'suggest-modal');
  handleFormSubmit('report-form', 'report-success', 'report-modal');

  window.addEventListener('scroll', () => {
    document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 20);
  });

  function populateReportSelect() {
    const sel = document.getElementById('report-entry');
    if (sel.options.length > 1) return;
    [...DATA].sort((a,b) => a.name.localeCompare(b.name)).forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.id;
      opt.textContent = d.name + ' (' + d.year + ')';
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
    document.getElementById(formId).addEventListener('submit', function(e) {
      e.preventDefault();
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(this)).toString() }).catch(() => {});
      this.style.display = 'none';
      document.getElementById(successId).style.display = 'block';
      setTimeout(() => {
        this.reset(); this.style.display = 'block';
        document.getElementById(successId).style.display = 'none';
        closeModal(modalId);
      }, 2800);
    });
  }
  function esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── INIT ─────────────────────────────────────────────────────────────
  renderTimeline();

})();
