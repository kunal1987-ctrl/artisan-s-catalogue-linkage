import React from 'react';
import { useTranslation } from 'react-i18next';
import Home from './Home';
import { useAuth } from '../context/AuthContext';
import AudioGuide from '../components/AudioGuide';

/**
 * Dashboard Component for Shilp Setu
 * Clean homepage layout displaying artisan analytics and craft tools.
 */
export default function Dashboard() {
  const { artisanName } = useAuth?.() || {};
  const { t } = useTranslation();

  return (
    <>
      <Home customArtisanName={artisanName} dashboardTitle={t('nav.dashboard', t('dashboard_title', 'Artisan Dashboard'))} />
      <AudioGuide />
    </>
  );
}
