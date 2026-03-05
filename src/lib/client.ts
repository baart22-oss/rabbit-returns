// src/lib/client.ts

const API_URL = import.meta.env.VITE_API_URL; // e.g., https://rabbit-returns-1.onrender.com

function authHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || 'API request failed');
  }
  return res.json();
}

export const api = {
  admin: {
    dashboard: () => fetch(`${API_URL}/admin/dashboard`, { headers: authHeaders() }).then(handleResponse),
    investments: () => fetch(`${API_URL}/admin/investments`, { headers: authHeaders() }).then(handleResponse),
    updateInvestment: (id: string, body: { status: string; adminNote?: string }) =>
      fetch(`${API_URL}/admin/investments/${id}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(body) }).then(handleResponse),
    withdrawals: () => fetch(`${API_URL}/admin/withdrawals`, { headers: authHeaders() }).then(handleResponse),
    updateWithdrawal: (id: string, body: { status: string; adminNote?: string }) =>
      fetch(`${API_URL}/admin/withdrawals/${id}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(body) }).then(handleResponse),
    raffle: () => fetch(`${API_URL}/admin/raffle`, { headers: authHeaders() }).then(handleResponse),
    updateRaffle: (id: string, body: { status: string }) =>
      fetch(`${API_URL}/admin/raffle/${id}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(body) }).then(handleResponse),
    users: () => fetch(`${API_URL}/admin/users`, { headers: authHeaders() }).then(handleResponse),
    promoteUser: (id: string) => fetch(`${API_URL}/admin/users/${id}/promote`, { method: 'PATCH', headers: authHeaders() }).then(handleResponse),
  },
};
