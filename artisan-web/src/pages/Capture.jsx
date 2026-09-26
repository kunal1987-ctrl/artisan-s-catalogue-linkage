import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Camera, Mic as MicrophoneIcon, SquareIcon, TrashIcon } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { fal } from '@fal-ai/client';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from '../components/LanguageToggle';
import LanguageSelectorModal, { getDialectBadgeText } from '../components/LanguageSelectorModal';
import AudioMuteButton from '../components/AudioMuteButton';
import NotificationBar from '../components/NotificationBar';
import useAudioAssistant from '../hooks/useAudioAssistant';
import { validateImageLightweight, getLocalizedValidationReason } from '../utils/imageValidator';
import { enhanceAndCleanProductImage } from '../utils/imageEnhancer';

// Configure the fal.ai client using Vite environment variable
fal.config({
  credentials: import.meta.env.VITE_FAL_API_KEY,
  suppressLocalCredentialsWarning: true,
});

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
 * In-memory client-side compression function using an HTML5 Canvas.
 * Compresses camera captures and image files down to maxWidth (800px) with quality 0.6
 * returning a lightweight JPEG Data URL to harden uploads against network latency.
 */
const compressImage = (fileOrDataUrl, maxWidth = 800, quality = 0.6) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(maxWidth / img.width, 1);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2d context unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = (err) => reject(err);
    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => (img.src = e.target.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
};

const MAX_IMAGES = 3;

const dataUrlToBlob = (dataUrl) => {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

/**
 * Sanitizes Gemini API response text with strict regex extraction before JSON parsing.
 * Strips markdown code fences (```json ... ``` or ``` ... ```) and falls back to
 * extracting the first valid JSON object substring.
 */
const parseGeminiResponse = (rawText) => {
  if (typeof rawText !== 'string') {
    if (typeof rawText === 'object' && rawText !== null) return rawText;
    throw new Error('Invalid raw response text');
  }

  // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
  const cleanedText = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(cleanedText);
  } catch (parseError) {
    // Fallback: extract the first valid JSON object substring
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error(`Failed to parse structured catalog response: ${parseError.message}`);
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
  const { t: tI18n, i18n } = useTranslation();
  const { currentLang, t: tLang } = useLanguage();
  const t = (key, fallback) => tLang(key, tI18n(key, fallback));
  const {
    user,
    artisanProfile,
    openAuthModal,
    showToast,
    language,
    notifications = [],
    markAllNotificationsRead,
    toggleNotifications,
    unreadCount,
  } = useAuth();
  const { playInstruction, stopInstruction } = useAudioAssistant();
  const isVerified = Boolean(artisanProfile?.verified || user?.is_phone_verified);

  // State to control the notification dropdown
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef(null);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    }
    if (isNotificationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationOpen]);

  // ── Camera Input Ref ──
  const cameraRef = useRef(null);

  // ── Multi-Image State & Dependencies ──
  const [images, setImages] = useState([]); // Array of { id, blob, file, previewUrl, base64 }
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showOriginal, setShowOriginal] = useState(false);

  // Single-image backward compatibility aliases & explicit upload states
  const [image, setImage] = useState(null);
  const [imageBlob, setImageBlob] = useState(null);
  const [base64String, setBase64String] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [processedPreview, setProcessedPreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [bgRemovalStatus, setBgRemovalStatus] = useState('idle'); // idle | processing | done | error

  // ── WebRTC Live Camera Viewfinder State & Refs ──
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState('environment'); // 'environment' | 'user'
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);

  // Object URL tracking to prevent memory leaks
  const previewUrlRef = useRef(null);
  const processedPreviewRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      if (processedPreviewRef.current && processedPreviewRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(processedPreviewRef.current);
      }
      if (cameraStreamRef.current) {
        try {
          cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        } catch (e) {
          console.warn('Error stopping tracks on unmount:', e);
        }
      }
    };
  }, []);

  // Upload Guard: If !supabase.auth.getUser(), redirect immediately to login
  useEffect(() => {
    async function verifyAuth() {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user || data.user.is_anonymous) {
          navigate('/login', { state: { from: '/capture' }, replace: true });
        }
      } catch {
        navigate('/login', { state: { from: '/capture' }, replace: true });
      }
    }
    verifyAuth();
  }, [navigate]);

  // ── Audio / Description State ──
  const [recordings, setRecordings] = useState([]); // Array of { id, text, audioUrl }
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribingVoice, setIsTranscribingVoice] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioBase64, setAudioBase64] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [_audioBlob, setLegacyAudioBlob] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [micUnavailable, setMicUnavailable] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioTranscript, setAudioTranscript] = useState(null);
  const [customTranscript, setCustomTranscript] = useState('');
  const [category, setCategory] = useState(null);
  const [hsnCode, setHsnCode] = useState(null);
  const [extractedPrice, setExtractedPrice] = useState(null);
  const [extractedName, setExtractedName] = useState('');
  const [showAdvancedText, setShowAdvancedText] = useState(false);

  // Refs to maintain stream references without triggering re-renders
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const mimeTypeRef = useRef('');
  const currentTranscriptRef = useRef('');
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  // ── AbortController Ref & Single Active Submit Lock ──
  const generateAbortControllerRef = useRef(null);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (generateAbortControllerRef.current) {
        generateAbortControllerRef.current.abort('Component unmounted');
      }
    };
  }, []);

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
    setImageBlob(null);
    setBase64String(null);
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
    if (cameraStreamRef.current) {
      try {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch (e) {
        console.warn('Error stopping camera stream on reset:', e);
      }
      cameraStreamRef.current = null;
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
    currentTranscriptRef.current = '';
    setRecordingDuration(0);
    setTranscript('');
    setRecordings((prev) => {
      prev.forEach((r) => {
        if (r.audioUrl) {
          try { URL.revokeObjectURL(r.audioUrl); } catch (_) {}
        }
      });
      return [];
    });
    setAudioTranscript(null);
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
  }, []);

  // State Cleanup: Explicitly reset imageBlob, base64String, and audioTranscript to null on mount
  useEffect(() => {
    setImageBlob(null);
    setBase64String(null);
    setAudioTranscript(null);
    resetCaptureState();
  }, [resetCaptureState]);

  // ── Regional Dialect / Voice Transcription State ──
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [transcriptionLang, setTranscriptionLang] = useState('hi');

  const langMap = {
    hi: 'hi-IN',
    'hi-IN': 'hi-IN',
    en: 'en-IN',
    'en-IN': 'en-IN',
    mr: 'mr-IN',
    'mr-IN': 'mr-IN',
    bn: 'bn-IN',
    'bn-IN': 'bn-IN',
    ta: 'ta-IN',
    'ta-IN': 'ta-IN',
    te: 'te-IN',
    'te-IN': 'te-IN',
    gu: 'gu-IN',
    'gu-IN': 'gu-IN',
    kn: 'kn-IN',
    'kn-IN': 'kn-IN',
    ml: 'ml-IN',
    'ml-IN': 'ml-IN',
    pa: 'pa-IN',
    'pa-IN': 'pa-IN',
    or: 'or-IN',
    'or-IN': 'or-IN',
    as: 'as-IN',
    'as-IN': 'as-IN',
    ur: 'ur-IN',
    'ur-IN': 'ur-IN',
  };
  const activeLangCode = transcriptionLang || language || i18n?.language || 'en';
  const selectedLanguage = langMap[activeLangCode] || activeLangCode || 'en-IN';

  const deleteRecording = useCallback((idToRemove) => {
    setRecordings((prev) => {
      const target = prev.find((rec) => rec.id === idToRemove);
      if (target?.audioUrl) {
        try { URL.revokeObjectURL(target.audioUrl); } catch (_) {}
      }
      const updated = prev.filter((rec) => rec.id !== idToRemove);
      const remainingText = updated.map((r) => r.text).filter(Boolean).join(' ');
      setTranscript(remainingText);
      currentTranscriptRef.current = remainingText;
      return updated;
    });
  }, []);

  // Derive the full description for the database/Gemini by joining all valid text blocks
  const fullDescription = recordings.map((rec) => rec.text).filter(Boolean).join(' ');

  // ── AI Processing State ──
  const [aiStatus, setAiStatus] = useState('idle'); // idle | transcribing | analyzing | done | error
  const [aiStatusText, setAiStatusText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // ── Multi-Modal State Dependency Flags ──
  const hasImage = Boolean(images.length > 0 || image || imageFile || imageBase64 || imageUrl || processedPreview || previewUrl);
  const textDescription = (fullDescription || transcript || customTranscript || audioTranscript || '').trim();
  const hasDescription = Boolean(textDescription.length > 0 || recordings.length > 0 || Boolean(audioBase64) || Boolean(audioBlob) || Boolean(_audioBlob));
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

  // ════════════════════════════════════════════
  // BATCH & ASYNC LIFESTYLE ENHANCEMENT
  // ════════════════════════════════════════════

  const triggerBatchEnhancement = useCallback(async (candidateImages) => {
    const targets = candidateImages || images;
    if (!targets || targets.length === 0) return;

    setIsProcessingImage(true);
    setBgRemovalStatus('processing');
    setAiStatusText(
      language === 'hi'
        ? `Fal.ai सभी ${targets.length} कोणों की पृष्ठभूमि समायोजित कर संवार रहा है...`
        : `Fal.ai adjusting background & enhancing all ${targets.length} captured angles...`
    );

    // Mark pending items as enhancing
    setImages((prev) =>
      prev.map((img) => (img.status === 'ready' && img.enhancedUrl ? img : { ...img, status: 'enhancing' }))
    );

    for (let i = 0; i < targets.length; i++) {
      const item = targets[i];
      if (item.status === 'ready' && item.enhancedUrl) continue;

      try {
        setAiStatusText(
          language === 'hi'
            ? `कोण #${i + 1} का Fal.ai पृष्ठभूमि समायोजन एवं प्रकाश संवर्धन...`
            : `Fal.ai studio lighting & background adjustment for angle #${i + 1}...`
        );

        const inputSource = item.file || item.blob || item.base64 || item.previewUrl;
        const result = await enhanceAndCleanProductImage(inputSource, (statusMsg) => {
          setAiStatusText(statusMsg);
        });

        if (result?.enhancedUrl) {
          const newBlob = result.blob || (result.enhancedUrl ? dataUrlToBlob(result.enhancedUrl) : item.blob);
          const newBase64 = result.base64 || (result.enhancedUrl ? result.enhancedUrl.split(',')[1] : item.base64);

          setImages((prev) =>
            prev.map((img) =>
              img.id === item.id
                ? {
                    ...img,
                    status: 'ready',
                    originalUrl: img.originalUrl || img.previewUrl,
                    enhancedUrl: result.enhancedUrl,
                    previewUrl: result.enhancedUrl,
                    blob: newBlob,
                    base64: newBase64,
                    isFalAi: Boolean(result.isFalAi),
                    method: result.method,
                  }
                : img
            )
          );

          if (i === 0 || selectedImageIndex === i) {
            setImageUrl(result.enhancedUrl);
            setProcessedPreview(result.enhancedUrl);
            setImageBlob(newBlob);
            setImageBase64(newBase64);
            setBase64String(newBase64);
            setPreviewUrl(result.enhancedUrl);
          }
        }
      } catch (err) {
        console.warn(`[Capture] Angle #${i + 1} enhancement fallback:`, err);
        setImages((prev) =>
          prev.map((img) =>
            img.id === item.id
              ? {
                  ...img,
                  status: 'ready',
                  enhancedUrl: img.previewUrl,
                }
              : img
          )
        );
      }
    }

    setBgRemovalStatus('done');
    setIsProcessingImage(false);
    setAiStatusText(
      language === 'hi' ? 'सभी कोण तैयार ✓ (Fal.ai द्वारा उन्नत)' : 'All angles ready ✓ (Enhanced by Fal.ai)'
    );
    if (showToast) {
      showToast(
        language === 'hi'
          ? '✨ सभी कोणों का Fal.ai स्टूडियो संवर्धन संपन्न!'
          : '✨ Fal.ai studio enhancement complete for all angles!'
      );
    }
  }, [images, language, selectedImageIndex, showToast]);

  const triggerLifestyleEnhancement = triggerBatchEnhancement;

  // ════════════════════════════════════════════
  // MULTI-IMAGE STATE MANAGEMENT
  // ════════════════════════════════════════════

  const addImageToState = useCallback(async (fileOrBlob) => {
    if (!fileOrBlob) return null;
    if (images.length >= MAX_IMAGES) {
      if (showToast) {
        showToast(
          language === 'hi'
            ? 'अधिकतम 3 कोण ही कैप्चर किए जा सकते हैं।'
            : 'Maximum 3 angles allowed. Remove an angle to retake.'
        );
      }
      return null;
    }

    const id = `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Compress image to 800px max width at 0.6 quality via in-memory HTML5 Canvas
    let workingBlob = fileOrBlob;
    let base64String = '';
    let localUrl = '';

    try {
      const dataUrl = await compressImage(fileOrBlob, 800, 0.6);
      workingBlob = dataUrlToBlob(dataUrl);
      base64String = dataUrl.split(',')[1] || '';
      localUrl = dataUrl;
    } catch (optErr) {
      console.warn('[Capture] Canvas image compression error, using raw fallback:', optErr);
      localUrl = fileOrBlob instanceof Blob ? URL.createObjectURL(fileOrBlob) : String(fileOrBlob);
      try {
        base64String = await blobToBase64(fileOrBlob);
      } catch (e) {
        console.warn('[Capture] Photo base64 encoding error:', e);
      }
    }

    const newImageItem = {
      id,
      blob: workingBlob,
      file: fileOrBlob instanceof File ? fileOrBlob : null,
      previewUrl: localUrl,
      originalUrl: localUrl,
      base64: base64String,
      originalBase64: base64String,
      status: 'pending', // pending, enhancing, ready
      enhancedUrl: null,
      isFalAi: false,
    };

    setImages((prev) => {
      if (prev.length >= MAX_IMAGES) return prev;
      const isFirst = prev.length === 0;
      const updated = [...prev, newImageItem];
      setSelectedImageIndex(updated.length - 1);

      if (isFirst) {
        setImage(workingBlob);
        setImageBlob(workingBlob);
        setImageFile(fileOrBlob instanceof File ? fileOrBlob : null);
        setPreviewUrl(localUrl);
        setImageBase64(base64String);
        setBase64String(base64String);
      }

      // Auto-trigger Fal.ai enhancement pipeline immediately upon capture without requiring manual click
      setTimeout(() => {
        triggerBatchEnhancement(updated);
      }, 50);

      // Prompt for additional angles if under max
      if (updated.length < MAX_IMAGES) {
        setTimeout(() => {
          playInstruction('multiple_photo_instruction');
        }, 1200);
      }

      return updated;
    });

    return newImageItem;
  }, [images.length, language, showToast, triggerBatchEnhancement]);

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

  // ── Native Rear Camera Photo Capture Handler (capture="environment") ──
  // Fast Micro-Canvas Check: Laplacian Variance (<5ms on 128x128 matrix)
  const handlePhotoCapture = useCallback(async (e) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    e.target.value = '';

    const validation = await validateImageLightweight(file);
    if (!validation.valid) {
      const msg = getLocalizedValidationReason(validation.reason, language);
      if (showToast) showToast(`⚠️ ${msg}`);
      if (language === 'hi') {
        speakHindi(msg);
      }
      return;
    }

    await addImageToState(file);
  }, [addImageToState, language, showToast]);

  const handleImageSelection = handlePhotoCapture;

  // ════════════════════════════════════════════
  // WEBRTC LIVE CAMERA STREAM & FRAME CAPTURE
  // ════════════════════════════════════════════

  const closeLiveCamera = useCallback(() => {
    if (cameraStreamRef.current) {
      try {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch (err) {
        console.warn('Error stopping camera stream tracks:', err);
      }
      cameraStreamRef.current = null;
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
    if (cameraStreamRef.current) {
      try {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      } catch (e) {
        console.warn('Error stopping previous stream:', e);
      }
      cameraStreamRef.current = null;
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

      cameraStreamRef.current = stream;
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

      // Fast micro-canvas validation check (<5ms)
      const validation = await validateImageLightweight(blob);
      if (!validation.valid) {
        const msg = getLocalizedValidationReason(validation.reason, language);
        if (showToast) showToast(`⚠️ ${msg}`);
        if (language === 'hi') {
          speakHindi(msg);
        }
        return;
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

  // ════════════════════════════════════════════
  // RESILIENT MULTI-AUDIO GROQ & EDGE TRANSCRIBE PIPELINE
  // ════════════════════════════════════════════

  const processWithGroq = useCallback(async (audioBlob, audioUrl, recId) => {
    try {
      setIsTranscribingVoice(true);
      let transcribedText = '';

      // 1. Try Supabase Edge Function 'transcribe-audio' (uses server-side GROQ_API_KEY with zero CORS/client key exposure)
      try {
        const formData = new FormData();
        const fileExtension = (mimeTypeRef.current && mimeTypeRef.current.includes('webm')) ? 'webm' : 'm4a';
        formData.append('file', audioBlob, `audio.${fileExtension}`);
        formData.append('language', i18n.language === 'hi' || transcriptionLang === 'hi' ? 'hi' : 'en');

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jrkrdlalnqswvwabktce.supabase.co';
        const edgeRes = await fetch(`${supabaseUrl}/functions/v1/transcribe-audio`, {
          method: 'POST',
          body: formData,
        });

        if (edgeRes.ok) {
          const edgeData = await edgeRes.json();
          if (edgeData?.text && typeof edgeData.text === 'string' && edgeData.text.trim()) {
            transcribedText = edgeData.text.trim();
          }
        }
      } catch (edgeErr) {
        console.warn('[Capture] Edge transcribe-audio error:', edgeErr);
      }

      // 2. Direct Groq fallback if client key exists and edge didn't return text
      if (!transcribedText) {
        const groqKey = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.GROQ_API_KEY;
        if (groqKey) {
          try {
            const formData = new FormData();
            const fileExtension = (mimeTypeRef.current && mimeTypeRef.current.includes('webm')) ? 'webm' : 'm4a';
            formData.append('file', audioBlob, `audio.${fileExtension}`);
            formData.append('model', 'whisper-large-v3');
            formData.append('language', i18n.language === 'hi' || transcriptionLang === 'hi' ? 'hi' : 'en');

            const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
              method: 'POST',
              headers: { Authorization: `Bearer ${groqKey}` },
              body: formData,
            });
            if (groqRes.ok) {
              const groqData = await groqRes.json();
              if (groqData?.text) {
                transcribedText = groqData.text.trim();
              }
            }
          } catch (groqErr) {
            console.warn('[Capture] Direct Groq API error:', groqErr);
          }
        }
      }

      // 3. Update the specific recording and cumulative transcript
      if (transcribedText) {
        setRecordings((prev) =>
          prev.map((r) => (r.id === recId ? { ...r, text: transcribedText, status: 'ready' } : r))
        );
        setTranscript((prev) => (prev ? `${prev} ${transcribedText}` : transcribedText));
        currentTranscriptRef.current += (currentTranscriptRef.current ? ' ' : '') + transcribedText;
        if (showToast) {
          showToast(language === 'hi' ? '🎙️ आवाज़ का विवरण सफलतापूर्वक जोड़ा गया' : '🎙️ Voice note transcribed successfully!');
        }
      } else {
        // Voice note is safely preserved for listing processing
        const defaultLabel = language === 'hi'
          ? 'वॉयस नोट सहेजा गया (कैटलॉग निर्माण के समय विश्लेषित होगा)'
          : 'Voice note saved (analyzed during listing creation)';
        setRecordings((prev) =>
          prev.map((r) => (r.id === recId ? { ...r, text: defaultLabel, status: 'recorded' } : r))
        );
        if (showToast) {
          showToast(language === 'hi' ? '🎙️ वॉयस नोट सहेजा गया' : '🎙️ Voice note recorded and saved!');
        }
      }
    } catch (error) {
      console.error('[Capture] Audio processing error:', error);
      setRecordings((prev) =>
        prev.map((r) => (r.id === recId ? { ...r, text: 'Voice note saved', status: 'recorded' } : r))
      );
    } finally {
      setIsTranscribingVoice(false);
    }
  }, [i18n.language, transcriptionLang, language, showToast]);

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      // STOP RECORDING
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    // START RECORDING
    try {
      stopInstruction(); // Silence audio assistant speech before microphone turns on
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setMicUnavailable(false);

      // Support dynamic MIME detection for iOS Safari vs Android (audio/webm vs audio/mp4)
      let recorderOptions = {};
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported('audio/webm')) {
        recorderOptions = { mimeType: 'audio/webm' };
        mimeTypeRef.current = 'audio/webm';
      } else if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported('audio/mp4')) {
        recorderOptions = { mimeType: 'audio/mp4' };
        mimeTypeRef.current = 'audio/mp4';
      } else {
        mimeTypeRef.current = '';
      }

      const mediaRecorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setRecordingDuration(0);

      // Audio level analyser for waveform feedback
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
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            const avg = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
            animFrameRef.current = requestAnimationFrame(updateAudioLevel);
          };
          updateAudioLevel();
        }
      } catch (audioErr) {
        console.warn('AudioContext analyser init:', audioErr);
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {});
          audioContextRef.current = null;
        }
        setAudioLevel(0);

        // Turn off mic stream tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
        playInstruction('recording_stopped');

        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeTypeRef.current || 'audio/mp4',
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);

        const recId = Date.now();
        // Immediately preserve audio in recordings list so it is NEVER lost
        const newRecord = {
          id: recId,
          audioUrl,
          audioBlob,
          base64: null,
          text: '',
          status: 'transcribing',
        };
        setRecordings((prev) => [...prev, newRecord]);

        blobToBase64(audioBlob)
          .then((b64) => {
            setAudioBase64(b64);
            setRecordings((prev) =>
              prev.map((r) => (r.id === recId ? { ...r, base64: b64 } : r))
            );
          })
          .catch(() => {});

        await processWithGroq(audioBlob, audioUrl, recId);
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      playInstruction('recording_started');

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Mic access denied:', error);
      alert(language === 'hi'
        ? 'कृपया माइक्रोफ़ोन अनुमति दें।'
        : 'Please allow microphone access to describe your product.');
    }
  }, [isRecording, stop, processWithGroq, language]);

  const startRecording = toggleRecording;
  const stopRecording = toggleRecording;

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ════════════════════════════════════════════
  // DISPATCH TO EDGE FUNCTION & REVIEW
  // ════════════════════════════════════════════

  const handleGenerateListing = useCallback(async () => {
    // Single Active Request Guard & isLoading guard (prevent double submit clicks)
    if (isLoading || isSubmittingRef.current || aiStatus === 'analyzing' || aiStatus === 'transcribing') {
      console.warn('[handleGenerateListing] Catalog request already in progress. Ignoring duplicate click.');
      return;
    }

    const hasImg = Boolean(image || imageFile || imageBase64 || imageUrl || processedPreview || previewUrl);
    const activeText = (fullDescription || transcript || customTranscript || audioTranscript || '').trim();
    const hasDesc = Boolean(activeText.length > 0 || recordings.length > 0 || Boolean(audioBase64) || Boolean(audioBlob) || Boolean(_audioBlob));

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

    // Race Condition Prevention: Abort any previous pending request in flight
    if (generateAbortControllerRef.current) {
      console.info('[handleGenerateListing] Aborting previous in-flight AI request...');
      generateAbortControllerRef.current.abort('New catalog request started');
    }

    const abortController = new AbortController();
    generateAbortControllerRef.current = abortController;
    isSubmittingRef.current = true;

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

    // Dynamically grab all recorded audio base64s for multi-audio support
    const allAudiosBase64 = [];
    for (const rec of recordings) {
      if (rec.base64) {
        allAudiosBase64.push(rec.base64);
      } else if (rec.audioBlob) {
        try {
          const b64 = await blobToBase64(rec.audioBlob);
          allAudiosBase64.push(b64);
        } catch (err) {
          console.warn('[handleGenerateListing] Audio base64 encoding error:', err);
        }
      }
    }
    let targetAudioBase64 = allAudiosBase64[0] || audioBase64 || null;
    if (!targetAudioBase64) {
      const currentAudio = audioBlob || _audioBlob;
      if (currentAudio) {
        try {
          targetAudioBase64 = await blobToBase64(currentAudio);
          if (!allAudiosBase64.includes(targetAudioBase64)) {
            allAudiosBase64.push(targetAudioBase64);
          }
        } catch (err) {
          console.warn('[handleGenerateListing] Audio base64 encoding error:', err);
        }
      }
    }

    let targetImageUrl = imageUrl || processedPreview || previewUrl;

    setAiStatus('transcribing');
    setAiStatusText(language === 'hi' ? 'आवाज़ और विवरण का विश्लेषण...' : 'Transcribing voice note...');
    setErrorMsg('');
    playInstruction('processing_instruction');

    try {
      setIsLoading(true);
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
        console.log("Sending to Gemini:", { imageBlob, transcript: activeText || transcript, audiosCount: allAudiosBase64.length });

        // Network Latency & Timeout Protection (15-second max timeout)
        const timeoutMs = 15000;
        const timeoutPromise = new Promise((_, reject) => {
          const timer = setTimeout(() => reject(new Error('REQUEST_TIMEOUT')), timeoutMs);

          if (abortController.signal.aborted) {
            clearTimeout(timer);
          } else {
            abortController.signal.addEventListener('abort', () => clearTimeout(timer));
          }
        });

        const invokePromise = supabase.functions.invoke('process-artisan-craft', {
          body: {
            audioBase64: targetAudioBase64 || null,
            audiosBase64: allAudiosBase64,
            imageBase64: targetImageBase64,
            imagesBase64: allImagesBase64,
            images: allImagesBase64,
            customTranscript: activeText || null,
            language: transcriptionLang,
          },
          headers: activeToken ? { Authorization: `Bearer ${activeToken}` } : {},
        });

        const responseRes = await Promise.race([invokePromise, timeoutPromise]);
        const data = responseRes?.data;
        const error = responseRes?.error;

        if (!error && data && !data.error) {
          try {
            const parsedData = parseGeminiResponse(data);

            // ── Step 3: Anti-Tamper & Authenticity Guardrail Check ──
            const isStudioOrEnhanced = parsedData?.rejection_reason && (
              parsedData.rejection_reason.toLowerCase().includes('background') ||
              parsedData.rejection_reason.toLowerCase().includes('studio') ||
              parsedData.rejection_reason.toLowerCase().includes('white') ||
              parsedData.rejection_reason.toLowerCase().includes('gradient')
            );

            if (parsedData && (parsedData.is_authentic_photo === false || parsedData.is_valid === false) && !isStudioOrEnhanced && parsedData.rejection_reason) {
              const reason = parsedData.rejection_reason;
              console.warn('[Capture] Rejected by authenticity guardrail:', reason);
              if (showToast) showToast(`🚫 ${reason}`);
              if (language === 'hi') {
                speakHindi(reason);
              }
              alert(`Image Verification Failed / सत्यापन विफल:\n\n${reason}\n\nकृपया वास्तविक हस्तशिल्प की फोटो अपलोड करें।`);

              // Clear the image state completely
              setImages([]);
              setImage(null);
              setImageBlob(null);
              setImageFile(null);
              setPreviewUrl(null);
              setProcessedPreview(null);
              setImageBase64(null);
              setImageUrl(null);
              setSelectedImageIndex(0);
              if (cameraRef.current) cameraRef.current.value = '';

              setIsGeneratingListing(false);
              return;
            }

            listingData = parsedData;
            if (parsedData.category || parsedData.craft_category) {
              setCategory(parsedData.category || parsedData.craft_category);
            }
            if (parsedData.hsn_code) {
              setHsnCode(parsedData.hsn_code);
            }
          } catch (parseError) {
            console.warn('[Capture] parseGeminiResponse error:', parseError.message);
            speakHindi('प्रतिक्रिया प्रारूप में समस्या। सुरक्षित कैटलॉग लोड किया गया।');
            if (showToast) {
              showToast(
                language === 'hi'
                  ? 'एआई प्रतिक्रिया पार्स करने में त्रुटि: सुरक्षित कैटलॉग सक्रिय किया गया।'
                  : `AI Response Format Alert: ${parseError.message}`
              );
            }
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
        console.warn('Edge Function invocation caught error or timed out:', invokeErr);
        if (invokeErr?.message === 'REQUEST_TIMEOUT') {
          alert('Network is taking longer than usual. Please try again.');
        } else {
          alert('Could not generate listing automatically. Please verify your photo and speech.');
        }
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
        const spokenPriceMatch = resolvedText ? (resolvedText.match(/(?:₹|rs\.?|inr|rupees?|रुपये?|कीमत|मूल्य)\s*[:\-]?\s*(\d+)/i) || resolvedText.match(/(\d{2,6})/)) : null;
        const dynamicPrice = spokenPriceMatch ? Number(spokenPriceMatch[1]) : 450;
        const pricingMethod = spokenPriceMatch ? 'spoken' : 'smart_appraisal';
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
          pricing_method: pricingMethod,
          bulk_price: Math.round(dynamicPrice * 0.72),
          suggested_retail_price_inr: dynamicPrice,
          suggested_wholesale_price_inr: Math.round(dynamicPrice * 0.72),
          estimated_price_inr: dynamicPrice,
          bulk_price_inr: Math.round(dynamicPrice * 0.72),
          pricing_reasoning: pricingMethod === 'smart_appraisal'
            ? 'Market price estimated based on visual craftsmanship, material, and standard fair-trade rates.'
            : `Price extracted from artisan voice input (₹${dynamicPrice}).`,
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
      const resolvedPricingMethod = listingData.pricing_method || (activeText ? 'spoken' : 'smart_appraisal');
      setExtractedName(resolvedName);
      setExtractedPrice(resolvedPrice);

      setAiStatus('done');
      playInstruction('product_generated');

      // Navigate to Review page with full AI profile and multi-angle images
      navigate('/review', {
        state: {
          ...listingData,
          name: resolvedName,
          title: resolvedName,
          price: resolvedPrice,
          pricing_method: resolvedPricingMethod,
          pricingMethod: resolvedPricingMethod,
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
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
      if (generateAbortControllerRef.current === abortController) {
        generateAbortControllerRef.current = null;
      }
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
  const displayImage = showOriginal
    ? (activeImageObj?.originalUrl || activeImageObj?.previewUrl || previewUrl)
    : (activeImageObj?.previewUrl || processedPreview || previewUrl);
  const isProcessing = aiStatus === 'transcribing' || aiStatus === 'analyzing' || isLoading || isTranscribingVoice;
  const isOptimizing = isProcessingImage || bgRemovalStatus === 'processing';

  return (
    <div className="w-full">
      <main className="flex-1 flex flex-col relative w-full min-h-screen bg-[#fdf9f3] overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-[#fdf9f3]/95 backdrop-blur-md border-b border-[#e8e2d9] w-full">
          <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Link 
                className="flex items-center gap-2 group transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-lg p-1 shrink-0" 
                to="/"
              >
                <img 
                  src="/shilp-setu-logo.png" 
                  alt="Shilp Setu - Artisan Product Studio" 
                  className="h-9 sm:h-11 w-auto object-contain drop-shadow-sm group-hover:drop-shadow-md transition-all duration-300"
                  loading="eager"
                />
                {/* Screen-reader only text since the logo contains the typography */}
                <span className="sr-only">Shilp Setu Dashboard</span>
              </Link>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">


              {!isVerified && (
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

              {/* Notification Bell with Dropdown Toggle */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setIsNotificationOpen((prev) => !prev)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#f1ede7] hover:bg-[#ebe8e2] border border-[#e8e2d9] flex items-center justify-center relative text-[#4e4540] cursor-pointer active:scale-95 transition-colors"
                  title="Notifications"
                  aria-label="Notifications"
                  aria-expanded={isNotificationOpen}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[17px] sm:text-[19px]">notifications</span>
                  {unreadCount > 0 && (
                    <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#9c441c] absolute top-1 sm:top-1.5 right-1 sm:right-1.5 ring-2 ring-[#fdf9f3] animate-pulse"></span>
                  )}
                </button>

                {/* Dropdown Panel */}
                {isNotificationOpen && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-xl border border-stone-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="p-3 border-b border-stone-100 bg-stone-50 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-800 text-sm">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.2 bg-[#ff9062] text-[#180f0a] rounded-full text-[10px] font-bold">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setIsNotificationOpen(false)}
                        className="text-stone-400 hover:text-stone-600 cursor-pointer"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>

                    <div className="p-3 max-h-60 overflow-y-auto space-y-2">
                      {notifications.length === 0 ? (
                        <p className="text-sm text-stone-500 text-center py-3">No new notifications right now.</p>
                      ) : (
                        notifications.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => {
                              if (item.link) {
                                navigate(item.link);
                                setIsNotificationOpen(false);
                              }
                            }}
                            className={`p-2.5 rounded-lg border text-left cursor-pointer transition ${
                              !item.read
                                ? 'bg-[#fffaf7] border-[#ff9062]/40'
                                : 'bg-white border-stone-100 opacity-80'
                            }`}
                          >
                            <p className="text-xs font-bold text-stone-800 leading-tight">
                              {language === 'hi' ? item.title_hi : item.title}
                            </p>
                            <p className="text-[11px] text-stone-600 mt-1 line-clamp-2">
                              {language === 'hi' ? item.message_hi : item.message}
                            </p>
                            <span className="text-[10px] text-stone-400 mt-1 block">{item.time}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
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
                  {/* Top Angle Indicator Badge & Interactive Compare Button */}
                  <div className="absolute top-3.5 left-3.5 sm:top-5 sm:left-5 z-20 flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-xs font-bold text-[#ffdeaa] flex items-center gap-1.5 shadow-lg">
                      <span className="material-symbols-outlined text-[15px] text-[#ff9062]">photo_camera</span>
                      <span>
                        {language === 'hi' 
                          ? `कोण #${selectedImageIndex + 1} (${images.length || 1} कुल)` 
                          : `Angle #${selectedImageIndex + 1} of ${images.length || 1}`}
                      </span>
                    </span>

                    {/* Interactive Before/After Compare Button */}
                    {activeImageObj?.enhancedUrl && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowOriginal((prev) => !prev);
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all cursor-pointer backdrop-blur-md border pointer-events-auto ${
                          showOriginal
                            ? 'bg-amber-600 text-white border-amber-400 ring-2 ring-amber-400/50 scale-105'
                            : 'bg-black/80 text-emerald-300 border-emerald-500/50 hover:bg-black/95'
                        }`}
                        title={showOriginal ? 'उन्नत फोटो देखें' : 'मूल फोटो से तुलना करें'}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {showOriginal ? 'auto_awesome' : 'compare'}
                        </span>
                        <span>
                          {showOriginal
                            ? (language === 'hi' ? '✨ उन्नत देखें' : '✨ Enhanced')
                            : (language === 'hi' ? '👁️ मूल देखें' : '👁️ Compare')}
                        </span>
                      </button>
                    )}
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

                    <div className="flex flex-col items-center justify-center my-4 z-10">
                      <div className="relative flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full bg-[#ff9062]/30 animate-ping pointer-events-none" />
                        <button 
                          type="button"
                          id="open-camera-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            openLiveCamera();
                          }}
                          className="relative z-10 p-5 bg-[#ff9062] text-white rounded-full hover:bg-[#ff7b44] hover:scale-105 active:scale-95 transition-transform duration-200 shadow-lg flex flex-col items-center justify-center gap-1 cursor-pointer"
                          title={t('take_photo')}
                        >
                          <Camera size={32}/>
                        </button>
                      </div>
                      <span className="text-xs font-semibold text-white/90 mt-2 tracking-wide">
                        {t('take_photo')}
                      </span>
                      <span className="text-[10px] text-stone-400 mt-0.5">
                        {language === 'hi' ? 'सत्यापन के लिए केवल लाइव फोटो मान्य' : 'Live photo verification required'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Center Overlay Badges */}
              {displayImage && (
                <div className="relative z-20 my-auto flex flex-col items-center pointer-events-none">
                  {!isOptimizing && !isProcessing && bgRemovalStatus === 'done' && (
                    <div className={`px-4 py-1.5 rounded-full border text-xs font-bold shadow-lg flex items-center gap-2 backdrop-blur-md transition-all ${
                      showOriginal
                        ? 'bg-amber-950/90 text-amber-300 border-amber-500/50'
                        : 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
                    }`}>
                      <span className="material-symbols-outlined text-[16px] text-amber-400">
                        {showOriginal ? 'visibility' : 'auto_awesome'}
                      </span>
                      <span>
                        {showOriginal
                          ? (language === 'hi' ? 'मूल फोटो (असंपादित)' : 'Original Camera Photo (Unedited)')
                          : (activeImageObj?.isFalAi
                              ? (language === 'hi' ? 'Fal.ai द्वारा उन्नत छवि • स्टूडियो बैकग्राउंड' : 'Enhanced by Fal.ai • Studio Lighting Ready')
                              : (language === 'hi' ? 'प्रो स्टूडियो उन्नत • प्रकाश एवं रंग निखारा गया' : 'Pro Studio Enhanced • Vibrance & Lighting Ready')
                            )}
                      </span>
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

              {/* Retake / Clear / Re-enhance Actions if photo captured */}
              {displayImage && (
                <div className="relative z-20 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
                  <button
                    id="retake-photo-btn"
                    disabled={isProcessing || isOptimizing}
                    onClick={() => {
                      if (!isProcessing && !isOptimizing) handleRetake();
                    }}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl border transition-all shadow-lg ${
                      isProcessing || isOptimizing
                        ? 'text-red-300/40 bg-red-950/30 border-red-500/20 cursor-not-allowed'
                        : 'text-red-300 bg-red-950/80 hover:bg-red-900/80 border-red-500/40 cursor-pointer active:scale-95'
                    }`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">replay</span>
                    <span>{language === 'hi' ? 'सभी हटाएं' : 'Clear All'}</span>
                  </button>

                  <button
                    id="enhance-bg-clean-btn"
                    disabled={isProcessing || isOptimizing}
                    onClick={() => triggerBatchEnhancement(images)}
                    className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl border transition-all shadow-lg ${
                      isProcessing || isOptimizing
                        ? 'text-amber-200/40 bg-amber-950/30 border-amber-500/20 cursor-not-allowed'
                        : 'text-amber-200 bg-gradient-to-r from-amber-700/90 to-amber-600/90 hover:from-amber-600 hover:to-amber-500 border-amber-400/50 cursor-pointer active:scale-95'
                    }`}
                    type="button"
                    title={language === 'hi' ? 'Fal.ai द्वारा बैकग्राउंड समायोजित करें एवं प्रकाश संवारें' : 'Adjust background & enhance lighting with Fal.ai'}
                  >
                    <span className="material-symbols-outlined text-[16px] text-amber-300">auto_awesome</span>
                    <span>{language === 'hi' ? 'Fal.ai द्वारा संवारें' : 'Fal.ai Studio Enhance'}</span>
                  </button>

                  <button
                    disabled={isProcessing || isOptimizing}
                    onClick={() => {
                      if (!isProcessing && !isOptimizing) openLiveCamera();
                    }}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl border transition-all shadow-lg ${
                      isProcessing || isOptimizing
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
                        ? `शिल्प के विभिन्न कोण (${images.length} / ${MAX_IMAGES})`
                        : `Multi-Angle Craft Photos (${images.length} / ${MAX_IMAGES})`}
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-400 font-medium">
                    {images.length >= MAX_IMAGES 
                      ? (language === 'hi' ? '✓ अधिकतम 3 कोण कैप्चर' : '✓ Max 3 angles captured')
                      : (language === 'hi' ? 'अधिकतम 3 कोणों से बेहतर AI सटीकता' : 'Up to 3 angles for Gemini AI')}
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
                      {/* Angle Badge & Status Indicator */}
                      <div className="absolute bottom-1 left-1 flex items-center gap-1">
                        <span className="px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-xs text-[10px] font-bold text-white">
                          #{idx + 1}
                        </span>
                        {img.status === 'ready' && (
                          <span className="px-1 py-0.5 rounded-md bg-emerald-600/90 text-white text-[9px] font-bold shadow">
                            Ready
                          </span>
                        )}
                        {img.status === 'enhancing' && (
                          <span className="px-1 py-0.5 rounded-md bg-amber-500/90 text-black text-[9px] font-bold animate-pulse shadow">
                            AI...
                          </span>
                        )}
                      </div>
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

                  {/* PROMINENT "+" BUTTON FOR EXTRA ANGLES (Only if < MAX_IMAGES) */}
                  {images.length < MAX_IMAGES && (
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
                  )}
                </div>

                {/* Batch Action Bar */}
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  {images.some((img) => img.status === 'pending') && (
                    <button
                      type="button"
                      onClick={() => triggerBatchEnhancement(images)}
                      disabled={isProcessingImage}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[15px]">auto_fix_high</span>
                      <span>{language === 'hi' ? '✨ सभी कोण संवारें (Enhance)' : '✨ AI Enhance All Angles'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate('/studio')}
                    className="text-stone-400 hover:text-[#ff9062] text-[11px] font-medium flex items-center gap-1 ml-auto"
                  >
                    <span>{language === 'hi' ? 'एआई स्टूडियो मोड' : 'Open Multi-Angle Studio'}</span>
                    <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ──────────────────────────────── RIGHT: VOICE + DESCRIPTION + AI PIPELINE ──────────────────────────────── */}
          <div className="w-full lg:w-1/2 flex flex-col">
            <div className="bg-[#191312] text-[#fdf9f3] rounded-3xl p-6 sm:p-7 flex flex-col justify-between border border-[#2e241e] shadow-2xl h-full">
              <div className="flex flex-col">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff9062] animate-pulse" />
                    <h2 className="text-[16px] font-bold text-white tracking-tight">
                      {t('record_voice')}
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

                <div className="flex flex-col w-full max-w-md mx-auto space-y-4 p-4">
                  
                  {/* Cumulative Description Display Box */}
                  <div className="w-full min-h-[5rem] p-4 bg-amber-50/40 border border-amber-200/60 rounded-2xl shadow-sm">
                    {recordings.some((r) => r.status === 'transcribing') ? (
                      <p className="text-amber-500 font-medium animate-pulse text-sm">
                        {language === 'hi' ? 'एआई आवाज़ का अनुवाद कर रहा है...' : 'AI is transcribing voice note...'}
                      </p>
                    ) : recordings.length > 0 ? (
                      <div className="space-y-2">
                        {recordings.map((rec, idx) => (
                          <div key={rec.id} className="text-sm font-medium text-stone-800">
                            {recordings.length > 1 && (
                              <span className="text-xs font-bold text-amber-600 mr-1.5">[{idx + 1}]</span>
                            )}
                            <span>{rec.text || (language === 'hi' ? 'वॉयस नोट सहेजा गया' : 'Voice note recorded')}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-stone-400 italic">
                        {t('capture.placeholder', `Product description in ${i18n.language === 'hi' || transcriptionLang === 'hi' ? 'Hindi' : 'English'} will appear here...`)}
                      </p>
                    )}
                  </div>

                  {/* Microphone Control */}
                  <div className="flex flex-col items-center justify-center py-2 gap-2">
                    <button 
                      type="button"
                      onClick={toggleRecording}
                      disabled={isTranscribingVoice}
                      className={`relative p-5 rounded-full transition-all duration-300 focus:outline-none disabled:opacity-50 ${
                        isRecording 
                          ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse scale-110' 
                          : 'bg-[#FFF9E6] text-amber-700 border border-amber-200 hover:bg-amber-100 hover:scale-105 shadow-md'
                      }`}
                    >
                      {/* Ripple rings behind button when recording */}
                      {isRecording && (
                        <span className="absolute inset-0 rounded-full bg-red-400 opacity-75 animate-ping pointer-events-none"></span>
                      )}
                      {isRecording ? <SquareIcon className="w-7 h-7 fill-current relative z-10"/> : <MicrophoneIcon className="w-7 h-7 relative z-10"/>}
                    </button>
                    {isRecording ? (
                      <p className="text-center text-xs text-red-500 font-bold animate-pulse">
                        {language === 'hi' ? `ऑडियो #${recordings.length + 1} रिकॉर्ड हो रहा है... रोकने हेतु दबाएं` : `Recording audio #${recordings.length + 1}... tap to stop`}
                      </p>
                    ) : (
                      <p className="text-center text-xs text-stone-400">
                        {recordings.length > 0 
                          ? (language === 'hi' ? '+ और वॉयस नोट जोड़ने के लिए दबाएं' : '+ Tap to add another voice note')
                          : (language === 'hi' ? 'बोलने के लिए माइक दबाएं' : 'Tap mic to speak')}
                      </p>
                    )}
                  </div>

                  {/* Audio Playback & Deletion List */}
                  {recordings.length > 0 && (
                    <div className="flex flex-col gap-2.5 mt-2">
                      <div className="flex items-center justify-between pb-1 border-b border-white/10">
                        <h4 className="text-xs font-bold text-[#ffdeaa] uppercase tracking-wider flex items-center gap-1.5">
                          <span>🎙️ {language === 'hi' ? 'वॉयस नोट्स' : 'Voice Notes'}</span>
                          <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-extrabold">
                            {recordings.length}
                          </span>
                        </h4>
                        <span className="text-[10px] text-white/50">
                          {language === 'hi' ? 'सभी नोट्स AI को भेजे जाएंगे' : 'All notes processed by AI'}
                        </span>
                      </div>
                      {recordings.map((rec, index) => (
                        <div key={rec.id} className="flex items-center gap-2 p-2 bg-[#201815] border border-white/10 rounded-xl shadow-xs">
                          <span className="text-xs font-bold text-amber-400 w-6 text-center shrink-0">#{index + 1}</span>
                          <audio controls src={rec.audioUrl} className="h-8 w-full max-w-[190px] sm:max-w-full" />
                          {rec.status === 'transcribing' && (
                            <span className="text-[10px] text-amber-400 animate-pulse shrink-0">⏳</span>
                          )}
                          <button 
                            type="button"
                            onClick={() => deleteRecording(rec.id)}
                            className="p-1.5 text-stone-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-auto cursor-pointer shrink-0"
                            title={language === 'hi' ? 'हटाएं' : 'Delete'}
                          >
                            <TrashIcon className="w-4 h-4"/>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
                    disabled={isLoading || isProcessing || !isReadyToProcess}
                    onClick={() => {
                      if (!isLoading && !isProcessing) handleGenerateListing();
                    }}
                    className={`w-full h-14 rounded-2xl font-bold text-base tracking-wide flex items-center justify-center gap-2 shadow-xl transition-all duration-300 ${
                      isLoading || isProcessing || !isReadyToProcess
                        ? 'bg-[#ff9062]/40 text-[#180f0a]/50 cursor-not-allowed pointer-events-none'
                        : 'bg-[#ff9062] hover:bg-[#ff804a] text-[#180f0a] cursor-pointer shadow-lg shadow-orange-500/40 animate-pulse hover:scale-105 hover:-translate-y-1 active:scale-95'
                    }`}
                    type="button"
                  >
                    <span>
                      {isLoading || isProcessing
                        ? (language === 'hi' ? 'एआई शिल्प विश्लेषण जारी है...' : 'Analyzing craft with AI...')
                        : (language === 'hi' ? 'एआई कैटलॉग बनाएं' : 'Process with AI')}
                    </span>
                    {isLoading || isProcessing ? (
                      <div className="w-5 h-5 border-2 border-[#180f0a] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
                    )}
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
                title={language === 'hi' ? 'कैमरा ऐप खोलें' : 'Open Device Camera'}
              >
                <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                <span>{language === 'hi' ? 'कैमरा ऐप' : 'Camera App'}</span>
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

              {/* Layout spacer to keep shutter button centered */}
              <div className="w-16 sm:w-20" aria-hidden="true" />
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

      {/* Restrict file input directly to the rear camera */}
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={cameraRef}
        onChange={handlePhotoCapture} 
        className="hidden" 
      />
      {/* Global Notification Drawer & Toast Bar */}
      <NotificationBar />
      </main>
    </div>
  );
}
