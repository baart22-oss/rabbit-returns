import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api } from '../lib/client';

const Dashboard = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [investments, setInvestments] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [balance, setBalance] = useState<{ investmentsSum: number; commissionsSum: number; totalBalance: number } | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    setFetching(true);
    Promise.all([
      api.investments.list(),
      api.withdrawals.list(),
      api.raffle.tickets(),
      api.banking.balance()
    ])
      .then(([inv, wd, tk, bal]) => {
        setInvestments(Array.isArray(inv) ? inv : []);
        setWithdrawals(Array.isArray(wd) ? wd : []);
        setTickets(Array.isArray(tk) ? tk : []);
        setBalance(bal ?? null);
      })
      .catch((err) => {
        console.error('Dashboard fetch error', err);
      })
      .finally(() => setFetching(false));
  }, [user]);

  if (loading || fetching) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading…</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-green-700">🐰 Rabbit Returns</Link>
          {isAdmin && <Link to="/admin" className="text-sm text-green-700 hover:underline">Admin Dashboard</Link>}
          <button onClick={() => navigate('/auth')} className="text-sm text-gray-600 hover:text-green-700 ml-2">Logout</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <p className="text-gray-600 mb-6">Welcome, <span className="font-semibold">{user?.profile?.fullName || user.email}</span></p>

        {/* Manage buttons */}
        <div className="flex gap-3 mb-6">
          <Link to="/banking" className="px-4 py-2 bg-white border rounded shadow text-sm">Manage Payment Details</Link>
          <Link to="/withdraw" className="px-4 py-2 bg-green-600 text-white rounded shadow text-sm">Request Withdrawal</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-bold text-green-600 mb-2">My Balance</h3>
            {balance ? (
              <>
                <div className="text-sm text-gray-600 mb-2">Investment earnings: <strong>R{balance.investmentsSum.toFixed(2)}</strong></div>
                <div className="text-sm text-gray-600 mb-2">Referral commissions: <strong>R{balance.commissionsSum.toFixed(2)}</strong></div>
                <div className="text-xl font-bold text-gray-800 mt-2">Available: R{balance.totalBalance.toFixed(2)}</div>
              </>
            ) : (
              <div className="text-sm text-gray-500">Balance unavailable</div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-bold text-green-600 mb-2">My Investments</h3>
            {investments.length === 0 ? <p className="text-gray-400">No investments yet.</p> : (
              <ul className="space-y-2">
                {investments.map(inv => (
                  <li key={inv.id} className="border-b border-gray-100 pb-2">
                    <div className="flex items-center justify-between">
                      <span>{inv.packageName}</span>
                      <span className="text-green-700 font-bold">R{inv.amountRand}</span>
                      <span className="text-xs">{inv.status}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-bold text-green-600 mb-2">Withdrawals</h3>
            {withdrawals.length === 0 ? <p className="text-gray-400">No withdrawals yet.</p> : (
              <ul className="space-y-2">
                {withdrawals.map(w => (
                  <li key={w.id} className="border-b border-gray-100 pb-2">
                    <div className="flex items-center justify-between">
                      <span>R{w.amountRand}</span>
                      <span className="text-xs">{w.status}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <section>
          <h2 className="text-2xl font-bold mb-3">Raffle tickets</h2>
          {tickets.length === 0 ? <p className="text-gray-400">No tickets yet.</p> : (
            <ul className="space-y-2">
              {tickets.map(t => <li key={t.id}>{t.id} • {t.status}</li>)}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
