# ShieldScan — Enterprise Security Scanning Platform

> **Enterprise-grade attack surface and compliance intelligence engine** built with **Next.js 14 + Firebase + Stripe**

ShieldScan is a comprehensive security scanning platform designed for MSSPs, security teams, and compliance-driven organizations. It provides evidence-based vulnerability detection, API-first security scanning, and audit-ready compliance mapping with 50%+ false positive reduction.

---

## 🎯 Product Positioning

> **"Fast, evidence-based security scanning built for APIs and developers — with predictable pricing and zero noise."**

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Core Features](#-core-features)
- [Dashboard Components](#-dashboard-components)
- [Landing Page Components](#-landing-page-components)
- [API Endpoints](#-api-endpoints)
- [Enterprise Features](#-enterprise-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
- [Testing](#-testing)
- [Deployment](#-deployment)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** or **yarn**
- **Firebase project** ([console.firebase.google.com](https://console.firebase.google.com))
- **Stripe account** (for payment processing)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd ShieldScan/client

# Install dependencies
npm install

# Copy environment template
cp env.example .env.local

# Start development server
npm run dev

# Visit http://localhost:3000
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript checking
npm run test         # Run Jest tests
npm run test:coverage # Run tests with coverage
```

---

## ✨ Core Features

### 1️⃣ Evidence-Based Findings (Zero-Trust Results)

Every vulnerability includes:
- ✅ Exact request/response captured
- ✅ Reproduction steps
- ✅ SHA-256 hashed evidence chain
- ✅ Cryptographic timestamps
- ✅ Proof-of-impact documentation

**"No evidence = no finding"** — eliminates false positives

### 2️⃣ API-First Security (Not Website-First)

- Native **OpenAPI/Swagger ingestion**
- Automatic parameter fuzzing
- Auth flow testing
- API-specific vulnerabilities:
  - BOLA / BFLA detection
  - Mass assignment probes
  - Rate limit testing
  - JWT misconfiguration checks

### 3️⃣ Developer-Friendly Fix Engine

Auto-generated fixes in:
- Node.js / Express
- Python / Flask / Django
- Java / Spring
- Go

Shows vulnerable vs. fixed code with IDE-style syntax highlighting.

### 4️⃣ Smart Scan Intelligence (Incremental Scanning)

- Detects changes since last scan
- Scans only diffs (endpoints, params, auth logic)
- Full scans only when necessary
- **5× faster scans**, lower costs

### 5️⃣ Risk-Based Scoring (Not CVSS Only)

Combines:
- Exploitability score
- Authentication requirements
- Internet exposure
- Data sensitivity
- Environment (prod/staging)

Output: **"Fix this first"** prioritization

### 6️⃣ One-Click Auth Scanning

- Login recorder (browser or API token capture)
- Supports: JWT, OAuth2, Cookies, API keys, Bearer tokens
- Auto token refresh
- Auth profile management

### 7️⃣ Privacy-First by Default

- No data retention by default
- Sensitive payload redaction
- GDPR-ready evidence reports
- Data export/delete controls

### 8️⃣ Scan Credits + Predictable Pricing

| Plan | Price | Scans/Month | Key Features |
|------|-------|-------------|--------------|
| **Essential** | €130/mo | 10 | 1 scheduled scan, basic scanning |
| **Cloud** | €260/mo | 50 | Unlimited scheduled, cloud security, AI analyst |
| **Pro** | €434/mo | 200 | Internal scanning, BYOK encryption, SLA |
| **Enterprise** | Custom | Unlimited | Attack surface discovery, white-label |

### 9️⃣ Human-Verified Findings

- Pro users request manual verification
- SLA-based response (24–72h)
- Expert security review
- Verification status tracking

### 🔟 CI/CD Integration

- **SARIF output** for GitHub/GitLab
- **PR comments** with exploit summary + fix snippets
- **Smart build failures** (only on exploitable issues)
- GitHub Actions / GitLab CI / Jenkins compatible

---

## 🖥️ Dashboard Components

### Core Scanning

| Component | File | Description |
|-----------|------|-------------|
| **ScanModal** | `ScanModal.tsx` | Main scan initiation interface with URL input, auth profile selection |
| **ScanDetailView** | `ScanDetailView.tsx` | Detailed scan results with findings, evidence, fix suggestions |
| **ScanDetailModal** | `ScanDetailModal.tsx` | Modal view for scan results |
| **SecurityScoreGauge** | `SecurityScoreGauge.tsx` | Visual security score (0-100) with grade |
| **ScanHistoryChart** | `ScanHistoryChart.tsx` | Historical scan scores over time |

### API Security

| Component | File | Description |
|-----------|------|-------------|
| **APISecurityScanner** | `APISecurityScanner.tsx` | OpenAPI/Swagger import and API endpoint scanning |
| **AttackSurfaceScanner** | `AttackSurfaceScanner.tsx` | External attack surface discovery and monitoring |

### Evidence & Findings

| Component | File | Description |
|-----------|------|-------------|
| **EvidenceViewer** | `EvidenceViewer.tsx` | Displays request/response evidence, screenshots, reproduction steps |
| **FixSuggestionPanel** | `FixSuggestionPanel.tsx` | IDE-style code fix suggestions in multiple languages |
| **RiskPriorityPanel** | `RiskPriorityPanel.tsx` | "Fix this first" prioritized recommendations |
| **FalsePositiveDefense** | `FalsePositiveDefense.tsx` | ML-assisted FP scoring, suppression rules |

### Authentication

| Component | File | Description |
|-----------|------|-------------|
| **AuthProfileManager** | `AuthProfileManager.tsx` | Manage auth profiles (JWT, OAuth2, API keys, cookies) |
| **LoginRecorder** | `LoginRecorder.tsx` | Capture login credentials for authenticated scanning |

### Compliance & Reporting

| Component | File | Description |
|-----------|------|-------------|
| **ComplianceDashboard** | `ComplianceDashboard.tsx` | SOC 2, PCI-DSS, HIPAA, GDPR, ISO 27001 mapping |
| **ReportingDashboard** | `ReportingDashboard.tsx` | Executive PDF report generation and scheduling |
| **ReportsView** | `ReportsView.tsx` | View and export scan reports |
| **ReportsModal** | `ReportsModal.tsx` | Quick report access modal |

### Security Intelligence

| Component | File | Description |
|-----------|------|-------------|
| **SecurityIntelligence** | `SecurityIntelligence.tsx` | Posture scoring, risk velocity, industry benchmarks |
| **ThreatMonitor** | `ThreatMonitor.tsx` | Real-time threat monitoring dashboard |
| **ThreatMeter** | `ThreatMeter.tsx` | Visual threat level indicator |

### Team & Organization

| Component | File | Description |
|-----------|------|-------------|
| **TeamManagement** | `TeamManagement.tsx` | Team members, roles (Owner/Admin/Member/Viewer), API keys |
| **AssetInventory** | `AssetInventory.tsx` | Discovered assets, tagging, monitoring |
| **IntegrationsHub** | `IntegrationsHub.tsx` | Slack, Jira, GitHub, PagerDuty, webhooks |

### Settings & Tools

| Component | File | Description |
|-----------|------|-------------|
| **DashboardSettings** | `DashboardSettings.tsx` | Theme, font size, language preferences |
| **DashboardSidebar** | `DashboardSidebar.tsx` | Main navigation sidebar |
| **DashboardSearch** | `DashboardSearch.tsx` | Ctrl+K search modal |
| **PrivacySettings** | `PrivacySettings.tsx` | Data retention, redaction, GDPR controls |
| **CreditsUsage** | `CreditsUsage.tsx` | Scan credits balance and usage history |

### Security Tools

| Component | File | Description |
|-----------|------|-------------|
| **EmailBreachChecker** | `EmailBreachChecker.tsx` | Check emails against breach databases |
| **PasswordStrengthChecker** | `PasswordStrengthChecker.tsx` | Password strength analysis + generator |

### Enterprise Features

| Component | File | Description |
|-----------|------|-------------|
| **TrustCenter** | `TrustCenter.tsx` | Security documentation, certifications, compliance docs |
| **ROICalculator** | `ROICalculator.tsx` | Calculate cost savings vs manual pentesting |
| **AcquisitionReadiness** | `AcquisitionReadiness.tsx` | Due diligence checklist for enterprise |
| **HumanVerification** | `HumanVerification.tsx` | Request expert review of critical findings |

### CI/CD Integration

| Component | File | Description |
|-----------|------|-------------|
| **CICDExport** | `CICDExport.tsx` | SARIF export, PR comment generation |
| **IncrementalScanBadge** | `IncrementalScanBadge.tsx` | Shows Quick/Incremental/Full scan mode |

### AI Features

| Component | File | Description |
|-----------|------|-------------|
| **AskAI** | `AskAI.tsx` | AI security advisor chat interface |
| **AskAIPopup** | `AskAIPopup.tsx` | Floating AI assistant popup |

### Scheduling

| Component | File | Description |
|-----------|------|-------------|
| **ScheduledScans** | `ScheduledScans.tsx` | Schedule recurring security scans |

### Modals & Utilities

| Component | File | Description |
|-----------|------|-------------|
| **UpgradeModal** | `UpgradeModal.tsx` | Plan upgrade prompts |
| **LockedFeatureModal** | `LockedFeatureModal.tsx` | Feature locked by plan tier |
| **DashboardErrorBoundary** | `DashboardErrorBoundary.tsx` | Error boundary for dashboard |

---

## 🏠 Landing Page Components

| Component | File | Description |
|-----------|------|-------------|
| **Navigation** | `Navigation.tsx` | Main header navigation with auth state |
| **Hero** | `Hero.tsx` | Hero section with animated typewriter |
| **FeaturesSection** | `FeaturesSection.tsx` | Product features showcase |
| **SecurityChecksSection** | `SecurityChecksSection.tsx` | 50+ security checks with categories |
| **HowItWorksSection** | `HowItWorksSection.tsx` | Step-by-step scanning process |
| **PricingSection** | `PricingSection.tsx` | Pricing tiers with feature comparison |
| **AdvantagesSection** | `AdvantagesSection.tsx` | Key differentiators |
| **CostSavingsSection** | `CostSavingsSection.tsx` | ROI and cost comparison |
| **TestimonialsSection** | `TestimonialsSection.tsx` | Customer testimonials |
| **ThreatStatsSection** | `ThreatStatsSection.tsx` | Real-time threat statistics |
| **TrustedBy** | `TrustedBy.tsx` | Logo showcase of customers |
| **FAQSection** | `FAQSection.tsx` | Frequently asked questions |
| **Footer** | `Footer.tsx` | Site footer with links |

---

## 🔌 API Endpoints

### Public Scan API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/scan` | POST | Execute security scan |
| `/api/scan/api` | POST | API-specific security scan |
| `/api/scan/attack-surface` | POST | Attack surface discovery |

### Authenticated API (v1)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/scan` | POST | Queue authenticated scan |
| `/api/v1/scan/:id` | GET | Get scan results |
| `/api/v1/scans` | GET | List scans (paginated) |

### Security Tools

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/email-check` | POST | Check email breaches (HIBP) |
| `/api/password-check` | POST | Check password breaches |

### Payments

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stripe/checkout` | POST | Create checkout session |
| `/api/stripe/portal` | POST | Open customer portal |
| `/api/stripe/webhook` | POST | Stripe webhook handler |

### Documentation

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/docs/openapi` | GET | OpenAPI specification |

---

## 🏢 Enterprise Features

### Security Infrastructure

| Feature | Library | Description |
|---------|---------|-------------|
| **Real Cryptography** | `crypto.ts` | SHA-256, HMAC-SHA256, secure random generation |
| **Evidence Chain** | `enterprise-security.ts` | Immutable, hashed evidence records |
| **Enterprise Persistence** | `enterprise-persistence.ts` | Firestore-based server-side storage |

### Risk & Intelligence

| Feature | Library | Description |
|---------|---------|-------------|
| **Risk Scoring** | `riskScoring.ts` | Multi-factor risk calculation |
| **Security Intelligence** | `security-intelligence.ts` | Posture tracking, attack surface, benchmarks |
| **False Positive Engine** | `false-positive-engine.ts` | ML scoring, suppression rules |

### Compliance & Reporting

| Feature | Library | Description |
|---------|---------|-------------|
| **Compliance Mapping** | `compliance.ts` | SOC 2, PCI-DSS, HIPAA, GDPR, ISO 27001 |
| **PDF Reports** | `reporting.ts`, `pdfGenerator.ts` | Executive report generation |
| **Audit Logging** | `auditLogger.ts` | Immutable activity logs |

### Integrations

| Feature | Library | Description |
|---------|---------|-------------|
| **Third-Party Integrations** | `integrations.ts` | Slack, Jira, GitHub, PagerDuty |
| **CI/CD** | `cicd.ts` | SARIF, PR comments, build failures |
| **Real-time Monitoring** | `realtime.ts` | Live threat feeds, alerts |

### Organization Management

| Feature | Library | Description |
|---------|---------|-------------|
| **Organizations** | `organization.ts` | Teams, roles, API keys |
| **Credits System** | `credits.ts` | Scan credits, usage tracking |
| **Privacy Controls** | `privacy.ts` | Data retention, redaction, GDPR |

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Framework** | Next.js (App Router) | 14.x |
| **Language** | TypeScript | 5.3 |
| **UI Library** | React | 18.2 |
| **Styling** | TailwindCSS | 3.3 |
| **Animations** | Framer Motion | 11.x |
| **Data Fetching** | TanStack Query | 5.x |
| **State** | Zustand | 4.x |
| **Auth** | Firebase Auth | 10.x |
| **Database** | Firestore | 10.x |
| **Payments** | Stripe | 2.x |
| **Charts** | Recharts, Chart.js | - |
| **PDF** | jsPDF | 2.x |
| **Testing** | Jest, Testing Library | 29.x |
| **Error Tracking** | Sentry | 8.x |

---

## 📁 Project Structure

```
ShieldScan/
├── client/                          # Next.js Application
│   ├── src/
│   │   ├── app/                    # App Router Pages
│   │   │   ├── api/               # API Routes
│   │   │   │   ├── scan/          # Scanning endpoints
│   │   │   │   ├── stripe/        # Payment endpoints
│   │   │   │   └── v1/            # Public API v1
│   │   │   ├── dashboard/         # Dashboard pages
│   │   │   ├── pricing/           # Pricing page
│   │   │   └── ...               # Other pages
│   │   ├── components/
│   │   │   ├── dashboard/         # 42 dashboard components
│   │   │   ├── landing/           # 13 landing page components
│   │   │   └── ui/               # Shared UI components
│   │   ├── lib/                   # Business logic libraries
│   │   │   ├── scanners/          # Security scanners
│   │   │   ├── crypto.ts          # Cryptography
│   │   │   ├── compliance.ts      # Compliance mapping
│   │   │   └── ...
│   │   ├── types/                 # TypeScript definitions
│   │   │   ├── plans.ts           # Unified plan types
│   │   │   └── ...
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── firebase/              # Firebase configuration
│   │   └── config/                # App configuration
│   ├── docs/                      # Technical documentation
│   │   └── ARCHITECTURE.md
│   ├── sale-materials/            # Acquisition materials
│   ├── __tests__/                 # Jest tests
│   ├── jest.config.js
│   └── package.json
├── docs/                           # Project documentation
└── README.md                       # This file
```

---

## ⚙️ Configuration

### Environment Variables

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Pricing IDs
NEXT_PUBLIC_STRIPE_ESSENTIAL_MONTHLY_PRICE_ID=
NEXT_PUBLIC_STRIPE_CLOUD_MONTHLY_PRICE_ID=
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID=

# Optional
HIBP_API_KEY=           # Have I Been Pwned
RESEND_API_KEY=         # Email service
SENTRY_DSN=             # Error tracking
```

---

## 🧪 Testing

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Coverage Targets

| Metric | Target |
|--------|--------|
| Branches | 30% |
| Functions | 30% |
| Lines | 30% |
| Statements | 30% |

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Firebase Hosting

```bash
# Build
npm run build

# Deploy
firebase deploy --only hosting
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 📊 Metrics & Monitoring

- **Error Tracking**: Sentry integration
- **Analytics**: Vercel Analytics
- **Audit Logs**: Firestore collection
- **Performance**: Firebase Performance Monitoring

---

## 🔒 Security

- **Authentication**: Firebase Auth (Email, Google, GitHub)
- **Authorization**: Role-based access control (RBAC)
- **Encryption**: AES-256 at rest, TLS 1.3 in transit
- **Rate Limiting**: Per-user and per-IP
- **Input Validation**: Server-side validation
- **CORS**: Configured for production domains

---

## 📄 License

Proprietary - All rights reserved

---

## 📞 Support

- **Documentation**: `/docs` folder
- **API Docs**: `/api-docs` in application
- **Architecture**: `client/docs/ARCHITECTURE.md`

---

**Built with ❤️ for security teams who demand evidence, not noise.**
