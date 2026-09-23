import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

/**
 * RestockInventory – Clean, government-portal-style UI for artisans to restock
 * their published products.
 *
 * • Fetches the authenticated artisan's catalog from the Supabase `items` table.
 * • Allows selection via a dropdown with product thumbnails.
 * • Displays current stock and lets the user adjust via +/- buttons & quick-add.
 * • Persists the updated stock back to Supabase with loading/error feedback.
 */
export default function RestockInventory() {
  const { language, user } = useAuth();
  const navigate = useNavigate();

  // ── State ──
  const [catalog, setCatalog] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [draftStock, setDraftStock] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

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
        if (!authUser) {
          setCatalog([]);
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('items')
          .select('*')
          .or(`artisan_id.eq.${authUser.id},user_id.eq.${authUser.id}`)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[RestockInventory] Fetch error:', error.message);
          setCatalog([]);
        } else {
          const items = (data || []).map((item) => ({
            id: item.id,
            title: item.title || item.name || 'Untitled Craft',
            hindi_title: item.hindi_title || item.title_hi || '',
            image_url: item.image_url || '',
            price: Number(item.price || 0),
            bulk_price: Number(item.bulk_price || item.wholesale_price || 0),
            category: item.category || item.gem_category || 'Handicrafts',
            stock: Number(item.stock ?? item.min_order_quantity ?? item.moq ?? 0),
            craft_origin: item.craft_origin || '',
          }));
          setCatalog(items);

          // Default to first product
          if (items.length > 0) {
            setSelectedProduct(items[0]);
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
  }, []);

  // ── 2. Handle dropdown change ──
  const handleProductChange = (productId) => {
    const product = catalog.find((p) => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      setDraftStock(product.stock);
    }
  };

  // ── 3. Stock adjustment helpers ──
  const increment = () => setDraftStock((prev) => prev + 1);
  const decrement = () => setDraftStock((prev) => Math.max(0, prev - 1));
  const quickAdd = (amount) => setDraftStock((prev) => prev + amount);

  // ── 4. Persist stock to Supabase ──
  const handleUpdateStock = async () => {
    if (!selectedProduct) return;
    const value = Math.max(0, Math.round(draftStock));
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('items')
        .update({ stock: value })
        .eq('id', selectedProduct.id);

      if (error) {
        console.error('[RestockInventory] Update error:', error.message);
        showToast(language === 'hi' ? '❌ स्टॉक अपडेट विफल' : '❌ Failed to update stock');
      } else {
        // Update local catalog state
        setCatalog((prev) =>
          prev.map((p) => (p.id === selectedProduct.id ? { ...p, stock: value } : p))
        );
        setSelectedProduct((prev) => ({ ...prev, stock: value }));
        showToast(
          language === 'hi'
            ? `✅ स्टॉक ${value} इकाइयों पर अपडेट किया गया`
            : `✅ Stock updated to ${value} units`
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
          <span className="material-symbols-outlined text-[40px] text-gray-300 animate-pulse">inventory_2</span>
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
            className="mt-2 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 active:scale-95 transition-all cursor-pointer"
          >
            {language === 'hi' ? 'उत्पाद अपलोड करें' : 'Upload Product'}
          </button>
        </div>
      </section>
    );
  }

  // ── Compute stock change delta for visual feedback ──
  const stockDelta = selectedProduct ? draftStock - selectedProduct.stock : 0;

  // ── Main UI ──
  return (
    <section className="max-w-2xl mx-auto my-8">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl shadow-lg animate-fade-in">
          {toastMsg}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px] text-blue-700">inventory_2</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                {language === 'hi' ? 'स्टॉक रीस्टॉक' : 'Restock Inventory'}
              </h1>
              <p className="text-xs text-gray-500">
                {language === 'hi' ? 'अपने उत्पादों का स्टॉक अपडेट करें' : 'Update stock for your products'}
              </p>
            </div>
          </div>
        </div>

        {/* Product Selector */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <label htmlFor="restock-product-select" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            {language === 'hi' ? 'उत्पाद चुनें' : 'Select Product'}
          </label>
          <select
            id="restock-product-select"
            value={selectedProduct?.id || ''}
            onChange={(e) => handleProductChange(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3e%3cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd' /%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px', paddingRight: '40px' }}
          >
            {catalog.map((p) => (
              <option key={p.id} value={p.id}>
                {(language === 'hi' && p.hindi_title) ? p.hindi_title : p.title} — {language === 'hi' ? 'स्टॉक' : 'Stock'}: {p.stock}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Product Card */}
        {selectedProduct && (
          <div className="px-6 py-5">
            <div className="flex items-start gap-4 mb-6">
              {selectedProduct.image_url ? (
                <img
                  src={selectedProduct.image_url}
                  alt={selectedProduct.title}
                  className="w-20 h-20 rounded-xl object-cover border border-gray-200 shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 shrink-0">
                  <span className="material-symbols-outlined text-[28px]">image</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {selectedProduct.category}
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-0.5 truncate">
                  {(language === 'hi' && selectedProduct.hindi_title) ? selectedProduct.hindi_title : selectedProduct.title}
                </h3>
                {selectedProduct.craft_origin && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-[13px]">location_on</span>
                    {selectedProduct.craft_origin}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-sm font-extrabold text-gray-900">₹{selectedProduct.price}</span>
                  {selectedProduct.bulk_price > 0 && (
                    <span className="text-xs font-bold text-emerald-700">
                      {language === 'hi' ? 'थोक' : 'Bulk'}: ₹{selectedProduct.bulk_price}
                    </span>
                  )}
                </div>
              </div>
              {/* Current Stock Badge */}
              <div className="text-center shrink-0">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {language === 'hi' ? 'वर्तमान' : 'Current'}
                </span>
                <span className={`text-2xl font-extrabold ${selectedProduct.stock <= 2 ? 'text-red-600' : selectedProduct.stock <= 10 ? 'text-amber-600' : 'text-gray-900'}`}>
                  {selectedProduct.stock}
                </span>
                <span className="block text-[10px] text-gray-400">
                  {language === 'hi' ? 'इकाई' : 'units'}
                </span>
              </div>
            </div>

            {/* Stock Adjuster */}
            <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                {language === 'hi' ? 'नया स्टॉक सेट करें' : 'Set New Stock Quantity'}
              </label>

              {/* +/- Controls */}
              <div className="flex items-center justify-center gap-3 mb-4">
                <button
                  type="button"
                  onClick={decrement}
                  className="w-12 h-12 rounded-xl bg-white border border-gray-300 text-gray-700 flex items-center justify-center hover:bg-gray-100 active:scale-90 transition-all cursor-pointer text-xl font-bold"
                  disabled={draftStock <= 0}
                >
                  −
                </button>
                <input
                  type="number"
                  min="0"
                  value={draftStock}
                  onChange={(e) => setDraftStock(Math.max(0, Number(e.target.value) || 0))}
                  className="w-24 h-12 text-center text-2xl font-extrabold text-gray-900 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={increment}
                  className="w-12 h-12 rounded-xl bg-white border border-gray-300 text-gray-700 flex items-center justify-center hover:bg-gray-100 active:scale-90 transition-all cursor-pointer text-xl font-bold"
                >
                  +
                </button>
              </div>

              {/* Quick Add Buttons */}
              <div className="flex items-center justify-center gap-2 mb-4">
                {[5, 10, 25, 50].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => quickAdd(n)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-xs font-bold text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 active:scale-95 transition-all cursor-pointer"
                  >
                    +{n}
                  </button>
                ))}
              </div>

              {/* Delta Indicator */}
              {stockDelta !== 0 && (
                <div className={`text-center text-xs font-bold mb-3 ${stockDelta > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {stockDelta > 0 ? '↑' : '↓'} {Math.abs(stockDelta)} {language === 'hi' ? 'इकाई का अंतर' : 'unit change'}
                  {' '}({selectedProduct.stock} → {draftStock})
                </div>
              )}

              {/* Update Button */}
              <button
                type="button"
                onClick={handleUpdateStock}
                disabled={isUpdating || draftStock === selectedProduct?.stock}
                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] disabled:cursor-not-allowed ${
                  draftStock === selectedProduct?.stock
                    ? 'bg-gray-200 text-gray-400'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-60'
                }`}
              >
                {isUpdating ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">hourglass_top</span>
                    {language === 'hi' ? 'अपडेट हो रहा है…' : 'Updating…'}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    {language === 'hi' ? 'स्टॉक अपडेट करें' : 'Update Stock'}
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
