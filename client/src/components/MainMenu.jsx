import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';
import { useGameStore } from '../stores/gameStore';
import { connectSocket } from '../networking/socket';
import { attachGameListeners, emit } from '../networking/gameSync';
import { useAppConfig } from '../utils/config';

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    color: '#fff',
  },
  title: { fontSize: 'clamp(2rem, 9vw, 3rem)', fontWeight: 'bold', color: '#4A90D9', marginBottom: 8, textShadow: '0 0 30px #4A90D9aa', textAlign: 'center' },
  subtitle: { fontSize: '1.1rem', color: '#aaa', marginBottom: 32, textAlign: 'center' },
  demoBanner: { width: '100%', maxWidth: 480, marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: 'rgba(241,196,15,0.1)', border: '1px solid rgba(241,196,15,0.35)', color: '#f5e6b0', fontSize: '0.88rem', lineHeight: 1.5, textAlign: 'center' },
  linkBtn: { background: 'none', border: 'none', color: '#ffe066', textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit', padding: 0 },
  card: { background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 'clamp(20px, 5vw, 28px) clamp(16px, 5vw, 32px)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 24, width: '100%', maxWidth: 480 },
  modeGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 },
  modeBtn: (active) => ({
    padding: '16px 12px',
    borderRadius: 12,
    border: `2px solid ${active ? '#4A90D9' : 'rgba(255,255,255,0.2)'}`,
    background: active ? 'rgba(74,144,217,0.2)' : 'rgba(255,255,255,0.05)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: 'bold',
    transition: 'all 0.2s',
  }),
  mixedBtn: (active) => ({
    gridColumn: '1 / -1',
    padding: '14px',
    borderRadius: 12,
    border: `2px solid ${active ? '#9b59b6' : 'rgba(255,255,255,0.2)'}`,
    background: active ? 'rgba(155,89,182,0.2)' : 'rgba(255,255,255,0.05)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: 'bold',
    transition: 'all 0.2s',
  }),
  playBtn: {
    width: '100%',
    padding: '16px',
    borderRadius: 12,
    background: 'linear-gradient(135deg, #4A90D9, #2c3e50)',
    border: 'none',
    color: '#fff',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginBottom: 10,
  },
  navRow: { display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' },
  navBtn: {
    padding: '10px 18px',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
  userInfo: { textAlign: 'center', marginBottom: 24 },
  diffRow: { display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 },
  diffBtn: (active) => ({
    padding: '6px 14px',
    whiteSpace: 'nowrap',
    borderRadius: 8,
    border: `1px solid ${active ? '#2ecc71' : 'rgba(255,255,255,0.2)'}`,
    background: active ? 'rgba(46,204,113,0.2)' : 'transparent',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '0.85rem',
  }),
};

export default function MainMenu() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const token = useUserStore((s) => s.token);
  const loginAsGuest = useUserStore((s) => s.loginAsGuest);
  const mode = useGameStore((s) => s.mode);
  const difficulty = useGameStore((s) => s.difficulty);
  const setMode = useGameStore((s) => s.setMode);
  const setDifficulty = useGameStore((s) => s.setDifficulty);
  const startMatchmaking = useGameStore((s) => s.startMatchmaking);
  const config = useAppConfig();
  const [joining, setJoining] = useState(false);
  const [problem, setProblem] = useState(null);
  const signedIn = user && !user.isGuest;

  // Fetch the game engine while the child is still choosing a mode.
  useEffect(() => { import('./GameCanvas'); }, []);

  const handlePlay = async () => {
    setJoining(true);
    setProblem(null);
    let activeToken = token;
    if (!user) {
      const res = await loginAsGuest();
      if (!res.success) {
        setJoining(false);
        setProblem("Can't reach the game server. Please try again in a moment.");
        return;
      }
      activeToken = useUserStore.getState().token;
    }
    connectSocket(activeToken);
    attachGameListeners();
    startMatchmaking();
    emit.joinMatchmaking(mode, difficulty);
    navigate('/game');
  };

  return (
    <div style={styles.container}>
      <div>
        <h1 style={styles.title}>💦 SteamBlast Arena</h1>
        <p style={styles.subtitle}>Blast your way to the top — and learn while you play!</p>
      </div>

      {config?.demoMode && !signedIn && (
        <div style={styles.demoBanner}>
          <b>Demo:</b> press Play to battle friendly bots straight away, or{' '}
          <button style={styles.linkBtn} onClick={() => navigate('/auth')}>sign in with a demo account</button>{' '}
          to see the premium, teacher and parent features.
        </div>
      )}

      {signedIn && (
        <div style={styles.userInfo}>
          <div style={{ fontSize: '1rem', color: '#4A90D9', fontWeight: 'bold' }}>
            {user.isPremium ? '⭐' : ''} {user.displayName}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#888' }}>
            Level {user.level} · {Math.round(user.totalScore)} pts
          </div>
        </div>
      )}

      <div style={styles.card}>
        <div style={{ marginBottom: 12, fontSize: '0.85rem', color: '#aaa' }}>Game Mode</div>
        <div style={styles.modeGrid}>
          <button style={styles.modeBtn(mode === 'maths')} onClick={() => setMode('maths')}>🔢 Maths Blast</button>
          <button style={styles.modeBtn(mode === 'literacy')} onClick={() => setMode('literacy')}>📖 Literacy Blast</button>
          <button style={styles.mixedBtn(mode === 'mixed')} onClick={() => setMode('mixed')}>🎲 Mixed Mode</button>
        </div>

        <div style={{ marginBottom: 12, fontSize: '0.85rem', color: '#aaa' }}>Difficulty</div>
        <div style={styles.diffRow}>
          {[
            { level: 1, label: 'Ages 5-7' },
            { level: 2, label: 'Ages 7-9' },
            { level: 3, label: 'Ages 9-12' },
          ].map(({ level, label }) => (
            <button key={level} style={styles.diffBtn(difficulty === level)} onClick={() => setDifficulty(level)}>
              {label}
            </button>
          ))}
        </div>

        <button style={{ ...styles.playBtn, opacity: joining ? 0.7 : 1 }} onClick={handlePlay} disabled={joining}>
          {joining ? '⏳ Joining…' : '▶ Play Now'}
        </button>
        {problem && <div style={{ color: '#ff8a80', fontSize: '0.85rem', textAlign: 'center' }}>{problem}</div>}
      </div>

      <div style={styles.navRow}>
        {signedIn ? (
          <>
            {user.isPremium && <button style={styles.navBtn} onClick={() => navigate('/avatar')}>👤 Avatar</button>}
            {user.isPremium && <button style={styles.navBtn} onClick={() => navigate('/shop')}>🛍️ Shop</button>}
            <button style={styles.navBtn} onClick={() => navigate('/leaderboard')}>🏆 Leaderboard</button>
            {user.role === 'teacher' && <button style={styles.navBtn} onClick={() => navigate('/teacher')}>👩‍🏫 Teacher</button>}
            {user.role === 'student' && <button style={styles.navBtn} onClick={() => navigate('/parent')}>👪 Parents</button>}
            <button style={styles.navBtn} onClick={() => navigate('/settings')}>⚙️ Settings</button>
          </>
        ) : (
          <>
            <button style={styles.navBtn} onClick={() => navigate('/auth')}>🔑 Sign In</button>
            <button style={styles.navBtn} onClick={() => navigate('/leaderboard')}>🏆 Leaderboard</button>
          </>
        )}
      </div>

      {!user?.isPremium && (
        <div style={{ marginTop: 24, textAlign: 'center', color: '#888', fontSize: '0.85rem', maxWidth: 480 }}>
          <span style={{ color: '#4A90D9' }}>⭐ Go Premium for 20 HKD/month</span> — custom avatar, weekly shop & more!
          {signedIn && <button style={{ ...styles.navBtn, marginLeft: 10 }} onClick={() => navigate('/settings')}>Upgrade</button>}
        </div>
      )}
    </div>
  );
}
