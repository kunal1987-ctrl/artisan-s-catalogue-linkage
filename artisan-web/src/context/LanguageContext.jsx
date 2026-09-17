import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import i18n from '../i18n';

export const SUPPORTED_LANGUAGES = [
  {
    code: 'hi',
    name: 'Hindi',
    native: 'हिंदी',
    script: 'Devanagari',
    region: 'North & Central India',
    keyChar: 'अ',
    color: '#9c441c',
  },
  {
    code: 'en',
    name: 'English',
    native: 'English',
    script: 'Latin',
    region: 'Pan-India / Institutional',
    keyChar: 'A',
    color: '#2e241e',
  },
  {
    code: 'bn',
    name: 'Bengali',
    native: 'বাংলা',
    script: 'Bengali',
    region: 'West Bengal & East India',
    keyChar: 'অ',
    color: '#b45309',
  },
  {
    code: 'ta',
    name: 'Tamil',
    native: 'தமிழ்',
    script: 'Tamil',
    region: 'Tamil Nadu & South India',
    keyChar: 'அ',
    color: '#047857',
  },
  {
    code: 'te',
    name: 'Telugu',
    native: 'తెలుగు',
    script: 'Telugu',
    region: 'Andhra Pradesh & Telangana',
    keyChar: 'అ',
    color: '#4338ca',
  },
  {
    code: 'mr',
    name: 'Marathi',
    native: 'मराठी',
    script: 'Devanagari',
    region: 'Maharashtra & West India',
    keyChar: 'म',
    color: '#c2410c',
  },
];

const VALID_CODES = new Set(SUPPORTED_LANGUAGES.map((l) => l.code));
const STORAGE_KEY = 'artisan_language';

const LanguageContext = createContext({
  language: 'hi',
  setLanguage: () => {},
  toggleLanguage: () => {},
  isHindi: true,
  supportedLanguages: SUPPORTED_LANGUAGES,
  currentLanguageConfig: SUPPORTED_LANGUAGES[0],
  isAtmLanguageModalOpen: false,
  openAtmLanguageModal: () => {},
  closeAtmLanguageModal: () => {},
});

export function LanguageProvider({ children }) {
  const [isAtmLanguageModalOpen, setIsAtmLanguageModalOpen] = useState(false);

  const [language, setLanguageState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && VALID_CODES.has(stored)) return stored;
      const currentI18n = i18n.resolvedLanguage || i18n.language || 'hi';
      const matched = SUPPORTED_LANGUAGES.find((l) => currentI18n.startsWith(l.code));
      return matched ? matched.code : 'hi';
    } catch {
      return 'hi';
    }
  });

  // Synchronize with i18next and DOM
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
      document.documentElement.lang = language;
      if (i18n.language !== language && typeof i18n.changeLanguage === 'function') {
        i18n.changeLanguage(language);
      }
    } catch (e) {
      console.warn('[LanguageContext] Storage sync warning:', e);
    }
  }, [language]);

  // Synchronize when i18n changes from other sources
  useEffect(() => {
    const handleLanguageChanged = (lng) => {
      const standardLng = SUPPORTED_LANGUAGES.find((l) => lng?.startsWith(l.code))?.code || 'en';
      setLanguageState((prev) => (prev !== standardLng ? standardLng : prev));
    };
    if (i18n && typeof i18n.on === 'function') {
      i18n.on('languageChanged', handleLanguageChanged);
      return () => {
        i18n.off('languageChanged', handleLanguageChanged);
      };
    }
  }, []);

  const setLanguage = useCallback((newLang) => {
    if (VALID_CODES.has(newLang)) {
      setLanguageState(newLang);
      if (typeof i18n.changeLanguage === 'function') {
        i18n.changeLanguage(newLang);
      }
      try {
        localStorage.setItem(STORAGE_KEY, newLang);
        document.documentElement.lang = newLang;
      } catch (err) {
        console.warn('[LanguageContext] setLanguage storage notice:', err);
      }
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    // Cycle between Hindi and English for quick toggles, or to next supported
    const nextLang = language === 'hi' ? 'en' : 'hi';
    setLanguage(nextLang);
  }, [language, setLanguage]);

  const openAtmLanguageModal = useCallback(() => {
    setIsAtmLanguageModalOpen(true);
  }, []);

  const closeAtmLanguageModal = useCallback(() => {
    setIsAtmLanguageModalOpen(false);
  }, []);

  const currentLanguageConfig = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      isHindi: language === 'hi',
      supportedLanguages: SUPPORTED_LANGUAGES,
      currentLanguageConfig,
      isAtmLanguageModalOpen,
      openAtmLanguageModal,
      closeAtmLanguageModal,
    }),
    [language, setLanguage, toggleLanguage, currentLanguageConfig, isAtmLanguageModalOpen, openAtmLanguageModal, closeAtmLanguageModal]
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
