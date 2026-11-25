import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Testi bilingui: { it: '...', en: '...' }
export const useCurriculumStore = defineStore('curriculum', () => {
  const skills = ref([
    {
      category: { it: 'Sviluppo desktop', en: 'Desktop development' },
      icon: 'pi pi-desktop',
      items: [
        { name: 'Visual Basic 6', description: { it: 'Sviluppo di applicazioni gestionali legacy, migrazione e manutenzione di sistemi aziendali consolidati.', en: 'Legacy business applications, migration and maintenance of established enterprise systems.' } },
        { name: 'Microsoft Visual C#', description: { it: 'Applicazioni desktop .NET, WinForms e servizi Windows per ambienti aziendali.', en: '.NET desktop applications, WinForms and Windows services for business environments.' } }
      ]
    },
    {
      category: { it: 'Sviluppo web (frontend)', en: 'Web development (frontend)' },
      icon: 'pi pi-globe',
      items: [
        { name: 'JavaScript', description: { it: 'ES6+, programmazione funzionale e asincrona, integrazione API REST.', en: 'ES6+, functional and asynchronous programming, REST API integration.' } },
        { name: 'Vue.js + Vuetify + Pinia', description: { it: 'SPA complesse con gestione dello stato, componenti UI Material Design e routing avanzato.', en: 'Complex SPAs with state management, Material Design UI components and advanced routing.' } }
      ]
    },
    {
      category: { it: 'Sviluppo web (backend)', en: 'Web development (backend)' },
      icon: 'pi pi-server',
      items: [
        { name: 'Express.js', description: { it: 'API RESTful, middleware personalizzati, autenticazione JWT e integrazione database.', en: 'RESTful APIs, custom middleware, JWT authentication and database integration.' } },
        { name: 'Java + NetBeans', description: { it: 'Applicazioni enterprise, servlet, integrazione con database relazionali e servizi backend.', en: 'Enterprise applications, servlets, relational database integration and backend services.' } }
      ]
    }
  ])

  // Stack tecnologico completo (badge in fondo al curriculum e nel CV in PDF)
  const techStack = ref([
    'Visual Basic 6', 'C#', '.NET', 'WinForms',
    'JavaScript', 'Vue.js', 'Vuetify', 'Pinia', 'PrimeVue',
    'Express.js', 'Node.js', 'REST API', 'Java', 'NetBeans',
    'Microsoft Access', 'NHibernate', 'Figma', 'Git', 'HTML5', 'CSS3'
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
    techStack,
    technologies
  }
})
