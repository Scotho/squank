import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,     // bind to both localhost and your LAN IP
    port: 5173,     // same as your script
    open: true      // auto‑open your browser
  }
});