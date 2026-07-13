<script setup lang="ts">
  import { useInspector } from '@/composables/useInspector'
  import DataCard from '@/components/ui/DataCard.vue'

  const { storage } = useInspector()

  async function recheck() {
    await storage.detectWebSocketConnectivity()
    storage.detectIPv6Connectivity()
  }
</script>

<template>
  <DataCard
    id="network-probes"
    title="Connectivity probes"
    description="Best-effort WebSocket and IPv6 reachability checks from this browser."
  >
    <div class="space-y-3 text-xs">
      <button
        type="button"
        class="inline-flex items-center rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-400 hover:bg-sky-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        @click="recheck"
      >
        Re-check
      </button>

      <dl class="grid gap-3 sm:grid-cols-2">
        <div class="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
          <dt class="font-medium text-slate-300">WebSocket</dt>
          <dd class="mt-1 space-y-1 text-slate-400">
            <p>
              Supported:
              <span class="text-slate-200">
                {{
                  storage.webSocketSupported.value == null
                    ? 'Unknown'
                    : storage.webSocketSupported.value
                      ? 'Yes'
                      : 'No'
                }}
              </span>
            </p>
            <p>
              Connect:
              <span class="text-slate-200">
                {{
                  storage.webSocketCanConnect.value == null
                    ? 'Not tested'
                    : storage.webSocketCanConnect.value
                      ? 'Yes'
                      : 'No'
                }}
              </span>
            </p>
            <p v-if="storage.webSocketLatency.value != null">
              Latency:
              <span class="text-slate-200">{{ storage.webSocketLatency.value }} ms</span>
            </p>
            <p v-if="storage.webSocketError.value" class="text-rose-400">
              {{ storage.webSocketError.value }}
            </p>
          </dd>
        </div>

        <div class="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
          <dt class="font-medium text-slate-300">IPv6 reachability</dt>
          <dd class="mt-1 space-y-1 text-slate-400">
            <p>
              Result:
              <span class="text-slate-200">
                {{
                  storage.ipv6CanConnect.value == null
                    ? 'Not tested'
                    : storage.ipv6CanConnect.value
                      ? 'Likely reachable'
                      : 'Likely unreachable'
                }}
              </span>
            </p>
            <p class="text-[0.7rem] text-slate-500">
              Uses a best-effort fetch to an IPv6-only host. Opaque cross-origin responses mean this
              is only a weak signal, not a guaranteed lab test.
            </p>
          </dd>
        </div>
      </dl>
    </div>
  </DataCard>
</template>
