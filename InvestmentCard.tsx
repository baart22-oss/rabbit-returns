import React, { useState } from 'react';
import PaymentVerificationModal from './PaymentVerificationModal';

interface InvestmentCardProps {
    amount: number;
    onInvestmentComplete: () => void;
}

const InvestmentCard: React.FC<InvestmentCardProps> = ({ amount, onInvestmentComplete }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInvestmentClick = async () => {
        try {
            // Trigger the payment verification modal
            setModalOpen(true);
        } catch (err) {
            // Handle any errors that occur
            setError('An error occurred while initiating the payment.');
        }
    };

    const handleModalClose = (success: boolean) => {
        setModalOpen(false);
        if (success) {
            onInvestmentComplete();
        }
    };

    return (
        <div className="investment-card">
            <h2>Investment Amount: ${amount}</h2>
            {error && <p className="error">{error}</p>}
            <button onClick={handleInvestmentClick}>Invest Now</button>
            {isModalOpen && (
                <PaymentVerificationModal 
                    isOpen={isModalOpen} 
                    onClose={handleModalClose} 
                />
            )}
        </div>
    );
};

export default InvestmentCard;