import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useProgettiStore = defineStore('progetti', () => {
  const projects = ref([
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
