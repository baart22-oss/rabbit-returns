import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import {
  api,
  type DashboardStats,
  type Investment,
  type Withdrawal,
  type RaffleTicket,
  type User,
} from '../lib/api';

type Tab = 'overview' | 'investments' | 'withdrawals' | 'raffle' | 'users';

export default function AdminDashboard() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [raffle, setRaffle] = useState<RaffleTicket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) return;
    loadData();
  }, [loading, user, isAdmin]);

  const loadData = async () => {
    setDataLoading(true);
    try {
      const [s, inv, wd, rf, us] = await Promise.all([
        api.admin.dashboard(),
        api.admin.investments(),
        api.admin.withdrawals(),
        api.admin.raffle(),
        api.admin.users(),
      ]);
      setStats(s);
      setInvestments(inv);
      setWithdrawals(wd);
      setRaffle(rf);
      setUsers(us);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setDataLoading(false);
    }
  };

  const updateInvestment = async (id: string, status: string) => {
    try {
      const updated = await api.admin.updateInvestment(id, { status });
      setInvestments((prev) => prev.map((i) => (i.id === id ? updated : i)));
    } catch {
      setError('Failed to update investment');
    }
  };

  const updateWithdrawal = async (id: string, status: string) => {
    try {
      const updated = await api.admin.updateWithdrawal(id, { status });
      setWithdrawals((prev) => prev.map((w) => (w.id === id ? updated : w)));
    } catch {
      setError('Failed to update withdrawal');
    }
  };

  const updateRaffle = async (id: string, status: string) => {
    try {
      const updated = await api.admin.updateRaffle(id, { status });
      setRaffle((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch {
      setError('Failed to update raffle ticket');
    }
  };

  const promoteUser = async (id: string) => {
    try {
      await api.admin.promoteUser(id);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: 'admin' as const } : u)));
    } catch {
      setError('Failed to promote user');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (!user || !isAdmin) return <Navigate to="/dashboard" />;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'investments', label: 'Investments' },
    { id: 'withdrawals', label: 'Withdrawals' },
    { id: 'raffle', label: 'Raffle' },
    { id: 'users', label: 'Users' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="text-xl font-bold text-green-700">
            🐰 Rabbit Returns
          </button>
          <span className="text-sm text-gray-500">Admin Dashboard</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
                tab === t.id
                  ? 'bg-white border border-b-white border-gray-200 text-green-700 -mb-px'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {dataLoading && <p className="text-gray-500 text-sm">Loading data…</p>}

        {/* Overview */}
        {tab === 'overview' && stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: stats.totalUsers },
              { label: 'Total Investments', value: stats.totalInvestments },
              { label: 'Total Withdrawn', value: `R${stats.totalWithdrawn.toLocaleString()}` },
              { label: 'Raffle Tickets', value: stats.totalRaffleTickets },
              { label: 'Pending Investments', value: stats.pendingInvestments },
              { label: 'Pending Withdrawals', value: stats.pendingWithdrawals },
              { label: 'Pending Raffle', value: stats.pendingRaffle },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl shadow p-5 text-center">
                <p className="text-xs text-gray-500 uppercase mb-1">{s.label}</p>
                <p className="text-2xl font-bold text-gray-800">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Investments */}
        {tab === 'investments' && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Package</th>
                    <th className="px-4 py-3 text-left">Amount</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Proof</th>
                    <th className="px-4 py-3 text-left">Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {investments.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{inv.packageName}</td>
                      <td className="px-4 py-3">R{inv.amountRand.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          inv.status === 'active' ? 'bg-green-100 text-green-700' :
                          inv.status === 'matured' ? 'bg-blue-100 text-blue-700' :
                          inv.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {inv.proofOfPayment ? (
                          <a
                            href={inv.proofOfPayment}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-xs"
                          >
                            View
                          </a>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={inv.status}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            updateInvestment(inv.id, e.target.value)
                          }
                          className="border border-gray-300 rounded px-2 py-1 text-xs"
                        >
                          <option value="pending">Pending</option>
                          <option value="active">Active</option>
                          <option value="matured">Matured</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Withdrawals */}
        {tab === 'withdrawals' && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Amount</th>
                    <th className="px-4 py-3 text-left">Bank</th>
                    <th className="px-4 py-3 text-left">Account</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {withdrawals.map((wd) => (
                    <tr key={wd.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">R{wd.amountRand.toLocaleString()}</td>
                      <td className="px-4 py-3">{wd.bankName}</td>
                      <td className="px-4 py-3">{wd.accountNumber}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          wd.status === 'paid' ? 'bg-green-100 text-green-700' :
                          wd.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                          wd.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {wd.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={wd.status}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            updateWithdrawal(wd.id, e.target.value)
                          }
                          className="border border-gray-300 rounded px-2 py-1 text-xs"
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="paid">Paid</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Raffle */}
        {tab === 'raffle' && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Ticket ID</th>
                    <th className="px-4 py-3 text-left">Reference</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {raffle.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs">{r.id.slice(0, 8)}</td>
                      <td className="px-4 py-3">{r.paymentReference ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.status === 'active' ? 'bg-green-100 text-green-700' :
                          r.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={r.status}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            updateRaffle(r.id, e.target.value)
                          }
                          className="border border-gray-300 rounded px-2 py-1 text-xs"
                        >
                          <option value="pending">Pending</option>
                          <option value="active">Active</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => promoteUser(u.id)}
                            className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded hover:bg-purple-200 transition"
                          >
                            Promote to Admin
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
