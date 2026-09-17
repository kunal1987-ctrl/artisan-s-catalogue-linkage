import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage, SUPPORTED_LANGUAGES } from '../context/LanguageContext';
import { Globe, Check, X, Sparkles, Volume2 } from 'lucide-react';

/**
 * AtmLanguageSelector Component
 * 
 * Styled like an Indian Bank ATM screen:
 * - High-contrast, tactile, thumb-friendly physical-style push buttons.
 * - Displays each language prominently in its native script (e.g., "English", "हिंदी", "বাংলা", "தமிழ்", "తెలుగు", "मराठी").
 * - Shows phonetic English subtitle, regional cluster tag, and active checkmark.
 * - Supports dual modes:
 *     1. `mode="modal"`: Dialog popup triggered from header, navbar, or footer.
 *     2. `mode="inline"`: ATM Welcome Board embedded directly in the Home / Landing view.
 * - Instant client-side switching (<50ms) using react-i18next with no browser reload.
 */
export default function AtmLanguageSelector({
  mode = 'inline', // 'inline' | 'modal'
  isOpen = false,
  onClose = () => {},
  className = '',
}) {
  const { t } = useTranslation();
  const { language, setLanguage, isAtmLanguageModalOpen, closeAtmLanguageModal } = useLanguage();

  const activeCode = language || 'hi';
  const showModal = mode === 'modal' ? (isOpen || isAtmLanguageModalOpen) : false;

  // Always call closeAtmLanguageModal (the real state setter).
  // Never rely on the `onClose` prop alone — it defaults to () => {} which is
  // truthy and would short-circuit the real handler with the old `||` pattern.
  const handleClose = () => {
    closeAtmLanguageModal();
    if (typeof onClose === 'function') onClose();
  };

  const handleSelectLanguage = (code) => {
    // Instant switch < 50ms
    setLanguage(code);
    if (mode === 'modal') {
      if (closeAtmLanguageModal) closeAtmLanguageModal();
      if (onClose) onClose();
    }
  };

  // Content for the ATM Keypad Grid
  const renderKeypad = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3.5 w-full">
      {SUPPORTED_LANGUAGES.map((langItem) => {
        const isSelected = activeCode === langItem.code;

        return (
          <button
            key={langItem.code}
            type="button"
            onClick={() => handleSelectLanguage(langItem.code)}
            aria-pressed={isSelected}
            className={`group relative flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer text-left select-none outline-none active:scale-[0.98] ${
              isSelected
                ? 'bg-gradient-to-br from-[#2e241e] via-[#3d2e24] to-[#1e1713] text-white border-[#ff9062] shadow-lg shadow-[#2e241e]/20 ring-2 ring-[#ff9062]/30'
                : 'bg-white hover:bg-[#fbf7f2] text-gray-900 border-[#d1c4bd]/60 hover:border-[#9c441c]/50 shadow-xs hover:shadow-md'
            }`}
          >
            {/* Top row: Native Initial Badge + Status checkmark */}
            <div className="flex items-center justify-between w-full mb-2">
              <span
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-black text-sm sm:text-base transition-transform group-hover:scale-105 shadow-xs ${
                  isSelected
                    ? 'bg-[#ff9062] text-[#2e241e]'
                    : 'bg-[#f1ede7] text-[#9c441c] group-hover:bg-[#9c441c] group-hover:text-white'
                }`}
              >
                {langItem.keyChar}
              </span>

              {isSelected ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ff9062]/20 text-[#ffb599] border border-[#ff9062]/40 text-[10px] sm:text-[11px] font-extrabold tracking-wide">
                  <Check className="w-3 h-3 text-[#ff9062]" />
                  <span>{t('atm.active_badge', 'Active')}</span>
                </span>
              ) : (
                <span className="text-[10px] text-gray-600 group-hover:text-gray-900 font-semibold uppercase tracking-wider">
                  {langItem.code.toUpperCase()}
                </span>
              )}
            </div>

            {/* Middle row: Prominent Native Script */}
            <div className="flex flex-col">
              <span
                className={`text-lg sm:text-2xl font-black tracking-tight leading-tight transition-colors ${
                  isSelected ? 'text-white' : 'text-gray-900 group-hover:text-[#9c441c]'
                }`}
              >
                {langItem.native}
              </span>
              <span
                className={`text-xs sm:text-sm font-semibold mt-0.5 ${
                  isSelected ? 'text-[#ffdeaa]' : 'text-gray-600'
                }`}
              >
                {langItem.name}
              </span>
            </div>

            {/* Bottom row: Region descriptor */}
            <div className="mt-2 pt-2 border-t border-current/10 flex items-center justify-between text-[10px] sm:text-[11px]">
              <span className={`truncate font-medium ${isSelected ? 'text-gray-300' : 'text-gray-600'}`}>
                {langItem.region}
              </span>
              <span
                className={`text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity ml-1 ${
                  isSelected ? 'text-[#ff9062]' : 'text-[#9c441c]'
                }`}
              >
                →
              </span>
            </div>

            {/* Tactile 3D button bevel overlay */}
            <div
              className={`absolute inset-0 rounded-2xl pointer-events-none transition-opacity ${
                isSelected
                  ? 'border-t border-white/20'
                  : 'border-t border-white/80 group-hover:border-[#9c441c]/20'
              }`}
            />
          </button>
        );
      })}
    </div>
  );

  // ═════════════════════════════════════════════════════
  // MODAL MODE (Global Dialog)
  // ═════════════════════════════════════════════════════
  if (mode === 'modal') {
    if (!showModal) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="atm-modal-title"
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={handleClose}
        />

        {/* ATM Machine Terminal Card */}
        <div className="relative w-full max-w-xl bg-[#fdf9f3] rounded-3xl shadow-2xl border-4 border-[#2e241e] overflow-hidden z-10 animate-in zoom-in-95 duration-250 flex flex-col">
          {/* ATM Top Header Bar */}
          <div className="bg-gradient-to-r from-[#2e241e] via-[#3d2e24] to-[#2e241e] px-4 sm:px-6 py-3.5 sm:py-4 text-white flex items-center justify-between border-b-2 border-[#ff9062]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#ff9062]/20 border border-[#ff9062]/40 flex items-center justify-center text-[#ff9062]">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h3 id="atm-modal-title" className="text-base sm:text-lg font-black tracking-tight leading-none text-white">
                  {t('atm.title', 'Select Language')} / भाषा चुनें
                </h3>
                <p className="text-[11px] text-[#ffdeaa] mt-1 font-medium">
                  {t('atm.subtitle', 'Tap your preferred language to translate the app instantly')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="relative z-[60] w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer border border-white/20 active:scale-95"
              aria-label={t('atm.cancel', 'Close')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Instruction Strip */}
          <div className="bg-[#ebe8e2] px-4 sm:px-6 py-2 border-b border-[#d1c4bd]/60 flex items-center text-xs text-[#2e241e] font-semibold">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#9c441c]" />
              <span>{t('atm.switch_prompt', 'Touch any language to switch')}</span>
            </span>
          </div>

          {/* ATM Keypad Body */}
          <div className="p-4 sm:p-6 bg-[#fdf9f3] max-h-[75vh] overflow-y-auto">
            {renderKeypad()}
          </div>

          {/* ATM Bottom Footer */}
          <div className="bg-[#f1ede7] px-4 sm:px-6 py-3 border-t border-[#d1c4bd]/60 flex items-center justify-between">
            <span className="text-[11px] text-gray-600 font-medium">
              {t('atm.current_lang', 'Current Language')}: <strong className="text-gray-900">{SUPPORTED_LANGUAGES.find(l => l.code === activeCode)?.native}</strong>
            </span>
            <button
              type="button"
              onClick={handleClose}
              className="relative z-[60] px-4 py-1.5 rounded-full bg-[#2e241e] hover:bg-[#45372d] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              {t('atm.cancel', 'Close')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════
  // INLINE MODE (Direct Welcome Board on Home screen)
  // ═════════════════════════════════════════════════════
  return (
    <section
      aria-label="Regional Language Selection Board"
      className={`relative w-full rounded-3xl bg-gradient-to-b from-[#ffffff] to-[#fbf7f2] border-2 border-[#d1c4bd]/60 p-4 sm:p-6 shadow-sm overflow-hidden ${className}`}
    >
      {/* Decorative top pill badge */}
      <div className="flex items-center gap-2.5 pb-3 mb-3 sm:mb-4 border-b border-[#d1c4bd]/40">
        <div className="w-8 h-8 rounded-xl bg-[#9c441c]/10 text-[#9c441c] flex items-center justify-center font-bold shrink-0">
          <Globe className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-black text-primary tracking-tight">
            {t('atm.heading', 'Select Language')}
          </h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {t('atm.subheading', 'Choose your language. All text updates instantly.')}
          </p>
        </div>
      </div>

      {/* ATM Push Buttons Keypad */}
      {renderKeypad()}
    </section>
  );
}
