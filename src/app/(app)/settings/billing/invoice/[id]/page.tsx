'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { format, parseISO } from 'date-fns';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';

interface InvoiceDetails {
    id: string;
    company_id: string;
    tier: string;
    start_date: string;
    end_date: string;
    paid: number;
    paystack_reference: string;
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const SpinnerIcon = () => (
    <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#28a74530" strokeWidth="3" />
        <path d="M12 2a10 10 0 0 1 10 10" stroke="#28a745" strokeWidth="3" strokeLinecap="round" />
    </svg>
);

const AlertIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e05030" strokeWidth="1.6">
        <circle cx="12" cy="12" r="10" strokeLinecap="round" />
        <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
    </svg>
);

const PrintIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 9V2h12v7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="6" y="14" width="12" height="8" rx="1" strokeLinecap="round" />
    </svg>
);

const ArrowLeftIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 12H5M5 12l7 7M5 12l7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const CheckCircleIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#28a745" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// ── Page ──────────────────────────────────────────────────────────────────────

const InvoicePage = () => {
    const [details, setDetails] = useState<InvoiceDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const id = params.id as string;

    useEffect(() => {
        if (!id) {
            setError('No invoice ID provided.');
            setIsLoading(false);
            return;
        }

        const fetchInvoiceDetails = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const result = await api<{ success: boolean; data: InvoiceDetails; message?: string }>(
                    `billing-details.php?id=${id}`
                );
                if (result.success && result.data) {
                    setDetails(result.data);
                } else {
                    setError(result.message || 'Could not find invoice details.');
                }
            } catch (err: any) {
                console.error('Failed to fetch invoice details:', err);
                setError(err.message);
                toast({ title: 'Error loading invoice', description: err.message, variant: 'destructive' });
            } finally {
                setIsLoading(false);
            }
        };

        fetchInvoiceDetails();
    }, [id, toast]);

    // ── Loading ───────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-24">
                <SpinnerIcon />
                <p className="text-sm" style={{ color: '#6c757d' }}>Loading invoice…</p>
            </div>
        );
    }

    // ── Error ─────────────────────────────────────────────────────────────────
    if (error) {
        return (
            <div className="max-w-2xl mx-auto p-6">
                <div
                    className="rounded-2xl overflow-hidden"
                    style={{ background: '#fff', border: '1px solid #dde5de', boxShadow: '0 2px 16px #0000000a' }}
                >
                    <div style={{ height: 3, background: '#e05030' }} />
                    <div className="flex flex-col items-center text-center py-16 px-8 gap-3">
                        <AlertIcon />
                        <p className="font-semibold text-base" style={{ color: '#1a1a1a' }}>Invoice Not Found</p>
                        <p className="text-sm max-w-xs" style={{ color: '#6c757d', lineHeight: 1.6 }}>{error}</p>
                        <button
                            onClick={() => router.back()}
                            className="mt-3 flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold"
                            style={{ background: '#f4f6f4', color: '#1a1a1a', border: '1px solid #dde5de' }}
                        >
                            <ArrowLeftIcon /> Back to Billing History
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── No Details ────────────────────────────────────────────────────────────
    if (!details) {
        return (
            <div className="max-w-2xl mx-auto p-6">
                <div
                    className="rounded-2xl overflow-hidden"
                    style={{ background: '#fff', border: '1px solid #dde5de' }}
                >
                    <div style={{ height: 3, background: '#28a745' }} />
                    <div className="flex flex-col items-center text-center py-16 px-8 gap-3">
                        <p className="font-semibold" style={{ color: '#1a1a1a' }}>No Invoice Found</p>
                        <p className="text-sm" style={{ color: '#6c757d' }}>There are no invoice details to display.</p>
                        <button
                            onClick={() => router.back()}
                            className="mt-3 flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold"
                            style={{ background: '#f4f6f4', color: '#1a1a1a', border: '1px solid #dde5de' }}
                        >
                            <ArrowLeftIcon /> Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const { tier, start_date, end_date, paystack_reference, paid } = details;
    const invoiceNumber = `INV-${paystack_reference.slice(-8).toUpperCase()}`;
    const issueDate = format(parseISO(start_date), 'PPP');
    const dueDate = format(parseISO(end_date), 'PPP');
    const subtotal = paid;
    const vat = 0;
    const total = paid;

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">

            {/* Action bar — hidden on print */}
            <div
                className="flex items-center justify-between mb-6 print:hidden"
            >
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
                    style={{ background: '#f4f6f4', color: '#1a1a1a', border: '1px solid #dde5de' }}
                >
                    <ArrowLeftIcon /> Back to Billing History
                </button>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-lg text-white transition-colors"
                    style={{ background: '#28a745' }}
                >
                    <PrintIcon /> Print Invoice
                </button>
            </div>

            {/* ── Invoice document ─────────────────────────────────────────── */}
            <div
                id="invoice-doc"
                className="rounded-2xl overflow-hidden print:rounded-none print:shadow-none"
                style={{
                    background: '#ffffff',
                    border: '1px solid #dde5de',
                    boxShadow: '0 4px 24px #0000000d',
                }}
            >
                {/* Green top bar */}
                <div style={{ height: 4, background: '#28a745' }} className="print:block" />

                <div className="p-8 md:p-12">

                    {/* ── Header row ── */}
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-10">

                        {/* Logo + company info */}
                        <div className="flex items-center gap-3">
                            <Image
                                src="/logo.png"
                                alt="ClearBooks Logo"
                                width={48}
                                height={48}
                                className="rounded-xl"
                                style={{ objectFit: 'contain' }}
                            />
                            <div>
                                <div className="text-xl font-black" style={{ color: '#1a1a1a' }}>ClearBooks</div>
                                <div className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#28a745' }}>
                                    Accounting Pro
                                </div>
                                <div className="text-xs mt-0.5" style={{ color: '#6c757d' }}>
                                    my.clearbook.africa
                                </div>
                            </div>
                        </div>

                        {/* Invoice label + number */}
                        <div className="text-left md:text-right">
                            <div
                                className="text-3xl font-black tracking-tight mb-1"
                                style={{ color: '#28a745' }}
                            >
                                INVOICE
                            </div>
                            <div className="text-sm font-mono font-semibold" style={{ color: '#1a1a1a' }}>
                                {invoiceNumber}
                            </div>
                            <div className="text-xs mt-1" style={{ color: '#6c757d' }}>
                                Ref: {paystack_reference}
                            </div>
                        </div>
                    </div>

                    {/* ── Meta row: dates + status ── */}
                    <div
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 rounded-xl p-5"
                        style={{ background: '#f8faf8', border: '1px solid #e8eee8' }}
                    >
                        {[
                            { label: 'Issue Date', value: issueDate },
                            { label: 'Period End', value: dueDate },
                            { label: 'Status', value: 'Paid', isStatus: true },
                            { label: 'Method', value: 'Paystack' },
                        ].map((m) => (
                            <div key={m.label}>
                                <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#9aab9c' }}>
                                    {m.label}
                                </div>
                                {m.isStatus ? (
                                    <div className="flex items-center gap-1.5">
                                        <CheckCircleIcon />
                                        <span className="text-sm font-bold" style={{ color: '#28a745' }}>Paid</span>
                                    </div>
                                ) : (
                                    <div className="text-sm font-semibold" style={{ color: '#1a1a1a' }}>{m.value}</div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* ── Billed To / From ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                        <div
                            className="rounded-xl p-5"
                            style={{ background: '#f8faf8', border: '1px solid #e8eee8' }}
                        >
                            <div
                                className="text-xs font-bold uppercase tracking-widest mb-3"
                                style={{ color: '#28a745' }}
                            >
                                Billed To
                            </div>
                            <div className="font-bold text-sm" style={{ color: '#1a1a1a' }}>{user?.name || '—'}</div>
                            <div className="text-sm" style={{ color: '#6c757d' }}>{user?.email || '—'}</div>
                            <div className="text-xs mt-1" style={{ color: '#9aab9c' }}>
                                Company ID: {details.company_id}
                            </div>
                        </div>

                        <div
                            className="rounded-xl p-5"
                            style={{ background: '#f8faf8', border: '1px solid #e8eee8' }}
                        >
                            <div
                                className="text-xs font-bold uppercase tracking-widest mb-3"
                                style={{ color: '#28a745' }}
                            >
                                Billed From
                            </div>
                            <div className="font-bold text-sm" style={{ color: '#1a1a1a' }}>ClearBooks Africa</div>
                            <div className="text-sm" style={{ color: '#6c757d' }}>support@clearbook.africa</div>
                            <div className="text-sm" style={{ color: '#6c757d' }}>my.clearbook.africa</div>
                        </div>
                    </div>

                    {/* ── Line items table ── */}
                    <div
                        className="rounded-xl overflow-hidden mb-8"
                        style={{ border: '1px solid #dde5de' }}
                    >
                        <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#28a745' }}>
                                    {['Description', 'Period', 'Qty', 'Unit Price', 'Amount'].map((h) => (
                                        <th
                                            key={h}
                                            className="text-left px-5 py-3 text-xs font-semibold text-white"
                                            style={h === 'Qty' || h === 'Unit Price' || h === 'Amount' ? { textAlign: 'right' } : {}}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={{ borderBottom: '1px solid #f0f4f0' }}>
                                    <td className="px-5 py-4">
                                        <div className="text-sm font-semibold" style={{ color: '#1a1a1a' }}>
                                            ClearBooks {tier.charAt(0).toUpperCase() + tier.slice(1)} Plan
                                        </div>
                                        <div className="text-xs mt-0.5" style={{ color: '#6c757d' }}>
                                            Subscription — Accounting Pro
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-right" style={{ color: '#6c757d' }}>
                                        {format(parseISO(start_date), 'MMM d')} – {format(parseISO(end_date), 'MMM d, yyyy')}
                                    </td>
                                    <td className="px-5 py-4 text-sm text-right" style={{ color: '#1a1a1a' }}>1</td>
                                    <td className="px-5 py-4 text-sm text-right" style={{ color: '#1a1a1a' }}>${subtotal.toFixed(2)}</td>
                                    <td className="px-5 py-4 text-sm font-semibold text-right" style={{ color: '#1a1a1a' }}>
                                        ${subtotal.toFixed(2)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* ── Totals ── */}
                    <div className="flex justify-end mb-10">
                        <div className="w-full max-w-xs">
                            <div className="flex justify-between text-sm py-2" style={{ borderBottom: '1px solid #f0f4f0' }}>
                                <span style={{ color: '#6c757d' }}>Subtotal</span>
                                <span style={{ color: '#1a1a1a' }}>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm py-2" style={{ borderBottom: '1px solid #f0f4f0' }}>
                                <span style={{ color: '#6c757d' }}>VAT (0%)</span>
                                <span style={{ color: '#1a1a1a' }}>${vat.toFixed(2)}</span>
                            </div>
                            <div
                                className="flex justify-between text-base font-black py-3 px-4 rounded-xl mt-2"
                                style={{ background: '#edf7f0', color: '#1a1a1a' }}
                            >
                                <span>Total Paid</span>
                                <span style={{ color: '#28a745' }}>${total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Footer note ── */}
                    <div
                        className="rounded-xl px-5 py-4 text-xs text-center"
                        style={{ background: '#f8faf8', border: '1px solid #e8eee8', color: '#9aab9c', lineHeight: 1.7 }}
                    >
                        Thank you for using ClearBooks Africa. This invoice was generated automatically.
                        For any billing questions, contact{' '}
                        <span style={{ color: '#28a745' }}>support@clearbook.africa</span>.
                        <br />
                        Payment processed securely by <strong style={{ color: '#1a1a1a' }}>Paystack</strong>.
                    </div>
                </div>
            </div>

            {/* Print styles */}
            <style jsx global>{`
                @media print {
                    body * { visibility: hidden; }
                    #invoice-doc, #invoice-doc * { visibility: visible; }
                    #invoice-doc { position: absolute; top: 0; left: 0; width: 100%; }
                    .print\\:hidden { display: none !important; }
                }
            `}</style>
        </div>
    );
};

export default InvoicePage;