import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api, type RaffleTicket, type RaffleStatus } from '../lib/api';

const RafflePage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState<RaffleStatus | null>(null);
  const [tickets, setTickets] = useState<RaffleTicket[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState('');

  const [reference, setReference] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [pendingTicketId, setPendingTicketId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  const loadData = useCallback(() => {
    if (!user) return;
    Promise.all([api.raffle.status(), api.raffle.tickets()])
      .then(([s, t]) => { setStatus(s); setTickets(t); })
      .catch((err: unknown) => {
        setDataError(err instanceof Error ? err.message : 'Failed to load raffle data');
      })
      .finally(() => setDataLoading(false));
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleBuyTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const ticket = await api.raffle.create(reference || undefined);
      setPendingTicketId(ticket.id);
      setReference('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingTicketId || !file) return;
    setError('');
    setSubmitting(true);
    try {
      await api.raffle.uploadProof(pendingTicketId, file);
      setSuccess('Ticket submitted! Awaiting approval.');
      setPendingTicketId(null);
      setFile(null);
      loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-500">{dataError}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
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

      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Raffle</h1>

        {/* Status */}
        {status && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 mb-8">
            <p className="text-purple-800 font-semibold mb-1">Raffle Status</p>
            <p className="text-sm text-purple-700">
              Tickets sold: <strong>{status.sold}</strong> / {status.max}
            </p>
            <p className="text-sm text-purple-700">
              Price per ticket: <strong>R{status.price}</strong>
            </p>
            <div className="mt-3 h-2 bg-purple-200 rounded-full overflow-hidden">
              <div
                className="h-2 bg-purple-500 rounded-full"
                style={{ width: `${Math.min((status.sold / status.max) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* EFT details */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-8">
          <h2 className="font-semibold text-blue-800 mb-2">EFT Payment Details</h2>
          <div className="text-sm text-blue-700 space-y-1">
            <p><span className="font-medium">Beneficiary:</span> ERoos</p>
            <p><span className="font-medium">Bank:</span> ABSA</p>
            <p><span className="font-medium">Branch Code:</span> 632005</p>
            <p><span className="font-medium">Reference:</span> Your email address</p>
          </div>
        </div>

        {/* Buy ticket form */}
        {!pendingTicketId && !success && (
          <div className="bg-white rounded-2xl shadow p-6 mb-8">
            <h2 className="font-semibold text-gray-800 mb-4">Buy a Raffle Ticket — R{status?.price ?? 50}</h2>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleBuyTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Reference (optional)
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReference(e.target.value)}
                  placeholder="Your email or bank reference"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-60"
              >
                {submitting ? 'Processing…' : 'Buy Ticket'}
              </button>
            </form>
          </div>
        )}

        {/* Proof of payment upload */}
        {pendingTicketId && (
          <div className="bg-white rounded-2xl shadow p-6 mb-8">
            <h2 className="font-semibold text-gray-800 mb-2">Upload Proof of Payment</h2>
            <p className="text-sm text-gray-500 mb-4">Ticket created. Please upload proof of payment to complete your entry.</p>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleUploadProof} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proof of Payment
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-600"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !file}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-60"
              >
                {submitting ? 'Uploading…' : 'Upload Proof'}
              </button>
            </form>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-8 text-center">
            <p className="text-green-700 font-semibold">🎉 {success}</p>
            <button
              onClick={() => setSuccess('')}
              className="mt-3 text-sm text-green-600 hover:underline"
            >
              Buy another ticket
            </button>
          </div>
        )}

        {/* My tickets */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="font-semibold text-gray-800">My Tickets ({tickets.length})</h2>
          </div>
          {tickets.length === 0 ? (
            <p className="p-5 text-gray-500 text-sm">No tickets yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {tickets.map((t) => (
                <li key={t.id} className="px-5 py-4 flex items-center justify-between">
                  <span className="text-sm text-gray-600">#{t.id.slice(0, 8)}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    t.status === 'active' ? 'bg-green-100 text-green-700' :
                    t.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {t.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default RafflePage;