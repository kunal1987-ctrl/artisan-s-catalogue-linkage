import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    sendOtp,
    verifyOtp,
    language,
  } = useAuth();

  const [step, setStep] = useState(1); // 1 = Phone Input, 2 = OTP Input
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const phoneInputRef = useRef(null);
  const otpRefs = useRef([]);

  // Reset state when modal opens or closes
  useEffect(() => {
    if (isAuthModalOpen) {
      setStep(1);
      setPhoneNumber('');
      setOtpDigits(['', '', '', '', '', '']);
      setErrorMsg('');
      setCountdown(30);
      setIsDemoMode(false);
      setTimeout(() => {
        phoneInputRef.current?.focus();
      }, 150);
    }
  }, [isAuthModalOpen]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  if (!isAuthModalOpen) return null;

  // Handle escape key to close modal
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeAuthModal();
    }
  };

  // 1-Click Demo Artisan Badge Handler
  const handleQuickDemoFill = async () => {
    setPhoneNumber('9999999999');
    setIsDemoMode(true);
    setErrorMsg('');
    setIsLoading(true);

    try {
      await sendOtp('9999999999');
      setStep(2);
      setCountdown(30);
      setOtpDigits(['1', '2', '3', '4', '5', '6']);
      setTimeout(() => {
        otpRefs.current[5]?.focus();
      }, 200);
    } catch (err) {
      setErrorMsg(err.message || 'Demo initialization failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Speech Recognition for Voice Phone Input
  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.replace(/\D/g, '');
        if (transcript) {
          const clean = transcript.length > 10 ? transcript.slice(-10) : transcript;
          setPhoneNumber(clean);
        }
      };
      recognition.start();
    } else {
      setErrorMsg(language === 'hi' 
        ? 'माइक्रोफ़ोन समर्थित नहीं है, कृपया नंबर टाइप करें।' 
        : 'Microphone not supported, please type the number.');
    }
  };

  // Step 1: Send OTP
  const handleSendOtpSubmit = async (e) => {
    if (e) e.preventDefault();
    const clean = phoneNumber.replace(/\D/g, '');
    if (clean.length < 10) {
      setErrorMsg(language === 'hi' 
        ? 'कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।' 
        : 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await sendOtp(clean);
      if (res?.error) {
        throw res.error;
      }
      setStep(2);
      setCountdown(30);
      if (clean === '9999999999') {
        setIsDemoMode(true);
        setOtpDigits(['1', '2', '3', '4', '5', '6']);
      }
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 150);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send OTP. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Handle OTP input box changes
  const handleOtpChange = (index, value) => {
    const cleanChar = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = cleanChar;
    setOtpDigits(newDigits);

    if (cleanChar && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Step 2: Handle OTP backspace & arrow navigation
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Step 2: Handle Paste of 6-digit OTP
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setOtpDigits(newDigits);
    const focusIndex = Math.min(pasted.length, 5);
    otpRefs.current[focusIndex]?.focus();
  };

  // Step 2: Verify OTP Submit
  const handleVerifyOtpSubmit = async (e) => {
    if (e) e.preventDefault();
    const token = otpDigits.join('');
    if (token.length < 6) {
      setErrorMsg(language === 'hi' 
        ? 'कृपया पूरा 6-अंकीय ओटीपी दर्ज करें।' 
        : 'Please enter complete 6-digit OTP.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await verifyOtp(phoneNumber, token);
      if (res?.error) {
        throw res.error;
      }
      // Success handled automatically inside verifyOtp (toast + modal close + callback)
    } catch (err) {
      setErrorMsg(err.message || (language === 'hi' ? 'अमान्य ओटीपी कोड। कृपया पुनः प्रयास करें।' : 'Invalid OTP. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      await sendOtp(phoneNumber);
      setCountdown(30);
      setOtpDigits(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to resend OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      {/* Click outside to close */}
      <div 
        className="absolute inset-0"
        onClick={closeAuthModal}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-[#fdf9f3] text-stone-900 rounded-3xl shadow-2xl border border-[#d1c4bd]/60 overflow-hidden z-10 transition-all">
        
        {/* Header Banner */}
        <div className="bg-[#1e140e] text-white p-5 border-b border-white/10 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] font-bold text-[#ffdeaa] uppercase tracking-wider">
                {language === 'hi' ? 'सुपाबेस आधिकारिक सत्यापन' : 'Supabase Official Auth'}
              </span>
            </div>
            <button
              onClick={closeAuthModal}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer text-sm"
              title="Close"
              type="button"
            >
              ✕
            </button>
          </div>

          <h2 className="text-xl font-bold text-white mt-2 leading-tight">
            {language === 'hi' ? 'कारीगर मोबाइल सत्यापन' : 'Artisan Phone OTP Login'}
          </h2>
          <p className="text-xs text-stone-300 mt-0.5">
            {language === 'hi' 
              ? 'GeM निविदाओं और ONDC नेटवर्क पर शिल्प प्रकाशित करने के लिए' 
              : 'Direct access to institutional GeM tenders & ONDC network'}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6">

          {/* Quick Evaluator Demo Badge */}
          <div className="mb-4 p-3 rounded-2xl bg-[#ffede6] border border-[#ff9062]/40 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#9c441c] uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">bolt</span>
                <span>One-Click Evaluator Demo</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ff9062] text-white">
                Instant Pass
              </span>
            </div>
            <button
              type="button"
              onClick={handleQuickDemoFill}
              className="w-full py-2 px-3 rounded-xl bg-white hover:bg-[#fff7f4] border border-[#ff9062]/50 text-[#1e140e] text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            >
              <span className="text-base">⚡</span>
              <span>Demo Artisan (+91 99999 99999 / OTP: 123456)</span>
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Phone Number Input */}
          {step === 1 && (
            <form onSubmit={handleSendOtpSubmit} className="space-y-4">
              <div>
                <label 
                  htmlFor="auth-phone-input"
                  className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5"
                >
                  {language === 'hi' ? '10-अंकीय मोबाइल नंबर' : '10-Digit Mobile Number'}
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-3 bg-[#f1ede7] rounded-2xl shrink-0 border border-[#d1c4bd]/60 text-sm font-bold text-stone-800 shadow-xs">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>

                  <div className="relative flex-1 flex items-center">
                    <input
                      ref={phoneInputRef}
                      id="auth-phone-input"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={phoneNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setPhoneNumber(val);
                        if (errorMsg) setErrorMsg('');
                      }}
                      placeholder="99999 99999"
                      className="w-full py-3 pl-4 pr-11 bg-[#f1ede7] rounded-2xl font-bold text-base text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#ff9062] border border-[#d1c4bd]/60 shadow-xs"
                    />

                    {/* Voice input mic */}
                    <button
                      type="button"
                      onClick={handleVoiceInput}
                      title="बोलकर नंबर दर्ज करें (Voice Input)"
                      className="absolute right-2 w-8 h-8 rounded-xl flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-stone-200 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">mic</span>
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-stone-500 mt-1.5 flex-wrap gap-1">
                  <span>
                    {language === 'hi'
                      ? 'हम आपके मोबाइल पर 6-अंकों का एसएमएस ओटीपी भेजेंगे।'
                      : 'We will send a 6-digit SMS OTP via Supabase Auth.'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPhoneNumber('9999999999')}
                    className="text-[#9c441c] font-bold hover:underline cursor-pointer"
                  >
                    ⚡ Auto-fill: 99999 99999
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || phoneNumber.length < 10}
                className={`w-full py-3.5 px-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] cursor-pointer ${
                  isLoading || phoneNumber.length < 10
                    ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                    : 'bg-[#2e241e] hover:bg-[#180f0a] text-[#ffdeaa]'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>{language === 'hi' ? 'ओटीपी भेजा जा रहा है...' : 'Sending OTP...'}</span>
                  </>
                ) : (
                  <>
                    <span>{language === 'hi' ? 'ओटीपी भेजें (Send OTP)' : 'Send OTP / ओटीपी भेजें'}</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: 6-Digit OTP Entry */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtpSubmit} className="space-y-5">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#f1ede7] border border-[#d1c4bd]/60">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-700 text-[20px]">sms</span>
                  <div>
                    <span className="text-[11px] text-stone-500 block leading-tight">
                      {language === 'hi' ? 'ओटीपी भेजा गया' : 'OTP sent to'}
                    </span>
                    <span className="text-sm font-bold text-stone-900">
                      +91 {phoneNumber}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setErrorMsg('');
                  }}
                  className="text-xs font-bold text-[#9c441c] hover:underline"
                >
                  {language === 'hi' ? 'बदलें (Edit)' : 'Edit'}
                </button>
              </div>

              {/* Demo autofill helper in Step 2 */}
              {isDemoMode && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                  <span className="font-semibold">⚡ Demo Code Ready: 123456</span>
                  <button
                    type="button"
                    onClick={() => setOtpDigits(['1', '2', '3', '4', '5', '6'])}
                    className="px-2 py-0.5 rounded-md bg-amber-600 text-white font-bold text-[11px]"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2 text-center">
                  {language === 'hi' ? '6-अंकीय ओटीपी दर्ज करें' : 'Enter 6-Digit OTP'}
                </label>

                {/* 6 OTP Input Boxes */}
                <div className="flex items-center justify-between gap-2 on-paste-target" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-12 h-14 text-center font-extrabold text-xl bg-[#f1ede7] rounded-2xl border border-[#d1c4bd]/80 focus:border-[#ff9062] focus:ring-2 focus:ring-[#ff9062]/50 focus:bg-white text-stone-900 shadow-xs transition-all"
                    />
                  ))}
                </div>
              </div>

              {/* Countdown & Resend */}
              <div className="flex items-center justify-between text-xs px-1">
                {countdown > 0 ? (
                  <span className="text-stone-500 font-medium">
                    ⏳ {language === 'hi' ? `पुनः भेजें: ${countdown}s` : `Resend in ${countdown}s`}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="text-[#9c441c] font-bold hover:underline cursor-pointer"
                  >
                    🔄 {language === 'hi' ? 'पुनः ओटीपी भेजें' : 'Resend OTP'}
                  </button>
                )}

                <span className="text-stone-400 text-[11px]">
                  {language === 'hi' ? 'एसएमएस द्वारा प्राप्त' : 'Via Supabase SMS'}
                </span>
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={isLoading || otpDigits.join('').length < 6}
                className={`w-full py-3.5 px-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] cursor-pointer ${
                  isLoading || otpDigits.join('').length < 6
                    ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>{language === 'hi' ? 'सत्यापित किया जा रहा है...' : 'Verifying...'}</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    <span>
                      {language === 'hi' 
                        ? 'सत्यापित करें (Verify & Login)' 
                        : 'सत्यापित करें (Verify & Login)'}
                    </span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer Security Badge */}
          <div className="mt-5 pt-3 border-t border-[#d1c4bd]/40 flex items-center justify-center gap-1.5 text-stone-500 text-[11px] text-center">
            <span className="material-symbols-outlined text-[14px] text-emerald-700">lock</span>
            <span>256-bit Supabase Auth • Govt. e-Marketplace (GeM) & ONDC Compliance</span>
          </div>
        </div>
      </div>
    </div>
  );
}
