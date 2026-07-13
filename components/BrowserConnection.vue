<script setup lang="ts">
  import { computed } from 'vue'
  import { formatConnectionTransport, formatEffectiveType } from '@/utils/connection'
  import { formatMbps, formatMs } from '@/utils/format'

  const props = defineProps<{
    connectionTransport?: string | null
    connectionEffectiveType?: string | null
    /** @deprecated legacy effectiveType */
    connectionType: string | null
    connectionDownlink: number | null
    connectionRtt: number | null
    connectionSaveData: boolean | null
  }>()

  const transportLabel = computed(() =>
    formatConnectionTransport(props.connectionTransport ?? null)
  )
  const effectiveLabel = computed(() =>
    formatEffectiveType(props.connectionEffectiveType ?? props.connectionType)
  )

  const hasData = computed(
    () =>
      props.connectionTransport != null ||
      props.connectionEffectiveType != null ||
      props.connectionType != null ||
      props.connectionDownlink != null ||
      props.connectionRtt != null ||
      props.connectionSaveData != null
  )
</script>

<template>
  <div v-if="hasData" class="flex min-w-0 flex-col gap-1 rounded-lg bg-slate-950/60 px-3 py-2">
    <dt class="text-[0.7rem] font-medium text-slate-300">Browser connection</dt>
    <dd class="mt-0.5 break-words text-[0.72rem] text-slate-400">
      <span>
        Transport:
        <span class="font-medium text-slate-200">{{ transportLabel }}</span>
      </span>
      <span class="block">
        Effective speed class:
        <span class="font-medium text-slate-200">{{ effectiveLabel }}</span>
      </span>
    </dd>
    <dd class="break-words text-[0.7rem] text-slate-500">
      <span v-if="props.connectionDownlink != null">
        Downlink: {{ formatMbps(props.connectionDownlink) }}
      </span>
      <span v-if="props.connectionRtt != null"> · RTT: {{ formatMs(props.connectionRtt) }} </span>
      <span v-if="props.connectionSaveData != null" class="block">
        Data saver: {{ props.connectionSaveData ? 'Enabled' : 'Disabled' }}
      </span>
    </dd>
  </div>
</template>
