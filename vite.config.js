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
            // SECURITY: API key moved to microservice - this proxy is now disabled
            // All Lurky requests should go through the secure microservice
            console.warn('⚠️ Direct Lurky proxy is disabled. Use microservice endpoints instead.');
          });
        }
      }
    }
  }
})
