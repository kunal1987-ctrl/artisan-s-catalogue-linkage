import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

const INITIAL_PRODUCTS = [
  {
    id: 'a1b2c3d4-0001-4000-8000-000000000001',
    title: 'Handcrafted Terracotta Earthen Pitcher (Surahi)',
    hindi_title: 'पारंपरिक हस्तनिर्मित मिट्टी की सुराही',
    description: 'Naturally cooled unglazed terracotta water pitcher with micro-porous earthen filtration. Traditional hand-thrown pottery crafted using organic riverbed clay with embossed floral motifs.',
    hindi_description: 'प्राकृतिक रूप से पानी को शीतल रखने वाली हस्तनिर्मित मिट्टी की सुराही। नदी की शुद्ध चिकनी मिट्टी से पारंपरिक चाक पर तैयार और फूलों के बारीक नक्काशीदार काम से अलंकृत।',
    price: 450,
    bulk_price: 260,
    min_order_quantity: 50,
    gem_category: 'Handicrafts & Traditional Artware - Terracotta Ware',
    hsn_code: '69120010',
    unspsc_code: '60121002',
    craft_origin: 'Gorakhpur, Uttar Pradesh',
    image_url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
    is_gem_ready: true,
    status: 'live',
    category: 'Ceramics & Pottery',
    qty: 50,
  },
  {
    id: 'a1b2c3d4-0002-4000-8000-000000000002',
    title: 'GI-Certified Jaipur Blue Pottery Decorative Wall Plate (10 Inch)',
    hindi_title: 'भौगोलिक संकेतक (GI) प्रमाणित जयपुर ब्लू पॉटरी सजावटी प्लेट',
    description: 'Authentic quartz powder and glass-frit ceramic plate hand-painted with Egyptian blue cobalt oxide and floral arabesque motifs. Turquoises glaze fired at low temperatures without clay.',
    hindi_description: 'पारंपरिक क्वार्ट्ज और कांच के मिश्रण से निर्मित प्रामाणिक जयपुर ब्लू पॉटरी वॉल प्लेट। कोबाल्ट ऑक्साइड और प्राकृतिक रंगों से हाथ से चित्रित पारंपरिक फ्लोरल डिजाइन।',
    price: 1250,
    bulk_price: 780,
    min_order_quantity: 25,
    gem_category: 'Handicrafts & Decorative Items - Ceramic & Pottery Art',
    hsn_code: '69139000',
    unspsc_code: '60121001',
    craft_origin: 'Jaipur, Rajasthan',
    image_url: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80',
    is_gem_ready: true,
    status: 'live',
    category: 'Ceramics & Pottery',
    qty: 25,
  },
  {
    id: 'a1b2c3d4-0003-4000-8000-000000000003',
    title: 'Handwoven Chanderi Silk-Cotton Zari Border Stole',
    hindi_title: 'हथकरघा चंदेरी सिल्क-कॉटन जरी बॉर्डर स्टोल',
    description: 'Fine lightweight handloom stole woven on traditional pit-looms using pure mulberry silk warp and cotton weft. Embellished with tested gold zari booti motifs and finished selvage.',
    hindi_description: 'पारंपरिक गड्ढा करघे पर बुना गया हल्का और मुलायम चंदेरी सिल्क-कॉटन स्टोल। शुद्ध रेशम और सूती धागों के साथ बारीक सुनहरी जरी बूटी और पारंपरिक किनारी डिजाइन।',
    price: 1850,
    bulk_price: 1150,
    min_order_quantity: 20,
    gem_category: 'Handloom Textiles & Apparels - Scarves & Stoles',
    hsn_code: '52085290',
    unspsc_code: '53102504',
    craft_origin: 'Chanderi, Madhya Pradesh',
    image_url: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=800&q=80',
    is_gem_ready: true,
    status: 'live',
    category: 'Textiles & Handloom',
    qty: 20,
  }
];

const EXPORT_CATALOG_URL = 'https://jrkrdlalnqswvwabktce.supabase.co/functions/v1/export-catalog';

export default function Catalog() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useAuth();
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // all | live | draft | sold_out
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [exportingFormat, setExportingFormat] = useState(null); // 'ondc' | 'gem' | 'gem_csv' | null
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

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
            image_url: item.image_url || 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&auto=format&fit=crop',
            is_gem_ready: item.is_gem_ready ?? true,
            status: item.status === 'published' ? 'live' : item.status || 'live',
            category: item.category || item.gem_category || 'Handicrafts',
            qty: item.stock || item.min_order_quantity || item.moq || 1,
          }));
          // Replace with live products from Supabase
          if (mapped.length > 0) {
            setProducts(mapped);
          }
        }
      } catch (e) {
        console.warn('Could not load products from Supabase:', e);
      }
    }
    loadSupabaseProducts();
  }, []);

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

    // Persist to Supabase if real product
    try {
      if (!String(productId).startsWith('sample-')) {
        const dbStatus = newStatus === 'live' ? 'published' : newStatus;
        const { error } = await supabase
          .from('products')
          .update({ status: dbStatus })
          .eq('id', productId);
        if (error) console.error('Supabase update status error:', error);
      }
    } catch (err) {
      console.error('Failed to update status in Supabase:', err);
    }
  };

  // Handle product delete
  const handleDeleteProduct = async (productId) => {
    // Optimistic UI update
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setSelectedProduct(null);
    showToast('🗑️ Product deleted from catalog');

    // Persist to Supabase
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      if (error) console.error('Supabase delete error:', error);
    } catch (err) {
      console.error('Failed to delete product from Supabase:', err);
    }
  };

  const handleExportCatalog = async (format) => {
    setExportingFormat(format);
    try {
      const queryFormat = format === 'gem_csv' ? 'csv' : format;
      let textContent = null;
      let jsonContent = null;

      try {
        const res = await fetch(`${EXPORT_CATALOG_URL}?format=${queryFormat}`, {
          method: 'GET',
        });
        if (res.ok) {
          if (queryFormat === 'csv') {
            textContent = await res.text();
          } else {
            jsonContent = await res.json();
          }
        }
      } catch (fetchErr) {
        console.warn(`[Export ${format}] Remote fetch failed, using local builder:`, fetchErr);
      }

      if (queryFormat === 'csv') {
        // Fallback CSV if remote fetch was unavailable
        if (!textContent) {
          const header = 'Product Title,Category,Retail Price (INR),Wholesale Price (INR),MOQ,GeM Category,HSN Code,UNSPSC Code,Status\n';
          const rows = products.map((p) =>
            `"${(p.title || '').replace(/"/g, '""')}","${p.category || 'Handicrafts'}",${p.price || 0},${Math.round((p.price || 0) * 0.72)},50,"Handicrafts","69120010","60121002","${p.status || 'live'}"`
          ).join('\n');
          textContent = header + rows;
        }

        const blob = new Blob([textContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'gem-bulk-import.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('✅ GeM Sheet (CSV) downloaded: gem-bulk-import.csv');
      } else if (format === 'gem') {
        // GeM Procurement Batch JSON
        if (!jsonContent) {
          jsonContent = {
            batch_id: `GEM-BATCH-${Date.now()}`,
            generated_at: new Date().toISOString(),
            procurement_ready_items: products.map((p) => ({
              product_id: p.id,
              title: p.title,
              gem_category: 'Handicrafts - Traditional Art & Decor',
              price_inr: p.price,
              bulk_price_inr: Math.round((p.price || 0) * 0.72),
              moq: 50,
              hsn_code: '69120010',
              unspsc_code: '60121002',
              status: p.status,
            })),
          };
        }

        const blob = new Blob([JSON.stringify(jsonContent, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'gem-procurement-batch.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('✅ GeM Batch (JSON) downloaded: gem-procurement-batch.json');
      } else {
        // ONDC Beckn Catalog JSON
        if (!jsonContent) {
          jsonContent = {
            context: {
              domain: 'nic2004:52110',
              country: 'IND',
              city: 'std:0542',
              action: 'on_search',
              core_version: '1.2.0',
              bap_id: 'ondc.buyer.app',
              bpp_id: 'artisan.seller.hub',
            },
            message: {
              catalog: {
                'bpp/descriptor': { name: 'Artisan Heritage Collective' },
                'bpp/providers': [
                  {
                    id: 'artisan-provider-1',
                    descriptor: { name: 'Heritage Artisans of India' },
                    items: products.map((p) => ({
                      id: String(p.id),
                      descriptor: { name: p.title, images: [p.image_url] },
                      price: { currency: 'INR', value: String(p.price) },
                      category_id: p.category,
                    })),
                  },
                ],
              },
            },
          };
        }

        const blob = new Blob([JSON.stringify(jsonContent, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'artisan-ondc-catalog.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('✅ ONDC Beckn (JSON) downloaded: artisan-ondc-catalog.json');
      }
    } catch (err) {
      console.error(`[Export ${format}]`, err);
      showToast(`❌ Export failed: ${err.message}`);
    } finally {
      setExportingFormat(null);
    }
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
      <main className="flex-1 flex flex-col relative w-full bg-surface min-h-screen">
        <div className="flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          
          {/* Header & Search */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-surface-container-high">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-secondary uppercase tracking-wider mb-1">
                  <span>{language === 'hi' ? 'कैटलॉग' : 'Catalog'}</span>
                  <span className="text-outline">/</span>
                  <span>{language === 'hi' ? 'दुकान इन्वेंटरी' : 'My Shop Inventory'}</span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl font-bold text-primary tracking-tight">
                    {language === 'hi' ? 'मेरी सूची (My Catalog)' : 'My Catalog / मेरी सूची'}
                  </h2>
                  <span className="px-3 py-1 bg-secondary-fixed text-on-secondary-fixed rounded-full text-xs font-bold">
                    {language === 'hi' ? `${products.length} उत्पाद सूचीबद्ध` : `${products.length} Items Listed`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative w-full sm:w-72">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] pointer-events-none">
                    search
                  </span>
                  <input
                    className="w-full h-12 pl-11 pr-10 bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant text-sm font-medium rounded-xl shadow-xs border border-surface-container-high focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                    id="productSearchInput"
                    placeholder={language === 'hi' ? 'शिल्प, साड़ी, मिट्टी के बर्तन खोजें...' : 'Search crafts, sarees, pottery...'}
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

                {/* Export Protocols Dropdown */}
                <div className="relative">
                  <button
                    id="export-protocols-btn"
                    aria-label="Export Protocols"
                    onClick={() => setExportMenuOpen((prev) => !prev)}
                    className="h-11 px-4 rounded-xl bg-secondary text-on-secondary font-bold text-xs shadow-md active:scale-95 flex items-center gap-1.5 hover:opacity-90 transition-all shrink-0 cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[17px]">download</span>
                    <span>{language === 'hi' ? 'प्रोटोकॉल निर्यात' : 'Export Protocols'}</span>
                    <span className="material-symbols-outlined text-[14px]">expand_more</span>
                  </button>

                  {exportMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-surface-container-lowest rounded-xl shadow-xl border border-surface-container-high z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                      <button
                        id="export-ondc-btn"
                        onClick={() => { handleExportCatalog('ondc'); setExportMenuOpen(false); }}
                        disabled={!!exportingFormat}
                        className="w-full px-4 py-3 text-left text-sm font-semibold text-on-surface hover:bg-surface-container flex items-center gap-3 transition-colors disabled:opacity-50 cursor-pointer"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px] text-secondary">hub</span>
                        <div>
                          <span className="block text-[13px] font-bold">{exportingFormat === 'ondc' ? (language === 'hi' ? 'डाउनलोड हो रहा है...' : 'Downloading...') : '📥 ONDC Beckn (JSON)'}</span>
                          <span className="block text-[11px] text-on-surface-variant">artisan-ondc-catalog.json</span>
                        </div>
                      </button>
                      <button
                        id="export-gem-btn"
                        onClick={() => { handleExportCatalog('gem'); setExportMenuOpen(false); }}
                        disabled={!!exportingFormat}
                        className="w-full px-4 py-3 text-left text-sm font-semibold text-on-surface hover:bg-surface-container flex items-center gap-3 border-t border-surface-container-high transition-colors disabled:opacity-50 cursor-pointer"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px] text-amber-600">account_balance</span>
                        <div>
                          <span className="block text-[13px] font-bold">{exportingFormat === 'gem' ? (language === 'hi' ? 'डाउनलोड हो रहा है...' : 'Downloading...') : '🏛️ GeM Batch (JSON)'}</span>
                          <span className="block text-[11px] text-on-surface-variant">gem-procurement-batch.json</span>
                        </div>
                      </button>
                      <button
                        id="export-gem-csv-btn"
                        onClick={() => { handleExportCatalog('csv'); setExportMenuOpen(false); }}
                        disabled={!!exportingFormat}
                        className="w-full px-4 py-3 text-left text-sm font-semibold text-on-surface hover:bg-surface-container flex items-center gap-3 border-t border-surface-container-high transition-colors disabled:opacity-50 cursor-pointer"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px] text-emerald-700">table_view</span>
                        <div>
                          <span className="block text-[13px] font-bold">{exportingFormat === 'csv' || exportingFormat === 'gem_csv' ? (language === 'hi' ? 'डाउनलोड हो रहा है...' : 'Downloading...') : '📊 GeM Sheet (CSV)'}</span>
                          <span className="block text-[11px] text-on-surface-variant">gem-bulk-import.csv</span>
                        </div>
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => navigate('/capture')}
                    className="h-11 px-4 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-md active:scale-95 flex items-center gap-1.5 hover:bg-primary-container transition-all shrink-0 cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    <span className="hidden md:inline">{language === 'hi' ? '+ नया शिल्प' : '+ Add Product'}</span>
                    <span className="md:hidden">+</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Inventory Status Bar */}
            <div className="bg-surface-container-low border border-surface-container rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1 w-full">
                <div className="flex items-center justify-between text-xs font-semibold text-on-surface-variant mb-2">
                  <span>{language === 'hi' ? 'समग्र स्टॉक उपलब्धता' : 'Overall Stock Availability'}</span>
                  <span className="font-bold text-primary">
                    {language === 'hi' ? '83% सक्रिय (डिस्पैच हेतु तैयार)' : '83% Active (Ready for dispatch)'}
                  </span>
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
                  {liveCount} {language === 'hi' ? 'सक्रिय' : 'Live'}
                </span>
                <span className="flex items-center gap-1.5 bg-surface-container-lowest px-3 py-1.5 rounded-xl border border-surface-container">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block"></span>
                  {draftCount} {language === 'hi' ? 'समीक्षाधीन' : 'In Review'}
                </span>
                <span className="flex items-center gap-1.5 bg-surface-container-lowest px-3 py-1.5 rounded-xl border border-surface-container">
                  <span className="w-2.5 h-2.5 rounded-full bg-error inline-block"></span>
                  {soldOutCount} {language === 'hi' ? 'बिक गया' : 'Sold Out'}
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
                  {language === 'hi' ? 'सभी' : 'All'} ({products.length})
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
          <div className="pt-1 pb-4">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" id="productsGrid">
                {filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    className="product-item flex flex-col bg-surface-container-lowest rounded-2xl p-3 border border-surface-container shadow-xs group relative hover:shadow-xl hover:border-secondary/40 transition-all cursor-pointer"
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
                          {p.status === 'live' 
                            ? (language === 'hi' ? 'सक्रिय' : 'Live') 
                            : p.status === 'draft' 
                            ? (language === 'hi' ? 'समीक्षा' : 'In Review') 
                            : (language === 'hi' ? 'बिक गया' : 'Sold Out')}
                        </span>
                      </div>

                      {/* Top right card actions: Delete Button & Options */}
                      <div className="absolute top-1.5 right-1.5 flex items-center gap-1.5 z-10">
                        {/* Direct Delete button on each card */}
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

                        {/* Details / Actions modal button */}
                        <button
                          aria-label="Product Options"
                          className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-md text-primary flex items-center justify-center shadow-md active:scale-90 hover:bg-white transition-all cursor-pointer"
                          onClick={() => setSelectedProduct(p)}
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
                        <span className="text-xs font-semibold text-on-surface-variant">
                          {language === 'hi' ? 'न्यूनतम आर्डर' : 'MOQ'}: {p.min_order_quantity || p.qty || 1}
                        </span>
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
                <h3 className="text-lg font-bold text-primary mb-1">
                  {language === 'hi' ? 'कोई शिल्प नहीं मिला' : 'No Crafts Discovered'}
                </h3>
                <p className="text-sm text-on-surface-variant max-w-xs mb-4 font-normal">
                  {language === 'hi'
                    ? `"${searchQuery}" से मेल खाने वाले शिल्प नहीं मिले। खोज साफ़ करें या अन्य श्रेणियां देखें।`
                    : `We couldn't locate items matching "${searchQuery}". Clear search or explore other categories.`}
                </p>
                <button
                  className="h-12 px-6 rounded-full bg-primary text-on-primary font-bold text-sm shadow-sm active:scale-95 cursor-pointer"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveFilter('all');
                  }}
                  type="button"
                >
                  {language === 'hi' ? 'फ़िल्टर साफ़ करें' : 'Clear All Filters'}
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
                  <h4 className="text-sm font-bold text-primary">
                    {language === 'hi' ? 'पुनः स्टॉक अधिसूचना' : 'Instant Restock Notification'}
                  </h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {language === 'hi'
                      ? 'दुकान में 2 उत्पादों को तुरंत स्टॉक करने की आवश्यकता है'
                      : '2 products require urgent replenishment in My Shop'}
                  </p>
                </div>
              </div>
              <button
                aria-label="Add craft to restock"
                className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-colors cursor-pointer"
                onClick={() => navigate('/capture')}
                type="button"
              >
                {language === 'hi' ? '+ स्टॉक जोड़ें' : '+ Restock Craft'}
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
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(selectedProduct.id, 'live')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      selectedProduct.status === 'live'
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>{language === 'hi' ? 'सक्रिय' : 'Live'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(selectedProduct.id, 'draft')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      selectedProduct.status === 'draft'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-300"></span>
                    <span>{language === 'hi' ? 'समीक्षा' : 'Review'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(selectedProduct.id, 'sold_out')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      selectedProduct.status === 'sold_out'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-red-300"></span>
                    <span>{language === 'hi' ? 'बिक गया' : 'Sold Out'}</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
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
                  <span>{language === 'hi' ? 'समान शिल्प जोड़ें' : 'Capture Similar Craft'}</span>
                </button>

                <button
                  onClick={() => {
                    showToast(language === 'hi' ? 'शेयर लिंक क्लिपबोर्ड पर कॉपी किया गया!' : 'Share link copied to clipboard!');
                    navigator.clipboard?.writeText(window.location.href);
                    setSelectedProduct(null);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">share</span>
                  <span>{language === 'hi' ? 'कैटलॉग लिंक शेयर करें' : 'Share Catalog Link'}</span>
                </button>

                <button
                  onClick={() => handleDeleteProduct(selectedProduct.id)}
                  className="w-full py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs flex items-center justify-center gap-2 border border-red-200 transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                  <span>{language === 'hi' ? 'उत्पाद हटाएं' : 'Delete Product'}</span>
                </button>
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
      </main>
    </div>
  );
}
