import React, { useEffect, useState } from 'react';
import { AdminAuthService } from '../services/AdminAuthService';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Clock, Search, ShieldCheck, Key, UserCog, AlertCircle, FileText, Lock } from 'lucide-react';

interface AuditLog {
    id: string;
    action: string;
    actorEmail: string;
    metadata: any;
    createdAt: string;
}

export default function AdminAuditLogs() {
    const { user } = useAdminAuth();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    const canViewLogs = user?.role === 'SUPER_ADMIN' || user?.permissions?.canViewAuditLog;

    useEffect(() => {
        if (canViewLogs) {
            fetchLogs();
        } else {
            setLoading(false);
        }
    }, [user, canViewLogs]);

    const fetchLogs = async () => {
        try {
            const res = await fetch('/audit-logs', {
                headers: AdminAuthService.getAuthHeader()
            });
            if (!res.ok) throw new Error('Failed to fetch logs');
            const data = await res.json();
            setLogs(data);
        } catch (e) {
            toast.error('Could not load audit logs');
        } finally {
            setLoading(false);
        }
    };

    const getActionConfig = (action: string) => {
        if (action.includes('ADMIN')) return { icon: UserCog, color: 'text-purple-400', bg: 'bg-purple-400/10', label: 'Admin Mgmt' };
        if (action.includes('LICENSE')) return { icon: Key, color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'License' };
        if (action.includes('REVOKE')) return { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-400/10', label: 'Security' };
        return { icon: ShieldCheck, color: 'text-gray-400', bg: 'bg-gray-400/10', label: 'System' };
    };

    const formatRelativeTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return date.toLocaleDateString();
    };

    if (!canViewLogs) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[60vh] animate-in fade-in zoom-in-95 duration-500">
                <div className="p-4 bg-red-500/10 rounded-full mb-6 border border-red-500/20">
                    <Lock className="h-12 w-12 text-red-500" />
                </div>
                <h2 className="text-xl font-display font-bold text-white">Access Restricted</h2>
                <p className="text-gray-400 mt-2 max-w-sm">
                    You do not have permission to view audit logs.
                    Contact a Super Admin if you require this access level.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-display font-medium tracking-tight text-white/90">System Audit Logs</h1>
                <p className="text-gray-500 mt-2 font-light text-lg">Immutable record of all privileged actions.</p>
            </div>

            <div className="admin-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white/[0.02] border-b border-white/5">
                            <tr>
                                <th className="px-6 py-5 font-medium text-gray-500 w-[180px] uppercase tracking-wider text-xs">Timestamp</th>
                                <th className="px-6 py-5 font-medium text-gray-500 w-[160px] uppercase tracking-wider text-xs">Type</th>
                                <th className="px-6 py-5 font-medium text-gray-500 uppercase tracking-wider text-xs">Action Details</th>
                                <th className="px-6 py-5 font-medium text-gray-500 uppercase tracking-wider text-xs">Actor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={4} className="p-12 text-center text-gray-500">Loading audit records...</td></tr>
                            ) : logs.map(log => {
                                const config = getActionConfig(log.action);
                                const Icon = config.icon;
                                return (
                                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-400 font-mono text-xs">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-3 w-3 opacity-50" />
                                                {formatRelativeTime(log.createdAt)}
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 text-[10px] mt-1 transition-opacity text-gray-600">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="secondary" className={`${config.bg} ${config.color} border-0 hover:${config.bg}`}>
                                                <Icon className="h-3 w-3 mr-1.5" /> {config.label}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-200">{log.action}</div>
                                            <div className="font-mono text-xs text-gray-600 mt-1 max-w-lg truncate" title={JSON.stringify(log.metadata, null, 2)}>
                                                {JSON.stringify(log.metadata).replace(/["{}]/g, '').slice(0, 80)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-xs bg-white/5 px-2.5 py-1 rounded text-gray-300 border border-white/10">
                                                {log.actorEmail}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                            {!loading && logs.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-4 text-gray-500">
                                            <div className="p-5 bg-white/[0.02] rounded-full border border-white/5">
                                                <FileText className="h-8 w-8 text-gray-600" />
                                            </div>
                                            <p>No audit logs available yet.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
