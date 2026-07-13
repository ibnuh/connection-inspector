<script setup lang="ts">
  import { computed } from 'vue'
  import { useInspector } from '@/composables/useInspector'
  import { formatConnectionTransport, formatEffectiveType } from '@/utils/connection'
  import { formatMbps, formatMs } from '@/utils/format'

  const { ip, storage } = useInspector()

  const transportLabel = computed(() =>
    formatConnectionTransport(storage.connectionTransport.value)
  )
  const effectiveLabel = computed(() => formatEffectiveType(storage.connectionEffectiveType.value))
  const downlinkLabel = computed(() => formatMbps(storage.connectionDownlink.value))
  const rttLabel = computed(() => formatMs(storage.connectionRtt.value))
</script>

<template>
  <div
    id="network-ip-details"
    class="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
  >
    <div class="flex items-center justify-between gap-2">
      <div>
        <h2 class="text-sm font-semibold text-slate-100">Network and IP details</h2>
        <p class="text-xs text-slate-400">Provider, ASN, risk flags, and reverse DNS.</p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1 text-[0.7rem] font-medium text-slate-200 hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        :disabled="ip.loadingIp.value"
        @click="ip.fetchIpInfo()"
      >
        <span
          class="h-1.5 w-1.5 rounded-full"
          :class="ip.loadingIp.value ? 'bg-sky-400' : 'bg-slate-500'"
        />
        Refresh
      </button>
    </div>

    <IpTypeInfo :ip-info="ip.ipInfo.value" />
    <ProviderAsnInfo :ip-info="ip.ipInfo.value" />
    <AbuseRiskInfo :ip-info="ip.ipInfo.value" />
    <AbuseContactLocation :ip-info="ip.ipInfo.value" />

    <div
      class="grid gap-2 rounded-xl border border-slate-800/80 bg-slate-950/50 p-3 text-xs text-slate-300 sm:grid-cols-2"
    >
      <div class="min-w-0">
        <dt class="text-[0.7rem] text-slate-500">Transport</dt>
        <dd class="mt-0.5 break-words font-medium">{{ transportLabel }}</dd>
      </div>
      <div class="min-w-0">
        <dt class="text-[0.7rem] text-slate-500">Effective speed class</dt>
        <dd class="mt-0.5 break-words font-medium">{{ effectiveLabel }}</dd>
      </div>
      <div class="min-w-0">
        <dt class="text-[0.7rem] text-slate-500">Downlink</dt>
        <dd class="mt-0.5 break-words font-medium tabular-nums">{{ downlinkLabel }}</dd>
      </div>
      <div class="min-w-0">
        <dt class="text-[0.7rem] text-slate-500">RTT</dt>
        <dd class="mt-0.5 break-words font-medium tabular-nums">{{ rttLabel }}</dd>
      </div>
      <div class="min-w-0">
        <dt class="text-[0.7rem] text-slate-500">Save-Data</dt>
        <dd class="mt-0.5 break-words font-medium">
          <template v-if="storage.connectionSaveData.value == null">Unknown</template>
          <template v-else>{{ storage.connectionSaveData.value ? 'On' : 'Off' }}</template>
        </dd>
      </div>
    </div>

    <ReverseDnsLookup
      :reverse-dns-loading="ip.reverseDnsLoading.value"
      :reverse-dns-error="ip.reverseDnsError.value"
      :reverse-dns-hostnames="ip.reverseDnsHostnames.value"
      :run-reverse-dns-lookup="ip.runReverseDnsLookup"
    />

    <RawIpPayload :ip-info="ip.ipInfo.value" />
  </div>
</template>
