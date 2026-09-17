/**
 * DevOrderSimulator.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Shilp Setu — Developer Order Simulation Panel
 *
 * ⚠️  DEVELOPMENT ONLY — renders nothing in production builds.
 *     Controlled by import.meta.env.DEV (Vite strips this in prod).
 *
 * Features:
 *  • "Simulate Incoming GeM Bulk Order" — inserts a realistic 300-unit GeM
 *    order into Supabase `orders` table, triggering the full Realtime pipeline.
 *  • "Simulate ONDC Retail Order" — random consumer retail order.
 *  • Collapsible floating panel — bottom-right corner, always on top.
 *  • Shows last insert status (success / error) with row ID.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

// ── Mock Data ─────────────────────────────────────────────────────────────────

const GEM_BULK_ORDERS = [
  {
    source: 'GeM',
    product_title: 'Handcrafted Terracotta Earthen Pitcher (Surahi)',
    product_image_url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
    quantity: 300,
    total_payout: 78000,
    buyer_name: 'Ministry of Tourism & Culture (Govt. of India)',
    channel: 'GeM',
    order_type: 'gem',
    item_title: 'Handcrafted Terracotta Earthen Pitcher (Surahi)',
    total_amount: 78000,
    unit_price_inr: 260,
    shipping_address: 'Central State Guest House, Chanakyapuri, New Delhi - 110021',
    city: 'New Delhi',
    payment_mode: 'GeM PFMS Verified Institutional Escrow (Auto-settlement on Dispatch)',
    notes: 'Bulk procurement for National Tourism Conclave 2026',
    hsn_code: '69120010',
    voice_announcement_text: 'बधाई हो! सरकारी विभाग GeM से 300 पीस का नया आर्डर आया है। Handcrafted Terracotta Earthen Pitcher। कुल राशि ₹78,000। जल्दी से सामान पैक करें।',
  },
  {
    source: 'GeM',
    product_title: 'GI-Certified Jaipur Blue Pottery Decorative Wall Plate (10 Inch)',
    product_image_url: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80',
    quantity: 150,
    total_payout: 117000,
    buyer_name: 'TRIFED - Tribal Co-operative Marketing Federation',
    channel: 'GeM',
    order_type: 'gem',
    item_title: 'GI-Certified Jaipur Blue Pottery Decorative Wall Plate (10 Inch)',
    total_amount: 117000,
    unit_price_inr: 780,
    shipping_address: 'TRIFED Central Fulfillment Hub, Sector 62, Noida, UP - 201309',
    city: 'Noida',
    payment_mode: 'GeM PFMS Verified Institutional Escrow',
    notes: 'State emporium consignment batch under Aatmanirbhar Bharat',
    hsn_code: '69139000',
    voice_announcement_text: 'बधाई हो! TRIFED GeM से 150 पीस ब्लू पॉटरी का बड़ा आर्डर आया है। कुल राशि ₹1,17,000। जल्दी से सामान पैक करें।',
  },
  {
    source: 'GeM',
    product_title: 'Handwoven Chanderi Silk-Cotton Zari Border Stole',
    product_image_url: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=800&q=80',
    quantity: 200,
    total_payout: 230000,
    buyer_name: 'Ministry of Textiles (Office of DC Handlooms)',
    channel: 'GeM',
    order_type: 'gem',
    item_title: 'Handwoven Chanderi Silk-Cotton Zari Border Stole',
    total_amount: 230000,
    unit_price_inr: 1150,
    shipping_address: 'Room 312, Udyog Bhawan, Rafi Marg, New Delhi - 110011',
    city: 'New Delhi',
    payment_mode: 'GeM PFMS Institutional Escrow',
    notes: 'Gift procurement for National Handloom Day delegates 2026',
    hsn_code: '52085290',
    voice_announcement_text: 'बधाई हो! कपड़ा मंत्रालय GeM से 200 चंदेरी स्टोल का नया आर्डर आया है। कुल राशि ₹2,30,000। जल्दी से सामान पैक करें।',
  },
];

const ONDC_RETAIL_ORDERS = [
  {
    source: 'ONDC',
    product_title: 'Handcrafted Terracotta Earthen Pitcher (Surahi)',
    product_image_url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
    quantity: 2,
    total_payout: 900,
    buyer_name: 'Priya Sharma (Bengaluru)',
    channel: 'ONDC Network (Paytm Mall BAP)',
    order_type: 'ondc',
    item_title: 'Handcrafted Terracotta Earthen Pitcher (Surahi)',
    total_amount: 900,
    unit_price_inr: 450,
    shipping_address: 'Flat 402, Green Glen Layout, Bellandur, Bengaluru - 560103',
    city: 'Bengaluru',
    payment_mode: 'ONDC Protocol Escrow (RSP Settlement via UPI)',
    notes: 'Customer retail order via ONDC network',
    hsn_code: '69120010',
    voice_announcement_text: 'नया आर्डर आया! ONDC नेटवर्क से 2 नग सुराही का ऑर्डर है। कुल कीमत ₹900। सामान तैयार करें।',
  },
  {
    source: 'ONDC',
    product_title: 'GI-Certified Jaipur Blue Pottery Decorative Wall Plate (10 Inch)',
    product_image_url: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80',
    quantity: 1,
    total_payout: 1250,
    buyer_name: 'Amitabh Sen (Kolkata)',
    channel: 'ONDC Network (PhonePe Pincode)',
    order_type: 'ondc',
    item_title: 'GI-Certified Jaipur Blue Pottery Decorative Wall Plate (10 Inch)',
    total_amount: 1250,
    unit_price_inr: 1250,
    shipping_address: '14B Lake Temple Road, Southern Avenue, Kolkata - 700029',
    city: 'Kolkata',
    payment_mode: 'ONDC Protocol Settlement via UPI / BharatQR',
    notes: 'Consumer retail purchase via ONDC',
    hsn_code: '69139000',
    voice_announcement_text: 'नया आर्डर आया! ONDC से 1 ब्लू पॉटरी प्लेट का ऑर्डर है। कुल कीमत ₹1,250। सामान तैयार करें।',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function DevOrderSimulator() {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', msg: string }
  const [isLoading, setIsLoading] = useState(false);

  const insertOrder = useCallback(async (template) => {
    setIsLoading(true);
    setStatus(null);

    const timestamp = Date.now();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const isGem = template.source === 'GeM';
    const orderId = isGem
      ? `GEM-PO-2026-${randomSuffix}`
      : `ONDC-BECKN-${timestamp.toString().slice(-4)}-${randomSuffix}`;

    const row = {
      // New schema columns
      source: template.source,
      product_title: template.product_title,
      product_image_url: template.product_image_url,
      quantity: template.quantity,
      total_payout: template.total_payout,
      status: 'new',
      voice_announcement_text: template.voice_announcement_text,
      // Legacy schema columns (for backward-compat with existing Orders.jsx mapper)
      order_id: orderId,
      buyer_name: template.buyer_name,
      channel: template.channel,
      order_type: template.order_type,
      item_title: template.item_title,
      total_amount: template.total_amount,
      unit_price_inr: template.unit_price_inr,
      total_price_inr: template.total_amount,
      shipping_address: template.shipping_address,
      city: template.city,
      payment_mode: template.payment_mode,
      notes: template.notes,
      hsn_code: template.hsn_code,
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase.from('orders').insert([row]).select('id').single();

      if (error) {
        console.error('[DevOrderSimulator] Insert failed:', error);
        setStatus({
          type: 'error',
          msg: `❌ Insert failed: ${error.message}`,
        });
      } else {
        setStatus({
          type: 'success',
          msg: `✅ Inserted! ID: ${data?.id?.slice(0, 8)}… • ${template.source} • ${template.quantity} pcs`,
        });
      }
    } catch (err) {
      console.error('[DevOrderSimulator] Unexpected error:', err);
      setStatus({ type: 'error', msg: `❌ Error: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const simulateGeMBulk = useCallback(() => {
    const template = GEM_BULK_ORDERS[0]; // 300-piece GeM order as primary test
    insertOrder(template);
  }, [insertOrder]);

  const simulateGeMRandom = useCallback(() => {
    const template = GEM_BULK_ORDERS[Math.floor(Math.random() * GEM_BULK_ORDERS.length)];
    insertOrder(template);
  }, [insertOrder]);

  const simulateONDC = useCallback(() => {
    const template = ONDC_RETAIL_ORDERS[Math.floor(Math.random() * ONDC_RETAIL_ORDERS.length)];
    insertOrder(template);
  }, [insertOrder]);

  if (!import.meta.env.DEV) return null;

  return (
    <div
      className="fixed bottom-20 right-3 sm:right-4 lg:bottom-4 z-[9999] flex flex-col items-end gap-2"
      style={{ fontFamily: 'system-ui, sans-serif' }}
    >
      {/* Expanded Panel */}
      {isOpen && (
        <div
          className="bg-gray-950 border border-gray-700 rounded-2xl shadow-2xl p-4 w-72 flex flex-col gap-3"
          style={{ backdropFilter: 'blur(12px)' }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-gray-700 pb-2">
            <span className="text-xs font-mono font-bold text-amber-400">⚙ DEV ORDER SIMULATOR</span>
            <span className="ml-auto text-[10px] text-gray-500 font-mono">Shilp Setu</span>
          </div>

          {/* Status Banner */}
          {status && (
            <div
              className={`text-[11px] font-mono rounded-lg px-3 py-2 leading-tight ${
                status.type === 'success'
                  ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                  : 'bg-red-900/60 text-red-300 border border-red-700'
              }`}
            >
              {status.msg}
            </div>
          )}

          {/* Primary CTA — 300-piece GeM */}
          <button
            type="button"
            onClick={simulateGeMBulk}
            disabled={isLoading}
            className="w-full px-3 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-amber-950 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2 shadow-md"
            title="Inserts a 300-unit GeM bulk order into Supabase → triggers Realtime, voice, toast"
          >
            {isLoading ? (
              <span className="animate-spin text-base">⟳</span>
            ) : (
              <span>🏛️</span>
            )}
            <span>Simulate Incoming GeM Bulk Order</span>
          </button>

          {/* Secondary — Random GeM */}
          <button
            type="button"
            onClick={simulateGeMRandom}
            disabled={isLoading}
            className="w-full px-3 py-2 rounded-xl text-[11px] font-bold bg-amber-900/40 hover:bg-amber-900/60 text-amber-300 border border-amber-700/50 transition-all cursor-pointer disabled:opacity-50 active:scale-95 flex items-center gap-2"
          >
            <span>🎲</span>
            <span>Random GeM Order (varies qty)</span>
          </button>

          {/* ONDC Retail */}
          <button
            type="button"
            onClick={simulateONDC}
            disabled={isLoading}
            className="w-full px-3 py-2 rounded-xl text-[11px] font-bold bg-indigo-900/40 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 transition-all cursor-pointer disabled:opacity-50 active:scale-95 flex items-center gap-2"
          >
            <span>⚡</span>
            <span>Simulate ONDC Retail Order</span>
          </button>

          {/* Info */}
          <p className="text-[10px] text-gray-500 font-mono leading-tight">
            Inserts directly into Supabase. Realtime subscription on Orders page
            will auto-trigger voice announcement + toast + vibration.
          </p>
        </div>
      )}

      {/* Toggle FAB */}
      <button
        type="button"
        onClick={() => {
          setIsOpen((v) => !v);
          setStatus(null);
        }}
        className="w-12 h-12 rounded-full bg-gray-900 hover:bg-gray-800 border border-gray-600 text-white flex items-center justify-center shadow-xl transition-all active:scale-90 cursor-pointer"
        title="Dev Order Simulator"
        aria-label="Toggle Dev Order Simulator"
      >
        <span className="text-lg select-none">{isOpen ? '✕' : '🧪'}</span>
      </button>
    </div>
  );
}
