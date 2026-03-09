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

const POLL_INTERVAL_MS = 20_000; // 20s

const Dashboard = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [investments, setInvestments] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  const [balance, setBalance] = useState<{ investmentsSum: number; commissionsSum: number; totalWithdrawnPaid?: number; totalBalance: number } | null>(null);
  const [banking, setBanking] = useState<any | null>(null);
  const [bankLoading, setBankLoading] = useState(true);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const pollingRef = useRef<number | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  const fetchAggregatedData = useCallback(async (opts?: { forceBalance?: boolean }) => {
    if (!user) return;
    setFetching(true);
    try {
      const investmentsPromise = api?.investments?.list ? api.investments.list() : safeFetchJson(buildUrl('/investments'), { headers: authHeaders() });
      const withdrawalsPromise = api?.withdrawals?.list ? api.withdrawals.list() : safeFetchJson(buildUrl('/withdrawals'), { headers: authHeaders() });
      const ticketsPromise = api?.raffle?.tickets ? api.raffle.tickets() : safeFetchJson(buildUrl('/raffle/tickets'), { headers: authHeaders() });
      const balancePromise = (!opts?.forceBalance && api?.banking?.balance) ? api.banking.balance() : safeFetchJson(buildUrl('/banking/balance'), { headers: authHeaders() });

      const [invRes, wdRes, tkRes, balRes] = await Promise.allSettled([investmentsPromise, withdrawalsPromise, ticketsPromise, balancePromise]);

      const inv = invRes.status === 'fulfilled' ? invRes.value : [];
      const wd = wdRes.status === 'fulfilled' ? wdRes.value : [];
      const tk = tkRes.status === 'fulfilled' ? tkRes.value : [];

      setInvestments(Array.isArray(inv) ? inv : []);
      setWithdrawals(Array.isArray(wd) ? wd : []);
      setTickets(Array.isArray(tk) ? tk : []);

      if (balRes && balRes.status === 'fulfilled' && balRes.value && typeof balRes.value === 'object') {
        // Backend now returns investmentsSum, commissionsSum, totalWithdrawnPaid, totalBalance
        setBalance({
          investmentsSum: Number(balRes.value.investmentsSum || 0),
          commissionsSum: Number(balRes.value.commissionsSum || 0),
          totalWithdrawnPaid: Number(balRes.value.totalWithdrawnPaid || 0),
          totalBalance: Number(balRes.value.totalBalance || 0),
        });
      } else {
        // fallback: compute from investments, referrals, and withdrawals array
        const investmentsSum = (Array.isArray(inv) ? inv : []).reduce((acc, i) => acc + (Number(i.totalEarned) || 0), 0);

        let commissionsSum = 0;
        try {
          const refs = await safeFetchJson(buildUrl('/referrals'), { headers: authHeaders() });
          commissionsSum = Number(refs?.total) || 0;
        } catch {}

        // Subtract paid withdrawals (items in withdrawals array with status 'paid')
        const paidWithdrawalsSum = (Array.isArray(wd) ? wd : []).reduce((acc: number, w: any) => acc + ((w.status === 'paid') ? (Number(w.amountRand) || 0) : 0), 0);

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
  }, [user]);

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
    (api?.banking?.get ? api.banking.get() : safeFetchJson(buildUrl('/banking'), { headers: authHeaders() }))
      .then(b => setBanking(b || null))
      .catch(err => {
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

  const handleManualRefresh = () => fetchAggregatedData({ forceBalance: true });

  if (loading || fetching || bankLoading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading…</div>;
  if (!user) return null;

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
        <p className="text-gray-600 mb-4">Welcome, <span className="font-semibold">{user?.profile?.fullName || user.email}</span></p>

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

          {/* ... Payment details and investments cards unchanged (kept as before) ... */}
