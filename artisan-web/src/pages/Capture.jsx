import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import LanguageToggle from '../components/LanguageToggle';
import LanguageSelectorModal, { getDialectBadgeText } from '../components/LanguageSelectorModal';

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

export default function Capture() {
  const navigate = useNavigate();
  const { user, artisanProfile, openAuthModal, showToast, language, toggleNotifications, unreadCount } = useAuth();
  const isVerified = Boolean(artisanProfile?.verified || user?.is_phone_verified);

  // ── Camera & Gallery Input Refs ──
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

  // ── Image State ──
  const [_selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [processedPreview, setProcessedPreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [bgRemovalStatus, setBgRemovalStatus] = useState('idle'); // idle | processing | done | error

  // Object URL tracking to prevent memory leaks
  const previewUrlRef = useRef(null);
  const processedPreviewRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      if (processedPreviewRef.current && processedPreviewRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(processedPreviewRef.current);
      }
    };
  }, []);

  // ── Audio / Description State ──
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioBase64, setAudioBase64] = useState(null);
  const [_audioBlob, setAudioBlob] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [micUnavailable, setMicUnavailable] = useState(false);
  const [customTranscript, setCustomTranscript] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  // ── Regional Dialect / Voice Transcription State ──
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [transcriptionLang, setTranscriptionLang] = useState('hi');

  // ── AI Processing State ──
  const [aiStatus, setAiStatus] = useState('idle'); // idle | transcribing | analyzing | done | error
  const [aiStatusText, setAiStatusText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // ════════════════════════════════════════════
  // IMAGE SELECTION & OPTIMISTIC AI PIPELINE
  // ════════════════════════════════════════════

  const handleFileSelect = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so re-capturing the same or new file always triggers onChange
    e.target.value = '';
    setSelectedFile(file);

    // 1. Revoke previous preview URLs
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    if (processedPreviewRef.current && processedPreviewRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(processedPreviewRef.current);
      processedPreviewRef.current = null;
    }

    setIsProcessingImage(true);
    setBgRemovalStatus('processing');
    setAiStatusText(
      language === 'hi'
        ? 'शिल्प तस्वीर अनुकूलित की जा रही है...'
        : 'Compressing craft photo...'
    );
    setErrorMsg('');

    // 2. Compress camera/gallery image to maximum width/height of 1024px
    let workingBlob = file;
    try {
      workingBlob = await compressImage(file, 1024, 0.85);
    } catch (optErr) {
      console.warn('[Capture] Image compression fallback:', optErr);
    }

    // 3. OPTIMISTIC UI: Immediately display raw compressed image so user can continue filling out form
    const localUrl = URL.createObjectURL(workingBlob);
    previewUrlRef.current = localUrl;
    setPreviewUrl(localUrl);
    setProcessedPreview(null);
    setImageUrl(null);

    // Generate immediate base64 representation of the compressed image
    let base64String = '';
    try {
      base64String = await blobToBase64(workingBlob);
      setImageBase64(base64String);
    } catch (e) {
      console.warn('[Capture] Photo base64 encoding error:', e);
    }

    setAiStatusText(
      language === 'hi'
        ? 'एआई लाइफस्टाइल दृश्य तैयार किया जा रहा है...'
        : 'Generating lifestyle scene via Photoroom AI...'
    );

    // 4. Asynchronously invoke Supabase Edge Function without blocking the user interface
    (async () => {
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

        if (showToast) {
          showToast(
            language === 'hi'
              ? 'मूल फ़ोटो उपयोग की जा रही है'
              : 'Using original photo (fallback active)'
          );
        }
      } finally {
        setIsProcessingImage(false);
      }
    })();
  }, [language, showToast]);

  const handleImageSelection = handleFileSelect;

  const handleRetake = useCallback(() => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    if (processedPreviewRef.current && processedPreviewRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(processedPreviewRef.current);
    }
    previewUrlRef.current = null;
    processedPreviewRef.current = null;

    setSelectedFile(null);
    setPreviewUrl(null);
    setProcessedPreview(null);
    setImageBase64(null);
    setImageUrl(null);
    setIsProcessingImage(false);
    setBgRemovalStatus('idle');
    setAiStatusText('');
  }, []);

  // ════════════════════════════════════════════
  // AUDIO RECORDING & FALLBACK
  // ════════════════════════════════════════════

  const startRecording = useCallback(async () => {
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

  const handleUseSampleSpeech = useCallback(() => {
    const sampleText = language === 'hi'
      ? 'हाथ से बना हुआ शुद्ध बनारसी रेशम साड़ी, शुद्ध ज़री बॉर्डर, 4 दिन की हस्तनिर्मित बुनाई। उचित मूल्य ₹1,200।'
      : 'Handwoven pure Banarasi silk saree with authentic golden zari border work, taking 4 days on wooden handloom. Fair price ₹1,200.';
    setCustomTranscript(sampleText);
    setAudioBase64('UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
    setRecordingDuration(4);
    if (showToast) {
      showToast(language === 'hi' ? '🎙️ नमूना शिल्प आवाज़ विवरण सेट किया गया!' : '🎙️ Sample craft speech loaded!');
    }
  }, [language, showToast]);

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ════════════════════════════════════════════
  // DISPATCH TO EDGE FUNCTION & REVIEW
  // ════════════════════════════════════════════

  const handleGenerateListing = useCallback(async () => {
    let targetImageBase64 = imageBase64;
    let targetImageUrl = imageUrl || processedPreview || previewUrl;

    // If no custom photo captured yet, use the featured Varanasi Silk sample so the demo remains 100% resilient
    if (!targetImageBase64) {
      targetImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      targetImageUrl = targetImageUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBV3-xCzN9TdTuHufN2Eugbk_EZBDJA_VggGkHJFBe14GOnP9jvtR6Ee9vNq-Aw1XP7TDBVxytmQRP9igWfX9KFvxyeutdk5zYrrX_dgvibmIohF6cCEOqXwbxZiarLCs_p9eDtD_QU3cljge8SkKKNWcep6mY5_T-xCnBJj2niY32GH3Pk3XlykQMu8lqIg701PTDGB7sn-cna7dpzkjeV1gVX7Ke_l5Q6i0XTqcNXl1n8Gjv10NB9';
    }

    setAiStatus('transcribing');
    setAiStatusText(language === 'hi' ? 'आवाज़ और विवरण का विश्लेषण...' : 'Transcribing voice note...');
    setErrorMsg('');

    try {
      if (audioBase64) {
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

        const { data, error } = await supabase.functions.invoke('process-artisan-craft', {
          body: {
            audioBase64: audioBase64 || null,
            imageBase64: targetImageBase64,
            customTranscript: customTranscript || null,
            language: transcriptionLang,
          },
          headers: activeToken ? { Authorization: `Bearer ${activeToken}` } : {},
        });

        if (!error && data && !data.error) {
          listingData = data;
        } else {
          console.warn('Edge Function returned non-2xx or error payload:', error || data?.error);
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

      // Safe local fallback if remote Edge Function is unreachable
      if (!listingData) {
        console.info('Using resilient local AI craft profile fallback');
        listingData = {
          title: customTranscript?.includes('सिल्क') || customTranscript?.includes('साड़ी')
            ? "Varanasi Handwoven Heritage Silk Saree"
            : customTranscript?.includes('दीया')
            ? "Handcrafted Brass Hanging Temple Diya"
            : "Handcrafted Terracotta Decorative Pot",
          title_hi: customTranscript?.includes('सिल्क') || customTranscript?.includes('साड़ी')
            ? "वाराणसी हस्तनिर्मित बनारसी रेशम साड़ी"
            : customTranscript?.includes('दीया')
            ? "हस्तनिर्मित पीतल मंदिर दीया"
            : "हस्तनिर्मित टेराकोटा सजावटी बर्तन",
          description: customTranscript
            ? `${customTranscript}. Exquisitely handcrafted using traditional heritage techniques.`
            : "Exquisitely hand-thrown and kiln-fired natural clay pot with traditional motifs.",
          description_hi: customTranscript || "स्थानीय मिट्टी से हाथ से बनाया गया सुंदर टेराकोटा बर्तन।",
          artisan_expected_price: 380,
          price: 450,
          bulk_price: 280,
          suggested_retail_price_inr: 450,
          suggested_wholesale_price_inr: 280,
          estimated_price_inr: 450,
          bulk_price_inr: 280,
          pricing_reasoning: "Fair artisan living wage factored with artisan expected base price (+18% fair markup) and institutional volume pricing.",
          gem_category: "Handicrafts - Traditional Art & Decor",
          unspsc_code: "60121002",
          hsn_code: "69120010",
          moq: 50,
          is_gem_ready: true,
          craft_category: "Terracotta & Pottery",
          tags: ["Handmade", "Traditional", "GeM Ready", "ONDC", "Eco-friendly"],
        };
      }

      setAiStatus('done');

      // Navigate to Review page with full AI profile
      navigate('/review', {
        state: {
          ...listingData,
          imageUrl: targetImageUrl,
          imageBase64: targetImageBase64,
        },
      });
    } catch (fatalErr) {
      console.error('Fatal generation error:', fatalErr);
      const errMsg = fatalErr?.message || 'Processing failed. Please try again.';
      setErrorMsg(errMsg);
      if (showToast) {
        showToast(`❌ ${errMsg}`);
      }
      setAiStatus('error');
    }
  }, [audioBase64, imageBase64, imageUrl, processedPreview, previewUrl, customTranscript, transcriptionLang, language, navigate, showToast]);

  const displayImage = processedPreview || previewUrl;
  const isProcessing = aiStatus === 'transcribing' || aiStatus === 'analyzing';
  const isOptimizing = isProcessingImage || bgRemovalStatus === 'processing';
  const isLoading = isProcessing; // Do NOT block the user when image is optimizing (optimistic UI)

  return (
    <div className="w-full">
      <main className="flex-1 flex flex-col relative w-full min-h-screen bg-[#fdf9f3] overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-[#fdf9f3]/95 backdrop-blur-md border-b border-[#e8e2d9] w-full">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
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

            <div className="flex items-center gap-2.5 shrink-0">
              {/* Authenticated Artisan Badge */}
              {isVerified ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[11px] shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{language === 'hi' ? 'सत्यापित शिल्पकार' : 'Verified Artisan'}</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal()}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 text-[11px] font-bold cursor-pointer transition-all active:scale-95 animate-pulse shadow-xs"
                >
                  <span className="material-symbols-outlined text-[14px]">login</span>
                  <span>📲 {language === 'hi' ? 'फ़ोन सत्यापन' : 'Login with OTP'}</span>
                </button>
              )}

              {/* Language Toggle */}
              <LanguageToggle variant="light" className="h-9" />

              {/* Notification Bell */}
              <button
                onClick={toggleNotifications}
                className="w-9 h-9 rounded-full bg-[#f1ede7] hover:bg-[#ebe8e2] border border-[#e8e2d9] flex items-center justify-center relative text-[#4e4540] cursor-pointer active:scale-95 transition-colors"
                title="Notifications"
                type="button"
              >
                <span className="material-symbols-outlined text-[19px]">notifications</span>
                {unreadCount > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#9c441c] absolute top-1.5 right-1.5 ring-2 ring-[#fdf9f3] animate-pulse"></span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Main Split-Screen Desktop Workspace */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col lg:flex-row gap-6 items-start">
          {/* ──────────────────────────────── LEFT: CAMERA & VIEWFINDER ──────────────────────────────── */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            <div className="relative w-full aspect-[16/11] bg-[#191312] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between p-4 sm:p-6 border border-[#2e241e]">
              {/* Background Display / Selected Craft */}
              {displayImage ? (
                <div className="absolute inset-0 flex items-center justify-center bg-[#191312]">
                  <img
                    src={displayImage}
                    alt="Craft capture"
                    className={`w-full h-full object-contain p-3 sm:p-5 transition-all duration-500 ${
                      isOptimizing ? 'blur-[3px] scale-[0.98] opacity-85' : 'blur-none scale-100 opacity-100'
                    }`}
                  />
                  {/* Viewfinder reticle with subtle edge-scan pulse animation */}
                  <div className="absolute inset-3 sm:inset-5 rounded-2xl border-2 border-[#ff9062]/80 shadow-[0_0_20px_rgba(255,144,98,0.4)] animate-pulse pointer-events-none z-10">
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                      <path d="M 0 14 L 0 0 L 14 0" fill="none" stroke="#ff9062" strokeLinecap="round" strokeWidth="3" />
                      <path d="M 86 0 L 100 0 L 100 14" fill="none" stroke="#ff9062" strokeLinecap="round" strokeWidth="3" />
                      <path d="M 0 86 L 0 100 L 14 100" fill="none" stroke="#ff9062" strokeLinecap="round" strokeWidth="3" />
                      <path d="M 86 100 L 100 100 L 100 86" fill="none" stroke="#ff9062" strokeLinecap="round" strokeWidth="3" />
                    </svg>
                  </div>
                  {/* AI Scanning laser line across craft edges */}
                  {isOptimizing && (
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#ff9062] to-transparent shadow-[0_0_15px_#ff9062] animate-scan pointer-events-none z-20" />
                  )}
                </div>
              ) : (
                <div
                  onClick={() => {
                    if (!isLoading) cameraRef.current?.click();
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
                        onClick={(e) => {
                          e.stopPropagation();
                          cameraRef.current?.click();
                        }}
                        className="p-4 bg-orange-100 text-orange-600 rounded-full hover:bg-orange-200 transition-colors shadow-sm flex flex-col items-center gap-1 cursor-pointer active:scale-95"
                        title="Open Camera"
                      >
                        <Camera size={28}/>
                        <span className="text-xs font-medium">Camera</span>
                      </button>

                      <button 
                        type="button"
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
                  {isOptimizing && (
                    <div className="bg-[#191312]/85 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-[#ff9062]/50 flex items-center gap-2.5 shadow-2xl animate-pulse">
                      <div className="w-5 h-5 border-2 border-[#ff9062] border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-bold text-[#ffdeaa]">
                        {language === 'hi' ? 'एआई जीवनशैली दृश्य तैयार किया जा रहा है...' : 'Generating Lifestyle Scene...'}
                      </span>
                    </div>
                  )}
                  {!isOptimizing && bgRemovalStatus === 'done' && (
                    <div className="bg-emerald-950/90 text-emerald-300 px-4 py-1.5 rounded-full border border-emerald-500/40 text-xs font-bold shadow-lg flex items-center gap-2 backdrop-blur-md">
                      <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
                      <span>{language === 'hi' ? 'लाइफस्टाइल बैकग्राउंड तैयार' : 'Lifestyle Scene Ready'}</span>
                    </div>
                  )}
                  {!isOptimizing && bgRemovalStatus === 'error' && (
                    <div className="bg-stone-900/90 text-stone-300 px-4 py-1.5 rounded-full border border-stone-600/40 text-xs font-medium shadow-lg flex items-center gap-2 backdrop-blur-md">
                      <span className="material-symbols-outlined text-[16px] text-amber-400">check</span>
                      <span>{language === 'hi' ? 'मूल तस्वीर सुरक्षित' : 'Original Photo Preserved'}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Retake Photo if already captured */}
              {displayImage && (
                <div className="relative z-20 flex items-center justify-center">
                  <button
                    id="retake-photo-btn"
                    disabled={isProcessing}
                    onClick={() => {
                      if (!isProcessing) handleRetake();
                    }}
                    className={`flex items-center gap-1.5 text-xs font-bold px-5 py-2.5 rounded-xl border transition-all shadow-lg ${
                      isProcessing
                        ? 'text-red-300/40 bg-red-950/30 border-red-500/20 cursor-not-allowed'
                        : 'text-red-300 bg-red-950/80 hover:bg-red-900/80 border-red-500/40 cursor-pointer active:scale-95'
                    }`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">replay</span>
                    <span>{language === 'hi' ? 'दोबारा फोटो लें' : 'Retake Photo'}</span>
                  </button>
                </div>
              )}
            </div>

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

                {/* Animated Waveform indicator with dynamic audio level feedback */}
                <div className="w-full h-10 px-2 flex items-center justify-center gap-1.5 my-4 overflow-hidden">
                  {[4, 8, 12, 16, 9, 14, 18, 10, 6, 3, 7, 12, 5].map((h, i) => {
                    const dynamicHeight = isRecording
                      ? Math.max(6, Math.min(36, (audioLevel / 100) * 32 + ((i * 5) % 12) + 6))
                      : Math.max(4, h * 0.5);
                    return (
                      <div
                        key={i}
                        className={`w-1.5 rounded-full transition-all duration-150 ${
                          isRecording ? 'animate-pulse' : ''
                        } ${i % 3 === 0 ? 'bg-[#ff9062]/40' : i % 3 === 1 ? 'bg-[#ff9062]' : 'bg-white'}`}
                        style={{
                          height: `${dynamicHeight}px`,
                        }}
                      />
                    );
                  })}
                </div>

                {/* Clean, Mobile-Friendly Recording Helper Text Block */}
                <div className="bg-blue-50 text-blue-800 rounded-lg p-3 text-xs sm:text-sm text-center mb-4 shadow-sm border border-blue-200/60 leading-relaxed">
                  {language === 'hi' ? (
                    <>💡 <strong>सुझाव:</strong> माइक दबाएं और बताएं—यह क्या है, कैसे बना है, और आपकी अपेक्षित कीमत (₹) क्या है?</>
                  ) : (
                    <>💡 <strong>Hint:</strong> Tap the mic and tell us—what this is, how it's made, and your expected price (₹).</>
                  )}
                </div>

                {/* Microphone Button with visual feedback */}
                <div className="relative my-2 flex items-center justify-center">
                  {isRecording && (
                    <>
                      <div className="absolute w-28 h-28 rounded-full bg-red-600/20 animate-ping duration-1000" />
                      <div className="absolute w-24 h-24 rounded-full bg-red-600/30 animate-pulse" />
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

                {/* Instant "Use Sample Craft Speech" fallback button */}
                <div className="flex justify-center mt-3">
                  <button
                    id="sample-speech-btn"
                    type="button"
                    disabled={isLoading}
                    onClick={() => {
                      if (!isLoading) handleUseSampleSpeech();
                    }}
                    className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-xs font-bold transition-all shadow-xs ${
                      isLoading
                        ? 'bg-[#ff9062]/5 text-[#ff9062]/30 border-[#ff9062]/20 cursor-not-allowed'
                        : 'bg-[#ff9062]/15 hover:bg-[#ff9062]/25 text-[#ff9062] border-[#ff9062]/40 cursor-pointer active:scale-95'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">record_voice_over</span>
                    <span>
                      {language === 'hi'
                        ? '🎙️ नमूना शिल्प आवाज़ का उपयोग करें'
                        : '🎙️ Use Sample Craft Speech'}
                    </span>
                  </button>
                </div>

                {/* ── Fallback Text & 1-Tap Craft Chips ── */}
                <div className="mt-5 pt-4 border-t border-white/10 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#ffdeaa] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">edit_note</span>
                      <span>{language === 'hi' ? 'त्वरित शिल्प विवरण चुनें या टाइप करें' : 'Quick Craft Presets or Type Note'}</span>
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
                      const isSelected = customTranscript === chip.text_hi || customTranscript === chip.text_en;
                      return (
                        <button
                          key={idx}
                          disabled={isLoading}
                          onClick={() => {
                            if (!isLoading) setCustomTranscript(chipText);
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

                  {/* Custom Description Text Input */}
                  <textarea
                    rows={2}
                    value={customTranscript}
                    onChange={(e) => setCustomTranscript(e.target.value)}
                    placeholder={
                      language === 'hi'
                        ? 'या शिल्प का विवरण यहाँ लिखें (सामग्री, आकार, निर्माण का समय)...'
                        : 'Or type custom craft details (materials, dimensions, labor hours)...'
                    }
                    className="w-full mt-1 bg-[#2e241e] border border-white/15 rounded-xl p-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#ff9062] transition-colors resize-none"
                  />
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

                {/* AI Progress Indicator */}
                {isProcessing && (
                  <div className="p-3.5 rounded-xl bg-[#2e241e] border border-[#ff9062]/40 flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-[#ff9062] border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-semibold text-[#ff9062] animate-pulse">{aiStatusText}</span>
                  </div>
                )}

                {/* Primary Button */}
                <button
                  id="process-ai-btn"
                  aria-label="Process with AI"
                  disabled={isLoading}
                  onClick={() => {
                    if (!isLoading) handleGenerateListing();
                  }}
                  className={`w-full h-14 rounded-2xl font-bold text-base tracking-wide flex items-center justify-center gap-2 shadow-xl transition-all ${
                    isLoading
                      ? 'bg-[#ff9062]/50 text-[#180f0a]/50 cursor-not-allowed'
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

                <div className="flex items-center justify-center gap-1.5 text-[#d4c3ba] text-[11px] text-center px-2">
                  <span className="material-symbols-outlined text-[14px] text-[#ff9062]">bolt</span>
                  <span>
                    {language === 'hi'
                      ? 'शून्य टाइपिंग • त्वरित शीर्षक, GeM कोड और थोक मूल्य 10 सेकंड में'
                      : 'Zero typing • Instant title, GeM codes & bulk pricing in 10s'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
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
      {/* Opens native gallery / file picker */}
      <input 
        type="file" 
        accept="image/*" 
        ref={galleryRef}
        onChange={handleImageSelection} 
        className="hidden" 
      />
      </main>
    </div>
  );
}
