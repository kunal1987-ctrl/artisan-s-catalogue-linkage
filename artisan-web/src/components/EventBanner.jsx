import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import EventMapModal from './EventMapModal';

function MapPinIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

const DEFAULT_EVENTS = [
  {
    id: 'default-1',
    title: 'SARAS Aajeevika Mela 2026',
    organizer: 'Ministry of Rural Development',
    location: 'Bhopal Haat, Madhya Pradesh',
    start_date: '2026-10-25',
    end_date: '2026-11-05',
    registration_url: 'https://rural.gov.in',
    is_active: true,
  },
  {
    id: 'default-2',
    title: 'TRIFED Shilp Mahotsav',
    organizer: 'Tribal Co-Operative Marketing Federation of India',
    location: 'Indore Haat, Madhya Pradesh',
    start_date: '2026-11-12',
    end_date: '2026-11-20',
    registration_url: 'https://trifed.tribal.gov.in',
    is_active: true,
  },
  {
    id: 'default-3',
    title: 'Surajkund International Crafts Mela',
    organizer: 'Surajkund Mela Authority & Ministry of Tourism',
    location: 'Surajkund, Faridabad, Haryana',
    start_date: '2026-02-01',
    end_date: '2026-02-17',
    registration_url: 'https://haryanatourism.gov.in',
    is_active: true,
  },
];

export default function EventBanner() {
  const [events, setEvents] = useState(DEFAULT_EVENTS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedMapEvent, setSelectedMapEvent] = useState(null);

  // 1. Fetch active events from Supabase artisan_events table
  useEffect(() => {
    let isMounted = true;

    async function fetchEvents() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('artisan_events')
          .select('*')
          .eq('is_active', true)
          .order('start_date', { ascending: true });

        if (error) {
          console.warn('[EventBanner] Error fetching artisan_events from Supabase:', error.message);
        } else if (data && data.length > 0) {
          if (isMounted) {
            setEvents(data);
          }
        }
      } catch (err) {
        console.warn('[EventBanner] Query exception, using fallback events:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchEvents();

    // Live sync via Supabase Realtime channel
    const channel = supabase
      .channel('public:artisan_events')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'artisan_events' },
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Auto-play slideshow effect (every 5 seconds; background banner continues to rotate uninterrupted)
  useEffect(() => {
    if (events.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % events.length);
    }, 5000); // 5 second transition
    return () => clearInterval(timer);
  }, [events.length]);

  const safeIndex = currentIndex >= events.length ? 0 : currentIndex;
  const currentEvent = events[safeIndex] || DEFAULT_EVENTS[0];

  // Pagination Handlers (cancels TTS on manual user navigation)
  const handlePrev = () => {
    if (events.length <= 1) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setCurrentIndex((prev) => (prev === 0 ? events.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (events.length <= 1) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setCurrentIndex((prev) => (prev === events.length - 1 ? 0 : prev + 1));
  };

  // 3. Native Web Speech API Text-to-Speech Handler
  const handleListen = (event) => {
    if (!event) return;

    if ('speechSynthesis' in window) {
      // Toggle stop if already playing
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }

      window.speechSynthesis.cancel();
      const textToRead = `Upcoming event: ${event.title}, organized by ${event.organizer || 'Government of India'}. Location: ${event.location || 'India'}.`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = 'hi-IN'; // Indian English/Hindi dialect if supported
      utterance.rate = 0.9;

      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find(
        (v) => v.lang === 'hi-IN' || v.lang === 'en-IN' || v.lang.includes('IN')
      );
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } else {
      alert('Text-to-speech is not supported in this browser.');
    }
  };

  // Date Formatting Helper
  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBD';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // 1. Dynamic Status Logic based on start_date and end_date
  const getEventStatus = (startDateStr, endDateStr) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    // Normalize dates to YYYY-MM-DD
    const normalize = (dStr) => {
      if (!dStr) return null;
      if (/^\d{4}-\d{2}-\d{2}$/.test(dStr)) return dStr;
      try {
        const d = new Date(dStr);
        return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
      } catch {
        return null;
      }
    };

    const sDate = normalize(startDateStr);
    const eDate = normalize(endDateStr);

    // Case 1: Before start_date -> UPCOMING EXHIBITION
    if (sDate && todayStr < sDate) {
      return {
        statusType: 'upcoming',
        badgeTitle: 'UPCOMING EXHIBITION',
        badgeSubtitle: 'Stalls Available',
        badgeClasses:
          'bg-amber-500/15 border-amber-500/30 text-amber-200 hover:border-amber-400 hover:bg-amber-500/25',
        iconContainerClasses: 'bg-amber-500/25 text-amber-300',
        dotColor: 'bg-amber-400',
      };
    }

    // Case 2: After end_date -> PAST EXHIBITION (Grayed out)
    if (eDate && todayStr > eDate) {
      return {
        statusType: 'past',
        badgeTitle: 'PAST EXHIBITION',
        badgeSubtitle: 'Event Closed',
        badgeClasses:
          'bg-white/5 border-white/10 text-gray-400 opacity-60 hover:opacity-85 hover:border-white/20',
        iconContainerClasses: 'bg-white/10 text-gray-400',
        dotColor: 'bg-gray-500',
      };
    }

    // Case 3: Between start_date and end_date -> LIVE EXHIBITION (Active / Green pulsing)
    return {
      statusType: 'live',
      badgeTitle: 'LIVE EXHIBITION',
      badgeSubtitle: 'Happening Now',
      badgeClasses:
        'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-900/50 shadow-md shadow-emerald-950/40',
      iconContainerClasses: 'bg-emerald-500/20 text-emerald-400',
      dotColor: 'bg-emerald-400',
    };
  };

  // 2. Clickable Registration Link with Google Search Fallback
  const getRegistrationLink = (event) => {
    if (
      event?.registration_url &&
      typeof event.registration_url === 'string' &&
      event.registration_url.trim().length > 0
    ) {
      const rawUrl = event.registration_url.trim();
      return rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
        ? rawUrl
        : `https://${rawUrl}`;
    }
    const query = encodeURIComponent(`${event?.title || 'Artisan Mela'} registration`);
    return `https://www.google.com/search?q=${query}`;
  };

  const status = getEventStatus(currentEvent.start_date, currentEvent.end_date);
  const registrationLink = getRegistrationLink(currentEvent);

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#2e241e] to-[#4a3b32] rounded-3xl p-5 sm:p-6 sm:px-8 border border-[#4a3b32] shadow-xl text-white my-4">
      {/* Decorative Background Icon */}
      <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 pointer-events-none select-none">
        <span className="material-symbols-outlined text-[130px] text-[#ffdeaa]">
          festival
        </span>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1">
          {/* Header Row: Badge & Pagination Arrows */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <a
              href={registrationLink}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border transition-all duration-200 hover:scale-105 cursor-pointer ${
                status.statusType === 'live'
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : status.statusType === 'past'
                  ? 'bg-white/5 border-white/10 text-gray-400 opacity-60'
                  : 'bg-[#ff9062]/20 border-[#ff9062]/30 text-[#ff9062]'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${status.dotColor} ${status.statusType === 'live' ? 'animate-ping' : 'animate-pulse'}`}></span>
              <span>{status.badgeTitle} • {status.badgeSubtitle}</span>
              {loading && (
                <span className="text-[10px] lowercase text-[#ffdeaa] font-normal opacity-80">(syncing...)</span>
              )}
            </a>

            {/* Pagination Controls */}
            {events.length > 1 && (
              <div className="flex items-center gap-2 bg-black/40 rounded-full px-3 py-1 border border-white/10 text-xs text-[#d1c4bd]">
                <span className="font-semibold text-white">
                  {safeIndex + 1} / {events.length}
                </span>
                <div className="flex items-center gap-1 border-l border-white/20 pl-2">
                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label="Previous Event"
                    className="p-1 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
                    title="Previous Event"
                  >
                    &lt;
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    aria-label="Next Event"
                    className="p-1 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
                    title="Next Event"
                  >
                    &gt;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Event Title */}
          <h3 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight mb-2">
            {currentEvent.title}
          </h3>

          {/* Dynamic Metadata: Organizer, Location, Dates */}
          <div className="text-[#d1c4bd] text-sm font-medium mb-5 flex flex-wrap items-center gap-x-5 gap-y-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[#ff9062] font-semibold">Organizer:</span>
              <span>{currentEvent.organizer || 'Government of India'}</span>
            </div>

            {/* Clickable Location with Map Modal Trigger & Continuous Ripple/Ping Animation */}
            <div className="flex flex-col">
              <span className="text-[#ff9062] font-semibold text-xs">Location:</span>
              <button
                type="button"
                onClick={() => setSelectedMapEvent(events[currentIndex])}
                className="group relative inline-flex items-center gap-2 px-3 py-1.5 mt-2 rounded-full bg-stone-800/80 border border-stone-700 hover:border-orange-500 hover:bg-stone-800 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-[0_0_15px_rgba(249,115,22,0.15)]"
              >
                {/* Ripple Map Pin */}
                <span className="relative flex h-4 w-4 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-60"></span>
                  <MapPinIcon className="relative inline-flex rounded-full h-4 w-4 text-orange-500"/>
                </span>

                {/* Location Text */}
                <span className="text-stone-200 text-sm font-medium tracking-wide">
                  {events[currentIndex].location}
                </span>

                {/* Animated Arrow */}
                <span className="text-orange-400 text-xs font-semibold group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300">
                  (Map ↗)
                </span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[#ff9062] font-semibold">Dates:</span>
              <span>
                {formatDate(currentEvent.start_date)} - {formatDate(currentEvent.end_date)}
              </span>
            </div>
          </div>

          {/* Interactive Actions: Listen (TTS), View Map, & Register */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Text-to-Speech "Listen" Button */}
            <button
              type="button"
              onClick={() => handleListen(currentEvent)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border active:scale-95 cursor-pointer ${
                isSpeaking
                  ? 'bg-amber-500/30 text-amber-200 border-amber-400 shadow-inner animate-pulse'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
              }`}
            >
              <span>{isSpeaking ? '⏹ Stop' : '🔊 Listen'}</span>
            </button>

            {/* In-App Interactive Map Trigger Button with Continuous Ripple / Ping Animation */}
            <button
              type="button"
              onClick={() => setSelectedMapEvent(events[currentIndex])}
              className="relative group/map flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all border border-white/15 active:scale-95 cursor-pointer shadow-sm hover:border-orange-500/50"
              title="Inspect venue on interactive map"
            >
              {/* Continuous Ripple / Ping Indicator */}
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              <MapPinIcon className="w-4 h-4 text-orange-400 transition-transform group-hover/map:scale-110" />
              <span>नक्शा देखें (View Map)</span>
            </button>

            {/* Official Registration Link */}
            <a
              href={registrationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ff9062] hover:bg-[#e87a4d] text-white text-sm font-bold transition-all shadow-lg hover:shadow-orange-500/25 active:scale-95 cursor-pointer"
            >
              <span>Register Now</span>
              <span>→</span>
            </a>

            {/* Official Website Link */}
            <a
              href={registrationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white text-sm font-medium border border-white/10 transition-colors cursor-pointer"
              title="Official Website"
            >
              <span>Official Website</span>
              <svg className="w-3.5 h-3.5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>

        {/* Right Side Visual Clickable Badge */}
        <a
          href={events[currentIndex].registration_url}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex flex-col items-center justify-center w-48 p-5 rounded-2xl border border-amber-600/40 bg-stone-800/90 backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:bg-stone-800 hover:shadow-[0_8px_30px_rgba(217,119,6,0.25)] active:scale-95 cursor-pointer overflow-hidden"
        >
          {/* Pulse Circle & Icon */}
          <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mb-3 group-hover:bg-amber-500/20 transition-colors relative">
            <div className="absolute inset-0 rounded-full border border-amber-500/30 animate-ping opacity-20"></div>
            <svg className="w-7 h-7 text-amber-500 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>

          {/* Typography */}
          <span className="text-xs font-bold text-amber-500 tracking-wider mb-1 uppercase">
            Upcoming Exhibition
          </span>
          
          {/* Call to Action with Animated Arrow */}
          <span className="flex items-center gap-1.5 text-sm font-medium text-stone-200">
            स्टॉल बुक करें
            <span className="text-amber-500 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">
              ↗
            </span>
          </span>
        </a>
      </div>

      {/* In-App Interactive Map Modal - Locked onto selectedMapEvent */}
      {selectedMapEvent && (
        <EventMapModal
          isOpen={!!selectedMapEvent}
          onClose={() => setSelectedMapEvent(null)}
          locationName={selectedMapEvent.location}
          eventTitle={selectedMapEvent.title}
        />
      )}
    </div>
  );
}
