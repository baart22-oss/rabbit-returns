import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/client';
import { useAuth } from '../lib/auth';

/**
 * WithdrawPage
 * - Fetches user's saved banking details and displays them
 * - Allows user to use saved banking details or enter new details
 * - Submits withdrawal request to api.withdrawals.submit
 */
export default function WithdrawPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Saved banking (from server)
  const [savedBanking, setSavedBanking] = useState<any | null>(null);
  const [loadingBank, setLoadingBank] = useState(true);
  const [useSaved, setUseSaved] = useState(true);

  // Form fields (used when not using saved banking or to confirm)
  const [amountRand, setAmountRand] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [accountType, setAccountType] = useState('CHEQUE');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    async function loadBank() {
      setLoadingBank(true);
      try {
        const b = await api.banking.get();
        if (b) {
          setSavedBanking(b);
          // Prefill the editable fields so user can adjust if needed
          setAccountHolder(b.accountHolder || '');
          setBankName(b.bankName || '');
          setAccountNumber(b.accountNumber || '');
          setBranchCode(b.branchCode || '');
          setAccountType(b.accountType || 'CHEQUE');
          setUseSaved(true);
        } else {
          setSavedBanking(null);
          setUseSaved(false);
        }
      } catch (err) {
        // 404 means no saved banking; allow user to fill form
        console.info('No saved banking or failed to load', err);
        setSavedBanking(null);
        setUseSaved(false);
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
      const amount = Number(amountRand);
      if (!amountRand || Number.isNaN(amount) || amount <= 0) {
        throw new Error('Enter a valid withdrawal amount');
      }

      // Decide which bank details to use
      const payloadBank = useSaved && savedBanking
        ? {
            bankName: savedBanking.bankName,
            accountHolder: savedBanking.accountHolder,
            accountNumber: savedBanking.accountNumber,
            branchCode: savedBanking.branchCode,
            accountType: savedBanking.accountType ?? 'CHEQUE',
          }
        : {
            bankName,
            accountHolder,
            accountNumber,
            branchCode,
            accountType,
          };

      // Basic validation of bank fields for EFT
      if (!payloadBank.bankName || !payloadBank.accountHolder || !payloadBank.accountNumber || !payloadBank.branchCode) {
        throw new Error('Please provide complete banking details (bank, account holder, account number, branch code)');
      }

      const payload = {
        amountRand: amount,
        bankName: payloadBank.bankName,
        accountHolder: payloadBank.accountHolder,
        accountNumber: payloadBank.accountNumber,
        branchCode: payloadBank.branchCode,
        accountType: payloadBank.accountType,
      };

      await api.withdrawals.submit(payload);

      setSuccessMsg('Withdrawal request submitted.');
      // Optionally clear form
      setAmountRand('');
      // redirect back to dashboard after short delay
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

        {/* Saved banking display */}
        {savedBanking ? (
          <div className="bg-white border rounded p-4 mb-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">Saved banking details</h3>
                <p className="text-sm text-gray-600">These details will be used if you choose "Use saved details".</p>

                <div className="mt-3 text-sm text-gray-700">
                  <div><strong>Account holder:</strong> {savedBanking.accountHolder}</div>
                  <div><strong>Bank:</strong> {savedBanking.bankName}</div>
                  <div><strong>Account no:</strong> {savedBanking.accountNumber}</div>
                  <div><strong>Branch code:</strong> {savedBanking.branchCode}</div>
                  <div><strong>Account type:</strong> {savedBanking.accountType}</div>
                </div>
              </div>

              <div className="ml-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={useSaved}
                    onChange={(e) => setUseSaved(e.target.checked)}
                    className="form-checkbox h-4 w-4"
                  />
                  Use saved details
                </label>
                <div className="mt-3">
                  <Link to="/banking" className="text-xs text-green-700 hover:underline">Edit saved banking</Link>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <form className="bg-white rounded p-6" onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Amount (ZAR)</label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={amountRand}
              onChange={(e) => setAmountRand(e.target.value)}
              className="mt-1 block w-full border rounded px-3 py-2"
              placeholder="Enter amount in ZAR"
              required
            />
          </div>

          {/* If user is not using saved details, show editable bank fields */}
          {!useSaved && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Account holder</label>
                  <input value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} className="mt-1 block w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bank name</label>
                  <input value={bankName} onChange={(e) => setBankName(e.target.value)} className="mt-1 block w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Account number</label>
                  <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="mt-1 block w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Branch code</label>
                  <input value={branchCode} onChange={(e) => setBranchCode(e.target.value)} className="mt-1 block w-full border rounded px-3 py-2" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Account type</label>
                  <select value={accountType} onChange={(e) => setAccountType(e.target.value)} className="mt-1 block w-48 border rounded px-3 py-2">
                    <option value="CHEQUE">CHEQUE</option>
                    <option value="SAVINGS">SAVINGS</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="mt-6 flex items-center gap-3">
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-60">
              {submitting ? 'Submitting…' : 'Submit withdrawal'}
            </button>
            <Link to="/dashboard" className="text-sm text-gray-600">Cancel</Link>
          </div>
        </form>
      </main>
    </div>
  );
}
