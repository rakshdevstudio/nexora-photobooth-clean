import React, { useState } from 'react';
import { AdminAuthService } from '../services/AdminAuthService';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { AlertTriangle, Archive, FileClock, HardDrive, Key, Lock, ShieldAlert } from 'lucide-react';

interface MaintenanceAction {
    type: 'LICENSES' | 'AUDIT_LOGS' | 'DEVICES';
    label: string;
    description: string;
    icon: React.ElementType;
    defaultDays: number;
    colorFn: string; // Tailwind class
}

const ACTIONS: MaintenanceAction[] = [
    {
        type: 'LICENSES',
        label: 'Cleanup Expired Licenses',
        description: 'Archive licenses that have been expired for more than X days.',
        icon: Key,
        defaultDays: 30,
        colorFn: 'text-yellow-400 bg-yellow-400/10'
    },
    {
        type: 'AUDIT_LOGS',
        label: 'Archive Old Audit Logs',
        description: 'Archive system audit logs older than X days to maintain performance.',
        icon: FileClock,
        defaultDays: 90,
        colorFn: 'text-blue-400 bg-blue-400/10'
    },
    {
        type: 'DEVICES',
        label: 'Cleanup Inactive Devices',
        description: 'Archive devices that have not connected/updated for more than X days.',
        icon: HardDrive,
        defaultDays: 90,
        colorFn: 'text-purple-400 bg-purple-400/10'
    }
];

export default function AdminMaintenance() {
    const { user } = useAdminAuth();
    const [daysValues, setDaysValues] = useState<Record<string, number>>({
        LICENSES: 30,
        AUDIT_LOGS: 90,
        DEVICES: 90
    });
    const [loading, setLoading] = useState<string | null>(null);
    const [confirmAction, setConfirmAction] = useState<MaintenanceAction | null>(null);

    if (user?.role !== 'SUPER_ADMIN') {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[60vh] animate-in fade-in zoom-in-95 duration-500">
                <div className="p-4 bg-red-500/10 rounded-full mb-6 border border-red-500/20">
                    <Lock className="h-12 w-12 text-red-500" />
                </div>
                <h2 className="text-xl font-display font-bold text-white">Restricted Area</h2>
                <p className="text-gray-400 mt-2 max-w-sm">
                    This panel is restricted to Super Administrators only.
                </p>
            </div>
        );
    }

    const handleAction = async () => {
        if (!confirmAction) return;

        const type = confirmAction.type;
        const days = daysValues[type];
        setLoading(type);
        setConfirmAction(null);

        const API_URL = import.meta.env.VITE_API_URL || 'https://nexora-photobooth-clean-production.up.railway.app';
        let endpoint = '';
        if (type === 'LICENSES') endpoint = `${API_URL}/maintenance/licenses/cleanup`;
        if (type === 'AUDIT_LOGS') endpoint = `${API_URL}/maintenance/audit-logs/archive`;
        if (type === 'DEVICES') endpoint = `${API_URL}/maintenance/devices/cleanup`;

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    ...AdminAuthService.getAuthHeader() as any,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ days })
            });

            if (!res.ok) throw new Error('Action failed');
            const data = await res.json();
            toast.success(`Maintenance complete. Affected records: ${data.affectedCount}`, {
                duration: 5000,
                icon: <div className="p-1 bg-green-500/20 rounded-full"><Archive className="h-3 w-3 text-green-500" /></div>
            });
        } catch (e) {
            toast.error('Maintenance action failed. Check console.');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-display font-medium tracking-tight text-white/90">System Maintenance</h1>
                    <div className="px-2 py-0.5 rounded border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-mono uppercase tracking-widest flex items-center gap-1.5">
                        <ShieldAlert className="h-3 w-3" /> Super Admin Only
                    </div>
                </div>
                <p className="text-gray-500 font-light text-lg">Perform sensitive data hygiene operations. All actions are audited.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {ACTIONS.map(action => {
                    const Icon = action.icon;
                    return (
                        <div key={action.type} className="admin-card p-8 flex flex-col justify-between group h-full">
                            <div>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${action.colorFn}`}>
                                    <Icon className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-3">{action.label}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed mb-8">{action.description}</p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Threshold (Days)</label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={365}
                                        className="admin-input font-mono"
                                        value={daysValues[action.type]}
                                        onChange={(e) => setDaysValues({ ...daysValues, [action.type]: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <Button
                                    className="w-full admin-button-primary bg-white/10 hover:bg-white/20 text-white shadow-none border border-white/5"
                                    onClick={() => setConfirmAction(action)}
                                    disabled={!!loading}
                                >
                                    {loading === action.type ? 'Running...' : 'Run Maintenance'}
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
                <AlertDialogContent className="admin-card border-none text-white max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-white">
                            <AlertTriangle className="h-5 w-5 text-yellow-500" /> Confirm Maintenance
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400 pt-2">
                            Are you sure you want to run <strong>{confirmAction?.label}</strong> for records older than <span className="text-white font-mono">{confirmAction && daysValues[confirmAction.type]}</span> days?
                            <br /><br />
                            This action will batch update records to <span className="font-mono text-xs bg-white/10 px-1 rounded">isArchived=true</span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleAction} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                            Confirm & Run
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
