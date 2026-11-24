<template>
  <button
    ref="root"
    type="button"
    class="snap-chip"
    :class="[{ cooling, waiting, dragging }, phase && 'is-' + phase]"
    :style="fallStyle"
    :disabled="waiting"
    :aria-label="ariaLabel"
    :aria-pressed="current === 'sacrifice'"
    @pointerenter="onEnter"
    @pointerleave="onLeave"
    @pointerdown="onDown"
    @pointermove="onMove"
    @pointerup="onUp"
    @pointercancel="onUp"
    @focus="onFocus"
    @blur="onBlur"
    @click="onClick"
    @keydown="onKey"
  >
    <span class="snap-inner" :style="{ transform: `rotateY(${turns * 180}deg)` }">
      <!-- tutte le facce invisibili: danno al pulsante la larghezza della più lunga -->
      <span v-for="k in KINDS" :key="'s' + k" class="snap-face snap-sizer" :class="{ slider: k !== 'chip' }" aria-hidden="true">
        <i v-if="k === 'chip'" class="pi pi-code"></i><span>{{ labels[k] }}</span>
      </span>
      <span
        v-for="i in [0, 1]"
        :key="'f' + i"
        :ref="(el) => (faceEls[i] = el)"
        class="snap-face"
        :class="[i ? 'back' : 'front', 'is-' + faces[i], { slider: faces[i] !== 'chip', moved: prog[i] > 0 }]"
        :style="{ '--p': prog[i] }"
        aria-hidden="true"
      >
        <template v-if="faces[i] === 'chip'">
          <i class="pi pi-code"></i><span>{{ labels.chip }}</span>
        </template>
        <template v-else>
          <span class="slide-label">{{ labels[faces[i]] }}</span>
          <span class="knob">
            <i class="pi" :class="faces[i] === 'snap' ? 'pi-angle-double-right' : 'pi-angle-double-left'"></i>
          </span>
        </template>
      </span>
    </span>
  </button>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { t } from '@/i18n'
import { setSnap, snapReady } from '@/stores/snap'

const KINDS = ['chip', 'snap', 'sacrifice']
const COOLDOWN = 5000
const KNOB = 28 // diametro della manopola (px), uguale al CSS
const INSET = 3 // distanza della manopola dal bordo (px), uguale al CSS
const DONE_AT = 0.9 // rilasciata oltre questa quota, la manopola va a fine corsa

const labels = computed(() => ({
  chip: t('home.badge'),
  snap: t('home.snap'),
  sacrifice: t('home.sacrifice')
}))

// la carta gira sempre di mezzo giro: la faccia visibile è turns % 2,
// e il contenuto della faccia nascosta viene scelto prima di girarla
const turns = ref(0)
const faces = ref(['chip', 'chip'])
const prog = ref([0, 0]) // corsa della manopola di ciascuna faccia, da 0 a 1
const faceEls = []
const root = ref(null)
const cooling = ref(false)
const dragging = ref(false)
let coolTimer, actTimer, nudgeTimer, phaseTimer
// dopo lo schiocco il pulsante cade fuori dallo schermo come i blocchi di NISIIX,
// resta nascosto (occupando il suo posto) e riappare in dissolvenza a scritta completa
const phase = ref('') // '' | 'falling' | 'hidden' | 'appearing'
const fallStyle = ref({})
const GRAVITY = 2400 // px/s², la stessa dei blocchi dello sfondo
const visible = computed(() => ((turns.value % 2) + 2) % 2)
const current = computed(() => faces.value[visible.value])
const isSlider = computed(() => current.value !== 'chip')
// "Sacrifica Iron Man" si può usare solo quando ogni robottino è al suo posto
const waiting = computed(() => current.value === 'sacrifice' && !snapReady.value)
const ariaLabel = computed(() =>
  isSlider.value ? `${labels.value[current.value]} (${t('home.slideHint')})` : labels.value.chip
)

function setProg(i, v) {
  const p = [...prog.value]
  p[i] = v
  prog.value = p
}

function show(kind, back = false) {
  const next = turns.value + (back ? -1 : 1)
  const idx = ((next % 2) + 2) % 2
  const f = [...faces.value]
  f[idx] = kind
  faces.value = f
  setProg(idx, 0)
  turns.value = next
}

function offerSnap() {
  if (current.value === 'chip' && !cooling.value) show('snap')
}

// fine corsa raggiunta: parte l'azione del pulsante (logica invariata)
function complete() {
  if (waiting.value) return
  const kind = current.value
  setProg(visible.value, 1)
  clearTimeout(actTimer)
  actTimer = setTimeout(() => {
    if (current.value !== kind) return
    if (kind === 'snap') {
      setSnap('snapped')
      fall()
    } else {
      setSnap('normal')
      show('chip')
      cooling.value = true
      clearTimeout(coolTimer)
      coolTimer = setTimeout(() => (cooling.value = false), COOLDOWN)
    }
  }, 220)
}

function fall() {
  const r = root.value.getBoundingClientRect()
  const drop = window.innerHeight - r.top + r.height + 40
  const dur = Math.sqrt((2 * drop) / GRAVITY)
  fallStyle.value = { '--fall-dist': `${drop}px`, '--fall-dur': `${dur}s` }
  phase.value = 'falling'
  clearTimeout(phaseTimer)
  phaseTimer = setTimeout(() => {
    phase.value = 'hidden'
    // mentre è nascosto prepara la faccia "Sacrifica Iron Man"
    show('sacrifice')
    if (snapReady.value) appear()
  }, dur * 1000)
}

function appear() {
  phase.value = 'appearing'
  clearTimeout(phaseTimer)
  phaseTimer = setTimeout(() => (phase.value = ''), 900)
}

// i robottini hanno composto la scritta: il pulsante riappare al suo posto
watch(snapReady, (ready) => {
  if (ready && phase.value === 'hidden') appear()
})

// ---- trascinamento (mouse e touch) ----
let drag = null

function onDown(e) {
  if (!isSlider.value || waiting.value || e.button > 0) return
  const face = faceEls[visible.value]
  if (!face) return
  const w = face.getBoundingClientRect().width
  drag = {
    id: e.pointerId,
    x: e.clientX,
    p0: prog.value[visible.value],
    travel: Math.max(w - KNOB - INSET * 2, 1),
    dir: current.value === 'snap' ? 1 : -1
  }
  dragging.value = true
  root.value.setPointerCapture?.(e.pointerId)
}

function onMove(e) {
  if (!drag || e.pointerId !== drag.id) return
  const p = drag.p0 + (drag.dir * (e.clientX - drag.x)) / drag.travel
  setProg(visible.value, Math.min(Math.max(p, 0), 1))
}

function onUp(e) {
  if (!drag || e.pointerId !== drag.id) return
  drag = null
  dragging.value = false
  // non si ferma a metà: o arriva in fondo, o torna all'inizio
  if (e.type === 'pointerup' && prog.value[visible.value] >= DONE_AT) complete()
  else setProg(visible.value, 0)
  // il mouse è uscito durante il trascinamento: la chip torna com'era
  const r = root.value.getBoundingClientRect()
  const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
  if (!inside && e.pointerType === 'mouse' && current.value === 'snap' && prog.value[visible.value] < 1) show('chip', true)
}

function onEnter(e) {
  if (e.pointerType === 'mouse') offerSnap()
}
function onLeave(e) {
  if (drag || e.pointerType !== 'mouse') return
  if (current.value === 'snap' && prog.value[visible.value] < 1) show('chip', true)
}
function onFocus(e) {
  // solo da tastiera: col mouse ci pensa già l'hover
  if (e.target.matches(':focus-visible')) offerSnap()
}
function onBlur() {
  if (current.value === 'snap' && prog.value[visible.value] < 1) show('chip', true)
}

function onClick(e) {
  if (current.value === 'chip') return offerSnap() // touch o tastiera: il primo tocco gira la chip
  if (e.detail === 0) return complete() // Invio o Spazio da tastiera
  // un semplice clic non basta: piccolo accenno della manopola per suggerire lo scorrimento
  if (!dragging.value && prog.value[visible.value] === 0 && !waiting.value) {
    setProg(visible.value, 0.18)
    clearTimeout(nudgeTimer)
    nudgeTimer = setTimeout(() => prog.value[visible.value] < 1 && setProg(visible.value, 0), 260)
  }
}

function onKey(e) {
  if (!isSlider.value) return
  if ((e.key === 'ArrowRight' && current.value === 'snap') || (e.key === 'ArrowLeft' && current.value === 'sacrifice')) {
    e.preventDefault()
    complete()
  }
}

onUnmounted(() => {
  clearTimeout(coolTimer)
  clearTimeout(actTimer)
  clearTimeout(nudgeTimer)
  clearTimeout(phaseTimer)
  setSnap('normal', true)
})
</script>

<style scoped>
.snap-chip {
  display: inline-block;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  cursor: pointer;
  perspective: 600px;
  border-radius: 100px;
  touch-action: pan-y;
  user-select: none;
  -webkit-user-select: none;
}
.snap-chip.is-falling {
  pointer-events: none;
  /* accelera come un oggetto che cade (stessa gravità dei blocchi) */
  animation: chip-fall var(--fall-dur, 0.8s) cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards;
}
.snap-chip.is-hidden {
  visibility: hidden;
  pointer-events: none;
}
.snap-chip.is-appearing {
  animation: chip-appear 0.9s cubic-bezier(0.2, 0.7, 0.3, 1) both;
}
@keyframes chip-fall {
  from { transform: translateY(0) rotate(0); }
  to { transform: translateY(var(--fall-dist, 100vh)) rotate(9deg); }
}
@keyframes chip-appear {
  from { opacity: 0; transform: scale(0.85); filter: blur(6px); }
  to { opacity: 1; transform: none; filter: none; }
}
.snap-chip.cooling {
  cursor: default;
}
.snap-chip:focus-visible {
  outline: 2px solid var(--gold);
  outline-offset: 4px;
}

.snap-inner {
  display: grid;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1);
}

.snap-face {
  grid-area: 1 / 1;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 20px;
  border-radius: 100px;
  border: 1px solid var(--border-gold);
  background: var(--gold-subtle);
  color: var(--gold);
  font-size: 0.88rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  white-space: nowrap;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.snap-face i {
  font-size: 0.8rem;
}
.snap-sizer {
  visibility: hidden;
}
.back {
  transform: rotateY(180deg);
}

/* ---- slider "scorri per…" ---- */
.slider {
  padding: 8px 18px 8px 44px;
  overflow: hidden;
  cursor: grab;
}
.is-sacrifice.slider {
  padding: 8px 44px 8px 18px;
}
.snap-chip.dragging .slider {
  cursor: grabbing;
}
.slide-label {
  opacity: calc(1 - var(--p) * 0.85);
  transition: opacity 0.25s;
  /* riflesso che scorre nella direzione in cui va trascinata la manopola */
  background: linear-gradient(90deg, var(--txt) 0 38%, var(--glint) 50%, var(--txt) 62% 100%);
  background-size: 260% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: none;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.45));
  animation: glint-r 2.2s linear infinite;
}
.is-sacrifice .slide-label {
  animation-name: glint-l;
}
@keyframes glint-r {
  from { background-position: 100% 0; }
  to { background-position: 0 0; }
}
@keyframes glint-l {
  from { background-position: 0 0; }
  to { background-position: 100% 0; }
}
/* la manopola accenna da sola la direzione finché non la si tocca */
.slider:not(.moved) .knob {
  animation: nudge-r 2.6s ease-in-out 0.6s infinite;
}
.is-sacrifice.slider:not(.moved) .knob {
  animation-name: nudge-l;
}
.snap-chip.waiting .knob,
.snap-chip.waiting .slide-label {
  animation: none !important;
}
@keyframes nudge-r {
  0%, 55%, 100% { transform: translateX(0); }
  20% { transform: translateX(14px); }
  32% { transform: translateX(4px); }
  42% { transform: translateX(9px); }
}
@keyframes nudge-l {
  0%, 55%, 100% { transform: translateX(0); }
  20% { transform: translateX(-14px); }
  32% { transform: translateX(-4px); }
  42% { transform: translateX(-9px); }
}
.knob {
  position: absolute;
  top: 50%;
  left: calc(3px + (100% - 28px - 6px) * var(--p));
  width: 28px;
  height: 28px;
  margin-top: -14px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  transition: left 0.25s cubic-bezier(0.3, 0.7, 0.3, 1);
}
.is-sacrifice .knob {
  left: calc(3px + (100% - 28px - 6px) * (1 - var(--p)));
}
.snap-chip.dragging .knob,
.snap-chip.dragging .slide-label {
  transition: none;
}
.knob i {
  font-size: 0.78rem;
}

/* colori ispirati al titano viola: viola profondo e oro */
.is-snap {
  --txt: #ffd54a;
  --glint: #fffbe6;
  background: linear-gradient(135deg, #3b1260, #6a2c91 55%, #4a1a72);
  border-color: #e8b923;
  color: #ffd54a;
  box-shadow: 0 0 18px rgba(138, 63, 190, 0.55), inset 0 0 10px rgba(232, 185, 35, 0.25);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}
.is-snap .knob {
  background: radial-gradient(circle at 35% 30%, #ffe27a, #e8b923 60%, #a87a0c);
  color: #3b1260;
  box-shadow: 0 0 10px rgba(255, 213, 74, 0.7);
}

/* colori ispirati all'armatura: rosso acceso e oro */
.is-sacrifice {
  --txt: #ffe08a;
  --glint: #ffffff;
  transition: filter 0.4s, box-shadow 0.4s;
  background: linear-gradient(135deg, #d32f2f, #e53935 50%, #d32f2f);
  border-color: #f2c14e;
  color: #ffe08a;
  box-shadow: 0 0 18px rgba(214, 40, 30, 0.55), inset 0 0 0 2px rgba(242, 193, 78, 0.35);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}
.is-sacrifice .knob {
  background: radial-gradient(circle at 35% 30%, #fff1c2, #f2c14e 60%, #b8860b);
  color: #8e0e0e;
  box-shadow: 0 0 10px rgba(127, 231, 255, 0.6);
}
.snap-chip.waiting {
  cursor: progress;
}
.snap-chip.waiting .is-sacrifice {
  filter: saturate(0.8);
  box-shadow: none;
  cursor: progress;
}

@media (prefers-reduced-motion: reduce) {
  .snap-inner {
    transition-duration: 0.2s;
  }
  .slide-label {
    animation-duration: 4s;
  }
}
</style>
