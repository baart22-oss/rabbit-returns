import React from 'react';
import './Input.css';

interface InputProps {
    type?: string;
    placeholder?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Input: React.FC<InputProps> = ({ type = 'text', placeholder, value, onChange }) => {
    return (
        <input 
            type={type} 
            className="custom-input" 
            placeholder={placeholder} 
            value={value} 
            onChange={onChange} 
        />
    );
};

export default Input;