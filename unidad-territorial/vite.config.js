import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Redirige cualquier solicitud que comience con /api
      '/api': {
        // Apunta a tu servidor backend
        target: 'http://localhost:4010', 
        changeOrigin: true,
        secure: false, 
      }
    }
  }
})
