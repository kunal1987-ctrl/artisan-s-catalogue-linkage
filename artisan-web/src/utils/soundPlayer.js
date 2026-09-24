/**
 * soundPlayer.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Universal Cross-Platform Audio Playback Utility (Web & Mobile Compliant)
 *
 * Provides:
 * 1. Singleton Audio management to halt previous tracks and prevent overlapping audio.
 * 2. Mobile Audio Context unlock for iOS Safari and Android Chrome user-gesture requirements.
 * 3. Safe fallback handling for blocked autoplay policies or missing network assets.
 * 4. Future-proofing: static UI instructions use edge-cached MP3s; dynamic text
 *    (TTS appraisals/summaries) can route via Google Cloud TTS or Bhashini backend API.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Singleton audio instance to prevent multiple voices overlapping
let currentAudioInstance = null;
let isAudioUnlocked = false;

/**
 * Mobile Safari / Chrome require an initial user gesture to unlock audio.
 * Call this function on any first tap/click across the app.
 */
export const unlockMobileAudio = () => {
  if (isAudioUnlocked) return;

  try {
    const silentAudio = new Audio();
    // Tiny base64 silent WAV
    silentAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
    const playPromise = silentAudio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          isAudioUnlocked = true;
          silentAudio.pause();
        })
        .catch(() => {
          // Handled silently if interaction did not qualify yet
        });
    }
  } catch (e) {
    // Silent catch for headless or non-supported environments
  }
};

/**
 * Stop any currently playing audio immediately.
 */
export const stopInstructionAudio = () => {
  if (currentAudioInstance) {
    currentAudioInstance.pause();
    currentAudioInstance.currentTime = 0;
    currentAudioInstance = null;
  }
};

/**
 * Plays pre-rendered static audio instructions safely across mobile and web.
 * @param {string} langCode - Language key matching the filename in /audio/ (e.g. 'hi', 'mai', 'ta')
 */
export const playInstructionAudio = (langCode) => {
  if (!langCode) return;

  try {
    // 1. Terminate any currently playing audio immediately to prevent voice overlap
    stopInstructionAudio();

    // Map complex or regional BCP-47 codes (e.g., 'hi-IN' -> 'hi', 'mai-IN' -> 'mai')
    const cleanCode = langCode.includes('-') ? langCode.split('-')[0] : langCode;
    const audioPath = `/audio/${cleanCode}.mp3`;
    const audio = new Audio(audioPath);
    audio.preload = 'auto';
    currentAudioInstance = audio;

    // Reset singleton instance when playback finishes
    audio.onended = () => {
      if (currentAudioInstance === audio) {
        currentAudioInstance = null;
      }
    };

    // 2. Mobile browsers require user interaction context
    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        // Autoplay policy prevented playback or network/file missing
        console.warn(`Autoplay or loading blocked for [${audioPath}]:`, error.message);
      });
    }
  } catch (err) {
    console.error('Audio initialization error:', err);
  }
};

export default {
  unlockMobileAudio,
  playInstructionAudio,
  stopInstructionAudio,
};
