/**
 * Stripe Configuration
 * 
 * Server-side Stripe configuration and utilities
 */

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

// Initialize Stripe with your secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  
  typescript: true,
});

// Stripe configuration
export const STRIPE_CONFIG = {
  currency: 'inr', // Indian Rupee
  // For Stripe Checkout, only include supported types here. 'upi' and others
  // are not valid in payment_method_types for Checkout. Keep to ['card'] and
  // enable additional methods in Dashboard if available for your account.
  paymentMethods: ['card'],
  successUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/success`,
  cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout`,
};

// Helper function to format amount for Stripe (convert to paise)
export function formatAmountForStripe(amount: number): number {
  return Math.round(amount * 100);
}

// Helper function to format amount from Stripe (convert from paise)
export function formatAmountFromStripe(amount: number): number {
  return amount / 100;
}

// Create payment intent
export async function createPaymentIntent(
  amount: number,
  metadata: Record<string, string> = {}
): Promise<Stripe.PaymentIntent> {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: formatAmountForStripe(amount),
    currency: STRIPE_CONFIG.currency,
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return paymentIntent;
}

// Create checkout session
export async function createCheckoutSession(
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[],
  metadata: Record<string, string> = {},
  customerEmail?: string
): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: STRIPE_CONFIG.paymentMethods as Stripe.Checkout.SessionCreateParams.PaymentMethodType[],
    line_items: lineItems,
    mode: 'payment',
    success_url: `${STRIPE_CONFIG.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: STRIPE_CONFIG.cancelUrl,
    metadata,
    customer_email: customerEmail,
    shipping_address_collection: {
      allowed_countries: ['IN'],
    },
  });

  return session;
}

// Retrieve payment intent
export async function retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  return await stripe.paymentIntents.retrieve(paymentIntentId);
}

// Retrieve checkout session
export async function retrieveCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
  return await stripe.checkout.sessions.retrieve(sessionId);
}

// Create refund
export async function createRefund(
  paymentIntentId: string,
  amount?: number,
  reason?: Stripe.RefundCreateParams.Reason
): Promise<Stripe.Refund> {
  const refundData: Stripe.RefundCreateParams = {
    payment_intent: paymentIntentId,
  };

  if (amount) {
    refundData.amount = formatAmountForStripe(amount);
  }

  if (reason) {
    refundData.reason = reason;
  }

  return await stripe.refunds.create(refundData);
}
