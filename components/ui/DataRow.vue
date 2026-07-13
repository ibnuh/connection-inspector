<script setup lang="ts">
  import { computed } from 'vue'

  const props = defineProps<{
    label: string
    value?: string | number | null
    hint?: string
    copyable?: boolean
    mono?: boolean
    class?: string
  }>()

  const displayValue = computed(() => {
    if (props.value === null || props.value === undefined || props.value === '') {
      return 'Unknown'
    }
    return String(props.value)
  })

  async function copyToClipboard() {
    if (!props.copyable || props.value == null) {
      return
    }
    try {
      await navigator.clipboard.writeText(String(props.value))
    } catch {
      // Ignore copy errors
    }
  }
</script>

<template>
  <div :class="['flex items-start justify-between gap-2 py-1', props.class]">
    <div class="min-w-0 shrink-0 max-w-[40%]">
      <dt class="text-xs text-slate-400">{{ props.label }}</dt>
      <p v-if="props.hint" class="mt-0.5 text-[0.65rem] text-slate-600">{{ props.hint }}</p>
    </div>
    <dd
      :class="[
        'mt-0.5 min-w-0 max-w-[60%] break-words text-right text-xs font-medium text-slate-200',
        props.mono ? 'font-mono break-all' : ''
      ]"
    >
      <button
        v-if="props.copyable"
        type="button"
        class="hover:text-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        @click="copyToClipboard"
      >
        {{ displayValue }}
      </button>
      <span v-else>{{ displayValue }}</span>
    </dd>
  </div>
</template>
