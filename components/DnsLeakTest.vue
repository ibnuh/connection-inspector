<script setup lang="ts">
import { ref, computed } from 'vue'

interface DnsServerInfo {
  ip_address: string
  hostname: string | null
  isp: string
  organization: string
  country: string
  country_code: string
  city: string
  dnssec: boolean
}

interface DnsQueryProgress {
  guid: string
  domain: string
  status: 'pending' | 'loading' | 'completed' | 'error'
  error?: string
}

interface DnsLeakResult {
  servers: DnsServerInfo[]
  uniqueServers: DnsServerInfo[]
  leakDetected: boolean
  resolverCount: number
}

const props = defineProps<{
  dnsLeakLoading: boolean
  dnsLeakError: string | null
  dnsLeakResult: DnsLeakResult | null
  dnsLeakProgress: DnsQueryProgress[]
  runDnsLeakTest: (count?: number) => Promise<void> | void
}>()

const testCount = ref(10)

const completedCount = computed(() => 
  props.dnsLeakProgress.filter(p => p.status === 'completed').length
)

const loadingCount = computed(() => 
  props.dnsLeakProgress.filter(p => p.status === 'loading').length
)
</script>

<template>
  <div class="flex flex-col gap-1 rounded-lg bg-slate-950/60 px-3 py-2">
    <div class="flex items-center justify-between gap-2">
      <div class="flex-1">
        <dt class="text-[0.7rem] font-medium text-slate-300">DNS Leak Test</dt>
        <dd v-if="props.dnsLeakLoading && props.dnsLeakProgress.length > 0" class="mt-0.5 text-[0.65rem] text-slate-500">
          Testing... {{ completedCount }}/{{ props.dnsLeakProgress.length }} queries completed
        </dd>
      </div>
      <div class="flex items-center gap-2">
        <input
          v-model.number="testCount"
          type="number"
          min="1"
          max="50"
          class="w-16 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[0.7rem] text-slate-200"
          :disabled="props.dnsLeakLoading"
        />
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[0.7rem] font-medium text-slate-100 hover:border-slate-500 hover:bg-slate-800 active:bg-slate-700 disabled:opacity-50"
          :disabled="props.dnsLeakLoading"
          @click="() => props.runDnsLeakTest(testCount)"
        >
          <span
            v-if="props.dnsLeakLoading"
            class="h-1.5 w-1.5 animate-ping rounded-full bg-sky-400"
          />
          <span>{{ props.dnsLeakLoading ? 'Testing…' : 'Test' }}</span>
        </button>
      </div>
    </div>

    <!-- Error state -->
    <dd v-if="props.dnsLeakError" class="mt-1 text-[0.72rem] text-red-400">
      {{ props.dnsLeakError }}
    </dd>

    <!-- Progress Display -->
    <dd v-if="props.dnsLeakLoading && props.dnsLeakProgress.length > 0" class="mt-1 flex flex-col gap-2 text-[0.72rem]">
      <div class="flex flex-col gap-1">
        <div class="flex items-center justify-between">
          <span class="font-medium text-slate-300">Progress:</span>
          <span class="text-slate-400">{{ completedCount }}/{{ props.dnsLeakProgress.length }}</span>
        </div>
        <div class="flex flex-wrap gap-1">
          <span
            v-for="(query, idx) in props.dnsLeakProgress"
            :key="idx"
            :class="[
              'h-2 w-2 rounded-full',
              query.status === 'completed' ? 'bg-emerald-400' :
              query.status === 'loading' ? 'bg-sky-400 animate-pulse' :
              query.status === 'error' ? 'bg-red-400' :
              'bg-slate-600'
            ]"
            :title="query.domain"
          />
        </div>
      </div>
    </dd>

    <!-- Results -->
    <dd v-else-if="props.dnsLeakResult" class="mt-1 flex flex-col gap-2 text-[0.72rem]">
      <!-- DNS Servers -->
      <div v-if="props.dnsLeakResult.uniqueServers.length > 0" class="flex flex-col gap-1.5">
        <span class="font-medium text-slate-300">
          DNS Servers Detected ({{ props.dnsLeakResult.resolverCount }}):
        </span>
        <div class="flex flex-col gap-1.5">
          <div
            v-for="(server, idx) in props.dnsLeakResult.uniqueServers"
            :key="idx"
            class="flex flex-col gap-0.5 rounded border border-slate-700 bg-slate-900 px-2 py-1.5"
          >
            <div class="flex items-center gap-2">
              <span class="font-mono text-[0.68rem] font-medium text-slate-200">{{ server.ip_address }}</span>
              <span v-if="server.hostname && server.hostname !== 'None'" class="text-[0.65rem] text-slate-400">({{ server.hostname }})</span>
              <span v-if="server.dnssec" class="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[0.6rem] bg-emerald-900/30 text-emerald-400 border border-emerald-800">
                <span class="h-1 w-1 rounded-full bg-emerald-400" />
                DNSSEC
              </span>
            </div>
            <div v-if="server.organization || server.isp || server.country" class="flex flex-wrap items-center gap-1.5 text-[0.65rem] text-slate-400">
              <span v-if="server.organization">{{ server.organization }}</span>
              <span v-if="server.isp && server.isp !== server.organization">{{ server.isp }}</span>
              <span v-if="server.country || server.city">
                {{ [server.city, server.country].filter(Boolean).join(', ') }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Leak Detection Status -->
      <div class="flex items-center gap-2">
        <span class="font-medium text-slate-300">Status:</span>
        <span
          :class="[
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.68rem] font-medium',
            props.dnsLeakResult.leakDetected
              ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-800'
              : 'bg-emerald-900/30 text-emerald-400 border border-emerald-800'
          ]"
        >
          <span
            :class="[
              'h-1.5 w-1.5 rounded-full',
              props.dnsLeakResult.leakDetected ? 'bg-yellow-400' : 'bg-emerald-400'
            ]"
          />
          {{
            props.dnsLeakResult.leakDetected
              ? 'Multiple DNS servers detected'
              : 'Single DNS server (no leak detected)'
          }}
        </span>
      </div>

      <!-- All Query Results (collapsible) -->
      <details v-if="props.dnsLeakResult.servers.length > 0" class="mt-1">
        <summary class="cursor-pointer text-slate-400 hover:text-slate-300">
          View {{ props.dnsLeakResult.servers.length }} query results
        </summary>
        <div class="mt-2 max-h-40 space-y-1 overflow-y-auto rounded border border-slate-800 bg-slate-900/50 p-2">
          <div
            v-for="(server, idx) in props.dnsLeakResult.servers"
            :key="idx"
            class="flex items-center justify-between gap-2 text-[0.65rem]"
          >
            <span class="font-mono text-slate-200">{{ server.ip_address }}</span>
            <span v-if="server.organization" class="text-slate-400">{{ server.organization }}</span>
            <span v-if="server.country" class="text-slate-500">{{ server.country }}</span>
          </div>
        </div>
      </details>
    </dd>

    <!-- Initial state -->
    <dd v-else class="mt-0.5 text-[0.72rem] text-slate-400">
      Run a test to check for DNS leaks and see which DNS servers are being used.
    </dd>
  </div>
</template>

