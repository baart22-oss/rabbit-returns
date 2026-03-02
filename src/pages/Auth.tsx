import React from 'react';
import { useState } from 'react';
import './Auth.css';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const switchAuthModeHandler = () => {
        setIsLogin((prevMode) => !prevMode);
    };

    const submitHandler = (event) => {
        event.preventDefault();
        // Add your authentication logic here (API calls, etc.)
    };

    return (
        <div className="auth-form">
            <h2>{isLogin ? 'Login' : 'Register'}</h2>
            <form onSubmit={submitHandler}>
                <div className="form-control">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="form-control">
                    <label htmlFor="password">Password</label>
                    <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div className="form-actions">
                    <button type="submit">{isLogin ? 'Login' : 'Create Account'}</button>
                    <button type="button" onClick={switchAuthModeHandler}>{isLogin ? 'Switch to Register' : 'Switch to Login'}</button>
                </div>
            </form>
        </div>
    );
};

export default Auth;