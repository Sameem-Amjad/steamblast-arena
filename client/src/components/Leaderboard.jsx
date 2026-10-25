import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function Leaderboard() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/leaderboard/global').then((res) => {
      setPlayers(res.data.leaderboard);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div style={s.container}>
      <div style={s.panel}>
        <div style={s.header}>
          <button onClick={() => navigate('/')} style={s.backBtn}>← Back</button>
          <h2 style={s.title}>🏆 Global Leaderboard</h2>
          <div style={{ width: 60 }} />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Loading...</div>
        ) : (
          <div style={s.list}>
            {players.map((p, i) => (
              <div key={p.id} style={{ ...s.row, background: i < 3 ? 'rgba(241,196,15,0.07)' : 'transparent' }}>
                <span style={s.rank}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}</span>
                <span style={s.name}>
                  {p.isPremium ? '⭐ ' : ''}{p.displayName}
                </span>
                <span style={s.score}>{Math.round(p.totalScore).toLocaleString()}</span>
                <span style={s.games}>{p.gamesPlayed} games</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  container: { minHeight: '100vh', background: '#1a1a2e', padding: 20, color: '#fff', overflowY: 'auto' },
  panel: { maxWidth: 600, margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  title: { color: '#f1c40f', fontSize: '1.5rem' },
  backBtn: { background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.9rem' },
  list: { display: 'flex', flexDirection: 'column', gap: 4 },
  row: { display: 'grid', gridTemplateColumns: '50px 1fr 80px 80px', alignItems: 'center', padding: '12px 16px', borderRadius: 10 },
  rank: { fontSize: '1.2rem' },
  name: { fontWeight: 'bold' },
  score: { color: '#4A90D9', fontWeight: 'bold', textAlign: 'right' },
  games: { color: '#888', fontSize: '0.8rem', textAlign: 'right' },
};
