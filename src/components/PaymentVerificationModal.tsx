import React from 'react';
import './PaymentVerificationModal.css';

const PaymentVerificationModal = ({ isOpen, onClose }) => {
    return (
        <div className={`modal ${isOpen ? 'open' : ''}`}> 
            <div className="modal-content">
                <h2>Payment Verification</h2>
                <p>Please verify your payment details.</p>
                <button onClick={onClose}>Close</button>
            </div>
        </div>
    );
};

export default PaymentVerificationModal;
