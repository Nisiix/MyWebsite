import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// GitHub Pages serves the site from https://<user>.github.io/MyWebsite/,
// so production builds need that sub-path as base. Override with VITE_BASE
// (e.g. VITE_BASE=/ when using a custom domain).
export default defineConfig(({ command }) => ({
  base: process.env.VITE_BASE ?? (command === 'build' ? '/MyWebsite/' : '/'),
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
}))
