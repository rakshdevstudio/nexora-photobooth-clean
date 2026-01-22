import React, { useEffect, useState } from 'react';
import { AdminAuthService } from '../services/AdminAuthService';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Key, Copy, Eye, EyeOff, Trash2, Monitor, AlertTriangle, Plus } from 'lucide-react';

interface License {
    id: string;
    key: string;
    status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
    deviceId?: string;
    createdAt: string;
}

export default function AdminLicenses() {
    const { user } = useAdminAuth();
    const [licenses, setLicenses] = useState<License[]>([]);
    const [loading, setLoading] = useState(true);
    const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
    const [revokeConfirm, setRevokeConfirm] = useState<string | null>(null);

    const canRevoke = user?.role === 'SUPER_ADMIN' || user?.permissions?.canRevokeLicense;

    const fetchLicenses = async () => {
        try {
            const res = await fetch('/licenses', {
                headers: AdminAuthService.getAuthHeader()
            });
            if (!res.ok) throw new Error('Failed to fetch licenses');
            const data = await res.json();
            setLicenses(data);
        } catch (e) {
            toast.error('Could not load licenses');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLicenses(); }, []);

    const generateLicense = async () => {
        try {
            const res = await fetch('/licenses', {
                method: 'POST',
                headers: {
                    ...AdminAuthService.getAuthHeader() as any,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });
            if (!res.ok) throw new Error('Failed to create license');
            toast.success('License generated successfully');
            fetchLicenses();
        } catch (e) {
            toast.error('Failed to generate license');
        }
    };

    const confirmRevoke = async () => {
        if (!revokeConfirm) return;
        try {
            await fetch(`/licenses/${revokeConfirm}/revoke`, {
                method: 'PATCH',
                headers: {
                    ...AdminAuthService.getAuthHeader() as any,
                }
            });
            toast.success('License revoked');
            fetchLicenses();
        } catch (e) {
            toast.error('Revoke failed');
        } finally {
            setRevokeConfirm(null);
        }
    };

    const toggleVisibility = (id: string) => {
        const next = new Set(visibleKeys);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setVisibleKeys(next);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-display font-medium tracking-tight text-white/90">License Management</h1>
                    <p className="text-gray-500 mt-2 font-light text-lg">Issue and manage kiosk activation keys.</p>
                </div>
                <Button onClick={generateLicense} className="gap-2 admin-button-primary">
                    <Plus className="h-4 w-4" /> Generate New License
                </Button>
            </div>

            <div className="grid gap-4">
                {loading ? <p className="text-gray-500">Loading...</p> : licenses.map(lic => {
                    const isVisible = visibleKeys.has(lic.id);
                    const isRevoked = lic.status === 'REVOKED';

                    return (
                        <div key={lic.id} className={`admin-card p-0 transition-all ${isRevoked ? 'opacity-50 grayscale' : 'hover:scale-[1.01]'}`}>
                            <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <span className={`font-mono text-lg font-bold tracking-wider ${isRevoked ? 'text-gray-500 line-through' : 'text-primary drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]'}`}>
                                            {isVisible ? lic.key : '••••••••••••••••••••••••••••••••'}
                                        </span>
                                        <div className="flex gap-1 ml-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-white hover:bg-white/5" onClick={() => toggleVisibility(lic.id)}>
                                                {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-white hover:bg-white/5" onClick={() => copyToClipboard(lic.key)}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-gray-400 font-light">
                                        <span className="flex items-center gap-1">Created: <span className="font-medium text-gray-300">{new Date(lic.createdAt).toLocaleDateString()}</span></span>
                                        {lic.deviceId ? (
                                            <span className="flex items-center gap-1.5 text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full text-xs font-medium border border-blue-500/20">
                                                <Monitor className="h-3 w-3" /> Bound: <span className="font-mono">{lic.deviceId.slice(0, 8)}...</span>
                                            </span>
                                        ) : (
                                            <span className="text-gray-600 text-xs uppercase tracking-wider font-semibold border border-white/5 px-2 py-0.5 rounded pl-2">Unbound</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <Badge variant={lic.status === 'ACTIVE' ? 'default' : 'destructive'}
                                        className={lic.status === 'ACTIVE'
                                            ? 'bg-green-500/20 text-green-400 border-green-500/20 hover:bg-green-500/30'
                                            : 'bg-red-500/20 text-red-400 border-red-500/20'}
                                    >
                                        {lic.status}
                                    </Badge>

                                    {lic.status === 'ACTIVE' && canRevoke && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-red-400 border-red-900/40 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-300 transition-all"
                                            onClick={() => setRevokeConfirm(lic.id)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" /> Revoke
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}

                {!loading && licenses.length === 0 && (
                    <div className="py-20 text-center text-gray-500 bg-white/[0.02] rounded-xl border border-dashed border-white/10 text-sm">
                        No licenses found. Generate one to get started.
                    </div>
                )}
            </div>

            <AlertDialog open={!!revokeConfirm} onOpenChange={(open) => !open && setRevokeConfirm(null)}>
                <AlertDialogContent className="admin-card border-none text-white max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-500">
                            <AlertTriangle className="h-5 w-5" /> Revoke License?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                            This action cannot be undone. Any kiosk currently using this license will be locked out immediately.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmRevoke} className="bg-red-600 hover:bg-red-700">
                            Yes, Revoke License
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
