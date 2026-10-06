import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base is set at build time so the bundle works from a GitHub Pages subpath.
export default defineConfig({
  root: __dirname,
  base: process.env.DEMO_BASE ?? '/',
  plugins: [react()],
  resolve: {
    alias: { '@kit': resolve(__dirname, '../src') },
  },
  build: {
    outDir: resolve(__dirname, '../demo-dist'),
    emptyOutDir: true,
  },
})
