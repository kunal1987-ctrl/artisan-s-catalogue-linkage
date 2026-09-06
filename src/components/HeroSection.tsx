import React from 'react';
import { Sparkles, ShieldCheck, Feather, Layers } from 'lucide-react';

interface HeroSectionProps {
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  categories: string[];
  totalProducts: number;
  totalArtisans: number;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  selectedCategory,
  setSelectedCategory,
  categories,
  totalProducts,
  totalArtisans,
}) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-neutral-900 via-neutral-900/90 to-neutral-950 border-b border-neutral-800/80 px-4 lg:px-8 py-10 lg:py-14">
      <div className="absolute -top-24 -left-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-20 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
        <div className="space-y-4 max-w-2xl text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Direct from Master Artisans Worldwide</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight serif-font">
            Discover Authentic <span className="gradient-text">Handcrafted</span> Works of Art
          </h2>

          <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
            Connected to your live Supabase database. Browse rare pottery, hand-turned woodworking, intricate textiles, and custom leatherwork directly from verified craft masters.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-bold shadow-md shadow-amber-500/20 scale-105'
                    : 'bg-neutral-800/70 text-neutral-300 hover:bg-neutral-800 hover:text-white border border-neutral-700/50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full md:w-auto shrink-0">
          <div className="glass-panel p-5 rounded-2xl border border-neutral-700/60 text-center space-y-1">
            <div className="w-10 h-10 mx-auto rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-2">
              <Layers className="w-5 h-5" />
            </div>
            <p className="text-2xl lg:text-3xl font-extrabold text-white">{totalProducts}</p>
            <p className="text-xs text-neutral-400 font-medium">Unique Products</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-neutral-700/60 text-center space-y-1">
            <div className="w-10 h-10 mx-auto rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-2">
              <Feather className="w-5 h-5" />
            </div>
            <p className="text-2xl lg:text-3xl font-extrabold text-white">{totalArtisans}</p>
            <p className="text-xs text-neutral-400 font-medium">Master Artisans</p>
          </div>

          <div className="col-span-2 glass-panel p-4 rounded-2xl border border-neutral-700/60 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">100% Verified Provenance</p>
                <p className="text-[11px] text-neutral-400">Database linked with Supabase RLS</p>
              </div>
            </div>
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};
