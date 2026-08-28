import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Bind every interface: on Windows `localhost` resolves to ::1 first, so an
    // IPv6-only bind leaves http://127.0.0.1:3009 refusing connections.
    host: true,
    port: 3009,
    strictPort: true,
  },
})
