import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }
  
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount provided' });
    }
    
    // Convert amount to cents (Stripe expects amounts in cents)
    const amountInCents = Math.round(amount * 100);
    
    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      // Add metadata about donation purpose
      metadata: {
        purpose: 'Cerebro Donation',
        prizePoolContribution: Math.round(amount * 0.75 * 100) / 100 // 75% goes to prize pool
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });
    
    res.status(200).json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (err) {
    console.error('Error creating payment intent:', err);
    res.status(500).json({ error: err.message });
  }
}