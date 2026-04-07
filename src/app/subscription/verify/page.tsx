'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const SpinnerIcon = () => (
    <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2.5C17.2467 2.5 21.5 6.75329 21.5 12C21.5 17.2467 17.2467 21.5 12 21.5C6.75329 21.5 2.5 17.2467 2.5 12C2.5 9.17737 3.82483 6.69317 5.90421 5" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    </svg>
);

const VerificationPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState('verifying');
    const [error, setError] = useState('');

    useEffect(() => {
        const reference = searchParams.get('reference');
        if (!reference) {
            setStatus('failed');
            setError('No payment reference found. Your payment may not have been processed correctly.');
            return;
        }

        const verifyPayment = async () => {
            try {
                const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/subscription.php`;

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'verify', reference }),
                });

                const result = await response.json();

                if (result.success) {
                    setStatus('success');
                    // Use window.location.href to force a full page reload
                    // This clears stale frontend state and ensures the new subscription status is fetched.
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 3000);
                } else {
                    setStatus('failed');
                    setError(result.error || 'An unknown error occurred during payment verification.');
                }
            } catch (err) {
                setStatus('failed');
                setError('A network error occurred. Please contact support if your payment was debited.');
            }
        };

        verifyPayment();
    }, [searchParams, router]);

    const StatusDisplay = () => {
        switch (status) {
            case 'verifying':
                return (
                    <>
                        <SpinnerIcon />
                        <h1 className="text-2xl font-bold mt-4">Verifying Your Payment...</h1>
                        <p className="text-gray-500">Please wait, do not close this page.</p>
                    </>
                );
            case 'success':
                return (
                    <>
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-3xl mb-4">✓</div>
                        <h1 className="text-2xl font-bold">Payment Confirmed!</h1>
                        <p className="text-gray-500">Your subscription is now active. Redirecting you to the dashboard...</p>
                    </>
                );
            case 'failed':
                return (
                    <>
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-3xl mb-4">✗</div>
                        <h1 className="text-2xl font-bold">Verification Failed</h1>
                        <p className="text-gray-500 max-w-md">{error}</p>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-50 text-center p-6">
            <StatusDisplay />
        </div>
    );
};

export default VerificationPage;
