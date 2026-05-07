import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useIndexStore = defineStore('index', () => {
  const currentSection = ref('home')
  const isNavOpen = ref(false)

  function setCurrentSection(section) {
    currentSection.value = section
  }

  function toggleNav() {
    isNavOpen.value = !isNavOpen.value
  }

  function closeNav() {
    isNavOpen.value = false
  }

  return {
    currentSection,
    isNavOpen,
    setCurrentSection,
    toggleNav,
    closeNav
  }
})
