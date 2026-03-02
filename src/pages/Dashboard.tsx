import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api, type Investment, type RaffleTicket, type Withdrawal } from '../lib/api';

const Dashboard: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  const [investments, setInvestments] = useState<Investment[]>([]);
  const [tickets, setTickets] = useState<RaffleTicket[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState('');

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
        setInvestments(inv);
        setTickets(tix);
        setWithdrawals(wd);
      })
      .catch((err: unknown) => {
        setDataError(err instanceof Error ? err.message : 'Failed to load data');
      })
      .finally(() => setDataLoading(false));
  }, [user]);

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (!user) return null;

  if (dataError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-500">{dataError}</p>
      </div>
    );
  }

  const totalInvested = investments.reduce((s, i) => s + i.amountRand, 0);
  const totalEarned = investments.reduce((s, i) => s + i.totalEarned, 0);
  const activeCount = investments.filter((i) => i.status === 'active').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-xl font-bold text-green-700">🐰 Rabbit Returns</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <button
              onClick={logout}
              className="text-sm text-red-500 hover:text-red-700 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">My Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-5 text-center">
            <p className="text-xs text-gray-500 uppercase mb-1">Total Invested</p>
            <p className="text-2xl font-bold text-green-600">R{totalInvested.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-5 text-center">
            <p className="text-xs text-gray-500 uppercase mb-1">Total Earned</p>
            <p className="text-2xl font-bold text-green-600">R{totalEarned.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-5 text-center">
            <p className="text-xs text-gray-500 uppercase mb-1">Active Investments</p>
            <p className="text-2xl font-bold text-gray-800">{activeCount}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-5 text-center">
            <p className="text-xs text-gray-500 uppercase mb-1">Raffle Tickets</p>
            <p className="text-2xl font-bold text-gray-800">{tickets.length}</p>
          </div>
        </div>

        {/* Referral code */}
        {user.profile?.referralCode && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8">
            <p className="text-sm text-gray-600">
              Your referral code:{' '}
              <span className="font-bold text-green-700">{user.profile.referralCode}</span>
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => navigate('/invest')}
            className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 font-medium transition"
          >
            New Investment
          </button>
          <button
            onClick={() => navigate('/raffle')}
            className="bg-purple-600 text-white px-5 py-2 rounded-lg hover:bg-purple-700 font-medium transition"
          >
            Buy Raffle Ticket
          </button>
        </div>

        {/* Investments table */}
        <div className="bg-white rounded-xl shadow overflow-hidden mb-8">
          <div className="px-5 py-4 border-b">
            <h2 className="font-semibold text-gray-800">My Investments</h2>
          </div>
          {investments.length === 0 ? (
            <p className="p-5 text-gray-500 text-sm">No investments yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
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
                      <td className="px-4 py-3">{inv.startedAt ? new Date(inv.startedAt).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3">{inv.maturesAt ? new Date(inv.maturesAt).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3">R{inv.totalEarned.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Withdrawals */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="font-semibold text-gray-800">Withdrawal History</h2>
          </div>
          {withdrawals.length === 0 ? (
            <p className="p-5 text-gray-500 text-sm">No withdrawals yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Amount</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {withdrawals.map((wd) => (
                    <tr key={wd.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">R{wd.amountRand.toLocaleString()}</td>
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
                      <td className="px-4 py-3">{new Date(wd.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
