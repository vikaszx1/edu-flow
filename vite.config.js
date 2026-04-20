import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Optional: ensures the server exits if port 3000 is already in use
    strictPort: true, 
    // Optional: opens the browser automatically on start
    open: true 
  }
})
