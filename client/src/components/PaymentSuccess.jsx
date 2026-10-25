import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const refreshUser = useUserStore((s) => s.refreshUser);

  useEffect(() => {
    // Wait a moment for webhook to process, then refresh user
    const timer = setTimeout(() => refreshUser(), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>⭐</div>
        <h2 style={{ color: '#f1c40f', fontSize: '2rem', marginBottom: 12 }}>Welcome to Premium!</h2>
        <p style={{ color: '#aaa', marginBottom: 24 }}>
          Your subscription is now active. Enjoy your custom avatar, weekly shop, and all premium perks!
        </p>
        <button onClick={() => navigate('/')}
          style={{ padding: '14px 32px', borderRadius: 12, background: '#4A90D9', border: 'none', color: '#fff', fontSize: '1.1rem', cursor: 'pointer', fontWeight: 'bold' }}>
          Start Playing 💦
        </button>
      </div>
    </div>
  );
}
