import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

/**
 * VerificationBanner
 * A clean, light government portal warning banner that prompts unverified artisans
 * to complete their official MoSJE / Udyam / Pehchan verification before selling.
 */
export default function VerificationBanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, artisanProfile } = useAuth?.() || {};
  const [isVerified, setIsVerified] = useState(null); // null while checking, boolean once resolved

  useEffect(() => {
    let isMounted = true;

    const checkVerificationStatus = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const activeUserId = authData?.user?.id || user?.id;

        if (!activeUserId) {
          const cached = localStorage.getItem('artisan_gov_verified');
          if (isMounted) setIsVerified(cached === 'true');
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('is_verified')
          .eq('id', activeUserId)
          .maybeSingle();

        if (!error && profile && isMounted) {
          const verified = Boolean(profile.is_verified);
          setIsVerified(verified);
          if (verified) {
            localStorage.setItem('artisan_gov_verified', 'true');
          }
        } else if (isMounted) {
          const cached = localStorage.getItem('artisan_gov_verified') === 'true' || Boolean(artisanProfile?.is_verified);
          setIsVerified(cached);
        }
      } catch (err) {
        console.warn('[VerificationBanner] Error fetching verification status:', err);
        if (isMounted) {
          setIsVerified(localStorage.getItem('artisan_gov_verified') === 'true');
        }
      }
    };

    checkVerificationStatus();

    // Listen to local storage changes for real-time sync across tabs or modal completions
    const handleStorageChange = () => {
      if (localStorage.getItem('artisan_gov_verified') === 'true') {
        setIsVerified(true);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user, artisanProfile]);

  // Do not render banner if verified, logged in, loading, or already on the verification page
  const isLoggedIn = Boolean(
    (user && !user.is_anonymous) ||
    artisanProfile?.verified ||
    artisanProfile?.is_verified ||
    (typeof window !== 'undefined' && localStorage.getItem('artisan_verified_email'))
  );

  if (
    isVerified === true ||
    isLoggedIn ||
    isVerified === null ||
    location.pathname === '/verification' ||
    location.pathname === '/verify'
  ) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 text-yellow-800 px-4 py-3 sm:px-6 shadow-xs w-full transition-all">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Alert Icon & Bilingual Message */}
        <div className="flex items-center gap-2.5">
          <span className="text-lg leading-none shrink-0" role="img" aria-label="alert">
            ⚠️
          </span>
          <div className="text-xs sm:text-sm font-medium leading-relaxed">
            <span className="font-bold text-yellow-900">
              Action Required: Complete your Government Artisan Verification to unlock selling.
            </span>
            <span className="text-yellow-700 block sm:inline sm:ml-2 text-[11px] sm:text-xs">
              (GeM / ONDC पर बेचने के लिए अपना सत्यापन पूरा करें)
            </span>
          </div>
        </div>

        {/* CTA Button */}
        <div className="shrink-0 w-full sm:w-auto flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/verification')}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800 text-white font-bold text-xs sm:text-sm shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Verify Now (अभी सत्यापित करें)</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
