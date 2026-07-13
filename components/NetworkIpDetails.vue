<script setup lang="ts">
  import { useInspector } from '@/composables/useInspector'

  const { ip, storage } = useInspector()
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
      <div>
        <dt class="text-[0.7rem] text-slate-500">Connection type</dt>
        <dd class="mt-0.5 font-medium">{{ storage.connectionType.value ?? 'Unknown' }}</dd>
      </div>
      <div>
        <dt class="text-[0.7rem] text-slate-500">Downlink</dt>
        <dd class="mt-0.5 font-medium">
          <template v-if="storage.connectionDownlink.value != null">
            {{ storage.connectionDownlink.value }} Mbps
          </template>
          <template v-else>Unknown</template>
        </dd>
      </div>
      <div>
        <dt class="text-[0.7rem] text-slate-500">RTT</dt>
        <dd class="mt-0.5 font-medium">
          <template v-if="storage.connectionRtt.value != null">
            {{ storage.connectionRtt.value }} ms
          </template>
          <template v-else>Unknown</template>
        </dd>
      </div>
      <div>
        <dt class="text-[0.7rem] text-slate-500">Save-Data</dt>
        <dd class="mt-0.5 font-medium">
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
