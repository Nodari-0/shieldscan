# ShieldScan Setup Guide

Complete step-by-step guide to set up ShieldScan for development and production.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Firebase Setup](#firebase-setup)
3. [Environment Variables](#environment-variables)
4. [Installation](#installation)
5. [Firestore Configuration](#firestore-configuration)
6. [Stripe Setup](#stripe-setup)
7. [Optional Services](#optional-services)
8. [Verification](#verification)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- ✅ **Node.js 18+** installed ([Download](https://nodejs.org/))
- ✅ **npm** or **yarn** package manager
- ✅ **Firebase CLI** installed globally:
  ```bash
  npm install -g firebase-tools
  ```
- ✅ **Git** for version control
- ✅ A modern web browser (Chrome, Firefox, Edge)

---

## Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `shieldscan` (or your preferred name)
4. Enable/disable Google Analytics (optional)
5. Click **"Create project"**
6. Wait for project creation to complete

### 2. Enable Firebase Services

#### Authentication

1. In Firebase Console, go to **Authentication** → **Get started**
2. Enable **Email/Password** provider:
   - Click **Email/Password**
   - Toggle **"Enable"**
   - Click **"Save"**
3. Enable **Google** provider (optional):
   - Click **Google**
   - Enter project support email
   - Click **"Save"**
4. Enable **Apple** provider (optional):
   - Click **Apple**
   - Follow Apple setup instructions
   - Click **"Save"**

#### Firestore Database

1. Go to **Firestore Database** → **Create database**
2. Choose **"Start in production mode"** (we'll add rules later)
3. Select a location (choose closest to your users)
4. Click **"Enable"**

#### Storage

1. Go to **Storage** → **Get started**
2. Start in **production mode**
3. Use same location as Firestore
4. Click **"Done"**

### 3. Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll to **"Your apps"** section
3. Click **Web icon** (`</>`) to add a web app
4. Register app name: `ShieldScan Web`
5. Copy the configuration object (you'll need this for `.env.local`)

---

## Environment Variables

### 1. Create `.env.local` File

Navigate to the `client/` directory and create `.env.local`:

```bash
cd client
cp env.example .env.local
```

### 2. Fill in Firebase Credentials

Open `.env.local` and replace the Firebase values:

```env
# =============================================================================
# Firebase Configuration
# =============================================================================
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Where to find these values:**
- Go to Firebase Console → Project Settings → Your apps → Web app
- Copy values from the `firebaseConfig` object

### 3. Configure Admin Emails

```env
# =============================================================================
# Admin Configuration
# =============================================================================
# Comma-separated list of admin emails
NEXT_PUBLIC_ADMIN_EMAILS=your-email@gmail.com,admin@example.com
```

Add your email addresses here to access the admin dashboard.

### 4. API Configuration (Optional)

```env
# =============================================================================
# API Configuration
# =============================================================================
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Only needed if you have a separate backend server.

---

## Stripe Setup

### 1. Create Stripe Account

1. Go to [Stripe](https://stripe.com/) and sign up
2. Complete account setup
3. Get your API keys from **Developers** → **API keys**

### 2. Add Stripe Keys to `.env.local`

```env
# =============================================================================
# Stripe Configuration
# =============================================================================
# Replace with your actual Stripe keys from https://dashboard.stripe.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_YOUR_PRICE_ID_HERE
NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID=price_YOUR_PRICE_ID_HERE
```

**Getting Stripe Keys:**
- **Publishable Key**: Found in Dashboard → Developers → API keys
- **Secret Key**: Click "Reveal test key" (use test keys for development)
- **Webhook Secret**: Create webhook endpoint first (see below)
- **Price IDs**: Create products/prices in Stripe Dashboard

### 3. Create Stripe Products & Prices

1. Go to **Products** → **Add product**
2. Create products for each plan:
   - **Pro Plan**: $99/month
   - **Business Plan**: $199/month
3. Copy the **Price ID** (starts with `price_`) for each
4. Add Price IDs to `.env.local`

### 4. Set Up Webhook (Production)

1. Go to **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. URL: `https://your-domain.com/api/stripe/webhook`
4. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** to `.env.local`

---

## Optional Services

### Have I Been Pwned (Email Breach Checking)

1. Go to [haveibeenpwned.com/API/Key](https://haveibeenpwned.com/API/Key)
2. Sign up for a free API key
3. Add to `.env.local`:

```env
# =============================================================================
# Have I Been Pwned API (Email Breach Checking)
# =============================================================================
HIBP_API_KEY=your_hibp_api_key_here
```

**Note**: Email breach checking will work without this key but will show mock data.

### Sentry (Error Tracking)

1. Go to [sentry.io](https://sentry.io/) and create account
2. Create a new project (Next.js)
3. Copy DSN and auth token
4. Add to `.env.local`:

```env
# =============================================================================
# Sentry Configuration (Error Tracking)
# =============================================================================
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_AUTH_TOKEN=your_sentry_auth_token
```

### Resend (Email Service)

1. Go to [resend.com](https://resend.com/) and sign up
2. Create API key
3. Add to `.env.local`:

```env
# =============================================================================
# Email Configuration (Resend)
# =============================================================================
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@shieldscan.com
RESEND_REPLY_TO=support@shieldscan.com
```

---

## Installation

### 1. Install Dependencies

```bash
cd client
npm install
```

### 2. Verify Installation

```bash
# Check Node version (should be 18+)
node --version

# Check npm version
npm --version

# Verify Firebase CLI
firebase --version
```

### 3. Login to Firebase

```bash
firebase login
```

Follow the browser prompts to authenticate.

### 4. Link Firebase Project

```bash
# From project root
firebase use --add

# Select your Firebase project from the list
```

---

## Firestore Configuration

### 1. Deploy Security Rules

```bash
# From project root
firebase deploy --only firestore:rules
```

### 2. Create Required Indexes

Firestore will prompt you to create indexes when needed. Alternatively, create them manually:

1. Go to Firebase Console → **Firestore** → **Indexes**
2. Click **"Create Index"**
3. Create these indexes:

| Collection | Field 1 | Field 2 | Query Scope |
|------------|---------|---------|-------------|
| `apiKeys` | `userId` (Asc) | `createdAt` (Desc) | Collection |
| `scans` | `userId` (Asc) | `createdAt` (Desc) | Collection |
| `testimonials` | `approved` (Asc) | `createdAt` (Desc) | Collection |

### 3. Verify Firestore Rules

Rules are in `firestore.rules`. They should:
- Allow users to read/write their own data
- Restrict admin access to admin users only
- Enforce scan limits per plan

---

## Feature Flags

Configure feature flags in `.env.local`:

```env
# =============================================================================
# Feature Flags
# =============================================================================
NEXT_PUBLIC_ENABLE_SCHEDULED_SCANS=false
NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS=false
NEXT_PUBLIC_ENABLE_API_ACCESS=true
NEXT_PUBLIC_ENABLE_EMAIL_BREACH_CHECK=true
```

---

## Verification

### 1. Start Development Server

```bash
cd client
npm run dev
```

### 2. Test Application

1. Open [http://localhost:3000](http://localhost:3000)
2. Try to register a new account
3. Check Firebase Console → Authentication → Users (should see new user)
4. Try creating a scan
5. Check Firestore → `scans` collection (should see scan document)

### 3. Verify Admin Access

1. Register/login with an email in `NEXT_PUBLIC_ADMIN_EMAILS`
2. Navigate to `/admin`
3. Should see admin dashboard

### 4. Test Email Breach Checker

1. Go to Dashboard → Security Tools
2. Enter an email address
3. Click "Check"
4. Should see results (or mock data if HIBP_API_KEY not set)

### 5. Test Password Checker

1. Go to Dashboard → Security Tools
2. Enter a password in Password Strength Checker
3. Should see strength meter and breach check results

---

## Troubleshooting

### Issue: "CONFIGURATION_NOT_FOUND"

**Solution:**
- Ensure Firebase Authentication is enabled
- Check that `.env.local` has correct Firebase config
- Restart development server after changing `.env.local`

### Issue: "Firebase: Error (auth/configuration-not-found)"

**Solution:**
- Verify all `NEXT_PUBLIC_FIREBASE_*` variables are set
- Check for typos in variable names
- Ensure `.env.local` is in `client/` directory

### Issue: "Permission denied" in Firestore

**Solution:**
- Deploy Firestore rules: `firebase deploy --only firestore:rules`
- Check that user is authenticated
- Verify Firestore indexes are created

### Issue: Translation not working

**Solution:**
- Check browser console for errors
- Verify `/api/translate` endpoint is accessible
- Check network tab for failed requests

### Issue: Email breach check fails

**Solution:**
- Verify `HIBP_API_KEY` is set (optional, will show mock data without it)
- Check API key is valid at haveibeenpwned.com
- Check rate limits (free tier: 1 request per 1.5 seconds)

### Issue: Password check shows "Could not check breach database"

**Solution:**
- Verify `/api/password-check` route exists
- Check server logs for errors
- Ensure Next.js API routes are working

### Issue: Stripe payments not working

**Solution:**
- Verify Stripe keys are correct (use test keys for development)
- Check Stripe Dashboard → Events for webhook errors
- Ensure webhook endpoint is accessible in production

### Issue: Build fails

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Try building again
npm run build
```

### Issue: Port 3000 already in use

**Solution:**
```bash
# Use a different port
npm run dev -- -p 3001
```

---

## Production Deployment

### 1. Build for Production

```bash
cd client
npm run build
```

### 2. Test Production Build

```bash
npm start
```

### 3. Deploy to Firebase Hosting

```bash
# From project root
firebase deploy --only hosting
```

### 4. Update Environment Variables

For production, set environment variables in:
- **Firebase Hosting**: Use Firebase Functions config
- **Vercel**: Project Settings → Environment Variables
- **Other platforms**: Follow their documentation

---

## Next Steps

After setup is complete:

1. ✅ Test all features (scanning, payments, admin)
2. ✅ Set up monitoring (Sentry, analytics)
3. ✅ Configure production Stripe webhooks
4. ✅ Set up custom domain
5. ✅ Enable production Firebase rules
6. ✅ Review security settings

---

## Support

For additional help:
- Check [README.md](./README.md) for feature overview
- Review [docs/](./docs/) for detailed documentation
- Check Firebase Console for service status
- Review browser console for client-side errors

---

**Setup complete! 🎉 Start developing with `npm run dev`**

