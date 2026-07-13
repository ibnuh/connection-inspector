<script setup lang="ts">
  import { useDnsLeakTest } from '@/composables/useDnsLeakTest'
  import DataCard from '@/components/ui/DataCard.vue'

  const props = defineProps<{
    class?: string
  }>()

  const { loading, error, servers, runDnsLeakTest, clearResults } = useDnsLeakTest()
</script>

<template>
  <DataCard
    :class="props.class"
    title="DNS resolvers (assisted)"
    description="Server-assisted listing of resolver metadata. This is not a full multi-hop DNS leak lab test; treat results as informational."
  >
    <div class="space-y-4">
      <div class="flex gap-2">
        <button
          type="button"
          class="inline-flex items-center rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-400 hover:bg-sky-500/20 active:bg-sky-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:opacity-50"
          :disabled="loading"
          @click="runDnsLeakTest"
        >
          <span
            v-if="loading"
            class="mr-1.5 h-1.5 w-1.5 animate-ping rounded-full bg-sky-400 motion-reduce:animate-none"
          />
          {{ loading ? 'Looking up…' : 'Run resolver check' }}
        </button>
        <button
          v-if="servers.length > 0"
          type="button"
          class="inline-flex items-center rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          @click="clearResults"
        >
          Clear
        </button>
      </div>

      <div
        v-if="error"
        class="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400"
        role="alert"
      >
        {{ error }}
      </div>

      <div v-if="servers.length > 0" class="space-y-2">
        <p class="text-xs text-slate-400">Resolver metadata for {{ servers.length }} server(s):</p>
        <div class="space-y-2">
          <div
            v-for="(server, index) in servers"
            :key="server.ip_address + index"
            class="rounded-lg border border-slate-800 bg-slate-900/80 p-3"
          >
            <div class="grid gap-1 text-xs">
              <div class="flex justify-between gap-2">
                <span class="text-slate-500">IP Address</span>
                <span class="font-mono text-slate-300">{{ server.ip_address }}</span>
              </div>
              <div v-if="server.hostname" class="flex justify-between gap-2">
                <span class="text-slate-500">Hostname</span>
                <span class="text-slate-300">{{ server.hostname }}</span>
              </div>
              <div class="flex justify-between gap-2">
                <span class="text-slate-500">ISP</span>
                <span class="text-slate-300">{{ server.isp }}</span>
              </div>
              <div class="flex justify-between gap-2">
                <span class="text-slate-500">Country</span>
                <span class="text-slate-300">{{ server.country }} ({{ server.country_code }})</span>
              </div>
              <div class="flex justify-between gap-2">
                <span class="text-slate-500">City</span>
                <span class="text-slate-300">{{ server.city }}</span>
              </div>
              <div class="flex justify-between gap-2">
                <span class="text-slate-500">DNSSEC</span>
                <span :class="server.dnssec ? 'text-emerald-400' : 'text-yellow-400'">
                  {{ server.dnssec ? 'Enabled' : 'Disabled' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else-if="!loading && !error"
        class="rounded-lg border border-slate-800 bg-slate-900/40 p-3"
      >
        <p class="text-center text-xs text-slate-500">
          Click “Run resolver check” to fetch assisted DNS resolver metadata.
        </p>
      </div>
    </div>
  </DataCard>
</template>
