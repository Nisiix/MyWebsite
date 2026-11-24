import { createRouter, createWebHistory } from 'vue-router'
import { watch } from 'vue'
import { t, locale } from '@/i18n'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { titleKey: 'titles.home', descKey: 'meta.home' }
    },
    {
      path: '/curriculum',
      name: 'curriculum',
      component: () => import('@/views/CurriculumView.vue'),
      meta: { titleKey: 'titles.curriculum', descKey: 'meta.curriculum' }
    },
    {
      path: '/progetti',
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
    if (to.hash) {
      const target = { el: to.hash, top: 90, behavior: 'smooth' }
      // Coming from another page, wait for the page transition to finish
      if (from.path === to.path) return target
      return new Promise((resolve) => setTimeout(() => resolve(target), 450))
    }
    return { top: 0, behavior: 'smooth' }
  }
})

// Tag dell'head (presenti in index.html) allineati a pagina e lingua: SEO e anteprime social
function setHead(selector, attr, value) {
  document.head.querySelector(selector)?.setAttribute(attr, value)
}

function updateHead(route) {
  const title = route.meta.titleKey ? t(route.meta.titleKey) : 'Nisiix Dev'
  const description = t(route.meta.descKey || 'meta.home')
  const path = route.meta.noindex ? '' : route.path.replace(/^\//, '').replace(/\/$/, '')
  const url = window.location.origin + import.meta.env.BASE_URL + path
  document.title = title
  setHead('meta[name="description"]', 'content', description)
  setHead('meta[property="og:title"]', 'content', title)
  setHead('meta[property="og:description"]', 'content', description)
  setHead('meta[property="og:url"]', 'content', url)
  setHead('meta[property="og:locale"]', 'content', locale.value === 'it' ? 'it_IT' : 'en_US')
  setHead('meta[name="twitter:title"]', 'content', title)
  setHead('meta[name="twitter:description"]', 'content', description)
  setHead('link[rel="canonical"]', 'href', url)
  setHead('meta[name="robots"]', 'content', route.meta.noindex ? 'noindex, follow' : 'index, follow')
}

router.afterEach((to) => updateHead(to))
watch(locale, () => updateHead(router.currentRoute.value))

export default router
