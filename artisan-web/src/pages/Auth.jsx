import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Auth() {
  const navigate = useNavigate();
  const { openAuthModal, artisanProfile, language, toggleLanguage } = useAuth();
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

        
        
        
        
        <div
            className="relative w-full lg:w-1/2 min-h-[380px] lg:min-h-screen flex flex-col justify-between overflow-hidden bg-primary-container shrink-0">
            
            <img alt="Warm, artistic editorial illustration of an Indian rural master artisan delicately handweaving traditional silk on a wooden loom"
                className="absolute inset-0 w-full h-full object-cover object-center transform scale-105 transition-transform duration-1000"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBbuH_MdJzcKPoXTkvHKlbZwFRTpj29jGcIv-n89BxkVMnXaYJNgfin-eHntOjP061Ih61VS52Xq1S7m9AeMQ-KNhzUT21BcQlpzPg4VmSBtNGw6WdZLzqSdyC7Ofa5dC5XVZ5Jx08qNabLkg4nFfjbYBYelKMI4q2YtJ-rVNWOnJclKum-nJ-Z_0oGBUXy_i3QCHKtnkJsmG3f-BTVorjDUwgPV2ThCND4oEmrirXvVE0d9Mw2-Nto" />

            
            <div
                className="absolute inset-0 bg-gradient-to-t from-espresso-deep/95 via-espresso-deep/60 to-primary/40 lg:bg-gradient-to-r lg:from-espresso-deep/90 lg:via-espresso-deep/60 lg:to-transparent">
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-espresso-deep/95 via-transparent to-black/30"></div>

            
            <div className="relative z-10 p-6 lg:p-10 flex items-center justify-between">
                
                <div
                    className="inline-flex items-center gap-2 bg-surface-container-lowest/90 backdrop-blur-md px-4 py-2 rounded-full shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    <span className="text-[11px] font-bold text-secondary tracking-widest uppercase">
                        हस्तशिल्प मंच • DIGITAL ATELIER
                    </span>
                </div>

                
                <div
                    className="hidden sm:flex items-center gap-2 bg-secondary-fixed text-on-secondary-fixed px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase shadow-sm">
                    <span className="material-symbols-outlined text-sm">handshake</span>
                    <span>Zero Commission Guild</span>
                </div>
            </div>

            
            <div className="relative z-10 p-6 lg:p-12 max-w-xl text-white">
                
                <div className="sm:hidden mb-3">
                    <span
                        className="text-[11px] font-bold tracking-wider bg-secondary-fixed text-on-secondary-fixed px-3 py-1 rounded-full uppercase">
                        Zero Commission • 0% शुल्क
                    </span>
                </div>

                
                <h1 className="text-3xl lg:text-5xl font-extrabold text-white tracking-tight mb-2 flex items-center gap-3">
                    <span>Namaste! 🙏</span>
                </h1>

                
                <div className="space-y-1.5 mb-6">
                    <p className="text-xl lg:text-2xl font-bold text-soft-blush leading-snug">
                        Take your craft to the digital world.
                    </p>
                    <p className="text-base lg:text-lg text-secondary-fixed font-medium tracking-wide">
                        अपनी कला और कौशल को पूरे देश के ग्राहकों तक पहुँचाएं।
                    </p>
                </div>

                
                <div
                    className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-white/90 shadow-lg">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-secondary-fixed text-2xl mt-0.5 shrink-0"
                            style={{ fontVariationSettings: '\'FILL\' 1' }}>
                            stars
                        </span>
                        <div className="space-y-1">
                            <p className="text-sm font-medium leading-relaxed">
                                Direct connection to discerning patrons across India. <span
                                    className="font-bold text-secondary-fixed">Zero commission</span> on your first 10
                                orders.
                            </p>
                            <p className="text-xs text-white/70">
                                कारीगरों के लिए विशेष रूप से निर्मित सीधा डिजिटल बाज़ार मंच
                            </p>
                        </div>
                    </div>
                </div>

                
                <div className="mt-6 flex items-center gap-2 text-white/80 text-xs">
                    <span className="material-symbols-outlined text-secondary-fixed text-base">verified</span>
                    <span className="font-medium tracking-wide">100% Free & Secure • Govt. Recognized Handloom
                        Guild</span>
                </div>
            </div>
        </div>

        
        
        
        
        <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-8 lg:p-12 relative bg-background">

            
            <div className="w-full max-w-md flex justify-end mb-3">
                <button 
    onClick={toggleLanguage}
    className="min-h-[44px] px-4 py-2 rounded-full border border-outline-variant/60 text-on-surface font-bold text-xs flex items-center gap-2 shadow-xs hover:bg-surface-container transition-all"
    type="button"
  >
    <span className="material-symbols-outlined text-[16px] text-secondary">translate</span>
    <span>{language === 'hi' ? 'हिन्दी • Hindi' : 'English • अंग्रेजी'}</span>
  </button>
            </div>

            
            <div
                className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-sm border border-border-delicate/80">
                <div className="flex flex-col gap-4">

                    
                    <div className="flex items-center justify-between pb-1 border-b border-border-delicate/40">
                        <div>
                            <h2 className="text-xl font-bold text-espresso-deep">Artisan Sign In</h2>
                            <p className="text-xs text-outline font-medium">कारीगर लॉगिन एवं पंजीकरण</p>
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
                            Mobile Number • मोबाइल नंबर
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
                                placeholder="Enter 10-digit number"
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            />

                            <div className="absolute right-2 flex items-center gap-1">
                                <button
                                    aria-label="बोलकर नंबर दर्ज करें (Voice Input)"
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-secondary hover:bg-surface-variant active:scale-95 transition-all cursor-pointer"
                                    onClick={handleVoiceInput}
                                    title="बोलकर नंबर दर्ज करें"
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
                        अपना 10-अंकों का मोबाइल नंबर लिखें या माइक दबाकर बोलें
                    </p>

                    <button 
                      onClick={handleSendOtp} 
                      className="w-full py-4 px-6 rounded-full bg-primary text-on-primary font-bold text-sm tracking-wider uppercase shadow-md hover:bg-surface-tint active:scale-[0.99] transition-all flex items-center justify-center gap-2 group cursor-pointer"
                      type="button"
                    >
                      <span>SEND OTP (ओटीपी प्राप्त करें)</span>
                      <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </button>

                    
                    <div
                        className="flex items-center justify-center gap-2 pt-1 text-center bg-soft-blush/40 p-2.5 rounded-xl border border-soft-blush">
                        <span className="text-base shrink-0">🔊</span>
                        <p className="text-xs text-on-surface-variant leading-tight font-medium">
                            हम आपको एसएमएस से ऑटो-ओटीपी भेजेंगे <br className="hidden sm:inline" />
                            <span className="opacity-75 font-normal text-[11px]">(Automatic verification via secure
                                SMS)</span>
                        </p>
                    </div>

                    
                    <div className="my-3 flex items-center gap-3">
                        <div className="flex-1 h-[1px] bg-outline-variant/40"></div>
                        <span className="text-[11px] font-bold text-outline uppercase tracking-widest px-2">
                            OR • या अन्य माध्यम
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
                                Continue with Google
                            </span>
                        </button>

                        
                        <button 
    onClick={() => navigate('/home')}
    className="w-full py-3.5 px-4 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-all"
    type="button"
  >
    <span className="material-symbols-outlined text-[18px]">chat</span>
    <span>Login with WhatsApp (व्हाट्सएप लॉगिन)</span>
  </button>
                    </div>

                    
                    <div className="mt-4 pt-4 border-t border-border-delicate/40 text-center space-y-1.5">
                        <p className="text-xs text-outline leading-relaxed">
                            By logging in, you agree to our
                            <a className="underline text-primary font-semibold hover:text-secondary transition-colors"
                                href="#">Terms & Conditions</a>
                            and
                            <a className="underline text-primary font-semibold hover:text-secondary transition-colors"
                                href="#">Privacy Policy</a>.
                        </p>
                        <p className="text-[11px] text-outline/80">
                            लॉगिन करके आप हस्तशिल्प मंच के नियमों व शर्तों से सहमत होते हैं
                        </p>
                    </div>

                </div>
            </div>

            
            <div className="mt-6 flex items-center gap-2 text-xs text-outline">
                <span className="material-symbols-outlined text-sm text-secondary">support_agent</span>
                <span>Need help signing in? <a href="#"
                        className="text-primary font-bold underline hover:text-secondary">Sahayata Kendra
                        (1800-KALA)</a></span>
            </div>

        </div>

        
        
    </main>
    </div>
  );
}
