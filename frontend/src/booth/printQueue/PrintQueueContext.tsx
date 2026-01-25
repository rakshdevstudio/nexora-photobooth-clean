import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { getPendingJobs, updateJobStatus, PrintJob } from "./printQueueService";

interface PrintQueueContextValue {
    queueSize: number;
    isProcessing: boolean;
    forceRetry: () => void;
}

const PrintQueueContext = createContext<PrintQueueContextValue | null>(null);

export function usePrintQueue() {
    const ctx = useContext(PrintQueueContext);
    if (!ctx) throw new Error("usePrintQueue must be used within PrintQueueProvider");
    return ctx;
}

export function PrintQueueProvider({ children }: { children: React.ReactNode }) {
    const [queueSize, setQueueSize] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const processingRef = useRef(false); // Ref to avoid closure staleness and double-processing

    const processQueue = async () => {
        if (processingRef.current) return; // Already running
        if (!window.electron) return; // Only process in Electron mode

        processingRef.current = true;
        setIsProcessing(true);

        try {
            const jobs = await getPendingJobs();
            setQueueSize(jobs.length);

            if (jobs.length === 0) {
                processingRef.current = false;
                setIsProcessing(false);
                return;
            }

            console.log(`[PrintQueue] Processing ${jobs.length} pending jobs...`);

            // Process one by one to avoid flooding the printer
            for (const job of jobs) {
                // Double check printer availability? 
                // Electron's print function handles the "attempt".

                console.log(`[PrintQueue] Retrying job ${job.id} (Attempt ${job.retryCount + 1})`);

                try {
                    const printerName = job.printerName || undefined; // If null/empty, use default
                    await window.electron.printImage(job.html, printerName);

                    // If successful
                    await updateJobStatus(job.id, "PRINTED");
                    console.log(`[PrintQueue] Job ${job.id} SUCCESS`);
                } catch (err) {
                    console.error(`[PrintQueue] Job ${job.id} FAILED:`, err);
                    // Update status to keep it pending but track retry + error
                    // Note: updateJobStatus auto-increments retryCount if status is PENDING
                    await updateJobStatus(job.id, "PENDING", String(err));
                }
            }

            // Update size after run
            const remaining = await getPendingJobs();
            setQueueSize(remaining.length);

        } catch (err) {
            console.error("[PrintQueue] Worker error:", err);
        } finally {
            processingRef.current = false;
            setIsProcessing(false);
        }
    };

    // Poll every 30 seconds automatically
    useEffect(() => {
        // Initial check
        void processQueue();

        const interval = setInterval(() => {
            void processQueue();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    return (
        <PrintQueueContext.Provider value={{ queueSize, isProcessing, forceRetry: processQueue }}>
            {children}
        </PrintQueueContext.Provider>
    );
}
