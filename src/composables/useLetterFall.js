// "Schiocca le dita" sui testi di una pagina (home, Curriculum, Progetti): esattamente metà delle lettere, scelte a caso,
// cadono verso il basso e spariscono man mano che i testi entrano nello schermo.
// Con "Sacrifica Iron Man" risalgono dal basso e tornano al loro posto nella parola.
//
// Le lettere scelte vengono avvolte in <span class="fall-l"> che restano nel testo:
// lo spazio occupato non cambia (niente salti di layout) e gli screen reader leggono
// sempre il testo intero. Alla fine i nodi di testo originali vengono rimessi al loro
// posto, così Vue continua ad aggiornarli come prima.
import { watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { snap } from '@/stores/snap'
import { locale } from '@/i18n'

const GRAVITY = 2400 // px/s², la stessa dei blocchi dello sfondo
const SKIP = '.sr-only, .snap-chip, .hero-word, script, style, svg, [data-no-fall]'

export function useLetterFall(rootRef) {
  let pieces = [] // { original, parent, nodes: [...] } per ogni nodo di testo diviso
  let letters = [] // span delle lettere scelte
  let observer = null
  let cleanupTimer = 0

  function textNodes(root) {
    const out = []
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if (!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT
        if (n.parentElement.closest(SKIP)) return NodeFilter.FILTER_REJECT
        return NodeFilter.FILTER_ACCEPT
      }
    })
    while (walker.nextNode()) out.push(walker.currentNode)
    return out
  }

  // divide i testi e avvolge esattamente metà delle lettere (spazi esclusi)
  function wrap(root) {
    const nodes = textNodes(root)
    const slots = []
    nodes.forEach((n, ni) => {
      const chars = [...n.nodeValue]
      chars.forEach((ch, ci) => {
        if (ch.trim()) slots.push([ni, ci])
      })
    })
    // scelta casuale di esattamente metà (Fisher-Yates parziale)
    const want = Math.floor(slots.length / 2)
    for (let i = 0; i < want; i++) {
      const j = i + Math.floor(Math.random() * (slots.length - i))
      ;[slots[i], slots[j]] = [slots[j], slots[i]]
    }
    const chosen = new Map() // indice nodo -> Set di indici carattere
    for (const [ni, ci] of slots.slice(0, want)) {
      if (!chosen.has(ni)) chosen.set(ni, new Set())
      chosen.get(ni).add(ci)
    }
    for (const [ni, set] of chosen) {
      const original = nodes[ni]
      const parent = original.parentNode
      const frag = document.createDocumentFragment()
      const made = []
      // le parole con lettere scelte vanno in uno span che non va a capo, così il testo
      // si spezza sulle righe esattamente come prima
      for (const m of original.nodeValue.matchAll(/\S+|\s+/g)) {
        const start = [...original.nodeValue.slice(0, m.index)].length
        const word = [...m[0]]
        const has = word.some((_, k) => set.has(start + k))
        if (!has) {
          made.push(document.createTextNode(m[0]))
          continue
        }
        const w = document.createElement('span')
        w.className = 'fall-w'
        let run = ''
        word.forEach((ch, k) => {
          if (!set.has(start + k)) {
            run += ch
            return
          }
          if (run) w.appendChild(document.createTextNode(run))
          run = ''
          const l = document.createElement('span')
          l.className = 'fall-l'
          l.textContent = ch
          w.appendChild(l)
          letters.push(l)
        })
        if (run) w.appendChild(document.createTextNode(run))
        made.push(w)
      }
      made.forEach((m) => frag.appendChild(m))
      parent.replaceChild(frag, original)
      pieces.push({ original, parent, nodes: made })
    }
  }

  // le lettere di un elemento entrato nello schermo cadono, con un piccolo sfasamento
  function drop(el) {
    const vh = window.innerHeight
    for (const s of el.querySelectorAll(':scope > .fall-w > .fall-l:not(.is-falling):not(.is-gone)')) {
      const r = s.getBoundingClientRect()
      const dist = Math.max(vh - r.top + 40, 80)
      const dur = Math.sqrt((2 * dist) / GRAVITY)
      const delay = Math.random() * 0.6
      s.style.setProperty('--fall', `${dist}px`)
      s.style.setProperty('--fall-dur', `${dur}s`)
      s.style.setProperty('--fall-delay', `${delay}s`)
      s.style.setProperty('--fall-rot', `${(Math.random() * 2 - 1) * 70}deg`)
      s.classList.add('is-falling')
      s.addEventListener(
        'animationend',
        () => {
          // finita la caduta resta invisibile al suo posto: nessuno spazio aggiunto in fondo
          if (s.classList.contains('is-falling')) s.classList.replace('is-falling', 'is-gone')
        },
        { once: true }
      )
    }
  }

  function start() {
    const root = rootRef.value
    if (!root || letters.length) return
    wrap(root)
    // si osserva l'elemento che contiene il testo (la parola è solo un involucro)
    const parents = new Set(letters.map((s) => s.parentElement.parentElement))
    observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          drop(e.target)
          observer.unobserve(e.target)
        }
      },
      { threshold: 0, rootMargin: '0px 0px -12% 0px' }
    )
    parents.forEach((p) => observer.observe(p))
  }

  // rimette i nodi di testo originali
  function restore() {
    clearTimeout(cleanupTimer)
    observer?.disconnect()
    observer = null
    for (const { original, nodes } of pieces) {
      const first = nodes[0]
      if (first?.parentNode) first.parentNode.insertBefore(original, first)
      nodes.forEach((n) => n.remove())
    }
    pieces = []
    letters = []
  }

  // risalita: come la caduta ma al contrario. Le lettere di un testo tornano al loro posto,
  // dal basso, quando quel testo entra nello schermo scorrendo la pagina; quando sono
  // tornate tutte, il testo originale viene rimesso al suo posto.
  function rise() {
    observer?.disconnect()
    const fallen = letters.filter((s) => s.classList.contains('is-falling') || s.classList.contains('is-gone'))
    let left = fallen.length
    if (!left) return restore()
    const done = () => {
      if (--left === 0) cleanupTimer = setTimeout(restore, 50)
    }
    const lift = (el) => {
      for (const s of el.querySelectorAll(':scope > .fall-w > .fall-l')) {
        if (!s.classList.contains('is-falling') && !s.classList.contains('is-gone')) continue
        s.style.setProperty('--fall-delay', `${Math.random() * 0.6}s`)
        s.classList.remove('is-falling', 'is-gone')
        void s.offsetWidth // riparte l'animazione
        s.classList.add('is-rising')
        s.addEventListener('animationend', done, { once: true })
      }
    }
    const parents = new Set(fallen.map((s) => s.parentElement.parentElement))
    observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          lift(e.target)
          observer.unobserve(e.target)
        }
      },
      { threshold: 0, rootMargin: '0px 0px -12% 0px' }
    )
    parents.forEach((p) => observer.observe(p))
  }

  watch(snap, ({ mode, instant }) => {
    if (mode === 'snapped') {
      // nuovo schiocco mentre le lettere stanno ancora risalendo: si riparte da capo
      if (letters.length) restore()
      start()
    }
    else if (instant) restore()
    else rise()
  })

  // cambio lingua: i testi originali tornano al loro posto prima che Vue li aggiorni,
  // poi, se lo schiocco è ancora attivo, metà delle nuove lettere cade di nuovo
  watch(
    locale,
    () => {
      if (!pieces.length) return
      restore()
      nextTick(() => snap.value.mode === 'snapped' && start())
    },
    { flush: 'pre' }
  )

  // si arriva su una pagina con lo schiocco già attivo (Curriculum, Progetti, o di nuovo
  // la home): anche qui metà delle lettere cade man mano che si scorre
  onMounted(() => {
    if (snap.value.mode === 'snapped') nextTick(start)
  })

  onBeforeUnmount(restore)

  return { restore }
}
