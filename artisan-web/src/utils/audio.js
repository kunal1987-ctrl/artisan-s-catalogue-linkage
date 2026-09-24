/**
 * audio.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Pre-rendered Audio Asset Playback Engine for Shilp Setu
 *
 * Migrated from window.speechSynthesis to 100% reliable pre-rendered static
 * MP3 assets stored in /public/audio/ to guarantee playback on all devices,
 * eliminating dependencies on missing OS regional speech packs.
 *
 * FUTURE-PROOFING & DYNAMIC TEXT ARCHITECTURE:
 * ─────────────────────────────────────────────────────────────────────────────
 * While static UI instructions use edge-cached pre-rendered MP3s for reliability,
 * future dynamic text (like reading back a dynamically generated product description,
 * custom voice appraisal, or realtime orders) will require routing through the
 * Google Cloud TTS or Bhashini API backend route, bypassing the device's native OS
 * speech packs entirely.
 * ─────────────────────────────────────────────────────────────────────────────
 */

let currentPlayingAudio = null;

/**
 * Plays pre-rendered static MP3 audio assets from /public/audio/${langCode}.mp3
 * @param {string} langCode - Language code (e.g. 'hi', 'ta', 'brx', 'mai')
 */
export const playPreRenderedAudio = (langCode) => {
  try {
    if (typeof window === 'undefined') return;

    // Stop any currently playing audio to prevent overlapping
    if (currentPlayingAudio) {
      currentPlayingAudio.pause();
      currentPlayingAudio = null;
    }

    // Map complex codes to their simple file names (e.g. 'hi-IN' -> 'hi')
    const cleanCode = langCode?.includes('-') ? langCode.split('-')[0] : (langCode || 'hi');
    const audioPath = `/audio/${cleanCode}.mp3`;
    
    const instructionAudio = new Audio(audioPath);
    currentPlayingAudio = instructionAudio;
    
    instructionAudio.onended = () => {
      if (currentPlayingAudio === instructionAudio) {
        currentPlayingAudio = null;
      }
    };

    // Play the new audio
    instructionAudio.play().catch((err) => {
      console.warn(`Failed to play audio for ${langCode}. Ensure ${audioPath} exists.`, err);
    });
  } catch (error) {
    console.error("Audio playback error:", error);
  }
};

/**
 * Backward-compatible audio instruction helpers routing directly to pre-rendered MP3s
 */
export const playAudioInstruction = (_text, languageCode) => {
  playPreRenderedAudio(languageCode);
};

export const playAudioInstructionWithFallback = (_text, languageCode) => {
  playPreRenderedAudio(languageCode);
};

/**
 * Localized welcome and onboarding voice prompts for each supported language
 */
export const WELCOME_INSTRUCTIONS = {
  // Major standard languages
  'hi': 'आपने हिन्दी भाषा चुनी है। अब आप शिल्प सेतु का उपयोग हिन्दी में कर सकते हैं।',
  'en': 'English language selected. You can now use Shilp Setu in English.',
  'mr': 'तुम्ही मराठी भाषा निवडली आहे. आता तुम्ही ॲप मराठीत वापरू शकता.',
  'bn': 'আপনি বাংলা ভাষা নির্বাচন করেছেন। এখন আপনি বাংলায় অ্যাপটি ব্যবহার করতে পারেন।',
  'or': 'ଆପଣ ଓଡ଼ିଆ ଭାଷା ଚୟନ କରିଛନ୍ତି। ବର୍ତ୍ତମାନ ଆପଣ ଓଡ଼ିଆରେ ଆପ୍ ବ୍ୟବହାର କରିପାରିବେ।',
  'pa': 'ਤੁਸੀਂ ਪੰਜਾਬੀ ਭਾਸ਼ਾ ਚੁਣੀ ਹੈ। ਹੁਣ ਤੁਸੀਂ ਐਪ ਨੂੰ ਪੰਜਾਬੀ ਵਿੱਚ ਵਰਤ ਸਕਦੇ ਹੋ।',
  'sa': 'भवता संस्कृतभाषा चिता। अधुना भवान् संस्कृतेन अनुप्रयोगम् उपयोक्तुं शक्नोति।',
  'sat': 'ᱟᱢ ᱥᱟᱱᱛᱟᱲᱤ ᱯᱟᱹᱨᱥᱤ ᱵᱟᱪᱷᱟᱣ ᱠᱮᱫᱟ᱾ ᱱᱤᱛᱚᱜ ᱟᱢ ᱥᱟᱱᱛᱟᱲᱤ ᱛᱮ ᱮᱯ ᱵᱮᱵᱷᱟᱨ ᱫᱟᱲᱮᱭᱟᱜ-ᱟᱢ।',
  'sd': 'توهان سنڌي ٻولي چونڊي آهي. هاڻي توهان سنڌي ۾ ايپ استعمال ڪري سگهو ٿا.',
  'ta': 'நீங்கள் தமிழ் மொழியைத் தேர்ந்தெடுத்துள்ளீர்கள். இப்போது நீங்கள் செயலியை தமிழில் பயன்படுத்தலாம்.',
  'te': 'మీరు తెలుగు భాషను ఎంచుకున్నారు. ఇప్పుడు మీరు యాప్‌ను తెలుగులో ఉపయోగించవచ్చు.',
  'ur': 'آپ نے اردو زبان منتخب کی ہے۔ اب آپ اردو میں ایپ استعمال کر سکتے ہیں۔',
  'brx': 'नोंथाङा बड़ो रावखौ सायखबाय। दा नोंथाङा बड़ो रावाव एपखौ बाहायनो हागोन।',
  'doi': 'तूस डोगरी भाषा चुनी ऐ। हुण तूस डोगरी च ऐप दा इस्तेमाल करी सकदे ओ।',
  'kok': 'तुम्हीं गोंयच्या कोंकणी भाशेक वेंचून काडलां। आतां तुम्हीं कोंकणींत ॲप वापरूंक शकतात।',
  'gu': 'તમે ગુજરાતી ભાષા પસંદ કરી છે. હવે તમે ગુજરાતીમાં ઍપનો ઉપયોગ કરી શકો છો.',
  'kn': 'ನೀವು ಕನ್ನಡ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆ ಮಾಡಿದ್ದೀರಿ. ಈಗ ನೀವು ಕನ್ನಡದಲ್ಲಿ ಅಪ್ಲಿಕೇಶನ್ ಬಳಸಬಹುದು.',
  'ks': 'تۄہہِ چھِ کٲشُر زَبان ژارِمٕژ۔ وۆنۍ ہٮ۪کِو تۄہہِ کٲشُر مَنٛز ایپ اِستِمال کٔرِتھ۔',
  'mai': 'अहाँ मैथिली भाषा चुनने छी। अब अहाँ मैथिली मे ऐप कऽ उपयोग कऽ सकैत छी।',
};

export const getTranslatedText = (key, languageCode) => {
  if (!languageCode) return WELCOME_INSTRUCTIONS['en'];
  const cleanCode = languageCode?.includes('-') ? languageCode.split('-')[0] : languageCode;
  if (key === 'welcome_instruction') {
    return WELCOME_INSTRUCTIONS[cleanCode] || WELCOME_INSTRUCTIONS['en'];
  }
  return '';
};
