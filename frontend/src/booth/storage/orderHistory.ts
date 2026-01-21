import type { PaymentMethod } from "@/booth/types";
import { IDB_STORES, idbClear, idbDeleteOldest, idbGetAll, idbAddRow } from "@/booth/storage/indexedDb";

export type OrderReceipt = {
  id: string;
  createdAt: string; // ISO
  shots: number;
  quantity: number;
  priceCents: number;
  currency: "INR" | "USD" | "EUR";
  paymentMethod: PaymentMethod;
  paymentRef: string;
};

// Legacy localStorage key (migrated into IndexedDB on demand).
const LEGACY_STORAGE_KEY = "nexora.booth.orders.v1";
const KEEP_LATEST = 500;

let migrated = false;
async function ensureMigrated() {
  if (migrated) return;
  migrated = true;

  const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    const legacy = Array.isArray(parsed) ? (parsed as OrderReceipt[]) : [];
    // Best-effort migration; ignore errors per-row.
    await Promise.all(legacy.map((r) => idbAddRow(IDB_STORES.orders, r).catch(() => undefined)));
    await idbDeleteOldest(IDB_STORES.orders, KEEP_LATEST);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // If legacy data is corrupt, don't block the kiosk.
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  }
}

export async function loadOrderHistory(): Promise<OrderReceipt[]> {
  await ensureMigrated();
  const all = await idbGetAll<OrderReceipt>(IDB_STORES.orders);
  return all
    .slice()
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, KEEP_LATEST);
}

export async function appendOrderReceipt(receipt: OrderReceipt): Promise<void> {
  await ensureMigrated();
  // Uniqueness is enforced by the paymentRef index (unique). If it conflicts, ignore.
  try {
    await idbAddRow(IDB_STORES.orders, receipt);
  } catch {
    return;
  }
  await idbDeleteOldest(IDB_STORES.orders, KEEP_LATEST);
}

export async function clearOrderHistory(): Promise<void> {
  await idbClear(IDB_STORES.orders);
}
