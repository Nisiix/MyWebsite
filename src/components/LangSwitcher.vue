<template>
  <div class="lang-switcher" ref="root" @keydown.esc="onEsc">
    <button
      type="button"
      class="lang-toggle"
      :aria-expanded="open"
      aria-haspopup="listbox"
      :aria-label="$t('nav.language')"
      ref="toggle"
      @click="open = !open"
    >
      <i class="pi pi-globe"></i>
      <span>{{ current.short }}</span>
    </button>

    <transition name="lang-pop">
      <ul v-if="open" class="lang-menu" role="listbox" :aria-label="$t('nav.language')">
        <li v-for="l in LOCALES" :key="l.code" role="none">
          <button
            type="button"
            role="option"
            :aria-selected="l.code === locale"
            :class="['lang-option', { selected: l.code === locale }]"
            @click="choose(l.code)"
          >
            <span class="lang-short">{{ l.short }}</span>
            <span>{{ l.label }}</span>
            <i v-if="l.code === locale" class="pi pi-check"></i>
          </button>
        </li>
      </ul>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LOCALES, locale, localePath, saveLocaleChoice } from '@/i18n'

const open = ref(false)
const root = ref(null)
const toggle = ref(null)
const current = computed(() => LOCALES.find((l) => l.code === locale.value) || LOCALES[0])

const route = useRoute()
const router = useRouter()

// La lingua scelta viene ricordata e si passa alla stessa pagina nell'altra lingua
function choose(code) {
  saveLocaleChoice(code)
  close(true)
  if (code === locale.value) return
  if (route.name === 'notfound') {
    locale.value = code
    return
  }
  // Senza l'ancora: dopo "Contattami" l'indirizzo ha #contatti e il cambio lingua
  // farebbe scorrere di nuovo fino ai contatti. La pagina resta dov'è (vedi scrollBehavior).
  router.push({ path: localePath(route.path, code), query: route.query })
}

function close(focusToggle = false) {
  if (!open.value) return
  open.value = false
  if (focusToggle) toggle.value?.focus()
}

// Esc chiude solo la tendina, non anche il menu mobile che la contiene
function onEsc(e) {
  if (!open.value) return
  e.stopPropagation()
  close(true)
}

function onDocClick(e) {
  if (root.value && !root.value.contains(e.target)) close()
}

onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))
</script>

<style scoped>
.lang-switcher {
  position: relative;
}

.lang-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 12px;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: 600;
  letter-spacing: 0.5px;
  border-radius: 999px;
  transition: 0.3s var(--ease-smooth);
  transition-property: var(--transition-props);
}

.lang-toggle:hover,
.lang-toggle[aria-expanded='true'] {
  color: var(--gold);
  background: var(--gold-subtle);
}

.lang-toggle .pi-globe {
  font-size: 0.9rem;
}

.lang-menu {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  min-width: 170px;
  padding: 6px;
  background: var(--bg-card);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 20;
}

.lang-option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  color: var(--text-secondary);
  font-size: var(--text-md);
  font-weight: 500;
  border-radius: var(--radius-sm);
  text-align: left;
  transition: 0.2s var(--ease-smooth);
  transition-property: var(--transition-props);
}

.lang-option:hover {
  color: var(--text-white);
  background: var(--hover-tint);
}

.lang-option.selected {
  color: var(--gold);
}

.lang-short {
  min-width: 22px;
  font-size: var(--text-xs);
  font-weight: 700;
  opacity: 0.7;
}

.lang-option .pi-check {
  margin-left: auto;
  font-size: 0.8rem;
}

.lang-pop-enter-active,
.lang-pop-leave-active {
  transition: opacity 0.2s var(--ease-smooth), transform 0.2s var(--ease-smooth);
}

.lang-pop-enter-from,
.lang-pop-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (pointer: coarse), (max-width: 768px) {
  .lang-toggle {
    height: var(--tap);
  }

  .lang-option {
    min-height: var(--tap);
  }
}
</style>
