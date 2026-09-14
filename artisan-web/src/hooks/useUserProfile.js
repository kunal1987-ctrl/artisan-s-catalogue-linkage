import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

/**
 * Helper function to retrieve the artisan's name directly from the Supabase auth session:
 * const user = (await supabase.auth.getUser()).data.user;
 * const artisanName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'कारीगर';
 */
export async function getArtisanName(fallback = 'कारीगर') {
  try {
    const user = (await supabase.auth.getUser()).data?.user;
    const artisanName = user?.user_metadata?.full_name || user?.user_metadata?.name || fallback;
    return artisanName;
  } catch (err) {
    console.warn('[getArtisanName] Error fetching user profile:', err);
    return fallback;
  }
}

/**
 * useUserProfile Hook
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches the user's name dynamically from the active Supabase auth session:
 * const user = (await supabase.auth.getUser()).data.user;
 * const artisanName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'कारीगर';
 * Ensures graceful fallback to 'कारीगर' or 'Artisan' if name is absent or loading.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function useUserProfile() {
  const { user: contextUser, session, language } = useAuth();
  const fallback = language === 'hi' ? 'कारीगर' : 'Artisan';

  const [artisanName, setArtisanName] = useState(() => {
    return (
      contextUser?.user_metadata?.full_name ||
      contextUser?.user_metadata?.name ||
      session?.user?.user_metadata?.full_name ||
      session?.user?.user_metadata?.name ||
      fallback
    );
  });

  useEffect(() => {
    let isMounted = true;

    async function loadUserProfile() {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        if (isMounted && user) {
          const resolvedName = user?.user_metadata?.full_name || user?.user_metadata?.name;
          if (resolvedName && resolvedName.trim()) {
            setArtisanName(resolvedName.trim());
            return;
          }
        }
      } catch (err) {
        console.warn('[useUserProfile] getUser notice:', err);
      }

      if (isMounted) {
        const fallbackValue =
          contextUser?.user_metadata?.full_name ||
          contextUser?.user_metadata?.name ||
          session?.user?.user_metadata?.full_name ||
          session?.user?.user_metadata?.name ||
          fallback;
        setArtisanName(fallbackValue);
      }
    }

    loadUserProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (isMounted) {
        const currentUser = currentSession?.user;
        const name = currentUser?.user_metadata?.full_name || currentUser?.user_metadata?.name || fallback;
        setArtisanName(name);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [contextUser, session, fallback]);

  return { artisanName, user: contextUser };
}

export default useUserProfile;
