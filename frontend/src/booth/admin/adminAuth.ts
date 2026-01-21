const ADMIN_AUTH_SESSION_KEY = "nexora.admin.auth.session.v1";
const ADMIN_PIN_KEY = "nexora.admin.pin.v1";

// Minimal default; can be changed later in admin settings UI.
const DEFAULT_PIN = "0000";

type AdminAuthSession = {
  expiresAt: number;
};

export function getAdminPin(): string {
  return localStorage.getItem(ADMIN_PIN_KEY) ?? DEFAULT_PIN;
}

export function setAdminPin(pin: string) {
  localStorage.setItem(ADMIN_PIN_KEY, pin);
}

export function setAdminAuthed(options?: { ttlMs?: number }) {
  const ttlMs = options?.ttlMs ?? 2 * 60 * 60 * 1000; // 2 hours
  const session: AdminAuthSession = { expiresAt: Date.now() + ttlMs };
  sessionStorage.setItem(ADMIN_AUTH_SESSION_KEY, JSON.stringify(session));
}

export function clearAdminAuthed() {
  sessionStorage.removeItem(ADMIN_AUTH_SESSION_KEY);
}

export function isAdminAuthed(): boolean {
  const raw = sessionStorage.getItem(ADMIN_AUTH_SESSION_KEY);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as AdminAuthSession;
    if (!parsed?.expiresAt) return false;
    if (Date.now() > parsed.expiresAt) {
      clearAdminAuthed();
      return false;
    }
    return true;
  } catch {
    clearAdminAuthed();
    return false;
  }
}
