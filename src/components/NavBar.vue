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
          :to="link.path"
          :class="['nav-link', { active: $route.path === link.path }]"
          :id="'nav-' + link.name.toLowerCase()"
        >
          <i :class="link.icon"></i>
          <span>{{ link.name }}</span>
        </router-link>
      </nav>

      <!-- Mobile Hamburger -->
      <button
        class="hamburger"
        id="hamburger-menu"
        @click="store.toggleNav()"
        :aria-expanded="store.isNavOpen"
        aria-label="Toggle navigation"
      >
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
      </button>
    </div>

    <!-- Mobile Menu -->
    <transition name="slide-down">
      <div v-if="store.isNavOpen" class="mobile-menu">
        <router-link
          v-for="link in navLinks"
          :key="link.name"
          :to="link.path"
          class="mobile-link"
          @click="store.closeNav()"
        >
          <i :class="link.icon"></i>
          <span>{{ link.name }}</span>
        </router-link>
      </div>
    </transition>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useIndexStore } from '@/stores/index'

const store = useIndexStore()
const isScrolled = ref(false)

const navLinks = [
  { name: 'Home', path: '/', icon: 'pi pi-home' },
  { name: 'Curriculum', path: '/curriculum', icon: 'pi pi-file' },
  { name: 'Progetti', path: '/progetti', icon: 'pi pi-folder-open' }
]

function handleScroll() {
  isScrolled.value = window.scrollY > 40
}

onMounted(() => window.addEventListener('scroll', handleScroll))
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

.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  background: var(--gold);
  border-radius: 1px;
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
