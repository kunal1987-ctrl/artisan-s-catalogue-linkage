import React, { useState, useEffect } from 'react';
import * as fal from "@fal-ai/serverless-client";
import { useTranslation } from 'react-i18next';
import { useAudio } from '../context/AudioContext';

// Configure Fal.ai client
const falApiKey = typeof import.meta !== 'undefined' && (import.meta.env?.VITE_FAL_API_KEY || import.meta.env?.FAL_API_KEY);
if (falApiKey) {
  fal.config({ 
    credentials: falApiKey,
    suppressLocalCredentialsWarning: true,
  });
} else {
  fal.config({ proxyUrl: "/api/fal/proxy" });
}

export default function ProductStudio({ onImageProcessed, onCapture }) {
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalImage, setFinalImage] = useState(null);
  const { playAudio } = useAudio();

  useEffect(() => {
    if (!finalImage) {
      playAudio('camera_instruction');
    }
  }, [finalImage, playAudio]);

  // This function runs IMMEDIATELY after the camera snaps or file is selected
  const handleImageCapture = async (rawImageBase64) => {
    setIsProcessing(true);
    
    try {
      // Trigger Fal.ai automatically without any manual secondary click
      const dataUrl = rawImageBase64.startsWith('data:') 
        ? rawImageBase64 
        : `data:image/jpeg;base64,${rawImageBase64}`;

      // 1. Use the active Bria model for lifestyle enhancement & background replacement
      const result = await fal.subscribe("fal-ai/bria/background/replace", {
        input: {
          image_url: dataUrl,
          prompt: "Pro studio photography, high-end commercial product shot, elegant neutral background, soft diffused studio lighting, sharp focus",
        },
        logs: true,
      }).catch(async (primaryErr) => {
        console.warn("[ProductStudio] Bria background replace fallback to image-to-image:", primaryErr);
        return await fal.subscribe("fal-ai/image-to-image", {
          input: {
            image_url: dataUrl,
            prompt: "Pro studio photography, high-end commercial product shot, elegant neutral background, soft diffused studio lighting, sharp focus",
            strength: 0.85, 
          },
          logs: true,
        });
      });

      const cleanImageUrl =
        result?.image?.url ||
        result?.data?.image?.url ||
        result?.data?.image_url ||
        result?.data?.url ||
        (typeof result?.image === 'string' ? result.image : null);

      if (!cleanImageUrl) {
        throw new Error("No image URL returned from Fal.ai");
      }

      setFinalImage(cleanImageUrl);
      
      // Pass the clean image up to the parent form/state
      if (onImageProcessed) onImageProcessed(cleanImageUrl);
      if (onCapture) onCapture(cleanImageUrl);
      
    } catch (error) {
      console.error("Fal.ai processing failed:", error);
      alert(t('error.processing', "Image processing failed. Please try again."));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result;
      handleImageCapture(b64);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="studio-container relative w-full rounded-2xl overflow-hidden bg-stone-900 border border-stone-800 shadow-md">
      {/* 1. If processing, show a blocking loading state */}
      {isProcessing && (
        <div className="absolute inset-0 bg-stone-900/85 backdrop-blur-xs z-50 flex flex-col items-center justify-center text-white p-6 text-center">
          <div className="w-14 h-14 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-bold text-lg text-amber-300 animate-pulse">
            {t('studio.enhancing', "AI is creating a lifestyle background...")}
          </p>
          <span className="text-xs text-stone-400 mt-2">Zero watermarks • Automated Fal.ai Studio Lighting</span>
        </div>
      )}

      {/* 2. Show the final processed image (No Photoroom Watermarks) */}
      {finalImage ? (
        <div className="relative rounded-2xl overflow-hidden shadow-lg group">
          <img src={finalImage} alt="Processed Product" className="w-full h-auto max-h-[480px] object-contain bg-stone-950" />
          <div className="absolute bottom-4 left-4 bg-emerald-900/90 text-emerald-100 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 border border-emerald-500/30 shadow-md">
            <span>✨</span> {t('studio.enhanced_by', "Image enhanced by Fal.ai")}
          </div>
          <button 
            type="button"
            onClick={() => setFinalImage(null)}
            className="absolute top-4 right-4 bg-stone-900/80 hover:bg-stone-900 text-white text-xs px-3 py-1.5 rounded-full transition cursor-pointer"
          >
            Retake
          </button>
        </div>
      ) : (
        <div className="p-8 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center text-3xl">
            📸
          </div>
          <div>
            <h4 className="text-white font-bold text-base">Instant AI Lifestyle Enhancement</h4>
            <p className="text-stone-400 text-xs mt-1">Upload or snap a craft photo; Fal.ai will auto-enhance it immediately.</p>
          </div>
          <label className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-sm shadow cursor-pointer transition flex items-center gap-2">
            <span>📷</span>
            <span>Choose / Snap Photo</span>
            <input type="file" accept="image/*" capture="environment" onChange={handleFileInput} className="hidden" />
          </label>
        </div>
      )}
    </div>
  );
}
