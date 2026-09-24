import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import useAudioAssistant from '../hooks/useAudioAssistant';
import { clearStaleCatalogCache } from '../utils/cacheCleaner';
import { handleAddCraftNavigation } from '../utils/authGuard';
import HaatEventCard from '../components/HaatEventCard';
import RestockModal from '../components/RestockModal';
import MoqBadge from '../components/MoqBadge';

export default function Home({ customArtisanName } = {}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language, showToast, session, artisanName: contextArtisanName } = useAuth();
  const { speakPrompt, stop } = useAudioAssistant();

  // Contextual voice prompt for zero-literacy artisans on landing screen
  useEffect(() => {
    const timer = setTimeout(() => {
      speakPrompt('home');
    }, 600);

    return () => {
      clearTimeout(timer);
      stop();
    };
  }, [speakPrompt, stop, language]);
  const fallback = t('home.welcome', 'Artisan');
  const artisanName =
    customArtisanName ||
    contextArtisanName ||
    session?.user?.user_metadata?.full_name ||
    session?.user?.user_metadata?.name ||
    fallback;

  // Metric Card Interactive States
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [dismissTip, setDismissTip] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Dynamic filtering based on search query across title, hsn_code, category
  const filteredProducts = products.filter((product) => {
    const query = searchQuery.toLowerCase();
    return (
      (product.title && product.title.toLowerCase().includes(query)) ||
      (product.hsn_code && product.hsn_code.toLowerCase().includes(query)) ||
      (product.category && product.category.toLowerCase().includes(query))
    );
  });

  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(language === 'hi' ? 'आपके ब्राउज़र में वॉयस सर्च समर्थित नहीं है।' : 'Voice search is not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      setSearchQuery(transcript);
      setIsSearchOpen(true);
    };
    recognition.start();
  };

  // Dynamic Inventory Metric Calculation from real products
  const lowStockProducts = products.filter((p) => Number(p.stock ?? 0) <= 5);
  const totalStockCount = products.reduce((acc, p) => acc + Number(p.stock ?? 0), 0);

  // Live Fetching of real rows from Supabase items table
  useEffect(() => {
    clearStaleCatalogCache();

    async function loadLiveProducts() {
      setIsLoading(true);
      try {
        let query = supabase.from('items').select('*');
        if (session?.user?.id) {
          query = query.or(`artisan_id.eq.${session.user.id},user_id.eq.${session.user.id}`);
        }
        const { data, error } = await query.order('created_at', { ascending: false });

        if (!error && data) {
          setProducts(data);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.warn('Error fetching live products on Home:', err);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadLiveProducts();
  }, [session?.user?.id]);

  const handleUpdateStock = () => {
    setShowRestockModal(false);
    const msg = language === 'hi'
      ? `✅ स्टॉक बदलकर ${stockQty} इकाइयां किया गया!`
      : `✅ Inventory stock updated to ${stockQty} units!`;
    if (showToast) showToast(msg);
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  return (
    <div className="w-full">
      <main className="flex-1 flex flex-col relative w-full min-h-screen bg-[#fdf9f3] overflow-y-auto">
        <div className="flex flex-col w-full pb-10">
            <div
                className="border-b border-[#d1c4bd]/40 px-3 sm:px-6 lg:px-8 py-3.5 sm:py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center justify-between w-full md:w-auto">
                    <div className="flex flex-col">
                        <div
                            className="flex items-center gap-2 text-[11px] sm:text-[12px] font-semibold text-secondary uppercase tracking-wider">
                            <span>{t('sidebar.home', 'Home')}</span>
                            <span>/</span>
                            <span>{t('dashboard.breadcrumb', 'Artisan Dashboard')}</span>
                        </div>
                        <h2 className="text-xl sm:text-[24px] font-bold text-primary mt-0.5">
                            {language === 'hi' ? `स्वागत है, ${artisanName}!` : `Welcome, ${artisanName}!`}
                        </h2>
                    </div>
                </div>
                
                {/* Responsive Search Container */}
                <div className="relative flex items-center justify-end w-full md:w-auto">
                  
                  {/* Mobile Search Toggle Button */}
                  <button 
                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                    className="md:hidden p-2 text-stone-500 hover:text-amber-700 transition-colors"
                    aria-label="Toggle search"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>

                  {/* Search Input Field */}
                  <div className={`
                    absolute right-0 top-full mt-2 w-64 bg-white shadow-lg rounded-xl border border-stone-200 z-50 p-2
                    md:relative md:top-auto md:mt-0 md:w-64 md:bg-transparent md:shadow-none md:border-none md:p-0 md:flex
                    ${isSearchOpen ? 'block' : 'hidden'} 
                  `}>
                    <div className="relative w-full">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none hidden md:flex">
                        <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        className="block w-full p-2 md:pl-10 text-sm text-stone-900 border border-stone-300 rounded-lg bg-stone-50 focus:ring-amber-500 focus:border-amber-500 transition-all"
                        placeholder="Search products, HSN..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus={isSearchOpen}
                      />
                    </div>
                  </div>
                </div>
            </div>
            <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col gap-6 max-w-7xl mx-auto w-full">
                
                {/* Hero AI Studio Banner (Internationalized Header) */}
                <Header />
                
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Live Products -> Route to Catalog */}
                    <div
                        onClick={() => navigate('/catalog')}
                        className="p-5 rounded-2xl bg-[#f7f3ed] border border-[#d1c4bd]/40 shadow-sm flex flex-col justify-between hover:shadow-md cursor-pointer active:scale-95 transition-transform"
                    >
                        <div className="flex items-center justify-between">
                            <span className="w-10 h-10 rounded-xl bg-[#ebe8e2] flex items-center justify-center text-[#9c441c]">
                                <span className="material-symbols-outlined text-[22px]">storefront</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-[#9c441c] font-bold text-[12px] bg-[#ff9062]/15 px-2 py-0.5 rounded-full">
                                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                                <span>{t('home.this_week', '+2 this wk')}</span>
                            </span>
                        </div>
                        <div className="mt-4">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">
                                {t('home.live_products', 'Live Products')}
                            </span>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-[32px] font-bold text-primary">{products.length}</span>
                                <span className="text-[14px] text-on-surface-variant font-medium">
                                    {t('home.in_shop', 'listed in shop')}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Card 2: Recent Views -> Shopper Insights Modal */}
                    <div
                        onClick={() => setShowInsightsModal(true)}
                        className="p-5 rounded-2xl bg-[#f7f3ed] border border-[#d1c4bd]/40 shadow-sm flex flex-col justify-between hover:shadow-md cursor-pointer active:scale-95 transition-transform"
                    >
                        <div className="flex items-center justify-between">
                            <span className="w-10 h-10 rounded-xl bg-[#ebe8e2] flex items-center justify-center text-[#9c441c]">
                                <span className="material-symbols-outlined text-[22px]">visibility</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-[#9c441c] font-bold text-[12px] bg-[#ff9062]/15 px-2 py-0.5 rounded-full">
                                <span className="material-symbols-outlined text-[14px]">north_east</span> +18%
                            </span>
                        </div>
                        <div className="mt-4">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">
                                {t('home.recent_views', 'Recent Views')}
                            </span>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-[32px] font-bold text-primary">45</span>
                                <span className="text-[14px] text-on-surface-variant font-medium">
                                    {t('home.shoppers_reached', 'shoppers reached')}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Card 3: Store Activity -> Route to Orders */}
                    <div
                        onClick={() => navigate('/orders')}
                        className="p-5 rounded-2xl bg-[#f7f3ed] border border-[#d1c4bd]/40 shadow-sm flex flex-col justify-between hover:shadow-md cursor-pointer active:scale-95 transition-transform"
                    >
                        <div className="flex items-center justify-between">
                            <span className="w-10 h-10 rounded-xl bg-[#ebe8e2] flex items-center justify-center text-[#9c441c]">
                                <span className="material-symbols-outlined text-[22px]">insights</span>
                            </span>
                            <span className="text-[11px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                {t('home.healthy', 'Healthy')}
                            </span>
                        </div>
                        <div className="mt-3 flex items-end justify-between">
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">
                                    {t('home.store_activity', 'Store Activity')}
                                </span>
                                <span className="text-[14px] font-bold text-primary block mt-0.5">
                                    {t('home.inquiries_today', '3 Inquiries Today')}
                                </span>
                            </div>
                            <div className="flex items-end gap-1.5 h-8">
                                <div className="w-2.5 h-3 bg-[#d1c4bd] rounded-t"></div>
                                <div className="w-2.5 h-4 bg-[#d1c4bd] rounded-t"></div>
                                <div className="w-2.5 h-6 bg-[#9c441c] rounded-t"></div>
                                <div className="w-2.5 h-5 bg-[#d1c4bd] rounded-t"></div>
                                <div className="w-2.5 h-8 bg-[#2e241e] rounded-t"></div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Card 4: Inventory Alert -> Dynamic Quick Restock Modal */}
                    <div
                        onClick={() => setShowRestockModal(true)}
                        className={`p-5 rounded-2xl ${
                            lowStockProducts.length > 0 ? 'bg-[#ff9062]/10 border-[#ff9062]/30' : 'bg-[#f7f3ed] border-[#d1c4bd]/40'
                        } border shadow-sm flex flex-col justify-between hover:shadow-md cursor-pointer active:scale-95 transition-transform`}
                    >
                        <div className="flex items-center justify-between">
                            <span className={`w-10 h-10 rounded-xl ${
                                lowStockProducts.length > 0 ? 'bg-[#ff9062]/20 text-[#9c441c]' : 'bg-[#ebe8e2] text-primary'
                            } flex items-center justify-center`}>
                                <span className="material-symbols-outlined text-[22px]">
                                    {lowStockProducts.length > 0 ? 'notification_important' : 'inventory_2'}
                                </span>
                            </span>
                            <span className={`text-[11px] font-bold uppercase ${
                                lowStockProducts.length > 0 ? 'text-[#9c441c] bg-white' : 'text-emerald-800 bg-emerald-100'
                            } px-2 py-0.5 rounded-full shadow-sm`}>
                                {lowStockProducts.length > 0 
                                    ? (language === 'hi' ? 'अल्प स्टॉक' : 'Low Stock')
                                    : (language === 'hi' ? 'पर्याप्त स्टॉक' : 'In Stock')}
                            </span>
                        </div>
                        <div className="mt-4">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9c441c] block">
                                {t('home.inventory_alert', 'Inventory Alert')}
                            </span>
                            <div className="mt-1.5 flex flex-col items-start gap-2.5">
                                <span className="text-[22px] font-bold text-primary leading-none">
                                    {lowStockProducts.length > 0
                                        ? `${lowStockProducts.length} ${language === 'hi' ? 'अल्प-स्टॉक शिल्प' : 'Low Stock'}`
                                        : `${totalStockCount} ${language === 'hi' ? 'कुल स्टॉक' : 'In Stock'}`}
                                </span>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowRestockModal(true);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#9c441c] hover:bg-[#7e3514] text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                                >
                                    <span>
                                        {lowStockProducts.length > 0
                                            ? (language === 'hi' ? 'स्टॉक रीस्टॉक करें →' : 'Restock Items →')
                                            : (language === 'hi' ? 'स्टॉक समायोजित करें →' : 'Adjust Stock →')}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* ── Government Opportunities & Live Fairs ── */}
                <HaatEventCard currentLang={language || 'hi'} />

                {/* Recent Uploads / Search Results Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <h3 className="text-lg sm:text-[22px] font-bold text-primary">
                            {searchQuery.trim() ? (language === 'hi' ? 'खोज परिणाम' : 'Search Results') : t('home.recent_uploads', 'Recent Uploads')}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#ebe8e2] text-secondary font-bold text-[11px] sm:text-[12px]">
                            {searchQuery.trim() 
                                ? `${filteredProducts.length} ${language === 'hi' ? 'शिल्प मिले' : 'crafts found'}` 
                                : `${products.length} ${products.length === 1 ? (language === 'hi' ? 'सक्रिय शिल्प' : 'Active Craft') : (language === 'hi' ? 'सक्रिय शिल्प' : 'Active Crafts')}`}
                        </span>
                        {searchQuery.trim() && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="text-xs font-semibold text-[#9c441c] hover:underline cursor-pointer"
                            >
                                {language === 'hi' ? 'खोज साफ़ करें ✕' : 'Clear search ✕'}
                            </button>
                        )}
                        {!searchQuery.trim() && (
                            <span className="text-[13px] text-on-surface-variant hidden md:inline">
                                {t('home.ready_buyers', 'Ready to show international buyers')}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => navigate('/catalog')}
                        className="text-[13px] sm:text-[14px] text-secondary hover:text-primary font-bold flex items-center gap-1 transition-colors cursor-pointer bg-transparent border-0 self-start sm:self-auto"
                        type="button"
                    >
                        <span>{t('home.view_all_catalog', 'View All Catalog Items')}</span>
                        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                </div>
                
                {/* Product Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {isLoading ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-12">
                            <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin mb-3" />
                            <p className="text-xs font-semibold text-on-surface-variant">
                                {language === 'hi' ? 'कैटलॉग लोड हो रहा है...' : 'Loading crafts...'}
                            </p>
                        </div>
                    ) : products.length === 0 ? (
                        /* Zero-Literacy Empty State */
                        <div className="col-span-full rounded-2xl border border-[#d1c4bd]/40 bg-[#f7f3ed] p-8 sm:p-12 flex flex-col items-center justify-center text-center">
                            <div className="relative mb-5">
                                <div className="w-20 h-20 rounded-full bg-[#ebe8e2] flex items-center justify-center text-primary shadow-inner">
                                    <span className="material-symbols-outlined text-[40px] text-[#9c441c]">palette</span>
                                </div>
                                <button
                                    onClick={(e) => handleAddCraftNavigation(navigate, e)}
                                    aria-label="Add your first craft"
                                    className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-[#9c441c] text-white flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer border-2 border-white"
                                    type="button"
                                >
                                    <span className="material-symbols-outlined text-[20px]">add</span>
                                </button>
                            </div>
                            <h4 className="text-xl font-bold text-primary mb-2">
                                {language === 'hi'
                                    ? 'कोई शिल्प अभी सूचीबद्ध नहीं है। अपना पहला शिल्प जोड़ने के लिए + दबाएं।'
                                    : 'No crafts listed yet. Tap + to add your first craft.'}
                            </h4>
                            <p className="text-sm text-on-surface-variant max-w-sm mb-6 font-normal">
                                {language === 'hi'
                                    ? 'कैमरा या आवाज़ से अपने हस्तशिल्प को तुरंत कैटलॉग करें'
                                    : 'Snap a photo or speak product details to create your first listing in seconds.'}
                            </p>
                            <button
                                onClick={(e) => handleAddCraftNavigation(navigate, e)}
                                className="h-12 px-7 rounded-full bg-[#9c441c] hover:bg-[#7e3514] text-white font-bold text-sm flex items-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer"
                                type="button"
                            >
                                <span className="material-symbols-outlined text-[20px]">add_a_photo</span>
                                <span>{language === 'hi' ? '+ पहला शिल्प जोड़ें' : '+ Add First Craft'}</span>
                            </button>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="col-span-full text-center py-10 text-stone-500">
                            No products match your search.
                        </div>
                    ) : (
                        <>
                            {filteredProducts.map((product) => {
                                const isLow = (product.stock || product.qty || product.min_order_quantity || 1) <= 2;
                                return (
                                    <div
                                        key={product.id}
                                        onClick={() => navigate(`/details/${product.id}`, { state: { product } })}
                                        className="rounded-2xl bg-[#f7f3ed] border border-[#d1c4bd]/40 overflow-hidden shadow-sm flex flex-col group cursor-pointer hover:shadow-lg transition-all active:scale-[0.99]"
                                    >
                                        <div className="relative w-full aspect-[4/5] bg-[#ebe8e2] overflow-hidden">
                                            <img
                                                alt={product.title || product.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                src={product.image_url || product.image || ''}
                                            />
                                            <div className="absolute top-3 left-3">
                                                <span
                                                    className={`px-2.5 py-1 rounded-full backdrop-blur-md font-bold text-[11px] shadow-sm ${
                                                        isLow ? 'bg-[#ba1a1a] text-white' : 'bg-[#fdf9f3]/90 text-primary'
                                                    }`}
                                                >
                                                    {isLow
                                                        ? t('home.low_stock_badge', { count: product.stock || 1, defaultValue: `Low Stock (${product.stock || 1})` })
                                                        : t('home.in_stock_badge', { count: product.stock || 10, defaultValue: `In Stock (${product.stock || 10})` })}
                                                </span>
                                            </div>
                                            <button
                                                aria-label={t('home.view', 'View details')}
                                                title={t('home.view', 'View details')}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/details/${product.id}`, { state: { product } });
                                                }}
                                                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-[#fdf9f3]/90 text-primary backdrop-blur-md flex items-center justify-center shadow-md hover:bg-white group-hover:bg-[#9c441c] group-hover:text-white transition-all cursor-pointer"
                                                type="button"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                                            </button>
                                        </div>
                                        <div className="p-4 flex flex-col gap-1 flex-1 justify-between">
                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">
                                                        {product.gem_category || product.category || 'Handicrafts'}
                                                    </span>
                                                    <span className="text-[11px] font-bold text-[#9c441c] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                                                        <span>{t('catalog.views', 'View')}</span>
                                                        <span>→</span>
                                                    </span>
                                                </div>
                                                <h4 className="text-[16px] font-bold text-primary truncate mt-0.5 group-hover:text-[#9c441c] transition-colors">
                                                    {(language === 'hi' && (product.hindi_title || product.title_hi))
                                                        ? (product.hindi_title || product.title_hi)
                                                        : (product.title || product.name)}
                                                </h4>
                                            </div>
                                            <div className="flex items-baseline justify-between pt-3 border-t border-[#d1c4bd]/30 mt-2">
                                                <span className="text-[18px] font-bold text-primary flex items-center gap-1">
                                                    ✨ ₹{product.price}
                                                </span>
                                                <MoqBadge
                                                    product={product}
                                                    onMoqUpdated={(id, updatedMoq) => {
                                                        setProducts((prev) =>
                                                            prev.map((p) =>
                                                                p.id === id ? { ...p, moq: updatedMoq, min_order_quantity: updatedMoq } : p
                                                            )
                                                        );
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Add New Craft Quick Action */}
                            <div
                                className="rounded-2xl border-2 border-dashed border-[#d1c4bd] bg-[#f7f3ed]/60 hover:bg-[#f7f3ed] flex flex-col items-center justify-center p-6 text-center shadow-sm transition-all cursor-pointer group min-h-[300px]"
                                onClick={(e) => handleAddCraftNavigation(navigate, e)}
                            >
                                <div
                                    className="w-16 h-16 rounded-full bg-[#ebe8e2] group-hover:bg-[#2e241e] group-hover:text-white flex items-center justify-center text-primary mb-3 shadow-inner transition-colors duration-200">
                                    <span className="material-symbols-outlined text-[30px]">add_a_photo</span>
                                </div>
                                <p className="text-[18px] font-bold text-primary">
                                    {t('home.add_new_listing', 'Add New Listing')}
                                </p>
                                <p className="text-[13px] text-on-surface-variant mt-1.5 max-w-[200px]">
                                    {t('home.voice_listing_desc', 'Tap to snap camera or speak product details')}
                                </p>
                                <span
                                    className="inline-flex items-center gap-1.5 text-[12px] font-bold text-secondary uppercase tracking-wider mt-4 px-3 py-1 bg-white rounded-full border border-[#d1c4bd]/40 shadow-sm">
                                    <span className="material-symbols-outlined text-[16px]">mic</span>
                                    <span>{t('capture.start_recording', 'Voice Ready')}</span>
                                </span>
                            </div>
                        </>
                    )}
                </div>

                {/* Artisan's Daily Tip */}
                {!dismissTip && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-[#ffdbce]/40 border border-[#ffdbce] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm mt-2">
                        <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white flex items-center justify-center text-[#9c441c] shrink-0 shadow-sm mt-0.5 sm:mt-0">
                                <span className="material-symbols-outlined text-[22px] sm:text-[26px]">lightbulb</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm sm:text-[16px] font-bold text-primary flex flex-wrap items-center gap-2">
                                    <span>{t('home.artisan_tip_title', 'Pro Artisan Tip')}</span>
                                    <span className="text-[10px] sm:text-[11px] font-semibold text-[#9c441c] bg-white px-2 py-0.5 rounded-full">
                                        {t('home.breadcrumb', 'Artisan Best Practice')}
                                    </span>
                                </p>
                                <p className="text-xs sm:text-[14px] text-on-surface-variant mt-0.5 leading-relaxed">
                                    {t('home.artisan_tip_body', 'Clear sunlight photos and mentioning traditional techniques increases buyer interest by 40%.')}
                                </p>
                            </div>
                        </div>
                        <button aria-label="Dismiss tip"
                            onClick={() => setDismissTip(true)}
                            className="text-on-surface-variant hover:text-primary p-1.5 rounded-full hover:bg-white/60 transition-colors cursor-pointer self-end sm:self-auto shrink-0"
                            type="button">
                            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">close</span>
                        </button>
                    </div>
                )}

            </div>
        </div>

        {/* ── MODAL 1: SHOPPER INSIGHTS BOTTOM SHEET ── */}
        {showInsightsModal && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
          >
            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={() => setShowInsightsModal(false)} />

            <div className="relative w-full max-w-lg bg-[#fdf9f3] text-stone-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#d1c4bd]/60 overflow-hidden z-10 max-h-[90vh] flex flex-col">
              {/* Header Banner */}
              <div className="bg-[#1e140e] text-white p-5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#ff9062]/20 text-[#ff9062] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[24px]">visibility</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-wide">
                      {language === 'hi' ? 'दुकान दर्शक (Store Insights)' : 'Store Insights (दुकान दर्शक)'}
                    </h3>
                    <p className="text-xs text-[#d4c3ba]">
                      {language === 'hi' ? 'ओएनडीसी एवं बाज़ार नेटवर्क पर खरीदारों की पहुंच' : 'Shopper discovery across ONDC network'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInsightsModal(false)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
                  type="button"
                  aria-label="Close"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Body Content */}
              <div className="p-6 overflow-y-auto space-y-4">
                {/* Traffic summary card – dynamic total */}
                {(() => {
                  // Sort products by views desc for the modal list
                  const sortedProducts = [...products].sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
                  const totalViews = sortedProducts.reduce((sum, p) => sum + (p.views ?? 0), 0);
                  return (
                    <>
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[28px] text-amber-700">hub</span>
                          <div>
                            <span className="text-xs font-bold text-amber-950 uppercase tracking-wider block">
                              {language === 'hi' ? 'कुल ओएनडीसी दृश्य' : 'Total ONDC Traffic'}
                            </span>
                            <span className="text-2xl font-extrabold text-[#180f0a]">
                              {totalViews} {language === 'hi' ? 'दर्शक' : 'Views'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Section title */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                          {language === 'hi' ? 'शीर्ष लोकप्रिय शिल्प (ओएनडीसी नेटवर्क)' : 'Top Viewed Crafts (ONDC Network)'}
                        </span>
                      </div>

                      {/* Dynamic product rows */}
                      {sortedProducts.length === 0 ? (
                        <div className="p-4 rounded-2xl bg-[#f1ede7] text-center text-sm text-on-surface-variant">
                          {language === 'hi'
                            ? 'आपने अभी तक कोई उत्पाद अपलोड नहीं किया है।'
                            : 'You have not uploaded any products yet.'}
                        </div>
                      ) : (
                        sortedProducts.map((product) => (
                          <div key={product.id} className="p-4 rounded-2xl bg-white border border-[#d1c4bd]/60 shadow-xs flex items-center gap-4 hover:border-secondary/40 transition-colors">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.title || product.name || 'Craft'}
                                className="w-16 h-16 rounded-xl object-cover border border-outline-variant/30 shrink-0"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-xl bg-[#f1ede7] border border-outline-variant/30 flex items-center justify-center text-[#80756f] shrink-0">
                                <span className="material-symbols-outlined text-[24px]">image</span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-primary truncate">
                                {product.title || product.name || (language === 'hi' ? 'शिल्प' : 'Craft')}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                                  <span className="material-symbols-outlined text-[13px]">shopping_bag</span>
                                  <span>ONDC Network</span>
                                </span>
                                <span className="text-xs text-on-surface-variant font-semibold">
                                  • {product.views ?? 0} {language === 'hi' ? 'दर्शक' : 'views'}
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-lg font-extrabold text-primary">{product.views ?? 0}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </>
                  );
                })()}

                {/* Channel Footnote */}
                <div className="p-3 bg-[#f1ede7] rounded-xl text-xs text-on-surface-variant flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-secondary shrink-0">insights</span>
                  <span>
                    {language === 'hi'
                      ? 'Paytm, Mystore, PhonePe Pincode व Tata Neu द्वारा ग्राहक सीधे आपके शिल्प खोज रहे हैं।'
                      : 'Shoppers are directly discovering your crafts via Paytm, Mystore, PhonePe Pincode & Tata Neu.'}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-[#d1c4bd]/40 bg-[#f7f3ed] flex justify-end">
                <button
                  onClick={() => setShowInsightsModal(false)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-primary hover:bg-[#2e241e] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer"
                  type="button"
                >
                  <span>{language === 'hi' ? 'ठीक है' : 'Done'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL 2: DYNAMIC CATALOGUE RESTOCK MODAL ── */}
        <RestockModal
          isOpen={showRestockModal}
          onClose={() => setShowRestockModal(false)}
          initialProducts={products}
          onStockUpdated={(productId, newStock) => {
            setProducts((prev) =>
              prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
            );
          }}
        />

        {/* ── TOAST NOTIFICATION ── */}
        {toastMsg && (
          <div className="fixed bottom-24 sm:bottom-6 right-6 z-50 bg-[#1e140e] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
            <span className="material-symbols-outlined text-emerald-400 text-[20px]">check_circle</span>
            <span className="text-sm font-bold">{toastMsg}</span>
          </div>
        )}
      </main>
    </div>
  );
}
