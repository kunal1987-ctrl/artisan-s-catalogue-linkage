import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageSelector({ className = '' }) {
  const { currentLang, changeLanguage, languages } = useLanguage();

  return (
    <select
      value={currentLang}
      onChange={(e) => changeLanguage(e.target.value)}
      className={`bg-amber-50 border border-amber-300 text-stone-800 text-sm rounded-xl px-3 py-1.5 focus:ring-amber-500 font-medium cursor-pointer shadow-xs transition-colors ${className}`}
      aria-label="Select Regional Language"
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.native} ({lang.name})
        </option>
      ))}
    </select>
  );
}
