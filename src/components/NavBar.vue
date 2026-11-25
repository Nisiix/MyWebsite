<template>
  <header ref="headerEl" :class="['navbar', { scrolled: isScrolled, 'nav-open': store.isNavOpen, 'nav-hidden': isHidden }]" @focusin="isHidden = false">
    <div class="navbar-inner">
      <!-- Logo -->
      <router-link :to="$lp('/')" class="logo" @click="store.closeNav()">
        <span class="logo-icon">Nisiix</span>
        <span class="logo-text-dev">Dev</span>
      </router-link>

      <!-- Voci del menu (desktop): una pillola dorata scivola sotto la voce attiva o quella sotto il mouse -->
      <nav class="nav-links" ref="linksEl" :aria-label="$t('nav.main')" @mouseleave="hovered = null">
        <span
          class="nav-pill"
          :class="{ ready: pillReady, visible: pill.visible, preview: hovered && hovered !== activeName }"
          :style="{ transform: `translateX(${pill.x}px)`, width: pill.w + 'px' }"
          aria-hidden="true"
        ></span>
        <router-link
          v-for="link in navLinks"
          :key="link.name"
          :ref="(el) => setLinkEl(link.name, el)"
          :to="link.to"
          :class="['nav-link', { active: isActive(link) }]"
          :id="'nav-' + link.name.toLowerCase()"
          @mouseenter="hovered = link.name"
          @focus="hovered = link.name"
          @blur="hovered = null"
          @click="onLinkClick(link)"
        >
          {{ $t(link.label) }}
        </router-link>
      </nav>

      <div class="nav-actions">
        <!-- Lingua e tema: un unico gruppo discreto -->
        <div class="nav-prefs">
          <LangSwitcher />
          <span class="nav-prefs-sep" aria-hidden="true"></span>
          <ThemeToggle />
        </div>

        <router-link :to="contactLink.to" class="nav-cta" @click="onLinkClick(contactLink)">
          {{ $t('nav.contact') }}
        </router-link>

        <!-- Pulsante del menu mobile: due linee che diventano una X -->
        <button
          class="hamburger"
          id="hamburger-menu"
          ref="hamburgerEl"
          @click="store.toggleNav()"
          :aria-expanded="store.isNavOpen"
          aria-controls="mobile-menu"
          :aria-label="$t('nav.toggle')"
        >
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
        </button>
      </div>

      <!-- Avanzamento nella pagina -->
      <div class="scroll-progress" :style="{ transform: `scaleX(${progress})` }" aria-hidden="true"></div>
    </div>

    <!-- Menu mobile a tutto schermo: copre la pagina, la barra resta sopra (z-index -1 nel header) -->
    <transition name="menu-panel">
        <nav
          v-if="store.isNavOpen"
          id="mobile-menu"
          ref="panelEl"
          class="mobile-menu"
          :aria-label="$t('nav.menu')"
        >
          <div class="mobile-menu-links">
            <router-link
              v-for="(link, i) in navLinks"
              :key="link.name"
              :to="link.to"
              :class="['mobile-link', { active: isActive(link) }]"
              :style="{ '--i': i }"
              @click="onLinkClick(link)"
            >
              <i :class="link.icon" aria-hidden="true"></i>
              <span>{{ $t(link.label) }}</span>
            </router-link>
          </div>
          <router-link
            :to="contactLink.to"
            class="btn-gold mobile-cta"
            :style="{ '--i': navLinks.length }"
            @click="onLinkClick(contactLink)"
          >
            <i class="pi pi-envelope" aria-hidden="true"></i>
            {{ $t('nav.contact') }}
          </router-link>
        </nav>
    </transition>
  </header>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useIndexStore } from '@/stores/index'
import LangSwitcher from '@/components/LangSwitcher.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { localePath, locale } from '@/i18n'

const store = useIndexStore()
const route = useRoute()
const headerEl = ref(null)
const isScrolled = ref(false)
const isHidden = ref(false)
const progress = ref(0)

// I percorsi seguono la lingua attiva: /curriculum in inglese, /it/curriculum in italiano
const navLinks = computed(() => [
  { name: 'Home', route: 'home', label: 'nav.home', to: { path: localePath('/') }, icon: 'pi pi-home' },
  { name: 'Curriculum', route: 'curriculum', label: 'nav.curriculum', to: { path: localePath('/curriculum') }, icon: 'pi pi-file' },
  { name: 'Progetti', route: 'progetti', label: 'nav.projects', to: { path: localePath('/progetti') }, icon: 'pi pi-folder-open' }
])
const contactLink = computed(() => ({ route: 'home', to: { path: localePath('/'), hash: '#contatti' } }))

const isActive = (link) => route.name === link.route

// Un clic su un link con l'ancora già nell'indirizzo non farebbe scorrere di nuovo
function onLinkClick(link) {
  store.closeNav()
  if (link.to.hash && route.name === link.route && route.hash === link.to.hash) {
    document.querySelector(link.to.hash)?.scrollIntoView({ behavior: 'smooth' })
  }
}

// ---- Pillola che scivola sotto la voce attiva (o quella sotto il mouse) ----
const linksEl = ref(null)
const linkEls = {}
const hovered = ref(null)
const pill = reactive({ x: 0, w: 0, visible: false })
const pillReady = ref(false) // la prima volta compare già al suo posto, senza scivolare
const activeName = computed(() => navLinks.value.find(isActive)?.name ?? null)

function setLinkEl(name, el) {
  linkEls[name] = el?.$el ?? el
}

function placePill() {
  const el = linkEls[hovered.value ?? activeName.value]
  if (!el || !el.offsetWidth) {
    pill.visible = false
    return
  }
  pill.x = el.offsetLeft
  pill.w = el.offsetWidth
  pill.visible = true
  if (!pillReady.value) requestAnimationFrame(() => (pillReady.value = true))
}

watch([hovered, activeName, locale], () => nextTick(placePill))

// ---- Scroll: barra a pillola, che si nasconde scendendo e riappare risalendo ----
let lastY = 0
function handleScroll() {
  const y = window.scrollY
  isScrolled.value = y > 40
  const max = document.documentElement.scrollHeight - window.innerHeight
  progress.value = max > 0 ? Math.min(y / max, 1) : 0
  const delta = y - lastY
  // resta visibile in cima, con il menu mobile aperto o con la tendina della lingua aperta
  if (y < 160 || store.isNavOpen || headerEl.value?.querySelector('.lang-menu')) isHidden.value = false
  else if (delta > 8) isHidden.value = true
  else if (delta < -8) isHidden.value = false
  if (Math.abs(delta) > 8 || y < 160) lastY = y
}

// Dopo un cambio pagina la barra torna visibile e l'avanzamento riparte
watch(() => route.path, () => {
  isHidden.value = false
  requestAnimationFrame(handleScroll)
})

// ---- Menu mobile: pagina bloccata dietro, tastiera trattenuta nel menu, Esc per chiudere ----
const panelEl = ref(null)
const hamburgerEl = ref(null)
const behind = () => [document.getElementById('main-content'), document.querySelector('.footer'), document.querySelector('.skip-link')]
function lockPage(open) {
  document.documentElement.classList.toggle('menu-open', open)
  for (const el of behind()) if (el) el.inert = open
}

watch(() => store.isNavOpen, async (open) => {
  lockPage(open)
  if (open) {
    isHidden.value = false
    await nextTick()
    panelEl.value?.querySelector('a')?.focus({ preventScroll: true })
  }
})

function onKeydown(e) {
  if (e.key !== 'Escape' || !store.isNavOpen) return
  store.closeNav()
  hamburgerEl.value?.focus()
}

const desktop = window.matchMedia('(min-width: 769px)')
function onBreakpoint() {
  if (desktop.matches) store.closeNav()
  nextTick(placePill)
}

let resizeObserver
onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  document.addEventListener('keydown', onKeydown)
  desktop.addEventListener('change', onBreakpoint)
  // la larghezza delle voci cambia con la lingua e quando arrivano i font
  resizeObserver = new ResizeObserver(placePill)
  if (linksEl.value) resizeObserver.observe(linksEl.value)
  handleScroll()
  placePill()
})
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  document.removeEventListener('keydown', onKeydown)
  desktop.removeEventListener('change', onBreakpoint)
  resizeObserver?.disconnect()
  store.closeNav()
  lockPage(false) // i watcher sono già fermi qui: sblocco la pagina direttamente
})
</script>

<style scoped>
/* In cima alla pagina: barra a tutta larghezza, semitrasparente. Scorrendo: pillola flottante. */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 0 16px;
  transition: padding 0.4s var(--ease-smooth), transform 0.35s var(--ease-smooth);
}

/* fondo a tutta larghezza (solo in cima): sta in un livello a parte per poter sfumare */
.navbar::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: var(--nav-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  transition: opacity 0.4s var(--ease-smooth);
}

.navbar.scrolled {
  padding-top: 10px;
}

.navbar.scrolled::before {
  opacity: 0;
}

.navbar.nav-hidden {
  transform: translateY(calc(-100% - 12px));
}

.navbar-inner {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: calc(var(--container-max) - 48px);
  height: 80px;
  margin: 0 auto;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: 0;
  transition: 0.4s var(--ease-smooth);
  transition-property: max-width, height, padding, border-radius, background-color, border-color, box-shadow;
}

.scrolled .navbar-inner {
  max-width: 1000px;
  height: 64px;
  padding: 0 8px 0 10px;
  background: var(--nav-bg);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  border-color: var(--border-medium);
  border-radius: 999px;
  box-shadow: var(--shadow-md);
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
  transition: opacity 0.3s, font-size 0.4s var(--ease-smooth);
}

.scrolled .logo {
  font-size: 1.3rem;
}

.logo:hover {
  opacity: 0.85;
}

.logo-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25em 0.6em;
  background: linear-gradient(135deg, var(--gold), var(--gold-dark));
  color: var(--bg-primary);
  font-size: 0.87em;
  font-weight: 800;
  border-radius: 10px;
  margin-right: 8px;
  transition: transform 0.3s var(--ease-bounce), border-radius 0.4s var(--ease-smooth);
  letter-spacing: 0.5px;
}

.scrolled .logo-icon {
  border-radius: 999px;
}

.logo:hover .logo-icon {
  transform: rotate(-6deg) scale(1.05);
}

.logo-text-dev {
  color: var(--text-white);
  font-weight: 600;
}

/* Voci del menu */
.nav-links {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

.nav-link {
  position: relative;
  z-index: 1;
  padding: 8px 18px;
  color: var(--text-secondary);
  font-size: var(--text-md);
  font-weight: 500;
  border-radius: 999px;
  transition: color 0.3s var(--ease-smooth);
}

.nav-link:hover,
.nav-link:focus-visible {
  color: var(--text-white);
}

.nav-link.active {
  color: var(--gold);
}

.nav-pill {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  background: var(--gold-subtle);
  border: 1px solid var(--border-gold);
  border-radius: 999px;
  opacity: 0;
  pointer-events: none;
}

.nav-pill.visible {
  opacity: 1;
}

/* sotto una voce non attiva la pillola si fa più leggera */
.nav-pill.preview {
  background: var(--hover-tint);
  border-color: var(--border-medium);
}

.nav-pill.ready {
  transition:
    transform 0.45s var(--ease-smooth),
    width 0.45s var(--ease-smooth),
    opacity 0.25s ease,
    background-color 0.3s ease,
    border-color 0.3s ease;
}

/* Lingua, tema, contatto */
.nav-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: 12px;
}

.nav-prefs {
  display: flex;
  align-items: center;
  padding: 3px;
  border: 1px solid var(--border-medium);
  border-radius: 999px;
}

.nav-prefs-sep {
  width: 1px;
  height: 18px;
  margin: 0 2px;
  background: var(--border-medium);
}

.nav-cta {
  display: inline-flex;
  align-items: center;
  padding: 9px 20px;
  background: linear-gradient(135deg, var(--gold), var(--gold-dark));
  color: var(--bg-primary);
  font-size: var(--text-sm);
  font-weight: 600;
  white-space: nowrap;
  border-radius: 999px;
  transition: 0.3s var(--ease-smooth);
  transition-property: box-shadow, transform;
}

.nav-cta:hover {
  box-shadow: var(--shadow-gold);
  transform: translateY(-1px);
}

/* Pulsante del menu mobile */
.hamburger {
  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: var(--tap);
  min-height: var(--tap);
  border-radius: 999px;
}

.hamburger-line {
  display: block;
  width: 22px;
  height: 2px;
  background: var(--text-primary);
  border-radius: 2px;
  transition: transform 0.35s var(--ease-smooth);
}

.nav-open .hamburger-line:nth-child(1) {
  transform: translateY(4px) rotate(45deg);
}

.nav-open .hamburger-line:nth-child(2) {
  transform: translateY(-4px) rotate(-45deg);
}

/* Avanzamento nella pagina: sotto la barra, dentro i bordi arrotondati quando è a pillola */
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
  transition: left 0.4s var(--ease-smooth), right 0.4s var(--ease-smooth);
}

.scrolled .scroll-progress {
  left: 32px;
  right: 32px;
}

/* Responsive */
@media (max-width: 768px) {
  .navbar {
    padding: 0 8px;
  }

  .navbar-inner {
    height: 72px;
  }

  .nav-links,
  .nav-cta {
    display: none;
  }

  .nav-actions {
    margin-left: auto;
    gap: 6px;
  }

  .nav-prefs {
    padding: 1px;
  }

  .hamburger {
    display: flex;
  }
}

@media (max-width: 380px) {
  .logo {
    font-size: 1.3rem;
  }
}
</style>

<!-- Pannello mobile e blocco della pagina (classe su <html>): stili non scoped -->
<style>
.mobile-menu {
  position: fixed;
  inset: 0;
  z-index: -1; /* sopra il fondo della barra, sotto logo e pulsanti */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 32px;
  padding: 112px 24px max(32px, env(safe-area-inset-bottom));
  background: var(--bg-primary);
  overflow-y: auto;
}

.mobile-menu-links {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mobile-link {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 8px;
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 700;
  border-bottom: 1px solid var(--border-subtle);
  transition: color 0.3s var(--ease-smooth);
}

.mobile-link i {
  font-size: 1.1rem;
  color: var(--text-muted);
  transition: color 0.3s var(--ease-smooth);
}

.mobile-link.active,
.mobile-link.active i,
.mobile-link:hover,
.mobile-link:hover i {
  color: var(--gold);
}

.mobile-cta {
  justify-content: center;
  min-height: 52px;
  font-size: var(--text-base);
  border-radius: 999px;
}

/* entrata a cascata delle voci */
.mobile-menu .mobile-link,
.mobile-menu .mobile-cta {
  animation: mobile-link-in 0.45s var(--ease-smooth) both;
  animation-delay: calc(0.08s + var(--i, 0) * 0.05s);
}

@keyframes mobile-link-in {
  from { opacity: 0; transform: translateY(16px); }
}

.menu-panel-enter-active,
.menu-panel-leave-active {
  transition: opacity 0.3s var(--ease-smooth);
}

.menu-panel-enter-from,
.menu-panel-leave-to {
  opacity: 0;
}

/* pagina bloccata dietro il menu aperto */
html.menu-open {
  overflow: hidden;
}
</style>
