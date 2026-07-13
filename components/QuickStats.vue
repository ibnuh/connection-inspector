<script setup lang="ts">
  import { computed } from 'vue'

  const props = defineProps<{
    locationCountry: string | null
    locationCity: string | null
    locationState: string | null
    asnOrg: string | null
    asnNumber: number | null
    isp: string | null
    clientRtt: number | null
    elapsedMs: number | null
  }>()

  const locationDisplay = computed(() => {
    const parts: string[] = []
    if (props.locationCity) parts.push(props.locationCity)
    if (props.locationState) parts.push(props.locationState)
    if (props.locationCountry) parts.push(props.locationCountry)
    return parts.length > 0 ? parts.join(', ') : 'Unknown'
  })
</script>

<template>
  <div class="space-y-3">
    <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-400">Quick Stats</h4>

    <dl class="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
      <div class="min-w-0 rounded-lg bg-slate-950/60 px-3 py-2">
        <dt class="text-[0.7rem] text-slate-400">Location</dt>
        <dd class="mt-1 break-words font-medium text-slate-200">
          {{ locationDisplay }}
        </dd>
      </div>

      <div class="min-w-0 rounded-lg bg-slate-950/60 px-3 py-2">
        <dt class="text-[0.7rem] text-slate-400">ISP / Organization</dt>
        <dd class="mt-1 break-words font-medium text-slate-200">
          {{ props.asnOrg || props.isp || 'Unknown' }}
        </dd>
      </div>

      <div v-if="props.asnNumber" class="min-w-0 rounded-lg bg-slate-950/60 px-3 py-2">
        <dt class="text-[0.7rem] text-slate-400">ASN</dt>
        <dd class="mt-1 break-words font-medium tabular-nums text-slate-200">
          AS{{ props.asnNumber }}
        </dd>
      </div>

      <div
        v-if="props.clientRtt !== null || props.elapsedMs !== null"
        class="min-w-0 rounded-lg bg-slate-950/60 px-3 py-2"
      >
        <dt class="text-[0.7rem] text-slate-400">API Response Time</dt>
        <dd class="mt-1 break-words font-medium tabular-nums text-slate-200">
          {{ props.clientRtt ?? props.elapsedMs ?? 'Unknown'
          }}<span v-if="props.clientRtt != null || props.elapsedMs != null"> ms</span>
        </dd>
      </div>
    </dl>
  </div>
</template>
