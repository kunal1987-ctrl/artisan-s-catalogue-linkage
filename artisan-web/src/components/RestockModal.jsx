import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * RestockModal – Dynamic Catalogue Product Navigation & Real-Time Inventory Restock
 *
 * 1. Catalogue Product Feed: Pulls authentic products for the logged-in artisan.
 * 2. Product Navigation Bar: Lightweight carousel/horizontal pill selector with Prev/Next buttons.
 * 3. Reactive Quantity Counter: Adjusts stock locally with quick-add presets and delta tracker.
 * 4. Strict Supabase Mutation: Updates `items`/`products` table directly in real-time.
 */
export default function RestockModal({
  isOpen,
  onClose,
  initialProducts = [],
  initialProductId = null,
  onStockUpdated,
}) {
  const { language, user, showToast } = useAuth?.() || {};
  const navigate = useNavigate();

  const [catalogueProducts, setCatalogueProducts] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [stockCount, setStockCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const scrollContainerRef = useRef(null);

  // ── 1. Fetch / Sync Catalogue Products ──
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    async function fetchProducts() {
      setIsLoading(true);
      try {
        const { data: authData } = await supabase.auth.getUser();
        const activeUserId = authData?.user?.id || user?.id;

        let query = supabase.from('items').select('*');
        if (activeUserId) {
          query = query.or(`artisan_id.eq.${activeUserId},user_id.eq.${activeUserId}`);
        }
        let { data, error } = await query.order('created_at', { ascending: false });

        // Fallback to 'products' table if 'items' returned error or empty
        if ((error || !data || data.length === 0) && activeUserId) {
          const fallbackRes = await supabase
            .from('products')
            .select('*')
            .or(`artisan_id.eq.${activeUserId},user_id.eq.${activeUserId}`)
            .order('created_at', { ascending: false });
          if (!fallbackRes.error && fallbackRes.data && fallbackRes.data.length > 0) {
            data = fallbackRes.data;
            error = null;
          }
        }

        if (!isMounted) return;

        if (!error && data && data.length > 0) {
          const formatted = data.map((item) => ({
            id: item.id,
            title: item.title || item.name || 'Untitled Craft',
            hindi_title: item.hindi_title || item.title_hi || '',
            image_url:
              item.image_url ||
              item.images?.[0] ||
              'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
            price: Number(item.price || 0),
            category: item.category || item.gem_category || 'Handicrafts',
            stock: Number(item.stock ?? item.inventory_count ?? item.quantity ?? 0),
          }));

          setCatalogueProducts(formatted);

          // Find initial index
          let targetIndex = 0;
          if (initialProductId) {
            const foundIdx = formatted.findIndex((p) => p.id === initialProductId);
            if (foundIdx !== -1) targetIndex = foundIdx;
          }
          setSelectedIndex(targetIndex);
          setStockCount(formatted[targetIndex]?.stock ?? 0);
        } else if (initialProducts && initialProducts.length > 0) {
          const formatted = initialProducts.map((item) => ({
            id: item.id,
            title: item.title || item.name || 'Untitled Craft',
            hindi_title: item.hindi_title || item.title_hi || '',
            image_url:
              item.image_url ||
              item.images?.[0] ||
              'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
            price: Number(item.price || 0),
            category: item.category || item.gem_category || 'Handicrafts',
            stock: Number(item.stock ?? item.inventory_count ?? item.quantity ?? 0),
          }));
          setCatalogueProducts(formatted);
          setSelectedIndex(0);
          setStockCount(formatted[0]?.stock ?? 0);
        } else {
          setCatalogueProducts([]);
        }
      } catch (err) {
        console.warn('[RestockModal] Fetch products notice:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, [isOpen, initialProductId, user?.id]);

  // Derive active product
  const activeProduct = catalogueProducts[selectedIndex];

  // ── 2. Sync stockCount whenever activeProduct or selectedIndex changes ──
  useEffect(() => {
    if (activeProduct) {
      setStockCount(activeProduct.stock ?? 0);
      setFeedbackMsg('');
    }
  }, [selectedIndex, activeProduct]);

  // Keep active thumbnail in view
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeEl = scrollContainerRef.current.children[selectedIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  // ── Navigation Handlers ──
  const handlePrevProduct = () => {
    if (catalogueProducts.length === 0) return;
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : catalogueProducts.length - 1));
  };

  const handleNextProduct = () => {
    if (catalogueProducts.length === 0) return;
    setSelectedIndex((prev) => (prev < catalogueProducts.length - 1 ? prev + 1 : 0));
  };

  // ── Stock Adjustments ──
  const handleDecrement = () => setStockCount((prev) => Math.max(0, prev - 1));
  const handleIncrement = () => setStockCount((prev) => prev + 1);
  const handleQuickAdd = (delta) => setStockCount((prev) => Math.max(0, prev + delta));

  // ── Strict Supabase Mutation ──
  const handleUpdateStock = async () => {
    if (!activeProduct) return;
    const newStock = Math.max(0, Math.round(Number(stockCount)));

    setIsUpdating(true);
    setFeedbackMsg('');

    try {
      // 1. Update in 'items' table
      let { error } = await supabase
        .from('items')
        .update({ stock: newStock })
        .eq('id', activeProduct.id);

      // 2. Also try 'products' table if needed
      if (error) {
        const prodRes = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', activeProduct.id);
        if (!prodRes.error) {
          error = null;
        }
      }

      if (error) {
        throw error;
      }

      // 3. Mutate local state immediately
      setCatalogueProducts((prev) =>
        prev.map((p, idx) => (idx === selectedIndex ? { ...p, stock: newStock } : p))
      );

      // 4. Notify parent view
      if (onStockUpdated) {
        onStockUpdated(activeProduct.id, newStock);
      }

      const msg =
        language === 'hi'
          ? `✅ "${activeProduct.title}" का स्टॉक बदलकर ${newStock} किया गया!`
          : `✅ Stock for "${activeProduct.title}" updated to ${newStock} units!`;

      if (showToast) showToast(msg);
      setFeedbackMsg(msg);

      // Optional brief delay before closing or staying open
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      console.error('[RestockModal] Stock update error:', err);
      const errMsg =
        language === 'hi'
          ? '❌ स्टॉक अपडेट विफल। कृपया पुनः प्रयास करें।'
          : '❌ Failed to update stock in database. Please try again.';
      setFeedbackMsg(errMsg);
      if (showToast) showToast(errMsg);
    } finally {
      setIsUpdating(false);
    }
  };

  const delta = (activeProduct ? stockCount - (activeProduct.stock ?? 0) : 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
    >
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[#fdf9f3] text-stone-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#d1c4bd]/60 overflow-hidden z-10 max-h-[92vh] flex flex-col">
        {/* ── Modal Header ── */}
        <div className="bg-[#1e140e] text-white p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">inventory_2</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                <span>{language === 'hi' ? 'कैटलॉग स्टॉक प्रबंधन' : 'Catalogue Inventory Restock'}</span>
                {catalogueProducts.length > 0 && (
                  <span className="text-[11px] font-semibold bg-white/15 px-2 py-0.5 rounded-full text-amber-200">
                    {selectedIndex + 1}/{catalogueProducts.length}
                  </span>
                )}
              </h3>
              <p className="text-xs text-[#d4c3ba]">
                {language === 'hi'
                  ? 'शिल्प चुनें और रीयल-टाइम स्टॉक अपडेट करें'
                  : 'Select craft & update inventory in real-time'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
            type="button"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* ── Modal Body ── */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-stone-500">
              <span className="material-symbols-outlined text-[36px] animate-spin text-orange-600">
                progress_activity
              </span>
              <p className="text-xs font-semibold">
                {language === 'hi' ? 'कैटलॉग उत्पाद लोड हो रहे हैं…' : 'Loading catalogue crafts…'}
              </p>
            </div>
          ) : catalogueProducts.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px]">production_quantity_limits</span>
              </div>
              <h4 className="font-bold text-stone-800 text-base">
                {language === 'hi' ? 'कोई कैटलॉग उत्पाद नहीं मिला' : 'No catalogue products found'}
              </h4>
              <p className="text-xs text-stone-500 max-w-xs">
                {language === 'hi'
                  ? 'रीस्टॉक करने के लिए पहले अपने कैटलॉग में उत्पाद जोड़ें।'
                  : 'Add crafts to your catalogue first before restocking inventory.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/capture');
                }}
                className="mt-2 px-5 py-2.5 rounded-full bg-[#9c441c] hover:bg-[#7e3514] text-white text-xs font-bold shadow-md cursor-pointer transition-transform active:scale-95"
              >
                {language === 'hi' ? '+ नया उत्पाद जोड़ें' : '+ Add New Product'}
              </button>
            </div>
          ) : (
            <>
              {/* ── Product Navigation Bar (Carousel / Horizontal Selector) ── */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-600 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#9c441c]">touch_app</span>
                    <span>{language === 'hi' ? 'उत्पाद चुनें (Tap to Switch)' : 'Switch Product'}</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handlePrevProduct}
                      className="w-7 h-7 rounded-lg bg-white hover:bg-stone-100 border border-[#d1c4bd] flex items-center justify-center text-stone-700 cursor-pointer shadow-xs active:scale-90 transition"
                      title="Previous Craft"
                      aria-label="Previous product"
                    >
                      <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNextProduct}
                      className="w-7 h-7 rounded-lg bg-white hover:bg-stone-100 border border-[#d1c4bd] flex items-center justify-center text-stone-700 cursor-pointer shadow-xs active:scale-90 transition"
                      title="Next Craft"
                      aria-label="Next product"
                    >
                      <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    </button>
                  </div>
                </div>

                {/* Horizontal Scroll Thumbnails */}
                <div
                  ref={scrollContainerRef}
                  className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth"
                >
                  {catalogueProducts.map((p, idx) => {
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
                            : 'bg-white/60 hover:bg-white border-[#d1c4bd]/70 opacity-75 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={p.image_url}
                          alt={p.title}
                          className="w-9 h-9 rounded-lg object-cover border border-stone-200 shrink-0"
                        />
                        <div className="max-w-[120px]">
                          <p className="text-xs font-bold text-stone-900 truncate leading-tight">
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

              {/* ── Active Product Card ── */}
              {activeProduct && (
                <div className="p-4 rounded-2xl bg-white border border-[#d1c4bd]/60 shadow-xs flex items-center gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={activeProduct.image_url}
                      alt={activeProduct.title}
                      className="w-20 h-20 rounded-xl object-cover border border-[#d1c4bd]/40"
                    />
                    {activeProduct.stock <= 3 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-600 border-2 border-white animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-bold text-[#9c441c] uppercase tracking-wider block">
                      {activeProduct.category}
                    </span>
                    <h4 className="text-sm font-bold text-stone-900 truncate">
                      {activeProduct.title}
                    </h4>
                    {activeProduct.hindi_title && (
                      <p className="text-[11px] text-stone-500 truncate">{activeProduct.hindi_title}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                          activeProduct.stock <= 3
                            ? 'text-red-700 bg-red-50 border border-red-200'
                            : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            activeProduct.stock <= 3 ? 'bg-red-600 animate-pulse' : 'bg-emerald-500'
                          }`}
                        />
                        <span>
                          {language === 'hi'
                            ? `वर्तमान: ${activeProduct.stock} इकाइयां`
                            : `Current: ${activeProduct.stock} units`}
                        </span>
                      </span>
                      {activeProduct.price > 0 && (
                        <span className="text-xs text-stone-600 font-bold">
                          ₹{activeProduct.price}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Reactive Quantity Stepper ── */}
              <div className="bg-[#f1ede7] rounded-2xl p-4 sm:p-5 border border-[#d1c4bd]/40 text-center space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
                    {language === 'hi' ? 'नया स्टॉक निर्धारित करें' : 'Adjust Stock Quantity'}
                  </span>
                  {delta !== 0 && (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        delta > 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      <span>{delta > 0 ? `+${delta}` : delta}</span>
                      <span>({activeProduct?.stock ?? 0} → {stockCount})</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-center gap-4 py-1">
                  <button
                    onClick={handleDecrement}
                    className="w-14 h-14 rounded-2xl bg-white hover:bg-stone-50 border border-[#d1c4bd] shadow-sm text-2xl font-bold flex items-center justify-center text-stone-900 active:scale-90 transition-all cursor-pointer select-none"
                    type="button"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>

                  <div className="w-28 flex flex-col items-center">
                    <input
                      type="number"
                      min="0"
                      value={stockCount}
                      onChange={(e) => setStockCount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="text-4xl font-extrabold text-[#9c441c] font-mono text-center w-full bg-transparent focus:outline-none"
                    />
                    <span className="text-[11px] font-semibold text-stone-500">
                      {language === 'hi' ? 'इकाइयां (Units)' : 'Units'}
                    </span>
                  </div>

                  <button
                    onClick={handleIncrement}
                    className="w-14 h-14 rounded-2xl bg-white hover:bg-stone-50 border border-[#d1c4bd] shadow-sm text-2xl font-bold flex items-center justify-center text-stone-900 active:scale-90 transition-all cursor-pointer select-none"
                    type="button"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                {/* Quick Add Presets */}
                <div className="flex items-center justify-center flex-wrap gap-2 pt-2 border-t border-[#d1c4bd]/40">
                  <span className="text-[11px] font-bold text-stone-600 mr-1">
                    {language === 'hi' ? 'त्वरित जोड़ें:' : 'Quick Add:'}
                  </span>
                  {[5, 10, 25, 50].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleQuickAdd(num)}
                      className="px-3 py-1 rounded-full bg-white hover:bg-[#9c441c] hover:text-white text-[#9c441c] border border-[#d1c4bd]/70 font-bold text-xs shadow-2xs active:scale-95 transition-all cursor-pointer"
                    >
                      +{num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback Alert */}
              {feedbackMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold text-center ${
                    feedbackMsg.startsWith('✅')
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {feedbackMsg}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Modal Footer ── */}
        <div className="p-4 border-t border-[#d1c4bd]/40 bg-[#f7f3ed] flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onClose}
            disabled={isUpdating}
            className="w-full sm:w-1/3 py-3 rounded-full bg-white hover:bg-stone-100 border border-[#d1c4bd] text-stone-800 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
            type="button"
          >
            {language === 'hi' ? 'बंद करें (Close)' : 'Close'}
          </button>
          <button
            onClick={handleUpdateStock}
            disabled={isUpdating || !activeProduct || isLoading}
            className="w-full sm:w-2/3 py-3 rounded-full bg-[#9c441c] hover:bg-[#7e3514] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            type="button"
          >
            {isUpdating ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">
                  progress_activity
                </span>
                <span>{language === 'hi' ? 'डेटाबेस सहेजा जा रहा है…' : 'Updating Database…'}</span>
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
    </div>
  );
}
