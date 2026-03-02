import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/integrations/supabase/client';

interface StoredUser {
  id: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: StoredUser | null;
  session: { user: StoredUser; access_token: string } | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [session, setSession] = useState<{ user: StoredUser; access_token: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem('auth_user');
    const token = localStorage.getItem('auth_token');
    if (raw && token) {
      try {
        const u: StoredUser = JSON.parse(raw);
        setUser(u);
        setSession({ user: u, access_token: token });
      } catch (err) {
        console.error('Failed to parse stored auth user:', err);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await api.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const raw = localStorage.getItem('auth_user');
    const token = localStorage.getItem('auth_token');
    if (raw && token) {
      const u: StoredUser = JSON.parse(raw);
      setUser(u);
      setSession({ user: u, access_token: token });
    }
  };

  const signup = async (email: string, password: string) => {
    const { error } = await api.auth.signUp({ email, password });
    if (error) throw error;
    const raw = localStorage.getItem('auth_user');
    const token = localStorage.getItem('auth_token');
    if (raw && token) {
      const u: StoredUser = JSON.parse(raw);
      setUser(u);
      setSession({ user: u, access_token: token });
    }
  };

  const logout = async () => {
    await api.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, login, signup, logout }}>
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
