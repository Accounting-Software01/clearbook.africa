'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Interface to define the user object. 'id' is the standard property.
interface User {
    id: string;
    full_name: string;
    email: string;
    role: string;
    company_id: string;
    company_type: string;
    permissions?: string[];
}

// Interface for the context value.
interface AuthContextType {
    user: User | null;
    subscriptionStatus: 'loading' | 'active' | 'inactive';
    isAuthLoading: boolean;
    login: (userData: any) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Fetches user permissions from the API.
const fetchCombinedPermissions = async (userId: string, companyId: string): Promise<string[]> => {
    try {
        const response = await fetch(`https://hariindustries.net/api/clearbook/get_user_permissions.php?user_id=${userId}&company_id=${companyId}`);
        if (!response.ok) {
            console.error("Permissions API response was not OK.");
            return [];
        }
        const data = await response.json();
        return data.success && Array.isArray(data.permissions) ? data.permissions : [];
    } catch (error) {
        console.error("Failed to fetch permissions:", error);
        return [];
    }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [subscriptionStatus, setSubscriptionStatus] = useState<'loading' | 'active' | 'inactive'>('loading');
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const router = useRouter();
    const apiUrl = `https://hariindustries.net/api/clearbook/subscription.php`;

    const fetchSubscriptionStatus = useCallback(async (companyId: string) => {
        setSubscriptionStatus('loading');
        try {
            const response = await fetch(`${apiUrl}?company_id=${companyId}`);
            const data = await response.json();
            setSubscriptionStatus(data.success && data.data?.is_active ? 'active' : 'inactive');
        } catch (error) {
            console.error('[fetchSubscriptionStatus] Fetch error:', error);
            setSubscriptionStatus('inactive');
        }
    }, [apiUrl]);

    // Handles initial authentication check on app load.
    useEffect(() => {
        const initializeAuth = async () => {
            setIsAuthLoading(true);
            const storedUser = localStorage.getItem('user');

            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                const userId = parsedUser.id || parsedUser.uid; // *** KEY FIX: Handles 'uid' from localStorage ***

                if (userId) {
                    const [permissions] = await Promise.all([
                        fetchCombinedPermissions(userId, parsedUser.company_id),
                        fetchSubscriptionStatus(parsedUser.company_id)
                    ]);
                    setUser({ ...parsedUser, id: userId, permissions }); // Standardize to use 'id'
                } else {
                    setSubscriptionStatus('inactive');
                }
            } else {
                setSubscriptionStatus('inactive');
            }
            setIsAuthLoading(false);
        };
        initializeAuth();
    }, [fetchSubscriptionStatus]);

    // Handles the login process.
    const login = async (userData: any) => {
        // *** KEY FIX: Standardizes user object from auth library to use 'id' internally ***
        const formattedUser = {
            id: String(userData.id || userData.uid),
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
                // Decide where to redirect based on role
                if (formattedUser.role === 'admin') {
                    router.push('/subscription');
                } else {
                    router.push('/subscription/contact-admin');
                }
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

// Custom hook to use the auth context.
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};