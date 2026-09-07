import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageToggle({ className = '', variant = 'dark' }) {
  const { language, toggleLanguage } = useLanguage();

  const isHindi = language === 'hi';
  // Display the inactive language to invite user action
  const nextLanguageLabel = isHindi ? 'English' : 'हिन्दी';
  const nextLanguageChar = isHindi ? 'A' : 'अ';
  const tooltipText = isHindi ? 'Switch to English' : 'हिन्दी में बदलें';

  const baseStyles = variant === 'light'
    ? 'bg-surface-container-high/80 hover:bg-surface-container-highest text-primary border-outline-variant/50'
    : 'bg-white/10 hover:bg-white/20 text-[#ffdeaa] border-white/20';

  return (
    <button
      onClick={toggleLanguage}
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
