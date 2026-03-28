<script setup lang="ts">
import { computed } from 'vue'

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

const locationDisplay = computed(() => {
  if (!props.ipInfo?.location) {
    return null
  }
  
  const { city, state, country, country_code } = props.ipInfo.location
  
  // Build location parts, filtering out empty/null values
  const parts: string[] = []
  if (city) parts.push(city)
  if (state) parts.push(state)
  if (country) parts.push(country)
  
  if (parts.length === 0) {
    return null
  }
  
  const locationString = parts.join(', ')
  const countryCode = country_code ? ` (${country_code})` : ''
  
  return locationString + countryCode
})
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
    <p v-if="locationDisplay" class="mt-1 text-xs text-slate-400">
      {{ locationDisplay }}
    </p>
    <p v-else class="mt-1 text-xs text-slate-500">
      Location details may be approximate.
    </p>
  </div>
</template>

