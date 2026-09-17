import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageContext from '../context/LanguageContext';

/**
 * LanguageSwitcher Component
 * Provides an accessible, dynamic toggle between English ('en') and Hindi ('hi')
 * using react-i18next's i18n.changeLanguage() API.
 */
export default function LanguageSwitcher({ className = '', variant = 'compact' }) {
  const { i18n } = useTranslation();
  const langContext = useContext(LanguageContext);
  const setContextLanguage = langContext?.setLanguage;

  const currentLang = (i18n.resolvedLanguage || i18n.language || 'en').startsWith('hi') ? 'hi' : 'en';
  const isHindi = currentLang === 'hi';

  const switchLanguage = (targetLang) => {
    i18n.changeLanguage(targetLang);
    if (setContextLanguage) {
      setContextLanguage(targetLang);
    }
    try {
      localStorage.setItem('artisan_language', targetLang);
      document.documentElement.lang = targetLang;
    } catch {
      // Ignore storage errors in restricted iframe environments
    }
  };

  const handleToggle = () => {
    switchLanguage(isHindi ? 'en' : 'hi');
  };

  if (variant === 'segmented') {
    return (
      <div 
        role="group"
        aria-label="Language selection"
        className={`inline-flex items-center p-1 rounded-full bg-gray-100 border border-gray-200 shadow-inner ${className}`}
      >
        <button
          type="button"
          onClick={() => switchLanguage('en')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
            !isHindi
              ? 'bg-[#2e241e] text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          aria-pressed={!isHindi}
        >
          English
        </button>
        <button
          type="button"
          onClick={() => switchLanguage('hi')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
            isHindi
              ? 'bg-[#9c441c] text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          aria-pressed={isHindi}
        >
          हिन्दी
        </button>
      </div>
    );
  }

  // Default compact toggle switch button
  return (
    <button
      type="button"
      onClick={handleToggle}
      title={isHindi ? 'Switch to English' : 'हिन्दी में बदलें'}
      aria-label={isHindi ? 'Switch to English' : 'Switch to Hindi'}
      className={`group inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full border border-gray-200 bg-white/90 hover:bg-white text-gray-800 shadow-xs hover:shadow-sm active:scale-95 transition-all cursor-pointer backdrop-blur-md ${className}`}
    >
      <span className="w-5 h-5 rounded-full bg-[#9c441c]/15 text-[#9c441c] flex items-center justify-center text-[11px] font-extrabold group-hover:bg-[#9c441c] group-hover:text-white transition-colors">
        {isHindi ? 'अ' : 'A'}
      </span>
      <span className="text-xs font-bold tracking-wide">
        {isHindi ? 'हिन्दी' : 'English'}
      </span>
      <span className="hidden sm:inline text-[10px] text-gray-400 font-semibold uppercase tracking-wider pl-1 border-l border-gray-200">
        {isHindi ? 'EN' : 'HI'}
      </span>
    </button>
  );
}
