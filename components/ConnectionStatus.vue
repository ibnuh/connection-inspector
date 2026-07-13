<script setup lang="ts">
  import { computed } from 'vue'
  import { formatMbps, formatMs } from '@/utils/format'
  import {
    formatConnectionTransport,
    formatEffectiveType,
    formatIpNetworkContext
  } from '@/utils/connection'

  const props = defineProps<{
    online: boolean | null
    /** navigator.connection.type when available */
    connectionTransport?: string | null
    /** navigator.connection.effectiveType (performance class) */
    connectionEffectiveType?: string | null
    /** @deprecated legacy effectiveType binding */
    connectionType: string | null
    connectionRtt: number | null
    connectionDownlink: number | null
    connectionSaveData: boolean | null
    clientRtt: number | null
    isMobile: boolean | null
    isDatacenter: boolean | null
    isSatellite: boolean | null
    locationCountry: string | null
    locationCity: string | null
    asnOrg: string | null
  }>()

  const transport = computed(() => props.connectionTransport ?? null)
  const effectiveType = computed(
    () => props.connectionEffectiveType ?? props.connectionType ?? null
  )

  const transportLabel = computed(() => formatConnectionTransport(transport.value))
  const effectiveTypeLabel = computed(() => formatEffectiveType(effectiveType.value))
  const ipContextLabel = computed(() =>
    formatIpNetworkContext({
      isMobile: props.isMobile,
      isDatacenter: props.isDatacenter,
      isSatellite: props.isSatellite
    })
  )

  const rttLabel = computed(() => formatMs(props.clientRtt ?? props.connectionRtt))
  const downlinkLabel = computed(() => formatMbps(props.connectionDownlink))
</script>

<template>
  <div class="space-y-3">
    <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-400">Connection Status</h4>

    <dl class="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
      <div class="min-w-0 rounded-lg bg-slate-950/60 px-3 py-2">
        <dt class="text-[0.7rem] text-slate-400">Online</dt>
        <dd
          class="mt-1 break-words font-medium"
          :class="props.online ? 'text-emerald-300' : 'text-rose-300'"
        >
          {{ props.online ? 'Yes' : 'No' }}
        </dd>
      </div>

      <div class="min-w-0 rounded-lg bg-slate-950/60 px-3 py-2">
        <dt class="text-[0.7rem] text-slate-400">Transport</dt>
        <dd class="mt-1 break-words font-medium text-slate-200">
          {{ transportLabel }}
        </dd>
        <p class="mt-0.5 text-[0.65rem] leading-snug text-slate-600">
          From Network Information API
          <code class="text-slate-500">type</code>
          when exposed.
        </p>
      </div>

      <div class="min-w-0 rounded-lg bg-slate-950/60 px-3 py-2">
        <dt class="text-[0.7rem] text-slate-400">Effective speed class</dt>
        <dd class="mt-1 break-words font-medium text-slate-200">
          {{ effectiveTypeLabel }}
        </dd>
        <p class="mt-0.5 text-[0.65rem] leading-snug text-slate-600">
          Performance estimate only. “4G-class” on Wi‑Fi is normal, not cellular.
        </p>
      </div>

      <div class="min-w-0 rounded-lg bg-slate-950/60 px-3 py-2">
        <dt class="text-[0.7rem] text-slate-400">IP network context</dt>
        <dd class="mt-1 break-words font-medium text-slate-200">
          {{ ipContextLabel }}
        </dd>
        <p class="mt-0.5 text-[0.65rem] leading-snug text-slate-600">
          From IP intel flags, not the browser link type.
        </p>
      </div>

      <div
        v-if="props.connectionRtt !== null || props.clientRtt !== null"
        class="min-w-0 rounded-lg bg-slate-950/60 px-3 py-2"
      >
        <dt class="text-[0.7rem] text-slate-400">Round-Trip Time</dt>
        <dd class="mt-1 break-words font-medium tabular-nums text-slate-200">
          {{ rttLabel }}
        </dd>
      </div>

      <div
        v-if="props.connectionDownlink !== null"
        class="min-w-0 rounded-lg bg-slate-950/60 px-3 py-2"
      >
        <dt class="text-[0.7rem] text-slate-400">Downlink</dt>
        <dd class="mt-1 break-words font-medium tabular-nums text-slate-200">
          {{ downlinkLabel }}
        </dd>
      </div>

      <div
        v-if="props.connectionSaveData !== null"
        class="min-w-0 rounded-lg bg-slate-950/60 px-3 py-2"
      >
        <dt class="text-[0.7rem] text-slate-400">Data Saver</dt>
        <dd
          class="mt-1 break-words font-medium"
          :class="props.connectionSaveData ? 'text-yellow-300' : 'text-slate-400'"
        >
          {{ props.connectionSaveData ? 'Enabled' : 'Disabled' }}
        </dd>
      </div>
    </dl>
  </div>
</template>
