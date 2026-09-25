import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export default function GroqVoiceRecorder({ onTranscriptionComplete, className = '' }) {
  const { t, i18n } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      // 1. Universally supported on all mobile browsers (requests mic permission)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Stop all microphone tracks to turn off the red recording light on the phone
        stream.getTracks().forEach(track => track.stop());

        // 2. Send the recorded blob to Groq for transcription
        await transcribeWithGroq(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Microphone access denied or unsupported:", error);
      alert("Please allow microphone permissions to record your description.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeWithGroq = async (audioBlob) => {
    try {
      const groqKey = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.GROQ_API_KEY;
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.webm");
      formData.append("model", "whisper-large-v3");
      
      // Pass the current selected language to help Groq's accuracy
      const langCode = i18n.language === 'hi' ? 'hi' : (['bn', 'te', 'mr', 'ta'].includes(i18n.language) ? i18n.language : 'en'); 
      formData.append("language", langCode);

      // Send to Groq Whisper API
      const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey}`
        },
        body: formData
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Groq Whisper API response error:", response.status, errText);
        throw new Error(`Groq Whisper returned ${response.status}`);
      }

      const data = await response.json();
      if (data.text && onTranscriptionComplete) {
        onTranscriptionComplete(data.text);
      }
    } catch (error) {
      console.error("Groq Transcription Failed:", error);
      alert("Failed to transcribe audio. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`flex flex-col gap-3 mt-4 w-full ${className}`}>
      <button 
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`px-6 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-sm ${
          isRecording 
            ? 'bg-red-50 text-red-600 border-2 border-red-500 animate-pulse' 
            : 'bg-stone-900 text-white hover:bg-stone-800'
        } disabled:opacity-50 cursor-pointer`}
      >
        <span className="text-2xl">{isRecording ? '⏹️' : '🎙️'}</span>
        {isRecording 
          ? 'Stop Recording' 
          : isProcessing 
            ? 'Transcribing...' 
            : t('capture.record_voice', 'Record Description')}
      </button>
    </div>
  );
}

export { GroqVoiceRecorder as VoiceRecorder, GroqVoiceRecorder as ResilientVoiceRecorder, GroqVoiceRecorder as MobileSafeVoiceRecorder };
