import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

// ─── Realistic institutional purchase order templates for GeM / ONDC simulation ───
const ORDER_TEMPLATES = [
  {
    order_id: 'GEM-PO-2026-8849102',
    buyer_name: 'Ministry of Tourism & Culture (Govt. of India)',
    channel: 'GeM',
    order_type: 'gem',
    item_title: 'Handcrafted Terracotta Earthen Pitcher (Surahi)',
    quantity: 50,
    unit_price_inr: 260,
    total_amount: 13000,
    total_price_inr: 13000,
    status: 'pending',
    shipping_address: 'Central State Guest House, Chanakyapuri, New Delhi - 110021',
    city: 'New Delhi',
    payment_mode: 'GeM PFMS Verified Institutional Escrow (Auto-settlement on Dispatch)',
    notes: 'Urgent institutional procurement for National Tourism Conclave 2026',
  },
  {
    order_id: 'ONDC-BECKN-PO-739218',
    buyer_name: 'Tribal Co-operative Marketing Development Federation (TRIFED Store Network)',
    channel: 'ONDC',
    order_type: 'ondc',
    item_title: 'GI-Certified Jaipur Blue Pottery Decorative Wall Plate (10 Inch)',
    quantity: 25,
    unit_price_inr: 780,
    total_amount: 19500,
    total_price_inr: 19500,
    status: 'accepted',
    shipping_address: 'TRIFED Central Fulfillment Hub, Sector 62, Noida, Uttar Pradesh - 201309',
    city: 'Noida',
    payment_mode: 'ONDC Protocol Settlement via UPI / BharatQR',
    notes: 'Tribal & Artisan Heritage Retail Distribution',
  },
  {
    order_id: 'GEM-PO-2026-9813',
    buyer_name: 'Ministry of Textiles (DC Handlooms)',
    channel: 'GeM',
    order_type: 'gem',
    item_title: 'Handwoven Chanderi Silk-Cotton Zari Border Stole',
    quantity: 20,
    unit_price_inr: 1150,
    total_amount: 23000,
    total_price_inr: 23000,
    status: 'pending',
    shipping_address: 'Udyog Bhawan, Rafi Marg, New Delhi 110011',
    city: 'New Delhi',
    payment_mode: 'GeM PFMS Verified Institutional Escrow (Auto-settlement on Dispatch)',
    notes: 'Institutional Diplomatic Gift Procurement Batch',
  },
];

// Static demo institutional orders matching production seed
const STATIC_ORDERS = [
  {
    id: 'b2c3d4e5-0001-4000-8000-000000000001',
    order_id: 'GEM-PO-2026-8849102',
    buyer_name: 'Ministry of Tourism & Culture (Govt. of India)',
    channel: 'GeM',
    order_type: 'gem',
    item_title: 'Handcrafted Terracotta Earthen Pitcher (Surahi)',
    product_title: 'Handcrafted Terracotta Earthen Pitcher (Surahi)',
    quantity: 50,
    unit_price_inr: 260,
    total_amount: 13000,
    total_price_inr: 13000,
    status: 'pending',
    shipping_address: 'Central State Guest House, Chanakyapuri, New Delhi - 110021',
    city: 'New Delhi',
    payment_mode: 'GeM PFMS Verified Institutional Escrow (Auto-settlement on Dispatch)',
    notes: 'Urgent institutional procurement for National Tourism Conclave 2026',
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: 'b2c3d4e5-0002-4000-8000-000000000002',
    order_id: 'ONDC-BECKN-PO-739218',
    buyer_name: 'Tribal Co-operative Marketing Development Federation (TRIFED Store Network)',
    channel: 'ONDC',
    order_type: 'ondc',
    item_title: 'GI-Certified Jaipur Blue Pottery Decorative Wall Plate (10 Inch)',
    product_title: 'GI-Certified Jaipur Blue Pottery Decorative Wall Plate (10 Inch)',
    quantity: 25,
    unit_price_inr: 780,
    total_amount: 19500,
    total_price_inr: 19500,
    status: 'accepted',
    shipping_address: 'TRIFED Central Fulfillment Hub, Sector 62, Noida, Uttar Pradesh - 201309',
    city: 'Noida',
    payment_mode: 'ONDC Protocol Settlement via UPI / BharatQR',
    notes: 'Tribal & Artisan Heritage Retail Distribution',
    created_at: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
  },
];

function speakOrder(order) {
  try {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const qty = order.quantity || 1;
    const price = order.total_amount || order.total_price_inr || order.unit_price_inr || 0;
    const channel = order.channel || (order.order_type === 'gem' ? 'GeM' : 'ONDC');
    const buyer = order.buyer_name || 'एक ग्राहक';
    const item = order.item_title || order.product_title || 'शिल्प उत्पाद';
    const text = `नया आर्डर आया है! ${channel} से ${buyer} ने ${qty} नग ${item} मांगे हैं। कुल कीमत ₹${price}। जल्दी से पैक करें।`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('[speakOrder] TTS failed:', e);
  }
}

function formatTimeAgo(isoDate) {
  if (!isoDate) return 'just now';
  const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function OrderCard({ order, onAcceptPO, onDispatchPO }) {
  const isGem = order.order_type === 'gem';
  const channelLabel = order.channel || (isGem ? 'GeM PO' : 'ONDC');
  const navigate = useNavigate();
  const currentStatus = order.status || 'pending';

  return (
    <article
      className="order-card bg-surface-container-lowest rounded-3xl p-5 shadow-sm border border-border-delicate flex flex-col justify-between gap-4 transition-all duration-500 hover:shadow-md animate-in fade-in slide-in-from-top-4"
      id={`order-${order.id}`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-bold text-on-surface font-mono">
                #{String(order.order_id || order.id || 'NEW').toUpperCase()}
              </span>
              <span className="text-on-surface-variant">•</span>
              <span className="text-xs text-on-surface-variant">{formatTimeAgo(order.created_at)}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
              <span className={`text-xs font-bold ${isGem ? 'text-amber-700' : 'text-secondary'}`}>
                {isGem ? '🏛️ Institutional GeM Order' : '⚡ ONDC Network Live'}
              </span>
              {order.buyer_name && (
                <span className="text-[11px] text-on-surface-variant font-semibold">
                  • {order.buyer_name}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {/* Status Pill */}
            {currentStatus === 'dispatched' ? (
              <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-bold bg-emerald-100 text-emerald-800">
                <span className="material-symbols-outlined text-[14px]">local_shipping</span>
                डिस्पैच पूर्ण
              </span>
            ) : currentStatus === 'accepted' ? (
              <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-bold bg-blue-100 text-blue-800">
                <span className="material-symbols-outlined text-[14px]">check</span>
                स्वीकृत (Accepted)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-bold bg-amber-100 text-amber-800">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                लंबित (Pending)
              </span>
            )}

            <span
              className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold ${
                isGem
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-surface-container-high text-primary'
              }`}
            >
              <span
                className="material-symbols-outlined text-[15px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {isGem ? 'account_balance' : 'hub'}
              </span>
              {isGem ? '🏛️ सरकारी खरीद (Govt Order)' : '⚡ ONDC नेटवर्क'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3.5 bg-surface-container-low p-3.5 rounded-2xl">
          <div className="w-[76px] h-[76px] rounded-xl bg-surface-container-high flex items-center justify-center shrink-0 text-on-surface-variant">
            <span className="material-symbols-outlined text-[32px]">inventory_2</span>
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <h2 className="text-sm font-bold text-on-surface truncate">
              {order.item_title || order.product_title || order.notes || 'Artisan Craft Product'}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-on-surface-variant font-medium">
                Qty: {order.quantity} {order.quantity > 1 ? 'Units' : 'Unit'}
              </span>
              <span className="text-xs text-on-surface-variant">•</span>
              <span className="text-base font-extrabold text-on-surface">
                ₹{(order.total_amount || order.total_price_inr || (order.unit_price_inr ? order.unit_price_inr * (order.quantity || 1) : 0)).toLocaleString('en-IN')}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-[#1A3824] text-xs font-bold mt-1">
              <span
                className="material-symbols-outlined text-[16px] text-[#25D366]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
              <span>🛡️ सुरक्षित भुगतान (Payment Secured)</span>
            </span>
          </div>
        </div>

        {(order.shipping_address || order.city) && (
          <div className="flex items-center gap-2 px-1 text-on-surface-variant text-xs">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant shrink-0">
              local_shipping
            </span>
            <p className="truncate">
              Ship to: <strong className="text-on-surface">{order.shipping_address || order.city}</strong>
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 pt-2 border-t border-border-delicate/40">
        {/* Dynamic Action Buttons for Accept & Dispatch */}
        {currentStatus === 'dispatched' ? (
          <div className="w-full min-h-[50px] rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2 py-2.5">
            <span className="material-symbols-outlined text-[20px] text-emerald-700">verified</span>
            <span>डिस्पैच पूर्ण (Dispatched via ONDC Logistics)</span>
          </div>
        ) : currentStatus === 'accepted' ? (
          <button
            aria-label={`Dispatch order ${order.order_id || order.id}`}
            className="action-btn w-full min-h-[52px] h-[52px] rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
            type="button"
            onClick={() => onDispatchPO(order.order_id || order.id)}
          >
            <span className="material-symbols-outlined text-[22px]">local_shipping</span>
            <span>डिस्पैच मार्क करें (Dispatch)</span>
          </button>
        ) : (
          <button
            aria-label={`Accept PO order ${order.order_id || order.id}`}
            className="action-btn w-full min-h-[52px] h-[52px] rounded-full bg-primary-container hover:bg-black text-on-primary text-sm font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
            type="button"
            onClick={() => onAcceptPO(order.order_id || order.id)}
          >
            <span className="material-symbols-outlined text-[22px]">inventory_2</span>
            <span>स्वीकार करें (Accept PO)</span>
          </button>
        )}

        <div className="flex items-center justify-between px-1">
          <button
            aria-label="Download or view packaging slip"
            className="min-h-[44px] h-[44px] px-3 rounded-full text-secondary hover:text-primary font-bold text-xs flex items-center gap-1.5 active:bg-surface-container transition-colors cursor-pointer"
            type="button"
            onClick={() => navigate('/success', { state: { ...order } })}
          >
            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            View Slip • पर्ची देखें
          </button>
          <span className="text-[11px] text-outline font-medium">Auto-dispatch enabled</span>
        </div>
      </div>
    </article>
  );
}

export default function Orders() {
  const navigate = useNavigate();
  const { user, artisanName, artisanProfile } = useAuth();
  const [orders, setOrders] = useState(STATIC_ORDERS);
  const [isSimulating, setIsSimulating] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const channelRef = useRef(null);
  const templateIndexRef = useRef(0);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Helper to normalize Supabase row to exact frontend model
  const mapOrderRecord = (item) => ({
    ...item,
    id: item.id || item.order_id,
    order_id: item.order_id || item.id,
    buyer_name: item.buyer_name || 'Institutional Buyer',
    channel: item.channel || (item.order_type === 'gem' ? 'GeM Institutional PO' : 'ONDC Network'),
    order_type: item.order_type || (item.channel?.toLowerCase().includes('gem') ? 'gem' : 'ondc'),
    item_title: item.item_title || item.product_title || item.notes || 'Artisan Craft Product',
    product_title: item.item_title || item.product_title || item.notes || 'Artisan Craft Product',
    quantity: Number(item.quantity || 1),
    total_amount: Number(item.total_amount || item.total_price_inr || (item.unit_price_inr ? item.unit_price_inr * item.quantity : 0)),
    unit_price_inr: Number(item.unit_price_inr || (item.total_amount && item.quantity ? Math.round(item.total_amount / item.quantity) : 0)),
    total_price_inr: Number(item.total_amount || item.total_price_inr || 0),
    status: item.status || 'pending',
    shipping_address: item.shipping_address || item.city || 'Transport Bhawan, New Delhi',
    city: item.city || item.shipping_address || 'New Delhi',
    payment_mode: item.payment_mode || (item.order_type === 'gem' ? 'GeM PFMS Institutional Escrow' : 'ONDC Escrow RSP Prepaid'),
    notes: item.notes || item.item_title || 'Institutional Purchase Order',
    created_at: item.created_at || new Date().toISOString(),
  });

  // 1. Initial Load of Orders from Supabase
  useEffect(() => {
    async function loadSupabaseOrders() {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped = data.map(mapOrderRecord);
          setOrders(mapped);
        }
      } catch (err) {
        console.warn('Could not load orders from Supabase:', err);
      }
    }
    loadSupabaseOrders();
  }, []);

  // 2. Set up Supabase Realtime subscription on public.orders
  useEffect(() => {
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('[Realtime] New order received:', payload.new);
          const newOrder = mapOrderRecord(payload.new);
          setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id && o.order_id !== newOrder.order_id)]);
          showToast(`⚡ नया आर्डर आया! ${newOrder.buyer_name || 'Customer'} — ₹${newOrder.total_amount}`);
          speakOrder(newOrder);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('[Realtime] Order updated:', payload.new);
          const updated = mapOrderRecord(payload.new);
          setOrders((prev) =>
            prev.map((o) => (o.id === updated.id || o.order_id === updated.order_id ? { ...o, ...updated } : o))
          );
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeConnected(true);
          console.log('[Realtime] Subscribed to orders channel.');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setRealtimeConnected(false);
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 3. Action Handler: "स्वीकार करें (Accept PO)" -> update({ status: 'accepted' })
  const handleAcceptPO = async (orderId) => {
    // Immediate optimistic UI update
    setOrders((prev) =>
      prev.map((o) => ((o.order_id === orderId || o.id === orderId) ? { ...o, status: 'accepted' } : o))
    );
    showToast(`✅ ऑर्डर स्वीकार किया गया (PO Accepted) — #${String(orderId).slice(0, 16)}`);

    // Persist to Supabase safely handling both uuid id and text order_id
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(orderId));
      let query = supabase.from('orders').update({ status: 'accepted' });
      if (isUuid) {
        query = query.eq('id', orderId);
      } else {
        query = query.eq('order_id', orderId);
      }
      const { error } = await query;
      if (error) console.error('Error updating order to accepted:', error);
    } catch (err) {
      console.error('Failed to update order status in Supabase:', err);
    }
  };

  // 4. Action Handler: "डिस्पैच मार्क करें (Dispatch)" -> update({ status: 'dispatched' })
  const handleDispatchPO = async (orderId) => {
    // Immediate optimistic UI update
    setOrders((prev) =>
      prev.map((o) => ((o.order_id === orderId || o.id === orderId) ? { ...o, status: 'dispatched' } : o))
    );
    showToast(`🚚 ऑर्डर डिस्पैच मार्क किया गया (Dispatched) — #${String(orderId).slice(0, 16)}`);

    // Persist to Supabase safely handling both uuid id and text order_id
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(orderId));
      let query = supabase.from('orders').update({ status: 'dispatched' });
      if (isUuid) {
        query = query.eq('id', orderId);
      } else {
        query = query.eq('order_id', orderId);
      }
      const { error } = await query;
      if (error) console.error('Error updating order to dispatched:', error);
    } catch (err) {
      console.error('Failed to update order status in Supabase:', err);
    }
  };

  // 5. Simulate an incoming GeM / ONDC Purchase Order
  const handleSimulateOrder = async () => {
    setIsSimulating(true);
    try {
      const template = ORDER_TEMPLATES[templateIndexRef.current % ORDER_TEMPLATES.length];
      templateIndexRef.current += 1;

      const authUser = (await supabase.auth.getUser()).data?.user || user;
      const authUserId = authUser?.id || user?.id || null;
      const userPhone = artisanProfile?.phone || authUser?.phone || user?.phone || null;
      const total = template.total_amount || (template.quantity * template.unit_price_inr);
      const generatedOrderId = `${template.order_type === 'gem' ? 'GEM-PO' : 'ONDC-PO'}-${Date.now().toString().slice(-4)}`;

      const orderPayload = {
        order_id: template.order_id || generatedOrderId,
        buyer_name: template.buyer_name,
        channel: template.channel,
        order_type: template.order_type,
        item_title: template.item_title,
        quantity: template.quantity,
        total_amount: total,
        unit_price_inr: template.unit_price_inr,
        total_price_inr: total,
        status: 'pending',
        shipping_address: template.shipping_address,
        payment_mode: template.payment_mode,
        notes: template.notes || template.item_title,
        city: template.city,
        user_id: authUserId,
        artisan_user_id: authUserId,
        user_phone: userPhone,
      };

      const { data, error } = await supabase.from('orders').insert([orderPayload]).select().single();

      if (error) {
        // Realtime insert fallback — simulate locally for demo
        console.warn('[Simulate] Supabase insert failed, using local simulation:', error.message);
        const localOrder = mapOrderRecord({
          id: `sim-${Date.now()}`,
          ...orderPayload,
          created_at: new Date().toISOString(),
        });
        setOrders((prev) => [localOrder, ...prev]);
        showToast(`⚡ ${template.channel} — नया आर्डर! ₹${total.toLocaleString('en-IN')}`);
        speakOrder({ ...localOrder });
      } else {
        showToast(`✅ GeM/ONDC PO inserted — Realtime will fire! ₹${total.toLocaleString('en-IN')}`);
      }
    } catch (err) {
      console.error('[Simulate] Error:', err);
      showToast('Simulation failed. Please retry.');
    } finally {
      setIsSimulating(false);
    }
  };

  // Merge static demo orders if real orders list is empty or prepend
  const displayedOrders = orders.length > 0 ? orders : STATIC_ORDERS;

  return (
    <div className="w-full">
      <main className="flex-1 w-full bg-background min-h-screen p-4 sm:p-6 lg:p-10 flex flex-col gap-6">
        <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">

          {/* Top Bar Navigation */}
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-border-delicate/60 flex-wrap">
            <div className="flex items-center gap-3">
              <button
                aria-label="Go back to Home"
                className="min-w-[48px] min-h-[48px] w-[48px] h-[48px] rounded-full bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
                type="button"
                onClick={() => navigate('/home')}
              >
                <span className="material-symbols-outlined text-[24px]">arrow_back</span>
              </button>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-secondary tracking-wider uppercase">Order Processing</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  <span className={`text-xs font-medium flex items-center gap-1 ${realtimeConnected ? 'text-emerald-600' : 'text-outline'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full inline-block ${realtimeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-outline'}`}></span>
                    {realtimeConnected ? 'ONDC Realtime Live' : 'ONDC Network'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold text-[11px]">
                    <span>🟢 ऑथेंटिकेटेड (UID: ...{user?.id ? user.id.slice(0, 6) : 'anon'}) • {artisanName}</span>
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-espresso-deep tracking-tight mt-0.5">
                  आर्डर इनबॉक्स (New Orders)
                </h1>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2.5 flex-wrap justify-end">

              <button
                aria-label="Filter Orders"
                className="min-h-[44px] px-3 sm:px-4 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface font-bold text-xs flex items-center gap-2 border border-border-delicate/80 transition-colors"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px] text-secondary">tune</span>
                <span className="hidden sm:inline">Filter</span>
              </button>
              <button
                aria-label="Refresh Orders"
                onClick={() => window.location.reload()}
                className="min-w-[44px] min-h-[44px] w-[44px] h-[44px] rounded-full bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">refresh</span>
              </button>
            </div>
          </div>

          {/* Quick Status / Voice Banner */}
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
                  {displayedOrders.length} आर्डर सक्रिय हैं! ({displayedOrders.length} Active Orders)
                </p>
                <p className="text-xs lg:text-sm text-on-tertiary-fixed-variant leading-tight">
                  स्वीकार करने के लिए 'स्वीकार करें' तथा कूरियर हेतु 'डिस्पैच मार्क करें' दबाएं।
                </p>
              </div>
            </div>

            <button
              aria-label="बोलकर सुनें - Listen to Hindi instructions"
              className="min-w-[48px] min-h-[48px] w-[48px] h-[48px] rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 active:scale-90 hover:scale-105 transition-all shadow-md cursor-pointer"
              id="voice-listen-btn"
              type="button"
              onClick={() => {
                if (displayedOrders.length > 0) speakOrder(displayedOrders[0]);
              }}
            >
              <span className="material-symbols-outlined text-[24px]">volume_up</span>
            </button>
          </section>

          {/* Orders Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6" id="orders-list">
            {displayedOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onAcceptPO={handleAcceptPO}
                onDispatchPO={handleDispatchPO}
              />
            ))}
          </div>

          {/* Bottom Info Banner */}
          <div className="text-center py-6 flex flex-col items-center justify-center gap-1.5 text-on-surface-variant border-t border-border-delicate/40 mt-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[24px]">verified</span>
              <p className="text-xs font-bold text-on-surface">100% Guaranteed Payouts via ONDC Settlements & GeM Escrow</p>
            </div>
            <p className="text-[11px] text-outline">
              सभी लेन-देन भारत सरकार द्वारा मान्यता प्राप्त ONDC एवं GeM नेटवर्क के तहत सुरक्षित हैं
            </p>
          </div>
        </div>
      </main>

      {/* Live Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-primary text-on-primary px-5 py-3 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 transition-all max-w-sm text-center animate-in fade-in slide-in-from-top-2">
          <span className="material-symbols-outlined text-[18px] text-emerald-400">bolt</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Floating Demo Mode Pill */}
      <button
        id="simulate-order-btn"
        aria-label="Demo Mode: Trigger PO"
        className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white px-4 py-2 rounded-full shadow-lg opacity-50 hover:opacity-100 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-30"
        type="button"
        onClick={handleSimulateOrder}
        disabled={isSimulating}
      >
        <span className="material-symbols-outlined text-[16px]">
          {isSimulating ? 'hourglass_top' : 'bolt'}
        </span>
        <span>{isSimulating ? 'Inserting...' : 'Demo Mode: Trigger PO ⚡'}</span>
      </button>
    </div>
  );
}
