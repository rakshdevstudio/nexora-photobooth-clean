import { usePrintQueue } from "@/booth/printQueue/PrintQueueContext";
import { Printer } from "lucide-react";

export default function PrintQueueIndicator() {
    const { queueSize, isProcessing } = usePrintQueue();

    if (queueSize === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-yellow-500/30 bg-black/80 px-3 py-1.5 text-xs text-yellow-500 backdrop-blur-md">
            <Printer className={`h-3 w-3 ${isProcessing ? "animate-pulse" : ""}`} />
            <span>{queueSize} pending</span>
        </div>
    );
}
