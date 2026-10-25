import { create } from 'zustand';
import api from '../utils/api';

export const useUserStore = create((set, get) => ({
  user: null,
  token: null,
  loading: false,
  error: null,

  restoreSession: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const res = await api.get('/auth/me');
      set({ user: res.data.user, token });
    } catch {
      localStorage.removeItem('token');
    }
  },

  register: async ({ email, password, displayName, role, parentEmail }) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/register', { email, password, displayName, role, parentEmail });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      set({ user, token, loading: false });
      return { success: true };
    } catch (err) {
      const error = err.response?.data?.error || 'Registration failed';
      set({ error, loading: false });
      return { success: false, error };
    }
  },

  login: async ({ email, password }) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      set({ user, token, loading: false });
      return { success: true };
    } catch (err) {
      const error = err.response?.data?.error || 'Login failed';
      set({ error, loading: false });
      return { success: false, error };
    }
  },

  loginAsGuest: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/guest');
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      set({ user, token, loading: false });
      return { success: true };
    } catch (err) {
      set({ loading: false });
      return { success: false };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    set({ user: null, token: null });
  },

  updateProfile: async (data) => {
    try {
      const res = await api.patch('/users/profile', data);
      set({ user: res.data.user });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error };
    }
  },

  refreshUser: async () => {
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data.user });
    } catch {}
  },
}));
