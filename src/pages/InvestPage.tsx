import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api, type Investment } from '../lib/client';

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
  const [createdInvestment, setCreatedInvestment] = useState<Investment | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  const handleSelectPackage = (pkg: { name: string; amount: number }) => {
    setSelected(pkg);
    setCreatedInvestment(null);
    setSuccess(false);
    setError('');
    setReference('');
    setFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setError('');
    setSubmitting(true);
    try {
      const inv = await api.investments.create({
        packageName: selected.name,
        amountRand: selected.amount,
        paymentReference: reference || undefined,
      });
      setCreatedInvestment(inv);
      if (file) {
        await api.investments.uploadProof(inv.id, file, reference || undefined);
      }
      setSuccess(true);
      setSelected(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading…</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-green-700">🐰 Rabbit Returns</Link>
          <Link to="/dashboard" className="text-sm text-green-700 hover:underline">Dashboard</Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Investment Packages</h1>
        <p className="text-gray-500 mb-8">Select a package to invest in. 2% daily returns over 180 days.</p>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl">
            ✅ Investment submitted successfully! We'll review your proof of payment shortly.
          </div>
        )}

        {/* EFT Payment Details */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 text-sm text-blue-800">
          <p className="font-semibold mb-1">EFT Payment Details</p>
          <p><span className="font-medium">Beneficiary:</span> ERoos</p>
          <p><span className="font-medium">Bank:</span> ABSA</p>
          <p><span className="font-medium">Branch Code:</span> 632005</p>
          <p><span className="font-medium">Reference:</span> Your email address</p>
        </div>

        {/* Package Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {packages.map((pkg) => (
            <div
              key={pkg.name}
              className={`bg-white rounded-2xl shadow-md p-6 flex flex-col items-center border-2 cursor-pointer transition hover:shadow-lg ${
                selected?.name === pkg.name ? 'border-green-500' : 'border-green-100'
              }`}
              onClick={() => handleSelectPackage(pkg)}
            >
              <h3 className="text-xl font-bold text-green-700 mb-1">{pkg.name}</h3>
              <p className="text-3xl font-extrabold text-gray-800 mb-1">R{pkg.amount.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mb-1">2% daily · 180 days</p>
              <p className="text-green-600 font-semibold mb-4">
                Return: R{(pkg.amount * 0.02 * 180).toLocaleString()}
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); handleSelectPackage(pkg); }}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition w-full"
              >
                Invest Now
              </button>
            </div>
          ))}
        </div>

        {/* Investment Form */}
        {selected && (
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg mx-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-1">Confirm Investment</h2>
            <p className="text-gray-500 mb-4">
              Package: <span className="font-semibold text-green-700">{selected.name}</span> — R{selected.amount.toLocaleString()}
            </p>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Reference (optional)</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReference(e.target.value)}
                  placeholder="Your email or reference"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proof of Payment</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-60"
                >
                  {submitting ? 'Submitting…' : 'Submit Investment'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestPage;
