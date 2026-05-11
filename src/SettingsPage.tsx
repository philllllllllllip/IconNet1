import React from 'react';
import { useAuth } from './AuthContext';
import './SettingsPage.css';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="settings-page">
      <section className="profile-card">
        <div className="settings-header">
          <div>
            <h1>Settings</h1>
            <p>Manage your account and preferences.</p>
          </div>
        </div>

        <div className="settings-content">
          <div className="settings-row">
            <div>
              <span className="settings-label">Account</span>
              <p>{user || 'Player'}</p>
            </div>
          </div>

          <div className="settings-row">
            <div>
              <span className="settings-label">Email</span>
              <p>{user ? `${user}@example.com` : 'not set'}</p>
            </div>
            <div>
              <span className="settings-label">Role</span>
              <p>Member</p>
            </div>
          </div>

          <div className="settings-note">
            <p></p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;
