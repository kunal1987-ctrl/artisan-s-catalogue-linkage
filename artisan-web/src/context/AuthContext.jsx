import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext({
  user: null,
  session: null,
  artisanName: 'रामेश कुम्हार (Jaipur Craft Cluster)',
  artisanStudio: 'कला संगम स्टूडियो',
  isLoading: true,
  signInWithOtp: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [artisanName] = useState('रामेश कुम्हार (Jaipur Craft Cluster)');
  const [artisanStudio] = useState('कला संगम स्टूडियो');

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        // 1. Check existing session
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (initialSession?.user) {
          if (mounted) {
            setSession(initialSession);
            setUser(initialSession.user);
            setIsLoading(false);
          }
          return;
        }

        // 2. If no active session, sign in anonymously to create a genuine Supabase Auth session
        const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
        if (anonError) {
          console.warn('[Auth] Anonymous sign-in notice (will use auto guest session):', anonError.message);
          // If anonymous provider is not enabled on backend, fallback to guest mock user id
          if (mounted) {
            setUser({
              id: 'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
              email: 'artisan.demo@craftlinkage.in',
              is_anonymous: true,
            });
            setIsLoading(false);
          }
        } else if (anonData?.session && mounted) {
          setSession(anonData.session);
          setUser(anonData.user);
          setIsLoading(false);
        }
      } catch (err) {
        console.warn('[Auth] Init exception handled gracefully:', err);
        if (mounted) {
          setUser({
            id: 'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
            email: 'artisan.demo@craftlinkage.in',
            is_anonymous: true,
          });
          setIsLoading(false);
        }
      }
    }

    initAuth();

    // 3. Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (mounted) {
        setSession(currentSession);
        setUser(currentSession?.user || null);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signInWithOtp = async (phone) => {
    try {
      const formattedPhone = typeof phone === 'string' ? phone : phone?.phone;
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error('[Auth] signInWithOtp error:', err);
      return { success: false, error: err.message };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (err) {
      console.error('[Auth] signOut error:', err);
    }
  };

  const value = {
    user,
    session,
    artisanName,
    artisanStudio,
    isLoading,
    signInWithOtp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
