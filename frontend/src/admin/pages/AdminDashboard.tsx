import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Users, Key, FileText, Activity, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { AdminAuthService } from '../services/AdminAuthService';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function AdminDashboard() {
    const { user } = useAdminAuth();
    const [stats, setStats] = useState({ admins: 0, licenses: 0, activeKiosks: 0, recentLogs: [] });

    const canViewAdmins = user?.role === 'SUPER_ADMIN';
    const canViewLogs = user?.role === 'SUPER_ADMIN' || user?.permissions?.canViewAuditLog;

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const promises = [
                    fetch('/licenses', { headers: AdminAuthService.getAuthHeader() })
                ];

                if (canViewAdmins) {
                    promises.push(fetch('/admins', { headers: AdminAuthService.getAuthHeader() }));
                }
                if (canViewLogs) {
                    promises.push(fetch('/audit-logs', { headers: AdminAuthService.getAuthHeader() }));
                }

                const results = await Promise.all(promises);
                const licenses = await results[0].json();
                const admins = canViewAdmins ? await results[1].json() : [];
                const logs = canViewLogs ? await (canViewAdmins ? results[2] : results[1]).json() : [];

                setStats({
                    admins: Array.isArray(admins) ? admins.length : 0,
                    licenses: Array.isArray(licenses) ? licenses.length : 0,
                    activeKiosks: Array.isArray(licenses) ? licenses.filter((l: any) => l.status === 'ACTIVE' && l.deviceId).length : 0,
                    recentLogs: Array.isArray(logs) ? logs.slice(0, 5) : []
                });
            } catch (e) { console.error(e); }
        };
        if (user) fetchStats();
    }, [user, canViewAdmins, canViewLogs]);

    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-3xl font-display font-medium tracking-tight text-white/90">Dashboard</h1>
                <p className="text-gray-500 mt-2 font-light text-lg">System overview and health status.</p>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {canViewAdmins && (
                    <div className="admin-card p-6 flex items-center justify-between group">
                        <div>
                            <p className="text-sm font-medium text-gray-400">Total Admins</p>
                            <div className="text-4xl font-display font-bold text-white mt-2 tracking-tight group-hover:text-primary transition-colors">{stats.admins}</div>
                            <p className="text-xs text-gray-500 mt-1">Privileged accounts</p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-full group-hover:bg-primary/20 transition-colors">
                            <Users className="h-6 w-6 text-primary" />
                        </div>
                    </div>
                )}
                <div className="admin-card p-6 flex items-center justify-between group">
                    <div>
                        <p className="text-sm font-medium text-gray-400">Licenses Issued</p>
                        <div className="text-4xl font-display font-bold text-white mt-2 tracking-tight group-hover:text-primary transition-colors">{stats.licenses}</div>
                        <p className="text-xs text-gray-500 mt-1">
                            <span className="text-green-400">{stats.activeKiosks}</span> currently active
                        </p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-full group-hover:bg-primary/20 transition-colors">
                        <Key className="h-6 w-6 text-primary" />
                    </div>
                </div>
                <div className="admin-card p-6 flex items-center justify-between group">
                    <div>
                        <p className="text-sm font-medium text-gray-400">System Health</p>
                        <div className="text-4xl font-display font-bold text-green-400 mt-2 tracking-tight">100%</div>
                        <p className="text-xs text-gray-500 mt-1">All services operational</p>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-full">
                        <Activity className="h-6 w-6 text-green-400" />
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-xl font-display font-medium text-white/90 mb-6">Management Modules</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {canViewAdmins && (
                        <Link to="/admin/admins">
                            <div className="admin-card p-8 hover:border-primary/50 group cursor-pointer h-full relative">
                                <ArrowUpRight className="absolute top-6 right-6 h-5 w-5 text-gray-600 group-hover:text-primary transition-colors" />
                                <div className="h-12 w-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                                    <Users className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="font-semibold text-xl text-white mb-2">Manage Admins</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">Control user access, roles, and granular permissions for the console.</p>
                            </div>
                        </Link>
                    )}
                    <Link to="/admin/licenses">
                        <div className="admin-card p-8 hover:border-primary/50 group cursor-pointer h-full relative">
                            <ArrowUpRight className="absolute top-6 right-6 h-5 w-5 text-gray-600 group-hover:text-primary transition-colors" />
                            <div className="h-12 w-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                                <Key className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="font-semibold text-xl text-white mb-2">License Keys</h3>
                            <p className="text-sm text-gray-400 leading-relaxed">Generate activation keys and revoke access for kiosks remotely.</p>
                        </div>
                    </Link>
                    {canViewLogs && (
                        <Link to="/admin/audit-logs">
                            <div className="admin-card p-8 hover:border-primary/50 group cursor-pointer h-full relative">
                                <ArrowUpRight className="absolute top-6 right-6 h-5 w-5 text-gray-600 group-hover:text-primary transition-colors" />
                                <div className="h-12 w-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                                    <FileText className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="font-semibold text-xl text-white mb-2">Audit Logs</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">View an immutable record of all privileged security actions.</p>
                            </div>
                        </Link>
                    )}
                </div>
            </div>

            {/* Recent Activity Feed */}
            {canViewLogs && (
                <div className="pb-8">
                    <h2 className="text-xl font-display font-medium text-white/90 mb-6">Recent Activity</h2>
                    <div className="admin-card">
                        <div className="divide-y divide-white/5">
                            {stats.recentLogs.length > 0 ? (
                                stats.recentLogs.map((log: any) => (
                                    <div key={log.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2.5 rounded-full ${log.action.includes('REVOKE') ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
                                                {log.action.includes('REVOKE') ? <AlertTriangle className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">{log.action}</div>
                                                <div className="text-xs text-gray-500">{log.actorEmail}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-gray-400 font-mono">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            <div className="text-[10px] text-gray-600 font-medium uppercase tracking-wide mt-1">{new Date(log.createdAt).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center text-gray-500 text-sm">No recent activity recorded.</div>
                            )}
                        </div>
                        <div className="p-4 border-t border-white/5 bg-white/[0.01]">
                            <Link to="/admin/audit-logs" className="text-xs font-semibold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                                View Full Log <ArrowUpRight className="h-3 w-3" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
