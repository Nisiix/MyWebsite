import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// GitHub Pages serves the site from https://<user>.github.io/<repo>/,
// so production builds need that sub-path as base. The deploy workflow sets
// VITE_BASE from the repository name; use VITE_BASE=/ for a custom domain.
export default defineConfig(({ command }) => ({
  base: process.env.VITE_BASE ?? (command === 'build' ? '/NisiixDev/' : '/'),
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
}))
