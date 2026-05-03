import React from 'react';
import './Sidebar.css';

interface SidebarProps {
  onNavigate: (path: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  return (
    <div className="sidebar">
      <div>
        <div className="sidebar-header">
          <h1 className="sidebar-title">IconNet</h1>
        </div>

        <nav className="sidebar-nav">
          <button className="sidebar-button" onClick={() => onNavigate('/dashboard')}>
            <i className="fas fa-tachometer-alt" />
            <span>Dashboard</span>
          </button>
        </nav>
      </div>

      <div className="sidebar-bottom-icons">
        <button className="sidebar-icon-button" onClick={() => onNavigate('/')}> 
          <i className="fas fa-home" />
        </button>
        <a
          className="sidebar-icon-button"
          href="https://discord.gg/ctdDwZwgnt"
          target="_blank"
          rel="noopener noreferrer"
        >
          <i className="fab fa-discord" />
        </a>
      </div>
    </div>
  );
};

export default Sidebar;