// unified client helpers for the frontend (auth + admin + typed exports)
// Replace existing src/lib/client.ts with this content.

import { buildUrl } from './api';

/**
 * Token storage: keep one canonical key so auth.tsx and client agree.
 */
const TOKEN_KEY = 'rabbit_token';

export function setToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore storage errors (e.g., SSR or private mode)
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? '';
  } catch {
    return '';
  }
}

function authHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    const data = await res.json().catch(() => ({} as any));
    throw new Error(data?.error || 'API request failed');
  }
  return res.json();
}

/**
 * Minimal exported types used across the frontend.
 * Expand these as needed to match your backend shape.
 */
export type User = {
  id: string;
  email: string;
  role?: string;
  fullName?: string;
  createdAt?: string;
};

export type Investment = {
  id: string;
  amountRand: number;
  totalEarned: number;
  status: string;
  createdAt?: string;
};

export type Withdrawal = {
  id: string;
  amountRand?: number;
  status?: string;
  createdAt?: string;
};

export type RaffleTicket = {
  id: string;
  reference?: string;
  status?: string;
  createdAt?: string;
};

export type DashboardStats = {
  totalUsers?: number;
  totalInvested?: number;
  totalWithdrawn?: number;
  [k: string]: any;
};

/**
 * Public client API expected by the app.
 * - auth: login/signup/me (stores/reads token via setToken/clearToken)
 * - admin: admin endpoints (keeps previous admin methods)
 */
export const api = {
  auth: {
    login: async (email: string, password: string) => {
      const res = await fetch(buildUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await handleResponse(res);
      // store token if present
      if (data?.token) setToken(data.token);
      return data; // expected { token, user }
    },
    signup: async (email: string, password: string, fullName: string, referral?: string) => {
      const res = await fetch(buildUrl('/auth/signup'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, referralCode: referral }),
      });
      const data = await handleResponse(res);
      if (data?.token) setToken(data.token);
      return data;
    },
    me: async (): Promise<User> => {
      const res = await fetch(buildUrl('/auth/me'), { headers: authHeaders() });
      return handleResponse(res);
    },
    logout: async () => {
      clearToken();
    },
  },

  admin: {
    dashboard: () => fetch(buildUrl('/admin/dashboard'), { headers: authHeaders() }).then(handleResponse),
    investments: () => fetch(buildUrl('/admin/investments'), { headers: authHeaders() }).then(handleResponse),
    updateInvestment: (id: string, body: { status: string; adminNote?: string }) =>
      fetch(buildUrl(`/admin/investments/${id}`), { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(body) }).then(handleResponse),
    withdrawals: () => fetch(buildUrl('/admin/withdrawals'), { headers: authHeaders() }).then(handleResponse),
    updateWithdrawal: (id: string, body: { status: string; adminNote?: string }) =>
      fetch(buildUrl(`/admin/withdrawals/${id}`), { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(body) }).then(handleResponse),
    raffle: () => fetch(buildUrl('/admin/raffle'), { headers: authHeaders() }).then(handleResponse),
    updateRaffle: (id: string, body: { status: string }) =>
      fetch(buildUrl(`/admin/raffle/${id}`), { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(body) }).then(handleResponse),
    users: () => fetch(buildUrl('/admin/users'), { headers: authHeaders() }).then(handleResponse),
    promoteUser: (id: string) => fetch(buildUrl(`/admin/users/${id}/promote`), { method: 'PATCH', headers: authHeaders() }).then(handleResponse),
  },
};
