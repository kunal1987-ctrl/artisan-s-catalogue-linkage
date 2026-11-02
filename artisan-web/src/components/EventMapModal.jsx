import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * EventMapModal
 * In-App interactive map modal for exhibition locations using native Google Maps iframe.
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

  const searchQuery = encodeURIComponent(`${locationName || 'India'}, India`);
  const embedUrl = `https://maps.google.com/maps?q=${searchQuery}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
  const nativeMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${searchQuery}`;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div 
        className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl p-4 sm:p-5 text-white animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title, Venue Subtext, and Close Button */}
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-950/80 text-orange-400 border border-orange-800/50">
              LIVE VENUE MAP
            </span>
            <h3 className="text-base sm:text-lg font-bold text-white truncate mt-1">
              {eventTitle || 'Exhibition Venue'}
            </h3>
            <p className="text-xs text-stone-400 truncate">
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

        {/* Responsive Google Maps Iframe Container */}
        <div className="relative w-full h-80 rounded-xl overflow-hidden border border-stone-800 bg-stone-900 mt-4">
          <iframe 
            className="absolute inset-0 w-full h-full"
            src={embedUrl} 
            loading="lazy" 
            style={{ border: 0 }} 
            allowFullScreen 
            referrerPolicy="no-referrer-when-downgrade"
            title={eventTitle || 'Event Location Map'}
          />
        </div>

        {/* Footer Direct Turn-by-Turn GPS Navigation CTA */}
        <a
          href={nativeMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 sm:py-3.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl font-bold mt-4 shadow-lg shadow-orange-950/40 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
          </svg>
          <span>Google Maps में रास्ता देखें (Navigate)</span>
        </a>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
}
