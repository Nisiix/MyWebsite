<template>
  <!--
    Chip "Software developer" che diventa i pulsanti a scorrimento del kit Avengers Swipe:
    il guanto (InfinitySwipe, verso destra) per "Schiocca le dita" e l'elmo (ArcSwipe, verso
    sinistra) per "Sacrifica Iron Man". Ne è montato al più uno alla volta.
    La logica resta quella di prima: la chip si gira al passaggio del mouse (o al tocco / da
    tastiera), dopo lo schiocco il pulsante cade come i blocchi e riappare in dissolvenza
    quando la scritta è di nuovo completa, "Sacrifica" si sblocca solo allora.
  -->
  <div
    ref="root"
    class="snap-chip"
    :class="[{ cooling, waiting, swiping: isSlider }, phase && 'is-' + phase]"
    :style="[fallStyle, { '--k': scale }]"
    @pointerenter="onEnter"
    @pointerleave="onLeave"
    @pointerup="onPointerUp"
    @focusout="onFocusOut"
  >
    <div class="snap-inner" :style="{ transform: `rotateY(${turns * 180}deg)` }">
      <!-- faccia invisibile: dà al pulsante le misure della chip -->
      <span ref="sizer" class="snap-face snap-sizer" aria-hidden="true"><i class="pi pi-code"></i><span>{{ labels.chip }}</span></span>
      <div
        v-for="i in [0, 1]"
        :key="'f' + i"
        class="snap-face"
        :class="[i ? 'back' : 'front', 'is-' + faces[i], { slider: faces[i] !== 'chip' }]"
        :aria-hidden="i !== visible"
        :inert="i !== visible"
      >
        <button
          v-if="faces[i] === 'chip'"
          type="button"
          class="chip-btn"
          :tabindex="i === visible ? 0 : -1"
          @click="onChipClick"
          @focus="onChipFocus"
        >
          <i class="pi pi-code" aria-hidden="true"></i><span>{{ labels.chip }}</span>
        </button>
        <template v-else-if="mounted(i)">
          <InfinitySwipe
            v-if="faces[i] === 'snap'"
            :ref="(c) => (swipes[i] = c)"
            :threshold="THRESHOLD"
            :label="`${labels.snap}: ${t('home.slideHint')}`"
            :done-text="labels.snap"
            :fill-text="labels.inevitable"
            :ready-text="t('home.slideReady')"
            :charge-text="t('home.slideCharge')"
            @activate="onSnap"
          />
          <ArcSwipe
            v-else
            :ref="(c) => (swipes[i] = c)"
            :threshold="THRESHOLD"
            :disabled="waiting"
            :fill-text="labels.love"
            :label="`${labels.sacrifice}: ${t('home.slideHint')}`"
            :done-text="labels.sacrifice"
            :ready-text="t('home.slideReady')"
            :charge-text="t('home.slideCharge')"
            @activate="onSacrifice"
            @animation-end="onSacrificeEnd"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { t } from '@/i18n'
import { snap, setSnap, snapReady } from '@/stores/snap'
import InfinitySwipe from './avengers-swipe/InfinitySwipe.vue'
import ArcSwipe from './avengers-swipe/ArcSwipe.vue'

const COOLDOWN = 5000
const THRESHOLD = 0.9 // quota di corsa oltre la quale il rilascio vale (come prima)
const FALL_DELAY = 200 // ms: il lampo del gesto parte prima che il pulsante cada
// altezza dello slider nel suo disegno (--size 46px + 2 × --pad 6px, vedi CSS): viene
// rimpicciolito in proporzione fino all'altezza della chip, con la stessa grafica
const SLIDER_H = 58
const APPEAR_MS = 2400 // ricomparsa lenta e progressiva del pulsante (uguale al CSS)

const labels = computed(() => ({
  chip: t('home.badge'),
  snap: t('home.snap'),
  sacrifice: t('home.sacrifice'),
  love: t('home.sacrificeText'),
  inevitable: t('home.snapText')
}))

// la carta gira sempre di mezzo giro: la faccia visibile è turns % 2,
// e il contenuto della faccia nascosta viene scelto prima di girarla
const turns = ref(0)
// tornando in home con lo schiocco ancora attivo si riparte da "Sacrifica Iron Man"
const faces = ref([snap.value.mode === 'snapped' ? 'sacrifice' : 'chip', 'chip'])
const swipes = []
const root = ref(null)
const sizer = ref(null)
const scale = ref(0.72) // altezza della chip / altezza dello slider, misurata al montaggio
let sizeObserver
const cooling = ref(false)
let coolTimer, phaseTimer, fallTimer
// dopo lo schiocco il pulsante cade fuori dallo schermo come i blocchi di NISIIX,
// resta nascosto (occupando il suo posto) e riappare in dissolvenza a scritta completa
const phase = ref('') // '' | 'falling' | 'hidden' | 'appearing'
const fallStyle = ref({})
const GRAVITY = 2400 // px/s², la stessa dei blocchi dello sfondo
const visible = computed(() => ((turns.value % 2) + 2) % 2)
const current = computed(() => faces.value[visible.value])
const isSlider = computed(() => current.value !== 'chip')
// "Sacrifica Iron Man" si può usare solo quando la scritta è di nuovo completa
const waiting = computed(() => current.value === 'sacrifice' && !snapReady.value)

// un componente di scorrimento è montato solo sulla faccia visibile (o su quella che sta
// girando via mentre torna la chip): mai due insieme
const mounted = (i) => i === visible.value || faces.value[visible.value] === 'chip'

function show(kind, back = false) {
  const next = turns.value + (back ? -1 : 1)
  const idx = ((next % 2) + 2) % 2
  const f = [...faces.value]
  f[idx] = kind
  faces.value = f
  turns.value = next
}

// stato del gesto nel pulsante visibile: 'idle' | 'drag' | 'success'
function swipePhase() {
  return root.value?.querySelector('.snap-face.is-' + current.value + ' .av-swipe')?.dataset.phase ?? 'idle'
}

function offerSnap(focus = false) {
  if (current.value !== 'chip' || cooling.value || phase.value) return
  show('snap')
  if (focus) nextTick(() => swipes[visible.value]?.focus())
}

function backToChip() {
  if (current.value === 'snap' && swipePhase() === 'idle') show('chip', true)
}

// ---- azioni: le stesse di prima ----
function onSnap() {
  setSnap('snapped')
  clearTimeout(fallTimer)
  fallTimer = setTimeout(fall, FALL_DELAY)
}

function onSacrifice() {
  setSnap('normal')
  cooling.value = true
  clearTimeout(coolTimer)
  coolTimer = setTimeout(() => (cooling.value = false), COOLDOWN)
}

// finito il lampo rosso torna la chip
function onSacrificeEnd() {
  if (current.value === 'sacrifice') show('chip')
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
    // mentre è nascosto prepara il pulsante "Sacrifica Iron Man"
    show('sacrifice')
    if (snapReady.value) appear()
  }, dur * 1000)
}

function appear() {
  phase.value = 'appearing'
  clearTimeout(phaseTimer)
  phaseTimer = setTimeout(() => (phase.value = ''), APPEAR_MS)
}

// la scritta è di nuovo completa: il pulsante riappare al suo posto
watch(snapReady, (ready) => {
  if (ready && phase.value === 'hidden') appear()
})

// ---- quando la chip si gira ----
function onEnter(e) {
  if (e.pointerType === 'mouse') offerSnap()
}
function onLeave(e) {
  if (e.pointerType === 'mouse') backToChip()
}
// trascinamento finito fuori dal pulsante senza arrivare in fondo: torna la chip
function onPointerUp(e) {
  if (e.pointerType !== 'mouse' || !root.value) return
  // il pulsante è più largo della chip: vale anche il suo rettangolo
  const face = root.value.querySelector('.snap-face.is-' + current.value)
  const inside = [root.value, face].some((el) => {
    const r = el?.getBoundingClientRect()
    return r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
  })
  if (!inside) nextTick(backToChip)
}
// touch o tastiera: il primo tocco gira la chip e porta il focus sulla maniglia,
// così toccando altrove (o con Tab) la chip torna com'era
function onChipClick() {
  offerSnap(true)
}
function onChipFocus(e) {
  // solo da tastiera: col mouse ci pensa già l'hover
  if (e.target.matches(':focus-visible')) offerSnap(true)
}
function onFocusOut(e) {
  // la faccia che si gira via diventa inerte e perde il focus: non vuol dire che si è usciti
  if (e.target.closest('[inert]')) return
  if (!root.value?.contains(e.relatedTarget)) backToChip()
}

// la chip cambia misura con la lingua e i font: lo slider la segue
onMounted(() => {
  const measure = () => {
    const h = sizer.value?.offsetHeight
    if (h) scale.value = h / SLIDER_H
  }
  measure()
  if (typeof ResizeObserver !== 'undefined' && sizer.value) {
    sizeObserver = new ResizeObserver(measure)
    sizeObserver.observe(sizer.value)
  }
})

onUnmounted(() => {
  sizeObserver?.disconnect()
  clearTimeout(coolTimer)
  clearTimeout(phaseTimer)
  clearTimeout(fallTimer)
  // lo schiocco resta attivo anche cambiando pagina: si annulla solo con "Sacrifica Iron Man"
})
</script>

<style scoped>
.snap-chip {
  display: inline-block;
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
  /* lenta e progressiva: la durata è APPEAR_MS nello script */
  animation: chip-appear 2.4s cubic-bezier(0.45, 0, 0.25, 1) both;
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
.chip-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  letter-spacing: inherit;
  cursor: pointer;
}
.chip-btn::after {
  /* tutta la chip è cliccabile */
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
}
.chip-btn:focus-visible {
  outline: none;
}
.snap-face:has(.chip-btn:focus-visible) {
  outline: 2px solid var(--gold);
  outline-offset: 4px;
}
.cooling .chip-btn {
  cursor: default;
}

.snap-inner {
  position: relative;
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

/* ---- pulsanti a scorrimento (kit Avengers Swipe) ----
   disegnati alla loro misura e rimpiccioliti in proporzione (--k, calcolato nello script)
   fino a coprire esattamente la chip: stessa grafica, stessa larghezza e altezza della chip */
.snap-face.slider {
  position: absolute;
  left: 50%;
  top: 50%;
  width: calc(100% / var(--k, 0.72));
  padding: 0;
  border: 0;
  background: none;
  transform: translate(-50%, -50%) scale(var(--k, 0.72));
}
.snap-face.slider.back {
  transform: translate(-50%, -50%) rotateY(180deg) scale(var(--k, 0.72));
}
.snap-face.slider :deep(.av-swipe) {
  --size: 46px;
  --pad: 6px;
  font-size: 0.9rem;
}
.snap-face.slider :deep(.av-track) {
  border-radius: 18px;
}
.snap-face.slider :deep(.av-track::before) {
  border-radius: 13px;
}
.snap-face.slider :deep(.av-rail) {
  inset: 7px;
  border-radius: 12px;
}
.snap-face.slider :deep(.av-handle) {
  border-radius: 13px;
}
.snap-face.slider :deep(.av-handle::before) {
  border-radius: 9px;
}
.snap-chip.waiting {
  cursor: progress;
}

@media (prefers-reduced-motion: reduce) {
  .snap-inner {
    transition-duration: 0.2s;
  }
}
</style>
