import React from 'react';
import { useAuth } from './AuthContext';
import './DashboardPage.css';

const DashboardPage: React.FC = () => {
  const { user, role, stats } = useAuth();

  const lineStats = [
    { label: 'Coins', emoji: '🪙', value: stats.tokens.toLocaleString() },
    { label: 'Icons', emoji: '🎨', value: `${stats.iconsUnlocked.toLocaleString()} / ${stats.iconsTotal.toLocaleString()}` }
  ];

  return (
    <div className="dashboard-content">
      <section className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">{user?.charAt(0).toUpperCase() || 'P'}</div>
          <div className="profile-details">
            <div className="banner-name">{user || 'Player'}</div>
            <div className="banner-tag">@{(user || 'player').toLowerCase()}</div>
            <div className="banner-role">{role || 'Player'}</div>
          </div>
        </div>

        <div className="account-stats">
          <div className="stats-row">
            {lineStats.map((stat) => (
              <div key={stat.label} className="inline-stat-card">
                <div className="stat-card-title">
                  <span>{stat.emoji}</span>
                  <span>{stat.label}</span>
                </div>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;

