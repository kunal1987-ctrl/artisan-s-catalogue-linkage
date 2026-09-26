import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as googleTTS from 'google-tts-api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Output folder in root directory
const outputDir = path.resolve(__dirname, 'demo_audio_packs');

// 2. Language Voice Packs configuration
const VOICE_PACKS = [
  {
    code: 'en',
    filename: 'nav_en.mp3',
    label: 'English',
    text: 'Welcome to Shilp Setu. Tap the camera to take a photo of your product, or tap the microphone to describe it.',
  },
  {
    code: 'hi',
    filename: 'nav_hi.mp3',
    label: 'Hindi (हिन्दी)',
    text: 'शिल्प सेतु में आपका स्वागत है। अपने उत्पाद की फोटो लेने के लिए कैमरा दबाएं, या विवरण देने के लिए माइक दबाएं।',
  },
  {
    code: 'bn',
    filename: 'nav_bn.mp3',
    label: 'Bengali (বাংলা)',
    text: 'শিল্প সেতুতে স্বাগতম। আপনার পণ্যের ছবি তুলতে ক্যামেরায় ট্যাপ করুন, অথবা বর্ণনা করতে মাইকে ট্যাপ করুন।',
  },
  {
    code: 'mr',
    filename: 'nav_mr.mp3',
    label: 'Marathi (मराठी)',
    text: 'शिल्प सेतू मध्ये आपले स्वागत आहे. तुमच्या उत्पादनाचा फोटो घेण्यासाठी कॅमेरा टॅप करा किंवा वर्णन करण्यासाठी माईकवर टॅप करा.',
  },
  {
    code: 'te',
    filename: 'nav_te.mp3',
    label: 'Telugu (తెలుగు)',
    text: 'శిల్ప్ సేతుకు స్వాగతం. మీ ఉత్పత్తి ఫోటో తీయడానికి కెమెరాను నొక్కండి లేదా వివరించడానికి మైక్ను నొక్కండి.',
  },
  {
    code: 'ta',
    filename: 'nav_ta.mp3',
    label: 'Tamil (தமிழ்)',
    text: 'ஷில்ப் சேதுவுக்கு வரவேற்கிறோம். உங்கள் தயாரிப்பை படம்பிடிக்க கேமராவைத் தட்டவும் அல்லது விவரிக்க மைக்கைத் தட்டவும்.',
  },
];

async function downloadVoicePacks() {
  console.log('='.repeat(70));
  console.log('🎙️  SHILP SETU — ONE-CLICK ONBOARDING VOICE PACK DOWNLOADER');
  console.log('='.repeat(70));

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Created target folder: ${outputDir}\n`);
  } else {
    console.log(`📁 Output folder: ${outputDir}\n`);
  }

  const results = [];

  for (const pack of VOICE_PACKS) {
    const filePath = path.join(outputDir, pack.filename);
    process.stdout.write(`⏳ Generating [${pack.code.toUpperCase()}] ${pack.label}... `);

    try {
      // Fetch text-to-speech audio base64 from Google TTS
      const getAudioBase64Fn = googleTTS.getAudioBase64 || googleTTS.default?.getAudioBase64;
      const base64Data = await getAudioBase64Fn(pack.text, {
        lang: pack.code,
        slow: false,
        host: 'https://translate.google.com',
        timeout: 15000,
      });

      // Convert Base64 data to binary buffer
      const buffer = Buffer.from(base64Data, 'base64');

      // Write physical MP3 file
      fs.writeFileSync(filePath, buffer);
      const fileSizeKb = (buffer.length / 1024).toFixed(1);

      console.log(`✓ Saved ${pack.filename} (${fileSizeKb} KB)`);
      results.push({ ...pack, success: true, size: `${fileSizeKb} KB`, filePath });
    } catch (err) {
      console.log(`✗ FAILED: ${err.message}`);
      results.push({ ...pack, success: false, error: err.message });
    }

    // Small delay to be polite with rate limits
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  console.log('\n' + '='.repeat(70));
  const successfulCount = results.filter((r) => r.success).length;
  console.log(`🎉 SUCCESS: Downloaded ${successfulCount}/${VOICE_PACKS.length} audio voice packs!`);
  console.log(`📂 Destination Directory:`);
  console.log(`   ${outputDir}`);
  console.log('='.repeat(70));

  console.log('\nGenerated MP3 Files:');
  for (const item of results) {
    if (item.success) {
      console.log(`  • ${item.filename.padEnd(12)} [${item.code}] - ${item.size} -> ${item.filePath}`);
    } else {
      console.log(`  • ${item.filename.padEnd(12)} [${item.code}] - ERROR: ${item.error}`);
    }
  }
  console.log('\nYou can now drag and drop these MP3 files directly into your presentation slides!\n');
}

downloadVoicePacks().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
