import React from 'react';
import Home from './Home';
import { useAuth } from '../context/AuthContext';

/**
 * Dashboard Component for Shilp Setu
 * Clean homepage layout displaying artisan analytics and craft tools.
 */
export default function Dashboard() {
  const { artisanName } = useAuth?.() || {};

  return <Home customArtisanName={artisanName} />;
}
