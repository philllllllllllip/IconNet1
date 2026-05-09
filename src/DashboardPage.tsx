import React from 'react';
import { useAuth } from './AuthContext';

const DashboardPage: React.FC = () => {
  const { user, role, stats } = useAuth();

  const statsList = [
    { label: 'Coins', value: stats.tokens.toLocaleString() },
    { label: 'Icons', value: `${stats.iconsUnlocked.toLocaleString()} / ${stats.iconsTotal.toLocaleString()}` },
    { label: 'Crates', value: stats.packsOpened.toLocaleString() },
    { label: 'Messages', value: stats.messagesSent.toLocaleString() }
  ];

  return (
    <div className="dashboard-shell">
      <section className="profile-card">
        <div className="profile-avatar-column">
          <div className="profile-avatar">{user?.charAt(0).toUpperCase() || 'P'}</div>
        </div>
        <div className="profile-banner">
          <div className="profile-banner-content">
            <div className="banner-name">{user || 'Player'}</div>
            <div className="banner-tag">@{(user || 'player').toLowerCase()}</div>
            <div className="banner-role">{role || 'Player'}</div>
          </div>
        </div>
      </section>

      <section className="stats-card">
        <div className="stats-header">
          <div>
            <h2>Account Summary</h2>
            <p>Key account metrics and progress.</p>
          </div>
        </div>

        <div className="stats-grid">
          {statsList.map((stat) => (
            <div key={stat.label} className="stat-value-card">
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
