import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import i18n from '../i18n';
import { playInstructionAudio, unlockMobileAudio } from '../utils/soundPlayer';

// 16 Target Languages Configuration (+ English)
export const LANGUAGES = [
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', short: 'HI' },
  { code: 'en', name: 'English', native: 'English', short: 'EN' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', short: 'BN' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', short: 'MR' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', short: 'TE' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', short: 'TA' }
];

export const SUPPORTED_LANGUAGES = LANGUAGES;

// Key UI strings mapped across all 16+ languages (with Hindi/English fallback)
export const TRANSLATIONS = {
  // Navigation & Headers
  dashboard_title: {
    hi: 'शिल्पकार डैशबोर्ड',
    en: 'Artisan Dashboard',
    bn: 'কারিগর ড্যাশবোর্ড',
    ta: 'கைவினைஞர் டாஷ்போர்டு',
    te: 'శిల్పకారుడి డాష్బోర్డ్',
    mr: 'शिल्पकार डॅशबोर्ड',
    gu: 'કારીગર ડેશબોર્ડ',
    kn: 'ಕುಶಲಕರ್ಮಿ ಡ್ಯಾಶ್ಬೋರ್ಡ್',
    or: 'କାରିଗର ଡ୍ୟାସବୋର୍ଡ',
    pa: 'ਕਾਰੀਗਰ ਡੈਸ਼ਬੋਰਡ',
    ur: 'دستکاری ڈیش بورڈ',
    sa: 'शिल्पकार फलकम्',
    sat: 'ᱦᱩᱱᱟᱹᱨᱤᱭᱟᱹ ᱰᱮᱥᱵᱳᱨᱰ',
    sd: 'ڪاريگر ڊيش بورڊ',
    brx: 'आर्टिसान देसबर्ड',
    doi: 'शिल्पकार डैशबोर्ड',
    kok: 'शिल्पकार डॅशबोर्ड',
    ks: 'دستکار ڈیش بورڈ',
    mai: 'शिल्पकार डैशबोर्ड',
  },
  take_photo: {
    hi: 'उत्पाद की फोटो लें',
    en: 'Take Product Photo',
    bn: 'পণ্যের ছবি তুলুন',
    ta: 'தயாரிப்பு புகைப்படம் எடுக்கவும்',
    te: 'ఉత్పత్తి ఫోటో తీయండి',
    mr: 'उत्पादनाचा फोटो घ्या',
    gu: 'ઉત્પાદનનો ફોટો લો',
    kn: 'ಉತ್ಪನ್ನದ ಫೋಟೋ ತೆಗೆದುಕೊಳ್ಳಿ',
    or: 'ଉତ୍ପାଦର ଫଟୋ ଉଠାନ୍ତୁ',
    pa: 'ਉਤਪਾਦ ਦੀ ਫੋਟੋ ਲਵੋ',
    ur: 'پروڈکٹ کی تصویر لیں',
    sa: 'उत्पादस्य छायाचित्रं गृह्यताम्',
    sat: 'ᱡᱤᱱᱤᱥ ᱨᱮᱱᱟᱜ ᱯᱷᱚᱴᱳ ᱦᱟᱛᱟᱣ ᱢᱮ',
    sd: 'پراڊڪٽ جو فوٽو ڪڍو',
    brx: 'बेसादनो फोटो लानो',
    doi: 'चीज़ा दी फोटो खींचो',
    kok: 'वस्तूचो फोटो काढा',
    ks: 'چیزٕچ تصویر رٹِو',
    mai: 'सामान के फोटो खींची',
  },
  record_voice: {
    hi: 'बोलकर विवरण दें',
    en: 'Record Voice Description',
    bn: 'মুখে বলে বিবরণ দিন',
    ta: 'பேசி விவரிக்கவும்',
    te: 'మాట్లాడి వివరాలు ఇవ్వండి',
    mr: 'बोलून माहिती द्या',
    gu: 'બોલીને વિગત આપો',
    kn: 'ಮಾತನಾಡಿ ವಿವರಣೆ ನೀಡಿ',
    or: 'କହିକି ବିବରଣୀ ଦିଅନ୍ତୁ',
    pa: 'ਬੋਲ ਕੇ ਵੇਰਵਾ ਦਿਓ',
    ur: 'بول کر تفصیل دیں',
    sa: 'वदनेन विवरणं ददातु',
    sat: 'ᱨᱚᱲ ᱠᱟᱛᱮ ᱵᱤᱵᱚᱨᱚᱬ ᱮᱢ ᱢᱮ',
    sd: 'ڳالهائي تفصيل ڏيو',
    brx: 'बुंनानै सुबुंथि हर',
    doi: 'बोली ते दस्सो',
    kok: 'उलोवन माहिती दिया',
    ks: 'بٲتھ ؤنیو تفسیٖل',
    mai: 'बाज कऽ विवरण दिअ',
  },
  publish_ondc: {
    hi: 'ONDC / GeM पर प्रकाशित करें',
    en: 'Publish to ONDC / GeM',
    bn: 'ONDC / GeM-এ প্রকাশ করুন',
    ta: 'ONDC / GeM இல் வெளியிடவும்',
    te: 'ONDC / GeM లో ప్రచురించండి',
    mr: 'ONDC / GeM वर प्रकाशित करा',
    gu: 'ONDC / GeM પર પ્રકાશિત કરો',
    kn: 'ONDC / GeM ನಲ್ಲಿ ಪ್ರಕಟಿಸಿ',
    or: 'ONDC / GeM ରେ ପ୍ରକାଶ କରନ୍ତୁ',
    pa: 'ONDC / GeM ਤੇ ਪ੍ਰਕਾਸ਼ਿਤ ਕਰੋ',
    ur: 'ONDC / GeM پر شائع کریں',
    sa: 'ONDC / GeM मध्ये प्रकाशयतु',
    sat: 'ONDC / GeM ᱨᱮ ᱯᱟᱨᱥᱟᱞ ᱢᱮ',
    sd: 'ONDC / GeM تي شايع ڪريو',
    brx: 'ONDC / GeM आव फोसाव',
    doi: 'ONDC / GeM पर छापो',
    kok: 'ONDC / GeM चेर उजवाडाव',
    ks: 'ONDC / GeM پؠٹھ شائع کٔریو',
    mai: 'ONDC / GeM पर जारी करू',
  },
  packed_btn: {
    hi: 'सामान पैक हो गया',
    en: 'Mark as Packed',
    bn: 'পণ্য প্যাক করা হয়েছে',
    ta: 'பொருள் பேக் செய்யப்பட்டது',
    te: 'వస్తువు ప్యాక్ చేయబడింది',
    mr: 'सामान पॅक झाले',
    gu: 'માલ પેક થઈ ગયો',
    kn: 'ವಸ್ತು ಪ್ಯಾಕ್ ಆಗಿದೆ',
    or: 'ସାମଗ୍ରୀ ପ୍ୟାକ୍ ହୋଇଗଲା',
    pa: 'ਸਮਾਨ ਪੈਕ ਹੋ ਗਿਆ',
    ur: 'سامان پیک ہو گیا',
    sa: 'वस्तु संपुटीकृतम्',
    sat: 'ᱡᱤᱱᱤᱥ ᱯᱮᱠ ᱮᱱᱟ',
    sd: 'سامان پيڪ ٿي ويو',
    brx: 'बेसाद पेक जाबाय',
    doi: 'सामान पैक होई गेआ',
    kok: 'सामान पॅक जालें',
    ks: 'سامان گۆو پؠک',
    mai: 'सामान पैक भऽ गेल',
  },
  audio_instruction: {
    hi: 'अपनी स्थानीय भाषा में बोलकर उत्पाद की जानकारी जोड़ें।',
    en: 'Add product information by speaking in your local language.',
    bn: 'আপনার স্থানীয় ভাষায় বলে পণ্যের তথ্য যুক্ত করুন।',
    ta: 'உங்கள் தாய்மொழியில் பேசி தயாரிப்பு விவரங்களை சேர்க்கவும்.',
    te: 'మీ స్థానిక భాషలో మాట్లాడి ఉత్పత్తి వివరాలను జోడించండి.',
    mr: 'आपल्या स्थानिक भाषेत बोलून उत्पादनाची माहिती जोडा.',
    gu: 'તમારી સ્થાનિક ભાષામાં બોલીને ઉત્પાદનની માહિતી ઉમેરો.',
    kn: 'ನಿಮ್ಮ ಸ್ಥಳೀಯ ಭಾಷೆಯಲ್ಲಿ ಮಾತನಾಡಿ ಉತ್ಪನ್ನದ ವಿವರಗಳನ್ನು ಸೇರಿಸಿ.',
    or: 'ଆପଣଙ୍କ ମାତୃଭାଷାରେ କହି ଉତ୍ପାଦର ବିବରଣୀ ଯୋଡ଼ନ୍ତୁ।',
    pa: 'ਆਪਣੀ ਮਾਤ ਬੋਲੀ ਵਿੱਚ ਬੋਲ ਕੇ ਉਤਪਾਦ ਦੀ ਜਾਣਕਾਰੀ ਸ਼ਾਮਲ ਕਰੋ।',
    ur: 'अपनी مقامی زبان میں بول کر پروڈکٹ کی معلومات شامل کریں۔',
    sa: 'स्वमातृभाषायां वदित्वा उत्पादविवरणं योजयतु।',
    sat: 'ᱟᱢᱟᱜ ᱟᱭᱳ ᱟᱲᱟᱝ ᱛᱮ ᱨᱚᱲ ᱠᱟᱛᱮ ᱡᱤᱱᱤᱥ ᱨᱮᱱᱟᱜ ᱵᱤᱵᱚᱨᱚᱬ ᱡᱚᱲᱟᱣ ᱢᱮ ᱾',
    sd: 'پنهنجي مقامي ٻولي ۾ ڳالهائي پراڊڪٽ جي معلومات شامل ڪريو.',
    brx: 'गावनि रावजों बुंनानै बेसादनि फोरमान हर।',
    doi: 'अपनी मातृभाशा च बोली ते चीज़ा दी जानकारी दस्सो।',
    kok: 'तुमच्या मायभाशेन उलोवन वस्तूची माहिती जोडात.',
    ks: 'پنہِنجِہ مقٲمی زبانہِ منٛز ؤنیو چیزٕچ معلوٗمات۔',
    mai: 'अपना स्थानीय भाषा में बाज कऽ सामानक जानकारी जोड़ू।',
  },
  start_app: {
    hi: 'ऐप शुरू करें (Tap to Start)',
    en: 'Start App (Tap to Start)',
    bn: 'অ্যাপ শুরু করুন (Tap to Start)',
    ta: 'செயலியைத் தொடங்கவும் (Tap to Start)',
    te: 'యాప్‌ను ప్రారంభించండి (Tap to Start)',
    mr: 'ॲप सुरू करा (Tap to Start)',
    gu: 'ઍપ શરૂ કરો (Tap to Start)',
    kn: 'ಅಪ್ಲಿಕೇಶನ್ ಪ್ರಾರಂಭಿಸಿ (Tap to Start)',
    or: 'ଆପ୍ ଆରମ୍ଭ କରନ୍ତୁ (Tap to Start)',
    pa: 'ਐਪ ਸ਼ੁਰੂ ਕਰੋ (Tap to Start)',
    ur: 'ایپ شروع کریں (Tap to Start)',
    sa: 'अनुप्रयोगम् आरभत (Tap to Start)',
    sat: 'ᱮᱯ ᱮᱦᱚᱵ ᱢᱮ (Tap to Start)',
    sd: 'ايپ شروع ڪريو (Tap to Start)',
    brx: 'एप जागायनो (Tap to Start)',
    doi: 'ऐप शुरू करो (Tap to Start)',
    kok: 'ॲप सुरू करा (Tap to Start)',
    ks: 'ایپ شروٗع کٔریو (Tap to Start)',
    mai: 'ऐप शुरू करू (Tap to Start)',
  },
};

const LanguageContext = createContext({
  currentLang: 'hi',
  language: 'hi',
  languages: LANGUAGES,
  supportedLanguages: LANGUAGES,
  changeLanguage: () => {},
  setLanguage: () => {},
  setAppLanguage: () => {},
  t: (key) => key,
  isHindi: true,
  isAtmLanguageModalOpen: false,
  openAtmLanguageModal: () => {},
  closeAtmLanguageModal: () => {},
  currentLanguageConfig: LANGUAGES[0],
});

export function LanguageProvider({ children }) {
  const [currentLang, setCurrentLang] = useState(() => {
    try {
      const saved = localStorage.getItem('shilp_setu_lang') || localStorage.getItem('artisan_language');
      const baseCode = saved ? saved.split('-')[0] : 'hi';
      return LANGUAGES.some((l) => l.code === baseCode) ? baseCode : 'hi';
    } catch {
      return 'hi';
    }
  });

  const [isAtmLanguageModalOpen, setIsAtmLanguageModalOpen] = useState(false);

  // Mobile Safari & Android Chrome initial user-gesture audio unlocker
  useEffect(() => {
    const handleFirstGesture = () => {
      unlockMobileAudio();
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };
    window.addEventListener('click', handleFirstGesture, { passive: true });
    window.addEventListener('touchstart', handleFirstGesture, { passive: true });
    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };
  }, []);

  // Sync DOM document language attribute whenever currentLang changes
  useEffect(() => {
    try {
      document.documentElement.lang = currentLang;
      localStorage.setItem('shilp_setu_lang', currentLang);
      localStorage.setItem('i18nextLng', currentLang);
      localStorage.setItem('artisan_language', currentLang);
    } catch (e) {
      console.warn('[LanguageContext] Persistence warning:', e);
    }
  }, [currentLang]);

  // Listen to external i18n language changes to keep state reactive
  useEffect(() => {
    if (!i18n || typeof i18n.on !== 'function') return;
    const handleLanguageChanged = (lng) => {
      const baseCode = lng ? lng.split('-')[0] : 'hi';
      if (baseCode && baseCode !== currentLang && LANGUAGES.some((l) => l.code === baseCode)) {
        setCurrentLang(baseCode);
      }
    };
    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [currentLang]);

  const changeLanguage = useCallback((langCode) => {
    if (!langCode) return;
    const cleanCode = langCode.includes('-') ? langCode.split('-')[0] : langCode;

    // Ensure gesture is unlocked on mobile
    unlockMobileAudio();

    setCurrentLang(cleanCode);

    try {
      localStorage.setItem('shilp_setu_lang', cleanCode);
      localStorage.setItem('i18nextLng', cleanCode);
      localStorage.setItem('artisan_language', cleanCode);
      document.documentElement.lang = cleanCode;
      if (i18n && typeof i18n.changeLanguage === 'function') {
        i18n.changeLanguage(cleanCode);
      }
    } catch (err) {
      console.warn('[LanguageContext] storage warning:', err);
    }

    // Trigger local static audio file safely across mobile and web
    playInstructionAudio(cleanCode);
  }, []);

  const t = useCallback(
    (key, fallback) => {
      if (!key) return '';
      // 1. First priority: Try react-i18next dot-notation keys (e.g. 'nav.dashboard', 'capture.take_photo')
      if (i18n && typeof i18n.exists === 'function' && i18n.exists(key)) {
        return i18n.t(key, fallback);
      }
      // 2. Second priority: Check legacy dictionary TRANSLATIONS
      if (TRANSLATIONS[key]) {
        return TRANSLATIONS[key][currentLang] || TRANSLATIONS[key]['hi'] || fallback || key;
      }
      // 3. Fallback via i18n translation engine
      if (i18n && typeof i18n.t === 'function') {
        const val = i18n.t(key, fallback || key);
        if (val && val !== key) return val;
      }
      return fallback || key;
    },
    [currentLang]
  );

  const openAtmLanguageModal = useCallback(() => setIsAtmLanguageModalOpen(true), []);
  const closeAtmLanguageModal = useCallback(() => setIsAtmLanguageModalOpen(false), []);

  const currentLanguageConfig = useMemo(() => {
    return LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0];
  }, [currentLang]);

  const value = useMemo(
    () => ({
      currentLang,
      language: currentLang,
      languages: LANGUAGES,
      supportedLanguages: LANGUAGES,
      changeLanguage,
      setLanguage: changeLanguage,
      setAppLanguage: changeLanguage,
      t,
      isHindi: currentLang === 'hi',
      isAtmLanguageModalOpen,
      openAtmLanguageModal,
      closeAtmLanguageModal,
      currentLanguageConfig,
      i18n,
      unlockMobileAudio,
      playInstructionAudio,
    }),
    [
      currentLang,
      changeLanguage,
      t,
      isAtmLanguageModalOpen,
      openAtmLanguageModal,
      closeAtmLanguageModal,
      currentLanguageConfig,
    ]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
