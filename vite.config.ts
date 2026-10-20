import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `process.cwd()` is the project root both locally and on Vercel/Netlify.
const srcDir = path.resolve(process.cwd(), 'src')

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [{ find: '@', replacement: srcDir }],
  },
  server: {
    port: 3000,
  },
  build: {
    // Split large vendor libraries so the first load stays small.
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('recharts') || id.includes('d3-')) return 'charts'
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('@tanstack')) return 'query'
          if (id.includes('@radix-ui')) return 'radix'
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('react-router'))
            return 'react'
          return 'vendor'
        },
      },
    },
  },
})
