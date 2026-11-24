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
      meta: { titleKey: 'titles.home' }
    },
    {
      path: '/curriculum',
      name: 'curriculum',
      component: () => import('@/views/CurriculumView.vue'),
      meta: { titleKey: 'titles.curriculum' }
    },
    {
      path: '/progetti',
      name: 'progetti',
      component: () => import('@/views/ProgettiView.vue'),
      meta: { titleKey: 'titles.projects' }
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

function updateTitle(route) {
  document.title = route.meta.titleKey ? t(route.meta.titleKey) : 'Nisiix Dev'
}

router.afterEach((to) => updateTitle(to))
watch(locale, () => updateTitle(router.currentRoute.value))

export default router
