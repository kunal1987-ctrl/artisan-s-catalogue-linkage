import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Curated Coordinates for popular Indian artisan exhibition cities and hubs
 */
const VENUE_COORDINATES = {
  // National capital & popular exhibition grounds
  'delhi': [28.6139, 77.2090],
  'new delhi': [28.6139, 77.2090],
  'dilli': [28.6139, 77.2090],
  'दिल्ली': [28.6139, 77.2090],
  'नई दिल्ली': [28.6139, 77.2090],
  'pragati maidan': [28.6186, 77.2413],
  'प्रगति मैदान': [28.6186, 77.2413],
  'dilli haat': [28.5732, 77.2075],
  'दिल्ली हाट': [28.5732, 77.2075],
  'ina': [28.5732, 77.2075],
  'pitampura': [28.6989, 77.1384],
  'janakpuri': [28.6219, 77.0878],
  'noida': [28.5355, 77.3910],
  'greater noida': [28.4744, 77.5040],
  'gurgaon': [28.4595, 77.0266],
  'gurugram': [28.4595, 77.0266],
  'गुरुग्राम': [28.4595, 77.0266],

  // Madhya Pradesh
  'bhopal': [23.2599, 77.4126],
  'भोपाल': [23.2599, 77.4126],
  'indore': [22.7196, 75.8577],
  'इंदौर': [22.7196, 75.8577],
  'gwalior': [26.2183, 78.1828],
  'ग्वालियर': [26.2183, 78.1828],
  'jabalpur': [23.1815, 79.9864],
  'जबलपुर': [23.1815, 79.9864],
  'ujjain': [23.1765, 75.7885],
  'उज्जैन': [23.1765, 75.7885],
  'chanderi': [24.7167, 78.1333],
  'चंदेरी': [24.7167, 78.1333],
  'maheshwar': [22.1764, 75.5833],
  'महेश्वर': [22.1764, 75.5833],
  'khajuraho': [24.8318, 79.9199],
  'खजुराहो': [24.8318, 79.9199],

  // Rajasthan
  'jaipur': [26.9124, 75.7873],
  'जयपुर': [26.9124, 75.7873],
  'jodhpur': [26.2389, 73.0243],
  'जोधपुर': [26.2389, 73.0243],
  'udaipur': [24.5854, 73.7125],
  'उदयपुर': [24.5854, 73.7125],
  'kota': [25.2138, 75.8648],
  'bikaner': [28.0229, 73.3119],
  'ajmer': [26.4499, 74.6399],
  'pushkar': [26.4897, 74.5511],
  'पुष्कर': [26.4897, 74.5511],

  // Maharashtra
  'mumbai': [19.0760, 72.8777],
  'मुंबई': [19.0760, 72.8777],
  'bombay': [19.0760, 72.8777],
  'pune': [18.5204, 73.8567],
  'पुणे': [18.5204, 73.8567],
  'nagpur': [21.1458, 79.0882],
  'नागपुर': [21.1458, 79.0882],
  'nashik': [19.9975, 73.7898],
  'aurangabad': [19.8762, 75.3433],
  'chhatrapati sambhajinagar': [19.8762, 75.3433],
  'kolhapur': [16.7050, 74.2433],

  // Uttar Pradesh
  'lucknow': [26.8467, 80.9462],
  'लखनऊ': [26.8467, 80.9462],
  'varanasi': [25.3176, 82.9739],
  'वाराणसी': [25.3176, 82.9739],
  'kashi': [25.3176, 82.9739],
  'काशी': [25.3176, 82.9739],
  'banaras': [25.3176, 82.9739],
  'बनारस': [25.3176, 82.9739],
  'agra': [27.1767, 78.0081],
  'आगरा': [27.1767, 78.0081],
  'kanpur': [26.4499, 80.3319],
  'कानपुर': [26.4499, 80.3319],
  'prayagraj': [25.4358, 81.8463],
  'प्रयागराज': [25.4358, 81.8463],
  'allahabad': [25.4358, 81.8463],
  'ayodhya': [26.7922, 82.1998],
  'अयोध्या': [26.7922, 82.1998],
  'mathura': [27.4924, 77.6737],
  'gorakhpur': [26.7606, 83.3732],
  'bareilly': [28.3670, 79.4304],

  // Gujarat
  'ahmedabad': [23.0225, 72.5714],
  'अहमदाबाद': [23.0225, 72.5714],
  'surat': [21.1702, 72.8311],
  'सूरत': [21.1702, 72.8311],
  'vadodara': [22.3072, 73.1812],
  'rajkot': [22.3039, 70.8022],
  'bhuj': [23.2420, 69.6669],
  'भुज': [23.2420, 69.6669],
  'kutch': [23.7337, 69.8597],
  'कच्छ': [23.7337, 69.8597],

  // South
  'bengaluru': [12.9716, 77.5946],
  'bangalore': [12.9716, 77.5946],
  'बेंगलुरु': [12.9716, 77.5946],
  'mysuru': [12.2958, 76.6394],
  'chennai': [13.0827, 80.2707],
  'चेन्नई': [13.0827, 80.2707],
  'hyderabad': [17.3850, 78.4867],
  'हैदराबाद': [17.3850, 78.4867],
  'kochi': [9.9312, 76.2673],
  'कोच्चि': [9.9312, 76.2673],
  'thiruvananthapuram': [8.5241, 76.9366],
  'coimbatore': [11.0168, 76.9558],
  'madurai': [9.9252, 78.1198],

  // East & North East
  'kolkata': [22.5726, 88.3639],
  'कोलकाता': [22.5726, 88.3639],
  'patna': [25.5941, 85.1376],
  'पटना': [25.5941, 85.1376],
  'ranchi': [23.3441, 85.3096],
  'रांची': [23.3441, 85.3096],
  'bhubaneswar': [20.2961, 85.8245],
  'भुवनेश्वर': [20.2961, 85.8245],
  'puri': [19.8135, 85.8312],
  'guwahati': [26.1445, 91.7362],
  'गुवाहाटी': [26.1445, 91.7362],
  'shillong': [25.5788, 91.8933],
  'imphal': [24.8170, 93.9368],
  'agartala': [23.8315, 91.2868],

  // North
  'chandigarh': [30.7333, 76.7794],
  'चंडीगढ़': [30.7333, 76.7794],
  'amritsar': [31.6340, 74.8723],
  'अमृतसर': [31.6340, 74.8723],
  'ludhiana': [30.9010, 75.8573],
  'dehradun': [30.3165, 78.0322],
  'देहरादून': [30.3165, 78.0322],
  'rishikesh': [30.0869, 78.2676],
  'haridwar': [29.9457, 78.1642],
  'हरिद्वार': [29.9457, 78.1642],
  'shimla': [31.1048, 77.1734],
  'शिमला': [31.1048, 77.1734],
  'srinagar': [34.0837, 74.7973],
  'श्रीनगर': [34.0837, 74.7973],
  'jammu': [32.7266, 74.8570],
  'जम्मू': [32.7266, 74.8570],
  'leh': [34.1526, 77.5771],
  'ladakh': [34.1526, 77.5771],

  // States
  'madhya pradesh': [22.9734, 78.6569],
  'मध्य प्रदेश': [22.9734, 78.6569],
  'rajasthan': [27.0238, 74.2179],
  'राजस्थान': [27.0238, 74.2179],
  'uttar pradesh': [26.8467, 80.9462],
  'उत्तर प्रदेश': [26.8467, 80.9462],
  'maharashtra': [19.7515, 75.7139],
  'महाराष्ट्र': [19.7515, 75.7139],
  'gujarat': [22.2587, 71.1924],
  'गुजरात': [22.2587, 71.1924],
  'bihar': [25.0961, 85.3131],
  'बिहार': [25.0961, 85.3131],
  'west bengal': [22.9868, 87.8550],
  'पश्चिम बंगाल': [22.9868, 87.8550],
  'karnataka': [15.3173, 75.7139],
  'कर्नाटक': [15.3173, 75.7139],
  'tamil nadu': [11.1271, 78.6569],
  'तमिलनाडु': [11.1271, 78.6569],
  'kerala': [10.8505, 76.2711],
  'केरल': [10.8505, 76.2711],
  'punjab': [31.1471, 75.3412],
  'पंजाब': [31.1471, 75.3412],
  'haryana': [29.0588, 76.0856],
  'हरियाणा': [29.0588, 76.0856],
  'assam': [26.2006, 92.9376],
  'असम': [26.2006, 92.9376],
  'india': [22.9734, 78.6569],
  'भारत': [22.9734, 78.6569],
};

function resolveCoordinates(locationText) {
  if (!locationText) return { coords: [22.9734, 78.6569], zoom: 5, matched: false };
  const lower = locationText.toLowerCase();

  // Sort keys by length descending to match specific venues before cities/states
  const sortedKeys = Object.keys(VENUE_COORDINATES).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (lower.includes(key)) {
      const zoom = key === 'india' || key === 'भारत' ? 5 : 13;
      return { coords: VENUE_COORDINATES[key], zoom, matched: true };
    }
  }

  return { coords: [22.9734, 78.6569], zoom: 5, matched: false };
}

/**
 * Creates custom glowing artisan pin icon
 */
function createArtisanPin() {
  return L.divIcon({
    className: 'artisan-map-pin',
    html: `
      <div style="position:relative; width:40px; height:40px; display:flex; align-items:center; justify-content:center;">
        <div style="position:absolute; width:36px; height:36px; border-radius:50%; background:rgba(234,88,12,0.35); animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
        <div style="position:relative; width:32px; height:32px; border-radius:50%; background:#ea580c; border:2px solid #ffffff; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 14px rgba(0,0,0,0.5); color:white;">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
}

/**
 * EventMapModal
 * In-App interactive map modal powered by OpenStreetMap & Leaflet.
 * Eliminates "maps.google.com refused to connect" iframe X-Frame-Options errors.
 * Provides live native Leaflet tile navigation and a 1-tap Google Maps Navigation link.
 */
export default function EventMapModal({ isOpen, onClose, locationName, eventTitle }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [geoStatus, setGeoStatus] = useState('loading'); // 'loading' | 'ready' | 'geocoding'

  // Escape key and scroll lock
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, onClose]);

  // Leaflet Map Initialization & Geocoding
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    const rawLocation = (locationName || 'India').trim();
    const cleanLocation = rawLocation.replace(/[^\p{L}\p{N}\s,.-]/gu, '').trim() || 'India';
    const { coords: initialCoords, zoom: initialZoom, matched } = resolveCoordinates(cleanLocation);

    // Destroy existing instance to prevent duplicate container attachments
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Initialize Leaflet Map
    const map = L.map(mapContainerRef.current, {
      center: initialCoords,
      zoom: initialZoom,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true,
    });

    // High performance OpenStreetMap Tile Layer
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
    }).addTo(map);

    // Add glowing pin marker
    const pin = createArtisanPin();
    const marker = L.marker(initialCoords, { icon: pin }).addTo(map);
    const safeTitle = (eventTitle || 'Exhibition Venue').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeLocation = cleanLocation.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    marker.bindPopup(`
      <div style="font-family:inherit; min-width:180px; padding:2px;">
        <div style="font-weight:700; font-size:13px; color:#1c1917; margin-bottom:4px;">${safeTitle}</div>
        <div style="font-size:11px; color:#78716c; line-height:1.4;">${safeLocation}</div>
        <div style="margin-top:6px; font-size:10px; font-weight:600; color:#ea580c;">📍 Shilp Setu Exhibition Venue</div>
      </div>
    `).openPopup();

    mapInstanceRef.current = map;
    markerRef.current = marker;
    setGeoStatus('ready');

    // Smooth resize handle after modal enters DOM
    const resizeTimer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    // If local dictionary didn't pinpoint city directly, query Nominatim in background
    let abortController = new AbortController();
    if (!matched && cleanLocation !== 'India') {
      setGeoStatus('geocoding');
      const searchQuery = encodeURIComponent(`${cleanLocation}, India`);
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}&limit=1`, {
        signal: abortController.signal,
        headers: { 'Accept-Language': 'en,hi' },
      })
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (data && data.length > 0 && mapInstanceRef.current) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            const newPos = [lat, lon];
            mapInstanceRef.current.flyTo(newPos, 14, { duration: 1.2 });
            markerRef.current?.setLatLng(newPos).openPopup();
          }
          setGeoStatus('ready');
        })
        .catch(() => {
          setGeoStatus('ready');
        });
    }

    return () => {
      clearTimeout(resizeTimer);
      abortController.abort();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, locationName, eventTitle]);

  if (!isOpen) return null;

  const rawLocation = (locationName || 'India').trim();
  const cleanLocation = rawLocation.replace(/[^\p{L}\p{N}\s,.-]/gu, '').trim() || 'India';
  const queryStr = cleanLocation.toLowerCase().includes('india')
    ? cleanLocation
    : `${cleanLocation}, India`;
  const searchQuery = encodeURIComponent(queryStr);
  const nativeMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${searchQuery}`;

  const handleRecenter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (mapInstanceRef.current && markerRef.current) {
      const pos = markerRef.current.getLatLng();
      mapInstanceRef.current.flyTo(pos, 14, { duration: 0.8 });
      markerRef.current.openPopup();
    }
  };

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
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-950/80 text-orange-400 border border-orange-800/50">
                LIVE VENUE MAP
              </span>
              {geoStatus === 'geocoding' && (
                <span className="text-[10px] text-stone-400 animate-pulse">
                  Locating exact address...
                </span>
              )}
            </div>
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

        {/* Interactive Native Leaflet Map Container */}
        <div className="relative w-full h-80 sm:h-96 rounded-xl overflow-hidden border border-stone-800 bg-stone-950 shadow-inner">
          <div 
            ref={mapContainerRef} 
            className="w-full h-full z-10"
            style={{ background: '#1c1917' }}
          />

          {/* Quick Floating Recenter Button */}
          <button
            type="button"
            onClick={handleRecenter}
            className="absolute top-3 right-3 z-[400] px-2.5 py-1.5 bg-stone-900/90 hover:bg-stone-800 text-stone-200 hover:text-white text-xs font-semibold rounded-lg border border-stone-700 shadow-md backdrop-blur-sm transition-all flex items-center gap-1.5 cursor-pointer"
            title="Recenter venue"
          >
            <span>📍</span>
            <span>Venue Center</span>
          </button>
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
