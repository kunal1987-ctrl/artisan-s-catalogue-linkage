import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import type { Product, Artisan, Inquiry } from './types/database';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { AddProductModal } from './components/AddProductModal';
import { ArtisanList } from './components/ArtisanList';
import { InquiriesList } from './components/InquiriesList';
import { Database, AlertCircle, RefreshCw } from 'lucide-react';

export function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);

  const [activeTab, setActiveTab] = useState<'catalogue' | 'artisans' | 'inquiries'>('catalogue');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  const categories = ['All', 'Ceramics', 'Woodworking', 'Textiles', 'Leatherwork', 'Jewelry'];

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: artisansData, error: artisansErr } = await supabase
        .from('artisans')
        .select('*')
        .order('rating', { ascending: false });

      if (artisansErr) throw artisansErr;
      setArtisans(artisansData || []);

      const { data: productsData, error: productsErr } = await supabase
        .from('products')
        .select('*, artisans(*)')
        .order('created_at', { ascending: false });

      if (productsErr) throw productsErr;
      setProducts(productsData || []);

      const { data: inquiriesData, error: inquiriesErr } = await supabase
        .from('inquiries')
        .select('*, products(title, image_url)')
        .order('created_at', { ascending: false });

      if (inquiriesErr) throw inquiriesErr;
      setInquiries(inquiriesData || []);

      setIsConnected(true);
    } catch (err) {
      console.error('Error fetching data from Supabase:', err);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      p.title.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      (p.material && p.material.toLowerCase().includes(query)) ||
      (p.artisans && p.artisans.name.toLowerCase().includes(query));

    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0f1117] text-white font-sans flex flex-col justify-between">
      <div>
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          inquiryCount={inquiries.length}
          isConnected={isConnected}
        />

        {activeTab === 'catalogue' && (
          <HeroSection
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            categories={categories}
            totalProducts={products.length}
            totalArtisans={artisans.length}
          />
        )}

        {!isConnected && (
          <div className="bg-rose-500/10 border-b border-rose-500/20 px-4 py-3 text-center text-xs text-rose-300 flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>Could not fetch live Supabase data. Please verify network or project permissions.</span>
            <button onClick={fetchData} className="underline font-bold hover:text-white flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}

        <main className="pb-16">
          {activeTab === 'catalogue' && (
            <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white serif-font">
                    {selectedCategory === 'All' ? 'All Handcrafted Masterpieces' : `${selectedCategory} Collection`}
                  </h3>
                  <p className="text-xs text-neutral-400">Showing {filteredProducts.length} items</p>
                </div>

                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-amber-400 hover:underline"
                  >
                    Clear search filter
                  </button>
                )}
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 py-12">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="glass-panel h-80 rounded-2xl animate-pulse bg-neutral-900/60" />
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="glass-panel rounded-3xl p-12 text-center max-w-md mx-auto space-y-3">
                  <Database className="w-12 h-12 text-neutral-600 mx-auto" />
                  <h4 className="text-lg font-bold text-white">No products found</h4>
                  <p className="text-xs text-neutral-400">
                    Try selecting a different category or click "Add Product" to create one in your Supabase database!
                  </p>
                  <button onClick={() => setIsAddModalOpen(true)} className="btn-primary text-xs mx-auto">
                    Add First Product
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onSelect={(p) => setSelectedProduct(p)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'artisans' && <ArtisanList artisans={artisans} />}

          {activeTab === 'inquiries' && <InquiriesList inquiries={inquiries} onRefresh={fetchData} />}
        </main>
      </div>

      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onInquirySubmitted={fetchData}
      />

      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        artisans={artisans}
        onProductAdded={fetchData}
      />

      <footer className="border-t border-neutral-800/80 bg-neutral-950 py-8 px-4 lg:px-8 text-center text-xs text-neutral-400 space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Database className="w-3.5 h-3.5 text-amber-500" />
          <span>Connected to Supabase Project: <code className="text-amber-400 bg-neutral-900 px-1.5 py-0.5 rounded">jrkrdlalnqswvwabktce</code></span>
        </div>
        <p>© {new Date().getFullYear()} Shilp Setu. Built with Vite, React & Supabase Backend.</p>
      </footer>
    </div>
  );
}

export default App;
