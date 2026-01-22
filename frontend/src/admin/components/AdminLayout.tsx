import React from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Button } from '@/components/ui/button';

export default function AdminLayout() {
    const { user, isAuthenticated, isLoading, logout } = useAdminAuth();
    const location = useLocation();

    if (isLoading) return <div className="p-8 text-white">Loading...</div>;

    if (!isAuthenticated) return <Navigate to="/admin/login" state={{ from: location }} replace />;

    const navItems = [
        { label: 'Dashboard', path: '/admin/dashboard', show: true },
        { label: 'Admins', path: '/admin/admins', show: user?.role === 'SUPER_ADMIN' },
        { label: 'Licenses', path: '/admin/licenses', show: true },
        { label: 'Audit Logs', path: '/admin/audit-logs', show: user?.role === 'SUPER_ADMIN' || user?.permissions?.canViewAuditLog },
        { label: 'Maintenance', path: '/admin/maintenance', show: user?.role === 'SUPER_ADMIN' },
    ];

    return (
        <div className="admin-page flex flex-col font-sans text-gray-200">
            <header className="border-b border-white/5 bg-[hsl(220,26%,6%)]/80 backdrop-blur-md sticky top-0 z-50 px-8 py-4 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <h1 className="font-display font-semibold text-xl tracking-tight text-white flex items-center gap-2">
                        Nexora <span className="text-primary text-xs uppercase tracking-widest font-sans font-bold bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">Admin</span>
                    </h1>
                    <nav className="flex gap-6">
                        {navItems.filter(i => i.show).map(item => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`text-sm font-medium transition-all duration-200 hover:text-white ${location.pathname === item.path
                                    ? 'text-primary drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                                    : 'text-gray-400'
                                    }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>
                <div className="flex items-center gap-6">
                    <span className="text-xs font-mono text-gray-500 bg-white/5 px-2 py-1 rounded border border-white/5">{user?.email}</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={logout}
                        className="text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        Logout
                    </Button>
                </div>
            </header>

            <main className="flex-1 p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-700 slide-in-from-bottom-4">
                <Outlet />
            </main>
        </div>
    );
}
