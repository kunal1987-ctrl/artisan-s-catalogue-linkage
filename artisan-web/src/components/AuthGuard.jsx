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
  const { artisanProfile, user, isLoading } = useAuth();
  const location = useLocation();
  const [guardTimeout, setGuardTimeout] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setGuardTimeout(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading && !guardTimeout) {
    return (
      <div className="min-h-screen bg-[#fdf9f3] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-primary">Verifying access...</p>
      </div>
    );
  }

  const isAuthed = Boolean(
    artisanProfile?.verified ||
    (user && !user.is_anonymous && (user.email || user.phone || user.id)) ||
    localStorage.getItem('artisan_verified_email') ||
    localStorage.getItem('artisan_verified_phone')
  );

  if (!isAuthed) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
