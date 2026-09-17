import React from 'react';
import { useTranslation } from 'react-i18next';
import useAudioAssistant from '../hooks/useAudioAssistant';

/**
 * AudioAssistantIndicator Component
 *
 * A minimal, text-free animated waveform (equalizer) icon that renders
 * inline in the navigation header only while the audio assistant is
 * actively speaking (speechSynthesis.speaking === true).
 *
 * Design principles:
 *  - Zero visible text — low-literacy users rely on audio + visual cues.
 *  - Compact enough to sit beside other header icons without obstruction.
 *  - aria-label is fully i18n-translated for screen-reader compliance.
 *  - Clicking the indicator mutes the assistant (same as AudioMuteButton).
 */
export default function AudioAssistantIndicator({ className = '' }) {
  const { t } = useTranslation();
  const { isSpeaking, isMuted, toggleMute } = useAudioAssistant();

  // Render nothing when silent or muted — zero layout impact
  if (!isSpeaking || isMuted) return null;

  return (
    <button
      type="button"
      role="status"
      aria-live="polite"
      onClick={toggleMute}
      title={t('audio_prompts.mute', 'Mute Audio Assistant')}
      aria-label={t('audio_prompts.audio_speaking', 'Audio assistant is speaking — tap to mute')}
      className={`relative inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full
        bg-[#ff9062]/15 hover:bg-[#ff9062]/25 border border-[#ff9062]/40
        cursor-pointer active:scale-95 transition-all select-none
        animate-in fade-in duration-300 ${className}`}
    >
      {/* Animated EQ waveform — 4 bars staggered */}
      <span
        aria-hidden="true"
        className="flex items-end gap-[2px] h-4"
      >
        <span className="w-[3px] rounded-full bg-[#ff9062]" style={{ height: '40%', animation: 'eq-bar 0.8s ease-in-out infinite', animationDelay: '0ms' }} />
        <span className="w-[3px] rounded-full bg-[#ff9062]" style={{ height: '80%', animation: 'eq-bar 0.8s ease-in-out infinite', animationDelay: '160ms' }} />
        <span className="w-[3px] rounded-full bg-[#ff9062]" style={{ height: '55%', animation: 'eq-bar 0.8s ease-in-out infinite', animationDelay: '320ms' }} />
        <span className="w-[3px] rounded-full bg-[#ff9062]" style={{ height: '90%', animation: 'eq-bar 0.8s ease-in-out infinite', animationDelay: '80ms' }} />
      </span>

      {/* Subtle pulsing ring — draws attention without text */}
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full border border-[#ff9062]/50 animate-ping opacity-60"
      />
    </button>
  );
}
