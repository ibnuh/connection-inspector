<script setup lang="ts">
  import { useInspector } from '@/composables/useInspector'
  import DataCard from '@/components/ui/DataCard.vue'

  const { webRTC, ip, detectDeferred } = useInspector()

  function runTest() {
    void webRTC.testWebRTCLeak(ip.ipInfo.value?.ip ?? null)
  }
</script>

<template>
  <DataCard
    id="webrtc-leak"
    title="WebRTC IP exposure"
    description="ICE candidates can reveal local network addresses and public IPs that differ from your egress IP."
    :loading="webRTC.loading.value"
  >
    <div class="space-y-3 text-xs">
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="inline-flex items-center rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-400 hover:bg-sky-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:opacity-50"
          :disabled="webRTC.loading.value"
          @click="runTest"
        >
          {{ webRTC.loading.value ? 'Gathering ICE…' : 'Run WebRTC check' }}
        </button>
        <button
          type="button"
          class="inline-flex items-center rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          @click="detectDeferred"
        >
          Re-run deferred probes
        </button>
      </div>

      <p
        v-if="webRTC.error.value"
        class="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-red-400"
        role="alert"
      >
        {{ webRTC.error.value }}
      </p>

      <dl class="grid gap-2 sm:grid-cols-2">
        <div>
          <dt class="text-[0.7rem] text-slate-500">Egress IP (browser)</dt>
          <dd class="mt-0.5 font-mono text-slate-200">
            {{ webRTC.leakInfo.value.egressIp || ip.ipInfo.value?.ip || 'Unknown' }}
          </dd>
        </div>
        <div>
          <dt class="text-[0.7rem] text-slate-500">Exposure summary</dt>
          <dd class="mt-0.5 font-medium">
            <span v-if="webRTC.leakInfo.value.hasLeak === true" class="text-amber-300">
              Exposure detected
            </span>
            <span v-else-if="webRTC.leakInfo.value.hasLeak === false" class="text-emerald-300">
              No local or mismatched public IPs
            </span>
            <span v-else class="text-slate-400">Not tested yet</span>
          </dd>
        </div>
        <div>
          <dt class="text-[0.7rem] text-slate-500">Local / LAN IPs</dt>
          <dd class="mt-0.5 break-all font-mono text-slate-200">
            {{
              webRTC.leakInfo.value.localIps.length
                ? webRTC.leakInfo.value.localIps.join(', ')
                : 'None found'
            }}
          </dd>
        </div>
        <div>
          <dt class="text-[0.7rem] text-slate-500">Public ICE IPs</dt>
          <dd class="mt-0.5 break-all font-mono text-slate-200">
            {{
              webRTC.leakInfo.value.publicIps.length
                ? webRTC.leakInfo.value.publicIps.join(', ')
                : 'None found'
            }}
          </dd>
        </div>
      </dl>

      <p class="text-[0.7rem] text-slate-500">
        Local network IPs count as exposure. Public ICE addresses that differ from your egress IP
        also count as a leak signal (for example when using a VPN that does not cover WebRTC).
      </p>
    </div>
  </DataCard>
</template>
