import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,

    // 👇 AJOUT POUR NGROK
    allowedHosts: [
      'damon-intervesicular-indicatively.ngrok-free.dev',
    ],

    proxy: {
      '/api': 'http://localhost:8080',
      '/callback': 'http://localhost:8080'
    },
  },
})
