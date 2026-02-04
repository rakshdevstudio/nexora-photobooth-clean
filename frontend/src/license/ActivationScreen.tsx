import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LicenseService } from './LicenseService';
import { toast } from 'sonner';
import { Loader2, ShieldCheck } from 'lucide-react';

interface Props {
    onSuccess: () => void;
}

export default function ActivationScreen({ onSuccess }: Props) {
    const [key, setKey] = useState('');
    const [loading, setLoading] = useState(false);

    const handleActivate = async () => {
        if (!key.trim()) return;
        setLoading(true);

        try {
            const deviceId = await LicenseService.getDeviceId();
            const valid = await LicenseService.validateWithServer(key, deviceId);

            if (valid) {
                LicenseService.saveLicense({
                    key,
                    deviceId,
                    lastValidated: new Date().toISOString()
                });
                toast.success('Device Activation Successful');
                onSuccess();
            } else {
                toast.error('Invalid License Key');
            }
        } catch (e) {
            toast.error('Activation Failed. Check internet connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-neutral-950 flex items-center justify-center z-[9999]">
            <div className="max-w-md w-full p-8 text-center space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="mx-auto w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10">
                    <ShieldCheck className="h-8 w-8 text-white" />
                </div>

                <div>
                    <h1 className="text-2xl font-light tracking-wide text-white uppercase">Device Activation</h1>
                    <p className="text-gray-500 mt-2">Enter your license key to activate this kiosk.</p>
                </div>

                <div className="space-y-4">
                    <Input
                        placeholder="XXXX-XXXX-XXXX-XXXX"
                        value={key}
                        onChange={(e) => setKey(e.target.value.toUpperCase())}
                        className="bg-white/5 border-white/10 text-center text-lg tracking-widest uppercase text-white placeholder:text-gray-700 h-14"
                    />
                    <Button
                        size="lg"
                        className="w-full h-12 bg-white text-black hover:bg-gray-200"
                        onClick={handleActivate}
                        disabled={loading || !key}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {loading ? 'Verifying...' : 'Activate Device'}
                    </Button>
                </div>

                <p className="text-xs text-gray-700">
                    Device ID: <span className="font-mono">{localStorage.getItem('kiosk_device_id') || '...'}</span>
                </p>
            </div>
        </div>
    );
}
