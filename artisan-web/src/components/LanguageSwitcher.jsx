import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage, SUPPORTED_LANGUAGES } from '../context/LanguageContext';
import { Globe, ChevronDown } from 'lucide-react';

/**
 * LanguageSwitcher Component
 * 
 * Prominent ATM-style language launcher displayed in top navigation headers.
 * Clicking triggers the tactile ATM Regional Language Selector modal.
 * Displays the current active language in its native script with tactile styling.
 */
export default function LanguageSwitcher({ className = '', variant = 'compact' }) {
  const { t, i18n } = useTranslation();
  const { language, openAtmLanguageModal, currentLanguageConfig } = useLanguage();

  const activeLangCode = language || i18n.resolvedLanguage || 'hi';
  const langConfig = currentLanguageConfig || SUPPORTED_LANGUAGES.find((l) => l.code === activeLangCode) || SUPPORTED_LANGUAGES[0];

  return (
    <button
      type="button"
      onClick={openAtmLanguageModal}
      title={`${t('atm.title', 'Select Language')} (${langConfig.native})`}
      aria-label={`${t('atm.title', 'Select Language')} - ${langConfig.native}`}
      className={`group inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full border border-[#d1c4bd]/80 bg-white hover:bg-[#fbf7f2] text-gray-900 shadow-xs hover:shadow-md active:scale-95 transition-all cursor-pointer select-none backdrop-blur-md ${className}`}
    >
      {/* ATM Key Initial Badge */}
      <span className="w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-full bg-[#9c441c]/15 text-[#9c441c] flex items-center justify-center text-[11px] font-black group-hover:bg-[#9c441c] group-hover:text-white transition-colors shadow-2xs">
        {langConfig.keyChar}
      </span>

      {/* Prominent Native Script */}
      <span className="text-xs sm:text-[13px] font-extrabold tracking-tight text-gray-900 group-hover:text-[#9c441c] transition-colors">
        {langConfig.native}
      </span>

      {/* ATM Tag / Code */}
      <span className="hidden sm:inline-flex items-center text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-[#2e241e]/10 text-[#2e241e] border border-[#2e241e]/20">
        ATM
      </span>

      <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#9c441c] transition-colors" />
    </button>
  );
}
