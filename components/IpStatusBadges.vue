<script setup lang="ts">
  import type { IpApiResponse } from '@/types'

  const props = defineProps<{
    ipInfo: IpApiResponse | null
    ipStatusLabel: string
    ipStatusTone: 'success' | 'warning' | 'danger' | 'neutral'
    isHttps: boolean
  }>()
</script>

<template>
  <div class="mt-2 flex flex-wrap gap-2">
    <span
      class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.7rem] font-medium"
      :class="[
        props.ipStatusTone === 'success' &&
          'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
        props.ipStatusTone === 'warning' && 'border-amber-500/40 bg-amber-500/10 text-amber-300',
        props.ipStatusTone === 'danger' && 'border-rose-500/40 bg-rose-500/10 text-rose-300',
        props.ipStatusTone === 'neutral' && 'border-slate-700 bg-slate-800 text-slate-300'
      ]"
    >
      <span
        class="h-1.5 w-1.5 rounded-full"
        :class="[
          props.ipStatusTone === 'success' && 'bg-emerald-400',
          props.ipStatusTone === 'warning' && 'bg-amber-400',
          props.ipStatusTone === 'danger' && 'bg-rose-400',
          props.ipStatusTone === 'neutral' && 'bg-slate-500'
        ]"
      />
      <span>{{ props.ipStatusLabel }}</span>
    </span>
    <span
      v-if="props.ipInfo?.is_datacenter"
      class="inline-flex items-center rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-[0.7rem] font-medium text-sky-300"
    >
      Datacenter IP
    </span>
    <span
      v-if="props.ipInfo?.is_mobile"
      class="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[0.7rem] font-medium text-emerald-300"
    >
      Mobile network
    </span>
    <span
      v-if="!props.isHttps"
      class="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[0.7rem] font-medium text-amber-300"
    >
      Not using HTTPS
    </span>
  </div>
</template>
