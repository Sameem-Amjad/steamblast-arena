import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import { emit } from '../networking/gameSync';

export default function ResultsOverlay() {
  const navigate = useNavigate();
  const results = useGameStore((s) => s.roundResults);
  const mode = useGameStore((s) => s.mode);
  const difficulty = useGameStore((s) => s.difficulty);
  const startMatchmaking = useGameStore((s) => s.startMatchmaking);
  const reset = useGameStore((s) => s.reset);

  if (!results) return null;

  const handlePlayAgain = () => {
    startMatchmaking();
    emit.joinMatchmaking(mode, difficulty);
  };

  const handleExit = () => {
    reset();
    navigate('/');
  };

  return (
    <div style={styles.backdrop}>
      <div style={styles.panel}>
        <div style={styles.title}>🏆 Round Over! 🏆</div>

        <div style={styles.table}>
          <div style={styles.tableHeader}>
            <span>#</span>
            <span>Player</span>
            <span>Score</span>
            <span>Accuracy</span>
          </div>
          {results.map((r, i) => (
            <div key={r.socketId} style={{ ...styles.tableRow, background: i === 0 ? 'rgba(241,196,15,0.1)' : 'transparent' }}>
              <span style={{ fontSize: '1.4rem' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}</span>
              <span style={{ fontWeight: 'bold' }}>{r.displayName}</span>
              <span style={{ color: '#4A90D9', fontWeight: 'bold' }}>{r.score.toFixed(1)}</span>
              <span style={{ color: r.questionsAnswered > 0 ? '#2ecc71' : '#888' }}>
                {r.questionsAnswered > 0
                  ? `${Math.round((r.questionsCorrect / r.questionsAnswered) * 100)}%`
                  : '—'}
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

const styles = {
  backdrop: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  panel: {
    background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
    border: '3px solid #f1c40f',
    borderRadius: 24,
    padding: '32px 40px',
    maxWidth: 560,
    width: '90%',
    color: '#fff',
    boxShadow: '0 0 60px rgba(241,196,15,0.3)',
  },
  title: { fontSize: '2rem', fontWeight: 'bold', textAlign: 'center', color: '#f1c40f', marginBottom: 24 },
  table: { marginBottom: 24 },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '50px 1fr 80px 80px',
    padding: '8px 12px',
    color: '#888',
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '50px 1fr 80px 80px',
    padding: '12px',
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 4,
  },
  btnRow: { display: 'flex', gap: 12 },
  playAgainBtn: {
    flex: 1,
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
    flex: 1,
    padding: '14px',
    borderRadius: 12,
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: '#fff',
    fontSize: '1rem',
    cursor: 'pointer',
  },
};
