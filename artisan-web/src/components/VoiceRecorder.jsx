import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * DEPLOYMENT & TESTING REQUIREMENT:
 * The Web Speech API strictly requires a secure context (HTTPS).
 * When testing on a mobile device, do NOT test over plain HTTP / local IP (e.g. http://192.168.1.5:5173).
 * Test on the deployed Vercel https:// URL to avoid silent microphone permission blocks.
 */
export default function MobileSafeVoiceRecorder({ onTranscriptionComplete, className = '' }) {
  const { t, i18n } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  const recognitionRef = useRef(null);
  const isIntentionalStopRef = useRef(true);
  const accumulatedTranscriptRef = useRef('');

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      isIntentionalStopRef.current = true;
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const toggleRecording = () => {
    // 1. If currently recording, stop it manually
    if (isRecording) {
      isIntentionalStopRef.current = true;
      setIsRecording(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (onTranscriptionComplete) {
        onTranscriptionComplete(accumulatedTranscriptRef.current.trim());
      }
      return;
    }

    // 2. THE FIX: Initialize DIRECTLY inside the user's click event
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not natively supported in this mobile browser. Please use Chrome or Safari.");
      return;
    }

    // Reset states for a fresh recording
    accumulatedTranscriptRef.current = '';
    setTranscript('');
    isIntentionalStopRef.current = false;

    // Create a fresh instance tied to this exact touch event
    const recognition = new SpeechRecognition();
    
    // Note: iOS Safari ignores continuous=true, but we include it for Android Chrome
    recognition.continuous = true; 
    recognition.interimResults = true;
    
    const currentLang = i18n.language || 'hi';
    const localeMap = { hi: 'hi-IN', bn: 'bn-IN', te: 'te-IN', mr: 'mr-IN', ta: 'ta-IN', en: 'en-IN' };
    recognition.lang = localeMap[currentLang] || 'hi-IN';

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      let currentInterim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          accumulatedTranscriptRef.current += event.results[i][0].transcript + ' ';
        } else {
          currentInterim += event.results[i][0].transcript;
        }
      }
      setTranscript(accumulatedTranscriptRef.current + currentInterim);
    };

    recognition.onerror = (event) => {
      console.warn("Mobile Speech Error:", event.error);
      if (event.error === 'not-allowed') {
        alert("Microphone access denied. Please allow permissions in your mobile browser settings.");
        isIntentionalStopRef.current = true;
        setIsRecording(false);
      }
      // Silently ignore 'no-speech' to allow the user to pause and think
    };

    recognition.onend = () => {
      // Mobile Safari strictly ends the recording when the user pauses.
      // We attempt a soft reboot only if the user didn't press stop.
      if (!isIntentionalStopRef.current) {
        setTimeout(() => {
          if (!isIntentionalStopRef.current && recognitionRef.current) {
            try { recognitionRef.current.start(); } catch (e) { /* Ignore rapid restart errors */ }
          }
        }, 150);
      } else {
        setIsRecording(false);
      }
    };

    recognitionRef.current = recognition;

    // 3. Start the recording synchronously
    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start mobile recognition:", e);
    }
  };

  return (
    <div className={`flex flex-col gap-3 mt-4 w-full ${className}`}>
      <button 
        type="button"
        onClick={toggleRecording}
        className={`px-6 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-sm ${
          isRecording 
            ? 'bg-red-50 text-red-600 border-2 border-red-500 animate-pulse' 
            : 'bg-stone-900 text-white hover:bg-stone-800'
        }`}
      >
        <span className="text-2xl">{isRecording ? '⏹️' : '🎙️'}</span>
        {isRecording ? 'Stop Recording' : t('capture.record_voice', 'Tap to Speak')}
      </button>
      
      {transcript && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-stone-800 min-h-[100px] text-lg leading-relaxed shadow-inner whitespace-pre-wrap">
          {transcript}
        </div>
      )}
    </div>
  );
}

export { MobileSafeVoiceRecorder as VoiceRecorder, MobileSafeVoiceRecorder as ResilientVoiceRecorder };
