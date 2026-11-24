<template>
  <div class="lang-switcher" ref="root" @keydown.esc="close(true)">
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
      <i class="pi pi-chevron-down lang-chevron" :class="{ open }"></i>
    </button>

    <transition name="lang-pop">
      <ul v-if="open" class="lang-menu" role="listbox" :aria-label="$t('nav.language')">
        <li v-for="l in LOCALES" :key="l.code">
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
import { LOCALES, locale } from '@/i18n'

const open = ref(false)
const root = ref(null)
const toggle = ref(null)
const current = computed(() => LOCALES.find((l) => l.code === locale.value) || LOCALES[0])

function choose(code) {
  locale.value = code
  close(true)
}

function close(focusToggle = false) {
  if (!open.value) return
  open.value = false
  if (focusToggle) toggle.value?.focus()
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
  gap: 8px;
  padding: 10px 14px;
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  transition: all 0.3s var(--ease-smooth);
}

.lang-toggle:hover,
.lang-toggle[aria-expanded='true'] {
  color: var(--gold);
  border-color: var(--border-gold);
  background: var(--gold-subtle);
}

.lang-toggle .pi-globe {
  font-size: 0.9rem;
}

.lang-chevron {
  font-size: 0.65rem;
  transition: transform 0.3s var(--ease-smooth);
}

.lang-chevron.open {
  transform: rotate(180deg);
}

.lang-menu {
  position: absolute;
  top: calc(100% + 8px);
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
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: var(--radius-sm);
  text-align: left;
  transition: all 0.2s var(--ease-smooth);
}

.lang-option:hover {
  color: var(--text-white);
  background: rgba(255, 255, 255, 0.05);
}

.lang-option.selected {
  color: var(--gold);
}

.lang-short {
  min-width: 22px;
  font-size: 0.75rem;
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
</style>
