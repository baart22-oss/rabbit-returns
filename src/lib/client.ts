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

// --- API Client ---
export const api = {
  auth: {
    login: async (email, password) => {
      const res = await fetch(buildUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data?.token) setToken(data.token);
      return data;
    },
    signup: async (email, password, fullName, referral) => {
      const res = await fetch(buildUrl('/auth/signup'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, referralCode: referral }),
      });
      const data = await res.json();
      if (data?.token) setToken(data.token);
      return data;
    },
    me: async () => {
      const res = await fetch(buildUrl('/auth/me'), { headers: authHeaders() });
      return await res.json();
    },
  },
  investments: {
    list: async () => fetch(buildUrl('/investments'), { headers: authHeaders() }).then(res => res.json()),
    create: async ({ packageName, amountRand, paymentReference }) =>
      fetch(buildUrl('/investments'), {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageName, amountRand, paymentReference }),
      }).then(res => res.json()),
    uploadProof: async (id, file, reference) => {
      const formData = new FormData();
      formData.append('file', file);
      if (reference) formData.append('paymentReference', reference);
      const res = await fetch(buildUrl(`/investments/${id}/proof`), {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
      });
      return await res.json();
    },
    get: async (id) => fetch(buildUrl(`/investments/${id}`), { headers: authHeaders() }).then(res => res.json()),
  },
  withdrawals: {
    list: async () => fetch(buildUrl('/withdrawals'), { headers: authHeaders() }).then(res => res.json()),
    submit: async (body) =>
      fetch(buildUrl('/withdrawals'), {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(res => res.json()),
  },
  raffle: {
    tickets: async () => fetch(buildUrl('/raffle/tickets'), { headers: authHeaders() }).then(res => res.json()),
    status: async () => fetch(buildUrl('/raffle/status'), { headers: authHeaders() }).then(res => res.json()),
    create: async (reference) =>
      fetch(buildUrl('/raffle/tickets'), {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentReference: reference }),
      }).then(res => res.json()),
    uploadProof: async (id, file) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(buildUrl(`/raffle/tickets/${id}/proof`), {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
      });
      return await res.json();
    },
  },
  admin: {
    dashboard: () => fetch(buildUrl('/admin/dashboard'), { headers: authHeaders() }).then(res => res.json()),
    investments: () => fetch(buildUrl('/admin/investments'), { headers: authHeaders() }).then(res => res.json()),
    updateInvestment: (id, body) =>
      fetch(buildUrl(`/admin/investments/${id}`), {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(res => res.json()),
    withdrawals: () => fetch(buildUrl('/admin/withdrawals'), { headers: authHeaders() }).then(res => res.json()),
    updateWithdrawal: (id, body) =>
      fetch(buildUrl(`/admin/withdrawals/${id}`), {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(res => res.json()),
    raffle: () => fetch(buildUrl('/admin/raffle'), { headers: authHeaders() }).then(res => res.json()),
    updateRaffle: (id, body) =>
      fetch(buildUrl(`/admin/raffle/${id}`), {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(res => res.json()),
    users: () => fetch(buildUrl('/admin/users'), { headers: authHeaders() }).then(res => res.json()),
    promoteUser: (id) =>
      fetch(buildUrl(`/admin/users/${id}/promote`), {
        method: 'PATCH',
        headers: authHeaders(),
      }).then(res => res.json()),
  },
};
