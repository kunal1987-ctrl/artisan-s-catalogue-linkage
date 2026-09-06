import React, { useState } from 'react';
import type { Artisan } from '../types/database';
import { supabase } from '../lib/supabaseClient';
import { X, Plus, Sparkles, Image } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  artisans: Artisan[];
  onProductAdded: () => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  artisans,
  onProductAdded,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Ceramics');
  const [price, setPrice] = useState('');
  const [material, setMaterial] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedArtisanId, setSelectedArtisanId] = useState('');
  const [newArtisanName, setNewArtisanName] = useState('');
  const [newArtisanCraft, setNewArtisanCraft] = useState('');
  const [newArtisanLocation, setNewArtisanLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price) {
      setErrorMsg('Product title and price are required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      let artisanId = selectedArtisanId;

      if (!artisanId && newArtisanName) {
        const { data: newArtisan, error: artisanErr } = await supabase
          .from('artisans')
          .insert([
            {
              name: newArtisanName,
              craft_type: newArtisanCraft || category,
              location: newArtisanLocation || 'Global Studio',
              avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(newArtisanName)}`,
              rating: 5.0,
              experience_years: 4,
            },
          ])
          .select()
          .single();

        if (artisanErr) throw artisanErr;
        artisanId = newArtisan.id;
      }

      const defaultImg = 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80';

      const { error: prodErr } = await supabase.from('products').insert([
        {
          artisan_id: artisanId || (artisans[0]?.id ?? null),
          title,
          description,
          category,
          price: parseFloat(price),
          material,
          dimensions,
          image_url: imageUrl || defaultImg,
          featured: true,
          stock: 5,
        },
      ]);

      if (prodErr) throw prodErr;

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      onProductAdded();
      onClose();
    } catch (err: any) {
      console.error('Error inserting product into Supabase:', err);
      setErrorMsg(err.message || 'Failed to add product to Supabase.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-neutral-950/80 hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center border border-neutral-700/60"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Supabase Insert Operation</span>
          </div>
          <h2 className="text-2xl font-bold text-white serif-font">Add New Craft to Catalogue</h2>
          <p className="text-xs text-neutral-400 mt-1">
            This will insert a new row into the <code className="text-amber-400 bg-neutral-950 px-1 py-0.5 rounded">products</code> table in your connected database.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Hand-carved Cedar Bowl"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/60"
              >
                <option value="Ceramics">Ceramics</option>
                <option value="Woodworking">Woodworking</option>
                <option value="Textiles">Textiles</option>
                <option value="Leatherwork">Leatherwork</option>
                <option value="Jewelry">Jewelry</option>
                <option value="Glass Art">Glass Art</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Price (USD) *</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="150.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Material</label>
              <input
                type="text"
                placeholder="e.g. Cedar Wood & Beeswax"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Dimensions</label>
              <input
                type="text"
                placeholder="e.g. 10&quot; W x 4&quot; H"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">Image URL</label>
            <div className="relative">
              <Image className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="url"
                placeholder="https://images.unsplash.com/photo-..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">Artisan Creator</label>
            <select
              value={selectedArtisanId}
              onChange={(e) => setSelectedArtisanId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/60 mb-2"
            >
              <option value="">-- Select Existing Artisan or Create New --</option>
              {artisans.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.craft_type})
                </option>
              ))}
            </select>

            {!selectedArtisanId && (
              <div className="p-3 bg-neutral-950/80 border border-neutral-800 rounded-xl space-y-2 mt-2">
                <p className="text-[11px] font-semibold text-amber-400">Add New Artisan Details:</p>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Artisan Name"
                    value={newArtisanName}
                    onChange={(e) => setNewArtisanName(e.target.value)}
                    className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Craft Type"
                    value={newArtisanCraft}
                    onChange={(e) => setNewArtisanCraft(e.target.value)}
                    className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Location (e.g. Kyoto)"
                    value={newArtisanLocation}
                    onChange={(e) => setNewArtisanLocation(e.target.value)}
                    className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Describe the craft techniques, inspiration, and uniqueness..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/60"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-xs"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Save to Supabase
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
