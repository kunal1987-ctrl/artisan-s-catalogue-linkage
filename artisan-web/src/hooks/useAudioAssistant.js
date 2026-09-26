import { useContext, useCallback, useMemo } from 'react';
import AudioAssistantContext from '../context/AudioAssistantContext';
import audioAssistantService from '../services/audioAssistantService';
import { AUDIO_INSTRUCTION_KEYS } from '../constants/audioInstructions';

// Mapping legacy speakPrompt keys to pre-generated instruction keys
const PROMPT_TO_INSTRUCTION_MAP = {
  home: AUDIO_INSTRUCTION_KEYS.WELCOME,
  welcome: AUDIO_INSTRUCTION_KEYS.WELCOME,
  camera_step: AUDIO_INSTRUCTION_KEYS.CAMERA_INSTRUCTION,
  camera_instruction: AUDIO_INSTRUCTION_KEYS.CAMERA_INSTRUCTION,
  multiple_photos: AUDIO_INSTRUCTION_KEYS.MULTIPLE_PHOTO_INSTRUCTION,
  voice_step: AUDIO_INSTRUCTION_KEYS.MIC_INSTRUCTION,
  mic_instruction: AUDIO_INSTRUCTION_KEYS.MIC_INSTRUCTION,
  recording_started: AUDIO_INSTRUCTION_KEYS.RECORDING_STARTED,
  recording_stopped: AUDIO_INSTRUCTION_KEYS.RECORDING_STOPPED,
  processing: AUDIO_INSTRUCTION_KEYS.PROCESSING_INSTRUCTION,
  processing_instruction: AUDIO_INSTRUCTION_KEYS.PROCESSING_INSTRUCTION,
  product_generated: AUDIO_INSTRUCTION_KEYS.PRODUCT_GENERATED,
  price_step: AUDIO_INSTRUCTION_KEYS.PRICE_INSTRUCTION,
  price_instruction: AUDIO_INSTRUCTION_KEYS.PRICE_INSTRUCTION,
  price_generated: AUDIO_INSTRUCTION_KEYS.PRICE_GENERATED,
  review: AUDIO_INSTRUCTION_KEYS.REVIEW_INSTRUCTION,
  review_instruction: AUDIO_INSTRUCTION_KEYS.REVIEW_INSTRUCTION,
  publishing: AUDIO_INSTRUCTION_KEYS.PUBLISHING_INSTRUCTION,
  publishing_instruction: AUDIO_INSTRUCTION_KEYS.PUBLISHING_INSTRUCTION,
  soundbox_success: AUDIO_INSTRUCTION_KEYS.PUBLISHED_SUCCESSFULLY,
  published_successfully: AUDIO_INSTRUCTION_KEYS.PUBLISHED_SUCCESSFULLY,
  error: AUDIO_INSTRUCTION_KEYS.GENERIC_ERROR,
  generic_error: AUDIO_INSTRUCTION_KEYS.GENERIC_ERROR,
  network_error: AUDIO_INSTRUCTION_KEYS.NETWORK_ERROR,
};

/**
 * useAudioAssistant
 * ─────────────────────────────────────────────────────────────────────────────
 * Primary consumer hook for the Shilp Setu Global Audio Assistant.
 *
 * Exposes:
 * - playInstruction(key, options): Plays a pre-generated fixed audio instruction
 * - stopInstruction(): Halts any active audio
 * - pauseInstruction() / resumeInstruction()
 * - isPlaying / isSpeaking (boolean)
 * - isUnlocked (boolean): whether browser user-gesture has unlocked playback
 * - audioEnabled (boolean): user preference (persisted in localStorage)
 * - toggleAudio() / enableAudio() / toggleMute()
 * - replayCurrentInstruction(): replays current or last instruction
 * - speakPrompt(promptKey): backward-compatible prompt mapper
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function useAudioAssistant() {
  const context = useContext(AudioAssistantContext);

  // Fallback to direct service if used outside of Provider (e.g. in tests)
  const isPlaying = context ? context.isPlaying : audioAssistantService.isPlaying();
  const isUnlocked = context ? context.isUnlocked : audioAssistantService.isAudioUnlocked();
  const audioEnabled = context ? context.audioEnabled : audioAssistantService.state.audioEnabled;
  const currentKey = context ? context.currentKey : audioAssistantService.state.currentKey;
  const currentTitle = context ? context.currentTitle : audioAssistantService.state.currentTitle;
  const requiresUserGesture = context
    ? context.requiresUserGesture
    : audioAssistantService.state.requiresUserGesture;

  const playInstruction = useCallback(
    (key, options) => {
      if (context?.playInstruction) {
        return context.playInstruction(key, options);
      }
      return audioAssistantService.playInstruction(key, options);
    },
    [context]
  );

  const stopInstruction = useCallback(() => {
    if (context?.stopInstruction) {
      context.stopInstruction();
    } else {
      audioAssistantService.stopInstruction();
    }
  }, [context]);

  const pauseInstruction = useCallback(() => {
    if (context?.pauseInstruction) {
      context.pauseInstruction();
    } else {
      audioAssistantService.pauseInstruction();
    }
  }, [context]);

  const resumeInstruction = useCallback(() => {
    if (context?.resumeInstruction) {
      return context.resumeInstruction();
    }
    return audioAssistantService.resumeInstruction();
  }, [context]);

  const toggleAudio = useCallback(
    (forceVal) => {
      if (context?.toggleAudio) {
        return context.toggleAudio(forceVal);
      }
      return audioAssistantService.toggleAudio(forceVal);
    },
    [context]
  );

  const enableAudio = useCallback(() => {
    if (context?.enableAudio) {
      return context.enableAudio();
    }
    return audioAssistantService.enableAudio();
  }, [context]);

  const unlockAudio = useCallback(() => {
    if (context?.unlockAudio) {
      return context.unlockAudio();
    }
    return audioAssistantService.unlockAudio();
  }, [context]);

  const replayCurrentInstruction = useCallback(() => {
    if (context?.replayCurrentInstruction) {
      return context.replayCurrentInstruction();
    }
    return audioAssistantService.replayCurrentInstruction();
  }, [context]);

  // Backward-compatible speakPrompt method
  const speakPrompt = useCallback(
    (promptKey, interpolations = {}, options = {}) => {
      const mappedInstruction = PROMPT_TO_INSTRUCTION_MAP[promptKey] || promptKey;
      if (AUDIO_INSTRUCTION_KEYS[mappedInstruction?.toUpperCase()] || PROMPT_TO_INSTRUCTION_MAP[promptKey]) {
        return playInstruction(mappedInstruction, options);
      }
      // If no pre-rendered instruction matches, attempt generic fallback
      return playInstruction(AUDIO_INSTRUCTION_KEYS.WELCOME, options);
    },
    [playInstruction]
  );

  // Backward-compatible speak method
  const speak = useCallback(
    (text, options = {}) => {
      // If prompt key matches directly, play pre-rendered audio
      if (typeof text === 'string' && PROMPT_TO_INSTRUCTION_MAP[text]) {
        return playInstruction(PROMPT_TO_INSTRUCTION_MAP[text], options);
      }
      // Otherwise stop and preserve app stability
      console.info('[useAudioAssistant] Dynamic TTS speak requested:', text?.slice?.(0, 30));
    },
    [playInstruction]
  );

  return useMemo(
    () => ({
      // Primary API
      playInstruction,
      stopInstruction,
      pauseInstruction,
      resumeInstruction,
      isPlaying,
      isUnlocked,
      audioEnabled,
      enableAudio,
      toggleAudio,
      unlockAudio,
      replayCurrentInstruction,
      currentKey,
      currentTitle,
      requiresUserGesture,

      // Backward compatibility aliases
      isSpeaking: isPlaying,
      isMuted: !audioEnabled,
      toggleMute: () => toggleAudio(),
      setMuted: (val) => toggleAudio(!val),
      stop: stopInstruction,
      speakPrompt,
      speak,
      voicesLoaded: true,
      activeLanguage: context?.currentLanguage || 'hi',
    }),
    [
      playInstruction,
      stopInstruction,
      pauseInstruction,
      resumeInstruction,
      isPlaying,
      isUnlocked,
      audioEnabled,
      enableAudio,
      toggleAudio,
      unlockAudio,
      replayCurrentInstruction,
      currentKey,
      currentTitle,
      requiresUserGesture,
      speakPrompt,
      speak,
      context?.currentLanguage,
    ]
  );
}

export default useAudioAssistant;
