import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function VerificationCenter({ userProfile, onVerificationSuccess }) {
  const [idType, setIdType] = useState('mosje');
  const [idNumber, setIdNumber] = useState('');
  const [status, setStatus] = useState('idle'); // idle, verifying, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const handleVerification = async (e) => {
    e.preventDefault();
    if (!idNumber || idNumber.length < 6) {
      setErrorMessage('कृपया वैध आईडी दर्ज करें (Please enter a valid ID)');
      return;
    }

    setStatus('verifying');
    setErrorMessage('');

    try {
      // 1. Simulate API Setu / DigiLocker network latency for the hackathon demo
      await new Promise(resolve => setTimeout(resolve, 2500));

      // 2. In production, you would call your backend here to verify against Govt APIs
      // const response = await fetch('/api/verify-gov-id', { body: { idNumber, idType }});
      
      // 3. Update Supabase Profile upon successful mock verification
      let { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        try {
          const { data: anonData } = await supabase.auth.signInAnonymously();
          user = anonData?.user;
        } catch {
          // ignore
        }
      }
      const userId = user?.id || 'd3b07384-d113-4696-a885-3b984852d0b6';
      
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: userId,
          is_verified: true, 
          gov_id_type: idType,
          verification_date: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) throw error;

      try {
        localStorage.setItem('artisan_gov_verified', 'true');
        localStorage.setItem('artisan_gov_id_type', idType);
        localStorage.setItem('artisan_gov_verification_date', new Date().toISOString());
      } catch {}

      setStatus('success');
      if (onVerificationSuccess) onVerificationSuccess();

    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMessage('सर्वर त्रुटि। कृपया पुनः प्रयास करें। (Server error. Try again.)');
    }
  };

  if (userProfile?.is_verified || status === 'success') {
    return (
      <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-2xl p-5 flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h3 className="text-emerald-400 font-bold text-lg">Govt. Verified Artisan</h3>
          <p className="text-emerald-200/70 text-sm mt-1">
            आपका खाता GeM और ONDC के लिए सत्यापित हो गया है। (Your account is verified for GeM and ONDC.)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1614] border border-white/10 rounded-2xl p-5">
      <div className="mb-5">
        <h3 className="text-amber-400 font-bold text-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          शासकीय सत्यापन (Government Verification)
        </h3>
        <p className="text-stone-400 text-sm mt-1">
          GeM और ONDC पर बेचने के लिए अपनी पहचान सत्यापित करें।
        </p>
      </div>

      <form onSubmit={handleVerification} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-amber-100">दस्तावेज़ प्रकार (Document Type)</label>
          <select 
            value={idType} 
            onChange={(e) => setIdType(e.target.value)}
            className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-amber-50 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none cursor-pointer"
          >
            <option value="mosje">MoSJE Beneficiary ID</option>
            <option value="pehchan">Pehchan Card (Ministry of Textiles)</option>
            <option value="udyam">Udyam Aadhaar (MSME)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-amber-100">दस्तावेज़ संख्या (Document Number)</label>
          <input 
            type="text" 
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            placeholder="ID Number दर्ज करें"
            className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-amber-50 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none uppercase"
          />
        </div>

        {errorMessage && <p className="text-red-400 text-sm">{errorMessage}</p>}

        <button 
          type="submit" 
          disabled={status === 'verifying'}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-stone-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
        >
          {status === 'verifying' ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              DigiLocker से सत्यापित कर रहे हैं...
            </>
          ) : (
            'सत्यापित करें (Verify via API Setu)'
          )}
        </button>
      </form>
    </div>
  );
}
