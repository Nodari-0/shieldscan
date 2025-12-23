import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { STRIPE_PRICE_IDS } from '@/config/pricing';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export async function POST(request: NextRequest) {
  try {
    const { plan, interval = 'month', userId, userEmail } = await request.json();

    if (!plan || !userId || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required parameters: plan, userId, userEmail' },
        { status: 400 }
      );
    }

    // Validate plan
    if (!['pro', 'business', 'enterprise'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be pro, business, or enterprise' },
        { status: 400 }
      );
    }

    // Get price ID from config
    const priceId = interval === 'year'
      ? STRIPE_PRICE_IDS[plan as 'pro' | 'business' | 'enterprise']?.yearly
      : STRIPE_PRICE_IDS[plan as 'pro' | 'business' | 'enterprise']?.monthly;

    if (!priceId) {
      return NextResponse.json(
        { error: `Price ID not configured for ${plan} plan (${interval})` },
        { status: 500 }
      );
    }

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Add STRIPE_SECRET_KEY to your environment variables.' },
        { status: 500 }
      );
    }

    // Get origin for redirect URLs
    const origin = request.headers.get('origin') || 'http://localhost:3000';

    // Create or retrieve Stripe customer
    let customerId: string;
    
    // Check if customer already exists
    const existingCustomers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          firebaseUid: userId,
        },
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?payment=canceled`,
      metadata: {
        firebaseUid: userId,
        plan,
        billingPeriod,
      },
      subscription_data: {
        metadata: {
          firebaseUid: userId,
          plan,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    });

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

