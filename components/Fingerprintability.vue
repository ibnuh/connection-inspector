<script setup lang="ts">
  const props = defineProps<{
    fingerprintBand: 'Low' | 'Medium' | 'High' | 'Unknown'
    fingerprintScore: number | null
  }>()
</script>

<template>
  <div class="mt-2">
    <p class="mb-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
      Privacy resistance
    </p>
    <div class="flex items-center justify-between text-[0.7rem] text-slate-300">
      <span>
        Estimate:
        <span class="font-medium text-slate-100">
          {{ props.fingerprintBand }}
        </span>
      </span>
      <span v-if="props.fingerprintScore != null" class="tabular-nums text-slate-400">
        {{ props.fingerprintScore }} / 100
      </span>
    </div>
    <div class="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-800">
      <div
        v-if="props.fingerprintScore != null"
        class="h-full rounded-full transition-all"
        :class="[
          props.fingerprintBand === 'High' && 'bg-emerald-400',
          props.fingerprintBand === 'Medium' && 'bg-amber-400',
          props.fingerprintBand === 'Low' && 'bg-rose-400',
          props.fingerprintBand === 'Unknown' && 'bg-slate-500'
        ]"
        :style="{ width: `${props.fingerprintScore}%` }"
        role="progressbar"
        :aria-valuenow="props.fingerprintScore"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-label="`Privacy resistance ${props.fingerprintBand}`"
      />
    </div>
    <p class="mt-1 text-[0.65rem] text-slate-500">
      Higher means more resistance signals (canvas noise, blocked audio fingerprint APIs, fewer
      fonts, ad blocker bait, DNT, cookies off). Heuristic only; not a uniqueness proof.
    </p>
  </div>
</template>
