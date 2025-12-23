# ShieldScan - Firebase Deployment Guide

Complete deployment instructions for Firebase Hosting + Cloud Functions.

## Prerequisites

- Firebase CLI installed: `npm install -g firebase-tools`
- Firebase project created
- Node.js 18+
- Git repository

## Initial Setup

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Login to Firebase

```bash
firebase login
```

### 3. Initialize Firebase Project

```bash
# In project root
firebase init

# Select:
# - Firestore (rules, indexes)
# - Functions (Cloud Functions)
# - Hosting (for Next.js)
# - Storage (rules)
```

### 4. Link to Existing Firebase Project

```bash
firebase use --add
# Select your Firebase project
```

## Configuration

### Environment Variables

**For Cloud Functions**, set environment variables:

```bash
# Set Stripe keys
firebase functions:config:set stripe.secret_key="sk_live_..."
firebase functions:config:set stripe.webhook_secret="whsec_..."

# Set plan price IDs
firebase functions:config:set stripe.pro_price_id="price_..."
firebase functions:config:set stripe.business_price_id="price_..."

# Set client URL
firebase functions:config:set client.url="https://your-domain.com"
```

**For Next.js**, create `client/.env.production`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## Build Process

### 1. Build Next.js App

```bash
cd client
npm install
npm run build
cd ..
```

### 2. Build Cloud Functions

```bash
cd functions
npm install
npm run build
cd ..
```

## Deployment Steps

### 1. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### 2. Deploy Storage Rules

```bash
firebase deploy --only storage:rules
```

### 3. Deploy Cloud Functions

```bash
firebase deploy --only functions
```

### 4. Deploy Next.js to Hosting

```bash
# Copy Next.js build output to hosting directory
cp -r client/.next client/out
firebase deploy --only hosting
```

### Or Deploy Everything

```bash
firebase deploy
```

## Firebase Hosting Configuration

The `firebase.json` file is configured for Next.js:

- **Public directory**: `client/.next` (or `client/out` for static export)
- **Rewrites**: All routes to `index.html` for client-side routing
- **Headers**: Cache control for static assets

## Next.js Static Export (Alternative)

If you prefer static export:

1. Update `next.config.js`:
```js
output: 'export',
```

2. Build:
```bash
cd client
npm run build
```

3. Update `firebase.json`:
```json
{
  "hosting": {
    "public": "client/out"
  }
}
```

## Custom Domain Setup

### 1. Add Domain in Firebase Console

1. Go to Firebase Console > Hosting
2. Click "Add custom domain"
3. Enter your domain

### 2. Configure DNS

- Add A record or CNAME as instructed
- Wait for SSL certificate provisioning

### 3. Verify Domain

- Complete domain verification
- SSL certificate will auto-generate

## Cloud Functions Configuration

### Memory & Timeout

Update `functions/src/index.ts`:

```typescript
export const executeScanFunction = functions
  .runWith({
    timeoutSeconds: 540, // 9 minutes max
    memory: '512MB'
  })
  .https.onCall(executeScan);
```

### Regional Deployment

```typescript
export const executeScanFunction = functions
  .region('europe-west1')
  .https.onCall(executeScan);
```

## Stripe Webhook Setup

### 1. Get Webhook URL

After deploying functions:
```
https://[region]-[project-id].cloudfunctions.net/stripeWebhookFunction
```

### 2. Configure in Stripe Dashboard

1. Go to Stripe Dashboard > Webhooks
2. Add endpoint with the URL above
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook signing secret

### 3. Set Webhook Secret

```bash
firebase functions:config:set stripe.webhook_secret="whsec_..."
firebase deploy --only functions
```

## Monitoring

### View Logs

```bash
# All functions
firebase functions:log

# Specific function
firebase functions:log --only executeScanFunction
```

### Firebase Console

- **Functions**: View invocations, errors, metrics
- **Hosting**: View traffic, errors
- **Firestore**: View usage, performance
- **Storage**: View usage

## CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd client && npm install
          cd ../functions && npm install
      
      - name: Build Next.js
        run: cd client && npm run build
      
      - name: Build Functions
        run: cd functions && npm run build
      
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: your-project-id
```

## Troubleshooting

### Functions Not Deploying

- Check Node.js version (must be 18)
- Verify `functions/package.json` has correct engines
- Check Firebase CLI version: `firebase --version`

### Next.js Build Issues

- Clear `.next` folder
- Reinstall dependencies
- Check TypeScript errors

### Webhook Errors

- Verify webhook secret is correct
- Check function logs
- Ensure webhook URL is accessible

### Hosting 404 Errors

- Check rewrites in `firebase.json`
- Verify Next.js routes
- Check build output directory

## Cost Optimization

### Cloud Functions

- Use appropriate memory allocation
- Set timeouts correctly
- Monitor invocations

### Firestore

- Use indexes efficiently
- Limit query results
- Cache when possible

### Hosting

- Static export for better performance
- Enable CDN caching
- Optimize images

## Security Checklist

- [ ] Firestore rules deployed
- [ ] Storage rules deployed
- [ ] Environment variables secured
- [ ] Webhook secret configured
- [ ] CORS properly configured
- [ ] Authentication required for functions
- [ ] Rate limiting implemented

## Support

- Firebase Docs: https://firebase.google.com/docs
- Next.js Docs: https://nextjs.org/docs
- Cloud Functions: https://firebase.google.com/docs/functions
