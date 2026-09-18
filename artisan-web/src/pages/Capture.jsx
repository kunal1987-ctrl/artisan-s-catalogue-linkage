import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Camera, Upload } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import LanguageToggle from '../components/LanguageToggle';
import LanguageSelectorModal, { getDialectBadgeText } from '../components/LanguageSelectorModal';
import AudioMuteButton from '../components/AudioMuteButton';
import useAudioAssistant from '../hooks/useAudioAssistant';

const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result;
      if (typeof res === 'string') {
        resolve(res.split(',')[1] || '');
      } else {
        reject(new Error('Failed to read blob as Base64 string'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

/**
 * Compresses incoming camera photos to a maximum dimension of 1024px
 * using browser-image-compression before upload, ensuring lightning-fast uploads
 * and zero device lockups.
 */
const compressImage = async (file, maxDimension = 1024, quality = 0.85) => {
  if (!file) return file;
  if (file.type === 'image/svg+xml') return file;

  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: maxDimension,
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: quality,
  };

  try {
    return await imageCompression(file, options);
  } catch (error) {
    console.warn('[Capture] browser-image-compression fallback:', error);
    return file;
  }
};


const CRAFT_SUGGESTION_CHIPS = [
  {
    label_hi: 'टेराकोटा सजावटी बर्तन',
    label_en: 'Terracotta Pot',
    text_hi: 'हाथ से बना हुआ मिट्टी का सजावटी बर्तन, बहुत सुंदर नक्काशी, पारंपरिक कला।',
    text_en: 'Handmade terracotta decorative clay pot with intricate floral carving and traditional firing.',
  },
  {
    label_hi: 'बनारसी रेशम साड़ी',
    label_en: 'Banarasi Silk Saree',
    text_hi: 'हाथ से बुनी बनारसी शुद्ध रेशम साड़ी, शुद्ध ज़री बॉर्डर, 4 दिन की हस्तनिर्मित बुनाई।',
    text_en: 'Handwoven pure mulberry Banarasi silk saree with authentic golden zari borders.',
  },
  {
    label_hi: 'पीतल पूजा दीया',
    label_en: 'Brass Temple Diya',
    text_hi: 'पीतल का हस्तनिर्मित नक्काशीदार मंदिर दीया, शुद्ध पीतल, पारंपरिक धार्मिक शिल्प।',
    text_en: 'Handcrafted carved brass temple diya lamp made from pure bell-metal brass.',
  },
  {
    label_hi: 'शीशम लकड़ी का बॉक्स',
    label_en: 'Sheesham Wood Box',
    text_hi: 'हाथ से नक्काशीदार शीशम की लकड़ी का बॉक्स, पारंपरिक जालीदार डिजाइन।',
    text_en: 'Hand-carved sheesham wood jewelry box with traditional fretwork jali lattice.',
  },
  {
    label_hi: 'कढ़ाई वाला जूट बैग',
    label_en: 'Embroidered Jute Bag',
    text_hi: 'कच्छी कढ़ाई वाला हस्तनिर्मित इको-फ्रेंडली जूट बैग, प्राकृतिक फाइबर।',
    text_en: 'Eco-friendly handmade natural jute tote bag with authentic Kutchi embroidery.',
  },
];

/**
 * Uses browser SpeechSynthesis to read a Hindi error message aloud.
 * Triggered when Groq Whisper returns 500 or audio transcription fails.
 */
const speakHindi = (text = 'माफ करें, आवाज़ साफ नहीं आई। कृपया दोबारा बोलें।') => {
  try {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'hi-IN';
    utt.rate = 0.92;
    utt.pitch = 1.05;
    window.speechSynthesis.speak(utt);
  } catch (e) {
    console.warn('[speakHindi] SpeechSynthesis unavailable:', e);
  }
};

export default function Capture() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, artisanProfile, openAuthModal, showToast, language, toggleNotifications, unreadCount } = useAuth();
  const isVerified = Boolean(artisanProfile?.verified || user?.is_phone_verified);

  // ── Camera & Gallery Input Refs ──
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

  // ── Multi-Image State & Dependencies ──
  const [images, setImages] = useState([]); // Array of { id, blob, file, previewUrl, base64 }
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Single-image backward compatibility aliases
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [processedPreview, setProcessedPreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [bgRemovalStatus, setBgRemovalStatus] = useState('idle'); // idle | processing | done | error

  // ── WebRTC Live Camera Viewfinder State & Refs ──
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState('environment'); // 'environment' | 'user'
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Object URL tracking to prevent memory leaks
  const previewUrlRef = useRef(null);
  const processedPreviewRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      if (processedPreviewRef.current && processedPreviewRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(processedPreviewRef.current);
      }
      if (streamRef.current) {
        try {
          streamRef.current.getTracks().forEach((track) => track.stop());
        } catch (e) {
          console.warn('Error stopping tracks on unmount:', e);
        }
      }
    };
  }, []);

  // ── Audio / Description State ──
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioBase64, setAudioBase64] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [_audioBlob, setLegacyAudioBlob] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [micUnavailable, setMicUnavailable] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioTranscript, setAudioTranscript] = useState('');
  const [customTranscript, setCustomTranscript] = useState('');
  const [category, setCategory] = useState(null);
  const [hsnCode, setHsnCode] = useState(null);
  const [extractedPrice, setExtractedPrice] = useState(null);
  const [extractedName, setExtractedName] = useState('');
  const [showAdvancedText, setShowAdvancedText] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  // ── Explicit State Reset to prevent cache bleed between uploads ──
  const resetCaptureState = useCallback(() => {
    // Revoke all preview URLs in images
    setImages((prevImages) => {
      prevImages.forEach((img) => {
        if (img?.previewUrl && img.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(img.previewUrl);
        }
      });
      return [];
    });
    setSelectedImageIndex(0);

    setImage(null);
    setImageFile(null);
    setImageBase64(null);
    setImageUrl(null);
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    if (processedPreviewRef.current && processedPreviewRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(processedPreviewRef.current);
      processedPreviewRef.current = null;
    }
    setPreviewUrl(null);
    setProcessedPreview(null);
    setIsProcessingImage(false);
    setBgRemovalStatus('idle');

    // Close any active camera stream
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => track.stop());
      } catch (e) {
        console.warn('Error stopping camera stream on reset:', e);
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraModalOpen(false);
    setIsCameraStarting(false);
    setCameraError(null);

    setIsRecording(false);
    setAudioLevel(0);
    setAudioBase64(null);
    setAudioBlob(null);
    setLegacyAudioBlob(null);
    audioChunksRef.current = [];
    setRecordingDuration(0);
    setTranscript('');
    setAudioTranscript('');
    setCustomTranscript('');
    setCategory(null);
    setHsnCode(null);
    setShowAdvancedText(false);

    setExtractedPrice(null);
    setExtractedName('');

    setAiStatus('idle');
    setAiStatusText('');
    setErrorMsg('');

    if (cameraRef.current) cameraRef.current.value = '';
    if (galleryRef.current) galleryRef.current.value = '';
  }, []);

  // Ensure clean state upon entering capture screen
  useEffect(() => {
    resetCaptureState();
  }, [resetCaptureState]);

  // ── Regional Dialect / Voice Transcription State ──
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [transcriptionLang, setTranscriptionLang] = useState('hi');

  // ── AI Processing State ──
  const [aiStatus, setAiStatus] = useState('idle'); // idle | transcribing | analyzing | done | error
  const [aiStatusText, setAiStatusText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // ── Multi-Modal State Dependency Flags ──
  const hasImage = Boolean(images.length > 0 || image || imageFile || imageBase64 || imageUrl || processedPreview || previewUrl);
  const textDescription = (transcript || customTranscript || audioTranscript || '').trim();
  const hasDescription = Boolean(textDescription.length > 0 || Boolean(audioBase64) || Boolean(audioBlob) || Boolean(_audioBlob));
  const isReadyToProcess = Boolean(hasImage && hasDescription);

  const { speakPrompt, stop } = useAudioAssistant();

  // Contextual voice prompt: On-load — single combined instruction for zero-literacy artisans
  // Plays once when Capture screen mounts, before any photo/audio step prompts take over.
  useEffect(() => {
    const timer = setTimeout(() => {
      speakPrompt('capture_instruction');
    }, 500);
    return () => {
      clearTimeout(timer);
      // Cancel any in-flight speech to prevent leaking audio across screens
      stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]); // Replay if user switches language on this screen

  // Contextual voice prompt: Screen 1 - Camera / Photo capture prompt for zero-literacy artisans
  useEffect(() => {
    if (!hasImage) {
      const timer = setTimeout(() => {
        speakPrompt('camera_step');
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [hasImage, speakPrompt, language]);

  // Contextual voice prompt: Screen 2 - Voice recording prompt once photo is ready
  useEffect(() => {
    if (hasImage && !audioBase64 && !customTranscript && !isRecording) {
      const timer = setTimeout(() => {
        speakPrompt('voice_step');
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [hasImage, audioBase64, customTranscript, isRecording, speakPrompt, language]);

  // Immediately silence audio assistant when recording starts
  useEffect(() => {
    if (isRecording) {
      stop();
    }
  }, [isRecording, stop]);

  // ════════════════════════════════════════════
  // ASYNC LIFESTYLE ENHANCEMENT
  // ════════════════════════════════════════════

  const triggerLifestyleEnhancement = useCallback(async (base64String, workingBlob) => {
    if (!base64String) return;
    setIsProcessingImage(true);
    setBgRemovalStatus('processing');
    setAiStatusText(
      language === 'hi'
        ? 'एआई लाइफस्टाइल दृश्य तैयार किया जा रहा है...'
        : 'Generating lifestyle scene via Photoroom AI...'
    );

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      const { data: sessionData } = await supabase.auth.getSession();
      let token = sessionData?.session?.access_token;
      if (!token) {
        const { data: anonData } = await supabase.auth.signInAnonymously();
        token = anonData?.session?.access_token;
      }
      const activeAuth = token
        ? `Bearer ${token}`
        : `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`;

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-lifestyle-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: activeAuth,
        },
        body: JSON.stringify({
          imageBase64: base64String,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Edge function returned HTTP ${response.status}: ${errText}`);
      }

      const data = await response.json();
      if (data?.imageUrl) {
        setImageUrl(data.imageUrl);
        setProcessedPreview(data.imageUrl);
        setBgRemovalStatus('done');
        setAiStatusText(
          language === 'hi'
            ? 'लाइफस्टाइल फ़ोटो तैयार ✓'
            : 'Lifestyle scene ready ✓'
        );
        if (showToast) {
          showToast(
            language === 'hi'
              ? '✨ लाइफस्टाइल बैकग्राउंड तैयार!'
              : '✨ AI lifestyle background generated!'
          );
        }
      } else {
        throw new Error(data?.error || data?.message || 'No image URL received from Edge Function');
      }
    } catch (cloudErr) {
      console.warn('[Capture] Photoroom Edge Function fallback activated:', cloudErr);
      setBgRemovalStatus('error');
      setAiStatusText(
        language === 'hi'
          ? 'मूल फ़ोटो सुरक्षित की गई'
          : 'Original photo preserved'
      );

      // Fallback: Upload compressed raw image to Supabase Storage bucket product-images
      try {
        const fileName = `craft_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, workingBlob, {
            contentType: 'image/jpeg',
            upsert: false,
          });

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(uploadData.path);
          setImageUrl(urlData.publicUrl);
        }
      } catch (storageErr) {
        console.warn('[Capture] Storage fallback upload skipped:', storageErr);
      }
    } finally {
      setIsProcessingImage(false);
    }
  }, [language, showToast]);

  // ════════════════════════════════════════════
  // MULTI-IMAGE STATE MANAGEMENT
  // ════════════════════════════════════════════

  const addImageToState = useCallback(async (fileOrBlob) => {
    if (!fileOrBlob) return;
    const id = `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Compress image to 1024px
    let workingBlob = fileOrBlob;
    try {
      workingBlob = await compressImage(fileOrBlob, 1024, 0.85);
    } catch (optErr) {
      console.warn('[Capture] Image compression fallback:', optErr);
    }

    const localUrl = URL.createObjectURL(workingBlob);
    let base64String = '';
    try {
      base64String = await blobToBase64(workingBlob);
    } catch (e) {
      console.warn('[Capture] Photo base64 encoding error:', e);
    }

    const newImageItem = {
      id,
      blob: workingBlob,
      file: fileOrBlob instanceof File ? fileOrBlob : null,
      previewUrl: localUrl,
      base64: base64String,
    };

    setImages((prev) => {
      const isFirst = prev.length === 0;
      const updated = [...prev, newImageItem];
      setSelectedImageIndex(updated.length - 1);

      if (isFirst) {
        setImage(workingBlob);
        setImageFile(fileOrBlob instanceof File ? fileOrBlob : null);
        setPreviewUrl(localUrl);
        setImageBase64(base64String);
        triggerLifestyleEnhancement(base64String, workingBlob);
      }
      return updated;
    });

    return newImageItem;
  }, [triggerLifestyleEnhancement]);

  const removeImage = useCallback((indexToRemove) => {
    setImages((prev) => {
      const target = prev[indexToRemove];
      if (target?.previewUrl && target.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      const updated = prev.filter((_, idx) => idx !== indexToRemove);

      if (updated.length === 0) {
        setImage(null);
        setImageFile(null);
        setPreviewUrl(null);
        setProcessedPreview(null);
        setImageBase64(null);
        setImageUrl(null);
        setSelectedImageIndex(0);
        setIsProcessingImage(false);
        setBgRemovalStatus('idle');
      } else {
        const nextIndex = Math.min(indexToRemove, updated.length - 1);
        setSelectedImageIndex(nextIndex);
        const active = updated[nextIndex];
        setImage(active.blob);
        setImageFile(active.file || null);
        setPreviewUrl(active.previewUrl);
        setImageBase64(active.base64);
      }
      return updated;
    });
  }, []);

  const handleRetake = useCallback(() => {
    setImages((prev) => {
      prev.forEach((img) => {
        if (img?.previewUrl && img.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(img.previewUrl);
        }
      });
      return [];
    });
    setSelectedImageIndex(0);
    setImage(null);
    setImageFile(null);
    setPreviewUrl(null);
    setProcessedPreview(null);
    setImageBase64(null);
    setImageUrl(null);
    setIsProcessingImage(false);
    setBgRemovalStatus('idle');
    setAiStatusText('');
  }, []);

  // File picker handler (supports multi-select)
  const handleFileSelect = useCallback(async (e) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    e.target.value = '';

    for (const file of files) {
      await addImageToState(file);
    }
  }, [addImageToState]);

  const handleImageSelection = handleFileSelect;

  // ════════════════════════════════════════════
  // WEBRTC LIVE CAMERA STREAM & FRAME CAPTURE
  // ════════════════════════════════════════════

  const closeLiveCamera = useCallback(() => {
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => track.stop());
      } catch (err) {
        console.warn('Error stopping camera stream tracks:', err);
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraModalOpen(false);
    setIsCameraStarting(false);
    setCameraError(null);
  }, []);

  const openLiveCamera = useCallback(async (facing = cameraFacingMode) => {
    // Check if mediaDevices API is supported in this browser/environment
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('[Camera] getUserMedia not supported in this browser. Falling back to native capture input.');
      if (showToast) {
        showToast(language === 'hi' ? 'लाइव कैमरा उपलब्ध नहीं है। डिवाइस कैमरा खोला जा रहा है।' : 'Live camera unavailable. Opening device camera.');
      }
      cameraRef.current?.click();
      return;
    }

    // Stop existing stream if any
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((t) => t.stop());
      } catch (e) {
        console.warn('Error stopping previous stream:', e);
      }
      streamRef.current = null;
    }

    setIsCameraStarting(true);
    setCameraError(null);
    setIsCameraModalOpen(true);

    try {
      let stream = null;
      try {
        // High quality back camera ideal constraints
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 },
          },
          audio: false,
        });
      } catch (idealErr) {
        console.warn('[Camera] Ideal constraints failed, falling back to basic video constraint:', idealErr);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('muted', 'true');
        await videoRef.current.play().catch((playErr) => {
          console.warn('[Camera] video.play error:', playErr);
        });
      }
      setIsCameraStarting(false);
    } catch (err) {
      console.warn('[Camera] getUserMedia error:', err);
      setIsCameraStarting(false);
      let userFriendlyMsg = language === 'hi' 
        ? 'कैमरा अनुमति अस्वीकृत या उपलब्ध नहीं है।' 
        : 'Camera permission denied or camera not available.';

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        userFriendlyMsg = language === 'hi'
          ? 'कैमरा अनुमति अस्वीकृत। कृपया अनुमति दें या डिवाइस फ़ाइल चुनें।'
          : 'Camera permission was denied. Please allow access or select a file.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        userFriendlyMsg = language === 'hi'
          ? 'डिवाइस पर कोई कैमरा नहीं मिला।'
          : 'No camera found on this device.';
      }

      setCameraError(userFriendlyMsg);
      if (showToast) {
        showToast(userFriendlyMsg);
      }
      // Graceful fallback to native device camera
      setTimeout(() => {
        closeLiveCamera();
        cameraRef.current?.click();
      }, 900);
    }
  }, [cameraFacingMode, closeLiveCamera, language, showToast]);

  const toggleCameraFacingMode = useCallback(() => {
    const nextFacing = cameraFacingMode === 'environment' ? 'user' : 'environment';
    setCameraFacingMode(nextFacing);
    openLiveCamera(nextFacing);
  }, [cameraFacingMode, openLiveCamera]);

  const captureFrameFromVideo = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    if (width === 0 || height === 0) {
      console.warn('[Camera] Video frame dimensions not ready');
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, width, height);

      // Convert canvas to Blob
      const blob = await new Promise((resolve) => {
        canvas.toBlob(
          (b) => resolve(b),
          'image/jpeg',
          0.92
        );
      });

      if (!blob) {
        throw new Error('Canvas frame blob conversion failed');
      }

      // Add to multi-image state
      await addImageToState(blob);

      // Close live camera modal after capture
      closeLiveCamera();

      if (showToast) {
        showToast(
          language === 'hi'
            ? `कोण #${images.length + 1} सफलतापूर्वक कैप्चर किया गया!`
            : `Angle #${images.length + 1} captured successfully!`
        );
      }
    } catch (err) {
      console.error('[Camera] Frame capture error:', err);
      if (showToast) {
        showToast(language === 'hi' ? 'तस्वीर कैप्चर करने में त्रुटि।' : 'Failed to capture frame from camera.');
      }
    }
  }, [addImageToState, closeLiveCamera, images.length, language, showToast]);

  // ════════════════════════════════════════════
  // AUDIO RECORDING & FALLBACK
  // ════════════════════════════════════════════

  const startRecording = useCallback(async () => {
    // Immediately silence any active audio assistant speech before microphone turns on
    stop();
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('MediaDevices API not supported on this browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setRecordingDuration(0);
      setMicUnavailable(false);

      // Real-time audio level feedback via Web Audio API Analyser
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          analyserRef.current = analyser;
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateAudioLevel = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
            animFrameRef.current = requestAnimationFrame(updateAudioLevel);
          };
          updateAudioLevel();
        }
      } catch (audioErr) {
        console.warn('AudioContext analyser init:', audioErr);
      }

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);

        try {
          const base64String = await blobToBase64(blob);
          setAudioBase64(base64String);
        } catch (err) {
          console.error('Audio base64 conversion error:', err);
        }

        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {});
          audioContextRef.current = null;
        }
        setAudioLevel(0);
      };

      mediaRecorder.start(250);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone access unavailable or denied:', err);
      setMicUnavailable(true);
      const isDenied =
        err?.name === 'NotAllowedError' ||
        err?.name === 'PermissionDeniedError' ||
        String(err?.message || '').toLowerCase().includes('permission') ||
        String(err?.message || '').toLowerCase().includes('denied');

      if (showToast) {
        showToast('Microphone access denied. Using text fallback.');
      }
      setErrorMsg(
        isDenied
          ? (language === 'hi'
              ? 'माइक्रोफ़ोन अनुमति अस्वीकृत। कृपया नीचे दिए गए त्वरित विकल्पों में से चुनें या लिखें।'
              : 'Microphone access denied. Using text fallback.')
          : (language === 'hi'
              ? 'माइक्रोफ़ोन अनुपलब्ध है। कृपया नीचे दिए गए विकल्पों में से चुनें।'
              : 'Microphone unavailable. Using text fallback.')
      );
    }
  }, [language, showToast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      setAudioLevel(0);
    }
  }, []);

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);


  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ════════════════════════════════════════════
  // DISPATCH TO EDGE FUNCTION & REVIEW
  // ════════════════════════════════════════════

  const handleGenerateListing = useCallback(async () => {
    const hasImg = Boolean(image || imageFile || imageBase64 || imageUrl || processedPreview || previewUrl);
    const activeText = (transcript || customTranscript || audioTranscript || '').trim();
    const hasDesc = Boolean(activeText.length > 0 || Boolean(audioBase64) || Boolean(audioBlob) || Boolean(_audioBlob));

    // ── Strict Sequential Validation (Image & Description Dependency) ──
    // Scenario A: Voice/Text only, No Image
    if (!hasImg && hasDesc) {
      const msg = language === 'hi'
        ? 'कृपया पहले उत्पाद की फ़ोटो लें या अपलोड करें ताकि एआई शिल्प की गुणवत्ता और सामग्री का मूल्यांकन कर सके। (Please capture or upload a product image first so the AI can evaluate its craft quality and material.)'
        : 'Please capture or upload a product image first so the AI can evaluate its craft quality and material.';
      setErrorMsg(msg);
      if (showToast) showToast(msg);
      return;
    }

    // Scenario B: Image only, No Description/Voice
    if (hasImg && !hasDesc) {
      const msg = language === 'hi'
        ? 'कृपया अपने शिल्प का विवरण दें या एक वॉयस नोट रिकॉर्ड करें (सामग्री या अपेक्षित मूल्य बताएं) ताकि एआई सटीक मूल्य की गणना कर सके। (Please describe your craft or record a voice note (mentioning materials or expected price) so the AI can calculate accurate pricing.)'
        : 'Please describe your craft or record a voice note (mentioning materials or expected price) so the AI can calculate accurate pricing.';
      setErrorMsg(msg);
      if (showToast) showToast(msg);
      return;
    }

    // Neither input provided
    if (!hasImg && !hasDesc) {
      const msg = language === 'hi'
        ? 'कृपया पहले उत्पाद की फ़ोटो लें या अपलोड करें ताकि एआई शिल्प की गुणवत्ता और सामग्री का मूल्यांकन कर सके। (Please capture or upload a product image first so the AI can evaluate its craft quality and material.)'
        : 'Please capture or upload a product image first so the AI can evaluate its craft quality and material.';
      setErrorMsg(msg);
      if (showToast) showToast(msg);
      return;
    }

    // Gather all base64 representations from images state for multi-angle AI context
    const allImagesBase64 = [];
    for (const item of images) {
      if (item?.base64) {
        allImagesBase64.push(item.base64);
      } else if (item?.blob) {
        try {
          const b64 = await blobToBase64(item.blob);
          allImagesBase64.push(b64);
        } catch (e) {
          console.warn('[handleGenerateListing] Multi-image base64 error:', e);
        }
      }
    }

    let targetImageBase64 = allImagesBase64[0] || null;
    if (!targetImageBase64) {
      const currentImg = imageFile || image;
      if (currentImg) {
        try {
          targetImageBase64 = await blobToBase64(currentImg);
          allImagesBase64.push(targetImageBase64);
        } catch (err) {
          console.warn('[handleGenerateListing] Image base64 encoding error:', err);
        }
      }
    }
    if (!targetImageBase64 && imageBase64) {
      targetImageBase64 = imageBase64;
      if (!allImagesBase64.includes(imageBase64)) {
        allImagesBase64.push(imageBase64);
      }
    }

    // Dynamically grab newly recorded audio base64
    let targetAudioBase64 = null;
    const currentAudio = audioBlob || _audioBlob;
    if (currentAudio) {
      try {
        targetAudioBase64 = await blobToBase64(currentAudio);
      } catch (err) {
        console.warn('[handleGenerateListing] Audio base64 encoding error:', err);
      }
    }
    if (!targetAudioBase64 && audioBase64) {
      targetAudioBase64 = audioBase64;
    }

    let targetImageUrl = imageUrl || processedPreview || previewUrl;

    setAiStatus('transcribing');
    setAiStatusText(language === 'hi' ? 'आवाज़ और विवरण का विश्लेषण...' : 'Transcribing voice note...');
    setErrorMsg('');

    try {
      if (targetAudioBase64) {
        await new Promise((r) => setTimeout(r, 600));
      }
      setAiStatus('analyzing');
      setAiStatusText(language === 'hi' ? 'शिल्प विश्लेषण एवं GeM/ONDC उचित मूल्य गणना...' : 'Analyzing craft & calculating fair market price...');

      let listingData = null;

      try {
        // Ensure active Supabase Auth session so JWT is automatically attached
        const { data: sessionData } = await supabase.auth.getSession();
        let activeToken = sessionData?.session?.access_token;
        if (!activeToken) {
          const { data: anonData } = await supabase.auth.signInAnonymously();
          activeToken = anonData?.session?.access_token;
        }

        const imageBlob = images[0]?.blob || (image instanceof Blob ? image : null) || (imageFile instanceof Blob ? imageFile : null);
        console.log("Sending to Gemini:", { imageBlob, transcript: activeText || transcript });

        const { data, error } = await supabase.functions.invoke('process-artisan-craft', {
          body: {
            audioBase64: targetAudioBase64 || null,
            imageBase64: targetImageBase64,
            imagesBase64: allImagesBase64,
            images: allImagesBase64,
            customTranscript: activeText || null,
            language: transcriptionLang,
          },
          headers: activeToken ? { Authorization: `Bearer ${activeToken}` } : {},
        });

        if (!error && data && !data.error) {
          listingData = data;
          if (data.category || data.craft_category) {
            setCategory(data.category || data.craft_category);
          }
          if (data.hsn_code) {
            setHsnCode(data.hsn_code);
          }
        } else {
          const errDetail = error?.message || data?.error || '';
          const isAudioError = errDetail.toLowerCase().includes('whisper') ||
            errDetail.includes('500') ||
            errDetail.toLowerCase().includes('transcrib') ||
            errDetail.toLowerCase().includes('audio');
          console.warn('Edge Function returned non-2xx or error payload:', error || data?.error);
          if (isAudioError) {
            speakHindi('माफ करें, आवाज़ साफ नहीं आई। कृपया दोबारा बोलें।');
          }
          if (showToast) {
            showToast(
              language === 'hi'
                ? 'एआई सेवा सूचना: सुरक्षित स्थानीय कैटलॉग सक्रिय किया गया।'
                : 'AI Edge notice: Resilient local craft profile activated.'
            );
          }
        }
      } catch (invokeErr) {
        console.warn('Edge Function invocation caught error:', invokeErr);
        if (showToast) {
          showToast(
            language === 'hi'
              ? 'नेटवर्क विफलता: सुरक्षित कैटलॉग बैकअप का उपयोग किया जा रहा है।'
              : 'Network failure during AI invocation. Using fallback.'
          );
        }
      }

      // Dynamic local fallback if remote Edge Function is unreachable
      if (!listingData) {
        console.info('Using dynamic local AI craft profile fallback');
        const resolvedText = activeText;
        const spokenPriceMatch = resolvedText.match(/(?:₹|rs\.?|inr|rupees?|रुपये?|कीमत)\s*[:\-]?\s*(\d+)/i) || resolvedText.match(/(\d{2,6})/);
        const dynamicPrice = spokenPriceMatch ? Number(spokenPriceMatch[1]) : 450;
        const dynamicTitle = resolvedText
          ? `Handcrafted Craft (${resolvedText.slice(0, 30)}...)`
          : "Handcrafted Artisan Craft";

        listingData = {
          name: dynamicTitle,
          title: dynamicTitle,
          title_hi: resolvedText ? `हस्तनिर्मित शिल्प (${resolvedText.slice(0, 24)})` : "हस्तनिर्मित प्रामाणिक शिल्प",
          description: resolvedText
            ? `${resolvedText}. Exquisitely handcrafted using traditional heritage artisan techniques.`
            : "Exquisitely handcrafted artisan piece made with authentic traditional craftsmanship.",
          description_hi: resolvedText || "कुशल कारीगरों द्वारा पारंपरिक कला से तैयार किया गया प्रामाणिक हस्तशिल्प।",
          material: "Handicraft Materials",
          artisan_expected_price: dynamicPrice,
          price: dynamicPrice,
          bulk_price: Math.round(dynamicPrice * 0.72),
          suggested_retail_price_inr: dynamicPrice,
          suggested_wholesale_price_inr: Math.round(dynamicPrice * 0.72),
          estimated_price_inr: dynamicPrice,
          bulk_price_inr: Math.round(dynamicPrice * 0.72),
          pricing_reasoning: `Fair artisan wage factored with expected price of ₹${dynamicPrice} and volume discount for institutional orders.`,
          gem_category: "Handicrafts - Traditional Art & Decor",
          unspsc_code: "60121002",
          hsn_code: "69120010",
          moq: 20,
          is_gem_ready: true,
          craft_category: "Handicrafts",
          tags: ["Handmade", "Traditional", "GeM Ready", "ONDC", "Eco-friendly"],
        };
      }

      const resolvedName = listingData.name || listingData.title || (activeText ? `Handcrafted Item (${activeText.slice(0, 24)}...)` : 'Handcrafted Artisan Item');
      const resolvedPrice = Number(listingData.price || listingData.suggested_retail_price_inr || 450);
      setExtractedName(resolvedName);
      setExtractedPrice(resolvedPrice);

      setAiStatus('done');

      // Navigate to Review page with full AI profile and multi-angle images
      navigate('/review', {
        state: {
          ...listingData,
          name: resolvedName,
          title: resolvedName,
          price: resolvedPrice,
          imageUrl: targetImageUrl,
          imageBase64: targetImageBase64,
          images: allImagesBase64,
          imagesBase64: allImagesBase64,
        },
      });

      // Explicitly reset all relevant React states immediately after navigation to prevent cache bleed
      resetCaptureState();
    } catch (fatalErr) {
      console.error('Fatal generation error:', fatalErr);
      const errMsg = fatalErr?.message || 'Processing failed. Please try again.';
      const isAudioError = errMsg.toLowerCase().includes('whisper') ||
        errMsg.includes('500') ||
        errMsg.toLowerCase().includes('transcrib') ||
        errMsg.toLowerCase().includes('audio');
      if (isAudioError) {
        speakHindi('माफ करें, आवाज़ साफ नहीं आई। कृपया दोबारा बोलें।');
        // Do not display red error text for voice issues — audio prompt instructs artisan
        setErrorMsg('');
      } else {
        setErrorMsg(errMsg);
        if (showToast) {
          showToast(`❌ ${errMsg}`);
        }
      }
      setAiStatus('error');
    }
  }, [
    images,
    image,
    imageFile,
    imageBase64,
    imageUrl,
    processedPreview,
    previewUrl,
    audioBlob,
    audioBase64,
    _audioBlob,
    audioTranscript,
    customTranscript,
    transcriptionLang,
    language,
    navigate,
    showToast,
    resetCaptureState,
  ]);

  const activeImageObj = images[selectedImageIndex] || images[0];
  const displayImage = activeImageObj?.previewUrl || processedPreview || previewUrl;
  const isProcessing = aiStatus === 'transcribing' || aiStatus === 'analyzing';
  const isOptimizing = isProcessingImage || bgRemovalStatus === 'processing';
  const isLoading = isProcessing; // Do NOT block the user when image is optimizing (optimistic UI)

  return (
    <div className="w-full">
      <main className="flex-1 flex flex-col relative w-full min-h-screen bg-[#fdf9f3] overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-[#fdf9f3]/95 backdrop-blur-md border-b border-[#e8e2d9] w-full">
          <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div 
                onClick={() => navigate('/home')}
                className="flex items-center gap-2 cursor-pointer group"
                title="Go to Home"
              >
                <div className="w-8 h-8 rounded-lg bg-[#2e241e] text-[#ffdeaa] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                </div>
                <span className="font-bold text-sm text-[#180f0a] tracking-tight">Shilp Setu</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* Authenticated Artisan Badge */}
              {isVerified ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[11px] shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="hidden sm:inline">{t('nav.verified', 'Verified Artisan')}</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal()}
                  className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 text-[10px] sm:text-[11px] font-bold cursor-pointer transition-all active:scale-95 animate-pulse shadow-xs"
                >
                  <span className="material-symbols-outlined text-[13px] sm:text-[14px]">login</span>
                  <span>{t('nav.sign_in', 'Login')}</span>
                </button>
              )}

              {/* Audio Assistant Mute Toggle */}
              <AudioMuteButton className="h-8 sm:h-9" />

              {/* Language Toggle */}
              <LanguageToggle variant="light" className="h-8 sm:h-9" />

              {/* Notification Bell */}
              <button
                onClick={toggleNotifications}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#f1ede7] hover:bg-[#ebe8e2] border border-[#e8e2d9] flex items-center justify-center relative text-[#4e4540] cursor-pointer active:scale-95 transition-colors"
                title="Notifications"
                type="button"
              >
                <span className="material-symbols-outlined text-[17px] sm:text-[19px]">notifications</span>
                {unreadCount > 0 && (
                  <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#9c441c] absolute top-1 sm:top-1.5 right-1 sm:right-1.5 ring-2 ring-[#fdf9f3] animate-pulse"></span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Main Split-Screen Desktop Workspace */}
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col lg:flex-row gap-5 sm:gap-6 items-start">
          {/* ──────────────────────────────── LEFT: CAMERA & VIEWFINDER ──────────────────────────────── */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] bg-[#191312] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between p-3.5 sm:p-6 border border-[#2e241e]">
              {/* Background Display / Selected Craft */}
              {displayImage ? (
                <div className="absolute inset-0 flex items-center justify-center bg-[#191312]">
                  <img
                    src={displayImage}
                    alt={`Craft capture angle ${selectedImageIndex + 1}`}
                    className={`w-full h-full object-contain p-3 sm:p-5 transition-all duration-700 ${
                      (isOptimizing || isProcessing) ? 'blur-md scale-[0.97] opacity-80' : 'blur-none scale-100 opacity-100'
                    }`}
                  />
                  {/* Top Angle Indicator Badge */}
                  <div className="absolute top-3.5 left-3.5 sm:top-5 sm:left-5 z-20 flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-xs font-bold text-[#ffdeaa] flex items-center gap-1.5 shadow-lg">
                      <span className="material-symbols-outlined text-[15px] text-[#ff9062]">photo_camera</span>
                      <span>
                        {language === 'hi' 
                          ? `कोण #${selectedImageIndex + 1} (${images.length || 1} कुल)` 
                          : `Angle #${selectedImageIndex + 1} of ${images.length || 1}`}
                      </span>
                    </span>
                  </div>

                  {/* Viewfinder reticle with subtle edge-scan pulse animation */}
                  {!isOptimizing && !isProcessing && (
                    <div className="absolute inset-3 sm:inset-5 rounded-2xl border-2 border-[#ff9062]/80 shadow-[0_0_20px_rgba(255,144,98,0.4)] animate-pulse pointer-events-none z-10">
                      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                        <path d="M 0 14 L 0 0 L 14 0" fill="none" stroke="#ff9062" strokeLinecap="round" strokeWidth="3" />
                        <path d="M 86 0 L 100 0 L 100 14" fill="none" stroke="#ff9062" strokeLinecap="round" strokeWidth="3" />
                        <path d="M 0 86 L 0 100 L 14 100" fill="none" stroke="#ff9062" strokeLinecap="round" strokeWidth="3" />
                        <path d="M 86 100 L 100 100 L 100 86" fill="none" stroke="#ff9062" strokeLinecap="round" strokeWidth="3" />
                      </svg>
                    </div>
                  )}
                  {/* "AI is enhancing your image..." overlay — replaces all standard spinners */}
                  {(isOptimizing || isProcessing) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none bg-black/40 backdrop-blur-xs">
                      <div className="bg-[#191312]/90 backdrop-blur-md px-6 py-4 rounded-3xl border border-[#ff9062]/50 flex flex-col items-center gap-2.5 shadow-2xl">
                        <div className="flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-[24px] text-[#ff9062] animate-pulse">auto_awesome</span>
                          <span className="text-sm font-bold text-[#ffdeaa] tracking-wide">
                            {language === 'hi' ? 'एआई आपकी छवि को बेहतर बना रहा है...' : 'AI is enhancing your image...'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {[0, 1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className="w-1.5 rounded-full bg-[#ff9062]"
                              style={{
                                height: `${8 + (i % 3) * 6}px`,
                                animation: `pulse 0.8s ease-in-out ${i * 0.15}s infinite alternate`,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  onClick={() => {
                    if (!isLoading) openLiveCamera();
                  }}
                  className={`absolute inset-0 flex flex-col items-center justify-center ${
                    isLoading ? 'cursor-not-allowed opacity-75' : 'cursor-pointer group'
                  } bg-gradient-to-b from-[#201815] to-[#140d0a] hover:from-[#261d19] transition-all`}
                >
                  {/* Interactive targeting reticle */}
                  <div className="relative w-3/4 aspect-[4/3] max-w-md border border-white/10 rounded-2xl flex flex-col items-center justify-center p-6 text-center group-hover:border-[#ff9062]/50 transition-colors">
                    {/* SVG Corner Brackets */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                      <path d="M 0 16 L 0 0 L 16 0" fill="none" stroke="#ff9062" strokeLinecap="round" strokeWidth="3" />
                      <path d="M 84 0 L 100 0 L 100 16" fill="none" stroke="#ff9062" strokeLinecap="round" strokeWidth="3" />
                      <path d="M 0 84 L 0 100 L 16 100" fill="none" stroke="#ff9062" strokeLinecap="round" strokeWidth="3" />
                      <path d="M 84 100 L 100 100 L 100 84" fill="none" stroke="#ff9062" strokeLinecap="round" strokeWidth="3" />
                    </svg>

                    <div className="flex justify-center items-center gap-6 my-4 z-10">
                      <button 
                        type="button"
                        id="open-camera-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openLiveCamera();
                        }}
                        className="p-4 bg-orange-100 text-orange-600 rounded-full hover:bg-orange-200 transition-colors shadow-sm flex flex-col items-center gap-1 cursor-pointer active:scale-95"
                        title="Open Camera"
                      >
                        <Camera size={28}/>
                        <span className="text-xs font-medium">Camera</span>
                      </button>

                      <button 
                        type="button"
                        id="upload-gallery-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          galleryRef.current?.click();
                        }}
                        className="p-4 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors shadow-sm flex flex-col items-center gap-1 cursor-pointer active:scale-95"
                        title="Upload from Gallery"
                      >
                        <Upload size={28}/>
                        <span className="text-xs font-medium">Gallery</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Center Overlay Badges */}
              {displayImage && (
                <div className="relative z-20 my-auto flex flex-col items-center pointer-events-none">
                  {!isOptimizing && !isProcessing && bgRemovalStatus === 'done' && (
                    <div className="bg-emerald-950/90 text-emerald-300 px-4 py-1.5 rounded-full border border-emerald-500/40 text-xs font-bold shadow-lg flex items-center gap-2 backdrop-blur-md">
                      <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
                      <span>{language === 'hi' ? 'लाइफस्टाइल बैकग्राउंड तैयार' : 'Lifestyle Scene Ready'}</span>
                    </div>
                  )}
                  {!isOptimizing && !isProcessing && bgRemovalStatus === 'error' && (
                    <div className="bg-stone-900/90 text-stone-300 px-4 py-1.5 rounded-full border border-stone-600/40 text-xs font-medium shadow-lg flex items-center gap-2 backdrop-blur-md">
                      <span className="material-symbols-outlined text-[16px] text-amber-400">check</span>
                      <span>{language === 'hi' ? 'मूल तस्वीर सुरक्षित' : 'Original Photo Preserved'}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Retake / Clear Actions if photo captured */}
              {displayImage && (
                <div className="relative z-20 flex items-center justify-center gap-3">
                  <button
                    id="retake-photo-btn"
                    disabled={isProcessing}
                    onClick={() => {
                      if (!isProcessing) handleRetake();
                    }}
                    className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl border transition-all shadow-lg ${
                      isProcessing
                        ? 'text-red-300/40 bg-red-950/30 border-red-500/20 cursor-not-allowed'
                        : 'text-red-300 bg-red-950/80 hover:bg-red-900/80 border-red-500/40 cursor-pointer active:scale-95'
                    }`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">replay</span>
                    <span>{language === 'hi' ? 'सभी हटाएं' : 'Clear All'}</span>
                  </button>
                  <button
                    disabled={isProcessing}
                    onClick={() => {
                      if (!isProcessing) openLiveCamera();
                    }}
                    className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl border transition-all shadow-lg ${
                      isProcessing
                        ? 'text-orange-300/40 bg-orange-950/30 border-orange-500/20 cursor-not-allowed'
                        : 'text-[#ffdeaa] bg-[#ff9062]/20 hover:bg-[#ff9062]/30 border-[#ff9062]/50 cursor-pointer active:scale-95'
                    }`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_a_photo</span>
                    <span>{language === 'hi' ? 'नया कोण लें' : 'Take Another Angle'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* ── HORIZONTAL SCROLLABLE ROW OF CAPTURED IMAGE THUMBNAILS WITH PROMINENT "+" BUTTON ── */}
            {images.length > 0 && (
              <div className="bg-[#191312] p-3 sm:p-4 rounded-3xl border border-[#2e241e] shadow-xl flex flex-col gap-2.5">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#ff9062] text-[18px]">photo_library</span>
                    <span className="text-xs sm:text-sm font-bold text-[#ffdeaa]">
                      {language === 'hi'
                        ? `शिल्प के विभिन्न कोण (${images.length})`
                        : `Multi-Angle Craft Photos (${images.length})`}
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-400 font-medium">
                    {language === 'hi' ? 'बेहतर AI सटीकता हेतु विभिन्न कोण जोड़ें' : 'Add 2-4 angles for Gemini AI'}
                  </span>
                </div>

                {/* Horizontal scrollable row */}
                <div className="flex items-center gap-3 overflow-x-auto py-1.5 px-0.5 scrollbar-thin">
                  {images.map((img, idx) => (
                    <div
                      key={img.id || idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden cursor-pointer border-2 transition-all shrink-0 group ${
                        selectedImageIndex === idx
                          ? 'border-[#ff9062] ring-2 ring-[#ff9062]/50 scale-105 shadow-lg shadow-[#ff9062]/20'
                          : 'border-white/20 opacity-75 hover:opacity-100 hover:border-white/40'
                      }`}
                    >
                      <img
                        src={img.previewUrl}
                        alt={`Angle ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {/* Angle Badge */}
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-xs text-[10px] font-bold text-white">
                        #{idx + 1}
                      </span>
                      {/* Remove thumbnail button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(idx);
                        }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/85 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                        title={language === 'hi' ? 'तस्वीर हटाएं' : 'Remove this photo'}
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </div>
                  ))}

                  {/* PROMINENT "+" BUTTON FOR EXTRA ANGLES */}
                  <button
                    type="button"
                    id="add-angle-photo-btn"
                    onClick={() => openLiveCamera()}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-dashed border-[#ff9062] bg-[#ff9062]/10 hover:bg-[#ff9062]/20 text-[#ff9062] flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0 shadow-md group"
                    title={language === 'hi' ? 'अन्य कोण से तस्वीर लें' : 'Take another angle photo'}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#ff9062] text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                      <span className="material-symbols-outlined text-[20px] font-bold">add</span>
                    </div>
                    <span className="text-[11px] font-bold text-[#ffdeaa]">
                      {language === 'hi' ? '+ नया कोण' : '+ Add Angle'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Feature Helper Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#f1ede7] border border-[#e8e2d9]">
                <span className="material-symbols-outlined text-[20px] text-[#9c441c]">crop_free</span>
                <div>
                  <p className="text-[11px] font-bold text-[#180f0a]">
                    {language === 'hi' ? 'स्वचालित किनारा पहचान' : 'Macro Edge Focus'}
                  </p>
                  <p className="text-[10px] text-[#80756f]">
                    {language === 'hi' ? 'शिल्प की बारीक नक्काशी' : 'Captures intricate borders'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#f1ede7] border border-[#e8e2d9]">
                <span className="material-symbols-outlined text-[20px] text-[#9c441c]">palette</span>
                <div>
                  <p className="text-[11px] font-bold text-[#180f0a]">
                    {language === 'hi' ? 'एआई लाइफस्टाइल स्टूडियो' : 'AI Lifestyle Studio'}
                  </p>
                  <p className="text-[10px] text-[#80756f]">
                    {language === 'hi' ? 'मार्केट-रेडी जीवनशैली दृश्य' : 'Photoroom GenAI scene'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#f1ede7] border border-[#e8e2d9]">
                <span className="material-symbols-outlined text-[20px] text-[#9c441c]">verified</span>
                <div>
                  <p className="text-[11px] font-bold text-[#180f0a]">
                    {language === 'hi' ? '100% प्रामाणिक स्वदेशी' : 'Make In India'}
                  </p>
                  <p className="text-[10px] text-[#80756f]">
                    {language === 'hi' ? 'शिल्पकार सीधा बाज़ार' : 'Artisan direct linkage'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ──────────────────────────────── RIGHT: VOICE + DESCRIPTION + AI PIPELINE ──────────────────────────────── */}
          <div className="w-full lg:w-1/2 flex flex-col">
            <div className="bg-[#191312] text-[#fdf9f3] rounded-3xl p-6 sm:p-7 flex flex-col justify-between border border-[#2e241e] shadow-2xl h-full">
              <div className="flex flex-col">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff9062] animate-pulse" />
                    <h2 className="text-[16px] font-bold text-white tracking-tight">
                      {language === 'hi' ? 'शिल्प विवरण व वॉयस रिकॉर्ड' : 'Voice Note & Craft Details'}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsLangModalOpen(true)}
                    title={language === 'hi' ? 'बोलने की भाषा बदलें' : 'Select spoken dialect'}
                    aria-label={language === 'hi' ? 'बोलने की भाषा बदलें' : 'Select spoken dialect'}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2e241e] hover:bg-[#3d2b24] text-[11px] font-semibold text-[#ff9062] border border-[#ff9062]/30 hover:border-[#ff9062]/60 cursor-pointer hover:opacity-80 active:scale-95 transition-all shadow-xs"
                  >
                    <span>{getDialectBadgeText(transcriptionLang)}</span>
                    <span className="text-[10px] text-[#ff9062]/80 leading-none">▾</span>
                  </button>
                </div>

                {/* Audio Visualizer: CSS-animated waveform activates ONLY when recording */}
                <div className="w-full h-12 flex items-center justify-center my-3 overflow-hidden">
                  {isRecording ? (
                    <div className="flex items-center justify-center gap-1.5 px-4 animate-in fade-in duration-200">
                      {[12, 20, 32, 16, 26, 40, 34, 22, 38, 18, 28, 32, 14].map((baseH, i) => {
                        const dynamicHeight = Math.max(
                          8,
                          Math.min(46, (audioLevel / 100) * 40 + ((i * 7) % 20) + 8)
                        );
                        return (
                          <div
                            key={i}
                            className="w-1.5 rounded-full bg-gradient-to-t from-[#ff6b35] via-[#ff9062] to-[#ffdeaa] transition-all duration-75"
                            style={{
                              height: `${dynamicHeight}px`,
                              animation: `pulse 0.5s ease-in-out ${i * 0.05}s infinite alternate`,
                            }}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/50">
                      <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
                      <span>{language === 'hi' ? 'माइक तैयार • बोलने हेतु दबाएं' : 'Mic ready • tap to speak'}</span>
                    </div>
                  )}
                </div>

                {/* Clean, Mobile-Friendly Recording Helper Text Block */}
                <div className="bg-blue-50 text-blue-800 rounded-lg p-3 text-xs sm:text-sm text-center mb-4 shadow-sm border border-blue-200/60 leading-relaxed">
                  {language === 'hi' ? (
                    <>💡 <strong>सुझाव:</strong> माइक दबाएं और बताएं—यह क्या है, कैसे बना है, और आपकी अपेक्षित कीमत (₹) क्या है?</>
                  ) : (
                    <>💡 <strong>Hint:</strong> Tap the mic and tell us—what this is, how it's made, and your expected price (₹).</>
                  )}
                </div>

                {/* Microphone Button with visual feedback and pulsing ripple effect */}
                <div className="relative my-3 flex items-center justify-center">
                  {isRecording && (
                    <>
                      <div className="absolute w-36 h-36 rounded-full bg-red-500/20 animate-ping duration-1000" />
                      <div className="absolute w-28 h-28 rounded-full bg-red-500/30 animate-pulse" />
                      <div className="absolute w-24 h-24 rounded-full border-2 border-red-400/80 animate-ping" />
                    </>
                  )}
                  <button
                    id="record-mic-btn"
                    aria-label={language === 'hi' ? 'माइक दबाकर बोलें' : 'Record Voice Note'}
                    title={language === 'hi' ? 'माइक दबाकर बोलें' : 'Record Voice Note'}
                    disabled={isLoading}
                    onClick={() => {
                      if (!isLoading) toggleRecording();
                    }}
                    className={`relative z-10 w-20 h-20 rounded-full shadow-2xl flex items-center justify-center transform transition-all duration-200 focus:outline-none border-2 ${
                      isLoading
                        ? 'opacity-40 cursor-not-allowed border-stone-600 bg-stone-800 text-stone-500'
                        : isRecording
                        ? 'bg-red-600 border-red-400 text-white animate-pulse active:scale-95 cursor-pointer'
                        : audioBase64
                        ? 'bg-emerald-600 border-emerald-400 text-white active:scale-95 cursor-pointer'
                        : 'bg-[#9c441c] hover:bg-[#b04d20] border-[#ff9062]/40 text-white active:scale-95 cursor-pointer'
                    }`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[36px] text-white">
                      {isRecording ? 'stop' : audioBase64 ? 'check' : 'mic'}
                    </span>
                  </button>
                </div>

                {/* Recording Status / Timer */}
                <div className="text-center px-4 mt-2">
                  <h3 className="text-[16px] font-bold text-white mb-1">
                    {isRecording
                      ? (language === 'hi' ? `रिकॉर्डिंग चालू... ${formatDuration(recordingDuration)}` : `Recording... ${formatDuration(recordingDuration)}`)
                      : audioBase64
                      ? (language === 'hi' ? `वॉयस नोट सहेजा गया ✓ (${formatDuration(recordingDuration)})` : `Voice note recorded ✓ (${formatDuration(recordingDuration)})`)
                      : (language === 'hi' ? 'बोलकर शिल्प की विशेषताएं बताएं' : 'Tap mic and describe your craft naturally')}
                  </h3>
                  <p className="text-[12px] text-[#d4c3ba] leading-relaxed italic">
                    {isRecording
                      ? (language === 'hi' ? 'अपनी भाषा में बोलें (सामग्री, बनाने का समय, उचित मूल्य)...' : 'Speak naturally (materials, crafting time, expected price)...')
                      : (language === 'hi' ? '"हाथ से बनी टेराकोटा हांडी, स्थानीय मिट्टी से निर्मित, कीमत लगभग ₹450"' : '"Handmade terracotta clay pot, natural alluvial kiln-fired, price ₹450"')}
                  </p>
                </div>


                {/* ── Fallback Text & 1-Tap Craft Chips ── */}
                <div className="mt-5 pt-4 border-t border-white/10 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#ffdeaa] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
                      <span>{language === 'hi' ? 'त्वरित शिल्प विवरण चुनें' : 'Quick Craft Presets'}</span>
                    </span>
                    {micUnavailable && (
                      <span className="text-[10px] text-amber-300 font-semibold bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-500/30">
                        {language === 'hi' ? 'माइक अनुपलब्ध' : 'Mic blocked'}
                      </span>
                    )}
                  </div>

                  {/* 1-Tap Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {CRAFT_SUGGESTION_CHIPS.map((chip, idx) => {
                      const chipLabel = language === 'hi' ? chip.label_hi : chip.label_en;
                      const chipText = language === 'hi' ? chip.text_hi : chip.text_en;
                      const isSelected = (audioTranscript || customTranscript) === chip.text_hi || (audioTranscript || customTranscript) === chip.text_en;
                      return (
                        <button
                          key={idx}
                          disabled={isLoading}
                          onClick={() => {
                            if (!isLoading) {
                              setCustomTranscript(chipText);
                              setAudioTranscript(chipText);
                              setErrorMsg('');
                            }
                          }}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all text-left ${
                            isLoading
                              ? 'opacity-50 cursor-not-allowed border-white/5 bg-[#2e241e]'
                              : isSelected
                              ? 'bg-[#ff9062] text-[#180f0a] font-bold border-[#ff9062] cursor-pointer'
                              : 'bg-[#2e241e] text-[#d4c3ba] hover:text-white border-white/10 hover:border-white/20 cursor-pointer'
                          }`}
                          type="button"
                        >
                          {chipLabel}
                        </button>
                      );
                    })}
                  </div>

                  {/* Advanced: Type manually toggle (hidden by default) */}
                  <button
                    type="button"
                    onClick={() => setShowAdvancedText((v) => !v)}
                    disabled={isLoading}
                    className={`self-start inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-3 py-1 border transition-all cursor-pointer ${
                      isLoading
                        ? 'opacity-40 cursor-not-allowed border-white/10 text-white/30'
                        : showAdvancedText
                        ? 'bg-[#ff9062]/20 border-[#ff9062]/50 text-[#ff9062]'
                        : 'bg-transparent border-white/20 text-white/60 hover:text-white hover:border-white/40'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {showAdvancedText ? 'expand_less' : 'edit_note'}
                    </span>
                    <span>
                      {showAdvancedText
                        ? (language === 'hi' ? 'पाठ क्षेत्र बंद करें' : 'Hide text input')
                        : (language === 'hi' ? 'मैन्युअल रूप से टाइप करें (Advanced)' : 'Type manually (Advanced)')}
                    </span>
                  </button>

                  {/* Custom Description Text Input — hidden until toggle */}
                  {showAdvancedText && (
                    <textarea
                      rows={2}
                      value={audioTranscript || customTranscript}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomTranscript(val);
                        setAudioTranscript(val);
                        setErrorMsg('');
                      }}
                      placeholder={
                        language === 'hi'
                          ? 'शिल्प का विवरण यहाँ लिखें (सामग्री, आकार, निर्माण का समय)...'
                          : 'Type craft details (materials, dimensions, labor hours)...'
                      }
                      className="w-full mt-1 bg-[#2e241e] border border-white/15 rounded-xl p-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#ff9062] transition-colors resize-none animate-in fade-in duration-200"
                    />
                  )}
                </div>
              </div>

              {/* ── Generate Action Button & Indicator ── */}
              <div className="flex flex-col gap-3 mt-6 pt-2">
                {/* Error Message */}
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-900/40 border border-red-500/40 text-red-200 text-xs font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* AI Progress Indicator (without standard loading spinner) */}
                {isProcessing && (
                  <div className="p-3.5 rounded-xl bg-[#2e241e] border border-[#ff9062]/40 flex items-center gap-3 shadow-lg">
                    <span className="material-symbols-outlined text-[20px] text-[#ff9062] animate-pulse">auto_awesome</span>
                    <span className="text-xs font-semibold text-[#ffdeaa] tracking-wide">{aiStatusText}</span>
                  </div>
                )}

                {/* Primary Button */}
                <div
                  onClick={() => {
                    if (!isReadyToProcess && !isLoading) {
                      handleGenerateListing();
                    }
                  }}
                  className="w-full"
                >
                  <button
                    id="process-ai-btn"
                    aria-label="Process with AI"
                    disabled={isLoading || !isReadyToProcess}
                    onClick={() => {
                      if (!isLoading) handleGenerateListing();
                    }}
                    className={`w-full h-14 rounded-2xl font-bold text-base tracking-wide flex items-center justify-center gap-2 shadow-xl transition-all ${
                      isLoading || !isReadyToProcess
                        ? 'bg-[#ff9062]/40 text-[#180f0a]/50 cursor-not-allowed pointer-events-none'
                        : 'bg-[#ff9062] hover:bg-[#ff804a] text-[#180f0a] cursor-pointer active:scale-95'
                    }`}
                    type="button"
                  >
                    <span>
                      {isProcessing
                        ? (language === 'hi' ? 'कैटलॉग बन रहा है...' : 'Generating Listing...')
                        : (language === 'hi' ? 'एआई कैटलॉग बनाएं' : 'Process with AI')}
                    </span>
                    <span className="material-symbols-outlined text-[22px]">
                      {isLoading ? 'hourglass_top' : 'auto_awesome'}
                    </span>
                  </button>
                </div>

                {!isReadyToProcess && !isLoading && (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-[#d4c3ba]/70">
                    {!hasImage && !hasDescription ? (
                      <span>{language === 'hi' ? '• फ़ोटो और शिल्प विवरण दोनों आवश्यक हैं' : '• Both craft photo and description required'}</span>
                    ) : !hasImage ? (
                      <span className="text-[#ffb599] font-medium">{language === 'hi' ? '📷 कृपया जारी रखने के लिए उत्पाद की फ़ोटो लें' : '📷 Please capture product photo to proceed'}</span>
                    ) : (
                      <span className="text-[#ffb599] font-medium">{language === 'hi' ? '🎙️ कृपया शिल्प का विवरण या वॉयस नोट जोड़ें' : '🎙️ Please add craft description or voice note to proceed'}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      {/* WebRTC Live Camera Viewfinder Modal */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-6 animate-fadeIn">
          <div className="relative w-full max-w-xl bg-[#191312] border border-[#382b24] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-stone-900/90">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ff9062] text-[22px]">photo_camera</span>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {language === 'hi' 
                    ? `शिल्प कोण #${images.length + 1} कैप्चर करें` 
                    : `Capture Craft Angle #${images.length + 1}`}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleCameraFacingMode}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  title={language === 'hi' ? 'कैमरा बदलें' : 'Flip Camera'}
                >
                  <span className="material-symbols-outlined text-[18px]">flip_camera_ios</span>
                  <span className="hidden sm:inline text-[11px]">{cameraFacingMode === 'environment' ? 'Back' : 'Front'}</span>
                </button>
                <button
                  type="button"
                  onClick={closeLiveCamera}
                  className="p-2 rounded-xl bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400 text-xs font-medium transition-colors cursor-pointer"
                  title="Close camera"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            </div>

            {/* Video Viewfinder Area */}
            <div className="relative aspect-[4/3] sm:aspect-[16/11] bg-black flex items-center justify-center overflow-hidden">
              {isCameraStarting && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-20 bg-black/70">
                  <span className="material-symbols-outlined text-[36px] text-[#ff9062] animate-spin">progress_activity</span>
                  <span className="text-xs text-[#ffdeaa] font-medium">
                    {language === 'hi' ? 'कैमरा सक्रिय किया जा रहा है...' : 'Starting camera feed...'}
                  </span>
                </div>
              )}

              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center gap-3 z-20 bg-black/85">
                  <span className="material-symbols-outlined text-[36px] text-amber-400">videocam_off</span>
                  <p className="text-xs text-stone-200">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      closeLiveCamera();
                      cameraRef.current?.click();
                    }}
                    className="mt-2 px-4 py-2 rounded-xl bg-[#ff9062] text-white font-bold text-xs shadow-md active:scale-95 cursor-pointer"
                  >
                    {language === 'hi' ? 'डिवाइस कैमरा खोलें' : 'Open Device Camera'}
                  </button>
                </div>
              )}

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Reticle Overlay */}
              <div className="absolute inset-4 sm:inset-8 border border-white/20 rounded-2xl pointer-events-none flex flex-col justify-between p-4">
                <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <path d="M 0 14 L 0 0 L 14 0" fill="none" stroke="#ff9062" strokeLinecap="round" strokeWidth="3" />
                  <path d="M 86 0 L 100 0 L 100 14" fill="none" stroke="#ff9062" strokeLinecap="round" strokeWidth="3" />
                  <path d="M 0 86 L 0 100 L 14 100" fill="none" stroke="#ff9062" strokeLinecap="round" strokeWidth="3" />
                  <path d="M 86 100 L 100 100 L 100 86" fill="none" stroke="#ff9062" strokeLinecap="round" strokeWidth="3" />
                </svg>
              </div>
            </div>

            {/* Modal Controls / Shutter Bar */}
            <div className="p-4 sm:p-5 bg-stone-900 flex items-center justify-between border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  closeLiveCamera();
                  cameraRef.current?.click();
                }}
                className="text-stone-400 hover:text-white text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">file_upload</span>
                <span>{language === 'hi' ? 'नेटिव ऐप' : 'Native App'}</span>
              </button>

              {/* Shutter Button */}
              <button
                type="button"
                id="camera-shutter-btn"
                onClick={captureFrameFromVideo}
                disabled={isCameraStarting}
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border-4 border-white flex items-center justify-center p-1 cursor-pointer transition-all active:scale-90 hover:border-[#ff9062] group shadow-xl"
                title={language === 'hi' ? 'फोटो खींचें' : 'Take Photo'}
              >
                <div className="w-full h-full rounded-full bg-[#ff9062] group-hover:bg-[#ff7b44] group-active:scale-95 transition-all shadow-inner" />
              </button>

              <button
                type="button"
                onClick={() => {
                  closeLiveCamera();
                  galleryRef.current?.click();
                }}
                className="text-stone-400 hover:text-white text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">photo_library</span>
                <span>{language === 'hi' ? 'गैलरी' : 'Gallery'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regional Dialect Selector Modal */}
      <LanguageSelectorModal
        isOpen={isLangModalOpen}
        onClose={() => setIsLangModalOpen(false)}
        selectedLang={transcriptionLang}
        onSelectLang={(code) => setTranscriptionLang(code)}
        uiLanguage={language}
      />

      {/* Forces native camera app */}
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={cameraRef}
        onChange={handleImageSelection} 
        className="hidden" 
      />
      {/* Opens native gallery / file picker with multiple support */}
      <input 
        type="file" 
        accept="image/*" 
        multiple
        ref={galleryRef}
        onChange={handleImageSelection} 
        className="hidden" 
      />
      </main>
    </div>
  );
}
