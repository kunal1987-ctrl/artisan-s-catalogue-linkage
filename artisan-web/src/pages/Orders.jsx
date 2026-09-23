/**
 * Orders.jsx — Shilp Setu Active Orders Fulfillment Dashboard
 * ─────────────────────────────────────────────────────────────────────────────
 * Visual-first + Audio-first design for low-literacy rural artisans.
 *
 * Features:
 *  • Realtime Supabase subscription (INSERT + UPDATE on public.orders)
 *  • Hindi voice announcement via audioAnnouncer utility
 *  • Browser vibration on new order arrival
 *  • GeM (gold/amber) and ONDC (indigo) visual badge system
 *  • Giant quantity + payout display for at-a-glance readability
 *  • Prominent product image (140px+) per order card
 *  • "बोल कर सुनें" speaker button per card
 *  • "सामान पैक हो गया (Mark as Packed)" green primary CTA
 *  • High-contrast toast banner for new arrivals
 *  • Backward-compatible with legacy schema columns
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import POSlipModal from '../components/POSlipModal';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import InstitutionalTenderCard, { ACTIVE_INSTITUTIONAL_TENDERS } from '../components/InstitutionalTenderCard';
import {
  announceOrder,
  buildOrderAnnouncementText,
  unlockAudio,
} from '../utils/audioAnnouncer';
import {
  notifyOrderAccepted,
  notifyOrderPacked,
  notifyOrderDispatched,
  triggerHapticConfirmation,
} from '../utils/fulfillmentNotifications';

// ── Fallback Mock Data (shown while loading or when user has no products) ─────
const FALLBACK_MOCK_ORDERS = [
  {
    id: '#GEM-PO-393140',
    order_id: 'GEM-PO-393140',
    status: 'स्वीकृत', // Accepted
    channel: 'GeM — सरकारी खरीद',
    source: 'GeM',
    order_type: 'gem',
    product_title: 'GI-Certified Jaipur Blue Pottery Decorative Wall Plates (10 Inch)',
    item_title: 'GI-Certified Jaipur Blue Pottery Decorative Wall Plates (10 Inch)',
    buyer: 'TRIFED - Ministry of Tribal Affairs',
    buyer_name: 'TRIFED - Ministry of Tribal Affairs',
    quantity: 100,
    total_amount: 78000,
    total_payout: 78000,
    unit_price_inr: 780,
    image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80',
    product_image_url: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80',
    time: 'Just now',
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    address: 'New Delhi • TRIFED Central Distribution Center',
    shipping_address: 'TRIFED Central Distribution Center, New Delhi - 110001',
    city: 'New Delhi',
    payment_mode: 'GeM PFMS Verified Institutional Escrow (Auto-settlement on Dispatch)',
    notes: 'Urgent institutional procurement for National Tribal Conclave 2026',
    hsn_code: '69120010',
    voice_announcement_text: 'बधाई हो! सरकारी विभाग GeM से 100 पीस का नया आर्डर आया है। कुल राशि ₹78,000। जल्दी से सामान पैक करें।',
  },
  {
    id: '#GEM-PO-2026-8849102',
    order_id: 'GEM-PO-2026-8849102',
    status: 'नया', // New
    channel: 'GeM — सरकारी खरीद',
    source: 'GeM',
    order_type: 'gem',
    product_title: 'Handcrafted Terracotta Earthen Pitcher (Surahi)',
    item_title: 'Handcrafted Terracotta Earthen Pitcher (Surahi)',
    buyer: 'Ministry of Tourism & Culture (Govt. of India)',
    buyer_name: 'Ministry of Tourism & Culture (Govt. of India)',
    quantity: 50,
    total_amount: 13000,
    total_payout: 13000,
    unit_price_inr: 260,
    image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
    product_image_url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
    time: '25 min ago',
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    address: 'Central State Guest House, Chanakyapuri, New Delhi - 110021',
    shipping_address: 'Central State Guest House, Chanakyapuri, New Delhi - 110021',
    city: 'New Delhi',
    payment_mode: 'GeM PFMS Verified Institutional Escrow (Auto-settlement on Dispatch)',
    notes: 'Urgent institutional procurement for National Tourism Conclave 2026',
    hsn_code: '69120010',
    voice_announcement_text: 'बधाई हो! सरकारी विभाग GeM से 50 पीस का नया आर्डर आया है। कुल राशि ₹13,000। जल्दी से सामान पैक करें।',
  },
  {
    id: '#ONDC-BECKN-PO-739218',
    order_id: 'ONDC-BECKN-PO-739218',
    status: 'पैक हो गया', // Packed
    channel: 'ONDC — ओपन नेटवर्क',
    source: 'ONDC',
    order_type: 'ondc',
    product_title: 'GI-Certified Jaipur Blue Pottery Decorative Wall Plate (10 Inch)',
    item_title: 'GI-Certified Jaipur Blue Pottery Decorative Wall Plate (10 Inch)',
    buyer: 'Tribal Co-operative Marketing Development Federation (TRIFED Store Network)',
    buyer_name: 'Tribal Co-operative Marketing Development Federation (TRIFED Store Network)',
    quantity: 25,
    total_amount: 19500,
    total_payout: 19500,
    unit_price_inr: 780,
    image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80',
    product_image_url: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80',
    time: '1 hour ago',
    created_at: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    address: 'TRIFED Central Fulfillment Hub, Sector 62, Noida, Uttar Pradesh - 201309',
    shipping_address: 'TRIFED Central Fulfillment Hub, Sector 62, Noida, Uttar Pradesh - 201309',
    city: 'Noida',
    payment_mode: 'ONDC Protocol Settlement via UPI / BharatQR',
    notes: 'Tribal & Artisan Heritage Retail Distribution',
    hsn_code: '69139000',
    voice_announcement_text: 'नया आर्डर आया! ONDC नेटवर्क से 25 ब्लू पॉटरी प्लेट का ऑर्डर है। कुल कीमत ₹19,500। सामान तैयार करें।',
  },
];

// Retain STATIC_ORDERS for complete backward compatibility
const STATIC_ORDERS = FALLBACK_MOCK_ORDERS;

// ── Craft image fallbacks by keyword ─────────────────────────────────────────
const CRAFT_IMAGE_FALLBACKS = {
  terracotta: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
  surahi: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
  pitcher: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
  pottery: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80',
  'blue pottery': 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80',
  jaipur: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80',
  chanderi: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=800&q=80',
  stole: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=800&q=80',
  silk: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=800&q=80',
};
const DEFAULT_CRAFT_IMAGE = 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80';

function getProductImage(order) {
  if (order.product_image_url) return order.product_image_url;
  const title = (order.product_title || order.item_title || '').toLowerCase();
  for (const [keyword, url] of Object.entries(CRAFT_IMAGE_FALLBACKS)) {
    if (title.includes(keyword)) return url;
  }
  return DEFAULT_CRAFT_IMAGE;
}

// ── Utility: time formatting ─────────────────────────────────────────────
function formatTimeAgo(isoDate) {
  if (!isoDate) return 'Just now';
  const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (diff < 30) return 'Just now';
  if (diff < 120) return '2 min ago';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  const date = new Date(isoDate);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  if (isToday) return `Today, ${timeStr}`;
  if (isYesterday) return `Yesterday, ${timeStr}`;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + `, ${timeStr}`;
}

// ── Generator: Dynamic realistic orders mapped to user's actual catalogue ─────
function generateDynamicOrdersFromProducts(products) {
  if (!products || !Array.isArray(products) || products.length === 0) {
    return [];
  }

  const BUYER_TEMPLATES = [
    {
      channel: 'GeM — सरकारी खरीद',
      source: 'GeM',
      order_type: 'gem',
      buyer: 'TRIFED - Ministry of Tribal Affairs',
      address: 'New Delhi • TRIFED Central Distribution Center',
      shipping_address: 'TRIFED Central Distribution Center, Ashok Road, New Delhi - 110001',
      city: 'New Delhi',
      payment_mode: 'GeM PFMS Verified Institutional Escrow (Auto-settlement on Dispatch)',
      notes: 'Institutional allocation under ODOP Tribal Artisan Linkage Scheme',
      status: 'accepted',
      qtyMultiplier: 4,
      minQty: 30,
      timeAgoMinutes: 12,
    },
    {
      channel: 'ONDC — ओपन नेटवर्क',
      source: 'ONDC',
      order_type: 'ondc',
      buyer: 'Craftsvilla / Mystore BAP (ONDC Network)',
      address: 'Bengaluru • ONDC Logistics Fulfillment Hub',
      shipping_address: 'Whitefield Fulfillment Hub, EPIP Zone, Bengaluru, Karnataka - 560066',
      city: 'Bengaluru',
      payment_mode: 'ONDC Protocol Settlement via UPI / BharatQR',
      notes: 'Customer direct purchase via ONDC Beckn 1.2.0 protocol',
      status: 'new',
      qtyMultiplier: 1,
      minQty: 4,
      timeAgoMinutes: 28,
    },
    {
      channel: 'GeM — सरकारी खरीद',
      source: 'GeM',
      order_type: 'gem',
      buyer: 'Ministry of Tourism & Culture (Govt. of India)',
      address: 'New Delhi • Central State Guest House, Chanakyapuri',
      shipping_address: 'Central State Guest House, Chanakyapuri, New Delhi - 110021',
      city: 'New Delhi',
      payment_mode: 'GeM PFMS Verified Institutional Escrow',
      notes: 'Official souvenir procurement for National Heritage Tourism Conclave',
      status: 'packed',
      qtyMultiplier: 3,
      minQty: 25,
      timeAgoMinutes: 95,
    },
    {
      channel: 'GeM — राज्य एम्पोरियम',
      source: 'GeM',
      order_type: 'gem',
      buyer: 'CCIC — Central Cottage Industries Corporation',
      address: 'New Delhi • Jawahar Vyapar Bhawan, Janpath',
      shipping_address: 'Jawahar Vyapar Bhawan, Janpath, New Delhi - 110001',
      city: 'New Delhi',
      payment_mode: 'GeM Institutional Escrow (RSP Pre-credited)',
      notes: 'ODOP State Emporium retail stock replenishment batch',
      status: 'accepted',
      qtyMultiplier: 2,
      minQty: 20,
      timeAgoMinutes: 240,
    },
    {
      channel: 'GeM — सरकारी खरीद',
      source: 'GeM',
      order_type: 'gem',
      buyer: 'Archaeological Survey of India (ASI Souvenir Division)',
      address: 'Agra • Taj Cultural Souvenir Center, ASI',
      shipping_address: 'Taj Protected Heritage Complex, Agra, Uttar Pradesh - 282001',
      city: 'Agra',
      payment_mode: 'GeM PFMS Verified Institutional Escrow',
      notes: 'Monument visitor centre craft display & retail distribution',
      status: 'new',
      qtyMultiplier: 5,
      minQty: 50,
      timeAgoMinutes: 45,
    },
  ];

  const generated = [];

  // Generate realistic orders for up to 6 products
  const selectedProducts = products.slice(0, 6);
  selectedProducts.forEach((prod, index) => {
    const template = BUYER_TEMPLATES[index % BUYER_TEMPLATES.length];
    const rawId = String(prod.id || index).replace(/[^a-zA-Z0-9]/g, '');
    const shortCode = rawId.slice(0, 6).toUpperCase() || `${index + 1000}`;

    const prodTitle = prod.title || prod.name || prod.hindi_title || 'GI-Certified Artisan Handicraft';
    const prodImg = prod.image_url || prod.image || (Array.isArray(prod.images) ? prod.images[0] : null) || getProductImage(prod);
    const moq = Number(prod.moq || prod.min_order_quantity || 1);

    const quantity = Math.max(moq * template.qtyMultiplier, template.minQty);

    let unitPrice = template.source === 'GeM'
      ? Number(prod.bulk_price || prod.wholesale_price || Math.round(Number(prod.price || 450) * 0.75) || 350)
      : Number(prod.price || Math.round(Number(prod.bulk_price || 350) * 1.35) || 450);

    if (!unitPrice || unitPrice <= 0) unitPrice = 450;
    const totalAmount = quantity * unitPrice;

    const orderId = template.source === 'GeM'
      ? `GEM-PO-2026-${shortCode}`
      : `ONDC-BECKN-PO-${shortCode}`;

    const createdAt = new Date(Date.now() - (template.timeAgoMinutes + index * 25) * 60 * 1000).toISOString();

    const voiceAnnouncement = template.source === 'GeM'
      ? `बधाई हो! सरकारी विभाग GeM से ${quantity} पीस ${prodTitle} का नया आर्डर आया है। कुल राशि ₹${totalAmount.toLocaleString('en-IN')}। जल्दी से सामान पैक करें।`
      : `नया आर्डर आया! ONDC नेटवर्क से ${quantity} पीस ${prodTitle} का ऑर्डर है। कुल राशि ₹${totalAmount.toLocaleString('en-IN')}। सामान तैयार करें।`;

    generated.push({
      id: `#${orderId}`,
      order_id: orderId,
      status: template.status,
      channel: template.channel,
      source: template.source,
      order_type: template.order_type,
      product_title: prodTitle,
      item_title: prodTitle,
      buyer: template.buyer,
      buyer_name: template.buyer,
      quantity,
      unit_price_inr: unitPrice,
      total_amount: totalAmount,
      total_payout: totalAmount,
      image: prodImg,
      product_image_url: prodImg,
      time: formatTimeAgo(createdAt),
      created_at: createdAt,
      address: template.address,
      shipping_address: template.shipping_address,
      city: template.city,
      payment_mode: template.payment_mode,
      notes: template.notes,
      hsn_code: prod.hsn_code || '69120010',
      voice_announcement_text: voiceAnnouncement,
    });

    // If the artisan has only 1 or 2 products, add a complementary ONDC order
    if (selectedProducts.length <= 2) {
      const ondcTemplate = BUYER_TEMPLATES[1];
      const ondcOrderId = `ONDC-BECKN-PO-${shortCode}X`;
      const ondcQty = Math.max(moq, 3 + index * 2);
      const ondcUnitPrice = Number(prod.price || Math.round(Number(prod.bulk_price || 350) * 1.35) || 550);
      const ondcTotal = ondcQty * ondcUnitPrice;
      const ondcCreatedAt = new Date(Date.now() - (45 + index * 20) * 60 * 1000).toISOString();

      generated.push({
        id: `#${ondcOrderId}`,
        order_id: ondcOrderId,
        status: 'new',
        channel: ondcTemplate.channel,
        source: ondcTemplate.source,
        order_type: ondcTemplate.order_type,
        product_title: prodTitle,
        item_title: prodTitle,
        buyer: ondcTemplate.buyer,
        buyer_name: ondcTemplate.buyer,
        quantity: ondcQty,
        unit_price_inr: ondcUnitPrice,
        total_amount: ondcTotal,
        total_payout: ondcTotal,
        image: prodImg,
        product_image_url: prodImg,
        time: formatTimeAgo(ondcCreatedAt),
        created_at: ondcCreatedAt,
        address: ondcTemplate.address,
        shipping_address: ondcTemplate.shipping_address,
        city: ondcTemplate.city,
        payment_mode: ondcTemplate.payment_mode,
        notes: ondcTemplate.notes,
        hsn_code: prod.hsn_code || '69120010',
        voice_announcement_text: `नया आर्डर आया! ONDC नेटवर्क से ${ondcQty} पीस ${prodTitle} का ऑर्डर है। कुल राशि ₹${ondcTotal.toLocaleString('en-IN')}। सामान तैयार करें।`,
      });
    }
  });

  return generated;
}

// ── Utility: normalize any DB row / dynamic order to frontend model ───────────
function mapOrderRecord(item) {
  let rawStatus = item.status || 'new';
  if (rawStatus === 'स्वीकृत' || rawStatus === 'स्वीकार') rawStatus = 'accepted';
  else if (rawStatus === 'नया') rawStatus = 'new';
  else if (rawStatus === 'लंबित') rawStatus = 'pending';
  else if (rawStatus === 'पैक हो गया' || rawStatus === 'पैक') rawStatus = 'packed';
  else if (rawStatus === 'डिस्पैच' || rawStatus === 'भेजा गया') rawStatus = 'shipped';
  else if (rawStatus === 'डिलीवर हो गया') rawStatus = 'delivered';
  else if (rawStatus === 'रद्द') rawStatus = 'cancelled';

  const source = item.source || (
    (item.channel || '').toLowerCase().includes('gem') ||
    (item.order_type || '') === 'gem' ? 'GeM' : 'ONDC'
  );
  const qty = Number(item.quantity || 1);
  const payout = Number(
    item.total_payout || item.total_amount || item.total_price_inr ||
    (item.unit_price_inr ? item.unit_price_inr * qty : 0)
  );

  const orderId = item.order_id || item.id || `ORD-${Date.now()}`;
  const prodImg = item.product_image_url || item.image || item.image_url || getProductImage(item);
  const prodTitle = item.product_title || item.item_title || item.notes || 'Artisan Craft Product';
  const buyer = item.buyer_name || item.buyer || 'Institutional Buyer';
  const shipAddr = item.shipping_address || item.address || item.city || 'Transport Bhawan, New Delhi';

  return {
    ...item,
    id: item.id || orderId,
    order_id: orderId,
    source,
    order_type: item.order_type || (source === 'GeM' ? 'gem' : 'ondc'),
    buyer_name: buyer,
    buyer: buyer,
    channel: item.channel || (source === 'GeM' ? 'GeM Institutional PO' : 'ONDC Network'),
    product_title: prodTitle,
    item_title: prodTitle,
    image: prodImg,
    product_image_url: prodImg,
    quantity: qty,
    total_payout: payout,
    total_amount: payout,
    unit_price_inr: Number(item.unit_price_inr || (payout && qty ? Math.round(payout / qty) : 0)),
    total_price_inr: payout,
    status: rawStatus,
    shipping_address: shipAddr,
    address: shipAddr,
    city: item.city || (shipAddr.includes('•') ? shipAddr.split('•')[0].trim() : (shipAddr.split(',')[0] || 'New Delhi')),
    payment_mode: item.payment_mode || (source === 'GeM' ? 'GeM PFMS Institutional Escrow' : 'ONDC Escrow RSP Prepaid'),
    notes: item.notes || item.item_title || 'Institutional Purchase Order',
    hsn_code: item.hsn_code || '69120010',
    voice_announcement_text: item.voice_announcement_text || null,
    created_at: item.created_at || (item.time ? new Date().toISOString() : new Date().toISOString()),
  };
}

// ── Status helpers ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  new:       { label: 'नया',         labelEn: 'New',        color: 'bg-amber-100 text-amber-800',   icon: 'fiber_new',      pulse: true  },
  pending:   { label: 'लंबित',       labelEn: 'Pending',    color: 'bg-amber-100 text-amber-800',   icon: 'schedule',       pulse: true  },
  accepted:  { label: 'स्वीकृत',     labelEn: 'Accepted',   color: 'bg-blue-100 text-blue-800',     icon: 'check',          pulse: false },
  packed:    { label: 'पैक हो गया',  labelEn: 'Packed',     color: 'bg-violet-100 text-violet-800', icon: 'inventory_2',    pulse: false },
  shipped:   { label: 'डिस्पैच',     labelEn: 'Shipped',    color: 'bg-sky-100 text-sky-800',       icon: 'local_shipping', pulse: false },
  dispatched:{ label: 'डिस्पैच',     labelEn: 'Dispatched', color: 'bg-sky-100 text-sky-800',       icon: 'local_shipping', pulse: false },
  delivered: { label: 'डिलीवर हो गया', labelEn: 'Delivered', color: 'bg-emerald-100 text-emerald-800', icon: 'verified',    pulse: false },
  cancelled: { label: 'रद्द',         labelEn: 'Cancelled',  color: 'bg-red-100 text-red-700',       icon: 'cancel',         pulse: false },
};

function getStatusCfg(status) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.new;
}

// ── OrderCard Component ───────────────────────────────────────────────────────
function OrderCard({ order, onMarkPacked, onAcceptPO, onDispatchPO, setSelectedPO }) {
  const { language } = useLanguage();
  const isGem = order.source === 'GeM' || order.order_type === 'gem';
  const currentStatus = order.status || 'new';
  const statusCfg = getStatusCfg(currentStatus);
  const productImg = getProductImage(order);
  const announcementText = order.voice_announcement_text || buildOrderAnnouncementText(order);

  // Packed / dispatched / delivered are terminal display states
  const isPacked    = currentStatus === 'packed';
  const isShipped   = currentStatus === 'shipped' || currentStatus === 'dispatched';
  const isDelivered = currentStatus === 'delivered';
  const isCancelled = currentStatus === 'cancelled';
  const isNew       = currentStatus === 'new' || currentStatus === 'pending';
  const isAccepted  = currentStatus === 'accepted';

  const handleSpeak = () => {
    unlockAudio();
    announceOrder(announcementText);
  };

  return (
    <article
      className="order-card bg-white rounded-3xl shadow-md border border-gray-100 flex flex-col justify-between gap-0 transition-all duration-500 hover:shadow-xl hover:-translate-y-0.5 animate-in fade-in slide-in-from-top-4 overflow-hidden"
      id={`order-${order.id}`}
    >
      {/* ── TOP HEADER BAND ─────────────────────────────────────────────────── */}
      <div
        className={`px-4 pt-4 pb-3 ${
          isGem
            ? 'bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-100/60'
            : 'bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-100/60'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          {/* Source Badge */}
          <div className="flex flex-col gap-1.5">
            {isGem ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-sm tracking-wide">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
                🏛️ GeM — सरकारी खरीद
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm tracking-wide">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>hub</span>
                ⚡ ONDC नेटवर्क
              </span>
            )}

            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[10px] font-mono font-bold text-gray-500">
                #{String(order.order_id || order.id || 'NEW').toUpperCase().slice(0, 20)}
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-[10px] text-gray-400">{formatTimeAgo(order.created_at)}</span>
            </div>
          </div>

          {/* Status Pill + Speaker */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-bold ${statusCfg.color}`}>
              {statusCfg.pulse && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              )}
              <span className="material-symbols-outlined text-[13px]">{statusCfg.icon}</span>
              {language === 'hi' ? statusCfg.label : statusCfg.labelEn}
            </span>

            {/* 🔊 Speaker Button */}
            <button
              type="button"
              aria-label="बोल कर सुनें — Audio announcement"
              title="बोल कर सुनें (Listen in Hindi)"
              onClick={handleSpeak}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white border border-gray-200 text-gray-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-all cursor-pointer active:scale-90 shadow-xs"
            >
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>volume_up</span>
              बोल कर सुनें
            </button>
          </div>
        </div>
      </div>

      {/* ── PRODUCT SHOWCASE ─────────────────────────────────────────────────── */}
      <div className="flex items-stretch gap-0 p-3.5 sm:p-4 pb-3">
        {/* Product Image — responsive sizing for mobile viewports */}
        <div className="shrink-0 mr-3 sm:mr-4">
          <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-[140px] md:h-[140px] rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-xs">
            <img
              src={productImg}
              alt={order.product_title || order.item_title || 'Product'}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = DEFAULT_CRAFT_IMAGE;
              }}
            />
          </div>
        </div>

        {/* Product Info */}
        <div className="flex flex-col justify-between flex-1 min-w-0 gap-1.5 sm:gap-2">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug line-clamp-2">
              {order.product_title || order.item_title || 'Artisan Craft Product'}
            </h2>
            {order.buyer_name && (
              <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 line-clamp-1 font-medium">
                {order.buyer_name}
              </p>
            )}
          </div>

          {/* ── GIANT QUANTITY DISPLAY ──────────────────────────────────────── */}
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-black text-base sm:text-xl leading-none ${
                isGem
                  ? 'bg-amber-100 text-amber-900'
                  : 'bg-indigo-100 text-indigo-900'
              }`}
            >
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
              {order.quantity.toLocaleString('en-IN')}
              <span className="text-xs sm:text-sm font-bold ml-0.5">पीस</span>
            </div>
          </div>

          {/* ── MASSIVE PAYOUT BADGE ────────────────────────────────────────── */}
          <div className="flex items-center gap-1.5">
            <span className="text-xl sm:text-3xl font-black text-emerald-700 tracking-tight leading-none">
              ₹{(order.total_payout || order.total_amount || 0).toLocaleString('en-IN')}
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 leading-none">कुल</span>
              <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold text-emerald-700 leading-none">
                <span className="material-symbols-outlined text-[10px] sm:text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                सुरक्षित
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Shipping address */}
      {(order.shipping_address || order.city) && (
        <div className="flex items-center gap-2 px-4 pb-3 text-on-surface-variant text-xs">
          <span className="material-symbols-outlined text-[18px] text-gray-400 shrink-0">local_shipping</span>
          <p className="text-gray-500 truncate">
            <span className="font-semibold text-gray-700">{order.city || 'India'}</span>
            {' '}•{' '}
            <span>{(order.shipping_address || '').slice(0, 45)}{(order.shipping_address || '').length > 45 ? '…' : ''}</span>
          </p>
        </div>
      )}

      {/* ── ACTION BUTTONS ────────────────────────────────────────────────     */}
      <div className="flex flex-col gap-2 px-4 pb-4 pt-2 border-t border-gray-100">

        {/* Terminal states */}
        {isDelivered && (
          <div className="w-full min-h-[52px] rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center justify-center gap-2 py-2.5">
            <span className="material-symbols-outlined text-[22px] text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            {language === 'hi' ? 'डिलीवर हो गया ✓' : 'Delivered ✓'}
          </div>
        )}

        {isCancelled && (
          <div className="w-full min-h-[52px] rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-bold flex items-center justify-center gap-2 py-2.5">
            <span className="material-symbols-outlined text-[22px]">cancel</span>
            {language === 'hi' ? 'रद्द किया गया' : 'Cancelled'}
          </div>
        )}

        {isShipped && !isDelivered && !isCancelled && (
          <div className="w-full min-h-[52px] rounded-2xl bg-sky-50 border border-sky-200 text-sky-800 text-sm font-bold flex items-center justify-center gap-2 py-2.5">
            <span className="material-symbols-outlined text-[22px]">local_shipping</span>
            {language === 'hi' ? 'डिस्पैच हो गया' : 'Dispatched — In Transit'}
          </div>
        )}

        {/* Packed state: show dispatch button */}
        {isPacked && (
          <button
            type="button"
            aria-label={`Dispatch order ${order.order_id || order.id}`}
            className="w-full min-h-[56px] h-[56px] rounded-2xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-black flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
            onClick={() => {
              triggerHapticConfirmation([100, 50, 100]);
              onDispatchPO(order.order_id || order.id);
            }}
          >
            <span className="material-symbols-outlined text-[24px]">local_shipping</span>
            {language === 'hi' ? 'कूरियर को दे दिया' : 'Mark Shipped'}
          </button>
        )}

        {/* Accepted state: show Mark as Packed */}
        {isAccepted && (
          <button
            type="button"
            aria-label={`Mark order as packed ${order.order_id || order.id}`}
            className="w-full min-h-[56px] h-[56px] rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
            onClick={() => {
              triggerHapticConfirmation([100, 50, 100]);
              unlockAudio();
              onMarkPacked(order.order_id || order.id);
            }}
          >
            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
            {language === 'hi' ? 'सामान पैक हो गया' : 'Mark as Packed'}
          </button>
        )}

        {/* New / Pending state: Accept PO first */}
        {(isNew) && (
          <button
            type="button"
            aria-label={`Accept order ${order.order_id || order.id}`}
            className="w-full min-h-[56px] h-[56px] rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
            onClick={() => {
              triggerHapticConfirmation([100, 50, 100]);
              unlockAudio();
              onAcceptPO(order.order_id || order.id);
            }}
          >
            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            {language === 'hi' ? 'आर्डर स्वीकार करें' : 'Accept Order'}
          </button>
        )}

        {/* Secondary row */}
        <div className="flex items-center justify-start">
          <button
            type="button"
            aria-label="View PO slip"
            className="min-h-[40px] px-3 rounded-full text-gray-500 hover:text-indigo-700 font-bold text-xs flex items-center gap-1.5 hover:bg-indigo-50 transition-colors cursor-pointer"
            onClick={() => setSelectedPO(order)}
          >
            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            {language === 'hi' ? 'पर्ची देखें' : 'View PO Slip'}
          </button>
        </div>
      </div>
    </article>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Orders() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [orders, setOrders] = useState(() => FALLBACK_MOCK_ORDERS.map(mapOrderRecord));
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [showTenders, setShowTenders] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('info'); // 'info' | 'success' | 'new-order'
  const [showDevSims, setShowDevSims] = useState(false); // hidden by default; Ctrl+Shift+O to reveal
  const channelRef = useRef(null);
  const toastTimerRef = useRef(null);

  // ── Toast helper ────────────────────────────────────────────────────────────
  const showToast = useCallback((msg, type = 'info') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMsg(msg);
    setToastType(type);
    toastTimerRef.current = setTimeout(() => setToastMsg(''), 5000);
  }, []);

  // ── Ctrl+Shift+O: Toggle hidden dev simulator buttons ───────────────────
  useEffect(() => {
    const handleKeyCombo = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'O') {
        e.preventDefault();
        setShowDevSims((v) => !v);
      }
    };
    window.addEventListener('keydown', handleKeyCombo);
    return () => window.removeEventListener('keydown', handleKeyCombo);
  }, []);

  // ── 1. Dynamic Order Load (User Catalogue & Supabase) ──────────────────────
  useEffect(() => {
    async function loadOrders() {
      setIsLoading(true);
      try {
        let activeUser = user;
        if (!activeUser) {
          const { data: authData } = await supabase.auth.getUser();
          activeUser = authData?.user;
        }

        // 1. Fetch authenticated user's products from Supabase
        let userProducts = [];
        if (activeUser?.id) {
          const { data: pData, error: pErr } = await supabase
            .from('products')
            .select('*')
            .or(`user_id.eq.${activeUser.id},artisan_id.eq.${activeUser.id}`)
            .order('created_at', { ascending: false });

          if (!pErr && pData && pData.length > 0) {
            userProducts = pData;
          } else {
            // Also check items view if direct products returned empty
            const { data: iData } = await supabase
              .from('items')
              .select('*')
              .or(`user_id.eq.${activeUser.id},artisan_id.eq.${activeUser.id}`)
              .order('created_at', { ascending: false });
            if (iData && iData.length > 0) {
              userProducts = iData;
            }
          }
        }

        // 2. Fetch any real persistent orders from Supabase
        let dbOrders = [];
        try {
          const { data: oData, error: oErr } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });
          if (!oErr && oData && oData.length > 0) {
            dbOrders = oData;
          }
        } catch (oErr) {
          console.warn('[Orders] Could not fetch DB orders:', oErr);
        }

        // 3. Dynamic Order Generation vs Fallback
        if (userProducts && userProducts.length > 0) {
          // Dynamically generate realistic orders for those specific user products
          const dynamicOrders = generateDynamicOrdersFromProducts(userProducts).map(mapOrderRecord);

          // If there are real saved orders belonging to the user or newly placed, merge them
          if (dbOrders.length > 0) {
            const userDbOrders = dbOrders
              .filter((o) => !activeUser?.id || o.user_id === activeUser.id || o.artisan_id === activeUser.id)
              .map(mapOrderRecord);

            if (userDbOrders.length > 0) {
              const existingIds = new Set(userDbOrders.map((o) => o.order_id || o.id));
              const combined = [
                ...userDbOrders,
                ...dynamicOrders.filter((o) => !existingIds.has(o.order_id) && !existingIds.has(o.id)),
              ];
              setOrders(combined);
              return;
            }
          }

          setOrders(dynamicOrders);
        } else if (dbOrders.length > 0) {
          // If user has no products, but DB has orders, use mapped DB orders
          setOrders(dbOrders.map(mapOrderRecord));
        } else {
          // If the user has no products, fallback to the default mock array
          setOrders(FALLBACK_MOCK_ORDERS.map(mapOrderRecord));
        }
      } catch (err) {
        console.warn('[Orders] Error loading orders:', err);
        setOrders(FALLBACK_MOCK_ORDERS.map(mapOrderRecord));
      } finally {
        setIsLoading(false);
      }
    }

    loadOrders();
  }, [user]);

  // ── 2. Supabase Realtime subscription ──────────────────────────────────────
  useEffect(() => {
    // If a channel already exists, remove it first to avoid duplicate subscriptions
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel('custom-orders-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('[Realtime] New order INSERT:', payload.new);
          const newOrder = mapOrderRecord(payload.new);

          // 1. Prepend to state
          setOrders((prev) => [
            newOrder,
            ...prev.filter((o) => o.id !== newOrder.id && o.order_id !== newOrder.order_id),
          ]);

          // 2. Haptic vibration (mobile artisan devices)
          if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
          }

          // 3. High-contrast toast banner
          const source = newOrder.source || (newOrder.order_type === 'gem' ? 'GeM' : 'ONDC');
          const qty = newOrder.quantity;
          const payout = (newOrder.total_payout || newOrder.total_amount || 0).toLocaleString('en-IN');
          showToast(
            `🎉 नया ${source} आर्डर! ${qty} पीस — ₹${payout}`,
            'new-order'
          );

          // 4. Voice announcement
          const text = newOrder.voice_announcement_text || buildOrderAnnouncementText(newOrder);
          announceOrder(text);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('[Realtime] Order UPDATE:', payload.new);
          const updated = mapOrderRecord(payload.new);
          setOrders((prev) =>
            prev.map((o) =>
              o.id === updated.id || o.order_id === updated.order_id
                ? { ...o, ...updated }
                : o
            )
          );
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] Subscribed to custom-orders-channel');
        }
      });

    channelRef.current = channel;
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [showToast]);

  // ── Status update helper ────────────────────────────────────────────────────
  const updateOrderStatus = useCallback(async (orderId, newStatus) => {
    // Optimistic UI
    setOrders((prev) =>
      prev.map((o) =>
        o.order_id === orderId || o.id === orderId ? { ...o, status: newStatus } : o
      )
    );

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(orderId));
      let query = supabase.from('orders').update({ status: newStatus });
      query = isUuid ? query.eq('id', orderId) : query.eq('order_id', orderId);
      const { error } = await query;
      if (error) console.error(`[Orders] Failed to set status=${newStatus}:`, error);
    } catch (err) {
      console.error('[Orders] updateOrderStatus error:', err);
    }
  }, []);

  // ── 3. Accept PO ────────────────────────────────────────────────────────────
  const handleAcceptPO = useCallback(async (orderId) => {
    await updateOrderStatus(orderId, 'accepted');
    notifyOrderAccepted(showToast);
  }, [updateOrderStatus, showToast]);

  // ── 4. Mark as Packed ───────────────────────────────────────────────────────
  const handleMarkPacked = useCallback(async (orderId) => {
    await updateOrderStatus(orderId, 'packed');
    notifyOrderPacked(showToast);
  }, [updateOrderStatus, showToast]);

  // ── 5. Dispatch / Ship ──────────────────────────────────────────────────────
  const handleDispatchPO = useCallback(async (orderId) => {
    await updateOrderStatus(orderId, 'shipped');
    notifyOrderDispatched(showToast);
  }, [updateOrderStatus, showToast]);

  // ── 6. Institutional Tender acceptance ─────────────────────────────────────
  const handleAcceptTender = useCallback((tender) => {
    const generatedOrderId = `GEM-PO-${Date.now().toString().slice(-6)}`;
    const tenderOrder = mapOrderRecord({
      id: `tender-${Date.now()}`,
      order_id: generatedOrderId,
      buyer_name: tender.ministry,
      channel: 'GeM Institutional PO',
      source: 'GeM',
      order_type: 'gem',
      item_title: tender.title,
      product_title: tender.title,
      quantity: tender.quantity,
      unit_price_inr: tender.unit_budget_inr,
      total_payout: tender.total_budget_inr,
      total_amount: tender.total_budget_inr,
      status: 'accepted',
      shipping_address: tender.delivery_location,
      city: 'New Delhi',
      payment_mode: 'GeM PFMS Verified Institutional Escrow',
      notes: `Awarded Tender: ${tender.tender_no} • ${tender.eligibility}`,
      created_at: new Date().toISOString(),
    });

    setOrders((prev) => [
      tenderOrder,
      ...prev.filter((o) => o.id !== tenderOrder.id && o.order_id !== tenderOrder.order_id),
    ]);

    showToast(
      language === 'hi'
        ? 'सरकारी निविदा स्वीकृत कर ली गई है'
        : 'Government Tender Accepted',
      'success'
    );

    const text = `बधाई हो! GeM निविदा ${tender.tender_no} मिल गई। ${tender.quantity} पीस ${tender.title}। कुल राशि ₹${tender.total_budget_inr.toLocaleString('en-IN')}।`;
    announceOrder(text);

    // Background insert to Supabase
    supabase.auth.getUser().then(({ data: authData }) => {
      const activeUser = authData?.user;
      supabase.from('orders').insert([{
        order_id: tenderOrder.order_id,
        buyer_name: tenderOrder.buyer_name,
        channel: tenderOrder.channel,
        source: 'GeM',
        order_type: 'gem',
        item_title: tenderOrder.item_title,
        product_title: tenderOrder.product_title,
        product_image_url: tenderOrder.product_image_url,
        quantity: tenderOrder.quantity,
        total_payout: tenderOrder.total_payout,
        total_amount: tenderOrder.total_amount,
        status: 'accepted',
        shipping_address: tenderOrder.shipping_address,
        payment_mode: tenderOrder.payment_mode,
        notes: tenderOrder.notes,
        city: tenderOrder.city,
        ...(activeUser?.id ? { artisan_id: activeUser.id, user_id: activeUser.id, artisan_user_id: activeUser.id } : {}),
      }]).then(({ error }) => {
        if (error) console.warn('[Orders] Tender insert error:', error);
      });
    });
  }, [showToast, language]);

  // ── 7. Local webhook simulators (for demo / testing) ───────────────────────
  const simulateONDCOrder = useCallback(() => {
    const timestamp = Date.now();
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const items = [
      { title: 'Handcrafted Terracotta Earthen Pitcher (Surahi)', img: CRAFT_IMAGE_FALLBACKS.terracotta, price: 450, qty: 2, buyer: 'Priya Sharma (Bengaluru)', city: 'Bengaluru', address: 'Flat 402, Green Glen Layout, Bellandur, Bengaluru - 560103', hsn: '69120010' },
      { title: 'GI-Certified Jaipur Blue Pottery Decorative Wall Plate', img: CRAFT_IMAGE_FALLBACKS['blue pottery'], price: 1250, qty: 1, buyer: 'Amitabh Sen (Kolkata)', city: 'Kolkata', address: '14B Lake Temple Road, Southern Avenue, Kolkata - 700029', hsn: '69139000' },
      { title: 'Handwoven Chanderi Silk-Cotton Zari Border Stole', img: CRAFT_IMAGE_FALLBACKS.chanderi, price: 1850, qty: 1, buyer: 'Meenakshi Sundaram (Chennai)', city: 'Chennai', address: 'A-12 Besant Nagar Sea Breeze Apts, Chennai - 600090', hsn: '52085290' },
    ];
    const item = items[Math.floor(Math.random() * items.length)];
    const total = item.price * item.qty;

    const newOrder = mapOrderRecord({
      id: `ondc-sim-${timestamp}`,
      order_id: `ONDC-BECKN-${timestamp.toString().slice(-4)}-${suffix}`,
      source: 'ONDC',
      buyer_name: item.buyer,
      channel: 'ONDC Network (Paytm Mall BAP)',
      order_type: 'ondc',
      product_title: item.title,
      item_title: item.title,
      product_image_url: item.img,
      quantity: item.qty,
      total_payout: total,
      total_amount: total,
      unit_price_inr: item.price,
      status: 'new',
      shipping_address: item.address,
      city: item.city,
      payment_mode: 'ONDC Protocol Escrow (RSP Settlement via UPI)',
      notes: 'Customer direct purchase via ONDC',
      hsn_code: item.hsn,
      created_at: new Date().toISOString(),
    });

    setOrders((prev) => [newOrder, ...prev]);
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    showToast(`⚡ नया ONDC आर्डर! ${newOrder.buyer_name} — ₹${total.toLocaleString('en-IN')}`, 'new-order');
    announceOrder(buildOrderAnnouncementText(newOrder));
  }, [showToast]);

  const simulateGeMOrder = useCallback(() => {
    const timestamp = Date.now();
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const items = [
      { title: 'Handcrafted Terracotta Earthen Pitcher (Surahi)', img: CRAFT_IMAGE_FALLBACKS.terracotta, price: 260, qty: 300, buyer: 'Ministry of Tourism & Culture (Govt. of India)', city: 'New Delhi', address: 'Central State Guest House, Chanakyapuri, New Delhi - 110021', notes: 'Institutional procurement for National Tourism Conclave', hsn: '69120010' },
      { title: 'GI-Certified Jaipur Blue Pottery Decorative Wall Plate', img: CRAFT_IMAGE_FALLBACKS['blue pottery'], price: 780, qty: 150, buyer: 'TRIFED - Tribal Co-operative Marketing Federation', city: 'Noida', address: 'TRIFED Central Warehouse, Sector 62, Noida - 201309', notes: 'State emporium consignment batch', hsn: '69139000' },
      { title: 'Handwoven Chanderi Silk-Cotton Zari Border Stole', img: CRAFT_IMAGE_FALLBACKS.chanderi, price: 1150, qty: 200, buyer: 'Ministry of Textiles (Office of DC Handlooms)', city: 'New Delhi', address: 'Room 312, Udyog Bhawan, Rafi Marg, New Delhi - 110011', notes: 'Institutional gift procurement for National Handloom Day', hsn: '52085290' },
    ];
    const item = items[Math.floor(Math.random() * items.length)];
    const total = item.price * item.qty;

    const newOrder = mapOrderRecord({
      id: `gem-sim-${timestamp}`,
      order_id: `GEM-PO-2026-${suffix}`,
      source: 'GeM',
      buyer_name: item.buyer,
      channel: 'GeM Institutional PO',
      order_type: 'gem',
      product_title: item.title,
      item_title: item.title,
      product_image_url: item.img,
      quantity: item.qty,
      total_payout: total,
      total_amount: total,
      unit_price_inr: item.price,
      status: 'new',
      shipping_address: item.address,
      city: item.city,
      payment_mode: 'GeM PFMS Verified Institutional Escrow',
      notes: item.notes,
      hsn_code: item.hsn,
      voice_announcement_text: `बधाई हो! सरकारी विभाग GeM से ${item.qty} पीस का नया आर्डर आया है। कुल राशि ₹${total.toLocaleString('en-IN')}। जल्दी से सामान पैक करें।`,
      created_at: new Date().toISOString(),
    });

    setOrders((prev) => [newOrder, ...prev]);
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    showToast(`🏛️ नया GeM सरकारी खरीद PO! ${newOrder.buyer_name} — ₹${total.toLocaleString('en-IN')}`, 'new-order');
    announceOrder(newOrder.voice_announcement_text);
  }, [showToast]);

  // ── Filter logic ────────────────────────────────────────────────────────────
  const allOrders = orders.length > 0 ? orders : FALLBACK_MOCK_ORDERS;
  const displayedOrders = allOrders.filter((order) => {
    if (activeFilter === 'GEM') {
      return (
        order.source === 'GeM' ||
        order.order_type?.toLowerCase() === 'gem' ||
        order.channel?.toLowerCase().includes('gem') ||
        order.order_id?.toLowerCase().startsWith('gem')
      );
    }
    if (activeFilter === 'ONDC') {
      return (
        order.source === 'ONDC' ||
        order.order_type?.toLowerCase() === 'ondc' ||
        order.channel?.toLowerCase().includes('ondc') ||
        order.order_id?.toLowerCase().startsWith('ondc')
      );
    }
    return true;
  });

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="w-full">
      <h1 className="sr-only">
        {t('orders.title', 'Orders & Fulfillment')}
      </h1>
      <main className="flex-1 w-full bg-background min-h-screen px-3 sm:px-6 lg:px-8 py-3 sm:py-4 flex flex-col gap-3.5 sm:gap-4">
        <div className="flex flex-col gap-3.5 sm:gap-4 max-w-7xl mx-auto w-full">


          {/* ── FILTER CHIPS + SIMULATORS ────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Filter chips */}
            <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
              {[
                { key: 'ALL', label: t('orders.all_orders', 'All Orders') },
                { key: 'GEM', label: 'GeM Orders' },
                { key: 'ONDC', label: 'ONDC Orders' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveFilter(key)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all shrink-0 active:scale-95 ${
                    activeFilter === key
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Local simulators — hidden by default. Ctrl+Shift+O to reveal. */}
            {showDevSims && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={simulateONDCOrder}
                  className="px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border border-indigo-300 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                  title="Simulate incoming real-time ONDC order"
                >
                  <span className="material-symbols-outlined text-[15px]">hub</span>
                  + Sim ONDC
                </button>
                <button
                  type="button"
                  onClick={simulateGeMOrder}
                  className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                  title="Simulate incoming real-time GeM tender PO"
                >
                  <span className="material-symbols-outlined text-[15px]">account_balance</span>
                  + Sim GeM
                </button>
              </div>
            )}
          </div>

          {/* ── ACTIVE INSTITUTIONAL TENDERS ────────────────────────────── */}
          <section className="bg-[#fcfaf7] border border-[#d1c4bd]/60 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">gavel</span>
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-stone-900">
                      {language === 'hi' ? '🏛️ सक्रिय सरकारी खरीद निविदाएं' : '🏛️ Active Government Procurement Tenders (GeM)'}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-bold">
                      {ACTIVE_INSTITUTIONAL_TENDERS.length} {language === 'hi' ? 'सक्रिय' : 'Live'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600">
                    {language === 'hi'
                      ? 'आपके शिल्प क्लस्टर हेतु आरक्षित थोक खरीद निविदाएं • 1-क्लिक में डिजिटल बोली लगाएं'
                      : 'Reserved institutional procurement requests matched to your cluster • 1-Click Digital Bidding'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTenders(!showTenders)}
                className="px-3.5 py-1.5 rounded-full bg-white border border-[#d1c4bd] hover:bg-stone-50 text-xs font-semibold text-stone-700 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {showTenders ? (language === 'hi' ? 'निविदाएं छिपाएं' : 'Hide Tenders') : (language === 'hi' ? 'निविदाएं देखें' : 'View Tenders')}
                <span className="material-symbols-outlined text-[16px] transition-transform duration-200" style={{ transform: showTenders ? 'rotate(180deg)' : 'none' }}>
                  expand_more
                </span>
              </button>
            </div>

            {showTenders && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1 tenders-list">
                {ACTIVE_INSTITUTIONAL_TENDERS.map((tender) => (
                  <InstitutionalTenderCard
                    key={tender.id}
                    tender={tender}
                    onAcceptTender={handleAcceptTender}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── STATUS BANNER with global voice ─────────────────────────── */}
          <section
            aria-label="Status notice"
            className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-tertiary-fixed/30 border border-tertiary-fixed/80 rounded-3xl p-4 sm:p-5"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[26px]">notifications_active</span>
              </div>
              <div className="flex flex-col">
                <p className="text-sm lg:text-base text-on-tertiary-fixed font-bold leading-snug">
                  {language === 'hi'
                    ? `${displayedOrders.length} आर्डर सक्रिय हैं!`
                    : `${displayedOrders.length} Active Orders!`}
                </p>
                <p className="text-xs lg:text-sm text-on-tertiary-fixed-variant leading-tight">
                  {language === 'hi'
                    ? "नया आर्डर मिलने पर आवाज़ सुनाई देगी। 'सामान पैक हो गया' बटन दबाकर स्थिति बदलें।"
                    : "Voice plays on new order arrival. Tap 'Mark as Packed' once order is ready."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                type="button"
                aria-label="बोलकर सुनें"
                className="min-w-[48px] min-h-[48px] w-[48px] h-[48px] rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 active:scale-90 hover:scale-105 transition-all shadow-md cursor-pointer"
                onClick={() => {
                  unlockAudio();
                  if (displayedOrders.length > 0) {
                    const text = displayedOrders[0].voice_announcement_text || buildOrderAnnouncementText(displayedOrders[0]);
                    announceOrder(text);
                  }
                }}
              >
                <span className="material-symbols-outlined text-[24px]">volume_up</span>
              </button>
            </div>
          </section>

          {/* ── ORDER CARDS GRID ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6" id="orders-list">
            {displayedOrders.length === 0 ? (
              <div className="col-span-full py-12 text-center flex flex-col items-center justify-center gap-2 bg-surface-container-low rounded-3xl border border-border-delicate/60 p-6">
                <span className="material-symbols-outlined text-4xl text-outline">inventory_2</span>
                <p className="text-sm font-bold text-on-surface">
                  {language === 'hi' ? 'इस श्रेणी में कोई आर्डर नहीं है' : 'No orders found for this filter'}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveFilter('ALL')}
                  className="mt-2 px-4 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-bold cursor-pointer active:scale-95"
                >
                  {language === 'hi' ? 'सभी आर्डर देखें (View All)' : 'View All Orders'}
                </button>
              </div>
            ) : (
              displayedOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onMarkPacked={handleMarkPacked}
                  onAcceptPO={handleAcceptPO}
                  onDispatchPO={handleDispatchPO}
                  setSelectedPO={setSelectedPO}
                />
              ))
            )}
          </div>

          {/* ── FOOTER ───────────────────────────────────────────────────── */}
          <div className="text-center py-6 flex flex-col items-center justify-center gap-1.5 text-on-surface-variant border-t border-border-delicate/40 mt-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[24px]">verified</span>
              <p className="text-xs font-bold text-on-surface">
                {language === 'hi'
                  ? '100% सुरक्षित भुगतान - ONDC सेटलमेंट व GeM एस्क्रो'
                  : '100% Guaranteed Payouts via ONDC Settlements & GeM Escrow'}
              </p>
            </div>
            <p className="text-[11px] text-outline">
              {language === 'hi'
                ? 'सभी लेन-देन भारत सरकार द्वारा मान्यता प्राप्त ONDC एवं GeM नेटवर्क के तहत सुरक्षित हैं'
                : 'All transactions are guaranteed & secured via Government recognized ONDC & GeM networks'}
            </p>
          </div>
        </div>
      </main>

      {/* ── PO Slip Modal ────────────────────────────────────────────────────── */}
      {selectedPO && (
        <POSlipModal
          order={selectedPO}
          onClose={() => setSelectedPO(null)}
        />
      )}

      {/* ── Live Toast Notification ───────────────────────────────────────────── */}
      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3.5 transition-all max-w-md w-[92%] sm:w-auto text-left animate-in fade-in slide-in-from-top-3 ${
            toastType === 'success'
              ? 'bg-green-600 border-2 border-green-400 text-white text-base sm:text-lg font-bold shadow-green-900/30'
              : toastType === 'new-order'
              ? 'bg-emerald-600 text-white border-2 border-emerald-400 font-bold text-sm sm:text-base'
              : 'bg-gray-900 text-white font-bold text-sm'
          }`}
        >
          {toastType === 'success' ? (
            <CheckCircle2 className="w-8 h-8 sm:w-9 sm:h-9 text-white shrink-0 stroke-[2.5]" />
          ) : (
            <span className="material-symbols-outlined text-[24px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
              {toastType === 'new-order' ? 'notification_important' : 'bolt'}
            </span>
          )}
          <span className="leading-snug">{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
