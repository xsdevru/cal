import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Фронтенд ходит в API по /api, Vite проксирует это на реальный бэкенд (Fastify, :3000).
// Мок Prism (:4010) остаётся доступен для контрактных проверок через `make demo-mock`.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
})
