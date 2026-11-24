import { defineStore } from 'pinia'
import { ref } from 'vue'

// Contatti mostrati nella home.
// Modifica qui email e link: un campo vuoto ('') non viene mostrato.
// Icone disponibili: https://primevue.org/icons (es. 'pi pi-linkedin', 'pi pi-twitter').
export const useContattiStore = defineStore('contatti', () => {
  const email = ref('') // es. 'nome@dominio.it'

  const socials = ref([
    { name: 'GitHub', icon: 'pi pi-github', url: 'https://github.com/Nisiix' },
    { name: 'LinkedIn', icon: 'pi pi-linkedin', url: '' }, // es. 'https://www.linkedin.com/in/tuo-profilo'
    { name: 'Instagram', icon: 'pi pi-instagram', url: '' }, // es. 'https://www.instagram.com/tuo-profilo'
    { name: 'Facebook', icon: 'pi pi-facebook', url: '' } // es. 'https://www.facebook.com/tuo-profilo'
  ])

  return { email, socials }
})
