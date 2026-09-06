import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Orders() {
  const navigate = useNavigate();

  return (
    <div className="w-full">
      <main className="flex-1 w-full bg-background min-h-screen p-4 sm:p-6 lg:p-10 flex flex-col gap-6">

        <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">

            {/* Top Bar Navigation */}
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-border-delicate/60">
                <div className="flex items-center gap-3">
                    <button aria-label="Go back to Home"
                        className="min-w-[48px] min-h-[48px] w-[48px] h-[48px] rounded-full bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors"
                        type="button" onClick={() => navigate('/home')}>
                        <span className="material-symbols-outlined text-[24px]">arrow_back</span>
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-secondary tracking-wider uppercase">Order Processing</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                            <span className="text-xs text-outline font-medium">ONDC Network Live</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-espresso-deep tracking-tight">
                            आर्डर इनबॉक्स (New Orders)
                        </h1>
                    </div>
                </div>

                {/* Filter and Actions */}
                <div className="flex items-center gap-2.5">
                    <button aria-label="Filter Orders"
                        className="min-h-[44px] px-3 sm:px-4 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface font-bold text-xs flex items-center gap-2 border border-border-delicate/80 transition-colors"
                        type="button">
                        <span className="material-symbols-outlined text-[18px] text-secondary">tune</span>
                        <span className="hidden sm:inline">Filter</span>
                    </button>
                    <button aria-label="Refresh Orders"
                        className="min-w-[44px] min-h-[44px] w-[44px] h-[44px] rounded-full bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors"
                        type="button">
                        <span className="material-symbols-outlined text-[20px]">refresh</span>
                    </button>
                </div>
            </div>

            {/* Quick Status / Voice Banner */}
            <section aria-label="Status notice"
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-tertiary-fixed/30 border border-tertiary-fixed/80 rounded-3xl p-4 sm:p-5">
                <div className="flex items-center gap-3.5">
                    <div
                        className="w-12 h-12 rounded-2xl bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed shrink-0 shadow-sm">
                        <span className="material-symbols-outlined text-[26px]">notifications_active</span>
                    </div>
                    <div className="flex flex-col">
                        <p className="text-sm lg:text-base text-on-tertiary-fixed font-bold leading-snug">
                            3 नए आर्डर तैयार हैं! (3 New Orders Ready)
                        </p>
                        <p className="text-xs lg:text-sm text-on-tertiary-fixed-variant leading-tight">
                            Tap 'Accept & Pack' to dispatch today before courier pickup.
                        </p>
                    </div>
                </div>
                
                <button aria-label="बोलकर सुनें - Listen to Hindi instructions"
                    className="min-w-[48px] min-h-[48px] w-[48px] h-[48px] rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 active:scale-90 hover:scale-105 transition-all shadow-md"
                    id="voice-listen-btn" type="button">
                    <span className="material-symbols-outlined text-[24px]">volume_up</span>
                </button>
            </section>

            {/* Orders Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6" id="orders-list">

                {/* Order 1: KS-8921 */}
                <article
                    className="order-card bg-surface-container-lowest rounded-3xl p-5 shadow-sm border border-border-delicate flex flex-col justify-between gap-4 transition-all duration-500 hover:shadow-md"
                    id="order-ks-8921">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-bold text-on-surface">#KS-8921</span>
                                    <span className="text-on-surface-variant">•</span>
                                    <span className="text-xs text-on-surface-variant">10m ago</span>
                                </div>
                                <span className="text-xs text-secondary font-bold">Requires accept today</span>
                            </div>
                            
                            <span
                                className="inline-flex items-center gap-1 bg-surface-container-high text-primary text-xs px-3 py-1.5 rounded-full font-bold">
                                <span className="material-symbols-outlined text-[16px] text-primary"
                                    style={{ fontVariationSettings: '\'FILL\' 1' }}>hub</span>
                                ONDC via Mystore
                            </span>
                        </div>

                        <div className="flex items-center gap-3.5 bg-surface-container-low p-3.5 rounded-2xl">
                            <img className="w-[76px] h-[76px] rounded-xl object-cover shrink-0 shadow-sm"
                                alt="Handwoven Blue Pure Silk Saree" height="76"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAhQyBCcHXxppvzIjiac0wXbDfq62WaB0pTHDam0UqgMIt80v8bTscpCYepAYhHzwyqdSDVwKBNGDU9Lh-0pgmb6R_Xsdf2mYuyI5v7xHSnUvaB5oyD0DKaxQR9MG1xRqs4oJnxr4fOtRfF0qz1JxSpe60gPE0oIJiv6Qr1AYzi90D-zTBtf49gaWbwbab-kE-5l2lN0FBHVhzoCrgX4nfYwPD_5qcNZV6HV33lWUnDsCVeVxBWDZ5M"
                                width="76" />
                            <div className="flex flex-col flex-1 min-w-0">
                                <h2 className="text-sm font-bold text-on-surface truncate">Handwoven Blue Pure Silk Saree</h2>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-on-surface-variant font-medium">Qty: 1 Unit</span>
                                    <span className="text-xs text-on-surface-variant">•</span>
                                    <span className="text-base font-extrabold text-on-surface">₹1,200</span>
                                </div>
                                <span className="inline-flex items-center gap-1 text-[#1A3824] text-xs font-bold mt-1">
                                    <span className="material-symbols-outlined text-[16px] text-[#25D366]"
                                        style={{ fontVariationSettings: '\'FILL\' 1' }}>check_circle</span>
                                    Paid Online • भुगतान हुआ
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 px-1 text-on-surface-variant text-xs">
                            <span className="material-symbols-outlined text-[20px] text-on-surface-variant shrink-0">local_shipping</span>
                            <p className="truncate">Ship to: <strong className="text-on-surface">Lucknow, UP</strong> (ONDC Pickup Agent)</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-2 border-t border-border-delicate/40">
                        <button aria-label="Accept and pack order KS-8921"
                            className="action-btn w-full min-h-[52px] h-[52px] rounded-full bg-primary-container hover:bg-black text-on-primary text-sm font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
                            type="button" onClick={() => navigate('/success')}>
                            <span className="material-symbols-outlined text-[22px]">inventory_2</span>
                            <span>Accept & Pack • स्वीकारें</span>
                        </button>
                        <div className="flex items-center justify-between px-1">
                            <button aria-label="Download or view packaging slip"
                                className="min-h-[48px] h-[48px] px-3 rounded-full text-secondary hover:text-primary font-bold text-xs flex items-center gap-1.5 active:bg-surface-container transition-colors cursor-pointer"
                                type="button" onClick={() => navigate('/success')}>
                                <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                                View Slip • पर्ची देखें
                            </button>
                            <span className="text-[11px] text-outline font-medium">Auto-dispatch enabled</span>
                        </div>
                    </div>
                </article>

                {/* Order 2: KS-8919 */}
                <article
                    className="order-card bg-surface-container-lowest rounded-3xl p-5 shadow-sm border border-border-delicate flex flex-col justify-between gap-4 transition-all duration-500 hover:shadow-md"
                    id="order-ks-8919">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-bold text-on-surface">#KS-8919</span>
                                    <span className="text-on-surface-variant">•</span>
                                    <span className="text-xs text-on-surface-variant">35m ago</span>
                                </div>
                                <span className="text-xs text-[#752801] font-bold">Direct Customer • 0% Fee</span>
                            </div>
                            
                            <span
                                className="inline-flex items-center gap-1 bg-[#25D366]/15 text-[#1A3824] text-xs px-3 py-1.5 rounded-full font-bold">
                                <span className="material-symbols-outlined text-[16px] text-[#25D366]"
                                    style={{ fontVariationSettings: '\'FILL\' 1' }}>chat</span>
                                WhatsApp Direct
                            </span>
                        </div>

                        <div className="flex items-center gap-3.5 bg-surface-container-low p-3.5 rounded-2xl">
                            <img className="w-[76px] h-[76px] rounded-xl object-cover shrink-0 shadow-sm"
                                alt="Handcrafted Brass Puja Diya" height="76"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuADLHGnD6b5Mm5Kw6N6ujayRO4j8q3V_3lPPR6jofXW8d6UpwFr5ROvLMj56XzD8ReYxRehGbr2PQeYAe6ypCJ_6nk1eBFMY6s0aQREkKO7tE1mFg6EQzsJ3_1CuY__0M3Cc_R3gDrtdl2831xaH86wDkZt_ZPSSo_gI8oiNrmjWotyxr4Lt_om_Uin7S3GW-j2bvNEcaYqzwKGYuGrvgbXyF_Mr0htSeCB1AhU9_zyueMDCUW5wsWP"
                                width="76" />
                            <div className="flex flex-col flex-1 min-w-0">
                                <h2 className="text-sm font-bold text-on-surface truncate">Handcrafted Brass Puja Diya</h2>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-on-surface-variant font-medium">Qty: 2 Units</span>
                                    <span className="text-xs text-on-surface-variant">•</span>
                                    <span className="text-base font-extrabold text-on-surface">₹900</span>
                                </div>
                                <span className="inline-flex items-center gap-1 text-secondary text-xs font-bold mt-1">
                                    <span className="material-symbols-outlined text-[16px]">payments</span>
                                    Cash on Delivery (COD)
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between bg-surface-container p-2.5 rounded-2xl border border-border-delicate/40">
                            <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                                <span className="material-symbols-outlined text-secondary text-[22px] shrink-0"
                                    style={{ fontVariationSettings: '\'FILL\' 1' }}>graphic_eq</span>
                                <p className="text-xs text-on-surface truncate italic font-medium">"Please pack safely for Diwali"</p>
                            </div>
                            <button aria-label="Play buyer voice message"
                                className="min-h-[48px] h-[48px] px-3.5 rounded-full bg-surface-container-highest hover:bg-border-delicate text-on-surface text-xs font-bold flex items-center gap-1 active:scale-95 transition-all shrink-0 cursor-pointer"
                                type="button">
                                <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                                0:12
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-2 border-t border-border-delicate/40">
                        <button aria-label="Accept and pack order KS-8919"
                            className="action-btn w-full min-h-[52px] h-[52px] rounded-full bg-primary-container hover:bg-black text-on-primary text-sm font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
                            type="button" onClick={() => navigate('/success')}>
                            <span className="material-symbols-outlined text-[22px]">inventory_2</span>
                            <span>Accept & Pack • स्वीकारें</span>
                        </button>
                        
                        <a aria-label="Message Buyer on WhatsApp"
                            className="w-full min-h-[48px] h-[48px] rounded-full bg-[#25D366] hover:bg-emerald-600 text-white font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all text-xs"
                            href="https://wa.me/" rel="noopener noreferrer" target="_blank">
                            <span className="material-symbols-outlined text-[20px]"
                                style={{ fontVariationSettings: '\'FILL\' 1' }}>chat</span>
                            <span>Message Buyer • ग्राहक को मैसेज करें</span>
                        </a>
                    </div>
                </article>

                {/* Order 3: KS-8915 */}
                <article
                    className="order-card bg-surface-container-lowest rounded-3xl p-5 shadow-sm border border-border-delicate flex flex-col justify-between gap-4 transition-all duration-500 hover:shadow-md"
                    id="order-ks-8915">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-bold text-on-surface">#KS-8915</span>
                                    <span className="text-on-surface-variant">•</span>
                                    <span className="text-xs text-on-surface-variant">2 hours ago</span>
                                </div>
                                <span className="text-xs text-on-surface-variant">ONDC Pickup Agent</span>
                            </div>
                            
                            <span
                                className="inline-flex items-center gap-1 bg-surface-container-high text-primary text-xs px-3 py-1.5 rounded-full font-bold">
                                <span className="material-symbols-outlined text-[16px] text-primary"
                                    style={{ fontVariationSettings: '\'FILL\' 1' }}>storefront</span>
                                ONDC via Paytm
                            </span>
                        </div>

                        <div className="flex items-center gap-3.5 bg-surface-container-low p-3.5 rounded-2xl">
                            <img className="w-[76px] h-[76px] rounded-xl object-cover shrink-0 shadow-sm"
                                alt="Handmade Terracotta Pitcher" height="76"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBIV_cz3e1s9PecVuCoGvMdgmVr148ixCtI8BtKEU7mdqCNcwrLRU5CKHEU1i-wQ7J1_mMLxTz_WcLs43UwJEptHZiuftIiXk1bgpQcNFt1oZ3J5vgnuoOACpsBbWUMbgpyeZRA9ILNCkINyizTmNUDUwDz_oksdIc_GVmWmnA0ofIdZuVjYVeygDD9wIglXqPy1XQ4eM48-E2szZRpH5-1rZ0Upwzn8d6POJGUKlaFuHz19Yi2WFd1"
                                width="76" />
                            <div className="flex flex-col flex-1 min-w-0">
                                <h2 className="text-sm font-bold text-on-surface truncate">Handmade Terracotta Pitcher</h2>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-on-surface-variant font-medium">Qty: 1 Unit</span>
                                    <span className="text-xs text-on-surface-variant">•</span>
                                    <span className="text-base font-extrabold text-on-surface">₹200</span>
                                </div>
                                <span className="inline-flex items-center gap-1 text-[#1A3824] text-xs font-bold mt-1">
                                    <span className="material-symbols-outlined text-[16px] text-[#25D366]"
                                        style={{ fontVariationSettings: '\'FILL\' 1' }}>check_circle</span>
                                    Paid Online • प्रीपेड
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 px-1 text-on-surface-variant text-xs">
                            <span className="material-symbols-outlined text-[20px] text-on-surface-variant shrink-0">location_on</span>
                            <p className="truncate">Ship to: <strong className="text-on-surface">Varanasi, UP</strong></p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-2 border-t border-border-delicate/40">
                        <button aria-label="Accept and pack order KS-8915"
                            className="action-btn w-full min-h-[52px] h-[52px] rounded-full bg-primary-container hover:bg-black text-on-primary text-sm font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
                            type="button" onClick={() => navigate('/success')}>
                            <span className="material-symbols-outlined text-[22px]">inventory_2</span>
                            <span>Accept & Pack • स्वीकारें</span>
                        </button>
                        <div className="flex items-center justify-between px-1">
                            <button aria-label="Download or view packaging slip"
                                className="min-h-[48px] h-[48px] px-3 rounded-full text-secondary hover:text-primary font-bold text-xs flex items-center gap-1.5 active:bg-surface-container transition-colors cursor-pointer"
                                type="button" onClick={() => navigate('/success')}>
                                <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                                View Slip • पर्ची देखें
                            </button>
                            <span className="text-[11px] text-outline font-medium">Standard Logistics</span>
                        </div>
                    </div>
                </article>

            </div>

            {/* Bottom Info Banner */}
            <div className="text-center py-6 flex flex-col items-center justify-center gap-1.5 text-on-surface-variant border-t border-border-delicate/40 mt-4">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[24px]">verified</span>
                    <p className="text-xs font-bold text-on-surface">100% Guaranteed Payouts via ONDC Settlements</p>
                </div>
                <p className="text-[11px] text-outline">सभी लेन-देन भारत सरकार द्वारा मान्यता प्राप्त ONDC नेटवर्क के तहत सुरक्षित हैं</p>
            </div>

        </div>
      </main>
    </div>
  );
}
