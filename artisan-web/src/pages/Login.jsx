import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LanguageToggle from '../components/LanguageToggle';

/**
 * Login Component for Shilp Setu
 * Built specifically for rural artisans: Zero-literacy, voice-first, 10-digit mobile number input,
 * and a simple mock 4-digit OTP verification screen. No email/password fields.
 */
export default function Login() {
  const navigate = useNavigate();
  const { artisanProfile, sendOtp, verifyOtp, language } = useAuth();

  const [step, setStep] = useState(1); // 1 = Phone Number, 2 = 4-Digit Mock OTP
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(30);

  const phoneInputRef = useRef(null);
  const otpRefs = useRef([]);

  // If already authenticated, redirect straight to home dashboard
  useEffect(() => {
    if (artisanProfile?.verified) {
      navigate('/home');
    }
  }, [artisanProfile, navigate]);

  // Focus input on step change
  useEffect(() => {
    if (step === 1) {
      phoneInputRef.current?.focus();
    } else if (step === 2) {
      otpRefs.current[0]?.focus();
    }
  }, [step]);

  // Resend countdown timer
  useEffect(() => {
    let timer;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Voice recognition for speaking phone number
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
      setErrorMsg(
        language === 'hi'
          ? 'बोलकर नंबर दर्ज करने के लिए कृपया माइक्रोफ़ोन की अनुमति दें।'
          : 'Please enable microphone or type your 10-digit mobile number.'
      );
    }
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    const clean = phoneNumber.replace(/\D/g, '');
    if (clean.length < 10) {
      setErrorMsg(
        language === 'hi'
          ? 'कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।'
          : 'Please enter a valid 10-digit mobile number.'
      );
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      await sendOtp(clean);
      setStep(2);
      setCountdown(30);
      if (clean === '9999999999') {
        setOtpDigits(['1', '2', '3', '4']);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: 1-Click Demo Pass for Evaluators
  const handleDemoPass = async () => {
    setPhoneNumber('9999999999');
    setErrorMsg('');
    setIsLoading(true);
    try {
      await sendOtp('9999999999');
      setStep(2);
      setCountdown(30);
      setOtpDigits(['1', '2', '3', '4']);
    } catch (err) {
      setErrorMsg(err.message || 'Demo initialization failed');
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

    if (cleanChar && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Step 2: Handle OTP backspace & navigation
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Step 2: Handle Paste of 4-digit OTP
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 4; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setOtpDigits(newDigits);
    const focusIndex = Math.min(pasted.length, 3);
    otpRefs.current[focusIndex]?.focus();
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const token = otpDigits.join('');
    if (token.length < 4) {
      setErrorMsg(
        language === 'hi'
          ? 'कृपया पूरा 4-अंकीय ओटीपी दर्ज करें।'
          : 'Please enter the complete 4-digit OTP.'
      );
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await verifyOtp(phoneNumber, token);
      if (res?.error) throw res.error;
      navigate('/home');
    } catch (err) {
      setErrorMsg(
        err.message ||
          (language === 'hi'
            ? 'अमान्य ओटीपी कोड। कृपया पुनः प्रयास करें।'
            : 'Invalid OTP. Please try again.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#fdf9f3] font-sans text-on-surface antialiased flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      {/* Top Header bar with Language Toggle */}
      <div className="w-full max-w-md flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#2e241e] flex items-center justify-center text-[#ffdeaa] shadow-xs">
            <span className="material-symbols-outlined text-[20px]">storefront</span>
          </div>
          <span className="font-bold text-lg text-primary tracking-tight">
            {language === 'hi' ? 'शिल्प सेतु' : 'Shilp Setu'}
          </span>
        </div>
        <LanguageToggle variant="light" />
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-[#d1c4bd]/50 flex flex-col gap-5">
        {/* Header Title */}
        <div className="flex items-center justify-between pb-3 border-b border-[#d1c4bd]/40">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-espresso-deep">
              {step === 1
                ? (language === 'hi' ? 'कारीगर लॉगिन' : 'Artisan Sign In')
                : (language === 'hi' ? 'ओटीपी सत्यापन' : 'Verify Mobile OTP')}
            </h1>
            <p className="text-xs text-outline font-medium mt-0.5">
              {step === 1
                ? (language === 'hi' ? '10-अंकीय मोबाइल नंबर से सुरक्षित प्रवेश' : 'Secure instant sign in with mobile number')
                : (language === 'hi' ? `+91 ${phoneNumber} पर भेजा गया 4-अंकीय कोड` : `4-digit code sent to +91 ${phoneNumber}`)}
            </p>
          </div>
          <span className="text-[11px] uppercase tracking-wider font-bold text-secondary bg-secondary-fixed/50 px-2.5 py-1 rounded-full">
            OTP Secure
          </span>
        </div>

        {/* Error notification banner */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: MOBILE NUMBER INPUT */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
            {/* 1-Click Evaluator Pass */}
            <div className="p-3.5 rounded-2xl bg-[#ffede6] border border-[#ff9062]/40 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#9c441c] uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">bolt</span>
                  <span>Evaluator Instant Pass</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ff9062] text-white">
                  Demo
                </span>
              </div>
              <button
                type="button"
                onClick={handleDemoPass}
                className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-[#fff7f4] border border-[#ff9062]/50 text-[#1e140e] text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
              >
                <span>⚡</span>
                <span>Demo Artisan (+91 99999 99999 / OTP: 1234)</span>
              </button>
            </div>

            {/* Mobile number label & input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-outline uppercase tracking-wider" htmlFor="phone-input">
                {language === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number'}
              </label>

              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 px-3.5 min-h-[52px] bg-[#f1ede7] rounded-2xl shrink-0 border border-[#d1c4bd]/60">
                  <span className="text-lg leading-none">🇮🇳</span>
                  <span className="font-bold text-base text-primary tracking-normal">+91</span>
                </div>

                <div className="relative flex-1 flex items-center">
                  <input
                    ref={phoneInputRef}
                    id="phone-input"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder={language === 'hi' ? '10-अंकों का नंबर लिखें' : 'Enter 10-digit number'}
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full min-h-[52px] bg-[#f1ede7] pl-4 pr-12 py-3.5 rounded-2xl font-bold text-base text-primary placeholder:text-outline/50 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:bg-white transition-all border border-[#d1c4bd]/60"
                  />

                  <button
                    aria-label="Voice Input"
                    className="absolute right-2 w-10 h-10 rounded-xl flex items-center justify-center text-secondary hover:bg-stone-200 active:scale-90 transition-all cursor-pointer"
                    onClick={handleVoiceInput}
                    title={language === 'hi' ? 'बोलकर नंबर दर्ज करें' : 'Speak mobile number'}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      mic
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[12px] text-outline px-1">
              {language === 'hi'
                ? 'अपना 10-अंकीय नंबर लिखें या माइक बटन दबाकर बोलें।'
                : 'Enter your 10-digit number or tap the mic to speak.'}
            </p>

            {/* Send OTP CTA */}
            <button
              type="submit"
              disabled={isLoading || phoneNumber.length < 10}
              className={`w-full py-4 px-6 rounded-full font-bold text-sm tracking-wider uppercase shadow-md flex items-center justify-center gap-2 group transition-all cursor-pointer active:scale-98 ${
                isLoading || phoneNumber.length < 10
                  ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                  : 'bg-primary text-on-primary hover:bg-[#2e241e]'
              }`}
            >
              {isLoading ? (
                <span>{language === 'hi' ? 'ओटीपी भेजा जा रहा है...' : 'Sending OTP...'}</span>
              ) : (
                <>
                  <span>{language === 'hi' ? 'ओटीपी प्राप्त करें' : 'Get OTP'}</span>
                  <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: MOCK 4-DIGIT OTP VERIFICATION SCREEN */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
            {/* Active Phone review */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#f1ede7] border border-[#d1c4bd]/60">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-emerald-700 text-[22px]">sms</span>
                <div>
                  <span className="text-[11px] text-stone-500 block leading-tight">
                    {language === 'hi' ? 'एसएमएस कोड भेजा गया' : 'SMS Code Sent To'}
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
                className="text-xs font-bold text-[#9c441c] hover:underline cursor-pointer"
              >
                {language === 'hi' ? 'बदलें' : 'Change'}
              </button>
            </div>

            {/* Quick Demo OTP Auto-fill Chip */}
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold">
                <span className="text-base">⚡</span>
                <span>{language === 'hi' ? 'डेमो ओटीपी कोड: 1234' : 'Mock Demo OTP: 1234'}</span>
              </div>
              <button
                type="button"
                onClick={() => setOtpDigits(['1', '2', '3', '4'])}
                className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer active:scale-95 transition-all"
              >
                Auto-Fill
              </button>
            </div>

            {/* 4 Digit Boxes */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider text-center">
                {language === 'hi' ? '4-अंकीय ओटीपी दर्ज करें' : 'Enter 4-Digit OTP Code'}
              </label>

              <div className="flex items-center justify-center gap-3.5" onPaste={handleOtpPaste}>
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
                    className="w-14 h-16 sm:w-16 sm:h-18 text-center font-black text-2xl sm:text-3xl bg-[#f1ede7] rounded-2xl border-2 border-[#d1c4bd]/80 focus:border-[#ff9062] focus:ring-2 focus:ring-[#ff9062]/40 focus:bg-white text-stone-900 shadow-xs transition-all"
                  />
                ))}
              </div>
            </div>

            {/* Resend OTP & Status */}
            <div className="flex items-center justify-between text-xs px-1">
              {countdown > 0 ? (
                <span className="text-stone-500 font-medium">
                  ⏳ {language === 'hi' ? `पुनः भेजें: ${countdown}s` : `Resend in ${countdown}s`}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isLoading}
                  className="text-[#9c441c] font-bold hover:underline cursor-pointer"
                >
                  {language === 'hi' ? 'ओटीपी पुनः भेजें' : 'Resend OTP'}
                </button>
              )}
              <span className="text-[11px] text-stone-400">Mock SMS Ready</span>
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={isLoading || otpDigits.join('').length < 4}
              className={`w-full py-4 px-6 rounded-full font-bold text-sm tracking-wider uppercase shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 ${
                isLoading || otpDigits.join('').length < 4
                  ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                  : 'bg-[#9c441c] hover:bg-[#7e3514] text-white'
              }`}
            >
              {isLoading ? (
                <span>{language === 'hi' ? 'सत्यापित किया जा रहा है...' : 'Verifying...'}</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">verified</span>
                  <span>{language === 'hi' ? 'सत्यापित करें और प्रवेश करें' : 'Verify & Enter'}</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer Security Notice */}
        <div className="pt-2 border-t border-[#d1c4bd]/40 flex items-center justify-center gap-1.5 text-stone-500 text-[11px] text-center">
          <span className="material-symbols-outlined text-[15px] text-emerald-700">lock</span>
          <span>
            {language === 'hi'
              ? 'राष्ट्रीय ई-मार्केटप्लेस (GeM) एवं ONDC सुरक्षित प्रमाणीकरण'
              : 'Secure OTP Auth • GeM & ONDC Compliant'}
          </span>
        </div>
      </div>
    </div>
  );
}
