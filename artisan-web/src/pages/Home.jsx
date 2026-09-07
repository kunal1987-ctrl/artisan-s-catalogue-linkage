import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const navigate = useNavigate();
  const { language, toggleLanguage, toggleNotifications, unreadCount } = useAuth();

  return (
    <div className="w-full">
      <main className="flex-1 flex flex-col relative w-full min-h-screen bg-[#fdf9f3] overflow-y-auto">
        <div className="flex flex-col w-full px-gutter-mobile pb-space-lg">
            <header
                className="sticky top-0 z-30 bg-[#fdf9f3]/90 backdrop-blur-xl border-b border-[#d1c4bd]/40 px-8 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <div
                            className="flex items-center gap-2 text-[12px] font-semibold text-secondary uppercase tracking-wider">
                            <span>{language === 'hi' ? 'आवास' : 'Home'}</span>
                            <span>/</span>
                            <span>{language === 'hi' ? 'शिल्पकार डैशबोर्ड' : 'Artisan Dashboard'}</span>
                        </div>
                        <h2 className="text-[24px] font-bold text-primary flex items-center gap-2">
                            {language === 'hi' ? 'नमस्ते, रामेश!' : 'Namaste, Ramesh!'}
                            <span className="text-[14px] font-medium text-on-surface-variant font-normal">कला संगम शॉप</span>
                        </h2>
                    </div>
                    <span
                        className="text-[12px] font-semibold text-[#50443d] bg-[#ebe8e2] px-3 py-1 rounded-full inline-flex items-center gap-1.5 border border-[#d1c4bd]/40">
                        <span className="material-symbols-outlined text-[15px] text-green-700">check_circle</span>
                        <span>{language === 'hi' ? 'ऑफ़लाइन सुरक्षित' : 'Saved Offline'}</span>
                    </span>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative w-80">
                        <span
                            className="material-symbols-outlined absolute left-3.5 top-2.5 text-[19px] text-[#80756f]">search</span>
                        <input
                            className="w-full pl-10 pr-10 py-2 rounded-full bg-[#f1ede7] border border-[#d1c4bd]/60 text-[13px] text-primary placeholder-[#80756f] focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-all"
                            placeholder={language === 'hi' ? 'शिल्प खोजें या बोलकर बताएं...' : 'Search crafts or speak item name...'} type="text" />
                        <button aria-label="Voice search"
                            className="absolute right-2.5 top-1.5 w-7 h-7 rounded-full bg-[#e6e2dc] text-primary flex items-center justify-center hover:bg-[#d4c3ba] transition-colors cursor-pointer"
                            type="button">
                            <span className="material-symbols-outlined text-[16px]">mic</span>
                        </button>
                    </div>
                    <button aria-label="Switch Language"
                        onClick={toggleLanguage}
                        className="min-h-[40px] px-3.5 py-1.5 rounded-full bg-[#f1ede7] border border-[#d1c4bd] text-primary font-bold text-[14px] flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform hover:bg-[#ebe8e2] cursor-pointer"
                        title={language === 'hi' ? 'Switch to English' : 'हिन्दी में बदलें'}
                        type="button">
                        <span className="material-symbols-outlined text-[16px] text-[#9c441c]">translate</span>
                        <span>{language === 'hi' ? 'अ (हिन्दी)' : 'A (English)'}</span>
                    </button>
                    <button aria-label="Notifications"
                        onClick={toggleNotifications}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-[#f1ede7] text-on-surface-variant hover:text-primary transition-colors border border-[#d1c4bd]/50 relative cursor-pointer active:scale-95"
                        title="Notifications"
                        type="button">
                        <span className="material-symbols-outlined text-[21px]">notifications</span>
                        {unreadCount > 0 && (
                          <span
                              className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#9c441c] ring-2 ring-[#fdf9f3] animate-pulse"></span>
                        )}
                    </button>
                </div>
            </header>
            <div className="px-8 py-6 flex flex-col gap-6 max-w-7xl mx-auto w-full">
                
                {/* Hero AI Studio Banner */}
                <div className="relative overflow-hidden rounded-2xl bg-[#2e241e] text-on-primary shadow-xl p-8">
                    <div
                        className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-[#9c441c]/20 blur-3xl pointer-events-none">
                    </div>
                    <div
                        className="absolute left-1/3 -bottom-16 w-72 h-72 rounded-full bg-[#f1be65]/15 blur-3xl pointer-events-none">
                    </div>
                    <div
                        className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex flex-col gap-2 max-w-2xl">
                            <div className="flex items-center gap-3">
                                <div
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#ffdeaa] backdrop-blur-md">
                                    <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                                    <span className="text-[11px] font-bold tracking-wider uppercase">Instant AI Cataloger</span>
                                </div>
                                <span className="text-[12px] text-[#ffdeaa] flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[15px]">translate</span> Hindi, Gujarati, Tamil +9 supported
                                </span>
                            </div>
                            <h3 className="text-[28px] font-bold text-white tracking-tight leading-tight mt-1">Add New Product & Instant Catalog Listing</h3>
                            <p className="text-[15px] text-[#e6e2dc] leading-relaxed">
                                Point your camera and speak naturally in your voice. Kala Sangam AI writes title, tags, description and suggests fair marketplace prices in seconds.
                            </p>
                            <div className="flex items-center gap-6 mt-2 text-[13px] text-[#d4c3ba]">
                                <span className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[18px] text-[#ffb599]">record_voice_over</span>
                                    Artisanal dialect transcription
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[18px] text-[#ffb599]">bolt</span> 10 second creation
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 shrink-0">
                            <button
                                onClick={() => navigate('/capture')}
                                className="px-7 py-4 rounded-full bg-white text-[#2e241e] font-bold text-[15px] flex items-center justify-center gap-3 shadow-lg hover:bg-[#f7f3ed] active:scale-95 transition-all cursor-pointer"
                                type="button"
                            >
                                <div className="w-9 h-9 rounded-full bg-[#2e241e] text-white flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                                </div>
                                <span>Start Camera & Voice Capture</span>
                                <span className="material-symbols-outlined text-[20px] text-[#9c441c]">arrow_forward</span>
                            </button>
                            <p className="text-center text-[12px] text-[#d4c3ba] font-medium flex items-center justify-center gap-1">
                                <span className="material-symbols-outlined text-[15px]">mic</span> Voice Ready: Speak into laptop or phone
                            </p>
                        </div>
                    </div>
                </div>
                
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-[#f7f3ed] border border-[#d1c4bd]/40 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <span className="w-10 h-10 rounded-xl bg-[#ebe8e2] flex items-center justify-center text-[#9c441c]">
                                <span className="material-symbols-outlined text-[22px]">storefront</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-[#9c441c] font-bold text-[12px] bg-[#ff9062]/15 px-2 py-0.5 rounded-full">
                                <span className="material-symbols-outlined text-[14px]">trending_up</span> +2 this wk
                            </span>
                        </div>
                        <div className="mt-4">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">Live Products</span>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-[32px] font-bold text-primary">12</span>
                                <span className="text-[14px] text-on-surface-variant font-medium">listed in shop</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-5 rounded-2xl bg-[#f7f3ed] border border-[#d1c4bd]/40 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <span className="w-10 h-10 rounded-xl bg-[#ebe8e2] flex items-center justify-center text-[#9c441c]">
                                <span className="material-symbols-outlined text-[22px]">visibility</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-[#9c441c] font-bold text-[12px] bg-[#ff9062]/15 px-2 py-0.5 rounded-full">
                                <span className="material-symbols-outlined text-[14px]">north_east</span> +18%
                            </span>
                        </div>
                        <div className="mt-4">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">Recent Views</span>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-[32px] font-bold text-primary">45</span>
                                <span className="text-[14px] text-on-surface-variant font-medium">shoppers reached</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-5 rounded-2xl bg-[#f7f3ed] border border-[#d1c4bd]/40 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <span className="w-10 h-10 rounded-xl bg-[#ebe8e2] flex items-center justify-center text-[#9c441c]">
                                <span className="material-symbols-outlined text-[22px]">insights</span>
                            </span>
                            <span className="text-[11px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Healthy</span>
                        </div>
                        <div className="mt-3 flex items-end justify-between">
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">Store Activity</span>
                                <span className="text-[14px] font-bold text-primary block mt-0.5">3 Inquiries Today</span>
                            </div>
                            <div className="flex items-end gap-1.5 h-8">
                                <div className="w-2.5 h-3 bg-[#d1c4bd] rounded-t"></div>
                                <div className="w-2.5 h-4 bg-[#d1c4bd] rounded-t"></div>
                                <div className="w-2.5 h-6 bg-[#9c441c] rounded-t"></div>
                                <div className="w-2.5 h-5 bg-[#d1c4bd] rounded-t"></div>
                                <div className="w-2.5 h-8 bg-[#2e241e] rounded-t"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-5 rounded-2xl bg-[#ff9062]/10 border border-[#ff9062]/30 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <span className="w-10 h-10 rounded-xl bg-[#ff9062]/20 flex items-center justify-center text-[#9c441c]">
                                <span className="material-symbols-outlined text-[22px]">notification_important</span>
                            </span>
                            <span className="text-[11px] font-bold uppercase text-[#9c441c] bg-white px-2 py-0.5 rounded-full shadow-sm">Attention</span>
                        </div>
                        <div className="mt-4">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9c441c] block">Inventory Alert</span>
                            <div className="flex items-baseline justify-between mt-1">
                                <span className="text-[22px] font-bold text-primary">1 Low Stock</span>
                                <span onClick={() => navigate('/catalog')} className="text-[12px] font-bold text-[#9c441c] hover:underline cursor-pointer">Restock Diya →</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Recent Uploads Section */}
                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-3">
                        <h3 className="text-[22px] font-bold text-primary">Recent Uploads</h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#ebe8e2] text-secondary font-bold text-[12px]">3 Active Crafts</span>
                        <span className="text-[13px] text-on-surface-variant">Ready to show international buyers</span>
                    </div>
                    <button
                        onClick={() => navigate('/catalog')}
                        className="text-[14px] text-secondary hover:text-primary font-bold flex items-center gap-1 transition-colors cursor-pointer bg-transparent border-0"
                        type="button"
                    >
                        <span>View All Catalog Items</span>
                        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                </div>
                
                {/* Product Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Item 1 */}
                    <div className="rounded-2xl bg-[#f7f3ed] border border-[#d1c4bd]/40 overflow-hidden shadow-sm flex flex-col group hover:shadow-md transition-all">
                        <div className="relative w-full aspect-[4/5] bg-[#ebe8e2] overflow-hidden">
                            <img alt="Blue Silk Saree"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBk9yCjVvfLitGlye3MvbbghbLdOw34rsaFmL_-TeVnqt2K_BMKv8YneeoJJurCu7if5401uhFx9DmOiUOkxUxrDGXw5H6DNUEIuxp0oDtmIkXeu0zNyclZ2p8kf6ZINO-0JD6Ef_tXAIP5dn4aziAqSn7UsagQpjPAWIq26dfUpyOJRk7jss9kk47-2CywEmKQXa-MrzfAGlG_PQn6GvYgEmwwS9dMsOPVP-TVBElrd_6mCkYUo1mI" />
                            <div className="absolute top-3 left-3">
                                <span className="px-2.5 py-1 rounded-full bg-[#fdf9f3]/90 text-primary backdrop-blur-md font-bold text-[11px] shadow-sm">
                                    In Stock (4)
                                </span>
                            </div>
                            <button aria-label="Product options"
                                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-[#fdf9f3]/90 text-primary backdrop-blur-md flex items-center justify-center shadow-md hover:bg-white transition-all cursor-pointer"
                                type="button">
                                <span className="material-symbols-outlined text-[20px]">more_vert</span>
                            </button>
                        </div>
                        <div className="p-4 flex flex-col gap-1 flex-1 justify-between">
                            <div>
                                <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">Handloom Silk</span>
                                <h4 className="text-[16px] font-bold text-primary truncate mt-0.5">Blue Silk Saree</h4>
                            </div>
                            <div className="flex items-baseline justify-between pt-3 border-t border-[#d1c4bd]/30">
                                <span className="text-[18px] font-bold text-primary flex items-center gap-1">✨ ₹850</span>
                                <span className="text-[12px] text-on-surface-variant font-medium flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">visibility</span> 24 views
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Item 2 */}
                    <div className="rounded-2xl bg-[#f7f3ed] border border-[#d1c4bd]/40 overflow-hidden shadow-sm flex flex-col group hover:shadow-md transition-all">
                        <div className="relative w-full aspect-[4/5] bg-[#ebe8e2] overflow-hidden">
                            <img alt="Handmade Clay Pot"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuARaNY8d8OBAZkfszvKSrgvwkJU0jQJSlOAkSNdpZ0kzdy3e1Mq2nJJBMmkxo6N0wqudg4yQ_D6Nso1ZqeTBKPWlbyPVKIEV4pBs1BUZiRU7PlKRlIpKdvoiajh0c4O6ltESOJaA60KX1zZL3RN2ul-kVMpAPHmXvisLiObSJcyuvKRfJzAi8pmg3H6gzTnbY2xHZnWoeAjCznUZWdSDZyEAkddac-bTraUc2jg-xpZDRtvJKT6mKe2" />
                            <div className="absolute top-3 left-3">
                                <span className="px-2.5 py-1 rounded-full bg-[#fdf9f3]/90 text-primary backdrop-blur-md font-bold text-[11px] shadow-sm">
                                    In Stock (8)
                                </span>
                            </div>
                            <button aria-label="Product options"
                                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-[#fdf9f3]/90 text-primary backdrop-blur-md flex items-center justify-center shadow-md hover:bg-white transition-all cursor-pointer"
                                type="button">
                                <span className="material-symbols-outlined text-[20px]">more_vert</span>
                            </button>
                        </div>
                        <div className="p-4 flex flex-col gap-1 flex-1 justify-between">
                            <div>
                                <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">Clay Pottery</span>
                                <h4 className="text-[16px] font-bold text-primary truncate mt-0.5">Handmade Clay Pot</h4>
                            </div>
                            <div className="flex items-baseline justify-between pt-3 border-t border-[#d1c4bd]/30">
                                <span className="text-[18px] font-bold text-primary flex items-center gap-1">✨ ₹200</span>
                                <span className="text-[12px] text-on-surface-variant font-medium flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">visibility</span> 12 views
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Item 3 */}
                    <div className="rounded-2xl bg-[#f7f3ed] border border-[#d1c4bd]/40 overflow-hidden shadow-sm flex flex-col group hover:shadow-md transition-all">
                        <div className="relative w-full aspect-[4/5] bg-[#ebe8e2] overflow-hidden">
                            <img alt="Brass Puja Diya"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXbDk5LUiUiH6EZVNqec37nEVwf59ppq2I5vbTrZUIgkOfHuqm10xwlrKrLI2HLwiqoQy3J3L5fTfxPXwRI3z8ZqUoaMoJdzLhQ76IU2D2xfOfzgBYXi57q6EOqIeBgvnQCBRM70-X1hQQIB2l06C-hruYJY9mgh_2IT8ZO48-E7z-OqrpSUCnQPfrV0Bq5Uof6gC7W_110-GxxyRqN5d-0gRL_Lqazm9M6AjVKfKRwHZ5_iyFoFxz" />
                            <div className="absolute top-3 left-3">
                                <span className="px-2.5 py-1 rounded-full bg-[#ba1a1a] text-white backdrop-blur-md font-bold text-[11px] shadow-sm">
                                    Low Stock (2)
                                </span>
                            </div>
                            <button aria-label="Product options"
                                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-[#fdf9f3]/90 text-primary backdrop-blur-md flex items-center justify-center shadow-md hover:bg-white transition-all cursor-pointer"
                                type="button">
                                <span className="material-symbols-outlined text-[20px]">more_vert</span>
                            </button>
                        </div>
                        <div className="p-4 flex flex-col gap-1 flex-1 justify-between">
                            <div>
                                <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">Brass Metalwork</span>
                                <h4 className="text-[16px] font-bold text-primary truncate mt-0.5">Brass Puja Diya</h4>
                            </div>
                            <div className="flex items-baseline justify-between pt-3 border-t border-[#d1c4bd]/30">
                                <span className="text-[18px] font-bold text-primary flex items-center gap-1">✨ ₹450</span>
                                <span className="text-[12px] text-on-surface-variant font-medium flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">visibility</span> 9 views
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Add New Craft Quick Action */}
                    <div
                        className="rounded-2xl border-2 border-dashed border-[#d1c4bd] bg-[#f7f3ed]/60 hover:bg-[#f7f3ed] flex flex-col items-center justify-center p-6 text-center shadow-sm transition-all cursor-pointer group min-h-[300px]"
                        onClick={() => navigate('/capture')}
                    >
                        <div
                            className="w-16 h-16 rounded-full bg-[#ebe8e2] group-hover:bg-[#2e241e] group-hover:text-white flex items-center justify-center text-primary mb-3 shadow-inner transition-colors duration-200">
                            <span className="material-symbols-outlined text-[30px]">add_a_photo</span>
                        </div>
                        <p className="text-[18px] font-bold text-primary">Add New Craft</p>
                        <p className="text-[13px] text-on-surface-variant mt-1.5 max-w-[200px]">Tap to snap camera or speak product details</p>
                        <span
                            className="inline-flex items-center gap-1.5 text-[12px] font-bold text-secondary uppercase tracking-wider mt-4 px-3 py-1 bg-white rounded-full border border-[#d1c4bd]/40 shadow-sm">
                            <span className="material-symbols-outlined text-[16px]">mic</span> Voice Ready
                        </span>
                    </div>
                </div>

                {/* Ramesh's Daily Tip */}
                <div className="p-5 rounded-2xl bg-[#ffdbce]/40 border border-[#ffdbce] flex items-center justify-between shadow-sm mt-2">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-[#9c441c] shrink-0 shadow-sm">
                            <span className="material-symbols-outlined text-[26px]">lightbulb</span>
                        </div>
                        <div>
                            <p className="text-[16px] font-bold text-primary flex items-center gap-2">
                                Ramesh's Daily Tip
                                <span className="text-[11px] font-semibold text-[#9c441c] bg-white px-2 py-0.5 rounded-full">Artisan Best Practice</span>
                            </p>
                            <p className="text-[14px] text-on-surface-variant mt-0.5">Natural morning light brings out your saree's pure silk threads and clay etching highlights.</p>
                        </div>
                    </div>
                    <button aria-label="Dismiss tip"
                        className="text-on-surface-variant hover:text-primary p-2 rounded-full hover:bg-white/60 transition-colors cursor-pointer"
                        type="button">
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}
