import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api, authHeaders } from '../lib/client';
import { buildUrl } from '../lib/api-utils';
import { PLATFORM_EFT } from '../lib/eft';

async function safeFetchJson(url: string, opts: RequestInit = {}) {
  const res = await fetch(url, opts);
  try { return await res.json(); } catch { return {}; }
}

const POLL_INTERVAL_MS = 20_000;

const Dashboard: React.FC = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [investments, setInvestments] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  const [balance, setBalance] = useState<{
    investmentsSum: number;
    commissionsSum: number;
    totalWithdrawnPaid?: number;
    totalBalance: number;
  } | null>(null);

  const [banking, setBanking] = useState<any | null>(null);
  const [bankLoading, setBankLoading] = useState(true);

  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [refCopyStatus, setRefCopyStatus] = useState<string | null>(null);

  const pollingRef = useRef<number | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  const fetchAggregatedData = useCallback(
    async (opts?: { forceBalance?: boolean }) => {
      if (!user) return;
      setFetching(true);
      try {
        const investmentsPromise = api?.investments?.list
          ? api.investments.list()
          : safeFetchJson(buildUrl('/investments'), { headers: authHeaders() });

        const withdrawalsPromise = api?.withdrawals?.list
          ? api.withdrawals.list()
          : safeFetchJson(buildUrl('/withdrawals'), { headers: authHeaders() });

        const ticketsPromise = api?.raffle?.tickets
          ? api.raffle.tickets()
          : safeFetchJson(buildUrl('/raffle/tickets'), { headers: authHeaders() });

        const balancePromise =
          !opts?.forceBalance && api?.banking?.balance
            ? api.banking.balance()
            : safeFetchJson(buildUrl('/banking/balance'), { headers: authHeaders() });

        const [invRes, wdRes, tkRes, balRes] = await Promise.allSettled([
          investmentsPromise,
          withdrawalsPromise,
          ticketsPromise,
          balancePromise,
        ]);

        const inv = invRes.status === 'fulfilled' ? invRes.value : [];
        const wd = wdRes.status === 'fulfilled' ? wdRes.value : [];
        const tk = tkRes.status === 'fulfilled' ? tkRes.value : [];

        setInvestments(Array.isArray(inv) ? inv : []);
        setWithdrawals(Array.isArray(wd) ? wd : []);
        setTickets(Array.isArray(tk) ? tk : []);

        if (balRes && balRes.status === 'fulfilled' && balRes.value && typeof balRes.value === 'object') {
          setBalance({
            investmentsSum: Number(balRes.value.investmentsSum || 0),
            commissionsSum: Number(balRes.value.commissionsSum || 0),
            totalWithdrawnPaid: Number(balRes.value.totalWithdrawnPaid || 0),
            totalBalance: Number(balRes.value.totalBalance || 0),
          });
        } else {
          const investmentsSum = (Array.isArray(inv) ? inv : []).reduce((acc, i) => acc + (Number(i.totalEarned) || 0), 0);

          let commissionsSum = 0;
          try {
            const refs = await safeFetchJson(buildUrl('/referrals'), { headers: authHeaders() });
            commissionsSum = Number(refs?.total) || 0;
          } catch {
            commissionsSum = 0;
          }

          const paidWithdrawalsSum = (Array.isArray(wd) ? wd : []).reduce(
            (acc: number, w: any) => acc + ((w.status === 'paid') ? (Number(w.amountRand) || 0) : 0),
            0
          );

          setBalance({
            investmentsSum,
            commissionsSum,
            totalWithdrawnPaid: paidWithdrawalsSum,
            totalBalance: investmentsSum + commissionsSum - paidWithdrawalsSum,
          });
        }
      } catch (err) {
        console.error('Dashboard aggregated fetch error', err);
        setInvestments([]);
        setWithdrawals([]);
        setTickets([]);
        setBalance({ investmentsSum: 0, commissionsSum: 0, totalWithdrawnPaid: 0, totalBalance: 0 });
      } finally {
        setFetching(false);
      }
    },
    [user]
  );

  useEffect(() => {
    if (!user) return;
    fetchAggregatedData();
  }, [user, fetchAggregatedData]);

  useEffect(() => {
    if (!user) return;
    if (pollingRef.current) window.clearInterval(pollingRef.current);
    pollingRef.current = window.setInterval(() => {
      fetchAggregatedData();
    }, POLL_INTERVAL_MS);
    return () => {
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [user, fetchAggregatedData]);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === 'visible' && user) {
        fetchAggregatedData({ forceBalance: true });
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [user, fetchAggregatedData]);

  useEffect(() => {
    if (!user) return;
    setBankLoading(true);
    const p = api?.banking?.get ? api.banking.get() : safeFetchJson(buildUrl('/banking'), { headers: authHeaders() });
    Promise.resolve(p)
      .then((b) => setBanking(b || null))
      .catch((err) => {
        console.info('No saved banking or failed to load', err);
        setBanking(null);
      })
      .finally(() => setBankLoading(false));
  }, [user]);

  const handleCopy = async (text: string, target: 'eft' | 'ref' = 'eft') => {
    try {
      await navigator.clipboard.writeText(text);
      if (target === 'ref') {
        setRefCopyStatus('Copied!');
        setTimeout(() => setRefCopyStatus(null), 2000);
      } else {
        setCopyStatus('Copied!');
        setTimeout(() => setCopyStatus(null), 2000);
      }
    } catch {
      if (target === 'ref') {
        setRefCopyStatus('Copy failed');
        setTimeout(() => setRefCopyStatus(null), 2000);
      } else {
        setCopyStatus('Copy failed');
        setTimeout(() => setCopyStatus(null), 2000);
      }
    }
  };

  const handleManualRefresh = () => fetchAggregatedData({ forceBalance: true });

  if (loading || fetching || bankLoading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading…</div>;
  if (!user) return null;

  // Referral link
  const referralCode = user?.profile?.referralCode;
  const referralUrl = referralCode
    ? `${window.location.origin}/signup?ref=${encodeURIComponent(referralCode)}`
    : '';

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-green-700">🐰 Rabbit Returns</Link>
          <div className="flex items-center gap-3">
            {isAdmin && <Link to="/admin" className="text-sm text-green-700 hover:underline">Admin Dashboard</Link>}
            <button onClick={() => navigate('/auth')} className="text-sm text-gray-600 hover:text-green-700 ml-2">Logout</button>
            <button onClick={handleManualRefresh} className="ml-3 text-sm text-gray-600 hover:text-gray-800">Refresh</button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <p className="text-gray-600 mb-2">Welcome, <span className="font-semibold">{user?.profile?.fullName || user.email}</span></p>

        {/* Referral Link Row */}
        {referralCode && (
          <div className="p-2 rounded bg-green-50 border border-green-200 flex items-center gap-3 mb-4">
            <span className="text-sm text-green-800 font-semibold">
              Invite friends: 
            </span>
            <input
              value={referralUrl}
              readOnly
              className="px-2 py-1 border rounded bg-white text-xs font-mono w-72"
              style={{ outline: 0 }}
              onFocus={(e) => e.target.select()}
            />
            <button
              className="px-2 py-1 text-xs bg-green-600 text-white rounded"
              onClick={() => handleCopy(referralUrl, "ref")}
            >
              Copy
            </button>
            {refCopyStatus && <span className="ml-2 text-xs text-gray-500">{refCopyStatus}</span>}
          </div>
        )}

        <div className="flex gap-3 mb-6">
          <Link to="/banking" className="px-4 py-2 bg-white border rounded shadow text-sm">Manage Payment Details</Link>
          <Link to="/withdraw" className="px-4 py-2 bg-green-600 text-white rounded shadow text-sm">Request Withdrawal</Link>
          <Link to="/referrals" className="px-4 py-2 bg-white border rounded shadow text-sm">Referral earnings</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-bold text-green-600 mb-2">My Balance</h3>
            {balance ? (
              <>
                <div className="text-sm text-gray-600 mb-2">Investment earnings: <strong>R{balance.investmentsSum.toFixed(2)}</strong></div>
                <div className="text-sm text-gray-600 mb-2">Referral commissions: <strong>R{balance.commissionsSum.toFixed(2)}</strong></div>
                <div className="text-sm text-gray-600 mb-2">Withdrawn (paid): <strong>R{(balance.totalWithdrawnPaid ?? 0).toFixed(2)}</strong></div>
                <div className="text-xl font-bold text-gray-800 mt-2">Available: R{balance.totalBalance.toFixed(2)}</div>
              </>
            ) : (
              <div className="text-sm text-gray-500">Balance unavailable</div>
            )}
          </div>

          {/* (leave rest of payment details and investments unchanged) */}
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
                <button onClick={() => handleCopy(PLATFORM_EFT.accountNumber)} className="text-xs bg-gray-100 px-2 py-1 rounded">Copy</button>
              </div>
              <p className="text-sm"><strong>Branch code:</strong> {PLATFORM_EFT.branchCode}</p>
              {PLATFORM_EFT.reference && <p className="text-sm"><strong>Reference:</strong> {PLATFORM_EFT.reference}</p>}
              {copyStatus && <p className="text-xs text-gray-500 mt-2">{copyStatus}</p>}
              <p className="text-xs text-gray-500 mt-2">NOTE: Platform EFT values are read from a frontend file (src/lib/eft.ts).</p>
            </div>
          </div>

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
