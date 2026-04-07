'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface Tier {
  name: string;
  price: number;
  description: string;
  features: string[];
  popular?: boolean;
}

const tiers: Tier[] = [
  {
    name: 'basic',
    price: 10,
    description: 'Perfect for getting started',
    features: [
      'Basic features',
      'Up to 5 users',
      'Email support',
      'Community access',
    ],
  },
  {
    name: 'premium',
    price: 25,
    description: 'Best for growing teams',
    features: [
      'Everything in Basic',
      'Unlimited users',
      'Priority support',
      'Advanced analytics',
      'Custom integrations',
    ],
    popular: true,
  },
];

const TierCard = ({ 
  tier, 
  onSubscribe, 
  isProcessing 
}: { 
  tier: Tier; 
  onSubscribe: (tierName: string) => void; 
  isProcessing: boolean;
}) => {
  const isPopular = tier.popular;

  return (
    <div className={`relative border rounded-2xl p-8 shadow-lg bg-white transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 w-full max-w-sm ${isPopular ? 'border-blue-600 ring-2 ring-blue-600/30' : 'border-gray-200'}`}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-sm font-semibold px-6 py-1 rounded-full shadow">
          Most Popular
        </div>
      )}

      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold capitalize tracking-tight mb-2">{tier.name}</h2>
        <p className="text-gray-600 text-sm">{tier.description}</p>
      </div>

      <div className="text-center mb-10">
        <p className="text-6xl font-extrabold tracking-tighter text-gray-900">
          ${tier.price}
          <span className="text-2xl font-normal text-gray-500">/mo</span>
        </p>
      </div>

      <ul className="space-y-4 mb-10 text-gray-700">
        {tier.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSubscribe(tier.name)}
        disabled={isProcessing}
        className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 
          ${isPopular 
            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
            : 'bg-gray-900 hover:bg-black text-white'
          } 
          disabled:opacity-60 disabled:cursor-not-allowed active:scale-95`}
        aria-label={`Subscribe to ${tier.name} plan for $${tier.price} per month`}
      >
        {isProcessing ? 'Processing...' : `Choose ${tier.name.charAt(0).toUpperCase() + tier.name.slice(1)}`}
      </button>
    </div>
  );
};

const SubscriptionPage = () => {
  const { user, subscriptionStatus } = useAuth();
  const router = useRouter();
  
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/subscription.php`;

  const handleSubscribe = async (tier: string) => {
    if (!user?.company_id || !user?.email) {
      setErrorMessage("Your user information is incomplete. Please log out and log back in.");
      return;
    }

    setIsProcessingPayment(true);
    setErrorMessage('');

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'initialize', 
          email: user.email, 
          company_id: user.company_id, 
          tier 
        }),
      });

      const result = await response.json();

      if (result.status && result.data?.authorization_url) {
        // Redirect to payment gateway
        window.location.href = result.data.authorization_url;
      } else {
        setErrorMessage(result.message || 'Failed to initialize payment. Please try again.');
      }
    } catch (err) {
      console.error("Payment initialization error:", err);
      setErrorMessage("Network error occurred. Please check your connection and try again.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Loading state
  if (subscriptionStatus === 'loading') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your subscription details...</p>
        </div>
      </div>
    );
  }

  // Active subscription state
  if (subscriptionStatus === 'active') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white text-center px-6">
        <div className="mb-6 text-green-500 text-6xl">✓</div>
        <h1 className="text-4xl font-bold mb-4">You Already Have an Active Subscription</h1>
        <p className="text-gray-600 mb-8 max-w-md">Thank you for being a valued member. You can manage your plan or return to the dashboard.</p>
        
        <button 
          onClick={() => router.push('/dashboard')}
          className="bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-xl font-medium transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  // Main subscription expired / choose plan UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-4">
            Your Subscription Has Expired
          </h1>
          <p className="text-xl text-gray-600 max-w-md mx-auto">
            Choose a plan below to regain full access and continue enjoying premium features.
          </p>
        </div>

        {isProcessingPayment && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-10 text-center max-w-sm">
              <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-6"></div>
              <p className="text-lg font-medium">Processing payment...</p>
              <p className="text-sm text-gray-500 mt-2">You will be redirected to the secure payment page.</p>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 justify-center items-stretch">
          {tiers.map((tier) => (
            <TierCard 
              key={tier.name}
              tier={tier}
              onSubscribe={handleSubscribe}
              isProcessing={isProcessingPayment}
            />
          ))}
        </div>

        {errorMessage && (
          <div className="mt-8 max-w-md mx-auto bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl text-center">
            {errorMessage}
          </div>
        )}

        <p className="text-center text-xs text-gray-500 mt-10">
          Secure payment powered by your gateway • Cancel anytime • No hidden fees
        </p>
      </div>
    </div>
  );
};

export default SubscriptionPage;