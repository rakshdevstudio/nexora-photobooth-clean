import React from 'react';
import { Button } from '@/components/ui/button';
import { Lock, RefreshCw } from 'lucide-react';

interface Props {
    onRetry: () => void;
}

export default function LockedScreen({ onRetry }: Props) {
    return (
        <div className="fixed inset-0 bg-red-950/90 flex items-center justify-center z-[9999] backdrop-blur-sm">
            <div className="max-w-md w-full p-8 text-center space-y-8 animate-in fade-in duration-300">
                <div className="mx-auto w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6 border border-red-500/30">
                    <Lock className="h-10 w-10 text-red-500" />
                </div>

                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Device Locked</h1>
                    <p className="text-red-200/80 mt-4 text-lg">
                        This device's license has been revoked or has expired.
                    </p>
                    <p className="text-red-200/50 mt-2 text-sm">
                        Please contact your system administrator to restore access.
                    </p>
                </div>

                <Button
                    variant="outline"
                    size="lg"
                    className="border-red-500/30 text-red-200 hover:bg-red-500/20 hover:text-white"
                    onClick={onRetry}
                >
                    <RefreshCw className="h-4 w-4 mr-2" /> Retry Validation
                </Button>
            </div>
        </div>
    );
}
