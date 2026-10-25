import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Phaser from 'phaser';
import { createPhaserConfig } from '../game/config';
import { useGameStore } from '../stores/gameStore';
import ChamberOverlay from './ChamberOverlay';
import ResultsOverlay from './ResultsOverlay';

export default function GameCanvas() {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const navigate = useNavigate();

  const gameState = useGameStore((s) => s.gameState);
  const countdown = useGameStore((s) => s.countdown);

  useEffect(() => {
    if (!containerRef.current) return;
    const config = createPhaserConfig(containerRef.current);
    gameRef.current = new Phaser.Game(config);

    return () => {
      gameRef.current?.destroy(true);
    };
  }, []);

  useEffect(() => {
    if (gameState === null) navigate('/');
  }, [gameState]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Countdown overlay */}
      {gameState === 'countdown' && countdown !== null && (
        <div style={overlayStyles.center}>
          <div style={overlayStyles.countdown}>{countdown}</div>
        </div>
      )}

      {/* Matchmaking overlay */}
      {gameState === 'matchmaking' && (
        <div style={overlayStyles.center}>
          <div style={overlayStyles.matchmaking}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
            <div style={{ fontSize: '1.2rem', color: '#4A90D9' }}>Finding players...</div>
            <div style={{ fontSize: '0.85rem', color: '#888', marginTop: 8 }}>Game starts with 2+ players</div>
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

const overlayStyles = {
  center: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.6)',
    zIndex: 100,
  },
  countdown: {
    fontSize: '8rem',
    fontWeight: 'bold',
    color: '#f1c40f',
    textShadow: '0 0 40px #f1c40f',
  },
  matchmaking: {
    background: 'rgba(26,26,46,0.95)',
    border: '2px solid #4A90D9',
    borderRadius: 20,
    padding: '40px 60px',
    textAlign: 'center',
    color: '#fff',
  },
};
