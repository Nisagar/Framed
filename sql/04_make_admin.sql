-- ============================================================
-- FRAMED — MAKE A USER AN ADMIN
-- Run this AFTER signing up with your admin email
-- Replace 'your-admin@email.com' with your actual email
-- ============================================================

-- Option 1: Set admin by email
UPDATE public.profiles
SET is_admin = TRUE
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'your-admin@email.com'
);

-- Option 2: Set admin by user UUID (if you know it)
-- UPDATE public.profiles
-- SET is_admin = TRUE
-- WHERE id = 'paste-your-user-uuid-here';

-- Verify admin was set correctly
SELECT
  p.id,
  p.full_name,
  p.is_admin,
  u.email
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.is_admin = TRUE;
