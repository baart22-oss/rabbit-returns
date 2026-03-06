import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api, type Investment, type RaffleTicket, type Withdrawal } from '../lib/client';

const Dashboard: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [tickets, setTickets] = useState<RaffleTicket[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.investments.list(),
      api.raffle.tickets(),
      api.withdrawals.list(),
    ])
      .then(([inv, tix, wd]) => {
        setInvestments(Array.isArray(inv) ? inv : []);
        setTickets(Array.isArray(tix) ? tix : []);
        setWithdrawals(Array.isArray(wd) ? wd : []);
      })
      .catch(() => {
        setInvestments([]);
        setTickets([]);
        setWithdrawals([]);
      })
      .finally(() => setFetching(false));
  }, [user]);

  if (loading || fetching) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading…</div>;
  }

  if (!user) return null;

  const totalInvested = Array.isArray(investments) && investments.length > 0
    ? investments.reduce((s, i) => s + (i.amountRand ?? 0), 0)
    : 0;
  const totalEarned = Array.isArray(investments) && investments.length > 0
    ? investments.reduce((s, i) => s + (i.totalEarned ?? 0), 0)
    : 0;
  const activeCount = Array.isArray(investments)
    ? investments.filter((i) => i.status === 'active').length
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-green-700">🐰 Rabbit Returns</Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <button
              onClick={logout}
              className="text-sm text-red-600 hover:underline"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">My Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-sm text-gray-500 mb-1">Total Invested</p>
            <p className="text-2xl font-bold text-green-700">R{totalInvested.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-sm text-gray-500 mb-1">Total Earned</p>
            <p className="text-2xl font-bold text-green-600">R{totalEarned.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-sm text-gray-500 mb-1">Active Investments</p>
            <p className="text-2xl font-bold text-gray-800">{activeCount}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-sm text-gray-500 mb-1">Raffle Tickets</p>
            <p className="text-2xl font-bold text-gray-800">{Array.isArray(tickets) ? tickets.length : 0}</p>
          </div>
        </div>

        {/* Referral Code */}
        {user.profile?.referralCode && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8 flex items-center gap-4">
            <div>
              <p className="text-sm text-gray-600">Your Referral Code</p>
              <p className="text-lg font-bold text-green-700">{user.profile.referralCode}</p>
            </div>
          </div>
        )}

        {/* Action Buttons: New Investment & Buy Raffle Ticket */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => navigate('/invest')}
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition"
          >
            New Investment
          </button>
          <button
            onClick={() => navigate('/raffle')}
            className="border border-green-600 text-green-700 px-6 py-2 rounded-lg font-medium hover:bg-green-50 transition"
          >
            Buy Raffle Ticket
          </button>
        </div>

        {/* Investments Table */}
        <div className="bg-white rounded-xl shadow overflow-x-auto mb-8">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">My Investments</h2>
          </div>
          {Array.isArray(investments) && investments.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No investments yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Package</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Started</th>
                  <th className="px-4 py-3 text-left">Matures</th>
                  <th className="px-4 py-3 text-left">Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Array.isArray(investments) && investments.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{inv.packageName}</td>
                    <td className="px-4 py-3">R{(inv.amountRand ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        inv.status === 'active' ? 'bg-green-100 text-green-700' :
                        inv.status === 'matured' ? 'bg-blue-100 text-blue-700' :
                        inv.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {inv.startedAt ? new Date(inv.startedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {inv.maturesAt ? new Date(inv.maturesAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-green-600 font-medium">R{(inv.totalEarned ?? 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Withdrawals */}
        {Array.isArray(withdrawals) && withdrawals.length > 0 && (
          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Withdrawal Requests</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {withdrawals.map((wd) => (
                  <tr key={wd.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">R{(wd.amountRand ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        wd.status === 'paid' ? 'bg-green-100 text-green-700' :
                        wd.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                        wd.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {wd.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{wd.createdAt ? new Date(wd.createdAt).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
