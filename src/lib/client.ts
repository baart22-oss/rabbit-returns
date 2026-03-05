// src/lib/client.ts

const API_URL = import.meta.env.VITE_API_URL; // Example: https://rabbit-returns-1.onrender.com

function authHeaders() {
  const token = localStorage.getItem('token'); // Adjust if you store JWT elsewhere
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || 'API request failed');
  }
  return res.json();
}

// ----- TYPES -----
export interface UserProfile {
  referralCode?: string;
  referredBy?: string;
}

export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  profile?: UserProfile;
}

export interface Investment {
  id: string;
  packageName: string;
  amountRand: number;
  status: 'pending' | 'active' | 'matured' | 'rejected';
  proofOfPayment?: string;
  createdAt: string;
}

export interface Withdrawal {
  id: string;
  amountRand: number;
  bankName: string;
  accountNumber: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  createdAt: string;
}

export interface RaffleTicket {
  id: string;
  status: 'pending' | 'active' | 'rejected';
  proofOfPayment?: string;
  createdAt: string;
  user?: User;
}

export interface DashboardStats {
  totalUsers: number;
  totalInvestments: number;
  totalRaffleTickets: number;
  totalWithdrawn: number;
  pendingInvestments: number;
  pendingWithdrawals: number;
  pendingRaffle: number;
}

// ----- API -----
export const api = {
  admin: {
    dashboard: () =>
      fetch(`${API_URL}/api/admin/dashboard`, {
        headers: authHeaders(),
      }).then(handleResponse<DashboardStats>),

    investments: () =>
      fetch(`${API_URL}/api/admin/investments`, {
        headers: authHeaders(),
      }).then(handleResponse<Investment[]>),

    updateInvestment: (id: string, body: { status: string; adminNote?: string }) =>
      fetch(`${API_URL}/api/admin/investments/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(body),
      }).then(handleResponse<Investment>),

    withdrawals: () =>
      fetch(`${API_URL}/api/admin/withdrawals`, {
        headers: authHeaders(),
      }).then(handleResponse<Withdrawal[]>),

    updateWithdrawal: (id: string, body: { status: string; adminNote?: string }) =>
      fetch(`${API_URL}/api/admin/withdrawals/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(body),
      }).then(handleResponse<Withdrawal>),

    raffle: () =>
      fetch(`${API_URL}/api/admin/raffle`, {
        headers: authHeaders(),
      }).then(handleResponse<RaffleTicket[]>),

    updateRaffle: (id: string, body: { status: string }) =>
      fetch(`${API_URL}/api/admin/raffle/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(body),
      }).then(handleResponse<RaffleTicket>),

    users: () =>
      fetch(`${API_URL}/api/admin/users`, {
        headers: authHeaders(),
      }).then(handleResponse<User[]>),

    promoteUser: (id: string) =>
      fetch(`${API_URL}/api/admin/users/${id}/promote`, {
        method: 'PATCH',
        headers: authHeaders(),
      }).then(handleResponse<User>),
  },
};
