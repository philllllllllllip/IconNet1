import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UserStats {
  tokens: number;
  blocksUnlocked: number;
  blocksTotal: number;
  packsOpened: number;
  messagesSent: number;
}

interface AuthContextType {
  user: string | null;
  role: string | null;
  token: string | null;
  stats: UserStats;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = 'http://localhost:5000/api/auth';

const defaultStats: UserStats = {
  tokens: 0,
  blocksUnlocked: 0,
  blocksTotal: 417,
  packsOpened: 0,
  messagesSent: 0
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats>(defaultStats);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await fetch(`${API_URL}/me`, {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.username);
            setRole(data.role || 'Player');
            setStats(data.stats || defaultStats);
            setToken(storedToken);
          } else {
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
            setRole(null);
            setStats(defaultStats);
          }
        } catch {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          setRole(null);
          setStats(defaultStats);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Login failed');
    }
    
    const data = await res.json();
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.username);
    setRole(data.role || 'Player');
    setStats(data.stats || defaultStats);
  };

  const signup = async (username: string, password: string) => {
    const res = await fetch(`${API_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Signup failed');
    }
    
    const data = await res.json();
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.username);
    setRole(data.role || 'Player');
    setStats(data.stats || defaultStats);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setRole(null);
    setStats(defaultStats);
  };

  return (
    <AuthContext.Provider value={{ user, role, token, stats, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
