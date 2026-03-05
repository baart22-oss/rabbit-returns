import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, clearToken, type User } from './client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string, referralCode?: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem('rabbit_token');
    if (!token) {
      // No token — don't call /auth/me, just mark loading false
      setLoading(false);
      return;
    }

    let retries = 0;
    const maxRetries = 3;

    const fetchMe = async () => {
      try {
        const data = await api.auth.me();
        if (!mounted) return;
        setUser(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        // Handle 429 by retrying with exponential backoff
        if (msg.includes('Too Many Requests') && retries < maxRetries) {
          retries += 1;
          const backoffMs = Math.pow(2, retries) * 500; // 1s, 2s, 4s approx
          setTimeout(fetchMe, backoffMs);
          return;
        }
        // On other errors or exhausted retries, clear token and mark user null
        if (!mounted) return;
        setUser(null);
        clearToken();
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchMe();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.auth.login(email, password);
    setUser(data.user);
  };

  const signup = async (email: string, password: string, fullName: string, referralCode?: string) => {
    const data = await api.auth.signup(email, password, fullName, referralCode);
    setUser(data.user);
  };

  const logout = () => {
    clearToken();
    setUser(null);
    window.location.href = '/auth';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
