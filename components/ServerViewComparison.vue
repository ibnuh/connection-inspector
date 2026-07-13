<script setup lang="ts">
  import type { IpApiResponse, ServerViewData } from '@/types'

  const props = defineProps<{
    serverViewLoading: boolean
    serverViewError: string | null
    serverViewData: ServerViewData | null
    ipInfo: IpApiResponse | null
    userAgent: string | null
    isHttps: boolean
    runServerViewCheck: () => Promise<void> | void
  }>()
</script>

<template>
  <div class="border-t border-slate-800 pt-2">
    <p class="mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
      Browser vs server view
    </p>
    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="text-[0.7rem] text-slate-400">
        Check what the server sees for your IP and user agent, and compare with the browser.
      </p>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[0.7rem] font-medium text-slate-100 hover:border-slate-500 hover:bg-slate-800 active:bg-slate-700"
        :disabled="props.serverViewLoading"
        @click="props.runServerViewCheck"
      >
        <span
          v-if="props.serverViewLoading"
          class="h-1.5 w-1.5 animate-ping rounded-full bg-sky-400"
        />
        <span>{{ props.serverViewLoading ? 'Checking…' : 'Run check' }}</span>
      </button>
    </div>
    <p v-if="props.serverViewError" class="mt-1 text-[0.7rem] text-rose-400">
      {{ props.serverViewError }}
    </p>
    <div v-if="props.serverViewData" class="mt-1 space-y-0.5 text-[0.7rem]">
      <p class="text-slate-300">
        Server IP:
        <span class="font-medium">
          {{ props.serverViewData.ip || 'Unknown' }}
        </span>
        <span v-if="props.ipInfo?.ip">
          &mdash; browser IP:
          <span class="font-medium">
            {{ props.ipInfo.ip }}
          </span>
          <span
            v-if="
              props.serverViewData.ip &&
              props.ipInfo.ip &&
              props.serverViewData.ip === props.ipInfo.ip
            "
            class="ml-1 text-emerald-400"
          >
            (match)
          </span>
          <span v-else-if="props.serverViewData.ip && props.ipInfo.ip" class="ml-1 text-amber-300">
            (mismatch &mdash; proxy or VPN likely)
          </span>
        </span>
      </p>
      <p class="text-slate-400">
        HTTP:
        <span class="font-medium text-slate-200">
          {{ props.serverViewData.httpVersion || 'Unknown' }}
        </span>
        • HTTPS:
        <span class="font-medium text-slate-200">
          {{ props.isHttps ? 'yes' : 'no or unknown' }}
        </span>
      </p>
      <p class="text-slate-400">
        User-Agent header:
        <span class="font-medium text-slate-200">
          {{ props.serverViewData.headers?.['user-agent'] || 'Unknown' }}
        </span>
      </p>
      <p
        v-if="props.userAgent && props.serverViewData.headers?.['user-agent']"
        class="text-[0.65rem]"
        :class="
          props.serverViewData.headers['user-agent'] === props.userAgent
            ? 'text-emerald-400'
            : 'text-amber-300'
        "
      >
        {{
          props.serverViewData.headers['user-agent'] === props.userAgent
            ? 'Server UA matches navigator.userAgent.'
            : 'Server UA differs from navigator.userAgent (proxy, sanitizer or middleware may be rewriting headers).'
        }}
      </p>
    </div>
  </div>
</template>
