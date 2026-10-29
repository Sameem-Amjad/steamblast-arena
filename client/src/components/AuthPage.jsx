import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';
import { useAppConfig } from '../utils/config';

const DEMO_ICONS = { student: '⭐', teacher: '👩‍🏫', admin: '🛠️' };

export default function AuthPage() {
  const navigate = useNavigate();
  const { login, register, loginAsGuest, loading, error } = useUserStore();
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', displayName: '', role: 'student', parentEmail: '' });
  const config = useAppConfig();
  const demoAccounts = config?.demoAccounts || [];

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    let res;
    if (tab === 'login') {
      res = await login({ email: form.email, password: form.password });
    } else {
      res = await register(form);
    }
    if (res.success) navigate('/');
  };

  const signInAsDemo = async (account) => {
    if (account.role === 'admin') {
      window.location.href = '/admin/';
      return;
    }
    const res = await login({ email: account.email, password: account.password });
    if (res.success) navigate('/');
  };

  const handleGuest = async () => {
    const res = await loginAsGuest();
    if (res.success) navigate('/');
  };

  return (
    <div style={s.container}>
      <div style={s.panel}>
        <h2 style={s.title}>💦 SteamBlast Arena</h2>

        {demoAccounts.length > 0 && (
          <div style={s.demoBox}>
            <div style={s.demoTitle}>Try a demo account</div>
            {demoAccounts.map((a) => (
              <button key={a.key} onClick={() => signInAsDemo(a)} style={s.demoBtn} disabled={loading}>
                <span style={{ fontSize: '1.3rem' }}>{DEMO_ICONS[a.role]}</span>
                <span style={{ flex: 1, textAlign: 'left' }}>
                  <b>{a.label}</b>
                  <span style={{ display: 'block', color: '#9aa4c0', fontSize: '0.78rem' }}>{a.email}</span>
                </span>
                <span style={{ color: '#4A90D9' }}>→</span>
              </button>
            ))}
            <div style={{ color: '#8d97b5', fontSize: '0.76rem', marginTop: 6 }}>
              Password for all of them: <b style={{ color: '#cfd6ea' }}>{demoAccounts[0].password}</b>
            </div>
          </div>
        )}

        <div style={s.tabs}>
          {['login', 'register'].map((t) => (
            <button key={t} onClick={() => setTab(t)} style={s.tab(tab === t)}>
              {t === 'login' ? '🔑 Sign In' : '📝 Register'}
            </button>
          ))}
        </div>

        {error && <div style={s.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={s.form}>
          {tab === 'register' && (
            <input style={s.input} placeholder="Display name" value={form.displayName}
              onChange={(e) => set('displayName', e.target.value)} required />
          )}
          <input style={s.input} type="email" placeholder="Email" value={form.email}
            onChange={(e) => set('email', e.target.value)} required />
          <input style={s.input} type="password" placeholder="Password" value={form.password}
            onChange={(e) => set('password', e.target.value)} required />

          {tab === 'register' && (
            <>
              <select style={s.input} value={form.role} onChange={(e) => set('role', e.target.value)}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
              <input style={s.input} type="email" placeholder="Parent email (optional)"
                value={form.parentEmail} onChange={(e) => set('parentEmail', e.target.value)} />
            </>
          )}

          <button type="submit" style={s.btn} disabled={loading}>
            {loading ? 'Loading...' : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16, color: '#888' }}>or</div>
        <button onClick={handleGuest} style={s.guestBtn} disabled={loading}>
          Play as Guest (no account needed)
        </button>

        <button onClick={() => navigate('/')} style={s.backBtn}>← Back</button>
      </div>
    </div>
  );
}

const s = {
  container: { minHeight: '100vh', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  panel: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 'clamp(24px, 6vw, 36px) clamp(18px, 6vw, 40px)', width: '100%', maxWidth: 440, color: '#fff' },
  title: { textAlign: 'center', fontSize: '1.6rem', color: '#4A90D9', marginBottom: 24 },
  tabs: { display: 'flex', gap: 0, marginBottom: 20, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)' },
  tab: (active) => ({ flex: 1, padding: '10px', border: 'none', background: active ? '#4A90D9' : 'transparent', color: '#fff', cursor: 'pointer', fontWeight: active ? 'bold' : 'normal' }),
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  input: { padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.95rem', outline: 'none' },
  btn: { padding: '13px', borderRadius: 10, background: '#4A90D9', border: 'none', color: '#fff', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' },
  guestBtn: { width: '100%', padding: '12px', borderRadius: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#aaa', cursor: 'pointer', marginTop: 8 },
  backBtn: { display: 'block', marginTop: 20, background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.9rem' },
  demoBox: { background: 'rgba(241,196,15,0.07)', border: '1px solid rgba(241,196,15,0.3)', borderRadius: 14, padding: 14, marginBottom: 20 },
  demoTitle: { fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 1, color: '#f5e6b0', marginBottom: 10 },
  demoBtn: { width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', marginBottom: 8, borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer', fontSize: '0.92rem' },
  error: { background: 'rgba(231,76,60,0.2)', border: '1px solid #e74c3c', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: '#e74c3c', fontSize: '0.9rem' },
};
