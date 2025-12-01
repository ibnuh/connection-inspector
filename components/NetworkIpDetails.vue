<script setup lang="ts">
type AbuseContact = {
  name?: string
  address?: string
  email?: string
  phone?: string
}

type DatacenterInfo = {
  datacenter?: string
  network?: string
  country?: string
  region?: string
  city?: string
}

type CompanyInfo = {
  name?: string
  abuser_score?: unknown
  domain?: string
  type?: string
  network?: string
  whois?: string
}

type AsnInfo = {
  asn?: number
  abuser_score?: unknown
  route?: string
  descr?: string
  country?: string
  active?: boolean
  org?: string
  domain?: string
  abuse?: string
  type?: string
  created?: string
  updated?: string
  rir?: string
  whois?: string
}

type LocationInfo = {
  is_eu_member?: boolean
  calling_code?: string
  currency_code?: string
  continent?: string
  country?: string
  country_code?: string
  state?: string
  city?: string
  latitude?: number
  longitude?: number
  zip?: string
  timezone?: string
  local_time?: string
  local_time_unix?: number
  is_dst?: boolean
}

type IpApiResponse = {
  ip?: string
  rir?: string
  is_bogon?: boolean
  is_mobile?: boolean
  is_satellite?: boolean
  is_crawler?: boolean
  is_datacenter?: boolean
  is_tor?: boolean
  is_proxy?: boolean
  is_vpn?: boolean
  is_abuser?: boolean
  datacenter?: DatacenterInfo
  company?: CompanyInfo
  abuse?: AbuseContact
  asn?: AsnInfo
  location?: LocationInfo
  elapsed_ms?: number
  client_rtt_ms?: number
}

const props = defineProps<{
  loadingIp: boolean
  ipInfo: IpApiResponse | null
  connectionType: string | null
  connectionDownlink: number | null
  connectionRtt: number | null
  connectionSaveData: boolean | null
  reverseDnsLoading: boolean
  reverseDnsError: string | null
  reverseDnsHostnames: string[] | null
  fetchIpInfo: () => Promise<void> | void
  runReverseDnsLookup: () => Promise<void> | void
}>()

const showRawIpPayload = ref(false)
</script>

<template>
  <div class="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-soft">
    <div class="flex items-center justify-between gap-2">
      <div>
        <h2 class="text-sm font-semibold text-slate-100">
          Network & IP details
        </h2>
        <p class="text-xs text-slate-400">
          Enriched data from
          <a
            href="https://api.ipapi.is/"
            target="_blank"
            rel="noreferrer"
            class="font-medium text-sky-400 underline-offset-4 hover:underline"
          >
            ipapi.is
          </a>
        </p>
      </div>
      <button
        type="button"
        class="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[0.7rem] font-medium text-slate-200 hover:border-slate-500 hover:bg-slate-800 active:bg-slate-700"
        @click="props.fetchIpInfo"
      >
        <span v-if="props.loadingIp" class="mr-1.5 h-1.5 w-1.5 animate-ping rounded-full bg-sky-400" />
        Refresh
      </button>
    </div>

    <dl class="mt-2 space-y-2 text-xs">
      <div class="flex items-start justify-between gap-4 rounded-lg bg-slate-950/60 px-3 py-2">
        <div>
          <dt class="text-[0.7rem] font-medium text-slate-300">IP type</dt>
          <dd class="mt-0.5 text-[0.72rem] text-slate-400">
            <span v-if="props.ipInfo">
              <span v-if="props.ipInfo.is_datacenter">Datacenter / hosting</span>
              <span v-else-if="props.ipInfo.is_mobile">Mobile network</span>
              <span v-else>Residential or unknown</span>
              <span v-if="props.ipInfo.is_bogon"> • Bogon/invalid range</span>
            </span>
            <span v-else>
              Waiting for IP data&hellip;
            </span>
          </dd>
        </div>
        <div class="text-right text-[0.7rem] text-slate-400">
          <div>
            Proxy:
            <span :class="props.ipInfo?.is_proxy ? 'text-amber-300' : 'text-slate-300'">
              {{ props.ipInfo?.is_proxy ? 'Yes' : 'No' }}
            </span>
          </div>
          <div>
            VPN:
            <span :class="props.ipInfo?.is_vpn ? 'text-amber-300' : 'text-slate-300'">
              {{ props.ipInfo?.is_vpn ? 'Yes' : 'No' }}
            </span>
          </div>
          <div>
            Tor:
            <span :class="props.ipInfo?.is_tor ? 'text-amber-300' : 'text-slate-300'">
              {{ props.ipInfo?.is_tor ? 'Yes' : 'No' }}
            </span>
          </div>
        </div>
      </div>

      <div
        v-if="props.connectionType || props.connectionDownlink || props.connectionRtt || props.connectionSaveData !== null"
        class="flex flex-col gap-1 rounded-lg bg-slate-950/60 px-3 py-2"
      >
        <dt class="text-[0.7rem] font-medium text-slate-300">Browser connection</dt>
        <dd class="mt-0.5 text-[0.72rem] text-slate-400">
          <span v-if="props.connectionType">
            Effective type:
            <span class="font-medium text-slate-200">
              {{ props.connectionType }}
            </span>
          </span>
          <span v-else>
            Network Information API not reported by this browser.
          </span>
        </dd>
        <dd class="text-[0.7rem] text-slate-500">
          <span v-if="props.connectionDownlink != null">
            Downlink: {{ props.connectionDownlink }} Mbps
          </span>
          <span v-if="props.connectionRtt != null">
            • RTT: {{ props.connectionRtt }} ms
          </span>
          <span v-if="props.connectionSaveData != null" class="block">
            Data saver: {{ props.connectionSaveData ? 'Enabled' : 'Disabled' }}
          </span>
        </dd>
      </div>

      <div class="flex flex-col gap-2 rounded-lg bg-slate-950/60 px-3 py-2">
        <dt class="text-[0.7rem] font-medium text-slate-300">Abuse & risk</dt>
        <dd class="mt-0.5 text-[0.72rem] text-slate-400">
          <span v-if="props.ipInfo">
            <span v-if="props.ipInfo.is_abuser">
              Marked as abusive &mdash; this IP or network has elevated abuse reports.
            </span>
            <span v-else>
              Not flagged as abusive by ipapi.is, but other providers may still enforce their own checks.
            </span>
          </span>
          <span v-else>
            Waiting for IP data&hellip;
          </span>
        </dd>
        <dd v-if="props.ipInfo?.asn || props.ipInfo?.company" class="text-[0.7rem] text-slate-500">
          Abuse scores (ASN / company):
          <span class="font-medium text-slate-300">
            {{ props.ipInfo?.asn?.abuser_score ?? 'Unknown' }} /
            {{ props.ipInfo?.company?.abuser_score ?? 'Unknown' }}
          </span>
        </dd>
      </div>

      <div
        v-if="props.ipInfo?.datacenter || props.ipInfo?.company || props.ipInfo?.asn"
        class="flex flex-col gap-2 rounded-lg bg-slate-950/60 px-3 py-2"
      >
        <dt class="text-[0.7rem] font-medium text-slate-300">Provider, ASN & datacenter</dt>
        <dd v-if="props.ipInfo?.company" class="mt-0.5 text-[0.72rem] text-slate-400">
          {{ props.ipInfo.company.name || 'Unknown provider' }}
          <span v-if="props.ipInfo.company.type">
            ({{ props.ipInfo.company.type }})
          </span>
          <span v-if="props.ipInfo.company.domain" class="text-slate-500">
            • {{ props.ipInfo.company.domain }}
          </span>
        </dd>
        <dd v-if="props.ipInfo?.datacenter" class="text-[0.7rem] text-slate-500">
          Datacenter:
          <span class="font-medium text-slate-300">
            {{ props.ipInfo.datacenter.datacenter || 'Unknown' }}
          </span>
          <span v-if="props.ipInfo.datacenter.city">
            • {{ props.ipInfo.datacenter.city }}
          </span>
          <span v-if="props.ipInfo.datacenter.country">
            , {{ props.ipInfo.datacenter.country }}
          </span>
          <span v-if="props.ipInfo.datacenter.network">
            • {{ props.ipInfo.datacenter.network }}
          </span>
        </dd>
        <dd v-if="props.ipInfo?.asn" class="text-[0.7rem] text-slate-500">
          <span>
            ASN {{ props.ipInfo.asn.asn ?? 'unknown' }} •
          </span>
          <span v-if="props.ipInfo.asn.descr">
            {{ props.ipInfo.asn.descr }}
          </span>
          <span v-if="props.ipInfo.asn.route">
            • {{ props.ipInfo.asn.route }}
          </span>
        </dd>
      </div>

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

      <div class="flex flex-col gap-1 rounded-lg bg-slate-950/60 px-3 py-2">
        <div class="flex items-center justify-between gap-2">
          <dt class="text-[0.7rem] font-medium text-slate-300">Reverse DNS (PTR)</dt>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[0.7rem] font-medium text-slate-100 hover:border-slate-500 hover:bg-slate-800 active:bg-slate-700"
            :disabled="props.reverseDnsLoading"
            @click="props.runReverseDnsLookup"
          >
            <span
              v-if="props.reverseDnsLoading"
              class="h-1.5 w-1.5 animate-ping rounded-full bg-sky-400"
            />
            <span>{{ props.reverseDnsLoading ? 'Checking…' : 'Check DNS' }}</span>
          </button>
        </div>
        <dd class="mt-0.5 text-[0.72rem] text-slate-400">
          <span v-if="props.reverseDnsError">
            {{ props.reverseDnsError }}
          </span>
          <span v-else-if="props.reverseDnsHostnames && props.reverseDnsHostnames.length === 0">
            No reverse DNS records found for this IP.
          </span>
          <span v-else-if="props.reverseDnsHostnames && props.reverseDnsHostnames.length">
            Hostnames:
            <span class="font-medium text-slate-200">
              {{ props.reverseDnsHostnames.join(', ') }}
            </span>
          </span>
          <span v-else>
            Run a lookup to see PTR records (if any) for your current IP.
          </span>
        </dd>
      </div>

      <div
        v-if="props.ipInfo"
        class="flex flex-col gap-1 rounded-lg bg-slate-950/60 px-3 py-2"
      >
        <button
          type="button"
          class="inline-flex items-center justify-between gap-2 text-[0.7rem] font-medium text-slate-300"
          @click="showRawIpPayload = !showRawIpPayload"
        >
          <span class="flex items-center gap-1.5">
            <span class="h-1.5 w-1.5 rounded-full bg-slate-500" />
            Raw ipapi.is payload
          </span>
          <span class="text-slate-500">
            {{ showRawIpPayload ? 'Hide' : 'Show' }}
          </span>
        </button>
        <pre
          v-if="showRawIpPayload"
          class="mt-1 max-h-52 overflow-auto rounded-md bg-slate-950 p-2 text-[0.65rem] leading-snug text-slate-300"
        >
{{ JSON.stringify(props.ipInfo, null, 2) }}
        </pre>
      </div>
    </dl>
  </div>
</template>


