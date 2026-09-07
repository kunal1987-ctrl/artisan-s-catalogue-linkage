import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LanguageToggle from '../components/LanguageToggle';

export default function Auth() {
  const navigate = useNavigate();
  const { openAuthModal, artisanProfile, language } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');

  // If artisan is already verified, allow direct jump to home
  useEffect(() => {
    if (artisanProfile?.verified) {
      navigate('/home');
    }
  }, [artisanProfile, navigate]);

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.replace(/\D/g, '');
        if (transcript) setPhoneNumber(transcript.slice(0, 10));
      };
      recognition.start();
    } else {
      alert(language === 'hi'
        ? 'बोलकर नंबर दर्ज करने के लिए कृपया माइक्रोफ़ोन चालू रखें या 10-अंकीय नंबर टाइप करें।'
        : 'Please enable microphone or type 10-digit mobile number.');
    }
  };

  const handleSendOtp = () => {
    openAuthModal(() => {
      navigate('/home');
    });
  };

  return (
    <div className="min-h-screen w-full bg-background font-sans text-on-surface antialiased">
      <main className="min-h-screen w-full flex flex-col lg:flex-row bg-background">

        
        
        
        
        <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-8 lg:p-12 relative bg-background">

            
            <div className="w-full max-w-md flex justify-end mb-3">
              <LanguageToggle variant="light" />
            </div>

            
            <div
                className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-sm border border-border-delicate/80">
                <div className="flex flex-col gap-4">

                    
                    <div className="flex items-center justify-between pb-1 border-b border-border-delicate/40">
                        <div>
                            <h2 className="text-xl font-bold text-espresso-deep">
                              {language === 'hi' ? 'कारीगर लॉगिन' : 'Artisan Sign In'}
                            </h2>
                            <p className="text-xs text-outline font-medium">
                              {language === 'hi' ? 'पंजीकरण एवं सुरक्षित प्रवेश' : 'Secure Login & Registration'}
                            </p>
                        </div>
                        <span
                            className="text-[11px] uppercase tracking-wider font-bold text-secondary bg-secondary-fixed/50 px-2.5 py-1 rounded-full">
                            OTP Secure
                        </span>
                    </div>

                    
                    {/* 1-Click Demo Badge */}
                    <div className="p-3 rounded-2xl bg-[#ffede6] border border-[#ff9062]/40 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#9c441c] uppercase tracking-wider flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px]">bolt</span>
                          <span>Evaluator Quick Access</span>
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ff9062] text-white">
                          Instant Pass
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="w-full py-2 px-3 rounded-xl bg-white hover:bg-[#fff7f4] border border-[#ff9062]/50 text-[#1e140e] text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                      >
                        <span className="text-base">⚡</span>
                        <span>Demo Artisan (+91 99999 99999 / OTP: 123456)</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                        <label className="text-xs font-bold text-outline uppercase tracking-wider" htmlFor="phone-input">
                            {language === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number'}
                        </label>
                        <span className="text-xs font-semibold text-muted-gold">Quick Login</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <div
                            className="flex items-center gap-1.5 px-4 min-h-[52px] bg-surface-container-low rounded-2xl shrink-0 shadow-sm border border-border-delicate/50">
                            <span className="text-lg leading-none">🇮🇳</span>
                            <span className="font-bold text-base text-primary tracking-normal">+91</span>
                            <span className="material-symbols-outlined text-outline text-sm leading-none">arrow_drop_down</span>
                        </div>

                        <div className="relative flex-1 flex items-center">
                            <input
                                className="w-full min-h-[52px] bg-surface-container-low pl-4 pr-20 py-3.5 rounded-2xl font-medium text-base text-primary placeholder:text-outline/60 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:bg-alabaster shadow-sm transition-all border border-border-delicate/50"
                                id="phone-input"
                                inputMode="numeric"
                                maxLength={10}
                                placeholder={language === 'hi' ? '10-अंकों का नंबर लिखें' : 'Enter 10-digit number'}
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            />

                            <div className="absolute right-2 flex items-center gap-1">
                                <button
                                    aria-label="Voice Input"
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-secondary hover:bg-surface-variant active:scale-95 transition-all cursor-pointer"
                                    onClick={handleVoiceInput}
                                    title={language === 'hi' ? 'बोलकर नंबर दर्ज करें' : 'Speak phone number'}
                                    type="button"
                                >
                                    <span className="material-symbols-outlined text-[22px]"
                                        style={{ fontVariationSettings: '\'FILL\' 1' }}>mic</span>
                                </button>
                                <span className="material-symbols-outlined text-outline/40 text-[18px] mr-1 pointer-events-none">call</span>
                            </div>
                        </div>
                    </div>
                    
                    <p className="text-xs text-outline px-1">
                        {language === 'hi' ? 'अपना 10-अंकों का मोबाइल नंबर लिखें या माइक दबाकर बोलें' : 'Enter 10-digit mobile number or tap mic to speak'}
                    </p>

                    <button 
                      onClick={handleSendOtp} 
                      className="w-full py-4 px-6 rounded-full bg-primary text-on-primary font-bold text-sm tracking-wider uppercase shadow-md hover:bg-surface-tint active:scale-[0.99] transition-all flex items-center justify-center gap-2 group cursor-pointer"
                      type="button"
                    >
                      <span>{language === 'hi' ? 'ओटीपी प्राप्त करें' : 'SEND OTP'}</span>
                      <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </button>

                    
                    <div
                        className="flex items-center justify-center gap-2 pt-1 text-center bg-soft-blush/40 p-2.5 rounded-xl border border-soft-blush">
                        <span className="text-base shrink-0">🔊</span>
                        <p className="text-xs text-on-surface-variant leading-tight font-medium">
                            {language === 'hi' ? 'हम आपको एसएमएस से ऑटो-ओटीपी भेजेंगे' : 'Automatic verification via secure SMS'}
                        </p>
                    </div>

                    
                    <div className="my-3 flex items-center gap-3">
                        <div className="flex-1 h-[1px] bg-outline-variant/40"></div>
                        <span className="text-[11px] font-bold text-outline uppercase tracking-widest px-2">
                            {language === 'hi' ? 'या अन्य माध्यम' : 'OR CONTINUE WITH'}
                        </span>
                        <div className="flex-1 h-[1px] bg-outline-variant/40"></div>
                    </div>

                    
                    <div className="flex flex-col gap-3">
                        
                        <button
                            className="w-full min-h-[50px] bg-surface-container-low hover:bg-surface-container text-primary py-3 px-5 rounded-2xl border border-border-delicate shadow-sm flex items-center justify-center gap-3 active:scale-[0.99] transition-all cursor-pointer"
                            type="button">
                            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                                <path
                                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                                    fill="#4285F4"></path>
                                <path
                                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
                                    fill="#34A853"></path>
                                <path
                                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
                                    fill="#FBBC05"></path>
                                <path
                                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                                    fill="#EA4335"></path>
                            </svg>
                            <span className="text-sm font-semibold text-espresso-deep">
                                {language === 'hi' ? 'गूगल से जारी रखें' : 'Continue with Google'}
                            </span>
                        </button>

                        <button 
                            onClick={() => navigate('/home')}
                            className="w-full min-h-[50px] bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-3 shadow-sm active:scale-[0.99] transition-all cursor-pointer"
                            type="button"
                        >
                            <span className="material-symbols-outlined text-[20px]">chat</span>
                            <span>{language === 'hi' ? 'व्हाट्सएप से लॉगिन करें' : 'Login with WhatsApp'}</span>
                        </button>

                        <div className="mt-2 text-center">
                            <p className="text-[11px] text-outline/80">
                                {language === 'hi'
                                    ? 'लॉगिन करके आप हस्तशिल्प मंच के नियमों व शर्तों से सहमत होते हैं'
                                    : 'By logging in, you agree to our Terms & Conditions and Privacy Policy.'}
                            </p>
                        </div>
                    </div>

                </div>
            </div>

            
            <div className="mt-6 flex items-center gap-2 text-xs text-outline">
                <span className="material-symbols-outlined text-sm text-secondary">support_agent</span>
                <span>
                    {language === 'hi' ? 'मदद चाहिए?' : 'Need help signing in?'}{' '}
                    <a href="#" className="text-primary font-bold underline hover:text-secondary">
                        {language === 'hi' ? 'सहायता केंद्र (1800-KALA)' : 'Sahayata Kendra (1800-KALA)'}
                    </a>
                </span>
            </div>

        </div>

        
        
    </main>
    </div>
  );
}
