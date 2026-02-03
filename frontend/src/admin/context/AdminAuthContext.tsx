import React, { createContext, useContext, useEffect, useState } from 'react';
import { AdminAuthService } from '../services/AdminAuthService';
import { AdminUser } from '../types';

interface AdminAuthContextType {
    user: AdminUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, pass: string) => Promise<boolean>;
    logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType>(null!);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AdminUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUserDetails = async (partialUser: AdminUser) => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'https://nexora-photobooth-clean-production.up.railway.app';
            const res = await fetch(`${API_URL}/admins`, {
                headers: { 'Authorization': `Bearer ${AdminAuthService.getToken()}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Find self in list (for ADMIN it returns only self, for SUPER_ADMIN finds by ID)
                const self = data.find((u: any) => u.id === partialUser.id);
                if (self) {
                    setUser({
                        id: self.id,
                        email: self.email,
                        role: self.role,
                        permissions: self.permissions
                    });
                } else {
                    setUser(partialUser);
                }
            } else {
                setUser(partialUser);
            }
        } catch (e) {
            setUser(partialUser);
        }
    };

    useEffect(() => {
        const initAuth = async () => {
            const loadedUser = AdminAuthService.getUser();
            if (loadedUser) {
                await fetchUserDetails(loadedUser);
            }
            setIsLoading(false);
        };
        initAuth();
    }, []);

    const login = async (email: string, pass: string) => {
        const success = await AdminAuthService.login(email, pass);
        if (success) {
            const basicUser = AdminAuthService.getUser();
            if (basicUser) await fetchUserDetails(basicUser);
        }
        return success;
    };

    const logout = () => {
        AdminAuthService.logout();
        setUser(null);
    };

    return (
        <AdminAuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
            {children}
        </AdminAuthContext.Provider>
    );
}

export const useAdminAuth = () => useContext(AdminAuthContext);
