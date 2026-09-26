import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as googleTTS from 'google-tts-api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target output folder in artisan-web/public/audio-instructions
const publicAudioDir = path.resolve(__dirname, 'artisan-web', 'public', 'audio-instructions');
const demoAudioDir = path.resolve(__dirname, 'demo_audio_packs', 'audio-instructions');

/**
 * All 15 required fixed instructions for Shilp Setu.
 * Translated naturally for artisans across 6 languages.
 */
export const INSTRUCTION_DEFINITIONS = {
  welcome: {
    hi: 'नमस्ते! शिल्प सेतु में आपका स्वागत है। अपने उत्पाद की फोटो खींचिए और उसके बारे में अपनी भाषा में बताइए।',
    en: 'Welcome to Shilp Setu. Take a photo of your product and describe it in your own language.',
    mr: 'नमस्ते! शिल्प सेतू मध्ये आपले स्वागत आहे. तुमच्या उत्पादनाचा फोटो काढा आणि त्याबद्दल तुमच्या भाषेत सांगा.',
    bn: 'নমস্কার! শিল্প সেতুতে আপনাকে স্বাগতম। আপনার পণ্যের ছবি তুলুন এবং আপনার নিজের ভাষায় বর্ণনা করুন।',
    te: 'నమస్కారం! శిల్ప్ సేతుకు స్వాగతం. మీ ఉత్పత్తి ఫోటో తీయండి మరియు మీ స్వంత భాషలో వివరించండి.',
    ta: 'வணக்கம்! ஷில்ப் சேதுவுக்கு உங்களை வரவேற்கிறோம். உங்கள் தயாரிப்பை புகைப்படம் எடுத்து உங்கள் சொந்த மொழியில் விவரிக்கவும்.',
  },
  camera_instruction: {
    hi: 'कैमरा खोलिए और अपने उत्पाद की साफ फोटो लीजिए।',
    en: 'Open the camera and take a clear photo of your product.',
    mr: 'कॅमेरा उघडा आणि तुमच्या उत्पादनाचा स्पष्ट फोटो घ्या.',
    bn: 'ক্যামেরা খুলুন এবং আপনার পণ্যের পরিষ্কার ছবি তুলুন।',
    te: 'కెమెరాను తెరిచి మీ ఉత్పత్తి యొక్క స్పష్టమైన ఫోటో తీయండి.',
    ta: 'கேமராவைத் திறந்து உங்கள் தயாரிப்பின் தெளிவான புகைப்படத்தை எடுக்கவும்.',
  },
  multiple_photo_instruction: {
    hi: 'उत्पाद के अलग-अलग कोणों से दो या तीन फोटो लीजिए।',
    en: 'Take two or three photos of your product from different angles.',
    mr: 'उत्पादनाचे वेगवेगळ्या कोनातून दोन किंवा तीन फोटो घ्या.',
    bn: 'বিভিন্ন কোণ থেকে আপনার পণ্যের দুটি বা তিনটি ছবি তুলুন।',
    te: 'విభిన్న కోణాల నుండి మీ ఉత్పత్తి యొక్క రెండు లేదా మూడు ఫోటోలను తీయండి.',
    ta: 'வெவ்வேறு கோணங்களில் இருந்து உங்கள் தயாரிப்பின் இரண்டு அல்லது மூன்று புகைப்படங்களை எடுக்கவும்.',
  },
  mic_instruction: {
    hi: 'अब अपने उत्पाद के बारे में अपनी भाषा में बताइए। आप बोलकर सब कुछ बता सकते हैं।',
    en: 'Now tell us about your product in your language. You can speak and describe everything.',
    mr: 'आता आपल्या भाषेत आपल्या उत्पादनाबद्दल सांगा. तुम्ही बोलून सर्वकाही सांगू शकता.',
    bn: 'এখন আপনার ভাষায় আপনার পণ্য সম্পর্কে বলুন। আপনি কথা বলে সবকিছু বলতে পারেন।',
    te: 'ఇప్పుడు మీ భాషలో మీ ఉత్పత్తి గురించి చెప్పండి. మీరు మాట్లాడి ప్రతిదీ వివరించవచ్చు.',
    ta: 'இப்போது உங்கள் மொழியில் உங்கள் தயாரிப்பைப் பற்றி கூறுங்கள். நீங்கள் பேசி அனைத்தையும் விவரிக்கலாம்.',
  },
  recording_started: {
    hi: 'मैं सुन रहा हूँ। अपने उत्पाद के बारे में बताइए।',
    en: 'I am listening. Please describe your product.',
    mr: 'मी ऐकत आहे. आपल्या उत्पादनाबद्दल सांगा.',
    bn: 'আমি শুনছি। আপনার পণ্য সম্পর্কে বলুন।',
    te: 'నేను వింటున్నాను. మీ ఉత్పత్తి గురించి చెప్పండి.',
    ta: 'நான் கேட்கிறேன். உங்கள் தயாரிப்பைப் பற்றி சொல்லுங்கள்.',
  },
  recording_stopped: {
    hi: 'आपकी आवाज़ रिकॉर्ड हो गई है।',
    en: 'Your voice has been recorded.',
    mr: 'तुमचा आवाज रेकॉर्ड झाला आहे.',
    bn: 'আপনার ভয়েস রেকর্ড করা হয়েছে।',
    te: 'మీ వాయిస్ రికార్డ్ చేయబడింది.',
    ta: 'உங்கள் குரல் பதிவு செய்யப்பட்டுள்ளது.',
  },
  processing_instruction: {
    hi: 'थोड़ा इंतज़ार कीजिए। शिल्प सेतु आपकी फोटो और आवाज़ को समझ कर प्रोडक्ट लिस्टिंग तैयार कर रहा है।',
    en: 'Please wait a moment. Shilp Setu is analyzing your photo and voice to prepare your product listing.',
    mr: 'कृपया थोडी वाट पहा. शिल्प सेतू तुमचा फोटो आणि आवाज समजून उत्पादन सूची तयार करत आहे.',
    bn: 'একটু অপেক্ষা করুন। শিল্প সেতু আপনার ছবি এবং ভয়েস বিশ্লেষণ করে প্রোডাক্ট লিস্টিং তৈরি করছে।',
    te: 'దయచేసి కొద్దిసేపు వేచి ఉండండి. శిల్ప్ సేతు మీ ఫోటో మరియు వాయిస్‌ని విశ్లేషించి ఉత్పత్తి జాబితాను సిద్ధం చేస్తోంది.',
    ta: 'சிறிது நேரம் காத்திருக்கவும். ஷில்ப் சேது உங்கள் புகைப்படம் மற்றும் குரலை பகுப்பாய்வு செய்து தயாரிப்பு பட்டியலை உருவாக்குகிறது.',
  },
  product_generated: {
    hi: 'आपका प्रोडक्ट तैयार है। आप डिटेल्स को देख सकते हैं।',
    en: 'Your product draft is ready. You can review the details now.',
    mr: 'तुमचे उत्पादन तयार आहे. तुम्ही तपशील पाहू शकता.',
    bn: 'আপনার পণ্য তৈরি হয়েছে। আপনি বিবরণ দেখতে পারেন।',
    te: 'మీ ఉత్పత్తి సిద్ధంగా ఉంది. మీరు వివరాలను సమీక్షించవచ్చు.',
    ta: 'உங்கள் தயாரிப்பு தயாராக உள்ளது. விவரங்களை நீங்கள் இப்போது பார்க்கலாம்.',
  },
  price_instruction: {
    hi: 'अब शिल्प सेतु आपके प्रोडक्ट के लिए एक उपयुक्त दाम सुझा रहा है।',
    en: 'Now Shilp Setu is suggesting a fair and profitable market price for your product.',
    mr: 'आता शिल्प सेतू तुमच्या उत्पादनासाठी योग्य किंमत सुचवत आहे.',
    bn: 'এখন শিল্প সেতু আপনার পণ্যের জন্য একটি সঠিক মূল্য প্রস্তাব করছে।',
    te: 'ఇప్పుడు శిల్ప్ సేతు మీ ఉత్పత్తికి సరైన ధరను సూచిస్తోంది.',
    ta: 'இப்போது ஷில்ப் சேது உங்கள் தயாரிப்புக்கு சரியான விலையை பரிந்துரைக்கிறது.',
  },
  price_generated: {
    hi: 'दाम का सुझाव तैयार है। आप इसे देखकर बदल सकते हैं।',
    en: 'The price suggestion is ready. You can review and adjust it.',
    mr: 'किंमतीचा सल्ला तयार आहे. तुम्ही ते तपासून बदलू शकता.',
    bn: 'মূল্য পরামর্শ প্রস্তুত। আপনি এটি পর্যালোচনা করে পরিবর্তন করতে পারেন।',
    te: 'ధర సూచన సిద్ధంగా ఉంది. మీరు దీన్ని సమీక్షించి మార్చవచ్చు.',
    ta: 'விலை பரிந்துரை தயாராக உள்ளது. நீங்கள் அதை மதிப்பாய்வு செய்து மாற்றலாம்.',
  },
  review_instruction: {
    hi: 'प्रोडक्ट की डिटेल्स चेक कीजिए। सब सही होने पर पब्लिश बटन दबाइए।',
    en: 'Check your product details. Once verified, tap the publish button.',
    mr: 'उत्पादनाचे तपशील तपासा. सर्वकाही बरोबर असल्यास पब्लिश बटण दाबा.',
    bn: 'পণ্যের বিবরণ পরীক্ষা করুন। সবকিছু ঠিক থাকলে পাবলিশ বোতাম চাপুন।',
    te: 'ఉత్పత్తి వివరాలను తనిఖీ చేయండి. అంతా సరిగ్గా ఉంటే పబ్లిష్ బటన్ నొక్కండి.',
    ta: 'தயாரிப்பு விவரங்களைச் சரிபார்க்கவும். எல்லாம் சரியாக இருந்தால் பப்ளிஷ் பொத்தானைத் தட்டவும்.',
  },
  publishing_instruction: {
    hi: 'आपका प्रोडक्ट मार्केटप्लेस पर पब्लिश किया जा रहा है।',
    en: 'Your product is being published to the marketplace.',
    mr: 'तुमचे उत्पादन मार्केटप्लेसवर प्रकाशित केले जात आहे.',
    bn: 'আপনার পণ্য মার্কেটপ্লেসে প্রকাশ করা হচ্ছে।',
    te: 'మీ ఉత్పత్తి మార్కెట్ ప్లేస్‌లో ప్రచురించబడుతోంది.',
    ta: 'உங்கள் தயாரிப்பு சந்தையில் வெளியிடப்படுகிறது.',
  },
  published_successfully: {
    hi: 'बहुत बढ़िया! आपका प्रोडक्ट सफलतापूर्वक पब्लिश हो गया है।',
    en: 'Awesome! Your product has been published successfully.',
    mr: 'खूप छान! तुमचे उत्पादन यशस्वीरीत्या प्रकाशित झाले आहे.',
    bn: 'দারুণ! আপনার পণ্য সফলভাবে প্রকাশিত হয়েছে।',
    te: 'చాలా బాగుంది! మీ ఉత్పత్తి విజయవంతంగా ప్రచురించబడింది.',
    ta: 'மிக நன்று! உங்கள் தயாரிப்பு வெற்றிகரமாக வெளியிடப்பட்டது.',
  },
  generic_error: {
    hi: 'कुछ दिक्कत आ गई है। कृपया दोबारा कोशिश कीजिए।',
    en: 'Something went wrong. Please try again.',
    mr: 'काही अडचण आली आहे. कृपया पुन्हा प्रयत्न करा.',
    bn: 'কিছু সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
    te: 'ఏదో సమస్య వచ్చింది. దయచేసి మళ్లీ ప్రయత్నించండి.',
    ta: 'ஏதோ பிரச்சனை ஏற்பட்டுள்ளது. மீண்டும் முயற்சிக்கவும்.',
  },
  network_error: {
    hi: 'इंटरनेट कनेक्शन चेक कीजिए और दोबारा कोशिश कीजिए।',
    en: 'Please check your internet connection and try again.',
    mr: 'इंटरनेट कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.',
    bn: 'ইন্টারনেট সংযোগ পরীক্ষা করুন এবং আবার চেষ্টা করুন।',
    te: 'ఇంటర్నెట్ కనెక్షన్‌ను తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.',
    ta: 'இணைய இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.',
  },
};

const LANGUAGES = ['hi', 'en', 'mr', 'bn', 'te', 'ta'];

async function generateAllVoiceInstructions() {
  console.log('='.repeat(70));
  console.log('🎙️  SHILP SETU — GLOBAL AUDIO INSTRUCTIONS GENERATOR');
  console.log('='.repeat(70));

  const getAudioBase64Fn = googleTTS.getAudioBase64 || googleTTS.default?.getAudioBase64;
  let totalGenerated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const lang of LANGUAGES) {
    const langPublicDir = path.join(publicAudioDir, lang);
    const langDemoDir = path.join(demoAudioDir, lang);
    fs.mkdirSync(langPublicDir, { recursive: true });
    fs.mkdirSync(langDemoDir, { recursive: true });

    console.log(`\n📁 Processing language: [${lang.toUpperCase()}]`);

    for (const [key, textMap] of Object.entries(INSTRUCTION_DEFINITIONS)) {
      const text = textMap[lang];
      if (!text) continue;

      const fileName = `${key}.mp3`;
      const targetPath = path.join(langPublicDir, fileName);
      const demoPath = path.join(langDemoDir, fileName);

      // Check if already generated and non-empty
      if (fs.existsSync(targetPath) && fs.statSync(targetPath).size > 1000) {
        console.log(`  ⏩ [${lang}] ${fileName} exists (${(fs.statSync(targetPath).size / 1024).toFixed(1)} KB), skipping`);
        totalSkipped++;
        continue;
      }

      process.stdout.write(`  ⏳ Generating [${lang}] ${fileName}... `);
      try {
        const base64Data = await getAudioBase64Fn(text, {
          lang: lang,
          slow: false,
          host: 'https://translate.google.com',
          timeout: 15000,
        });

        const buffer = Buffer.from(base64Data, 'base64');
        fs.writeFileSync(targetPath, buffer);
        fs.writeFileSync(demoPath, buffer);

        const sizeKb = (buffer.length / 1024).toFixed(1);
        console.log(`✓ (${sizeKb} KB)`);
        totalGenerated++;

        // Friendly rate-limiting pause
        await new Promise((r) => setTimeout(r, 200));
      } catch (err) {
        console.log(`✗ Error: ${err.message}`);
        totalErrors++;
      }
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`🎉 Audio Generation Completed!`);
  console.log(`   Generated: ${totalGenerated}`);
  console.log(`   Skipped:   ${totalSkipped}`);
  console.log(`   Errors:    ${totalErrors}`);
  console.log(`📂 Saved to: ${publicAudioDir}`);
  console.log('='.repeat(70));
}

generateAllVoiceInstructions().catch((err) => {
  console.error('Fatal error generating voice instructions:', err);
  process.exit(1);
});
