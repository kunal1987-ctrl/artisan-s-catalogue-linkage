/**
 * audioInstructions.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Central configuration of pre-generated voice instructions for Shilp Setu.
 *
 * Supported Languages:
 *   - hi: Hindi (हिन्दी) — Primary Default
 *   - en: English
 *   - mr: Marathi (मराठी)
 *   - bn: Bengali (বাংলা)
 *   - te: Telugu (తెలుగు)
 *   - ta: Tamil (தமிழ்)
 *
 * Fallback Hierarchy:
 *   Selected Language ──> Hindi ('hi') ──> English ('en')
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const SUPPORTED_AUDIO_LANGUAGES = ['hi', 'en', 'mr', 'bn', 'te', 'ta'];
export const DEFAULT_AUDIO_LANGUAGE = 'hi';
export const FALLBACK_AUDIO_LANGUAGE = 'en';

export const AUDIO_INSTRUCTION_KEYS = {
  WELCOME: 'welcome',
  CAMERA_INSTRUCTION: 'camera_instruction',
  MULTIPLE_PHOTO_INSTRUCTION: 'multiple_photo_instruction',
  MIC_INSTRUCTION: 'mic_instruction',
  RECORDING_STARTED: 'recording_started',
  RECORDING_STOPPED: 'recording_stopped',
  PROCESSING_INSTRUCTION: 'processing_instruction',
  PRODUCT_GENERATED: 'product_generated',
  PRICE_INSTRUCTION: 'price_instruction',
  PRICE_GENERATED: 'price_generated',
  REVIEW_INSTRUCTION: 'review_instruction',
  PUBLISHING_INSTRUCTION: 'publishing_instruction',
  PUBLISHED_SUCCESSFULLY: 'published_successfully',
  GENERIC_ERROR: 'generic_error',
  NETWORK_ERROR: 'network_error',
};

// Critical instructions to preload on startup
export const CRITICAL_PRELOAD_KEYS = [
  AUDIO_INSTRUCTION_KEYS.WELCOME,
  AUDIO_INSTRUCTION_KEYS.CAMERA_INSTRUCTION,
];

export const AUDIO_INSTRUCTIONS = {
  [AUDIO_INSTRUCTION_KEYS.WELCOME]: {
    id: 'welcome',
    title: {
      hi: 'शिल्प सेतु में स्वागत',
      en: 'Welcome to Shilp Setu',
      mr: 'शिल्प सेतू मध्ये स्वागत',
      bn: 'শিল্প সেতুতে স্বাগতম',
      te: 'శిల్ప్ సేతుకు స్వాగతం',
      ta: 'ஷில்ப் சேதுவுக்கு வரவேற்பு',
    },
    transcripts: {
      hi: 'नमस्ते! शिल्प सेतु में आपका स्वागत है। अपने उत्पाद की फोटो खींचिए और उसके बारे में अपनी भाषा में बताइए।',
      en: 'Welcome to Shilp Setu. Take a photo of your product and describe it in your own language.',
      mr: 'नमस्ते! शिल्प सेतू मध्ये आपले स्वागत आहे. तुमच्या उत्पादनाचा फोटो काढा आणि त्याबद्दल तुमच्या भाषेत सांगा.',
      bn: 'নমস্কার! শিল্প সেতুতে আপনাকে স্বাগতম। আপনার পণ্যের ছবি তুলুন এবং আপনার নিজের ভাষায় বর্ণনা করুন।',
      te: 'నమస్కారం! శిల్ప్ సేతుకు స్వాగతం. మీ ఉత్పత్తి ఫోటో తీయండి మరియు మీ స్వంత భాషలో వివరించండి.',
      ta: 'வணக்கம்! ஷில்ப் சேதுவுக்கு உங்களை வரவேற்கிறோம். உங்கள் தயாரிப்பை புகைப்படம் எடுத்து உங்கள் சொந்த மொழியில் விவரிக்கவும்.',
    },
  },

  [AUDIO_INSTRUCTION_KEYS.CAMERA_INSTRUCTION]: {
    id: 'camera_instruction',
    title: {
      hi: 'फोटो निर्देश',
      en: 'Camera Instruction',
      mr: 'कॅमेरा सूचना',
      bn: 'ক্যামেরা নির্দেশিকা',
      te: 'కెమెరా సూచన',
      ta: 'கேமரா வழிகாட்டுதல்',
    },
    transcripts: {
      hi: 'कैमरा खोलिए और अपने उत्पाद की साफ फोटो लीजिए।',
      en: 'Open the camera and take a clear photo of your product.',
      mr: 'कॅमेरा उघडा आणि तुमच्या उत्पादनाचा स्पष्ट फोटो घ्या.',
      bn: 'ক্যামেরা খুলুন এবং আপনার পণ্যের পরিষ্কার ছবি তুলুন।',
      te: 'కెమెరాను తెరిచి మీ ఉత్పత్తి యొక్క స్పష్టమైన ఫోటో తీయండి.',
      ta: 'கேமராவைத் திறந்து உங்கள் தயாரிப்பின் தெளிவான புகைப்படத்தை எடுக்கவும்.',
    },
  },

  [AUDIO_INSTRUCTION_KEYS.MULTIPLE_PHOTO_INSTRUCTION]: {
    id: 'multiple_photo_instruction',
    title: {
      hi: 'अधिक फोटो निर्देश',
      en: 'Multiple Angles Instruction',
      mr: 'अनेक कोनातून फोटो',
      bn: 'একাধিক কোণ থেকে ছবি',
      te: 'వివిధ కోణాల ఫోటోలు',
      ta: 'பல கோணப் படங்கள்',
    },
    transcripts: {
      hi: 'उत्पाद के अलग-अलग कोणों से दो या तीन फोटो लीजिए।',
      en: 'Take two or three photos of your product from different angles.',
      mr: 'उत्पादनाचे वेगवेगळ्या कोनातून दोन किंवा तीन फोटो घ्या.',
      bn: 'বিভিন্ন কোণ থেকে আপনার পণ্যের দুটি বা তিনটি ছবি তুলুন।',
      te: 'విభిన్న కోణాల నుండి మీ ఉత్పత్తి యొక్క రెండు లేదా మూడు ఫోటోలను తీయండి.',
      ta: 'வெவ்வேறு கோணங்களில் இருந்து உங்கள் தயாரிப்பின் இரண்டு அல்லது மூன்று புகைப்படங்களை எடுக்கவும்.',
    },
  },

  [AUDIO_INSTRUCTION_KEYS.MIC_INSTRUCTION]: {
    id: 'mic_instruction',
    title: {
      hi: 'माइक निर्देश',
      en: 'Microphone Instruction',
      mr: 'माइक सूचना',
      bn: 'মাইক নির্দেশিকা',
      te: 'మైక్ సూచన',
      ta: 'மைக் வழிகாட்டுதல்',
    },
    transcripts: {
      hi: 'अब अपने उत्पाद के बारे में अपनी भाषा में बताइए। आप बोलकर सब कुछ बता सकते हैं।',
      en: 'Now tell us about your product in your language. You can speak and describe everything.',
      mr: 'आता आपल्या भाषेत आपल्या उत्पादनाबद्दल सांगा. तुम्ही बोलून सर्वकाही सांगू शकता.',
      bn: 'এখন আপনার ভাষায় আপনার পণ্য সম্পর্কে বলুন। আপনি কথা বলে সবকিছু বলতে পারেন।',
      te: 'ఇప్పుడు మీ భాషలో మీ ఉత్పత్తి గురించి చెప్పండి. మీరు మాట్లాడి ప్రతిదీ వివరించవచ్చు.',
      ta: 'இப்போது உங்கள் மொழியில் உங்கள் தயாரிப்பைப் பற்றி கூறுங்கள். நீங்கள் பேசி அனைத்தையும் விவரிக்கலாம்.',
    },
  },

  [AUDIO_INSTRUCTION_KEYS.RECORDING_STARTED]: {
    id: 'recording_started',
    title: {
      hi: 'रिकॉर्डिंग शुरू',
      en: 'Recording Started',
      mr: 'रेकॉर्डिंग सुरू',
      bn: 'রেকর্ডিং শুরু',
      te: 'రికార్డింగ్ ప్రారంభమైంది',
      ta: 'பதிவு தொடங்கியது',
    },
    transcripts: {
      hi: 'मैं सुन रहा हूँ। अपने उत्पाद के बारे में बताइए।',
      en: 'I am listening. Please describe your product.',
      mr: 'मी ऐकत आहे. आपल्या उत्पादनाबद्दल सांगा.',
      bn: 'আমি শুনছি। আপনার পণ্য সম্পর্কে বলুন।',
      te: 'నేను వింటున్నాను. మీ ఉత్పత్తి గురించి చెప్పండి.',
      ta: 'நான் கேட்கிறேன். உங்கள் தயாரிப்பைப் பற்றி சொல்லுங்கள்.',
    },
  },

  [AUDIO_INSTRUCTION_KEYS.RECORDING_STOPPED]: {
    id: 'recording_stopped',
    title: {
      hi: 'रिकॉर्डिंग पूर्ण',
      en: 'Recording Stopped',
      mr: 'रेकॉर्डिंग थांबवले',
      bn: 'রেকর্ডিং সম্পন্ন',
      te: 'రికార్డింగ్ పూర్తయింది',
      ta: 'பதிவு முடிந்தது',
    },
    transcripts: {
      hi: 'आपकी आवाज़ रिकॉर्ड हो गई है।',
      en: 'Your voice has been recorded.',
      mr: 'तुमचा आवाज रेकॉर्ड झाला आहे.',
      bn: 'আপনার ভয়েস রেকর্ড করা হয়েছে।',
      te: 'మీ వాయిస్ రికార్డ్ చేయబడింది.',
      ta: 'உங்கள் குரல் பதிவு செய்யப்பட்டுள்ளது.',
    },
  },

  [AUDIO_INSTRUCTION_KEYS.PROCESSING_INSTRUCTION]: {
    id: 'processing_instruction',
    title: {
      hi: 'एआई विश्लेषण',
      en: 'AI Processing',
      mr: 'एआय प्रक्रिया',
      bn: 'এআই প্রসেসিং',
      te: 'AI విశ్లేషణ',
      ta: 'AI செயலாக்கம்',
    },
    transcripts: {
      hi: 'थोड़ा इंतज़ार कीजिए। शिल्प सेतु आपकी फोटो और आवाज़ को समझ कर प्रोडक्ट लिस्टिंग तैयार कर रहा है।',
      en: 'Please wait a moment. Shilp Setu is analyzing your photo and voice to prepare your product listing.',
      mr: 'कृपया थोडी वाट पहा. शिल्प सेतू तुमचा फोटो आणि आवाज समजून उत्पादन सूची तयार करत आहे.',
      bn: 'একটু অপেক্ষা করুন। শিল্প সেতু আপনার ছবি এবং ভয়েস বিশ্লেষণ করে প্রোডাক্ট লিস্টিং তৈরি করছে।',
      te: 'దయచేసి కొద్దిసేపు వేచి ఉండండి. శిల్ప్ సేతు మీ ఫోటో మరియు వాయిస్‌ని విశ్లేషించి ఉత్పత్తి జాబితాను సిద్ధం చేస్తోంది.',
      ta: 'சிறிது நேரம் காத்திருக்கவும். ஷில்ப் சேது உங்கள் புகைப்படம் மற்றும் குரலை பகுப்பாய்வு செய்து தயாரிப்பு பட்டியலை உருவாக்குகிறது.',
    },
  },

  [AUDIO_INSTRUCTION_KEYS.PRODUCT_GENERATED]: {
    id: 'product_generated',
    title: {
      hi: 'उत्पाद तैयार',
      en: 'Product Generated',
      mr: 'उत्पादन तयार',
      bn: 'পণ্য তৈরি সম্পন্ন',
      te: 'ఉత్పత్తి సిద్ధమైంది',
      ta: 'தயாரிப்பு தயார்',
    },
    transcripts: {
      hi: 'आपका प्रोडक्ट तैयार है। आप डिटेल्स को देख सकते हैं।',
      en: 'Your product draft is ready. You can review the details now.',
      mr: 'तुमचे उत्पादन तयार आहे. तुम्ही तपशील पाहू शकता.',
      bn: 'আপনার পণ্য তৈরি হয়েছে। আপনি বিবরণ দেখতে পারেন।',
      te: 'మీ ఉత్పత్తి సిద్ధంగా ఉంది. మీరు వివరాలను సమీక్షించవచ్చు.',
      ta: 'உங்கள் தயாரிப்பு தயாராக உள்ளது. விவரங்களை நீங்கள் இப்போது பார்க்கலாம்.',
    },
  },

  [AUDIO_INSTRUCTION_KEYS.PRICE_INSTRUCTION]: {
    id: 'price_instruction',
    title: {
      hi: 'दाम सुझाव',
      en: 'Price Suggestion',
      mr: 'किंमत सूचना',
      bn: 'মূল্য পরামর্শ',
      te: 'ధర సూచన',
      ta: 'விலை பரிந்துரை',
    },
    transcripts: {
      hi: 'अब शिल्प सेतु आपके प्रोडक्ट के लिए एक उपयुक्त दाम सुझा रहा है।',
      en: 'Now Shilp Setu is suggesting a fair and profitable market price for your product.',
      mr: 'आता शिल्प सेतू तुमच्या उत्पादनासाठी योग्य किंमत सुचवत आहे.',
      bn: 'এখন শিল্প সেতু আপনার পণ্যের জন্য একটি সঠিক মূল্য প্রস্তাব করছে।',
      te: 'ఇప్పుడు శిల్ప్ సేతు మీ ఉత్పత్తికి సరైన ధరను సూచిస్తోంది.',
      ta: 'இப்போது ஷில்ப் சேது உங்கள் தயாரிப்புக்கு சரியான விலையை பரிந்துரைக்கிறது.',
    },
  },

  [AUDIO_INSTRUCTION_KEYS.PRICE_GENERATED]: {
    id: 'price_generated',
    title: {
      hi: 'दाम तय',
      en: 'Price Generated',
      mr: 'किंमत तयार',
      bn: 'মূল্য নির্ধারিত',
      te: 'ధర సిద్ధమైంది',
      ta: 'விலை தயாரானது',
    },
    transcripts: {
      hi: 'दाम का सुझाव तैयार है। आप इसे देखकर बदल सकते हैं।',
      en: 'The price suggestion is ready. You can review and adjust it.',
      mr: 'किंमतीचा सल्ला तयार आहे. तुम्ही ते तपासून बदलू शकता.',
      bn: 'মূল্য পরামর্শ প্রস্তুত। আপনি এটি পর্যালোচনা করে পরিবর্তন করতে পারেন।',
      te: 'ధర సూచన సిద్ధంగా ఉంది. మీరు దీన్ని సమీక్షించి మార్చవచ్చు.',
      ta: 'விலை பரிந்துரை தயாராக உள்ளது. நீங்கள் அதை மதிப்பாய்வு செய்து மாற்றலாம்.',
    },
  },

  [AUDIO_INSTRUCTION_KEYS.REVIEW_INSTRUCTION]: {
    id: 'review_instruction',
    title: {
      hi: 'समीक्षा निर्देश',
      en: 'Review Details',
      mr: 'तपशील पुनरावलोकन',
      bn: 'বিবরণ পর্যালোচনা',
      te: 'వివరాల సమీక్ష',
      ta: 'விவரங்களை சரிபார்க்கவும்',
    },
    transcripts: {
      hi: 'प्रोडक्ट की डिटेल्स चेक कीजिए। सब सही होने पर पब्लिश बटन दबाइए।',
      en: 'Check your product details. Once verified, tap the publish button.',
      mr: 'उत्पादनाचे तपशील तपासा. सर्वकाही बरोबर असल्यास पब्लिश बटण दाबा.',
      bn: 'পণ্যের বিবরণ পরীক্ষা করুন। সবকিছু ঠিক থাকলে পাবলিশ বোতাম চাপুন।',
      te: 'ఉత్పత్తి వివరాలను తనిఖీ చేయండి. అంతా సరిగ్గా ఉంటే పబ్లిష్ బటన్ నొక్కండి.',
      ta: 'தயாரிப்பு விவரங்களைச் சரிபார்க்கவும். எல்லாம் சரியாக இருந்தால் பப்ளிஷ் பொத்தானைத் தட்டவும்.',
    },
  },

  [AUDIO_INSTRUCTION_KEYS.PUBLISHING_INSTRUCTION]: {
    id: 'publishing_instruction',
    title: {
      hi: 'प्रकाशन जारी',
      en: 'Publishing Product',
      mr: 'प्रकाशन सुरू',
      bn: 'প্রকাশ করা হচ্ছে',
      te: 'ప్రచురణ జరుగుతోంది',
      ta: 'வெளியிடப்படுகிறது',
    },
    transcripts: {
      hi: 'आपका प्रोडक्ट मार्केटप्लेस पर पब्लिश किया जा रहा है।',
      en: 'Your product is being published to the marketplace.',
      mr: 'तुमचे उत्पादन मार्केटप्लेसवर प्रकाशित केले जात आहे.',
      bn: 'আপনার পণ্য মার্কেটপ্লেসে প্রকাশ করা হচ্ছে।',
      te: 'మీ ఉత్పత్తి మార్కెట్ ప్లేస్‌లో ప్రచురించబడుతోంది.',
      ta: 'உங்கள் தயாரிப்பு சந்தையில் வெளியிடப்படுகிறது.',
    },
  },

  [AUDIO_INSTRUCTION_KEYS.PUBLISHED_SUCCESSFULLY]: {
    id: 'published_successfully',
    title: {
      hi: 'सफलतापूर्वक प्रकाशित',
      en: 'Published Successfully',
      mr: 'यशस्वीरीत्या प्रकाशित',
      bn: 'সফলভাবে প্রকাশিত',
      te: 'విజయవంతంగా ప్రచురించబడింది',
      ta: 'வெற்றிகரமாக வெளியிடப்பட்டது',
    },
    transcripts: {
      hi: 'बहुत बढ़िया! आपका प्रोडक्ट सफलतापूर्वक पब्लिश हो गया है।',
      en: 'Awesome! Your product has been published successfully.',
      mr: 'खूप छान! तुमचे उत्पादन यशस्वीरीत्या प्रकाशित झाले आहे.',
      bn: 'দারুণ! আপনার পণ্য সফলভাবে প্রকাশিত হয়েছে।',
      te: 'చాలా బాగుంది! మీ ఉత్పత్తి విజయవంతంగా ప్రచురించబడింది.',
      ta: 'மிக நன்று! உங்கள் தயாரிப்பு வெற்றிகரமாக வெளியிடப்பட்டது.',
    },
  },

  [AUDIO_INSTRUCTION_KEYS.GENERIC_ERROR]: {
    id: 'generic_error',
    title: {
      hi: 'त्रुटि',
      en: 'Error Occurred',
      mr: 'त्रुटी',
      bn: 'ত্রুটি হয়েছে',
      te: 'లోపం సంభవించింది',
      ta: 'பிழை ஏற்பட்டது',
    },
    transcripts: {
      hi: 'कुछ दिक्कत आ गई है। कृपया दोबारा कोशिश कीजिए।',
      en: 'Something went wrong. Please try again.',
      mr: 'काही अडचण आली आहे. कृपया पुन्हा प्रयत्न करा.',
      bn: 'কিছু সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
      te: 'ఏదో సమస్య వచ్చింది. దయచేసి మళ్లీ ప్రయత్నించండి.',
      ta: 'ஏதோ பிரச்சனை ஏற்பட்டுள்ளது. மீண்டும் முயற்சிக்கவும்.',
    },
  },

  [AUDIO_INSTRUCTION_KEYS.NETWORK_ERROR]: {
    id: 'network_error',
    title: {
      hi: 'नेटवर्क समस्या',
      en: 'Network Problem',
      mr: 'नेटवर्क समस्या',
      bn: 'নেটওয়ার্ক সমস্যা',
      te: 'నెట్‌వర్క్ సమస్య',
      ta: 'நெட்வொர்க் பிரச்சனை',
    },
    transcripts: {
      hi: 'इंटरनेट कनेक्शन चेक कीजिए और दोबारा कोशिश कीजिए।',
      en: 'Please check your internet connection and try again.',
      mr: 'इंटरनेट कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.',
      bn: 'ইন্টারনেট সংযোগ পরীক্ষা করুন এবং আবার চেষ্টা করুন।',
      te: 'ఇంటర్నెట్ కనెక్షన్‌ను తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.',
      ta: 'இணைய இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.',
    },
  },
};

/**
 * Resolves the audio URL for an instruction with automatic language fallback.
 * Checks:
 *   1. Supabase Storage public URL if supabaseUrl is provided
 *   2. Local pre-rendered static asset in /audio-instructions/{lang}/{key}.mp3
 *
 * Fallback chain: lang -> 'hi' -> 'en'
 */
export function getAudioInstructionPath(key, language = DEFAULT_AUDIO_LANGUAGE, supabaseUrl = '') {
  const cleanLang = (language || '').split('-')[0].toLowerCase();
  const effectiveLang = SUPPORTED_AUDIO_LANGUAGES.includes(cleanLang)
    ? cleanLang
    : DEFAULT_AUDIO_LANGUAGE;

  const fileName = `${key}.mp3`;

  // If Supabase Storage public URL pattern is provided
  if (supabaseUrl && typeof supabaseUrl === 'string' && supabaseUrl.startsWith('http')) {
    const bucketPath = `${supabaseUrl}/storage/v1/object/public/audio-instructions/${effectiveLang}/${fileName}`;
    return bucketPath;
  }

  // Pre-rendered local static file bundled in Vite public directory
  return `/audio-instructions/${effectiveLang}/${fileName}`;
}

/**
 * Returns candidate paths for a given instruction key to support automatic network fallback.
 */
export function getCandidateAudioPaths(key, language = DEFAULT_AUDIO_LANGUAGE, supabaseUrl = '') {
  const cleanLang = (language || '').split('-')[0].toLowerCase();
  const candidateLangs = Array.from(new Set([cleanLang, DEFAULT_AUDIO_LANGUAGE, FALLBACK_AUDIO_LANGUAGE]))
    .filter((l) => SUPPORTED_AUDIO_LANGUAGES.includes(l));

  const paths = [];

  for (const lang of candidateLangs) {
    if (supabaseUrl && supabaseUrl.startsWith('http')) {
      paths.push({
        lang,
        url: `${supabaseUrl}/storage/v1/object/public/audio-instructions/${lang}/${key}.mp3`,
        source: 'supabase',
      });
    }
    paths.push({
      lang,
      url: `/audio-instructions/${lang}/${key}.mp3`,
      source: 'local',
    });
  }

  return paths;
}
