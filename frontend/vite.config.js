import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/static/app/',
  server: {
    port: 5173,
  },
  build: {
    outDir: resolve(__dirname, '../backend/static/app'),
    emptyOutDir: true,
  },
})
