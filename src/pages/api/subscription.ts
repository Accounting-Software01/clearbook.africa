
import { NextApiRequest, NextApiResponse } from 'next';
import { SubscriptionTier } from '@/lib/subscription';

// Replace with your actual database client
// import { db } from './db'; 

// Replace with your Paystack secret key
const PAYSTACK_SECRET_KEY = 'YOUR_PAYSTACK_SECRET_KEY';
const CBN_API_URL = 'https://www.cbn.gov.ng/rates/output.asp?_=1720617835111&rate=usd'; //This is a placeholder, a more reliable API should be used


// --- Exchange Rate ---

async function fetchExchangeRate(): Promise<number> {
  try {
    // This is a placeholder. In a real application, you would use a reliable API to get the exchange rate.
    // The CBN website is not a stable API.
    const response = await fetch(CBN_API_URL);
    const data = await response.json(); //This is a placeholder, the actual response might be different.
    const rate = data.rates.USD; //This is a placeholder
    return rate;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    // Return a default rate or handle the error appropriately
    return 500; // Default to a safe estimate
  }
}


async function calculatePriceInNaira(priceInUSD: number): Promise<number> {
  const exchangeRate = await fetchExchangeRate();
  return priceInUSD * exchangeRate;
}


// --- Paystack Integration ---

async function initializePayment(email: string, amount: number, metadata: any) {
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
    // In a real application, you would fetch this from your database
    // For example: return await db.subscription.findUnique({ where: { userId } });
    console.log("Fetching subscription for user:", userId)
    return null; // Placeholder
}

async function createSubscription(userId: string, tier: SubscriptionTier, durationInDays: number, paid: boolean) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + durationInDays);

    // In a real application, you would save this to your database
    // For example: return await db.subscription.create({ data: { userId, tier, startDate, endDate, paid } });

    const subscription = {
        id: new Date().toISOString(), // Replace with a proper ID generation
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
  if (req.method === 'POST') {
    const { userId, tier, email, duration } = req.body;

    const prices: Record<string, number> = {
        basic: 10,
        premium: 25,
    };
    
    const priceInUSD = prices[tier];
    const priceInNaira = await calculatePriceInNaira(priceInUSD);
    const payment = await initializePayment(email, priceInNaira, { tier, duration, userId });

    res.status(200).json({ payment });
    
  } else if (req.method === 'GET') {
    const { userId, reference } = req.query;

    if (reference) {
        const paymentDetails = await verifyPayment(reference as string);

        if (paymentDetails.data.status === 'success') {
            const { tier, duration, userId } = paymentDetails.data.metadata;
            await createSubscription(userId as string, tier, duration, true);
            res.redirect('/'); // Redirect to home page after successful subscription
        } else {
            res.status(400).json({ status: 'failed' });
        }
    } else {
        const hasSubscription = await hasActiveSubscription(userId as string);
        res.status(200).json({ hasSubscription });
    }



  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
