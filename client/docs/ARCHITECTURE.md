# ShieldScan Architecture Overview

**Version:** 1.0  
**Last Updated:** December 2024

---

## System Overview

ShieldScan is a web-based security scanning and attack surface management platform built with a modern, serverless-first architecture.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │   Next.js   │  │   React    │  │  TailwindCSS │                │
│  │   14 (App)  │  │   18.2     │  │     3.3      │                │
│  └─────────────┘  └─────────────┘  └─────────────┘                │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API LAYER                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │  Next.js   │  │    Rate     │  │    Auth     │                │
│  │  API Routes │  │   Limiting  │  │  Middleware │                │
│  └─────────────┘  └─────────────┘  └─────────────┘                │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       SERVICE LAYER                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │   Scanner   │  │  Evidence   │  │ Compliance  │                │
│  │   Engine    │  │   Chain     │  │   Mapper    │                │
│  └─────────────┘  └─────────────┘  └─────────────┘                │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │  Firebase   │  │  Firebase   │  │   Stripe    │                │
│  │  Firestore  │  │    Auth     │  │   Billing   │                │
│  └─────────────┘  └─────────────┘  └─────────────┘                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.x | React framework with App Router |
| React | 18.2 | UI library |
| TypeScript | 5.3 | Type safety |
| TailwindCSS | 3.3 | Styling |
| Framer Motion | 11.x | Animations |
| React Query | 5.x | Data fetching/caching |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js API Routes | - | Serverless API |
| Firebase Auth | 10.x | Authentication |
| Firestore | 10.x | Database |
| Stripe | 2.x | Payments |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Vercel | Hosting & Edge Functions |
| Firebase | Auth & Database |
| Sentry | Error Monitoring |
| Stripe | Payment Processing |

---

## Core Modules

### 1. Scanner Engine (`/src/app/api/scan/`)
- HTTP/HTTPS security checks
- SSL/TLS certificate validation
- DNS security analysis
- Security header verification
- Vulnerability detection (XSS, SQLi patterns)

### 2. Evidence System (`/src/lib/enterprise-security.ts`)
- SHA-256 hashed evidence chain
- Timestamped findings
- Cryptographic verification
- Export capabilities

### 3. Compliance Mapper (`/src/lib/compliance.ts`)
- SOC 2 control mapping
- PCI-DSS requirements
- GDPR compliance tracking
- ISO 27001 alignment

### 4. False Positive Engine (`/src/lib/false-positive-engine.ts`)
- ML-assisted scoring
- Rule-based suppression
- Dismissal taxonomy
- Learning feedback loop

---

## Data Flow

### Scan Execution Flow
```
User Request → Rate Limit Check → Auth Validation → Plan Check
      ↓
Scan Queue → Target Validation → DNS Resolution → TLS Check
      ↓
Header Analysis → Vulnerability Tests → Evidence Capture
      ↓
Results Processing → Evidence Chain → Firestore Storage
      ↓
Dashboard Update ← WebSocket/Polling
```

### Authentication Flow
```
User Login → Firebase Auth → JWT Token → API Requests
      ↓
Token Validation → User Profile → Plan Features → Access Grant
```

---

## Database Schema

### Collections
```
/users/{userId}
  - email
  - plan
  - scansUsed
  - createdAt

/scans/{scanId}
  - userId
  - url
  - score
  - findings[]
  - createdAt

/organizations/{orgId}
  - ownerId
  - encryptionConfig
  - members[]

/evidence/{evidenceId}
  - scanId
  - hash
  - previousHash
  - bundle
```

---

## Security Model

### Authentication
- Firebase Authentication (OAuth, Email/Password)
- JWT tokens with short expiry
- Session invalidation on password change

### Authorization
- Role-Based Access Control (RBAC)
- Organization-scoped data access
- Feature gating by plan tier

### Data Protection
- TLS 1.3 in transit
- AES-256 at rest (Firebase)
- BYOK option for enterprise

### Scanning Security
- Non-destructive tests only
- Rate limited per user
- Target ownership verification
- No credential storage

---

## Deployment

### Environment Variables
```
NEXT_PUBLIC_FIREBASE_*     # Firebase config
NEXT_PUBLIC_STRIPE_*       # Stripe keys
NEXT_PUBLIC_SITE_URL       # Base URL
RESEND_API_KEY             # Email service
HIBP_API_KEY               # Breach checking
```

### Build & Deploy
```bash
npm run build              # Production build
npm run start              # Production server
npm run test               # Run tests
npm run test:coverage      # Coverage report
```

---

## API Endpoints

### Public
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/scan` | POST | Execute security scan |
| `/api/scan/api` | POST | API-specific scan |

### Authenticated
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/scan` | POST | Authenticated scan |
| `/api/stripe/checkout` | POST | Create checkout |
| `/api/stripe/portal` | POST | Customer portal |

---

## Scaling Considerations

### Current Limits
- Concurrent scans: 5 per user
- Scan timeout: 5 minutes
- Rate limit: Based on plan tier

### Horizontal Scaling
- Scanner can be extracted to worker functions
- Queue-based processing ready (BullMQ configured)
- Database supports multi-region

---

## Monitoring

### Error Tracking
- Sentry integration for exceptions
- Structured logging in API routes
- Audit trail for sensitive operations

### Performance
- Vercel Analytics
- Firebase Performance Monitoring
- Custom scan duration metrics

---

## Future Architecture (Planned)

```
┌─────────────────────────────────────────────────────────────────────┐
│                      MICROSERVICES (Future)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │   Scanner   │  │  Reporter   │  │  Alerter    │                │
│  │   Service   │  │   Service   │  │  Service    │                │
│  └─────────────┘  └─────────────┘  └─────────────┘                │
│         ↓                ↓                ↓                        │
│  ┌─────────────────────────────────────────────────┐              │
│  │              Message Queue (Redis/BullMQ)        │              │
│  └─────────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

---

*This document is maintained as part of technical due diligence documentation.*

