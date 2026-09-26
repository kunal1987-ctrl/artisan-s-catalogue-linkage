# Shilp Setu — Global Voice Assistant & Audio System Documentation

## Overview

The **Shilp Setu Global Audio Assistant** is an enterprise-grade, accessible spoken instruction system designed for rural artisans and low-digital-literacy users. It provides spoken navigation, guidance, and status confirmations across the entire product lifecycle—from camera capture to marketplace publishing.

---

## 1. System Architecture

```text
                               SHILP SETU APPLICATION
                                         │
                                         ▼
                            AudioAssistantProvider (Root)
                                         │
                                         ▼
                               AudioAssistantService
                                         │
                    ┌────────────────────┴────────────────────┐
                    ▼                                         ▼
            Audio State Manager                       In-Memory URL Cache
            - isUnlocked                              - key + language lookup
            - isPlaying                               - deduplication (<800ms)
            - audioEnabled (localStorage)             - instant interruption
                    │                                         │
                    └────────────────────┬────────────────────┘
                                         ▼
                           Pre-Generated MP3 Files
                       (Supabase Storage & Static CDN)
                                         │
                                         ▼
                           Central HTML <audio> Element
                           (One-time first gesture unlock)
                                         │
                                         ▼
                           Cross-Platform Mobile Audio
                        (iOS Safari, Android Chrome, Desktop)
```

### Generation Pipeline (Admin / One-Time)

```text
Instruction Text (15 Prompts)
       ↓
Server-Side / Build-Time TTS Generator (`generate-all-voice-instructions.js`)
       ↓
High-Quality MP3 Files (44.1 kHz, 128 kbps mono)
       ↓
Stored in:
1. `artisan-web/public/audio-instructions/{lang}/{key}.mp3` (Instant local bundled fallback)
2. `supabase/storage/buckets/audio-instructions/{lang}/{key}.mp3` (Cloud CDN)
       ↓
Metadata indexed in PostgreSQL `audio_instructions` table
```

---

## 2. Browser Autoplay & Gesture Unlock Lifecycle

Modern browsers (iOS Safari, Android Chrome, Desktop browsers) restrict unmuted audio playback until the user performs an explicit gesture on the page.

### Activation Flow

1. **App Mounts**:
   - `AudioAssistantProvider` mounts at the root within `BrowserRouter`.
   - The central `<audio id="shilp-setu-global-audio" preload="auto">` element is initialized.
   - Preloads critical audio assets (`welcome.mp3`, `camera_instruction.mp3`).
   - Registers a one-time global capture listener on `window` for `['pointerdown', 'touchstart', 'click', 'keydown']`.

2. **First User Interaction**:
   - The user taps or clicks **anywhere** on the screen.
   - `audioAssistantService.unlockAudio()` resumes the Web Audio `AudioContext` and plays a microscopic silent buffer.
   - Marks `isUnlocked = true`.
   - Automatically plays the `welcome` voice instruction (only once per session).
   - The activation listener is immediately removed so subsequent clicks do not re-trigger welcome audio.

3. **Autoplay Rejection Recovery**:
   - If browser power-saving or strict security policies block playback:
     - The promise rejection is caught safely (no crash or UI freeze).
     - State sets `requiresUserGesture = true`.
     - The floating `<AudioAssistantWidget />` displays an accessible pulsing banner:
       `🔊 आवाज चालू करें (Tap to Hear) — बोलकर मार्गदर्शन सुनने के लिए दबाएं`.
     - Tapping this button unlocks the audio and replays the current instruction.

---

## 3. Supported Languages & Fallback Hierarchy

The system supports 6 core regional languages:

| Code | Language | Native Name |
| :--- | :--- | :--- |
| `hi` | Hindi (Default) | हिन्दी |
| `en` | English | English |
| `mr` | Marathi | मराठी |
| `bn` | Bengali | বাংলা |
| `te` | Telugu | తెలుగు |
| `ta` | Tamil | தமிழ் |

### Fallback Chain
If an audio file or transcript is missing in the artisan's selected language:
```text
Selected Language (e.g., 'mr') ──> Hindi ('hi') ──> English ('en')
```

---

## 4. Standard Audio Instruction Registry

All 15 standard application instructions:

| Instruction Key | Purpose | Hindi Preview | English Preview |
| :--- | :--- | :--- | :--- |
| `welcome` | First app open / landing | नमस्ते! शिल्प सेतु में आपका स्वागत है... | Welcome to Shilp Setu... |
| `camera_instruction` | Camera page / viewfinder | कैमरा खोलिए और अपने उत्पाद की साफ फोटो लीजिए। | Open the camera and take a clear photo... |
| `multiple_photo_instruction` | Multi-angle photo flow | उत्पाद के अलग-अलग कोणों से दो या तीन फोटो लीजिए। | Take two or three photos from different angles. |
| `mic_instruction` | Microphone / voice note | अब अपने उत्पाद के बारे में अपनी भाषा में बताइए। | Now tell us about your product in your language. |
| `recording_started` | Recording begins | मैं सुन रहा हूँ। अपने उत्पाद के बारे में बताइए। | I am listening. Please describe your product. |
| `recording_stopped` | Recording finishes | आपकी आवाज़ रिकॉर्ड हो गई है। | Your voice has been recorded. |
| `processing_instruction` | AI catalog generation | थोड़ा इंतज़ार कीजिए। शिल्प सेतु आपकी फोटो और आवाज़ को... | Please wait a moment. Shilp Setu is analyzing... |
| `product_generated` | AI draft ready | आपका प्रोडक्ट तैयार है। आप डिटेल्स को देख सकते हैं। | Your product draft is ready. Review details. |
| `price_instruction` | Price suggestion start | अब शिल्प सेतु आपके प्रोडक्ट के लिए एक उपयुक्त दाम... | Now Shilp Setu is suggesting a fair market price. |
| `price_generated` | Price calculated | दाम का सुझाव तैयार है। आप इसे देखकर बदल सकते हैं। | The price suggestion is ready. |
| `review_instruction` | Review screen | प्रोडक्ट की डिटेल्स चेक कीजिए। सब सही होने पर... | Check your product details. Once verified, tap publish. |
| `publishing_instruction` | Publish in progress | आपका प्रोडक्ट मार्केटप्लेस पर पब्लिश किया जा रहा है। | Your product is being published to marketplace. |
| `published_successfully` | Publish successful | बहुत बढ़िया! आपका प्रोडक्ट सफलतापूर्वक पब्लिश हो गया है। | Awesome! Your product has been published! |
| `generic_error` | Generic error catch | कुछ दिक्कत आ गई है। कृपया दोबारा कोशिश कीजिए। | Something went wrong. Please try again. |
| `network_error` | Network disconnection | इंटरनेट कनेक्शन चेक कीजिए और दोबारा कोशिश कीजिए। | Please check your internet connection. |

---

## 5. Usage in React Components

### `useAudioAssistant` Hook

```jsx
import React from 'react';
import useAudioAssistant from '../hooks/useAudioAssistant';

export default function MyComponent() {
  const {
    playInstruction,
    stopInstruction,
    pauseInstruction,
    resumeInstruction,
    replayCurrentInstruction,
    isPlaying,
    isUnlocked,
    audioEnabled,
    toggleAudio,
  } = useAudioAssistant();

  return (
    <div>
      <button onClick={() => playInstruction('camera_instruction')}>
        Play Camera Guidance
      </button>

      <button onClick={() => toggleAudio()}>
        {audioEnabled ? 'Mute Voice' : 'Enable Voice'}
      </button>

      {isPlaying && <span>Playing audio...</span>}
    </div>
  );
}
```

### Direct Service Usage (Outside React / Utilities)

```javascript
import audioAssistantService from './services/audioAssistantService';

// Play instruction
await audioAssistantService.playInstruction('processing_instruction');

// Stop current instruction
audioAssistantService.stopInstruction();
```

---

## 6. Supabase Setup

### Database Table: `public.audio_instructions`

Migration file located at [supabase/migrations/20260927_audio_instructions.sql](file:///d:/artisan%20catalogue%20hub%20project/supabase/migrations/20260927_audio_instructions.sql):

```sql
CREATE TABLE IF NOT EXISTS public.audio_instructions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL,
    language TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    duration_ms INTEGER DEFAULT NULL,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT audio_instructions_key_lang_ver UNIQUE (key, language, version)
);

-- Public read access
ALTER TABLE public.audio_instructions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to audio_instructions"
    ON public.audio_instructions FOR SELECT
    USING (is_active = true);
```

### Storage Bucket: `audio-instructions`

Bucket structure:
```text
audio-instructions/
  ├── hi/
  │   ├── welcome.mp3
  │   ├── camera_instruction.mp3
  │   └── ... (15 files)
  ├── en/
  ├── mr/
  ├── bn/
  ├── te/
  └── ta/
```

Public URL format:
`https://<project-ref>.supabase.co/storage/v1/object/public/audio-instructions/{lang}/{key}.mp3`

---

## 7. How to Add a New Instruction

1. **Add the Key & Transcripts** in [artisan-web/src/constants/audioInstructions.js](file:///d:/artisan%20catalogue%20hub%20project/artisan-web/src/constants/audioInstructions.js):
   ```javascript
   export const AUDIO_INSTRUCTION_KEYS = {
     // ...
     PACKAGING_INSTRUCTION: 'packaging_instruction',
   };
   
   AUDIO_INSTRUCTIONS.packaging_instruction = {
     id: 'packaging_instruction',
     title: { hi: 'पैकेजिंग निर्देश', en: 'Packaging Instruction' },
     transcripts: {
       hi: 'अपने उत्पाद को सुरक्षित रूप से पैक करें।',
       en: 'Pack your product securely with bubble wrap.',
     }
   };
   ```

2. **Add to Generator** in [generate-all-voice-instructions.js](file:///d:/artisan%20catalogue%20hub%20project/generate-all-voice-instructions.js).

3. **Run the Generator**:
   ```bash
   node generate-all-voice-instructions.js
   ```

4. **Call in your Component**:
   ```javascript
   playInstruction('packaging_instruction');
   ```

---

## 8. How to Add a New Language

1. Add the language code to `SUPPORTED_AUDIO_LANGUAGES` in [artisan-web/src/constants/audioInstructions.js](file:///d:/artisan%20catalogue%20hub%20project/artisan-web/src/constants/audioInstructions.js).
2. Add the translated strings under each instruction in `AUDIO_INSTRUCTIONS`.
3. Run `node generate-all-voice-instructions.js` to produce the new localized MP3 files.

---

## 9. Environment Variables

| Variable | Description |
| :--- | :--- |
| `VITE_SUPABASE_URL` | Supabase Project URL (resolves cloud audio bucket) |
| `VITE_SUPABASE_ANON_KEY` | Public anonymous Supabase key |

*Note: Zero TTS API keys are needed in client code.*

---

## 10. Testing Across Devices

### Android Chrome
1. Open the application.
2. Tap anywhere on the page: verify the welcome prompt plays.
3. Open camera (`/capture`): verify `camera_instruction.mp3` plays.
4. Record audio: verify `recording_started.mp3` plays, then `recording_stopped.mp3`.
5. Tap Mute on the `<AudioAssistantWidget />`: verify all playback stops.

### iPhone Safari
1. Open in Safari Mobile.
2. Tap anywhere on the page: verify audio unlocks cleanly without silent rejection.
3. Navigate to `/review`: verify `review_instruction.mp3` plays.
4. Test hardware mute switch vs on-screen unmute.

### Desktop Chrome / Edge
1. Open in Incognito mode.
2. First interaction unlocks and plays welcome audio once.
3. Refresh page: verify welcome audio plays again upon first user interaction in new session.
