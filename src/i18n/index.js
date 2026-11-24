import { ref, watch } from 'vue'
import { messages } from './messages'

// Lingue disponibili. Per aggiungerne una: aggiungi la chiave qui e in messages.js.
// L'inglese è la lingua predefinita e vive nella radice del sito (/, /curriculum, /progetti);
// l'italiano ha il prefisso /it (/it/, /it/curriculum, /it/progetti). Così ogni lingua
// ha indirizzi propri che i motori di ricerca possono indicizzare (hreflang).
export const LOCALES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'it', label: 'Italiano', short: 'IT' }
]
export const DEFAULT_LOCALE = 'en'

// Solo una scelta fatta davvero dal menu lingua viene salvata qui.
// (La vecchia chiave "nisiix-lang" veniva scritta a ogni visita, quindi non la consideriamo.)
const CHOICE_KEY = 'nisiix-lang-choice'

// Lingua indicata da un percorso del router: '/it', '/it/...' -> 'it', il resto -> inglese
export function localeFromPath(path) {
  return /^\/it(\/|$)/.test(path) ? 'it' : DEFAULT_LOCALE
}

// Percorso senza prefisso di lingua: '/it/curriculum' -> '/curriculum', '/it' -> '/'
export function stripLocale(path) {
  return path.replace(/^\/it(?=\/|$)/, '') || '/'
}

// Percorso nella lingua richiesta: localePath('/curriculum', 'it') -> '/it/curriculum'
export function localePath(path, code = locale.value) {
  const clean = stripLocale(path)
  if (code === DEFAULT_LOCALE) return clean
  return '/' + code + (clean === '/' ? '/' : clean)
}

export function savedLocaleChoice() {
  try {
    const saved = localStorage.getItem(CHOICE_KEY)
    return saved && messages[saved] ? saved : null
  } catch {
    return null
  }
}

export function saveLocaleChoice(code) {
  try {
    localStorage.setItem(CHOICE_KEY, code)
  } catch {
    // storage non disponibile: la scelta vale solo per questa visita
  }
}

function pathFromLocation() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  const path = window.location.pathname
  return path.startsWith(base) ? path.slice(base.length) || '/' : path
}

export const locale = ref(localeFromPath(pathFromLocation()))

watch(
  locale,
  (code) => {
    document.documentElement.lang = code
  },
  { immediate: true }
)

// Testo dell'interfaccia: t('home.title'). Se manca in una lingua usa l'inglese.
export function t(key) {
  const get = (dict) => key.split('.').reduce((o, k) => (o == null ? o : o[k]), dict)
  return get(messages[locale.value]) ?? get(messages[DEFAULT_LOCALE]) ?? get(messages.it) ?? key
}

// Dato bilingue negli store: { it: '...', en: '...' } -> testo nella lingua attiva.
export function tr(value) {
  if (value && typeof value === 'object' && !Array.isArray(value) && 'it' in value) {
    return value[locale.value] ?? value[DEFAULT_LOCALE] ?? value.it
  }
  return value
}

export const i18n = {
  install(app) {
    app.config.globalProperties.$t = t
    app.config.globalProperties.$tr = tr
    app.config.globalProperties.$lp = (path) => localePath(path)
  }
}
