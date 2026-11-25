import { createRouter, createWebHistory, START_LOCATION } from 'vue-router'
import { installViewTransitions, supportsViewTransitions } from './viewTransition'
import { watch } from 'vue'
import { t, locale, LOCALES, DEFAULT_LOCALE, localeFromPath, localePath, stripLocale, savedLocaleChoice } from '@/i18n'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      // /:lang(it)? -> la stessa pagina in inglese (senza prefisso) o in italiano (/it)
      path: '/:lang(it)?',
      name: 'home',
      component: HomeView,
      meta: { titleKey: 'titles.home', descKey: 'meta.home' }
    },
    {
      path: '/:lang(it)?/curriculum',
      name: 'curriculum',
      component: () => import('@/views/CurriculumView.vue'),
      meta: { titleKey: 'titles.curriculum', descKey: 'meta.curriculum' }
    },
    {
      path: '/:lang(it)?/progetti',
      name: 'progetti',
      component: () => import('@/views/ProgettiView.vue'),
      meta: { titleKey: 'titles.projects', descKey: 'meta.projects' }
    },
    {
      // qualsiasi indirizzo sconosciuto: pagina 404 con la griglia di blocchi
      path: '/:pathMatch(.*)*',
      name: 'notfound',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { titleKey: 'titles.notFound', descKey: 'meta.notFound', noindex: true }
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    // Cambio lingua: stessa pagina nell'altra lingua, la posizione resta quella di prima
    if (from !== START_LOCATION && to.name === from.name && !to.hash && stripLocale(to.path) === stripLocale(from.path)) return false
    if (to.hash) {
      const target = { el: to.hash, top: 90, behavior: 'smooth' }
      // Coming from another page, wait for the page transition to finish
      if (from.path === to.path) return target
      return new Promise((resolve) => setTimeout(() => resolve(target), 450))
    }
    // con le View Transitions la nuova pagina deve partire già in cima, senza scorrere sotto l'animazione
    return { top: 0, behavior: supportsViewTransitions ? 'auto' : 'smooth' }
  }
})

// La lingua segue l'indirizzo. Solo all'apertura del sito, se il visitatore aveva scelto
// una lingua dal menu, lo portiamo alla stessa pagina in quella lingua. I motori di ricerca
// non hanno scelte salvate: vedono l'inglese in radice e l'italiano sotto /it.
router.beforeEach((to, from) => {
  if (from === START_LOCATION && to.name !== 'notfound') {
    const saved = savedLocaleChoice()
    if (saved && saved !== localeFromPath(to.path)) {
      return { path: localePath(to.path, saved), hash: to.hash, query: to.query, replace: true }
    }
  }
  if (to.name !== 'notfound') locale.value = localeFromPath(to.path)
  else if (from === START_LOCATION) locale.value = savedLocaleChoice() || localeFromPath(to.path)
})

// Tag dell'head (presenti in index.html) allineati a pagina e lingua: SEO e anteprime social
function setHead(selector, attr, value) {
  document.head.querySelector(selector)?.setAttribute(attr, value)
}

// Indirizzo assoluto di un percorso: '/it' -> https://.../NisiixDev/it/
function absoluteUrl(path) {
  const rel = path === '/it' ? 'it/' : path.replace(/^\//, '')
  return window.location.origin + import.meta.env.BASE_URL + rel
}

function updateHead(route) {
  const title = route.meta.titleKey ? t(route.meta.titleKey) : 'Nisiix Dev'
  const description = t(route.meta.descKey || 'meta.home')
  const url = route.meta.noindex ? absoluteUrl(localePath('/')) : absoluteUrl(route.path)
  document.title = title
  setHead('meta[name="description"]', 'content', description)
  setHead('meta[property="og:title"]', 'content', title)
  setHead('meta[property="og:description"]', 'content', description)
  setHead('meta[property="og:url"]', 'content', url)
  setHead('meta[property="og:locale"]', 'content', locale.value === 'it' ? 'it_IT' : 'en_US')
  setHead('meta[property="og:locale:alternate"]', 'content', locale.value === 'it' ? 'en_US' : 'it_IT')
  setHead('meta[name="twitter:title"]', 'content', title)
  setHead('meta[name="twitter:description"]', 'content', description)
  setHead('link[rel="canonical"]', 'href', url)
  setHead('meta[name="robots"]', 'content', route.meta.noindex ? 'noindex, follow' : 'index, follow')
  // Versioni linguistiche della stessa pagina (hreflang)
  const bare = route.meta.noindex ? '/' : stripLocale(route.path)
  for (const { code } of LOCALES) setHead(`link[rel="alternate"][hreflang="${code}"]`, 'href', absoluteUrl(localePath(bare, code)))
  setHead('link[rel="alternate"][hreflang="x-default"]', 'href', absoluteUrl(localePath(bare, DEFAULT_LOCALE)))
}

router.afterEach((to) => updateHead(to))
installViewTransitions(router)
watch(locale, () => updateHead(router.currentRoute.value))

export default router
