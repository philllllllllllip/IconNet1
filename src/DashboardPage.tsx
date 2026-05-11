import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import iconsData from './data/icons.json';
import defaultIcon from './icons/default.png';
import './DashboardPage.css';

interface OwnedIconEntry {
  iconId: string;
  acquiredAt: string;
  iconName: string;
  rarity: string;
}

const DashboardPage: React.FC = () => {
  const { user, role, stats, selectedIconId, selectIcon, token } = useAuth();
  const [ownedIcons, setOwnedIcons] = useState<OwnedIconEntry[]>([]);
  const [loadingOwned, setLoadingOwned] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadOwned = async () => {
      if (!token) return;
      setLoadingOwned(true);
      try {
        const res = await fetch('http://localhost:5000/api/market/owned', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!res.ok) {
          throw new Error('Could not load owned icons');
        }
        const data = await res.json();
        setOwnedIcons(data.ownedIcons || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingOwned(false);
      }
    };

    loadOwned();
  }, [token]);

  const ownedIconIds = useMemo(() => new Set(ownedIcons.map((entry) => entry.iconId)), [ownedIcons]);

  const activeIcon = useMemo(
    () => iconsData.find((icon) => icon.id === selectedIconId) || iconsData[0],
    [selectedIconId]
  );

  const activeIconSrc = defaultIcon;

  const handleSelectIcon = async (iconId: string) => {
    if (selecting || !ownedIconIds.has(iconId)) return;
    setSelecting(true);
    setMessage(null);

    try {
      await selectIcon(iconId);
      setMessage('Profile icon updated.');
    } catch (err) {
      console.error(err);
      setMessage((err as Error).message || 'Failed to update profile icon');
    } finally {
      setSelecting(false);
    }
  };

  const lineStats = [
    { label: 'Coins', emoji: '🪙', value: stats.tokens.toLocaleString() },
    { label: 'Icons', emoji: '🎨', value: `${stats.iconsUnlocked.toLocaleString()} / ${stats.iconsTotal.toLocaleString()}` }
  ];

  return (
    <div className="dashboard-content">
      <section className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            <img src={activeIconSrc} alt={activeIcon?.name || 'Profile icon'} />
          </div>
          <div className="profile-details">
            <div className="banner-name">{user || 'Player'}</div>
            <div className="banner-tag">@{(user || 'player').toLowerCase()}</div>
            <div className="banner-role">{role || 'Player'}</div>
            <div className="banner-subtitle">Current icon: {activeIcon?.name || 'IconNet'}</div>
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

      <section className="icon-selection-panel">
        <div className="selection-header">
          <div>
            <h2>Choose your profile icon</h2>
            <p>Click any owned icon to make it your dashboard profile picture.</p>
          </div>
          {message ? <div className="selection-message">{message}</div> : null}
        </div>

        {loadingOwned ? (
          <p>Loading owned icons…</p>
        ) : (
          <div className="owned-icon-grid">
            {iconsData.map((icon) => {
              const unlocked = ownedIconIds.has(icon.id);
              const isSelected = icon.id === selectedIconId;
              const previewSrc = defaultIcon;

              return (
                <button
                  key={icon.id}
                  type="button"
                  className={`icon-choice-card ${unlocked ? 'unlocked' : 'locked'} ${isSelected ? 'selected' : ''}`}
                  onClick={() => unlocked && handleSelectIcon(icon.id)}
                  disabled={!unlocked}
                >
                  <div className="icon-choice-preview">
                    <img src={previewSrc} alt={icon.name} />
                  </div>
                  <div className="icon-choice-meta">
                    <strong>{icon.name}</strong>
                    <span>{icon.series} / {icon.case}</span>
                  </div>
                  {isSelected && <span className="icon-choice-badge">Selected</span>}
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;

