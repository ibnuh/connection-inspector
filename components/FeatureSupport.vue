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
  onlineEvents: { at: string; online: boolean }[]
}>()
</script>

<template>
  <div class="border-t border-slate-800 pt-2">
    <p class="mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
      Feature support
    </p>
    <ul class="grid grid-cols-2 gap-2 text-[0.7rem] sm:grid-cols-3">
      <li class="flex items-center gap-1.5">
        <span
          class="h-1.5 w-1.5 rounded-full"
          :class="props.supportsServiceWorker ? 'bg-emerald-400' : 'bg-slate-600'"
        />
        <span>Service Worker</span>
      </li>
      <li class="flex items-center gap-1.5">
        <span
          class="h-1.5 w-1.5 rounded-full"
          :class="props.supportsNotifications ? 'bg-emerald-400' : 'bg-slate-600'"
        />
        <span>Notifications</span>
      </li>
      <li class="flex items-center gap-1.5">
        <span
          class="h-1.5 w-1.5 rounded-full"
          :class="props.supportsClipboard ? 'bg-emerald-400' : 'bg-slate-600'"
        />
        <span>Clipboard API</span>
      </li>
      <li class="flex items-center gap-1.5">
        <span
          class="h-1.5 w-1.5 rounded-full"
          :class="props.supportsGeolocation ? 'bg-emerald-400' : 'bg-slate-600'"
        />
        <span>Geolocation</span>
      </li>
      <li class="flex items-center gap-1.5">
        <span
          class="h-1.5 w-1.5 rounded-full"
          :class="props.supportsWebRTC ? 'bg-emerald-400' : 'bg-slate-600'"
        />
        <span>WebRTC</span>
      </li>
      <li class="flex items-center gap-1.5">
        <span
          class="h-1.5 w-1.5 rounded-full"
          :class="props.supportsWebGL ? 'bg-emerald-400' : 'bg-slate-600'"
        />
        <span>WebGL</span>
      </li>
      <li class="flex items-center gap-1.5">
        <span
          class="h-1.5 w-1.5 rounded-full"
          :class="props.supportsWebGPU ? 'bg-emerald-400' : 'bg-slate-600'"
        />
        <span>WebGPU</span>
      </li>
      <li class="flex items-center gap-1.5">
        <span
          class="h-1.5 w-1.5 rounded-full"
          :class="props.supportsIndexedDB ? 'bg-emerald-400' : 'bg-slate-600'"
        />
        <span>IndexedDB</span>
      </li>
      <li
        v-if="props.onlineEvents.length"
        class="col-span-2 mt-1 text-[0.7rem] text-slate-400"
      >
        <span class="mr-1 font-medium text-slate-200">
          Session connectivity:
        </span>
        <span
          v-for="(evt, idx) in props.onlineEvents.slice(-4)"
          :key="`${evt.at}-${idx}`"
          class="inline-flex items-center gap-1 text-[0.7rem]"
        >
          <span
            class="h-1.5 w-1.5 rounded-full"
            :class="evt.online ? 'bg-emerald-400' : 'bg-rose-400'"
          />
          <span class="text-slate-400">
            {{ evt.online ? 'online' : 'offline' }} at {{ evt.at }}
          </span>
          <span
            v-if="idx < props.onlineEvents.slice(-4).length - 1"
            class="mx-1 text-slate-700"
          >
            •
          </span>
        </span>
      </li>
    </ul>
  </div>
</template>

