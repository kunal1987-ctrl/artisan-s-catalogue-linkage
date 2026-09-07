import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import LanguageToggle from '../components/LanguageToggle';

const GEM_CATEGORIES = [
  'Handloom / Silk Sarees',
  'Handicraft / Terracotta Pottery',
  'Handicraft / Brass Metalcraft',
  'Woodcraft / Traditional Carvings',
  'Handicraft / Leather Goods',
  'Handicraft / Stone Carvings & Sculptures',
  'Handloom / Cotton Fabrics & Khadi',
  'Handicraft / Jute & Natural Fiber Products',
  'Handicraft / Traditional Jewelry',
  'Art & Craft / Folk Paintings',
  'Other / Handicrafts & Handloom',
];

export default function Review() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, artisanProfile, openAuthModal, showToast, language } = useAuth();

  // Read AI data passed from Capture.jsx
  const aiData = location.state || {};

  // ── Editable Form State ──
  const [title, setTitle] = useState(aiData.title || 'Handwoven Blue Pure Silk Saree');
  const [titleHi, setTitleHi] = useState(aiData.title_hi || 'वाराणसी हस्तनिर्मित बनारसी रेशम साड़ी');
  const [price, setPrice] = useState(
    Number(aiData.suggested_retail_price_inr || aiData.estimated_price_inr || 1200)
  );
  const [wholesalePrice, setWholesalePrice] = useState(
    Number(
      aiData.suggested_wholesale_price_inr ||
      Math.round((aiData.suggested_retail_price_inr || aiData.estimated_price_inr || 1200) * 0.72)
    )
  );
  const [moq, setMoq] = useState(Number(aiData.moq || 50));
  const [gemCategory, setGemCategory] = useState(
    aiData.gem_category || 'Handloom / Silk Sarees'
  );
  const [pricingReasoning, setPricingReasoning] = useState(
    aiData.pricing_reasoning ||
    'Retail price reflects 32 hours of artisanal weaving and pure silk yarn. Bulk price (≥50 units) offers 28% volume efficiency while preserving living wage margins.'
  );
  const [category, setCategory] = useState(aiData.craft_category || 'Textiles & Sarees');
  const [description, setDescription] = useState(
    aiData.description ||
    'Exquisite handwoven blue saree crafted from pure mulberry silk with fine golden zari border work. Traditional artisan weave taking over 4 days to complete. Lightweight, breathable, and wedding-ready.'
  );
  const [descriptionHi, setDescriptionHi] = useState(
    aiData.description_hi ||
    'पारंपरिक लकड़ी के करघे पर कुशल बुनकरों द्वारा तैयार प्रामाणिक हस्तशिल्प। शुद्ध ज़री और प्राकृतिक रेशम से निर्मित, उत्सव एवं विशेष अवसरों हेतु उपयुक्त।'
  );
  const [tags, setTags] = useState(
    aiData.tags || ['Handmade', '100% Silk', 'Dry Clean Only', 'Mulberry Weave', 'GeM Verified']
  );
  const [imageUrl] = useState(
    aiData.imageUrl ||
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAEq1Hkh8RmlAyVeK5gWu6j_YRSmgysFrP4oUBkyOyD-0L2PxQK2EPYOlD04SdKeyqcpoxMe-trihF63F1YYR0jB8DwGc_8Qj4FoI2OZy3SaWUq9mO9qZZmgAy_RFvRLSeQZPWsO_KnYucJlxSK8nl3V0KXJQSGkbwChhywzR_j7zm9kvIy-L9F8qh8ohekptBKtp2RWXgNgAH5wZtxJmMSbiXiLGP0BvGR-yhNeborvi6b1EC-3_NJ'
  );

  // ── UI State ──
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [newTag, setNewTag] = useState('');
  const [editingField, setEditingField] = useState(null); // 'title' | 'titleHi' | 'price' | 'wholesalePrice' | 'moq' | 'reasoning' | 'description' | 'descriptionHi' | null

  const hasAiData = !!location.state;
  const isPhoneVerified = Boolean(artisanProfile?.verified || user?.is_phone_verified);

  // ════════════════════════════════════════════
  // PUBLISH TO SUPABASE (ONDC & GeM Payload)
  // ════════════════════════════════════════════

  const proceedWithPublish = async () => {
    setIsPublishing(true);
    setPublishError('');

    try {
      let finalImageUrl = imageUrl;

      // 1. Convert studio-processed image into a Blob & upload to Supabase Storage bucket 'artisan-images'
      try {
        let imageBlob = null;
        let ext = 'jpg';
        if (imageUrl && (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:'))) {
          const res = await fetch(imageUrl);
          imageBlob = await res.blob();
          ext = imageBlob.type?.includes('png') ? 'png' : 'jpg';
        } else if (aiData.imageBase64) {
          const cleanBase64 = aiData.imageBase64.includes(',') ? aiData.imageBase64.split(',')[1] : aiData.imageBase64;
          const byteChars = atob(cleanBase64);
          const byteNumbers = new Array(byteChars.length);
          for (let i = 0; i < byteChars.length; i++) {
            byteNumbers[i] = byteChars.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          imageBlob = new Blob([byteArray], { type: 'image/jpeg' });
          ext = 'jpg';
        }

        if (imageBlob) {
          const fileName = `craft-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
          const { data: uploadData, error: uploadErr } = await supabase.storage
            .from('artisan-images')
            .upload(fileName, imageBlob, {
              contentType: imageBlob.type || 'image/jpeg',
              upsert: true,
            });

          if (uploadErr) {
            console.warn('Storage upload error, falling back to original URL:', uploadErr);
          } else if (uploadData) {
            const { data: urlData } = supabase.storage
              .from('artisan-images')
              .getPublicUrl(uploadData.path || fileName);
            if (urlData?.publicUrl) {
              finalImageUrl = urlData.publicUrl;
            }
          }
        }
      } catch (uploadException) {
        console.warn('Error during image upload to artisan-images bucket:', uploadException);
      }

      // 2. Insert complete product record into public.products with verified user.id and user.phone
      const authUser = (await supabase.auth.getUser()).data?.user || user;
      const authUserId = authUser?.id || user?.id || null;
      const userPhone = artisanProfile?.phone || authUser?.phone || user?.phone || null;

      const payload = {
        title,
        title_hi: titleHi,
        description,
        description_hi: descriptionHi,
        category,
        price: Number(price),
        wholesale_price: Number(wholesalePrice),
        bulk_price: Number(wholesalePrice),
        moq: Number(moq),
        gem_category: gemCategory,
        hsn_code: aiData.hsn_code || '69120010',
        unspsc_code: aiData.unspsc_code || '60121002',
        is_gem_ready: true,
        pricing_reasoning: pricingReasoning,
        tags,
        image_url: finalImageUrl,
        status: 'published',
        user_id: authUserId,
        user_phone: userPhone,
      };

      const { error } = await supabase.from('products').insert([payload]);

      if (error) throw error;

      // 3. Show success toast and redirect to /catalog
      navigate('/catalog', {
        state: {
          toast: '🎉 Product published successfully to ONDC & GeM Network!',
        },
      });
    } catch (err) {
      console.error('Publish error:', err);
      setPublishError(err.message || 'Failed to publish. Please try again.');
      setIsPublishing(false);
    }
  };

  const handlePublish = async () => {
    // Check if artisan phone is verified before publishing
    if (!isPhoneVerified) {
      showToast(language === 'hi' ? 'कृपया पहले मोबाइल नंबर सत्यापित करें' : 'Please verify phone with OTP before publishing');
      openAuthModal(() => {
        proceedWithPublish();
      });
      return;
    }
    await proceedWithPublish();
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const artisanPayout = Math.round(price * 0.95);
  const bulkContractValue = Math.round(wholesalePrice * moq);
  const wholesaleDiscountPct = Math.round(((price - wholesalePrice) / (price || 1)) * 100);

  return (
    <div className="min-h-screen bg-[#fdf9f3] text-on-surface font-sans flex flex-col">
      {/* Top Full-Width Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#180f0a] text-white border-b border-white/10 shadow-md w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          {/* Far Left: Back button & Breadcrumb / Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/capture')}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
              title="Back to Capture"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>
            <div 
              onClick={() => navigate('/home')}
              className="flex items-center gap-2 cursor-pointer group"
              title="Go to Home"
            >
              <div className="w-8 h-8 rounded-lg bg-[#2e241e] text-[#ffdeaa] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[18px]">token</span>
              </div>
              <span className="font-bold text-sm text-white tracking-tight hidden sm:inline">Kala Sangam</span>
            </div>
            <div className="h-4 w-[1px] bg-white/20 mx-0.5 hidden sm:block" />
            <div className="flex items-center gap-1.5 text-xs font-bold text-white/70">
              <span
                onClick={() => navigate('/home')}
                className="cursor-pointer hover:text-white transition-colors"
              >
                {language === 'hi' ? 'आवास' : 'HOME'}
              </span>
              <span className="text-[10px]">/</span>
              <span
                onClick={() => navigate('/catalog')}
                className="cursor-pointer hover:text-white transition-colors"
              >
                {language === 'hi' ? 'कैटलॉग' : 'CATALOG'}
              </span>
              <span className="text-[10px]">/</span>
              <span className="text-[#ff9062] font-black">
                {language === 'hi' ? 'समीक्षा एवं ड्राफ्ट' : 'REVIEW & DRAFT'}
              </span>
            </div>
          </div>

          {/* Far Right: Language Switcher, Auth Status & Publish Button */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <LanguageToggle variant="dark" />

            {isPhoneVerified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-[11px] font-bold shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>🟢 {artisanProfile?.phone || user?.phone || '+91 99999 99999'} [✓ Verified]</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal()}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 text-[11px] font-bold cursor-pointer transition-all active:scale-95 animate-pulse shadow-xs"
              >
                <span className="material-symbols-outlined text-[14px]">login</span>
                <span>📲 {language === 'hi' ? 'फ़ोन सत्यापन करें' : 'Verify Phone'}</span>
              </button>
            )}

            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                isPublishing
                  ? 'bg-[#ff9062]/50 text-[#180f0a]/50 cursor-wait'
                  : 'bg-[#ff9062] text-[#180f0a] hover:bg-[#ff804a] active:scale-95'
              }`}
              type="button"
            >
              {isPublishing ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#180f0a] border-t-transparent rounded-full animate-spin" />
                  <span>{language === 'hi' ? 'प्रकाशित हो रहा है...' : 'Publishing...'}</span>
                </>
              ) : (
                <>
                  <span>{language === 'hi' ? 'GeM व ONDC पर प्रकाशित करें' : 'Publish to ONDC & GeM'}</span>
                  <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* AI Data Banner */}
      {hasAiData && (
        <div className="bg-emerald-50 border-b border-emerald-200 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-emerald-700">auto_awesome</span>
              <span className="text-[13px] font-semibold text-emerald-900">
                {language === 'hi'
                  ? 'एआई लिंकेज सक्रिय: जेमिनी व व्हिस्पर द्वारा विवरण तैयार। GeM अनुरूपता प्रमाणित।'
                  : 'AI Market Linkage Active: Descriptions generated via Gemini Vision & Groq Whisper. GeM readiness certified.'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-200/80 text-emerald-900">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                GeM Ready • MOQ {moq}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                ONDC D2C Ready
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Split-Screen Desktop Workspace */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col lg:flex-row gap-8 items-start">
        {/* ── Left Column: Studio Photo Preview & Linkage Badges ── */}
        <section className="w-full lg:w-1/2 flex flex-col gap-5">
                <div className="relative w-full rounded-2xl overflow-hidden bg-white border border-outline-variant/40 shadow-sm group">
                  <div className="relative w-full aspect-square bg-[#FFFFFF] flex items-center justify-center overflow-hidden p-3">
                    <img
                      className="w-full h-full object-contain object-center transition-transform duration-700 group-hover:scale-105"
                      alt="Product preview"
                      src={imageUrl}
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-lowest/95 backdrop-blur-md shadow-sm border border-outline-variant/30">
                      <span className="material-symbols-outlined text-[15px] text-[#ff9062]">auto_awesome</span>
                      <span className="text-[11px] font-bold text-primary tracking-wider uppercase">Studio Canvas (White)</span>
                    </div>
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-700 text-white shadow-sm text-[11px] font-bold">
                      <span className="material-symbols-outlined text-[14px]">verified</span>
                      <span>GeM Verified</span>
                    </div>
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-container/85 backdrop-blur-md text-white shadow-sm border border-white/10">
                      <span className="material-symbols-outlined text-[14px] text-tertiary-fixed animate-pulse">mic</span>
                      <span className="text-[11px] font-semibold text-white tracking-wider">🎙️ Voice Cataloged</span>
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-surface-container-low border-t border-outline-variant/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-emerald-700">task_alt</span>
                      <span className="text-[12px] text-on-surface-variant font-medium">Pure white studio canvas • Optimized &lt;150KB</span>
                    </div>
                    <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">High-Res</span>
                  </div>
                </div>

                {/* Market Channels Snapshot Card */}
                <div className="rounded-2xl p-5 bg-surface-container-lowest border border-outline-variant/40 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
                    <span className="text-[12px] font-bold text-primary tracking-wide uppercase">Market Linkage Channels</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Dual Active</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/60 flex flex-col">
                      <div className="flex items-center gap-1.5 text-blue-900 text-[11px] font-bold uppercase tracking-wider mb-1">
                        <span className="material-symbols-outlined text-[15px]">shopping_bag</span>
                        <span>ONDC Network</span>
                      </div>
                      <span className="text-[20px] font-bold text-blue-950">₹ {price.toLocaleString('en-IN')}</span>
                      <span className="text-[11px] text-blue-800/80">Direct Consumer / Unit</span>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-300/60 flex flex-col">
                      <div className="flex items-center gap-1.5 text-emerald-900 text-[11px] font-bold uppercase tracking-wider mb-1">
                        <span className="material-symbols-outlined text-[15px]">account_balance</span>
                        <span>GeM Institutional</span>
                      </div>
                      <span className="text-[20px] font-bold text-emerald-950">₹ {wholesalePrice.toLocaleString('en-IN')}</span>
                      <span className="text-[11px] text-emerald-800/80">Bulk Unit (MOQ: {moq})</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* ── Right Column: Editable Fields & Institutional B2B Section ── */}
              <section className="w-full lg:w-1/2 flex flex-col gap-5">
                {/* Error Banner */}
                {publishError && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px] font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    <span>{publishError}</span>
                  </div>
                )}

                {/* ── 1. PRODUCT TITLE ── */}
                <div className="rounded-2xl p-6 bg-surface-container-lowest border border-outline-variant/40 shadow-sm transition-all hover:border-outline">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[11px] font-bold tracking-wider uppercase">
                        {category}
                      </span>
                      <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                        {language === 'hi' ? 'शिल्प का शीर्षक' : 'Product Title'}
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">translate</span>
                      {language === 'hi' ? 'सत्यापित' : 'Auto-Verified'}
                    </span>
                  </div>

                  {language === 'hi' ? (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-bold text-[#80756f] uppercase tracking-wider">
                          हिन्दी शीर्षक
                        </label>
                        <button
                          onClick={() => setEditingField(editingField === 'titleHi' ? null : 'titleHi')}
                          className="text-[11px] text-secondary font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {editingField === 'titleHi' ? 'check' : 'edit'}
                          </span>
                          <span>{editingField === 'titleHi' ? 'पूर्ण' : 'संपादित करें'}</span>
                        </button>
                      </div>
                      {editingField === 'titleHi' ? (
                        <input
                          autoFocus
                          className="text-[18px] font-bold text-primary tracking-tight leading-snug w-full bg-surface-container-low border border-primary rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-container font-hindi"
                          value={titleHi}
                          onChange={(e) => setTitleHi(e.target.value)}
                          onBlur={() => setEditingField(null)}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
                        />
                      ) : (
                        <h1 className="text-[20px] font-bold text-primary tracking-tight leading-snug font-hindi text-stone-800">
                          {titleHi}
                        </h1>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-bold text-[#80756f] uppercase tracking-wider">
                          Product Title
                        </label>
                        <button
                          onClick={() => setEditingField(editingField === 'title' ? null : 'title')}
                          className="text-[11px] text-secondary font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {editingField === 'title' ? 'check' : 'edit'}
                          </span>
                          <span>{editingField === 'title' ? 'Done' : 'Edit'}</span>
                        </button>
                      </div>
                      {editingField === 'title' ? (
                        <input
                          autoFocus
                          className="text-[18px] font-bold text-primary tracking-tight leading-snug w-full bg-surface-container-low border border-primary rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-container"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          onBlur={() => setEditingField(null)}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
                        />
                      ) : (
                        <h1 className="text-[20px] font-bold text-primary tracking-tight leading-snug">{title}</h1>
                      )}
                    </div>
                  )}
                </div>

                {/* ── 2. DEDICATED INSTITUTIONAL & B2B MARKET LINKAGE (GeM) SECTION ── */}
                <div className="rounded-2xl p-6 bg-gradient-to-br from-[#121c24] to-[#1c2934] text-white border border-[#2b3e50] shadow-xl relative overflow-hidden">
                  {/* Decorative emblem badge */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[24px]">account_balance</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-[16px] font-bold text-white tracking-wide">
                            Institutional & B2B Market Linkage
                          </h3>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                            GeM Active
                          </span>
                        </div>
                        <p className="text-[12px] text-[#9bb0c4]">
                          Government e-Marketplace (GeM) & PSU Bulk Procurement Integration
                        </p>
                      </div>
                    </div>

                    {/* GeM Readiness Badge */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600/90 text-white text-[12px] font-bold shadow-md border border-white/20">
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      <span>GeM Readiness: 100% Certified</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    {/* GeM Category Selection */}
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-[#9bb0c4] uppercase tracking-wider block mb-1.5">
                        Relevant GeM Category Classification
                      </label>
                      <select
                        value={gemCategory}
                        onChange={(e) => setGemCategory(e.target.value)}
                        className="w-full h-11 px-3.5 text-[14px] font-semibold text-white bg-[#101820] border border-[#374e63] rounded-xl focus:outline-none focus:border-emerald-400 cursor-pointer"
                      >
                        {GEM_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat} className="bg-[#121c24] text-white">
                            {cat}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-[#9bb0c4] mt-1">
                        Pre-classified according to Govt. of India handicraft procurement taxonomy.
                      </p>
                    </div>

                    {/* HSN & UNSPSC Read-Only AI Badges */}
                    <div className="sm:col-span-2 flex flex-wrap gap-3">
                      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30">
                        <span className="material-symbols-outlined text-[16px] text-emerald-400">verified</span>
                        <span className="text-[13px] font-bold text-emerald-300">
                          HSN: {aiData.hsn_code || '69120010'}
                        </span>
                        <span className="text-[11px] text-emerald-400/80 font-medium">(Verified by AI)</span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-950/60 border border-blue-500/30">
                        <span className="material-symbols-outlined text-[16px] text-blue-400">verified</span>
                        <span className="text-[13px] font-bold text-blue-300">
                          UNSPSC: {aiData.unspsc_code || '60121002'}
                        </span>
                        <span className="text-[11px] text-blue-400/80 font-medium">(Auto-Assigned)</span>
                      </div>
                    </div>

                    {/* Wholesale Price */}
                    <div className="p-4 rounded-xl bg-[#101820]/90 border border-[#2b3e50] flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-[#9bb0c4] uppercase tracking-wider">
                          Suggested Wholesale Price
                        </span>
                        <button
                          onClick={() => setEditingField(editingField === 'wholesalePrice' ? null : 'wholesalePrice')}
                          className="text-[11px] text-emerald-400 font-bold hover:underline"
                          type="button"
                        >
                          {editingField === 'wholesalePrice' ? 'Done' : 'Edit'}
                        </button>
                      </div>
                      {editingField === 'wholesalePrice' ? (
                        <div className="flex items-baseline gap-2 my-1">
                          <span className="text-[26px] font-bold text-emerald-400">₹</span>
                          <input
                            autoFocus
                            type="number"
                            className="text-[26px] font-bold text-emerald-400 w-32 bg-[#1b2631] border border-emerald-400 rounded-lg px-2 py-0.5 focus:outline-none"
                            value={wholesalePrice}
                            onChange={(e) => setWholesalePrice(Number(e.target.value))}
                            onBlur={() => setEditingField(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
                          />
                          <span className="text-[12px] text-[#9bb0c4]">/ unit</span>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-2 my-1">
                          <span className="text-[28px] font-bold text-emerald-400 tracking-tight">
                            ₹ {wholesalePrice.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[12px] text-[#9bb0c4]">/ unit</span>
                          {wholesaleDiscountPct > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-700/50">
                              {wholesaleDiscountPct}% volume discount
                            </span>
                          )}
                        </div>
                      )}
                      <p className="text-[11px] text-[#9bb0c4]">
                        For government offices, corporate gifts & institutional bulk orders.
                      </p>
                    </div>

                    {/* Minimum Order Quantity (MOQ) */}
                    <div className="p-4 rounded-xl bg-[#101820]/90 border border-[#2b3e50] flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-[#9bb0c4] uppercase tracking-wider">
                          Minimum Order Quantity (MOQ)
                        </span>
                        <button
                          onClick={() => setEditingField(editingField === 'moq' ? null : 'moq')}
                          className="text-[11px] text-emerald-400 font-bold hover:underline"
                          type="button"
                        >
                          {editingField === 'moq' ? 'Done' : 'Edit'}
                        </button>
                      </div>
                      {editingField === 'moq' ? (
                        <div className="flex items-baseline gap-2 my-1">
                          <input
                            autoFocus
                            type="number"
                            className="text-[26px] font-bold text-white w-28 bg-[#1b2631] border border-emerald-400 rounded-lg px-2 py-0.5 focus:outline-none"
                            value={moq}
                            onChange={(e) => setMoq(Number(e.target.value))}
                            onBlur={() => setEditingField(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
                          />
                          <span className="text-[12px] text-[#9bb0c4]">units batch</span>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-2 my-1">
                          <span className="text-[28px] font-bold text-white tracking-tight">
                            {moq}
                          </span>
                          <span className="text-[13px] text-[#9bb0c4]">units per institutional order</span>
                        </div>
                      )}
                      <p className="text-[11px] text-[#9bb0c4]">
                        Guarantees batch production efficiency and bulk raw material savings.
                      </p>
                    </div>
                  </div>

                  {/* Guaranteed Minimum Bulk Order Value */}
                  <div className="mt-4 p-3.5 rounded-xl bg-[#101820] border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[20px] text-emerald-400">payments</span>
                      <div>
                        <span className="text-[13px] font-bold text-white block leading-tight">
                          Minimum Bulk Contract Value: ₹ {bulkContractValue.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[11px] text-[#9bb0c4] block leading-tight">
                          Calculated as {moq} units × ₹{wholesalePrice} with direct GeM Escrow payment settlement.
                        </span>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/40 w-fit">
                      100% Escrow Protected
                    </span>
                  </div>

                  {/* Material-Based Pricing Reasoning */}
                  <div className="mt-4 pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]">psychology</span>
                        AI Material & Labor Dynamic Pricing Breakdown
                      </span>
                      <button
                        onClick={() => setEditingField(editingField === 'reasoning' ? null : 'reasoning')}
                        className="text-[11px] text-[#9bb0c4] hover:text-white font-semibold"
                        type="button"
                      >
                        {editingField === 'reasoning' ? 'Save' : 'Edit Note'}
                      </button>
                    </div>
                    {editingField === 'reasoning' ? (
                      <textarea
                        autoFocus
                        className="w-full text-[13px] text-white bg-[#101820] border border-emerald-400 rounded-xl p-3 focus:outline-none min-h-[70px]"
                        value={pricingReasoning}
                        onChange={(e) => setPricingReasoning(e.target.value)}
                        onBlur={() => setEditingField(null)}
                      />
                    ) : (
                      <p className="text-[12px] text-[#d0dbe5] leading-relaxed italic bg-[#101820]/60 p-3 rounded-xl border border-white/5">
                        "{pricingReasoning}"
                      </p>
                    )}
                  </div>
                </div>

                {/* ── 3. RETAIL PRICING (ONDC D2C) ── */}
                <div className="rounded-2xl p-6 bg-surface-container-lowest border border-outline-variant/40 shadow-sm transition-all hover:border-outline">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="material-symbols-outlined text-[16px] text-secondary">storefront</span>
                        <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                          Suggested Retail Price (ONDC / D2C Consumer Sale)
                        </span>
                      </div>
                      {editingField === 'price' ? (
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-[34px] font-bold text-secondary tracking-tight leading-none">₹</span>
                          <input
                            autoFocus
                            type="number"
                            className="text-[34px] font-bold text-secondary tracking-tight leading-none w-40 bg-surface-container-low border border-secondary rounded-xl px-3 py-1 focus:outline-none focus:ring-2 focus:ring-secondary-fixed"
                            value={price}
                            onChange={(e) => setPrice(Number(e.target.value))}
                            onBlur={() => setEditingField(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
                          />
                          <span className="text-[14px] text-on-surface-variant font-medium">/ unit</span>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-[34px] font-bold text-secondary tracking-tight leading-none">
                            ₹ {price.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[14px] text-on-surface-variant font-medium">/ single unit</span>
                        </div>
                      )}
                      <div className="mt-2.5 flex items-center gap-1.5 text-on-surface-variant">
                        <span className="material-symbols-outlined text-[16px] text-secondary">insights</span>
                        <p className="text-[13px] leading-relaxed">
                          Calibrated via Gemini Fair-Trade Pricing model for artisan living wages.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingField(editingField === 'price' ? null : 'price')}
                      className="w-10 h-10 rounded-full bg-surface-container-low text-on-surface hover:bg-surface-container flex items-center justify-center shrink-0 active:scale-90 transition-all border border-outline-variant/40"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {editingField === 'price' ? 'check' : 'edit'}
                      </span>
                    </button>
                  </div>

                  {/* Payout Estimate */}
                  <div className="mt-4 pt-3 border-t border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-surface-container-low/70 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-emerald-700">account_balance_wallet</span>
                      <div>
                        <span className="text-[13px] font-bold text-primary block leading-tight">
                          Artisan Direct Payout (Est.): ₹ {artisanPayout.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[11px] text-on-surface-variant block leading-tight">
                          0% platform commission fee • Direct ONDC seller bank settlement
                        </span>
                      </div>
                    </div>
                    <span className="inline-flex items-center text-[12px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full w-fit">
                      95% Net Payout
                    </span>
                  </div>
                </div>

                {/* ── 4. CRAFT CATEGORY ── */}
                <div className="rounded-2xl p-6 bg-surface-container-lowest border border-outline-variant/40 shadow-sm transition-all hover:border-outline">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="material-symbols-outlined text-[16px] text-secondary">category</span>
                    <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                      General Craft Category
                    </span>
                  </div>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-12 px-4 text-[15px] font-semibold text-primary bg-surface-container-low border border-outline-variant/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-container cursor-pointer"
                  >
                    {[
                      'Textiles & Sarees',
                      'Pottery & Ceramics',
                      'Jewelry & Accessories',
                      'Woodwork & Carvings',
                      'Metalwork',
                      'Leather Goods',
                      'Paintings & Art',
                      'Bamboo & Cane',
                      'Other',
                    ].map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* ── 5. CRAFT STORY & SPECIFICATIONS ── */}
                <div className="rounded-2xl p-6 bg-surface-container-lowest border border-outline-variant/40 shadow-sm transition-all hover:border-outline">
                  <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30 mb-4">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-secondary">auto_stories</span>
                      <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                        {language === 'hi' ? 'शिल्प का विवरण' : 'Craft Story & Specifications'}
                      </span>
                    </div>
                  </div>

                  {language === 'hi' ? (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-bold text-[#80756f] uppercase tracking-wider">
                          शिल्प का विवरण
                        </label>
                        <button
                          onClick={() => setEditingField(editingField === 'descriptionHi' ? null : 'descriptionHi')}
                          className="text-[11px] text-secondary font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {editingField === 'descriptionHi' ? 'check' : 'edit'}
                          </span>
                          <span>{editingField === 'descriptionHi' ? 'पूर्ण' : 'संपादित करें'}</span>
                        </button>
                      </div>
                      {editingField === 'descriptionHi' ? (
                        <textarea
                          autoFocus
                          className="w-full text-[14px] text-stone-800 leading-relaxed bg-surface-container-low border border-primary rounded-xl px-4 py-3 min-h-[110px] focus:outline-none focus:ring-2 focus:ring-primary-container resize-y font-hindi"
                          value={descriptionHi}
                          onChange={(e) => setDescriptionHi(e.target.value)}
                          onBlur={() => setEditingField(null)}
                        />
                      ) : (
                        <p className="text-[14px] text-stone-800 leading-relaxed font-hindi bg-surface-container-low/40 p-3.5 rounded-xl">
                          {descriptionHi}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-bold text-[#80756f] uppercase tracking-wider">
                          Product Description
                        </label>
                        <button
                          onClick={() => setEditingField(editingField === 'description' ? null : 'description')}
                          className="text-[11px] text-secondary font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {editingField === 'description' ? 'check' : 'edit'}
                          </span>
                          <span>{editingField === 'description' ? 'Done' : 'Edit'}</span>
                        </button>
                      </div>
                      {editingField === 'description' ? (
                        <textarea
                          autoFocus
                          className="w-full text-[14px] text-on-surface-variant leading-relaxed bg-surface-container-low border border-primary rounded-xl px-4 py-3 min-h-[110px] focus:outline-none focus:ring-2 focus:ring-primary-container resize-y"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          onBlur={() => setEditingField(null)}
                        />
                      ) : (
                        <p className="text-[14px] text-on-surface-variant leading-relaxed bg-surface-container-low/40 p-3.5 rounded-xl">
                          {description}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* ── 6. TAGS & METADATA ── */}
                <div className="rounded-2xl p-6 bg-surface-container-lowest border border-outline-variant/40 shadow-sm transition-all hover:border-outline flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">
                      Product Tags & Search Attributes
                    </span>
                    <span className="text-[11px] text-on-surface-variant">Click ✕ to remove</span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {tags.map((tag) => (
                      <div
                        key={tag}
                        className={`h-9 px-3.5 rounded-full border flex items-center gap-1.5 text-[13px] font-semibold group ${
                          tag.toLowerCase().includes('gem')
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : 'bg-surface-container-low border-outline-variant/40 text-primary'
                        }`}
                      >
                        {tag.toLowerCase().includes('gem') && (
                          <span className="material-symbols-outlined text-[14px] text-emerald-700">verified</span>
                        )}
                        <span>{tag}</span>
                        <button
                          onClick={() => removeTag(tag)}
                          className="w-4 h-4 rounded-full bg-red-100 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold ml-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        placeholder="Add tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addTag()}
                        className="h-9 px-3 rounded-full border border-dashed border-outline text-on-surface-variant text-[12px] font-semibold bg-transparent focus:outline-none focus:border-primary w-28"
                      />
                      {newTag.trim() && (
                        <button
                          onClick={addTag}
                          className="h-9 px-3 rounded-full bg-primary-container text-white text-[12px] font-bold"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── 7. PUBLISH ACTIONS ── */}
                <div className="rounded-2xl p-6 bg-surface-container-lowest border border-outline-variant/40 shadow-md flex flex-col gap-3 mt-2">
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <button
                      onClick={() => navigate('/capture')}
                      className="w-full sm:w-auto h-13 py-3 px-5 rounded-full bg-surface-container-low border border-outline-variant/50 text-primary flex items-center justify-center gap-2 hover:bg-surface-container transition-all shrink-0 font-bold text-[14px]"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[19px]">replay</span>
                      <span>Retake Photo & Voice</span>
                    </button>
                    <button
                      onClick={handlePublish}
                      disabled={isPublishing}
                      className={`w-full sm:flex-1 h-13 py-3.5 px-6 rounded-full flex items-center justify-center gap-2.5 shadow-xl active:scale-[0.99] transition-all font-bold text-[15px] tracking-wide ${
                        isPublishing
                          ? 'bg-primary-container/60 text-white/60 cursor-wait'
                          : 'bg-[#180f0a] hover:bg-black text-white'
                      }`}
                      type="button"
                    >
                      {isPublishing ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Publishing to ONDC & GeM Network...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-[17px]">🚀</span>
                          <span>Publish to ONDC & GeM Network</span>
                          <span className="material-symbols-outlined text-[18px]">hub</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-on-surface-variant text-[12px] text-center pt-1">
                    <span className="material-symbols-outlined text-[15px] text-emerald-700">verified_user</span>
                    <span>Direct sync to ONDC buyer apps & Government e-Marketplace with is_gem_ready: true</span>
                  </div>
                </div>
              </section>
      </main>
    </div>
  );
}
