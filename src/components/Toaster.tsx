import React from 'react';
import { ToastContainer, Toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Toaster: React.FC = () => {
    return (
        <ToastContainer>
            <Toast>
                <div>Your toast notification message</div>
            </Toast>
        </ToastContainer>
    );
};

export default Toaster;