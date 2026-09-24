import React, { useState, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function VoiceRecorder({ onTranscriptionComplete, className = '' }) {
  const { currentLang, t } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  const startRecording = () => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please type your description.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    // CRITICAL: Map our standard language codes to exact Speech API BCP-47 locales
    // Fallback to hi-IN if a minority language isn't natively supported for dictation
    const localeMap = {
      hi: 'hi-IN',
      bn: 'bn-IN',
      te: 'te-IN',
      mr: 'mr-IN',
      ta: 'ta-IN',
      gu: 'gu-IN',
      kn: 'kn-IN',
      ur: 'ur-IN',
      pa: 'pa-IN',
      or: 'or-IN',
      en: 'en-IN',
      sa: 'sa-IN',
      kok: 'kok-IN',
    };
    
    recognition.lang = localeMap[currentLang] || 'hi-IN'; // Listen in the user's selected language
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setTranscript((prev) => (prev ? prev + ' ' + finalTranscript : finalTranscript));
        if (onTranscriptionComplete) onTranscriptionComplete(finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    try {
      recognition.start();
    } catch (err) {
      console.warn("Recognition start warning:", err);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn("Recognition stop warning:", err);
      }
      recognitionRef.current = null;
    }
  };

  return (
    <div className={`flex flex-col gap-2 mt-4 ${className}`}>
      <button 
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
        className={`px-4 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer select-none ${
          isRecording 
            ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse' 
            : 'bg-stone-800 text-white hover:bg-stone-700'
        }`}
        aria-label={isRecording ? 'Stop Recording' : t('record_voice', 'Record Voice')}
      >
        {isRecording ? '⏹️ Recording...' : `🎙️ ${t('record_voice', 'Record Voice')}`}
      </button>
      
      {transcript && (
        <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 text-sm mt-2">
          {transcript}
        </div>
      )}
    </div>
  );
}
