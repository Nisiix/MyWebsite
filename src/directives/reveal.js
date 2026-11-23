// v-reveal: reveals an element (and optionally staggers it) the first time
// it scrolls into view. Usage: v-reveal or v-reveal="index" for a stagger.
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

let observer = null

function getObserver() {
  if (observer) return observer
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const el = entry.target
        el.classList.add('is-revealed')
        observer.unobserve(el)
        const delay = parseFloat(el.style.getPropertyValue('--reveal-delay')) || 0
        setTimeout(() => el.classList.remove('reveal'), delay + 750)
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  )
  return observer
}

export const reveal = {
  mounted(el, binding) {
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      el.classList.add('is-revealed')
      return
    }
    const step = Number(binding.value) || 0
    el.style.setProperty('--reveal-delay', `${Math.min(step, 6) * 90}ms`)
    el.classList.add('reveal')
    getObserver().observe(el)
  },
  unmounted(el) {
    observer?.unobserve(el)
  }
}

// Pointer spotlight: keeps --mx / --my on the hovered .glass-card (or any
// [data-spotlight] element) so CSS can draw a soft gold light under the cursor.
export function installSpotlight() {
  if (window.matchMedia('(hover: none)').matches) return
  document.addEventListener(
    'pointermove',
    (e) => {
      const el = e.target.closest?.('.glass-card, [data-spotlight]')
      if (!el) return
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${e.clientX - r.left}px`)
      el.style.setProperty('--my', `${e.clientY - r.top}px`)
    },
    { passive: true }
  )
}
