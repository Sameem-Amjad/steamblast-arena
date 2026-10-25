import { create } from 'zustand';
import api from '../utils/api';

export const useShopStore = create((set) => ({
  items: [],
  coins: 0,
  loading: false,
  purchaseResult: null,

  fetchItems: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/shop/items');
      set({ items: res.data.items, coins: res.data.coins, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  purchaseItem: async (itemId) => {
    try {
      const res = await api.post(`/shop/purchase/${itemId}`);
      set((state) => ({
        items: state.items.map((item) =>
          item.id === itemId ? { ...item, owned: true } : item
        ),
        coins: res.data.coins,
        purchaseResult: { success: true, message: res.data.message },
      }));
    } catch (err) {
      set({ purchaseResult: { success: false, error: err.response?.data?.error } });
    }
  },

  clearPurchaseResult: () => set({ purchaseResult: null }),
}));
