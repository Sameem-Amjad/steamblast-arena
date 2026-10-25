import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';
import api from '../utils/api';

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
    const res = await updateProfile({ dailyTimeLimit: timeLimit ? parseInt(timeLimit) : null });
    setSaving(false);
    setMsg(res.success ? { type: 'success', text: 'Settings saved!' } : { type: 'error', text: 'Failed to save.' });
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
          <div style={s.sectionTitle}>Your Child's Activity</div>
          {stats ? (
            <div>
              <div style={s.stat}><span style={s.statLabel}>Games Played</span><span style={s.statVal}>{stats.totalGames}</span></div>
              <div style={s.stat}><span style={s.statLabel}>Questions Answered</span><span style={s.statVal}>{stats.totalAnswered}</span></div>
              <div style={s.stat}><span style={s.statLabel}>Correct Answers</span><span style={s.statVal}>{stats.totalCorrect}</span></div>
              <div style={s.stat}><span style={s.statLabel}>Overall Accuracy</span><span style={{ ...s.statVal, color: stats.accuracy >= 70 ? '#2ecc71' : '#e74c3c' }}>{stats.accuracy}%</span></div>
            </div>
          ) : (
            <div style={{ color: '#888' }}>Loading...</div>
          )}
        </div>

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
            />
            <button onClick={saveTimeLimit} disabled={saving} style={s.saveBtn}>Save</button>
          </div>
          <div style={{ color: '#888', fontSize: '0.8rem', marginTop: 8 }}>
            Set 0 or leave empty for no limit.
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  container: { minHeight: '100vh', background: '#1a1a2e', padding: 20, color: '#fff', overflowY: 'auto' },
  panel: { maxWidth: 480, margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  title: { color: '#4A90D9', fontSize: '1.4rem' },
  backBtn: { background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.9rem' },
  section: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '20px 24px', marginBottom: 16 },
  sectionTitle: { fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },
  stat: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  statLabel: { color: '#aaa' },
  statVal: { fontWeight: 'bold', color: '#fff' },
  input: { flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.95rem', outline: 'none' },
  saveBtn: { padding: '10px 20px', borderRadius: 8, background: '#4A90D9', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 'bold' },
  toast: { borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: '0.9rem' },
};
