// Safer API helper: uses VITE_API_URL when present, otherwise falls back to localhost for dev builds.
const raw = String(import.meta.env.VITE_API_URL ?? '').trim();

// Turn the raw value into a well-formed API base that ends with /api (no trailing slash)
function normalizeApiBase(input: string): string {
  let base = input.replace(/\/+$/, ''); // remove trailing slashes

  // If someone accidentally set /api/auth or /auth in the env, convert to /api
  if (base.endsWith('/api/auth')) base = base.replace(/\/api\/auth$/, '/api');
  else if (base.endsWith('/auth')) base = base.replace(/\/auth$/, '/api');

  // If it's missing /api entirely, append it
  if (!base.endsWith('/api')) base = `${base}/api`;

  return base.replace(/\/+$/, ''); // ensure no trailing slash
}

// If env is missing, fallback to localhost (so builds succeed). Use a single canonical API base.
const API_BASE = raw ? normalizeApiBase(raw) : 'http://localhost:4000/api';

export const API_BASE_SAFE = API_BASE;

// Use buildUrl('/auth/login') to get a proper full URL
export function buildUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${p}`;
}
