<script setup lang="ts">
  import type { IpApiResponse } from '@/types'

  const props = defineProps<{
    ipInfo: IpApiResponse | null
  }>()
</script>

<template>
  <div class="flex items-start justify-between gap-4 rounded-lg bg-slate-950/60 px-3 py-2">
    <div>
      <dt class="text-[0.7rem] font-medium text-slate-300">IP type</dt>
      <dd class="mt-0.5 text-[0.72rem] text-slate-400">
        <span v-if="props.ipInfo">
          <span v-if="props.ipInfo.is_datacenter">Datacenter / hosting</span>
          <span v-else-if="props.ipInfo.is_mobile">Mobile network</span>
          <span v-else>Residential or unknown</span>
          <span v-if="props.ipInfo.is_bogon"> • Bogon/invalid range</span>
        </span>
        <span v-else> Waiting for IP data&hellip; </span>
      </dd>
    </div>
    <div class="text-right text-[0.7rem] text-slate-400">
      <div>
        Proxy:
        <span :class="props.ipInfo?.is_proxy ? 'text-amber-300' : 'text-slate-300'">
          {{ props.ipInfo?.is_proxy ? 'Yes' : 'No' }}
        </span>
      </div>
      <div>
        VPN:
        <span :class="props.ipInfo?.is_vpn ? 'text-amber-300' : 'text-slate-300'">
          {{ props.ipInfo?.is_vpn ? 'Yes' : 'No' }}
        </span>
      </div>
      <div>
        Tor:
        <span :class="props.ipInfo?.is_tor ? 'text-amber-300' : 'text-slate-300'">
          {{ props.ipInfo?.is_tor ? 'Yes' : 'No' }}
        </span>
      </div>
    </div>
  </div>
</template>
