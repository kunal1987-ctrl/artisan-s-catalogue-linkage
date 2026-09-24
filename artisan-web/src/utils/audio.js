/**
 * audio.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Web Speech API Text-to-Speech (TTS) Utility for Shilp Setu
 *
 * Provides real-time native speech instructions across Indian regional languages
 * with intelligent Devnagari fallback strategies for minority languages.
 *
 * Integration Note:
 * While Gujarati, Hindi, and Kannada will work flawlessly with TTS out of the
 * box, the browser's OS-level speech packs will dictate whether native audio plays
 * for Bodo, Dogri, Goan Konkani, Kashmiri, and Maithili. The UI text translation
 * (via the Gemini AI translation pipeline) will work perfectly for all 8 languages
 * regardless of the device's audio capabilities.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Fallback Audio Handler
 * Handles browsers with native voice packs as well as minority languages lacking native TTS.
 * Browsers natively support Hindi (hi-IN), Gujarati (gu-IN), and Kannada (kn-IN), but for
 * languages like Bodo or Maithili, it gracefully degrades to a visual-only state or offers
 * an intelligent Devnagari-script fallback.
 *
 * @param {string} text - The instruction text to speak
 * @param {string} languageCode - BCP 47 code (e.g. 'gu-IN', 'kn-IN', 'brx-IN', 'mai-IN')
 */
export const playAudioInstructionWithFallback = (text, languageCode) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  
  const voices = window.speechSynthesis.getVoices();
  const exactVoice = voices.find(voice => voice.lang.includes(languageCode));
  
  if (exactVoice) {
    // Native support found in the operating system's voice pack
    utterance.voice = exactVoice;
    utterance.lang = languageCode;
    window.speechSynthesis.speak(utterance);
  } else {
    // Fallback Strategy: Log warning, do not crash, rely on UI translations
    console.warn(`Native TTS voice not found for ${languageCode}. Defaulting to UI text translation only.`);
    
    // Fallback logic for Devnagari script languages to play Hindi audio instead of failing silently
    const isDevnagari = ['brx-IN', 'doi-IN', 'kok-IN', 'mai-IN'].includes(languageCode);
    if (isDevnagari) {
      utterance.lang = 'hi-IN';
      window.speechSynthesis.speak(utterance);
    }
  }
};

/**
 * Standard TTS instruction invoker — alias / wrapper for backward compatibility
 */
export const playAudioInstruction = (text, languageCode) => {
  playAudioInstructionWithFallback(text, languageCode);
};

/**
 * Localized welcome and onboarding voice prompts for each supported language
 */
export const WELCOME_INSTRUCTIONS = {
  // Major standard languages
  'hi-IN': 'आपने हिन्दी भाषा चुनी है। अब आप शिल्प सेतु का उपयोग हिन्दी में कर सकते हैं।',
  'hi': 'आपने हिन्दी भाषा चुनी है। अब आप शिल्प सेतु का उपयोग हिन्दी में कर सकते हैं।',
  'en-IN': 'English language selected. You can now use Shilp Setu in English.',
  'en': 'English language selected. You can now use Shilp Setu in English.',
  'mr-IN': 'तुम्ही मराठी भाषा निवडली आहे. आता तुम्ही ॲप मराठीत वापरू शकता.',
  'mr': 'तुम्ही मराठी भाषा निवडली आहे. आता तुम्ही ॲप मराठीत वापरू शकता.',
  'bn-IN': 'আপনি বাংলা ভাষা নির্বাচন করেছেন। এখন আপনি বাংলায় অ্যাপটি ব্যবহার করতে পারেন।',
  'bn': 'আপনি বাংলা ভাষা নির্বাচন করেছেন। এখন আপনি বাংলায় অ্যাপটি ব্যবহার করতে পারেন।',

  // Regional languages with BCP 47 codes
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
  'ur': 'آپ نے اردو زبان منتخب کی ہے۔ اب آپ اردو میں ایپ استعمال کر سکتے ہیں۔',

  // 8 Additional regional languages
  'brx-IN': 'नोंथाङा बड़ो रावखौ सायखबाय। दा नोंथाङा बड़ो रावाव एपखौ बाहायनो हागोन।',
  'brx': 'नोंथाङा बड़ो रावखौ सायखबाय। दा नोंथाङा बड़ो रावाव एपखौ बाहायनो हागोन।',
  'doi-IN': 'तूस डोगरी भाषा चुनी ऐ। हुण तूस डोगरी च ऐप दा इस्तेमाल करी सकदे ओ।',
  'doi': 'तूस डोगरी भाषा चुनी ऐ। हुण तूस डोगरी च ऐप दा इस्तेमाल करी सकदे ओ।',
  'kok-IN': 'तुम्हीं गोंयच्या कोंकणी भाशेक वेंचून काडलां। आतां तुम्हीं कोंकणींत ॲप वापरूंक शकतात।',
  'kok': 'तुम्हीं गोंयच्या कोंकणी भाशेक वेंचून काडलां। आतां तुम्हीं कोंकणींत ॲप वापरूंक शकतात।',
  'gu-IN': 'તમે ગુજરાતી ભાષા પસંદ કરી છે. હવે તમે ગુજરાતીમાં ઍપનો ઉપયોગ કરી શકો છો.',
  'gu': 'તમે ગુજરાતી ભાષા પસંદ કરી છે. હવે તમે ગુજરાતીમાં ઍપનો ઉપયોગ કરી શકો છો.',
  'kn-IN': 'ನೀವು ಕನ್ನಡ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆ ಮಾಡಿದ್ದೀರಿ. ಈಗ ನೀವು ಕನ್ನಡದಲ್ಲಿ ಅಪ್ಲಿಕೇಶನ್ ಬಳಸಬಹುದು.',
  'kn': 'ನೀವು ಕನ್ನಡ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆ ಮಾಡಿದ್ದೀರಿ. ಈಗ ನೀವು ಕನ್ನಡದಲ್ಲಿ ಅಪ್ಲಿಕೇಶನ್ ಬಳಸಬಹುದು.',
  'ks-IN': 'تۄہہِ چھِ کٲشُر زَبان ژارِمٕژ۔ وۆنۍ ہٮ۪کِو تۄہہِ کٲشُر مَنٛز ایپ اِستِمال کٔرِتھ۔',
  'ks': 'تۄہہِ چھِ کٲشُر زَبان ژارِمٕژ۔ وۆنۍ ہٮ۪کِو تۄہہِ کٲشُر مَنٛز ایپ اِستِمال کٔرِتھ۔',
  'mai-IN': 'अहाँ मैथिली भाषा चुनने छी। अब अहाँ मैथिली मे ऐप कऽ उपयोग कऽ सकैत छी।',
  'mai': 'अहाँ मैथिली भाषा चुनने छी। अब अहाँ मैथिली मे ऐप कऽ उपयोग कऽ सकैत छी।',
};

/**
 * Returns translated UI instruction strings for dynamic speech triggers
 * @param {string} key - e.g. 'welcome_instruction'
 * @param {string} languageCode - BCP 47 code like 'gu-IN', 'kn-IN', 'ta-IN', or short code 'hi'
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
