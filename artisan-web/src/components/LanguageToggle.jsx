import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageToggle({ className = '', variant = 'dark' }) {
  const { i18n } = useTranslation();
  const { language, toggleLanguage, setLanguage } = useLanguage();

  const currentLang = (i18n.resolvedLanguage || i18n.language || language || 'en').startsWith('hi') ? 'hi' : 'en';
  const isHindi = currentLang === 'hi';

  const nextLanguageLabel = isHindi ? 'English' : 'हिन्दी';
  const nextLanguageChar = isHindi ? 'A' : 'अ';
  const tooltipText = isHindi ? 'Switch to English' : 'हिन्दी में बदलें';

  const handleToggle = () => {
    const nextLang = isHindi ? 'en' : 'hi';
    i18n.changeLanguage(nextLang);
    if (setLanguage) {
      setLanguage(nextLang);
    } else if (toggleLanguage) {
      toggleLanguage();
    }
  };

  const baseStyles = variant === 'light'
    ? 'bg-surface-container-high/80 hover:bg-surface-container-highest text-primary border-outline-variant/50'
    : 'bg-white/10 hover:bg-white/20 text-[#ffdeaa] border-white/20';

  return (
    <button
      onClick={handleToggle}
      type="button"
      title={tooltipText}
      aria-label={tooltipText}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer backdrop-blur-md ${baseStyles} ${className}`}
    >
      <span className="w-5 h-5 rounded-full bg-[#ff9062]/20 text-[#ff9062] flex items-center justify-center text-[11px] font-extrabold">
        {nextLanguageChar}
      </span>
      <span className="tracking-wide">{nextLanguageLabel}</span>
    </button>
  );
}
