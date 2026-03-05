import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    port: 5174,
    proxy: {
      '/engine-rest': { target: 'http://localhost:8080', changeOrigin: true },
      '/api':         { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
})