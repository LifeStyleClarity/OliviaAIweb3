import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  optimizeDeps: {
    include: ['@dfinity/agent', '@dfinity/candid', '@dfinity/principal', '@dfinity/identity']
  },
  server: {
    proxy: {
      '/lurky': {
        target: 'https://api.lurky.app',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/lurky/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            const apiKey = '4xxIvRdkAhVISB6nKzUGclWVQnh-oVymYw3VNDrtdeg';
            proxyReq.setHeader('x-lurky-api-key', apiKey);
          });
        }
      }
    }
  }
})
