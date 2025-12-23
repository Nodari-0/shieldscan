# Firestore Database Schema

## Collections Overview

### Users Collection (`users`)
Stores user profile information and subscription details.

```typescript
{
  uid: string;                    // Firebase Auth UID (document ID)
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  subscription: {
    plan: 'free' | 'pro' | 'business';
    status: 'active' | 'cancelled' | 'past_due' | 'trialing';
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    currentPeriodStart: Timestamp | null;
    currentPeriodEnd: Timestamp | null;
    cancelAtPeriodEnd: boolean;
  };
  usage: {
    scansThisMonth: number;
    scansLimit: number;
    lastResetDate: Timestamp;
  };
  settings: {
    emailNotifications: boolean;
    reportLanguage: 'en' | 'fr';
    timezone: string;
  };
  gdpr: {
    consentGiven: boolean;
    consentDate: Timestamp | null;
    dataProcessingAllowed: boolean;
    marketingConsent: boolean;
  };
}
```

### Scans Collection (`scans`)
Stores individual scan records.

```typescript
{
  scanId: string;                 // Auto-generated (document ID)
  userId: string;                 // Reference to users/{uid}
  targetUrl: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Timestamp;
  completedAt: Timestamp | null;
  riskScore: number;              // 0-100
  findings: {
    vulnerabilities: Vulnerability[];
    sslInfo: SSLInfo | null;
    openPorts: PortInfo[];
    securityHeaders: SecurityHeaders;
    cmsDetection: CMSInfo | null;
    xssTests: XSSTestResult[];
    sqlInjectionTests: SQLTestResult[];
  };
  reportUrl: string | null;       // Firebase Storage URL for PDF
  createdAt: Timestamp;
}
```

### Sub-collections under `scans/{scanId}`

#### `vulnerabilities` Sub-collection
```typescript
{
  vulnerabilityId: string;        // Auto-generated (document ID)
  type: 'ssl' | 'headers' | 'xss' | 'sql' | 'cms' | 'ports' | 'other';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  recommendation: string;
  affectedResource: string;
  cveId: string | null;           // CVE identifier if applicable
  detectedAt: Timestamp;
}
```

### Subscriptions Collection (`subscriptions`)
Stores Stripe subscription information (mirrored from Stripe webhooks).

```typescript
{
  subscriptionId: string;         // Stripe subscription ID (document ID)
  userId: string;                 // Reference to users/{uid}
  stripeCustomerId: string;
  status: string;
  plan: 'free' | 'pro' | 'business';
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  cancelAtPeriodEnd: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Payment Events Collection (`payment_events`)
Logs all payment-related events from Stripe webhooks.

```typescript
{
  eventId: string;                // Stripe event ID (document ID)
  userId: string;
  type: string;                   // Stripe event type
  data: any;                      // Event payload
  processed: boolean;
  createdAt: Timestamp;
}
```

### Admin Users Collection (`admin_users`)
Stores admin user permissions and roles.

```typescript
{
  uid: string;                    // Firebase Auth UID (document ID)
  email: string;
  role: 'super_admin' | 'admin' | 'moderator';
  permissions: string[];
  createdAt: Timestamp;
  createdBy: string;
}
```

### Analytics Collection (`analytics`)
Stores aggregated analytics data.

```typescript
{
  date: string;                   // YYYY-MM-DD format (document ID)
  totalScans: number;
  totalUsers: number;
  scansByPlan: {
    free: number;
    pro: number;
    business: number;
  };
  vulnerabilitiesFound: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  createdAt: Timestamp;
}
```

## Data Types

### Vulnerability
```typescript
{
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  recommendation: string;
  affectedResource: string;
  cveId: string | null;
}
```

### SSLInfo
```typescript
{
  valid: boolean;
  issuer: string;
  validFrom: Timestamp;
  validTo: Timestamp;
  daysUntilExpiry: number;
  protocol: string;
  cipher: string;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
}
```

### PortInfo
```typescript
{
  port: number;
  state: 'open' | 'closed' | 'filtered';
  service: string | null;
  version: string | null;
  risk: 'critical' | 'high' | 'medium' | 'low' | 'info';
}
```

### SecurityHeaders
```typescript
{
  strictTransportSecurity: boolean;
  xFrameOptions: boolean;
  xContentTypeOptions: boolean;
  contentSecurityPolicy: boolean;
  xXSSProtection: boolean;
  referrerPolicy: boolean;
  permissionsPolicy: boolean;
  missingHeaders: string[];
  score: number;                  // 0-100
}
```

### CMSInfo
```typescript
{
  detected: boolean;
  cmsType: 'wordpress' | 'drupal' | 'joomla' | 'magento' | 'other' | null;
  version: string | null;
  vulnerabilities: string[];
}
```

### XSSTestResult
```typescript
{
  testType: string;
  vulnerable: boolean;
  payload: string;
  location: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}
```

### SQLTestResult
```typescript
{
  testType: string;
  vulnerable: boolean;
  payload: string;
  location: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}
```

## Firestore Security Rules

See `server/firestore.rules` for complete security rules.

### Key Rules:
- Users can only read/write their own user document
- Users can create scans and read their own scans
- Users can only read their own subscription data
- Admins have elevated permissions
- Public data (analytics aggregates) are read-only for authenticated users

## Indexes Required

1. `scans` collection:
   - Index: `userId` (ascending) + `createdAt` (descending)
   - Index: `status` (ascending) + `createdAt` (descending)

2. `subscriptions` collection:
   - Index: `userId` (ascending) + `status` (ascending)

3. `payment_events` collection:
   - Index: `userId` (ascending) + `createdAt` (descending)
   - Index: `processed` (ascending) + `createdAt` (ascending)

## GDPR Compliance

- User data includes consent tracking
- Right to deletion: All user data can be deleted via admin panel
- Data retention: Scan data retained per subscription plan
- Export functionality: Users can export their data
