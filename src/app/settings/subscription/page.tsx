'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Loader2, ShieldCheck, Zap } from 'lucide-react';
import Link from 'next/link';

// Helper to format the plan name
const formatPlanName = (tier: string) => {
    if (!tier) return 'No Plan';
    return tier.charAt(0).toUpperCase() + tier.slice(1);
};

// Helper to determine badge color based on status
const getStatusBadgeVariant = (status: string): 'success' | 'destructive' | 'secondary' => {
    if (status === 'active') return 'success';
    if (status === 'inactive') return 'destructive';
    return 'secondary';
};

const SubscriptionBillingPage = () => {
    const { subscriptionDetails, isAuthLoading } = useAuth();

    // 1. Loading State
    if (isAuthLoading) {
        return (
            <div className="p-8 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                <p className="ml-4 text-gray-600">Loading your subscription details...</p>
            </div>
        );
    }

    // 2. No Subscription Found State
    if (!subscriptionDetails) {
        return (
            <div className="p-4 md:p-8">
                 <h1 className="text-3xl font-bold mb-6">Subscription & Billing</h1>
                <Card className="max-w-2xl mx-auto shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <AlertCircle className="w-6 h-6 text-orange-500" />
                            No Subscription Found
                        </CardTitle>
                        <CardDescription>You do not have an active or expired subscription record.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4">Please choose a plan to get started.</p>
                        <Link href="/subscription">
                            <Button>Choose a Plan</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    // 3. Subscription Details Display
    const { tier, status, startDate, endDate, daysRemaining } = subscriptionDetails;
    const totalDaysInPlan = 30; // Assuming monthly plans
    const progressValue = Math.max(0, (daysRemaining / totalDaysInPlan) * 100);

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-6">Subscription & Billing</h1>
            
            <Card className="max-w-2xl mx-auto shadow-lg bg-white rounded-2xl border">
                <CardHeader className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div>
                        <CardTitle className="text-2xl font-bold text-gray-800">Your Current Plan</CardTitle>
                        <CardDescription>Manage your subscription and billing details below.</CardDescription>
                    </div>
                    <Badge variant={getStatusBadgeVariant(status)} className="capitalize text-base py-1 px-3">
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        {status}
                    </Badge>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="p-6 bg-gray-50 rounded-xl border">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{formatPlanName(tier)} Plan</h3>
                         <p className="text-4xl font-bold text-gray-800">
                            {tier === 'premium' ? '$25' : '$10'}<span className="text-lg font-normal text-gray-500">/month</span>
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-1 text-sm font-medium">
                                <p className="text-gray-600">Time Remaining</p>
                                <p className="text-gray-800">{daysRemaining > 0 ? `${daysRemaining} days left` : 'Expired'}</p>
                            </div>
                            <Progress value={progressValue} className="h-2" />
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>Subscribed on {startDate}</span>
                            <span>{status === 'active' ? `Renews on ${endDate}` : `Expired on ${endDate}`}</span>
                        </div>
                    </div>
                    
                    <div className="border-t pt-6 flex flex-col sm:flex-row gap-4">
                        {tier !== 'premium' && (
                             <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                                <Zap className="w-4 h-4 mr-2" />
                                Upgrade to Premium
                            </Button>
                        )}
                        <Button variant="outline" className="flex-1">
                            Manage Billing
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default SubscriptionBillingPage;
