import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation resources
import hiTranslation from './locales/hi.json';
import enTranslation from './locales/en.json';
import bnTranslation from './locales/bn.json';
import teTranslation from './locales/te.json';
import mrTranslation from './locales/mr.json';
import taTranslation from './locales/ta.json';
import guTranslation from './locales/gu.json';
import knTranslation from './locales/kn.json';
import orTranslation from './locales/or.json';
import paTranslation from './locales/pa.json';
import saTranslation from './locales/sa.json';
import satTranslation from './locales/sat.json';
import sdTranslation from './locales/sd.json';
import urTranslation from './locales/ur.json';
import brxTranslation from './locales/brx.json';
import doiTranslation from './locales/doi.json';
import kokTranslation from './locales/kok.json';
import ksTranslation from './locales/ks.json';
import maiTranslation from './locales/mai.json';

const resources = {
  hi: { translation: hiTranslation },
  en: { translation: enTranslation },
  bn: { translation: bnTranslation },
  te: { translation: teTranslation },
  mr: { translation: mrTranslation },
  ta: { translation: taTranslation },
  gu: { translation: guTranslation },
  kn: { translation: knTranslation },
  or: { translation: orTranslation },
  pa: { translation: paTranslation },
  sa: { translation: saTranslation },
  sat: { translation: satTranslation },
  sd: { translation: sdTranslation },
  ur: { translation: urTranslation },
  brx: { translation: brxTranslation },
  doi: { translation: doiTranslation },
  kok: { translation: kokTranslation },
  ks: { translation: ksTranslation },
  mai: { translation: maiTranslation },
};

// Safe retrieval of initial language preference with guaranteed fallback
const getInitialLang = () => {
  try {
    const saved = localStorage.getItem('shilp_setu_lang') || 
                  localStorage.getItem('i18nextLng') || 
                  localStorage.getItem('artisan_language');
    const baseCode = saved ? saved.split('-')[0] : 'hi';
    if (resources[baseCode]) return baseCode;
  } catch (e) {
    console.warn('[i18n] Language preference retrieval notice:', e);
  }
  return 'hi';
};

i18n
  .use(LanguageDetector) // Detects language from localStorage/browser
  .use(initReactI18next) // Passes i18n down to react-i18next
  .init({
    resources,
    lng: getInitialLang(),
    fallbackLng: 'hi', // Strict fallback to Hindi if translation key is missing
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'shilp_setu_lang',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false, // React already escapes values to prevent XSS
    },
    react: {
      useSuspense: false, // Prevents flash of unstyled content or suspended UI locks
    },
  });

export default i18n;
