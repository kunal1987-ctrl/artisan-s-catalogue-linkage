import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  Camera, 
  Package, 
  ShoppingBag, 
  ShieldCheck, 
  User, 
  MapPin, 
  Tag, 
  Loader2,
  IndianRupee,
  Landmark,
  Edit3,
  X
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

/**
 * Profile Component for Shilp Setu
 * A clean, high-contrast, government-standard profile hub for rural artisans.
 */
export default function Profile() {
  const navigate = useNavigate();
  const { user, artisanProfile: contextProfile, language, showToast } = useAuth?.() || {};
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone: '',
    profile_picture_url: '',
    craft_category: '',
    region: '',
    is_verified: false,
    gov_id_type: '',
    gov_id_number: ''
  });
  const [showGovIdDetails, setShowGovIdDetails] = useState(false);

  // ── Bank Details & Penny Drop Verification State ──
  const [bankAccount, setBankAccount] = useState(() => {
    const saved = localStorage.getItem('artisan_bank_details');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.accountNumber || parsed?.maskedNumber) return parsed;
      } catch (e) {
        // fallback
      }
    }
    return null;
  });

  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [pennyDropStep, setPennyDropStep] = useState(0); // 0 = idle, 1 = initiating, 2 = verifying name
  const [bankFormData, setBankFormData] = useState({
    accountHolder: '',
    accountNumber: '',
    ifsc: ''
  });
  const [bankFormError, setBankFormError] = useState('');

  // ── 1. Data Fetching (Supabase) ──
  useEffect(() => {
    let isMounted = true;

    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const { data: authData } = await supabase.auth.getUser();
        const currentUser = authData?.user || user;
        const activeUserId = currentUser?.id;

        if (!activeUserId) {
          // Fallback to local profile / context
          if (isMounted) {
            setProfileData({
              full_name: contextProfile?.name || localStorage.getItem('artisan_name') || 'रामचंद्र शर्मा (Ramchandra Sharma)',
              email: currentUser?.email || 'artisan.sharma@shilpsetu.gov.in',
              phone: contextProfile?.phone || currentUser?.phone || '+91 98290 12345',
              profile_picture_url: contextProfile?.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmvGYszZXuA45tASeKKSeAVzVfFnHtKAGtNsa4IB8eSEDv7aMN2Dj5pKYYgdmAj_qpHqPikrwnevchRmdRCCcuMRXPRl7fhyfOt-_XjOQic4K5XzVtP9-UCofnVEe570fnmUd_GNT4uQVrjHGKIIoPPyo1B2RZ4vXYFmloLyQfCyNa2hjDllGlTqYSywEQevMYAYPK6K6FMsX9YfKjc5nGMVc5iOINi_PYrPZd2lLY5bqH9AK1mI1L',
              craft_category: contextProfile?.craft || 'टेराकोटा एवं मृत्तिका शिल्प (Terracotta Pottery)',
              region: contextProfile?.hub || 'गोरखपुर, उत्तर प्रदेश (Gorakhpur, UP)',
              is_verified: localStorage.getItem('artisan_gov_verified') === 'true',
              gov_id_type: localStorage.getItem('artisan_gov_id_type') || 'MoSJE Beneficiary ID',
              gov_id_number: localStorage.getItem('artisan_gov_id_number') || 'MSJE/2026/89412'
            });
            setLoading(false);
          }
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name, name, email, phone, profile_picture_url, avatar, craft_category, craft, region, hub, is_verified, gov_id_type, gov_id_number')
          .eq('id', activeUserId)
          .maybeSingle();

        if (profile && isMounted) {
          const verified = Boolean(
            profile.is_verified || 
            localStorage.getItem('artisan_gov_verified') === 'true'
          );

          setProfileData({
            full_name: profile.full_name || profile.name || contextProfile?.name || currentUser?.user_metadata?.full_name || 'रामचंद्र शर्मा (Ramchandra Sharma)',
            email: profile.email || currentUser?.email || 'artisan.sharma@shilpsetu.gov.in',
            phone: profile.phone || currentUser?.phone || contextProfile?.phone || '+91 98290 12345',
            profile_picture_url: profile.profile_picture_url || profile.avatar || contextProfile?.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmvGYszZXuA45tASeKKSeAVzVfFnHtKAGtNsa4IB8eSEDv7aMN2Dj5pKYYgdmAj_qpHqPikrwnevchRmdRCCcuMRXPRl7fhyfOt-_XjOQic4K5XzVtP9-UCofnVEe570fnmUd_GNT4uQVrjHGKIIoPPyo1B2RZ4vXYFmloLyQfCyNa2hjDllGlTqYSywEQevMYAYPK6K6FMsX9YfKjc5nGMVc5iOINi_PYrPZd2lLY5bqH9AK1mI1L',
            craft_category: profile.craft_category || profile.craft || contextProfile?.craft || 'टेराकोटा एवं मृत्तिका शिल्प (Terracotta Pottery)',
            region: profile.region || profile.hub || contextProfile?.hub || 'गोरखपुर, उत्तर प्रदेश (Gorakhpur, UP)',
            is_verified: verified,
            gov_id_type: profile.gov_id_type || localStorage.getItem('artisan_gov_id_type') || 'MoSJE Beneficiary ID',
            gov_id_number: profile.gov_id_number || localStorage.getItem('artisan_gov_id_number') || 'MSJE/2026/89412'
          });
        }
      } catch (err) {
        console.warn('[Profile] Error loading profile from Supabase:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUserProfile();
    return () => { isMounted = false; };
  }, [user, contextProfile]);

  // ── Phase 2: Secure Profile Picture Upload (Supabase Storage & RLS) ──
  const uploadAvatar = async (event) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        const errorMsg = language === 'hi' 
          ? 'कृपया केवल छवि (JPG, PNG, WebP) फ़ाइल चुनें।' 
          : 'Please select an image file (JPG, PNG, WebP).';
        if (showToast) showToast(errorMsg);
        else alert(errorMsg);
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        const sizeMsg = language === 'hi'
          ? 'फ़ाइल का आकार 5MB से कम होना चाहिए।'
          : 'Image size must be less than 5MB.';
        if (showToast) showToast(sizeMsg);
        else alert(sizeMsg);
        return;
      }

      setUploadingPhoto(true);

      // 1. Grab authenticated user
      const { data: authData } = await supabase.auth.getUser();
      const currentUser = authData?.user || user;
      const activeUserId = currentUser?.id;

      if (!activeUserId) {
        // Fallback for unauthenticated/demo sessions
        const localPreview = URL.createObjectURL(file);
        setProfileData((prev) => ({ ...prev, profile_picture_url: localPreview }));
        localStorage.setItem('artisan_avatar', localPreview);
        if (showToast) {
          showToast(language === 'hi' ? '✅ प्रोफ़ाइल फ़ोटो पूर्वावलोकन सेट हो गया' : '✅ Profile picture updated (Demo mode)');
        }
        return;
      }

      // 2. Generate unique path matching RLS folder policy: ${user.id}/${Date.now()}.${fileExt}
      const fileExt = file.name.split('.').pop() || 'jpg';
      const filePath = `${activeUserId}/${Date.now()}.${fileExt}`;

      // 3. Upload file to 'avatars' bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('[uploadAvatar] Storage upload error:', uploadError);
        throw uploadError;
      }

      // 4. Retrieve public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = urlData?.publicUrl;
      if (!publicUrl) {
        throw new Error('Failed to retrieve public URL from avatars storage');
      }

      // 5. Database Update: Update profile_picture_url in profiles table
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ profile_picture_url: publicUrl })
        .eq('id', activeUserId);

      if (dbError) {
        console.warn('[uploadAvatar] Database update warning:', dbError);
      }

      // 6. State Update: Instant component rendering without refresh
      setProfileData((prev) => ({
        ...prev,
        profile_picture_url: publicUrl
      }));

      // Cache locally for instant loading across reloads
      localStorage.setItem('artisan_avatar', publicUrl);

      if (showToast) {
        showToast(language === 'hi' ? '✅ प्रोफ़ाइल फ़ोटो सफलतापूर्वक अपडेट हो गई' : '✅ Profile picture updated successfully');
      }
    } catch (error) {
      console.error('[uploadAvatar] Exception:', error);
      const errMsg = language === 'hi'
        ? `फ़ोटो अपलोड विफल: ${error.message || 'कृपया पुनः प्रयास करें।'}`
        : `Upload failed: ${error.message || 'Please try again.'}`;
      if (showToast) showToast(errMsg);
      else alert(errMsg);
    } finally {
      setUploadingPhoto(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  // ── 3. The "Penny Drop" Simulation (Form Submission) ──
  const handleBankSubmit = async (e) => {
    e.preventDefault();
    setBankFormError('');

    const holder = bankFormData.accountHolder.trim();
    const accNum = bankFormData.accountNumber.trim();
    const ifsc = bankFormData.ifsc.trim().toUpperCase();

    if (!holder || !accNum || !ifsc) {
      setBankFormError(
        language === 'hi'
          ? 'कृपया सभी विवरण भरें (नाम, खाता संख्या, IFSC)'
          : 'Please fill in all fields (Name, Account Number, IFSC)'
      );
      return;
    }

    if (accNum.length < 8 || !/^\d+$/.test(accNum)) {
      setBankFormError(
        language === 'hi'
          ? 'कृपया एक मान्य संख्यात्मक खाता संख्या दर्ज करें (कम से कम 8 अंक)'
          : 'Please enter a valid numeric account number (min 8 digits)'
      );
      return;
    }

    if (ifsc.length !== 11) {
      setBankFormError(
        language === 'hi'
          ? 'IFSC कोड 11 अक्षरों का होना चाहिए (उदा. SBIN0001234)'
          : 'IFSC code must be exactly 11 characters (e.g. SBIN0001234)'
      );
      return;
    }

    try {
      // Step 1: Change button text to "Initiating ₹1 Penny Drop Verification..." (Wait 1.5s)
      setPennyDropStep(1);
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Step 2: Change text to "Verifying account holder name with bank..." (Wait 1.5s)
      setPennyDropStep(2);
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Step 3: Update local state to show bank as added & verified
      let detectedBank = 'State Bank of India';
      const prefix = ifsc.slice(0, 4);
      if (prefix === 'SBIN') detectedBank = 'State Bank of India';
      else if (prefix === 'PUNB') detectedBank = 'Punjab National Bank';
      else if (prefix === 'HDFC') detectedBank = 'HDFC Bank';
      else if (prefix === 'ICIC') detectedBank = 'ICICI Bank';
      else if (prefix === 'BARB') detectedBank = 'Bank of Baroda';
      else if (prefix === 'CNRB') detectedBank = 'Canara Bank';
      else if (prefix === 'UBIN') detectedBank = 'Union Bank of India';

      const masked = `•••• ${accNum.slice(-4)}`;
      const verifiedBank = {
        bankName: detectedBank,
        accountHolder: holder,
        accountNumber: `${detectedBank} ${masked}`,
        rawAccountNumber: accNum,
        maskedNumber: masked,
        ifsc: ifsc,
        isVerified: true,
        verifiedAt: new Date().toISOString()
      };

      setBankAccount(verifiedBank);
      localStorage.setItem('artisan_bank_details', JSON.stringify(verifiedBank));

      // Structure code to seamlessly sync with Supabase profiles
      try {
        const { data: authData } = await supabase.auth.getUser();
        const activeUserId = authData?.user?.id || user?.id;
        if (activeUserId && activeUserId !== 'artisan_demo') {
          await supabase
            .from('profiles')
            .update({
              bank_account_holder: holder,
              bank_account_number: masked,
              bank_ifsc: ifsc,
              bank_name: detectedBank,
              is_bank_verified: true
            })
            .eq('id', activeUserId);
        }
      } catch (supaErr) {
        console.warn('[Profile] Supabase bank update notice:', supaErr);
      }

      setPennyDropStep(0);
      setIsBankModalOpen(false);

      if (showToast) {
        showToast(
          language === 'hi'
            ? '✅ ₹1 पेनी ड्रॉप सफल! बैंक खाता सत्यापित हो गया।'
            : '✅ ₹1 Penny Drop Successful! Bank account verified.'
        );
      }
    } catch (err) {
      console.error('[PennyDrop] Verification error:', err);
      setPennyDropStep(0);
      setBankFormError(
        language === 'hi' ? 'सत्यापन विफल रहा। पुनः प्रयास करें।' : 'Verification failed. Please try again.'
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-gray-500">
        <div className="flex items-center gap-2 font-medium text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <span>{language === 'hi' ? 'प्रोफ़ाइल लोड हो रही है...' : 'Loading artisan profile...'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        
        {/* Government Portal Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-xs text-gray-500 font-medium">
          <span onClick={() => navigate('/home')} className="hover:text-gray-900 cursor-pointer">
            {language === 'hi' ? 'मुख्य पृष्ठ' : 'Home'}
          </span>
          <span>/</span>
          <span className="text-gray-900 font-bold">
            {language === 'hi' ? 'कारीगर प्रोफ़ाइल' : 'Artisan Profile'}
          </span>
        </div>

        {/* ── 2. Profile Header (Identity & Transparency) ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6 flex items-center gap-6">
          
          {/* Profile Picture */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-full shadow-sm border-4 border-white bg-gray-100 overflow-hidden flex items-center justify-center ring-1 ring-gray-200 relative">
              {uploadingPhoto ? (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white p-2 text-center z-10 animate-in fade-in duration-150">
                  <Loader2 className="w-6 h-6 animate-spin text-white mb-1" />
                  <span className="text-[10px] font-semibold leading-tight text-white drop-shadow-xs">
                    {language === 'hi' ? 'अपलोड हो रहा है...' : 'Uploading...'}
                  </span>
                </div>
              ) : profileData.profile_picture_url ? (
                <img
                  src={profileData.profile_picture_url}
                  alt={profileData.full_name || 'Artisan Profile'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-gray-400" />
              )}
            </div>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={uploadAvatar}
              accept="image/*"
              className="hidden"
            />

            {/* Edit / Camera Overlay Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              title={language === 'hi' ? 'फ़ोटो बदलें (अपलोड)' : 'Change Photo (Upload)'}
              aria-label={language === 'hi' ? 'फ़ोटो बदलें' : 'Change Photo'}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition-all active:scale-90 border-2 border-white cursor-pointer hover:shadow-lg disabled:opacity-50"
            >
              {uploadingPhoto ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Artisan Identity Details */}
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-2xl font-bold text-gray-900">
                {profileData.full_name || 'Artisan Name'}
              </h2>

              {/* Minimalist Verified Artisan Badge */}
              <button
                type="button"
                onClick={() => setShowGovIdDetails((prev) => !prev)}
                title="Click to view DigiLocker verification details"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm cursor-pointer hover:bg-emerald-100 transition-colors"
              >
                <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>DigiLocker Verified</span>
              </button>
            </div>

            {/* Subtle Collapsed Details / Tooltip on Click */}
            {showGovIdDetails && (
              <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-lg bg-emerald-50/90 border border-emerald-200 text-xs text-emerald-900 w-fit animate-in fade-in shadow-xs">
                <span><span className="font-semibold text-emerald-700">ID:</span> <span className="font-mono font-bold">{profileData.gov_id_number || 'MSJE/2026/89412'}</span></span>
                <span className="text-emerald-300">•</span>
                <span><span className="font-semibold text-emerald-700">Scheme:</span> <span className="font-medium">{profileData.gov_id_type || 'MOSJE'}</span></span>
              </div>
            )}

            <p className="text-gray-500 font-medium">
              {profileData.email || profileData.phone || 'No contact info provided'}
            </p>
          </div>
        </div>

        {/* ── 3. Demographics & Verification Status Card ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mt-6 flex flex-col gap-4 text-gray-900">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              {language === 'hi' ? 'विवरण एवं सत्यापन स्थिति' : 'Artisan Details & Verification'}
            </h2>
            
            {/* Verification Status Badge */}
            {!profileData.is_verified && (
              <span className="inline-flex items-center gap-1.5 bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-1 rounded-full text-sm font-medium">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span>{language === 'hi' ? 'सत्यापन लंबित (Pending)' : 'Verification Pending'}</span>
              </span>
            )}
          </div>

          {/* Simple Label-Value Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-3.5 rounded-lg bg-gray-50 border border-gray-100 space-y-1">
              <span className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span>{language === 'hi' ? 'क्षेत्र / क्लस्टर' : 'Region'}</span>
              </span>
              <span className="font-semibold text-gray-900 block truncate">
                {profileData.region || 'Bhopal, Madhya Pradesh'}
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-gray-50 border border-gray-100 space-y-1">
              <span className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-gray-400" />
                <span>{language === 'hi' ? 'शिल्प श्रेणी' : 'Craft Category'}</span>
              </span>
              <span className="font-semibold text-gray-900 block truncate">
                {profileData.craft_category || 'Handicrafts & Pottery'}
              </span>
            </div>
          </div>

          {/* If verified, show ID number */}
          {profileData.is_verified && profileData.gov_id_number && (
            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-center justify-between">
              <span>{language === 'hi' ? 'शासकीय पहचान संख्या:' : 'Government ID Number:'}</span>
              <span className="font-mono font-bold text-gray-900">{profileData.gov_id_number}</span>
            </div>
          )}
        </div>

        {/* ── Bank Details for Payouts Card ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mt-6 flex flex-col gap-3.5 text-gray-900">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-blue-700" />
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                {language === 'hi' ? 'भुगतान के लिए बैंक विवरण' : 'Bank Details for Payouts'}
              </h2>
            </div>


          </div>

          {/* State 1: No Bank Added */}
          {!bankAccount ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {language === 'hi' ? 'कोई बैंक खाता नहीं जुड़ा है' : 'No bank account linked'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {language === 'hi'
                    ? 'ONDC व GeM बिक्री का भुगतान सीधे प्राप्त करने हेतु बैंक खाता जोड़ें'
                    : 'Link your bank account to receive direct ONDC and GeM payouts'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBankFormData({
                    accountHolder: profileData.full_name || '',
                    accountNumber: '',
                    ifsc: ''
                  });
                  setBankFormError('');
                  setPennyDropStep(0);
                  setIsBankModalOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer self-start sm:self-auto active:scale-95 flex items-center gap-1.5"
              >
                <span>+</span>
                <span>{language === 'hi' ? '+ बैंक खाता जोड़ें' : '+ Add Bank Account'}</span>
              </button>
            </div>
          ) : (
            /* State 2: Bank Added */
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <div className="space-y-1">
                <div className="text-base font-bold text-gray-900">
                  {bankAccount.accountNumber || `${bankAccount.bankName || 'State Bank of India'} ${bankAccount.maskedNumber || '•••• 8392'}`}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span>
                    IFSC: <strong className="font-mono text-gray-700">{bankAccount.ifsc}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    {language === 'hi' ? 'खाताधारक:' : 'Holder:'}{' '}
                    <strong className="text-gray-700">{bankAccount.accountHolder}</strong>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setBankFormData({
                    accountHolder: bankAccount.accountHolder || '',
                    accountNumber: bankAccount.rawAccountNumber || '',
                    ifsc: bankAccount.ifsc || ''
                  });
                  setBankFormError('');
                  setPennyDropStep(0);
                  setIsBankModalOpen(true);
                }}
                className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer self-start sm:self-auto flex items-center gap-1.5 active:scale-95"
              >
                <Edit3 className="w-3.5 h-3.5 text-gray-500" />
                <span>{language === 'hi' ? 'संशोधित करें (Edit)' : 'Edit'}</span>
              </button>
            </div>
          )}
        </div>

        {/* ── 4. Navigation Menu (Action Hub) ── */}
        <div className="mt-6 space-y-3">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
            {language === 'hi' ? 'त्वरित लिंक एवं प्रबंधन' : 'Quick Actions & Management'}
          </h2>

          {/* 1. My Catalog */}
          <div
            onClick={() => navigate('/catalog')}
            className="bg-white border border-gray-200 hover:bg-gray-50 p-4 rounded-xl flex items-center justify-between transition-colors cursor-pointer shadow-xs group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900 group-hover:text-blue-600 transition-colors">
                  My Catalog (मेरा कैटलॉग)
                </h3>
                <p className="text-xs text-gray-500">
                  {language === 'hi' ? 'उत्पाद विवरण एवं मूल्य प्रबंधित करें' : 'View, edit, and manage your craft listings'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-all" />
          </div>

          {/* 2. My Orders */}
          <div
            onClick={() => navigate('/orders')}
            className="bg-white border border-gray-200 hover:bg-gray-50 p-4 rounded-xl flex items-center justify-between transition-colors cursor-pointer shadow-xs group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900 group-hover:text-blue-600 transition-colors">
                  My Orders (मेरे ऑर्डर)
                </h3>
                <p className="text-xs text-gray-500">
                  {language === 'hi' ? 'ONDC व GeM से प्राप्त ऑर्डर देखें' : 'Track orders, shipments, and customer payments'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-all" />
          </div>

          {/* 3. Government Verification */}
          <div
            onClick={() => navigate('/verification')}
            className="bg-white border border-gray-200 hover:bg-gray-50 p-4 rounded-xl flex items-center justify-between transition-colors cursor-pointer shadow-xs group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900 group-hover:text-blue-600 transition-colors">
                  Government Verification (शासकीय सत्यापन)
                </h3>
                <p className="text-xs text-gray-500">
                  {language === 'hi' ? 'MoSJE, पहचान पत्र अथवा उद्यम आधार सत्यापन' : 'MoSJE ID, Pehchan card, or Udyam Aadhaar'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-all" />
          </div>

          {/* 4. Payments & Settlements */}
          <div
            onClick={() => navigate('/payments')}
            className="bg-white border border-gray-200 hover:bg-gray-50 p-4 rounded-xl flex items-center justify-between transition-colors cursor-pointer shadow-xs group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-green-50 border border-green-100 text-green-700 flex items-center justify-center shrink-0">
                <IndianRupee className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900 group-hover:text-blue-600 transition-colors">
                  Payments & Settlements (भुगतान एवं निपटान)
                </h3>
                <p className="text-xs text-gray-500">
                  {language === 'hi' ? '2% ONDC प्लेटफ़ॉर्म शुल्क विवरणी एवं बैंक जमा राशि' : 'Transparent 2% platform fee breakdown & bank payouts'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

      </div>

      {/* ── Add Bank Account Modal with Penny Drop Simulation ── */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2.5">
                <Landmark className="w-5 h-5 text-blue-700" />
                <h3 className="font-bold text-base text-gray-900">
                  {bankAccount
                    ? (language === 'hi' ? 'बैंक खाता विवरण संशोधित करें' : 'Edit Bank Account Details')
                    : (language === 'hi' ? 'नया बैंक खाता जोड़ें' : 'Add Bank Account')}
                </h3>
              </div>
              <button
                type="button"
                disabled={pennyDropStep > 0}
                onClick={() => setIsBankModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-200 text-gray-500 flex items-center justify-center cursor-pointer transition-colors disabled:opacity-30"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleBankSubmit} className="p-5 space-y-4">
              {bankFormError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{bankFormError}</span>
                </div>
              )}

              {/* 1. Account Holder Name */}
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  {language === 'hi' ? 'खाताधारक का नाम (Account Holder Name) *' : 'Account Holder Name *'}
                </label>
                <input
                  type="text"
                  required
                  disabled={pennyDropStep > 0}
                  value={bankFormData.accountHolder}
                  onChange={(e) => setBankFormData({ ...bankFormData, accountHolder: e.target.value })}
                  placeholder="e.g. Ramchandra Sharma"
                  className="w-full text-sm px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  {language === 'hi' ? 'बैंक पासबुक में दर्ज नाम के अनुसार' : 'Must match the name on your bank passbook'}
                </p>
              </div>

              {/* 2. Account Number */}
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  {language === 'hi' ? 'खाता संख्या (Account Number) *' : 'Account Number *'}
                </label>
                <input
                  type="text"
                  required
                  disabled={pennyDropStep > 0}
                  value={bankFormData.accountNumber}
                  onChange={(e) => setBankFormData({ ...bankFormData, accountNumber: e.target.value })}
                  placeholder="e.g. 309845218392"
                  className="w-full text-sm px-3.5 py-2.5 border border-gray-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  {language === 'hi' ? 'केवल अंक दर्ज करें (कम से कम 8 से 16 अंक)' : 'Enter 8 to 16 digits bank account number'}
                </p>
              </div>

              {/* 3. IFSC Code */}
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  {language === 'hi' ? 'IFSC कोड (IFSC Code) *' : 'IFSC Code *'}
                </label>
                <input
                  type="text"
                  required
                  maxLength={11}
                  disabled={pennyDropStep > 0}
                  value={bankFormData.ifsc}
                  onChange={(e) => setBankFormData({ ...bankFormData, ifsc: e.target.value.toUpperCase() })}
                  placeholder="e.g. SBIN0001234"
                  className="w-full text-sm px-3.5 py-2.5 border border-gray-300 rounded-lg font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  {language === 'hi' ? 'बैंक शाखा का 11 अक्षरों का कोड' : '11-character bank branch code'}
                </p>
              </div>

              {/* Penny Drop Explanation Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-[11px] text-blue-900 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <span>
                  {language === 'hi'
                    ? '₹1 पेनी ड्रॉप सत्यापन: बैंक खाते की सत्यता व खाताधारक की पुष्टि के लिए बैंक सर्वर से त्वरित लाइव सत्यापन किया जाता है।'
                    : '₹1 Penny Drop Verification: A live simulated ₹1 credit verifies account validity and confirms the registered beneficiary name directly with NPCI/Bank servers.'}
                </span>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  disabled={pennyDropStep > 0}
                  onClick={() => setIsBankModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors disabled:opacity-40"
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={pennyDropStep > 0}
                  className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-80 flex items-center gap-2"
                >
                  {pennyDropStep === 1 && (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>{language === 'hi' ? '₹1 पेनी ड्रॉप सत्यापन शुरू हो रहा है...' : 'Initiating ₹1 Penny Drop Verification...'}</span>
                    </>
                  )}
                  {pennyDropStep === 2 && (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>{language === 'hi' ? 'बैंक से खाताधारक का नाम सत्यापित हो रहा है...' : 'Verifying account holder name with bank...'}</span>
                    </>
                  )}
                  {pennyDropStep === 0 && (
                    <span>{language === 'hi' ? 'सत्यापित करें व जोड़ें' : 'Verify & Link Account'}</span>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
