// v-spin-title="testo": il titolo compare lettera per lettera, da sinistra a destra,
// con ogni lettera che ruota su sé stessa, ogni volta che entra nello schermo.
// Gli screen reader leggono il testo intero; le lettere animate sono solo decorative.
// Usare su un elemento senza contenuto: il testo arriva dal valore della direttiva.
const STEP = 55 // ms tra una lettera e la successiva

// Due osservatori: uno fa partire l'animazione quando il titolo è entrato bene nello
// schermo (non appena spunta dal bordo, quando lo sguardo è ancora altrove), l'altro la
// riarma quando il titolo è uscito del tutto, così riparte ogni volta che si torna lì.
let starter = null
let resetter = null

function observers() {
  if (starter) return
  starter = new IntersectionObserver(
    (entries) => {
      for (const e of entries) if (e.isIntersecting) e.target.classList.add('spin-in')
    },
    { threshold: 0.6, rootMargin: '0px 0px -18% 0px' }
  )
  resetter = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) e.target.classList.remove('spin-in', 'spin-static')
    }
  })
}

function render(el, text) {
  el.textContent = ''
  const sr = document.createElement('span')
  sr.className = 'sr-only'
  sr.textContent = text
  const shown = document.createElement('span')
  shown.className = 'spin-letters'
  shown.setAttribute('aria-hidden', 'true')
  let i = 0
  text.split(' ').forEach((word, w) => {
    if (w) shown.appendChild(document.createTextNode(' '))
    // ogni parola resta intera quando il titolo va a capo
    const wEl = document.createElement('span')
    wEl.className = 'spin-word'
    for (const ch of word) {
      const l = document.createElement('span')
      l.className = 'spin-letter'
      l.textContent = ch
      l.style.setProperty('--d', `${i++ * STEP}ms`)
      wEl.appendChild(l)
    }
    shown.appendChild(wEl)
  })
  el.style.setProperty('--spin-total', `${i * STEP}ms`)
  el.appendChild(sr)
  el.appendChild(shown)
  el.dataset.spinText = text
}

export const spinTitle = {
  mounted(el, { value }) {
    el.classList.add('spin-title')
    render(el, String(value ?? ''))
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || !('IntersectionObserver' in window)) el.classList.add('spin-in', 'spin-static')
    else {
      observers()
      starter.observe(el)
      resetter.observe(el)
    }
  },
  updated(el, { value }) {
    // cambio lingua: nuovo testo, senza rifare l'animazione se era già comparso
    const text = String(value ?? '')
    if (text !== el.dataset.spinText) {
      render(el, text)
      if (el.classList.contains('spin-in')) el.classList.add('spin-static')
    }
  },
  unmounted(el) {
    starter?.unobserve(el)
    resetter?.unobserve(el)
  }
}
