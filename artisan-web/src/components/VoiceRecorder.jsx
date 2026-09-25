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
    
    // Map i18n language to BCP-47 Speech API locale
    const currentLang = i18n.language || 'hi';
    const localeMap = {
      hi: 'hi-IN', bn: 'bn-IN', te: 'te-IN', mr: 'mr-IN', 
      ta: 'ta-IN', en: 'en-IN'
    };
    recognition.lang = localeMap[currentLang] || 'hi-IN';

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        accumulatedTranscriptRef.current += finalTranscript;
      }
      
      // Update UI with both final (locked) text and current interim (guessing) text
      setTranscript(accumulatedTranscriptRef.current + interimTranscript);
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);
      // Ignore 'no-speech' errors as they happen naturally when the user pauses
      if (event.error === 'not-allowed') {
        isIntentionalStopRef.current = true;
        setIsRecording(false);
      }
    };

    recognition.onend = () => {
      // THE FIX: If the browser stopped listening automatically, but the user didn't click stop, RESTART IT.
      if (!isIntentionalStopRef.current) {
        try {
          recognition.start();
        } catch (e) {
          console.error("Failed to auto-restart recognition", e);
        }
      } else {
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
