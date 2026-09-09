import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export const MOCK_ONDC_PAYLOADS = [
  {
    order_id: 'ONDC-BECKN-2026-98124',
    buyer_name: 'Priya Sharma (Bengaluru)',
    channel: 'ONDC Network (Paytm Mall BAP)',
    order_type: 'ondc',
    item_title: 'Handcrafted Terracotta Earthen Pitcher (Surahi)',
    quantity: 2,
    unit_price_inr: 450,
    total_amount: 900,
    total_price_inr: 900,
    status: 'pending',
    shipping_address: 'Flat 402, Green Glen Layout, Bellandur, Bengaluru, Karnataka - 560103',
    city: 'Bengaluru',
    payment_mode: 'ONDC Protocol Escrow (RSP Settlement via UPI)',
    notes: 'Fragile terracotta item. Please pack with extra straw cushioning.',
    beckn_context: {
      domain: 'nic2004:52110',
      action: 'on_confirm',
      core_version: '1.2.0',
      bap_id: 'ondc.paytm.com',
      bpp_id: 'shilp-setu.artisan.in',
      transaction_id: 'tx-ondc-992140',
      message_id: 'msg-ondc-881273',
      timestamp: new Date().toISOString(),
    },
  },
  {
    order_id: 'ONDC-BECKN-2026-44319',
    buyer_name: 'Amitabh Sen (Kolkata)',
    channel: 'ONDC Network (PhonePe Pincode)',
    order_type: 'ondc',
    item_title: 'GI-Certified Jaipur Blue Pottery Decorative Wall Plate (10 Inch)',
    quantity: 1,
    unit_price_inr: 1250,
    total_amount: 1250,
    total_price_inr: 1250,
    status: 'pending',
    shipping_address: '14B Lake Temple Road, Southern Avenue, Kolkata, West Bengal - 700029',
    city: 'Kolkata',
    payment_mode: 'ONDC BharatQR Prepaid Escrow',
    notes: 'Gift order for anniversary. Include artisan origin certificate.',
    beckn_context: {
      domain: 'nic2004:52110',
      action: 'on_confirm',
      core_version: '1.2.0',
      bap_id: 'pincode.phonepe.com',
      bpp_id: 'shilp-setu.artisan.in',
      transaction_id: 'tx-ondc-773190',
      message_id: 'msg-ondc-119284',
      timestamp: new Date().toISOString(),
    },
  },
  {
    order_id: 'ONDC-BECKN-2026-61028',
    buyer_name: 'Meenakshi Sundaram (Chennai)',
    channel: 'ONDC Network (Mystore Buyer App)',
    order_type: 'ondc',
    item_title: 'Handwoven Chanderi Silk-Cotton Zari Border Stole',
    quantity: 1,
    unit_price_inr: 1850,
    total_amount: 1850,
    total_price_inr: 1850,
    status: 'pending',
    shipping_address: '22 Kasturi Ranga Road, Alwarpet, Chennai, Tamil Nadu - 600018',
    city: 'Chennai',
    payment_mode: 'ONDC Escrow RSP Prepaid',
    notes: 'Standard priority express dispatch requested.',
    beckn_context: {
      domain: 'nic2004:52110',
      action: 'on_confirm',
      core_version: '1.2.0',
      bap_id: 'buyer.mystore.in',
      bpp_id: 'shilp-setu.artisan.in',
      transaction_id: 'tx-ondc-330192',
      message_id: 'msg-ondc-559124',
      timestamp: new Date().toISOString(),
    },
  },
];

export const MOCK_GEM_PAYLOADS = [
  {
    order_id: 'GEM-PO-2026-9938102',
    buyer_name: 'Ministry of Textiles (Office of DC Handlooms)',
    channel: 'GeM Institutional PO',
    order_type: 'gem',
    item_title: 'Handwoven Chanderi Silk-Cotton Zari Border Stole',
    quantity: 35,
    unit_price_inr: 1150,
    total_amount: 40250,
    total_price_inr: 40250,
    status: 'pending',
    shipping_address: 'Room 312, Udyog Bhawan, Rafi Marg, New Delhi - 110011',
    city: 'New Delhi',
    payment_mode: 'GeM PFMS Verified Institutional Escrow (Auto-settlement on Dispatch)',
    notes: 'Official institutional gift procurement for National Handloom Conclave 2026.',
    gem_contract: {
      contract_number: 'GEMC-5116877209',
      buyer_dept: 'Ministry of Textiles',
      consignee_code: 'DEL-MOT-001',
      hsn_code: '52085290',
      unspsc_code: '53102504',
      escrow_provider: 'PFMS Govt Treasury',
      msme_verified: true,
    },
  },
  {
    order_id: 'GEM-PO-2026-7718290',
    buyer_name: 'TRIFED - Tribal Co-operative Marketing Federation',
    channel: 'GeM Institutional PO',
    order_type: 'gem',
    item_title: 'GI-Certified Jaipur Blue Pottery Decorative Wall Plate (10 Inch)',
    quantity: 40,
    unit_price_inr: 780,
    total_amount: 31200,
    total_price_inr: 31200,
    status: 'pending',
    shipping_address: 'TRIFED Central Warehouse, Sector 62, Noida, Uttar Pradesh - 201309',
    city: 'Noida',
    payment_mode: 'GeM PFMS Verified Institutional Escrow (Auto-settlement on Dispatch)',
    notes: 'State emporium consignment batch under Aatmanirbhar Bharat Artisan Scheme.',
    gem_contract: {
      contract_number: 'GEMC-8891277341',
      buyer_dept: 'TRIFED India',
      consignee_code: 'UP-TRIFED-04',
      hsn_code: '69139000',
      unspsc_code: '60121001',
      escrow_provider: 'PFMS Govt Treasury',
      msme_verified: true,
    },
  },
  {
    order_id: 'GEM-PO-2026-5529188',
    buyer_name: 'Ministry of Tourism & Culture (Govt. of India)',
    channel: 'GeM Institutional PO',
    order_type: 'gem',
    item_title: 'Handcrafted Terracotta Earthen Pitcher (Surahi)',
    quantity: 60,
    unit_price_inr: 260,
    total_amount: 15600,
    total_price_inr: 15600,
    status: 'pending',
    shipping_address: 'Central State Guest House, Chanakyapuri, New Delhi - 110021',
    city: 'New Delhi',
    payment_mode: 'GeM PFMS Verified Institutional Escrow (Auto-settlement on Dispatch)',
    notes: 'Eco-friendly water coolers for delegates at International Heritage Tourism Expo.',
    gem_contract: {
      contract_number: 'GEMC-3301988276',
      buyer_dept: 'Ministry of Tourism',
      consignee_code: 'DEL-MOT-002',
      hsn_code: '69120010',
      unspsc_code: '60121002',
      escrow_provider: 'PFMS Govt Treasury',
      msme_verified: true,
    },
  },
];

export default function WebhookSimulator({ onSimulateOrder, isSimulating = false }) {
  const { language } = useLanguage();
  const [lastPayload, setLastPayload] = useState(null);
  const [showInspector, setShowInspector] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ondcIndex, setOndcIndex] = useState(0);
  const [gemIndex, setGemIndex] = useState(0);

  const handleSimulateOndc = () => {
    const template = MOCK_ONDC_PAYLOADS[ondcIndex % MOCK_ONDC_PAYLOADS.length];
    setOndcIndex((prev) => prev + 1);

    const generatedOrder = {
      ...template,
      id: `ondc-sim-${Date.now()}`,
      order_id: `ONDC-BECKN-${Date.now().toString().slice(-5)}`,
      created_at: new Date().toISOString(),
    };

    setLastPayload({
      protocol: 'ONDC Beckn Protocol v1.2.0',
      type: 'Retail Buyer Webhook (on_confirm)',
      payload: generatedOrder,
    });

    if (onSimulateOrder) {
      onSimulateOrder(generatedOrder, 'ondc');
    }
  };

  const handleSimulateGem = () => {
    const template = MOCK_GEM_PAYLOADS[gemIndex % MOCK_GEM_PAYLOADS.length];
    setGemIndex((prev) => prev + 1);

    const generatedOrder = {
      ...template,
      id: `gem-sim-${Date.now()}`,
      order_id: `GEM-PO-2026-${Date.now().toString().slice(-5)}`,
      created_at: new Date().toISOString(),
    };

    setLastPayload({
      protocol: 'Government e-Marketplace (GeM 4.0)',
      type: 'Institutional Bulk Purchase Order (PFMS Escrow)',
      payload: generatedOrder,
    });

    if (onSimulateOrder) {
      onSimulateOrder(generatedOrder, 'gem');
    }
  };

  const handleCopyJson = () => {
    if (!lastPayload) return;
    navigator.clipboard.writeText(JSON.stringify(lastPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const isHindi = language === 'hi';

  return (
    <div className="w-full bg-gradient-to-r from-[#1b1411] via-[#241a16] to-[#1b1411] border border-[#ff9062]/30 rounded-3xl p-5 shadow-xl text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title & Live Status */}
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#ff9062]/20 text-[#ff9062] flex items-center justify-center shrink-0 border border-[#ff9062]/30">
            <span className="material-symbols-outlined text-[24px]">sensors</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-[#ff9062]/20 text-[#ff9062] font-mono text-[10px] font-bold tracking-wider uppercase border border-[#ff9062]/40">
                SIH 2026 Live Protocol Testbed
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {isHindi ? 'वेबहुक गेटवे सक्रिय' : 'Webhook Gateway Active'}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
              {isHindi
                ? 'ONDC एवं GeM लाइव वेबहुक सिमुलेटर'
                : 'ONDC & GeM Live Webhook Simulator'}
            </h3>
            <p className="text-xs text-stone-300 mt-0.5 max-w-xl">
              {isHindi
                ? 'जज डेमो हेतु: ONDC रिटेल खरीदार या GeM सरकारी थोक खरीद ऑर्डर तुरंत ट्रिगर करें।'
                : 'Judge Demo: Trigger incoming Beckn protocol retail webhooks or GeM institutional bulk tenders.'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* ONDC Simulation Button */}
          <button
            type="button"
            disabled={isSimulating}
            onClick={handleSimulateOndc}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">bolt</span>
            <div className="text-left leading-tight">
              <span className="block font-bold">
                {isHindi ? '⚡ ONDC रिटेल ऑर्डर सिमुलेट करें' : '⚡ Simulate ONDC Order'}
              </span>
              <span className="text-[10px] text-white/80 font-normal">
                Beckn Protocol (Paytm / Mystore)
              </span>
            </div>
          </button>

          {/* GeM Bulk Tender Simulation Button */}
          <button
            type="button"
            disabled={isSimulating}
            onClick={handleSimulateGem}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">account_balance</span>
            <div className="text-left leading-tight">
              <span className="block font-bold">
                {isHindi ? '🏛️ GeM सरकारी थोक ऑर्डर' : '🏛️ Simulate GeM B2B PO'}
              </span>
              <span className="text-[10px] text-white/80 font-normal">
                Ministry Bulk Tender (PFMS Escrow)
              </span>
            </div>
          </button>

          {/* Inspect Payload Toggle */}
          {lastPayload && (
            <button
              type="button"
              onClick={() => setShowInspector((prev) => !prev)}
              className="inline-flex items-center gap-1 px-3 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all cursor-pointer"
              title="Inspect Beckn/GeM JSON Payload"
            >
              <span className="material-symbols-outlined text-[16px]">data_object</span>
              <span>{showInspector ? (isHindi ? 'छिपाएं' : 'Hide JSON') : (isHindi ? 'पेलोड देखें' : 'Inspect JSON')}</span>
            </button>
          )}
        </div>
      </div>

      {/* JSON Payload Inspector Drawer */}
      {showInspector && lastPayload && (
        <div className="mt-4 pt-4 border-t border-white/10 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-2 text-xs text-stone-300">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-[#ff9062] font-bold">
                {lastPayload.protocol}
              </span>
              <span>•</span>
              <span className="text-stone-400">{lastPayload.type}</span>
            </div>
            <button
              type="button"
              onClick={handleCopyJson}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white font-mono flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">
                {copied ? 'check' : 'content_copy'}
              </span>
              <span>{copied ? (isHindi ? 'कॉपी हो गया' : 'Copied!') : (isHindi ? 'कॉपी JSON' : 'Copy JSON')}</span>
            </button>
          </div>
          <pre className="p-3.5 bg-[#120c0a] border border-white/10 rounded-2xl text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-60 scrollbar-thin">
            {JSON.stringify(lastPayload.payload, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
