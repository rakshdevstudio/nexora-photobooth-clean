// Centralized configuration for the frontend

// logic: Use VITE_API_URL if set.
// If not, check if we are in development mode:
//   - If dev, default to localhost:3000
//   - If prod, default to the known production Railway URL (fallback)

export const API_URL = import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? 'http://localhost:3000' : 'https://nexora-photobooth-clean-production.up.railway.app');
