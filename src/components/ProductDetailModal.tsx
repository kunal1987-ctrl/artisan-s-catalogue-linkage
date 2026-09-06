import React, { useState } from 'react';
import type { Product } from '../types/database';
import { supabase } from '../lib/supabaseClient';
import { X, Send, CheckCircle2, MapPin, Star, ShieldCheck, Tag, Box, Feather } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onInquirySubmitted?: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onInquirySubmitted,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!product) return null;

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerEmail || !message) {
      setErrorMsg('Please fill in all fields before sending.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const { error } = await supabase
        .from('inquiries')
        .insert([
          {
            product_id: product.id,
            customer_name: customerName,
            customer_email: customerEmail,
            message: message,
          },
        ]);

      if (error) {
        throw error;
      }

      setSubmittedSuccess(true);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      if (onInquirySubmitted) onInquirySubmitted();
    } catch (err: any) {
      console.error('Error submitting inquiry:', err);
      setErrorMsg(err.message || 'Failed to submit inquiry to Supabase.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-neutral-950/80 hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center border border-neutral-700/60 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="p-6 md:p-8 bg-neutral-950/50 space-y-6 border-b md:border-b-0 md:border-r border-neutral-800">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900">
              <img
                src={product.image_url || 'https://images.unsplash.com/photo-1612196808214-b7e239e5f6b7'}
                alt={product.title}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-3 left-3 badge badge-amber">
                {product.category}
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white serif-font">{product.title}</h2>
              <p className="text-2xl font-extrabold text-amber-400 mt-1">${Number(product.price).toFixed(2)}</p>
              <p className="text-sm text-neutral-300 mt-3 leading-relaxed">{product.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {product.material && (
                <div className="bg-neutral-900 p-3 rounded-xl border border-neutral-800">
                  <div className="flex items-center gap-1.5 text-neutral-400 font-semibold mb-1">
                    <Tag className="w-3.5 h-3.5 text-amber-400" /> Material
                  </div>
                  <p className="text-white font-medium">{product.material}</p>
                </div>
              )}

              {product.dimensions && (
                <div className="bg-neutral-900 p-3 rounded-xl border border-neutral-800">
                  <div className="flex items-center gap-1.5 text-neutral-400 font-semibold mb-1">
                    <Box className="w-3.5 h-3.5 text-amber-400" /> Dimensions
                  </div>
                  <p className="text-white font-medium">{product.dimensions}</p>
                </div>
              )}
            </div>

            {product.artisans && (
              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-start gap-3">
                <img
                  src={product.artisans.avatar_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2'}
                  alt={product.artisans.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-amber-500/60 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white truncate">{product.artisans.name}</h4>
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
                      <Star className="w-3 h-3 fill-amber-400" /> {product.artisans.rating}
                    </span>
                  </div>
                  <p className="text-xs text-amber-400/90 font-medium">{product.artisans.craft_type}</p>
                  {product.artisans.location && (
                    <p className="text-xs text-neutral-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-amber-400 shrink-0" /> {product.artisans.location}
                    </p>
                  )}
                  {product.artisans.bio && (
                    <p className="text-[11px] text-neutral-400 mt-2 line-clamp-2 italic">{product.artisans.bio}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 md:p-8 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Feather className="w-4 h-4" />
                <span>Supabase Direct Inquiry</span>
              </div>
              <h3 className="text-xl font-bold text-white mt-1 serif-font">Inquire or Custom Order</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Send a custom request directly to the artisan. Your request will be saved in your live Supabase database.
              </p>
            </div>

            {submittedSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3 my-auto">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-lg font-bold text-white">Inquiry Sent to Supabase!</h4>
                <p className="text-xs text-emerald-200">
                  Your message has been stored in the <code className="bg-emerald-950 px-1.5 py-0.5 rounded text-emerald-400">inquiries</code> table.
                </p>
                <button
                  onClick={() => {
                    setSubmittedSuccess(false);
                    onClose();
                  }}
                  className="btn-primary text-xs py-2 px-6 mt-2"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitInquiry} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="sarah@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Message or Custom Requirements</label>
                  <textarea
                    rows={4}
                    required
                    placeholder={`Hello! I'm interested in "${product.title}". Is it possible to request custom dimensions or lead times?`}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/60"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full btn-primary py-3 justify-center text-sm font-bold"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving to Supabase...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="w-4 h-4" /> Send Inquiry to Artisan
                      </span>
                    )}
                  </button>
                </div>
              </form>
            )}

            <div className="pt-4 border-t border-neutral-800 text-[11px] text-neutral-400 flex items-center gap-2 justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Row Level Security (RLS) enabled on Supabase</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
