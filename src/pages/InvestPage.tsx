import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api, type Investment } from '../lib/api';

const packages = [
  { name: 'Bunny Starter', amount: 200 },
  { name: 'Rabbit Runner', amount: 500 },
  { name: 'Hare Hustler', amount: 1000 },
  { name: 'Warren Winner', amount: 2000 },
  { name: 'Burrow Boss', amount: 5000 },
  { name: 'Colony King', amount: 10000 },
];

const InvestPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [selected, setSelected] = useState<{ name: string; amount: number } | null>(null);
  const [reference, setReference] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setError('');
    setSubmitting(true);
    try {
      const inv: Investment = await api.investments.create({
        packageName: selected.name,
        amountRand: selected.amount,
        paymentReference: reference || undefined,
      });
      if (file) {
        await api.investments.uploadProof(inv.id, file, reference || undefined);
      }
      setSuccess(true);
      setSelected(null);
      setReference('');
      setFile(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="text-xl font-bold text-green-700">
            🐰 Rabbit Returns
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-green-600 hover:underline font-medium"
          >
            ← Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Choose an Investment Package</h1>
        <p className="text-gray-500 mb-8">All packages earn 2% daily for 180 days.</p>

        {/* EFT Payment Details */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-8">
          <h2 className="font-semibold text-blue-800 mb-2">EFT Payment Details</h2>
          <div className="text-sm text-blue-700 space-y-1">
            <p><span className="font-medium">Beneficiary:</span> ERoos</p>
            <p><span className="font-medium">Bank:</span> ABSA</p>
            <p><span className="font-medium">Branch Code:</span> 632005</p>
            <p><span className="font-medium">Reference:</span> Your email address</p>
          </div>
        </div>

        {/* Package cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {packages.map((pkg) => (
            <div
              key={pkg.name}
              className={`bg-white rounded-2xl shadow p-6 flex flex-col items-center text-center cursor-pointer transition border-2 ${
                selected?.name === pkg.name ? 'border-green-500 shadow-lg' : 'border-transparent hover:shadow-md'
              }`}
              onClick={() => { setSelected(pkg); setSuccess(false); setError(''); }}
            >
              <h3 className="text-lg font-bold text-gray-800 mb-1">{pkg.name}</h3>
              <p className="text-3xl font-extrabold text-green-600 mb-1">R{pkg.amount.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mb-1">2% daily for 180 days</p>
              <p className="text-xs text-gray-400 mb-4">
                Total: R{(pkg.amount * 0.02 * 180).toLocaleString()}
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); setSelected(pkg); setSuccess(false); setError(''); }}
                className={`px-6 py-2 rounded-lg font-medium transition ${
                  selected?.name === pkg.name
                    ? 'bg-green-600 text-white'
                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                }`}
              >
                {selected?.name === pkg.name ? 'Selected' : 'Select'}
              </button>
            </div>
          ))}
        </div>

        {/* Investment Form */}
        {selected && !success && (
          <div className="bg-white rounded-2xl shadow p-8 max-w-lg mx-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-1">Confirm Investment</h2>
            <p className="text-gray-500 text-sm mb-6">
              Package: <strong>{selected.name}</strong> — R{selected.amount.toLocaleString()}
            </p>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Reference (optional)
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReference(e.target.value)}
                  placeholder="e.g. your email or bank reference"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proof of Payment
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-600"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-60"
              >
                {submitting ? 'Submitting…' : 'Submit Investment'}
              </button>
            </form>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 max-w-lg mx-auto text-center">
            <p className="text-green-700 font-semibold text-lg mb-2">🎉 Investment submitted!</p>
            <p className="text-gray-600 text-sm mb-4">
              Your investment is pending review. We'll activate it once payment is confirmed.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium transition"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestPage;