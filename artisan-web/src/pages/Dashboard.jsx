import React from 'react';
import { useTranslation } from 'react-i18next';
import Home from './Home';
import { useAuth } from '../context/AuthContext';

/**
 * Dashboard Component for Shilp Setu
 * Fully internationalized with react-i18next.
 */
export default function Dashboard() {
  const { t } = useTranslation();
  const { artisanName } = useAuth();

  return <Home customArtisanName={artisanName} />;
}
