import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import { handleAddCraftNavigation } from '../utils/authGuard';

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
            <span className="text-[12px] text-[#ffdeaa] flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">translate</span>
              {t('header.multilingual_support', 'Hindi, Bengali, Marathi +9 supported')}
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

        </div>

        {/* Action Button with Visual Affordance for Low-Literacy Artisans */}
        <div className="flex flex-col shrink-0 w-full sm:w-auto">
          <button
            onClick={(e) => handleAddCraftNavigation(navigate, e)}
            className="relative px-7 py-4 rounded-full bg-white text-[#2e241e] font-bold text-[15px] sm:text-[16px] flex items-center justify-center gap-3.5 shadow-xl hover:bg-[#f7f3ed] active:scale-95 transition-all cursor-pointer group animate-cta-pop"
            type="button"
          >
            {/* Visual affordance: radiating ripple and breathing halo container */}
            <div className="relative flex items-center justify-center shrink-0">
              {/* Continuous gentle radiating ripple (slower, non-aggressive pulse) */}
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-orange-400 opacity-75 animate-ping [animation-duration:2.2s] pointer-events-none"
              />
              {/* Soft ambient breathing glow */}
              <div
                aria-hidden="true"
                className="absolute -inset-1 rounded-full bg-orange-400/40 blur-[2px] animate-pulse pointer-events-none"
              />

              {/* Dark oval section containing the camera and mic icons */}
              <div className="relative z-10 flex items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-[#2e241e] text-white shadow-md group-hover:scale-105 transition-transform shrink-0">
                <span className="material-symbols-outlined text-[18px] leading-none">photo_camera</span>
                <span className="material-symbols-outlined text-[18px] leading-none text-[#ffb599]">mic</span>
              </div>
            </div>

            <span className="font-extrabold text-[15px] sm:text-[16px] tracking-tight">{t('button_text')}</span>
            <span className="material-symbols-outlined text-[22px] text-[#9c441c] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
