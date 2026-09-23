import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import LanguageToggle from '../components/LanguageToggle';

/**
 * Login Component for Shilp Setu
 * ─────────────────────────────────────────────────────────────────────────────
 * Production-ready Supabase Email OTP Authentication Flow:
 * - State 1 ('email_input'): User enters email address to receive 6-digit OTP.
 * - State 2 ('otp_verification'): User inputs 6-digit code with auto-focus & resend.
 * - Navigates immediately to /dashboard upon successful verification.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function Login() {
  const navigate = useNavigate();
  const { session, user, artisanProfile, language, showToast, sendEmailOtp, verifyEmailOtp } = useAuth();

  // Distinct UI States: 'email_input' | 'otp_verification'
  const [authState, setAuthState] = useState('email_input');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(0);

  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const otpRefs = useRef([]);

  // Check onboarding status and redirect accordingly
  const routeUserAfterLogin = async (userId) => {
    try {
      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('has_onboarded')
          .eq('id', userId)
          .maybeSingle();

        if (profile && profile.has_onboarded === false) {
          navigate('/onboarding', { replace: true });
          return;
        }
        if (!profile) {
          // New profile: send to onboarding
          navigate('/onboarding', { replace: true });
          return;
        }
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.warn('[Login] routeUserAfterLogin notice:', err);
      navigate('/dashboard', { replace: true });
    }
  };

  // If session is already verified, check onboarding status before redirect
  useEffect(() => {
    const isAuthed = Boolean(
      artisanProfile?.verified ||
      (user && !user.is_anonymous) ||
      (session && session.user && !session.user.is_anonymous) ||
      localStorage.getItem('artisan_verified_email') ||
      localStorage.getItem('artisan_verified_phone')
    );
    if (isAuthed) {
      const activeId = user?.id || session?.user?.id || localStorage.getItem('artisan_user_id');
      routeUserAfterLogin(activeId);
    }
  }, [session, user, artisanProfile, navigate]);

  // Focus management based on active authState
  useEffect(() => {
    if (authState === 'email_input') {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    } else if (authState === 'otp_verification') {
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  }, [authState]);

  // Countdown timer for OTP resend fallback
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // ── 1-Click Google OAuth Login ──────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // This automatically uses the live URL in production and localhost during development
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) {
        console.error("Error logging in:", error.message);
        setErrorMsg(error.message);
        setIsGoogleLoading(false);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Google sign in failed');
      setIsGoogleLoading(false);
    }
  };

  // ── State 1: Send OTP to Email (Brevo SMTP) ─────────────────────────────────
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      const msg = language === 'hi'
        ? 'कृपया अपना पूरा नाम दर्ज करें'
        : 'Please enter your full name';
      setErrorMsg(msg);
      showToast?.(msg);
      nameInputRef.current?.focus();
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      const msg = language === 'hi' 
        ? 'कृपया एक मान्य ईमेल पता दर्ज करें' 
        : 'Please enter a valid email address';
      setErrorMsg(msg);
      showToast?.(msg);
      emailInputRef.current?.focus();
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      if (sendEmailOtp) {
        await sendEmailOtp(cleanEmail, cleanName);
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            data: {
              full_name: cleanName,
            },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
      }

      setAuthState('otp_verification');
      setOtpDigits(['', '', '', '', '', '']);
      setCountdown(60);

      showToast?.(
        language === 'hi'
          ? 'सत्यापन कोड आपके ईमेल पर भेजा गया है'
          : 'Verification code sent to your email'
      );
    } catch (err) {
      console.error('[Login] sendOtp error:', err);
      const msg = err.message || (
        language === 'hi' 
          ? 'लॉगिन कोड भेजने में विफल। कृपया पुनः प्रयास करें।' 
          : 'Failed to send login code. Please try again.'
      );
      setErrorMsg(msg);
      showToast?.(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ── State 2: Verify 6-digit OTP Token ───────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const otpString = otpDigits.join('').trim();

    if (otpString.length !== 6) {
      const msg = language === 'hi'
        ? 'कृपया पूरा 6-अंकीय कोड दर्ज करें'
        : 'Please enter the complete 6-digit code';
      setErrorMsg(msg);
      showToast?.(msg);
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      if (verifyEmailOtp) {
        await verifyEmailOtp(email.trim().toLowerCase(), otpString);
      } else {
        const { data, error } = await supabase.auth.verifyOtp({
          email: email.trim().toLowerCase(),
          token: otpString,
          type: 'email',
        });
        if (error) throw error;
        if (data?.session || data?.user) {
          const cleanName = name.trim();
          if (cleanName) {
            try {
              await supabase.auth.updateUser({
                data: { full_name: cleanName },
              });
            } catch (updateErr) {
              console.warn('[Login] updateUser metadata notice:', updateErr);
            }
          }
        }
      }

      showToast?.(
        language === 'hi'
          ? 'लॉगिन सफल!'
          : 'Login successful!'
      );
      const activeId = user?.id || session?.user?.id || (await supabase.auth.getUser())?.data?.user?.id;
      await routeUserAfterLogin(activeId);
    } catch (err) {
      console.error('[Login] verifyOtp error:', err);
      const msg = language === 'hi'
        ? 'अमान्य कोड, कृपया पुनः प्रयास करें'
        : 'Invalid code, try again';
      setErrorMsg(msg);
      showToast?.(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ── State 2: Resend Code Fallback ───────────────────────────────────────────
  const handleResendCode = async () => {
    if (countdown > 0 || isLoading) return;

    setIsLoading(true);
    setErrorMsg('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          shouldCreateUser: true,
          data: {
            full_name: name.trim(),
          },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      setCountdown(60);
      setOtpDigits(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();

      showToast?.(
        language === 'hi'
          ? 'नया कोड आपके ईमेल पर भेजा गया है'
          : 'New login code resent to your email'
      );
    } catch (err) {
      console.error('[Login] resend error:', err);
      const msg = err.message || (
        language === 'hi' ? 'कोड पुनः भेजने में विफल' : 'Failed to resend code'
      );
      setErrorMsg(msg);
      showToast?.(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ── OTP Keyboard & Paste Navigation Handlers ───────────────────────────────
  const handleOtpChange = (index, value) => {
    const cleanDigit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = cleanDigit;
    setOtpDigits(newDigits);

    if (cleanDigit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setOtpDigits(newDigits);

    const nextIndex = Math.min(pasted.length, 5);
    otpRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="min-h-screen w-full bg-[#fdf9f3] font-sans text-on-surface antialiased flex flex-col justify-center items-center p-3 sm:p-6 lg:p-8">
      {/* Top Header bar with Logo & Language Toggle */}
      <div className="w-full max-w-md flex justify-between items-center mb-5 sm:mb-6">
        <div 
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group min-w-0"
          title="Shilp Setu"
        >
          <img
            src="/shilp-setu-logo.png"
            alt="Shilp Setu"
            className="h-8 sm:h-10 w-auto object-contain group-hover:scale-105 transition-transform shrink-0"
          />
          <span className="font-bold text-base sm:text-lg text-primary tracking-tight truncate">
            {language === 'hi' ? 'शिल्प सेतु' : 'Shilp Setu'}
          </span>
        </div>
        <LanguageToggle variant="light" />
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-[#d1c4bd]/50 flex flex-col gap-5 sm:gap-6">
        
        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* STATE 1: EMAIL INPUT */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {authState === 'email_input' && (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff9062]/15 text-[#9c441c] text-xs font-bold mb-3">
                <span className="material-symbols-outlined text-[16px]">mail</span>
                <span>{language === 'hi' ? 'सुरक्षित ईमेल लॉगिन' : 'Passwordless Email Login'}</span>
              </div>
              <h1 className="text-2xl font-black text-espresso-deep tracking-tight">
                {language === 'hi' ? 'ईमेल से लॉग इन करें' : 'Sign In with Email'}
              </h1>
              <p className="text-sm text-stone-600 mt-1 leading-relaxed">
                {language === 'hi'
                  ? 'सुरक्षित 6-अंकीय लॉगिन कोड प्राप्त करने के लिए अपना ईमेल दर्ज करें।'
                  : 'Enter your email address to receive a secure 6-digit one-time login code.'}
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] shrink-0 text-red-600">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 1-Click Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading || isGoogleLoading}
              className="w-full py-3 px-4 border border-stone-300 bg-white flex justify-center items-center gap-3 rounded-xl font-medium text-stone-700 hover:bg-stone-50 transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isGoogleLoading ? (
                <div className="flex items-center justify-center gap-2 text-stone-600 font-semibold text-sm">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-stone-600 border-t-transparent"></span>
                  <span>{language === 'hi' ? 'Google पर रीडायरेक्ट किया जा रहा है...' : 'Redirecting to Google...'}</span>
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>{language === 'hi' ? 'Google से 1-क्लिक लॉगिन करें' : 'Sign in with Google'}</span>
                </>
              )}
            </button>

            <div className="relative my-1">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-200"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-stone-500 font-semibold">{language === 'hi' ? 'या ईमेल ओटीपी (Brevo)' : 'Or email OTP'}</span></div>
            </div>

            {/* Full Name Input Field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name-input" className="text-xs font-bold uppercase tracking-wider text-stone-700">
                {language === 'hi' ? 'पूरा नाम' : 'Full Name'}
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-stone-400 text-[20px] pointer-events-none">
                  badge
                </span>
                <input
                  id="name-input"
                  ref={nameInputRef}
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="Your Full Name / आपका नाम"
                  disabled={isLoading}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-[#f7f3ed] border border-[#d1c4bd] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2e241e] text-stone-900 font-medium text-sm transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email-input" className="text-xs font-bold uppercase tracking-wider text-stone-700">
                {language === 'hi' ? 'ईमेल पता' : 'Email Address'}
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-stone-400 text-[20px] pointer-events-none">
                  alternate_email
                </span>
                <input
                  id="email-input"
                  ref={emailInputRef}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="artisan@craftcluster.in"
                  disabled={isLoading}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-[#f7f3ed] border border-[#d1c4bd] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2e241e] text-stone-900 font-medium text-sm transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !name.trim() || !email.trim()}
              className="w-full py-4 px-6 rounded-full bg-[#2e241e] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:bg-[#443831] active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  <span>{language === 'hi' ? 'कोड भेजा जा रहा है...' : 'Sending Code...'}</span>
                </>
              ) : (
                <>
                  <span>{language === 'hi' ? 'लॉगिन कोड भेजें' : 'Send Login Code'}</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* STATE 2: OTP VERIFICATION */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {authState === 'otp_verification' && (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
            <div>
              <button
                type="button"
                onClick={() => {
                  setAuthState('email_input');
                  setErrorMsg('');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9c441c] hover:underline mb-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>{language === 'hi' ? 'ईमेल बदलें' : 'Change email'}</span>
              </button>
              <h1 className="text-2xl font-black text-espresso-deep tracking-tight">
                {language === 'hi' ? '6-अंकीय कोड दर्ज करें' : 'Enter 6-Digit Code'}
              </h1>
              <p className="text-sm text-stone-600 mt-1 leading-relaxed">
                {language === 'hi' ? 'हमने 6-अंकीय कोड इस पते पर भेजा है:' : 'We sent a 6-digit code to:'}{' '}
                <span className="font-bold text-[#2e241e] break-all">{email}</span>
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] shrink-0 text-red-600">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 6 Individual Numeric Digits */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 text-center">
                {language === 'hi' ? 'सत्यापन कोड' : 'Verification Code'}
              </label>
              <div className="flex justify-between items-center gap-1 sm:gap-2">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={handleOtpPaste}
                    disabled={isLoading}
                    className="w-9 h-11 sm:w-12 sm:h-14 text-center text-lg sm:text-2xl font-black rounded-lg sm:rounded-xl bg-[#f7f3ed] border border-[#d1c4bd] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2e241e] text-stone-900 transition-all shadow-xs p-0"
                  />
                ))}
              </div>
            </div>

            {/* Verify & Login Button */}
            <button
              type="submit"
              disabled={isLoading || otpDigits.join('').length !== 6}
              className="w-full py-4 px-6 rounded-full bg-[#2e241e] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:bg-[#443831] active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  <span>{language === 'hi' ? 'सत्यापित किया जा रहा है...' : 'Verifying Code...'}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  <span>{language === 'hi' ? 'सत्यापित करें और लॉग इन करें' : 'Verify & Login'}</span>
                </>
              )}
            </button>

            {/* Resend Code Fallback */}
            <div className="text-center pt-1 border-t border-stone-100 flex items-center justify-center gap-1.5 text-xs text-stone-500">
              <span>{language === 'hi' ? 'कोड नहीं मिला?' : "Didn't receive code?"}</span>
              {countdown > 0 ? (
                <span className="font-semibold text-stone-700">
                  {language === 'hi' ? `${countdown}s में पुनः भेजें` : `Resend in ${countdown}s`}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="font-bold text-[#9c441c] hover:underline cursor-pointer disabled:opacity-50"
                >
                  {language === 'hi' ? 'कोड पुनः भेजें' : 'Resend Code'}
                </button>
              )}
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
