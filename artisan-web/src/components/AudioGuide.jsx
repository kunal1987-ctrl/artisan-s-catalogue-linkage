import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { unlockMobileAudio } from '../utils/soundPlayer';

export default function AudioGuide({ autoPrompt = true }) {
  const { currentLang, t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(() => {
    if (!autoPrompt) return true;
    try {
      return sessionStorage.getItem('shilp_setu_audio_started') === 'true';
    } catch {
      return false;
    }
  });
  const audioRef = useRef(null);

  // Stop audio if the component unmounts or language changes
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [currentLang]);

  const playNavigationInstruction = () => {
    unlockMobileAudio();
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // Fallback to Hindi if a specific minority language audio file is missing
    const audioPath = `/audio/navigation/nav_${currentLang}.mp3`;
    const audio = new Audio(audioPath);
    audioRef.current = audio;

    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => {
      console.warn(`Navigation audio missing for ${currentLang}, falling back to Hindi.`);
      const fallbackAudio = new Audio('/audio/navigation/nav_hi.mp3');
      audioRef.current = fallbackAudio;
      fallbackAudio.onended = () => setIsPlaying(false);
      fallbackAudio.play().catch((e) => console.error("Audio blocked:", e));
    };

    setIsPlaying(true);
    setHasStarted(true);
    try {
      sessionStorage.setItem('shilp_setu_audio_started', 'true');
    } catch {}

    // Play strictly attached to this click event (satisfying mobile autoplay policy)
    audio.play().catch((error) => {
      console.error("Autoplay policy blocked audio:", error);
      setIsPlaying(false);
    });
  };

  // UI State 1: The Initial "Tap to Start" Overlay (Bypasses Autoplay bans)
  if (!hasStarted) {
    return (
      <div className="fixed inset-0 bg-stone-900/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
        <button 
          type="button"
          onClick={playNavigationInstruction}
          className="bg-amber-500 hover:bg-amber-400 text-stone-900 text-xl font-bold py-6 px-10 rounded-2xl shadow-2xl flex flex-col items-center gap-4 transition-transform active:scale-95 cursor-pointer border border-amber-300 ring-4 ring-amber-500/20"
        >
          <span className="text-4xl animate-bounce">🎙️</span>
          <span>{t('start_app') || 'ऐप शुरू करें (Tap to Start)'}</span>
        </button>
      </div>
    );
  }

  // UI State 2: A floating help button if they need to hear the instructions again
  return (
    <button
      type="button"
      onClick={playNavigationInstruction}
      className={`fixed bottom-6 right-6 p-4 rounded-full shadow-lg z-40 transition-all cursor-pointer border border-white/10 ${
        isPlaying ? 'bg-amber-100 text-amber-700 animate-pulse ring-4 ring-amber-400/40' : 'bg-stone-800 text-amber-400 hover:bg-stone-700 active:scale-95'
      }`}
      aria-label="Play Navigation Instructions"
      title="Play Navigation Instructions"
    >
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        {isPlaying ? (
          <path d="M12 2v20c5.523 0 10-4.477 10-10S17.523 2 12 2zm-2 13h-2v-6h2v6zm4 0h-2v-6h2v6z"/>
        ) : (
          <path d="M14 3.227v17.546a1 1 0 01-1.465.885l-5.145-2.732H4a2 2 0 01-2-2V7.074a2 2 0 012-2h3.39L12.535 2.34A1 1 0 0114 3.227zm2 1.956c2.404.912 4 3.266 4 5.817s-1.596 4.905-4 5.817v-2.158c1.332-.716 2.143-2.13 2.143-3.659 0-1.528-.81-2.942-2.143-3.658V5.183z"/>
        )}
      </svg>
    </button>
  );
}
