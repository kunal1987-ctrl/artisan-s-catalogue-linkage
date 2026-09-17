import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage, SUPPORTED_LANGUAGES } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

export default function LanguageToggle({ className = '', variant = 'dark' }) {
  const { t } = useTranslation();
  const { language, openAtmLanguageModal, currentLanguageConfig } = useLanguage();

  const langConfig = currentLanguageConfig || SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  const baseStyles = variant === 'light'
    ? 'bg-surface-container-high/80 hover:bg-surface-container-highest text-primary border-outline-variant/50'
    : 'bg-white/10 hover:bg-white/20 text-[#ffdeaa] border-white/20';

  return (
    <button
      onClick={openAtmLanguageModal}
      type="button"
      title={`${t('atm.title', 'Select Language')} (${langConfig.native})`}
      aria-label={`${t('atm.title', 'Select Language')} - ${langConfig.native}`}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer backdrop-blur-md ${baseStyles} ${className}`}
    >
      <span className="w-5 h-5 rounded-full bg-[#ff9062]/20 text-[#ff9062] flex items-center justify-center text-[11px] font-extrabold">
        {langConfig.keyChar}
      </span>
      <span className="tracking-wide">{langConfig.native}</span>
      <span className="text-[9px] px-1 py-0.2 rounded bg-black/20 text-white font-mono">ATM</span>
    </button>
  );
}
