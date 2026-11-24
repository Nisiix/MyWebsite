<script setup>
// Kit Avengers Swipe v4: parte condivisa da InfinitySwipe e ArcSwipe (non montarla da sola).
// Adattato al sito: JavaScript invece di TypeScript, etichette e annunci accessibili passati dal padre.
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { mountSwipe } from './swipe-engine.js'
import './swipe.css'
const props = defineProps({
  side: { type: String, required: true }, // 'thanos' | 'ironman'
  threshold: { type: Number, default: 0.82 },
  disabled: { type: Boolean, default: false },
  label: { type: String, default: '' }, // nome accessibile della maniglia
  doneText: { type: String, default: '' }, // annuncio per screen reader a gesto completato
  readyText: { type: String, default: '' }, // annuncio "premi Invio per confermare"
  chargeText: { type: String, default: '' }, // annuncio della carica da tastiera, {n} = percentuale
  fillText: { type: String, default: '' } // testo che compare dove arriva il riempimento colorato
})
const emit = defineEmits(['activate', 'animation-end'])
const root = ref(null)
let controller
onMounted(() => {
  if (!root.value) return
  controller = mountSwipe(root.value, { side: props.side, threshold: props.threshold, disabled: props.disabled, doneText: props.doneText,
    readyText: () => props.readyText, chargeText: (n) => props.chargeText.replace('{n}', n),
    onCommit: () => emit('activate'), onComplete: () => emit('animation-end') })
})
watch(() => props.disabled, value => controller?.setDisabled(value))
watch(() => props.threshold, value => controller?.setThreshold(value))
onBeforeUnmount(() => controller?.destroy())
defineExpose({ reset: () => controller?.reset(), focus: () => root.value?.querySelector('.av-handle')?.focus() })
</script>
<template>
<div class="av-swipe" :data-mode="side" data-side="none" data-phase="idle" data-disabled="false" ref="root">
  <div class="av-track">
    <div class="av-rail" aria-hidden="true"><div class="av-fill"></div><span v-if="fillText" class="av-fill-text">{{ fillText }}</span></div>
    <div class="av-labels" aria-hidden="true"><div class="av-direction" :class="side === 'thanos' ? 'av-direction-right' : 'av-direction-left'"><i></i><i></i><i></i></div></div>
    <div class="av-dust" aria-hidden="true"><i style="--x:24%;--y:13%;--s:4px;--dx:-40px;--dy:-3px;--delay:-0.22s;--c:#ae79ff"></i><i style="--x:23%;--y:79%;--s:2px;--dx:41px;--dy:43px;--delay:-0.03s;--c:#ff655c"></i><i style="--x:21%;--y:37%;--s:2px;--dx:19px;--dy:-59px;--delay:-0.56s;--c:#59c7ff"></i><i style="--x:79%;--y:63%;--s:2px;--dx:4px;--dy:6px;--delay:-0.81s;--c:#f5dc73"></i><i style="--x:10%;--y:30%;--s:4px;--dx:-2px;--dy:22px;--delay:-0.28s;--c:#71f0a1"></i><i style="--x:37%;--y:53%;--s:2px;--dx:-87px;--dy:32px;--delay:-0.10s;--c:#f9a34e"></i><i style="--x:54%;--y:87%;--s:3px;--dx:96px;--dy:-54px;--delay:-0.73s;--c:#ae79ff"></i><i style="--x:78%;--y:25%;--s:3px;--dx:-90px;--dy:10px;--delay:-0.83s;--c:#ff655c"></i><i style="--x:89%;--y:56%;--s:4px;--dx:-61px;--dy:-48px;--delay:-0.05s;--c:#59c7ff"></i><i style="--x:39%;--y:47%;--s:2px;--dx:108px;--dy:-6px;--delay:-0.87s;--c:#f5dc73"></i><i style="--x:58%;--y:45%;--s:3px;--dx:52px;--dy:28px;--delay:-0.16s;--c:#71f0a1"></i><i style="--x:55%;--y:36%;--s:4px;--dx:-42px;--dy:-47px;--delay:-0.61s;--c:#f9a34e"></i><i style="--x:31%;--y:78%;--s:4px;--dx:-48px;--dy:-24px;--delay:-0.46s;--c:#ae79ff"></i><i style="--x:44%;--y:81%;--s:2px;--dx:65px;--dy:18px;--delay:-0.84s;--c:#ff655c"></i><i style="--x:17%;--y:39%;--s:2px;--dx:96px;--dy:15px;--delay:-0.40s;--c:#59c7ff"></i><i style="--x:18%;--y:37%;--s:4px;--dx:73px;--dy:15px;--delay:-0.21s;--c:#f5dc73"></i><i style="--x:73%;--y:60%;--s:4px;--dx:7px;--dy:-29px;--delay:-0.26s;--c:#71f0a1"></i><i style="--x:41%;--y:81%;--s:4px;--dx:-43px;--dy:44px;--delay:-0.90s;--c:#f9a34e"></i><i style="--x:61%;--y:56%;--s:2px;--dx:-75px;--dy:65px;--delay:-0.49s;--c:#ae79ff"></i><i style="--x:16%;--y:24%;--s:2px;--dx:50px;--dy:-25px;--delay:-0.79s;--c:#ff655c"></i><i style="--x:64%;--y:86%;--s:2px;--dx:-12px;--dy:32px;--delay:-0.60s;--c:#59c7ff"></i><i style="--x:69%;--y:77%;--s:3px;--dx:31px;--dy:-63px;--delay:-0.68s;--c:#f5dc73"></i><i style="--x:24%;--y:78%;--s:3px;--dx:86px;--dy:22px;--delay:-0.11s;--c:#71f0a1"></i><i style="--x:65%;--y:30%;--s:3px;--dx:-110px;--dy:2px;--delay:-0.97s;--c:#f9a34e"></i><i style="--x:32%;--y:74%;--s:2px;--dx:50px;--dy:11px;--delay:-0.84s;--c:#ae79ff"></i><i style="--x:74%;--y:87%;--s:2px;--dx:-71px;--dy:30px;--delay:-0.76s;--c:#ff655c"></i><i style="--x:79%;--y:77%;--s:2px;--dx:43px;--dy:17px;--delay:-0.49s;--c:#59c7ff"></i><i style="--x:24%;--y:56%;--s:3px;--dx:-49px;--dy:-51px;--delay:-0.24s;--c:#f5dc73"></i><i style="--x:82%;--y:20%;--s:2px;--dx:77px;--dy:59px;--delay:-0.82s;--c:#71f0a1"></i><i style="--x:78%;--y:26%;--s:2px;--dx:58px;--dy:56px;--delay:-0.95s;--c:#f9a34e"></i><i style="--x:31%;--y:43%;--s:4px;--dx:45px;--dy:43px;--delay:-0.96s;--c:#ae79ff"></i><i style="--x:79%;--y:35%;--s:4px;--dx:-31px;--dy:37px;--delay:-1.00s;--c:#ff655c"></i><i style="--x:57%;--y:66%;--s:4px;--dx:5px;--dy:-35px;--delay:-0.25s;--c:#59c7ff"></i><i style="--x:18%;--y:53%;--s:2px;--dx:40px;--dy:-7px;--delay:-0.59s;--c:#f5dc73"></i></div>
    <button v-if="side === 'thanos'" type="button" class="av-handle thanos" :aria-label="label || 'Infinity Protocol: trascina a destra oppure premi freccia destra più volte e Invio'"><img src="./assets/gauntlet.svg" alt="" draggable="false"></button>
    <button v-else type="button" class="av-handle ironman" :aria-label="label || 'Arc Protocol: trascina a sinistra oppure premi freccia sinistra più volte e Invio'"><img src="./assets/helmet.svg" alt="" draggable="false"></button>
    <div class="av-meter" aria-hidden="true"><i></i></div>
  </div>
  <span class="av-sr av-live" aria-live="polite"></span>
</div>
</template>
