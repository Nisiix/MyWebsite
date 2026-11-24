import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCurriculumStore = defineStore('curriculum', () => {
  const skills = ref([
    {
      category: 'Sviluppo desktop',
      icon: 'pi pi-desktop',
      items: [
        { name: 'Visual Basic 6', level: 100, description: 'Sviluppo applicazioni gestionali legacy, migrazione e manutenzione di sistemi enterprise consolidati.' },
        { name: 'Microsoft Visual C#', level: 90, description: 'Applicazioni desktop .NET, WinForms e servizi Windows per ambienti aziendali.' }
      ]
    },
    {
      category: 'Sviluppo web (frontend)',
      icon: 'pi pi-globe',
      items: [
        { name: 'JavaScript', level: 75, description: 'ES6+, programmazione funzionale e asincrona, integrazione API REST.' },
        { name: 'Vue.js + Vuetify + Pinia', level: 75, description: 'SPA complesse con gestione dello stato, componenti UI Material Design e routing avanzato.' }
      ]
    },
    {
      category: 'Sviluppo web (backend)',
      icon: 'pi pi-server',
      items: [
        { name: 'Express.js', level: 60, description: 'API RESTful, middleware personalizzati, autenticazione JWT e integrazione database.' },
        { name: 'Java + Netbeans', level: 60, description: 'Sviluppo applicazioni enterprise, servlet, integrazione con database relazionali e sviluppo di servizi backend.' }
      ]
    },
    {
      category: 'Design e prototipazione',
      icon: 'pi pi-palette',
      items: [
        { name: 'Figma', level: 60, description: 'Prototipazione UI/UX, design system, wireframing e collaborazione con team di sviluppo.' }
      ]
    }
  ])

  const technologies = computed(() => {
    const techs = []
    skills.value.forEach(category => {
      category.items.forEach(item => {
        techs.push(item.name)
      })
    })
    return techs
  })

  return {
    skills,
    technologies
  }
})
