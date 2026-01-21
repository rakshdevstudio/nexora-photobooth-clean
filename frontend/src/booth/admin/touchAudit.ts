const STORAGE_KEY = "nexora.touchAudit.v1";
const EVENT_NAME = "nexora.touchAudit.changed";

export function isTouchAuditEnabled(): boolean {
  return localStorage.getItem(STORAGE_KEY) === "1";
}

export function setTouchAuditEnabled(enabled: boolean) {
  localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function onTouchAuditChanged(cb: () => void) {
  const handler = () => cb();
  const storageHandler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) cb();
  };

  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", storageHandler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", storageHandler);
  };
}

export const touchAuditStorageKey = STORAGE_KEY;
