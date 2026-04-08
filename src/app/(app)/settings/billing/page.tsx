'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import { useToast } from "@/hooks/use-toast";

interface Subscription {
    id: string;
    company_id: string;
    tier: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
    paid: number;
    paystack_reference: string;
    created_at: string;
    updated_at: string;
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const SpinnerIcon = () => (
    <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#28a74530" strokeWidth="3" />
        <path d="M12 2a10 10 0 0 1 10 10" stroke="#28a745" strokeWidth="3" strokeLinecap="round" />
    </svg>
);

const AlertIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e05030" strokeWidth="1.6">
        <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
    </svg>
);

const EmptyIcon = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9aab9c" strokeWidth="1.4">
        <rect x="3" y="4" width="14" height="17" rx="2" strokeLinecap="round" />
        <path d="M7 9h6M7 13h4" strokeLinecap="round" />
        <path d="M17 14l2.5 2.5M19.5 14L17 16.5" strokeLinecap="round" />
    </svg>
);

const ReceiptIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 2l1.5 1.5L7 2l1.5 1.5L10 2l1.5 1.5L13 2l1.5 1.5L16 2v18l-1.5-1.5L13 20l-1.5 1.5L10 20l-1.5 1.5L7 20l-1.5 1.5L4 20V2z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 9h8M8 13h5" strokeLinecap="round" />
    </svg>
);

const ArrowLeftIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 12H5M5 12l7 7M5 12l7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const HistoryIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#28a745" strokeWidth="1.6">
        <circle cx="12" cy="12" r="9" strokeLinecap="round" />
        <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// ── Status Badge ──────────────────────────────────────────────────────────────

const StatusBadge = ({ isActive }: { isActive: boolean }) => (
    <span
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
        style={
            isActive
                ? { background: '#edf7f0', color: '#1e7a38', border: '1px solid #b8dfc5' }
                : { background: '#fff3f0', color: '#e05030', border: '1px solid #f5c9bc' }
        }
    >
        <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: isActive ? '#28a745' : '#e05030' }}
        />
        {isActive ? 'Active' : 'Expired'}
    </span>
);

// ── Tier Badge ────────────────────────────────────────────────────────────────

const TierBadge = ({ tier }: { tier: string }) => (
    <span
        className="inline-block text-xs font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md capitalize"
        style={{ background: '#edf7f0', color: '#1e7a38' }}
    >
        {tier}
    </span>
);

// ── Page ──────────────────────────────────────────────────────────────────────

const BillingHistoryPage = () => {
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast();

    const [history, setHistory] = useState<Subscription[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.company_id) {
            setIsLoading(false);
            setError('Could not find a company ID for your user.');
            return;
        }

        const fetchHistory = async () => {
            setIsLoading(true);
            try {
                const result = await api<{
                    success: boolean;
                    data: Subscription | Subscription[];
                    message?: string;
                }>(`billing-history.php?company_id=${user.company_id}`);

                if (result.success) {
                    const historyData = Array.isArray(result.data) ? result.data : [result.data];
                    setHistory(historyData);
                } else {
                    setError(result.message || 'Failed to load billing history.');
                }
            } catch (err: any) {
                setError('An error occurred while fetching billing history.');
                toast({
                    title: 'Error Loading History',
                    description: err.message,
                    variant: 'destructive',
                });
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, [user?.company_id, toast]);

    return (
        <div className="p-6 max-w-4xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <HistoryIcon />
                        <h1 className="text-xl font-bold" style={{ color: '#1a1a1a' }}>
                            Billing History
                        </h1>
                    </div>
                    <p className="text-sm" style={{ color: '#6c757d' }}>
                        All your past subscription payments and invoices.
                    </p>
                </div>

                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    style={{
                        background: '#f4f6f4',
                        color: '#1a1a1a',
                        border: '1px solid #dde5de',
                    }}
                >
                    <ArrowLeftIcon />
                    Back
                </button>
            </div>

            {/* Card */}
            <div
                className="rounded-2xl overflow-hidden"
                style={{
                    background: '#ffffff',
                    border: '1px solid #dde5de',
                    boxShadow: '0 2px 16px #0000000a',
                }}
            >
                {/* Card top bar */}
                <div style={{ height: 3, background: '#28a745' }} />

                {/* ── Loading ── */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <SpinnerIcon />
                        <p className="text-sm" style={{ color: '#6c757d' }}>
                            Loading your billing history…
                        </p>
                    </div>
                )}

                {/* ── Error ── */}
                {!isLoading && error && (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-6">
                        <AlertIcon />
                        <p className="text-sm font-semibold" style={{ color: '#e05030' }}>
                            Something went wrong
                        </p>
                        <p className="text-sm max-w-xs" style={{ color: '#6c757d' }}>
                            {error}
                        </p>
                        <button
                            onClick={() => router.refresh()}
                            className="mt-2 px-5 py-2 rounded-lg text-sm font-semibold text-white"
                            style={{ background: '#28a745' }}
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* ── Empty ── */}
                {!isLoading && !error && history.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                        <EmptyIcon />
                        <p className="text-sm font-semibold" style={{ color: '#1a1a1a' }}>
                            No billing history yet
                        </p>
                        <p className="text-sm" style={{ color: '#6c757d' }}>
                            Your subscription payments will appear here once made.
                        </p>
                    </div>
                )}

                {/* ── Table ── */}
                {!isLoading && !error && history.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8faf8', borderBottom: '1px solid #dde5de' }}>
                                    {['Date', 'Period', 'Plan', 'Status', 'Reference', ''].map((h) => (
                                        <th
                                            key={h}
                                            className="text-left px-5 py-3 text-xs font-semibold tracking-wider uppercase"
                                            style={{ color: '#6c757d' }}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((item, idx) => (
                                    <tr
                                        key={item.id}
                                        style={{
                                            borderBottom: idx < history.length - 1 ? '1px solid #f0f4f0' : 'none',
                                            transition: 'background 0.15s',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = '#f8faf8')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        <td className="px-5 py-4 text-sm" style={{ color: '#1a1a1a' }}>
                                            {format(new Date(item.start_date), 'PPP')}
                                        </td>
                                        <td className="px-5 py-4 text-sm" style={{ color: '#6c757d' }}>
                                            {format(new Date(item.start_date), 'MMM d')}
                                            {' — '}
                                            {format(new Date(item.end_date), 'MMM d, yyyy')}
                                        </td>
                                        <td className="px-5 py-4">
                                            <TierBadge tier={item.tier} />
                                        </td>
                                        <td className="px-5 py-4">
                                            <StatusBadge isActive={item.is_active} />
                                        </td>
                                        <td className="px-5 py-4">
                                            <span
                                                className="text-xs font-mono px-2 py-1 rounded"
                                                style={{ background: '#f4f6f4', color: '#6c757d' }}
                                            >
                                                {item.paystack_reference.slice(0, 14)}…
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <Link href={`/settings/billing/invoice/${item.paystack_reference}`}>
                                                <button
                                                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all"
                                                    style={{
                                                        background: '#f0f9f2',
                                                        color: '#1e7a38',
                                                        border: '1px solid #b8dfc5',
                                                    }}
                                                >
                                                    <ReceiptIcon />
                                                    View Invoice
                                                </button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Summary footer */}
                {!isLoading && !error && history.length > 0 && (
                    <div
                        className="flex items-center justify-between px-5 py-3"
                        style={{ borderTop: '1px solid #f0f4f0', background: '#f8faf8' }}
                    >
                        <p className="text-xs" style={{ color: '#9aab9c' }}>
                            {history.length} payment{history.length !== 1 ? 's' : ''} total
                        </p>
                        <p className="text-xs" style={{ color: '#9aab9c' }}>
                            Secured by Paystack
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BillingHistoryPage;