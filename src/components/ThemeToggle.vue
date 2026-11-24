<template>
  <button
    type="button"
    class="theme-toggle"
    :aria-label="theme === 'dark' ? $t('nav.themeToLight') : $t('nav.themeToDark')"
    :title="theme === 'dark' ? $t('nav.themeToLight') : $t('nav.themeToDark')"
    @click="toggleTheme"
  >
    <i :class="theme === 'dark' ? 'pi pi-sun' : 'pi pi-moon'" aria-hidden="true"></i>
  </button>
</template>

<script setup>
import { theme, toggleTheme } from '@/theme'
</script>

<style scoped>
/* Stessa forma del selettore lingua, accanto al quale si trova */
.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: var(--text-secondary);
  font-size: 0.95rem;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  transition: all 0.3s var(--ease-smooth);
}

.theme-toggle:hover {
  color: var(--gold);
  border-color: var(--border-gold);
  background: var(--gold-subtle);
}

.theme-toggle i {
  transition: transform 0.5s var(--ease-bounce);
}

.theme-toggle:hover i {
  transform: rotate(-25deg);
}
</style>
