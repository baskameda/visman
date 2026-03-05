import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

let sslPlugin = []
try {
  const { default: basicSsl } = await import('@vitejs/plugin-basic-ssl')
  sslPlugin = [basicSsl()]
} catch {
  // plugin not available — https:true below will use Vite's own cert
}

export default defineConfig({
  plugins: [react(), ...sslPlugin],
  server: {
    port: 5174,
    https: true,
    proxy: {
      '/engine-rest': { target: 'http://localhost:8080', changeOrigin: true },
      '/api':         { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
})
