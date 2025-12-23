// Stripe Configuration
// You need to add your Stripe keys to .env.local
// Use pricing.ts for plan configuration instead

export const STRIPE_CONFIG = {
  // Publishable key (safe to expose in frontend)
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  
  // Product/Price IDs - Create these in your Stripe Dashboard
  // Use STRIPE_PRICE_IDS from @/config/pricing instead
  prices: {
    pro: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly',
      yearly: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly',
    },
    business: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PRICE_ID || 'price_business_monthly',
      yearly: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PRICE_ID || 'price_business_yearly',
    },
    enterprise: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || 'price_enterprise_monthly',
      yearly: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_YEARLY_PRICE_ID || 'price_enterprise_yearly',
    },
  },
};

// Success and cancel URLs
export const getStripeUrls = (origin: string) => ({
  success: `${origin}/dashboard?payment=success`,
  cancel: `${origin}/pricing?payment=canceled`,
});

