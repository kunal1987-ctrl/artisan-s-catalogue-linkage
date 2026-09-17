import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from '../components/LanguageToggle';

/**
 * Celebratory Success State Component post-upload
 * Displays the finalized Photoroom-enhanced image, multi-channel GeM & ONDC linkage badges,
 * and a massive green "Share to WhatsApp" button for rural artisans.
 */
export default function Success() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const product = location.state || {};

  const title = product.title || 'Handcrafted Terracotta Decorative Pitcher';
  const titleHi = product.titleHi || product.title_hi || 'हस्तनिर्मित टेराकोटा सजावटी सुराही';
  const price = product.price || 450;
  const wholesalePrice = product.wholesalePrice || product.bulk_price || 280;
  const moq = product.moq || 50;
  const gemCategory = product.gemCategory || product.gem_category || 'Handicrafts - Traditional Art & Decor';
  const category = product.category || product.craft_category || 'Pottery & Terracotta';
  const hsnCode = product.hsn_code || '69120010';
  const imageUrl =
    product.enhancedImageUrl ||
    product.imageUrl ||
    product.image_url ||
    'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80';

  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [ondcEnabled, setOndcEnabled] = useState(true);
  const [copied, setCopied] = useState(false);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const copyLink = async () => {
    const productId = product.id || 'a1b2c3d4-0001-4000-8000-000000000001';
    const shareUrl = `${window.location.origin}/product/${productId}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      triggerToast(language === 'hi' ? 'उत्पाद लिंक कॉपी हो गया' : 'Product link copied to clipboard');
      setTimeout(() => {
        setCopied(false);
      }, 2500);
    } catch (err) {
      console.error('Failed to copy product link:', err);
    }
  };

  const shareWhatsApp = () => {
    const productId = product.id || 'a1b2c3d4-0001-4000-8000-000000000001';
    const shareUrl = `${window.location.origin}/product/${productId}`;
    const displayTitle = language === 'hi' ? titleHi : title;
    const text = encodeURIComponent(
      `नमस्ते! शिल्प सेतु पर हमारा नया हस्तशिल्प "${displayTitle}" अब लाइव है।\n\n` +
      `खुदरा मूल्य: ₹${price.toLocaleString('en-IN')}\n` +
      `थोक व संस्थागत मूल्य (न्यूनतम ${moq} पीस): ₹${wholesalePrice.toLocaleString('en-IN')}/यूनिट\n` +
      `GeM श्रेणी: ${gemCategory}\n` +
      `HSN कोड: ${hsnCode}\n\n` +
      `यहाँ देखें और सीधा ऑर्डर करें: ${shareUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#fdf9f3] font-sans text-on-surface antialiased flex flex-col">
      {/* Top Header Bar */}
      <header className="bg-[#191312] text-white px-3 sm:px-8 py-3 sm:py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-lg border-b border-white/10 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => navigate('/home')}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
            title={language === 'hi' ? 'वापस जाएं' : 'Back to Home'}
          >
            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">arrow_back</span>
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-bold text-xs sm:text-sm tracking-wide truncate">
              <span>{language === 'hi' ? 'शिल्प सेतु' : 'Shilp Setu'}</span>
              <span className="hidden sm:inline"> • {language === 'hi' ? 'बहु-चैनल बाज़ार संपर्क' : 'Multi-Channel Market Linkage'}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <LanguageToggle variant="dark" />
          <button
            onClick={() => navigate('/catalog')}
            className="px-3 sm:px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold transition-all cursor-pointer hidden sm:inline-flex"
          >
            {t('nav.catalog', 'Catalog')}
          </button>
          <button
            onClick={() => navigate('/home')}
            className="px-3 sm:px-4 py-1.5 rounded-full bg-[#ff9062] text-[#180f0a] font-bold text-xs hover:bg-[#ff804a] transition-all cursor-pointer"
          >
            {t('nav.home', 'Dashboard')}
          </button>
        </div>
      </header>

      {/* Floating Notification Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-[#191312] text-white text-xs font-bold shadow-2xl border border-[#ff9062]/50 animate-in fade-in slide-in-from-bottom-2 duration-200 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 w-full max-w-5xl mx-auto p-3 sm:p-6 lg:p-8 flex flex-col gap-5 sm:gap-6">
        {/* ── CELEBRATION HERO BANNER ────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#2e241e] via-[#3d2e24] to-[#1e1713] text-white p-4 sm:p-8 shadow-2xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-start gap-3 sm:gap-5 z-10">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-emerald-500/20 border-2 border-emerald-400/50 flex items-center justify-center shrink-0 shadow-lg">
              <span className="material-symbols-outlined text-emerald-400 text-[26px] sm:text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 rounded-full bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 text-[11px] sm:text-xs font-bold w-max mb-1.5">
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                <span>{language === 'hi' ? 'प्रमाणित शिल्पकला • लाइव' : 'Certified Craft • Published Live'}</span>
              </div>
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-black tracking-tight leading-tight">
                {language === 'hi' ? '🎉 बधाई हो! उत्पाद लाइव एवं प्रकाशित हो चुका है!' : '🎉 Congratulations! Your Craft is Live & Published!'}
              </h1>
              <p className="text-xs sm:text-sm text-[#e6e2dc] mt-1 leading-relaxed">
                {language === 'hi'
                  ? 'फोटो का लाइफस्टाइल दृश्य तैयार किया गया है और यह ONDC उपभोक्ता नेटवर्क एवं सरकारी GeM पोर्टल पर सक्रिय हो चुका है।'
                  : 'Enhanced with Photoroom AI Studio cutout & synced directly across ONDC buyer apps and Government e-Marketplace.'}
              </p>
            </div>
          </div>

          <div className="flex flex-row sm:flex-col items-center gap-2 shrink-0 z-10 w-full sm:w-auto">
            <span className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40 text-center">
              ✓ GeM Ready
            </span>
            <span className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/40 text-center">
              ✓ ONDC Active
            </span>
          </div>
        </section>

        {/* ── CORE SHOWCASE & WHATSAPP ACTION SECTION ────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Finalized Photoroom-Enhanced Image Card */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-md border border-[#d1c4bd]/60 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#d1c4bd]/40">
                <span className="text-xs font-bold uppercase tracking-wider text-[#9c441c]">
                  {language === 'hi' ? 'अंतिम उन्नत उत्पाद छवि' : 'Finalized Studio Image'}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  {language === 'hi' ? 'लाइव कैटलॉग' : 'Live in Catalog'}
                </span>
              </div>

              {/* Large, Prominent Aspect-Square Image Showcase */}
              <div className="relative aspect-square w-full rounded-xl sm:rounded-2xl overflow-hidden bg-[#180f0a] border-2 border-[#ff9062]/30 shadow-inner group">
                <img
                  src={imageUrl}
                  alt={title}
                  className="w-full h-full object-contain p-3 sm:p-4 transition-transform duration-500 group-hover:scale-105"
                />

                {/* Floating Photoroom Badge */}
                <div className="absolute top-3 left-3 px-2.5 sm:px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-white text-[10px] sm:text-[11px] font-bold flex items-center gap-1.5 shadow-lg">
                  <span className="material-symbols-outlined text-[14px] sm:text-[15px] text-[#ff9062]">auto_awesome</span>
                  <span>{language === 'hi' ? 'फोटो-स्टूडियो उन्नत' : 'Photoroom AI Enhanced'}</span>
                </div>

                {/* Live Status Badge */}
                <div className="absolute bottom-3 right-3 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-500/50 text-emerald-300 text-[10px] sm:text-[11px] font-bold flex items-center gap-1.5 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>GeM & ONDC Active</span>
                </div>
              </div>

              {/* Product Meta Overview */}
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-black text-primary leading-snug">
                      {language === 'hi' ? titleHi : title}
                    </h2>
                    <p className="text-xs text-stone-500 font-medium mt-0.5 truncate">
                      {category} • {gemCategory}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xl sm:text-2xl font-black text-[#9c441c] block">
                      ₹{price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] font-bold text-stone-400">
                      {language === 'hi' ? 'खुदरा मूल्य' : 'Retail Price'}
                    </span>
                  </div>
                </div>

                {/* Wholesale & MOQ Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 p-3 rounded-2xl bg-[#f1ede7] border border-[#d1c4bd]/60 text-xs">
                  <div>
                    <span className="text-stone-500 font-medium block">
                      {language === 'hi' ? 'संस्थागत थोक दर' : 'Institutional Bulk Rate'}
                    </span>
                    <span className="font-bold text-emerald-700 text-sm mt-0.5 block">
                      ₹{wholesalePrice.toLocaleString('en-IN')} / {language === 'hi' ? 'पीस' : 'unit'}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 font-medium block">
                      {language === 'hi' ? 'न्यूनतम आदेश (MOQ)' : 'Minimum Order (MOQ)'}
                    </span>
                    <span className="font-bold text-stone-800 text-sm mt-0.5 block">
                      {moq} {language === 'hi' ? 'पीस' : 'Units'} (HSN: {hsnCode})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Massive Green "Share to WhatsApp" Button & Quick Actions */}
          <div className="lg:col-span-6 flex flex-col gap-4 sm:gap-5">
            {/* ── MASSIVE GREEN SHARE TO WHATSAPP CARD ── */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-xl border-2 border-[#25D366]/40 flex flex-col gap-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-[#25D366]/15 flex items-center justify-center text-[#1e7e45] shrink-0">
                    <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      chat
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-primary truncate">
                      {language === 'hi' ? 'सीधा व्हाट्सएप साझा केंद्र' : 'Direct WhatsApp Sharing Hub'}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-stone-500 truncate">
                      {language === 'hi' ? 'स्थानीय ग्राहकों एवं थोक खरीदारों को भेजें' : 'Instant 1-tap sharing with customer groups'}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                  {language === 'hi' ? 'तेज़ बिक्री' : 'Fastest Sales'}
                </span>
              </div>

              {/* THE MASSIVE GREEN WHATSAPP BUTTON */}
              <button
                id="share-whatsapp-btn"
                type="button"
                onClick={shareWhatsApp}
                className="w-full py-4 sm:py-5 px-4 sm:px-6 rounded-2xl sm:rounded-3xl bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1caa50] text-white shadow-xl shadow-[#25D366]/25 hover:shadow-2xl hover:shadow-[#25D366]/40 flex items-center justify-between gap-3 sm:gap-4 transition-all transform active:scale-98 cursor-pointer group"
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                    </svg>
                  </div>
                  <div className="flex flex-col text-left min-w-0">
                    <span className="text-base sm:text-xl font-black text-white tracking-wide leading-tight truncate">
                      {language === 'hi' ? 'व्हाट्सएप पर शेयर करें' : 'Share to WhatsApp'}
                    </span>
                    <span className="text-[11px] sm:text-sm text-white/90 leading-tight mt-0.5 truncate">
                      {language === 'hi'
                        ? 'तस्वीर, खुदरा मूल्य व थोक विवरण स्वतः चैट में जुड़ेंगे'
                        : 'Pre-fills product card, price, and bulk MOQ directly into chat'}
                    </span>
                  </div>
                </div>

                <span className="material-symbols-outlined text-[24px] sm:text-[28px] text-white group-hover:translate-x-1.5 transition-transform shrink-0">
                  arrow_forward
                </span>
              </button>

              {/* Direct Link Copy Row */}
              <div className="p-3 rounded-2xl bg-[#f1ede7] border border-[#d1c4bd]/60 flex items-center justify-between gap-2 sm:gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-secondary text-[20px] shrink-0">link</span>
                  <span className="text-xs text-stone-600 font-mono truncate">
                    shilpsetu.in/product/{product.id || 'a1b2c3d4-0001-4000-8000-000000000001'}
                  </span>
                </div>
                <button
                  type="button"
                  id="copy-product-link-btn"
                  onClick={copyLink}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border shadow-xs cursor-pointer active:scale-95 transition-all shrink-0 ${
                    copied
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-white hover:bg-stone-50 text-primary border-[#d1c4bd]/80'
                  }`}
                >
                  {copied ? 'Copied! ✅' : 'Copy Link'}
                </button>
              </div>
            </div>

            {/* Quick Navigation Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => navigate('/catalog')}
                className="py-3 sm:py-3.5 px-4 rounded-2xl bg-white hover:bg-[#f7f3ed] border border-[#d1c4bd]/80 text-primary font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px] text-secondary">inventory_2</span>
                <span>{language === 'hi' ? 'मेरी शिल्प सूची देखें' : 'View My Catalog'}</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/capture')}
                className="py-3 sm:py-3.5 px-4 rounded-2xl bg-primary hover:bg-[#2e241e] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">add_a_photo</span>
                <span>{language === 'hi' ? '+ नया शिल्प जोड़ें' : '+ Add Another Craft'}</span>
              </button>
            </div>

            {/* ONDC & GeM Dual Sync Status Card */}
            <div className="p-4 rounded-2xl sm:rounded-3xl bg-white border border-[#d1c4bd]/60 shadow-xs flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-emerald-700 text-[18px]">verified</span>
                  <span>{language === 'hi' ? 'मंच एकीकरण स्थिति' : 'Platform Integration Status'}</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {language === 'hi' ? 'सक्रिय' : 'Active'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-[#f1ede7] border border-[#d1c4bd]/40">
                  <span className="font-bold text-primary block">ONDC Network</span>
                  <span className="text-[11px] text-stone-500">Paytm, Mystore, Pincode</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#f1ede7] border border-[#d1c4bd]/40">
                  <span className="font-bold text-primary block">GeM 4.0 Portal</span>
                  <span className="text-[11px] text-stone-500">Public MSE Quota Eligible</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
