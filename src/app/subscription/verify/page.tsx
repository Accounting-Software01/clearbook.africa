'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const VerifySubscriptionPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [verificationStatus, setVerificationStatus] = useState('verifying');

    useEffect(() => {
        const reference = searchParams.get('reference');

        if (!reference) {
            setVerificationStatus('error');
            return;
        }

        // The URL to your PHP backend
        const verifyUrl = 'https://your-domain.com/subscription.php'; // <-- IMPORTANT: Replace with your actual domain

        fetch(verifyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                action: 'verify', 
                reference: reference 
            }),
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                setVerificationStatus('success');
                // Redirect to a protected page after a short delay
                setTimeout(() => router.push('/dashboard'), 3000);
            } else {
                setVerificationStatus('error');
                console.error('Verification failed:', data.error);
            }
        })
        .catch(err => {
            setVerificationStatus('error');
            console.error('An error occurred during verification:', err);
        });

    }, [searchParams, router]);

    const renderStatus = () => {
        switch (verificationStatus) {
            case 'verifying':
                return <p>Verifying your payment, please wait...</p>;
            case 'success':
                return (
                    <div>
                        <h1 className="text-2xl font-bold text-green-600">Payment Successful!</h1>
                        <p>Your subscription is now active. Redirecting you to the dashboard...</p>
                    </div>
                );
            case 'error':
            default:
                return (
                    <div>
                        <h1 className="text-2xl font-bold text-red-600">Payment Verification Failed</h1>
                        <p>There was an issue with your payment. Please contact support.</p>
                        <button onClick={() => router.push('/subscription')} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">Try Again</button>
                    </div>
                );
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
                {renderStatus()}
            </div>
        </div>
    );
};

export default VerifySubscriptionPage;
