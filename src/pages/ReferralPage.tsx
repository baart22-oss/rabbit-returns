import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { buildUrl } from '../lib/api-utils';
import { authHeaders } from '../lib/client';

type Commission = {
  id: string;
  level: number;
  amountRand: number;
  createdAt: string;
  investmentId: string;
};

export default function ReferralPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<{ total: number; byLevel: Record<string, any>; list: Commission[] } | null>(null);
  const [loadingRef, setLoadingRef] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    async function load() {
      setLoadingRef(true);
      try {
        const res = await fetch(buildUrl('/referrals'), { headers: authHeaders() });
        if (!res.ok) throw new Error('Failed to load referrals');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Referral load failed', err);
        setData(null);
      } finally {
        setLoadingRef(false);
      }
    }
    if (user) load();
  }, [user]);

  if (loading || loadingRef) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading…</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-green-700">🐰 Rabbit Returns</Link>
          <Link to="/dashboard" className="text-sm text-green-700 hover:underline">Dashboard</Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Referral earnings</h1>

        {!data ? (
          <div className="p-4 bg-white rounded shadow">No referral data available.</div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-semibold">Total commissions</h3>
              <div className="text-2xl font-bold">R{data.total.toFixed(2)}</div>
            </div>

            <div className="bg-white p-4 rounded shadow">
              <h4 className="font-semibold mb-2">By level</h4>
              <ul>
                {Object.entries(data.byLevel).map(([lvl, info]) => (
                  <li key={lvl} className="flex justify-between py-1 border-b">
                    <span>Level {lvl}</span>
                    <span>R{info.total.toFixed(2)} ({info.count})</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-4 rounded shadow">
              <h4 className="font-semibold mb-2">Recent commissions</h4>
              <ul className="space-y-2">
                {data.list.slice(0, 20).map(c => (
                  <li key={c.id} className="flex justify-between">
                    <span>Level {c.level} • Inv {String(c.investmentId).slice(0, 8)}</span>
                    <span>R{c.amountRand.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
