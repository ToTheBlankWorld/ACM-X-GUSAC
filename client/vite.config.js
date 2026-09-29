import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The dev server binds to loopback only and proxies /api to the local
// Express server. Nothing is exposed beyond this machine.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
    },
  },
});
