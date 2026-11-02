import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * EventMapModal
 * In-App interactive map modal for exhibition locations.
 * Uses createPortal to ensure the modal is never trapped inside parent transforms or overflow:hidden.
 * 
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - locationName: string
 * - eventTitle: string
 */
export default function EventMapModal({ isOpen, onClose, locationName, eventTitle }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // Lock background scrolling while modal is open
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Support letters (Latin and Unicode scripts like Devanagari), numbers, spaces, and commas
  const rawLocation = (locationName || 'India').trim();
  const cleanLocation = rawLocation.replace(/[^\p{L}\p{N}\s,.-]/gu, '').trim() || 'India';
  const queryStr = cleanLocation.toLowerCase().includes('india')
    ? cleanLocation
    : `${cleanLocation}, India`;
  const searchQuery = encodeURIComponent(queryStr);

  // Strict embed format
  const embedUrl = `https://maps.google.com/maps?q=${searchQuery}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div 
        className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl p-5 text-white animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title, Venue Subtext, and Easy-to-Tap Close Button (✕) */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-white truncate">
              {eventTitle || 'Exhibition Venue'}
            </h3>
            <p className="text-xs text-stone-400 mt-0.5 truncate">
              {locationName || 'India'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center text-sm font-bold transition-colors cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Responsive Iframe Container */}
        <div className="relative w-full h-80 sm:h-96 rounded-xl overflow-hidden border border-stone-800 bg-stone-900 flex flex-col items-center justify-center">

          {/* Fallback UI (Sits in the background, z-0) */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-0">
            <svg className="w-10 h-10 text-stone-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-stone-400 text-sm mb-4">Live preview unavailable.</p>
            <a 
              href={`https://www.google.com/maps/dir/?api=1&destination=${searchQuery}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-md text-sm font-medium transition-colors"
            >
              Open in Native Maps App
            </a>
          </div>

          {/* The Iframe (Sits on top, z-10) */}
          <iframe 
            className="relative z-10 w-full h-full bg-transparent"
            src={embedUrl} 
            loading="lazy" 
            style={{ border: 0 }} 
            allowFullScreen 
            referrerPolicy="no-referrer-when-downgrade"
            title={eventTitle || 'Event Location Map'}
          ></iframe>
        </div>

        {/* Footer with External Link Button to Navigate in Native App */}
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${searchQuery}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-medium mt-4 transition-colors"
        >
          Google Maps में रास्ता देखें (Navigate)
        </a>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
}
