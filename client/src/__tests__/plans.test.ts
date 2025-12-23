/**
 * Plan & Billing Logic Tests
 * Critical for acquisition - proves billing correctness
 */

import {
  PLAN_TIERS,
  normalizePlan,
  hasFeature,
  getFeatureLimit,
  isHigherTier,
  getMinimumPlanForFeature,
  PLAN_FEATURES,
  PLAN_PRICING,
} from '../types/plans';

describe('Plan System', () => {
  describe('normalizePlan', () => {
    it('should normalize valid tier names', () => {
      expect(normalizePlan('essential')).toBe(PLAN_TIERS.ESSENTIAL);
      expect(normalizePlan('cloud')).toBe(PLAN_TIERS.CLOUD);
      expect(normalizePlan('pro')).toBe(PLAN_TIERS.PRO);
      expect(normalizePlan('enterprise')).toBe(PLAN_TIERS.ENTERPRISE);
    });

    it('should handle case insensitivity', () => {
      expect(normalizePlan('ESSENTIAL')).toBe(PLAN_TIERS.ESSENTIAL);
      expect(normalizePlan('Cloud')).toBe(PLAN_TIERS.CLOUD);
      expect(normalizePlan('PRO')).toBe(PLAN_TIERS.PRO);
    });

    it('should map legacy plan names', () => {
      expect(normalizePlan('free')).toBe(PLAN_TIERS.ESSENTIAL);
      expect(normalizePlan('starter')).toBe(PLAN_TIERS.ESSENTIAL);
      expect(normalizePlan('business')).toBe(PLAN_TIERS.CLOUD);
      expect(normalizePlan('team')).toBe(PLAN_TIERS.CLOUD);
    });

    it('should default to essential for unknown plans', () => {
      expect(normalizePlan('unknown')).toBe(PLAN_TIERS.ESSENTIAL);
      expect(normalizePlan('')).toBe(PLAN_TIERS.ESSENTIAL);
      expect(normalizePlan(null)).toBe(PLAN_TIERS.ESSENTIAL);
      expect(normalizePlan(undefined)).toBe(PLAN_TIERS.ESSENTIAL);
    });
  });

  describe('hasFeature', () => {
    it('should correctly check boolean features', () => {
      expect(hasFeature(PLAN_TIERS.ESSENTIAL, 'apiAccess')).toBe(false);
      expect(hasFeature(PLAN_TIERS.CLOUD, 'apiAccess')).toBe(true);
    });

    it('should correctly check numeric features', () => {
      expect(hasFeature(PLAN_TIERS.ESSENTIAL, 'scansPerMonth')).toBe(true);
      expect(hasFeature(PLAN_TIERS.ENTERPRISE, 'scansPerMonth')).toBe(true); // -1 = unlimited
    });

    it('should return false for enterprise-only features on lower tiers', () => {
      expect(hasFeature(PLAN_TIERS.ESSENTIAL, 'byokEncryption')).toBe(false);
      expect(hasFeature(PLAN_TIERS.CLOUD, 'byokEncryption')).toBe(false);
      expect(hasFeature(PLAN_TIERS.PRO, 'byokEncryption')).toBe(true);
    });
  });

  describe('getFeatureLimit', () => {
    it('should return correct scan limits', () => {
      expect(getFeatureLimit(PLAN_TIERS.ESSENTIAL, 'scansPerMonth')).toBe(10);
      expect(getFeatureLimit(PLAN_TIERS.CLOUD, 'scansPerMonth')).toBe(50);
      expect(getFeatureLimit(PLAN_TIERS.PRO, 'scansPerMonth')).toBe(200);
      expect(getFeatureLimit(PLAN_TIERS.ENTERPRISE, 'scansPerMonth')).toBe(-1); // unlimited
    });

    it('should return correct team member limits', () => {
      expect(getFeatureLimit(PLAN_TIERS.ESSENTIAL, 'teamMembers')).toBe(1);
      expect(getFeatureLimit(PLAN_TIERS.CLOUD, 'teamMembers')).toBe(5);
      expect(getFeatureLimit(PLAN_TIERS.PRO, 'teamMembers')).toBe(20);
    });
  });

  describe('isHigherTier', () => {
    it('should correctly compare tiers', () => {
      expect(isHigherTier(PLAN_TIERS.CLOUD, PLAN_TIERS.ESSENTIAL)).toBe(true);
      expect(isHigherTier(PLAN_TIERS.PRO, PLAN_TIERS.CLOUD)).toBe(true);
      expect(isHigherTier(PLAN_TIERS.ENTERPRISE, PLAN_TIERS.PRO)).toBe(true);
    });

    it('should return false for lower or equal tiers', () => {
      expect(isHigherTier(PLAN_TIERS.ESSENTIAL, PLAN_TIERS.CLOUD)).toBe(false);
      expect(isHigherTier(PLAN_TIERS.ESSENTIAL, PLAN_TIERS.ESSENTIAL)).toBe(false);
    });
  });

  describe('getMinimumPlanForFeature', () => {
    it('should return correct minimum plan', () => {
      expect(getMinimumPlanForFeature('apiAccess')).toBe(PLAN_TIERS.CLOUD);
      expect(getMinimumPlanForFeature('byokEncryption')).toBe(PLAN_TIERS.PRO);
      expect(getMinimumPlanForFeature('whiteLabel')).toBe(PLAN_TIERS.ENTERPRISE);
    });
  });

  describe('PLAN_PRICING', () => {
    it('should have valid pricing for all tiers', () => {
      expect(PLAN_PRICING[PLAN_TIERS.ESSENTIAL].monthly).toBe(130);
      expect(PLAN_PRICING[PLAN_TIERS.CLOUD].monthly).toBe(260);
      expect(PLAN_PRICING[PLAN_TIERS.PRO].monthly).toBe(434);
    });

    it('should have yearly pricing that makes sense', () => {
      // Yearly should be ~10x monthly (discount)
      Object.values(PLAN_TIERS).forEach(tier => {
        const monthly = PLAN_PRICING[tier].monthly;
        const yearly = PLAN_PRICING[tier].yearly;
        if (monthly > 0) {
          expect(yearly).toBeLessThanOrEqual(monthly * 12);
        }
      });
    });
  });

  describe('PLAN_FEATURES configuration', () => {
    it('should have all required features defined', () => {
      const requiredFeatures = [
        'scansPerMonth',
        'scheduledScans',
        'apiAccess',
        'teamMembers',
        'complianceReporting',
      ];

      Object.values(PLAN_TIERS).forEach(tier => {
        requiredFeatures.forEach(feature => {
          expect(PLAN_FEATURES[tier]).toHaveProperty(feature);
        });
      });
    });

    it('should have features increase with tier level', () => {
      // Higher tiers should have >= features than lower tiers
      expect(PLAN_FEATURES[PLAN_TIERS.CLOUD].scansPerMonth)
        .toBeGreaterThanOrEqual(PLAN_FEATURES[PLAN_TIERS.ESSENTIAL].scansPerMonth);
      
      expect(PLAN_FEATURES[PLAN_TIERS.PRO].teamMembers)
        .toBeGreaterThanOrEqual(PLAN_FEATURES[PLAN_TIERS.CLOUD].teamMembers);
    });
  });
});

