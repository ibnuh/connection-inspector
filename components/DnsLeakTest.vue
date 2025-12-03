<script setup lang="ts">
import { ref } from 'vue'

interface DnsQueryResult {
  domain: string
  ip: string | null
  error?: string
}

interface DnsLeakResult {
  ok: boolean
  queries: DnsQueryResult[]
  systemDnsServers: string[]
  leakDetected: boolean
  resolverCount: number
  note?: string
  error?: string
}

const props = defineProps<{
  dnsLeakLoading: boolean
  dnsLeakError: string | null
  dnsLeakResult: DnsLeakResult | null
  runDnsLeakTest: (count?: number) => Promise<void> | void
}>()

const testCount = ref(10)
</script>

<template>
  <div class="flex flex-col gap-1 rounded-lg bg-slate-950/60 px-3 py-2">
    <div class="flex items-center justify-between gap-2">
      <div class="flex-1">
        <dt class="text-[0.7rem] font-medium text-slate-300">DNS Leak Test</dt>
        <dd v-if="props.dnsLeakResult?.note" class="mt-0.5 text-[0.65rem] text-slate-500">
          {{ props.dnsLeakResult.note }}
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

    <!-- Results -->
    <dd v-else-if="props.dnsLeakResult" class="mt-1 flex flex-col gap-2 text-[0.72rem]">
      <!-- DNS Servers -->
      <div v-if="props.dnsLeakResult.systemDnsServers.length > 0" class="flex flex-col gap-1">
        <span class="font-medium text-slate-300">
          DNS Servers ({{ props.dnsLeakResult.resolverCount }}):
        </span>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="(server, idx) in props.dnsLeakResult.systemDnsServers"
            :key="idx"
            class="inline-flex items-center rounded border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[0.68rem] text-slate-200"
          >
            {{ server }}
          </span>
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

      <!-- Query Results (collapsible) -->
      <details v-if="props.dnsLeakResult.queries.length > 0" class="mt-1">
        <summary class="cursor-pointer text-slate-400 hover:text-slate-300">
          View {{ props.dnsLeakResult.queries.length }} test queries
        </summary>
        <div class="mt-2 max-h-40 space-y-1 overflow-y-auto rounded border border-slate-800 bg-slate-900/50 p-2">
          <div
            v-for="(query, idx) in props.dnsLeakResult.queries"
            :key="idx"
            class="flex items-center justify-between gap-2 text-[0.65rem]"
          >
            <span class="font-mono text-slate-400">{{ query.domain }}</span>
            <span
              v-if="query.ip"
              class="font-mono text-slate-200"
            >
              → {{ query.ip }}
            </span>
            <span
              v-else-if="query.error"
              class="text-red-400"
            >
              {{ query.error }}
            </span>
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

