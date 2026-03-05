import { buildUrl } from './api';

const TOKEN_KEY = 'rabbit_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.body && !(options.body instanceof FormData)
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const url = buildUrl(path);
  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    window.location.href = '/auth';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? res.statusText);
  }

  return res.json() as Promise<T>;
}

// ---- Types ----

export interface Profile {
  id: string;
  userId: string;
  fullName: string;
  phone?: string;
  referralCode: string;
  referredBy?: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  profile?: Profile | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Investment {
  id: string;
  userId: string;
  packageName: string;
  amountRand: number;
  status: 'pending' | 'active' | 'matured' | 'rejected';
  proofOfPayment?: string | null;
  paymentReference?: string | null;
  startedAt?: string | null;
  maturesAt?: string | null;
  totalEarned: number;
  lastAccruedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvestmentDto {
  packageName: string;
  amountRand: number;
  paymentReference?: string;
}

export interface RaffleTicket {
  id: string;
  userId: string;
  status: 'pending' | 'active' | 'rejected';
  proofOfPayment?: string | null;
  paymentReference?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RaffleStatus {
  sold: number;
  max: number;
  price: number;
}

export interface Withdrawal {
  id: string;
  userId: string;
  amountRand: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  branchCode: string;
  accountType: string;
  adminNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWithdrawalDto {
  amountRand: number;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  branchCode: string;
  accountType: string;
}

export interface BankingDetails {
  id: string;
  userId: string;
  accountHolder: string;
  bankName: string;
  accountNumber: string;
  branchCode: string;
  accountType: string;
  payfastEmail?: string | null;
  updatedAt: string;
}

export interface BankingDetailsDto {
  accountHolder: string;
  bankName: string;
  accountNumber: string;
  branchCode: string;
  accountType: string;
  payfastEmail?: string;
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

// ---- API client ----

export const api = {
  auth: {
    signup(email: string, password: string, fullName: string, referralCode?: string): Promise<AuthResponse> {
      return request<AuthResponse>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, fullName, referralCode }),
      }).then((data) => {
        setToken(data.token);
        return data;
      });
    },

    login(email: string, password: string): Promise<AuthResponse> {
      return request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }).then((data) => {
        setToken(data.token);
        return data;
      });
    },

    me(): Promise<User> {
      return request<User>('/auth/me');
    },
  },

  investments: {
    list(): Promise<Investment[]> {
      return request<Investment[]>('/investments');
    },

    create(data: CreateInvestmentDto): Promise<Investment> {
      return request<Investment>('/investments', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    uploadProof(id: string, file: File, reference?: string): Promise<Investment> {
      const form = new FormData();
      form.append('proof', file);
      if (reference) form.append('paymentReference', reference);
      return request<Investment>(`/investments/${id}/proof`, { method: 'POST', body: form });
    },

    get(id: string): Promise<Investment> {
      return request<Investment>(`/investments/${id}`);
    },
  },

  raffle: {
    status(): Promise<RaffleStatus> {
      return request<RaffleStatus>('/raffle/status');
    },

    tickets(): Promise<RaffleTicket[]> {
      return request<RaffleTicket[]>('/raffle/tickets');
    },

    create(reference?: string): Promise<RaffleTicket> {
      return request<RaffleTicket>('/raffle/tickets', {
        method: 'POST',
        body: JSON.stringify({ paymentReference: reference }),
      });
    },

    uploadProof(id: string, file: File): Promise<RaffleTicket> {
      const form = new FormData();
      form.append('proof', file);
      return request<RaffleTicket>(`/raffle/tickets/${id}/proof`, { method: 'POST', body: form });
    },
  },

  withdrawals: {
    list(): Promise<Withdrawal[]> {
      return request<Withdrawal[]>('/withdrawals');
    },

    create(data: CreateWithdrawalDto): Promise<Withdrawal> {
      return request<Withdrawal>('/withdrawals', { method: 'POST', body: JSON.stringify(data) });
    },
  },

  banking: {
    get(): Promise<BankingDetails> {
      return request<BankingDetails>('/banking');
    },

    upsert(data: BankingDetailsDto): Promise<BankingDetails> {
      return request<BankingDetails>('/banking', { method: 'POST', body: JSON.stringify(data) });
    },
  },

  admin: {
    dashboard(): Promise<DashboardStats> {
      return request<DashboardStats>('/admin/dashboard');
    },

    users(): Promise<User[]> {
      return request<User[]>('/admin/users');
    },

    promoteUser(id: string): Promise<void> {
      return request<void>(`/admin/users/${id}/promote`, { method: 'PATCH' });
    },

    investments(): Promise<Investment[]> {
      return request<Investment[]>('/admin/investments');
    },

    updateInvestment(id: string, data: { status: string; adminNote?: string }): Promise<Investment> {
      return request<Investment>(`/admin/investments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    withdrawals(): Promise<Withdrawal[]> {
      return request<Withdrawal[]>('/admin/withdrawals');
    },

    updateWithdrawal(id: string, data: { status: string; adminNote?: string }): Promise<Withdrawal> {
      return request<Withdrawal>(`/admin/withdrawals/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    raffle(): Promise<RaffleTicket[]> {
      return request<RaffleTicket[]>('/admin/raffle');
    },

    updateRaffle(id: string, data: { status: string }): Promise<RaffleTicket> {
      return request<RaffleTicket>(`/admin/raffle/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
  },
};
