import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';
import api from '../utils/api';

export default function Settings() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const logout = useUserStore((s) => s.logout);
  const refreshUser = useUserStore((s) => s.refreshUser);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [joinCode, setJoinCode] = useState('');

  const handleJoinClass = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/teacher/join', { joinCode: joinCode.trim().toUpperCase() });
      setMsg({ type: 'success', text: `You joined ${res.data.classroom.name}!` });
      setJoinCode('');
    } catch (err) {
      const text = err.response?.data?.error || (err.response?.status === 422 ? 'Class codes have 8 letters and numbers.' : 'Could not join that class.');
      setMsg({ type: 'error', text });
    }
  };

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await api.post('/payments/create-checkout-session');
      window.location.href = res.data.sessionUrl;
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Payment setup failed.' });
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Cancel your premium subscription? You will keep access until the end of the billing period.')) return;
    try {
      await api.post('/payments/cancel-subscription');
      await refreshUser();
      setMsg({ type: 'success', text: 'Subscription will cancel at end of billing period.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Could not cancel subscription.' });
    }
  };

  return (
    <div style={s.container}>
      <div style={s.panel}>
        <div style={s.header}>
          <button onClick={() => navigate('/')} style={s.backBtn}>← Back</button>
          <h2 style={s.title}>⚙️ Settings</h2>
          <div style={{ width: 40 }} />
        </div>

        {msg && (
          <div style={{ ...s.toast, borderColor: msg.type === 'success' ? '#2ecc71' : '#e74c3c', color: msg.type === 'success' ? '#2ecc71' : '#e74c3c' }}>
            {msg.text}
          </div>
        )}

        {user && (
          <div style={s.section}>
            <div style={s.sectionTitle}>Account</div>
            <div style={s.infoRow}><span style={s.label}>Display name</span><span>{user.displayName}</span></div>
            <div style={s.infoRow}><span style={s.label}>Email</span><span>{user.email || 'Guest'}</span></div>
            <div style={s.infoRow}><span style={s.label}>Role</span><span style={{ textTransform: 'capitalize' }}>{user.role}</span></div>
            <div style={s.infoRow}><span style={s.label}>Level</span><span>{user.level}</span></div>
            <div style={s.infoRow}><span style={s.label}>Coins</span><span style={{ color: '#f1c40f' }}>🪙 {user.coins}</span></div>
          </div>
        )}

        {user?.role === 'student' && !user.isGuest && (
          <form style={s.section} onSubmit={handleJoinClass}>
            <div style={s.sectionTitle}>Join a class</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                style={s.input}
                placeholder="8-letter class code"
                value={joinCode}
                maxLength={8}
                onChange={(e) => setJoinCode(e.target.value)}
                aria-label="Class code"
              />
              <button type="submit" style={s.joinBtn} disabled={joinCode.trim().length !== 8}>Join</button>
            </div>
            <div style={{ color: '#888', fontSize: '0.8rem', marginTop: 8 }}>Your teacher gives you the code.</div>
          </form>
        )}

        <div style={s.section}>
          <div style={s.sectionTitle}>Subscription</div>
          {user?.isPremium ? (
            <div>
              <div style={{ color: '#2ecc71', marginBottom: 12 }}>⭐ Premium Active</div>
              <div style={{ color: '#888', fontSize: '0.85rem', marginBottom: 16 }}>
                Enjoy custom avatars, the weekly shop, leaderboard names, and extra water capacity.
              </div>
              <button onClick={handleCancelSubscription} style={s.cancelSubBtn}>
                Cancel Subscription
              </button>
            </div>
          ) : (
            <div>
              <div style={{ color: '#aaa', marginBottom: 16 }}>
                Upgrade to Premium for <strong style={{ color: '#f1c40f' }}>20 HKD/month</strong> to unlock:
                custom avatar, weekly shop, leaderboard name, +25% water capacity.
              </div>
              <button onClick={handleUpgrade} disabled={loading || !user?.email} style={s.upgradeBtn}>
                {loading ? 'Redirecting...' : '⭐ Upgrade to Premium'}
              </button>
              {!user?.email && (
                <div style={{ color: '#888', fontSize: '0.8rem', marginTop: 8 }}>
                  Create a full account to subscribe.
                </div>
              )}
            </div>
          )}
        </div>

        <div style={s.section}>
          <button onClick={() => { logout(); navigate('/'); }} style={s.logoutBtn}>
            🚪 Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  container: { minHeight: '100vh', background: '#1a1a2e', padding: 20, color: '#fff', overflowY: 'auto' },
  panel: { maxWidth: 480, margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  title: { color: '#fff', fontSize: '1.4rem' },
  backBtn: { background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.9rem' },
  section: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '20px 24px', marginBottom: 16 },
  sectionTitle: { fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },
  infoRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' },
  label: { color: '#888' },
  upgradeBtn: { width: '100%', padding: '13px', borderRadius: 10, background: 'linear-gradient(135deg, #f1c40f, #e67e22)', border: 'none', color: '#000', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' },
  cancelSubBtn: { padding: '10px 20px', borderRadius: 8, background: 'rgba(231,76,60,0.15)', border: '1px solid #e74c3c', color: '#e74c3c', cursor: 'pointer' },
  input: { flex: 1, minWidth: 0, padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.95rem', outline: 'none', textTransform: 'uppercase' },
  joinBtn: { padding: '10px 20px', borderRadius: 8, background: '#4A90D9', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 'bold' },
  logoutBtn: { width: '100%', padding: '12px', borderRadius: 10, background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', color: '#e74c3c', cursor: 'pointer', fontSize: '0.95rem' },
  toast: { border: '1px solid', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: '0.9rem' },
};
