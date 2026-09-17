import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { INITIAL_PRODUCTS } from './Catalog';
import {
  buildProductUrl,
  formatWhatsAppMessage,
  shareViaWhatsApp,
  formatPrice,
} from '../utils/whatsappShare';

/**
 * PublicProduct.jsx — Customer-Facing Product Detail Page (PDP)
 * ─────────────────────────────────────────────────────────────────────────────
 * Facilitates direct WhatsApp business transactions between rural artisans
 * and institutional/retail buyers across India.
 *
 * Route: /product/:id
 * ─────────────────────────────────────────────────────────────────────────────
 */
function normalizeProduct(row, fallbackArtisan = 'Master Artisan') {
  if (!row) return null;

  const retail = Number(row.retail_price ?? row.price ?? row.suggested_retail_price_inr ?? 0);
  const bulk = Number(row.bulk_price ?? row.wholesale_price ?? Math.round(retail * 0.72));
  const moqVal = Number(row.moq ?? row.min_order_quantity ?? 20);

  return {
    id: row.id,
    title_en: row.title_en || row.title || 'Handcrafted Craft',
    title_hi: row.title_hi || row.hindi_title || '',
    image_url:
      row.image_url ||
      row.image ||
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
    category: row.category || row.gem_category || 'Handicrafts & Traditional Artware',
    hsn_code: row.hsn_code || '69120010',
    unspsc_code: row.unspsc_code || '60121002',
    retail_price: retail,
    bulk_price: bulk,
    moq: moqVal,
    location: row.location || row.craft_origin || 'Jaipur, Rajasthan',
    artisan_name: row.artisan_name || row.artisan || fallbackArtisan,
    description: row.description || row.craft_story || '',
    hindi_description: row.hindi_description || row.description_hi || '',
    status: row.status || 'live',
    is_gem_ready: row.is_gem_ready ?? true,
  };
}

export default function PublicProduct() {
  const { id, productId } = useParams();
  const effectiveId = id || productId;
  const { language, showToast, artisanName } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct] = useState(() => {
    if (!effectiveId) return null;
    const seeded = INITIAL_PRODUCTS.find((p) => String(p.id) === String(effectiveId));
    return seeded ? normalizeProduct(seeded, artisanName) : null;
  });

  const [loading, setLoading] = useState(() => {
    if (!effectiveId) return false;
    const seeded = INITIAL_PRODUCTS.find((p) => String(p.id) === String(effectiveId));
    return !seeded;
  });

  const [copied, setCopied] = useState(false);

  // Fetch product from Supabase products table using effectiveId
  useEffect(() => {
    let isMounted = true;

    async function fetchProduct() {
      if (!effectiveId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', effectiveId)
          .maybeSingle();

        if (error) {
          console.warn('[PublicProduct] Supabase fetch notice:', error.message);
        }

        if (isMounted) {
          if (data) {
            setProduct(normalizeProduct(data, artisanName));
          } else {
            // Local fallback if seeded
            const seeded = INITIAL_PRODUCTS.find((p) => String(p.id) === String(effectiveId));
            if (seeded) {
              setProduct(normalizeProduct(seeded, artisanName));
            } else {
              setProduct(null);
            }
          }
        }
      } catch (err) {
        console.warn('[PublicProduct] Fallback notice:', err?.message || err);
        if (isMounted) {
          const seeded = INITIAL_PRODUCTS.find((p) => String(p.id) === String(effectiveId));
          if (seeded) setProduct(normalizeProduct(seeded, artisanName));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchProduct();
    return () => {
      isMounted = false;
    };
  }, [effectiveId, artisanName]);

  const isHi = language === 'hi';

  const shareUrl = useMemo(
    () => (product ? buildProductUrl(product.id) : (typeof window !== 'undefined' ? window.location.href : '')),
    [product]
  );

  const handleWhatsAppOrder = () => {
    if (!product) return;
    shareViaWhatsApp({
      title: product.title_en,
      artisanName: product.artisan_name,
      price: product.retail_price,
      url: shareUrl,
      language,
    });
  };

  const handleCopyLink = async () => {
    if (!product) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      showToast?.(isHi ? '✅ उत्पाद लिंक कॉपी किया गया!' : '✅ Product link copied!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast?.(isHi ? 'लिंक कॉपी नहीं हो सका' : 'Could not copy link');
    }
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
    <div className="w-full min-h-screen bg-[#fdf9f3] text-[#2e241e] flex flex-col">
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

      {/* ── Top Public Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 px-3 sm:px-8 py-2.5 sm:py-3.5 flex items-center justify-between shadow-xs gap-2">
        <Link to="/home" className="flex items-center gap-2 sm:gap-2.5 group min-w-0">
          <img
            src="/shilp-setu-logo.png"
            alt="Shilp Setu"
            className="h-8 sm:h-10 w-auto object-contain group-hover:scale-105 transition-transform shrink-0"
          />
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm sm:text-base text-stone-900 tracking-tight leading-tight truncate">
              Shilp Setu
            </span>
            <span className="text-[10px] text-stone-500 font-semibold truncate hidden sm:inline">
              {isHi ? 'प्रमाणित कारीगर बाज़ार' : 'Verified Artisan Storefront'}
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <LanguageSwitcher />
          <Link
            to="/catalog"
            className="px-3 sm:px-3.5 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all"
          >
            {isHi ? 'सभी शिल्प' : 'All Crafts'}
          </Link>
        </div>
      </header>

      {/* ── Main Content Area ─────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 w-full">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-4 sm:mb-6">
          <ol className="flex items-center gap-2 text-xs font-semibold text-stone-500 uppercase tracking-wider truncate">
            <li className="shrink-0">
              <Link to="/home" className="hover:text-[#9c441c] transition-colors">
                {isHi ? 'आवास' : 'Home'}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="shrink-0">
              <Link to="/catalog" className="hover:text-[#9c441c] transition-colors">
                {isHi ? 'कैटलॉग' : 'Catalog'}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-[#9c441c] truncate max-w-[12rem] sm:max-w-[16rem]" aria-current="page">
              {product.title_en}
            </li>
          </ol>
        </nav>

        {/* 2-Column Responsive E-Commerce Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* ════ Left Column: Visual Container & Artisan Profile ════ */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {/* Large product image container */}
            <div className="relative w-full aspect-square rounded-2xl sm:rounded-3xl overflow-hidden bg-[#191312] border border-stone-300/40 shadow-xl group">
              <img
                src={product.image_url}
                alt={product.title_en}
                className="w-full h-full object-contain p-3 sm:p-4 transition-transform duration-500 group-hover:scale-105"
                loading="eager"
              />

              {/* Absolute floating badge 1: Live & Verified */}
              <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-10 flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-950/85 backdrop-blur-md border border-emerald-500/50 text-emerald-300 text-[10px] sm:text-xs font-bold shadow-lg">
                <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{isHi ? 'लाइव' : 'Live & Verified'}</span>
              </div>

              {/* Absolute floating badge 2: GeM & ONDC Ready */}
              <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10 flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-amber-950/85 backdrop-blur-md border border-amber-500/50 text-amber-300 text-[10px] sm:text-xs font-bold shadow-lg">
                <span className="material-symbols-outlined text-[13px] sm:text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified_user
                </span>
                <span>{isHi ? 'GeM व ONDC' : 'GeM & ONDC'}</span>
              </div>

              {/* Bottom-left location pin overlay */}
              <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 z-10 flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-white text-[10px] sm:text-xs font-medium shadow-md">
                <span className="material-symbols-outlined text-[14px] sm:text-[16px] text-[#ff9062]">location_on</span>
                <span>{product.location}</span>
              </div>
            </div>

            {/* Verified Artisan Profile Card */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#d1c4bd]/60 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#f1ede7] border-2 border-emerald-500 flex items-center justify-center shrink-0 shadow-sm text-stone-700 font-bold text-lg">
                  {product.artisan_name?.charAt(0) || 'A'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm text-[#2e241e]">
                      {product.artisan_name}
                    </h3>
                    <span className="material-symbols-outlined text-[16px] text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>
                      verified
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    {isHi ? 'प्रमाणित हस्तशिल्प क्लस्टर कारीगर' : 'Master Craftsperson • Direct Origin'}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                {isHi ? 'सीधा संपर्क' : 'Direct Producer'}
              </span>
            </div>
          </div>

          {/* ════ Right Column: Product Taxonomy, Pricing & WhatsApp Action ════ */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            {/* Taxonomy Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#f1ede7] text-stone-700 text-xs font-bold tracking-wide uppercase">
                {product.category}
              </span>
              <span className="px-3 py-1 rounded-full bg-stone-100 text-stone-600 text-xs font-mono font-semibold">
                HSN: {product.hsn_code}
              </span>
              <span className="px-3 py-1 rounded-full bg-stone-100 text-stone-600 text-xs font-mono font-semibold">
                UNSPSC: {product.unspsc_code}
              </span>
            </div>

            {/* Product Titles */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#2e241e] tracking-tight leading-tight">
                {product.title_en}
              </h1>
              {product.title_hi && (
                <p className="text-lg sm:text-xl font-bold text-[#9c441c] mt-1.5">
                  {product.title_hi}
                </p>
              )}
            </div>

            {/* Pricing Section (Direct Retail & Institutional Bulk) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Retail Price Card */}
              <div className="bg-white rounded-2xl p-5 border-2 border-[#9c441c]/30 shadow-md flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
                    {isHi ? 'खुदरा मूल्य (Direct Retail)' : 'Direct Retail Price'}
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-black text-[#9c441c] tracking-tight">
                      {retailLabel}
                    </span>
                    <span className="text-xs text-stone-400 font-medium">/ unit</span>
                  </div>
                </div>
                <p className="text-[11px] text-stone-500 mt-2">
                  {isHi ? '1 पीस हेतु सीधा उपभोक्ता मूल्य' : 'Individual pieces direct from maker'}
                </p>
              </div>

              {/* Bulk / Institutional Rate Card */}
              <div className="bg-white rounded-2xl p-5 border border-[#d1c4bd]/60 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                      {isHi ? 'थोक व संस्थागत दर' : 'Institutional / Bulk'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      MOQ: {product.moq}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-emerald-700 tracking-tight">
                      {bulkLabel}
                    </span>
                    <span className="text-xs text-stone-400 font-medium">/ unit</span>
                  </div>
                </div>
                <p className="text-[11px] text-stone-500 mt-2">
                  {isHi ? `न्यूनतम ${product.moq} पीस हेतु थोक भाव` : `Special rate for orders >= ${product.moq} units`}
                </p>
              </div>
            </div>

            {/* Craft Story & Description */}
            <div className="bg-white rounded-2xl p-5 border border-[#d1c4bd]/60 shadow-sm flex flex-col gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#9c441c]">history_edu</span>
                <span>{isHi ? 'शिल्प गाथा एवं विवरण' : 'Craft Story & Description'}</span>
              </h3>
              <p className="text-sm text-stone-700 leading-relaxed">
                {displayDescription}
              </p>
            </div>

            {/* ════ MASSIVE WHATSAPP ACTION BUTTON ════ */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                id="order-via-whatsapp-btn"
                onClick={handleWhatsAppOrder}
                className="w-full py-3.5 sm:py-5 px-4 sm:px-6 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1caa50] text-white shadow-xl shadow-[#25D366]/25 hover:shadow-2xl hover:shadow-[#25D366]/40 flex items-center justify-between gap-3 sm:gap-4 transition-all transform active:scale-98 cursor-pointer group"
              >
                <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                    </svg>
                  </div>
                  <div className="flex flex-col text-left min-w-0">
                    <span className="text-sm sm:text-lg font-black text-white leading-tight truncate">
                      {isHi ? 'व्हाट्सएप पर आर्डर करें' : 'Order Directly on WhatsApp'}
                    </span>
                    <span className="text-[11px] sm:text-xs text-white/90 leading-tight truncate">
                      {isHi ? 'सीधे कारीगर से चैट शुरू करें • सर्वोत्तम मूल्य' : 'Chat directly with artisan • Instant confirmation'}
                    </span>
                  </div>
                </div>

                <span className="material-symbols-outlined text-[20px] sm:text-[24px] text-white group-hover:translate-x-1 transition-transform shrink-0">
                  arrow_forward
                </span>
              </button>

              {/* Secondary Actions: Copy Link and Catalog View */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  type="button"
                  id="copy-link-pdp-btn"
                  onClick={handleCopyLink}
                  className={`flex-1 py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer ${
                    copied
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-white hover:bg-stone-50 text-stone-700 border-[#d1c4bd]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {copied ? 'check' : 'content_copy'}
                  </span>
                  <span>{copied ? (isHi ? 'लिंक कॉपी हो गया!' : 'Copied! ✅') : (isHi ? 'लिंक कॉपी करें' : 'Copy Link')}</span>
                </button>

                <Link
                  to="/catalog"
                  className="flex-1 py-3 px-4 rounded-xl bg-white hover:bg-stone-50 border border-[#d1c4bd] text-stone-700 text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 text-center"
                >
                  <span className="material-symbols-outlined text-[18px]">storefront</span>
                  <span>{isHi ? 'कारीगर की दुकान' : 'View Storefront'}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="mt-12 bg-white border-t border-stone-200 py-6 px-4 text-center">
        <p className="text-xs text-stone-500 font-medium">
          {isHi
            ? 'शिल्प सेतु — भारत सरकार के ओएनडीसी व जीईएम नेटवर्क से प्रमाणित कारीगर बाज़ार'
            : 'Shilp Setu — Government of India ONDC & GeM certified artisan linkage network'}
        </p>
      </footer>
    </div>
  );
}
