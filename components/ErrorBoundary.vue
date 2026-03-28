<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue'

const props = defineProps<{
  fallback?: string
}>()

const hasError = ref(false)
const errorMessage = ref('')

onErrorCaptured((err) => {
  hasError.value = true
  errorMessage.value = err instanceof Error ? err.message : String(err)
  // Prevent error from propagating
  return false
})

function reset() {
  hasError.value = false
  errorMessage.value = ''
}
</script>

<template>
  <div v-if="hasError" class="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
    <p class="text-sm font-medium text-red-400">
      {{ props.fallback || 'Something went wrong' }}
    </p>
    <p class="mt-1 text-xs text-red-400/80">
      {{ errorMessage }}
    </p>
    <button
      type="button"
      class="mt-3 rounded-lg border border-red-500/30 bg-red-500/20 px-3 py-1 text-xs font-medium text-red-400 hover:bg-red-500/30"
      @click="reset"
    >
      Try Again
    </button>
  </div>
  <slot v-else />
</template>
