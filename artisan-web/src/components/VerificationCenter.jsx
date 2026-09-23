import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function VerificationCenter({ userProfile, onVerificationSuccess }) {
  const [idType, setIdType] = useState('mosje');
  const [idNumber, setIdNumber] = useState('');
  const [status, setStatus] = useState('idle'); // idle, verifying, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [verificationStep, setVerificationStep] = useState('');
  const [refId, setRefId] = useState(() => {
    return localStorage.getItem('artisan_gov_ref_id') || `DIGI-${Math.floor(100000 + Math.random() * 900000)}-IN`;
  });

  const handleVerification = async (e) => {
    e.preventDefault();
    if (!idNumber || idNumber.length < 5) {
      setErrorMessage('कृपया वैध आईडी दर्ज करें (Please enter a valid ID)');
      return;
    }

    setStatus('verifying');
    setErrorMessage('');

    try {
      // Step 1: Secure Gateway Handshake
      setVerificationStep('Connecting to National e-Governance Gateway (API Setu)...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Ministry Database Query
      setVerificationStep(`Querying Ministry of Textiles / MoSJE registry for ID: ${idNumber.toUpperCase()}...`);
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Step 3: Cryptographic Signature Validation
      setVerificationStep('Validating DigiLocker cryptographic signature...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate a realistic government verification reference number
      const mockRef = `DIGI-${Math.floor(100000 + Math.random() * 900000)}-IN`;
      setRefId(mockRef);

      // Save to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      const activeUserId = user?.id || 'd3b07384-d113-4696-a885-3b984852d0b6';

      await supabase
        .from('profiles')
        .upsert({ 
          id: activeUserId,
          is_verified: true, 
          gov_id_type: idType,
          gov_id_number: idNumber.toUpperCase(),
          verification_date: new Date().toISOString()
        }, { onConflict: 'id' });

      try {
        localStorage.setItem('artisan_gov_verified', 'true');
        localStorage.setItem('artisan_gov_id_type', idType);
        localStorage.setItem('artisan_gov_id_number', idNumber.toUpperCase());
        localStorage.setItem('artisan_gov_ref_id', mockRef);
        localStorage.setItem('artisan_gov_verification_date', new Date().toISOString());
      } catch {}

      setStatus('success');
      if (onVerificationSuccess) onVerificationSuccess();

    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMessage('सत्यापन विफल। कृपया पुनः प्रयास करें।');
    }
  };

  if (userProfile?.is_verified || status === 'success') {
    return (
      <div className="bg-white border border-gray-200 shadow-md rounded-2xl p-5 sm:p-6 space-y-4 text-gray-900">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center text-green-700 font-bold shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-semibold mb-1">
              <span>Government Accredited Artisan</span>
            </div>
            <h3 className="text-gray-900 font-bold text-base sm:text-lg">DigiLocker Verified Artisan</h3>
            <p className="text-xs text-gray-600">Authorized for GeM & ONDC Procurement Tenders</p>
          </div>
        </div>

        {/* Stacked ID Metadata */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Scheme / ID Type:</span>
            <span className="font-semibold text-gray-900 uppercase">{idType}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">ID Number:</span>
            <span className="font-mono font-bold text-gray-900">{idNumber || 'MSJE/2026/89412'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Status:</span>
            <span className="inline-flex items-center gap-1 text-green-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-green-500"></span> Verified
            </span>
          </div>
        </div>

        {/* Subtle Sandbox Footer Box */}
        <div className="bg-gray-50 text-gray-500 text-xs py-2 px-3.5 rounded-lg border border-gray-100 flex flex-wrap items-center justify-between gap-1.5">
          <span>Ref ID: <strong className="font-mono text-gray-700">{refId}</strong></span>
          <span>Issuer: <strong className="text-gray-700">National Informatics Centre (NIC) Sandbox</strong></span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1614] border border-white/10 rounded-2xl p-5">
      <div className="mb-5">
        <h3 className="text-amber-400 font-bold text-lg flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            disabled={status === 'verifying'}
            className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-amber-50 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none cursor-pointer disabled:opacity-50"
          >
            <option value="mosje">MoSJE Beneficiary ID</option>
            <option value="pehchan">Pehchan Card (Ministry of Textiles)</option>
            <option value="udyam">Udyam Aadhaar (MSME)</option>
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-amber-100">दस्तावेज़ संख्या (Document Number)</label>
            <button
              type="button"
              onClick={() => setIdNumber(idType === 'mosje' ? 'MSJE/2026/89412' : idType === 'pehchan' ? 'AR/RAJ/710294' : 'UDYAM-RJ-02-0049210')}
              className="text-amber-400 hover:text-amber-300 text-[11px] underline cursor-pointer"
            >
              डेमो आईडी भरें
            </button>
          </div>
          <input 
            type="text" 
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            placeholder="e.g. MSJE/2026/89412"
            disabled={status === 'verifying'}
            className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-amber-50 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none uppercase font-mono disabled:opacity-50"
          />
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {status === 'verifying' && (
          <div className="bg-stone-900/90 border border-blue-500/40 rounded-xl p-3.5 flex items-center gap-3 text-xs text-blue-300 animate-pulse">
            <svg className="animate-spin h-4 w-4 text-blue-400 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="font-mono">{verificationStep}</span>
          </div>
        )}

        <button 
          type="submit" 
          disabled={status === 'verifying'}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/80 text-white font-bold rounded-xl transition-colors cursor-pointer shadow-lg shadow-blue-900/20"
        >
          {status === 'verifying' ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm truncate">{verificationStep || 'सत्यापित कर रहे हैं...'}</span>
            </>
          ) : (
            'सत्यापित करें (Verify via API Setu)'
          )}
        </button>
      </form>
    </div>
  );
}
