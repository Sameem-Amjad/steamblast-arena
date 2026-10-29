import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';
import api from '../utils/api';

const MODE_LABEL = { maths: 'Maths', literacy: 'Literacy', mixed: 'Mixed' };

export default function ParentPortal() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const [stats, setStats] = useState(null);
  const [timeLimit, setTimeLimit] = useState(user?.dailyTimeLimit || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    api.get('/users/stats').then((res) => setStats(res.data)).catch(() => {});
  }, []);

  const saveTimeLimit = async () => {
    setSaving(true);
    const res = await updateProfile({ dailyTimeLimit: timeLimit ? parseInt(timeLimit, 10) : null });
    setSaving(false);
    setMsg(res.success
      ? { type: 'success', text: 'Settings saved!' }
      : { type: 'error', text: res.error || 'Failed to save.' });
  };

  return (
    <div style={s.container}>
      <div style={s.panel}>
        <div style={s.header}>
          <button onClick={() => navigate('/')} style={s.backBtn}>← Back</button>
          <h2 style={s.title}>👪 Parent Portal</h2>
          <div style={{ width: 40 }} />
        </div>

        {msg && <div style={{ ...s.toast, color: msg.type === 'success' ? '#2ecc71' : '#e74c3c' }}>{msg.text}</div>}

        <div style={s.section}>
          <div style={s.sectionTitle}>{user?.displayName}'s activity</div>
          {stats ? (
            <div>
              <div style={s.stat}><span style={s.statLabel}>Games played</span><span style={s.statVal}>{stats.totalGames}</span></div>
              <div style={s.stat}><span style={s.statLabel}>Questions answered</span><span style={s.statVal}>{stats.totalAnswered}</span></div>
              <div style={s.stat}><span style={s.statLabel}>Correct answers</span><span style={s.statVal}>{stats.totalCorrect}</span></div>
              <div style={s.stat}><span style={s.statLabel}>Overall accuracy</span><span style={{ ...s.statVal, color: stats.accuracy >= 70 ? '#2ecc71' : '#e74c3c' }}>{stats.accuracy}%</span></div>
              <div style={s.stat}><span style={s.statLabel}>Played today</span><span style={s.statVal}>{stats.minutesToday} min</span></div>
            </div>
          ) : (
            <div style={{ color: '#888' }}>Loading...</div>
          )}
        </div>

        {stats?.recentSessions?.length > 0 && (
          <div style={s.section}>
            <div style={s.sectionTitle}>Recent games</div>
            {stats.recentSessions.slice(0, 6).map((g) => (
              <div key={g.id} style={s.game}>
                <span style={{ color: '#aaa', width: 92 }}>{new Date(g.GameSession?.startedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                <span style={{ flex: 1 }}>{MODE_LABEL[g.GameSession?.mode] || 'Game'} · {ordinal(g.placement)}</span>
                <span style={{ color: '#2ecc71', width: 54, textAlign: 'right' }}>{g.questionsCorrect}/{g.questionsAnswered}</span>
                <span style={{ color: '#4A90D9', width: 48, textAlign: 'right', fontWeight: 'bold' }}>{g.finalScore.toFixed(1)}</span>
              </div>
            ))}
          </div>
        )}

        <div style={s.section}>
          <div style={s.sectionTitle}>Daily Time Limit</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              style={s.input}
              type="number"
              placeholder="Minutes (e.g. 30)"
              value={timeLimit}
              onChange={(e) => setTimeLimit(e.target.value)}
              min="0"
              aria-label="Daily time limit in minutes"
            />
            <button onClick={saveTimeLimit} disabled={saving} style={s.saveBtn}>Save</button>
          </div>
          <div style={{ color: '#888', fontSize: '0.8rem', marginTop: 8 }}>
            Set 0 or leave empty for no limit. Once the limit is reached, new games can't start until tomorrow.
          </div>
        </div>
      </div>
    </div>
  );
}

function ordinal(n) {
  if (!n) return '—';
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th';
  return `${n}${suffix}`;
}

const s = {
  container: { minHeight: '100vh', background: '#1a1a2e', padding: 20, color: '#fff' },
  panel: { maxWidth: 520, margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  title: { color: '#4A90D9', fontSize: '1.4rem' },
  backBtn: { background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.9rem' },
  section: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '20px 24px', marginBottom: 16 },
  sectionTitle: { fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },
  stat: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  statLabel: { color: '#aaa' },
  statVal: { fontWeight: 'bold', color: '#fff' },
  game: { display: 'flex', gap: 8, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' },
  input: { flex: 1, minWidth: 0, padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.95rem', outline: 'none' },
  saveBtn: { padding: '10px 20px', borderRadius: 8, background: '#4A90D9', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 'bold' },
  toast: { borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: '0.9rem', background: 'rgba(255,255,255,0.04)' },
};
