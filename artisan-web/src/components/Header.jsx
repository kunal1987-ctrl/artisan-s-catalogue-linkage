import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

/**
 * Header Component (Hero Banner for Shilp Setu)
 * Fully internationalized using react-i18next hook `useTranslation`.
 * Translates title, subtitle, features, capture CTA, and voice status dynamically.
 */
export default function Header({ showLanguageSwitcher = true }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2e241e] via-[#3d2e24] to-[#1e1713] p-6 lg:p-8 text-white shadow-xl">
      {/* Decorative ambient background glows */}
      <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-radial from-[#ff9062]/20 via-transparent to-transparent pointer-events-none blur-2xl" />
      <div className="absolute right-8 top-8 w-40 h-40 rounded-full bg-[#ff9062]/5 pointer-events-none blur-xl" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2 max-w-2xl">
          {/* Top metadata tags & optional header language switcher */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#ffdeaa] backdrop-blur-md">
              <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
              <span className="text-[11px] font-bold tracking-wider uppercase">Instant AI Cataloger</span>
            </div>
            <span className="text-[12px] text-[#ffdeaa] flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">translate</span>
              Hindi, Gujarati, Tamil +9 supported
            </span>
            {showLanguageSwitcher && (
              <div className="sm:hidden mt-1">
                <LanguageSwitcher />
              </div>
            )}
          </div>

          {/* Dynamic translated Title */}
          <h3 className="text-[28px] font-bold text-white tracking-tight leading-tight mt-1">
            {t('title')}
          </h3>

          {/* Dynamic translated Subtitle */}
          <p className="text-[15px] text-[#e6e2dc] leading-relaxed">
            {t('subtitle')}
          </p>

          {/* Dynamic translated Feature Bullets */}
          <div className="flex flex-wrap items-center gap-6 mt-2 text-[13px] text-[#d4c3ba]">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-[#ffb599]">record_voice_over</span>
              {t('feature_1')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-[#ffb599]">bolt</span>
              {t('feature_2')}
            </span>
          </div>
        </div>

        {/* Action Button & Voice Status */}
        <div className="flex flex-col gap-3 shrink-0 w-full sm:w-auto">
          <button
            onClick={() => navigate('/capture')}
            className="px-7 py-4 rounded-full bg-white text-[#2e241e] font-bold text-[15px] flex items-center justify-center gap-3 shadow-lg hover:bg-[#f7f3ed] active:scale-95 transition-all cursor-pointer"
            type="button"
          >
            <div className="w-9 h-9 rounded-full bg-[#2e241e] text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">photo_camera</span>
            </div>
            <span>{t('button_text')}</span>
            <span className="material-symbols-outlined text-[20px] text-[#9c441c]">arrow_forward</span>
          </button>
          <p className="text-center text-[12px] text-[#d4c3ba] font-medium flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[15px]">mic</span>
            {t('voice_status')}
          </p>
        </div>
      </div>
    </div>
  );
}
