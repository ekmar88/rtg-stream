import preact from '@preact/preset-vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [preact()],
  server: {
    port: 3000,
    strictPort: true,
    host: true,
  },
  build: {
    target: 'es2020',
    sourcemap: false,
  },
})
