import React from 'react';
import { useTranslation } from 'react-i18next';

export default function ImageCapture({ onTakePhoto, onRecordVoice, className = '' }) {
  const { t } = useTranslation();

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <button 
        type="button"
        onClick={onTakePhoto}
        className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-sm active:scale-95 flex items-center gap-2"
      >
        <span>📸</span>
        <span>{t('capture.take_photo', t('take_photo', 'Take Product Photo'))}</span>
      </button>
      <button 
        type="button"
        onClick={onRecordVoice}
        className="bg-stone-800 hover:bg-stone-900 text-white font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-sm active:scale-95 flex items-center gap-2"
      >
        <span>🎙️</span>
        <span>{t('capture.record_voice', t('record_voice', 'Record Voice Description'))}</span>
      </button>
    </div>
  );
}

export const CaptureScreen = ImageCapture;
export { default as VoiceRecorder } from './VoiceRecorder';
