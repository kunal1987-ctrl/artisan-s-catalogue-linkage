import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Award, 
  Building2, 
  FileText, 
  ExternalLink, 
  Loader2, 
  AlertCircle, 
  Sparkles,
  ArrowRight,
  RefreshCw,
  Download,
  Lock,
  ChevronRight,
  BadgeCheck
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

const GOV_ID_TYPES = [
  {
    id: 'mosje',
    title: 'MoSJE Artisan ID',
    titleHi: 'MoSJE कारीगर पहचान पत्र',
    subtitle: 'Ministry of Social Justice & Empowerment',
    subtitleHi: 'सामाजिक न्याय एवं अधिकारिता मंत्रालय',
    placeholder: 'e.g. MSJE/2026/89412',
    demoId: 'MSJE/2026/89412',
    icon: 'account_balance',
    badge: 'MoSJE Accredited',
    color: 'from-amber-600 to-orange-700'
  },
  {
    id: 'pehchan',
    title: 'Pehchan Artisan Card',
    titleHi: 'पहचान कारीगर कार्ड (DC Handicrafts)',
    subtitle: 'Ministry of Textiles - Office of DC (Handicrafts)',
    subtitleHi: 'वस्त्र मंत्रालय - विकास आयुक्त (हस्तशिल्प)',
    placeholder: 'e.g. AR/RAJ/710294',
    demoId: 'AR/RAJ/710294',
    icon: 'badge',
    badge: 'DC Handicrafts',
    color: 'from-blue-600 to-indigo-700'
  },
  {
    id: 'udyam',
    title: 'Udyam Aadhaar (MSME)',
    titleHi: 'उद्यम आधार (MSME)',
    subtitle: 'Ministry of Micro, Small & Medium Enterprises',
    subtitleHi: 'सूक्ष्म, लघु एवं मध्यम उद्यम मंत्रालय',
    placeholder: 'e.g. UDYAM-RJ-02-0049210',
    demoId: 'UDYAM-RJ-02-0049210',
    icon: 'store',
    badge: 'MSME Registered',
    color: 'from-emerald-600 to-teal-700'
  }
];

export default function VerificationCenter() {
  const navigate = useNavigate();
  const { language = 'en' } = useLanguage();
  const { user, artisanProfile, showToast, updateGovVerification } = useAuth();

  const [selectedType, setSelectedType] = useState('mosje');
  const [govIdNumber, setGovIdNumber] = useState('');
  const [artisanCluster, setArtisanCluster] = useState('Jaipur Terracotta Cluster');
  const [consentChecked, setConsentChecked] = useState(true);

  // Verification processing states
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState(0);
  const [verificationError, setVerificationError] = useState('');
  
  // Stored verification state from profile
  const [verificationRecord, setVerificationRecord] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Check if profile is already verified
  useEffect(() => {
    let isMounted = true;
    async function loadVerificationStatus() {
      setIsLoadingProfile(true);
      try {
        const activeUserId = user?.id || localStorage.getItem('artisan_user_id');
        if (activeUserId) {
          const { data, error } = await supabase
            .from('profiles')
            .select('is_verified, gov_id_type, gov_id_number, verification_date, craft_category, region')
            .eq('id', activeUserId)
            .maybeSingle();

          if (!error && data && data.is_verified) {
            if (isMounted) {
              setVerificationRecord(data);
              if (data.gov_id_type) setSelectedType(data.gov_id_type);
              if (data.gov_id_number) setGovIdNumber(data.gov_id_number);
            }
          }
        }

        // Check fallback in artisanProfile or localStorage
        if (artisanProfile?.isGovVerified || localStorage.getItem('artisan_gov_verified') === 'true') {
          if (isMounted && !verificationRecord) {
            setVerificationRecord({
              is_verified: true,
              gov_id_type: localStorage.getItem('artisan_gov_id_type') || 'mosje',
              gov_id_number: localStorage.getItem('artisan_gov_id_number') || 'MSJE/2026/89412',
              verification_date: localStorage.getItem('artisan_gov_verification_date') || new Date().toISOString()
            });
          }
        }
      } catch (err) {
        console.warn('[VerificationCenter] Profile verification lookup notice:', err);
      } finally {
        if (isMounted) setIsLoadingProfile(false);
      }
    }

    loadVerificationStatus();
    return () => { isMounted = false; };
  }, [user, artisanProfile]);

  // Active Type metadata
  const currentTypeConfig = GOV_ID_TYPES.find(t => t.id === selectedType) || GOV_ID_TYPES[0];

  // Quick Demo ID Loader
  const handleApplyDemoId = (type) => {
    setSelectedType(type.id);
    setGovIdNumber(type.demoId);
    setVerificationError('');
  };

  // ── Verification Pipeline Simulation ──
  const handleVerifyCredential = async (e) => {
    e?.preventDefault();
    if (!govIdNumber.trim()) {
      setVerificationError(
        language === 'hi' 
          ? 'कृपया अपना वैध सरकारी पहचान क्रमांक दर्ज करें।' 
          : 'Please enter your government ID number.'
      );
      return;
    }
    if (!consentChecked) {
      setVerificationError(
        language === 'hi' 
          ? 'सत्यापन आगे बढ़ाने के लिए कृपया सहमति बॉक्स को चेक करें।' 
          : 'Please accept the consent terms to proceed with verification.'
      );
      return;
    }

    setIsVerifying(true);
    setVerificationError('');
    setVerificationStep(1);

    try {
      // Step 1: Secure Gateway Handshake
      await new Promise(r => setTimeout(r, 1000));
      setVerificationStep(2);

      // Step 2: Ministry Database Query
      await new Promise(r => setTimeout(r, 1200));
      setVerificationStep(3);

      // Step 3: Cryptographic Signature Validation
      await new Promise(r => setTimeout(r, 1000));

      const now = new Date().toISOString();
      const mockRef = `DIGI-${Math.floor(100000 + Math.random() * 900000)}-IN`;
      const activeUserId = user?.id || 'd3b07384-d113-4696-a885-3b984852d0b6';

      // ── Persist permanently in Supabase profiles table ──
      const { error: dbError } = await supabase
        .from('profiles')
        .upsert({
          id: activeUserId,
          is_verified: true,
          gov_id_type: selectedType,
          gov_id_number: govIdNumber.trim().toUpperCase(),
          verification_date: now,
          has_onboarded: true
        }, { onConflict: 'id' });

      if (dbError) {
        console.warn('[Verification] Supabase profiles upsert fallback notice:', dbError);
      }

      // Persist in localStorage for instant offline access
      localStorage.setItem('artisan_gov_verified', 'true');
      localStorage.setItem('artisan_gov_id_type', selectedType);
      localStorage.setItem('artisan_gov_id_number', govIdNumber.trim().toUpperCase());
      localStorage.setItem('artisan_gov_ref_id', mockRef);
      localStorage.setItem('artisan_gov_verification_date', now);

      // Update AuthContext if available
      if (updateGovVerification) {
        updateGovVerification({
          is_verified: true,
          gov_id_type: selectedType,
          gov_id_number: govIdNumber.trim().toUpperCase(),
          verification_date: now
        });
      }

      const verifiedPayload = {
        is_verified: true,
        gov_id_type: selectedType,
        gov_id_number: govIdNumber.trim().toUpperCase(),
        ref_id: mockRef,
        verification_date: now
      };

      setVerificationRecord(verifiedPayload);
      setIsVerifying(false);
      setVerificationStep(0);

      showToast?.(
        language === 'hi' 
          ? '🎉 सरकारी सत्यापन सफल! GeM एवं ONDC एक्सेस अनलॉक हो गया।' 
          : '🎉 Government Verification Complete! GeM & ONDC Access Unlocked.'
      );
    } catch (err) {
      console.error('[Verification] Error during verification simulation:', err);
      setIsVerifying(false);
      setVerificationStep(0);
      setVerificationError(
        language === 'hi'
          ? 'सत्यापन पोर्टल से संपर्क करने में असमर्थ। कृपया पुनः प्रयास करें।'
          : 'Unable to reach government verification gateway. Please try again.'
      );
    }
  };

  const handleResetVerification = () => {
    setVerificationRecord(null);
    setGovIdNumber('');
    localStorage.removeItem('artisan_gov_verified');
    localStorage.removeItem('artisan_gov_id_type');
    localStorage.removeItem('artisan_gov_id_number');
    localStorage.removeItem('artisan_gov_verification_date');
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-stone-900 pb-16">
      {/* ── Top Header Banner ── */}
      <div className="bg-[#18110d] text-white border-b border-[#2e211a] px-4 py-8 sm:px-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-[#ff9062]/20 text-[#ff9062] border border-[#ff9062]/30">
                {language === 'hi' ? 'राष्ट्रीय शिल्पकार सत्यापन' : 'National Artisan Verification'}
              </span>
              <span className="text-stone-400 text-xs">• MoSJE / GeM / ONDC</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <ShieldCheck className="w-8 h-8 text-[#ff9062]" />
              <span>
                {language === 'hi' 
                  ? 'सरकारी विक्रेता सत्यापन केंद्र' 
                  : 'Government Seller Verification Center'}
              </span>
            </h1>
            <p className="text-stone-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
              {language === 'hi'
                ? 'MoSJE आईडी, पहचान पत्र या उद्यम आधार से प्रमाणित होकर सीधे सरकारी निविदाओं (GeM) और ONDC पर थोक ऑर्डर प्राप्त करें।'
                : 'Authenticate with MoSJE ID, Pehchan Card or Udyam Aadhaar to unlock direct GeM Government Tenders and zero-commission ONDC institutional procurement.'}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-8 flex flex-col gap-8">
        {/* Loading Spinner */}
        {isLoadingProfile && (
          <div className="p-8 flex items-center justify-center gap-3 text-stone-500 text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-[#9c441c]" />
            <span>
              {language === 'hi' ? 'सत्यापन स्थिति जांची जा रही है...' : 'Checking verification record...'}
            </span>
          </div>
        )}

        {/* ── Case 1: ALREADY VERIFIED ARTISAN PROFILE ── */}
        {!isLoadingProfile && verificationRecord?.is_verified ? (
          <div className="flex flex-col gap-6 animate-in fade-in">
            {/* Official Digital Certificate Card - Light & Clean Government Portal Theme */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-md flex flex-col gap-6 text-gray-900">
              
              {/* Header: Badge & Artisan Details */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-green-50 border border-green-200 text-green-700 flex items-center justify-center shrink-0">
                    <Award className="w-8 h-8 sm:w-9 sm:h-9" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-semibold mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                      <span>{language === 'hi' ? 'सरकारी मान्यता प्राप्त शिल्पकार' : 'Government Accredited Artisan'}</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                      {artisanProfile?.name || (language === 'hi' ? 'प्रमाणित कारीगर' : 'Certified Artisan')}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                      {artisanCluster} • {currentTypeConfig.title}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-left sm:text-right w-full sm:w-auto">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 block">
                    Certificate ID
                  </span>
                  <span className="font-mono text-xs sm:text-sm font-bold text-gray-900">
                    GEM-ART-{verificationRecord.gov_id_number || '2026-9841'}
                  </span>
                </div>
              </div>

              {/* Simplified Stacked Metadata Card */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-gray-500 font-medium block">
                    {language === 'hi' ? 'दस्तावेज़ प्रकार' : 'ID Scheme'}
                  </span>
                  <span className="inline-block px-2.5 py-0.5 bg-white border border-gray-200 rounded-md text-xs font-bold text-gray-800 uppercase">
                    {verificationRecord.gov_id_type || selectedType || 'MoSJE'}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-gray-500 font-medium block">
                    {language === 'hi' ? 'पहचान क्रमांक' : 'ID Number'}
                  </span>
                  <span className="font-mono text-sm sm:text-base font-bold text-gray-900 block">
                    {verificationRecord.gov_id_number || govIdNumber || 'MSJE/2026/89412'}
                  </span>
                </div>

                <div className="space-y-1 sm:text-right">
                  <span className="text-xs text-gray-500 font-medium block">
                    {language === 'hi' ? 'सत्यापन स्थिति एवं तिथि' : 'Verification Status & Date'}
                  </span>
                  <div className="flex items-center sm:justify-end gap-1.5 text-sm font-semibold text-green-700">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span>Verified ({new Date(verificationRecord.verification_date || Date.now()).toLocaleDateString()})</span>
                  </div>
                </div>
              </div>

              {/* Simplified Privileges: Clean, Light Cards with Friendly Recognizable Icons */}
              <div className="pt-2 flex flex-col gap-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {language === 'hi' ? 'सक्रिय संस्थागत लाभ' : 'Unlocked Institutional Privileges'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">
                        {language === 'hi' ? 'GeM सरकारी निविदाएं' : 'GeM Public Tenders'}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        {language === 'hi' ? 'बिना न्यूनतम टर्नओवर सरकारी टेंडर में बोली लगाएं।' : 'Exempt from turnover thresholds for government orders.'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                      <BadgeCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">
                        {language === 'hi' ? 'ONDC प्राथमिकता रैंकिंग' : 'ONDC Buyer Badge'}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        {language === 'hi' ? 'सत्यापित बैज के साथ खरीदार ऐप्स पर शीर्ष लिस्टिंग।' : 'Gold verified badge on Paytm, Mystore & Pincode.'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">
                        {language === 'hi' ? 'डिजिटल प्रमाणिक QR' : 'Official QR Stamp'}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        {language === 'hi' ? 'प्रत्येक उत्पाद पर मुद्रित सरकारी सत्यापन सील।' : 'Verifiable authenticity QR on every exported catalog.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clean Sandbox Footer Box */}
              <div className="bg-gray-50 text-gray-500 text-xs py-2.5 px-4 rounded-lg border border-gray-100 flex flex-wrap items-center justify-between gap-2">
                <span>Ref ID: <strong className="font-mono text-gray-700 font-bold">{verificationRecord.ref_id || localStorage.getItem('artisan_gov_ref_id') || 'DIGI-749201-IN'}</strong></span>
                <span>Timestamp: {new Date(verificationRecord.verification_date || Date.now()).toLocaleString()}</span>
                <span>Issuer: <strong className="text-gray-700 font-medium">National Informatics Centre (NIC) Sandbox</strong></span>
              </div>

              {/* Primary & Secondary Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/capture')}
                  className="py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base shadow-sm flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-blue-200" />
                  <span>{language === 'hi' ? 'GeM कैटलॉग में नया शिल्प जोड़ें' : 'Create GeM Catalog Listing'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/orders')}
                  className="py-3.5 px-5 rounded-xl bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm border border-gray-300 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <span>{language === 'hi' ? 'संस्थागत ऑर्डर देखें' : 'View Institutional Orders'}</span>
                  <ArrowRight className="w-4 h-4 text-gray-500" />
                </button>

                <button
                  type="button"
                  onClick={handleResetVerification}
                  className="py-2.5 px-3.5 text-gray-500 hover:text-red-600 text-xs font-medium ml-auto transition cursor-pointer"
                >
                  {language === 'hi' ? 'आईडी बदलें / पुनः सत्यापित करें' : 'Update or Re-verify ID'}
                </button>
              </div>

            </div>
          </div>
        ) : (
          /* ── Case 2: UNVERIFIED FORM FLOW ── */
          !isLoadingProfile && (
            <div className="flex flex-col gap-8 animate-in fade-in">
              {/* Step 1: Select Government Scheme */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-extrabold text-base sm:text-lg text-stone-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#9c441c] text-white text-xs font-bold flex items-center justify-center">1</span>
                    <span>{language === 'hi' ? 'सरकारी पहचान योजना चुनें' : 'Select Government ID Scheme'}</span>
                  </h2>
                  <span className="text-xs text-stone-500">
                    {language === 'hi' ? 'तीनों में से कोई एक चुनें' : 'Choose any 1 credential'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {GOV_ID_TYPES.map((type) => {
                    const isSelected = selectedType === type.id;
                    return (
                      <div
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={`p-4 sm:p-5 rounded-3xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                          isSelected
                            ? 'border-[#9c441c] bg-[#fffaf5] shadow-md ring-2 ring-[#9c441c]/20'
                            : 'border-stone-200 bg-white hover:border-stone-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isSelected ? 'bg-[#9c441c] text-white' : 'bg-stone-100 text-stone-600'
                          }`}>
                            {type.badge}
                          </span>
                          <input
                            type="radio"
                            name="govIdScheme"
                            checked={isSelected}
                            onChange={() => setSelectedType(type.id)}
                            className="accent-[#9c441c] w-4 h-4 cursor-pointer mt-0.5"
                          />
                        </div>

                        <div>
                          <h3 className="font-bold text-sm text-stone-900">
                            {language === 'hi' ? type.titleHi : type.title}
                          </h3>
                          <p className="text-[11px] text-stone-500 mt-0.5">
                            {language === 'hi' ? type.subtitleHi : type.subtitle}
                          </p>
                        </div>

                        {/* Demo 1-Click Fill Badge */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplyDemoId(type);
                          }}
                          className="text-[11px] font-bold text-[#9c441c] hover:underline text-left flex items-center gap-1 cursor-pointer pt-1 border-t border-stone-100"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>{language === 'hi' ? `डेमो आईडी भरें: ${type.demoId}` : `Use Demo: ${type.demoId}`}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Credential Input Form */}
              <form onSubmit={handleVerifyCredential} className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm flex flex-col gap-6">
                <div className="flex items-center gap-2 border-b border-stone-100 pb-4">
                  <span className="w-6 h-6 rounded-full bg-[#9c441c] text-white text-xs font-bold flex items-center justify-center">2</span>
                  <h2 className="font-extrabold text-base sm:text-lg text-stone-900">
                    {language === 'hi' ? `${currentTypeConfig.titleHi} विवरण दर्ज करें` : `Enter ${currentTypeConfig.title} Details`}
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Gov ID Input */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 flex items-center justify-between">
                      <span>{language === 'hi' ? 'पहचान क्रमांक (ID Number)' : 'Credential / Card Number'}</span>
                      <span className="text-[11px] text-stone-400 font-normal">
                        Format: {currentTypeConfig.placeholder}
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={govIdNumber}
                        onChange={(e) => {
                          setGovIdNumber(e.target.value.toUpperCase());
                          setVerificationError('');
                        }}
                        placeholder={currentTypeConfig.placeholder}
                        disabled={isVerifying}
                        className="w-full px-4 py-3.5 rounded-2xl bg-stone-50 border border-stone-300 font-mono text-sm tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-[#9c441c] focus:bg-white transition-all disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyDemoId(currentTypeConfig)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        Demo ID
                      </button>
                    </div>
                  </div>

                  {/* Cluster Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700">
                      {language === 'hi' ? 'हस्तशिल्प क्लस्टर (Artisan Cluster)' : 'Artisan Cluster / Hub'}
                    </label>
                    <input
                      type="text"
                      value={artisanCluster}
                      onChange={(e) => setArtisanCluster(e.target.value)}
                      disabled={isVerifying}
                      className="w-full px-4 py-3 rounded-2xl bg-stone-50 border border-stone-300 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#9c441c] transition-all"
                    />
                  </div>

                  {/* Craft Category */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700">
                      {language === 'hi' ? 'शिल्प श्रेणी (Craft Discipline)' : 'Craft Discipline'}
                    </label>
                    <select
                      disabled={isVerifying}
                      className="w-full px-4 py-3 rounded-2xl bg-stone-50 border border-stone-300 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#9c441c] transition-all cursor-pointer"
                    >
                      <option>Terracotta & Pottery (मृत्तिका शिल्प)</option>
                      <option>Handloom & Zari Weaving (हथकरघा एवं ज़री)</option>
                      <option>Woodcarving & Marquetry (काष्ठ नक्काशी)</option>
                      <option>Brassware & Bell Metal (कांसा व पीतल शिल्प)</option>
                      <option>Blue Pottery (जयपुर ब्लू पॉटरी)</option>
                    </select>
                  </div>
                </div>

                {/* Consent Checkbox */}
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="govConsent"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    disabled={isVerifying}
                    className="accent-[#9c441c] w-4 h-4 rounded mt-0.5 cursor-pointer"
                  />
                  <label htmlFor="govConsent" className="text-xs text-stone-600 leading-relaxed cursor-pointer select-none">
                    {language === 'hi' 
                      ? 'मैं प्रमाणित करता/करती हूँ कि दी गई जानकारी सत्य है एवं शिल्प सेतु को नेशनल डेटाबेस (MoSJE / GeM / DigiLocker) से मेरे कारीगर क्रेडेंशियल सत्यापित करने की सहमति देता/देती हूँ।'
                      : 'I hereby declare that the credentials entered belong to my artisan enterprise and grant permission to Shilp Setu to verify my credentials with the Central Artisan Registry and GeM database.'}
                  </label>
                </div>

                {/* Error Banner */}
                {verificationError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-xs text-red-700">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{verificationError}</span>
                  </div>
                )}

                {/* Verification Progress Stepper */}
                {isVerifying && (
                  <div className="p-4 rounded-2xl bg-stone-900 text-white flex flex-col gap-3 shadow-md animate-in fade-in">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#ffdeaa] flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#ff9062]" />
                        <span>Connecting to Central Government Verification Gateway...</span>
                      </span>
                      <span className="font-mono text-stone-400">Step {verificationStep}/3</span>
                    </div>

                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-[#ff9062] h-full transition-all duration-300"
                        style={{ width: `${(verificationStep / 3) * 100}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-stone-400 italic">
                      {verificationStep === 1 && "Connecting to National e-Governance Gateway (API Setu)..."}
                      {verificationStep === 2 && `Querying Ministry of Textiles / MoSJE registry for ID: ${govIdNumber.trim().toUpperCase()}...`}
                      {verificationStep === 3 && "Validating DigiLocker cryptographic signature..."}
                    </p>
                  </div>
                )}

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full py-4 px-6 rounded-2xl bg-[#9c441c] hover:bg-[#803716] text-white font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{language === 'hi' ? 'सत्यापन किया जा रहा है...' : 'Verifying with Government Registry...'}</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      <span>
                        {language === 'hi'
                          ? 'क्रेडेंशियल सत्यापित करें एवं GeM/ONDC अनलॉक करें'
                          : 'Verify Credential & Unlock GeM/ONDC Access'}
                      </span>
                    </>
                  )}
                </button>
              </form>

              {/* Informational Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs flex flex-col gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-xs text-stone-900">
                    {language === 'hi' ? 'GeM सरकारी खरीद' : 'GeM Direct Access'}
                  </h4>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    {language === 'hi'
                      ? 'सरकारी कार्यालयों और मंत्रालयों से सीधे थोक आपूर्ति आदेश प्राप्त करें।'
                      : 'Sell directly to government departments with automatic MSME tender priority.'}
                  </p>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs flex flex-col gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-xs text-stone-900">
                    {language === 'hi' ? 'ONDC शून्य कमीशन' : 'ONDC Zero Brokerage'}
                  </h4>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    {language === 'hi'
                      ? 'बिना बिचौलियों के पूरे देश में खरीदारों तक सीधी पहुँच।'
                      : 'Verified sellers get zero platform fees and priority search indexing on ONDC.'}
                  </p>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs flex flex-col gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-800 flex items-center justify-center">
                    <Award className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-xs text-stone-900">
                    {language === 'hi' ? 'डिजिटल प्रमाण पत्र' : 'Official Digital Seal'}
                  </h4>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    {language === 'hi'
                      ? 'QR आधारित सत्यापन मुहर जो आपके हस्तशिल्प की प्रामाणिकता सिद्ध करती है।'
                      : 'QR-enabled authenticity verification seal generated for all cataloged crafts.'}
                  </p>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
