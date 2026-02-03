import React, { useEffect, useState } from 'react';
import { AdminAuthService } from '../services/AdminAuthService';
import { useAdminAuth } from '../context/AdminAuthContext';
import { AdminUser } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Shield, ShieldAlert, User, Info, Lock, Plus, CheckCircle2 } from 'lucide-react';

export default function AdminAdmins() {
    const { user } = useAdminAuth();
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' });
    const [statusConfirm, setStatusConfirm] = useState<{ id: string, active: boolean } | null>(null);

    useEffect(() => {
        if (user?.role === 'SUPER_ADMIN') {
            fetchAdmins();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchAdmins = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'https://nexora-photobooth-clean-production.up.railway.app';
            const res = await fetch(`${API_URL}/admins`, {
                headers: AdminAuthService.getAuthHeader()
            });
            if (!res.ok) throw new Error('Failed to fetch admins');
            const data = await res.json();
            setAdmins(data);
        } catch (e) {
            toast.error('Could not load admins');
        } finally {
            setLoading(false);
        }
    };

    const createAdmin = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'https://nexora-photobooth-clean-production.up.railway.app';
            const res = await fetch(`${API_URL}/admins`, {
                method: 'POST',
                headers: {
                    ...AdminAuthService.getAuthHeader() as any,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newAdmin)
            });
            if (!res.ok) throw new Error('Failed to create admin');
            toast.success('Admin created successfully');
            setIsCreateOpen(false);
            setNewAdmin({ name: '', email: '', password: '' });
            fetchAdmins();
        } catch (e) {
            toast.error('Failed to create admin');
        }
    };

    const confirmStatusChange = async () => {
        if (!statusConfirm) return;
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'https://nexora-photobooth-clean-production.up.railway.app';
            await fetch(`${API_URL}/admins/${statusConfirm.id}/status`, {
                method: 'PATCH',
                headers: {
                    ...AdminAuthService.getAuthHeader() as any,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isActive: statusConfirm.active })
            });
            toast.success(`Admin ${statusConfirm.active ? 'activated' : 'deactivated'}`);
            setAdmins(prev => prev.map(a => a.id === statusConfirm.id ? { ...a, isActive: statusConfirm.active } : a));
        } catch (e) {
            toast.error('Update failed');
        } finally {
            setStatusConfirm(null);
        }
    };

    const updatePermission = async (id: string, perm: string, val: boolean) => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'https://nexora-photobooth-clean-production.up.railway.app';
            await fetch(`${API_URL}/admins/${id}/permissions`, {
                method: 'PATCH',
                headers: {
                    ...AdminAuthService.getAuthHeader() as any,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ [perm]: val })
            });
            toast.success('Permissions updated');
            setAdmins(prev => prev.map(a => {
                if (a.id !== id) return a;
                return { ...a, permissions: { ...a.permissions, [perm]: val } as any };
            }));
        } catch (e) {
            toast.error('Permission update failed');
        }
    };

    if (user?.role !== 'SUPER_ADMIN') {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[60vh] animate-in fade-in zoom-in-95 duration-500">
                <div className="p-4 bg-red-500/10 rounded-full mb-6 border border-red-500/20">
                    <Lock className="h-12 w-12 text-red-500" />
                </div>
                <h2 className="text-xl font-display font-bold text-white">Access Restricted</h2>
                <p className="text-gray-400 mt-2 max-w-sm">
                    You do not have permission to view or manage administrators.
                    Contact a Super Admin if you require access.
                </p>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-display font-medium tracking-tight text-white/90">Administrators</h1>
                        <p className="text-gray-500 mt-2 font-light text-lg">Manage system access and roles.</p>
                    </div>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 admin-button-primary"><Plus className="h-4 w-4" /> Create Admin</Button>
                        </DialogTrigger>
                        <DialogContent className="admin-card border-none text-white">
                            <DialogHeader>
                                <DialogTitle>Create New Admin</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400">Full Name</label>
                                    <Input className="admin-input" placeholder="John Doe" value={newAdmin.name} onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400">Email Address</label>
                                    <Input className="admin-input" placeholder="admin@nexora.com" value={newAdmin.email} onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400">Temporary Password</label>
                                    <Input className="admin-input" placeholder="••••••••" type="password" value={newAdmin.password} onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })} />
                                </div>
                                <Button onClick={createAdmin} className="w-full admin-button-primary">Create Account</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-6">
                    {loading ? <p className="text-gray-500">Loading...</p> : admins.map(admin => (
                        <div key={admin.id} className={`admin-card p-0 transition-opacity ${!admin.isActive && admin.role !== 'SUPER_ADMIN' ? 'opacity-60' : ''}`}>
                            <div className="p-6 flex flex-col md:flex-row justify-between items-start gap-4">
                                <div className="flex gap-5">
                                    <div className={`p-4 rounded-xl ${admin.role === 'SUPER_ADMIN' ? 'bg-purple-500/10 text-purple-400' : 'bg-primary/10 text-primary'}`}>
                                        {admin.role === 'SUPER_ADMIN' ? <ShieldAlert className="h-8 w-8" /> : <Shield className="h-8 w-8" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-semibold text-xl text-white tracking-tight">{admin.name}</h3>
                                            {admin.role === 'SUPER_ADMIN' && <Badge variant="secondary" className="bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 text-[10px] uppercase tracking-wider">Super Admin</Badge>}
                                            {admin.role !== 'SUPER_ADMIN' && !admin.isActive && <Badge variant="destructive" className="uppercase tracking-wider text-[10px]">Inactive</Badge>}
                                        </div>
                                        <p className="text-gray-500 font-mono text-sm mt-1">{admin.email}</p>
                                    </div>
                                </div>

                                {admin.role !== 'SUPER_ADMIN' && (
                                    <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                                        <span className="text-xs font-medium uppercase tracking-wider text-gray-400">Account Status</span>
                                        <Switch
                                            checked={admin.isActive ?? false}
                                            onCheckedChange={(v) => setStatusConfirm({ id: admin.id, active: v })}
                                            className="data-[state=checked]:bg-green-500"
                                        />
                                    </div>
                                )}
                            </div>

                            {admin.permissions && admin.role !== 'SUPER_ADMIN' && (
                                <div className="px-6 pb-6 pt-0">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-white/5 pt-6">
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-medium text-gray-300">Manage Devices</span>
                                                <Tooltip>
                                                    <TooltipTrigger><Info className="h-3.5 w-3.5 text-gray-600" /></TooltipTrigger>
                                                    <TooltipContent side="right">Can bind/unbind kiosks to hardware</TooltipContent>
                                                </Tooltip>
                                            </div>
                                            <Switch className="data-[state=checked]:bg-primary" checked={admin.permissions.canManageDevices} onCheckedChange={(v) => updatePermission(admin.id, 'canManageDevices', v)} disabled={!admin.isActive} />
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-medium text-red-400">Revoke Licenses</span>
                                                <Tooltip>
                                                    <TooltipTrigger><Info className="h-3.5 w-3.5 text-gray-600" /></TooltipTrigger>
                                                    <TooltipContent side="right">Can permanently disable kiosk licenses</TooltipContent>
                                                </Tooltip>
                                            </div>
                                            <Switch className="data-[state=checked]:bg-red-500" checked={admin.permissions.canRevokeLicense} onCheckedChange={(v) => updatePermission(admin.id, 'canRevokeLicense', v)} disabled={!admin.isActive} />
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-medium text-gray-300">View Audit Log</span>
                                                <Tooltip>
                                                    <TooltipTrigger><Info className="h-3.5 w-3.5 text-gray-600" /></TooltipTrigger>
                                                    <TooltipContent side="right">Can see all system security events</TooltipContent>
                                                </Tooltip>
                                            </div>
                                            <Switch className="data-[state=checked]:bg-primary" checked={admin.permissions.canViewAuditLog} onCheckedChange={(v) => updatePermission(admin.id, 'canViewAuditLog', v)} disabled={!admin.isActive} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <AlertDialog open={!!statusConfirm} onOpenChange={(open) => !open && setStatusConfirm(null)}>
                    <AlertDialogContent className="admin-card border-none text-white">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-400">
                                {statusConfirm?.active
                                    ? "This will restore full access for this administrator."
                                    : "This will immediately block this administrator from accessing the system."}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmStatusChange} className={statusConfirm?.active ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}>
                                {statusConfirm?.active ? "Activate Account" : "Deactivate Account"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </TooltipProvider>
    );
}
