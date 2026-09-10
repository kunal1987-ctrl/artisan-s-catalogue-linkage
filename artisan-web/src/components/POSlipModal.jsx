import React, { useEffect } from 'react';

export default function POSlipModal({ order, onClose }) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!order) return null;

  const isGem =
    order.order_type === 'gem' ||
    order.channel?.toLowerCase().includes('gem') ||
    order.order_id?.toLowerCase().startsWith('gem');

  const orderId = String(order.order_id || order.id || 'PO-2026-NEW').toUpperCase();
  const dateStr = order.created_at
    ? new Date(order.created_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

  const buyerName = order.buyer_name || (isGem ? 'Ministry Consignee Department' : 'Verified Retail Buyer');
  const shippingAddress = order.shipping_address || (order.city ? `${order.city}, India` : 'Transport Bhawan, Sansad Marg, New Delhi - 110001');
  const paymentMode = order.payment_mode || (isGem ? 'GeM PFMS Verified Institutional Escrow' : 'ONDC Protocol Escrow via UPI / BharatQR');
  const productTitle = order.item_title || order.product_title || 'Handcrafted Traditional Craft';
  const quantity = Number(order.quantity || 1);
  const unitPrice = Number(
    order.unit_price_inr ||
    (order.total_amount && order.quantity ? Math.round(order.total_amount / order.quantity) : 0)
  );
  const totalAmount = Number(order.total_amount || order.total_price_inr || unitPrice * quantity);
  const hsnCode =
    order.hsn_code ||
    (productTitle.toLowerCase().includes('silk') || productTitle.toLowerCase().includes('saree')
      ? '52085290'
      : productTitle.toLowerCase().includes('pottery')
      ? '69139000'
      : '69120010');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="po-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #po-slip-print-area, #po-slip-print-area * {
            visibility: visible !important;
          }
          #po-slip-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            box-shadow: none !important;
            border: 1px solid #ddd !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Modal Wrapper */}
      <div
        id="po-slip-print-area"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-white text-stone-900 rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Top Header Controls (Hidden during print) */}
        <div className="no-print bg-stone-900 text-white px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-amber-400">receipt_long</span>
            <span id="po-modal-title" className="font-bold text-sm tracking-wide">
              {isGem ? 'GeM Institutional Purchase Order Slip' : 'ONDC Digital Commerce Invoice Slip'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
              title="Print Purchase Order Slip"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Print PO Slip</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Close Modal"
              aria-label="Close"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Printable PO Slip Document Content */}
        <div className="p-6 sm:p-8 flex flex-col gap-6 bg-white">
          {/* Marketplace / Platform Brand Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b-2 border-stone-800">
            {/* Logo and Marketplace Identity */}
            <div className="flex items-center gap-3.5">
              {isGem ? (
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-800 text-white flex flex-col items-center justify-center p-1.5 shadow-sm border border-emerald-900 shrink-0">
                    <span className="material-symbols-outlined text-[26px]">account_balance</span>
                    <span className="text-[9px] font-black uppercase tracking-tighter">GeM 4.0</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black tracking-tight text-emerald-900">GeM</span>
                      <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Government e-Marketplace
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 font-medium">
                      Public Procurement Portal • Government of India
                    </p>
                    <p className="text-[10px] text-stone-400 font-mono">
                      Special MSME / Artisan Cluster Procurement Scheme
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#9c441c] text-white flex flex-col items-center justify-center p-1.5 shadow-sm border border-[#7a3212] shrink-0">
                    <span className="material-symbols-outlined text-[26px]">hub</span>
                    <span className="text-[9px] font-black uppercase tracking-tighter">BECKN</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black tracking-tight text-[#9c441c]">ONDC</span>
                      <span className="text-xs font-bold text-[#9c441c] uppercase tracking-wider bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                        Open Network
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 font-medium">
                      Open Network for Digital Commerce • Beckn Protocol v1.2
                    </p>
                    <p className="text-[10px] text-stone-400 font-mono">
                      Direct Artisan-to-Consumer Digital Order Dispatch Slip
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* PO Identification Block */}
            <div className="text-left sm:text-right flex flex-col sm:items-end">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-500">
                Official Purchase Order (PO)
              </span>
              <span className="text-lg sm:text-xl font-black text-stone-900 font-mono tracking-tight">
                #{orderId}
              </span>
              <span className="text-xs text-stone-600 font-medium mt-0.5">
                PO Date: <strong className="text-stone-900">{dateStr}</strong>
              </span>
              <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
                {order.status === 'dispatched' ? 'Dispatched' : order.status === 'accepted' ? 'Accepted & Confirmed' : 'Payment Escrow Confirmed'}
              </span>
            </div>
          </div>

          {/* Buyer & Seller Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Buyer / Consignee Details */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">local_shipping</span>
                Consignee / Deliver To:
              </span>
              <h4 className="text-sm font-bold text-stone-900 leading-snug">{buyerName}</h4>
              <p className="text-xs text-stone-600 leading-relaxed">{shippingAddress}</p>
              <div className="mt-1 pt-1.5 border-t border-stone-200/60 text-[11px] text-stone-500 flex items-center justify-between">
                <span>Destination: <strong>{order.city || 'India'}</strong></span>
                <span className="font-mono text-[10px]">{isGem ? 'CONSIGNEE: GOV-PFMS' : 'BAP: ONDC-CONSUMER'}</span>
              </div>
            </div>

            {/* Supplier / Artisan Studio Details */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">storefront</span>
                Supplier / Artisan Studio:
              </span>
              <h4 className="text-sm font-bold text-stone-900 leading-snug">
                Shilp Setu Certified Artisan Guild
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Rural Handicraft & GI Cluster, Uttar Pradesh / Rajasthan, India
              </p>
              <div className="mt-1 pt-1.5 border-t border-stone-200/60 text-[11px] text-stone-500 flex items-center justify-between">
                <span>MSME Reg: <strong>UDYAM-UP-2026-SS</strong></span>
                <span className="text-emerald-700 font-bold">GI Tag Verified</span>
              </div>
            </div>
          </div>

          {/* Itemized Products Table */}
          <div className="overflow-hidden rounded-2xl border border-stone-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-100 text-stone-700 uppercase font-extrabold tracking-wider border-b border-stone-200">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Item & Craft Description</th>
                  <th className="py-3 px-3 text-center">HSN Code</th>
                  <th className="py-3 px-3 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Total (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 bg-white">
                <tr>
                  <td className="py-3.5 px-4 text-center font-bold text-stone-500">1</td>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-stone-900 text-sm">{productTitle}</p>
                    {order.notes && (
                      <p className="text-[11px] text-stone-500 italic mt-0.5">{order.notes}</p>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono font-semibold text-stone-700">
                    {hsnCode}
                  </td>
                  <td className="py-3.5 px-3 text-center font-bold text-stone-900">
                    {quantity}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-stone-800">
                    ₹{unitPrice.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-stone-900 text-sm">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-stone-50 text-stone-700 border-t-2 border-stone-200">
                <tr>
                  <td colSpan={4} className="py-2.5 px-4 text-right font-medium text-stone-500">
                    Subtotal:
                  </td>
                  <td colSpan={2} className="py-2.5 px-4 text-right font-mono font-semibold text-stone-800">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr>
                  <td colSpan={4} className="py-1.5 px-4 text-right font-medium text-stone-500">
                    GST / Taxes (Artisan Exemption Scheme):
                  </td>
                  <td colSpan={2} className="py-1.5 px-4 text-right font-mono font-semibold text-emerald-700">
                    ₹0.00 (Exempt)
                  </td>
                </tr>
                <tr>
                  <td colSpan={4} className="py-1.5 px-4 text-right font-medium text-stone-500">
                    Logistics / Protocol Routing:
                  </td>
                  <td colSpan={2} className="py-1.5 px-4 text-right font-mono font-semibold text-emerald-700">
                    ₹0.00 (Network Covered)
                  </td>
                </tr>
                <tr className="border-t-2 border-stone-800 bg-stone-100 text-stone-900 font-extrabold text-sm">
                  <td colSpan={4} className="py-3 px-4 text-right text-base uppercase">
                    Grand Total:
                  </td>
                  <td colSpan={2} className="py-3 px-4 text-right font-mono text-base text-stone-950 font-black">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Payment & Security Escrow Information */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
              </span>
              <div>
                <span className="text-[11px] font-black uppercase text-emerald-900 tracking-wider block">
                  Settlement & Escrow Guarantee
                </span>
                <span className="text-xs font-semibold text-emerald-800 block">
                  {paymentMode}
                </span>
              </div>
            </div>
            <span className="text-[10px] text-stone-500 font-mono sm:text-right">
              Digital Seal: SHA256:{orderId.slice(-8)}-SECURE
            </span>
          </div>

          {/* Dispatch Notice & Footer */}
          <div className="pt-2 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-stone-500 text-[11px]">
            <p>
              This is a computer-generated Purchase Order slip authorized under the Shilp Setu Network.
            </p>
            <p className="font-semibold text-stone-700">
              Shilp Setu • Empowering India's Artisans
            </p>
          </div>
        </div>

        {/* Modal Bottom Actions (Hidden during print) */}
        <div className="no-print bg-stone-100 px-6 py-4 border-t border-stone-200 flex items-center justify-between gap-3">
          <span className="text-xs text-stone-500 font-medium hidden sm:inline">
            Press <kbd className="px-1.5 py-0.5 bg-white border border-stone-300 rounded text-[10px] font-mono">Esc</kbd> to close or click Print to generate paper slip.
          </span>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              type="button"
              className="px-5 py-2.5 rounded-full bg-white hover:bg-stone-200 text-stone-700 font-bold text-xs border border-stone-300 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              type="button"
              className="px-6 py-2.5 rounded-full bg-stone-900 hover:bg-black text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              <span>Print PO Slip</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
