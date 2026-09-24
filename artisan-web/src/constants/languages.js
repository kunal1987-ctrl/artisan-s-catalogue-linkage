/**
 * languages.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Supported Regional Language Configuration for Shilp Setu
 * Configured with standard BCP 47 language codes for TTS compatibility.
 *
 * Fallback & Platform Note:
 * While the Web Speech API covers major regional languages like Tamil (தமிழ்)
 * and Telugu (తెలుగు) universally across devices, minority languages like
 * Santali (संताली) or Sindhi (سنڌي) depend heavily on the user's operating system
 * language packs. If native TTS fails for these, it will gracefully degrade
 * to visual text only.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const SUPPORTED_LANGUAGES = [
  {
    code: 'hi',
    ttsCode: 'hi-IN',
    name: 'Hindi',
    nativeName: 'हिंदी',
    native: 'हिंदी',
    script: 'Devanagari',
    region: 'North & Central India',
    keyChar: 'अ',
    color: '#9c441c',
  },
  {
    code: 'en',
    ttsCode: 'en-IN',
    name: 'English',
    nativeName: 'English',
    native: 'English',
    script: 'Latin',
    region: 'Pan-India / Institutional',
    keyChar: 'A',
    color: '#2e241e',
  },
  {
    code: 'bn',
    ttsCode: 'bn-IN',
    name: 'Bengali',
    nativeName: 'বাংলা',
    native: 'বাংলা',
    script: 'Bengali',
    region: 'West Bengal & East India',
    keyChar: 'অ',
    color: '#b45309',
  },
  {
    code: 'mr',
    ttsCode: 'mr-IN',
    name: 'Marathi',
    nativeName: 'मराठी',
    native: 'मराठी',
    script: 'Devanagari',
    region: 'Maharashtra & West India',
    keyChar: 'म',
    color: '#c2410c',
  },
  {
    code: 'or-IN',
    ttsCode: 'or-IN',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    native: 'ଓଡ଼ିଆ',
    script: 'Odia',
    region: 'Odisha & East India',
    keyChar: 'ଓ',
    color: '#0284c7',
  },
  {
    code: 'pa-IN',
    ttsCode: 'pa-IN',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    native: 'ਪੰਜਾਬੀ',
    script: 'Gurmukhi',
    region: 'Punjab & North-West India',
    keyChar: 'ਪ',
    color: '#d97706',
  },
  {
    code: 'sa-IN',
    ttsCode: 'sa-IN',
    name: 'Sanskrit',
    nativeName: 'संस्कृत',
    native: 'संस्कृत',
    script: 'Devanagari',
    region: 'Pan-India Classical',
    keyChar: 'सं',
    color: '#7c3aed',
  },
  {
    code: 'sat-IN',
    ttsCode: 'sat-IN',
    name: 'Santali',
    nativeName: 'संताली',
    native: 'संताली',
    script: 'Ol Chiki / Devanagari',
    region: 'Jharkhand, Odisha & West Bengal',
    keyChar: 'सं',
    color: '#059669',
  },
  {
    code: 'sd-IN',
    ttsCode: 'sd-IN',
    name: 'Sindhi',
    nativeName: 'سنڌي',
    native: 'سنڌي',
    script: 'Arabic / Devanagari',
    region: 'Sindhi Heritage & Western India',
    keyChar: 'س',
    color: '#b45309',
  },
  {
    code: 'ta-IN',
    ttsCode: 'ta-IN',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    native: 'தமிழ்',
    script: 'Tamil',
    region: 'Tamil Nadu & South India',
    keyChar: 'அ',
    color: '#047857',
  },
  {
    code: 'te-IN',
    ttsCode: 'te-IN',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    native: 'తెలుగు',
    script: 'Telugu',
    region: 'Andhra Pradesh & Telangana',
    keyChar: 'అ',
    color: '#4338ca',
  },
  {
    code: 'ur-IN',
    ttsCode: 'ur-IN',
    name: 'Urdu',
    nativeName: 'اردو',
    native: 'اردو',
    script: 'Perso-Arabic',
    region: 'Pan-India & Deccan',
    keyChar: 'ا',
    color: '#15803d',
  },
];
