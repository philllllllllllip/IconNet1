import React from 'react';
import Sidebar from './Sidebar';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
  onNavigate: (path: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onNavigate }) => {
  return (
    <div className="layout-root">
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

const img = new Image();
img.src = './images/dashboard_background.png';

img.onload = () => {
  document.documentElement.style.setProperty('--tile-w', img.width + 'px');
  document.documentElement.style.setProperty('--tile-h', img.height + 'px');
};
