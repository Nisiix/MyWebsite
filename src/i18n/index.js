import { ref, watch } from 'vue'
import { messages } from './messages'

// Lingue disponibili. Per aggiungerne una: aggiungi la chiave qui e in messages.js.
export const LOCALES = [
  { code: 'it', label: 'Italiano', short: 'IT' },
  { code: 'en', label: 'English', short: 'EN' }
]

const STORAGE_KEY = 'nisiix-lang'

function initialLocale() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && messages[saved]) return saved
  } catch {
    // storage non disponibile: si usa la lingua del browser
  }
  return (navigator.language || 'it').toLowerCase().startsWith('it') ? 'it' : 'en'
}

export const locale = ref(initialLocale())

watch(
  locale,
  (code) => {
    try {
      localStorage.setItem(STORAGE_KEY, code)
    } catch {
      // ignora
    }
    document.documentElement.lang = code
  },
  { immediate: true }
)

// Testo dell'interfaccia: t('home.title'). Se manca in una lingua usa l'italiano.
export function t(key) {
  const get = (dict) => key.split('.').reduce((o, k) => (o == null ? o : o[k]), dict)
  return get(messages[locale.value]) ?? get(messages.it) ?? key
}

// Dato bilingue negli store: { it: '...', en: '...' } -> testo nella lingua attiva.
export function tr(value) {
  if (value && typeof value === 'object' && !Array.isArray(value) && 'it' in value) {
    return value[locale.value] ?? value.it
  }
  return value
}

export const i18n = {
  install(app) {
    app.config.globalProperties.$t = t
    app.config.globalProperties.$tr = tr
  }
}
