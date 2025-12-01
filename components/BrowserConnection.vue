<script setup lang="ts">
const props = defineProps<{
  connectionType: string | null
  connectionDownlink: number | null
  connectionRtt: number | null
  connectionSaveData: boolean | null
}>()
</script>

<template>
  <div
    v-if="props.connectionType || props.connectionDownlink || props.connectionRtt || props.connectionSaveData !== null"
    class="flex flex-col gap-1 rounded-lg bg-slate-950/60 px-3 py-2"
  >
    <dt class="text-[0.7rem] font-medium text-slate-300">Browser connection</dt>
    <dd class="mt-0.5 text-[0.72rem] text-slate-400">
      <span v-if="props.connectionType">
        Effective type:
        <span class="font-medium text-slate-200">
          {{ props.connectionType }}
        </span>
      </span>
      <span v-else>
        Network Information API not reported by this browser.
      </span>
    </dd>
    <dd class="text-[0.7rem] text-slate-500">
      <span v-if="props.connectionDownlink != null">
        Downlink: {{ props.connectionDownlink }} Mbps
      </span>
      <span v-if="props.connectionRtt != null">
        • RTT: {{ props.connectionRtt }} ms
      </span>
      <span v-if="props.connectionSaveData != null" class="block">
        Data saver: {{ props.connectionSaveData ? 'Enabled' : 'Disabled' }}
      </span>
    </dd>
  </div>
</template>

