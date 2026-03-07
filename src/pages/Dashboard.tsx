import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api } from '../lib/client';

const Dashboard = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [investments, setInvestments] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [fetching, setFetching] = useState(true);

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
    ])
      .then(([inv, wd, tk]) => {
        setInvestments(Array.isArray(inv) ? inv : []);
        setWithdrawals(Array.isArray(wd) ? wd : []);
        setTickets(Array.isArray(tk) ? tk : []);
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [user]);

  if (loading || fetching) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading…</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-green-700">🐰 Rabbit Returns</Link>
          {isAdmin && (
            <Link to="/admin" className="text-sm text-green-700 hover:underline">Admin Dashboard</Link>
          )}
          <button onClick={() => navigate('/auth')} className="text-sm text-gray-600 hover:text-green-700 ml-2">Logout</button>
        </div>
      </nav>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <p className="text-gray-600 mb-6">Welcome, <span className="font-semibold">{user?.profile?.fullName || user.email}</span></p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-bold text-green-600 mb-2">My Investments</h3>
            {investments.length === 0 ? (
              <p className="text-gray-400">No investments yet.</p>
            ) : (
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
            <button onClick={() => navigate('/invest')} className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition w-full">Invest Again</button>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-bold text-green-600 mb-2">My Withdrawals</h3>
            {withdrawals.length === 0 ? (
              <p className="text-gray-400">No withdrawals yet.</p>
            ) : (
              <ul className="space-y-2">
                {withdrawals.map(wd => (
                  <li key={wd.id} className="border-b border-gray-100 pb-2">
                    <div className="flex items-center justify-between">
                      <span>R{wd.amountRand}</span>
                      <span>{wd.bankName || ''} {wd.accountNumber || ''}</span>
                      <span className="text-xs">{wd.status}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <button onClick={() => navigate('/withdraw')} className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition w-full">Withdraw</button>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-bold text-green-600 mb-2">Raffle Tickets</h3>
            {tickets.length === 0 ? (
              <p className="text-gray-400">No tickets yet.</p>
            ) : (
              <ul className="space-y-2">
                {tickets.map(tk => (
                  <li key={tk.id} className="border-b border-gray-100 pb-2">
                    <div className="flex items-center justify-between">
                      <span>Ticket #{String(tk.id).slice(0, 8)}</span>
                      <span className="text-xs">{tk.status}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <button onClick={() => navigate('/raffle')} className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition w-full">Buy Raffle Ticket</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
