import { z } from "zod";
import type { AdminSettings, StripConfig, StripTypeId } from "@/booth/types";

const STORAGE_KEY = "nexora.booth.admin_settings.v1";

const moneyCentsSchema = z.number().int().min(0).max(10_000_000);

const stripIdSchema = z.enum(["strip"]);

const stripConfigSchema = z.object({
  id: stripIdSchema,
  label: z.string().trim().min(1).max(60),
  description: z.string().trim().min(1).max(140),
  enabled: z.boolean(),
  unitPriceCents: moneyCentsSchema,
});

const settingsSchema = z
  .object({
    version: z.literal(1),
    currency: z.enum(["INR", "USD", "EUR"]),
    paymentMode: z.enum(["cash", "online", "both"]),
    strips: z.array(stripConfigSchema).min(1),
    kiosk: z.object({
      requireTemplateSelection: z.boolean(),
      photoCaptureCountdownSeconds: z.number().int().min(3).max(15),
    }),
    payments: z.object({
      razorpay: z.object({
        enabled: z.boolean(),
        keyId: z.string().trim().min(1).optional(),
        keySecret: z.string().trim().min(1).optional(),
      }),
    }),
  })
  .strict();

export function defaultAdminSettings(): AdminSettings {
  const base: Record<StripTypeId, StripConfig> = {
    strip: {
      id: "strip",
      label: "Strip Format",
      description: "Classic photo strip layout.",
      enabled: true,
      unitPriceCents: 12500, // demo: INR paise per print
    },
  };

  return {
    version: 1,
    currency: "INR",
    paymentMode: "cash",
    strips: [base.strip],
    kiosk: { requireTemplateSelection: true, photoCaptureCountdownSeconds: 10 },
    payments: {
      razorpay: {
        enabled: false,
        // Intentionally no defaults for keys.
      },
    },
  };
}

export function loadAdminSettings(): AdminSettings {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultAdminSettings();

  try {
    const parsed = JSON.parse(raw);
    const res = settingsSchema.safeParse(parsed);
    if (!res.success) return defaultAdminSettings();
    return res.data as AdminSettings;
  } catch {
    return defaultAdminSettings();
  }
}

export function saveAdminSettings(next: AdminSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

/**
 * Forces open kiosk screens (same tab) to re-load admin settings.
 * - Also triggers other tabs via localStorage 'storage' event.
 */
export function applyAdminSettings(next?: AdminSettings) {
  if (next) saveAdminSettings(next);
  localStorage.setItem("nexora.booth.admin_settings.bump.v1", String(Date.now()));
  window.dispatchEvent(new Event("nexora.admin_settings.updated"));
}
