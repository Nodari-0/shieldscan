# Environment Variables Quick Reference

Quick reference for all environment variables needed for ShieldScan.

---

## 📋 Required Variables

### Firebase Configuration (Required)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

**Where to find:** Firebase Console → Project Settings → Your apps → Web app

---

### Admin Configuration (Required)

```env
NEXT_PUBLIC_ADMIN_EMAILS=your-email@gmail.com,admin@example.com
```

**Format:** Comma-separated list of email addresses with admin access

---

## 💳 Payment Processing (Required for Subscriptions)

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID=price_xxxxxxxxxxxxx
```

**Where to find:** Stripe Dashboard → Developers → API keys

---

## 🔐 Security Features (Optional but Recommended)

### Have I Been Pwned API

```env
HIBP_API_KEY=your_hibp_api_key_here
```

**Get free key:** [haveibeenpwned.com/API/Key](https://haveibeenpwned.com/API/Key)

**Note:** Without this, email breach checking shows mock data.

---

## 📧 Email Service (Optional)

```env
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@shieldscan.com
RESEND_REPLY_TO=support@shieldscan.com
```

**Get key:** [resend.com](https://resend.com/)

---

## 🐛 Error Tracking (Optional)

```env
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_AUTH_TOKEN=your_sentry_auth_token
```

**Get credentials:** [sentry.io](https://sentry.io/)

---

## ⚙️ Feature Flags

```env
NEXT_PUBLIC_ENABLE_SCHEDULED_SCANS=false
NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS=false
NEXT_PUBLIC_ENABLE_API_ACCESS=true
NEXT_PUBLIC_ENABLE_EMAIL_BREACH_CHECK=true
```

**Values:** `true` or `false`

---

## 🔌 API Configuration (Optional)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Only needed if using a separate backend server.

---

## 📝 Complete Template

Copy this complete template to `.env.local`:

```env
# =============================================================================
# Firebase Configuration (REQUIRED)
# =============================================================================
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# =============================================================================
# Admin Configuration (REQUIRED)
# =============================================================================
NEXT_PUBLIC_ADMIN_EMAILS=your-email@gmail.com

# =============================================================================
# Stripe Configuration (REQUIRED for payments)
# =============================================================================
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID=price_xxxxx

# =============================================================================
# Have I Been Pwned API (OPTIONAL - for email breach checking)
# =============================================================================
HIBP_API_KEY=your_hibp_api_key_here

# =============================================================================
# Sentry Configuration (OPTIONAL - for error tracking)
# =============================================================================
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_auth_token

# =============================================================================
# Email Configuration (OPTIONAL - for email notifications)
# =============================================================================
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@shieldscan.com
RESEND_REPLY_TO=support@shieldscan.com

# =============================================================================
# Feature Flags
# =============================================================================
NEXT_PUBLIC_ENABLE_SCHEDULED_SCANS=false
NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS=false
NEXT_PUBLIC_ENABLE_API_ACCESS=true
NEXT_PUBLIC_ENABLE_EMAIL_BREACH_CHECK=true

# =============================================================================
# API Configuration (OPTIONAL)
# =============================================================================
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## ✅ Verification Checklist

After setting up `.env.local`, verify:

- [ ] All Firebase variables start with `NEXT_PUBLIC_`
- [ ] Admin emails are comma-separated (no spaces)
- [ ] Stripe keys use test keys for development (`pk_test_`, `sk_test_`)
- [ ] No quotes around values (unless value contains spaces)
- [ ] File is named exactly `.env.local` (not `.env` or `env.local`)
- [ ] File is in `client/` directory
- [ ] Restarted dev server after changes

---

## 🔒 Security Notes

- **Never commit `.env.local`** to version control
- Use **test keys** for Stripe in development
- Use **production keys** only in production environment
- Rotate keys if accidentally exposed
- Keep `STRIPE_SECRET_KEY` and `SENTRY_AUTH_TOKEN` secret

---

## 📚 Related Documentation

- **[SETUP.md](./SETUP.md)** - Complete setup guide
- **[README.md](./README.md)** - Project overview
- **[client/env.example](./client/env.example)** - Template file

---

**Quick Start:** Copy `client/env.example` to `client/.env.local` and fill in your values!

