<script setup lang="ts">
type LocationInfo = {
  city?: string
  state?: string
  country?: string
  country_code?: string
}

type IpApiResponse = {
  ip?: string
  location?: LocationInfo
}

const props = defineProps<{
  loadingIp: boolean
  ipInfo: IpApiResponse | null
}>()
</script>

<template>
  <div>
    <p class="text-xs font-semibold text-slate-400">IP address</p>
    <p class="mt-1 text-xl font-semibold tabular-nums sm:text-2xl">
      <span v-if="props.loadingIp" class="inline-flex items-center gap-2 text-slate-400">
        <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-400" />
        Detecting&hellip;
      </span>
      <span v-else-if="props.ipInfo">
        {{ props.ipInfo.ip }}
      </span>
      <span v-else class="text-slate-500">
        Unknown
      </span>
    </p>
    <p v-if="props.ipInfo?.location" class="mt-1 text-xs text-slate-400">
      {{ props.ipInfo.location.city }},
      {{ props.ipInfo.location.state }},
      {{ props.ipInfo.location.country }}
      ({{ props.ipInfo.location.country_code }})
    </p>
    <p v-else class="mt-1 text-xs text-slate-500">
      Location details may be approximate.
    </p>
  </div>
</template>

