export type IdleCopyVariant = {
  headline: string;
  subheading: string;
};

export type IdleCopyConfig = {
  version: 1;
  intervalMs: number;
  variants: IdleCopyVariant[];
};

const STORAGE_KEY = "nexora.booth.idle_copy.v1";
const BUMP_KEY = "nexora.booth.idle_copy.bump.v1";

const DEFAULT_CONFIG: IdleCopyConfig = {
  version: 1,
  intervalMs: 30_000,
  variants: [
    {
      headline: "Tap to begin\nyour session.",
      subheading:
        "Designed for continuous events: fast decisions, clear steps, and safe back navigation until payment is locked.",
    },
    {
      headline: "A curated\nphoto moment.",
      subheading: "A calm, premium flow—made for queues, built for reliability.",
    },
    {
      headline: "A timeless\nframe of memory.",
      subheading: "Choose your shots, select a template, and let the booth do the rest.",
    },
  ],
};

function cloneConfig(c: IdleCopyConfig): IdleCopyConfig {
  // Safe deep clone for plain JSON config.
  return JSON.parse(JSON.stringify(c)) as IdleCopyConfig;
}

export function defaultIdleCopyConfig(): IdleCopyConfig {
  return cloneConfig(DEFAULT_CONFIG);
}

function isVariant(v: unknown): v is IdleCopyVariant {
  if (!v || typeof v !== "object") return false;
  const obj = v as Record<string, unknown>;
  return typeof obj.headline === "string" && typeof obj.subheading === "string";
}

export function loadIdleCopyConfig(): IdleCopyConfig {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultIdleCopyConfig();
  try {
    const parsed = JSON.parse(raw) as Partial<IdleCopyConfig>;
    const intervalMs =
      typeof parsed.intervalMs === "number" && Number.isFinite(parsed.intervalMs)
        ? Math.min(120_000, Math.max(10_000, Math.round(parsed.intervalMs)))
        : DEFAULT_CONFIG.intervalMs;

    const variants = Array.isArray(parsed.variants)
      ? parsed.variants.filter(isVariant).slice(0, 5)
      : DEFAULT_CONFIG.variants;

    if (!variants.length) return defaultIdleCopyConfig();

    return {
      version: 1,
      intervalMs,
      variants,
    };
  } catch {
    return defaultIdleCopyConfig();
  }
}

export function saveIdleCopyConfig(config: IdleCopyConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

/**
 * Forces open kiosk screens (same tab) to re-load idle copy.
 * - Also triggers other tabs via localStorage 'storage' event.
 */
export function applyIdleCopyConfig(next?: IdleCopyConfig) {
  if (next) saveIdleCopyConfig(next);
  localStorage.setItem(BUMP_KEY, String(Date.now()));
  window.dispatchEvent(new Event("nexora.idle_copy.updated"));
}
