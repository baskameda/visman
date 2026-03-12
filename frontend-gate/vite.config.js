import { defineConfig } from 'vite'
import react    from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Gate Check-In',
        short_name: 'GateIn',
        theme_color: '#531dab',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        runtimeCaching: [],
      },
    }),
  ],
  server: {
    port: 5177,
    https: true,
    proxy: {
      '/engine-rest': { target: 'http://localhost:8080', changeOrigin: true },
      '/api':         { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
})
