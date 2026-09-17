import React from 'react';
import { useTranslation } from 'react-i18next';
import { Volume2, VolumeX } from 'lucide-react';
import useAudioAssistant from '../hooks/useAudioAssistant';

/**
 * AudioAssistantIndicator Component
 * 
 * Pulsing speaker indicator visible at the top corner of the screen
 * only while the audio assistant is actively speaking (speechSynthesis.speaking is true).
 * Provides clear visual feedback to zero-literacy artisans that the application is speaking to them.
 * Clicking on the indicator provides an immediate 1-tap mute option.
 */
export default function AudioAssistantIndicator() {
  const { t } = useTranslation();
  const { isSpeaking, isMuted, toggleMute } = useAudioAssistant();

  if (!isSpeaking || isMuted) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-3 sm:top-4 right-3 sm:right-6 z-50 pointer-events-auto select-none animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <button
        type="button"
        onClick={toggleMute}
        title={t('audio_prompts.mute', 'Mute Audio Assistant')}
        aria-label={t('audio_prompts.indicator_speaking', 'Audio Assistant Speaking...')}
        className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-[#2e241e] via-[#443831] to-[#2e241e] text-white border-2 border-[#ff9062] shadow-xl shadow-black/25 cursor-pointer hover:scale-105 active:scale-95 transition-all group"
      >
        {/* Pulsing Speaker Icon & Ripple Rings */}
        <div className="relative flex items-center justify-center">
          <span className="absolute w-6 h-6 rounded-full bg-[#ff9062]/40 animate-ping" />
          <span className="relative w-6 h-6 rounded-full bg-[#ff9062] text-[#2e241e] flex items-center justify-center font-bold shadow-xs">
            <Volume2 className="w-3.5 h-3.5 animate-pulse" />
          </span>
        </div>

        {/* Localized Speaking Text */}
        <span className="text-xs sm:text-sm font-extrabold tracking-tight text-[#ffeedd]">
          {t('audio_prompts.indicator_speaking', 'Audio Assistant Speaking...')}
        </span>

        {/* Animated Soundwave EQ Bars */}
        <div className="flex items-end gap-0.5 h-3.5 px-1">
          <span className="w-0.5 h-2 bg-[#ff9062] rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-0.5 h-3.5 bg-white rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-0.5 h-2.5 bg-[#ff9062] rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </button>
    </div>
  );
}
