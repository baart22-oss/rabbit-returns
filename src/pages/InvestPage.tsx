import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, authHeaders, getToken } from "../lib/client";
import { buildUrl } from "../lib/api-utils";
import { useAuth } from "../lib/auth";

type BankingDetails = {
  accountHolder?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  branchCode?: string | null;
  accountType?: string | null;
  payfastEmail?: string | null;
};

const packages = [
  { name: "Hare Hustler", amount: 1000, img: "/images/rabbit1.jpg" },
  { name: "Warren Winner", amount: 2000, img: "/images/rabbit2.jpg" },
  { name: "Burrow Boss", amount: 5000, img: "/images/rabbit3.jpg" },
  { name: "Colony King", amount: 10000, img: "/images/rabbit4.jpg" },
];

export default function InvestPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [selectedPackage, setSelectedPackage] = useState(packages[0]);
  const [bankReference, setBankReference] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Banking info (per-user) and platform fallback
  const [myBanking, setMyBanking] = useState<BankingDetails | null>(null);
  const [platformBank, setPlatformBank] = useState<BankingDetails | null>(null);
  const [bankingLoading, setBankingLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    async function loadBanking() {
      setBankingLoading(true);
      try {
        // Try per-user banking first
        const res = await fetch(buildUrl("/banking"), {
          headers: authHeaders(),
        });

        if (res.ok) {
          const data = await res.json();
          setMyBanking(data);
          setPlatformBank(null);
        } else if (res.status === 404) {
          // No per-user banking saved, try public platform payment info if available
          try {
            const p = await fetch(buildUrl("/payments/info"));
            if (p.ok) {
              setPlatformBank(await p.json());
            } else {
              setPlatformBank(null);
            }
            setMyBanking(null);
          } catch (err) {
            setPlatformBank(null);
            setMyBanking(null);
          }
        } else {
          // other error
          setMyBanking(null);
          setPlatformBank(null);
        }
      } catch (err) {
        console.error("Failed loading banking details", err);
        setMyBanking(null);
        setPlatformBank(null);
      } finally {
        setBankingLoading(false);
      }
    }

    if (user) loadBanking();
  }, [user]);

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
      console.log("created investment", inv);
      if (!inv || !inv.id) {
        throw new Error("Investment creation failed or returned invalid id");
      }

      if (file) {
        const up = await api.investments.uploadProof(inv.id, file, bankReference);
        console.log("upload result", up);
      }

      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 1200);
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
              onChange={(e) => {
                const found = packages.find(p => p.name === e.target.value);
                if (found) setSelectedPackage(found);
              }}
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

          {/* Banking details display */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Payment details</h4>
            {bankingLoading ? (
              <div className="text-sm text-gray-500">Loading payment details…</div>
            ) : myBanking ? (
              <div className="payment-details mb-4">
                <p className="text-sm"><strong>Account holder:</strong> {myBanking.accountHolder}</p>
                <p className="text-sm"><strong>Bank:</strong> {myBanking.bankName}</p>
                <p className="text-sm"><strong>Account no:</strong> {myBanking.accountNumber}</p>
                <p className="text-sm"><strong>Branch code:</strong> {myBanking.branchCode}</p>
                <p className="text-sm"><strong>Account type:</strong> {myBanking.accountType}</p>
                {myBanking.payfastEmail && <p className="text-sm"><strong>Payfast email:</strong> {myBanking.payfastEmail}</p>}
              </div>
            ) : platformBank ? (
              <div className="payment-details mb-4">
                <p className="text-sm"><strong>Account holder:</strong> {platformBank.accountHolder}</p>
                <p className="text-sm"><strong>Bank:</strong> {platformBank.bankName}</p>
                <p className="text-sm"><strong>Account no:</strong> {platformBank.accountNumber}</p>
                <p className="text-sm"><strong>Branch code:</strong> {platformBank.branchCode}</p>
                <p className="text-sm"><strong>Account type:</strong> {platformBank.accountType}</p>
                {platformBank.payfastEmail && <p className="text-sm"><strong>Payfast email:</strong> {platformBank.payfastEmail}</p>}
                <p className="text-xs text-gray-500 mt-2">These are platform payment instructions from the server (read-only).</p>
              </div>
            ) : (
              <div className="payment-details mb-4">
                <p className="text-sm text-gray-500">No banking details available. You can add your banking details in your profile, or contact support for payment instructions.</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proof of Payment (file)</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="w-full"
            />
          </div>

          <div className="flex justify-between items-center gap-3">
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition w-full disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : `Invest R${selectedPackage.amount}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
