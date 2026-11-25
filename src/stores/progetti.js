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
        it: 'App desktop per gestire la roadmap di uno o più progetti: attività con priorità, stato e scadenze, commenti con @menzioni, allegati, ruoli e notifiche. I dati restano in una cartella locale o condivisa in rete, senza bisogno di un server; l\'IA locale tramite Ollama è facoltativa. Disponibile in italiano e in inglese.',
        en: 'Desktop app to manage the roadmap of one or more projects: tasks with priority, status and due dates, comments with @mentions, attachments, roles and notifications. Data stays in a local or shared network folder, no server needed. Optional local AI via Ollama. Available in Italian and English.'
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
        it: 'Gioco di ruolo educativo sugli investimenti in stile console portatile: quiz di finanza contro 8 Whale, gli avversari del gioco, e missioni di trading simulato su prezzi reali tramite Alpaca, sempre con denaro finto. Si gioca dal browser, anche offline, con salvataggi online.',
        en: 'Educational investing RPG in handheld-console style: finance quizzes against 8 Whales, the game\'s rivals, and paper trading missions on real prices through Alpaca, always with fake money. Playable in the browser, even offline, with cloud saves.'
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
