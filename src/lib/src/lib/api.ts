// Normalizes VITE_API_URL and provides an `api()` helper to build endpoints safely.
const raw = String(import.meta.env.VITE_API_URL ?? '').trim();

// Turn the raw value into a well-formed API base that ends with /api (no trailing slash)
function normalizeApiBase(input: string): string {
  if (!input) {
    throw new Error('VITE_API_URL is not set');
  }
  let base = input.replace(/\/+$/, ''); // remove trailing slashes

  // If someone accidentally set /api/auth or /auth in the env, convert to /api
  if (base.endsWith('/api/auth')) base = base.replace(/\/api\/auth$/, '/api');
  else if (base.endsWith('/auth')) base = base.replace(/\/auth$/, '/api');

  // If it's missing /api entirely, append it
  if (!base.endsWith('/api')) base = `${base}/api`;

  return base.replace(/\/+$/, ''); // ensure no trailing slash
}

export const API_BASE = normalizeApiBase(raw);

// Use api('/auth/login') to get a proper full URL
export function api(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${p}`;
}
