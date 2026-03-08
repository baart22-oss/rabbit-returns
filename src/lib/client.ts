// --- API Client Utilities & Endpoints ---
export function clearToken() {
  localStorage.removeItem('rabbit_token');
}
export function setToken(token: string) {
  localStorage.setItem('rabbit_token', token);
}
export function getToken() {
  return localStorage.getItem('rabbit_token');
}
export function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

import { buildUrl } from './api-utils';

// helper to parse JSON safely
async function parseJsonSafe(res: Response) {
  try { return await res.json(); } catch { return {}; }
}

// --- API Client ---
export const api = {
  auth: {
    login: async (email: string, password: string) => {
      const res = await fetch(buildUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
      if (data?.token) setToken(data.token);
      return data;
    },
    signup: async (email: string, password: string, fullName: string, referral?: string) => {
      const res = await fetch(buildUrl('/auth/signup'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, referralCode: referral }),
      });
      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
      if (data?.token) setToken(data.token);
      return data;
    },
    me: async () => {
      const res = await fetch(buildUrl('/auth/me'), { headers: authHeaders() });
      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
      return data;
    },
  },
  investments: {
    list: async () => {
      const res = await fetch(buildUrl('/investments'), { headers: authHeaders() });
      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
      return data;
    },
    create: async ({ packageName, amountRand, paymentReference }: { packageName: string; amountRand: number; paymentReference?: string }) => {
      const res = await fetch(buildUrl('/investments'), {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageName, amountRand, paymentReference }),
      });
      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
      return data;
    },
    uploadProof: async (id: string, file: File, reference?: string) => {
      const formData = new FormData();
      formData.append('file', file);
      if (reference) formData.append('paymentReference', reference);
      const res = await fetch(buildUrl(`/investments/${id}/proof`), {
        method: 'POST',
        headers: { ...authHeaders() }, // let browser set Content-Type
        body: formData,
      });
      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
      return data;
    },
    get: async (id: string) => {
      const res = await fetch(buildUrl(`/investments/${id}`), { headers: authHeaders() });
      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
      return data;
    },
  },
  withdrawals: {
    list: async () => {
      const res = await fetch(buildUrl('/withdrawals'), { headers: authHeaders() });
      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
      return data;
    },
    submit: async (body: any) => {
      const res = await fetch(buildUrl('/withdrawals'), {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
      return data;
    },
  },
  raffle: {
    tickets: async () => {
      const res = await fetch(buildUrl('/raffle/tickets'), { headers: authHeaders() });
      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
      return data;
    },
    status: async () => {
      const res = await fetch(buildUrl('/raffle/status'), { headers: authHeaders() });
      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
      return data;
    },
    create: async (reference?: string) => {
      const res = await fetch(buildUrl('/raffle/tickets'), {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentReference: reference }),
      });
      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
      return data;
    },
    uploadProof: async (id: string, file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(buildUrl(`/raffle/tickets/${id}/proof`), {
        method: 'POST',
        headers: { ...authHeaders() },
        body: formData,
      });
      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
      return data;
    },
  },
  admin: {
    dashboard: async () => {
      const res = await fetch(buildUrl('/admin/dashboard'), { headers: authHeaders() });
      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
      return data;
    },
    investments: async () => {
      const res = await fetch(buildUrl('/admin/investments'), { headers: authHeaders() });
      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
      return data;
    },
    updateInvestment: async (id: string, body: any) => {
      const res = await fetch(buildUrl(`/admin/investments/${id}`), {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
      return data;
    },
    withdrawals: async () => {
      const res = await fetch(buildUrl('/admin/withdrawals'), { headers: authHeaders() });
      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
      return data;
    },
    updateWithdrawal: async (id: string, body: any) => {
      const res = await fetch(buildUrl(`/admin/withdrawals/${id}`), {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
      return data;
    },
  },
};
