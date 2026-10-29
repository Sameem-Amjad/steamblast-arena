import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Phaser from 'phaser';
import { AVATAR_DEFAULTS } from 'steamblast-shared/gameConstants';
import { createPhaserConfig, isTouchDevice, NARROW_WIDTH } from '../game/config';
import { useGameStore } from '../stores/gameStore';
import { emit } from '../networking/gameSync';
import ChamberOverlay from './ChamberOverlay';
import ResultsOverlay from './ResultsOverlay';

const MODE_LABEL = { maths: '🔢 Maths Blast', literacy: '📖 Literacy Blast', mixed: '🎲 Mixed Mode' };
const LEVEL_LABEL = { 1: 'Ages 5-7', 2: 'Ages 7-9', 3: 'Ages 9-12' };

function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function GameCanvas() {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const navigate = useNavigate();

  const gameState = useGameStore((s) => s.gameState);
  const countdown = useGameStore((s) => s.countdown);
  const error = useGameStore((s) => s.error);
  const botFillSeconds = useGameStore((s) => s.botFillSeconds);
  const reset = useGameStore((s) => s.reset);
  const [narrow, setNarrow] = useState(window.innerWidth < NARROW_WIDTH);
  const touch = isTouchDevice();

  useEffect(() => {
    if (!containerRef.current) return;
    const config = createPhaserConfig(containerRef.current);
    gameRef.current = new Phaser.Game(config);

    const onResize = () => setNarrow(window.innerWidth < NARROW_WIDTH);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      gameRef.current?.destroy(true);
    };
  }, []);

  useEffect(() => {
    if (gameState === null) navigate('/');
  }, [gameState]);

  const leave = () => {
    emit.leaveMatchmaking();
    emit.leaveRoom();
    reset();
  };

  return (
    <div style={styles.page}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

      {(gameState === 'playing' || gameState === 'chamber') && <Hud narrow={narrow} onLeave={leave} />}
      {gameState === 'playing' && touch && <TouchControls />}

      {/* Countdown overlay */}
      {gameState === 'countdown' && countdown !== null && (
        <div style={styles.center}>
          <div>
            <div key={countdown} style={styles.countdown}>{countdown}</div>
            <div style={{ textAlign: 'center', color: '#cfe6ff', fontSize: '1.1rem' }}>Get ready to blast!</div>
          </div>
        </div>
      )}

      {/* Matchmaking overlay */}
      {gameState === 'matchmaking' && !error && (
        <div style={styles.center}>
          <div style={styles.card}>
            <div style={styles.spinner} />
            <div style={{ fontSize: '1.3rem', color: '#4A90D9', fontWeight: 'bold' }}>Finding players…</div>
            <div style={{ fontSize: '0.9rem', color: '#9aa4c0', marginTop: 8, lineHeight: 1.5 }}>
              {botFillSeconds > 0
                ? `If nobody else is online, friendly bots join in ${botFillSeconds} seconds.`
                : 'The game starts as soon as another player joins.'}
            </div>
            <div style={styles.howTo}>
              <div>💦 Spray water to steam other players</div>
              <div>☁️ Get steamed? Answer a question to jump back in</div>
              <div>⭐ Crates hide power-ups</div>
            </div>
            <button onClick={leave} style={styles.ghostBtn}>Cancel</button>
          </div>
        </div>
      )}

      {error && (
        <div style={styles.center}>
          <div style={styles.card}>
            <div style={{ fontSize: '2.4rem', marginBottom: 8 }}>{error.code === 'time_limit' ? '⏰' : '⚠️'}</div>
            <div style={{ fontSize: '1.1rem', marginBottom: 18 }}>{error.message || 'Something went wrong.'}</div>
            <button onClick={leave} style={styles.primaryBtn}>Back to menu</button>
          </div>
        </div>
      )}

      {/* Chamber overlay */}
      {gameState === 'chamber' && <ChamberOverlay />}

      {/* Results overlay */}
      {gameState === 'results' && <ResultsOverlay />}
    </div>
  );
}

function Hud({ narrow, onLeave }) {
  const players = useGameStore((s) => s.players);
  const myId = useGameStore((s) => s.mySocketId);
  const timeRemaining = useGameStore((s) => s.timeRemaining);
  const mode = useGameStore((s) => s.mode);
  const difficulty = useGameStore((s) => s.difficulty);
  const feed = useGameStore((s) => s.feed);
  const [, setNow] = useState(0);
  const [showHelp, setShowHelp] = useState(true);

  // Re-render so feed items fade out on time.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    const help = setTimeout(() => setShowHelp(false), 7000);
    return () => { clearInterval(t); clearTimeout(help); };
  }, []);

  const me = players[myId];
  const ranking = Object.values(players).sort((a, b) => b.score - a.score);
  const recent = feed.filter((f) => Date.now() - f.at < 4000);
  const low = timeRemaining <= 30;

  return (
    <>
      <div style={styles.topBar}>
        <div style={styles.chip}>{MODE_LABEL[mode]} · {LEVEL_LABEL[difficulty]}</div>
        <div style={{ ...styles.timer, color: low ? '#ff6b6b' : '#fff' }} data-testid="timer">{formatTime(timeRemaining)}</div>
        <button onClick={onLeave} style={styles.leaveBtn} aria-label="Leave game">✕ Leave</button>
      </div>

      <div style={narrow ? styles.scoresRow : styles.scoresPanel} data-testid="scoreboard">
        {!narrow && <div style={styles.panelTitle}>Scores</div>}
        {ranking.map((p) => (
          <div key={p.socketId} style={narrow ? styles.scoreChip : styles.scoreRow(p.socketId === myId)}>
            <span style={{ ...styles.dot, background: AVATAR_DEFAULTS[p.colorIndex % 8]?.color }} />
            <span style={styles.scoreName}>
              {p.socketId === myId ? 'You' : p.displayName}
              {p.isBot && !narrow && <span style={styles.botTag}>BOT</span>}
              {p.inChamber && ' ☁️'}
            </span>
            <span style={styles.scoreValue}>{Number(p.score || 0).toFixed(1)}</span>
          </div>
        ))}
      </div>

      {me && !narrow && (
        <div style={styles.statsPanel}>
          <div style={styles.panelTitle}>Your gear</div>
          <div>💧 Water <b>{me.waterCapacity}</b></div>
          <div>🎯 Range <b>{me.sprayRange}</b></div>
          <div>⚡ Speed <b>{Number(me.speed || 1).toFixed(2)}×</b></div>
          {me.superSprayReady && <div style={{ color: '#d6a2ff' }}>🌊 Super spray ready!</div>}
        </div>
      )}

      <div style={{ ...styles.feed, bottom: isTouchDevice() ? 196 : 24 }}>
        {recent.map((f) => (
          <div key={f.id} style={styles.feedItem(f.tone)}>{f.text}</div>
        ))}
      </div>

      {showHelp && !isTouchDevice() && (
        <div style={styles.help}>
          <span style={styles.key}>←↑↓→</span> or <span style={styles.key}>WASD</span> to move ·{' '}
          <span style={styles.key}>Space</span> to spray
        </div>
      )}
    </>
  );
}

function TouchControls() {
  const setTouchDir = useGameStore((s) => s.setTouchDir);
  const pressSpray = useGameStore((s) => s.pressSpray);

  const hold = (dir) => ({
    onPointerDown: (e) => { e.preventDefault(); setTouchDir(dir); },
    onPointerUp: () => setTouchDir(null),
    onPointerLeave: () => setTouchDir(null),
    onPointerCancel: () => setTouchDir(null),
  });

  useEffect(() => () => setTouchDir(null), []);

  return (
    <div style={styles.touchArea}>
      <div style={styles.dpad}>
        <button style={{ ...styles.padBtn, gridArea: 'up' }} aria-label="Move up" {...hold('up')}>▲</button>
        <button style={{ ...styles.padBtn, gridArea: 'left' }} aria-label="Move left" {...hold('left')}>◀</button>
        <button style={{ ...styles.padBtn, gridArea: 'right' }} aria-label="Move right" {...hold('right')}>▶</button>
        <button style={{ ...styles.padBtn, gridArea: 'down' }} aria-label="Move down" {...hold('down')}>▼</button>
      </div>
      <button
        style={styles.sprayBtn}
        aria-label="Spray water"
        onPointerDown={(e) => { e.preventDefault(); pressSpray(); }}
      >
        💦
        <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>SPRAY</span>
      </button>
    </div>
  );
}

const panel = {
  background: 'rgba(14,17,36,0.82)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 14,
  backdropFilter: 'blur(6px)',
};

const styles = {
  page: { position: 'fixed', inset: 0, overflow: 'hidden', background: '#12152a', touchAction: 'none', userSelect: 'none' },
  center: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(5,7,18,0.62)',
    zIndex: 100,
    padding: 16,
  },
  countdown: {
    fontSize: '8rem',
    fontWeight: 'bold',
    color: '#f1c40f',
    textShadow: '0 0 40px #f1c40f',
    textAlign: 'center',
    animation: 'sb-pop 0.9s ease-out',
  },
  card: {
    background: 'rgba(26,26,46,0.96)',
    border: '2px solid #4A90D9',
    borderRadius: 20,
    padding: '32px 28px',
    textAlign: 'center',
    color: '#fff',
    maxWidth: 420,
    width: '100%',
  },
  spinner: {
    width: 44,
    height: 44,
    margin: '0 auto 16px',
    borderRadius: '50%',
    border: '4px solid rgba(74,144,217,0.25)',
    borderTopColor: '#4A90D9',
    animation: 'sb-spin 0.9s linear infinite',
  },
  howTo: {
    margin: '20px 0',
    padding: '14px 16px',
    borderRadius: 12,
    background: 'rgba(255,255,255,0.05)',
    textAlign: 'left',
    fontSize: '0.9rem',
    lineHeight: 1.9,
    color: '#dbe4ff',
  },
  primaryBtn: { padding: '12px 28px', borderRadius: 12, background: '#4A90D9', border: 'none', color: '#fff', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' },
  ghostBtn: { padding: '10px 24px', borderRadius: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.25)', color: '#cfd6ea', cursor: 'pointer', fontSize: '0.9rem' },
  topBar: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    zIndex: 20,
    pointerEvents: 'none',
  },
  chip: { ...panel, padding: '8px 12px', fontSize: '0.82rem', color: '#cfe6ff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, flex: '0 1 auto' },
  timer: { ...panel, padding: '6px 16px', fontSize: '1.5rem', fontWeight: 'bold', fontVariantNumeric: 'tabular-nums', flex: '0 0 auto' },
  leaveBtn: { ...panel, padding: '8px 12px', color: '#ffb3b3', cursor: 'pointer', fontSize: '0.85rem', pointerEvents: 'auto', flex: '0 0 auto' },
  scoresPanel: { ...panel, position: 'absolute', top: 72, left: 12, width: 210, padding: 12, zIndex: 20, color: '#fff' },
  scoresRow: { position: 'absolute', top: 60, left: 8, right: 8, display: 'flex', gap: 6, overflowX: 'auto', zIndex: 20 },
  panelTitle: { fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 1, color: '#8d97b5', marginBottom: 8 },
  scoreRow: (mine) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 8px',
    borderRadius: 8,
    background: mine ? 'rgba(255,224,102,0.12)' : 'transparent',
    fontSize: '0.92rem',
  }),
  scoreChip: { ...panel, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', fontSize: '0.8rem', color: '#fff', whiteSpace: 'nowrap', borderRadius: 10 },
  dot: { width: 12, height: 12, borderRadius: '50%', flex: '0 0 auto', boxShadow: '0 0 0 2px rgba(255,255,255,0.25)' },
  scoreName: { flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  botTag: { marginLeft: 6, fontSize: '0.62rem', padding: '1px 5px', borderRadius: 4, background: 'rgba(124,247,255,0.15)', color: '#7cf7ff', verticalAlign: 'middle' },
  scoreValue: { fontWeight: 'bold', color: '#7fc4ff', fontVariantNumeric: 'tabular-nums' },
  statsPanel: { ...panel, position: 'absolute', top: 72, right: 12, width: 190, padding: 12, zIndex: 20, color: '#e8ecf8', fontSize: '0.9rem', lineHeight: 1.8 },
  feed: { position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', zIndex: 25, pointerEvents: 'none', width: 'min(92vw, 420px)' },
  feedItem: (tone) => ({
    ...panel,
    padding: '7px 14px',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    color: tone === 'bad' ? '#ff9a9a' : tone === 'good' ? '#8ff0b4' : '#e8ecf8',
    animation: 'sb-rise 0.25s ease-out',
  }),
  help: { ...panel, position: 'absolute', bottom: 24, right: 16, padding: '10px 14px', color: '#cfd6ea', fontSize: '0.85rem', zIndex: 20 },
  key: { display: 'inline-block', padding: '1px 7px', borderRadius: 6, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 'bold', color: '#fff' },
  touchArea: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 12px', zIndex: 30 },
  dpad: {
    display: 'grid',
    gridTemplateAreas: '". up ." "left . right" ". down ."',
    gridTemplateColumns: '54px 54px 54px',
    gridTemplateRows: '50px 50px 50px',
    gap: 2,
  },
  padBtn: { ...panel, borderRadius: 14, color: '#fff', fontSize: '1.3rem', touchAction: 'none' },
  sprayBtn: {
    width: 104,
    height: 104,
    borderRadius: '50%',
    border: '3px solid rgba(143,208,255,0.8)',
    background: 'radial-gradient(circle at 35% 30%, #6fb9ff, #1f6fd1)',
    color: '#fff',
    fontSize: '2.2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 24px rgba(31,111,209,0.5)',
    touchAction: 'none',
  },
};
