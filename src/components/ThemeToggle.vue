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
/* Pulsante tondo senza bordo: sta nel gruppo con il selettore della lingua */
.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  color: var(--text-secondary);
  font-size: var(--text-md);
  border-radius: 999px;
  transition: 0.3s var(--ease-smooth);
  transition-property: var(--transition-props);
}

.theme-toggle:hover {
  color: var(--gold);
  background: var(--gold-subtle);
}

.theme-toggle i {
  transition: transform 0.5s var(--ease-bounce);
}

.theme-toggle:hover i {
  transform: rotate(-25deg);
}

/* sui touch screen l'area da toccare è di almeno 44px */
@media (pointer: coarse), (max-width: 768px) {
  .theme-toggle {
    width: var(--tap);
    height: var(--tap);
  }
}
</style>
