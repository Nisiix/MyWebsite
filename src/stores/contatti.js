import { defineStore } from 'pinia'
import { ref } from 'vue'

// Contatti mostrati nella home.
// Modifica qui email e link: un social con url vuoto ('') non viene mostrato.
// Icone disponibili: https://primevue.org/icons (es. 'pi pi-linkedin', 'pi pi-twitter').
export const useContattiStore = defineStore('contatti', () => {
  const email = ref('nome@esempio.it')

  const socials = ref([
    { name: 'GitHub', icon: 'pi pi-github', url: 'https://github.com/Nisiix' },
    { name: 'LinkedIn', icon: 'pi pi-linkedin', url: 'https://www.linkedin.com/' },
    { name: 'Instagram', icon: 'pi pi-instagram', url: 'https://www.instagram.com/' },
    { name: 'Facebook', icon: 'pi pi-facebook', url: 'https://www.facebook.com/' }
  ])

  return { email, socials }
})
