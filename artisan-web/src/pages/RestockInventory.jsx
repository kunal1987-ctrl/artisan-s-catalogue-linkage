import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

/**
 * RestockInventory – Clean, government-portal-style UI for artisans to restock
 * their published products.
 *
 * • Fetches the authenticated artisan's catalog from the Supabase `items` / `products` table.
 * • Product Navigation Bar: Lightweight carousel/horizontal scroll card selector with Prev/Next buttons.
 * • Reactive Quantity Counter: Syncs local state with active product stock.
 * • Strict Supabase Mutation: Directly updates stock in database with immediate local reflection.
 */
export default function RestockInventory() {
  const { language, user } = useAuth();
  const navigate = useNavigate();

  // ── State ──
  const [catalog, setCatalog] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [draftStock, setDraftStock] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const scrollContainerRef = useRef(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // ── 1. Fetch artisan's catalog on mount ──
  useEffect(() => {
    async function loadCatalog() {
      setIsLoading(true);
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const activeUserId = authUser?.id || user?.id;
        if (!activeUserId) {
          setCatalog([]);
          setIsLoading(false);
          return;
        }

        let { data, error } = await supabase
          .from('items')
          .select('*')
          .or(`artisan_id.eq.${activeUserId},user_id.eq.${activeUserId}`)
          .order('created_at', { ascending: false });

        if ((error || !data || data.length === 0)) {
          const fallbackRes = await supabase
            .from('products')
            .select('*')
            .or(`artisan_id.eq.${activeUserId},user_id.eq.${activeUserId}`)
            .order('created_at', { ascending: false });
          if (!fallbackRes.error && fallbackRes.data) {
            data = fallbackRes.data;
            error = null;
          }
        }

        if (error) {
          console.error('[RestockInventory] Fetch error:', error.message);
          setCatalog([]);
        } else {
          const items = (data || []).map((item) => ({
            id: item.id,
            title: item.title || item.name || 'Untitled Craft',
            hindi_title: item.hindi_title || item.title_hi || '',
            image_url:
              item.image_url ||
              item.images?.[0] ||
              'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
            price: Number(item.price || 0),
            bulk_price: Number(item.bulk_price || item.wholesale_price || 0),
            category: item.category || item.gem_category || 'Handicrafts',
            stock: Number(item.stock ?? item.inventory_count ?? item.quantity ?? 0),
            craft_origin: item.craft_origin || '',
          }));
          setCatalog(items);

          if (items.length > 0) {
            setSelectedIndex(0);
            setDraftStock(items[0].stock);
          }
        }
      } catch (err) {
        console.error('[RestockInventory] Load error:', err);
        setCatalog([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadCatalog();
  }, [user?.id]);

  // Derive active product
  const activeProduct = catalog[selectedIndex];

  // ── 2. Sync draftStock whenever selectedIndex or activeProduct changes ──
  useEffect(() => {
    if (activeProduct) {
      setDraftStock(activeProduct.stock ?? 0);
    }
  }, [selectedIndex, activeProduct]);

  // Scroll active thumbnail pill into view
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeEl = scrollContainerRef.current.children[selectedIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedIndex]);

  // ── Navigation helpers ──
  const handlePrev = () => {
    if (catalog.length === 0) return;
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : catalog.length - 1));
  };

  const handleNext = () => {
    if (catalog.length === 0) return;
    setSelectedIndex((prev) => (prev < catalog.length - 1 ? prev + 1 : 0));
  };

  // ── 3. Stock adjustment helpers ──
  const increment = () => setDraftStock((prev) => prev + 1);
  const decrement = () => setDraftStock((prev) => Math.max(0, prev - 1));
  const quickAdd = (amount) => setDraftStock((prev) => Math.max(0, prev + amount));

  // ── 4. Strict Supabase Mutation ──
  const handleUpdateStock = async () => {
    if (!activeProduct) return;
    const value = Math.max(0, Math.round(Number(draftStock)));
    setIsUpdating(true);
    try {
      let { error } = await supabase
        .from('items')
        .update({ stock: value })
        .eq('id', activeProduct.id);

      if (error) {
        const prodRes = await supabase
          .from('products')
          .update({ stock: value })
          .eq('id', activeProduct.id);
        if (!prodRes.error) error = null;
      }

      if (error) {
        console.error('[RestockInventory] Update error:', error.message);
        showToast(language === 'hi' ? '❌ स्टॉक अपडेट विफल' : '❌ Failed to update stock');
      } else {
        // Update local catalog state immediately
        setCatalog((prev) =>
          prev.map((p, idx) => (idx === selectedIndex ? { ...p, stock: value } : p))
        );
        showToast(
          language === 'hi'
            ? `✅ "${activeProduct.title}" का स्टॉक ${value} इकाइयों पर अपडेट किया गया`
            : `✅ Stock for "${activeProduct.title}" updated to ${value} units`
        );
      }
    } catch (err) {
      console.error('[RestockInventory] Update error:', err);
      showToast(language === 'hi' ? '❌ स्टॉक अपडेट विफल' : '❌ Failed to update stock');
    } finally {
      setIsUpdating(false);
    }
  };

  // ── Loading state ──
  if (isLoading) {
    return (
      <section className="max-w-2xl mx-auto my-8 p-8 bg-white border border-gray-200 rounded-2xl shadow-sm text-center">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-[40px] text-gray-300 animate-spin text-orange-600">
            progress_activity
          </span>
          <p className="text-sm text-gray-500 font-medium">
            {language === 'hi' ? 'आपका कैटलॉग लोड हो रहा है…' : 'Loading your catalog…'}
          </p>
        </div>
      </section>
    );
  }

  // ── Empty state ──
  if (catalog.length === 0) {
    return (
      <section className="max-w-2xl mx-auto my-8 p-8 bg-gray-50 border border-gray-200 rounded-2xl text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px] text-gray-400">inventory_2</span>
          </div>
          <h2 className="text-lg font-bold text-gray-800">
            {language === 'hi'
              ? 'आपके कैटलॉग में कोई उत्पाद नहीं है'
              : 'No Products in Your Catalog'}
          </h2>
          <p className="text-sm text-gray-500 max-w-xs">
            {language === 'hi'
              ? 'कृपया पहले उत्पाद अपलोड करें। फिर आप यहां से स्टॉक प्रबंधित कर सकते हैं।'
              : 'Please upload a product first. You can then manage stock from here.'}
          </p>
          <button
            onClick={() => navigate('/capture')}
            className="mt-2 px-6 py-2.5 bg-[#9c441c] hover:bg-[#7e3514] text-white font-semibold rounded-xl active:scale-95 transition-all cursor-pointer"
          >
            {language === 'hi' ? 'उत्पाद अपलोड करें' : 'Upload Product'}
          </button>
        </div>
      </section>
    );
  }

  // Stock change delta
  const stockDelta = activeProduct ? draftStock - activeProduct.stock : 0;

  return (
    <section className="max-w-2xl mx-auto my-8 px-4">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl shadow-lg animate-fade-in flex items-center gap-2">
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#9c441c]">
              <span className="material-symbols-outlined text-[22px]">inventory_2</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                {language === 'hi' ? 'कैटलॉग स्टॉक प्रबंधन' : 'Catalogue Inventory Restock'}
              </h1>
              <p className="text-xs text-gray-500">
                {language === 'hi'
                  ? 'शिल्प चुनें और रीयल-टाइम स्टॉक अपडेट करें'
                  : 'Select craft & update inventory in real-time'}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-stone-100 text-stone-700">
            {selectedIndex + 1} / {catalog.length}
          </span>
        </div>

        {/* ── Product Navigation Bar (Carousel / Horizontal Selector) ── */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/70 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#9c441c]">touch_app</span>
              <span>{language === 'hi' ? 'कैटलॉग उत्पाद चुनें' : 'Select Catalogue Craft'}</span>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrev}
                className="w-7 h-7 rounded-lg bg-white hover:bg-gray-100 border border-gray-300 flex items-center justify-center text-gray-700 shadow-2xs active:scale-90 transition cursor-pointer"
                title="Previous craft"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="w-7 h-7 rounded-lg bg-white hover:bg-gray-100 border border-gray-300 flex items-center justify-center text-gray-700 shadow-2xs active:scale-90 transition cursor-pointer"
                title="Next craft"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>

          {/* Horizontal Thumbnail Pills */}
          <div
            ref={scrollContainerRef}
            className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-1 no-scrollbar scroll-smooth"
          >
            {catalog.map((p, idx) => {
              const isSelected = idx === selectedIndex;
              const isLow = p.stock <= 3;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-left shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-[#9c441c] ring-2 ring-[#9c441c]/40 shadow-sm'
                      : 'bg-white/80 hover:bg-white border-gray-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={p.image_url}
                    alt={p.title}
                    className="w-8 h-8 rounded-lg object-cover border border-gray-200 shrink-0"
                  />
                  <div className="max-w-[130px]">
                    <p className="text-xs font-bold text-gray-900 truncate leading-tight">
                      {p.title}
                    </p>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-md inline-block mt-0.5 ${
                        isLow
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {p.stock} units
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Product Card */}
        {activeProduct && (
          <div className="px-6 py-5">
            <div className="flex items-start gap-4 mb-6">
              {activeProduct.image_url ? (
                <img
                  src={activeProduct.image_url}
                  alt={activeProduct.title}
                  className="w-20 h-20 rounded-xl object-cover border border-gray-200 shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 shrink-0">
                  <span className="material-symbols-outlined text-[28px]">image</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-[#9c441c] uppercase tracking-wider">
                  {activeProduct.category}
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-0.5 truncate">
                  {(language === 'hi' && activeProduct.hindi_title)
                    ? activeProduct.hindi_title
                    : activeProduct.title}
                </h3>
                {activeProduct.craft_origin && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-[13px]">location_on</span>
                    {activeProduct.craft_origin}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-sm font-extrabold text-gray-900">₹{activeProduct.price}</span>
                  {activeProduct.bulk_price > 0 && (
                    <span className="text-xs font-bold text-emerald-700">
                      {language === 'hi' ? 'थोक' : 'Bulk'}: ₹{activeProduct.bulk_price}
                    </span>
                  )}
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                      activeProduct.stock <= 3
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {language === 'hi' ? 'वर्तमान स्टॉक' : 'Current'}: {activeProduct.stock}
                  </span>
                </div>
              </div>
            </div>

            {/* Reactive Quantity Counter */}
            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {language === 'hi' ? 'नया स्टॉक निर्धारित करें' : 'Adjust Stock Quantity'}
                </span>
                {stockDelta !== 0 && (
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      stockDelta > 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {stockDelta > 0 ? `+${stockDelta}` : stockDelta} units ({activeProduct.stock} → {draftStock})
                  </span>
                )}
              </div>

              {/* Stepper Controls */}
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={decrement}
                  className="w-14 h-14 bg-white border border-gray-300 rounded-2xl text-2xl font-bold text-gray-700 hover:bg-gray-100 hover:border-gray-400 active:scale-95 transition-all shadow-xs flex items-center justify-center cursor-pointer select-none"
                  aria-label="Decrease stock"
                >
                  −
                </button>
                <div className="w-28 text-center">
                  <input
                    type="number"
                    min="0"
                    value={draftStock}
                    onChange={(e) => setDraftStock(Math.max(0, parseInt(e.target.value) || 0))}
                    className="text-4xl font-extrabold text-[#9c441c] text-center w-full bg-transparent focus:outline-none font-mono"
                  />
                  <span className="text-[11px] font-semibold text-gray-400 block -mt-1">
                    {language === 'hi' ? 'इकाइयां' : 'units'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={increment}
                  className="w-14 h-14 bg-white border border-gray-300 rounded-2xl text-2xl font-bold text-gray-700 hover:bg-gray-100 hover:border-gray-400 active:scale-95 transition-all shadow-xs flex items-center justify-center cursor-pointer select-none"
                  aria-label="Increase stock"
                >
                  +
                </button>
              </div>

              {/* Quick Add Presets */}
              <div className="flex items-center justify-center flex-wrap gap-2 mt-4 pt-3 border-t border-gray-200/60">
                <span className="text-xs text-gray-500 font-medium mr-1">
                  {language === 'hi' ? 'त्वरित जोड़ें:' : 'Quick Add:'}
                </span>
                {[5, 10, 25, 50].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => quickAdd(amount)}
                    className="px-3 py-1 bg-white border border-gray-300 hover:border-[#9c441c] hover:bg-orange-50 text-xs font-semibold text-gray-700 hover:text-[#9c441c] rounded-lg transition-all active:scale-95 cursor-pointer shadow-2xs"
                  >
                    +{amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Update Stock Button */}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleUpdateStock}
                disabled={isUpdating || !activeProduct}
                className="w-full py-3.5 bg-[#9c441c] hover:bg-[#7e3514] text-white font-bold text-sm rounded-xl shadow-sm transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {isUpdating ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">
                      progress_activity
                    </span>
                    <span>{language === 'hi' ? 'डेटाबेस सहेजा जा रहा है…' : 'Saving to Database…'}</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span>{language === 'hi' ? 'स्टॉक अपडेट सहेजें' : 'Update Stock in Database'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
