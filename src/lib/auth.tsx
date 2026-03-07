import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, clearToken } from './client';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('rabbit_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.auth.me()
      .then(setUser)
      .catch(() => { setUser(null); clearToken(); })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const data = await api.auth.login(email, password);
    setUser(data.user);
  };
  const signup = async (email, password, fullName, referralCode) => {
    const data = await api.auth.signup(email, password, fullName, referralCode);
    setUser(data.user);
  };
  const logout = () => {
    clearToken();
    setUser(null);
    window.location.href = '/auth';
  };
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
