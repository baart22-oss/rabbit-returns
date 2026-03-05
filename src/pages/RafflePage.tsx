import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api, type RaffleTicket, type RaffleStatus } from '../lib/client';

const RafflePage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState<RaffleStatus | null>(null);
  const [tickets, setTickets] = useState<RaffleTicket[]>([]);
  const [fetching, setFetching] = useState(true);
  const [reference, setReference] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [pendingTicket, setPendingTicket] = useState<RaffleTicket | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showBuyForm, setShowBuyForm] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    Promise.all([api.raffle.status(), api.raffle.tickets()])
      .then(([s, t]) => { setStatus(s); setTickets(t); })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [user]);

  const handleBuyTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const ticket = await api.raffle.create(reference || undefined);
      setPendingTicket(ticket);
      if (file) {
        await api.raffle.uploadProof(ticket.id, file);
      }
      setTickets((prev) => [ticket, ...prev]);
      setSuccess(true);
      setShowBuyForm(false);
      setReference('');
      setFile(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || fetching) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading…</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-green-700">🐰 Rabbit Returns</Link>
          <Link to="/dashboard" className="text-sm text-green-700 hover:underline">Dashboard</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Raffle</h1>

        {/* Raffle Status */}
        {status && (
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 font-medium">Tickets Sold</p>
              <p className="font-bold text-green-700">{status.sold} / {status.max}</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all"
                style={{ width: `${Math.min(100, (status.sold / status.max) * 100)}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">Ticket price: R{status.price}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl">
            ✅ Ticket purchased! We'll verify your proof of payment shortly.
          </div>
        )}

        {/* Buy Ticket Button */}
        {!showBuyForm ? (
          <button
            onClick={() => { setShowBuyForm(true); setSuccess(false); setError(''); }}
            className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition mb-8"
          >
            Buy a Ticket — R{status?.price ?? 50}
          </button>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 max-w-md">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Buy Raffle Ticket</h2>
            {error && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
            )}
            <form onSubmit={handleBuyTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Reference (optional)</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReference(e.target.value)}
                  placeholder="Your email or EFT reference"
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
                  {submitting ? 'Processing…' : 'Confirm Purchase'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBuyForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* My Tickets */}
        <h2 className="text-xl font-semibold text-gray-800 mb-4">My Tickets</h2>
        {tickets.length === 0 ? (
          <p className="text-gray-400">You have no raffle tickets yet.</p>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => (
              <div key={t.id} className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Ticket #{t.id.slice(0, 8)}</p>
                  <p className="text-sm text-gray-600">{new Date(t.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  t.status === 'active' ? 'bg-green-100 text-green-700' :
                  t.status === 'rejected' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RafflePage;
