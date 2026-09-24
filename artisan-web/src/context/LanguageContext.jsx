import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

// 16 Target Languages Configuration (+ English)
export const LANGUAGES = [
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', script: 'Devanagari', keyChar: 'अ' },
  { code: 'en', name: 'English', native: 'English', script: 'Latin', keyChar: 'A' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', script: 'Bengali', keyChar: 'অ' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', script: 'Telugu', keyChar: 'అ' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', script: 'Devanagari', keyChar: 'म' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', script: 'Tamil', keyChar: 'அ' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', script: 'Gujarati', keyChar: 'ગુ' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', script: 'Kannada', keyChar: 'ಕ' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ', script: 'Odia', keyChar: 'ଓ' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', script: 'Gurmukhi', keyChar: 'ਪ' },
  { code: 'sa', name: 'Sanskrit', native: 'संस्कृत', script: 'Devanagari', keyChar: 'सं' },
  { code: 'sat', name: 'Santali', native: 'संताली', script: 'Ol Chiki', keyChar: 'ᱥ' },
  { code: 'sd', name: 'Sindhi', native: 'سنڌي', script: 'Arabic', keyChar: 'س' },
  { code: 'ur', name: 'Urdu', native: 'اردو', script: 'Perso-Arabic', keyChar: 'ا' },
  { code: 'brx', name: 'Bodo', native: 'बड़ो', script: 'Devanagari', keyChar: 'ब' },
  { code: 'doi', name: 'Dogri', native: 'डोगरी', script: 'Devanagari', keyChar: 'डो' },
  { code: 'kok', name: 'Goan Konkani', native: 'गोवा कोंकणी', script: 'Devanagari', keyChar: 'कों' },
  { code: 'ks', name: 'Kashmiri', native: 'कश्मीरी', script: 'Perso-Arabic', keyChar: 'ک' },
  { code: 'mai', name: 'Maithili', native: 'मैथिली', script: 'Devanagari', keyChar: 'मै' },
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

  // Sync DOM document language attribute whenever currentLang changes
  useEffect(() => {
    try {
      document.documentElement.lang = currentLang;
      localStorage.setItem('shilp_setu_lang', currentLang);
      localStorage.setItem('artisan_language', currentLang);
    } catch (e) {
      console.warn('[LanguageContext] Persistence warning:', e);
    }
  }, [currentLang]);

  const changeLanguage = useCallback((langCode) => {
    if (!langCode) return;
    const cleanCode = langCode.includes('-') ? langCode.split('-')[0] : langCode;
    setCurrentLang(cleanCode);

    try {
      localStorage.setItem('shilp_setu_lang', cleanCode);
      localStorage.setItem('artisan_language', cleanCode);
      document.documentElement.lang = cleanCode;
    } catch (err) {
      console.warn('[LanguageContext] storage warning:', err);
    }

    // Audio Instruction Playback
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const instruction =
          TRANSLATIONS.audio_instruction[cleanCode] ||
          TRANSLATIONS.audio_instruction['hi'] ||
          '';

        if (instruction) {
          const utterance = new SpeechSynthesisUtterance(instruction);
          const ttsLang =
            cleanCode === 'hi' || cleanCode === 'doi' || cleanCode === 'mai' || cleanCode === 'brx' || cleanCode === 'kok'
              ? 'hi-IN'
              : `${cleanCode}-IN`;

          utterance.lang = ttsLang;
          utterance.rate = 0.85;

          const voices = window.speechSynthesis.getVoices();
          const targetVoice = voices.find(
            (v) =>
              v.lang === ttsLang ||
              v.lang.startsWith(cleanCode) ||
              v.lang.replace('_', '-').includes(ttsLang)
          );
          if (targetVoice) {
            utterance.voice = targetVoice;
          }

          window.speechSynthesis.speak(utterance);
        }
      } catch (audioErr) {
        console.warn('[LanguageContext] TTS instruction audio notice:', audioErr);
      }
    }
  }, []);

  const t = useCallback(
    (key, fallback) => {
      if (!key) return '';
      if (!TRANSLATIONS[key]) return fallback || key;
      return TRANSLATIONS[key][currentLang] || TRANSLATIONS[key]['hi'] || fallback || key;
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
