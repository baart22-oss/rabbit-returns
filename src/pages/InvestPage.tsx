import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api } from '../lib/client';

const packages = [
  { name: 'Starter Bunny',   amount: 200 },
  { name: 'Junior Hopper',   amount: 500 },
  { name: 'Silver Rabbit',   amount: 1000 },
  { name: 'Gold Rabbit',     amount: 2000 },
  { name: 'Platinum Hare',   amount: 5000 },
  { name: 'Diamond Warren',  amount: 10000 },
];

const InvestPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [selectedPackage, setSelectedPackage] = useState(packages[0]);
  const [bankReference, setBankReference] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading…</div>;
  if (!user) return null;

  const handleInvest = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const inv = await api.investments.create({
        packageName: selectedPackage.name,
        amountRand: selectedPackage.amount,
        paymentReference: bankReference || undefined,
      });
      if (file) {
        await api.investments.uploadProof(inv.id, file, bankReference);
      }
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (err) {
      setError(
        err?.message || (typeof err === 'string' ? err : 'Proof submission failed')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-green-700">🐰 Rabbit Returns</Link>
          <Link to="/dashboard" className="text-sm text-green-700 hover:underline">Dashboard</Link>
        </div>
      </nav>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Invest</h1>
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl">
            ✅ Investment submitted! Awaiting admin approval.
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
            {error}
          </div>
        )}
        <form onSubmit={handleInvest} className="bg-white rounded-xl shadow p-6 space-y-4 max-w-md mx-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Package</label>
            <select
              value={selectedPackage.name}
              onChange={e => setSelectedPackage(packages.find(p => p.name === e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              {packages.map(pkg => (
                <option key={pkg.name} value={pkg.name}>
                  {pkg.name} — R{pkg.amount}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Reference (optional)</label>
            <input
              type="text"
              value={bankReference}
              onChange={e => setBankReference(e.target.value)}
              placeholder="Your bank/EFT reference"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proof of Payment (file)</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-600"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-60"
          >
            {submitting ? 'Processing…' : 'Submit Investment'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InvestPage;
