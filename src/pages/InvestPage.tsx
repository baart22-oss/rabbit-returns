import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api } from '../lib/client';
import { buildUrl } from '../lib/api-utils';
import { PLATFORM_EFT } from '../lib/eft';

export default function InvestPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<any>({ name: '', amount: 0 });
  const [file, setFile] = useState<File | null>(null);
  const [bankReference, setBankReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    async function loadPackages() {
      try {
        const res = await fetch(buildUrl('/packages'));
        if (!res.ok) throw new Error('Failed to load packages');
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setPackages(data);
          setSelectedPackage(data[0]);
        }
      } catch (err) {
        console.warn('Could not load packages from server, using fallback', err);
      }
    }
    loadPackages();
  }, []);

  const handleInvest = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const inv = await api.investments.create({
        packageName: selectedPackage.name,
        amountRand: selectedPackage.amount,
        paymentReference: bankReference || undefined,
      });
      if (!inv || !inv.id) throw new Error("Investment creation failed or returned invalid id");

      if (file) {
        try {
          await api.investments.uploadProof(inv.id, file);
        } catch (uploadErr: any) {
          console.error("Upload failed:", uploadErr);
          setError(`Proof upload failed: ${uploadErr?.message || uploadErr}`);
        }
      }

      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (err: any) {
      console.error("Invest error", err);
      setError(err?.message || "Investment submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading…</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-green-700">🐰 Rabbit Returns</Link>
          <Link to="/dashboard" className="text-sm text-green-700 hover:underline">Dashboard</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Invest</h1>

        <img
          src="/images/6A9CDD49-9193-44DF-943A-4D4A774C2736.png"
          alt="Investment options"
          className="w-full max-w-xl mx-auto mb-6 rounded shadow"
        />

        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <h3 className="font-semibold mb-2">Platform EFT (frontend copy)</h3>
          <p className="text-sm"><strong>Beneficiary:</strong> {PLATFORM_EFT.beneficiaryName}</p>
          <p className="text-sm"><strong>Bank:</strong> {PLATFORM_EFT.bank}</p>
          <p className="text-sm"><strong>Account no:</strong> {PLATFORM_EFT.accountNumber}</p>
          <p className="text-sm"><strong>Branch code:</strong> {PLATFORM_EFT.branchCode}</p>
          <p className="text-sm"><strong>Reference:</strong> {PLATFORM_EFT.reference}</p>
        </div>

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
              value={selectedPackage?.name}
              onChange={(e) => {
                const found = packages.find((p: any) => p.name === e.target.value);
                if (found) setSelectedPackage(found);
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              {packages.map((p: any) => (
                <option key={p.name} value={p.name}>
                  {p.name} — R{p.amount}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bank reference (optional)</label>
            <input value={bankReference} onChange={(e) => setBankReference(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload proof (optional)</label>
            <input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
          </div>

          <div className="flex justify-between items-center">
            <button type="submit" disabled={submitting} className="bg-green-600 text-white px-4 py-2 rounded-lg">
              {submitting ? 'Submitting…' : `Invest R${selectedPackage?.amount}`}
            </button>
            <Link to="/dashboard" className="text-sm text-green-700 hover:underline">Back</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
