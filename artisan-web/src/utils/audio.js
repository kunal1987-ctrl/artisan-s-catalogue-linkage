/**
 * audio.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Web Speech API Text-to-Speech (TTS) Utility for Shilp Setu
 *
 * Provides real-time native speech instructions across Indian regional languages.
 *
 * Fallback & Platform Note:
 * While the Web Speech API covers major national and regional languages like
 * Tamil (தமிழ்) and Telugu (తెలుగు) universally across modern browsers,
 * minority/classical languages like Santali (संताली) or Sindhi (سنڌي) depend
 * heavily on the user's underlying operating system language packs (e.g. Windows
 * Speech Packs, Android Google Speech Services). If native TTS voice is
 * unavailable on the device, speech synthesis gracefully degrades to visual
 * text only without throwing runtime exceptions.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const playAudioInstruction = (text, languageCode) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn("Text-to-speech is not supported in this browser.");
    return;
  }

  // Cancel any currently playing speech to prevent overlapping
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = languageCode;
  
  // Optional: Adjust rate and pitch for a more natural sound
  utterance.rate = 0.9;
  utterance.pitch = 1.0;

  // Retrieve voices and attempt to find a localized match if available
  const voices = window.speechSynthesis.getVoices();
  const targetVoice = voices.find(voice => voice.lang.includes(languageCode));
  
  if (targetVoice) {
    utterance.voice = targetVoice;
  }

  window.speechSynthesis.speak(utterance);
};

/**
 * Localized welcome and onboarding voice prompts for each supported language
 */
export const WELCOME_INSTRUCTIONS = {
  // Existing major languages
  'hi-IN': 'आपने हिंदी भाषा चुनी है। अब आप शिल्प सेतु का उपयोग हिंदी में कर सकते हैं।',
  'hi': 'आपने हिंदी भाषा चुनी है। अब आप शिल्प सेतु का उपयोग हिंदी में कर सकते हैं।',
  'en-IN': 'English language selected. You can now use Shilp Setu in English.',
  'en': 'English language selected. You can now use Shilp Setu in English.',
  'mr-IN': 'तुम्ही मराठी भाषा निवडली आहे. आता तुम्ही ॲप मराठीत वापरू शकता.',
  'mr': 'तुम्ही मराठी भाषा निवडली आहे. आता तुम्ही ॲप मराठीत वापरू शकता.',
  'bn-IN': 'আপনি বাংলা ভাষা নির্বাচন করেছেন। এখন আপনি বাংলায় অ্যাপটি ব্যবহার করতে পারেন।',
  'bn': 'আপনি বাংলা ভাষা নির্বাচন করেছেন। এখন আপনি বাংলায় অ্যাপটি ব্যবহার করতে পারেন।',

  // 8 Specific Regional Languages with BCP 47 codes
  'or-IN': 'ଆପଣ ଓଡ଼ିଆ ଭାଷା ଚୟନ କରିଛନ୍ତି। ବର୍ତ୍ତମାନ ଆପଣ ଓଡ଼ିଆରେ ଆପ୍ ବ୍ୟବହାର କରିପାରିବେ।',
  'or': 'ଆପଣ ଓଡ଼ିଆ ଭାଷା ଚୟନ କରିଛନ୍ତି। ବର୍ତ୍ତମାନ ଆପଣ ଓଡ଼ିଆରେ ଆପ୍ ବ୍ୟବହାର କରିପାରିବେ।',
  'pa-IN': 'ਤੁਸੀਂ ਪੰਜਾਬੀ ਭਾਸ਼ਾ ਚੁਣੀ ਹੈ। ਹੁਣ ਤੁਸੀਂ ਐਪ ਨੂੰ ਪੰਜਾਬੀ ਵਿੱਚ ਵਰਤ ਸਕਦੇ ਹੋ।',
  'pa': 'ਤੁਸੀਂ ਪੰਜਾਬੀ ਭਾਸ਼ਾ ਚੁਣੀ ਹੈ। ਹੁਣ ਤੁਸੀਂ ਐਪ ਨੂੰ ਪੰਜਾਬੀ ਵਿੱਚ ਵਰਤ ਸਕਦੇ ਹੋ।',
  'sa-IN': 'भवता संस्कृतभाषा चिता। अधुना भवान् संस्कृतेन अनुप्रयोगम् उपयोक्तुं शक्नोति।',
  'sa': 'भवता संस्कृतभाषा चिता। अधुना भवान् संस्कृतेन अनुप्रयोगम् उपयोक्तुं शक्नोति।',
  'sat-IN': 'ᱟᱢ ᱥᱟᱱᱛᱟᱲᱤ ᱯᱟᱹᱨᱥᱤ ᱵᱟᱪᱷᱟᱣ ᱠᱮᱫᱟ᱾ ᱱᱤᱛᱚᱜ ᱟᱢ ᱥᱟᱱᱛᱟᱲᱤ ᱛᱮ ᱮᱯ ᱵᱮᱵᱷᱟᱨ ᱫᱟᱲᱮᱭᱟᱜ-ᱟᱢ।',
  'sat': 'ᱟᱢ ᱥᱟᱱᱛᱟᱲᱤ ᱯᱟᱹᱨᱥᱤ ᱵᱟᱪᱷᱟᱣ ᱠᱮᱫᱟ᱾ ᱱᱤᱛᱚᱜ ᱟᱢ ᱥᱟᱱᱛᱟᱲᱤ ᱛᱮ ᱮᱯ ᱵᱮᱵᱷᱟᱨ ᱫᱟᱲᱮᱭᱟᱜ-ᱟᱢ।',
  'sd-IN': 'توهان سنڌي ٻولي چونڊي آهي. هاڻي توهان سنڌي ۾ ايپ استعمال ڪري سگهو ٿا.',
  'sd': 'توهان سنڌي ٻولي چونڊي آهي. هاڻي توهان سنڌي ۾ ايپ استعمال ڪري سگهو ٿا.',
  'ta-IN': 'நீங்கள் தமிழ் மொழியைத் தேர்ந்தெடுத்துள்ளீர்கள். இப்போது நீங்கள் செயலியை தமிழில் பயன்படுத்தலாம்.',
  'ta': 'நீங்கள் தமிழ் மொழியைத் தேர்ந்தெடுத்துள்ளீர்கள். இப்போது நீங்கள் செயலியை தமிழில் பயன்படுத்தலாம்.',
  'te-IN': 'మీరు తెలుగు భాషను ఎంచుకున్నారు. ఇప్పుడు మీరు యాప్‌ను తెలుగులో ఉపయోగించవచ్చు.',
  'te': 'మీరు తెలుగు భాషను ఎంచుకున్నారు. ఇప్పుడు మీరు యాప్‌ను తెలుగులో ఉపయోగించవచ్చు.',
  'ur-IN': 'آپ نے اردو زبان منتخب کی ہے۔ اب آپ اردو میں ایپ استعمال کر سکتے ہیں۔',
  'ur': 'آپ نے اردو زبان منتخب کی ہے۔ اب آپ اردو में ایپ इस्तेमाल कर سکتے ہیں۔',
};

/**
 * Returns translated UI instruction strings for dynamic speech triggers
 * @param {string} key - e.g. 'welcome_instruction'
 * @param {string} languageCode - BCP 47 code like 'ta-IN', 'te-IN', or short code 'hi'
 * @returns {string}
 */
export const getTranslatedText = (key, languageCode) => {
  if (!languageCode) return WELCOME_INSTRUCTIONS['en-IN'];
  
  if (key === 'welcome_instruction') {
    if (WELCOME_INSTRUCTIONS[languageCode]) {
      return WELCOME_INSTRUCTIONS[languageCode];
    }
    const prefix = languageCode.split('-')[0];
    if (WELCOME_INSTRUCTIONS[prefix]) {
      return WELCOME_INSTRUCTIONS[prefix];
    }
    return WELCOME_INSTRUCTIONS['en-IN'];
  }

  return '';
};
