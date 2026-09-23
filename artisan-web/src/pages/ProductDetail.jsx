import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import {
  buildProductUrl,
  formatPrice,
} from '../utils/whatsappShare';

/**
 * Public-facing Product Detail Page (PDP) for buyers and WhatsApp sharing.
 *
 * Route: /product/:id
 *
 * Expected schema: title_en, title_hi, image_url, category, hsn_code,
 * unspsc_code, retail_price, bulk_price, moq, location, artisan_name, description.
 */
function normalizeProduct(row, fallbackArtisan = 'Master Artisan') {
  if (!row) return null;

  const retail = Number(row.retail_price ?? row.price ?? row.suggested_retail_price_inr ?? 0);
  const bulk = Number(row.bulk_price ?? row.wholesale_price ?? 0);
  const moqVal = Number(row.moq ?? row.min_order_quantity ?? 1);

  return {
    id: row.id,
    title_en: row.title_en || row.title || 'Handcrafted Craft',
    title_hi: row.title_hi || row.hindi_title || '',
    image_url:
      row.image_url ||
      row.image ||
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
    category: row.category || row.gem_category || 'Handicrafts',
    hsn_code: row.hsn_code || '69120010',
    unspsc_code: row.unspsc_code || '60121002',
    retail_price: retail,
    bulk_price: bulk,
    moq: moqVal,
    location: row.location || row.craft_origin || 'India',
    artisan_name: row.artisan_name || row.artisan || fallbackArtisan,
    description: row.description || row.craft_story || '',
    hindi_description: row.hindi_description || row.description_hi || '',
    status: row.status || 'live',
    is_gem_ready: row.is_gem_ready ?? true,
  };
}

export default function ProductDetail() {
  const { id, productId } = useParams();
  const effectiveId = id || productId;
  const { language, showToast, artisanName } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(Boolean(effectiveId));
  const [copied, setCopied] = useState(false);

  // Authoritative fetch from Supabase `products` table
  useEffect(() => {
    let isMounted = true;

    async function fetchProduct() {
      if (!effectiveId) {
        if (isMounted) {
          setProduct(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', effectiveId)
          .maybeSingle();

        if (error) {
          console.warn('[ProductDetail] Supabase query notice:', error.message);
        }

        if (isMounted) {
          if (data) {
            setProduct(normalizeProduct(data, artisanName));
          } else {
            setProduct(null);
          }
        }
      } catch (err) {
        console.warn('[ProductDetail] Fetch error:', err?.message || err);
        if (isMounted) {
          setProduct(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchProduct();
    return () => {
      isMounted = false;
    };
  }, [productId, artisanName]);

  const isHi = language === 'hi';

  const shareUrl = useMemo(
    () => (product ? buildProductUrl(product.id) : ''),
    [product]
  );

  const handleShare = () => {
    if (!product || !product.id) return;
    const shareUrl = `${window.location.origin}/product/${product.id}`;
    const name = (isHi && product.title_hi) ? product.title_hi : (product.title_en || 'Handcrafted Craft');
    const message = `Check out this product: ${shareUrl}\n\n*${name}*\nPrice: ₹${product.retail_price}`;
    const waLink = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waLink, '_blank');
  };

  const handleCopyLink = async () => {
    if (!product) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      showToast?.(isHi ? '✅ उत्पाद लिंक कॉपी किया गया!' : '✅ Product link copied!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast?.(isHi ? 'लिंक कॉपी नहीं हो सका' : 'Could not copy link');
    }
  };

  const handlePreviewMessage = () => {
    if (!product) return;
    const preview = formatWhatsAppMessage({
      title: product.title_en,
      artisanName: product.artisan_name,
      price: product.retail_price,
      url: shareUrl,
      language,
    });
    showToast?.(preview);
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading && !product) {
    return (
      <div className="w-full min-h-screen bg-[#fdf9f3] flex flex-col items-center justify-center gap-3">
        <span className="material-symbols-outlined text-[36px] text-[#ff9062] animate-pulse">auto_awesome</span>
        <p className="text-sm font-semibold text-stone-500">
          {isHi ? 'शिल्प विवरण लोड हो रहा है...' : 'Loading craft details...'}
        </p>
      </div>
    );
  }

  // ── Not found state ───────────────────────────────────────────────────────
  if (!product) {
    return (
      <div className="w-full min-h-screen bg-[#fdf9f3] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-extrabold text-[#2e241e]">
          {isHi ? 'शिल्प नहीं मिला' : 'Craft not found'}
        </h1>
        <p className="text-sm text-stone-500 max-w-md">
          {isHi
            ? 'यह उत्पाद हटा दिया गया हो सकता है या लिंक गलत है।'
            : 'This product may have been removed, or the link is incorrect.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/catalog')}
          className="px-5 py-2.5 rounded-xl bg-[#9c441c] hover:bg-[#833714] text-white font-bold text-sm transition-colors cursor-pointer"
        >
          {isHi ? 'कैटलॉग देखें' : 'Browse Catalog'}
        </button>
      </div>
    );
  }

  const retailLabel = formatPrice(product.retail_price);
  const bulkLabel = formatPrice(product.bulk_price);
  const displayDescription = isHi && product.hindi_description
    ? product.hindi_description
    : (product.description || 'Authentic handcrafted product made using traditional Indian artisanal techniques.');

  return (
    <div className="w-full min-h-screen bg-[#fdf9f3] text-[#2e241e]">
      {/* ── Open Graph and SEO Meta tags via react-helmet-async ───────────── */}
      <Helmet>
        <title>{`${product.title_en} | Shilp Setu`}</title>
        <meta name="description" content={displayDescription.slice(0, 160)} />
        <meta property="og:type" content="product" />
        <meta property="og:site_name" content="Shilp Setu" />
        <meta property="og:title" content={product.title_en} />
        <meta property="og:description" content={displayDescription.slice(0, 160)} />
        <meta property="og:image" content={product.image_url} />
        <meta property="og:url" content={shareUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={product.title_en} />
        <meta name="twitter:description" content={displayDescription.slice(0, 160)} />
        <meta name="twitter:image" content={product.image_url} />
        <link rel="canonical" href={shareUrl} />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-2 text-xs font-semibold text-stone-500 uppercase tracking-wider">
            <li>
              <Link to="/home" className="hover:text-[#9c441c] transition-colors">
                {isHi ? 'आवास' : 'Home'}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link to="/catalog" className="hover:text-[#9c441c] transition-colors">
                {isHi ? 'कैटलॉग' : 'Catalog'}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-[#9c441c] truncate max-w-[16rem]" aria-current="page">
              {product.title_en}
            </li>
          </ol>
        </nav>

        {/* 2-Column Responsive E-Commerce Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ════ Left Column: Visual Container & Artisan Profile ════ */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {/* Large product image container */}
            <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-[#191312] border border-stone-300/40 shadow-xl group">
              <img
                src={product.image_url}
                alt={product.title_en}
                width="800"
                height="800"
                loading="eager"
                className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
              />


              {/* Dark Location Pin Overlay at Bottom Left */}
              <div className="absolute bottom-4 left-4 px-3.5 py-1.5 rounded-xl bg-[#191312]/90 backdrop-blur-md text-[#ffdeaa] font-bold text-xs flex items-center gap-1.5 border border-white/10 shadow-lg">
                <span className="material-symbols-outlined text-[16px] text-[#ff9062]" aria-hidden="true">location_on</span>
                <span>{product.location}</span>
              </div>
            </div>

            {/* Artisan Profile Card with Verified Checkmark */}
            <div className="p-4 rounded-2xl bg-[#f1ede7] border border-[#e8e2d9] flex items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className="w-12 h-12 shrink-0 rounded-2xl bg-[#2e241e] text-[#ffdeaa] flex items-center justify-center font-black text-lg shadow-sm"
                  aria-hidden="true"
                >
                  {String(product.artisan_name || 'Shilp Setu').trim().charAt(0) || 'S'}
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-[#2e241e] truncate">
                    {product.artisan_name}
                  </h2>
                  <p className="text-xs text-stone-500 font-medium truncate">
                    {isHi ? 'शिल्प सेतु प्रमाणित शिल्पकार स्टूडियो' : 'Shilp Setu Certified Artisan Studio'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                <span
                  className="material-symbols-outlined text-emerald-700 text-[18px]"
                  role="img"
                  aria-label={isHi ? 'सत्यापित शिल्पकार' : 'Verified artisan'}
                >
                  verified
                </span>
                <span className="text-[11px] font-bold">
                  {isHi ? 'सत्यापित' : 'Verified'}
                </span>
              </div>
            </div>
          </div>

          {/* ════ Right Column: Details, Pricing, & WhatsApp Share ════ */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <header className="space-y-3">
              {/* Top Row: Small Pill Tags for Category, HSN, and UNSPSC codes */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-[#ebe8e2] text-stone-700 font-bold text-xs uppercase tracking-wider">
                  {product.category}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-[11px]">
                  HSN: {product.hsn_code}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px]">
                  UNSPSC: {product.unspsc_code}
                </span>
              </div>

              {/* Massive Bold H1 for English title */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[#2e241e] leading-tight tracking-tight">
                {product.title_en}
              </h1>

              {/* Softer Sub-Heading for Hindi translation */}
              {product.title_hi && (
                <p
                  lang="hi"
                  className="text-lg sm:text-xl text-stone-600 font-medium leading-snug"
                >
                  {product.title_hi}
                </p>
              )}
            </header>

            {/* Pricing Box: Split-Card Design */}
            <div className="rounded-2xl bg-white border border-stone-300/60 shadow-sm overflow-hidden flex flex-col sm:flex-row">
              {/* Direct Retail Price (Prominent) */}
              <div className="flex-1 p-5">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                  {isHi ? 'प्रत्यक्ष खुदरा मूल्य' : 'DIRECT RETAIL PRICE'}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl md:text-4xl font-black text-[#9c441c]">
                    ₹{retailLabel}
                  </span>
                  <span className="text-xs text-stone-500 font-semibold">
                    {isHi ? 'प्रति इकाई' : 'per unit'}
                  </span>
                </div>
              </div>

              {/* Secondary: Institutional / Bulk Price alongside MOQ */}
              <div className="sm:border-l border-t sm:border-t-0 border-stone-200 bg-[#f4faf7] sm:w-[48%] p-5 flex flex-col justify-center">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                  {isHi ? 'संस्थागत थोक मूल्य' : 'INSTITUTIONAL BULK PRICE'}
                </span>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-2xl lg:text-3xl font-bold text-emerald-700">
                    ₹{bulkLabel}
                  </span>
                  <span className="text-xs font-bold text-emerald-900/80 bg-emerald-200/50 px-2 py-0.5 rounded-md">
                    {isHi ? `न्यूनतम ${product.moq} इकाई` : `MOQ: ${product.moq} units`}
                  </span>
                </div>
              </div>
            </div>

            {/* Details: CRAFT STORY & DESCRIPTION Section Styled as Soft-Gray Card */}
            <section className="p-5 rounded-2xl bg-stone-100 border border-stone-200/70 shadow-2xs space-y-2">
              <h2 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                {isHi ? 'शिल्प कथा एवं विवरण' : 'CRAFT STORY & DESCRIPTION'}
              </h2>
              <p className="text-sm text-stone-700 leading-relaxed">
                {displayDescription}
              </p>
            </section>

            {/* WhatsApp Share Feature & Actions */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row items-stretch gap-3">
                {/* Large Green "Share via WhatsApp" Action Button */}
                <button
                  id="whatsapp-share-btn"
                  type="button"
                  onClick={handleShare}
                  aria-label={isHi ? 'व्हाट्सएप पर साझा करें' : 'Share via WhatsApp'}
                  className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-base flex items-center justify-center gap-3 shadow-lg hover:shadow-xl active:scale-[0.98] transition-all cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current shrink-0" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                  </svg>
                  <span>{isHi ? 'व्हाट्सएप पर शेयर करें' : 'Share via WhatsApp'}</span>
                </button>

                {/* Secondary Copy Link Button */}
                <button
                  id="copy-link-btn"
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full sm:w-auto py-4 px-5 rounded-2xl bg-white hover:bg-stone-100 text-[#2e241e] font-bold text-sm flex items-center justify-center gap-2 border border-stone-300 shadow-xs active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                    {copied ? 'check' : 'link'}
                  </span>
                  <span>{copied ? (isHi ? 'कॉपी हुआ!' : 'Copied!') : (isHi ? 'लिंक कॉपी करें' : 'Copy Link')}</span>
                </button>
              </div>

              {/* Message preview helper for artisans */}
              {shareUrl && (
                <button
                  type="button"
                  onClick={handlePreviewMessage}
                  className="text-left text-xs text-stone-500 hover:text-stone-700 transition-colors cursor-pointer"
                >
                  {isHi ? '👁️ खरीदार को दिखने वाले संदेश का पूर्वावलोकन करें' : '👁️ Preview the exact WhatsApp message buyers will receive'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

