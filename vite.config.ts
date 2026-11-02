import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages publica el sitio en https://dagopy.github.io/huerto-ibero/
  base: '/huerto-ibero/',
  plugins: [react()],
})
