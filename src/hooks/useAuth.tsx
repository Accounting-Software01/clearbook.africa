'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// 1. Updated User Interface to be compatible with Sidebar and other components
interface User {
    id: string;
    full_name: string; // Use full_name for compatibility
    email: string;
    role: string;
    company_id: string;
    company_type: string;
    permissions?: string[]; // This is the critical field for the Sidebar
}

// Update context to use the new User type
interface AuthContextType {
    user: User | null;
    subscriptionStatus: 'loading' | 'active' | 'inactive';
    isAuthLoading: boolean;
    login: (userData: any) => Promise<void>; // Loosen type for flexibility during login
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 2. Added the function to fetch permissions from your API
const fetchCombinedPermissions = async (userId: string, companyId: string): Promise<string[]> => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/get_user_permissions.php?user_id=${userId}&company_id=${companyId}`);
        if (!response.ok) {
            console.error("Permissions API response was not OK.", response.statusText);
            return [];
        }
        const data = await response.json();
        if (data.success && Array.isArray(data.permissions)) {
            console.log("[fetchCombinedPermissions] Successfully fetched permissions.");
            return data.permissions;
        } else {
            console.warn("[fetchCombinedPermissions] API call did not return a permissions array.", data.message);
            return [];
        }
    } catch (error) {
        console.error("[fetchCombinedPermissions] Failed to fetch permissions:", error);
        return [];
    }
};

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
                setSubscriptionStatus('active');
            } else {
                setSubscriptionStatus('inactive');
            }
        } catch (error) {
            console.error('[fetchSubscriptionStatus] Fetch error:', error);
            setSubscriptionStatus('inactive');
        }
    }, [apiUrl]);

    // 3. Modified to fetch permissions on initial load
    useEffect(() => {
        const initializeAuth = async () => {
            setIsAuthLoading(true);
            const storedUser = localStorage.getItem('user');

            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                // Fetch permissions and subscription status concurrently
                const [permissions] = await Promise.all([
                    fetchCombinedPermissions(parsedUser.id, parsedUser.company_id),
                    fetchSubscriptionStatus(parsedUser.company_id)
                ]);
                // Set the final user state including permissions
                setUser({ ...parsedUser, permissions });
            } else {
                setSubscriptionStatus('inactive');
            }
            setIsAuthLoading(false);
        };
        initializeAuth();
    }, [fetchSubscriptionStatus]);

    // 4. Modified to fetch permissions on login
    const login = async (userData: any) => {
        const formattedUser = {
            id: String(userData.id),
            full_name: userData.full_name || userData.name,
            email: userData.email,
            role: userData.role,
            company_id: userData.company_id,
            company_type: userData.company_type
        };

        localStorage.setItem('user', JSON.stringify(formattedUser));
        setIsAuthLoading(true);

        try {
            const [permissions, subResponse] = await Promise.all([
                fetchCombinedPermissions(formattedUser.id, formattedUser.company_id),
                fetch(`${apiUrl}?company_id=${formattedUser.company_id}`)
            ]);

            setUser({ ...formattedUser, permissions });
            const subData = await subResponse.json();

            if (subData.success && subData.data?.is_active) {
                setSubscriptionStatus('active');
                router.push('/dashboard');
            } else {
                setSubscriptionStatus('inactive');
                router.push('/subscription');
            }
        } catch (error) {
            console.error('[Login] Failed to process login:', error);
            setSubscriptionStatus('inactive');
            router.push('/subscription');
        } finally {
            setIsAuthLoading(false);
        }
    };

    const logout = () => {
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
