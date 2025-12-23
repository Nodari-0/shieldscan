# 🌐 ShieldScan Deployment Guide

Complete guide to deploy ShieldScan for **FREE** or **CHEAP** with domain setup.

---

## 🎯 Recommended Deployment Strategy

| Option | Cost | Best For | Setup Time |
|--------|------|----------|------------|
| **Vercel (FREE)** | $0/month | Production, best Next.js support | 10 min |
| **Firebase Hosting (FREE)** | $0/month | If using Firebase heavily | 15 min |
| **Netlify (FREE)** | $0/month | Alternative to Vercel | 10 min |
| **Railway (FREE tier)** | $0/month | Full-stack with backend | 20 min |

**Recommended:** **Vercel** (free, automatic deployments, best Next.js support)

---

## 🚀 Option 1: Deploy to Vercel (FREE - Recommended)

### Why Vercel?
- ✅ **100% FREE** for personal projects
- ✅ Automatic deployments from GitHub
- ✅ Built-in SSL certificates
- ✅ Global CDN
- ✅ Perfect Next.js support
- ✅ Custom domain support

### Step-by-Step:

#### 1. Push to GitHub First
Follow `GITHUB_SETUP.md` to push your code to GitHub.

#### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up with **GitHub** (recommended)
3. Click **"Add New Project"**
4. Import your `shieldscan` repository
5. Configure:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `client` (important!)
   - **Build Command:** `npm run build` (auto)
   - **Output Directory:** `.next` (auto)
   - **Install Command:** `npm install` (auto)

#### 3. Add Environment Variables

In Vercel project settings → Environment Variables, add:

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Stripe (if using)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_key
STRIPE_SECRET_KEY=your_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Optional
HIBP_API_KEY=your_key
SENTRY_DSN=your_dsn
```

#### 4. Deploy!

Click **"Deploy"** - Vercel will:
- Install dependencies
- Build your app
- Deploy to production
- Give you a URL like: `shieldscan.vercel.app`

**Time to deploy:** ~5-10 minutes

---

## 🔥 Option 2: Deploy to Firebase Hosting (FREE)

### Why Firebase Hosting?
- ✅ FREE tier (10GB storage, 360MB/day transfer)
- ✅ Integrated with Firebase services
- ✅ Custom domain support
- ✅ SSL included

### Step-by-Step:

#### 1. Install Firebase CLI

```powershell
npm install -g firebase-tools
```

#### 2. Login to Firebase

```powershell
firebase login
```

#### 3. Initialize Firebase Hosting

```powershell
cd client
firebase init hosting
```

Select:
- ✅ Use existing project (select your Firebase project)
- ✅ Public directory: `out` (for Next.js static export)
- ✅ Configure as single-page app: **No**
- ✅ Set up automatic builds: **No** (for now)

#### 4. Update next.config.js for Static Export

Add to `client/next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // For static export
  images: {
    unoptimized: true, // Required for static export
  },
  // ... rest of your config
}

module.exports = nextConfig
```

#### 5. Build and Deploy

```powershell
cd client
npm run build
firebase deploy --only hosting
```

**Your app will be live at:** `your-project-id.web.app`

---

## 🌍 Option 3: Deploy to Netlify (FREE)

### Step-by-Step:

1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub
3. Click **"Add new site"** → **"Import an existing project"**
4. Select your GitHub repository
5. Configure:
   - **Base directory:** `client`
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
6. Add environment variables (same as Vercel)
7. Deploy!

**Your app will be live at:** `shieldscan.netlify.app`

---

## 🎯 Option 4: Railway (FREE tier - Full Stack)

Good if you need backend services:

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select your repository
5. Railway auto-detects Next.js
6. Add environment variables
7. Deploy!

**Free tier:** $5 credit/month (enough for small projects)

---

## 🔗 Domain Setup (Cheap Options)

### Option 1: Cloudflare (Cheapest - $8-12/year)

1. Go to [cloudflare.com](https://cloudflare.com)
2. Sign up (free account)
3. Go to **"Domain Registration"**
4. Search for domain (e.g., `shieldscan.io`, `shieldscan.app`)
5. Purchase domain (~$8-12/year)
6. Add DNS records:
   - **Type:** CNAME
   - **Name:** @
   - **Target:** `cname.vercel-dns.com` (if using Vercel)

**Best domains for tech:**
- `.io` - $8-12/year
- `.app` - $10-15/year
- `.dev` - $10-15/year
- `.tech` - $20-30/year

### Option 2: Namecheap (Popular - $10-15/year)

1. Go to [namecheap.com](https://namecheap.com)
2. Search for domain
3. Purchase
4. Update nameservers to your hosting provider

### Option 3: Google Domains (Now Squarespace - $12/year)

1. Go to [domains.google](https://domains.google)
2. Search and purchase
3. Simple DNS management

### Option 4: Free Subdomain (No Cost)

Use free subdomains:
- `shieldscan.vercel.app` (Vercel)
- `shieldscan.netlify.app` (Netlify)
- `your-project.web.app` (Firebase)

**Perfect for demos and portfolios!**

---

## 🔧 Connect Custom Domain to Vercel

1. In Vercel dashboard → Your project → **Settings** → **Domains**
2. Add your domain: `shieldscan.io` (or whatever you bought)
3. Vercel will show DNS records to add:
   - **Type:** A
   - **Value:** Vercel's IP
   - OR
   - **Type:** CNAME
   - **Value:** `cname.vercel-dns.com`
4. Add these records in your domain provider (Cloudflare/Namecheap)
5. Wait 5-60 minutes for DNS propagation
6. ✅ Your site is live at `shieldscan.io`!

---

## 🔐 SSL Certificate

**Automatic with all providers:**
- ✅ Vercel: Auto SSL
- ✅ Firebase: Auto SSL
- ✅ Netlify: Auto SSL
- ✅ Railway: Auto SSL

No manual setup needed!

---

## 📊 Deployment Comparison

| Feature | Vercel | Firebase | Netlify | Railway |
|---------|--------|----------|---------|---------|
| **Free Tier** | ✅ Unlimited | ✅ 10GB | ✅ 100GB | ✅ $5 credit |
| **Next.js Support** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Auto Deploy** | ✅ | ✅ | ✅ | ✅ |
| **Custom Domain** | ✅ Free | ✅ Free | ✅ Free | ✅ Free |
| **SSL** | ✅ Auto | ✅ Auto | ✅ Auto | ✅ Auto |
| **CDN** | ✅ Global | ✅ Global | ✅ Global | ⚠️ Limited |
| **Ease of Use** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 🚨 Important: Environment Variables

**Never commit these to GitHub!**

Create `.env.local` in `client/` folder:

```bash
# Copy from env.example
cp client/env.example client/.env.local

# Edit with your real values
```

**For production:**
- Add all environment variables in your hosting provider's dashboard
- Vercel: Project Settings → Environment Variables
- Firebase: Functions → Config
- Netlify: Site Settings → Environment Variables

---

## 📝 Pre-Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] `.env.local` NOT in repository (check `.gitignore`)
- [ ] All environment variables documented
- [ ] Build works locally (`npm run build`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] Firebase project created
- [ ] Stripe account set up (if using payments)
- [ ] Domain purchased (optional)

---

## 🎯 Recommended Setup (Best Value)

**For showing off your project:**

1. ✅ **Hosting:** Vercel (FREE)
2. ✅ **Domain:** Cloudflare ($8-12/year for `.io`)
3. ✅ **Total Cost:** ~$1/month or less

**Steps:**
1. Push to GitHub
2. Deploy to Vercel (connects to GitHub)
3. Buy domain on Cloudflare
4. Connect domain to Vercel
5. ✅ Live at `shieldscan.io`!

---

## 🆘 Troubleshooting

### Build Fails on Vercel

**Error:** "Module not found"
- **Fix:** Check `package.json` dependencies are correct
- **Fix:** Ensure `node_modules` is in `.gitignore`

### Environment Variables Not Working

**Error:** Variables undefined
- **Fix:** Restart deployment after adding env vars
- **Fix:** Ensure variable names start with `NEXT_PUBLIC_` for client-side

### Domain Not Connecting

**Error:** DNS not resolving
- **Fix:** Wait 24-48 hours for DNS propagation
- **Fix:** Check DNS records are correct
- **Fix:** Use `dig` or `nslookup` to verify

### Firebase Errors

**Error:** "Firebase not initialized"
- **Fix:** Add all `NEXT_PUBLIC_FIREBASE_*` variables
- **Fix:** Check Firebase project ID matches

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Cloudflare Domains](https://www.cloudflare.com/products/registrar/)

---

## ✅ Final Checklist

- [ ] Project deployed to hosting provider
- [ ] Environment variables configured
- [ ] Custom domain connected (optional)
- [ ] SSL certificate active
- [ ] Site accessible via HTTPS
- [ ] All features working in production
- [ ] Share your live URL! 🎉

---

**Your live site will be at:**
- Vercel: `https://shieldscan.vercel.app`
- With domain: `https://shieldscan.io` (or your domain)

🚀 **Congratulations! Your project is now live!**

