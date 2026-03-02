const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: Error | null }> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { data: null, error: new Error(body.message || res.statusText) };
    }
    const data: T = await res.json();
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

const api = {
  /** Convenience wrapper that mirrors a small subset of the Supabase client used in this app. */
  from: (table: string) => ({
    select: (cols = '*') => ({
      order: (_col: string, _opts?: object) => apiFetch<unknown[]>(`/admin/${table}`),
    }),
    update: (body: object) => ({
      eq: (col: string, val: string) =>
        apiFetch(`/admin/${table.replace(/_/g, '-')}/${val}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        }),
    }),
  }),
  rpc: (_fn: string, _args?: object) => Promise.resolve({ data: false, error: null }),
  auth: {
    getSession: async () => {
      const token = getToken();
      if (!token) return { data: { session: null } };
      const { data } = await apiFetch<{ user: object; profile: object }>('/auth/me');
      if (!data) return { data: { session: null } };
      return { data: { session: { user: data.user, access_token: token } } };
    },
    onAuthStateChange: (_cb: (event: string, session: unknown) => void) => ({
      data: { subscription: { unsubscribe: () => undefined } },
    }),
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { error: new Error(body.message || 'Login failed') };
      }
      const body = await res.json();
      localStorage.setItem('auth_token', body.token);
      localStorage.setItem('auth_user', JSON.stringify({ id: body.userId, email, role: body.role }));
      return { error: null };
    },
    signUp: async ({ email, password }: { email: string; password: string }) => {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { error: new Error(body.message || 'Registration failed') };
      }
      const body = await res.json();
      localStorage.setItem('auth_token', body.token);
      localStorage.setItem('auth_user', JSON.stringify({ id: body.userId, email, role: body.role }));
      return { error: null };
    },
    signOut: async () => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      return { error: null };
    },
  },
};

export { apiFetch, API_BASE };
export default api;