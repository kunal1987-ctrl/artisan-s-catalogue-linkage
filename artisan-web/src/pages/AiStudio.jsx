import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fal } from '@fal-ai/client';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { validateImageLightweight } from '../utils/imageValidator';
import { addGeoWatermark } from '../utils/geoWatermark';
import MicroVideoCapture from '../components/MicroVideoCapture';
import { enhanceAndCleanProductImage } from '../utils/imageEnhancer';
import { useAudio } from '../context/AudioContext';
import exifr from 'exifr';

// Configure the client using your Vite environment variable
fal.config({
  credentials: import.meta.env.VITE_FAL_API_KEY,
  suppressLocalCredentialsWarning: true,
});

const MAX_IMAGES = 3;

export const SCENE_PRESETS = [
  {
    id: 'rustic-wood',
    label: 'Rustic Wood & Sunlight (देहाती लकड़ी और धूप)',
    icon: '🪵',
    prompt: 'A beautiful, rustic wooden table bathed in warm morning sunlight, soft studio lighting, photorealistic interior design.'
  },
  {
    id: 'marble-studio',
    label: 'Minimalist Marble Pedestal (संगमरमर स्टूडियो)',
    icon: '🏛️',
    prompt: 'A sleek, minimalist white marble pedestal with subtle directional gallery spotlight, clean high-end luxury backdrop.'
  },
  {
    id: 'traditional-jute',
    label: 'Handcrafted Jute & Terracotta (हस्तशिल्प जूट और मिट्टी)',
    icon: '🏺',
    prompt: 'A natural handwoven earthy jute mat, soft warm terracotta walls, golden hour soft diffused craft studio lighting.'
  },
  {
    id: 'festive-heritage',
    label: 'Festive Heritage & Warm Brass (पारंपरिक उत्सव चमक)',
    icon: '✨',
    prompt: 'A festive Indian heritage living room table with soft glowing bokeh fairy lights, brass accents, warm ambient lighting.'
  },
  {
    id: 'clean-podium',
    label: 'E-Commerce White Studio Podium (ई-कॉमर्स पोडियम)',
    icon: '📸',
    prompt: 'A clean neutral off-white product podium with ultra-realistic soft ground contact shadows and commercial studio light.'
  }
];

export const compressImageBeforeUpload = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height && width > MAX_DIM) {
          height *= MAX_DIM / width;
          width = MAX_DIM;
        } else if (height > MAX_DIM) {
          width *= MAX_DIM / height;
          height = MAX_DIM;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8);
      };
    };
  });
};

/**
 * Enterprise Generative AI Image Pipeline:
 * 1. Generative AI Contextual Background replacement & Studio lighting via Fal.ai (fal-ai/bria/background/replace)
 * 2. Directly fetch Fal.ai composition and upload Blob to Supabase Storage ('products' bucket)
 */
export async function processImagePipeline(
  file,
  scenePrompt = 'Professional product photography, clean studio lighting, high resolution, soft shadows, 4k',
  userId = 'anonymous',
  statusCallback = null
) {
  // Backward compatibility check if called as processImagePipeline(file, userId, statusCallback)
  if (typeof scenePrompt === 'string' && scenePrompt.length < 40 && !scenePrompt.includes(' ') && typeof userId === 'function') {
    statusCallback = userId;
    userId = scenePrompt;
    scenePrompt = 'Professional product photography, clean studio lighting, high resolution, soft shadows, 4k';
  }

  const updateStatus = (msg) => {
    if (statusCallback && typeof statusCallback === 'function') {
      statusCallback(msg);
    }
  };

  // ── Step 1: Lightweight Canvas Downscaler (Under 1MB / 1200px max) ──
  const compressedBlob = await compressImageBeforeUpload(file);

  // ── Step 2: Generative AI Contextual Lighting & Background (Fal.ai bria/background/replace) ──
  updateStatus('Enhancing product lighting and removing background...');

  const base64DataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(new Error('Failed to read image file: ' + err.message));
    reader.readAsDataURL(compressedBlob);
  });

  const falApiKey = import.meta.env.VITE_FAL_API_KEY;
  if (!falApiKey) {
    throw new Error('VITE_FAL_API_KEY is not configured in environment variables');
  }

  const effectivePrompt = scenePrompt || 'clean studio lighting, high resolution, soft shadows, 4k';
  let generatedImageUrl = null;

  // Primary execution via official fal.subscribe client SDK with fal-ai/bria/background/replace
  try {
    const result = await fal.subscribe('fal-ai/bria/background/replace', {
      input: {
        image_url: base64DataUrl,
        prompt: `Pro studio photography, high-end commercial product shot of ${effectivePrompt}, elegant neutral background, soft diffused studio lighting, sharp focus`,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          updateStatus('Enhancing product lighting and removing background...');
        }
      },
    });

    generatedImageUrl = result?.image?.url || result?.data?.image?.url || result?.data?.image_url || result?.data?.url;
  } catch (sdkErr) {
    console.warn('[processImagePipeline] fal.subscribe error, trying fallback:', sdkErr);
  }

  // Fallback to synchronous endpoint if SDK queue didn't return image URL
  if (!generatedImageUrl) {
    try {
      const syncRes = await fetch('https://fal.run/fal-ai/bria/background/replace', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${falApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: base64DataUrl,
          prompt: `Pro studio photography, high-end commercial product shot of ${effectivePrompt}, elegant neutral background, soft diffused studio lighting, sharp focus`,
        }),
      });

      if (syncRes.ok) {
        const syncData = await syncRes.json();
        generatedImageUrl = syncData?.image?.url || syncData?.data?.image?.url || syncData?.image_url || syncData?.url;
      } else {
        const errText = await syncRes.text();
        console.warn(`[processImagePipeline] Sync endpoint error (${syncRes.status}):`, errText);
      }
    } catch (fetchErr) {
      console.warn('[processImagePipeline] Direct fetch fallback failed:', fetchErr);
    }
  }

  if (!generatedImageUrl) {
    updateStatus('Applying studio lighting & removing background...');
    const enhanced = await enhanceAndCleanProductImage(compressedBlob, updateStatus);
    generatedImageUrl = enhanced.enhancedUrl;
  }

  if (!generatedImageUrl) {
    throw new Error('Studio enhancement did not return a valid image URL');
  }

  // ── Step 2: Fetch Composed Image Blob & Upload Directly to Supabase Storage ──
  updateStatus('उत्पाद छवि सहेजी जा रही है...');

  const imgResponse = await fetch(generatedImageUrl);
  const blob = await imgResponse.blob();

  const fileName = `${userId}/product_${Date.now()}.jpg`;
  let publicUrl = '';

  try {
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from('products')
      .upload(fileName, blob, {
        contentType: blob.type || 'image/jpeg',
        upsert: true,
      });

    if (uploadErr) {
      console.warn('[processImagePipeline] Bucket "products" upload error:', uploadErr.message);
      // Fallback to 'artisan-images' bucket if 'products' is not configured
      const { data: fbData, error: fbErr } = await supabase.storage
        .from('artisan-images')
        .upload(fileName, blob, {
          contentType: blob.type || 'image/jpeg',
          upsert: true,
        });
      if (!fbErr && fbData) {
        const { data: pubData } = supabase.storage.from('artisan-images').getPublicUrl(fileName);
        publicUrl = pubData?.publicUrl || '';
      }
    } else if (uploadData) {
      const { data: pubData } = supabase.storage.from('products').getPublicUrl(fileName);
      publicUrl = pubData?.publicUrl || '';
    }
  } catch (err) {
    console.warn('[processImagePipeline] Supabase upload exception:', err);
  }

  // Fallback to generated image URL if storage upload failed
  if (!publicUrl) {
    publicUrl = generatedImageUrl;
  }

  return {
    publicUrl,
    generatedImageUrl,
    blob,
    fileName,
  };
}

const verifyImageMetadata = async (file) => {
  try {
    const data = await exifr.parse(file, ['Software', 'Make', 'Model']);
    
    if (data?.Software) {
      const software = data.Software.toLowerCase();
      if (software.includes('photoshop') || software.includes('canva') || software.includes('lightroom')) {
        alert("Digital manipulation detected. Please capture a real, unedited photo.");
        return false;
      }
    }
    return true; 
  } catch (error) {
    console.warn("No EXIF data found - proceed with AI visual check.", error);
    return true; 
  }
};

export default function AiStudio() {
  const navigate = useNavigate();
  const { user, artisanProfile } = useAuth?.() || {};
  const { playAudio } = useAudio();

  // Automatically plays camera instruction on studio mount
  useEffect(() => {
    playAudio('camera_instruction');
  }, [playAudio]);

  // ── State Management ──
  const [captureMode, setCaptureMode] = useState('photos'); // 'photos' | 'video'
  const [recordedVideoBlob, setRecordedVideoBlob] = useState(null);
  const [capturedImages, setCapturedImages] = useState([]);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState('');
  const [loadingText, setLoadingText] = useState('');
  const [enhancedImageUrl, setEnhancedImageUrl] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isWatermarking, setIsWatermarking] = useState(false);
  const fileInputRef = useRef(null);

  // ── Strict fal.ai Product Lighting & Enhancement Handler ──
  const handleEnhanceImage = async (originalImageUrl, productDescription) => {
    setIsEnhancing(true);
    setEnhanceError('');

    try {
      // Execute the model on fal.ai (fal-ai/bria/background/replace)
      const result = await fal.subscribe("fal-ai/bria/background/replace", {
        input: {
          image_url: originalImageUrl,
          prompt: `Pro studio photography, high-end commercial product shot of ${productDescription || scenePrompt}, elegant neutral background, soft diffused studio lighting, sharp focus`,
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            setLoadingText("Enhancing product lighting and removing background...");
          }
        },
      });

      const extractedUrl = result?.image?.url || result?.data?.image?.url;
      if (result && ((result.image && result.image.url) || extractedUrl)) {
        // Update state with the watermark-free, fal.ai generated image
        const finalUrl = result?.image?.url || extractedUrl;
        setEnhancedImageUrl(finalUrl);
        return finalUrl;
      } else {
        throw new Error("Failed to retrieve enhanced image from fal.ai");
      }
    } catch (error) {
      console.error("fal.ai Processing Error:", error);
      setEnhanceError("Image enhancement failed. Please ensure your VITE_FAL_API_KEY is active and try again.");
    } finally {
      setIsEnhancing(false);
    }
  };

  // ── Generative Scene Prompt State ──
  const [scenePrompt, setScenePrompt] = useState(
    'A beautiful, rustic wooden table bathed in warm morning sunlight, soft studio lighting, photorealistic interior design.'
  );
  const [selectedPresetId, setSelectedPresetId] = useState('rustic-wood');
  const [isCustomPrompt, setIsCustomPrompt] = useState(false);

  // Government Verification State (Gatekeeper)
  const isUserLoggedIn = Boolean(
    (user && !user.is_anonymous) ||
    artisanProfile?.verified ||
    artisanProfile?.is_verified ||
    localStorage.getItem('artisan_gov_verified') === 'true'
  );
  const [isVerified, setIsVerified] = useState(() => {
    return isUserLoggedIn || localStorage.getItem('artisan_gov_verified') === 'true' || Boolean(artisanProfile?.is_verified);
  });
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  useEffect(() => {
    const fetchVerification = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const activeUserId = authData?.user?.id || user?.id;
        const loggedIn = Boolean(
          (authData?.user && !authData?.user?.is_anonymous) ||
          (user && !user?.is_anonymous)
        );

        if (loggedIn) {
          setIsVerified(true);
        }

        if (!activeUserId) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('is_verified')
          .eq('id', activeUserId)
          .maybeSingle();

        if (profile) {
          const verified = Boolean(profile.is_verified) || loggedIn;
          setIsVerified(verified);
          if (verified) localStorage.setItem('artisan_gov_verified', 'true');
        }
      } catch (e) {
        console.warn('[AiStudio] Error fetching verification status:', e);
      }
    };
    fetchVerification();
  }, [user]);

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
        const validation = await validateImageLightweight(file);
        if (!validation.valid) {
          alert(`⚠️ ${validation.reason}`);
          return;
        }

        const isClean = await verifyImageMetadata(file);
        if (!isClean) {
          return;
        }

        const artisanId = artisanProfile?.id || user?.id?.substring(0, 8) || "A-1029";
        const watermarkedFile = await addGeoWatermark(file, artisanId);

        const newImageObj = {
          id: Date.now(),
          file: watermarkedFile,
          previewUrl: URL.createObjectURL(watermarkedFile),
          status: 'pending'
        };

        setCapturedImages((prev) => {
          if (prev.length >= MAX_IMAGES) return prev;
          const next = [...prev, newImageObj];
          // Auto-trigger Fal.ai enhancement pipeline immediately upon capture without requiring manual click
          setTimeout(() => {
            handleBatchEnhance(next);
          }, 50);
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

  // ── AI Batch Generative Scene Pipeline (fal-ai/bria/background/replace + Supabase) ──
  const handleBatchEnhance = useCallback(async (imagesToEnhance = capturedImages) => {
    if (imagesToEnhance.length === 0 || isEnhancing) return;

    setIsEnhancing(true);
    setEnhanceError('');
    setLoadingText('Enhancing product lighting and removing background...');
    setStatusMessage('AI आपके उत्पाद के लिए एक सुंदर दृश्य तैयार कर रहा है...');

    setCapturedImages((prev) =>
      prev.map((img) => (img.status === 'pending' ? { ...img, status: 'enhancing' } : img))
    );

    const activeUserId = user?.id || 'anonymous';
    const updatedImages = [...imagesToEnhance];

    for (let i = 0; i < updatedImages.length; i++) {
      const item = updatedImages[i];
      if (item.status === 'ready' && item.enhancedUrl) continue;

      try {
        const result = await processImagePipeline(item.file, scenePrompt, activeUserId, (msg) => {
          setStatusMessage(msg);
          setLoadingText(msg);
        });

        const rawBase64 = await fileToBase64(item.file);

        if (result?.publicUrl) {
          setEnhancedImageUrl(result.publicUrl);
        }

        updatedImages[i] = {
          ...item,
          status: 'ready',
          enhancedUrl: result.publicUrl,
          base64: rawBase64,
        };
        setCapturedImages([...updatedImages]);
      } catch (err) {
        console.warn(`[AiStudio] Generative pipeline error on photo #${i + 1}:`, err);
        setEnhanceError("Image enhancement failed. Please ensure your VITE_FAL_API_KEY is active and try again.");
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
    setStatusMessage('');
    setLoadingText('');
  }, [capturedImages, isEnhancing, scenePrompt, user]);

  // Handle Preset Selection Change
  const handlePresetSelect = (presetId) => {
    setSelectedPresetId(presetId);
    if (presetId === 'custom') {
      setIsCustomPrompt(true);
    } else {
      setIsCustomPrompt(false);
      const found = SCENE_PRESETS.find((p) => p.id === presetId);
      if (found) {
        setScenePrompt(found.prompt);
      }
    }
  };

  // Proceed to catalog listing / review
  const handleProceedToReview = () => {
    const canProceed = Boolean(isVerified || isUserLoggedIn || (user && !user.is_anonymous) || artisanProfile?.verified);
    if (!canProceed) {
      setShowVerificationModal(true);
      return;
    }

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
        <div className="flex flex-col gap-2 pb-3 mb-2 border-b border-white/10 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              <span className="font-bold tracking-wide uppercase text-stone-200">AI Lifestyle Studio</span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                GPS Active
              </span>
            </div>
            {captureMode === 'photos' && (
              <span className="text-orange-400 font-semibold">
                {capturedImages.length}/{MAX_IMAGES} Angles
              </span>
            )}
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2 p-1 bg-black/40 rounded-xl border border-white/10 w-fit">
            <button
              type="button"
              onClick={() => setCaptureMode('photos')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${captureMode === 'photos' ? 'bg-orange-600 text-white shadow-sm' : 'text-stone-400 hover:text-stone-200'}`}
            >
              📸 3 Angles
            </button>
            <button
              type="button"
              onClick={() => setCaptureMode('video')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${captureMode === 'video' ? 'bg-red-600 text-white shadow-sm' : 'text-stone-400 hover:text-stone-200'}`}
            >
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
              🎥 3s Video Proof
            </button>
          </div>
        </div>

        {/* Strict Error Handling Feedback */}
        {enhanceError && (
          <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-xl flex items-start gap-2 text-red-200 text-xs font-semibold mb-3">
            <span className="text-red-400 font-bold shrink-0">⚠️</span>
            <span>{enhanceError}</span>
          </div>
        )}

        {/* Video Mode */}
        {captureMode === 'video' ? (
          <div className="flex-1 flex flex-col justify-center items-center">
            <MicroVideoCapture 
              onCaptureComplete={(blob) => {
                setRecordedVideoBlob(blob);
                alert("3-second 3D Turnaround proof captured successfully! (3D वीडियो प्रमाण सफलतापूर्वक रिकॉर्ड हो गया)");
              }}
              onCancel={() => setCaptureMode('photos')}
            />
          </div>
        ) : (
          <>
            {/* Main Viewfinder / Placeholder */}
            <div className="relative flex-1 bg-black rounded-xl flex items-center justify-center border border-white/10 mb-3 overflow-hidden min-h-[280px]">
              {/* Frame markers */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-orange-500 z-10"></div>
              <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-orange-500 z-10"></div>
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-orange-500 z-10"></div>
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-orange-500 z-10"></div>

              {(enhancedImageUrl || capturedImages.length > 0) && (
                <img 
                  src={enhancedImageUrl || capturedImages[capturedImages.length - 1].enhancedUrl || capturedImages[capturedImages.length - 1].previewUrl} 
                  alt="Active preview"
                  className="absolute inset-0 w-full h-full object-contain"
                />
              )}

              {isWatermarking ? (
                <p className="text-orange-300 text-xs sm:text-sm z-10 bg-black/80 px-4 py-2 rounded-full backdrop-blur-xs flex items-center gap-2 border border-orange-500/30 animate-pulse">
                  <svg className="animate-spin h-3.5 w-3.5 text-orange-400" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <span>GPS वॉटरमार्क जोड़ रहे हैं (Geo-stamping)...</span>
                </p>
              ) : isEnhancing ? (
                <p className="text-amber-300 text-xs sm:text-sm z-10 bg-black/85 px-4 py-2 rounded-full backdrop-blur-xs flex items-center gap-2 border border-amber-500/40 animate-pulse text-center max-w-[90%]">
                  <svg className="animate-spin h-4 w-4 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <span>{loadingText || statusMessage || 'Enhancing product lighting and removing background...'}</span>
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

            {/* ── Contextual Scene Selection / Prompt State UI ── */}
            <div className="bg-black/30 border border-white/10 rounded-xl p-2.5 mb-3 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <span>🎨</span>
                  <span>दृश्य शैली चुनें (Select Scene Vibe)</span>
                </span>
                <span className="text-[10px] text-stone-400">Fal.ai IC-Light</span>
              </div>

              {/* Scene Dropdown Selector */}
              <div className="relative">
                <select
                  disabled={isEnhancing}
                  value={selectedPresetId}
                  onChange={(e) => handlePresetSelect(e.target.value)}
                  className="w-full bg-[#120d0a] border border-orange-500/30 rounded-lg px-3 py-2 text-xs text-amber-100 font-medium focus:outline-none focus:border-orange-500 cursor-pointer disabled:opacity-50"
                >
                  {SCENE_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id} className="bg-stone-900 text-stone-200">
                      {preset.icon} {preset.label}
                    </option>
                  ))}
                  <option value="custom" className="bg-stone-900 text-stone-200">
                    ✏️ Custom Prompt (कस्टम दृश्य विवरण लिखें)
                  </option>
                </select>
              </div>

              {/* Prompt Text Input / Editable Preview */}
              <div className="flex flex-col gap-1">
                <textarea
                  rows={2}
                  disabled={isEnhancing}
                  value={scenePrompt}
                  onChange={(e) => {
                    setScenePrompt(e.target.value);
                    if (selectedPresetId !== 'custom') {
                      setSelectedPresetId('custom');
                      setIsCustomPrompt(true);
                    }
                  }}
                  placeholder="A beautiful, rustic wooden table bathed in warm morning sunlight, soft studio lighting..."
                  className="w-full bg-black/40 border border-white/5 rounded-lg p-2 text-[11px] text-stone-300 placeholder-stone-500 focus:outline-none focus:border-orange-500/50 resize-none font-mono leading-relaxed disabled:opacity-50"
                />
              </div>
            </div>

            {/* Controls & Thumbnail Tray */}
            <div className="flex flex-col gap-3">
              {/* Thumbnails */}
              {capturedImages.length > 0 && (
                <div className="flex gap-2.5 overflow-x-auto pb-1">
                  {capturedImages.map((img, index) => (
                    <div key={img.id} className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden border border-orange-500/50">
                      <img src={img.enhancedUrl || img.previewUrl} alt={`Angle ${index + 1}`} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removeImage(img.id)}
                        className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-1 hover:bg-red-500 text-white cursor-pointer"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center gap-3">
                {capturedImages.length < MAX_IMAGES && (
                  <div className="relative flex items-center justify-center shrink-0">
                    <div className="absolute inset-0 rounded-full bg-orange-500/30 animate-ping pointer-events-none" />
                    <button 
                      disabled={isWatermarking || isEnhancing}
                      onClick={() => fileInputRef.current.click()} 
                      className="relative z-10 flex flex-col items-center justify-center w-14 h-14 bg-white rounded-full text-stone-800 shadow-md hover:scale-105 active:scale-95 transition-transform duration-200 disabled:opacity-50 cursor-pointer"
                    >
                      <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  </div>
                )}

                {capturedImages.length > 0 && (
                  <button 
                    disabled={isEnhancing}
                    onClick={handleEnhanceClick}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-600 to-amber-500 font-bold text-sm rounded-xl text-white shadow-lg shadow-orange-500/40 animate-pulse hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isEnhancing ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>दृश्य तैयार हो रहा है...</span>
                      </>
                    ) : capturedImages.every(i => i.status === 'ready') ? (
                      'Proceed to Catalog Review ➔'
                    ) : (
                      `Generate AI Scene (${capturedImages.length} Images) ✨`
                    )}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Government Verification Gatekeeper Modal ── */}
      {showVerificationModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full p-6 pb-8 sm:pb-6 shadow-2xl border border-gray-200 flex flex-col gap-4 text-gray-900 max-h-[90vh] overflow-y-auto transform transition-transform">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                <span className="text-2xl">⚠️</span>
              </div>
              <button
                type="button"
                onClick={() => setShowVerificationModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Verification Required (सत्यापन आवश्यक है)
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                Verification Required. You must be a verified MoSJE/Pehchan artisan to publish catalogs to government marketplaces.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowVerificationModal(false);
                  navigate('/verification');
                }}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition text-center cursor-pointer"
              >
                Complete Verification Now
              </button>
              <button
                type="button"
                onClick={() => setShowVerificationModal(false)}
                className="w-full sm:w-auto py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
