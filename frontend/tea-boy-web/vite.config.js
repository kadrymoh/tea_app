import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/tenant/kitchen/',
  server: {
    port: 5174,
    open: true,
    // IMPORTANT: Enable fallback for SPA routing
    historyApiFallback: true
  },
  // Ensure proper routing handling
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
})