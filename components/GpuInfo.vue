<script setup lang="ts">
const props = defineProps<{
  gpuRenderer: string | null
  gpuVendor: string | null
}>()
</script>

<template>
  <div class="mt-2 rounded-xl border border-slate-800/80 bg-slate-950/60 px-3 py-2 text-xs text-slate-400">
    <p class="mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
      GPU / Renderer (WebGL)
    </p>
    <p class="text-[0.7rem] text-slate-300">
      <span v-if="props.gpuRenderer">
        {{ props.gpuRenderer }}
      </span>
      <span v-else>
        Not reported; WebGL renderer is unavailable or blocked.
      </span>
    </p>
    <p v-if="props.gpuVendor" class="mt-0.5 text-[0.7rem] text-slate-500">
      Vendor:
      <span class="font-medium text-slate-300">
        {{ props.gpuVendor }}
      </span>
    </p>
    <p class="mt-0.5 text-[0.65rem] text-slate-500">
      This information comes from a lightweight WebGL context and can sometimes differ from the
      underlying physical GPU name.
    </p>
  </div>
</template>

