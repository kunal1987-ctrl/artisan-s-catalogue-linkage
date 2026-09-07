import React, { useState, useMemo, useEffect } from 'react';

export const SUPPORTED_DIALECTS = [
  {
    code: 'hi',
    name: 'हिन्दी',
    englishName: 'Hindi',
    badgeText: 'हिन्दी (Hindi)',
    clusters: 'Jaipur, Varanasi, Lucknow, Delhi',
  },
  {
    code: 'en',
    name: 'English',
    englishName: 'English',
    badgeText: 'English',
    clusters: 'Pan-India / Institutional',
  },
  {
    code: 'gu',
    name: 'ગુજરાતી',
    englishName: 'Gujarati',
    badgeText: 'ગુજરાતી (Gujarati)',
    clusters: 'Kutch, Surat, Ahmedabad, Patan',
  },
  {
    code: 'mr',
    name: 'मराठी',
    englishName: 'Marathi',
    badgeText: 'मराठी (Marathi)',
    clusters: 'Kolhapur, Paithan, Pune',
  },
  {
    code: 'bn',
    name: 'বাংলা',
    englishName: 'Bengali',
    badgeText: 'বাংলা (Bengali)',
    clusters: 'Santiniketan, Murshidabad, Bankura',
  },
  {
    code: 'ta',
    name: 'தமிழ்',
    englishName: 'Tamil',
    badgeText: 'தமிழ் (Tamil)',
    clusters: 'Kanchipuram, Madurai, Thanjavur',
  },
  {
    code: 'te',
    name: 'తెలుగు',
    englishName: 'Telugu',
    badgeText: 'తెలుగు (Telugu)',
    clusters: 'Pochampally, Dharmavaram, Kondapalli',
  },
  {
    code: 'kn',
    name: 'ಕನ್ನಡ',
    englishName: 'Kannada',
    badgeText: 'ಕನ್ನಡ (Kannada)',
    clusters: 'Mysuru, Channapatna, Ilkal',
  },
  {
    code: 'ml',
    name: 'മലയാളം',
    englishName: 'Malayalam',
    badgeText: 'മലയാളം (Malayalam)',
    clusters: 'Aranmula, Balaramapuram, Thrissur',
  },
  {
    code: 'pa',
    name: 'ਪੰਜਾਬੀ',
    englishName: 'Punjabi',
    badgeText: 'ਪੰਜਾਬੀ (Punjabi)',
    clusters: 'Amritsar, Patiala, Phulkari',
  },
  {
    code: 'or',
    name: 'ଓଡ଼ିଆ',
    englishName: 'Odia',
    badgeText: 'ଓଡ଼ିଆ (Odia)',
    clusters: 'Raghurajpur, Sambalpur, Pipli',
  },
];

export const getDialectBadgeText = (code) => {
  const match = SUPPORTED_DIALECTS.find((d) => d.code === code);
  return match ? match.badgeText : 'हिन्दी (Hindi)';
};

export default function LanguageSelectorModal({
  isOpen,
  onClose,
  selectedLang = 'hi',
  onSelectLang,
  uiLanguage = 'hi',
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredDialects = useMemo(() => {
    if (!searchQuery.trim()) return SUPPORTED_DIALECTS;
    const q = searchQuery.toLowerCase().trim();
    return SUPPORTED_DIALECTS.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.englishName.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        d.clusters.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  if (!isOpen) return null;

  const isHindi = uiLanguage === 'hi';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialect-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-[#191312] text-[#fdf9f3] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#2e241e] overflow-hidden z-10 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#1e1513] text-white p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ff9062]/20 text-[#ff9062] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">record_voice_over</span>
            </div>
            <div>
              <h3 id="dialect-modal-title" className="text-base font-bold text-white tracking-tight">
                {isHindi ? 'बोलने की भाषा / बोली चुनें' : 'Select Spoken Dialect'}
              </h3>
              <p className="text-xs text-[#d4c3ba]">
                {isHindi
                  ? 'Groq Whisper एआई द्वारा सटीक आवाज़ पहचान के लिए'
                  : 'Optimize Whisper AI transcription for your regional dialect'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
            type="button"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Search bar */}
        <div className="px-4 sm:px-5 pt-3 pb-2 border-b border-white/5 bg-[#140e0d]">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isHindi ? 'भाषा खोजें (Search language)...' : 'Search dialect or region...'}
              className="w-full pl-9 pr-4 py-2 bg-[#221815] border border-stone-700/60 rounded-xl text-xs sm:text-sm text-white placeholder-stone-400 focus:outline-none focus:border-[#ff9062] focus:ring-1 focus:ring-[#ff9062]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Language Grid */}
        <div className="p-4 sm:p-5 overflow-y-auto max-h-[50vh] space-y-2 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-2.5">
          {filteredDialects.map((item) => {
            const isSelected = selectedLang === item.code;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => {
                  if (onSelectLang) onSelectLang(item.code);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left cursor-pointer transition-all active:scale-98 ${
                  isSelected
                    ? 'bg-[#ff9062]/15 border-[#ff9062] text-white ring-1 ring-[#ff9062]/50 shadow-xs'
                    : 'bg-[#221815] hover:bg-[#2c201c] border-white/10 text-stone-300 hover:text-white'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-bold text-white tracking-wide">
                      {item.name}
                    </span>
                    <span className="text-xs text-[#ff9062]/90 font-medium">
                      ({item.englishName})
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-400 block truncate mt-0.5">
                    {item.clusters}
                  </span>
                </div>

                <div className="shrink-0">
                  {isSelected ? (
                    <span className="material-symbols-outlined text-[20px] text-[#ff9062]">
                      check_circle
                    </span>
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-stone-600 block" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info & confirm */}
        <div className="p-4 bg-[#140e0d] border-t border-white/10 flex items-center justify-between gap-3 text-xs">
          <p className="text-stone-400 text-[11px] sm:text-xs leading-tight">
            💡 {isHindi ? '11 भारतीय क्षेत्रीय भाषाएं समर्थित।' : '11 Indian regional dialects supported.'}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#ff9062] text-[#191312] font-bold hover:bg-[#ff9062]/90 transition-all text-xs shrink-0 cursor-pointer shadow-sm active:scale-95"
          >
            {isHindi ? 'ठीक है (Done)' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
}
