import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export default function ResilientVoiceRecorder({ onTranscriptionComplete, className = '' }) {
  const { t, i18n } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  // Refs for tracking state without triggering re-renders inside event handlers
  const recognitionRef = useRef(null);
  const isIntentionalStopRef = useRef(true);
  const accumulatedTranscriptRef = useRef('');

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    
    // Inside the useEffect before recognition.start()
    const currentLang = i18n.language || 'hi';
    
    // Map strictly to major supported dialects to prevent dictionary failures
    const localeMap = {
      hi: 'hi-IN', bn: 'bn-IN', te: 'te-IN', mr: 'mr-IN', 
      ta: 'ta-IN', en: 'en-IN'
    };
    
    // If the browser struggles with the regional language, it's better to capture 
    // phonetically in Hindi/English than to capture nothing at all.
    recognition.lang = localeMap[currentLang] || 'hi-IN';

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      let currentInterim = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          // ONLY append to the permanent reference when the browser confirms it is a final word
          accumulatedTranscriptRef.current += event.results[i][0].transcript + ' ';
        } else {
          // Keep interim text completely separate, used ONLY for live visual feedback
          currentInterim += event.results[i][0].transcript;
        }
      }

      // Update the UI: Show the locked-in history + whatever the user is currently saying
      setTranscript(accumulatedTranscriptRef.current + currentInterim);
    };

    recognition.onerror = (event) => {
      console.warn("Speech API Event:", event.error);
      
      // 1. Hard fail only if permissions are missing or hardware is broken
      if (event.error === 'not-allowed' || event.error === 'audio-capture') {
        alert("Microphone blocked! Please allow permissions in your browser address bar.");
        isIntentionalStopRef.current = true;
        setIsRecording(false);
        return;
      }
      
      // 2. THE CORE FIX: Completely ignore 'no-speech' (voice not detected). 
      // Do NOT update the UI. Do NOT set isRecording to false. 
      // Let it fail silently, and the onend() function will instantly restart it.
    };

    recognition.onend = () => {
      // If the browser stopped due to silence or a non-fatal error, 
      // instantly reboot the microphone in the background.
      if (!isIntentionalStopRef.current) {
        try {
          // Small timeout prevents Chrome from throwing a rapid-fire restart exception
          setTimeout(() => {
            if (!isIntentionalStopRef.current) recognition.start();
          }, 50);
        } catch (e) {
          console.error("Auto-reboot failed", e);
        }
      } else {
        // User explicitly clicked the Stop button
        setIsRecording(false);
        if (onTranscriptionComplete) {
          onTranscriptionComplete(accumulatedTranscriptRef.current.trim());
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      isIntentionalStopRef.current = true;
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [i18n.language, onTranscriptionComplete]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    if (isRecording) {
      // Manual Stop
      isIntentionalStopRef.current = true;
      recognitionRef.current.stop();
    } else {
      // Manual Start
      isIntentionalStopRef.current = false;
      accumulatedTranscriptRef.current = ''; // Clear previous if starting fresh
      setTranscript('');
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn("Recognition already started");
      }
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
        {isRecording ? 'Stop Recording' : t('capture.record_voice', 'Record Description')}
      </button>
      
      {transcript && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-stone-800 min-h-[100px] text-lg leading-relaxed shadow-inner whitespace-pre-wrap">
          {transcript}
        </div>
      )}
    </div>
  );
}

export { ResilientVoiceRecorder as VoiceRecorder };
