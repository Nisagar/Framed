-- ============================================================
-- FRAMED — STORAGE BUCKET SETUP
-- Run this AFTER 02_rls_policies.sql in Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────
-- Create storage buckets
-- ─────────────────────────────────────────

-- Product images bucket (public read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  TRUE,
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Custom uploads bucket (private, user-specific)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'custom-uploads',
  'custom-uploads',
  FALSE,
  10485760,  -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────
-- PRODUCT IMAGES storage policies
-- ─────────────────────────────────────────

-- Anyone can view product images (bucket is public)
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
CREATE POLICY "Public read product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Only admins can upload product images
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
CREATE POLICY "Admins can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
  );

-- Only admins can delete product images
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
  );

-- ─────────────────────────────────────────
-- CUSTOM UPLOADS storage policies
-- ─────────────────────────────────────────

-- Users can upload to their own folder (user_id/filename)
DROP POLICY IF EXISTS "Users can upload custom images" ON storage.objects;
CREATE POLICY "Users can upload custom images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'custom-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can view their own uploads
DROP POLICY IF EXISTS "Users can view own custom uploads" ON storage.objects;
CREATE POLICY "Users can view own custom uploads"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'custom-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admins can view all custom uploads
DROP POLICY IF EXISTS "Admins can view all custom uploads" ON storage.objects;
CREATE POLICY "Admins can view all custom uploads"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'custom-uploads'
    AND (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
  );

-- Users can delete their own uploads
DROP POLICY IF EXISTS "Users can delete own custom uploads" ON storage.objects;
CREATE POLICY "Users can delete own custom uploads"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'custom-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
