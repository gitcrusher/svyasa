import react from '@vitejs/plugin-react'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'

const frontendRoot = dirname(fileURLToPath(import.meta.url))
const backendRoot = resolve(frontendRoot, '../backend')
const apiProxy = {
  '/api': {
    target: 'http://127.0.0.1:5001',
    changeOrigin: true,
  },
}

export default defineConfig(({ mode }) => {
  const frontendEnv = loadEnv(mode, frontendRoot, 'VITE_')
  const backendEnv = loadEnv(mode, backendRoot, '')

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(
        frontendEnv.VITE_SUPABASE_URL || backendEnv.SUPABASE_URL || '',
      ),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(
        frontendEnv.VITE_SUPABASE_PUBLISHABLE_KEY || backendEnv.SUPABASE_PUBLISHABLE_KEY || '',
      ),
    },
    server: { proxy: apiProxy },
    preview: { proxy: apiProxy },
  }
})
