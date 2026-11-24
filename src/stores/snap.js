import { ref } from 'vue'

// Stato del pulsante "Schiocca le dita" della home, condiviso con lo sfondo animato.
// mode: 'normal' (scritta di blocchi) | 'snapped' (blocchi caduti, scritta fatta di orsacchiotti)
// instant: true quando si torna a 'normal' senza animazione (per esempio cambiando pagina)
export const snap = ref({ mode: 'normal', instant: false })

export function setSnap(mode, instant = false) {
  snap.value = { mode, instant }
}
