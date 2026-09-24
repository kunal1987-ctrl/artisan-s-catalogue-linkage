import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function AudioGuide() {
  const { i18n } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // Stop audio if language changes
  useEffect(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [i18n.language]);

  const playNavigationInstruction = () => {
    const currentLang = i18n.language || 'hi';
    const audioEl = audioRef.current;
    if (!audioEl) return;

    const exactAudioPath = `/audio/navigation/nav_${currentLang}.mp3`;
    audioEl.src = exactAudioPath;
    
    const playPromise = audioEl.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch(error => {
          console.error("Audio playback failed:", error);
          setIsPlaying(false);
          // Fallback to Hindi if file is missing
          if (error.name === 'NotSupportedError') {
            audioEl.src = '/audio/navigation/nav_hi.mp3';
            audioEl.play().catch(e => console.error("Fallback failed:", e));
          }
        });
    }
  };

  return (
    <>
      <audio 
        ref={audioRef} 
        onEnded={() => setIsPlaying(false)}
        className="hidden"
        preload="auto"
      />

      {/* Only render the unobtrusive floating help button */}
      <button
        onClick={playNavigationInstruction}
        className={`fixed bottom-24 right-6 p-4 rounded-full shadow-lg z-40 transition-all ${
          isPlaying ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-stone-800 text-amber-400 hover:bg-stone-700'
        }`}
        aria-label="Play Instructions"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          {isPlaying ? (
            <path d="M12 2v20c5.523 0 10-4.477 10-10S17.523 2 12 2zm-2 13h-2v-6h2v6zm4 0h-2v-6h2v6z"/>
          ) : (
            <path d="M14 3.227v17.546a1 1 0 01-1.465.885l-5.145-2.732H4a2 2 0 01-2-2V7.074a2 2 0 012-2h3.39L12.535 2.34A1 1 0 0114 3.227zm2 1.956c2.404.912 4 3.266 4 5.817s-1.596 4.905-4 5.817v-2.158c1.332-.716 2.143-2.13 2.143-3.659 0-1.528-.81-2.942-2.143-3.658V5.183z"/>
          )}
        </svg>
      </button>
    </>
  );
}
