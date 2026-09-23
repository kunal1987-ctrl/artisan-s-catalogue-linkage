import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

/**
 * OndcTraffic – Displays total ONDC traffic and a sorted list of top‑viewed crafts.
 *
 * • Fetches the authenticated artisan's products from Supabase (ordered by views desc).
 * • Calculates the sum of all product `views`.
 * • Shows an empty‑state if the artisan has no products.
 * • Defaults to showing only the top 2 products, with a "View All" toggle.
 * • UI follows the light, government‑portal aesthetic used across the app.
 */
export default function OndcTraffic() {
  const { language } = useAuth?.() || {};
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  // ── 1. Fetch artisan's products on mount ──
  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setProducts([]);
          return;
        }

        const { data, error } = await supabase
          .from('products')
          .select('id, title, image_url, views')
          .eq('artisan_id', user.id)
          .order('views', { ascending: false });

        if (error) {
          console.warn('[OndcTraffic] DB error:', error.message);
          setProducts([]);
          return;
        }

        // Normalise: default views to 0, title fallback
        const normalized = (data || []).map((p) => ({
          id: p.id,
          title: p.title || 'Untitled Craft',
          image_url: p.image_url || '',
          views: p.views ?? 0,
        }));
        setProducts(normalized);
      } catch (err) {
        console.warn('[OndcTraffic] Load error:', err?.message || err);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadProducts();
  }, []);

  // ── 2. Derived data ──
  const totalViews = products.reduce((sum, p) => sum + (p.views || 0), 0);
  const displayedProducts = showAll ? products : products.slice(0, 2);

  // ── 3. Loading state ──
  if (isLoading) {
    return (
      <section className="max-w-4xl mx-auto my-8 p-6 bg-white border border-gray-200 rounded-xl shadow-sm text-center text-gray-500">
        {language === 'hi' ? 'लोड हो रहा है…' : 'Loading…'}
      </section>
    );
  }

  // ── 4. Empty state ──
  if (products.length === 0) {
    return (
      <section className="max-w-4xl mx-auto my-8 p-6 bg-gray-50 border border-gray-200 rounded-xl text-center">
        <div className="text-4xl mb-3">📦</div>
        <h2 className="text-lg font-medium text-gray-800 mb-2">
          {language === 'hi'
            ? 'आपने अभी तक कोई उत्पाद अपलोड नहीं किया है।'
            : 'You have not uploaded any products yet.'}
        </h2>
        <button
          onClick={() => navigate('/capture')}
          className="mt-4 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          {language === 'hi' ? 'उत्पाद प्रकाशित करें' : 'Publish Product'}
        </button>
      </section>
    );
  }

  // ── 5. Main UI ──
  return (
    <section className="max-w-4xl mx-auto my-8 p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
      {/* Header – total ONDC traffic */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-5">
        <h1 className="text-xl font-semibold text-gray-900">
          TOTAL ONDC TRAFFIC
        </h1>
        <span className="text-2xl font-bold text-blue-700">{totalViews}</span>
      </div>

      {/* Top Viewed Crafts */}
      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
          {language === 'hi' ? 'शीर्ष लोकप्रिय शिल्प' : 'Top Viewed Crafts'}
        </h2>
        <ul className="space-y-3">
          {displayedProducts.map((product) => (
            <li
              key={product.id}
              className="flex items-center gap-4 p-3 bg-gray-50 border border-gray-200 rounded-lg"
            >
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.title}
                  className="w-16 h-16 object-cover rounded-lg border border-gray-300 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 shrink-0">
                  <span className="material-symbols-outlined text-[24px]">image</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {product.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                    <span className="material-symbols-outlined text-[13px]">shopping_bag</span>
                    ONDC
                  </span>
                  <span className="text-xs text-gray-600 font-semibold">
                    • {product.views} {language === 'hi' ? 'दर्शक' : 'views'}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-lg font-extrabold text-gray-900">{product.views}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* View All / Show Less toggle */}
      {products.length > 2 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-4 py-3 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
        >
          {showAll
            ? (language === 'hi' ? 'कम देखें' : 'Show Less')
            : (language === 'hi'
              ? `सभी ${products.length} उत्पाद देखें`
              : `View All ${products.length} Products`)}
        </button>
      )}

      {/* Footer informational note */}
      <div className="mt-6 text-sm text-gray-500 border-t border-gray-200 pt-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px] text-gray-400 shrink-0">insights</span>
        <span>
          {language === 'hi'
            ? 'शॉपर्स आपके शिल्प को सीधे Paytm, Mystore, PhonePe Pincode & Tata Neu के माध्यम से खोज रहे हैं।'
            : 'Shoppers are directly discovering your crafts via Paytm, Mystore, PhonePe Pincode & Tata Neu.'}
        </span>
      </div>
    </section>
  );
}
