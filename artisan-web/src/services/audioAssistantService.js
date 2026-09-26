/**
 * audioAssistantService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized, production-grade audio service for Shilp Setu.
 *
 * Core Principles:
 * 1. Single Central HTMLAudioElement: Controls playback across all pages.
 * 2. Mobile User-Gesture Unlock: Safe AudioContext + silent audio buffer unlock.
 * 3. Safe Autoplay Handling: Catches promise rejections without crashing the app.
 * 4. Deduplication & Anti-Looping: Prevents React re-renders from re-triggering audio.
 * 5. Instant Interruption: Halts existing audio before starting a new instruction.
 * 6. Dual-State: Distinguishes between `audioEnabled` (user preference) and
 *    `isAudioUnlocked` (browser audio context readiness).
 * 7. In-Memory Cache: Remembers resolved URLs to eliminate redundant lookups.
 * 8. Language Fallback: Selected Language -> Hindi ('hi') -> English ('en').
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  AUDIO_INSTRUCTION_KEYS,
  AUDIO_INSTRUCTIONS,
  DEFAULT_AUDIO_LANGUAGE,
  FALLBACK_AUDIO_LANGUAGE,
  SUPPORTED_AUDIO_LANGUAGES,
  getCandidateAudioPaths,
} from '../constants/audioInstructions';

const STORAGE_KEY_ENABLED = 'shilpSetu_audio_enabled';
const SESSION_KEY_WELCOME = 'shilpSetu_welcome_played';

class AudioAssistantService {
  constructor() {
    this.audioElement = null;
    this.webAudioContext = null;
    this.audioCache = new Map(); // key+lang -> URL
    this.listeners = new Set();

    // Read saved user preference (defaults to true)
    let initialEnabled = true;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ENABLED);
      if (stored !== null) {
        initialEnabled = stored === 'true';
      }
    } catch {
      initialEnabled = true;
    }

    this.state = {
      audioEnabled: initialEnabled,
      isUnlocked: false,
      isPlaying: false,
      isPaused: false,
      currentKey: null,
      currentLanguage: DEFAULT_AUDIO_LANGUAGE,
      currentTitle: '',
      requiresUserGesture: false,
      lastError: null,
    };

    // Deduplication tracking
    this.lastTriggerKey = null;
    this.lastTriggerTime = 0;
    this.playSequenceId = 0;
  }

  /**
   * Attach the centralized DOM HTMLAudioElement
   */
  initializeAudio(element) {
    if (!element || this.audioElement === element) return;

    this.audioElement = element;
    this.audioElement.preload = 'auto';

    // Hook standard HTMLMediaElement events
    this.audioElement.onplay = () => {
      this._updateState({ isPlaying: true, isPaused: false, requiresUserGesture: false });
    };

    this.audioElement.onpause = () => {
      // Only set isPlaying false if not ended
      if (!this.audioElement.ended) {
        this._updateState({ isPlaying: false, isPaused: true });
      }
    };

    this.audioElement.onended = () => {
      this._updateState({
        isPlaying: false,
        isPaused: false,
        currentKey: null,
        currentTitle: '',
      });
    };

    this.audioElement.onerror = (e) => {
      console.warn('[AudioAssistantService] Audio element playback error:', e);
      this._updateState({
        isPlaying: false,
        isPaused: false,
        lastError: 'Playback error',
      });
    };
  }

  /**
   * Unlock mobile browser audio restrictions (iOS Safari / Android Chrome).
   * Safe to call repeatedly; only executes real unlock once.
   */
  async unlockAudio() {
    if (this.state.isUnlocked) return true;

    try {
      // 1. Resume Web AudioContext if supported
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        if (!this.webAudioContext) {
          this.webAudioContext = new AudioCtx();
        }
        if (this.webAudioContext.state === 'suspended') {
          await this.webAudioContext.resume();
        }
      }

      // 2. Play a microscopic silent WAV via the central audio element
      if (this.audioElement) {
        const previousSrc = this.audioElement.src;
        // Tiny base64 silent WAV
        this.audioElement.src =
          'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
        const p = this.audioElement.play();
        if (p !== undefined) {
          await p;
          this.audioElement.pause();
          this.audioElement.currentTime = 0;
          if (previousSrc && !previousSrc.startsWith('data:')) {
            this.audioElement.src = previousSrc;
          }
        }
      }

      this._updateState({ isUnlocked: true, requiresUserGesture: false });
      return true;
    } catch (err) {
      console.warn('[AudioAssistantService] Gesture unlock deferral:', err.message);
      this._updateState({ isUnlocked: false, requiresUserGesture: true });
      return false;
    }
  }

  /**
   * Play an instruction by key.
   * Interrupts previous playback immediately.
   *
   * @param {string} key - Instruction key e.g. 'welcome', 'camera_instruction'
   * @param {object} [options]
   * @param {string} [options.language] - Language override (defaults to currentLanguage)
   * @param {boolean} [options.force] - Force replay even if recently played
   * @param {boolean} [options.oncePerSession] - If true, only plays once per session
   */
  async playInstruction(key, options = {}) {
    if (!key) return false;

    // Check user preference
    if (!this.state.audioEnabled) {
      return false;
    }

    const { language = this.state.currentLanguage, force = false, oncePerSession = false } = options;

    // Session check (for welcome prompt)
    if (oncePerSession) {
      const sessionKey = `${SESSION_KEY_WELCOME}_${key}`;
      if (sessionStorage.getItem(sessionKey)) {
        return false;
      }
      try {
        sessionStorage.setItem(sessionKey, 'true');
      } catch {
        // ignore
      }
    }

    // Deduplication check: prevent identical triggers in rapid succession (< 800ms)
    const now = Date.now();
    if (!force && this.lastTriggerKey === key && now - this.lastTriggerTime < 800) {
      return false;
    }
    this.lastTriggerKey = key;
    this.lastTriggerTime = now;

    // Generate unique sequence ID to abort if another play call started
    const seqId = ++this.playSequenceId;

    // Stop currently playing instruction immediately
    this.stopInstruction();

    // Check instruction existence
    const instruction = AUDIO_INSTRUCTIONS[key];
    const title = instruction?.title?.[language] || instruction?.title?.hi || key;

    // Update state to show loading / starting
    this._updateState({
      currentKey: key,
      currentTitle: title,
      currentLanguage: language,
      lastError: null,
    });

    // Resolve candidates with language and source fallback
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const candidatePaths = getCandidateAudioPaths(key, language, supabaseUrl);

    let resolvedUrl = this.audioCache.get(`${key}_${language}`);

    // If not cached, test candidate paths
    if (!resolvedUrl) {
      resolvedUrl = await this._resolveAvailableUrl(candidatePaths);
      if (resolvedUrl) {
        this.audioCache.set(`${key}_${language}`, resolvedUrl);
      }
    }

    // If abort sequence was called while resolving URL, cancel
    if (seqId !== this.playSequenceId) return false;

    if (!resolvedUrl) {
      console.warn(`[AudioAssistantService] Could not resolve audio URL for instruction "${key}"`);
      this._updateState({ isPlaying: false, lastError: `Missing audio for ${key}` });
      return false;
    }

    // Perform actual HTMLMediaElement playback
    try {
      if (!this.audioElement) {
        this._createFallbackAudioElement();
      }

      this.audioElement.src = resolvedUrl;
      this.audioElement.currentTime = 0;

      const playPromise = this.audioElement.play();

      if (playPromise !== undefined) {
        await playPromise;
        if (seqId === this.playSequenceId) {
          this._updateState({
            isPlaying: true,
            isPaused: false,
            isUnlocked: true,
            requiresUserGesture: false,
          });
          return true;
        }
      }
    } catch (playbackError) {
      // Browser autoplay policy blocked playback
      console.warn(`[AudioAssistantService] Playback was blocked by browser for "${key}":`, playbackError.message);

      if (seqId === this.playSequenceId) {
        this._updateState({
          isPlaying: false,
          isPaused: false,
          requiresUserGesture: true,
          lastError: 'Autoplay blocked — tap 🔊 to activate',
        });
      }
      return false;
    }

    return true;
  }

  /**
   * Stop any currently playing instruction immediately
   */
  stopInstruction() {
    this.playSequenceId++; // Invalidate pending play calls

    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
      } catch (e) {
        console.warn('[AudioAssistantService] Error stopping audio:', e);
      }
    }

    this._updateState({
      isPlaying: false,
      isPaused: false,
      currentKey: null,
      currentTitle: '',
    });
  }

  /**
   * Pause current playback
   */
  pauseInstruction() {
    if (this.audioElement && this.state.isPlaying) {
      try {
        this.audioElement.pause();
      } catch {
        // ignore
      }
    }
  }

  /**
   * Resume paused playback
   */
  async resumeInstruction() {
    if (this.audioElement && this.state.isPaused) {
      try {
        await this.audioElement.play();
      } catch {
        // ignore
      }
    }
  }

  /**
   * Replays the currently active or last played instruction
   */
  async replayCurrentInstruction() {
    const key = this.state.currentKey || this.lastTriggerKey || AUDIO_INSTRUCTION_KEYS.WELCOME;
    return this.playInstruction(key, { force: true });
  }

  /**
   * Change current language for upcoming instructions
   */
  setLanguage(langCode) {
    if (!langCode) return;
    const cleanLang = langCode.split('-')[0].toLowerCase();
    const effectiveLang = SUPPORTED_AUDIO_LANGUAGES.includes(cleanLang)
      ? cleanLang
      : DEFAULT_AUDIO_LANGUAGE;

    if (effectiveLang !== this.state.currentLanguage) {
      this._updateState({ currentLanguage: effectiveLang });
    }
  }

  /**
   * Toggle global user audio preference (mute/unmute)
   */
  toggleAudio(forceValue = null) {
    const nextVal = forceValue !== null ? Boolean(forceValue) : !this.state.audioEnabled;

    try {
      localStorage.setItem(STORAGE_KEY_ENABLED, String(nextVal));
    } catch {
      // ignore
    }

    if (!nextVal) {
      this.stopInstruction();
    }

    this._updateState({ audioEnabled: nextVal });
    return nextVal;
  }

  /**
   * Enable audio explicitly
   */
  enableAudio() {
    return this.toggleAudio(true);
  }

  /**
   * Preload an instruction into the browser cache
   */
  preloadInstruction(key, language = this.state.currentLanguage) {
    if (!key) return;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const candidates = getCandidateAudioPaths(key, language, supabaseUrl);
    const primaryUrl = candidates[0]?.url;

    if (primaryUrl) {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'audio';
      link.href = primaryUrl;
      document.head.appendChild(link);
    }
  }

  isAudioUnlocked() {
    return this.state.isUnlocked;
  }

  isPlaying() {
    return this.state.isPlaying;
  }

  getState() {
    return { ...this.state };
  }

  /**
   * Subscribe to state updates (React integration)
   */
  subscribe(listener) {
    this.listeners.add(listener);
    // Send immediate snapshot
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  _updateState(partial) {
    this.state = { ...this.state, ...partial };
    for (const listener of this.listeners) {
      try {
        listener(this.getState());
      } catch (err) {
        console.error('[AudioAssistantService] Listener notification error:', err);
      }
    }
  }

  /**
   * Resolves the first reachable audio URL among candidates
   */
  async _resolveAvailableUrl(candidates) {
    // 1. Prefer local static URL first for zero-latency, rock-solid reliability
    const localCandidate = candidates.find((c) => c.source === 'local');
    if (localCandidate) {
      return localCandidate.url;
    }

    // 2. Otherwise return first candidate
    return candidates[0]?.url || null;
  }

  _createFallbackAudioElement() {
    if (typeof document === 'undefined') return;
    let existing = document.getElementById('shilp-setu-global-audio');
    if (!existing) {
      existing = document.createElement('audio');
      existing.id = 'shilp-setu-global-audio';
      existing.preload = 'auto';
      existing.style.display = 'none';
      document.body.appendChild(existing);
    }
    this.initializeAudio(existing);
  }
}

// Export singleton instance
export const audioAssistantService = new AudioAssistantService();
export default audioAssistantService;
