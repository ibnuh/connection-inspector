<script setup lang="ts">
  import type { IpApiResponse } from '@/types'

  const props = defineProps<{
    ipInfo: IpApiResponse | null
  }>()

  function formatAbuserScore(score: unknown): string {
    if (score == null) return 'Unknown'
    if (typeof score === 'number') return score.toString()
    if (typeof score === 'string') return score
    try {
      return JSON.stringify(score)
    } catch {
      return 'Unknown'
    }
  }
</script>

<template>
  <div class="flex flex-col gap-2 rounded-lg bg-slate-950/60 px-3 py-2">
    <dt class="text-[0.7rem] font-medium text-slate-300">Abuse & risk</dt>
    <dd class="mt-0.5 text-[0.72rem] text-slate-400">
      <span v-if="props.ipInfo">
        <span v-if="props.ipInfo.is_abuser">
          Marked as abusive &mdash; this IP or network has elevated abuse reports.
        </span>
        <span v-else>
          Not flagged as abusive, but other providers may still enforce their own checks.
        </span>
      </span>
      <span v-else> Waiting for IP data&hellip; </span>
    </dd>
    <dd
      v-if="props.ipInfo?.asn?.abuser_score != null || props.ipInfo?.company?.abuser_score != null"
      class="text-[0.7rem] text-slate-500"
    >
      Abuse scores (ASN / company):
      <span class="font-medium text-slate-300">
        {{ formatAbuserScore(props.ipInfo?.asn?.abuser_score) }} /
        {{ formatAbuserScore(props.ipInfo?.company?.abuser_score) }}
      </span>
    </dd>
    <dd v-else-if="props.ipInfo?.risk_score != null" class="text-[0.7rem] text-slate-500">
      Provider risk score (ipquery.io):
      <span class="font-medium text-slate-300"> {{ props.ipInfo.risk_score }} / 100 </span>
    </dd>
  </div>
</template>
