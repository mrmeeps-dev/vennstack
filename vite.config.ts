import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { versionPlugin } from './vite-plugin-version'
import { createHash } from 'crypto'

// Generate build hash for this build
const buildHash = createHash('sha256')
  .update(`${Date.now()}-${Math.random()}`)
  .digest('hex')
  .substring(0, 16)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
    }),
    versionPlugin(buildHash),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(buildHash),
  },
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 5173, // Default Vite port
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})

