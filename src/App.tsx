import React from 'react';
import HomePage from './HomePage';
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';
import DashboardPage from './DashboardPage';
import Layout from './Layout';
import { useAuth } from './AuthContext';

const App: React.FC = () => {
  const { user, loading } = useAuth();
  const path = window.location.pathname;

  const handleNavigate = (newPath: string) => {
    window.location.pathname = newPath;
  };

  if (loading) {
    return <div style={{ color: 'white', padding: '2rem' }}>Loading...</div>;
  }

  if (path === '/login') {
    if (user) {
      window.location.pathname = '/dashboard';
      return null;
    }
    return <LoginPage />;
  }

  if (path === '/signup') {
    if (user) {
      window.location.pathname = '/dashboard';
      return null;
    }
    return <SignupPage />;
  }

  if (path === '/dashboard') {
    if (!user) {
      window.location.pathname = '/login';
      return null;
    }
    return (
      <Layout onNavigate={handleNavigate}>
        <DashboardPage />
      </Layout>
    );
  }

  return <HomePage />;
};

export default App;
