import { API_BASE_SAFE } from './api-utils';

/**
 * Return absolute URL for uploaded proof files hosted by the backend.
 * Example: https://your-backend-host/uploads/encoded-filename.pdf
 */
export function proofUrl(filename: string | null | undefined): string | null {
  if (!filename) return null;
  const host = API_BASE_SAFE.replace(/\/api$/, '');
  return `${host}/uploads/${encodeURIComponent(filename)}`;
}
