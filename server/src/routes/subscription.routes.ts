/**
 * Subscription Routes
 */

import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { authenticateToken } from '../middleware/auth.js';
import { createCheckoutSession, handleWebhookEvent, cancelSubscription } from '../services/subscription.service.js';
import logger from '../utils/logger.js';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

/**
 * POST /api/subscriptions/create
 * Create Stripe checkout session
 */
router.post('/create', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { priceId } = req.body;
    const userId = req.user?.uid;

    if (!userId || !priceId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    const sessionUrl = await createCheckoutSession(userId, priceId);
    
    res.json({
      success: true,
      data: { url: sessionUrl },
    });
  } catch (error: any) {
    logger.error('Create subscription error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create subscription',
    });
  }
});

/**
 * POST /api/subscriptions/webhook
 * Handle Stripe webhooks
 */
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(500).json({
      success: false,
      error: 'Webhook secret not configured',
    });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    logger.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({
      success: false,
      error: `Webhook Error: ${err.message}`,
    });
  }

  try {
    await handleWebhookEvent(event);
    res.json({ received: true });
  } catch (error: any) {
    logger.error('Webhook processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Webhook processing failed',
    });
  }
});

/**
 * POST /api/subscriptions/cancel
 * Cancel subscription
 */
router.post('/cancel', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // Get user's subscription ID
    const { getFirestoreDB } = await import('../config/firebase.js');
    const db = getFirestoreDB();
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const subscriptionId = userDoc.data()?.subscription?.stripeSubscriptionId;
    
    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        error: 'No active subscription found',
      });
    }

    await cancelSubscription(subscriptionId);
    
    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
    });
  } catch (error: any) {
    logger.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cancel subscription',
    });
  }
});

/**
 * GET /api/subscriptions/plans
 * Get available subscription plans
 */
router.get('/plans', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        currency: 'EUR',
        interval: 'month',
        features: [
          '10 scans per month',
          'Basic vulnerability scanning',
          'SSL certificate checks',
          'Security headers analysis',
          'PDF reports',
        ],
        scanLimit: 10,
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 29,
        currency: 'EUR',
        interval: 'month',
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
        stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
      },
      {
        id: 'business',
        name: 'Business',
        price: 99,
        currency: 'EUR',
        interval: 'month',
        features: [
          'Unlimited scans',
          'All Pro features',
          'API access',
          'Custom reports',
          'White-label reports',
          'Dedicated support',
          'SLA guarantee',
        ],
        scanLimit: -1,
        stripePriceId: process.env.STRIPE_BUSINESS_PRICE_ID,
      },
    ],
  });
});

export default router;
