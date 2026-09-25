import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function VoiceDescriptionInput({ onTranscript }) {
  const { t, i18n } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const mimeTypeRef = useRef('');

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const toggleRecording = async () => {
    if (isRecording) {
      // STOP RECORDING
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    // START RECORDING
    try {
      setTranscript(''); // Clear old text
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Dynamically detect supported audio format for iOS vs Android
      let options = {};
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
        mimeTypeRef.current = 'audio/webm';
      } else if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4' };
        mimeTypeRef.current = 'audio/mp4';
      } else {
        mimeTypeRef.current = '';
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        stream.getTracks().forEach(track => track.stop()); // Turn off mic light
        
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mimeTypeRef.current || 'audio/mp4' 
        });
        await processWithGroq(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Mic access denied:", error);
      alert("Please allow microphone access to describe your product.");
    }
  };

  const processWithGroq = async (audioBlob) => {
    try {
      const formData = new FormData();
      const fileExtension = (mimeTypeRef.current && mimeTypeRef.current.includes('webm')) ? 'webm' : 'm4a';
      formData.append("file", audioBlob, `audio.${fileExtension}`);
      formData.append("model", "whisper-large-v3");
      // Use clean ISO codes for Groq, not Web Speech locales
      formData.append("language", i18n.language === 'hi' ? 'hi' : 'en'); 

      const groqKey = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.GROQ_API_KEY;

      const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${groqKey}` },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      if (data.text) {
        setTranscript(data.text);
        if (onTranscript) onTranscript(data.text);
      }
    } catch (error) {
      console.error("Groq error:", error);
      alert("Failed to process audio. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full gap-4 mt-6">
      {/* Text Area UI */}
      <div className="w-full bg-stone-700/50 rounded-2xl p-4 border border-stone-600 min-h-[120px]">
        {isProcessing ? (
          <p className="text-amber-400 animate-pulse">AI is transcribing...</p>
        ) : transcript ? (
          <p className="text-stone-100">{transcript}</p>
        ) : (
          <p className="text-stone-400 italic">
            {t('capture.placeholder', `Product description in ${i18n.language === 'hi' ? 'Hindi' : 'English'} will appear here...`)}
          </p>
        )}
      </div>

      {/* The Clean Mic Button - No more legacy error boxes */}
      <button 
        type="button"
        onClick={toggleRecording}
        disabled={isProcessing}
        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
          isRecording 
            ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse' 
            : 'bg-[#FFF9E6] hover:scale-105'
        }`}
      >
        <span className="text-3xl" style={{ color: isRecording ? '#fff' : '#d97706' }}>
          {isRecording ? '⏹️' : '🎤'}
        </span>
      </button>
    </div>
  );
}

export { VoiceDescriptionInput };
