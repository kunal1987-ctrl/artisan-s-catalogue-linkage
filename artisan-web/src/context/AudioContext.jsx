import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

const AudioContext = createContext({
  playAudio: () => {},
  stopAudio: () => {},
  isUnlocked: false,
});

export const AudioProvider = ({ children }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const audioRef = useRef(typeof Audio !== 'undefined' ? new Audio() : null);
  const queueRef = useRef(null);

  const playAudio = useCallback((fileName) => {
    if (!audioRef.current || !fileName) return;

    if (!isUnlocked) {
      // Queue the file silently if the user hasn't touched the screen yet
      queueRef.current = fileName;
      return;
    }

    try {
      audioRef.current.pause();
      const cleanFileName = fileName.endsWith('.mp3') ? fileName.replace('.mp3', '') : fileName;
      audioRef.current.src = `/audio/${cleanFileName}.mp3`;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((e) => console.warn('Playback failed or blocked:', e));
    } catch (err) {
      console.warn('Audio play exception:', err);
    }
  }, [isUnlocked]);

  const stopAudio = useCallback(() => {
    if (!audioRef.current) return;
    try {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;

    const unlockAudio = () => {
      if (isUnlocked) return;

      // Unlock the audio element instantly on the first interaction
      audioRef.current
        .play()
        .then(() => {
          audioRef.current.pause();
          setIsUnlocked(true);

          // Play the track that was queued when the page originally loaded
          if (queueRef.current) {
            const queued = queueRef.current;
            queueRef.current = null;
            const cleanFileName = queued.endsWith('.mp3') ? queued.replace('.mp3', '') : queued;
            audioRef.current.src = `/audio/${cleanFileName}.mp3`;
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch((err) => console.warn('Queued playback failed:', err));
          }
        })
        .catch((err) => console.warn('Audio unlock pending interaction:', err));

      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };

    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, [isUnlocked]);

  return (
    <AudioContext.Provider value={{ playAudio, stopAudio, isUnlocked }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => useContext(AudioContext);
