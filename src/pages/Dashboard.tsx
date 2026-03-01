import React from 'react';

const Dashboard: React.FC = () => {
    // Sample data for investments and account details
    const investments = [
        { id: 1, name: 'Stock A', amount: 1000, return: '+10%' },
        { id: 2, name: 'Bond B', amount: 2000, return: '+5%' },
        { id: 3, name: 'Crypto C', amount: 500, return: '-2%' },
    ];

    const accountDetails = {
        username: 'user123',
        email: 'user@example.com',
        balance: 15000,
    };

    return (
        <div>
            <h1>User Dashboard</h1>
            <h2>Account Details</h2>
            <p><strong>Username:</strong> {accountDetails.username}</p>
            <p><strong>Email:</strong> {accountDetails.email}</p>
            <p><strong>Balance:</strong> ${accountDetails.balance}</p>

            <h2>Investments</h2>
            <ul>
                {investments.map(investment => (
                    <li key={investment.id}>
                        {investment.name}: ${investment.amount} - {investment.return}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Dashboard;