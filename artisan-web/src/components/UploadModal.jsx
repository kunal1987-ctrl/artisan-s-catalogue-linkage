import React, { useState, useRef } from 'react';
import { Camera, X, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { validateImageLightweight, getLocalizedValidationReason } from '../utils/imageValidator';

export default function UploadModal({ isOpen, onClose, onPhotoAccepted, language = 'en' }) {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [validationSuccess, setValidationSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePhotoCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setIsValidating(true);
    setValidationError(null);
    setValidationSuccess(false);

    // 1. Run Lightweight Micro-Canvas Validation (<5ms)
    const result = await validateImageLightweight(file);
    setIsValidating(false);

    if (!result.valid) {
      const localizedMsg = getLocalizedValidationReason(result.reason, language);
      setValidationError(localizedMsg || result.reason);
      setSelectedFile(null);
      setPreviewUrl(null);
      alert(`⚠️ ${localizedMsg || result.reason}`);
      return;
    }

    // 2. Photo passed validation
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setValidationSuccess(true);

    if (onPhotoAccepted) {
      onPhotoAccepted(file);
    }
  };

  const handleTriggerCamera = () => {
    setValidationError(null);
    fileInputRef.current?.click();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center md:items-center bg-black/60 backdrop-blur-xs p-0 md:p-4 animate-in fade-in"
    >
      <div className="relative w-full md:max-w-md bg-white rounded-t-2xl md:rounded-2xl shadow-2xl border border-stone-200 p-6 pb-8 md:pb-6 max-h-[90vh] overflow-y-auto transform transition-transform flex flex-col gap-4 text-stone-900">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-700" />
            <h3 className="font-bold text-lg">
              {language === 'hi' ? 'हस्तशिल्प फोटो कैप्चर' : 'Capture Craft Photo'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Enforce Rear Camera Capture */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          onChange={handlePhotoCapture}
          className="hidden"
        />

        {previewUrl ? (
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-full h-56 rounded-xl overflow-hidden bg-stone-100 border">
              <img src={previewUrl} alt="Captured Craft" className="w-full h-full object-cover" />
              {validationSuccess && (
                <div className="absolute top-2 right-2 bg-emerald-600 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'सत्यापित' : 'Passed Quality Gate'}</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleTriggerCamera}
              className="py-2 px-4 rounded-xl border border-stone-300 hover:bg-stone-50 text-sm font-semibold flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{language === 'hi' ? 'दोबारा फोटो लें' : 'Retake Photo'}</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-stone-300 rounded-xl bg-stone-50 gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
              <Camera className="w-8 h-8" />
            </div>
            <div>
              <p className="font-bold text-sm text-stone-800">
                {language === 'hi' ? 'सीधे कैमरे से फोटो लें' : 'Take Photo with Rear Camera'}
              </p>
              <p className="text-xs text-stone-500 mt-0.5">
                {language === 'hi'
                  ? 'स्क्रीन या धुंधली फोटो स्वीकार नहीं की जाएगी'
                  : 'Screens and blurry photos will be automatically rejected'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleTriggerCamera}
              disabled={isValidating}
              className="mt-2 py-2.5 px-6 rounded-full bg-amber-700 hover:bg-amber-800 text-white font-bold text-sm shadow transition"
            >
              {isValidating
                ? (language === 'hi' ? 'जाँच की जा रही है...' : 'Validating...')
                : (language === 'hi' ? 'कैमरा खोलें' : 'Open Camera')}
            </button>
          </div>
        )}

        {validationError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{validationError}</span>
          </div>
        )}
      </div>
    </div>
  );
}
