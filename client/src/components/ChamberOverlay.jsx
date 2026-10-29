import React, { useEffect, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { emit } from '../networking/gameSync';

export default function ChamberOverlay() {
  const question = useGameStore((s) => s.chamberQuestion);
  const lastResult = useGameStore((s) => s.lastAnswerResult);
  const streak = useGameStore((s) => s.chamberStreak);
  const limit = question?.timeLimit || 15;
  const [timeLeft, setTimeLeft] = useState(limit);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setTimeLeft(limit);
    setSelected(null);
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [question]);

  if (!question) return null;

  const answered = selected !== null || lastResult?.timeout;
  const waiting = lastResult && !lastResult.correct;

  const handleAnswer = (index) => {
    if (answered) return;
    setSelected(index);
    emit.answer(index);
  };

  const timerColor = timeLeft > 8 ? '#2ecc71' : timeLeft > 4 ? '#f39c12' : '#e74c3c';

  return (
    <div style={styles.backdrop}>
      <div style={styles.panel} role="dialog" aria-label="The Chamber">
        <div style={styles.header}>
          <div style={styles.headerIcon}>☁️</div>
          <div>
            <div style={styles.title}>THE CHAMBER</div>
            <div style={styles.subtitle}>You've been steamed! Answer to jump back in.</div>
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
            if (selected === i && lastResult?.correct) { bg = 'rgba(46,204,113,0.3)'; border = '#2ecc71'; }
            else if (selected === i && lastResult && !lastResult.correct) { bg = 'rgba(231,76,60,0.3)'; border = '#e74c3c'; }
            else if (selected === i) { bg = 'rgba(74,144,217,0.25)'; border = '#4A90D9'; }
            else if (waiting && !lastResult.timeout && opt.text === lastResult.correctAnswer) { border = '#2ecc71'; }
            return (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={answered}
                style={{ ...styles.optBtn, background: bg, borderColor: border, cursor: answered ? 'default' : 'pointer' }}
              >
                {opt.text}
              </button>
            );
          })}
        </div>

        {waiting && (
          <div style={{ color: '#ff8a80', textAlign: 'center', marginTop: 8, lineHeight: 1.5 }}>
            {lastResult.timeout ? "Time's up!" : `Not quite! The answer was ${lastResult.correctAnswer}.`}
            <div style={{ color: '#aab', fontSize: '0.9rem' }}>A new question is on its way…</div>
          </div>
        )}

        {lastResult?.correct && (
          <div style={{ color: '#2ecc71', textAlign: 'center', marginTop: 8, fontSize: '1.2rem', fontWeight: 'bold' }}>
            ✅ Correct! Respawning with a shield…
            {lastResult.fastAnswer && <div style={{ color: '#f1c40f' }}>⚡ Speedy answer: speed boost!</div>}
          </div>
        )}

        {!lastResult && (
          <div style={{ ...styles.timer, color: timerColor }}>
            ⏱️ {timeLeft}s left
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(5,7,18,0.82)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    padding: 12,
  },
  panel: {
    background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
    border: '3px solid #4A90D9',
    borderRadius: 24,
    padding: 'clamp(20px, 5vw, 32px) clamp(16px, 5vw, 40px)',
    maxWidth: 560,
    width: '100%',
    color: '#fff',
    boxShadow: '0 0 60px rgba(74,144,217,0.4)',
    animation: 'sb-pop 0.3s ease-out',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  headerIcon: { fontSize: '2rem' },
  title: { fontSize: '1.5rem', fontWeight: 'bold', color: '#4A90D9', textAlign: 'center' },
  subtitle: { fontSize: '0.85rem', color: '#aab', textAlign: 'center' },
  streak: { textAlign: 'center', fontSize: '1rem', marginBottom: 12, color: '#f39c12' },
  questionText: {
    fontSize: 'clamp(1.15rem, 4.5vw, 1.45rem)',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 22,
    lineHeight: 1.4,
    minHeight: 60,
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 12,
    marginBottom: 16,
  },
  optBtn: {
    padding: '14px 10px',
    borderRadius: 12,
    border: '2px solid',
    background: 'rgba(255,255,255,0.08)',
    color: '#fff',
    fontSize: '1.05rem',
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
