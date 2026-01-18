-- Storage Policies for Multi-Modal Generation Studio
-- Run this in the Supabase SQL Editor

-- ==========================================
-- BUCKET: media
-- Purpose: Publicly accessible generated content (images, videos)
-- ==========================================

-- Ensure bucket exists (idempotent-ish)
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can view (reads)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'media' );

-- Policy: Authenticated users can upload (inserts)
CREATE POLICY "Authenticated Uploads"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update/delete their own files
CREATE POLICY "User Manage Own Media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media'
  AND auth.uid() = owner
);

-- ==========================================
-- BUCKET: attachments
-- Purpose: Private chat attachments (files, documents)
-- ==========================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Only owner can view
CREATE POLICY "Private Access"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'attachments'
  AND auth.uid() = owner
);

-- Policy: Authenticated users can upload
CREATE POLICY "Authenticated Attachment Uploads"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'attachments'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own attachments
CREATE POLICY "User Manage Own Attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'attachments'
  AND auth.uid() = owner
);
