import React, { useEffect, useState } from 'react';

type BalanceResp = {
  investmentsSum: number;
  commissionsSum: number;
  totalBalance: number;
};

export default function BalanceWidget() {
  const [balance, setBalance] = useState<BalanceResp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBalance() {
      setLoading(true);
      try {
        const res = await fetch('/api/banking/balance', {
          credentials: 'include', // if using cookies; or add Authorization header
          headers: { 'Content-Type': 'application/json' }
        });
        if (!res.ok) throw new Error('Failed to load');
        const data: BalanceResp = await res.json();
        setBalance(data);
      } catch (err) {
        console.error('Balance fetch error', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBalance();
  }, []);

  if (loading) return <div>Loading balance...</div>;
  if (!balance) return <div>Balance unavailable</div>;

  return (
    <div className="balance-widget">
      <h3>Your balance</h3>
      <div className="balance-values">
        <div>Investment earnings: R{balance.investmentsSum.toFixed(2)}</div>
        <div>Referral commissions: R{balance.commissionsSum.toFixed(2)}</div>
        <div className="total">Total: R{balance.totalBalance.toFixed(2)}</div>
      </div>
    </div>
  );
}
