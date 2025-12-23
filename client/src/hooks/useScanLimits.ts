'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { PLAN_CONFIG, PlanType } from '@/config/pricing';

// Admin emails get automatic Business (enterprise-like) access
const ADMIN_EMAILS = ['nodarirusishvililinkedin@gmail.com'];

export interface UserPlan {
  id: PlanType;
  name: string;
  scanLimit: number; // -1 for unlimited/custom
  scansUsed: number;
  scansRemaining: number;
  resetDate: string;
  features: string[];
}

function getResetDate(): string {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.toISOString();
}

export function useScanLimits() {
  const { user, userProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is admin (gets automatic Ultra access)
  const isAdmin = user?.email && ADMIN_EMAILS.some(
    email => email.toLowerCase() === user.email?.toLowerCase()
  );

  useEffect(() => {
    // Mark as loaded when we have user data
    if (user !== undefined) {
      setIsLoading(false);
    }
  }, [user]);

  // Map legacy plan names to new plan names
  const mapLegacyPlan = (plan: string): PlanType => {
    const legacyMapping: Record<string, PlanType> = {
      'free': 'essential',
      'pro': 'cloud',
      'business': 'pro',
      'enterprise': 'enterprise',
    };
    return legacyMapping[plan] || (plan as PlanType) || 'essential';
  };

  // Get current plan info from Firestore profile or defaults
  const getPlanInfo = useCallback((): UserPlan => {
    // Admins always get Pro (enterprise-like with unlimited)
    if (isAdmin) {
      const config = PLAN_CONFIG.pro;
      return {
        id: 'pro',
        name: 'Pro (Admin)',
        scanLimit: -1, // Unlimited for admin
        scansUsed: userProfile?.scansUsed || 0,
        scansRemaining: -1,
        resetDate: getResetDate(),
        features: config.features,
      };
    }

    // Use Firestore profile if available
    if (userProfile) {
      const rawPlan = userProfile.plan || 'essential';
      const plan = mapLegacyPlan(rawPlan);
      const config = PLAN_CONFIG[plan];
      
      if (!config) {
        // Fallback to essential if plan config not found
        const essentialConfig = PLAN_CONFIG.essential;
        return {
          id: 'essential',
          name: essentialConfig.name,
          scanLimit: essentialConfig.scansLimit,
          scansUsed: userProfile.scansUsed || 0,
          scansRemaining: Math.max(0, essentialConfig.scansLimit - (userProfile.scansUsed || 0)),
          resetDate: getResetDate(),
          features: essentialConfig.features,
        };
      }
      
      const limit = userProfile.scansLimit ?? config.scansLimit;
      const used = userProfile.scansUsed || 0;
      const remaining = limit === -1 ? -1 : Math.max(0, limit - used);

      return {
        id: plan,
        name: config.name,
        scanLimit: limit,
        scansUsed: used,
        scansRemaining: remaining,
        resetDate: getResetDate(),
        features: config.features,
      };
    }

    // Default to essential plan
    const essentialConfig = PLAN_CONFIG.essential;
    return {
      id: 'essential',
      name: essentialConfig.name,
      scanLimit: essentialConfig.scansLimit,
      scansUsed: 0,
      scansRemaining: essentialConfig.scansLimit,
      resetDate: getResetDate(),
      features: essentialConfig.features,
    };
  }, [userProfile, isAdmin]);

  // Check if user can scan
  const canScan = useCallback((): boolean => {
    // Admins can always scan
    if (isAdmin) return true;

    const planInfo = getPlanInfo();
    if (planInfo.scanLimit === -1) return true; // Unlimited
    return planInfo.scansUsed < planInfo.scanLimit;
  }, [isAdmin, getPlanInfo]);

  // Record a scan (this is now handled by Firestore in the scan API)
  const recordScan = useCallback(() => {
    // Scan recording is now done server-side via Firestore
    console.log('Scan recorded - will be synced to Firestore');
  }, []);

  // Upgrade plan (now done via Stripe)
  const upgradePlan = useCallback((newPlan: PlanType) => {
    console.log('Plan upgrade requested:', newPlan);
    // This is now handled by Stripe checkout
  }, []);

  return {
    planInfo: getPlanInfo(),
    canScan: canScan(),
    recordScan,
    upgradePlan,
    isLoading,
    isAdmin: !!isAdmin,
    // Expose Stripe customer ID for portal access
    stripeCustomerId: userProfile?.stripeCustomerId,
  };
}
