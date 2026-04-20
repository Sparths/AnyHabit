import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // <-- NEU

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss],
})
