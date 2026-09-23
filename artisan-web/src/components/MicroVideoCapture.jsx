import React, { useRef, useState, useEffect } from 'react';

export default function MicroVideoCapture({ onCaptureComplete, onCancel }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  // Stop camera tracks on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
      }
    };
  }, [recordedVideoUrl]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error('Camera access error:', err);
      // Fallback without constraints if environment camera fails
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
        }
        setIsCameraActive(true);
      } catch (fallbackErr) {
        setCameraError('कैमरा एक्सेस उपलब्ध नहीं है (Camera access denied or unavailable).');
      }
    }
  };

  const startRecording = () => {
    const stream = streamRef.current || videoRef.current?.srcObject;
    if (!stream) return;

    try {
      const mimeType = typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : undefined);

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalMime = mimeType || 'video/webm';
        const blob = new Blob(chunks, { type: finalMime });
        const videoUrl = URL.createObjectURL(blob);
        setRecordedVideoUrl(videoUrl);

        // Turn off camera tracks
        stopCamera();

        // Pass final video blob back to parent component
        if (onCaptureComplete) {
          onCaptureComplete(blob, videoUrl);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setCountdown(3);

      // Countdown interval for visual progress
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Auto-stop after exactly 3 seconds
      setTimeout(() => {
        clearInterval(countdownInterval);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
      }, 3000);
    } catch (err) {
      console.error('MediaRecorder error:', err);
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-5 bg-stone-950 border border-white/10 rounded-2xl text-white w-full max-w-lg shadow-xl">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          3D Product Proof / 3-Sec Video
        </div>
        <p className="font-bold text-amber-100 text-sm sm:text-base">
          उत्पाद को घुमाते हुए 3 सेकंड का वीडियो बनाएं
        </p>
        <p className="text-xs text-stone-400">
          Rotate your handicraft slowly 360° to prove physical authenticity
        </p>
      </div>

      {/* Video Viewfinder Container */}
      <div className="relative w-full h-64 sm:h-72 bg-black rounded-xl overflow-hidden border border-white/10 flex items-center justify-center">
        {/* Frame markers */}
        <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-amber-500 z-10 pointer-events-none" />
        <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-amber-500 z-10 pointer-events-none" />
        <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-amber-500 z-10 pointer-events-none" />
        <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-amber-500 z-10 pointer-events-none" />

        {/* Live Video Feed */}
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className={`w-full h-full object-cover ${recordedVideoUrl ? 'hidden' : 'block'}`} 
        />

        {/* Playback of recorded proof */}
        {recordedVideoUrl && (
          <video 
            src={recordedVideoUrl} 
            controls 
            autoPlay 
            loop 
            playsInline 
            className="w-full h-full object-cover" 
          />
        )}

        {/* Inactive State Prompt */}
        {!isCameraActive && !recordedVideoUrl && (
          <div className="flex flex-col items-center justify-center p-4 text-center z-10 gap-2">
            <div className="w-12 h-12 rounded-full bg-stone-800 flex items-center justify-center text-stone-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-xs text-stone-400">रियर कैमरा चालू करने के लिए नीचे बटन दबाएं</p>
          </div>
        )}

        {/* Live Recording Overlay & Progress */}
        {isRecording && (
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-between p-4 z-20 pointer-events-none">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/90 text-white text-xs font-bold animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-white" />
              RECORDING ({countdown}s)
            </div>
            <div className="text-4xl sm:text-5xl font-black text-amber-400 font-mono drop-shadow-md">
              {countdown}s
            </div>
            {/* Progress bar */}
            <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-red-500 h-full transition-all duration-1000 ease-linear"
                style={{ width: `${((4 - countdown) / 3) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {cameraError && (
        <div className="text-xs text-red-400 bg-red-950/40 border border-red-500/30 rounded-xl p-3 w-full text-center">
          {cameraError}
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 w-full">
        {!isCameraActive && !recordedVideoUrl && (
          <button 
            type="button"
            onClick={startCamera} 
            className="flex-1 py-3 px-5 bg-stone-800 hover:bg-stone-700 text-amber-200 font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer flex items-center justify-center gap-2 border border-white/10"
          >
            <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            1. Start Camera (कैमरा चालू करें)
          </button>
        )}

        {isCameraActive && !isRecording && (
          <button 
            type="button"
            onClick={startRecording} 
            className="flex-1 py-3 px-6 bg-red-600 hover:bg-red-500 text-white font-black text-sm rounded-full animate-pulse transition shadow-lg shadow-red-900/40 cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="w-3 h-3 rounded-full bg-white animate-ping" />
            2. Record 3s Turnaround (3 सेकंड रिकॉर्ड करें)
          </button>
        )}

        {recordedVideoUrl && (
          <div className="flex items-center gap-3 w-full">
            <button
              type="button"
              onClick={() => {
                setRecordedVideoUrl(null);
                startCamera();
              }}
              className="flex-1 py-2.5 px-4 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold rounded-xl transition cursor-pointer border border-white/10"
            >
              🔄 Re-record (दोबारा बनाएं)
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="py-2.5 px-4 bg-stone-900 text-stone-400 hover:text-white text-xs font-medium rounded-xl transition cursor-pointer"
              >
                Done
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
