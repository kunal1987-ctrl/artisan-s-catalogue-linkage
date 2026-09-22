import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

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
    registration_url: 'https://rural.nic.in',
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
  },
];

export default function HaatEventCard({ artisanProfile = null, user = null }) {
  // Cache-First State Initialization
  const [events, setEvents] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
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

  const [formData, setFormData] = useState({
    artisanName: '',
    phoneNumber: '',
    craftCategory: 'हस्तशिल्प और हथकरघा (Handicrafts & Handloom)',
    email: '',
  });

  useEffect(() => {
    setFormData({
      artisanName:
        artisanProfile?.name ||
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        'कारीगर',
      phoneNumber:
        artisanProfile?.phone ||
        user?.user_metadata?.phone_number ||
        user?.phone ||
        '9876543210',
      craftCategory:
        artisanProfile?.cluster || 'टेराकोटा एवं मिट्टी शिल्प (Terracotta & Pottery)',
      email: user?.email || artisanProfile?.email || '',
    });
  }, [user, artisanProfile]);

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
        console.warn('Network offline during haat events query:', err);
      }
    }

    fetchHaatEvents();

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
              const exists = prevEvents.some((ev) => ev.id === newRecord.id);
              updated = exists
                ? prevEvents.map((ev) => (ev.id === newRecord.id ? newRecord : ev))
                : [...prevEvents, newRecord];
            } else if (eventType === 'UPDATE') {
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
      .subscribe();

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

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [currentIndex]);

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

      const textToSpeak = activeEvent?.description_hi || activeEvent?.title || '';
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.9;

      const voicesList =
        availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();

      const suitableVoice = voicesList.find(
        (voice) => voice.lang && (voice.lang.includes('hi') || voice.lang.includes('IN'))
      );

      if (suitableVoice) {
        utterance.voice = suitableVoice;
        utterance.lang = suitableVoice.lang;
      } else {
        utterance.lang = 'hi-IN';
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis safeguard caught exception:', err);
      setIsSpeaking(false);
    }
  };

  const handleOpenRegistration = () => {
    setRegistrationSuccess(false);
    setErrorMessage('');
    setIsModalOpen(true);
  };

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

      await supabase.from('event_registrations').insert([payload]);
      setRegistrationSuccess(true);
    } catch (err) {
      console.error('Registration error:', err);
      setRegistrationSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isRegistrationOpen = activeEvent.status === 'REGISTRATION OPEN';

  return (
    <>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="mt-2 relative overflow-hidden bg-gradient-to-br from-[#2e241e] to-[#4a3b32] rounded-3xl p-5 sm:p-6 sm:px-8 border border-[#4a3b32] shadow-md group transition-all duration-300"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {activeEvent.is_govt_sponsored && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#ff9062]/20 text-[#ffdeaa] text-[10px] font-bold uppercase tracking-wider border border-[#ff9062]/30 flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff9062] animate-pulse"></span>
                  Govt Sponsored
                </span>
              )}

              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 shadow-sm ${
                  isRegistrationOpen
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 ring-1 ring-emerald-500/20'
                    : 'bg-sky-500/20 text-sky-300 border-sky-500/30 ring-1 ring-sky-500/20'
                }`}
              >
                {activeEvent.status}
              </span>

              {events.length > 1 && (
                <div className="ml-auto sm:ml-2 flex items-center gap-1.5 bg-black/40 rounded-full px-2.5 py-0.5 border border-white/10 text-[10px] text-[#d1c4bd]">
                  <span>{safeIndex + 1} / {events.length}</span>
                  <button
                    onClick={() =>
                      setCurrentIndex((prev) => (prev === 0 ? events.length - 1 : prev - 1))
                    }
                    className="hover:text-white p-0.5 transition-colors cursor-pointer"
                  >
                    ‹
                  </button>
                  <button
                    onClick={() =>
                      setCurrentIndex((prev) => (prev === events.length - 1 ? 0 : prev + 1))
                    }
                    className="hover:text-white p-0.5 transition-colors cursor-pointer"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white leading-tight mb-1 tracking-tight">
              {activeEvent.title}
            </h3>

            <div className="text-[#d1c4bd] text-sm font-medium mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              <span>🏛️ {activeEvent.organizer}</span>
              <span>📍 {activeEvent.location}</span>
              <span>📅 {formatDateRange(activeEvent.start_date, activeEvent.end_date)}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleToggleSpeech}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border active:scale-95 cursor-pointer ${
                  isSpeaking
                    ? 'bg-amber-500/25 text-amber-200 border-amber-400/40 shadow-inner'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/10 hover:border-white/20'
                }`}
              >
                {isSpeaking ? '⏹ रोकें (Stop)' : '🔊 विवरण सुनें'}
              </button>

              <button
                type="button"
                onClick={handleOpenRegistration}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ff9062] hover:bg-[#e87a4d] text-white text-sm font-black transition-all shadow-lg hover:shadow-orange-500/25 active:scale-95 cursor-pointer"
              >
                <span>अभी पंजीकरण करें</span>
                <span>→</span>
              </button>
            </div>

            {/* Multi-Event Carousel Dots / Quick Navigation */}
            {events.length > 1 && (
              <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-white/10">
                <span className="text-[10px] text-gray-400 mr-1">मेले:</span>
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
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-[#241c17] border border-[#4a3b32] rounded-3xl p-6 sm:p-7 text-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h4 className="text-xl font-black text-white">{activeEvent.title}</h4>
                <p className="text-xs text-[#d1c4bd] mt-0.5">
                  स्थान: {activeEvent.location} • अवधि: {formatDateRange(activeEvent.start_date, activeEvent.end_date)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {registrationSuccess ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 text-2xl font-bold">
                  ✓
                </div>
                <h5 className="text-lg font-black text-white">आवेदन सफलतापूर्वक दर्ज हुआ!</h5>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold"
                >
                  समाप्त
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitRegistration} className="space-y-4">
                <div className="bg-[#1b1511] p-3.5 rounded-2xl border border-white/5 space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#ffdeaa] uppercase tracking-wider mb-1">
                      कारीगर का पूरा नाम
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.artisanName}
                      onChange={(e) => setFormData({ ...formData, artisanName: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#ffdeaa] uppercase tracking-wider mb-1">
                      मोबाइल नंबर
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#ffdeaa] uppercase tracking-wider mb-1">
                      शिल्प श्रेणी
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.craftCategory}
                      onChange={(e) => setFormData({ ...formData, craftCategory: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 text-gray-300 text-xs font-bold"
                  >
                    रद्द करें
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-[#ff9062] hover:bg-[#e87a4d] text-white text-xs font-black"
                  >
                    {isSubmitting ? 'पंजीकरण हो रहा है...' : 'आवेदन जमा करें →'}
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
