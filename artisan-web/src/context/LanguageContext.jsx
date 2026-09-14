import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import i18n from '../i18n';

const LanguageContext = createContext({
  language: 'hi',
  setLanguage: () => {},
  toggleLanguage: () => {},
  isHindi: true,
});

const STORAGE_KEY = 'artisan_language';

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'hi' || stored === 'en') return stored;
      return (i18n.resolvedLanguage || i18n.language || 'hi').startsWith('hi') ? 'hi' : 'en';
    } catch {
      return 'hi';
    }
  });

  // Sync to localStorage, html lang attribute, and i18n instance
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
      document.documentElement.lang = language;
      if (i18n.language !== language && typeof i18n.changeLanguage === 'function') {
        i18n.changeLanguage(language);
      }
    } catch (e) {
      console.warn('Unable to persist language preference:', e);
    }
  }, [language]);

  // Listen to external i18n language changes (e.g. from react-i18next components)
  useEffect(() => {
    const handleLanguageChanged = (lng) => {
      const standardLng = lng?.startsWith('hi') ? 'hi' : 'en';
      setLanguageState((prev) => (prev !== standardLng ? standardLng : prev));
    };
    if (i18n && typeof i18n.on === 'function') {
      i18n.on('languageChanged', handleLanguageChanged);
      return () => {
        i18n.off('languageChanged', handleLanguageChanged);
      };
    }
  }, []);

  const setLanguage = (newLang) => {
    if (newLang === 'hi' || newLang === 'en') {
      setLanguageState(newLang);
      if (typeof i18n.changeLanguage === 'function') {
        i18n.changeLanguage(newLang);
      }
    }
  };

  const toggleLanguage = () => {
    const nextLang = language === 'hi' ? 'en' : 'hi';
    setLanguage(nextLang);
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      isHindi: language === 'hi',
    }),
    [language]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export default LanguageContext;
