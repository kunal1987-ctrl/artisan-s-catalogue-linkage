import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import POSlipModal from '../components/POSlipModal';
import { useLanguage } from '../context/LanguageContext';
import InstitutionalTenderCard, { ACTIVE_INSTITUTIONAL_TENDERS } from '../components/InstitutionalTenderCard';



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
    hsn_code: '69120010',
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
    hsn_code: '69139000',
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

function OrderCard({ order, onAcceptPO, onDispatchPO, setSelectedPO }) {
  const { language } = useLanguage();
  const isGem = order.order_type === 'gem';
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
                {isGem 
                  ? (language === 'hi' ? '🏛️ संस्थागत GeM खरीद' : '🏛️ Institutional GeM Order')
                  : (language === 'hi' ? '⚡ ONDC नेटवर्क लाइव' : '⚡ ONDC Network Live')}
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
                {language === 'hi' ? 'डिस्पैच पूर्ण' : 'Dispatched'}
              </span>
            ) : currentStatus === 'accepted' ? (
              <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-bold bg-blue-100 text-blue-800">
                <span className="material-symbols-outlined text-[14px]">check</span>
                {language === 'hi' ? 'स्वीकृत' : 'Accepted'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-bold bg-amber-100 text-amber-800">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                {language === 'hi' ? 'लंबित' : 'Pending'}
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
              {isGem 
                ? (language === 'hi' ? '🏛️ सरकारी खरीद' : '🏛️ Govt GeM Order') 
                : (language === 'hi' ? '⚡ ONDC नेटवर्क' : '⚡ ONDC Network')}
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
                {language === 'hi' ? 'मात्रा' : 'Qty'}: {order.quantity} {order.quantity > 1 ? (language === 'hi' ? 'इकाइयां' : 'Units') : (language === 'hi' ? 'इकाई' : 'Unit')}
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
              <span>{language === 'hi' ? '🛡️ सुरक्षित भुगतान' : '🛡️ Payment Secured'}</span>
            </span>
          </div>
        </div>

        {(order.shipping_address || order.city) && (
          <div className="flex items-center gap-2 px-1 text-on-surface-variant text-xs">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant shrink-0">
              local_shipping
            </span>
            <p className="truncate">
              {language === 'hi' ? 'डिलीवरी पता' : 'Ship to'}: <strong className="text-on-surface">{order.shipping_address || order.city}</strong>
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 pt-2 border-t border-border-delicate/40">
        {/* Dynamic Action Buttons for Accept & Dispatch */}
        {currentStatus === 'dispatched' ? (
          <div className="w-full min-h-[50px] rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2 py-2.5">
            <span className="material-symbols-outlined text-[20px] text-emerald-700">verified</span>
            <span>{language === 'hi' ? 'डिस्पैच पूर्ण (ONDC लॉजिस्टिक्स)' : 'Dispatched via ONDC Logistics'}</span>
          </div>
        ) : currentStatus === 'accepted' ? (
          <button
            aria-label={`Dispatch order ${order.order_id || order.id}`}
            className="action-btn w-full min-h-[52px] h-[52px] rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
            type="button"
            onClick={() => onDispatchPO(order.order_id || order.id)}
          >
            <span className="material-symbols-outlined text-[22px]">local_shipping</span>
            <span>{language === 'hi' ? 'डिस्पैच मार्क करें' : 'Mark Dispatched'}</span>
          </button>
        ) : (
          <button
            aria-label={`Accept PO order ${order.order_id || order.id}`}
            className="action-btn w-full min-h-[52px] h-[52px] rounded-full bg-primary-container hover:bg-black text-on-primary text-sm font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
            type="button"
            onClick={() => onAcceptPO(order.order_id || order.id)}
          >
            <span className="material-symbols-outlined text-[22px]">inventory_2</span>
            <span>{language === 'hi' ? 'स्वीकार करें' : 'Accept PO'}</span>
          </button>
        )}

        <div className="flex items-center justify-between px-1">
          <button
            aria-label="Download or view packaging slip"
            className="min-h-[44px] h-[44px] px-3 rounded-full text-secondary hover:text-primary font-bold text-xs flex items-center gap-1.5 active:bg-surface-container transition-colors cursor-pointer"
            type="button"
            onClick={() => setSelectedPO(order)}
          >
            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            <span>{language === 'hi' ? 'पर्ची देखें' : 'View PO Slip'}</span>
          </button>
          <span className="text-[11px] text-outline font-medium">
            {language === 'hi' ? 'ऑटो-डिस्पैच सक्रिय' : 'Auto-dispatch enabled'}
          </span>
        </div>
      </div>
    </article>
  );
}

export default function Orders() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [orders, setOrders] = useState(STATIC_ORDERS);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [showTenders, setShowTenders] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const channelRef = useRef(null);

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
    hsn_code: item.hsn_code || '69120010',
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
          console.log('[Realtime] Subscribed to orders channel.');
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



  // 7. Handle 1-Click Institutional Tender Bid & Acceptance
  const handleAcceptTender = (tender) => {
    const generatedOrderId = `GEM-PO-${Date.now().toString().slice(-6)}`;
    const tenderOrder = mapOrderRecord({
      id: `tender-${Date.now()}`,
      order_id: generatedOrderId,
      buyer_name: tender.ministry,
      channel: 'GeM Institutional PO',
      order_type: 'gem',
      item_title: tender.title,
      product_title: tender.title,
      quantity: tender.quantity,
      unit_price_inr: tender.unit_budget_inr,
      total_amount: tender.total_budget_inr,
      total_price_inr: tender.total_budget_inr,
      status: 'accepted',
      shipping_address: tender.delivery_location,
      city: 'New Delhi',
      payment_mode: 'GeM PFMS Verified Institutional Escrow (Auto-settlement on Dispatch)',
      notes: `Awarded Tender: ${tender.tender_no} • ${tender.eligibility}`,
      created_at: new Date().toISOString(),
    });

    setOrders((prev) => [tenderOrder, ...prev.filter((o) => o.id !== tenderOrder.id && o.order_id !== tenderOrder.order_id)]);
    showToast(
      language === 'hi'
        ? `🏆 सरकारी निविदा स्वीकृत! GeM PO #${generatedOrderId} — ₹${tender.total_budget_inr.toLocaleString('en-IN')}`
        : `🏆 GeM Tender Awarded! PO #${generatedOrderId} — ₹${tender.total_budget_inr.toLocaleString('en-IN')}`
    );
    speakOrder(tenderOrder);

    try {
      supabase.from('orders').insert([{
        order_id: tenderOrder.order_id,
        buyer_name: tenderOrder.buyer_name,
        channel: tenderOrder.channel,
        order_type: 'gem',
        item_title: tenderOrder.item_title,
        quantity: tenderOrder.quantity,
        unit_price_inr: tenderOrder.unit_price_inr,
        total_amount: tenderOrder.total_amount,
        total_price_inr: tenderOrder.total_price_inr,
        status: 'accepted',
        shipping_address: tenderOrder.shipping_address,
        payment_mode: tenderOrder.payment_mode,
        notes: tenderOrder.notes,
        city: tenderOrder.city,
      }]).then(() => {});
    } catch (e) {
      console.warn('[InstitutionalTender] Background DB insert fallback:', e);
    }
  };

  // 8. Webhook Simulators: Realtime Inbound Order Simulation
  const simulateONDCOrder = () => {
    const timestamp = Date.now();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const mockONDCItems = [
      {
        title: 'Handcrafted Terracotta Earthen Pitcher (Surahi)',
        price: 450,
        hsn: '69120010',
        qty: 2,
        buyer: 'Priya Sharma (Bengaluru)',
        address: 'Flat 402, Green Glen Layout, Bellandur, Bengaluru, Karnataka - 560103',
        city: 'Bengaluru',
        app: 'Paytm Mall BAP',
      },
      {
        title: 'GI-Certified Jaipur Blue Pottery Decorative Wall Plate (10 Inch)',
        price: 1250,
        hsn: '69139000',
        qty: 1,
        buyer: 'Amitabh Sen (Kolkata)',
        address: '14B Lake Temple Road, Southern Avenue, Kolkata, West Bengal - 700029',
        city: 'Kolkata',
        app: 'PhonePe Pincode',
      },
      {
        title: 'Handwoven Banarasi Pure Silk Brocade Stole',
        price: 1850,
        hsn: '52085290',
        qty: 1,
        buyer: 'Meenakshi Sundaram (Chennai)',
        address: 'A-12 Besant Nagar Sea Breeze Apts, Chennai, Tamil Nadu - 600090',
        city: 'Chennai',
        app: 'Mystore Network',
      },
    ];
    const item = mockONDCItems[Math.floor(Math.random() * mockONDCItems.length)];
    const total = item.price * item.qty;
    const generatedOrderId = `ONDC-BECKN-${timestamp.toString().slice(-4)}-${randomSuffix}`;

    const newOrder = mapOrderRecord({
      id: `ondc-sim-${timestamp}`,
      order_id: generatedOrderId,
      buyer_name: item.buyer,
      channel: `ONDC Network (${item.app})`,
      order_type: 'ondc',
      item_title: item.title,
      product_title: item.title,
      quantity: item.qty,
      unit_price_inr: item.price,
      total_amount: total,
      total_price_inr: total,
      status: 'pending',
      shipping_address: item.address,
      city: item.city,
      payment_mode: 'ONDC Protocol Escrow (RSP Settlement via UPI)',
      notes: 'Customer direct purchase order via ONDC network buyer application.',
      hsn_code: item.hsn,
      created_at: new Date().toISOString(),
    });

    setOrders((prev) => [newOrder, ...prev]);
    showToast(`⚡ नया ONDC आर्डर प्राप्त! ${newOrder.buyer_name} — ₹${total}`);
    speakOrder(newOrder);
  };

  const simulateGeMOrder = () => {
    const timestamp = Date.now();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const mockGeMItems = [
      {
        title: 'Handcrafted Terracotta Earthen Pitcher (Surahi)',
        price: 260,
        hsn: '69120010',
        qty: 60,
        buyer: 'Ministry of Tourism & Culture (Govt. of India)',
        address: 'Central State Guest House, Chanakyapuri, New Delhi - 110021',
        city: 'New Delhi',
        notes: 'Institutional hospitality procurement for National Tourism Conclave',
      },
      {
        title: 'GI-Certified Jaipur Blue Pottery Decorative Wall Plate (10 Inch)',
        price: 780,
        hsn: '69139000',
        qty: 30,
        buyer: 'TRIFED - Tribal Co-operative Marketing Federation',
        address: 'TRIFED Central Warehouse, Sector 62, Noida, Uttar Pradesh - 201309',
        city: 'Noida',
        notes: 'State emporium consignment batch under Aatmanirbhar Bharat Artisan Scheme',
      },
      {
        title: 'Handwoven Chanderi Silk-Cotton Zari Border Stole',
        price: 1150,
        hsn: '52085290',
        qty: 45,
        buyer: 'Ministry of Textiles (Office of DC Handlooms)',
        address: 'Room 312, Udyog Bhawan, Rafi Marg, New Delhi - 110011',
        city: 'New Delhi',
        notes: 'Institutional gift procurement for National Handloom Day delegates',
      },
    ];
    const item = mockGeMItems[Math.floor(Math.random() * mockGeMItems.length)];
    const total = item.price * item.qty;
    const generatedOrderId = `GEM-PO-2026-${randomSuffix}`;

    const newOrder = mapOrderRecord({
      id: `gem-sim-${timestamp}`,
      order_id: generatedOrderId,
      buyer_name: item.buyer,
      channel: 'GeM Institutional PO',
      order_type: 'gem',
      item_title: item.title,
      product_title: item.title,
      quantity: item.qty,
      unit_price_inr: item.price,
      total_amount: total,
      total_price_inr: total,
      status: 'pending',
      shipping_address: item.address,
      city: item.city,
      payment_mode: 'GeM PFMS Verified Institutional Escrow (Auto-settlement on Dispatch)',
      notes: item.notes,
      hsn_code: item.hsn,
      created_at: new Date().toISOString(),
    });

    setOrders((prev) => [newOrder, ...prev]);
    showToast(`🏛️ नया GeM सरकारी खरीद PO प्राप्त! ${newOrder.buyer_name} — ₹${total.toLocaleString('en-IN')}`);
    speakOrder(newOrder);
  };

  // Merge static demo orders if real orders list is empty or prepend, filtered by activeFilter
  const allOrders = orders.length > 0 ? orders : STATIC_ORDERS;
  const displayedOrders = allOrders.filter((order) => {
    if (activeFilter === 'GEM') {
      return (
        order.order_type?.toLowerCase() === 'gem' ||
        order.channel?.toLowerCase().includes('gem') ||
        order.order_id?.toLowerCase().startsWith('gem')
      );
    }
    if (activeFilter === 'ONDC') {
      return (
        order.order_type?.toLowerCase() === 'ondc' ||
        order.channel?.toLowerCase().includes('ondc') ||
        order.order_id?.toLowerCase().startsWith('ondc')
      );
    }
    return true; // 'ALL'
  });

  return (
    <div className="w-full">
      <main className="flex-1 w-full bg-background min-h-screen p-4 sm:p-6 lg:p-10 flex flex-col gap-6">
        <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">

          {/* Top Bar Navigation */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-border-delicate/60 flex-wrap">
            <div className="flex items-start gap-3">
              <button
                aria-label="Go back to Home"
                className="min-w-[48px] min-h-[48px] w-[48px] h-[48px] rounded-full bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer mt-0.5"
                type="button"
                onClick={() => navigate('/home')}
              >
                <span className="material-symbols-outlined text-[24px]">arrow_back</span>
              </button>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-secondary tracking-wider uppercase">
                    {language === 'hi' ? 'ऑर्डर प्रोसेसिंग' : 'Order Processing'}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-espresso-deep tracking-tight mt-0.5">
                  {language === 'hi' ? 'आर्डर इनबॉक्स' : 'Order Inbox'}
                </h1>
              </div>
            </div>
          </div>

          {/* Order Channel Filters & Webhook Simulator Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            {/* Left side: Order Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveFilter('ALL')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all shrink-0 active:scale-95 ${
                  activeFilter === 'ALL'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All / सभी
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('GEM')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all shrink-0 active:scale-95 ${
                  activeFilter === 'GEM'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                GeM Orders / सरकारी
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('ONDC')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all shrink-0 active:scale-95 ${
                  activeFilter === 'ONDC'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                ONDC Orders / रिटेल
              </button>
            </div>

            {/* Right side: Inline Webhook Simulator Pill Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={simulateONDCOrder}
                className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#ff9062]/15 text-[#9c441c] hover:bg-[#ff9062]/25 border border-[#ff9062]/40 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-2xs"
                title="Simulate incoming real-time ONDC order webhook"
              >
                <span className="material-symbols-outlined text-[15px]">hub</span>
                <span>+ Sim ONDC</span>
              </button>
              <button
                type="button"
                onClick={simulateGeMOrder}
                className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-2xs"
                title="Simulate incoming real-time GeM tender purchase order webhook"
              >
                <span className="material-symbols-outlined text-[15px]">account_balance</span>
                <span>+ Sim GeM</span>
              </button>
            </div>
          </div>

          {/* ── ACTIVE GEM INSTITUTIONAL PROCUREMENT TENDERS ── */}
          <section className="bg-[#fcfaf7] border border-[#d1c4bd]/60 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">gavel</span>
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-stone-900">
                      {language === 'hi' ? '🏛️ सक्रिय सरकारी खरीद निविदाएं (GeM B2B Tenders)' : '🏛️ Active Government Procurement Tenders (GeM)'}
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
                className="px-3.5 py-1.5 rounded-full bg-white border border-[#d1c4bd] hover:bg-stone-50 text-xs font-semibold text-stone-700 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              >
                <span>{showTenders ? (language === 'hi' ? 'निविदाएं छिपाएं' : 'Hide Tenders') : (language === 'hi' ? 'निविदाएं देखें' : 'View Tenders')}</span>
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
                  {language === 'hi' 
                    ? `${displayedOrders.length} आर्डर सक्रिय हैं!` 
                    : `${displayedOrders.length} Active Orders!`}
                </p>
                <p className="text-xs lg:text-sm text-on-tertiary-fixed-variant leading-tight">
                  {language === 'hi'
                    ? "स्वीकार करने के लिए 'स्वीकार करें' तथा कूरियर हेतु 'डिस्पैच मार्क करें' दबाएं।"
                    : "Click 'Accept PO' to confirm, and 'Mark Dispatched' once courier takes package."}
                </p>
              </div>
            </div>

            <button
              aria-label={language === 'hi' ? 'बोलकर सुनें' : 'Listen to audio instructions'}
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
            {displayedOrders.length === 0 ? (
              <div className="col-span-full py-12 text-center flex flex-col items-center justify-center gap-2 bg-surface-container-low rounded-3xl border border-border-delicate/60 p-6">
                <span className="material-symbols-outlined text-4xl text-outline">inventory_2</span>
                <p className="text-sm font-bold text-on-surface">
                  {language === 'hi' ? 'इस श्रेणी में कोई आर्डर नहीं है' : 'No orders found for this filter'}
                </p>
                <button
                  onClick={() => setActiveFilter('ALL')}
                  className="mt-2 px-4 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-bold cursor-pointer active:scale-95"
                  type="button"
                >
                  {language === 'hi' ? 'सभी आर्डर देखें (View All)' : 'View All Orders'}
                </button>
              </div>
            ) : (
              displayedOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onAcceptPO={handleAcceptPO}
                  onDispatchPO={handleDispatchPO}
                  setSelectedPO={setSelectedPO}
                />
              ))
            )}
          </div>

          {/* Bottom Info Banner */}
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

      {/* Active Purchase Order Slip Modal */}
      {selectedPO && (
        <POSlipModal
          order={selectedPO}
          onClose={() => setSelectedPO(null)}
        />
      )}

      {/* Live Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-primary text-on-primary px-5 py-3 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 transition-all max-w-sm text-center animate-in fade-in slide-in-from-top-2">
          <span className="material-symbols-outlined text-[18px] text-emerald-400">bolt</span>
          <span>{toastMsg}</span>
        </div>
      )}

    </div>
  );
}
