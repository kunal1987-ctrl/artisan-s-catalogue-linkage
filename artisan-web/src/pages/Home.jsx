import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const navigate = useNavigate();
  const { language, showToast } = useAuth();

  // Metric Card Interactive States
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [stockQty, setStockQty] = useState(2);
  const [toastMsg, setToastMsg] = useState('');
  const [dismissTip, setDismissTip] = useState(false);

  const previewProducts = [
    {
      id: 'a1b2c3d4-0003-4000-8000-000000000003',
      title: 'Blue Silk Saree',
      title_hi: 'नीली रेशम साड़ी',
      category: 'Handloom Silk',
      category_hi: 'हथकरघा रेशम',
      price: 850,
      views: 24,
      stock: 4,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBk9yCjVvfLitGlye3MvbbghbLdOw34rsaFmL_-TeVnqt2K_BMKv8YneeoJJurCu7if5401uhFx9DmOiUOkxUxrDGXw5H6DNUEIuxp0oDtmIkXeu0zNyclZ2p8kf6ZINO-0JD6Ef_tXAIP5dn4aziAqSn7UsagQpjPAWIq26dfUpyOJRk7jss9kk47-2CywEmKQXa-MrzfAGlG_PQn6GvYgEmwwS9dMsOPVP-TVBElrd_6mCkYUo1mI',
    },
    {
      id: 'a1b2c3d4-0001-4000-8000-000000000001',
      title: 'Handmade Clay Pot',
      title_hi: 'हस्तनिर्मित मिट्टी का बर्तन',
      category: 'Clay Pottery',
      category_hi: 'मिट्टी कला',
      price: 200,
      views: 12,
      stock: 8,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuARaNY8d8OBAZkfszvKSrgvwkJU0jQJSlOAkSNdpZ0kzdy3e1Mq2nJJBMmkxo6N0wqudg4yQ_D6Nso1ZqeTBKPWlbyPVKIEV4pBs1BUZiRU7PlKRlIpKdvoiajh0c4O6ltESOJaA60KX1zZL3RN2ul-kVMpAPHmXvisLiObSJcyuvKRfJzAi8pmg3H6gzTnbY2xHZnWoeAjCznUZWdSDZyEAkddac-bTraUc2jg-xpZDRtvJKT6mKe2',
    },
    {
      id: 'a1b2c3d4-0002-4000-8000-000000000002',
      title: 'Brass Puja Diya',
      title_hi: 'पीतल पूजा दीया',
      category: 'Brass Metalwork',
      category_hi: 'पीतल धातु शिल्प',
      price: 450,
      views: 9,
      stock: stockQty,
      isLowStock: stockQty <= 2,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXbDk5LUiUiH6EZVNqec37nEVwf59ppq2I5vbTrZUIgkOfHuqm10xwlrKrLI2HLwiqoQy3J3L5fTfxPXwRI3z8ZqUoaMoJdzLhQ76IU2D2xfOfzgBYXi57q6EOqIeBgvnQCBRM70-X1hQQIB2l06C-hruYJY9mgh_2IT8ZO48-E7z-OqrpSUCnQPfrV0Bq5Uof6gC7W_110-GxxyRqN5d-0gRL_Lqazm9M6AjVKfKRwHZ5_iyFoFxz',
    },
  ];

  const handleUpdateStock = () => {
    setShowRestockModal(false);
    const msg = language === 'hi'
      ? `✅ मिट्टी की सुराही का स्टॉक बदलकर ${stockQty} इकाइयां किया गया!`
      : `✅ Terracotta Surahi stock updated to ${stockQty} units!`;
    if (showToast) showToast(msg);
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  return (
    <div className="w-full">
      <main className="flex-1 flex flex-col relative w-full min-h-screen bg-[#fdf9f3] overflow-y-auto">
        <div className="flex flex-col w-full px-gutter-mobile pb-space-lg">
            <div
                className="border-b border-[#d1c4bd]/40 px-4 sm:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                    <div className="relative w-full sm:w-80">
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
                </div>
            </div>
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
                    {/* Card 1: Live Products -> Route to Catalog */}
                    <div
                        onClick={() => navigate('/catalog')}
                        className="p-5 rounded-2xl bg-[#f7f3ed] border border-[#d1c4bd]/40 shadow-sm flex flex-col justify-between hover:shadow-md cursor-pointer active:scale-95 transition-transform"
                    >
                        <div className="flex items-center justify-between">
                            <span className="w-10 h-10 rounded-xl bg-[#ebe8e2] flex items-center justify-center text-[#9c441c]">
                                <span className="material-symbols-outlined text-[22px]">storefront</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-[#9c441c] font-bold text-[12px] bg-[#ff9062]/15 px-2 py-0.5 rounded-full">
                                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                                <span>{language === 'hi' ? '+2 इस हफ़्ते' : '+2 this wk'}</span>
                            </span>
                        </div>
                        <div className="mt-4">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">
                                {language === 'hi' ? 'सक्रिय शिल्प' : 'Live Products'}
                            </span>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-[32px] font-bold text-primary">12</span>
                                <span className="text-[14px] text-on-surface-variant font-medium">
                                    {language === 'hi' ? 'दुकान में उपलब्ध' : 'listed in shop'}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Card 2: Recent Views -> Shopper Insights Modal */}
                    <div
                        onClick={() => setShowInsightsModal(true)}
                        className="p-5 rounded-2xl bg-[#f7f3ed] border border-[#d1c4bd]/40 shadow-sm flex flex-col justify-between hover:shadow-md cursor-pointer active:scale-95 transition-transform"
                    >
                        <div className="flex items-center justify-between">
                            <span className="w-10 h-10 rounded-xl bg-[#ebe8e2] flex items-center justify-center text-[#9c441c]">
                                <span className="material-symbols-outlined text-[22px]">visibility</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-[#9c441c] font-bold text-[12px] bg-[#ff9062]/15 px-2 py-0.5 rounded-full">
                                <span className="material-symbols-outlined text-[14px]">north_east</span> +18%
                            </span>
                        </div>
                        <div className="mt-4">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">
                                {language === 'hi' ? 'हालिया दर्शक' : 'Recent Views'}
                            </span>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-[32px] font-bold text-primary">45</span>
                                <span className="text-[14px] text-on-surface-variant font-medium">
                                    {language === 'hi' ? 'ग्राहक पहुंचे' : 'shoppers reached'}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Card 3: Store Activity -> Route to Orders */}
                    <div
                        onClick={() => navigate('/orders')}
                        className="p-5 rounded-2xl bg-[#f7f3ed] border border-[#d1c4bd]/40 shadow-sm flex flex-col justify-between hover:shadow-md cursor-pointer active:scale-95 transition-transform"
                    >
                        <div className="flex items-center justify-between">
                            <span className="w-10 h-10 rounded-xl bg-[#ebe8e2] flex items-center justify-center text-[#9c441c]">
                                <span className="material-symbols-outlined text-[22px]">insights</span>
                            </span>
                            <span className="text-[11px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                {language === 'hi' ? 'सक्रिय' : 'Healthy'}
                            </span>
                        </div>
                        <div className="mt-3 flex items-end justify-between">
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">
                                    {language === 'hi' ? 'दुकान सक्रियता' : 'Store Activity'}
                                </span>
                                <span className="text-[14px] font-bold text-primary block mt-0.5">
                                    {language === 'hi' ? '3 नई पूछताछ आज' : '3 Inquiries Today'}
                                </span>
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
                    
                    {/* Card 4: Inventory Alert -> Quick Restock Bottom Sheet */}
                    <div
                        onClick={() => setShowRestockModal(true)}
                        className={`p-5 rounded-2xl ${
                            stockQty <= 2 ? 'bg-[#ff9062]/10 border-[#ff9062]/30' : 'bg-[#f7f3ed] border-[#d1c4bd]/40'
                        } border shadow-sm flex flex-col justify-between hover:shadow-md cursor-pointer active:scale-95 transition-transform`}
                    >
                        <div className="flex items-center justify-between">
                            <span className={`w-10 h-10 rounded-xl ${
                                stockQty <= 2 ? 'bg-[#ff9062]/20 text-[#9c441c]' : 'bg-[#ebe8e2] text-primary'
                            } flex items-center justify-center`}>
                                <span className="material-symbols-outlined text-[22px]">
                                    {stockQty <= 2 ? 'notification_important' : 'inventory_2'}
                                </span>
                            </span>
                            <span className={`text-[11px] font-bold uppercase ${
                                stockQty <= 2 ? 'text-[#9c441c] bg-white' : 'text-emerald-800 bg-emerald-100'
                            } px-2 py-0.5 rounded-full shadow-sm`}>
                                {stockQty <= 2 
                                    ? (language === 'hi' ? 'ध्यान दें' : 'Attention')
                                    : (language === 'hi' ? 'पुनः स्टॉक' : 'Restocked')}
                            </span>
                        </div>
                        <div className="mt-4">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9c441c] block">
                                {language === 'hi' ? 'स्टॉक चेतावनी' : 'Inventory Alert'}
                            </span>
                            <div className="flex items-baseline justify-between mt-1">
                                <span className="text-[22px] font-bold text-primary">
                                    {stockQty <= 2
                                        ? (language === 'hi' ? '1 अल्प स्टॉक' : '1 Low Stock')
                                        : (language === 'hi' ? `${stockQty} स्टॉक में` : `${stockQty} In Stock`)}
                                </span>
                                <span className="text-[12px] font-bold text-[#9c441c] hover:underline">
                                    {stockQty <= 2
                                        ? (language === 'hi' ? 'सुराही स्टॉक बढ़ाएं →' : 'Restock Surahi →')
                                        : (language === 'hi' ? 'स्टॉक बदलें →' : 'Adjust Stock →')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Recent Uploads Section */}
                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-3">
                        <h3 className="text-[22px] font-bold text-primary">
                            {language === 'hi' ? 'हाल ही में जोड़े गए शिल्प' : 'Recent Uploads'}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#ebe8e2] text-secondary font-bold text-[12px]">
                            {language === 'hi' ? '3 सक्रिय शिल्प' : '3 Active Crafts'}
                        </span>
                        <span className="text-[13px] text-on-surface-variant hidden md:inline">
                            {language === 'hi' ? 'खरीदारों को दिखाने हेतु तैयार' : 'Ready to show international buyers'}
                        </span>
                    </div>
                    <button
                        onClick={() => navigate('/catalog')}
                        className="text-[14px] text-secondary hover:text-primary font-bold flex items-center gap-1 transition-colors cursor-pointer bg-transparent border-0"
                        type="button"
                    >
                        <span>{language === 'hi' ? 'सभी शिल्प देखें' : 'View All Catalog Items'}</span>
                        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                </div>
                
                {/* Product Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {previewProducts.map((product) => {
                        const isLow = product.isLowStock;
                        return (
                            <div
                                key={product.id}
                                onClick={() => navigate('/catalog', { state: { editProductId: product.id } })}
                                className="rounded-2xl bg-[#f7f3ed] border border-[#d1c4bd]/40 overflow-hidden shadow-sm flex flex-col group cursor-pointer hover:shadow-lg transition-all active:scale-[0.99]"
                            >
                                <div className="relative w-full aspect-[4/5] bg-[#ebe8e2] overflow-hidden">
                                    <img
                                        alt={product.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        src={product.image}
                                    />
                                    <div className="absolute top-3 left-3">
                                        <span
                                            className={`px-2.5 py-1 rounded-full backdrop-blur-md font-bold text-[11px] shadow-sm ${
                                                isLow ? 'bg-[#ba1a1a] text-white' : 'bg-[#fdf9f3]/90 text-primary'
                                            }`}
                                        >
                                            {isLow
                                                ? (language === 'hi' ? `अल्प स्टॉक (${product.stock})` : `Low Stock (${product.stock})`)
                                                : (language === 'hi' ? `स्टॉक में (${product.stock})` : `In Stock (${product.stock})`)}
                                        </span>
                                    </div>
                                    <button
                                        aria-label={language === 'hi' ? 'कैटलॉग में देखें' : 'View in catalog'}
                                        title={language === 'hi' ? 'कैटलॉग में देखें' : 'View in catalog'}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate('/catalog', { state: { editProductId: product.id } });
                                        }}
                                        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-[#fdf9f3]/90 text-primary backdrop-blur-md flex items-center justify-center shadow-md hover:bg-white group-hover:bg-[#9c441c] group-hover:text-white transition-all cursor-pointer"
                                        type="button"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                                    </button>
                                </div>
                                <div className="p-4 flex flex-col gap-1 flex-1 justify-between">
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">
                                                {language === 'hi' ? product.category_hi : product.category}
                                            </span>
                                            <span className="text-[11px] font-bold text-[#9c441c] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                                                <span>{language === 'hi' ? 'देखें' : 'View'}</span>
                                                <span>→</span>
                                            </span>
                                        </div>
                                        <h4 className="text-[16px] font-bold text-primary truncate mt-0.5 group-hover:text-[#9c441c] transition-colors">
                                            {language === 'hi' ? product.title_hi : product.title}
                                        </h4>
                                    </div>
                                    <div className="flex items-baseline justify-between pt-3 border-t border-[#d1c4bd]/30 mt-2">
                                        <span className="text-[18px] font-bold text-primary flex items-center gap-1">
                                            ✨ ₹{product.price}
                                        </span>
                                        <span className="text-[12px] text-on-surface-variant font-medium flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">visibility</span> {product.views} {language === 'hi' ? 'दृश्य' : 'views'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Add New Craft Quick Action */}
                    <div
                        className="rounded-2xl border-2 border-dashed border-[#d1c4bd] bg-[#f7f3ed]/60 hover:bg-[#f7f3ed] flex flex-col items-center justify-center p-6 text-center shadow-sm transition-all cursor-pointer group min-h-[300px]"
                        onClick={() => navigate('/capture')}
                    >
                        <div
                            className="w-16 h-16 rounded-full bg-[#ebe8e2] group-hover:bg-[#2e241e] group-hover:text-white flex items-center justify-center text-primary mb-3 shadow-inner transition-colors duration-200">
                            <span className="material-symbols-outlined text-[30px]">add_a_photo</span>
                        </div>
                        <p className="text-[18px] font-bold text-primary">
                            {language === 'hi' ? 'नया शिल्प जोड़ें' : 'Add New Craft'}
                        </p>
                        <p className="text-[13px] text-on-surface-variant mt-1.5 max-w-[200px]">
                            {language === 'hi'
                                ? 'फ़ोटो लें या बोलकर विवरण दर्ज करें'
                                : 'Tap to snap camera or speak product details'}
                        </p>
                        <span
                            className="inline-flex items-center gap-1.5 text-[12px] font-bold text-secondary uppercase tracking-wider mt-4 px-3 py-1 bg-white rounded-full border border-[#d1c4bd]/40 shadow-sm">
                            <span className="material-symbols-outlined text-[16px]">mic</span>
                            <span>{language === 'hi' ? 'आवाज़ तैयार' : 'Voice Ready'}</span>
                        </span>
                    </div>
                </div>

                {/* Ramesh's Daily Tip */}
                {!dismissTip && (
                    <div className="p-5 rounded-2xl bg-[#ffdbce]/40 border border-[#ffdbce] flex items-center justify-between shadow-sm mt-2">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-[#9c441c] shrink-0 shadow-sm">
                                <span className="material-symbols-outlined text-[26px]">lightbulb</span>
                            </div>
                            <div>
                                <p className="text-[16px] font-bold text-primary flex items-center gap-2">
                                    {language === 'hi' ? 'रामेश के लिए आज का सुझाव' : "Ramesh's Daily Tip"}
                                    <span className="text-[11px] font-semibold text-[#9c441c] bg-white px-2 py-0.5 rounded-full">
                                        {language === 'hi' ? 'कारीगर उत्तम अभ्यास' : 'Artisan Best Practice'}
                                    </span>
                                </p>
                                <p className="text-[14px] text-on-surface-variant mt-0.5">
                                    {language === 'hi'
                                        ? 'सुबह की प्राकृतिक धूप में साड़ियों के रेशमी धागे और मिट्टी के बर्तनों की नक्काशी सबसे स्पष्ट और आकर्षक दिखती है।'
                                        : "Natural morning light brings out your saree's pure silk threads and clay etching highlights."}
                                </p>
                            </div>
                        </div>
                        <button aria-label="Dismiss tip"
                            onClick={() => setDismissTip(true)}
                            className="text-on-surface-variant hover:text-primary p-2 rounded-full hover:bg-white/60 transition-colors cursor-pointer"
                            type="button">
                            <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* ── MODAL 1: SHOPPER INSIGHTS BOTTOM SHEET ── */}
        {showInsightsModal && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
          >
            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={() => setShowInsightsModal(false)} />

            <div className="relative w-full max-w-lg bg-[#fdf9f3] text-stone-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#d1c4bd]/60 overflow-hidden z-10 max-h-[90vh] flex flex-col">
              {/* Header Banner */}
              <div className="bg-[#1e140e] text-white p-5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#ff9062]/20 text-[#ff9062] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[24px]">visibility</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-wide">
                      {language === 'hi' ? 'दुकान दर्शक (Store Insights)' : 'Store Insights (दुकान दर्शक)'}
                    </h3>
                    <p className="text-xs text-[#d4c3ba]">
                      {language === 'hi' ? 'ओएनडीसी एवं बाज़ार नेटवर्क पर खरीदारों की पहुंच' : 'Shopper discovery across ONDC network'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInsightsModal(false)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
                  type="button"
                  aria-label="Close"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Body Content */}
              <div className="p-6 overflow-y-auto space-y-4">
                {/* Traffic summary card */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[28px] text-amber-700">hub</span>
                    <div>
                      <span className="text-xs font-bold text-amber-950 uppercase tracking-wider block">
                        {language === 'hi' ? 'कुल ओएनडीसी दृश्य' : 'Total ONDC Traffic'}
                      </span>
                      <span className="text-2xl font-extrabold text-[#180f0a]">
                        45 {language === 'hi' ? 'दर्शक' : 'Views'}
                      </span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                    +18% {language === 'hi' ? 'इस सप्ताह' : 'this week'}
                  </span>
                </div>

                {/* Section title */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                    {language === 'hi' ? 'शीर्ष लोकप्रिय शिल्प (ओएनडीसी नेटवर्क)' : 'Top Viewed Crafts (ONDC Network)'}
                  </span>
                  <span className="text-[11px] text-on-surface-variant font-medium">
                    {language === 'hi' ? 'पिछले 7 दिन' : 'Last 7 Days'}
                  </span>
                </div>

                {/* Top Item 1 */}
                <div className="p-4 rounded-2xl bg-white border border-[#d1c4bd]/60 shadow-xs flex items-center gap-4 hover:border-secondary/40 transition-colors">
                  <img
                    src="https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80"
                    alt="Terracotta Surahi"
                    className="w-16 h-16 rounded-xl object-cover border border-outline-variant/30 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-primary truncate">
                      {language === 'hi' ? 'पारंपरिक हस्तनिर्मित मिट्टी की सुराही' : 'Handcrafted Terracotta Earthen Pitcher (Surahi)'}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                        <span className="material-symbols-outlined text-[13px]">shopping_bag</span>
                        <span>ONDC Network</span>
                      </span>
                      <span className="text-xs text-on-surface-variant font-semibold">
                        • 28 {language === 'hi' ? 'दर्शक' : 'views'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-lg font-extrabold text-primary">28</span>
                    <span className="block text-[11px] text-emerald-700 font-bold">+62%</span>
                  </div>
                </div>

                {/* Top Item 2 */}
                <div className="p-4 rounded-2xl bg-white border border-[#d1c4bd]/60 shadow-xs flex items-center gap-4 hover:border-secondary/40 transition-colors">
                  <img
                    src="https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80"
                    alt="Jaipur Blue Pottery Plate"
                    className="w-16 h-16 rounded-xl object-cover border border-outline-variant/30 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-primary truncate">
                      {language === 'hi' ? 'जयपुर ब्लू पॉटरी प्लेट' : 'Jaipur Blue Pottery Plate'}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                        <span className="material-symbols-outlined text-[13px]">shopping_bag</span>
                        <span>ONDC Network</span>
                      </span>
                      <span className="text-xs text-on-surface-variant font-semibold">
                        • 17 {language === 'hi' ? 'दर्शक' : 'views'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-lg font-extrabold text-primary">17</span>
                    <span className="block text-[11px] text-emerald-700 font-bold">+38%</span>
                  </div>
                </div>

                {/* Channel Footnote */}
                <div className="p-3 bg-[#f1ede7] rounded-xl text-xs text-on-surface-variant flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-secondary shrink-0">insights</span>
                  <span>
                    {language === 'hi'
                      ? 'Paytm, Mystore, PhonePe Pincode व Tata Neu द्वारा ग्राहक सीधे आपके शिल्प खोज रहे हैं।'
                      : 'Shoppers are directly discovering your crafts via Paytm, Mystore, PhonePe Pincode & Tata Neu.'}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-[#d1c4bd]/40 bg-[#f7f3ed] flex justify-end">
                <button
                  onClick={() => setShowInsightsModal(false)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-primary hover:bg-[#2e241e] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer"
                  type="button"
                >
                  <span>{language === 'hi' ? 'ठीक है' : 'Done'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL 2: QUICK RESTOCK BOTTOM SHEET ── */}
        {showRestockModal && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
          >
            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={() => setShowRestockModal(false)} />

            <div className="relative w-full max-w-md bg-[#fdf9f3] text-stone-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#d1c4bd]/60 overflow-hidden z-10 max-h-[90vh] flex flex-col">
              {/* Header Banner */}
              <div className="bg-[#1e140e] text-white p-5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#ba1a1a]/20 text-[#ffb4ab] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[24px]">inventory_2</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-wide">
                      {language === 'hi' ? 'स्टॉक अपडेट (Quick Restock)' : 'Quick Restock (स्टॉक अपडेट)'}
                    </h3>
                    <p className="text-xs text-[#d4c3ba]">
                      {language === 'hi' ? 'अल्प-स्टॉक शिल्प की संख्या तुरंत बढ़ाएं' : 'Replenish low-stock craft units'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRestockModal(false)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
                  type="button"
                  aria-label="Close"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Body Content */}
              <div className="p-6 overflow-y-auto space-y-5">
                {/* Product Card Info */}
                <div className="p-4 rounded-2xl bg-white border border-[#d1c4bd]/60 shadow-xs flex items-center gap-4">
                  <img
                    src="https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80"
                    alt="Terracotta Surahi"
                    className="w-16 h-16 rounded-xl object-cover border border-outline-variant/30 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">
                      {language === 'hi' ? 'पारंपरिक मिट्टी शिल्प' : 'Terracotta Pottery'}
                    </span>
                    <h4 className="text-sm font-bold text-primary truncate">
                      {language === 'hi' ? 'पारंपरिक हस्तनिर्मित मिट्टी की सुराही' : 'Handcrafted Terracotta Earthen Pitcher (Surahi)'}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                        <span>{language === 'hi' ? `वर्तमान स्टॉक: ${stockQty} इकाइयां` : `Current: ${stockQty} units`}</span>
                      </span>
                      <span className="text-xs text-on-surface-variant font-bold">₹450</span>
                    </div>
                  </div>
                </div>

                {/* Quantity Stepper */}
                <div className="bg-[#f1ede7] rounded-2xl p-5 border border-[#d1c4bd]/40 text-center space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant block">
                    {language === 'hi' ? 'नया स्टॉक निर्धारित करें' : 'Adjust Stock Quantity'}
                  </span>

                  <div className="flex items-center justify-center gap-4 py-2">
                    <button
                      onClick={() => setStockQty((prev) => Math.max(0, prev - 1))}
                      className="w-14 h-14 rounded-2xl bg-white hover:bg-white/80 border border-[#d1c4bd] shadow-sm text-2xl font-bold flex items-center justify-center text-primary active:scale-90 transition-all cursor-pointer select-none"
                      type="button"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>

                    <div className="w-24 flex flex-col items-center">
                      <span className="text-4xl font-extrabold text-primary font-mono select-none">
                        {stockQty}
                      </span>
                      <span className="text-[11px] font-semibold text-on-surface-variant">
                        {language === 'hi' ? 'इकाइयां' : 'units'}
                      </span>
                    </div>

                    <button
                      onClick={() => setStockQty((prev) => prev + 1)}
                      className="w-14 h-14 rounded-2xl bg-white hover:bg-white/80 border border-[#d1c4bd] shadow-sm text-2xl font-bold flex items-center justify-center text-primary active:scale-90 transition-all cursor-pointer select-none"
                      type="button"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  {/* Quick Add Presets */}
                  <div className="flex items-center justify-center gap-2 pt-2 border-t border-[#d1c4bd]/40">
                    <span className="text-[11px] font-bold text-on-surface-variant mr-1">
                      {language === 'hi' ? 'त्वरित जोड़ें:' : 'Quick Add:'}
                    </span>
                    {[+5, +10, +25, +50].map((delta) => (
                      <button
                        key={delta}
                        type="button"
                        onClick={() => setStockQty((prev) => prev + delta)}
                        className="px-3 py-1 rounded-full bg-white hover:bg-primary hover:text-white text-primary border border-[#d1c4bd]/60 font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
                      >
                        +{delta}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-[#d1c4bd]/40 bg-[#f7f3ed] flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => setShowRestockModal(false)}
                  className="w-full sm:w-1/3 py-3 rounded-full bg-white hover:bg-stone-100 border border-[#d1c4bd] text-primary font-bold text-xs transition-all cursor-pointer"
                  type="button"
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  onClick={handleUpdateStock}
                  className="w-full sm:w-2/3 py-3 rounded-full bg-[#9c441c] hover:bg-[#7e3514] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>{language === 'hi' ? 'स्टॉक सहेजें' : 'Update Stock'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TOAST NOTIFICATION ── */}
        {toastMsg && (
          <div className="fixed bottom-24 sm:bottom-6 right-6 z-50 bg-[#1e140e] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
            <span className="material-symbols-outlined text-emerald-400 text-[20px]">check_circle</span>
            <span className="text-sm font-bold">{toastMsg}</span>
          </div>
        )}
      </main>
    </div>
  );
}
