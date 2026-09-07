import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: '🏛️ GeM Tender Inquiry Available',
    title_hi: '🏛️ GeM निविदा पूछताछ उपलब्ध है',
    message: 'Ministry of Culture published a tender matching your Handicrafts category (50+ units).',
    message_hi: 'संस्कृति मंत्रालय ने आपके हस्तशिल्प श्रेणी (50+ इकाइयां) के लिए निविदा जारी की है।',
    time: '10m ago',
    read: false,
    type: 'tender',
    link: '/catalog',
  },
  {
    id: 'notif-2',
    title: '📦 New ONDC Purchase Order',
    title_hi: '📦 नया ONDC खरीद आदेश',
    message: 'Buyer placed order for 2x Handwoven Silk Sarees. Dispatch within 48h.',
    message_hi: 'खरीदार ने 2x बनारसी रेशम साड़ियों का ऑर्डर दिया। 48 घंटे में डिस्पैच करें।',
    time: '45m ago',
    read: false,
    type: 'order',
    link: '/orders',
  },
  {
    id: 'notif-3',
    title: '⚡ Realtime Sync Active',
    title_hi: '⚡ रीयलटाइम सिंक सक्रिय',
    message: 'Supabase Postgres channel connected. Automatic order readout ready.',
    message_hi: 'सुपाबेस पोस्टग्रेस चैनल कनेक्टेड। स्वचालित ऑर्डर वॉयस रीडआउट तैयार।',
    time: 'Just now',
    read: true,
    type: 'system',
    link: '/home',
  },
];

const AuthContext = createContext({
  user: null,
  session: null,
  artisanName: 'रामेश कुम्हार (Jaipur Craft Cluster)',
  artisanStudio: 'कला संगम स्टूडियो',
  isLoading: true,
  language: 'hi',
  toggleLanguage: () => {},
  setLanguage: () => {},
  notifications: [],
  isNotificationsOpen: false,
  toggleNotifications: () => {},
  closeNotifications: () => {},
  markAllNotificationsRead: () => {},
  unreadCount: 0,
  toast: '',
  showToast: () => {},
  signInWithOtp: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [artisanName] = useState('रामेश कुम्हार (Jaipur Craft Cluster)');
  const [artisanStudio] = useState('कला संगम स्टूडियो');

  // Language state: defaults to Hindi 'hi'
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem('artisan_language') || 'hi';
    } catch {
      return 'hi';
    }
  });

  // Notifications state
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Global lightweight Toast state
  const [toast, setToast] = useState('');

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast('');
    }, 3500);
  };

  const setLanguage = (newLang) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem('artisan_language', newLang);
    } catch {}
    showToast(newLang === 'hi' ? '🇮🇳 भाषा बदलकर हिन्दी की गई' : '🌐 Language switched to English');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'hi' ? 'en' : 'hi');
  };

  const toggleNotifications = () => {
    setIsNotificationsOpen((prev) => !prev);
  };

  const closeNotifications = () => {
    setIsNotificationsOpen(false);
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast(language === 'hi' ? 'सभी सूचनाएं पढ़ी हुई चिह्नित की गईं' : 'All notifications marked as read');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        // 1. Check existing session
        const { data: { session: initialSession } } = await supabase.auth.getSession();

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
    language,
    toggleLanguage,
    setLanguage,
    notifications,
    isNotificationsOpen,
    toggleNotifications,
    closeNotifications,
    markAllNotificationsRead,
    unreadCount,
    toast,
    showToast,
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
