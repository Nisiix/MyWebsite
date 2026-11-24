import { nextTick } from 'vue'
import { START_LOCATION } from 'vue-router'

// Il browser sa fare le View Transitions? (Chrome, Edge, Safari 18+, Firefox 144+)
export const supportsViewTransitions =
  typeof document !== 'undefined' && typeof document.startViewTransition === 'function'

// Cambio pagina con le View Transitions del browser: la pagina vecchia sfuma e la nuova entra
// (animazione in main.css, ::view-transition-*). Dove non sono supportate resta la dissolvenza
// di Vue in App.vue. Con "riduci movimento" il cambio è immediato.
export function installViewTransitions(router) {
  if (!supportsViewTransitions) return
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  let finish = null
  const done = () => {
    const f = finish
    finish = null
    f?.()
  }

  router.beforeResolve((to, from) => {
    if (from === START_LOCATION || to.path === from.path) return
    if (reducedMotion.matches) return
    done()
    // la navigazione prosegue solo quando il browser ha fotografato la pagina vecchia
    return new Promise((resolve) => {
      const vt = document.startViewTransition(
        () =>
          new Promise((ready) => {
            // se un passaggio precedente era ancora aperto (clic ravvicinati), lo chiudiamo
            done()
            finish = ready
            resolve()
          })
      )
      // un passaggio interrotto da uno nuovo viene saltato: non è un errore
      vt.ready.catch(() => {})
      vt.updateCallbackDone.catch(() => {})
      vt.finished.catch(() => {})
    })
  })

  // la nuova pagina è nel DOM: il browser può animare il passaggio
  router.afterEach(async () => {
    if (!finish) return
    await nextTick()
    done()
  })
  router.onError(done)
}
