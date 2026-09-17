import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationEN from './locales/en/translation.json';
import translationHI from './locales/hi/translation.json';
import translationBN from './locales/bn/translation.json';
import translationTA from './locales/ta/translation.json';
import translationTE from './locales/te/translation.json';
import translationMR from './locales/mr/translation.json';

const resources = {
  en: { translation: translationEN },
  hi: { translation: translationHI },
  bn: { translation: translationBN },
  ta: { translation: translationTA },
  te: { translation: translationTE },
  mr: { translation: translationMR },
};

// Retrieve saved language from localStorage safely
const getInitialLanguage = () => {
  try {
    const saved = localStorage.getItem('artisan_language');
    if (saved && resources[saved]) {
      return saved;
    }
  } catch {
    // Fall back to Hindi/English
  }
  return 'hi';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values to prevent XSS
    },
    react: {
      useSuspense: false, // Immediate synchronous render
    },
  });

export default i18n;
