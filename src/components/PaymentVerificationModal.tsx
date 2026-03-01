// PaymentVerificationModal.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

const PaymentVerificationModal = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [loading, setLoading] = useState(false);

    const onSubmit = async (data) => {
        setLoading(true);
        // Perform verification logic here
        setLoading(false);
    };

    return (
        <div>
            <h2>Payment Verification</h2>
            <form onSubmit={handleSubmit(onSubmit)}>
                <input {...register('paymentId', { required: true })} />
                {errors.paymentId && <span>This field is required</span>}
                <button type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Verify Payment'}</button>
            </form>
        </div>
    );
};

export default PaymentVerificationModal;