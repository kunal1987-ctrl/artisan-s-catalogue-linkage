import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// 1. Translation Dictionary for Onboarding
const ONBOARDING_TEXT = {
  hi: { 
    welcome: "स्वागत है!", 
    subtitle: "अपने व्यवसाय के अनुसार सही अवसर पाने के लिए हमें अपने बारे में बताएं।", 
    categoryLabel: "आपकी शिल्प श्रेणी (Craft Category)", 
    regionLabel: "आपका राज्य (Your Region)", 
    saveBtn: "सहेजें और आगे बढ़ें (Save & Continue)", 
    skipBtn: "अभी छोड़ें (Skip for now)", 
    listenBtn: "निर्देश सुनें", 
    stopBtn: "रोकें",
    saving: "सहेजा जा रहा है..."
  },
  en: { 
    welcome: "Welcome!", 
    subtitle: "Tell us about yourself to get the right opportunities for your business.", 
    categoryLabel: "Your Craft Category", 
    regionLabel: "Your Region", 
    saveBtn: "Save & Continue", 
    skipBtn: "Skip for now", 
    listenBtn: "Listen to Instructions", 
    stopBtn: "Stop Audio",
    saving: "Saving..."
  },
  mr: { 
    welcome: "स्वागत आहे!", 
    subtitle: "तुमच्या व्यवसायासाठी योग्य संधी मिळवण्यासाठी आम्हाला तुमच्याबद्दल सांगा.", 
    categoryLabel: "तुमची हस्तकला श्रेणी (Craft Category)", 
    regionLabel: "तुमचे राज्य (Your Region)", 
    saveBtn: "जतन करा आणि पुढे जा (Save & Continue)", 
    skipBtn: "आता वगळा (Skip for now)", 
    listenBtn: "सूचना ऐका", 
    stopBtn: "थांबवा",
    saving: "जतन करत आहे..."
  },
  bn: { 
    welcome: "স্বাগতম!", 
    subtitle: "আপনার ব্যবসার জন্য সঠিক সুযোগ পেতে আপনার সম্পর্কে আমাদের বলুন।", 
    categoryLabel: "আপনার শিল্প বিভাগ (Craft Category)", 
    regionLabel: "আপনার রাজ্য (Your Region)", 
    saveBtn: "সংরক্ষণ করুন এবং এগিয়ে যান (Save & Continue)", 
    skipBtn: "এখন এড়িয়ে যান (Skip for now)", 
    listenBtn: "নির্দেশিকা শুনুন", 
    stopBtn: "থামুন",
    saving: "সংরক্ষণ করা হচ্ছে..."
  }
};

const CATEGORIES = [
  { id: 'textiles', labels: { hi: 'वस्त्र/हथकरघा (Textiles)', en: 'Textiles & Handloom', mr: 'वस्त्रोद्योग (Textiles)', bn: 'বস্ত্র ও তাঁত (Textiles)' } },
  { id: 'pottery', labels: { hi: 'मिट्टी के बर्तन (Pottery)', en: 'Pottery & Ceramics', mr: 'मातीची भांडी (Pottery)', bn: 'মৃৎশিল্প (Pottery)' } },
  { id: 'woodwork', labels: { hi: 'लकड़ी का काम (Woodwork)', en: 'Woodcraft & Carvings', mr: 'लाकडी काम (Woodwork)', bn: 'দারুশিল্প (Woodwork)' } },
  { id: 'jewelry', labels: { hi: 'आभूषण (Jewelry)', en: 'Traditional Jewelry', mr: 'दागिने (Jewelry)', bn: 'গহনা শিল্প (Jewelry)' } }
];

const REGIONS = [
  { id: 'mp', labels: { hi: 'मध्य प्रदेश (MP)', en: 'Madhya Pradesh (MP)', mr: 'मध्य प्रदेश (MP)', bn: 'মধ্যপ্রদেশ (MP)' } },
  { id: 'up', labels: { hi: 'उत्तर प्रदेश (UP)', en: 'Uttar Pradesh (UP)', mr: 'उत्तर प्रदेश (UP)', bn: 'উত্তরপ্রদেশ (UP)' } },
  { id: 'mh', labels: { hi: 'महाराष्ट्र (MH)', en: 'Maharashtra (MH)', mr: 'महाराष्ट्र (MH)', bn: 'মহারাষ্ট্র (MH)' } },
  { id: 'wb', labels: { hi: 'पश्चिम बंगाल (WB)', en: 'West Bengal (WB)', mr: 'पश्चिम बंगाल (WB)', bn: 'পশ্চিমবঙ্গ (WB)' } }
];

const LANG_VOICE_MAP = { hi: 'hi-IN', en: 'en-IN', mr: 'mr-IN', bn: 'bn-IN' };

export default function Onboarding() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [region, setRegion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Accessibility States
  const [lang, setLang] = useState('hi');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  
  const t = ONBOARDING_TEXT[lang] || ONBOARDING_TEXT.hi;

  // Preload voices
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const loadVoices = () => {
      try {
        setVoices(window.speechSynthesis.getVoices());
      } catch (e) {
        console.warn('Voice loading notice:', e);
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    };
  }, []);

  // Audio Assistant Logic
  const playAudioInstructions = () => {
    if (!('speechSynthesis' in window)) return;
    
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const spokenText = `${t.welcome} ${t.subtitle} कृपया ${t.categoryLabel} और ${t.regionLabel} चुनें।`;
    const utterance = new SpeechSynthesisUtterance(spokenText);
    const targetCode = LANG_VOICE_MAP[lang] || 'hi-IN';
    
    const matchedVoice = voices.find(v => 
      v.lang === targetCode || 
      v.lang.replace('_', '-').includes(targetCode) || 
      v.lang.includes(lang)
    );
    if (matchedVoice) utterance.voice = matchedVoice;
    
    utterance.rate = 0.85;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const completeOnboarding = async (skipped = false) => {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/login');

      const updateData = skipped 
        ? { id: user.id, has_onboarded: true } 
        : { id: user.id, craft_category: category, region: region, has_onboarded: true };

      // Upsert ensures record is inserted if first-time user doesn't have a profile row yet
      const { error } = await supabase
        .from('profiles')
        .upsert(updateData, { onConflict: 'id' });

      if (error) throw error;
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving onboarding data:', error.message);
      // Failsafe: push to dashboard anyway so user isn't stuck
      navigate('/dashboard'); 
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#2e2621] flex flex-col p-6 text-amber-50">
      
      {/* Top Bar: Language Selector & Audio Assistant */}
      <div className="flex justify-between items-center w-full max-w-md mx-auto mb-8">
        <select 
          value={lang} 
          onChange={(e) => {
            setLang(e.target.value);
            if (isSpeaking && 'speechSynthesis' in window) {
              window.speechSynthesis.cancel();
            }
            setIsSpeaking(false);
          }}
          className="bg-stone-800 text-amber-100 border border-stone-600 rounded-lg px-3 py-1.5 text-sm outline-none cursor-pointer"
        >
          <option value="hi">हिंदी (Hindi)</option>
          <option value="mr">मराठी (Marathi)</option>
          <option value="bn">বাংলা (Bengali)</option>
          <option value="en">English</option>
        </select>

        <button 
          type="button"
          onClick={playAudioInstructions}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-all cursor-pointer ${
            isSpeaking ? 'bg-amber-500 text-stone-900 animate-pulse' : 'bg-stone-700 text-amber-300 hover:bg-stone-600'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
          {isSpeaking ? t.stopBtn : t.listenBtn}
        </button>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-md mx-auto space-y-8 flex-1 flex flex-col justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-amber-400">{t.welcome}</h1>
          <p className="mt-2 text-amber-200/80">{t.subtitle}</p>
        </div>

        <div className="space-y-6">
          {/* Craft Category Selection */}
          <div>
            <label className="block text-sm font-medium mb-3 text-amber-100">{t.categoryLabel}</label>
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`p-3 text-sm rounded-xl border transition-all cursor-pointer ${
                    category === c.id 
                      ? 'bg-amber-500 border-amber-400 text-stone-900 font-bold shadow-md' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {c.labels[lang] || c.labels.hi || c.labels.en}
                </button>
              ))}
            </div>
          </div>

          {/* Region Selection */}
          <div>
            <label className="block text-sm font-medium mb-3 text-amber-100">{t.regionLabel}</label>
            <div className="grid grid-cols-2 gap-3">
              {REGIONS.map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRegion(r.id)}
                  className={`p-3 text-sm rounded-xl border transition-all cursor-pointer ${
                    region === r.id 
                      ? 'bg-amber-500 border-amber-400 text-stone-900 font-bold shadow-md' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {r.labels[lang] || r.labels.hi || r.labels.en}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 space-y-4">
          <button 
            type="button"
            onClick={() => completeOnboarding(false)} 
            disabled={!category || !region || isSubmitting} 
            className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 disabled:bg-stone-600 disabled:text-stone-400 font-bold rounded-xl text-white transition-colors cursor-pointer"
          >
            {isSubmitting ? t.saving : t.saveBtn}
          </button>
          <button 
            type="button"
            onClick={() => completeOnboarding(true)} 
            disabled={isSubmitting}
            className="w-full py-3 text-amber-200/60 hover:text-amber-100 font-medium transition-colors cursor-pointer"
          >
            {t.skipBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
