import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Home from './Home';
import { useAuth } from '../context/AuthContext';
import VerificationCenter from '../components/VerificationCenter';
import { supabase } from '../supabaseClient';

/**
 * Dashboard Component for Shilp Setu
 * Fully internationalized with react-i18next and Government Verification Center.
 */
export default function Dashboard() {
  const { t } = useTranslation();
  const { artisanName, user } = useAuth();
  const [userProfile, setUserProfile] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      let activeUserId = user?.id;
      if (!activeUserId) {
        const { data } = await supabase.auth.getUser();
        activeUserId = data?.user?.id;
      }
      if (activeUserId) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', activeUserId)
          .maybeSingle();
        if (data) {
          setUserProfile(data);
        }
      }
    } catch (e) {
      console.warn('Error fetching profile in Dashboard:', e);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return (
    <div className="space-y-6">
      {/* Government Verification Center (MoSJE / GeM Compliance) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <VerificationCenter 
          userProfile={userProfile} 
          onVerificationSuccess={fetchProfile} 
        />
      </div>

      <Home customArtisanName={artisanName} />
    </div>
  );
}
