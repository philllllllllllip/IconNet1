import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import './MarketPage.css';

interface IconDefinition {
  id: string;
  name: string;
  rarity: string;
  dropChance: number;
  circulation: number;
  maxSupply: number;
}

interface OwnedIconEntry {
  iconId: string;
  acquiredAt: string;
  iconName: string;
  rarity: string;
}

const MARKET_API = (typeof process !== 'undefined' ? process.env.REACT_APP_API_URL : undefined) || 'http://localhost:5000/api/market';

const MarketPage: React.FC = () => {
  const { token } = useAuth();
  const [icons, setIcons] = useState<IconDefinition[]>([]);
  const [ownedIcons, setOwnedIcons] = useState<OwnedIconEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [crateMessage, setCrateMessage] = useState<string | null>(null);
  const [openingCrate, setOpeningCrate] = useState(false);

  const watchOwnedCounts = useMemo(() => {
    return ownedIcons.reduce<Record<string, number>>((acc, item) => {
      acc[item.iconId] = (acc[item.iconId] || 0) + 1;
      return acc;
    }, {});
  }, [ownedIcons]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [iconsRes, ownedRes] = await Promise.all([
          fetch(`${MARKET_API}/icons`),
          fetch(`${MARKET_API}/owned`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (!iconsRes.ok) throw new Error('Failed to load market icons');
        if (!ownedRes.ok) throw new Error('Failed to load owned icons');

        const iconsData = await iconsRes.json();
        const ownedData = await ownedRes.json();

        setIcons(iconsData.icons || []);
        setOwnedIcons(ownedData.ownedIcons || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleOpenCrate = async () => {
    if (!token) return;

    setOpeningCrate(true);
    setCrateMessage(null);

    try {
      const res = await fetch(`${MARKET_API}/open-crate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        setCrateMessage(data.error || 'Could not open crate');
        return;
      }

      setCrateMessage(`You found ${data.acquired.name} (${data.acquired.rarity})!`);
      const ownedRes = await fetch(`${MARKET_API}/owned`, { headers: { Authorization: `Bearer ${token}` } });
      if (ownedRes.ok) {
        const ownedData = await ownedRes.json();
        setOwnedIcons(ownedData.ownedIcons || []);
      }
      const iconsRes = await fetch(`${MARKET_API}/icons`);
      if (iconsRes.ok) {
        const iconsData = await iconsRes.json();
        setIcons(iconsData.icons || []);
      }
    } catch (err) {
      console.error(err);
      setCrateMessage('Failed to open crate. Try again later.');
    } finally {
      setOpeningCrate(false);
    }
  };

  const sortedIcons = [...icons].sort((a, b) => {
    const rarityOrder = ['legendary', 'epic', 'rare', 'uncommon', 'common'];
    return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
  });

  return (
    <div className="market-page">
      <section className="market-hero">
        <div>
          <h1>Icon Market</h1>
          <p>Preview icon rarities, circulation, and crates.</p>
        </div>
        <button className="market-action" onClick={handleOpenCrate} disabled={openingCrate}>
          {openingCrate ? 'Opening...' : 'Open Crate'}
        </button>
      </section>

      {crateMessage && <div className="market-toast">{crateMessage}</div>}

      <section className="market-grid-wrapper">
        <div className="market-panel">
          <h2>Market Catalog</h2>
          {loading ? (
            <p>Loading icons...</p>
          ) : (
            <div className="market-grid">
              {sortedIcons.map((icon) => (
                <div key={icon.id} className="market-card">
                  <div className="market-card-title">
                    <span>{icon.name}</span>
                    <span className={`rarity-chip rarity-${icon.rarity}`}>{icon.rarity}</span>
                  </div>
                  <div className="market-stats-row">
                    <span>Drop</span>
                    <strong>{icon.dropChance}%</strong>
                  </div>
                  <div className="market-stats-row">
                    <span>Circulation</span>
                    <strong>{icon.circulation}</strong>
                  </div>
                  {watchOwnedCounts[icon.id] ? (
                    <div className="market-owned-count">Owned: {watchOwnedCounts[icon.id]}</div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="market-panel">
          <h2>Your Inventory</h2>
          {loading ? (
            <p>Loading inventory...</p>
          ) : ownedIcons.length === 0 ? (
            <p>You don't own any icons yet.</p>
          ) : (
            <div className="inventory-list">
              {ownedIcons.map((entry, index) => (
                <div key={`${entry.iconId}-${index}`} className="inventory-item">
                  <span>{entry.iconName}</span>
                  <span>{entry.rarity}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default MarketPage;
