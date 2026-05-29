-- ============================================================
-- FRAMED — ROW LEVEL SECURITY POLICIES
-- Run this AFTER 01_schema.sql in Supabase SQL Editor
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_sizes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_poster_uploads ENABLE ROW LEVEL SECURITY;

-- Helper function: check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    FALSE
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- ─────────────────────────────────────────
-- CATEGORIES (public read, admin write)
-- ─────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view categories"  ON public.categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;

CREATE POLICY "Anyone can view categories"
  ON public.categories FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  USING (public.is_admin());

-- ─────────────────────────────────────────
-- PRODUCTS (public read active, admin full)
-- ─────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products"      ON public.products;

CREATE POLICY "Anyone can view active products"
  ON public.products FOR SELECT
  USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  USING (public.is_admin());

-- ─────────────────────────────────────────
-- PRODUCT IMAGES (public read, admin write)
-- ─────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view product images" ON public.product_images;
DROP POLICY IF EXISTS "Admins can manage product images" ON public.product_images;

CREATE POLICY "Anyone can view product images"
  ON public.product_images FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can manage product images"
  ON public.product_images FOR ALL
  USING (public.is_admin());

-- ─────────────────────────────────────────
-- PRODUCT SIZES (public read, admin write)
-- ─────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view product sizes" ON public.product_sizes;
DROP POLICY IF EXISTS "Admins can manage product sizes" ON public.product_sizes;

CREATE POLICY "Anyone can view product sizes"
  ON public.product_sizes FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can manage product sizes"
  ON public.product_sizes FOR ALL
  USING (public.is_admin());

-- ─────────────────────────────────────────
-- ADDRESSES (user owns, admin reads)
-- ─────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Admins can view all addresses"  ON public.addresses;

CREATE POLICY "Users can manage own addresses"
  ON public.addresses FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all addresses"
  ON public.addresses FOR SELECT
  USING (public.is_admin());

-- ─────────────────────────────────────────
-- ORDERS (user owns, admin full)
-- ─────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own orders"   ON public.orders;
DROP POLICY IF EXISTS "Users can create orders"     ON public.orders;
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;

CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders"
  ON public.orders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all orders"
  ON public.orders FOR ALL
  USING (public.is_admin());

-- ─────────────────────────────────────────
-- ORDER ITEMS (via order ownership + admin)
-- ─────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own order items"   ON public.order_items;
DROP POLICY IF EXISTS "Users can create order items"     ON public.order_items;
DROP POLICY IF EXISTS "Admins can manage all order items" ON public.order_items;

CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create order items"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all order items"
  ON public.order_items FOR ALL
  USING (public.is_admin());

-- ─────────────────────────────────────────
-- CUSTOM POSTER UPLOADS
-- ─────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage own uploads" ON public.custom_poster_uploads;
DROP POLICY IF EXISTS "Admins can manage all uploads" ON public.custom_poster_uploads;

CREATE POLICY "Users can manage own uploads"
  ON public.custom_poster_uploads FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all uploads"
  ON public.custom_poster_uploads FOR ALL
  USING (public.is_admin());
