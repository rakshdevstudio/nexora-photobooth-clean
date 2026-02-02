import { AdminUser, AuthResponse } from '../types';

export class AdminAuthService {
    private static readonly TOKEN_KEY = 'nexora_super_admin_token';
    // Use relative path for proxy
    private static readonly API_URL = '';

    static getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    static setToken(token: string) {
        localStorage.setItem(this.TOKEN_KEY, token);
    }

    static logout() {
        localStorage.removeItem(this.TOKEN_KEY);
        window.location.href = '/admin/login';
    }

    static async login(email: string, password: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) return false;
            const data: AuthResponse = await response.json();
            this.setToken(data.access_token);
            return true;
        } catch {
            return false;
        }
    }

    static getAuthHeader(): HeadersInit {
        const token = this.getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    static getUser(): AdminUser | null {
        const token = this.getToken();
        if (!token) return null;
        try {
            // Simple client-side decode, in real app verify signature
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const decoded = JSON.parse(jsonPayload);
            // Map JWT payload to AdminUser
            return {
                id: decoded.sub,
                email: decoded.username, // NestJS JWT strategy maps email to username usually, or we need to check backend
                role: decoded.role
            };
        } catch (e) {
            return null;
        }
    }
}
