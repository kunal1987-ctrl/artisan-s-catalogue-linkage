import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Mapping of i18n language codes to regional BCP-47 tags
 * and native language name hints for matching browser voices.
 */
const REGIONAL_LANG_MAP = {
  hi: { bcp47: 'hi-IN', names: ['hindi', 'hi_in', 'hi-in', 'हिन्दी', 'हिंदी'] },
  bn: { bcp47: 'bn-IN', names: ['bengali', 'bangla', 'bn_in', 'bn-in', 'বাংলা'] },
  ta: { bcp47: 'ta-IN', names: ['tamil', 'ta_in', 'ta-in', 'தமிழ்'] },
  te: { bcp47: 'te-IN', names: ['telugu', 'te_in', 'te-in', 'తెలుగు'] },
  mr: { bcp47: 'mr-IN', names: ['marathi', 'mr_in', 'mr-in', 'मराठी'] },
  en: { bcp47: 'en-IN', names: ['india', 'en-in', 'en_in', 'english', 'en-gb', 'en-us'] },
};

// Global event names to synchronize mute and speaking states across all hook instances
const EVENT_MUTE_CHANGE = 'artisan-audio-assistant-mute-change';
const EVENT_SPEAKING_CHANGE = 'artisan-audio-assistant-speaking-change';

let _globalIsMuted = null;
let _globalIsSpeaking = false;
let _globalKeepAliveTimer = null;

// Read initial mute state safely from localStorage
function getInitialMuteState() {
  if (_globalIsMuted !== null) return _globalIsMuted;
  try {
    const saved = localStorage.getItem('artisan_audio_muted');
    _globalIsMuted = saved === 'true';
  } catch {
    _globalIsMuted = false;
  }
  return _globalIsMuted;
}

// Broadcast speaking status to all hook instances & UI indicators
function setGlobalSpeaking(speaking) {
  if (_globalIsSpeaking === speaking) return;
  _globalIsSpeaking = speaking;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(EVENT_SPEAKING_CHANGE, { detail: { isSpeaking: speaking } })
    );
  }
}

// Broadcast mute status to all hook instances & UI indicators
function setGlobalMute(muted) {
  _globalIsMuted = muted;
  try {
    localStorage.setItem('artisan_audio_muted', String(muted));
  } catch (e) {
    console.warn('[useAudioAssistant] Failed to persist mute state:', e);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(EVENT_MUTE_CHANGE, { detail: { isMuted: muted } })
    );
  }
  if (muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      setGlobalSpeaking(false);
    } catch {
      // ignore
    }
  }
}

/**
 * Pick the best regional browser voice matching the active language
 */
export function pickRegionalVoice(langCode = 'hi') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  const voices = window.speechSynthesis.getVoices?.() || [];
  if (!voices.length) return null;

  const config = REGIONAL_LANG_MAP[langCode] || REGIONAL_LANG_MAP.hi;
  const bcp47Lower = config.bcp47.toLowerCase();
  const langCodeLower = langCode.toLowerCase();

  // 1. Exact BCP-47 tag match (e.g., 'hi-IN', 'ta-IN')
  let matched = voices.find((v) => v.lang && v.lang.toLowerCase() === bcp47Lower);
  if (matched) return matched;

  // 2. Language prefix match (e.g., 'hi', 'bn', 'ta', 'te', 'mr')
  matched = voices.find(
    (v) => v.lang && v.lang.toLowerCase().replace('_', '-').startsWith(langCodeLower)
  );
  if (matched) return matched;

  // 3. Name search in voice label (e.g., "Google हिन्दी", "Microsoft Heera - Hindi (India)")
  matched = voices.find((v) => {
    const vName = (v.name || '').toLowerCase();
    return config.names.some((n) => vName.includes(n));
  });
  if (matched) return matched;

  // 4. Any Indian English voice for English fallback
  if (langCode === 'en') {
    matched = voices.find(
      (v) => (v.lang && v.lang.toLowerCase().includes('en')) || (v.name && v.name.toLowerCase().includes('india'))
    );
    if (matched) return matched;
  }

  // 5. Default device voice
  return voices.find((v) => v.default) || voices[0] || null;
}

/**
 * Custom React hook for language-aware Web Speech API Text-to-Speech audio assistant.
 * 
 * Features:
 * - Reads current active language from react-i18next dynamically
 * - Selects regional voice from browser's native voice list
 * - Synchronized mute state across components with localStorage persistence
 * - Visual speaking state tracking for pulsing audio indicators
 * - Automatic cancellation on unmount to prevent memory leaks and overlapping prompts
 * - Chrome long-utterance keep-alive protection
 */
export function useAudioAssistant() {
  const { t, i18n } = useTranslation();
  const [isSpeaking, setIsSpeaking] = useState(_globalIsSpeaking);
  const [isMuted, setIsMuted] = useState(getInitialMuteState);
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  const activeLangCode = i18n.resolvedLanguage || i18n.language || 'hi';
  const activeLangRef = useRef(activeLangCode);
  activeLangRef.current = activeLangCode;

  const currentUtteranceRef = useRef(null);

  // Sync with global events for mute and speaking changes
  useEffect(() => {
    const handleMuteChange = (e) => {
      if (typeof e?.detail?.isMuted === 'boolean') {
        setIsMuted(e.detail.isMuted);
      }
    };

    const handleSpeakingChange = (e) => {
      if (typeof e?.detail?.isSpeaking === 'boolean') {
        setIsSpeaking(e.detail.isSpeaking);
      }
    };

    window.addEventListener(EVENT_MUTE_CHANGE, handleMuteChange);
    window.addEventListener(EVENT_SPEAKING_CHANGE, handleSpeakingChange);

    return () => {
      window.removeEventListener(EVENT_MUTE_CHANGE, handleMuteChange);
      window.removeEventListener(EVENT_SPEAKING_CHANGE, handleSpeakingChange);
    };
  }, []);

  // Listen for browser voice population
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const updateVoices = () => {
      const v = window.speechSynthesis.getVoices?.();
      if (v && v.length > 0) {
        setVoicesLoaded(true);
      }
    };

    updateVoices();

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      if (window.speechSynthesis.onvoiceschanged === updateVoices) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Periodic safety check to synchronize isSpeaking in case browser drops events
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const interval = setInterval(() => {
      const speaking = Boolean(window.speechSynthesis.speaking);
      if (speaking !== _globalIsSpeaking) {
        setGlobalSpeaking(speaking);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  /**
   * Immediately stops any active speech synthesis and clears keep-alive timers
   */
  const stop = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      if (_globalKeepAliveTimer) {
        clearInterval(_globalKeepAliveTimer);
        _globalKeepAliveTimer = null;
      }
      window.speechSynthesis.cancel();
    } catch (e) {
      console.warn('[useAudioAssistant] stop speech error:', e);
    } finally {
      setGlobalSpeaking(false);
      currentUtteranceRef.current = null;
    }
  }, []);

  /**
   * Speaks the specified text in the active regional language
   */
  const speak = useCallback(
    (text, options = {}) => {
      if (!text || typeof text !== 'string') return;
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

      // Honor user mute preference
      if (_globalIsMuted) return;

      const {
        rate = 0.9,      // Steady, clear cadence for rural artisan comprehension
        pitch = 1.0,     // Natural voice pitch
        volume = 1.0,
        lang = activeLangRef.current,
        onStart,
        onEnd,
        onError,
      } = options;

      try {
        // Cancel any pending speech before starting new prompt
        stop();

        const config = REGIONAL_LANG_MAP[lang] || REGIONAL_LANG_MAP.hi;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = config.bcp47;
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;

        // Pick regional voice
        const voice = pickRegionalVoice(lang);
        if (voice) utterance.voice = voice;

        utterance.onstart = () => {
          setGlobalSpeaking(true);
          if (onStart) onStart();
        };

        utterance.onend = () => {
          if (_globalKeepAliveTimer) {
            clearInterval(_globalKeepAliveTimer);
            _globalKeepAliveTimer = null;
          }
          setGlobalSpeaking(false);
          currentUtteranceRef.current = null;
          if (onEnd) onEnd();
        };

        utterance.onerror = (event) => {
          if (_globalKeepAliveTimer) {
            clearInterval(_globalKeepAliveTimer);
            _globalKeepAliveTimer = null;
          }
          setGlobalSpeaking(false);
          currentUtteranceRef.current = null;

          // 'interrupted' is fired when cancel() is deliberately called on navigation/unmount
          if (event?.error !== 'interrupted' && event?.error !== 'canceled') {
            console.warn('[useAudioAssistant] Speech error:', event?.error);
            if (onError) onError(event);
          }
        };

        // Chrome keep-alive workaround for long utterances
        _globalKeepAliveTimer = setInterval(() => {
          if (typeof window === 'undefined' || !window.speechSynthesis) return;
          if (!window.speechSynthesis.speaking) {
            clearInterval(_globalKeepAliveTimer);
            _globalKeepAliveTimer = null;
            return;
          }
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }, 10000);

        currentUtteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('[useAudioAssistant] speak failed:', err);
        setGlobalSpeaking(false);
      }
    },
    [stop]
  );

  /**
   * Speaks a localized prompt string from i18n dictionaries
   * @param {string} promptKey e.g., 'home', 'camera_step', 'voice_step', 'review', 'soundbox_success'
   * @param {object} [interpolations] e.g., { title: 'Terracotta Pot', price: 450 }
   * @param {object} [options] optional overrides
   */
  const speakPrompt = useCallback(
    (promptKey, interpolations = {}, options = {}) => {
      const fullKey = `audio_prompts.${promptKey}`;
      const text = t(fullKey, interpolations);
      if (text && text !== fullKey) {
        speak(text, options);
      }
    },
    [t, speak]
  );

  /**
   * Toggle global mute state
   */
  const toggleMute = useCallback(() => {
    setGlobalMute(!_globalIsMuted);
  }, []);

  /**
   * Explicitly set mute state
   */
  const setMuted = useCallback((val) => {
    setGlobalMute(Boolean(val));
  }, []);

  // Cleanup on unmount: stops any active speech so it doesn't leak or play across screens
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    speak,
    speakPrompt,
    stop,
    isSpeaking,
    isMuted,
    toggleMute,
    setMuted,
    voicesLoaded,
    activeLanguage: activeLangCode,
  };
}

export default useAudioAssistant;
