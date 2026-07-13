<script setup lang="ts">
  import { computed } from 'vue'
  import { formatDevicePixelRatio } from '@/utils/format'

  const props = defineProps<{
    screenWidth: number | null
    screenHeight: number | null
    devicePixelRatio: number | null
    colorDepth: number | null
    hardwareConcurrency: number | null
    maxTouchPoints: number | null
    platform: string | null
  }>()

  const pixelRatioLabel = computed(() => formatDevicePixelRatio(props.devicePixelRatio))
</script>

<template>
  <dl class="mt-2 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
    <div class="min-w-0 rounded-lg bg-slate-950/60 px-3 py-2">
      <dt class="text-[0.7rem] font-medium text-slate-300">Resolution</dt>
      <dd class="mt-0.5 break-words text-[0.8rem] tabular-nums text-slate-200">
        <span v-if="props.screenWidth && props.screenHeight">
          {{ props.screenWidth }} × {{ props.screenHeight }}
        </span>
        <span v-else>Unknown</span>
      </dd>
    </div>
    <div class="min-w-0 rounded-lg bg-slate-950/60 px-3 py-2">
      <dt class="text-[0.7rem] font-medium text-slate-300">Pixel ratio</dt>
      <dd class="mt-0.5 break-words text-[0.8rem] tabular-nums text-slate-200">
        {{ pixelRatioLabel }}
        <span v-if="props.devicePixelRatio != null" class="text-slate-500">×</span>
      </dd>
    </div>
    <div class="min-w-0 rounded-lg bg-slate-950/60 px-3 py-2">
      <dt class="text-[0.7rem] font-medium text-slate-300">Color depth</dt>
      <dd class="mt-0.5 break-words text-[0.8rem] tabular-nums text-slate-200">
        <span v-if="props.colorDepth">{{ props.colorDepth }}-bit</span>
        <span v-else>Unknown</span>
      </dd>
    </div>
    <div class="min-w-0 rounded-lg bg-slate-950/60 px-3 py-2">
      <dt class="text-[0.7rem] font-medium text-slate-300">CPU threads</dt>
      <dd class="mt-0.5 break-words text-[0.8rem] tabular-nums text-slate-200">
        {{ props.hardwareConcurrency ?? 'Unknown' }}
      </dd>
    </div>
    <div class="min-w-0 rounded-lg bg-slate-950/60 px-3 py-2">
      <dt class="text-[0.7rem] font-medium text-slate-300">Touch points</dt>
      <dd class="mt-0.5 break-words text-[0.8rem] tabular-nums text-slate-200">
        {{ props.maxTouchPoints ?? 'Unknown' }}
      </dd>
    </div>
    <div class="min-w-0 rounded-lg bg-slate-950/60 px-3 py-2">
      <dt class="text-[0.7rem] font-medium text-slate-300">Platform</dt>
      <dd class="mt-0.5 break-words text-[0.8rem] text-slate-200">
        {{ props.platform || 'Unknown' }}
      </dd>
    </div>
  </dl>
</template>
