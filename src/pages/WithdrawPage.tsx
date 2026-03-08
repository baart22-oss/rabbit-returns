import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/client';
import { useAuth } from '../lib/auth';

export default function WithdrawPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [amountRand, setAmountRand] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [accountType, setAccountType] = useState('CHEQUE');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loadingBank, setLoadingBank] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    async function loadBank() {
      setLoadingBank(true);
      try {
        const b = await api.banking.get();
        if (b) {
          setAccountHolder(b.accountHolder || '');
          setBankName(b.bankName || '');
          setAccountNumber(b.accountNumber || '');
          setBranchCode(b.branchCode || '');
          setAccountType(b.accountType || 'CHEQUE');
        }
      } catch (err) {
        // 404 (no saved banking) is okay — user will fill in form
        console.info('No saved banking or failed to load', err);
      } finally {
        setLoadingBank(false);
      }
    }
    if (user) loadBank();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setSubmitting(true);
    try {
      if (!amountRand || Number.isNaN(Number(amountRand)) || Number(amountRand) <= 0) {
        throw new Error('Enter a valid withdrawal amount');
      }
      const payload = {
        amountRand: Number(amountRand),
        bankName,
        accountHolder,
        accountNumber,
        branchCode,
        accountType,
      };
      const res = await api.withdrawals.submit(payload);
      setSuccessMsg('Withdrawal request submitted.');
      // optionally navigate to dashboard
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (err: any) {
      console.error('Withdraw failed', err);
      setError(err?.message || 'Withdrawal submission failed');
    } finally {
      setSubmitting(false);
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
        <h1 className="text-2xl font-bold mb-4">Request Withdrawal</h1>

        {error && <div className="p-3 mb-4 bg-red-50 text-red-700 rounded">{error}</div>}
        {successMsg && <div className="p-3 mb-4 bg-green-50 text-green-700 rounded">{successMsg}</div>}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow max-w-md">
          <label className="block mb-2">
            <span className="text-sm font-medium">Amount (ZAR)</span>
            <input value={amountRand} onChange={e => setAmountRand(e.target.value)} type="number" step="0.01" className="mt-1 w-full border rounded px-3 py-2" />
          </label>

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

          <button type="submit" disabled={submitting} className="w-full bg-green-600 text-white py-2 rounded">
            {submitting ? 'Submitting…' : 'Request Withdrawal'}
          </button>
        </form>
      </main>
    </div>
  );
}
