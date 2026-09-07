-- artisan_images_bucket_and_policies
-- Ensure bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('artisan-images', 'artisan-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop prior conflicting policies if any
DROP POLICY IF EXISTS "Public Access to artisan-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow Uploads to artisan-images" ON storage.objects;

-- Create open access policies for demo
CREATE POLICY "Public Access to artisan-images"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'artisan-images' );

CREATE POLICY "Allow Uploads to artisan-images"
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'artisan-images' );
