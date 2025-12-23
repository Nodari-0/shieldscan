# 🔐 Vercel Environment Variables - Copy & Paste

Use this guide to add all environment variables to your Vercel project.

---

## 📋 Step-by-Step: Adding to Vercel

1. Go to your Vercel project dashboard
2. Click **"Settings"** (top menu)
3. Click **"Environment Variables"** (left sidebar)
4. Add each variable one by one (or use bulk import)

---

## 🔥 Firebase Variables (Required)

Copy these and replace with your actual Firebase values:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Where to find these:**
- Go to [Firebase Console](https://console.firebase.google.com)
- Select your project → Project Settings → General
- Scroll to "Your apps" → Web app → Config

---

## 💳 Stripe Variables (If using payments)

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
NEXT_PUBLIC_STRIPE_ESSENTIAL_MONTHLY_PRICE_ID=your_essential_price_id
NEXT_PUBLIC_STRIPE_CLOUD_MONTHLY_PRICE_ID=your_cloud_price_id
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID=your_pro_price_id
```

**Where to find these:**
- Go to [Stripe Dashboard](https://dashboard.stripe.com)
- **Publishable Key:** Developers → API keys → Publishable key
- **Secret Key:** Developers → API keys → Reveal test key
- **Webhook Secret:** Developers → Webhooks → Add endpoint → Copy signing secret
- **Price IDs:** Products → Create products → Copy price IDs

---

## 👤 Admin Configuration

```
NEXT_PUBLIC_ADMIN_EMAILS=your-email@gmail.com,admin@example.com
```

**Replace with:** Your actual admin email addresses (comma-separated)

---

## 📧 Email Service (Resend - Optional)

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_REPLY_TO=support@yourdomain.com
```

**Where to get:**
- Sign up at [resend.com](https://resend.com)
- Get API key from dashboard
- Verify your domain

---

## 🔍 Have I Been Pwned API (Optional - for email breach checking)

```
HIBP_API_KEY=your_hibp_api_key_here
```

**Where to get:**
- Go to [haveibeenpwned.com/API/Key](https://haveibeenpwned.com/API/Key)
- Sign up (free) → Get API key

---

## 🐛 Sentry Error Tracking (Optional)

```
NEXT_PUBLIC_SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@xxxxxxxxx.ingest.sentry.io/xxxxxxxxx
SENTRY_AUTH_TOKEN=your_sentry_auth_token
```

**Where to get:**
- Sign up at [sentry.io](https://sentry.io)
- Create project → Copy DSN
- Settings → Auth Tokens → Create token

---

## 🚀 Feature Flags (Optional)

```
NEXT_PUBLIC_ENABLE_SCHEDULED_SCANS=true
NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_API_ACCESS=true
NEXT_PUBLIC_ENABLE_EMAIL_BREACH_CHECK=true
```

---

## 📝 API Configuration

```
NEXT_PUBLIC_API_URL=https://your-api-url.com/api
```

**For Vercel:** Leave empty or use your Vercel deployment URL

---

## ✅ Quick Copy-Paste (All at Once)

Copy this entire block and paste into Vercel (one variable per line):

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
NEXT_PUBLIC_STRIPE_ESSENTIAL_MONTHLY_PRICE_ID=your_essential_price_id
NEXT_PUBLIC_STRIPE_CLOUD_MONTHLY_PRICE_ID=your_cloud_price_id
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID=your_pro_price_id
NEXT_PUBLIC_ADMIN_EMAILS=your-email@gmail.com
NEXT_PUBLIC_ENABLE_SCHEDULED_SCANS=true
NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_API_ACCESS=true
NEXT_PUBLIC_ENABLE_EMAIL_BREACH_CHECK=true
```

**⚠️ Remember:** Replace all placeholder values with your actual keys!

---

## 🎯 Vercel Environment Variable Settings

For each variable in Vercel:

1. **Key:** Variable name (e.g., `NEXT_PUBLIC_FIREBASE_API_KEY`)
2. **Value:** Your actual value
3. **Environment:** Select:
   - ✅ **Production** (for live site)
   - ✅ **Preview** (for pull requests)
   - ✅ **Development** (for local dev)

**Tip:** Select all three environments for most variables!

---

## 🔄 After Adding Variables

1. **Redeploy** your project:
   - Go to **Deployments** tab
   - Click **"..."** on latest deployment
   - Click **"Redeploy"**
2. Or push a new commit to trigger auto-deploy

---

## ✅ Checklist

- [ ] Firebase variables added
- [ ] Stripe variables added (if using payments)
- [ ] Admin email set
- [ ] All variables set for Production environment
- [ ] Project redeployed
- [ ] Test the live site

---

## 🆘 Troubleshooting

**Variables not working?**
- ✅ Make sure variable names match exactly (case-sensitive)
- ✅ Redeploy after adding variables
- ✅ Check that `NEXT_PUBLIC_*` variables are for client-side
- ✅ Check Vercel build logs for errors

**Firebase errors?**
- ✅ Verify all Firebase variables are correct
- ✅ Check Firebase project is active
- ✅ Ensure Firebase Authentication is enabled

**Stripe errors?**
- ✅ Use test keys for development
- ✅ Verify webhook endpoint is configured
- ✅ Check price IDs exist in Stripe dashboard

---

**Your project is ready to deploy! 🚀**

