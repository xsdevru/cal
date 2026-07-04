import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Фронтенд ходит в API по /api, Vite проксирует это на мок-сервер Prism (:4010).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4010',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
})
