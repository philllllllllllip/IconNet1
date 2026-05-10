import React from 'react';
import HomePage from './HomePage';
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';
import DashboardPage from './DashboardPage';
import SettingsPage from './SettingsPage';
import NotFoundPage from './NotFoundPage';
import Layout from './Layout';
import { useAuth } from './AuthContext';

const App: React.FC = () => {
  const { user, loading } = useAuth();
  const rawPath = window.location.pathname;
  const path = rawPath.toLowerCase();

  const handleNavigate = (newPath: string) => {
    window.location.pathname = newPath;
  };

  if (loading) {
    return <div style={{ color: 'white', padding: '2rem' }}>Loading...</div>;
  }

  if (path === '/dashboardpage') {
    window.location.pathname = '/dashboard';
    return null;
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

  if (path === '/settings') {
    if (!user) {
      window.location.pathname = '/login';
      return null;
    }
    return (
      <Layout onNavigate={handleNavigate}>
        <SettingsPage />
      </Layout>
    );
  }

  if (path === '/' || path === '') {
    return <HomePage />;
  }

  return <NotFoundPage />;
};

export default App;
