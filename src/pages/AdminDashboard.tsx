import React, { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api } from '../lib/client';
import { proofUrl } from '../lib/urls';

const AdminDashboard = () => {
  const { isAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<any>(null);
  const [investments, setInvestments] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [raffleTickets, setRaffleTickets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  // Accrual run state
  const [runningAccrual, setRunningAccrual] = useState(false);
  const [accrualResult, setAccrualResult] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    setFetching(true);
    Promise.all([
      api.admin.dashboard(),
      api.admin.investments(),
      api.admin.withdrawals(),
      api.admin.raffle(),
      api.admin.users(),
    ])
      .then(([s, inv, wd, rt, u]) => {
        setStats(s);
        setInvestments(Array.isArray(inv) ? inv : []);
        setWithdrawals(Array.isArray(wd) ? wd : []);
        setRaffleTickets(Array.isArray(rt) ? rt : []);
        setUsers(Array.isArray(u) ? u : []);
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [isAdmin]);

  const updateInvestment = async (id: string, status: string) => {
    try {
      const updated = await api.admin.updateInvestment(id, { status });
      setInvestments(prev => prev.map(i => (i.id === id ? updated : i)));
    } catch {}
  };

  const updateWithdrawal = async (id: string, status: string, adminNote?: string) => {
    try {
      const updated = await api.admin.updateWithdrawal(id, { status, adminNote });
      setWithdrawals(prev => prev.map(w => (w.id === id ? updated : w)));
    } catch {}
  };

  const updateRaffle = async (id: string, status: string) => {
    try {
      const updated = await api.admin.updateRaffle(id, { status });
      setRaffleTickets(prev => prev.map(t => (t.id === id ? updated : t)));
    } catch {}
  };

  const promoteUser = async (id: string) => {
    try {
      await api.admin.promoteUser(id);
      setUsers(prev => prev.map(u => (u.id === id ? { ...u, role: 'admin' } : u)));
    } catch {}
  };

  // Run accrual manually (calls backend POST /api/admin/run-accrual via api client)
  const handleRunAccrual = async () => {
    setRunningAccrual(true);
    setAccrualResult(null);
    try {
      const json = await api.admin.runAccrual();
      // json expected: { ok: true, message: 'Accrual run triggered', result: { updated, matured, skipped } }
      if (json?.ok && json.result) {
        const r = json.result;
        setAccrualResult(`Accrual completed — updated: ${r.updated}, matured: ${r.matured}, skipped: ${r.skipped}`);
      } else {
        setAccrualResult(`Accrual run response: ${JSON.stringify(json)}`);
      }
      // refresh admin dashboard data
      try {
        const s = await api.admin.dashboard();
        setStats(s);
        const inv = await api.admin.investments();
        setInvestments(Array.isArray(inv) ? inv : []);
      } catch (e) {
        // ignore refresh errors
      }
    } catch (err: any) {
      setAccrualResult(`Error: ${err?.message || String(err)}`);
    } finally {
      setRunningAccrual(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading…</div>;
  if (!isAdmin) return <Navigate to="/dashboard" />;
  if (fetching) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading admin data…</div>;

  const tabs = ['overview', 'investments', 'withdrawals', 'raffle', 'users'];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-green-700">🐰 Rabbit Returns</Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 mr-4">Admin Dashboard</span>

            {/* Run accrual button (admin-only) */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleRunAccrual}
                disabled={runningAccrual}
                className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-60"
                title="Run accrual now (admin only)"
              >
                {runningAccrual ? 'Running…' : 'Run Accrual'}
              </button>
              {accrualResult && <span className="text-xs text-gray-600">{accrualResult}</span>}
            </div>

          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition ${
                activeTab === tab
                  ? 'bg-green-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: stats.totalUsers },
              { label: 'Total Investments', value: stats.totalInvestments },
              { label: 'Total Invested', value: `R${Number(stats.totalInvested || 0).toFixed(2)}` },
              { label: 'Total Earned', value: `R${Number(stats.totalEarned || 0).toFixed(2)}` },
              { label: 'Total Commissions', value: `R${Number(stats.totalCommissions || 0).toFixed(2)}` },
              { label: 'Pending Investments', value: stats.pendingInvestments },
              { label: 'Active Investments', value: stats.activeInvestments },
              { label: 'Pending Withdrawals', value: stats.totalWithdrawals },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl shadow p-5">
                <p className="text-sm text-gray-500 mb-1">{s.label}</p>
                <p className="text-2xl font-bold text-gray-800">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* The remainder of the admin UI (investments / withdrawals / raffle / users) remains unchanged */}
        {/* Investments tab */}
        {activeTab === 'investments' && (
          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Package</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Proof</th>
                  <th className="px-4 py-3 text-left">Created</th>
                  <th className="px-4 py-3 text-left">Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {investments.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{inv.packageName}</td>
                    <td className="px-4 py-3">R{inv.amountRand}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        inv.status === 'active' ? 'bg-green-100 text-green-700' :
                        inv.status === 'matured' ? 'bg-blue-100 text-blue-700' :
                        inv.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{inv.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      {inv.proofOfPayment ? (
                        <button
                          type="button"
                          onClick={() => {
                            const url = proofUrl(inv.proofOfPayment);
                            if (!url) {
                              alert('Proof file not available');
                              return;
                            }
                            window.open(url, '_blank', 'noopener');
                          }}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          View
                        </button>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(inv.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <select
                        value={inv.status}
                        onChange={(e) => updateInvestment(inv.id, e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        <option value="pending">pending</option>
                        <option value="active">active</option>
                        <option value="matured">matured</option>
                        <option value="rejected">rejected</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {investments.length === 0 && <p className="text-center text-gray-400 py-8">No investments.</p>}
          </div>
        )}

        {/* Withdrawals tab */}
        {activeTab === 'withdrawals' && (
          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Bank</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {withdrawals.map((wd) => (
                  <tr key={wd.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">R{wd.amountRand}</td>
                    <td className="px-4 py-3 text-gray-500">{wd.bankName} · {wd.accountNumber}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        wd.status === 'paid' ? 'bg-green-100 text-green-700' :
                        wd.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                        wd.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{wd.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(wd.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <select
                        value={wd.status}
                        onChange={(e) => updateWithdrawal(wd.id, e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        <option value="pending">pending</option>
                        <option value="approved">approved</option>
                        <option value="paid">paid</option>
                        <option value="rejected">rejected</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {withdrawals.length === 0 && <p className="text-center text-gray-400 py-8">No withdrawals.</p>}
          </div>
        )}

        {/* Raffle tab */}
        {activeTab === 'raffle' && (
          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Ticket ID</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Proof</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {raffleTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{String(t.id).slice(0, 12)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        t.status === 'active' ? 'bg-green-100 text-green-700' :
                        t.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{t.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      {t.proofOfPayment ? (
                        <button
                          type="button"
                          onClick={() => {
                            const url = proofUrl(t.proofOfPayment);
                            if (!url) { alert('Proof file not available'); return; }
                            window.open(url, '_blank', 'noopener');
                          }}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          View
                        </button>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <select
                        value={t.status}
                        onChange={(e) => updateRaffle(t.id, e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        <option value="pending">pending</option>
                        <option value="active">active</option>
                        <option value="rejected">rejected</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {raffleTickets.length === 0 && <p className="text-center text-gray-400 py-8">No raffle tickets.</p>}
          </div>
        )}

        {/* Users tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Referral Code</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                      }`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{u.profile?.referralCode ?? '—'}</td>
                    <td className="px-4 py-3">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => promoteUser(u.id)}
                          className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1 rounded hover:bg-purple-100 transition"
                        >
                          Promote to Admin
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && <p className="text-center text-gray-400 py-8">No users.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
