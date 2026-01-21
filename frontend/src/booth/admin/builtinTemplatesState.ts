import { getBuiltinTemplates } from "@/booth/templates/builtinTemplates";
import type { TemplateAsset } from "@/booth/types";

const DISABLED_KEY = "nexora.booth.builtin_templates.disabled.v1";
const EVENT_NAME = "nexora.builtin_templates.updated";

export function loadBuiltinDisabledIds(): Set<string> {
  const raw = localStorage.getItem(DISABLED_KEY);
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

export function saveBuiltinDisabledIds(ids: Set<string>) {
  localStorage.setItem(DISABLED_KEY, JSON.stringify(Array.from(ids)));
  localStorage.setItem(`${DISABLED_KEY}.bump`, String(Date.now()));
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function setBuiltinTemplateEnabled(id: string, enabled: boolean) {
  const ids = loadBuiltinDisabledIds();
  if (enabled) ids.delete(id);
  else ids.add(id);
  saveBuiltinDisabledIds(ids);
}

export function getEnabledBuiltinTemplates(): TemplateAsset[] {
  const disabled = loadBuiltinDisabledIds();
  return getBuiltinTemplates().filter((t) => !disabled.has(t.id));
}

export function onBuiltinTemplatesChanged(cb: () => void) {
  const handler = () => cb();
  const storageHandler = (e: StorageEvent) => {
    if (e.key === DISABLED_KEY || e.key === `${DISABLED_KEY}.bump`) cb();
  };
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", storageHandler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", storageHandler);
  };
}
