import { defineStore } from 'pinia'
import { ref } from 'vue'
import todoDotoPreview from '@/assets/progetti/todo-doto.webp'
import tradermonPreview from '@/assets/progetti/tradermon.webp'

// Descrizioni bilingui: { it: '...', en: '...' }
export const useProgettiStore = defineStore('progetti', () => {
  const projects = ref([
    {
      name: 'Todo Doto',
      description: {
        it: 'App desktop per gestire la roadmap di uno o più progetti: attività con priorità, stato e scadenze, commenti con @menzioni, allegati, ruoli e notifiche. I dati vivono in una cartella locale o di rete condivisa, senza server, con IA locale facoltativa tramite Ollama. Disponibile in italiano e in inglese.',
        en: 'Desktop app to manage the roadmap of one or more projects: tasks with priority, status and due dates, comments with @mentions, attachments, roles and notifications. Data lives in a local or shared network folder, with no server, and optional local AI through Ollama. Available in Italian and English.'
      },
      tags: ['Tauri 2', 'Vue 3', 'TypeScript', 'Rust'],
      color: '#9B7FE6',
      url: 'https://nisiix.github.io/Todo-Doto/',
      // Screenshot della landing page del progetto
      image: todoDotoPreview
    },
    {
      name: 'Tradermon',
      description: {
        it: 'Gioco di ruolo educativo sugli investimenti in stile console portatile: quiz di finanza contro 8 Whale e missioni di paper trading su prezzi reali tramite Alpaca, sempre con denaro finto. PWA giocabile anche offline, con salvataggi online.',
        en: 'Educational investing RPG in handheld-console style: finance quizzes against 8 Whales and paper trading missions on real prices through Alpaca, always with fake money. A PWA playable offline, with online saves.'
      },
      tags: ['Phaser', 'TypeScript', 'Vite', 'Supabase'],
      color: '#F08A3C',
      url: 'https://nisiix.github.io/Tradermon/',
      // Screenshot della landing page del progetto
      image: tradermonPreview
    }
  ])

  return {
    projects
  }
})
