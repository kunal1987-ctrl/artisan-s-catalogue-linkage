import React, { useState } from 'react';
import { Volume2, VolumeX, Square, RotateCcw, Sparkles } from 'lucide-react';
import { useAudioAssistantContext } from '../context/AudioAssistantContext';

/**
 * AudioAssistantWidget
 * ─────────────────────────────────────────────────────────────────────────────
 * Persistent, floating audio guidance control for Shilp Setu.
 *
 * Designed for rural artisans and low-digital-literacy users:
 * - Clear visual indicators: Speaker icon + live audio equalizer wave bars
 * - Prominent "Tap to Enable Voice" banner if browser autoplay was blocked
 * - Replay button to easily re-listen to current or previous instruction
 * - One-tap mute / unmute toggle
 * - Glassmorphic design with warm artisan amber accents
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function AudioAssistantWidget() {
  const {
    isPlaying,
    isPaused,
    isUnlocked,
    audioEnabled,
    currentTitle,
    requiresUserGesture,
    playInstruction,
    stopInstruction,
    toggleAudio,
    unlockAudio,
    replayCurrentInstruction,
  } = useAudioAssistantContext();

  const [isExpanded, setIsExpanded] = useState(false);

  // 1. If browser autoplay was blocked on first visit, show friendly one-tap unlock banner
  if (requiresUserGesture) {
    return (
      <aside
        aria-label="Audio Guidance Activation"
        className="fixed bottom-20 left-4 z-50 max-w-[92vw] sm:max-w-sm animate-bounce"
      >
        <button
          type="button"
          onClick={async () => {
            await unlockAudio();
            await replayCurrentInstruction();
          }}
          className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-medium text-xs sm:text-sm shadow-xl border border-amber-400/40 transition active:scale-95 cursor-pointer backdrop-blur-md"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-base">
            🔊
          </span>
          <div className="text-left">
            <p className="font-bold leading-tight">आवाज चालू करें (Tap to Hear)</p>
            <p className="text-[10px] text-amber-200">बोलकर मार्गदर्शन सुनने के लिए दबाएं</p>
          </div>
        </button>
      </aside>
    );
  }

  // 2. Main Persistent Floating Widget
  return (
    <aside
      aria-label="Voice Guidance Assistant"
      className="fixed bottom-20 left-4 z-40 flex items-center gap-1.5 select-none"
    >
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-full border shadow-lg transition-all duration-300 backdrop-blur-md ${
          isPlaying
            ? 'bg-stone-900/95 border-amber-500/60 shadow-amber-500/20 text-white'
            : audioEnabled
            ? 'bg-stone-900/85 hover:bg-stone-900 border-stone-700/60 text-stone-200'
            : 'bg-stone-900/80 border-stone-800 text-stone-400'
        }`}
      >
        {/* Toggle Audio (Mute / Unmute) */}
        <button
          type="button"
          onClick={() => toggleAudio()}
          title={audioEnabled ? 'आवाज बंद करें (Mute)' : 'आवाज चालू करें (Unmute)'}
          className={`flex items-center justify-center w-8 h-8 rounded-full transition cursor-pointer ${
            audioEnabled
              ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
              : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
          }`}
          aria-label={audioEnabled ? 'Mute guidance' : 'Unmute guidance'}
        >
          {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Live Audio Status Indicator / Title */}
        {isPlaying ? (
          <div className="flex items-center gap-2.5 pr-1">
            {/* Animated Equalizer Waveform */}
            <div className="flex items-center gap-0.5 h-4" aria-hidden="true">
              <span className="w-1 h-3 bg-amber-400 rounded-full animate-bounce" />
              <span className="w-1 h-4 bg-amber-400 rounded-full animate-bounce [animation-delay:0.15s]" />
              <span className="w-1 h-2.5 bg-amber-400 rounded-full animate-bounce [animation-delay:0.3s]" />
            </div>

            <span className="text-xs font-medium text-amber-200 max-w-[140px] sm:max-w-[200px] truncate">
              {currentTitle || 'निर्देश चल रहा है...'}
            </span>

            {/* Stop Button */}
            <button
              type="button"
              onClick={() => stopInstruction()}
              title="रोकें (Stop)"
              className="w-6 h-6 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-300 flex items-center justify-center transition cursor-pointer"
              aria-label="Stop audio"
            >
              <Square className="w-3 h-3 fill-current" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            {/* Quick Replay Button */}
            {audioEnabled && (
              <button
                type="button"
                onClick={() => replayCurrentInstruction()}
                title="दोबारा सुनें (Replay instruction)"
                className="flex items-center gap-1 text-[11px] font-medium text-stone-300 hover:text-amber-300 px-2 py-1 rounded-md transition cursor-pointer"
                aria-label="Replay instruction"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">दोबारा सुनें</span>
              </button>
            )}

            {!audioEnabled && (
              <span className="text-[11px] text-stone-400 px-1">
                आवाज बंद
              </span>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
