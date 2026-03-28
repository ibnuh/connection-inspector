<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  value?: string | number | null
  copyable?: boolean
  mono?: boolean
  class?: string
}>()

const displayValue = computed(() => {
  if (props.value === null || props.value === undefined) {
    return 'Unknown'
  }
  return String(props.value)
})

async function copyToClipboard() {
  if (!props.copyable || !props.value) return
  try {
    await navigator.clipboard.writeText(String(props.value))
  } catch {
    // Ignore copy errors
  }
}
</script>

<template>
  <div :class="['flex items-center justify-between gap-2 py-1', props.class]">
    <dt class="text-xs text-slate-400">{{ props.label }}</dt>
    <dd
      :class="[
        'mt-0.5 text-right text-xs font-medium text-slate-200',
        props.mono ? 'font-mono' : ''
      ]"
    >
      <button
        v-if="props.copyable"
        type="button"
        class="hover:text-sky-400 focus:outline-none"
        @click="copyToClipboard"
      >
        {{ displayValue }}
      </button>
      <span v-else>{{ displayValue }}</span>
    </dd>
  </div>
</template>
