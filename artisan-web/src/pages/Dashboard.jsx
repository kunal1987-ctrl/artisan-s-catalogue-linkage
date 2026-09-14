import React from 'react';
import Home from './Home';
import { useAuth } from '../context/AuthContext';

/**
 * Dashboard Component for Shilp Setu
 * ─────────────────────────────────────────────────────────────────────────────
 * Extracts the user's name from the session object:
 * const artisanName = session?.user?.user_metadata?.full_name || 'Artisan';
 * Displays the personalized greeting:
 * Namaste, {artisanName}! (नमस्ते, {artisanName}!)
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function Dashboard() {
  const { artisanName } = useAuth();

  return <Home customArtisanName={artisanName} />;
}
