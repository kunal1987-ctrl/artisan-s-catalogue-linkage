import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { clearStaleCatalogCache } from '../utils/cacheCleaner';
import { handleAddCraftNavigation } from '../utils/authGuard';
import MoqBadge from '../components/MoqBadge';
import OndcSyncModal from '../components/OndcSyncModal';

export default function Catalog() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { language, user } = useAuth();
  const currentUser = user;
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // all | live | draft | sold_out
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [editingMoqId, setEditingMoqId] = useState(null);
  const [newMoq, setNewMoq] = useState(1);
  const [isSavingMoq, setIsSavingMoq] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncTargetProduct, setSyncTargetProduct] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Check for navigation toast state
  useEffect(() => {
    if (location.state?.toast) {
      showToast(location.state.toast);
      // Clean up state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Open edit / view modal if navigated with editProductId
  useEffect(() => {
    if (location.state?.editProductId && products.length > 0) {
      const match = products.find((p) => p.id === location.state.editProductId);
      if (match) {
        setSelectedProduct(match);
      }
    }
  }, [location.state?.editProductId, products]);

  // Purge any stale demo items and fetch strictly live rows from Supabase items table
  useEffect(() => {
    // Purge stale demo caches from localStorage and IndexedDB
    clearStaleCatalogCache();

    async function loadSupabaseItems() {
      setIsLoading(true);
      try {
        let query = supabase.from('items').select('*');
        if (user?.id) {
          query = query.or(`artisan_id.eq.${user.id},user_id.eq.${user.id}`);
        }
        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase items fetch error:', error);
          setProducts([]);
        } else if (data && data.length > 0) {
          const mapped = data.map((item) => ({
            id: item.id,
            title: item.title || item.name || '',
            hindi_title: item.hindi_title || item.title_hi || '',
            description: item.description || '',
            hindi_description: item.hindi_description || item.description_hi || '',
            price: Number(item.price || 0),
            bulk_price: Number(item.bulk_price || item.wholesale_price || Math.round((item.price || 0) * 0.72)),
            min_order_quantity: Number(item.min_order_quantity || item.moq || 1),
            gem_category: item.gem_category || item.category || 'Handicrafts',
            hsn_code: item.hsn_code || '69120010',
            unspsc_code: item.unspsc_code || '60121002',
            craft_origin: item.craft_origin || 'India',
            image_url: item.image_url || '',
            is_gem_ready: item.is_gem_ready ?? true,
            status: item.status === 'published' ? 'live' : (item.status || 'live'),
            category: item.category || item.gem_category || 'Handicrafts',
            qty: item.stock || item.min_order_quantity || item.moq || 1,
            artisan_id: item.artisan_id || item.user_id,
          }));
          setProducts(mapped);
        } else {
          setProducts([]);
        }
      } catch (e) {
        console.warn('Could not load items from Supabase:', e);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadSupabaseItems();
  }, [user]);

  // Handle product status toggle (live / draft / sold_out)
  const handleToggleStatus = async (productId, newStatus) => {
    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, status: newStatus } : p))
    );
    if (selectedProduct && selectedProduct.id === productId) {
      setSelectedProduct((prev) => ({ ...prev, status: newStatus }));
    }
    showToast(`Status updated: ${newStatus === 'live' ? 'Live' : newStatus === 'draft' ? 'In Review' : 'Sold Out'}`);

    // Persist to Supabase
    try {
      const dbStatus = newStatus === 'live' ? 'published' : newStatus;
      const { error } = await supabase
        .from('items')
        .update({ status: dbStatus })
        .eq('id', productId);
      if (error) console.error('Supabase update status error:', error);
    } catch (err) {
      console.error('Failed to update status in Supabase:', err);
    }
  };

  // Handle product delete with user-bound matching & optimistic UI rollback
  const handleDeleteProduct = async (productId) => {
    const previousProducts = products;
    // Optimistic UI update
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    if (selectedProduct?.id === productId) {
      setSelectedProduct(null);
    }

    try {
      let error = null;
      if (user?.id) {
        const res = await supabase
          .from('items')
          .delete()
          .eq('id', productId)
          .eq('artisan_id', user.id);
        error = res.error;
      } else {
        const res = await supabase
          .from('items')
          .delete()
          .eq('id', productId);
        error = res.error;
      }

      if (error) {
        console.error('Supabase delete error:', error);
        // Rollback optimistic update
        setProducts(previousProducts);
        showToast(language === 'hi' ? '❌ उत्पाद हटाने में विफल' : '❌ Failed to delete product');
      } else {
        showToast(language === 'hi' ? '🗑️ उत्पाद कैटलॉग से हटा दिया गया' : '🗑️ Product deleted from catalog');
      }
    } catch (err) {
      console.error('Failed to delete product from Supabase:', err);
      // Rollback optimistic update
      setProducts(previousProducts);
      showToast(language === 'hi' ? '❌ उत्पाद हटाने में विफल' : '❌ Failed to delete product');
    }
  };

  // Handle inline MOQ update
  const handleUpdateMoq = async (productId) => {
    const value = Math.max(1, Math.round(Number(newMoq) || 1));
    setIsSavingMoq(true);
    try {
      const { error } = await supabase
        .from('items')
        .update({ min_order_quantity: value, moq: value })
        .eq('id', productId);
      if (error) {
        console.error('Supabase MOQ update error:', error);
        showToast(language === 'hi' ? '❌ MOQ अपडेट विफल' : '❌ Failed to update MOQ');
      } else {
        // Optimistic local state update
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId ? { ...p, min_order_quantity: value, qty: value } : p
          )
        );
        if (selectedProduct?.id === productId) {
          setSelectedProduct((prev) => ({ ...prev, min_order_quantity: value }));
        }
        showToast(language === 'hi' ? `✅ MOQ ${value} पर अपडेट किया गया` : `✅ MOQ updated to ${value}`);
      }
    } catch (err) {
      console.error('Failed to update MOQ:', err);
      showToast(language === 'hi' ? '❌ MOQ अपडेट विफल' : '❌ Failed to update MOQ');
    } finally {
      setIsSavingMoq(false);
      setEditingMoqId(null);
    }
  };

  const handleWhatsAppShare = (product) => {
    if (!product || !product.id) return;
    const shareUrl = `${window.location.origin}/product/${product.id}`;
    const name = product.title || product.hindi_title || 'Handcrafted Craft';
    const message = `Check out this product: ${shareUrl}\n\n*${name}*\nPrice: ₹${product.price}`;
    const waLink = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waLink, '_blank');
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      showToast('Listening for voice search... बोलें');
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        setIsSearchOpen(true);
        showToast(`Searched: "${transcript}"`);
      };
      recognition.start();
    } else {
      showToast('Voice search not supported in this browser.');
    }
  };

  // Filter products based on search and active filter tab
  const filteredProducts = products.filter((product) => {
    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'live' && product.status === 'live') ||
      (activeFilter === 'draft' && product.status === 'draft') ||
      (activeFilter === 'sold_out' && product.status === 'sold_out');

    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      (product.title && product.title.toLowerCase().includes(query)) ||
      (product.hsn_code && product.hsn_code.toLowerCase().includes(query)) ||
      (product.category && product.category.toLowerCase().includes(query));

    return matchesFilter && matchesSearch;
  });

  const liveCount = products.filter(p => p.status === 'live').length;
  const draftCount = products.filter(p => p.status === 'draft').length;
  const soldOutCount = products.filter(p => p.status === 'sold_out').length;

  return (
    <div className="w-full">
      <main className="flex-1 flex flex-col relative w-full bg-surface min-h-screen">
        <div className="flex flex-col w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
          
          {/* Top Administrative Toolbar */}
          <div className="flex items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
              {t('catalog.title', 'Craft Catalog')}
            </h2>

            <div className="flex items-center gap-2 sm:gap-3">
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

              <button
                onClick={(e) => handleAddCraftNavigation(navigate, e)}
                className="bg-emerald-600 text-white px-3.5 sm:px-4 py-2 rounded-xl shadow-xs hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium transition-colors cursor-pointer active:scale-95 shrink-0"
              >
                <span>📸 + 🎙️ {t('catalog.add_item', 'Add Craft')}</span>
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-col gap-4 mb-6">

            {/* Filter Pills */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth" id="filterPillsContainer">
              <div className="flex items-center gap-2">
                <button
                  className={`shrink-0 h-10 px-4 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                    activeFilter === 'all'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-lowest border border-surface-container-high text-on-surface-variant hover:text-primary'
                  }`}
                  onClick={() => setActiveFilter('all')}
                  type="button"
                >
                  {t('catalog.all', 'All')} ({products.length})
                </button>
                <button
                  className={`shrink-0 h-10 px-4 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer ${
                    activeFilter === 'live'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-lowest border border-surface-container-high text-on-surface-variant hover:text-primary'
                  }`}
                  onClick={() => setActiveFilter('live')}
                  type="button"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-700"></span>
                  {language === 'hi' ? 'सक्रिय' : 'Live'} ({liveCount})
                </button>
                <button
                  className={`shrink-0 h-10 px-4 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer ${
                    activeFilter === 'draft'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-lowest border border-surface-container-high text-on-surface-variant hover:text-primary'
                  }`}
                  onClick={() => setActiveFilter('draft')}
                  type="button"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                  {language === 'hi' ? 'समीक्षाधीन' : 'In Review'} ({draftCount})
                </button>
                <button
                  className={`shrink-0 h-10 px-4 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer ${
                    activeFilter === 'sold_out'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-lowest border border-surface-container-high text-on-surface-variant hover:text-primary'
                  }`}
                  onClick={() => setActiveFilter('sold_out')}
                  type="button"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-error"></span>
                  {language === 'hi' ? 'बिक गया' : 'Sold Out'} ({soldOutCount})
                </button>
              </div>

              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs font-bold text-secondary hover:underline cursor-pointer"
                  type="button"
                >
                  {language === 'hi' ? 'खोज साफ़ करें' : 'Clear Search'}
                </button>
              )}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="pt-1 pb-4 mt-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-sm font-bold text-primary">
                  {language === 'hi' ? 'कैटलॉग लोड हो रहा है...' : 'Loading catalog crafts...'}
                </p>
              </div>
            ) : products.length === 0 ? (
              /* Zero-Literacy Empty State */
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto">
                <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-full bg-[#f1ede7] flex items-center justify-center text-primary shadow-inner">
                    <span className="material-symbols-outlined text-[48px] text-secondary">palette</span>
                  </div>
                  <button
                    onClick={(e) => handleAddCraftNavigation(navigate, e)}
                    aria-label="Add your first craft"
                    className="absolute -bottom-1 -right-1 w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer border-2 border-white"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[24px]">add</span>
                  </button>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-primary mb-2">
                  {language === 'hi'
                    ? 'कोई शिल्प अभी सूचीबद्ध नहीं है। अपना पहला शिल्प जोड़ने के लिए + दबाएं।'
                    : 'No crafts listed yet. Tap + to add your first craft.'}
                </h3>
                <p className="text-sm text-on-surface-variant mb-6 font-normal">
                  {language === 'hi'
                    ? 'कैमरा या आवाज़ से अपने हस्तशिल्प को तुरंत कैटलॉग करें'
                    : 'Snap a photo or speak in your language to create a market listing in seconds.'}
                </p>
                <button
                  className="h-14 px-8 rounded-full bg-primary text-on-primary font-bold text-base flex items-center gap-2.5 shadow-md hover:bg-primary/90 active:scale-95 transition-all cursor-pointer"
                  onClick={(e) => handleAddCraftNavigation(navigate, e)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[24px]">add_a_photo</span>
                  <span>{language === 'hi' ? '+ पहला शिल्प जोड़ें' : '+ Add First Craft'}</span>
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-10 text-stone-500">
                No products match your search.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" id="productsGrid">
                {filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/details/${p.id}`, { state: { product: p } })}
                    className="product-item flex flex-col bg-surface-container-lowest rounded-2xl p-3 border border-surface-container shadow-xs group relative hover:shadow-xl hover:border-secondary/40 transition-all cursor-pointer"
                  >
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-surface-container-low mb-2">
                      <img
                        alt={p.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        src={p.image_url}
                      />
                      
                      {/* Status badge */}
                      <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md flex items-center gap-1.5 shadow-sm">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            p.status === 'live'
                              ? 'bg-emerald-700 animate-pulse'
                              : p.status === 'draft'
                              ? 'bg-amber-600'
                              : 'bg-error'
                          }`}
                        ></span>
                        <span className="text-[11px] text-primary font-bold uppercase tracking-wider">
                          {p.status === 'live' 
                            ? (language === 'hi' ? 'सक्रिय' : 'Live') 
                            : p.status === 'draft' 
                            ? (language === 'hi' ? 'समीक्षा' : 'In Review') 
                            : (language === 'hi' ? 'बिक गया' : 'Sold Out')}
                        </span>
                      </div>

                      {/* Top right card actions: WhatsApp, Delete Button & Options */}
                      <div className="absolute top-1.5 right-1.5 flex items-center gap-1.5 z-10">
                        {/* Direct WhatsApp Share button on card */}
                        <button
                          aria-label={`Share ${p.title} on WhatsApp`}
                          title="Share via WhatsApp"
                          className="w-9 h-9 rounded-full bg-emerald-600/95 hover:bg-emerald-700 text-white flex items-center justify-center shadow-md active:scale-90 transition-all cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWhatsAppShare(p);
                          }}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px]">share</span>
                        </button>

                        {/* Direct Delete button on each card: only if currentUser?.id === product.artisan_id */}
                        {currentUser?.id && (currentUser.id === p.artisan_id || currentUser.id === p.user_id) && (
                          <button
                            aria-label={`Delete ${p.title}`}
                            title={language === 'hi' ? 'उत्पाद हटाएं' : 'Delete Product'}
                            className="w-9 h-9 rounded-full bg-red-600/90 hover:bg-red-700 text-white flex items-center justify-center shadow-md active:scale-90 transition-all cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProduct(p.id);
                            }}
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        )}

                        {/* Details / Actions modal button */}
                        <button
                          aria-label="Product Options"
                          className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-md text-primary flex items-center justify-center shadow-md active:scale-90 hover:bg-white transition-all cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProduct(p);
                          }}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px]">more_vert</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col flex-1 px-1 pb-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-[11px] font-bold uppercase text-secondary tracking-wider truncate">
                          {p.gem_category || p.category}
                        </span>
                        {p.is_gem_ready && (
                          <span className="text-[10px] font-bold text-amber-900 bg-amber-100/90 px-1.5 py-0.5 rounded shrink-0">
                            GeM
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-primary line-clamp-1">
                        {(language === 'hi' && p.hindi_title) ? p.hindi_title : p.title}
                      </h3>
                      {p.craft_origin && (
                        <p className="text-[10px] text-secondary font-medium flex items-center gap-0.5 mb-1">
                          <span className="material-symbols-outlined text-[12px]">location_on</span>
                          <span className="truncate">{p.craft_origin}</span>
                        </p>
                      )}
                      <div className="mt-auto flex items-center justify-between pt-1 border-t border-surface-container/60">
                        <div>
                          <span className="text-base font-extrabold text-primary">₹{p.price}</span>
                          {p.bulk_price && (
                            <span className="text-[11px] text-emerald-700 font-bold ml-1.5">
                              ({language === 'hi' ? 'थोक' : 'Bulk'}: ₹{p.bulk_price})
                            </span>
                          )}
                        </div>
                        <MoqBadge
                          product={p}
                          onMoqUpdated={(id, updatedMoq) => {
                            setProducts((prev) =>
                              prev.map((item) =>
                                item.id === id ? { ...item, min_order_quantity: updatedMoq, moq: updatedMoq } : item
                              )
                            );
                          }}
                        />
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSyncTargetProduct(p);
                          setIsSyncModalOpen(true);
                        }}
                        className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold transition cursor-pointer active:scale-95"
                      >
                        <span>🌐</span>
                        <span>Sync to ONDC</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Restock Notification banner (only if low stock products exist) */}
            {products.some((p) => p.qty <= 2) && (
              <div className="mt-6 p-4 bg-surface-container-low border border-surface-container rounded-2xl shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                    <span className="material-symbols-outlined text-[22px]">sync_saved_locally</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-primary">
                      {language === 'hi' ? 'पुनः स्टॉक अधिसूचना' : 'Instant Restock Notification'}
                    </h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {language === 'hi'
                        ? 'दुकान में कम स्टॉक वाले उत्पादों को पुनः स्टॉक करने की आवश्यकता है'
                        : 'Low stock items require replenishment in your shop'}
                    </p>
                  </div>
                </div>
                <button
                  aria-label="Add craft to restock"
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-colors cursor-pointer"
                  onClick={(e) => handleAddCraftNavigation(navigate, e)}
                  type="button"
                >
                  {language === 'hi' ? '+ स्टॉक जोड़ें' : '+ Restock Craft'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Product Quick Action Modal */}
        {selectedProduct && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setSelectedProduct(null)}
          >
            <div
              className="bg-surface-container-lowest rounded-t-3xl sm:rounded-3xl max-w-md w-full p-6 pb-8 sm:pb-6 shadow-2xl border border-surface-container flex flex-col gap-4 animate-in fade-in duration-200 max-h-[90vh] overflow-y-auto transform transition-transform"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedProduct.image_url}
                    alt={selectedProduct.title}
                    className="w-16 h-16 rounded-xl object-cover border border-surface-container"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">
                        {selectedProduct.gem_category || selectedProduct.category}
                      </span>
                      {selectedProduct.is_gem_ready && (
                        <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded">
                          GeM Ready
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-primary leading-snug">
                      {(language === 'hi' && selectedProduct.hindi_title) ? selectedProduct.hindi_title : selectedProduct.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-sm font-extrabold text-primary">
                        {language === 'hi' ? 'खुदरा' : 'Retail'}: ₹{selectedProduct.price}
                      </p>
                      {selectedProduct.bulk_price && (
                        <p className="text-xs font-bold text-emerald-700">
                          {language === 'hi' ? 'थोक' : 'Bulk'}: ₹{selectedProduct.bulk_price} ({language === 'hi' ? 'न्यूनतम' : 'MOQ'}: {selectedProduct.min_order_quantity || 1})
                        </p>
                      )}
                    </div>
                    {selectedProduct.craft_origin && (
                      <p className="text-[11px] text-secondary font-medium flex items-center gap-0.5 mt-0.5">
                        <span className="material-symbols-outlined text-[13px]">location_on</span>
                        <span>{selectedProduct.craft_origin}</span>
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Status Toggle Buttons */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-surface-container-high">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  {language === 'hi' ? 'उत्पाद स्थिति' : 'Product Status'}
                </label>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(selectedProduct.id, 'live')}
                    className={`py-2 px-1.5 sm:px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                      selectedProduct.status === 'live'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 shrink-0"></span>
                    <span className="truncate">{language === 'hi' ? 'सक्रिय' : 'Live'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(selectedProduct.id, 'draft')}
                    className={`py-2 px-1.5 sm:px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                      selectedProduct.status === 'draft'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-300 shrink-0"></span>
                    <span className="truncate">{language === 'hi' ? 'समीक्षा' : 'Review'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(selectedProduct.id, 'sold_out')}
                    className={`py-2 px-1.5 sm:px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                      selectedProduct.status === 'sold_out'
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-300 shrink-0"></span>
                    <span className="truncate">{language === 'hi' ? 'बिक गया' : 'Sold Out'}</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2 border-t border-surface-container-high">
                <button
                  onClick={() => {
                    handleWhatsAppShare(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                  <span>{language === 'hi' ? 'व्हाट्सएप पर शेयर करें (WhatsApp)' : 'Share via WhatsApp'}</span>
                </button>

                <button
                  onClick={() => {
                    const id = selectedProduct.id;
                    const prod = selectedProduct;
                    setSelectedProduct(null);
                    navigate(`/details/${id}`, { state: { product: prod } });
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-[#2e241e] hover:bg-[#180f0a] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                  <span>{language === 'hi' ? 'विस्तृत उत्पाद पृष्ठ देखें' : 'View Full Details Page'}</span>
                </button>

                <button
                  onClick={async (e) => {
                    setSelectedProduct(null);
                    await handleAddCraftNavigation(navigate, e);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-2 hover:bg-primary-container transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
                  <span>{language === 'hi' ? 'समान शिल्प जोड़ें' : 'Capture Similar Craft'}</span>
                </button>

                <button
                  onClick={() => {
                    showToast(language === 'hi' ? 'शेयर लिंक क्लिपबोर्ड पर कॉपी किया गया!' : 'Share link copied to clipboard!');
                    navigator.clipboard?.writeText(`${window.location.origin}/details/${selectedProduct.id}`);
                    setSelectedProduct(null);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">share</span>
                  <span>{language === 'hi' ? 'कैटलॉग लिंक शेयर करें' : 'Share Catalog Link'}</span>
                </button>

                {/* Modal Delete button: only if currentUser is owner */}
                {currentUser?.id && (currentUser.id === selectedProduct.artisan_id || currentUser.id === selectedProduct.user_id) && (
                  <button
                    onClick={() => handleDeleteProduct(selectedProduct.id)}
                    className="w-full py-2 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs flex items-center justify-center gap-2 border border-red-200 transition-colors cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    <span>{language === 'hi' ? 'उत्पाद हटाएं' : 'Delete Product'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Live Toast Notification */}
        {toastMsg && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-primary text-on-primary px-5 py-2.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 transition-all animate-in fade-in slide-in-from-top-2">
            <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
            <span>{toastMsg}</span>
          </div>
        )}

        <OndcSyncModal
          product={syncTargetProduct}
          artisan={{ id: currentUser?.id, name: currentUser?.user_metadata?.name || 'Artisan' }}
          isOpen={isSyncModalOpen}
          onClose={() => {
            setIsSyncModalOpen(false);
            setSyncTargetProduct(null);
          }}
        />
      </main>
    </div>
  );
}
