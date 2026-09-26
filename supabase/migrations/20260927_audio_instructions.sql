-- =============================================================================
-- Migration: 20260927_audio_instructions.sql
-- Description: Schema and storage configuration for Shilp Setu Global Audio Assistant
-- =============================================================================

-- 1. Create dedicated metadata table for pre-generated audio instructions
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

-- Index for instant key + language lookups
CREATE INDEX IF NOT EXISTS idx_audio_instructions_lookup 
ON public.audio_instructions (key, language, is_active);

-- Enable RLS
ALTER TABLE public.audio_instructions ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active audio instructions
DROP POLICY IF EXISTS "Allow public read access to audio_instructions" ON public.audio_instructions;
CREATE POLICY "Allow public read access to audio_instructions"
    ON public.audio_instructions FOR SELECT
    USING (is_active = true);

-- 2. Configure dedicated Supabase Storage bucket for audio instructions
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-instructions', 'audio-instructions', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Ensure public read policy for audio-instructions storage bucket
DROP POLICY IF EXISTS "Public can view audio-instructions" ON storage.objects;
CREATE POLICY "Public can view audio-instructions"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'audio-instructions');

-- 3. Seed initial metadata for Hindi (Primary) and English instructions
INSERT INTO public.audio_instructions (key, language, storage_path, public_url, version, is_active)
VALUES
  -- Hindi (hi)
  ('welcome', 'hi', 'hi/welcome.mp3', '/audio-instructions/hi/welcome.mp3', 1, true),
  ('camera_instruction', 'hi', 'hi/camera_instruction.mp3', '/audio-instructions/hi/camera_instruction.mp3', 1, true),
  ('multiple_photo_instruction', 'hi', 'hi/multiple_photo_instruction.mp3', '/audio-instructions/hi/multiple_photo_instruction.mp3', 1, true),
  ('mic_instruction', 'hi', 'hi/mic_instruction.mp3', '/audio-instructions/hi/mic_instruction.mp3', 1, true),
  ('recording_started', 'hi', 'hi/recording_started.mp3', '/audio-instructions/hi/recording_started.mp3', 1, true),
  ('recording_stopped', 'hi', 'hi/recording_stopped.mp3', '/audio-instructions/hi/recording_stopped.mp3', 1, true),
  ('processing_instruction', 'hi', 'hi/processing_instruction.mp3', '/audio-instructions/hi/processing_instruction.mp3', 1, true),
  ('product_generated', 'hi', 'hi/product_generated.mp3', '/audio-instructions/hi/product_generated.mp3', 1, true),
  ('price_instruction', 'hi', 'hi/price_instruction.mp3', '/audio-instructions/hi/price_instruction.mp3', 1, true),
  ('price_generated', 'hi', 'hi/price_generated.mp3', '/audio-instructions/hi/price_generated.mp3', 1, true),
  ('review_instruction', 'hi', 'hi/review_instruction.mp3', '/audio-instructions/hi/review_instruction.mp3', 1, true),
  ('publishing_instruction', 'hi', 'hi/publishing_instruction.mp3', '/audio-instructions/hi/publishing_instruction.mp3', 1, true),
  ('published_successfully', 'hi', 'hi/published_successfully.mp3', '/audio-instructions/hi/published_successfully.mp3', 1, true),
  ('generic_error', 'hi', 'hi/generic_error.mp3', '/audio-instructions/hi/generic_error.mp3', 1, true),
  ('network_error', 'hi', 'hi/network_error.mp3', '/audio-instructions/hi/network_error.mp3', 1, true),

  -- English (en)
  ('welcome', 'en', 'en/welcome.mp3', '/audio-instructions/en/welcome.mp3', 1, true),
  ('camera_instruction', 'en', 'en/camera_instruction.mp3', '/audio-instructions/en/camera_instruction.mp3', 1, true),
  ('multiple_photo_instruction', 'en', 'en/multiple_photo_instruction.mp3', '/audio-instructions/en/multiple_photo_instruction.mp3', 1, true),
  ('mic_instruction', 'en', 'en/mic_instruction.mp3', '/audio-instructions/en/mic_instruction.mp3', 1, true),
  ('recording_started', 'en', 'en/recording_started.mp3', '/audio-instructions/en/recording_started.mp3', 1, true),
  ('recording_stopped', 'en', 'en/recording_stopped.mp3', '/audio-instructions/en/recording_stopped.mp3', 1, true),
  ('processing_instruction', 'en', 'en/processing_instruction.mp3', '/audio-instructions/en/processing_instruction.mp3', 1, true),
  ('product_generated', 'en', 'en/product_generated.mp3', '/audio-instructions/en/product_generated.mp3', 1, true),
  ('price_instruction', 'en', 'en/price_instruction.mp3', '/audio-instructions/en/price_instruction.mp3', 1, true),
  ('price_generated', 'en', 'en/price_generated.mp3', '/audio-instructions/en/price_generated.mp3', 1, true),
  ('review_instruction', 'en', 'en/review_instruction.mp3', '/audio-instructions/en/review_instruction.mp3', 1, true),
  ('publishing_instruction', 'en', 'en/publishing_instruction.mp3', '/audio-instructions/en/publishing_instruction.mp3', 1, true),
  ('published_successfully', 'en', 'en/published_successfully.mp3', '/audio-instructions/en/published_successfully.mp3', 1, true),
  ('generic_error', 'en', 'en/generic_error.mp3', '/audio-instructions/en/generic_error.mp3', 1, true),
  ('network_error', 'en', 'en/network_error.mp3', '/audio-instructions/en/network_error.mp3', 1, true)
ON CONFLICT (key, language, version) DO UPDATE 
SET public_url = EXCLUDED.public_url,
    updated_at = now();
