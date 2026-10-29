import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useUserStore } from './stores/userStore';
import MainMenu from './components/MainMenu';
import AvatarCreator from './components/AvatarCreator';
import Shop from './components/Shop';
import Leaderboard from './components/Leaderboard';
import TeacherDashboard from './components/TeacherDashboard';
import ParentPortal from './components/ParentPortal';
import Settings from './components/Settings';
import AuthPage from './components/AuthPage';
import PaymentSuccess from './components/PaymentSuccess';

// The game screen carries Phaser, so it loads on its own after the menu.
const GameCanvas = lazy(() => import('./components/GameCanvas'));

function PrivateRoute({ children, requiresRole }) {
  const user = useUserStore((s) => s.user);
  const restoring = useUserStore((s) => s.restoring);
  if (restoring) return <div style={{ minHeight: '100vh', background: '#1a1a2e' }} />;
  if (!user || user.isGuest) return <Navigate to="/auth" replace />;
  if (requiresRole && user.role !== requiresRole && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  const restoreSession = useUserStore((s) => s.restoreSession);

  useEffect(() => {
    restoreSession();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/game" element={(
          <Suspense fallback={<div style={{ position: 'fixed', inset: 0, background: '#12152a' }} />}>
            <GameCanvas />
          </Suspense>
        )} />
        <Route path="/avatar" element={
          <PrivateRoute><AvatarCreator /></PrivateRoute>
        } />
        <Route path="/shop" element={
          <PrivateRoute><Shop /></PrivateRoute>
        } />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/teacher" element={
          <PrivateRoute requiresRole="teacher"><TeacherDashboard /></PrivateRoute>
        } />
        <Route path="/parent" element={
          <PrivateRoute><ParentPortal /></PrivateRoute>
        } />
        <Route path="/settings" element={
          <PrivateRoute><Settings /></PrivateRoute>
        } />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
