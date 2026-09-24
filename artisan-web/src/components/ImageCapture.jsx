import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function ImageCapture({ onTakePhoto, onRecordVoice, className = '' }) {
  const { t } = useLanguage();

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <button 
        type="button"
        onClick={onTakePhoto}
        className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-sm active:scale-95 flex items-center gap-2"
      >
        <span>📸</span>
        <span>{t('take_photo')}</span>
      </button>
      <button 
        type="button"
        onClick={onRecordVoice}
        className="bg-stone-800 hover:bg-stone-900 text-white font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-sm active:scale-95 flex items-center gap-2"
      >
        <span>🎙️</span>
        <span>{t('record_voice')}</span>
      </button>
    </div>
  );
}

export const CaptureScreen = ImageCapture;
export { default as VoiceRecorder } from './VoiceRecorder';
