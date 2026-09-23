import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../utils/useAuth';

/**
 * OndcTraffic – Displays total ONDC traffic and a list of top‑viewed crafts.
 *
 *  • Fetches the authenticated artisan's products from Supabase.
 *  • Calculates the sum of all product `views`.
 *  • Shows an empty‑state if the artisan has no products.
 *  • Renders a sorted list (highest views first) when data exists.
 *  • UI follows the light, government‑portal aesthetic used across the app.
 */
export default function OndcTraffic() {
  const { language, showToast } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]); // [{id, title, image_url, views}]
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ---------------------------------------------------------------------
  // 1️⃣ Fetch artisan's products on mount
  // ---------------------------------------------------------------------
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
          .select('id, title, image_url, views')
          .eq('artisan_id', userId);
        if (dbErr) throw dbErr;

        // Normalise missing views to 0 (truthful default)
        const normalized = (data || []).map((p) => ({
          id: p.id,
          title: p.title ?? p.name ?? 'Untitled Craft',
          image_url: p.image_url ?? '',
          views: p.views ?? 0,
        }));
        setProducts(normalized);
      } catch (err) {
        console.warn('[OndcTraffic] Load error:', err?.message || err);
        setError(err?.message || 'Failed to load products');
        showToast?.({
          type: 'error',
          message: language === 'hi' ? 'उत्पाद लोड करने में त्रुटि' : 'Error loading products',
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadProducts();
  }, []);

  // ---------------------------------------------------------------------
  // 2️⃣ Calculate total views (sum of all product views)
  // ---------------------------------------------------------------------
  const totalViews = products.reduce((sum, p) => sum + (p.views || 0), 0);

  // ---------------------------------------------------------------------
  // 3️⃣ Empty‑state UI
  // ---------------------------------------------------------------------
  if (!isLoading && products.length === 0) {
    return (
      <section className="max-w-4xl mx-auto my-8 p-6 bg-gray-50 border border-gray-200 rounded-xl text-center">
        {/* Simple box‑icon – using an emoji for brevity; replace with a proper SVG if desired */}
        <div className="text-4xl mb-3">📦</div>
        <h2 className="text-lg font-medium text-gray-800 mb-2">
          {language === 'hi'
            ? 'आपने अभी तक कोई उत्पाद अपलोड या सूचीबद्ध नहीं किया है।'
            : 'You have not uploaded or listed any products yet.'}
        </h2>
        <button
          onClick={() => navigate('/catalog')}
          className="mt-4 px-5 py-2.5 bg-primary text-white rounded hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
        >
          {language === 'hi' ? 'उत्पाद प्रकाशित करें' : 'Publish Product'}
        </button>
      </section>
    );
  }

  // ---------------------------------------------------------------------
  // 4️⃣ Main UI – loading, error, and data display
  // ---------------------------------------------------------------------
  return (
    <section className="max-w-4xl mx-auto my-8 p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
      {/* Header – total ONDC traffic */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-5">
        <h1 className="text-xl font-semibold text-gray-900">
          {language === 'hi' ? 'TOTAL ONDC TRAFFIC' : 'TOTAL ONDC TRAFFIC'}
        </h1>
        <span className="text-2xl font-bold text-primary">
          {isLoading ? (language === 'hi' ? 'लोड हो रहा है…' : 'Loading…') : totalViews}
        </span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800">
          {language === 'hi' ? `त्रुटि: ${error}` : `Error: ${error}`}
        </div>
      )}

      {/* Top Viewed Crafts – only render when we have products */}
      {products.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-gray-800 mb-3">
            {language === 'hi' ? 'Top Viewed Crafts' : 'Top Viewed Crafts'}
          </h2>
          {/* Sort descending by views before rendering */}
          <ul className="space-y-4">
            {[...products]
              .sort((a, b) => (b.views || 0) - (a.views || 0))
              .map((product) => (
                <li
                  key={product.id}
                  className="flex items-center gap-4 p-3 bg-gray-50 border border-gray-200 rounded-lg"
                >
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-16 h-16 object-cover rounded border border-gray-300"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                      🖼️
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {product.title}
                    </p>
                    <p className="text-xs text-gray-600">
                      {language === 'hi' ? `${product.views} दर्शक` : `${product.views} views`}
                    </p>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Footer informational note */}
      <div className="mt-6 text-sm text-gray-500 border-t border-gray-200 pt-4">
        {language === 'hi'
          ? 'शॉपर्स आपके शिल्प को सीधे Paytm, Mystore, PhonePe Pincode & Tata Neu के माध्यम से खोज रहे हैं।'
          : 'Shoppers are directly discovering your crafts via Paytm, Mystore, PhonePe Pincode & Tata Neu.'}
      </div>
    </section>
  );
}
