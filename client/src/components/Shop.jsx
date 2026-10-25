import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShopStore } from '../stores/shopStore';
import { useUserStore } from '../stores/userStore';

const RARITY_COLORS = { common: '#95a5a6', rare: '#3498db', epic: '#9b59b6', legendary: '#f39c12' };
const CATEGORY_ICONS = { hat: '🎩', outfit: '👕', water_skin: '💦', steam_effect: '☁️', victory_dance: '🏃' };

export default function Shop() {
  const navigate = useNavigate();
  const { items, coins, loading, fetchItems, purchaseItem, purchaseResult, clearPurchaseResult } = useShopStore();
  const user = useUserStore((s) => s.user);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchItems(); }, []);
  useEffect(() => {
    if (purchaseResult) {
      const t = setTimeout(clearPurchaseResult, 3000);
      return () => clearTimeout(t);
    }
  }, [purchaseResult]);

  if (!user?.isPremium) {
    return (
      <div style={s.container}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>⭐</div>
          <h2 style={{ color: '#f1c40f' }}>Premium Required</h2>
          <p style={{ color: '#888', marginTop: 8 }}>The shop is exclusive to premium members.</p>
          <button onClick={() => navigate('/settings')} style={s.btn}>Upgrade Now</button>
        </div>
      </div>
    );
  }

  const categories = ['all', ...new Set(items.map((i) => i.category))];
  const filtered = filter === 'all' ? items : items.filter((i) => i.category === filter);

  return (
    <div style={s.container}>
      <div style={s.header}>
        <button onClick={() => navigate('/')} style={s.backBtn}>← Back</button>
        <h2 style={s.title}>🛍️ Weekly Shop</h2>
        <div style={s.coins}>🪙 {coins}</div>
      </div>

      {purchaseResult && (
        <div style={{ ...s.toast, background: purchaseResult.success ? 'rgba(46,204,113,0.2)' : 'rgba(231,76,60,0.2)', borderColor: purchaseResult.success ? '#2ecc71' : '#e74c3c' }}>
          {purchaseResult.success ? `✅ ${purchaseResult.message}` : `❌ ${purchaseResult.error}`}
        </div>
      )}

      <div style={s.filterRow}>
        {categories.map((c) => (
          <button key={c} onClick={() => setFilter(c)} style={s.filterBtn(filter === c)}>
            {c === 'all' ? 'All' : `${CATEGORY_ICONS[c] || ''} ${c.replace('_', ' ')}`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Loading...</div>
      ) : (
        <div style={s.grid}>
          {filtered.map((item) => (
            <div key={item.id} style={s.card}>
              <div style={s.itemIcon}>{CATEGORY_ICONS[item.category] || '🎁'}</div>
              <div style={s.itemName}>{item.name}</div>
              <div style={{ ...s.rarity, color: RARITY_COLORS[item.rarity] }}>{item.rarity}</div>
              <div style={s.desc}>{item.description}</div>
              <div style={s.price}>🪙 {item.coinPrice}</div>
              {item.owned ? (
                <div style={s.owned}>✅ Owned</div>
              ) : (
                <button
                  onClick={() => purchaseItem(item.id)}
                  disabled={coins < item.coinPrice}
                  style={{ ...s.buyBtn, opacity: coins < item.coinPrice ? 0.5 : 1 }}
                >
                  Buy
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const s = {
  container: { minHeight: '100vh', background: '#1a1a2e', padding: 20, color: '#fff', overflowY: 'auto' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { color: '#f1c40f', fontSize: '1.6rem' },
  coins: { fontSize: '1.2rem', fontWeight: 'bold', color: '#f1c40f' },
  backBtn: { background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.9rem' },
  filterRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 },
  filterBtn: (a) => ({ padding: '7px 14px', borderRadius: 8, border: `1px solid ${a ? '#f1c40f' : 'rgba(255,255,255,0.2)'}`, background: a ? 'rgba(241,196,15,0.15)' : 'transparent', color: '#fff', cursor: 'pointer', fontSize: '0.82rem' }),
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 },
  card: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '16px 12px', textAlign: 'center' },
  itemIcon: { fontSize: '2.5rem', marginBottom: 8 },
  itemName: { fontWeight: 'bold', marginBottom: 4 },
  rarity: { fontSize: '0.75rem', textTransform: 'capitalize', marginBottom: 6 },
  desc: { fontSize: '0.75rem', color: '#888', marginBottom: 10 },
  price: { fontWeight: 'bold', color: '#f1c40f', marginBottom: 8 },
  owned: { color: '#2ecc71', fontSize: '0.85rem' },
  buyBtn: { padding: '8px 20px', borderRadius: 8, background: '#4A90D9', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 'bold' },
  btn: { display: 'inline-block', marginTop: 20, padding: '12px 28px', borderRadius: 10, background: '#4A90D9', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1rem' },
  toast: { border: '1px solid', borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: '0.9rem' },
};
