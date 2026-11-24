import { ref, watch } from 'vue'

// Tema chiaro/scuro. La scelta resta salvata; alla prima visita segue il sistema.
// index.html applica il tema salvato prima del caricamento, per evitare lampi di colore.
const STORAGE_KEY = 'nisiix-theme'
const THEME_COLORS = { dark: '#0a0a0a', light: '#f7f5ef' }

function initialTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // storage non disponibile
  }
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export const theme = ref(initialTheme())

export function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  try {
    localStorage.setItem(STORAGE_KEY, theme.value)
  } catch {
    // ignora
  }
}

watch(
  theme,
  (value) => {
    document.documentElement.dataset.theme = value
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[value])
  },
  { immediate: true }
)
