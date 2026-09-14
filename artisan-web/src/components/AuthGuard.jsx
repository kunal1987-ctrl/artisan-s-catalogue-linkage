import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * AuthGuard Component
 * ─────────────────────────────────────────────────────────────────────────────
 * Protects dashboard routes from unauthenticated access.
 * Immediately unmounts protected views and redirects to /login with replace: true.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function AuthGuard({ children }) {
  const { artisanProfile, isLoading } = useAuth();
  const location = useLocation();

  const isAuthed = Boolean(artisanProfile?.verified);

  if (isLoading) {
    return null;
  }

  if (!isAuthed) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
