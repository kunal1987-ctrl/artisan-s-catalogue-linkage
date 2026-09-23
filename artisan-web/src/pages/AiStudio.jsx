import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { validateImageLightweight } from '../utils/imageValidator';
import { addGeoWatermark } from '../utils/geoWatermark';
import MicroVideoCapture from '../components/MicroVideoCapture';
import exifr from 'exifr';

const MAX_IMAGES = 3;

/**
 * Enterprise Image Pipeline:
 * 1. AI Background Removal via Fal.ai (bria-rmbg)
 * 2. Client-Side Studio Formatting (HTML5 Canvas 800x800, #FFFFFF, Drop Shadow, 10% Padding)
 * 3. Supabase Storage Upload ('products' bucket)
 */
export async function processImagePipeline(file, userId = 'anonymous', statusCallback = null) {
  const updateStatus = (msg) => {
    if (statusCallback && typeof statusCallback === 'function') {
      statusCallback(msg);
    }
  };

  // ── Step 1: AI Background Removal (Fal.ai API) ──
  updateStatus('AI पृष्ठभूमि हटा रहा है...');

  const base64DataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(new Error('Failed to read image file: ' + err.message));
    reader.readAsDataURL(file);
  });

  const falApiKey = import.meta.env.VITE_FAL_API_KEY;
  if (!falApiKey) {
    throw new Error('VITE_FAL_API_KEY is not configured in environment variables');
  }

  let transparentImageUrl = null;

  // Primary POST to Fal.ai queue endpoint as specified in requirements
  try {
    const response = await fetch('https://queue.fal.run/fal-ai/bria-rmbg', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image_url: base64DataUrl }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.image?.url || data?.image_url || data?.url) {
        transparentImageUrl = data?.image?.url || data?.image_url || data?.url;
      } else if (data?.response_url || data?.status_url) {
        const pollUrl = data.response_url || data.status_url;
        let attempts = 0;
        while (!transparentImageUrl && attempts < 30) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          attempts++;
          const pollRes = await fetch(pollUrl, {
            headers: { Authorization: `Key ${falApiKey}` },
          });
          if (pollRes.ok) {
            const pollData = await pollRes.json();
            if (pollData?.image?.url || pollData?.image_url || pollData?.url) {
              transparentImageUrl = pollData?.image?.url || pollData?.image_url || pollData?.url;
            } else if (pollData?.status === 'COMPLETED' && pollData?.payload) {
              transparentImageUrl = pollData.payload?.image?.url || pollData.payload?.image_url;
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[processImagePipeline] Queue endpoint exception:', err);
  }

  // Fallback to synchronous endpoint if queue didn't return image URL
  if (!transparentImageUrl) {
    const syncRes = await fetch('https://fal.run/fal-ai/bria-rmbg', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image_url: base64DataUrl }),
    });

    if (!syncRes.ok) {
      const errText = await syncRes.text();
      throw new Error(`Fal.ai API error (${syncRes.status}): ${errText}`);
    }

    const syncData = await syncRes.json();
    transparentImageUrl = syncData?.image?.url || syncData?.image_url || syncData?.url;
  }

  if (!transparentImageUrl) {
    throw new Error('Fal.ai background removal did not return a valid image URL');
  }

  // Load transparent image into HTML Image object
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = () => reject(new Error('Failed to load transparent image from Fal.ai'));
    img.src = transparentImageUrl;
  });

  // ── Step 2: Client-Side Studio Formatting (HTML5 Canvas) ──
  updateStatus('स्टूडियो लाइटिंग लागू की जा रही है...');

  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');

  // Fill White Canvas
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 800, 800);

  // Drop Shadow Configuration
  ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
  ctx.shadowBlur = 25;
  ctx.shadowOffsetY = 15;
  ctx.shadowOffsetX = 0;

  // Calculate Aspect Ratio to fit inside 800x800 with 10% padding
  const padding = 0.10; // 10% padding
  const maxW = 800 * (1 - 2 * padding); // 640px
  const maxH = 800 * (1 - 2 * padding); // 640px

  const scale = Math.min(maxW / img.width, maxH / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const drawX = (800 - drawW) / 2;
  const drawY = (800 - drawH) / 2;

  ctx.drawImage(img, drawX, drawY, drawW, drawH);

  // ── Step 3: Supabase Storage Upload ──
  updateStatus('उत्पाद छवि सहेजी जा रही है...');

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Canvas export to JPEG blob failed'));
      },
      'image/jpeg',
      0.9
    );
  });

  const fileName = `${userId}/product_${Date.now()}.jpg`;
  let publicUrl = '';

  try {
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from('products')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadErr) {
      console.warn('[processImagePipeline] Bucket "products" upload error:', uploadErr.message);
      // Fallback to 'artisan-images' bucket if 'products' is not configured
      const { data: fbData, error: fbErr } = await supabase.storage
        .from('artisan-images')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
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

  // Fallback data URL if storage upload failed
  if (!publicUrl) {
    publicUrl = canvas.toDataURL('image/jpeg', 0.9);
  }

  return {
    publicUrl,
    transparentImageUrl,
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

  // ── State Management ──
  const [captureMode, setCaptureMode] = useState('photos'); // 'photos' | 'video'
  const [recordedVideoBlob, setRecordedVideoBlob] = useState(null);
  const [capturedImages, setCapturedImages] = useState([]);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isWatermarking, setIsWatermarking] = useState(false);
  const fileInputRef = useRef(null);

  // Government Verification State (Gatekeeper)
  const [isVerified, setIsVerified] = useState(() => {
    return localStorage.getItem('artisan_gov_verified') === 'true' || Boolean(artisanProfile?.is_verified);
  });
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  useEffect(() => {
    const fetchVerification = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const activeUserId = authData?.user?.id || user?.id;
        if (!activeUserId) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('is_verified')
          .eq('id', activeUserId)
          .maybeSingle();

        if (profile) {
          const verified = Boolean(profile.is_verified);
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

  // ── AI Batch Enhancement Pipeline (Fal.ai + Canvas + Supabase) ──
  const handleBatchEnhance = useCallback(async (imagesToEnhance = capturedImages) => {
    if (imagesToEnhance.length === 0 || isEnhancing) return;

    setIsEnhancing(true);
    setStatusMessage('AI पृष्ठभूमि हटा रहा है...');

    setCapturedImages((prev) =>
      prev.map((img) => (img.status === 'pending' ? { ...img, status: 'enhancing' } : img))
    );

    const activeUserId = user?.id || 'anonymous';
    const updatedImages = [...imagesToEnhance];

    for (let i = 0; i < updatedImages.length; i++) {
      const item = updatedImages[i];
      if (item.status === 'ready' && item.enhancedUrl) continue;

      try {
        const result = await processImagePipeline(item.file, activeUserId, (msg) => {
          setStatusMessage(msg);
        });

        const rawBase64 = await fileToBase64(item.file);

        updatedImages[i] = {
          ...item,
          status: 'ready',
          enhancedUrl: result.publicUrl,
          base64: rawBase64,
        };
        setCapturedImages([...updatedImages]);
      } catch (err) {
        console.warn(`[AiStudio] Image pipeline error on photo #${i + 1}:`, err);
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
  }, [capturedImages, isEnhancing, user]);

  // Proceed to catalog listing / review
  const handleProceedToReview = () => {
    if (!isVerified) {
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
              <span className="font-bold tracking-wide uppercase text-stone-200">AI Studio Camera</span>
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
              ) : isEnhancing ? (
                <p className="text-amber-300 text-xs sm:text-sm z-10 bg-black/85 px-4 py-2 rounded-full backdrop-blur-xs flex items-center gap-2 border border-amber-500/40 animate-pulse">
                  <svg className="animate-spin h-4 w-4 text-amber-400" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <span>{statusMessage || 'AI प्रोसेस हो रहा है...'}</span>
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
                      <img src={img.enhancedUrl || img.previewUrl} alt={`Angle ${index + 1}`} className="w-full h-full object-cover" />
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
                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-orange-500/30 animate-ping pointer-events-none" />
                    <button 
                      disabled={isWatermarking || isEnhancing}
                      onClick={() => fileInputRef.current.click()} 
                      className="relative z-10 flex flex-col items-center justify-center w-16 h-16 bg-white rounded-full text-stone-800 shadow-md hover:scale-105 active:scale-95 transition-transform duration-200 disabled:opacity-50 cursor-pointer"
                    >
                      <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="flex-1 py-3 bg-gradient-to-r from-orange-600 to-amber-500 font-bold rounded-xl text-white shadow-lg shadow-orange-500/40 animate-pulse hover:scale-105 hover:-translate-y-1 transition-all duration-300 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isEnhancing ? (statusMessage || 'AI Enhancing...') : capturedImages.every(i => i.status === 'ready') ? 'Proceed to Catalog Review ➔' : `Enhance ${capturedImages.length} Images ✨`}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Government Verification Gatekeeper Modal ── */}
      {showVerificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 flex flex-col gap-4 text-gray-900">
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
