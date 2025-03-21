import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with your secret key and fallback for builds
const stripeKey = process.env.STRIPE_SECRET_KEY || 'placeholder_stripe_key_for_build_time_only';
const stripe = new Stripe(stripeKey);

// Log for build debugging
if (!process.env.STRIPE_SECRET_KEY) {
  console.log("Using placeholder Stripe key for build process");
}

export async function POST(request: Request) {
  try {
    const { amount, tier, startDate } = await request.json();
    
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount provided' },
        { status: 400 }
      );
    }
    
    if (!tier || (tier !== 'pro' && tier !== 'premium')) {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      );
    }
    
    // Convert amount to cents (Stripe expects amounts in cents)
    const amountInCents = Math.round(amount * 100);
    
    // For subscriptions that start in the future, we're creating a payment intent for the first month
    // When the app launches, you would convert these one-time payments into actual subscriptions
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      // Add metadata about subscription details
      metadata: {
        purpose: 'Cerebro Subscription Pre-order',
        tier: tier,
        pricePerMonth: amount,
        startDate: startDate || '2025-06-04', // Launch date
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });
    
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (err: unknown) {
    console.error('Error creating subscription intent:', err);
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
