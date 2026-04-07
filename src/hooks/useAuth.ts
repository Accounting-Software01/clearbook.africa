'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    name: string;
    email: string;
    company_id: string;
}

interface AuthContextType {
    user: User | null;
    subscriptionStatus: 'loading' | 'active' | 'inactive';
    isAuthLoading: boolean;
    login: (userData: Omit<User, 'id'> & { id: string | number }) => Promise<void>; // Make login async
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [subscriptionStatus, setSubscriptionStatus] = useState<'loading' | 'active' | 'inactive'>('loading');
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const router = useRouter();
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/subscription.php`;

    const fetchSubscriptionStatus = useCallback(async (companyId: string) => {
        console.log(`[fetchSubscriptionStatus] Fetching for company_id: ${companyId}`);
        setSubscriptionStatus('loading');
        try {
            const response = await fetch(`${apiUrl}?company_id=${companyId}`);
            const data = await response.json();
            if (data.success && data.data?.is_active) {
                console.log('[fetchSubscriptionStatus] Status: active');
                setSubscriptionStatus('active');
            } else {
                console.log('[fetchSubscriptionStatus] Status: inactive');
                setSubscriptionStatus('inactive');
            }
        } catch (error) {
            console.error('[fetchSubscriptionStatus] Fetch error:', error);
            setSubscriptionStatus('inactive');
        }
    }, [apiUrl]);

    // Effect for initializing from localStorage on page load/refresh
    useEffect(() => {
        console.log('[AuthProvider] Initializing from localStorage...');
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            fetchSubscriptionStatus(parsedUser.company_id);
        } else {
            setSubscriptionStatus('inactive'); // No user, so no active subscription
        }
        setIsAuthLoading(false);
    }, [fetchSubscriptionStatus]);

    const login = async (userData: Omit<User, 'id'> & { id: string | number }) => {
        const formattedUser = { ...userData, id: String(userData.id) };
        setUser(formattedUser);
        localStorage.setItem('user', JSON.stringify(formattedUser));

        // --- START OF THE CORE FIX ---
        // Fetch status directly instead of relying on a separate useEffect
        console.log('[Login] User logged in. Fetching subscription status before redirecting...');
        setSubscriptionStatus('loading');
        try {
            const response = await fetch(`${apiUrl}?company_id=${formattedUser.company_id}`);
            const data = await response.json();

            if (data.success && data.data?.is_active) {
                console.log('[Login] Subscription is active. Redirecting to /dashboard.');
                setSubscriptionStatus('active');
                router.push('/dashboard');
            } else {
                console.log('[Login] Subscription is inactive. Redirecting to /subscription.');
                setSubscriptionStatus('inactive');
                router.push('/subscription');
            }
        } catch (error) {
            console.error('[Login] Failed to fetch subscription status during login:', error);
            setSubscriptionStatus('inactive');
            router.push('/subscription'); // On error, send to subscription page
        }
        // --- END OF THE CORE FIX ---
    };

    const logout = () => {
        console.log('[Logout] Clearing user and session.');
        localStorage.removeItem('user');
        setUser(null);
        setSubscriptionStatus('inactive');
        router.push('/login');
    };

    const value = { user, subscriptionStatus, isAuthLoading, login, logout };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
