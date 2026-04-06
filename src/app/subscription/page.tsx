
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const SubscriptionPage = () => {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [hasSubscription, setHasSubscription] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = 'https://your-domain.com/subscription.php';

  useEffect(() => {
    if (isAuthLoading) {
        setLoading(true);
        return;
    }

    if (!user || !user.company_id) {
        setError("Please log in to manage your company's subscription.");
        setLoading(false);
        return;
    }

    fetch(`${apiUrl}?company_id=${user.company_id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.is_active) {
          setHasSubscription(true);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching subscription status:", err);
        setError("Could not load subscription status.");
        setLoading(false);
      });
  }, [user, isAuthLoading, apiUrl]);

  const handleSubscribe = async (tier: string) => {
    if (!user || !user.company_id) {
        setError("You must be logged in to subscribe.");
        return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'initialize',
          company_id: user.company_id, 
          email: user.email,
          tier: tier
        }),
      });

      const data = await res.json();

      if (data.status) {
        window.location.href = data.data.authorization_url;
      } else {
        setError(data.message || "Could not initiate payment.");
        setLoading(false);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Error initializing payment:", err);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (hasSubscription) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold">Welcome Back!</h1>
        <p className="mt-2">Your company has an active subscription.</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl text-center w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Unlock Full Access for Your Company</h1>
        <p className="text-gray-600 mb-6">Choose a plan to continue and enjoy all the features.</p>
        
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

        <div className="space-y-4">
          <div className="border p-6 rounded-lg text-left">
            <h2 className="text-xl font-semibold">Basic Plan</h2>
            <p className="text-3xl font-bold my-2">$10<span className="text-base font-normal">/month</span></p>
            <button 
              onClick={() => handleSubscribe('basic')} 
              disabled={loading || !user}
              className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Processing...' : 'Choose Basic'}
            </button>
          </div>
          <div className="border p-6 rounded-lg text-left">
            <h2 className="text-xl font-semibold">Premium Plan</h2>
            <p className="text-3xl font-bold my-2">$25<span className="text-base font-normal">/month</span></p>
            <button 
              onClick={() => handleSubscribe('premium')} 
              disabled={loading || !user}
              className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? 'Processing...' : 'Choose Premium'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
