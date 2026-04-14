/**
 * Fetches live cartridge data from Supabase and enhances the calibers page.
 * The static HTML table (generated at build time) remains as a no-JS fallback.
 * The anon key is safe to include here — RLS allows public SELECT only.
 */

const SUPABASE_URL = 'https://joturvmcygdmpnhfsslu.supabase.co';
const ANON_KEY = 'sb_publishable_ESC5Ir0q9yoOoEhC03Tjdg_QrVnW8DG';

async function loadCartridges() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/cartridges?select=*&order=name.asc`,
      {
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
        },
      }
    );

    if (!res.ok) return; // fall back to static HTML silently
    const cartridges = await res.json();
    if (!Array.isArray(cartridges) || cartridges.length === 0) return;

    renderLiveData(cartridges);
  } catch {
    // Network error — static HTML fallback remains visible
  }
}

function renderLiveData(cartridges) {
  const banner = document.getElementById('live-data-banner');
  if (banner) {
    banner.textContent = `${cartridges.length} cartridges — live from database`;
    banner.style.display = 'block';
  }

  // If a live-count element exists, update it
  const countEl = document.getElementById('cartridge-count');
  if (countEl) countEl.textContent = cartridges.length;
}

loadCartridges();
