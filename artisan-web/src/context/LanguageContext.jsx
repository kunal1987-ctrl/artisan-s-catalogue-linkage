import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import i18n from '../i18n';
import { SUPPORTED_LANGUAGES } from '../constants/languages';
import { playAudioInstruction, getTranslatedText } from '../utils/audio';

export { SUPPORTED_LANGUAGES };

const VALID_CODES = new Set(
  SUPPORTED_LANGUAGES.flatMap((l) => [l.code, l.code.split('-')[0], l.ttsCode].filter(Boolean))
);
const STORAGE_KEY = 'artisan_language';

const LanguageContext = createContext({
  language: 'hi',
  setLanguage: () => {},
  handleLanguageChange: () => {},
  setAppLanguage: () => {},
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
      const matched = SUPPORTED_LANGUAGES.find(
        (l) => currentI18n.startsWith(l.code) || l.code.startsWith(currentI18n)
      );
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
      const baseLang = language.includes('-') ? language.split('-')[0] : language;
      if (i18n.language !== language && typeof i18n.changeLanguage === 'function') {
        i18n.changeLanguage(language).catch(() => {
          i18n.changeLanguage(baseLang);
        });
      }
    } catch (e) {
      console.warn('[LanguageContext] Storage sync warning:', e);
    }
  }, [language]);

  // Synchronize when i18n changes from other sources
  useEffect(() => {
    const handleLanguageChanged = (lng) => {
      const standardLng =
        SUPPORTED_LANGUAGES.find((l) => lng?.startsWith(l.code) || l.code?.startsWith(lng))?.code || 'en';
      setLanguageState((prev) => (prev !== standardLng ? standardLng : prev));
    };
    if (i18n && typeof i18n.on === 'function') {
      i18n.on('languageChanged', handleLanguageChanged);
      return () => {
        i18n.off('languageChanged', handleLanguageChanged);
      };
    }
  }, []);

  const handleLanguageChange = useCallback((selectedLangCode, playAudio = true) => {
    if (!selectedLangCode) return;
    const matched = SUPPORTED_LANGUAGES.find(
      (l) =>
        l.code === selectedLangCode ||
        l.code.split('-')[0] === selectedLangCode ||
        l.code === `${selectedLangCode}-IN` ||
        selectedLangCode.startsWith(l.code.split('-')[0])
    );
    const targetCode = matched ? matched.code : selectedLangCode;

    setLanguageState(targetCode);

    const baseLang = targetCode.includes('-') ? targetCode.split('-')[0] : targetCode;
    if (typeof i18n.changeLanguage === 'function') {
      i18n.changeLanguage(targetCode).catch(() => {
        i18n.changeLanguage(baseLang);
      });
    }

    try {
      localStorage.setItem(STORAGE_KEY, targetCode);
      document.documentElement.lang = targetCode;
    } catch (err) {
      console.warn('[LanguageContext] setLanguage storage notice:', err);
    }

    if (playAudio) {
      // Define a localized welcome or instruction message based on the selection
      const instructionText = getTranslatedText('welcome_instruction', targetCode);
      const ttsCode = matched?.ttsCode || (targetCode.includes('-') ? targetCode : `${targetCode}-IN`);

      // Play the audio instruction in the selected language
      playAudioInstruction(instructionText, ttsCode);
    }
  }, []);

  const setLanguage = useCallback(
    (newLang) => {
      handleLanguageChange(newLang, true);
    },
    [handleLanguageChange]
  );

  const toggleLanguage = useCallback(() => {
    // Cycle between Hindi and English for quick toggles
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
    return (
      SUPPORTED_LANGUAGES.find(
        (l) => l.code === language || l.code.split('-')[0] === language.split('-')[0]
      ) || SUPPORTED_LANGUAGES[0]
    );
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      handleLanguageChange,
      setAppLanguage: handleLanguageChange,
      toggleLanguage,
      isHindi: language === 'hi',
      supportedLanguages: SUPPORTED_LANGUAGES,
      currentLanguageConfig,
      isAtmLanguageModalOpen,
      openAtmLanguageModal,
      closeAtmLanguageModal,
    }),
    [
      language,
      setLanguage,
      handleLanguageChange,
      toggleLanguage,
      currentLanguageConfig,
      isAtmLanguageModalOpen,
      openAtmLanguageModal,
      closeAtmLanguageModal,
    ]
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
