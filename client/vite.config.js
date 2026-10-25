import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'SteamBlast Arena',
        short_name: 'SteamBlast',
        description: 'Multiplayer educational blast game for kids',
        theme_color: '#4A90D9',
        background_color: '#1a1a2e',
        display: 'standalone',
        orientation: 'landscape',
        icons: [
          { src: '/assets/ui/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/assets/ui/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  optimizeDeps: {
    include: ['steamblast-shared'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:3001', ws: true },
    },
  },
});
