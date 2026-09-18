import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

/**
 * AuthGuard Component
 * ─────────────────────────────────────────────────────────────────────────────
 * Protects routes from unauthenticated access.
 * Immediately unmounts protected views and redirects to /login with replace: true
 * if !supabase.auth.getUser().
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function AuthGuard({ children }) {
  const { artisanProfile, user } = useAuth();
  const location = useLocation();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const { data, error } = await supabase.auth.getUser();
        const activeUser = data?.user;

        if (error || !activeUser || activeUser.is_anonymous) {
          // Check if verification profile is present
          if (artisanProfile?.verified || (user && !user.is_anonymous && (user.email || user.phone))) {
            if (isMounted) {
              setIsAuthed(true);
              setIsVerifying(false);
            }
            return;
          }
          if (isMounted) {
            setIsAuthed(false);
            setIsVerifying(false);
          }
          return;
        }

        if (isMounted) {
          setIsAuthed(true);
          setIsVerifying(false);
        }
      } catch {
        if (isMounted) {
          setIsAuthed(false);
          setIsVerifying(false);
        }
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [user, artisanProfile]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#fdf9f3] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-primary">Verifying access...</p>
      </div>
    );
  }

  if (!isAuthed) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
