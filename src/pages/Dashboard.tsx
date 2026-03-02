import React from 'react';

const Dashboard: React.FC = () => {
    // Dummy data for demonstration
    const userBalance = 10000;
    const userReturns = 2500;
    const investments = [
        { id: 1, name: 'Investment A', amount: 5000 },
        { id: 2, name: 'Investment B', amount: 3000 },
        { id: 3, name: 'Investment C', amount: 2000 }
    ];

    return (
        <div>
            <h1>User Dashboard</h1>
            <h2>Balance: ${userBalance}</h2>
            <h2>Returns: ${userReturns}</h2>
            <h3>Investments</h3>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {investments.map(investment => (
                        <tr key={investment.id}>
                            <td>{investment.id}</td>
                            <td>{investment.name}</td>
                            <td>${investment.amount}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Dashboard;
