// Burn Rate Spectrum — Lindcott Armory
// Fetches all powders, renders an interactive spectrum bar + ranked list.
// Depends on: js/supabase-loader.js

(async function () {
  'use strict';

  // ── HELPERS ────────────────────────────────────────────────────────────────
  function powderSlug(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function typeColor(type) {
    switch (type) {
      case 'Ball':     return '#4a90d9';
      case 'Extruded': return '#e8a838';
      case 'Disc':     return '#5cb85c';
      case 'Flake':    return '#9b59b6';
      default:         return '#666';
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

  function esc(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── STATE ──────────────────────────────────────────────────────────────────
  let activeFilter    = 'all';
  let showDiscontinued = false;

  // ── FETCH ──────────────────────────────────────────────────────────────────
  const $loading = document.getElementById('br-loading');
  const $main    = document.getElementById('br-main');

  try {
    const rows    = await supabaseFetchAll('powder_brands');
    const all     = transformPowders(rows);
    const powders = all.filter(p => p.burnRateRank != null).sort((a, b) => a.burnRateRank - b.burnRateRank);

    // ── GROUP BY RANK ──────────────────────────────────────────────────────
    const byRank = {};
    for (const p of powders) {
      const r = Math.round(p.burnRateRank);
      (byRank[r] = byRank[r] || []).push(p);
    }

    // ── BUILD SPECTRUM ─────────────────────────────────────────────────────
    const track   = document.getElementById('br-track');
    const tooltip = document.getElementById('br-tooltip');

    for (let r = 1; r <= 100; r++) {
      const col   = document.createElement('div');
      col.className = 'br-col';
      col.dataset.rank = r;
      const group = byRank[r] || [];

      for (const p of group) {
        const seg = document.createElement('div');
        seg.className = 'br-seg';
        seg.style.background = typeColor(p.powderType);
        seg.dataset.uses = (p.bestUse || []).join(',');
        seg.dataset.disc = p.discontinued ? '1' : '';
        seg.dataset.slug = powderSlug(p.productName);
        seg.dataset.name = p.productName;
        seg.dataset.brand = p.brand || '';
        seg.dataset.type  = p.powderType || '';
        seg.dataset.rank  = String(r);
        seg.dataset.temp  = p.temperatureSensitivity || '';
        seg.dataset.desc  = (p.description || '').slice(0, 130);
        col.prepend(seg); // prepend so visually bottom = first listed
      }

      track.appendChild(col);
    }

    // ── TOOLTIP ────────────────────────────────────────────────────────────
    let hideTimer;

    track.addEventListener('mousemove', e => {
      const seg = e.target.closest('.br-seg');
      if (!seg) {
        hideTimer = setTimeout(() => { tooltip.style.display = 'none'; }, 80);
        return;
      }
      clearTimeout(hideTimer);

      const uses = seg.dataset.uses ? seg.dataset.uses.split(',') : [];
      const typeCol = typeColor(seg.dataset.type);

      tooltip.innerHTML = `
        <div class="brt-name">${esc(seg.dataset.name)}${seg.dataset.disc ? ' <span style="font-size:9px;color:#ff8888;font-family:var(--mono)">DISC</span>' : ''}</div>
        <div class="brt-brand">${esc(seg.dataset.brand)}</div>
        <div class="brt-meta">
          <span class="brt-rank">RANK ${esc(seg.dataset.rank)}</span>
          <span class="brt-type" style="color:${typeCol}">${esc(seg.dataset.type) || '—'}</span>
        </div>
        ${uses.length ? `<div class="brt-uses">${uses.map(u => `<span class="brt-use-tag">${esc(u)}</span>`).join('')}</div>` : ''}
        ${seg.dataset.temp ? `<div class="brt-temp ${tempClass(seg.dataset.temp)}">TEMP SENSITIVITY · ${esc(seg.dataset.temp).toUpperCase()}</div>` : ''}
        ${seg.dataset.desc ? `<div class="brt-desc">${esc(seg.dataset.desc)}${seg.dataset.desc.length >= 130 ? '…' : ''}</div>` : ''}
        <div class="brt-link">→ Full details</div>
      `;

      tooltip.style.display = 'block';

      // Position: right of cursor, flip left if near edge
      const tw = tooltip.offsetWidth;
      const th = tooltip.offsetHeight;
      let tx = e.clientX + 16;
      let ty = e.clientY - 24;

      if (tx + tw > window.innerWidth - 8)  tx = e.clientX - tw - 12;
      if (ty + th > window.innerHeight - 8) ty = window.innerHeight - th - 8;
      if (ty < 8) ty = 8;

      tooltip.style.left = tx + 'px';
      tooltip.style.top  = ty + 'px';
    });

    track.addEventListener('mouseleave', () => {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => { tooltip.style.display = 'none'; }, 120);
    });

    track.addEventListener('click', e => {
      const seg = e.target.closest('.br-seg');
      if (seg) location.href = '/powder/' + seg.dataset.slug;
    });

    // ── FILTER ─────────────────────────────────────────────────────────────
    function applyFilter() {
      track.querySelectorAll('.br-seg').forEach(seg => {
        const uses     = seg.dataset.uses ? seg.dataset.uses.split(',') : [];
        const isDisc   = seg.dataset.disc === '1';
        const useMatch = activeFilter === 'all' || uses.includes(activeFilter);
        const discOk   = showDiscontinued || !isDisc;
        seg.classList.toggle('br-dim', !useMatch || !discOk);
      });

      renderList(powders.filter(p => {
        const uses     = p.bestUse || [];
        const useMatch = activeFilter === 'all' || uses.includes(activeFilter);
        const discOk   = showDiscontinued || !p.discontinued;
        return useMatch && discOk;
      }));
    }

    document.querySelectorAll('.br-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.br-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeFilter = chip.dataset.use;
        applyFilter();
      });
    });

    document.getElementById('br-disc-toggle').addEventListener('change', e => {
      showDiscontinued = e.target.checked;
      applyFilter();
    });

    // ── LIST ───────────────────────────────────────────────────────────────
    function renderList(filtered) {
      document.getElementById('br-count').textContent =
        filtered.length + ' powder' + (filtered.length !== 1 ? 's' : '');

      document.getElementById('br-list').innerHTML = filtered.map(p => `
        <a href="/powder/${powderSlug(p.productName)}" class="br-row">
          <div class="br-row-rank" title="Burn rate position (relative scale — lower = faster)">${p.burnRateRank}</div>
          <div class="br-row-name">
            ${esc(p.productName)}
            ${p.discontinued ? '<span class="br-disc-badge">DISC</span>' : ''}
          </div>
          <div class="br-row-brand">${esc(p.brand)}</div>
          <div class="br-row-type" style="color:${typeColor(p.powderType)}">${esc(p.powderType) || '—'}</div>
          <div class="br-row-uses">${(p.bestUse || []).map(u => `<span class="br-use-mini">${esc(u)}</span>`).join('')}</div>
          <div class="br-row-temp ${tempClass(p.temperatureSensitivity)}">${p.temperatureSensitivity ? esc(p.temperatureSensitivity).toUpperCase() : '—'}</div>
        </a>
      `).join('');
    }

    renderList(powders);

    // ── URL HASH — highlight a shared powder ──────────────────────────────
    const hash = location.hash.slice(1);
    if (hash) {
      const seg = track.querySelector(`[data-slug="${CSS.escape(hash)}"]`);
      if (seg) {
        seg.classList.add('br-highlight');
        // Scroll the spectrum so the highlighted segment is centered
        const wrap = document.querySelector('.br-spectrum-wrap');
        const colEl = seg.closest('.br-col');
        if (wrap && colEl) {
          const colLeft  = colEl.offsetLeft;
          const wrapW    = wrap.clientWidth;
          wrap.scrollLeft = colLeft - wrapW / 2;
        }
        // Also scroll the list row into view
        setTimeout(() => {
          const listRow = document.querySelector(`#br-list a[href="/powder/${CSS.escape(hash)}"]`);
          if (listRow) listRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 400);
      }
    }

    // ── SHOW ───────────────────────────────────────────────────────────────
    $loading.style.display = 'none';
    $main.style.display    = 'block';

  } catch (err) {
    console.error('Burn rate load error:', err);
    $loading.innerHTML = `<p style="color:var(--muted);font-family:var(--mono);font-size:11px">Failed to load powder data. <a href="/powder-library" style="color:var(--accent)">← Powder Library</a></p>`;
  }
})();
