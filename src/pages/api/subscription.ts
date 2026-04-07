
import { NextApiRequest, NextApiResponse } from 'next';
import { SubscriptionTier } from '@/lib/subscription';

// SECURE: Use an environment variable for the Paystack secret key
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const CBN_API_URL = 'https://www.cbn.gov.ng/rates/output.asp?_=1720617835111&rate=usd'; //This is a placeholder, a more reliable API should be used

// --- DEBUGGING --- 
if (PAYSTACK_SECRET_KEY) {
  console.log('Paystack key loaded successfully. Starts with:', PAYSTACK_SECRET_KEY.substring(0, 7));
} else {
  console.error('!!! CRITICAL: Paystack secret key is NOT loaded. Check your .env.local file and restart the server.');
}


// --- Exchange Rate ---
async function fetchExchangeRate(): Promise<number> {
  try {
    const response = await fetch(CBN_API_URL);
    const data = await response.json(); 
    const rate = data.rates.USD; 
    return rate;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return 500; // Default to a safe estimate
  }
}


async function calculatePriceInNaira(priceInUSD: number): Promise<number> {
  const exchangeRate = await fetchExchangeRate();
  return priceInUSD * exchangeRate;
}


// --- Paystack Integration ---
async function initializePayment(email: string, amount: number, metadata: any) {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('Paystack secret key is not configured.');
  }
  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: amount * 100, // Paystack expects amount in kobo
      metadata
    }),
  });

  const data = await response.json();
  return data;
}

async function verifyPayment(reference: string) {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('Paystack secret key is not configured.');
  }
  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    },
  });

  const data = await response.json();
  return data;
}

// --- Subscription Management ---

async function getUserSubscription(userId: string): Promise<any | null> {
    console.log("Fetching subscription for user:", userId)
    return null; // Placeholder
}

async function createSubscription(userId: string, tier: SubscriptionTier, durationInDays: number, paid: boolean) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + durationInDays);

    const subscription = {
        id: new Date().toISOString(), 
        userId,
        tier,
        startDate,
        endDate,
        paid
    };
    console.log("Creating subscription:", subscription);
    return subscription;
}

async function hasActiveSubscription(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId);

  if (!subscription || !subscription.paid) {
    return false;
  }

  const now = new Date();
  return now < subscription.endDate;
}

// --- API Handler ---

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!PAYSTACK_SECRET_KEY) {
    return res.status(500).json({ error: 'Server configuration error: Paystack key not found.' });
  }

  if (req.method === 'POST') {
    const { userId, tier, email, duration } = req.body;

    const prices: Record<string, number> = {
        basic: 10,
        premium: 25,
    };
    
    const priceInUSD = prices[tier];
    const priceInNaira = await calculatePriceInNaira(priceInUSD);
    try {
      const payment = await initializePayment(email, priceInNaira, { tier, duration, userId });
      res.status(200).json({ payment });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
    
  } else if (req.method === 'GET') {
    const { userId, reference } = req.query;

    if (reference) {
        try {
          const paymentDetails = await verifyPayment(reference as string);

          if (paymentDetails.data.status === 'success') {
              const { tier, duration, userId } = paymentDetails.data.metadata;
              await createSubscription(userId as string, tier, duration, true);
              res.redirect(302, '/'); 
          } else {
              res.status(400).json({ status: 'failed', message: 'Payment verification failed.' });
          }
        } catch (error) {
          res.status(500).json({ error: (error as Error).message });
        }
    } else {
        const hasSubscription = await hasActiveSubscription(userId as string);
        res.status(200).json({ hasSubscription });
    }

  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}
