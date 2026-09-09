import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { INITIAL_PRODUCTS } from './Catalog';

export default function Details() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { language, showToast } = useAuth();

  const [product, setProduct] = useState(() => {
    // 1. First priority: Passed in router state
    if (location.state?.product) {
      return location.state.product;
    }
    // 2. Second priority: Match against INITIAL_PRODUCTS
    if (id) {
      const match = INITIAL_PRODUCTS.find((p) => String(p.id) === String(id));
      if (match) return match;
    }
    // Default initial placeholder
    return INITIAL_PRODUCTS[0];
  });

  const [loading, setLoading] = useState(!location.state?.product);
  const [copied, setCopied] = useState(false);

  // Fetch product from Supabase if not found in memory
  useEffect(() => {
    async function fetchProduct() {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          setProduct({
            id: data.id,
            title: data.title || data.name,
            hindi_title: data.hindi_title || data.title_hi || '',
            description: data.description || '',
            hindi_description: data.hindi_description || data.description_hi || '',
            price: Number(data.price || 0),
            bulk_price: Number(data.bulk_price || data.wholesale_price || Math.round((data.price || 0) * 0.72)),
            min_order_quantity: Number(data.min_order_quantity || data.moq || 1),
            gem_category: data.gem_category || data.category || 'Handicrafts',
            hsn_code: data.hsn_code || '69120010',
            unspsc_code: data.unspsc_code || '60121002',
            craft_origin: data.craft_origin || 'India',
            image_url: data.image_url || data.image || 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
            is_gem_ready: data.is_gem_ready ?? true,
            status: data.status || 'live',
            category: data.category || 'Handicrafts',
            qty: data.stock || data.qty || 50,
          });
        }
      } catch (err) {
        console.warn('Could not fetch product by ID from Supabase:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id]);

  // Dynamic WhatsApp Sharing Implementation
  const handleWhatsAppShare = () => {
    const productUrl = `${window.location.origin}/details/${product.id}`;
    const name = (language === 'hi' && product.hindi_title) ? product.hindi_title : (product.title || product.name || 'Handcrafted Craft');
    const descSnippet = product.description ? `\n\n"${product.description.slice(0, 160)}${product.description.length > 160 ? '...' : ''}"` : '';
    const message = `Check out this handcrafted item on Shilp Setu!\n\n*${name}*\nPrice: ₹${product.price}${product.bulk_price ? ` (Bulk: ₹${product.bulk_price}, MOQ: ${product.min_order_quantity || 20})` : ''}${descSnippet}\n\nView details and buy here: ${productUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCopyLink = () => {
    const productUrl = `${window.location.origin}/details/${product.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(productUrl);
    }
    setCopied(true);
    if (showToast) {
      showToast(language === 'hi' ? '✅ उत्पाद लिंक क्लिपबोर्ड पर कॉपी किया गया!' : '✅ Product link copied to clipboard!');
    }
    setTimeout(() => setCopied(false), 3000);
  };

  const title = (language === 'hi' && product.hindi_title) ? product.hindi_title : (product.title || product.name || 'Handcrafted Item');
  const description = (language === 'hi' && product.hindi_description) ? product.hindi_description : (product.description || 'Authentic Indian handicraft made by master artisans using traditional techniques.');
  const category = product.category || product.gem_category || 'Handicrafts';
  const hsnCode = product.hsn_code || '69120010';
  const image = product.image_url || product.image || 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80';
  const price = product.price || 0;
  const bulkPrice = product.bulk_price || Math.round(price * 0.72);
  const moq = product.min_order_quantity || product.moq || 20;

  return (
    <div className="w-full min-h-screen bg-[#fdf9f3] text-on-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top Breadcrumb & Navigation */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-secondary uppercase tracking-wider">
            <Link to="/home" className="hover:text-primary transition-colors">
              {language === 'hi' ? 'आवास' : 'Home'}
            </Link>
            <span>/</span>
            <Link to="/catalog" className="hover:text-primary transition-colors">
              {language === 'hi' ? 'कैटलॉग' : 'Catalog'}
            </Link>
            <span>/</span>
            <span className="text-primary truncate max-w-xs">{title}</span>
          </div>

          <button
            onClick={() => navigate('/catalog')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs transition-colors cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>{language === 'hi' ? 'कैटलॉग पर वापस जाएं' : 'Back to Catalog'}</span>
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-secondary">
              {language === 'hi' ? 'शिल्प विवरण लोड हो रहा है...' : 'Loading craft details...'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ── Left Column: Large Hero Image ── */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-[#191312] border border-[#d1c4bd]/40 shadow-xl group">
                <img
                  src={image}
                  alt={title}
                  className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                />

                {/* Status Badges Overlay */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <span className="px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-emerald-800 font-extrabold text-xs shadow-md flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                    <span>{language === 'hi' ? 'सक्रिय शिल्प' : 'Live & Verified'}</span>
                  </span>
                  {product.is_gem_ready && (
                    <span className="px-3 py-1 rounded-full bg-amber-500 text-amber-950 font-bold text-xs shadow-md flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">verified</span>
                      <span>GeM & ONDC Ready</span>
                    </span>
                  )}
                </div>

                {/* Origin Stamp Overlay */}
                {product.craft_origin && (
                  <div className="absolute bottom-4 left-4 px-3.5 py-1.5 rounded-xl bg-[#191312]/80 backdrop-blur-md text-[#ffdeaa] font-bold text-xs flex items-center gap-1.5 border border-white/10 shadow-lg">
                    <span className="material-symbols-outlined text-[16px] text-[#ff9062]">location_on</span>
                    <span>{product.craft_origin}</span>
                  </div>
                )}
              </div>

              {/* Verified Artisan Studio Banner */}
              <div className="p-4 rounded-2xl bg-[#f1ede7] border border-[#e8e2d9] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#2e241e] text-[#ffdeaa] flex items-center justify-center font-bold text-base shadow-sm">
                    SS
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-primary">
                      {language === 'hi' ? 'रामेश कुम्हार • मास्टर शिल्पकार' : 'Ramesh Kumar • Master Artisan'}
                    </h4>
                    <p className="text-xs text-secondary font-medium">
                      {language === 'hi' ? 'राष्ट्रीय शिल्पकार पुरस्कार से सम्मानित' : 'Shilp Setu Certified Artisan Studio'}
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-emerald-700 text-[24px]">verified</span>
              </div>
            </div>

            {/* ── Right Column: Comprehensive Product Details & Actions ── */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              {/* Category & Title */}
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-[#ebe8e2] text-secondary font-bold text-xs uppercase tracking-wider">
                    {category}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#ffdbce] text-[#752801] font-bold text-[11px]">
                    HSN: {hsnCode}
                  </span>
                  {product.unspsc_code && (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px]">
                      UNSPSC: {product.unspsc_code}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-primary leading-tight">
                  {title}
                </h1>
                {product.hindi_title && language !== 'hi' && (
                  <p className="text-sm text-secondary font-medium mt-1">
                    {product.hindi_title}
                  </p>
                )}
              </div>

              {/* Price Display Card */}
              <div className="p-5 rounded-2xl bg-white border border-[#d1c4bd]/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-secondary uppercase tracking-wider block mb-0.5">
                    {language === 'hi' ? 'खुदरा मूल्य (Retail Price)' : 'Direct Retail Price'}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-primary">
                      ₹{price}
                    </span>
                    <span className="text-xs text-secondary font-semibold">
                      {language === 'hi' ? 'प्रति इकाई (कर सहित)' : 'per unit (all taxes incl.)'}
                    </span>
                  </div>
                </div>

                {bulkPrice > 0 && (
                  <div className="sm:border-l sm:border-[#d1c4bd]/40 sm:pl-6">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-0.5">
                      {language === 'hi' ? 'थोक व संस्थागत दर' : 'Institutional / Bulk Price'}
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-emerald-700">
                        ₹{bulkPrice}
                      </span>
                      <span className="text-xs font-bold text-emerald-900/80">
                        (MOQ: {moq} {language === 'hi' ? 'इकाइयां' : 'units'})
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider">
                  {language === 'hi' ? 'शिल्प विवरण एवं विरासत' : 'Craft Story & Description'}
                </h3>
                <p className="text-sm text-on-surface-variant leading-relaxed bg-[#f7f3ed] p-4 rounded-2xl border border-[#d1c4bd]/30">
                  {description}
                </p>
              </div>

              {/* Specification Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-white rounded-xl border border-[#d1c4bd]/40">
                  <span className="text-[11px] font-bold text-secondary block uppercase">
                    {language === 'hi' ? 'एचएसएन कोड' : 'HSN Code'}
                  </span>
                  <span className="text-sm font-extrabold text-primary">{hsnCode}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#d1c4bd]/40">
                  <span className="text-[11px] font-bold text-secondary block uppercase">
                    {language === 'hi' ? 'श्रेणी' : 'Category'}
                  </span>
                  <span className="text-sm font-bold text-primary truncate block">{category}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#d1c4bd]/40">
                  <span className="text-[11px] font-bold text-secondary block uppercase">
                    {language === 'hi' ? 'शिल्प मूल' : 'Origin'}
                  </span>
                  <span className="text-sm font-bold text-primary truncate block">{product.craft_origin || 'India'}</span>
                </div>
              </div>

              {/* ── WhatsApp Sharing & Primary Actions ── */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-[#d1c4bd]/40">
                {/* Dedicated WhatsApp Share Button */}
                <button
                  id="whatsapp-share-btn"
                  onClick={handleWhatsAppShare}
                  className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-md active:scale-95 transition-all cursor-pointer"
                  title="Share on WhatsApp"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[22px]">chat</span>
                  <span>{language === 'hi' ? 'व्हाट्सएप पर शेयर करें' : 'Share via WhatsApp'}</span>
                </button>

                {/* Direct Link Copy Button */}
                <button
                  id="copy-link-btn"
                  onClick={handleCopyLink}
                  className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-white hover:bg-[#ebe8e2] text-primary font-bold text-sm flex items-center justify-center gap-2 border border-[#d1c4bd]/60 shadow-xs active:scale-95 transition-all cursor-pointer"
                  title="Copy Direct Link"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {copied ? 'check' : 'link'}
                  </span>
                  <span>{copied ? (language === 'hi' ? 'कॉपी हुआ!' : 'Copied!') : (language === 'hi' ? 'लिंक कॉपी करें' : 'Copy Link')}</span>
                </button>

                {/* Edit in Catalog Button */}
                <button
                  onClick={() => navigate('/catalog', { state: { editProductId: product.id } })}
                  className="w-full sm:w-auto py-3.5 px-4 rounded-2xl bg-[#2e241e] hover:bg-[#180f0a] text-[#ffdeaa] font-bold text-sm flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all cursor-pointer"
                  title="Edit in Catalog"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[19px]">edit</span>
                  <span>{language === 'hi' ? 'संपादित करें' : 'Edit'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
