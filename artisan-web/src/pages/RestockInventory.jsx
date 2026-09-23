import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../utils/useAuth'; // assuming a hook that provides language & toast

/**
 * RestockInventory – Government‑style UI for artisans to restock their published products.
 *
 * 1️⃣ Fetch the authenticated artisan’s products from Supabase on mount.
 * 2️⃣ Allow selection via a dropdown.
 * 3️⃣ Show the currently stored stock and let the user adjust the quantity.
 * 4️⃣ Persist the new stock back to Supabase with a single `.update()` call.
 * 5️⃣ UI follows the light, high‑contrast theme used across the app (white card, gray borders,
 *    primary accent on the action button).
 */
export default function RestockInventory() {
  const { language, showToast } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [productList, setProductList] = useState([]); // [{id, name, stock, image_url}]
  const [selectedProductId, setSelectedProductId] = useState('');
  const [currentStock, setCurrentStock] = useState(0);
  const [newStockQty, setNewStockQty] = useState(0);

  // Fetch products belonging to the current artisan
  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true);
      setError(null);
      try {
        const { data: authData, error: authErr } = await supabase.auth.getUser();
        if (authErr) throw authErr;
        const userId = authData?.user?.id;
        if (!userId) throw new Error('User not authenticated');

        const { data, error: dbErr } = await supabase
          .from('products')
          .select('id, name, stock, image_url')
          .eq('artisan_id', userId);
        if (dbErr) throw dbErr;
        const products = data || [];
        setProductList(products);
        if (products.length > 0) {
          const first = products[0];
          setSelectedProductId(first.id);
          setCurrentStock(first.stock ?? 0);
          setNewStockQty(first.stock ?? 0);
        }
      } catch (err) {
        console.warn('[RestockInventory] Load error:', err?.message || err);
        setError(err?.message || 'Failed to load products');
      } finally {
        setIsLoading(false);
      }
    }
    loadProducts();
  }, []);

  // Update UI when user picks a different product
  useEffect(() => {
    if (!selectedProductId) return;
    const prod = productList.find((p) => p.id === selectedProductId);
    if (prod) {
      setCurrentStock(prod.stock ?? 0);
      setNewStockQty(prod.stock ?? 0);
    }
  }, [selectedProductId, productList]);

  const handleUpdate = async () => {
    if (!selectedProductId) return;
    try {
      const { error: updErr } = await supabase
        .from('products')
        .update({ stock: newStockQty })
        .eq('id', selectedProductId);
      if (updErr) throw updErr;
      // Optimistically update local list
      setProductList((prev) =>
        prev.map((p) => (p.id === selectedProductId ? { ...p, stock: newStockQty } : p))
      );
      setCurrentStock(newStockQty);
      showToast?.({
        type: 'success',
        message: language === 'hi' ? 'स्टॉक सफलतापूर्वक अपडेट किया गया' : 'Stock updated successfully',
      });
    } catch (err) {
      console.warn('[RestockInventory] Update error:', err?.message || err);
      showToast?.({
        type: 'error',
        message: language === 'hi' ? 'स्टॉक अपडेट करने में त्रुटि' : 'Failed to update stock',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-600">
        {language === 'hi' ? 'लोड हो रहा है…' : 'Loading…'}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 bg-red-50 border border-red-200 rounded-xl text-red-800">
        {language === 'hi' ? `त्रुटि: ${error}` : `Error: ${error}`}
      </div>
    );
  }

  if (productList.length === 0) {
    return (
      <div className="p-5 text-gray-600">
        {language === 'hi' ? 'कोई उत्पाद नहीं मिला – कृपया पहले उत्पाद प्रकाशित करें।' : 'No products found – please publish a product first.'}
      </div>
    );
  }

  return (
    <section className="max-w-3xl mx-auto my-8 p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        {language === 'hi' ? 'स्टॉक रीस्टॉक' : 'Restock Inventory'}
      </h1>

      {/* Product selector */}
      <div className="mb-4">
        <label htmlFor="product-select" className="block text-sm font-medium text-gray-700 mb-1">
          {language === 'hi' ? 'उत्पाद चुनें' : 'Select Product'}
        </label>
        <select
          id="product-select"
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {productList.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Selected product details */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg mb-4">
        {productList
          .filter((p) => p.id === selectedProductId)
          .map((p) => (
            <React.Fragment key={p.id}>
              {p.image_url && (
                <img
                  src={p.image_url}
                  alt={p.name}
                  className="w-20 h-20 object-cover rounded border border-gray-200"
                />
              )}
              <div className="flex-1">
                <p className="text-lg font-medium text-gray-900">{p.name}</p>
                <p className="text-sm text-gray-600">
                  {language === 'hi' ? 'वर्तमान स्टॉक' : 'Current Stock'}: {currentStock}
                </p>
              </div>
            </React.Fragment>
          ))}
      </div>

      {/* Stock adjustment */}
      <div className="mb-4">
        <label htmlFor="new-stock" className="block text-sm font-medium text-gray-700 mb-1">
          {language === 'hi' ? 'नया स्टॉक सेट करें' : 'Set New Stock'}
        </label>
        <input
          type="number"
          id="new-stock"
          min="0"
          value={newStockQty}
          onChange={(e) => setNewStockQty(Number(e.target.value))}
          className="w-full p-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Action button */}
      <button
        onClick={handleUpdate}
        className="px-6 py-2.5 bg-primary text-white rounded hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
      >
        {language === 'hi' ? 'स्टॉक अपडेट करें' : 'Update Stock'}
      </button>
    </section>
  );
}
