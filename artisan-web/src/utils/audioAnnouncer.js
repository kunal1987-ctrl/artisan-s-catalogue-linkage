/**
 * audioAnnouncer.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Shilp Setu — Multimodal Notification Engine for Low-Literacy Rural Artisans
 *
 * Provides:
 *  • announceOrder(text, lang)  — Hindi TTS via Web Speech Synthesis
 *  • unlockAudio()              — User-gesture unlock for autoplay policy
 *  • playFallbackTone()         — Web Audio API beep when TTS unavailable
 *  • isSupported()              — Feature detection helper
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** @type {AudioContext|null} */
let _audioCtx = null;

/** @type {boolean} — tracks whether audio was unlocked by a user gesture */
let _audioUnlocked = false;

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lazily initialize and return a shared AudioContext.
 * Must be called within a user-gesture handler on iOS / Chrome.
 * @returns {AudioContext|null}
 */
function _getAudioContext() {
  if (_audioCtx) return _audioCtx;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    _audioCtx = new Ctx();
    return _audioCtx;
  } catch (e) {
    console.warn('[audioAnnouncer] AudioContext unavailable:', e);
    return null;
  }
}

/**
 * Selects the best available Hindi voice from speechSynthesis.getVoices().
 * Falls back to any voice if Hindi is not available.
 * @param {string} lang  e.g. 'hi-IN'
 * @returns {SpeechSynthesisVoice|null}
 */
function _pickVoice(lang) {
  if (!window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  // Prefer exact locale match (hi-IN), then language prefix (hi), then any
  return (
    voices.find((v) => v.lang === lang) ||
    voices.find((v) => v.lang.startsWith('hi')) ||
    voices.find((v) => v.default) ||
    (voices.length > 0 ? voices[0] : null)
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns true if Web Speech Synthesis is supported in this browser.
 * @returns {boolean}
 */
export function isSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Plays a short dual-tone beep using the Web Audio API.
 * Used as a fallback when TTS is blocked or unavailable.
 * @param {number} [frequency=880]  — primary tone Hz
 * @param {number} [duration=0.15]  — seconds
 */
export function playFallbackTone(frequency = 880, duration = 0.15) {
  try {
    const ctx = _getAudioContext();
    if (!ctx) return;

    // Resume if suspended (autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Primary tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(frequency, now);
    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + duration);

    // Harmony tone (a major third above)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(frequency * 1.26, now + 0.05);
    gain2.gain.setValueAtTime(0.25, now + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + duration + 0.1);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.05);
    osc2.stop(now + duration + 0.1);
  } catch (e) {
    console.warn('[audioAnnouncer] Fallback tone failed:', e);
  }
}

/**
 * Unlocks the AudioContext by resuming it within a user-gesture handler.
 * Call this on any interactive element's click/tap handler to ensure
 * subsequent auto-play calls work on iOS Safari and Chrome.
 */
export function unlockAudio() {
  if (_audioUnlocked) return;
  try {
    const ctx = _getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().then(() => {
        _audioUnlocked = true;
      }).catch(() => {});
    } else {
      _audioUnlocked = true;
    }

    // Also unlock speechSynthesis with a silent utterance trick
    if (window.speechSynthesis) {
      const silent = new SpeechSynthesisUtterance('');
      silent.volume = 0;
      window.speechSynthesis.speak(silent);
    }
  } catch (e) {
    console.warn('[audioAnnouncer] unlockAudio failed:', e);
  }
}

/**
 * Announces an order using Web Speech Synthesis in Hindi (hi-IN).
 *
 * Design goals for low-literacy rural artisans:
 *  • Authentic Hindi voice (hi-IN)
 *  • Slow, crystal-clear rate (0.9) for easy comprehension
 *  • Pitch 1.0 (natural, not robotic)
 *  • Auto-plays if audio is unlocked; plays fallback tone + queues speech otherwise
 *
 * @param {string} text             — The full Hindi announcement text to speak
 * @param {string} [lang='hi-IN']  — BCP-47 language tag (default hi-IN)
 * @returns {void}
 */
export function announceOrder(text, lang = 'hi-IN') {
  if (!text || typeof text !== 'string') return;

  // ── Play fallback tone first (works even when TTS is blocked) ──────────────
  playFallbackTone(660, 0.18);

  // ── TTS guard ──────────────────────────────────────────────────────────────
  if (!window.speechSynthesis) {
    console.warn('[audioAnnouncer] speechSynthesis not supported, fallback tone only.');
    return;
  }

  try {
    // Cancel any ongoing speech to prioritise the new order announcement
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;   // Slightly slower for clarity
    utterance.pitch = 1.0;  // Natural pitch
    utterance.volume = 1.0;

    // Attempt to select a Hindi voice
    const voice = _pickVoice(lang);
    if (voice) utterance.voice = voice;

    utterance.onerror = (event) => {
      // 'interrupted' is expected when we cancel mid-speech — not a real error
      if (event.error !== 'interrupted') {
        console.warn('[audioAnnouncer] TTS error:', event.error);
        // Play an extra alert tone as fallback
        playFallbackTone(440, 0.3);
      }
    };

    // Workaround for Chrome bug: speechSynthesis stops mid-utterance on long text.
    // Keep-alive by pinging every 10 seconds.
    const keepAlive = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        clearInterval(keepAlive);
        return;
      }
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }, 10000);

    utterance.onend = () => clearInterval(keepAlive);

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('[audioAnnouncer] announceOrder failed:', e);
    playFallbackTone(440, 0.3);
  }
}

/**
 * Builds a natural-sounding Hindi announcement string from an order object.
 * Works with both new schema (source, product_title, total_payout) and
 * legacy schema (channel, item_title, total_amount).
 *
 * @param {object} order — Order record (new or legacy schema)
 * @returns {string}      — Hindi TTS-ready announcement text
 */
export function buildOrderAnnouncementText(order) {
  // Use pre-built voice text if available (from DB)
  if (order.voice_announcement_text) return order.voice_announcement_text;

  const source = order.source || (
    (order.channel || '').toLowerCase().includes('gem') ||
    (order.order_type || '') === 'gem' ? 'GeM' : 'ONDC'
  );
  const qty = order.quantity || 1;
  const payout = order.total_payout || order.total_amount || order.total_price_inr || 0;
  const item = order.product_title || order.item_title || 'शिल्प उत्पाद';

  if (source === 'GeM') {
    return `बधाई हो! सरकारी विभाग GeM से ${qty} पीस का नया आर्डर आया है। ${item}। कुल राशि ₹${Math.round(payout).toLocaleString('en-IN')}। जल्दी से सामान पैक करें।`;
  }
  return `नया आर्डर आया! ONDC नेटवर्क से ${qty} नग ${item} का ऑर्डर है। कुल कीमत ₹${Math.round(payout).toLocaleString('en-IN')}। सामान तैयार करें।`;
}
