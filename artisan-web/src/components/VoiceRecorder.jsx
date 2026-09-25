import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function GroqVoiceRecorder({ onTranscriptionComplete, className = '' }) {
  const { t, i18n } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const mimeTypeRef = useRef('');

  // Stop recording if component unmounts
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // THE FIX: Dynamically detect supported audio format for iOS vs Android
      let options = {};
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
        mimeTypeRef.current = 'audio/webm';
      } else if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4' };
        mimeTypeRef.current = 'audio/mp4';
      } else {
        mimeTypeRef.current = ''; // Let browser choose default
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        
        // Create blob with the exact format the phone actually recorded
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mimeTypeRef.current || 'audio/mp4' 
        });
        
        // Kill the mic tracks to remove the red recording dot on mobile
        stream.getTracks().forEach(track => track.stop());

        await transcribeWithGroq(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Microphone access error:", error);
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
      let transcribedText = '';

      // 1. Try Supabase Edge Function 'transcribe-audio' (server-side GROQ_API_KEY)
      try {
        const formData = new FormData();
        const fileExtension = mimeTypeRef.current.includes('webm') ? 'webm' : 'm4a';
        formData.append("file", audioBlob, `audio.${fileExtension}`);
        formData.append("language", i18n.language === 'hi' ? 'hi' : 'en');

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jrkrdlalnqswvwabktce.supabase.co';
        const edgeRes = await fetch(`${supabaseUrl}/functions/v1/transcribe-audio`, {
          method: 'POST',
          body: formData,
        });

        if (edgeRes.ok) {
          const edgeData = await edgeRes.json();
          if (edgeData?.text && typeof edgeData.text === 'string' && edgeData.text.trim()) {
            transcribedText = edgeData.text.trim();
          }
        }
      } catch (edgeErr) {
        console.warn('Edge transcribe-audio error:', edgeErr);
      }

      // 2. Direct Groq fallback if client key exists
      if (!transcribedText) {
        const groqKey = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.GROQ_API_KEY;
        if (groqKey) {
          try {
            const formData = new FormData();
            const fileExtension = mimeTypeRef.current.includes('webm') ? 'webm' : 'm4a';
            formData.append("file", audioBlob, `audio.${fileExtension}`);
            formData.append("model", "whisper-large-v3");
            formData.append("language", i18n.language === 'hi' ? 'hi' : 'en');

            const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
              method: "POST",
              headers: { "Authorization": `Bearer ${groqKey}` },
              body: formData
            });

            if (response.ok) {
              const data = await response.json();
              if (data.text) {
                transcribedText = data.text.trim();
              }
            }
          } catch (groqErr) {
            console.warn('Direct Groq error:', groqErr);
          }
        }
      }

      if (transcribedText && onTranscriptionComplete) {
        onTranscriptionComplete(transcribedText);
      }
    } catch (error) {
      console.error("Transcription Failed:", error);
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
            ? 'Transcribing with AI...' 
            : t('capture.record_voice', 'Record Description')}
      </button>
    </div>
  );
}

export { GroqVoiceRecorder as VoiceRecorder, GroqVoiceRecorder as ResilientVoiceRecorder, GroqVoiceRecorder as MobileSafeVoiceRecorder, GroqVoiceRecorder as VoiceDescriptionInput };
