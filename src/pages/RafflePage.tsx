import React, { useState } from 'react';

const RafflePage = () => {
    const [ticketCount, setTicketCount] = useState(1);
    const ticketPrice = 10; // Price per ticket

    const handlePurchase = () => {
        const totalCost = ticketCount * ticketPrice;
        alert(`You have purchased ${ticketCount} tickets for a total of $${totalCost}.`);
    };

    return (
        <div>
            <h1>Raffle Ticket Purchase</h1>
            <label>
                Number of Tickets:
                <input 
                    type="number" 
                    value={ticketCount} 
                    min={1} 
                    onChange={(e) => setTicketCount(Number(e.target.value))} 
                />
            </label>
            <p>Price per ticket: ${ticketPrice}</p>
            <p>Total Cost: ${ticketCount * ticketPrice}</p>
            <button onClick={handlePurchase}>Purchase Tickets</button>
        </div>
    );
};

export default RafflePage;