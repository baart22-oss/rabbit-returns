import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api, authHeaders } from '../lib/client';
import { buildUrl } from '../lib/api-utils';
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

  // Basic UI state for copying EFT
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;

    setFetching(true);

    (async () => {
      try {
        // Use allSettled so failed balance endpoint won't block other data
        const results = await Promise.allSettled([
          api.investments.list(),
          api.withdrawals.list(),
          api.raffle.tickets(),
          api.banking.balance(),
        ]);

        const inv = results[0].status === 'fulfilled' ? results[0].value : [];
        const wd = results[1].status === 'fulfilled' ? results[1].value : [];
        const tk = results[2].status === 'fulfilled' ? results[2].value : [];
        const balRes = results[3];

        setInvestments(Array.isArray(inv) ? inv : []);
        setWithdrawals(Array.isArray(wd) ? wd : []);
        setTickets(Array.isArray(tk) ? tk : []);

        if (balRes && balRes.status === 'fulfilled' && balRes.value) {
          setBalance(balRes.value);
        } else {
          // Fallback: compute investmentsSum from investments.totalEarned
          const investmentsSum = (Array.isArray(inv) ? inv : []).reduce((acc, i) => acc + (Number(i.totalEarned) || 0), 0);

          // Try to fetch referral summary (optional fallback). If it fails, commissionsSum stays 0.
          let commissionsSum = 0;
          try {
            const r = await fetch(buildUrl('/referrals'), { headers: authHeaders() });
            if (r.ok) {
              const json = await r.json();
              commissionsSum = Number(json?.total) || 0;
            }
          } catch (err) {
            // ignore, leave commissionsSum = 0
            console.warn('Referral summary fallback failed', err);
          }

          setBalance({
            investmentsSum,
            commissionsSum,
            totalBalance: investmentsSum + commissionsSum,
          });
        }
      } catch (err) {
        console.error('Dashboard aggregated fetch error', err);
        setInvestments([]);
        setWithdrawals([]);
        setTickets([]);
        setBalance({ investmentsSum: 0, commissionsSum: 0, totalBalance: 0 });
      } finally {
        setFetching(false);
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setBankLoading(true);
    api.banking.get()
      .then(b => setBanking(b || null))
      .catch(err => {
        // 404: no saved banking for this user — that's expected sometimes
        console.info('No saved banking or failed to load', err);
        setBanking(null);
      })
      .finally(() => setBankLoading(false));
  }, [user]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus(null), 2000);
    } catch {
      setCopyStatus('Copy failed');
      setTimeout(() => setCopyStatus(null), 2000);
    }
  };

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
          {/* Balance card */}
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

          {/* Payment details / platform EFT (PLATFORM_EFT imported from frontend file only) */}
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

            <h4 className="text-sm font-semibold text-gray-700 mb-2">Platform EFT (frontend copy)</h4>
            <div>
              <p className="text-sm"><strong>Beneficiary:</strong> {PLATFORM_EFT.beneficiaryName}</p>
              <p className="text-sm"><strong>Bank:</strong> {PLATFORM_EFT.bank}</p>
              <div className="flex items-center gap-3">
                <p className="text-sm"><strong>Account no:</strong> {PLATFORM_EFT.accountNumber}</p>
                <button
                  onClick={() => handleCopy(PLATFORM_EFT.accountNumber)}
                  className="text-xs bg-gray-100 px-2 py-1 rounded"
                >
                  Copy
                </button>
              </div>
              <p className="text-sm"><strong>Branch code:</strong> {PLATFORM_EFT.branchCode}</p>
              {PLATFORM_EFT.reference && <p className="text-sm"><strong>Reference:</strong> {PLATFORM_EFT.reference}</p>}
              {copyStatus && <p className="text-xs text-gray-500 mt-2">{copyStatus}</p>}
              <p className="text-xs text-gray-500 mt-2">NOTE: Platform EFT values are read from a frontend file (src/lib/eft.ts) — not fetched from Render.</p>
            </div>
          </div>

          {/* Investments summary */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-bold text-green-600 mb-2">My Investments</h3>
            {investments.length === 0 ? <p className="text-gray-400">No investments yet.</p> : (
              <ul className="space-y-2">
                {investments.map(inv => (
                  <li key={inv.id} className="border-b border-gray-100 pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{inv.packageName}</div>
                        <div className="text-xs text-gray-500">Started: {inv.startedAt ? new Date(inv.startedAt).toLocaleDateString() : '—'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-700 font-bold">R{inv.amountRand}</div>
                        <div className="text-xs text-gray-500">Earned: R{(inv.totalEarned ?? 0).toFixed(2)}</div>
                        <div className="text-xs mt-1">{inv.status}</div>
                      </div>
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
