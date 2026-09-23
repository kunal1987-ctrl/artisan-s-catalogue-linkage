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
  Phone, 
  Mail,
  Loader2
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

  // ── Profile Photo Upload Handler ──
  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const activeUserId = authData?.user?.id || user?.id || 'artisan_demo';
      const fileExt = file.name.split('.').pop() || 'jpg';
      const filePath = `avatars/${activeUserId}-${Date.now()}.${fileExt}`;

      // Upload to Supabase storage 'artisan-images'
      const { error: uploadErr } = await supabase.storage
        .from('artisan-images')
        .upload(filePath, file, { upsert: true });

      let publicUrl = '';
      if (!uploadErr) {
        const { data: urlData } = supabase.storage
          .from('artisan-images')
          .getPublicUrl(filePath);
        publicUrl = urlData?.publicUrl || '';
      }

      // If upload failed or local preview
      const resolvedUrl = publicUrl || URL.createObjectURL(file);

      // Update state
      setProfileData((prev) => ({ ...prev, profile_picture_url: resolvedUrl }));

      // Save to Supabase profile
      if (activeUserId && activeUserId !== 'artisan_demo') {
        await supabase
          .from('profiles')
          .update({ profile_picture_url: resolvedUrl })
          .eq('id', activeUserId);
      }

      if (showToast) {
        showToast(language === 'hi' ? '✅ प्रोफ़ाइल फ़ोटो अपडेट हो गई' : '✅ Profile picture updated');
      }
    } catch (err) {
      console.warn('[Profile] Photo upload notice:', err);
    } finally {
      setUploadingPhoto(false);
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
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          
          {/* Photo Section with Upload Button */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-full shadow-sm border-4 border-white bg-gray-100 overflow-hidden flex items-center justify-center ring-1 ring-gray-200">
              {profileData.profile_picture_url ? (
                <img
                  src={profileData.profile_picture_url}
                  alt={profileData.full_name}
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
              onChange={handlePhotoUpload}
              accept="image/*"
              className="hidden"
            />

            {/* Update Photo Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              title={language === 'hi' ? 'फ़ोटो बदलें' : 'Update Photo'}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition-transform active:scale-90 border-2 border-white cursor-pointer"
            >
              {uploadingPhoto ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Identity Info */}
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold uppercase tracking-wider mb-1">
              {language === 'hi' ? 'पंजीकृत कारीगर' : 'Registered Artisan'}
            </div>
            <h1 className="text-xl font-bold text-gray-900 truncate">
              {profileData.full_name}
            </h1>
            <div className="flex flex-col gap-1 text-xs text-gray-500">
              {profileData.phone && (
                <div className="flex items-center justify-center sm:justify-start gap-1.5 font-mono">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span>{profileData.phone}</span>
                </div>
              )}
              {profileData.email && (
                <div className="flex items-center justify-center sm:justify-start gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  <span className="truncate">{profileData.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 3. Demographics & Verification Status Card ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mt-6 flex flex-col gap-4 text-gray-900">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              {language === 'hi' ? 'विवरण एवं सत्यापन स्थिति' : 'Artisan Details & Verification'}
            </h2>
            
            {/* Verification Status Badge */}
            {profileData.is_verified ? (
              <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full text-sm font-medium">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>
                  {language === 'hi'
                    ? `सत्यापित (${profileData.gov_id_type || 'MoSJE'})`
                    : `Verified via ${profileData.gov_id_type || 'MoSJE'}`}
                </span>
              </span>
            ) : (
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
        </div>

      </div>
    </div>
  );
}
