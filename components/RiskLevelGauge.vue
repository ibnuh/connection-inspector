<script setup lang="ts">
const props = defineProps<{
  ipRiskScore: number | null
  ipRiskBand: 'Low' | 'Medium' | 'High' | 'Unknown'
}>()
</script>

<template>
  <div class="mt-3 space-y-1.5 rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
    <div class="flex items-center justify-between text-xs text-slate-300">
      <span class="font-medium">
        Risk level
        <span v-if="props.ipRiskBand !== 'Unknown'">
          ({{ props.ipRiskBand }})
        </span>
      </span>
      <span v-if="props.ipRiskScore != null" class="tabular-nums text-slate-400">
        {{ props.ipRiskScore }} / 100
      </span>
      <span v-else class="text-slate-500">
        Not yet available
      </span>
    </div>
    <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
      <div
        v-if="props.ipRiskScore != null"
        class="h-full rounded-full transition-all"
        :class="[
          props.ipRiskBand === 'Low' && 'bg-emerald-400',
          props.ipRiskBand === 'Medium' && 'bg-amber-400',
          props.ipRiskBand === 'High' && 'bg-rose-400',
          props.ipRiskBand === 'Unknown' && 'bg-slate-500'
        ]"
        :style="{ width: `${props.ipRiskScore}%` }"
      />
    </div>
    <p class="text-[0.7rem] text-slate-500">
      Calculated from Tor / proxy / VPN flags, datacenter status, bogon range, and abuse scores from
      ipapi.is.
    </p>
  </div>
</template>

