// Safer API helper: uses VITE_API_URL when present, otherwise falls back to localhost.
const raw = String(import.meta.env.VITE_API_URL ?? '').trim();

function normalizeApiBase(input: string): string {
  let base = input.replace(/\/+$/, '');
  if (base.endsWith('/api/auth')) base = base.replace(/\/api\/auth$/, '/api');
  else if (base.endsWith('/auth')) base = base.replace(/\/auth$/, '/api');
  if (!base.endsWith('/api')) base = `${base}/api`;
  return base.replace(/\/+$/, '');
}
const API_BASE = raw ? normalizeApiBase(raw) : 'http://localhost:4000/api';
export const API_BASE_SAFE = API_BASE;

export function buildUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${p}`;
}
