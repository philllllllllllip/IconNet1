import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UserStats {
  tokens: number;
  iconsUnlocked: number;
  iconsTotal: number;
  packsOpened: number;
  messagesSent: number;
}

interface AuthContextType {
  user: string | null;
  role: string | null;
  token: string | null;
  stats: UserStats;
  selectedIconId: string;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string) => Promise<void>;
  selectIcon: (iconId: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = (typeof process !== 'undefined' ? process.env.REACT_APP_API_URL : undefined) || 'http://localhost:5000/api/auth';

const defaultStats: UserStats = {
  tokens: 0,
  iconsUnlocked: 0,
  iconsTotal: 417,
  packsOpened: 0,
  messagesSent: 0
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats>(defaultStats);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [selectedIconId, setSelectedIconId] = useState<string>('icon-1');
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
            setSelectedIconId(data.selectedIconId || 'icon-1');
            setStats(data.stats || defaultStats);
            setToken(storedToken);
          } else {
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
            setRole(null);
            setStats(defaultStats);
          }
        } catch (err) {
          console.error('Auth check failed:', err);
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
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        throw new Error(data.error || 'Login failed');
      } catch (parseErr) {
        throw new Error(`Server error: ${text || 'No response'}`);
      }
    }

    const data = await res.json();
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.username);
    setRole(data.role || 'Player');
    setSelectedIconId(data.selectedIconId || 'icon-1');
    setStats(data.stats || defaultStats);
  };

  const signup = async (username: string, password: string) => {
    const res = await fetch(`${API_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        throw new Error(data.error || 'Signup failed');
      } catch (parseErr) {
        throw new Error(`Server error: ${text || 'No response'}`);
      }
    }

    const data = await res.json();
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.username);
    setRole(data.role || 'Player');
    setSelectedIconId(data.selectedIconId || 'icon-1');
    setStats(data.stats || defaultStats);
  };

  const selectIcon = async (iconId: string) => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    const res = await fetch('http://localhost:5000/api/market/select-icon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ iconId })
    });

    if (!res.ok) {
      const payload = await res.json();
      throw new Error(payload.error || 'Could not select icon');
    }

    const data = await res.json();
    setSelectedIconId(data.selectedIconId || 'icon-1');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setRole(null);
    setSelectedIconId('icon-1');
    setStats(defaultStats);
  };

  return (
    <AuthContext.Provider value={{ user, role, token, stats, selectedIconId, login, signup, selectIcon, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
