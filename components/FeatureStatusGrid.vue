<script setup lang="ts">
const props = defineProps<{
  supportsServiceWorker: boolean | null
  supportsNotifications: boolean | null
  supportsClipboard: boolean | null
  supportsGeolocation: boolean | null
  supportsWebRTC: boolean | null
  supportsWebGL: boolean | null
  supportsWebGPU: boolean | null
  supportsIndexedDB: boolean | null
}>()

const features = [
  { name: 'Service Worker', supported: props.supportsServiceWorker },
  { name: 'Notifications', supported: props.supportsNotifications },
  { name: 'Clipboard', supported: props.supportsClipboard },
  { name: 'Geolocation', supported: props.supportsGeolocation },
  { name: 'WebRTC', supported: props.supportsWebRTC },
  { name: 'WebGL', supported: props.supportsWebGL },
  { name: 'WebGPU', supported: props.supportsWebGPU },
  { name: 'IndexedDB', supported: props.supportsIndexedDB }
]
</script>

<template>
  <div class="space-y-2">
    <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-400">
      API Support
    </h4>
    <div class="grid grid-cols-2 gap-2">
      <div
        v-for="feature in features"
        :key="feature.name"
        class="flex items-center gap-2 rounded-lg bg-slate-900/60 px-2.5 py-1.5"
      >
        <span
          class="h-1.5 w-1.5 rounded-full flex-shrink-0"
          :class="feature.supported ? 'bg-emerald-400' : 'bg-slate-600'"
        />
        <span class="text-xs text-slate-300">{{ feature.name }}</span>
      </div>
    </div>
  </div>
</template>

