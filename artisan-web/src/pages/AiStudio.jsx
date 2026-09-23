import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { validateImageLightweight, getLocalizedValidationReason } from '../utils/imageValidator';
import { addGeoWatermark } from '../utils/geoWatermark';
import exifr from 'exifr';

const MAX_IMAGES = 3;

const verifyImageMetadata = async (file) => {
  try {
    // Extract basic EXIF data and software tags
    const data = await exifr.parse(file, ['Software', 'Make', 'Model']);
    
    if (data?.Software) {
      const software = data.Software.toLowerCase();
      if (software.includes('photoshop') || software.includes('canva') || software.includes('lightroom')) {
        alert("Digital manipulation detected. Please capture a real, unedited photo.");
        return false;
      }
    }
    return true; // Clean file
  } catch (error) {
    // If EXIF is stripped entirely, it might be a WhatsApp/Web download
    console.warn("No EXIF data found - proceed with AI visual check.", error);
    return true; 
  }
};

export default function AiStudio() {
  const navigate = useNavigate();
  const { user, artisanProfile } = useAuth?.() || {};

  // ── State Management ──
  const [capturedImages, setCapturedImages] = useState([]);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isWatermarking, setIsWatermarking] = useState(false);
  const fileInputRef = useRef(null);

  // Clean up object URLs on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      capturedImages.forEach((img) => {
        if (img?.previewUrl && img.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(img.previewUrl);
        }
      });
    };
  }, [capturedImages]);

  // Convert File/Blob to Base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        const base64 = typeof result === 'string' ? result.split(',')[1] : '';
        resolve(base64);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // ── Capture Handler ──
  const handleCapture = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (capturedImages.length < MAX_IMAGES) {
      setIsWatermarking(true);
      try {
        // Fast lightweight validation
        const validation = await validateImageLightweight(file);
        if (!validation.valid) {
          alert(`⚠️ ${validation.reason}`);
          return;
        }

        // EXIF Metadata Fraud Detection (Photoshop / Canva / Lightroom check)
        const isClean = await verifyImageMetadata(file);
        if (!isClean) {
          return;
        }

        // Apply native Geo-Stamping & Live Watermark (GPS, timestamp & artisan ID)
        const artisanId = artisanProfile?.id || user?.id?.substring(0, 8) || "A-1029";
        const watermarkedFile = await addGeoWatermark(file, artisanId);

        const newImageObj = {
          id: Date.now(),
          file: watermarkedFile,
          previewUrl: URL.createObjectURL(watermarkedFile),
          status: 'pending' // pending, enhancing, ready
        };

        setCapturedImages((prev) => {
          if (prev.length >= MAX_IMAGES) return prev;
          const next = [...prev, newImageObj];
          // Once limit is reached (3 images), automatically send all images to AI enhancement
          if (next.length === MAX_IMAGES) {
            setTimeout(() => {
              handleBatchEnhance(next);
            }, 300);
          }
          return next;
        });
      } catch (err) {
        console.error('[AiStudio] Capture watermarking error:', err);
      } finally {
        setIsWatermarking(false);
      }
    }
  };

  // ── Remove Image Handler ──
  const removeImage = (idToRemove) => {
    setCapturedImages((prev) => {
      const target = prev.find((img) => img.id === idToRemove);
      if (target?.previewUrl && target.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((img) => img.id !== idToRemove);
    });
  };

  // ── AI Batch Enhancement Pipeline ──
  const handleBatchEnhance = useCallback(async (imagesToEnhance = capturedImages) => {
    if (imagesToEnhance.length === 0 || isEnhancing) return;

    setIsEnhancing(true);

    // Mark pending images as enhancing
    setCapturedImages((prev) =>
      prev.map((img) => (img.status === 'pending' ? { ...img, status: 'enhancing' } : img))
    );

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    let token = '';
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      token = sessionData?.session?.access_token || '';
      if (!token) {
        const { data: anonData } = await supabase.auth.signInAnonymously();
        token = anonData?.session?.access_token || '';
      }
    } catch (e) {
      console.warn('[AiStudio] Auth session warning:', e);
    }

    const authHeader = token ? `Bearer ${token}` : `Bearer ${supabaseKey}`;
    const updatedImages = [...imagesToEnhance];

    for (let i = 0; i < updatedImages.length; i++) {
      const item = updatedImages[i];
      if (item.status === 'ready' && item.enhancedUrl) continue;

      try {
        const base64String = await fileToBase64(item.file);
        const response = await fetch(`${supabaseUrl}/functions/v1/generate-lifestyle-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader,
          },
          body: JSON.stringify({ imageBase64: base64String }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data && (data.is_authentic_photo === false || data.is_valid === false)) {
            const reason = data.rejection_reason || 'Photo failed authenticity verification (pure white background, stock photo or watermark detected).';
            alert(`Authenticity Check Failed / सत्यापन अस्वीकृत:\n${reason}`);
            removeImage(item.id);
            continue;
          }
          if (data?.imageUrl) {
            updatedImages[i] = {
              ...item,
              status: 'ready',
              enhancedUrl: data.imageUrl,
              base64: base64String,
            };
            setCapturedImages([...updatedImages]);
            continue;
          }
        }
        throw new Error('Edge function fallback');
      } catch (err) {
        console.warn(`[AiStudio] Fallback on angle #${i + 1}:`, err);
        let rawBase64 = '';
        try {
          rawBase64 = await fileToBase64(item.file);
        } catch {
          // ignore
        }
        updatedImages[i] = {
          ...item,
          status: 'ready',
          enhancedUrl: item.previewUrl,
          base64: rawBase64,
        };
        setCapturedImages([...updatedImages]);
      }
    }

    setIsEnhancing(false);
  }, [capturedImages, isEnhancing]);

  // Proceed to catalog listing / review
  const handleProceedToReview = () => {
    if (capturedImages.length === 0) return;
    const primary = capturedImages[0];
    const allB64 = capturedImages.map((img) => img.base64).filter(Boolean);

    navigate('/review', {
      state: {
        imageUrl: primary.enhancedUrl || primary.previewUrl,
        images: allB64,
        imagesBase64: allB64,
        capturedCount: capturedImages.length,
      },
    });
  };

  const handleEnhanceClick = async () => {
    if (isEnhancing || capturedImages.length === 0) return;
    const allReady = capturedImages.every((img) => img.status === 'ready');
    if (allReady) {
      handleProceedToReview();
    } else {
      await handleBatchEnhance(capturedImages);
    }
  };

  return (
    <div className="min-h-screen bg-[#120c09] p-2 sm:p-6 flex items-center justify-center">
      <div className="w-full max-w-lg min-h-[580px] flex flex-col h-full bg-[#1a1614] text-amber-50 rounded-2xl overflow-hidden p-4 shadow-2xl border border-white/5">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            <span className="font-bold tracking-wide uppercase text-stone-200">AI Studio Multi-Angle Camera</span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              GPS Geo-Stamp
            </span>
          </div>
          <span className="text-orange-400 font-semibold">
            {capturedImages.length}/{MAX_IMAGES} Angles
          </span>
        </div>

        {/* Main Viewfinder / Placeholder */}
        <div className="relative flex-1 bg-black rounded-xl flex items-center justify-center border border-white/10 mb-4 overflow-hidden min-h-[300px]">
          {/* Frame markers */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-orange-500 z-10"></div>
          <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-orange-500 z-10"></div>
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-orange-500 z-10"></div>
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-orange-500 z-10"></div>

          {capturedImages.length > 0 && (
            <img 
              src={capturedImages[capturedImages.length - 1].enhancedUrl || capturedImages[capturedImages.length - 1].previewUrl} 
              alt="Active preview"
              className="absolute inset-0 w-full h-full object-contain"
            />
          )}

          {isWatermarking ? (
            <p className="text-orange-300 text-xs sm:text-sm z-10 bg-black/80 px-4 py-2 rounded-full backdrop-blur-xs flex items-center gap-2 border border-orange-500/30 animate-pulse">
              <svg className="animate-spin h-3.5 w-3.5 text-orange-400" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <span>GPS वॉटरमार्क जोड़ रहे हैं (Geo-stamping)...</span>
            </p>
          ) : (
            <p className="text-stone-500 text-sm z-10 bg-black/70 px-3 py-1.5 rounded-full backdrop-blur-xs">
              {capturedImages.length < MAX_IMAGES 
                ? `Capture angle ${capturedImages.length + 1} of ${MAX_IMAGES}` 
                : "Maximum angles captured"}
            </p>
          )}
        </div>

        {/* Hidden Native Camera Input */}
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleCapture} 
        />

        {/* Controls & Thumbnail Tray */}
        <div className="flex flex-col gap-4">
          {/* Thumbnails */}
          {capturedImages.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {capturedImages.map((img, index) => (
                <div key={img.id} className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-orange-500/50">
                  <img src={img.previewUrl} alt={`Angle ${index + 1}`} className="w-full h-full object-cover" />
                  <button 
                    onClick={() => removeImage(img.id)}
                    className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-1 hover:bg-red-500 text-white"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            {capturedImages.length < MAX_IMAGES && (
              <button 
                disabled={isWatermarking || isEnhancing}
                onClick={() => fileInputRef.current.click()} 
                className="flex flex-col items-center justify-center w-16 h-16 bg-white rounded-full text-stone-800 shadow-md hover:scale-105 transition-transform disabled:opacity-50 cursor-pointer"
              >
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}

            {capturedImages.length > 0 && (
              <button 
                disabled={isEnhancing}
                onClick={handleEnhanceClick}
                className="flex-1 py-3 bg-gradient-to-r from-orange-600 to-amber-500 font-bold rounded-xl text-white shadow-lg disabled:opacity-50"
              >
                {isEnhancing ? 'AI Enhancing...' : `Enhance ${capturedImages.length} Images ✨`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
