// Subscription plans configuration
export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free' as const,
    name: 'Free',
    price: 0,
    currency: 'EUR',
    interval: 'month' as const,
    features: [
      '10 scans per month',
      'Basic vulnerability scanning',
      'SSL certificate checks',
      'Security headers analysis',
      'PDF reports',
    ],
    scanLimit: 10,
    stripePriceId: '',
  },
  pro: {
    id: 'pro' as const,
    name: 'Pro',
    price: 29,
    currency: 'EUR',
    interval: 'month' as const,
    features: [
      '100 scans per month',
      'Advanced vulnerability scanning',
      'XSS & SQL injection tests',
      'Open port scanning',
      'CMS detection',
      'Priority support',
      'Email notifications',
    ],
    scanLimit: 100,
    stripePriceId: process.env.VITE_STRIPE_PRO_PRICE_ID || '',
  },
  business: {
    id: 'business' as const,
    name: 'Business',
    price: 99,
    currency: 'EUR',
    interval: 'month' as const,
    features: [
      'Unlimited scans',
      'All Pro features',
      'API access',
      'Custom reports',
      'White-label reports',
      'Dedicated support',
      'SLA guarantee',
    ],
    scanLimit: -1, // -1 means unlimited
    stripePriceId: process.env.VITE_STRIPE_BUSINESS_PRICE_ID || '',
  },
};

// Risk score thresholds
export const RISK_SCORE_THRESHOLDS = {
  critical: 80,
  high: 60,
  medium: 40,
  low: 20,
};

// API endpoints
export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
  },
  scans: {
    create: '/scans',
    list: '/scans',
    get: (id: string) => `/scans/${id}`,
    cancel: (id: string) => `/scans/${id}/cancel`,
    report: (id: string) => `/scans/${id}/report`,
  },
  subscriptions: {
    create: '/subscriptions/create',
    update: '/subscriptions/update',
    cancel: '/subscriptions/cancel',
    webhook: '/subscriptions/webhook',
  },
  user: {
    profile: '/user/profile',
    usage: '/user/usage',
    settings: '/user/settings',
  },
  admin: {
    users: '/admin/users',
    scans: '/admin/scans',
    analytics: '/admin/analytics',
  },
};

// Date formats
export const DATE_FORMATS = {
  display: 'MMM dd, yyyy',
  datetime: 'MMM dd, yyyy HH:mm',
  time: 'HH:mm',
  iso: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
};
