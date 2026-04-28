-- Create gun-photos storage bucket for the photo documentation system
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gun-photos',
  'gun-photos',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO NOTHING;

-- Users can upload photos to their own folder (path: {userId}/{gunId}/{filename})
CREATE POLICY "gun_photos_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'gun-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can read their own photos
CREATE POLICY "gun_photos_select"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'gun-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own photos
CREATE POLICY "gun_photos_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'gun-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
