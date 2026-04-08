import { NextApiRequest, NextApiResponse } from 'next';

// --- CONFIGURATION & ENVIRONMENT VARIABLES ---
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY; // TODO: Add STRIPE_SECRET_KEY to your .env.local
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID; // TODO: Add PAYPAL_CLIENT_ID to your .env.local
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET; // TODO: Add PAYPAL_CLIENT_SECRET to your .env.local

const EXCHANGE_RATE_API_URL = 'https://api.frankfurter.app/latest?from=USD&to=NGN';
const PAYPAL_API_URL = 'https://api-m.sandbox.paypal.com'; // Use 'https://api-m.paypal.com' for production

// --- TYPE DEFINITIONS ---
export enum Gateway {
  PAYSTACK = 'paystack',
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
}

export enum SubscriptionTier {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium',
}

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  startDate: Date;
  endDate: Date;
  paid: boolean;
  gateway: Gateway;
  gatewayReference: string;
}

// --- EXCHANGE RATE ---
export async function fetchUSDtoNGNRate(): Promise<number> {
  try {
    const response = await fetch(EXCHANGE_RATE_API_URL);
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    const data = await response.json();
    const rate = data.rates.NGN;
    if (!rate) throw new Error('NGN rate not found in response.');
    return rate;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return 1400; // Fallback rate
  }
}

// === PAYMENT GATEWAY LOGIC =============================================

// --- 1. PAYSTACK ---
async function initializePaystack(email: string, amount: number, metadata: any) {
  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, amount: Math.round(amount * 100), metadata }),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

async function verifyPaystack(reference: string) {
  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

// --- 2. STRIPE ---
async function initializeStripe(email: string, amount: number, metadata: any) {
  // NOTE: Stripe requires a success_url with a session_id placeholder
  const success_url = `${process.env.NEXT_PUBLIC_APP_URL}/verify-payment?gateway=stripe&session_id={CHECKOUT_SESSION_ID}`;
  const cancel_url = `${process.env.NEXT_PUBLIC_APP_URL}/subscribe`;

  const params = new URLSearchParams();
  params.append('payment_method_types[0]', 'card');
  params.append('line_items[0][price_data][currency]', 'usd');
  params.append('line_items[0][price_data][product_data][name]', `ClearBooks Subscription (${metadata.tier})`);
  params.append('line_items[0][price_data][unit_amount]', String(Math.round(amount * 100)));
  params.append('line_items[0][quantity]', '1');
  params.append('mode', 'payment');
  params.append('success_url', success_url);
  params.append('cancel_url', cancel_url);
  params.append('customer_email', email);
  Object.keys(metadata).forEach(key => params.append(`metadata[${key}]`, metadata[key]));

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
    body: params,
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

async function verifyStripe(sessionId: string) {
  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

// --- 3. PAYPAL (Placeholder) ---
async function initializePayPal(email: string, amount: number, metadata: any) {
    console.log('PayPal init for:', { email, amount, metadata });
    // TODO: Implement PayPal order creation logic here
    throw new Error("PayPal is not yet implemented.");
}

async function verifyPayPal(orderId: string) {
    console.log('PayPal verify for:', orderId);
    // TODO: Implement PayPal order capture/verification logic here
    throw new Error("PayPal is not yet implemented.");
}

// --- MAIN INITIALIZATION & VERIFICATION FUNCTIONS ---

export async function initializePayment(gateway: Gateway, email: string, amount: number, metadata: any) {
  switch (gateway) {
    case Gateway.PAYSTACK:
      if (!PAYSTACK_SECRET_KEY) throw new Error('Paystack key is not configured.');
      return initializePaystack(email, amount, metadata);
    case Gateway.STRIPE:
      if (!STRIPE_SECRET_KEY) throw new Error('Stripe key is not configured.');
      // Stripe requires amount in USD, so we don't convert it to NGN.
      const amountInUSD = prices[metadata.tier as SubscriptionTier] || 0;
      return initializeStripe(email, amountInUSD, metadata);
    case Gateway.PAYPAL:
        if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) throw new Error('PayPal keys are not configured.');
        // PayPal also uses USD
        const priceUSD = prices[metadata.tier as SubscriptionTier] || 0;
        return initializePayPal(email, priceUSD, metadata);
    default:
      throw new Error('Invalid payment gateway specified.');
  }
}

export async function verifyPayment(gateway: Gateway, reference: string) {
  switch (gateway) {
    case Gateway.PAYSTACK:
        const paystackData = await verifyPaystack(reference);
        if (paystackData.data.status !== 'success') throw new Error("Paystack payment not successful");
        return { ...paystackData.data.metadata, reference: paystackData.data.reference };
    case Gateway.STRIPE:
        const stripeData = await verifyStripe(reference); // reference is the session_id
        if (stripeData.payment_status !== 'paid') throw new Error("Stripe payment not successful");
        return { ...stripeData.metadata, reference: stripeData.payment_intent };
    case Gateway.PAYPAL:
        // TODO: Implement PayPal verification
        // const paypalData = await verifyPayPal(reference); // reference is the order ID
        // return { ...paypalData.metadata, reference: paypalData.id };
        throw new Error("PayPal verification is not implemented");
    default:
      throw new Error('Invalid payment gateway for verification.');
  }
}

// --- SUBSCRIPTION PRICE --- 
export const prices: Record<SubscriptionTier, number> = {
    [SubscriptionTier.FREE]: 0,
    [SubscriptionTier.BASIC]: 10, // Price in USD
    [SubscriptionTier.PREMIUM]: 25, // Price in USD
};

// === DATABASE LOGIC (Placeholders) =========================================

export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  // TODO: Replace with your actual database logic
  console.log("DB: Fetching subscription for user:", userId);
  return null;
}

export async function createOrUpdateSubscription(userId: string, tier: SubscriptionTier, durationInDays: number, gateway: Gateway, gatewayReference: string) {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + durationInDays);

  // TODO: Replace with your actual database logic (e.g., Prisma upsert)
  const subscription: Subscription = {
    id: new Date().toISOString(),
    userId,
    tier,
    startDate,
    endDate,
    paid: true,
    gateway,
    gatewayReference,
  };

  console.log("DB: Creating/Updating subscription:", subscription);
  return subscription;
}

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  if (!subscription || !subscription.paid) return false;
  return new Date() < subscription.endDate;
}
