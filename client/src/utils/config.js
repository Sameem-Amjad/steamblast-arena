import { useEffect, useState } from 'react';
import api from './api';

// Server settings the UI depends on, such as demo mode and the shared demo logins.
let cached = null;
let pending = null;

export function loadConfig() {
  if (cached) return Promise.resolve(cached);
  pending ||= api.get('/config')
    .then((res) => (cached = res.data))
    .catch(() => (cached = { demoMode: false, paymentsEnabled: false, demoAccounts: [] }));
  return pending;
}

export function useAppConfig() {
  const [config, setConfig] = useState(cached);
  useEffect(() => {
    if (!cached) loadConfig().then(setConfig);
  }, []);
  return config;
}
