/**
 * fulfillmentNotifications.js — Multimodal Notification Utility for Shilp Setu
 * ─────────────────────────────────────────────────────────────────────────────
 * Designed strictly for zero-literacy rural artisans:
 * 1. Visual: High-contrast, emoji-free, conversational confirmation text.
 * 2. Haptic: Physical mobile vibration pattern [100, 50, 100] for tactile feedback.
 * 3. Audio: Native SpeechSynthesis in Hindi (hi-IN) speaking the exact confirmation aloud.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const FULFILLMENT_MESSAGES = {
  ACCEPT_ORDER: 'आर्डर स्वीकार कर लिया गया है',
  MARK_PACKED: 'सामान पैक हो गया। डिलीवरी वाले को सूचित कर दिया गया है।',
  DISPATCH_ORDER: 'सामान कूरियर को सौंप दिया गया है।',
};

/**
 * Triggers haptic vibration confirmation on mobile devices.
 * @param {number[]} pattern - Vibration intervals in ms (default: [100, 50, 100])
 */
export function triggerHapticConfirmation(pattern = [100, 50, 100]) {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern);
    } catch (err) {
      console.warn('[Haptic] Vibration trigger failed or unsupported:', err);
    }
  }
}

/**
 * Speaks Hindi confirmation text aloud using browser Web Speech Synthesis.
 * Uses hi-IN locale at a steady, clear rate (0.9) for rural artisan comprehension.
 * @param {string} text - The Hindi text to speak
 */
export function triggerSpeechAnnouncement(text) {
  if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  try {
    // Cancel any currently playing speech to prioritize the immediate action confirmation
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';
    utterance.rate = 0.9; // Clear, calm pacing
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Optional voice preference for Hindi
    const voices = window.speechSynthesis.getVoices?.() || [];
    const hindiVoice = voices.find(
      (v) => v.lang === 'hi-IN' || v.lang.startsWith('hi')
    );
    if (hindiVoice) {
      utterance.voice = hindiVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('[SpeechSynthesis] Failed to announce confirmation:', err);
  }
}

/**
 * High-level multimodal confirmation trigger:
 * Combines Haptic Vibration + Audio SpeechSynthesis + Visual Toast Callback.
 *
 * @param {Object} options
 * @param {string} options.text - Conversational message to display and announce
 * @param {Function} [options.showToast] - Callback to display visual UI toast
 * @param {number[]} [options.hapticPattern] - Optional custom vibration array
 */
export function triggerMultimodalNotification({
  text,
  showToast,
  hapticPattern = [100, 50, 100],
}) {
  // 1. Physical Haptic Vibration
  triggerHapticConfirmation(hapticPattern);

  // 2. Hindi Audio TTS
  triggerSpeechAnnouncement(text);

  // 3. Visual UI Toast
  if (typeof showToast === 'function') {
    showToast(text, 'success');
  }
}

/**
 * Action-specific helper: Accept Order confirmation
 */
export function notifyOrderAccepted(showToast) {
  triggerMultimodalNotification({
    text: FULFILLMENT_MESSAGES.ACCEPT_ORDER,
    showToast,
  });
}

/**
 * Action-specific helper: Mark as Packed confirmation
 */
export function notifyOrderPacked(showToast) {
  triggerMultimodalNotification({
    text: FULFILLMENT_MESSAGES.MARK_PACKED,
    showToast,
  });
}

/**
 * Action-specific helper: Dispatch / Shipped confirmation
 */
export function notifyOrderDispatched(showToast) {
  triggerMultimodalNotification({
    text: FULFILLMENT_MESSAGES.DISPATCH_ORDER,
    showToast,
  });
}
