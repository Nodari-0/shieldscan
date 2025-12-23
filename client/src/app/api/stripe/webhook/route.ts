import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { 
  updateUserSubscription, 
  findUserByStripeCustomerId,
  logSubscriptionEvent,
  findUserByEmail
} from '@/firebase/firestore';
import { getPlanFromPriceId } from '@/config/pricing';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    if (!webhookSecret) {
      console.error('Stripe webhook secret not configured');
      // In development, we can skip signature verification
      console.warn('⚠️ Webhook secret not set - processing without verification (DEV only)');
    }

    let event: Stripe.Event;

    try {
      if (webhookSecret) {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } else {
        // Parse event without verification (development only)
        event = JSON.parse(body) as Stripe.Event;
      }
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`📨 Stripe webhook received: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session, event.id);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription, event.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription, event.id);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice, event.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice, event.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session, eventId: string) {
  console.log('💳 Checkout completed:', session.id);

  const firebaseUid = session.metadata?.firebaseUid;
  // Get plan from metadata or try to determine from price ID
  let plan: 'free' | 'pro' | 'business' | 'enterprise' = (session.metadata?.plan as any) || 'pro';
  
  // If plan not in metadata, try to determine from subscription
  if (session.subscription) {
    try {
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      const priceId = subscription.items.data[0]?.price.id;
      const detectedPlan = getPlanFromPriceId(priceId);
      if (detectedPlan) plan = detectedPlan;
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  }
  
  const customerId = session.customer as string;

  if (!firebaseUid) {
    console.error('No Firebase UID in session metadata');
    
    // Try to find user by email
    const customerEmail = session.customer_email;
    if (customerEmail) {
      const user = await findUserByEmail(customerEmail);
      if (user) {
        await updateUserSubscription(user.uid, {
          plan,
          stripeCustomerId: customerId,
          stripeSubscriptionId: session.subscription as string,
          subscriptionStatus: 'active',
        });
        
        await logSubscriptionEvent({
          userId: user.uid,
          userEmail: customerEmail,
          type: 'subscription_created',
          stripeEventId: eventId,
          stripeCustomerId: customerId,
          stripeSubscriptionId: session.subscription as string,
          plan,
        });
        
        console.log(`✅ User ${user.uid} upgraded to ${plan}`);
      }
    }
    return;
  }

  // Update user in Firestore
  await updateUserSubscription(firebaseUid, {
    plan,
    stripeCustomerId: customerId,
    stripeSubscriptionId: session.subscription as string,
    subscriptionStatus: 'active',
  });

  // Log the event
  await logSubscriptionEvent({
    userId: firebaseUid,
    userEmail: session.customer_email || '',
    type: 'subscription_created',
    stripeEventId: eventId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: session.subscription as string,
    plan,
  });

  console.log(`✅ User ${firebaseUid} upgraded to ${plan}`);
}

async function handleSubscriptionChange(subscription: Stripe.Subscription, eventId: string) {
  console.log('🔄 Subscription changed:', subscription.id);

  const customerId = subscription.customer as string;
  const user = await findUserByStripeCustomerId(customerId);

  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  // Determine plan from price ID
  const priceId = subscription.items.data[0]?.price.id;
  let plan: 'free' | 'pro' | 'business' | 'enterprise' = getPlanFromPriceId(priceId || '') || 'free';

  // Map Stripe status to our status
  let status: 'active' | 'canceled' | 'past_due' | 'trialing' | null = null;
  switch (subscription.status) {
    case 'active':
      status = 'active';
      break;
    case 'past_due':
      status = 'past_due';
      break;
    case 'canceled':
      status = 'canceled';
      break;
    case 'trialing':
      status = 'trialing';
      break;
  }

  await updateUserSubscription(user.uid, {
    plan: status === 'active' || status === 'trialing' ? plan : 'free',
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: status,
    // Enterprise may have custom limits - preserve if already set
    customScanLimit: plan === 'enterprise' ? user.customScanLimit : undefined,
  });

  await logSubscriptionEvent({
    userId: user.uid,
    userEmail: user.email,
    type: 'subscription_updated',
    stripeEventId: eventId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    plan,
  });

  console.log(`✅ User ${user.uid} subscription updated: ${plan} (${status})`);
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription, eventId: string) {
  console.log('❌ Subscription canceled:', subscription.id);

  const customerId = subscription.customer as string;
  const user = await findUserByStripeCustomerId(customerId);

  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  await updateUserSubscription(user.uid, {
    plan: 'free',
    subscriptionStatus: 'canceled',
  });

  await logSubscriptionEvent({
    userId: user.uid,
    userEmail: user.email,
    type: 'subscription_canceled',
    stripeEventId: eventId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
  });

  console.log(`✅ User ${user.uid} downgraded to free`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice, eventId: string) {
  console.log('💰 Payment succeeded:', invoice.id);

  const customerId = invoice.customer as string;
  const user = await findUserByStripeCustomerId(customerId);

  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  await logSubscriptionEvent({
    userId: user.uid,
    userEmail: user.email,
    type: 'payment_succeeded',
    stripeEventId: eventId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: invoice.subscription as string,
    amount: invoice.amount_paid,
    currency: invoice.currency,
  });

  console.log(`✅ Payment recorded for user ${user.uid}: $${invoice.amount_paid / 100}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice, eventId: string) {
  console.log('⚠️ Payment failed:', invoice.id);

  const customerId = invoice.customer as string;
  const user = await findUserByStripeCustomerId(customerId);

  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  await logSubscriptionEvent({
    userId: user.uid,
    userEmail: user.email,
    type: 'payment_failed',
    stripeEventId: eventId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: invoice.subscription as string,
    amount: invoice.amount_due,
    currency: invoice.currency,
  });

  console.log(`⚠️ Payment failed for user ${user.uid}`);
}

