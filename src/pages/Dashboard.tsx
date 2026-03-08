import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api } from '../lib/client';
import { PLATFORM_EFT } from '../lib/eft';

const Dashboard = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [investments, setInvestments] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [balance, setBalance] = useState<{ investmentsSum: number; commissionsSum: number; totalBalance: number } | null>(null);
  const [banking, setBanking] = useState<any | null>(null);
  const [bankLoading, setBankLoading] = useState(true);

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

  useEffect(() => {
    if (!user) return;
    setBankLoading(true);
    api.banking.get()
      .then(b => setBanking(b || null))
      .catch(err => {
        // 404 means user has no saved banking — that's OK
        console.info('No saved banking or failed to load', err);
        setBanking(null);
      })
      .finally(() => setBankLoading(false));
  }, [user]);

  if (loading || fetching || bankLoading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading…</div>;
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

        <div className="flex gap-3 mb-6">
          <Link to="/banking" className="px-4 py-2 bg-white border rounded shadow text-sm">Manage Payment Details</Link>
          <Link to="/withdraw" className="px-4 py-2 bg-green-600 text-white rounded shadow text-sm">Request Withdrawal</Link>
          <Link to="/referrals" className="px-4 py-2 bg-white border rounded shadow text-sm">Referral earnings</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Payment details card */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-bold text-green-600 mb-2">Payment details</h3>

            {banking ? (
              <>
                <p className="text-sm"><strong>Account holder:</strong> {banking.accountHolder}</p>
                <p className="text-sm"><strong>Bank:</strong> {banking.bankName}</p>
                <p className="text-sm"><strong>Account no:</strong> {banking.accountNumber}</p>
                <p className="text-sm"><strong>Branch code:</strong> {banking.branchCode}</p>
                <p className="text-sm"><strong>Account type:</strong> {banking.accountType}</p>
                <div className="mt-3">
                  <Link to="/banking" className="text-sm text-green-700 hover:underline">Edit payment details</Link>
                </div>
                <hr className="my-3" />
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500">You don’t have payment details saved. Add them so you can receive withdrawals.</p>
                <div className="mt-3">
                  <Link to="/banking" className="text-sm text-green-700 hover:underline">Add payment details</Link>
                </div>
                <hr className="my-3" />
              </>
            )}

            <h4 className="text-sm font-semibold text-gray-700 mb-2">Platform EFT (where payments should be sent)</h4>
            <div>
              <p className="text-sm"><strong>Beneficiary:</strong> {PLATFORM_EFT.beneficiaryName}</p>
              <p className="text-sm"><strong>Bank:</strong> {PLATFORM_EFT.bank}</p>
              <p className="text-sm"><strong>Account no:</strong> {PLATFORM_EFT.accountNumber}</p>
              <p className="text-sm"><strong>Branch code:</strong> {PLATFORM_EFT.branchCode}</p>
              {PLATFORM_EFT.reference && <p className="text-sm"><strong>Reference:</strong> {PLATFORM_EFT.reference}</p>}
              <p className="text-xs text-gray-500 mt-2">Use the platform reference so admins can match your payment to your investment.</p>
            </div>
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
