import React, { useEffect, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { emit } from '../networking/gameSync';

export default function ChamberOverlay() {
  const question = useGameStore((s) => s.chamberQuestion);
  const lastResult = useGameStore((s) => s.lastAnswerResult);
  const streak = useGameStore((s) => s.chamberStreak);
  const [timeLeft, setTimeLeft] = useState(15);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setTimeLeft(15);
    setSelected(null);
  }, [question]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [question]);

  if (!question) return null;

  const handleAnswer = (index) => {
    if (selected !== null) return;
    setSelected(index);
    emit.answer(index);
  };

  const timerColor = timeLeft > 8 ? '#2ecc71' : timeLeft > 4 ? '#f39c12' : '#e74c3c';

  return (
    <div style={styles.backdrop}>
      <div style={styles.panel}>
        <div style={styles.header}>
          <div style={styles.headerIcon}>☁️</div>
          <div>
            <div style={styles.title}>THE CHAMBER</div>
            <div style={styles.subtitle}>Answer to jump back in!</div>
          </div>
          <div style={styles.headerIcon}>☁️</div>
        </div>

        {streak > 0 && (
          <div style={styles.streak}>
            {'🔥'.repeat(Math.min(streak, 5))} Streak × {streak}
          </div>
        )}

        <div style={styles.questionText}>{question.questionText}</div>

        <div style={styles.optionsGrid}>
          {question.options.map((opt, i) => {
            let bg = 'rgba(255,255,255,0.08)';
            let border = 'rgba(255,255,255,0.2)';
            if (selected !== null) {
              if (lastResult?.correct && selected === i) { bg = 'rgba(46,204,113,0.3)'; border = '#2ecc71'; }
              else if (!lastResult?.correct && selected === i) { bg = 'rgba(231,76,60,0.3)'; border = '#e74c3c'; }
            }
            return (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={selected !== null}
                style={{ ...styles.optBtn, background: bg, borderColor: border }}
              >
                {opt.text}
              </button>
            );
          })}
        </div>

        {lastResult && !lastResult.correct && (
          <div style={{ color: '#e74c3c', textAlign: 'center', marginTop: 8 }}>
            {lastResult.timeout ? 'Time up! Try again...' : `Wrong! Correct: ${lastResult.correctAnswer}`}
          </div>
        )}

        {lastResult?.correct && (
          <div style={{ color: '#2ecc71', textAlign: 'center', marginTop: 8, fontSize: '1.2rem' }}>
            ✅ Correct! Respawning...
            {lastResult.fastAnswer && ' ⚡ Speed Boost!'}
          </div>
        )}

        <div style={{ ...styles.timer, color: timerColor }}>
          ⏱️ {timeLeft}s remaining
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
    border: '3px solid #4A90D9',
    borderRadius: 24,
    padding: '32px 40px',
    maxWidth: 560,
    width: '90%',
    color: '#fff',
    boxShadow: '0 0 60px rgba(74,144,217,0.4)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerIcon: { fontSize: '2rem' },
  title: { fontSize: '1.5rem', fontWeight: 'bold', color: '#4A90D9', textAlign: 'center' },
  subtitle: { fontSize: '0.85rem', color: '#aaa', textAlign: 'center' },
  streak: { textAlign: 'center', fontSize: '1rem', marginBottom: 12, color: '#f39c12' },
  questionText: {
    fontSize: '1.4rem',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 1.4,
    minHeight: 60,
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    marginBottom: 16,
  },
  optBtn: {
    padding: '14px 10px',
    borderRadius: 12,
    border: '2px solid',
    background: 'rgba(255,255,255,0.08)',
    color: '#fff',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontWeight: 'bold',
  },
  timer: {
    textAlign: 'center',
    fontSize: '1rem',
    marginTop: 8,
    fontWeight: 'bold',
  },
};
