import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const CATEGORIES = [
  { id: 'textiles', label: 'वस्त्र और हथकरघा (Textiles)' },
  { id: 'pottery', label: 'मिट्टी के बर्तन (Pottery)' },
  { id: 'woodwork', label: 'लकड़ी का काम (Woodwork)' },
  { id: 'jewelry', label: 'आभूषण (Jewelry)' }
];

const REGIONS = [
  { id: 'mp', label: 'मध्य प्रदेश (MP)' },
  { id: 'up', label: 'उत्तर प्रदेश (UP)' },
  { id: 'mh', label: 'महाराष्ट्र (MH)' },
  { id: 'wb', label: 'पश्चिम बंगाल (WB)' }
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [region, setRegion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const completeOnboarding = async (skipped = false) => {
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
    <div className="min-h-screen bg-[#2e2621] flex flex-col items-center justify-center p-6 text-amber-50">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-amber-400">स्वागत है! (Welcome)</h1>
          <p className="mt-2 text-amber-200/80">
            अपने व्यवसाय के अनुसार सही अवसर पाने के लिए हमें अपने बारे में बताएं।
          </p>
        </div>

        <div className="space-y-6">
          {/* Craft Category Selection */}
          <div>
            <label className="block text-sm font-medium mb-3 text-amber-100">आपकी शिल्प श्रेणी (Craft Category)</label>
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`p-3 text-sm rounded-xl border transition-all ${
                    category === c.id 
                      ? 'bg-amber-500 border-amber-400 text-stone-900 font-bold' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Region Selection */}
          <div>
            <label className="block text-sm font-medium mb-3 text-amber-100">आपका राज्य (Your Region)</label>
            <div className="grid grid-cols-2 gap-3">
              {REGIONS.map(r => (
                <button
                  key={r.id}
                  onClick={() => setRegion(r.id)}
                  className={`p-3 text-sm rounded-xl border transition-all ${
                    region === r.id 
                      ? 'bg-amber-500 border-amber-400 text-stone-900 font-bold' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 space-y-4">
          <button
            onClick={() => completeOnboarding(false)}
            disabled={!category || !region || isSubmitting}
            className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 disabled:bg-stone-600 disabled:text-stone-400 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            {isSubmitting ? 'सहेजा जा रहा है...' : 'सहेजें और आगे बढ़ें (Save & Continue)'}
          </button>
          
          <button
            onClick={() => completeOnboarding(true)}
            disabled={isSubmitting}
            className="w-full py-3 text-amber-200/60 hover:text-amber-100 font-medium transition-colors cursor-pointer"
          >
            अभी छोड़ें (Skip for now)
          </button>
        </div>
      </div>
    </div>
  );
}
