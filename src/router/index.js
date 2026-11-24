import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: 'Home — Nisiix Dev' }
    },
    {
      path: '/curriculum',
      name: 'curriculum',
      component: () => import('@/views/CurriculumView.vue'),
      meta: { title: 'Curriculum — Nisiix Dev' }
    },
    {
      path: '/progetti',
      name: 'progetti',
      component: () => import('@/views/ProgettiView.vue'),
      meta: { title: 'Progetti — Nisiix Dev' }
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

router.beforeEach((to) => {
  document.title = to.meta.title || 'Nisiix Dev'
})

export default router
