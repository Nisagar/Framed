# 🖼️ FRAMED — Complete Setup Guide

> Follow every step in order. Do not skip any step.

---

## 📁 Final Folder Structure

```
Framed/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── AdminRoute.jsx
│   │   ├── layout/
│   │   │   ├── MainLayout.jsx
│   │   │   ├── AdminLayout.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── Footer.jsx
│   │   ├── product/
│   │   │   ├── ProductCard.jsx
│   │   │   └── ProductSkeleton.jsx
│   │   └── ui/
│   │       └── index.jsx
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── cartStore.js
│   ├── hooks/
│   │   └── useData.js
│   ├── lib/
│   │   └── supabase.js
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── AdminDashboardPage.jsx
│   │   │   ├── AdminProductsPage.jsx
│   │   │   ├── AdminProductFormPage.jsx
│   │   │   ├── AdminOrdersPage.jsx
│   │   │   └── AdminCustomUploadsPage.jsx
│   │   ├── HomePage.jsx
│   │   ├── ProductsPage.jsx
│   │   ├── ProductDetailPage.jsx
│   │   ├── CartPage.jsx
│   │   ├── CheckoutPage.jsx
│   │   ├── OrderSuccessPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── SignupPage.jsx
│   │   ├── ForgotPasswordPage.jsx
│   │   ├── ResetPasswordPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── OrderDetailPage.jsx
│   │   └── CustomUploadPage.jsx
│   ├── utils/
│   │   ├── razorpay.js
│   │   └── helpers.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── sql/
│   ├── 01_schema.sql
│   ├── 02_rls_policies.sql
│   ├── 03_storage.sql
│   └── 04_make_admin.sql
├── images/
│   ├── anime/
│   ├── cinema/
│   ├── cricket/
│   └── football/
├── .env.example
├── .env                ← you create this
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

---

## STEP 1 — Install Dependencies

Open VS Code terminal inside your `Framed` folder and run:

```bash
npm install
```

This installs React, Supabase, Zustand, Framer Motion, Razorpay, Tailwind, and all other dependencies.

---

## STEP 2 — Create Your Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in:
   - **Name:** Framed
   - **Database Password:** choose a strong password (save it!)
   - **Region:** Asia (Mumbai) — closest to India
4. Click **"Create new project"**
5. Wait 1–2 minutes for it to finish setting up

---

## STEP 3 — Get Your Supabase Keys

1. In your Supabase project, go to **Settings → API**
2. Copy:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon / public key** (long string starting with `eyJ...`)

---

## STEP 4 — Create Your .env File

In your `Framed` project root, create a file called `.env` and paste:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
VITE_APP_URL=http://localhost:5173
```

Replace the values with your actual keys from Step 3.

> ⚠️ Never commit `.env` to Git. It is already in `.gitignore`.

---

## STEP 5 — Run the SQL Schema

1. In Supabase, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Open your file `sql/01_schema.sql`
4. Copy the **entire contents** and paste into the SQL editor
5. Click **"Run"** (green button)
6. You should see "Success. No rows returned"

Repeat for the remaining SQL files **in order**:

| File | What it does |
|------|-------------|
| `sql/01_schema.sql` | Creates all tables |
| `sql/02_rls_policies.sql` | Sets up security rules |
| `sql/03_storage.sql` | Creates storage buckets |

> Run each file one at a time in order.

---

## STEP 6 — Set Up Authentication

1. In Supabase, go to **Authentication → Settings**
2. Under **"Email Auth"**, make sure it's **enabled**
3. Under **"Email confirmations"**:
   - For development: **disable** email confirmation (easier to test)
   - For production: enable and set up SMTP
4. Under **"Site URL"**, set:
   - Development: `http://localhost:5173`
   - Production: your live domain

---

## STEP 7 — Verify Storage Buckets Were Created

1. In Supabase, go to **Storage** (left sidebar)
2. You should see two buckets:
   - `product-images` (public)
   - `custom-uploads` (private)
3. If they don't exist, run `sql/03_storage.sql` again

---

## STEP 8 — Create Your Admin Account

### 8a. Sign up as a regular user first
1. Run your app: `npm run dev`
2. Go to `http://localhost:5173/signup`
3. Sign up with your admin email and password

### 8b. Make that account an admin
1. Go to Supabase **SQL Editor**
2. Open `sql/04_make_admin.sql`
3. Replace `your-admin@email.com` with your actual email
4. Run the query

### 8c. Verify it worked
```sql
SELECT p.full_name, p.is_admin, u.email
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.is_admin = TRUE;
```
You should see your account listed with `is_admin = true`.

### 8d. Access the admin panel
Go to `http://localhost:5173/admin` — you should now have access!

---

## STEP 9 — Set Up Razorpay

### For Testing (Recommended to start)
1. Go to [https://razorpay.com](https://razorpay.com) and create a free account
2. Go to **Settings → API Keys**
3. Click **"Generate Test API Keys"**
4. Copy your **Key ID** (starts with `rzp_test_`)
5. Paste it into your `.env` file as `VITE_RAZORPAY_KEY_ID`

> The app has a **demo mode** built in. If you leave the key as `rzp_test_xxxxxxxxxxxx`, it will simulate a successful payment without opening Razorpay. This is useful for testing the full order flow first.

### For Production
1. Complete Razorpay KYC verification
2. Switch to **Live API Keys** (`rzp_live_`)
3. ⚠️ **Important:** In production you MUST create Razorpay orders from a backend (Supabase Edge Function) using your **secret key**. Never put the secret key in frontend code.

---

## STEP 10 — Add Your First Products

1. Log in with your admin account
2. Go to `http://localhost:5173/admin/products`
3. Click **"+ Add Product"**
4. Fill in:
   - Title, description, price
   - Select a category (Anime, Cinema, Cricket, or Football)
   - Set A4 and A3 stock quantities
   - Upload product images
5. Click **"Create Product"**

### Upload Images to Supabase Storage
When you add a product and select images, they are automatically uploaded to the `product-images` bucket in Supabase Storage.

Alternatively, you can upload images directly:
1. Go to Supabase → **Storage → product-images**
2. Create folders: `anime/`, `cinema/`, `cricket/`, `football/`
3. Upload your images manually

---

## STEP 11 — Run Locally

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### Test the full flow:
- [ ] Browse products on homepage
- [ ] Filter by category
- [ ] View product detail page
- [ ] Add to cart
- [ ] Sign up / Sign in
- [ ] Go to checkout
- [ ] Place order (demo payment)
- [ ] Check order in dashboard
- [ ] Upload a custom poster
- [ ] Log in as admin → manage products and orders

---

## STEP 12 — Deploy to Production

### Deploy Frontend to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [https://vercel.com](https://vercel.com) and sign in
3. Click **"New Project"** → import your GitHub repo
4. Set the **Framework Preset** to **Vite**
5. Add your **Environment Variables** (same as your `.env` file):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_RAZORPAY_KEY_ID`
   - `VITE_APP_URL` → set to your Vercel domain
6. Click **"Deploy"**

### After deploying:
1. Copy your Vercel domain (e.g. `https://framed.vercel.app`)
2. Go to Supabase → **Authentication → Settings**
3. Update **"Site URL"** to your Vercel domain
4. Add your Vercel domain to **"Redirect URLs"**

---

## Environment Variables Reference

| Variable | Where to get it |
|----------|----------------|
| `VITE_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon/public key |
| `VITE_RAZORPAY_KEY_ID` | Razorpay Dashboard → Settings → API Keys |
| `VITE_APP_URL` | `http://localhost:5173` locally, your domain in production |

---

## Common Troubleshooting

### "Missing Supabase environment variables"
→ Make sure your `.env` file exists in the root of the `Framed` folder (not inside `src/`)
→ Restart `npm run dev` after editing `.env`

### White screen / app not loading
→ Open browser console (F12) and check for errors
→ Confirm your `.env` values are correct (no extra spaces)

### "new row violates row-level security policy"
→ You are not signed in, or the RLS policies weren't applied
→ Re-run `sql/02_rls_policies.sql` in Supabase SQL Editor

### Admin panel shows "Page not found"
→ You are not logged in as an admin
→ Run `sql/04_make_admin.sql` with your correct email
→ Sign out and sign back in to refresh your session

### Images not showing after upload
→ Check that `product-images` bucket exists in Supabase Storage
→ Check the bucket is set to **Public**
→ Re-run `sql/03_storage.sql` if needed

### Cart not persisting after refresh
→ This uses `localStorage` via Zustand persist middleware — it should work automatically in the browser

### Razorpay modal not opening
→ Make sure the Razorpay script is in `index.html` (it should be there already)
→ Check the browser console for errors
→ In demo mode (default), it skips the modal — this is expected

### Orders placed but no stock deducted
→ Stock deduction on order placement is intentionally left for you to add in a Supabase Edge Function or database trigger for production use

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| State | Zustand (cart) + Context API (auth) |
| Routing | React Router v6 |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Payments | Razorpay |
| Notifications | react-hot-toast |
| Deployment | Vercel (frontend) + Supabase (backend) |

---

## Quick Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

---

Built with ❤️ for Framed — Premium Wall Posters
