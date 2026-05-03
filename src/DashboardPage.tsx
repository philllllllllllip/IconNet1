import React from 'react';
import { useAuth } from './AuthContext';

const DashboardPage: React.FC = () => {
  const { user, role, stats } = useAuth();

  const statsList = [
    { label: 'Coins', value: stats.tokens.toLocaleString() },
    { label: 'Icons', value: `${stats.blocksUnlocked.toLocaleString()} / ${stats.blocksTotal.toLocaleString()}` },
    { label: 'Crates', value: stats.packsOpened.toLocaleString() },
    { label: 'Messages', value: stats.messagesSent.toLocaleString() }
  ];

  const friends: string[] = [];

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
            <h2>Stats</h2>
            <p>All your key account figures in one place.</p>
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

      <section className="friends-card">
        <div className="friends-header">
          <h2>Friends</h2>
          <span>0 friends</span>
        </div>

        <div className="friends-body">
          {friends.length === 0 ? (
            <div className="empty-state">No friends yet. Seed your database to populate friends.</div>
          ) : (
            friends.map((friend) => (
              <div key={friend} className="friend-item">{friend}</div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;