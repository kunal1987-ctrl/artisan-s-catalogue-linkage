import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from '../components/LanguageToggle';
import AudioMuteButton from '../components/AudioMuteButton';
import useAudioAssistant from '../hooks/useAudioAssistant';

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
  const { user, artisanProfile, isEmailVerified, openAuthModal, setPendingProduct, showToast, language } = useAuth();
  const { t } = useLanguage();
  const { speakPrompt, speak, stop } = useAudioAssistant();

  // Read AI data passed from Capture.jsx
  const aiData = location.state || {};
  const pricingMethod = aiData.pricing_method || aiData.pricingMethod || (aiData.pricing_reasoning?.includes('Market price estimated') ? 'smart_appraisal' : 'spoken');
  const isSmartAppraisal = pricingMethod === 'smart_appraisal';

  // Guard against navigating directly to review without craft data
  useEffect(() => {
    if (!location.state?.name && !location.state?.title && !location.state?.imageUrl) {
      navigate('/capture', { replace: true });
    }
  }, [location.state, navigate]);

  // Contextual voice prompt for zero-literacy review screen
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isSmartAppraisal) {
        if (language === 'hi') {
          speak('फोटो के आधार पर कीमत तय की गई है। आप चाहें तो इसे बदल सकते हैं।');
        } else {
          speak('Market price suggested based on your photo. You can edit this if needed.');
        }
      } else {
        speakPrompt('review');
      }
    }, 600);

    return () => {
      clearTimeout(timer);
      stop();
    };
  }, [speakPrompt, speak, stop, language, isSmartAppraisal]);

  // ── Editable Form State ──
  const resolvedInitialTitle = aiData.name || aiData.title || (language === 'hi' ? 'हस्तशिल्प उत्पाद' : 'Handcrafted Item');
  const resolvedInitialPrice = Number(aiData.price || aiData.suggested_retail_price_inr || aiData.estimated_price_inr || 0);
  const resolvedInitialCategory = aiData.material || aiData.craft_category || aiData.category || 'Handicrafts';

  const [title, setTitle] = useState(resolvedInitialTitle);
  const [titleHi, setTitleHi] = useState(aiData.title_hi || (aiData.name ? aiData.name : ''));
  const [price, setPrice] = useState(resolvedInitialPrice);
  const [wholesalePrice, setWholesalePrice] = useState(
    Number(
      aiData.suggested_wholesale_price_inr ||
      aiData.bulk_price ||
      Math.round(resolvedInitialPrice * 0.72)
    )
  );
  const [moq, setMoq] = useState(Number(aiData.moq || 1));
  const [stock, setStock] = useState(Number(aiData.stock || aiData.available_stock || 25));
  const [gemCategory, setGemCategory] = useState(
    aiData.gem_category || 'Handicrafts & Traditional Artware'
  );
  const [pricingReasoning, setPricingReasoning] = useState(
    aiData.pricing_reasoning ||
    `Fair artisan wage factored with expected price of ₹${resolvedInitialPrice} and volume discount for institutional orders.`
  );
  const [category, setCategory] = useState(resolvedInitialCategory);
  const [hsnCode, setHsnCode] = useState(aiData.hsn_code || '');
  const [description, setDescription] = useState(
    aiData.description || ''
  );
  const [descriptionHi, setDescriptionHi] = useState(
    aiData.description_hi || ''
  );
  const [tags, setTags] = useState(
    aiData.tags || ['Handmade', 'Artisan', 'GeM Ready']
  );
  const [imageUrl] = useState(
    aiData.imageUrl || ''
  );
  // Explicit craft upload states
  const [imageBlob, setImageBlob] = useState(null);
  const [base64String, setBase64String] = useState(null);
  const [audioTranscript, setAudioTranscript] = useState(null);

  // State Cleanup: Explicitly reset imageBlob, base64String, and audioTranscript to null on mount
  useEffect(() => {
    setImageBlob(null);
    setBase64String(null);
    setAudioTranscript(null);
  }, []);

  // ── UI State ──
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [newTag, setNewTag] = useState('');
  const [editingField, setEditingField] = useState(null); // 'title' | 'titleHi' | 'price' | 'wholesalePrice' | 'moq' | 'reasoning' | 'description' | 'descriptionHi' | null
  const [showAdvanced, setShowAdvanced] = useState(false);

  // ── Government Verification State (Gatekeeper for GeM / ONDC) ──
  const [isGovVerified, setIsGovVerified] = useState(() => {
    try {
      return (
        Boolean(user && !user.is_anonymous) ||
        localStorage.getItem('artisan_gov_verified') === 'true' ||
        Boolean(artisanProfile?.is_verified) ||
        Boolean(artisanProfile?.verified)
      );
    } catch {
      return false;
    }
  });
  const [govIdNumber, setGovIdNumber] = useState(() => {
    try {
      return localStorage.getItem('artisan_gov_id_number') || artisanProfile?.gov_id_number || '';
    } catch {
      return '';
    }
  });
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // Requirement 1: Fetch Verification Status on Mount from Supabase
  useEffect(() => {
    let isMounted = true;
    const fetchGovVerification = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const activeUserId = authData?.user?.id || user?.id;
        const isUserLoggedIn = Boolean(
          (authData?.user && !authData?.user?.is_anonymous) ||
          (user && !user?.is_anonymous)
        );

        if (isUserLoggedIn && isMounted) {
          setIsGovVerified(true);
        }

        if (!activeUserId) return;

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('is_verified, gov_id_number, gov_id_type')
          .eq('id', activeUserId)
          .maybeSingle();

        if (!error && profile && isMounted) {
          const verified = Boolean(profile.is_verified) || isUserLoggedIn;
          const idNum = profile.gov_id_number || '';
          setIsGovVerified(verified);
          if (idNum) setGovIdNumber(idNum);

          try {
            if (verified) {
              localStorage.setItem('artisan_gov_verified', 'true');
              if (idNum) localStorage.setItem('artisan_gov_id_number', idNum);
            }
          } catch {}
        }
      } catch (err) {
        console.warn('[Review] Error fetching government verification status:', err);
      }
    };

    fetchGovVerification();
    return () => { isMounted = false; };
  }, [user]);

  const hasAiData = !!location.state;
  const isVerified = Boolean(
    (user && !user.is_anonymous) ||
    isEmailVerified ||
    (user?.email && !user?.is_anonymous) ||
    artisanProfile?.verified ||
    artisanProfile?.is_verified ||
    (typeof window !== 'undefined' && (localStorage.getItem('artisan_verified_email') || localStorage.getItem('artisan_gov_verified') === 'true'))
  );

  // Any authenticated/logged-in user can publish products
  const canPublish = Boolean(isVerified || isGovVerified || (user && !user.is_anonymous));

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
      const rawUserId = authUser?.id || user?.id || null;
      const isValidUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
      const authUserId = isValidUuid(rawUserId) ? rawUserId : null;
      const userPhone = artisanProfile?.phone || authUser?.phone || user?.phone || null;

      const generateUuid = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      };

      const newProductId = generateUuid();

      const payload = {
        id: newProductId,
        title,
        title_hi: titleHi,
        hindi_title: titleHi,
        description,
        description_hi: descriptionHi,
        hindi_description: descriptionHi,
        category,
        price: Number(price),
        wholesale_price: Number(wholesalePrice),
        bulk_price: Number(wholesalePrice),
        moq: Number(moq),
        min_order_quantity: Number(moq),
        stock: Number(stock),
        make_in_india_percentage: 100,
        msme_exempt: true,
        gem_category: gemCategory,
        hsn_code: hsnCode || aiData.hsn_code || '970300',
        unspsc_code: aiData.unspsc_code || '60121002',
        is_gem_ready: true,
        craft_origin: 'India',
        pricing_reasoning: pricingReasoning,
        tags,
        image_url: finalImageUrl,
        status: 'published',
        artisan_id: authUserId,
        user_id: authUserId,
        user_phone: userPhone,
      };

      let insertedData = null;

      // Tier 1: Insert into 'products' table directly
      const { data: prodData, error: prodErr } = await supabase
        .from('products')
        .insert([payload])
        .select()
        .maybeSingle();

      if (!prodErr && prodData) {
        insertedData = prodData;
      } else {
        console.warn('Direct products insert attempt note:', prodErr?.message);
        // Tier 2: Try 'items' view
        const { data: itemData, error: itemErr } = await supabase
          .from('items')
          .insert([payload])
          .select()
          .maybeSingle();

        if (!itemErr && itemData) {
          insertedData = itemData;
        } else {
          console.warn('Items view insert attempt note:', itemErr?.message);
          // Tier 3: Core columns fallback (strips any schema cache conflicting fields)
          const corePayload = {
            id: newProductId,
            title,
            description,
            category,
            price: Number(price),
            wholesale_price: Number(wholesalePrice),
            bulk_price: Number(wholesalePrice),
            moq: Number(moq),
            stock: Number(stock),
            gem_category: gemCategory,
            hsn_code: hsnCode || aiData.hsn_code || '970300',
            unspsc_code: aiData.unspsc_code || '60121002',
            is_gem_ready: true,
            tags,
            image_url: finalImageUrl,
            status: 'published',
            artisan_id: authUserId,
            user_id: authUserId,
          };

          const { data: coreData, error: coreErr } = await supabase
            .from('products')
            .insert([corePayload])
            .select()
            .maybeSingle();

          if (coreErr) {
            console.error('All product insert tiers failed:', coreErr);
            throw coreErr;
          }
          insertedData = coreData;
        }
      }

      const finalizedId = insertedData?.id || payload.id;

      // State Cleanup: Explicitly reset imageBlob, base64String, and audioTranscript immediately after successful upload
      setImageBlob(null);
      setBase64String(null);
      setAudioTranscript(null);

      // Reset state and clear preserved pending state after successful publish
      setCategory('');
      setHsnCode('');
      if (setPendingProduct) setPendingProduct(null);
      try { sessionStorage.removeItem('artisan_pending_product'); } catch {}

      // 3. Navigate to celebratory /success screen with enhanced image and WhatsApp share details
      navigate('/success', {
        state: {
          ...payload,
          id: finalizedId,
          productId: finalizedId,
          title: payload.title || title,
          titleHi: payload.title_hi || titleHi,
          price: payload.price || price,
          wholesalePrice: payload.bulk_price || wholesalePrice,
          moq: payload.moq || moq,
          gemCategory: payload.gem_category || gemCategory,
          category: payload.category || category,
          imageUrl: finalImageUrl,
          enhancedImageUrl: finalImageUrl,
        },
      });
    } catch (err) {
      console.error('Publish error:', err);
      setPublishError(err.message || 'Failed to publish. Please try again.');
      setIsPublishing(false);
    }
  };

  const handlePublish = async () => {
    // Intercept publishing if user is not authenticated/verified
    if (!canPublish) {
      // 1. Preserve current reviewed product data across authentication
      const pendingData = {
        title,
        titleHi,
        price,
        wholesalePrice,
        moq,
        stock: Number(stock),
        gemCategory,
        pricingReasoning,
        category,
        hsnCode,
        description,
        descriptionHi,
        tags,
        imageUrl,
        aiData,
      };

      if (setPendingProduct) {
        setPendingProduct(pendingData);
      }
      try {
        sessionStorage.setItem('artisan_pending_product', JSON.stringify(pendingData));
      } catch {}

      showToast(
        language === 'hi'
          ? 'उत्पाद प्रकाशित करने के लिए कृपया पहले लॉगिन करें'
          : 'Please log in to publish your craft'
      );

      // 2. Open Auth Modal with post-verification auto-publish callback
      openAuthModal(() => {
        proceedWithPublish();
      });
      return;
    }

    await proceedWithPublish();
  };

  const handleOndcPublish = handlePublish;

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
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
          {/* Far Left: Back button & Breadcrumb / Logo */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => navigate('/capture')}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Back to Capture"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>
            <Link 
              className="flex items-center gap-2 group transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-lg p-1 shrink-0" 
              to="/"
            >
              <img 
                src="/shilp-setu-logo.png" 
                alt="Shilp Setu - Artisan Product Studio" 
                className="h-9 sm:h-11 w-auto object-contain drop-shadow-sm group-hover:drop-shadow-md transition-all duration-300"
                loading="eager"
              />
              {/* Screen-reader only text since the logo contains the typography */}
              <span className="sr-only">Shilp Setu Dashboard</span>
            </Link>
            <div className="h-4 w-[1px] bg-white/20 mx-0.5 hidden sm:block" />
            <div className="flex items-center gap-1.5 text-xs font-bold text-white/70 truncate">
              <span
                onClick={() => navigate('/home')}
                className="cursor-pointer hover:text-white transition-colors hidden sm:inline"
              >
                {language === 'hi' ? 'आवास' : 'HOME'}
              </span>
              <span className="text-[10px] hidden sm:inline">/</span>
              <span
                onClick={() => navigate('/catalog')}
                className="cursor-pointer hover:text-white transition-colors hidden sm:inline"
              >
                {language === 'hi' ? 'कैटलॉग' : 'CATALOG'}
              </span>
              <span className="text-[10px] hidden sm:inline">/</span>
              <span className="text-[#ff9062] font-black truncate">
                {language === 'hi' ? 'समीक्षा एवं ड्राफ्ट' : 'REVIEW & DRAFT'}
              </span>
            </div>
          </div>

          {/* Far Right: Audio Mute, Language Switcher & Publish Button */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <AudioMuteButton variant="light" />
            <LanguageToggle variant="dark" />

            {canPublish ? (
              <button
                onClick={handleOndcPublish}
                disabled={isPublishing}
                className={`bg-amber-600 hover:bg-amber-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-xs flex items-center gap-1.5 sm:gap-2 shadow-lg transition-all cursor-pointer ${
                  isPublishing ? 'opacity-60 cursor-wait' : 'active:scale-95'
                }`}
                type="button"
              >
                {isPublishing ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] text-[#ffdeaa] animate-pulse">auto_awesome</span>
                    <span className="hidden sm:inline">{language === 'hi' ? 'प्रकाशित हो रहा है...' : 'Publishing...'}</span>
                    <span className="sm:hidden">{language === 'hi' ? 'प्रतीक्षा...' : 'Saving...'}</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">{t('publish.btn_ondc', t('publish_ondc', 'Publish to ONDC / GeM'))}</span>
                    <span className="sm:hidden">{t('publish.btn_ondc', t('publish_ondc', 'Publish to ONDC / GeM'))}</span>
                    <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal(() => proceedWithPublish())}
                className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all cursor-pointer active:scale-95"
                title="Login to Publish"
              >
                <span className="material-symbols-outlined text-[16px]">login</span>
                <span>{language === 'hi' ? 'लॉगिन करें' : 'Login to Publish'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Friendly Notice Banner ── */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 w-full py-2.5 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-amber-600">auto_awesome</span>
            <span className="text-xs sm:text-sm font-semibold text-amber-950">
              {language === 'hi'
                ? 'उत्पाद की कीमत और विवरण तैयार हैं! समीक्षा करें और प्रकाशित करें।'
                : 'AI Price & Details estimated! Review your product below and publish.'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              ONDC & GeM Ready
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Simplified Content ── */}
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 flex-1">
        {publishError && (
          <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">error</span>
            <span>{publishError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ──── LEFT COLUMN (Visual & Price Spotlight) ──── */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Product Image Card */}
            <div className="bg-white rounded-2xl p-3 border border-stone-200 shadow-sm overflow-hidden">
              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-stone-100 flex items-center justify-center">
                <img
                  className="w-full h-full object-contain"
                  alt="Product preview"
                  src={imageUrl}
                />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-amber-400">
                    {isSmartAppraisal ? 'auto_awesome' : 'mic'}
                  </span>
                  <span>
                    {isSmartAppraisal
                      ? (language === 'hi' ? 'स्मार्ट एआई मूल्यांकन' : 'AI Appraised')
                      : (language === 'hi' ? 'आवाज़ से दर्ज' : 'Voice Cataloged')}
                  </span>
                </div>
              </div>
            </div>

            {/* Generated Price Spotlight Card */}
            <div className="bg-white rounded-2xl p-5 border-2 border-amber-500/30 shadow-sm flex flex-col gap-4 bg-gradient-to-b from-amber-50/40 to-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-amber-600">payments</span>
                  {language === 'hi' ? 'उत्पाद विक्रय मूल्य (Selling Price)' : 'Product Selling Price'}
                </span>
                <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-300">
                  {language === 'hi' ? 'प्रति इकाई' : 'Per Unit'}
                </span>
              </div>

              {/* Big Interactive Price Input */}
              <div className="flex items-center gap-2">
                <div className="flex-1 relative flex items-center">
                  <span className="absolute left-3.5 text-2xl font-black text-amber-800">₹</span>
                  <input
                    type="number"
                    min="1"
                    value={price}
                    onChange={(e) => {
                      const newP = Math.max(0, Number(e.target.value));
                      setPrice(newP);
                      setWholesalePrice(Math.round(newP * 0.72));
                    }}
                    className="w-full pl-9 pr-4 py-2.5 text-2xl sm:text-3xl font-black text-stone-900 bg-white border-2 border-amber-300 rounded-xl focus:border-amber-600 focus:outline-none transition-all shadow-inner"
                    placeholder="0"
                  />
                </div>
                {/* Quick adjustments */}
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const newP = price + 50;
                      setPrice(newP);
                      setWholesalePrice(Math.round(newP * 0.72));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs cursor-pointer transition"
                    title="+₹50"
                  >
                    +₹50
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const newP = Math.max(10, price - 50);
                      setPrice(newP);
                      setWholesalePrice(Math.round(newP * 0.72));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs cursor-pointer transition"
                    title="-₹50"
                  >
                    -₹50
                  </button>
                </div>
              </div>

              {/* Direct Payout Summary */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-emerald-700">account_balance_wallet</span>
                  <div>
                    <span className="font-bold text-emerald-950 block">
                      {language === 'hi' ? 'सीधा बैंक भुगतान' : 'Estimated Net Payout'}: ₹ {artisanPayout.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-emerald-800">
                      {language === 'hi' ? '0% प्लेटफॉर्म कमीशन • 95% सीधा आपके खाते में' : '0% platform fee • 95% direct to your bank'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Available Stock Card */}
            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-stone-600">inventory_2</span>
                  {language === 'hi' ? 'उपलब्ध स्टॉक (Available Quantity)' : 'Available Stock Quantity'}
                </span>
                <span className="text-[11px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
                  {stock} {language === 'hi' ? 'इकाइयां' : 'units'}
                </span>
              </div>

              {/* Large Stepper */}
              <div className="flex items-center justify-center gap-3 py-1">
                <button
                  type="button"
                  onClick={() => setStock((prev) => Math.max(1, (Number(prev) || 1) - 1))}
                  disabled={stock <= 1}
                  className="w-12 h-12 rounded-xl bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-800 disabled:opacity-30 font-bold text-2xl flex items-center justify-center cursor-pointer transition select-none"
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  max="9999"
                  value={stock}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setStock(isNaN(val) ? 1 : Math.max(1, val));
                  }}
                  className="w-20 h-12 text-center text-xl font-bold text-stone-900 bg-stone-50 border border-stone-300 rounded-xl focus:border-amber-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setStock((prev) => (Number(prev) || 0) + 1)}
                  className="w-12 h-12 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-2xl flex items-center justify-center cursor-pointer transition select-none"
                >
                  +
                </button>
              </div>

              {/* Quick preset chips */}
              <div className="flex items-center justify-center gap-1.5 pt-1">
                {[1, 5, 10, 25, 50].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setStock(preset)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      stock === preset
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ──── RIGHT COLUMN (Details, Advanced Toggle & Actions) ──── */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* Craft Details Card */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-sm flex flex-col gap-4">
              <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider pb-2 border-b border-stone-100 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-amber-600">edit_note</span>
                {language === 'hi' ? 'उत्पाद का विवरण (Product Information)' : 'Product Information'}
              </h2>

              {/* Product Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-700">
                  {language === 'hi' ? 'शिल्प का शीर्षक (Title)' : 'Product Title'}
                </label>
                <input
                  type="text"
                  value={language === 'hi' && titleHi ? titleHi : title}
                  onChange={(e) => {
                    if (language === 'hi') {
                      setTitleHi(e.target.value);
                    } else {
                      setTitle(e.target.value);
                    }
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-stone-900 font-bold text-base focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition"
                  placeholder="e.g. Handmade Terracotta Pottery"
                />
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-700">
                  {language === 'hi' ? 'शिल्प श्रेणी (Category)' : 'Craft Category'}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 font-semibold text-sm focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition cursor-pointer bg-white"
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
                    'Handicrafts',
                    'Other',
                  ].map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Description / Craft Story */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-700">
                  {language === 'hi' ? 'शिल्प का विवरण व कहानी (Description)' : 'Product Story & Description'}
                </label>
                <textarea
                  rows={4}
                  value={language === 'hi' && descriptionHi ? descriptionHi : description}
                  onChange={(e) => {
                    if (language === 'hi') {
                      setDescriptionHi(e.target.value);
                    } else {
                      setDescription(e.target.value);
                    }
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-stone-800 text-sm leading-relaxed focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition"
                  placeholder="Craft description..."
                />
              </div>
            </div>

            {/* Advanced / Wholesale Options (Collapsible) */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-stone-50 transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-stone-500">tune</span>
                  <span className="text-xs sm:text-sm font-bold text-stone-800">
                    {language === 'hi' ? 'थोक मूल्य व सरकारी GeM विवरण (ऐच्छिक)' : 'Wholesale, GeM & Tax Details (Optional)'}
                  </span>
                </div>
                <span className="material-symbols-outlined text-[18px] text-stone-500 transition-transform duration-200" style={{ transform: showAdvanced ? 'rotate(180deg)' : 'none' }}>
                  expand_more
                </span>
              </button>

              {showAdvanced && (
                <div className="p-5 pt-2 border-t border-stone-100 flex flex-col gap-4 bg-stone-50/50 animate-in fade-in">
                  <p className="text-[11px] text-stone-500">
                    {language === 'hi'
                      ? 'ये विवरण एआई द्वारा स्वतः भर दिए गए हैं। सरकारी खरीद और थोक आपूर्ति के लिए आवश्यकतानुसार बदलें।'
                      : 'These fields are pre-filled by AI. You can customize them for bulk government procurement.'}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Wholesale Price */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-stone-700">
                        {language === 'hi' ? 'थोक मूल्य (Wholesale Price ₹)' : 'Wholesale Price (₹)'}
                      </label>
                      <input
                        type="number"
                        value={wholesalePrice}
                        onChange={(e) => setWholesalePrice(Number(e.target.value))}
                        className="px-3 py-2 rounded-lg border border-stone-300 text-sm font-semibold bg-white"
                      />
                    </div>

                    {/* Minimum Order Quantity */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-stone-700">
                        {language === 'hi' ? 'न्यूनतम ऑर्डर मात्रा (MOQ)' : 'Min Order Qty (MOQ)'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={moq}
                        onChange={(e) => setMoq(Math.max(1, parseInt(e.target.value) || 1))}
                        className="px-3 py-2 rounded-lg border border-stone-300 text-sm font-semibold bg-white"
                      />
                    </div>

                    {/* HSN Code */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-stone-700">
                        {language === 'hi' ? 'कर कोड / HSN Code' : 'HSN Tax Code'}
                      </label>
                      <input
                        type="text"
                        value={hsnCode}
                        onChange={(e) => setHsnCode(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-stone-300 text-sm font-mono bg-white"
                        placeholder="e.g. 69120010"
                      />
                    </div>

                    {/* GeM Category */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-stone-700">
                        {language === 'hi' ? 'GeM श्रेणी' : 'GeM Portal Category'}
                      </label>
                      <select
                        value={gemCategory}
                        onChange={(e) => setGemCategory(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-stone-300 text-xs font-semibold bg-white"
                      >
                        {GEM_CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-col gap-1.5 pt-1">
                    <label className="text-xs font-semibold text-stone-700">
                      {language === 'hi' ? 'टैग (Tags)' : 'Tags & Keywords'}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((tag) => (
                        <span key={tag} className="px-2.5 py-1 rounded-md bg-stone-200 text-stone-800 text-xs font-medium flex items-center gap-1">
                          {tag}
                          <button type="button" onClick={() => removeTag(tag)} className="text-stone-500 hover:text-red-600">✕</button>
                        </span>
                      ))}
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          placeholder="Add..."
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addTag()}
                          className="px-2 py-1 text-xs border border-dashed border-stone-400 rounded-md w-20 bg-white"
                        />
                        {newTag.trim() && (
                          <button type="button" onClick={addTag} className="px-2 py-1 bg-stone-800 text-white text-xs rounded-md font-bold">
                            +
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ──── PUBLISH ACTIONS CARD ──── */}
            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-md flex flex-col gap-3.5">
              {canPublish ? (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium">
                  <span className="material-symbols-outlined text-[18px] text-emerald-700 shrink-0">verified</span>
                  <span>
                    {language === 'hi'
                      ? 'सत्यापित कारीगर — GeM और ONDC पर सीधे प्रकाशित करने के लिए तैयार।'
                      : 'Verified Artisan Account — Ready for direct publishing to GeM & ONDC.'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-amber-700 shrink-0">info</span>
                    <span>
                      {language === 'hi'
                        ? 'उत्पाद प्रकाशित करने के लिए कृपया अपने खाते में लॉगिन करें।'
                        : 'Please log in before publishing your product.'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAuthModal(() => proceedWithPublish())}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs cursor-pointer"
                  >
                    {language === 'hi' ? 'लॉगिन' : 'Login'}
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/capture')}
                  className="w-full sm:w-auto h-12 px-5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">replay</span>
                  <span>{language === 'hi' ? 'पुनः फोटो लें' : 'Retake Photo'}</span>
                </button>

                {canPublish ? (
                  <button
                    type="button"
                    onClick={handleOndcPublish}
                    disabled={isPublishing}
                    id="publish-bottom-btn"
                    className={`w-full sm:flex-1 h-12 px-6 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.99] cursor-pointer ${
                      isPublishing ? 'opacity-60 cursor-wait' : ''
                    }`}
                  >
                    {isPublishing ? (
                      <>
                        <span className="material-symbols-outlined text-[18px] animate-pulse">auto_awesome</span>
                        <span>{language === 'hi' ? 'प्रकाशित हो रहा है...' : 'Publishing to Network...'}</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                        <span>
                          {language === 'hi'
                            ? `उत्पाद प्रकाशित करें (₹ ${price.toLocaleString('en-IN')})`
                            : `Publish Product (₹ ${price.toLocaleString('en-IN')})`}
                        </span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => openAuthModal(() => proceedWithPublish())}
                    className="w-full sm:flex-1 h-12 px-6 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">login</span>
                    <span>{language === 'hi' ? 'प्रकाशित करने के लिए लॉगिन करें' : 'Login to Publish'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Optional Verification Modal ── */}
      {showVerificationModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full p-6 pb-8 sm:pb-6 shadow-2xl border border-gray-200 flex flex-col gap-4 text-gray-900 max-h-[90vh] overflow-y-auto transform transition-transform">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                <span className="material-symbols-outlined text-[26px]">verified_user</span>
              </div>
              <button
                type="button"
                onClick={() => setShowVerificationModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 flex items-center justify-center transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {language === 'hi' ? 'सत्यापन आवश्यक है (Verification Required)' : 'Verification Required'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                {language === 'hi'
                  ? 'सरकारी बाज़ारों (GeM/ONDC) पर कैटलॉग प्रकाशित करने के लिए आपका MoSJE/पहचान सत्यापित कारीगर होना अनिवार्य है।'
                  : 'Verification Required. You must be a verified MoSJE/Pehchan artisan to publish catalogs to government marketplaces.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowVerificationModal(false);
                  navigate('/verification');
                }}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition text-center cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{language === 'hi' ? 'प्रोफ़ाइल सत्यापित करें' : 'Complete Verification Now'}</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
              <button
                type="button"
                onClick={() => setShowVerificationModal(false)}
                className="w-full sm:w-auto py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition cursor-pointer"
              >
                {language === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
