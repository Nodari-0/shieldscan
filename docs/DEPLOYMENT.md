# ShieldScan - Deployment Guide

Complete deployment instructions for Vercel (frontend) and Railway (backend).

## Prerequisites

- GitHub account
- Vercel account (free tier available)
- Railway account (free tier available)
- Firebase project configured
- Stripe account configured

## Frontend Deployment (Vercel)

### Step 1: Prepare Repository

1. Push your code to GitHub
2. Ensure `client/` directory is ready

### Step 2: Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### Step 3: Configure Environment Variables

Add the following environment variables in Vercel:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_key
```

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Copy the deployment URL

## Backend Deployment (Railway)

### Step 1: Prepare Repository

1. Ensure `server/` directory is ready
2. Create `railway.json` in root:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd server && npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Step 2: Deploy to Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Configure:
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

### Step 3: Configure Environment Variables

Add the following environment variables in Railway:

```
NODE_ENV=production
PORT=5000
API_URL=https://your-railway-app.railway.app

FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=your_project.appspot.com

STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRO_PRICE_ID=price_your_pro_price_id
STRIPE_BUSINESS_PRICE_ID=price_your_business_price_id

CORS_ORIGIN=https://your-vercel-app.vercel.app

CLIENT_URL=https://your-vercel-app.vercel.app
```

### Step 4: Configure Stripe Webhook

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://your-railway-app.railway.app/api/subscriptions/webhook`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook signing secret to Railway env vars

### Step 5: Deploy

1. Railway will automatically deploy on push
2. Wait for deployment to complete
3. Copy the Railway app URL

## Database Setup

### Deploy Firestore Rules

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Deploy rules
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

## Post-Deployment Checklist

- [ ] Frontend deployed on Vercel
- [ ] Backend deployed on Railway
- [ ] Environment variables configured
- [ ] Stripe webhook configured
- [ ] Firestore rules deployed
- [ ] Storage rules deployed
- [ ] CORS configured correctly
- [ ] Custom domain configured (optional)
- [ ] SSL certificates active

## Custom Domain Setup

### Vercel (Frontend)

1. Go to Project Settings > Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for SSL certificate generation

### Railway (Backend)

1. Go to Project Settings > Domains
2. Add custom domain
3. Configure DNS CNAME record
4. SSL certificate will be auto-generated

## Monitoring

### Vercel Analytics

- Enable Analytics in Vercel dashboard
- Monitor page views and performance

### Railway Metrics

- View logs in Railway dashboard
- Monitor resource usage
- Set up alerts for errors

### Firebase Monitoring

- Use Firebase Console for Firestore usage
- Monitor authentication metrics
- Check storage usage

## Scaling Considerations

### Vercel

- Automatic scaling
- Edge network for global distribution
- Consider upgrading plan for higher limits

### Railway

- Automatic scaling based on usage
- Consider upgrading for:
  - Higher CPU/RAM limits
  - More deployments
  - Better performance

## Backup Strategy

1. **Database**: Firestore automatic backups
2. **Code**: GitHub repository
3. **Environment Variables**: Store securely (1Password, etc.)
4. **Secrets**: Use Railway/Vercel secret management

## Troubleshooting

### Common Issues

**Build Failures:**
- Check build logs in Vercel/Railway
- Verify all dependencies are installed
- Check TypeScript errors

**Environment Variables:**
- Ensure all variables are set
- Check for typos
- Verify Firebase credentials

**CORS Errors:**
- Verify CORS_ORIGIN matches frontend URL
- Check backend logs for CORS issues

**Webhook Failures:**
- Verify webhook secret is correct
- Check Railway logs for errors
- Ensure webhook endpoint is accessible

## Security Best Practices

1. ✅ Use environment variables for secrets
2. ✅ Enable HTTPS only
3. ✅ Configure CORS properly
4. ✅ Use Firebase security rules
5. ✅ Enable rate limiting
6. ✅ Monitor for suspicious activity
7. ✅ Keep dependencies updated
8. ✅ Use strong API keys

## Cost Optimization

### Vercel
- Free tier: Good for development
- Pro tier: $20/month for production

### Railway
- Free tier: $5 credit/month
- Starter: $5/month for production

### Firebase
- Free tier: Generous limits
- Pay-as-you-go: Scales with usage

## Support

For deployment issues:
- Check Vercel docs: https://vercel.com/docs
- Check Railway docs: https://docs.railway.app
- Review application logs
- Check GitHub issues
