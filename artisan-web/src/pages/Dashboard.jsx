import React from 'react';
import Home from './Home';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

/**
 * Dashboard Component for Shilp Setu
 * Clean homepage layout displaying artisan analytics and craft tools.
 */
export default function Dashboard() {
  const { artisanName } = useAuth?.() || {};
  const { t } = useLanguage();

  return <Home customArtisanName={artisanName} dashboardTitle={t('dashboard_title')} />;
}
