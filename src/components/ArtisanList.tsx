import React from 'react';
import type { Artisan } from '../types/database';
import { Star, MapPin, Award, ShieldCheck } from 'lucide-react';

interface ArtisanListProps {
  artisans: Artisan[];
}

export const ArtisanList: React.FC<ArtisanListProps> = ({ artisans }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-white serif-font">Master Artisans Directory</h2>
          <p className="text-sm text-neutral-400 mt-1">
            Meet the master craftspeople behind the creations. All artisan profiles are synced from Supabase.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{artisans.length} Verified Craftspeople</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {artisans.map((artisan) => (
          <div
            key={artisan.id}
            className="glass-panel p-6 rounded-2xl border border-neutral-800 hover:border-amber-500/40 transition-all duration-300 space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <img
                  src={artisan.avatar_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2'}
                  alt={artisan.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/60 shadow-lg shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white truncate serif-font">{artisan.name}</h3>
                  <p className="text-xs text-amber-400 font-semibold">{artisan.craft_type}</p>
                  
                  {artisan.location && (
                    <p className="text-xs text-neutral-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>{artisan.location}</span>
                    </p>
                  )}
                </div>
              </div>

              {artisan.bio && (
                <p className="text-xs text-neutral-300 leading-relaxed italic bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/80">
                  "{artisan.bio}"
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{artisan.rating} / 5.0</span>
              </div>

              <div className="flex items-center gap-1 font-medium text-neutral-300">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>{artisan.experience_years} Years Experience</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
