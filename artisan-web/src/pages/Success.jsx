import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Success() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const product = location.state || {};

  const title = product.title || 'Handwoven Blue Pure Silk Saree';
  const titleHi = product.titleHi || 'वाराणसी हस्तनिर्मित बनारसी रेशम साड़ी';
  const price = product.price || 1200;
  const wholesalePrice = product.wholesalePrice || 880;
  const moq = product.moq || 50;
  const gemCategory = product.gemCategory || 'Handloom / Silk Sarees';
  const category = product.category || 'Textiles & Sarees';
  const imageUrl =
    product.imageUrl ||
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAlrPAyvNl_t4YKO8w_w-8U9DRhBPBK1zXyAqaEGSTKfIgX9zbFdVqhUz24eNyhzT-VuM5wuhWPS4TD0e650W0LH_Zpq2DGYrdxnIdJZLQBWy8sa4I0ePgxqBXrAITaOFKziX8se_79awuadNxGCAfRP4s5tsSwv_d8MhZMbiXzK4ft7mKRWbTud1DZzH0Kxt8B1sQRlVgDX7pzayDRDxTV-AbsRb-IF1Ryu3Q6xhv9GW2JC3B8yXoX';

  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [ondcEnabled, setOndcEnabled] = useState(true);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const copyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText('https://kalasangam.in/s/ks-8492');
    }
    triggerToast(language === 'hi' ? 'लिंक कॉपी हो गया' : 'Link copied to clipboard');
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      `नमस्ते! कला संगम पर हमारा नया हस्तशिल्प "${title}" (${titleHi}) अब लाइव है।\n` +
      `खुदरा मूल्य: ₹${price} | थोक/संस्थागत (MOQ ${moq}): ₹${wholesalePrice}/यूनिट\n` +
      `GeM श्रेणी: ${gemCategory}\n` +
      `देखें और ऑर्डर करें: https://kalasangam.in/s/ks-8492`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background font-sans text-on-surface antialiased selection:bg-secondary-fixed selection:text-on-secondary-fixed">
      {/* Quick Top Bar */}
      <div className="bg-[#180f0a] text-white px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/home')}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
          <span className="font-bold text-sm">Kala Sangam • Multi-Channel Market Linkage</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/catalog')}
            className="px-3.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors"
          >
            Catalog
          </button>
          <button
            onClick={() => navigate('/home')}
            className="px-3.5 py-1 rounded-full bg-[#ff9062] text-[#180f0a] font-bold text-xs hover:bg-[#ff804a] transition-colors"
          >
            Dashboard
          </button>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-52px)]">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 bg-surface-container-low border-r border-outline-variant/50 flex flex-col justify-between select-none z-30 hidden lg:flex">
          <div className="flex flex-col">
            <div className="p-5 border-b border-outline-variant/40 flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-sm flex-shrink-0">
                <span className="material-symbols-outlined text-[24px]">palette</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold tracking-wider text-secondary uppercase">कला संगम</span>
                <span className="font-bold text-primary text-base leading-tight truncate">Kala Sangam Studio</span>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-surface-container/60 border-b border-outline-variant/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                </span>
                <span className="text-xs font-medium text-on-surface-variant">Dual Sync Ready</span>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Active
              </span>
            </div>

            <nav className="p-4 space-y-1.5">
              <button
                onClick={() => navigate('/home')}
                className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors font-medium text-sm text-left"
              >
                <span className="material-symbols-outlined text-[20px]">roofing</span>
                <span>{language === 'hi' ? 'आवास' : 'Home'}</span>
              </button>
              <button
                onClick={() => navigate('/catalog')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-sm shadow-sm text-left"
              >
                <div className="flex items-center gap-3.5">
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    inventory_2
                  </span>
                  <span>{language === 'hi' ? 'कैटलॉग' : 'Catalog'}</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary-container text-primary-fixed-dim">13</span>
              </button>
              <button
                onClick={() => navigate('/orders')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors font-medium text-sm text-left"
              >
                <div className="flex items-center gap-3.5">
                  <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                  <span>{language === 'hi' ? 'ऑर्डर्स' : 'Orders'}</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-bold">
                  {language === 'hi' ? '3 नए' : '3 New'}
                </span>
              </button>
            </nav>
          </div>

          <div className="p-4 border-t border-outline-variant/40 space-y-3">
            <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/40 flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-sm">
                  RK
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-primary truncate leading-tight">Ramesh Kumar</span>
                <span className="text-[11px] text-on-surface-variant truncate">Master Artisan • Varanasi</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto overflow-y-auto">
          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-secondary-fixed/40 via-surface-container-low to-surface-container p-6 md:p-8 border border-outline-variant/40 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-secondary-container/20 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute -bottom-10 right-24 w-40 h-40 bg-tertiary-fixed/30 rounded-full blur-xl pointer-events-none"></div>

            <div className="flex items-center gap-5 relative z-10">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-secondary-container flex items-center justify-center shadow-md">
                  <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-primary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                  </div>
                </div>
                <span className="absolute -top-2 -right-2 text-xl select-none animate-bounce">✨</span>
              </div>
              <div className="flex flex-col">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-semibold w-max mb-1.5 border border-secondary/20">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    auto_awesome
                  </span>
                  <span>{language === 'hi' ? 'कला संगम प्रमाणित शिल्पकला • लाइव' : 'Kala Sangam Certified Craft • Multi-Channel Live'}</span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-primary tracking-tight">
                  {language === 'hi' ? 'बधाई हो! उत्पाद लाइव एवं प्रकाशित हो चुका है!' : 'Congratulations! Product is Live & Published!'}
                </h1>
                <p className="text-sm text-on-surface-variant mt-1">
                  {language === 'hi' 
                    ? 'आपका शिल्प अब ONDC उपभोक्ता नेटवर्क और सरकारी ई-मार्केटप्लेस (GeM) दोनों से जुड़ चुका है।'
                    : 'Your craft is now mapped to both ONDC Consumer Network and Government e-Marketplace (GeM).'}
                </p>
              </div>
            </div>

            <div className="relative z-10 w-full md:w-auto flex-shrink-0">
              <button
                className="w-full md:w-auto px-4 py-3 rounded-2xl bg-surface-container-lowest/90 border border-outline-variant/50 shadow-sm hover:shadow-md hover:bg-surface-container-lowest transition-all flex items-center gap-3 text-left"
                id="audio-hint-btn"
                type="button"
              >
                <div className="w-9 h-9 rounded-full bg-secondary text-on-secondary flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[20px] animate-pulse">volume_up</span>
                </div>
                <div className="flex flex-col">
                  <p className="text-xs text-on-surface font-medium leading-tight">
                    <span className="font-bold text-secondary">
                      {language === 'hi' ? 'सुनिए:' : 'Listen:'}
                    </span>{' '}
                    {language === 'hi'
                      ? '"व्हाट्सएप व GeM पर लिस्टिंग सफल हुई..."'
                      : '"Listing published to WhatsApp & GeM..."'}
                  </p>
                  <span className="text-[11px] text-on-surface-variant font-semibold mt-0.5">
                    {language === 'hi' ? 'मार्गदर्शन सुनने के लिए क्लिक करें' : 'Click to play voice guide'}
                  </span>
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ── Left Column: Craft Summary Card ── */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/50 p-6 shadow-sm flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30 mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                      {language === 'hi' ? 'प्रकाशित शिल्प प्रोफाइल' : 'Published Craft Profile'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      {language === 'hi' ? 'दोहरा चैनल सक्रिय' : 'Dual-Channel Active'}
                    </span>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-28 h-28 rounded-2xl overflow-hidden bg-white relative shadow-sm flex-shrink-0 border border-outline-variant/40 p-1 flex items-center justify-center">
                      <img alt={title} className="w-full h-full object-contain" src={imageUrl} />
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-primary-container/90 text-on-primary text-[10px] font-bold">
                        Studio
                      </span>
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-primary leading-snug">
                        {(language === 'hi' && titleHi) ? titleHi : title}
                      </h2>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {language === 'hi' ? 'श्रेणी' : 'Category'}: {category} • {gemCategory}
                      </p>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-2xl font-bold text-secondary">₹{price.toLocaleString('en-IN')}</span>
                        <span className="text-xs text-on-surface-variant line-through">
                          ₹{Math.round(price * 1.4).toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {language === 'hi' ? '30% छूट' : '30% OFF'}
                        </span>
                      </div>
                      <span className="text-xs text-on-surface-variant font-mono mt-1">
                        {language === 'hi'
                          ? `GeM प्रमाणित • न्यूनतम आर्डर: ${moq} इकाइयां`
                          : `GeM Ready: Certified • MOQ: ${moq} units`}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 mt-5 bg-surface-container-low rounded-xl p-3 text-center border border-outline-variant/30">
                    <div className="flex flex-col items-center">
                      <span className="text-[11px] font-medium text-on-surface-variant">
                        {language === 'hi' ? 'शिपिंग' : 'Shipping'}
                      </span>
                      <span className="text-xs font-bold text-primary mt-0.5">
                        {language === 'hi' ? 'अखिल भारतीय निःशुल्क' : 'Free Pan-India'}
                      </span>
                    </div>
                    <div className="flex flex-col items-center border-x border-outline-variant/30">
                      <span className="text-[11px] font-medium text-on-surface-variant">
                        {language === 'hi' ? 'डिस्पैच समय' : 'Dispatch Time'}
                      </span>
                      <span className="text-xs font-bold text-primary mt-0.5">
                        {language === 'hi' ? '24-48 घंटे' : '24-48 Hours'}
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[11px] font-medium text-on-surface-variant">
                        {language === 'hi' ? 'कमीशन' : 'Commission'}
                      </span>
                      <span className="text-xs font-bold text-emerald-700 mt-0.5">
                        {language === 'hi' ? '0% सीधा' : '0% Direct'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-surface-container/60 flex items-center justify-between gap-3 border border-outline-variant/30">
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="material-symbols-outlined text-secondary text-[20px]">link</span>
                      <span className="text-xs text-on-surface-variant font-mono truncate">
                        kalasangam.in/s/ks-8492
                      </span>
                    </div>
                    <button
                      onClick={copyLink}
                      type="button"
                      className="px-3 py-1 bg-surface-container-lowest hover:bg-surface text-xs font-semibold rounded-lg border border-outline-variant/40 text-primary shadow-xs cursor-pointer"
                    >
                      {language === 'hi' ? 'कॉपी करें' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t border-outline-variant/30">
                  <button
                    className="flex-1 min-h-[44px] px-4 rounded-xl bg-surface-container text-on-surface font-semibold text-xs flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors shadow-xs"
                    type="button"
                    onClick={() => navigate('/catalog')}
                  >
                    <span className="material-symbols-outlined text-[18px]">storefront</span>
                    <span>{language === 'hi' ? 'दुकान में देखें' : 'View Catalog'}</span>
                  </button>
                  <button
                    className="flex-1 min-h-[44px] px-4 rounded-xl bg-primary text-on-primary font-semibold text-xs flex items-center justify-center gap-2 hover:bg-primary-container transition-colors shadow-sm"
                    type="button"
                    onClick={() => navigate('/capture')}
                  >
                    <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
                    <span>{language === 'hi' ? 'नया शिल्प जोड़ें' : 'Add Another Craft'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ── Right Column: Multi-Channel Linkages ── */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* WhatsApp Sharing Hub */}
              <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/50 p-6 shadow-sm flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#25D366]/15 flex items-center justify-center text-[#1e7e45]">
                      <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        chat
                      </span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-primary">
                        {language === 'hi' ? 'सीधा व्हाट्सएप साझा केंद्र' : 'Direct WhatsApp Sharing Hub'}
                      </h3>
                      <p className="text-xs text-on-surface-variant">
                        {language === 'hi'
                          ? 'स्थानीय ग्राहकों और कारीगर समूहों तक तुरंत पहुंचें'
                          : 'Reach recurring local patrons and village artisan collectives'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                    {language === 'hi' ? 'द्रुत बिक्री' : 'Fastest Sales'}
                  </span>
                </div>

                <button
                  onClick={shareWhatsApp}
                  className="w-full py-4 px-6 rounded-2xl bg-[#1e7e45] text-white flex items-center justify-between shadow-md hover:bg-[#19693a] active:scale-[0.99] transition-all group cursor-pointer"
                  id="share-whatsapp-btn"
                  type="button"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-[24px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                        send
                      </span>
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-base font-bold text-white tracking-wide leading-tight">
                        {language === 'hi' ? 'व्हाट्सएप पर शेयर करें' : 'Share to WhatsApp'}
                      </span>
                      <span className="text-xs text-white/90 leading-tight mt-0.5">
                        {language === 'hi'
                          ? `फ़ोटो, खुदरा मूल्य (₹${price}), व न्यूनतम मात्रा विवरण स्वतः चैट में जुड़ेंगे`
                          : `Pre-fills photo, retail price (₹${price}), and bulk MOQ details into chat`}
                      </span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[24px] text-white/90 group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </button>

                <div className="flex items-center justify-center gap-2 py-1 text-xs text-on-surface-variant bg-surface-container-low rounded-xl p-2">
                  <span className="material-symbols-outlined text-[18px] text-secondary">trending_up</span>
                  <span>
                    {language === 'hi' ? (
                      <>कारीगरों को व्हाट्सएप ग्रुप में शेयर करने पर <strong>3.4 गुना तेज़ी से</strong> ऑर्डर मिलते हैं।</>
                    ) : (
                      <>Artisans receive inquiries <strong>3.4x faster</strong> when shared directly in WhatsApp customer groups.</>
                    )}
                  </span>
                </div>
              </div>

              {/* ONDC Channel Card */}
              <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/50 p-6 shadow-sm flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="material-symbols-outlined text-[24px]">hub</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-base font-bold text-primary">
                          List on Open Network for Digital Commerce (ONDC)
                        </h3>
                        <span className="px-2 py-0.5 rounded-md bg-primary-container text-primary-fixed-dim text-[10px] font-bold uppercase tracking-wider">
                          Govt of India
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {language === 'hi'
                          ? 'ओएनडीसी नेटवर्क पर लाइव रखें • सभी प्रमुख उपभोक्ता ऐप्स पर दृश्यमान'
                          : 'Keep Live on ONDC Network • Seamless buyer discovery across major apps'}
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1" htmlFor="ondc-toggle">
                    <input
                      checked={ondcEnabled}
                      onChange={(e) => setOndcEnabled(e.target.checked)}
                      className="sr-only peer"
                      id="ondc-toggle"
                      type="checkbox"
                    />
                    <div className="w-11 h-6 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                  </label>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Discoverable across <strong className="text-primary font-semibold">Paytm, Mystore, PhonePe Pincode, Magicpin & Tata Neu</strong> automatically with zero added platform fee. Single unit retail orders route directly to your studio.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-outline-variant/30">
                  <span className="text-[11px] font-bold text-on-surface-variant mr-1">Active Connected Apps:</span>
                  <span className="px-3 py-1 rounded-full bg-surface-container text-on-surface text-xs font-semibold border border-outline-variant/40 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> Paytm
                  </span>
                  <span className="px-3 py-1 rounded-full bg-surface-container text-on-surface text-xs font-semibold border border-outline-variant/40 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span> Mystore
                  </span>
                  <span className="px-3 py-1 rounded-full bg-surface-container text-on-surface text-xs font-semibold border border-outline-variant/40 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-600"></span> PhonePe Pincode
                  </span>
                  <span className="px-3 py-1 rounded-full bg-surface-container text-on-surface text-xs font-semibold border border-outline-variant/40 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Magicpin
                  </span>
                  <span className="px-3 py-1 rounded-full bg-surface-container text-on-surface text-xs font-semibold border border-outline-variant/40 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span> Tata Neu
                  </span>
                </div>
              </div>

              {/* ── GeM Institutional & B2B Procurement Card ── */}
              <div className="bg-gradient-to-br from-[#121c24] to-[#1c2934] text-white rounded-2xl border border-[#2b3e50] p-6 shadow-md flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 shadow-sm border border-emerald-500/30">
                      <span className="material-symbols-outlined text-[24px]">account_balance</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-base font-bold text-white">
                          Government e-Marketplace (GeM) Institutional Linkage
                        </h3>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/40">
                          GeM Verified
                        </span>
                      </div>
                      <p className="text-xs text-[#9bb0c4] mt-0.5">
                        {language === 'hi' 
                          ? 'सरकारी ई-मार्केटप्लेस • संस्थागत थोक खरीद व सार्वजनिक टेंडर'
                          : 'Government e-Marketplace • Institutional Bulk Procurement & Public Sector Tenders'}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-600/90 text-white text-[11px] font-bold shadow-xs">
                    Live on GeM
                  </span>
                </div>

                <p className="text-xs text-[#d0dbe5] leading-relaxed">
                  Your craft is classified under the official <strong className="text-white font-semibold">{gemCategory}</strong> GeM catalogue. Eligible for direct order placement under the mandatory 25% public procurement quota from MSE artisans.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-[#101820] rounded-xl border border-[#2b3e50]">
                  <div>
                    <span className="text-[11px] font-medium text-[#9bb0c4] block">Institutional Wholesale Price</span>
                    <span className="text-base font-bold text-emerald-400 mt-0.5 block">
                      ₹ {wholesalePrice.toLocaleString('en-IN')} / unit
                    </span>
                  </div>
                  <div className="sm:border-x border-[#2b3e50] sm:px-3">
                    <span className="text-[11px] font-medium text-[#9bb0c4] block">Minimum Order Qty (MOQ)</span>
                    <span className="text-base font-bold text-white mt-0.5 block">{moq} Units Batch</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-[#9bb0c4] block">Guaranteed Batch Value</span>
                    <span className="text-base font-bold text-white mt-0.5 block">
                      ₹ {(wholesalePrice * moq).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/10">
                  <span className="text-[11px] font-bold text-[#9bb0c4] mr-1">Institutional Buyer Desks:</span>
                  <span className="px-3 py-1 rounded-full bg-[#101820] text-[#d0dbe5] text-xs font-semibold border border-white/10 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span> GeM 4.0 Portal
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#101820] text-[#d0dbe5] text-xs font-semibold border border-white/10 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span> TRIFED Tribal Direct
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#101820] text-[#d0dbe5] text-xs font-semibold border border-white/10 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span> Central Cottage Industries (CCIC)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Catalog Showcase */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/50 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[22px]">grid_view</span>
                <h3 className="text-base font-bold text-primary">
                  {language === 'hi' ? 'आपकी सक्रिय शिल्प दुकान' : 'Your Active Studio Catalog'}
                </h3>
              </div>
              <button
                onClick={() => navigate('/catalog')}
                className="text-xs font-bold text-secondary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{language === 'hi' ? 'सभी शिल्प देखें' : 'View All Catalog Items'}</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-xl bg-surface-container-low border-2 border-secondary/40 flex flex-col relative group">
                <div className="w-full h-36 rounded-lg overflow-hidden bg-white relative p-1 flex items-center justify-center">
                  <img
                    alt={title}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    src={imageUrl}
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                    {language === 'hi' ? 'अभी प्रकाशित' : 'Just Published'}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-primary mt-2 truncate">
                  {(language === 'hi' && titleHi) ? titleHi : title}
                </h4>
                <div className="flex items-center justify-between mt-1 text-xs">
                  <span className="font-bold text-secondary">₹{price.toLocaleString('en-IN')}</span>
                  <span className="text-on-surface-variant text-[11px]">
                    {language === 'hi' ? `न्यूनतम आर्डर: ${moq}` : `GeM MOQ: ${moq}`}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col group">
                <div className="w-full h-36 rounded-lg overflow-hidden bg-surface-container relative">
                  <img
                    alt="Terracotta Vase"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBBXVcOxFxwBEDIK0tQlH9EmtW8RrwrhO2BJsOCdii-dvPo1PaUJgypRxjyuo-cxircM61oBo9W0HM6jwknClyX17OFAO16oN4rTPkj1IvgR63oEfIzIrKYHpNpvVFI-SGcFtQM5yzYimFYBL9nZYvQuvq_l2bwI7A3nSDxruVj45Y84tpK_eDv16o-3Ev3yia0gaBXaFz7f8jIr4tLZXKCvSfhouiSOHCaY9s8I3txO-q_uMSeg6gx"
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-surface/90 text-primary text-[10px] font-bold">
                    {language === 'hi' ? 'मिट्टी कला' : 'Pottery'}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-primary mt-2 truncate">
                  {language === 'hi' ? 'हस्तनिर्मित टेराकोटा फूलदान' : 'Hand-carved Terracotta Vase'}
                </h4>
                <div className="flex items-center justify-between mt-1 text-xs">
                  <span className="font-bold text-secondary">₹850</span>
                  <span className="text-on-surface-variant text-[11px]">
                    {language === 'hi' ? '4 स्टॉक में' : '4 in stock'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col group">
                <div className="w-full h-36 rounded-lg overflow-hidden bg-surface-container relative">
                  <img
                    alt="Jute Tote"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuALVDefdl5uMsFe_V7uX6cplbhUNdecBGdjVi4gZ_WZITmIzbTKGGHmSxgfVfmsFOExt6ZpTB2uFtlPY4dEMcwlv0ICntXAfrwdLk5GG_HdPRs1DrasS2BHL1yEMKeovpkBlgXBoAFSCjWa3vI0uo2uhVu0nkxC7JgYEDNIK2L9AnUywuirLhpvhNiVegfbW5KUI79udVgCoVUKHL_EQ9dpUBVTaeSkK3E1m_yJmb32Pg6INj-JGne0"
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-surface/90 text-primary text-[10px] font-bold">
                    {language === 'hi' ? 'प्राकृतिक जूट' : 'Eco Fiber'}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-primary mt-2 truncate">
                  {language === 'hi' ? 'प्राकृतिक बुना हुआ जूट बैग' : 'Natural Braided Jute Tote'}
                </h4>
                <div className="flex items-center justify-between mt-1 text-xs">
                  <span className="font-bold text-secondary">₹620</span>
                  <span className="text-on-surface-variant text-[11px]">
                    {language === 'hi' ? '8 स्टॉक में' : '8 in stock'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col group">
                <div className="w-full h-36 rounded-lg overflow-hidden bg-surface-container relative">
                  <img
                    alt="Brass Diya"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCUWGiPORBN3hRVYrn_CFLtwfGgkO0QlyHsUyR5-TD7178ndv5oxEdXeXyjaZx4D723W-wVdotWoLKO46mQa-DnlxE8_6ANpKn95PZdMneb0bZQfedUFN25tN0_Bh1imU0KUPWDU6csA_Au0kAnzf_rNbtms38oEOJOws-FZumIrPWorDzcDfxYbF_B_N_-Cs9lxfTJwlKrNsNefaXL41tDwfnE56gagss2LymxGedouotskPBHW5Um"
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-surface/90 text-primary text-[10px] font-bold">
                    Metalcraft
                  </span>
                </div>
                <h4 className="text-xs font-bold text-primary mt-2 truncate">Engraved Peepal Brass Diya</h4>
                <div className="flex items-center justify-between mt-1 text-xs">
                  <span className="font-bold text-secondary">₹1,450</span>
                  <span className="text-on-surface-variant text-[11px]">2 in stock</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Floating Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#180f0a] text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-3 animate-bounce">
          <span className="material-symbols-outlined text-emerald-400 text-[20px]">check_circle</span>
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
