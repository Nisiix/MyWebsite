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
      name: 'Invoice Template Engine',
      description: 'Motore di template per la generazione automatica di documenti fiscali, preventivi e report personalizzati con esportazione multi-formato (PDF, XLSX, CSV).',
      tags: ['C#', '.NET', 'WPF', 'SQLite'],
      color: '#E8567F'
    },
    {
      name: 'DataSync Hub',
      description: 'Middleware di sincronizzazione dati tra sistemi legacy VB6 e applicazioni web moderne, con mappatura automatica dei campi e log di audit completo.',
      tags: ['VB6', 'C#', 'REST API', 'SQL Server'],
      color: '#45B7A0'
    },
    {
      name: 'Todo Doto',
      description: 'App desktop per gestire la roadmap di uno o più progetti: attività con priorità, stato e scadenze, commenti con @menzioni, allegati, ruoli e notifiche. I dati vivono in una cartella locale o di rete condivisa, senza server, con IA locale facoltativa tramite Ollama. Disponibile in italiano e in inglese.',
      tags: ['Tauri 2', 'Vue 3', 'TypeScript', 'Rust'],
      color: '#9B7FE6',
      icon: 'pi pi-check-square',
      url: 'https://nisiix.github.io/Todo-Doto/'
    },
    {
      name: 'Tradermon',
      description: 'Gioco di ruolo educativo sugli investimenti in stile console portatile: quiz di finanza contro 8 Whale e missioni di paper trading su prezzi reali tramite Alpaca, sempre con denaro finto. PWA giocabile anche offline, con salvataggi online.',
      tags: ['Phaser', 'TypeScript', 'Vite', 'Supabase'],
      color: '#F08A3C',
      icon: 'pi pi-chart-line',
      url: 'https://nisiix.github.io/Tradermon/'
    }
  ])

  return {
    projects
  }
})
