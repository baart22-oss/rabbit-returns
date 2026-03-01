import React from 'react';
import './InvestmentCard.css';

const InvestmentCard = ({ packageDetails }) => {
    return (
        <div className='investment-card'>
            <h2>{packageDetails.title}</h2>
            <p>{packageDetails.description}</p>
            <p><strong>Price:</strong> ${packageDetails.price}</p>
            <p><strong>Returns:</strong> {packageDetails.annualReturns}%</p>
        </div>
    );
};

export default InvestmentCard;