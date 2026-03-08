import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/client';
import { useAuth } from '../lib/auth';

export default function BankingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [accountHolder, setAccountHolder] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [accountType, setAccountType] = useState('CHEQUE');
  const [loadingBank, setLoadingBank] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    async function load() {
      setLoadingBank(true);
      try {
        const b = await api.banking.get().catch(() => null);
        if (b) {
          setAccountHolder(b.accountHolder ?? '');
          setBankName(b.bankName ?? '');
          setAccountNumber(b.accountNumber ?? '');
          setBranchCode(b.branchCode ?? '');
          setAccountType(b.accountType ?? 'CHEQUE');
        }
      } catch (err) {
        console.error('Failed to load banking', err);
      } finally {
        setLoadingBank(false);
      }
    }
    if (user) load();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const body = { accountHolder, bankName, accountNumber, branchCode, accountType };
      await api.banking.upsert(body);
      setMsg('Banking details saved.');
      setTimeout(() => navigate('/dashboard'), 900);
    } catch (err: any) {
      console.error('Save banking failed', err);
      setMsg(err?.message || 'Failed to save banking details');
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingBank) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
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
        <h1 className="text-2xl font-bold mb-4">Banking / Payment Details</h1>

        {msg && <div className="p-3 mb-4 bg-green-50 text-green-700 rounded">{msg}</div>}

        <form onSubmit={handleSave} className="bg-white p-6 rounded shadow max-w-md">
          <label className="block mb-2">
            <span className="text-sm font-medium">Account holder</span>
            <input value={accountHolder} onChange={e => setAccountHolder(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
          </label>
          <label className="block mb-2">
            <span className="text-sm font-medium">Bank name</span>
            <input value={bankName} onChange={e => setBankName(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
          </label>
          <label className="block mb-2">
            <span className="text-sm font-medium">Account number</span>
            <input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
          </label>
          <label className="block mb-2">
            <span className="text-sm font-medium">Branch code</span>
            <input value={branchCode} onChange={e => setBranchCode(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
          </label>
          <label className="block mb-4">
            <span className="text-sm font-medium">Account type</span>
            <select value={accountType} onChange={e => setAccountType(e.target.value)} className="mt-1 w-full border rounded px-3 py-2">
              <option value="CHEQUE">CHEQUE</option>
              <option value="SAVINGS">SAVINGS</option>
              <option value="TRANSMISSION">TRANSMISSION</option>
            </select>
          </label>

          <button type="submit" disabled={saving} className="w-full bg-green-600 text-white py-2 rounded">
            {saving ? 'Saving…' : 'Save Payment Details'}
          </button>
        </form>
      </main>
    </div>
  );
}
