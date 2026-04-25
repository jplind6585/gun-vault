// Dynamic sitemap — fetches cartridge and powder names from Supabase on every
// request so additions/removals are reflected without redeployment.

const SUPABASE_URL = 'https://joturvmcygdmpnhfsslu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ESC5Ir0q9yoOoEhC03Tjdg_QrVnW8DG';

function nameToSlug(name) {
  return name.toLowerCase()
    .replace(/×/g, 'x')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function powderToSlug(productName) {
  return productName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const STATIC_URLS = [
  { loc: 'https://lindcottarmory.com/',                 changefreq: 'weekly',  priority: '1.0' },
  { loc: 'https://lindcottarmory.com/field-guide',      changefreq: 'monthly', priority: '0.8' },
  { loc: 'https://lindcottarmory.com/cartridge-library',changefreq: 'monthly', priority: '0.8' },
  { loc: 'https://lindcottarmory.com/powder-library',   changefreq: 'monthly', priority: '0.8' },
  { loc: 'https://lindcottarmory.com/history',          changefreq: 'monthly', priority: '0.7' },
  { loc: 'https://lindcottarmory.com/military',         changefreq: 'monthly', priority: '0.7' },
  { loc: 'https://lindcottarmory.com/stolen',           changefreq: 'monthly', priority: '0.7' },
  { loc: 'https://lindcottarmory.com/privacy',          changefreq: 'yearly',  priority: '0.3' },
];

exports.handler = async function () {
  let cartridgeUrls = [];
  let powderUrls    = [];

  const headers = { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY };

  await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/cartridges?select=name&limit=2000`, { headers })
      .then(r => r.ok ? r.json() : [])
      .then(rows => {
        cartridgeUrls = rows.map(r => ({
          loc: `https://lindcottarmory.com/cartridge/${nameToSlug(r.name)}`,
          changefreq: 'monthly',
          priority: '0.6',
        }));
      })
      .catch(e => console.error('Sitemap: cartridges fetch failed', e.message)),

    fetch(`${SUPABASE_URL}/rest/v1/powder_brands?select=brand,product_name&limit=2000`, { headers })
      .then(r => r.ok ? r.json() : [])
      .then(rows => {
        powderUrls = rows.map(r => ({
          loc: `https://lindcottarmory.com/powder/${powderToSlug(r.product_name)}`,
          changefreq: 'monthly',
          priority: '0.6',
        }));
      })
      .catch(e => console.error('Sitemap: powders fetch failed', e.message)),
  ]);

  const allUrls = [...STATIC_URLS, ...cartridgeUrls, ...powderUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600', // cache 1 hour
    },
    body: xml,
  };
};
