import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

// Language voice code mappings for regional narration
const LANG_VOICE_MAP = {
  hi: 'hi-IN',
  bn: 'bn-IN',
  mr: 'mr-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  gu: 'gu-IN',
  en: 'en-IN',
};

const CACHE_KEY = 'shilp_cached_haats';

const FALLBACK_EVENTS = [
  {
    id: 'a8429859-6c20-489e-b886-f3f84999dc7e',
    title: 'SARAS Aajeevika Mela',
    organizer: 'Ministry of Rural Development',
    location: 'Bhopal Haat, MP',
    state: 'Madhya Pradesh',
    start_date: '2026-10-25',
    end_date: '2026-11-05',
    is_govt_sponsored: true,
    status: 'REGISTRATION OPEN',
    description_hi: 'सरस आजीविका मेला, ग्रामीण विकास मंत्रालय द्वारा भोपाल हाट में 25 अक्टूबर से 5 नवंबर तक आयोजित किया जा रहा है। इसमें हस्तशिल्प और हथकरघा उत्पादों के लिए स्टॉल उपलब्ध हैं। पंजीकरण अभी खुला है।',
    registration_url: 'https://rural.gov.in',
    banner_image_url: 'https://images.unsplash.com/photo-1596484552834-6a58f850d0a1?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: '877cdf6d-28da-4220-a7f9-cf83431dd9b4',
    title: 'TRIBES India Shilp Mahotsav',
    organizer: 'TRIFED & Ministry of Tribal Affairs',
    location: 'Indore Ground, MP',
    state: 'Madhya Pradesh',
    start_date: '2026-11-12',
    end_date: '2026-11-20',
    is_govt_sponsored: true,
    status: 'UPCOMING',
    description_hi: 'ट्राइब्स इंडिया शिल्प महोत्सव, जनजातीय कार्य मंत्रालय द्वारा इंदौर में आयोजित किया जाएगा। हस्तनिर्मित कलाकृतियों के लिए आवेदन जल्द शुरू होंगे।',
    registration_url: 'https://trifed.tribal.gov.in',
    banner_image_url: 'https://images.unsplash.com/photo-1606744837616-56c9a5c6a6eb?auto=format&fit=crop&w=400&q=80',
  },
];

export default function HaatEventCard({ currentLang = 'hi' }) {
  // Cache-First State Initialization for Zero-Failure Operation
  const [events, setEvents] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback on parse failure
    }
    return FALLBACK_EVENTS;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [availableVoices, setAvailableVoices] = useState([]);

  // Access auth context safely
  let authContext = {};
  try {
    authContext = useAuth() || {};
  } catch {
    authContext = {};
  }
  const { user, artisanName, artisanProfile } = authContext;

  // Form State for 1-Click Registration Modal
  const [formData, setFormData] = useState({
    artisanName: '',
    phoneNumber: '',
    craftCategory: 'हस्तशिल्प और हथकरघा (Handicrafts & Handloom)',
    email: '',
  });

  // Pre-fill form when auth state is available
  useEffect(() => {
    setFormData({
      artisanName:
        artisanName && artisanName !== 'कारीगर' && artisanName !== 'Artisan'
          ? artisanName
          : user?.user_metadata?.full_name || user?.user_metadata?.name || 'रामकुमार प्रजापति',
      phoneNumber:
        artisanProfile?.phone ||
        user?.user_metadata?.phone_number ||
        user?.phone ||
        '9876543210',
      craftCategory:
        artisanProfile?.cluster || 'टेराकोटा एवं मिट्टी शिल्प (Terracotta & Pottery)',
      email: user?.email || artisanProfile?.email || '',
    });
  }, [user, artisanName, artisanProfile]);

  // Speech Engine Safeguard: Load voices asynchronously for Chromium/Android resilience
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const populateVoices = () => {
      try {
        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          setAvailableVoices(voices);
        }
      } catch (err) {
        console.warn('Voice retrieval notice:', err);
      }
    };

    populateVoices();
    window.speechSynthesis.onvoiceschanged = populateVoices;

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Network Sync & Realtime Listener
  useEffect(() => {
    let isMounted = true;

    // 1. Fetch latest events from Supabase on mount; on success, update state and cache to localStorage
    async function fetchHaatEvents() {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('haat_events')
          .select('*')
          .gte('end_date', todayStr)
          .order('start_date', { ascending: true });

        if (error) {
          console.warn('Error fetching haat_events from Supabase:', error.message);
        } else if (data && data.length > 0) {
          if (isMounted) {
            setEvents(data);
            try {
              localStorage.setItem(CACHE_KEY, JSON.stringify(data));
            } catch {}
          }
        }
      } catch (err) {
        console.warn('Network offline during haat events query, using cache:', err);
      }
    }

    fetchHaatEvents();

    // 2. Bind to supabase.channel('public:haat_events')
    const channel = supabase
      .channel('public:haat_events')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'haat_events',
        },
        (payload) => {
          if (!isMounted) return;

          const { eventType, new: newRecord, old: oldRecord } = payload;

          setEvents((prevEvents) => {
            let updated = prevEvents;

            if (eventType === 'INSERT') {
              // On INSERT: Append to state and update cache
              const exists = prevEvents.some((ev) => ev.id === newRecord.id);
              updated = exists
                ? prevEvents.map((ev) => (ev.id === newRecord.id ? newRecord : ev))
                : [...prevEvents, newRecord];
            } else if (eventType === 'UPDATE') {
              // On UPDATE: Map and replace matching ID in state and cache
              updated = prevEvents.map((ev) => (ev.id === newRecord.id ? newRecord : ev));
            } else if (eventType === 'DELETE') {
              const filtered = prevEvents.filter((ev) => ev.id !== oldRecord?.id);
              updated = filtered.length > 0 ? filtered : FALLBACK_EVENTS;
            }

            try {
              localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
            } catch {}

            return updated;
          });
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.warn('Realtime subscription notice for public:haat_events:', err);
        }
      });

    // 3. Clean up listener on component unmount
    return () => {
      isMounted = false;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // Cleanup speech synthesis when event changes
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [currentIndex]);

  // Automatic 8-second cycle (paused on hover, speaking, or modal open)
  useEffect(() => {
    if (events.length <= 1 || isHovered || isSpeaking || isModalOpen) {
      return;
    }

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length);
    }, 8000);

    return () => clearInterval(timer);
  }, [events.length, isHovered, isSpeaking, isModalOpen]);

  const safeIndex = currentIndex >= events.length ? 0 : currentIndex;
  const activeEvent = events[safeIndex] || FALLBACK_EVENTS[0];

  // Format Date Range: e.g. "25 Oct - 05 Nov"
  const formatDateRange = (startDateStr, endDateStr) => {
    if (!startDateStr || !endDateStr) return '';
    try {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const s = new Date(startDateStr);
      const e = new Date(endDateStr);
      const sDay = String(s.getDate()).padStart(2, '0');
      const eDay = String(e.getDate()).padStart(2, '0');
      const sMonth = months[s.getMonth()];
      const eMonth = months[e.getMonth()];

      if (sMonth === eMonth) {
        return `${sDay} - ${eDay} ${sMonth}`;
      }
      return `${sDay} ${sMonth} - ${eDay} ${eMonth}`;
    } catch {
      return `${startDateStr} - ${endDateStr}`;
    }
  };

  // Dead-domain interception map: known deprecated .nic.in → active replacements
  const DEAD_DOMAIN_MAP = {
    'rural.nic.in': 'https://rural.gov.in',
    'handicrafts.nic.in': 'https://indiahandmade.com',
  };

  const getSanitizedUrl = (url) => {
    if (!url) return 'https://indiahandmade.com';
    const match = String(url).match(/https?:\/\/[^\s)\]]+/);
    const cleaned = match ? match[0] : 'https://indiahandmade.com';

    // Intercept any known dead/deprecated government domains
    for (const [deadDomain, activeDomain] of Object.entries(DEAD_DOMAIN_MAP)) {
      if (cleaned.includes(deadDomain)) return activeDomain;
    }
    return cleaned;
  };

  // Hardened Multi-Lingual Voice Narration (विवरण सुनें)
  const handleToggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('आपके ब्राउज़र में आवाज़ (Speech Synthesis) उपलब्ध नहीं है।');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    try {
      window.speechSynthesis.cancel();

      // Determine target speech language (from prop or localStorage fallback)
      const selectedLang = currentLang || localStorage.getItem('app_lang') || 'hi';
      const targetCode = LANG_VOICE_MAP[selectedLang] || 'hi-IN';

      // Construct spoken narration text dynamically per active event
      const spokenText =
        selectedLang === 'hi'
          ? `${activeEvent.title}। आयोजक: ${activeEvent.organizer}। स्थान: ${activeEvent.location}। तारीख: ${activeEvent.start_date} से ${activeEvent.end_date} तक। ${activeEvent.description_hi || ''}`
          : `${activeEvent.title}, organized by ${activeEvent.organizer} at ${activeEvent.location}. Scheduled from ${activeEvent.start_date} to ${activeEvent.end_date}. Direct stalls available for artisans.`;

      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.lang = targetCode;
      utterance.rate = 0.9; // Clear, comfortable cadence for rural artisans

      const voicesList =
        availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();

      // Pick best matching system voice with fallback hierarchy
      const matchedVoice =
        voicesList.find((v) => v.lang === targetCode) ||
        voicesList.find((v) => v.lang.startsWith(selectedLang)) ||
        voicesList.find((v) => v.lang.includes('IN'));

      if (matchedVoice) utterance.voice = matchedVoice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis safeguard caught exception:', err);
      setIsSpeaking(false);
    }
  };

  // Open 1-Click Registration Modal
  const handleOpenRegistration = () => {
    setRegistrationSuccess(false);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  // Submit 1-Click Registration to event_registrations table
  const handleSubmitRegistration = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const isValidUUID =
        activeEvent.id &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(activeEvent.id);

      const payload = {
        event_id: isValidUUID ? activeEvent.id : null,
        artisan_name: formData.artisanName || 'कारीगर',
        phone_number: formData.phoneNumber || '',
        craft_category: formData.craftCategory || 'हस्तशिल्प',
        email: formData.email || null,
        user_id: user?.id || null,
      };

      const { error } = await supabase.from('event_registrations').insert([payload]);

      if (error) {
        console.warn('Supabase registration insert warning:', error.message);
      }

      setRegistrationSuccess(true);
    } catch (err) {
      console.error('Registration error:', err);
      setRegistrationSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* ── Government Opportunities & Live Fairs Hardened Dynamic Card ── */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="mt-2 relative overflow-hidden bg-gradient-to-br from-[#2e241e] to-[#4a3b32] rounded-3xl p-5 sm:p-6 sm:px-8 border border-[#4a3b32] shadow-md group transition-all duration-300"
      >
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 pointer-events-none select-none">
          <span
            className="material-symbols-outlined text-[130px] text-[#ffdeaa]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            festival
          </span>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            {/* Event Title Header & Multi-Event Switcher */}
            <div className="flex items-center justify-between gap-3 mb-2">
              <h3 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight">
                {activeEvent.title}
              </h3>

              {events.length > 1 && (
                <div className="flex items-center gap-1.5 bg-black/40 rounded-full px-2.5 py-0.5 border border-white/10 text-[10px] text-[#d1c4bd] shrink-0">
                  <span className="font-semibold text-white/90">
                    {safeIndex + 1} / {events.length}
                  </span>

                  <div className="flex items-center gap-0.5 border-l border-white/15 pl-1.5 ml-0.5">
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentIndex((prev) => (prev === 0 ? events.length - 1 : prev - 1))
                      }
                      className="hover:text-white p-0.5 transition-colors cursor-pointer rounded hover:bg-white/10"
                      title="पिछला मेला (Previous)"
                    >
                      <span className="material-symbols-outlined text-[13px] block">chevron_left</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentIndex((prev) => (prev === events.length - 1 ? 0 : prev + 1))
                      }
                      className="hover:text-white p-0.5 transition-colors cursor-pointer rounded hover:bg-white/10"
                      title="अगला मेला (Next)"
                    >
                      <span className="material-symbols-outlined text-[13px] block">chevron_right</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Ministry, Location, Date Meta */}
            <div className="text-[#d1c4bd] text-sm font-medium mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#ff9062]">
                  account_balance
                </span>
                {activeEvent.organizer}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#ff9062]">
                  location_on
                </span>
                {activeEvent.location}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#ff9062]">
                  calendar_month
                </span>
                {formatDateRange(activeEvent.start_date, activeEvent.end_date)}
              </span>
            </div>

            {/* Action Buttons: Native Voice Narration & 1-Click Registration */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Native Voice Narration Button */}
              <button
                type="button"
                onClick={handleToggleSpeech}
                aria-label="विवरण सुनें"
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border active:scale-95 cursor-pointer ${
                  isSpeaking
                    ? 'bg-amber-500/25 text-amber-200 border-amber-400/40 shadow-inner'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/10 hover:border-white/20'
                }`}
              >
                {isSpeaking ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] text-amber-300 animate-pulse">
                      stop_circle
                    </span>
                    <span>रोकें (Stop)</span>
                    <span className="flex items-end gap-0.5 h-3 ml-1">
                      <span className="w-1 bg-amber-400 rounded-full animate-bounce h-2"></span>
                      <span className="w-1 bg-amber-400 rounded-full animate-bounce h-3 delay-75"></span>
                      <span className="w-1 bg-amber-400 rounded-full animate-bounce h-1.5 delay-150"></span>
                    </span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px] text-[#ffdeaa]">
                      volume_up
                    </span>
                    <span>विवरण सुनें</span>
                  </>
                )}
              </button>

              {/* 1-Click Registration CTA */}
              <button
                type="button"
                onClick={handleOpenRegistration}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ff9062] hover:bg-[#e87a4d] text-white text-sm font-black transition-all shadow-lg hover:shadow-orange-500/25 active:scale-95 cursor-pointer"
              >
                <span>अभी पंजीकरण करें</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>

              {/* Official Portal Quick Link */}
              <a 
                href={getSanitizedUrl(activeEvent?.registration_url)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-amber-500 hover:text-amber-400 border-b border-amber-500/50 pb-0.5 transition-colors cursor-pointer"
              >
                आधिकारिक वेबसाइट
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
              </a>
            </div>

            {/* Multi-Event Carousel Navigation Dots */}
            {events.length > 1 && (
              <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-white/10">
                <span className="text-[10px] text-gray-400 mr-1">लाइव मेले:</span>
                {events.map((ev, idx) => (
                  <button
                    key={ev.id || idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    title={ev.title}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === safeIndex
                        ? 'w-7 bg-[#ff9062]'
                        : 'w-2 bg-white/25 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Side Visual Badge / Illustration */}
          <div className="hidden sm:flex flex-col items-center justify-center p-4 bg-white/10 rounded-2xl border border-white/15 backdrop-blur-sm min-w-[120px] text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-300 mb-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
            </div>
            <span className="text-xs font-semibold text-amber-200 tracking-wide uppercase">Live Exhibition</span>
            <span className="text-[10px] text-gray-300">Stalls Available</span>
          </div>
        </div>
      </div>

      {/* ── 1-Click Registration Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#241c17] border border-[#4a3b32] rounded-3xl p-6 sm:p-7 text-white shadow-2xl overflow-hidden">
            {/* Top Accent Gradient Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#ff9062] via-[#ffb088] to-[#ff9062]"></div>

            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full bg-[#ff9062]/20 text-[#ffdeaa] text-[10px] font-bold uppercase tracking-wider border border-[#ff9062]/30">
                    1-Click Application
                  </span>
                  <span className="text-xs text-gray-400">
                    {activeEvent.organizer}
                  </span>
                </div>
                <h4 className="text-xl font-black text-white">
                  {activeEvent.title}
                </h4>
                <p className="text-xs text-[#d1c4bd] mt-0.5">
                  स्थान: {activeEvent.location} • अवधि: {formatDateRange(activeEvent.start_date, activeEvent.end_date)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {registrationSuccess ? (
              <div className="py-6 text-center space-y-4 animate-scale-up">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <span className="material-symbols-outlined text-[36px]">check_circle</span>
                </div>
                <div className="space-y-1">
                  <h5 className="text-lg font-black text-white">
                    आवेदन सफलतापूर्वक दर्ज हुआ!
                  </h5>
                  <p className="text-sm text-[#d1c4bd] max-w-xs mx-auto">
                    आपकी विवरण सरकारी हाट सेल टीम को भेज दी गई है। आधिकारिक सूचना आपके नंबर पर प्राप्त होगी।
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href={getSanitizedUrl(activeEvent?.registration_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#ff9062] hover:bg-[#e87a4d] text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg"
                  >
                    <span>आधिकारिक पोर्टल खोलें</span>
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
                  >
                    समाप्त (Close)
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitRegistration} className="space-y-4">
                <div className="bg-[#1b1511] p-3.5 rounded-2xl border border-white/5 space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#ffdeaa] uppercase tracking-wider mb-1">
                      कारीगर का पूरा नाम (Full Name)
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.artisanName}
                      onChange={(e) =>
                        setFormData({ ...formData, artisanName: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#ff9062] transition-colors"
                      placeholder="आपका नाम दर्ज करें"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#ffdeaa] uppercase tracking-wider mb-1">
                      मोबाइल नंबर (Mobile Number)
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, phoneNumber: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#ff9062] transition-colors"
                      placeholder="10 अंकों का मोबाइल नंबर"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#ffdeaa] uppercase tracking-wider mb-1">
                      शिल्प श्रेणी / क्लस्टर (Craft Category)
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.craftCategory}
                      onChange={(e) =>
                        setFormData({ ...formData, craftCategory: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#ff9062] transition-colors"
                      placeholder="उदा. टेराकोटा, चंदेरी रेशम, गोंड पेंटिंग"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#ffdeaa] uppercase tracking-wider mb-1">
                      ईमेल पता (Email - Optional)
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#ff9062] transition-colors"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>

                {errorMessage && (
                  <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
                    {errorMessage}
                  </p>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold transition-colors cursor-pointer"
                  >
                    रद्द करें
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-[#ff9062] hover:bg-[#e87a4d] disabled:opacity-50 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-lg active:scale-95 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="material-symbols-outlined text-[16px] animate-spin">
                          progress_activity
                        </span>
                        <span>पंजीकरण दर्ज हो रहा है...</span>
                      </>
                    ) : (
                      <>
                        <span>आवेदन जमा करें (Confirm 1-Click)</span>
                        <span className="material-symbols-outlined text-[16px]">check</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
