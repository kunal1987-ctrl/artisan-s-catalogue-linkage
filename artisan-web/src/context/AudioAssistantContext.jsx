import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import audioAssistantService from '../services/audioAssistantService';
import {
  AUDIO_INSTRUCTION_KEYS,
  CRITICAL_PRELOAD_KEYS,
  DEFAULT_AUDIO_LANGUAGE,
} from '../constants/audioInstructions';
import AudioAssistantWidget from '../components/AudioAssistantWidget';
import { useLanguage } from './LanguageContext';

const AudioAssistantContext = createContext(null);

const SESSION_WELCOME_KEY = 'shilpSetu_welcome_played';

export function AudioAssistantProvider({ children }) {
  const audioRef = useRef(null);
  const location = useLocation();
  const previousPathRef = useRef(location?.pathname || '');
  const { currentLang } = useLanguage ? useLanguage() : { currentLang: DEFAULT_AUDIO_LANGUAGE };

  const [state, setState] = useState(() => audioAssistantService.getState());

  // Handle route transitions to trigger screen-specific instructions and halt previous audio
  useEffect(() => {
    if (!location?.pathname) return;
    const currentPath = location.pathname.toLowerCase();
    const prevPath = previousPathRef.current?.toLowerCase();

    if (prevPath !== currentPath) {
      previousPathRef.current = location.pathname;

      // Stop previous screen audio immediately to prevent overlapping
      audioAssistantService.stopInstruction();

      // Trigger route-level instruction only on entry transition (prevents re-render loops)
      if (currentPath.startsWith('/capture')) {
        audioAssistantService.playInstruction(AUDIO_INSTRUCTION_KEYS.CAMERA_INSTRUCTION);
      } else if (currentPath.startsWith('/review')) {
        audioAssistantService.playInstruction(AUDIO_INSTRUCTION_KEYS.REVIEW_INSTRUCTION);
      } else if (currentPath.startsWith('/success')) {
        audioAssistantService.playInstruction(AUDIO_INSTRUCTION_KEYS.PUBLISHED_SUCCESSFULLY);
      }
    }
  }, [location?.pathname]);

  // 1. Initialize central HTMLAudioElement
  useEffect(() => {
    if (audioRef.current) {
      audioAssistantService.initializeAudio(audioRef.current);
    }
  }, []);

  // 2. Subscribe to AudioAssistantService state changes
  useEffect(() => {
    const unsubscribe = audioAssistantService.subscribe((updatedState) => {
      setState(updatedState);
    });
    return unsubscribe;
  }, []);

  // 3. Keep service language in sync with app LanguageContext
  useEffect(() => {
    if (currentLang) {
      audioAssistantService.setLanguage(currentLang);
    }
  }, [currentLang]);

  // 4. Preload critical instructions into browser cache
  useEffect(() => {
    for (const key of CRITICAL_PRELOAD_KEYS) {
      audioAssistantService.preloadInstruction(key, currentLang);
    }
  }, [currentLang]);

  // 5. Global First-Interaction Listener to unlock audio & play welcome once per session
  useEffect(() => {
    let hasHandledFirstInteraction = false;

    const handleFirstInteraction = async (event) => {
      if (hasHandledFirstInteraction) return;
      hasHandledFirstInteraction = true;

      // Clean up all first-interaction listeners immediately
      window.removeEventListener('pointerdown', handleFirstInteraction, true);
      window.removeEventListener('touchstart', handleFirstInteraction, true);
      window.removeEventListener('click', handleFirstInteraction, true);
      window.removeEventListener('keydown', handleFirstInteraction, true);

      // Unlock browser audio context & audio element
      const unlocked = await audioAssistantService.unlockAudio();

      // Check if welcome audio already played in this browser session
      const welcomeAlreadyPlayed = sessionStorage.getItem(SESSION_WELCOME_KEY);

      if (unlocked && !welcomeAlreadyPlayed && audioAssistantService.state.audioEnabled) {
        sessionStorage.setItem(SESSION_WELCOME_KEY, 'true');
        // Small delay to ensure browser user gesture context is fully registered
        setTimeout(() => {
          audioAssistantService.playInstruction(AUDIO_INSTRUCTION_KEYS.WELCOME, {
            language: currentLang,
            oncePerSession: true,
          });
        }, 150);
      }
    };

    // Attach listeners with capture & once options across all interaction types
    window.addEventListener('pointerdown', handleFirstInteraction, { capture: true, once: true });
    window.addEventListener('touchstart', handleFirstInteraction, { capture: true, once: true });
    window.addEventListener('click', handleFirstInteraction, { capture: true, once: true });
    window.addEventListener('keydown', handleFirstInteraction, { capture: true, once: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction, true);
      window.removeEventListener('touchstart', handleFirstInteraction, true);
      window.removeEventListener('click', handleFirstInteraction, true);
      window.removeEventListener('keydown', handleFirstInteraction, true);
    };
  }, [currentLang]);

  // 6. Action wrappers
  const playInstruction = useCallback((key, options = {}) => {
    return audioAssistantService.playInstruction(key, options);
  }, []);

  const stopInstruction = useCallback(() => {
    audioAssistantService.stopInstruction();
  }, []);

  const pauseInstruction = useCallback(() => {
    audioAssistantService.pauseInstruction();
  }, []);

  const resumeInstruction = useCallback(() => {
    return audioAssistantService.resumeInstruction();
  }, []);

  const toggleAudio = useCallback((forceVal = null) => {
    return audioAssistantService.toggleAudio(forceVal);
  }, []);

  const enableAudio = useCallback(() => {
    return audioAssistantService.enableAudio();
  }, []);

  const unlockAudio = useCallback(() => {
    return audioAssistantService.unlockAudio();
  }, []);

  const replayCurrentInstruction = useCallback(() => {
    return audioAssistantService.replayCurrentInstruction();
  }, []);

  const contextValue = {
    ...state,
    playInstruction,
    stopInstruction,
    pauseInstruction,
    resumeInstruction,
    toggleAudio,
    enableAudio,
    unlockAudio,
    replayCurrentInstruction,
    setLanguage: (lang) => audioAssistantService.setLanguage(lang),
    isAudioUnlocked: () => audioAssistantService.isAudioUnlocked(),
  };

  return (
    <AudioAssistantContext.Provider value={contextValue}>
      {children}
      {/* Central hidden HTMLAudioElement mounted at root */}
      <audio
        ref={audioRef}
        id="shilp-setu-global-audio"
        preload="auto"
        className="hidden"
        aria-hidden="true"
      />
      {/* Persistent global floating audio widget */}
      <AudioAssistantWidget />
    </AudioAssistantContext.Provider>
  );
}

export function useAudioAssistantContext() {
  const ctx = useContext(AudioAssistantContext);
  if (!ctx) {
    throw new Error('useAudioAssistantContext must be used within an AudioAssistantProvider');
  }
  return ctx;
}

export default AudioAssistantContext;
