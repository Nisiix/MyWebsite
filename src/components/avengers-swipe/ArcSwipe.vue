<script setup>
// Kit Avengers Swipe v4 (elmo, da destra a sinistra, energia rossa).
import { ref } from 'vue'
import SwipeBase from './SwipeBase.vue'
const props = defineProps({
  threshold: { type: Number, default: 0.82 },
  disabled: { type: Boolean, default: false },
  label: { type: String, default: '' },
  doneText: { type: String, default: '' },
  readyText: { type: String, default: '' },
  chargeText: { type: String, default: '' }
})
const emit = defineEmits(['activate', 'animation-end'])
const control = ref(null)
defineExpose({ reset: () => control.value?.reset(), focus: () => control.value?.focus() })
</script>
<template>
  <SwipeBase ref="control" side="ironman" :threshold="props.threshold" :disabled="props.disabled" :label="props.label"
    :done-text="props.doneText" :ready-text="props.readyText" :charge-text="props.chargeText" @activate="emit('activate')" @animation-end="emit('animation-end')" />
</template>
