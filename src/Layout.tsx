import React from 'react';
import Sidebar from './Sidebar';
import SpaceParticles from './SpaceParticles';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
  onNavigate: (path: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onNavigate }) => {
  return (
    <div className="layout-root">
      <SpaceParticles />
      <Sidebar onNavigate={onNavigate} />
      <main className="layout-main">
        <div className="dashboard-shell">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;

