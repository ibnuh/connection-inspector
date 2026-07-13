<script setup lang="ts">
  import { computed } from 'vue'
  import { formatMbps, formatMs } from '@/utils/format'

  const props = defineProps<{
    online: boolean | null
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

  const connectionTypeLabel = computed(() => {
    if (props.isSatellite) {
      return 'Satellite'
    }
    if (props.isMobile) {
      return 'Cellular'
    }
    if (props.isDatacenter) {
      return 'Datacenter'
    }
    if (props.connectionType) {
      const types: Record<string, string> = {
        'slow-2g': 'Slow 2G',
        '2g': '2G',
        '3g': '3G',
        '4g': '4G',
        '5g': '5G'
      }
      return types[props.connectionType] || props.connectionType
    }
    return 'Unknown'
  })

  const wanTypeLabel = computed(() => {
    if (props.isSatellite) {
      return 'Satellite'
    }
    if (props.isMobile) {
      return 'Cellular'
    }
    if (props.isDatacenter) {
      return 'Datacenter'
    }
    return 'Unknown'
  })

  const rttLabel = computed(() => formatMs(props.clientRtt ?? props.connectionRtt))
  const downlinkLabel = computed(() => formatMbps(props.connectionDownlink))
</script>

<template>
  <div class="space-y-3">
    <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-400">Connection Status</h4>

    <dl class="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
      <div class="min-w-0 rounded-lg bg-slate-950/60 px-3 py-2">
        <dt class="text-[0.7rem] text-slate-400">Local Area Network (LAN)</dt>
        <dd
          class="mt-1 break-words font-medium"
          :class="props.online ? 'text-emerald-300' : 'text-slate-500'"
        >
          {{ props.online ? 'Connected' : 'Disconnected' }}
        </dd>
      </div>

      <div class="min-w-0 rounded-lg bg-slate-950/60 px-3 py-2">
        <dt class="text-[0.7rem] text-slate-400">Internet Access</dt>
        <dd
          class="mt-1 break-words font-medium"
          :class="props.online ? 'text-emerald-300' : 'text-rose-300'"
        >
          {{ props.online ? 'Yes' : 'No' }}
        </dd>
      </div>

      <div class="min-w-0 rounded-lg bg-slate-950/60 px-3 py-2">
        <dt class="text-[0.7rem] text-slate-400">Connection Type</dt>
        <dd class="mt-1 break-words font-medium text-slate-200">
          {{ connectionTypeLabel }}
        </dd>
      </div>

      <div class="min-w-0 rounded-lg bg-slate-950/60 px-3 py-2">
        <dt class="text-[0.7rem] text-slate-400">Wide Area Network (WAN)</dt>
        <dd class="mt-1 break-words font-medium text-slate-200">
          {{ wanTypeLabel }}
        </dd>
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
