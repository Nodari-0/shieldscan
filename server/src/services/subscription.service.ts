/**
 * Subscription Service
 * 
 * Handles Stripe subscription management.
 */

import Stripe from 'stripe';
import logger from '../utils/logger.js';
import { getFirestoreDB } from '../config/firebase.js';
import { setCustomClaims } from '../config/firebase.js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

/**
 * Create Stripe checkout session
 */
export const createCheckoutSession = async (
  userId: string,
  priceId: string
): Promise<string> => {
  logger.info(`Creating checkout session for user ${userId}`);

  try {
    const db = getFirestoreDB();
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    let customerId = userData?.subscription?.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userData?.email,
        metadata: {
          userId,
        },
      });
      customerId = customer.id;

      // Update user document
      await db.collection('users').doc(userId).update({
        'subscription.stripeCustomerId': customerId,
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/pricing`,
      metadata: {
        userId,
      },
    });

    return session.url || '';
  } catch (error: any) {
    logger.error('Checkout session creation failed:', error.message);
    throw error;
  }
};

/**
 * Handle Stripe webhook events
 */
export const handleWebhookEvent = async (
  event: Stripe.Event
): Promise<void> => {
  logger.info(`Handling Stripe webhook: ${event.type}`);

  const db = getFirestoreDB();

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId || 
          (await stripe.customers.retrieve(subscription.customer as string)) as Stripe.Customer;

        if (typeof userId === 'string') {
          const customerId = userId;
          const customer = await stripe.customers.retrieve(customerId);
          const userEmail = (customer as Stripe.Customer).email;

          // Find user by email or customer ID
          let userDoc = null;
          if (userEmail) {
            const usersSnapshot = await db.collection('users')
              .where('email', '==', userEmail)
              .limit(1)
              .get();
            if (!usersSnapshot.empty) {
              userDoc = usersSnapshot.docs[0];
            }
          }

          if (!userDoc) {
            const usersSnapshot = await db.collection('users')
              .where('subscription.stripeCustomerId', '==', customerId)
              .limit(1)
              .get();
            if (!usersSnapshot.empty) {
              userDoc = usersSnapshot.docs[0];
            }
          }

          if (userDoc) {
            const priceId = subscription.items.data[0]?.price.id;
            let plan: 'free' | 'pro' | 'business' = 'free';
            
            if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
              plan = 'pro';
            } else if (priceId === process.env.STRIPE_BUSINESS_PRICE_ID) {
              plan = 'business';
            }

            const updates: any = {
              'subscription.plan': plan,
              'subscription.status': subscription.status,
              'subscription.stripeSubscriptionId': subscription.id,
              'subscription.currentPeriodStart': new Date(subscription.current_period_start * 1000),
              'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
              'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
              updatedAt: new Date(),
            };

            // Update scan limits based on plan
            const planLimits: Record<string, number> = {
              free: 10,
              pro: 100,
              business: -1, // Unlimited
            };
            updates['usage.scansLimit'] = planLimits[plan];

            await userDoc.ref.update(updates);

            // Update custom claims
            await setCustomClaims(userDoc.id, {
              subscriptionPlan: plan,
            });

            // Save subscription document
            await db.collection('subscriptions').doc(subscription.id).set({
              subscriptionId: subscription.id,
              userId: userDoc.id,
              stripeCustomerId: customerId,
              status: subscription.status,
              plan,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              createdAt: new Date(subscription.created * 1000),
              updatedAt: new Date(),
            });

            logger.info(`Subscription updated for user ${userDoc.id}`);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionDoc = await db.collection('subscriptions').doc(subscription.id).get();
        
        if (subscriptionDoc.exists) {
          const userId = subscriptionDoc.data()?.userId;
          
          if (userId) {
            await db.collection('users').doc(userId).update({
              'subscription.plan': 'free',
              'subscription.status': 'cancelled',
              'subscription.stripeSubscriptionId': null,
              'subscription.currentPeriodStart': null,
              'subscription.currentPeriodEnd': null,
              'subscription.cancelAtPeriodEnd': false,
              'usage.scansLimit': 10,
              updatedAt: new Date(),
            });

            await setCustomClaims(userId, {
              subscriptionPlan: 'free',
            });

            logger.info(`Subscription cancelled for user ${userId}`);
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        // Handle successful payment
        logger.info(`Payment succeeded for invoice ${invoice.id}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        // Handle failed payment
        logger.info(`Payment failed for invoice ${invoice.id}`);
        break;
      }
    }

    // Log webhook event
    await db.collection('payment_events').doc(event.id).set({
      eventId: event.id,
      type: event.type,
      data: event.data.object,
      processed: true,
      createdAt: new Date(),
    });
  } catch (error: any) {
    logger.error('Webhook processing failed:', error);
    throw error;
  }
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (
  subscriptionId: string
): Promise<void> => {
  logger.info(`Cancelling subscription ${subscriptionId}`);

  try {
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    const db = getFirestoreDB();
    await db.collection('subscriptions').doc(subscriptionId).update({
      cancelAtPeriodEnd: true,
      updatedAt: new Date(),
    });

    logger.info(`Subscription ${subscriptionId} marked for cancellation`);
  } catch (error: any) {
    logger.error('Subscription cancellation failed:', error.message);
    throw error;
  }
};