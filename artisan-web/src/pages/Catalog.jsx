import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const INITIAL_PRODUCTS = [
  {
    id: 'sample-1',
    title: 'Handwoven Silk Saree',
    category: 'Textiles',
    price: 1200,
    status: 'live',
    qty: 4,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-sNNPD7NjjGMS1v2tbVl4yFv8Iu1JhWlZUSvVBfDKp5ZF6QhcVD2Sj6bZWaiqixmiP37vRBG3SX9F3b4uR1n5MGGkrup-cALXMHLo3q5mJKxvO6Nb25E-D5gbpBwccFakVyyk-_RDpwytaljJ-QALr2nS-n5AudvitRZYoapt2ZvvelTIOPpiqcpPk-naPoAd76t5OvZDzT6uu5VR1pT5VNtpORRdvDWNlvYgSEdonfXI4gmBrbBJ'
  },
  {
    id: 'sample-2',
    title: 'Handcrafted Terracotta Vase',
    category: 'Ceramics',
    price: 450,
    status: 'live',
    qty: 8,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8gEkbmMy61lt8HNipaEyZvDF0R6p-ND7qw2cjEn5TZ1I4aNy53nnPEyP6HiXzAHRgdm_ed09vPoCnl1sL8dhIZLrqPDv4KXmty4ipc14XLjBMFnBDpRj8Tp826kW8qSIVv90XEcFniXGnN--UJKkOv6Z1BwWZ2wbgGT3jt2qtrJbDQFLBGha72GH9OeMBzvmZduyd2xRG_j1AtZWd8ofVb3w5hKebi8HhvGosoQnjAelg213v4nsH'
  },
  {
    id: 'sample-3',
    title: 'Embroidered Jute Tote Bag',
    category: 'Accessories',
    price: 350,
    status: 'draft',
    qty: 'Pending',
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDukLnU4bbCJbOZFDn_6jsPBmdqKn0r3eCL6M7LKio3tU9vVx7laPhV7YMS0u2u3VEnhOvQFoarfhdEr44HF8cu5Ue78dPL4VecZWcWMZ4ZBUY7Ij25ZyVmRw1QUp8SXgDKWGXmI6Ga7PA9Muw9XeiCxNmHUMQbM6tR8xumpfSzCnLCXtuTl-6yJILr8hkIhG7rVFe8bo3rRjFirA6FjylAkc-cadJG7GgQavy9VRWMS_LHqQees_0A'
  },
  {
    id: 'sample-4',
    title: 'Brass Hanging Temple Diya',
    category: 'Metalcraft',
    price: 890,
    status: 'sold_out',
    qty: '0 in stock',
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDlHfIaGDyYI0EAvbGgSI27CpGX-wwPKR744QBj2N5mF8JiWx2pJEHOznBx3d-QTMJ7vwL8abVP2GDeWgoqjrZOXB6G9WbSDMfbSWGXlLSiZU1Q-PDh11pL5VbO-WmzFvbUxJPftFGSV8ArB3R772RiFxmCm1-nwf-qg8p7Fc1-jem9M8p3KpuoF4kRmPSpWYOw_XkuS_4kMmzYH_Lr1CqJ72xPS8g2gMw4SDBvOS-AIa9mLyHIicHJ'
  },
  {
    id: 'sample-5',
    title: 'Block-print Cotton Kurta',
    category: 'Apparel',
    price: 650,
    status: 'live',
    qty: 12,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCxOJ0FKTYbbuMdGP2TFkBovi83nJiUcJ9esAv6gvCjf8DY5gmmeeF-yPcG4I1EsSm76xXiCiLZNUCaGj_X0VefIt-9VDN_Hc4hPgKA2A10j92yfkmqMbhWlxTaX89BIeLseNRlL641YrAhqjzPPC8uHDFOBQcCZFL6W7c-LlEicZC4u5RWq6tWpsRptguCMiGZb517GyYZIP2HSkZP4dhUo8-pUSLXe6Qn-iKKHY8lcxO3RCq5S1PX'
  },
  {
    id: 'sample-6',
    title: 'Carved Sheesham Wood Box',
    category: 'Woodcraft',
    price: 550,
    status: 'live',
    qty: 6,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCp1cvKGoksKi4GTU_zeqkUAQyN_YdiyEV1hiX72ms9PeoKrT3-utw_vtH95S1WqbmkU3G_2jmzW7jFU0sl-ywaXtYbKHF1W9FtgYm5rFNQ5JJT8nE5E-XxN50l4NeudtXowIgi6i0VdgvVivkWC5-FVyY_tbEOuNG3pwcf1Y7wlWRjMVepn3Ul5174sdJyUHdoWXNcrvaVnU57nZN7wnn-4Py6PNboZs8tl2q0BEWf8C-eiRJ-pX80'
  }
];

export default function Catalog() {
  const navigate = useNavigate();
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // all | live | draft | sold_out
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  // Fetch real products from Supabase
  useEffect(() => {
    async function loadSupabaseProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped = data.map((item) => ({
            id: item.id,
            title: item.title,
            category: item.category || 'Handicrafts',
            price: item.price || 850,
            status: item.status === 'published' ? 'live' : item.status || 'live',
            qty: 1,
            image_url: item.image_url || 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600&auto=format&fit=crop'
          }));
          // Merge unique products
          setProducts((prev) => {
            const existingIds = new Set(prev.map(p => p.id));
            const newItems = mapped.filter(m => !existingIds.has(m.id));
            return [...newItems, ...prev];
          });
        }
      } catch (e) {
        console.warn('Could not load products from Supabase:', e);
      }
    }
    loadSupabaseProducts();
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      showToast('Listening for voice search... बोलें');
      const recognition = new SpeechRecognition();
      recognition.lang = 'hi-IN';
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        showToast(`Searched: "${transcript}"`);
      };
      recognition.start();
    } else {
      showToast('Voice search not supported in this browser.');
    }
  };

  // Filter products based on search and active filter tab
  const filteredProducts = products.filter((p) => {
    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'live' && p.status === 'live') ||
      (activeFilter === 'draft' && p.status === 'draft') ||
      (activeFilter === 'sold_out' && p.status === 'sold_out');

    const matchesSearch =
      !searchQuery.trim() ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const liveCount = products.filter(p => p.status === 'live').length;
  const draftCount = products.filter(p => p.status === 'draft').length;
  const soldOutCount = products.filter(p => p.status === 'sold_out').length;

  return (
    <div className="w-full">
      <main className="flex-1 flex flex-col relative w-full bg-surface min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col w-full max-w-7xl mx-auto">
          
          {/* Header & Search */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-surface-container-high">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-secondary uppercase tracking-wider mb-1">
                  <span>Catalog</span>
                  <span className="text-outline">/</span>
                  <span>My Shop Inventory</span>
                </div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-primary tracking-tight">Handcrafted Collection</h2>
                  <span className="px-3 py-1 bg-secondary-fixed text-on-secondary-fixed rounded-full text-xs font-bold">
                    {products.length} Items Listed
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full border border-surface-container-high">
                    <span className="material-symbols-outlined text-[14px] text-emerald-700">cloud_done</span>
                    <span>Saved Offline</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                <div className="relative w-full sm:w-80">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] pointer-events-none">
                    search
                  </span>
                  <input
                    className="w-full h-12 pl-11 pr-10 bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant text-sm font-medium rounded-xl shadow-xs border border-surface-container-high focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                    id="productSearchInput"
                    placeholder="Search crafts, sarees, pottery..."
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button
                    aria-label="Voice Search"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-secondary hover:bg-surface-container active:scale-90 transition-transform cursor-pointer"
                    onClick={handleVoiceSearch}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">mic</span>
                  </button>
                </div>

                <button
                  onClick={() => navigate('/capture')}
                  className="h-12 px-5 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-md active:scale-95 flex items-center gap-2 hover:bg-primary-container transition-all shrink-0 cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">add</span>
                  <span>+ Add Product (नया शिल्प जोड़ें)</span>
                </button>
              </div>
            </div>

            {/* Inventory Status Bar */}
            <div className="bg-surface-container-low border border-surface-container rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1 w-full">
                <div className="flex items-center justify-between text-xs font-semibold text-on-surface-variant mb-2">
                  <span>Overall Stock Availability</span>
                  <span className="font-bold text-primary">83% Active (Ready for dispatch)</span>
                </div>
                <div className="w-full h-2.5 bg-surface-container-highest rounded-full overflow-hidden flex">
                  <div className="bg-emerald-700 h-full" style={{ width: '67%' }}></div>
                  <div className="bg-amber-600 h-full" style={{ width: '17%' }}></div>
                  <div className="bg-error h-full" style={{ width: '16%' }}></div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold shrink-0 flex-wrap">
                <span className="flex items-center gap-1.5 bg-surface-container-lowest px-3 py-1.5 rounded-xl border border-surface-container">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-700 inline-block"></span>
                  {liveCount} Live
                </span>
                <span className="flex items-center gap-1.5 bg-surface-container-lowest px-3 py-1.5 rounded-xl border border-surface-container">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block"></span>
                  {draftCount} In Review
                </span>
                <span className="flex items-center gap-1.5 bg-surface-container-lowest px-3 py-1.5 rounded-xl border border-surface-container">
                  <span className="w-2.5 h-2.5 rounded-full bg-error inline-block"></span>
                  {soldOutCount} Sold Out
                </span>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1" id="filterPillsContainer">
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
                  All ({products.length})
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
                  Live ({liveCount})
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
                  In Review ({draftCount})
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
                  Sold Out ({soldOutCount})
                </button>
              </div>

              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs font-bold text-secondary hover:underline cursor-pointer"
                  type="button"
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="pt-1 pb-4">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" id="productsGrid">
                {filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    className="product-item flex flex-col bg-surface-container-lowest rounded-2xl p-2.5 border border-surface-container shadow-xs group relative hover:shadow-md transition-all"
                  >
                    <div className="relative aspect-[4/5] w-full rounded-xl overflow-hidden bg-surface-container-low mb-2">
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
                          {p.status === 'live' ? 'Live' : p.status === 'draft' ? 'In Review' : 'Sold Out'}
                        </span>
                      </div>

                      {/* Details modal button */}
                      <button
                        aria-label="Product Options"
                        className="absolute top-1.5 right-1.5 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md text-primary flex items-center justify-center shadow-md active:scale-90 hover:bg-white transition-all z-10 cursor-pointer"
                        onClick={() => setSelectedProduct(p)}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[20px]">more_vert</span>
                      </button>
                    </div>

                    <div className="flex flex-col flex-1 px-1 pb-1">
                      <span className="text-[11px] font-bold uppercase text-secondary tracking-wider truncate mb-0.5">
                        {p.category}
                      </span>
                      <h3 className="text-sm font-bold text-primary line-clamp-1 mb-1">{p.title}</h3>
                      <div className="mt-auto flex items-center justify-between pt-1">
                        <span className="text-base font-extrabold text-primary">✨ ₹{p.price}</span>
                        <span className="text-xs font-semibold text-on-surface-variant">Qty: {p.qty}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-secondary mb-3">
                  <span className="material-symbols-outlined text-[32px]">inventory_2</span>
                </div>
                <h3 className="text-lg font-bold text-primary mb-1">No Crafts Discovered</h3>
                <p className="text-sm text-on-surface-variant max-w-xs mb-4 font-normal">
                  We couldn't locate items matching "{searchQuery}". Clear search or explore other categories.
                </p>
                <button
                  className="h-12 px-6 rounded-full bg-primary text-on-primary font-bold text-sm shadow-sm active:scale-95 cursor-pointer"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveFilter('all');
                  }}
                  type="button"
                >
                  Clear All Filters
                </button>
              </div>
            )}

            {/* Restock Notification banner */}
            <div className="mt-6 p-4 bg-surface-container-low border border-surface-container rounded-2xl shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                  <span className="material-symbols-outlined text-[22px]">sync_saved_locally</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-primary">Instant Restock Notification</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    2 products require urgent replenishment in My Shop
                  </p>
                </div>
              </div>
              <button
                aria-label="Add craft to restock"
                className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-colors cursor-pointer"
                onClick={() => navigate('/capture')}
                type="button"
              >
                + Restock Craft
              </button>
            </div>
          </div>
        </div>

        {/* Product Quick Action Modal */}
        {selectedProduct && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setSelectedProduct(null)}
          >
            <div
              className="bg-surface-container-lowest rounded-3xl max-w-md w-full p-6 shadow-2xl border border-surface-container flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200"
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
                    <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">
                      {selectedProduct.category}
                    </span>
                    <h3 className="text-base font-bold text-primary">{selectedProduct.title}</h3>
                    <p className="text-sm font-extrabold text-primary">₹{selectedProduct.price}</p>
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

              <div className="flex flex-col gap-2 pt-2 border-t border-surface-container-high">
                <button
                  onClick={() => {
                    setSelectedProduct(null);
                    navigate('/capture');
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-2 hover:bg-primary-container transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
                  <span>Capture Similar Craft (समान शिल्प जोड़ें)</span>
                </button>
                <button
                  onClick={() => {
                    showToast('Share link copied to clipboard!');
                    navigator.clipboard?.writeText(window.location.href);
                    setSelectedProduct(null);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">share</span>
                  <span>Share Catalog Link • शेयर करें</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Live Toast Notification */}
        {toastMsg && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-primary text-on-primary px-5 py-2.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 transition-all">
            <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
            <span>{toastMsg}</span>
          </div>
        )}
      </main>
    </div>
  );
}
