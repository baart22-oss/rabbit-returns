import React, { useState } from 'react';

const InvestPage = () => {
    const [amount, setAmount] = useState(0);
    const dailyReturnRate = 0.02; // 2% daily
    const days = 180;

    const calculateReturns = () => {
        return amount * dailyReturnRate * days;
    };

    return (
        <div>
            <h1>Investment Package Selection</h1>
            <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="Enter investment amount"
            />
            <h2>Projected Returns over {days} days</h2>
            <p>${calculateReturns().toFixed(2)}</p>
        </div>
    );
};

export default InvestPage;