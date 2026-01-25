import { IDB_STORES, idbAddRow, idbGetAll, idbDeleteOldest, idbDelKv, idbGetKv, idbSetKv } from "@/booth/storage/indexedDb";
import { nanoid } from "@/booth/utils/nanoid";

export type PrintJobStatus = "PENDING" | "PRINTED" | "FAILED";

export interface PrintJob {
    id: string;
    html: string; // The full HTML content to print
    printerName?: string; // Optional specific printer
    createdAt: string; // ISO
    status: PrintJobStatus;
    retryCount: number;
    lastError?: string;
    updatedAt: string;
}

const STORE = IDB_STORES.printQueue;

function getDbPromise() {
    // Helper to access DB logic if needed, but we use the exported helpers
    // We'll rely on idbAddRow which calls openDb internally
}

export async function enqueuePrintJob(html: string, printerName?: string): Promise<string> {
    const job: PrintJob = {
        id: `job-${nanoid()}`,
        html,
        printerName,
        createdAt: new Date().toISOString(),
        status: "PENDING",
        retryCount: 0,
        updatedAt: new Date().toISOString(),
    };
    await idbAddRow(STORE, job);
    return job.id;
}

export async function getPendingJobs(): Promise<PrintJob[]> {
    const all = await idbGetAll<PrintJob>(STORE);
    return all.filter((j) => j.status === "PENDING" || j.status === "FAILED"); // fetching failed too so we can retry manually if needed, or loop
}

export async function getAllJobs(): Promise<PrintJob[]> {
    const all = await idbGetAll<PrintJob>(STORE);
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateJobStatus(id: string, status: PrintJobStatus, error?: string): Promise<void> {
    // Read-modify-write is a bit racy without a transaction, but for single kiosk it's okay.
    // Ideally we'd use a transaction helper, but our current indexedDb.ts is simple.
    // We'll fetch all to find it (slow) or better, we update our indexedDb.ts to support get/put by ID.
    // Wait, idbAddRow uses 'put', so it overwrites. We just need to get the old one first.

    // Since we don't have getById exposed in indexedDb.ts, let's just fetch all and filter.
    // Optimization: Extend indexedDb.ts? 
    // For now, let's just use getAll since queue shouldn't be massive.

    const all = await idbGetAll<PrintJob>(STORE);
    const job = all.find((j) => j.id === id);
    if (!job) return;

    const updated: PrintJob = {
        ...job,
        status,
        updatedAt: new Date().toISOString(),
        lastError: error ?? job.lastError,
        retryCount: status === "PENDING" ? job.retryCount + 1 : job.retryCount, // Auto increment if kept pending (retry)
    };

    await idbAddRow(STORE, updated);
}

export async function deleteJob(id: string): Promise<void> {
    const { idbDeleteRow } = await import("@/booth/storage/indexedDb");
    await idbDeleteRow(STORE, id);
}
