import React from 'react';
import { AVATAR_DEFAULTS } from 'steamblast-shared/gameConstants';
import { useGameStore } from '../stores/gameStore';
import { useUserStore } from '../stores/userStore';
import { emit } from '../networking/gameSync';

export default function ResultsOverlay() {
  const results = useGameStore((s) => s.roundResults);
  const myId = useGameStore((s) => s.mySocketId);
  const mode = useGameStore((s) => s.mode);
  const difficulty = useGameStore((s) => s.difficulty);
  const startMatchmaking = useGameStore((s) => s.startMatchmaking);
  const reset = useGameStore((s) => s.reset);
  const user = useUserStore((s) => s.user);
  const refreshUser = useUserStore((s) => s.refreshUser);

  if (!results) return null;

  const mine = results.find((r) => r.socketId === myId);
  const coins = mine ? Math.floor(mine.score * 5) : 0;

  const handlePlayAgain = () => {
    startMatchmaking();
    emit.joinMatchmaking(mode, difficulty);
  };

  const handleExit = () => {
    emit.leaveRoom();
    // Scores are saved as the round ends; pick up the new totals for the menu.
    setTimeout(refreshUser, 500);
    reset();
  };

  return (
    <div style={styles.backdrop}>
      <div style={styles.panel}>
        <div style={styles.title}>🏆 Round Over! 🏆</div>
        {mine && (
          <div style={styles.summary}>
            You came <b>{ordinal(mine.placement)}</b> with <b>{mine.score.toFixed(1)}</b> points
            {user && !user.isGuest && coins > 0 && <> and earned <b>🪙 {coins}</b> coins</>}.
          </div>
        )}

        <div style={styles.table}>
          <div style={styles.tableHeader}>
            <span>#</span>
            <span>Player</span>
            <span style={{ textAlign: 'right' }}>Score</span>
            <span style={{ textAlign: 'right' }}>Steamed</span>
            <span style={{ textAlign: 'right' }}>Answers</span>
          </div>
          {results.map((r, i) => (
            <div key={r.socketId} style={{ ...styles.tableRow, background: r.socketId === myId ? 'rgba(255,224,102,0.12)' : i === 0 ? 'rgba(241,196,15,0.06)' : 'transparent' }}>
              <span style={{ fontSize: '1.3rem' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}</span>
              <span style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span style={{ ...styles.dot, background: AVATAR_DEFAULTS[(r.colorIndex || 0) % 8].color }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.socketId === myId ? 'You' : r.displayName}
                </span>
                {r.isBot && <span style={styles.botTag}>BOT</span>}
              </span>
              <span style={{ color: '#7fc4ff', fontWeight: 'bold', textAlign: 'right' }}>{r.score.toFixed(1)}</span>
              <span style={{ textAlign: 'right', color: '#cfd6ea' }}>{r.steamCount}</span>
              <span style={{ textAlign: 'right', color: r.questionsAnswered > 0 ? '#2ecc71' : '#888' }}>
                {r.questionsAnswered > 0 ? `${r.questionsCorrect}/${r.questionsAnswered}` : '—'}
              </span>
            </div>
          ))}
        </div>

        <div style={styles.btnRow}>
          <button style={styles.playAgainBtn} onClick={handlePlayAgain}>▶ Play Again</button>
          <button style={styles.exitBtn} onClick={handleExit}>🏠 Main Menu</button>
        </div>
      </div>
    </div>
  );
}

function ordinal(n) {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th';
  return `${n}${suffix}`;
}

const styles = {
  backdrop: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(5,7,18,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    padding: 12,
  },
  panel: {
    background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
    border: '3px solid #f1c40f',
    borderRadius: 24,
    padding: 'clamp(20px, 5vw, 32px) clamp(14px, 4vw, 36px)',
    maxWidth: 600,
    width: '100%',
    color: '#fff',
    boxShadow: '0 0 60px rgba(241,196,15,0.3)',
    animation: 'sb-pop 0.3s ease-out',
  },
  title: { fontSize: 'clamp(1.5rem, 6vw, 2rem)', fontWeight: 'bold', textAlign: 'center', color: '#f1c40f', marginBottom: 10 },
  summary: { textAlign: 'center', color: '#dbe4ff', marginBottom: 20, lineHeight: 1.5 },
  table: { marginBottom: 24 },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '40px 1fr 60px 64px 68px',
    padding: '8px 10px',
    color: '#888',
    fontSize: '0.72rem',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '40px 1fr 60px 64px 68px',
    padding: '10px',
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 4,
    fontSize: '0.95rem',
  },
  dot: { width: 12, height: 12, borderRadius: '50%', flex: '0 0 auto' },
  botTag: { fontSize: '0.62rem', padding: '1px 5px', borderRadius: 4, background: 'rgba(124,247,255,0.15)', color: '#7cf7ff', flex: '0 0 auto' },
  btnRow: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  playAgainBtn: {
    flex: '1 1 160px',
    padding: '14px',
    borderRadius: 12,
    background: 'linear-gradient(135deg, #4A90D9, #2c3e50)',
    border: 'none',
    color: '#fff',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  exitBtn: {
    flex: '1 1 160px',
    padding: '14px',
    borderRadius: 12,
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: '#fff',
    fontSize: '1rem',
    cursor: 'pointer',
  },
};
