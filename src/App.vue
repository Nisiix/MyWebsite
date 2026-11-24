<template>
  <a href="#main-content" class="skip-link" @click.prevent="skipToContent">{{ $t('a11y.skip') }}</a>
  <ScrollBackground />
  <div class="app-wrapper">
    <NavBar />
    <main id="main-content" class="main-content" tabindex="-1">
      <!-- Con le View Transitions del browser il cambio pagina lo anima il browser stesso -->
      <RouterView v-if="supportsViewTransitions" />
      <RouterView v-else v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>
    <FooterBar />
  </div>
</template>

<script setup>
import NavBar from '@/components/NavBar.vue'
import FooterBar from '@/components/FooterBar.vue'
import ScrollBackground from '@/components/ScrollBackground.vue'
import { supportsViewTransitions } from '@/router/viewTransition'

// Porta il focus della tastiera all'inizio del contenuto della pagina
function skipToContent() {
  const main = document.getElementById('main-content')
  main?.focus({ preventScroll: true })
  main?.scrollIntoView()
}
</script>

<style scoped>
.app-wrapper {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  outline: none;
  padding-top: 80px; /* navbar height */
  view-transition-name: page;
}

/* Page transition */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}
</style>
