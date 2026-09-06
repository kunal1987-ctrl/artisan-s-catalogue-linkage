import React from 'react';
import type { Product } from '../types/database';
import { Star, MapPin, Eye, Sparkles } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  return (
    <div 
      onClick={() => onSelect(product)}
      className="group relative glass-panel rounded-2xl overflow-hidden border border-neutral-800 hover:border-amber-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/10 cursor-pointer flex flex-col justify-between"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-900">
        <img
          src={product.image_url || 'https://images.unsplash.com/photo-1612196808214-b7e239e5f6b7?auto=format&fit=crop&w=800&q=80'}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent opacity-80" />

        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <span className="badge badge-amber font-semibold text-[11px] backdrop-blur-md">
            {product.category}
          </span>
          {product.featured && (
            <span className="badge bg-amber-500/90 text-neutral-950 font-bold text-[10px] flex items-center gap-1 shadow-md">
              <Sparkles className="w-2.5 h-2.5" /> Featured
            </span>
          )}
        </div>

        <div className="absolute top-3 right-3">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-md border ${
            product.stock > 0
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
          }`}>
            {product.stock > 0 ? `${product.stock} in stock` : 'Made to order'}
          </span>
        </div>

        {product.artisans && (
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <img
                src={product.artisans.avatar_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2'}
                alt={product.artisans.name}
                className="w-7 h-7 rounded-full object-cover border border-amber-500/60 shadow"
              />
              <div>
                <p className="text-xs font-semibold leading-tight line-clamp-1">{product.artisans.name}</p>
                {product.artisans.location && (
                  <p className="text-[10px] text-neutral-300 flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                    <span className="truncate max-w-[120px]">{product.artisans.location}</span>
                  </p>
                )}
              </div>
            </div>
            {product.artisans.rating && (
              <div className="flex items-center gap-1 bg-neutral-900/80 px-2 py-0.5 rounded-full border border-neutral-700/60 text-[11px] font-bold text-amber-400">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{product.artisans.rating}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1 serif-font">
            {product.title}
          </h3>
          <p className="text-xs text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
            {product.description || 'Handcrafted product made with sustainable techniques.'}
          </p>
        </div>

        {product.material && (
          <div className="text-[11px] text-neutral-400 bg-neutral-900/60 px-2.5 py-1 rounded-lg border border-neutral-800/80 truncate">
            <span className="text-neutral-500 font-semibold">Material:</span> {product.material}
          </div>
        )}

        <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Price</span>
            <span className="text-xl font-extrabold text-white">
              ${Number(product.price).toFixed(2)}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product);
            }}
            className="btn-secondary text-xs py-1.5 px-3 hover:border-amber-500/50 hover:text-amber-400"
          >
            <Eye className="w-3.5 h-3.5" />
            Inquire
          </button>
        </div>
      </div>
    </div>
  );
};
