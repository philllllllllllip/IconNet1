import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import iconsData from './data/icons.json';
import lockedIconMapping from './data/locked-icons.json';
import defaultIcon from './icons/default.png';
import './IconsPage.css';

interface IconDefinition {
  id: string;
  name: string;
  iconName: string;
  series: string;
  case: string;
}

interface OwnedIconEntry {
  iconId: string;
  acquiredAt: string;
  iconName: string;
  rarity: string;
}

const MARKET_API = (typeof process !== 'undefined' ? process.env.REACT_APP_API_URL : undefined) || 'http://localhost:5000/api/market';

const IconsPage: React.FC = () => {
  const { token, stats } = useAuth();
  const [ownedIcons, setOwnedIcons] = useState<OwnedIconEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOwned = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetch(`${MARKET_API}/owned`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error('Failed to load owned icons');
        const data = await res.json();
        setOwnedIcons(data.ownedIcons || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchOwned();
  }, [token]);

  const ownedIconIds = useMemo(() => {
    return new Set(ownedIcons.map((entry) => entry.iconId));
  }, [ownedIcons]);

  const iconsBySeries = useMemo(() => {
    return iconsData.reduce<Record<string, IconDefinition[]>>((groups, icon) => {
      const seriesName = icon.series || 'Unknown';
      if (!groups[seriesName]) groups[seriesName] = [];
      groups[seriesName].push(icon);
      return groups;
    }, {});
  }, []);

  const totalUnlocked = iconsData.filter((icon) => icon.id === 'icon-1' || ownedIconIds.has(icon.id)).length;
  const totalCount = iconsData.length;

  const iconAssets: Record<string, string> = {
    default: defaultIcon
  };

  const renderIconCell = (icon: IconDefinition) => {
    const unlocked = icon.id === 'icon-1' || ownedIconIds.has(icon.id);
    const previewKey = unlocked
      ? icon.iconName
      : (lockedIconMapping[icon.iconName as keyof typeof lockedIconMapping] || icon.iconName);
    const iconSrc = iconAssets[previewKey] || defaultIcon;

    return (
      <tr key={icon.id} className={unlocked ? 'icon-row unlocked' : 'icon-row locked'}>
        <td>
          <div className="icon-preview">
            <img src={iconSrc} alt={icon.name} />
          </div>
        </td>
        <td>{icon.name}</td>
        <td>{icon.case}</td>
        <td>{unlocked ? 'Unlocked' : 'Locked'}</td>
      </tr>
    );
  };

  return (
    <div className="icons-page">
      <section className="icons-header">
        <div>
          <h1>Icon Collection</h1>
          <p>Your icons.</p>
        </div>
        <div className="icons-summary">
          <span>{`Unlocked ${totalUnlocked} / ${totalCount}`}</span>
          <span>{`Tokens: ${stats.tokens}`}</span>
        </div>
      </section>

      {loading && <div className="icons-loading">Loading your collection…</div>}

      {Object.entries(iconsBySeries).map(([seriesName, seriesIcons]) => (
        <section key={seriesName} className="icons-series-panel">
          <h2>{seriesName === 'None' ? 'Default Collection' : `${seriesName} Series`}</h2>
          <div className="icons-series-case">Cases in this series: {Array.from(new Set(seriesIcons.map((icon) => icon.case))).join(', ')}</div>
          <div className="icons-table-wrapper">
            <table className="icons-table">
              <thead>
                <tr>
                  <th>Icon</th>
                  <th>Name</th>
                  <th>Case</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>{seriesIcons.map(renderIconCell)}</tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
};

export default IconsPage;
