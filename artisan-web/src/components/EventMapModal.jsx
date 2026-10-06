import React, { useEffect } from 'react';

/**
 * EventMapModal
 * In-App interactive map modal for exhibition locations.
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
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Append ", India" to ensure rural/regional exhibition venues resolve accurately
  const cleanLocation = (locationName || 'India').trim();
  const queryStr = cleanLocation.toLowerCase().includes('india')
    ? cleanLocation
    : `${cleanLocation}, India`;
  const searchQuery = encodeURIComponent(queryStr);
  const embedUrl = `https://maps.google.com/maps?q=${searchQuery}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl p-5 text-white">
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
        <div className="relative w-full h-80 sm:h-96 rounded-xl border border-stone-800 bg-stone-950 touch-auto">
          <iframe
            src={embedUrl}
            width="100%"
            height="100%"
            loading="lazy"
            style={{ border: 0, pointerEvents: 'auto' }}
            allowFullScreen
            title={eventTitle || 'Event Location Map'}
            className="w-full h-full rounded-xl pointer-events-auto touch-auto block"
          />
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
}
