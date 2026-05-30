-- ============================================================
-- FRAMED — Add custom poster support to order_items & orders
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add custom poster columns to order_items
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS is_custom        BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS custom_image_url TEXT,
  ADD COLUMN IF NOT EXISTS custom_notes     TEXT,
  ADD COLUMN IF NOT EXISTS storage_path     TEXT,
  ADD COLUMN IF NOT EXISTS title            TEXT;

-- Add flag to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS has_custom_poster BOOLEAN DEFAULT FALSE;

-- Make product_id nullable (custom items have no product_id)
ALTER TABLE public.order_items
  ALTER COLUMN product_id DROP NOT NULL;

-- Index for finding custom orders quickly
CREATE INDEX IF NOT EXISTS idx_order_items_custom
  ON public.order_items(is_custom)
  WHERE is_custom = TRUE;
