import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useProgettiStore = defineStore('progetti', () => {
  const projects = ref([
    {
      name: 'GestPro Manager',
      description: 'Piattaforma gestionale completa per PMI con moduli fatturazione, magazzino, CRM e reportistica avanzata. Interfaccia moderna costruita con Vue.js e Vuetify.',
      tags: ['Vue.js', 'Vuetify', 'Express.js', 'SQL Server'],
      color: '#D4AF37'
    },
    {
      name: 'FlowBoard Studio',
      description: 'Tool di project management visuale con board Kanban personalizzabili, automazioni workflow e dashboard analytics in tempo reale per team di sviluppo.',
      tags: ['Vue.js', 'Pinia', 'Node.js', 'MongoDB'],
      color: '#4A9EE5'
    },
    {
      name: 'InvoiceX Template Engine',
      description: 'Motore di template per la generazione automatica di documenti fiscali, preventivi e report personalizzati con esportazione multi-formato (PDF, XLSX, CSV).',
      tags: ['C#', '.NET', 'WPF', 'SQLite'],
      color: '#E8567F'
    },
    {
      name: 'DataSync Hub',
      description: 'Middleware di sincronizzazione dati tra sistemi legacy VB6 e applicazioni web moderne, con mappatura automatica dei campi e log di audit completo.',
      tags: ['VB6', 'C#', 'REST API', 'SQL Server'],
      color: '#45B7A0'
    }
  ])

  return {
    projects
  }
})
