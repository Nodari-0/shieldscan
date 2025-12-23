# Firebase Authentication Setup Guide

## Initial Configuration

### 1. Firebase Project Setup

1. Create a new Firebase project at https://console.firebase.google.com
2. Enable Authentication
3. Enable Firestore Database
4. Enable Firebase Storage
5. Add your domain to authorized domains

### 2. Authentication Methods

Enable the following authentication providers in Firebase Console:

- **Email/Password** (Primary method)
- **Google Sign-In** (Optional)
- **GitHub Sign-In** (Optional)

### 3. Environment Variables

Add to `.env` files:

```env
# Firebase Config (Client)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Firebase Admin Config (Server)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
```

### 4. Firebase Admin SDK Setup

1. Go to Project Settings > Service Accounts
2. Generate a new private key
3. Download the JSON file
4. Store securely (DO NOT commit to git)
5. Use environment variables instead (recommended)

## Authentication Flow

### User Registration
1. User provides email and password
2. Firebase Auth creates user account
3. Custom claims set for subscription plan (default: 'free')
4. User document created in Firestore `users` collection
5. Welcome email sent

### User Login
1. User authenticates with Firebase Auth
2. ID token retrieved
3. Token verified on backend
4. User document fetched from Firestore
5. Session established

### Protected Routes
- Dashboard routes require authentication
- Admin routes require custom claims (admin role)
- API endpoints verify Firebase ID tokens

## Custom Claims

Custom claims are set on the user's ID token:

```typescript
{
  subscriptionPlan: 'free' | 'pro' | 'business',
  role: 'user' | 'admin' | 'super_admin'
}
```

## Security Rules

### Firestore Rules
See `server/firestore.rules` for complete rules.

Key points:
- Users can only read/write their own data
- Admin users have elevated permissions
- Public read-only data is accessible to authenticated users

### Storage Rules
See `server/storage.rules` for complete rules.

Key points:
- Users can only upload their own scan reports
- Reports are readable by authenticated users (own reports only)
- Admin users can read all reports

## Implementation Files

- `client/src/firebase/config.ts` - Firebase client initialization
- `client/src/firebase/auth.ts` - Auth utility functions
- `server/src/config/firebase.ts` - Firebase Admin initialization
- `server/src/middleware/auth.ts` - Express middleware for token verification
- `server/src/routes/auth.routes.ts` - Authentication API routes

## GDPR Compliance

- Users can delete their accounts (via Firebase Auth)
- All associated data deleted from Firestore
- Data export functionality available
- Consent tracking in user profile
