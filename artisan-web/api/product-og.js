/**
 * Open Graph prerender endpoint for WhatsApp / social link previews.
 *
 * Why this exists: WhatsApp's crawler does not execute JavaScript. `vercel.json`
 * rewrites every path to the Vite SPA shell, so a crawler hitting
 * `/product/<id>` would otherwise see one generic index.html with no og:* tags
 * and render a bare link instead of the rich image card.
 *
 * `vercel.json` routes crawler user-agents here instead. We fetch the product
 * straight from Supabase's REST API and return minimal HTML carrying the real
 * og:title / og:description / og:image. Humans never reach this path — they are
 * served the normal SPA — but a redirect is included as a safety net.
 *
 * Runtime: Vercel Edge (see `config` below).
 */

export const config = { runtime: 'edge' };

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=80';

const SITE_NAME = 'Shilp Setu';

/** Escapes text for safe interpolation into HTML text and attribute contexts. */
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Resolves a possibly-relative image path to an absolute URL (og:image requires absolute). */
function absoluteUrl(image, origin) {
  if (!image) return FALLBACK_IMAGE;
  if (/^https?:\/\//i.test(image)) return image;
  return `${origin}${image.startsWith('/') ? '' : '/'}${image}`;
}

async function fetchProduct(productId) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;

  const endpoint =
    `${SUPABASE_URL}/rest/v1/products` +
    `?id=eq.${encodeURIComponent(productId)}` +
    `&select=id,title,hindi_title,description,hindi_description,image_url,price,bulk_price,min_order_quantity,craft_origin&limit=1`;

  const res = await fetch(endpoint, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) return null;
  const rows = await res.json();
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

function renderHtml({ origin, productId, product }) {
  const pageUrl = `${origin}/product/${productId}`;

  const title = product?.title || 'Handcrafted Craft';
  const description =
    product?.description ||
    'Authentic Indian handicraft, handcrafted by master artisans. View details and order directly from the artisan.';
  const image = absoluteUrl(product?.image_url, origin);

  const price = Number(product?.price ?? 0);
  const priceLine = price > 0 ? ` · ₹${price.toLocaleString('en-IN')}` : '';
  const location = product?.craft_origin ? ` · ${product.craft_origin}` : '';

  const ogTitle = `${title}${priceLine}`;
  const ogDescription = `${description}${location}`.slice(0, 200);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} | ${SITE_NAME}</title>
<meta name="description" content="${escapeHtml(ogDescription)}">

<meta property="og:type" content="product">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:title" content="${escapeHtml(ogTitle)}">
<meta property="og:description" content="${escapeHtml(ogDescription)}">
<meta property="og:image" content="${escapeHtml(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="1200">
<meta property="og:url" content="${escapeHtml(pageUrl)}">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(ogTitle)}">
<meta name="twitter:description" content="${escapeHtml(ogDescription)}">
<meta name="twitter:image" content="${escapeHtml(image)}">

<link rel="canonical" href="${escapeHtml(pageUrl)}">
<meta http-equiv="refresh" content="0; url=${escapeHtml(pageUrl)}">
</head>
<body>
<p>Redirecting to <a href="${escapeHtml(pageUrl)}">${escapeHtml(title)}</a>…</p>
</body>
</html>`;
}

export default async function handler(request) {
  const { origin, searchParams } = new URL(request.url);
  const productId = searchParams.get('productId');

  if (!productId) {
    return new Response('Missing productId', { status: 400 });
  }

  let product = null;
  try {
    product = await fetchProduct(productId);
  } catch (err) {
    // Never fail the crawl — fall back to generic OG tags so the link still
    // previews with the Shilp Setu brand rather than rendering nothing.
    console.error('[product-og] Supabase fetch failed:', err);
  }

  const html = renderHtml({ origin, productId, product });

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Crawlers cache aggressively; keep the window short so price edits surface.
      'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
