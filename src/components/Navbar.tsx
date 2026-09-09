import React from 'react';
import { Hammer, Plus, Search, MessageSquare, Grid, Users, Database } from 'lucide-react';

interface NavbarProps {
  activeTab: 'catalogue' | 'artisans' | 'inquiries';
  setActiveTab: (tab: 'catalogue' | 'artisans' | 'inquiries') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenAddModal: () => void;
  inquiryCount: number;
  isConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  onOpenAddModal,
  inquiryCount,
  isConnected,
}) => {
  return (
    <nav className="glass-nav sticky top-0 z-40 px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('catalogue')}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Hammer className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white serif-font">Shilp Setu</h1>
            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full flex items-center gap-1 ${
              isConnected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              <Database className="w-2.5 h-2.5" />
              {isConnected ? 'Supabase Live' : 'Connecting...'}
            </span>
          </div>
          <p className="text-xs text-neutral-400 hidden sm:block">Curated Handcrafted Masterpieces</p>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-2 min-w-[200px]">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by craft, material, or artisan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-800/80 border border-neutral-700/60 rounded-xl text-sm text-white placeholder-neutral-400 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex bg-neutral-900/80 p-1 rounded-xl border border-neutral-800">
          <button
            onClick={() => setActiveTab('catalogue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'catalogue' ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm' : 'text-neutral-300 hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            Catalogue
          </button>
          
          <button
            onClick={() => setActiveTab('artisans')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'artisans' ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm' : 'text-neutral-300 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Artisans
          </button>

          <button
            onClick={() => setActiveTab('inquiries')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 relative transition-all ${
              activeTab === 'inquiries' ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm' : 'text-neutral-300 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Inquiries
            {inquiryCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-bold">
                {inquiryCount}
              </span>
            )}
          </button>
        </div>

        <a
          href="/html_screens/index.html"
          className="px-3 py-2 rounded-xl text-xs font-bold bg-[#ff9062]/20 hover:bg-[#ff9062]/30 text-[#ff9062] border border-[#ff9062]/30 flex items-center gap-1.5 transition-all shadow-sm"
          title="Open Google Stitch 7-Screen Web Dashboards"
        >
          <span className="w-2 h-2 rounded-full bg-[#ff9062] animate-pulse"></span>
          <span>7 Web Screens</span>
        </a>

        <button
          onClick={onOpenAddModal}
          className="btn-primary text-xs py-2 px-3 sm:px-4"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Product</span>
        </button>
      </div>
    </nav>
  );
};
