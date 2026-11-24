<template>
  <header :class="['navbar', { scrolled: isScrolled, 'nav-open': store.isNavOpen }]">
    <div class="navbar-inner container">
      <!-- Logo -->
      <router-link to="/" class="logo" @click="store.closeNav()">
        <span class="logo-icon">Nisiix</span>
        <span class="logo-text-dev">Dev</span>
      </router-link>

      <!-- Desktop Nav -->
      <nav class="nav-links" id="main-navigation">
        <router-link
          v-for="link in navLinks"
          :key="link.name"
          :to="link.to"
          :class="['nav-link', { active: isActive(link) }]"
          :id="'nav-' + link.name.toLowerCase()"
          @click="onLinkClick(link)"
        >
          <i :class="link.icon"></i>
          <span>{{ $t(link.label) }}</span>
        </router-link>
      </nav>

      <div class="nav-actions">
        <LangSwitcher />

      <!-- Mobile Hamburger -->
      <button
        class="hamburger"
        id="hamburger-menu"
        @click="store.toggleNav()"
        :aria-expanded="store.isNavOpen"
        :aria-label="$t('nav.toggle')"
      >
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
      </button>
      </div>
    </div>

    <!-- Scroll progress -->
    <div class="scroll-progress" :style="{ transform: `scaleX(${progress})` }" aria-hidden="true"></div>

    <!-- Mobile Menu -->
    <transition name="slide-down">
      <div v-if="store.isNavOpen" class="mobile-menu">
        <router-link
          v-for="link in navLinks"
          :key="link.name"
          :to="link.to"
          :class="['mobile-link', { active: isActive(link) }]"
          @click="onLinkClick(link)"
        >
          <i :class="link.icon"></i>
          <span>{{ $t(link.label) }}</span>
        </router-link>
      </div>
    </transition>
  </header>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useIndexStore } from '@/stores/index'
import LangSwitcher from '@/components/LangSwitcher.vue'

const store = useIndexStore()
const isScrolled = ref(false)
const progress = ref(0)

const navLinks = [
  { name: 'Home', label: 'nav.home', to: { path: '/' }, icon: 'pi pi-home' },
  { name: 'Curriculum', label: 'nav.curriculum', to: { path: '/curriculum' }, icon: 'pi pi-file' },
  { name: 'Progetti', label: 'nav.projects', to: { path: '/progetti' }, icon: 'pi pi-folder-open' },
  { name: 'Contatti', label: 'nav.contacts', to: { path: '/', hash: '#contatti' }, icon: 'pi pi-envelope' }
]

function isActive(link) {
  if (route.path !== link.to.path) return false
  return (link.to.hash || '') === route.hash
}

// Clicking a hash link when the URL already has it would not scroll again
function onLinkClick(link) {
  store.closeNav()
  if (link.to.hash && route.hash === link.to.hash) {
    document.querySelector(link.to.hash)?.scrollIntoView({ behavior: 'smooth' })
  }
}

// Reset the progress bar after a page change
const route = useRoute()
watch(() => route.path, () => requestAnimationFrame(handleScroll))

function handleScroll() {
  isScrolled.value = window.scrollY > 40
  const max = document.documentElement.scrollHeight - window.innerHeight
  progress.value = max > 0 ? Math.min(window.scrollY / max, 1) : 0
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()
})
onUnmounted(() => window.removeEventListener('scroll', handleScroll))
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(10, 10, 10, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid transparent;
  transition: all 0.4s var(--ease-smooth);
}

.navbar.scrolled {
  background: rgba(10, 10, 10, 0.92);
  border-bottom: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-md);
}

.navbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80px;
}

/* Logo */
.logo {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-white);
  transition: opacity 0.3s;
}

.logo:hover {
  opacity: 0.85;
}

.logo-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 14px;
  background: linear-gradient(135deg, var(--gold), var(--gold-dark));
  color: var(--bg-primary);
  font-size: 1.3rem;
  font-weight: 800;
  border-radius: 10px;
  margin-right: 8px;
  transition: transform 0.3s var(--ease-bounce);
  letter-spacing: 0.5px;
}

.logo:hover .logo-icon {
  transform: rotate(-6deg) scale(1.05);
}

.logo-text-dev {
  color: var(--text-white);
  font-weight: 600;
}

/* Nav Links */
.nav-links {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  color: var(--text-secondary);
  font-size: 0.92rem;
  font-weight: 500;
  border-radius: var(--radius-sm);
  transition: all 0.3s var(--ease-smooth);
  position: relative;
}

.nav-link i {
  font-size: 0.9rem;
}

.nav-link:hover {
  color: var(--text-white);
  background: rgba(255, 255, 255, 0.05);
}

.nav-link.active {
  color: var(--gold);
  background: var(--gold-subtle);
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 20px;
  height: 2px;
  margin-left: -10px;
  background: var(--gold);
  border-radius: 1px;
  transform: scaleX(0);
  transition: transform 0.35s var(--ease-bounce);
}

.nav-link:hover::after {
  transform: scaleX(0.5);
}

.nav-link.active::after {
  transform: scaleX(1);
}

/* Scroll progress */
.scroll-progress {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  background: linear-gradient(90deg, var(--gold-dark), var(--gold), var(--gold-light));
  box-shadow: 0 0 10px var(--gold-glow);
  transform-origin: left;
  pointer-events: none;
}

/* Language + hamburger */
.nav-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 12px;
}

/* Hamburger */
.hamburger {
  display: none;
  flex-direction: column;
  gap: 5px;
  padding: 8px;
  z-index: 10;
}

.hamburger-line {
  display: block;
  width: 24px;
  height: 2px;
  background: var(--text-primary);
  border-radius: 2px;
  transition: all 0.3s var(--ease-smooth);
}

.nav-open .hamburger-line:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}

.nav-open .hamburger-line:nth-child(2) {
  opacity: 0;
}

.nav-open .hamburger-line:nth-child(3) {
  transform: rotate(-45deg) translate(5px, -5px);
}

/* Mobile Menu */
.mobile-menu {
  display: none;
  flex-direction: column;
  padding: 16px 24px 24px;
  background: rgba(10, 10, 10, 0.98);
  border-top: 1px solid var(--border-subtle);
}

.mobile-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  color: var(--text-secondary);
  font-size: 1rem;
  font-weight: 500;
  border-radius: var(--radius-sm);
  transition: all 0.3s;
}

.mobile-menu .mobile-link {
  animation: mobileLinkIn 0.4s var(--ease-smooth) both;
}

.mobile-menu .mobile-link:nth-child(2) { animation-delay: 0.05s; }
.mobile-menu .mobile-link:nth-child(3) { animation-delay: 0.1s; }

@keyframes mobileLinkIn {
  from { opacity: 0; transform: translateX(-12px); }
  to { opacity: 1; transform: none; }
}

.mobile-link.active {
  color: var(--gold);
}

.mobile-link:hover {
  color: var(--gold);
  background: var(--gold-subtle);
}

/* Slide transition */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s var(--ease-smooth);
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Responsive */
@media (max-width: 768px) {
  .nav-links {
    display: none;
  }

  .hamburger {
    display: flex;
  }

  .mobile-menu {
    display: flex;
  }
}
</style>
