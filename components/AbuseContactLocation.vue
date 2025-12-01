<script setup lang="ts">
type AbuseContact = {
  name?: string
  address?: string
  email?: string
  phone?: string
}

type LocationInfo = {
  city?: string
  state?: string
  country?: string
  zip?: string
  timezone?: string
  latitude?: number
  longitude?: number
}

type IpApiResponse = {
  abuse?: AbuseContact
  location?: LocationInfo
  elapsed_ms?: number
  client_rtt_ms?: number
}

const props = defineProps<{
  ipInfo: IpApiResponse | null
}>()
</script>

<template>
  <div
    v-if="props.ipInfo?.abuse || props.ipInfo?.location"
    class="flex flex-col gap-2 rounded-lg bg-slate-950/60 px-3 py-2"
  >
    <dt class="text-[0.7rem] font-medium text-slate-300">Abuse contact & location</dt>
    <dd v-if="props.ipInfo?.abuse" class="mt-0.5 text-[0.72rem] text-slate-400">
      <span class="font-medium">
        {{ props.ipInfo.abuse.name || 'Abuse contact' }}
      </span>
      <span v-if="props.ipInfo.abuse.email">
        • {{ props.ipInfo.abuse.email }}
      </span>
      <span v-if="props.ipInfo.abuse.phone">
        • {{ props.ipInfo.abuse.phone }}
      </span>
      <span v-if="props.ipInfo.abuse.address" class="block text-slate-500">
        {{ props.ipInfo.abuse.address }}
      </span>
    </dd>
    <dd v-if="props.ipInfo?.location" class="space-y-0.5 text-[0.7rem] text-slate-500">
      <p>
        {{ props.ipInfo.location.city || 'Unknown city' }},
        {{ props.ipInfo.location.state || 'Unknown region' }},
        {{ props.ipInfo.location.country || 'Unknown country' }}
        <span v-if="props.ipInfo.location.zip">
          • {{ props.ipInfo.location.zip }}
        </span>
      </p>
      <p v-if="props.ipInfo.location.timezone">
        Timezone: {{ props.ipInfo.location.timezone }}
      </p>
      <p
        v-if="props.ipInfo.location.latitude != null && props.ipInfo.location.longitude != null"
        class="flex flex-wrap items-center gap-1.5"
      >
        <span class="text-slate-400">
          Lat/Lng:
          <span class="font-medium text-slate-200">
            {{ props.ipInfo.location.latitude.toFixed(4) }},
            {{ props.ipInfo.location.longitude.toFixed(4) }}
          </span>
        </span>
        <span class="hidden text-slate-600 sm:inline">•</span>
        <a
          class="inline-flex items-center gap-1 text-sky-400 underline-offset-4 hover:underline"
          :href="`https://www.openstreetmap.org/?mlat=${props.ipInfo.location.latitude}&mlon=${props.ipInfo.location.longitude}&zoom=10`"
          target="_blank"
          rel="noreferrer"
        >
          OpenStreetMap
        </a>
        <span class="text-slate-600">/</span>
        <a
          class="inline-flex items-center gap-1 text-sky-400 underline-offset-4 hover:underline"
          :href="`https://www.google.com/maps/@${props.ipInfo.location.latitude},${props.ipInfo.location.longitude},10z`"
          target="_blank"
          rel="noreferrer"
        >
          Google Maps
        </a>
      </p>
    </dd>
    <dd v-if="props.ipInfo?.elapsed_ms != null" class="text-[0.7rem] text-slate-500">
      Lookup latency:
      <span class="font-medium text-slate-300">
        {{ props.ipInfo.elapsed_ms }} ms
      </span>
      <span v-if="props.ipInfo.client_rtt_ms != null">
        • client RTT:
        <span class="font-medium text-slate-300">
          {{ props.ipInfo.client_rtt_ms }} ms
        </span>
      </span>
    </dd>
  </div>
</template>

