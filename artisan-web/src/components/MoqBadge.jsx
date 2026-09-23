import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

/**
 * MoqBadge Component:
 * Displays dynamic MOQ value (defaulting to 1 if null) and provides an
 * inline stepper (- / input / +) allowing artisans to adjust MOQ on the fly
 * with strict database persistence to both 'products' and 'items' tables.
 */
export default function MoqBadge({
  product,
  onMoqUpdated,
  className = '',
}) {
  const { showToast, language } = useAuth?.() || {};
  const currentMoq = Number(product?.moq ?? product?.min_order_quantity ?? 1);

  const [isEditingMoq, setIsEditingMoq] = useState(false);
  const [moqValue, setMoqValue] = useState(currentMoq);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setMoqValue(Number(product?.moq ?? product?.min_order_quantity ?? 1));
  }, [product?.moq, product?.min_order_quantity]);

  const handleUpdateMoq = async (newMoq) => {
    if (!product?.id) return;
    setIsUpdating(true);

    try {
      let { error } = await supabase
        .from('products')
        .update({ moq: Number(newMoq), min_order_quantity: Number(newMoq) })
        .eq('id', product.id);

      // Also ensure 'items' table receives the update for complete compatibility
      const itemsRes = await supabase
        .from('items')
        .update({ moq: Number(newMoq), min_order_quantity: Number(newMoq) })
        .eq('id', product.id);

      if (error && itemsRes.error) {
        throw error || itemsRes.error;
      }

      // Update in local state / context so UI updates immediately
      if (onMoqUpdated) {
        onMoqUpdated(product.id, Number(newMoq));
      }

      const msg =
        language === 'hi'
          ? `✅ न्यूनतम आदेश (MOQ) ${newMoq} पर सहेजा गया!`
          : `✅ MOQ updated to ${newMoq} units!`;
      if (showToast) showToast(msg);

      setIsEditingMoq(false);
    } catch (err) {
      console.error('Error updating MOQ:', err);
      alert('Failed to update MOQ. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isEditingMoq) {
    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1.5 p-1 bg-white border border-stone-300 rounded-xl shadow-sm z-10"
      >
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => setMoqValue((prev) => Math.max(1, prev - 1))}
          className="w-7 h-7 rounded-lg bg-stone-100 font-bold text-stone-700 hover:bg-stone-200 active:scale-90 transition flex items-center justify-center cursor-pointer select-none disabled:opacity-50"
          title="Decrease MOQ"
          aria-label="Decrease MOQ"
        >
          -
        </button>

        <input
          type="number"
          min="1"
          value={moqValue}
          onChange={(e) => setMoqValue(Math.max(1, parseInt(e.target.value) || 1))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleUpdateMoq(moqValue);
            if (e.key === 'Escape') setIsEditingMoq(false);
          }}
          className="w-14 text-center border border-stone-300 rounded-lg py-0.5 font-semibold text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-800"
          autoFocus
        />

        <button
          type="button"
          disabled={isUpdating}
          onClick={() => setMoqValue((prev) => prev + 1)}
          className="w-7 h-7 rounded-lg bg-stone-100 font-bold text-stone-700 hover:bg-stone-200 active:scale-90 transition flex items-center justify-center cursor-pointer select-none disabled:opacity-50"
          title="Increase MOQ"
          aria-label="Increase MOQ"
        >
          +
        </button>

        <button
          type="button"
          disabled={isUpdating}
          onClick={() => handleUpdateMoq(moqValue)}
          className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center cursor-pointer transition active:scale-90 disabled:opacity-50 shadow-2xs"
          title="Save MOQ"
          aria-label="Save MOQ"
        >
          <span className="material-symbols-outlined text-[14px]">
            {isUpdating ? 'hourglass_top' : 'check'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMoqValue(currentMoq);
            setIsEditingMoq(false);
          }}
          className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center cursor-pointer transition"
          title="Cancel"
          aria-label="Cancel"
        >
          <span className="material-symbols-outlined text-[14px]">close</span>
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        setIsEditingMoq(true);
      }}
      className={`inline-flex items-center gap-1.5 cursor-pointer hover:bg-stone-100 px-2 py-1 rounded-lg transition ${className}`}
      title="Click to edit MOQ"
    >
      <span className="material-symbols-outlined text-[16px] text-stone-700">inventory_2</span>
      <span className="text-xs font-semibold text-stone-800">
        MOQ: {product?.moq || product?.min_order_quantity || 1}
      </span>
      <span className="material-symbols-outlined text-[12px] text-stone-400 opacity-60 hover:opacity-100">
        edit
      </span>
    </div>
  );
}
