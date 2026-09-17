import React from 'react';
import { useTranslation } from 'react-i18next';
import { Volume2, VolumeX } from 'lucide-react';
import useAudioAssistant from '../hooks/useAudioAssistant';

/**
 * AudioMuteButton Component
 * 
 * Prominent, tactile Mute/Unmute toggle for the audio assistant.
 * Can be rendered in navigation headers across the application.
 * Persists the user's audio preference to localStorage.
 */
export default function AudioMuteButton({ className = '', variant = 'default' }) {
  const { t } = useTranslation();
  const { isMuted, toggleMute, isSpeaking } = useAudioAssistant();

  const isLight = variant === 'light';

  return (
    <button
      type="button"
      onClick={toggleMute}
      title={isMuted ? t('audio_prompts.unmute', 'Unmute Audio Assistant') : t('audio_prompts.mute', 'Mute Audio Assistant')}
      aria-label={isMuted ? t('audio_prompts.unmute', 'Unmute Audio Assistant') : t('audio_prompts.mute', 'Mute Audio Assistant')}
      aria-pressed={isMuted}
      className={`relative inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-all cursor-pointer active:scale-95 select-none ${
        isMuted
          ? isLight
            ? 'bg-red-500/20 text-red-200 border border-red-400/40 hover:bg-red-500/30'
            : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
          : isSpeaking
            ? 'bg-[#ff9062] text-[#2e241e] shadow-md shadow-[#ff9062]/30 ring-2 ring-[#ff9062]/50 animate-pulse'
            : isLight
              ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
      } ${className}`}
    >
      {isMuted ? (
        <VolumeX className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
      ) : (
        <Volume2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
      )}

      {/* Tiny active speaking indicator dot */}
      {isSpeaking && !isMuted && (
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white animate-ping" />
      )}
    </button>
  );
}
